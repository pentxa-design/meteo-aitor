/* ═══════════════════════════════════════════════════════════════════
   LO QUE ÉL MIDE EN EL SITIO, DESDE EL MÓVIL
   ───────────────────────────────────────────────────────────────────
   Suyo, 27-08-2026: *«para que os envíe datos de los sites, actívame
   algo para que desde el móvil pueda enviarte»*. Y antes, el 26:
   *«necesito conectar con vosotros desde el móvil para enviaros datos
   en directo cuando esté en el monte»*.

   POR QUÉ AQUÍ Y NO POR CHAT. En una caseta, con una mano, con guantes
   y a veces sin cobertura buena, abrir un navegador y buscar una
   conversación no se hace. La app ya está instalada en su móvil y se
   abre de un toque.

   Y HAY UN MOTIVO MÁS FUERTE: lo que él mide **es lo único que dice si
   la app acierta**. Todo lo demás es comparar un modelo con otro modelo.
   El 26-08 su aviso de que llovía en Bermeo destapó que la ficha ponía
   0,0 mm mientras caía sirimiri — y con sirimiri no se sube a un mástil.

   NO SE LE PIDE FORMATO. Escribe como habla y ya lo ordenamos nosotras.
   Un formulario con casillas obligatorias en el monte no se rellena: se
   deja para luego, y para luego es nunca.
   ═══════════════════════════════════════════════════════════════════ */

/* `del` ya no se importa: desde el 29-08-2026 borrar ARCHIVA, no
   destruye. Ver el comentario de `borrar`. */
import { leerLista as leerDelAlmacen, guardarJSON } from '../lib/almacen.mjs';

const CAJON = 'avisos/campo.json';

/* ── LO QUE DECÍA LA APP EN ESE MOMENTO ───────────────────────────────
   Esto es la mitad del valor de todo lo demás, y es la mitad que se
   pierde sola si no se guarda AHORA.

   Suyo, 27-08-2026: *«os iré enviando dónde estoy, qué tiempo hay en
   imágenes, y vamos comparando con nuestra app»*. Perfecto — pero si él
   manda una foto a las 11:00 y alguien la lee a las 14:00, los modelos ya
   se han actualizado por el medio y **ya no hay forma de reconstruir qué
   decía la app cuando él estaba allí**. Quedaría su observación suelta,
   que sin el par no sirve para calibrar nada.

   Así que se congela aquí: los cinco modelos, para su punto y su hora.
   Si falla o tarda, se guarda la nota igual con `modelos: null` y se
   dice — **lo que no puede pasar es que se pierda lo que él mandó por
   estar buscando el pronóstico**.                                     */
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
    /* Sin esa hora en el modelo NO se coge la primera del fichero (la de
       medianoche): se devuelve sin pronóstico y se dice por qué. */
    if (i < 0) return { hora: null, modelos: {}, sinHora: `el modelo no tiene la hora ${marca}` };

    const out = { hora: H.time[i], modelos: {} };
    for (const m of MODELOS) {
      const v = c => H[`${c}_${m}`]?.[i] ?? null;
      out.modelos[m] = {
        lluvia: v('precipitation'), cielo: v('weather_code'),
        cape: v('cape'), tapa: v('convective_inhibition'),
        racha: v('wind_gusts_10m'), viento: v('wind_speed_10m'),
        temp: v('temperature_2m'),
      };
    }
    return out;
  } catch (e) {
    return { fallo: String(e?.message || e).slice(0, 80) };
  }
}

