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
     caidos:  [k]                              ese sitio no contesta (503)
     lentos:  [k]                              ese sitio tarda más que el tope (TimeoutError) */
function red(esc, fijo, llamadas) {
  /* `esc.criticos: [k]` pone ese sitio donde está MATIENA de verdad: el
     vigilante reconoce los críticos por estar a menos de 300 m de los
     suyos, no por un campo de la lista. */
  const SITIOS_ESC = SITIOS.map((x, k) => (esc.criticos || []).includes(k)
    ? { name: 'BI MATIENA', lat: 43.159627, lon: -2.626779 } : x);
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
    if (s.includes('/api/torres')) return R({ torres: SITIOS_ESC });
    if (s.includes('/api/euskalmet')) return R({ ok: true, puntos: [] });
    if (s.includes('/api/marcador')) return R({ ok: true });
    if (s.includes('/om')) {
      const lats = (q.get('latitude') || '').split(','), lons = (q.get('longitude') || '').split(',');
      const modelos = (q.get('models') || 'best_match').split(',');
      const campos = (q.get('hourly') || '').split(',').filter(Boolean);
      const T = []; for (let i = 0; i < 48; i++) T.push(new RealDate(hoy0.getTime() + i * 3600e3));
      const kDe = lat => SITIOS_ESC.findIndex(x => Math.abs(x.lat - Number(lat)) < 1e-6);
      const uno = (lat, lon) => {
        const k = kDe(lat);
        if ((esc.caidos || []).includes(k)) return { latitude: +lat, longitude: +lon, hourly: null };
        const h = { time: T.map(iso) };
        for (const om of modelos) for (const c of campos) h[`${c}_${om}`] = T.map(d => valor(k, om, c, d));
        return { latitude: +lat, longitude: +lon, hourly: h };
      };
      /* Lento: como el `AbortSignal.timeout` de verdad, la petición se cae con
         TimeoutError; y si va en la tanda de los veinte, se cae la tanda. */
      if (lats.some(la => (esc.lentos || []).includes(kDe(la))))
        return Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
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

/* El guardia de las pasadas saltadas, en una función para poder probarlo. */
const saltadaSinQuerer = (metodo, b, seSalta) => metodo === 'POST' && b?.saltada === true && !seSalta;
ok('el guardia está puesto: una pasada que se salta sin haberlo pedido es un fallo, y una del freno (seSalta) no',
   saltadaSinQuerer('POST', { saltada: true }, false) === true && saltadaSinQuerer('POST', { saltada: true }, true) === false
   && saltadaSinQuerer('POST', { mirados: 6 }, false) === false && saltadaSinQuerer('GET', { saltada: true }, false) === false);

/* ── UNA PASADA A UNA HORA ─────────────────────────────────────────── */
const fetchReal = globalThis.fetch;
let n = 0;
async function pasada({ hora, antes = null, esc = {}, metodo = 'POST', query = {}, seSalta = false }) {
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
  /* ── UNA PASADA SALTADA NO COMPRUEBA NADA (30-09-2026) ──────────────
     La prueba de las 13:30 del agua salió VERDE con el código roto: la
     pasada se saltaba («verde: se pasa cada 120 min») y «no dice agua
     fuerte» era verdad porque no decía nada. Aquí no se le deja a cada
     prueba acordarse: toda pasada que se salte sin haberlo pedido
     (`seSalta: true`, solo las pruebas del freno) es un fallo. */
  const b = res.body || {};
  if (saltadaSinQuerer(metodo, b, seSalta))
    ok(`la pasada de las ${hora} corre de verdad (se ha saltado: «${b.nota || ''}», y lo que se mire detrás no mira nada)`, false, JSON.stringify(b).slice(0, 160));
  return { res, b, reventó, estado, llamadas };
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
     !A.reventó && /parte/i.test(titulos(A.b).join('|')) && /BERMEO/.test(c) && /agua en 1 sitio:/.test(c), resumen(A));
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

  const F = await pasada({ hora: '13:20', antes: tranquilo('13:20', 5, { parte2De: null, parteIntentoEn: hace('13:20', 5) }), seSalta: true });
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
  ok('07:30 · el parte de la mañana sale, con la racha de 70+ de BERMEO por delante, y el recuento dice «sitio», no un número que se lee como hora',
     !P.reventó && /racha de 70\+ en 1 sitio:/.test(cp) && /BERMEO/.test(cp) && !/en 1:/.test(cp), cp || resumen(P));
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
  const G2 = await pasada({ hora: '17:10', antes: tranquilo('17:10', 100), seSalta: true });
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
  const H2 = await pasada({ hora: '22:30', antes: tranquilo('22:30', 130),
                            esc: { rayo: [{ k: 0, dia: 'man', horas: [0, 12, 13, 18, 19] }] } });
  ok('22:30 · del rayo de mañana solo se dice la madrugada («mañana 00h»), no el resto del día (su aviso de las 21:00)',
     !H2.reventó && H2.b.inminentes?.[0] === 'BERMEO mañana 00h', resumen(H2));
  ok('   y sale como inminente diciendo que es MAÑANA y a qué hora, con su aviso de tormenta',
     /* A las 22:30 las tres horas siguientes llegan hasta la 01h: se dice
        hasta ahí, que es lo que cuenta ahora (deManana). */
     Array.isArray(H.b.inminentes) && H.b.inminentes[0] === 'BERMEO mañana 00h-01h'
     && titulos(H.b).some(t => /Próximas 3 h|crítico/i.test(t)), resumen(H));
}

/* ── 14:00 · EL CÓDIGO DE TORMENTA CUENTA COMO RAYO ────────────────── */
{
  const I = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                           esc: { codigo: [{ k: 0, dia: 'hoy', horas: [15, 16], om: 'ecmwf_ifs025' }] } });
  ok('14:00 · «tormenta» (código 95) con CAPE 40 en un modelo cuenta como rayo, como en la app',
     !I.reventó && (I.b.inminentes || []).includes('BERMEO 15h-16h') && titulos(I.b).some(t => /Próximas 3 h|crítico/i.test(t)), resumen(I));
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
  /* ── Y DICE POR QUÉ (30-09-2026, su aviso de las 18:03: «⚠ No he podido
     mirar» 12 sitios, y ni él ni yo pudimos saber el motivo: no se
     guardaba en ningún sitio). */
  const cK = (K.b.avisados || []).find(a => /no he podido mirar/i.test(a.titulo))?.cuerpo || '';
  ok('el aviso de «no he podido mirar» dice el MOTIVO: sitios caídos → «el servidor de datos falló (503)»',
     /Motivo: el servidor de datos falló \(503\)\./.test(cK) && /503/.test(K.estado?.noMiradosPor || ''), cK || resumen(K));
  const K3 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                            esc: { lentos: [2, 3, 4, 5], rayo: [{ k: 0, dia: 'hoy', horas: [18] }] } });
  const cK3 = (K3.b.avisados || []).find(a => /no he podido mirar/i.test(a.titulo))?.cuerpo || '';
  ok('y si tardan más que el tope: «el servidor de datos no contestó a tiempo (15 s)», y el estado lo guarda para el pulso',
     !K3.reventó && /Motivo: el servidor de datos no contestó a tiempo \(15 s\)\./.test(cK3)
     && /no contestó a tiempo/.test(K3.estado?.noMiradosPor || ''), cK3 || resumen(K3));
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

