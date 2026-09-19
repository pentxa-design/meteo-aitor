/* ═══════════════════════════════════════════════════════════════════
   SATÉLITE: LAS HORAS QUE SE OFRECEN Y LA BARRA QUE LAS RECORRE

   Dos hallazgos de la revisión del 04-09-2026, medidos el 05-09:

   1. `netlify/functions/satelite.js` prometía leer las horas del
      catálogo y las generaba con una resta. Medido el 05-09-2026 a las
      03:20Z: EUMETSAT declara un INTERVALO (inicio/fin/PT15M), así que
      la resta es lo que declara — pero sin guardas: si el fin viniera
      en el futuro se ofrecía igual, y a más de 15 min del fin el WMS
      devuelve 502 vacío (medido), que pintado es «cielo limpio».
      Aquí se prueban extraerTiempo() y horasDe() con XML de muestra en
      los DOS formatos que admite el WMS (intervalo y lista), y el
      servidor entero con un fetch falso: ninguna hora futura, la última
      comprobada con un GetMap, y si no se sirve, se retira.

   2. En `maps.js` el deslizador del satélite iba por `_idx`, los
      índices del MODELO con paso de 3 h, cuando el satélite trae 12
      fotogramas cada 15 min: la muesca 3 enseñaba el fotograma 9 y de
      la 4 en adelante saltaba al final. AEMET igual en previewT() y
      ahora(). Aquí se sacan irAPosicion/previewT/ahora del fichero de
      verdad y se les da una capa de satélite, una de AEMET, el radar y
      una de modelo, con un `document` de mentira.

   Las dos partes se han visto EN ROJO con los ficheros de antes de la
   ronda (copia pre-wf) antes de darlas por buenas.
   ═══════════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));

let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `  — ${pista}` : ''}`); }
};

/* ════════════════ 1. netlify/functions/satelite.js ════════════════ */

const RUTA_SAT = path.join(raiz, 'netlify', 'functions', 'satelite.js');
const sat = await import(pathToFileURL(RUTA_SAT).href + '?t=' + Date.now());
const { extraerTiempo, horasDe } = sat;

/* Un catálogo de muestra con la MISMA forma que el real medido el
   05-09-2026 (atributos default/units/nearestValue incluidos). Solo se
   cambia el valor de la dimensión según lo que se quiera probar.       */
const catalogo = (capas) => `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0"><Capability><Layer>
${Object.entries(capas).map(([nombre, dim]) => `<Layer queryable="1" opaque="0">
<Name>${nombre}</Name><Title>${nombre}</Title>
<CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>
<EX_GeographicBoundingBox><westBoundLongitude>-80</westBoundLongitude><eastBoundLongitude>80</eastBoundLongitude>
<southBoundLatitude>-80</southBoundLatitude><northBoundLatitude>80</northBoundLatitude></EX_GeographicBoundingBox>
${dim === null ? '' : `<Dimension name="time" default="2026-09-05T03:00:00Z" units="ISO8601" nearestValue="1">${dim}</Dimension>`}
</Layer>`).join('\n')}
</Layer></Capability></WMS_Capabilities>`;

const IR = 'msg_fes:ir108', CONV = 'msg_fes:rgb_convection', VIS = 'msg_fes:rgb_eview';
const INTERVALO_REAL = '2020-09-01T00:00:00.000Z/2026-09-05T03:00:00.000Z/PT15M';

console.log('\n  extraerTiempo(): lo que declara el catálogo, tal cual\n');

ok('extraerTiempo y horasDe se exportan de satelite.js',
   typeof extraerTiempo === 'function' && typeof horasDe === 'function',
   `extraerTiempo=${typeof extraerTiempo} horasDe=${typeof horasDe}`);

const seguro = (fn) => { try { return fn(); } catch (e) { return `LANZÓ ${e.message}`; } };

