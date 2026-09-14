/* ═══════════════════════════════════════════════════════════════════
   LAS CABECERAS DE CACHÉ, LAS QUE ENTIENDE VERCEL

   Revisión del 04-09-2026, §5: los intermediarios de `netlify/functions/`
   mandaban su TTL de verdad en `netlify-cdn-cache-control`, que Vercel
   ignora. MEDIDO el 05-09-2026 en la app publicada: `/om?api=elev`
   —la altitud del terreno, pensada para un mes de caché— daba
   `x-vercel-cache: HIT` a los 20 s y `MISS` con `age: 0` a los 70 s.
   O sea, 60 s de caché, el `max-age` del navegador. Y las mareas no
   tenían ningún `stale-if-error`.

   Ahora hay una sola puerta, `lib/cabeceras.mjs`, y esto comprueba tres
   cosas: (1) que la puerta emite lo que Vercel entiende; (2) que las
   siete funciones la usan y cada una CONSERVA el TTL que tenía —
   arrancándolas de verdad con la fuente doblada, no leyendo el fichero;
   (3) que `om.js` acepta el catálogo de RainViewer, que hasta hoy la
   pestaña Radar pedía a pelo desde el navegador.

   Dos matices de la corrección del 05-09-2026:
   · Las teselas. `netlify/functions/omtiles.js` en Vercel NO corre:
     vercel.json reescribe `/omtiles/(.*)` a `/api/omtiles?ruta=$1` y
     `api/omtiles.js` es OTRA implementación, no un envoltorio (medido a
     las 03:52 UTC: `latest.json` salía con `max-age=60` y sin x-origen).
     Por eso aquí se arrancan LAS DOS, y las pruebas del fichero de
     netlify/ llevan en el nombre que en Vercel no es el que corre: lo
     que garantiza el CDN es lo de `api/omtiles.js`.
   · La lista de tormentas del NHC iba solo con `max-age=900` (sin
     cabecera de CDN, content-type sin charset): el CDN guardaba 900 s
     por el max-age y refrescaba en la propia petición al caducar. Se
     conserva ESO: sin stale-while-revalidate y con el mismo
     content-type; lo único nuevo es el x-origen.

   `satelite.js` queda fuera a propósito: lo lleva otra tarea y el
   coordinador lo suma a la lista cuando esté.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `  — ${pista}` : ''}`); }
};

const { cabeceras } = await import(pathToFileURL(path.join(aqui, 'lib', 'cabeceras.mjs')).href);

/* Quita los comentarios de un fuente, para buscar solo en el código. */
const sinComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/* `public, s-maxage=600, stale-while-revalidate=1200` → { public: true,
   's-maxage': 600, … }. Para no comparar cadenas enteras. */
const directivas = s => Object.fromEntries(String(s ?? '').split(',')
  .map(x => x.trim()).filter(Boolean)
  .map(x => { const [k, v] = x.split('='); return [k, v === undefined ? true : Number(v)]; }));

