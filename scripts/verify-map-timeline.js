const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

const requiredMovieLayers = [
  'precipitation', 'electric_storms', 'forecast_reflectivity',
  'cloud', 'temperature', 'dewpoint', 'humidity', 'wind', 'gust', 'pressure',
  't850', 'sea_temperature', 'waves'
];

const movieSet = html.match(/const MAP_NATIVE_TIMELINE_MOVIE_LAYERS=new Set\(\[([^\]]+)\]\)/)?.[1] || '';
requiredMovieLayers.forEach(layer => assert.match(movieSet, new RegExp(`['"]${layer}['"]`), `Falta película rápida para ${layer}`));
assert.doesNotMatch(movieSet, /['"]thunderstorms['"]/, 'Tormentas no debe usar la malla rectangular provisional');

assert.match(html, /gridQuickPreview:false/);
assert.match(html, /scheduleMapRender\(true\);scheduleMapGridRefine/);
assert.match(html, /pixelBudget=quick\?\(isCompact\?36000:fullscreen\?42000:50000\)/);
assert.match(html, /minimumInterval=window\.innerWidth<=820\?190:fullscreen\?105:125/);
assert.match(html, /if\(starting\)\{if\(mapAitorState\.nativePendingField\)/);
assert.doesNotMatch(html, /function setMapPicker\(latlng\)\{[^}]*mapUsesNativeTiles\(\)/);
assert.match(html, /function mapNativePickerValue\(/);
assert.match(html, /Valores del punto/);
assert.match(html, /renderMapNativeMovie[\s\S]*?renderMapPicker\(\);setMapBusy\(false\)/);
assert.match(html, /function mapCanonicalAnomalyWindow\(/);
assert.match(html, /anomalyWindow=requestedLayer==='t850_anomaly'/);
assert.match(html, /dataVersion','10\.157'/);
assert.match(html, /function showHourlyDate\(/);
assert.match(html, /createElement\('button'\);el\.type='button';el\.className='day'\+\(selectedHourlyDate===t/);
assert.match(html, /selectedHourlyDate/);
assert.match(html, /function restoreMapLastGood\(layer,model\)/);
assert.match(html, /Se conserva únicamente la última malla válida de esta misma capa/);
assert.match(html, /nunca se etiqueta como[^<]+una capa distinta/);

console.log(JSON.stringify({
  ok: true,
  movieLayers: requiredMovieLayers.length,
  quickPixelBudget: 42000,
  fullscreenFrameIntervalMs: 105,
  anomalyCanonicalWindow: true,
  clickableDailyHourly: true,
  sameLayerLastGoodFallback: true,
  nativePointPicker: true
}));
