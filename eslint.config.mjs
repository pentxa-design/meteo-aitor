/* ═══════════════════════════════════════════════════════════════════
   Revisión estática antes de publicar
   ───────────────────────────────────────────────────────────────────
   POR QUÉ EXISTE ESTO: el 23-08-2026 una variable huérfana (`ex`, que
   quedó de cuando las mareas se calculaban con el modelo) reventaba el
   pintado de la app en los sitios de costa. Como iba en medio, se llevó
   por delante el aviso de "datos caducados" y la petición de datos
   nuevos: se llegó a ver una previsión de OCHO HORAS antes en pantalla,
   sin una sola marca de que lo fuera.

   `node --check` NO lo cogía: solo mira la sintaxis, y `ex` era sintaxis
   perfectamente válida. Hace falta mirar los ámbitos, y eso es esto.

   app.js y maps.js son scripts clásicos que COMPARTEN el ámbito global,
   así que lo que declara uno lo usa el otro. La lista de esos nombres se
   saca leyendo los ficheros, para que no haya que mantenerla a mano.

   AMPLIADO el 05-09-2026 (revisión del 04-09, §13): middleware.js,
   lib/*.mjs, netlify/functions/*.js y api/*.js no estaban en ninguna
   lista. Y lo peor no es que no se mirasen: es que ESLint los daba por
   BUENOS. Su config de fábrica casa todo *.js/*.mjs con cero reglas, así
   que `eslint middleware.js` salía en verde sin mirar una variable
   —medido: `--print-config middleware.js` → `rules: {}`—. La puerta que
   decide si le deja entrar y la única puerta del almacén se publicaban
   así. Ahora cada grupo lleva las globales de DONDE CORRE, que son tres
   sitios distintos: el navegador, Node y el Edge de Vercel.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';

const FICHEROS = ['app.js', 'maps.js', 'sw.js'];

/** Nombres declarados en el nivel superior de los ficheros del proyecto. */
function globalesDelProyecto() {
  const out = {};
  for (const f of FICHEROS) {
    let texto;
    try { texto = fs.readFileSync(new URL(f, import.meta.url), 'utf8'); } catch { continue; }
    for (const linea of texto.split('\n')) {
      let m;
      if ((m = linea.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/))) out[m[1]] = 'writable';
      if ((m = linea.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/)))     out[m[1]] = 'writable';
      if ((m = linea.match(/^(?:const|let|var)\s*\{([^}]+)\}/)))
        for (const t of m[1].split(',')) {
          const n = t.split(':').pop().trim();
          if (/^[A-Za-z_$][\w$]*$/.test(n)) out[n] = 'writable';
        }
    }
  }
  return out;
}

const NAVEGADOR = [
  'window','document','navigator','location','console','fetch','Request','Response','Headers',
  'URL','URLSearchParams','AbortController','Blob','localStorage','sessionStorage','setTimeout',
  'clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame',
  'performance','ResizeObserver','IntersectionObserver','MutationObserver','Image','Event',
  'CustomEvent','TextDecoder','TextEncoder','atob','btoa','structuredClone','matchMedia',
  'getComputedStyle','caches','self','alert','confirm','FileReader','File','FormData',
  'DOMParser','Notification','screen','history','addEventListener','removeEventListener',
  'createImageBitmap','crypto','indexedDB','WebSocket','Worker','queueMicrotask','reportError',
].reduce((a, k) => (a[k] = 'readonly', a), {});

// Librerías que se cargan por <script> antes que la app
const EXTERNOS = { maplibregl: 'readonly', OMWeatherMapLayer: 'readonly', L: 'readonly' };

/* Las funciones del servidor son OTRA COSA: módulos de Node, no scripts
   del navegador. Se revisan aparte y con sus propias globales.

   POR QUÉ SE AÑADIERON, el 26-08-2026: al reescribir `api/parte.mjs` me
   dejé `capeMax`, `quien` y `lluvia` sin declarar. El revisor dio TODO
   POR BUENO —solo miraba app.js, maps.js y sw.js— y se publicó. El parte
   de las 06:30 salió diciendo **«no he podido mirar 14»**, los catorce
   emplazamientos.

   Se salvó por los pelos y por una decisión de esa misma tarde: que el
   parte diga en voz alta los sitios que no ha podido mirar. Si eso no
   estuviera, habría salido un «día limpio» con cero sitios comprobados
   detrás.

   lib/*.mjs va con estas mismas: lo importan los api/*.mjs (el almacén,
   Euskalmet, la CA de Izenpe). La excepción es lib/cabeceras.mjs, que
   la importan las ocho funciones del Edge; no usa ninguna global, así
   que aquí da igual, pero si algún día usa una, tiene que estar en las
   dos listas. */
