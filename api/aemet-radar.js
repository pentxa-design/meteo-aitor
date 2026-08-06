const BASE_URL = 'https://opendata.aemet.es/opendata';
const PUBLIC_RADAR_URL = 'https://www.aemet.es/es/api-eltiempo/radar';

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
  if (!response.ok) throw new Error(`No se pudo descargar la imagen de radar (HTTP ${response.status}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error('AEMET devolvió una imagen de radar incompleta.');
  return { bytes, contentType: response.headers.get('content-type') || 'image/png' };
}

async function publicRadar() {
  const timeline = await fetch(`${PUBLIC_RADAR_URL}/timeline/compo/PB`, {
    headers: { Accept: 'application/json' }
  });
  const payload = await timeline.json().catch(() => null);
  if (!timeline.ok || !Array.isArray(payload)) throw new Error(`El visor público de AEMET respondió HTTP ${timeline.status}.`);
  const frames = payload.flatMap(item => Array.isArray(item?.Elementos) ? item.Elementos : []).map(item => ({
    date: Date.parse(String(item?.Fecha || '')),
    filename: String(item?.['Nombre fichero'] || '')
  })).filter(item => Number.isFinite(item.date) && /^radw\d{12}_3857\.png$/.test(item.filename)).sort((a, b) => b.date - a.date);
  if (!frames.length) throw new Error('El visor público de AEMET no publicó un fotograma nacional válido.');
  const image = await fetchImage(`${PUBLIC_RADAR_URL}/imagen-radar/compo/${frames[0].filename}`);
  return { ...image, source: 'visor-oficial', observedAt: new Date(frames[0].date).toISOString() };
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }
  const apiKey = String(process.env.AEMET_API_KEY || '').trim();
  try {
    let radar = null;
    if (apiKey) {
      try {
        const imageUrl = await gateway('/red/radar/nacional', apiKey);
        radar = { ...(await fetchImage(imageUrl)), source: 'opendata' };
      } catch (_) {
        radar = null;
      }
    }
    if (!radar) radar = await publicRadar();
    res.setHeader('Content-Type', radar.contentType);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    res.setHeader('X-Meteo-Aitor-Radar-Source', radar.source);
    if (radar.observedAt) res.setHeader('X-Meteo-Aitor-Radar-Time', radar.observedAt);
    return res.status(200).send(radar.bytes);
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, source: 'AEMET', error: error?.message || 'No se pudo cargar el radar AEMET.' });
  }
};
