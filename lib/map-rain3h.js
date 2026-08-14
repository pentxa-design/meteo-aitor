// Handler compartido por la ruta pública /api/map-rain3h y la función NOAA.
const GRIB2CLASS = require('grib2class');

const NOAA_FILTER_ROOT = 'https://nomads.ncep.noaa.gov/cgi-bin';
const HOUR_MS = 60 * 60 * 1000;
const PAGE_HOURS = 24;
const FORECAST_END_HOUR = 168;
const FRAME_STEP_HOURS = 3;
const PAGE_COUNT = FORECAST_END_HOUR / PAGE_HOURS;
const INTERVALS_PER_PAGE = PAGE_HOURS / FRAME_STEP_HOURS;
const FETCH_TIMEOUT = 12000;
const FETCH_ATTEMPTS = 2;
const FETCH_RETRY_DELAY = 250;
const FETCH_CONCURRENCY = 5;
const CACHE_TTL = 20 * 60 * 1000;
const MAX_STALE_AGE = 3 * 60 * 60 * 1000;
const REGIONAL_LATITUDE_SPAN = 18;
const REGIONAL_LONGITUDE_SPAN = 30;
const WIDE_LATITUDE_SPAN = 30;
const WIDE_LONGITUDE_SPAN = 70;
const WIDE_DISPLAY_DEGREES = 0.5;
// La fuente mundial es GFS 1°. La salida visual de 2° conserva un campo
// planetario continuo, pero mantiene la respuesta por debajo del límite de
// las funciones serverless y evita que el deslizador vuelva a tener lag.
const WORLD_DISPLAY_DEGREES = 2;
const WORLD_BOUNDS = Object.freeze({ south: -80, north: 85, west: -180, east: 180 });
const RESPONSE_CACHE = globalThis.__METEO_AITOR_RAIN3H_CACHE__ ||
  (globalThis.__METEO_AITOR_RAIN3H_CACHE__ = new Map());
const RESPONSE_INFLIGHT = globalThis.__METEO_AITOR_RAIN3H_INFLIGHT__ ||
  (globalThis.__METEO_AITOR_RAIN3H_INFLIGHT__ = new Map());

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
    key: `${runTime.getUTCFullYear()}${pad(runTime.getUTCMonth() + 1)}${pad(runTime.getUTCDate())}${pad(runTime.getUTCHours())}`,
    date: `${runTime.getUTCFullYear()}${pad(runTime.getUTCMonth() + 1)}${pad(runTime.getUTCDate())}`,
    hour: pad(runTime.getUTCHours()),
    iso: runTime.toISOString()
  };
}

function pinnedRun(runKey, base, now = Date.now()) {
  if (!/^\d{10}$/.test(String(runKey || ''))) return null;
  const text = String(runKey);
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  const hour = Number(text.slice(8, 10));
  const run = new Date(Date.UTC(year, month - 1, day, hour));
  const identity = runIdentity(run);
  if (identity.key !== text || hour % 6 !== 0 || identity.iso !== String(base || '')) return null;
  const age = now - run.getTime();
  return age >= -HOUR_MS && age <= 72 * HOUR_MS ? run : null;
}

function pageForecastHours(page) {
  const startHour = page * PAGE_HOURS;
  const firstHour = page === 0 ? FRAME_STEP_HOURS : startHour;
  const endHour = Math.min(FORECAST_END_HOUR, startHour + PAGE_HOURS);
  return Array.from(
    { length: Math.floor((endHour - firstHour) / FRAME_STEP_HOURS) + 1 },
    (_, index) => firstHour + index * FRAME_STEP_HOURS
  );
}

function candidateRuns(now = Date.now()) {
  // Se elige una pasada con seis horas de margen: NOAA ya ha terminado de
  // publicar sus acumulados y evitamos mezclar ficheros de pasadas distintas.
  const delayed = new Date(now - 6 * HOUR_MS);
  delayed.setUTCMinutes(0, 0, 0);
  delayed.setUTCHours(Math.floor(delayed.getUTCHours() / 6) * 6);
  return [0, 1, 2].map(index => new Date(delayed.getTime() - index * 6 * HOUR_MS));
}

