/* ═══════════════════════════════════════════════════════════════════
   SUS AJUSTES, LOS MISMOS EN TODOS SUS APARATOS
   ───────────────────────────────────────────────────────────────────
   Suyo, 30-08-2026 a las 19:50, con el Mac y el móvil delante diciendo
   cosas distintas:

     *«PERO YO QUIERO TENER LO MISMO QUE EN EL MAC. SI SE TOCA ALGO QUE
       SE VEAN IGUAL. LA MAYORÍA DE LAS VECES TIRO DEL MÓVIL, SOCIO»*

   Y tiene razón. Ese día el Mac llevaba el Automático y el móvil ECMWF
   —cada uno con su elección guardada en su `localStorage`— y los dos
   titulares no coincidían. Es el MISMO fallo que ya se arregló el 26-08
   con los emplazamientos: lo que él configura no puede vivir en un solo
   aparato. Si tira del móvil, lo que toque en el Mac tiene que estar
   ahí, y al revés.

   QUÉ SE GUARDA: el modelo, las unidades de viento, la altura de
   trabajo, los umbrales de decisión y el tamaño de letra. Todo lo que
   él elige a mano. El tipo de trabajo de cada sitio NO va aquí: viaja
   con su emplazamiento por `/api/torres`, que es donde vive.

   QUÉ **NO** SE GUARDA, y es a propósito:
     · `place` — el sitio que está mirando. Si sincronizara, abrir Boiro
       en el Mac le cambiaría el móvil mientras conduce. Cada aparato
       mira donde quiera.
     · `visto`, `view` — estado de la pantalla, no decisiones.
     · Los emplazamientos, que ya tienen su `/api/torres`.

   LA REGLA QUE MANDA AQUÍ, y es la CONTRARIA a la de las torres:
   **manda el último cambio.** En las torres nunca se pierde una, porque
   perderla significa no mirar ese sitio antes de mandar a alguien; aquí,
   en cambio, cambiar de modelo es una decisión que PISA a propósito la
   anterior. Cada ajuste viaja con la hora en que se tocó, y gana el más
   nuevo — campo por campo, no el bloque entero: así, tocar el modelo en
   el móvil no le devuelve unos umbrales viejos del Mac.

   No lleva clave, igual que `/api/torres`: son preferencias de una app
   del tiempo, no hay nada que proteger. Y si el servidor falla, la app
   sigue con lo que tenga guardado en el aparato — nunca se queda sin.
   ═══════════════════════════════════════════════════════════════════ */

import { leerJSON, guardarJSON } from '../lib/almacen.mjs';

const CAJON = 'avisos/ajustes.json';

/* ── UN CAJÓN APARTE PARA LAS PRUEBAS ────────────────────────────────
   Puesto el 30-08-2026 después de metérsela DOS VECES la misma noche:
   una prueba de dos aparatos escribió en el almacén de verdad y sus dos
   cacharros adoptaron valores de laboratorio — una de ellas «kt», y él
   lleva desde el 27-08 diciendo *«kilómetros hora siempre, memoriza»*.

   Las dos veces se limpió en cuanto se vio. Pero limpiar después no es
   una solución: es acordarse. Con `prueba: true` la petición va a otro
   cajón y **sus ajustes no se pueden tocar ni queriendo**.            */
const CAJON_PRUEBA = 'avisos/ajustes-prueba.json';
const cajon = req => (req?.prueba === true ? CAJON_PRUEBA : CAJON);

/* Lo que se sincroniza, con su forma. Un ajuste que no esté aquí NO
   viaja: así un aparato con una versión vieja no puede meter basura. */
const CAMPOS = {
  model:  v => typeof v === 'string' && v.length < 30,
  wunit:  v => ['kmh', 'kt', 'ms'].includes(v),
  hgt:    v => Number.isFinite(+v) && +v >= 0 && +v <= 200,
  zoom:   v => [1, 1.15, 1.3, 1.5].includes(+v),   // el tamaño de letra
  /* La estación que es portada de Mis estaciones: su clave lat,lon
     (20-09-2026). Viaja como el modelo o los listones. */
  portadaEstacion: v => typeof v === 'string' && /^-?\d+\.\d{3},-?\d+\.\d{3}$/.test(v),
  thr:    v => v && typeof v === 'object' && !Array.isArray(v)
               && Object.keys(v).length <= 20
               && Object.values(v).every(x => Number.isFinite(+x)),
};

