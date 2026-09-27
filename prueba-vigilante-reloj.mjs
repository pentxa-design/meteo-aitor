/* ═══════════════════════════════════════════════════════════════════
   EL VIGILANTE, ARRANCADO CON RELOJ, ALMACÉN Y RED DE MENTIRA
   ───────────────────────────────────────────────────────────────────
   Puesto el 27-09-2026, en la última revisión con agentes. El adversario
   rompió a propósito el segundo parte (que contara el agua de mañana, o
   que saliera aunque no hubiera nada) y el freno de cadencia (que no
   frenara nunca) y **NINGUNA prueba se puso roja**: las del servidor
   leían el código con `regex`, y el código decía lo que buscaban. Es la
   regla de la casa: «una prueba que lee el código con regex no es una
   prueba, es un recordatorio».

   Esto ARRANCA la pasada entera (`POST /api/vigilante`) a horas
   concretas —13:15, 17:10, 22:30…— con:

     · un RELOJ de mentira (`Date` fijado a esa hora, hoy),
     · un ALMACÉN en memoria (el estado `antes` se siembra a mano),
     · una RED de mentira (`/api/torres` con tres sitios suyos, `/om` con
       las 48 h que se pidan, con rayo, agua, código de tormenta o racha
       donde diga cada caso, y Euskalmet sin estaciones).

   Y mira lo que contesta y lo que guarda. Cada caso es un fallo que se
   vio ese día, y cada uno se vio EN ROJO contra el vigilante anterior
   (`VIGILANTE_DIR=<copia vieja> node prueba-vigilante-reloj.mjs`) antes
   de darlo por bueno. No toca la red, ni Vercel, ni el almacén de verdad.

   Para probar otra copia del código: `VIGILANTE_DIR=<carpeta>`.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const FUENTE = process.env.VIGILANTE_DIR || aqui;
let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `\n        ${String(pista).slice(0, 300)}` : ''}`); }
};

/* ── EL ALMACÉN EN MEMORIA ─────────────────────────────────────────
   Sustituye a `lib/motor.mjs` (el DÓNDE se guarda). La puerta
   (`almacen.mjs`) y `suscribir.mjs` se quedan como son. */
const MOTOR = `
export const motor = () => 'memoria';
const M = () => (globalThis.__ALMACEN ??= new Map());
export async function leerTexto(ruta) { const v = M().get(ruta); return v == null ? null : String(v); }
export async function leerCrudo(ruta) { const v = M().get(ruta); return v == null ? null : Buffer.from(String(v), 'base64'); }
export async function guardarTexto(ruta, texto) { M().set(ruta, String(texto)); }
export async function guardarCrudo(ruta, bytes) { M().set(ruta, Buffer.from(bytes).toString('base64')); }
export async function borrarCrudo(rutas) { for (const r of [].concat(rutas)) M().delete(r); }
export const esNoExiste = () => false;
`;

/* La copia va DENTRO del proyecto, que `web-push` se resuelve desde donde
   vive el fichero. Se borra al terminar. */
const tmp = fs.mkdtempSync(path.join(aqui, '.vigilante-reloj-'));
process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* nada */ } });
for (const d of ['api', 'lib']) {
  fs.mkdirSync(path.join(tmp, d));
  for (const f of fs.readdirSync(path.join(FUENTE, d))) {
    if (!f.endsWith('.mjs')) continue;
    fs.writeFileSync(path.join(tmp, d, f), fs.readFileSync(path.join(FUENTE, d, f), 'utf8'));
  }
}
fs.writeFileSync(path.join(tmp, 'lib', 'motor.mjs'), MOTOR);

const ESTADO = 'avisos/vigilante.json';
process.env.VIGILANTE_ENVIA = '1';        // que construya y «mande» (sin claves: 0 enviados, pero se ve)
delete process.env.MOVILES_EXTRA;
delete process.env.VAPID_PUBLICA; delete process.env.VAPID_PRIVADA;

/* ── SUS TRES SITIOS DE PRUEBA ─────────────────────────────────────── */
/* Seis, porque «no he podido mirar» solo suena a partir de CUATRO fallos. */
const SITIOS = [
  { name: 'BI BERMEO', lat: 43.413, lon: -2.718 },
  { name: 'VI ORDUNA', lat: 42.990, lon: -3.000 },
  { name: 'BI MUNGIA', lat: 43.354, lon: -2.846 },
  { name: 'BI DURANGO', lat: 43.170, lon: -2.630 },
  { name: 'BI GERNIKA', lat: 43.315, lon: -2.680 },
  { name: 'BI OIZ', lat: 43.227, lon: -2.592 },
];
const p2 = x => String(x).padStart(2, '0');
const clave = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const RealDate = globalThis.Date;
const HOY = clave(new RealDate());
const MAN = clave(new RealDate(RealDate.now() + 86400e3));
const AYER = clave(new RealDate(RealDate.now() - 86400e3));

