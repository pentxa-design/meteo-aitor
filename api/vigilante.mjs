/* ═══════════════════════════════════════════════════════════════════
   EL VIGILANTE DE TORMENTAS, EN EL SERVIDOR
   ───────────────────────────────────────────────────────────────────
   Suyo, 26-08-2026:

     «Lo de los avisos por correo vale, pero si apago el Mac, al garete
      todo. No podemos depender de eso.»

   El vigilante vivía dentro de la app de Claude en su Mac. Con el
   ordenador apagado no salía nada: ni push ni correo. Esto corre en
   Vercel y no sabe si su Mac existe.

   NO SE DISPARA SOLO: el plan gratuito de Vercel solo permite UNA tarea
   al día, y esa la gasta el parte de las 06:30. A esto lo llama algo de
   fuera cada pocas horas. Da igual quién: lo único que hace falta es la
   clave.

   DOS HORIZONTES, que es lo que él pidió:
     · lo inminente — la hora en curso y las 3 siguientes
     · lo que ha CAMBIADO respecto a la pasada anterior, mirando el día
       entero y el de mañana

   Y LA REGLA QUE MANDA SOBRE TODAS: **si no hay nada, se calla.** Un
   vigilante que avisa todos los días se deja de leer, y entonces no
   sirve el día que acierta.
   ═══════════════════════════════════════════════════════════════════ */

import webpush from 'web-push';
import { leerJSON, guardarJSON } from '../lib/almacen.mjs';
import { leer, guardar } from './suscribir.mjs';

const ESTADO = 'avisos/vigilante.json';
const APP = 'https://weather-app-ochre-one-76.vercel.app';
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

/* ── PARA EL AGUA, TAMBIÉN EL EUROPEO ────────────────────────────────
   Añadido el 30-08-2026, y lo destapó un sirimiri de verdad.

   Ese día en Bermeo cayó sirimiri dos veces —gotitas hacia las 12:30 y
   una tanda de 14:00 a 15:30, contado por él desde la calle— y este
   vigilante NO avisó. No por el umbral (AGUA_MIN ya estaba en 0,3):
   porque **los tres modelos de su lista daban CERO todo el episodio**
   y el único que lo veía —ECMWF, 0,2 subiendo a 0,4 justo cuando
   apretaba— no estaba invitado.

   Y era la segunda vez: el 26-08 a las 19:00, con él mirando llover,
   solo ECMWF la vio. Ya estaba escrito «el sirimiri solo lo ve ECMWF»
   y el vigilante seguía sin mirarlo.

   Suyo, ese mismo día: *«necesito que acierten sobre todo si va a
   llover o no para poder subir a las torres»*.

   SOLO para el agua. En la tormenta ECMWF no entra: no publica la tapa
   y la regla CAPE+tapa necesita las dos cosas del mismo modelo. */
const MODELOS_AGUA = [...MODELOS, 'ecmwf_ifs025'];
/* EL NOMBRE DE CADA MODELO, en una tabla y no en un `if`.

   Al añadir GFS, el `m === 'icon_eu' ? 'ICON' : 'Automático'` que había
   lo habría llamado **«Automático»**: el nombre de un modelo encima de
   los números de otro. Es exactamente el fallo del 24-08-2026 en la
   ficha de Torre, que decía AROME HD y enseñaba datos de ECMWF.       */
const NOMBRE = { best_match: 'Automático', icon_eu: 'ICON', gfs_seamless: 'GFS', ecmwf_ifs025: 'ECMWF' };
const nombreDe = m => NOMBRE[m] || m;

/* ── EL AGUA, QUE ES LO QUE DECIDE SU DÍA ─────────────────────────────
   Suyo, 29-08-2026 por la mañana: *«¿y el vigilante no avisa que viene
   lluvia? sería interesante»*. Y lleva razón: hasta hoy este vigilante
   solo miraba el rayo, que es su veto pero pasa cuatro días al año.
   **El 90 % de su trabajo es a ras de suelo** —caseta, contadores,
   fusibles del CGP a metro y medio, armarios de intemperie— y ahí manda
   el agua. Suyo también: *«a partir de octubre aquí no para de llover»*.

   DOS LISTONES, Y LOS DOS SALEN DE LA APP, no de mi cabeza:

     0,3 mm/h  hay agua de verdad. **MEDIDO antes de elegir el número**,
               el 29-08 —día de sol y cielo azul— en 8 de sus sitios por
               3 modelos y 48 horas:

                   0,1 mm ... 47 horas
                   0,2 mm ...  8 horas
                   0,3 mm ...  ninguna

               O sea que **0,1 es ruido de fondo**: con ese listón le
               llegaría un aviso de lluvia un día despejado, y a la
               segunda vez dejaría de leerlos. 0,3 es el primer valor que
               un día seco no aparece, y queda por debajo del sirimiri de
               **0,4 mm** que el 26-08 en Bermeo vio solo ECMWF y que
               **estaba cayendo de verdad**.
     2,0 mm/h  «llueve bien» — es su `LLUVIA_FUERTE` de la app, el mismo
               número que usa el semáforo para frenarle.

   Y SE AVISA COMO CON EL RAYO: solo de lo que CAMBIA. Que aparezca agua
   donde no la había, que pase a fuerte, o que se adelante dos horas o
   más. Nunca del vaivén de milímetros — en octubre eso sería un aviso
   cada tres horas y **una app que grita se deja de creer**. */
const AGUA_MIN = 0.3;
const AGUA_FUERTE = 2.0;

/* ── Y LA RACHA QUE LE VUELCA EL COCHE ────────────────────────────────
   Suyo, la misma mañana: *«y que avise de rachas superiores a 70 km/h
   también y estamos cubiertos»*.

   70 es el mismo `TOPE_ACCESO` que ya usa la app, y sale de una frase
   suya: *«si hay unas rachas de 70 puedo volcar con el 4x4, espero a que
   amaine»*. Ojo con lo que significa: **no es el listón de la torre**
   —ese es 60 y decide si se SUBE— sino el del VIAJE. Con 70 no es que no
   se suba: es que no se va.

   Lo escribió como «kts», pero 70 nudos son 130 km/h y ese no es ningún
   listón suyo. Se toma en km/h, que es como pide siempre sus números, y
   se le dijo al contestarle. */
const RACHA_TOPE = 70;

/* Dos puntos a menos de 300 m son el mismo emplazamiento: sirve para
   arrastrar la marca de «crítico» a la lista que viene de la app, que no
   la trae. */
const cerca = (a, b) => Math.hypot((a.lat - b.lat) * 111.32,
  (a.lon - b.lon) * 111.32 * Math.cos(a.lat * Math.PI / 180)) < 0.3;

const CAPE_MIN = 700;
const TAPA_MAX = 75;

/* ── LA LISTA DE ABAJO YA NO MANDA: MANDA LA SUYA ─────────────────────
   Cazado el 29-08-2026, y él lo llamó por su nombre: *«pues error grave,
   ¿no?»* · *«menudo plan»*. Tenía razón.

   Esta lista estaba escrita a mano y **él añade emplazamientos desde la
   app**. Ese día se vio que el vigilante miraba **catorce** y él tenía
   **dieciocho** guardados: Zeberio, Lemona, Punta Galea y Amurrio
   llevaban días **sin que nadie los mirara**, y en la app se pintaban
   igual que los demás, con su semáforo y su ficha.

   Lo grave no es el despiste: es la FORMA. **El desajuste se creaba
   solo** cada vez que él añadía uno, sin que nadie tocara nada, y no
   había ninguna señal. Es el fallo de siempre de esta casa —lo que no se
   mira se ve igual que lo que está tranquilo— pero fabricándose solo.

   Ahora el vigilante **lee su lista de verdad**, la misma que guarda la
   app en `/api/torres`. Si mañana añade otro, se vigila sin que nadie
   haga nada.

   La lista de abajo se queda **solo como red**: si el servidor no
   contesta, se mira eso antes que no mirar nada. Y cuando se usa la red
   en vez de la suya, SE DICE en la respuesta (`listaDeRespaldo: true`):
   un vigilante mirando la lista vieja no puede parecer uno al día. */
const SITIOS = [
  { n: 'BERMEO',        lat: 43.412976, lon: -2.718316 },
  { n: 'SOLLUBE',       lat: 43.371057, lon: -2.764068 },
  { n: 'LEKEITIO',      lat: 43.365538, lon: -2.508107 },
  { n: 'MUNGIA',        lat: 43.321116, lon: -2.853362 },
  { n: 'GERNIKA',       lat: 43.31961,  lon: -2.687801 },
  /* CRÍTICO. Suyo, 29-08-2026: *«BI_SANTAMAÑA es un crítico muy
     importante que tenemos»*. Hasta hoy solo MATIENA lo estaba, así que
     Santamaña no entraba en el titular del aviso ni forzaba el correo
     cuando fallaba su lectura. */
  { n: 'SANTAMAÑA',     lat: 43.260131, lon: -2.865452, critico: true },
  { n: 'MARKINA',       lat: 43.246233, lon: -2.508439 },
  { n: 'CARRANZA',      lat: 43.24213,  lon: -3.410335 },
  { n: 'OIZ',           lat: 43.22805,  lon: -2.5936   },
  { n: 'ZORNOTZA',      lat: 43.21559,  lon: -2.722825 },
  { n: 'BALMASEDA',     lat: 43.215102, lon: -3.194619 },
  { n: 'MATIENA',       lat: 43.159627, lon: -2.626779, critico: true },
  { n: 'ARBAIZA',       lat: 43.047556, lon: -2.931611 },
  { n: 'VIRGEN ORDUÑA', lat: 42.982051, lon: -3.037941 },

  /* ── LOS CINCO QUE FALTABAN ─────────────────────────────────────────
     Encontrado el 29-08-2026 al ir a meter GALDAMES: el vigilante miraba
     **catorce** y él tenía **diecinueve** en favoritos. O sea que cuatro
     emplazamientos suyos —los que fue añadiendo esta semana— **no los
     vigilaba nadie**, y en la app se veían igual que los demás.

     Es el fallo de siempre con otra ropa: **lo que no se mira se ve
     igual que lo que está tranquilo**. Y aquí encima el desajuste se
     creaba solo, cada vez que él añadía uno a favoritos.

     Las coordenadas salen de SU PROPIA PLANTA (`data/estaciones.json`,
     los 364 sitios de Vantage), no de ningún sitio inventado.

     ── SALVO GALDAMES, Y MENOS MAL QUE MANDÓ EL MAPA ───────────────────
     Dijo *«está justo en Pico Ubieta»* y mandó un enlace de Maps. Las
     dos coordenadas están a **155 m** una de otra, así que parecía lo
     mismo. No lo es:

         planta      43,2411   / −3,122436  ->  **486 m**
         su enlace   43,239979 / −3,123619  ->  **619 m**

     **133 metros de desnivel en 155 de distancia**: es una ladera, y el
     punto de la planta cae por debajo. El suyo cuadra con el Pico
     Ubieta; el de la planta, no.

     Gana el suyo. Y queda apuntado que **la planta puede estar mal en un
     sitio concreto**: cuando él mande un mapa, ese manda. */
  { n: 'GALDAMES',      lat: 43.239979, lon: -3.123619 },
  { n: 'ZEBERIO',       lat: 43.1385,   lon: -2.906    },
  { n: 'LEMONA',        lat: 43.2169,   lon: -2.773    },
  { n: 'PUNTA GALEA',   lat: 43.3725,   lon: -3.0214   },
  { n: 'AMURRIO',       lat: 43.0888,   lon: -2.999    },
];

