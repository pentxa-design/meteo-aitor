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
import zlib from 'node:zlib';

/* ── UN MAPA DE RAYOS DE MENTIRA, CON EL FORMATO DE AEMET (04-10-2026) ──
   PNG en RGBA con fondo transparente y un punto rojo de 2×2 por descarga,
   en Mercator dentro de `BOUNDS_RAYOS`, que es como lo dibuja AEMET. El
   vigilante lo lee con lib/rayos-png.mjs y cuenta con la regla única. */
const BOUNDS_RAYOS = { lon0: -4, lon1: -1.5, lat0: 42.5, lat1: 44 };
function pngDeRayos(puntos, W = 800, H = 600) {
  const B = BOUNDS_RAYOS, my = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360));
  const y0 = my(B.lat0), y1 = my(B.lat1);
  const filas = Buffer.alloc((W * 4 + 1) * H);
  for (const { lat, lon } of puntos) {
    const x = Math.round((lon - B.lon0) / (B.lon1 - B.lon0) * W), y = Math.round((y1 - my(lat)) / (y1 - y0) * H);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const o = (y + dy) * (W * 4 + 1) + 1 + (x + dx) * 4;
      filas[o] = 230; filas[o + 1] = 20; filas[o + 2] = 20; filas[o + 3] = 255;
    }
  }
  const crc = b => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const trozo = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), trozo('IHDR', ihdr),
                        trozo('IDAT', zlib.deflateSync(filas)), trozo('IEND', Buffer.alloc(0))]);
}
/* Un punto a `km` al norte de (lat, lon). */
const alNorte = (p, km) => ({ lat: p.lat + km / 111.32, lon: p.lon });

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
/* Las reglas únicas, que el vigilante carga por lib/reglas.mjs (04-10-2026). */
fs.copyFileSync(path.join(FUENTE, 'reglas-tiempo.js'), path.join(tmp, 'reglas-tiempo.js'));

const ESTADO = 'avisos/vigilante.json';
const { localAUTC, resumen: resumenVerif, PUNTOS_CONTRASTE, ranking, duenoAprendido } = await import(pathToFileURL(path.join(tmp, 'lib', 'verificacion.mjs')).href);
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
     rayo:    [{ k, dia, horas, om? }]         tormenta prevista: CAPE 900, tapa 10 Y código 95
     pareja:  [{ k, dia, horas, om? }]         solo la pareja CAPE 900 / tapa 10, sin código (no avisa al móvil, 04-10-2026)
     codigo:  [{ k, dia, horas, om? }]         código de tormenta 95
     racha:   [{ k, dia, horas, v }]
     ojoCape: [{ k, dia, horas, v }]           CAPE sin tapa abierta
     caidos:  [k]                              ese sitio no contesta (503)
     sinModelo: [om]                           ese modelo no da dato (null) en ningún sitio ni hora
     lentos:  [k]                              ese sitio tarda más que el tope (TimeoutError)
     medido:  [{ k, horas: { 11: mm } }]       lo que MIDIÓ la estación de AEMET (hora local de hoy)
     estacionesCaidas: true                    /estaciones contesta 503 */
