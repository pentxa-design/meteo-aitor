/* ═══════════════════════════════════════════════════════════════════
   Intermediario hacia los RAYOS DETECTADOS de AEMET
   ───────────────────────────────────────────────────────────────────
   Por qué existe, y por qué importa más que el resto de funciones:

   El rayo es el ÚNICO veto de Aitor. Sus palabras: «debo acudir
   siempre y cuando no caigan rayos, porque la torre está pegada a la
   caseta y es un pararrayos». Hasta el 25-08-2026 la app NO leía ni
   una sola descarga: la pestaña Rayos era un mapa de Blitzortung
   metido en un iframe. Se veía, pero la app no podía decidir con él.

   AEMET publica las descargas localizadas por SU red —detectores en
   la península, Baleares y Canarias, más los de Portugal, Francia e
   Italia— como imágenes PNG horarias georreferenciadas, en el mismo
   sitio del que ya sale el compuesto de radar. No hacen falta claves.

   Dos rutas, las dos por aquí porque aemet.es NO manda cabecera CORS
   y el navegador tiene que LEER LOS PÍXELES de la imagen, no solo
   enseñarla: cada píxel opaco es una descarga y hay que medir a qué
   distancia cayó del emplazamiento.

     /rayos          → catálogo: qué horas hay publicadas y los
                       límites geográficos de cada ámbito, tal como
                       los da AEMET (no se calculan aquí: se preguntan)
     /rayos?f=…      → una imagen horaria

   MEDIDO el 25-08-2026 antes de montar esto:
     · las imágenes pesan entre 185 B (hora sin una sola descarga) y
       unos 20 KB (tarde de tormentas); no se parecen en nada al
       agujero que abrió /omtiles en Netlify
     · el ámbito LOCL (7296×2620) da CADA descarga por separado —975
       en la hora de las 15:00 del 24-08— mientras que en PNBL salen
       fundidas en 28 manchas. Por eso la app pide LOCL.
     · la imagen va en Web Mercator, comprobado contra el compuesto de
       radar de la misma hora: cuadrando por Mercator el 68 % de las
       descargas caen sobre un píxel con eco, y por lat/lon plana solo
       el 27 %.

   Cada mapa cubre LA HORA SIGUIENTE a la que lleva por nombre. Lo dice
   AEMET en su página de interpretación, y no es un detalle: leerlo al
   revés desplaza una hora entera la última descarga.

   Fuente y licencia: © AEMET. Autorizado el uso de la información y su
   reproducción citando a AEMET como autora.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

const API = 'https://www.aemet.es/es/api-eltiempo/rayos';

// Nombres tal como los publica el catálogo: rayos_PB_LOCL_2026082415+0200_1787630468.png
const NOMBRE = /^rayos_(PB|CN)_(PNBL|CCAA|PROV|LOCL)_\d{10}\+\d{4}_\d+\.png$/;

const cors = { 'access-control-allow-origin': '*' };

/** Los límites llegan como polígono de cuatro esquinas [lon,lat]. Se
 *  reducen a la caja que necesita la app. No se inventan: si AEMET
 *  cambia el encuadre, esto cambia con él. */
function caja(poligono) {
  if (!Array.isArray(poligono) || poligono.length < 3) return null;
  const lons = poligono.map(p => p[0]), lats = poligono.map(p => p[1]);
  return {
    lon0: Math.min(...lons), lon1: Math.max(...lons),
    lat0: Math.min(...lats), lat1: Math.max(...lats),
  };
}

async function json(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`AEMET respondió ${r.status} en ${url.split('/').pop()}`);
  return r.json();
}