const hh = h => String(h).padStart(2, '0') + 'h';
/* «de 18h a 18h» no es un tramo: una sola hora se dice «a las 18h» (§11 del
   guion del domingo, 13-09-2026; le llegó «racha de 71 km/h de 18h a 18h»). */
const tramoTxt = (ini, fin) => (ini === fin ? `a las ${hh(ini)}` : `de ${hh(ini)} a ${hh(fin)}`);
/* LOS TRAMOS DE VERDAD, NO LOS EXTREMOS DEL DÍA. `enTramos()` se calculaba
   para el agua y la racha desde el 26-08 y NO LO USABA NADIE: todos los
   avisos escribían `tramoTxt(ini, fin)`, o sea el primer hueco y el último.
   Con horas a las 04, 05, 21 y 22 salía «de 04h a 22h»: dieciocho horas que
   nadie ha dicho. El comentario de `enTramos` ya lo advertía, y el arreglo
   estaba escrito a medias (20-09-2026). */
const tramosTxt = (t, ini, fin) => (Array.isArray(t) && t.length
  ? t.map(r => tramoTxt(r.ini, r.fin)).join(' y ')
  : tramoTxt(ini, fin));
/* Y la hora del pico se dice aparte, porque el máximo del día casi nunca
   cae en la primera hora del tramo. */
const picoTxt = (hPico, ini) => `a las ${hh(hPico ?? ini)}`;
const rangoTxt = (ini, fin) => (ini === fin ? hh(ini) : `${hh(ini)}-${hh(fin)}`);

/* Parte horas sueltas en tramos SEGUIDOS. Sin esto, un sitio que salta a
   las 14:00 y otra vez a las 23:00 sale como «14h-23h»: nueve horas que
   no existen. */
function enTramos(hs) {
  const out = [];
  for (const h of [...hs].sort((a, b) => a - b)) {
    const u = out.at(-1);
    if (u && h === u.fin + 1) u.fin = h;
    else out.push({ ini: h, fin: h });
  }
  return out;
}

/* ── EL EPISODIO NO ACABA DONDE ACABA LA CONSULTA ─────────────────────
   Avisado por la sesión del vigilante el 26-08-2026, y era grave:

   > Escribí «MATIENA y OIZ hasta las 23:00» porque la ventana de aviso
   > acaba a las 23:00. El episodio cruza la medianoche: MATIENA a las
   > 00:00 con CAPE 1250 y **la tapa en 23** — más abierta que a las
   > 23:00, que tenía 34. La peor hora cae DESPUÉS de medianoche.

   Es el mismo fallo que el de los extremos, en otra forma: **leer los
   bordes de la ventana de consulta como si fueran los bordes del
   fenómeno**. Si le llaman a las 00:30 y se fía de un aviso que decía
   «hasta las 23:00», sale de casa creyendo que ha pasado.

   Ese día salió TRES veces: en el parte del servidor, en un
   «MARKINA tranquilo» de la mañana, y aquí.                          */
function cuandoTxt(d, claveHoy, claveManana) {
  const hoy = d.dias[claveHoy];
  if (!hoy) return '';
  const t = (hoy.tramos || []).map(r => r.ini === r.fin ? hh(r.ini) : `${hh(r.ini)}-${hh(r.fin)}`).join(' y ');

  /* ¿Enlaza con mañana? Las 23:00 y las 00:00 son horas seguidas. */
  const man = d.dias[claveManana];
  const ultimo = (hoy.tramos || []).at(-1);
  if (!man || !ultimo || ultimo.fin !== 23) return t;
  const deMadrugada = (man.tramos || []).find(r => r.ini === 0);
  if (!deMadrugada) return t;
  return `${t} y SIGUE hasta las ${hh(deMadrugada.fin)} de mañana`;
}

/* Devuelve, por día, las horas en que se juntan gasolina y tapa abierta.
   Se mira MODELO A MODELO y se queda con la unión: si uno solo lo ve,
   cuenta. Medido el 26-08: con el Automático solo salían 0 avisos el día
   que ICON daba 8 de 10, porque AROME HD no publica la tapa. */
/* DOS CELDAS, NO UNA. Añadido el 27-08-2026.

   Hasta hoy esto pedía los datos sin decir qué celda quería, así que
   Open-Meteo usaba `land` por defecto: busca TIERRA FIRME. Y para un
   sitio pegado al agua, la tierra firme más cercana puede caer lejos —
   en BI BERMEO, ECMWF lee a 18,3 km, en los montes entre Gernika y
   Durango. La app enseñaba CAPE 20 para Bermeo cuando ECMWF daba 1.110
   EN Bermeo. Lo destapó Aitor mandando los mapas de superficie de
   AguaceroWx, que sí interpolan en el punto.

   Aquí se cogen las DOS y se unen las horas, que es lo mismo que ya se
   hacía con los modelos: si una sola lo ve, cuenta. Para avisar, el
   fallo caro es el que se calla.

   MEDIDO ANTES DE PONERLO, sobre sus 15 emplazamientos y 48 horas:
   con la celda de tierra salían 8 horas de aviso y con las dos salen
   10. **Dos horas más en dos días**, y las dos en la costa —Bermeo a
   las 18h y Lekeitio a las 21h—, que es justo donde estaba el agujero.
   No es ruido: es lo que faltaba. */
async function unSitio(s) {
  const pide = async cel => {
    const u = `${APP}/om?api=fc&latitude=${s.lat}&longitude=${s.lon}&timezone=auto`
            + `&hourly=cape,convective_inhibition,precipitation,wind_gusts_10m&forecast_days=2`
            + `&cell_selection=${cel}&models=${MODELOS_AGUA.join(',')}`;
    const r = await fetch(u);
    if (!r.ok) throw new Error(`la app contesta ${r.status}`);
    return (await r.json()).hourly;
  };
  const H = await pide('land');
  if (!H?.time) throw new Error('sin datos');
  /* La de al lado es opcional: si falla, se sigue con la de tierra y no
     se pierde ningún aviso de los de siempre. */
  let C = null;
  try { C = await pide('nearest'); } catch { C = null; }

  const porDia = {};                       // '2026-08-26' -> {horas:Set, cape, quien}
  for (const [H_, deLado] of [[H, false], [C, true]]) {
    if (!H_?.time) continue;
    for (const m of MODELOS) {
      const cape = H_[`cape_${m}`], cin = H_[`convective_inhibition_${m}`];
      if (!cape || !cin) continue;
      for (let i = 0; i < H_.time.length; i++) {
        const c = cape[i], t = cin[i];
        if (c == null || t == null || c < CAPE_MIN || t >= TAPA_MAX) continue;
        const dia = H_.time[i].slice(0, 10), h = Number(H_.time[i].slice(11, 13));
        const d = porDia[dia] ??= { horas: new Set(), cape: 0, quien: null, deLado: false };
        d.horas.add(h);
        if (c > d.cape) {
          d.cape = Math.round(c);
          d.quien = nombreDe(m) + (deLado ? ' (celda de al lado)' : '');
          d.deLado = deLado;
        }
      }
    }
  }
  /* El agua, con la misma forma que el rayo para poder compararla igual.
     Se queda el modelo que MÁS ve, nunca la media: el 26-08 la media de
     0,4 · 0 · 0 habría dado 0,1 y se habría leído «no llueve». */
  const aguaDia = {};
  for (const [H_, deLado] of [[H, false], [C, true]]) {
    if (!H_?.time) continue;
    for (const m of MODELOS_AGUA) {
      const mm = H_[`precipitation_${m}`];
      if (!mm) continue;
      for (let i = 0; i < H_.time.length; i++) {
        const v = mm[i];
        if (v == null || v < AGUA_MIN) continue;
        const dia = H_.time[i].slice(0, 10), h = Number(H_.time[i].slice(11, 13));
        const g = aguaDia[dia] ??= { horas: new Set(), mm: 0, quien: null };
        g.horas.add(h);
        if (v > g.mm) { g.mm = v; g.hPico = h; g.quien = nombreDe(m) + (deLado ? ' (celda de al lado)' : ''); }
      }
    }
  }
  /* La racha, igual: el modelo que MÁS da, nunca la media. A 10 m, que
     es lo que publican todos y es la altura del coche y de la caseta —
     para la torre ya está la app, que la sube a su altura de trabajo. */
  const rachaDia = {};
  for (const [H_, deLado] of [[H, false], [C, true]]) {
    if (!H_?.time) continue;
    for (const m of MODELOS) {
      const g = H_[`wind_gusts_10m_${m}`];
      if (!g) continue;
      for (let i = 0; i < H_.time.length; i++) {
        const v = g[i];
        if (v == null || v < RACHA_TOPE) continue;
        const dia = H_.time[i].slice(0, 10), h = Number(H_.time[i].slice(11, 13));
        const r = rachaDia[dia] ??= { horas: new Set(), kmh: 0, quien: null };
        r.horas.add(h);
        /* Y LA HORA DEL PICO. Encontrado el 20-09-2026: `kmh` era el máximo
           del día y `ini` la PRIMERA hora que pasaba de 70, y el parte de la
           mañana los pegaba: con 71 a las 07, 94 a las 17 y 88 a las 18
           escribía «lo peor OIZ 94 km/h a las 07h». Eso no lo ha dicho ningún
           modelo, y él manda la cuadrilla a las siete creyendo que lo peor ya
           ha pasado. La app cliente sí guarda la hora del pico; el servidor
           no. */
        if (v > r.kmh) { r.kmh = v; r.hPico = h; r.quien = nombreDe(m) + (deLado ? ' (celda de al lado)' : ''); }
      }
    }
  }
  const racha = {};
  for (const [dia, r] of Object.entries(rachaDia)) {
    const hs = [...r.horas].sort((a2, b2) => a2 - b2);
    racha[dia] = { ini: hs[0], fin: hs.at(-1), tramos: enTramos(hs),
                   kmh: Math.round(r.kmh), hPico: r.hPico, quien: r.quien };
  }

  const agua = {};
  for (const [dia, g] of Object.entries(aguaDia)) {
    const hs = [...g.horas].sort((a2, b2) => a2 - b2);
    agua[dia] = { ini: hs[0], fin: hs.at(-1), tramos: enTramos(hs),
                  mm: Math.round(g.mm * 10) / 10, hPico: g.hPico, quien: g.quien,
                  fuerte: g.mm >= AGUA_FUERTE };
  }

  const dias = {};
  for (const [dia, d] of Object.entries(porDia)) {
    const hs = [...d.horas].sort((a, b) => a - b);
    /* `ini` y `fin` se quedan porque la comparación entre pasadas los usa.
       Pero NO son la ventana: son los extremos. Lo que se le enseña son
       los `tramos`, que sí están comprobados como horas seguidas. */
    dias[dia] = { ini: hs[0], fin: hs.at(-1), tramos: enTramos(hs),
                  cape: d.cape, quien: d.quien, deLado: !!d.deLado };
  }
  /* lat/lon viajan para que el aviso pueda abrir ESE emplazamiento */
  return { n: s.n, lat: s.lat, lon: s.lon, critico: !!s.critico, dias, agua, racha, horas: H.time };
}

