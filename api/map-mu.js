const GRIB2CLASS = require('grib2class');

const NOAA_FILTER = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl';
const HOUR_MS = 60 * 60 * 1000;
const FRAME_HOURS = 24;
const FETCH_TIMEOUT = 10000;
const FETCH_CONCURRENCY = 6;
const CACHE_TTL = 15 * 60 * 1000;
const MAX_STALE_AGE = 2 * 60 * 60 * 1000;
const MAX_LATITUDE_SPAN = 18;
const MAX_LONGITUDE_SPAN = 28;
const RESPONSE_CACHE = globalThis.__METEO_AITOR_MU_CACHE__ ||
  (globalThis.__METEO_AITOR_MU_CACHE__ = new Map());

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max, fallback) {
  return Math.max(min, Math.min(max, number(value, fallback)));
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function runIdentity(runTime) {
  return {
    date: `${runTime.getUTCFullYear()}${pad(runTime.getUTCMonth() + 1)}${pad(runTime.getUTCDate())}`,
    hour: pad(runTime.getUTCHours()),
    iso: runTime.toISOString()
  };
}

function candidateRuns(now = Date.now()) {
  // Se usa una pasada con al menos cinco horas de antigüedad: así NOAA ya ha
  // publicado tanto la hora actual como las 24 horas posteriores. Si todavía
  // faltase algún fichero, se prueba la pasada anterior sin mezclar modelos.
  const delayed = new Date(now - 5 * HOUR_MS);
  delayed.setUTCMinutes(0, 0, 0);
  delayed.setUTCHours(Math.floor(delayed.getUTCHours() / 6) * 6);
  return [0, 1, 2].map(index => new Date(delayed.getTime() - index * 6 * HOUR_MS));
}

function limitedBounds(input, focus) {
  let { south, north, west, east } = input;
  const latitudeSpan = north - south;
  const longitudeSpan = east - west;
  if (latitudeSpan > MAX_LATITUDE_SPAN) {
    const center = Number.isFinite(focus.latitude) ? focus.latitude : (south + north) / 2;
    south = Math.max(-80, center - MAX_LATITUDE_SPAN / 2);
    north = Math.min(85, south + MAX_LATITUDE_SPAN);
    south = north - MAX_LATITUDE_SPAN;
  }
  if (longitudeSpan > MAX_LONGITUDE_SPAN) {
    const center = Number.isFinite(focus.longitude) ? focus.longitude : (west + east) / 2;
    west = Math.max(-179.75, center - MAX_LONGITUDE_SPAN / 2);
    east = Math.min(179.75, west + MAX_LONGITUDE_SPAN);
    west = east - MAX_LONGITUDE_SPAN;
  }
  return { south, north, west, east };
}

function alignedBounds(bounds) {
  return {
    south: Math.floor(bounds.south * 4) / 4,
    north: Math.ceil(bounds.north * 4) / 4,
    west: Math.floor(bounds.west * 4) / 4,
    east: Math.ceil(bounds.east * 4) / 4
  };
}

function grid(bounds, rows) {
  const aspect = Math.max(1, Math.min(1.8, (bounds.east - bounds.west) / Math.max(0.01, bounds.north - bounds.south)));
  const columns = Math.max(8, Math.min(48, Math.round(rows * aspect)));
  const points = [];
  for (let row = 0; row < rows; row += 1) {
    const latitude = bounds.south + (bounds.north - bounds.south) * row / (rows - 1);
    for (let column = 0; column < columns; column += 1) {
      const longitude = bounds.west + (bounds.east - bounds.west) * column / (columns - 1);
      points.push({ latitude: Number(latitude.toFixed(4)), longitude: Number(longitude.toFixed(4)) });
    }
  }
  return { rows, columns, points };
}

function noaaUrl(run, forecastHour, bounds) {
  const identity = runIdentity(run);
  const parameters = new URLSearchParams({
    file: `gfs.t${identity.hour}z.pgrb2.0p25.f${pad(forecastHour, 3)}`,
    'lev_255-0_mb_above_ground': 'on',
    var_CAPE: 'on',
    var_CIN: 'on',
    subregion: '',
    leftlon: String(bounds.west),
    rightlon: String(bounds.east),
    toplat: String(bounds.north),
    bottomlat: String(bounds.south),
    dir: `/gfs.${identity.date}/${identity.hour}/atmos`
  });
  return `${NOAA_FILTER}?${parameters.toString()}`;
}

async function fetchBuffer(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/octet-stream' }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok || buffer.length < 32 || buffer.toString('ascii', 0, 4) !== 'GRIB') {
      const error = new Error(`NOAA NOMADS respondió HTTP ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

function parsedMessage(buffer) {
  const parser = new GRIB2CLASS({ log: false, numMembers: 1 });
  parser.parse(buffer);
  return parser;
}

function parseFrame(buffer) {
  const fields = {};
  let cursor = 0;
  while (cursor < buffer.length) {
    const start = buffer.indexOf('GRIB', cursor, 'ascii');
    if (start < 0 || start + 16 > buffer.length) break;
    const length = Number(buffer.readBigUInt64BE(start + 8));
    if (!Number.isSafeInteger(length) || length < 32 || start + length > buffer.length) break;
    const parser = parsedMessage(buffer.subarray(start, start + length));
    const parameter = String(parser.meta?.ParameterNumberByProductDisciplineAndParameterCategory || '').toLowerCase();
    const values = parser.DataValues?.[0];
    if (values?.length) {
      if (parameter.includes('available potential energy')) fields.cape = { parser, values };
      if (parameter.includes('convective inhibition')) fields.cin = { parser, values };
    }
    cursor = start + length;
  }
  if (!fields.cape || !fields.cin) throw new Error('NOAA no devolvió la pareja MUCAPE/MUCIN completa.');
  const geometry = fields.cape.parser;
  if (geometry.Nx !== fields.cin.parser.Nx || geometry.Ny !== fields.cin.parser.Ny) {
    throw new Error('Las mallas MUCAPE/MUCIN de NOAA no coinciden.');
  }
  return {
    nx: geometry.Nx,
    ny: geometry.Ny,
    latitude1: geometry.La1,
    latitude2: geometry.La2,
    longitude1: geometry.Lo1,
    longitude2: geometry.Lo2,
    cape: fields.cape.values,
    cin: fields.cin.values
  };
}

async function fetchFrame(run, forecastHour, bounds) {
  const buffer = await fetchBuffer(noaaUrl(run, forecastHour, bounds));
  return { forecastHour, frame: parseFrame(buffer) };
}

async function selectRun(bounds) {
  const now = Date.now();
  let lastError;
  for (const run of candidateRuns(now)) {
    const currentHour = Math.max(0, Math.round((now - run.getTime()) / HOUR_MS));
    const finalHour = currentHour + FRAME_HOURS;
    try {
      const [current, final] = await Promise.all([
        fetchFrame(run, currentHour, bounds),
        fetchFrame(run, finalHour, bounds)
      ]);
      return { run, currentHour, probes: new Map([[currentHour, current], [finalHour, final]]) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('NOAA no publicó todavía una pasada GFS completa.');
}

async function fetchFrames(run, offsets, bounds, probes) {
  const results = new Array(offsets.length);
  let next = 0;
  async function worker() {
    while (next < offsets.length) {
      const index = next;
      next += 1;
      const forecastHour = offsets[index];
      try {
        results[index] = probes.get(forecastHour) || await fetchFrame(run, forecastHour, bounds);
      } catch {
        results[index] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, offsets.length) }, () => worker()));
  return results.filter(Boolean);
}

function gridIndex(frame, latitude, longitude) {
  const latitudeStep = (frame.latitude2 - frame.latitude1) / Math.max(1, frame.ny - 1);
  const longitudeStep = (frame.longitude2 - frame.longitude1) / Math.max(1, frame.nx - 1);
  let modelLongitude = longitude;
  while (modelLongitude < frame.longitude1 - 0.001) modelLongitude += 360;
  while (modelLongitude > frame.longitude2 + 360) modelLongitude -= 360;
  const row = Math.max(0, Math.min(frame.ny - 1, Math.round((latitude - frame.latitude1) / latitudeStep)));
  const column = Math.max(0, Math.min(frame.nx - 1, Math.round((modelLongitude - frame.longitude1) / longitudeStep)));
  return row * frame.nx + column;
}

function validFieldValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && Math.abs(numeric) < 100000 ? numeric : null;
}

function compactPoint(point, frames) {
  const cape = [];
  const cin = [];
  for (const item of frames) {
    const index = gridIndex(item.frame, point.latitude, point.longitude);
    const capeValue = validFieldValue(item.frame.cape[index]);
    const cinValue = validFieldValue(item.frame.cin[index]);
    cape.push(capeValue === null ? null : Math.max(0, capeValue));
    cin.push(cinValue === null ? null : -Math.abs(cinValue));
  }
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    hourly: { cape, convective_inhibition: cin }
  };
}

function trimCache() {
  for (const [key, entry] of RESPONSE_CACHE.entries()) {
    if (!entry || Date.now() - entry.savedAt > MAX_STALE_AGE) RESPONSE_CACHE.delete(key);
  }
  while (RESPONSE_CACHE.size > 8) RESPONSE_CACHE.delete(RESPONSE_CACHE.keys().next().value);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const requestedBounds = {
    south: clamp(req.query?.south, -80, 80, 35),
    north: clamp(req.query?.north, -79, 85, 47),
    west: clamp(req.query?.west, -179.75, 179.5, -12),
    east: clamp(req.query?.east, -179.5, 179.75, 8)
  };
  if (requestedBounds.north <= requestedBounds.south || requestedBounds.east <= requestedBounds.west) {
    return res.status(400).json({ ok: false, error: 'El área del mapa no es válida.' });
  }
  const focus = {
    latitude: clamp(req.query?.focusLat, -80, 85, 43.4201),
    longitude: clamp(req.query?.focusLon, -179.75, 179.75, -2.7224)
  };
  const bounds = limitedBounds(requestedBounds, focus);
  const noaaBounds = alignedBounds(bounds);
  const density = clamp(req.query?.density, 6, 18, 10);
  const outputGrid = grid(bounds, density);
  const cacheKey = [
    density,
    bounds.south.toFixed(2), bounds.north.toFixed(2),
    bounds.west.toFixed(2), bounds.east.toFixed(2),
    focus.latitude.toFixed(2), focus.longitude.toFixed(2)
  ].join('|');
  const cached = RESPONSE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.setHeader('X-Map-Cache', 'HIT');
    return res.status(200).json(cached.payload);
  }

  try {
    const selected = await selectRun(noaaBounds);
    const offsets = Array.from({ length: FRAME_HOURS + 1 }, (_, index) => selected.currentHour + index);
    const frames = await fetchFrames(selected.run, offsets, noaaBounds, selected.probes);
    if (frames.length < 3) throw new Error('NOAA no devolvió suficientes horas MUCAPE/MUCIN.');
    frames.sort((a, b) => a.forecastHour - b.forecastHour);
    const times = frames.map(item => new Date(selected.run.getTime() + item.forecastHour * HOUR_MS).toISOString().replace(/:00\.000Z$/, ':00'));
    const run = runIdentity(selected.run);
    const payload = {
      ok: true,
      generatedAt: new Date().toISOString(),
      transport: 'noaa-nomads-grib2',
      bundle: 'convection',
      displayLayer: String(req.query?.displayLayer || 'cape'),
      model: {
        requested: 'gfs',
        label: 'NOAA GFS 0,25° · MUCAPE/MUCIN',
        sourceModel: 'ncep_gfs_0p25_nomads',
        run: run.iso,
        parcelLayer: '255–0 mb sobre el suelo',
        fallback: false,
        cinAvailable: true
      },
      bounds,
      focus,
      grid: {
        rows: outputGrid.rows,
        columns: outputGrid.columns,
        stepLatitude: (bounds.north - bounds.south) / (outputGrid.rows - 1),
        stepLongitude: (bounds.east - bounds.west) / (outputGrid.columns - 1)
      },
      times,
      points: outputGrid.points.map(point => compactPoint(point, frames)),
      focusPoint: compactPoint(focus, frames)
    };
    RESPONSE_CACHE.set(cacheKey, { savedAt: Date.now(), payload });
    trimCache();
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.setHeader('X-Map-Cache', 'MISS');
    return res.status(200).json(payload);
  } catch (error) {
    const stale = RESPONSE_CACHE.get(cacheKey);
    if (stale && Date.now() - stale.savedAt < MAX_STALE_AGE) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=900');
      res.setHeader('X-Map-Cache', 'STALE');
      return res.status(200).json({ ...stale.payload, stale: true });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      ok: false,
      error: `NOAA GFS no pudo servir ahora MUCAPE/MUCIN. ${String(error?.message || '')}`.trim(),
      retryAfter: 120
    });
  }
};
