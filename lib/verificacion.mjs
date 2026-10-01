/* ═══════════════════════════════════════════════════════════════════
   EL REGISTRO DE LO AVISADO CONTRA LO QUE CAYÓ (01-10-2026)
   ───────────────────────────────────────────────────────────────────
   Suyo, 01-10-2026, tras tres avisos de «agua fuerte» en Bermeo que no
   se cumplieron: «¿cómo da avisos falsos? Hay algo mal… pues lo haces:
   comparas y pones bien todo».

   Hasta hoy el vigilante leía las previsiones de los modelos y avisaba,
   y NADIE comprobaba después si había llovido. Sin eso, cualquier listón
   («dos modelos de acuerdo», «2 mm/h») era una apuesta. Aquí se guarda,
   por emplazamiento y por hora de aquí a seis horas, qué daba CADA modelo
   y con cuánta antelación; pasada la hora, se compara con lo que MIDIÓ la
   estación de AEMET más cercana con pluviómetro, y se lleva la cuenta:

     · por modelo y por tramo de intensidad previsto: cuántas veces no
       cayó nada, cayó poco, o cayó de verdad (≥ 2 mm/h);
     · de la REGLA del aviso («llueve bien»: el dueño ≥ 2 mm/h y otro
       modelo > 1), en total y por antelación;
     · de las veces que cayó ≥ 2 mm/h y nadie lo había previsto.

   Todo se puede leer en `/api/vigilante?verificar=1`. Es lo que permite
   cambiar un listón con datos y no con una tarde.

   Solo se apuntan las horas con algo de agua prevista (≥ 0,3 mm/h en
   algún modelo): lo seco no hace falta guardarlo, y que cayera agua sin
   que nadie la previera se cuenta aparte, con las medidas. Nada de esto
   puede romper una pasada: quien llama lo envuelve en un try/catch.
   ═══════════════════════════════════════════════════════════════════ */
import { leerJSON, guardarJSON } from './almacen.mjs';

export const RUTA = 'avisos/verificacion.json';
const MAX_PEND = 1500;      // previsiones esperando a que pase su hora
const MAX_VISTOS = 1500;    // claves «sitio|hora» ya contadas
const SIN_MEDIDA_H = 30;    // pasadas tantas horas sin medida, se tira

const CUBOS = [[0.3, 1, '0,3-1'], [1, 2, '1-2'], [2, 5, '2-5'], [5, 15, '5-15'], [15, Infinity, '15+']];
export const cuboDe = v => CUBOS.find(([a, b]) => v >= a && v < b)?.[2] ?? null;
/** Qué pasó de verdad: no cayó nada, cayó poco o «llueve bien» (≥ 2 mm/h). */
export const resultado = mm => (mm >= 2 ? 'bien' : mm >= 0.2 ? 'poco' : 'seco');

/** Hora local de Madrid «2026-10-01T11:00» → etiqueta UTC «2026-10-01T09». */
export function localAUTC(t) {
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d)/.exec(String(t));
  if (!m) return null;
  const [Y, M, D, h] = [+m[1], +m[2] - 1, +m[3], +m[4]];
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' });
  const offset = ms => { const p = Object.fromEntries(f.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour) - Math.floor(ms / 3600e3) * 3600e3; };
  let utc = Date.UTC(Y, M, D, h);
  utc -= offset(utc);
  utc = Date.UTC(Y, M, D, h) - offset(utc);
  return new Date(utc).toISOString().slice(0, 13);
}

/** ¿Salta la regla del aviso «llueve bien» con lo que daba cada modelo? */
export function reglaDispara(vals, dueno, pico = 2, acuerdo = 1, modelos = 2) {
  if (!(vals?.[dueno] >= pico)) return false;
  return Object.values(vals).filter(v => v > acuerdo).length >= modelos;
}

const vacio = () => ({ n: 0, seco: 0, poco: 0, bien: 0 });
const sumar = (o, r) => { o.n++; o[r]++; };
const nuevo = ahoraISO => ({ desde: ahoraISO, pend: [], vistos: [], ultima: null,
  stats: { regla: { ...vacio(), plazo: {} }, modelos: {}, perdidas: 0, perdidasHoras: [], sinMedida: 0 } });

/** Apunta lo previsto: `sitios` = [{ n, pv: { 'YYYY-MM-DDTHH:00': { AROME HD: mm, ICON: mm… } } }] */
export function apuntar(v, ahoraISO, desde, sitios) {
  const t0 = Date.parse(`${desde}:00Z`);
  const claves = new Set(v.pend.map(p => `${p.n}|${p.t}|${p.l}`));
  for (const s of sitios) {
    for (const [t, m] of Object.entries(s.pv || {})) {
      const l = Math.round((Date.parse(`${t}:00Z`) - t0) / 3600e3);
      if (!(l >= 0 && l <= 6)) continue;
      const k = `${s.n}|${t}|${l}`;
      if (claves.has(k)) continue;
      const u = localAUTC(t); if (!u) continue;
      v.pend.push({ e: ahoraISO, n: s.n, t, u, l, m });
      claves.add(k);
      const vk = `${s.n}|${u}`;
      if (!v.vistos.includes(vk)) v.vistos.push(vk);
    }
  }
  if (v.pend.length > MAX_PEND) v.pend.splice(0, v.pend.length - MAX_PEND);
  if (v.vistos.length > MAX_VISTOS) v.vistos.splice(0, v.vistos.length - MAX_VISTOS);
}