function gridResolution(requestedBounds) {
  const latitudeSpan = requestedBounds.north - requestedBounds.south;
  const longitudeSpan = requestedBounds.east - requestedBounds.west;
  if (latitudeSpan > WIDE_LATITUDE_SPAN || longitudeSpan > WIDE_LONGITUDE_SPAN) {
    return { code: '1p00', degrees: 1, displayDegrees: WORLD_DISPLAY_DEGREES, overview: true, wide: false };
  }
  if (latitudeSpan > REGIONAL_LATITUDE_SPAN || longitudeSpan > REGIONAL_LONGITUDE_SPAN) {
    return { code: '0p25', degrees: 0.25, displayDegrees: WIDE_DISPLAY_DEGREES, overview: false, wide: true };
  }
  return { code: '0p25', degrees: 0.25, displayDegrees: 0.25, overview: false, wide: false };
}

function canonicalRegionalBounds(center, resolution) {
  // En EU se cubren 30° × 70° con fuente oficial de 0,25° y una salida visual
  // de 0,5°. Al acercar, la ventana pasa a 18° × 30° y conserva cada nodo de
  // 0,25°. Ambas ventanas son estables para reutilizar la caché al panear.
  const latitudeSpan = resolution.wide ? WIDE_LATITUDE_SPAN : REGIONAL_LATITUDE_SPAN;
  const longitudeSpan = resolution.wide ? WIDE_LONGITUDE_SPAN : REGIONAL_LONGITUDE_SPAN;
  const latitudeLimitSouth = -80 + latitudeSpan / 2;
  const latitudeLimitNorth = 85 - latitudeSpan / 2;
  const longitudeLimit = 179.75 - longitudeSpan / 2;
  const latitude = Math.max(latitudeLimitSouth, Math.min(latitudeLimitNorth, Math.round(center.latitude / 2) * 2));
  const longitude = Math.max(-longitudeLimit, Math.min(longitudeLimit, Math.round(center.longitude / 2) * 2));
  return {
    south: latitude - latitudeSpan / 2,
    north: latitude + latitudeSpan / 2,
    west: longitude - longitudeSpan / 2,
    east: longitude + longitudeSpan / 2
  };
}

function alignedBounds(bounds, resolution) {
  const steps = 1 / resolution.degrees;
  return {
    south: Math.floor(bounds.south * steps) / steps,
    north: Math.ceil(bounds.north * steps) / steps,
    west: Math.floor(bounds.west * steps) / steps,
    east: Math.ceil(bounds.east * steps) / steps
  };
}