function red(esc, fijo, llamadas) {
  /* `esc.criticos: [k]` pone ese sitio donde está MATIENA de verdad: el
     vigilante reconoce los críticos por estar a menos de 300 m de los
     suyos, no por un campo de la lista. */
  const SITIOS_ESC = SITIOS.map((x, k) => (esc.criticos || []).includes(k)
    ? { name: 'BI MATIENA', lat: 43.159627, lon: -2.626779 }
    : (esc.enDeusto || []).includes(k)
      ? { name: 'BI DEUSTOII · ES-TIMS-46853', lat: 43.271656, lon: -2.948538, admin1: 'Vantage · Bilbao' } : x);
  const hoy0 = new RealDate(fijo); hoy0.setHours(0, 0, 0, 0);
  const iso = d => `${clave(d)}T${p2(d.getHours())}:00`;
  const R = (o, okk = true, status = 200) =>
    Promise.resolve({ ok: okk, status, json: () => Promise.resolve(o), text: () => Promise.resolve(JSON.stringify(o)) });
  const hit = (lista, k, om, dia, hh) => (esc[lista] || []).find(x =>
    x.k === k && x.dia === dia && x.horas.includes(hh) && (!x.om || x.om === om));
  const valor = (k, om, campo, d) => {
    const dia = clave(d) === clave(hoy0) ? 'hoy' : 'man', hh = d.getHours();
    if ((esc.sinModelo || []).includes(om)) return null;
    if (campo === 'cape') { if (hit('rayo', k, om, dia, hh) || hit('pareja', k, om, dia, hh)) return 900; const o = hit('ojoCape', k, om, dia, hh); return o ? o.v : 40; }
    if (campo === 'convective_inhibition') return (hit('rayo', k, om, dia, hh) || hit('pareja', k, om, dia, hh)) ? 10 : 120;
    if (campo === 'precipitation') { const a = hit('agua', k, om, dia, hh); return a ? a.mm : 0; }
    if (campo === 'wind_gusts_10m') { const r = hit('racha', k, om, dia, hh); return r ? r.v : 20; }
    if (campo === 'weather_code') return (hit('codigo', k, om, dia, hh) || hit('rayo', k, om, dia, hh)) ? 95 : 1;
    if (campo === 'temperature_2m') return 15;
    return null;
  };
  return (u = '', init = {}) => {
    const s = String(u); llamadas.push({ u: s, init });
    const q = new URL(s).searchParams;
    if (s.includes('/api/torres')) return R({ torres: SITIOS_ESC });
    /* `esc.rayosMedidos: [{ k, km, hace }]`: una descarga a `km` del sitio k,
       en el mapa que acabó hace `hace` minutos. `esc.rayosCaidos`: el
       catálogo contesta 503. Sin nada, dos mapas vacíos (se lee igual). */
    if (s.includes('/rayos')) {
      if (esc.rayosCaidos) return R({ error: true, reason: 'caído a propósito' }, false, 503);
      const f = q.get('f');
      const rm = esc.rayosMedidos || [];
      const haceMax = rm.length ? Math.min(...rm.map(x => x.hace ?? 20)) : 20;
      const fin = new RealDate(fijo.getTime() - haceMax * 60000);
      const marcos = [1, 0].map(i => ({ f: `m${i}.png`, desde: new RealDate(fin.getTime() - (i + 1) * 3600e3).toISOString(),
                                        hasta: new RealDate(fin.getTime() - i * 3600e3).toISOString() }));
      if (!f) return R({ fuente: 'AEMET (de mentira)', ambitos: { PB: { bounds: BOUNDS_RAYOS, marcos } } });
      const puntos = f === 'm0.png' ? rm.map(x => alNorte(SITIOS_ESC[x.k], x.km)) : [];
      const png = pngDeRayos(puntos);
      return Promise.resolve({ ok: true, status: 200, arrayBuffer: () => Promise.resolve(png.buffer.slice(png.byteOffset, png.byteOffset + png.length)) });
    }
    if (s.includes('/estaciones')) {
      if (esc.estacionesCaidas) return R({ error: 'caído a propósito' }, false, 503);
      const pts = (q.get('puntos') || '').split('|').filter(Boolean).map(x => x.split(',').map(Number));
      return R({ puntos: pts.map(([la, lo]) => {
        let k = SITIOS_ESC.findIndex(x => Math.abs(x.lat - la) < 1e-3 && Math.abs(x.lon - lo) < 1e-3);
        if (k < 0) { const r = PUNTOS_CONTRASTE.findIndex(x => Math.abs(x.lat - la) < 1e-3 && Math.abs(x.lon - lo) < 1e-3); k = r >= 0 ? 100 + r : -1; }
        const filas = [];
        for (const m of (esc.medido || []).filter(x => x.k === k))
          for (const [h, mm] of Object.entries(m.horas)) filas.push({ cuando: `${localAUTC(`${clave(hoy0)}T${p2(h)}:00`)}:00:00+0000`, lluvia: mm });
        return { lat: la, lon: lo, estaciones: filas.length ? [{ nombre: `EST${k}`, km: 3, historia: filas }] : [] };
      }) });
    }
    /* `esc.eusk: { k, lluvia, lluviaMin, km, hace }`: la estación junto al punto k
       (en el orden en que los pide el vigilante) mide eso (03-10-2026, la «A»). */
    if (s.includes('/api/euskalmet')) {
      const pts = (q.get('puntos') || '').split('|').filter(Boolean);
      return R({ ok: true, puntos: pts.map((pt, k) => {
        const [la, lo] = pt.split(',').map(Number), m = (esc.eusk || []).find(x => x.k === k);
        return m ? { id: `E${k}`, nombre: `Estación ${k}`, km: m.km ?? 1.1, lat: la, lon: lo, lluvia: m.lluvia, lluviaMin: m.lluviaMin ?? 30,
                     medidoEn: m.medidoEn ?? '2026-10-03T19:00:00.000Z', haceMinutos: m.hace ?? 10 } : null;
      }) });
    }
    if (s.includes('/api/marcador')) return R({ ok: true });
    if (s.includes('/om')) {
      const lats = (q.get('latitude') || '').split(','), lons = (q.get('longitude') || '').split(',');
      const modelos = (q.get('models') || 'best_match').split(',');
      const campos = (q.get('hourly') || '').split(',').filter(Boolean);
      const T = []; for (let i = 0; i < 48; i++) T.push(new RealDate(hoy0.getTime() + i * 3600e3));
      const kDe = lat => { const i = SITIOS_ESC.findIndex(x => Math.abs(x.lat - Number(lat)) < 1e-6); if (i >= 0) return i;
        const r = PUNTOS_CONTRASTE.findIndex(x => Math.abs(x.lat - Number(lat)) < 1e-6); return r >= 0 ? 100 + r : -1; };
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
async function pasada({ hora, antes = null, esc = {}, metodo = 'POST', query = {}, seSalta = false, conservar = false }) {
  const fijo = new RealDate(); const [H, M] = hora.split(':').map(Number); fijo.setHours(H, M, 0, 0);
  if (!conservar) globalThis.__ALMACEN = new Map();
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
  /* El parte de la mañana, con el pico de la LLUVIA según su dueño y su
     nombre (01-10-2026: «lo más fuerte … 7,7 mm/h» sin decir de quién ni
     a qué hora, y era de otro modelo). */
  const PA = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }),
    esc: { agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 3, om: 'meteofrance_arome_france_hd' }, { k: 0, dia: 'hoy', horas: [9], mm: 7, om: 'icon_eu' }] } });
  const cpa = cuerpoDe(PA.b, /parte de hoy/i);
  ok('07:30 · el parte dice el pico de la lluvia de SU dueño, con su hora y su nombre: «BERMEO 3 mm/h a las 11h (AROME HD)», no los 7 de ICON',
     !PA.reventó && /lo más fuerte BERMEO 3 mm\/h a las 11h \(AROME HD\)/.test(cpa), cpa || resumen(PA));
  const P0 = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }) });
  const cp0 = cuerpoDe(P0.b, /parte de hoy/i);
  ok('07:30 · un día limpio lo dice con SUS listones (0,3 mm/h y 70 km/h), no con números a mano',
     /sin agua de 0,3 mm\/h para arriba y sin rachas de 70\./.test(cp0), cp0 || resumen(P0));

  /* DEUSTO II ES CRÍTICO (suyo, 03-10-2026): si no se puede mirar, suena
     aunque sea ella sola y el día esté en verde. */
  const DZ = await pasada({ hora: '17:10', antes: tranquilo('17:10', 125), esc: { enDeusto: [3], caidos: [3] } });
  const tdz = titulos(DZ.b).find(t => /No he podido mirar/.test(t)) || '';
  const cdz = cuerpoDe(DZ.b, /No he podido mirar/);
  ok('17:10 · DEUSTO II sin mirar, ella sola y en verde: suena «no he podido mirar», porque es crítica',
     !DZ.reventó && /No he podido mirar 1/.test(tdz) && /no pueden faltar/.test(cdz), `${tdz} | ${cdz || resumen(DZ)}`);

  /* CON 1 A 3 SITIOS SIN MIRAR, EL PARTE NO DICE «SIN NADA» DE TODOS
     (03-10-2026, TRASPASO §67 7). El aviso «no he podido mirar» solo suena
     con un crítico o con 4 o más; el parte callaba los otros. */
  const PC = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }), esc: { caidos: [3] } });
  const tpc = titulos(PC.b).find(t => /parte de hoy/i.test(t)) || '';
  const cpc = cuerpoDe(PC.b, /parte de hoy/i);
  ok('07:30 · con DURANGO sin mirar y los demás limpios, el parte no dice «sin nada» de todos: lo nombra y dice que de él no sabe nada',
     !PC.reventó && !/sin nada por encima/.test(tpc) && /1 sin mirar/.test(tpc)
     && /No he podido mirar DURANGO \(.+\): de ese no sé nada/.test(cpc), `${tpc} | ${cpc || resumen(PC)}`);
  const PD = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }),
    esc: { caidos: [3], agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 3 }] } });
  const cpd = cuerpoDe(PD.b, /parte de hoy/i);
  ok('07:30 · con agua en BERMEO y DURANGO sin mirar, el parte da el agua Y nombra a DURANGO',
     !PD.reventó && /agua en 1 sitio/.test(cpd) && /No he podido mirar DURANGO/.test(cpd), cpd || resumen(PD));
  const PE = await pasada({ hora: '13:15', antes: tranquilo('13:15', 10, { parte2De: null,
      parteResumen: { fecha: HOY, rayo: [], agua: ['BERMEO', 'DURANGO'], racha: [] } }),
    esc: { caidos: [3], agua: [{ k: 0, dia: 'hoy', horas: [16], mm: 3 }] } });
  const cpe = cuerpoDe(PE.b, /segundo parte/i);
  ok('13:15 · el segundo parte no dice «sale DURANGO» del agua cuando a DURANGO no se le ha podido mirar: lo dice',
     !PE.reventó && !/sale DURANGO/.test(cpe) && /No he podido mirar DURANGO/.test(cpe), cpe || resumen(PE));

  /* LA LLUVIA DEL PARTE ES LA DEL DUEÑO (03-10-2026, TRASPASO §67 7): antes
     las horas eran la UNIÓN de los modelos y contaba «agua» donde AROME HD
     veía seco porque GFS daba 0,4. Lo de los demás, aparte y con nombre. */
  const PF = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }),
    esc: { agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 0.4, om: 'gfs_seamless' }] } });
  const tpf = titulos(PF.b).find(t => /parte de hoy/i.test(t)) || '';
  const cpf = cuerpoDe(PF.b, /parte de hoy/i);
  ok('07:30 · GFS ve 0,4 a las 15h y AROME HD seco: el parte no lo cuenta como agua, pero lo dice aparte con su nombre y su hora',
     !PF.reventó && /sin nada por encima/.test(tpf) && !/agua en 1 sitio/.test(cpf)
     && /Agua que solo ven otros modelos, en 1 sitio: lo más BERMEO 0,4 mm\/h a las 15h \(GFS\)/.test(cpf), `${tpf} | ${cpf || resumen(PF)}`);
  const PG = await pasada({ hora: '07:30', antes: tranquilo('07:30', 10, { parteDe: AYER, parte2De: AYER }),
    esc: { agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 1, om: 'meteofrance_arome_france_hd' },
                  { k: 0, dia: 'hoy', horas: [15, 16, 17, 18], mm: 0.5, om: 'gfs_seamless' }] } });
  const cpg = cuerpoDe(PG.b, /parte de hoy/i);
  ok('07:30 · AROME HD 1 mm/h a las 11h y GFS 0,5 de 15 a 18h: «llueve» son las horas de AROME HD, no de 11h a 18h',
     !PG.reventó && /lo más fuerte BERMEO 1 mm\/h a las 11h \(AROME HD\), y llueve a las 11h/.test(cpg) && !/18h/.test(cpg), cpg || resumen(PG));
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
  ok('   y sale como inminente diciendo que es MAÑANA y a qué hora, pero SIN aviso al móvil: el rayo de los modelos ya no va al móvil (04-10-2026, «estos sobran y al final enredan»)',
     /* A las 22:30 las tres horas siguientes llegan hasta la 01h: se dice
        hasta ahí, que es lo que cuenta ahora (deManana). */
     Array.isArray(H.b.inminentes) && H.b.inminentes[0] === 'BERMEO mañana 00h-01h'
     && !titulos(H.b).some(t => /⚡|Próximas 3 h|crítico/i.test(t)), resumen(H));
}

