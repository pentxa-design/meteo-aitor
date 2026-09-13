/* ═══════════════════════════════════════════════════════════════════
   Intermediario hacia las teselas de Open-Meteo (origen S3)
   ───────────────────────────────────────────────────────────────────
   Por qué existe: la cartografía —el catálogo del modelo `latest.json` y
   los ficheros de datos `.om`— se pedía DIRECTA al host de Open-Meteo
   desde el navegador. En algunas redes móviles ese host concreto no se
   alcanza: el mapa se queda en «leyendo modelo…» para siempre, AUNQUE la
   previsión —que ya va por /om— cargue sin problema. Se comprobó que el
   servidor está sano; lo que fallaba era llegar a él desde el teléfono.

   Ahora la petición sale desde Netlify (mismo origen que la app) y el CDN
   la cachea. NO transforma nada: reenvía cuerpo, código de estado y las
   cabeceras que importan, INCLUIDO el soporte de Range (peticiones por
   tramos de bytes) que usan los ficheros .om para no bajarse enteros.

   Igual que el resto de la app: si Open-Meteo da un error, se devuelve
   ese mismo error. No se inventa nada.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

/* Host cambiado el 04-09-2026: map-tiles.open-meteo.com dejó de existir
   (NXDOMAIN). El origen S3 es el que usa la librería oficial. Ver la
   nota larga en maps.js, junto a TILES_DIRECTO. */
const BASE = 'https://openmeteo.s3.amazonaws.com/data_spatial';

export default async (request) => {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/^\/omtiles\//, '');
  if (!ruta || ruta.includes('..')) {
    return new Response('ruta no válida', { status: 400 });
  }
  const destino = `${BASE}/${ruta}${url.search}`;

  const cab = { accept: '*/*' };
  const range = request.headers.get('range');
  if (range) cab.range = range;

  try {
    const r = await fetch(destino, { headers: cab });
    const buf = await r.arrayBuffer();
    const esMeta = ruta.endsWith('.json');

    const salida = new Headers();
    // Cabeceras que hay que conservar para que el lector .om funcione
    // (Range → 206 + Content-Range) y para no re-descargar de más.
    for (const h of ['content-type', 'content-length', 'content-range',
                     'accept-ranges', 'etag', 'last-modified']) {
      const v = r.headers.get(h);
      if (v) salida.set(h, v);
    }
    if (!salida.has('content-type')) {
      salida.set('content-type', esMeta ? 'application/json' : 'application/octet-stream');
    }
    salida.set('access-control-expose-headers',
      'Content-Range, Content-Length, ETag, Accept-Ranges');

    // latest.json cambia en cada pasada del modelo: poca caché. Los .om
    // son inmutables dentro de una pasada: caché fuerte en el CDN. El
    // content-type ya está puesto arriba: `tipo: null` lo deja como está.
    // OJO: en Vercel este fichero NO corre. vercel.json reescribe
    // /omtiles/(.*) a /api/omtiles?ruta=$1, y api/omtiles.js es otra
    // implementación, no un envoltorio de esta (medido el 05-09-2026 a
    // las 03:52 UTC: latest.json salía con max-age=60 y sin x-origen). El
    // TTL que vale en producción es el de api/omtiles.js; aquí va la misma
    // puerta con los mismos números para que las dos digan lo mismo.
    const comun = { tipo: null, origen: 'open-meteo-tiles' };
    const cache = !(r.ok || r.status === 206) ? cabeceras(0, comun)
      : esMeta ? cabeceras(120, { navegador: 60, revalidar: 600, ...comun })
               : cabeceras(86400, { navegador: 300, revalidar: 604800, ...comun });
    for (const [k, v] of Object.entries(cache)) salida.set(k, v);

    return new Response(buf, { status: r.status, headers: salida });
  } catch (e) {
    return new Response(JSON.stringify({ error: true, reason: String(e.message || e) }), {
      status: 502,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }
};

export const config = { path: '/omtiles/*' };
