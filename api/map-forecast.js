const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const MARINE_OPEN_METEO = 'https://marine-api.open-meteo.com/v1/marine';

const MODELS = {
  ecmwf: { label: 'ECMWF IFS HRES · 9 km', candidates: ['ecmwf_ifs', 'best_match'] },
  arome: { label: 'Météo‑France AROME HD · 1,5 km · 48 h', candidates: ['meteofrance_arome_france_hd'] },
  icon: { label: 'DWD ICON Seamless · global/Europa según zona', candidates: ['dwd_icon_seamless', 'best_match'] },
  gfs: { label: 'NOAA GFS Seamless', candidates: ['ncep_gfs_seamless', 'best_match'] }
};
// Las variables se mantienen en el modelo elegido. Las teselas espaciales
// actuales publican reflectividad derivada y CAPE en los tres modelos; CIN se
// dibuja mediante la malla horaria cuando el dominio espacial no lo ofrece.
const GFS_ONLY_LAYERS = new Set();
// Lluvia convectiva y CAPE quedan ligados a ECMWF IFS. La densidad de rayos
// se trata como un campo opcional: si llega completa a null no se inventa.
const ECMWF_ONLY_LAYERS = new Set(['thunderstorms', 'electric_storms']);
const AROME_LAYERS = new Set(['precipitation', 'forecast_reflectivity', 'cloud', 'temperature', 'humidity', 'wind', 'gust', 'cape']);

function modelForLayer(requested, layer) {
  // La temperatura a 850 hPa no se mezcla con el selector general. Open‑Meteo
  // la publica para ECMWF IFS 0,25° y esta ruta es una malla de puntos de ese
  // campo: si falla, se informa del fallo en lugar de cambiar a GFS/best_match.
  if (layer === 't850') {
    return {
      label: 'ECMWF IFS 0,25° · temperatura a 850 hPa · malla oficial muestreada',
      candidates: ['ecmwf_ifs025'],
      sourceResolutionDegrees: 0.25
    };
  }
  if (ECMWF_ONLY_LAYERS.has(layer)) {
    return {
      label: layer === 'electric_storms'
        ? 'ECMWF IFS HRES · CAPE · potencial tormentoso · 9 km'
        : 'ECMWF IFS HRES · precipitación + CAPE · 9 km',
      candidates: ['ecmwf_ifs']
    };
  }
  if (GFS_ONLY_LAYERS.has(layer)) {
    return { label: layer === 'cin' ? 'NOAA GFS · CIN' : 'NOAA GFS Seamless', candidates: ['ncep_gfs_seamless'] };
  }
  return MODELS[requested] || MODELS.ecmwf;
}

// El visor llega hasta la misma hora del sexto día (145 marcas horarias). Se añaden 24 horas de
// margen para que los acumulados hacia delante de 24 h sigan siendo completos
// también en el último tramo de la línea temporal.
const VISIBLE_FORECAST_HOURS = 6 * 24 + 1;
const FORECAST_HOURS = VISIBLE_FORECAST_HOURS + 24;
// La malla profesional se divide en lotes moderados: aporta más detalle al
// hacer zoom sin crear URLs gigantes ni concentrar toda la carga en una sola
// petición al proveedor abierto.
const POINTS_PER_REQUEST = 80;
const BATCH_CONCURRENCY = 3;
const FETCH_TIMEOUT = 12000;
const CACHE_TTL = 2 * 60 * 60 * 1000;
const MAX_STALE_AGE = 48 * 60 * 60 * 1000;
const RESPONSE_CACHE = globalThis.__METEO_AITOR_MAP_CACHE__ ||
  (globalThis.__METEO_AITOR_MAP_CACHE__ = new Map());

const HOURLY_FIELDS = [
  'precipitation',
  'precipitation_probability',
  'rain',
  'showers',
  'snowfall',
  'cloud_cover',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
  'temperature_2m',
  'dew_point_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'temperature_850hPa',
  'cape',
  'lightning_density',
  'convective_inhibition'
];

