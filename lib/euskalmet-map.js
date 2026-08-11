const crypto = require('node:crypto');
const { PNG } = require('pngjs');

const BASE_URL = 'https://www.euskalmet.euskadi.eus/vamet';
const FETCH_TIMEOUT = 4500;
const BATCH_SIZE = 6;
const PRODUCTS = {
  radar: {
    path: 'radar_reflectivity/max_reflect',
    label: 'Radar de Kapildui · máxima reflectividad'
  },
  lightning: {
    path: 'radar_ray/lightning',
    label: 'Rayos observados · Euskalmet'
  }
};

// Imagen oficial que Euskalmet devuelve cuando una ranura no contiene datos.
// Se omite para poder ofrecer exclusivamente el último fotograma oficial útil.
const NO_DATA_SHA256 = '5785b34e3d7f8d761fc8ceb34ce9dc1b23025c369ac585df167087f736d7cc19';
const LAST_GOOD_TTL = 3 * 60 * 60 * 1000;
const LAST_GOOD = globalThis.__METEO_AITOR_EUSKALMET_LAST_GOOD__ || new Map();
globalThis.__METEO_AITOR_EUSKALMET_LAST_GOOD__ = LAST_GOOD;

// El radar oficial contiene un disco útil dentro de una lámina de 930 px.
// Algunas ranuras recientes publican una lámina casi vacía con barras de
// color fuera del disco: es técnicamente una imagen, pero no un fotograma de
// radar utilizable. Se valida el contenido, no solo el tamaño o el MIME.
function radarFrameUseful(bytes) {
  let image;
  try {
    image = PNG.sync.read(bytes, { checkCRC: true });
  } catch (_) {
    return false;
  }
  if (image.width !== 930 || image.height !== 930 || !image.data?.length) return false;
  let inside = 0;
  let outside = 0;
  const centerX = 400;
  const centerY = 530;
  const radiusSquared = 390 * 390;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const offset = (y * image.width + x) * 4;
      const red = image.data[offset];
      const green = image.data[offset + 1];
      const blue = image.data[offset + 2];
      const alpha = image.data[offset + 3];
      if (alpha < 240 || Math.max(red, green, blue) - Math.min(red, green, blue) < 40) continue;
      if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radiusSquared) inside += 1;
      else outside += 1;
    }
  }
  return inside >= 2000 && inside * 5 >= outside;
}

function frameName(date) {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `webmet00-${hours}${minutes}.png`;
}

async function fetchFrame(product, date) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  const filename = frameName(date);
  try {
    const response = await fetch(`${BASE_URL}/${product.path}/${filename}`, {
      signal: controller.signal,
      headers: {
        Accept: 'image/png,image/*;q=0.8',
        'User-Agent': 'MeteoAitorBermeo/10.93 (+https://meteoaitorbermeo.vercel.app)'
      }
    });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 5000 || !String(response.headers.get('content-type') || '').toLowerCase().includes('image')) return null;
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    if (digest === NO_DATA_SHA256) return null;
    if (product.path.includes('radar_reflectivity') && !radarFrameUseful(bytes)) return null;
    return { bytes, filename, observedAt: date.toISOString() };
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const productKey = String(req.query?.product || 'radar').trim().toLowerCase();
  const product = PRODUCTS[productKey];
  if (!product) return res.status(400).json({ ok: false, error: 'Producto Euskalmet no válido.' });

  // Euskalmet publica por ranuras UTC de diez minutos. Se resta una ranura
  // para no pedir un archivo que todavía se esté generando y se conservan
  // como máximo tres horas de antigüedad.
  const rounded = Math.floor(Date.now() / 600000) * 600000 - 600000;
  const candidates = Array.from({ length: 18 }, (_, index) => new Date(rounded - index * 600000));
  let frame = null;
  // Se consulta por bloques para encontrar pronto el último producto sin
  // superar el tiempo máximo de la función si el servidor oficial está lento.
  for (let index = 0; index < candidates.length && !frame; index += BATCH_SIZE) {
    const batch = await Promise.all(candidates.slice(index, index + BATCH_SIZE).map(date => fetchFrame(product, date)));
    frame = batch.find(Boolean) || null;
  }

  if (!frame) {
    const previous = LAST_GOOD.get(productKey);
    if (previous && Date.now() - previous.savedAt <= LAST_GOOD_TTL) {
      frame = { ...previous.frame, stale: true };
    }
  } else {
    LAST_GOOD.set(productKey, { savedAt: Date.now(), frame });
  }

  if (!frame) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      ok: false,
      source: 'Euskalmet',
      product: product.label,
      error: 'Euskalmet no publicó un fotograma utilizable durante las tres últimas horas.'
    });
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('X-Meteo-Aitor-Source', 'Euskalmet');
  res.setHeader('X-Meteo-Aitor-Product', productKey);
  res.setHeader('X-Meteo-Aitor-Frame', frame.filename);
  res.setHeader('X-Meteo-Aitor-Time', frame.observedAt);
  if (frame.stale) res.setHeader('X-Meteo-Aitor-Stale', '1');
  return res.status(200).send(frame.bytes);
};