/* ══ 1. LA PUERTA ══════════════════════════════════════════════════ */
console.log('\n  cabeceras(): lo que entiende el CDN de Vercel\n');
{
  const h = cabeceras(600);
  const cdn = directivas(h['cdn-cache-control']);
  ok('con TTL 600, el CDN recibe s-maxage=600 en cdn-cache-control',
     cdn['s-maxage'] === 600 && cdn.public === true, h['cdn-cache-control']);
  ok('y el navegador solo max-age=60: sin s-maxage, que Vercel lo quitaría igual',
     h['cache-control'] === 'public, max-age=60', h['cache-control']);
  ok('stale-while-revalidate vale el doble del TTL si no se dice',
     cdn['stale-while-revalidate'] === 1200, h['cdn-cache-control']);
  ok('y el stale-while-revalidate que se pasa, manda',
     directivas(cabeceras(600, { revalidar: 3600 })['cdn-cache-control'])['stale-while-revalidate'] === 3600);
  ok('con revalidar: 0 no sale stale-while-revalidate: el CDN refresca en la propia petición al caducar',
     cabeceras(900, { revalidar: 0 })['cdn-cache-control'] === 'public, s-maxage=900',
     cabeceras(900, { revalidar: 0 })['cdn-cache-control']);
  ok('el max-age del navegador que se pasa, manda',
     cabeceras(600, { navegador: 120 })['cache-control'] === 'public, max-age=120');
ok('con cdn: false el navegador guarda y el CDN no (los trozos con Range del mapa, 14-09)',
   /^private, max-age=300$/.test(cabeceras(300, { navegador: 300, cdn: false })['cache-control'])
   && cabeceras(300, { navegador: 300, cdn: false })['cdn-cache-control'] === 'no-store');
  ok('stale-if-error NO sale si no se pide',
     !('stale-if-error' in cdn), h['cdn-cache-control']);
  ok('y con siError sale con su valor (las mareas: 86400)',
     directivas(cabeceras(10800, { siError: 86400 })['cdn-cache-control'])['stale-if-error'] === 86400);
  ok('el content-type es JSON con utf-8 si no se dice',
     h['content-type'] === 'application/json; charset=utf-8', h['content-type']);
  ok('y se conserva el que se pasa (image/png para el radar)',
     cabeceras(300, { tipo: 'image/png' })['content-type'] === 'image/png');
  ok('con tipo null no se pone content-type, para cuando ya viene de fuera',
     !('content-type' in cabeceras(300, { tipo: null })));
  ok('CORS abierto por defecto (las fuentes no mandan cabecera CORS)',
     h['access-control-allow-origin'] === '*');
  ok('y se puede quitar con cors: false',
     !('access-control-allow-origin' in cabeceras(300, { cors: false })));
  ok('x-origen solo sale si se pasa',
     !('x-origen' in h) && cabeceras(300, { origen: 'aemet' })['x-origen'] === 'aemet');

  const cero = cabeceras(0);
  ok('con TTL 0 es no-store y SIN cabecera de CDN: un error no se queda pegado',
     cero['cache-control'] === 'no-store' && !('cdn-cache-control' in cero), JSON.stringify(cero));
  ok('y con TTL nulo o basura, lo mismo',
     cabeceras(null)['cache-control'] === 'no-store' && cabeceras('x')['cache-control'] === 'no-store');

  ok('ninguna cabecera de Netlify sale de la puerta',
     !Object.keys(cabeceras(600, { siError: 1 })).some(k => k.includes('netlify')));

  const src = fs.readFileSync(path.join(aqui, 'lib', 'cabeceras.mjs'), 'utf8');
  ok('lib/cabeceras.mjs no usa nada de Node: corre en las Edge Functions',
     !/\b(import|require|process|Buffer)\b|node:/.test(sinComentarios(src)));
}

/* ══ 2. LAS FUNCIONES, ARRANCADAS ══════════════════════════════════ */
console.log('\n  las funciones conservan su TTL de antes, arrancadas con la fuente doblada\n');

process.env.WINDY_KEY = 'la-de-mentira-de-la-prueba';
process.env.AEMET_KEY = 'la-de-mentira-de-la-prueba';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });

/* Un doble de fuente por caso. Devuelve una respuesta según la URL que
   pida la función; apunta lo pedido para poder mirarlo después. */
const DOBLES = {
  openMeteo: () => json({ hourly: {} }),
  png: () => new Response(PNG, { status: 200, headers: { 'content-type': 'image/png' } }),
  euskalmet: () => new Response('20260905:14:35:00:high#1.5 20260905:20:50:00:low#0.3', { status: 200 }),
  windy: () => json({ total: 1, webcams: [{ webcamId: 1 }] }),
  nhc: () => json({ activeStorms: [] }),
  aemetRayos: (u) => u.endsWith('/timeline')
    ? json({ ica_horario: { penbal: { variables: { rayos: [
        { fecha: '2026-09-05T03:00:00Z', ficheros: { LOCL: 'rayos_PB_LOCL_2026090503+0200_1787630468.png' } }] } } } })
    : json([[-10, 35], [5, 35], [5, 44], [-10, 44]]),
  aemetObs: (u) => u.includes('/observacion/')
    ? json({ estado: 200, datos: 'https://doble/datos' })
    : json([{ idema: '1082', ubi: 'BERMEO', lat: 43.42, lon: -2.72, alt: 10,
              fint: '2026-09-05T03:00:00', vv: 5, vmax: 8, ta: 17, hr: 80, prec: 0 }]),
  tesela: () => new Response(new Uint8Array(16), { status: 200, headers: { 'content-type': 'application/octet-stream' } }),
  catalogoTeselas: () => json({ ecmwf: 'latest' }),
  caida: () => new Response('no', { status: 503 }),
};