const LAYER_FIELDS = {
  // Paquetes pequeños y reutilizables. Evitan que cada pulsación descargue
  // todas las variables del visor y reducen drásticamente los cortes por cuota.
  thermo: ['temperature_2m', 'dew_point_2m', 'relative_humidity_2m'],
  windbundle: ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'],
  precipitation: ['precipitation', 'precipitation_probability', 'rain', 'showers', 'snowfall', 'pressure_msl'],
  precipitation_accumulation: ['precipitation'],
  cloud: ['cloud_cover', 'precipitation'],
  pressure: ['pressure_msl'],
  t850: ['temperature_850hPa'],
  convection: ['cape', 'convective_inhibition'],
  thunderstorms: ['precipitation', 'cape', 'lightning_density'],
  marine: ['wave_height', 'wave_direction', 'wave_period', 'sea_surface_temperature']
};

function fieldsForLayer(bundle, requested = 'ecmwf', displayLayer = bundle) {
  if (ECMWF_ONLY_LAYERS.has(displayLayer)) return LAYER_FIELDS.thunderstorms;
  if (requested === 'arome') {
    if (['precipitation', 'forecast_reflectivity'].includes(displayLayer)) return ['precipitation'];
    if (displayLayer === 'cloud') return ['cloud_cover_low', 'precipitation'];
    if (displayLayer === 'temperature') return ['temperature_2m'];
    if (displayLayer === 'humidity') return ['relative_humidity_2m'];
    if (displayLayer === 'wind') return ['wind_speed_10m', 'wind_direction_10m'];
    if (displayLayer === 'gust') return ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'];
    if (displayLayer === 'cape') return ['cape'];
  }
  return LAYER_FIELDS[bundle] || LAYER_FIELDS.thermo;
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max, fallback) {
  return Math.max(min, Math.min(max, number(value, fallback)));
}

function grid(south, north, west, east, count) {
  const rows = count;
  // Mantiene una separación horizontal comparable a la vertical. El factor
  // fijo anterior dejaba Europa y el mundo con columnas excesivamente
  // separadas y la interpolación dibujaba fenómenos entre muestras lejanas.
  const aspect = Math.max(1, Math.min(1.8, (east - west) / Math.max(1, north - south)));
  const columns = Math.max(8, Math.min(48, Math.round(count * aspect)));
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

async function fetchJson(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
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

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function requestCandidate(points, candidate, hourlyFields) {
  const batches = chunks(points, POINTS_PER_REQUEST);
  const responses = new Array(batches.length);
  let nextBatch = 0;
  async function worker() {
    while (nextBatch < batches.length) {
      const batchIndex = nextBatch;
      nextBatch += 1;
      const batch = batches[batchIndex];
    const values = new URLSearchParams({
      latitude: batch.map(point => point.latitude).join(','),
      longitude: batch.map(point => point.longitude).join(','),
      hourly: hourlyFields.join(','),
      forecast_hours: String(candidate === 'meteofrance_arome_france_hd' ? 48 : FORECAST_HOURS),
      wind_speed_unit: 'kmh',
      temperature_unit: 'celsius',
      precipitation_unit: 'mm',
      timezone: 'UTC',
      cell_selection: 'nearest'
    });
    if (candidate !== 'best_match') values.set('models', candidate);
    const payload = await fetchJson(`${OPEN_METEO}?${values.toString()}`);
    const locations = Array.isArray(payload) ? payload : [payload];
    if (locations.length !== batch.length) {
      throw new Error('El modelo devolvió una malla incompleta.');
    }
      responses[batchIndex] = locations;
    }
  }
  await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, () => worker()));
  return responses.flat();
}

