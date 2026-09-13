/* ═══════════════════════════════════════════════════════════════════
   EL PARTE DE LA MAÑANA, DESDE EL SERVIDOR
   ───────────────────────────────────────────────────────────────────
   Suyo, 26-08-2026, y es el argumento que lo cambia todo:

     «Lo de los avisos por correo vale, pero si apago el Mac, al garete
      todo. No podemos depender de eso.»

   Tiene razón y era peor de lo que parecía: **el correo también salía
   del Mac.** Las tareas programadas corren dentro de la app de Claude en
   su ordenador. Con el Mac apagado no fallaba el push: no corría NADA.
   El correo no era una red debajo del push — era la misma cuerda.

   Esto corre en el servidor de Vercel. Se dispara solo, una vez al día,
   esté el Mac como esté.

   LO QUE NO PUEDE HACER, y hay que decirlo claro: el plan gratuito de
   Vercel **solo permite una tarea al día**. El vigilante de tormentas
   cada 3 horas sigue dependiendo del Mac hasta que él decida si pasa a
   plan de pago. Aquí no se disimula esa carencia.
   ═══════════════════════════════════════════════════════════════════ */

import webpush from 'web-push';
import { leer, guardar } from './suscribir.mjs';

/* Sus 14 emplazamientos, con las coordenadas que mandó ÉL el 26-08-2026
   con el pin puesto en la caseta. En el mismo orden que ve en la app: de
   Bermeo hacia fuera. */
const SITIOS = [
  { n: 'BERMEO',        lat: 43.412976, lon: -2.718316 },
  { n: 'SOLLUBE',       lat: 43.371057, lon: -2.764068 },
  { n: 'LEKEITIO',      lat: 43.365538, lon: -2.508107 },
  { n: 'MUNGIA',        lat: 43.321116, lon: -2.853362 },
  { n: 'GERNIKA',       lat: 43.31961,  lon: -2.687801 },
  { n: 'SANTAMAÑA',     lat: 43.260131, lon: -2.865452 },
  { n: 'MARKINA',       lat: 43.246233, lon: -2.508439 },
  { n: 'CARRANZA',      lat: 43.24213,  lon: -3.410335 },
  { n: 'OIZ',           lat: 43.22805,  lon: -2.5936   },
  { n: 'ZORNOTZA',      lat: 43.21559,  lon: -2.722825 },
  { n: 'BALMASEDA',     lat: 43.215102, lon: -3.194619 },
  { n: 'MATIENA',       lat: 43.159627, lon: -2.626779 },  // CRÍTICO
  { n: 'ARBAIZA',       lat: 43.047556, lon: -2.931611 },
  { n: 'VIRGEN ORDUÑA', lat: 42.982051, lon: -3.037941 },
];

/* Los mismos listones que usa la app en pantalla. Si se cambian aquí y
   allí no, le diría una cosa el móvil y otra la app. */
const CAPE_MIN = 700;
const TAPA_MAX = 75;

/* DOS MODELOS, no uno. Medido el 26-08-2026: con el Automático solo
   (que en Euskadi es AROME HD, y NO publica la tapa) salían CERO avisos
   el mismo día que ICON daba 8 de 10. El punto ciego de siempre. */
/* TRES MODELOS, NO DOS. Igualado el 27-08-2026 con lo que ya usa la app.

   Estaban en dos —`best_match` e `icon_eu`— mientras la pestaña de Mis
   torres decidía con tres, añadiendo GFS. **El mismo veredicto con dos
   jurados distintos**, y desde hoy la app escribe «1 de 3 que publican la
   tapa» en el parte de pantalla: si aquí solo se preguntara a dos, ese
   recuento sería mentira en el correo.

   MEDIDO ANTES DE PONERLO, sobre sus 15 emplazamientos y 48 horas: con
   dos salían 8 horas de aviso y con tres salen **8**. GFS no añadió ni
   una — o sea que no es un cambio que grite más, es un cambio que hace
   que las dos vías digan lo mismo.

   ECMWF y AROME HD siguen fuera, y no por elección: **no publican la
   tapa**, 0 horas de 24 medidas. Sin tapa no se puede aplicar la regla.  */
