/* ═══════════════════════════════════════════════════════════════════
   FOTOS DEL SITIO
   ───────────────────────────────────────────────────────────────────
   Suyo, 27-08-2026: *«¿y fotos no os puedo enviar?»*.

   Y es lo más útil que puede mandar: una foto del cielo desde el cordal,
   o de la pantalla del anemómetro, dice en un vistazo lo que en texto
   son tres frases. El 26-08 mandó fotos del Oiz por otro chat y hubo que
   ir a buscarlas; esto las trae directas.

   SE GUARDA REDUCIDA Y YA VIENE REDUCIDA DEL MÓVIL. Una foto de móvil
   son 4 MB; desde un cordal con una raya de cobertura eso no sube. La
   app la encoge antes de mandarla (1.600 px de lado largo, JPEG) y se
   queda en unos 300 KB. **Lo que importa es ver el cielo, no contar los
   píxeles.**

   Y CADA FOTO ENTRA COMO UNA NOTA MÁS en `campo.json`, con su hora, su
   sitio y sus coordenadas. Así la foto y lo que él escribió van juntos y
   ninguna sesión tiene que cruzarlos a mano.
   ═══════════════════════════════════════════════════════════════════ */

import { put, get, del } from '../lib/blob-falso.mjs';
import { leerLista } from '../lib/almacen.mjs';

const CAJON = 'avisos/campo.json';

/* La misma congelación que en `campo.mjs`. Se repite a propósito: son dos
   funciones del servidor distintas y no comparten módulo. Si se cambia
   una, cambiar la otra. */
const MODELOS = ['best_match', 'icon_eu', 'ecmwf_ifs025', 'gfs_seamless',
                 'meteofrance_arome_france_hd'];

