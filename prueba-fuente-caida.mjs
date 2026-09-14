/* ═══════════════════════════════════════════════════════════════════
   CON LA FUENTE CAÍDA, ¿QUÉ CONTESTA CADA FUNCIÓN?
   ───────────────────────────────────────────────────────────────────
   Suyo, 01-09-2026, después de que le contara por tercera vez el mismo
   arreglo:

     *«esto me suena de ayer o anteayer y vuelve a fallar»*

   Y tenía razón otra vez. Lo que arreglé el 30, el 31 y hoy fue **el
   almacén**: las ocho funciones que guardan sus cosas. Pero el fallo no
   es del almacén, es de **leer de fuera**: cuando la fuente no contesta
   y la función devuelve un hueco con un HTTP 200, la app lo pinta como
   dato bueno. Y las que le dicen si hay RAYOS, si llueve o cuánto sopla
   no leen del almacén: leen de Open-Meteo, de AEMET y de Euskalmet.

   Ésas son las que pueden matarle. `avisos/rayos` diciendo «no hay
   rayos» porque AEMET no ha contestado es exactamente el caso del poste
   de los fusibles a 3 m con la torre de 60 al lado.

   Así que esto hace con la RED lo que `prueba-almacen-caido.mjs` hace
   con el almacén: **arranca cada función con `fetch` roto a propósito**
   y mira qué devuelve. Dos familias, dos firmas:
     · `api/*.mjs`            → handler(req, res)
     · `netlify/functions/*`  → handler(request) → Response

   Lo que se exige es lo de siempre, su regla del 27-08: **un hueco no se
   pinta de cero**. O contesta con un código de error, o el 200 lleva el
   fallo escrito donde la app lo pueda ver. Lo que no puede es devolver
   una lista vacía en verde.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `\n        ${pista}` : ''}`); }
};

/* ── LA RED ROTA ──────────────────────────────────────────────────── */
const original = globalThis.fetch;
const romperRed = () => {
  globalThis.fetch = async () => {
    const e = new Error('fetch failed');
    e.cause = { code: 'ENOTFOUND' };
    throw e;
  };
};
/* Y la otra mitad: la fuente contesta, pero con un 503. Es más
   traicionero que la caída, porque `fetch` NO lanza: hay que mirar
   `r.ok`, y ahí es donde se cuela el hueco pintado de cero. */
const redQueDiceNo = () => {
  globalThis.fetch = async () => new Response('upstream caído', {
    status: 503, statusText: 'Service Unavailable',
  });
};