const NODE = [
  'process', 'console', 'fetch', 'Response', 'Request', 'Headers', 'URL',
  'URLSearchParams', 'Buffer', 'setTimeout', 'clearTimeout', 'setInterval',
  'clearInterval', 'TextDecoder', 'TextEncoder', 'atob', 'btoa', 'crypto',
  'structuredClone', 'queueMicrotask', 'AbortController', 'AbortSignal', 'Blob',
].reduce((a, k) => (a[k] = 'readonly', a), {});

/* Y lo que corre en el EDGE de Vercel —middleware.js, los ocho
   intermediarios de netlify/functions/ y sus envoltorios api/*.js— no es
   ni Node ni navegador: sin `require`, sin ficheros, sin `window`. La
   lista es la de vercel.com/docs/functions/runtimes/edge (versión del
   03-08-2026), que además dice, textual, que «`Buffer` is globally
   exposed» y que `process.env` está. Se ponen los dos porque se usan:
   `Buffer` en netlify/functions/estaciones.js (leer la caducidad de la
   clave de AEMET) y `process.env` en middleware.js, estaciones.js y
   webcams.js. Sin decirlo aquí, ESLint los cantaría como huérfanos. */
const EDGE = [
  'console', 'fetch', 'Request', 'Response', 'Headers', 'FormData', 'File', 'Blob',
  'URL', 'URLSearchParams', 'URLPattern', 'Event', 'EventTarget', 'TextEncoder',
  'TextDecoder', 'atob', 'btoa', 'ReadableStream', 'WritableStream', 'TransformStream',
  'crypto', 'AbortController', 'AbortSignal', 'DOMException', 'structuredClone',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
  'process', 'Buffer', 'EdgeRuntime',
].reduce((a, k) => (a[k] = 'readonly', a), {});

const REGLAS_COMUNES = {
  'no-undef': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-dupe-else-if': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-self-compare': 'error',
  'no-sparse-arrays': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'no-fallthrough': 'error',
  'no-cond-assign': 'error',
  'no-func-assign': 'error',
  'no-obj-calls': 'error',
  'no-unsafe-negation': 'error',
  'no-unsafe-optional-chaining': 'error',
  'no-async-promise-executor': 'error',
  'no-constant-condition': ['error', { checkLoops: false }],
};

/* Variables e imports muertos. Es la otra mitad de lo de `ex`: una
   variable que se declara y no se usa es un cabo suelto de un cambio a
   medias. Los argumentos y el `catch (e)` no cuentan: se dejan a
   propósito por legibilidad.

   Solo en los ámbitos nuevos, que medidos el 05-09-2026 están a cero.
   En api/*.mjs NO (todavía): salen cinco, en euskalmet.mjs (`API`,
   `apunta`) y vigilante.mjs (`noPudeLeerElEstado`, `cuando`,
   `noSeGuardo`), y el vigilante no se toca en esta ronda. Cuando se
   limpien, se añade aquí y se acabó. */
const SIN_MUERTAS = { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] };

export default [
  {
    files: ['api/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: NODE,
    },
    rules: REGLAS_COMUNES,
  },
  {
    files: ['lib/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: NODE,
    },
    rules: { ...REGLAS_COMUNES, ...SIN_MUERTAS },
  },
  {
    files: ['middleware.js', 'netlify/functions/*.js', 'api/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: EDGE,
    },
    rules: { ...REGLAS_COMUNES, ...SIN_MUERTAS },
  },
  {
    files: ['app.js', 'maps.js', 'sw.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...NAVEGADOR, ...EXTERNOS, ...globalesDelProyecto() },
    },
    rules: {
      // La que habría cazado lo de `ex`
      'no-undef': 'error',
      // Fallos que tampoco da `node --check` y que sí rompen en marcha
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-self-compare': 'error',
      'no-sparse-arrays': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-fallthrough': 'error',
      'no-cond-assign': 'error',
      'no-func-assign': 'error',
      'no-obj-calls': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-async-promise-executor': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
];
