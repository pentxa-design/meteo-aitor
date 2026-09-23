/* ═══════════════════════════════════════════════════════════════════
   LAS ESTACIONES DE EUSKALMET — LAS QUE SÍ ESTÁN EN SUS CIMAS

   Aitor, 28-08-2026: *«lo que me interesa es datos precisos en mis
   estaciones»*, *«eso darle prio»*, y con la red delante: *«pues genial,
   todas las que están cerca se pueden poner»*.

   ── EL AGUJERO QUE TAPA ─────────────────────────────────────────────

   Hasta hoy la app contrastaba contra AEMET. Y esa misma mañana se vio
   el problema al mirar Sollube: **las seis estaciones de AEMET que
   llegan están entre 42 y 150 m de altitud. Ninguna en cima.** El Oiz
   está a 1.026 m y no tenía NADA con qué comprobarse; a Sollube, la más
   cercana estaba a 8 km y 624 m más abajo.

   Y comparar una cima contra un fondo de valle no comprueba la cima: en
   este proyecto ya está medido que **el error cambia de signo en ocho
   kilómetros** —en el cabo de Matxitxako los modelos se quedaban 22
   cortos y en el valle de Forua se pasaban 20—.

   Euskalmet tiene 153 estaciones y **una a 300 metros del Oiz, en la
   cima**, midiendo la racha **a 20 m de altura** (AEMET la mide a 10) y
   **cada diez minutos** (AEMET, cada hora y con hasta 3 h de retraso).
   En junio esa estación marcó 92,4 km/h.

   Las suyas, comprobadas una a una contra la lista abierta:
     OIZ 0,3 km · ORDUÑA 0,2 · BALMASEDA 0,2 · BERMEO 1,1 · CARRANZA 1,8
     MARKINA2 2,0 · MATIENA 2,0 · LEKEITIO 2,3 · SANTAMAÑA 2,9
     GERNIKA2 3,3 · MUNGIA 3,7 · ARBAIZA 4,5 · SOLLUBEMENDI 5,4

   ── UNA TRAMPA QUE CASI CUELA ───────────────────────────────────────

   La estación más cercana a BERMEO por distancia es el **mareógrafo**
   (700 m), y un mareógrafo no mide viento. Coger la más cercana sin
   mirar habría puesto una boya de anemómetro. Por eso aquí no se elige
   por distancia: **se elige por lo que mide**, y solo entran las que
   tienen sensor de viento.

   ── LA CLAVE ────────────────────────────────────────────────────────

   La API pide un JWT firmado con RS256. **La clave privada NO está en
   este fichero ni en el repositorio**: vive como variable de entorno en
   Vercel, igual que la de AEMET.

     EUSKALMET_KEY    el contenido de privateKey.pem, entero
     EUSKALMET_ISS    el contenido de fingerPrint.txt
     EUSKALMET_EMAIL  su correo (por defecto, el de la cuenta)

   **SIN CLAVE NO REVIENTA: contesta que no hay y ya está.** La app
   sigue con AEMET como hasta hoy. Fallar abierto, nunca cerrado — es la
   misma regla que la puerta de la app, y por lo mismo: él usa esto para
   decidir si manda gente a un monte de madrugada.

   ── CÓMO SE USA ─────────────────────────────────────────────────────

   GET /api/euskalmet?lat=43.42&lon=-2.72&radio=25
       Devuelve las estaciones con viento ordenadas por distancia, con la
       última lectura de cada una. Mismo formato que `/estaciones`, para
       que la pantalla no tenga que saber de dónde viene cada una.
   ═══════════════════════════════════════════════════════════════════ */

import { createSign } from 'node:crypto';
import { request as pedirHttps, Agent } from 'node:https';
import { ESTACIONES_EUSKALMET } from '../lib/estaciones-euskalmet.mjs';
import { CA_IZENPE } from '../lib/ca-izenpe.mjs';
import { cabeceras } from '../lib/cabeceras.mjs';

/* ── LA FUNCIÓN QUE SE COMÍA LA CPU DE VERCEL (23-09-2026) ──────────────
   Medido en Vercel → Observability → Functions (12 h de producción): 26
   llamadas a esta función, 34 s de CPU activa, **1,3 s cada una** — el
   resto de funciones juntas, 50 s. Y en Uso: 7 h 31 min en 30 días, con
   4 h al mes en el plan gratuito. Suyo: «esto es mucho consumo para la
   app del tiempo». Lo que la hacía cara: cada llamada abre entre diez y
   veinte conexiones TLS NUEVAS con la CA de IZENPE (una por petición a
   api.euskadi.eus, sin keep-alive), y la respuesta no se guardaba fuera
   del proceso, así que cada apertura de la app lo repetía entero.

   Dos arreglos: (1) un agente con keep-alive, las conexiones se
   reutilizan; (2) la respuesta BUENA se guarda 5 min en el CDN (Euskalmet
   publica cada 10): la misma URL desde cualquier móvil sale del borde sin
   ejecutar nada. Las respuestas con fallo o sin clave no se guardan: un
   «no he podido preguntar» pegado cinco minutos sería mentir a todos los
   móviles a la vez. */