/* Se lee y se guarda EXACTAMENTE como la lista de torres (torres.mjs):
   mismo almacén, mismo `private`, misma lectura por `stream`. El 30-08
   el primer borrador de esto usaba una firma de `get` que no existe
   (`r.url` + fetch) y guardaba en público — cazado contrastando con la
   función hermana antes de publicar. */
/* Por la única puerta (lib/almacen.mjs): «no pude leer» no es «no hay
   nada guardado». Con el almacén suspendido esto devolvía `{}` con un
   HTTP 200 y la app podía creerse que sus ajustes están vacíos. */
async function leer(caja = CAJON) {
  const { dato } = await leerJSON(caja, {});
  return (dato && typeof dato === 'object' && !Array.isArray(dato)) ? dato : {};
}

const guardar = (d, caja = CAJON) => guardarJSON(caja, d);

/** Deja solo lo que existe, es válido y trae hora. Cada campo va como
 *  `{ v, t }`: el valor y el instante en que él lo tocó. */
function limpiar(entra) {
  const out = {};
  for (const [k, val] of Object.entries(entra || {})) {
    if (!CAMPOS[k]) continue;
    const v = val?.v, t = Number(val?.t);
    if (v === undefined || v === null) continue;
    if (!CAMPOS[k](v)) continue;
    if (!Number.isFinite(t) || t <= 0) continue;
    /* Una hora del futuro es un reloj mal puesto, no un cambio nuevo:
       se acepta el valor pero se le pone la hora de ahora, para que no
       se quede pegado ganando siempre. */
    out[k] = { v, t: Math.min(t, Date.now()) };
  }
  return out;
}

/** Junta campo por campo: gana el más reciente. Nunca el bloque entero,
 *  para que tocar el modelo en el móvil no devuelva umbrales viejos. */
function juntar(guardado, entra) {
  const out = { ...guardado };
  for (const [k, val] of Object.entries(entra)) {
    const yo = guardado[k];
    if (!yo || Number(val.t) >= Number(yo.t)) out[k] = val;
  }
  return out;
}

/* ═══ Y DE PASO, LO QUE AITOR DA POR HECHO EN CENTRO OPERATIVO ═══════
   Suyo, 21-09-2026, señalando dos instalaciones en el Mac: «Cristo 1
   Bilbao, Jundiz Sur están instaladas, le di esta mañana desde el móvil
   y aquí no se han quitado» · «si le doy a completadas en el móvil se
   han de quitar en todas partes» · «al igual si las quito desde el PC».

   Centro Operativo guarda todo en el navegador de cada aparato y no sube
   nada: por eso el móvil y el Mac no se enteraban el uno del otro.

   VIVE AQUÍ DENTRO Y NO EN SU PROPIA FUNCIÓN porque Vercel solo deja 12
   en el plan gratuito y ya están las 12 — hay una prueba que lo vigila y
   que cazó el intento («no se pasa del tope de funciones de Vercel: la
   próxima va dentro de una»). Este fichero era el sitio natural: ya hace
   exactamente esto, juntar el estado de dos aparatos quedándose con lo
   más reciente.

   Solo viaja la marca: qué trabajo, hecho o no, y cuándo. Nunca el
   trabajo entero — esos siguen viniendo del informe del correo. Así esto
   no puede estropear lo que llega cada mañana a las 06:00.

   Se casa por `clave`, no por `id`: el id lo genera cada aparato por su
   cuenta y sería distinto en el móvil y en el Mac.                    */
const CAJON_MARCAS = 'centro/marcas.json';
const TOPE_MARCAS = 4000;

/* El panel vive en otro dominio, así que hace falta abrirle la puerta.
   Se escribe la lista a mano en vez de poner `*`. */
const ORIGENES = [
  'https://centro-operativo-eulen.netlify.app',
  'http://localhost:8888',
];

