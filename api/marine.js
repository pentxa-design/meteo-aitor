const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const FRESH_MS = 30 * 60 * 1000;
const STALE_MS = 2 * 60 * 60 * 1000;
const cache = globalThis.__METEO_AITOR_MARINE_CACHE__ || { savedAt: 0, payload: null };
globalThis.__METEO_AITOR_MARINE_CACHE__ = cache;

function usable(payload) {
  const current = payload?.current;
  return current && ['wave_height', 'wave_period', 'swell_wave_height', 'swell_wave_period']
    .some(key => current[key] !== null && current[key] !== '' && Number.isFinite(Number(current[key])));
}

async function fetchMarine() {
  const params = new URLSearchParams({
    latitude: '43.4201',
    longitude: '-2.7224',
    timezone: 'Europe/Madrid',
    forecast_days: '3',
    cell_selection: 'sea',
    current: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature'
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${MARINE_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Meteo-Aitor-Bermeo/10.22' }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !usable(payload)) throw new Error('Oleaje temporalmente no disponible.');
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }
  if (cache.payload && Date.now() - cache.savedAt <= FRESH_MS) {
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=1800');
    return res.status(200).json({ ok: true, source: 'Open-Meteo Marine', stale: false, ...cache.payload });
  }
  try {
    const payload = await fetchMarine();
    cache.savedAt = Date.now();cache.payload = payload;
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=1800, stale-if-error=7200');
    return res.status(200).json({ ok: true, source: 'Open-Meteo Marine', stale: false, ...payload });
  } catch (_) {
    if (cache.payload && Date.now() - cache.savedAt <= STALE_MS) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=1800');
      return res.status(200).json({ ok: true, source: 'Open-Meteo Marine', stale: true, ...cache.payload });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, error: 'El parte de oleaje no respondió todavía.' });
  }
};