/* Revisión adversaria del 23-09-2026 sobre este mismo cambio: con 8
   sockets, un lote de 20 sitios en frío son cientos de peticiones en cola
   sin plazo (el timeout de 12 s solo corre cuando la petición tiene
   socket); con keep-alive el socket ya no cuesta CPU, así que 24. Y un
   socket ocioso muere aquí a los 9 s, antes que en el servidor: si lo
   cierra el servidor primero, la petición que lo reutiliza muere con
   ECONNRESET (medido en Node 22) — y para ese caso hay un reintento. */
/* 24 sockets fue demasiado para Euskalmet: con el lote de 20 sitios llegó
   «429 Please wait 7 seconds» a todas las fichas a la vez (medido el
   23-09-2026 a las 14:45). Seis en vuelo, y el 429 se respeta (abajo). */
const AGENTE = new Agent({ keepAlive: true, maxSockets: 6, timeout: 9000, ca: CA_IZENPE });
const CDN_SEGUNDOS = 300;
const PLAZO_MS = 15000;

/* Plazo global: si Euskalmet acepta y se cuelga, no se espera a que
   Vercel corte a los 60 s. Lo que no ha contestado a los 15 s se da por
   «no se ha podido preguntar», y esa respuesta no se guarda. */
const conPlazo = (p, ms) => new Promise(resolve => {
  const t = setTimeout(() => resolve(false), ms); t.unref?.();
  p.then(() => { clearTimeout(t); resolve(true); }, () => { clearTimeout(t); resolve(true); });
});

/** Cuánto puede vivir la respuesta en el CDN. Exportada para probarla.
    Las estaciones que NO MIDEN viento son una respuesta válida (5 min);
    las que NO CONTESTARON (red, 5xx, plazo) la hacen parcial (1 min); y
    si no se leyó ninguna habiendo caídas, Euskalmet no está: no se guarda. */
export function segundosDeCache({ leidas, pedidas, fallosRed }) {
  if (pedidas > 0 && leidas === 0 && fallosRed > 0) return 0;
  if (fallosRed > 0) return 60;
  return CDN_SEGUNDOS;
}
function contestar(res, cuerpo, segundos) {
  /* revalidar 60: el peor caso queda en 6 min, por debajo de los 10 con
     los que publica Euskalmet (con 600 eran 15). */
  const h = segundos > 0 ? cabeceras(segundos, { cors: false, revalidar: 60 }) : { 'cache-control': 'no-store' };
  for (const [k, v] of Object.entries(h)) if (k !== 'content-type') res.setHeader(k, v);
  return res.status(200).json(cuerpo);
}

const API = 'https://api.euskadi.eus';

/** Cuántas estaciones se consultan como mucho. Cada una son hasta seis
    peticiones —viento, lluvia, temperatura—, así que con cuatro se cubre
    un radio de 25 km sin que la pantalla se quede esperando. */
const TOPE = 4;

/** m/s a km/h. Euskalmet publica en m/s y él trabaja en km/h: los 25,7
    del Oiz en junio son 92,4. Sin esto, la app le diría que en su cima
    hace menos viento del que hace. */
const KMH = 3.6;

/* Las fichas de estación cambian poco. Se guardan en memoria mientras
   la función esté viva: no es una caché de verdad, es no repetir la
   misma llamada cuatro veces en un segundo. */
const cacheFicha = new Map();
const cacheSensor = new Map();

const b64url = b => Buffer.from(b).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** El JWT, firmado aquí. Dura poco a propósito: si se filtrara uno, en
    quince minutos no vale. */
function firmar() {
  const clave = process.env.EUSKALMET_KEY;
  const iss   = (process.env.EUSKALMET_ISS || '').trim();
  const email = (process.env.EUSKALMET_EMAIL || 'pentxa@gmail.com').trim();
  if (!clave || !iss) return null;

  const ahora = Math.floor(Date.now() / 1000);
  const cabeza = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({
    aud: 'met01.apikey', iss, exp: ahora + 900, iat: ahora,
    version: '1.0.0', email,
  }));
  const s = createSign('RSA-SHA256');
  s.update(`${cabeza}.${cuerpo}`);
  s.end();
  return `${cabeza}.${cuerpo}.${b64url(s.sign(clave.replace(/\\n/g, '\n')))}`;
}

/* Se usa `node:https` y NO `fetch` a propósito, y esto es lo que costó
   media hora encontrar: `api.euskadi.eus` va firmado por IZENPE —la
   autoridad del Gobierno Vasco—, que el Mac se conoce y Node no. Con
   `fetch` no hay forma de meterle esa autoridad; con `https.request` sí,
   pasándole la cadena en `ca`. Ver `ca-izenpe.mjs`.

   El aviso de Node cuando falla esto es «fetch failed», sin decir que es
   de certificados. Por eso queda escrito aquí. */