/* Por la única puerta. Aquí el `null` de «no existe» y el `null` de «no
   he podido leer» significaban lo MISMO, y no lo son: con el segundo el
   vigilante se cree que arranca de cero y no avisa de ningún cambio. Se
   distinguen, y quien llama enciende el modo ciego a sabiendas. */
async function leerEstado() {
  return (await leerJSON(ESTADO, null)).dato;
}
const guardarEstado = e => guardarJSON(ESTADO, e);

/* AVISOS DE TODA ESPAÑA: FUERA DEL VIGILANTE (17-09-2026, 10:35). Se
   montó a las 09:50 (aviso al móvil de los naranjas y rojos de AEMET de
   todo el país, solo información) y él lo quitó una hora después, en
   sus palabras: «si me va a gastar créditos en Vercel no me interesa, que
   luego me quedo sin avisos como pasó hace un mes» · «prefiero los datos
   actualizados en mis sitios que no me gaste créditos por España entera,
   que al final solo era para info» · «no me la juego» · «prefiero para
   mis avisos». Eran 24 lecturas al día (0,1 % del plan gratuito), pero
   la decisión es suya y es la buena: esto está hecho para su trabajo,
   no para hobby. Queda solo el apartado de la pestaña Avisos, que se lee
   ÚNICAMENTE cuando él abre la pestaña. El vigilante no toca España. */

async function empujar(titulo, cuerpo, tag, importante, url) {
  const { VAPID_PUBLICA, VAPID_PRIVADA, VAPID_CONTACTO } = process.env;
  if (!VAPID_PUBLICA || !VAPID_PRIVADA) return { enviados: 0, nota: 'sin claves de firma' };
  webpush.setVapidDetails(VAPID_CONTACTO || 'mailto:pentxa@gmail.com', VAPID_PUBLICA, VAPID_PRIVADA);
  /* «No he podido leer la lista» NO es «no hay móviles apuntados». Con el
     almacén suspendido (01-09-2026) esto decía lo segundo, que es mentira
     y de las que tranquilizan: él tiene su teléfono apuntado. */
  let aparatos;
  try { aparatos = await leer(); }
  catch (e) {
    return { enviados: 0, ciego: true,
             nota: 'NO he podido leer la lista de móviles: ' + String(e?.message || e).slice(0, 80) };
  }
  if (!aparatos.length) return { enviados: 0, nota: 'ningún móvil apuntado' };
  /* El aviso lleva A DÓNDE mirar: al emplazamiento del que habla, o a
     «Mis estaciones» cuando afecta a varios. Sin esto, avisaba de Gernika
     y abría la pantalla de Bermeo (01-09-2026, cazado por él). */
  const carga = JSON.stringify({ titulo, cuerpo, tag, importante,
                                 url: url || './', enviado: new Date().toISOString() });
  let enviados = 0; const muertos = [];
  await Promise.all(aparatos.map(async a => {
    try { await webpush.sendNotification({ endpoint: a.endpoint, keys: a.keys }, carga, { TTL: 3600 }); enviados++; }
    catch (e) { if (e?.statusCode === 404 || e?.statusCode === 410) muertos.push(a.endpoint); }
  }));
  /* Igual que en `avisar.mjs`: limpiar la lista es tarea de mantenimiento
     y NUNCA puede tumbar el aviso. Con el almacén suspendido esto lanzaba
     y se caía la pasada entera (01-09-2026, visto en el log de Vercel). */
  if (muertos.length) {
    try { await guardar(aparatos.filter(a => !muertos.includes(a.endpoint))); }
    catch { /* se dirá en el resultado; el aviso ya ha salido */ }
  }
  return { enviados, deBaja: muertos.length };
}


/* ═══════════════════════════════════════════════════════════════════
   EL MARCADOR SE LLENA SOLO, SIN QUE ÉL ABRA LA APP
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026: *«que cada uno en lo suyo, el mejor en los
   modelos»* — que cada dato lo dé el que mejor lo hace.

   Y eso no se decide a ojo. Se mide: modelo contra estación de verdad,
   en SUS montes, durante semanas. Ya existía el sitio donde apuntarlo
   —`api/marcador.mjs`— y estaba prácticamente vacío: **3 muestras**.

   El porqué, encontrado ese día: el marcador **solo se llenaba cuando
   él abría la app**. Si no la abría, nadie medía. Y para elegir modelo
   hacen falta cientos de casos, no los tres ratos que mire el móvil.

   Ahora lo apunta el vigilante, lanzado por cron-job.org, sin depender de
   su Mac ni de que abra nada. OJO con el número de muestras: desde la
   cadencia verde/ámbar/rojo del 13-09-2026 un día tranquilo da ~12 rondas
   (una cada 2 h) y no las 48 de antes; los días movidos siguen dando 48.

   ── LO QUE NO PUEDE PASAR ──
   Esto es un cuaderno de fondo. **Jamás puede estropear un aviso.** Va
   al final, con el fallo tragado y sin bloquear: si las estaciones no
   contestan, no se apunta y ya está. Un aviso de tormenta que no sale
   por culpa de una estadística sería un cambio a peor.
   ═══════════════════════════════════════════════════════════════════ */
const MODELOS_MARCADOR = [
  ['ECMWF', 'ecmwf_ifs025'],
  ['AROME HD', 'meteofrance_arome_france_hd'],
  ['ARPEGE', 'meteofrance_arpege_europe'],
  ['ICON', 'icon_seamless'],
  ['GFS', 'gfs_seamless'],
  ['Automático', 'best_match'],
];

/** La hora local en el formato que espera el marcador: 'AAAA-MM-DDTHH'. */
const horaLocal = iso => {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  return `${p.year}-${p.month}-${p.day}T${p.hour}`;
};