/* ── LO DE MAÑANA SE AVISA MAÑANA (27-09-2026, 20:01, su pantallazo) ───
   «AGUA MAÑANA · CARRANZA (mañana): el agua pasa a fuerte a las 20h.
   BALMASEDA (mañana): el agua se adelanta: 16h pasa a 00h» a las 20:00 de
   hoy. Los cambios de agua y racha de MAÑANA no son aviso: van en el
   parte de las 06:30. El rayo de madrugada (`hastaManana`) sigue igual. */
{
  const conAguaGuardada = (hora, min) => tranquilo(hora, min, {
    sitios: { BERMEO: {}, ORDUNA: {}, MUNGIA: {}, DURANGO: {}, GERNIKA: {}, OIZ: {} },
    aguaSitios: { BERMEO: { [MAN]: { ini: 16, fin: 17, mm: 0.5, fuerte: false, tramos: [{ ini: 16, fin: 17 }] } } },
    rachaSitios: {},
  });
  const N = await pasada({ hora: '20:00', antes: conAguaGuardada('20:00', 130),
                           esc: { agua: [{ k: 0, dia: 'man', horas: [0, 1, 2, 3], mm: 2.5 }] } });
  ok('20:00 · el agua de MAÑANA que cambia (se adelanta y pasa a fuerte) NO es aviso de hoy',
     !N.reventó && !titulos(N.b).some(t => /AGUA/i.test(t)), resumen(N));
  const N2 = await pasada({ hora: '20:00', antes: conAguaGuardada('20:00', 130),
                           esc: { agua: [{ k: 1, dia: 'hoy', horas: [21, 22], mm: 2.5 }] } });
  const c2 = (N2.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo))?.cuerpo || '';
  ok('20:00 · agua FUERTE hoy en ORDUNA a las 21-22 (dentro de 3 h) sale en el aviso de «Próximas 3 h», con su hora y sus mm',
     !N2.reventó && /ORDUNA: agua fuerte prevista 21h-22h \(2,5 mm\/h, /.test(c2), c2 || resumen(N2));
  const N3 = await pasada({ hora: '20:00', antes: conAguaGuardada('20:00', 130),
                           esc: { rayo: [{ k: 0, dia: 'man', horas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }] } });
  ok('20:00 · un rayo de MAÑANA de 00 a 13 h no es «CAMBIO» a las 20:00 (empieza a 4 h; va en el parte de las 06:30)',
     !N3.reventó && !titulos(N3.b).some(t => /CAMBIO/.test(t)), resumen(N3));
  const N5 = await pasada({ hora: '22:00', antes: tranquilo('22:00', 130, {
                              sitios: { BERMEO: { [MAN]: { ini: 13, fin: 19, tramos: [{ ini: 13, fin: 19 }] } } }, aguaSitios: {}, rachaSitios: {} }),
                            esc: { rayo: [{ k: 0, dia: 'man', horas: Array.from({ length: 20 }, (_, i) => i) }] } });
  const c5 = (N5.b.avisados || []).find(a => /Próximas 3 h|crítico/i.test(a.titulo))?.cuerpo || '';
  ok('22:00 · del rayo de mañana solo se dice la madrugada que cae en las 3 h siguientes: «BERMEO: rayo mañana 00h-01h», nada de «13h-19h pasa a…» (su aviso de las 22:00)',
     /BERMEO: riesgo de rayo mañana 00h-01h/.test(c5) && !/19h|pasa a/.test(c5), c5 || resumen(N5));
  const N4 = await pasada({ hora: '22:00', antes: conAguaGuardada('22:00', 130),
                           esc: { rayo: [{ k: 0, dia: 'man', horas: [0, 1, 2] }] } });
  ok('22:00 · pero el rayo de madrugada (00-02 h) sí avisa, que es la noche de guardia',
     !N4.reventó && titulos(N4.b).some(t => /Próximas 3 h|crítico/i.test(t)), resumen(N4));
}

