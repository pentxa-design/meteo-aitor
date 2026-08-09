const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const MODEL = 'meteofrance_arome_france_hd';
const DOMAIN = { south: 37.5, north: 55.4, west: -12, east: 16 };
const FORECAST_STEPS = 48 * 4;
const POINTS_PER_REQUEST = 65;
const BATCH_CONCURRENCY = 3;
const FETCH_TIMEOUT = 18000;
const CACHE_TTL = 10 * 60 * 1000;
const MAX_STALE_AGE = 4 * 60 * 60 * 1000;
const RESPONSE_CACHE = globalThis.__METEO_AITOR_AROME_15M_CACHE__ ||
  (globalThis.__METEO_AITOR_AROME_15M_CACHE__ = new Map());

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max, fallback) {
  return Math.max(min, Math.min(max, number(value, fallback)));
}

function insideDomain(point) {
  return point.latitude >= DOMAIN.south && point.latitude <= DOMAIN.north && point.longitude >= DOMAIN.west && point.longitude <= DOMAIN.east;
}

function grid(south, north, west, east, count) {
  const rows = count;
  const aspect = Math.max(1, Math.min(1.8, (east - west) / Math.max(0.1, north - south)));
  const columns = Math.max(8, Math.min(34, Math.round(count * aspect)));
  const points = [];
  for (let row = 0; row < rows; row += 1) {
    const latitude = south + ((north - south) * row / (rows - 1));
    for (let column = 0; column < columns; column += 1) {
      const longitude = west + ((east - west) * column / (columns - 1));
      points.push({ latitude: Number(latitude.toFixed(4)), longitude: Number(longitude.toFixed(4)) });
    }
  }
  return { rows, columns, points };
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.error) {
      const error = new Error(payload?.reason || payload?.error || `Open‑Meteo respondió HTTP ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function requestBatch(points) {
  const values = new URLSearchParams({
    latitude: points.map(point => point.latitude).join(','),
    longitude: points.map(point => point.longitude).join(','),
    minutely_15: 'precipitation',
    forecast_minutely_15: String(FORECAST_STEPS),
    models: MODEL,
    precipitation_unit: 'mm',
    timezone: 'UTC',
    cell_selection: 'nearest'
  });
  const payload = await fetchJson(`${OPEN_METEO}?${values.toString()}`);
  const locations = Array.isArray(payload) ? payload : [payload];
  if (locations.length !== points.length) throw new Error('AROME devolvió una malla de 15 minutos incompleta.');
  return locations;
}

async function requestGrid(points) {
  const batches = chunks(points, POINTS_PER_REQUEST);
  const responses = new Array(batches.length);
  let nextBatch = 0;
  async function worker() {
    while (nextBatch < batches.length) {
      const index = nextBatch;
      nextBatch += 1;
      responses[index] = await requestBatch(batches[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, () => worker()));
  return responses.flat();
}

function compactPoint(result, fallbackPoint) {
  return {
    latitude: Number(result?.latitude ?? fallbackPoint.latitude),
    longitude: Number(result?.longitude ?? fallbackPoint.longitude),
    hourly: { precipitation_15m: result?.minutely_15?.precipitation || [] }
  };
}

function isRateLimitError(error) {
  return Number(error?.statusCode) === 429 || /rate limit|too many|l[ií]mite/i.test(String(error?.message || ''));
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const requestedSouth = clamp(req.query?.south, -80, 80, 37.5);
  const requestedNorth = clamp(req.query?.north, -79, 85, 55.4);
  const requestedWest = clamp(req.query?.west, -180, 179, -12);
  const requestedEast = clamp(req.query?.east, -179, 180, 16);
  const south = Math.max(DOMAIN.south, requestedSouth);
  const north = Math.min(DOMAIN.north, requestedNorth);
  const west = Math.max(DOMAIN.west, requestedWest);
  const east = Math.min(DOMAIN.east, requestedEast);
  if (north <= south || east <= west || north - south < 0.03 || east - west < 0.03) {
    return res.status(422).json({ ok: false, source: 'Météo‑France AROME HD', error: 'La vista queda fuera del dominio AROME France HD (37,5–55,4° N y 12° O–16° E).' });
  }

  const density = clamp(req.query?.density, 6, 18, 12);
  const mapGrid = grid(south, north, west, east, density);
  const requestedFocus = {
    latitude: clamp(req.query?.focusLat, -80, 85, 43.4201),
    longitude: clamp(req.query?.focusLon, -180, 180, -2.7224)
  };
  const focus = { latitude: Number(requestedFocus.latitude.toFixed(4)), longitude: Number(requestedFocus.longitude.toFixed(4)) };
  const hasFocus = insideDomain(focus);
  const requestPoints = hasFocus ? [...mapGrid.points, focus] : mapGrid.points;
  const cacheKey = [density, south.toFixed(2), north.toFixed(2), west.toFixed(2), east.toFixed(2), hasFocus ? `${focus.latitude.toFixed(2)},${focus.longitude.toFixed(2)}` : 'no-focus'].join('|');
  const cached = RESPONSE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    res.setHeader('X-Map-Cache', 'HIT');
    return res.status(200).json(cached.payload);
  }

  try {
    const locations = await requestGrid(requestPoints);
    const first = locations[0]?.minutely_15 || {};
    const times = Array.isArray(first.time) ? first.time.slice(0, FORECAST_STEPS) : [];
    if (!times.length || locations.length !== requestPoints.length) throw new Error('AROME no devolvió una línea temporal de 15 minutos utilizable.');
    const gridLocations = locations.slice(0, mapGrid.points.length);
    const exactLocation = hasFocus ? locations[mapGrid.points.length] : null;
    const payload = {
      ok: true,
      generatedAt: new Date().toISOString(),
      transport: 'server',
      bundle: 'precipitation_15m',
      displayLayer: 'precipitation_15m',
      model: {
        requested: 'arome',
        label: 'Météo‑France AROME HD · 1,5 km · lluvia 15 min',
        sourceModel: MODEL,
        provider: 'Open‑Meteo / Météo‑France',
        resolution: 'AROME France HD 0,01° · 1,5 km'
      },
      diagnostics: { native: true, derived: false, sourceVariable: 'precipitation', interval: 'preceding_15_minutes_sum', units: 'mm' },
      domain: DOMAIN,
      bounds: { south, north, west, east },
      focus,
      grid: {
        rows: mapGrid.rows,
        columns: mapGrid.columns,
        stepLatitude: (north - south) / (mapGrid.rows - 1),
        stepLongitude: (east - west) / (mapGrid.columns - 1)
      },
      times,
      points: gridLocations.map((item, index) => compactPoint(item, mapGrid.points[index])),
      focusPoint: exactLocation ? compactPoint(exactLocation, focus) : null
    };
    RESPONSE_CACHE.set(cacheKey, { savedAt: Date.now(), payload });
    if (RESPONSE_CACHE.size > 18) RESPONSE_CACHE.delete(RESPONSE_CACHE.keys().next().value);
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    res.setHeader('X-Map-Cache', 'MISS');
    return res.status(200).json(payload);
  } catch (error) {
    if (cached?.payload && Date.now() - cached.savedAt < MAX_STALE_AGE) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
      res.setHeader('X-Map-Cache', 'STALE');
      return res.status(200).json({ ...cached.payload, stale: true });
    }
    const rateLimited = isRateLimitError(error);
    res.setHeader('Cache-Control', 'no-store');
    if (rateLimited) res.setHeader('Retry-After', '60');
    return res.status(rateLimited ? 429 : 502).json({
      ok: false,
      source: 'Météo‑France AROME HD mediante Open‑Meteo',
      retryAfter: 60,
      error: error?.name === 'AbortError' ? 'AROME tardó demasiado en responder.' : (error?.message || 'No se pudo cargar la lluvia AROME de 15 minutos.')
    });
  }
};