async function requestMarine(points, hourlyFields) {
  const batches = chunks(points, POINTS_PER_REQUEST);
  const responses = new Array(batches.length);
  let nextBatch = 0;
  async function worker() {
    while (nextBatch < batches.length) {
      const batchIndex = nextBatch;
      nextBatch += 1;
      const batch = batches[batchIndex];
      const values = new URLSearchParams({
        latitude: batch.map(point => point.latitude).join(','),
        longitude: batch.map(point => point.longitude).join(','),
        hourly: hourlyFields.join(','),
        forecast_hours: String(FORECAST_HOURS),
        timezone: 'UTC',
        cell_selection: 'sea'
      });
      const payload = await fetchJson(`${MARINE_OPEN_METEO}?${values.toString()}`);
      const locations = Array.isArray(payload) ? payload : [payload];
      if (locations.length !== batch.length) throw new Error('El modelo marino devolvió una malla incompleta.');
      responses[batchIndex] = locations;
    }
  }
  await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, () => worker()));
  return { result: responses.flat(), sourceModel: 'best_match' };
}

async function requestForecast(points, model, hourlyFields = HOURLY_FIELDS) {
  let lastError;
  for (let index = 0; index < model.candidates.length; index += 1) {
    const candidate = model.candidates[index];
    try {
      const result = await requestCandidate(points, candidate, hourlyFields);
      return { result, sourceModel: candidate };
    } catch (error) {
      lastError = error;
      // best_match es un respaldo de modelo, no un modo de saltarse una cuota.
      // Ante saturación, caída o timeout, repetir toda la malla con otro modelo
      // duplica la carga y suele provocar el corte que veía el usuario. Solo
      // se cambia de candidato cuando la API rechaza expresamente el modelo.
      const status = Number(error?.statusCode) || 0;
      const unsupported = [400, 404, 422].includes(status) || /model|variable|par[aá]metro|unsupported|not available/i.test(String(error?.message || ''));
      if (isRateLimitError(error) || !unsupported || index === model.candidates.length - 1) throw error;
    }
  }
  throw lastError || new Error('No se pudo cargar el modelo solicitado.');
}

function isRateLimitError(error) {
  return Number(error?.statusCode) === 429 || /minutely|rate limit|too many|l[ií]mite/i.test(String(error?.message || ''));
}

function isDailyLimitError(error) {
  return /daily api request limit|l[ií]mite diario/i.test(String(error?.message || ''));
}

function precipitationAccumulation(values, hours) {
  const series = Array.isArray(values) ? values : [];
  return series.map((_, index) => {
    let total = 0;
    // Open-Meteo publica precipitation como suma de la hora precedente.
    // Para "próximas N horas" se suman los N intervalos posteriores.
    for (let offset = 1; offset <= hours; offset += 1) {
      const value = Number(series[index + offset]);
      if (Number.isFinite(value)) total += Math.max(0, value);
    }
    return total;
  });
}