/* fichero, petición, doble, y lo que tenía ANTES en netlify-cdn-cache-control
   (ttl = s-maxage, swr = stale-while-revalidate —0 si no llevaba—, sie =
   stale-if-error) más el max-age del navegador y el content-type. Copiados
   del árbol de antes del 05-09-2026, no inventados.
     carpeta: 'api'   → se arranca api/<f>.js en vez de netlify/functions/<f>.js
     enVercelCorre    → este fichero en Vercel NO corre; corre el que se dice */
const CASOS = [
  ['om',         '/om?api=fc&latitude=43.42&longitude=-2.72&hourly=temperature_2m', 'openMeteo',
                 { ttl: 600, swr: 3600, nav: 60, tipo: 'application/json; charset=utf-8', origen: 'open-meteo' }],
  ['om',         '/om?api=elev&latitude=43.42&longitude=-2.72', 'openMeteo',
                 { ttl: 2592000, swr: 15552000, nav: 60, tipo: 'application/json; charset=utf-8', origen: 'open-meteo' }],
  ['om',         '/om?api=rain', 'openMeteo',
                 { ttl: 300, swr: 1800, nav: 60, tipo: 'application/json; charset=utf-8', origen: 'rainviewer' }],
  ['radar',      '/radar-aemet?f=radw202609050300_3857.png', 'png',
                 { ttl: 300, swr: 600, nav: 120, tipo: 'image/png', origen: 'aemet' }],
  ['mareas',     '/mareas?lat=43.42&lon=-2.72', 'euskalmet',
                 { ttl: 10800, swr: 21600, sie: 86400, nav: 1800, tipo: 'application/json; charset=utf-8', origen: 'euskalmet' }],
  ['webcams',    '/webcams?lat=43.42&lon=-2.72', 'windy',
                 { ttl: 1800, swr: 3600, nav: 300, tipo: 'application/json; charset=utf-8', origen: 'windy-webcams' }],
  // El «+» del nombre va como %2B: en una consulta, «+» a secas es un espacio.
  ['rayos',      '/rayos?f=rayos_PB_LOCL_2026090503%2B0200_1787630468.png', 'png',
                 { ttl: 3600, swr: 7200, nav: 1800, tipo: 'image/png', origen: 'aemet-rayos' }],
  ['rayos',      '/rayos', 'aemetRayos',
                 { ttl: 300, swr: 1800, nav: 120, tipo: 'application/json; charset=utf-8', origen: 'aemet-rayos' }],
  // Las tormentas solo tenían max-age=900, sin cabecera de CDN y sin
  // charset (medido el 05-09-2026 a las 03:52 UTC en la app publicada:
  // x-vercel-cache HIT con age 257 → el CDN guardaba 900 por el max-age y
  // refrescaba en la propia petición). Se conserva: s-maxage=900 y NADA de
  // stale-while-revalidate, content-type a secas. Solo se añade x-origen.
  ['rayos',      '/rayos?tormentas=1', 'nhc',
                 { ttl: 900, swr: 0, nav: 900, tipo: 'application/json', origen: 'nhc-noaa' }],
  ['estaciones', '/estaciones?lat=43.42&lon=-2.72', 'aemetObs',
                 { ttl: 600, swr: 1800, nav: 300, tipo: 'application/json; charset=utf-8', origen: 'aemet-observacion' }],
  // Las teselas: el de netlify/ (que en Vercel no corre) y el de api/ (el
  // que corre de verdad, con la ruta en `?ruta=` por la reescritura de
  // vercel.json). Los dos con los mismos números.
  ['omtiles',    '/omtiles/ecmwf_ifs025/latest.json', 'catalogoTeselas',
                 { ttl: 120, swr: 600, nav: 60, tipo: 'application/json', origen: 'open-meteo-tiles', enVercelCorre: 'api/omtiles.js' }],
  ['omtiles',    '/omtiles/ecmwf_ifs025/2026/09/05/0000Z/data.om', 'tesela',
                 { ttl: 86400, swr: 604800, nav: 300, tipo: 'application/octet-stream', origen: 'open-meteo-tiles', enVercelCorre: 'api/omtiles.js' }],
  ['omtiles',    '/api/omtiles?ruta=ecmwf_ifs025/latest.json', 'catalogoTeselas',
                 { ttl: 120, swr: 600, nav: 60, tipo: 'application/json', origen: 'open-meteo-tiles', carpeta: 'api' }],
  ['omtiles',    '/api/omtiles?ruta=ecmwf_ifs025/2026/09/05/0000Z/data.om', 'tesela',
                 { ttl: 86400, swr: 604800, nav: 300, tipo: 'application/octet-stream', origen: 'open-meteo-tiles', carpeta: 'api' }],
];