const MODELOS = ['best_match', 'icon_eu', 'gfs_seamless'];
/* EL NOMBRE DE CADA MODELO, en una tabla y no en un `if`.

   Al añadir GFS, el `m === 'icon_eu' ? 'ICON' : 'Automático'` que había
   lo habría llamado **«Automático»**: el nombre de un modelo encima de
   los números de otro. Es exactamente el fallo del 24-08-2026 en la
   ficha de Torre, que decía AROME HD y enseñaba datos de ECMWF.       */
const NOMBRE = { best_match: 'Automático', icon_eu: 'ICON', gfs_seamless: 'GFS' };
const nombreDe = m => NOMBRE[m] || m;


const APP = 'https://weather-app-ochre-one-76.vercel.app';

/* Parte una lista de horas sueltas en tramos SEGUIDOS. Dos horas son del
   mismo tramo solo si van una detrás de otra. Sin esto, «las horas que
   cumplen» se leen como un bloque continuo, que es la mentira más fácil
   de contar con un pronóstico. */
const hh = h => String(h).padStart(2, '0') + 'h';

function enTramos(hs) {
  const orden = [...hs].sort((a, b) => a - b);
  const out = [];
  for (const h of orden) {
    const ult = out.at(-1);
    if (ult && h === ult.fin + 1) ult.fin = h;
    else out.push({ ini: h, fin: h });
  }
  return out;
}

/* Cómo se dice un sitio con sus tramos. Si son varios se dicen TODOS: es
   la diferencia entre «no salgas en toda la tarde» y «hay un hueco de
   tres horas en medio», y esa diferencia es la jornada de alguien. */
function tramosTxt(x) {
  const t = (x.tramos || []).map(r => r.ini === r.fin ? hh(r.ini) : `${hh(r.ini)}-${hh(r.fin)}`);
  return t.join(' y ') + (x.sigue ? ` y sigue hasta las ${hh(x.hastaMadrugada)} de mañana` : '');
}