{
  const t = seguro(() => extraerTiempo?.(catalogo({ [IR]: INTERVALO_REAL }), IR));
  ok('intervalo real de ir108 (inicio/fin/PT15M) → fin 03:00Z y paso 15 min',
     t && t.fin === '2026-09-05T03:00:00.000Z' && t.pasoMin === 15 && t.inicio === '2020-09-01T00:00:00.000Z' && !t.lista,
     JSON.stringify(t));
}
{
  const t = seguro(() => extraerTiempo?.(catalogo({ [IR]: '2026-09-01T00:00:00.000Z/2026-09-05T03:00:00.000Z/PT1H' }), IR));
  ok('un paso de PT1H se entiende como 60 min', t && t.pasoMin === 60, JSON.stringify(t));
}
{
  const lista = '2026-09-05T02:15:00.000Z,2026-09-05T03:00:00.000Z,2026-09-05T02:30:00.000Z';
  const t = seguro(() => extraerTiempo?.(catalogo({ [IR]: lista }), IR));
  ok('una LISTA de instantes separados por comas se devuelve como lista, ordenada y sin inventar intervalo',
     t && Array.isArray(t.lista) && t.lista.join() === '2026-09-05T02:15:00.000Z,2026-09-05T02:30:00.000Z,2026-09-05T03:00:00.000Z' && !t.pasoMin,
     JSON.stringify(t));
}
{
  const t = seguro(() => extraerTiempo?.(catalogo({ [IR]: INTERVALO_REAL }), VIS));
  ok('una capa que el catálogo no declara → null (no se ofrece)', t === null, JSON.stringify(t));
}
{
  const t = seguro(() => extraerTiempo?.(catalogo({ [IR]: '2020-09-01T00:00:00.000Z/2026-09-05T03:00:00.000Z' }), IR));
  ok('un intervalo sin paso (inicio/fin a secas) → null: sin paso no hay horas que ofrecer', t === null, JSON.stringify(t));
}
{
  const t = seguro(() => extraerTiempo?.(catalogo({ [IR]: null }), IR));
  ok('una capa declarada sin dimensión de tiempo → null', t === null, JSON.stringify(t));
}

console.log('\n  horasDe(): nunca una hora futura, nunca una fuera de la rejilla\n');

const T_REAL = { inicio: '2020-09-01T00:00:00.000Z', fin: '2026-09-05T03:00:00.000Z', pasoMin: 15 };
const ms = (iso) => new Date(iso).getTime();
{
  const h = seguro(() => horasDe?.(T_REAL, 4, ms('2026-09-05T04:00:00Z')));
  ok('intervalo, n=4, consultado a las 04:00Z → 02:15, 02:30, 02:45 y 03:00 (las 4 últimas del catálogo)',
     Array.isArray(h) && h.join() === '2026-09-05T02:15:00.000Z,2026-09-05T02:30:00.000Z,2026-09-05T02:45:00.000Z,2026-09-05T03:00:00.000Z',
     JSON.stringify(h));
}
{
  const tope = ms('2026-09-05T02:40:00Z');
  const h = seguro(() => horasDe?.(T_REAL, 4, tope));
  ok('intervalo con el fin en el FUTURO (son las 02:40 y el catálogo dice 03:00) → la última es 02:30 y ninguna pasa de las 02:40',
     Array.isArray(h) && h.length === 4 && h[h.length - 1] === '2026-09-05T02:30:00.000Z' && h.every(x => ms(x) <= tope),
     JSON.stringify(h));
}
{
  const h = seguro(() => horasDe?.(T_REAL, 4, ms('2019-01-01T00:00:00Z')));
  ok('consultado antes del inicio del intervalo → ninguna hora', Array.isArray(h) && h.length === 0, JSON.stringify(h));
}
{
  const corto = { inicio: '2026-09-05T02:30:00.000Z', fin: '2026-09-05T03:00:00.000Z', pasoMin: 15 };
  const h = seguro(() => horasDe?.(corto, 12, ms('2026-09-05T04:00:00Z')));
  ok('si se piden 12 y el intervalo solo tiene 3 pasadas, salen las 3: no se inventa nada antes del inicio',
     Array.isArray(h) && h.join() === '2026-09-05T02:30:00.000Z,2026-09-05T02:45:00.000Z,2026-09-05T03:00:00.000Z',
     JSON.stringify(h));
}
{
  const desplazado = { inicio: '2026-09-05T00:07:00.000Z', fin: '2026-09-05T03:07:00.000Z', pasoMin: 15 };
  const h = seguro(() => horasDe?.(desplazado, 3, ms('2026-09-05T03:20:00Z')));
  ok('la rejilla se ancla en el inicio declarado (:07, :22, :37, :52), no en la hora de consulta',
     Array.isArray(h) && h.join() === '2026-09-05T02:37:00.000Z,2026-09-05T02:52:00.000Z,2026-09-05T03:07:00.000Z',
     JSON.stringify(h));
}
{
  const lista = { lista: ['2026-09-05T02:15:00.000Z', '2026-09-05T02:30:00.000Z', '2026-09-05T03:00:00.000Z', '2026-09-05T03:15:00.000Z'] };
  const h = seguro(() => horasDe?.(lista, 3, ms('2026-09-05T03:05:00Z')));
  ok('lista: las últimas reales que no pasen de la hora de consulta, saltándose la pasada que falta (02:45) y sin la futura (03:15)',
     Array.isArray(h) && h.join() === '2026-09-05T02:15:00.000Z,2026-09-05T02:30:00.000Z,2026-09-05T03:00:00.000Z',
     JSON.stringify(h));
}