/* ── 14:00 · EL CÓDIGO DE TORMENTA CUENTA COMO RAYO ────────────────── */
{
  const I = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                           esc: { codigo: [{ k: 0, dia: 'hoy', horas: [15, 16], om: 'ecmwf_ifs025' }] } });
  ok('14:00 · «tormenta» (código 95) con CAPE 40 en un modelo cuenta como rayo en la app y en el parte, pero NO suena en el móvil (04-10-2026: los «⚡ Crítico» de las 15:06 por código de ECMWF 9 km e ICON, con nada en el radar)',
     !I.reventó && (I.b.inminentes || []).includes('BERMEO 15h-16h') && !titulos(I.b).some(t => /⚡|Próximas 3 h|crítico/i.test(t)), resumen(I));
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
     !N2.reventó && /ORDUNA: AROME HD ve que llueve bien 21h-22h \(2,5 mm\/h/.test(c2), c2 || resumen(N2));
  const N3 = await pasada({ hora: '20:00', antes: conAguaGuardada('20:00', 130),
                           esc: { rayo: [{ k: 0, dia: 'man', horas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }] } });
  ok('20:00 · un rayo de MAÑANA de 00 a 13 h no es «CAMBIO» a las 20:00 (empieza a 4 h; va en el parte de las 06:30)',
     !N3.reventó && !titulos(N3.b).some(t => /CAMBIO/.test(t)), resumen(N3));
  const N5 = await pasada({ hora: '22:00', antes: tranquilo('22:00', 130, {
                              sitios: { BERMEO: { [MAN]: { ini: 13, fin: 19, tramos: [{ ini: 13, fin: 19 }] } } }, aguaSitios: {}, rachaSitios: {} }),
                            esc: { rayo: [{ k: 0, dia: 'man', horas: Array.from({ length: 20 }, (_, i) => i) }] } });
  ok('22:00 · el rayo de mañana de los modelos no suena: ni «rayo mañana 00h-01h» ni «13h-19h pasa a…» (04-10-2026, al móvil solo lo medido)',
     !N5.reventó && !titulos(N5.b).some(t => /⚡|Próximas 3 h|crítico|CAMBIO/i.test(t)), resumen(N5));
  const N4 = await pasada({ hora: '22:00', antes: conAguaGuardada('22:00', 130),
                           esc: { rayo: [{ k: 0, dia: 'man', horas: [0, 1, 2] }] } });
  ok('22:00 · y el de madrugada (00-02 h) tampoco: lo previsto va en la app; de noche lo que suena es lo MEDIDO',
     !N4.reventó && !titulos(N4.b).some(t => /⚡|Próximas 3 h|crítico/i.test(t)), resumen(N4));
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
  ok('12:00 · y aunque entre un sitio NUEVO (ORDUNA) con rayo de modelo, no suena: el rayo previsto no va al móvil (04-10-2026)',
     !R3.reventó && !titulos(R3.b).some(t => /⚡|Próximas 3 h|crítico/i.test(t)), resumen(R3));
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
  ok('13:30 · agua floja de 13 a 16 h y fuerte a las 20 h: el aviso de las 3 h siguientes NO dice «llueve bien» (lo fuerte es a las 20)',
     !A1.reventó && A1.b.saltada !== true && !(A1.b.avisados || []).some(a => /llueve bien/.test(a.cuerpo || '')), resumen(A1));
  const A2 = await pasada({ hora: '18:00', antes: tranquilo('18:00', 130), esc: escBermeo });
  const a2 = (A2.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('18:00 · la misma tarde, cuando las 20 h entran en la ventana: «agua fuerte prevista a las 20h (6,9 mm/h» con el pico de ESA hora',
     !A2.reventó && /BERMEO: AROME HD ve que llueve bien a las 20h \(6,9 mm\/h/.test(a2?.cuerpo || ''), (a2?.cuerpo) || resumen(A2));
  ok('y un aviso que solo es de agua va con 🌧, no con el ⚡ del rayo',
     !A2.reventó && /^🌧 Próximas 3 h/.test(a2?.titulo || ''), a2?.titulo || resumen(A2));
  const A4 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
                            esc: { agua: [{ k: 0, dia: 'hoy', horas: [15], mm: 3 }, { k: 0, dia: 'hoy', horas: [22], mm: 8 }] } });
  const a4 = (A4.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('14:00 · fuerte a las 15 (3 mm/h) y más fuerte a las 22 (8): el aviso de las 3 h dice 3, el de SU hora, no el 8 de la noche',
     !A4.reventó && /BERMEO: AROME HD ve que llueve bien a las 15h \(3 mm\/h/.test(a4?.cuerpo || '') && !/8 mm/.test(a4?.cuerpo || ''), (a4?.cuerpo) || resumen(A4));
  const A3 = await pasada({ hora: '12:00', antes: tranquilo('12:00', 130),
                            esc: { rayo: [{ k: 0, dia: 'hoy', horas: [13, 14] }], agua: [{ k: 1, dia: 'hoy', horas: [13], mm: 3 }] } });
  const a3 = (A3.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('12:00 · con rayo de modelo y agua, el aviso es solo de agua: 🌧 y sin «riesgo de rayo» (el rayo previsto no va al móvil, 04-10-2026)',
     !A3.reventó && /^🌧 Próximas 3 h/.test(a3?.titulo || '') && !/rayo/.test(a3?.cuerpo || ''), JSON.stringify(a3) || resumen(A3));
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
     !B1.reventó && /BERMEO: AROME HD ve racha de 75 km\/h a las 15h/.test(b1?.cuerpo || '') && !/110/.test(b1?.cuerpo || '')
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

/* ── EL AGUA FUERTE DE UN SOLO MODELO NO ES AVISO (01-10-2026) ────────
   Su captura de las 12:14: a las 10:00 «BERMEO: agua fuerte prevista a las
   11h (5 mm/h, Automático)», y no llovió; ICON, GFS y ECMWF daban 0,1-0,2.
   Y el aviso de agua sola vibraba como el del rayo. */
{
  const AR = 'meteofrance_arome_france_hd';
  const solo = [{ k: 0, dia: 'hoy', horas: [11], mm: 5, om: AR }];
  const L1 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200), esc: { agua: solo } });
  ok('10:00 · 5 mm/h a las 11h que solo ve AROME HD (los demás, 0): NO hay aviso de «llueve bien»',
     !L1.reventó && !(L1.b.avisados || []).some(a => /llueve bien/.test(a.cuerpo || '')), resumen(L1));
  const L2 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
                            esc: { agua: [...solo, { k: 0, dia: 'hoy', horas: [11], mm: 1.2, om: 'icon_eu' }] } });
  const l2 = (L2.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('10:00 · si además ICON pasa de 1 mm/h a esa hora, SÍ avisa, y dice QUIÉN lo ve: «AROME HD ve que llueve bien a las 11h (5 mm/h; también ICON)»',
     !L2.reventó && /BERMEO: AROME HD ve que llueve bien a las 11h \(5 mm\/h; también ICON\)/.test(l2?.cuerpo || ''), l2?.cuerpo || resumen(L2));
  /* El dueño de la lluvia decide (suyo, 01-10): si el bueno para la lluvia no
     ve que llueve bien, que la vean otros no es aviso. */
  const L5 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
    esc: { agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 5, om: 'icon_eu' }, { k: 0, dia: 'hoy', horas: [11], mm: 1.5, om: 'gfs_seamless' }, { k: 0, dia: 'hoy', horas: [11], mm: 0.5, om: AR }] } });
  ok('10:00 · ICON ve 5 mm/h y GFS 1,5 pero AROME HD (el bueno para la lluvia) solo 0,5: NO hay aviso de «llueve bien»',
     !L5.reventó && !(L5.b.avisados || []).some(a => /llueve bien/.test(a.cuerpo || '')), resumen(L5));
  /* SIN DATO DE AROME HD, DECIDE ECMWF Y SE DICE (03-10-2026, TRASPASO §67 7).
     Antes no salía ningún aviso de agua: el «llueve bien» pedía el número de
     AROME, y un hueco no es un número. Un 0 de AROME sí lo es (L5). */
  const SA1 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
    esc: { sinModelo: [AR], agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 4, om: 'ecmwf_ifs025' }, { k: 0, dia: 'hoy', horas: [11], mm: 1.5, om: 'icon_eu' }] } });
  const sa1 = (SA1.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('10:00 · AROME HD sin dato, ECMWF 4 mm/h e ICON 1,5: SÍ avisa, lo da ECMWF y dice que AROME HD no da dato',
     !SA1.reventó && /BERMEO: ECMWF ve que llueve bien a las 11h \(4 mm\/h; también ICON; AROME HD no da dato a esa hora\)/.test(sa1?.cuerpo || ''), sa1?.cuerpo || resumen(SA1));
  const SA2 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
    esc: { sinModelo: [AR], agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 5, om: 'icon_eu' }, { k: 0, dia: 'hoy', horas: [11], mm: 1.5, om: 'gfs_seamless' }, { k: 0, dia: 'hoy', horas: [11], mm: 0.5, om: 'ecmwf_ifs025' }] } });
  ok('10:00 · AROME HD sin dato y ECMWF (el que manda entonces) solo 0,5: NO hay aviso, aunque ICON vea 5',
     !SA2.reventó && !(SA2.b.avisados || []).some(a => /llueve bien/.test(a.cuerpo || '')), resumen(SA2));
  /* Y el rayo dice quién ve qué CAPE y a qué hora. */
  /* SOLO SI ESTÁ CLARO (suyo, 04-10-2026: «si no da muy claro, que no los
     envíe»): la pareja de UN solo modelo no avisa al móvil (el 77 % sin rayo,
     medido); con DOS modelos, o con el código de tormenta, sí. */
  const L6 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 200),
    esc: { pareja: [{ k: 0, dia: 'hoy', horas: [16, 17], om: 'icon_eu' }] } });
  const l6 = (L6.b.avisados || []).find(a => /Próximas 3 h|Crítico/.test(a.titulo));
  ok('14:00 · solo ICON rompe por pareja (16-17h): NO se manda aviso de rayo al móvil (04-10-2026, 40 «Crítico» con cero descargas)',
     !L6.reventó && !/riesgo de rayo/.test(l6?.cuerpo || ''), l6?.cuerpo || resumen(L6));
  const L6b = await pasada({ hora: '14:00', antes: tranquilo('14:00', 200),
    esc: { pareja: [{ k: 0, dia: 'hoy', horas: [16, 17], om: 'icon_eu' }, { k: 0, dia: 'hoy', horas: [16, 17], om: 'gfs_seamless' }] } });
  const l6b = (L6b.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('   ni con ICON y GFS a la vez: la pareja es «puede» y «puede» no va al móvil (suyo, 11:10: «quitar esos avisos raros alarmistas»)',
     !L6b.reventó && !/riesgo de rayo/.test(l6b?.cuerpo || ''), l6b?.cuerpo || resumen(L6b));
  const L6c = await pasada({ hora: '14:00', antes: tranquilo('14:00', 200),
    esc: { codigo: [{ k: 0, dia: 'hoy', horas: [16], om: 'icon_eu' }] } });
  const l6c = (L6c.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('   ni el código de tormenta de un modelo: «estos sobran y al final enredan» (suyo, 04-10-2026, con los «⚡ Crítico» de las 15:06 y nada en el radar)',
     !L6c.reventó && !l6c && !titulos(L6c.b).some(t => /⚡/.test(t)), l6c?.cuerpo || resumen(L6c));
  ok('y el agua sola avisa SIN vibrar (importante: false): la vibración larga es del rayo y la racha de 70',
     l2 && l2.importante === false && /^🌧/.test(l2.titulo), JSON.stringify(l2));
  /* PERO LA TROMBA VIBRA (03-10-2026): con 15 mm/h para arriba («llueve
     fuerte», AEMET) el agua sola es importante. Ese día las trombas de Bilbao
     y Bermeo llegaban, si llegaban, sin vibrar. */
  const TR = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
    esc: { agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 18, om: AR }, { k: 0, dia: 'hoy', horas: [11], mm: 2, om: 'icon_eu' }] } });
  const tr = (TR.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('10:00 · tromba de 18 mm/h de AROME HD con ICON de acuerdo: el aviso VIBRA (importante) y dice «lluvia fuerte»',
     !TR.reventó && tr?.importante === true && /AROME HD ve lluvia fuerte a las 11h \(18 mm\/h/.test(tr?.cuerpo || ''), JSON.stringify(tr) || resumen(TR));
  const L3 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
                            esc: { rayosMedidos: [{ k: 1, km: 4, hace: 20 }] } });
  const l3 = (L3.b.avisados || []).find(a => /Rayo medido/.test(a.titulo));
  ok('el rayo MEDIDO sí es importante (vibra): es su veto',
     l3 && l3.importante === true && /^⚡/.test(l3.titulo), JSON.stringify(l3) || resumen(L3));
  const L4 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
                            esc: { racha: [{ k: 0, dia: 'hoy', horas: [11], v: 80 }] } });
  const l4 = (L4.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('y con una racha de 70 o más también',
     l4 && l4.importante === true && /^💨/.test(l4.titulo), JSON.stringify(l4));
}

