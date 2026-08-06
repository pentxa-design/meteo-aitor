const crypto = require('node:crypto');

const BASE_URL = 'https://api.euskadi.eus';
const REGION_ID = 'basque_country';
const LOCATION_CACHE_MS = 6 * 60 * 60 * 1000;
const FORECAST_CACHE_FRESH_MS = 5 * 60 * 1000;
const FORECAST_CACHE_STALE_MS = 24 * 60 * 60 * 1000;
let locationCache = { expiresAt: 0, items: [], complete: false };
const forecastCache = globalThis.__METEO_AITOR_EUSKALMET_CACHE__ || new Map();
globalThis.__METEO_AITOR_EUSKALMET_CACHE__ = forecastCache;
const KNOWN_LOCATIONS = new Map([
  ['bermeo', { regionId: REGION_ID, zoneId: 'coast_zone', zoneName: 'Costa', locationId: 'bermeo', locationName: 'Bermeo', raw: null }]
]);

function rememberForecast(key, payload) {
  forecastCache.delete(key);
  forecastCache.set(key, { savedAt: Date.now(), payload });
  while (forecastCache.size > 12) forecastCache.delete(forecastCache.keys().next().value);
}

function normalizePrivateKey(value) {
  return String(value || '').replace(/\\n/g, '\n').trim();
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function buildJwt() {
  const issuer = process.env.EUSKALMET_ISSUER;
  const email = process.env.EUSKALMET_EMAIL;
  const loginId = process.env.EUSKALMET_LOGIN_ID;
  const privateKey = normalizePrivateKey(process.env.EUSKALMET_PRIVATE_KEY);
  const missing = [
    !issuer && 'EUSKALMET_ISSUER',
    !(email || loginId) && 'EUSKALMET_EMAIL o EUSKALMET_LOGIN_ID',
    !privateKey && 'EUSKALMET_PRIVATE_KEY'
  ].filter(Boolean);
  if (missing.length) {
    const error = new Error(`Faltan variables: ${missing.join(', ')}`);
    error.statusCode = 503;
    throw error;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    aud: 'met01.apikey',
    iss: issuer,
    iat: now,
    exp: now + 300,
    version: '1.0.0',
    ...(email ? { email } : { loginId })
  };
  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
  return `${unsigned}.${signature}`;
}

async function apiGet(path, token, externalSignal = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const abortFromExternal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else if (externalSignal) externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = { rawText: text.slice(0, 400) };
    }
    if (!response.ok) {
      const error = new Error(`Euskalmet respondió HTTP ${response.status}`);
      error.statusCode = response.status;
      error.details = { path, response: data };
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', abortFromExternal);
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['items', 'content', 'results', 'data', 'zones', 'locations', 'regionZones', 'regionZoneLocations']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

function firstValue(object, keys) {
  if (!object || typeof object !== 'object') return undefined;
  for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null && object[key] !== '') return object[key];
  }
  return undefined;
}

function zoneIdOf(zone) {
  return String(firstValue(zone, ['regionZoneId', 'zoneId', 'id', 'oid', 'key']) || '').split('/').filter(Boolean).pop();
}

function locationIdOf(location) {
  return String(firstValue(location, ['regionZoneLocationId', 'locationId', 'id', 'oid', 'key']) || '').split('/').filter(Boolean).pop();
}

function displayNameOf(item) {
  const direct = firstValue(item, ['name', 'nombre', 'description', 'municipalityName', 'locationName']);
  if (typeof direct === 'string') return direct;
  const names = firstValue(item, ['nameByLang', 'names', 'translations']);
  if (names && typeof names === 'object') {
    return names.SPANISH || names.spanish || names.es || names.BASQUE || names.basque || names.eu || '';
  }
  return '';
}

function findLocationMatch(items, target) {
  const exact = items.find(item => [item.locationId, item.locationName].some(value => normalizeText(value) === target));
  if (exact) return exact;
  return items.find(item => [item.locationId, item.locationName].some(value => {
    const normalized = normalizeText(value);
    return normalized && (normalized.includes(target) || target.includes(normalized));
  })) || null;
}

