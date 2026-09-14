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

/** Tope de un bloque pedido por URL: la librería pide 256 KB; 8 MB es
 *  «alguien se ha equivocado», no un bloque. */
const TOPE_BLOQUE = 8 * 1024 * 1024;

/** Un bloque (`?rango=a-b`) o el tamaño del fichero (`?cabecera=1`),
 *  contestados con 200 y caché de un día en el CDN. Ver la nota de
 *  abajo, en el manejador. */
async function bloquePorUrl(ruta, cola, rango, soloCabecera) {
  const comun = { tipo: null, origen: 'open-meteo-tiles' };
  const destino = `${BASE}/${ruta}${cola ? '?' + cola : ''}`;
  const salida = new Headers();
  salida.set('access-control-expose-headers',
    'Content-Range, Content-Length, X-Content-Length, X-Rango, ETag, Accept-Ranges');
  const pon = (h) => { for (const [k, v] of Object.entries(h)) salida.set(k, v); };
  // Con error, no-store: un 5xx no se queda un día pegado en el CDN.
  const fallo = (estado, texto) => {
    pon(cabeceras(0, { ...comun, tipo: 'text/plain; charset=utf-8' }));
    return new Response(texto, { status: estado, headers: salida });
  };
  try {
    if (soloCabecera) {
      const r = await fetch(destino, { method: 'HEAD', headers: { accept: '*/*' } });
      const tam = r.headers.get('content-length');
      if (!r.ok) return fallo(r.status === 404 ? 404 : 502, `Open-Meteo contesta ${r.status}`);
      if (!tam) return fallo(502, 'Open-Meteo no dice el tamaño del fichero');
      salida.set('x-content-length', tam);
      for (const h of ['etag', 'last-modified', 'accept-ranges']) {
        const v = r.headers.get(h);
        if (v) salida.set(h, v);
      }
      pon(cabeceras(86400, { navegador: 86400, revalidar: 604800, ...comun, tipo: 'text/plain; charset=utf-8' }));
      // El cuerpo es el tamaño en texto: así un `curl` lo enseña.
      return new Response(tam, { status: 200, headers: salida });
    }
    const m = /^(\d+)-(\d+)$/.exec(rango || '');
    if (!m) return fallo(400, 'rango no válido');
    const a = Number(m[1]), b = Number(m[2]);
    if (!(b >= a) || b - a + 1 > TOPE_BLOQUE) return fallo(400, 'rango no válido');
    const r = await fetch(destino, { headers: { accept: '*/*', range: `bytes=${a}-${b}` } });
    if (r.status !== 206) {
      /* Un 200 aquí sería el fichero ENTERO (40 MB) guardado como si fuera
         el bloque: ni se lee ni se guarda. */
      return fallo(r.status === 404 || r.status === 416 ? r.status : 502,
                   `Open-Meteo contesta ${r.status} al rango ${a}-${b}`);
    }
    const cuerpo = await r.arrayBuffer();
    salida.set('content-length', String(cuerpo.byteLength));
    salida.set('x-content-length', String(cuerpo.byteLength));
    salida.set('x-rango', r.headers.get('content-range') || `bytes ${a}-${b}`);
    for (const h of ['etag', 'last-modified']) {
      const v = r.headers.get(h);
      if (v) salida.set(h, v);
    }
    salida.set('content-type', 'application/octet-stream');
    pon(cabeceras(86400, { navegador: 86400, revalidar: 604800, ...comun }));
    return new Response(cuerpo, { status: 200, headers: salida });
  } catch (e) {
    return fallo(502, `no se ha podido llegar a Open-Meteo: ${e.message}`);
  }
}

export default async (request) => {
  const url = new URL(request.url);
  const ruta = url.searchParams.get('ruta');
  if (!ruta || ruta.includes('..')) return new Response('ruta no válida', { status: 400 });

  // Todo lo demás que venga en la consulta se reenvía a Open-Meteo.
  const resto = new URLSearchParams(url.search);
  resto.delete('ruta');
  resto.delete('rango'); resto.delete('cabecera');   // son nuestros, no van a S3
  const cola = resto.toString();

  /* ── EL BLOQUE CON SU RANGO EN LA URL, PARA QUE EL CDN LO GUARDE ────────
     Medido el 14-09-2026 por la noche desde el portátil, en la app
     publicada, capa ICON-EU: 37 peticiones para pintar UNA capa, 24 de
     ellas trozos de 256 KB con `Range`, cada uno 0,5-2,6 s, y TODOS
     `x-vercel-cache: MISS` (el CDN no guarda un 206 y no distingue dos
     peticiones por su cabecera Range). Al S3 de Open-Meteo directo, desde
     Bermeo, un trozo de 256 KB son 5,2 s. Y los ficheros son de 32 MB
     (ICON-EU) y 44 MB (ECMWF 25 km) por hora: de ahí los «23 s cargando».

     Los trozos que pide la librería son SIEMPRE los mismos: bloques
     alineados de 256 KB (BLOQUE_OM) sobre un fichero que no cambia dentro
     de su pasada (la pasada va en la ruta: `…/1500Z/…`). O sea, son
     cacheables por naturaleza; lo único que lo impedía era pedirlos con
     cabecera en vez de con URL. maps.js los pide ahora como
     `…/fichero.om?rango=0-262143` y la cabecera del fichero (el HEAD que
     abre cada .om) como `…/fichero.om?cabecera=1`. Aquí se traducen al
     Range de S3, se contestan con 200 (un 206 el CDN no lo guarda) y con
     un día de CDN. Primer usuario de cada hora: igual que antes. Todos los
     demás toques a ese bloque, desde cualquier móvil: el CDN de París.
     El camino de antes (Range de verdad, HEAD de verdad) se queda tal
     cual para quien no pase por maps.js. */
  const rango = url.searchParams.get('rango');
  const soloCabecera = url.searchParams.get('cabecera') === '1';
  if (rango !== null || soloCabecera) return bloquePorUrl(ruta, cola, rango, soloCabecera);

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