function resFalso() {
  const r = { code: null, body: null, cabeceras: {} };
  r.setHeader = (k, v) => { r.cabeceras[k] = v; };
  r.status = c => { r.code = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.send = b => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

/* Un cuerpo con listas vacías o ceros de cuenta, en verde, es el fallo. */
function vacioDisfrazado(b) {
  if (!b || typeof b !== 'object') return null;
  const malos = [];
  const mirar = (k, v, hondo = 0) => {
    if (hondo > 4) return;
    if (Array.isArray(v) && v.length === 0) malos.push(`${k}: []`);
    else if (v === 0 && /total|casos|estaciones|rayos|avisos|descargas|notas|puntos|tormentas/i.test(k))
      malos.push(`${k}: 0`);
    else if (v && typeof v === 'object')
      for (const [k2, v2] of Object.entries(v)) mirar(`${k}.${k2}`, v2, hondo + 1);
  };
  for (const [k, v] of Object.entries(b)) mirar(k, v);
  return malos.length ? malos.join(' · ') : null;
}

/* Se acepta como honesta la respuesta que: peta (Vercel devuelve 500),
   contesta con código de error, o va en 200 pero DICE que hay fallo. */
const DICE_FALLO = /fallo|error|no he podido|no se ha podido|sin dato|no contesta|caíd|no disponible/i;

async function mirar(nom, quien, invocar) {
  let code = null, cuerpo = null, reventó = null;
  try {
    const r = await invocar();
    code = r.code; cuerpo = r.cuerpo;
  } catch (e) { reventó = String(e?.message || e).slice(0, 80); }

  const txt = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo ?? '');
  /* El cuerpo de las `netlify/functions` llega como TEXTO. La primera
     versión de esto miraba `typeof cuerpo === 'object'` y por eso nunca
     entraba a buscar el hueco: rompí `rayos` para que dijera «0
     descargas» en verde y la prueba pasó igual (01-09-2026). Era el
     mismo fallo que estoy persiguiendo, pero dentro de la prueba. Hay
     que convertir el texto a datos ANTES de juzgarlo. */
  let dato = cuerpo;
  if (typeof cuerpo === 'string') { try { dato = JSON.parse(cuerpo); } catch { dato = null; } }
  const disfraz = code === 200 && dato && typeof dato === 'object' ? vacioDisfrazado(dato) : null;
  const honesta = reventó
    || (code != null && code !== 200)
    || (!disfraz && DICE_FALLO.test(txt))
    || (code === 200 && txt.length > 2 && !disfraz && !/^\[\]$|^\{\}$/.test(txt));

  ok(`${nom.padEnd(26)} ${quien}`,
     !!honesta,
     disfraz ? `200 con → ${disfraz}` : `${code} · ${txt.slice(0, 120)}`);
}

/* ── LAS QUE LEEN DE FUERA ────────────────────────────────────────── */
const NETLIFY = [
  ['rayos.js',      '?tormentas=1'],
  ['rayos.js',      ''],
  ['estaciones.js', '?lat=43.42&lon=-2.72'],
  ['mareas.js',     '?lat=43.42&lon=-2.72'],
  ['radar.js',      ''],
  ['satelite.js',   ''],
  ['webcams.js',    '?lat=43.42&lon=-2.72'],
  ['om.js',         '?api=fc&latitude=43.42&longitude=-2.72&hourly=temperature_2m'],
  /* Faltaba desde que existe esta prueba (revisión del 04-09-2026, §12).
     Es el camino de reserva de las teselas: se usa cuando la red móvil no
     llega al S3 de Open-Meteo, o sea en el monte. Lee la RUTA del camino
     (`config.path = '/omtiles/*'`), no la consulta, y por eso abajo se le
     monta la URL aparte. La ruta es la del catálogo que maps.js pide al
     arrancar. */
  ['omtiles.js',    '/dwd_icon_eu/latest.json'],
];
/* api/omtiles.js NO es un envoltorio de una línea como los otros siete
   de api/: es OTRA implementación (la ruta le llega en `?ruta=` por la
   reescritura de vercel.json) y es la que corre de verdad en Vercel. Si
   solo se probara la de netlify/functions/ se estaría probando la que no
   se sirve. Misma firma (request) → Response. */
const API_EDGE = [
  ['omtiles.js',    '?ruta=dwd_icon_eu/latest.json'],
];
const MJS = [
  ['euskalmet.mjs', { lat: '43.42', lon: '-2.72' }],
];

for (const modo of [['la red se cae', romperRed], ['la fuente dice 503', redQueDiceNo]]) {
  const [comoSeLlama, romper] = modo;
  console.log(`\n  con la fuente caída, ninguna función miente — ${comoSeLlama}\n`);
  romper();

  for (const [carpeta, lista, prefijo] of [
    ['netlify/functions', NETLIFY,  ''],
    ['api',               API_EDGE, 'api/'],
  ]) {
    for (const [f, qs] of lista) {
      const url = pathToFileURL(path.join(aqui, carpeta, f)).href
                + `?v=${encodeURIComponent(comoSeLlama)}`;
      // La de netlify/functions/omtiles.js es la única que lee el camino
      // de la URL (`/omtiles/<ruta>`); las demás solo miran la consulta.
      const camino = f === 'omtiles.js' && prefijo === ''
        ? '/omtiles' : `/api/${f.replace('.js', '')}`;
      await mirar(`${prefijo}${f}${qs.slice(0, 14)}`, comoSeLlama, async () => {
        const mod = await import(url);
        const r = await mod.default(new Request(`https://x${camino}${qs}`));
        return { code: r?.status ?? null, cuerpo: r ? await r.text() : null };
      });
    }
  }

  for (const [f, query] of MJS) {
    const url = pathToFileURL(path.join(aqui, 'api', f)).href
              + `?v=${encodeURIComponent(comoSeLlama)}`;
    await mirar(f, comoSeLlama, async () => {
      const mod = await import(url);
      const res = resFalso();
      await mod.default({ method: 'GET', query, headers: {}, body: null }, res);
      return { code: res.code, cuerpo: res.body };
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   OMTILES A FONDO: A QUIÉN PIDE Y QUÉ CONTESTA CUANDO NO HAY
   ───────────────────────────────────────────────────────────────────
   Lo de arriba solo mira que no mienta. Aquí se fija además el ORIGEN:
   el 04-09-2026 map-tiles.open-meteo.com desapareció del DNS y las dos
   funciones pasaron al S3 de Open-Meteo (su `BASE`). Una tesela pedida
   a un host que no existe no es un error que se vea: es un mapa en gris
   que se lee como «aquí no llueve», y ninguna prueba lo vigilaba.

   Medido el 05-09-2026 con la red rota a propósito, en las dos
   implementaciones: red caída → 502 con el fallo escrito; S3 en 503 ó
   404 → ese mismo código, sin cachear; y el Range viaja de ida y el
   Content-Range de vuelta, que es lo que el lector .om necesita para no
   bajarse el fichero entero (lo que fundió los 300 créditos de Netlify
   del 21 al 24 de agosto). Esto fija que siga así.
   ═══════════════════════════════════════════════════════════════════ */
console.log('\n  omtiles, el camino de reserva de las teselas: a quién pide y qué contesta cuando no hay\n');
{
  const S3 = 'https://openmeteo.s3.amazonaws.com/data_spatial';
  const RUTA = 'dwd_icon_eu/latest.json';   // el catálogo que maps.js pide al arrancar
  /* Los nombres van escritos enteros, uno por implementación, y NO como
     `omtiles ${et}: …`. El guardia de NO-SE-TOCA.md (pruebas.js, «todas
     las reglas de NO-SE-TOCA.md siguen teniendo su prueba viva») busca
     cada nombre con `includes` sobre el TEXTO de este fichero, y un
     nombre montado en tiempo de ejecución no está en el texto. Medido el
     05-09-2026: con la plantilla, 0 de los 14 se encontraban, así que en
     cuanto se apuntaran en NO-SE-TOCA.md el guardia habría parado la
     publicación con «SIN PRUEBA». Cada cadena va en UNA línea, sin partir. */
  const NOMBRES = {
    'netlify': {
      s3:     'omtiles netlify: pide al S3 de Open-Meteo, no al map-tiles que desapareció del DNS el 04-09',
      ruta:   'omtiles netlify: reenvía la ruta y la consulta tal cual',
      rango:  'omtiles netlify: el Range va de ida y el 206 con Content-Range vuelve, que es lo que evita bajar el .om entero',
      sinRed: 'omtiles netlify: con la red caída contesta 5xx y DICE el fallo, no un 200 vacío',
      cache:  'omtiles netlify: y ese fallo no se queda cacheado, ni en el navegador ni en el CDN',
      s503:   'omtiles netlify: con el S3 en 503 reenvía el 503 sin cachearlo, no lo disfraza de 200',
      s404:   'omtiles netlify: con la pasada aún sin publicar (404 del S3) reenvía el 404 sin cachearlo',
    },
    'api (Vercel)': {
      s3:     'omtiles api (Vercel): pide al S3 de Open-Meteo, no al map-tiles que desapareció del DNS el 04-09',
      ruta:   'omtiles api (Vercel): reenvía la ruta y la consulta tal cual',
      rango:  'omtiles api (Vercel): el Range va de ida y el 206 con Content-Range vuelve, que es lo que evita bajar el .om entero',
      sinRed: 'omtiles api (Vercel): con la red caída contesta 5xx y DICE el fallo, no un 200 vacío',
      cache:  'omtiles api (Vercel): y ese fallo no se queda cacheado, ni en el navegador ni en el CDN',
      s503:   'omtiles api (Vercel): con el S3 en 503 reenvía el 503 sin cachearlo, no lo disfraza de 200',
      s404:   'omtiles api (Vercel): con la pasada aún sin publicar (404 del S3) reenvía el 404 sin cachearlo',
      cl:     'omtiles api (Vercel): un trozo pedido con Range vuelve con Content-Length exacto y sin guardarse en el CDN (la librería del mapa lo exige)',
      head:   'omtiles api (Vercel): un HEAD se reenvía como HEAD y vuelve sin cuerpo y con el Content-Length del fichero (así abre cada .om la librería)',
    },
  };
  const DOS = [
    ['netlify',      'netlify/functions/omtiles.js', `https://x/omtiles/${RUTA}?t=1`],
    ['api (Vercel)', 'api/omtiles.js',               `https://x/api/omtiles?ruta=${RUTA}&t=1`],
  ];
  /* Tres cabeceras, no una. `cache-control` es lo que mira el navegador;
     `cdn-cache-control` (y `vercel-cdn-cache-control`, que manda sobre
     las dos) es lo que guarda el CDN de Vercel, y es donde
     lib/cabeceras.mjs pone el TTL de verdad desde el 05-09-2026. La
     primera versión de esto solo miraba `max-age` en la primera: un
     error con `no-store` para el navegador y `s-maxage=600` para el CDN
     se quedaría pegado diez minutos y la prueba lo daba por bueno. */
  const CACHE = ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control'];
  const seGuarda = x => /max-age=[1-9]|s-maxage=[1-9]/.test(x.cache);
  for (const [et, fichero, urlApp] of DOS) {
    const N = NOMBRES[et];
    const mod = await import(pathToFileURL(path.join(aqui, fichero)).href + '?v=omtiles');
    const llamar = async (contesta, cab = {}, method = 'GET') => {
      let pedido = null, cabPedida = {}, metodo = null;
      globalThis.fetch = async (u, o) => { pedido = String(u); cabPedida = o?.headers ?? {}; metodo = o?.method ?? 'GET'; return contesta(); };
      const r = await mod.default(new Request(urlApp, { headers: cab, method }));
      const cache = CACHE.filter(h => r.headers.get(h)).map(h => `${h}: ${r.headers.get(h)}`).join(' · ');
      return { r, txt: await r.text(), pedido, cabPedida, cache, metodo };
    };

    const normal = await llamar(() => new Response('{"ok":1}', { status: 200 }));
    ok(N.s3,
       typeof normal.pedido === 'string' && normal.pedido.startsWith(S3 + '/') && !/map-tiles/.test(normal.pedido),
       `pidió ${normal.pedido}`);
    ok(N.ruta, normal.pedido === `${S3}/${RUTA}?t=1`, `pidió ${normal.pedido}`);

    const rango = await llamar(() => new Response(new Uint8Array(4), {
      status: 206, headers: { 'content-range': 'bytes 0-3/1000', 'content-type': 'application/octet-stream' },
    }), { range: 'bytes=0-3' });
    ok(N.rango,
       rango.cabPedida.range === 'bytes=0-3' && rango.r.status === 206
       && rango.r.headers.get('content-range') === 'bytes 0-3/1000' && rango.txt.length === 4,
       `range pedido=${rango.cabPedida.range} · ${rango.r.status} · content-range=${rango.r.headers.get('content-range')} · ${rango.txt.length} bytes`);
    /* 14-09-2026: 24 «Content-Length header missing» en dos cambios de capa: el
       HEAD con el que la librería abre cada .om volvía sin tamaño. */
    if (N.head) {
      const head = await llamar(() => new Response(null, {
        status: 200, headers: { 'content-length': '12345', 'content-type': 'application/octet-stream', 'accept-ranges': 'bytes' },
      }), {}, 'HEAD');
      ok(N.head,
         head.metodo === 'HEAD' && head.r.status === 200 && head.r.headers.get('content-length') === '12345' && head.r.headers.get('x-content-length') === '12345'
         && head.txt.length === 0 && /no-store/.test(head.r.headers.get('cdn-cache-control') || ''),
         `método=${head.metodo} · ${head.r.status} · content-length=${head.r.headers.get('content-length')} · cuerpo=${head.txt.length} · cdn=${head.r.headers.get('cdn-cache-control')}`);
    }
    if (N.cl) ok(N.cl,
       rango.r.headers.get('content-length') === '4'
       && /no-store/.test(rango.r.headers.get('cdn-cache-control') || '')
       && /Range/.test(rango.r.headers.get('vary') || ''),
       `content-length=${rango.r.headers.get('content-length')} · cdn=${rango.r.headers.get('cdn-cache-control')} · vary=${rango.r.headers.get('vary')}`);

    const sinRed = await llamar(() => { const e = new Error('fetch failed'); e.cause = { code: 'ENOTFOUND' }; throw e; });
    ok(N.sinRed,
       sinRed.r.status >= 500 && sinRed.txt.length > 0 && DICE_FALLO.test(sinRed.txt),
       `${sinRed.r.status} · ${JSON.stringify(sinRed.txt.slice(0, 80))}`);
    ok(N.cache, !seGuarda(sinRed), sinRed.cache || '(sin cabeceras de caché)');

    const s503 = await llamar(() => new Response('upstream caído', { status: 503 }));
    ok(N.s503, s503.r.status === 503 && !seGuarda(s503),
       `${s503.r.status} · ${s503.cache || '(sin cabeceras de caché)'}`);

    const s404 = await llamar(() => new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 }));
    ok(N.s404, s404.r.status === 404 && !seGuarda(s404),
       `${s404.r.status} · ${s404.cache || '(sin cabeceras de caché)'}`);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Y EN LA APP: UN FALLO DE CARGA NO SE LEE COMO «NO EXISTE»
   ───────────────────────────────────────────────────────────────────
   El peor sitio donde estaba este fallo no era el servidor: era el
   buscador de sus 2.692 emplazamientos. Si `data/estaciones.json`
   fallaba, se guardaba `[]` —que también cuenta como «ya cargado»— y
   **no se reintentaba en toda la sesión**. Escribía BI SOLLUBEMENDI, no
   salía, y eso se lee como «ese sitio no está».

   Esto no mira el código: EJECUTA las dos funciones sacadas de app.js.
   ═══════════════════════════════════════════════════════════════════ */
console.log('\n  un fallo de carga no se lee como «ese sitio no existe»\n');
{
  const app = fs.readFileSync(path.join(aqui, 'app.js'), 'utf8');
  const sacar = (firma, hasta = '\n}') => {
    const i = app.indexOf(firma);
    if (i < 0) throw new Error(`no encuentro «${firma}» en app.js`);
    return app.slice(i, app.indexOf(hasta, i) + hasta.length);
  };
  const traerCargar = (S, f) => new Function('S', 'fetch',
    `${sacar('async function cargarEstaciones() {')}\nreturn cargarEstaciones;`)(S, f);
  const traerRender = (S, ac) => new Function('S', '$', 'esc',
    `${sacar('function renderAc(list) {')}\nreturn renderAc;`)(S, () => ac, x => x);

  const S1 = {};
  const r1 = await traerCargar(S1, async () => { throw new Error('fetch failed'); })();
  ok('con la carga rota NO se guarda la lista vacía como buena',
     S1.estaciones === undefined && Array.isArray(r1) && r1.length === 0,
     'si se guarda [], la sesión entera se queda sin buscador');
  ok('y queda apuntado el fallo para poder decirlo',
     typeof S1.estacionesFallo === 'string' && S1.estacionesFallo.length > 0);

  let veces = 0;
  const r2 = await traerCargar(S1, async () => {
    veces++; return { ok: true, json: async () => [{ n: 'BI OIZ' }] };
  })();
  ok('el siguiente intento reintenta de verdad, no se queda muerto',
     veces === 1 && r2.length === 1 && S1.estacionesFallo === null,
     'antes `[]` valía como «ya cargado» y no volvía a pedirlo nunca');

  const ac = { innerHTML: '', hidden: true, _list: [{ viejo: 1 }] };
  traerRender({ estacionesFallo: 'HTTP 500' }, ac)([]);
  ok('sin resultados PERO con fallo de carga, se avisa en pantalla',
     ac.hidden === false && /No he podido cargar tu catálogo/.test(ac.innerHTML)
     && /no quiere decir que el sitio no esté/.test(ac.innerHTML),
     'un buscador mudo se lee como «ese sitio no existe»');
  ok('y no deja colgando los resultados de la búsqueda anterior',
     Array.isArray(ac._list) && ac._list.length === 0);

  const ac2 = { innerHTML: '', hidden: false, _list: null };
  traerRender({ estacionesFallo: null }, ac2)([]);
  ok('pero si no hubo fallo, no se inventa un aviso',
     ac2.hidden === true && ac2.innerHTML === '');
}

globalThis.fetch = original;
console.log(`\n  ${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