/* ── EL RUIDO DEL LUNES 28-09 A MEDIODÍA (su pantallazo de las 12:01) ──
   «MATIENA (crítico) y 18 más» a las 11:00 y «y 16 más» a las 12:00 con las
   mismas torres y las horas movidas una; «BERMEO 00h-01h y 13h-14h» a las
   12:00 (lo de las 00h ya pasó); «DURAÑONA 00h-14h pasa a 00h-15h». Suyo:
   «a veces no sé ni lo que estoy leyendo». */
{
  const conRayoGuardado = (hora, min, ini, fin) => tranquilo(hora, min, {
    sitios: { BERMEO: { [HOY]: { ini, fin, tramos: [{ ini, fin }] } }, ORDUNA: {}, MUNGIA: {}, DURANGO: {}, GERNIKA: {}, OIZ: {} },
    ultimoAviso: 'BERMEO', aguaSitios: {}, rachaSitios: {},
  });
  const R1 = await pasada({ hora: '12:00', antes: conRayoGuardado('12:00', 40, 13, 16),
                            esc: { rayo: [{ k: 0, dia: 'hoy', horas: [0, 1, 13, 14, 15, 16, 17] }] } });
  ok('12:00 · en el «se está armando» no se cuenta lo ya pasado: BERMEO «13h-17h», no «00h-01h y 13h-17h»',
     !R1.reventó && (R1.b.inminentes || [])[0] === 'BERMEO 13h-17h', resumen(R1));
  ok('12:00 · si ya avisó de BERMEO y solo se han movido las horas, NO lo repite (la firma es el sitio, no las horas)',
     !R1.reventó && !titulos(R1.b).some(t => /Próximas 3 h|crítico/i.test(t)), resumen(R1));
  ok('12:00 · y alargar el final una hora (13h-16h → 13h-17h) NO es un «CAMBIO»',
     !R1.reventó && !titulos(R1.b).some(t => /CAMBIO/.test(t)), resumen(R1));
  const R2 = await pasada({ hora: '12:00', antes: conRayoGuardado('12:00', 40, 15, 19),
                            esc: { rayo: [{ k: 0, dia: 'hoy', horas: [13, 14, 15, 16, 17, 18, 19] }] } });
  ok('12:00 · si ya avisó de BERMEO, que el rayo se mueva de las 15h a las 13h NO vuelve a sonar: «si cambia o no cambia no me interesa» (suyo, 28-09)',
     !R2.reventó && !titulos(R2.b).some(t => /CAMBIO|Próximas 3 h|crítico/i.test(t)), resumen(R2));
  const R3 = await pasada({ hora: '12:00', antes: conRayoGuardado('12:00', 40, 13, 16),
                            esc: { rayo: [{ k: 0, dia: 'hoy', horas: [13, 14, 15, 16] }, { k: 1, dia: 'hoy', horas: [14, 15] }] } });
  const c3 = (R3.b.avisados || []).find(a => /Próximas 3 h|crítico/i.test(a.titulo))?.cuerpo || '';
  ok('12:00 · y si entra un sitio NUEVO (ORDUNA) sí vuelve a sonar «Próximas 3 h», con los dos sitios, «riesgo de rayo» (modelo, no medida) y sus horas recortadas a las 3 h siguientes (hasta las 15h)',
     !R3.reventó && /ORDUNA: riesgo de rayo 14h-15h/.test(c3) && /BERMEO: riesgo de rayo 13h-15h/.test(c3) && !/16h/.test(c3), c3 || resumen(R3));
}

