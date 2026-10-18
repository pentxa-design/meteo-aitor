/* Qué ruta de teselas se deja pasar al origen S3 de Open-Meteo.

   18-10-2026: la comprobaba un `ruta.includes('..')`, y `%252e%252e`
   (Vercel lo baja a `%2e%2e`) lo saltaba: S3 lo normaliza, sube al raíz del
   bucket y contesta con el LISTADO ENTERO (`?list-type=2` en la consulta).
   Medido contra lo publicado. Aquí se hace al revés: no se prohíbe lo malo,
   se admite solo lo que tiene la forma de lo que pide la librería —carpetas
   de letras, cifras, `_`, `-` y `.`, acabadas en `.om` o `.json`—. Ni `%`,
   ni `\`, ni segmentos vacíos o de puntos. */

const SEGMENTO = /^[A-Za-z0-9_][A-Za-z0-9_.\-]*$/;

export function rutaDeTeselasValida(ruta) {
  if (typeof ruta !== 'string' || ruta.length === 0 || ruta.length > 200) return false;
  if (!/\.(om|json)$/.test(ruta)) return false;
  const trozos = ruta.split('/');
  if (trozos.length > 8) return false;
  return trozos.every((t) => SEGMENTO.test(t) && !t.includes('..'));
}