/* ── AL MÓVIL, EL RAYO MEDIDO (04-10-2026) ─────────────────────────────
   Suyo: «estos sobran y al final enredan» (los «⚡ Crítico» de las 15:06
   por código de ECMWF 9 km e ICON, nada en el radar ni en los rayos) ·
   «y el rayo sí entró, pero a las 20:00, y me estaba avisando todo el
   día». Al móvil va lo que MIDE la red de AEMET a menos de 15 km y de
   hace menos de 90 min, con la regla única (la misma del veto de la app). */
{
  const M1 = await pasada({ hora: '20:30', antes: tranquilo('20:30', 200),
                            esc: { rayosMedidos: [{ k: 0, km: 3, hace: 20 }] } });
  const m1 = (M1.b.avisados || []).find(a => /Rayo medido/.test(a.titulo));
  ok('20:30 · una descarga medida a 3 km de BERMEO hace 20 min: suena «⚡ Rayo medido», vibra, nombra el sitio y dice que es medido, no previsto',
     /* 2,7 y no 3: la posición sale del píxel (0,35 km en LOCL; aquí, más gordo). Y MUNGIA y
        GERNIKA salen también, que esa misma descarga les cae a 14 km: es verdad. ORDUNA, a 47 km, no. */
     !M1.reventó && m1?.importante === true && /BERMEO: 1 descarga a menos de 15 km, la más cercana a [23](,\d)? km/.test(m1?.cuerpo || '')
     && /Medido por la red de AEMET/.test(m1?.cuerpo || '') && !/ORDUNA/.test(m1?.cuerpo || ''), JSON.stringify(m1) || resumen(M1));
  const M2 = await pasada({ hora: '20:30', antes: tranquilo('20:30', 200),
                            esc: { rayosMedidos: [{ k: 0, km: 25, hace: 20 }] } });
  ok('20:30 · a 25 km (por la zona, no encima) NO suena: el veto es a 15 km',
     !M2.reventó && !titulos(M2.b).some(t => /⚡/.test(t)), resumen(M2));
  const M3 = await pasada({ hora: '20:30', antes: tranquilo('20:30', 200),
                            esc: { rayosMedidos: [{ k: 0, km: 3, hace: 120 }] } });
  ok('20:30 · la misma descarga, pero de hace dos horas: NO suena (pasados 90 min es historia, no veto)',
     !M3.reventó && !titulos(M3.b).some(t => /⚡/.test(t)), resumen(M3));
  /* La firma es «sitio@hora del mapa»: la del mapa que acabó hace 20 min. */
  const finMapa = new RealDate(new RealDate().setHours(20, 10, 0, 0)).toISOString();
  const M4 = await pasada({ hora: '20:30', antes: tranquilo('20:30', 200, { rayosAvisados: [`BERMEO@${finMapa}`] }),
                            esc: { rayosMedidos: [{ k: 0, km: 3, hace: 20 }] } });
  ok('20:30 · si ESA descarga ya se avisó en BERMEO, a BERMEO no se le repite',
     !M4.reventó && !(M4.b.avisados || []).some(a => /⚡/.test(a.titulo) && /BERMEO/.test(a.cuerpo)), resumen(M4));
  const M5 = await pasada({ hora: '20:30', antes: tranquilo('20:30', 10), seSalta: true,
                            esc: { rayosMedidos: [{ k: 0, km: 3, hace: 20 }] } });
  ok('20:30 · y suena también en un tic que se salta la pasada de los modelos: el rayo medido se mira cada 30 min',
     !M5.reventó && M5.b.saltada === true && (M5.b.avisados || []).some(a => /Rayo medido/.test(a.titulo)), resumen(M5));
  const M6 = await pasada({ hora: '20:30', antes: tranquilo('20:30', 10), seSalta: true, esc: { rayosCaidos: true } });
  ok('20:30 · con el catálogo de AEMET caído no suena nada y se DICE que no se pudo leer (no es «no hay rayos»)',
     !M6.reventó && !titulos(M6.b).some(t => /⚡/.test(t)) && /caído a propósito|catálogo/.test(M6.b.rayosMedidos?.fallo || ''), resumen(M6) + ' ' + JSON.stringify(M6.b.rayosMedidos));
}