/** Qué sitios tienen previsiones cuya hora ya pasó (y se puede comparar). */
export function vencidos(v, ahoraMs) {
  const out = new Set();
  for (const p of v.pend) if (Date.parse(`${p.u}:00Z`) + 90 * 60e3 <= ahoraMs) out.add(p.n);
  return [...out];
}

/** Compara con lo medido. `medidas`: Map(sitio → Map('YYYY-MM-DDTHH' UTC → mm)). */
export function liquidar(v, medidas, ahoraMs, dueno) {
  const S = v.stats; let comparadas = 0;
  const resto = [];
  for (const p of v.pend) {
    const vence = Date.parse(`${p.u}:00Z`) + 90 * 60e3 <= ahoraMs;
    if (!vence) { resto.push(p); continue; }
    const mm = medidas.get(p.n)?.get(p.u);
    if (mm == null) {
      // Sin estación o sin dato de esa hora: se espera, y pasado un día y pico se tira.
      if (ahoraMs - Date.parse(`${p.u}:00Z`) > SIN_MEDIDA_H * 3600e3) { S.sinMedida++; continue; }
      resto.push(p); continue;
    }
    const r = resultado(mm);
    comparadas++;
    for (const [nombre, val] of Object.entries(p.m)) {
      const c = cuboDe(val); if (!c) continue;
      sumar(((S.modelos[nombre] ??= {})[c] ??= vacio()), r);
    }
    if (reglaDispara(p.m, dueno)) {
      sumar(S.regla, r);
      const plazo = p.l <= 1 ? '0-1' : p.l <= 3 ? '2-3' : '4-6';
      sumar((S.regla.plazo[plazo] ??= vacio()), r);
    }
  }
  v.pend = resto;
  // Lo que cayó de verdad (≥ 2 mm/h) y nadie había previsto: se cuenta una vez.
  const desdeU = v.desde.slice(0, 13);   // `desde` ya es UTC
  for (const [n, mapa] of medidas) {
    for (const [u, mm] of mapa) {
      if (!(mm >= 2) || u < desdeU) continue;
      if (Date.parse(`${u}:00Z`) + 90 * 60e3 > ahoraMs) continue;
      const k = `${n}|${u}`;
      if (v.vistos.includes(k)) continue;
      v.vistos.push(k);
      S.perdidas++;
      S.perdidasHoras.push(`${n} ${u.slice(5, 10)} ${u.slice(11)}Z ${Math.round(mm * 10) / 10} mm`);
      if (S.perdidasHoras.length > 20) S.perdidasHoras.shift();
    }
  }
  if (v.vistos.length > MAX_VISTOS) v.vistos.splice(0, v.vistos.length - MAX_VISTOS);
  return comparadas;
}

const pct = (a, n) => (n ? `${Math.round((100 * a) / n)} %` : '—');
/** Lo que se lee en `?verificar=1`: los números y una frase por cosa. */
export function resumen(v) {
  if (!v) return { hay: false, texto: 'Todavía no hay nada guardado: el registro empieza con la próxima pasada.' };
  const S = v.stats, R = S.regla;
  const frases = [];
  frases.push(R.n
    ? `El aviso «llueve bien» (AROME HD ≥ 2 mm/h y otro modelo > 1) salió ${R.n} veces: cayó ≥ 2 mm/h en ${R.bien} (${pct(R.bien, R.n)}), entre 0,2 y 2 en ${R.poco} y NO cayó en ${R.seco} (${pct(R.seco, R.n)}).`
    : 'Todavía ninguna hora en que saltara el aviso «llueve bien» ha podido compararse con lo medido.');
  if (S.perdidas) frases.push(`Cayó ≥ 2 mm/h ${S.perdidas} veces sin que nadie lo hubiera previsto.`);
  return { hay: true, desde: v.desde, pendientes: v.pend.length, ultima: v.ultima,
           regla: R, modelos: S.modelos, perdidas: S.perdidas, perdidasHoras: S.perdidasHoras, sinMedida: S.sinMedida,
           texto: frases.join(' ') };
}

/**
 * Lo único que llama el vigilante: apunta lo previsto, y si hay horas ya
 * pasadas (y no se ha mirado hace menos de 55 min) las compara con lo medido.
 * `pedirMedidas(nombres)` devuelve el Map de arriba.
 */
export async function verificar({ sitios, ahoraISO, ahoraMs, desde, dueno, pedirMedidas }) {
  const dato = (await leerJSON(RUTA, null)).dato;
  const v = dato?.stats ? dato : nuevo(ahoraISO);
  const antes = JSON.stringify([v.pend.length, v.vistos.length]);
  apuntar(v, ahoraISO, desde, sitios);
  let comparadas = 0, error = null;
  const debe = vencidos(v, ahoraMs);
  const hace = v.ultima ? ahoraMs - Date.parse(v.ultima) : Infinity;
  if (debe.length && hace > 55 * 60e3) {
    try {
      const medidas = await pedirMedidas(debe);
      comparadas = liquidar(v, medidas, ahoraMs, dueno);
      v.ultima = ahoraISO;
    } catch (e) { error = String(e?.message || e).slice(0, 80); }
  }
  if (comparadas || antes !== JSON.stringify([v.pend.length, v.vistos.length]) || !dato) await guardarJSON(RUTA, v);
  return { pendientes: v.pend.length, comparadas, error, regla: v.stats.regla.n };
}