function outputGrid(bounds, resolution) {
  const rows = Math.round((bounds.north - bounds.south) / resolution.displayDegrees) + 1;
  const columns = Math.round((bounds.east - bounds.west) / resolution.displayDegrees) + 1;
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

function noaaUrl(run, forecastHour, bounds, resolution) {
  const identity = runIdentity(run);
  const parameters = new URLSearchParams({
    file: `gfs.t${identity.hour}z.pgrb2.${resolution.code}.f${pad(forecastHour, 3)}`,
    lev_surface: 'on',
    var_APCP: 'on',
    subregion: '',
    leftlon: String(bounds.west),
    rightlon: String(bounds.east),
    toplat: String(bounds.north),
    bottomlat: String(bounds.south),
    dir: `/gfs.${identity.date}/${identity.hour}/atmos`
  });
  return `${NOAA_FILTER_ROOT}/filter_gfs_${resolution.code}.pl?${parameters.toString()}`;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchBufferOnce(url, timeout = FETCH_TIMEOUT) {
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

async function fetchBuffer(url, timeout = FETCH_TIMEOUT) {
  let lastError;
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetchBufferOnce(url, timeout);
    } catch (error) {
      lastError = error;
      const status = Number(error?.statusCode || 0);
      const retryable = !status || status === 200 || status === 408 || status === 425 ||
        status === 429 || status >= 500;
      if (!retryable || attempt + 1 >= FETCH_ATTEMPTS) throw error;
      await wait(FETCH_RETRY_DELAY * (attempt + 1));
    }
  }
  throw lastError;
}

function messageProductSection(message) {
  let cursor = 16;
  while (cursor + 5 <= message.length) {
    const length = message.readUInt32BE(cursor);
    const section = message[cursor + 4];
    if (!length || cursor + length > message.length) break;
    if (section === 4) return message.subarray(cursor, cursor + length);
    cursor += length;
  }
  return null;
}

function accumulationWindow(section) {
  if (!section || section.length < 58 || section.readUInt16BE(7) !== 8) return null;
  const unit = section[48];
  const factor = unit === 1 ? 1 : unit === 10 ? 3 : unit === 11 ? 6 : unit === 12 ? 12 : null;
  if (!factor || section[46] !== 1) return null;
  return {
    startHour: section.readUInt32BE(18),
    lengthHours: section.readUInt32BE(49) * factor
  };
}

function parsedMessage(buffer) {
  const parser = new GRIB2CLASS({ log: false, numMembers: 1 });
  parser.parse(buffer);
  return parser;
}

function parseCumulativeFrame(buffer, forecastHour) {
  let selected = null;
  let cursor = 0;
  while (cursor < buffer.length) {
    const start = buffer.indexOf('GRIB', cursor, 'ascii');
    if (start < 0 || start + 16 > buffer.length) break;
    const length = Number(buffer.readBigUInt64BE(start + 8));
    if (!Number.isSafeInteger(length) || length < 32 || start + length > buffer.length) break;
    const message = buffer.subarray(start, start + length);
    const window = accumulationWindow(messageProductSection(message));
    if (window?.startHour === 0 && window.lengthHours === forecastHour) {
      const parser = parsedMessage(message);
      const parameter = String(parser.meta?.ParameterNumberByProductDisciplineAndParameterCategory || '').toLowerCase();
      const values = parser.DataValues?.[0];
      if (parameter.includes('total precipitation') && values?.length) selected = { parser, values };
    }
    cursor = start + length;
  }
  if (!selected) throw new Error(`NOAA no devolvió el acumulado APCP 0–${forecastHour} h.`);
  return {
    forecastHour,
    nx: selected.parser.Nx,
    ny: selected.parser.Ny,
    latitude1: selected.parser.La1,
    latitude2: selected.parser.La2,
    longitude1: selected.parser.Lo1,
    longitude2: selected.parser.Lo2,
    values: selected.values
  };
}

async function fetchCumulativeFrame(run, forecastHour, bounds, resolution) {
  const buffer = await fetchBuffer(noaaUrl(run, forecastHour, bounds, resolution));
  return parseCumulativeFrame(buffer, forecastHour);
}

async function selectRun(bounds, resolution, now = Date.now()) {
  let lastError;
  for (const run of candidateRuns(now)) {
    try {
      // La pasada queda bloqueada solo cuando están completos la primera
      // página visible y el extremo +168 h. Si la más reciente aún se está
      // publicando, se prueba la anterior antes de responder al navegador.
      const probeHours = [...pageForecastHours(0), FORECAST_END_HOUR];
      const frames = await fetchCumulativeFrames(run, probeHours, bounds, resolution, new Map());
      if (frames.some(frame => !frame)) throw new Error('NOAA aún no completó la pasada hasta +168 h.');
      return {
        run,
        probes: new Map(probeHours.map((forecastHour, index) => [forecastHour, frames[index]]))
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('NOAA no publicó todavía una pasada GFS completa.');
}

async function fetchCumulativeFrames(run, offsets, bounds, resolution, probes) {
  const results = new Array(offsets.length);
  let next = 0;
  async function worker() {
    while (next < offsets.length) {
      const index = next;
      next += 1;
      const forecastHour = offsets[index];
      try {
        results[index] = probes.get(forecastHour) ||
          await fetchCumulativeFrame(run, forecastHour, bounds, resolution);
      } catch {
        results[index] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, offsets.length) }, () => worker()));
  return results;
}

function sameGeometry(a, b) {
  return a && b && a.nx === b.nx && a.ny === b.ny &&
    a.latitude1 === b.latitude1 && a.latitude2 === b.latitude2 &&
    a.longitude1 === b.longitude1 && a.longitude2 === b.longitude2;
}

function gridIndex(frame, latitude, longitude) {
  const latitudeStep = (frame.latitude2 - frame.latitude1) / Math.max(1, frame.ny - 1);
  const longitudeStep = (frame.longitude2 - frame.longitude1) / Math.max(1, frame.nx - 1);
  let modelLongitude = longitude;
  while (modelLongitude < frame.longitude1 - 0.001) modelLongitude += 360;
  while (modelLongitude > frame.longitude2 + 0.001) modelLongitude -= 360;
  const row = Math.max(0, Math.min(frame.ny - 1, Math.round((latitude - frame.latitude1) / latitudeStep)));
  const column = Math.max(0, Math.min(frame.nx - 1, Math.round((modelLongitude - frame.longitude1) / longitudeStep)));
  return row * frame.nx + column;
}

function precipitationValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || Math.abs(numeric) >= 100000) return null;
  return Math.abs(numeric) < 1e-8 ? 0 : Math.max(0, numeric);
}

function buildIntervals(cumulativeFrames) {
  const intervals = [];
  for (let index = 0; index < cumulativeFrames.length - 1; index += 1) {
    const previous = cumulativeFrames[index];
    const current = cumulativeFrames[index + 1];
    if (!current || current.forecastHour - (previous?.forecastHour || 0) !== FRAME_STEP_HOURS) continue;
    if (previous && !sameGeometry(previous, current)) continue;
    intervals.push({
      startHour: current.forecastHour - FRAME_STEP_HOURS,
      previous,
      current
    });
  }
  return intervals;
}

function compactPoint(point, intervals) {
  const precipitation = intervals.map(interval => {
    const currentIndex = gridIndex(interval.current, point.latitude, point.longitude);
    const current = precipitationValue(interval.current.values[currentIndex]);
    if (current === null) return null;
    if (!interval.previous) return Number(current.toFixed(3));
    const previousIndex = gridIndex(interval.previous, point.latitude, point.longitude);
    const before = precipitationValue(interval.previous.values[previousIndex]);
    return before === null ? null : Number(Math.max(0, current - before).toFixed(3));
  });
  const accumulated = intervals.map(interval => {
    const currentIndex = gridIndex(interval.current, point.latitude, point.longitude);
    const current = precipitationValue(interval.current.values[currentIndex]);
    return current === null ? null : Number(current.toFixed(3));
  });
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    hourly: {
      precipitation_3h: precipitation,
      precipitation_accumulated: accumulated
    }
  };
}

