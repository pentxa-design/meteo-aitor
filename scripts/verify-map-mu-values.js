const assert = require('assert');
const fs = require('fs');
const handler = require('../api/map-mu');
const test = handler.__test;

assert(test, 'Faltan utilidades de prueba');

const runs = test.candidateRuns(Date.parse('2026-08-17T22:26:00Z'));
assert.deepStrictEqual(
  runs.map(date => date.toISOString().slice(0, 13)),
  ['2026-08-17T18', '2026-08-17T12', '2026-08-17T06']
);

assert.equal(test.validFieldValue(5.877471754111438e-39), null);
assert.equal(test.validFieldValue(0), 0);

const frame = {
  nx: 2,
  ny: 2,
  latitude1: 40,
  latitude2: 41,
  longitude1: 0,
  longitude2: 1,
  cape: [5.877471754111438e-39, 250, 0, 300],
  cin: [5.877471754111438e-39, 13, 500, 20]
};
const frames = [{ forecastHour: 0, frame }];
const missing = test.compactPoint({ latitude: 40, longitude: 0 }, frames, 'convection');
const active = test.compactPoint({ latitude: 40, longitude: 1 }, frames, 'convection');
const zero = test.compactPoint({ latitude: 41, longitude: 0 }, frames, 'convection');

assert.equal(missing.hourly.convective_inhibition[0], null);
assert.equal(active.hourly.convective_inhibition[0], -13);
assert.equal(zero.hourly.convective_inhibition[0], -500);

const section5 = Buffer.alloc(21);
section5.writeUInt32BE(21, 0);
section5[4] = 5;
section5.writeUInt16BE(0, 9);
section5.writeFloatBE(-809.271240234375, 11);
section5.writeUInt16BE(0, 15);
section5.writeUInt16BE(0, 17);
const simplePacked = Buffer.concat([Buffer.alloc(16), section5]);
const corrected = test.correctSimplePackingValues({
  ReferenceValue: 0,
  DataValues: [[809, 651, 417, 808, 716]]
}, simplePacked);
assert.deepStrictEqual(
  corrected.map(value => Number(value.toFixed(6))),
  [-0.27124, -158.27124, -392.27124, -1.27124, -93.27124]
);

const fixture = '/tmp/gfs-20260817-18-f009-cape-cin.grib2';
if (fs.existsSync(fixture)) {
  const parsed = test.parseFrame(fs.readFileSync(fixture), 'convection');
  const sentinels = parsed.cape.filter(value => Number(value) !== 0 && Math.abs(Number(value)) < 1e-20).length;
  assert(sentinels > 0, 'La muestra oficial debe contener sentinelas de dato ausente');
  const expected = [
    ['Madrid', 40.4168, -3.7038, -0.271240234375],
    ['Sevilla', 37.3891, -5.9845, -158.271240234375],
    ['Murcia', 37.9922, -1.1307, -392.271240234375],
    ['Barcelona', 41.3874, 2.1686, -93.271240234375]
  ];
  for (const [name, latitude, longitude, value] of expected) {
    const index = test.gridIndex(parsed, latitude, longitude);
    assert.equal(parsed.cin[index], value, `${name}: MUCIN oficial NOAA no coincide`);
  }
}

console.log('MUCIN GRIB2 NOAA OK');
