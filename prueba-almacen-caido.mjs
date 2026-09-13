/* ═══════════════════════════════════════════════════════════════════
   CON EL ALMACÉN CAÍDO, ¿QUÉ CONTESTA CADA FUNCIÓN?
   ───────────────────────────────────────────────────────────────────
   Suyo, 01-09-2026:

     *«pero esto es lo que digo a diario, siempre falla casi lo mismo…
       ¿podéis hacer que esto no pase nunca más?»*

   Tenía razón. Llevo tres días arreglando el MISMO fallo de uno en uno
   —torres, ajustes, campo, marcador, suscribir— y hoy salía otro más,
   `calibrar`, diciendo *«no se te escapa ni un rayo con 700»* cuando lo
   que pasaba es que no había podido leer ni un caso.

   Arreglarlos de uno en uno no vale: siempre queda el siguiente. Así que
   esto no lee el código buscando frases (eso pasa en verde aunque el
   arreglo no funcione, ya me pasó el 31-08 con el cartel de tormenta).
   Esto **ARRANCA CADA FUNCIÓN DE VERDAD con el almacén roto a propósito**
   y mira lo que devuelve. Si alguna contesta 200 —o sea, «toma, tus
   datos»— cuando no ha podido leer nada, la publicación se para.

   Cómo se rompe: se copia `api/` a un sitio temporal cambiando el
   `import ... from '@vercel/blob'` por un doble que lanza el error
   literal de Vercel («This store has been suspended»). Nada toca al
   almacén de verdad ni a sus datos.

   Y lo que vigila no es solo el 200: vigila que la respuesta no traiga
   un cero o una lista vacía disfrazados de dato bueno, que es la forma
   que tiene este fallo de matar a alguien — «0 avisos», «0 muestras»,
   «ningún emplazamiento» leídos como «hoy no pasa nada».
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

/* ── EL ALMACÉN ROTO ──────────────────────────────────────────────── */
const DOBLE = `
const suspendido = () => {
  const e = new Error('Vercel Blob: This store has been suspended.');
  e.name = 'BlobServiceNotAvailable';
  throw e;
};
export const get = suspendido;
export const put = suspendido;
export const del = suspendido;
export const list = suspendido;
export const head = suspendido;
`;

/* El temporal va DENTRO del proyecto, no en /tmp: si no, las funciones
   no encuentran `web-push` ni el resto de node_modules y la prueba se
   cae por donde no es. Se borra al terminar. */
const tmp = fs.mkdtempSync(path.join(aqui, '.almacen-caido-'));
fs.mkdirSync(path.join(tmp, 'api'));
fs.mkdirSync(path.join(tmp, 'lib'));
fs.writeFileSync(path.join(tmp, 'lib', 'blob-falso.mjs'), DOBLE);

for (const d of ['api', 'lib']) {
  for (const f of fs.readdirSync(path.join(aqui, d))) {
    if (!f.endsWith('.mjs')) continue;
    const txt = fs.readFileSync(path.join(aqui, d, f), 'utf8')
      /* Desde el 03-09 el motor carga el Blob con un `import()` perezoso,
         así que el texto ya no es siempre `from '@vercel/blob'`. Se
         sustituye la RUTA, que sirve para las dos formas. */
      .replace(/'@vercel\/blob'/g, `'${d === 'api' ? '../lib' : '.'}/blob-falso.mjs'`);
    fs.writeFileSync(path.join(tmp, d, f), txt);
  }
}