export default async (request) => {
  const q = new URL(request.url).searchParams;
  const f = q.get('f');

  /* ── TORMENTAS TROPICALES ACTIVAS EN EL MUNDO ──────────────────────
     Suyo, 01-09-2026, enseñando el seguidor de huracanes de Windy: *«me
     gustaría saber, por ejemplo, si hay tornados por Filipinas, grandes
     lluvias… me gustaría seguirlo y ver cómo damos el pronóstico. Esto
     ya por hobby»*.

     La fuente es el **National Hurricane Center** de la NOAA: pública,
     sin clave y oficial. Cubre Atlántico y Pacífico este/central — o
     sea, los huracanes. **Los tifones del Pacífico oeste NO están ahí**
     (esos los lleva el centro japonés y el JTWC), y eso se dice en la
     pantalla en vez de fingir que la lista está completa.

     Va DENTRO de esta función, no en una nueva: cada función suma al
     tope del plan y esto es un extra, no algo de lo que dependa su
     trabajo. Comprobado el 01-09: 19 KB, 320 ms, cuatro tormentas vivas
     y las mismas que enseñaba Windy en su pantalla. */
  if (q.get('tormentas') === '1') {
    try {
      const r = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json',
                            { headers: { 'user-agent': 'AitorMeteo/1.0' } });
      if (!r.ok) {
        return new Response(JSON.stringify({ error: `NHC devolvió ${r.status}` }),
          { status: 502, headers: { ...cors, 'content-type': 'application/json' } });
      }
      const j = await r.json();
      const lista = (j.activeStorms || []).map(s => ({
        nombre: s.name,
        clase: s.classification,          // TD tropical, TS tormenta, HU huracán
        lat: s.latitudeNumeric, lon: s.longitudeNumeric,
        vientoKmh: Number.isFinite(+s.intensity) ? Math.round(+s.intensity * 1.852) : null,
        presion: s.pressure ? +s.pressure : null,
        rumbo: s.movementDir, avanceKmh: Number.isFinite(+s.movementSpeed)
          ? Math.round(+s.movementSpeed * 1.852) : null,
        cuenca: s.binNumber || null,
        aviso: s.publicAdvisory?.url || null,
      }));
      return new Response(JSON.stringify({
        tormentas: lista,
        fuente: 'National Hurricane Center (NOAA) · oficial y público',
        /* Se dice lo que NO cubre: media verdad en una lista de tormentas
           es peor que no tenerla. */
        cubre: 'Atlántico y Pacífico este y central. NO cubre los tifones del Pacífico oeste (Filipinas, Japón), que los llevan otros centros.',
        cuando: new Date().toISOString(),
      }), { headers: cabeceras(900, {
        /* Antes iba solo `cache-control: public, max-age=900`, sin cabecera
           de CDN y sin charset. Medido el 05-09-2026 a las 03:52 UTC en la
           app publicada: x-vercel-cache HIT con age 257, o sea el CDN ya
           guardaba 900 s por el max-age y al caducar refrescaba en la
           propia petición. Se conserva tal cual: sin stale-while-revalidate
           (con él serviría la lista hasta 45 min vieja) y el content-type
           como estaba. Lo único nuevo es el x-origen. */
        navegador: 900, revalidar: 0, tipo: 'application/json', origen: 'nhc-noaa',
      }) });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e?.message || e).slice(0, 120) }),
        { status: 502, headers: { ...cors, 'content-type': 'application/json' } });
    }
  }

  /* ── Una imagen horaria ─────────────────────────────────────────── */
  if (f !== null) {
    if (!NOMBRE.test(f)) {
      return new Response('nombre de imagen no permitido', { status: 400, headers: cors });
    }
    try {
      const r = await fetch(`${API}/imagen/rayos/${encodeURIComponent(f)}`);
      if (!r.ok) {
        return new Response('', {
          status: r.status,
          headers: { ...cors, 'cache-control': 'no-store' },
        });
      }
      return new Response(await r.arrayBuffer(), {
        status: 200,
        // Una hora ya publicada no cambia: se puede guardar de verdad.
        headers: cabeceras(3600, { navegador: 1800, revalidar: 7200, tipo: 'image/png', origen: 'aemet-rayos' }),
      });
    } catch (e) {
      return new Response(String(e.message || e), {
        status: 502, headers: { ...cors, 'cache-control': 'no-store' },
      });
    }
  }

  /* ── El catálogo ────────────────────────────────────────────────── */
  try {
    /* Canarias es OPCIONAL: si AEMET no da sus límites, la península
       sigue saliendo. Antes un fallo en CN tumbaba el catálogo entero, y
       el rayo es su único veto (revisión 04-09-2026). */
    const [tl, bPB, bCN] = await Promise.all([
      json(`${API}/timeline`),
      json(`${API}/bounds/PB`),
      json(`${API}/bounds/CN`).catch(() => null),
    ]);

    const marcos = (rama) => {
      const v = tl?.ica_horario?.[rama]?.variables?.rayos;
      if (!Array.isArray(v)) return [];
      return v.map(e => ({
        // AEMET marca el INICIO del periodo; el mapa es de la hora siguiente
        desde: e.fecha,
        hasta: new Date(new Date(e.fecha).getTime() + 3600e3).toISOString().replace('.000', ''),
        f: e?.ficheros?.LOCL || e?.ficheros?.PROV || e?.ficheros?.PNBL || null,
      })).filter(e => e.f);
    };

    const salida = {
      fuente: 'AEMET · red de detección de descargas eléctricas',
      licencia: '© AEMET. Autorizado el uso citando a AEMET como autora.',
      pagina: 'https://www.aemet.es/es/eltiempo/observacion/rayos',
      // Cada mapa cubre la hora SIGUIENTE a `desde`. Va escrito aquí para
      // que quien lea la respuesta no tenga que acordarse.
      periodo: 'cada mapa cubre desde su hora `desde` hasta su hora `hasta`',
      polaridad: { azul: 'descarga negativa', rojo: 'descarga positiva (menos frecuente, unas dos veces más intensa)' },
      incluye: 'nube-tierra e intranube',
      ambitos: {
        // «PB» es península y Baleares; «CN», Canarias
        PB: { bounds: caja(bPB), marcos: marcos('penbal') },
        CN: bCN ? { bounds: caja(bCN), marcos: marcos('canarias') }
                : { bounds: null, marcos: [], aviso: 'AEMET no ha dado los límites de Canarias' },
      },
      consultado: new Date().toISOString(),
    };

    if (!salida.ambitos.PB.bounds || !salida.ambitos.PB.marcos.length) {
      throw new Error('AEMET no ha dado ni límites ni horas para la península');
    }

    return new Response(JSON.stringify(salida), {
      status: 200,
      // El catálogo cambia una vez por hora; 5 min de caché no atrasa
      // nada y evita pedirlo tres veces por recarga.
      headers: cabeceras(300, { navegador: 120, revalidar: 1800, origen: 'aemet-rayos' }),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: true, reason: String(e.message || e) }), {
      status: 502,
      headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
};

export const config = { path: '/rayos' };