const cargados = {};
const cargar = async (f, carpeta = 'netlify') => cargados[`${carpeta}/${f}`] ??= (await import(
  pathToFileURL(path.join(aqui, ...(carpeta === 'api' ? ['api'] : ['netlify', 'functions']), `${f}.js`)).href)).default;

const arrancar = async (f, ruta, doble, carpeta) => {
  const pedidas = [];
  globalThis.fetch = async (u) => { const url = String(u); pedidas.push(url); return DOBLES[doble](url); };
  const fn = await cargar(f, carpeta);
  const r = await fn(new Request(`https://x${ruta}`));
  return { r, pedidas, h: Object.fromEntries(r.headers) };
};

for (const [f, ruta, doble, antes] of CASOS) {
  const nom = antes.carpeta === 'api'
    ? `api/${f}.js ${ruta.replace(/^\/[^?]*/, '')}`
    : `${f}.js ${antes.enVercelCorre ? `[en Vercel corre ${antes.enVercelCorre}] ` : ''}${ruta.replace(/^\/[^?]*/, '').slice(0, 24) || ruta}`;
  let res;
  try { res = await arrancar(f, ruta, doble, antes.carpeta); }
  catch (e) { ok(`${nom}: arranca`, false, String(e?.message || e)); continue; }
  const { r, h } = res;
  if (r.status !== 200) { ok(`${nom}: contesta 200 con la fuente doblada`, false, `${r.status} · ${(await r.text()).slice(0, 100)}`); continue; }

  const cdn = directivas(h['cdn-cache-control']);
  ok(`${nom}: sin netlify-cdn-cache-control`, !('netlify-cdn-cache-control' in h));
  ok(antes.enVercelCorre
       ? `${nom}: pide al CDN ${antes.ttl} s (s-maxage), como decía su cabecera de Netlify`
       : `${nom}: el CDN de Vercel guarda ${antes.ttl} s (s-maxage), como antes`,
     cdn['s-maxage'] === antes.ttl, h['cdn-cache-control'] ?? '(sin cdn-cache-control)');
  if (antes.swr) ok(`${nom}: stale-while-revalidate=${antes.swr}, como antes`,
     cdn['stale-while-revalidate'] === antes.swr, h['cdn-cache-control']);
  else ok(`${nom}: sin stale-while-revalidate, como antes: al caducar refresca en la propia petición`,
     !('stale-while-revalidate' in cdn), h['cdn-cache-control']);
  if (antes.sie) ok(`${nom}: stale-if-error=${antes.sie}, que en Vercel no existía`,
     cdn['stale-if-error'] === antes.sie, h['cdn-cache-control']);
  ok(`${nom}: el navegador guarda ${antes.nav} s, como antes`,
     h['cache-control'] === `public, max-age=${antes.nav}`, h['cache-control']);
  ok(`${nom}: content-type ${antes.tipo}`, h['content-type'] === antes.tipo, h['content-type']);
  ok(`${nom}: CORS abierto`, h['access-control-allow-origin'] === '*');
  if (antes.origen) ok(`${nom}: x-origen ${antes.origen}`, h['x-origen'] === antes.origen, h['x-origen']);
}