console.log('\n  El servidor entero, con EUMETSAT de mentira\n');

/* Un fetch falso: el catálogo es el XML que se le dé; los GetMap los
   decide `mapa(url)`. Se apuntan las llamadas para poder mirarlas.     */
const PNG_REAL_64 = new Uint8Array(4653);      // medido el 05-09-2026: ir108 a 64×64 ocupó 4.653 bytes
const PNG_VACIO_64 = new Uint8Array(96);       // un PNG 64×64 transparente del todo: 96 bytes
const png = (bytes) => new Response(bytes, { status: 200, headers: { 'content-type': 'image/png' } });

const fetchOriginal = globalThis.fetch;
async function pedir(xml, mapa, n = 4) {
  const getmaps = [];
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (/GetCapabilities/.test(u)) return new Response(xml, { status: 200, headers: { 'content-type': 'text/xml' } });
    if (/GetMap/.test(u)) {
      const time = decodeURIComponent((u.match(/[?&]time=([^&]+)/) || [])[1] || '');
      getmaps.push({ time, layers: decodeURIComponent((u.match(/[?&]layers=([^&]+)/) || [])[1] || '') });
      return mapa(time);
    }
    throw new Error('petición inesperada: ' + u);
  };
  try {
    const res = await sat.default(new Request(`http://local/satelite?n=${n}`));
    const cuerpo = await res.json();
    return { status: res.status, cuerpo, getmaps };
  } finally {
    globalThis.fetch = fetchOriginal;
  }
}

/* El catálogo de muestra declara un fin UNA HORA EN EL FUTURO, en la
   rejilla real de 15 min anclada en 2020-09-01. Lo que debe salir es la
   última pasada de esa rejilla que ya ha pasado.                       */
const INICIO = ms('2020-09-01T00:00:00.000Z');
const PASO = 15 * 60000;
const ahora = Date.now();
const kAhora = Math.floor((ahora - INICIO) / PASO);
const ultimaReal = new Date(INICIO + kAhora * PASO).toISOString();
const anteriorReal = new Date(INICIO + (kAhora - 1) * PASO).toISOString();
const finFuturo = new Date(INICIO + (kAhora + 4) * PASO).toISOString();
const XML_FUTURO = catalogo({ [IR]: `2020-09-01T00:00:00.000Z/${finFuturo}/PT15M`,
                              [CONV]: `2020-09-01T00:00:00.000Z/${finFuturo}/PT15M`,
                              [VIS]: `2022-03-29T00:00:00.000Z/${finFuturo}/PT15M` });

