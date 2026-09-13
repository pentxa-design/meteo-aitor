/* Envoltorio para Vercel. El código vive en netlify/functions/ y NO se
   toca: la firma de las funciones de Netlify v2 —(request) => Response—
   es la misma que la de las Edge Functions de Vercel. */
export { default } from '../netlify/functions/rayos.js';
export const config = { runtime: 'edge' };