/* Y con la fuente caída, no-store y sin cabecera de CDN: un 5xx no se pega. */
console.log('\n  y con la fuente caída, nada se queda pegado en el CDN\n');
for (const [f, ruta, carpeta] of [['om', '/om?api=fc&latitude=43.42&longitude=-2.72'], ['mareas', '/mareas'],
                                  ['estaciones', '/estaciones?lat=43.42&lon=-2.72'], ['omtiles', '/omtiles/x/latest.json'],
                                  ['omtiles', '/api/omtiles?ruta=x/latest.json', 'api']]) {
  const { r, h } = await arrancar(f, ruta, 'caida', carpeta);
  ok(`${carpeta === 'api' ? 'api/' : ''}${f}.js con la fuente en 503: no-store y sin cdn-cache-control (contestó ${r.status})`,
     h['cache-control'] === 'no-store' && !('cdn-cache-control' in h) && !('netlify-cdn-cache-control' in h),
     JSON.stringify(h));
}

/* ══ 3. RAINVIEWER POR /om ═════════════════════════════════════════ */
console.log('\n  el catálogo de RainViewer entra por /om\n');
{
  const { r, pedidas } = await arrancar('om', '/om?api=rain', 'openMeteo');
  ok('om.js con api=rain contesta 200',
     r.status === 200, String(r.status));
  ok('y pide EXACTAMENTE el catálogo de RainViewer, sin parámetros',
     pedidas.length === 1 && pedidas[0] === 'https://api.rainviewer.com/public/weather-maps.json',
     pedidas.join(' '));
  const src = fs.readFileSync(path.join(aqui, 'netlify', 'functions', 'om.js'), 'utf8');
  ok('om.js tiene rain en PERMITIDOS con esa URL',
     /rain:\s*'https:\/\/api\.rainviewer\.com\/public\/weather-maps\.json'/.test(src));
  ok('y rain: 300 en CACHE',
     /\brain:\s*300\b/.test(src));
}

/* ══ 4. LOS FICHEROS, LEÍDOS ═══════════════════════════════════════ */
console.log('\n  los siete ficheros importan la puerta y no queda cabecera de Netlify\n');
for (const f of ['om', 'radar', 'mareas', 'webcams', 'rayos', 'estaciones', 'omtiles', 'satelite']) {
  const src = fs.readFileSync(path.join(aqui, 'netlify', 'functions', `${f}.js`), 'utf8');
  ok(`${f}.js importa cabeceras de ../../lib/cabeceras.mjs`,
     /import\s*\{[^}]*\bcabeceras\b[^}]*\}\s*from\s*'\.\.\/\.\.\/lib\/cabeceras\.mjs'/.test(src));
  ok(`${f}.js no escribe netlify-cdn-cache-control`,
     !src.includes('netlify-cdn-cache-control'));
  ok(`${f}.js no escribe s-maxage a mano`,
     !src.includes('s-maxage'));
}
/* api/omtiles.js es el único de api/ que no es un envoltorio: tiene que
   importar la puerta él mismo, y dejar de escribir max-age a mano (su
   línea 48 de antes: 'public, max-age=60' | 'public, max-age=300'). */
{
  const src = sinComentarios(fs.readFileSync(path.join(aqui, 'api', 'omtiles.js'), 'utf8'));
  ok('api/omtiles.js importa cabeceras de ../lib/cabeceras.mjs',
     /import\s*\{[^}]*\bcabeceras\b[^}]*\}\s*from\s*'\.\.\/lib\/cabeceras\.mjs'/.test(src));
  ok('api/omtiles.js no escribe max-age ni s-maxage a mano',
     !src.includes('max-age') && !src.includes('s-maxage'));
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
if (mal) process.exit(1);