/* ── EL LÍMITE DE EUSKALMET (23-09-2026) ─────────────────────────────
   Medido en producción al medir el gasto: «429 Please wait 7 seconds
   before retrying» en las cuatro fichas de Bermeo a la vez, y la app
   decía de las cuatro «no publica viento en esta hora». Un 429 es «no he
   podido», no «no hay»: se marca como fallo de red (no se guarda en
   ninguna caché), se espera lo que pide el servidor —todas las peticiones
   en vuelo, no solo la que lo recibió— y se reintenta UNA vez. */
let pausaHasta = 0;
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function pedir(ruta, jwt, intento = 0) {
  const falta = pausaHasta - Date.now();
  if (falta > 0) await esperar(Math.min(falta, 8000));
  try { return await pedirUnaVez(ruta, jwt, intento); }
  catch (e) {
    if (e.status === 429 && intento === 0) {
      const seg = Math.min(8, Math.max(1, e.espera || 7));
      pausaHasta = Math.max(pausaHasta, Date.now() + seg * 1000);
      await esperar(seg * 1000);
      return pedir(ruta, jwt, 1);
    }
    throw e;
  }
}
function pedirUnaVez(ruta, jwt, intento) {
  return new Promise((ok, mal) => {
    const req = pedirHttps({
      host: 'api.euskadi.eus', path: ruta, method: 'GET', ca: CA_IZENPE, agent: AGENTE,
      headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/json' },
      timeout: 12000,
    }, res => {
      /* ── LA CODIFICACIÓN LA DICE EL SERVIDOR, NO SE SUPONE ──────────
         Encontrado el 28-08-2026: en pantalla salía «Ordu?a» en vez de
         «Orduña». La API de Euskalmet sirve el JSON en **ISO-8859-1**
         —lo pone en su cabecera `Content-Type`— y aquí se leía como
         UTF-8, así que la eñe se rompía. Y con ella todas las de sus
         estaciones: Orduña, Muxika, Abadiño…

         Es primo hermano del fallo del UTC que ya mordió cinco veces en
         este proyecto: **suponer un formato en vez de leer el que viene**.
         Ahora se mira la cabecera y se decodifica con lo que diga; si no
         lo dice, UTF-8, que es lo normal hoy. */
      const trozos = [];
      res.on('data', t => trozos.push(t));
      res.on('end', () => {
        const tipo = String(res.headers['content-type'] || '');
        const juego = /charset=\s*([\w-]+)/i.exec(tipo)?.[1]?.toLowerCase();
        const comoLeer = (juego === 'iso-8859-1' || juego === 'latin1') ? 'latin1' : 'utf8';
        const cuerpo = Buffer.concat(trozos).toString(comoLeer);
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const e = new Error(`${res.statusCode} en ${ruta.split('/measures')[0]} ${cuerpo.slice(0, 120)}`);
          e.status = res.statusCode;
          e.red = res.statusCode >= 500 || res.statusCode === 429;   // 5xx y 429 son «no he podido»; un 404 es «no hay»
          if (res.statusCode === 429)
            e.espera = parseInt(/wait (\d+) seconds/i.exec(cuerpo)?.[1] || res.headers['retry-after'] || '7', 10);
          return mal(e);
        }
        try { ok(JSON.parse(cuerpo)); }
        catch (e) { const e2 = new Error(`respuesta ilegible de ${ruta.split('/measures')[0]}`); e2.red = true; mal(e2); }
      });
    });
    req.on('timeout', () => { const e = new Error(`sin respuesta en 12 s de ${ruta.split('/measures')[0]}`); e.red = true; req.destroy(e); });
    req.on('error', e => {
      /* Socket reutilizado que el servidor había cerrado: se reintenta UNA
         vez (patrón documentado en Node). Lo demás es fallo de red. */
      if (intento === 0 && req.reusedSocket && (e.code === 'ECONNRESET' || e.code === 'EPIPE'))
        return pedirUnaVez(ruta, jwt, 1).then(ok, mal);
      e.red = true; mal(e);
    });
    req.end();
  });
}

const rad = g => g * Math.PI / 180;
function km(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const s = Math.sin(rad(bLat - aLat) / 2) ** 2
          + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLon - aLon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}



/* ── CÓMO ESTÁ MONTADA LA API DE VERDAD ──────────────────────────────
   Comprobado a mano el 28-08-2026, porque la primera versión suponía y
   se equivocaba en las tres cosas. Devolvía «4 estaciones miradas, 0
   lecturas» teniendo la clave bien puesta.

   1. **La ficha NO se pide por la fecha de hoy.** `/stations/C046/20260828`
      da 404: las fichas son fotos de cuando cambió algo. Hay que pedir
      `/stations/C046/` —que lista 228 fotos desde 2009— y quedarse con
      la última, que en el Oiz es del 21-05-2026.

   2. **La ficha NO dice qué mide cada sensor.** Solo da la altura y una
      referencia: `{at: 2000, sensorKey: "euskalmet/sensors/Y0BP"}`. Para
      saber que Y0BP es el del viento hay que preguntarle al sensor.

   3. **El sensor lo dice en `meteors`**, no en `measures`:
      `[{measureType: "measuresForWind", measureId: "max_speed"}, …]`

   Y el nombre viene en dos idiomas —`{SPANISH, BASQUE}`—, no como texto.

   Todo esto se cachea mientras la función vive: son datos de aparatos
   plantados en un monte, no cambian de un minuto para otro. */