/* ── «CERO NOTAS» SIGNIFICABA DOS COSAS DISTINTAS ─────────────────────
   Cazado el 29-08-2026 por la tarde, y me lo comí yo entero: él preguntó
   por unas fotos que había mandado, `/api/campo` contestó **«0 notas,
   total 0»**, y me pasé un buen rato dando por hecho que se habían
   perdido solas. No se habían perdido: **las había borrado él**.

   Pero la app no permitía distinguirlo, porque este `leer()` se tragaba
   cualquier error y devolvía la lista vacía. Buzón vacío y buzón
   ilegible se veían **exactamente igual**.

   Es la regla contra la que está hecha esta app entera, otra vez y en
   otro sitio: **un fallo que se lee como calma**. La misma forma que el
   vigilante mudo de esa mañana y que el mapa sin memoria del 23-08.

   Ahora `leer()` distingue: devuelve la lista si pudo, y lanza si no. El
   que llama decide qué decir — pero ya no puede decir «no hay nada»
   cuando lo que pasa es que no lo sabe. */
/* Por la única puerta: distingue «no existe todavía» de «no he podido
   leer», y esta segunda LANZA. */
async function leer() {
  return (await leerDelAlmacen(CAJON)).dato;
}

/* ── EL ARCHIVO ───────────────────────────────────────────────────────
   Lo que él quita del hilo se guarda aquí con su foto. Ver el comentario
   de `borrar`: son sus datos de campo, no mensajes que sobren. */
const ARCHIVO = 'avisos/campo-archivo.json';

async function leerArchivo() {
  return (await leerDelAlmacen(ARCHIVO)).dato;
}

const guardarArchivo = filas => guardarJSON(ARCHIVO, filas);