/* ── «AGUA FUERTE AHORA» SIN AGUA FUERTE (30-09-2026, 13:34) ──────────
   Su captura: «⚡ Próximas 3 h · 12 sitios — BERMEO: agua fuerte ahora y
   hasta las 16h (6,7 mm/h)», con él mirando por la ventana un cielo gris y
   seco. MEDIDO por /om: de 13 a 16 h los modelos daban 0,5-1,9 mm (poco) y
   los 6,9 mm/h eran del Automático A LAS 20:00. El aviso cogía la hora de
   las horas con algo de agua (≥ 0,3) y el «fuerte» y los mm del PEOR MOMENTO
   DEL DÍA. Y encima con el ⚡ del rayo en un aviso que solo era de agua. */
{
  const escBermeo = { agua: [{ k: 0, dia: 'hoy', horas: [13, 14, 15, 16], mm: 0.5 }, { k: 0, dia: 'hoy', horas: [20], mm: 6.9 }] };
  /* 130 min desde la última: con 30 la pasada se SALTABA («verde: se pasa
     cada 120 min») y la prueba salía verde sin mirar nada. Por eso además
     se exige que no se haya saltado. */
  const A1 = await pasada({ hora: '13:30', antes: tranquilo('13:30', 130), esc: escBermeo });
  ok('13:30 · agua floja de 13 a 16 h y fuerte a las 20 h: el aviso de las 3 h siguientes NO dice «agua fuerte» (lo fuerte es a las 20)',
     !A1.reventó && A1.b.saltada !== true && !(A1.b.avisados || []).some(a => /agua fuerte/.test(a.cuerpo || '')), resumen(A1));
  const A2 = await pasada({ hora: '18:00', antes: tranquilo('18:00', 130), esc: escBermeo });
  const a2 = (A2.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('18:00 · la misma tarde, cuando las 20 h entran en la ventana: «agua fuerte prevista a las 20h (6,9 mm/h» con el pico de ESA hora',
     !A2.reventó && /BERMEO: agua fuerte prevista a las 20h \(6,9 mm\/h, /.test(a2?.cuerpo || ''), (a2?.cuerpo) || resumen(A2));
  ok('y un aviso que solo es de agua va con 🌧, no con el ⚡ del rayo',
     !A2.reventó && /^🌧 Próximas 3 h/.test(a2?.titulo || ''), a2?.titulo || resumen(A2));
  const A4 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                            esc: { agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 3 }, { k: 0, dia: 'hoy', horas: [22], mm: 8 }] } });
  const a4 = (A4.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('14:00 · fuerte a las 15 (3 mm/h) y más fuerte a las 22 (8): el aviso de las 3 h dice 3, el de SU hora, no el 8 de la noche',
     !A4.reventó && /BERMEO: agua fuerte prevista a las 15h \(3 mm\/h, /.test(a4?.cuerpo || '') && !/8 mm/.test(a4?.cuerpo || ''), (a4?.cuerpo) || resumen(A4));
  const A3 = await pasada({ hora: '12:00', antes: tranquilo('12:00', 130),
                            esc: { rayo: [{ k: 0, dia: 'hoy', horas: [13, 14] }], agua: [{ k: 1, dia: 'hoy', horas: [13], mm: 3 }] } });
  const a3 = (A3.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('12:00 · si en el aviso hay rayo, el título lleva el ⚡ aunque también haya agua',
     !A3.reventó && /^⚡ Próximas 3 h/.test(a3?.titulo || ''), a3?.titulo || resumen(A3));
}

/* ── LA RACHA, CON SU HORA (30-09-2026) ─────────────────────────────
   La misma familia que el agua: «racha 110 km/h a las 15h» con 75 a las
   15 y 110 a las 23; y el «no he podido mirar» decía «racha 95 km/h a las
   08h» con 72 a las 08 y 95 a las 16 (el máximo del día con la PRIMERA
   hora que pasaba de 70). */
{
  const B1 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                            esc: { racha: [{ k: 0, dia: 'hoy', horas: [15], v: 75 }, { k: 0, dia: 'hoy', horas: [23], v: 110 }] } });
  const b1 = (B1.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('14:00 · racha de 75 a las 15 y de 110 a las 23: el aviso de las 3 h dice 75 a las 15h, no el 110 de la noche, y con 💨',
     !B1.reventó && /BERMEO: racha prevista a las 15h \(75 km\/h, /.test(b1?.cuerpo || '') && !/110/.test(b1?.cuerpo || '')
     && /^💨 Próximas 3 h/.test(b1?.titulo || ''), (b1 && `${b1.titulo} — ${b1.cuerpo}`) || resumen(B1));
  const B2 = await pasada({ hora: '14:00', antes: null,
                            esc: { racha: [{ k: 0, dia: 'hoy', horas: [8], v: 72 }, { k: 0, dia: 'hoy', horas: [16], v: 95 }, { k: 1, dia: 'hoy', horas: [17], v: 65 }],
                                   agua: [{ k: 2, dia: 'hoy', horas: [18], mm: 1.5 }] } });
  const cb2 = (B2.b.cambios || []).join(' | ');
  ok('14:00 sin estado («no he podido mirar»): «racha 95 km/h a las 16h», el pico con SU hora y solo lo que queda (no «a las 08h»)',
     !B2.reventó && /BERMEO racha 95 km\/h a las 16h/.test(cb2) && !/08h/.test(cb2), cb2 || resumen(B2));
  ok('y solo lo gordo, por SUS listones: la racha de 65 (ORDUNA) y el agua de 1,5 (MUNGIA) no entran',
     !B2.reventó && /BERMEO/.test(cb2) && !/ORDUNA|MUNGIA/.test(cb2), cb2 || resumen(B2));
}

/* ── EL TÍTULO CABE EN SU MÓVIL (30-09-2026, su captura de las 14:40) ──
   «⚡ MATIENA (crítico) y 7 más» salía «⚡ / MATIENA (…»: con su tamaño de
   letra y el icono a la derecha caben unas diez letras por línea y dos
   líneas. Y «(2 mm/h, ICON (celda de al lado))», paréntesis dentro de
   paréntesis. */
{
  const T1 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
    esc: { criticos: [3], rayo: [{ k: 3, dia: 'hoy', horas: [16, 17] }, { k: 5, dia: 'hoy', horas: [17] }], agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 2.2 }] } });
  const t1 = (T1.b.avisados || []).find(a => /crítico|Próximas 3 h/i.test(a.titulo));
  const T2 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
    esc: { rayo: [{ k: 5, dia: 'hoy', horas: [17] }], agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 2.2 }] } });
  const t2 = (T2.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('los títulos del aviso de las 3 h caben en su móvil (15 letras como mucho, SIN nombre de sitio) y el crítico y cuántos sitios van en el cuerpo',
     !T1.reventó && !T2.reventó && t1?.titulo === '⚡ Crítico' && t2?.titulo === '⚡ Próximas 3 h'
     && [...t1.titulo].length <= 15 && [...t2.titulo].length <= 15 && !/MATIENA|OIZ|BERMEO/.test(t1.titulo + t2.titulo)
     && /^Crítico: MATIENA\. 3 sitios\. MATIENA: riesgo de rayo 16h-17h\./.test(t1.cuerpo) && /^2 sitios\. /.test(t2.cuerpo),
     `${t1?.titulo} — ${t1?.cuerpo} | ${t2?.titulo} — ${t2?.cuerpo}`);
}