function responseWithFocus(payload, focus) {
  const inside = focus.latitude >= payload.bounds.south && focus.latitude <= payload.bounds.north &&
    focus.longitude >= payload.bounds.west && focus.longitude <= payload.bounds.east;
  if (!inside || !payload.points.length) return { ...payload, focus, focusPoint: null };
  let nearest = payload.points[0];
  let nearestDistance = Infinity;
  for (const point of payload.points) {
    const distance = Math.hypot(point.latitude - focus.latitude, point.longitude - focus.longitude);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }
  const displayResolution = number(payload.model.displayResolutionDegrees, payload.model.resolutionDegrees);
  return { ...payload, focus, focusPoint: displayResolution <= 0.25 ? nearest : null };
}

function trimCache() {
  for (const [key, entry] of RESPONSE_CACHE.entries()) {
    if (!entry || Date.now() - entry.savedAt > MAX_STALE_AGE) RESPONSE_CACHE.delete(key);
  }
  // Siete páginas forman una pasada completa. Se conservan dos juegos para
  // que una segunda visita no expulse la primera página mientras carga +168 h.
  while (RESPONSE_CACHE.size > 16) RESPONSE_CACHE.delete(RESPONSE_CACHE.keys().next().value);
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
  const viewportCenter = {
    latitude: clamp(req.query?.viewLat, -80, 85, (requestedBounds.south + requestedBounds.north) / 2),
    longitude: clamp(req.query?.viewLon, -179.75, 179.75, (requestedBounds.west + requestedBounds.east) / 2)
  };
  const requestedLayer = req.query?.displayLayer === 'precipitation_accumulated'
    ? 'precipitation_accumulated'
    : 'precipitation_3h';
  const requestedPage = Number(req.query?.page ?? 0);
  if (!Number.isInteger(requestedPage) || requestedPage < 0 || requestedPage >= PAGE_COUNT) {
    return res.status(400).json({ ok: false, error: `La página debe estar entre 0 y ${PAGE_COUNT - 1}.` });
  }
  const requestedRunKey = String(req.query?.run || '');
  const requestedBase = String(req.query?.base || '');
  const hasPinnedIdentity = Boolean(requestedRunKey || requestedBase);
  if ((requestedPage > 0 || hasPinnedIdentity) && (!requestedRunKey || !requestedBase)) {
    return res.status(400).json({ ok: false, error: 'La página requiere la misma pasada y base NOAA de la página inicial.' });
  }
  const fixedRun = hasPinnedIdentity ? pinnedRun(requestedRunKey, requestedBase) : null;
  if (hasPinnedIdentity && !fixedRun) {
    return res.status(400).json({ ok: false, error: 'La pasada/base NOAA fijada no es válida o ya no está disponible.' });
  }
  const resolution = gridResolution(requestedBounds);
  const bounds = resolution.overview ? { ...WORLD_BOUNDS } : canonicalRegionalBounds(viewportCenter, resolution);
  const noaaBounds = alignedBounds(bounds, resolution);
  const grid = outputGrid(bounds, resolution);
  const cacheKey = [
    `page:${requestedPage}`,
    `run:${fixedRun ? runIdentity(fixedRun).key : 'latest'}`,
    resolution.code, resolution.wide ? 'wide' : resolution.overview ? 'world' : 'regional',
    bounds.south.toFixed(2), bounds.north.toFixed(2),
    bounds.west.toFixed(2), bounds.east.toFixed(2)
  ].join('|');
  const cached = RESPONSE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    res.setHeader('Cache-Control', 's-maxage=1200, stale-while-revalidate=7200');
    res.setHeader('X-Map-Cache', 'HIT');
    return res.status(200).json(responseWithFocus({ ...cached.payload, displayLayer: requestedLayer }, focus));
  }

  let loading = RESPONSE_INFLIGHT.get(cacheKey);
  if (!loading) {
    loading = (async () => {
      const selected = fixedRun
        ? { run: fixedRun, probes: new Map() }
        : await selectRun(noaaBounds, resolution);
      const offsets = pageForecastHours(requestedPage);
      const cumulative = await fetchCumulativeFrames(selected.run, offsets, noaaBounds, resolution, selected.probes);
      const intervals = buildIntervals(requestedPage === 0 ? [null, ...cumulative] : cumulative);
      if (intervals.length !== INTERVALS_PER_PAGE) {
        throw new Error(`NOAA no devolvió los ${INTERVALS_PER_PAGE} intervalos consecutivos de esta página.`);
      }
      // La hora válida es el final del intervalo. Así la lluvia de 3 h representa
      // las tres horas anteriores y el acumulado total llega exactamente hasta
      // la misma marca temporal.
      const times = intervals.map(interval => new Date(selected.run.getTime() + interval.current.forecastHour * HOUR_MS).toISOString().replace(/:00\.000Z$/, ':00'));
      const run = runIdentity(selected.run);
      const pageStartHour = requestedPage * PAGE_HOURS;
      const pageEndHour = pageStartHour + PAGE_HOURS;
      const payload = {
      ok: true,
      partial: false,
      generatedAt: new Date().toISOString(),
      transport: 'noaa-nomads-grib2-rain',
      bundle: 'precipitation_accumulation',
      displayLayer: requestedLayer,
      diagnostics: {
        native: true,
        derived: true,
        sourceVariable: 'APCP',
        interval: 'official-cumulative-field-and-consecutive-three-hour-difference',
        intervalHours: 3,
        units: 'mm'
      },
      model: {
        requested: 'gfs',
        label: resolution.overview
          ? 'NOAA GFS · precipitación oficial · fuente 1° · superficie mundial 2°'
          : resolution.wide
            ? 'NOAA GFS 0,25° · superficie europea 0,5°'
            : 'NOAA GFS 0,25° · precipitación oficial',
        sourceModel: `ncep_gfs_${resolution.code}_nomads`,
        provider: 'NOAA NOMADS',
        run: run.iso,
        resolutionDegrees: resolution.degrees,
        displayResolutionDegrees: resolution.displayDegrees,
        overview: resolution.overview,
        timeStepHours: FRAME_STEP_HOURS,
        fallback: false
      },
      pagination: {
        page: requestedPage,
        pageHours: PAGE_HOURS,
        pageCount: PAGE_COUNT,
        pageStartHour,
        pageEndHour,
        intervalsInPage: INTERVALS_PER_PAGE,
        forecastBaseHour: 0,
        forecastEndHour: FORECAST_END_HOUR,
        totalIntervals: FORECAST_END_HOUR / FRAME_STEP_HOURS,
        run: run.key,
        base: run.iso,
        nextPage: requestedPage + 1 < PAGE_COUNT ? requestedPage + 1 : null,
        complete: requestedPage === PAGE_COUNT - 1
      },
      bounds,
      grid: {
        rows: grid.rows,
        columns: grid.columns,
        stepLatitude: (bounds.north - bounds.south) / (grid.rows - 1),
        stepLongitude: (bounds.east - bounds.west) / (grid.columns - 1)
      },
      times,
      points: grid.points.map(point => compactPoint(point, intervals))
      };
      RESPONSE_CACHE.set(cacheKey, { savedAt: Date.now(), payload });
      trimCache();
      return payload;
    })();
    RESPONSE_INFLIGHT.set(cacheKey, loading);
  }

  try {
    const payload = await loading;
    res.setHeader('Cache-Control', 's-maxage=1200, stale-while-revalidate=7200');
    res.setHeader('X-Map-Cache', 'MISS');
    return res.status(200).json(responseWithFocus({ ...payload, displayLayer: requestedLayer }, focus));
  } catch (error) {
    const stale = RESPONSE_CACHE.get(cacheKey);
    if (stale && Date.now() - stale.savedAt < MAX_STALE_AGE) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=1800');
      res.setHeader('X-Map-Cache', 'STALE');
      return res.status(200).json({ ...responseWithFocus({ ...stale.payload, displayLayer: requestedLayer }, focus), stale: true });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      ok: false,
      source: 'NOAA NOMADS',
      retryAfter: 120,
      error: `NOAA GFS no pudo servir ahora la precipitación oficial solicitada. ${String(error?.message || '')}`.trim()
    });
  } finally {
    if (RESPONSE_INFLIGHT.get(cacheKey) === loading) RESPONSE_INFLIGHT.delete(cacheKey);
  }
};

module.exports._test = {
  accumulationWindow,
  parseCumulativeFrame,
  buildIntervals,
  compactPoint,
  pageForecastHours,
  pinnedRun,
  constants: {
    PAGE_HOURS,
    FORECAST_END_HOUR,
    FRAME_STEP_HOURS,
    PAGE_COUNT,
    INTERVALS_PER_PAGE
  }
};