/** La última foto de la ficha, que es la que vale. */
async function ficha(cod, jwt, apunta, fallos) {
  if (cacheFicha.has(cod)) return cacheFicha.get(cod);
  let f = null;
  try {
    const hist = await pedir(`/euskalmet/stations/${cod}/`, jwt);
    const keys = (Array.isArray(hist) ? hist : []).map(x => x?.key).filter(Boolean).sort();
    if (!keys.length) apunta?.(`el historial de fichas vino vacío (${typeof hist})`);
    if (keys.length) f = await pedir(`/${keys[keys.length - 1]}`, jwt);
  } catch (e) {
    apunta?.(`ficha: ${e.message || e}`);
    /* Un null que viene de un fallo de red NO se guarda: quedaría «sin
       ficha» mientras viva la instancia y el CDN lo repetiría. */
    if (e?.red) { fallos?.add(cod); return null; }
    f = null;
  }
  cacheFicha.set(cod, f);
  return f;
}

/** Qué mide un sensor. Se pregunta una vez por sensor y se guarda. */
async function queMide(ref, jwt, fallos, cod) {
  const id = String(ref || '').split('/').pop();
  if (!id) return [];
  if (cacheSensor.has(id)) return cacheSensor.get(id);
  let m = [];
  try {
    const d = await pedir(`/euskalmet/sensors/${id}`, jwt);
    m = Array.isArray(d?.meteors) ? d.meteors : [];
  } catch (e) { if (e?.red) { fallos?.add(cod); return []; } m = []; }
  cacheSensor.set(id, m);
  return m;
}

/** Los sensores de una estación, ya sabiendo qué mide cada uno.

    Esto es lo que evita la trampa del mareógrafo de Bermeo: está a 700 m
    del emplazamiento —más cerca que ninguna— pero es de marea y oleaje.
    Aquí no se elige por distancia, se elige por lo que mide, así que una
    estación sin sensor de viento sencillamente no entra. */
async function sensoresDe(f, jwt, fallos, cod) {
  const ss = Array.isArray(f?.sensors) ? f.sensors : [];
  const out = {};
  await Promise.all(ss.map(async s => {
    const meteors = await queMide(s?.sensorKey, jwt, fallos, cod);
    for (const m of meteors) {
      if (!m?.measureType) continue;
      out[m.measureType] ??= { id: String(s.sensorKey).split('/').pop(), at: s.at, mide: [] };
      out[m.measureType].mide.push(m.measureId);
    }
  }));
  return out;
}

/** El nombre viene en castellano y en euskera; se coge el castellano. */
const nombreDe = (f, porDefecto) =>
  f?.name?.SPANISH || f?.name?.BASQUE || porDefecto;

/** La última lectura que haya llegado de esa hora. La API devuelve seis
    huecos de diez minutos y los que aún no han llegado vienen a `null`:
    se coge el último con dato, no el último a secas. */
function ultima(j) {
  const slots = j?.slots || [], vals = j?.values || [];
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i] !== null && vals[i] !== undefined && Number.isFinite(+vals[i]))
      return { valor: +vals[i], hueco: slots[i] ?? null, i };
  }
  return null;
}