function compactPoint(result, fallbackPoint) {
  const hourly = result?.hourly || {};
  // Open-Meteo publica CIN como magnitud positiva en algunos modelos (GFS)
  // mientras que la convención meteorológica habitual lo representa como
  // energía negativa. Normalizamos solo este campo para que cero signifique
  // siempre «sin tapa» y los valores más negativos, mayor inhibición.
  const cin = Array.isArray(hourly.convective_inhibition)
    ? hourly.convective_inhibition.map(value => {
      if (value === null || value === undefined || value === '') return null;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? -Math.abs(numericValue) : null;
    })
    : [];
  // Open-Meteo no expone reflectividad de modelo como variable horaria. Para
  // la capa prevista se convierte la tasa de precipitación real del modelo a
  // dBZ con la relación Marshall-Palmer Z = 200 · R^1.6. Se etiqueta siempre
  // como estimada y nunca se mezcla con el radar observado.
  const reflectivity = Array.isArray(hourly.precipitation)
    ? hourly.precipitation.map(value => {
      if (value === null || value === undefined || value === '') return null;
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) return null;
      const rainRate = Math.max(0, numericValue);
      return rainRate <= 0.005 ? 0 : Math.max(0, 10 * Math.log10(200 * Math.pow(rainRate, 1.6)));
    })
    : [];
  const precipitation = hourly.precipitation || [];
  return {
    latitude: Number(result?.latitude ?? fallbackPoint.latitude),
    longitude: Number(result?.longitude ?? fallbackPoint.longitude),
    hourly: {
      precipitation,
      precipitation_3h: precipitationAccumulation(precipitation, 3),
      precipitation_6h: precipitationAccumulation(precipitation, 6),
      precipitation_12h: precipitationAccumulation(precipitation, 12),
      precipitation_24h: precipitationAccumulation(precipitation, 24),
      precipitation_probability: hourly.precipitation_probability || [],
      reflectivity_estimated: reflectivity,
      rain: hourly.rain || [],
      showers: hourly.showers || [],
      snowfall: hourly.snowfall || [],
      cloud_cover: hourly.cloud_cover || [],
      cloud_cover_low: hourly.cloud_cover_low || [],
      cloud_cover_mid: hourly.cloud_cover_mid || [],
      cloud_cover_high: hourly.cloud_cover_high || [],
      temperature_2m: hourly.temperature_2m || [],
      dew_point_2m: hourly.dew_point_2m || [],
      relative_humidity_2m: hourly.relative_humidity_2m || [],
      wind_speed_10m: hourly.wind_speed_10m || [],
      wind_direction_10m: hourly.wind_direction_10m || [],
      wind_gusts_10m: hourly.wind_gusts_10m || [],
      pressure_msl: hourly.pressure_msl || [],
      temperature_850hPa: hourly.temperature_850hPa || [],
      cape: hourly.cape || [],
      lightning_density: hourly.lightning_density || [],
      convective_inhibition: cin,
      wave_height: hourly.wave_height || [],
      wave_direction: hourly.wave_direction || [],
      wave_period: hourly.wave_period || [],
      sea_surface_temperature: hourly.sea_surface_temperature || []
    }
  };
}

function boundsArea(bounds) {
  return Math.max(0.001, (Number(bounds?.north) - Number(bounds?.south)) * (Number(bounds?.east) - Number(bounds?.west)));
}

function boundsOverlapScore(a, b) {
  if (!a || !b) return 0;
  const lat = Math.max(0, Math.min(a.north, b.north) - Math.max(a.south, b.south));
  const lon = Math.max(0, Math.min(a.east, b.east) - Math.max(a.west, b.west));
  if (!lat || !lon) return 0;
  const smaller = Math.min(boundsArea(a), boundsArea(b));
  const scale = Math.min(boundsArea(a), boundsArea(b)) / Math.max(boundsArea(a), boundsArea(b));
  return (lat * lon / smaller) * scale;
}

