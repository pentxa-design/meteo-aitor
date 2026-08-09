const BASE_URL = 'https://opendata.aemet.es/opendata';

async function gateway(path, apiKey) {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    headers: { Accept: 'application/json', api_key: apiKey }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || Number(payload?.estado) !== 200 || !payload?.datos) {
    throw new Error(payload?.descripcion || `AEMET respondió HTTP ${response.status}`);
  }
  return payload.datos;
}

async function fetchImage(imageUrl) {
  const response = await fetch(imageUrl, { headers: { Accept: 'image/*' } });
  if (!response.ok) throw new Error(`No se pudo descargar el mapa de rayos (HTTP ${response.status}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error('AEMET devolvió un mapa de rayos incompleto.');
  return { bytes, contentType: response.headers.get('content-type') || 'image/png' };
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }
  const apiKey = String(process.env.AEMET_API_KEY || '').trim();
  if (!apiKey) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ ok: false, source: 'AEMET OpenData', error: 'La clave AEMET OpenData no está configurada.' });
  }
  try {
    const imageUrl = await gateway('/red/rayos/mapa', apiKey);
    const image = await fetchImage(imageUrl);
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    res.setHeader('X-Meteo-Aitor-Lightning-Source', 'AEMET-OpenData');
    return res.status(200).send(image.bytes);
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, source: 'AEMET OpenData', error: error?.message || 'No se pudo cargar el mapa de rayos AEMET.' });
  }
};