{
  const r = await pedir(XML_FUTURO, () => png(PNG_REAL_64));
  const h = r.cuerpo?.capas?.ir?.horas ?? [];
  ok('con el catálogo diciendo que hay pasadas hasta dentro de 1 h, el servidor no ofrece ninguna hora futura',
     r.status === 200 && h.length > 0 && h.every(x => ms(x) <= ahora),
     `status ${r.status} · horas ${JSON.stringify(h)} · ahora ${new Date(ahora).toISOString()}`);
  ok('la última hora ofrecida es la última pasada de la rejilla que ya ha pasado',
     h[h.length - 1] === ultimaReal, `última ${h[h.length - 1]} · esperada ${ultimaReal}`);
  ok('se ofrecen las n=4 pedidas, seguidas y cada 15 min',
     h.length === 4 && h.every((x, i) => i === 0 || ms(x) - ms(h[i - 1]) === PASO), JSON.stringify(h));
  ok('la última hora se ha comprobado con un GetMap de la propia capa antes de ofrecerla',
     r.getmaps.some(g => g.time === ultimaReal && g.layers === IR) && r.cuerpo.capas.ir.ultimaComprobada === true,
     `GetMaps: ${JSON.stringify(r.getmaps)} · ultimaComprobada=${r.cuerpo?.capas?.ir?.ultimaComprobada}`);
  ok('las tres capas salen con sus horas y se sigue diciendo la fuente y el WMS',
     ['ir', 'convection', 'visible'].every(c => r.cuerpo?.capas?.[c]?.horas?.length === 4)
       && /EUMETSAT/.test(r.cuerpo?.fuente || '') && r.cuerpo?.wms === 'https://view.eumetsat.int/geoserver/wms',
     JSON.stringify(Object.keys(r.cuerpo?.capas || {})));
}
{
  // Lo medido el 05-09-2026 a más de 15 min del fin: 502 con cuerpo vacío
  const r = await pedir(XML_FUTURO, (time) => time === ultimaReal ? new Response('', { status: 502 }) : png(PNG_REAL_64));
  const h = r.cuerpo?.capas?.ir?.horas ?? [];
  ok('si el GetMap de la última hora da 502 (como se midió), se retira y se ofrece la anterior como última',
     h.length === 4 && h[h.length - 1] === anteriorReal && !h.includes(ultimaReal),
     `horas ${JSON.stringify(h)} · anterior esperada ${anteriorReal}`);
  ok('…y esa anterior también se ha comprobado (dos GetMap, no uno)',
     r.getmaps.filter(g => g.layers === IR).map(g => g.time).join() === `${ultimaReal},${anteriorReal}`
       && r.cuerpo?.capas?.ir?.ultimaComprobada === true,
     JSON.stringify(r.getmaps.filter(g => g.layers === IR)));
}
{
  const r = await pedir(XML_FUTURO, (time) => time === ultimaReal ? png(PNG_VACIO_64) : png(PNG_REAL_64));
  const h = r.cuerpo?.capas?.ir?.horas ?? [];
  ok('un PNG en blanco (96 bytes, medido) en la última hora NO cuenta como imagen: se retira igual que un 502',
     h.length === 4 && h[h.length - 1] === anteriorReal, JSON.stringify(h));
}
{
  const r = await pedir(XML_FUTURO, () => new Response('', { status: 502 }));
  ok('si no se sirven ni la última ni la anterior, la capa no se ofrece y se dice el motivo',
     r.status === 502 && r.cuerpo?.error === true && /no se sirven/.test(r.cuerpo?.noOfrecidas?.ir || ''),
     `status ${r.status} · ${JSON.stringify(r.cuerpo)}`);
}
{
  const r = await pedir(XML_FUTURO, () => { throw new TypeError('fetch failed'); });
  const c = r.cuerpo?.capas?.ir;
  ok('si la comprobación no responde (red caída), la capa se ofrece igual pero sin marcar la última como comprobada',
     r.status === 200 && c?.horas?.length === 4 && c.horas[3] === ultimaReal && c.ultimaComprobada === null,
     `status ${r.status} · ${JSON.stringify(c)}`);
}
{
  // Un catálogo en forma de LISTA con una pasada que falta (02:45) y una futura
  const l = [4, 3, 1, 0, -2].map(k => new Date(INICIO + (kAhora - k) * PASO).toISOString());   // -2 → dentro de 30 min
  const r = await pedir(catalogo({ [IR]: l.join(',') }), () => png(PNG_REAL_64));
  const h = r.cuerpo?.capas?.ir?.horas ?? [];
  const esperadas = [4, 3, 1, 0].map(k => new Date(INICIO + (kAhora - k) * PASO).toISOString());
  ok('con el catálogo en forma de lista se ofrecen las pasadas reales: sin la que falta y sin la futura',
     r.status === 200 && h.join() === esperadas.join(), `horas ${JSON.stringify(h)} · esperadas ${JSON.stringify(esperadas)}`);
  ok('con lista no hay paso declarado y se dice el que hay entre las dos últimas pasadas (15 min)',
     r.cuerpo?.capas?.ir?.pasoMin === 15, `pasoMin=${r.cuerpo?.capas?.ir?.pasoMin}`);
}
{
  const r = await pedir(catalogo({ [CONV]: INTERVALO_REAL }), () => png(PNG_REAL_64));
  ok('una capa que el catálogo no declara no sale en «capas» y sí en «noOfrecidas» con su motivo',
     r.status === 200 && !r.cuerpo?.capas?.ir && /no la declara/.test(r.cuerpo?.noOfrecidas?.ir || ''),
     JSON.stringify(r.cuerpo));
}

