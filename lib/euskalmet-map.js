const crypto = require('node:crypto');

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
  return res.status(200).send(frame.bytes);
};