async function apuntarEnElMarcador(sitios) {
  /* Las estaciones cerca de sus emplazamientos, de una vez. */
  const puntos = sitios.slice(0, 20).map(s => `${s.lat},${s.lon}`).join('|');
  const rEst = await fetch(`${APP}/api/euskalmet?puntos=${encodeURIComponent(puntos)}&radio=15`);
  if (!rEst.ok) throw new Error(`estaciones ${rEst.status}`);
  const est = (await rEst.json()).puntos || [];

  /* Una muestra por ESTACIÓN, no por emplazamiento: varios sitios suyos
     comparten la estación más cercana y contarla varias veces inflaría
     el resultado de quien acierte ahí. */
  const unicas = new Map();
  for (const e of est) {
    if (!e?.id || !Number.isFinite(e.lat)) continue;
    /* Una medida de hace dos horas no dice nada de la hora en curso. */
    if (Number.isFinite(e.haceMinutos) && e.haceMinutos > 75) continue;
    if (!unicas.has(e.id)) unicas.set(e.id, e);
  }
  if (!unicas.size) return { apuntadas: 0, nota: 'ninguna estación con dato fresco' };

  const muestras = [];
  for (const e of [...unicas.values()].slice(0, 8)) {
    /* Los modelos EN LA ESTACIÓN, no en el emplazamiento: comparar el
       pronóstico de un cordal contra un aparato del valle no mide al
       modelo, mide el desnivel. */
    const u = `${APP}/om?api=fc&latitude=${e.lat}&longitude=${e.lon}&timezone=Europe%2FMadrid`
            + `&hourly=wind_gusts_10m,precipitation,temperature_2m&forecast_days=1`
            + `&cell_selection=land&models=${MODELOS_MARCADOR.map(m => m[1]).join(',')}`;
    let H;
    try {
      const r = await fetch(u);
      if (!r.ok) continue;
      H = (await r.json()).hourly;
    } catch { continue; }
    if (!H?.time) continue;

    const hora = horaLocal(e.medidoEn);
    const i = H.time.findIndex(t => t.slice(0, 13) === hora);
    if (i < 0) continue;

    const dato = (campo) => {
      const o = {};
      for (const [nom, om] of MODELOS_MARCADOR) {
        const v = H[`${campo}_${om}`]?.[i];
        if (v !== null && v !== undefined && !Number.isNaN(v)) o[nom] = v;
      }
      return o;
    };

    const comun = { estacion: e.nombre, altitud: e.altitud, hora,
                    red: e.fuente || 'Euskalmet', haceMinutos: e.haceMinutos };

    const mr = dato('wind_gusts_10m');
    if (Number.isFinite(e.racha) && Object.keys(mr).length >= 2)
      muestras.push({ ...comun, magnitud: 'racha', medido: e.racha, modelos: mr });

    /* La humedad viaja con el agua: un pluviómetro marcando cero con el
       91 % de humedad puede ser sirimiri de verdad, y sin este dato el
       marcador premiaría al modelo que no lo ve. Ver `marcador.mjs`. */
    const ml = dato('precipitation');
    if (Number.isFinite(e.lluvia) && Object.keys(ml).length >= 2)
      muestras.push({ ...comun, magnitud: 'lluvia', medido: e.lluvia,
                      humedad: e.humedad, modelos: ml });
  }
  if (!muestras.length) return { apuntadas: 0, nota: 'ninguna hora cuadró' };

  const r = await fetch(`${APP}/api/marcador`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ muestras }),
  });
  if (!r.ok) throw new Error(`marcador ${r.status}`);
  return { apuntadas: muestras.length, estaciones: unicas.size };
}

