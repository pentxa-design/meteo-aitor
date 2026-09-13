/* ═══════════════════════════════════════════════════════════════════
   Intermediario hacia el radar de AEMET
   ───────────────────────────────────────────────────────────────────
   Por qué existe: aemet.es sirve las imágenes del compuesto de radar
   SIN cabecera CORS. El navegador puede mostrarlas, pero no leer sus
   píxeles, y hace falta leerlos: la imagen trae un fondo gris azulado
   al 70 % de opacidad que ocupa el 80 % del PNG y tapa el mapa entero.
   Pasando por aquí llega con permiso para tratarla en el navegador.

   No se transforma nada: se devuelven los mismos bytes que manda
   AEMET, con su código de estado. Si AEMET falla, la app lo dice.

   La caché del CDN es corta a propósito (5 min): el compuesto se
   publica cada 10 minutos y aquí lo que interesa es lo que ESTÁ
   cayendo ahora, no lo que cayó hace media hora.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

const BASE = 'https://www.aemet.es/es/api-eltiempo/radar/imagen-radar/compo/';

// Solo nombres del compuesto nacional: radwAAAAMMDDHHMM_3857.png
const NOMBRE = /^radw\d{12}_3857\.png$/;

export default async (request) => {
  const f = new URL(request.url).searchParams.get('f') || '';

  if (!NOMBRE.test(f)) {
    return new Response('nombre de imagen no permitido', {
      status: 400,
      headers: { 'access-control-allow-origin': '*' },
    });
  }

  try {
    const r = await fetch(BASE + f);
    if (!r.ok) {
      return new Response('', {
        status: r.status,
        headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
      });
    }

    return new Response(await r.arrayBuffer(), {
      status: 200,
      headers: cabeceras(300, { navegador: 120, revalidar: 600, tipo: 'image/png', origen: 'aemet' }),
    });
  } catch (e) {
    return new Response(String(e.message || e), {
      status: 502,
      headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
    });
  }
};

export const config = { path: '/radar-aemet' };