ok('«celda de al lado» va sin paréntesis propio: dentro de «(2 mm/h, ICON …)» salía «(… ICON (celda de al lado))»',
   !/' \(celda de al lado\)'/.test(fs.readFileSync(path.join(tmp, 'api', 'vigilante.mjs'), 'utf8'))
   && /' en la celda de al lado'/.test(fs.readFileSync(path.join(tmp, 'api', 'vigilante.mjs'), 'utf8')));

/* ── LA REGLA Y NO EL CASO (30-09-2026) ────────────────────────────────
   Suyo: «hay que reparar el porqué, de raíz, para que la siguiente no lo
   vuelva a hacer». Los casos de arriba guardan los fallos que YA pasaron;
   esta guarda la REGLA: en tardes inventadas al azar (semilla fija, así
   que si falla, falla siempre igual), cada «agua fuerte prevista …» y
   cada «racha prevista …» del aviso tiene que decir el MÁXIMO de las
   horas que nombra, todas esas horas tienen que pasar el listón y ninguna
   puede salirse de las 3 h siguientes. Se lee el TEXTO que le llega a él. */
{
  const TOPE_R = Number((fs.readFileSync(path.join(tmp, 'api', 'vigilante.mjs'), 'utf8').match(/const RACHA_TOPE = (\d+);/) || [])[1]);
  const TOPE_A = Number((fs.readFileSync(path.join(tmp, 'api', 'vigilante.mjs'), 'utf8').match(/const AGUA_FUERTE = ([\d.]+);/) || [])[1]);
  let semilla = 20260930;
  const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
  const nombres = SITIOS.map(x => x.name.replace(/^[A-Z]{2} /, ''));
  const malos = []; let frases = 0;
  for (let caso = 0; caso < 20; caso++) {
    const h0 = 6 + Math.floor(azar() * 16);
    const esc = { agua: [], racha: [] }, verdad = {};
    for (let k = 0; k < SITIOS.length; k++) for (let h = 0; h < 24; h++) {
      if (azar() < 0.2) { const mm = Math.round((0.3 + azar() * 8) * 10) / 10; esc.agua.push({ k, dia: 'hoy', horas: [h], mm }); verdad[`${k}:agua:${h}`] = mm; }
      if (azar() < 0.1) { const v = Math.round(55 + azar() * 60); esc.racha.push({ k, dia: 'hoy', horas: [h], v }); verdad[`${k}:racha:${h}`] = v; }
    }
    const hora = `${p2(h0)}:05`;
    const P = await pasada({ hora, antes: tranquilo(hora, 200), esc });   // 200: de noche el verde va cada 180 (el guardia de arriba lo cazó)
    const cuerpo = (P.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo))?.cuerpo || '';
    for (const trozo of cuerpo.split(/\.\s+(?=[A-ZÑ]{3,}[A-Z0-9 ]*:)/)) {
      const m0 = trozo.match(/^([A-ZÑ][A-Z0-9Ñ ]+):/); if (!m0) continue;
      const k = nombres.indexOf(m0[1].trim()); if (k < 0) continue;
      const re = /(agua fuerte prevista|racha prevista) (?:ahora y hasta las (\d\d)h|a las (\d\d)h|(\d\d)h-(\d\d)h) \((\d+(?:,\d)?) (mm\/h|km\/h)/g;
      let m;
      while ((m = re.exec(trozo))) {
        frases++;
        const tipo = m[1].startsWith('agua') ? 'agua' : 'racha', tope = tipo === 'agua' ? TOPE_A : TOPE_R;
        const desde = m[2] ? h0 : Number(m[3] ?? m[4]), hasta = Number(m[2] ?? m[3] ?? m[5]);
        const dicho = Number(m[6].replace(',', '.'));
        let max = -Infinity, todas = true;
        for (let h = desde; h <= hasta; h++) { const v = verdad[`${k}:${tipo}:${h}`]; if (!(v >= tope)) todas = false; if (v > max) max = v; }
        if (Math.abs(dicho - max) > 0.05 || !todas || hasta > h0 + 3 || desde < h0)
          malos.push(`${hora} ${nombres[k]} «${m[0]}» → máximo de ${desde}-${hasta}h: ${max}${todas ? '' : ', con horas bajo el listón'}`);
      }
    }
  }
  ok('la regla y no el caso: en 20 tardes al azar, cada «agua fuerte prevista» y «racha prevista» dice el MÁXIMO de las horas que nombra, todas pasan el listón y ninguna se sale de las 3 h',
     malos.length === 0 && frases >= 20, malos.slice(0, 3).join(' · ') || `${frases} frases miradas`);
}

/* ── EL PULSO, 60 s DE CDN ─────────────────────────────────────────── */
{
  const M = await pasada({ hora: '14:00', antes: tranquilo('14:00', 10), metodo: 'GET', query: { pulso: '1' } });
  ok('el pulso va 60 s al CDN: cada apertura de la app no arranca la función para decir lo mismo',
     !M.reventó && /s-maxage=60/.test(String(M.res.cabeceras['Cache-Control'])), JSON.stringify(M.res.cabeceras));
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
