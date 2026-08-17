const assert = require('assert');
const {
  EXPECTED_BYTES,
  climatologyDayWeights,
  loadClimatologyBuffer,
  sampleClimatologyDayKelvin,
  sampleClimatologyKelvin,
  temperature850AnomalySeries
} = require('../lib/t850-climatology');

const decoded = loadClimatologyBuffer();
assert.strictEqual(decoded.length, EXPECTED_BYTES);

assert.deepStrictEqual(climatologyDayWeights('2025-02-28T12:00'), [{ day: 58, weight: 1 }]);
assert.deepStrictEqual(climatologyDayWeights('2024-02-29T12:00'), [
  { day: 58, weight: 0.5 },
  { day: 59, weight: 0.5 }
]);
assert.deepStrictEqual(climatologyDayWeights('2024-03-01T12:00'), [{ day: 59, weight: 1 }]);
assert.deepStrictEqual(climatologyDayWeights('2025-12-31T12:00'), [{ day: 364, weight: 1 }]);

const exact = sampleClimatologyDayKelvin(0, 90, 0);
const wrapped = sampleClimatologyDayKelvin(0, 90, 360);
assert.ok(Number.isFinite(exact) && exact > 150 && exact < 350);
assert.strictEqual(exact, wrapped);

const feb29 = sampleClimatologyKelvin('2024-02-29T00:00', 43.42, -2.72);
const feb28 = sampleClimatologyKelvin('2024-02-28T00:00', 43.42, -2.72);
const mar1 = sampleClimatologyKelvin('2024-03-01T00:00', 43.42, -2.72);
assert.ok(Math.abs(feb29 - ((feb28 + mar1) / 2)) < 1e-9);

const normalCelsius = feb28 - 273.15;
const anomaly = temperature850AnomalySeries(
  ['2024-02-28T00:00'],
  [normalCelsius + 2.5],
  43.42,
  -2.72
);
assert.ok(Math.abs(anomaly[0] - 2.5) < 0.011);

console.log(JSON.stringify({
  ok: true,
  decodedBytes: decoded.length,
  bermeoNormalKelvin: Number(feb28.toFixed(2)),
  leapDayNormalKelvin: Number(feb29.toFixed(2))
}));