/* ── LA RED DE MENTIRA ───────────────────────────────────────────────
   `esc` dice qué ve cada sitio (k = 0 BERMEO, 1 ORDUNA, 2 MUNGIA, 3 DURANGO,
   4 GERNIKA, 5 OIZ):
     agua:    [{ k, dia: 'hoy'|'man', horas: [..], mm }]
     rayo:    [{ k, dia, horas, om? }]         CAPE 900 y tapa 10
     codigo:  [{ k, dia, horas, om? }]         código de tormenta 95
     racha:   [{ k, dia, horas, v }]
     ojoCape: [{ k, dia, horas, v }]           CAPE sin tapa abierta
     caidos:  [k]                              ese sitio no contesta */
function red(esc, fijo, llamadas) {
  const hoy0 = new RealDate(fijo); hoy0.setHours(0, 0, 0, 0);
  const iso = d => `${clave(d)}T${p2(d.getHours())}:00`;
  const R = (o, okk = true, status = 200) =>
    Promise.resolve({ ok: okk, status, json: () => Promise.resolve(o), text: () => Promise.resolve(JSON.stringify(o)) });
  const hit = (lista, k, om, dia, hh) => (esc[lista] || []).find(x =>
    x.k === k && x.dia === dia && x.horas.includes(hh) && (!x.om || x.om === om));
  const valor = (k, om, campo, d) => {
    const dia = clave(d) === clave(hoy0) ? 'hoy' : 'man', hh = d.getHours();
    if (campo === 'cape') { if (hit('rayo', k, om, dia, hh)) return 900; const o = hit('ojoCape', k, om, dia, hh); return o ? o.v : 40; }
    if (campo === 'convective_inhibition') return hit('rayo', k, om, dia, hh) ? 10 : 120;
    if (campo === 'precipitation') { const a = hit('agua', k, om, dia, hh); return a ? a.mm : 0; }
    if (campo === 'wind_gusts_10m') { const r = hit('racha', k, om, dia, hh); return r ? r.v : 20; }
    if (campo === 'weather_code') return hit('codigo', k, om, dia, hh) ? 95 : 1;
    if (campo === 'temperature_2m') return 15;
    return null;
  };
  return (u = '', init = {}) => {
    const s = String(u); llamadas.push({ u: s, init });
    const q = new URL(s).searchParams;
    if (s.includes('/api/torres')) return R({ torres: SITIOS });
    if (s.includes('/api/euskalmet')) return R({ ok: true, puntos: [] });
    if (s.includes('/api/marcador')) return R({ ok: true });
    if (s.includes('/om')) {
      const lats = (q.get('latitude') || '').split(','), lons = (q.get('longitude') || '').split(',');
      const modelos = (q.get('models') || 'best_match').split(',');
      const campos = (q.get('hourly') || '').split(',').filter(Boolean);
      const T = []; for (let i = 0; i < 48; i++) T.push(new RealDate(hoy0.getTime() + i * 3600e3));
      const kDe = lat => SITIOS.findIndex(x => Math.abs(x.lat - Number(lat)) < 1e-6);
      const uno = (lat, lon) => {
        const k = kDe(lat);
        if ((esc.caidos || []).includes(k)) return { latitude: +lat, longitude: +lon, hourly: null };
        const h = { time: T.map(iso) };
        for (const om of modelos) for (const c of campos) h[`${c}_${om}`] = T.map(d => valor(k, om, c, d));
        return { latitude: +lat, longitude: +lon, hourly: h };
      };
      if (lats.length > 1) return R(lats.map((la, i) => uno(la, lons[i])));
      if ((esc.caidos || []).includes(kDe(lats[0]))) return R({ error: 'caído a propósito' }, false, 503);
      return R(uno(lats[0], lons[0]));
    }
    return R({});
  };
}

