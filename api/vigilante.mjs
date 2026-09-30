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
/* «rayo en 17» se lee como una hora (suyo, 28-09-2026 13:49: «¿rayo en 17
   qué es? confunde»). Con la palabra: «en 17 sitios», «en 1 sitio». */
const sitiosTxt = n => `${n} ${n === 1 ? 'sitio' : 'sitios'}`;
/* Los milímetros van con coma, como en la app: «7.2 mm/h» en un aviso del
   26-09 (segundo parte) era un fallo tonto de los suyos. */
const coma = v => String(v).replace('.', ',');
/* La tanda lleva siempre la misma URL y `/om` sale con s-maxage=600 y
   stale-while-revalidate=3600: en rojo (cada 30 min) el CDN podía servir
   la copia de la pasada anterior. Un sello de 10 min comparte caché entre
   pasadas cercanas y nunca sirve una rancia (27-09-2026). */
const selloTanda = () => `&_=${Math.floor(Date.now() / 600000)}`;

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
/* ── EL NÚMERO VA CON SU HORA, SIEMPRE (30-09-2026) ───────────────────
   Suyo, 13:34, con el cielo seco: «BERMEO: agua fuerte ahora y hasta las
   16h (6,7 mm/h)». Y al pedirle la causa: «hay que reparar el porqué, de
   raíz, para que la siguiente no lo vuelva a hacer».

   LA CAUSA: el agua y la racha se guardaban por DÍA con dos cosas sueltas
   —las horas en que pasa algo y el PEOR número del día— y cada texto las
   pegaba como si fueran de la misma hora. Así salieron tres fallos de la
   misma familia: el agua de las 13-16 h con los 6,9 mm de las 20 h; la
   racha de las 3 h siguientes con el máximo del día; y «racha X km/h a
   las HH» en el «no he podido mirar» con el máximo del día y la PRIMERA
   hora que pasaba de 70.

   EL ARREGLO DE RAÍZ: cada hora guarda su máximo y su modelo (`porHora`),
   y todo número que se diga junto a unas horas sale de AQUÍ, del máximo
   de ESAS horas. El peor del día (`mm`, `kmh`) solo se dice con su propia
   hora (`hPico`, `picoTxt`). Y una prueba de la REGLA, no del caso
   (prueba-vigilante-reloj.mjs, «la regla y no el caso»), la comprueba
   en tardes al azar sobre el texto que le llega. */
/* EL SÍMBOLO SALE DE LO QUE SE DICE, EN UN SOLO SITIO (30-09-2026): un
   aviso que solo era de agua salía con el ⚡ del rayo porque el título se
   escribía a mano, aparte del cuerpo. ⚡ si hay rayo, 🌧 si hay agua,
   💨 si es solo racha. Lo usan «Próximas 3 h» y «CAMBIO». */
const simboloDe = ques => (ques.includes('rayo') ? '⚡' : ques.includes('agua') ? '🌧' : '💨');
function picoEnHoras(x, desde, hasta) {
  let p = null;
  for (let h = desde; h <= hasta; h++) {
    const e = x?.porHora?.[h];
    if (e && Number.isFinite(e.v) && (!p || e.v > p.v)) p = { v: e.v, quien: e.quien, h };
  }
  return p;
}
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
function cuandoTxt(d, claveHoy, claveManana, deManana = x => x, h0 = null) {
  const hoy = d.dias[claveHoy];
  /* Un sitio que entra SOLO por su rayo de mañana (desde las 21:00, con
     `hastaManana`) salía como «BERMEO » a secas: sin hora, sin día
     (27-09-2026). Se dice cuándo, y que es mañana. */
  if (!hoy) {
    /* Solo lo que cuenta de mañana (la madrugada, por `deManana`): su
       aviso de las 21:00 del 27-09 decía «SANTAMAÑA mañana 00h y 12h-14h
       y 18h-19h», y lo de la tarde de mañana va en el parte. */
    const man = deManana(d.dias[claveManana]);
    if (!man) return '';
    const tm = (man.tramos || []).map(r => r.ini === r.fin ? hh(r.ini) : `${hh(r.ini)}-${hh(r.fin)}`).join(' y ');
    return `mañana ${tm || hh(man.ini)}`;
  }
  /* Lo ya pasado no se cuenta (28-09-2026, su pantallazo de las 12:01:
     «BERMEO 00h-01h y 13h-14h» a mediodía). Solo los tramos que acaban
     de esta hora en adelante. */
  const porDelante = (hoy.tramos || []).filter(r => h0 === null || r.fin >= h0);
  const t = porDelante.map(r => r.ini === r.fin ? hh(r.ini) : `${hh(r.ini)}-${hh(r.fin)}`).join(' y ');

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
/* ══════════════════════════════════════════════════════════════════════
   LOS VEINTE EN UNA PETICIÓN, NO CUARENTA (21-09-2026)
   ──────────────────────────────────────────────────────────────────────
   Cazado con su pantallazo de las 14:01, estando él de guardia: le llegó
   «⚠ No he podido mirar 7 emplazamiento(s)» con Bermeo, Mungia, Markina2,
   Balmaseda, Virgen Orduña, Zeberio y Puntagalea. El pulso confirmaba
   `sitios: 13` de `nLista: 20`.

   Y no era Open-Meteo caído ni la lista perdida: era ESTE fichero. Cada
   emplazamiento pedía DOS veces —celda de tierra y celda de al lado— y
   los veinte salían a la vez por `Promise.all`. Cuarenta peticiones
   simultáneas contra el mismo intermediario: las que llegan tarde se
   caen, y las que se caen se convierten en un aviso al móvil de uno que
   está trabajando en el monte.

   Open-Meteo acepta varias coordenadas en la misma llamada y contesta una
   lista en el mismo orden (comprobado el 21-09 contra lo publicado: tres
   puntos, tres respuestas, 48 horas cada una). Así que dos peticiones en
   vez de cuarenta.

   EL ORDEN NO SE DA POR BUENO. Un cruce aquí sería enseñarle el tiempo de
   Bermeo con el nombre de Orduña, y eso es peor que no tener dato: cada
   respuesta tiene que caer más cerca del punto que se pidió que de
   cualquier otro de la lista, o ese sitio se marca como no mirado.

   Y si la tanda falla entera, cada sitio vuelve a pedir lo suyo por su
   cuenta, como antes. Un atajo nuevo no puede dejarlo sin vigilante.
   ══════════════════════════════════════════════════════════════════════ */
async function pedirTanda(sitios, cel) {
  const u = `${APP}/om?api=fc&latitude=${sitios.map(s => s.lat).join(',')}`
          + `&longitude=${sitios.map(s => s.lon).join(',')}&timezone=auto`
          + `&hourly=cape,convective_inhibition,precipitation,wind_gusts_10m,weather_code&forecast_days=2`
          + `&cell_selection=${cel}&models=${MODELOS_AGUA.join(',')}${selloTanda()}`;
  /* Con tope (27-09-2026): sin él, Open-Meteo colgado se comía la pasada
     entera hasta el límite de Vercel, sin estado y sin aviso. */
  const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`la app contesta ${r.status}`);
  const j = await r.json();
  const lista = Array.isArray(j) ? j : [j];
  if (lista.length !== sitios.length) {
    throw new Error(`pedí ${sitios.length} y contestó ${lista.length}`);
  }
  const d2 = (a, b) => (a.lat - b.lat) ** 2 + (a.lon - b.lon) ** 2;
  return lista.map((x, i) => {
    const p = { lat: x?.latitude, lon: x?.longitude };
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return null;
    const mio = d2(p, sitios[i]);
    // ¿Hay otro de la lista al que esta respuesta le cuadre mejor? Entonces
    // no es suya, y sin dato se queda: el nombre manda sobre el número.
    for (let k = 0; k < sitios.length; k++) {
      if (k !== i && d2(p, sitios[k]) < mio) return null;
    }
    return x?.hourly || null;
  });
}

