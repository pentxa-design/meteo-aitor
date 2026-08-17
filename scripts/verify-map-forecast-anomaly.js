const assert = require('assert');

const HOURS = 169;
const start = Date.UTC(2026, 7, 17, 0, 0, 0);
const times = Array.from({ length: HOURS }, (_, index) =>
  new Date(start + index * 3600000).toISOString().replace('.000Z', '')
);
let forecastRequests = 0;

global.fetch = async url => {
  const parsed = new URL(url);
  assert.strictEqual(parsed.hostname, 'api.open-meteo.com');
  assert.strictEqual(parsed.searchParams.get('models'), 'ecmwf_ifs025');
  assert.strictEqual(parsed.searchParams.get('hourly'), 'temperature_850hPa');
  forecastRequests += 1;
  const latitudes = parsed.searchParams.get('latitude').split(',').map(Number);
  const longitudes = parsed.searchParams.get('longitude').split(',').map(Number);
  return {
    ok: true,
    status: 200,
    json: async () => latitudes.map((latitude, index) => ({
      latitude,
      longitude: longitudes[index],
      hourly: {
        time: times,
        temperature_850hPa: Array(HOURS).fill(10)
      }
    }))
  };
};

function responseCollector() {
  const result = { headers: {}, statusCode: null, body: null };
  return {
    result,
    setHeader(name, value) { result.headers[name] = value; },
    status(statusCode) {
      result.statusCode = statusCode;
      return { json(payload) { result.body = payload; return payload; } };
    }
  };
}

async function request(displayLayer) {
  const res = responseCollector();
  const handler = require('../api/map-forecast');
  await handler({
    method: 'GET',
    query: {
      model: 'ecmwf',
      layer: displayLayer,
      displayLayer,
      density: '6',
      south: '40',
      north: '44',
      west: '-5',
      east: '1',
      focusLat: '43.42',
      focusLon: '-2.72'
    }
  }, res);
  assert.strictEqual(res.result.statusCode, 200, JSON.stringify(res.result.body));
  return res.result.body;
}

(async () => {
  const anomaly = await request('t850_anomaly');
  assert.strictEqual(anomaly.displayLayer, 't850_anomaly');
  assert.strictEqual(anomaly.model.sourceModel, 'ecmwf_ifs025');
  assert.strictEqual(anomaly.model.normalResolutionDegrees, 2.5);
  assert.strictEqual(anomaly.diagnostics.normalPeriod, '1991-2020');
  assert.ok(anomaly.points.length > 0);
  assert.ok(anomaly.points[0].hourly.temperature_850hPa.every(value => value === 10));
  assert.ok(anomaly.points[0].hourly.temperature_850hPa_anomaly.every(Number.isFinite));

  const absolute = await request('t850');
  assert.strictEqual(absolute.displayLayer, 't850');
  assert.ok(absolute.points[0].hourly.temperature_850hPa.every(value => value === 10));
  assert.deepStrictEqual(absolute.points[0].hourly.temperature_850hPa_anomaly, []);
  assert.ok(forecastRequests >= 2);

  console.log(JSON.stringify({
    ok: true,
    forecastRequests,
    anomalyPoints: anomaly.points.length,
    firstAnomaly: anomaly.points[0].hourly.temperature_850hPa_anomaly[0]
  }));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
