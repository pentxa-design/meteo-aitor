/* Intermediario hacia las teselas de Open-Meteo, en Vercel.

   Es solo el CAMINO DE RESERVA: desde el 24-08-2026 la app pide las
   teselas DIRECTAS al origen S3 de Open-Meteo y solo usa esto si esa red
   no llega a ese host (pasa en algunas redes móviles). Antes pasaba todo
   por aquí y en tres días se comió los 300 créditos de Netlify: el sitio
   quedó suspendido con Aitor de guardia.

   La ruta llega como parámetro `ruta` porque la reescritura de Vercel la
   mete ahí; con carpeta comodín daba 404.

   NO es un envoltorio de netlify/functions/omtiles.js como los otros
   siete de api/: es otra implementación, y es la que corre de verdad.
   Por eso el TTL de caché tiene que ponerse AQUÍ (revisión del
   04-09-2026, §5): hasta el 05-09-2026 iba a mano con max-age=60|300 y
   el CDN guardaba los .om 5 min en vez de un día. Medido a las 03:52 UTC
   en la app publicada: latest.json salía con `cache-control: public,
   max-age=60` y sin x-origen, aunque el fichero de netlify/ ya llevaba
   la puerta. */

import { cabeceras } from '../lib/cabeceras.mjs';

/* Host cambiado el 04-09-2026: map-tiles.open-meteo.com dejó de existir
   (NXDOMAIN). El origen S3 es el que usa la librería oficial. Ver la
   nota larga en maps.js, junto a TILES_DIRECTO. */
const BASE = 'https://openmeteo.s3.amazonaws.com/data_spatial';

export const config = { runtime: 'edge' };

export default async (request) => {
  const url = new URL(request.url);
  const ruta = url.searchParams.get('ruta');
  if (!ruta || ruta.includes('..')) return new Response('ruta no válida', { status: 400 });

  // Todo lo demás que venga en la consulta se reenvía a Open-Meteo.
  const resto = new URLSearchParams(url.search);
  resto.delete('ruta');
  const cola = resto.toString();

  const cab = { accept: '*/*' };
  const range = request.headers.get('range');
  if (range) cab.range = range;

  try {
    /* ── EL HEAD SE REENVÍA COMO HEAD ──────────────────────────────────────
       La librería del mapa abre cada .om con un HEAD y exige el
       Content-Length (el tamaño del fichero, para leer por rangos). Hasta
       el 14-09-2026 aquí todo era GET: para contestar un HEAD se bajaba el
       fichero ENTERO de S3 y encima la respuesta salía sin Content-Length
       (el borde la trocea). Resultado medido en su iMac: «OmHttpBackendError:
       Content-Length header missing», 24 veces en dos cambios de capa, con
       reintentos de 5 s; 12-16 s por capa. */
    const esHead = request.method === 'HEAD';
    const r = await fetch(`${BASE}/${ruta}${cola ? '?' + cola : ''}`, { method: esHead ? 'HEAD' : 'GET', headers: cab });
    const salida = new Headers();
    /* EL TAMAÑO VA EN UNA CABECERA PROPIA. El borde de Vercel NUNCA deja
       pasar Content-Length (medido el 14-09-2026: ni con el cuerpo leído
       entero), y pasar esto a Node metería todas las teselas en la cuota de
       CPU de 4 h. Así que el tamaño que S3 da en Content-Length se copia en
       `x-content-length`, y nuestra copia de la librería (vendor/) lo acepta
       como respaldo al abrir cada .om. */
    const tam = r.headers.get('content-length');
    if (tam) salida.set('x-content-length', tam);
    for (const h of ['content-type','content-length','content-range',
                     'accept-ranges','etag','last-modified']) {
      const v = r.headers.get(h);
      if (v) salida.set(h, v);
    }
    const esMeta = ruta.endsWith('.json');
    if (!salida.has('content-type'))
      salida.set('content-type', esMeta ? 'application/json' : 'application/octet-stream');
    salida.set('access-control-expose-headers',
      'Content-Range, Content-Length, X-Content-Length, ETag, Accept-Ranges');
    // latest.json cambia en cada pasada del modelo: poca caché. Los .om
    // son inmutables dentro de una pasada: caché fuerte en el CDN. Mismos
    // números que netlify/functions/omtiles.js. El content-type ya está
    // puesto arriba (`tipo: null` lo deja); el CORS lo pone la puerta. Con
    // error, no-store: un 5xx no se queda pegado.
    const comun = { tipo: null, origen: 'open-meteo-tiles' };
    /* ── LOS RANGOS NO SE GUARDAN EN EL CDN Y LLEVAN CONTENT-LENGTH ────────
       Medido el 14-09-2026 a las 00:40 desde su iMac, con el intermediario
       elegido por ser más rápido: el lector .om de la librería del mapa
       pide trozos con `Range`, el CDN de Vercel le servía una copia ENTERA
       guardada (200, sin Content-Range) y troceada (sin Content-Length), y
       la librería la rechaza —«OmHttpBackendError: Content-Length header
       missing», 24 veces en dos cambios de capa— y reintenta con esperas
       de 0,5, 2 y 4,5 s. Eso eran los 12-16 s por capa.
       Ahora: con `Range`, el trozo se lee entero aquí (son cientos de KB) para
       que salga con su Content-Length exacto, el CDN no lo guarda (un 206 no
       se cachea y una copia entera rompería los rangos siguientes) y `Vary:
       Range` por si acaso. Sin `Range`, como antes. */
    if (esHead) {
      // Sin cuerpo, con el tamaño y sin CDN: una copia guardada sin tamaño rompería la apertura.
      for (const [k, v] of Object.entries(cabeceras(300, { navegador: 300, cdn: false, ...comun }))) salida.set(k, v);
      return new Response(null, { status: r.status, headers: salida });
    }
    if (range && (r.ok || r.status === 206)) {
      const cuerpo = await r.arrayBuffer();
      salida.set('content-length', String(cuerpo.byteLength));
      for (const [k, v] of Object.entries(cabeceras(300, { navegador: 300, cdn: false, ...comun }))) salida.set(k, v);
      salida.set('vary', 'Range');
      return new Response(cuerpo, { status: r.status, headers: salida });
    }
    const cache = !(r.ok || r.status === 206) ? cabeceras(0, comun)
      : esMeta ? cabeceras(120, { navegador: 60, revalidar: 600, ...comun })
               : cabeceras(86400, { navegador: 300, revalidar: 604800, ...comun });
    for (const [k, v] of Object.entries(cache)) salida.set(k, v);
    if (esMeta && r.ok) {
      /* El catálogo también sale con Content-Length: leído entero (5 KB). */
      const cuerpo = await r.arrayBuffer();
      salida.set('content-length', String(cuerpo.byteLength));
      return new Response(cuerpo, { status: r.status, headers: salida });
    }
    return new Response(r.body, { status: r.status, headers: salida });
  } catch (e) {
    return new Response(`no se ha podido llegar a Open-Meteo: ${e.message}`, { status: 502 });
  }
};
