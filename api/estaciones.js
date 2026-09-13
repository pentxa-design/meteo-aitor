/* Envoltorio para Vercel. El código vive en netlify/functions/ y NO se
   toca: la firma de las funciones de Netlify v2 —(request) => Response—
   es la misma que la de las Edge Functions de Vercel. Solo cambia de
   dónde se sirve.

   Se movió aquí el 24-08-2026: Netlify suspendió el sitio por agotar los
   300 créditos del plan gratuito en tres días, y Aitor se quedó sin app
   estando de guardia. */
export { default } from '../netlify/functions/estaciones.js';
export const config = { runtime: 'edge' };
