/* ═══════════════════════════════════════════════════════════════════
   LOS PLUVIÓMETROS DE METEOCAT, PARA EL REGISTRO DE ACIERTOS
   ───────────────────────────────────────────────────────────────────
   Para qué (TRASPASO §64, 02-10-2026): tras el temporal del este, suyo
   «yo quiero que mi app también aprenda y acierte previsiones». El
   registro de aciertos (lib/verificacion.mjs) compara lo que dijo cada
   modelo con lo que MIDIÓ una estación; en los puntos de contraste de
   Cataluña (Tarragona, Barcelona, Girona) la XEMA del Servei
   Meteorològic de Catalunya tiene pluviómetros más cerca que AEMET. Él
   pidió la clave (plan gratuito, uso personal) y la puso en Vercel el
   05-10. La buena es METEOCAT_KEY2: la primera, METEOCAT_KEY, se guardó con
   un «_» de más al pegarla (41 caracteres) y Meteocat la rechaza. Nunca en
   el código.

   EL GASTO, que es lo primero («ojo con el gasto»):
     · XEMA: 750 consultas al mes. UNA consulta trae la lluvia de TODAS
       las estaciones de un día (variable 35, precipitación semihoraria).
     · Los días cerrados se guardan en el almacén y no se vuelven a pedir.
     · El día en curso, como mucho una vez cada 110 minutos.
     · La lista de estaciones, una vez al mes.
     · Tope propio de 600 consultas al mes: pasado, contesta «sin cupo» y
       el registro se queda con AEMET.
   La XDDE (rayos) NO se usa aquí: con 250 consultas al mes y una por hora
   de datos no da para seguir el día entero.

   Va como librería dentro del vigilante (el plan Hobby de Vercel tiene un
   tope de 12 funciones y están todas): `lluviaMeteocat(puntos, dias)`
   → [ { estacion, km, horas: { 'YYYY-MM-DDTHH' (UTC): mm } } | null ]
   Fuente: © Servei Meteorològic de Catalunya (se cita en lo que lo use).
   ═══════════════════════════════════════════════════════════════════ */
import { leerJSON, guardarJSON } from './almacen.mjs';

const API = 'https://api.meteo.cat';
const VAR_LLUVIA = 35;            // Precipitació (mm), semihorària
const TOPE_MES = 600;             // de las 750 del plan, el resto de margen
const RADIO_KM = 10;
const CAJA_CAT = { lat0: 40.4, lat1: 42.95, lon0: 0.1, lon1: 3.4 };
export const enCataluna = p => p.lat >= CAJA_CAT.lat0 && p.lat <= CAJA_CAT.lat1 && p.lon >= CAJA_CAT.lon0 && p.lon <= CAJA_CAT.lon1;