async function unSitio(s) {
  const u = `${APP}/om?api=fc&latitude=${s.lat}&longitude=${s.lon}&timezone=auto`
          + `&hourly=cape,convective_inhibition,precipitation&forecast_days=2`
          /* Explícito a propósito. Iba por defecto sin que nadie lo hubiera
             escrito, y para los sitios de costa «tierra firme más cercana»
             puede caer a 18 km monte adentro. Ver el comentario largo en
             `vigilante.mjs`. El parte se queda en tierra —es lo que toca
             para las horas de trabajo—; quien mira las dos celdas y avisa
             es el vigilante. */
          + `&cell_selection=land`
          + `&models=${MODELOS.join(',')}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${s.n}: la app contesta ${r.status}`);
  const H = (await r.json()).hourly;
  if (!H?.time) throw new Error(`${s.n}: sin datos`);

  /* SE PIDEN DOS DÍAS PARA PODER MIRAR UNO.
     Avisado por la sesión del vigilante el 26-08-2026. Con un solo día,
     una ventana que empieza a las 23:00 se cortaba en seco y el parte
     decía «23h-23h» — cuando lo mismo sigue hasta las dos de la mañana.
     Es el mismo fallo de cruzar la medianoche que ya picó tres veces en
     la app. El parte SIGUE SIENDO DE HOY: el día de mañana solo se mira
     para saber si lo de hoy continúa. */
  const hoy = H.time[0].slice(0, 10);

  /* SE GUARDAN LAS HORAS, NO LOS EXTREMOS.
     Primera versión: `ini` era el mínimo y `fin` el máximo de las horas
     que cumplen. Eso NO es una ventana, son los dos extremos — y un sitio
     que salta a las 14:00 y otra vez a las 23:00, con la tarde limpia en
     medio, salía como «14h-23h»: nueve horas seguidas que no existen.

     Es exactamente el fallo que ya se corrigió en pantalla («cuatro gotas
     de 09:00 a 20:00» eran tres horas sueltas) y que aquí, en el
     servidor, se volvió a colar. Lo cazó la sesión del vigilante
     leyéndolo, no yo probándolo.                                     */
  let capeMax = 0, quien = null, lluvia = 0;
  const horas = new Set();              // horas de HOY que cumplen
  const madrugada = new Set();          // horas de mañana que también cumplen

  for (const m of MODELOS) {
    const cape = H[`cape_${m}`], cin = H[`convective_inhibition_${m}`];
    const pr = H[`precipitation_${m}`];
    if (!cape) continue;
    for (let i = 0; i < H.time.length; i++) {
      const esHoy = H.time[i].slice(0, 10) === hoy;
      if (esHoy && pr && pr[i] > lluvia) lluvia = pr[i];
      const c = cape[i], t = cin?.[i];
      if (c == null || t == null) continue;
      if (c < CAPE_MIN || t >= TAPA_MAX) continue;
      const h = Number(H.time[i].slice(11, 13));
      if (!esHoy) { if (h <= 6) madrugada.add(h); continue; }
      horas.add(h);
      if (c > capeMax) { capeMax = c; quien = nombreDe(m); }
    }
  }

  const tramos = enTramos([...horas]);
  const ultimo = tramos.at(-1) ?? null;

  /* «Sigue» = el día acaba a las 23:00 cumpliendo Y la medianoche de
     mañana también. Las 23:00 y las 00:00 SON horas seguidas, así que
     enlazan aunque las 22:00 estén limpias: un pico suelto a las 23:00
     que empalma con la madrugada es un episodio real, no un artefacto.

     AVISO PARA QUIEN LO LEA: aquí había escrito que esto se medía
     «contra el último tramo, no contra la hora más tardía suelta», como
     si fueran cosas distintas. **No lo son**: con las horas ordenadas,
     el último tramo acaba siempre en el máximo. Lo cazó otra sesión el
     26-08-2026 y está comprobado con cinco casos. El código estaba bien;
     lo que mentía era el comentario — y estos comentarios son lo que lee
     el siguiente que llegue. */
  const sigue = !!ultimo && ultimo.fin === 23 && madrugada.has(0);
  let hastaMadrugada = null;
  if (sigue) { let h = 0; while (madrugada.has(h + 1)) h++; hastaMadrugada = h; }

  return { n: s.n, salta: tramos.length > 0, tramos, capeMax, quien, lluvia,
           sigue, hastaMadrugada };
}

