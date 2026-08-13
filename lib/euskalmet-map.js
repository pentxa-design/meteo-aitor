const crypto = require('node:crypto');
const https = require('node:https');
const { PNG } = require('pngjs');

const BASE_URL = 'https://www.euskalmet.euskadi.eus/vamet';
const OFFICIAL_HOST = 'www.euskalmet.euskadi.eus';
const FETCH_TIMEOUT = 4000;
const DIRECTORY_TIMEOUT = 17000;
const BATCH_SIZE = 3;
const OFFICIAL_AGENT = new https.Agent({ keepAlive: true, maxSockets: BATCH_SIZE, rejectUnauthorized: false });
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
const LAST_GOOD_TTL = 12 * 60 * 60 * 1000;
const LAST_GOOD = globalThis.__METEO_AITOR_EUSKALMET_LAST_GOOD__ || new Map();
globalThis.__METEO_AITOR_EUSKALMET_LAST_GOOD__ = LAST_GOOD;
const DIRECTORY_TTL = 5 * 60 * 1000;
const DIRECTORY_CACHE = globalThis.__METEO_AITOR_EUSKALMET_DIRECTORY__ || new Map();
globalThis.__METEO_AITOR_EUSKALMET_DIRECTORY__ = DIRECTORY_CACHE;

// Euskalmet presenta actualmente una cadena TLS que Node rechaza por incluir
// un certificado autofirmado. La excepción queda encerrada a este único host,
// sin redirecciones, con límites de tiempo/tamaño; después cada radar se valida
// por hash y estructura PNG antes de entregarlo al navegador.
function fetchOfficial(path, { accept, timeout, maxBytes }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      callback(value);
    };
    const request = https.get({
      protocol: 'https:',
      hostname: OFFICIAL_HOST,
      port: 443,
      path: `/vamet/${path}`,
      method: 'GET',
      rejectUnauthorized: false,
      servername: OFFICIAL_HOST,
      agent: OFFICIAL_AGENT,
      headers: {
        Accept: accept,
        'User-Agent': 'MeteoAitorBermeo/10.121 (+https://meteoaitorbermeo.vercel.app)'
      }
    }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        return finish(reject, new Error(`Euskalmet HTTP ${response.statusCode || 0}`));
      }
      const chunks = [];
      let length = 0;
      response.on('data', chunk => {
        length += chunk.length;
        if (length > maxBytes) {
          response.destroy(new Error('Respuesta Euskalmet demasiado grande.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => finish(resolve, {
        bytes: Buffer.concat(chunks),
        contentType: String(response.headers['content-type'] || '')
      }));
      response.on('error', error => finish(reject, error));
    });
    // setTimeout() solo mide inactividad una vez conectado. Este límite duro
    // también cubre DNS/TLS y evita que la función de Vercel supere 30 s.
    const deadline = setTimeout(() => request.destroy(new Error('Tiempo de espera Euskalmet agotado.')), timeout);
    request.on('error', error => finish(reject, error));
  });
}

// El marcador oficial de "sin datos" ya se descarta mediante su hash exacto.
// Una imagen de radar válida puede estar seca y no contener píxeles de lluvia;
// por eso no se rechaza por falta de colores, solo si el PNG es inválido o no
// tiene las dimensiones del producto oficial.
function radarFrameUseful(bytes) {
  let image;
  try {
    image = PNG.sync.read(bytes, { checkCRC: true });
  } catch (_) {
    return false;
  }
  return image.width === 930 && image.height === 930 && image.data?.length === 930 * 930 * 4;
}

function frameName(date) {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `webmet00-${hours}${minutes}.png`;
}

function directorySizeBytes(value, unit) {
  const multiplier = String(unit).toUpperCase() === 'G' ? 1024 ** 3 : String(unit).toUpperCase() === 'M' ? 1024 ** 2 : 1024;
  return Math.round(Number(value) * multiplier);
}