const rutaMedida = (est, sensor, familia, medida, d) =>
  `/euskalmet/readings/forStation/${est}/${sensor}/measures/${familia}/${medida}`
  + `/at/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  + `/${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCHours()).padStart(2, '0')}`;

/** Una estación con su última racha. Se prueba esta hora y, si aún no
    hay nada, la anterior: a y media pasada, la hora en curso puede estar
    entera a null y eso NO es «no hay viento». */
/* ── LA LECTURA SE GUARDA UNOS MINUTOS ────────────────────────────────
   Suyo, 28-08-2026: *«revisar los dos posibles errores, lentitud pidiendo
   más datos etc»* y *«y solucionar si es que se atasca»*.

   MEDIDO ANTES DE TOCAR NADA, que la alarma venía de una sola medida en
   frío y resultó no ser lo que parecía:

       1 sitio    2,58 s en frío  ->  0,69 s  ->  0,76 s
       14 sitios  1,88 s en frío  ->  0,73 s

   **Catorce tardan lo mismo que uno**: las estaciones ya iban en paralelo
   y la ficha y los sensores ya se cacheaban. Y en su pantalla el tablero
   **no espera** a esto (`app.js`, `medidasDeTodos()` sin await). Así que
   atascarse, no se atasca.

   Lo que sí cuesta es la primera vez de cada rato: 3,46 s con sus 18
   sitios, lo más lento de la página. Y es tiempo tirado, porque
   **Euskalmet publica cada diez minutos**: pedirlo más a menudo devuelve
   exactamente el mismo número.

   Cinco minutos para una lectura buena; **solo uno si la estación vino
   callada**, para que una que se recupera no se quede muda un cuarto de
   hora. Nunca se sirve nada más viejo que el propio ritmo de publicación,
   y la app enseña siempre la hora del dato, así que si algo se quedase
   atrás **se vería en pantalla**. */
const cacheLee = new Map();
const VIVE_BUENA = 5 * 60e3;
const VIVE_VACIA = 60e3;

async function leer(est, jwt, notas, fallos) {
  const apunta = t => { if (notas) notas.push(`${est.Codigo} (${est.Nombre}): ${t}`); };

  const guardada = cacheLee.get(est.Codigo);
  if (guardada && Date.now() - guardada.t < (guardada.v ? VIVE_BUENA : VIVE_VACIA)) {
    /* Las notas de por qué una estación calló se repiten tal cual: si no,
       al cachear el null se perdería la explicación y volvería a salir el
       «0 lecturas» sin motivo que ya costó una tarde entera. */
    for (const n of guardada.notas) if (notas) notas.push(n);
    if (guardada.red) fallos?.add(est.Codigo);       // un null de red sigue siendo «no pude»
    return guardada.v;
  }
  const mias = [], mios = new Set();
  const res = await leerDeVerdad(est, jwt, mias, mios);
  if (mios.size) fallos?.add(est.Codigo);
  cacheLee.set(est.Codigo, { t: Date.now(), v: res, notas: mias, red: mios.size > 0 });
  for (const n of mias) if (notas) notas.push(n);
  return res;
}

async function leerDeVerdad(est, jwt, notas, fallos) {
  const apunta = t => { if (notas) notas.push(`${est.Codigo} (${est.Nombre}): ${t}`); };
  const f = await ficha(est.Codigo, jwt, apunta, fallos);
  if (!f) { apunta('no se ha podido leer la ficha'); return null; }
  const sens = await sensoresDe(f, jwt, fallos, est.Codigo);
  const viento = sens.measuresForWind;
  if (!viento) { apunta(`sin sensor de viento; tiene: ${Object.keys(sens).join(', ') || 'ninguno'}`); return null; }

  /* NO SOLO VIENTO. La misma estación da lluvia y temperatura, y en sus
     sitios de monte **la lluvia importa más que la racha**: él lo contó
     ese mismo día —«a la torre se sube solo para cambiar alguna antena
     esporádica; el 90 % de las ocasiones vas a las casetas o equipos
     intemperie que están a pie»—. Saber si en el Oiz está lloviendo de
     verdad deja de ser cosa de deducirlo de un modelo. */
  const aire = sens.measuresForAir, agua = sens.measuresForWater;

  for (const atras of [0, 1]) {
    const d = new Date(Date.now() - atras * 3600e3);
    const opc = async (sen, fam, medida) => {
      if (!sen || !sen.mide.includes(medida)) return null;
      try { return ultima(await pedir(rutaMedida(est.Codigo, sen.id, fam, medida, d), jwt)); }
      catch (e) { if (e?.red) fallos?.add(est.Codigo); return null; }
    };

    const max = await opc(viento, 'measuresForWind', 'max_speed');
    if (!max) { apunta(`sin racha en la hora ${d.getUTCHours()}Z (sensor ${viento.id}, mide ${viento.mide.join('/')})`); continue; }

    const [med, dir, tem, hum, llu] = await Promise.all([
      opc(viento, 'measuresForWind', 'mean_speed'),
      opc(viento, 'measuresForWind', 'mean_direction'),
      opc(aire,   'measuresForAir',  'temperature'),
      opc(aire,   'measuresForAir',  'humidity'),
      opc(agua,   'measuresForWater', 'precipitation'),
    ]);

    /* La hora del camino es UTC y los huecos son de diez minutos. De ahí
       sale el instante real de la medida, que es lo que la app necesita
       para comparar contra la MISMA hora del modelo. Ese fallo ya se
       coló cinco veces en este proyecto. */
    const medido = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
                                     d.getUTCHours(), max.i * 10));
    return {
      nombre: nombreDe(f, est.Nombre),
      id: est.Codigo,
      lat: +est.LATWGS84, lon: +est.LONWGS84,
      altitud: Number.isFinite(+f?.altitude) ? Math.round(+f.altitude) : null,
      racha: Math.round(max.valor * KMH * 10) / 10,
      viento: med ? Math.round(med.valor * KMH * 10) / 10 : null,
      direccion: dir ? Math.round(dir.valor) : null,
      /* Estas tres van en sus unidades tal cual: grados, por ciento y
         milímetros. Solo el viento se convierte, porque solo el viento
         viene en m/s. */
      temperatura: tem ? Math.round(tem.valor * 10) / 10 : null,
      humedad: hum ? Math.round(hum.valor) : null,
      lluvia: llu ? Math.round(llu.valor * 10) / 10 : null,
      /* ── Y CUÁNTO RATO CUBRE ESA LLUVIA (21-09-2026) ───────────────
         Euskalmet sirve esta serie en huecos de DIEZ MINUTOS, y aquí se
         cogía el último hueco con valor. Eso NO es lo mismo que el
         milímetro por hora del modelo, ni que el `prec` de AEMET, que es
         la lluvia de la última hora entera — y los tres se metían en el
         mismo saco y en el mismo marcador.

         El efecto era sistemático y siempre en la misma dirección: el
         aparato «medía» una fracción de lo que decía el modelo, así que
         en el recuento de aciertos los modelos salían exagerados en
         lluvia, que es SU prioridad número uno.

         No se toca el número: se dice el rato que cubre, y quien compare
         que mire esto antes. Mientras no esté medido contra un día de
         agua de verdad cuál de las dos cosas publica Euskalmet —el hueco
         de diez minutos o el acumulado de la hora—, esta lluvia NO
         puntúa a nadie. Un dato que no se sabe comparar no se compara. */
      lluviaMin: llu ? (llu.i + 1) * 10 : null,
      /* Euskalmet mide la racha a la altura que diga la ficha —20 m en el
         Oiz— y AEMET siempre a 10. No es un detalle: a 20 sopla más, y
         mezclarlas sin decirlo sería comparar peras con manzanas justo
         donde más importa. */
      alturaAnemometro: Number.isFinite(+viento.at) ? Math.round(+viento.at / 100) : null,
      fuente: 'Euskalmet',
      medidoEn: medido.toISOString(),
      haceMinutos: Math.max(0, Math.round((Date.now() - medido.getTime()) / 60000)),
    };
  }
  apunta('ni esta hora ni la anterior traen racha');
  return null;
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'http://x');
  const radio = Math.min(60, Math.max(1, parseFloat(u.searchParams.get('radio')) || 25));

  /* ── VARIOS EMPLAZAMIENTOS DE UNA VEZ ────────────────────────────────
     Suyo, 28-08-2026, mirando el parte: *«mejor poner todo ahí, sin
     tener que hacer otra pantalla con todas las estaciones otra vez; lo
     prefiero así, y pones datos de AEMET o lo que sea, y a la derecha ves
     que hay sitio de sobra»*.

     Para eso hace falta la medida de CADA uno de sus quince, y pedirlas
     de una en una serían quince peticiones desde el móvil. Con `puntos`
     se piden todas juntas y —lo que de verdad ahorra— **se agrupan por
     estación**: sus quince emplazamientos comparten aparato en varios
     casos (Matiena y Durango miran los dos a Iurreta), así que se
     consulta cada estación UNA vez y se reparte. */
  /* Cada punto puede traer su COTA detrás: `lat,lon,cota`. Sirve para
     elegir estación mirando también la altura, no solo la distancia.
     Ver `puntua()` para por qué hace falta. */
  const puntos = (u.searchParams.get('puntos') || '')
    .split('|').map(t => t.split(',').map(Number))
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
    .slice(0, 20);

  const lat = parseFloat(u.searchParams.get('lat'));
  const lon = parseFloat(u.searchParams.get('lon'));
  if (!puntos.length && (!Number.isFinite(lat) || !Number.isFinite(lon)))
    return res.status(400).json({ error: true, reason: 'faltan lat y lon (o puntos)' });

  const jwt = firmar();
  if (!jwt) {
    /* SIN CLAVE NO ES UN ERROR, ES UN «TODAVÍA NO». Se dice con todas
       las letras para que se vea en pantalla que falta ponerla, en vez
       de que la pantalla se quede como si Euskalmet no existiera. */
    return contestar(res, {
      ok: true, hayClave: false, estaciones: [],
      reason: 'Falta la clave de Euskalmet en Vercel (EUSKALMET_KEY y EUSKALMET_ISS). '
            + 'Mientras tanto la app sigue con las estaciones de AEMET.',
    }, 0);
  }

  if (puntos.length) {
    try {
      const jwt2 = jwt;
      /* ── LA ESTACIÓN NO SE ELIGE POR DISTANCIA SOLA ──────────────
         Cambiado el 28-08-2026 con un caso suyo delante. A SOLLUBEMENDI
         —669 m— le tocaba **Almike, a 5,4 km pero 563 m más abajo**, que
         es el pueblo de Bermeo. Y a 7,4 km está **Matxitxako, a 433 m**:
         dos kilómetros más lejos y **327 metros más cerca en altura**.

         Él lo dijo antes que nadie, mirando Gernika: *«no es que se haya
         pasado, están en otra altitud, otro terreno»*.

         Así que se puntúa **distancia y desnivel juntos**, y gana la más
         baja: `km + |desnivel| / 100`. O sea, **cien metros de desnivel
         pesan como un kilómetro de distancia**.

         Ese cambio NO está medido, es una elección, y se dice: sale de
         que en este proyecto ocho kilómetros bastaron para cambiar el
         signo del error —cabo de Matxitxako 22 cortos, valle de Forua 20
         de más— y unos doscientos metros de desnivel también. Si algún
         día hay casos suficientes en el marcador, se afina con ellos.

         Y como la altitud solo viene en la ficha, hay que mirar más
         candidatas: seis en vez de tres. Las que no midan viento se caen
         solas, que para eso está el filtro del mareógrafo. */
      /* OCHO, y el número sale de un caso: con seis, a SOLLUBEMENDI le
         seguía tocando Almike porque **Matxitxako es la séptima** de la
         lista por distancia (7,4 km) y se quedaba fuera del corte. Y es
         justo la buena: 433 m contra los 106 de Almike. Probado el
         28-08-2026 con sus cuatro sitios. */
      const CANDIDATAS = 8;
      const PESO_ALTURA = 100;   // metros de desnivel que valen 1 km

      const candidatas = puntos.map(([a, b]) =>
        ESTACIONES_EUSKALMET
          .map(s2 => ({ c: s2.c, n: s2.n, la: s2.la, lo: s2.lo, km: km(a, b, s2.la, s2.lo) }))
          .sort((x, y) => x.km - y.km).slice(0, CANDIDATAS));

      const necesarias = [...new Set(candidatas.flat().map(c => c.c))];
      const leidas = new Map();
      /* ── «NO PUDE LEERLA» NO ES «NO MIDE VIENTO» (20-09-2026) ───────
         Este `catch` se tragaba el motivo, y abajo TODOS los sitios sin
         estación salían con `porque: 'ninguna de las cercanas mide
         viento'` — que con Euskalmet caído es falso. Y la respuesta iba
         con `ok: true`, así que la app no ponía ni una palabra.
         Resultado medido leyendo el código: con una caída de Euskalmet,
         sus veinte emplazamientos enseñaban solo la estación de AEMET del
         valle, 400 o 500 m más abajo, y sus estaciones de cima —Oiz,
         Orduña, las que valen para una torre— desaparecían sin explicación.
         El camino de UN punto, en este mismo fichero, ya lo distingue:
         faltaba aplicarlo aquí. */
      const noLeidas = new Set();
      const fallosRed = new Set();      // las que NO se pudieron leer (red, 5xx, plazo)
      const aTiempo = await conPlazo(Promise.all(necesarias.map(async cod => {
        const e = ESTACIONES_EUSKALMET.find(x => x.c === cod);
        try {
          const r = await leer({ Codigo: cod, Nombre: e.n, LATWGS84: e.la, LONWGS84: e.lo }, jwt2, null, fallosRed);
          if (r) leidas.set(cod, r); else noLeidas.add(cod);   // sin viento en esta hora
        } catch { noLeidas.add(cod); fallosRed.add(cod); }     // no se ha podido preguntar
      })), PLAZO_MS);
      if (!aTiempo) for (const cod of necesarias)
        if (!leidas.has(cod) && !noLeidas.has(cod)) { noLeidas.add(cod); fallosRed.add(cod); }
      /* Si NINGUNA de las que hacían falta se pudo leer, no es que no
         midan: es que Euskalmet no está contestando. */
      const euskalmetCaido = leidas.size === 0 && necesarias.length > 0;

      const salida = candidatas.map((cs, i) => {
        const cota = puntos[i][2];
        let mejor = null, mejorP = Infinity;
        for (const c of cs) {
          const r = leidas.get(c.c);
          if (!r) continue;                       // sin viento o sin lectura
          const desn = (Number.isFinite(cota) && Number.isFinite(r.altitud))
            ? Math.round(cota - r.altitud) : null;
          const p2 = c.km + (desn === null ? 0 : Math.abs(desn) / PESO_ALTURA);
          if (p2 < mejorP) {
            mejorP = p2;
            mejor = { ...r, km: Math.round(c.km * 10) / 10, desnivel: desn };
          }
        }
        const cayeron = cs.filter(c => fallosRed.has(c.c)).length;
        if (!mejor) {
          /* NINGUNA DE LAS OCHO SIRVE, y se dice por qué. Pasa de verdad:
             en LEKEITIO las cuatro más cercanas —Oleta, Arbina,
             Berriatua, Aulesti— son de agua y calidad de río, sin
             anemómetro. El filtro hace bien en dejarlas fuera; lo que no
             puede es callarse, que entonces parece que allí no hay
             estaciones cuando lo que no hay es una que mida viento. */
          return { sinEstacion: true, miradas: cs.length,
                   noSePudo: (euskalmetCaido || cayeron > 0) || undefined,
                   porque: euskalmetCaido
                     ? 'no se ha podido preguntar a Euskalmet'
                     : cayeron
                       ? `no se ha podido preguntar a ${cayeron} de las ${cs.length} cercanas`
                       : 'ninguna de las cercanas mide viento' };
        }
        return mejor;
      });
      return contestar(res, { ok: euskalmetCaido ? false : true, hayClave: true,
        fuente: 'Euskalmet · Gobierno Vasco',
        consultado: new Date().toISOString(),
        reason: euskalmetCaido
          ? `no he podido leer ninguna de las ${necesarias.length} estaciones de Euskalmet`
          : undefined,
        estacionesLeidas: leidas.size, estacionesPedidas: necesarias.length, estacionesCaidas: fallosRed.size,
        puntos: salida }, segundosDeCache({ leidas: leidas.size, pedidas: necesarias.length, fallosRed: fallosRed.size }));
    } catch (e) {
      return contestar(res, { ok: false, hayClave: true, puntos: [],
                              reason: `${e.message || e} (al hablar con api.euskadi.eus)` }, 0);
    }
  }

  try {
    /* La lista viene de dentro, no de fuera. El 28-08-2026, nada más
       encender la clave, bajarla de opendata.euskadi.eus dio «fetch
       failed» desde Vercel y la pantalla se quedó sin nada teniendo la
       clave bien puesta. Ir a buscar fuera un dato que no cambia es un
       punto de fallo de balde. Ver `estaciones-euskalmet.mjs`. */
    const cerca = ESTACIONES_EUSKALMET
      .map(s => ({ Codigo: s.c, Nombre: s.n, LATWGS84: s.la, LONWGS84: s.lo,
                   km: km(lat, lon, s.la, s.lo) }))
      .filter(s => s.km <= radio)
      .sort((a, b) => a.km - b.km)
      .slice(0, TOPE);

    /* CON `?debug=1` SE CUENTA POR QUÉ SE CAE CADA UNA. Puesto el
       28-08-2026 tras media hora adivinando: la función decía «4
       miradas, 0 lecturas» y no había forma de saber si fallaba la
       ficha, el sensor o la lectura. Un fallo que no se explica cuesta
       más que el fallo. No lleva ningún dato suyo: solo códigos de
       estación y nombres de sensor. */
    /* LAS QUE SE MIRAN Y NO CONTESTAN, SE DICEN. Antes desaparecían sin
       más: de cuatro miradas salían dos y las otras dos se esfumaban, y
       eso se lee como si no existieran. Es la regla de los tres estados
       —hay dato, no hay dato, no se ha podido preguntar— que ya usa el
       pulso del vigilante. Aquí lo mismo: «mirada, no publica viento».
       No lleva nada suyo: nombres de estación y el motivo. */
    const depurar = u.searchParams.get('debug') === '1';
    const notas = [];
    const caidas = [];

    const fallosRed = new Set();
    const resultados = [];
    const aTiempo = await conPlazo(Promise.all(cerca.map(async (s, i) => {
      try {
        const r = await leer(s, jwt, depurar ? notas : null, fallosRed);
        if (!r) caidas.push({ nombre: s.Nombre, km: Math.round(s.km * 10) / 10,
                              porque: fallosRed.has(s.Codigo) ? 'no se ha podido preguntar' : 'no publica viento en esta hora' });
        resultados[i] = r ? { ...r, km: Math.round(s.km * 10) / 10 } : null;
      } catch (e) {
        if (depurar) notas.push(`${s.Codigo}: reventó — ${e.message || e}`);
        fallosRed.add(s.Codigo);
        caidas.push({ nombre: s.Nombre, km: Math.round(s.km * 10) / 10,
                      porque: 'no se ha podido preguntar' });
        resultados[i] = null;
      }
    })), PLAZO_MS);
    if (!aTiempo) cerca.forEach((s, i) => {
      if (resultados[i] !== undefined) return;
      fallosRed.add(s.Codigo); resultados[i] = null;
      caidas.push({ nombre: s.Nombre, km: Math.round(s.km * 10) / 10, porque: `sin respuesta en ${PLAZO_MS / 1000} s` });
    });
    const leidas = resultados;

    const estaciones = leidas.filter(Boolean).sort((a, b) => a.km - b.km);
    return contestar(res, {
      ok: true, hayClave: true,
      fuente: 'Euskalmet · Gobierno Vasco',
      consultado: new Date().toISOString(),
      miradas: cerca.length, estacionesCaidas: fallosRed.size,
      estaciones,
      caidas,
      debug: depurar ? notas : undefined,
      nota: estaciones.length ? undefined
        : 'Ninguna de las estaciones cercanas publica viento en esta hora.',
    }, segundosDeCache({ leidas: estaciones.length, pedidas: cerca.length, fallosRed: fallosRed.size }));
  } catch (e) {
    /* «fetch failed» a secas no dice nada y cuesta media hora. Se pone
       de dónde venía. */
    return contestar(res, { ok: false, hayClave: true, estaciones: [],
                            reason: `${e.message || e} (al hablar con api.euskadi.eus)` }, 0);
  }
}