const guardar = filas => guardarJSON(CAJON, filas);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    /* Para que cualquier sesión pueda leer lo que ha mandado sin tener
       que preguntárselo otra vez. */
    try {
      const todo = await leer();
      const n = Math.min(Number(req.query?.n) || 30, 200);
      return res.status(200).json({ notas: todo.slice(0, n), total: todo.length });
    } catch (e) { return res.status(500).json({ error: String(e?.message || e) }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'solo GET o POST' });

  /* ── CONTESTARLE ──────────────────────────────────────────────────────
     Suyo, 27-08-2026: *«y si os escribo algo, ¿podéis contestarme? ¿o solo
     lo que os envío lo veis y listo?»*.

     Podemos, y hasta ahora la respuesta le llegaba al móvil como un aviso
     suelto — sin quedar pegada a lo que él había mandado. Al día siguiente
     tendría una nota suya por un lado y una respuesta por otro, y a ver
     quién ata eso.

     Aquí la respuesta se GUARDA JUNTO A SU NOTA. Va con clave: esto no lo
     puede escribir cualquiera, porque una respuesta nuestra la va a leer
     como buena para decidir si sube a una torre.                       */
  if (req.body?.responder) {
    const clave = process.env.AVISOS_CLAVE;
    const dada = req.headers['x-clave'] || req.body?.clave;
    if (!clave || dada !== clave) return res.status(401).json({ error: 'sin clave' });

    const cuando = String(req.body.responder);           // el `cuando` de su nota
    const texto = String(req.body.texto ?? '').trim();
    if (!texto) return res.status(400).json({ error: 'la respuesta viene vacía' });

    try {
      const todo = await leer();
      const i = todo.findIndex(n => n.cuando === cuando);
      if (i < 0) return res.status(404).json({ error: 'no encuentro esa nota' });
      todo[i].respuesta = {
        texto: texto.slice(0, 1000),
        hora: new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
      };
      todo[i].visto = true;
      await guardar(todo);
      return res.status(200).json({ ok: true, nota: todo[i].texto.slice(0, 60) });
    } catch (e) { return res.status(500).json({ error: String(e?.message || e) }); }
  }

  /* ── BORRAR UNA NOTA, O TODAS ─────────────────────────────────────────
     Suyo, 27-08-2026: *«la respuesta tuya no la puedo borrar, se queda
     ahí»*. Y tiene razón: un hilo que solo crece se convierte en un
     montón por el que hay que bucear, y entonces deja de mirarse.

     ── PERO BORRAR NO PUEDE DESTRUIR SUS FOTOS ────────────────────────
     Corregido el 29-08-2026. Esa tarde preguntó por unas imágenes que
     había mandado y ya no estaban. Le dio él a «Borrar todo» — nada se
     rompió— pero al preguntar dijo la frase que lo cambia todo:

       *«¿pero no se quedan archivadas si las borro del móvil?»*

     Y tiene razón. **Sus fotos de campo no son mensajes de chat: son
     datos suyos**, la prueba de lo que había en el sitio a esa hora. Con
     dos de ellas se cazaron fallos de la app esa misma semana —el cielo
     de Bermeo del 28-08 y la de Busturia—. Tirarlas porque limpia el
     hilo es tirar la única medición que no sale de ningún modelo.

     Así que borrar **limpia su hilo y archiva la nota**, con su foto
     intacta. Él ve el hilo vacío, que es lo que pidió; el dato no se
     pierde. La foto NO se borra del servidor. */
  if (req.body?.borrar) {
    try {
      const todo = await leer();
      const cual = String(req.body.borrar);
      const quedan = cual === 'todas' ? [] : todo.filter(n => n.cuando !== cual);
      const fuera = todo.filter(n => !quedan.includes(n));
      if (fuera.length) {
        /* Se archiva ANTES de quitarlas del hilo: si esto falla, se dice
           y no se borra nada. Perder la foto por un fallo de red sería
           el mismo error con otra ropa. */
        const viejas = await leerArchivo();
        await guardarArchivo([...fuera, ...viejas].slice(0, 500));
      }
      await guardar(quedan);
      return res.status(200).json({ ok: true, borradas: todo.length - quedan.length,
                                    quedan: quedan.length, archivadas: fuera.length });
    } catch (e) { return res.status(500).json({ error: String(e?.message || e) }); }
  }

  /* Para poder recuperar lo archivado sin tocar el hilo. */
  if (req.query?.archivo === '1' && req.method === 'POST') {
    try {
      const a2 = await leerArchivo();
      return res.status(200).json({ notas: a2.slice(0, 100), total: a2.length });
    } catch (e) { return res.status(500).json({ error: String(e?.message || e) }); }
  }

  const texto = String(req.body?.texto ?? '').trim();
  if (!texto) return res.status(400).json({ error: 'no has escrito nada' });

  const nota = {
    texto: texto.slice(0, 1000),
    sitio: req.body?.sitio ? String(req.body.sitio).slice(0, 60) : null,
    /* Se guardan las coordenadas SOLO si el móvil las da y él las manda.
       Sirven para saber desde qué emplazamiento habla cuando no lo dice. */
    lat: Number.isFinite(+req.body?.lat) ? +req.body.lat : null,
    lon: Number.isFinite(+req.body?.lon) ? +req.body.lon : null,
    /* DE DÓNDE SALEN ESAS COORDENADAS: 'gps' si son suyas de verdad,
       'emplazamiento' si son las del sitio que tenía abierto en la app.

       Sin esto los dos casos son indistinguibles, y `decia` —los cinco
       modelos congelados— tiene la misma pinta de medición en ambos. El
       29-08-2026 eso convirtió una foto de Busturia en una comparación
       contra el tiempo de Bermeo, a 4,5 km. Las notas viejas no lo traen:
       ahí se queda en null y se lee como «no se sabe», que es la verdad. */
    ubiFuente: ['gps', 'emplazamiento'].includes(req.body?.ubiFuente)
      ? req.body.ubiFuente : null,
    cuando: new Date().toISOString(),
    /* La hora de aquí, escrita, para que ninguna sesión tenga que
       convertir de UTC y se equivoque. Ya ha pasado tres veces. */
    hora: new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
    visto: false,
  };

  /* Se congela ANTES de guardar, pero si tarda no se pierde la nota. */
  nota.decia = await loQueDeciaLaApp(nota.lat, nota.lon);

  try {
    const todo = await leer();
    /* Lo último arriba: cuando alguien lo lea, lo primero que quiere ver
       es lo que acaba de mandar. Se guardan 200 y de ahí no se pasa. */
    await guardar([nota, ...todo].slice(0, 200));
    return res.status(200).json({ ok: true, hora: nota.hora });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