export default async function handler(req, res) {
  /* Vercel manda `Authorization: Bearer <CRON_SECRET>` si está puesto.
     Sin esto, cualquiera podría dispararle el parte a cualquier hora. */
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.authorization !== `Bearer ${secreto}`) {
    return res.status(401).json({ error: 'sin permiso' });
  }

  const hechos = await Promise.all(SITIOS.map(s =>
    unSitio(s).catch(e => ({ n: s.n, fallo: String(e.message || e) }))));

  const fallos = hechos.filter(x => x.fallo);
  const buenos = hechos.filter(x => !x.fallo);
  const saltan = buenos.filter(x => x.salta);
  const mojan = buenos.filter(x => !x.salta && x.lluvia >= 0.2);


  let cuerpo;
  if (saltan.length) {
    cuerpo = saltan.slice(0, 5).map(x => `${x.n} ${tramosTxt(x)}`).join(' · ')
           + (saltan.length > 5 ? ` y ${saltan.length - 5} más` : '')
           + (mojan.length ? `. Lluvia en ${mojan.length} más.` : '');
  } else if (mojan.length) {
    cuerpo = `Sin riesgo de rayo. Llueve en ${mojan.length}: `
           + mojan.slice(0, 5).map(x => x.n).join(', ') + '.';
  } else {
    /* «Día limpio» es una afirmación fuerte. Si hay sitios sin mirar, el
       número solo no basta: se dice en la misma frase, no en un añadido
       al final que se lee después de haberse quedado tranquilo. */
    cuerpo = fallos.length
      ? `Ni rayo ni lluvia que moje en los ${buenos.length} que he podido mirar.`
      : `Día limpio en los ${buenos.length}: ni rayo ni lluvia que moje.`;
  }

  /* LOS FALLOS SE DICEN. Un parte que se calla los sitios que no ha
     podido mirar se lee como «esos están bien», y no es verdad. */
  if (fallos.length) {
    cuerpo += ` ⚠ No he podido mirar ${fallos.length}: ${fallos.map(f => f.n).join(', ')}.`;
  }

  const titulo = saltan.length
    ? `Parte de hoy · riesgo de rayo en ${saltan.length} de ${buenos.length}`
    : `Parte de hoy · sin riesgo de rayo`;

  /* MATIENA ES CRÍTICO. Dicho por él: de ese depende servicio. Si salta,
     va el primero y con su nombre en el título. */
  const critico = saltan.find(x => x.n === 'MATIENA');
  const tit = critico
    ? `Parte de hoy · MATIENA ${tramosTxt(critico)} · ${saltan.length} de ${buenos.length}`
    : titulo;

  const { VAPID_PUBLICA, VAPID_PRIVADA, VAPID_CONTACTO } = process.env;
  let enviados = 0, muertos = [];
  if (VAPID_PUBLICA && VAPID_PRIVADA) {
    webpush.setVapidDetails(VAPID_CONTACTO || 'mailto:pentxa@gmail.com', VAPID_PUBLICA, VAPID_PRIVADA);
    const aparatos = await leer();
    const carga = JSON.stringify({ titulo: tit, cuerpo, tag: 'parte',
                                   enviado: new Date().toISOString() });
    await Promise.all(aparatos.map(async a => {
      try { await webpush.sendNotification({ endpoint: a.endpoint, keys: a.keys }, carga, { TTL: 6 * 3600 }); enviados++; }
      catch (e) { if (e?.statusCode === 404 || e?.statusCode === 410) muertos.push(a.endpoint); }
    }));
    if (muertos.length) await guardar(aparatos.filter(a => !muertos.includes(a.endpoint)));
  }

  /* ── Y DE PASO, UNA PASADA DEL VIGILANTE ──────────────────────────
     Puesto el 27-08-2026, después de comprobar una cosa incómoda: el
     «vigilante del servidor» NO era independiente. Vercel en plan gratis
     da **un cron al día** y está gastado en este parte, así que
     `/api/vigilante` solo corría cuando lo llamaba SU MAC. Con el Mac
     apagado —o con una ventana de permiso bloqueando la tarea— no
     vigilaba nadie, y hasta hoy ni se notaba.

     Sus palabras esa tarde: *«si me voy a la calle y me estáis esperando
     para que yo le dé a permitir, no avanzamos»*.

     Esto no arregla las 24 horas, y no se vende como que las arregla:
     **garantiza UNA pasada al día que no depende de él**, y deja el
     estado fresco para que la comparación de la siguiente sirva. Lo que
     falta para cubrirlo entero es GitHub Actions, que es suyo.

     Va DESPUÉS de mandar el parte y en su propio `try`: si el vigilante
     falla, el parte ya ha salido. Nunca al revés.                     */
  let vigilante = null;
  try {
    const base = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
    const r = await fetch(`${base}/api/vigilante`, {
      method: 'POST',
      headers: { 'x-clave': process.env.CRON_SECRET || '' },
    });
    const j = await r.json().catch(() => null);
    vigilante = r.ok
      ? { ok: true, mirados: j?.mirados ?? null, inminentes: j?.inminentes?.length ?? 0, mudo: !!j?.mudo }
      : { ok: false, estado: r.status };
  } catch (e) {
    /* Se DICE que no se pudo, no se calla. Un vigilante que no ha pasado
       y nadie lo cuenta es el fallo de siempre por la puerta de atrás. */
    vigilante = { ok: false, error: String(e?.message || e).slice(0, 120) };
  }

  return res.status(200).json({ ok: true, titulo: tit, cuerpo, enviados,
                                saltan: saltan.length, fallos: fallos.map(f => f.n),
                                vigilante });
}
