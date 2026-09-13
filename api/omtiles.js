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
    const r = await fetch(`${BASE}/${ruta}${cola ? '?' + cola : ''}`, { headers: cab });
    const salida = new Headers();
    for (const h of ['content-type','content-length','content-range',
                     'accept-ranges','etag','last-modified']) {
      const v = r.headers.get(h);
      if (v) salida.set(h, v);
    }
    const esMeta = ruta.endsWith('.json');
    if (!salida.has('content-type'))
      salida.set('content-type', esMeta ? 'application/json' : 'application/octet-stream');
    salida.set('access-control-expose-headers',
      'Content-Range, Content-Length, ETag, Accept-Ranges');
    // latest.json cambia en cada pasada del modelo: poca caché. Los .om
    // son inmutables dentro de una pasada: caché fuerte en el CDN. Mismos
    // números que netlify/functions/omtiles.js. El content-type ya está
    // puesto arriba (`tipo: null` lo deja); el CORS lo pone la puerta. Con
    // error, no-store: un 5xx no se queda pegado.
    const comun = { tipo: null, origen: 'open-meteo-tiles' };
    const cache = !(r.ok || r.status === 206) ? cabeceras(0, comun)
      : esMeta ? cabeceras(120, { navegador: 60, revalidar: 600, ...comun })
               : cabeceras(86400, { navegador: 300, revalidar: 604800, ...comun });
    for (const [k, v] of Object.entries(cache)) salida.set(k, v);
    return new Response(r.body, { status: r.status, headers: salida });
  } catch (e) {
    return new Response(`no se ha podido llegar a Open-Meteo: ${e.message}`, { status: 502 });
  }
};
