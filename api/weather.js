const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 2 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 16;
const ALLOWED_LIST_FIELDS = new Set(['current', 'hourly', 'daily']);
const ALLOWED_UNITS = new Set(['wind_speed_unit', 'temperature_unit', 'precipitation_unit']);
const ALLOWED_MODELS = new Set(['ecmwf_ifs', 'gfs_seamless']);

const memoryCache = globalThis.__METEO_AITOR_WEATHER_CACHE__ || new Map();
globalThis.__METEO_AITOR_WEATHER_CACHE__ = memoryCache;

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function finiteCoordinate(value, min, max) {
  const number = Number(firstQueryValue(value));
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function buildUpstreamParams(query = {}) {
  const latitude = finiteCoordinate(query.latitude, -90, 90);
  const longitude = finiteCoordinate(query.longitude, -180, 180);
  if (latitude === null || longitude === null) {
    const error = new Error('Coordenadas no válidas.');
    error.statusCode = 400;
    throw error;
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: String(firstQueryValue(query.timezone) || 'auto'),
    forecast_days: String(Math.min(16, Math.max(1, Number(firstQueryValue(query.forecast_days)) || 7)))
  });

  for (const key of ALLOWED_LIST_FIELDS) {
    const value = String(firstQueryValue(query[key]) || '').trim();
    if (value) params.set(key, value.slice(0, 2000));
  }
  for (const key of ALLOWED_UNITS) {
    const value = String(firstQueryValue(query[key]) || '').trim();
    if (value) params.set(key, value.slice(0, 40));
  }
  const model = String(firstQueryValue(query.models) || '').trim();
  if (model && !ALLOWED_MODELS.has(model)) {
    const error = new Error('Modelo meteorológico no permitido.');
    error.statusCode = 400;
    throw error;
  }
  if (model) params.set('models', model);
  return params;
}

function usableForecast(payload) {
  if (!payload || typeof payload !== 'object' || payload.error) return false;
  const finite = value => value !== null && value !== '' && Number.isFinite(Number(value));
  const currentKeys = [
    'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
    'precipitation', 'rain', 'weather_code', 'cloud_cover', 'pressure_msl',
    'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'is_day'
  ];
  if (payload.current && currentKeys.some(key => finite(payload.current[key]))) return true;
  const seriesKeys = {
    hourly: ['temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature', 'weather_code', 'precipitation_probability', 'precipitation', 'cloud_cover', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'is_day'],
    daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'precipitation_sum', 'wind_gusts_10m_max']
  };
  return Object.entries(seriesKeys).some(([section, keys]) =>
    Array.isArray(payload[section]?.time) && payload[section].time.length > 0 &&
    keys.some(key => Array.isArray(payload[section]?.[key]) && payload[section][key].some(finite))
  );
}

function remember(key, payload) {
  const savedAt = Date.now();
  memoryCache.delete(key);
  memoryCache.set(key, { savedAt, payload });
  while (memoryCache.size > MAX_CACHE_ENTRIES) {
    memoryCache.delete(memoryCache.keys().next().value);
  }
  return savedAt;
}

function payloadWithCacheInfo(payload, state, savedAt) {
  return {
    ...payload,
    _meteoAitorCache: {
      state,
      savedAt: new Date(savedAt).toISOString()
    }
  };
}

async function fetchForecast(params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Meteo-Aitor-Bermeo/10.22' }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !usableForecast(payload)) {
      const error = new Error('El proveedor numérico no devolvió una previsión utilizable.');
      error.statusCode = response.status >= 400 ? response.status : 502;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  let params;
  try {
    params = buildUpstreamParams(req.query || {});
  } catch (error) {
    return res.status(error.statusCode || 400).json({ ok: false, error: error.message });
  }

  const key = params.toString();
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.savedAt <= FRESH_MS) {
    res.setHeader('X-Meteo-Cache', 'memory-fresh');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300, stale-if-error=7200');
    return res.status(200).json(payloadWithCacheInfo(cached.payload, 'fresh', cached.savedAt));
  }

  try {
    const payload = await fetchForecast(params);
    const savedAt = remember(key, payload);
    res.setHeader('X-Meteo-Cache', 'upstream');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300, stale-if-error=7200');
    return res.status(200).json(payloadWithCacheInfo(payload, 'fresh', savedAt));
  } catch (_) {
    if (cached && Date.now() - cached.savedAt <= STALE_MS) {
      res.setHeader('X-Meteo-Cache', 'memory-stale');
      res.setHeader('Warning', '110 - "Respuesta meteorológica guardada"');
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300, stale-if-error=7200');
      return res.status(200).json(payloadWithCacheInfo(cached.payload, 'stale', cached.savedAt));
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      ok: false,
      error: 'La previsión numérica está temporalmente ocupada. La aplicación conservará el último parte disponible.'
    });
  }
};