function permiso(req, res) {
  const o = req.headers?.origin || '';
  if (ORIGENES.includes(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

async function marcas(req, res) {
  permiso(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    try {
      const { dato } = await leerJSON(CAJON_MARCAS, {});
      const m = dato || {};
      return res.status(200).json({ ok: true, marcas: m, total: Object.keys(m).length });
    } catch (e) {
      /* No poder leer NO es «no hay nada marcado». Si contestara {} el
         panel daría por reabierto todo lo que él cerró. */
      return res.status(503).json({ error: String(e?.message || e).slice(0, 120) });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'solo GET y POST' });

  try {
    let cuerpo = req.body;
    if (typeof cuerpo === 'string') { try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = {}; } }
    const entran = Array.isArray(cuerpo?.marcas) ? cuerpo.marcas : [];
    if (!entran.length) return res.status(400).json({ error: 'no viene ninguna marca' });

    const { dato } = await leerJSON(CAJON_MARCAS, {});
    const m = dato || {};
    let puestas = 0;

    for (const x of entran.slice(0, 200)) {
      const sec = String(x.sec ?? '').trim().slice(0, 40);
      const clave = String(x.clave ?? '').trim().slice(0, 160).toLowerCase();
      if (!sec || !clave) continue;
      const k = sec + '|' + clave;
      const cuando = String(x.cuando ?? '').trim().slice(0, 40) || new Date().toISOString();
      /* Gana la más reciente, venga del aparato que venga. */
      if (m[k] && String(m[k].cuando || '') > cuando) continue;
      m[k] = { hecho: !!x.hecho, cuando };
      puestas++;
    }
    if (!puestas) return res.status(400).json({ error: 'ninguna marca utilizable' });

    const ks = Object.keys(m);
    if (ks.length > TOPE_MARCAS) {
      ks.sort((a, b) => String(m[a].cuando).localeCompare(String(m[b].cuando)));
      for (const k of ks.slice(0, ks.length - TOPE_MARCAS)) delete m[k];
    }
    await guardarJSON(CAJON_MARCAS, m);
    return res.status(200).json({ ok: true, puestas, total: Object.keys(m).length });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e).slice(0, 120) });
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  /* Las marcas de Centro Operativo entran por aquí con ?que=marcas. */
  if (String(req.query?.que ?? '') === 'marcas') return marcas(req, res);

  if (req.method === 'GET') {
    const esPrueba = String(req.query?.prueba ?? '') === '1';
    try {
      const d = await leer(esPrueba ? CAJON_PRUEBA : CAJON);
      return res.status(200).json({ ok: true, ajustes: d, prueba: esPrueba || undefined });
    } catch (e) {
      /* Se DICE que no se ha podido leer, en vez de contestar «no hay
         ajustes» con un 200 (01-09-2026, almacén suspendido). */
      return res.status(500).json({ error: String(e?.message || e).slice(0, 120) });
    }
  }

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'solo GET y POST' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body ??= {};

  /* Reinicio con clave, como la purga del marcador: deja el almacén
     vacío. Se usa para limpiar tras una prueba (un valor de prueba que
     se quedara aquí lo adoptarían SUS dos aparatos) o si algún día se
     ensucia. Sin la clave no hay reinicio. */
  if (body.reiniciar === true) {
    /* El cajón de pruebas se vacía sin clave —no hay nada suyo dentro—;
       el de verdad, solo con ella. */
    if (body.prueba !== true
        && (req.headers['x-clave'] || '') !== (process.env.AVISOS_CLAVE || '¡')) {
      return res.status(403).json({ error: 'sin clave no se reinicia' });
    }
    try { await guardar({}, cajon(body)); } catch (e) {
      return res.status(200).json({ ok: false, guardado: false,
        error: String(e?.message || e).slice(0, 80) });
    }
    return res.status(200).json({ ok: true, reiniciado: true, ajustes: {} });
  }

  const entra = limpiar(body.ajustes);
  const caja = cajon(body);
  const guardado = await leer(caja);
  const final = juntar(guardado, entra);

  /* Si no cambia nada, no se escribe: guardar por guardar gasta y no
     aporta. Se devuelve igual lo que hay, que es lo que la app adopta. */
  const igual = JSON.stringify(final) === JSON.stringify(guardado);
  if (!igual) {
    try { await guardar(final, caja); }
    catch (e) {
      /* Si no se puede escribir se DICE, y se devuelve lo que hay: la
         app se queda con lo suyo y no cree que se ha guardado. */
      return res.status(200).json({ ok: false, guardado: false,
        error: String(e?.message || e).slice(0, 80), ajustes: guardado });
    }
  }
  return res.status(200).json({ ok: true, guardado: !igual, ajustes: final });
}