/* ── UN `res` DE MENTIRA QUE APUNTA LO QUE LE DICEN ───────────────── */
function resFalso() {
  const r = { code: null, body: null, cabeceras: {} };
  r.setHeader = (k, v) => { r.cabeceras[k] = v; };
  r.status = c => { r.code = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.send = b => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

/* Qué pintas tiene un «vacío disfrazado de dato». Si la respuesta va con
   200 y trae alguna de estas, es que está contando como cero algo que no
   ha podido mirar. */
function vacioDisfrazado(b) {
  if (!b || typeof b !== 'object') return null;
  const malos = [];
  const mirar = (k, v) => {
    if (Array.isArray(v) && v.length === 0) malos.push(`${k}: []`);
    else if (v === 0 && /total|muestras|casos|aparatos|guardadas|estaciones|notas|nuevas/i.test(k))
      malos.push(`${k}: 0`);
    else if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) mirar(`${k}.${k2}`, v2);
  };
  for (const [k, v] of Object.entries(b)) mirar(k, v);
  return malos.length ? malos.join(' · ') : null;
}

/* ── LAS SIETE, UNA A UNA ─────────────────────────────────────────── */
const CASOS = [
  { f: 'torres.mjs',    q: {},              nom: 'sus emplazamientos' },
  { f: 'ajustes.mjs',   q: {},              nom: 'sus ajustes' },
  { f: 'campo.mjs',     q: {},              nom: 'sus notas de campo' },
  { f: 'marcador.mjs',  q: {},              nom: 'el marcador de modelos' },
  { f: 'calibrar.mjs',  q: {},              nom: 'el listón de CAPE' },
  { f: 'foto.mjs',      q: {},              nom: 'sus fotos' },
  { f: 'suscribir.mjs', q: {},              nom: 'los móviles avisados' },
  { f: 'vigilante.mjs', q: { pulso: '1' },  nom: 'el pulso del vigilante' },
];

/* El nombre de esta línea está atado en NO-SE-TOCA.md: «con el almacén
   caído, ninguna función miente». No se cambia sin cambiarlo allí. */
console.log('\n  con el almacén caído, ninguna función miente\n');

/* La variable de los móviles de reserva se quita: aquí se prueba el caso
   peor, que es no tener NI reserva ni almacén. */
delete process.env.MOVILES_EXTRA;

for (const c of CASOS) {
  const mod = await import(pathToFileURL(path.join(tmp, 'api', c.f)).href);
  const res = resFalso();
  let reventó = null;
  try {
    await mod.default({ method: 'GET', query: c.q, headers: {}, body: null }, res);
  } catch (e) { reventó = String(e?.message || e); }

  const disfraz = res.code === 200 ? vacioDisfrazado(res.body) : null;
  const honesta = reventó                       // peta → Vercel devuelve 500: honesto
    || res.code !== 200                         // lo dice con un código de error
    || (!disfraz && res.body?.fallo)            // 200 pero con el fallo a la vista
    || (!disfraz && res.body?.nota);

  ok(`${c.f.padEnd(14)} no le vende ${c.nom} en falso`,
     !!honesta,
     disfraz ? `contestó 200 con → ${disfraz}` : `contestó 200 con ${JSON.stringify(res.body).slice(0, 110)}`);
}

/* ═══════════════════════════════════════════════════════════════════
   Y QUE EL VIGILANTE ARRANQUE. LA PASADA ENTERA, NO EL PULSO.
   ───────────────────────────────────────────────────────────────────
   Puesto el 01-09-2026 después de encontrar que **el vigilante llevaba
   toda la tarde muerto** y lo había roto yo: al meter la cadencia
   adaptativa empecé a usar `antes` ochenta líneas por encima de donde se
   declaraba, y eso en JavaScript no es «undefined», es
   `ReferenceError: Cannot access 'antes' before initialization`. TODA
   pasada reventaba nada más empezar. Ni un aviso de tormenta a su móvil.

   Y ninguna guardia lo cazó porque **ninguna lo arrancaba**: las pruebas
   del servidor leían su código con `regex`, y el código decía justo lo
   que buscaban. El GET del pulso sí se arrancaba — y pasaba en verde,
   porque el fallo estaba en el POST, que es la pasada de verdad.

   Esto arranca el POST. Si el vigilante revienta por lo que sea, no se
   publica.                                                             */
console.log('\n  el vigilante ARRANCA\n');
{
  const mod = await import(pathToFileURL(path.join(tmp, 'api', 'vigilante.mjs')).href
                           + '?post=1');
  const res = resFalso();
  let reventó = null;
  try {
    await mod.default({ method: 'POST', query: {}, headers: {}, body: {} }, res);
  } catch (e) { reventó = `${e?.constructor?.name}: ${e?.message}`; }

  ok('la pasada entera del vigilante no revienta',
     !reventó,
     reventó ? `${reventó}  ← esto deja su móvil sin avisos` : '');
  ok('y contesta diciendo cuántos sitios ha mirado',
     !reventó && res.code === 200 && Number(res.body?.mirados) > 0,
     `contestó ${res.code} · ${JSON.stringify(res.body).slice(0, 120)}`);
}

/* ── Y QUE «AÚN NO EXISTE» SIGA SIENDO VACÍO DE VERDAD ────────────── */
/* La otra mitad del trato: si esto no valiera, el primer día de cada
   cajón la app diría «no he podido leer» y sería igual de mentira.
   Va con SU PROPIO doble y su propia copia de la puerta, porque Node se
   guarda los módulos ya cargados y reescribir el fichero no basta. */
console.log('\n  Pero un cajón sin estrenar SÍ es vacío de verdad\n');
{
  /* `put` y `del` van aunque esta prueba no los use: desde el 03-09 la
     puerta también escribe, y un import que pide un nombre que el doble
     no exporta revienta al cargarse, antes de llegar a la prueba. */
  fs.writeFileSync(path.join(tmp, 'lib', 'blob-nuevo.mjs'), `
export const get = async () => {
  const e = new Error('The requested blob does not exist');
  e.name = 'BlobNotFoundError';
  throw e;
};
export const put = async () => ({ url: 'no-se-usa-en-esta-prueba' });
export const del = async () => {};
`);
  /* Desde el 03-09 la puerta no llama al Blob: llama al MOTOR, que es
     quien sabe dónde se guarda. Así que el doble hay que meterlo un
     piso más abajo — en una copia del motor — y colgar de ella una
     copia de la puerta. */
  fs.writeFileSync(path.join(tmp, 'lib', 'motor-nuevo.mjs'),
    fs.readFileSync(path.join(tmp, 'lib', 'motor.mjs'), 'utf8')
      .replace("'./blob-falso.mjs'", "'./blob-nuevo.mjs'"));
  fs.writeFileSync(path.join(tmp, 'lib', 'almacen-nuevo.mjs'),
    fs.readFileSync(path.join(tmp, 'lib', 'almacen.mjs'), 'utf8')
      .replace("'./motor.mjs'", "'./motor-nuevo.mjs'"));
  const { leerLista, leerJSON } = await import(
    pathToFileURL(path.join(tmp, 'lib', 'almacen-nuevo.mjs')).href);
  const l = await leerLista('avisos/loquesea.json');
  const j = await leerJSON('avisos/loquesea.json', { muestras: [] });
  ok('«no existe todavía» devuelve la lista vacía sin lanzar',
     Array.isArray(l.dato) && l.dato.length === 0 && l.hay === false);
  ok('y dice con `hay: false` que no había fichero, no que él no tenga nada',
     j.hay === false && Array.isArray(j.dato?.muestras));
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n  ${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