/* ════════════════════════ 2. maps.js ════════════════════════════════ */

console.log('\n  maps.js: cada capa observada se mueve por SU tira de fotogramas\n');

const srcMaps = readFileSync(path.join(raiz, 'maps.js'), 'utf8');

/* Saca un método del objeto Maps por su nombre: desde «  nombre(» hasta
   el «  },» que lo cierra. Si no existe, null (para poder decirlo).    */
function metodo(nombre) {
  const m = srcMaps.match(new RegExp(`\\n  ${nombre}\\([^)]*\\) \\{\\n`));
  if (!m) return null;
  const i = m.index + 1;
  const j = srcMaps.indexOf('\n  },', i);
  return srcMaps.slice(i, j + '\n  }'.length);
}
const i0 = srcMaps.indexOf('const TLAYERS = [');
const TLAYERS_SRC = srcMaps.slice(i0, srcMaps.indexOf('\n];', i0) + 3);
const metodos = ['capaSat', 'tiraObservada', 'selloObservado', 'irAPosicion', 'previewT', 'ahora']
  .map(n => [n, metodo(n)]);
ok('irAPosicion, previewT, ahora y capaSat se encuentran en maps.js',
   ['irAPosicion', 'previewT', 'ahora', 'capaSat'].every(n => metodos.find(x => x[0] === n)[1]),
   metodos.filter(x => !x[1]).map(x => x[0]).join(', ') + ' no encontrados');

/* 19-09-2026: las capas de mar llevan \`modelos: MODELOS_OLAS\`, una constante
   declarada justo antes de TLAYERS. Sin ella el eval reventaba
   (ReferenceError) y tumbaba la publicación del grupo Mar. */
const iOlas = srcMaps.indexOf('const MODELOS_OLAS = [');
const MODELOS_OLAS_SRC = iOlas >= 0 ? srcMaps.slice(iOlas, srcMaps.indexOf('\n', iOlas) + 1) : '';
const M = eval(`${MODELOS_OLAS_SRC}${TLAYERS_SRC}\n({\n${metodos.filter(x => x[1]).map(x => x[1]).join(',\n')}\n})`);

// El DOM de mentira: solo lo que tocan estas tres funciones
const mapTime = { value: '0', max: 0 };
const mapStamp = { textContent: '', style: {}, title: '' };
globalThis.document = { querySelector: s => s === '#mapTime' ? mapTime : s === '#mapStamp' ? mapStamp : null };

// Tiras de muestra, ancladas en la hora de ahora (nada de fechas fijas)
const q15 = Math.floor((Date.now() - 20 * 60000) / (15 * 60000)) * (15 * 60000);   // última pasada, hace ~20-35 min
const SAT = { wms: IR, nombre: 'Satélite infrarrojo', pasoMin: 15,
              horas: Array.from({ length: 12 }, (_, k) => new Date(q15 - (11 - k) * 15 * 60000).toISOString()) };