async function fetchDirectoryRows(product) {
  const cacheKey = product.path;
  const cached = DIRECTORY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < DIRECTORY_TTL) return cached.rows;
  try {
    const response = await fetchOfficial(`${product.path}/`, { accept: 'text/html', timeout: DIRECTORY_TIMEOUT, maxBytes: 512 * 1024 });
    const html = response.bytes.toString('latin1');
    const rows = [];
    const pattern = /href="webmet00-(\d{4})\.png"[^\r\n]*?\s(\d+(?:\.\d+)?)([KMG])\s*$/gim;
    let match;
    while ((match = pattern.exec(html))) rows.push({ slot: match[1], size: directorySizeBytes(match[2], match[3]) });
    if (!rows.length) throw new Error('Índice Euskalmet sin fotogramas.');
    DIRECTORY_CACHE.set(cacheKey, { savedAt: Date.now(), rows });
    return rows;
  } catch (error) {
    throw error;
  }
}

async function directoryCandidates(product, rounded) {
  const rows = await fetchDirectoryRows(product);
  const roundedDate = new Date(rounded);
  const roundedMinutes = roundedDate.getUTCHours() * 60 + roundedDate.getUTCMinutes();
  return rows.map(row => {
    const slotMinutes = Number(row.slot.slice(0, 2)) * 60 + Number(row.slot.slice(2));
    const ageMinutes = (roundedMinutes - slotMinutes + 1440) % 1440;
    return { date: new Date(rounded - ageMinutes * 60000), ageMinutes, size: row.size };
  }).filter(item => item.ageMinutes <= 12 * 60)
    // Se comprueban primero las tres ranuras recientes aunque pesen como la
    // lámina vacía; después se priorizan los tamaños que hoy corresponden a
    // radar útil. No se descarta ninguna imagen por tamaño: el filtro final es
    // el hash exacto y la estructura PNG, de modo que lluvia intensa no queda
    // fuera solo por producir un archivo grande.
    .sort((a, b) => {
      const recentA = a.ageMinutes <= 30 ? 0 : a.size < 120 * 1024 ? 1 : 2;
      const recentB = b.ageMinutes <= 30 ? 0 : b.size < 120 * 1024 ? 1 : 2;
      return recentA - recentB || a.ageMinutes - b.ageMinutes;
    })
    // Nueve candidatos son tres bloques. El índice ya los ordena por
    // probabilidad de ser útiles y esta cota garantiza que una incidencia de
    // Euskalmet no agote los 30 s de la función serverless.
    .slice(0, 9)
    .map(item => item.date);
}

async function fetchFrame(product, date) {
  const filename = frameName(date);
  try {
    const response = await fetchOfficial(`${product.path}/${filename}`, { accept: 'image/png,image/*;q=0.8', timeout: FETCH_TIMEOUT, maxBytes: 2 * 1024 * 1024 });
    const bytes = response.bytes;
    if (bytes.length < 5000 || !response.contentType.toLowerCase().includes('image')) return null;
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    if (digest === NO_DATA_SHA256) return null;
    if (product.path.includes('radar_reflectivity') && !radarFrameUseful(bytes)) return null;
    return { bytes, filename, observedAt: date.toISOString(), stale: Date.now() - date.getTime() > 30 * 60 * 1000 };
  } catch (_) {
    return null;
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
  // para no pedir un archivo que todavía se esté generando. Cuando la fuente
  // atraviesa una incidencia se busca hasta 12 horas atrás y se identifica el
  // fotograma anterior; nunca se muestra la lámina vacía como si fuera radar.
  const rounded = Math.floor(Date.now() / 600000) * 600000 - 600000;
  let candidates = [];
  try {
    candidates = await directoryCandidates(product, rounded);
  } catch (_) {
    // Respaldo acotado si el índice HTML oficial no responde. No se lanzan
    // decenas de descargas simultáneas porque eso bloqueaba la función.
    candidates = Array.from({ length: 3 }, (_, index) => new Date(rounded - index * 600000));
  }
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
      error: 'Euskalmet no publicó un fotograma utilizable durante las últimas doce horas.'
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
