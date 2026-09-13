/* ═══════════════════════════════════════════════════════════════════
   Satélite de EUMETSAT — nube OBSERVADA, no modelo
   ───────────────────────────────────────────────────────────────────
   El radar dice dónde está cayendo agua. El satélite enseña la nube
   ANTES de que llueva, que es lo que hace falta para ver una tormenta
   creciendo antes de que descargue.

   Fuente: EUMETView, el visor público de EUMETSAT. Es WMS abierto, sin
   clave, y sirve con `access-control-allow-origin: *`, así que las
   imágenes las puede pedir el navegador directamente. Esta función solo
   se encarga de UNA cosa, pero crítica:

   AVERIGUAR QUÉ HORAS EXISTEN DE VERDAD.

   ── LO QUE DECLARA EL CATÁLOGO, MEDIDO EL 05-09-2026 A LAS 03:20Z ──
   La cabecera de antes decía que «las horas se leen del catálogo y no
   se inventa ninguna», y el código las generaba con una resta. Las dos
   cosas a la vez no podían ser verdad, así que se midió:

   · GetCapabilities (282 KB) declara el tiempo de las tres capas como
     UN INTERVALO, no como una lista:
       msg_fes:ir108           2020-09-01T00:00:00.000Z/2026-09-05T03:00:00.000Z/PT15M
       msg_fes:rgb_convection  2020-09-01T00:00:00.000Z/2026-09-05T03:00:00.000Z/PT15M
       msg_fes:rgb_eview       2022-03-29T00:00:00.000Z/2026-09-05T02:45:00.000Z/PT15M
     con `default` igual al fin y `nearestValue="1"`. O sea que la resta
     «fin − k·paso» ES lo que el catálogo declara: no hay más lista que
     esa. La cabecera mentía en la forma, no el código en el fondo.

   · Pero el intervalo no garantiza que cada pasada exista. Pidiendo un
     GetMap de 64×64 por cada una de las 24 últimas de ir108 (6 h), TRES
     devolvieron el MISMO PNG que la anterior (22:30, 01:00 y 01:30 del
     04/05-09): esas pasadas no están y, por el nearestValue, el servidor
     sirve la vecina con la etiqueta cambiada. No sale vacía: sale la de
     15 min antes con otra hora encima. Dentro del intervalo, el fallo
     posible es ese, y es menor.

   · Lo que SÍ sale vacío es pedir más allá del fin: a +15 min el
     servidor devolvió la imagen del fin (mismo md5); a +1 h y a +3 h,
     un 502 con cuerpo vacío. Y una tesela que no llega se pinta como
     nada, y nada sobre un mapa se lee «aquí no hay nubes».

   Así que las guardas que hacen falta son las del BORDE, y son estas:
     1. el paso tiene que venir declarado (sin paso no se ofrece la capa);
     2. el fin no puede estar en el futuro: se recorta a la última pasada
        de la rejilla que ya ha pasado;
     3. la última hora ofrecida se COMPRUEBA con un GetMap pequeño antes
        de dársela al móvil; si no la sirve, se retira y se prueba la
        anterior. Si tampoco, la capa no se ofrece y se dice por qué.
   Y si un día EUMETSAT pasara a declarar una LISTA de instantes (el WMS
   lo permite: valores separados por comas), extraerTiempo() la devuelve
   tal cual y horasDe() usa las n últimas reales, sin aritmética.

   El catálogo son 282 KB, así que se lee aquí (en el servidor) y se
   cachea: el móvil solo recibe la lista de horas.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

const WMS  = 'https://view.eumetsat.int/geoserver/wms';
const CAPS = WMS + '?service=WMS&version=1.3.0&request=GetCapabilities';

// Las capas que se ofrecen, con su nombre en cristiano.
const CAPAS = {
  ir:         { wms: 'msg_fes:ir108',        nombre: 'Satélite infrarrojo' },
  convection: { wms: 'msg_fes:rgb_convection', nombre: 'Satélite tormentas' },
  visible:    { wms: 'msg_fes:rgb_eview',    nombre: 'Satélite visible' },
};

/* La comprobación de la última hora: un GetMap de 64×64 sobre la costa
   de Bizkaia (bbox en EPSG:3857, el mismo que se midió). Medido el
   05-09-2026: una pasada real ocupa 3.421-4.683 bytes a ese tamaño; un
   PNG de 64×64 del todo transparente ocupa 96. Por debajo de 500 bytes
   no es una imagen con nube. */