const q10 = Math.floor((Date.now() - 15 * 60000) / (10 * 60000)) * (10 * 60000);
const AEMET = Array.from({ length: 8 }, (_, k) => ({ t: q10 - (7 - k) * 10 * 60000, url: `aemet-${k}.png` }));
// 10 fotogramas pasados (cada 10 min hasta q10) y 3 de extrapolación, a +10, +20 y +30 min de AHORA
const RADAR = Array.from({ length: 13 }, (_, k) => ({
  time: Math.floor((k < 10 ? q10 - (9 - k) * 10 * 60000 : Date.now() + (k - 9) * 10 * 60000) / 1000), path: `/r${k}` }));
const pasada = new Date(Date.UTC(2026, 8, 4, 12));   // una pasada 12Z, 48 horas
const META = { valid_times: Array.from({ length: 48 }, (_, k) => new Date(pasada.getTime() + k * 3600e3).toISOString()) };
const IDX3H = META.valid_times.map((_, k) => k).filter(k => k % 3 === 0);   // paso de 3 h: 0,3,6,…,45

function estado(capa, extra = {}) {
  const llamadas = [];
  return Object.assign(Object.create(M), {
    layer: capa, t: 0, _pos: 0, _idx: IDX3H, meta: META, usando: null,
    _sat: null, _aemet: null, radarFrames: null,
    llamadas,
    setT(t) { llamadas.push(['setT', +t]); },
    stamp() { llamadas.push(['stamp']); },
    nowIndex() { return 3; },
    indices() { return this._idx; },
    pause() {}, apply() { llamadas.push(['apply']); },
  }, extra);
}
const ultimoSetT = (o) => o.llamadas.filter(x => x[0] === 'setT').pop()?.[1];
const pintoStamp = (o) => o.llamadas.some(x => x[0] === 'stamp');
const selloSat = (iso) => new Date(iso).toLocaleString('es', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const selloRadar = (msx) => new Date(msx).toLocaleString('es', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

{
  const o = estado('sat_ir', { _sat: SAT, t: 11 });
  o.irAPosicion(3);
  ok('satélite: soltar el deslizador en la muesca 3 enseña el fotograma 3 (+45 min), no el índice 9 del modelo',
     ultimoSetT(o) === 3, `setT(${ultimoSetT(o)})`);
}
{
  const o = estado('sat_ir', { _sat: SAT, t: 0 });
  o.irAPosicion('7');
  ok('satélite: la muesca 7 enseña el fotograma 7 (antes caía fuera de los 12 y el pulgar saltaba al final)',
     ultimoSetT(o) === 7 && String(mapTime.value) === '7', `setT(${ultimoSetT(o)}) · mapTime=${mapTime.value}`);
}
{
  const o = estado('sat_ir', { _sat: SAT, t: 0 });
  o.irAPosicion(40);
  ok('satélite: una muesca más allá del último fotograma se queda en el último (11), nunca en un índice inexistente',
     ultimoSetT(o) === 11, `setT(${ultimoSetT(o)})`);
}
{
  const o = estado('sat_ir', { _sat: SAT, t: 11 });
  mapStamp.textContent = '';
  o.previewT(5);
  ok('satélite: al arrastrar, el sello enseña la hora del fotograma 5 y no una previsión del modelo',
     mapStamp.textContent === selloSat(SAT.horas[5]) && o.t === 5 && !pintoStamp(o),
     `sello «${mapStamp.textContent}» · esperado «${selloSat(SAT.horas[5])}» · t=${o.t} · stamp()=${pintoStamp(o)}`);
}
{
  const o = estado('sat_ir', { _sat: SAT, t: 0 });
  o.previewT(11);
  ok('satélite: arrastrar hasta el final no pasa del último fotograma (t=11) ni escribe una hora futura',
     o.t === 11 && mapStamp.textContent === selloSat(SAT.horas[11]) && new Date(SAT.horas[11]) <= new Date(),
     `t=${o.t} · sello «${mapStamp.textContent}»`);
}
{
  const o = estado('sat_conv', { _sat: SAT, t: 2 });
  o.ahora();
  ok('satélite: «ahora» va al último fotograma observado (11), no al nowIndex() del modelo (3)',
     ultimoSetT(o) === 11 && String(mapTime.value) === '11', `setT(${ultimoSetT(o)}) · mapTime=${mapTime.value}`);
}
{
  const o = estado('sat_ir', { _sat: null, t: 0 });
  o.irAPosicion(3);
  ok('satélite sin catálogo cargado aún: soltar el deslizador no revienta y pide el fotograma 0 (setT → apply)',
     ultimoSetT(o) === 0, `setT(${ultimoSetT(o)})`);
}
{
  const o = estado('aemet', { _aemet: AEMET, t: 0 });
  o.irAPosicion(6);
  ok('radar AEMET: la muesca 6 enseña el fotograma 6, no el índice 18 del modelo',
     ultimoSetT(o) === 6, `setT(${ultimoSetT(o)})`);
}
{
  const o = estado('aemet', { _aemet: AEMET, t: 7 });
  mapStamp.textContent = '';
  o.previewT(2);
  ok('radar AEMET: al arrastrar, el sello es la hora del fotograma 2 (día de la semana y hora), sin pasar por stamp() del modelo',
     mapStamp.textContent === selloRadar(AEMET[2].t) && o.t === 2 && !pintoStamp(o),
     `sello «${mapStamp.textContent}» · esperado «${selloRadar(AEMET[2].t)}» · t=${o.t} · stamp()=${pintoStamp(o)}`);
}
{
  const o = estado('aemet', { _aemet: AEMET, t: 1 });
  o.ahora();
  ok('radar AEMET: «ahora» va al último fotograma (7), no al nowIndex() del modelo (3)',
     ultimoSetT(o) === 7, `setT(${ultimoSetT(o)})`);
}
{
  const o = estado('radar', { radarFrames: RADAR, t: 0 });
  o.ahora();
  ok('radar observado: «ahora» es el último fotograma observado (9 de 13), antes de la extrapolación',
     ultimoSetT(o) === 9, `setT(${ultimoSetT(o)})`);
}
{
  const todoPasado = RADAR.slice(0, 10);
  const o = estado('radar', { radarFrames: todoPasado, t: 0 });
  o.ahora();
  ok('radar observado con toda la tira en el pasado (tira vieja): «ahora» es el último fotograma (9), no el primero',
     ultimoSetT(o) === 9, `setT(${ultimoSetT(o)})`);
}
{
  const o = estado('radar', { radarFrames: RADAR, t: 0 });
  mapStamp.textContent = '';
  o.previewT(4);
  ok('radar observado: al arrastrar, el sello sigue siendo la hora del fotograma 4',
     mapStamp.textContent === selloRadar(RADAR[4].time * 1000) && o.t === 4,
     `sello «${mapStamp.textContent}» · t=${o.t}`);
}
{
  const o = estado('gusts', { t: 0 });
  o.irAPosicion(3);
  ok('modelo (Ráfagas, paso 3 h): el deslizador sigue yendo por posiciones — la muesca 3 es la hora 9 del modelo',
     ultimoSetT(o) === 9 && o._pos === 3, `setT(${ultimoSetT(o)}) · _pos=${o._pos}`);
}
{
  const o = estado('gusts', { t: 0 });
  o.previewT(2);
  ok('modelo: al arrastrar se traduce la posición (2 → hora 6) y el sello lo escribe stamp()',
     o.t === 6 && o._pos === 2 && pintoStamp(o), `t=${o.t} · _pos=${o._pos} · stamp()=${pintoStamp(o)}`);
}
{
  const o = estado('gusts', { t: 0 });
  o.ahora();
  ok('modelo: «ahora» sigue apoyándose en nowIndex() (3)', ultimoSetT(o) === 3, `setT(${ultimoSetT(o)})`);
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
