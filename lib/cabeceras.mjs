/* ═══════════════════════════════════════════════════════════════════
   LAS CABECERAS DE CACHÉ QUE ENTIENDE VERCEL
   ───────────────────────────────────────────────────────────────────
   Qué fallaba (revisión del 04-09-2026, §5): los ocho intermediarios de
   `netlify/functions/` mandaban su TTL de verdad en la cabecera
   `netlify-cdn-cache-control`, que solo entiende Netlify. La app corre
   en Vercel desde el 24-08-2026, y Vercel esa cabecera ni la lee: la
   reenvía al navegador tal cual y se queda con el `max-age` corto.

   MEDIDO el 05-09-2026 a las 03:19 UTC contra la app publicada:

     curl -sI /om?api=elev&latitude=43.4&longitude=-2.7
       cache-control: public, max-age=60
       netlify-cdn-cache-control: public, s-maxage=2592000, …   ← ignorada
       x-vercel-cache: MISS → HIT → HIT   con age 0 → 1 → 2

   O sea: la altitud del terreno, que no cambia nunca y estaba pensada
   para guardarse un mes, se guarda 60 s. Y las mareas, que llevaban
   `stale-if-error=86400` para no dejarle sin tabla cuando Euskalmet no
   contesta, no tenían ningún stale-if-error.

   Lo que dice la documentación de Vercel (docs/caching/cdn-cache y
   docs/caching/cache-control-headers, versión del 11-08-2026):

     · `CDN-Cache-Control` «always overrides Cache-Control headers» para
       el CDN de Vercel, y se devuelve al navegador (que la ignora: es
       una cabecera para CDN, RFC 9213).
     · `Vercel-CDN-Cache-Control` manda sobre las dos, pero el CDN se la
       come y NO llega al navegador.
     · Si solo va `Cache-Control`, «Vercel strips the s-maxage directive
       from the header before it's sent to the client».
     · `stale-if-error`: la página de cabeceras lo documenta y dice que
       «Vercel's proxy consumes stale-if-error for all requests»; la de
       la caché del CDN dice en «Limits» que «Vercel doesn't currently
       support using proxy-revalidate and stale-if-error for server-side
       caching». Se contradicen. Se manda igual: si no lo soporta, lo
       ignora y no hace daño; si lo soporta, salva la tabla de mareas.

   Por qué `CDN-Cache-Control` y no `Vercel-CDN-Cache-Control`: porque
   la primera SE VE desde fuera con un `curl -sI`, y aquí cada
   publicación se comprueba desde fuera. Con la segunda, la única señal
   sería el `x-vercel-cache: HIT` y el `age`.

   Es la única puerta: los intermediarios la importan y ninguno vuelve a
   escribir una cabecera de caché a mano. Ojo con las teselas: en Vercel
   `/omtiles/*` lo sirve `api/omtiles.js` (vercel.json lo reescribe a
   `/api/omtiles?ruta=`), que NO es un envoltorio de
   `netlify/functions/omtiles.js` sino otra implementación: las dos
   tienen que pasar por aquí, o el CDN guarda los .om 5 min en vez de un
   día (medido el 05-09-2026 a las 03:52 UTC: `latest.json` salía con
   `max-age=60` y sin `x-origen` aunque el fichero de netlify/ ya
   llevaba la puerta).

   No importa nada: corre en las Edge Functions de Vercel, que no
   tienen Node.
   ═══════════════════════════════════════════════════════════════════ */

const entero = (v, siNo) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : siNo;
};

/** Cabeceras de una respuesta cacheable en el CDN de Vercel.
 *
 *  @param {number} ttlSegundos  Cuánto guarda el CDN la respuesta
 *                               (`s-maxage`). Con 0 (o nada) → `no-store`:
 *                               un error no se queda pegado.
 *  @param {object} [opciones]
 *    navegador  max-age para el navegador (60 s si no se dice)
 *    revalidar  stale-while-revalidate: cuánto tiempo más sirve el CDN
 *               la copia vieja mientras pide otra por detrás (el doble
 *               del TTL si no se dice; 0 para no ponerlo, y entonces el
 *               CDN refresca en la propia petición cuando caduca)
 *    siError    stale-if-error: cuánto sirve la última copia buena si
 *               la fuente falla (nada si no se dice)
 *    tipo       content-type ('application/json; charset=utf-8' si no se
 *               dice; `null` para no ponerlo, cuando ya viene de fuera)
 *    cors       access-control-allow-origin: * (sí si no se dice)
 *    origen     valor de `x-origen`, para saber en pantalla de dónde
 *               salió el dato
 *  @returns {Record<string, string>}
 */
export function cabeceras(ttlSegundos, opciones = {}) {
  const ttl = entero(ttlSegundos, 0);
  const {
    navegador = 60,
    revalidar = ttl * 2,
    siError = 0,
    tipo = 'application/json; charset=utf-8',
    cors = true,
    origen = null,
  } = opciones;

  const h = {};
  if (tipo) h['content-type'] = tipo;
  if (cors) h['access-control-allow-origin'] = '*';

  if (ttl > 0) {
    h['cache-control'] = `public, max-age=${entero(navegador, 60)}`;
    let cdn = `public, s-maxage=${ttl}`;
    // Con revalidar: 0 NO se pone stale-while-revalidate. La lista de
    // tormentas del NHC iba solo con max-age=900 y a los 15 min se
    // refrescaba en la propia petición; con un swr el CDN la serviría
    // hasta 45 min vieja. Corrección del 05-09-2026: se conserva lo que
    // había en vez de cambiarlo sin decirlo.
    const swr = entero(revalidar, ttl * 2);
    if (swr > 0) cdn += `, stale-while-revalidate=${swr}`;
    const sie = entero(siError, 0);
    if (sie > 0) cdn += `, stale-if-error=${sie}`;
    h['cdn-cache-control'] = cdn;
  } else {
    h['cache-control'] = 'no-store';
  }

  if (origen) h['x-origen'] = origen;
  return h;
}