function resFalso() {
  const r = { code: null, body: null, cabeceras: {} };
  r.setHeader = (k, v) => { r.cabeceras[k] = v; };
  r.status = c => { r.code = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.send = b => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

/* ── UNA PASADA A UNA HORA ─────────────────────────────────────────── */
const fetchReal = globalThis.fetch;
let n = 0;
async function pasada({ hora, antes = null, esc = {}, metodo = 'POST', query = {} }) {
  const fijo = new RealDate(); const [H, M] = hora.split(':').map(Number); fijo.setHours(H, M, 0, 0);
  globalThis.__ALMACEN = new Map();
  if (antes) globalThis.__ALMACEN.set(ESTADO, JSON.stringify(antes));
  globalThis.__ultimaPasadaVigilante = undefined;
  const llamadas = [];
  globalThis.fetch = red(esc, fijo, llamadas);
  globalThis.Date = new Proxy(RealDate, {
    construct(T, a) { return a.length ? new T(...a) : new T(fijo); },
    get(T, p) { return p === 'now' ? () => fijo.getTime() : T[p]; },
  });
  const res = resFalso(); let reventó = null;
  try {
    const mod = await import(pathToFileURL(path.join(tmp, 'api', 'vigilante.mjs')).href + `?n=${++n}`);
    await mod.default({ method: metodo, query, headers: {}, body: {} }, res);
  } catch (e) { reventó = `${e?.constructor?.name}: ${e?.message}`; }
  globalThis.Date = RealDate; globalThis.fetch = fetchReal;
  const estado = JSON.parse(globalThis.__ALMACEN.get(ESTADO) || 'null');
  return { res, b: res.body || {}, reventó, estado, llamadas };
}
/* Un estado «antes» tranquilo, con la última pasada hace `min` minutos. */
const hace = (hora, min) => {
  const d = new RealDate(); const [H, M] = hora.split(':').map(Number); d.setHours(H, M, 0, 0);
  return new RealDate(d.getTime() - min * 60000).toISOString();
};
const tranquilo = (hora, min, extra = {}) => ({
  cuando: hace(hora, min), ultimoAviso: null, sitios: {}, nLista: 6, noMirados: [],
  ojo: { cape: 0, racha: 0, agua: 0 }, aguaSitios: {}, parteDe: HOY, parte2De: HOY, parteResumen: null, ...extra,
});
const titulos = b => (b.avisados || []).map(a => a.titulo);
const cuerpoDe = (b, re) => (b.avisados || []).find(a => re.test(String(a.titulo)))?.cuerpo || '';
const resumen = r => JSON.stringify({ code: r.res.code, reventó: r.reventó, saltada: r.b.saltada, nota: r.b.nota,
  inminentes: r.b.inminentes, avisados: r.b.avisados, fallos: r.b.fallos, marcador: r.b.marcador }).slice(0, 300);

/* ═══════════════════════════════════════════════════════════════════ */
console.log('\n  el vigilante, arrancado con reloj de mentira\n');

/* ── 13:15 · EL SEGUNDO PARTE ──────────────────────────────────────── */
{
  const parte = { fecha: HOY, rayo: [], agua: [], racha: [] };
  const A = await pasada({ hora: '13:15', antes: tranquilo('13:15', 10, { parte2De: null, parteResumen: parte }),
                           esc: { agua: [{ k: 0, dia: 'hoy', horas: [15, 16], mm: 2.5 }] } });
  const c = cuerpoDe(A.b, /parte/i);
  ok('13:15 · con agua hoy por delante sale el segundo parte, y nombra el sitio',
     !A.reventó && /parte/i.test(titulos(A.b).join('|')) && /BERMEO/.test(c), resumen(A));
  ok('   y los milímetros van con coma (2,5 mm/h), no «2.5» como en el aviso del 26-09',
     /2,5 mm\/h/.test(c) && !/2\.5/.test(c), c);
  ok('   y dice qué ha cambiado respecto a la mañana, por sitio',
     /agua que esta mañana no había \(BERMEO\)/.test(c), c);
  ok('   y guarda el resumen con los NOMBRES y la FECHA, para compararlo a las 13:00 siguientes',
     A.estado?.parteResumen?.fecha === HOY && Array.isArray(A.estado?.parteResumen?.agua)
     && A.estado.parteResumen.agua.includes('BERMEO'), JSON.stringify(A.estado?.parteResumen));
  ok('   todas las peticiones de red llevan tope de tiempo (sin él, Open-Meteo colgado se come la pasada)',
     A.llamadas.length > 3 && A.llamadas.every(l => l.init && l.init.signal), `${A.llamadas.filter(l => !l.init?.signal).length} sin tope de ${A.llamadas.length}`);
  ok('   la tanda pide el código de tormenta y lleva sello de 10 min contra la copia rancia del CDN',
     A.llamadas.some(l => /\/om/.test(l.u) && /weather_code/.test(l.u) && /&_=\d+/.test(l.u)),
     A.llamadas.filter(l => /\/om/.test(l.u)).map(l => l.u.slice(0, 160)).join('\n        '));

  const B = await pasada({ hora: '13:15', antes: tranquilo('13:15', 10, { parte2De: null, parteResumen: parte }),
                           esc: { agua: [{ k: 0, dia: 'hoy', horas: [8, 9], mm: 2.5 }] } });
  ok('13:15 · el agua de las 08-09 YA HA PASADO: no hay segundo parte, y el día se da por hecho',
     !B.reventó && !/parte/i.test(titulos(B.b).join('|')) && B.estado?.parte2De === HOY, resumen(B));

  const C = await pasada({ hora: '13:15', antes: tranquilo('13:15', 10, { parte2De: null, parteResumen: parte }),
                           esc: { agua: [{ k: 0, dia: 'man', horas: [10, 11], mm: 2.5 }] } });
  ok('13:15 · con agua SOLO mañana no hay segundo parte (es de hoy, no de mañana)',
     !C.reventó && !/parte/i.test(titulos(C.b).join('|')) && C.estado?.parte2De === HOY, resumen(C));

  const D = await pasada({ hora: '13:15', antes: tranquilo('13:15', 10, { parte2De: null, parteResumen: { ...parte, agua: ['ORDUNA'] } }),
                           esc: { agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 1.0 }] } });
  const cd = cuerpoDe(D.b, /parte/i);
  ok('13:15 · mismo NÚMERO de sitios pero distintos (ORDUNA → BERMEO) NO es «igual que esta mañana»',
     /entra BERMEO/.test(cd) && /sale ORDUNA/.test(cd) && !/Igual que esta mañana/.test(cd), cd || resumen(D));

  const E = await pasada({ hora: '13:15', antes: tranquilo('13:15', 10, { parte2De: null, parteResumen: { fecha: AYER, rayo: [], agua: ['BERMEO'], racha: [] } }),
                           esc: { agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 1.0 }] } });
  const ce = cuerpoDe(E.b, /parte/i);
  ok('13:15 · el parte de AYER no sirve para comparar: lo dice, no afirma «igual que esta mañana»',
     /Sin parte de esta mañana/.test(ce) && !/Igual que esta mañana/.test(ce), ce || resumen(E));

  const F = await pasada({ hora: '13:20', antes: tranquilo('13:20', 5, { parte2De: null, parteIntentoEn: hace('13:20', 5) }) });
  ok('13:20 · el envío del parte falló hace 5 min: NO se reintenta en cada tic (como mucho cada 30 min)',
     !F.reventó && F.b.saltada === true, resumen(F));
  const F2 = await pasada({ hora: '13:50', antes: tranquilo('13:50', 35, { parte2De: null, parteIntentoEn: hace('13:50', 35) }),
                            esc: { agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 1.0 }] } });
  ok('13:50 · y a la media hora sí lo vuelve a intentar',
     !F2.reventó && F2.b.saltada !== true && /parte/i.test(titulos(F2.b).join('|')), resumen(F2));
}