const BBOX_PRUEBA = '-400000,5300000,0,5600000';
const MIN_BYTES_IMAGEN = 500;
const ESPERA_PRUEBA_MS = 6000;

/** Convierte un periodo ISO 8601 (PT15M, PT1H, PT1H30M) a minutos. */
function minutosDe(periodo) {
  const m = String(periodo || '').match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 1440) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

/** Lee la dimensión de tiempo que el catálogo declara para una capa.
 *
 *  Devuelve lo que haya, sin inventar:
 *    · intervalo  → { inicio, fin, pasoMin }   ("inicio/fin/PT15M", lo
 *                   que EUMETSAT declara hoy; si hay varios intervalos
 *                   separados por comas se queda con el último, que es
 *                   el que llega más lejos)
 *    · lista      → { lista: [iso, iso, …] }   (instantes sueltos
 *                   separados por comas, ordenados)
 *    · null       → no declara la capa, o no declara tiempo, o el paso
 *                   no se entiende: la capa no se ofrece.              */
export function extraerTiempo(xml, capa) {
  const i = xml.indexOf(`<Name>${capa}</Name>`);
  if (i < 0) return null;
  const bloque = xml.slice(i, i + 4000);
  const m = bloque.match(/<Dimension name="time"[^>]*>([^<]+)</);
  if (!m) return null;
  const trozos = m[1].trim().split(',').map(s => s.trim()).filter(Boolean);
  if (!trozos.length) return null;

  const intervalos = trozos.filter(s => s.includes('/'));
  if (intervalos.length) {
    const partes = intervalos[intervalos.length - 1].split('/');
    if (partes.length < 3) return null;
    const inicio = new Date(partes[0]);
    const fin = new Date(partes[1]);
    const pasoMin = minutosDe(partes[2]);
    if (isNaN(inicio) || isNaN(fin) || !pasoMin || fin < inicio) return null;
    return { inicio: inicio.toISOString(), fin: fin.toISOString(), pasoMin };
  }

  const lista = trozos.map(s => new Date(s)).filter(d => !isNaN(d))
    .sort((a, b) => a - b).map(d => d.toISOString());
  return lista.length ? { lista } : null;
}

/** Las n últimas horas que se pueden ofrecer, de más antigua a más
 *  reciente y NUNCA posteriores a `tope` (por defecto, ahora).
 *
 *  Con lista: las n últimas de la lista que no pasen del tope.
 *  Con intervalo: se recorta el fin a la última pasada de la rejilla
 *  (inicio + k·paso) que no pase del tope, y de ahí hacia atrás sin
 *  bajar del inicio. La rejilla se ancla en el inicio declarado, no en
 *  el tope, para no ofrecer horas que no caen en la pasada.            */
export function horasDe(t, n, tope = Date.now()) {
  if (!t || !(n > 0)) return [];
  if (t.lista) {
    return t.lista.filter(h => new Date(h).getTime() <= tope).slice(-n);
  }
  const inicio = new Date(t.inicio).getTime();
  const fin = new Date(t.fin).getTime();
  const paso = t.pasoMin * 60000;
  if (!(paso > 0) || isNaN(inicio) || isNaN(fin)) return [];
  const kTope = Math.floor((tope - inicio) / paso);
  const kFin = Math.floor((fin - inicio) / paso);
  const kUltimo = Math.min(kFin, kTope);
  if (kUltimo < 0) return [];
  const horas = [];
  for (let k = Math.max(0, kUltimo - n + 1); k <= kUltimo; k++) {
    horas.push(new Date(inicio + k * paso).toISOString());
  }
  return horas;
}

/** ¿Sirve EUMETSAT una imagen con nube a esa hora?
 *    true  → sí (200, image/*, y más de MIN_BYTES_IMAGEN bytes)
 *    false → no la sirve (502, cuerpo vacío, XML de error, PNG en blanco)
 *    null  → no se ha podido comprobar (red, tiempo agotado): no se
 *            afirma nada en ninguno de los dos sentidos.               */