async function unSitio(s, previo = null, reloj = null) {
  const pide = async cel => {
    const u = `${APP}/om?api=fc&latitude=${s.lat}&longitude=${s.lon}&timezone=auto`
            + `&hourly=cape,convective_inhibition,precipitation,wind_gusts_10m,weather_code&forecast_days=2`
            + `&cell_selection=${cel}&models=${MODELOS_AGUA.join(',')}${selloTanda()}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`la app contesta ${r.status}`);
    return (await r.json()).hourly;
  };
  const H = previo?.H?.time ? previo.H : await pide('land');
  if (!H?.time) throw new Error('sin datos');
  /* La de al lado es opcional: si falla, se sigue con la de tierra y no
     se pierde ningún aviso de los de siempre. */
  let C = previo?.C?.time ? previo.C : null;
  if (!C) { try { C = await pide('nearest'); } catch { C = null; } }

  const porDia = {};                       // '2026-08-26' -> {horas:Set, cape, quien}
  /* ── EL CÓDIGO DE TORMENTA TAMBIÉN ES RAYO (27-09-2026) ─────────────
     La app pone NO APTO con código de tormenta (95-99) aunque el CAPE no
     llegue a 700; el vigilante solo miraba la pareja CAPE/tapa y un
     modelo diciendo «tormenta» con CAPE 650 no le hacía ni caso. Se cuenta
     como hora de rayo, con su modelo, para todos los modelos del agua. */
  for (const [H_, deLado] of [[H, false], [C, true]]) {
    if (!H_?.time) continue;
    for (const m of MODELOS_AGUA) {
      const wc = H_[`weather_code_${m}`];
      if (!wc) continue;
      for (let i = 0; i < H_.time.length; i++) {
        const w = wc[i];
        if (w == null || w < 95 || w > 99) continue;
        const dia = H_.time[i].slice(0, 10), h = Number(H_.time[i].slice(11, 13));
        const d = porDia[dia] ??= { horas: new Set(), cape: 0, quien: null, deLado: false };
        d.horas.add(h);
        if (!d.quien) { d.quien = nombreDe(m) + ' (código de tormenta)' + (deLado ? ' (celda de al lado)' : ''); d.deLado = deLado; }
      }
    }
  }
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
        const g = aguaDia[dia] ??= { horas: new Set(), mm: 0, quien: null, porHora: {} };
        g.horas.add(h);
        const quien = nombreDe(m) + (deLado ? ' (celda de al lado)' : '');
        if (v > g.mm) { g.mm = v; g.hPico = h; g.quien = quien; }
        /* Y EL MÁXIMO DE CADA HORA, con su modelo (30-09-2026): el aviso
           de las 3 h siguientes decía «agua fuerte ahora y hasta las 16h
           (6,7 mm/h)» con 0,5-1,9 mm de 13 a 16 h, porque el «fuerte» y
           los mm eran los del peor momento del DÍA (el Automático a las
           20:00). Lo fuerte se decide hora a hora. */
        if (!(g.porHora[h]?.v >= v)) g.porHora[h] = { v, quien };
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
        const r = rachaDia[dia] ??= { horas: new Set(), kmh: 0, quien: null, porHora: {} };
        r.horas.add(h);
        const quienR = nombreDe(m) + (deLado ? ' (celda de al lado)' : '');
        if (!(r.porHora[h]?.v >= v)) r.porHora[h] = { v, quien: quienR };   // ver picoEnHoras
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
                   kmh: Math.round(r.kmh), hPico: r.hPico, quien: r.quien,
                   porHora: Object.fromEntries(hs.map(h => [h, { v: Math.round(r.porHora[h].v), quien: r.porHora[h].quien }])) };
  }

  const agua = {};
  for (const [dia, g] of Object.entries(aguaDia)) {
    const hs = [...g.horas].sort((a2, b2) => a2 - b2);
    const hsFuerte = hs.filter(h => g.porHora[h]?.v >= AGUA_FUERTE);
    agua[dia] = { ini: hs[0], fin: hs.at(-1), tramos: enTramos(hs),
                  mm: Math.round(g.mm * 10) / 10, hPico: g.hPico, quien: g.quien,
                  fuerte: g.mm >= AGUA_FUERTE,
                  // Solo las horas que pasan de AGUA_FUERTE, y el pico de cada una.
                  fuertes: enTramos(hsFuerte),
                  porHora: Object.fromEntries(hsFuerte.map(h => [h, { v: Math.round(g.porHora[h].v * 10) / 10, quien: g.porHora[h].quien }])) };
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
  /* ── LO QUE SE ESTÁ ARMANDO, NO SOLO LO QUE YA SALTA (21-09-2026) ──
     Suyo, de guardia: *«aquí a veces hay un día bueno y al de unas horas
     entra galerna o truenos»*. Y tenía razón en lo que eso implica: todo
     lo de arriba solo guarda lo que YA cruza un listón —CAPE 700 con la
     tapa abierta, racha de 70, agua—. Una tarde que se está armando, con
     CAPE subiendo y rachas de 55, no dejaba ni rastro: el día seguía
     «verde» y el vigilante se iba a dormir tres horas.

     Aquí se sacan dos números crudos de las horas que QUEDAN POR DELANTE:
     el CAPE más alto y la racha más alta, de cualquier modelo, sin filtro
     de tapa y sin listón. No avisan de nada: solo sirven para que la
     pasada siguiente sepa si el día está tranquilo de verdad o está
     cargando. */
  const ojo = { cape: 0, racha: 0, agua: 0 };
  if (reloj) {
    const mira = (H_, campos) => {
      if (!H_?.time) return;
      for (const m of campos.modelos) {
        const v = H_[`${campos.k}_${m}`];
        if (!v) continue;
        for (let i = 0; i < H_.time.length; i++) {
          const t = H_.time[i];
          /* ── Y LA MEDIANOCHE NO CORTA EL OJO (22-09-2026) ────────
             Esto era `t.slice(0,10) !== reloj.dia`, o sea SOLO horas de
             hoy. A las 21:00 miraba tres horas; a las 23:00, UNA. Una
             línea nocturna armándose para las 02:00 —CAPE 600, rachas de
             62, 0,2 mm/h, ninguno cruzando listón de aviso— no dejaba
             rastro: el ojo no la veía por ser de mañana, así que el día
             seguía VERDE y con h0=23 la pasada siguiente caía a las
             01:55. Lo de las 02:00 se ve cuando ya está encima.

             Todo el resto del fichero ya cruza la medianoche —`hastaManana`
             en los inminentes, `rojo` con `claveManana` desde las 21:00—
             y el ojo, que es lo ÚNICO que sube la cadencia antes de que
             nada salte, se quedó atado al día. Ahora es una ventana que
             empieza en esta hora y sigue de largo. */
          if (t < reloj.desde) continue;
          const x = v[i];
          if (x == null) continue;
          // El agua va con decimal: su escala empieza en 0,3 mm/h.
          const y = campos.campo === 'agua' ? Math.round(x * 10) / 10 : Math.round(x);
          if (y > ojo[campos.campo]) ojo[campos.campo] = y;
        }
      }
    };
    for (const H_ of [H, C]) {
      mira(H_, { k: 'cape', modelos: MODELOS, campo: 'cape' });
      mira(H_, { k: 'wind_gusts_10m', modelos: MODELOS, campo: 'racha' });   // los mismos que el aviso de racha (27-09-2026)
      mira(H_, { k: 'precipitation',  modelos: MODELOS_AGUA, campo: 'agua'  });
    }
  }

  /* lat/lon viajan para que el aviso pueda abrir ESE emplazamiento */
  return { n: s.n, lat: s.lat, lon: s.lon, critico: !!s.critico, dias, agua, racha, ojo, horas: H.time };
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
  /* Perezoso (23-09-2026): el pulso y las pasadas saltadas —que son casi
     todas las llamadas— no cargan web-push (27 ms de CPU medidos en local
     por arranque, más en Vercel). Solo se paga cuando hay algo que enviar. */
  const { default: webpush } = await import('web-push');
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
    /* TTL y urgencia (27-09-2026): con TTL 3600 y sin urgencia, un móvil
       que retrase el aviso más de una hora (DuraSpeed, 25-09: 42 min) se
       queda sin él y aquí constaba como enviado. Lo importante vive 6 h.
       Y TODOS van con urgencia alta desde las 19:57 de ese mismo día: el
       aviso de agua de Arbaiza salió a las 19:31 y su móvil lo enseñó a
       las 19:52, al abrir la app. Con urgencia normal Android lo retiene;
       con alta lo despierta. Son pocos avisos: no hay nada que ahorrar. */
    try { await webpush.sendNotification({ endpoint: a.endpoint, keys: a.keys }, carga,
                                         { TTL: importante ? 6 * 3600 : 3600, urgency: 'high' }); enviados++; }
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
  const rEst = await fetch(`${APP}/api/euskalmet?puntos=${encodeURIComponent(puntos)}&radio=15`,
                           { signal: AbortSignal.timeout(12000) });
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
  /* Las ocho estaciones en UNA petición multipunto (27-09-2026): eran hasta
     ocho /om en serie en cada pasada, el 70-80 % de la CPU del vigilante. */
  const ocho = [...unicas.values()].slice(0, 8);
  let lista = [];
  try {
    const u8 = `${APP}/om?api=fc&latitude=${ocho.map(e => e.lat).join(',')}&longitude=${ocho.map(e => e.lon).join(',')}`
             + `&timezone=Europe%2FMadrid&hourly=wind_gusts_10m,precipitation,temperature_2m&forecast_days=1`
             + `&cell_selection=land&models=${MODELOS_MARCADOR.map(m => m[1]).join(',')}`;
    const r8 = await fetch(u8, { signal: AbortSignal.timeout(15000) });
    if (r8.ok) { const j8 = await r8.json(); lista = Array.isArray(j8) ? j8 : [j8]; }
  } catch { lista = []; }
  for (const [k, e] of ocho.entries()) {
    /* Los modelos EN LA ESTACIÓN, no en el emplazamiento: comparar el
       pronóstico de un cordal contra un aparato del valle no mide al
       modelo, mide el desnivel. */
    const H = lista[k]?.hourly;
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
    body: JSON.stringify({ muestras }), signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`marcador ${r.status}`);
  return { apuntadas: muestras.length, estaciones: unicas.size };
}

let peticiones = 0;   // para saber si la instancia estaba fría
export default async function handler(req, res) {
  /* Lo que cuesta esta llamada, en CPU de verdad (23-09-2026): sale en el
     pulso y en la pasada saltada, que es lo que más veces se llama. Así
     lo estimado en la auditoría del gasto pasa a ser medido. */
  peticiones++;
  const cpu0 = process.cpuUsage();
  const medida = () => ({ cpuMs: (u => Math.round((u.user + u.system) / 1000))(process.cpuUsage(cpu0)), frio: peticiones === 1 });
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
    /* 60 s de CDN (27-09-2026): cada apertura de la app lo pedía y la
       función arrancaba para decir lo mismo que hace medio minuto. */
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=30');
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
        return res.status(200).json({ ...medida(), ultima: e.cuando, haceMin, envia,
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
      return res.status(200).json({ ...medida(), ultima: e.cuando, haceMin, envia,
        lista: e.listaDeRespaldo ? 'respaldo' : 'la tuya',
        parteDe: e.parteDe ?? null,
        /* El segundo parte (13:00) también se mira desde fuera: decide si
           hoy le llega una confirmación o no, y aquí lo que decide se
           enseña. Misma razón que `envia` y `nLista` (26-09-2026). */
        parte2De: e.parte2De ?? null,
        parteResumen: e.parteResumen ?? null,
        /* ── Y A QUÉ HORA SALIÓ, QUE ES LO QUE SE DISCUTE ───────────────
           28-09-2026: el domingo el parte de la mañana le llegó a las
           07:48 y no a las 06:30. Por nuestro lado la ventana se salta el
           freno de cadencia desde las 06:00, así que debería salir en la
           primera llamada de después — pero eso no se podía comprobar
           desde fuera, solo suponer. Aquí sale la hora del intento, que
           es un dato y no una suposición. */
        parteIntentoEn: e.parteIntentoEn ?? null,
        sitios: Object.keys(e.sitios || {}).length,
        nLista: e.nLista ?? null,
        noMirados: e.noMirados ?? [],
        /* Lo que se está armando, en crudo: es lo que decide cada cuánto
           pasa el vigilante, y un número que decide tiene que poder
           mirarse desde fuera. Ya nos pasó con `envia` y con `nLista`. */
        ojo: e.ojo ?? null });
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

  let estadoDeFuera = null;
  if (deFuera) {
    /* Si el almacén no contesta no se sabe cuándo fue la última pasada.
       Se sigue adelante: el freno de 20 min es una cortesía, y perder una
       pasada por no poder leer el reloj sería el remedio peor. */
    let e = null;
    try { e = await leerEstado(); } catch { e = null; }
    estadoDeFuera = e;   // se reutiliza más abajo: no se lee dos veces (23-09-2026)
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
  const horaMarcadorAhora = horaLocal(new Date().toISOString());   // para apuntar en el marcador una vez por hora (27-09-2026)
  const manana = new Date(ahora); manana.setDate(manana.getDate() + 1);
  const claveManana = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
  /* ── QUÉ CUENTA DE MAÑANA AHORA MISMO: UNA SOLA PUERTA (27-09-2026) ──
     Suyo, 23:25, después de tres avisos de la misma noche con lo de
     mañana pegado a lo de hoy («hay que buscar la raíz, para que no pase
     en todas»): cinco sitios distintos leían `dias[claveManana]` cada
     uno a su manera. Desde aquí, TODOS pasan por `deManana()`: de mañana
     solo cuenta la madrugada que cae dentro de las tres horas siguientes
     (desde las 21:00; a las 22:00, hasta las 01h), recortada; el resto va
     en el parte de las 06:30. Devuelve null si no cuenta nada. El estado
     guardado NO se recorta: se recorta la lectura, no el dato. */
  /* Y de HOY solo lo que queda por delante (28-09-2026): el tramo de las
     00-01 h ya pasado hacía «se adelanta a 00h» a mediodía. */
  const deHoy = x => {
    if (!x) return null;
    const tr = (x.tramos || []).filter(r => r.fin >= h0);
    if (!tr.length) return null;
    return { ...x, ini: tr[0].ini, fin: tr[tr.length - 1].fin, tramos: tr };
  };
  const deManana = x => {
    const hastaManana = h0 + 3 - 24;        // negativo si no se cruza la medianoche (h0 se declara más abajo; esto corre después)
    if (!(hastaManana >= 0 && x && x.ini <= hastaManana)) return null;
    const tramos = (x.tramos || []).filter(r => r.ini <= hastaManana).map(r => ({ ...r, fin: Math.min(r.fin, hastaManana) }));
    return { ...x, fin: Math.min(x.fin, hastaManana), tramos };
  };
  const h0 = ahora.getHours();


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
  try { antes = estadoDeFuera ?? await leerEstado(); }
  catch (e) { noPudeLeerElEstado = String(e?.message || e).slice(0, 60); }

  const huecoPrevio = antes?.cuando
    ? Math.round((Date.now() - new Date(antes.cuando).getTime()) / 60000) : null;
  const algoEnMarcha = !!(antes && (
    antes.ultimoAviso
    || Object.values(antes.sitios || {}).some(d => d && Object.values(d).some(x => x && x.ini != null))
    || Object.values(antes.aguaSitios || {}).some(a => a && Object.keys(a).length)
    || Object.values(antes.rachaSitios || {}).some(a => a && Object.keys(a).length)));
  /* Las DOS ventanas de parte se saltan el freno de cadencia: la de la
     mañana (06-12) y la del segundo (13-16, desde el 26-09-2026). */
  /* Si el envío del parte falló (claves, FCM, ningún móvil), la ventana
     saltaba el freno EN CADA TIC durante horas. Como mucho un intento cada
     30 min (27-09-2026). */
  const parteHaceMin = antes?.parteIntentoEn
    ? (Date.now() - new Date(antes.parteIntentoEn).getTime()) / 60000 : Infinity;
  const ventanaDelParte = parteHaceMin >= 30 && (
       (h0 >= 6 && h0 < 12 && antes?.parteDe !== claveHoy)
    || (h0 >= 13 && h0 < 16 && antes?.parte2De !== claveHoy));

  /* `mirar=1` es su ojeada a mano: esa nunca se salta. Se lee aquí
     directo porque `pedidoMirar` se declara más abajo. */
  /* ── VERDE, ÁMBAR, ROJO: LA CADENCIA SUBE SOLA ─────────────────────
     El cron externo llama y AQUÍ se decide si toca pasar.

       verde  — nada en marcha Y nada armándose → cada 3 h, pero NUNCA
                más de DOS entre las 11 y las 22 (la nota de la galerna,
                aquí abajo)
       ámbar  — hay rayo, agua o racha apuntados (hoy o mañana) → cada 2 h
       rojo   — rayo de HOY todavía por delante, racha por encima de su
                tope por delante, o tormenta inminente ya avisada → MEDIA
                HORA. Es lo único que se acelera, y lo pidió él así: «solo
                cuando se detecte estas cosas que se active, y si no, hay
                pasada normal»

     LO QUE DECÍA ESTA NOTA HASTA EL 26-09-2026, y que ya NO vale: el
     13-09 él pidió «cada media hora en ámbar y cada cuarto de hora en
     rojo: una tormenta de verano se monta en una hora». Se hizo así.

     El 25 y el 26-09 lo cambió tres veces, a la baja, y dio las razones:
     *«no quiero limitar Vercel porque el Centro Operativo es muy
     importante para mi trabajo»* · *«el tiempo no cambia cada 15 minutos
     ni en 1 hora»* · *«si ves a las 7 de la mañana ya sabes lo que te va
     a venir dentro de 3, 4 o 12 horas»* · *«veo los mapas y ya sé lo que
     viene»* · *«ni los cazahuracanes»*.

     Y el dato lo respalda: AROME e ICON se actualizan cada 3 h y ECMWF
     cuatro veces al día, así que en dos horas hay, como mucho, un
     pronóstico nuevo. Lo de «una tormenta de verano se monta en una
     hora» sigue siendo cierto, pero ESTE vigilante no lee descargas
     medidas —eso lo hace la app en el móvil al abrirla—, así que la
     cadencia corta no le compraba tiempo de reacción ante un rayo ya
     caído.

     EL CRON: el 26-09 lo puso él en **cada 30 minutos** en cron-job.org.
     Con la cadencia en 2 h, ese tic solo sirve para entrar, ver que no
     toca y salir (~7 ms). Si algún día vuelve a querer pasadas más
     finas, hay que bajar el cron ANTES: aquí no se puede pasar más a
     menudo de lo que el cron llama.

     EL PRECIO, dicho por escrito: si algo se arma justo después de una
     pasada, lo sabrá hasta dos horas más tarde. Lo decidió él sabiéndolo.

     La app, al abrirse, sigue pidiendo el tiempo en vivo: eso no depende
     de esto. Una llamada saltada cuesta ~50 ms de CPU. */
  const porDelante = x => x && (x.fin == null || x.fin >= h0);
  const rojo = !!(antes && (
    antes.ultimoAviso
    /* Con la medianoche por delante, la madrugada cuenta igual: si no, esa
       noche el vigilante se queda en ámbar (cada media hora) justo cuando
       se está armando lo de las 00:00 (20-09-2026). */
    || Object.values(antes.sitios || {}).some(d => porDelante(d?.[claveHoy])
         || deManana(d?.[claveManana]))
    || Object.values(antes.rachaSitios || {}).some(r => r?.[claveHoy] && r[claveHoy].kmh >= RACHA_TOPE && porDelante(r[claveHoy]))));
  /* ══════════════════════════════════════════════════════════════════
     LA GALERNA (21-09-2026)
     ──────────────────────────────────────────────────────────────────
     Él, de guardia, cuando se le bajó la pasada de verde a 3 h: *«en días
     como hoy cada 3 vale»* … y acto seguido, *«aquí a veces hay un día
     bueno y al de unas horas entra galerna o truenos»* · *«míralo bien
     para que no nos pille la tormenta, lluvias… etc»* · *«sentido común
     siempre»*.

     Tiene toda la razón, y con 3 h planas el arreglo era peor que la
     enfermedad. La galerna del Cantábrico es exactamente eso: mañana
     calma y calor, y en media hora el viento del noroeste de golpe. Un
     hombre a 40 m, o con el 4x4 en una pista, no puede enterarse tres
     horas tarde.

     Así que la cadencia la manda el RIESGO y la HORA, no el reloj:

       rojo  (cada 15 min) — hay aviso suelto, o rayo o racha de 70 por
                             delante. Igual que antes.
       ámbar (cada 30 min) — algo guardado en marcha, **o algo
                             ARMÁNDOSE**: CAPE de 300 para arriba, racha
                             de 45 para arriba o agua de 0,3 mm/h para
                             arriba en las horas que quedan. Esos tres
                             números están POR DEBAJO de sus listones de
                             aviso a propósito: la cadencia sube ANTES de
                             que nada salte, no después.
       verde (cada 3 h)    — ni una cosa ni la otra. Lo que él pidió.
                             PERO con suelo: entre las 11 y las 22, nunca
                             más de una hora. Porque la galerna la
                             infravaloran los modelos, y ese es justo el
                             rato en que un día bueno se tuerce aquí.

     Lo que cuesta: de noche y por la mañana, MENOS pasadas que antes. Por
     la tarde, una por hora. Y cada pasada vale ahora 2 peticiones en vez
     de 40 (ver `pedirTanda`), así que aun con más pasadas el gasto cae en
     picado respecto a esta misma mañana. Era lo que él quería ahorrar, y
     se ahorra donde de verdad estaba el gasto.                        */
  const CAPE_OJO = 300, RACHA_OJO = 45, AGUA_OJO = 0.3;
  const o = antes?.ojo || null;
  const seArma = !!o && ((o.cape ?? 0) >= CAPE_OJO || (o.racha ?? 0) >= RACHA_OJO
                      || (o.agua ?? 0) >= AGUA_OJO);
  const nivel = rojo ? 'rojo' : (algoEnMarcha || seArma) ? 'ambar' : 'verde';
  /* 175 y no 180: el cron pasa cada cuarto de hora, así que el primer
     tic que supera 175 min es justo el de las 3 h en punto. Con 180 se
     iría al siguiente y saldrían pasadas de 3 h 15. Lo mismo con el 55
     de la tarde: el tic de la hora en punto. */
  /* ── EL SUELO LO MANDA EL HUECO, NO EL TIC (22-09-2026) ────────────
     MEDIDO en producción la misma noche que se puso: la última pasada
     fue a las 21:00:51 y a las 22:21 no había vuelto a pasar. La
     siguiente caía a las 23:56. **Dos horas y cincuenta y seis minutos
     de silencio**, empezados dentro de la franja que él pidió proteger.

     Por qué: `h0 >= 11 && h0 < 22` se miraba en el TIC. A las 21:15,
     21:30 y 21:45 el listón era 55 y el hueco (15, 30, 45) no llegaba. A
     las 22:00 el tic entra con h0=22, el listón salta a 175 de golpe, y
     el hueco de 60 min se queda corto. Y así hasta las 23:56.

     O sea que la cadencia de tarde moría a las 21:00, una hora antes de
     lo prometido, y se llevaba por delante el anochecer —que en julio
     aquí es a las 21:45— justo cuando él trabaja de noche.

     Ahora el suelo vale si la franja protegida la toca EL TIC **o LA
     ÚLTIMA PASADA**: mientras el hueco que se está abriendo arranque
     dentro de las 11-22, manda el 55. */
  const enFranja = h => h >= 11 && h < 22;
  const hPrevia = antes?.cuando ? new Date(antes.cuando).getHours() : null;
  const tardeAquí = enFranja(h0) || (hPrevia !== null && enFranja(hPrevia));
  /* ── LA CADENCIA, BAJADA POR ÉL (25-09-2026) ──────────────────────
     Era rojo 10 · ámbar 25 · verde 175 (55 de tarde). Suyo, esa noche:
     *«no quiero limitar Vercel porque el Centro Operativo es muy
     importante para mi trabajo»* · *«cuando hay mal tiempo, pasando a
     cada media hora o 1 hora es más que suficiente»* · *«las webs de
     Ventusky etc. se actualizan cada tres horas; si mirando los mapas ya
     te aclaras»*.

     Y el argumento es bueno, no es solo ahorro: **AROME se actualiza
     cada 3 horas** (00, 03, 06… UTC), igual que ICON; ECMWF, cuatro
     veces al día. Pasar cada 10 minutos era releer ocho veces el mismo
     pronóstico. Lo comprobado de lo que ESTE vigilante mira:

         el pronóstico de los cinco modelos ..... cambia cada 3 h
         las estaciones de Euskalmet ............ cada 10 min
         los avisos oficiales de AEMET .......... unas veces al día

     No lee descargas medidas —eso lo hace la app en el móvil al abrirla—,
     así que la cadencia corta no le compraba tiempo de reacción ante un
     rayo ya caído.

     EL PRECIO, dicho una vez: si algo se arma justo después de una
     pasada, lo sabrá hasta 30 minutos más tarde en vez de 10. Él lo ha
     decidido sabiéndolo, y la razón de fondo es suya: la misma cuenta de
     Vercel sostiene su web de trabajo, y si esa cuenta se capa se le cae
     el reparto de la jornada.

     El suelo de tarde sube de 55 a 60 para que no quede por debajo del
     ámbar: un verde que mira más a menudo que un ámbar no tiene sentido. */
  /* 26-09-2026, y es la tercera vez que la baja en dos días porque tiene
     razón: *«si ves a las 7 de la mañana ya sabes lo que te va a venir
     dentro de 3, 4 o 12 horas»* · *«pasando cada 2 horas ya vale»* · *«el
     tiempo no cambia cada 15 minutos, no tiene sentido»* · *«¿para qué
     tanta vigilancia gastando Vercel?»*.

     Y el rojo TAMBIÉN cada dos horas, porque insistió: *«no tiene sentido
     vigilar cada 10 segundos o 15 minutos ni 1 hora, por favor»* ·
     *«es absurdo»*. Tiene razón y el dato lo respalda: AROME e ICON se
     actualizan cada 3 h y ECMWF cuatro veces al día, así que en dos
     horas, como mucho, hay un pronóstico nuevo.

     Queda, pues, DOS HORAS en todo salvo el verde de noche, que son
     tres. El precio, dicho una vez y por escrito: si algo se arma justo
     después de una pasada, lo sabrá hasta dos horas más tarde. Él lo
     decide sabiéndolo, y su razón es buena — mira el mapa por la mañana
     y ya sabe lo que viene. */
  /* ── Y QUE SE ACELERE SOLA CUANDO HAY ALGO (26-09-2026) ───────────
     Suyo, esa tarde, después de que yo le ofreciera subir la cadencia «a
     mano solo mañana»: *«o solo cuando se detecte estas cosas que se
     active, y si no, hay pasada normal»* · *«sería lo suyo»*.

     Es mejor que lo mío: no hay que acordarse de subirla la víspera ni de
     devolverla al día siguiente. Y es lo que los tres niveles ya hacían
     antes de que yo los aplanara todos a 120 esa misma mañana.

     La normal se queda en SUS dos horas, y el ROJO —y solo el rojo—
     vuelve a media hora. Rojo no es «hay algo de CAPE»: es la combinación
     de verdad todavía POR DELANTE hoy (rayo previsto con la tapa abierta,
     o racha por encima de su tope), o un aviso ya mandado. Son días
     contados al año, así que no le mueve el gasto de Vercel.

     EL CASO QUE LO PIDIÓ, medido esa tarde para el domingo 27 en sus
     emplazamientos, hora a hora y con la tapa del MISMO modelo y la MISMA
     hora —que es como hay que medirlo, ver abajo—:

         VIRGEN ORDUÑA  15h 940/192 · 16h 1060/103 · 17h 1480/67 ⚡
         ARBAIZA        15h 940/145 · 16h 1170/80  · 17h 1120/68 ⚡
         BERMEO         todo el día con la tapa entre 300 y 480: aguanta

     Con la cadencia plana, la pasada de las 16:00 veía lo de las 17:00 y
     la siguiente caía a las 18:00, con la ventana pasada. Ahora esa misma
     pasada pone el nivel en rojo y la siguiente entra a las 16:30.

     OJO CON CÓMO SE MIDE ESTO: la primera lectura de ese domingo dio
     «Zeberio 1720 con tapa 53, rompe» y era FALSA — emparejaba el CAPE
     más alto de un modelo con la tapa de otro y de otra hora. El mismo
     fallo que la app lleva toda la semana arreglando, cometido al
     medirla. Hora a hora y con el mismo modelo, Zeberio no rompe. */
  const cadaMin = { verde: tardeAquí ? 120 : 180, ambar: 120, rojo: 30 }[nivel];
  /* El suelo de tarde se queda, en sus dos horas: lo puso él el 22-09 por
     «aquí a veces hay un día bueno y al de unas horas entra tormenta», y
     eso no lo deroga bajar la cadencia. De noche, tres. */
  const ojeadaAMano = req.query?.mirar === '1' || req.body?.mirar === true;
  /* `- 5`: el sello `cuando` se escribe al FINAL de la pasada y `huecoPrevio`
     va redondeado, así que una pasada de más de 30 s hacía que el tic de
     las 2 h viese 119 y se saltase hasta el siguiente: 2 h 30 en vez de 2.
     Cinco minutos de margen y la cadencia es la que él fijó (27-09-2026). */
  if (!ojeadaAMano && !ventanaDelParte && huecoPrevio !== null && huecoPrevio < cadaMin - 5) {
    return res.status(200).json({
      ok: true, saltada: true, nivel, ...medida(),
      nota: `${nivel}: se pasa cada ${cadaMin} min`,
      ultimaPasada: antes.cuando,
    });
  }

  /* (23-09-2026) La lista de torres se pide AQUÍ, después del portero de
     cadencia: una pasada saltada —la mayoría de las llamadas— no tiene por
     qué invocar /api/torres, que es otra función Node entera. */
  /* Su lista de verdad, la que guarda la app. Si falla, la de respaldo. */
  let sitios = SITIOS, listaDeRespaldo = true;
  try {
    const rt = await fetch(`${APP}/api/torres`, { signal: AbortSignal.timeout(8000) });
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

  /* Dos peticiones para los veinte. Si alguna tanda falla, sus huecos los
     rellena cada sitio por su cuenta dentro de `unSitio` (ver la nota). */
  let tandaL = null, tandaC = null;
  /* ── UN HIPO NO PUEDE CONVERTIRSE EN VEINTE PETICIONES (26-09-2026)
     Él, esa mañana, con el aviso «no he podido mirar BERMEO, LEKEITIO
     MOV, VIRGEN ORDUÑA, PUNTA-GALEA»: *«esto pasa a diario»* · *«¿esto
     qué es y por qué pasa tantas veces?»*.

     MEDIDO esa misma hora: los cuatro contestaban bien y rápido, y la
     petición de los veinte iba a 0,3 s con 20 de 20. O sea que no era la
     API ni eran esos sitios. Era ESTO:

       · la tanda fallaba una vez, por lo que fuera, y se daba por perdida
         a la primera;
       · y entonces los veinte salían a pedir lo suyo A LA VEZ, con
         `Promise.all`, contra el mismo intermediario.

     Que es exactamente el atasco que este fichero documenta desde el
     21-09 —«cuarenta peticiones simultáneas: las que llegan tarde se
     caen»— y que la tanda vino a arreglar. El remedio lo provocaba de
     vuelta por la puerta de atrás, cada vez que había un hipo.

     Ahora: la tanda se reintenta UNA vez antes de rendirse (una petición
     de más, y solo cuando ha fallado), y si aun así no hay tanda, los
     sueltos van EN GRUPOS DE CUATRO en vez de los veinte de golpe. */
  const conReintento = async cel => {
    try { return await pedirTanda(sitios, cel); }
    catch { try { return await pedirTanda(sitios, cel); } catch { return null; } }
  };
  tandaL = await conReintento('land');
  tandaC = await conReintento('nearest');

  const pedirUno = (s, i) =>
    unSitio(s, { H: tandaL?.[i] || null, C: tandaC?.[i] || null },
            { desde: `${claveHoy}T${String(h0).padStart(2, '0')}` })
      .then(x => ({ ...x, ok: true }))
      .catch(e => ({ n: s.n, critico: !!s.critico, ok: false, fallo: String(e.message || e) }));

  /* Con las dos tandas buenas esto no pide nada: `unSitio` usa lo que ya
     tiene y los grupos pasan de largo. Los grupos solo muerden cuando ha
     habido que ir sitio a sitio, que es justo cuando se atascaba. */
  const datos = [];
  for (let i = 0; i < sitios.length; i += 4) {
    const trozo = sitios.slice(i, i + 4);
    datos.push(...await Promise.all(trozo.map((s, k) => pedirUno(s, i + k))));
  }

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
  const inminentes = buenos.filter(d => {
    if (deManana(d.dias[claveManana])) return true;
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
      /* SU TOPE, no un 60 escrito a mano (26-09-2026). Lo de arriba ya
         dice «solo de lo gordo — su tope de racha», y el número puesto
         aquí era el listón viejo de la torre: el 25-09 él los subió a 70
         de aviso y 90 de límite y este 60 se quedó como estaba, avisando
         por debajo de su propio ámbar. */
      /* Lo que QUEDA por delante, y cada número con la hora de SU pico
         (antes: el máximo del día con la primera hora que pasaba de 70). */
      const pr = picoEnHoras(r, h0, 23), pa = picoEnHoras(ag, h0, 23);
      if (pr) gordos.push(`${d.n} racha ${pr.v} km/h a las ${hh(pr.h)}`);
      else if (pa) gordos.push(`${d.n} lluvia fuerte ${coma(pa.v)} mm/h a las ${hh(pa.h)}`);
    }
    if (gordos.length) {
      cambios.push({ n: gordos[0].split(' ')[0], cual: 'hoy', peor: true, critico: false,
        que: gordos.some(g => / racha /.test(g)) ? 'racha' : 'agua',
        soloEstado: true,
        txt: `${gordos.slice(0, 3).join(' · ')}${gordos.length > 3 ? ` y ${gordos.length - 3} más` : ''}`
           + ' — (aviso por lo que hay: el vigilante no puede comparar con antes)' });
    }
  }

  if (antes?.sitios) {
    for (const d of buenos) {
      /* LO DE MAÑANA SE AVISA MAÑANA (27-09-2026, 20:01, su pantallazo:
         «CAMBIO MAÑANA · BERMEO (mañana): ahora da rayo de 00h a 13h…
         OIZ (mañana): 13h-18h pasa a 13h-19h»). El rayo de mañana solo
         cuenta si empieza en las tres horas siguientes (la madrugada,
         desde las 21:00: `hastaManana`); el resto va en el parte de las
         06:30. */
      for (const [clave, cual] of [[claveHoy, 'hoy'], [claveManana, 'mañana']]) {
        if (cual === 'mañana' && !deManana(d.dias[clave])) continue;
        const a = cual === 'mañana' ? deManana(antes.sitios[d.n]?.[clave]) : deHoy(antes.sitios[d.n]?.[clave]);
        const b = cual === 'mañana' ? deManana(d.dias[clave]) : deHoy(d.dias[clave]);
        if (!a && !b) continue;
        /* Lo que ya pasó no es aviso (§11): un tramo de HOY que acabó antes de esta hora se calla. */
        if (!a && b) { if (!(cual === 'hoy' && b.fin < h0)) cambios.push({ n: d.n, lat: d.lat, lon: d.lon, cual, txt: `ahora da rayo ${tramoTxt(b.ini, b.fin)}`, peor: true, critico: d.critico }); continue; }
        if (a && !b) { cambios.push({ n: d.n, lat: d.lat, lon: d.lon, cual, txt: `ya no da rayo (antes ${rangoTxt(a.ini, a.fin)})`, peor: false, critico: d.critico }); continue; }
        /* Solo si se ADELANTA dos horas o más (28-09-2026): «00h-14h pasa a
           00h-15h» cada hora era ruido. Alargarse por el final no cambia
           lo que él decide ahora; empezar antes, sí. */
        if (b.ini <= a.ini - 2 && !(cual === 'hoy' && b.fin < h0)) {
          cambios.push({ n: d.n, lat: d.lat, lon: d.lon, cual, txt: `el rayo se adelanta: desde las ${hh(b.ini)} (antes desde las ${hh(a.ini)}), hasta las ${hh(b.fin)}`,
                         peor: true, critico: d.critico });
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
      /* Solo HOY (27-09-2026): el agua y la racha de mañana van en el parte
         de las 06:30, no en un aviso a las 20:00 de hoy. */
      for (const [clave, cual] of [[claveHoy, 'hoy']]) {
        const va = antes.aguaSitios?.[d.n]?.[clave], vb = d.agua?.[clave];
        if (vb && !va && hayAguaGuardada && !(cual === 'hoy' && vb.fin < h0)) {
          cambiosAgua.push({ n: d.n, lat: d.lat, lon: d.lon, cual, peor: true, critico: d.critico,
            txt: `${vb.fuerte ? 'lluvia fuerte' : 'agua'} ${tramosTxt(vb.tramos, vb.ini, vb.fin)}`
               + ` (pico ${coma(vb.mm)} mm/h ${picoTxt(vb.hPico, vb.ini)}, lo ve ${vb.quien})` });
        } else if (vb && va && !(cual === 'hoy' && vb.fin < h0)) {
          const aFuerte = !va.fuerte && vb.fuerte;
          const antesDe = vb.ini <= va.ini - 2;
          if (aFuerte || antesDe) {
            cambiosAgua.push({ n: d.n, lat: d.lat, lon: d.lon, cual, peor: true, critico: d.critico,
              txt: aFuerte
                ? `el agua pasa a fuerte: ${coma(vb.mm)} mm/h ${picoTxt(vb.hPico, vb.ini)}`
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
  /* Desde las 21:00 un sitio puede estar aquí SOLO por su rayo de mañana
     (`hastaManana`): sin `dias[claveHoy]` esto reventaba la pasada entera
     (TypeError) y no salía ni aviso ni estado, justo en la franja de la
     noche que el 20-09 quiso cubrir (27-09-2026). La firma de hoy no cambia
     de forma para no repetir avisos ya mandados. */
  /* LA FIRMA SON LOS SITIOS, NO LAS HORAS (28-09-2026): con las horas
     dentro, cada pasada las movía una y el mismo aviso salía cada hora
     («MATIENA (crítico) y 18 más» a las 11:00, «y 16 más» a las 12:00).
     Suyo: «a veces no sé ni lo que estoy leyendo». Vuelve a sonar solo si
     entra un sitio nuevo; las horas que se mueven van por «CAMBIO», y
     solo si se adelantan dos o más. */
  /* ── LO QUE PASA EN CADA SITIO EN LAS PRÓXIMAS TRES HORAS (28-09-2026) ──
     Suyo, 12:15: «a mí no me interesa si cambia o no cambia; me interesa
     en esos momentos, o dentro de dos o tres horas, qué va a pasar en
     cada sitio, nada más». Así que el aviso es ESO: por sitio, rayo,
     agua fuerte o racha de 70 dentro de las tres horas siguientes, con
     su hora. Los avisos de «cambio» se apagan (AVISAR_CAMBIOS). */
  /* Cada TRAMO que cae en las tres horas siguientes se dice una vez,
     recortado a lo que queda: «rayo ahora y hasta las 17h», «rayo 16h-17h».
     Lo de más allá de las tres horas sonará cuando entre en la ventana
     (28-09-2026, 14:27: «SANTAMAÑA: rayo 13h-19h» a las 14:00 arrastraba
     la hora pasada y contaba hasta las 19). */
  const H3 = h0 + 3;
  const tramoTxt3 = (t, pref) => {
    const fin = Math.min(t.fin, H3);
    return t.ini <= h0 ? `${pref}ahora y hasta las ${hh(fin)}` : (t.ini === fin ? `${pref}a las ${hh(t.ini)}` : `${pref}${hh(t.ini)}-${hh(fin)}`);
  };
  const tramosEnVentana = x => (x?.tramos || []).filter(t => t.ini <= H3 && t.fin >= h0);
  const queViene = d => {
    const f = [];
    for (const t of tramosEnVentana(deHoy(d.dias[claveHoy])))
      f.push({ que: 'rayo', clave: `rayo:${t.ini}`, txt: `riesgo de rayo ${tramoTxt3(t, '')}` });   // «riesgo»: es modelo, no medida (28-09-2026, 15:32)
    const rm = deManana(d.dias[claveManana]);
    for (const t of (rm?.tramos || []))
      f.push({ que: 'rayo', clave: `rayo:m${t.ini}`, txt: `riesgo de rayo mañana ${t.ini === t.fin ? hh(t.ini) : `${hh(t.ini)}-${hh(t.fin)}`}` });
    /* Solo las horas que de verdad pasan de 2 mm/h, con el pico de ESAS
       horas y su modelo, y «prevista»: es modelo, no medida (30-09-2026,
       su captura de las 13:34 con el cielo gris y seco). */
    const ag = d.agua?.[claveHoy];
    for (const t of tramosEnVentana(deHoy({ tramos: ag?.fuertes }))) {
      const p = picoEnHoras(ag, Math.max(t.ini, h0), Math.min(t.fin, H3));
      f.push({ que: 'agua', clave: `agua:${t.ini}`,
               txt: `agua fuerte prevista ${tramoTxt3(t, '')}${p ? ` (${coma(p.v)} mm/h, ${p.quien})` : ''}` });
    }
    /* La racha, igual: su número es el de ESAS horas, no el máximo del día. */
    const ra = d.racha?.[claveHoy];
    for (const t of tramosEnVentana(deHoy(ra))) {
      const p = picoEnHoras(ra, Math.max(t.ini, h0), Math.min(t.fin, H3));
      f.push({ que: 'racha', clave: `racha:${t.ini}`,
               txt: `racha prevista ${tramoTxt3(t, '')}${p ? ` (${p.v} km/h, ${p.quien})` : ''}` });
    }
    return f;
  };
  const proximas = buenos.map(d => ({ d, f: queViene(d) })).filter(x => x.f.length);
  const firmaAhora = proximas.flatMap(x => x.f.map(f => `${x.d.n}:${f.clave}`)).sort().join('|');
  /* Ya avisado si NADA es nuevo respecto a lo dicho. Las firmas viejas
     («BERMEO», «BERMEO:0-2», «BERMEO:rayo») valen por cualquier tramo de
     rayo de ese sitio, para no repetir tras publicar. */
  const dichasViejas = new Set(), dichas = new Set();
  for (const x of String(antes?.ultimoAviso || '').split('|').filter(Boolean)) {
    const [n, q, t] = x.split(':');
    if (['rayo', 'agua', 'racha'].includes(q) && t !== undefined) dichas.add(x); else dichasViejas.add(n);
  }
  const yaDicho = x => dichas.has(x) || (x.split(':')[1] === 'rayo' && dichasViejas.has(x.split(':')[0]));
  const yaAvisado = firmaAhora.split('|').filter(Boolean).every(yaDicho);
  const AVISAR_CAMBIOS = false;   // apagado el 28-09-2026 por él: «si cambia o no cambia no me interesa»

  const avisos = [];
  if (proximas.length && !yaAvisado) {
    const orden = [...proximas].sort((a, b) => (b.d.critico ? 1 : 0) - (a.d.critico ? 1 : 0));
    const crit = orden[0].d.critico;
    /* El símbolo dice QUÉ viene (30-09-2026): un aviso que solo era de agua
       salía con el ⚡ del rayo, que es su veto y le hace leerlo distinto. */
    const ico = simboloDe(proximas.flatMap(x => x.f.map(f => f.que)));
    const lista = orden.slice(0, 5).map(x => `${x.d.n}: ${x.f.map(f => f.txt).join(' · ')}`).join('. ');
    avisos.push({
      titulo: crit ? `${ico} ${orden[0].d.n} (crítico)${proximas.length > 1 ? ` y ${proximas.length - 1} más` : ''}`
                   : `${ico} Próximas 3 h · ${proximas.length === 1 ? orden[0].d.n : `${proximas.length} sitios`}`,
      url: './?v=torres',
      cuerpo: `${lista}${proximas.length > 5 ? `. Y ${proximas.length - 5} más` : ''}. Datos de las ${hh(h0)}.`,
      tag: 'tormenta', importante: true,
    });
  }
  if (AVISAR_CAMBIOS && cambiosQueValen.length) {
    const c = cambiosQueValen[0];
    avisos.push({
      titulo: `${simboloDe(cambiosQueValen.map(x => x.que ?? 'rayo'))} CAMBIO ${c.cual.toUpperCase()} · ${cambiosQueValen.length > 1 ? `${cambiosQueValen.length} torres` : c.n}`,
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
  if (AVISAR_CAMBIOS && aguaQueVale.length) {
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
  if (AVISAR_CAMBIOS && rachaQueVale.length) {
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

  /* ── «SI DAN BUENO Y NO DAN NADA MALO, NI HACE FALTA» (21-09-2026) ──
     Suyo, con el pantallazo de las 14:01 delante y él de guardia: le sonó
     el móvil en el monte para decirle que no se habían podido mirar siete
     sitios, un día con los veinte en verde y el parte de las 06:46 ya
     dicho: «ni rayo ni lluvia que moje». *«A parte si dan bueno y no dan
     nada malo ni hace falta»* · *«dan bueno todo el día, e incluso la
     semana entera, sobra»*.

     Y es la regla de siempre de esta app: **un aviso que suena cuando no
     hace falta deja de significar algo**, y el que se lo come es el que
     está subiendo por una pista.

     Así que el aviso sigue existiendo —callarse un hueco es afirmar que
     está tranquilo, y eso no se hace— pero solo SUENA cuando puede
     cambiar algo:
       · falla un sitio marcado como crítico;
       · el día NO está en verde (hay rayo, agua o racha apuntados);
       · o el hueco se repite: ya venía de la pasada anterior, así que no
         es un tropiezo, es que ese sitio lleva rato sin mirarse.
     En verde y de una sola vez, se apunta y se enseña en la pantalla de
     Mis estaciones («no se han podido mirar N»), sin despertar a nadie.

     El origen del tropiezo, además, se arregló el mismo día: eran cuarenta
     peticiones a la vez. Ver la nota de `pedirTanda`. */
  /* ── DOS ARREGLOS DEL 22-09-2026, LOS DOS DE AYER MISMO ────────────

     UNO. EL CRÍTICO HABÍA PERDIDO SU PUERTA. Ayer esto era
     `fallos.some(f => f.critico) || fallos.length >= 4`, y al meter el
     filtro de ruido quedó `fallos.length >= 4 && huecoImporta`: el
     crítico pasó a ser una de las tres razones DENTRO de la Y. Con
     MATIENA o SANTAMAÑA caídos ellos solos —`fallos.length = 1`— no
     sonaba nada, y el comentario de aquí arriba seguía prometiendo por
     escrito que un crítico suena. Son los dos únicos marcados así, y
     SANTAMAÑA está ahí porque él dijo «es un crítico muy importante que
     tenemos». Encima, desde que los veinte van en una tanda, el fallo
     SUELTO es el caso frecuente y la caída en masa el raro: el cambio
     desactivó el aviso justo en lo que pasa a menudo.

     DOS. «¿ESTÁ EL DÍA EN VERDE?» MIRABA LA PASADA ANTERIOR. `nivel` se
     calcula ANTES de pedir los datos, solo con el estado guardado. O sea
     que es un indicador retrasado: el primer momento en que un día se
     tuerce es justo el momento en que el hueco se calla. Escenario: se
     caen 6 de 20, entre ellos Sollube y Oiz, y los 14 que sí contestan
     traen CAPE 900 con tapa 40 para esta tarde. Le sonaba «se está
     armando en 8» y NI UNA PALABRA de los seis que no se miraron. Eso es
     literal el «callarse un hueco es afirmar que está tranquilo».
     Ahora también cuenta lo que se acaba de ver en ESTA pasada. */
  const seRepite = fallos.some(f => (antes?.noMirados || []).includes(f.n));
  const hayCritico = fallos.some(f => f.critico);
  /* Solo con SUS listones y POR DELANTE (27-09-2026): antes bastaba el ojo
     (CAPE 300, racha 45, 0,3 mm en cualquier hora, pasadas incluidas) para
     que sonara «no he podido mirar» un día que «dan bueno», que es justo lo
     que él pidió que no sonara. */
  const porDelanteHoy = x => x && (x.fin == null || x.fin >= h0);
  const loQueAcaboDeVer = buenos.some(d =>
    (d.dias && (porDelanteHoy(d.dias[claveHoy]) || deManana(d.dias[claveManana])))
    || (d.racha && porDelanteHoy(d.racha[claveHoy]))
    || (d.agua?.[claveHoy]?.fuertes || []).some(t => t.fin >= h0));
  /* Sin poder leer el estado no se puede comparar, y ahí el hueco pesa
     MÁS, no menos: `nivel` valdría verde por defecto y callaría. */
  const aCiegas = !antes;
  const huecoImporta = nivel !== 'verde' || loQueAcaboDeVer || aCiegas;   // repetirse en verde no suena: se dice como motivo si suena
  if (hayCritico || (fallos.length >= 4 && huecoImporta)) {
    const porQue = hayCritico ? ' Hay alguno de los que no pueden faltar.'
                 : seRepite ? ' No es un tropiezo: ya no se pudieron mirar en la pasada anterior.'
                 : aCiegas ? ' Y encima no he podido leer lo de la pasada anterior para comparar.'
                 : ' Y hay algo apuntado, así que el hueco pesa.';
    avisos.push({
      titulo: `⚠ No he podido mirar ${fallos.length} emplazamiento(s)`,
      url: './?v=torres',
      cuerpo: fallos.map(f => f.n).join(', ') + '. No des por hecho que están tranquilos.' + porQue,
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
  /* El resumen del parte del día (tres cuentas) y si el segundo ya se ha
     resuelto hoy. Los usa el parte de las 13:00 para decir qué cambia. */
  let resumenHoy = antes?.parteResumen ?? null;
  let mandado2 = false;
  const HORA_PARTE = 6;
  /* Lo que ya ha pasado no «sigue en pie» (27-09-2026): a las 13:00 el agua
     de las 08 contaba como aviso del día. Solo lo que queda por delante. */
  const quedaHoy = x => x && x.fin >= h0;
  const tocaParte = h0 >= HORA_PARTE && h0 < 12 && antes?.parteDe !== claveHoy;
  if (tocaParte) {
    const conRayo = buenos.filter(d => quedaHoy(d.dias[claveHoy]));
    const conAgua = buenos.filter(d => quedaHoy(d.agua?.[claveHoy]));
    const conRacha = buenos.filter(d => quedaHoy(d.racha?.[claveHoy]));

    const trozos = [];
    if (conRayo.length) {
      trozos.push(`⚡ rayo en ${sitiosTxt(conRayo.length)}: `
        + conRayo.slice(0, 3).map(d => `${d.n} ${cuandoTxt(d, claveHoy, claveManana, deManana, h0)}`).join(' · ')
        + (conRayo.length > 3 ? ` y ${conRayo.length - 3} más` : ''));
    }
    if (conAgua.length) {
      const peor = conAgua.reduce((a2, b2) => b2.agua[claveHoy].mm > a2.agua[claveHoy].mm ? b2 : a2);
      trozos.push(`🌧 agua en ${sitiosTxt(conAgua.length)}: lo más fuerte ${peor.n} `
        + `${coma(peor.agua[claveHoy].mm)} mm/h ${picoTxt(peor.agua[claveHoy].hPico, peor.agua[claveHoy].ini)}`
        + `, y llueve ${tramosTxt(peor.agua[claveHoy].tramos, peor.agua[claveHoy].ini, peor.agua[claveHoy].fin)}`);
    }
    if (conRacha.length) {
      const peor = conRacha.reduce((a2, b2) => b2.racha[claveHoy].kmh > a2.racha[claveHoy].kmh ? b2 : a2);
      trozos.push(`💨 racha de ${RACHA_TOPE}+ en ${sitiosTxt(conRacha.length)}: lo peor ${peor.n} `
        + `${peor.racha[claveHoy].kmh} km/h ${picoTxt(peor.racha[claveHoy].hPico, peor.racha[claveHoy].ini)}`
        + `, y pasa de ${RACHA_TOPE} ${tramosTxt(peor.racha[claveHoy].tramos, peor.racha[claveHoy].ini, peor.racha[claveHoy].fin)}`);
    }

    avisos.push({
      titulo: trozos.length
        ? `El parte de hoy · ${conRayo.length + conAgua.length + conRacha.length} avisos`
        : 'El parte de hoy · sin nada por encima de tus listones',
      cuerpo: (trozos.length
        ? trozos.join('. ')
        : `Los ${buenos.length} emplazamientos, sin rayo, sin agua de ${coma(AGUA_MIN)} mm/h para arriba y sin rachas de ${RACHA_TOPE}.`)
        + ` Ábrela para el detalle.`,
      tag: 'parte', importante: false,
    });
    resumenHoy = { fecha: claveHoy, rayo: conRayo.map(d => d.n), agua: conAgua.map(d => d.n), racha: conRacha.map(d => d.n) };
  }

  /* ══════════════════════════════════════════════════════════════════
     EL SEGUNDO PARTE, A LAS 13:00 (26-09-2026)
     ──────────────────────────────────────────────────────────────────
     Suyo: *«mejor a primera hora para saber, y luego al mediodía con otra
     pasada ya se sabrá más seguro»*.

     Y es verdad que se sabe más, porque el pronóstico de la mañana no es
     el mismo. MEDIDO en el metadato de Open-Meteo ese día: los modelos
     tardan MÁS DE CUATRO HORAS en publicar cada pase.

         AROME HD · pase de las 11:00 → disponible a las 15:14 · cada 3 h
         ECMWF    · pase de las 08:00 → disponible a las 15:11 · cada 6 h

         el parte de las 06:30 .. usa el pase de AROME de las 02:00
         éste, a las 13:00 ...... usa el de las 08:00  (6 h más fresco)

     Se le ofrecieron las 15:30 —que usaría el pase de las 11:00, el
     primero que ha «visto» la mañana y el mejor para algo de la tarde— y
     eligió las 13:00. Su razón, y es buena: a las 13:00 le queda toda la
     tarde para mover gente, y eso vale más que dos horas de certeza.

     SOLO SALE SI HAY ALGO. El de las 06:30 es el parte del día y sale
     siempre; éste es una confirmación, y una confirmación de que no pasa
     nada no hace falta. Es su regla de toda la vida: «si no hay nada, que
     no lo ponga» — la misma con la que tumbó el ámbar de los 49 km/h.

     Y DICE QUÉ HA CAMBIADO desde la mañana, que es para lo que sirve:
     para eso se guarda `parteResumen` con las tres cuentas. */
  const HORA_PARTE2 = 13;
  const tocaParte2 = h0 >= HORA_PARTE2 && h0 < 16 && antes?.parte2De !== claveHoy;
  if (tocaParte2) {
    const conRayo = buenos.filter(d => quedaHoy(d.dias[claveHoy]));
    const conAgua = buenos.filter(d => quedaHoy(d.agua?.[claveHoy]));
    const conRacha = buenos.filter(d => quedaHoy(d.racha?.[claveHoy]));
    const hay = conRayo.length + conAgua.length + conRacha.length;
    if (hay) {
      /* Se compara POR SITIO y solo con el parte de HOY (27-09-2026): por
         recuentos, «rayo en A y B» → «rayo en C y D» salía «igual que esta
         mañana»; y sin parte de hoy guardado se afirmaba lo mismo sin
         haber comparado nada. */
      const antesR = (antes?.parteResumen && antes.parteResumen.fecha === claveHoy) ? antes.parteResumen : null;
      const dif = [];
      if (antesR) {
        const nombres = x => Array.isArray(x) ? x : [];
        const cmp = (ahora, before, que) => {
          const A = new Set(ahora), B = new Set(before);
          const entran = ahora.filter(n => !B.has(n)), salen = before.filter(n => !A.has(n));
          if (!entran.length && !salen.length) return;
          if (!before.length) dif.push(`${que} que esta mañana no había (${entran.join(', ')})`);
          else if (!ahora.length) dif.push(`${que} se ha quitado`);
          else dif.push(`${que}: ${entran.length ? `entra ${entran.join(', ')}` : ''}${entran.length && salen.length ? '; ' : ''}${salen.length ? `sale ${salen.join(', ')}` : ''} (${before.length} → ${ahora.length})`);
        };
        cmp(conRayo.map(d => d.n),  nombres(antesR.rayo),  'rayo');
        cmp(conAgua.map(d => d.n),  nombres(antesR.agua),  'agua');
        cmp(conRacha.map(d => d.n), nombres(antesR.racha), 'racha');
      }
      const trozos2 = [];
      if (conRayo.length) trozos2.push(`⚡ rayo en ${sitiosTxt(conRayo.length)}: `
        + conRayo.slice(0, 3).map(d => `${d.n} ${cuandoTxt(d, claveHoy, claveManana, deManana, h0)}`).join(' · ')
        + (conRayo.length > 3 ? ` y ${conRayo.length - 3} más` : ''));
      if (conAgua.length) {
        const peor = conAgua.reduce((a2, b2) => b2.agua[claveHoy].mm > a2.agua[claveHoy].mm ? b2 : a2);
        trozos2.push(`🌧 agua en ${sitiosTxt(conAgua.length)}: lo más fuerte ${peor.n} `
          + `${coma(peor.agua[claveHoy].mm)} mm/h ${picoTxt(peor.agua[claveHoy].hPico, peor.agua[claveHoy].ini)}`);
      }
      if (conRacha.length) {
        const peor = conRacha.reduce((a2, b2) => b2.racha[claveHoy].kmh > a2.racha[claveHoy].kmh ? b2 : a2);
        trozos2.push(`💨 racha de ${RACHA_TOPE}+ en ${sitiosTxt(conRacha.length)}: lo peor ${peor.n} `
          + `${peor.racha[claveHoy].kmh} km/h ${picoTxt(peor.racha[claveHoy].hPico, peor.racha[claveHoy].ini)}`);
      }
      avisos.push({
        titulo: dif.length ? `Segundo parte · ha cambiado` : `Segundo parte · sigue en pie`,
        url: './?v=torres',
        cuerpo: trozos2.join('. ')
          + (dif.length ? `. Respecto a la mañana: ${dif.join(', ')}.`
                        : antesR ? `. Igual que esta mañana (datos de las ${h0}h).`
                                 : `. Sin parte de esta mañana con el que comparar (datos de las ${h0}h).`),
        tag: 'parte2', importante: false,
      });
      resumenHoy = { fecha: claveHoy, rayo: conRayo.map(d => d.n), agua: conAgua.map(d => d.n), racha: conRacha.map(d => d.n) };
      mandado2 = true;
    } else {
      /* Nada hoy: no se manda nada, pero el día se da por hecho para no
         volver a mirarlo a las 14:00 y a las 15:00. */
      mandado2 = true;
    }
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
      ultimoAviso: !proximas.length ? null
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
      /* ── LO QUE SE ESTÁ ARMANDO, PARA LA PASADA SIGUIENTE ──────────
         El peor de los veinte en las horas que quedan, en crudo y sin
         listón. La pasada siguiente lo lee para decidir cada cuánto
         pasar: con esto el día deja de estar «verde» ANTES de que nada
         salte. Sin guardarlo, `seArma` sería siempre falso y la galerna
         nos pillaría mirando cada tres horas (21-09-2026). */
      ojo: buenos.reduce((m, d) => ({
        cape:  Math.max(m.cape,  d.ojo?.cape  || 0),
        racha: Math.max(m.racha, d.ojo?.racha || 0),
        agua:  Math.max(m.agua,  d.ojo?.agua  || 0),
      }), { cape: 0, racha: 0, agua: 0 }),
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
      /* El segundo parte se da por hecho también cuando NO había nada que
         mandar: si no, a las 14:00 y a las 15:00 se volvería a mirar. Pero
         si HABÍA algo y el envío falló, no se marca y se reintenta, igual
         que el de la mañana (la lección del 01-09). */
      parte2De: (mandado2 && !soloMirar
                 && (!avisos.some(a2 => a2.tag === 'parte2')
                     || enviados.some(e => e.tag === 'parte2' && (e.enviados || 0) > 0)))
        ? claveHoy : (antes?.parte2De ?? null),
      parteResumen: resumenHoy,
      parteIntentoEn: (tocaParte || tocaParte2) ? new Date().toISOString() : (antes?.parteIntentoEn ?? null),
      marcadorHora: horaMarcadorAhora,
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
  /* Solo cuando cambia la hora (27-09-2026): corría en TODA pasada completa
     —euskalmet 1,3-2 s de CPU siempre MISS, ocho /om, un POST— y el
     servidor descarta las muestras repetidas de la misma estación y hora:
     en rojo, una de cada dos llamadas no apuntaba nada. */
  let marcador = null;
  if (antes?.marcadorHora === horaMarcadorAhora) marcador = { saltado: 'misma hora que la última vez' };
  else {
    try { marcador = await apuntarEnElMarcador(sitios); }
    catch (e) { marcador = { error: String(e?.message || e).slice(0, 80) }; }
  }

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
    inminentes: inminentes.map(d => `${d.n} ${cuandoTxt(d, claveHoy, claveManana, deManana, h0)}`),
    cambios: cambios.map(c => `${c.n} (${c.cual}): ${c.txt}`),
    avisados: enviados.map(e => ({ titulo: e.titulo, cuerpo: e.cuerpo, tag: e.tag, enviados: e.enviados, nota: e.nota })),
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