/* ── 07:30 · EL PARTE DE LA MAÑANA ─────────────────────────────────── */
{
  const P = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }),
                           esc: { racha: [{ k: 0, dia: 'hoy', horas: [16], v: 75 }] } });
  const cp = cuerpoDe(P.b, /parte de hoy/i);
  ok('07:30 · el parte de la mañana sale, con la racha de 70+ de BERMEO por delante',
     !P.reventó && /racha de 70\+ en 1/.test(cp) && /BERMEO/.test(cp), cp || resumen(P));
  ok('   y su resumen guarda el NOMBRE del sitio con racha, con la fecha de hoy',
     P.estado?.parteResumen?.fecha === HOY && Array.isArray(P.estado?.parteResumen?.racha)
     && P.estado.parteResumen.racha.includes('BERMEO'), JSON.stringify(P.estado?.parteResumen));
  const P0 = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }) });
  const cp0 = cuerpoDe(P0.b, /parte de hoy/i);
  ok('07:30 · un día limpio lo dice con SUS listones (0,3 mm/h y 70 km/h), no con números a mano',
     /sin agua de 0,3 mm\/h para arriba y sin rachas de 70\./.test(cp0), cp0 || resumen(P0));
}

/* ── 17:10 · EL FRENO DE CADENCIA (la suya: 120 de tarde) ──────────── */
{
  const G = await pasada({ hora: '17:10', antes: tranquilo('17:10', 117) });
  ok('17:10 verde · 117 min desde la anterior: PASA (la cadencia es 120 y el sello se escribe al final)',
     !G.reventó && G.b.saltada !== true && Number(G.b.mirados) === 6, resumen(G));
  const G2 = await pasada({ hora: '17:10', antes: tranquilo('17:10', 100) });
  ok('17:10 verde · 100 min: se salta, y la nota dice la cadencia de verdad',
     !G2.reventó && G2.b.saltada === true && G2.b.nota === 'verde: se pasa cada 120 min', resumen(G2));
  const G3 = await pasada({ hora: '17:10', antes: tranquilo('17:10', 100), query: { mirar: '1' } });
  ok('17:10 · su ojeada a mano (`mirar=1`) nunca se salta',
     !G3.reventó && G3.b.saltada !== true && Number(G3.b.mirados) === 6, resumen(G3));
}

