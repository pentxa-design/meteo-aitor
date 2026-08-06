const BASE_URL = 'https://opendata.aemet.es/opendata';
const MUNICIPALITY_CACHE_MS = 6 * 60 * 60 * 1000;
let municipalityCache = { expiresAt: 0, items: [] };

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function numberValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (value && typeof value === 'object' && 'value' in value) return numberValue(value.value);
  return null;
}

function valuesOf(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map(numberValue).filter(item => item !== null);
}

function maxValue(value) {
  const values = valuesOf(value);
  return values.length ? Math.max(...values) : null;
}

function safeJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch (_) {
    return null;
  }
}

async function fetchJson(url, headers = {}, timeout = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...headers }
    });
    const text = await response.text();
    const data = safeJson(text);
    if (!response.ok) {
      const error = new Error(`AEMET respondió HTTP ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }
    if (data === null) {
      const error = new Error('AEMET devolvió una respuesta que no es JSON.');
      error.statusCode = 502;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function aemetData(path, apiKey) {
  const gateway = await fetchJson(`${BASE_URL}/api${path}`, { api_key: apiKey });
  const status = Number(gateway?.estado);
  if (status !== 200 || !gateway?.datos) {
    const error = new Error(gateway?.descripcion || 'AEMET no devolvió una dirección de datos.');
    error.statusCode = status >= 400 && status < 600 ? status : 502;
    throw error;
  }
  return fetchJson(gateway.datos);
}

function municipalityCode(item) {
  const digits = String(item?.id || item?.id_old || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 5 ? digits.slice(-5) : digits.padStart(5, '0');
}

function municipalityName(item) {
  return String(item?.nombre || item?.capital || '').trim();
}

function municipalityProvince(item) {
  return String(item?.nombre_provincia || item?.provincia || '').trim();
}

function municipalityCoordinates(item) {
  const latitude = numberValue(item?.latitud_dec);
  const longitude = numberValue(item?.longitud_dec);
  return { latitude, longitude };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function municipalities(apiKey) {
  if (municipalityCache.expiresAt > Date.now() && municipalityCache.items.length) {
    return municipalityCache.items;
  }
  const raw = await aemetData('/maestro/municipios', apiKey);
  const items = Array.isArray(raw) ? raw : [];
  municipalityCache = {
    expiresAt: Date.now() + MUNICIPALITY_CACHE_MS,
    items
  };
  return items;
}

function nearest(items, latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return items[0] || null;
  return items
    .map(item => {
      const coordinates = municipalityCoordinates(item);
      const distance = Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
        ? haversineKm(latitude, longitude, coordinates.latitude, coordinates.longitude)
        : Number.POSITIVE_INFINITY;
      return { item, distance };
    })
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

function resolveMunicipality(items, query = {}) {
  const targetName = normalizeText(query.name);
  const targetProvince = normalizeText(query.admin1);
  const latitude = numberValue(query.latitude);
  const longitude = numberValue(query.longitude);
  const enriched = items.map(item => ({
    item,
    name: normalizeText(municipalityName(item)),
    province: normalizeText(municipalityProvince(item))
  })).filter(entry => municipalityCode(entry.item));

  let candidates = enriched.filter(entry => targetName && entry.name === targetName);
  if (candidates.length && targetProvince) {
    const provinceMatches = candidates.filter(entry =>
      entry.province.includes(targetProvince) || targetProvince.includes(entry.province)
    );
    if (provinceMatches.length) candidates = provinceMatches;
  }

  if (!candidates.length && targetName) {
    candidates = enriched.filter(entry =>
      entry.name.startsWith(targetName) || targetName.startsWith(entry.name)
    );
  }

  if (!candidates.length && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const closest = nearest(enriched.map(entry => entry.item), latitude, longitude);
    if (closest && closest.distance <= 35) return closest.item;
  }

  if (!candidates.length) return null;
  return nearest(candidates.map(entry => entry.item), latitude, longitude)?.item || candidates[0].item;
}

function preferredPeriod(items = [], periods = []) {
  for (const period of periods) {
    const match = items.find(item => String(item?.periodo || '') === period && String(item?.descripcion || '').trim());
    if (match) return match;
  }
  return items.find(item => String(item?.descripcion || '').trim()) || null;
}

function maxFromItems(items = [], key = 'value') {
  const values = items.flatMap(item => valuesOf(item?.[key]));
  return values.length ? Math.max(...values) : null;
}

function normalizeDaily(raw) {
  const forecast = Array.isArray(raw) ? raw[0] : raw;
  const days = forecast?.prediccion?.dia;
  if (!Array.isArray(days)) return [];
  return days.map(day => {
    const sky = preferredPeriod(day.estadoCielo, ['00-24', '12-24', '00-12']);
    const winds = Array.isArray(day.viento) ? day.viento : [];
    const strongestWind = winds
      .map(item => ({ item, speed: maxValue(item?.velocidad) }))
      .filter(entry => entry.speed !== null)
      .sort((a, b) => b.speed - a.speed)[0];
    return {
      date: String(day?.fecha || '').slice(0, 10),
      description: String(sky?.descripcion || '').trim(),
      tempMax: numberValue(day?.temperatura?.maxima),
      tempMin: numberValue(day?.temperatura?.minima),
      precipitationProbability: maxFromItems(day?.probPrecipitacion),
      windSpeed: strongestWind?.speed ?? null,
      windDirection: String(strongestWind?.item?.direccion || '').trim(),
      windGust: maxFromItems(day?.rachaMax),
      uvMax: numberValue(day?.uvMax),
      source: 'AEMET'
    };
  }).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date));
}

function itemForHour(items = [], hour) {
  return items.find(item => String(item?.periodo || '').padStart(2, '0') === hour) || null;
}

function normalizeHourly(raw) {
  const forecast = Array.isArray(raw) ? raw[0] : raw;
  const days = forecast?.prediccion?.dia;
  if (!Array.isArray(days)) return [];
  const hourly = [];
  days.forEach(day => {
    const date = String(day?.fecha || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const periods = new Set();
    ['estadoCielo', 'temperatura', 'probPrecipitacion', 'precipitacion', 'humedadRelativa']
      .forEach(key => (Array.isArray(day?.[key]) ? day[key] : []).forEach(item => {
        const rawPeriod = String(item?.periodo || '');
        if (/^\d{1,2}$/.test(rawPeriod)) periods.add(rawPeriod.padStart(2, '0'));
      }));
    [...periods].sort().forEach(hour => {
      const sky = itemForHour(day.estadoCielo, hour);
      const windItems = (Array.isArray(day.vientoAndRachaMax) ? day.vientoAndRachaMax : [])
        .filter(item => String(item?.periodo || '').padStart(2, '0') === hour);
      const wind = windItems.find(item => item?.direccion !== undefined || item?.velocidad !== undefined);
      const gust = windItems
        .filter(item => item !== wind)
        .flatMap(item => valuesOf(item?.value))
        .sort((a, b) => b - a)[0];
      hourly.push({
        time: `${date}T${hour}:00`,
        description: String(sky?.descripcion || '').trim(),
        temperature: numberValue(itemForHour(day.temperatura, hour)?.value),
        precipitationProbability: numberValue(itemForHour(day.probPrecipitacion, hour)?.value),
        precipitation: numberValue(itemForHour(day.precipitacion, hour)?.value),
        humidity: numberValue(itemForHour(day.humedadRelativa, hour)?.value),
        windSpeed: maxValue(wind?.velocidad),
        windDirection: Array.isArray(wind?.direccion) ? String(wind.direccion[0] || '') : String(wind?.direccion || ''),
        windGust: gust ?? null,
        source: 'AEMET'
      });
    });
  });
  return hourly;
}

function safeError(error) {
  const message = error?.name === 'AbortError'
    ? 'AEMET tardó demasiado en responder.'
    : (error instanceof Error ? error.message : 'Error desconocido');
  const status = Number(error?.statusCode) || 500;
  return { message, status: status >= 400 && status < 600 ? status : 500 };
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const apiKey = String(process.env.AEMET_API_KEY || '').trim();
  if (!apiKey) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      ok: false,
      source: 'AEMET',
      error: 'Falta la variable privada AEMET_API_KEY en Vercel.'
    });
  }

  try {
    const query = {
      name: String(req.query?.name || '').trim().slice(0, 100),
      admin1: String(req.query?.admin1 || '').trim().slice(0, 100),
      latitude: req.query?.lat,
      longitude: req.query?.lon
    };
    const municipality = resolveMunicipality(await municipalities(apiKey), query);
    if (!municipality) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(404).json({
        ok: false,
        source: 'AEMET',
        error: `No se encontró «${query.name || 'esa ubicación'}» entre los municipios de AEMET.`
      });
    }

    const code = municipalityCode(municipality);
    const [dailyResult, hourlyResult] = await Promise.allSettled([
      aemetData(`/prediccion/especifica/municipio/diaria/${encodeURIComponent(code)}`, apiKey),
      aemetData(`/prediccion/especifica/municipio/horaria/${encodeURIComponent(code)}`, apiKey)
    ]);
    const daily = dailyResult.status === 'fulfilled' ? normalizeDaily(dailyResult.value) : [];
    const hourly = hourlyResult.status === 'fulfilled' ? normalizeHourly(hourlyResult.value) : [];
    if (!daily.length && !hourly.length) {
      const firstError = dailyResult.status === 'rejected' ? dailyResult.reason : hourlyResult.reason;
      throw firstError || new Error('AEMET no devolvió una previsión utilizable.');
    }

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({
      ok: true,
      source: 'AEMET',
      generatedAt: new Date().toISOString(),
      municipality: {
        code,
        name: municipalityName(municipality) || query.name,
        province: municipalityProvince(municipality),
        ...municipalityCoordinates(municipality)
      },
      daily,
      hourly,
      coverageNote: 'AEMET aporta la previsión oficial disponible; los campos no publicados se completan con el respaldo numérico.'
    });
  } catch (error) {
    const safe = safeError(error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(safe.status).json({
      ok: false,
      source: 'AEMET',
      error: safe.message,
      hint: 'Comprueba AEMET_API_KEY y vuelve a desplegar el proyecto en Vercel.'
    });
  }
}

module.exports = handler;
module.exports._test = {
  normalizeText,
  municipalityCode,
  resolveMunicipality,
  normalizeDaily,
  normalizeHourly
};