/* ── LO QUE NO SE ESCRIBE NO SE DA POR DICHO (04-10-2026) ──────────────
   Suyo: «ayer igual, tanto aviso y al final ni avisó la tromba de agua de
   Bilbao». El cuerpo lleva cinco sitios como mucho y la firma marcaba
   todos; ahora lo NUEVO va primero. Cinco ya dichos y OIZ nuevo: OIZ sale. */
{
  const dichos = ['BERMEO', 'ORDUNA', 'MUNGIA', 'DURANGO', 'GERNIKA'].map(n => `${n}:agua:11`).join('|');
  const T1 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200, { ultimoAviso: dichos }),
                            esc: { agua: [0, 1, 2, 3, 4, 5].map(k => ({ k, dia: 'hoy', horas: [11], mm: 3 })) } });
  const t1 = (T1.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('10:00 · seis sitios con agua, cinco ya avisados y OIZ nuevo: el aviso NOMBRA a OIZ (antes quedaba fuera de los cinco y se daba por dicho)',
     !T1.reventó && /OIZ: AROME HD ve que llueve bien/.test(t1?.cuerpo || ''), t1?.cuerpo || resumen(T1));
}

/* ── LA PALABRA SEGÚN LA INTENSIDAD (01-10-2026) ──────────────────────
   Suyo: «agua fuerte no, que estaríamos en Valencia, 200 litros esta tarde;
   alerta roja en Valencia y Barcelona: eso sí que son lluvias». Escala
   oficial de AEMET en mm/h: moderada 2-15, fuerte 15-30, muy fuerte 30-60,
   torrencial más de 60. */
{
  const AR = 'meteofrance_arome_france_hd';
  const palabras = [];
  for (const mm of [5, 20, 40, 70]) {
    const Z = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200),
      esc: { agua: [{ k: 0, dia: 'hoy', horas: [11], mm, om: AR }, { k: 0, dia: 'hoy', horas: [11], mm: 4, om: 'icon_eu' }] } });
    palabras.push((Z.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo))?.cuerpo?.match(/BERMEO: AROME HD ve (que llueve bien|lluvia fuerte|lluvia muy fuerte|lluvia torrencial) a las 11h/)?.[1] ?? '—');
  }
  ok('la palabra sigue la escala de AEMET: 5 mm/h «llueve bien», 20 «lluvia fuerte», 40 «muy fuerte», 70 «torrencial»',
     palabras.join(' | ') === 'que llueve bien | lluvia fuerte | lluvia muy fuerte | lluvia torrencial', palabras.join(' | '));
}

