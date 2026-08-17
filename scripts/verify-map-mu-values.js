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
  cin: [1035, 13, 500, 20]
};
const frames = [{ forecastHour: 0, frame }];
const missing = test.compactPoint({ latitude: 40, longitude: 0 }, frames, 'convection');
const active = test.compactPoint({ latitude: 40, longitude: 1 }, frames, 'convection');
const zero = test.compactPoint({ latitude: 41, longitude: 0 }, frames, 'convection');

assert.equal(missing.hourly.convective_inhibition[0], null);
assert.equal(active.hourly.convective_inhibition[0], -13);
assert.equal(zero.hourly.convective_inhibition[0], null);

const fixture = '/tmp/gfs-20260817-18-f009-cape-cin.grib2';
if (fs.existsSync(fixture)) {
  const parsed = test.parseFrame(fs.readFileSync(fixture), 'convection');
  const sentinels = parsed.cape.filter(value => Number(value) !== 0 && Math.abs(Number(value)) < 1e-20).length;
  assert(sentinels > 0, 'La muestra oficial debe contener sentinelas de dato ausente');
}

console.log('MUCIN guard OK');