function closestStalePayload(requested, layer, displayLayer, bounds, minimumRows = 0) {
  let best = null;
  for (const entry of RESPONSE_CACHE.values()) {
    if (!entry?.payload || Date.now() - entry.savedAt >= MAX_STALE_AGE) continue;
    if (
      entry.payload.bundle !== layer ||
      entry.payload.displayLayer !== displayLayer ||
      entry.payload.model?.requested !== requested ||
      (displayLayer === 't850' && entry.payload.model?.sourceModel !== 'ecmwf_ifs025') ||
      Number(entry.payload.grid?.rows || 0) < minimumRows
    ) continue;
    const score = boundsOverlapScore(bounds, entry.payload.bounds);
    if (score < 0.25 || (best && score <= best.score)) continue;
    best = { score, entry };
  }
  return best?.entry || null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  // El visor puede abrirse a escala planetaria. Web Mercator no llega a los
  // polos, por eso se conserva un margen seguro en latitud.
  const south = clamp(req.query?.south, -80, 80, 35);
  const north = clamp(req.query?.north, -79, 85, 47);
  const west = clamp(req.query?.west, -180, 179, -12);
  const east = clamp(req.query?.east, -179, 180, 8);
  if (north <= south || east <= west || north - south < 0.03 || east - west < 0.03) {
    return res.status(400).json({ ok: false, error: 'El área del mapa es demasiado pequeña.' });
  }
  const requested = String(req.query?.model || 'ecmwf').toLowerCase();
  // Al acercar el mapa el cliente puede pedir una malla más densa. El límite
  // mantiene las consultas en un tamaño razonable para un servicio abierto.
  // Las capas térmicas, que solo solicitan una variable, admiten una malla más
  // detallada. El resto continúa usando una única consulta compacta.
  const density = clamp(req.query?.density, 6, 28, 10);
  const mapGrid = grid(south, north, west, east, density);
  const layer = String(req.query?.layer || 'thermo').toLowerCase();
  const displayLayer = String(req.query?.displayLayer || layer).toLowerCase();
  const ecmwfOnlyRequested = ECMWF_ONLY_LAYERS.has(displayLayer);
  const t850Requested = displayLayer === 't850';
  if (requested === 'arome' && !ecmwfOnlyRequested && !t850Requested && !AROME_LAYERS.has(displayLayer)) {
    return res.status(422).json({ ok: false, error: 'AROME HD no publica esta capa en la salida utilizada; no se sustituye por otro modelo.' });
  }
  const cinRequested = displayLayer === 'cin';
  // GFS publica CIN de forma operativa en esta ruta, mientras que las salidas
  // específicas de ECMWF/ICON pueden devolver la serie completa a null. CIN
  // se sirve por tanto con GFS y se identifica expresamente en la respuesta.
  const marineRequested = displayLayer === 'sea_temperature' || displayLayer === 'waves';
  const effectiveRequested = marineRequested ? 'marine' : (ecmwfOnlyRequested || t850Requested) ? 'ecmwf' : GFS_ONLY_LAYERS.has(displayLayer) ? 'gfs' : requested;
  const model = marineRequested ? { label: 'Open‑Meteo Marine', candidates: ['best_match'] } : modelForLayer(effectiveRequested, displayLayer);
  const focusLatitude = clamp(req.query?.focusLat, -80, 85, 43.4201);
  const focusLongitude = clamp(req.query?.focusLon, -180, 180, -2.7224);
  const focusPoint = { latitude: Number(focusLatitude.toFixed(4)), longitude: Number(focusLongitude.toFixed(4)) };
  const requestPoints = [...mapGrid.points, focusPoint];
  const cacheKey = [
    effectiveRequested, layer, displayLayer, density,
    south.toFixed(2), north.toFixed(2), west.toFixed(2), east.toFixed(2),
    focusPoint.latitude.toFixed(2), focusPoint.longitude.toFixed(2)
  ].join('|');
  const cached = RESPONSE_CACHE.get(cacheKey);
  const cachedModelIsValid = !t850Requested || cached?.payload?.model?.sourceModel === 'ecmwf_ifs025';
  if (cached && cachedModelIsValid && Date.now() - cached.savedAt < CACHE_TTL) {
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=21600');
    res.setHeader('X-Map-Cache', 'HIT');
    return res.status(200).json(cached.payload);
  }

  try {
    // CIN no está publicado en todas las combinaciones de modelo y dominio.
    // Solo se pide cuando esa capa está activa: de este modo GFS/ICON no
    // retrasan las capas habituales por una variable convectiva opcional.
    let forecast;
    let cinAvailable = cinRequested;
    const requestedFields = fieldsForLayer(layer, effectiveRequested, displayLayer);
    forecast = marineRequested ? await requestMarine(requestPoints, requestedFields) : await requestForecast(requestPoints, model, requestedFields);
    let { result: locations, sourceModel } = forecast;
    if (t850Requested && sourceModel !== 'ecmwf_ifs025') {
      throw new Error('La temperatura a 850 hPa solo admite ECMWF IFS 0,25°; no se sustituye por otro modelo.');
    }
    if (cinRequested && cinAvailable) {
      cinAvailable = locations.some(location =>
        location?.hourly?.convective_inhibition?.some(value =>
          value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
        )
      );
      // Una respuesta HTTP correcta puede contener el campo completo a null.
      // No se sustituye por otro modelo: estas capas quedan ligadas a GFS y se
      // reintentan en su siguiente pasada si la serie aún no está publicada.
    }
    if (cinRequested && !cinAvailable) {
      throw new Error('CIN no está publicado para esta pasada; se volverá a intentar automáticamente.');
    }
    const lightningAvailable = ecmwfOnlyRequested && locations.some(location =>
      location?.hourly?.lightning_density?.some(value =>
        value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
      )
    );
    const first = locations[0]?.hourly || {};
    // Se muestran seis días completos. Las 24 horas extra solicitadas arriba
    // se reservan para que los acumulados hacia delante no queden truncados.
    const times = Array.isArray(first.time) ? first.time.slice(0, VISIBLE_FORECAST_HOURS) : [];
    if (!times.length || locations.length !== requestPoints.length) {
      throw new Error('El modelo no devolvió una malla temporal utilizable.');
    }
    const gridLocations = locations.slice(0, mapGrid.points.length);
    const exactLocation = locations[mapGrid.points.length];
    const stepLatitude = (north - south) / (mapGrid.rows - 1);
    const stepLongitude = (east - west) / (mapGrid.columns - 1);
    // Aunque el cliente pida puntos más juntos, la fuente no gana detalle por
    // debajo de su malla nominal de 0,25°. Se publica el paso efectivo para no
    // presentar la superficie interpolada como una tesela nativa de 25 km.
    const displayResolutionDegrees = t850Requested
      ? Math.max(model.sourceResolutionDegrees, Math.abs(stepLatitude), Math.abs(stepLongitude))
      : null;
    const displayResolutionLabel = displayResolutionDegrees === null
      ? null
      : `${displayResolutionDegrees.toFixed(displayResolutionDegrees < 0.1 ? 3 : 2).replace('.', ',')}°`;
    const payload = {
      ok: true,
      generatedAt: new Date().toISOString(),
      model: {
        requested: effectiveRequested,
        label: marineRequested ? model.label : sourceModel === 'best_match' ? 'Modelo automático · respaldo' : model.label,
        sourceModel,
        cinAvailable,
        fallback: !marineRequested && sourceModel === 'best_match',
        sampled: t850Requested,
        sampledFallback: false,
        provider: marineRequested ? 'Open-Meteo Marine' : t850Requested ? 'Open‑Meteo / ECMWF' : 'Open-Meteo',
        resolution: marineRequested
          ? 'Mejor modelo marino disponible'
          : t850Requested
            ? `Fuente ECMWF IFS 0,25° · visualización muestreada ${displayResolutionLabel}`
            : effectiveRequested === 'arome'
              ? 'AROME France HD 0.01° · 1,5 km'
              : effectiveRequested === 'gfs'
                ? 'GFS seamless'
                : effectiveRequested === 'icon'
                  ? 'ICON seamless'
                  : 'ECMWF IFS HRES',
        sourceResolutionDegrees: t850Requested ? model.sourceResolutionDegrees : undefined,
        displayResolutionDegrees
      },
      diagnostics: displayLayer === 'forecast_reflectivity'
        ? { native: false, derived: true, sourceVariable: 'precipitation', interval: 'preceding_hour_sum', units: 'dBZ', formula: 'Z=200·R^1.6' }
        : (displayLayer === 'thunderstorms' || displayLayer === 'electric_storms')
          ? { native: true, derived: false, sourceVariable: displayLayer === 'electric_storms' ? 'cape' : 'precipitation', supportVariable: 'cape', lightningVariable: 'lightning_density', lightningAvailable, interval: displayLayer === 'electric_storms' ? 'instantaneous' : 'preceding_hour_sum', units: displayLayer === 'electric_storms' ? 'J/kg' : 'mm', phenomenon: displayLayer === 'electric_storms' ? 'ECMWF CAPE; convective potential, not observed lightning' : 'ECMWF precipitation plus CAPE; lightning density is optional and observed lightning remains on official AEMET/Euskalmet layers' }
        : displayLayer === 'precipitation_3h'
          ? { native: false, derived: true, sourceVariable: 'precipitation', interval: 'three-hour-forward-sum', units: 'mm', samples: 3 }
        : displayLayer === 't850'
          ? { native: false, derived: false, sampled: true, sourceVariable: 'temperature_850hPa', sourceModel: 'ecmwf_ifs025', sourceResolutionDegrees: model.sourceResolutionDegrees, displayResolutionDegrees, units: '°C', interpolation: 'solo visual; los valores de origen no se alteran' }
        : displayLayer === 'cape'
          ? { native: true, derived: false, sourceVariable: 'cape', parcelType: 'not-specified-by-provider', units: 'J/kg' }
        : displayLayer === 'cin'
            ? { native: true, derived: false, sourceVariable: 'convective_inhibition', parcelType: 'not-specified-by-provider', units: 'J/kg', signConvention: 'negative=inhibition' }
            : null,
      bundle: layer,
      displayLayer,
      bounds: { south, north, west, east },
      focus: focusPoint,
      grid: {
        rows: mapGrid.rows,
        columns: mapGrid.columns,
        stepLatitude,
        stepLongitude
      },
      times,
      points: gridLocations.map((item, index) => compactPoint(item, mapGrid.points[index])),
      focusPoint: compactPoint(exactLocation, focusPoint)
    };
    RESPONSE_CACHE.set(cacheKey, { savedAt: Date.now(), payload });
    if (RESPONSE_CACHE.size > 24) {
      const oldest = RESPONSE_CACHE.keys().next().value;
      RESPONSE_CACHE.delete(oldest);
    }
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=21600');
    res.setHeader('X-Map-Cache', 'MISS');
    return res.status(200).json(payload);
  } catch (error) {
    const rateLimited = isRateLimitError(error);
    const dailyLimited = isDailyLimitError(error);
    // Si la instancia conserva una malla anterior, es preferible mostrarla
    // identificada como caché antes que dejar el visor completamente vacío.
    const detailSensitive = ['precipitation', 'thunderstorms', 'electric_storms', 'precipitation_3h', 'precipitation_6h', 'precipitation_12h', 'precipitation_24h', 'rain', 'showers', 'snowfall', 'precipitation_probability', 'forecast_reflectivity', 'cloud'].includes(displayLayer);
    const nearby = (cachedModelIsValid ? cached : null) || closestStalePayload(effectiveRequested, layer, displayLayer, { south, north, west, east }, detailSensitive ? Math.max(18, Math.floor(density * 0.8)) : 0);
    const canUseStale = nearby?.payload && Date.now() - nearby.savedAt < MAX_STALE_AGE;
    if (canUseStale) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=21600');
      res.setHeader('X-Map-Cache', 'STALE');
      return res.status(200).json({ ...nearby.payload, stale: true, partial: nearby !== cached });
    }
    res.setHeader('Cache-Control', 'no-store');
    if (rateLimited) res.setHeader('Retry-After', dailyLimited ? '3600' : '60');
    return res.status(rateLimited ? 429 : 502).json({
      ok: false,
      source: 'Open‑Meteo',
      retryAfter: dailyLimited ? 3600 : 60,
      error: rateLimited
        ? (dailyLimited
          ? 'Open‑Meteo ha alcanzado hoy su límite diario. El respaldo seguirá disponible y la malla propia se reintentará más tarde.'
          : 'El proveedor de modelos ha alcanzado temporalmente su límite. La aplicación volverá a intentarlo automáticamente.')
        : (error?.name === 'AbortError' ? 'El modelo tardó demasiado en responder.' : (error?.message || 'No se pudo cargar el modelo.'))
    });
  }
};