/* ── EL REGISTRO DE LO AVISADO CONTRA LO QUE CAYÓ (01-10-2026) ────────
   Suyo, tras los avisos que no se cumplieron: «lo haces: comparas y pones
   bien todo». Pasada 1 a las 10:00 apunta lo previsto para las 11h (AROME
   HD 5 mm/h, ICON 4); pasada 2 a las 14:00 lo compara con lo que midió la
   estación de AEMET. */
{
  const AR = 'meteofrance_arome_france_hd';
  const previsto = { agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 5, om: AR }, { k: 0, dia: 'hoy', horas: [11], mm: 4, om: 'icon_eu' }] };
  const cadena = async (esc2, extra = {}) => {
    const P1 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200), esc: previsto });
    const P2 = await pasada({ hora: '14:00', conservar: true, esc: esc2, ...extra });
    return { P1, P2, v: JSON.parse(globalThis.__ALMACEN.get('avisos/verificacion.json') || 'null') };
  };
  ok('la conversión de hora local de Madrid a UTC cuadra: verano −2 h, invierno −1 h, y el cambio de hora de marzo',
     localAUTC('2026-10-01T11:00') === '2026-10-01T09' && localAUTC('2026-12-01T11:00') === '2026-12-01T10'
     && localAUTC('2026-03-29T04:00') === '2026-03-29T02', [localAUTC('2026-10-01T11:00'), localAUTC('2026-12-01T11:00'), localAUTC('2026-03-29T04:00')].join(' '));

  const C0 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200), esc: previsto });
  const v0 = JSON.parse(globalThis.__ALMACEN.get('avisos/verificacion.json') || 'null');
  ok('la pasada de las 10:00 APUNTA lo previsto para las 11h, con lo que daba cada modelo y la antelación (1 h)',
     !C0.reventó && v0?.pend?.some(p => p.n === 'BERMEO' && p.t.endsWith('T11:00') && p.l === 1 && p.m['AROME HD'] === 5 && p.m.ICON === 4),
     JSON.stringify(v0?.pend?.slice(0, 2)));
  ok('y no apunta lo seco (solo horas con algo de agua previsto): los demás sitios no salen',
     (v0?.pend || []).every(p => p.n === 'BERMEO'), [...new Set((v0?.pend || []).map(p => p.n))].join(','));

  const { P2: S2, v: vSeco } = await cadena({ medido: [{ k: 0, horas: { 11: 0 } }] });
  ok('14:00 · la estación midió 0 mm a las 11h: el aviso «llueve bien» NO se cumplió, y queda contado (falsa alarma)',
     !S2.reventó && S2.b.verificacion?.comparadas === 1 && vSeco?.stats?.regla?.seco === 1 && vSeco.stats.regla.bien === 0,
     JSON.stringify(S2.b.verificacion) + ' ' + JSON.stringify(vSeco?.stats?.regla));
  ok('y por modelo y tramo: AROME HD daba 5 (tramo 5-15) y no cayó; ICON daba 4 (tramo 2-5) y no cayó',
     vSeco?.stats?.cubos?.['AROME HD']?.['5-15']?.seco === 1 && vSeco?.stats?.cubos?.ICON?.['2-5']?.seco === 1, JSON.stringify(vSeco?.stats?.cubos));
  ok('y la previsión ya comparada sale de la lista de pendientes (no se cuenta dos veces)',
     !(vSeco?.pend || []).some(p => p.n === 'BERMEO' && p.t.endsWith('T11:00')), JSON.stringify(vSeco?.pend?.length));

  const { v: vBien } = await cadena({ medido: [{ k: 0, horas: { 11: 6.4 } }] });
  ok('si cayó 6,4 mm a las 11h, es un ACIERTO del aviso (bien: 1, seco: 0), y por antelación cae en «0-1»',
     vBien?.stats?.regla?.bien === 1 && vBien.stats.regla.seco === 0 && vBien.stats.regla.plazo['0-1']?.bien === 1, JSON.stringify(vBien?.stats?.regla));

  const { v: vPoco } = await cadena({ medido: [{ k: 0, horas: { 11: 0.8 } }] });
  ok('si cayó 0,8 mm, es «poco»: ni acierto ni falsa alarma',
     vPoco?.stats?.regla?.poco === 1 && vPoco.stats.regla.bien === 0 && vPoco.stats.regla.seco === 0, JSON.stringify(vPoco?.stats?.regla));

  const { v: vPerd } = await cadena({ medido: [{ k: 0, horas: { 11: 0, 12: 3.1 } }] });
  ok('cayeron 3,1 mm a las 12h y NADIE lo había previsto: se cuenta aparte (perdidas: 1), con su hora',
     vPerd?.stats?.perdidas === 1 && /BERMEO .* 3,1|BERMEO .* 3\.1 mm/.test(vPerd?.stats?.perdidasHoras?.[0] || ''), JSON.stringify(vPerd?.stats?.perdidasHoras));

  const { P2: S5, v: vCaido } = await cadena({ estacionesCaidas: true });
  ok('si /estaciones no contesta, la pasada NO se cae, dice por qué y las previsiones esperan para la siguiente',
     !S5.reventó && /estaciones contesta 503/.test(S5.b.verificacion?.error || '') && vCaido?.pend?.some(p => p.n === 'BERMEO' && p.t.endsWith('T11:00')),
     JSON.stringify(S5.b.verificacion));

  await cadena({ medido: [{ k: 0, horas: { 11: 0 } }] });
  const RV = await pasada({ hora: '14:30', conservar: true, metodo: 'GET', query: { verificar: '1' } });
  ok('?verificar=1 lo cuenta con palabras: «salió 1 vez… NO cayó en 1 (100 %)»',
     RV.b.hay === true && /salió 1 veces/.test(RV.b.texto) && /NO cayó en 1 \(100 %\)/.test(RV.b.texto), RV.b.texto || JSON.stringify(RV.b).slice(0, 200));
  ok('y sin nada guardado lo dice, no inventa porcentajes',
     resumenVerif(null).hay === false && /Todavía no hay nada/.test(resumenVerif(null).texto));

  /* ── Y APRENDE (01-10-2026) ─────────────────────────────────────────── */
  ok('cada modelo lleva su MATRIZ: AROME HD dijo «llueve bien» (5 mm) y no cayó → [seco][bien] = 1; ICON (4 mm) igual',
     vSeco?.stats?.matriz?.eus?.['AROME HD']?.m?.[0]?.[2] === 1 && vSeco.stats.matriz.eus.ICON?.m?.[0]?.[2] === 1 && vSeco.stats.matriz.eus['AROME HD'].n === 1,
     JSON.stringify(vSeco?.stats?.matriz?.eus?.['AROME HD']));
  ok('y su error medio: AROME HD se pasó 5 mm (sesgo +5), ICON 4',
     Math.abs((vSeco?.stats?.matriz?.eus?.['AROME HD']?.se ?? 0) - 5) < 1e-9 && Math.abs((vSeco?.stats?.matriz?.eus?.ICON?.se ?? 0) - 4) < 1e-9);

  // Puntos de contraste: REF Tarragona (el primero) llueve 5 y 4 mm a las 11h, y la estación midió 0,3.
  const refPrev = { agua: [{ k: 100, dia: 'hoy', horas: [11], mm: 5, om: AR }, { k: 100, dia: 'hoy', horas: [11], mm: 4, om: 'icon_eu' }] };
  await pasada({ hora: '10:00', antes: tranquilo('10:00', 200), esc: refPrev });
  const vRef0 = JSON.parse(globalThis.__ALMACEN.get('avisos/verificacion.json') || 'null');
  ok('los puntos de contraste (fuera de Euskadi) se apuntan también, con su zona «ref»',
     vRef0?.pend?.some(p => p.n === 'REF Tarragona' && p.z === 'ref' && p.m['AROME HD'] === 5), JSON.stringify(vRef0?.pend?.filter(p => p.n.startsWith('REF')).slice(0, 1)));
  await pasada({ hora: '14:00', conservar: true, esc: { medido: [{ k: 100, horas: { 11: 0.3 } }] } });
  const vRef1 = JSON.parse(globalThis.__ALMACEN.get('avisos/verificacion.json') || 'null');
  ok('y se comparan aparte: la matriz «ref» aprende (AROME HD: dijo bien y cayó poco) y la «eus» no se toca',
     vRef1?.stats?.matriz?.ref?.['AROME HD']?.m?.[1]?.[2] === 1 && !vRef1.stats.matriz.eus['AROME HD'], JSON.stringify(vRef1?.stats?.matriz));

  // ── ELEGIR EL DUEÑO CON LO APRENDIDO ──
  const matriz = (filas) => Object.fromEntries(Object.entries(filas).map(([n, m]) => [n, { n: m.flat().reduce((a, b) => a + b, 0), ae: 0, se: 0, m }]));
  const registro = (filas, dueno = null) => ({ desde: '2026-10-01T10:00:00.000Z', pend: [], vistos: [], ultima: null, dueno,
    stats: { regla: { n: 0, seco: 0, poco: 0, bien: 0, plazo: {} }, reglaRef: { n: 0, seco: 0, poco: 0, bien: 0 }, cubos: {}, matriz: { eus: matriz(filas), ref: {} }, perdidas: 0, perdidasHoras: [], sinMedida: 0 } });
  const FLOJO = [[40, 5, 5], [10, 10, 10], [10, 8, 12]];          // seco .80 · poco .33 · bien .40 → .51
  const BUENO = [[40, 5, 5], [2, 24, 4], [2, 4, 24]];             // .80 · .80 · .80 → .80
  const MEDIO = [[40, 5, 5], [5, 15, 10], [5, 10, 15]];          // .80 · .50 · .50 → .60
  const POCO = [[3, 1, 1], [1, 2, 1], [0, 1, 2]];                 // muy pocos casos
  const rk = ranking(registro({ 'AROME HD': FLOJO, ICON: BUENO, GFS: MEDIO }), 'eus');
  ok('el ranking ordena por acierto EQUILIBRADO (la media de lo que acierta de seco, poco y bien): ICON 80 %, GFS 60 %, AROME HD 51 %',
     rk.map(r => r.nombre).join() === 'ICON,GFS,AROME HD' && Math.round(rk[0].acierto * 100) === 80 && Math.round(rk[2].acierto * 100) === 51,
     JSON.stringify(rk.map(r => [r.nombre, r.acierto])));
  /* 03-10-2026: el dueño se aprende POR LITROS en las horas de lluvia (suyo:
     «quien acertó hoy y los litros sobre todo, ese manda»), no por acierto
     equilibrado. `litros(n, mae)` mete n horas de lluvia con ese error medio. */
  const conLitros = (v, quien, n, mae) => { v.stats.matriz.eus[quien].lluvia = { n, ae: n * mae, se: 0 }; return v; };
  const dX = duenoAprendido(registro({ 'AROME HD': POCO, ICON: POCO }), 'AROME HD', '2026-10-02T10:00:00Z');
  ok('con pocas horas de lluvia medida NO cambia el dueño y dice que faltan',
     dX.nombre === 'AROME HD' && dX.cambio === false && /faltan horas de lluvia medida/.test(dX.porque), dX.porque);
  const vC = conLitros(conLitros(registro({ 'AROME HD': FLOJO, ICON: BUENO }), 'AROME HD', 40, 3), 'ICON', 40, 1.5);
  const dC = duenoAprendido(vC, 'AROME HD', '2026-10-02T10:00:00Z');
  ok('con 40 horas de lluvia, ICON falla 1,5 mm/h y AROME HD 3: el registro aprendería ICON, y queda anotado de quién venía',
     dC.nombre === 'ICON' && dC.cambio === true && vC.dueno?.nombre === 'ICON' && vC.dueno.antes === 'AROME HD' && /aprendería ICON/.test(dC.porque), dC.porque);
  const vH = conLitros(conLitros(registro({ 'AROME HD': MEDIO, ICON: BUENO }), 'AROME HD', 40, 2), 'ICON', 40, 1.8);
  const dH = duenoAprendido(vH, 'AROME HD', '2026-10-02T10:00:00Z');
  ok('y con una diferencia pequeña (1,8 contra 2 mm/h) NO cambia: hace falta fallar un 20 % menos; una tarde no cambia el dueño',
     dH.nombre === 'AROME HD' && dH.cambio === false && /no un 20 % menos/.test(dH.porque), dH.porque);

  /* Y en una pasada de verdad, aunque el registro diga que ICON es el bueno,
     MANDA AROME HD (03-10-2026, suyo: «quien acertó hoy y los litros sobre
     todo, ese manda»; ICON se quedó en 1-3 mm/h con trombas de 15-28). */
  globalThis.__ALMACEN = new Map(); globalThis.__ALMACEN.set('avisos/verificacion.json', JSON.stringify(registro({ 'AROME HD': FLOJO, ICON: BUENO, GFS: MEDIO }, { nombre: 'ICON', desde: '2026-10-02T08:00:00Z', antes: 'AROME HD', acierto: 0.8 })));
  const LD = await pasada({ hora: '10:00', conservar: true, antes: tranquilo('10:00', 200),
    esc: { agua: [{ k: 0, dia: 'hoy', horas: [11], mm: 5, om: 'icon_eu' }, { k: 0, dia: 'hoy', horas: [11], mm: 1.5, om: AR }] } });
  const ld = (LD.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('con el registro diciendo ICON, manda AROME HD: ICON 5 mm/h y AROME 1,5 NO es «llueve bien», y el pulso dice lo que diría lo aprendido',
     !LD.reventó && !(LD.b.avisados || []).some(a => /llueve bien/.test(a.cuerpo || ''))
     && LD.estado?.dueno?.nombre === 'AROME HD' && LD.estado?.dueno?.loAprendido === 'ICON', JSON.stringify(LD.estado?.dueno) + ' ' + (ld?.cuerpo || ''));
  const RK = await pasada({ hora: '14:30', conservar: true, metodo: 'GET', query: { verificar: '1' } });
  ok('?verificar=1 dice que MANDA AROME HD (decisión suya) y aparte lo que aprendería el registro, con el ranking',
     /Manda en la lluvia: AROME HD/.test(RK.b.texto || '') && /aprendería el registro por litros/.test(RK.b.texto || '')
     && RK.b.manda === 'AROME HD' && RK.b.ranking?.eus?.[0]?.nombre === 'ICON', (RK.b.texto || '').slice(0, 260));

  /* Y si el propio almacén falla al leer el registro, la pasada y sus avisos siguen. */
  {
    const M0 = new Map();
    M0.get = k => { if (k === 'avisos/verificacion.json') throw new Error('almacén caído a propósito'); return Map.prototype.get.call(M0, k); };
    globalThis.__ALMACEN = M0;
    const C9 = await pasada({ hora: '10:00', conservar: true, antes: tranquilo('10:00', 200), esc: { ...previsto, rayo: [{ k: 0, dia: 'hoy', horas: [11] }] } });
    // `pasada()` mete `antes` en el almacén que ya hay: aquí es el de mentira que falla solo en el registro
    ok('si el almacén falla al leer el registro, la pasada NO se cae, sigue avisando del rayo y lo dice',
       !C9.reventó && /almacén caído/.test(C9.b.verificacion?.error || '') && (C9.b.avisados || []).some(a => /Próximas 3 h/.test(a.titulo)),
       JSON.stringify(C9.b.verificacion) + ' ' + resumen(C9));
  }

  const M2 = await pasada({ hora: '10:00', antes: tranquilo('10:00', 200), esc: previsto, query: { mirar: '1' } });
  ok('con «mirar=1» NO se apunta nada (esa ojeada no toca nada guardado)',
     !globalThis.__ALMACEN.get('avisos/verificacion.json') && M2.b.verificacion == null, JSON.stringify(M2.b.verificacion));
}