async function loQueDeciaLaApp(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  try {
    const u = 'https://weather-app-ochre-one-76.vercel.app/om?api=fc'
            + `&latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=1`
            + '&hourly=precipitation,weather_code,cape,convective_inhibition,'
            + 'wind_gusts_10m,wind_speed_10m,temperature_2m'
            + `&models=${MODELOS.join(',')}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) return { fallo: `la app contesta ${r.status}` };
    const H = (await r.json()).hourly;
    if (!H?.time) return { fallo: 'sin datos' };
    /* LA HORA EN CURSO, SIN USAR `Date` PARA COMPARARLA.
       Falló el 27-08-2026 a las 07:43: congeló los datos de las 05:00.
       Dos horas justas de desfase, que es el UTC otra vez — la CUARTA en
       esta app.

       El motivo: Open-Meteo devuelve las horas en hora de Bermeo pero
       **sin escribir la zona** («2026-08-27T07:00»), y estas funciones
       corren en un servidor que va en UTC. Al leerlas allí con `new
       Date()` se toman como UTC y salen corridas.

       Se compara el TEXTO de la hora contra la hora de Madrid, también
       en texto. Así da exactamente igual dónde corra esto. */
    const aq = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', hour12: false,
    }).format(new Date());                       // «2026-08-27 07»
    const marca = aq.slice(0, 10) + 'T' + aq.slice(11, 13);
    let i = H.time.findIndex(t => t.startsWith(marca));
    if (i < 0) i = 0;
    const out = { hora: H.time[i], modelos: {} };
    for (const m of MODELOS) {
      const v = c => H[`${c}_${m}`]?.[i] ?? null;
      out.modelos[m] = { lluvia: v('precipitation'), cielo: v('weather_code'),
        cape: v('cape'), tapa: v('convective_inhibition'),
        racha: v('wind_gusts_10m'), viento: v('wind_speed_10m'), temp: v('temperature_2m') };
    }
    return out;
  } catch (e) { return { fallo: String(e?.message || e).slice(0, 80) }; }
}

/* Por la única puerta: «no he podido leer» ya no se disfraza de «no
   hay fotos» (01-09-2026). */
async function leerNotas() {
  return (await leerLista(CAJON)).dato;
}

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  /* ── VER UNA FOTO ─────────────────────────────────────────────────────
     Faltaba, y eso dejaba la función a medias de una forma que engaña:
     él mandaba fotos, el móvil le decía «Recibido», la nota ponía
     «📷 con foto»… y **no había manera de abrirla**. Ni en la app ni
     desde fuera: se guardaban en un almacén privado sin puerta de
     lectura. Encontrado el 27-08-2026, cuando mandó una y preguntó por
     qué no le contestábamos.

     Es la regla 2 de esta app en su versión más tonta: no era que
     faltara el dato, es que estaba guardado donde nadie podía mirarlo.

     QUIÉN PUEDE VERLA. Solo se sirven rutas que **están apuntadas en una
     nota real**. Así esto no es una puerta al almacén: es una puerta a
     las fotos que él mismo ha mandado. El nombre lleva la hora al
     milisegundo, así que no se acierta a base de probar. Va sin clave a
     propósito, porque quien la enseña es la etiqueta <img> del navegador
     y ahí no se pueden meter cabeceras.                                */
  if (req.method === 'GET') {
    const ruta = String(req.query?.f ?? '');
    if (!/^campo\/fotos\/[0-9TZ:.\-]+\.jpg$/.test(ruta)) {
      return res.status(400).json({ error: 'esa no es una ruta de foto' });
    }
    try {
      const notas = await leerNotas();
      if (!notas.some(n => n.foto === ruta)) {
        return res.status(404).json({ error: 'no hay ninguna nota con esa foto' });
      }
      const r = await get(ruta, { access: 'private', useCache: false });
      if (!r?.stream) return res.status(404).json({ error: 'la foto ya no está' });
      res.setHeader('Content-Type', 'image/jpeg');
      /* Se puede cachear en SU móvil: la foto nunca cambia una vez subida. */
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.status(200).send(Buffer.from(await new Response(r.stream).arrayBuffer()));
    } catch (e) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'solo GET o POST' });

  /* Llega como texto en base64 desde el móvil: es lo único que se puede
     mandar en un JSON sin complicarle la vida al navegador. */
  const b64 = String(req.body?.foto ?? '');
  const limpio = b64.replace(/^data:image\/\w+;base64,/, '');
  if (!limpio) return res.status(400).json({ error: 'no ha llegado ninguna foto' });

  let bytes;
  try { bytes = Buffer.from(limpio, 'base64'); }
  catch { return res.status(400).json({ error: 'la foto no se entiende' }); }

  if (!bytes.length) return res.status(400).json({ error: 'la foto ha llegado vacía' });
  if (bytes.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'la foto pesa demasiado; hazla más pequeña' });
  }

  const ahora = new Date();
  const sello = ahora.toISOString().replace(/[:.]/g, '-');
  const ruta = `campo/fotos/${sello}.jpg`;

  try {
    await put(ruta, bytes, {
      access: 'private', contentType: 'image/jpeg',
      addRandomSuffix: false, allowOverwrite: true,
    });

    /* La foto se apunta como una nota más, para que no haya dos sitios
       que mirar. Si él escribió algo, va en el mismo apunte. */
    const nota = {
      texto: String(req.body?.texto ?? '').trim().slice(0, 1000) || '(una foto, sin texto)',
      foto: ruta,
      sitio: req.body?.sitio ? String(req.body.sitio).slice(0, 60) : null,
      lat: Number.isFinite(+req.body?.lat) ? +req.body.lat : null,
      lon: Number.isFinite(+req.body?.lon) ? +req.body.lon : null,
      /* 'gps' o 'emplazamiento'. Ver el porqué largo en campo.mjs: sin esto,
         una foto sacada en Busturia se compara contra el tiempo de Bermeo y
         nadie lo nota. Pasó el 29-08-2026. */
      ubiFuente: ['gps', 'emplazamiento'].includes(req.body?.ubiFuente)
        ? req.body.ubiFuente : null,
      cuando: ahora.toISOString(),
      hora: ahora.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
      kb: Math.round(bytes.length / 1024),
      visto: false,
    };
    /* Igual que en las notas de texto: se congela lo que decían los
       modelos en ese momento, porque cuando alguien mire la foto ya
       habrán cambiado. Ver el comentario largo en `campo.mjs`. */
    nota.decia = await loQueDeciaLaApp(nota.lat, nota.lon);

    const todo = await leerNotas();
    const juntas = [nota, ...todo];
    const quedan = juntas.slice(0, 200);

    /* LAS FOTOS QUE SE CAEN DE LA LISTA SE BORRAN CON ELLA.
       Suyo, 27-08-2026: *«si subo fotos etc, ¿no se sobrecarga?»*.
       Buena pregunta y la respuesta corta es no —cada foto son ~300 KB—,
       pero un cajón que solo crece acaba siendo un problema de alguien
       algún día. Aquí no: si una nota se cae por el tope de 200, su foto
       se va detrás. Nadie tiene que acordarse de limpiar. */
    const fuera = juntas.slice(200).map(n => n.foto).filter(Boolean);
    if (fuera.length) { try { await del(fuera); } catch { /* si falla, se reintenta la próxima */ } }

    await put(CAJON, JSON.stringify(quedan), {
      access: 'private', contentType: 'application/json',
      addRandomSuffix: false, allowOverwrite: true,
    });

    return res.status(200).json({ ok: true, ruta, kb: nota.kb, hora: nota.hora });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