export default async function handler(req, res) {
  /* ── ¿CUÁNDO PASÓ POR ÚLTIMA VEZ? ─────────────────────────────────────
     Sin clave y sin datos: solo la hora. Lo pregunta la app cada vez que
     él la abre.

     Existe por lo del 27-08-2026: el vigilante del Mac llevaba ONCE HORAS
     parado —atascado en un diálogo de permiso de la noche anterior— y él
     estaba trabajando creyendo que alguien miraba. Lo que había para
     detectarlo era la revisión de mantenimiento… que corre en el mismo
     Mac. Los dos muertos, y nadie que lo dijera.

     **Un vigilante parado se ve igual que un vigilante tranquilo.** La
     única forma de que eso no vuelva a pasar es que el aviso salga donde
     él SÍ mira, que es la app, y que no dependa de que corra nada. */
  if (req.method === 'GET' && req.query?.pulso === '1') {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const e = await leerEstado();
      if (!e?.cuando) return res.status(200).json({ ultima: null, haceMin: null,
        envia: process.env.VIGILANTE_ENVIA === '1' });
      const haceMin = Math.round((Date.now() - new Date(e.cuando).getTime()) / 60000);

      /* ── Y SI ESTÁ MUDO, QUE SE VEA ─────────────────────────────────
         Cazado el 29-08-2026. Esa mañana él preguntó *«en el móvil no
         tengo ninguna notificación»* y se le contestó, mirando las
         tareas y los aparatos, que **el canal estaba entero**. Y lo
         estaba. Lo que no se miró es que este vigilante **no envía**:
         nace mudo a propósito y solo habla con `VIGILANTE_ENVIA=1`.

         O sea que se le dijo que estaba cubierto con el Mac apagado, y
         no lo estaba. El dato existía —en la respuesta larga, detrás de
         la clave— pero **el pulso, que es lo que mira la app en cada
         carga, no lo decía**.

         Es exactamente el fallo contra el que se escribió este fichero,
         una vuelta más adentro: un vigilante mudo y uno tranquilo se
         veían igual desde la app. Ahora el pulso lo canta, sin clave y
         sin dar ningún dato: solo si va a hablar o no. */
      const envia = process.env.VIGILANTE_ENVIA === '1';

      /* ── Y SI LLEVA MUCHO PARADO, SE REVIVE SOLO ─────────────────────
         Que él abra la app basta para que el vigilante vuelva a pasar.

         Puesto el 27-08-2026, el día que estuvo once horas muerto. Hasta
         entonces todo dependía de que GitHub lo llamara cada 3 h, y ese
         día GitHub no llamó. Ahora hay dos formas de que reviva y no
         dependen la una de la otra:

           1. GitHub cada 3 horas
           2. Él abriendo la app

         La clave NO sale de aquí: la pasada se dispara desde el propio
         servidor, que ya la tiene. Desde el móvil solo se pregunta la
         hora. */
      /* 240 min, no 270. Bajado el 27-08-2026 para que coincida con el
         listón con el que la app pinta «NADIE ESTÁ VIGILANDO». Con dos
         números distintos había media hora en la que él veía el rojo y
         aquí no se resucitaba nada: le decíamos que estaba muerto y no
         hacíamos nada por levantarlo. */
      if (haceMin > 240) {
        const base = `${APP}/api/vigilante`;
        fetch(base, { method: 'POST', headers: { 'x-clave': process.env.CRON_SECRET || '', 'x-revivido': '1' } })
          .catch(() => {});
        return res.status(200).json({ ultima: e.cuando, haceMin, envia,
          parteDe: e.parteDe ?? null,
          sitios: Object.keys(e.sitios || {}).length, revivido: true });
      }

      /* DE QUÉ LISTA SALIÓ. Sin esto no hay forma de saber, desde fuera,
         si está mirando sus emplazamientos de verdad o la lista de
         respaldo escrita a mano — y ese fue justo el fallo del 29-08,
         que dejó cuatro sitios suyos sin vigilar durante días.
         El número de sitios NO sirve para distinguirlo: las dos listas
         pueden tener los mismos. */
      /* ── Y SI SALIÓ EL PARTE DE LA MAÑANA ────────────────────────
         Puesto el 30-08-2026, la mañana en que él probaba por primera vez
         con el Mac apagado. Le dije que el parte sale solo a las 06:30
         desde el servidor... y luego no tenía forma de comprobarlo desde
         fuera: el dato estaba guardado pero solo se veía con la clave.

         Es EXACTAMENTE el agujero de ayer con `envia`. Un dato que existe
         pero que no se puede mirar es un dato que acaba contándose de
         memoria, y de memoria ya me he equivocado dos veces esta semana.
         Sale la fecha del último parte, que no dice nada de nadie. */
      return res.status(200).json({ ultima: e.cuando, haceMin, envia,
        lista: e.listaDeRespaldo ? 'respaldo' : 'la tuya',
        parteDe: e.parteDe ?? null,
        sitios: Object.keys(e.sitios || {}).length,
        nLista: e.nLista ?? null,
        noMirados: e.noMirados ?? [] });
    } catch (err) {
      return res.status(200).json({ ultima: null, haceMin: null, fallo: String(err?.message || err).slice(0, 60) });
    }
  }

  /* ── DOS CLAVES, Y NO SON IGUALES DE PODEROSAS ───────────────────────
     Añadido el 28-08-2026. Decisión suya esa noche: *«no pienso pagar una
     suscripción — un cron externo gratuito o lo que sea, sí»*, después de
     que GitHub Actions no disparara ni una vez programada en 37 horas.

     Un cron externo obliga a **darle una clave a un tercero**, y esta
     ruta **manda push a su móvil** (`empujar()`). Así que:

     · `CRON_SECRET`  — la de casa. GitHub, el cron de Vercel, la app.
     · `CRON_EXTERNO` — solo para el servicio de fuera.

     **Separadas para poder rotar una sin tocar la otra.** Si el día de
     mañana ese servicio se filtra o se vende, él cambia esa y no toca
     nada más.

     Y LA DE FUERA VA LIMITADA, que es lo que no cuesta nada y evita el
     otro riesgo —gastarle invocaciones—: si la última pasada fue hace
     menos de 20 minutos, contesta 200 y no hace nada. La cadencia útil
     del vigilante son horas; con 20 minutos hay margen de sobra para que
     una llamada legítima nunca se caiga, y una clave filtrada no puede
     hacer daño por repetición. **La clave de casa NO tiene ese límite**:
     desde aquí puede hacer falta una pasada a mano en el momento. */
  const secreto  = process.env.CRON_SECRET;
  const externa  = process.env.CRON_EXTERNO;
  /* SE ACEPTA LA CLAVE ESCRITA DE VARIAS FORMAS. Puesto el 28-08-2026
     dando de alta la llamada de fuera: Aitor escribió `xclave` sin el
     guion y el servidor la habría rechazado sin decir por qué.

     Un guion de menos no puede dejarle sin vigilante a las tres de la
     mañana, y encima **fallaría en silencio**: la llamada devuelve 401,
     nadie la mira, y un vigilante muerto se ve igual que uno tranquilo.
     Es el mismo fallo del 25-08 con otra ropa.

     Así que se miran las tres formas razonables de escribirlo. Esto NO
     afloja la seguridad: la clave sigue teniendo que ser exacta; lo
     único que se perdona es cómo se llame la cabecera. */
  const trae = v => {
    if (!v) return false;
    if (req.headers.authorization === `Bearer ${v}`) return true;
    for (const n of ['x-clave', 'xclave', 'x_clave', 'clave'])
      if (req.headers[n] === v) return true;
    return false;
  };

  const deCasa  = trae(secreto);
  const deFuera = !deCasa && trae(externa);
  if (secreto && !deCasa && !deFuera) return res.status(401).json({ error: 'sin permiso' });

  if (deFuera) {
    /* Si el almacén no contesta no se sabe cuándo fue la última pasada.
       Se sigue adelante: el freno de 20 min es una cortesía, y perder una
       pasada por no poder leer el reloj sería el remedio peor. */
    let e = null;
    try { e = await leerEstado(); } catch { e = null; }
    const desde = e?.cuando ? Math.round((Date.now() - new Date(e.cuando).getTime()) / 60000) : null;
    if (desde !== null && desde < 20) {
      return res.status(200).json({ ok: true, saltado: true, haceMin: desde,
        porQue: 'la clave de fuera va limitada a una pasada cada 20 min' });
    }
  }

  /* ── UNA RESURRECCIÓN NO ES UNA PASADA POR MINUTO (13-09-2026) ────
     Cada pulso de la app con el sello viejo disparaba una pasada entera.
     Con el sello escrito en cada pasada (abajo) ya no debería pasar; y
     por si el almacén no pudiera guardar, una pasada resucitada no se
     repite si en esta instancia hubo otra hace menos de 20 min. */
  const revivido = req.headers['x-revivido'] === '1';
  if (revivido && globalThis.__ultimaPasadaVigilante) {
    const hace = (Date.now() - globalThis.__ultimaPasadaVigilante) / 60000;
    if (hace < 20) {
      return res.status(200).json({ ok: true, saltado: true, haceMin: Math.round(hace),
        porQue: 'resucitada hace menos de 20 min' });
    }
  }
  globalThis.__ultimaPasadaVigilante = Date.now();

  /* La hora de AQUÍ, no la del servidor (que va en UTC). Es el mismo
     fallo que dejó muerta la comparación del parte en la app. */
  const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const claveHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const manana = new Date(ahora); manana.setDate(manana.getDate() + 1);
  const claveManana = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
  const h0 = ahora.getHours();

  /* Su lista de verdad, la que guarda la app. Si falla, la de respaldo. */
  let sitios = SITIOS, listaDeRespaldo = true;
  try {
    const rt = await fetch(`${APP}/api/torres`);
    const t = rt.ok ? (await rt.json())?.torres : null;
    if (Array.isArray(t) && t.length) {
      sitios = t.map(x => ({
        n: String(x.name || '').replace(/^(BI|VI|SS|NA)\s+/, '').split(' · ')[0].trim() || 'sin nombre',
        lat: x.lat, lon: x.lon,
        /* Lo crítico sigue saliendo de aquí, que eso no lo marca la app. */
        critico: SITIOS.some(v => v.critico && cerca(v, x)),
      })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lon));
      listaDeRespaldo = false;
    }
  } catch { /* nos quedamos con la de respaldo, y se dice */ }

  /* ── MEDIA HORA CUANDO HAY ALGO, UNA HORA CUANDO NO ────────────────
     Suyo, 01-09-2026, viendo que la CPU salía justo en el límite del plan
     gratis: *«esto es lo suyo; ni Windy te avisa cada media hora — 1 o 3
     horas te avisan»*. Y tiene razón: **una tormenta no se forma en
     veinte minutos**, así que pasar cada media hora un día tranquilo es
     gastar por gastar. Medido: el vigilante se llevaba 3,2 de las 4 horas
     de CPU del mes.

     La regla: si en la pasada anterior NO había nada —ni rayo, ni agua,
     ni racha, ni aviso vivo— esta pasada se salta, y la cadencia real
     queda en una hora. En cuanto aparece cualquier cosa, vuelve a media
     hora sola, sin tocar nada.

     NUNCA se salta: la consulta a mano, la ventana del parte de la
     mañana, ni si lleva más de una hora sin mirar. Y saltarse una pasada
     NO es estar caído: el aviso de «he estado X h sin vigilar» salta a
     las 4 h, muy por encima de la hora. */
  /* ── EL ESTADO SE LEE ANTES DE NADA ──────────────────────────────
     Y ESTO ESTABA MATANDO AL VIGILANTE. Lo cazó el barrido del
     01-09-2026, y era mío: al meter la cadencia adaptativa empecé a usar
     `antes` aquí arriba, pero `antes` se declaraba OCHENTA LÍNEAS MÁS
     ABAJO. En JavaScript eso no es «vale undefined»: es
     `ReferenceError: Cannot access 'antes' before initialization`, o sea
     que **TODA pasada del vigilante reventaba nada más empezar**. Ni un
     aviso de tormenta a su móvil.

     Y no lo cazó ninguna guardia porque ninguna ARRANCABA el vigilante:
     las pruebas del servidor leían su código con `regex` y el código
     ponía justo lo que buscaban. Por eso ahora hay una que lo arranca de
     verdad — «el vigilante ARRANCA», en pruebas-servidor.cjs.

     Que no se pueda leer el estado NO puede tumbar la pasada: sin pasada
     no hay vigilancia ninguna. Se sigue, y se enciende el modo ciego de
     más abajo, que avisa por lo que HAY en vez de por lo que cambia. */
  let antes = null, noPudeLeerElEstado = false;
  try { antes = await leerEstado(); }
  catch (e) { noPudeLeerElEstado = String(e?.message || e).slice(0, 60); }

  const huecoPrevio = antes?.cuando
    ? Math.round((Date.now() - new Date(antes.cuando).getTime()) / 60000) : null;
  const algoEnMarcha = !!(antes && (
    antes.ultimoAviso
    || Object.values(antes.sitios || {}).some(d => d && Object.values(d).some(x => x && x.ini != null))
    || Object.values(antes.aguaSitios || {}).some(a => a && Object.keys(a).length)
    || Object.values(antes.rachaSitios || {}).some(a => a && Object.keys(a).length)));
  const ventanaDelParte = h0 >= 6 && h0 < 12 && antes?.parteDe !== claveHoy;

  /* `mirar=1` es su ojeada a mano: esa nunca se salta. Se lee aquí
     directo porque `pedidoMirar` se declara más abajo. */
  /* ── VERDE, ÁMBAR, ROJO: LA CADENCIA SUBE SOLA (13-09-2026) ──────────
     Suyo: «cada 2 h vale si es solo para los días en verde; que suba sola
     a cada media hora en ámbar y a cada cuarto de hora en rojo: una
     tormenta de verano se monta en una hora». El cron externo llama y AQUÍ
     se decide si toca pasar. OJO (13-09-2026): cron-job.org está puesto
     **cada media hora**, así que el rojo sale cada media, no cada cuarto;
     para que el cuarto de hora sea de verdad hay que bajar el trabajo
     «Vigilante Aitor Meteo» a 15 min en su consola de cron-job.org.
       verde  — nada guardado en marcha → una pasada cada 2 h
       ámbar  — hay rayo, agua o racha apuntados (hoy o mañana) → cada media
       rojo   — rayo de HOY todavía por delante, racha de 70 por delante, o
                tormenta inminente ya avisada → cada cuarto
     La app, al abrirse, sigue pidiendo el tiempo en vivo: eso no depende
     de esto. Una llamada saltada cuesta ~50 ms de CPU. */
  const porDelante = x => x && (x.fin == null || x.fin >= h0);
  const rojo = !!(antes && (
    antes.ultimoAviso
    /* Con la medianoche por delante, la madrugada cuenta igual: si no, esa
       noche el vigilante se queda en ámbar (cada media hora) justo cuando
       se está armando lo de las 00:00 (20-09-2026). */
    || Object.values(antes.sitios || {}).some(d => porDelante(d?.[claveHoy])
         || (h0 >= 21 && d?.[claveManana]))
    || Object.values(antes.rachaSitios || {}).some(r => r?.[claveHoy] && r[claveHoy].kmh >= RACHA_TOPE && porDelante(r[claveHoy]))));
  const nivel = rojo ? 'rojo' : algoEnMarcha ? 'ambar' : 'verde';
  const cadaMin = { verde: 115, ambar: 25, rojo: 10 }[nivel];
  const ojeadaAMano = req.query?.mirar === '1' || req.body?.mirar === true;
  if (!ojeadaAMano && !ventanaDelParte && huecoPrevio !== null && huecoPrevio < cadaMin) {
    return res.status(200).json({
      ok: true, saltada: true, nivel,
      nota: `${nivel}: se pasa cada ${nivel === 'verde' ? 'dos horas' : nivel === 'ambar' ? 'media hora' : 'cuarto de hora'}`,
      ultimaPasada: antes.cuando,
    });
  }

  const datos = await Promise.all(sitios.map(s =>
    unSitio(s).then(x => ({ ...x, ok: true })).catch(e => ({ n: s.n, critico: !!s.critico, ok: false, fallo: String(e.message || e) }))));

  const buenos = datos.filter(d => d.ok);
  const fallos = datos.filter(d => !d.ok);

  /* ── 1. LO INMINENTE: esta hora y las tres siguientes ─────────────── */
  /* ── Y LO QUE EMPIEZA DESPUÉS DE MEDIANOCHE (20-09-2026) ───────────
     Esto miraba SOLO el día de hoy. A las 23:10, un sitio cuya tormenta
     arranca a las 00:00 —dentro de cincuenta minutos— no entraba en la
     lista, porque sus horas están apuntadas en el día de mañana y el de
     hoy no existe. Silencio total justo en la franja en la que él trabaja
     de noche y en la que entra de guardia.

     Es el mismo fallo que este fichero ya documenta en `cuandoTxt` —«el
     episodio no acaba donde acaba la consulta»— pero allí se arregló el
     TEXTO y la DETECCIÓN se quedó igual. Ahora, cuando las tres horas
     siguientes cruzan la medianoche, se miran también las primeras horas
     de mañana. */
  const hastaManana = h0 + 3 - 24;          // negativo si no se cruza la medianoche
  const inminentes = buenos.filter(d => {
    if (hastaManana >= 0) {
      const m = d.dias[claveManana];
      if (m && m.ini <= hastaManana) return true;
    }
    const t = d.dias[claveHoy];
    return t && t.ini <= h0 + 3 && t.fin >= h0;
  });

  /* ── 2. LO QUE HA CAMBIADO desde la pasada anterior ───────────────── */
  /* La lectura del estado vive AHORA arriba del todo (busca «SE LEE
     ANTES DE NADA»): aquí abajo llegaba tarde. */

  /* Cuánto llevaba sin pasar. Si el hueco es grande, ES NOTICIA: significa
     que hubo un rato en que nadie miraba, y él tiene que saberlo aunque
     durante ese rato no pasara nada. */
  const huecoMin = antes?.cuando
    ? Math.round((Date.now() - new Date(antes.cuando).getTime()) / 60000) : null;
  /* ── SIN ESTADO NO HAY «CAMBIOS»: SE AVISA POR LO QUE HAY ──────────
     Lo cazó el chat de al lado el 01-09-2026 y tiene toda la razón: yo
     había arreglado que el vigilante **no se cayera** sin poder guardar,
     pero no seguí la consecuencia — *«vale, no se cae… ¿y qué deja de
     funcionar?»*.

     Y deja de funcionar lo que más avisa: los cambios («ahora da rayo de
     15 a 18», «se adelanta», «aparece agua») se calculan comparando con
     el estado guardado. Con el almacén suspendido no hay con qué
     comparar, así que **esos avisos no salen — y son 25 días hasta que
     se renueve la cuota el 26**.

     El rayo inminente sí sigue avisando, que no depende del estado. Lo
     que se tapa aquí es el resto, y de la única forma honesta que queda:
     **mientras esté ciego, se avisa por lo que HAY, no por lo que ha
     cambiado**, y solo de lo gordo — su tope de racha y la lluvia
     fuerte—, que es raro y no le va a dar la lata. Con etiqueta fija:
     un aviso nuevo del mismo tipo sustituye al anterior en el móvil en
     vez de amontonarse.

     Cuando vuelva el almacén, esto se apaga solo: `ciego` será falso. */
  const ciego = !antes?.sitios;
  const cambios = [];

  if (ciego) {
    const gordos = [];
    for (const d of buenos) {
      const r = d.racha?.[claveHoy], ag = d.agua?.[claveHoy];
      if (r?.kmh != null && r.kmh >= 60)
        gordos.push(`${d.n} racha ${Math.round(r.kmh)} km/h${r.ini != null ? ` a las ${hh(r.ini)}` : ''}`);
      else if (ag?.mm != null && ag.mm >= 2)
        gordos.push(`${d.n} lluvia fuerte ${ag.mm.toFixed(1)} mm/h`);
    }
    if (gordos.length) {
      cambios.push({ n: gordos[0].split(' ')[0], cual: 'hoy', peor: true, critico: false,
        soloEstado: true,
        txt: `${gordos.slice(0, 3).join(' · ')}${gordos.length > 3 ? ` y ${gordos.length - 3} más` : ''}`
           + ' — (aviso por lo que hay: el vigilante no puede comparar con antes)' });
    }
  }

  if (antes?.sitios) {
    for (const d of buenos) {
      for (const [clave, cual] of [[claveHoy, 'hoy'], [claveManana, 'mañana']]) {
        const a = antes.sitios[d.n]?.[clave], b = d.dias[clave];
        if (!a && !b) continue;
        /* Lo que ya pasó no es aviso (§11): un tramo de HOY que acabó antes de esta hora se calla. */
        if (!a && b) { if (!(cual === 'hoy' && b.fin < h0)) cambios.push({ n: d.n, lat: d.lat, lon: d.lon, cual, txt: `ahora da rayo ${tramoTxt(b.ini, b.fin)}`, peor: true, critico: d.critico }); continue; }
        if (a && !b) { cambios.push({ n: d.n, lat: d.lat, lon: d.lon, cual, txt: `ya no da rayo (antes ${rangoTxt(a.ini, a.fin)})`, peor: false, critico: d.critico }); continue; }
        if ((a.ini !== b.ini || a.fin !== b.fin) && !(cual === 'hoy' && b.fin < h0)) {
          cambios.push({ n: d.n, lat: d.lat, lon: d.lon, cual, txt: `${rangoTxt(a.ini, a.fin)} pasa a ${rangoTxt(b.ini, b.fin)}`,
                         peor: b.ini < a.ini || b.fin > a.fin, critico: d.critico });
        }
      }
    }
  }

  /* ── LO MISMO CON EL AGUA Y CON LA RACHA ────────────────────────────
     Suyo, 29-08-2026: *«¿y el vigilante no avisa que viene lluvia?»* y
     *«que avise de rachas superiores a 70 km/h también»*.

     MISMA REGLA QUE EL RAYO, y esto es lo que evita que se vuelva ruido:
     se avisa de lo que **aparece** donde no había nada, de lo que **se
     agrava** (el agua pasa a fuerte, la racha sube 10 km/h o más) y de lo
     que **se adelanta dos horas o más**. Del vaivén de milímetros, nada:
     en octubre eso sería un aviso cada tres horas, y su norma de siempre
     es que **una app que grita se deja de creer**.

     Y no son la misma clase de cosa que el rayo, así que no se mezclan en
     el mismo aviso: el rayo es su VETO —no se acerca al sitio— mientras
     que el agua y la racha le hacen **esperar y mirar la hora**. */
  const cambiosAgua = [];
  const cambiosRacha = [];
  /* ── SE ESTRENA EN SILENCIO ────────────────────────────────────────
     Fallo mío, cazado antes de publicar. En la primera pasada con esto
     puesto, el estado guardado **no tiene todavía** `aguaSitios` ni
     `rachaSitios`, así que todo lo que hubiera se leería como «nuevo» y
     le sonarían los catorce sitios de golpe.

     Es el mismo cuidado que ya tenía el rayo con `antes?.sitios`, y por
     el mismo motivo que está escrito ahí abajo: un vigilante que se
     enciende comparando contra nada suelta un montón de avisos falsos, y
     eso quema la confianza de una vez y para siempre. */
  const hayAguaGuardada = !!antes?.aguaSitios;
  const hayRachaGuardada = !!antes?.rachaSitios;
  if (antes?.sitios) {
    for (const d of buenos) {
      for (const [clave, cual] of [[claveHoy, 'hoy'], [claveManana, 'mañana']]) {
        const va = antes.aguaSitios?.[d.n]?.[clave], vb = d.agua?.[clave];
        if (vb && !va && hayAguaGuardada && !(cual === 'hoy' && vb.fin < h0)) {
          cambiosAgua.push({ n: d.n, lat: d.lat, lon: d.lon, cual, peor: true, critico: d.critico,
            txt: `${vb.fuerte ? 'lluvia fuerte' : 'agua'} ${tramosTxt(vb.tramos, vb.ini, vb.fin)}`
               + ` (${vb.mm} mm/h, lo ve ${vb.quien})` });
        } else if (vb && va && !(cual === 'hoy' && vb.fin < h0)) {
          const aFuerte = !va.fuerte && vb.fuerte;
          const antesDe = vb.ini <= va.ini - 2;
          if (aFuerte || antesDe) {
            cambiosAgua.push({ n: d.n, lat: d.lat, lon: d.lon, cual, peor: true, critico: d.critico,
              txt: aFuerte
                ? `el agua pasa a fuerte: ${vb.mm} mm/h ${picoTxt(vb.hPico, vb.ini)}`
                : `el agua se adelanta: ${hh(va.ini)} pasa a ${hh(vb.ini)}` });
          }
        }

        const ra = antes.rachaSitios?.[d.n]?.[clave], rb = d.racha?.[clave];
        if (rb && !ra && hayRachaGuardada && !(cual === 'hoy' && rb.fin < h0)) {
          cambiosRacha.push({ n: d.n, lat: d.lat, lon: d.lon, cual, peor: true, critico: d.critico, kmh: rb.kmh,
            txt: `racha de ${rb.kmh} km/h ${picoTxt(rb.hPico, rb.ini)}`
                 + `${(rb.tramos?.length ?? 1) > 1 ? `, y pasa de ${RACHA_TOPE} ${tramosTxt(rb.tramos, rb.ini, rb.fin)}` : ''}`
                 + ` (lo ve ${rb.quien})` });
        } else if (rb && ra && !(cual === 'hoy' && rb.fin < h0)) {
          const masFuerte = rb.kmh >= ra.kmh + 10;
          const antesDe = rb.ini <= ra.ini - 2;
          if (masFuerte || antesDe) {
            cambiosRacha.push({ n: d.n, lat: d.lat, lon: d.lon, cual, peor: true, critico: d.critico, kmh: rb.kmh,
              txt: masFuerte
                ? `la racha sube: ${ra.kmh} pasa a ${rb.kmh} km/h`
                : `la racha se adelanta: ${hh(ra.ini)} pasa a ${hh(rb.ini)}` });
          }
        }
      }
    }
  }

  /* Los cambios de MAÑANA solo se cuentan a partir de las 18:00: antes de
     esa hora él está a lo de hoy, y el jueves lo mirará el jueves. */
  const cambiosQueValen = cambios.filter(c => (c.cual === 'hoy' || h0 >= 18) && c.peor);

  /* ── 3. ¿SE AVISA? Solo si hay algo NUEVO ─────────────────────────── */
  const firmaAhora = inminentes.map(d => `${d.n}:${d.dias[claveHoy].ini}-${d.dias[claveHoy].fin}`).sort().join('|');
  const yaAvisado = antes?.ultimoAviso === firmaAhora;

  const avisos = [];
  if (inminentes.length && !yaAvisado) {
    const crit = inminentes.find(d => d.critico);
    const lista = [...inminentes].sort((a, b) => (b.critico ? 1 : 0) - (a.critico ? 1 : 0))
      .slice(0, 4).map(d => `${d.n} ${cuandoTxt(d, claveHoy, claveManana)}`).join(' · ');
    avisos.push({
      titulo: crit ? `⚡ MATIENA (crítico) y ${inminentes.length - 1} más` : `⚡ Se está armando en ${inminentes.length}`,
      /* Afecta a varios: se abre «Mis estaciones», que los enseña todos. */
      url: './?v=torres',
      cuerpo: `${lista}${inminentes.length > 4 ? ` y ${inminentes.length - 4} más` : ''}. Datos de las ${hh(h0)}.`,
      tag: 'tormenta', importante: true,
    });
  }
  if (cambiosQueValen.length) {
    const c = cambiosQueValen[0];
    avisos.push({
      titulo: `⚡ CAMBIO ${c.cual.toUpperCase()} · ${cambiosQueValen.length > 1 ? `${cambiosQueValen.length} torres` : c.n}`,
      /* De un sitio concreto: se abre ESE. */
      url: c.lat != null && c.lon != null ? `./?sitio=${c.lat},${c.lon}` : './?v=torres',
      cuerpo: cambiosQueValen.slice(0, 6).map(x => `${x.n} (${x.cual}): ${x.txt}`).join('. ')
            + `. Datos de las ${hh(h0)}.`,
      tag: 'cambio', importante: false,
    });
  }
  /* EL AGUA VA EN SU PROPIO AVISO Y CON SU PROPIO ICONO. No se junta con
     el rayo: con rayo no se acerca, con agua decide a qué hora va. */
  const aguaQueVale = cambiosAgua.filter(c => (c.cual === 'hoy' || h0 >= 18) && c.peor);
  if (aguaQueVale.length) {
    const c = aguaQueVale[0];
    avisos.push({
      titulo: `🌧 AGUA ${c.cual.toUpperCase()} · ${aguaQueVale.length > 1 ? `${aguaQueVale.length} torres` : c.n}`,
      url: c.lat != null && c.lon != null ? `./?sitio=${c.lat},${c.lon}` : './?v=torres',
      cuerpo: aguaQueVale.slice(0, 6).map(x => `${x.n} (${x.cual}): ${x.txt}`).join('. ')
            + `. Datos de las ${hh(h0)}.`,
      tag: 'agua', importante: false,
    });
  }

  /* Y LA RACHA DE 70, que no es la de la torre: es la del viaje. Va como
     importante porque es la que le hace no salir de casa. */
  const rachaQueVale = cambiosRacha.filter(c => (c.cual === 'hoy' || h0 >= 18) && c.peor);
  if (rachaQueVale.length) {
    const c = rachaQueVale[0];
    const rMax = Math.max(...rachaQueVale.map(x => x.kmh ?? 0));
    avisos.push({
      titulo: `💨 RACHA ${c.cual.toUpperCase()} · ${rachaQueVale.length > 1 ? `${rachaQueVale.length} torres` : c.n}`,
      url: c.lat != null && c.lon != null ? `./?sitio=${c.lat},${c.lon}` : './?v=torres',
      cuerpo: rachaQueVale.slice(0, 6).map(x => `${x.n} (${x.cual}): ${x.txt}`).join('. ')
            /* «Racha de 70. Por encima de 70» no: si iguala el listón, llega; solo
               si lo supera está por encima (§11). */
            + `. ${rMax > RACHA_TOPE ? `Por encima de tu listón de ${RACHA_TOPE} km/h` : `Llega a tu listón de ${RACHA_TOPE} km/h`}. Datos de las ${hh(h0)}.`,
      tag: 'racha', importante: true,
    });
  }

  /* Que un sitio no se pueda mirar NO es silencio: es una noticia. Pero
     solo se avisa si es el crítico o si fallan muchos — si no, cualquier
     hipo de red le sonaría el móvil. */
  /* Y si está mirando la lista vieja, se le dice — una vez, sin repetir
     en cada pasada, porque si no sería justo el ruido que él no aguanta. */
  if (listaDeRespaldo && antes?.listaDeRespaldo !== true) {
    avisos.push({
      titulo: '⚠ No he podido leer tu lista de emplazamientos',
      url: './?v=torres',
      cuerpo: `Estoy vigilando la lista de respaldo, de ${SITIOS.length} sitios. `
            + 'Si has añadido alguno últimamente, ese NO lo estoy mirando. '
            + 'Abre la app y comprueba que salen todos.',
      tag: 'lista', importante: false,
    });
  }

  if (fallos.some(f => f.critico) || fallos.length >= 4) {
    avisos.push({
      titulo: `⚠ No he podido mirar ${fallos.length} emplazamiento(s)`,
      url: './?v=torres',
      cuerpo: fallos.map(f => f.n).join(', ') + '. No des por hecho que están tranquilos.',
      tag: 'fallo', importante: false,
    });
  }

  /* MIRAR SIN AVISAR.
     Puesto el 26-08-2026 después de una noche en la que Aitor recibió la
     misma tormenta por dos sitios: el vigilante del Mac le mandó correo
     y yo, comprobando esto a mano, le mandé push de lo mismo. Su propia
     regla dice que **una app que grita se deja de creer**, y nos la
     saltamos entre dos sin querer.

     Con `?mirar=1` esto calcula y contesta igual, pero NO le manda nada
     y NO toca el estado guardado. Es lo que hay que usar para comprobar
     cómo va la cosa. Avisar de verdad es cosa de la pasada automática. */
  const pedidoMirar = req.query?.mirar === '1' || req.body?.mirar === true;

  /* ── Y ESTE VIGILANTE NACE MUDO, A PROPÓSITO ──────────────────────────
     Avisado por la sesión del vigilante del Mac el 26-08-2026, y era un
     problema que se encendía SOLO:

     > El día que GitHub Actions se recupere, tu vigilante empieza a mandar
     > por su cuenta — y la tarea del Mac sigue mandando, porque el reparto
     > de canales NO está decidido. Nadie va a decidir eso: se recupera un
     > servicio de terceros y a Aitor le empiezan a llegar los avisos de
     > rayo por duplicado.

     Y su regla dice que **una app que grita se deja de creer**. Esa noche
     ya le llegó la misma tormenta dos veces, por el correo del Mac y por
     un push mío, sin querer.

     Es la forma del error de todo el día: una decisión correcta —«mientras
     tanto, las dos vías»— que **caduca sola** cuando deja de cumplirse la
     condición, y nadie mirando ese momento.

     Así que enviar hay que ENCENDERLO a mano, poniendo `VIGILANTE_ENVIA=1`
     en Vercel. Mientras no esté, esto calcula, guarda y contesta igual,
     pero **no le manda nada**. El día que él decida el reparto, se
     enciende con una variable y ya.

     Y NO SE HACE EL SILENCIO SILENCIOSO: la respuesta dice `mudo: true`
     bien visible, para que nadie lea «no ha avisado» como «no pasa nada».
     Un vigilante mudo y un vigilante tranquilo NO se pueden ver igual.  */
  const puedeEnviar = process.env.VIGILANTE_ENVIA === '1';
  const soloMirar = pedidoMirar || !puedeEnviar;

  /* ── EL PARTE DE LA MAÑANA, DESDE AQUÍ ──────────────────────────────
     Suyo, 29-08-2026: *«a veces dejo el Mac encendido y otras no»*. Y el
     parte de las 06:39 corría en el Mac, así que los días que lo apagaba
     **no salía** — justo el que mira antes de entrar a trabajar a las 7.

     No hace falta ninguna función nueva ni ningún cron nuevo: este
     vigilante ya pasa cada 30 minutos y ya tiene mirados los catorce
     emplazamientos. Lo único que hacía falta era que, la primera vez que
     pasa después de las 06:30, cuente lo que hay.

     UNA VEZ AL DÍA Y NO MÁS: se guarda la fecha del último parte, así
     que da igual cuántas pasadas haya entre las 06:30 y las 07:00.

     Y SI NO HAY NADA, SE DICE IGUAL. Es la parte que más importa: este
     parte es también **la señal de vida**. Un «hoy no hay nada» y un
     vigilante muerto tienen que verse distintos, y el 25-08 estuvo más
     de 24 horas parado sin que nadie se enterara.

     El correo sigue saliendo del Mac cuando esté encendido; desde aquí no
     hay conector de Gmail. Pero el push ya no depende de nada suyo. */
  const HORA_PARTE = 6;
  const tocaParte = h0 >= HORA_PARTE && h0 < 12 && antes?.parteDe !== claveHoy;
  if (tocaParte) {
    const conRayo = buenos.filter(d => d.dias[claveHoy]);
    const conAgua = buenos.filter(d => d.agua?.[claveHoy]);
    const conRacha = buenos.filter(d => d.racha?.[claveHoy]);

    const trozos = [];
    if (conRayo.length) {
      trozos.push(`⚡ rayo en ${conRayo.length}: `
        + conRayo.slice(0, 3).map(d => `${d.n} ${cuandoTxt(d, claveHoy, claveManana)}`).join(' · ')
        + (conRayo.length > 3 ? ` y ${conRayo.length - 3} más` : ''));
    }
    if (conAgua.length) {
      const peor = conAgua.reduce((a2, b2) => b2.agua[claveHoy].mm > a2.agua[claveHoy].mm ? b2 : a2);
      trozos.push(`🌧 agua en ${conAgua.length}: lo más fuerte ${peor.n} `
        + `${peor.agua[claveHoy].mm} mm/h ${picoTxt(peor.agua[claveHoy].hPico, peor.agua[claveHoy].ini)}`
        + `, y llueve ${tramosTxt(peor.agua[claveHoy].tramos, peor.agua[claveHoy].ini, peor.agua[claveHoy].fin)}`);
    }
    if (conRacha.length) {
      const peor = conRacha.reduce((a2, b2) => b2.racha[claveHoy].kmh > a2.racha[claveHoy].kmh ? b2 : a2);
      trozos.push(`💨 racha de 70+ en ${conRacha.length}: lo peor ${peor.n} `
        + `${peor.racha[claveHoy].kmh} km/h ${picoTxt(peor.racha[claveHoy].hPico, peor.racha[claveHoy].ini)}`
        + `, y pasa de ${RACHA_TOPE} ${tramosTxt(peor.racha[claveHoy].tramos, peor.racha[claveHoy].ini, peor.racha[claveHoy].fin)}`);
    }

    avisos.push({
      titulo: trozos.length
        ? `El parte de hoy · ${conRayo.length + conAgua.length + conRacha.length} avisos`
        : 'El parte de hoy · sin nada por encima de tus listones',
      cuerpo: (trozos.length
        ? trozos.join('. ')
        : `Los ${buenos.length} emplazamientos, sin rayo, sin agua de 0,3 mm/h para arriba y sin rachas de 70.`)
        + ` Ábrela para el detalle.`,
      tag: 'parte', importante: false,
    });
  }

  /* Un hueco de más de 4 h (dos pasadas verdes perdidas) se le dice.
     El 27-08 fueron ONCE horas y se enteró por casualidad. */
  if (huecoMin !== null && huecoMin > 240) {   // mismo listón que la app y que el revivir
    const h = Math.floor(huecoMin / 60);
    avisos.push({
      titulo: `⚠ He estado ${h} h sin vigilar`,
      url: './?v=torres',
      cuerpo: `Mi última pasada fue hace ${h} h ${huecoMin % 60} min. `
            + 'Durante ese rato NADIE miraba tus emplazamientos. Ahora vuelvo a estar. '
            + 'Si tenías que subir a algún sitio en ese rato, compruébalo en la app.',
      tag: 'parado', importante: true,
    });
  }

  const enviados = [];
  if (!soloMirar) {
    /* SIN HORAS DE SILENCIO. Se probó un 23:00-06:00 solo para lo rojo
       (§11 del guion) y lo quitó él la misma noche, 13-09-2026: «trabajo
       de día y de noche, necesito los avisos las 24 horas; que la
       madrugada cuente igual que el resto del día». */
    for (const a of avisos) enviados.push({ ...a, ...(await empujar(a.titulo, a.cuerpo, a.tag, a.importante, a.url)) });
  }

  /* Se guarda SIEMPRE, aunque no se avise: si no, la comparación de la
     pasada siguiente sería contra un estado viejo y saldrían cambios que
     ya se habían contado. */
  /* GUARDAR NO ES LO MISMO QUE AVISAR, y confundirlo costó caro.

     Primera versión: se guardaba solo si se enviaba. Como el vigilante
     nace mudo, **no guardaba nunca** — así que la comparación entre
     pasadas se quedaba congelada en la última vez que habló. El día que
     se encendiera, compararía contra un estado de hace días y soltaría
     una tromba de «cambios» que no son cambios. Y mientras tanto, ni
     siquiera podría decir «esto ha cambiado» aunque cambiara.

     Lo correcto: una pasada AUTOMÁTICA guarda siempre, hable o no. Lo
     que no guarda es la consulta a mano (`mirar=1`), porque esa es una
     ojeada mía y si guardara, la pasada automática siguiente compararía
     contra mi ojeada y se comería el cambio de verdad. */
  let noSeGuardo = null;
  if (!pedidoMirar) {
    /* ── SOLO SE ESCRIBE SI ALGO HA CAMBIADO ──────────────────────────
       El 01-09-2026 Vercel suspendió el almacén con «Blob Advanced
       Operations 2K / 2K»: agotadas las 2.000 escrituras del mes. Y el
       principal gastador éramos nosotros — esta línea, cada 30 minutos:
       **1.440 escrituras al mes** para guardar, casi siempre, lo mismo
       que ya había.

       Se quedó sin buzón, sin sincronización y —hasta que se movieron a
       otra vía— sin avisos al móvil. Por gastar escrituras en no decir
       nada.

       Ahora se compara con lo guardado y solo se escribe si cambia de
       verdad. Con eso la cuenta baja de ~1.440 al mes a las pocas
       decenas que de verdad son cambios. La hora (`cuando`) se deja
       fuera de la comparación a propósito: si entrara, cambiaría siempre
       y no habríamos arreglado nada. */
    const nuevo = {
      cuando: new Date().toISOString(),
      /* ── AVISADO ES QUE HAYA LLEGADO, NO QUE SE HAYA INTENTADO ──────
         Lo cazó el barrido del 01-09-2026. Esto marcaba la firma de la
         tormenta como «ya avisado» sin mirar si `empujar()` había
         entregado NADA. Si el envío fallaba —Google o Apple caídos, un
         corte de red, las claves mal— la pasada siguiente veía
         `yaAvisado = true` y **no lo reintentaba nunca**: el aviso de la
         tormenta se perdía para siempre, en silencio, mientras el
         vigilante seguía diciendo que todo iba bien.

         Ahora solo se marca si llegó a algún aparato. Si no llegó, se
         deja lo que hubiera y la pasada siguiente vuelve a intentarlo. */
      ultimoAviso: !inminentes.length ? null
        : (enviados.some(e => e.tag === 'tormenta' && (e.enviados || 0) > 0)
             ? firmaAhora
             : (antes?.ultimoAviso ?? null)),
      sitios: Object.fromEntries(buenos.map(d => [d.n, d.dias])),
      /* ── CUÁNTOS TENÍA, NO SOLO CUÁNTOS PUDE ─────────────────────
         Cazado el 20-09-2026 mirando el pulso en producción: decía 19 y
         él tiene 20. `sitios` son los que SALIERON BIEN, y la app lo
         pinta como «Última pasada por tus 19 emplazamientos» — que se
         lee como «tienes 19», no como «uno falló». El número baja solo y
         nadie dice por qué: el error de esta casa otra vez.
         Se guarda también el total de la lista y los nombres de los que
         no se pudieron mirar, y el pulso los canta. */
      nLista: datos.length,
      noMirados: fallos.map(f => f.n).slice(0, 8),
      /* Sin guardar esto, la pasada siguiente compararía contra nada y
         soltaría «ahora da agua» en todos los sitios a la vez. */
      aguaSitios: Object.fromEntries(buenos.map(d => [d.n, d.agua || {}])),
      rachaSitios: Object.fromEntries(buenos.map(d => [d.n, d.racha || {}])),
      listaDeRespaldo,
      /* La fecha del último parte, para no repetirlo en cada pasada. Si
         no se envió (mudo, o fallo), NO se marca: se reintenta luego. */
      /* Mismo trato para el parte de la mañana: el comentario de arriba
         prometía «si no se envió NO se marca», pero solo miraba si
         estaba mudo — no si había llegado. Con el envío fallando, se
         daba por dado y él se quedaba sin parte ese día (01-09-2026). */
      parteDe: (tocaParte && !soloMirar
                && enviados.some(e => e.tag === 'parte' && (e.enviados || 0) > 0))
        ? claveHoy : (antes?.parteDe ?? null),
    };

    const sinHora = e => { const { cuando, ...r } = e || {}; return JSON.stringify(r); };
    const cambia = sinHora(nuevo) !== sinHora(antes);
    /* Y aunque no cambie, se refresca una vez al día: así el pulso de
       «última pasada hace X» no envejece y él sigue viendo que está vivo.
       Son 30 escrituras al mes, no 1.440. */
    /* 25 MINUTOS, NO 20 HORAS (13-09-2026). Con el sello viejo todo el día,
       el pulso de la app (que resucita al vigilante pasadas 4 h) disparaba
       una pasada en cada apertura, y cada pasada mandaba «⚠ He estado 12 h
       sin vigilar» porque el hueco se mide contra ese mismo sello que no
       se escribía: tres seguidos el 10-09 a las 18:55, 18:57 y 18:58, y la
       CPU de Vercel al 180 %. Las 20 h eran por la cuota del Blob; el
       almacén es Redis desde el 04-09 y una escritura cada media hora no
       cuesta nada. */
    const viejo = !antes?.cuando
      || (Date.now() - new Date(antes.cuando).getTime()) > 25 * 60e3;

    if (cambia || viejo) {
      try { await guardarEstado(nuevo); }
      catch (e) {
        /* Con el almacén caído la pasada NO se cae: se avisa igual y se
           deja constancia. Perder el estado significa que la siguiente
           comparará contra nada — molesto, pero mucho menos grave que
           quedarse sin avisar. */
        noSeGuardo = String(e?.message || e).slice(0, 80);
      }
    }
    // si no cambia nada y el sello es de hace menos de 25 min, no se escribe
  }

  /* ── Y DE PASO, EL MARCADOR ────────────────────────────────────────
     Lo último de la pasada y con el fallo tragado: si esto falla, los
     avisos ya han salido. Nunca al revés. */
  let marcador = null;
  try { marcador = await apuntarEnElMarcador(sitios); }
  catch (e) { marcador = { error: String(e?.message || e).slice(0, 80) }; }

  /* Lo que no se pudo leer o guardar se DICE: hasta el 13-09-2026 eran dos
     banderas que se calculaban y nadie leía (las cazó ESLint el 05-09). */
  if (noSeGuardo) console.error('vigilante: no se guardó el estado:', noSeGuardo);
  if (noPudeLeerElEstado) console.error('vigilante: no se pudo leer el estado:', noPudeLeerElEstado);
  return res.status(200).json({
    ok: true, hora: hh(h0), nivel, mirados: buenos.length, fallos: fallos.map(f => f.n),
    marcador,
    noSeGuardo: noSeGuardo || undefined, noPudeLeerElEstado: noPudeLeerElEstado || undefined,
    /* De dónde salió la lista. Si es la de respaldo, el vigilante está
       mirando emplazamientos viejos y eso NO puede pasar en silencio: es
       justo el fallo del 29-08, que se dejó cuatro sitios suyos fuera. */
    listaDeRespaldo, cuantosSitios: sitios.length,
    inminentes: inminentes.map(d => `${d.n} ${cuandoTxt(d, claveHoy, claveManana)}`),
    cambios: cambios.map(c => `${c.n} (${c.cual}): ${c.txt}`),
    avisados: enviados.map(e => ({ titulo: e.titulo, enviados: e.enviados, nota: e.nota })),
    callado: !enviados.length,
    /* Se distingue «no había nada que decir» de «tenía algo y está mudo». */
    mudo: !puedeEnviar,
    habriaAvisado: !puedeEnviar ? avisos.map(a => a.titulo) : undefined,
    porQueMudo: !puedeEnviar
      ? 'Falta VIGILANTE_ENVIA=1. Mientras el reparto de canales no lo decida ÉL, '
        + 'los avisos de tormenta salen del vigilante del Mac y este calla para no duplicar.'
      : undefined,
  });
}