async function sirveImagen(capaWms, hora) {
  const q = new URLSearchParams({
    service: 'WMS', version: '1.1.1', request: 'GetMap',
    layers: capaWms, styles: '', format: 'image/png', transparent: 'true',
    srs: 'EPSG:3857', width: '64', height: '64', bbox: BBOX_PRUEBA, time: hora,
  });
  const ctl = new AbortController();
  const reloj = setTimeout(() => ctl.abort(), ESPERA_PRUEBA_MS);
  try {
    const r = await fetch(`${WMS}?${q}`, { signal: ctl.signal });
    if (!r.ok) return false;
    if (!/^image\//i.test(r.headers.get('content-type') || '')) return false;
    const cuerpo = await r.arrayBuffer();
    return cuerpo.byteLength >= MIN_BYTES_IMAGEN;
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

/** Una capa entera: sus horas, con la última comprobada. */
async function prepararCapa(clave, def, xml, n, ahora) {
  const t = extraerTiempo(xml, def.wms);
  if (!t) return { clave, motivo: 'el catálogo no la declara' };
  let tope = ahora;
  // Dos intentos: la última hora, y si no la sirven, la anterior.
  for (let intento = 0; intento < 2; intento++) {
    const horas = horasDe(t, n, tope);
    if (!horas.length) return { clave, motivo: 'el catálogo no da ninguna hora que ya haya pasado' };
    const ultima = horas[horas.length - 1];
    const sirve = await sirveImagen(def.wms, ultima);
    if (sirve !== false) {
      // Con lista no hay paso declarado: se dice el que hay entre las dos últimas.
      const pasoMin = t.pasoMin ?? (horas.length >= 2
        ? Math.round((new Date(horas[horas.length - 1]) - new Date(horas[horas.length - 2])) / 60000) : null);
      return { clave, capa: {
        wms: def.wms, nombre: def.nombre, pasoMin, horas,
        // true: la última hora se ha visto servida; null: no se pudo
        // comprobar y se ofrece igual, que el catálogo la declara.
        ultimaComprobada: sirve === true ? true : null,
      } };
    }
    tope = new Date(ultima).getTime() - 1;
  }
  return { clave, motivo: 'las dos últimas pasadas que declara el catálogo no se sirven' };
}

export default async (request) => {
  const p = new URL(request.url).searchParams;
  const n = Math.max(1, Math.min(24, Number(p.get('n')) || 12));

  try {
    const r = await fetch(CAPS, { headers: { accept: 'text/xml' } });
    if (!r.ok) return json({ error: true, reason: `EUMETSAT respondió ${r.status}` }, 502);
    const xml = await r.text();
    const ahora = Date.now();

    // Las tres capas a la vez: cada una lleva su GetMap de comprobación.
    const resultados = await Promise.all(
      Object.entries(CAPAS).map(([clave, def]) => prepararCapa(clave, def, xml, n, ahora)));

    const capas = {};
    const noOfrecidas = {};
    for (const x of resultados) {
      if (x.capa) capas[x.clave] = x.capa;
      else noOfrecidas[x.clave] = x.motivo;
    }

    if (!Object.keys(capas).length) {
      return json({ error: true, reason: 'EUMETSAT no sirve ninguna capa ahora mismo', noOfrecidas }, 502);
    }

    return json({
      fuente: 'EUMETSAT · EUMETView (Meteosat)',
      wms: WMS,
      consultado: new Date(ahora).toISOString(),
      capas,
      ...(Object.keys(noOfrecidas).length ? { noOfrecidas } : {}),
    }, 200);
  } catch (e) {
    return json({ error: true, reason: String(e.message || e) }, 502);
  }
};

function json(cuerpo, status) {
  const ok = status === 200;
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      // Publican cada 10-15 min: no tiene sentido releer el catálogo más.
      /* Vercel no lee la cabecera de caché de Netlify: la puerta de
         lib/cabeceras.mjs manda el TTL que sí entiende (revisión 04-09, §5). */
      ...cabeceras(ok ? 420 : 0, { navegador: 180, revalidar: 1800, origen: 'eumetsat-catalogo' }),
    },
  });
}

export const config = { path: '/satelite' };