const km = (a, b) => {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Una consulta a la API, contada. Sin clave o sin cupo, se DICE. */
async function pedir(ruta, cuenta) {
  const clave = (process.env.METEOCAT_KEY2 || process.env.METEOCAT_KEY);
  if (!clave) throw new Error('falta METEOCAT_KEY en Vercel');
  const mes = new Date().toISOString().slice(0, 7);
  if (cuenta.mes !== mes) { cuenta.mes = mes; cuenta.n = 0; }
  if (cuenta.n >= TOPE_MES) throw new Error(`sin cupo de Meteocat este mes (${cuenta.n} de ${TOPE_MES})`);
  cuenta.n++;
  const r = await fetch(`${API}${ruta}`, { headers: { 'x-api-key': clave }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`Meteocat contesta ${r.status} a ${ruta.split('?')[0]}: ${(await r.text().catch(() => '')).slice(0, 120)}`);
  return r.json();
}

/** La lista de estaciones con pluviómetro, guardada un mes. */
async function estaciones(cuenta) {
  const { dato } = await leerJSON('meteocat/estaciones.json', null);
  if (dato?.t && Date.now() - dato.t < 30 * 864e5 && dato.lista?.length) return dato.lista;
  const j = await pedir(`/xema/v1/estacions/metadades?estat=ope&data=${new Date().toISOString().slice(0, 10)}Z`, cuenta);   // «estat» y «data» van juntos o nada
  const lista = (Array.isArray(j) ? j : []).map(e => ({ c: e.codi, n: e.nom, lat: e.coordenades?.latitud, lon: e.coordenades?.longitud }))
    .filter(e => Number.isFinite(e.lat) && Number.isFinite(e.lon));
  await guardarJSON('meteocat/estaciones.json', { t: Date.now(), lista });
  return lista;
}

/** La lluvia de todas las estaciones en un día (UTC), sumada por horas. */
async function lluviaDelDia(dia, cuenta) {
  const ruta = `meteocat/lluvia-${dia}.json`;
  const { dato } = await leerJSON(ruta, null);
  const hoy = new Date().toISOString().slice(0, 10);
  const cerrado = dia < hoy;
  if (dato && (dato.cerrado || Date.now() - dato.t < 110 * 60e3)) return dato.est;
  const [Y, M, D] = dia.split('-');
  const j = await pedir(`/xema/v1/variables/mesurades/${VAR_LLUVIA}/${Y}/${M}/${D}`, cuenta);
  const est = {};
  for (const e of (Array.isArray(j) ? j : [])) {
    const horas = {};
    for (const v of (e.variables || []).flatMap(x => x.lectures || [])) {
      if (v.valor == null || (v.estat && !['V', ' ', ''].includes(v.estat))) continue;
      const h = String(v.data).slice(0, 13);
      horas[h] = Math.round(((horas[h] || 0) + v.valor) * 10) / 10;
    }
    if (Object.keys(horas).length) est[e.codi] = horas;
  }
  await guardarJSON(ruta, { t: Date.now(), cerrado, est });
  return est;
}

/** La lluvia medida por la XEMA junto a cada punto de Cataluña (null fuera
 *  de Cataluña o sin pluviómetro a menos de RADIO_KM). Si falla, lanza: el
 *  que llama se queda con AEMET y lo dice. */
/** Una sola lectura que SEGURO entra en el plan XEMA (la última lluvia de una
 *  estación de Barcelona), para saber si la clave vale. Gasta 1 consulta. */
export async function pruebaXema() {
  const clave = (process.env.METEOCAT_KEY2 || process.env.METEOCAT_KEY);
  if (!clave) return { error: 'falta METEOCAT_KEY en Vercel' };
  const r = await fetch(`${API}/xema/v1/variables/mesurades/${VAR_LLUVIA}/ultimes?codiEstacio=X4`, { headers: { 'x-api-key': clave }, signal: AbortSignal.timeout(12000) });
  const t = await r.text();
  return { estado: r.status, largoClave: clave.length, respuesta: t.slice(0, 300) };
}

/** El consumo del plan según Meteocat (la operación de cuotas no gasta XEMA). */
export async function cuotaMeteocat() {
  const clave = (process.env.METEOCAT_KEY2 || process.env.METEOCAT_KEY);
  if (!clave) return { error: 'falta METEOCAT_KEY en Vercel' };
  const r = await fetch(`${API}/quotes/v1/consum-actual`, { headers: { 'x-api-key': clave }, signal: AbortSignal.timeout(12000) });
  const t = await r.text();
  if (!r.ok) return { error: `Meteocat contesta ${r.status} a las cuotas: ${t.slice(0, 120)}`, largoClave: clave.length };
  try { const j = JSON.parse(t); return { plans: (j.plans || []).map(x => ({ nom: x.nom, max: x.maxConsultes, restan: x.consultesRestants })) }; }
  catch { return { error: 'respuesta de cuotas ilegible' }; }
}

export async function lluviaMeteocat(puntos, dias) {
  if (!puntos.some(enCataluna)) return puntos.map(() => null);
  const { dato: cuenta0 } = await leerJSON('meteocat/cuenta.json', { mes: null, n: 0 });
  const cuenta = { ...cuenta0 }, antes = cuenta.n;
  try {
    const lista = await estaciones(cuenta);
    const porDia = {};
    for (const d of dias) porDia[d] = await lluviaDelDia(d, cuenta);
    return puntos.map(p => {
      if (!enCataluna(p)) return null;
      const cerca = lista.map(e => ({ ...e, km: km(p, e) })).filter(e => e.km <= RADIO_KM).sort((a, b) => a.km - b.km);
      for (const e of cerca) {
        const horas = Object.assign({}, ...dias.map(d => porDia[d]?.[e.c] || {}));
        if (Object.keys(horas).length) return { estacion: e.n, codi: e.c, km: Math.round(e.km * 10) / 10, horas };
      }
      return null;
    });
  } finally {
    if (cuenta.n !== antes) await guardarJSON('meteocat/cuenta.json', cuenta).catch(() => {});
  }
}
