const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

const requiredMovieLayers = [
  'precipitation', 'thunderstorms', 'electric_storms', 'forecast_reflectivity',
  'cloud', 'temperature', 'dewpoint', 'humidity', 'wind', 'gust', 'pressure',
  't850', 'sea_temperature', 'waves'
];

const movieSet = html.match(/const MAP_NATIVE_TIMELINE_MOVIE_LAYERS=new Set\(\[([^\]]+)\]\)/)?.[1] || '';
requiredMovieLayers.forEach(layer => assert.match(movieSet, new RegExp(`['"]${layer}['"]`), `Falta película rápida para ${layer}`));

assert.match(html, /gridQuickPreview:false/);
assert.match(html, /scheduleMapRender\(true\);scheduleMapGridRefine/);
assert.match(html, /pixelBudget=quick\?\(isCompact\?42000:60000\)/);
assert.match(html, /if\(starting\)\{if\(mapAitorState\.nativePendingField\)/);
assert.doesNotMatch(html, /function setMapPicker\(latlng\)\{[^}]*mapUsesNativeTiles\(\)/);
assert.match(html, /function mapNativePickerValue\(/);
assert.match(html, /Valores del punto/);
assert.match(html, /renderMapNativeMovie[\s\S]*?renderMapPicker\(\);setMapBusy\(false\)/);

console.log(JSON.stringify({
  ok: true,
  movieLayers: requiredMovieLayers.length,
  quickPixelBudget: 60000,
  nativePointPicker: true
}));