async function discoverLocation(name, token) {
  const zonesResponse = await apiGet(`/euskalmet/geo/regions/${REGION_ID}/zones`, token);
  const zones = asList(zonesResponse);
  const target = normalizeText(name);
  const discoveryController = new AbortController();
  const requests = zones.map(async zone => {
      const zoneId = zoneIdOf(zone);
      if (!zoneId) return [];
      const payload = await apiGet(`/euskalmet/geo/regions/${REGION_ID}/zones/${encodeURIComponent(zoneId)}/locations`, token, discoveryController.signal);
      return asList(payload).map(location => ({
        regionId: REGION_ID,
        zoneId,
        zoneName: displayNameOf(zone),
        locationId: locationIdOf(location),
        locationName: displayNameOf(location),
        raw: location
      })).filter(item => item.locationId);
  });

  // En un arranque en frío no se espera al catálogo completo si la zona de la
  // localidad solicitada ya ha respondido. El resto solo se usa para construir
  // una caché completa y nunca se guarda un índice parcial como si fuera válido.
  const allResults = Promise.allSettled(requests);
  const earlyMatch = Promise.any(requests.map(request => request.then(items => {
    const match = findLocationMatch(items, target);
    if (!match) throw new Error('La zona no contiene la localidad solicitada.');
    return match;
  }))).catch(() => null);
  const firstMatch = await Promise.race([earlyMatch, allResults.then(() => null)]);
  if (firstMatch) {
    discoveryController.abort();
    return { match: firstMatch, complete: false };
  }

  const results = await allResults;
  const all = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const complete = results.every(result => result.status === 'fulfilled');
  if (complete) locationCache = { expiresAt: Date.now() + LOCATION_CACHE_MS, items: all, complete: true };
  return { match: findLocationMatch(all, target), complete };
}

async function resolveLocation(name, token) {
  const known = KNOWN_LOCATIONS.get(normalizeText(name));
  if (known) return known;
  const target = normalizeText(name);
  if (locationCache.complete && locationCache.expiresAt > Date.now() && locationCache.items.length) {
    return findLocationMatch(locationCache.items, target);
  }
  const discovery = await discoverLocation(name, token);
  if (discovery.match) return discovery.match;
  if (!discovery.complete) {
    const error = new Error('El catálogo de localidades de Euskalmet llegó incompleto. Se volverá a intentar.');
    error.statusCode = 503;
    throw error;
  }
  return null;
}

function madridDateFor(value) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  return formatter.format(value);
}

