const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Normal diaria oficial usada exclusivamente para la capa de anomalía T850.
// Fuente: NOAA PSL, NCEP/NCAR Reanalysis 1, climatología 1991-2020.
// El artefacto contiene 365 × 73 × 144 valores Kelvin codificados como
// uint16 little-endian en centikelvin y comprimidos con gzip.
const CLIMATOLOGY_FILE = path.join(__dirname, '..', 'data', 't850-climatology-1991-2020.u16.gz');
const CLIMATOLOGY_DAYS = 365;
const LATITUDE_COUNT = 73;
const LONGITUDE_COUNT = 144;
const LATITUDE_STEP = 2.5;
const LONGITUDE_STEP = 2.5;
const BYTES_PER_VALUE = 2;
const EXPECTED_BYTES = CLIMATOLOGY_DAYS * LATITUDE_COUNT * LONGITUDE_COUNT * BYTES_PER_VALUE;

let climatologyBuffer = null;

function loadClimatologyBuffer() {
  if (climatologyBuffer) return climatologyBuffer;
  const compressed = fs.readFileSync(CLIMATOLOGY_FILE);
  const decoded = zlib.gunzipSync(compressed);
  if (decoded.length !== EXPECTED_BYTES) {
    throw new Error(`La climatología T850 local tiene ${decoded.length} bytes; se esperaban ${EXPECTED_BYTES}.`);
  }
  climatologyBuffer = decoded;
  return climatologyBuffer;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function parseUtcDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const timestamp = Date.parse(/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(raw) ? raw : `${raw}Z`);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

// La normal NOAA tiene 365 días. El 29 de febrero usa la media de las
// normales de 28-feb y 1-mar; desde el 1 de marzo de un año bisiesto se resta
// un día para mantener el calendario climatológico de 365 posiciones.
function climatologyDayWeights(time) {
  const date = parseUtcDate(time);
  if (!date) return [];
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const dayOfMonth = date.getUTCDate();
  if (month === 1 && dayOfMonth === 29) {
    return [{ day: 58, weight: 0.5 }, { day: 59, weight: 0.5 }];
  }
  const dayOfYear = Math.floor((Date.UTC(year, month, dayOfMonth) - Date.UTC(year, 0, 1)) / 86400000);
  const day = isLeapYear(year) && dayOfYear > 59 ? dayOfYear - 1 : dayOfYear;
  return day >= 0 && day < CLIMATOLOGY_DAYS ? [{ day, weight: 1 }] : [];
}

function normalizeLongitude(longitude) {
  const numeric = Number(longitude);
  if (!Number.isFinite(numeric)) return null;
  return ((numeric % 360) + 360) % 360;
}

function encodedKelvinAt(day, latitudeIndex, longitudeIndex) {
  if (
    day < 0 || day >= CLIMATOLOGY_DAYS ||
    latitudeIndex < 0 || latitudeIndex >= LATITUDE_COUNT ||
    longitudeIndex < 0 || longitudeIndex >= LONGITUDE_COUNT
  ) return null;
  const valueIndex = ((day * LATITUDE_COUNT + latitudeIndex) * LONGITUDE_COUNT) + longitudeIndex;
  const encoded = loadClimatologyBuffer().readUInt16LE(valueIndex * BYTES_PER_VALUE);
  return encoded === 0 ? null : encoded / 100;
}

function sampleClimatologyDayKelvin(day, latitude, longitude) {
  const numericLatitude = Number(latitude);
  const normalizedLongitude = normalizeLongitude(longitude);
  if (!Number.isFinite(numericLatitude) || normalizedLongitude === null) return null;

  const latitudePosition = Math.max(0, Math.min(LATITUDE_COUNT - 1, (90 - numericLatitude) / LATITUDE_STEP));
  const longitudePosition = normalizedLongitude / LONGITUDE_STEP;
  const latitude0 = Math.floor(latitudePosition);
  const latitude1 = Math.min(LATITUDE_COUNT - 1, latitude0 + 1);
  const longitude0 = Math.floor(longitudePosition) % LONGITUDE_COUNT;
  const longitude1 = (longitude0 + 1) % LONGITUDE_COUNT;
  const latitudeWeight = latitudePosition - latitude0;
  const longitudeWeight = longitudePosition - Math.floor(longitudePosition);

  const samples = [
    { value: encodedKelvinAt(day, latitude0, longitude0), weight: (1 - latitudeWeight) * (1 - longitudeWeight) },
    { value: encodedKelvinAt(day, latitude0, longitude1), weight: (1 - latitudeWeight) * longitudeWeight },
    { value: encodedKelvinAt(day, latitude1, longitude0), weight: latitudeWeight * (1 - longitudeWeight) },
    { value: encodedKelvinAt(day, latitude1, longitude1), weight: latitudeWeight * longitudeWeight }
  ];
  let total = 0;
  let totalWeight = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample.value) || sample.weight <= 0) continue;
    total += sample.value * sample.weight;
    totalWeight += sample.weight;
  }
  return totalWeight > 0 ? total / totalWeight : null;
}

function sampleClimatologyKelvin(time, latitude, longitude) {
  const weights = climatologyDayWeights(time);
  let total = 0;
  let totalWeight = 0;
  for (const item of weights) {
    const value = sampleClimatologyDayKelvin(item.day, latitude, longitude);
    if (!Number.isFinite(value)) continue;
    total += value * item.weight;
    totalWeight += item.weight;
  }
  return totalWeight > 0 ? total / totalWeight : null;
}

function temperature850AnomalySeries(times, forecastCelsius, latitude, longitude) {
  const timeSeries = Array.isArray(times) ? times : [];
  const temperatures = Array.isArray(forecastCelsius) ? forecastCelsius : [];
  return temperatures.map((value, index) => {
    if (value === null || value === undefined || value === '') return null;
    const forecast = Number(value);
    const normalKelvin = sampleClimatologyKelvin(timeSeries[index], latitude, longitude);
    if (!Number.isFinite(forecast) || !Number.isFinite(normalKelvin)) return null;
    return Number((forecast - (normalKelvin - 273.15)).toFixed(2));
  });
}

function withTemperature850Anomaly(location, fallbackPoint = {}) {
  const hourly = location?.hourly || {};
  const latitude = Number(location?.latitude ?? fallbackPoint.latitude);
  const longitude = Number(location?.longitude ?? fallbackPoint.longitude);
  return {
    ...location,
    hourly: {
      ...hourly,
      temperature_850hPa_anomaly: temperature850AnomalySeries(
        hourly.time,
        hourly.temperature_850hPa,
        latitude,
        longitude
      )
    }
  };
}

module.exports = {
  CLIMATOLOGY_FILE,
  EXPECTED_BYTES,
  climatologyDayWeights,
  loadClimatologyBuffer,
  sampleClimatologyDayKelvin,
  sampleClimatologyKelvin,
  temperature850AnomalySeries,
  withTemperature850Anomaly
};