/* ── EL TÍTULO CABE EN SU MÓVIL (30-09-2026, su captura de las 14:40) ──
   «⚡ MATIENA (crítico) y 7 más» salía «⚡ / MATIENA (…»: con su tamaño de
   letra y el icono a la derecha caben unas diez letras por línea y dos
   líneas. Y «(2 mm/h, ICON (celda de al lado))», paréntesis dentro de
   paréntesis. */
{
  const T1 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
    esc: { criticos: [3], agua: [{ k: 3, dia: 'hoy', horas: [16, 17], mm: 2.2 }, { k: 0, dia: 'hoy', horas: [15], mm: 2.2 }] } });
  const t1 = (T1.b.avisados || []).find(a => /crítico|Próximas 3 h/i.test(a.titulo));
  const T2 = await pasada({ hora: '14:00', antes: tranquilo('14:00', 130),
    esc: { agua: [{ k: 5, dia: 'hoy', horas: [17], mm: 2.2 }, { k: 0, dia: 'hoy', horas: [15], mm: 2.2 }] } });
  const t2 = (T2.b.avisados || []).find(a => /Próximas 3 h/.test(a.titulo));
  ok('los títulos del aviso de las 3 h caben en su móvil (15 letras como mucho, SIN nombre de sitio) y el crítico y cuántos sitios van en el cuerpo',
     !T1.reventó && !T2.reventó && t1?.titulo === '🌧 Crítico' && t2?.titulo === '🌧 Próximas 3 h'
     && [...t1.titulo].length <= 15 && [...t2.titulo].length <= 15 && !/MATIENA|OIZ|BERMEO/.test(t1.titulo + t2.titulo)
     && /^Crítico: MATIENA\. 2 sitios\. MATIENA: AROME HD ve que llueve bien/.test(t1.cuerpo) && /^2 sitios\. /.test(t2.cuerpo),   // con agua: el rayo previsto ya no va al móvil (04-10-2026)
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
      const re = /ve (que llueve bien|lluvia (?:fuerte|muy fuerte|torrencial)|racha de \d+ km\/h) (?:ahora y hasta las (\d\d)h|a las (\d\d)h|(\d\d)h-(\d\d)h)(?: \((\d+(?:,\d)?) mm\/h)?/g;
      let m;
      while ((m = re.exec(trozo))) {
        frases++;
        const tipo = /^(que|lluvia)/.test(m[1]) ? 'agua' : 'racha', tope = tipo === 'agua' ? TOPE_A : TOPE_R;
        m[6] = tipo === 'agua' ? m[6] : m[1].match(/\d+/)[0];
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

/* ── QUIÉN MANDA EN LA LLUVIA SE VE DESDE LA APP (02-10-2026) ──────── */
{
  const A = await pasada({ hora: '14:00', antes: tranquilo('14:00', 200) });
  ok('la pasada guarda quién manda en la lluvia de los avisos y si lo eligió lo medido',
     !A.reventó && A.estado?.dueno?.nombre === 'AROME HD' && A.estado?.dueno?.aprendido === false, JSON.stringify(A.estado?.dueno));
  const P = await pasada({ hora: '14:00', antes: tranquilo('14:00', 10, { dueno: { nombre: 'ICON', aprendido: true } }), metodo: 'GET', query: { pulso: '1' } });
  ok('y el pulso se lo cuenta a la app tal cual, para que Avisos lo enseñe',
     !P.reventó && P.b.dueno?.nombre === 'ICON' && P.b.dueno?.aprendido === true, JSON.stringify(P.b));
}

/* ── LA «A»: LA LLUVIA MEDIDA CERCA DE SUS SITIOS AVISA (03-10-2026) ──── */
{
  const tromba = await pasada({ hora: '21:15', antes: tranquilo('21:15', 200, { marcadorHora: null }), esc: { criticos: [4], eusk: [{ k: 0, lluvia: 10, lluviaMin: 30 }] } });
  const a = (tromba.b.avisados || []).find(x => x.tag === 'medida');
  ok('Bermeo 03-10 21:15: la estación a 1,1 km mide 10 mm en 30 min (20 mm/h) → «🌧 TROMBA MEDIDA», vibra y dice dónde y cuánto',
     !tromba.reventó && a && a.importante === true && a.titulo === '🌧 TROMBA MEDIDA' && /medido en Estación 0 \(1,1 km\) 10 mm en 30 min, 20 mm\/h/.test(a.cuerpo),
     JSON.stringify(a || tromba.b.avisados));
  ok('   y los críticos van primero (con 21 sitios, Deusto II se quedaba fuera de los 20 que coge Euskalmet)',
     a && /\(crítico\)/.test(a.cuerpo), a?.cuerpo);
  ok('   y lo apunta para no repetirlo', (tromba.estado?.medidasAvisadas || []).length === 1, JSON.stringify(tromba.estado?.medidasAvisadas));
  const otra = await pasada({ hora: '21:45', antes: { ...tromba.estado, cuando: hace('21:45', 200), marcadorHora: null }, esc: { eusk: [{ k: 0, lluvia: 10, lluviaMin: 30 }] } });
  ok('   y la misma medida no se avisa dos veces', !(otra.b.avisados || []).some(x => x.tag === 'medida'), JSON.stringify(otra.b.avisados || otra.b.nota));
  const floja = await pasada({ hora: '21:15', antes: tranquilo('21:15', 200, { marcadorHora: null }), esc: { eusk: [{ k: 0, lluvia: 1.5, lluviaMin: 30 }] } });
  const af = (floja.b.avisados || []).find(x => x.tag === 'medida');
  ok('   3 mm/h medidos avisan como «🌧 LLUEVE YA», sin vibrar', af && af.importante === false && af.titulo === '🌧 LLUEVE YA', JSON.stringify(af));
  const lejos = await pasada({ hora: '21:15', antes: tranquilo('21:15', 200, { marcadorHora: null }), esc: { eusk: [{ k: 0, lluvia: 10, lluviaMin: 30, km: 9 }] } });
  ok('   una estación a 9 km no cuenta como «cerca»', !(lejos.b.avisados || []).some(x => x.tag === 'medida'));
}

/* ── EL PULSO, 60 s DE CDN ─────────────────────────────────────────── */
{
  const M = await pasada({ hora: '14:00', antes: tranquilo('14:00', 10), metodo: 'GET', query: { pulso: '1' } });
  ok('el pulso va 60 s al CDN: cada apertura de la app no arranca la función para decir lo mismo',
     !M.reventó && /s-maxage=60/.test(String(M.res.cabeceras['Cache-Control'])), JSON.stringify(M.res.cabeceras));
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