function madridDate(offsetDays = 0) {
  const today = madridDateFor(new Date());
  const base = new Date(`${today}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return madridDateFor(base);
}

function madridDateTime(value) {
  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function secondsUntilMadridDateChange() {
  const now = Date.now();
  const currentDate = madridDateFor(new Date(now));
  let low = now;
  let high = now + (36 * 60 * 60 * 1000);
  while (madridDateFor(new Date(high)) === currentDate) high += 12 * 60 * 60 * 1000;
  while (high - low > 1000) {
    const middle = Math.floor((low + high) / 2);
    if (madridDateFor(new Date(middle)) === currentDate) low = middle;
    else high = middle;
  }
  return Math.max(1, Math.floor((high - now) / 1000));
}

function forecastCacheControl(maxAgeSeconds = 300) {
  const remaining = secondsUntilMadridDateChange();
  if (remaining <= 2) return 'no-store';
  const ttl = Math.max(1, Math.min(maxAgeSeconds, remaining - 1));
  return `public, max-age=0, s-maxage=${ttl}, must-revalidate`;
}

function forecastCacheKey(name, requestedDays, atDate) {
  return `${normalizeText(name)}:${requestedDays}:${atDate}`;
}

function splitDate(date) {
  const [year, month, day] = date.split('-');
  return { year, month, day, compact: `${year}${month}${day}` };
}

function numberValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (value && typeof value === 'object') {
    for (const key of ['value', 'amount', 'numericValue', 'measurement']) {
      const found = numberValue(value[key]);
      if (found !== null) return found;
    }
  }
  return null;
}

function textValue(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    for (const key of ['SPANISH', 'spanish', 'es', 'ES', 'text', 'description', 'value']) {
      const found = textValue(value[key]);
      if (found) return found;
    }
  }
  return '';
}

function deepFind(object, wantedKeys, predicate, maxDepth = 8) {
  const wanted = wantedKeys.map(normalizeText);
  const visited = new Set();
  function walk(value, depth) {
    if (depth > maxDepth || value === null || value === undefined) return null;
    if (typeof value !== 'object') return null;
    if (visited.has(value)) return null;
    visited.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (wanted.includes(normalizeText(key))) {
        const result = predicate(child);
        if (result !== null && result !== '' && result !== undefined) return result;
      }
    }
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') {
        const result = walk(child, depth + 1);
        if (result !== null && result !== '' && result !== undefined) return result;
      }
    }
    return null;
  }
  return walk(object, 0);
}

function objectValue(value) {
  return value && typeof value === 'object' ? value : null;
}

function unitValue(value) {
  if (!value || typeof value !== 'object') return '';
  return textValue(firstValue(value, ['unit', 'units', 'unidad']));
}

function dateValue(value, fallback = '') {
  const text = textValue(value) || (typeof value === 'string' ? value.trim() : '');
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const compact = text.match(/\b(\d{4})(\d{2})(\d{2})\b/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return fallback;
}

function dateTimeValue(value, fallbackDate = '') {
  const text = textValue(value) || (typeof value === 'string' ? value.trim() : '');
  if (!text) return '';
  const zonedIso = text.match(/\b(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})/i);
  if (zonedIso) {
    let date = `${zonedIso[1]}-${zonedIso[2]}-${zonedIso[3]}`;
    let hour = zonedIso[4];
    if (hour === '24') {
      if (zonedIso[5] !== '00' || (zonedIso[6] && zonedIso[6] !== '00')) return '';
      date = addDateDays(date, 1);
      hour = '00';
    }
    const zone = zonedIso[7].toUpperCase() === 'Z'
      ? 'Z'
      : `${zonedIso[7].slice(0, 3)}:${zonedIso[7].slice(-2)}`;
    return madridDateTime(`${date}T${hour}:${zonedIso[5]}:${zonedIso[6] || '00'}${zone}`);
  }
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?/);
  if (iso) return clockDateTime(`${iso[1]}-${iso[2]}-${iso[3]}`, iso[4], iso[5]);
  const compact = text.match(/\b(\d{4})(\d{2})(\d{2})[T _-]?(\d{2})(\d{2})\b/);
  if (compact) return clockDateTime(`${compact[1]}-${compact[2]}-${compact[3]}`, compact[4], compact[5]);
  const clock = text.match(/\b([01]?\d|2[0-3]|24):([0-5]\d)\b/);
  if (clock && fallbackDate) return clockDateTime(fallbackDate, clock[1], clock[2]);
  return dateValue(text, '');
}

function addDateDays(date, amount) {
  const instant = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(instant.getTime())) return date;
  instant.setUTCDate(instant.getUTCDate() + amount);
  return instant.toISOString().slice(0, 10);
}

function clockDateTime(date, hourValue, minuteValue = '00') {
  const hour = String(hourValue).padStart(2, '0');
  const minute = String(minuteValue || '00').padStart(2, '0');
  if (hour === '24') return minute === '00' ? `${addDateDays(date, 1)}T00:00` : '';
  if (!/^(?:[01]\d|2[0-3])$/.test(hour) || !/^[0-5]\d$/.test(minute)) return '';
  return `${date}T${hour}:${minute}`;
}

function rangeLabel(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const direct = textValue(firstValue(value, ['label', 'name', 'description', 'text']));
  if (direct) return direct;
  const start = firstValue(value, ['start', 'from', 'begin', 'startTime', 'initialDate']);
  const end = firstValue(value, ['end', 'to', 'finish', 'endTime', 'finalDate']);
  return [start, end].filter(item => item !== undefined && item !== null && item !== '').map(String).join(' - ');
}

function rangeBounds(block, date) {
  const rangeValue = firstValue(block, ['range', 'timeRange', 'periodRange', 'interval']);
  const label = rangeLabel(rangeValue);
  const rangeObject = objectValue(rangeValue) || {};
  const explicitStart = firstValue(block, ['time', 'startTime', 'from', 'start', 'begin']) ??
    firstValue(rangeObject, ['time', 'startTime', 'from', 'start', 'begin', 'initialDate']);
  const explicitEnd = firstValue(block, ['endTime', 'to', 'end', 'finish']) ??
    firstValue(rangeObject, ['endTime', 'to', 'end', 'finish', 'finalDate']);
  let time = dateTimeValue(explicitStart, date);
  let endTime = dateTimeValue(explicitEnd, date);

  if ((!time || !endTime) && label) {
    const isoValues = [...label.matchAll(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/gi)]
      .map(match => dateTimeValue(match[0], date));
    if (!time && isoValues[0]) time = isoValues[0];
    if (!endTime && isoValues[1]) endTime = isoValues[1];
  }

  if ((!time || !endTime) && label) {
    const pair = label.match(/(?:^|\s)([01]?\d|2[0-3]|24)(?::([0-5]\d))?\s*(?:-|–|—|\/|\ba\b)\s*([01]?\d|2[0-3]|24)(?::([0-5]\d))?(?:\s|$)/i);
    if (pair) {
      if (!time) time = clockDateTime(date, pair[1], pair[2] || '00');
      if (!endTime) endTime = clockDateTime(date, pair[3], pair[4] || '00');
    }
  }

  if (time && endTime && endTime <= time) {
    const nextDate = addDateDays(endTime.slice(0, 10), 1);
    endTime = `${nextDate}${endTime.slice(10)}`;
  }
  return { range: label, time: time || null, endTime: endTime || null };
}

function setItems(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['set', 'items', 'content', 'results', 'data', 'values']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

function collectContainerItems(raw, containerKeys, maxDepth = 6) {
  const wanted = new Set(containerKeys.map(normalizeText));
  const found = [];
  const visited = new Set();
  function walk(value, depth) {
    if (depth > maxDepth || !value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach(item => walk(item, depth + 1));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (wanted.has(normalizeText(key))) {
        const items = setItems(child);
        if (items.length) found.push(...items);
        else if (child && typeof child === 'object') found.push(child);
        continue;
      }
      if (child && typeof child === 'object') walk(child, depth + 1);
    }
  }
  walk(raw, 0);
  return found;
}

function normalizeSingleSymbol(value) {
  if (!value || typeof value !== 'object') return null;
  const weather = objectValue(firstValue(value, ['weather', 'symbol', 'condition'])) || value;
  const id = firstValue(weather, ['id', 'code', 'numericId']);
  const path = textValue(firstValue(weather, ['path', 'image', 'icon', 'symbolImage']));
  const name = textValue(firstValue(weather, ['nameByLang', 'name', 'title']));
  const description = textValue(firstValue(weather, ['descriptionByLang', 'description', 'shortDescription']));
  if ((id === undefined || id === null || id === '') && !path && !name && !description) return null;
  return { id: id ?? null, path, name, description };
}

function normalizeSymbolSet(value) {
  if (!value) return [];
  const candidates = Array.isArray(value) ? value : (setItems(value).length ? setItems(value) : [value]);
  return candidates.map(normalizeSingleSymbol).filter(Boolean);
}

function normalizeForecast(raw, date, trend = null, issuedAt = '') {
  const temperatureRange = deepFind(raw, ['temperatureRange', 'temperature_range'], objectValue) || {};
  const description = deepFind(raw, ['forecastText', 'forecast_text', 'description', 'text'], textValue) || trend?.description || '';
  const temperature = deepFind(raw, ['temperature'], numberValue);
  const tempMin = numberValue(temperatureRange?.min ?? deepFind(raw, ['minimumTemperature', 'tempMin'], numberValue));
  const tempMax = numberValue(temperatureRange?.max ?? deepFind(raw, ['maximumTemperature', 'tempMax'], numberValue));
  const rawIssuedAt = deepFind(raw, ['at', 'issuedAt', 'issueDate'], value => dateTimeValue(value) || textValue(value));
  return {
    date,
    temperature,
    tempMin: tempMin ?? trend?.tempMin ?? null,
    tempMax: tempMax ?? trend?.tempMax ?? null,
    description,
    symbolSet: trend?.symbolSet || [],
    issuedAt: rawIssuedAt || trend?.issuedAt || issuedAt || null,
    source: 'Euskalmet'
  };
}

function normalizeTrendBlocks(raw, fallbackDate, fallbackIssuedAt) {
  let blocks = collectContainerItems(raw, ['trendsByDate']);
  if (!blocks.length) {
    const roots = asList(raw);
    blocks = (roots.length ? roots : [raw]).filter(item => item && typeof item === 'object' && (item.weather || item.temperatureRange || item.date));
  }
  const issuedAt = deepFind(raw, ['at'], value => dateTimeValue(value) || textValue(value)) || fallbackIssuedAt;
  return blocks.map(block => {
    const temperatureRange = objectValue(firstValue(block, ['temperatureRange', 'temperature_range'])) || {};
    const symbolSet = normalizeSymbolSet(block);
    const description = textValue(firstValue(block, ['shortDescription', 'description', 'forecastText'])) ||
      symbolSet[0]?.description || symbolSet[0]?.name || '';
    return {
      date: dateValue(firstValue(block, ['date', 'for', 'forecastDate']), fallbackDate),
      tempMin: numberValue(temperatureRange.min),
      tempMax: numberValue(temperatureRange.max),
      description,
      symbolSet,
      issuedAt: issuedAt || null,
      source: 'Euskalmet'
    };
  }).filter(block => block.description || block.tempMin !== null || block.tempMax !== null || block.symbolSet.length);
}

function normalizeMeasureBlocks(raw, fallbackDate, fallbackIssuedAt) {
  let blocks = collectContainerItems(raw, ['trends']);
  if (!blocks.length) {
    const roots = asList(raw);
    blocks = (roots.length ? roots : [raw]).filter(item => item && typeof item === 'object' && (item.range || item.temperature || item.precipitation || item.windspeed));
  }
  const issuedAt = deepFind(raw, ['at'], value => dateTimeValue(value) || textValue(value)) || fallbackIssuedAt;
  return blocks.map(block => {
    const date = dateValue(firstValue(block, ['date', 'for', 'forecastDate']), fallbackDate);
    const bounds = rangeBounds(block, date);
    const temperatureValue = firstValue(block, ['temperature', 'airTemperature']);
    const precipitationValue = firstValue(block, ['precipitation', 'rain']);
    const windDirectionValue = firstValue(block, ['winddirection', 'windDirection', 'wind_direction']);
    const windSpeedValue = firstValue(block, ['windspeed', 'windSpeed', 'wind_speed']);
    const symbolSet = normalizeSymbolSet(firstValue(block, ['symbolSet', 'symbols', 'symbol']));
    const description = textValue(firstValue(block, ['shortDescription', 'description', 'forecastText'])) ||
      symbolSet[0]?.description || symbolSet[0]?.name || '';
    return {
      time: bounds.time,
      endTime: bounds.endTime,
      range: bounds.range,
      date: bounds.time?.slice(0, 10) || date,
      temperature: numberValue(temperatureValue),
      temperatureUnit: unitValue(temperatureValue),
      precipitation: numberValue(precipitationValue),
      precipitationUnit: unitValue(precipitationValue),
      windSpeed: numberValue(windSpeedValue),
      windSpeedUnit: unitValue(windSpeedValue),
      windDirection: numberValue(windDirectionValue),
      windDirectionUnit: unitValue(windDirectionValue),
      windDirectionCardinal: textValue(firstValue(objectValue(windDirectionValue) || {}, ['cardinalPoint', 'cardinal', 'direction'])),
      description,
      symbolSet,
      issuedAt: issuedAt || null,
      source: 'Euskalmet'
    };
  }).filter(block => block.time && block.endTime && (block.description || block.symbolSet.length ||
    [block.temperature, block.precipitation, block.windSpeed, block.windDirection].some(value => value !== null)));
}

function normalizeAccumulatedPrecipitation(raw) {
  const accumulated = deepFind(raw, ['precipitationAccumulated', 'accumulatedPrecipitation'], value => value) || [];
  const items = Array.isArray(accumulated) ? accumulated : setItems(accumulated);
  return items.map(item => {
    const measured = firstValue(item, ['value', 'amount', 'measurement']);
    const explicitPeriodUnit = textValue(firstValue(item, ['periodUnit', 'durationUnit']));
    const genericUnit = textValue(firstValue(item, ['unit']));
    const measuredUnit = unitValue(measured) || textValue(firstValue(item, [
      'measurementUnit', 'precipitationUnit', 'valueUnit'
    ]));
    const genericUnitIsPeriod = /^(?:m|min|minute|minutes|minuto|minutos|h|hr|hour|hours|hora|horas|d|day|days|dia|dias)$/.test(
      normalizeText(genericUnit)
    );
    return {
      value: numberValue(measured),
      unit: measuredUnit || (genericUnitIsPeriod ? '' : genericUnit),
      period: numberValue(firstValue(item, ['period', 'duration'])),
      periodUnit: explicitPeriodUnit || (measuredUnit || genericUnitIsPeriod ? genericUnit : '')
    };
  }).filter(item => item.value !== null);
}

function precipitationDurationMinutes(item) {
  if (!Number.isFinite(item?.period)) return Number.POSITIVE_INFINITY;
  const unit = normalizeText(item.periodUnit);
  if (/^(?:m|min|minute|minutes|minuto|minutos)$/.test(unit)) return item.period;
  if (/^(?:h|hr|hour|hours|hora|horas)$/.test(unit)) return item.period * 60;
  if (/^(?:d|day|days|dia|dias)$/.test(unit)) return item.period * 24 * 60;
  return Number.POSITIVE_INFINITY;
}

function selectAccumulatedPrecipitation(items) {
  return [...items].sort((left, right) => {
    const leftDuration = precipitationDurationMinutes(left);
    const rightDuration = precipitationDurationMinutes(right);
    if (leftDuration < rightDuration) return -1;
    if (leftDuration > rightDuration) return 1;
    if (Number.isFinite(left.period) && !Number.isFinite(right.period)) return -1;
    if (!Number.isFinite(left.period) && Number.isFinite(right.period)) return 1;
    return 0;
  })[0] || null;
}

function normalizeReport(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const time = deepFind(raw, ['reportDate', 'report_date'], value => dateTimeValue(value) || textValue(value));
  const temperature = deepFind(raw, ['airTemperature', 'temperature', 'temperatura'], numberValue);
  const humidity = deepFind(raw, ['relativeHumidity', 'humidity', 'humedad'], numberValue);
  const windSpeed = deepFind(raw, ['windSpeed', 'wind_speed', 'velocidadViento'], numberValue);
  const windDirection = deepFind(raw, ['winddirection', 'windDirection', 'wind_direction', 'direccionViento'], numberValue);
  const windDirectionCardinal = deepFind(raw, ['cardinalPoint', 'windDirectionCardinal'], textValue);
  const precipitationAccumulated = normalizeAccumulatedPrecipitation(raw);
  const directPrecipitationRaw = deepFind(raw, ['precipitation', 'rain'], value => value);
  const directPrecipitation = numberValue(directPrecipitationRaw);
  const selectedAccumulation = selectAccumulatedPrecipitation(precipitationAccumulated);
  const directPrecipitationObject = objectValue(directPrecipitationRaw) || {};
  const selectedPrecipitation = directPrecipitation !== null
    ? {
        value: directPrecipitation,
        unit: unitValue(directPrecipitationRaw) ||
          unitValue(firstValue(directPrecipitationObject, ['value', 'amount', 'measurement'])) ||
          deepFind(raw, ['precipitationUnit'], textValue) || '',
        period: numberValue(firstValue(directPrecipitationObject, ['period', 'duration'])),
        periodUnit: textValue(firstValue(directPrecipitationObject, ['periodUnit', 'durationUnit']))
      }
    : selectedAccumulation;
  const precipitation = selectedPrecipitation?.value ?? null;
  const description = deepFind(raw, ['forecastText', 'description', 'weatherDescription', 'texto'], textValue);
  if ([temperature, humidity, windSpeed, windDirection, precipitation].every(value => value === null) && !description) return null;
  return {
    time: time || null,
    reportDate: time || null,
    temperature,
    humidity,
    windSpeed,
    windDirection,
    windDirectionCardinal,
    precipitation,
    precipitationUnit: selectedPrecipitation?.unit || '',
    precipitationPeriod: selectedPrecipitation?.period ?? null,
    precipitationPeriodUnit: selectedPrecipitation?.periodUnit || '',
    precipitationAccumulated,
    description,
    source: 'Euskalmet'
  };
}

function usableDay(day) {
  return Boolean(day?.description || day?.temperature !== null || day?.tempMin !== null || day?.tempMax !== null || day?.symbolSet?.length);
}

function issueHasAnyData(issue) {
  return Boolean(issue.report || issue.daily.length || issue.hourly.length);
}

function weatherLocationPath(location) {
  return `/euskalmet/weather/regions/${encodeURIComponent(location.regionId)}` +
    `/zones/${encodeURIComponent(location.zoneId)}` +
    `/locations/${encodeURIComponent(location.locationId)}`;
}

function uniquePeriods(periods) {
  const seen = new Set();
  return periods.filter(period => {
    const key = [period.time, period.endTime].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => String(left.time).localeCompare(String(right.time)) ||
    String(left.endTime).localeCompare(String(right.endTime)));
}

function periodDateTimeValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ''))) return Number.NaN;
  return Date.parse(`${value}:00Z`);
}

function hasCompleteHourlyCoverage(issue, date) {
  const dayStart = periodDateTimeValue(`${date}T00:00`);
  const dayEnd = periodDateTimeValue(`${addDateDays(date, 1)}T00:00`);
  const intervals = issue.hourly.map(period => ({
    start: Math.max(dayStart, periodDateTimeValue(period.time)),
    end: Math.min(dayEnd, periodDateTimeValue(period.endTime))
  })).filter(period => Number.isFinite(period.start) && Number.isFinite(period.end) && period.end > period.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  let coveredUntil = dayStart;
  for (const interval of intervals) {
    if (interval.start > coveredUntil) return false;
    if (interval.end > coveredUntil) coveredUntil = interval.end;
    if (coveredUntil >= dayEnd) return true;
  }
  return false;
}

function issueNeedsPrevious(issue, dates) {
  const reportIsCurrent = issue.report?.time?.slice(0, 10) === dates[0];
  const dailyIsComplete = dates.every(date => issue.daily.some(day => day.date === date));
  const hourlyIsComplete = dates.slice(0, 2).every(date => hasCompleteHourlyCoverage(issue, date));
  return !reportIsCurrent || !dailyIsComplete || !hourlyIsComplete;
}

function uniqueByDate(items) {
  const seen = new Set();
  return items.filter(item => {
    const date = String(item?.date || '');
    if (!date || seen.has(date)) return false;
    seen.add(date);
    return true;
  });
}

function chooseReport(currentReport, previousReport, currentDate) {
  if (currentReport?.time?.slice(0, 10) === currentDate) return currentReport;
  if (previousReport?.time?.slice(0, 10) === currentDate) return previousReport;
  if (!currentReport) return previousReport || null;
  if (!previousReport) return currentReport;
  return String(previousReport.time || '') > String(currentReport.time || '') ? previousReport : currentReport;
}

function mergeIssueForecast(currentIssue, previousIssue, dates) {
  if (!previousIssue) {
    return {
      ...currentIssue,
      fallbackIssue: false,
      issueDates: [currentIssue.issueDate],
      reportStale: Boolean(currentIssue.report && currentIssue.report.time?.slice(0, 10) !== dates[0])
    };
  }

  const currentDailyDates = new Set(currentIssue.daily.map(day => day.date));
  const previousDailyAdditions = previousIssue.daily.filter(day => !currentDailyDates.has(day.date));
  const daily = uniqueByDate([...currentIssue.daily, ...previousDailyAdditions])
    .sort((left, right) => dates.indexOf(left.date) - dates.indexOf(right.date));

  const currentTrendDates = new Set(currentIssue.trends.map(trend => trend.date));
  const previousTrendAdditions = previousIssue.trends.filter(trend => !currentTrendDates.has(trend.date));
  const trends = uniqueByDate([...currentIssue.trends, ...previousTrendAdditions]);

  const currentPeriodKeys = new Set(currentIssue.hourly.map(period => `${period.time}|${period.endTime}`));
  const previousHourlyAdditions = previousIssue.hourly.filter(period =>
    !currentPeriodKeys.has(`${period.time}|${period.endTime}`));
  const hourly = uniquePeriods([...currentIssue.hourly, ...previousHourlyAdditions]);

  const report = chooseReport(currentIssue.report, previousIssue.report, dates[0]);
  const previousContributed = previousDailyAdditions.length > 0 || previousTrendAdditions.length > 0 ||
    previousHourlyAdditions.length > 0 || (report && report === previousIssue.report);
  const availableDailyDates = new Set(daily.map(day => day.date));
  const availableHourlyDates = new Set(hourly.map(period => period.date));
  const unavailableDates = uniqueByDate([...currentIssue.unavailableDates, ...previousIssue.unavailableDates])
    .filter(item => !availableDailyDates.has(item.date));
  const unavailableHourlyDates = uniqueByDate([
    ...currentIssue.unavailableHourlyDates, ...previousIssue.unavailableHourlyDates
  ]).filter(item => !availableHourlyDates.has(item.date));
  dates.slice(0, 2).forEach(date => {
    if (!hasCompleteHourlyCoverage({ hourly }, date) && !unavailableHourlyDates.some(item => item.date === date)) {
      unavailableHourlyDates.push({
        date,
        message: 'Euskalmet publicó una cobertura horaria parcial para esta fecha.',
        status: 206
      });
    }
  });
  const currentContributed = issueHasAnyData(currentIssue);

  return {
    issueDate: currentContributed ? currentIssue.issueDate : previousIssue.issueDate,
    issueDates: [
      ...(currentContributed ? [currentIssue.issueDate] : []),
      ...(previousContributed ? [previousIssue.issueDate] : [])
    ],
    fallbackIssue: previousContributed,
    reportStale: Boolean(report && report.time?.slice(0, 10) !== dates[0]),
    report,
    daily,
    trends,
    hourly,
    unavailableDates,
    unavailableHourlyDates,
    firstError: currentIssue.firstError || previousIssue.firstError || null
  };
}

async function loadIssueForecast(location, token, issueDate, dates) {
  const issue = splitDate(issueDate);
  const locationPath = weatherLocationPath(location);
  const periodDates = dates.slice(0, 2);
  const dailyPaths = dates.map(date => {
    const target = splitDate(date);
    return `${locationPath}/forecast/at/${issue.year}/${issue.month}/${issue.day}/for/${target.compact}`;
  });
  const trendPaths = periodDates.map(date => {
    const target = splitDate(date);
    return `${locationPath}/forecast/trends/at/${issue.year}/${issue.month}/${issue.day}/for/${target.compact}`;
  });
  const measurePaths = periodDates.map(date => {
    const target = splitDate(date);
    return `${locationPath}/forecast/trends/measures/at/${issue.year}/${issue.month}/${issue.day}/for/${target.compact}`;
  });
  const reportPath = `${locationPath}/reports/for/${issue.year}/${issue.month}/${issue.day}/last`;
  const [forecastResults, trendResults, measureResults, reportResults] = await Promise.all([
    Promise.allSettled(dailyPaths.map(path => apiGet(path, token))),
    Promise.allSettled(trendPaths.map(path => apiGet(path, token))),
    Promise.allSettled(measurePaths.map(path => apiGet(path, token))),
    Promise.allSettled([apiGet(reportPath, token)])
  ]);

  const trends = [];
  const trendByDate = new Map();
  trendResults.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    normalizeTrendBlocks(result.value, periodDates[index], issueDate).forEach(block => {
      trends.push(block);
      if (!trendByDate.has(block.date)) trendByDate.set(block.date, block);
    });
  });

  const daily = [];
  const unavailableDates = [];
  forecastResults.forEach((result, index) => {
    const date = dates[index];
    const trend = trendByDate.get(date) || null;
    const day = result.status === 'fulfilled'
      ? normalizeForecast(result.value, date, trend, issueDate)
      : normalizeForecast(null, date, trend, issueDate);
    if (usableDay(day)) daily.push(day);
    else if (result.status === 'rejected') unavailableDates.push({ date, ...safeError(result.reason) });
    else unavailableDates.push({ date, message: 'Euskalmet no publicó valores para esta fecha.', status: 204 });
  });

  const hourly = [];
  const unavailableHourlyDates = [];
  measureResults.forEach((result, index) => {
    const date = periodDates[index];
    if (result.status === 'fulfilled') {
      const blocks = normalizeMeasureBlocks(result.value, date, issueDate);
      if (blocks.length) hourly.push(...blocks);
      else unavailableHourlyDates.push({ date, message: 'Euskalmet no publicó intervalos para esta fecha.', status: 204 });
    } else unavailableHourlyDates.push({ date, ...safeError(result.reason) });
  });

  const report = reportResults[0]?.status === 'fulfilled' ? normalizeReport(reportResults[0].value) : null;
  return {
    issueDate,
    report,
    daily,
    trends,
    hourly: uniquePeriods(hourly),
    unavailableDates,
    unavailableHourlyDates,
    firstError: [
      ...forecastResults, ...trendResults, ...measureResults, ...reportResults
    ].find(result => result.status === 'rejected')?.reason || null
  };
}

function safeError(error) {
  return {
    message: error instanceof Error ? error.message : 'Error desconocido',
    status: Number(error?.statusCode) || 500,
    path: error?.details?.path || undefined
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const name = String(req.query?.name || 'Bermeo').trim().slice(0, 100);
  const requestedDays = Math.min(7, Math.max(1, Number(req.query?.days) || 7));
  const atDate = madridDate(0);
  const cacheKey = forecastCacheKey(name, requestedDays, atDate);
  const cachedForecast = forecastCache.get(cacheKey);
  if (cachedForecast && Date.now() - cachedForecast.savedAt <= FORECAST_CACHE_FRESH_MS) {
    res.setHeader('X-Meteo-Cache', 'euskalmet-memory-fresh');
    res.setHeader('Cache-Control', forecastCacheControl(300));
    return res.status(200).json({ ...cachedForecast.payload, stale: false });
  }

  try {
    const token = buildJwt();
    const location = await resolveLocation(name, token);
    if (!location) {
      res.setHeader('Cache-Control', forecastCacheControl(300));
      return res.status(404).json({
        ok: false,
        source: 'Euskalmet',
        error: `No se encontró «${name}» entre las localidades de previsión de Euskalmet.`
      });
    }

    const dates = Array.from({ length: requestedDays }, (_, index) => madridDate(index));
    const currentIssue = await loadIssueForecast(location, token, atDate, dates);
    let previousIssue = null;
    if (issueNeedsPrevious(currentIssue, dates)) {
      previousIssue = await loadIssueForecast(location, token, madridDate(-1), dates);
    }
    const issue = mergeIssueForecast(currentIssue, previousIssue, dates);

    if (!issueHasAnyData(issue)) {
      const error = new Error('Euskalmet no devolvió una previsión utilizable.');
      error.statusCode = 502;
      error.details = { path: issue.unavailableDates[0]?.path || issue.unavailableHourlyDates[0]?.path || issue.firstError?.details?.path };
      throw error;
    }

    const hourly = issue.hourly;
    const payload = {
      ok: true,
      source: 'Euskalmet',
      generatedAt: new Date().toISOString(),
      timezone: 'Europe/Madrid',
      issueDate: issue.issueDate,
      issueDates: issue.issueDates,
      fallbackIssue: issue.fallbackIssue,
      reportStale: issue.reportStale,
      location: {
        requestedName: name,
        regionId: location.regionId,
        zoneId: location.zoneId,
        zoneName: location.zoneName,
        locationId: location.locationId,
        name: location.locationName || name
      },
      report: issue.report,
      daily: issue.daily,
      trends: issue.trends,
      hourly,
      periods: hourly,
      unavailableDates: issue.unavailableDates,
      unavailableHourlyDates: issue.unavailableHourlyDates,
      coverageNote: issue.unavailableDates.length || issue.unavailableHourlyDates.length
        ? 'Los días, intervalos y campos que Euskalmet no ha publicado se mantienen sin valor y no se completan con otra fuente.'
        : 'Todos los datos mostrados proceden exclusivamente de Euskalmet.'
    };
    rememberForecast(cacheKey, payload);
    res.setHeader('Cache-Control', forecastCacheControl(300));
    return res.status(200).json({ ...payload, stale: false });
  } catch (error) {
    if (cachedForecast && Date.now() - cachedForecast.savedAt <= FORECAST_CACHE_STALE_MS) {
      res.setHeader('X-Meteo-Cache', 'euskalmet-memory-stale');
      res.setHeader('Warning', '110 - "Previsión Euskalmet guardada"');
      res.setHeader('Cache-Control', forecastCacheControl(60));
      return res.status(200).json({ ...cachedForecast.payload, stale: true, staleSavedAt: new Date(cachedForecast.savedAt).toISOString() });
    }
    const safe = safeError(error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(safe.status >= 400 && safe.status < 600 ? safe.status : 500).json({
      ok: false,
      source: 'Euskalmet',
      error: safe.message,
      path: safe.path,
      hint: 'Comprueba las variables privadas y los permisos de la clave en Vercel.'
    });
  }
};
