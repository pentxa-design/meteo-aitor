/* ═══════════════════════════════════════════════════════════════════
   Intermediario hacia Open-Meteo
   ───────────────────────────────────────────────────────────────────
   Por qué existe: la API gratuita de Open-Meteo limita las peticiones
   POR DIRECCIÓN IP. Si la app llama directamente desde el navegador,
   todo el mundo que esté en la misma conexión comparte ese cupo y una
   racha de pruebas puede dejarlo sin servicio el resto del día.

   Aquí la petición sale desde el servidor de Netlify y, sobre todo, la
   respuesta se guarda en la caché del CDN: si dos personas —o la misma
   app al recargar— piden el mismo punto en los siguientes minutos, se
   sirve de la caché y no se toca Open-Meteo.

   No transforma NADA del contenido: devuelve tal cual lo que responde
   Open-Meteo. Si Open-Meteo da un error, se devuelve ese mismo error
   con su código, para que la app pueda decir la verdad en pantalla.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

const PERMITIDOS = {
  fc:     'https://api.open-meteo.com/v1/forecast',
  aq:     'https://air-quality-api.open-meteo.com/v1/air-quality',
  marine: 'https://marine-api.open-meteo.com/v1/marine',
  geo:    'https://geocoding-api.open-meteo.com/v1/search',
  elev:   'https://api.open-meteo.com/v1/elevation',

  /* ── LOS DOS QUE HACEN FALTA PARA SABER QUIÉN ACIERTA ──────────────
     Añadidos el 04-09-2026. Suyo: *«que cada uno en lo suyo, el mejor
     en los modelos»* — que cada dato lo dé el modelo que mejor lo hace.

     Eso no se decide a ojo ni por la finura de la malla: se mide. Y para
     medir hacen falta dos cosas que hasta hoy no se podían pedir por
     aquí:

       · `hist` — lo que CADA MODELO pronosticó en días pasados.
       · `arch` — lo que de verdad pasó (reanálisis ERA5).

     Con las dos se puede decir, con números, quién se acerca más en la
     racha, en el agua y en la temperatura, en SUS montes y no en el
     mundo en general. Sin ellas, elegir modelo es una opinión.

     Las dos son de Open-Meteo y del mismo plan gratuito. No las usa la
     app en marcha: las usa la medición. */
  hist:   'https://historical-forecast-api.open-meteo.com/v1/forecast',
  arch:   'https://archive-api.open-meteo.com/v1/archive',

  /* ── EL CATÁLOGO DEL RADAR DE RAINVIEWER (05-09-2026) ──────────────
     No es de Open-Meteo, pero entra por la misma puerta. La pestaña
     Radar lo pedía DIRECTO desde el navegador (revisión 04-09-2026):
     sin caché del CDN y saltándose este intermediario. El catálogo no
     lleva parámetros; si llega alguno en la consulta se reenvía igual,
     como con el resto. */
  rain:   'https://api.rainviewer.com/public/weather-maps.json',
};

/* Cuánto se guarda cada tipo de respuesta en la caché del CDN. */
// La altitud del terreno no cambia: se cachea un mes.
// El pasado tampoco cambia: un día entero, que la medición repite mucho.
// RainViewer saca un fotograma cada 10 min (medido el 05-09-2026 en su
// catálogo: marcas de 600 en 600 s): 5 min de CDN no atrasan nada.
const CACHE = { fc: 600, aq: 900, marine: 900, geo: 86400, elev: 2592000,
                hist: 86400, arch: 86400, rain: 300 };   // segundos

export default async (request) => {
  const entrada = new URL(request.url);
  const cual = entrada.searchParams.get('api') || 'fc';
  const destino = PERMITIDOS[cual];

  if (!destino) {
    return new Response(JSON.stringify({ error: true, reason: 'api no permitida' }),
      { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Se copian los parámetros tal cual, menos el selector de api
  const url = new URL(destino);
  for (const [k, v] of entrada.searchParams) if (k !== 'api') url.searchParams.append(k, v);

  try {
    const r = await fetch(url, { headers: { 'accept': 'application/json' } });
    const cuerpo = await r.text();
    const segundos = CACHE[cual] ?? 600;

    return new Response(cuerpo, {
      status: r.status,
      // Solo se cachea lo que ha ido bien: un error no debe quedarse pegado.
      // Las cabeceras las pone lib/cabeceras.mjs, que es lo que entiende
      // Vercel: hasta el 05-09-2026 el TTL iba en una cabecera de Netlify
      // y el CDN guardaba 60 s, hasta la altitud del terreno.
      headers: cabeceras(r.ok ? segundos : 0, {
        navegador: 60,
        revalidar: segundos * 6,
        origen: cual === 'rain' ? 'rainviewer' : 'open-meteo',
      }),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: true, reason: String(e.message || e) }),
      { status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  }
};

export const config = { path: '/om' };