/* ── 22:30 · EL RAYO QUE ES SOLO DE MAÑANA ─────────────────────────── */
{
  const H = await pasada({ hora: '22:30', antes: tranquilo('22:30', 130),
                           esc: { rayo: [{ k: 0, dia: 'man', horas: [0, 1, 2] }] } });
  ok('22:30 · un sitio con rayo SOLO mañana de 00 a 02 h no revienta la pasada (TypeError en la firma)',
     !H.reventó && H.res.code === 200, resumen(H));
  ok('   y sale como inminente diciendo que es MAÑANA y a qué hora, con su aviso de tormenta',
     Array.isArray(H.b.inminentes) && H.b.inminentes[0] === 'BERMEO mañana 00h-02h'
     && titulos(H.b).some(t => /armando/i.test(t)), resumen(H));
}

/* ── 14:00 · EL CÓDIGO DE TORMENTA CUENTA COMO RAYO ────────────────── */
{
  const I = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                           esc: { codigo: [{ k: 0, dia: 'hoy', horas: [15, 16], om: 'ecmwf_ifs025' }] } });
  ok('14:00 · «tormenta» (código 95) con CAPE 40 en un modelo cuenta como rayo, como en la app',
     !I.reventó && (I.b.inminentes || []).includes('BERMEO 15h-16h') && titulos(I.b).some(t => /armando/i.test(t)), resumen(I));
}

/* ── 14:00 · «NO HE PODIDO MIRAR» SOLO SI PUEDE CAMBIAR ALGO ──────── */
{
  const J = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                           esc: { caidos: [2, 3, 4, 5], ojoCape: [{ k: 0, dia: 'hoy', horas: [19], v: 400 }] } });
  ok('14:00 verde · cuatro sitios no contestan y lo demás es solo CAPE de ojo (400): «no he podido mirar» CALLA',
     !J.reventó && (J.b.fallos || []).length === 4 && !titulos(J.b).some(t => /no he podido mirar/i.test(t)), resumen(J));
  const K = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                           esc: { caidos: [2, 3, 4, 5], rayo: [{ k: 0, dia: 'hoy', horas: [18] }] } });
  ok('14:00 · cuatro sitios no contestan y hay rayo por delante en BERMEO: SÍ suena',
     !K.reventó && (K.b.fallos || []).length === 4 && titulos(K.b).some(t => /no he podido mirar/i.test(t)), resumen(K));
  const K2 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                           esc: { caidos: [2, 3, 4, 5], rayo: [{ k: 0, dia: 'hoy', horas: [9] }] } });
  ok('14:00 · con el rayo de BERMEO ya PASADO (09h) no suena: lo que ha pasado no pesa',
     !K2.reventó && !titulos(K2.b).some(t => /no he podido mirar/i.test(t)), resumen(K2));

  /* ── el marcador, una vez por hora ── */
  ok('   la pasada apunta en el marcador y guarda a qué hora lo hizo',
     K.b.marcador && !K.b.marcador.saltado && typeof K.estado?.marcadorHora === 'string', resumen(K));
  const L = await pasada({ hora: '14:20', antes: tranquilo('14:20', 130, { marcadorHora: K.estado?.marcadorHora }),
                           esc: { rayo: [{ k: 0, dia: 'hoy', horas: [18] }] } });
  ok('14:20 · misma hora que la última apuntada: el marcador NO se vuelve a apuntar (era el 70-80 % de la CPU)',
     !L.reventó && L.b.marcador?.saltado, resumen(L));
}

/* ── EL PULSO, 60 s DE CDN ─────────────────────────────────────────── */
{
  const M = await pasada({ hora: '14:00', antes: tranquilo('14:00', 10), metodo: 'GET', query: { pulso: '1' } });
  ok('el pulso va 60 s al CDN: cada apertura de la app no arranca la función para decir lo mismo',
     !M.reventó && /s-maxage=60/.test(String(M.res.cabeceras['Cache-Control'])), JSON.stringify(M.res.cabeceras));
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
