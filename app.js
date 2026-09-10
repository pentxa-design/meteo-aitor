/* ═══════════════════════════════════════════════════════════════════
   Aitor Meteo · meteorología para trabajo en altura
   ───────────────────────────────────────────────────────────────────
   REGLA DE ORO DE ESTE FICHERO: no se inventa ningún dato.
   · Todo valor mostrado procede de una API real (Open-Meteo / RainViewer).
   · Si un valor no viene en la respuesta se muestra "sin dato". Nunca 0.
   · Los valores derivados (viento a altura no publicada, ráfaga a altura)
     se marcan SIEMPRE con la etiqueta «est.» y se explica el método.
   · Los umbrales GO/NO-GO son configurables y no son norma legal.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

/* Fecha de compilación — la sustituye deploy.sh en cada publicación. */
const BUILD = '2026.09.10-1120';

/* ---------- 1. Constantes y estado ---------- */

/* Las llamadas a Open-Meteo pasan por el intermediario del propio
   sitio (/om). Motivo: la API gratuita limita por dirección IP, y
   llamándola directamente desde el navegador todos los que comparten
   conexión comparten el cupo. Al pasar por el servidor, la respuesta
   se cachea en el CDN y una misma consulta no se pide dos veces.
   Si el sitio se abre sin servidor (fichero local), se cae a las URL
   directas para poder seguir probando. */
/* ── EN GITHUB PAGES, EL SERVIDOR ES VERCEL ────────────────────────────
   pentxa-design.github.io solo sirve ficheros. Todo lo que en el Mac
   reenviaba `.tools/servir.js` a Vercel (/om, /api/*, /rayos, /estaciones,
   /mareas, /radar, /satelite, /webcams, /omtiles) va aquí directo a
   Vercel. En cualquier otro sitio, BACKEND es el propio origen y no cambia
   nada. Ojo: /api/* aún no manda cabeceras CORS, así que desde Pages esas
   llamadas fallan hasta que el servidor las añada. */
const BACKEND = /\.github\.io$/.test(location.hostname)
  ? 'https://weather-app-ochre-one-76.vercel.app' : location.origin;
const RUTAS_BACKEND = /^\/(om|api|rayos|estaciones|mareas|radar|radar-aemet|satelite|webcams|omtiles)([\/?]|$)/;
if (BACKEND !== location.origin) {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (u, o) => fetchOriginal(
    (typeof u === 'string' && RUTAS_BACKEND.test(u)) ? BACKEND + u : u, o);
}

const PROXY = (location.protocol === 'http:' || location.protocol === 'https:')
  && !/^(localhost|127\.|192\.168\.)/.test(location.hostname) ? '/om' : null;

const directo = {
  fc   : 'https://api.open-meteo.com/v1/forecast',
  geo  : 'https://geocoding-api.open-meteo.com/v1/search',
  elev : 'https://api.open-meteo.com/v1/elevation',
  mar  : 'https://marine-api.open-meteo.com/v1/marine',
  /* via('marine') buscaba `directo.marine` y no existía: en local (sin
     proxy) el mar salía «Invalid URL» (Calpe, 09-09-2026 21:25). */
  marine: 'https://marine-api.open-meteo.com/v1/marine',
  aq   : 'https://air-quality-api.open-meteo.com/v1/air-quality',
  /* El catálogo del radar iba directo desde el navegador, saltándose el
     intermediario (revisión del 04-09-2026): era el único dato que no
     pasaba por la misma cadena que ve él. Desde el 05-09 va por
     `/om?api=rain`, y esta URL queda solo de reserva para abrir el
     fichero en local, como las demás. */
  rain : 'https://api.rainviewer.com/public/weather-maps.json',
};
const via = k => PROXY ? `${BACKEND}${PROXY}?api=${k}` : directo[k];

const API = {
  get fc()  { return via('fc'); },
  get geo() { return via('geo'); },
  get elev(){ return via('elev'); },
  get mar() { return via('marine'); },
  get aq()  { return via('aq'); },
  get rain(){ return via('rain'); },
  rev  : 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  // Catálogo de pasadas de satélite de EUMETSAT (lo lee el servidor).
  // Absoluta, como las demás: jget hace new URL() y una ruta relativa
  // revienta con "Invalid URL".
  get sat() { return `${BACKEND}/satelite`; },
};

/* Niveles de viento que el modelo publica realmente. Todo lo demás se estima. */
const MODEL_LEVELS = [10, 80, 120, 180];
/* Lo alto de una torre suya: «las torres miden 50 metros» (Calpe, 08-09-2026). */
const TORRE_ALTO_M = 50;
const HEIGHTS = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 180];

/* ---------- Qué trabajo vas a hacer ─────────────────────────────────
   SEGUNDA VERSIÓN, del 24-08-2026 por la tarde. La primera estaba mal
   planteada y lo corrigió él:

     «El 70 % de las veces voy a caseta y poste de 2 metros. Casetas en el
      monte, casetas en metros, casetas en restaurantes, casetas en
      teatros, casetas en azoteas, casetas en campos de fútbol, casetas en
      garajes subterráneos. Y otros equipos están a la intemperie a pie de
      suelo. Antenas en campanarios, escuelas, tejados, fachadas.»

   O sea: **«caseta» no es un sitio, es lo que hay dentro.** Yo había
   hecho un perfil «azotea o urbana» como si fuera otro tipo de
   emplazamiento, y no lo es: una azotea con caseta es una caseta.

   Lo que de verdad cambia el riesgo son dos cosas:
     1. ¿estás a cubierto o al aire?
     2. ¿tienes un pararrayos encima? — una torre de 40 m sí; un garaje
        subterráneo no.

   Lo segundo NO lo sabe la app: el catálogo de Argos da coordenadas,
   operador y municipio, pero no si el emplazamiento tiene torre. Está
   pendiente de decidir con él si se marca por emplazamiento.

   Y su regla sobre la torre, textual: «cuando vaya a torre de 40 metros
   que solo sea torre». El perfil de altura es SOLO para cuando sube.

   ─── TERCERA VERSIÓN, con sus fotos delante (24-08-2026, noche) ───

   Mandó dieciséis fotos de emplazamientos reales. Lo que enseñan:

     · Barazar (N-240): armario de intemperie en un helechal, bajo torre.
     · Monte Banderas (Deusto): torreta cargada de antenas... EN BILBAO.
     · Peruri (Getxo): azotea, mástil, armario abierto con baterías.
     · Gernika: azotea sobre viviendas, mástil de 3 m, y se sube por una
       TRAMPILLA con escalera de tijera.
     · Durango: portal → pasillo → escalera vertical de pates → rejilla.
     · Zamudio y Barakaldo (BEC): armarios DENTRO de un edificio.
     · BU-550 (Burgos): poste con transformador, CGP y líneas aéreas.
     · Berango: la CGP y el contador colgados en la fachada, en la calle.

   Conclusión que sale de mirarlas juntas: **no separa monte de ciudad, y
   tampoco caseta de intemperie.** Sus palabras: «caseta en monte, casetas
   en metros, en restaurantes, en teatros, en azoteas, en campos de fútbol,
   en garajes subterráneos». Lo que separa el riesgo es una sola cosa:

       ¿TIENES HIERRO ALTO ENCIMA O NO?

   Con torre o mástil eres el pararrayos, estés en el monte o en Deusto.
   Sin nada encima —dentro de un edificio— el tiempo no pinta nada.

   EL CALOR DE DENTRO DE LA CASETA NO ES COSA DE LA APP (25-08-2026).

   Hubo un aviso que cruzaba la temperatura de la calle con la alarma del
   panel de la caseta. Él lo mandó quitar entero: «lo del panel olvídate,
   solo el tiempo real en la calle». Su razón, y cierra el tema:

       «Ya puede haber en la calle 40 grados que dentro de la caseta
        habrá 25 si está el aire funcionando.»

   Todas las casetas llevan aire, enfría todo el día y casi nunca falla.
   La temperatura de dentro la fija el aire, no el tiempo. **La app da el
   tiempo de la calle y nada más.** No volver a meter esto.

   Y lo más peligroso que hace, que la app todavía no cubre: cuando se va
   la tensión, **las baterías aguantan 4 horas**. Si la compañía no repone,
   hay que subir un grupo electrógeno en remolque por la pista del monte,
   de noche y con el temporal recién pasado.                            */
const PERFILES = {
  hierro: {
    et: 'Con torre o mástil',
    sub: 'monte, azotea, campanario',
    ayuda: 'Tienes hierro alto encima: la torre de 40 m del monte, el mástil de '
         + '3 m de la azotea, la torreta del campanario. Da igual que sea monte '
         + 'o ciudad —Monte Banderas está en Bilbao—: si hay estructura '
         + 'metálica arriba, eres el pararrayos. AQUÍ MANDA EL RAYO. Y ojo al '
         + 'acceso: trampillas, escaleras de pates y rejillas mojadas.',
    vientoManda: false, rafagaBestia: 70,
    lluviaManda: false,
    alturaImporta: false,
    // El sirimiri moja el poste, la escalera, la trampilla y el armario
    sirimiriImporta: true,
  },
  dentro: {
    et: 'Dentro de un edificio',
    sub: 'sala técnica, garaje, empresa',
    ayuda: 'Los armarios están dentro del edificio, sin nada encima que atraiga '
         + 'el rayo y con el coche a pie de portal. Aquí el tiempo no manda: '
         + 'vas y arreglas. Lo único, que la acometida y el contador suelen '
         + 'estar fuera, en la fachada.',
    vientoManda: false, rafagaBestia: 90,
    lluviaManda: false,
    alturaImporta: false,
    // Bajo techo el sirimiri no pinta nada. Solo la acometida de fachada,
    // y eso ya lo dice el aviso de lluvia cuando llueve de verdad.
    sirimiriImporta: false,
  },
  torre: {
    et: 'Subir',
    sub: 'solo cuando subes',
    ayuda: 'Trabajo en altura de verdad, y SOLO para cuando subes: cambiar una '
         + 'antena, que es cosa de una vez al año. Aquí mandan la ráfaga a tu '
         + 'altura de trabajo y tus umbrales.',
    vientoManda: true, rafagaBestia: null,
    lluviaManda: true,
    alturaImporta: true,
    // Subiendo es donde más importa: los pates y el cable de vida mojados
    // resbalan igual con sirimiri que con un chaparrón
    sirimiriImporta: true,
  },
};
const perfil = () => PERFILES[S.perfil] ?? PERFILES.hierro;

/* Umbrales por defecto — práctica común en trabajo en altura, NO normativa. */
const DEFAULT_THR = {
  windWarn: 40,   // km/h viento medio a la altura de trabajo
  windNo  : 50,
  gustWarn: 45,   // km/h ráfaga
  gustNo  : 60,
  capeWarn: 300,  // J/kg
  capeNo  : 1000,
  rainWarn: 0.2,  // mm/h
  rainNo  : 2.0,
  visWarn : 1000, // m
  feelsWarn: 0,   // °C sensación térmica
};

/* ── EL LISTÓN DE RÁFAGA QUE MANDA DE VERDAD (09-09-2026) ─────────────
   Aitor, con «Tu listón: 45 km/h / 60 km/h» delante: *«eso no es así»*.
   Y no lo era: en caseta y poste (perfil hierro, el 90 % de su trabajo)
   el veredicto mira rafagaBestia (70, y avisa desde 49), pero las
   tarjetas, los chips de «otro modelo da…» y las barras de la
   comparativa seguían pintando gustWarn/gustNo (45/60), que son los de
   SUBIR. Dos listones a la vista, y el suyo era el que no salía. Desde
   hoy todo lo que enseña o colorea un listón de ráfaga pregunta aquí.
   En el perfil de subir (vientoManda) siguen mandando sus umbrales. */
function listonRafaga() {
  const P = perfil();
  if (P.vientoManda || !has(P.rafagaBestia))
    return { warn: S.thr?.gustWarn ?? DEFAULT_THR.gustWarn, no: S.thr?.gustNo ?? DEFAULT_THR.gustNo, de: 'subir' };
  return { warn: Math.round(P.rafagaBestia * 0.7), no: P.rafagaBestia, de: S.perfil || 'hierro' };
}

/* Modelos numéricos. `om` = id en Open-Meteo (datos), `windy` = id en Windy (mapas).
   Ningún modelo publica todas las variables: lo que falte se muestra «sin dato». */
const MODELS = [
  /* ── EL AUTOMÁTICO SALE DEL SELECTOR (02-09-2026) ─────────────────
     Suyo, después de que el Automático pasara a repartirlo todo a
     modelos con nombre:  *«y pregunta, si tengo en AROME etc, ¿para qué
     sirve el Automático?»*

     Para nada, y es la respuesta honesta: elegirlo es elegir AROME HD
     dando un rodeo —le pide el viento, la racha, la lluvia y el CAPE a
     AROME, el cielo al europeo y la tapa a ICON, que es exactamente lo
     que hace AROME HD—. Un botón que no cambia nada solo sirve para
     hacerle dudar de cuál tiene puesto, y hoy le costó media tarde.

     No se BORRA, se esconde: `oculto` lo saca de la pantalla pero el id
     se sigue entendiendo, y a quien lo tuviera guardado se le pasa a
     AROME al arrancar (hacen lo mismo, así que no le cambia un número).
     El `best_match` del vigilante y del parte del servidor NO se toca:
     allí no es «su modelo», es una de tres opiniones que se comparan
     para cazar tormenta.                                              */
  { id:'best_match', oculto: true,   om:'best_match',                 windy:'ecmwf', name:'Automático', res:'variable',
    desc:'Open-Meteo elige el mejor modelo disponible para el punto' },
  { id:'ecmwf',                      om:'ecmwf_ifs025',               windy:'ecmwf', name:'ECMWF', res:'25 km',
    desc:'Centro Europeo · IFS 0,25°. OJO: en costa y montaña una celda de 25 km '
       + 'mezcla mar y monte. MEDIDO en Bermeo: 0,5 km/h aquí frente a 19,3 en el mapa de 9 km' },
  { id:'gfs',                        om:'gfs_seamless',               windy:'gfs',   name:'GFS', res:'13-25 km',
    desc:'NOAA · global' },
  { id:'icon',                       om:'icon_seamless',              windy:'icon',  name:'ICON', res:'7-13 km',
    desc:'DWD alemán · global + Europa anidado' },
  { id:'arome',                      om:'meteofrance_arome_france_hd', windy:'arome', name:'AROME HD', res:'1,3 km',
    desc:'Météo-France · el más fino que cubre Euskadi. El recomendado para costa y monte' },
];

const S = {
  place : null,
  hgt   : 40,
  wunit : 'kmh',
  /* AROME HD, y en UN SOLO SITIO. Hasta el 31-08-2026 aquí ponía
     `best_match` y trece mil líneas más abajo `LS.get('model','arome')`:
     dos por defecto distintos para lo mismo. No daba la cara porque la
     carga pisaba a este casi siempre —pero «casi» no vale cuando de esto
     cuelga qué modelo decide si sube gente, y cualquier pintado que
     ocurra antes de esa línea usaba el Automático que él descartó.

     Por qué AROME y no otro, medido y no opinado: 5,5 km/h de error de
     racha contra 7,6 del europeo (178 muestras), y lee su caseta a
     **0,4 km** cuando el europeo lee a 18,3 monte adentro. Lo que no
     publica —la tapa, el cielo, más allá de 2 días— se lo pide solo al
     dueño de cada cosa; eso ya es automático y tiene su candado.       */
  model : 'arome',
  thr   : { ...DEFAULT_THR },
  perfil: 'hierro',   // ¿hay estructura metálica encima? manda sobre la decisión
  saved : [],
  data  : null,
  sel   : 0,       // hora seleccionada en la timeline
  /* ABRE EN «AHORA», no en Torre. Suyo, 29-08-2026: *«pues que abra en
     Ahora»* · *«así de una veo todo»*. Antes abría en Torre y él se iba
     a Mis torres, o sea que la pantalla de arranque no era ninguna de
     las dos que usa. Ahora arranca en la de un vistazo, y de ahí salta
     donde quiera. */
  view  : 'now',
  estaciones : null,   // catálogo de emplazamientos (data/estaciones.json), cargado a demanda
  rayos : null,        // descargas medidas por AEMET alrededor del punto abierto
  discrepa : null,     // qué modelos ven tormenta y cuáles no
};

const model = () => MODELS.find(m => m.id === S.model) ?? MODELS[0];

/* El modelo del que salieron los números que hay EN PANTALLA. Para las
   etiquetas y los textos se usa este, nunca el seleccionado: si los dos
   se separan (caída al automático, copia guardada de otro modelo), lo
   que no puede pasar es que la app ponga «AROME HD» encima de números de
   ECMWF. Medido el 24-08-2026: la ficha decía «AROME HD solo publica
   viento a 10 m» —falso de AROME, cierto de ECMWF— con los datos de
   ECMWF cargados. */
const modeloDato = () =>
  MODELS.find(m => m.id === (S.data?.fc?._modelo ?? S.model)) ?? model();

/* Qué modelos SÍ publican viento por encima de 10 m, quitando el que ya
   estás mirando. El texto decía «usa AROME, ICON o GFS» siempre, y
   estando en AROME te mandaba a AROME. Medido el 24-08-2026 en Bermeo,
   horas con valor sobre 24: ECMWF 25 km no da 80, 120 ni 180 m; AROME HD
   da 80 pero no 120 ni 180; GFS da 80 y 120 pero no 180; ICON y el
   automático los dan los cuatro. */
/* ── QUIÉN PUBLICA SUS PROPIAS CAPAS DE NUBE Y QUIÉN NO ───────────────
   Cazado el 28-08-2026 a las 21:40, tirando de un apunte suyo —*«en
   AguaceroWx solo funciona nubosidad con ICON y GFS; el europeo no
   deja»*— y del lema con que mandó comprobarlo esa misma noche: *«no
   dejes para luego lo que puedas hacer hoy»*.

   COMPROBADO EN LA DOCUMENTACIÓN DE CADA MODELO, no deducido:

     ICON (DWD) ......... total y capas, TODO SUYO
     GFS (NOAA) ......... total y capas, TODO SUYO
     ARPEGE (MF) ........ total y capas, TODO SUYO
     ECMWF .............. el TOTAL es suyo; **las capas NO las publica**:
                          las calcula Open-Meteo con la humedad, por
                          Sundqvist (1989). Sus datos abiertos solo
                          llevan `tcc`, sin `lcc`/`mcc`/`hcc`.
     AROME HD ........... **no publica el total**. MEDIDO: 0 horas de 168,
                          a 7 días, en Bermeo, Vitoria y Madrid.
     HARMONIE, GEM ...... sin comprobar. No se afirma nada de ellos.

   POR QUÉ IMPORTA Y NO ES UN DETALLE: esa noche la app le dijo *«fíate
   de las capas, no del total»* teniendo ECMWF puesto — y con ECMWF eso
   es al revés, porque **el total es el dato del modelo y las capas son
   una cuenta nuestra**. Su norma de siempre: lo medido y lo calculado no
   se mezclan, y menos aún se recomienda lo calculado por encima de lo
   que el modelo publica.

   `null` es «no comprobado» y NO significa «calculadas». */
const CAPAS_PROPIAS = {
  icon_seamless: true,
  gfs_seamless: true,
  meteofrance_arpege_europe: true,
  ecmwf_ifs025: false,
  meteofrance_arome_france_hd: false,
};
const capasPropias = (om) => (om in CAPAS_PROPIAS ? CAPAS_PROPIAS[om] : null);

const CON_NIVELES = ['icon', 'gfs', 'arome', 'best_match'];
function otrosConNiveles() {
  const yo = modeloDato().id;
  const otros = CON_NIVELES.filter(id => id !== yo)
    .map(id => MODELS.find(m => m.id === id)?.name).filter(Boolean);
  if (!otros.length) return 'otro modelo';
  return otros.length === 1 ? otros[0]
    : otros.slice(0, -1).join(', ') + ' o ' + otros[otros.length - 1];
}

/* ── Unidades de viento ─────────────────────────────────────────────
   TODO se calcula y se guarda internamente en km/h (incluidos tus
   umbrales). La unidad elegida solo cambia CÓMO se muestra y cómo se
   escribe en el formulario de umbrales, nunca el valor guardado: así
   cambiar de unidad no puede alterarte por accidente un límite de
   seguridad.
     1 km/h = 0,5399568 kt = 0,2777778 m/s                          */
const WU = {
  kmh: { lbl:'km/h', f:1,         d:0 },
  kts: { lbl:'kt',   f:0.5399568, d:0 },
  ms:  { lbl:'m/s',  f:0.2777778, d:1 },
};
const wu   = () => WU[S.wunit] ?? WU.kmh;
/** Convierte de km/h (interno) a la unidad elegida. */
const wv   = kmh => has(kmh) ? kmh * wu().f : null;
/* El día, dicho solo cuando NO es hoy. Si abre la app sin cobertura y el
   service worker le sirve la copia guardada, las cifras pueden ser de
   ayer — y «de 07:00 a 08:00» a secas se lee como esta mañana. Pedido
   por él el 26-08-2026: «quiero saber qué estoy leyendo y de qué hora,
   día». Cuando es hoy no se dice nada: repetir «hoy» en cada renglón es
   ruido. */
function diaSiNoEsHoy(d) {
  const h = new Date();
  const n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate())
                      - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
  if (n === 0) return '';
  /* Con el nombre del día detrás, como en `nombreDeDia`. «hasta las
     21:00 de mañana» se leía igual de bien como «de esta mañana».
     Suyo, 04-09-2026: «lío, ¿no?». */
  if (n === 1) return ` de mañana ${d.toLocaleDateString('es', { weekday: 'long' })}`;
  if (n === -1) return ' de AYER';
  return ' del ' + d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* Milímetros como se escriben en castellano: 0,4 y no 0.4. Unificado el
   26-08-2026 al montar el parte del día: el parte decía «0,4 mm» y la
   ficha de Torre «0.4 mm/h» en la misma pantalla, y en la franja del día
   ya salía «Menos de 0,1» con coma. La app se contradecía consigo misma
   en la cifra que más mira. */
const mmTxt = v => (has(v) ? v.toFixed(1).replace('.', ',') : '—');
/* Kilómetros con coma, como todos sus números. Cazado el 30-08-2026 en su
   pantallazo: «lee a 19.1 km» con punto, en diez sitios distintos. */
const kmTxt = v => (has(v) ? v.toFixed(1).replace('.', ',') : '—');
/* Metros con coma. Puesto el 04-09-2026: la tarjeta del oleaje ponía
   «Ahora 0.6 m · lo más alto 1.6 m» con PUNTO, y justo encima, en la
   misma pantalla, «ALTURA DE OLA 0,6 m» con coma. Dos maneras de
   escribir el mismo número a diez centímetros una de otra. */
const mTxt = v => (has(v) ? Number(v).toFixed(1).replace('.', ',') : '—');

/** Número ya formateado en la unidad elegida. */
/* Con coma, como mmTxt/kmTxt/mTxt: en m/s (d=1) esto escribía «15.0 m/s»
   con punto en toda la app. Revisión del 04-09-2026. */
const wtxt = (kmh, conUnidad = false) => {
  const v = wv(kmh);
  return has(v) ? `${v.toFixed(wu().d).replace('.', ',')}${conUnidad ? ' ' + wu().lbl : ''}` : null;
};
/* ── LA DIFERENCIA, TAL COMO SE VE ───────────────────────────────────
   Suyo, 04-09-2026: en su pantalla salía «Automático da 28° y ECMWF da
   35° — 6° de diferencia». Lo restó de cabeza y le dieron 7.

   No era un error de cuenta: los tres números se redondeaban por su
   cuenta. 28,4 → 28. 34,6 → 35. Y la diferencia de verdad, 6,2 → 6.
   Cada uno bien; los tres juntos, imposibles.

   Al barrer la app buscando lo mismo aparecieron CUATRO sitios más, en
   la tarjeta de «¿coinciden los modelos?» y en la del parte. Con
   ráfagas de 4,4 y 10,8 se veían «4» y «11» y el texto decía «6 km/h de
   diferencia».

   Esto lo resuelve de una vez: la diferencia se saca de las cifras YA
   REDONDEADAS, las que él está leyendo. Las decisiones (si avisar, si
   discrepan) siguen tomándose con el dato sin redondear — eso es medir;
   lo que cambia es lo que se escribe. */
const wRed = v => { const x = wv(v); return has(x) ? Number(x.toFixed(wu().d)) : null; };
const difVista = (a, b, conUnidad = false) => {
  const A = wRed(a), B = wRed(b);
  if (!has(A) || !has(B)) return null;
  const d = Math.abs(A - B);
  return `${d.toFixed(wu().d)}${conUnidad ? ' ' + wu().lbl : ''}`;
};

/** De la unidad elegida a km/h, para leer lo que escribe el usuario. */
const wkmh = v => has(v) ? v / wu().f : null;

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const LS = {
  get(k, d) { try { const v = localStorage.getItem('torre.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('torre.' + k, JSON.stringify(v)); } catch {} },
};

/* ¿HASTA DÓNDE LLEGA LA NUBE DE TORMENTA?

   Dos usos, los dos solo cuando hay dato:

   1. EL TOPE dice si se va a electrificar. Referencia medida, no
      inventada: 10.640 m sobre Mungia el 24-08-2026, la tarde que Aitor
      oyó truenos en Bermeo; y 9.740 m en Lekeitio la noche que le
      reventó los postes. Por debajo de 7 km no da para mucho — pero eso
      **no baja el aviso**, solo se dice.

   2. LA BASE dice si la torre se mete DENTRO de la nube. Si la base cae
      por debajo de la cota del emplazamiento, el que sube está metido en
      ella. Con la torre haciendo de pararrayos, eso no es un matiz.

   El valor -500 que devuelve el modelo NO es una altura: es su forma de
   decir «aquí no hay nube convectiva». Tratarlo como número sería pintar
   una nube bajo tierra. */
const NUBE_ALTA = 9000;
const NUBE_BAJA = 7000;

function loQueMideLaNube(h, place) {
  /* Se aceptan LOS DOS nombres: el corto que produce `buildHours` (que
     es lo que la app pasa de verdad) y el crudo de la API, porque hay
     pruebas y llamadas sueltas que arman la hora a mano. Así ninguna de
     las dos formas vuelve a quedarse sin leer. */
  const crudoTop  = h.nubeTop  ?? h.convective_cloud_top;
  const crudoBase = h.nubeBase ?? h.convective_cloud_base;
  const tope = has(crudoTop)  && crudoTop  > 0 ? crudoTop  : null;
  const base = has(crudoBase) && crudoBase > 0 ? crudoBase : null;
  /* LA COTA BUENA es la que ya usa `acceso()`: la que él ha puesto para
     ese emplazamiento. La `elevation` que devuelve el modelo es la de SU
     rejilla, que en el Oiz se queda 400 m por debajo de la real. */
  const cota = (typeof cfgDe === 'function' ? cfgDe(place)?.cota : null) ?? null;
  const partes = [];

  if (tope !== null) {
    const km = (tope / 1000).toFixed(1).replace('.', ',');
    if (tope >= NUBE_ALTA)
      partes.push(`la nube llega a ${km} km, tan alta como la noche que reventó los postes de Lekeitio`);
    else if (tope < NUBE_BAJA)
      /* AQUÍ HABÍA UNA FRASE TRANQUILIZADORA Y ERA FALSA. Duró tres
         horas, el 27-08-2026. Decía «aunque la nube se queda en X km y a
         esa altura se electrifica poco».

         La tumbó una descarga medida ESE MISMO DÍA: cayó junto a Zarautz
         (43,266 / −2,173) y en ese punto ICON daba **tope de 5.900 m**,
         con CAPE 780 y la tapa en 26. Mi texto habría escrito allí «se
         electrifica poco» a la hora exacta en que cayó.

         El umbral de 9.000 m me lo había sacado de comparar dos sitios
         un día. No vale. Así que el tope se DICE y no se interpreta: con
         5,9 km cayó un rayo, y eso es lo que hay que recordar. */
      partes.push(`la nube llega a ${km} km — y eso NO quiere decir que no haya rayo: `
                + `el 27-08-2026 cayó una descarga junto a Zarautz con el tope en 5,9 km`);
    else
      partes.push(`la nube llega a ${km} km`);
  }
  if (base !== null && cota !== null && base <= cota)
    partes.push(`y OJO: la nube empieza a ${Math.round(base)} m, por debajo de los `
              + `${Math.round(cota)} m de este sitio — quien suba estaría DENTRO de ella`);

  return partes.length ? ' — ' + partes.join(', ') : '';
}

/* ---------- 2. Utilidades ---------- */

const nd    = '<span class="faint">sin dato</span>';
const has   = v => v !== null && v !== undefined && !Number.isNaN(v);
const num   = (v, d = 0) => has(v) ? Number(v).toFixed(d) : null;
const esc   = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Muestra un valor o "sin dato". Nunca sustituye ausencia por cero. */
function show(v, unit = '', d = 0) {
  /* La coma va aquí, en el embudo: el 30-08-2026 sus pantallazos traían
     «1.2 m», «31.1 km», «6.2» y «5.1 µg/m³» — el punto inglés en cada
     tarjeta. Arreglarlo tarjeta a tarjeta era dejarse alguna. */
  return has(v) ? `${Number(v).toFixed(d).replace('.', ',')}${unit ? `<small> ${unit}</small>` : ''}` : nd;
}

/** La lluvia SIEMPRE con decimal, y las trazas dichas como trazas.
 *
 *  Se enseñaba sin decimales, así que 0,3 mm salía como «0 mm» y se leía
 *  «no llueve». Con estructura mojada eso no es un detalle: 0,3 mm no es
 *  nada de agua, pero sí es hierro resbaladizo. Lo vio Aitor el
 *  23-08-2026 comparando el icono con el número.                       */
function showLluvia(v) {
  if (!has(v)) return nd;
  const n = Number(v);
  if (n === 0)    return '0<small> mm</small>';
  if (n < 0.05)   return 'trazas<small> (&lt;0,1 mm)</small>';
  return `${n.toFixed(1).replace('.', ',')}<small> mm</small>`;
}

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('is-on'), ms);
}

/** El rumbo con todas las letras.

    Puesto el 28-08-2026 porque él leyó «del OSO» y preguntó:
    *«esto del oso, oso, ¿qué oso grizzly?»*. Y no es cosa suya: en
    castellano hay tres rumbos de los dieciséis que chocan con palabras
    corrientes —**OSO** (oeste-suroeste), **ESE** (este-sureste) y **ENE**
    (este-noreste)—. En la línea principal van enteros; la abreviatura se
    queda para donde no quepa. */
const RUMBO_LARGO = {
  N:'norte', NNE:'nor-noreste', NE:'noreste', ENE:'este-noreste',
  E:'este', ESE:'este-sureste', SE:'sureste', SSE:'sur-sureste',
  S:'sur', SSO:'sur-suroeste', SO:'suroeste', OSO:'oeste-suroeste',
  O:'oeste', ONO:'oeste-noroeste', NO:'noroeste', NNO:'nor-noroeste',
};
const rumboLargo = deg => { const r = dir16(deg); return r ? RUMBO_LARGO[r] || r : null; };

/** Rosa de los vientos de 16 rumbos. */
function dir16(deg) {
  if (!has(deg)) return null;
  const r = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return r[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

/** Códigos WMO → texto. Fuente: tabla WMO 4677 usada por Open-Meteo. */
const WMO = {
  0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nuboso', 3:'Cubierto',
  4:'Sol velado',
  45:'Niebla', 48:'Niebla engelante',
  51:'Llovizna débil', 53:'Llovizna moderada', 55:'Llovizna intensa',
  56:'Llovizna engelante débil', 57:'Llovizna engelante intensa',
  61:'Lluvia débil', 63:'Lluvia moderada', 65:'Lluvia fuerte',
  66:'Lluvia engelante débil', 67:'Lluvia engelante fuerte',
  71:'Nieve débil', 73:'Nieve moderada', 75:'Nieve intensa', 77:'Granos de nieve',
  80:'Chubascos débiles', 81:'Chubascos moderados', 82:'Chubascos torrenciales',
  85:'Chubascos de nieve débiles', 86:'Chubascos de nieve fuertes',
  95:'Tormenta', 96:'Tormenta con granizo', 99:'Tormenta fuerte con granizo',
};
const wmoText = c => WMO[c] ?? (has(c) ? `Código ${c}` : null);
const isStormCode = c => c === 95 || c === 96 || c === 99;

/* ── EL SOL VELADO NO ES «CUBIERTO» ──────────────────────────────────
   Puesto el 05-09-2026 desde Calpe, con él en la calle a pleno sol y la
   app diciendo **«Cubierto»** con nube gris a las 13:00. Medido a esa
   hora en los tres modelos: nube BAJA 0 %, MEDIA 0 %, ALTA 100 %, y
   784 W/m² de radiación — sol de agosto con un velo de cirros a diez
   kilómetros. Open-Meteo saca el código 0-3 de la nubosidad TOTAL, así
   que un cielo de cirros finos sale «cubierto» igual que un techo de
   estratos, y son cielos que no se parecen en nada: bajo el velo se
   trabaja al sol.

   Suyo, ese día: *«en uno nublado, en otro sol y nublado… eso creo que
   está mal»*. Y llevaba razón en las dos cosas: el rótulo mentía y cada
   pestaña lo calculaba a su manera.

   La regla, y es UNA para todas las pantallas porque entra por
   `codigoQueSeVe()`, que es por donde pasa todo código antes de
   dibujarse: si el modelo dice nuboso o cubierto (2 o 3) pero entre
   bajas y medias no llegan al 40 % y las altas pasan del 50 %, eso es
   **sol velado** — código propio 4, que Open-Meteo no usa nunca. Solo
   se REBAJA lo que el modelo tapa de más; nunca se tapa lo que el
   modelo deja al sol. Para torre da igual: los cirros no traen racha ni
   rayo.                                                                */
const VELADO = 4;
/* ── Y LAS CAPAS DEL EUROPEO NO SUMAN ────────────────────────────────
   Cazado el 06-09-2026 a las 14:00, otra vez en Calpe con cirros
   encima: el europeo daba TOTAL 92 % con bajas 0, medias 0 y ALTAS 46.
   Las capas no cuadran con el total —ya está apuntado en la caja de
   nubosidad— y la primera versión de esta regla pedía altas >= 50 para
   llamarlo velo, así que con 46 se quedaba en «Cubierto» mirando un
   cielo de sol velado. La regla buena es más simple: si el modelo dice
   CUBIERTO y ni bajas ni medias llegan al 40 %, nada tapa de verdad y lo
   que hay es velo, marque lo que marque la capa alta. Para el «parcial»
   (2) sí se pide que el velo domine, porque un 30 % de nube baja es
   «parcialmente nuboso» y no un velo.                                  */
function veladoSiToca(code, h) {
  if (code !== 2 && code !== 3) return code;
  const b = h?.nubesBajas, m = h?.nubesMedias, a = h?.nubesAltas;
  if (!has(b) || !has(m) || !has(a)) return code;
  if (b + m >= 40) return code;              // algo bajo o medio tapa: manda el modelo
  if (code === 3) return VELADO;             // «cubierto» sin nada bajo ni medio = velo
  return a >= 50 ? VELADO : code;            // «parcial»: solo si el velo domina
}
/* ═══ EL CIELO LO VOTA LA MAYORÍA ════════════════════════════════════
   Suyo, 06-09-2026 desde Calpe, después de una semana de parches al
   icono: *«a diario andamos con el tema este de los iconos, hemos
   corregido muchas veces y sigue fallando»*. Y es verdad: 28-08 el 100 %
   con cielo azul, 30-08 el sol de Bermeo, 31-08 la franja partida, 04-09
   el sábado de sol, 05-09 los cirros, 06-09 el escalón de la nube media.
   Todos los parches arreglaban UN caso, porque la raíz era otra: **el
   dibujo salía de un solo modelo**, y la nubosidad es el campo que peor
   predice cualquiera de ellos —lo dice la Guía—. Cuando ese modelo se
   equivoca una hora, el dibujo se equivoca con él.

   Desde hoy, para las horas en que la comparativa está cargada (48 h del
   sitio abierto), el cielo seco lo decide LA MEDIANA de nube baja+media
   entre los modelos de verdad —ECMWF, AROME, ICON, GFS; el Automático no
   vota porque es una mezcla de los otros—. Un modelo descolgado deja de
   mandar. Con menos de tres votos, o fuera de las 48 h, o en otro sitio
   que no sea el abierto, se sigue con el dueño del cielo y la regla del
   velo, como antes.

   Los escalones, con sus palabras:
     baja+media ≥ 70 %  → Cubierto
     baja+media ≥ 40 %  → Parcialmente nuboso  (el «bastante tapado pero
                          pasa el sol» de esta tarde en Calpe)
     alta ≥ 50 %        → Sol velado
     baja+media ≥ 15 %  → Mayormente despejado
     resto              → Despejado
   El agua y la tormenta NO se votan: eso sigue mandándolo el dueño de la
   lluvia, que se elige por acierto medido. Ni la niebla.                */
function cieloVotado(t, place = null) {
  const C = deEsteSitio(S.comparativa, place)?.hourly;
  if (!C?.time || !t) return null;
  C.__porHora ??= new Map(C.time.map((x, i) => [String(x).slice(0, 13), i]));
  const i = C.__porHora.get(String(t).slice(0, 13));
  if (i === undefined) return null;
  const bm = [], alta = [];
  for (const m of COMPARAR) {
    if (m.om === 'best_match') continue;               // mezcla: no vota
    const b = C[`cloud_cover_low_${m.om}`]?.[i], md = C[`cloud_cover_mid_${m.om}`]?.[i];
    if (!has(b) || !has(md)) continue;
    bm.push(Math.min(100, b + md));
    const a = C[`cloud_cover_high_${m.om}`]?.[i];
    if (has(a)) alta.push(a);
  }
  if (bm.length < 3) return null;
  const med = xs => { const o = [...xs].sort((p, q) => p - q), k = o.length;
    return k % 2 ? o[(k - 1) / 2] : (o[k / 2 - 1] + o[k / 2]) / 2; };
  const o = [...bm].sort((p, q) => p - q);
  return { bm: med(bm), alta: alta.length ? med(alta) : null, n: bm.length, abanico: o[o.length - 1] - o[0] };
}
function codigoVotado(v) {
  if (v.bm >= 70) return 3;
  if (v.bm >= 40) return 2;
  if (has(v.alta) && v.alta >= 50) return VELADO;
  if (v.bm >= 15) return 1;
  return 0;
}

/* Cuánto tapa cada código, para los empates: el velado va entre el
   «mayormente despejado» y el «parcialmente nuboso», no por encima de
   «cubierto» como haría el número 4 a secas. */
const tapado = c => (c === VELADO ? 1.5 : c);

/* ---------- 3. Iconos SVG (sin dependencias, sin emoji) ---------- */

/* ── CUANDO NO SE SABE, NO SE DIBUJA ─────────────────────────────────
   Puesto el 04-09-2026. Antes, si un día no traía horas con dato, se
   pintaba el `weather_code` diario del modelo — que es **el peor
   momento de las 24 horas**, no el día. Resultado medido ese día: un
   sábado de sol dibujado con nubarrón, y él en casa mientras los demás
   estaban en la playa.

   Un interrogante se lee como «no lo sé» y se puede mirar en Horas. Un
   nubarrón falso se lee como un pronóstico. */
const SIN_DIBUJO = `<svg viewBox="0 0 24 24" width="26" height="26" aria-label="sin dato">
  <circle cx="12" cy="12" r="9" fill="none" stroke="#5c6a86" stroke-width="1.6"/>
  <text x="12" y="16.4" text-anchor="middle" font-size="11" font-weight="700"
        fill="#8fa0bf" font-family="system-ui,sans-serif">?</text></svg>`;

function icon(code, day = 1) {
  const sun   = `<circle cx="12" cy="12" r="4.6" fill="#ffc663" stroke="none"/>
    <g stroke="#ffc663" stroke-width="1.9" stroke-linecap="round">
      <path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/></g>`;
  const moon  = `<path d="M20 14.5A8.6 8.6 0 0 1 9.5 4a8.6 8.6 0 1 0 10.5 10.5Z" fill="#cfd9f5" stroke="none"/>`;
  const cloud = (x = 0, y = 0, f = '#c3cfe8') =>
    `<path transform="translate(${x} ${y})" d="M7.4 18.6h9.9a3.7 3.7 0 0 0 .5-7.4 5.6 5.6 0 0 0-10.8-1.2 3.8 3.8 0 0 0 .4 8.6Z" fill="${f}" stroke="none"/>`;
  /* Las gotas dicen CUÁNTA agua, no solo que caiga.
   *
   *  Antes la llovizna y el chaparrón dibujaban exactamente las mismas
   *  tres gotas y solo cambiaba un poco el azul: a tamaño de icono no se
   *  distinguen, y se leía "va a caer una buena" donde ponía "llovizna".
   *  Lo vio Aitor el 23-08-2026 mirando Bilbao.
   *
   *  Ahora: dos gotitas cortas para llovizna, tres medianas para lluvia,
   *  y cuatro largas y gruesas para la fuerte. Se distingue de un vistazo
   *  y sin leer el texto.                                              */
  const drops = (f, cuanta = 'media') => {
    const P = {
      fina:   { xs: [10.5, 14.5],           largo: 1.4, grosor: 1.5, y: 21.0 },
      media:  { xs: [9, 13, 17],            largo: 2.4, grosor: 2.0, y: 20.4 },
      fuerte: { xs: [7.5, 11, 14.5, 18],    largo: 3.3, grosor: 2.4, y: 19.9 },
    }[cuanta];
    const d = P.xs.map(x => `M${x} ${P.y}l-${(P.largo * 0.42).toFixed(2)} ${P.largo}`).join('');
    return `<g stroke="${f}" stroke-width="${P.grosor}" stroke-linecap="round"><path d="${d}"/></g>`;
  };
  /* COPOS QUE SE VEAN. Los puntos estaban en x=9/13/17 e y=21,6 — justo
     DENTRO de sus propias rayas (de y=20 a 23,2 en las mismas x), así que
     no se veían: la nieve eran tres rayas y punto. Ahora son asteriscos de
     tres trazos, que a 24 px sí se leen como copo. (01-09-2026.) */
  const snow  = `<g stroke="#dbe7ff" stroke-width="1.6" stroke-linecap="round">
    <path d="M9 20.2v3.2M7.6 21v1.6M10.4 21v1.6
             M13 20.2v3.2M11.6 21v1.6M14.4 21v1.6
             M17 20.2v3.2M15.6 21v1.6M18.4 21v1.6"/></g>`;

  /* ── LA MARCA DE HIELO ───────────────────────────────────────────────
     Suyo, 31-08-2026 al repasar los símbolos: lo ENGELANTE (48 niebla
     helada, 56/57 llovizna helada, 66/67 lluvia helada) se dibujaba
     EXACTAMENTE igual que su versión sin hielo. Y el hielo no es «lluvia
     con frío»: es la escalera, los pates y el cable de vida con una capa
     invisible encima. Para quien manda gente a subir, es un peligro
     propio y el dibujo tiene que decirlo sin leer el texto.
     Un copo azul pálido arriba a la derecha, fuera de las gotas. */
  const hielo = `<g stroke="#bcd4ff" stroke-width="1.5" stroke-linecap="round">
    <path d="M19.4 5.6v4.4M17.5 6.7l3.8 2.2M21.3 6.7l-3.8 2.2"/></g>`;

  /* GRANIZO: la tormenta con granizo (96, 99) era idéntica a la simple
     (95). El granizo rompe material y hace daño a quien está fuera; se
     dibujan dos bolas blancas bajo la nube, junto al rayo. */
  const granizo = `<g fill="#eef4ff" stroke="none">
    <circle cx="8.2" cy="21.4" r="1.5"/><circle cx="16.4" cy="22.2" r="1.3"/></g>`;
  const bolt  = `<path d="M13.4 12.6h3.4l-5.6 8.4 1-5.6h-3.2l4.8-7.4Z" fill="#ffd166" stroke="none"/>`;

  let g;
  if (code === 0 || code === 1)                    g = day ? sun : moon;
  else if (code === 2)                             g = (day ? `<g transform="translate(-2.4 -2.4) scale(.8)">${sun}</g>` : `<g transform="translate(-1.6 -1.6) scale(.8)">${moon}</g>`) + cloud(2.4, 2.4);
  else if (code === 3)                             g = cloud(0, 1.2, '#9fb0cf');
  /* Sol velado: el sol entero —se ve, y calienta— con dos velos finos
     por delante. Ni la nube pequeña del «parcialmente» ni el nubarrón. */
  else if (code === VELADO)                        g = (day ? sun : moon)
    + `<g stroke="#dfe6f4" stroke-opacity=".75" stroke-width="1.7" stroke-linecap="round">
         <path d="M3.2 9.6c3.2-1.4 6.2-1.4 9.4 0s6.2 1.4 8.6 0M5.2 15.2c3.2 1.4 6.2 1.4 9.4 0s5-1.4 6.8 0"/></g>`;
  else if (code === 45 || code === 48)             g = cloud(0, -1.6, '#a9b6cd') + `<g stroke="#a9b6cd" stroke-width="1.9" stroke-linecap="round"><path d="M4.6 19.4h14.8M6.6 22.2h10.8"/></g>` + (code === 48 ? hielo : '');
  // Llovizna (51-57): dos gotitas. Mojar el suelo, poco más.
  else if (code >= 51 && code <= 57)               g = cloud(0, -1.6) + drops('#7fb6ff', 'fina') + (code >= 56 ? hielo : '');
  // Lluvia fuerte y helada: cuatro gotas largas
  else if (code === 65 || code === 67)             g = cloud(0, -1.6, '#8d9cb8') + drops('#4a95ff', 'fuerte') + (code === 67 ? hielo : '');
  else if (code >= 61 && code <= 67)               g = cloud(0, -1.6, '#9fb0cf') + drops('#5aa2ff') + (code === 66 ? hielo : '');
  else if (code >= 71 && code <= 77)               g = cloud(0, -1.6, '#b9c6df') + snow;
  // Chubascos: el violento (82) también con cuatro
  else if (code === 82)                            g = cloud(0, -1.6, '#8d9cb8') + drops('#4a95ff', 'fuerte');
  else if (code >= 80 && code <= 82)               g = cloud(0, -1.6, '#9fb0cf') + drops('#5aa2ff');
  else if (code === 85 || code === 86)             g = cloud(0, -1.6, '#b9c6df') + snow;
  else if (isStormCode(code))                      g = cloud(0, -2.4, '#8d9cb8') + bolt + (code === 96 || code === 99 ? granizo : '');
  else                                             g = cloud(0, 0, '#9fb0cf');

  return `<svg viewBox="0 0 24 26" aria-hidden="true" data-code="${has(code) ? code : ''}" data-dia="${day ? 1 : 0}">${g}</svg>`;
}

/* ---------- 4. Perfil vertical de viento ─────────────────────────────
   El modelo publica viento a 10, 80, 120 y 180 m. Para alturas
   intermedias se interpola con una ley potencial ajustada A LOS DOS
   NIVELES REALES que rodean la altura pedida:
        v(z) = v1 · (z/z1)^α        α = ln(v2/v1) / ln(z2/z1)
   Es una estimación derivada de datos reales, y se etiqueta como tal.
   -------------------------------------------------------------------- */

function windAt(h, levels) {
  // levels = {10: v, 80: v, 120: v, 180: v}  (algunos pueden faltar)
  const avail = MODEL_LEVELS.filter(l => has(levels[l]));
  if (!avail.length) return { v: null, exact: false };
  if (has(levels[h])) return { v: levels[h], exact: true };

  if (h <= avail[0])  return { v: levels[avail[0]], exact: false, note: 'bajo-suelo', techo: avail[0] };
  if (h >= avail[avail.length - 1]) {
    // Si el modelo SOLO publica 10 m (le pasa a ECMWF 0,25°) no hay nada
    // con lo que extrapolar y se devolvía el valor de 10 m con una nota
    // que despistaba: parecía un cálculo cuando no lo era.
    const techo = avail[avail.length - 1];
    const solo10 = avail.length === 1 && techo === 10;
    return { v: levels[techo], exact: false, techo,
             note: solo10
               ? 'solo-10'          // el modelo no publica ningún nivel por encima
               : 'sobre-techo' };   // la altura pedida pasa del nivel más alto
  }

  let lo = avail[0], hi = avail[avail.length - 1];
  for (let i = 0; i < avail.length - 1; i++) {
    if (h >= avail[i] && h <= avail[i + 1]) { lo = avail[i]; hi = avail[i + 1]; break; }
  }
  const v1 = levels[lo], v2 = levels[hi];
  if (v1 <= 0 || v2 <= 0) {            // ley potencial no definida → lineal
    return { v: v1 + (v2 - v1) * (h - lo) / (hi - lo), exact: false, alpha: null };
  }
  const alpha = Math.log(v2 / v1) / Math.log(hi / lo);
  return { v: v1 * Math.pow(h / lo, alpha), exact: false, alpha };
}

/** Ráfaga a altura: el modelo SOLO publica ráfaga a 10 m.
 *  Se escala con el mismo cociente que el viento medio. Es una
 *  aproximación de ingeniería, conservadora (el factor de racha
 *  disminuye con la altura), y se muestra siempre etiquetada. */
/** Racha estimada a la altura de trabajo.
 *
 *  MEDIDO el 23-08-2026 sobre 288 horas de 6 emplazamientos reales: esta
 *  función producía rachas IMPOSIBLES. El caso peor, Vitoria el lunes a
 *  las 05:00: racha de 20 km/h a 10 m convertida en 100 km/h a 40 m.
 *  Multiplicar por CINCO.
 *
 *  ¿Por qué? La racha se escalaba por la proporción entre el viento medio
 *  a la altura y el de 10 m, sin ningún límite. De madrugada la capa de
 *  aire pegada al suelo se desacopla: en superficie queda 1 km/h mientras
 *  arriba sigue habiendo viento. Dividir por ese casi-cero dispara la
 *  cuenta. Pasaba en el 15,3 % de las horas, y 11 de ellas salían NO APTO
 *  SOLO por ese disparate.
 *
 *  Eso no es ser conservador, es estar roto: una racha de 100 km/h con un
 *  viento medio de 7 no existe. Y una app que da rojos falsos deja de
 *  creerse, que es justo lo que no puede pasar el día que avise de verdad.
 *
 *  EL TOPE NO ES INVENTADO: (altura/10)^0,4. A 40 m da 1,74, que es
 *  EXACTAMENTE el percentil 90 medido en Euskadi para el viento medio de
 *  10 a 40 m (378 horas con niveles nativos de AROME). O sea, se permite
 *  amplificar hasta el peor día de cada diez, y de ahí no se pasa.
 *
 *  Y un suelo: la racha NUNCA puede quedar por debajo del viento medio a
 *  esa altura.                                                          */
function gustAt(h, gust10, w10, wh) {
  if (!has(gust10)) return { v: null, exact: false };
  if (h === 10) return { v: gust10, exact: true };
  if (!has(w10) || !has(wh) || w10 <= 0) return { v: gust10, exact: false, note: 'sin escalar' };

  const tope = Math.pow(h / 10, 0.4);
  const r = wh / w10;
  const limitada = r > tope;
  const v = Math.max(gust10 * Math.min(r, tope), wh);
  return { v, exact: false, limitada,
           note: limitada ? 'amplificación limitada al percentil 90 medido' : undefined };
}

/* ---------- 5. Evaluación GO / NO-GO ---------- */

const RANK = { go: 0, warn: 1, no: 2, nd: 3 };
const worst = (a, b) => (RANK[b] > RANK[a] ? b : a);

/** Evalúa una hora. Devuelve estado global + motivos con su fuente. */
/* ── ¿Llueve bien, poco o sirimiri? ───────────────────────────────────
   Pedido por Aitor el 25-08-2026 con estas palabras: «me gusta saber si
   va a llover bien, poco o sirimiri». No es una manía de vocabulario: de
   los tres depende a dónde puede mandar gente.

     · sirimiri → a la caseta y al poste SÍ; al mástil no, y a la torre
       menos. Sus palabras exactas.
     · poco / bien → lo de siempre, con sus umbrales.

   Los cortes son los suyos, los que ya tenía puestos para la lluvia
   (0,2 y 2,0 mm/h por defecto, y los puede cambiar en Ajustes). Así no
   hay dos escalas distintas conviviendo.                              */
const esLlovizna = c => has(c) && c >= 51 && c <= 57;

/* ── EL CÓDIGO QUE SE VE: CIELO DE UNO, AGUA DEL OTRO ─────────────────
   Suyo, 30-08-2026 a las 19:40, con los dos aparatos delante: *«¿en la
   web una cosa y en el móvil otra?»*. En su Mac (Automático) el rótulo
   grande decía **«Cubierto»**; en su móvil (ECMWF), **«Llovizna débil»**.
   Mismo sitio, misma hora.

   Que cada aparato lleve su modelo es normal. Lo que NO lo era: el Mac
   ya estaba usando la lluvia de ECMWF —ponía «0,4 mm en la franja»,
   igual que el móvil— y aun así el titular decía «Cubierto». **El
   rótulo ignoraba el agua que la propia app había decidido creer.**

   MEDIDO en ese momento: ICON (dueño del cielo) daba código 3, cubierto
   y 0 mm; ECMWF (dueño de la lluvia) daba 51, llovizna y 0,2 mm.

   La regla: **el cielo es del dueño del cielo; la parte de AGUA del
   código es del dueño de la lluvia.** Si el que manda en el agua ve
   precipitación, eso es lo que se pinta — porque es su competencia. Si
   solo hablan de nubes, manda el del cielo. */
/* ── Y EL CASO QUE FALTABA: EL SUYO ──────────────────────────────────
   Suyo, 04-09-2026: *«los iconos de las apps, sol, nubes, que cuadren
   con el pronóstico»*, *«los iconos de lluvia etc que cuadren»*.

   Lo de arriba arregla el caso en que la lluvia viene PRESTADA de otro
   modelo: entonces el código viaja con ella. Pero **AROME HD, que es el
   que él usa, da la lluvia y NO da el código** — medido el 04-09: 0 de
   72 horas con `weather_code`, y 57 de 72 con lluvia.

   Así que sus milímetros son de AROME y el dibujo se pide prestado a
   ECMWF, que es de 25 km contra 1,3. Cuando AROME ve agua en un valle
   y ECMWF no —que es justo para lo que sirve tener AROME—, quedaba
   **una nube sin gotas con 0,5 mm cayendo debajo**.

   Medido el mismo día en Lille, 17:00: AROME 0,5 mm · ECMWF llovizna ·
   **ICON «cubierto»**. Con ECMWF de prestador cuadró; con ICON no
   habría cuadrado. Y no se pudo medir en más sitios porque ese día no
   llovía en toda Francia: 2 horas de agua en 513 miradas. **Con dos
   casos no se afirma nada, así que en vez de dar por bueno el préstamo
   se le pone un tope: el icono NO PUEDE decir seco si el número que él
   está leyendo dice que moja.**

   No se inventa nada: el icono se ajusta al dato de lluvia DEL PROPIO
   modelo cargado, y con SUS listones. Y solo hacia arriba — si el
   código prestado ya habla de agua, se respeta tal cual, que de lluvia
   sabe más el que la publica. */
/* ── GOTAS PRESTADAS CON 0,0 MM DEBAJO ─────────────────────────────
   Calpe, 08-09-2026, mirando el miércoles en Horas: gotas de 19 a 23 y
   «0,0 mm» debajo de cada una. AROME HD (el suyo) decía seco; el dibujo,
   prestado al europeo, decía llovizna. La regla de arriba respetaba el
   código prestado «porque de lluvia sabe más el que la publica», y salía
   una hora con gotas y cero. Suyo: *«necesito precisión»*.

   Desde hoy, cuando el código es de OTRO modelo y los milímetros son del
   cargado, manda el número que él lee: 0,0 mm es nube sin gotas, y lo que
   ve el otro modelo se dice en una etiqueta («⚠ ECMWF ve llovizna»),
   como ya se hace con «GFS sí (0,2 mm)» en las franjas. Si el código y
   los milímetros son del mismo modelo (ECMWF cargado, llovizna con 0,0 por
   redondeo) no se toca: eso es sirimiri y moja igual. Devuelve el código
   de agua prestado, o null si no es el caso. */
function aguaPrestada(h) {
  if (!h?.codigoAjeno) return null;
  const mm = h.prec;
  if (!has(mm) || mm > 0) return null;
  const c = has(h.codeLluvia) ? h.codeLluvia : h.code;
  return has(c) && c >= HAY_AGUA ? c : null;
}

function codigoQueSeVe(h, codigoDelCielo, thr = S.thr) {
  if (aguaPrestada(h) !== null) {
    codigoDelCielo = 3;            // seco según su número: nube, sin gotas
  } else {
    const cl = h?.codeLluvia;
    if (has(cl) && cl >= HAY_AGUA) return cl;

    /* ¿El que se va a pintar habla ya de agua? Entonces no se toca. */
    if (has(codigoDelCielo) && codigoDelCielo >= HAY_AGUA) return codigoDelCielo;
  }

  /* ¿Y el modelo cargado dice que moja? Si es que sí, manda el número. */
  const mm = h?.prec;
  if (has(mm) && mm > 0) {
    if (mm >= (thr?.rainNo ?? 2))    return 63;   // llueve bien
    if (mm >= (thr?.rainWarn ?? 0.2)) return 61;  // llueve poco
    return 51;                                    // sirimiri: moja igual
  }
  /* La niebla tampoco se vota: es un dato de visibilidad, no de nubes. */
  if (codigoDelCielo === 45 || codigoDelCielo === 48) return codigoDelCielo;
  /* Cielo seco: primero la mayoría, y si no hay quórum, el dueño con la
     regla del velo. Ver `cieloVotado()`. */
  const voto = h?.t ? cieloVotado(h.t, h.sitio) : null;
  if (voto) return codigoVotado(voto);
  return veladoSiToca(codigoDelCielo, h);
}

function comoLlueve(h, thr = S.thr) {
  if (!has(h.prec)) return { k: 'nd', et: 'sin dato' };
  if (h.prec >= thr.rainNo)   return { k: 'bien', et: 'Llueve bien' };
  if (h.prec >= thr.rainWarn) return { k: 'poco', et: 'Llueve poco' };
  // Por debajo del umbral: o es sirimiri, o no cae nada. Lo que lo
  // distingue es el código del modelo, no los milímetros — ver la
  // sección del sirimiri en CLAUDE.md.
  if (esLlovizna(h.codeLluvia ?? h.code))
                              return { k: 'sirimiri', et: 'Sirimiri' };
  if (h.prec > 0)             return { k: 'poco', et: 'Cuatro gotas' };
  return { k: 'no', et: 'Sin lluvia' };
}

/* ── ¿ESE CIELO LO VE ALGUIEN MÁS? ──────────────────────────────────
   Puesto el 28-08-2026 con su foto delante: cielo azul en Bermeo, y el
   Automático marcando **100 %** de nubes a las 08:00, con 0 % antes y
   0 % después. Seis de los siete modelos daban entre 0 y 6.

   No se corrige el número —no somos nadie para reescribir lo que dice un
   modelo— pero **tampoco se enseña solo**, porque un 100 % con el cielo
   azul es de las cosas que hacen dejar de creerse una app.

   Misma regla que ya se aplica al agua en `lluviaQueNoVesTu()`: se dice
   quién lo ve y quién no, y decide él. */
function cieloRaro(nubes) {
  const C = deEsteSitio(S.comparativa)?.hourly;   // la de ESTE sitio, no la del anterior
  if (!C?.time || !has(nubes)) return null;
  const ahora = Date.now();
  const i = C.time.findIndex(t => new Date(t).getTime() + 3600e3 > ahora);
  if (i < 0) return null;

  /* ── «LOS OTROS» SON LOS OTROS DEL DUEÑO, NO LOS DEL CARGADO ───────
     Cazado el 02-09-2026 con un dato suyo: *«buen tiempo en Bermeo todo
     el día con nubes blancas de algodón, pero deja de sobra pasar el
     sol»* · *«pocas nubes»*. Ese día el Automático daba CUATRO HORAS AL
     100 % y ECMWF clavaba lo que él vio (20 · 11 · 8 · 6).

     Y aquí estaba el fallo: el número que se compara (`nubes`) NO es del
     modelo cargado — el cielo va ENTERO a su dueño por acierto medido
     (ARPEGE desde el 30-08). Pero de «los otros» se excluía al CARGADO.
     O sea que el dueño se quedaba dentro de la lista y **se comparaba
     consigo mismo**, que es la trampa del ✓ que no puede salir mal, en su
     versión contraria: un aviso que no puede callarse. Estaba medido que
     saltaba el 72 % de las horas, y un aviso que sale siempre no avisa.

     Se excluye al DUEÑO del dato que se está enseñando. */
  const dueno = quienLoMide('cloud_cover') || modeloDato().om;
  const nomDueno = (COMPARAR.find(m => m.om === dueno) || {}).name
                 || modeloDato().name;
  const otros = COMPARAR
    .map(m => ({ n: m.name, om: m.om, v: C[`cloud_cover_${m.om}`]?.[i] }))
    .filter(x => has(x.v) && x.om !== dueno && x.n !== nomDueno);
  if (otros.length < 3) return null;

  const ord = [...otros].sort((a, b) => a.v - b.v);
  const mediana = ord[Math.floor(ord.length / 2)].v;

  /* 45 puntos es desacuerdo de verdad, no un matiz. Y tienen que estar
     de acuerdo ENTRE ELLOS: si los otros también andan repartidos, esto
     no es un modelo descolgado, es que nadie lo sabe — y para eso ya
     está escrito en la Guía que la nubosidad es el campo menos fiable. */
  /* ── LA REGLA PEDÍA DEMASIADO, Y SE CALLÓ EL CASO MÁS CLARO ────────
     Corregido el 28-08-2026 a las 20:30, con su foto delante.

     La app decía **«Despejado · Nubosidad 0 %»** en Bermeo y él mandó una
     foto desde la calle: **medio cielo cubierto**, altocúmulos con
     claros. Lo que daban los siete a esa misma hora:

         GFS 100 · ICON 56 · ECMWF 45 · ARPEGE 17 · HARMONIE 0 · GEM 0
         y el Automático, que es el que se enseñaba: **0**

     O sea que **tres modelos veían el cielo que él estaba viendo** y la
     app no dijo ni una palabra. El aviso existía y no saltó: pedía que
     se separasen **el 70 % de los otros** —cinco de seis— y se separaban
     tres. Un listón tan alto que solo salta cuando ya no hace falta.

     **Lo que se mira ahora es el ABANICO, no si uno va descolgado.** Si
     entre el que más y el que menos hay 50 puntos o más, el cielo no lo
     sabe nadie y eso se dice. Con los números de hoy: de 0 a 100.

     Y el 50 no es a ojo: la nubosidad va en octas de cielo, y medio
     cielo de diferencia es la diferencia entre sol y sombra. Por debajo
     de eso son matices de un campo que ya está escrito en la Guía que es
     el menos fiable de cualquier modelo.

     Se sigue diciendo la mediana, que es lo que él puede contrastar
     mirando por la ventana — como hizo. */
  const conMio = [...otros.map(x => x.v), nubes];
  const bajo = Math.min(...conMio), alto = Math.max(...conMio);
  const abanico = alto - bajo;

  /* ── EL LISTÓN, RECALIBRADO EL 02-09-2026 ─────────────────────────
     Suyo, viendo «Despejado ⚠ los otros ven 18 % de nubes» en su
     pantalla: *«es que esto ya pasa muchas veces»*.

     Y tenía razón, MEDIDO ese día sobre 240 horas (5 emplazamientos
     suyos, 48 h): con el listón viejo —abanico ≥50 o descolgarse ≥45 de
     la mediana— **saltaba el 65 % de las horas**. Dos de cada tres. Un
     aviso que sale siempre no avisa: es la misma regla que ya está
     escrita aquí para el ámbar permanente.

     El motivo de fondo lo dice el propio CLAUDE.md: la nubosidad es el
     campo MENOS fiable de cualquier modelo, y un listón en puntos de
     porcentaje salta constantemente sin que cambie nada.

     Lo que se mide ahora es lo que a él le importa, que es su queja
     literal desde el principio: *«me mosqueo cuando dice esta mañana sol
     y al mediodía nube»*. O sea, **que cambie la LECTURA**: él ve
     despejado y otros ven cubierto, o al revés. Y que lo digan DOS, no
     uno suelto.

     Calibrado sobre las mismas 240 horas:

       el de antes (abanico ≥50 o ≥45)          65,0 %  ← insufrible
       descolgarse ≥60 de la mediana             0,8 %  ← se pierde todo
       cambia la lectura, UNO lo dice           21,2 %
       cambia la lectura, DOS o más lo dicen     2,9 %  ← ÉSTE

     PERO «DOS O MÁS» SOLO NO VALE, y lo dijo la prueba: el caso REAL
     que él fotografió el 28-08 en Bermeo —la app decía Despejado y había
     medio cielo cubierto, 0 % contra 100— tiene UN solo modelo en
     contra, así que se perdía. Un listón que se carga el caso que lo
     justifica no vale, por muy bonito que quede el porcentaje.

     Así que son DOS puertas, y basta con una:

       · DOS o más cambian la lectura (él claro, ellos cubierto)   2,9 %
       · UNO solo, pero separado 90 puntos o más                   2,9 %
       ────────────────────────────────────────────────────────────────
       las dos juntas                                             5,4 %

     Comprobado sobre esas mismas 240 horas: caza el Bermeo del 28-08, se
     calla con los cinco de acuerdo, y se calla con el caso de hoy —3 %
     contra 18— que es el que le hizo decir que salía muchas veces. */
  const CLARO = 25, CUBIERTO = 75, ABISMO = 90;
  const lee = v => v < CLARO ? 'claro' : v > CUBIERTO ? 'cubierto' : 'medio';
  const miLectura = lee(nubes);
  const cambianLaLectura = miLectura === 'medio' ? []
    : otros.filter(x => lee(x.v) !== 'medio' && lee(x.v) !== miLectura);
  const abismales = otros.filter(x => Math.abs(x.v - nubes) >= ABISMO);

  /* ── LA DECISIÓN, EN UN SOLO SITIO ────────────────────────────────
     Estaba en dos —una guarda arriba y este reparto— y por eso al
     romper una a propósito el 02-09-2026 no pasaba nada: la otra seguía
     cortando. Una decisión duplicada no es más segura: es una que no se
     puede vigilar, porque ninguna prueba puede verla fallar.

     Ahora manda esta línea y solo esta: se avisa si DOS cambian la
     lectura o si UNO se separa un abismo. Si no hay nadie en contra,
     no hay nada que contar y se calla. */
  const enContra = cambianLaLectura.length >= 2 ? cambianLaLectura : abismales;
  if (!enContra.length) return null;
  const cuantos = enContra.length;
  return { cuantos, total: otros.length, mediana: Math.round(mediana),
           bajo: Math.round(bajo), alto: Math.round(alto), abanico: Math.round(abanico),
           /* Qué ven ELLOS, que es lo que hay que contarle: no un
              porcentaje suelto sino «tú despejado, ellos cubierto». */
           miLectura, suLectura: lee(enContra[0].v),
           porAbismo: cambianLaLectura.length < 2,
           quienes: enContra.map(x => x.n).slice(0, 3) };
}

/** LA RACHA TAMPOCO PUEDE IR SOLA. Hermana de `cieloRaro()`.
 *
 *  POR QUÉ EXISTE. Aitor, el 30-08-2026, después de que se arreglara lo
 *  mismo con la lluvia: *«y eso solo con lluvia, con viento, cape etc
 *  hara lo mismo??»*, *«si ha fallado en lluvia, te aseguro que en los
 *  otros tambien lo hara, revisalo 2 veces»* y *«y nubosidad claro pero
 *  todo eso en las tres capas de torre, mis torres y ahora»*.
 *
 *  Lo estaba. MEDIDO ese día en Bermeo a las 14:00, por las dos vías:
 *  ICON 39,2 y GFS 14,4 km/h de racha — **2,7 veces**— y la casilla
 *  enseñaba un solo número sin decir nada.
 *
 *  EL LISTÓN NO ES A OJO. Calibrado sobre **1.440 horas** (sus 20
 *  emplazamientos, 3 días, los 7 modelos contra el Automático):
 *
 *  | criterio | salta en |
 *  |---|---|
 *  | otro cruza sus 45 km/h y el cargado no | 1,7 % |
 *  | otro cruza sus 60 km/h y el cargado no | 0,1 % |
 *  | se separa ≥20 km/h | 1,4 % |
 *  | **los tres juntos** | **2,7 %** |
 *  | (descartado) se separa ≥10 km/h | 14,5 % |
 *  | (descartado) el más alto es ≥2 veces | 21,3 % |
 *
 *  El 2,7 % es el mismo nivel al que salta la combinación de tormenta de
 *  `assess()` (2,8-4,0 %) y la mitad que el aviso del cielo (8-9 %). Las
 *  dos reglas por proporción se descartaron por ruido puro: «×2» salta
 *  con 5 contra 11 km/h, que no le cambia nada a nadie.
 *
 *  **Se define por lo que le cambia la decisión, no por un porcentaje.**
 *  Un caso real de ese mismo día: BI SOLLUBEMENDI a las 14:00, Automático
 *  27 y **ICON 55** — su aviso está en 45. Con el Automático puesto no
 *  vería nada.
 *
 *  Va a 10 m, que es lo que dice la casilla, y por eso es CONSERVADOR: a
 *  su altura de trabajo esos mismos números cruzan el listón más veces.
 *  No se escala aquí porque escalar la racha de otro modelo con el viento
 *  del tuyo sería mezclar dos modelos en un número.                     */
function rachaQueNoVesTu(racha10) {
  const C = deEsteSitio(S.comparativa)?.hourly;   // la de ESTE sitio, no la del anterior
  if (!C?.time || !has(racha10)) return null;
  const ahora = Date.now();
  const i = C.time.findIndex(t => new Date(t).getTime() + 3600e3 > ahora);
  if (i < 0) return null;

  const cargado = modeloDato()?.name;
  const otros = COMPARAR
    .map(m => ({ n: m.name, v: C[`wind_gusts_10m_${m.om}`]?.[i] }))
    .filter(x => has(x.v) && x.n !== cargado);
  if (!otros.length) return null;

  const alto = otros.reduce((a, b) => b.v > a.v ? b : a);
  const { warn, no } = listonRafaga();   // el listón que manda en su perfil (09-09-2026)

  const cruzaNo   = racha10 <  no   && alto.v >= no;
  const cruzaWarn = racha10 <  warn && alto.v >= warn;
  const seSepara  = alto.v - racha10 >= 20;
  if (!cruzaNo && !cruzaWarn && !seSepara) return null;

  return { quien: alto.n, suya: alto.v, mia: racha10,
           dif: alto.v - racha10, cruzaWarn, cruzaNo,
           /* Qué listón cruza, para poder decirlo con sus palabras */
           limite: cruzaNo ? no : cruzaWarn ? warn : null };
}

/** El texto de la marca, en UN SOLO SITIO para las tres pantallas.
 *
 *  Igual que `avisoCielo()`: `corto` para pegarlo al número, largo para
 *  la ficha. Si cambia aquí, cambia en Ahora, en Torre y en Mis torres —
 *  que es justo lo que pidió: *«todo eso en las tres capas»*.
 *
 *  NO cambia el número, que es el de su modelo y lo ha elegido él. */
function avisoRacha(racha10, { corto = false } = {}) {
  const r = rachaQueNoVesTu(racha10);
  if (!r) return '';
  const n = v => wtxt(v, true);
  if (corto) return ` <span class="nd__ojo">⚠ ${esc(r.quien)} ${n(r.suya)}</span>`;
  return ` <span class="nd__ojo">⚠ ${esc(r.quien)} da ${n(r.suya)}`
       + (r.limite ? `, por encima de tu listón de ${n(r.limite)}` : '')
       + `</span>`;
}

/* ── LO QUE DICEN LOS MODELOS DONDE ESTÁ EL APARATO ──────────────────
   Pedido por él el 28-08-2026 a las 00:15. Es la pieza que faltaba para
   que pueda hacer lo que dice que hace: *«tú me pones los valores y yo
   valoraré qué hacer»*.

   Se pregunta a los SIETE modelos **en las coordenadas de la estación**,
   no en las del emplazamiento ni en las del pueblo. Esa distinción no es
   un detalle: el 27-08 se comparó el modelo de Bermeo contra el
   anemómetro de Matxitxako —que es un cabo a 4,7 km— y salió un «sesgo»
   que no existía. Mismo punto y misma hora, o no se compara nada.

   Y se dice si están de acuerdo, que es lo otro que pidió: *«si están
   varios modelos de acuerdo, eso da más fiabilidad para decidir»*.

   No decide nada. Pone el número al lado del medido y ya. */
const hhDe = t => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ── DOS COMPARACIONES DISTINTAS, DOS LÍNEAS ────────────────────────
   Suyo, 28-08-2026: *«hay un comentario que pone 29 km/h de diferencia:
   no coinciden, y luego cuadran con el aparato… coinciden, no coinciden,
   pero cuadran… lío»*.

   Y tenía razón, aunque por debajo no había nada mal. Son DOS
   comparaciones que no tienen nada que ver:

     · una compara **los modelos entre ellos** — si se parecen o no;
     · la otra compara **el más fuerte contra su estación** — si acierta.

   Iban pegadas con un «·» y sin decir contra qué comparaba cada una, así
   que leídas del tirón parecían contradecirse. Pueden ser verdad las dos
   a la vez: discrepar 29 entre ellos y aun así el más fuerte cuadrar con
   el aparato.

   Ahora cada línea dice contra qué compara. Y la segunda NOMBRA al más
   fuerte, que además es el que se queda la app en `peorRacha()` y hasta
   hoy no se decía en ninguna pantalla.

   Los listones (12 / 25 y ±15) se quedan como estaban: no hay nada
   medido que justifique moverlos.

   Está aparte y con nombre para poder probarla; la primera versión de la
   línea de CAPE repitió este mismo fallo el mismo día. */
function frasesContraste(filas, medido) {
  const mx = filas[0], mn = filas[filas.length - 1];
  const dif = mx.v - mn.v;
  const corto = medido - mx.v;     // + = el más fuerte se queda corto

  /* ── ¿DISPERSOS O PARTIDOS EN DOS? ──────────────────────────────────
     BILBAO AEROPUERTO, 28-08-2026 a las 05:00, medido con el aparato en
     28 km/h. Los siete, ordenados:

       AROME 35,6 · ECMWF 31,0 · ARPEGE 30,2 · HARMONIE 26,6 · GFS 19,8
       ——— hueco de 12,2 sin nadie ———
       GEM 7,6 · ICON 6,8

     «28,8 km/h de diferencia, no se ponen de acuerdo» es verdad y se
     queda corto: no es que discrepen con matices, es que **la mitad dice
     que no hay viento**. Y ICON, que es el modelo que sale por defecto,
     daba 6,8 con 28 en la calle: cuatro veces menos.

     Cuando la separación es limpia informa más quién está en cada bando
     que el número de la horquilla. Se dice cuando el salto más grande
     entre dos modelos seguidos pasa de 10 km/h **y** se lleva más de un
     tercio de toda la horquilla; por debajo de eso es dispersión normal
     y se dice como siempre.

     El listón no está afinado sobre este caso y punto: 10 km/h es la
     mitad de su margen de precaución, y un salto que se come un tercio
     de la horquilla ya no es un escalón, es un corte. */
  const bandos = (() => {
    if (filas.length < 4 || dif < 25) return null;
    let hueco = 0, corte = -1;
    for (let i = 0; i < filas.length - 1; i++) {
      const g = filas[i].v - filas[i + 1].v;
      if (g > hueco) { hueco = g; corte = i; }
    }
    if (hueco < 10 || hueco < dif / 3) return null;
    const arriba = filas.slice(0, corte + 1), abajo = filas.slice(corte + 1);
    if (!arriba.length || !abajo.length) return null;
    const tramo = g => {
      const lo = g[g.length - 1].v, hi = g[0].v;
      return Math.round(hi) === Math.round(lo) ? wtxt(hi, true)
           : `${wtxt(lo)}-${wtxt(hi, true)}`;
    };
    const nombres = g => g.map(f => esc(f.n)).join(', ').replace(/, ([^,]*)$/, ' y $1');
    return `<b>partidos en dos</b>: ${nombres(arriba)} dan ${tramo(arriba)};`
         + ` ${nombres(abajo)} dan ${tramo(abajo)}`;
  })();

  const acuerdo = bandos ? { c: 'mal', t: bandos }
                : dif < 12 ? { c: 'ok',  t: `los ${filas.length} de acuerdo, ${difVista(mx.v, mn.v, true)} de diferencia` }
                : dif < 25 ? { c: 'reg', t: `${difVista(mx.v, mn.v, true)} entre el más flojo y el más fuerte` }
                :            { c: 'mal', t: `${difVista(mx.v, mn.v, true)} de diferencia, no se ponen de acuerdo` };

  /* Lo mismo aquí: la separación entre lo medido y el más fuerte se
     saca de las dos cifras que se ven, no de los decimales de dentro. */
  const juicio = corto >= 15
    ? `el más fuerte (${esc(mx.n)}) <b>se queda ${difVista(medido, mx.v, true)} corto</b>`
    : corto <= -15
    ? `el más fuerte (${esc(mx.n)}) <b>se pasa ${difVista(medido, mx.v, true)}</b>`
    : `el más fuerte (${esc(mx.n)}) cuadra, ${difVista(medido, mx.v, true)} de diferencia`;

  return { acuerdo, juicio };
}

/* ── LO QUE MIDE EL APARATO, CONTRA LO QUE DAN LOS SIETE ─────────────
   Suyo, 28-08-2026, con la tabla del Oiz en la mano: *«estos datos
   tienen que estar también en la app, hay sitio de sobra: los que marcan
   nuestros modelos y al lado lo que marcan los de Euskalmet»*, *«más
   datos, mejor trabajamos, más seguros»*.

   Una fila por medida, y en cada una: **lo que marca el aparato**, **el
   abanico de los siete** y **cuál de los siete clava**. Nada más: ni
   nota, ni veredicto, ni recomendación. Él ya dijo cinco veces esa
   mañana que las cifras son nuestras y la decisión suya.

   LA LLUVIA VA LA PRIMERA de las tres nuevas, y es a propósito: en sus
   sitios lo que decide el día es si llueve, no cuánto sopla —«el 90 % de
   las ocasiones vas a las casetas o equipos intemperie que están a pie»—.
   Un 0,0 MEDIDO es información: dice que allí arriba no está cayendo,
   que hasta hoy había que deducirlo de un modelo.

   Y solo salen las medidas que el aparato DA. Si esa estación no tiene
   pluviómetro, no hay fila de lluvia — no se rellena con el modelo y se
   hace pasar por medida, que es el fallo que ya se cometió con la altura
   del suelo. */
function otrasMedidas(H, i, x) {
  /* La cifra y la unidad van SEPARADAS a propósito. Primera versión, y
     se vio nada más mirarla: «de 25 km/h a 42 km/h», «de 22,0 °C a
     23,6 °C». La unidad repetida en la misma frase ensucia justo la
     columna que él lee en diagonal. Ahora la unidad va una vez, al final:
     «de 25 a 42 km/h». */
  const CUALES = [
    /* LA RACHA VA LA PRIMERA, aunque abajo esté el detalle de los siete.
       Es el orden que él aprobó al ver la tabla del Oiz, y tiene sentido:
       las cuatro medidas se leen de un vistazo y en vertical, y luego, si
       quiere, baja al detalle del viento.

       EL MARGEN DE «CLAVAR» ES 5, NO 8. La primera versión usaba 8 y
       decía «5 de 7» clavando: con ocho kilómetros por hora de holgura
       casi todos entran, y una columna que se llama «el que clava» tiene
       que exigir clavar. Cinco es lo que él distingue en el sitio con su
       anemómetro. */
    { k: 'racha',       om: 'wind_gusts_10m',       eti: 'Racha',
      med: v => wtxt(v),                                uni: wu().lbl, cerca: 5 },
    { k: 'lluvia',      om: 'precipitation',        eti: 'Lluvia',
      med: v => mmTxt(v),                               uni: 'mm',     cerca: 0.2 },
    { k: 'temperatura', om: 'temperature_2m',       eti: 'Temperatura',
      med: v => v.toFixed(1).replace('.', ','),         uni: '°C',     cerca: 1.5 },
    { k: 'humedad',     om: 'relative_humidity_2m', eti: 'Humedad',
      med: v => String(Math.round(v)),                  uni: '%',      cerca: 8 },
  ];

  const filas = CUALES.map(c => {
    const medido = x[c.k];
    if (!has(medido)) return '';
    const vs = COMPARAR.map(m => ({ n: m.name, v: H[`${c.om}_${m.om}`]?.[i] }))
                       .filter(f => has(f.v));
    if (!vs.length) return '';

    const lo = Math.min(...vs.map(f => f.v)), hi = Math.max(...vs.map(f => f.v));
    const abanico = Math.abs(hi - lo) < 0.05
      ? `todos ${c.med(hi)} ${c.uni}`
      : `de ${c.med(lo)} a ${c.med(hi)} ${c.uni}`;

    /* «El que clava» son TODOS los que caen dentro del margen, no el
       primero que se encuentre. Con lluvia 0,0 suelen ser los siete, y
       decir «ECMWF» a secas ahí sería quedarse con uno por azar. */
    const clavan = vs.filter(f => Math.abs(f.v - medido) <= c.cerca);
    const quien = !clavan.length
      ? `<span class="obs__nadie">ninguno se acerca</span>`
      : clavan.length === vs.length ? `los ${vs.length}`
      : clavan.length > 2 ? `${clavan.length} de ${vs.length}`
      : clavan.map(f => `<b>${esc(f.n)}</b> ${c.med(f.v)}`).join(' · ');

    /* ── COLOR, Y SOLO DONDE SIGNIFICA ALGO ─────────────────────────
       Suyo, 28-08-2026: *«colores, etc., recuerda»*, *«para que quede
       más profesional»*. Y su regla del 26-08, que manda sobre eso: **el
       color significa algo o no se pone.**

       Se pintan dos cosas, no cuatro:

         · **Lo que marca el aparato**, pero solo cuando hay un listón
           suyo con el que compararlo. La racha tiene los suyos —45 y
           60— y la lluvia es sí o no: si el pluviómetro marca algo, va
           en azul, porque está cayendo. Temperatura y humedad no llevan
           color: no hay ningún número a partir del cual él haga algo
           distinto, y pintarlas sería decoración.

         · **Cuántos modelos aciertan**, que es lo que dice si fiarse
           hoy: verde si acierta la mitad o más, ámbar si son pocos,
           rojo si no acierta ninguno. Eso último no es un adorno: es la
           señal de que el pronóstico de ese sitio no está describiendo
           lo que hay. */
    const tonoMed = c.k === 'racha'
        ? (medido >= listonRafaga().no ? 'no'
         : medido >= listonRafaga().warn ? 'warn' : 'go')
      : c.k === 'lluvia' ? (medido >= 0.05 ? 'agua' : '')
      : '';
    const tonoQ = !clavan.length ? 'no'
                : clavan.length * 2 >= vs.length ? 'go' : 'warn';

    return `<tr><th>${c.eti}</th>
      <td${tonoMed ? ` data-t="${tonoMed}"` : ''}><b>${c.med(medido)}</b> <i>${c.uni}</i></td>
      <td>${abanico}</td><td data-t="${tonoQ}">${quien}</td></tr>`;
  }).filter(Boolean).join('');

  if (!filas) return '';
  return `<table class="obs__tab">
    <thead><tr><th></th><th>El aparato</th><th>Los modelos</th><th>El que clava</th></tr></thead>
    <tbody>${filas}</tbody></table>`;
}

async function contrastarConModelos(estaciones) {
  const huecos = document.querySelectorAll('.obs__m');
  const paraElMarcador = [];
  for (let n = 0; n < estaciones.length; n++) {
    const x = estaciones[n];
    if (!has(x?.lat) || !has(x?.lon) || !has(x?.racha)) continue;
    /* Por ÍNDICE, no por nombre. Los nombres de AEMET llevan acentos,
       puntos y barras («VI AMURRIO · ES-TIMS-45831»), y meterlos en un
       selector es pedir un fallo tonto en el peor momento. */
    const hueco = huecos[n];
    if (!hueco) continue;
    try {
      const d = await jget(API.fc, {
        latitude: x.lat, longitude: x.lon, timezone: 'auto', wind_speed_unit: 'kmh',
        /* CUATRO MEDIDAS, NO UNA. Suyo, 28-08-2026, con la tabla del
           Oiz delante: *«estos datos tienen que estar también en la app,
           hay sitio de sobra: los que marcan nuestros modelos y al lado
           lo que marcan los de Euskalmet, ¿no es así?»*, y *«más datos,
           mejor trabajamos, más seguros»*.

           Y tiene razón: la estación mide cuatro cosas y comparábamos
           una. La lluvia es la que más le sirve —el 90 % de su trabajo es
           caseta, fusibles al aire y armarios de intemperie—, y hasta hoy
           «¿llueve en el Oiz?» se contestaba con un modelo teniendo un
           pluviómetro allí arriba. */
        hourly: 'wind_gusts_10m,precipitation,temperature_2m,relative_humidity_2m',
        forecast_days: 1, past_hours: 3,
        cell_selection: 'land', models: COMPARAR.map(m => m.om).join(','),
      }, { timeout: 9000 });

      const H = d?.hourly; if (!H?.time) continue;
      /* LA HORA DEL DATO MEDIDO, no la de ahora. El 27-08 las estaciones
         llegaron a ir 3 h por detrás, y comparar contra la hora en curso
         enfrentaría dos momentos distintos.

         PRIMERA VERSIÓN, MAL, y se vio al mirarlo en pantalla: redondeaba
         el retraso a horas enteras (`Math.floor(hace/60)`), así que
         cualquier retraso de menos de una hora contaba como CERO y se
         comparaba contra «ahora». La tarjeta decía «medido a las 00:00» y
         justo debajo «los modelos a las 00:30». Con 30 min coincide por
         casualidad —los dos caen en la hora 00— pero con 90 min se va una
         hora entera y nadie lo nota.

         Ahora se calcula el instante del dato y de ahí sale la hora. */
      const tMedido = x.medidoEn && Number.isFinite(Date.parse(x.medidoEn))
      ? Date.parse(x.medidoEn)      /* la hora de la MEDIDA, no una resta contra el reloj de ahora */
      : Date.now() - (has(x.haceMinutos) ? x.haceMinutos : 0) * 60000;
      const ahora = new Date(tMedido);
      const iso = new Date(tMedido - ahora.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 13);
      const i = H.time.findIndex(t => t.slice(0, 13) === iso);
      if (i < 0) continue;

      const filas = COMPARAR.map(m => ({ n: m.name, v: H[`wind_gusts_10m_${m.om}`]?.[i] }))
                            .filter(f => has(f.v))
                            .sort((a, b) => b.v - a.v);
      if (filas.length < 2) continue;

      const { acuerdo, juicio } = frasesContraste(filas, x.racha);
      const otras = otrasMedidas(H, i, x);

      hueco.innerHTML = `<div class="obs__mm obs__mm--${acuerdo.c}">
        <b>Los modelos, en este mismo punto, a las ${esc(iso.slice(11))}:00:</b>
        ${filas.map(f => `<span class="obs__mv">${esc(f.n)} <b>${wtxt(f.v)}</b></span>`).join('')}
        <span class="obs__mj"><i>Entre ellos:</i> ${acuerdo.t}</span>
        <span class="obs__mj"><i>Contra el aparato:</i> ${juicio}</span>
        ${otras}
      </div>`;

      /* Y SE APUNTA. Ver `api/marcador.mjs` para el porqué: esta misma
         comparación se la lleva el viento en cuanto se refresca la
         pantalla, y así llevamos dos noches viendo lo mismo —ICON corto
         en Bilbao, AROME el único que vio el pico de Matxitxako— sin
         poder hacer nada con ello por falta de casos. */
      paraElMarcador.push({
        estacion: x.nombre, altitud: x.altitud, hora: iso,
        /* La RED va con la muestra: hay dos Matxitxako, la de AEMET a
           93 m y la de Euskalmet a 433. Sin esto se guardaban como una. */
        /* NUNCA se supone la red. Ponía «AEMET» cuando no se sabía, y
           eso partió Almike en dos —7 muestras como Euskalmet y 2 como
           AEMET— cuando **AEMET no tiene estación ahí**: la suya más
           cercana es Matxitxako, a 4,8 km. Etiquetar mal una estación
           falsea justo la cuenta que decide de quién fiarse.
           Cazado el 29-08-2026 por la sesión secundaria. */
        red: x.red || x.fuente || 'sin red',
        magnitud: 'racha',
        medido: x.racha, haceMinutos: x.haceMinutos,
        modelos: Object.fromEntries(filas.map(f => [f.n, f.v])),
      });

      /* La lluvia igual que arriba, y con la misma regla: solo si la mide
         esta estación. Ver `apuntarTorresEnMarcador`. */
      if (has(x.lluvia)) {
        const agua = COMPARAR.map(m => ({ n: m.name, v: H[`precipitation_${m.om}`]?.[i] }))
                             .filter(f => has(f.v));
        if (agua.length >= 2) paraElMarcador.push({
          estacion: x.nombre, altitud: x.altitud, hora: iso,
          red: x.red || x.fuente || 'sin red',
          magnitud: 'lluvia',
          /* La humedad MEDIDA va con la muestra. El 30-08-2026 el pluviómetro de
             Matxitxako marcó CERO durante hora y media de sirimiri real, con la
             humedad al 91 %. Sin este campo, el servidor no puede distinguir ese
             cero mentiroso de un seco de verdad — y premiaría al que no ve el
             sirimiri. */
          humedad: x.humedad,
          medido: x.lluvia, haceMinutos: x.haceMinutos,
          modelos: Object.fromEntries(agua.map(f => [f.n, f.v])),
        });
      }
    } catch { /* si falla, la estación se queda como estaba: nunca en blanco */ }
  }

  apuntarEnElMarcador(paraElMarcador);
}

/* ── PINTAR EL MARCADOR ─────────────────────────────────────────────
   Lo de arriba compara una vez y se lo lleva el refresco. Esto es el
   recuento de todas las veces, estación por estación.

   TRES DECISIONES, y las tres son por lo medido en este proyecto:

   1. **Por estación, jamás en promedio.** El error cambia de signo en
      ocho kilómetros: en el cabo de Matxitxako los modelos se quedaban
      22 cortos y en el valle de Forua se pasaban 20. La media de las dos
      da cero y diría que aciertan.

   2. **Manda el SESGO, no el error.** Pasarse es molesto; quedarse corto
      es mandar a alguien con más viento del que creía. Por eso el que se
      queda corto va en rojo aunque su error medio sea pequeño.

   3. **Con menos de cinco veces no se dice el número.** Se dice cuántas
      faltan. Un sesgo sacado de dos tardes es una anécdota con decimales,
      y de ahí salió el fallo del «tope de 9.000 m» que estuvo tres horas
      publicado. */
async function cargarMarcador() {
  const el = $('#marcador'); if (!el) return;
  const hint = $('#marcHint');
  try {
    const r = await fetch('/api/marcador');
    const d = await r.json();
    if (!r.ok || d.error) throw new Error(d.reason || `error ${r.status}`);

    const est = (d.estaciones || []).filter(e => e.muestras > 0);
    if (hint) hint.textContent = d.muestras ? `· ${d.muestras} comparaciones apuntadas` : '';

    if (!est.length) {
      el.innerHTML = `<p class="note">Todavía no hay ninguna comparación apuntada.
        Se llena solo: cada vez que abras la app y haya una estación midiendo,
        se guarda lo que decía cada modelo en ese punto y a esa hora.
        <b>Con cinco veces por estación ya empieza a decir algo.</b></p>`;
      return;
    }

    el.innerHTML = est.map(e => {
      /* Cada magnitud con su unidad y su vara. Quedarse 10 km/h corto de
         racha y 10 mm/h corto de lluvia no son el mismo suceso: lo
         segundo es un diluvio entero que el modelo no vio. */
      const esAgua = e.magnitud === 'lluvia';
      const G = d.porMagnitud?.[e.magnitud || 'racha'] || {};
      const txt = v => esAgua ? `${mmTxt(v)} mm/h` : wtxt(v, true);
      const raya = esAgua ? 1 : 10;
      const minimo = G.minimo ?? d.minimoParaFiarse;
      const conBastante = e.modelos.filter(m => m.bastante);
      const cuerpo = conBastante.length
        ? conBastante.map(m => {
            const corto = m.sesgo <= -raya, pasa = m.sesgo >= raya;
            const st = corto ? 'no' : pasa ? 'warn' : 'go';
            const dice = corto ? `se queda <b>${txt(-m.sesgo)} corto</b>`
                      : pasa  ? `se pasa <b>${txt(m.sesgo)}</b>`
                              : `cuadra (${txt(Math.abs(m.sesgo))})`;
            return `<div class="marc__m" data-s="${st}">
              <span class="marc__mn">${esc(m.modelo)}</span>
              <span class="marc__md">${dice}</span>
              <span class="marc__me">error medio ${txt(m.error)} · ${m.n} veces${
                m.cortas ? ` · <b>${m.cortas}</b> por debajo de ${txt(G.corto ?? 10)}` : ''}${
                has(m.peor) && m.peor < 0 ? ` · lo peor: ${txt(-m.peor)} corto` : ''}</span>
            </div>`;
          }).join('')
        : `<p class="note">Solo ${e.muestras} comparación${e.muestras > 1 ? 'es' : ''}.
           Hacen falta ${minimo} para decir algo de un modelo.</p>`;

      return `<div class="marc">
        <div class="marc__k"><b>${esc(e.estacion)}</b>${
          e.red ? `<span class="obs__red" data-r="${esc(e.red)}">${esc(e.red)}</span>` : ''}
          <span class="marc__mag" data-m="${esc(e.magnitud || 'racha')}">${
            esAgua ? 'lluvia' : 'racha'}</span>
          <span>${has(e.altitud) ? `${e.altitud} m · ` : ''}${e.muestras}
            comparaci${e.muestras === 1 ? 'ón' : 'ones'}
            · desde el ${esc(e.desde.slice(8, 10))}/${esc(e.desde.slice(5, 7))}</span></div>
        ${cuerpo}</div>`;
    }).join('')
    + `<p class="note">Ordenado por el error medio, no por el sesgo: un modelo que un día
       se pasa 20 y otro se queda 20 corto tiene sesgo cero y no acierta ninguna de las dos.
       <b>Y no se promedia entre estaciones</b>, porque ya está medido que el error cambia de
       signo en ocho kilómetros: en el cabo de Matxitxako se quedaban 22 cortos y en el valle
       de Forua se pasaban 20.</p>`
    + (est.some(e => e.magnitud === 'lluvia') ? `<p class="note">
       <b>La lluvia no se cuenta como la racha.</b> Casi todas las horas no llueve, así que
       si se contaran las 24 h el modelo que dijera «cero siempre» saldría el mejor en un mes
       seco. Solo cuenta la hora en que <b>llovió de verdad o algún modelo dijo que llovería</b>.
       Y solo se apunta si el pluviómetro es el de esa misma estación: el agua caída a cinco
       kilómetros no sirve para juzgar el modelo de aquí.
       <b>Y un cero del pluviómetro con el aire al 90 % o más no cuenta</b>: el 30-08 cayó
       sirimiri hora y media en Bermeo con los pluviómetros en cero — el sirimiri moja sin
       marcar, y esa hora no juzga a nadie.</p>` : '');
  } catch (e) {
    el.innerHTML = `<p class="note">No se ha podido leer el marcador: ${esc(e.message)}.
      <b>Esto no afecta a nada de lo de arriba</b>: es un cuaderno aparte.</p>`;
    if (hint) hint.textContent = '';
  }
}

/* ── EL MARCADOR: SE APUNTA SOLO, Y NO MOLESTA SI FALLA ──────────────
   Suyo, 28-08-2026: *«la prio es mejorar la fiabilidad de la app, con
   datos de los modelos y de lo que estamos aprendiendo»*.

   Va sin `await` y con el fallo tragado a propósito. Esto es un cuaderno
   de fondo: si el servidor no contesta, la pantalla que él está mirando
   no se entera. Lo que NO puede pasar nunca es que apuntar una medida
   estropee la pantalla con la que decide si manda gente a un monte. */
function apuntarEnElMarcador(muestras) {
  if (!muestras?.length) return;
  try {
    fetch('/api/marcador', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ muestras }),
    }).catch(() => {});
  } catch { /* ni esto */ }
}

/* ── EL PEOR DE LOS SIETE, NO EL QUE TENGAS CARGADO ──────────────────
   Aprobado por él el 27-08-2026 a las 23:50, con la medida delante.

   El rótulo grande —APTO / PRECAUCIÓN / NO APTO— salía del modelo que
   tuviera puesto. Y esa misma noche, en BI SOLLUBEMENDI: con ECMWF
   cargado ponía **19 km/h y verde**, mientras ARPEGE daba 46 y AROME 45.
   El aviso de «los modelos discrepan» sí salía, pero **más abajo**: el
   color, que es lo que se lee de un vistazo, seguía verde.

   Es el mismo patrón que ya se corrigió el 25-08 con la barra de 48 h y
   el 26-08 con la lluvia: **lo que decide tiene que mirar a todos.**

   MEDIDO ANTES, y por perfil, que no es lo mismo:

     · Perfil CASETA Y POSTE (el suyo el 70 % de las veces, umbral 70):
       **0 horas** de 720 pasarían a «no se trabaja» y solo 4 a aviso.
       Prácticamente no le cambia nada donde de verdad trabaja.
     · Perfil SUBIR A TORRE (sus 45/60): unas 3 h de ámbar por sitio y
       día. Ahí es donde pesa — y es una vez al año, y es subido a 40 m.

   OJO CON LA ALTURA, que es donde esto se puede estropear: la
   comparativa da rachas **a 10 m** y el semáforo de torre trabaja **a la
   altura de trabajo**. Comparar una cosa con otra sería inflar el número
   sin querer. Por eso el valor de los otros modelos se escala con **el
   mismo factor que la app ya aplica al modelo cargado** (`h.gust /
   h.gust10`), que es el que está calibrado y topado desde el 23-08.

   Si la comparativa no ha llegado —él en el monte sin cobertura— esto
   devuelve null y el semáforo se calcula como siempre. Nunca al revés. */
/* ── LA TORMENTA QUE VE OTRO MODELO (09-09-2026) ──────────────────────
   Calpe, 09:16: la tarjeta «Tormenta» decía «50 de CAPE · Inestabilidad
   baja · Tapa que aguanta» (AROME) mientras la comparativa, dos pantallas
   más abajo, decía «1 de 3 ven tormenta: GFS sí» con 2.320 de CAPE y la
   tapa en 11, abierta. La regla de la casa —el rayo no admite promedios,
   basta con que uno acierte— tiene que salir en la tarjeta que él mira,
   no solo en la tabla. Devuelve el modelo que salta (CAPE ≥ 700 y tapa
   < 75) con más gasolina a esa hora, o null. */
function tormentaQueNoVesTu(h, place = null) {
  const C = deEsteSitio(S.comparativa, place)?.hourly;
  if (!C?.time || !h?.date) return null;
  const iso = new Date(h.date.getTime() - h.date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 13);
  const i = C.time.findIndex(t => t.slice(0, 13) === iso);
  if (i < 0) return null;
  let peor = null;
  for (const m of COMPARAR) {
    const cape = C[`cape_${m.om}`]?.[i], cin = C[`convective_inhibition_${m.om}`]?.[i];
    if (!has(cape) || !has(cin)) continue;
    const auto = m.om === 'best_match';
    // A igual gasolina, antes un modelo con nombre que el «Automático», que es una mezcla.
    if (cape >= CAPE_COMBINACION && cin < 75
        && (!peor || cape > peor.cape || (cape === peor.cape && peor.auto && !auto)))
      peor = { quien: m.name, cape, cin, auto };
  }
  return peor;
}

function peorRacha(h, place = null) {
  /* Por la puerta, y con el sitio que se esté juzgando —que en el parte
     de las veinte filas NO es el que hay abierto en pantalla. */
  const C = deEsteSitio(S.comparativa, place)?.hourly;
  if (!C?.time || !h?.date) return null;
  /* Y TIENE QUE SER LA DE ESTE SITIO. Si se está juzgando otro
     emplazamiento —las veinte filas del parte— se devuelve null: sin
     comparativa propia, el semáforo se queda con el modelo cargado, que
     es honesto. Antes cogía la del sitio abierto y pintaba una fila con
     los datos de otra. */
  /* (La comprobación vive ahora en `deEsteSitio`, arriba: era la ÚNICA
     de los siete lectores de `S.comparativa` que miraba el sello.) */
  const iso = new Date(h.date.getTime() - h.date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 13);
  const i = C.time.findIndex(t => t.slice(0, 13) === iso);
  if (i < 0) return null;

  let mejor = null;
  for (const m of COMPARAR) {
    const v = C[`wind_gusts_10m_${m.om}`]?.[i];
    if (!has(v)) continue;
    if (!mejor || v > mejor.v10) mejor = { v10: v, quien: m.name };
  }
  if (!mejor) return null;

  /* A la altura de trabajo, con el factor del propio modelo cargado. Si
     no se puede saber el factor, se queda en los 10 m: quedarse corto es
     preferible a inventarse una escalada. */
  const factor = (has(h.gust) && has(h.gust10) && h.gust10 > 0)
    ? h.gust / h.gust10 : 1;
  return { v10: mejor.v10, v: mejor.v10 * factor, quien: mejor.quien };
}

  /* ── SOLO EL TIEMPO. LO QUE SE HACE, LO DECIDE ÉL ───────────────────
     Orden suya del 28-08-2026, viendo en ARBAIZA un «riesgo sirimiri, no
     se tocan los cuadros eléctricos»:

       *«¿Por lo que lo digáis vosotros? Además ayer os comenté: hasta con
         lluvia tengo que tocarlos. Y los cuadros están DENTRO de la
         caseta —Arbaiza tiene caseta—; otra cosa es el contador, que está
         a 1 metro del suelo, pero también se puede revisar. Esos
         comentarios mejor no ponerlos, yo decido.»*

       *«Vosotros me tenéis que poner: en Sollube o en Arbaiza te va a
         llover fuerte, va a haber rachas de tal, no habrá rayos… solo
         info del tiempo en ese lugar, una info detallada, y yo decido si
         se va, si se va más tarde, si se sube al poste.»*

     Y tiene toda la razón: **nosotros no sabemos qué avería es, ni si el
     cuadro está dentro o fuera, ni si lleva guantes.** Él sí.

     LA REGLA, y vale para todo el texto que él lee:
       · **El tiempo y su consecuencia física, SÍ** — «moja», «racha de
         63», «no hay rayos», «va a estar mojado».
       · **Qué hacer con eso, NO** — nada de «no se sube», «no se tocan»,
         «no se trabaja», «antes de autorizar».

     El único que se queda es el RAYO, y porque es suyo: *«debo acudir
     siempre y cuando no caigan rayos»*. Ese no es criterio nuestro. */
function assess(h, thr, quePerfil, place = null) {
  const P = PERFILES[quePerfil] ?? perfil();
  const R = [];
  let st = 'go';
  const bump = (s, txt) => { st = worst(st, s); R.push({ s, txt }); };

  // — Viento y ráfaga —
  //
  // El SEMÁFORO se calcula con el valor a la altura de trabajo, no con el
  // de 10 m: es lo conservador, porque arriba siempre hay más y así salta
  // antes. En pantalla el dato crudo de 10 m va delante y el estimado
  // detrás y marcado, para que se vean los dos.
  // MEDIDO en Euskadi: de 10 a 40 m el viento se multiplica por 1,36 de
  // mediana, y por 1,74 uno de cada diez días.
  if (P.vientoManda) {
    // SUBIR A LA TORRE: aquí el viento manda, y con los umbrales de él.
    if (!has(h.wind)) bump('nd', 'Viento a la altura de trabajo: sin dato del modelo');
    else if (wRed(h.wind) >= wRed(thr.windNo))   bump('no',   `Viento ${wtxt(h.wind, true)} a ${h.h} m — supera el límite de ${wtxt(thr.windNo, true)}`);
    else if (wRed(h.wind) >= wRed(thr.windWarn)) bump('warn', `Viento ${wtxt(h.wind, true)} a ${h.h} m — por encima de ${wtxt(thr.windWarn, true)}`);

    const otra = peorRacha(h, place);
    const gMax = has(h.gust) ? Math.max(h.gust, otra?.v ?? 0) : (otra?.v ?? null);
    /* Si el que decide no es el que él tiene cargado, se DICE de quién
       es. Un número sin dueño es el fallo del 24-08: la ficha ponía un
       modelo y enseñaba cifras de otro. */
    /* Comparado sobre lo que se IMPRIME (redondeado): con 60,8 y 60,6 salía
       «lo dice ICON, y tu modelo da 61 km/h» — el mismo número dos veces
       para decir que uno es mayor. Revisión del 04-09-2026. */
    const deQuien = (otra && has(h.gust) && wRed(otra.v) > wRed(h.gust))
      ? ` — lo dice ${otra.quien}, y tu modelo da ${wtxt(h.gust, true)}` : '';
    if (!has(gMax)) bump('nd', 'Ráfaga: sin dato del modelo');
    /* ── EL COLOR CUADRA CON EL NÚMERO QUE LEE ────────────────────────
       Revisión del 04-09-2026: con la racha en 59,6 se imprimía «Ráfaga
       60 km/h» en ÁMBAR — el número exacto de su listón de NO y el
       semáforo sin ponerse rojo. `gustAt()` devuelve continuo, así que
       esa franja se pisa a menudo. Se compara lo que se IMPRIME. */
    else if (wRed(gMax) >= wRed(thr.gustNo))   bump('no',   `Ráfaga ${wtxt(gMax, true)}${h.gustEst ? ' (est.)' : ''} — supera el límite de ${wtxt(thr.gustNo, true)}${deQuien}`);
    else if (wRed(gMax) >= wRed(thr.gustWarn)) bump('warn', `Ráfaga ${wtxt(gMax, true)}${h.gustEst ? ' (est.)' : ''} — por encima de ${wtxt(thr.gustWarn, true)}${deQuien}`);
  } else {
    // CASETA, POSTE O AZOTEA: no estás colgado de la torre. La ráfaga
    // solo cuenta cuando es de no tenerse en pie, de tumbar una escalera
    // de 3 m o de tirar ramas a la pista de subida. Si no, es contexto.
    // Por esto la app le daba NO APTO con 62 km/h en días que él iba a la
    // caseta sin dudarlo (24-08-2026).
    const suyo = has(h.gust10) ? h.gust10 : h.gust;
    const otra = peorRacha(h, place);
    const otra10 = otra?.v10;
    /* Si el número que manda es de OTRO modelo, se dice de cuál: «Ráfaga
       62 km/h» con todas las tarjetas en 46 se leía como un fallo
       (Calpe, 09-09-2026 09:17). */
    const deOtro = otra && has(otra10) && (!has(suyo) || otra10 > suyo) ? ` (lo ve ${otra.quien})` : '';
    /* Aquí a 10 m y sin escalar: en la caseta y en el poste se está a ras
       de suelo. Medido: con su umbral de 70 esto cambia CERO horas de 720
       — donde de verdad trabaja, no le mueve nada. */
    const g10 = has(suyo) ? Math.max(suyo, otra10 ?? 0) : (otra10 ?? null);
    const conHierro = S.perfil === 'hierro';
    /* ── SIN RÁFAGA NO SE CALLA, TAMPOCO AQUÍ ─────────────────────────
       Revisión del 04-09-2026: el 'nd' de la ráfaga solo lo emitía el
       perfil de torre. En caseta y poste —el de fábrica— un `gust10` a
       null (lo tira `sanear()` cuando el número es imposible, o AROME se
       acaba y el relleno se cae) no generaba ningún motivo y la hora
       salía en VERDE con «Nada llega a tus listones». La comparativa lo
       rescata cuando la hay (`otra10`); cuando no —las veinte filas de
       «Mis torres», el primer pintado— aquí no hay dato, y se dice. */
    if (!has(g10)) bump('nd', 'Ráfaga: sin dato del modelo');
    else if (P.rafagaBestia && g10 >= P.rafagaBestia)
      bump('no', `Ráfaga ${wtxt(g10, true)}${deOtro}` +
        (conHierro ? `, y a ras de suelo se nota: ramas en la pista, trampillas y rejillas`
                   : ` a la intemperie`));
    else if (P.rafagaBestia && g10 >= P.rafagaBestia * 0.7)
      bump('warn', `Ráfaga ${wtxt(g10, true)}${deOtro} — ` +
        (conHierro ? `molesta en la escalera del poste y para abrir armarios; dentro de la caseta no impide trabajar`
                   : `cuidado con lo que se pueda volar`));
  }

  // — Aparato eléctrico —
  // — Aparato eléctrico —
  //
  // El CAPE POR SÍ SOLO no puede dar NO APTO, y esto es una corrección de
  // criterio: el 23-08-2026 la app marcaba NO APTO en Bermeo a las 09:20
  // con el cielo despejado y 17 km/h de racha, solo porque el CAPE valía
  // 1440. El CAPE es la gasolina, no la chispa: dice que PUEDE haber
  // tormenta más tarde, no que la haya ahora. Una app que grita que viene
  // el lobo con sol y sin viento deja de creerse, y entonces no sirve el
  // día que avise de verdad.
  //
  // NO APTO solo cuando hay señal de tormenta EN CURSO o inminente:
  // código de tormenta, o CAPE alto acompañado de lluvia.
  const tormentaAhora = isStormCode(h.code);
  /* Con SU listón de lluvia, no con un 0,2 escrito a mano: es un número
     que él puede cambiar en Ajustes y hasta hoy no cambiaba nada aquí
     (barrido del 01-09-2026). Con los valores de fábrica sale igual. */
  const lloviendo = has(h.prec) && h.prec > (thr?.rainWarn ?? 0.2);

  if (tormentaAhora) bump('no', `Tormenta prevista (${wmoText(h.code)}) — riesgo eléctrico`);

  /* — LA TAPA, que es la que avisó de verdad ─────────────────────────
     La noche del 23-08-2026 cayeron rayos en el Duranguesado y Lekeitio
     y rompieron postes y fusibles. MEDIDO después, hora a hora:

       Lekeitio 19:00 — CAPE 780,  tapa 229  → no rompió
       Lekeitio 22:00 — CAPE 960,  tapa  13  → descargó
       Lekeitio 23:00 — CAPE 1360, tapa  15
       Durango  23:00 — CAPE 1070, tapa  56

     Y lo más importante: el «estado del cielo» del modelo **no dijo
     tormenta en ninguna de esas horas**. Quien se fíe de ese campo no ve
     venir nada. Lo que avisó fue el CAPE subiendo con la tapa cayéndose.

     Va como PRECAUCIÓN DESTACADA, no como NO APTO. Lo decidió Aitor el
     24-08-2026: el rojo se reserva a tormenta en curso, porque una app
     que grita se deja de creer y entonces no sirve el día que acierta.

     Umbrales calibrados sobre 960 horas reales (5 emplazamientos, 8
     días): CAPE>=800 con tapa<75 salta el **2,8 %** de las horas y caza
     las 22:00 y 23:00 de aquella noche. Con CAPE>=1000 y tapa<50 bajaba
     al 1,0 % pero se dejaba fuera Lekeitio a las 22:00, que ya descargó.

     Va ANTES que los avisos sueltos de CAPE para que salga él de titular,
     y los desactiva: decir dos veces lo mismo es ruido.               */
  // RECALIBRADO EN CALIENTE el 24-08-2026 a las 15:40. Aitor oyó truenos en
  // Bermeo, sin lluvia. El modelo daba CAPE 720 con la tapa en 14 — la
  // combinación de siempre — y con el umbral en 800 NO saltaba por 80 J/kg.
  // Sollube tenía la tapa en 1 y Gernika en 1. Y ningún modelo dijo
  // «tormenta» en el estado del cielo, otra vez.
  //
  // Recalibrado sobre 1.536 horas (8 emplazamientos, 8 días):
  //   CAPE>=800 tapa<75 → 2,9 % de las horas, NO caza lo de Bermeo
  //   CAPE>=700 tapa<75 → 4,0 %, caza Bermeo hoy, Lekeitio 22 y 23 h de
  //                       anoche y Durango a las 23 (tapa 56)
  //   CAPE>=700 tapa<50 → 2,7 %, pero pierde Durango
  // Se queda en 700/75: una hora al día de media, y es aviso, no rojo.
  const TAPA_CAPE = CAPE_COMBINACION, TAPA_ABIERTA = 75;

  /* — Y HACE FALTA UNA CHISPA ─────────────────────────────────────────
     Añadido el 25-08-2026, y lo encontró él. Girona daba CAPE 1500 con
     la tapa en 33 —más gasolina que Lekeitio la noche que rompió los
     postes— y la app iba a cantar «⚡ Riesgo de tormenta». Aitor miró
     AEMET y Windy y dijo que no marcaban nada. Tenía razón: medido
     sobre los mapas de descargas de AEMET, CERO rayos en 60 km en cinco
     horas.

     Lo que faltaba: 0 % de probabilidad de lluvia y cielo poco nuboso.
     El depósito lleno y la tapa quitada no encienden nada si no hay
     quien empuje el aire hacia arriba. Es la misma lección de la tapa,
     un escalón más allá: un número verdadero, leído solo, engaña.

     LAS CUATRO QUE ROMPIERON DE VERDAD tenían probabilidad de sobra:
       Lekeitio 23-08 22:00  CAPE  980 · tapa 13 · prob 25 %
       Lekeitio 23-08 23:00  CAPE 1350 · tapa 15 · prob 23 %
       Durango  23-08 23:00  CAPE 1070 · tapa 56 · prob 15 %
       Bermeo   24-08 15:00  CAPE  720 · tapa 59 · prob 28 %   (oyó truenos)
       ── y Girona 25-08 18:00  CAPE 1500 · tapa 33 · prob  0 %  → nada

     Calibrado sobre 2.904 horas (11 emplazamientos suyos, 14 al 24 de
     agosto): la combinación sola salta 81 h (2,8 %); pidiendo además
     probabilidad ≥10 % baja a 30 h (1,0 %).

     EL 10 %, Y NO EL 15: quince es justo lo que tenía Durango, o sea el
     borde del caso más justo. Ajustar el listón al peor positivo es
     aprenderse los casos, no el fenómeno. El 10 deja holgura por debajo
     y cuesta lo mismo (30 h frente a 28).

     HONESTIDAD SOBRE ESTA CALIBRACIÓN: son CUATRO positivos. Es fina,
     no robusta. Si algún día aparece una tormenta real con la
     probabilidad por debajo del 10 %, este número se sube, no se
     discute.

     Y SI NO HAY DATO DE PROBABILIDAD, SE AVISA IGUAL. Un hueco no puede
     valer como «no hay disparador» — es la regla 2 de esta app. */
  const TAPA_POP = 10;
  /* Lo que añade la altura de la nube. SIEMPRE suma, nunca resta: si no
     hay dato, esta función devuelve cadena vacía y el aviso queda tal
     cual estaba. Ver el comentario largo en HOURLY para el porqué. */
  const laCombinacion = has(h.cape) && has(h.cin)
                     && h.cape >= TAPA_CAPE && h.cin < TAPA_ABIERTA;
  /* Y si YA ESTÁ LLOVIENDO, hay chispa aunque la probabilidad diga 0 %.
     El agua que cae es una medida; la probabilidad es una previsión. Ante
     una contradicción entre las dos, manda lo que está pasando. Sin esto,
     una hora con 3 mm y 0 % de probabilidad sacaba las dos frases a la
     vez: «nada que lo dispare» encima de «tormenta en marcha». */
  const hayChispa = !has(h.pop) || h.pop >= TAPA_POP || lloviendo;
  const tapaAbierta = laCombinacion && hayChispa;

  /* Si ya está rompiendo, el rojo de abajo lo dice solo. Este ámbar
     diría «mira el radar ANTES de autorizar» debajo de «tormenta en
     marcha», y eso resta en vez de sumar. (Venía de antes; salió al
     probar los casos uno a uno el 25-08-2026.) */
  const rompiendo = laCombinacion && lloviendo && h.cape >= thr.capeNo;

  if (tapaAbierta && !tormentaAhora && !rompiendo)
    bump('warn', `CAPE ${h.cape.toFixed(0)} J/kg y la tapa en ${h.cin.toFixed(0)} — `
               + `hay gasolina Y la tapa está abierta. Es la combinación que rompe: `
               + `mira el radar y el oído: si se oye el trueno, ya estás dentro del alcance`
               + loQueMideLaNube(h, place));

  /* Cargado pero sin quien lo encienda. Y esto SIGUE SIENDO PRECAUCIÓN,
     no verde: con 1.500 J/kg encima una célula se forma en dos horas —
     que es justo lo que le pasó en Bermeo el 24-08, sin que lo avisara
     nadie. Lo que sobraba era el TITULAR de rayo, no el ámbar.
     Lo único que se le quita es el «⚡», que es lo que gritaba de más. */
  if (laCombinacion && !hayChispa && !tormentaAhora)
    bump('warn', `CAPE ${h.cape.toFixed(0)} J/kg y la tapa en ${h.cin.toFixed(0)}, `
               + `pero solo ${h.pop} % de probabilidad de lluvia — hay ambiente `
               + `cargado y nada que lo dispare de momento. Si cambia el cielo, `
               + `cambia esto: vigila el radar`);

  /* Los avisos sueltos de CAPE solo salen si NO se ha dado la
     combinación — con chispa o sin ella. Es el invariante que ya estaba
     escrito arriba («va antes que los avisos sueltos y los desactiva»),
     y el 25-08-2026 lo rompí yo al partir la condición en dos: Girona
     acababa con las dos frases a la vez, una diciendo «nada que lo
     dispare» y la otra «puede romper». Lo cazó la sesión de al lado. */
  if (has(h.cape) && !laCombinacion) {
    if (h.cape >= thr.capeNo) {
      if (lloviendo)
        bump('no', `CAPE ${h.cape.toFixed(0)} J/kg y lloviendo — tormenta en marcha, riesgo eléctrico`);
      else
        bump('warn', `CAPE ${h.cape.toFixed(0)} J/kg — mucha energía disponible. `
                   + `No es tormenta todavía, pero puede romper. Vigila el radar y el cielo`);
    } else if (h.cape >= thr.capeWarn) {
      bump('warn', `CAPE ${h.cape.toFixed(0)} J/kg — inestabilidad moderada`);
    }
  } else if (rompiendo) {
    // Con la tapa abierta, gasolina de sobra Y lloviendo ya, esto no es
    // «puede romper»: está rompiendo. Eso sí es rojo, como antes.
    bump('no', `CAPE ${h.cape.toFixed(0)} J/kg, tapa ${h.cin.toFixed(0)} y lloviendo — `
             + `tormenta en marcha, riesgo eléctrico`);
  }
  /* ── SIN DATO DE CAPE NO SE CALLA ─────────────────────────────────
     Cazado por la revisión del 04-09-2026: el 'nd' («sin dato») solo lo
     emitía el viento, y solo en el perfil de torre. Si el CAPE venía a
     `null` —AROME acabado y el relleno con ECMWF caído— no se decía nada,
     y la línea de abajo remataba «Nada llega a tus listones» en verde:
     una afirmación sobre un dato que no existe. Su regla 1: vacío jamás.
     Mismo trato que ya tenía la ráfaga. */
  if (!has(h.cape)) bump('nd', 'CAPE: sin dato del modelo');
  if (has(h.li) && h.li <= -2) bump('warn', `Índice de elevación ${h.li.toFixed(1).replace('.', ',')} — atmósfera inestable`);

  // — Precipitación y hielo —
  if (has(h.prec)) {
    if (P.lluviaManda) {
      if (h.prec >= thr.rainNo)        bump('no',   `Precipitación ${mmTxt(h.prec)} mm/h — estructura resbaladiza`);
      else if (h.prec >= thr.rainWarn) bump('warn', `Precipitación ${mmTxt(h.prec)} mm/h`);
    } else if (h.prec >= thr.rainWarn) {
      /* DESDE QUE MOJA, NO DESDE QUE DILUVIA. Corregido el 28-08-2026 con
         una regla suya que no estaba en ningún sitio:

           *«Cuando está lloviendo no se debe subir a los postes de luz,
             que están los fusibles allí a 2 metros, por sobretensión.»*

         Es un TERCER caso, distinto de los dos que había. En la caseta la
         lluvia no le para —*«aquí a partir de octubre llueve a diario»*—
         y a la torre no sube ni lloviendo. **Pero el poste de la acometida
         es otra cosa**: está a 2 m, en una escalera, con la CGP y los
         fusibles de Iberdrola EN TENSIÓN y a la intemperie. Lo que manda
         ahí no es resbalar: es el agua sobre algo con tensión.

         El aviso saltaba solo desde `rainNo` (2,0 mm/h). Y **una lluvia de
         0,5 moja el fusible exactamente igual que una de 3**: lo que
         importa es que moje, no cuánto caiga. Ahora salta desde `rainWarn`.

         NO SE CONVIERTE EN VETO, y es orden suya de esa noche: *«eso lo
         valoro yo»*. La app cuenta lo que se va a encontrar; decide él.

         (Por debajo de `rainWarn` ya lo cubre el bloque del sirimiri, que
         dice lo mismo. Entre los dos no queda hueco: si moja, se dice.) */
      bump('warn', `Precipitación ${mmTxt(h.prec)} mm/h — lo que esté a la `
                 + `intemperie estará mojado: contador, CGP y fusibles del poste`);
    }
  }
  /* Y la lluvia igual: es su prioridad 1, y un `null` no es «0,0 mm». */
  if (!has(h.prec)) bump('nd', 'Lluvia: sin dato del modelo');
  /* — EL SIRIMIRI ────────────────────────────────────────────────────
     Descubierto el 25-08-2026 con una mañana suya en Bilbao: sirimiri
     desde las 08:00 casi hasta las 13:00, carreteras mojadas —lo vio en
     las cámaras—, y **la app no dijo ni una palabra**. Motivo: el aviso
     de lluvia va en MILÍMETROS y el sirimiri no existe en milímetros.

     MEDIDO ese día:
       · el modelo daba 0,0 mm a las 08:00 y 0,1 mm a las 09:00
       · las estaciones de AEMET midieron 0,4 mm en Bilbao aeropuerto,
         0,4 en Güeñes y 0,6 en Sopuerta, en toda la mañana
       · con el umbral de aviso en 0,2 mm/h no saltaba nada
     O sea que la app le habría dicho que no llovía mientras se le
     mojaba el poste, el armario y la escalera.

     Lo que SÍ lo vio fue el código del modelo: 51 a las 08:00, 55 a las
     09:00 y 51 a las 11:00. Y ojo, porque la humedad del modelo NO vale
     para esto: daba 73 % cuando la estación medía 88 %. Se probó una
     regla por humedad y visibilidad y no habría saltado ni una vez esa
     mañana. Por eso la regla es el código, a secas.

     Calibrado sobre 2.112 horas (11 emplazamientos suyos, 8 días):
       · código de llovizna sin más ............ 8,9 % de las horas
       · código de llovizna Y bajo el umbral ... 6,2 %  ← esta
       · humedad ≥95 %, cubierto y vis <5 km ... 1,7 % (y no caza lo suyo)
     Salta en 3 a 6 días de 8 según el sitio, en tandas de 1 a 4 horas
     seguidas. Es aviso, nunca NO APTO: el sirimiri no para el trabajo,
     lo hace resbaladizo. Gritar por sirimiri sería perder el rojo. */
  const sirimiri = comoLlueve(h, thr).k === 'sirimiri';
  if (sirimiri && P.sirimiriImporta) {
    const cuanto = has(h.prec) && h.prec > 0
      ? `solo ${mmTxt(h.prec)} mm/h` : 'no marca ni un milímetro';
    if (P.vientoManda) {
      /* SUBIR: aquí el sirimiri es NO, y lo puso él el 25-08-2026:
         «con sirimiri puedo ir a las casetas pero no a los mástiles y
         menos a las torres». Es criterio suyo, de quien reparte la
         gente, y manda sobre cualquier umbral que pusiera yo. */
      bump('no', `Sirimiri (${wmoText(h.code).toLowerCase()}) — ${cuanto}. `
        + `No marca en el pluviómetro pero MOJA: pates, peldaños y cable de vida `
        + `quedan resbaladizos igual que con lluvia, y no se ve venir`);
    } else {
      /* CASETA Y POSTE: aquí sí va, y él lo dice claro. Lo que no se
         hace es meter mano en tensión con todo mojado. Su aviso, del
         mismo día: «hay cuadros eléctricos de intemperie y con sirimiri
         hay peligro al tocarlos, con guantes y todo». */
      bump('warn', `Sirimiri (${wmoText(h.code).toLowerCase()}) — ${cuanto}. `
        + `No marca en el pluviómetro pero MOJA. `
        + `Lo que esté a la intemperie estará mojado aunque lleves `
        + `guantes. La escalera del poste y las rejillas resbalan`);
    }
  }

  if (has(h.temp) && has(h.prec) && h.temp <= 1 && h.prec > 0)
    bump('no', `${h.temp.toFixed(0)} °C con precipitación — riesgo de hielo en la estructura`);

  // — Visibilidad —
  if (has(h.vis) && h.vis < thr.visWarn)
    bump('warn', `Visibilidad ${kmTxt(h.vis / 1000)} km — reducida`);

  // — Confort térmico —
  if (has(h.feels) && h.feels <= thr.feelsWarn)
    bump('warn', `Sensación térmica ${h.feels.toFixed(0)} °C — riesgo de pérdida de destreza manual`);

  /* «Sin condicionantes meteorológicos sobre los umbrales fijados» era
     el mismo renglón que el semáforo de al lado, en difícil. Suyo el
     02-09-2026: *«al final lío con esos textos»*. El semáforo ya dice
     SIN NADA; aquí basta con qué listones se han mirado.

     Y SOLO SI DE VERDAD NO HAY NADA. Revisión del 04-09-2026: con la
     lluvia, el CAPE o la ráfaga a null no salía ningún motivo y esta
     frase afirmaba «nada llega» sobre un dato que no se había leído.
     Ahora cada hueco mete su 'nd' arriba y deja la hora en SIN DATO, y
     esta frase solo puede salir con la hora en 'go': un hueco nunca se
     lee como «aquí no pasa nada» (su regla 2). */
  if (st === 'go' && !R.length) R.push({ s: 'go', txt: `Nada llega a tus listones` });
  return { st, reasons: R };
}

/* ---------- 6. Obtención de datos ---------- */

async function jget(url, params, { timeout = 12000 } = {}) {
  const u = new URL(url);
  Object.entries(params || {}).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(u, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

const HOURLY = [
  'temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m',
  'precipitation','precipitation_probability','weather_code','cloud_cover',
  // Las nubes, por capas. Ver `nubesPorCapas()`: el total se las come.
  'cloud_cover_low','cloud_cover_mid','cloud_cover_high','visibility',
  'wind_speed_10m','wind_speed_80m','wind_speed_120m','wind_speed_180m',
  'wind_direction_10m','wind_direction_80m','wind_gusts_10m',
  // Para el acceso: la pista. Aitor sube con cadenas en invierno y a
  // veces arrastrando un grupo electrógeno en remolque.
  'snowfall','snow_depth',
  'cape','lifted_index','convective_inhibition','freezing_level_height',
  /* LO ALTO QUE LLEGA LA NUBE, y dónde empieza. Puesto el 27-08-2026 con
     sus pantallazos del mapa delante.

     El tope dice si la nube se electrifica: el rayo se fabrica arriba, en
     la parte helada. El 24-08, cuando oyó truenos, el tope sobre Mungia
     estaba en 10.640 m; el 27-08, con ICON dando 870 de CAPE, no pasaba
     de 6.780 y ni Windy ni Meteored ponían rayos.

     PERO NO DECIDE, Y ESTÁ MEDIDO POR QUÉ. Solo trae valor el 33 % de las
     horas (ICON), el 36 % de las horas con CAPE ≥ 700, y GFS **no lo
     publica nunca**: 0 de 1.008 horas. Peor aún: de los cinco casos que
     de verdad rompieron, TRES no tenían tope —incluidos los dos que le
     reventaron los postes en Lekeitio y Durango—. Una regla que bajara el
     aviso por tope bajo los habría callado. Es la regla 2 de esta app: un
     hueco no puede valer como «aquí no pasa nada».

     Así que suma cuando está y calla cuando no. Nunca resta. */
  'convective_cloud_top','convective_cloud_base',
  'surface_pressure','pressure_msl','is_day','uv_index',
  /* LA HUMEDAD DEL SUELO SE PROBÓ Y SE QUITÓ, el 28-08-2026, y queda
     escrito para que no se vuelva a intentar sin motivo.

     `soil_moisture_3_to_9cm` existe, la sirve Open-Meteo y llegó a
     pintarse: «tierra 0,15 m³/m³». Y ahí se vio el fallo: **ese número
     no lo puede leer nadie**. Sin saber a partir de qué valor patina SU
     furgoneta en SUS pistas, es ruido con pinta de dato.

     Y él mismo lo aparcó: *«me hago la idea de eso fácil: si llueve bien
     y horas se forma barrizal, si cae poco nada, otras tienen asfalto.
     No me es urgente, de momento si queréis dejarlo»*. Tiene razón por
     partida doble: lo cala mejor que la variable, y **algunas pistas son
     de asfalto**, con lo que la humedad del suelo no dice nada.

     Se queda la lluvia de las últimas 72 h, que sí se lee en milímetros.
     Si algún otoño él apunta cómo estaba la pista en diez subidas, se
     podrá volver a esto con un número que signifique algo. */
].join(',');

const CURRENT = [
  'temperature_2m','apparent_temperature','relative_humidity_2m','is_day','precipitation',
  'weather_code','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high',
  'surface_pressure','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m',
].join(',');

const DAILY = [
  'weather_code','temperature_2m_max','temperature_2m_min','sunrise','sunset',
  'precipitation_sum','precipitation_probability_max','wind_speed_10m_max','wind_gusts_10m_max',
  'wind_direction_10m_dominant','uv_index_max',
].join(',');

async function loadAll(p) {
  /* `cell_selection: 'land'` iba por defecto SIN QUE NADIE LO HUBIERA
     ESCRITO, y eso costó caro. Se deja puesto a mano para que se vea.

     Está bien para lo de superficie —temperatura, viento, lluvia— porque
     una celda de mar tiene otra física y su viento no es el de tierra.
     Pero para un sitio pegado al agua, «la tierra firme más cercana» en
     una malla de 25 km puede estar MUY lejos: en BI BERMEO, ECMWF lee a
     18,3 km hacia el sur, en los montes entre Gernika y Durango.

     El 27-08-2026, con los pantallazos de AguaceroWx de Aitor delante:
     la app enseñaba CAPE 20 para ECMWF en Bermeo y ECMWF daba 1.110 en
     Bermeo. Cincuenta y cinco veces. Por eso ahora, cuando el nudo de
     tierra se va lejos, se pide TAMBIÉN el de al lado — ver `pedirCerca`. */
  const base = { latitude: p.lat, longitude: p.lon, timezone: 'auto',
                 wind_speed_unit: 'kmh', cell_selection: 'land' };

  const M = model();
  /* Qué modelo sirvió DE VERDAD los números. Puede no ser el elegido:
     ver la caída de abajo. Sin esto la ficha pondría un nombre y
     enseñaría cifras de otro. */
  let modeloUsado = M.id;

  const fc = jget(API.fc, {
    ...base, current: CURRENT, hourly: HOURLY, daily: DAILY,
    forecast_days: 10, past_hours: 1, models: M.om,
  }).catch(async e => {
    // Un modelo de área limitada (AROME) puede no cubrir el punto.
    // No se inventa nada: se avisa y se cae al modelo automático.
    if (M.id === 'icon') throw e;
    /* Se cae a ICON, no al Automático. ICON es global —cubre Miami y
       Brasil, donde AROME no llega—, es el segundo del marcador, y
       **es un modelo de verdad**: se sabe cuál estás mirando. El
       Automático cambia solo y sin avisar, y por eso lo quitó él. */
    /* ── Y NO SE GUARDA. SOLO PARA ESTA CARGA ────────────────────────
       Fallo mío, cazado el 29-08-2026 en el repaso —y por la otra sesión
       a la vez— antes de que él lo probara en el monte.

       Aquí ponía `LS.set('model', ...)`, o sea que **guardaba el cambio
       para siempre**. Dos formas de hacerle daño:

         · va a Miami, AROME no cubre, se le pasa a ICON **y se queda**;
           vuelve a Bermeo y ya no está en AROME, sin enterarse;
         · y este `catch` salta con **cualquier** error, también un hipo
           de red. Un mal momento de cobertura en el monte y se queda
           fuera de AROME para siempre.

       Es literalmente *«cambia solo y sin avisar»*, que es por lo que él
       quitó hoy el Automático. Lo había vuelto a meter yo por otra
       puerta y en el mismo día.

       Ahora **su elección no se toca**: se usa ICON solo para esta carga
       y la ficha lo dice, porque `_modelo` lleva el que de verdad sirvió
       los números. La próxima vez se vuelve a intentar con el suyo. */
    /* ── Y A QUIÉN SE CAE, TAMBIÉN MEDIDO ─────────────────────────
       Aquí ponía `'icon_seamless'` escrito a mano. Era correcto —ICON es
       global— pero era una línea a mano más, de las que se quedan cojas.
       Ahora sale del primero de `ORDEN_FIABLE` que llegue fuera de
       Europa, y quién llega lo mide `medir-cobertura.cjs` en Miami. */
    const rebote = ORDEN_FIABLE.find(om => om !== M.om && GLOBALES.includes(om))
                || 'icon_seamless';
    const nRebote = MODELS.find(x => x.om === rebote)?.name
                 || COMPARAR.find(x => x.om === rebote)?.name || rebote;
    toast(`${M.name} no cubre este punto — enseñando ${nRebote} solo aquí`, 4200);
    modeloUsado = MODELS.find(x => x.om === rebote)?.id || 'icon';
    return jget(API.fc, { ...base, current: CURRENT, hourly: HOURLY, daily: DAILY,
      forecast_days: 10, past_hours: 1, models: rebote });
  });

  // Los dos siguientes son opcionales: si fallan, la app sigue funcionando.
  const aq = jget(API.aq, {
    latitude: p.lat, longitude: p.lon, timezone: 'auto',
    current: 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone',
  }).catch(() => null);

  /* ── EL MAR NO QUIERE LA CELDA DE TIERRA ─────────────────────────────
     Fallo mío del 27-08 por la noche, cazado por él a la mañana
     siguiente: *«sin datos, error grave»*, con la pestaña Mar entera en
     «sin dato».

     Al arreglar lo del nudo de la rejilla puse `cell_selection: 'land'`
     en `base`… **y `base` también se usa para el oleaje.** Pedirle al
     modelo del mar el punto de TIERRA más cercano es pedirle olas donde
     no hay agua: devuelve un punto y ningún dato.

     Comprobado los dos casos: sin `cell_selection` da ola 1,26 m,
     periodo 7,1 s y agua a 23,5 °C; con `land`, nada.

     LA LECCIÓN, que vale para cualquier `...base`: **un ajuste que es
     bueno para una API puede romper otra.** `base` la comparten cuatro
     peticiones y no todas hablan del mismo mundo.

     Y tiene razón en lo otro que dijo: esto lo tenía que haber cazado la
     revisión de mantenimiento, no él. Queda apuntado para esa tarea. */
  const { cell_selection: _sinTierra, ...baseMar } = base;
  S.marFallo = null;
  const mar = jget(API.mar, {
    ...baseMar, forecast_days: 3,
    current: 'wave_height,wave_period,wave_direction,sea_surface_temperature,'
           + 'swell_wave_height,swell_wave_period,wind_wave_height,ocean_current_velocity',
    hourly: 'sea_level_height_msl,wave_height,wave_period,swell_wave_height,swell_wave_period',
  }).catch(e => {
    /* Tierra adentro el modelo marino contesta 4xx: no hay pestaña Mar y
       punto. Pero un 5xx, un corte o un tiempo agotado NO es «no hay mar»:
       se guarda el motivo y la pestaña lo dice (revisión 04-09-2026). */
    S.marFallo = e?.message || 'sin red';
    return null;
  });

  const [f, a, m] = await Promise.all([fc, aq, mar]);
  /* EL GUARDIA, ANTES QUE NADA. Ver `sanear()`: si entra un número
     imposible aquí, sale en las cuatro pantallas. Se limpia una vez y
     todas quedan bien. */
  f.imposibles = sanear(f.hourly);
  /* ── EL SELLO, ANTES DEL REPARTO ─────────────────────────────────
     Cazado el 01-09-2026 y MEDIDO en producción: `completar()` decide a
     quién pedir cada campo con `modeloDato()`, que lee `f._modelo`… y
     ese sello se ponía DESPUÉS (línea de abajo), así que durante la
     carga leía el modelo de la carga ANTERIOR. Efecto medido al cambiar
     de ECMWF a AROME en Bermeo: el agua se quedaba en la de AROME —el
     dueño se filtraba a sí mismo por creerse «el cargado»— y la
     probabilidad venía de ICON en vez del europeo. Con recarga limpia
     salía bien, así que solo fallaba cuando él toca el selector, que es
     precisamente cuando está comparando modelos. Hoy en Bermeo eran
     0,1 y 0,3 mm de diferencia a las 08:00 y 09:00: sus milímetros. */
  f._modelo = modeloUsado;
  await completar(f, p);
  /* Y otra vez después del reparto: lo prestado viene de otro modelo y
     ese también puede traer basura. */
  f.imposibles = [...(f.imposibles || []), ...sanear(f.hourly)];
  /* Y lo que el modelo elegido no alcanza, lo pone el que llega. Suyo:
     «en 2 días al menos tenemos lo bueno». Va después de `completar()`
     para no pisar lo que ese ya haya rellenado. */
  await completarLargo(f, p);
  // El dato se lleva grabado DE QUÉ MODELO salió. Ojo: puede no ser el
  // elegido — si el modelo de área limitada no cubre el punto, arriba se
  // cae al automático. Sin este sello, la ficha ponía un nombre y
  // enseñaba números de otro modelo, y nada lo decía.
  await pedirCerca(f, p, base);
  /* Y la cota del terreno, que se saca de sus coordenadas y no hay que
     pedírsela a él. Va sin `await`: si tarda o falla, la app no espera. */
  cotaAutomatica(p).then(m => { if (has(m) && S.data) seguro('torre', renderTower); });
  return { fc: f, aq: a, mar: m, at: Date.now() };
}

/* Y NI EL DE AL LADO ES LA VERDAD. En un sitio de costa, el nudo más
   cercano suele caer SOBRE EL AGUA —en BI BERMEO está en 43,50/−2,75,
   nueve kilómetros mar adentro— y sobre el agua el CAPE se dispara por
   la tarde. Cambiar el nudo de tierra por el de mar no es pasar de un
   error a un acierto: es pasar de un sesgo al contrario.

   Por eso se enseñan los dos y se avisa, en vez de sustituir uno por
   otro. Lo apuntó la sesión de comparativas y lo comprobé: el valor que
   da AguaceroWx en el pueblo cae JUSTO ENTRE los dos (GFS en Bermeo a
   las 17:00: tierra 100 · AguaceroWx 349 · mar 550). */
function avisoNudoAgua() {
  const p = S.place;
  if (!p || typeof cercaDelMar !== 'function' || !cercaDelMar(p)) return '';
  return ' Y el de al lado, en un sitio pegado al mar, cae normalmente <b>sobre el'
       + ' agua</b>, donde el CAPE se dispara por la tarde: <b>tampoco es la verdad</b>.'
       + ' Lo de tu punto está entre los dos.';
}

function textoAguaLejos(f, L) {
  const C = f?._cerca; if (!C) return '';
  const h = new Date(L.hora);
  const hh = String(h.getHours()).padStart(2, '0') + ':00';
  return `<div class="elev__cerca">
    <b>Ojo al punto que se está leyendo.</b>
    ${esc(modeloDato().name)} lee este emplazamiento <b>a ${kmTxt(C.km)} km</b>,
    y a <b>${kmTxt(C.kmCerca)} km</b> —encima del sitio— el mismo modelo da
    <b>${mmTxt(L.mm)} mm a las ${hh}</b>, y aquí
    ${has(L.mmT) ? `solo ${mmTxt(L.mmT)} mm` : 'no hay dato'}.
    <span class="elev__cerca__n">El agua que ve el modelo en TU punto no es la
    que sale en la ficha, que viene del nudo de tierra. Y el sirimiri moja aunque
    no marque en el pluviómetro.</span>
  </div>`;
}

/* ¿Y el agua? Mismo problema, y para él pesa más que el CAPE: con
   sirimiri no sube. Se cuenta cuando al lado hay agua de la que avisa y
   aquí no llega ni a eso. */
function aguaCeldaLejos(f, ahora = Date.now()) {
  const C = f?._cerca; if (!C?.hourly?.time || !C.hourly.precipitation) return null;
  const H = f.hourly; if (!H?.time || !H.precipitation) return null;
  const listón = S.thr?.rainWarn ?? 0.2;
  let peor = null;
  for (let i = 0; i < C.hourly.time.length; i++) {
    const t = new Date(C.hourly.time[i]).getTime();
    if (t < ahora - 36e5 || t > ahora + 12 * 36e5) continue;
    const mm = C.hourly.precipitation[i];
    if (!has(mm) || mm < listón) continue;
    const j = H.time.indexOf(C.hourly.time[i]);
    const mmT = j >= 0 ? H.precipitation[j] : null;
    if (has(mmT) && mmT >= listón) continue;      // aquí también avisa: nada nuevo
    if (!peor || mm > peor.mm) peor = { mm, mmT, hora: C.hourly.time[i] };
  }
  return peor;
}

/* Y esto es lo que se le enseña. Va DEBAJO del «dónde lee de verdad»,
   que es donde ya está mirando cuando se pregunta por qué su app y
   AguaceroWx no dicen lo mismo. */
function textoCeldaLejos() {
  const f = S.data?.fc;
  const A = typeof avisoCeldaLejos === 'function' ? avisoCeldaLejos(f) : null;
  const L = typeof aguaCeldaLejos === 'function' ? aguaCeldaLejos(f) : null;
  if (!A && L) return textoAguaLejos(f, L);
  if (!A) return '';
  const h = new Date(A.hora);
  const hh = String(h.getHours()).padStart(2, '0') + ':00';
  const alli = has(A.capeT)
    ? `aquí sale <b>CAPE ${Math.round(A.capeT)}</b>${has(A.cinT) ? ` con la tapa en ${Math.round(A.cinT)}` : ''}`
    : 'aquí no hay dato';
  const loDeAlLado = A.seguro
    ? `<b>CAPE ${Math.round(A.cape)} con la tapa en ${Math.round(A.cin)}</b> a las ${hh},
       que es la combinación que rompe`
    : `<b>CAPE ${Math.round(A.cape)}</b> a las ${hh}. La tapa ahí no la publica este
       modelo, así que <b>no se puede decir si rompería</b> — pero la gasolina está`;
  return `<div class="elev__cerca">
    <b>Ojo al punto que se está leyendo.</b>
    ${esc(modeloDato().name)} lee este emplazamiento <b>a ${kmTxt(A.km)} km</b>,
    y a <b>${kmTxt(A.kmCerca)} km</b> —encima del sitio— el mismo modelo da
    ${loDeAlLado}. En cambio ${alli}.
    <span class="elev__cerca__n">No se cambia ningún número de la ficha: lo de
    superficie sale de la celda de tierra, que es la que toca para un sitio en
    tierra.${avisoNudoAgua()} Esto es lo que explica que AguaceroWx o Windy te
    den otra cifra: ellos interpolan en el punto, que suele caer entre los dos
    nudos.</span>
  </div>`;
}

/* ── LA CELDA DE AL LADO ─────────────────────────────────────────────
   Cuando el nudo de tierra se va a más de 8 km, se pide TAMBIÉN el nudo
   más cercano al emplazamiento —aunque caiga sobre agua— y solo para lo
   que decide la tormenta.

   Los 8 km no son nuevos: es el mismo listón con el que la ficha ya
   pinta en ámbar el «dónde lee de verdad». Aquí se usa el mismo, para
   no tener dos criterios de «lejos» en la misma pantalla.

   NO SE SUSTITUYE NADA. Lo de superficie sigue saliendo de la celda de
   tierra, que es la que corresponde a un sitio en tierra. Esto solo
   sirve para poder DECIR que a dos kilómetros hay otra cosa. El
   desacuerdo es la información; taparlo es lo que hicimos sin querer
   durante seis días.                                                  */
const CELDA_LEJOS_KM = 8;

async function pedirCerca(f, p, base) {
  f._cerca = null;
  if (!f?.latitude || !f?.longitude) return;
  const km = kmEntre({ lat: p.lat, lon: p.lon }, { lat: f.latitude, lon: f.longitude });
  if (!(km >= CELDA_LEJOS_KM)) return;          // el nudo ya está encima: nada que contar
  try {
    const c = await jget(API.fc, {
      ...base, cell_selection: 'nearest', forecast_days: 2, past_hours: 1,
      /* Y la lluvia. Medido el 27-08-2026: en BI BERMEO con ECMWF, la
         app enseñaba 1,2 mm en 48 h (nudo a 18 km) y el mismo modelo da
         3,3 mm EN Bermeo (nudo a 10 km). Casi tres veces más agua, y en
         la dirección peligrosa: **con sirimiri él no sube a mástil ni a
         torre**, así que enseñar menos agua de la que el modelo ve en su
         sitio es el error que no se puede cometer. */
      hourly: 'cape,convective_inhibition,precipitation',
      models: f._modelo === 'best_match' ? 'best_match' : model().om,
    }, { timeout: 9000 });
    if (!c?.hourly?.time) return;
    const kmC = kmEntre({ lat: p.lat, lon: p.lon }, { lat: c.latitude, lon: c.longitude });
    /* Si el «más cercano» es el mismo nudo, no hay nada que comparar. */
    if (kmC >= km - 0.5) return;
    f._cerca = { km, kmCerca: kmC, hourly: c.hourly,
                 lat: c.latitude, lon: c.longitude };
  } catch { f._cerca = null; }   // opcional: si falla, la app sigue igual
}

/* Lo que hay que decirle, si es que hay algo. Devuelve null cuando el
   nudo de al lado NO cambia la decisión — no se llena la pantalla de
   avisos que no mueven nada. */
/* `ahora` se puede inyectar: sin eso las pruebas dependen de la hora a la
   que se ejecuten y empiezan a fallar solas por la tarde. Ya pasó el
   26-08 con `ventanaParte`, y me volvió a pasar hoy con esta misma. */
function avisoCeldaLejos(f, ahora = Date.now()) {
  const C = f?._cerca; if (!C?.hourly?.time) return null;
  const H = f.hourly; if (!H?.time) return null;
  let peor = null;
  for (let i = 0; i < C.hourly.time.length; i++) {
    const t = new Date(C.hourly.time[i]).getTime();
    if (t < ahora - 36e5 || t > ahora + 12 * 36e5) continue;
    const cape = C.hourly.cape?.[i], cin = C.hourly.convective_inhibition?.[i];
    if (!has(cape)) continue;
    if (cape < CAPE_COMBINACION) continue;

    /* ¿Y qué decía el nudo de tierra a esa misma hora? */
    const j = H.time.indexOf(C.hourly.time[i]);
    const capeT = j >= 0 ? H.cape?.[j] : null, cinT = j >= 0 ? H.convective_inhibition?.[j] : null;

    /* DOS MOTIVOS PARA CONTARLO, y el segundo lo añadí después de
       comprobar el primero contra datos de verdad:

       1. LA COMBINACIÓN ENTERA al lado y no aquí. Lo evidente.

       2. LA MISMA GASOLINA, MUCHÍSIMA MÁS. Con solo el motivo 1 esto no
          habría saltado NUNCA con ECMWF —que es el modelo del caso que lo
          originó— porque **ECMWF no publica la tapa**: 0 horas de 24,
          medido. Se quedaba callado justo en Bermeo con 1.110 J/kg a dos
          kilómetros. Así que si al lado hay gasolina de sobra y aquí
          TRES VECES MENOS, se dice — y se dice **sin afirmar que vaya a
          romper**, porque sin la tapa eso no se puede saber. */
    const combinaAlLado = has(cin) && cin < 75;
    const combinaAqui   = has(capeT) && has(cinT) && capeT >= CAPE_COMBINACION && cinT < 75;
    /* Y el «solo gasolina» vale ÚNICAMENTE cuando la tapa de al lado no se
       sabe. Si se sabe y está PUESTA, no hay riesgo y avisar sería ruido —
       lo cazó una prueba anterior al meter este segundo motivo. */
    const tapaPuestaAlLado = has(cin) && cin >= 75;
    const muchoMas = has(capeT) && capeT < CAPE_COMBINACION
                  && cape >= capeT * 3 && !tapaPuestaAlLado;

    if (combinaAqui) continue;                    // la app ya lo avisa: no se repite
    if (!combinaAlLado && !muchoMas) continue;

    if (!peor || cape > peor.cape)
      peor = { cape, cin: has(cin) ? cin : null, capeT, cinT,
               hora: C.hourly.time[i], seguro: combinaAlLado };
  }
  return peor ? { ...peor, km: C.km, kmCerca: C.kmCerca } : null;
}

/* ---------- Campos que el modelo elegido no publica ─────────────────
   AROME HD es el mejor para el viento en estos montes, pero NO publica
   estado del cielo, nubosidad, presión, visibilidad ni UV: llegan todos
   a null. Cuatro «sin dato» seguidos en la pantalla principal parecen
   una avería, y además le quitan al usuario información que existe.

   Solución, la misma que en los mapas: se traen del modelo automático y
   se DICE de dónde vienen. Nunca se rellena en silencio.

   Solo se pide lo que falta de verdad, y en una sola petición extra.  */

const NOMBRES_COMPL = {
  weather_code: 'estado del cielo', cloud_cover: 'nubosidad',
  surface_pressure: 'presión', pressure_msl: 'presión',
  visibility: 'visibilidad', uv_index: 'índice UV',
  convective_inhibition: 'la inhibición (la «tapa»)',
  /* Salían en crudo —«wind_speed_120m, precipitation_probability»— en la
     nota de la ficha. Él lo vio a los dos minutos de publicarlo: en su
     app no puede aparecer lenguaje de máquina. */
  wind_speed_120m: 'el viento a 120 m',
  wind_speed_180m: 'el viento a 180 m',
  precipitation_probability: 'la probabilidad de lluvia',
  cloud_cover_low: 'las nubes bajas',
  cloud_cover_mid: 'las nubes medias',
  cloud_cover_high: 'las nubes altas',
  lifted_index: 'el índice de elevación',
  /* Los del resumen diario, que son los que salen en «10 días». Sin
     estos, la nota del relleno cantaba «uv_index_max» tal cual. */
  uv_index_max: 'el índice UV',
  temperature_2m_max: 'la máxima', temperature_2m_min: 'la mínima',
  precipitation_sum: 'la lluvia del día',
  precipitation_probability_max: 'la probabilidad de lluvia',
  wind_speed_10m_max: 'el viento máximo', wind_gusts_10m_max: 'la racha máxima',
  freezing_level_height: 'el isocero',
  snowfall: 'la nieve caída', snow_depth: 'la nieve en el suelo',
};

/* ═══ QUIÉN PUBLICA CADA COSA — MEDIDO, NO ESCRITO A MANO ═══════════
   Suyo, 30-08-2026: *«estos arreglos que no sean de un día y luego se
   quede cojo, que lo haga el automatismo»* · *«si no, un cambio y no nos
   enteramos»* · *«y en cada capa o sección: en Ahora, Torre, Mis torres
   etc. Si no... no valdrá»*.

   Las tres cosas, y las tres tenían razón:

     1. Aquí había una TABLA A MANO. Repartía diez campos y se dejaba
        cinco cayendo al Automático —el modelo que él quiso quitar—.
     2. Si un modelo cambia lo que publica, nadie se entera.
     3. Y el reparto valía para «Ahora» y «Torre», pero «Mis torres»
        pedía TODO al Automático (`models: 'best_match'`).

   Ahora no hay tabla: `COBERTURA` la escribe `medir-cobertura.cjs`
   preguntando a los siete modelos qué publican de verdad, en dos sitios,
   y avisa de lo que cambie. Corre en cada publicación y en la tarea
   diaria. `quienLoMide()` es el ÚNICO reparto, y lo usan las tres
   pantallas.

   ─── NO TOCAR A MANO DE AQUÍ ─── generado por medir-cobertura.cjs ───*/
const COBERTURA = {
  "temperature_2m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "apparent_temperature": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "relative_humidity_2m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "dew_point_2m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "precipitation": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "precipitation_probability": [
    "best_match",
    "icon_seamless",
    "ecmwf_ifs025",
    "gem_seamless",
    "gfs_seamless"
  ],
  "weather_code": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "cloud_cover": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "cloud_cover_low": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "cloud_cover_mid": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "cloud_cover_high": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "visibility": [
    "best_match",
    "icon_seamless",
    "knmi_harmonie_arome_europe",
    "gfs_seamless"
  ],
  "wind_speed_10m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "wind_speed_80m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "wind_speed_120m": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "wind_speed_180m": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "knmi_harmonie_arome_europe"
  ],
  "wind_direction_10m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "wind_direction_80m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "wind_gusts_10m": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "snowfall": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "knmi_harmonie_arome_europe",
    "gem_seamless",
    "gfs_seamless"
  ],
  "snow_depth": [
    "best_match",
    "icon_seamless",
    "ecmwf_ifs025",
    "gem_seamless",
    "gfs_seamless"
  ],
  "cape": [
    "best_match",
    "meteofrance_arome_france_hd",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "gem_seamless",
    "gfs_seamless"
  ],
  "lifted_index": [
    "best_match",
    "gfs_seamless"
  ],
  "convective_inhibition": [
    "best_match",
    "icon_seamless",
    "gfs_seamless"
  ],
  "freezing_level_height": [
    "best_match",
    "icon_seamless",
    "gfs_seamless"
  ],
  "surface_pressure": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "gem_seamless",
    "gfs_seamless"
  ],
  "pressure_msl": [
    "best_match",
    "icon_seamless",
    "meteofrance_arpege_europe",
    "ecmwf_ifs025",
    "gem_seamless",
    "gfs_seamless"
  ],
  "uv_index": [
    "best_match",
    "gfs_seamless"
  ]
};

/* Hasta dónde llega cada uno, medido en Miami. El rebote cuando
   el modelo cargado no cubre el punto sale de aquí, no de una línea
   escrita a mano: él se va a Calpe, a Gijón, y habló de Miami y Brasil. */
const GLOBALES = [
  "best_match",
  "icon_seamless",
  "ecmwf_ifs025",
  "gem_seamless",
  "gfs_seamless"
];
/* ─── HASTA AQUÍ ────────────────────────────────────────────────────

   EL ORDEN SALE DE SU MARCADOR, no de la fama del modelo. Medido contra
   sus estaciones, error de racha y veces que se queda corto:

       AROME HD  5,6 km/h · corto 1 de 23   ← el suyo, el que lleva viento
       ICON      7,0      · corto 4
       ARPEGE    8,6      · corto 4
       ECMWF    10,3      · corto 4
       GEM      10,2      · corto 7
       GFS      14,8      · corto 11 de 22  ← el último, y a propósito

   HARMONIE va detrás de ICON aunque empate con ARPEGE: cubre menos sitio
   —falló en Calpe al medir— y un modelo que no llega a donde él va de
   vacaciones no puede ser el segundo de la fila. */
/* ═══ ELEGIDO POR ACIERTO — LA LLUVIA ES DEL EUROPEO ═════════════════
   Decisión SUYA, 30-08-2026, con el episodio aún fresco: *«si el europeo
   está ganando en lluvia, que ese modelo marque siempre la lluvia»* ·
   *«y en todas las capas: en Torres, Ahora y en Mis torres»* ·
   *«adelante»* · *«necesito que acierten sobre todo si va a llover o no
   para poder subir a las torres»*.

   NO es reparto por publicación —AROME sí publica la lluvia—: es una
   ELECCIÓN por acierto, y la app la dice en pantalla con ese nombre.

   La base, medida y en data/campo.md:
     · 26-08, 19:00, Bermeo: lloviznaba de verdad y SOLO ECMWF la vio
       (fijado en pruebas.js desde entonces).
     · 30-08, Bermeo: gotitas a las 12:30 y sirimiri de 14:00 a 15:30,
       contado por él desde la calle. ECMWF: 0,2 subiendo a 0,4 justo al
       apretar. Los otros SIETE: cero. Y los pluviómetros: cero también
       —el sirimiri no llena el cubilete—, con la humedad al 91 %.

   Dos casos no son estadística. Por eso el marcador de lluvia sigue
   contando (con la regla del cero saturado del 30-08): cuando tenga
   muestras de sobra, se le enseñan y ÉL decide si esto se queda o se
   cambia. Hasta entonces, manda su criterio con lo medido delante.

   El respaldo es el de siempre: si ECMWF un día no contesta,
   `repartirConRespaldo` pasa al siguiente de la fila y lo dice. */
/* ── EL CIELO NO SE LE PIDE AL AUTOMÁTICO ────────────────────────────
   Suyo, 30-08-2026, al ver el aviso naranja con el Automático puesto:
   *«pues si con esa no pasa, ya sabes»*.

   Y el porqué está medido dos veces: el Automático no es un modelo, es
   una COSTURA de modelos —coge para cada hora el que le pilla—, y sus
   nubes se contradicen entre sí. El 28-08 dio 100 % con el cielo azul y
   0 % con el cielo tapado; hoy, un total del 91 % con la capa baja al
   100 %, que es aritméticamente imposible. Con AROME o ICON puestos eso
   no pasa, porque cada uno cuadra consigo mismo.

   Así que cuando el cargado es el Automático, el cielo entero —código,
   total y las tres capas— se pide al dueño del reparto (ICON) y PISA lo
   suyo, igual que hace AROME. La nota de la ficha lo cuenta. */
const CIELO_NO_DEL_AUTOMATICO = [
  'weather_code', 'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
];

/* ── EL CIELO ENTERO, DE UN SOLO DUEÑO ───────────────────────────────
   Suyo, 02-09-2026, con la caja de nubosidad fotografiada:

     «El total y las capas son de ECMWF» · «bajas 0 % · medias 0 % ·
      altas 13 %» · «⚠ estos dos números no cuadran»

   Tenía AROME cargado. AROME **no publica el total** pero **sí las tres
   capas**, así que el total se pedía prestado al europeo y las capas se
   quedaban en AROME: total 0 % y una capa al 13 % en la misma caja. La
   app lo cantaba en un aviso en vez de no hacerlo.

   Esta regla existía solo para el Automático. Ahora vale para todos: si
   el modelo cargado no publica el TOTAL, el cielo entero —capas
   incluidas— se le pide al mismo prestamista. Una caja, un dueño.

   Y el Automático sigue en la lista aunque desde hoy SÍ publique el
   cielo: es la razón medida del 28-08 —100 % de nubes con el cielo azul
   y seis de siete modelos entre 0 y 6— y no la borra que ahora esté
   medido. Es su propia mezcla, no un modelo.                          */
/* ── EL AUTOMÁTICO NO DECIDE: REPARTE ────────────────────────────────
   Suyo, 02-09-2026, después de tres explicaciones mías que no cuadraban
   entre sí:  *«pues para eso quita el auto, es que me lías»* · *«o pon
   que el auto haga lo del recuadro de antes»*.

   El recuadro decía: con el Automático, el cielo del europeo y el viento
   y el CAPE de AROME. Y era MENTIRA por dos motivos que salieron al
   medirlo:

     1. `data/cobertura.json` no tenía medido al Automático —el medidor
        preguntaba a siete modelos y el selector enseñaba ocho— así que
        la tabla decía que no publica nada. Eso ya está arreglado.
     2. Y aunque lo hubiera tenido, daba igual: la racha, el viento, la
        lluvia y el CAPE **no están en `COMPLEMENTOS`**, o sea que no se
        piden fuera NUNCA. Siempre son del modelo cargado. Con el
        Automático puesto, su racha era del Automático.

   Ahora sí hace lo del recuadro. Y la razón no es que él lo dijera: es
   que el Automático **no es un modelo**. Open-Meteo elige por horas y
   cambia solo, sin avisar. Contra su estación está medido AROME —5,5
   km/h de error de racha en 178 muestras— y el Automático no está medido
   contra nada, porque no se puede medir algo que cambia de identidad.

   Con esto, elegir «Automático» pasa a ser lo mismo que elegir AROME HD
   para lo que decide, y el cielo del europeo. Que es lo que él entendió
   y lo que quiere ver.                                                 */
const LO_QUE_DECIDE = [
  'wind_gusts_10m', 'wind_speed_10m', 'wind_direction_10m',
  'precipitation', 'cape',
];
function repartirTodo(cargado) {
  if (cargado !== 'best_match') return [];
  /* TODO, no solo lo de arriba. La segunda pasada del 02-09-2026 —él:
     *«revisas 2 veces que no tengas fallos y que tras los cambios lo de
     los modelos no vaya todo al garete»*— cazó que **la tapa se quedaba
     en el Automático**: `convective_inhibition` está en `COMPLEMENTOS`,
     que solo se piden fuera cuando FALTAN, y desde que el Automático se
     mide ya no falta. La tapa con el CAPE es la pareja que decide si
     rompe: no puede salir del único modelo que cambia solo. */
  return [...new Set([...LO_QUE_DECIDE, ...COMPLEMENTOS])];
}

function cieloQueSePresta(cargado) {
  if (cargado !== 'best_match' && COBERTURA.cloud_cover?.includes(cargado)) return [];
  return CIELO_NO_DEL_AUTOMATICO.filter(k => COBERTURA[k]?.some(om => om !== cargado));
}

/* ── COMO WINDY: MANDA EL MODELO QUE ÉL ELIJA ────────────────────────
   Suyo, 02-09-2026, después de comparar su app con Windy toda la tarde:
   *«yo quiero como windy»* · *«sí»*.

   Y la diferencia era ésta: **Windy no reparte**. Eliges ECMWF y todo el
   pronóstico es de ECMWF. Aquí había un reparto por acierto que PISABA
   su elección — el agua y el cielo iban al europeo aunque tuviera puesto
   AROME— y eso, por bien medido que estuviera, es la app decidiendo por
   detrás sin que él lo vea.

   **Ahora manda el modelo que él tenga puesto en todo lo que ese modelo
   publique.** Lo que no publique se sigue pidiendo prestado —no hay otra:
   ningún modelo publica los catorce campos— y se dice de quién viene, que
   es lo que ya hacía «no la publica».

   Y el préstamo va por `ORDEN_FIABLE`, que desde hoy pone al europeo el
   segundo por lo medido contra el satélite. Así que con el Automático
   puesto —AROME, que no publica el cielo— el cielo sale del europeo
   igual que antes, pero **por la puerta de delante y dicho**, no por un
   reparto invisible.

   LO QUE SE PIERDE, Y HAY QUE SABERLO: las dos decisiones que se tomaron
   midiendo —el agua al europeo el 30-08 y el cielo el 02-09— dejan de
   imponerse. Si él pone un modelo que da mal el agua, verá ese agua. Es
   lo que ha pedido, y es coherente con su regla de siempre: *«vosotros
   con ponerme los datos me sobra, el resto es cosa mía»*.

   Si algún día quiere volver al reparto, se rellena este objeto otra vez
   y todo lo demás sigue funcionando: `quienLoMide` lo mira primero. */
const ELEGIDO_POR_ACIERTO = {};

/** De quién sale la serie de lluvia QUE SE VE: el elegido si la
 *  cobertura medida lo confirma; si no, el modelo cargado. Una sola
 *  respuesta para textos, avisos y exclusiones — nunca a mano. */
function duenoLluvia() {
  const e = ELEGIDO_POR_ACIERTO.precipitation;
  return (e && COBERTURA.precipitation?.includes(e)) ? e : (modeloDato()?.om ?? e);
}

/* ── A QUIÉN SE LE PIDE LO QUE EL TUYO NO PUBLICA ──────────────────
   El orden lo decide lo MEDIDO, no la finura de la malla. Cambiado el
   02-09-2026: ICON estaba en segundo lugar y el marcador del cielo de
   ese día —15 horas contra el satélite— le da **33 % de fallos gordos**
   (confundir despejado con nuboso o peor), contra **0 % de ECMWF**.

   Con AROME cargado —que es lo que da el Automático aquí— el cielo se
   presta SIEMPRE, porque AROME no lo publica. Así que ese segundo puesto
   no es un detalle: es de quién sale el cielo que él ve casi todos los
   días.

   AROME sigue el primero por su malla de 1,3 km, que en sus montes es lo
   que lee su punto de verdad. */
const ORDEN_FIABLE = [
  'meteofrance_arome_france_hd', 'ecmwf_ifs025', 'meteofrance_arpege_europe',
  'icon_seamless', 'gfs_seamless', 'knmi_harmonie_arome_europe', 'gem_seamless',
];

/** A quién se le pide un campo que el modelo cargado no publica.
 *  Devuelve null si no lo publica NADIE: entonces se queda el hueco, que
 *  es la verdad, y no un número inventado. */
function quienLoMide(campo, salvo) {
  const puede = COBERTURA[campo];
  if (!puede?.length) return null;
  /* El elegido por acierto manda, salvo que sea justo el que se ha
     caído (`salvo`): entonces el respaldo sigue la fila normal. */
  const e = ELEGIDO_POR_ACIERTO[campo];
  if (e && e !== salvo && puede.includes(e)) return e;
  /* El cielo que deja el Automático va ENTERO a un solo modelo: el
     dueño del TOTAL. Si el total fuera de ICON y las capas de AROME
     —que es lo que daría la fila normal— volveríamos a la mezcla de
     dos modelos en el mismo renglón que acabamos de matar. */
  /* ── EL CIELO ENTERO, A UN SOLO DUEÑO ─────────────────────────────
     Esto valía SOLO para el Automático. Y el 02-09-2026 él fotografió
     la caja de nubosidad con AROME cargado:

       «El total y las capas son de ECMWF» · «Por capas: bajas 0 % ·
        medias 0 % · altas 13 %» · «⚠ estos dos números no cuadran»

     El total salía de ECMWF —AROME no lo publica— y las tres capas de
     AROME, que sí las publica. Total 0 % y una capa al 13 %: imposible,
     y la propia app lo cantaba en un aviso en vez de no hacerlo.

     Así que la regla deja de ser del Automático y pasa a ser de todos:
     **si el modelo cargado no publica el total, el cielo entero se le
     pide al mismo prestamista**, capas incluidas. Un solo dueño por
     caja. Es lo mismo que él pidió para las pestañas: *«los iconos lo
     mismo, que en uno ponga sol y en el otro nubes»*.                  */
  if (CIELO_NO_DEL_AUTOMATICO.includes(campo)
      && !COBERTURA.cloud_cover?.includes(salvo)) {
    const duenoTotal = ORDEN_FIABLE.find(om =>
      om !== salvo && COBERTURA.cloud_cover?.includes(om));
    if (duenoTotal && puede.includes(duenoTotal)) return duenoTotal;
  }
  return ORDEN_FIABLE.find(om => om !== salvo && puede.includes(om)) || null;
}

const COMPLEMENTOS = [
  /* LAS TRES CAPAS VAN CON EL TOTAL, y esto lo cazó la segunda pasada
     del 29-08-2026 antes de publicar —él insiste: *«en la segunda
     revisión se buscan los fallos»*—.

     Estaban fuera de esta lista, así que con AROME por defecto el TOTAL
     se habría pedido a ICON y **las capas se habrían quedado siendo de
     AROME**: dos modelos en la misma fila. Es el mismo fallo que se
     arregló la noche del 28 con ECMWF, entrando por otra puerta.

     Van juntas o no van: son el mismo dato mirado por partes. */
  'weather_code', 'cloud_cover',
  'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
  'surface_pressure', 'pressure_msl',
  'visibility', 'uv_index',
  // Las tres de tormenta. ECMWF de 25 km —el modelo por defecto— NO las
  // publica, así que la ficha de Torre enseñaba «sin dato» justo en lo
  // que más falta hace para decidir:
  //
  //   · inhibición  = la TAPA. Con CAPE alto, es lo único que separa
  //                   "hay gasolina" de "va a romper". El 23-08-2026,
  //                   Bermeo tenía tapa de 130-141 y no cayó nada;
  //                   Durango y Amorebieta la tenían a 0 y descargaron.
  //   · índice de elevación = lo mismo por otro camino.
  //   · isocero     = dónde está la cota de 0°, para el hielo.
  //
  // Desde el 29-08-2026 NO se traen del automático: cada uno se le pide
  // al que lo publica de verdad —la tapa y el índice, a ICON—. Ver
  // `QUIEN_LO_MIDE`. Y la app dice de quién es cada cifra, con su nombre.
  'convective_inhibition', 'lifted_index', 'freezing_level_height',
  /* ── Y LO QUE AROME NO DA Y HACE FALTA ─────────────────────────────
     Cazado en la segunda pasada del 29-08-2026, al poner AROME por
     defecto. AROME no publica **el viento a 120 ni a 180 m** ni la
     **probabilidad de lluvia**, y ninguno de los tres estaba aquí:

       · sin 120 m, **la línea del dron desaparecía** — la que se montó
         esa misma tarde, porque 120 m es su techo de vuelo;
       · sin la probabilidad, las tarjetas de Horas salían con el hueco.

     Se piden a ICON, como lo demás, y **el perfil dice de quién es cada
     nivel**: mezclar alturas de dos modelos sin decirlo sería el mismo
     fallo de las nubes con otra ropa. */
  'wind_speed_120m', 'wind_speed_180m', 'precipitation_probability',
  /* Y el 80 m, que el 29-08 se quedó fuera al meter 120 y 180: con
     ECMWF el perfil enseñaba «80 m sin dato» teniendo ICON el dato
     (su pantallazo del 30-08 a las 21:11). Con la dirección, para que
     la tarjeta de Dirección no caiga al rumbo de 10 m con un rótulo
     que dice 80. */
  /* ── LA NIEVE, cazada en la revisión del 31-08-2026 ────────────────
     AROME HD —el modelo POR DEFECTO desde el 29-08— no publica
     `snowfall` ni `snow_depth`, y ninguno de los dos estaba aquí.
     Comprobado por las dos vías (la app y api.open-meteo) el
     31-08-2026: los publican ICON, ECMWF, GFS y el Automático; AROME
     no.

     Y el hueco no se veía como hueco: `comoEstaLaPista()` suma la
     nieve en `nieveAntes` y `nieveHoy`, así que con AROME cargado los
     dos se quedaban en **0** — que en pantalla se lee «no ha nevado»,
     no «no lo sé». Es la regla 2 al revés: un hueco no puede parecer
     calma. Con esto la nieve se le pide a ICON, que sí la mide, y la
     app dice de quién es la cifra. */
  'snowfall', 'snow_depth',
  'wind_speed_80m', 'wind_direction_80m',
];

/* Quién rellena más allá del alcance del modelo elegido. ECMWF: llega a
   10 días, es global —vale en Calpe, Miami y Brasil— y en el marcador va
   por delante de GFS, que es el otro que llega tan lejos. */
const RELLENO_LARGO = 'ecmwf_ifs025';
/* Y detrás, el que recoge lo que ni siquiera el europeo publica. Medido
   el 29-08-2026 pidiendo los diez días a los cuatro: el **índice UV
   diario** no lo da AROME, ni ECMWF, ni ICON. Solo GFS. Sin esta
   segunda pasada quedaba un hueco por día, los diez, y eso es
   justo lo que él no quiere ver. */
const RELLENO_2 = 'gfs_seamless';

/* ── LO QUE NO ALCANZA EL MODELO, LO PONE OTRO ────────────────────────
   Idea suya, 29-08-2026: *«si solo llega a 2 días, el resto mete el que
   llega, pero siempre se actualizará, y en 2 días al menos tenemos lo
   bueno»*.

   Con AROME por defecto —el mejor en racha, medido— los días 3 al 10 se
   quedaban vacíos. Ahora se rellenan con ECMWF y **se marca desde qué
   hora**, para que la app pueda decirlo en pantalla. Nunca en silencio:
   eso es lo que hacía el Automático y es lo que él quitó hoy.

   Se rellena SOLO lo que falta: las 48 h buenas de AROME no se tocan. */
async function completarLargo(f, p) {
  const H = f?.hourly;
  if (!H?.time?.length) return;
  const g = H.wind_gusts_10m;
  if (!g) return;
  let ultimo = -1;
  for (let i = 0; i < H.time.length; i++) if (has(g[i])) ultimo = i;
  /* Si llega a más de 5 días, no hay nada que rellenar. */
  if (ultimo < 0 || ultimo >= H.time.length - 24) return;

  /* ── LAS CLAVES INVENTADAS NO SALEN A LA RED ──────────────────────
     Cazado el 01-09-2026 y MEDIDO en producción: `completar()` deja en
     `hourly` la clave sintética `weather_code_lluvia` (el código del
     dueño del agua, para el sirimiri). Esta función mandaba TODAS las
     claves a Open-Meteo tal cual, y esa no existe: la API contesta
     **HTTP 400 a la petición entera**, el catch de abajo se lo tragaba
     en silencio y el relleno no se hacía.

     Efecto real con AROME —el modelo de fábrica— en Bermeo:
     `rellenoDesde` a null y **OCHO de los diez días en blanco**, con el
     UV al lado (que llega por otra puerta) para que pareciera avería.
     Es la regla «vacío jamás» rota por una clave de más. */
  const campos = Object.keys(H).filter(k => k !== 'time' && !k.endsWith('_lluvia'));
  try {
    const d = await jget(API.fc, {
      latitude: p.lat, longitude: p.lon, timezone: 'auto', wind_speed_unit: 'kmh',
      hourly: campos.join(','), daily: DAILY,
      forecast_days: 10, past_hours: 1,
      models: RELLENO_LARGO,
    }, { timeout: 12000 });
    if (!d?.hourly?.time) return;

    /* Se casa por HORA, no por posición: las dos series pueden empezar en
       instantes distintos y ahí ya nos hemos equivocado otras veces. */
    const donde = new Map(d.hourly.time.map((t, i) => [t.slice(0, 13), i]));
    let puestos = 0;
    for (let i = ultimo + 1; i < H.time.length; i++) {
      const j = donde.get(H.time[i].slice(0, 13));
      if (j === undefined) continue;
      for (const k of campos) if (Array.isArray(H[k]) && d.hourly[k]) H[k][i] = d.hourly[k][j];
      puestos++;
    }
    if (puestos) f.rellenoDesde = H.time[ultimo + 1];

    /* ── Y LOS DÍAS, QUE ES DONDE MÁS SE VEÍA ────────────────────────
       Fallo mío, y lo cazó él a los dos minutos con un pantallazo de la
       pestaña «10 días»: del lunes en adelante salía **«— —, 0.0 mm,
       Racha —»**. Ocho días en blanco.

       Yo había rellenado solo `hourly`, y esa pantalla usa `daily`.
       AROME da tres días de resumen diario y ahí se acababa. Su norma,
       dicha esa misma noche: **«vacío jamás nada»**. */
    const D = f.daily;
    if (D?.time?.length && d.daily?.time?.length) {
      const claves = Object.keys(D).filter(k => k !== 'time');
      const dd = new Map(d.daily.time.map((t, i) => [t, i]));
      for (let i = 0; i < D.time.length; i++) {
        const j = dd.get(D.time[i]);
        if (j === undefined) continue;
        for (const k of claves) {
          if (!Array.isArray(D[k]) || !d.daily[k]) continue;
          /* Solo lo que falta: los días buenos de AROME no se tocan. */
          if (D[k][i] === null || D[k][i] === undefined) D[k][i] = d.daily[k][j];
        }
      }
    }

    /* ── SEGUNDA PASADA: lo que el europeo tampoco publica ───────────
       Cada dato al que lo mide, que es lo que él pidió. Solo se sale a
       la red si de verdad queda algo vacío. */
    const faltan = D?.time?.length
      ? Object.keys(D).filter(k => k !== 'time' && Array.isArray(D[k])
          && D[k].some(v => v === null || v === undefined))
      : [];
    if (faltan.length) {
      const d2 = await jget(API.fc, {
        latitude: p.lat, longitude: p.lon, timezone: 'auto', wind_speed_unit: 'kmh',
        daily: faltan.join(','), forecast_days: 10, models: RELLENO_2,
      }, { timeout: 12000 });
      const dd2 = new Map((d2?.daily?.time || []).map((t, i) => [t, i]));
      let puestos2 = 0;
      for (let i = 0; i < D.time.length; i++) {
        const j = dd2.get(D.time[i]);
        if (j === undefined) continue;
        for (const k of faltan) {
          if (!d2.daily[k]) continue;
          if (D[k][i] === null || D[k][i] === undefined) { D[k][i] = d2.daily[k][j]; puestos2++; }
        }
      }
      if (puestos2) f.rellenoDe2 = faltan.slice();
    }
  } catch (e) {
    /* Un catch mudo escondió este fallo días enteros. Si el relleno se
       cae, se APUNTA: la pantalla podrá decir por qué está vacío en vez
       de dejar un hueco que se lee como «aquí no pasa nada». */
    f.rellenoFallo = String(e?.message || e).slice(0, 120);
    /* Y DESDE QUÉ HORA. Revisión del 04-09-2026: `rellenoFallo` lo
       escribía este catch y no lo leía nadie en todo app.js. Ahora lo
       pinta `notaRellenoFallo()` en «Ahora», y para decir «desde las X»
       hace falta la hora: la siguiente a la última con ráfaga del modelo
       cargado. Si `rellenoDesde` ya está puesto, las horas SÍ entraron y
       lo que se cayó fue la segunda pasada de los días. */
    f.rellenoFallaDesde = f.rellenoDesde ? null : H.time[ultimo + 1];
  }
}

/* La nota de «Ahora» cuando el relleno largo se ha caído. Va junto a la de
   «Algún número no era posible»: las dos cuentan por qué hay un hueco, y
   es la misma pantalla en la que el veredicto puede estar en SIN DATO por
   ese mismo hueco. Sin esto, «—» en el mosaico y nada que lo explique. */
function notaRellenoFallo(fc) {
  if (!fc?.rellenoFallo) return '';
  const d = fc.rellenoFallaDesde ? new Date(fc.rellenoFallaDesde) : null;
  const desde = d && !Number.isNaN(d.getTime())
    ? `desde ${nombreDeDia(d)} a las ${String(d.getHours()).padStart(2, '0')}:00`
    : null;
  return `<p class="det__nota det__nota--avisa">
    <b>${VT.nd}: ${desde
      ? `${esc(desde)} no se ha podido rellenar con ${esc(nombreDeModelo(RELLENO_LARGO))}`
      : `las horas sí entraron, pero los días de más allá no se han podido completar con ${esc(nombreDeModelo(RELLENO_2))}`}.</b>
    Motivo: ${esc(fc.rellenoFallo)}. Donde veas «—» o SIN DATO a partir de ahí es por esto,
    no porque no pase nada. Recarga en un rato.</p>`;
}


/* ═══ EL ÚNICO REPARTO CON RESPALDO ═══════════════════════════════════
   Suyo, 30-08-2026: *«que no tengamos que corregir esto cada día o cada
   cambio que hagamos, por favor»*.

   Y da en el clavo. El fallo de la columna de nulos estaba en DOS sitios
   —«Ahora»/«Torre» y «Mis torres»— porque la misma lógica estaba escrita
   dos veces. Mientras haya dos copias, cada arreglo hay que hacerlo dos
   veces y un día se olvida una. Ya pasó con el reparto (una pantalla
   pedía todo al Automático) y ahora con el respaldo.

   Aquí vive UNA sola vez: a quién se le pide cada campo, qué hacer si no
   contesta, y a quién se le pide entonces. Cada pantalla pone solo su
   forma de pedir y de pegar, que sí son distintas —una es un punto y la
   otra veinte—.

   `pedirYPegar(om, campos, muerto)` devuelve **los campos que NO ha
   podido cubrir**. Si devuelve vacío, ese modelo lo trajo todo.
   ═════════════════════════════════════════════════════════════════════ */

/* ═══ LO POSIBLE EN LA TIERRA — EL GUARDIA DE LA FICHA ════════════════
   Cazado el 30-08-2026 en un pantallazo suyo de Bilbao: la tabla de
   tormenta de «Torre» ponía **ECMWF −10 J/kg de CAPE**. El CAPE es
   energía disponible: por debajo de cero no hay tal cosa.

   MEDIDO en ese punto, los siete modelos y 48 h: **solo ECMWF da
   negativos, 2 horas de 48 y siempre −10**. Los otros seis, ni uno. No
   es una tormenta rara: es ruido de la interpolación alrededor del cero.

   Suyo al verlo: *«reparar esto en Torre, Ahora etc también, y
   automatizar para que no pase»*.

   Y ahí estaba el fondo: el MAPA ya tenía su guardia desde el 27-08
   —`fueraDeRango()`, puesto después de que la presión enseñara «10 hPa»
   durante tres días—. **La ficha no tenía ninguno.** El mismo guardia
   escrito en un sitio y no puesto en el otro.

   Esto se aplica **a la entrada, una sola vez**, sobre las series tal
   como llegan. Así lo tienen limpio TODAS las pantallas —Ahora, Torre,
   Mis torres, Horas, 10 días— sin que ninguna tenga que acordarse.

   DOS COMPORTAMIENTOS, y la diferencia importa:
     · **Rozando el límite** (un −10 de CAPE, un 100,4 % de humedad): es
       ruido numérico. Se pega al límite y se sigue.
     · **Lejos** (una racha de 500 km/h, una presión de 10 hPa): eso no
       es un dato, es una fuente rota. Se deja el HUECO —que la app sabe
       decir— y se apunta para cantarlo. Aplastarlo contra el límite
       sería inventarse un número, y con esto se decide si sube gente.
   ═════════════════════════════════════════════════════════════════════ */
const POSIBLE = {
  cape:                  [0, 8000],    convective_inhibition: [0, 1000],
  lifted_index:          [-20, 20],    freezing_level_height: [0, 9000],
  cloud_cover:           [0, 100],     cloud_cover_low:       [0, 100],
  cloud_cover_mid:       [0, 100],     cloud_cover_high:      [0, 100],
  relative_humidity_2m:  [0, 100],     precipitation_probability: [0, 100],
  temperature_2m:        [-60, 60],    apparent_temperature:  [-70, 70],
  dew_point_2m:          [-60, 45],
  wind_speed_10m:        [0, 300],     wind_speed_80m:        [0, 350],
  wind_speed_120m:       [0, 350],     wind_speed_180m:       [0, 350],
  wind_gusts_10m:        [0, 400],
  wind_direction_10m:    [0, 360],     wind_direction_80m:    [0, 360],
  precipitation:         [0, 200],     snowfall:              [0, 200],
  snow_depth:            [0, 20],      visibility:            [0, 200000],
  surface_pressure:      [850, 1085],  pressure_msl:          [850, 1085],
  uv_index:              [0, 20],
};

/** Cuánto se le perdona a cada campo antes de considerarlo roto. Un 5 %
 *  del recorrido, que en el CAPE son 400 J/kg y en la humedad 5 puntos:
 *  suficiente para el ruido de interpolación y muy lejos de un fallo. */
const holgura = ([a, b]) => (b - a) * 0.05;

/** Limpia UNA serie. Devuelve cuántos ha pegado al límite y cuántos ha
 *  tenido que tirar por imposibles. */
function sanearSerie(campo, arr) {
  const lim = POSIBLE[campo];
  if (!lim || !Array.isArray(arr)) return null;
  const [min, max] = lim, h = holgura(lim);
  let pegados = 0, tirados = 0, peor = null;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    if (v >= min && v <= max) continue;
    if (peor === null || Math.abs(v) > Math.abs(peor)) peor = v;
    if (v < min && v >= min - h) { arr[i] = min; pegados++; }
    else if (v > max && v <= max + h) { arr[i] = max; pegados++; }
    else { arr[i] = null; tirados++; }   // el hueco es la verdad
  }
  return (pegados || tirados) ? { campo, pegados, tirados, peor } : null;
}

/** Limpia un `hourly` entero, incluidas las columnas por modelo
 *  (`cape_ecmwf_ifs025`…), que es donde salió el −10. */
function sanear(hourly) {
  if (!hourly) return [];
  const partes = [];
  for (const k of Object.keys(hourly)) {
    if (k === 'time') continue;
    /* El nombre del campo es el trozo que coincide con POSIBLE; detrás
       puede llevar el modelo. Se busca el más largo que encaje, para que
       `cloud_cover_low_icon_seamless` no case con `cloud_cover`. */
    const campo = Object.keys(POSIBLE)
      .filter(c => k === c || k.startsWith(c + '_'))
      .sort((a, b) => b.length - a.length)[0];
    if (!campo) continue;
    const r = sanearSerie(campo, hourly[k]);
    if (r) partes.push({ ...r, columna: k });
  }
  return partes;
}

async function repartirConRespaldo(campos, cargado, pedirYPegar) {
  /* Agrupados por quién los sirve, para no hacer una petición por campo. */
  const porQuien = new Map();
  for (const k of campos) {
    /* Si NADIE lo publica, no se pide. Antes caía al Automático y así
       salía un número sin poder decir de quién era; el hueco es la
       verdad y la app ya sabe decirlo. */
    const om = quienLoMide(k, cargado);
    if (!om) continue;
    if (!porQuien.has(om)) porQuien.set(om, []);
    porQuien.get(om).push(k);
  }
  if (!porQuien.size) return;

  await Promise.all([...porQuien].map(async ([om, ks]) => {
    let faltaron;
    try { faltaron = await pedirYPegar(om, ks, null); }
    catch { faltaron = ks; }            // no contestó: todos sin cubrir

    /* Y lo que no ha venido, al siguiente de la fila EN EL ACTO. El
       reparto se mide al publicar; esperar a la próxima publicación es
       dejarle un día sin CAPE, y eso es justo lo que no puede pasar. */
    for (const k of faltaron || []) {
      for (const otro of ORDEN_FIABLE) {
        if (otro === om || otro === cargado || !COBERTURA[k]?.includes(otro)) continue;
        try { if (!(await pedirYPegar(otro, [k], om))?.length) break; }
        catch { /* ese tampoco: se prueba el siguiente */ }
      }
    }
  }));
}

async function completar(f, p) {
  if (!f?.hourly) return;
  const faltan = COMPLEMENTOS.filter(k => {
    const v = f.hourly[k];
    return !v || v.every(x => x === null || x === undefined);
  });

  /* ── Y LOS ELEGIDOS POR ACIERTO, AUNQUE EL CARGADO LOS PUBLIQUE ────
     Ver `ELEGIDO_POR_ACIERTO`. La lluvia se pide SIEMPRE a su dueño y
     PISA la del cargado: decisión suya del 30-08, con dos sirimiris
     medidos que solo el europeo vio. Se apunta como `porAcierto` para
     que la nota de la ficha lo cuente con esas palabras y no con el
     «no lo publica», que aquí sería mentira. */
  const cargadoYa = modeloDato()?.om;
  const porAcierto = new Set(Object.keys(ELEGIDO_POR_ACIERTO)
    .filter(k => k !== 'precipitation_sum')          // el diario va aparte
    .filter(k => {
      const e = ELEGIDO_POR_ACIERTO[k];
      return e && e !== cargadoYa && COBERTURA[k]?.includes(e) && !faltan.includes(k);
    }));
  for (const k of porAcierto) faltan.push(k);

  /* El cielo entero al mismo dueño. Ver `cieloQueSePresta()`. */
  for (const k of [...cieloQueSePresta(cargadoYa), ...repartirTodo(cargadoYa)]) {
    porAcierto.add(k);                         // pisa y no sale como «no lo publica»
    if (!faltan.includes(k)) faltan.push(k);
  }

  if (!faltan.length) { f.suplidas = []; return; }

  /* ── LO QUE FALTA SE PIDE AL QUE LO MIDE, NO AL AUTOMÁTICO ──────────
     Suyo, 29-08-2026, y mejora lo que yo le había propuesto: *«pues
     ponemos AROME donde acierta, y CAPE y nubes etc con los que midan,
     ¿no?»*. Sí. **Cada magnitud, del que la publica de verdad.**

     Hasta hoy todo lo que faltaba se pedía al **Automático**, y ese es
     justo el que peor ha salido esta semana: no vio el sirimiri de
     Bermeo el 26, dio 0 % de nubes con el cielo tapado el 28, y en Boiro
     el 29 daba **0,9 mm cuando ARPEGE daba 8,7 y la reportera contaba
     lluvia en directo**.

     A QUIÉN SE LE PIDE CADA COSA, Y POR QUÉ (todo medido, no supuesto):

       nubes ......... **ICON**. Publica sus capas de verdad (ECMWF no
                       las publica y las calcula Open-Meteo; AROME no da
                       ni el total: 0 horas de 168, medido en tres
                       sitios). ICON cuadra las 168 horas y fue de los
                       dos que acertaron las nubes grises del 28-08.
       la tapa ....... **ICON**. La publican ICON y GFS; ECMWF, AROME,
                       ARPEGE y GEM no. Sin tapa no se puede decir si
                       rompe la tormenta, que es su veto.
       el resto ...... el Automático, como hasta ahora.

     Y SE SIGUE DICIENDO DE DÓNDE SALE CADA CIFRA, que es su norma: la
     nota de abajo nombra al modelo prestado, no se mezcla en silencio. */
  /* El reparto y el respaldo salen de `repartirConRespaldo()`, que es la
     MISMA función que usa «Mis torres». Una sola copia, para que un
     arreglo no haya que hacerlo dos veces. */
  const cargado = modeloDato()?.om;


  /* UNA COLUMNA DE NULOS NO ES UN DATO. En JavaScript un array lleno de
     nulos es «verdadero», y aquí ponía `if (d.hourly?.[k])`: el día que
     el modelo del CAPE dejara de publicarlo, la app se tragaba el hueco
     y lo firmaba con su nombre. Suyo, 30-08-2026: *«si está muerto el
     automatismo, ala, se queda frito en la torre»*. */
  const traeAlgo = v => Array.isArray(v) && v.some(x => x !== null && x !== undefined);
  const prestados = [];

  const pedirYPegar = async (om, ks, muerto) => {
    /* El paquete de la lluvia por acierto lleva de propina el código de
       tiempo y el resumen diario DEL MISMO modelo. Ni una petición más. */
    const conAgua = ks.includes('precipitation') && porAcierto.has('precipitation');
    const d = await jget(API.fc, {
      latitude: p.lat, longitude: p.lon, timezone: 'auto', wind_speed_unit: 'kmh',
      hourly: ks.join(',') + (conAgua ? ',weather_code' : ''),
      current: ks.filter(k => k !== 'uv_index').join(','),
      daily: [ks.includes('uv_index') ? 'uv_index_max' : null,
              conAgua ? 'precipitation_sum' : null].filter(Boolean).join(',') || undefined,
      forecast_days: 10, past_hours: 1, models: om,
    }, { timeout: 12000 });

    const sinCubrir = [];
    for (const k of ks) {
      if (!traeAlgo(d.hourly?.[k])) { sinCubrir.push(k); continue; }
      f.hourly[k] = d.hourly[k];
      prestados.push({ k, de: om, porAcierto: porAcierto.has(k) || undefined });
      if (has(d.current?.[k])) { f.current ??= {}; f.current[k] = d.current[k]; }
      if (k === 'uv_index' && d.daily?.uv_index_max && f.daily) f.daily.uv_index_max = d.daily.uv_index_max;

      /* La lluvia viaja con SU código de tiempo y con SU resumen diario,
         del mismo modelo. Mezclar los milímetros de uno con la llovizna
         de otro es juntar dos modelos en un renglón — y el sirimiri se
         clasifica por código, no por milímetros. */
      if (k === 'precipitation' && porAcierto.has(k)) {
        if (traeAlgo(d.hourly?.weather_code)) f.hourly.weather_code_lluvia = d.hourly.weather_code;
        if (f.daily && traeAlgo(d.daily?.precipitation_sum)) {
          f.daily.precipitation_sum = d.daily.precipitation_sum;
          prestados.push({ k: 'precipitation_sum', de: om, porAcierto: true });
        }
      }
      /* Si este lo ha salvado, se apunta para poder DECIRLO: un rescate
         callado es tan malo como el fallo. */
      if (muerto) (f.seCayo ??= []).push({ k, muerto, salvo: om });
    }
    return sinCubrir;
  };

  try {
    await repartirConRespaldo(faltan, cargado, pedirYPegar);
    f.suplidas = prestados.map(x => x.k);
    f.prestadosDe = prestados;
  } catch { f.suplidas = []; f.prestadosDe = []; }
}

/* ---------- 7. Normalización a "horas" ---------- */

/* `place` entra desde fuera: sin él, las veinte filas del parte se
   evaluaban con `S.place` —el sitio ABIERTO— y con su comparativa.
   Cazado el 01-09-2026. */
/* ═══ UN SOLO CAMINO PARA LAS HORAS (09-09-2026) ═══════════════════
   Aitor, tras cuatro semanas de «en Ahora una cosa, en 10 días otra»:
   *«esto no puede seguir así»*. Una de las causas: «10 días» montaba sus
   horas A MANO (sin codigoAjeno, sin day, sin sitio) y las pintaba con
   otra regla. Ahora TODAS las horas de la app —Horas, Mis estaciones,
   franjas, 10 días— salen de horaDe(), y el cielo de cada una de
   cieloVisto(). Lo que no comparte camino, discrepa tarde o temprano. */
function extrasDe(fc) {
  /* ¿El dibujo es de otro modelo y los milímetros son del cargado? Es
     el caso de AROME HD (da lluvia, no da código). Ver aguaPrestada(). */
  const presta = k => (fc?.prestadosDe || []).find(x => x.k === k);
  const codigoAjeno = !!presta('weather_code') && !presta('precipitation');
  const cieloDe = presta('weather_code') ? nombreDeModelo(presta('weather_code').de) : null;
  return { codigoAjeno, cieloDe };
}

function horaDe(fc, i, height, place, extra) {
  const H = fc.hourly;
  const { codigoAjeno, cieloDe } = extra || extrasDe(fc);
  const lv = { 10: H.wind_speed_10m?.[i], 80: H.wind_speed_80m?.[i],
               120: H.wind_speed_120m?.[i], 180: H.wind_speed_180m?.[i] };
  const w  = windAt(height, lv);
  const g  = gustAt(height, H.wind_gusts_10m?.[i], lv[10], w.v);
  return {
      t: H.time[i], date: new Date(H.time[i]), h: height,
      /* El sitio de la fila, para que el voto del cielo solo use la
         comparativa de ESTE sitio y no la del abierto (06-09-2026). */
      sitio: place,
      levels: lv, wind: w.v, windExact: w.exact, alpha: w.alpha, windNote: w.note, techo: w.techo,
      w10: lv[10], gust10: H.wind_gusts_10m?.[i], gust: g.v, gustEst: !g.exact,
      gustLim: !!g.limitada,
      dir: H.wind_direction_80m?.[i] ?? H.wind_direction_10m?.[i],
      dir80: H.wind_direction_80m?.[i],
      temp: H.temperature_2m?.[i], feels: H.apparent_temperature?.[i],
      hum: H.relative_humidity_2m?.[i], dew: H.dew_point_2m?.[i],
      prec: H.precipitation?.[i], pop: H.precipitation_probability?.[i],
      code: H.weather_code?.[i], cloud: H.cloud_cover?.[i], vis: H.visibility?.[i],
      /* Las tres capas viajan con la hora: sin ellas no se puede
         distinguir el velo de cirros del techo de estratos. Ver
         `veladoSiToca()`. */
      nubesBajas: H.cloud_cover_low?.[i], nubesMedias: H.cloud_cover_mid?.[i],
      nubesAltas: H.cloud_cover_high?.[i],
      /* is_day con respaldo: Open-Meteo devuelve null en los huecos y
         null NO activa el valor por defecto de icon() — salía luna a
         mediodía. Mismo criterio 8-19 h que deDia(). Cazado 31-08. */
      /* El código DEL MODELO QUE DA LA LLUVIA (el elegido por acierto).
         El sirimiri se clasifica por código, y el del cielo es de ICON:
         el 30-08 ICON decía «cubierto» mientras el europeo decía
         «llovizna» — y la llovizna era la verdad. A partir de otoño esto
         puede ser la pauta de DOS o TRES días seguidos (suyo). */
      codeLluvia: H.weather_code_lluvia?.[i],
      codigoAjeno, cieloDe,
      cape: H.cape?.[i], li: H.lifted_index?.[i], cin: H.convective_inhibition?.[i],
      /* ── LA ALTURA DE LA NUBE, QUE LLEVABA MUERTA DESDE SIEMPRE ─────
         Cazado el 01-09-2026 en el barrido. Los dos campos se PEDÍAN a
         la API y `loQueMideLaNube()` los LEÍA de la hora… pero aquí no
         se metían nunca, así que llegaban `undefined` y la función
         devolvía cadena vacía SIEMPRE. Comprobado ejecutando el código
         real con datos de Bermeo: la API daba tope en 25 de 48 horas
         (1.070, 1.240 m…) y la app no decía ni una palabra.

         Lo que se perdía no es solo el texto del tope: también la rama
         «la nube empieza a X m, por debajo de los Y m de este sitio —
         quien suba estaría DENTRO de ella», que no podía dispararse.

         Y las cinco pruebas que este proyecto daba por guardianas
         construían la hora A MANO con los nombres crudos de la API, una
         forma que la app no produce jamás: pasaban en verde con la
         función muerta. La norma de la casa, otra vez. */
      nubeTop: H.convective_cloud_top?.[i], nubeBase: H.convective_cloud_base?.[i],
      frz: H.freezing_level_height?.[i], pres: H.surface_pressure?.[i],
      nieve: H.snowfall?.[i], nieveSuelo: H.snow_depth?.[i],
      day: has(H.is_day?.[i]) ? H.is_day[i]
           : (new Date(H.time[i]).getHours() >= 8 && new Date(H.time[i]).getHours() <= 19 ? 1 : 0),
      uv: H.uv_index?.[i],
    };
}

/* La hora EN CURSO lleva lo más fresco que publica el modelo: el código
   y las capas de `current`. Así «Ahora» y la primera tarjeta de «Horas»
   son la MISMA hora con los MISMOS datos, y no pueden discrepar. */
function conAhora(h, C) {
  if (!h || !C) return h;
  if (has(C.weather_code))     h.code        = C.weather_code;
  if (has(C.cloud_cover))      h.cloud       = C.cloud_cover;
  if (has(C.cloud_cover_low))  h.nubesBajas  = C.cloud_cover_low;
  if (has(C.cloud_cover_mid))  h.nubesMedias = C.cloud_cover_mid;
  if (has(C.cloud_cover_high)) h.nubesAltas  = C.cloud_cover_high;
  return h;
}

function buildHours(fc, height, place = null) {
  const H = fc.hourly, out = [];
  const extra = extrasDe(fc);
  const now = Date.now();
  const idx0 = Math.max(0, H.time.findIndex(t => new Date(t).getTime() + 3600e3 > now));

  for (let i = idx0; i < Math.min(idx0 + 48, H.time.length); i++) {
    const h = horaDe(fc, i, height, place, extra);
    if (i === idx0) conAhora(h, fc.current);
    out.push(h);
  }
  out.forEach(h => Object.assign(h, assess(h, S.thr, S.perfil, place ?? S.place)));
  return out;
}

/* Todas las horas de un día (AAAA-MM-DD) del sitio abierto, por el mismo
   camino. Para «10 días», que necesita más allá de las 48 h de S.data.hours. */
function horasDelDia(fc, dia) {
  const H = fc?.hourly;
  if (!H?.time) return [];
  const extra = extrasDe(fc);
  const out = [];
  for (let i = 0; i < H.time.length; i++)
    if (String(H.time[i]).startsWith(dia)) out.push(horaDe(fc, i, S.hgt, null, extra));
  return out;
}

/* ---------- 8. Render: pestaña TORRE ---------- */

const VC = { go: 'var(--go)', warn: 'var(--warn)', no: 'var(--no)', nd: 'var(--faint)' };
/* ── EL RÓTULO DESCRIBE, NO AUTORIZA ────────────────────────────────
   Cambiado el 28-08-2026 por orden suya, repetida cinco veces esa
   mañana: *«vosotros cifras»*, *«pronósticos perfectos y yo decido»*,
   *«rellena con datos, la decisión la tomo yo»*.

   Ponía **APTO / PRECAUCIÓN / NO APTO**. Eso es una autorización, y la
   autorización no es de la app: es suya. Él sabe cosas que la app no
   sabe —qué avería es, si el cuadro está dentro de la caseta, si lleva
   guantes, si puede esperar dos horas—.

   Ahora dice **qué hay**, con sus mismos colores para verlo de un
   vistazo, pero sin decir qué hacer con ello. */
const VT = { go: 'SIN NADA', warn: 'OJO', no: 'FUERTE', nd: 'SIN DATO' };

function renderTower() {
  const hrs = S.data.hours;
  if (!hrs?.length) return;
  const c = hrs[0];

  /* ── EL VEREDICTO DE TRABAJO, SOLO EN SUS SITIOS ───────────────────
     Suyo, 01-09-2026, mirando Manila y Panamá por curiosidad: *«en mis
     sitios sí, pero… ¿si voy a cenar a Santander pongo Santander y me
     dice todo eso?»*.

     Y no tiene sentido: «Algo roza tus listones · FUERTE · CAPE 1460» en
     un sitio donde no va a subir a nada es RUIDO — y el ruido es lo que
     hace que un día deje de leer el aviso que sí importa. Es la misma
     lección de las catorce horas rayadas del 25-08.

     Así que el veredicto —el semáforo, sus listones y la ventana de
     trabajo— sale en SUS emplazamientos guardados. En cualquier otro
     sitio se calla, y en su lugar va una línea diciendo por qué y cómo
     activarlo si de verdad va a trabajar ahí. El TIEMPO se sigue viendo
     entero: temperatura, lluvia, viento, tormenta, mar, mapas. Lo que se
     quita es el juicio sobre si puede subir, no el dato. */
  const suyo = !!(S.place && (S.saved || []).some(p => key(p) === key(S.place)));
  const cajaV = $('#verdict');
  if (cajaV) {
    cajaV.dataset.ajeno = suyo ? '' : 'si';
    const nota = $('#vAjeno');
    if (nota) {
      nota.hidden = suyo;
      if (!suyo) nota.innerHTML = `<b>Este sitio no es tuyo.</b> Te doy el tiempo entero, `
        + `pero no el veredicto de trabajo: tus listones son para tus emplazamientos. `
        + `Si vas a trabajar aquí, guárdalo con el <b>♥</b> de arriba y te lo doy.`;
    }
  }

  // — Selector de altura —
  /* El selector de «Qué vas a hacer» se quitó el 28-08-2026 (orden suya:
     «esto sobra, lo decido yo»). `PERFILES` sigue existiendo porque de ahí
     salen los listones con los que se compara; lo que ya no hay es que él
     tenga que elegir uno para que la app le dé un veredicto. Se usa el de
     suelo, que es lo que hace el 70 % de las veces, y **el rótulo ya no
     autoriza: describe**. */

  // La altura solo se enseña cuando significa algo. En la caseta estás en
  // el suelo: preguntar «altura de trabajo» ahí solo confunde.
  /* ── LA ALTURA SE ENSEÑA SIEMPRE ────────────────────────────────
     Cazado por él el 30-08-2026 a las 22:15, preguntando «¿en Torre?»
     para cambiarla: **el selector estaba escondido**. Solo salía con el
     perfil de subir a la torre, y ese selector de perfil se quitó el
     28-08 («esto sobra, lo decido yo»), así que en la práctica no salía
     nunca. Un ajuste que viaja entre sus dos aparatos y que él no puede
     tocar es peor que no tenerlo.

     Y es el ajuste que más le importa, dicho por él esa misma noche:
     *«yo quiero saber en la caseta el tiempo que voy a encontrarme»* ·
     *«ya calculo yo si la torre es de 30, hay otras de 20 y otras de
     60»*. A 10 m es el dato crudo del modelo, a pie de caseta.

     Lo dice el propio marcado de index.html desde el 28-08: «la altura
     de trabajo se queda, porque eso no es una decisión: es el dato con
     el que se estima el viento arriba». Pues que se vea.               */
  /* ── LA FILA DE ONCE BOTONES, FUERA ─────────────────────────────
     Suyo, 02-09-2026, señalándola con una foto:
       *«esto fuera, la altura la marca las coordenadas de la estación»*
     y luego, al ver que seguía:  *«esto dijimos fuera y más cosas»*.

     Y es mejor así, no solo más limpio: la altura NO es una propiedad de
     la pantalla, es de cada torre —«ya calculo yo si la torre es de 30,
     hay otras de 20 y otras de 60»—. Vive en «Ajustar» de cada
     emplazamiento, que ya tiene su casilla «Altura de trabajo» y se
     sincroniza entre sus dos aparatos. Una fila global que hay que
     acordarse de mover al cambiar de sitio es una trampa: se queda
     puesta la del sitio anterior.

     No se pierde nada: `S.hgt` sigue siendo el valor por defecto de los
     sitios que aún no tengan la suya puesta.                          */
  const hsel = $('#hsel'); if (hsel) { hsel.hidden = true; hsel.innerHTML = ''; }
  const hlbl = $('#hlbl'); if (hlbl) hlbl.hidden = true;

  // — Selector de modelo —
  const M = model();
  $('#msel').innerHTML =
    `<span class="msel__k">Modelo</span>` +
    MODELS.filter(m => !m.oculto || m.id === S.model)
      .map(m => `<button class="mbtn${m.id === S.model ? ' is-on' : ''}" data-m="${m.id}"
       title="${esc(m.desc)}">${m.name}${m.res ? `<i class="mbtn__d">${esc(m.res)}</i>` : ''}</button>`).join('') +
    `<span class="msel__k" style="margin-left:auto">Viento en</span>` +
    Object.entries(WU).map(([k, u]) =>
      `<button class="mbtn${k === S.wunit ? ' is-on' : ''}" data-wu="${k}">${u.lbl}</button>`).join('') +
    `<span class="msel__d">${esc(M.desc)}</span>`;

  /* El mismo selector en «Ahora», que es la pestaña que abre. Suyo:
     *«en Ahora no tengo opciones de cambiar de Automático a otro»*.
     Se clona el de Torre para que no puedan desincronizarse: uno solo
     que se pinta en dos sitios, no dos listas que mantener. */
  const ma = $('#mselAhora');
  if (ma) ma.innerHTML = $('#msel').innerHTML;

  renderElev();
  avisoNoEsTuSitio();

  // — Veredicto ahora —
  const v = $('#verdict');
  v.style.setProperty('--vc', VC[c.st]);
  $('#vBadge').className = 'verdict__badge';
  $('#vBadge').textContent = VT[c.st];
  $('#vTitle').className = '';
  $('#vTitle').textContent = {
    go:'Nada por encima de tus listones', warn:'Algo roza tus listones',
    no:'Algo por encima de tus listones', nd:'Faltan datos del modelo',
  }[c.st];
  /* ── SIN REPETIR EL TÍTULO ──────────────────────────────────────
     Suyo, 02-09-2026, con la pantalla delante: arriba «Nada por encima
     de tus listones», debajo «Nada llega a tus listones», debajo «SIN
     NADA». Tres renglones para decir lo mismo, y el de en medio lo había
     metido yo esa misma tarde intentando acortar otro.

     Cuando no pasa nada, el título ya lo dice y el semáforo también. La
     razón solo se enseña cuando dice algo que el título no: qué listón
     y con qué número.                                                  */
  const top = c.reasons.filter(r => r.s === c.st);
  const razon = (top.length ? top : c.reasons)[0];
  const repite = c.st === 'go' && /^Nada llega a tus listones$/.test(razon.txt);
  $('#vWhy').className = 'dim';
  $('#vWhy').hidden = repite;
  $('#vWhy').textContent = repite ? '' : razon.txt;

  /* — El calor dentro de la caseta ────────────────────────────────────
     Aitor lo explicó el 24-08-2026 y estaba al revés en la app: el calor
     NO le impide ir, le OBLIGA a ir. Si lo averiado es el aire
     acondicionado, la sala se calienta, y ahí dentro hay cuadros,
     rectificadores, nodos y radioenlaces que se caen por temperatura.

     Lo que la app enseña es la temperatura de la CALLE. Dentro de una
     caseta sin aire, al sol y con los equipos disipando, hay bastante
     más. No se pone un número inventado de cuánto: se dice que dentro
     estará por encima y que eso es motivo para ir, no para no ir.

     Solo en el perfil de caseta, y solo cuando el calor de fuera ya
     empieza a contar.                                                  */
  /* — ¿A qué hora? — */
  const hc = $('#vCuando');
  if (hc) {
    const C = cuandoSalir(S.data.hours);
    const trozos = [];
    if (C?.despeja) trozos.push(`<b>Se despeja a partir de las ${esc(C.despeja)}</b>`);
    else if (C && C.estadoAhora !== 'go' && C.despeja === null)
      trozos.push(`<b>Ninguna hora dentro de umbrales en 48 h</b>`);
    /* ── FUERA EL «AL EMPEZAR LA JORNADA» ─────────────────────────
       Suyo, 02-09-2026 a las 19:13, con la pantalla delante: *«en ahora
       pues mira a esta hora sigue poniendo lo de las 7am etc, pues casi
       lo mismo presente y futuro quiero saber»* · *«nada más sin líos»*.

       Esa línea salía siempre que mirara fuera de las 07:00-14:30, o sea
       casi todas las veces que abre la app por la tarde, y le daba una
       hora de MAÑANA cuando lo que quiere saber es lo de ahora y lo de
       dentro de un rato. Se cambia por los mismos cuatro tramos que Mis
       estaciones, para que las dos pantallas digan lo mismo.          */
    /* ── QUE SE LEA COMO LO QUE ES: UN RANGO DE HORAS ────────────────
       Suyo, 02-09-2026, con «21–09» en la pantalla:
         *«y lo de las horas, de qué hora, si es actual etc, que se vea
           más claro»* · *«aquí igual no me entero, el tiempo que da de
           qué hora es a qué hora»*

       «21–09» se lee como una fecha o como un número raro. Con «de 21:00
       a 09:00» no hay que descifrar nada, y la primera dice «desde
       ahora» porque es la hora en curso.                              */
    const hh = d => String(d.getHours()).padStart(2, '0') + ':00';
    /* ── CON EL DÍA, COMO EN EL RESTO DE LA APP ─────────────────────
       «21–09» lo leyó como una fecha: *«21–09. pon agosto etc»*. Eran
       las 21:00 a las 09:00. Y al enseñarle la versión con horas señaló
       el formato que la app ya usa más abajo y que sí entiende de un
       vistazo: *«miércoles 21h»* — «RÁFAGA A 10 METROS · MIÉRCOLES,
       21:00 H».

       Así que el día va cuando la franja cruza la medianoche, que es
       justo cuando «hasta las 09:00» no basta: a las nueve de la noche,
       las nueve son de mañana.                                        */
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles',
                  'jueves', 'viernes', 'sábado'];
    const hoyD = new Date().getDay();
    const cuando = d => (d.getDay() === hoyD ? '' : `${DIAS[d.getDay()]} `) + hh(d);
    /* La PRIMERA franja no repite el estado: el semáforo grande de al
       lado ya lo dice, y salía dos veces —suyo, 02-09-2026: *«sin nada,
       sin nada, 2 veces»*—. Las siguientes sí lo llevan, porque ahí es
       donde cambia y es lo único que las distingue. */
    const franjas = franjasDeEstado(S.data.hours);
    const fr = franjas.map((f, i) => {
      const fin = new Date(f.fin.getTime() + 36e5);
      const cab = i === 0 ? 'ahora hasta' : `de ${cuando(f.ini)} a`;
      const et = (i === 0 && f.st === c.st) ? ''
        : ` <b data-s="${f.st}">${VT[f.st]}</b>`;
      return `${cab} ${cuando(fin)}${et}`;
    });
    if (fr.length) trozos.push(fr.join(' · '));
    /* ── Y LAS CIFRAS DE AHORA Y DE DENTRO DE UN RATO ────────────────
       Suyo, 02-09-2026:  *«no lo veo en Ahora y Mis torres, el tiempo
       que sale ¿de qué es, actual? Y si quiero en 2 horas saber, ¿dónde
       está esa opción? No la busco, disculpa»*.

       En Mis estaciones ya estaba —ahora · +1 h · +2 h · +4 h con sus
       cifras— pero en Ahora solo salían las franjas de estado, que dicen
       si algo cruza sus listones pero no CUÁNTO. Y no hay que buscarlo
       en ningún sitio: si hay que preguntar dónde está una opción, la
       opción sobra y el dato tiene que estar puesto.

       Las mismas cuatro horas y la misma función, para que las dos
       pantallas digan lo mismo.                                       */
    /* ── UNA LÍNEA, NO CUATRO ────────────────────────────────────────
       Primera versión: cada tramo con racha, mm, grados y CAPE. En la
       caja del veredicto eso caía en tres renglones por tramo —doce en
       total— y él lo cortó en cuanto lo vio: *«se lía»*.

       Lo que cambia de una hora a otra y le hace decidir es **la
       racha**. Los mm y el CAPE de la hora en curso ya están abajo, en
       la fila de cifras, y los de las próximas horas en la tira y en Mis
       estaciones. Aquí basta con la racha y su hora, en una línea.    */
    const cifras = TRAMOS.map(([n, et]) => {
      const x = enHoras(S.data.hours, n);
      if (!x || !has(x.gust)) return null;
      return `${et || `a las ${hh(x.date)}`} <b>${esc(wtxt(x.gust, true))}</b>`;
    }).filter(Boolean);
    if (cifras.length) trozos.push(`<span class="vc__c">Racha: ${cifras.join(' · ')}</span>`);
    hc.hidden = !trozos.length;
    /* Cada trozo en su renglón: las franjas y la racha son dos cosas
       distintas, y unidas con « · » dejaban un punto colgando al final
       de la línea —«ahora hasta 18:00 ·»— que él vio en el pantallazo
       del 03-09-2026. */
    hc.innerHTML = trozos.map(t => `<span class="cuando__l">${t}</span>`).join('');
  }

  /* — ¿Se llega? — */
  const ac = $('#vAcceso');
  if (ac) {
    const cfgSitio = cfgDe(S.place);
    const A = S.perfil !== 'dentro' ? acceso(S.data.hours, cfgSitio?.cota) : null;
    if (A) A.cotaAuto = !!cfgSitio?.cotaAuto;
    if (!A || (A.nivel === 'go' && !A.sinCota)) { ac.hidden = true; ac.innerHTML = ''; }
    else {
      ac.hidden = false;
      ac.dataset.s = A.nivel;
      const lista = A.avisos.map(x => `<li data-s="${x.n}">${x.t}</li>`).join('');
      ac.innerHTML = `<b class="acc__k">Para llegar</b>`
        + (lista ? `<ul class="acc__l">${lista}</ul>`
                 : `<p class="acc__ok">Nada que impida llegar</p>`)
        /* ANTES DECÍA «sin la cota no puedo decirte nada del hielo, ponla
           en Mis torres», y salía en los catorce sitios. Él lo cortó en
           seco el 28-08-2026: *«¿cómo que sin la cota? Si tenéis las
           coordenadas.»* Ahora la cota se saca de las coordenadas y solo
           queda este aviso si además falla eso —sin cobertura—. */
        + (A.sinCota ? `<p class="acc__nc">Todavía no tengo la altura de este
             emplazamiento —se saca de sus coordenadas y no ha llegado—, así que
             <b>no puedo compararla con la isocero</b>.</p>` : '')
        + (!A.sinCota && A.cotaAuto ? `<p class="acc__nc acc__nc--suave">Altura
             usada: <b>${Math.round(A.cota)} m</b>, sacada de las coordenadas. Si la
             tuya es otra, cámbiala en Mis estaciones.</p>` : '');
    }
  }

  /* El aviso de calor dentro de la caseta se QUITÓ el 25-08-2026, por
     orden suya: «lo del panel olvídate, solo el tiempo real en la calle;
     lo de dentro de la caseta no afecta para la app». Su razón, textual:
     «ya puede haber en la calle 40 grados que dentro de la caseta habrá
     25 si está el aire funcionando».

     O sea: la temperatura de dentro la fija el aire, no el tiempo. No es
     un dato meteorológico y la app no pinta nada ahí. No volver a
     meterlo. Se quitaron también el <p id="vCaseta"> de index.html y sus
     reglas .nota-caseta de styles.css. */

  // — KPIs —
  const kpi = (k, val, sub, st) =>
    `<div class="kpi"${st ? ` data-s="${st}"` : ''}><div class="kpi__k">${k}</div>
     <div class="kpi__v">${val}</div><div class="kpi__s">${sub}</div></div>`;

  const wSt = !has(c.wind) ? 'nd' : c.wind >= S.thr.windNo ? 'no' : c.wind >= S.thr.windWarn ? 'warn' : 'go';
  const gSt = !has(c.gust) ? 'nd' : c.gust >= listonRafaga().no ? 'no' : c.gust >= listonRafaga().warn ? 'warn' : 'go';
  const cSt = !has(c.cape) ? 'nd' : c.cape >= S.thr.capeNo ? 'no' : c.cape >= S.thr.capeWarn ? 'warn' : 'go';

  // Delante va SIEMPRE lo que publica el modelo a 10 m, sin cuentas de por
  // medio. Es lo que Aitor pidió: el dato crudo primero y las conclusiones
  // las saca él. Lo estimado a la altura de trabajo va detrás y marcado.
  const w10 = c.w10, g10 = c.gust10;   // lo que publica el modelo a 10 m
  // ¿Tiene el modelo niveles por encima de 10 m para poder estimar?
  const sinPerfil = S.hgt !== 10 && !c.windExact && !has(c.alpha);
  const w10St = !has(w10) ? 'nd' : w10 >= S.thr.windNo ? 'no' : w10 >= S.thr.windWarn ? 'warn' : 'go';
  const g10St = !has(g10) ? 'nd' : g10 >= listonRafaga().no ? 'no' : g10 >= listonRafaga().warn ? 'warn' : 'go';

  $('#kpis').innerHTML = [
    kpi('Ráfaga a 10 metros de altura',
        /* La marca de «otro da más» va pegada al número, igual que la del
           cielo, y sale de `avisoRacha()`, que es el único sitio donde se
           decide. Suyo, 30-08-2026: *«todo eso en las tres capas de
           torre, mis torres y ahora»*. */
        has(g10) ? `${wtxt(g10)}<i>${wu().lbl}</i>${avisoRacha(g10, { corto: true })}` : nd,
        'Tal cual lo publica el modelo',
        g10St),
    kpi('Viento a 10 metros de altura',
        has(w10) ? `${wtxt(w10)}<i>${wu().lbl}</i>` : nd,
        'Tal cual lo publica el modelo',
        w10St),
    // Si el modelo solo publica 10 m no hay estimación posible: se dice,
    // en vez de repetir el mismo número con la etiqueta EST. y un ×1.00
    // que parece un cálculo cuando no lo es.
    ...(sinPerfil ? [
      kpi(`A ${S.hgt} m`, '—',
          c.windNote === 'solo-10'
            ? `${esc(modeloDato().name)} solo publica viento a 10 m. Para estimar la altura usa ${otrosConNiveles()}`
            : `${esc(modeloDato().name)} llega hasta ${c.techo ?? '?'} m y tú pides ${S.hgt} m. `
              /* Escrito a mano hasta el 30-08-2026. Sale del que de
                 verdad publica esa altura, medido en `COBERTURA`. */
              + `Baja la altura o usa ${esc(nombreDeModelo(
                   quienLoMide('wind_speed_180m', modeloDato().om) || 'icon_seamless'))}, `
              + `que llega a 180 m`,
          'nd'),
    ] : [
      kpi(`Ráfaga estimada a ${S.hgt} m`,
          has(c.gust) ? `${wtxt(c.gust)}<i>${wu().lbl}</i>${c.gustEst ? '<span class="est">EST.</span>' : ''}` : nd,
          has(g10) && has(c.gust) && g10 > 0 ? `×${(c.gust / g10).toFixed(2).replace('.', ',')} sobre los 10 m`
                                             : 'Escalada con el perfil de viento',
          gSt),
      kpi(`Viento estimado a ${S.hgt} m`,
          has(c.wind) ? `${wtxt(c.wind)}<i>${wu().lbl}</i>${c.windExact ? '' : '<span class="est">EST.</span>'}` : nd,
          c.windExact ? 'Nivel publicado por el modelo'
            : has(c.alpha) ? `Ley potencial α=${c.alpha.toFixed(2).replace('.', ',')} entre niveles reales`
            : 'Interpolado entre niveles del modelo',
          wSt),
    ]),
    kpi('Dirección',
        has(c.dir) ? `${rumboLargo(c.dir)}<i>${c.dir.toFixed(0)}°</i>` : nd,
        `De donde viene el viento a ${has(c.dir80) ? 80 : 10} m`),
    /* El riesgo eléctrico lleva SIEMPRE la tapa al lado. Un CAPE suelto
       engaña: 90 J/kg se lee como «tranquilo» y 1.360 como «peligro»,
       cuando lo que decide es la pareja. Lo que cazó las tormentas del
       23 y el 24 de agosto no fue el CAPE, fue el CAPE con la tapa
       cayéndose — 720 con la tapa en 14 el día que oyó truenos. */
    kpi('Riesgo eléctrico',
        has(c.cape) ? `${c.cape.toFixed(0)}<i>J/kg</i>` : nd,
        isStormCode(c.code) ? 'Tormenta en la previsión horaria'
          : has(c.cin) ? `CAPE · tapa ${c.cin.toFixed(0)} — ${textoTapa(c.cin)}`
          : 'CAPE — energía convectiva disponible',
        isStormCode(c.code) ? 'no' : cSt),
    kpi('Sensación',
        has(c.feels) ? `${c.feels.toFixed(0)}<i>°C</i>` : nd,
        has(c.temp) ? `Temperatura del aire ${c.temp.toFixed(0)} °C` : 'Sin temperatura'),
    /* El número solo no basta: 0,0 mm con sirimiri se lee «no llueve» y
       moja. Va la palabra delante y los milímetros detrás. */
    (() => {
      const L = comoLlueve(c);
      const otro = lluviaQueNoVesTu(c);
      const base = [L.k === 'sirimiri' ? 'No marca en el pluviómetro, pero moja'
                      : (cieloVisto(c).txt ?? '') + avisoCielo(c.cloud, { corto: true }),
                    has(c.pop) ? `probabilidad ${c.pop} %` : null].filter(Boolean).join(' · ');
      /* Si otro modelo ve agua y el tuyo no, se dice AQUÍ y en naranja.
         No se toca el número: se le quita el «no llueve» de encima. */
      /* Ver `lluviaQueNoVesTu()`: el modelo cargado NUNCA va en la lista
         de «otros». Si es él mismo el que ve agua en la celda de al
         lado, se dice así — que es un dato distinto y muy suyo. */
      const aviso = !otro ? null
        : otro.quien
          ? `⚠ ${esc(nombreDeModelo(duenoLluvia()))} no ve agua, pero <b>${esc(otro.quien)}</b> sí`
            + ` — ${otro.sirimiri ? '<b>sirimiri</b>' : `<b>${mmTxt(otro.mm)} mm/h</b>`}`
            + (otro.sirimiri ? ' (sirimiri: moja sin marcar)' : '')
          : `⚠ ${esc(nombreDeModelo(duenoLluvia()))} no ve agua en su celda de tierra, pero`
            + ` <b>sí en la de al lado</b> — ${mmTxt(otro.enLaOtraCelda)} mm/h.`
            + ` Aquí en la costa esas dos celdas no son el mismo sitio`;
      return kpi('Lluvia',
        `${L.et}${has(c.prec) ? `<i>${mmTxt(c.prec)} mm/h</i>` : ''}`,
        [base, aviso].filter(Boolean).join('<br>'),
        L.k === 'bien' ? 'no' : (L.k === 'sirimiri' || L.k === 'poco') ? 'warn'
        : L.k === 'nd' ? 'nd' : otro ? 'warn' : 'go');
    })(),
  ].join('');

  /* Se dice de qué hora son las cifras de arriba. `hrs[0]` es la hora
     EN CURSO —`buildHours` coge la primera que aún no ha terminado—, así
     que a las 07:47 son las de 07:00 a 08:00. Los modelos dan valores
     por hora, no por minuto: no se interpola nada, se dice cuál es. */
  (() => {
    const el = $('#horaKpi');
    if (!el) return;
    const a = c.date, b = new Date(a.getTime() + 3600e3);
    const dosD = d => String(d.getHours()).padStart(2, '0');
    const ahora = new Date();

    /* TRES casos, no dos. El tercero es suyo y pasa de verdad: sin
       cobertura en el monte el service worker sirve la copia guardada, y
       esas cifras pueden ser de una hora YA PASADA. Decir «la próxima
       hora» ahí sería mentir justo cuando menos se puede comprobar. */
    const cola = ahora < a  ? ' — la próxima hora'
               : ahora < b  ? ' — la hora en curso'
               : ` — <b>datos de hace ${Math.floor((ahora - b) / 3600e3) + 1} h</b>,
                    pulsa el botón de recargar arriba`;
    el.innerHTML = `Cifras de <b>${dosD(a)}:00 a ${dosD(b)}:00</b>`
      + `${diaSiNoEsHoy(a)}${cola}. El modelo da un valor por hora, no por minuto.`;
  })();

  renderTimeline(hrs);
  renderProfile(c);
  renderStorm(c);

  /* El aviso de descargas medidas se repinta aquí porque llega por su
     cuenta, después del primer pintado: si no, un cambio de perfil o de
     altura volvería a dibujar la ficha y se lo llevaría por delante. */
  pintarRayosTorre();
  pintarDiscrepancia();
  seguro('antes de salir', pintarAntesDeSalir);
}

/* La altitud a la que el modelo "cree" que está el punto es determinante
   en monte: si la torre está en un cordal 500 m por encima de la celda
   del modelo, el viento real será bastante mayor que el previsto.
   Esto no se puede corregir automáticamente, así que se muestra. */
/* ── Y a cuántos kilómetros está el punto que lee el modelo ───────────
   Los modelos no leen tu emplazamiento: leen el nudo de su rejilla más
   cercano, y Open-Meteo devuelve cuál ha usado. Con GFS o ECMWF, que van
   a 25 km, ese nudo puede caer a 10-14 km de la torre, y en monte eso es
   otro sitio.

   MEDIDO el 25-08-2026, y salió de una diferencia real con AguaceroWx:
   pidiendo Bilbao (43,2630 / −2,9350) con GFS, el nudo que se usa es
   43,25 / −3,00 — **5,3 km al oeste, hacia la ría**. Por eso Bilbao y
   Llodio devolvían el MISMO número clavado, y Bermeo, Gernika y Durango
   otro: cada trío cae en la misma casilla. AguaceroWx interpola el campo
   y le saca un valor distinto a cada pueblo; ninguno de los dos miente,
   pero no son medidas del mismo punto.

   Se enseña siempre, y se marca cuando pasa de 8 km.                  */
/* ── LAS NUBES VAN POR CAPAS, Y EL TOTAL SE LAS COME ──────────────────
   Suyo, 28-08-2026 a las 21:00, mirando por la ventana de Bermeo:
     *«y ahora sí que hay más nubes aquí en Bermeo»* · *«que antes y más
     grises»* · *«no de esas de lluvia, e»*.

   La ficha le enseñaba **27 %** con el cielo tapado. Y el modelo no
   mentía: a esa hora ECMWF daba **medias 59 %** y **altas 57 %** con
   **bajas 0**. El «total» de Open-Meteo no es la suma ni el máximo —
   combina las capas y las deja en nada. Enseñar solo ese número es
   esconderle justo lo que está viendo.

   Y las capas son las que él distingue a ojo sin saberse el nombre:
     · bajas  — las del sirimiri, y las que le tapan la torre
     · medias — grises y espesas, pero no llueve de ellas. Éstas veía
     · altas  — finas, dejan pasar el sol

   Contrastado a las 21:03 con su meteoblue en Bermeo, que daba «medias
   40-60 %, bajas <20 %, altas <20 %». Y de paso salió que a esa hora
   ICON (medias 54) y ECMWF (medias 37) las tenían, mientras GFS, AROME
   y el Automático daban **0 en las tres capas**. */
function nubesPorCapas(C) {
  const capas = [
    { n: 'bajas',  v: C?.cloud_cover_low,  que: 'las del sirimiri, y las que tapan la torre' },
    { n: 'medias', v: C?.cloud_cover_mid,  que: 'grises y espesas, pero no llueve de ellas' },
    { n: 'altas',  v: C?.cloud_cover_high, que: 'finas, dejan pasar el sol' },
  ].filter(x => has(x.v));
  if (!capas.length) return null;
  /* ── MANDA LA QUE TAPA, NO LA MÁS ALTA EN NÚMERO ─────────────────
     Calpe, 07-09-2026 a las 00:18: «bajas 0 % · medias 70 % · altas
     100 %» y debajo «Manda la de altas: finas, dejan pasar el sol», con
     el rótulo grande diciendo «Cubierto». Las dos cosas a la vez no. Con
     un 70 % de nube media el cielo está tapado por la media, aunque la
     alta marque más: la misma regla del sol velado (bajas+medias desde
     el 40 % tapan; las altas solo velan). Sin nada bajo ni medio al 40,
     sigue mandando la mayor, como antes. */
  const tapa = capas.find(x => x.n !== 'altas' && x.v >= 40);
  const manda = tapa || capas.reduce((x, y) => (y.v > x.v ? y : x));
  return {
    capas,
    manda,
    linea: capas.map(x => `${x.n} <b>${Math.round(x.v)}&nbsp;%</b>`).join(' · '),
    /* ── EL TOTAL NO PUEDE SER MENOR QUE LA MAYOR DE SUS CAPAS ──────
       Aritmética, no meteorología: si hay un 47 % de nubes altas, el
       cielo tapado es al menos un 47 %. La idea es de la otra sesión,
       28-08-2026 de madrugada, y es buena porque **no necesita ninguna
       fuente de fuera**: cualquiera la repite en cualquier momento.

       MEDIDO a 7 días en Bermeo, con los dos modos de celda:

           ICON · GFS · ARPEGE ....  0 de 168 horas
           ECMWF .................. 50-76 de 168  (29-45 %)
           GEM .................... 51 de 168     (30 %)

       Peor caso, 29-08 a las 05:00: **total 3 % con 47 % de nubes altas**.

       Y LO QUE DE VERDAD DICE ESTO no es que el total esté roto. Los que
       descuadran son **exactamente los mismos cuyas capas van calculadas
       por fuera** (ver `CAPAS_PROPIAS`): los tres que publican sus capas
       cuadran siempre. Dos comprobaciones distintas —la documentación y
       esta cuenta— apuntando al mismo sitio.

       Así que aquí NO se elige culpable. Se dice que los dos números no
       encajan y de dónde sale cada uno, y decide él. Un margen de 1 punto
       por el redondeo. */
    descuadre: has(C?.cloud_cover) ? Math.round(manda.v - C.cloud_cover) : 0,
    /* ── UN PUNTO ERA GRITAR POR NADA ────────────────────────────
       Suyo, 03-09-2026, viendo el aviso en pantalla: *«¿qué quiere decir
       0 % con altas el 2?»*. Y la respuesta era: nada. Dos puntos de
       diferencia es redondeo, no un imposible.

       Este aviso existe para cazar disparates de verdad —el peor medido
       fue **total 3 % con nubes altas al 47 %**, el 29-08— y con el
       margen en 1 punto saltaba por dos, que además eran de la capa que
       menos le importa: las altas son cirros, dejan pasar el sol y no
       tapan la torre. Las que le tapan son las BAJAS.

       Diez puntos. Por debajo de ahí no hay nada que decidir, y un aviso
       que salta por nada es un aviso que se deja de leer. */
    noCuadra: has(C?.cloud_cover) && manda.v - C.cloud_cover > 10,

    /* ── Y EL DESCUADRE AL REVÉS, QUE ES PEOR ────────────────────────
       Encontrado por la otra sesión en el repaso del 29-08-2026, y tenía
       razón: `noCuadra` solo miraba un sentido. En «Ahora», con el
       Automático, salía esto:

           NUBOSIDAD 73 %
           Por capas: bajas 20 % · medias 0 % · altas 0 %
           Manda la de bajas: las del sirimiri...

       **73 % de cielo tapado y la frase hablando de un 20 %.** Eso no es
       solo un descuadre: es una frase que le puede hacer creer que arriba
       está limpio cuando el modelo dice que está tapado.

       LA REGLA NO ES LA QUE ÉL PROPONÍA. Sugería «total 25 puntos por
       encima de todas las capas», y eso marcaría casos legítimos: con
       bajas 40 y altas 40 un total de 70 es correcto, porque las capas se
       solapan. **Lo que no puede pasar es que el total supere la SUMA**:
       la unión nunca es mayor que la suma de las partes.

       EL MARGEN DE 10 PUNTOS ESTÁ MEDIDO, no elegido a ojo. A 3 días en
       Bermeo, horas en que el total supera la suma:

           umbral    ECMWF  GEM  Auto  ICON  GFS  ARPEGE
           > 1 pt      19    29     7     0    6      0
           > 5 pts     14    26     4     0    1      0
           > 10 pts     9    25     1     0    0      0   <-- aquí
           > 20 pts     7    20     1     0    0      0

       A partir de 10 los tres que publican sus capas dan CERO. Por debajo
       empiezan a saltar por redondeo y por los huecos entre las bandas de
       presión. Ese es el corte, y sale del dato. */
    suma: capas.reduce((a2, x) => a2 + x.v, 0),
    sinExplicar: has(C?.cloud_cover)
      && C.cloud_cover - capas.reduce((a2, x) => a2 + x.v, 0) > 10,
  };
}

function distanciaRejilla() {
  const fc = S.data?.fc;
  if (!fc || !has(fc.latitude) || !has(fc.longitude) || !S.place) return null;
  const km = kmEntre(S.place, { lat: fc.latitude, lon: fc.longitude });
  return { km, lat: fc.latitude, lon: fc.longitude, rumbo: rumboA(S.place, { lat: fc.latitude, lon: fc.longitude }) };
}

function renderElev() {
  /* ── LA COTA VIENE PUESTA, NO SE LE PIDE ────────────────────────────
     Suyo, 28-08-2026, tres preguntas seguidas mirando esta caja:
       *«¿a qué se refiere altitud real de la base de la torre? ¿Dónde
       está la caseta, o la punta de la torre que mide 60 metros?»*
       *«¿O para qué es ese desplegable, para poner cuántos metros más?»*
       *«Pero en Sollube, si tienes las coordenadas, la base ya se sabe
       dónde está, ¿no?»*

     Las tres tienen la misma respuesta y la última es la buena: **sí se
     sabe**. Con sus coordenadas, `/om?api=elev` da 669 m en Sollube.
     Esta caja llevaba desde el principio esperando a que lo escribiera
     él, y por eso salía vacía —y peor: salía con un **0** y «Diferencia
     −669 m» en rojo, que es lo que él fotografió—.

     Ahora usa `cfgDe()`, que ya trae la cota automática, y **se dice de
     dónde sale cada número**. Él solo la toca si sabe que está mal, que
     es para lo único que sirve: el modelo da la altura media de su
     cuadrícula, y en un cordal eso puede caer 100 m por debajo del sitio.

     Y NO es para sumar los 60 m de la torre. Eso es la altura de trabajo
     y va en su propio ajuste. Aquí es **el suelo**: donde aparca y donde
     está la caseta. El rótulo lo dice ahora con esas palabras. */
  const modelEl = S.data?.fc?.elevation;
  const cfg = cfgDe(S.place);
  const site = has(cfg?.cota) ? cfg.cota : null;
  const auto = !!cfg?.cotaAuto;
  const diff = (has(modelEl) && has(site)) ? site - modelEl : null;
  const R = distanciaRejilla();
  const lejos = R && R.km >= 8;

  const warn = (has(diff) && Math.abs(diff) >= 150) || lejos;
  /* ── DATOS, NO PÁRRAFOS ─────────────────────────────────────────
     Suyo, 02-09-2026, señalando el texto que salía aquí:
       *«COMENTARIOS QUE OCUPAN Y MAREAN FUERA, A MI DATOS SOLO»*

     Esta caja gastaba cuatro párrafos. Uno de ellos explicaba durante
     tres líneas por qué NO había que fijarse en un número que la propia
     caja pintaba. La respuesta correcta a eso no es explicarlo mejor:
     es **no pintar ese número**.

     Y por eso la diferencia solo sale con la cota escrita a MANO. Con la
     automática, las dos cifras salen del mismo mapa de alturas de
     Open-Meteo —medido el 30-08-2026: tres modelos, tres nudos, el mismo
     punto, los tres 285 m— así que restarlas da 0 siempre y daba un ✓
     verde que no podía fallar. Con esto decide si manda gente a un monte
     de noche; un visto bueno que no puede fallar no comprueba nada.

     Lo que sí distingue si el modelo mira su sitio es a qué distancia
     lee, y eso ahora es un número más de la fila, no un párrafo.       */
  $('#elev').innerHTML = `
    <div class="elev${warn ? ' is-warn' : ''}">
      <div class="elev__par">
        <span><i>el modelo</i><b>${has(modelEl) ? `${modelEl.toFixed(0)} m` : nd}</b></span>
        <span><i>tu suelo · sobre el mar${auto ? ' · auto' : ''}</i>
          <input id="siteElev" type="number" inputmode="numeric" placeholder="— m"
                 value="${has(site) ? site : ''}"></span>
        <span><i>lee a</i><b>${R ? `${kmTxt(R.km)} km${R.rumbo ? ` ${R.rumbo}` : ''}` : nd}</b></span>
        ${(has(diff) && !auto) ? `<span><i>diferencia</i><b${
            Math.abs(diff) >= 80 ? ' class="elev__rojo"' : ''}>${
            diff > 0 ? '+' : ''}${diff.toFixed(0)} m</b></span>` : ''}
      </div>
      ${textoCeldaLejos()}
      ${!has(site) ? `<div class="elev__d">Sin cota todavía — escríbela si la sabes.</div>` : ''}
      ${(has(diff) && !auto && Math.abs(diff) >= 80) ? `<div class="elev__d elev__mal">
        Tu cota y el mapa de alturas no cuadran. El modelo corrige la temperatura
        con la del mapa.</div>` : ''}
      ${lejos ? `<div class="elev__d elev__mal">El nudo de ${esc(modeloDato().name)}
        cae a ${kmTxt(R.km)} km: en monte y costa puede ser otra ladera, o mar.</div>` : ''}
    </div>`;
}

function renderTimeline(hrs) {
  const maxW = Math.max(...hrs.map(h => h.gust ?? h.wind ?? 0), listonRafaga().no, 10);
  // Una sola llamada por pintado: recorre 48 h x 5 modelos.
  const dud = horasEnDiscrepancia();
  const enDuda = h => dud.set.has(new Date(h.date).setMinutes(0, 0, 0));
  $('#tl').innerHTML = hrs.map((h, i) => {
    const val = h.gust ?? h.wind;
    const pct = has(val) ? clamp(val / maxW * 100, 4, 100) : 100;
    const duda = enDuda(h);
    return `<div class="tlh${i === S.sel ? ' is-sel' : ''}${duda ? ' tlh--duda' : ''}"
      data-s="${h.st}" data-i="${i}"
      title="${h.date.getHours()}:00 · ${VT[h.st]}${duda ? ' — pero los modelos no coinciden en esta hora' : ''}">
      <div class="tlh__b"><div class="tlh__f" style="height:${pct}%"></div></div>
      <div class="tlh__t">${String(h.date.getHours()).padStart(2, '0')}</div>
      <div class="tlh__d">${i === 0 || h.date.getHours() === 0
        ? h.date.toLocaleDateString('es', { weekday: 'short' }).slice(0, 2) : ''}</div>
    </div>`;
  }).join('');

  // Próxima ventana apta continua
  // La ventana apta NO atraviesa una hora en discrepancia: decirle «apta
  // hasta las 03:00» pasando por encima de dos horas que otros modelos
  // dan como tormenta es afirmar lo que no se sabe.
  const start = hrs.findIndex(h => h.st === 'go' && !enDuda(h));
  let hint = 'Sin ninguna hora apta en las próximas 48 h con estos umbrales';
  if (start >= 0) {
    let end = start;
    while (end + 1 < hrs.length && hrs[end + 1].st === 'go' && !enDuda(hrs[end + 1])) end++;
    const f = d => `${String(d.getHours()).padStart(2, '0')}:00`;
    const a = hrs[start].date, b = hrs[end].date;

    /* SI LA VENTANA CRUZA LA MEDIANOCHE, SE DICE. Salió repasando la app
       el 26-08-2026 con BI OIZ: ponía «próxima ventana apta: miércoles
       22:00 – 20:00», que se lee hacia atrás. Eran las 22:00 de hoy
       hasta las 20:00 de MAÑANA. Es el mismo fallo que se corrigió esa
       madrugada en el parte del día, pero esta línea se quedó sin
       tocar — y aquí engaña más, porque es la que dice a qué hora puede
       mandar gente. */
    const mismoDia = a.toDateString() === b.toDateString();
    const nombreDia = nombreDeDia;

    hint = start === 0
      ? `apta ahora y hasta las ${f(b)}${mismoDia ? '' : ` de ${nombreDia(b)}`}`
        + (dud.sabido && end + 1 < hrs.length && enDuda(hrs[end + 1])
            ? ', que es cuando los modelos dejan de coincidir' : '')
      : mismoDia
        ? `próxima ventana apta: ${nombreDia(a)} de ${f(a)} a ${f(b)}`
        : `próxima ventana apta: de ${nombreDia(a)} a las ${f(a)} `
          + `hasta ${nombreDia(b)} a las ${f(b)}`;
  }
  $('#windowHint').textContent = `· ${hint}`;
  renderTlDetail(hrs[S.sel] || hrs[0]);
}

function renderTlDetail(h) {
  if (!h) return;
  const when = h.date.toLocaleString('es', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

  /* Si en esta hora los modelos no coinciden, se dice AQUÍ y en primer
     lugar, antes que los motivos: si el veredicto es APTO, esa línea es
     precisamente la que lo pone en cuarentena. */
  const dud = horasEnDiscrepancia();
  const enDuda = dud.set.has(new Date(h.date).setMinutes(0, 0, 0));

  $('#tlDetail').innerHTML =
    `<h3 style="color:${VC[h.st]}">${VT[h.st]} · ${esc(when)}</h3>` +
    (enDuda
      ? `<div class="rz rz--warn"><i></i><span>Los modelos no coinciden en esta hora:
         otro da tormenta o mucha más energía que el que estás mirando. Míralo arriba,
         cambia de modelo, y no des este color por bueno sin comprobarlo.</span></div>`
      : '') +
    h.reasons.map(r => `<div class="rz rz--${r.s}"><i></i><span>${esc(r.txt)}</span></div>`).join('');
}

function renderProfile(c) {
  const rows = MODEL_LEVELS.map(l => ({ h: l, v: c.levels[l], exact: true }));
  if (!MODEL_LEVELS.includes(S.hgt)) {
    rows.push({ h: S.hgt, v: c.wind, exact: false });
    rows.sort((a, b) => a.h - b.h);
  }
  const max = Math.max(...rows.map(r => r.v ?? 0), 10);
  $('#prof').innerHTML = rows.map(r => `
    <div class="pr${r.exact ? '' : ' is-est'}${r.h === S.hgt ? ' is-work' : ''}">
      <span class="pr__h">${r.h} m</span>
      <div class="pr__bar"><div class="pr__f" style="width:${has(r.v) ? clamp(r.v / max * 100, 2, 100) : 0}%"></div></div>
      <span class="pr__v">${has(r.v) ? wtxt(r.v, true) : nd}${r.exact ? '' : '<span class="est">EST.</span>'}</span>
    </div>`).join('') +
    lineaDron(rows) +
    `<p class="note">Rayado = altura estimada por interpolación entre los niveles reales del modelo.
     Contorno = tu altura de trabajo. El modelo solo publica 10, 80, 120 y 180 m.</p>`;
}

/* ── Y LO MISMO LE VALE PARA VOLAR ────────────────────────────────────
   Suyo, 29-08-2026: *«me gusta la fotografía mucho y el vídeo, soy
   aficionado, me gusta volar mis drones de DJI»* · *«mira el provecho
   que le puedo sacar a la app»* · *«DJI Mini 3 Pro»* y Mavic 2 Pro.

   Y tenía razón en lo del provecho: **esto ya estaba calculado**. Este
   perfil se montó para saber qué se encuentra un operario a 40 m en una
   torre, y **120 m es justo el techo legal de vuelo de un dron**. Cero
   trabajo nuevo: la cifra ya estaba en pantalla sin que nadie supiera
   que le servía para eso.

   EL LISTÓN ES DEL FABRICANTE, NO NUESTRO. Él lo dijo así: *«bueno, los
   fabricantes pueden ponerlo, está bien»*. DJI publica **10,7 m/s
   (nivel 5)** para el Mini 3 Pro, y el Mavic 2 está también en nivel 5.
   Eso son **38 km/h** y vale para los dos.

   Y SE DICE LO QUE ESE NÚMERO ES DE VERDAD: es el viento en el que el
   aparato **se sostiene**, no en el que se vuela bien. Para vídeo
   estable se baja bastante de ahí. Como siempre: el dato y su letra
   pequeña, y decide él. Ningún semáforo. */
const DRON_TOPE = 38;          // km/h · DJI, 10,7 m/s = nivel 5
const DRON_ALTURA = 120;       // m · el techo legal de vuelo

function lineaDron(rows) {
  const r = rows.find(x => x.h === DRON_ALTURA);
  if (!has(r?.v)) return '';
  const v = r.v;
  /* ¿Es de quien crees? AROME no publica 120 m, así que ese nivel viene
     prestado. Se dice: en un dato que decide si vuelas o no, saber de
     quién es no es un detalle. */
  const de = (S.data?.fc?.prestadosDe || []).find(x => x.k === 'wind_speed_120m');
  const quien = de ? ((COMPARAR.find(m => m.om === de.de)?.name)
                   || (MODELS.find(m => m.om === de.de)?.name) || null) : null;
  const pasa = wRed(v) >= wRed(DRON_TOPE);   // sobre lo que se imprime (04-09-2026)
  return `<div class="prof__dron"${pasa ? ' data-ojo="1"' : ''}>
    <b>Para el dron</b> · a ${DRON_ALTURA} m, que es el techo de vuelo:
    <b>${wtxt(v, true)}</b>${quien ? ` <i>(de ${esc(quien)}: ${esc(modeloDato().name)}
      no publica esa altura)</i>` : ''}. El tope que publica DJI para tu Mini 3 Pro y tu
    Mavic 2 es <b>${wtxt(DRON_TOPE, true)}</b> (10,7 m/s, nivel 5)${
      pasa ? ' — <b>estás por encima</b>' : ''}.
    <span class="prof__dron__n">Ese tope es en el que el aparato <b>se sostiene</b>,
    no en el que se vuela bien: para vídeo estable se baja bastante de ahí.</span>
  </div>`;
}

function renderStorm(c) {
  /* La hora, también aquí. Estas cuatro cifras son de la misma hora que
     las de arriba, pero el bloque queda lejos y él las mira por
     separado — preguntó el 26-08-2026 «¿a qué hora riesgo eléctrico y
     todo esto?» y no había forma de saberlo. */
  (() => {
    const el = $('#horaStorm');
    if (!el || !c?.date) return;
    const dosD = d => String(d.getHours()).padStart(2, '0');
    // Se AÑADE la hora, no se sustituye lo que ya decía.
    el.textContent = `índices de inestabilidad · `
      + `${dosD(c.date)}:00 a ${dosD(new Date(c.date.getTime() + 3600e3))}:00`
      + diaSiNoEsHoy(c.date);
  })();

  /* ── COLOR EN LOS NÚMEROS ───────────────────────────────────────────
     Suyo, 28-08-2026: *«aquí está soso, en blanco y negro; pon algo en
     azul, etc., verdes»*, *«el pantallazo de arriba, monocromo: ponlo
     más colorido»*.

     Pero con su otra regla delante, la del 26-08: **el color significa
     algo o no se pone**. Así que cada cifra se pinta por lo que dice
     ella, no por adorno:

       · **verde** — tranquilo
       · **azul**  — es un dato de referencia, ni bueno ni malo (isocero)
       · **ámbar** — ojo, la cosa se mueve
       · **rojo**  — el valor está en el tramo que preocupa

     Y hay una trampa que evitar en la TAPA: una tapa baja no es mala por
     sí sola. Con CAPE de 20 —lo de hoy— una tapa 0 no es nada. Por eso
     la tapa se pinta MIRANDO EL CAPE, que es justo lo que dice el texto
     de abajo: «míralos juntos, no por separado». Sola, va en azul. */
  const row = (k, sub, v, s, tono) =>
    `<div class="st"${tono ? ` data-t="${tono}"` : ''}>
     <div class="st__k">${k}<small>${sub}</small></div>
     <div class="st__v">${v}${s ? `<small>${s}</small>` : ''}</div></div>`;

  /* Con SU tope de CAPE, no con un 1000 a mano (01-09-2026). */
  const tonoCape = !has(c.cape) ? '' : c.cape >= (S.thr?.capeNo ?? 1000) ? 'no'
                 : c.cape >= CAPE_COMBINACION ? 'warn' : 'go';
  const tonoLi   = !has(c.li) ? '' : c.li <= -6 ? 'no' : c.li <= -2 ? 'warn' : 'go';
  // La tapa solo se pone en rojo si HAY gasolina que soltar.
  const hayGas   = has(c.cape) && c.cape >= CAPE_COMBINACION;
  const tonoCin  = !has(c.cin) ? '' : (hayGas && c.cin < 75) ? 'no'
                 : hayGas ? 'warn' : 'dato';
  // El isocero no es bueno ni malo: es referencia… salvo que caiga sobre
  // la cota del sitio, que entonces es hielo en la pista.
  const cotaAqui = cfgDe(S.place)?.cota;
  const tonoFrz  = !has(c.frz) ? ''
                 : (has(cotaAqui) && c.frz <= cotaAqui + 200) ? 'no' : 'dato';
  const tonoCod  = !has(c.code) ? '' : isStormCode(c.code) ? 'no'
                 : c.code >= HAY_AGUA ? 'warn' : 'go';

  const capeTxt = !has(c.cape) ? nd
    : c.cape >= (S.thr?.capeNo ?? 1000) ? 'alta'
    : c.cape >= (S.thr?.capeWarn ?? 300) ? 'moderada' : 'baja';
  const liTxt = !has(c.li) ? nd
    : c.li <= -6 ? 'muy inestable' : c.li <= -2 ? 'inestable' : c.li <= 2 ? 'neutra' : 'estable';
  // La tapa, en palabras. Los cortes salen de lo medido el 23-08-2026:
  // Bermeo con 130-141 oyó truenos lejanos y no le cayó nada; Durango,
  // Amorebieta y Zarautz, con la tapa en 0, descargaron (con granizo en
  // Zarautz). En esta app la inhibición sale en POSITIVO; en AguaceroWx
  // y otros visores la verás en negativo: es lo mismo, con el signo
  // cambiado.
  const cinTxt = !has(c.cin) ? nd
    : c.cin < 25  ? 'Sin tapa: si hay CAPE, rompe'
    : c.cin < 50  ? 'Tapa floja'
    : c.cin < 200 ? 'Tapa que aguanta'
    :               'Tapa fuerte';

  // De dónde salen estos números, si no los publica el modelo elegido
  const fcAct = S.data?.fc;
  const delOtro = (fcAct?.suplidas || []).filter(k =>
    ['convective_inhibition','lifted_index','freezing_level_height'].includes(k));
  /* Igual que la de «Ahora»: se dice de quién es cada cifra **una sola
     vez**. Antes repetía la lista entera dos veces —«no publica A, B y C.
     Se toman A, B y C de X»— y no había quien la leyera. */
  const prestados = delOtro.length ? `<p class="det__nota">
      <b>${esc(modeloDato().name)} no publica todo</b>, así que cada dato se le pide
      al que sí lo publica:<br>${deQuienSale(fcAct, delOtro).join('<br>')
        || 'del modelo automático'}</p>` : '';

  $('#storm').innerHTML =
    row('CAPE', 'Energía convectiva DE SUPERFICIE', show(c.cape, 'J/kg'),
        capeTxt === nd ? '' : `Inestabilidad ${capeTxt}`, tonoCape) +
    /* Lo que ve OTRO modelo a esta hora, aquí también (09-09-2026): la
       tabla de abajo lo decía y esta caja no. Ver tormentaQueNoVesTu(). */
    (o => o ? row(`⚠ ${o.quien} ve tormenta`, 'a esta hora, con su tapa',
                  `${Math.round(o.cape)} J/kg`, `tapa ${Math.round(o.cin)} — abierta: puede romper`, 'no') : '')(tormentaQueNoVesTu(c)) +
    row('Índice de elevación', 'Lifted Index', show(c.li, '', 1),
        liTxt === nd ? '' : `Atmósfera ${liTxt}`, tonoLi) +
    row('Inhibición convectiva', 'CIN — "tapa" que frena la convección', show(c.cin, 'J/kg'),
        cinTxt === nd ? '' : cinTxt, tonoCin) +
    row('Isocero', 'Altura de la cota de 0 °C', show(c.frz, 'm'),
        has(cotaAqui) ? `el suelo aquí, a ${Math.round(cotaAqui)} m` : '', tonoFrz) +
    row('Previsión horaria', 'Código de tiempo del modelo', wmoText(c.code) ?? nd, '', tonoCod) +
    prestados +
    /* ── LA CHAPA SE FUE A LA GUÍA (02-09-2026) ─────────────────────
       Aquí había cuatro párrafos: cómo se leen el CAPE y la tapa juntos,
       por qué no hay aviso de granizo, y por qué este CAPE es el de
       superficie y se queda corto en valles. Todo medido y todo cierto.

       Suyo, leyéndolo entero:  *«TODA ESTA CHAPA VALE PARA ALGO?»*

       Vale, pero no aquí. Es un manual, y él lo que mira en esta caja son
       cifras: *«vosotros con ponerme los datos me sobra, el resto es cosa
       mía»*. Un manual encima de los números tapa los números. Se queda
       la regla en una línea —que los dos van juntos y que esto dice si
       PUEDE, no si ha caído— y lo demás vive en la Guía, que es donde se
       va a leer cuando quiera leerlo.                                  */
    `<p class="note"><b>El CAPE y la tapa van juntos:</b> con CAPE alto y la tapa cerca
     de <b>0</b> rompe; con la tapa por encima de <b>100</b>, lo normal es oírla lejos.
     Esto dice si <b>puede</b>, no si ha caído — para descargas medidas, la pestaña
     Rayos. <a href="#" data-ir-guia="cape">Cómo se leen, y por qué no hay aviso de
     granizo</a>.</p>`;
}

/* ---------- 8 bis. Parte de decisión ─────────────────────────────────
   El coordinador decide por otras personas: necesita poder dejar por
   escrito en qué se basó, con hora, modelo y umbrales. Texto plano para
   pegarlo en el parte de trabajo o mandarlo a la cuadrilla.            */

function parte() {
  const c = S.data.hours[0], p = S.place, M = modeloDato();
  const f = d => d.toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const el = S.data.fc.elevation, site = LS.get('siteElev.' + key(p), null);

  // Próxima ventana apta
  const i0 = S.data.hours.findIndex(h => h.st === 'go');
  let vent = 'ninguna hora apta en las próximas 48 h';
  if (i0 >= 0) {
    let i1 = i0; while (i1 + 1 < S.data.hours.length && S.data.hours[i1 + 1].st === 'go') i1++;
    vent = `${f(S.data.hours[i0].date)} → ${f(S.data.hours[i1].date)}`;
  }

  const L = [
    `PARTE METEOROLÓGICO — TRABAJO EN ALTURA`,
    `Emplazamiento: ${p.name}${p.admin1 ? ' (' + p.admin1 + ')' : ''}`,
    `Coordenadas: ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`,
    has(el) ? `Altitud del modelo: ${el.toFixed(0)} m${has(site) ? ` · altitud real de la torre: ${site} m (dif. ${(site - el) > 0 ? '+' : ''}${(site - el).toFixed(0)} m)` : ''}` : null,
    `Altura de trabajo evaluada: ${S.hgt} m`,
    `Modelo: ${M.name} (${M.desc})`,
    `Datos descargados: ${f(new Date(S.data.at))}`,
    ``,
    `VEREDICTO AHORA (${f(c.date)}): ${VT[c.st]}`,
    ...c.reasons.map(r => `  - [${VT[r.s]}] ${r.txt}`),
    ``,
    `Viento a ${S.hgt} m: ${has(c.wind) ? wtxt(c.wind, true) + (c.windExact ? '' : ' (estimado)') : 'sin dato'}`,
    `Rafaga: ${has(c.gust) ? wtxt(c.gust, true) + (c.gustEst ? ' (estimada a altura; a 10 m ' + (has(c.gust10) ? wtxt(c.gust10, true) : '?') + ')' : '') : 'sin dato'}`,
    `Direccion: ${rumboLargo(c.dir) ?? 'sin dato'}`,
    `CAPE: ${has(c.cape) ? c.cape.toFixed(0) + ' J/kg' : 'sin dato'} · Lifted Index: ${has(c.li) ? c.li.toFixed(1).replace('.', ',') : 'sin dato'}`,
    `Precipitacion: ${has(c.prec) ? mmTxt(c.prec) + ' mm/h' : 'sin dato'}`,
    ``,
    `PROXIMA VENTANA APTA: ${vent}`,
    ``,
    `Umbrales aplicados: viento ${wtxt(S.thr.windWarn)}/${wtxt(S.thr.windNo)} ${wu().lbl} · rafaga ${wtxt(listonRafaga().warn)}/${wtxt(listonRafaga().no)} ${wu().lbl} · CAPE ${S.thr.capeWarn}/${S.thr.capeNo} J/kg · lluvia ${S.thr.rainWarn}/${S.thr.rainNo} mm/h`,
    ``,
    `AVISO: prevision de modelo numerico. Los avisos con valor legal los`,
    `emiten AEMET y Euskalmet. Lo unico medido en el punto es el anemometro.`,
  ].filter(x => x !== null);

  return L.join('\n');
}

async function copiarParte() {
  const txt = parte();
  try {
    await navigator.clipboard.writeText(txt);
    toast('Parte copiado — pégalo en el parte de trabajo', 3200);
  } catch {
    // Sin permiso de portapapeles (http, Safari antiguo): mostrarlo para copiar a mano
    const w = window.open('', '_blank');
    if (w) { w.document.write('<pre style="font:13px/1.5 monospace;padding:16px;white-space:pre-wrap">' + esc(txt) + '</pre>'); }
    else toast('No se ha podido copiar');
  }
}


/* ---------- 8 ter. Portada ─────────────────────────────────────────
   Foto real del emplazamiento sacada de Wikimedia Commons por
   proximidad geográfica. Se muestra SIEMPRE el autor y la licencia,
   porque las licencias Creative Commons lo exigen. Si no hay ninguna
   foto cerca, se dibuja un cielo generado según el tiempo real y se
   dice que es un cielo generado, no una foto del sitio.            */


/* ---------- Fotos propias por zona ──────────────────────────────────
   Para los sitios de Aitor, foto elegida a mano en vez de la que salga
   por cercanía en Wikimedia: en Bermeo el buscador automático sacaba
   fotos del puerto, y lo que se ve desde allí es Gaztelugatxe.

   Dos variantes de la MISMA vista, para que la portada acompañe al
   tiempo: una con cielo azul y otra con el cielo cargado. No se cambia
   de sitio, se cambia de día.                                        */

const FOTOS_ZONA = [
  {
    // Bermeo, Bakio, Mundaka, Sollube… todo el entorno
    lat: 43.43, lon: -2.76, radioKm: 18,
    sol: {
      titulo: 'San Juan de Gaztelugatxe',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Gaztelugache%2C_Bermeo%2C_Pa%C3%ADs_Vasco%2C_Espa%C3%B1a%2C_2019-08-13%2C_DD_14.jpg/1920px-Gaztelugache%2C_Bermeo%2C_Pa%C3%ADs_Vasco%2C_Espa%C3%B1a%2C_2019-08-13%2C_DD_14.jpg',
      pagina: 'https://commons.wikimedia.org/wiki/File:Gaztelugache,_Bermeo,_Pa%C3%ADs_Vasco,_Espa%C3%B1a,_2019-08-13,_DD_14.jpg',
      autor: 'Diego Delso', licencia: 'CC BY-SA 4.0',
    },
    gris: {
      titulo: 'Gaztelugatxe con el cielo cargado',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Lesite.jpg/1920px-Lesite.jpg',
      pagina: 'https://commons.wikimedia.org/wiki/File:Lesite.jpg',
      autor: 'Pixiwiki', licencia: 'CC BY-SA 4.0',
    },
  },
];

/** ¿Hay foto propia para este punto? */
function fotoZona(place, hour) {
  const z = FOTOS_ZONA.find(z => kmEntre({ lat: z.lat, lon: z.lon }, place) <= z.radioKm);
  if (!z) return null;
  const c = hour?.code;
  // Despejado o pocas nubes → la de cielo azul. Lo demás, la cargada.
  const despejado = has(c) ? (c === 0 || c === 1 || c === VELADO) : true;
  return { ...(despejado ? z.sol : z.gris), zona: true };
}

/** Clase de ambiente para la portada: noche, lluvia, tormenta o sol. */
function ambiente(hour) {
  if (!hour) return '';
  const c = hour.code, noche = hour.day === 0;
  const partes = [];
  if (noche) partes.push('amb-noche');
  if (isStormCode(c))                              partes.push('amb-tormenta');
  else if (has(c) && ((c >= 51 && c <= 67) || (c >= 80 && c <= 86))) partes.push('amb-lluvia');
  else if (has(c) && (c >= 71 && c <= 77))         partes.push('amb-nieve');
  else if (has(c) && (c === 45 || c === 48))       partes.push('amb-niebla');
  else if (!noche && has(c) && (c === 0 || c === 1 || c === VELADO)) partes.push('amb-sol');
  return partes.join(' ');
}

/* ── QUÉ FOTO SE PONE DE PORTADA ──────────────────────────────────────
   Suyo, 26-08-2026, viendo el Oiz a las cinco de la tarde con una foto
   de noche: *«en la foto de Oiz, ¿por qué sale de noche? Tiene que salir
   la foto según el tiempo que esté: si es de día, si es de noche, si
   hace sol, si llueve, si está nublado»*.

   Eran DOS fallos, no uno:

   1. **La foto no era del sitio.** Wikimedia busca por coordenadas y en
      el Oiz devolvía «ISS053-E-365065 · View of Earth», una foto de la
      Tierra de noche hecha desde la Estación Espacial. Está catalogada
      ahí porque su punto de vista cae sobre la vertical, pero no enseña
      el Oiz ni enseña nada.

   2. **No miraba el tiempo ni la hora.** Aunque la foto fuera buena, una
      foto nevada un día de agosto engaña igual.

   No se inventa nada: se puntúa por lo que dice el propio título y la
   categoría de la foto, y si ninguna sirve se cae al cielo generado, que
   ese SÍ va con el tiempo real. Mejor un cielo honesto que una foto
   bonita que miente.                                                  */

/* Lo que no es una foto del sitio y punto. Se tira sin mirar el tiempo. */
const NO_ES_EL_SITIO = new RegExp([
  'iss\\d{3}', 'international space station', 'view of earth', 'from space',
  'satellite', 'sentinel-?\\d', 'landsat', 'astronaut',
  'map\\b', 'mapa\\b', 'plano\\b', 'diagram', 'chart', 'graph',
  'coat of arms', 'escudo', 'bandera', 'flag of', 'logo',
  'portrait', 'retrato', 'signature', 'firma de',
  'panel informativo', 'señal', 'sign\\b', 'placa',
].join('|'), 'i');

function sirveDePortada(f) {
  return !NO_ES_EL_SITIO.test(f.titulo);
}

/* Cuánto pega esta foto con lo que hay ahora mismo en la calle.
   Es una puntuación, no un filtro: si ninguna pega, se coge la mejor que
   haya en vez de quedarse sin foto. */
function puntuarFoto(f, hour) {
  const t = String(f.titulo).toLowerCase();
  const noche = hour?.day === 0;
  const c = hour?.code;

  const dice = re => re.test(t);
  const esDeNoche = dice(/\bnight\b|nocturn|de noche|atardecer|sunset|amanecer|sunrise|dusk|dawn/);
  const esNevada  = dice(/\bsnow\b|nieve|nevad|elur/);
  const esNiebla  = dice(/\bfog\b|mist\b|niebla|laino/);
  const esLluvia  = dice(/\brain\b|lluvia|euri|storm|tormenta|cloudy|nublad|overcast|hodei/);

  let p = 0;

  /* LA HORA MANDA sobre el tiempo: una foto de noche a las cinco de la
     tarde canta muchísimo más que una nublada con el cielo raso. */
  if (noche)  p += esDeNoche ? 30 : 0;
  else        p += esDeNoche ? -40 : 10;

  /* La nieve fuera de temporada es el otro engaño gordo: un Oiz nevado
     un 26 de agosto. Solo suma si de verdad está nevando. */
  const nevando = has(c) && c >= 71 && c <= 77;
  if (esNevada) p += nevando ? 25 : -35;

  if (has(c)) {
    const conAgua  = (c >= 51 && c <= 67) || (c >= 80 && c <= 86) || isStormCode(c);
    const conNubes = c === 2 || c === 3;
    const raso     = c === 0 || c === 1 || c === VELADO;
    const conNiebla = c === 45 || c === 48;
    if (esNiebla) p += conNiebla ? 25 : -15;
    if (esLluvia) p += (conAgua || conNubes) ? 15 : -15;
    if (raso && (esLluvia || esNiebla)) p -= 10;
  }
  return p;
}

const Cover = {
  async load(place, hour) {
    this.sky(hour);
    this.ambiente(hour);

    const propia = fotoZona(place, hour);
    if (propia) { this.paint(propia); return; }

    /* La caché lleva el momento dentro: si no, la foto elegida a las
       once de la noche se quedaría puesta a las once de la mañana, que
       es exactamente lo que él vio. */
    const franja = hour?.day === 0 ? 'noche' : 'dia';
    const k = `foto.${key(place)}.${franja}`;
    const cached = LS.get(k, undefined);

    if (cached !== undefined) { this.paint(cached); return; }
    try {
      const d = await jget('https://commons.wikimedia.org/w/api.php', {
        action: 'query', format: 'json', origin: '*',
        generator: 'geosearch', ggscoord: `${place.lat}|${place.lon}`,
        ggsradius: 10000, ggslimit: 30, ggsnamespace: 6,
        prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: 1600,
      }, { timeout: 9000 });

      const pgs = Object.values(d?.query?.pages ?? {});
      const fotos = pgs.map(p => {
        const ii = (p.imageinfo || [])[0]; if (!ii) return null;
        const em = ii.extmetadata || {};
        const limpiar = h => String(h ?? '').replace(/<[^>]*>/g, '').trim();
        return {
          titulo: p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
          url: ii.thumburl || ii.url,
          pagina: ii.descriptionurl,
          autor: limpiar(em.Artist?.value) || 'autor no indicado',
          licencia: limpiar(em.LicenseShortName?.value) || 'ver ficha',
          w: ii.width, h: ii.height,
        };
      }).filter(Boolean)
        // Apaisadas y grandes: las verticales quedan mal de portada
        .filter(f => f.w > f.h * 1.15 && f.w >= 1000)
        .filter(sirveDePortada)
        .sort((a, b) => puntuarFoto(b, hour) - puntuarFoto(a, hour)
                     || b.w * b.h - a.w * a.h);

      const elegida = fotos[0] ?? null;
      LS.set(k, elegida);
      this.paint(elegida);
    } catch {
      LS.set(k, null);
      this.paint(null);
    }
  },

  paint(f) {
    const ph = $('#coverPh'), cr = $('#coverCred');
    if (!f) {
      ph.style.backgroundImage = '';
      $('#cover').classList.remove('has-photo');
      cr.innerHTML = `<span class="faint">Cielo generado a partir del tiempo real · sin foto libre de este punto</span>`;
      return;
    }
    // Solo se marca como "con foto" cuando la imagen carga de verdad
    const im = new Image();
    im.onload = () => {
      ph.style.backgroundImage = `url("${f.url}")`;
      $('#cover').classList.add('has-photo');
    };
    im.onerror = () => { $('#cover').classList.remove('has-photo'); };
    im.src = f.url;

    cr.innerHTML = `<a href="${esc(f.pagina)}" target="_blank" rel="noopener">
      ${esc(f.titulo)}</a> · ${esc(f.autor)} · ${esc(f.licencia)}`;
  },

  /** Ambiente sobre la foto: se oscurece de noche y le caen gotas si
   *  llueve. La foto es siempre del mismo sitio; lo que cambia es la luz,
   *  igual que cambia en la calle. */
  ambiente(h) {
    const el = $('#cover');
    if (!el) return;
    el.className = el.className.replace(/\bamb-[a-z]+\b/g, '').trim();
    const cls = ambiente(h);
    if (cls) el.classList.add(...cls.split(' '));
  },

  /** Cielo de respaldo: color según el tiempo REAL y si es de día o de noche. */
  sky(h) {
    if (!h) return;
    const dia = h.day !== 0;
    const c = h.code;
    let g;
    if (!has(c))                       g = dia ? '#2b4a7a,#4c7ab5' : '#0b1730,#1b2c50';
    else if (c === 0 || c === 1)       g = dia ? '#1d64c2,#57a8ee,#a9d6f7' : '#050b1c,#0f1f42,#22345f';
    else if (c === VELADO)             g = dia ? '#2c66b4,#6da4d9,#d3dde8' : '#060c1e,#122344,#26385e';
    else if (c === 2)                  g = dia ? '#2a6bb0,#6fa3d6,#c2d4e4' : '#070f24,#152747,#2b3d63';
    else if (c === 3)                  g = dia ? '#4a5a72,#8695a8,#b9c3cf' : '#0a1020,#1a2233,#2c3547';
    else if (c === 45 || c === 48)     g = dia ? '#6b7683,#a3acb6,#cdd3d9' : '#12161d,#232a33,#39414b';
    else if (c >= 51 && c <= 67)       g = dia ? '#3d5570,#6b8298,#95a7b8' : '#080e1a,#16202f,#28344a';
    else if (c >= 71 && c <= 77)       g = dia ? '#7e8b9c,#b3bec9,#e0e6ec' : '#141a24,#28313d,#414c59';
    else if (c >= 80 && c <= 86)       g = dia ? '#33475e,#5c7288,#8b9dae' : '#070d18,#141d2b,#252f42';
    else if (isStormCode(c))           g = dia ? '#2a2f3d,#4a5164,#6d7385' : '#05070d,#12151f,#232734';
    else                               g = dia ? '#2b4a7a,#4c7ab5' : '#0b1730,#1b2c50';
    $('#coverSky').style.background = `linear-gradient(170deg, ${g})`;
  },
};


/* ── AGUA QUE TU MODELO NO VE ─────────────────────────────────────────
   Suyo, 26-08-2026, a las 19:00, de pie en Bermeo: *«en Bermeo lloviendo
   poco pero cae»*, *«acaba de empezar»*.

   Y la pestaña Torre le enseñaba **0,0 mm**. Comprobado modelo a modelo
   en ese momento y en ese punto:

       Automático  0,0    ICON  0,0    GFS  0,0    AROME HD  0,0
       ECMWF       0,4  ← y con código 51, llovizna débil

   Uno de cinco lo vio. Y el que lo vio no era el que él tenía cargado.

   El parte de Mis torres SÍ se lo decía, porque ese lee los cinco. Pero
   la ficha de la torre enseña el modelo cargado, y ahí salía un cero
   pelado mientras le caía agua encima.

   ESO NO ES UN DETALLE PARA ÉL: el sirimiri **moja sin marcar en el
   pluviómetro**, y lo que esté a la intemperie estará mojado. Un cero en
   pantalla en esa situación le esconde un dato del tiempo.

   ATENCIÓN AL ESCRIBIR AQUÍ (orden suya del 28-08-2026): **se dice el
   tiempo y su consecuencia física, nunca qué hacer.** «Moja» sí; «no se
   sube» o «no se tocan» NO. Él decide, y sabe cosas que la app no sabe
   —si el cuadro está dentro de la caseta, qué avería es, si lleva
   guantes—. Ver la regla completa junto a `assess()`.

   Aquí NO se cambia el número: el dato del modelo cargado se respeta,
   que es lo que él pidió siempre —el dato crudo delante—. Lo que se hace
   es no callarse el desacuerdo.                                       */
function lluviaQueNoVesTu(c) {
  const H = deEsteSitio(S.comparativa)?.hourly;   // la de ESTE sitio, no la del anterior
  if (!H?.time) return null;

  const ahora = Date.now();
  let i = H.time.findIndex(t => new Date(t).getTime() + 3600e3 > ahora);
  if (i < 0) return null;

  /* Se compara con lo que se ve en pantalla AHORA. Si el modelo cargado
     ya está diciendo que llueve, aquí no hay nada que añadir. */
  const mio = has(c.prec) ? c.prec : 0;
  if (mio >= 0.1) return null;

  /* ── EL MODELO CARGADO NO ES «OTRO MODELO» ────────────────────────
     Cazado el 30-08-2026 en un pantallazo suyo, probando los cuatro
     modelos uno a uno. Con ECMWF puesto, la tarjeta decía en el mismo
     renglón:

         «⚠ ECMWF no ve agua · ECMWF y HARMONIE sí (sirimiri)»

     Se contradice sola, y le hace dudar de un dato que está bien.

     LA CAUSA está ya documentada y es de las finas: la ficha pide su
     punto con `cell_selection: 'land'` —tierra firme— y la comparativa
     no. En Bermeo eso son **19 km**: la ficha lee el nudo de ECMWF
     metido en el monte y la comparativa el de la costa. Mismo modelo,
     dos sitios; uno ve agua y el otro no.

     Que su propio modelo vea agua en la celda de al lado ES un dato
     bueno —es justo el efecto costa que a él le importa— pero **no se
     cuenta como si fuera otro modelo**: se dice aparte y con su nombre. */
  const cargado = nombreDeModelo(duenoLluvia());   // el dueño de la lluvia, no el de pantalla
  const todos = COMPARAR
    .map(m => ({ nom: m.name, mm: H[`precipitation_${m.om}`]?.[i],
                 code: H[`weather_code_${m.om}`]?.[i] }))
    .filter(x => has(x.mm) && x.mm >= 0.1);

  const elMismo = todos.find(x => x.nom === cargado) || null;
  const otros = todos.filter(x => x.nom !== cargado);

  if (!otros.length && !elMismo) return null;
  otros.sort((a, b) => b.mm - a.mm);
  const peor = otros[0] || elMismo;

  /* Sirimiri o chaparrón: cambia lo que puede hacer, no solo el número. */
  const sirimiri = has(peor.code) && peor.code >= 51 && peor.code <= 55;
  /* ── Y SI NOMBRA UNO QUE NO ESTÁ EN SU SELECTOR, SE AVISA ─────────
     Suyo, 30-08-2026: *«HARMONIE sí, pero no tenemos, ¿no? no lo veo
     ese modelo»*. Y lleva razón: en el selector hay cinco —Automático,
     ECMWF, GFS, ICON y AROME HD— y la comparativa mira SIETE. HARMONIE,
     ARPEGE y GEM solo salen ahí. Nombrar un modelo que no puede
     seleccionar, sin decirle dónde verlo, es dejarle buscando. */
  const enSelector = new Set(MODELS.map(m => m.name));
  const deFuera = otros.filter(x => !enSelector.has(x.nom)).map(x => x.nom);

  return {
    quien: otros.length ? listar(otros.map(x => x.nom)) : null,
    /* Los que solo están en la comparativa de Torre, para poder decirlo. */
    soloEnTorre: deFuera.length ? listar(deFuera) : null,
    /* El MISMO modelo, leído en la celda de al lado. Nunca en `quien`. */
    enLaOtraCelda: elMismo ? elMismo.mm : null,
    mm: peor.mm,
    sirimiri,
    cuantos: otros.length,
  };
}

/** Lo mismo que `lluviaQueNoVesTu()`, pero MIRANDO HACIA DELANTE.
 *
 *  POR QUÉ EXISTE. Aitor, el 30-08-2026 a las 14:28, con la pantalla
 *  delante y señalando dos casillas que están una al lado de la otra:
 *
 *      «pone 0mm pero ya te esta diciendo que 2 marcan agua entonces
 *       ese 0mm creo que no pinta no?»
 *      «proxima lluvia no se espera...eso mal no?»
 *
 *  Y tenía razón en las dos. Con el Automático puesto en Bermeo, la
 *  ficha decía a la vez:
 *
 *      Precipitación   0 mm   ⚠ Automático no ve agua · ECMWF y
 *                             HARMONIE sí (sirimiri)
 *      Próxima lluvia  no se espera · 0,0 mm en las próximas 24 h
 *
 *  MEDIDO ese mismo día para la franja de 14 a 20 h, por las dos vías
 *  (la app y api.open-meteo.com, que coincidieron): ECMWF **2,3 mm** y
 *  GFS **0,8 mm**, con código de llovizna. O sea que sí se esperaba.
 *
 *  «No se espera» no era un hueco: era una AFIRMACIÓN de calma sobre
 *  algo que no se había mirado —solo se miraba el modelo cargado—, y
 *  encima en verde. Es el mismo error que el vigilante que escribió
 *  «MARKINA, tranquilo» mirando cuatro horas de un día entero.
 *
 *  Aquí se mira lo que ven los DEMÁS en las próximas 24 h, con el mismo
 *  listón de 0,2 mm que usa `proxima`, para poder decir la hora en vez
 *  de callar. No promedia ni elige: dice quién y cuándo.               */
function lluviaQueVieneYNoVesTu() {
  const H = deEsteSitio(S.comparativa)?.hourly;   // la de ESTE sitio, no la del anterior
  if (!H?.time) return null;

  const ahora = Date.now();
  const i0 = H.time.findIndex(t => new Date(t).getTime() + 3600e3 > ahora);
  if (i0 < 0) return null;
  const hasta = Math.min(i0 + 25, H.time.length);

  const cargado = nombreDeModelo(duenoLluvia());   // el dueño de la lluvia, no el de pantalla
  const enSelector = new Set(MODELS.map(m => m.name));

  /* Para cada modelo que NO sea el cargado: cuándo la ve por primera vez
     y cuánta agua da en total en esas 24 h. El modelo cargado se excluye
     a propósito: si él ya la viera, `proxima` no sería null y esta
     función ni se llamaría. */
  const otros = [];
  for (const m of COMPARAR) {
    if (m.name === cargado) continue;
    const serie = H[`precipitation_${m.om}`];
    if (!serie) continue;
    let cuando = null, primera = null, total = 0;
    for (let i = i0 + 1; i < hasta; i++) {
      const mm = serie[i];
      if (!has(mm)) continue;
      total += mm;
      if (primera === null && mm > 0) primera = H.time[i];
      if (cuando === null && mm >= (S.thr?.rainWarn ?? 0.2)) cuando = H.time[i];
    }
    /* ── EL SIRIMIRI TAMBIÉN ES «PRÓXIMA LLUVIA» ──────────────────────
       Cazado el 31-08-2026 con dos bloques de la MISMA pantalla en
       contra: aquí se exigía una hora suelta con ≥0,2 mm, así que el
       sirimiri de 0,1+0,1+0,1 no contaba nunca y la tarjeta decía en
       verde «ninguno de los modelos la ve»… mientras el chip de la
       franja de al lado decía «GEM y ICON sí (0,3 mm)» — porque el chip
       SUMA con el mismo listón de 0,2. Mismo listón, misma cuenta: si
       el ACUMULADO de la ventana llega a 0,2, es próxima lluvia, y la
       hora que se da es la primera con agua. Es exactamente el sirimiri
       que la app existe para no perderse (26-08, 30-08). */
    if (cuando === null && total >= (S.thr?.rainWarn ?? 0.2)) cuando = primera;
    if (cuando !== null) otros.push({ nom: m.name, cuando, total });
  }
  if (!otros.length) return null;

  /* La MÁS TEMPRANA manda: es la que le cambia la salida. */
  otros.sort((a, b) => new Date(a.cuando) - new Date(b.cuando));
  const deFuera = otros.filter(x => !enSelector.has(x.nom)).map(x => x.nom);

  return {
    hora: new Date(otros[0].cuando),
    quien: listar(otros.map(x => x.nom)),
    soloEnTorre: deFuera.length ? listar(deFuera) : null,
    /* Del que la ve antes, que es el que marca la hora que se enseña. */
    mm24: otros[0].total,
    cuantos: otros.length,
  };
}

/** Lo mismo, pero para UNA FRANJA concreta (mañana, tarde, noche).
 *
 *  Por dónde empezó todo, el 30-08-2026: Aitor probando los cinco
 *  modelos uno a uno en Bermeo y mirando el recuadro de la tarde.
 *  MEDIDO ese día para la franja de 14 a 20 h, mismas dos vías:
 *
 *      ECMWF 2,3 mm (llovizna las 7 h)  ·  GFS 0,8 mm (desde las 16 h)
 *      Automático 0,0  ·  ICON 0,0  ·  AROME HD 0,0
 *
 *  Con Automático o AROME puestos, el recuadro decía «Sin lluvia ·
 *  0,0 mm» y nada más. El 0,0 es verdad —es lo que ve ese modelo— pero
 *  a secas se lee «aquí no cae nada», que es justo lo que la regla 2 de
 *  esta app no permite. El sirimiri de costa lo ve uno y no lo ven los
 *  otros: medido en Bermeo el 26-08, cuando solo ECMWF acertó.
 *
 *  Devuelve `null` si no hay nada que añadir. No cambia el número: le
 *  pone al lado quién ve agua, igual que `avisoCielo()` con las nubes. */
function lluviaEnLaFranjaQueNoVesTu(desde, hasta) {
  const H = deEsteSitio(S.comparativa)?.hourly;   // la de ESTE sitio, no la del anterior
  if (!H?.time || !desde || !hasta) return null;

  const a = desde.getTime(), b = hasta.getTime();
  const cargado = nombreDeModelo(duenoLluvia());   // el dueño de la lluvia, no el de pantalla
  const enSelector = new Set(MODELS.map(m => m.name));

  const otros = [];
  for (const m of COMPARAR) {
    if (m.name === cargado) continue;
    const serie = H[`precipitation_${m.om}`];
    if (!serie) continue;
    let total = 0;
    const horas = [];                 // a qué horas moja ese modelo (09-09-2026)
    for (let i = 0; i < H.time.length; i++) {
      const t = new Date(H.time[i]).getTime();
      if (t < a || t > b) continue;
      if (has(serie[i])) { total += serie[i]; if (serie[i] > 0) horas.push({ date: new Date(H.time[i]) }); }
    }
    if (total >= (S.thr?.rainWarn ?? 0.2)) otros.push({ nom: m.name, total, horas });
  }
  if (!otros.length) return null;

  otros.sort((x, y) => y.total - x.total);
  const deFuera = otros.filter(x => !enSelector.has(x.nom)).map(x => x.nom);
  /* Suyo, 09-09-2026: «¿a qué horario se refiere?». Las horas del que
     más agua ve, con la misma regla que las tormentas (rangoHoras). */
  const cuando = otros[0].horas.length ? rangoDeHoras(otros[0].horas) : '';
  return {
    quien: listar(otros.map(x => x.nom)),
    soloEnTorre: deFuera.length ? listar(deFuera) : null,
    mm: otros[0].total,
    cuantos: otros.length,
    cuando,
  };
}

/* ---------- Concordancia entre modelos ─────────────────────────────
   Por qué existe: los modelos discrepan, y a veces mucho. Medido en
   Bermeo a la misma hora: GFS 10,8 · ECMWF 18,0 · AROME 27,0 · ICON
   29,9 km/h de ráfaga. Casi el triple entre el más bajo y el más alto.

   Mirar un solo modelo puede darte una falsa tranquilidad. Aquí se
   piden los cuatro a la vez y se muestra lo que dice cada uno, sin
   promediar: un promedio escondería justo lo que necesitas ver, que es
   el desacuerdo. La decisión la tomas tú viendo el abanico completo.  */

/* SIETE, NO CUATRO. Ampliado el 27-08-2026 y con la medida delante.

   El día antes, la sesión de comparativas encontró tres modelos que
   Open-Meteo sirve y que no estábamos mirando —y que se ven en Ventusky,
   que es de donde salió la idea—. Dos de ellos son de malla fina sobre
   su costa, y el tercero es de otro centro de predicción distinto:

     · HARMONIE (KNMI, 5,5 km)  — geometría mucho mejor que 25 km
     · ARPEGE   (Météo-France)  — el global francés, sobre su zona
     · GEM      (Canadá)        — la opinión MÁS INDEPENDIENTE de todas

   Por qué importa GEM aunque no sea el más fino: los otros seis comparten
   escuela y a veces se equivocan juntos. Un centro distinto es el único
   que puede romper un acuerdo falso.

   MEDIDO ANTES DE PONERLO, sobre sus 15 emplazamientos y 48 h = 720 horas:

       horas que rozan su 45 :  134 con cuatro  ->  162 con siete
       horas que pasan su 60 :   32 con cuatro  ->   32 con siete

   **+28 avisos de precaución y CERO rojos de más.** Gana sensibilidad
   justo donde hace falta —el aviso que le hace mirar el anemómetro— sin
   añadir ni un «no apto» que no estuviera ya. Y el 27-08 quedó medido que
   los modelos no fallan de media: fallan **en la hora del pico**, que es
   la única que decide. Cuantos más entren, más difícil que se escape.

   Y es lo que pidió él el 26-08: *«lo suyo enseñar todos, más seguros
   estaremos»*. No se promedian nunca: el desacuerdo ES la información. */
/* ── LOS QUE ÉL MIRA, Y NO MÁS ──────────────────────────────────────
   Suyo, 02-09-2026, después de decir que con tanto dato no sabía dónde
   mirar: *«y con que sepa el europeo, AROME, ICON y alguno fiable más,
   el resto sobra»* · *«GFS sí»*.

   Eran SIETE. Cada uno pone una barra en cada bloque y en cada
   emplazamiento, y encima entra en los avisos de desacuerdo: cuantos
   más hay, más veces salta alguno sin que le cambie nada.

   Se quedan los cuatro que él nombra más el **Automático**, que no es un
   modelo suyo: es el que tiene puesto, y sin él no habría con qué
   comparar lo que ve en pantalla.

   Fuera **HARMONIE** (KNMI, holandés) y **GEM** (canadiense). No es que
   sean malos: es que él no los usa para decidir y estaban pagando sitio
   en las cuatro filas de veinte tarjetas.

   Y fuera **ARPEGE** de esta lista, que llevaba el cielo hasta hoy: al
   pasar el cielo al europeo se queda sin papel aquí. Sigue existiendo en
   el reparto por si hay que volver, y en el selector de modelos.

   Si algún día quiere volver a verlos, se añaden aquí y ya. */
const COMPARAR = [
  { om:'best_match',                  name:'Automático', res:'variable' },
  { om:'ecmwf_ifs025',                name:'ECMWF',    res:'25 km' },
  { om:'meteofrance_arome_france_hd', name:'AROME HD', res:'1,3 km' },
  { om:'icon_seamless',               name:'ICON',     res:'7-13 km' },
  { om:'gfs_seamless',                name:'GFS',      res:'13-25 km' },
];

/* ═══ LOS 10 DÍAS, ¿SE CREEN ENTRE ELLOS? ════════════════════════════
   Cazado con su pantallazo del 31-08-2026 a las 17:24: la tarjeta del
   **viernes 4 de septiembre decía 41°** en Bermeo. Eso sería récord
   histórico en la costa vasca, y él lo vio de un vistazo.

   MEDIDO ahí mismo, máxima de ese día en su caseta:

       ECMWF  41,4°     ← el que llevaba cargado
       ICON   34,4°
       GFS    30,3°
       GEM    26,5°

   **Casi quince grados de diferencia**, y la app le enseñaba el 41 a
   pelo. No era un fallo de la app —ECMWF dice eso de verdad— pero un
   número así sin compañía tiene dos salidas malas: o se lo cree, o deja
   de creerse la app entera.

   Es la misma regla que ya rige en el resto: *«si están varios modelos
   de acuerdo, eso da más fiabilidad para decidir»* — el acuerdo es
   información suya, no ruido que haya que esconderle. La ráfaga de la
   hora en curso ya lo avisa desde el 25-08; a diez días no lo hacía
   nadie, y es justo donde más se separan.

   Una sola petición, solo el resumen diario. Si falla, no pasa nada: la
   tarjeta sale como siempre y no se dice nada — nunca se afirma que
   coinciden sin haberlo mirado.                                       */
async function cargarDiariaMulti(place) {
  try {
    const d = await jget(API.fc, {
      latitude: place.lat, longitude: place.lon, timezone: 'auto', wind_speed_unit: 'kmh',
      daily: 'temperature_2m_max,wind_gusts_10m_max,precipitation_sum',
      forecast_days: 10, cell_selection: 'land',
      models: MODELOS_TORMENTA.map(m => m.om).join(','),
    }, { timeout: 15000 });
    /* SELLADO con el sitio (01-09-2026). Antes esto no llevaba marca
       ninguna, así que los dos avisos de la tarjeta de 10 días —el de la
       racha que no ves y el del desacuerdo— podían estar contando lo de
       OTRO emplazamiento sin que nadie pudiera notarlo. */
    S.diariaMulti = d?.daily?.time?.length
      ? Object.assign(d.daily, { clave: `${place.lat.toFixed(3)},${place.lon.toFixed(3)}` })
      : null;
  } catch { S.diariaMulti = null; }
  /* Y SE REPINTA. Llega DESPUÉS del primer pintado, así que sin esta
     línea el aviso no saldría nunca — la trampa de siempre en esta app:
     la función bien escrita y nadie que la use. */
  if (S.view === 'days') renderDays();
}

/** Cuánto se separan los modelos en la máxima de un día. Devuelve null
 *  si no hay con qué comparar: **un hueco no puede leerse como acuerdo**. */
/* ── LA RACHA QUE LA TARJETA DE 10 DÍAS NO TE ENSEÑA ─────────────────
   Cazado el 01-09-2026 y MEDIDO por /om en Bermeo:

     dom 6 sept — la tarjeta pinta **37 en verde** (ECMWF, que es quien
                  rellena del día 3 en adelante) y **ICON da 54**, por
                  encima de su aviso de 45 y camino de su tope de 60.
     mar 9 sept — tarjeta 35, el Automático 46.

   O sea: en la pantalla con la que planifica la semana, un día con una
   racha que le cruza el listón se leía como día tranquilo. Es el mismo
   fallo del 30-08 con la racha de «Ahora» —«si ha fallado en lluvia, en
   viento hará lo mismo»— pero en la vista de diez días, que es la que
   nadie había mirado.

   El criterio NO es un porcentaje inventado: es SU listón. Salta cuando
   otro modelo cruza los 45 (o los 60) y el de la tarjeta no. Igual que
   `rachaQueNoVesTu()` en las otras pantallas. */
function rachaDelDiaQueNoVesTu(fecha) {
  const D = deEsteSitio(S.diariaMulti);
  if (!D?.time?.length) return null;
  const i = D.time.indexOf(fecha);
  if (i < 0) return null;

  const dela = D.wind_gusts_10m_max?.[i]
            ?? S.data?.fc?.daily?.wind_gusts_10m_max?.[D.time.indexOf(fecha)];
  const otros = [];
  for (const m of MODELOS_TORMENTA) {
    const v = D[`wind_gusts_10m_max_${m.om}`]?.[i];
    if (has(v)) otros.push({ nom: m.nom, v });
  }
  if (!otros.length) return null;

  const pinta = has(dela) ? dela : Math.max(...otros.map(o => o.v));
  const cruzan = otros.filter(o =>
    (o.v >= listonRafaga().no   && pinta <  listonRafaga().no) ||
    (o.v >= listonRafaga().warn && pinta <  listonRafaga().warn));
  if (!cruzan.length) return null;

  cruzan.sort((a, b) => b.v - a.v);
  return { peor: cruzan[0], pinta, listón: cruzan[0].v >= listonRafaga().no ? listonRafaga().no : listonRafaga().warn };
}

/* ── ¿ESA AGUA LA VE ALGUIEN MÁS? ───────────────────────────────────
   Suyo, 07-09-2026 desde Calpe, con el jueves y el sábado dibujados con
   lluvia: *«¿jueves nuboso y agua? ¿y el sábado lo mismo?»*. Medido: el
   europeo —dueño de la lluvia por acierto— ponía llovizna de 0,1 mm por
   hora; ICON y GFS, secos del todo.

   El dueño no se cambia —*«cada uno en lo suyo»*, dijo él ese mismo
   día— pero a cinco días vista un agua que solo ve un modelo es un
   «puede», no un «va a», y eso hay que decirlo debajo del dibujo, igual
   que ya se dice con la racha («ICON da 64, tu listón es 60»).

   Se cuenta cuántos modelos con dato diario pasan de 0,5 mm en el día
   (medio milímetro: por debajo, los modelos bailan solos). Si hay tres
   o más opiniones y como mucho una moja, se avisa nombrándola.        */
function aguaDelDiaQueNoVenTodos(fecha) {
  const D = deEsteSitio(S.diariaMulti);
  if (!D?.time?.length) return null;
  const i = D.time.indexOf(fecha);
  if (i < 0) return null;
  const con = [], mojan = [];
  for (const m of MODELOS_TORMENTA) {
    if (m.om === 'best_match') continue;                 // mezcla de los otros
    const v = D[`precipitation_sum_${m.om}`]?.[i];
    if (!has(v)) continue;
    con.push({ nom: m.nom, v });
    if (v >= 0.5) mojan.push({ nom: m.nom, v });
  }
  if (con.length < 3 || mojan.length > 1) return null;
  const secos = con.filter(x => x.v < 0.5).map(x => x.nom);
  return { n: con.length, mojan, secos };
}

function desacuerdoDelDia(fecha) {
  const D = deEsteSitio(S.diariaMulti);
  if (!D?.time?.length) return null;
  const i = D.time.indexOf(fecha);
  if (i < 0) return null;
  const vals = [];
  /* ── EL AUTOMÁTICO SÍ CUENTA. MEDIDO EL 04-09-2026 ─────────────────
     Aquí ponía que el Automático quedaba fuera «porque es una costura
     de los otros, no una opinión independiente». **Eso era falso**, y
     se comprobó pidiendo los datos de Bermeo a diez días:

       dom 6 · racha: ECMWF 40 · ICON 37 · GFS 20 · AROME sin dato
                      · **Automático 65**
       dom 6 · máxima: ECMWF 33 · ICON 29 · GFS 33 · **Automático 30**

     Un 65 que ninguno de los cuatro da, y un 30 que tampoco. No estaba
     repitiendo a nadie: traía datos propios.

     Y se averiguó de quién: **es ARPEGE**, de Météo-France, que cuadra
     clavado los días que ARPEGE publica (65 y 65, 24 y 24, 30 y 30).
     Open-Meteo sirve AROME HD los tres primeros días y salta a ARPEGE
     cuando AROME se acaba. Los dos de Météo-France, como el suyo.

     Dejarlo fuera del rango escondía desacuerdo de verdad: el lunes 7
     él veía «de 24° a 27°» cuando la horquilla iba de 23° a 27°.

     Y no hay doble conteo: de aquí solo salen el máximo y el mínimo,
     así que un modelo repetido no mueve nada; uno distinto, sí. */
  for (const m of MODELOS_TORMENTA) {
    const v = D[`temperature_2m_max_${m.om}`]?.[i];
    if (has(v)) vals.push({ nom: m.nom, v });
  }
  if (vals.length < 3) return null;          // con dos no hay «acuerdo» que valga
  vals.sort((a, b) => b.v - a.v);
  const alto = vals[0], bajo = vals[vals.length - 1];
  return { alto, bajo, dif: alto.v - bajo.v, n: vals.length };
}

async function cargarComparativa(place) {
  try {
    const d = await jget(API.fc, {
      latitude: place.lat, longitude: place.lon, timezone: 'auto', wind_speed_unit: 'kmh',
      /* La lluvia va aquí aunque esta comparativa naciera para el viento:
         es la MISMA consulta, así que no cuesta ni una petición más, y
         hace falta para no enseñarle un 0,0 mm mientras le llueve
         encima. Ver `lluviaQueNoVesTu()`. */
      /* Las nubes van aquí desde el 28-08-2026, y en la MISMA consulta:
         no cuesta ni una petición más. Motivo: esa mañana él mandó una
         foto del cielo de Bermeo, azul con cuatro hebras altas, y el
         Automático daba **100 %** — con 0 % la hora antes y 0 % la hora
         después. Un pico de una hora entre ceros, igual que el «Cubierto»
         de Sollube del día anterior: la costura entre modelos.
         Seis de los siete daban 0-6 %. */
      hourly: 'wind_gusts_10m,wind_speed_10m,temperature_2m,precipitation,weather_code,'
            + 'cape,convective_inhibition,cloud_cover,'
            /* Y las tres capas desde el 28-08. Ver `nubesPorCapas()`: el
               total se las come y esa noche le enseñó 27 % con el cielo
               tapado. Misma consulta, ni una petición más. */
            + 'cloud_cover_low,cloud_cover_mid,cloud_cover_high,'
            /* ── Y EL BOCHORNO, DESDE EL 29-08-2026 ──────────────────
               Suyo: *«poner dato de visibilidad, humedad y punto de rocío
               a 2 m, con eso se sabe si hay bochorno»* · *«datos, que hay
               sitio»*.

               MEDIDO antes de montarlo, los siete modelos y 48 h en
               Bermeo: **rocío y humedad los dan los siete, sin un hueco.
               La visibilidad solo tres** —HARMONIE, ICON y GFS—, y de los
               que faltan uno es **AROME HD, el que él mira en la costa**.
               Por eso la visibilidad NO va por modelo: una fila con
               cuatro huecos de siete no es una fila, es un colador.

               Los cuatro campos, siete modelos, 48 h: **8 KB**. Nada. */
            + 'dew_point_2m,relative_humidity_2m,visibility',
      models: COMPARAR.map(m => m.om).join(','),
      forecast_days: 2, past_hours: 1,
    }, { timeout: 15000 });
    /* Aquí salió el −10 de ECMWF: las columnas por modelo también se
       limpian, que es donde él lo vio. */
    d.imposibles = sanear(d.hourly);
    /* ── LA COMPARATIVA SE SELLA CON SU SITIO ─────────────────────────
       Cazado el 01-09-2026: `peorRacha()` la lee para el semáforo, pero
       `assess()` corre dentro de `buildHours()` **para los veinte
       emplazamientos** de «Mis estaciones», y esta comparativa es solo
       del sitio ABIERTO. O sea que el color de cada fila, su tira de
       horas y el motivo «lo dice ICON» se calculaban con las rachas
       medidas EN OTRO SITIO.

       Con veinte emplazamientos —y con uno que arrastra a otros veinte
       si se cae— eso no es un detalle: es mandar gente con el color
       equivocado. Se sella con la clave del sitio y quien la use tendrá
       que demostrar que es la suya. */
    d._sitio = key(place);
    S.comparativa = d;
  } catch { S.comparativa = null; }
  renderComparativa();

  /* Y SE REPINTA LO QUE DEPENDE DE ESTO.
     Sin esta línea el arreglo del 26-08-2026 habría nacido muerto: la
     comparativa llega DESPUÉS de pintar la pantalla, y al llegar solo se
     repintaba ella. El aviso de «tu modelo no ve el agua que ve otro»
     vive en la ficha de la torre y en «Ahora», y esos ya estaban
     pintados con `S.comparativa` todavía a null — así que el aviso no
     habría salido nunca.

     Es la misma trampa de siempre: la función bien escrita y nadie que
     la llame en el momento bueno. */
  if (S.data) {
    seguro('torre', renderTower);
    seguro('ahora', renderNow);
    /* ── Y TAMBIÉN «HORAS» Y «10 DÍAS» (09-09-2026) ──────────────────
       Aquí estaba una de las causas de «cada apartado marcaba una cosa»:
       la votación del cielo (cieloVotado, 06-09) cambia el código de
       cada hora, pero al llegar solo se repintaban «Ahora» y la ficha de
       la torre. «Horas» y «10 días» se quedaban con el cielo de ANTES de
       votar, y así un día entero. */
    seguro('horas', renderHours);
    seguro('días',  renderDays);
    vigilarCielo('comparativa');
  }
}

function renderComparativa() {
  const el = $('#comparativa');
  if (!el) return;
  /* Por la puerta: la tabla de modelos es DE UN SITIO, y al cambiar de
     emplazamiento tardaba en llegar la nueva mientras seguía pintada la
     del anterior (01-09-2026). */
  const d = deEsteSitio(S.comparativa);
  if (!d?.hourly?.time) {
    el.innerHTML = `<p class="note">No se ha podido comparar modelos ahora mismo.</p>`;
    return;
  }
  const H = d.hourly;
  // Hora en curso dentro de esta respuesta
  const ahora = Date.now();
  let i = H.time.findIndex(t => new Date(t).getTime() + 3600e3 > ahora);
  if (i < 0) i = 0;

  const filas = COMPARAR.map(m => ({
    ...m,
    racha: H[`wind_gusts_10m_${m.om}`]?.[i],
    viento: H[`wind_speed_10m_${m.om}`]?.[i],
  })).filter(f => has(f.racha) || has(f.viento));

  if (!filas.length) {
    el.innerHTML = `<p class="note">Ningún modelo da dato para este punto.</p>`;
    return;
  }

  const rachas = filas.map(f => f.racha).filter(has);
  const min = Math.min(...rachas), max = Math.max(...rachas);
  const dif = max - min;

  // ¿Alguno supera tus umbrales?
  const algunoNo   = rachas.some(r => r >= listonRafaga().no);
  const algunoWarn = rachas.some(r => r >= listonRafaga().warn);
  const todosNo    = rachas.every(r => r >= listonRafaga().no);

  let nivel, titulo, texto;
  if (todosNo) {
    nivel = 'no'; titulo = 'Todos los modelos superan tu límite';
    texto = 'Coinciden en que no son condiciones para subir.';
  } else if (algunoNo) {
    nivel = 'no'; titulo = 'Hay modelos que superan tu límite y otros no';
    texto = 'Basta con que uno acierte. La única forma de saberlo es medir en el sitio.';
  } else if (dif >= 25) {
    nivel = 'warn'; titulo = 'Los modelos discrepan mucho';
    texto = `Entre el más flojo y el más fuerte hay ${difVista(max, min, true)} de diferencia. Ninguno es de fiar aquí: el anemómetro en el sitio es lo único que lo resuelve.`;
  } else if (algunoWarn) {
    nivel = 'warn'; titulo = 'Alguno se acerca al umbral que pusiste para avisar';
    texto = 'Margen escaso. Contrasta en el emplazamiento.';
  } else if (dif >= 12) {
    nivel = 'warn'; titulo = 'Diferencias apreciables entre modelos';
    texto = `${difVista(max, min, true)} de separación. Ninguno supera tus límites, pero el margen no es tan holgado como parece con uno solo.`;
  } else {
    nivel = 'go'; titulo = 'Los modelos coinciden';
    texto = `Solo ${difVista(max, min, true)} de diferencia entre ellos y ninguno llega a tus umbrales. Previsión fiable.`;
  }

  /* ── Y la temperatura, cuando se abren de verdad ───────────────────
     Aitor lo dijo el 25-08-2026: «cada web del tiempo da datos del viento
     o rachas diferentes, varias, 2 grados etc — es normal». Y tiene razón
     en un día tranquilo. Lo que no es normal es lo que pasa el día que
     importa.

     MEDIDO ese día sobre sus 8 emplazamientos, separación entre el modelo
     más frío y el más caliente en la máxima del día:

       hoy, día tranquilo ...... 1,4 ° de media, 2,4 ° el peor
       miércoles, inestable .... 4,7 ° de media, 6,3 ° el peor (Bilbao:
                                 ICON 29, ECMWF 30, AROME 36)

     Por eso el corte está en 3 °: por encima de cualquier cosa vista en
     un día tranquilo. Se mira la MÁXIMA de las próximas 24 h, no la hora
     en curso, porque el calor decide a quién mandas y a qué hora, no
     ahora mismo. */
  const SEP_TEMP = 3;
  const tMax = COMPARAR.map(m => {
    const serie = H[`temperature_2m_${m.om}`];
    if (!serie) return null;
    const v = [];
    for (let k = i; k < H.time.length && k < i + 24; k++) if (has(serie[k])) v.push(serie[k]);
    return v.length ? { nom: m.name, t: Math.max(...v) } : null;
  }).filter(Boolean);
  const sepT = tMax.length > 1
    ? Math.max(...tMax.map(x => x.t)) - Math.min(...tMax.map(x => x.t)) : 0;
  const lineaT = sepT >= SEP_TEMP ? (() => {
    const frio = tMax.reduce((a, b) => b.t < a.t ? b : a);
    const cal  = tMax.reduce((a, b) => b.t > a.t ? b : a);
    /* ── LA RESTA TIENE QUE CUADRAR CON LO QUE SE VE ────────────────
       Suyo, 04-09-2026, con su pantallazo: salía «Automático da 28° y
       ECMWF da 35° — 6° de diferencia». Y 35 menos 28 son 7.

       No había ningún error de cuenta: los tres números se redondeaban
       por separado. 28,4 → 28. 34,6 → 35. Y la diferencia de verdad,
       6,2 → 6. Cada uno bien por su cuenta y los tres juntos, mal.

       Tres cifras a la vista que no cuadran entre ellas le hacen dudar
       de TODA la pantalla, y con razón. Así que la diferencia se calcula
       con los números REDONDEADOS, los que él está leyendo. La decisión
       de enseñar el aviso o no sigue tomándose con el dato sin redondear
       —eso es medir—; lo que cambia es lo que se escribe. */
    const tFrio = Math.round(frio.t), tCal = Math.round(cal.t);
    return `<div class="cmp__t" data-s="warn">
      <b>Y tampoco coinciden en el calor.</b> Para la máxima de las próximas 24 h,
      ${esc(frio.nom)} da <b>${tFrio}°</b> y ${esc(cal.nom)} da
      <b>${tCal}°</b> — <b>${tCal - tFrio}° de diferencia</b>.
      En un día tranquilo no llegan a 2,5°: cuando se abren así es que no lo saben.
      Con el de arriba, un poste a la intemperie o una azotea a mediodía es otro trabajo.
    </div>` ; })() : '';

  const tope = Math.max(max, listonRafaga().no) * 1.15;
  const hora = new Date(H.time[i]).toLocaleString('es', { weekday:'long', hour:'2-digit', minute:'2-digit' });

  el.innerHTML = `
    <div class="cmp__v" data-s="${nivel}">
      <b>${esc(titulo)}</b>
      <p>${esc(texto)}</p>
    </div>
    ${lineaT}
    <!-- «10 M» Y «10:00» EN LA MISMA LÍNEA. Suyo, 28-08-2026: *«ráfaga
         10 m a 10:00 — entiendo que será a las 10 h; mejor poner 10am o
         algo así si se refiere a las horas, por no liarla»*. Y es que
         los dos dieces son cosas distintas: uno es la altura sobre el
         suelo y el otro la hora. Se escriben con todas las letras —
         «a 10 metros de altura» y «10:00 h»— que ocupa dos palabras más
         y no hay forma de confundirlos. -->
    <div class="cmp__h">Ráfaga a 10 metros de altura · ${esc(hora)} h</div>
    ${filas.map(f => {
      const st = !has(f.racha) ? 'nd'
        : f.racha >= listonRafaga().no ? 'no' : f.racha >= listonRafaga().warn ? 'warn' : 'go';
      const pc = has(f.racha) ? clamp(f.racha / tope * 100, 2, 100) : 0;
      return `<div class="cmp__f" data-s="${st}">
        <span class="cmp__n">${f.name}<small>${f.res}</small></span>
        <span class="cmp__b"><i style="width:${pc}%"></i></span>
        <span class="cmp__val">${has(f.racha) ? wtxt(f.racha, true) : nd}</span>
      </div>`;
    }).join('')}
    <div class="cmp__lim" style="--pcw:${clamp(listonRafaga().warn / tope * 100, 0, 100)}%;
                                 --pcn:${clamp(listonRafaga().no   / tope * 100, 0, 100)}%">
      <span>Tus umbrales: avisas desde ${wtxt(listonRafaga().warn, true)} · tu tope ${wtxt(listonRafaga().no, true)}</span>
    </div>
    <p class="note">No se promedia a propósito: la media escondería el desacuerdo,
    que es justo lo que necesitas ver. AROME es el de más resolución sobre Euskadi
    y suele ver mejor los cordales; los globales aplanan la montaña.</p>
    ${tablaLluvia(H, i, hora)}
    ${tablaTormenta(H, i, hora)}
    ${tablaNubes(H, i, hora)}
    ${tablaBochorno(H, i, hora)}`;
}

/* ── LA TORMENTA, MODELO A MODELO ─────────────────────────────────────
   Suyo, 26-08-2026, justo después de pedir la de lluvia: *«LLUVIA Y
   TORMENTA»*. Y es lo primero, no lo segundo: el rayo es **su veto**.
   Con sirimiri puede ir a la caseta; con rayo no se acerca a la torre,
   porque la torre está pegada a la caseta y hace de pararrayos.

   HACEN FALTA LAS DOS COSAS A LA VEZ y en la misma hora: gasolina
   (CAPE ≥ 700) y **la tapa abierta** (inhibición por debajo de 75). Una
   sola no rompe nada. Ese es el criterio de toda la app y aquí se aplica
   igual.

   Y HAY QUE DECIR QUIÉN NO PUEDE OPINAR. ECMWF y AROME HD **no publican
   la tapa**. Eso no es «no ven tormenta»: es que no lo saben. Un hueco
   callado se lee como un no, y ese es el error que más veces ha estado a
   punto de colarse en esta app. Aquí sale escrito.                    */
function tablaTormenta(H, i, hora) {
  const filas = COMPARAR.map(m => ({
    name: m.name, res: m.res,
    cape: H[`cape_${m.om}`]?.[i],
    cin: H[`convective_inhibition_${m.om}`]?.[i],
  })).filter(f => has(f.cape));

  if (!filas.length) return '';

  const sabe = f => has(f.cin);
  const salta = f => sabe(f) && f.cape >= CAPE_COMBINACION && f.cin < 75;
  const alFilo = f => sabe(f) && f.cape >= CAPE_COMBINACION && !salta(f);

  const losQueSaben = filas.filter(sabe);
  const losQueSaltan = filas.filter(salta);
  const mudos = filas.filter(f => !sabe(f));
  const tope = Math.max(...filas.map(f => f.cape), CAPE_COMBINACION);

  let cab;
  if (!losQueSaben.length) {
    cab = { s: 'nd', t: 'Ninguno publica la tapa aquí',
            x: 'Sin la inhibición no se puede decir si salta. Mira el parte de Mis '
               + `estaciones, que usa ${(COBERTURA.convective_inhibition || [])
                    .map(om => nombreDeModelo(om)).join(' y ') || 'los que la publican'}.` };
  } else if (!losQueSaltan.length) {
    cab = { s: 'go', t: 'Ninguno de los que saben ve tormenta',
            x: `${listar(losQueSaben.map(f => f.name))} publican la tapa: sigue puesta con la gasolina que hay.` };
  } else if (losQueSaltan.length === losQueSaben.length) {
    cab = { s: 'no', t: 'Todos los que saben ven tormenta',
            x: 'Coinciden los que publican la tapa.' };
  } else {
    cab = { s: 'no', t: `${losQueSaltan.length} de ${losQueSaben.length} ven tormenta`,
            x: `${listar(losQueSaltan.map(f => f.name))} sí y ${
                 listar(losQueSaben.filter(f => !salta(f)).map(f => f.name))} no. `
             + 'Basta con que uno acierte: el rayo no admite promedios.' };
  }

  return `
    <div class="cmp__v" data-s="${cab.s}" style="margin-top:14px">
      <b>${esc(cab.t)}</b><span>${esc(cab.x)}</span>
    </div>
    <div class="cmp__h">Tormenta · CAPE con su tapa · ${esc(hora)}</div>
    ${filas.map(f => {
      const pc = clamp(f.cape / tope * 100, f.cape > 0 ? 4 : 0, 100);
      const st = salta(f) ? 'no' : alFilo(f) ? 'warn' : sabe(f) ? 'go' : 'nd';
      const tapa = sabe(f)
        ? `<em class="cmp__tap">tapa ${nCape(f.cin)}${salta(f) ? ' · ABIERTA' : ''}</em>`
        : `<em class="cmp__tap cmp__tap--no">no publica la tapa</em>`;
      return `<div class="cmp__f" data-s="${st}">
        <span class="cmp__n">${esc(f.name)}<small>${esc(f.res)}</small></span>
        <span class="cmp__b"><i style="width:${pc}%"></i></span>
        <span class="cmp__val">${nCape(f.cape)}<small> J/kg</small>${tapa}</span>
      </div>`;
    }).join('')}
    <p class="note">Hacen falta <b>las dos cosas y en la misma hora</b>: CAPE ≥ 700
    y la tapa por debajo de 75. ${mudos.length
      ? `<b>${esc(listar(mudos.map(f => f.name)))}</b> no ${mudos.length === 1 ? 'publica' : 'publican'}
         la tapa: eso no es que no vea${mudos.length === 1 ? '' : 'n'} tormenta, es que <b>no lo sabe${mudos.length === 1 ? '' : 'n'}</b>. `
      : ''}<b>Esto dice si PUEDE, no si ha caído</b>: para descargas medidas, la pestaña Rayos.</p>`;
}

/* ── LA LLUVIA, MODELO A MODELO ───────────────────────────────────────
   Suyo, 26-08-2026, después de que le contara que solo ECMWF veía la
   llovizna de Bermeo: *«¿dónde pone esto?»*.

   Y no ponía en ningún sitio: esa tabla se la di yo preguntando a los
   cinco modelos por fuera. La app decía «lo ve ECMWF» en el parte y un
   0,0 pelado en la ficha, pero **el abanico completo no se veía**.

   Aquí está, con el mismo criterio que la del viento: **sin promediar**.
   Una media de 0,4 · 0 · 0 · 0 da 0,1 y se lee «no llueve» — y esa tarde
   estaba lloviendo. El desacuerdo ES la información.

   Y con lo suyo delante: **sirimiri no es «poca lluvia», es no subir**.  */
/* ── LAS NUBES, MODELO A MODELO ───────────────────────────────────────
   Suyo, 28-08-2026: *«al igual que rachas hay que meter lluvia y
   nubosidad de los modelos que dice»* · *«en mis torres etc y torre»*.

   Y con las CAPAS, no solo el total. Esa misma noche, desde su ventana de
   Bermeo: *«ahora sí que hay más nubes, que antes y más grises, no de esas
   de lluvia»*. La app decía **27 %**. El modelo tenía **medias 59** con
   **bajas 0**: el total de Open-Meteo las combina y se las come.

   Lo que daba cada uno a esa hora, medido:

       ICON        bajas 14 · medias 54 · altas  0     <- acierta
       ECMWF       bajas  1 · medias 37 · altas 48     <- acierta
       GFS         bajas  0 · medias  0 · altas  5
       AROME HD    no publica el total. Ni una hora de 168
       Automático  bajas  0 · medias  0 · altas  0

   Sus ojos le dieron la razón a ICON y a ECMWF. Por eso aquí no se
   promedia ni se esconde: las tres capas de cada uno, y quién no lo
   publica marcado aparte, que no es lo mismo que un cero. */
/* ── EL BOCHORNO, MODELO A MODELO ─────────────────────────────────────
   Suyo, 29-08-2026: *«poner dato de visibilidad, humedad y punto de rocío
   a 2 m, con eso se sabe si hay bochorno»*.

   Y NO ES CURIOSIDAD. Sus operarios trabajan **dentro de casetas y en
   azoteas, al sol**. El bochorno se lee por el **punto de rocío**, no por
   la humedad relativa: un 90 % de humedad a 8 grados no agobia y a 22 sí.
   Con el rocío por encima de 18 el sudor deja de evaporar y el golpe de
   calor llega antes aunque el termómetro no marque nada raro. Es el mismo
   dato con el que se decide parar en obra.

   MEDIDO antes de montarlo (siete modelos, 48 h, Bermeo): **rocío y
   humedad los publican los siete**. La visibilidad solo tres, así que esa
   se queda fuera de aquí — ver `tablaNubes` para el mismo criterio.

   Y ese día había **4,5 grados de diferencia** entre HARMONIE (16,5) y
   GFS (12,0), justo cruzando el listón: dos decían «se nota» y cinco
   «cómodo». Ese desacuerdo es exactamente lo que pidió poder ver.

   LA PALABRA VA AL LADO DE LA CIFRA, PERO NO DECIDE NADA. Su regla:
   *«tú me pones los valores y yo valoraré»*. Ningún semáforo nuevo. */
function comoSeSiente(rocio) {
  if (!has(rocio)) return '';
  if (rocio < 16) return 'cómodo';
  if (rocio < 18) return 'se nota';
  if (rocio < 21) return 'bochorno';
  return 'agobiante';
}

function tablaBochorno(H, i, hora) {
  const filas = COMPARAR.map(m => ({
    name: m.name, res: m.res,
    r: H[`dew_point_2m_${m.om}`]?.[i],
    hr: H[`relative_humidity_2m_${m.om}`]?.[i],
  })).filter(f => has(f.r)).sort((a, b) => b.r - a.r);

  if (filas.length < 2) return '';

  const alto = filas[0].r, bajo = filas.at(-1).r;
  const abanico = alto - bajo;
  /* Si unos dicen una cosa y otros otra, eso es lo que hay que cantar —
     no la media, que se comería justo el desacuerdo. */
  const palabras = new Set(filas.map(f => comoSeSiente(f.r)));
  const cab = palabras.size > 1
    ? { s: 'warn', t: 'No coinciden en el bochorno',
        x: `De ${bajo.toFixed(1).replace('.', ',')}° a ${alto.toFixed(1).replace('.', ',')}° de punto de rocío`
         + ` — ${abanico.toFixed(1).replace('.', ',')}° de diferencia, y eso cruza el listón:`
         + ` unos dicen «${filas[0].r >= 16 ? comoSeSiente(alto) : comoSeSiente(bajo)}» y otros`
         + ` «${filas[0].r >= 16 ? comoSeSiente(bajo) : comoSeSiente(alto)}».` }
    : { s: alto >= 18 ? 'warn' : 'go', t: `Todos dicen «${comoSeSiente(alto)}»`,
        x: `Punto de rocío entre ${bajo.toFixed(1).replace('.', ',')}° y ${alto.toFixed(1).replace('.', ',')}°.` };

  const tope = Math.max(alto, 22);
  return `
    <div class="cmp__v" data-s="${cab.s}" style="margin-top:14px">
      <b>${esc(cab.t)}</b><span>${esc(cab.x)}</span>
    </div>
    <div class="cmp__h">Punto de rocío · ${esc(hora)}</div>
    ${filas.map(f => {
      const pc = clamp(f.r / tope * 100, 2, 100);
      const st = f.r >= 18 ? 'warn' : 'go';
      return `<div class="cmp__f" data-s="${st}">
        <span class="cmp__n">${esc(f.name)}<small>${esc(f.res)}</small></span>
        <span class="cmp__b"><i style="width:${pc}%"></i></span>
        <span class="cmp__val">${f.r.toFixed(1).replace('.', ',')}<small> °C</small></span>
      </div>
      <div class="cmp__capas">${esc(comoSeSiente(f.r))}${
        has(f.hr) ? ` · humedad ${Math.round(f.hr)} %` : ''}</div>`;
    }).join('')}
    <p class="note">El bochorno se lee por el <b>punto de rocío</b>, no por la humedad:
    un 90 % a 8° no agobia y a 22° sí. Por encima de <b>18°</b> el sudor no evapora y el
    golpe de calor llega antes, aunque el termómetro no marque nada raro — cuenta sobre
    todo dentro de una caseta o en una azotea. <b>Cómodo</b> por debajo de 16 · <b>se
    nota</b> 16-18 · <b>bochorno</b> 18-21 · <b>agobiante</b> por encima de 21. La cifra
    es del modelo; lo que se hace con ella, tuyo.</p>`;
}

function tablaNubes(H, i, hora) {
  const filas = COMPARAR.map(m => {
    const cap = nubesPorCapas({
      cloud_cover:      H[`cloud_cover_${m.om}`]?.[i],
      cloud_cover_low:  H[`cloud_cover_low_${m.om}`]?.[i],
      cloud_cover_mid:  H[`cloud_cover_mid_${m.om}`]?.[i],
      cloud_cover_high: H[`cloud_cover_high_${m.om}`]?.[i],
    });
    if (!cap) return null;
    const tot = H[`cloud_cover_${m.om}`]?.[i];
    return { name: m.name, res: m.res, cap, tot, mudo: !has(tot),
             suyas: capasPropias(m.om),
             orden: has(tot) ? tot : cap.manda.v };
  }).filter(Boolean).sort((a, b) => b.orden - a.orden);

  if (filas.length < 2) return '';

  const conTotal = filas.filter(f => !f.mudo);
  const abanico = conTotal.length > 1
    ? Math.max(...conTotal.map(f => f.tot)) - Math.min(...conTotal.map(f => f.tot)) : 0;
  /* El caso que le pasó: el total corto y una capa cargada debajo.
     PERO solo cuenta si esas capas son del modelo. Con ECMWF las calcula
     Open-Meteo con la humedad (ver `CAPAS_PROPIAS`), y avisar de que «el
     total se queda corto» comparándolo con una cuenta nuestra sería
     enfrentar lo publicado contra lo calculado. */
  /* LOS DOS SENTIDOS, NO UNO. En sus pantallazos del 29-08 la tabla de
     Torre avisaba de ECMWF (total 8 % con bajas al 17) y **se callaba
     GEM**, que daba total 76 % con las capas sumando 37. El aviso ya
     existía en Mis torres; aquí solo se miraba `noCuadra`. */
  /* ── SOLO LOS QUE PUBLICAN SUS CAPAS ─────────────────────────────
     Suyo, 03-09-2026, después de subir el margen de 1 a 10 puntos:
       *«a ver si es para siempre y no salga a diario»*

     Y tenía razón en dudar: subir el margen NO bastaba. MEDIDO sobre
     168 horas por modelo en Bermeo, cuántas veces saltaría el aviso:

       ECMWF ......  68/168 (40 %)  →  con 10 puntos: 38 (23 %)
       ICON .......   0            →   0
       GFS ........   0            →   0
       Automático .   6 ( 4 %)     →   3 ( 2 %)

     O sea: con el margen nuevo **ECMWF seguía saltando una hora de cada
     cuatro**, y ECMWF es justo el que lleva su cielo. Le habría salido a
     diario igual.

     Porque el margen no era el problema: **las capas de ECMWF no son
     suyas**, se las calcula Open-Meteo con la humedad (ver
     `CAPAS_PROPIAS`). Comparar el total del modelo con una cuenta ajena
     descuadra por definición, no por un fallo.

     Con el filtro puesto: **0 de 672 horas**. El aviso queda para los que
     sí publican sus capas —ICON, GFS, ARPEGE—, que es donde un descuadre
     significa algo de verdad. Ahí sigue saltando el disparate del 29-08:
     total 3 % con las altas al 47 %. */
  const cortos = filas.filter(f => (f.cap.noCuadra || f.cap.sinExplicar)
                                    && f.suyas === true);

  let cab;
  if (cortos.length) {
    const peso = f => f.cap.noCuadra ? f.cap.descuadre : f.tot - f.cap.suma;
    const x = cortos.reduce((p2, q) => peso(q) > peso(p2) ? q : p2);
    const cual = x.cap.noCuadra
      ? `un total menor que su capa más cargada, y eso es imposible`
        + ` —${x.name}: total ${Math.round(x.tot)} % con ${x.cap.manda.n} al`
        + ` ${Math.round(x.cap.manda.v)} %—`
      : `un total que sus capas no explican —${x.name}: total`
        + ` ${Math.round(x.tot)} % y sus capas suman ${Math.round(x.cap.suma)} %—`;
    cab = { s: 'warn', t: `Hay números que no cuadran`,
            x: `${cortos.length === 1 ? `${x.name} da` : `${cortos.length} modelos dan`}`
             + ` ${cual}.`
             /* ── SIN LA COLETILLA QUE SE CONTESTA SOLA ─────────────
                Suyo, 03-09-2026, con el aviso en pantalla: decía «Ese
                modelo no publica las capas: el total es suyo y las capas
                son una cuenta hecha con la humedad» — dos renglones para
                explicar el aviso que acababa de dar, y la propia fila del
                modelo ya lleva «calculadas con la humedad» al lado de las
                cifras. El aviso se queda —un total menor que su capa es
                imposible y hay que decirlo— pero en una línea. */
             + (x.suyas === false
                 ? ` Sus capas son calculadas, no del modelo.`
                 : ` No se puede saber cuál de los dos falla.`) };
  } else if (abanico >= 50) {
    cab = { s: 'warn', t: 'No coinciden en el cielo',
            x: `Del que menos al que más hay ${Math.round(abanico)} puntos.`
             + ` Cuando se abren así es que no lo saben: asómate o mira el satélite.` };
  } else {
    cab = { s: 'go', t: 'Coinciden en el cielo',
            x: 'Los modelos ven el mismo cielo, con poca diferencia entre ellos.' };
  }

  return `
    <div class="cmp__v" data-s="${cab.s}" style="margin-top:14px">
      <b>${esc(cab.t)}</b><span>${esc(cab.x)}</span>
    </div>
    <div class="cmp__h">Nubes · ${esc(hora)}</div>
    ${filas.map(f => {
      const pc = clamp(f.orden, 2, 100);
      return `<div class="cmp__f" data-s="${f.mudo ? 'nd'
        : (f.cap.noCuadra || f.cap.sinExplicar) ? 'warn' : 'go'}">
        <span class="cmp__n">${esc(f.name)}<small>${esc(f.res)}</small></span>
        <span class="cmp__b"><i style="width:${pc}%"></i></span>
        <span class="cmp__val">${f.mudo
          ? '<small>sin total</small>'
          : `${Math.round(f.tot)}<small> %</small>`}</span>
      </div>
      <div class="cmp__capas"${f.suyas === false ? ' data-calc="1"' : ''}>${f.cap.linea}${
        f.suyas === false ? ' <em>calculadas con la humedad, no las publica</em>' : ''}</div>`;
    }).join('')}
    <p class="note">El total <b>no es la suma</b> de las capas —se solapan—, pero
    <b>nunca puede ser menor que la mayor</b>: con un 47 % de nubes altas, el cielo
    tapado es al menos un 47 %. Cuando sale menor, esos dos números no salen del
    mismo sitio. Las <b>medias</b> son las grises y espesas, de las que no llueve; las
    <b>bajas</b> son las del sirimiri y las que te tapan la torre; las <b>altas</b>
    dejan pasar el sol. <b>Sin total</b> = ese modelo no lo publica —AROME HD no da ni
    una hora de 168, medido—, no que vea despejado.
    <br><b>Y no todas las capas valen igual.</b> Comprobado en la documentación de cada
    uno: <b>ICON</b>, <b>GFS</b> y <b>ARPEGE</b> publican sus capas. <b>ECMWF no</b>
    —sus datos abiertos solo llevan el total—, así que las suyas se las calcula
    Open-Meteo con la humedad. De HARMONIE y GEM no lo tenemos comprobado y no se
    dice nada.</p>`;
}

function tablaLluvia(H, i, hora) {
  const filas = COMPARAR.map(m => ({
    name: m.name, res: m.res, om: m.om,
    mm: H[`precipitation_${m.om}`]?.[i],
    code: H[`weather_code_${m.om}`]?.[i],
  })).filter(f => has(f.mm));

  if (!filas.length) return '';

  const conAgua = filas.filter(f => f.mm >= 0.1);
  const sirimiri = f => has(f.code) && f.code >= 51 && f.code <= 55;
  const tope = Math.max(...filas.map(f => f.mm), 1);

  let cab;
  if (!conAgua.length) {
    /* «Los cuatro» estaba escrito a mano y los modelos son SIETE desde el
       27-08. Se cuentan, que él los cuenta. Cazado el 28-08 mirando la
       pantalla de verdad. */
    /* «A ESTA HORA», y con las 24 h miradas antes de dar la calma.
       Cazado el 31-08-2026 con tres pantallazos suyos a la vez: este
       bloque decía «los 7 coinciden en seco» (verdad, pero de la hora
       en curso) mientras dos dedos más abajo el chip de la franja decía
       «GEM y ICON sí (0,3 mm)» para el alba. Verdades de ventanas
       distintas SIN etiquetar se leen como contradicción — o peor, como
       calma. La regla 2: una afirmación de calma tiene que decir hasta
       dónde ha mirado. */
    const veranAgua = filas
      .map(f => { const serie = H[`precipitation_${f.om}`];
        if (!serie) return null;
        let tot = 0, primera = null;
        for (let j = i + 1; j < Math.min(i + 25, H.time.length); j++) {
          const mm = serie[j]; if (!has(mm) || mm <= 0) continue;
          tot += mm; if (!primera) primera = H.time[j];
        }
        return tot > 0 ? { n: f.name, tot, primera } : null; })
      .filter(Boolean);
    cab = { s: 'go', t: 'Ninguno ve agua a esta hora',
            x: `Los ${filas.length} coinciden en seco ahora mismo.`
             + (veranAgua.length
                ? ` En las próximas 24 h ${listar(veranAgua.map(v => v.n))} ${veranAgua.length === 1 ? 've' : 'ven'} algo`
                  + ` (hasta ${mmTxt(Math.max(...veranAgua.map(v => v.tot)))} mm, desde las ${veranAgua.sort((x, y) => new Date(x.primera) - new Date(y.primera))[0].primera.slice(11, 16)}).`
                : ' Y tampoco en las próximas 24 h.') };
  } else if (conAgua.length === filas.length) {
    cab = { s: 'warn', t: 'Todos ven agua', x: 'Coinciden: va a caer.' };
  } else {
    /* El caso de Bermeo. Es el que más importa y el que peor se lee si
       solo miras un modelo. */
    cab = { s: 'warn', t: `Solo ${conAgua.length} de ${filas.length} ven agua`,
            x: `${listar(conAgua.map(f => f.name))} ${conAgua.length === 1 ? 've' : 'ven'} agua y `
             + `${filas.length - conAgua.length === 1 ? 'el otro no' : 'los otros no'}. `
             + `Basta con que uno acierte: el 26-08-2026 a las 19:00 en Bermeo solo ECMWF vio la llovizna, `
             + `y estaba lloviendo.` };
  }

  return `
    <div class="cmp__v" data-s="${cab.s}" style="margin-top:14px">
      <b>${esc(cab.t)}</b><span>${esc(cab.x)}</span>
    </div>
    <div class="cmp__h">Lluvia · ${esc(hora)}</div>
    ${filas.map(f => {
      const pc = clamp(f.mm / tope * 100, f.mm > 0 ? 4 : 0, 100);
      const st = f.mm >= 0.1 ? 'warn' : 'go';
      return `<div class="cmp__f" data-s="${st}">
        <span class="cmp__n">${esc(f.name)}<small>${esc(f.res)}</small></span>
        <span class="cmp__b"><i style="width:${pc}%"></i></span>
        <span class="cmp__val">${mmTxt(f.mm)}<small> mm</small>${
          sirimiri(f) ? '<em class="cmp__sir">sirimiri</em>' : ''}</span>
      </div>`;
    }).join('')}
    ${rejillaLluvia(H, i)}
    <p class="note">Tampoco se promedia: 0,4 · 0 · 0 · 0 daría 0,1 y se leería
    «no llueve». <b>El sirimiri moja aunque el pluviómetro marque cero</b>, y lo
    que esté a la intemperie estará mojado igual.</p>`;
}

/* ── LA LLUVIA HORA A HORA, MODELO A MODELO ───────────────────────────
   Suyo, 26-08-2026, señalando una tabla que le pasé por el chat con las
   próximas horas de Bermeo modelo a modelo: *«esto sirve»*.

   Y sirve porque contesta a la pregunta que se hace de verdad, que no es
   «¿llueve?» sino **«¿va a seguir?»**. Esa noche el Automático daba 0,3
   a las 21:00, 0,1 a las 22:00 y seco a las 23:00 — o sea, muriéndose.
   Él lo dijo a ojo estando allí («tiene pinta de que parará ya») y la
   tabla se lo confirmaba de un vistazo.

   Seis horas y no más: a partir de ahí la lluvia fina no la clava nadie,
   y una tabla larga se lee peor. Y **cada hora con su modelo**, porque
   ese mismo día se turnaron en dos horas.                            */
function rejillaLluvia(H, i) {
  const N = 6;
  const idx = [];
  for (let k = 0; k < N && i + k < H.time.length; k++) idx.push(i + k);
  if (idx.length < 2) return '';

  const filas = COMPARAR.map(m => ({
    name: m.name,
    v: idx.map(j => H[`precipitation_${m.om}`]?.[j]),
  })).filter(f => f.v.some(has));
  if (!filas.length) return '';

  /* Si en las seis horas no hay agua en ningún modelo, la rejilla sobra:
     ya lo dice el renglón de arriba y sería una tabla de ceros. */
  if (!filas.some(f => f.v.some(x => has(x) && x >= 0.1))) return '';

  const hs = idx.map(j => H.time[j].slice(11, 13) + 'h');
  const cel = x => !has(x) ? '<td class="rej__nd">—</td>'
    : x >= 0.1 ? `<td class="rej__si">${mmTxt(x)}</td>`
    : '<td class="rej__no">0</td>';

  return `
    <div class="rej__w">
    <table class="rej">
      <thead><tr><th></th>${hs.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(f => `<tr><th>${esc(f.name)}</th>${f.v.map(cel).join('')}</tr>`).join('')}</tbody>
    </table>
    </div>
    <p class="note">Las seis horas siguientes, en mm. Sirve para lo que de verdad
    se pregunta: <b>no si llueve, sino si va a seguir</b>. Si los números van
    bajando, se está muriendo.</p>`;
}



/* ---------- Ficha de cada emplazamiento ─────────────────────────────
   Una sola altura para todo no sirve: 40 m de torre en el Sollube no es
   una azotea de un colegio. Cada sitio guarda lo suyo.

   Y la cota REAL importa por algo que no es evidente: el modelo tiene su
   propia idea de a qué altura está el terreno, y la alisa. MEDIDO: pone
   el Sollube a 413 m cuando son unos 680, y a Gorbea a 1.368 cuando son
   1.481. Si el emplazamiento está más alto de lo que cree el modelo,
   el viento real es MAYOR que el que se ve en pantalla. Eso hay que
   decirlo, no callarlo.                                              */

const TIPOS = {
  torre:  { et:'Torre en campo o monte', ayuda:'Altura de trabajo sobre el suelo' },
  azotea: { et:'Antena en azotea',       ayuda:'Altura del edificio más la antena' },
};


/** Altitud real del terreno en un punto, del modelo digital de 90 m.
 *
 *  Se saca sola y NO se le pide al usuario. Aprendido a base de meter la
 *  pata: puse 680 m para el Sollube de memoria cuando son 413, y con esa
 *  cota falsa la app disparó un aviso rojo que no tocaba. Un dato que se
 *  puede medir no se teclea.
 *
 *  Ojo: es la altitud del SUELO, no la de la antena. La altura de trabajo
 *  va aparte. */
async function cotaReal(lat, lon) {
  try {
    const d = await jget(API.elev, { latitude: lat.toFixed(4), longitude: lon.toFixed(4) },
                         { timeout: 9000 });
    const v = d?.elevation?.[0];
    return has(v) ? Math.round(v) : null;
  } catch { return null; }
}

/** Ficha de un emplazamiento, con lo que había guardado de antes. */
/* ── LA COTA SALE DE LAS COORDENADAS ────────────────────────────────
   Suyo, 28-08-2026, dos veces: *«¿cómo que sin la cota? Si tenéis las
   coordenadas y todo. Esto está a ciento y pocos metros»* y *«esto está
   en todas las estaciones y no es así: tenéis las coordenadas»*.

   Y es verdad. La app le decía **«sin la cota no puedo decirte nada del
   hielo, ponla en Mis torres»** en los catorce sitios. Pedirle que teclee
   catorce alturas que se pueden mirar solas es hacerle trabajar a él.

   `/om?api=elev` devuelve la altura del terreno de unas coordenadas —ya
   estaba montado y no se usaba para esto—. Comprobado: Bermeo 133 m,
   Sollube 669, Oiz 997 (la real del Oiz son 1.026: el modelo digital se
   queda 29 m corto, que para compararla con la isocero es de sobra).

   Lo que él ponga a mano SIGUE MANDANDO: esto solo rellena el hueco. */
const COTA_CACHE = 'cotaAuto.';

/* Y de TODOS sus emplazamientos de una vez. Suyo, 28-08-2026, viendo el
   mismo aviso en BI SANTAMAÑA: *«olvidaros de la torre. Me tenéis que
   decir que en BI SANTAMAÑA —que ya sé que está alto— las condiciones
   que hará ahí, justo donde está la estación. Y tenéis datos de sobra:
   coordenadas de todos los emplazamientos, ya os las envié. Así que eso
   de "sin cota" sobra.»*

   La API de altitud acepta varias coordenadas en una sola llamada, así
   que los catorce cuestan **una** petición. */
async function cotasDeTodos(sitios) {
  const faltan = (sitios || []).filter(p =>
    has(p?.lat) && has(p?.lon) && !has(LS.get(COTA_CACHE + key(p), null)));
  if (!faltan.length) return 0;
  try {
    const d = await jget(API.elev, {
      latitude:  faltan.map(p => Number(p.lat).toFixed(4)).join(','),
      longitude: faltan.map(p => Number(p.lon).toFixed(4)).join(','),
    }, { timeout: 12000 });
    const v = Array.isArray(d?.elevation) ? d.elevation : [d?.elevation];
    let n = 0;
    faltan.forEach((p, i) => {
      if (!has(v[i])) return;
      LS.set(COTA_CACHE + key(p), Math.round(v[i]));
      n++;
    });
    return n;
  } catch { return 0; }
}

async function cotaAutomatica(p) {
  if (!p || !has(p.lat) || !has(p.lon)) return null;
  const k = COTA_CACHE + key(p);
  const guardada = LS.get(k, null);
  if (has(guardada)) return guardada;              // una vez y para siempre
  try {
    const d = await jget(API.elev, { latitude: p.lat, longitude: p.lon }, { timeout: 8000 });
    const v = Array.isArray(d?.elevation) ? d.elevation[0] : d?.elevation;
    if (!has(v)) return null;
    const m = Math.round(v);
    LS.set(k, m);
    return m;
  } catch { return null; }                          // sin cobertura, sin inventar
}

function cfgDe(p) {
  const c = LS.get('cfg.' + key(p), null);
  const auto = LS.get(COTA_CACHE + key(p), null);

  /* ── UN CERO GUARDADO QUE ERA UN HUECO ──────────────────────────────
     Arreglado el 28-08-2026 con su captura de SOLLUBEMENDI delante:

         Altitud del terreno según el modelo     669 m
         Altitud del suelo, donde está la caseta   0
         Diferencia −669 m   «el modelo no está representando tu
                              emplazamiento»  (en rojo)

     **El aviso era falso.** El terreno de Sollube son 669 m y el modelo
     decía 669: cuadra clavado. Lo que fallaba es que había un CERO
     guardado, de cuando el servidor convertía los huecos en ceros
     (`+null` es 0 y colaba por bueno). Ya se arregló el origen, pero el
     cero seguía guardado en su aparato y en el servidor.

     Aquí se repara: **un cero con el modelo dando más de 200 m no es una
     altitud, es el hueco de antes**. Y ojo con no pasarse — cero es una
     altitud legítima en la costa; por eso solo se descarta cuando el
     terreno del modelo lo desmiente por doscientos metros.

     Un aviso rojo que salta sin motivo deja de leerse, y el día que
     salte de verdad no lo va a mirar. */
  if (c && c.cota === 0 && has(auto) && auto >= 200) {
    const limpio = { ...c, cota: auto, cotaAuto: true };
    LS.set('cfg.' + key(p), { ...c, cota: null });
    LS.set('siteElev.' + key(p), null);
    return limpio;
  }

  if (c) {
    /* La suya manda siempre. La automática solo rellena si él no puso
       ninguna, y queda marcada para poder decir de dónde sale. */
    if (has(c.cota)) return c;
    return has(auto) ? { ...c, cota: auto, cotaAuto: true } : c;
  }
  // Compatibilidad: antes solo se guardaba la cota
  const vieja = LS.get('siteElev.' + key(p), null);
  const cota = has(vieja) ? vieja : (has(auto) ? auto : null);
  return { tipo: 'torre', cota, alt: S.hgt, cotaAuto: !has(vieja) && has(auto) };
}

function guardarCfg(p, c) {
  LS.set('cfg.' + key(p), c);
  if (has(c.cota)) LS.set('siteElev.' + key(p), c.cota);
  /* Y se manda, para que no se quede en este aparato. Antes la cota
     vivía solo aquí y se perdía al reinstalar — el 27-08-2026 se vio que
     eso deja sin aviso de hielo la noche que sube el grupo. */
  if (typeof sincronizarTorres === 'function') sincronizarTorres({ mandar: true });
}

/** Diferencia entre la cota real y la que usa el modelo. */
function desnivel(cfg, elevModelo) {
  if (!has(cfg?.cota) || !has(elevModelo)) return null;
  const d = cfg.cota - elevModelo;
  return {
    d,
    nivel: Math.abs(d) < 80 ? 'go' : Math.abs(d) < 200 ? 'warn' : 'no',
    alto: d > 0,
  };
}

function textoDesnivel(dn, elevModelo, cota) {
  if (!dn) return '';
  if (dn.nivel === 'go')
    return `El modelo sitúa este punto a ${elevModelo.toFixed(0)} m y tú dices ${cota} m. Cuadra.`;
  const m = Math.abs(dn.d).toFixed(0);
  return dn.alto
    ? `<b>El modelo cree que este punto está ${m} m más bajo</b> (${elevModelo.toFixed(0)} m frente a ${cota} m).
       Alisa la cumbre, así que <b>el viento real será MAYOR</b> que el de esta pantalla. No te fíes a la baja.`
    : `<b>El modelo cree que este punto está ${m} m más alto</b> (${elevModelo.toFixed(0)} m frente a ${cota} m).
       Puede estar dándote viento de una ladera o de un alto que no es el tuyo.`;
}


/* ---------- Observación real de AEMET ───────────────────────────────
   El contraste que le faltaba a la app: lo que MIDEN los anemómetros,
   no lo que calcula un modelo.

   Cada estación reporta a su ritmo, así que se enseña SIEMPRE la hora
   de cada medida y se marca en ámbar lo que pase de dos horas. Un dato
   de esta mañana no es «lo que hay ahora».                            */

async function cargarObservacion() {
  const el = $('#obs'), hint = $('#obsHint');
  if (!el) return;
  const p = S.place || { lat: 43.42, lon: -2.72 };
  /* Los avisos de arriba se van con el emplazamiento anterior. Se metían
     con `insertAdjacentHTML` y NADIE los quitaba: al saltar de Sollube a
     Bermeo se quedaba puesto el aviso de Sollube, hablando de una cima
     con el pueblo en pantalla. Visto el 28-08-2026 al añadir el segundo
     aviso; el de la clave de AEMET llevaba así desde que se puso. */
  $$('#obsCad, #obsAlt, #obsCaidas').forEach(n => n.remove());
  el.innerHTML = `<p class="note">Consultando estaciones…</p>`;

  try {
    /* ── LAS DOS REDES, JUNTAS Y NO UNA EN LUGAR DE LA OTRA ───────────
       Euskalmet entra el 28-08-2026. Aitor, con la red delante: *«pues
       genial, todas las que están cerca se pueden poner»*.

       Y entra SUMANDO, no sustituyendo, por dos razones medidas ese
       mismo día:

         · **En Gernika gana AEMET** (Forua a 2,9 km contra Muxika a
           3,3). Tirar AEMET sería empeorar ahí para mejorar en otros.
         · **Dos aparatos a tres kilómetros que discrepan también son un
           dato.** Es lo que él valora de los modelos —«si están varios de
           acuerdo, eso da más fiabilidad»— y vale igual para los
           anemómetros.

       Lo que gana con Euskalmet, comprobado sitio a sitio: en el OIZ pasa
       de una estación a 9,6 km a una a 0,4 **en la propia cima**; en
       ORDUÑA, de 7,9 km a 100 metros; y BALMASEDA y ARBAIZA, que no
       tenían ninguna, pasan a tener una a 1,4 y 4,5 km.

       Y va sin `await` bloqueante en el camino de AEMET: si Euskalmet
       tarda o falla, la pantalla sale igual que hoy. Nunca al revés. */
    const [r, rEus] = await Promise.all([
      fetch(`/estaciones?lat=${p.lat.toFixed(4)}&lon=${p.lon.toFixed(4)}&radio=60`),
      /* El `null` de aquí decía DOS cosas distintas —«Euskalmet no tiene
         estaciones cerca» y «no he podido preguntar»— y abajo las dos
         acababan en la misma lista vacía, o sea: sus estaciones de
         referencia (Oiz, Sollube, Punta Galea) desaparecían de la
         pantalla sin una palabra. Se separan (01-09-2026). */
      fetch(`/api/euskalmet?lat=${p.lat.toFixed(4)}&lon=${p.lon.toFixed(4)}&radio=25`)
        .then(async x => x.ok ? x.json() : { _fallo: `error ${x.status}` })
        .catch(e => ({ _fallo: String(e?.message || e).slice(0, 50) })),
    ]);
    const d = await r.json();
    if (!r.ok || d.error) throw new Error(d.reason || `error ${r.status}`);

    // La clave de AEMET caduca cada tres meses: avisar antes, no después
    if (d.claveCaduca) {
      const c = d.claveCaduca;
      el.insertAdjacentHTML('beforebegin', `<p class="note note--avisa" id="obsCad">
        <b>La clave de AEMET caduca ${c.dias <= 0 ? 'YA' : `en ${c.dias} días`}</b> (${esc(c.fecha)}).
        Se pide otra gratis en opendata.aemet.es y me la pasas: si caduca, estas medidas
        dejan de salir.</p>`);
    }

    /* Las de Euskalmet delante de las de AEMET cuando están más cerca.
       Se marca de qué red es cada una y a qué altura mide el anemómetro:
       Euskalmet mide la racha a **20 m** y AEMET a **10**, y a 20 sopla
       más. Mezclarlas sin decirlo sería comparar peras con manzanas
       justo donde más importa. */
    const eus = (rEus?.estaciones || []).map(x => ({ ...x, red: 'Euskalmet' }));
    /* Las que se miraron y no contestaron SE DICEN. Antes desaparecían y
       eso se lee como si no existieran — la misma regla de los tres
       estados del pulso del vigilante: hay dato, no hay dato, o no se ha
       podido preguntar. */
    const caidas = rEus?.caidas || [];
    const es = [...eus, ...(d.estaciones || []).map(x => ({ ...x, red: 'AEMET' }))]
      .sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    /* Se guarda, sellado con el sitio, para que «Antes de salir» pueda
       leer la medida sin volver a preguntar (06-09-2026). */
    S.obs = { clave: key(p), t: Date.now(), es, caidas, fallo: rEus?._fallo || null, error: null };
    seguro('antes de salir', pintarAntesDeSalir);

    /* ── ¿HAY ALGÚN APARATO A SU ALTURA? ──────────────────────────────
       Encontrado el 28-08-2026 mirando Sollube: las seis estaciones de
       AEMET a menos de 60 km están entre 42 y 150 m. **Ninguna en cima.**
       Sollube está a 669 m y el Oiz a 1.026: la más cercana, Forua, está
       **624 m más abajo**.

       Eso no invalida la pantalla, pero sí cambia lo que significa. Ya
       está medido en este proyecto que **el error entre modelo y aparato
       cambia de signo en 8 km**: en el cabo de Matxitxako los modelos se
       quedaban 22 cortos y en el valle de Forua se pasaban 20. Comparar
       una cima contra un fondo de valle no comprueba la cima.

       Así que se dice, con la misma regla que el pulso del vigilante:
       cuando no hay dato se dice que no lo hay, en vez de dejar que un
       número de otro sitio pase por comprobación. */
    const cotaSitio = cfgDe(p)?.cota;
    const masAlta = es.reduce((a, x) => (has(x.altitud) && (!a || x.altitud > a.altitud)) ? x : a, null);
    const sinAparatoArriba = has(cotaSitio) && cotaSitio >= 400
      && masAlta && has(masAlta.altitud) && (cotaSitio - masAlta.altitud) >= 300;
    if (sinAparatoArriba) {
      el.insertAdjacentHTML('beforebegin', `<p class="note note--avisa" id="obsAlt">
        <b>Aquí no hay ningún aparato que lo compruebe.</b> ${esc(p.name || 'Este emplazamiento')}
        está a <b>${Math.round(cotaSitio)} m</b> y la estación más alta de las que llegan
        —${esc(masAlta.nombre)}— está a <b>${masAlta.altitud} m</b>,
        ${Math.round(cotaSitio - masAlta.altitud)} m por debajo.
        Lo de abajo son medidas de verdad, pero <b>de otra altura</b>: en este proyecto ya se
        midió que el error entre modelo y aparato cambia de signo en 8 km —en el cabo de
        Matxitxako los modelos se quedaban 22 cortos y en el valle de Forua se pasaban 20—.
        Si subes, la medida con tu anemómetro en MAX es el único dato real de este punto.</p>`);
    }
    if (!es.length) {
      el.innerHTML = `<p class="note">No hay estaciones de AEMET a menos de 60 km de
        ${esc(p.name || 'aquí')}. No se muestra nada estimado en su lugar.</p>`;
      if (hint) hint.textContent = '';
      return;
    }

    // La racha medida más alta, que es el número que importa
    const conRacha = es.filter(x => has(x.racha));
    const peor = conRacha.length ? conRacha.reduce((a, b) => (b.racha > a.racha ? b : a)) : null;
    if (hint) hint.textContent = peor
      ? `· máxima medida ${wtxt(peor.racha, true)} en ${peor.nombre}`
      : '';

    el.innerHTML = es.map((x, _i) => {
      /* La antigüedad DE VERDAD: desde la hora absoluta de la medida.
         `haceMinutos` lo calculó el servidor al contestar y se queda
         congelado en la respuesta, así que con una copia guardada esta
         marca no saltaba nunca (01-09-2026). */
      const tMed = x.medidoEn ? Date.parse(x.medidoEn) : NaN;
      const minGenuinos = Number.isFinite(tMed)
        ? Math.max(0, Math.round((Date.now() - tMed) / 60000))
        : (has(x.haceMinutos) ? x.haceMinutos : null);
      const viejo = minGenuinos != null && minGenuinos > 120;
      const st = !has(x.racha) ? 'nd'
        : x.racha >= listonRafaga().no ? 'no'
        : x.racha >= listonRafaga().warn ? 'warn' : 'go';
      /* LA HORA DEL DATO, no solo cuánto hace. Avisado el 28-08-2026: el
         retraso de AEMET llegó ese día a 3 h, y un «hace 3 h» sin la hora
         obliga a hacer la resta mentalmente justo cuando no toca. Y sin
         saber la hora, el contraste con los modelos de abajo no significa
         nada: no se sabría qué se está comparando con qué. */
      /* ── LA HORA SALE DE `medidoEn`, NO DE UNA RESTA ─────────────────
         Esto restaba `haceMinutos` del reloj de AHORA. Y `haceMinutos` lo
         calcula el SERVIDOR al contestar, así que todo el retraso entre
         que contesta y que se pinta desaparecía: con una respuesta
         guardada, una racha de las 18:35 se pintaba «a las 21:36 · hace
         20 min». El número con el que él contrasta al modelo, rejuvenecido
         solo. (Barrido del 01-09-2026, medido con el service worker.)

         Las dos fuentes YA mandan `medidoEn`, la hora absoluta de la
         medida, y app.js no la usaba en ningún sitio. Ahora manda ésa, y
         el contador relativo se recalcula contra ella. */
      const cuando = minGenuinos != null
        ? `a las ${hhDe(Number.isFinite(tMed) ? tMed : Date.now() - minGenuinos * 60000)} · `
          + (minGenuinos < 90 ? `hace ${Math.max(1, minGenuinos)} min`
                              : `hace ${Math.round(minGenuinos / 60)} h`)
        : 'sin hora';
      return `<div class="obs" data-s="${st}">
        <div class="obs__n">
          <b>${esc(x.nombre)}</b>
          <!-- La distancia con COMA, como todo lo demás de la app. Salía
               «a 6.2 km» con punto entre cifras que sí llevan coma, y eso
               se nota. -->
          <span>a ${String(x.km).replace('.', ',')} km${has(x.altitud) ? ` · ${x.altitud} m` : ''}${
            x.red ? ` · <i class="obs__red" data-r="${esc(x.red)}">${esc(x.red)}</i>` : ''}${
            x.alturaAnemometro ? ` · racha a ${x.alturaAnemometro} m` : ''}</span>
        </div>
        <div class="obs__d">
          <span class="obs__big">${has(x.racha) ? wtxt(x.racha) : '—'}</span>
          <span class="obs__lbl">racha ${wu().lbl}</span>
        </div>
        <div class="obs__d">
          <span class="obs__big">${has(x.viento) ? wtxt(x.viento) : '—'}</span>
          <span class="obs__lbl">viento ${wu().lbl}</span>
        </div>
        <div class="obs__d">
          <span class="obs__big">${has(x.temperatura) ? x.temperatura.toFixed(1).replace('.', ',') : '—'}</span>
          <span class="obs__lbl">°C</span>
        </div>
        <!-- LA LLUVIA MEDIDA. Suyo, 28-08-2026, al ver que Euskalmet la
             publica: «datos de lluvia, esto está genial también». Y con
             razón: el 90 % de su trabajo es caseta, fusibles al aire y
             armarios de intemperie, así que si está lloviendo O NO en su
             cima es LA pregunta. Hasta hoy había que deducirlo de un
             modelo; ahora lo dice un pluviómetro que está allí.
             Un cero medido vale tanto como un dato: por eso se pinta el
             0,0 y no se deja el hueco. -->
        <div class="obs__d">
          <span class="obs__big">${has(x.lluvia) ? mmTxt(x.lluvia) : '—'}</span>
          <span class="obs__lbl">mm de lluvia</span>
        </div>
        <div class="obs__t${viejo ? ' is-viejo' : ''}">medido ${esc(cuando)}</div>
        <div class="obs__m" data-est="${_i}"></div>
      </div>`;
    }).join('');

    /* Y si NO se ha podido preguntar a Euskalmet, se dice. Su regla del
       27-08: un hueco jamás se lee como «aquí no hay nada». */
    if (rEus?._fallo) {
      el.insertAdjacentHTML('beforeend', `<p class="note note--avisa" id="obsEusFallo">
        <b>No he podido preguntar a Euskalmet</b> (${esc(rEus._fallo)}).
        Faltan sus estaciones —las de 20 m, que son las tuyas de referencia—:
        <b>eso no quiere decir que no midan, quiere decir que no lo sé.</b>
        Lo de arriba es solo lo de AEMET.</p>`);
    }

    if (caidas.length) {
      el.insertAdjacentHTML('beforeend', `<p class="note note--miradas" id="obsCaidas">
        <b>Miradas también:</b> ${caidas.map(c =>
          `${esc(c.nombre)} <span class="faint">(a ${String(c.km).replace('.', ',')} km,
           ${esc(c.porque)})</span>`).join(' · ')}.
        Se dicen para que no parezca que no existen: <b>no tener dato no es lo mismo que
        no haber mirado</b>.</p>`);
    }

    /* Y AHORA LO QUE ÉL PIDIÓ, con sus palabras del 28-08-2026:
       *«vosotros con decirme lo que los modelos marcan en esas estaciones
       ya lo valoraré yo»* y *«comparo con varios modelos, que es lo suyo,
       y si están varios modelos de acuerdo eso da más fiabilidad»*.

       Esto es lo único que dice si HOY los modelos se están quedando
       cortos, porque compara en el MISMO PUNTO y a la MISMA HORA que el
       aparato. Comparar el modelo de su pueblo contra un anemómetro de
       cabo no mide nada — eso ya nos costó una tarde el 27-08. */
    contrastarConModelos(es.slice(0, 3));
  } catch (e) {
    el.innerHTML = `<p class="note${/caduc/i.test(e.message) ? ' note--avisa' : ''}">
      ${esc(e.message)}.
      <b>Que no haya medida no significa que no haya viento.</b></p>`;
    if (hint) hint.textContent = '';
    S.obs = { clave: key(p), t: Date.now(), es: [], caidas: [], error: String(e?.message || e) };
    seguro('antes de salir', pintarAntesDeSalir);
  }
}

/* ---------- Mis torres ──────────────────────────────────────────────
   Todos los emplazamientos guardados evaluados a la vez, con el mismo
   criterio que la pestaña Torre: misma altura de trabajo, mismos
   umbrales, mismo cálculo de viento a altura.

   Se piden todos en UNA sola petición (Open-Meteo admite varias
   coordenadas), así que ver diez torres cuesta lo mismo que ver una. */

/* ── LO QUE EL MODELO CARGADO NO PUBLICA, TAMBIÉN AQUÍ ────────────────
   La pestaña Torre ya rellenaba con `completar()` los tres campos que
   ICON no da —tapa, índice de elevación e isocero—, y lo dice en
   pantalla. «Mis torres» no lo hacía, así que al añadir el índice de
   elevación el 28-08-2026 salió una columna de rayas en los catorce.

   No se publica una columna vacía y se llama a eso un dato. O se trae
   de donde está, o no se pone. Se trae: una sola llamada con los
   emplazamientos que faltan, al modelo automático, igual que en Torre.

   Y si tampoco se puede, se queda el hueco Y SE VE que es hueco. Nunca
   un cero: la regla 2 de esta app. */
/* ── CÓMO ESTÁ LA PISTA PARA LLEGAR ─────────────────────────────────
   Suyo, 28-08-2026: *«ventiscas en los montes, con el 4x4 tienes que ir,
   te quedas atascado en el barro»*, y antes *«en otoño caerán granizo,
   lluvia racheada, y eso dificulta el acceso a las rurales»*.

   Hasta hoy la app solo miraba hacia delante, y para llegar al sitio eso
   es la mitad de la historia: **el barro es de los días de antes**. Un
   día seco detrás de tres de agua sigue siendo una pista blanda, y él
   sube con el 4x4 y a veces arrastrando un grupo en remolque.

   Se dan las cifras y ya está: lo llovido en las últimas 72 h, la nieve
   que haya en el suelo y la que caiga hoy. **No se dice si se puede
   pasar o no** — eso depende de qué pista es, de qué ruedas lleva y de
   si va cargado, y de eso sabe él y la app no.

   No hay ningún umbral de «a partir de tanto hay barro» porque no está
   medido. Cuando lo esté, se pondrá. */
function comoEstaLaPista(fc) {
  const H = fc?.hourly;
  if (!H?.time) return null;
  const ahora = Date.now();
  let agua = 0, horasAgua = 0, nieveAntes = 0;
  let nieveSuelo = null, nieveHoy = 0;

  for (let i = 0; i < H.time.length; i++) {
    const t = new Date(H.time[i]).getTime();
    const pr = H.precipitation?.[i], nv = H.snowfall?.[i];
    if (t < ahora && t >= ahora - 72 * 3600e3) {
      if (has(pr) && pr > 0) { agua += pr; horasAgua++; }
      if (has(nv)) nieveAntes += nv;
      // La nieve en el suelo se coge de la hora más reciente que la traiga
      if (has(H.snow_depth?.[i])) nieveSuelo = H.snow_depth[i];
    }
    if (t >= ahora && t < ahora + 24 * 3600e3 && has(nv)) nieveHoy += nv;
  }
  return { agua, horasAgua, nieveAntes, nieveSuelo, nieveHoy };
}

/* ── LA MEDIDA DE CADA EMPLAZAMIENTO, DE UNA SOLA LLAMADA ────────────
   Los quince a la vez. Pedirlos de uno en uno serían quince peticiones
   desde el móvil, y el servidor además agrupa por estación: varios de
   sus sitios miran al mismo aparato —Matiena y Durango, los dos a
   Iurreta—, así que se consulta cada estación una vez.

   Si no hay clave de Euskalmet, o falla, `S.medidoTorres` se queda vacío
   y la columna dice «sin aparato cerca». Nunca se rellena con el modelo:
   una medida inventada es peor que no tener medida. */
async function medidasDeTodos(sitios) {
  S.medidoFallo = false; S.medidoSinEuskalmet = null; S.medidoSinAemet = null;
  if (!sitios?.length) { S.medidoTorres = null; return 0; }
  /* Se manda también la COTA de cada sitio: el servidor elige estación
     mirando distancia Y desnivel, no solo distancia. A Sollube le tocaba
     el pueblo de Bermeo —563 m más abajo— teniendo Matxitxako a 433 m
     dos kilómetros más lejos. */
  const puntos = sitios.map(p => {
    const c = cfgDe(p)?.cota;
    return `${p.lat.toFixed(4)},${p.lon.toFixed(4)}${has(c) ? `,${Math.round(c)}` : ''}`;
  }).join('|');
  /* ── Y TAMBIÉN AEMET, NO SOLO EUSKALMET ─────────────────────────────
     Suyo, 29-08-2026: *«seguro que AEMET tiene estaciones con
     pluviómetros por media España»* · *«pues pones AEMET también»* · *«la
     que más cerca esté creo que es la que nos tiene que dar datos»*.

     Y tenía razón, aunque no por donde parecía. **Se midió en sus sitios
     antes de tocar nada**, y para VIENTO Euskalmet gana siempre —en el
     Oiz tiene el aparato a 300 m y a su misma altura, y AEMET a 9,5 km y
     900 m más abajo—. Pero salieron **tres agujeros que AEMET tapa**:

       AMURRIO    Euskalmet Saratxo a 1,8 km **sin pluviómetro**
                  AEMET a **0,4 km, con lluvia**
       ZEBERIO    sus dos de Euskalmet **no miden lluvia**
                  AEMET Orozko a 6 km, con lluvia
       SANTAMAÑA  **ninguna de Euskalmet**. Decía «sin aparato cerca»
                  teniendo AEMET a 5,4 km

     LA ELECCIÓN NO ES POR DISTANCIA PURA, y eso también es suyo: por
     distancia sola, a SANTAMAÑA (463 m) le tocaría Bilbao Aeropuerto, a
     **421 m por debajo**. Es el mismo fallo del Sollube con Almike que ya
     se corrigió. Se usa el mismo baremo que el servidor: **km más el
     desnivel partido por cien**.

     Y SI LA ELEGIDA NO MIDE LLUVIA, la lluvia se toma de la más cercana
     que sí la mida **y se dice de cuál es**. Nunca se mezcla en silencio:
     cada cifra lleva su aparato. */
  const puntuar = (est, cota) => est.km + (has(cota) && has(est.altitud)
    ? Math.abs(cota - est.altitud) / 100 : 0);

  try {
    const [r, aemet] = await Promise.all([
      fetch(`/api/euskalmet?puntos=${encodeURIComponent(puntos)}`),
      /* AEMET no acepta varios puntos, así que van en paralelo. Medido:
         0,13-0,18 s cada una, y no bloquean el pintado. */
      /* ── «NO HE PODIDO PREGUNTAR» NO ES «NO HAY» ─────────────────
         Cazado por la revisión de la noche del 04-09-2026. Esto hacía
         `.then(x => x.json())` sin mirar `x.ok`, así que un 502 de AEMET
         —clave caducada, servidor caído— llegaba como `{error:true}`, el
         `|| []` lo convertía en «no hay estaciones» y la tabla rotulaba
         «ESTACIÓN · ninguna cerca» en un sitio con una a 5 km a la que no
         se pudo preguntar. Su regla 1: vacío jamás. Euskalmet ya lo hace
         bien desde el 01-09 (`S.medidoSinEuskalmet`); AEMET se quedó
         atrás. Ahora igual: la razón que manda el servidor se guarda y la
         cabecera la cuenta. */
      Promise.all(sitios.map(p =>
        fetch(`/estaciones?lat=${p.lat.toFixed(4)}&lon=${p.lon.toFixed(4)}&radio=40`)
          .then(async x => {
            const j = await x.json().catch(() => null);
            if (!x.ok || j?.error) {
              S.medidoSinAemet = `no he podido preguntar a AEMET${
                j?.reason ? ` (${String(j.reason).slice(0, 80)})` : x.status ? ` (error ${x.status})` : ''}`;
              return [];
            }
            return (j?.estaciones || []).map(e => ({ ...e, fuente: 'AEMET' }));
          })
          .catch(() => { S.medidoSinAemet = 'no he podido preguntar a AEMET (sin red)'; return []; }))),
    ]);
    const d = await r.json().catch(() => null);
    /* Si Euskalmet no contesta, AEMET sí sale y la tabla parece completa
       — pero le faltan SUS estaciones de referencia, las de 20 m. Antes
       eso no se decía en ninguna parte (01-09-2026). Se apunta para que
       la cabecera lo cuente; que la tabla salga sin ellas, callando, es
       la misma mentira de siempre con otra ropa. */
    const eusOk = !!(d?.ok && Array.isArray(d.puntos));
    S.medidoSinEuskalmet = eusOk ? null
      : `no he podido preguntar a Euskalmet${r?.status ? ` (error ${r.status})` : ''}`;
    const eus = eusOk ? d.puntos : sitios.map(() => null);

    const m = new Map();
    sitios.forEach((p, i) => {
      const cota = cfgDe(p)?.cota;
      const deEus = (eus[i] && !eus[i].sinEstacion) ? [eus[i]] : [];
      const todas = [...deEus, ...(aemet[i] || [])].filter(x => has(x?.km));
      if (!todas.length) return;

      /* La mejor por distancia Y desnivel, mezclando las dos redes. */
      const mejor = todas.reduce((a2, b2) => puntuar(b2, cota) < puntuar(a2, cota) ? b2 : a2);

      /* Y la lluvia, de la más cercana que la mida — si no es la misma,
         se guarda aparte con su nombre para poder decirlo en pantalla. */
      let lluviaDe = null;
      if (mejor.lluvia == null) {
        const conAgua = todas.filter(x => x.lluvia != null);
        if (conAgua.length) {
          lluviaDe = conAgua.reduce((a2, b2) => puntuar(b2, cota) < puntuar(a2, cota) ? b2 : a2);
        }
      }
      m.set(key(p), { ...mejor, desnivel: has(cota) && has(mejor.altitud)
                        ? Math.round(cota - mejor.altitud) : mejor.desnivel,
                      lluviaDe: lluviaDe
                        ? { nombre: lluviaDe.nombre, fuente: lluviaDe.fuente,
                            km: lluviaDe.km, lluvia: lluviaDe.lluvia }
                        : null });
    });
    S.medidoTorres = m;
    return m.size;
  } catch {
    /* Y si FALLA, se dice. Con solo `null` se quedaría «midiendo…» para
       siempre, que es otra forma de mentir: parecería que va a llegar. */
    S.medidoTorres = null; S.medidoFallo = true; return 0;
  }
}

/* Junta lo medido en cada emplazamiento con lo que daba cada modelo a
   ESA MISMA HORA, y lo apunta. Ver el comentario de arriba: es lo que
   mete por fin las cumbres en el marcador. */
function apuntarTorresEnMarcador() {
  const raw = S.parteRaw;
  const med = S.medidoTorres;
  if (!raw?.sitios?.length || !med?.size) return;

  const muestras = [];
  raw.sitios.forEach((p, n) => {
    const x = med.get(key(p));
    const H = raw.arr?.[n]?.hourly;
    if (!x || !has(x.racha) || !H?.time) return;

    /* LA HORA DEL DATO MEDIDO, no la de ahora. Ese error ya se coló
       cinco veces en este proyecto: comparar la medida de las 15:10
       contra el modelo de las 16:00 son dos momentos distintos. */
    const tMedido = x.medidoEn && Number.isFinite(Date.parse(x.medidoEn))
      ? Date.parse(x.medidoEn)      /* la hora de la MEDIDA, no una resta contra el reloj de ahora */
      : Date.now() - (has(x.haceMinutos) ? x.haceMinutos : 0) * 60000;
    const d = new Date(tMedido);
    const iso = new Date(tMedido - d.getTimezoneOffset() * 60000).toISOString().slice(0, 13);
    const i = H.time.findIndex(t => t.slice(0, 13) === iso);
    if (i < 0) return;

    const filas = MODELOS_TORMENTA
      .map(m => ({ n: m.nom, v: H[`wind_gusts_10m_${m.om}`]?.[i] }))
      .filter(f => has(f.v));
    if (filas.length < 2) return;

    muestras.push({
      estacion: x.nombre, altitud: x.altitud, hora: iso,
      red: x.fuente || x.red || 'sin red',   // ver el porqué en `medidasDeTodos`
      magnitud: 'racha',
      medido: x.racha, haceMinutos: x.haceMinutos,
      modelos: Object.fromEntries(filas.map(f => [f.n, f.v])),
    });

    /* ── Y LA LLUVIA, DESDE EL 29-08-2026 ──────────────────────────────
       Se lo dije yo esa noche, sin que él lo preguntara: llevaba días
       diciendo «AROME es el que mejor acierta» y eso estaba medido
       **solo en racha**. En lluvia no tenía ni una medida y lo estaba
       diciendo como si la tuviera.

       SOLO si el pluviómetro es el de ESTA estación. `medidasDeTodos`
       sabe coger la lluvia de otra más lejana cuando la de aquí no la
       mide (`lluviaDe`), y eso está muy bien para enseñarlo en pantalla
       —diciendo de dónde sale—, pero **no vale para puntuar**: sería
       comparar el agua caída a 5 km contra el modelo de esta torre. Es
       exactamente el fallo de Almike: dos sitios metidos en el mismo
       saco. Si no lo mide esta, no se apunta y ya está. */
    if (has(x.lluvia)) {
      const agua = MODELOS_TORMENTA
        .map(m => ({ n: m.nom, v: H[`precipitation_${m.om}`]?.[i] }))
        .filter(f => has(f.v));
      if (agua.length >= 2) muestras.push({
        estacion: x.nombre, altitud: x.altitud, hora: iso,
        red: x.fuente || x.red || 'sin red',
        magnitud: 'lluvia',
        humedad: x.humedad,   // ver el porqué en la otra muestra de lluvia
        medido: x.lluvia, haceMinutos: x.haceMinutos,
        modelos: Object.fromEntries(agua.map(f => [f.n, f.v])),
      });
    }
  });
  apuntarEnElMarcador(muestras);
}

async function completarTorres(sitios, arr) {
  const faltan = COMPLEMENTOS.filter(k =>
    arr.some(fc => {
      const v = fc?.hourly?.[k];
      return fc?.hourly && (!v || v.every(x => x === null || x === undefined));
    }));
  /* OJO: el «si no falta nada, me voy» NO puede ir aquí. Al Automático
     no le falta nada —lo publica todo, mal cosido— y este return se iba
     ANTES de pisar la lluvia y el cielo. Cazado el 30-08-2026 a las
     19:09 midiendo: la tabla de Mis torres decía «Lluvia 0,0» con el
     chip «ECMWF 0,2» al lado. El mismo fallo ya arreglado en
     `completar()`, escapado aquí. El return va tras los pisados. */

  /* ── AQUÍ ESTABA EL RESTO DEL FALLO, y lo señaló él ────────────────
     *«Y EN CADA CAPA O SECCIÓN, EN AHORA, TORRE, MIS TORRES ETC. SI NO…
       NO VALDRÁ»*.

     Y así era: «Ahora» y «Torre» repartían cada dato al modelo que lo
     mide, y esta —«Mis torres», la que él mira antes de mandar a nadie—
     pedía **TODO al Automático** (`models: 'best_match'`). El mismo dato
     salía de dos sitios distintos según la pestaña.

     Ahora usa `quienLoMide()`, el mismo reparto que las demás, y se
     agrupa por modelo para no hacer una petición por campo. */
  const cargado = modeloDato()?.om;

  /* Los ELEGIDOS POR ACIERTO también aquí — «y en todas las capas: en
     Torres, Ahora y en Mis torres», suyo, 30-08-2026. La lluvia de cada
     sitio pisa la del cargado con la del dueño, que es la que decide el
     semáforo por el que reparte gente. */
  const porAcierto = new Set(Object.keys(ELEGIDO_POR_ACIERTO)
    .filter(k => k !== 'precipitation_sum')
    .filter(k => {
      const e = ELEGIDO_POR_ACIERTO[k];
      return e && e !== cargado && COBERTURA[k]?.includes(e);
    }));
  for (const k of porAcierto) if (!faltan.includes(k)) faltan.push(k);

  /* El cielo entero al mismo dueño, también aquí. */
  for (const k of [...cieloQueSePresta(cargado), ...repartirTodo(cargado)]) {
    porAcierto.add(k);
    if (!faltan.includes(k)) faltan.push(k);
  }

  if (!faltan.length) return;

  /* EL MISMO REPARTO QUE «AHORA» Y «TORRE», y de la misma función. Aquí
     estaba escrito aparte, y por eso pasaron las dos cosas: se quedó
     pidiendo TODO al Automático mientras las demás repartían, y el
     agujero de la columna de nulos hubo que taparlo dos veces. Suyo,
     30-08-2026: *«que no tengamos que corregir esto cada día o cada
     cambio que hagamos, por favor»*. */
  const traeAlgo = v => Array.isArray(v) && v.some(x => x !== null && x !== undefined);

  const pedirYPegar = async (om, ks, muerto) => {
    const conAgua = ks.includes('precipitation') && porAcierto.has('precipitation');
    const d = await jget(API.fc, {
      latitude:  sitios.map(p => p.lat.toFixed(4)).join(','),
      longitude: sitios.map(p => p.lon.toFixed(4)).join(','),
      hourly: ks.join(',') + (conAgua ? ',weather_code' : ''),
      timezone: 'auto', wind_speed_unit: 'kmh',
      forecast_days: 2, past_hours: 1, models: om,
    }, { timeout: 15000 });
    const extra = Array.isArray(d) ? d : [d];

    const sinCubrir = new Set();
    arr.forEach((fc, i) => {
      if (!fc?.hourly) return;
      for (const k of ks) {
        /* Un elegido por acierto PISA aunque el cargado lo traiga. */
        if (traeAlgo(fc.hourly[k]) && !porAcierto.has(k)) continue;   // ya lo tiene
        /* Las horas tienen que ser LAS MISMAS. Si las dos llamadas no
           empiezan en la misma hora, pegar una columna sobre otra
           desplaza todos los valores y nadie lo nota. */
        if (!extra[i]?.hourly || extra[i].hourly.time?.[0] !== fc.hourly.time?.[0]
            || !traeAlgo(extra[i].hourly[k])) { sinCubrir.add(k); continue; }
        fc.hourly[k] = extra[i].hourly[k];
        (fc.suplidas ??= []).push(k);
        (fc.prestadosDe ??= []).push({ k, de: om, porAcierto: porAcierto.has(k) || undefined });
        /* El código del MISMO modelo que la lluvia: el sirimiri se
           clasifica por código, no por milímetros. */
        if (k === 'precipitation' && porAcierto.has(k) && traeAlgo(extra[i].hourly.weather_code))
          fc.hourly.weather_code_lluvia = extra[i].hourly.weather_code;
        if (muerto) (fc.seCayo ??= []).push({ k, muerto, salvo: om });
      }
    });
    return [...sinCubrir];
  };

  await repartirConRespaldo(faltan, cargado, pedirYPegar);
}

async function cargarTorres() {
  const el = $('#torres');
  if (!el) return;

  /* La altura de sus catorce, de una sola llamada y una sola vez. Se pide
     ANTES de pintar para que no salga el aviso de «sin cota» y desaparezca
     medio segundo después, que eso también molesta. */
  await cotasDeTodos(S.saved).catch(() => 0);
  if (!S.saved.length) {
    el.innerHTML = `<p class="note">Todavía no has guardado ningún emplazamiento.
      Búscalo arriba y pulsa el ♥ para tenerlo aquí.</p>`;
    $('#torresHint').textContent = '';
    return;
  }
  el.innerHTML = `<p class="note">Consultando ${S.saved.length} emplazamiento${S.saved.length>1?'s':''}…</p>`;

  try {
    const d = await jget(API.fc, {
      latitude:  S.saved.map(p => p.lat.toFixed(4)).join(','),
      longitude: S.saved.map(p => p.lon.toFixed(4)).join(','),
      hourly: HOURLY, timezone: 'auto', wind_speed_unit: 'kmh',
      /* TRES DÍAS HACIA ATRÁS, y son para la PISTA. Suyo, 28-08-2026:
         *«ventiscas en los montes, con el 4x4 tienes que ir, te quedas
         atascado en el barro»*, y antes *«eso dificulta el acceso a las
         rurales»*.

         El barro no es del tiempo de ahora: es de lo que ha llovido
         estos días. Un día seco detrás de tres de agua sigue siendo una
         pista blanda. Sin `past_days` la app solo sabía mirar hacia
         delante y esa es la mitad de la historia para llegar al sitio.
         No cuesta otra petición: va en la misma. */
      forecast_days: 2, past_days: 3, past_hours: 1, models: model().om,
    }, { timeout: 20000 });

    const arr = Array.isArray(d) ? d : [d];
    await completarTorres(S.saved, arr);
    S.torres = S.saved.map((p, i) => {
      const fc = arr[i];
      if (!fc?.hourly) return { place: p, horas: null };
      const cfg = cfgDe(p);
      return { place: p, cfg, horas: buildHours(fc, cfg.alt, p), elev: fc.elevation,
               pista: comoEstaLaPista(fc) };
    });
    /* El parte PRIMERO: `renderTorres` lee `S.parteFilas` para meterlo
       dentro de cada tarjeta. Al revés pintaba el del render anterior. */
    renderParte(); renderTorres();
    /* Y las medidas de verdad, para la columna de la derecha del parte.
       Va después y sin bloquear: el tablero se pinta ya con el
       pronóstico, y cuando lleguen los aparatos se repinta. Si Euskalmet
       falla o tarda, la pantalla no se entera. */
    const medidas = medidasDeTodos(S.saved).then(() => { renderParte(); renderTorres(); }).catch(() => {});
    // Y el aviso de que otro modelo ve tormenta donde el tuyo no. Va
    // después y sin bloquear: el tablero se pinta ya, y esto lo repinta.
    const discrepa = discrepaTorres(S.saved).then(() => { /* El parte PRIMERO: `renderTorres` lee `S.parteFilas` para meterlo
       dentro de cada tarjeta. Al revés pintaba el del render anterior. */
    renderParte(); renderTorres(); }).catch(() => {});

    /* ── Y SUS CUMBRES, AL MARCADOR ─────────────────────────────────────
       Cazado el 29-08-2026 mientras él preguntaba en qué modelo fiarse en
       cada sitio. El marcador tenía **once estaciones y ninguna por
       encima de 433 m**, y faltaban justo las tres que valen: **Oiz
       (998 m), Orduña (934) y La Garbea (717)** — las que tienen el
       aparato a su misma altura, a 200 y 300 metros de sus torres.

       EL MOTIVO: el marcador se alimentaba solo de las estaciones del
       sitio abierto en «Ahora», y él mira Bermeo. A sus cumbres no se
       asomaba nadie. O sea que la pregunta «¿en quién me fío en el Oiz?»
       no se podía contestar **porque nunca se había mirado allí**.

       Aquí ya están las dos mitades cargadas: la medida de cada
       emplazamiento (`medidasDeTodos`) y lo que daba cada modelo
       (`discrepaTorres`). Solo faltaba juntarlas. Va sin bloquear y con
       el fallo tragado, como el otro: apuntar no puede estropear la
       pantalla con la que decide. */
    Promise.all([medidas, discrepa]).then(() => apuntarTorresEnMarcador()).catch(() => {});
  } catch (e) {
    // Sin cobertura: se tira de lo guardado, diciendo de cuándo es cada una.
    const conCopia = S.saved.map(p => ({ place: p, copia: leerCopia(p) })).filter(x => x.copia);
    if (!conCopia.length) {
      el.innerHTML = `<p class="note">No se han podido consultar: ${esc(e.message)}.
        Y no hay ninguna copia guardada. Con cobertura, pulsa
        <b>Guardar para el monte</b> antes de salir.</p>`;
      return;
    }
    /* El `place` va TAMBIÉN aquí. Sin él, `buildHours` cae en
       `place ?? S.place` y juzga las veinte filas con el emplazamiento
       que tenga ABIERTO: el fallo del semáforo cruzado que se arregló el
       31-08 en la vía con cobertura y que en ésta —la del monte, la de
       «Guardar para el monte», la que usa cuando no hay red— se quedó sin
       arreglar. (Barrido del 01-09-2026.) */
    S.torres = conCopia.map(({ place, copia }) => ({
      place, cfg: cfgDe(place), horas: buildHours(copia.data.fc, cfgDe(place).alt, place),
      elev: copia.data.fc?.elevation,
      copia,
    }));
    /* El parte PRIMERO: `renderTorres` lee `S.parteFilas` para meterlo
       dentro de cada tarjeta. Al revés pintaba el del render anterior. */
    renderParte(); renderTorres();
    const vieja = Math.max(...conCopia.map(x => x.copia.edadH ?? 999));
    toast(`Sin conexión — ${conCopia.length} de ${S.saved.length} desde copia guardada`, 5200);
    avisoCopia({ t: conCopia.find(x => (x.copia.edadH ?? 999) === vieja).copia.t, edadH: vieja });
  }
}


/** Formulario para la ficha de un emplazamiento. */
function abrirAjuste(k) {
  const t = (S.torres || []).find(x => key(x.place) === k);
  if (!t) return;
  const c = t.cfg || cfgDe(t.place);
  const el = $(`#tor-${cssId(k)}`);
  if (!el) return;
  if (el.dataset.on) { el.innerHTML = ''; delete el.dataset.on; return; }
  el.dataset.on = '1';
  el.innerHTML = `
    <div class="aj">
      <label>Tipo
        <select data-c="tipo">
          ${Object.entries(TIPOS).map(([v, o]) =>
            `<option value="${v}"${v === c.tipo ? ' selected' : ''}>${esc(o.et)}</option>`).join('')}
        </select>
      </label>
      <label>Altura de trabajo <small>10 = a pie de caseta</small>
        <input type="number" inputmode="numeric" data-c="alt" value="${c.alt ?? ''}" min="3" max="300"> m
      </label>
      <label>Cota del terreno
        <input type="number" inputmode="numeric" data-c="cota" value="${has(c.cota) ? c.cota : ''}"
               placeholder="buscando…" min="-10" max="3500"> m
      </label>
      <button class="btn btn--acc" data-guardar="${esc(k)}">Guardar</button>
      <p class="aj__n">La cota se saca sola de un mapa de elevaciones de 90 m; solo tócala si
        sabes que está mal. Es la altura del <b>suelo</b>, no la de la antena: eso es la altura
        de trabajo. Sirve para avisarte cuando el modelo alise el terreno y se quede corto.</p>
    </div>`;

  // Si no tenía cota, se busca sola y se rellena
  if (!has(c.cota)) {
    cotaReal(t.place.lat, t.place.lon).then(v => {
      const inp = el.querySelector('[data-c="cota"]');
      if (inp && !inp.value) inp.value = has(v) ? v : '';
      if (inp && !has(v)) inp.placeholder = 'no se ha podido obtener';
    });
  }
}

/* UNA LISTA SE LEE «A, B, C Y D». Visto en sus pantallazos del
   29-08-2026 a las 00:16: «ECMWF y AROME HD y ARPEGE y GEM no publican
   la tapa». Con cuatro modelos la cadena de «y» se lee a trompicones, y
   estas frases las lee de noche y con prisa. */
const listar = (xs) => xs.length <= 1 ? (xs[0] ?? '')
  : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;

/* De quién se ha tomado prestado cada campo, con su nombre bonito. Ver
   `QUIEN_LO_MIDE`: desde el 29-08-2026 no todo viene del Automático, así
   que la nota no puede seguir diciendo que sí. */
/** La frase de la lluvia elegida por acierto, para las notas. Sale del
 *  dato (`prestadosDe`), nunca escrita: si el respaldo un día la trae de
 *  otro, la frase cambia sola. */
/** La frase del cielo cuando el cargado es el Automático. Sale del dato. */
function fraseCieloDelAutomatico(fc) {
  if (modeloDato()?.om !== 'best_match') return '';
  const x = (fc?.prestadosDe || []).find(y => y.k === 'cloud_cover' && y.porAcierto);
  if (!x) return '';
  return `<br><b>El cielo entero —código, total y capas— es de
    ${esc(nombreDeModelo(x.de))}</b>: al Automático no se le pide, porque es una
    costura de modelos y sus nubes se contradicen entre sí (medido el 30-08:
    un total del 91 % con la capa baja al 100 %, que es imposible).`;
}

function fraseLluviaPorAcierto(fc) {
  const x = (fc?.prestadosDe || []).find(y => y.k === 'precipitation' && y.porAcierto);
  if (!x) return '';
  return `<br><b>La lluvia —con su llovizna, su probabilidad y su suma diaria— es de
    ${esc(nombreDeModelo(x.de))}</b> aunque ${esc(modeloDato().name)} la publica:
    <b>elegida por acierto</b> el 30-08, tras dos sirimiris seguidos en Bermeo
    que solo él vio (y los pluviómetros en cero: el sirimiri moja sin marcar).
    El marcador la vigila con muestras; si otro acaba ganando, se cambia.`;
}

function deQuienSale(fc, campos) {
  const de = new Map();
  for (const x of (fc?.prestadosDe || [])) {
    /* Los elegidos POR ACIERTO no entran aquí: esta lista cuelga de un
       encabezado que dice «no lo publica», y la lluvia el cargado SÍ la
       publica. Tienen su frase propia en la nota, con su porqué. */
    if (x.porAcierto) continue;
    if (campos && !campos.includes(x.k)) continue;
    const nom = (COMPARAR.find(m => m.om === x.de)?.name)
             || (MODELS.find(m => m.om === x.de)?.name) || 'el modelo automático';
    if (!de.has(nom)) de.set(nom, []);
    de.get(nom).push(NOMBRES_COMPL[x.k] || x.k);
  }
  return [...de].map(([quien, qs]) =>
    `${listar([...new Set(qs)])} de <b>${esc(quien)}</b>`);
}

const cssId = k => k.replace(/[^a-zA-Z0-9]/g, '_');

/** La tapa en palabras. Cortes medidos el 23-08-2026 y usados también en
 *  la ficha de Torre, para que en toda la app se lea igual. */
function textoTapa(cin) {
  /* «abierta», no «sin tapa»: con la cifra delante quedaba «tapa 3 —
     sin tapa», que suena a contradicción (cazado el 31-08-2026 en su
     pantallazo de la tarjeta de riesgo). La escala entera: abierta /
     floja / aguanta / fuerte. */
  if (cin < 25)  return 'abierta';
  if (cin < 50)  return 'floja';
  if (cin < 200) return 'aguanta';
  return 'fuerte';
}

/* ── El tablero también tiene que enterarse ───────────────────────────
   MEDIDO el 25-08-2026, y es el fallo que casi se cuela: el aviso de
   discrepancia estaba solo en la pestaña Torre, del sitio que tuvieras
   abierto. En «Mis torres» —que es el tablero con el que reparte gente—
   salían **nueve APTO** y arriba «ninguna fuera de umbrales», con ECMWF
   dando código de tormenta en tres de ellos e ICON 2.050 J/kg en Oiz.

   Un tablero en verde es una respuesta, no un hueco: se lee «puedes
   mandar a quien quieras a donde quieras». No puede callarse esto.

   Se pide TODO de una vez —los diez emplazamientos y los cinco modelos
   en la misma llamada— para no disparar diez peticiones.             */
/* ── QUÉ DÍA CUBRE EL PARTE ──────────────────────────────────────────
   `S.parteSel` es el día elegido: 0 = hoy, 1 = mañana, 2 = pasado…
   Con 0 la ventana empieza AHORA (lo que queda de jornada, que es lo
   que él necesita para repartir gente) y con los demás cubre el día
   entero, de 00:00 a 23:59.

   Y a partir de las 21:00 el día de hoy ya no da para mandar a nadie,
   así que el 0 pasa a ser mañana solo. Eso evita el parte vacío de la
   noche.                                                            */
/* El `ahora` se puede pasar a propósito, y no es un capricho de diseño:
   sin él las pruebas usaban la hora real, y **a partir de las 21:00 el
   día 0 pasa a mañana**, así que tres pruebas del parte empezaban a
   fallar solas cada noche. Un revisor que da falsos fallos según la hora
   es peor que no tenerlo: se acaba publicando a pesar de él.
   Salió el 26-08-2026 a las 23:45, bloqueando un arreglo que él estaba
   esperando. */
function ventanaParte(ahora = Date.now()) {
  const sel = S.parteSel || 0;
  const hoy = new Date(ahora); hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(hoy); finHoy.setHours(23, 59, 59, 999);
  const quedaDia = finHoy.getTime() - ahora > 2 * 3600e3;

  const salto = (sel === 0 && !quedaDia) ? 1 : sel;
  const a = new Date(hoy); a.setDate(a.getDate() + salto);
  const b = new Date(a);   b.setHours(23, 59, 59, 999);

  const desde = (salto === 0) ? ahora - 3600e3 : a.getTime();
  const et = nombreDeDia(a);
  return { desde, hasta: b.getTime(), etiqueta: et, dia: a, salto };
}

/** Recalcula el parte para el día elegido, con los datos ya pedidos. */
function recalcularParte() {
  if (!S.parteRaw) return;
  calcularParte(S.parteRaw.sitios, S.parteRaw.arr);
  /* Y las tarjetas, que es donde vive el parte desde el 02-09-2026:
     cambiar de día tiene que cambiar lo que se ve. */
  renderParte(); renderTorres();
}

/** Calcula el parte para el día que esté elegido en `S.parteSel`.
    Se llama al traer datos nuevos y cada vez que él cambia de día,
    reusando lo ya pedido: cambiar de pestaña no cuesta una petición. */
function calcularParte(sitios, arr) {
  const ahora = Date.now();
  const v_ = ventanaParte();
  const desde = v_.desde, finVentana = v_.hasta;
  S.parteDia = v_.etiqueta;
  /* ── LA FECHA VIAJA CON LA ETIQUETA ──────────────────────────────────
     Cazado por la revisión de la noche del 04-09-2026, y era un fallo
     MÍO de esa misma mañana: al poner el nombre del día en la etiqueta
     («mañana sábado» en vez de «mañana»), una comparación
     `S.parteDia === 'mañana'` dejó de cumplirse para siempre y la línea
     de lluvia del parte pasó a decir «Sin lluvia HOY» aunque estuvieras
     mirando el parte del domingo. Lluvia, su prioridad 1, con dato falso.

     Se cambió el cálculo y se dejó una comparación contra el texto. La
     regla que sale de aquí: **nunca se compara contra una cadena de
     presentación**. Se guarda la FECHA y quien necesite el nombre lo pide
     a `nombreDeDia`, que es la única que sabe escribirlo. */
  S.parteDiaFecha = v_.dia;
  const CON_TAPA = ['best_match', 'icon_seamless', 'gfs_seamless'];

  /* ── EL PARTE ES DE UN DÍA, NO DE 24 HORAS ────────────────────────
     Lo pidió él el 26-08-2026 y tiene toda la razón: *«prefiero que sea
     de hoy, y mañana cuando abra esta pestaña pues de mañana… día por
     día, si no un poco de lío»*.

     Una ventana de 24 horas que arranca a las 15:00 mezcla la tarde de
     hoy con el mediodía de mañana en la misma frase, y él planifica por
     JORNADAS: reparte gente para hoy, o para mañana. Ese era el origen
     de dos líos suyos seguidos —«¿esto es de hoy o de mañana?»— aunque
     los datos fueran correctos.

     A partir de las 21:00 el día ya no da para mandar a nadie, así que
     el parte pasa a ser el de mañana y lo dice en el título. Nunca hay
     que adivinar de qué día es. */
  /* CADA ENTRADA LLEVA SU EMPLAZAMIENTO PEGADO (`k`), y al pintar se
     empareja por ahí, NO por la posición en la lista. Si él añade o
     quita un sitio entre que se piden los datos y se dibujan, las dos
     listas se desalinean y saldrían **los números de un sitio bajo el
     nombre de otro**. En una app con la que se decide mandar gente a
     una torre, eso es de lo peor que puede pasar. El resto de la
     pestaña ya lo hacía por clave; esto no, y era nuevo. */
  /* LA HORA A LA QUE SE CALCULÓ ESTO. Suyo, 27-08-2026, mirando el parte
     de Bermeo: *«¿cuándo está actualizado? no veo la hora, ¿es de hoy?
     ¿de ayer?»*. Y no la veía porque NO ESTABA: la única hora de la
     pantalla era la de la foto de portada, que es otra cosa.

     Un parte con el que se decide si sube gente y sin hora al lado no
     se puede usar: no hay forma de distinguir el de ahora mismo del que
     se quedó cargado anoche. Es la regla 2 de esta app por la puerta de
     atrás — un dato viejo que no se cante se lee como un dato de ahora. */
  S.parteCuando = Date.now();
  /* La racha máxima del día en cada sitio, con el PEOR de los modelos que
     la publican — el mismo criterio que el semáforo desde el 28-08. */
  S.rachaTorres = sitios.map((p, n) => {
    const H = arr[n]?.hourly;
    if (!H?.time) return null;
    let mx = null, hora = null;
    for (const m of MODELOS_TORMENTA) {
      const g = H[`wind_gusts_10m_${m.om}`];
      if (!g) continue;
      for (let i = 0; i < H.time.length; i++) {
        const t = new Date(H.time[i]).getTime();
        if (t < desde || t > finVentana) continue;
        if (!has(g[i])) continue;
        if (mx === null || g[i] > mx) { mx = g[i]; hora = new Date(H.time[i]); }
      }
    }
    return { k: key(p), racha: mx, hora };
  }).filter(Boolean);

  /* ── A QUÉ HORA DEJA DE FRENARTE ────────────────────────────────────
     Lo ha pedido CINCO veces con las mismas palabras y seguía sin
     tenerlo: *«espero a que amaine»*, *«les digo esperar 2 horas»*,
     *«espero a que paren, si no me los como»*, *«iré media hora más
     tarde, o cuando el pronóstico me diga que baja la intensidad de los
     rayos, o viento, o un chaparrón muy fuerte»*.

     **Él no decide «voy o no voy». Decide A QUÉ HORA VOY.** Y la app le
     daba el número de ahora y el máximo del día, pero no la hora en que
     se puede salir.

     Lo que le frena, en sus palabras y en este orden:
       · **rayo** — no sale. Y no es del trabajo: la torre está pegada a
         la caseta, así que veta el emplazamiento entero.
       · **racha de 70** — tampoco sale, y esto no es subir: *«si hay unas
         rachas de 70 puedo volcar con el 4x4»*. Pasa antes de llegar.
         El 70 es su mismo tope de caseta, así que no hay número nuevo
         que preguntarle.
       · **lluvia fuerte** — sale, pero no toca contadores ni CGP, que
         están a la intemperie y con tensión.

     No se calcula nada nuevo: es ordenar por su pregunta lo que ya está
     pedido. Y NO decide: dice la hora y por qué, y él verá. */
  const TOPE_ACCESO = 70;        // suyo: con esa racha vuelca el 4x4
  const LLUVIA_FUERTE = 2.0;     // su escala: «llueve bien» de 2 mm/h

  S.cuandoTorres = sitios.map((p, n) => {
    const H = arr[n]?.hourly;
    if (!H?.time) return null;

    const ahora = Date.now();
    const horas = [];
    for (let i = 0; i < H.time.length; i++) {
      const t = new Date(H.time[i]).getTime();
      if (t + 3600e3 < ahora || t > ahora + 24 * 3600e3) continue;

      // El PEOR de los modelos en cada cosa: aquí no se promedia.
      let racha = null, lluvia = null, rayo = false;
      for (const m of MODELOS_TORMENTA) {
        const g = H[`wind_gusts_10m_${m.om}`]?.[i];
        if (has(g) && (racha === null || g > racha)) racha = g;
        const l = H[`precipitation_${m.om}`]?.[i];
        if (has(l) && (lluvia === null || l > lluvia)) lluvia = l;
        const c = H[`cape_${m.om}`]?.[i], k2 = H[`convective_inhibition_${m.om}`]?.[i];
        if (isStormCode(H[`weather_code_${m.om}`]?.[i])) rayo = true;
        if (has(c) && c >= CAPE_COMBINACION && has(k2) && k2 < 75) rayo = true;
      }

      const frenos = [];
      if (rayo) frenos.push('rayo');
      if (has(racha) && racha >= TOPE_ACCESO) frenos.push('racha');
      if (has(lluvia) && lluvia >= LLUVIA_FUERTE) frenos.push('lluvia');
      horas.push({ t: new Date(H.time[i]), racha, lluvia, rayo, frenos });
    }
    if (!horas.length) return null;

    /* La primera hora libre, y CUÁNTO DURA la ventana: cargar el grupo y
       subir lleva rato, así que una hora suelta entre dos malas no le
       sirve de nada. */
    const i0 = horas.findIndex(h => !h.frenos.length);
    let dura = 0;
    if (i0 >= 0) { let j = i0; while (j < horas.length && !horas[j].frenos.length) { dura++; j++; } }

    return {
      k: key(p),
      ahora: horas[0],
      libreDesde: i0 >= 0 ? horas[i0] : null,
      horasLibres: dura,
      // Si ya está libre ahora, cuándo se estropea
      seEstropeaEn: horas[0].frenos.length ? null
        : (horas.slice(1).find(h => h.frenos.length)?.t ?? null),
    };
  }).filter(Boolean);

  S.parteTorres = sitios.map((p, n) => {
    const H = arr[n]?.hourly;
    if (!H?.time) return null;
    const k = key(p);
    let ini = null, fin = null, peor = null, quien = null;
    /* CUÁNTOS LO VEN Y CUÁNTOS PODÍAN VERLO. Suyo, 27-08-2026: el parte
       ponía «lo ve ICON» y no decía si los demás lo veían o no.

       Y hay que contar las dos cosas, porque «no lo ve» y «no puede
       decirlo» son distintas: **ECMWF y AROME HD no publican la tapa**,
       así que ni siquiera entran en esta cuenta. Poner «1 de 5» sería
       mentir; lo honrado es «1 de los 3 que publican la tapa». */
    const venlo = new Set(), podian = new Set();
    for (const m of CON_TAPA) {
      const cape = H[`cape_${m}`], cin = H[`convective_inhibition_${m}`];
      if (!cape || !cin) continue;
      for (let i = 0; i < H.time.length; i++) {
        const t = new Date(H.time[i]);
        if (t.getTime() < desde || t.getTime() > finVentana) continue;
        const c = cape[i], k = cin[i];
        if (has(c) && has(k)) podian.add(m);
        if (!has(c) || !has(k) || c < CAPE_COMBINACION || k >= 75) continue;
        venlo.add(m);
        if (!ini || t < ini) ini = t;
        if (!fin || t > fin) fin = t;
        if (!peor || c > peor.cape) { peor = { cape: c, cin: k, d: t }; quien = m; }
      }
    }
    if (!peor) {
      // No salta. Pero DE QUÉ le falta importa, y es lo que él preguntó.
      /* ── LA PAREJA, DE LA MISMA HORA Y DEL MISMO MODELO ────────────
         Cazado el 30-08-2026 con su pantallazo: el parte de BI BERMEO
         decía «0 de CAPE · tapa 1» y su propia tabla, dos dedos más
         abajo, «10 · tapa 6». No cuadraban porque esto cogía **el CAPE
         más alto de un modelo y la tapa más baja de OTRO**, y encima de
         horas distintas. Dos cifras que nunca ocurrieron juntas.

         Y es exactamente lo que él corrigió el 26-08: *«¿y CAPE no
         pones? porque tapa pero no hay potencia…»*. La pareja solo
         significa algo si es la misma hora y el mismo modelo: si no,
         miente en las dos direcciones.

         Ahora se busca **la hora peor de verdad** —la de más CAPE— y se
         enseña LA TAPA DE ESA HORA. Si empatan en CAPE, gana la que
         tenga la tapa más baja, que es la que más se acerca a romper. */
      let peorPar = null;
      for (const m of CON_TAPA) {
        const cape = H[`cape_${m}`], cin = H[`convective_inhibition_${m}`];
        if (!cape || !cin) continue;
        for (let i = 0; i < H.time.length; i++) {
          const t = new Date(H.time[i]).getTime();
          if (t < desde || t > finVentana) continue;
          if (!has(cape[i]) || !has(cin[i])) continue;
          if (!peorPar || cape[i] > peorPar.cape
              || (cape[i] === peorPar.cape && cin[i] < peorPar.cin)) {
            peorPar = { cape: cape[i], cin: cin[i] };
          }
        }
      }
      return { k, salta: false,
               maxCape: peorPar ? peorPar.cape : 0,
               minCin:  peorPar ? peorPar.cin : null };
    }
    const nom = MODELOS_TORMENTA.find(m => m.om === quien)?.nom ?? quien;
    return { k, salta: true, ini, fin, cape: peor.cape, cin: peor.cin, hora: peor.d, modelo: nom,
             nVen: venlo.size, nPodian: podian.size };
  });

  /* ── Y LA LLUVIA, que es lo que hay casi todos los días ─────────────
     Suya, la misma noche: *«cuando va a llover que me avise lluvia, que
     siempre no hay rayos»*. Y es verdad: el rayo es lo grave pero lo
     frecuente es el agua, y el **sirimiri moja sin marcar en el
     pluviómetro**, así que un 0,0 esconde un dato del tiempo.

     Se dice que moja. **No se dice qué hacer** — orden suya del 28-08:
     *«esos comentarios mejor no ponerlos, yo decido»*.

     Se mide con el modelo que tiene cargado, no con el peor de todos:
     aquí no se trata de no perderse nada, se trata de decirle a qué
     hora se moja. Y va con la escala de tres que él pidió — sirimiri,
     poco, bien— no en milímetros pelados, que un 0,4 se lee «no llueve»
     y moja igual.                                                   */
  S.lluviaTorres = sitios.map((p, n) => {
    const H = arr[n]?.hourly;
    if (!H?.time) return null;
    const k = key(p);

    /* SE MIRAN TODOS LOS MODELOS, NO EL DE PANTALLA. Primer intento
       (26-08-2026, 00:15) leía la lluvia del modelo cargado, que en
       Euskadi es AROME. Resultado al comprobarlo con datos reales:
       **«sin lluvia en 24 h» en los diez emplazamientos**, el mismo día
       que ICON daba 1,3 mm en Durango y 0,6 en Bilbao. AROME da 0,0 mm
       en todos. Es el punto ciego de siempre, y aquí habría producido
       el peor error posible: decirle que no llueve cuando llueve.

       Así que la ventana es la UNIÓN de las horas en que cualquier
       modelo ve agua, y el pico es el del modelo más mojado, dicho con
       su nombre. Si entre el más seco y el más mojado hay más del
       triple, se dice — porque en día de tormenta la hora es fiable y
       la cantidad no (ECMWF 6,6 mm contra 0,6 de ICON en Bilbao). */
    const conLluvia = MODELOS_TORMENTA
      .map(m => ({ m, pre: H[`precipitation_${m.om}`], cod: H[`weather_code_${m.om}`] }))
      .filter(x => x.pre?.some(v => has(v)));
    if (!conLluvia.length) return null;

    const dentro = i => {
      const t = new Date(H.time[i]).getTime();
      return t >= desde && t <= finVentana;
    };

    let ini = null, fin = null, pico = 0, hPico = null, quien = null;
    let seco = Infinity, mojado = 0;

    /* Las horas se cuentan DISTINTAS, no una vez por modelo. Si ICON y
       ECMWF ven agua a las 19:00, son las 19:00, no dos horas. Sin esto
       el recuento salía inflado y «horas sueltas» no se podía calcular. */
    const conAgua = new Set(), conSirimiri = new Set();

    for (const { m, pre, cod } of conLluvia) {
      let total = 0;
      for (let i = 0; i < H.time.length; i++) {
        if (!dentro(i)) continue;
        const mm = pre[i];
        if (!has(mm)) continue;
        total += mm;
        if (mm < 0.05) continue;
        const t = new Date(H.time[i]);
        const marca = t.getTime();
        conAgua.add(marca);
        if (!ini || t < ini) ini = t;
        if (!fin || t > fin) fin = t;
        if (mm > pico) { pico = mm; hPico = t; quien = m.nom; }
        const c = cod?.[i];
        if (c >= 51 && c <= 57 && mm < 0.2) conSirimiri.add(marca);
      }
      if (total < seco) seco = total;
      if (total > mojado) mojado = total;
    }

    if (!conAgua.size) return { k, llueve: false };
    // Las horas concretas, ordenadas. Sin esto solo se puede dar un rango,
    // y un rango de 21 horas para 5 horas de gotas no dice nada.
    const horasAgua = [...conAgua].sort((a, b) => a - b).map(t => new Date(t));

    /* ¿SEGUIDAS O SUELTAS? Decir «de 09:00 a 20:00» cuando son tres
       horas repartidas se lee como que llueve once horas. Es el mismo
       fallo que él me corrigió con «0,6 mm en todo el día»: el dato era
       cierto y la frase engañaba. */
    const tramo = Math.round((fin - ini) / 3600e3) + 1;
    const sueltas = tramo > conAgua.size;

    return { k, llueve: true, ini, fin, pico, hPico, quien, horasAgua,
             nHoras: conAgua.size, sueltas,
             soloSirimiri: conSirimiri.size === conAgua.size,
             discrepan: seco > 0 ? (mojado / Math.max(seco, 0.1)) >= 3 : mojado >= 0.5 };
  });
}

async function discrepaTorres(sitios) {
  if (!sitios?.length) { S.torresDiscrepa = null; return; }
  const mio = model().om;
  const d = await jget(API.fc, {
    latitude:  sitios.map(p => p.lat.toFixed(4)).join(','),
    longitude: sitios.map(p => p.lon.toFixed(4)).join(','),
    /* La racha va aquí desde el 28-08-2026. Suyo, mirando el parte:
       *«igual más datos aparte del CAPE»*. Y con razón: el CAPE solo
       decide los días de tormenta, que son pocos; **la racha decide casi
       todos**. Va en la MISMA consulta, así que no cuesta ni una
       petición más. */
    /* Y LAS NUBES, desde el 28-08-2026. Suyo: *«al igual que rachas hay
       que meter lluvia y nubosidad de los modelos»* · *«en mis torres etc
       y torre»*. Van las cuatro —el total y las tres capas— porque ese
       día se vio que **el total solo no vale**: con bajas 0 y medias 59
       sale 27, y él tenía el cielo tapado.
       MEDIDO antes de meterlo, con sus 18 sitios y 4 días: la respuesta
       pasa de 250 a 365 KB y **el tiempo no se mueve** (0,4 → 0,3 s). */
    /* ROCÍO Y TEMPERATURA, para el bochorno. Pedido por él el 29-08-2026:
       *«poner dato de visibilidad, humedad y punto de rocío a 2 m, con eso
       se sabe si hay bochorno»* · *«datos, que hay sitio»*.

       LA VISIBILIDAD NO VA, y está medido antes de decidirlo: de los siete
       modelos solo la publican HARMONIE, ICON y GFS —48 h de 48—, y dan
       CERO ECMWF, AROME HD, ARPEGE y GEM. Entre los que faltan está AROME
       HD, que es el que él mira en la costa. Una fila con cuatro huecos de
       siete, y el suyo entre ellos, se lee como «aquí no pasa nada».

       LA HUMEDAD TAMPOCO, y por lo contrario: no es un dato aparte. Sale
       de estos dos. Comprobado con Magnus sobre 336 horas y los siete
       modelos: error máximo 0,5 % y medio 0,1 %. Es el mismo dato en otra
       forma, y una columna que repite otra ocupa sitio sin añadir nada. */
    hourly: 'weather_code,cape,convective_inhibition,precipitation,wind_gusts_10m,'
          + 'cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,'
          + 'temperature_2m,dew_point_2m',
    models: MODELOS_TORMENTA.map(m => m.om).join(','),
    timezone: 'auto', forecast_days: 4,
  }, { timeout: 25000 });

  const arr = Array.isArray(d) ? d : [d];
  const ahora = Date.now();

  /* Se guarda el CRUDO para poder recalcular el parte de otro día sin
     volver a pedir nada. Pedido por él el 26-08-2026: «pon unas pestañas
     al lado de Mis torres, jueves-viernes y sábado, con todo lo que dé
     el pronóstico para esas estaciones». Los datos ya venían en la misma
     llamada; lo único que faltaba era dejarle elegir el día.
     Cuatro días y no tres: desde el miércoles, para que entren jueves,
     viernes y sábado. */
  /* Y «Mis torres», que es con la que reparte gente. */
  for (const fc of arr) if (fc?.hourly) fc.imposibles = sanear(fc.hourly);

  S.parteRaw = { sitios: sitios.map(p => ({ ...p })), arr };

  calcularParte(sitios, arr);

  S.torresDiscrepa = sitios.map((p, n) => {
    const H = arr[n]?.hourly;
    if (!H?.time) return null;
    const capeMio = H[`cape_${mio}`];
    const codMio  = H[`weather_code_${mio}`];
    let yoLaVeo = false, avisos = [];
    for (const m of MODELOS_TORMENTA) {
      if (m.om === mio) continue;
      let tor = 0, capeMax = 0, hora = null, mioAhi = null;
      for (let i = 0; i < H.time.length; i++) {
        const t = new Date(H.time[i]).getTime();
        if (t < ahora || t > ahora + DISCREPA_HORAS * 3600e3) continue;
        if (isStormCode(codMio?.[i])) yoLaVeo = true;
        if (isStormCode(H[`weather_code_${m.om}`]?.[i])) tor++;
        const c = H[`cape_${m.om}`]?.[i];
        if (has(c) && c >= CAPE_COMBINACION
            && (!has(capeMio?.[i]) || capeMio[i] < CAPE_COMBINACION) && c > capeMax) {
          capeMax = c; hora = new Date(H.time[i]); mioAhi = capeMio?.[i];
        }
      }
      if (tor || capeMax) avisos.push({ nom: m.nom, tor, capeMax, hora, mioAhi });
    }
    if (!avisos.length) return null;
    avisos.sort((a, b) => (b.tor - a.tor) || (b.capeMax - a.capeMax));
    return { yoLaVeo, avisos };
  });
}

/* ── LO QUE HA CAMBIADO DESDE QUE LO MIRASTE ──────────────────────────
   Suyo, 26-08-2026: *«es que por correo no me entero de nada; lo del
   vigilante, si va directo a la app, genial»*. Y antes: *«si pones la
   previsión de mañana jueves ahora, ¿podrías ver si los modelos dan
   cambio esta noche?»*.

   Un aviso que no se lee no es un aviso. Esto NO necesita ni servidor ni
   correo ni que el Mac esté encendido: la propia app guarda lo que te
   enseñó la última vez y, al abrirla, te dice en qué se ha desdicho.

   REGLA: **la app nunca borra en silencio lo que ya te había dicho.** Si
   ayer decía «rayo de 15 a 21» y hoy dice otra cosa, lo de ayer sigue a
   la vista, porque puede que ya hayas mandado a alguien con aquello.

   Se guarda por DÍA. El parte del jueves se compara con el parte del
   jueves, nunca con el de otro día — que es justo el lío que él pidió
   quitar con las pestañas.                                          */

/* Lo mínimo que define un parte, para poder compararlo. Redondeado a
   propósito: que 1.902 pase a 1.918 de CAPE no es una noticia, y si se
   compara al detalle salta un «ha cambiado» en cada pasada y deja de
   mirarse. Lo que importa es si hay rayo, cuándo, y si el orden de
   magnitud se mueve. */
function huellaParte(d) {
  if (!d) return null;
  return d.salta
    ? { r: 1, i: new Date(d.ini).getHours(), f: new Date(d.fin).getHours(),
        c: Math.round((d.cape ?? 0) / 100) * 100 }
    : { r: 0, c: Math.round((d.maxCape ?? 0) / 100) * 100,
        t: has(d.minCin) ? Math.round(d.minCin / 10) * 10 : null };
}

/* La frase que él lee. Se dice SIEMPRE en su idioma: horas, no siglas. */
function fraseCambio(antes, ahora) {
  const h = n => String(n).padStart(2, '0') + ':00';
  if (!antes || !ahora) return null;
  if (antes.r && !ahora.r) return { txt: 'antes daba rayo de ' + h(antes.i) + ' a ' + h(antes.f) + ' y ahora no', peor: false };
  if (!antes.r && ahora.r) return { txt: 'antes NO daba rayo y ahora sí, de ' + h(ahora.i) + ' a ' + h(ahora.f), peor: true };
  if (antes.r && ahora.r) {
    if (antes.i !== ahora.i || antes.f !== ahora.f)
      return { txt: 'el rayo era de ' + h(antes.i) + ' a ' + h(antes.f) + ' y ahora es de ' + h(ahora.i) + ' a ' + h(ahora.f),
               peor: ahora.i < antes.i || ahora.f > antes.f };
    return null;                       // misma ventana: no es noticia
  }
  /* Ninguno de los dos da rayo: solo se avisa si se ha acercado de
     verdad al filo. Un sube y baja de CAPE sin tapa no es noticia. */
  const alFilo = x => x.c >= CAPE_COMBINACION && has(x.t) && x.t < 75;
  if (!alFilo(antes) && alFilo(ahora)) return { txt: 'antes no se acercaba y ahora se queda al filo', peor: true };
  if (alFilo(antes) && !alFilo(ahora)) return { txt: 'antes se quedaba al filo y ahora ni eso', peor: false };
  return null;
}

/* Cuánto tiene que pasar para que la foto guardada se dé por «vista».
   Si él abre la app dos veces en diez minutos no se le borra el aviso;
   si vuelve por la tarde, sí se compara con lo de por la mañana. */
const VISTO_MIN = 45;

/* La clave del día, en HORA DE AQUÍ. Con `toISOString()` no vale, y esto
   no es un detalle: la medianoche del 26 en Bermeo es el 25 a las 22:00
   en UTC, así que la foto se guardaba con la fecha de ayer y la limpieza
   de días pasados la borraba **en la misma pasada**. La función se
   quedaba muerta sin dar ni un error. Lo cazó la prueba de pantalla, no
   la lectura del código. */
function claveDia(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
       + '-' + String(d.getDate()).padStart(2, '0');
}

/* «LO VE ICON» NO DICE SI LOS DEMÁS LO VEN. Suyo, 27-08-2026.

   Y la cuenta honrada no es sobre cinco modelos, sino sobre los que
   PUEDEN contestar: **ECMWF y AROME HD no publican la tapa** —0 horas de
   24, medido— así que ni ven ni dejan de ver. Poner «1 de 5» diría que
   cuatro lo descartan, y cuatro no lo han mirado.

   Si lo ven todos los que podían, no se dice nada: eso ya es el caso
   normal y añadirlo sería ruido. */
function cuantosLoVen(d) {
  if (!d?.nPodian || d.nPodian < 2) return '';
  if (d.nVen >= d.nPodian) return '';
  return ` · ${d.nVen} de ${d.nPodian} que publican la tapa`;
}

/* ¿DE CUÁNDO ES ESTE PARTE? Puesto el 27-08-2026 porque él lo preguntó
   y tenía razón: no lo ponía en ningún lado.

   Tres estados, y el tercero es el que existe de verdad: la app se queda
   abierta en el móvil, él la mira a la mañana siguiente, y sin sello no
   hay NADA en pantalla que diga que esos números son de anoche.

   El umbral son 45 min y no una hora porque es lo que ya usa `VISTO_MIN`
   para el «HA CAMBIADO desde que lo miraste»: mismo criterio de cuándo
   un dato deja de ser el de ahora, en los dos sitios. */
const PARTE_VIEJO_MIN = 45;

function selloParte(ahora = Date.now()) {
  if (!S.parteCuando) return null;
  const d = new Date(S.parteCuando);
  const min = Math.floor((ahora - S.parteCuando) / 60000);
  const hora = String(d.getHours()).padStart(2, '0') + ':'
             + String(d.getMinutes()).padStart(2, '0');
  const dia = diaSiNoEsHoy(d);          // '' si es hoy, ' de AYER' si no
  const cuanto = min < 60 ? `hace ${Math.max(0, min)} min`
    : `hace ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;

  /* «CALCULADO» NO, «DATOS» SÍ. Suyo, 28-08-2026, mirando el sello:
     *«¿en vez de poner "calculado" podéis poner "datos actualizados a
     las xx"? Entiendo que es para todas las torres.»*

     Y las dos cosas son ciertas. «Calculado» suena a cuenta interna de
     la app y lo que él quiere saber es **de cuándo son los números**.
     Y sí es para todas: los emplazamientos se piden en UNA sola consulta,
     así que este sello vale para los de la lista entera. Se dice cuántos,
     que si no hay que fiarse de que sea así.

     Lo que NO se puede decir es «actualizados», a secas y sin más: los
     datos se PIDEN a esta hora, pero la pasada del modelo que hay detrás
     es más vieja —esta mañana, entre 2,6 y 8,6 horas según el modelo—.
     Decir «actualizados a las 10:49» se leería como que el pronóstico es
     de las 10:49, y no lo es. «Datos pedidos a las 10:49» es lo mismo que
     él quiere saber y además es verdad. */
  const cuantos = S.parteRaw?.sitios?.length ?? S.saved?.length ?? 0;
  const dondes = cuantos ? ` · los ${cuantos} emplazamientos a la vez` : '';

  if (dia) return { clase: 'ayer',
    txt: `⚠ Datos pedidos${dia} a las ${hora} — ${cuanto}. NO son de hoy: recarga antes de decidir.` };
  if (min >= PARTE_VIEJO_MIN) return { clase: 'viejo',
    txt: `⚠ Datos pedidos hoy a las ${hora} — ${cuanto}. Pulsa recargar para tenerlo al día.` };
  return { clase: '',
    txt: `Datos pedidos hoy a las ${hora}${min >= 1 ? ` — ${cuanto}` : ''}${dondes}` };
}

function pintarSelloParte() {
  const el = $('#parteSello'); if (!el) return;
  const s_ = selloParte();
  if (!s_) { el.textContent = ''; el.className = 'psello'; return; }
  el.textContent = s_.txt;
  el.className = 'psello' + (s_.clase ? ' psello--' + s_.clase : '');
}

/* ── EL PARTE DEL DÍA, en pantalla ───────────────────────────────────
   Los sitios ordenados por lo que rompe, y cada uno con **las dos
   cifras y su hora**. Nada de series de números pelados: eso ya se
   probó con él y no se entendía.

   Los que NO saltan también dicen POR QUÉ no, que es lo que él
   preguntó: si le falta gasolina o si la tapa aguanta. No es lo mismo
   y no se decide igual.                                            */
function renderParte() {
  const card = $('#parteCard'), el = $('#parte');
  if (!card || !el) return;

  /* SIN EMPLAZAMIENTOS GUARDADOS NO SE ESCONDE: SE DICE.
     Comprobado el 26-08-2026 abriendo la app en un navegador limpio —
     la tarjeta desaparecía sin más y no había forma de saber si es que
     no había parte o es que faltaba algo. El hueco callado otra vez.
     Y esto le pasa de verdad: los emplazamientos viven en el navegador
     de CADA aparato, así que puede tenerlos en el Mac y no en el móvil,
     y el móvil es donde lo mira en la furgoneta. */
  if (!S.saved?.length) {
    $('#parteHint').textContent = '';
    el.innerHTML = `<p class="note"><b>Aquí te saldrá el parte de cada emplazamiento</b>
      — la ventana de rayo, el CAPE con su tapa y la lluvia — en cuanto guardes
      alguno con el <b>♥</b> de arriba. Ojo: se guardan en <b>este</b> aparato.
      Si los tienes en el ordenador, guárdalos también en el móvil.</p>`;
    card.hidden = false;
    return;
  }
  if (!S.parteTorres || !S.torres?.length) {
    $('#parteHint').textContent = '· cargando…';
    el.innerHTML = `<p class="note">Pidiendo los datos de tus emplazamientos…</p>`;
    card.hidden = false;
    return;
  }

  const hm = d => String(d.getHours()).padStart(2, '0') + ':00';
  /* El día SOLO se nombra si no es el que cubre la tarjeta. Cuando el
     parte es del jueves, el título ya lo dice y repetir «mañana» en cada
     renglón es ruido — salía «RAYO mañana a las 23:00 · Llueve poco
     mañana 7 horas sueltas… a las 19:00 de mañana», tres veces en dos
     líneas. Es la misma regla que él puso para «hoy». */
  const diaDelParte = ventanaParte().dia;
  const dia = d => {
    const mismo = d.getFullYear() === diaDelParte.getFullYear()
               && d.getMonth() === diaDelParte.getMonth()
               && d.getDate() === diaDelParte.getDate();
    if (mismo) return '';
    const h = new Date();
    const n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate())
                        - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
    return n === 0 ? 'hoy ' : n === 1 ? 'mañana '
         : d.toLocaleDateString('es', { weekday: 'long' }) + ' ';
  };

  /* Una ventana que cruza la medianoche TIENE que decir el día del
     final. «De 23:00 a 01:00» no dice si esa una es la de esta noche o
     la de mañana, y con eso se manda o no se manda a alguien. */
  const tramo = (a, b) => {
    if (a.getTime() === b.getTime()) return `${dia(a)}a las ${hm(a)}`;
    const d1 = dia(a), d2 = dia(b);
    return d1 === d2
      ? `${d1}de ${hm(a)} a ${hm(b)}`
      : `de ${d1 || 'hoy '}${hm(a)} a ${d2 || 'hoy '}${hm(b)}`;
  };

  /* Números como se escriben aquí: 2.680 y 0,4. A mano y no con
     `toLocaleString`, que depende de que el navegador traiga la tabla de
     idiomas completa; sin ella devuelve «2680» y el parte queda medio en
     castellano y medio no. */
  const nMm   = v => v.toFixed(1).replace('.', ',');

  /* La lluvia, en palabras y con su hora. Nunca en milímetros pelados:
     0,4 mm se lee «no llueve» y le mojó Bilbao una mañana entera. */
  /* La racha del día, en su propia línea. Es el dato que decide casi
     todos los días, y hasta hoy no salía en el parte. */
  /* ── LO QUE MARCA EL APARATO, AL LADO DE LO QUE DICE EL MODELO ──────
     Suyo, 28-08-2026, señalando el hueco de la derecha del parte:
     *«mejor poner todo ahí, sin tener que hacer otra pantalla con todas
     las estaciones otra vez; lo prefiero así, y pones datos de AEMET o
     lo que sea, y a la derecha ves que hay sitio de sobra»*.

     Y tiene razón por partida doble: el sitio estaba ahí sin usar, y
     obligarle a bajar quince tarjetas para ver las medidas era enterrar
     lo único que es un hecho. A la izquierda, el pronóstico. A la
     derecha, **el anemómetro**.

     Se dice SIEMPRE de qué estación viene, a cuántos kilómetros y de
     hace cuánto: no es lo mismo un aparato a 300 metros en su cima que
     uno a nueve kilómetros en el valle, y viéndolo lo juzga él. Si no
     hay medida, se dice que no la hay — nunca se rellena con el modelo,
     que entonces dejaría de ser una medida. */
  /* ── LA COMPARATIVA, EN UNA TABLA Y A TODO EL ANCHO ─────────────────
     Rehecha el 28-08-2026 con su queja delante, que era doble:

       *«los de la derecha no me gustan, pequeño; con todo el sitio que
       hay, en un recuadro pequeño cuesta leerlos»*

     Y al mirarlo se veía algo peor que el tamaño: **lo único medido de
     toda la tarjeta era lo más pequeño de la pantalla**, metido en una
     barra lateral estrecha, mientras el centro estaba medio vacío. Y los
     dos lados usaban formatos distintos —los modelos en párrafo, la
     estación en lista—, así que el ojo no podía comparar: había que
     buscar cada cifra en un sitio y luego en el otro.

     Ahora es una tabla, a todo el ancho y con el mismo cuerpo de letra
     en las dos columnas: **una fila por magnitud, los modelos a la
     izquierda y la estación a la derecha**, que es exactamente lo que él
     pidió —*«a la izquierda los valores de los modelos, y a la derecha
     los de las estaciones»*—.

     Y la cabecera de la columna de la estación va en tamaño legible, no
     en letra de nota al pie: **a cuántos kilómetros, a qué altura mide y
     de hace cuánto son parte del dato**. Sin eso, 26 km/h medidos a 18 m
     se confunden con 26 a ras de suelo, que es la mitad de viento. */
  const comparativa = (p) => {
    const H = S.torres?.find(t => key(t.place) === key(p))?.horas?.[0];
    const M = S.medidoTorres?.get(key(p));
    if (!H && !M) return '';

    /* ── LA RACHA DE LA TABLA, DEL MISMO ARRAY QUE LA TIRA ────────────
       Cazado el 31-08-2026 en su pantallazo de Sollube: la tabla decía
       «Racha 21» con la cabecera prometiendo «los 5 juntos», y la tira
       de abajo enseñaba ICON 22. La celda salía del modelo CARGADO
       solamente (S.torres carga con un único modelo) — un número que no
       era lo que la cabecera juraba. Ahora la celda toma el MÁXIMO de
       los cinco del MISMO S.parteRaw que pinta la tira: por
       construcción, la tabla nunca puede quedar por debajo de la tira.
       Y si el que manda no es el cargado, se dice de quién es. */
    const rachaCinco = (() => {
      const raw = S.parteRaw;
      if (!raw?.sitios?.length) return null;
      const n = raw.sitios.findIndex(x => key(x) === key(p));
      const HH = raw.arr?.[n]?.hourly;
      if (n < 0 || !HH?.time) return null;
      const ahora = Date.now();
      const i = HH.time.findIndex(t => {
        const d = new Date(t).getTime();
        return d <= ahora && d + 3600e3 > ahora;
      });
      if (i < 0) return null;
      let mejor = null;
      for (const m of MODELOS_TORMENTA) {
        const v = HH[`wind_gusts_10m_${m.om}`]?.[i];
        if (has(v) && (!mejor || v > mejor.v)) mejor = { v, nom: m.nom };
      }
      return mejor;
    })();

    /* ── SE RESTA LO QUE SE VE, NO OTRA COSA ─────────────────────────
       Lo cazó él en su pantalla el 02-09-2026, en BI BERMEO: la tabla
       ponía **36 km/h** (los modelos, «lo da ICON») contra **20 km/h**
       (Almike), y justo debajo «nuestro pronóstico se pasó 3 km/h».

       Ese 3 no salía de esos dos números: restaba la racha del modelo
       CARGADO (23) menos la medida, mientras arriba se enseñaba la más
       alta de los cinco (36). O sea, el veredicto juzgaba a un modelo
       que no era el que estaba a la vista.

       Es exactamente el fallo del 30-08 con la altitud —comparar dos
       cosas que no son comparables— y la regla de este proyecto desde
       entonces: antes de restar dos números, saber de dónde sale cada
       uno. Ahora se resta EL QUE SE ENSEÑA, y si es el más alto de los
       cinco se dice de quién es. */
    const mostrado = rachaCinco?.v ?? H?.gust10;
    const dif = (has(mostrado) && has(M?.racha)) ? Math.round(M.racha - mostrado) : null;
    const deQuien = (rachaCinco && has(H?.gust10)
                     && Math.round(rachaCinco.v) > Math.round(H.gust10))
      ? rachaCinco.nom : null;
    /* Desde `medidoEn`, igual que la tarjeta de medidas: `haceMinutos`
       viene congelado del servidor y con una respuesta guardada
       rejuvenecía el dato (01-09-2026). Éste es el sello del veredicto
       «nuestro pronóstico se pasó X», así que decir mal su hora es decir
       mal contra qué se está comparando. */
    const tM = M?.medidoEn ? Date.parse(M.medidoEn) : NaN;
    const minM = Number.isFinite(tM)
      ? Math.max(0, Math.round((Date.now() - tM) / 60000))
      : (has(M?.haceMinutos) ? M.haceMinutos : null);
    const hace = minM != null
      ? (minM < 90 ? `hace ${Math.max(1, minM)} min` : `hace ${Math.round(minM / 60)} h`)
      : '';

    const fila = (etq, mod, est, tono) => (mod || est)
      ? `<tr${tono ? ` data-t="${tono}"` : ''}><th>${etq}</th>
         <td>${mod || '—'}</td><td>${est || '—'}</td></tr>` : '';

    const tonoRacha = !has(M?.racha) ? ''
      : M.racha >= listonRafaga().no ? 'no' : M.racha >= listonRafaga().warn ? 'warn' : 'go';

    const cuerpo =
        fila('Racha',
             rachaCinco ? `<b>${wtxt(rachaCinco.v, true)}</b>${
               has(H?.gust10) && Math.round(rachaCinco.v) > Math.round(H.gust10)
                 ? ` <small>lo da ${esc(rachaCinco.nom)}</small>` : ''}`
             : has(H?.gust10) ? `<b>${wtxt(H.gust10, true)}</b>` : '',
                      has(M?.racha) ? `<b>${wtxt(M.racha, true)}</b>` : '', tonoRacha)
      + fila('Viento',
             has(H?.w10) ? `<b>${wtxt(H.w10, true)}</b>${has(H?.dir) ? ` del ${rumboLargo(H.dir)}` : ''}` : '',
             has(M?.viento) ? `<b>${wtxt(M.viento, true)}</b>${has(M?.direccion) ? ` del ${rumboLargo(M.direccion)}` : ''}` : '')
      + fila('Lluvia',
             has(H?.prec) ? `<b>${mmTxt(H.prec)} mm</b>` : '',
             has(M?.lluvia) ? `<b>${mmTxt(M.lluvia)} mm</b>` : (M ? 'no la mide' : ''))
      + fila('Temperatura',
             has(H?.temp) ? `<b>${H.temp.toFixed(1).replace('.', ',')} °C</b>` : '',
             has(M?.temperatura) ? `<b>${M.temperatura.toFixed(1).replace('.', ',')} °C</b>` : '')
      + fila('Humedad',
             has(H?.hum) ? `<b>${H.hum} %</b>` : '',
             has(M?.humedad) ? `<b>${M.humedad} %</b>` : '')
      /* El cielo, pedido por él el 31-08-2026 mirando esta tabla: «aquí
         falta nubosidad, si hay o despejado». Del lado del modelo va el
         código visto (el del dueño del cielo, con el agua mandando) y el
         % de nubes; del lado del aparato, la verdad: los de Euskalmet y
         AEMET no miden la nube — decirlo evita que la celda vacía se lea
         como fallo de la estación. */
      + fila('Cielo',
             (has(H?.code) || has(H?.cloud))
               ? `<b>${esc(cieloVisto(H).txt ?? '—')}</b>${has(H?.cloud) ? ` · ${Math.round(H.cloud)} %` : ''}`
               : '',
             M ? '<span class="pt__tab__no">ningún aparato lo mide</span>' : '')
      /* El CAPE y la tapa solo tienen columna de modelo, y se dice por
         qué: no existe el aparato que los mida. Dejar la celda vacía sin
         explicarlo se leería como que la estación falla. */
      + fila('CAPE y tapa',
             /* «tapa 104» va dentro de su propio <span> que no se parte:
                en su Ulefone salía «30 · tapa» arriba y «104» abajo, y un
                número solo en un renglón no se sabe de qué es. Visto en
                sus capturas del 29-08-2026 a las 10:29. */
             has(H?.cape) ? `<b>${H.cape.toFixed(0)}</b>${has(H?.cin)
               ? ` <span class="pt__tab__par">· tapa ${H.cin.toFixed(0)}</span>` : ''}` : '',
             '<span class="pt__tab__no">ningún aparato lo mide</span>');

    if (!cuerpo) return '';

    /* ── SI LA ESTACIÓN NO ESTÁ A SU ALTURA, NO HAY VEREDICTO ────────
       Suyo, 28-08-2026, y era un fallo de los serios: *«en Oiz casi
       están cerca, pero GERNIKA2 está mucho más alto de donde está la
       unidad meteorológica; no es que se haya pasado, están en otra
       altitud, otro terreno»*.

       Y tenía razón. La app decía «nuestro pronóstico se pasó 8 km/h» en
       Gernika comparando su emplazamiento —a 266 m— contra Arteaga, que
       está a 19. **247 metros de desnivel.** Eso no es que el modelo se
       pase: es que el aparato está midiendo otro sitio.

       Los cortes son los que ya usa `desnivel()` en la pestaña Torre, no
       unos nuevos inventados para esto: por debajo de 80 m se comparan,
       de 80 a 200 se compara con reservas, y a partir de 200 **no se
       dice nada** — se dice el desnivel y que él juzgue, que es su norma.

       Es la misma regla que el pulso del vigilante: cuando no se puede
       saber, se dice que no se puede saber. Un veredicto falso es peor
       que ningún veredicto. */
    const cotaSitio = cfgDe(p)?.cota;
    const desn = (has(cotaSitio) && has(M?.altitud)) ? Math.round(cotaSitio - M.altitud) : null;
    const lejosEnAltura = has(desn) && Math.abs(desn) >= 200;
    const algoDeAltura  = has(desn) && Math.abs(desn) >= 80 && !lejosEnAltura;

    const veredicto = lejosEnAltura
      ? `<div class="pt__veredicto" data-d="ni">no se pueden comparar:
         <b>${Math.abs(desn)} m de desnivel</b> entre tu emplazamiento
         (${Math.round(cotaSitio)} m) y la estación (${M.altitud} m).
         Son dos sitios distintos, no un fallo del pronóstico</div>`
      : has(dif)
      ? `<div class="pt__veredicto" data-d="${
          dif >= 3 ? 'corto' : dif <= -3 ? 'pasa' : 'clava'}">nuestro pronóstico ${
          dif >= 3 ? `se quedó <b>${difVista(M.racha, mostrado, true)} corto</b>`
        : dif <= -3 ? `se pasó <b>${difVista(M.racha, mostrado, true)}</b>`
        : '<b>clavó</b>'}${deQuien
          ? ` <span class="pt__veredicto__ojo">— el de ${esc(deQuien)}, que es el que se enseña arriba</span>` : ''}${algoDeAltura
          ? ` <span class="pt__veredicto__ojo">— con ${Math.abs(desn)} m de desnivel entre los dos</span>` : ''}</div>`
      : '';

    return `<div class="pt__comp">
      <table class="pt__tab">
        <thead><tr>
          <th>ESTA HORA</th>
          <!-- «A 10 M» EN LA CABECERA, y no es un adorno. Él preguntó
               *«¿es a 10 m o qué significa?»* al ver «viento 10 km/h»,
               porque hay dos dieces y ninguno dice cuál es cuál. Y detrás
               hay algo peor: los modelos dan el viento **a 10 m por
               convenio** y la estación del Oiz mide **a 20**. Si una
               columna dice su altura y la otra no, parecen lo mismo y no
               lo son — suyo, medido ese día con su anemómetro en la mano:
               *«allí, cinco metros más es el doble»*. -->
          <th>LOS MODELOS<span>los ${MODELOS_TORMENTA.length} juntos · a 10 m</span></th>
          <!-- El «·» va pegado con espacio duro: en el móvil se quedaba
               solo en su propia línea —«ESTACIÓN» / «·» / «Matxitxako»—
               y parecía un fallo de la app. Visto en sus capturas del
               29-08-2026. -->
          <th>${M ? `ESTACIÓN&nbsp;· ${esc(M.nombre)}<span>${esc(M.fuente || 'AEMET')} · a ${
              String(M.km).replace('.', ',')} km${has(M.altitud) ? ` · ${M.altitud} m` : ''}${
              M.alturaAnemometro ? ` · mide a ${M.alturaAnemometro} m` : ''}${
              hace ? ` · ${hace}` : ''}</span>`
            /* ── TRES ESTADOS, NO DOS ────────────────────────────
               Cazado el 30-08-2026 con un pantallazo suyo de las 10:33,
               recién cargado: BI BERMEO ponía «ninguna cerca» y unos
               segundos después, más abajo, salía **Almike a 1,1 km**.

               No era un fallo de la estación: es que las medidas llegan
               DESPUÉS del primer pintado, y mientras tanto la app
               afirmaba que no había ninguna. Un dato que todavía no ha
               llegado no es un dato que no existe — es exactamente el
               fallo que este proyecto lleva persiguiendo desde el mapa
               sin teselas y el vigilante mudo.

               `S.medidoTorres` es `null` mientras no se ha preguntado y
               un Map cuando ya se sabe. Así se distinguen los tres. */
            /* ── Y AEMET TAMBIÉN PUEDE HABER FALLADO ──────────────
               Revisión del 04-09-2026: con AEMET caído se rotulaba
               «ninguna cerca» —o peor, «solo AEMET» nombrando como
               fuente justo a la que no se pudo preguntar—. Ahora se
               dice de quién es el hueco. */
            : S.medidoTorres ? (S.medidoSinEuskalmet && S.medidoSinAemet
                ? 'ESTACIÓN<span>no he podido preguntar ni a Euskalmet ni a AEMET</span>'
                : S.medidoSinEuskalmet
                ? 'ESTACIÓN<span>solo AEMET · falta Euskalmet</span>'
                : S.medidoSinAemet
                ? 'ESTACIÓN<span>solo Euskalmet · no he podido preguntar a AEMET</span>'
                : 'ESTACIÓN<span>ninguna cerca</span>')
            : S.medidoFallo   ? 'ESTACIÓN<span>no se ha podido leer</span>'
            :                   'ESTACIÓN<span>midiendo…</span>'}</th>
        </tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>
      ${veredicto}
      ${unoPorUno(p)}
    </div>`;
  };

  /* ── CADA MODELO CON SU NÚMERO ──────────────────────────────────────
     Suyo, 28-08-2026: *«ahí, que hay mucho espacio, los modelos todos con
     sus valores»*. No cuesta ni una consulta más: estas cifras ya están
     pedidas para el aviso de tormenta y estaban sin enseñarse.

     Se ordena de mayor a menor y **se marca el más alto**, que es el que
     se queda la app para el semáforo (`peorRacha()`). Así ve de un
     vistazo si el número que manda lo sostienen los demás o va uno solo
     por delante — que es lo que pasó con ICON el 27-08, y al revés en
     Bilbao esta madrugada con ICON dando 6,8 y el aparato midiendo 28.

     No se promedia nunca: el desacuerdo ES la información. */
  const unoPorUno = (p) => {
    const raw = S.parteRaw;
    if (!raw?.sitios?.length) return '';
    const n = raw.sitios.findIndex(x => key(x) === key(p));
    const H = raw.arr?.[n]?.hourly;
    if (n < 0 || !H?.time) return '';

    const ahora = Date.now();
    const i = H.time.findIndex(t => {
      const d = new Date(t).getTime();
      return d <= ahora && d + 3600e3 > ahora;
    });
    if (i < 0) return '';

    /* ── LOS TRES, Y EN SU ORDEN: LLUVIA, RAYO, VIENTO ────────────────
       Suyo, 28-08-2026, después de ver la fila del viento sola:
       *«lluvia, rayos, viento, de entrada»* y *«para mí no solo es
       importante el viento»*.

       Ese es su orden y es el de su trabajo, no el nuestro: el 90 % de
       lo que hace es caseta, fusibles al aire y armarios de intemperie,
       donde manda el agua; el rayo es su único veto; y el viento decide
       la torre, que es una vez al año — y la pista, que es otra cosa.

       En las tres manda **el que más da**, nunca la media: el 26-08 la
       app leyó la lluvia del modelo cargado —AROME— y dijo «sin lluvia
       en 24 h» en los diez emplazamientos el día que ICON daba 1,3 mm en
       Durango.

       Y en las tres se dice **quién no lo publica**, que no es lo mismo
       que un cero: ECMWF y AROME HD no dan la tapa —0 horas de 24,
       medido—, así que sobre el rayo no opinan, no es que digan que no. */
    const fila = (etq, pie, tipo, datos) => {
      if (!datos.length) return '';
      /* EL RESALTADO NO PUEDE CAER EN UN NÚMERO CON AVISO. Visto en sus
         pantallazos del 29-08: «Automático 72 % ⚠ (sus capas suman 7)»
         iba destacado, como si fuese el que cuenta, siendo justo el que
         se contradice. Se resalta el más alto de los que NO llevan aviso;
         si todos lo llevan, no se resalta ninguno. */
      const sanos = datos.filter(x => !x.mudo && !x.ojo);
      const alto = (sanos.length ? sanos : []).reduce(
        (m2, x) => (m2 === null || x.v > m2 ? x.v : m2), null);
      /* ── DE PÍLDORAS A BARRAS ────────────────────────────────────────
         Suyo, 31-08-2026, con la tira de chips delante: *«esto encuentro
         difícil de leer; se podría poner como lo de las rachas»* · *«que
         no perdamos datos, que ya sabes que quiero datos, pero no
         repetidos»* · *«y que se lean bien»*.

         Y la razón es visual: seis píldoras en fila obligan a leer seis
         parejas nombre-número y compararlas de memoria. La barra hace la
         comparación por ti: el más largo ES el más alto. Es el mismo
         molde que la ráfaga de la ficha, que él señaló como el bueno.
         Mismos datos, mismos avisos (el ⚠ y el «no la publica» viajan al
         lado del valor), nada repetido. La barra se escala al mayor de
         la fila; los textos sin número (mudos) van sin barra. */
      const conNum = datos.filter(x => has(x.v) && !x.mudo);
      const tope = conNum.length ? Math.max(...conNum.map(x => x.v), 1) : 1;
      return `<div class="pt__uno pt__uno--b"${tipo ? ` data-q="${tipo}"` : ''}>
        <span>${etq}</span>
        ${datos.map(x => {
          const esMax = alto !== null && x.v === alto && x.v > 0 && !x.mudo && !x.ojo;
          const pc = (has(x.v) && !x.mudo) ? Math.max(2, Math.min(100, x.v / tope * 100)) : 0;
          return `<div class="ptb__f"${esMax ? ' data-max="1"' : ''}${x.mudo ? ' data-mudo="1"' : ''}>
            <span class="ptb__n">${esc(x.n)}</span>
            <span class="ptb__b"><i style="width:${pc}%"></i></span>
            <span class="ptb__v"><b>${x.txt}</b></span>
          </div>`;
        }).join('')}
        <u>${pie}</u></div>`;
    };

    const deCada = (campo) => MODELOS_TORMENTA
      .map(m => ({ n: m.nom, v: H[`${campo}_${m.om}`]?.[i] }))
      .filter(x => has(x.v))
      .sort((a, b) => b.v - a.v);

    // ── LLUVIA ────────────────────────────────────────────────────────
    const ls = deCada('precipitation');
    const hayAgua = ls.some(x => x.v > 0);

    /* ── Y EN SECO, LO QUE VE CADA UNO EN LAS PRÓXIMAS 24 H ───────────
       Suyo, 28-08-2026, cerrando la noche: *«cape, rayos, lluvia, viento
       lo principal y quiero datos de todos los modelos para comparar y
       decidir, ya lo sabéis»* — y *«nubosidad también»*.

       La fila de esta hora solo salía cuando YA caía agua. En seco, nada
       — y el caso medido del 26-08 es exactamente ese hueco: la app dijo
       «sin lluvia en 24 h» leyendo el modelo cargado mientras ICON daba
       1,3 mm en Durango. Quien avisa con antelación es el máximo de las
       próximas 24 h de CADA modelo, no la hora en curso.

       Cada cifra lleva su hora al lado. Nada inventado: es el valor tal
       cual de la serie horaria de cada modelo. Si los cinco dan cero en
       las 24 h, no se pinta fila —para eso ya está la línea «Seco en las
       próximas 24 h»—. */
    const ls24 = MODELOS_TORMENTA.map(m => {
      const serie = H[`precipitation_${m.om}`];
      if (!serie) return null;
      let v = null, cuando = null;
      for (let j = i; j < H.time.length && j < i + 24; j++) {
        if (!has(serie[j])) continue;
        if (v === null || serie[j] > v) { v = serie[j]; cuando = H.time[j]; }
      }
      if (v === null) return null;
      return { n: m.nom, v,
               txt: v > 0 ? `${mmTxt(v)}<small> mm · a las ${cuando.slice(11, 13)}h</small>`
                          : `${mmTxt(v)}<small> mm</small>` };
    }).filter(Boolean).sort((a2, b2) => b2.v - a2.v);

    const lluvia = hayAgua
      ? fila('LLUVIA DE CADA MODELO, ESTA HORA',
             'en mm/h · el más alto es el que usa el semáforo', 'agua',
             ls.map(x => ({ ...x, txt: mmTxt(x.v) })))
      : (ls24.length >= 2 && ls24.some(x => x.v > 0))
        ? fila('LLUVIA QUE VE CADA MODELO EN 24 H',
               'lo más fuerte que ve cada uno y a qué hora · basta con que uno acierte:'
               + ' el 26-08 solo ECMWF vio el sirimiri que sí cayó', 'agua', ls24)
        : '';

    /* ── RAYO ──────────────────────────────────────────────────────────
       Con la MISMA regla que el semáforo: código de tormenta, o CAPE de
       700 para arriba con la tapa por debajo de 75. Nada nuevo, y por eso
       no puede decir una cosa aquí y otra arriba. */
    const rs = MODELOS_TORMENTA.map(m => {
      const c = H[`cape_${m.om}`]?.[i], k = H[`convective_inhibition_${m.om}`]?.[i];
      const cod = H[`weather_code_${m.om}`]?.[i];
      if (isStormCode(cod)) return { n: m.nom, v: 2, txt: 'sí' };
      if (!has(c)) return null;
      if (!has(k)) return { n: m.nom, v: -1, txt: 'no la publica', mudo: true };
      return c >= CAPE_COMBINACION && k < 75
        ? { n: m.nom, v: 2, txt: `${c.toFixed(0)}·${k.toFixed(0)}` }
        : { n: m.nom, v: 0, txt: 'no' };
    }).filter(Boolean).sort((a, b) => b.v - a.v);
    const alguienVeRayo = rs.some(x => x.v === 2);

    /* ── Y CUANDO NADIE VE RAYO, LOS NÚMEROS IGUAL ────────────────────
       Suyo, 28-08-2026: *«y rayos claro»* — la fila de fichas la quiere
       para los cuatro: racha, lluvia, nubes y rayo. Hasta hoy esta fila
       solo salía cuando algún modelo saltaba, y el resto del año —que es
       casi siempre— el CAPE y la tapa de los demás modelos no se veían
       en ningún sitio: solo los del modelo cargado.

       Y el caso que lo justifica está medido: **Zarautz, 27-08**, cayó un
       rayo donde los cinco daban código sin tormenta. En el punto, ICON
       daba CAPE 520 con tapa 27 y el Automático 340·31. Mirando un solo
       modelo ni te enteras de que otro ve la gasolina más cargada.

       Sin rayo a la vista la fila cambia de cara: CAPE·tapa de cada uno,
       el de más CAPE marcado, y el listón escrito en el pie. La regla no
       cambia: sigue siendo la del semáforo. */
    const rsNums = MODELOS_TORMENTA.map(m => {
      const c = H[`cape_${m.om}`]?.[i], k = H[`convective_inhibition_${m.om}`]?.[i];
      if (!has(c)) return null;
      /* ── «SIN TAPA» QUERÍA DECIR DOS COSAS OPUESTAS ─────────────────
         Cazado el 29-08-2026 a las 00:14, en sus propios pantallazos de
         Mis torres. En la misma tarjeta salía:

             19 TAPA J/KG · SIN TAPA        <- hay dato: la tapa es floja
             ECMWF 30 · sin tapa            <- NO hay dato: no lo publica

         Arriba «sin tapa» es `textoTapa(cin<25)` y significa que la tapa
         **no frena**, o sea peligro. Abajo significaba que el modelo no
         lo publica, o sea que **no se sabe**. Las mismas dos palabras
         para lo contrario, a diez líneas de distancia.

         Y la lectura equivocada es la mala: «ECMWF 30 · sin tapa» se leía
         como «CAPE 30 con la tapa abierta». Aquí no se puede tener una
         palabra que se lea al revés. */
      if (!has(k)) return { n: m.nom, v: c, txt: `${c.toFixed(0)} · no la publica`, mudo: true };
      return { n: m.nom, v: c, txt: `${c.toFixed(0)}·${k.toFixed(0)}` };
    }).filter(Boolean).sort((a, b) => b.v - a.v);

    const rayo = alguienVeRayo
      ? fila('RAYO SEGÚN CADA MODELO, ESTA HORA',
             'CAPE·tapa cuando salta · «no la publica» = ese modelo no da la tapa, no que diga que no',
             'rayo', rs)
      /* En ámbar, no en rojo: aquí nadie está saltando. El rojo de la
         fila del rayo se queda para cuando salta de verdad — un 40 de
         CAPE pintado en rojo se lee como peligro y es mentira. Cazado
         mirando la pantalla el 28-08-2026, antes de que lo viera él. */
      : rsNums.length < 2 ? '' : fila(
          'GASOLINA Y TAPA DE CADA MODELO, ESTA HORA',
          'CAPE·tapa · rompe desde CAPE 700 con la tapa por debajo de 75 · '
          + '«no la publica» = ese modelo no da la tapa, no que diga que no',
          'cape', rsNums);

    // ── VIENTO ────────────────────────────────────────────────────────
    const vs = deCada('wind_gusts_10m');
    if (vs.length < 2 && !lluvia && !rayo) return '';
    const viento = vs.length < 2 ? '' : fila(
      'RACHA DE CADA MODELO, ESTA HORA',
      'el más alto es el que usa el semáforo', '',
      vs.map(x => ({ ...x, txt: wtxt(x.v) })));

    /* ── NUBES ────────────────────────────────────────────────────────
       Suyo, 28-08-2026: *«al igual que rachas hay que meter lluvia y
       nubosidad de los modelos que dice»* · *«en mis torres etc y torre»*.

       Y NO se enseña solo el total, que es la trampa que se destapó esa
       misma noche: `cloud_cover` no es la suma ni el máximo de las capas
       —las combina—, así que con **bajas 0 · medias 59 · altas 57** el
       total sale **27** y él estaba mirando un cielo tapado desde su
       ventana de Bermeo.

       Por eso, cuando la capa que manda se separa 25 puntos o más del
       total, se pone al lado: «ECMWF 27 (medias 59)». Sin eso el número
       parece un fallo de la app, y no lo es.

       Y hay modelos que no publican el total —AROME HD: 0 horas de 168,
       medido en Bermeo, Vitoria y Madrid—. Ésos se marcan `mudo`, igual
       que con la tapa: no es que digan que está despejado. */
    /* ── EL DUEÑO DEL CIELO, EN SU PROPIA LISTA ──────────────────────
       Cazado el 31-08-2026 en su pantallazo: la tabla decía «Cielo:
       Cubierto · 99 %» —que es ARPEGE, el elegido por acierto— y esta
       tira enseñaba cinco modelos SIN ARPEGE. El número que la app USA
       no estaba entre los que ENSEÑA: un dato sin cara. La petición del
       parte solo trae a los cinco de tormenta, así que la fila del dueño
       se saca del fc del propio sitio (S.torres, ya cargado y con el
       cielo pisado por el dueño en completarTorres) — emparejando POR
       HORA, no por índice, que las dos consultas arrancan en momentos
       distintos y los índices no casan (la trampa del 29-08). */
    const duenoCielo = (() => {
      /* Por la puerta que sabe quién mide el cielo (préstamo incluido); leer
         el elegido a pelo, vacío desde el 02-09, dejaba esta fila sin
         pintarse nunca. Revisión del 04-09-2026. */
      const e = quienLoMide('cloud_cover');
      if (!e || MODELOS_TORMENTA.some(m => m.om === e)) return null;
      /* Las horas del sitio ya llevan el cielo del dueño (completarTorres
         lo pisa antes de buildHours). Se empareja por SU timestamp con la
         hora de esta tira — nunca por índice. */
      const hs = S.torres?.find(t => key(t.place) === key(p))?.horas;
      const hDue = hs?.find(h => h.t === H.time[i]);
      if (!hDue || !has(hDue.cloud)) return null;
      return { n: nombreDeModelo(e), v: hDue.cloud, ojo: false,
               txt: `${Math.round(hDue.cloud)} %<small> · el que pinta el cielo</small>` };
    })();

    const ns = MODELOS_TORMENTA.map(m => {
      const tot = H[`cloud_cover_${m.om}`]?.[i];
      const cap = nubesPorCapas({
        cloud_cover:      tot,
        cloud_cover_low:  H[`cloud_cover_low_${m.om}`]?.[i],
        cloud_cover_mid:  H[`cloud_cover_mid_${m.om}`]?.[i],
        cloud_cover_high: H[`cloud_cover_high_${m.om}`]?.[i],
      });
      if (!has(tot)) {
        return cap ? { n: m.nom, v: cap.manda.v, mudo: true,
                       txt: `${cap.manda.n} ${Math.round(cap.manda.v)} %` } : null;
      }
      /* El ⚠ va pegado al número que descuadra: el dato se enseña tal
         cual lo da el modelo —nada corregido— y la marca dice lo que se
         sabe de él. Pedido por él esa noche: «reales, nada inventado» y
         «que se lea bien claro» — las dos a la vez. */
      const conAviso = !!(cap?.noCuadra || cap?.sinExplicar);
      return { n: m.nom, v: tot, ojo: conAviso,
               txt: `${Math.round(tot)} %${cap?.noCuadra
                 ? ` ⚠ <em>(${cap.manda.n} ${Math.round(cap.manda.v)})</em>`
                 : cap?.sinExplicar
                   ? ` ⚠ <em>(sus capas suman ${Math.round(cap.suma)})</em>` : ''}` };
    /* LOS QUE NO PUBLICAN TOTAL, AL FINAL Y FUERA DEL ORDEN. Visto por
       la otra sesión el 29-08: AROME salía colocado por su capa baja
       entre dos totales —«ICON 58 % · AROME bajas 27 % · ECMWF 8 %»— y
       el orden sugiere una comparación que no existe: no es lo mismo un
       total que una capa. Se van al final, sin competir. */
    }).filter(Boolean).sort((a2, b2) =>
        (a2.mudo ? 1 : 0) - (b2.mudo ? 1 : 0) || b2.v - a2.v);
    const nubes = ns.length < 2 ? '' : fila(
      'NUBES DE CADA MODELO, ESTA HORA',
      'entre paréntesis, la capa más cargada cuando el total no cuadra con ellas · '
      + 'medias = grises y espesas, sin lluvia · bajas = sirimiri y torre tapada',
      'nubes', duenoCielo ? [duenoCielo, ...ns] : ns);

    /* ── BOCHORNO ───────────────────────────────────────────────────
       Suyo, 29-08-2026. Y lo razonó él solo, con dos casos: *«si la
       temperatura a 2 m es 26 y el rocío 22 hay mucho bochorno; si es 26
       y el rocío 17, no hay»*. Acertó, y sin darse cuenta demostró de qué
       depende: en sus dos ejemplos el AIRE no se movió —26 en los dos— y
       lo único que cambió fue el rocío.

       LO QUE MANDA ES EL ROCÍO, NO LA HUMEDAD, y esto importa porque la
       humedad engaña justo cuando peor. Con el rocío quieto en 22:

          aire 24 → HR 89 %    aire 30 → HR 62 %    aire 34 → HR 50 %

       Las tres agobian igual y la humedad baja del 89 al 50. Un 50 %
       suena a seco y ahí se está sudando lo mismo.

       Y SU OTRA REGLA —que las dos cifras se junten— NO es ésta: es la de
       condensación. Una mañana de Bermeo con el aire a 12 y el rocío a 11
       las tiene pegadas —94 % de humedad— y no agobia nada; lo que hay es
       metal mojado. Dos avisos distintos de números distintos: el
       bochorno del rocío a secas, la condensación de la RESTA. */
    const rocios = deCada('dew_point_2m');
    const bochorno = rocios.length < 2 ? '' : (() => {
      const palabra = (r) => r > 21 ? 'agobiante' : r > 18 ? 'bochorno'
                           : r > 16 ? 'se nota' : 'cómodo';
      const top = rocios[0];            // deCada ya ordena de mayor a menor
      /* La palabra, SOLO en el más alto. Repetirla en los cinco chips es
         cinco veces la misma explicación al lado de cinco números, que es
         lo que él pidió quitar ese mismo día: «más datos y explicación
         corta». */
      const datos = rocios.map(x => ({
        ...x,
        txt: `${x.v.toFixed(0)}°${x === top ? ` <em>${palabra(x.v)}</em>` : ''}`,
      }));
      /* La condensación se dice SOLO cuando la hay, y con las dos cifras
         delante para que se vea de dónde sale. Se mira el modelo que más
         las junta, que es el que avisa antes. */
      const juntos = MODELOS_TORMENTA
        .map(m => ({ n: m.nom, t: H[`temperature_2m_${m.om}`]?.[i],
                     d: H[`dew_point_2m_${m.om}`]?.[i] }))
        .filter(x => has(x.t) && has(x.d))
        .sort((a2, b2) => (a2.t - a2.d) - (b2.t - b2.d))[0];
      const condensa = juntos && (juntos.t - juntos.d) < 2
        ? ` · ${esc(juntos.n)} junta aire ${juntos.t.toFixed(0)}° y rocío `
          + `${juntos.d.toFixed(0)}°: condensa sobre el metal`
        : '';
      return fila(
        'BOCHORNO · ROCÍO DE CADA MODELO, ESTA HORA',
        'manda el rocío, no la humedad · hasta 16 cómodo · 16-18 se nota · '
        + '18-21 bochorno · más de 21 agobiante' + condensa,
        'calor', datos);
    })();

    /* ── EL DETALLE, PLEGADO ──────────────────────────────────────────
       Suyo, 02-09-2026, con «Mis estaciones» abierta y sus VEINTE sitios
       dentro: *«es que tanto rollo al final no sé ni dónde mirar»*. Y al
       preguntarle si lo plegaba: *«sí»* · *«los modelos lo que marca cada
       uno y listo»*.

       O sea: los datos NO se tocan —los quiere, y con razón, que es lo
       que contrasta— pero no pueden estar los cinco bloques abiertos en
       veinte tarjetas a la vez. Cada emplazamiento son unas 22 barras;
       por veinte sitios, cuatrocientas y pico en una pantalla.

       De un vistazo tiene que ver lo suyo: si puede mandar a alguien, y
       si no, a qué hora. Eso se queda arriba, fuera de esto. El desglose
       por modelos entra aquí, a un toque, y **no se pierde nada**.

       Si prefiere verlo todo abierto como antes, se le quita el
       `<details>` de esta línea y ya está. */
    const dentro = lluvia + rayo + viento + nubes + bochorno;
    if (!dentro) return '';
    return `<details class="pt__mas">
      <summary>Lo que marca cada modelo</summary>${dentro}</details>`;
  };

  /* ── ¿QUÉ ME FRENA AHORA Y HASTA QUÉ HORA? ──────────────────────────
     La línea que lleva pidiendo cinco veces con las mismas palabras:
     *«espero a que amaine»*, *«les digo esperar 2 horas»*, *«iré media
     hora más tarde, o cuando el pronóstico me diga que baja la
     intensidad de los rayos, o viento, o un chaparrón muy fuerte»*.

     Contesta tres cosas y en su orden:
       1. **qué le frena ahora**, con su número;
       2. **a qué hora deja de frenarle**;
       3. **cuánto dura la ventana** — porque cargar el grupo y subir
          lleva rato, y una hora suelta entre dos malas no le sirve.

     Y no decide nada: dice la hora y por qué. Ver `S.cuandoTorres`. */
  const cuandoSePuede = (k) => {
    const C = S.cuandoTorres?.find(x => x?.k === k);
    if (!C) return '';
    const hh = d => String(new Date(d).getHours()).padStart(2, '0') + ':00';
    const A = C.ahora;

    if (!A.frenos.length) {
      /* ── LA FRASE DICE DE QUÉ HABLA: DE LLEGAR ──────────────────────
         Cazado el 01-09-2026 en su pantallazo de Sollube: arriba «Racha
         máxima 49 km/h a las 14:00» (su aviso está en 45) y esta línea
         verde debajo diciendo «no se estropea en las próximas 24 h».
         Las dos eran verdad — esta mira los frenos de ACCESO (racha de
         70 que vuelca el 4x4, lluvia fuerte, rayo), no sus listones de
         trabajo — pero juntas se leían como «día limpio». Dos verdades
         de ventanas distintas SIN etiquetar: el mismo fallo de la
         lluvia del 31-08. Ahora dice su ámbito: llegar. */
      /* ── SIN LA COLETILLA ───────────────────────────────────────
         Suyo, 02-09-2026: *«al final lío con esos textos»*. Esa línea
         pequeña —«rayo, racha de volcar el 4x4 o lluvia fuerte, tus
         listones van en el semáforo»— salía SIEMPRE, incluso cuando no
         pasaba nada, o sea casi todos los días. Un renglón que está
         siempre no se lee: se salta, y de paso se salta el de al lado.
         Cuando SÍ hay frenos, la lista los nombra uno a uno. */
      return `<div class="pt__ventana" data-v="abierta">
        <b>Nada te frena para llegar.</b>${C.seEstropeaEn
          ? ` El camino se estropea a las <b>${hh(C.seEstropeaEn)}</b>.` : ''}</div>`;
    }

    const dice = {
      rayo:   `<b>rayo</b>`,
      racha:  `<b>racha ${has(A.racha) ? wtxt(A.racha, true) : ''}</b> (vuelcas con el 4x4)`,
      lluvia: `<b>lluvia fuerte</b>${has(A.lluvia) ? ` (${mmTxt(A.lluvia)} mm/h)` : ''}`,
    };
    const lista = A.frenos.map(f => dice[f]).join(' · ');

    return `<div class="pt__ventana" data-v="${A.frenos.includes('rayo') ? 'rayo' : 'cerrada'}">
      <b>Ahora te frena:</b> ${lista}.
      ${C.libreDesde
        ? `Deja de frenarte a las <b>${hh(C.libreDesde.t)}</b>`
          + (C.horasLibres > 1 ? `, y aguanta <b>${C.horasLibres} h</b>.` : ', pero solo esa hora.')
        : '<b>No se despeja en las próximas 24 h.</b>'}</div>`;
  };

  const lineaRacha = (k) => {
    const R = S.rachaTorres?.find(x => x?.k === k);
    if (!R || !has(R.racha)) return '';
    const st = R.racha >= listonRafaga().no ? 'no' : R.racha >= listonRafaga().warn ? 'warn' : 'go';
    /* «a 10 m» AQUÍ TAMBIÉN. Ver el porqué en la franja del día: esta
       cifra es la ráfaga cruda de los cinco modelos, sin subir a su
       altura de trabajo, y la de la cabecera sí está subida. Dos
       números de lo mismo en la misma pantalla y ninguno decía a qué
       altura. Arriba, en la torre, pega bastante más. */
    return `<div class="pt__r" data-s="${st}">Racha máxima <b>${wtxt(R.racha, true)}</b>`
         + `<small> a 10 m</small>`
         + (R.hora ? ` a las ${String(R.hora.getHours()).padStart(2, '0')}:00` : '')
         /* AQUÍ NO VAN SUS LÍMITES, Y ES LA SEGUNDA VUELTA.
            Primero ponía «tus listones 45 y 60». Él: *«¿eso de tus
            listones?»*. Lo reescribí como «tú avisas a 45 y paras a 60»,
            y su respuesta fue: *«lo de tú avisas a 40 y tal, fuera»*.

            Y tiene razón las dos veces, aunque yo tardara dos intentos:
            **esos números son suyos y se los sabe**. Repetírselos en cada
            una de las quince filas es ocupar sitio para decirle algo que
            ya sabe, y encima suena a que la app se los recuerda.

            El color de la cifra ya dice si roza el límite o lo pasa, que
            para eso está. Los números siguen en Ajustes, que es donde él
            los puso. */
         + `</div>`;
  };

  const lineaLluvia = (k) => {
    const L = S.lluviaTorres?.find(x => x?.k === k);
    if (!L) return '';
    // «en 24 h» se quedó de cuando el parte era de 24 horas. Ahora es de
    // un día, y decir 24 h volvía a confundir de qué periodo se habla.
    /* SIN LLUVIA, EN VERDE. Suyo, 28-08-2026: *«y "sin lluvia" en color
       naranja o así ponlo, o verde»*. Verde, que es lo que significa:
       para él la lluvia es un bloqueador —los fusibles al aire, los
       armarios que hay que abrir— y que no la haya es la buena noticia
       del día. En gris apagado se leía como un dato menor y es de los
       que más manda en su trabajo. */
    /* Y YA NO EN VERDE. El verde se lo pidió él el 28-08 y era bueno
       entonces, pero el 02-09 quedó justo encima de «Nada te frena para
       llegar», que también es verde: *«si lluvia en verde se lía con lo
       de arriba»*. Dos verdes pegados se leen como uno. Ahora va con el
       peso de lo que decide, no con un color que ya está usado. */
    if (!L.llueve) {
      /* El día del parte, dicho por su nombre. Antes ponía «Sin lluvia
         mañana», que con el parte de mañana abierto se lee igual de bien
         como «esta mañana». Suyo, 04-09-2026: «lío, ¿no?». */
      /* La FECHA, no la etiqueta: comparar contra «mañana» dejó esto
         diciendo «hoy» para cualquier día (04-09-2026, noche). */
      return `<div class="pt__l pt__l--seco"><b>Sin lluvia</b> ${
        nombreDeDia(S.parteDiaFecha ?? new Date())} · 0,0 mm</div>`;
    }
    /* Las horas sueltas se redactan aparte, NO retocando el texto de
       `tramo()` con reemplazos. Ese apaño daba «entre las hoy 17:00 y
       las mañana 11:00», que no hay quien lo lea. Salió en pantalla con
       datos reales el 26-08-2026, en BI OIZ. */
    /* POR DÍAS, Y CON LAS HORAS A LA VISTA.
       Lo pidió él el 26-08-2026 mirando esta línea en BI MATIENA:
       «cuatro gotas en 5 horas sueltas, desde hoy a las 17:00 hasta
       mañana a las 14:00 — lo más fuerte 0,1 mm a las 12:00». Eran
       **21 horas de ventana para 5 de gotas**, y el «12:00» era de
       mañana sin decirlo. Sus palabras: «algo confuso, ¿no?».

       Lo que él necesita es A QUÉ HORAS, no un rango. Así que:
         · se separa por día — hoy y mañana no se mezclan nunca,
         · si son pocas horas, se ENUMERAN («a las 17:00, 19:00 y 21:00»),
         · si son muchas y seguidas, se da el tramo,
         · y el pico va con su día, no suelto. */
    const porDia = new Map();
    for (const d of (L.horasAgua || [])) {
      const clave = d.toDateString();
      if (!porDia.has(clave)) porDia.set(clave, []);
      porDia.get(clave).push(d);
    }
    const trozos = [...porDia.entries()].map(([, hs]) => {
      const et = dia(hs[0]).trim();          // '' si es hoy
      const seguidas = Math.round((hs[hs.length - 1] - hs[0]) / 3600e3) + 1 === hs.length;
      let cuandoDia;
      if (hs.length === 1)      cuandoDia = `a las ${hm(hs[0])}`;
      else if (seguidas)        cuandoDia = `de ${hm(hs[0])} a ${hm(hs[hs.length - 1])}`;
      else if (hs.length <= 4)  cuandoDia = 'a las ' + hs.slice(0, -1).map(hm).join(', ')
                                          + ' y ' + hm(hs[hs.length - 1]);
      else                      cuandoDia = `en ${hs.length} horas sueltas entre las `
                                          + `${hm(hs[0])} y las ${hm(hs[hs.length - 1])}`;
      return (et ? `<b>${et}</b> ` : '') + cuandoDia;   // et='' cuando es el día de la tarjeta
    });
    const cuando = trozos.join(' · ');
    if (L.soloSirimiri)
      return `<div class="pt__l pt__l--siri"><b>Sirimiri</b> ${cuando}
        — <b>no marca en el pluviómetro pero moja</b>, y lo que esté a la
        intemperie estará mojado</div>`;
    const fuerza = L.pico >= (S.thr?.rainNo ?? 2) ? 'Llueve bien' : L.pico >= (S.thr?.rainWarn ?? 0.2) ? 'Llueve poco' : 'Cuatro gotas';
    const dPico = dia(L.hPico).trim();
    return `<div class="pt__l"><b>${fuerza}</b> ${cuando}
      — lo más fuerte <b>${nMm(L.pico)} mm</b> a las ${hm(L.hPico)}${dPico ? ` de ${dPico}` : ''}
      <span class="pt__m">· lo ve ${esc(L.quien ?? '—')}</span>${L.discrepan
        ? `<br><span class="pt__m">Los modelos no coinciden en la cantidad:
           fíate de la hora, no de los milímetros</span>` : ''}</div>`;
  };

  const todas = S.saved.map(p => ({ p, k: key(p),
                                   d: S.parteTorres.find(x => x?.k === key(p)) }));
  const filas = todas.filter(x => x.d)
    .sort((a, b) => deCasaAFuera(a.p, b.p));   // el mismo orden todos los días

  /* ── LOS QUE NO HAN LLEGADO SE DICEN, NO SE BORRAN ─────────────────
     Este `.filter(x => x.d)` quitaba de la lista los emplazamientos sin
     dato, **y en silencio**. Con veinte guardados, si a tres no les llega
     la previsión desaparecen del parte y la pantalla queda igual de
     tranquila que si estuvieran bien. Él cuenta los que ve, no los que
     faltan: un sitio que no sale se lee como un sitio sin novedad.

     Es la regla 2 de esta app —«un hueco no puede parecer que aquí no
     pasa nada»— aplicada al sitio entero en vez de a un número.
     (Barrido del 01-09-2026, arreglado el 02-09.) */
  const sinDato = todas.filter(x => !x.d).map(x => x.p.name);

  /* ¿En qué se ha desdicho desde la última vez? Se compara contra la
     foto guardada de ESTE día, y solo si tiene un rato: ver el aviso no
     puede borrarlo si él acaba de abrirla. */
  const claveHoy = claveDia(ventanaParte().dia);
  const guardado = LS.get('visto', {})[claveHoy] || null;
  const minutos  = guardado ? (Date.now() - guardado.ts) / 60000 : null;

  const cambios = new Map();
  if (guardado && minutos >= VISTO_MIN) {
    filas.forEach(({ p, d }) => {
      const f = fraseCambio(guardado.sitios?.[key(p)], huellaParte(d));
      if (f) cambios.set(key(p), { ...f, cuando: new Date(guardado.ts) });
    });
  }

  /* La foto se renueva cuando ya ha pasado el rato — o si no había
     ninguna. Nunca en medio, para no comerse un aviso a medio leer. */
  if (!guardado || minutos >= VISTO_MIN) {
    const todo = LS.get('visto', {});
    todo[claveHoy] = { ts: Date.now(),
                       sitios: Object.fromEntries(filas.map(({ p, d }) => [key(p), huellaParte(d)])) };
    /* Se tiran los días pasados: esto no es un archivo histórico. */
    const hoyClave = claveDia(new Date());
    Object.keys(todo).forEach(k_ => { if (k_ < hoyClave) delete todo[k_]; });
    LS.set('visto', todo);
  }

  /* ── «NINGUNO VE AGUA» NO ES «NO VA A LLOVER» ─────────────────────
     Avisado por la sesión de mediciones el 27-08-2026, y es la regla 2 de
     esta app en su forma más difícil: **callarse afirma**. Cuando un sitio
     no tiene lluvia, el parte no decía NADA de agua — y ese silencio se
     lee como «está seco».

     Y en la costa eso es falso más veces de las que parece. Medido dos
     veces con él en el sitio:

       25-08 Bilbao   sirimiri hasta las 13:00 · el modelo lo marcó 3 h de 5
       26-08 Bermeo   chispeo 20:50-21:13      · ICON, GFS y AROME: nada
                                                  (solo el Automático, 0,3 mm)

     NO SE MONTA UN DETECTOR, y el motivo bueno no es el primero que me
     pareció. Probé con humedad y nubes: el 26-08, mientras chispeaba, el
     modelo Automático daba 54 % de humedad. Pero eso era la humedad DE UN
     MODELO. Medidos los seis para la misma hora y el mismo punto:

         GFS 47 · Automático 56 · AROME 60 · ICON 71 · ECMWF 73

     **Veintiséis puntos de separación.** La humedad de los modelos en la
     costa no es un dato, es una opinión, y no se puede poner un umbral
     encima. Con la humedad MEDIDA de Matxitxako quizá se podría — pero
     llega con una hora de retraso, y un aviso que llega después no avisa.

     Así que no se detecta. Se dice lo que se sabe, que es distinto.

     Lo que se hace es DECIR LO QUE SE SABE, que es distinto: los cinco
     modelos dicen seco, y en la costa el sirimiri se les escapa. Eso no
     es una alarma, es quitarle al silencio el aire de respuesta.

     Solo en la costa: tierra adentro no está medido y no se afirma. */
    /* UNA VEZ, NO CATORCE. Corregido el 28-08-2026 mirando el parte
     publicado: al quitarle la restricción de costa —bien quitada, el
     sirimiri es de frente— este aviso pasó de salir en tres sitios a
     salir en TODOS, con el mismo texto largo repetido diez veces
     seguidas.

     Y eso lo mata. Es el mismo fallo de las catorce horas rayadas del
     25-08: **una marca que aparece siempre deja de marcar nada**, y él
     ya avisó de que leer diez veces lo mismo «es muy cansino».

     Va una sola vez al pie del parte, diciendo a cuántos afecta. La
     advertencia es la misma; lo que cambia es que ahora se lee. */
  const avisoSirimiri = (secos) => {
    if (!secos.length) return '';
    const cuantos = secos.length === 1
      ? `En <b>${esc(secos[0])}</b> ninguno`
      : secos.length >= 12 ? 'En todos tus emplazamientos, ninguno'
      : `En <b>${secos.length}</b> de tus emplazamientos ninguno`;
    return `<div class="pt__pie">${cuantos} de los cinco modelos ve agua hoy.
      Aun así, <b>el sirimiri se les escapa</b> — le ha pasado <b>tres veces en
      agosto</b> con él en el sitio (Bilbao, Bermeo y Vitoria), y en dos de ellas
      <b>ni las estaciones lo midieron</b>. Si al llegar está mojando, está mojando
      aunque aquí ponga cero.</div>`;
  };

  const lineaCambio = k => {
    const c = cambios.get(k);
    if (!c) return '';
    const cuando = c.cuando.toLocaleString('es',
      { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return `<div class="pt__cam${c.peor ? ' pt__cam--peor' : ''}">
      <b>HA CAMBIADO</b> desde que lo miraste (${esc(cuando)}):
      ${esc(c.txt)}</div>`;
  };

  /* Ni con TODOS sin dato se esconde la tarjeta: esconderla es
     exactamente lo que él lee como «hoy no hay nada que mirar». */
  if (!filas.length) {
    if (!sinDato.length) { card.hidden = true; return; }
    card.hidden = false;
    el.innerHTML = `<p class="note note--avisa"><b>No ha llegado la previsión de
      ninguno de tus ${sinDato.length} emplazamientos.</b> <b>Eso no quiere decir
      que estén tranquilos: quiere decir que no lo sé.</b> Vuelve a mirarlo cuando
      tengas línea o pulsa recargar.</p>`;
    return;
  }

  const nSalta = filas.filter(x => x.d.salta).length;
  const v_ = ventanaParte();
  const cual = v_.etiqueta;
  const cab = $('#parteCab');
  if (cab) {
    const f = v_.dia.toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long' });
    /* `salto` es el número; `cual` es texto de presentación y ya nos
       costó una comparación muerta (ver S.parteDiaFecha). */
    cab.textContent = v_.salto === 0 ? 'El parte de hoy'
      : v_.salto === 1 ? `El parte de MAÑANA · ${f}`
      : `El parte del ${f}`;
  }
  /* Los cambios van DELANTE del recuento: si algo se ha desdicho desde
     que lo miró, eso es la noticia, no cuántas están en rojo. */
  pintarSelloParte();

  const nCam = cambios.size, nPeor = [...cambios.values()].filter(c => c.peor).length;
  $('#parteHint').textContent =
    (nCam ? `· ⚠ ${nCam === 1 ? 'ha cambiado 1 torre' : `han cambiado ${nCam} torres`}`
          + (nPeor ? ` (${nPeor} a peor)` : '') + ' '
          : '')
    + (nSalta ? `· riesgo de rayo en ${nSalta} de ${filas.length}`
              : `· ninguno con riesgo de rayo ${cual}`)
    /* Y si faltan sitios, va aquí mismo: el recuento de arriba dice
       «ninguno con riesgo» sobre los que SÍ llegaron, y sin esto se lee
       como si fueran los veinte. */
    + (sinDato.length ? ` · ⚠ de ${filas.length}, faltan ${sinDato.length}` : '');

  const secos = filas
    .filter(({ k }) => !(S.lluviaTorres?.find(x => x?.k === k)?.llueve))
    .map(({ p }) => p.name);

  /* La lista de los que faltan, con sus nombres, al final del parte: que
     sepa CUÁLES no ha podido mirar, no solo cuántos. */
  const avisoSinDato = sinDato.length
    ? `<p class="note note--avisa"><b>Sin previsión de ${sinDato.length}
       ${sinDato.length === 1 ? 'emplazamiento' : 'emplazamientos'}:</b>
       ${sinDato.map(n => esc(n)).join(' · ')}.
       <b>No es que estén tranquilos: es que no lo sé.</b></p>`
    : '';

  /* ── EL PARTE SE GUARDA POR SITIO, PARA METERLO EN SU TARJETA ─────
     Suyo, 02-09-2026, viendo sus veinte emplazamientos DOS veces en la
     misma pestaña —una en «El parte de hoy» y otra en «Ahora y próximas
     horas»—:  *«estos dos al final, ¿para qué es uno y el otro?»* ·
     *«lo menos lioso y fácil de ver, no puedo perder tanto tiempo»* ·
     *«en un vistazo de X estación que me diga todo»*.

     Y es lo suyo: el parte y la tarjeta hablan del MISMO sitio. Verlos
     en dos listas separadas obliga a buscar el nombre dos veces y a
     acordarse de lo que decía la otra.

     Así que el parte deja de pintarse en su lista y se guarda aquí, por
     emplazamiento; `renderTorres` lo mete dentro de la tarjeta que ya
     tiene ese sitio. Se pinta UNA vez y sale UNA vez.                 */
  S.parteFilas = new Map();
  el.innerHTML = avisoSinDato + filas.map(({ p, d, k }) => {
    if (d.salta) {
      const cuando = tramo(d.ini, d.fin);
      const cuerpoR = `<div class="pt__d"><b>CAPE ${nCape(d.cape)}</b> con la
            <b>tapa en ${nCape(d.cin)}</b>, a las ${hm(d.hora)}
            <span class="pt__m">· lo ve ${esc(d.modelo)}${cuantosLoVen(d)}</span></div>
          ${lineaLluvia(k)}${cuandoSePuede(k)}${lineaCambio(k)}`;
      S.parteFilas.set(key(p), { est: 'no', etq: `RAYO ${esc(cuando)}`,
                                 cuerpo: cuerpoR, comp: comparativa(p) });
      return `<div class="pt" data-s="no">
        <div class="pt__izq">
          <div class="pt__h"><b>${esc(p.name)}</b>
            <span class="pt__b">RAYO ${esc(cuando)}</span></div>
          ${cuerpoR}
        </div>${comparativa(p)}
      </div>`;
    }
    /* SIN RAYO NO ES SIN NADA. Salió al probarlo: un sitio con la tapa
       aguantando salía con etiqueta VERDE «SIN RAYO» y debajo 12,4 mm a
       las 18:00. Verde con un chaparrón encima es el mismo fallo que la
       barra de 48 h de esta tarde — la etiqueta dice una cosa y el
       renglón de abajo dice otra. Si hay agua de la que moja, la
       etiqueta lo dice. */
    const L_ = S.lluviaTorres?.find(x => x?.k === k);
    const mojaDeVerdad = L_?.llueve && (L_.pico >= (S.thr?.rainWarn ?? 0.2) || L_.soloSirimiri);

    /* AL FILO: tiene gasolina de sobra Y la tapa se le llega a abrir,
       pero no en la misma hora. Eso NO es verde. Salió al repasar por
       segunda vez el 26-08-2026: Gernika salía con etiqueta verde «SIN
       RAYO» y debajo «si se juntan una hora, salta». La etiqueta
       afirmando lo que el renglón de abajo desmiente — el mismo fallo
       que la barra de 48 h de la víspera. */
    const alFilo = d.maxCape >= CAPE_COMBINACION && has(d.minCin) && d.minCin < 75;

    const etq = alFilo ? 'AL FILO'
      : mojaDeVerdad ? (L_.soloSirimiri ? 'SIRIMIRI' : 'LLUVIA')
      : 'SIN RAYO';
    const est = (alFilo || mojaDeVerdad) ? 'warn' : 'go';

    /* No salta el rayo: se dice de qué le falta. Y son TRES casos, no
       dos. El tercero salió en su pantalla el 26-08-2026 y decía una
       barbaridad: «BI GERNIKA2 — tiene 1.350 de CAPE, pero la tapa no
       baja de 0: aguanta». **Una tapa en 0 no aguanta nada: está
       abierta del todo.** La frase se contradecía sola.

       El motivo real de que no salte es otro y hay que decirlo: el CAPE
       alto y la tapa baja le pasan A HORAS DISTINTAS. Y eso no es lo
       mismo que estar a salvo — basta con que se junten una hora. */
    const hayGasolina = d.maxCape >= CAPE_COMBINACION;
    const tapaSeAbre = has(d.minCin) && d.minCin < 75;
    const porQue = !hayGasolina
      ? `<b>${nCape(d.maxCape)} de CAPE</b>${has(d.minCin) ? ` · tapa <b>${nCape(d.minCin)}</b>` : ''}`
        + ` — hace falta ${CAPE_COMBINACION} con la tapa por debajo de 75`
      : tapaSeAbre
        ? `llega a <b>${nCape(d.maxCape)} de CAPE</b> y la tapa le baja a
           <b>${nCape(d.minCin)}</b>, <b>pero no a la vez</b> — si se juntan una hora, salta`
        : `tiene <b>${nCape(d.maxCape)} de CAPE</b>, pero la tapa no baja de
           <b>${d.minCin === null ? '—' : nCape(d.minCin)}</b>: aguanta`;
    /* ── EN SU ORDEN: LLUVIA, RAYOS, VIENTO ─────────────────────────
       Suyo, 02-09-2026, con la tarjeta delante:
         *«y lo digo, para mí la LLUVIA es lo más, después RAYOS y luego
           VIENTO»* · *«y lluvia, solo abajo "sin lluvia"… mal»*

       Estaba justo al revés: la racha arriba, el CAPE en medio y la
       lluvia la última, en una línea sin cifra. Y la lluvia es lo que le
       bloquea el trabajo —los fusibles al aire, los armarios que hay que
       abrir—, no un dato de apoyo.                                    */
    const cuerpo = `${lineaLluvia(k)}
        <div class="pt__d">${porQue}</div>
        ${lineaRacha(k)}${cuandoSePuede(k)}${lineaCambio(k)}`;
    S.parteFilas.set(key(p), { est, etq, cuerpo, comp: comparativa(p) });
    return `<div class="pt" data-s="${est}">
      <div class="pt__izq">
        <div class="pt__h"><b>${esc(p.name)}</b><span class="pt__b">${etq}</span></div>
        ${cuerpo}
      </div>${comparativa(p)}
    </div>`;
  }).join('')
  + avisoSirimiri(secos)
  + `<p class="note">Hacen falta <b>las dos cosas</b>: gasolina (CAPE ≥700) y la
     <b>tapa abierta</b> (por debajo de 75). Una sola no rompe nada — y por eso
     van siempre juntas y con su hora. Sale de los modelos que publican la tapa;
     ECMWF y AROME HD no la publican. <b>Esto dice si PUEDE, no si ha caído</b>:
     para eso, la pestaña Rayos.</p>`;
  pintarDiasParte();
  card.hidden = false;
}

/* Las pestañas de día: hoy y los tres siguientes. Se pintan con lo que
   de verdad haya en `S.parteRaw`, no con una lista fija: si algún día la
   consulta trae menos días, salen menos pestañas en vez de una vacía. */
function pintarDiasParte() {
  const el = $('#parteDias');
  if (!el) return;
  const sel = S.parteSel || 0;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const dias = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(hoy); d.setDate(d.getDate() + i);
    dias.push({
      i,
      corto: i === 0 ? 'HOY' : d.toLocaleDateString('es', { weekday:'short' }).replace('.','').toUpperCase(),
      num: d.getDate(),
    });
  }
  el.innerHTML = dias.map(d =>
    `<button type="button" class="pdia${d.i === sel ? ' is-on' : ''}" data-dia="${d.i}">
       <b>${d.corto}</b><i>${d.num}</i></button>`).join('');
  el.onclick = e => {
    const b = e.target.closest('[data-dia]');
    if (!b) return;
    S.parteSel = Number(b.dataset.dia);
    recalcularParte();
  };
}

/* ── EL AGUA, Y SOBRE TODO A QUÉ HORA ESCAMPA ────────────────────────
   Puesto el 28-08-2026 después de que él explicara cómo es su trabajo de
   verdad, y de que la otra sesión lo pusiera por escrito:

     *«A la torre no se sube si llueve, si hay rayos, y se sube solo para
     cambiar alguna antena esporádica. **El 90 % de las ocasiones vas a
     las casetas o equipos intemperie que están a pie.** El 90 % de las
     averías son los equipos que están dentro de la caseta, fusibles que
     están al lado de la caseta, y cuando no hay caseta hay armarios de
     intemperie y dentro van radioenlaces.»*

   Llevábamos tres días afinando la racha, y la racha manda en el 10 %.
   En el 90 % lo que manda es **si llueve y cuándo para**: los fusibles
   están al aire y con tensión, y el armario de intemperie hay que
   abrirlo a cielo descubierto con radioenlaces dentro.

   Y encaja con algo que ya había dicho y no supimos leer: *«valoro si
   envío a la gente a trabajar allí, o les digo esperar 2 horas que
   amaina el temporal»*. **Esa hora es el dato que le faltaba en la
   tarjeta.**

   Aquí NO se decide nada —él lo dejó dicho cinco veces esa mañana:
   «vosotros cifras»—. Se dice a qué hora empieza, a qué hora para, si
   son horas seguidas o sueltas y de qué tipo de agua se trata. Lo que
   haga con eso es suyo. */
function lineaAguaTorre(k) {
  const L = S.lluviaTorres?.find(x => x?.k === k);
  if (!L) return '';
  const hh = d => String(new Date(d).getHours()).padStart(2, '0') + ':00';

  if (!L.llueve)
    return `<div class="tor__agua" data-a="seco">Seco en las próximas 24 h</div>`;

  const tipo = L.soloSirimiri ? 'Sirimiri'
             : L.pico >= (S.thr?.rainNo ?? 2) ? 'Llueve bien'
             : L.pico >= (S.thr?.rainWarn ?? 0.2) ? 'Llueve poco' : 'Sirimiri';

  /* ¿Está cayendo AHORA? Entonces lo que le sirve es la hora a la que
     para, no la hora a la que empezó. Es literalmente su pregunta:
     ¿mando a la gente o que esperen dos horas? */
  const ahora = Date.now();
  const cayendo = L.ini <= ahora + 3600e3 && L.fin >= ahora;

  const cuando = L.sueltas
    ? `${L.nHoras} horas sueltas entre las ${hh(L.ini)} y las ${hh(L.fin)}`
    /* `+L.fin`: si `fin` llega como Date, `Date + 3600e3` pega texto y
       la hora de después se pierde — salía «de 10:00 a 10:00» y «escampa»
       una hora antes de lo previsto (Calpe, 07-09-2026 00:19). */
    : cayendo ? `<b>escampa a las ${hh(+L.fin + 3600e3)}</b>`
              : `de ${hh(L.ini)} a ${hh(+L.fin + 3600e3)}`;

  const pico = has(L.pico) && L.pico >= (S.thr?.rainWarn ?? 0.2) && L.hPico
    ? ` · lo más fuerte a las ${hh(L.hPico)}` : '';

  return `<div class="tor__agua" data-a="${cayendo ? 'ahora' : 'luego'}">
    ${tipo} ${cuando}${pico}</div>`;
}

/* Las cifras de la pista, en una línea. Ver `comoEstaLaPista()` para el
   porqué. Aquí NO se dice si se pasa o no: se dice cuánta agua lleva
   encima el terreno y si hay nieve. Lo demás lo sabe él. */
function lineaPista(P) {
  if (!P) return '';
  const trozos = [];
  if (P.agua >= 1)
    trozos.push(`<b>${mmTxt(P.agua)} mm</b> en las últimas 72 h`
      + (P.horasAgua ? ` (${P.horasAgua} h de agua)` : ''));
  else if (P.agua > 0) trozos.push('apenas ha llovido en 72 h');
  else trozos.push('sin agua en las últimas 72 h');

  if (has(P.nieveSuelo) && P.nieveSuelo > 0)
    trozos.push(`<b>${(P.nieveSuelo * 100).toFixed(0)} cm de nieve en el suelo</b>`);
  if (P.nieveHoy > 0) trozos.push(`<b>nieva hoy</b> (${P.nieveHoy.toFixed(1).replace('.', ',')} cm)`);

  const ojo = P.agua >= 20 || (has(P.nieveSuelo) && P.nieveSuelo > 0) || P.nieveHoy > 0;
  return `<div class="tor__pista"${ojo ? ' data-a="1"' : ''}>
    <span class="tor__pista__k">Para llegar</span> ${trozos.join(' · ')}</div>`;
}

function renderTorres() {
  const el = $('#torres');
  if (!el || !S.torres) return;

  // La discrepancia va pegada al emplazamiento por su posición en S.saved
  const disc = i => S.torresDiscrepa?.[S.saved.findIndex(p => key(p) === key(S.torres[i].place))] ?? null;
  const dPorSitio = new Map(S.torres.map((t, i) => [key(t.place), disc(i)]));

  const orden = [...S.torres].sort((a, b) => deCasaAFuera(a.place, b.place));

  const noAptas = orden.filter(t => t.horas?.[0]?.st === 'no').length;
  const conDisc = orden.filter(t => dPorSitio.get(key(t.place))).length;
  /* «Ninguna fuera de umbrales» a secas es una respuesta, y el 25-08-2026
     era una respuesta falsa: nueve en verde con ECMWF dando tormenta en
     tres de ellas. Si hay discrepancia, se dice aquí arriba. */
  $('#torresHint').textContent =
    (noAptas ? `· ${noAptas} fuera de umbrales ahora mismo`
             : '· ninguna fuera de umbrales ahora mismo')
    + (conDisc ? ` · ⚠ en ${conDisc} otro modelo ve tormenta` : '');

  el.innerHTML = orden.map(t => {
    const h = t.horas?.[0];
    if (!h) return `<div class="tor" data-s="nd" data-ir="${esc(key(t.place))}">
      <div class="tor__n"><b>${esc(t.place.name)}</b><span>sin datos</span></div></div>`;

    // Próximas 12 h en tiras
    /* LA HORA, ESCRITA DENTRO DE CADA CASILLA. Antes solo salía al pasar
       el ratón por encima, y él la mira en el móvil: allí no hay ratón.
       Lo preguntó el 26-08-2026 — «esos colores verdes y naranjas son
       las franjas de hora? si es así se podrían poner las cifras». Un
       color sin su hora obliga a contar casillas para saber a qué hora
       se pone feo. */
    const tiras = t.horas.slice(0, 12).map(x => {
      const hh = String(x.date.getHours()).padStart(2, '0');
      return `<i data-s="${x.st}" title="${hh}:00 · ${VT[x.st]}">${hh}</i>`;
    }).join('');

    // Primer momento en que deja de ser apta.
    // SIEMPRE con el día: "no apta desde las 05:00" sin decir si es hoy o
    // mañana se lee mal, y aquí leer mal es mandar a alguien a la torre.
    const iMal = t.horas.findIndex(x => x.st === 'no');
    let aviso = '';
    if (iMal === 0) aviso = 'No apta ahora';
    else if (iMal > 0) {
      const d = t.horas[iMal].date;
      const cuando = nombreDeDia(d);
      aviso = `No apta ${cuando} desde las ${String(d.getHours()).padStart(2,'0')}:00`;
    }

    const motivo = h.reasons.find(r => r.s === h.st)?.txt ?? h.reasons[0]?.txt ?? '';

    const D = dPorSitio.get(key(t.place));
    const lineaD = D ? `<div class="tor__disc">${D.avisos.slice(0, 2).map(a =>
        a.tor ? `<b>${esc(a.nom)}</b> da tormenta`
              : `<b>${esc(a.nom)}</b> llega a ${a.capeMax.toFixed(0)} J/kg`
                + (a.hora ? ` ${esc(horaDia(a.hora.toISOString()))}` : '')
                + ` — aquí ${has(a.mioAhi) ? a.mioAhi.toFixed(0) : 'sin dato'}`
      ).join(' · ')} <span class="tor__disc__q">y ${esc(model().name)}, no</span></div>` : '';

    /* ── LO QUE TE VAS A ENCONTRAR AL LLEGAR ────────────────────────
       Suyo, 30-08-2026: *«me pasan a las 2 de la mañana Arbaiza estación
       caída; yo antes de salir tengo que saber qué me voy a encontrar
       allí si voy»*. Hasta hoy esta tarjeta le daba la hora en que mira
       el móvil, y de Bermeo a Arbaiza hay más de una hora de monte. */
    const L = alLlegar(t.horas, t.place);
    const reloj = d => String(d.getHours()).padStart(2, '0') + ':'
                     + String(d.getMinutes()).padStart(2, '0');
    /* ── EL COLOR SOLO CUANDO PASA ALGO ─────────────────────────────
       Suyo, 02-09-2026, sobre esta línea:  *«esto colores distintos, no
       todo en blanco»*. Y antes, sobre la fila de cifras: *«todo blanco
       desvía la atención»*.

       Pero pintarlo todo de colores es el mismo problema al revés. La
       regla es la que ya usa el resto de la app: **cada cifra se colorea
       cuando cruza SU listón**, el que él tiene puesto, y se queda
       apagada cuando no. Así, en un día tranquilo la línea entera está
       en gris y cualquier color salta a la vista.

       Y el orden dentro de la línea es el suyo: lluvia, rayo, viento.  */
    /* Cada magnitud con SU color, para distinguirlas de un vistazo
       —suyo, 02-09-2026: «a color para distinguir»— y el listón manda
       por encima: si la racha se pasa sale en ámbar o rojo aunque su
       color de familia sea otro. */
    const cif = (txt, nivel, fam) =>
      `<span class="cf"${fam ? ` data-c="${fam}"` : ''}${
        nivel ? ` data-n="${nivel}"` : ''}>${txt}</span>`;
    const nivelLluvia = v => !has(v) || v <= 0 ? null
      : v >= (S.thr?.rainNo ?? 2) ? 'no' : v >= (S.thr?.rainWarn ?? 0.2) ? 'warn' : 'ok';
    const nivelRacha = v => !has(v) ? null
      : v >= listonRafaga().no ? 'no' : v >= listonRafaga().warn ? 'warn' : null;
    const nivelCape = (c, t) => (has(c) && c >= CAPE_COMBINACION
      && has(t) && t < 75) ? 'no' : (has(c) && c >= CAPE_COMBINACION) ? 'warn' : null;
    const cifras = x =>
      /* Sin el `?? 0`: `mmTxt` ya devuelve «—» cuando no hay dato, y el
         `?? 0` pisaba esa protección pintando «0,0 mm» donde lo que pasa
         es que no ha llegado la lluvia (01-09-2026). */
      cif(`${esc(mmTxt(x.prec))} mm`, nivelLluvia(x.prec), 'agua')
        + (has(x.cape) ? ` · ${cif(`CAPE ${Math.round(x.cape)}`,
            nivelCape(x.cape, x.cin), 'rayo')}` : '')
        + ` · ${cif(`racha ${esc(wtxt(x.gust ?? x.wind, true))}`,
            nivelRacha(x.gust ?? x.wind), 'viento')}`
        + (has(x.temp) ? ` · ${cif(`${Math.round(x.temp)}°`, null, 'temp')}` : '');
    /* ── AHORA, Y A HORAS VISTA ─────────────────────────────────────
       Suyo, 02-09-2026, después de no entender el «al llegar, sobre las
       20:31»:  *«pero cuando llegue a que hora?»* · *«si miro y son las
       18h»* · *«que sabe cuando llego? no lo entiendo»* · *«si igual
       llego a las 20h»*  y entonces lo dijo claro:

         *«yo cuando abro quiero saber lo que hay en ese momento y quiero
           saber que me encontrare dentro de ciertas horas despues»*

       Y tenía razón en no entenderlo: la app sumaba el viaje a la hora
       en que él miraba la pantalla, o sea que **suponía que salía en ese
       momento**. Es una suposición razonable y estaba callada, y callada
       parecía que sabía cuándo llegaba. No lo sabe.

       Esto no quita lo que pidió el 30-08 —*«antes de salir tengo que
       saber qué me voy a encontrar allí»*—: sigue estando, pero en horas
       de reloj que él puede leer. Y el viaje queda como DATO, para que
       la cuenta la haga él, que es quien sabe a qué hora sale.        */
    const V = viajeA(t.place);
    /* La etiqueta es la HORA DE RELOJ, no «+1 h». Suyo, 02-09-2026:
       *«mejor poner a las 21 h esto, a las 22 esto»*. */
    const reloj2 = d => String(d.getHours()).padStart(2, '0') + ':00';
    const tramos = TRAMOS
      .map(([n, et]) => {
        const x = enHoras(t.horas, n);
        return x ? { x, et: et || `a las ${reloj2(x.date)}` } : null;
      })
      .filter(Boolean);
    const lineaLlegada = tramos.length ? `<div class="tor__lleg">
        ${tramos.map((r, j) => `<span class="tor__lleg__${j ? 'q' : 'k'}">${
          r.et} · ${cifras(r.x)}</span>`).join('')}
        ${V && !V.cerca ? `<span class="tor__lleg__q">a ${V.min} min de Bermeo,
          estimado</span>` : ''}
      </div>` : '';

    return `<div class="tor" data-s="${h.st}"${D ? ' data-disc="1"' : ''} data-ir="${esc(key(t.place))}">
      <div class="tor__badge">${VT[h.st]}</div>
      <div class="tor__n">
        <b>${esc(t.place.name)}</b>${(() => {
          /* El chip del parte —SIN RAYO, o RAYO de tal a tal hora— junto
             al nombre. Ver `S.parteFilas`: el parte ya no es una lista
             aparte, vive dentro de la tarjeta de su sitio. */
          const P = S.parteFilas?.get(key(t.place));
          return P?.etq ? ` <span class="pt__b">${P.etq}</span>` : '';
        })()}
        <span>${esc([t.place.admin1, t.place.country].filter(Boolean).join(' · '))}</span>
        <!-- DE QUÉ HORA SON LAS CIFRAS. Suyo, 02-09-2026: *«el tiempo que
             da, ¿de qué hora es a qué hora?»*. Va AQUÍ, dentro del bloque
             del nombre, y no en un renglón propio: la tarjeta es un grid
             de tres columnas y un grid-column de lado a lado en medio empujaba
             las diez cifras a la fila siguiente, donde caían en una
             columna de 104 px — todas en vertical, con la pantalla vacía
             al lado. Él lo vio en cuanto salió: *«en vez de vertical, con
             todo el sitio que tienes a la derecha»*. -->
        <span class="tor__hora">${(() => {
          const d = h?.date;
          if (!d) return '';
          const z = n => String(n).padStart(2, '0') + ':00';
          return `de ${z(d.getHours())} a ${z((d.getHours() + 1) % 24)} · la hora en curso`;
        })()}</span>
      </div>
      <div class="tor__ds">${(() => {
        /* Los tres números grandes cambian según lo que vayas a hacer.
           Antes salía siempre «ráfaga a 40 m», y en el trabajo de caseta
           —que es el habitual— ese número no decide nada: lo que decide
           es el aparato eléctrico, porque la torre de al lado es un
           pararrayos. Enseñar en grande lo que no manda es lo mismo que
           enterrar lo que sí. Cambiado el 24-08-2026, junto con los
           perfiles de trabajo. */
        /* ── LO QUE DECIDE SE VE; EL CONTEXTO SE APAGA ────────────────
           Suyo, 02-09-2026, con la fila de nueve cifras delante:
             *«ahí todo blanco desvía la atención, pon colores distintos,
               no todo en blanco»* · *«para siempre»*

           Nueve números del mismo blanco es lo mismo que ninguno: el ojo
           no sabe dónde caer. Y no es cuestión de gusto, es de qué
           decide: sus límites son **racha, rayo y lluvia** —los tres que
           mira antes de mandar a nadie—; la elevación, el rocío, el
           isocero y la visibilidad son contexto, y le sirven, pero
           después.

           La regla es fija, no se pinta a ojo:
             · `decide`  → blanco fuerte, y del color del aviso si salta
             · `ctx`     → apagado, se lee cuando lo buscas
           El ámbar de `data-a` sigue mandando sobre las dos.          */
        const num = (v, etq, aviso, fam = 'ctx') =>
          `<div class="tor__d" data-f="${fam}"${aviso ? ' data-a="1"' : ''}>
             <span class="tor__big">${v}</span>
             <span class="tor__lbl">${etq}</span>
           </div>`;

        if (S.perfil === 'hierro') {
          // CAPE y tapa juntos: es la pareja que decide si se va o no.
          const tapaAbierta = has(h.cin) && h.cin < 75 && has(h.cape) && h.cape >= 700;
          /* La RACHA entra aquí el 26-08-2026. Faltaba, y en sus sitios
             altos es lo segundo que decide: Orduña llega a 63 km/h y
             Carranza toca los 60, que es su límite de NO APTO. Se marca
             en ámbar a partir de su propio umbral de precaución. */
          const rachaAlta = has(h.gust) && h.gust >= listonRafaga().warn;
          /* MÁS DATOS. Suyo, 28-08-2026, repetido toda la mañana:
             *«añadir más datos, más datos, más info mejor»*,
             *«vosotros cifras»*, *«rellena con datos, la decisión la
             tomo yo»*.

             Lo que se añade y por qué cada uno le sirve:
               · **racha a su altura de trabajo** — la de 10 m no es la
                 que hay arriba; a 40 m se multiplica por 1,36 de mediana.
               · **viento y su dirección** — de dónde viene decide qué
                 ladera está resguardada y cómo entra en la caseta.
               · **temperatura y punto de rocío** — si se juntan, condensa
                 sobre el metal aunque no llueva.
               · **isocero** — comparado con la altura del sitio, es lo
                 que dice si va a haber hielo en la pista.
               · **visibilidad** — si no se ve, no se ve.
             Nada de esto le dice qué hacer: son cifras. */
          const rocioPegado = has(h.dew) && has(h.temp) && (h.temp - h.dew) <= 2;
          const cotaSitio = cfgDe(t.place)?.cota;
          const hielo = has(h.frz) && has(cotaSitio) && h.frz <= cotaSitio + 200;
          const rachaAltaP = has(h.gust10) && h.gust10 >= listonRafaga().warn;
          /* ── EL ÍNDICE DE ELEVACIÓN ─────────────────────────────────
             Suyo, 28-08-2026: *«de estas capas de rayos y de lluvia,
             ¿alguna más podrías añadir en Mis torres que sea interesante
             y previsora?»*, y luego *«mira la que más convenga y ponla»*.

             Esta, y por una razón medida: **el CAPE que sale al lado es
             de SUPERFICIE**, mide el aire a ras de suelo. Cuando el aire
             frío está arriba, ese número se queda corto y la tormenta se
             forma igual. El 25-08-2026 en Arrasate, para el día
             siguiente a las 17:00, los cuatro modelos daban entre **10 y
             210** de CAPE y el «most unstable» de AguaceroWx daba
             **1.252**. El índice de elevación sí lo veía.

             Va en negativo cuando la atmósfera es inestable, que es al
             revés que el CAPE, así que se pone la palabra al lado para
             no tener que acordarse. Los cortes son los mismos que ya usa
             la pestaña Torre: −6 muy inestable, −2 inestable, +2 neutra.

             Se marca en ámbar desde −2, que es donde la app ya avisa en
             la otra pantalla. Ni veta ni cambia el semáforo: es una cifra
             más, y decide él. */
          const liTexto = !has(h.li) ? 'índice de elevación'
            : h.li <= -6 ? 'elevación · muy inestable'
            : h.li <= -2 ? 'elevación · inestable'
            : h.li <= 2  ? 'elevación · neutra'
            :              'elevación · estable';
          /* ── EN SU ORDEN, NO EN EL MÍO ───────────────────────────
             Suyo, 02-09-2026, viendo la fila ya coloreada:
               *«veo que le das a la capa más importante, pero para mí es
                 la LLUVIA, luego CAPE y racha»*

             Estaba puesto al revés: CAPE primero, la elevación segunda y
             la lluvia la séptima de diez. Nadie lee diez cifras de
             izquierda a derecha; se leen las tres primeras. Así que las
             tres primeras tienen que ser las suyas, y en su orden.

             La tapa va pegada al CAPE porque es la pareja que decide si
             rompe —una sola no rompe nada—, y la racha a SU altura va
             antes que la de 10 m, que es contexto. */
          return num(has(h.prec) ? mmTxt(h.prec) : '—',
                     'lluvia mm/h' + (has(h.pop) ? ` · ${h.pop}% prob.` : ''),
                     has(h.prec) && h.prec > 0, 'decide')
               + num(has(h.cape) ? h.cape.toFixed(0) : '—', 'CAPE J/kg', tapaAbierta, 'decide')
               + num(has(h.cin) ? h.cin.toFixed(0) : '—',
                     'tapa J/kg' + (has(h.cin) ? ' · ' + textoTapa(h.cin) : ''), tapaAbierta, 'decide')
               + num(has(h.gust) ? wtxt(h.gust, true) : '—',
                     `racha a ${h.h} m${h.gustEst ? ' (est.)' : ''}`, rachaAlta, 'decide')
               + num(has(h.gust10) ? wtxt(h.gust10, true) : '—', 'racha a 10 m de altura', rachaAltaP)
               + num(has(h.wind) ? wtxt(h.wind, true) : '—',
                     `viento a ${h.h} m${h.windExact ? '' : ' (est.)'}${
                       has(h.dir) ? ' · del ' + rumboLargo(h.dir) : ''}`)
               + num(has(h.temp) ? h.temp.toFixed(0) + '°' : '—',
                     (has(h.dew) ? `rocío ${h.dew.toFixed(0)}°` : 'temperatura')
                     + (has(h.hum) ? ` · HR ${h.hum}%` : ''), rocioPegado)
               + num(has(h.frz) ? Math.round(h.frz) + ' m' : '—',
                     has(cotaSitio) ? `isocero · sitio a ${Math.round(cotaSitio)} m` : 'isocero', hielo)
               + num(has(h.li) ? h.li.toFixed(1).replace('.', ',') : '—', liTexto,
                     has(h.li) && h.li <= -2)
               + num(has(h.vis) ? (h.vis / 1000).toFixed(1).replace('.', ',') + ' km' : '—',
                     'visibilidad', has(h.vis) && h.vis < 2000);
        }
        // Azotea y torre: manda el viento, como siempre.
        return num(has(h.gust) ? wtxt(h.gust, true) : nd,
                   `ráfaga a ${h.h} m${h.gustEst ? ' (est.)' : ''}`)
             + num(has(h.wind) ? wtxt(h.wind) : '—', `viento ${wu().lbl}`)
             + num(has(h.cape) ? h.cape.toFixed(0) : '—', 'CAPE J/kg');
      })()}</div>
      ${lineaAguaTorre(key(t.place))}
      ${lineaPista(t.pista)}
      <div class="tor__tl">${tiras}<span class="tor__tlx">próximas 12 h</span></div>
      <div class="tor__why">${esc(motivo)}${aviso ? ` · <b>${esc(aviso)}</b>` : ''}${
        t.copia ? ` · <span class="tor__old">copia ${esc(textoEdad(t.copia.t, t.copia.edadH))}</span>` : ''}</div>
      ${lineaLlegada}
      ${(() => {
        /* ── EL PARTE, DENTRO DE SU TARJETA ────────────────────────
           Suyo, 02-09-2026, con las dos listas de sus veinte sitios en
           la misma pestaña:  *«estos dos al final, ¿para qué es uno y el
           otro?»* · *«lo menos lioso y fácil de ver, no puedo perder
           tanto tiempo»* · *«en un vistazo de X estación que me diga
           todo»*.

           Aquí entra lo que solo tenía el parte: la racha MÁXIMA del día
           con su hora, el CAPE con la tapa, la lluvia del día, la ventana
           de cuándo se puede, y la comparación contra el aparato de
           Euskalmet que hay al lado. La tarjeta ya traía lo de ahora y lo
           de dentro de un rato. Juntas dicen todo de ese sitio, y el
           nombre se lee UNA vez.                                      */
        const P = S.parteFilas?.get(key(t.place));
        if (!P) return '';
        return `<div class="tor__parte" data-s="${P.est}">${P.cuerpo}</div>${P.comp || ''}`;
      })()}
      ${lineaD}
      ${(() => {
        const dn = desnivel(t.cfg, t.elev);
        if (!has(t.cfg?.cota))
          /* ANTES: «sin cota puesta, rellenar», en los catorce. Lo cortó
             él el 28-08: *«tenéis la cota de altura de todas las
             estaciones que aparecen en Mis torres»*. Ahora se saca de
             las coordenadas y esto solo queda si además falla eso. */
          return `<div class="tor__cota" data-s="warn">Todavía sin la altura de este
                  emplazamiento: se saca de sus coordenadas y no ha llegado.
                  <button class="tor__aj" data-aj="${esc(key(t.place))}">Ponerla a mano</button></div>`;
        if (!dn || dn.nivel === 'go') return '';
        return `<div class="tor__cota" data-s="${dn.nivel}">${textoDesnivel(dn, t.elev, t.cfg.cota)}</div>`;
      })()}
      <div class="tor__form" id="tor-${cssId(key(t.place))}"></div>
      <div class="tor__cfg">
        ${esc(TIPOS[t.cfg?.tipo || 'torre'].et)} · trabajo a <b>${t.cfg?.alt ?? S.hgt} m</b>${
          has(t.cfg?.cota) ? ` · cota ${t.cfg.cota} m` : ''}
        <button class="tor__aj" data-abrir="${esc(key(t.place))}">Ver en Ahora</button>
        <button class="tor__aj" data-aj="${esc(key(t.place))}">Ajustar</button>
      </div>
    </div>`;
  }).join('');
}


/* ---------- Cámaras en directo ──────────────────────────────────────
   Para verificar con los ojos lo que dice el modelo: si cae agua, si ha
   caído, cómo está la mar.

   Se cargan SOLO cuando se piden. Son vídeo en directo y una de ellas
   son unos 200 kB por segundo: dejarlas abiertas de fondo se come los
   datos del móvil sin que te enteres.

   Todo se ve dentro de la app, sin salir a ninguna web. */

const CAMS = [
  // Bizkaia — las de casa
  { id:'bakio',  z:'Bizkaia', nom:'Bakio · playa', tipo:'img', lat:43.428, lon:-2.809,
    url:'https://www.webviewcams.com/stream-image?ip=82.130.141.93&size=640',
    que:'A un paso de Bermeo. La mejor para confirmar si está cayendo ahora mismo' },
  { id:'sopela', z:'Bizkaia', nom:'Sopela · Arrietara', tipo:'iframe', lat:43.386, lon:-2.988,
    url:'https://g0.ipcamlive.com/player/player.php?alias=673c8a5893eaf&autoplay=1&mute=1&disableautofullscreen=1',
    que:'Mar abierto al noroeste. Si entra frente por el Cantábrico, aquí se ve antes' },

  // Cantabria — Puerto de Santander
  { id:'mouro',  z:'Cantabria', nom:'Santander · isla de Mouro', tipo:'img', lat:43.472, lon:-3.766,
    url:'https://www.puertosantander.es/sites/default/files/Camaras/cam1.jpg', que:'Mar abierto y horizonte' },
  { id:'matale', z:'Cantabria', nom:'Santander · Mataleñas', tipo:'img', lat:43.483, lon:-3.784,
    url:'https://www.puertosantander.es/sites/default/files/Camaras/cam2.jpg', que:'Acantilado al norte' },
  { id:'raos',   z:'Cantabria', nom:'Santander · puerto de Raos', tipo:'img', lat:43.436, lon:-3.833,
    url:'https://www.puertosantander.es/sites/default/files/Camaras/cam3.jpg', que:'Interior de la bahía' },
  { id:'bahia',  z:'Cantabria', nom:'Santander · bahía', tipo:'img', lat:43.462, lon:-3.804,
    url:'https://www.puertosantander.es/sites/default/files/Camaras/cam4.jpg', que:'Vista amplia de la bahía' },

  // Asturias
  { id:'vidosa',  z:'Asturias', nom:'Desfiladero de los Beyos · Vidosa', tipo:'iframe', lat:43.243, lon:-5.001,
    url:'https://www.hispacams.com/cam_embedded.php?id=000283', que:'Montaña, buena para ver cómo entra la nube' },
  { id:'gijon',   z:'Asturias', nom:'Gijón · La Escalerona', tipo:'iframe', lat:43.541, lon:-5.663,
    url:'https://www.hispacams.com/cam_embedded.php?id=000183', que:'Playa de San Lorenzo y horizonte' },
  { id:'xago',    z:'Asturias', nom:'Playa de Xagó', tipo:'iframe', lat:43.596, lon:-5.955,
    url:'https://www.hispacams.com/cam_embedded.php?id=000132', que:'Costa abierta al Cantábrico' },

  // Burgos
  { id:'mpsur',  z:'Burgos', nom:'Medina de Pomar · acceso sur', tipo:'iframe', lat:42.928, lon:-3.489,
    url:'https://v.angelcam.com/iframe?v=oxynbzxgy8&autoplay=1', que:'Interior, para ver si el frente ha pasado el monte' },
  { id:'mpnor',  z:'Burgos', nom:'Medina de Pomar · acceso norte', tipo:'iframe', lat:42.933, lon:-3.487,
    url:'https://v.angelcam.com/iframe?v=jzl12m7orn&autoplay=1', que:'Mira hacia el Cantábrico' },
  { id:'mpeste', z:'Burgos', nom:'Medina de Pomar · vista este', tipo:'iframe', lat:42.930, lon:-3.480,
    url:'https://v.angelcam.com/iframe?v=v8rpkd56y6&autoplay=1', que:'Cielo abierto al este' },

  // Madrid — tráfico municipal
  { id:'mdgoya', z:'Madrid', nom:'Alcalá con Goya', tipo:'img', lat:40.425, lon:-3.677,
    url:'https://informo.madrid.es/cameras/Camara04307.jpg', que:'Calle: se ve el asfalto mojado' },
  { id:'mdsev',  z:'Madrid', nom:'Alcalá con Sevilla', tipo:'img', lat:40.418, lon:-3.700,
    url:'https://informo.madrid.es/cameras/Camara01316.jpg', que:'Centro de Madrid' },
  { id:'mdcast', z:'Madrid', nom:'Castellana con Ortega y Gasset', tipo:'img', lat:40.432, lon:-3.688,
    url:'https://informo.madrid.es/cameras/Camara07303.jpg', que:'Cielo abierto sobre la Castellana' },

  // Baleares
  { id:'calabosch', z:'Baleares', nom:'Menorca · Cala en Bosch', tipo:'iframe', lat:39.930, lon:3.831,
    url:'https://www.avistabaleares.es/camara/cala-en-bosch/', que:'Costa sur de Menorca' },
  { id:'eularia',   z:'Baleares', nom:'Ibiza · Santa Eulària', tipo:'iframe', lat:38.985, lon:1.535,
    url:'https://www.avistabaleares.es/camara/santa-eularia-des-riu/', que:'Costa este de Ibiza' },
  { id:'savina',    z:'Baleares', nom:'Formentera · La Savina', tipo:'iframe', lat:38.732, lon:1.417,
    url:'https://www.avistabaleares.es/camara/la-savina/', que:'Puerto de Formentera' },

  // Canarias
  { id:'ptocruz', z:'Canarias', nom:'Tenerife · Puerto de la Cruz', tipo:'img', lat:28.414, lon:-16.546,
    url:'https://cic.tenerife.es/e-Traffic3/data/camara-2701002-538.jpg', que:'Norte de Tenerife' },
  { id:'iz_dia',  z:'Canarias', nom:'Izaña · cielo diurno (AEMET)', tipo:'img', lat:28.309, lon:-16.499,
    url:'https://izana.aemet.es/wp-content/rtime/camaras/sona_dia.jpg',
    que:'Observatorio de AEMET a 2.370 m. Cielo completo: la mejor para juzgar nubosidad' },
  { id:'iz_norte',z:'Canarias', nom:'Izaña · norte', tipo:'img', lat:28.309, lon:-16.499,
    url:'https://izana.aemet.es/wp-content/rtime/camaras/anaga.jpg', que:'Hacia Anaga' },
  { id:'iz_ne',   z:'Canarias', nom:'Izaña · nordeste', tipo:'img', lat:28.309, lon:-16.499,
    url:'https://izana.aemet.es/wp-content/rtime/camaras/north.jpg', que:'Mar de nubes al nordeste' },
  { id:'iz_noche',z:'Canarias', nom:'Izaña · cielo nocturno', tipo:'img', lat:28.309, lon:-16.499,
    url:'https://izana.aemet.es/wp-content/rtime/camaras/sona_noche.jpg', que:'Cielo completo de noche' },
];



/* ══════════════════════════════════════════════════════════════════════
   CUANDO UN MODELO VE TORMENTA Y EL QUE MIRAS NO
   ──────────────────────────────────────────────────────────────────────
   Encontrado el 25-08-2026 analizando el miércoles para Bilbao, y es de
   los que muerden en silencio.

   MEDIDO ese día, para el 26-08 en Bilbao, pidiendo modelo a modelo por
   la propia app:

     · «Automático» era AROME HD las 24 horas de 24
     · AROME HD NO publica estado del cielo ni inhibición: 0 horas de 24
     · así que Automático pintaba «cubierto» plano las 24 horas
     · y mientras tanto ECMWF daba CÓDIGO 95, TORMENTA, a las 16:00 y a
       las 17:00, con CAPE de 1840 y 1930 y 6,6 mm en el día
     · ICON quedaba en medio: CAPE 1150 a las 16:00, lluvia débil a las
       17 y 18

   O sea que mirando la app como la mira siempre —en Automático— no
   habría visto NI UNA señal de tormenta mientras otro modelo la estaba
   dando. Y el rayo es su único veto.

   Es primo del fallo del 23-08 («AROME HD no publica el estado del cielo
   y sin ese campo el NO APTO por tormenta no salta nunca»), pero con una
   vuelta que se nos escapó: `completar()` rellena los huecos desde el
   modelo automático cuando eliges un modelo a mano, y aquí **el elegido
   ES el automático**, así que no hay de dónde rellenar.

   QUÉ SE COMPARA, Y POR QUÉ ASÍ. Solo el código de tormenta de la tabla
   WMO —95, 96 y 99—, que no admite interpretación: o el modelo dice
   tormenta o no la dice. Nada de umbrales nuevos inventados para esto.
   Si algún modelo la dice y el que tienes en pantalla no, se te dice
   cuál y a qué horas, y decides tú si te pasas a mirarlo.

   NO cambia el semáforo. No es una medida, son dos previsiones que no se
   ponen de acuerdo: eso es incertidumbre, y la incertidumbre se cuenta,
   no se convierte en un color.                                        */

/* El CAPE a partir del cual la combinación con la tapa abierta cuenta.
   Calibrado sobre 1.536 horas el 24-08-2026 — ver la sección de la tapa
   en CLAUDE.md. Vive aquí arriba porque lo usan dos sitios: la regla de
   `assess()` y el aviso de discrepancia entre modelos. Un umbral
   duplicado se separa solo con el tiempo. */
const CAPE_COMBINACION = 700;

/* Los miles con punto, a mano. `toLocaleString` da un espacio fino que
   en el móvil se lee como si fueran dos números: «2 700» parecía 2 y 700.
   Lo usan el parte y las comparativas, así que vive aquí y no dentro de
   una función. */
const nCape = v => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const MODELOS_TORMENTA = [
  { om: 'ecmwf_ifs025',                nom: 'ECMWF' },
  { om: 'icon_seamless',               nom: 'ICON' },
  { om: 'gfs_seamless',                nom: 'GFS' },
  { om: 'meteofrance_arome_france_hd', nom: 'AROME HD' },
  { om: 'best_match',                  nom: 'Automático' },
];

/** Horas por delante que se miran. Dos días: más allá, AROME ya no llega
 *  y comparar modelos con horizontes distintos compara peras con manzanas. */
const DISCREPA_HORAS = 48;

async function cargarDiscrepancia(place) {
  const clave = `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`;
  if (S.discrepa?.clave === clave && Date.now() - S.discrepa.t < 20 * 60e3) {
    pintarDiscrepancia(); return;
  }
  try {
    const d = await jget(API.fc, {
      latitude: place.lat, longitude: place.lon, timezone: 'auto',
      // La temperatura va para poder saber QUÉ modelo es el «Automático»:
      // es la huella que mejor los separa. Ver `quienEsAutomatico()`.
      hourly: 'weather_code,cape,convective_inhibition,temperature_2m',
      models: MODELOS_TORMENTA.map(m => m.om).join(','),
      forecast_days: 3,
    }, { timeout: 20000 });
    S.discrepa = { clave, t: Date.now(), d, error: null };
  } catch (e) {
    S.discrepa = { clave, t: Date.now(), d: null, error: String(e.message || e) };
  }
  pintarDiscrepancia();
}

/** Qué modelos dicen tormenta y en qué horas, y si el de pantalla se lo
 *  pierde. Devuelve null cuando no hay nada que contar. */
function discrepanciaTormenta() {
  const H = deEsteSitio(S.discrepa)?.d?.hourly;   // del sitio abierto, no del anterior
  if (!H?.time) return null;

  const mio = modeloDato().om;
  const ahora = Date.now();
  const otros = [];

  /* Se miran DOS discrepancias, no una:

     · por CÓDIGO: otro modelo dice tormenta y el tuyo no. Es el caso
       claro y no admite interpretación.
     · por CAPE: otro modelo llega al umbral de la combinación (700 J/kg,
       el mismo que ya está calibrado en `assess()`) en una hora en la
       que el tuyo se queda corto.

     La segunda hace falta porque la primera sola se deja lo peor: la
     noche del 23-08-2026 en Lekeitio y Durango **ningún modelo dijo
     tormenta en el estado del cielo** y rompió igual. Lo que avisó fue
     el CAPE subiendo con la tapa cayéndose. Medido para Bilbao el
     26-08: a las 16:00 el Automático daba 200 J/kg y ECMWF 1840. */
  const dentro = (i) => {
    const t = new Date(H.time[i]).getTime();
    return t >= ahora - 3600e3 && t <= ahora + DISCREPA_HORAS * 3600e3;
  };
  const capeMio = H[`cape_${mio}`];

  for (const m of MODELOS_TORMENTA) {
    if (m.om === mio) continue;
    const cod = H[`weather_code_${m.om}`];
    const cap = H[`cape_${m.om}`];
    const horas = [], porCape = [];
    for (let i = 0; i < H.time.length; i++) {
      if (!dentro(i)) continue;
      if (cod && isStormCode(cod[i])) horas.push(new Date(H.time[i]));
      else if (has(cap?.[i]) && cap[i] >= CAPE_COMBINACION
            && (!has(capeMio?.[i]) || capeMio[i] < CAPE_COMBINACION)) {
        porCape.push({ d: new Date(H.time[i]), suyo: cap[i], mio: capeMio?.[i] });
      }
    }
    if (horas.length || porCape.length) otros.push({ ...m, horas, porCape });
  }
  if (!otros.length) return null;

  // ¿Y el que estoy mirando? Si también la ve, no hay discrepancia que
  // contar: la app ya lo está avisando por su cuenta.
  const mia = H[`weather_code_${mio}`];
  let laVeoYo = false;
  if (mia) {
    for (let i = 0; i < H.time.length; i++) {
      const t = new Date(H.time[i]).getTime();
      if (t < ahora - 3600e3 || t > ahora + DISCREPA_HORAS * 3600e3) continue;
      if (isStormCode(mia[i])) { laVeoYo = true; break; }
    }
  }
  // Si el mío ya la ve por código, la app ya está avisando por su cuenta
  // y no hay discrepancia que contar en esa parte.
  const conCodigo = otros.filter(o => o.horas.length);
  const conCape   = otros.filter(o => !o.horas.length && o.porCape.length);
  if (laVeoYo && !conCape.length) return null;

  conCodigo.sort((a, b) => b.horas.length - a.horas.length);
  conCape.sort((a, b) => Math.max(...b.porCape.map(x => x.suyo))
                       - Math.max(...a.porCape.map(x => x.suyo)));
  return {
    porCodigo: laVeoYo ? [] : conCodigo,
    porCape: conCape,
    mio: modeloDato().name,
    sinCampo: !mia || mia.every(v => !has(v)),
  };
}

/* ── QUÉ HORAS ESTÁN EN DISCREPANCIA ──────────────────────────────────
   Sale de `discrepanciaTormenta()`, no se recalcula: una sola fuente de
   verdad, como el `CAPE_COMBINACION`.

   POR QUÉ HACE FALTA, y lo encontró él el 25-08-2026. El aviso de texto
   estaba y decía lo suyo, pero **la barra de 48 h pintaba VERDE** las
   horas en discrepancia. Medido en BI BERMEO sobre lo publicado, para
   el miércoles 26:

       14:00 APTO · 15:00 APTO · 16:00 APTO · 17:00 PRECAUCIÓN

   y a esas 15:00 y 16:00 les daban tormenta ECMWF, ICON, Meteored,
   Windy y Euskalmet. Él mira la barra de un vistazo; el texto está más
   abajo. Una barra verde es una afirmación, y ahí no había nada que
   afirmar.

   NO se cambia el color: no podemos asegurar que ECMWF tenga razón
   sobre AROME, y bajarlo a PRECAUCIÓN sería elegir modelo a dedo. Lo
   que se hace es QUITARLE LA CERTEZA a esa hora: se raya, se dice al
   pinchar, y la ventana apta continua se corta ahí en vez de
   atravesarla. Ni verde limpio ni ámbar: «aquí los modelos no
   coinciden». */
function horasEnDiscrepancia() {
  /* TRES estados, no dos. Lo avisó la sesión de al lado y tiene razón:
     un Set vacío puede ser «no hay discrepancia» o «todavía no ha
     llegado la consulta», y pintarlos igual sería repetir el fallo que
     esto viene a arreglar. `S.discrepa` se pide por emplazamiento en
     `cargarDiscrepancia()` y llega DESPUÉS del primer pintado.
       · sabido:false → aún no se sabe. No se marca, pero tampoco se
         añade la coletilla de la ventana: no se afirma nada.
       · sabido:true con set vacío → comprobado y coinciden.
       · sabido:true con horas → esas horas van rayadas. */
  const sabido = !!deEsteSitio(S.discrepa)?.d;
  const set = new Set();
  const D = sabido ? discrepanciaTormenta() : null;
  if (D) {
    const meter = d => set.add(new Date(d).setMinutes(0, 0, 0));
    D.porCodigo.forEach(o => o.horas.forEach(meter));

    /* AL OTRO MODELO SE LE EXIGE LO MISMO QUE A NOSOTROS.
       Primer intento (25-08-2026): se rayaba toda hora en que otro
       modelo pasara de 700 J/kg. Resultado medido en BI BERMEO: **14
       horas seguidas rayadas**, casi el día entero, porque ECMWF tiene
       CAPE alto de 10:00 a 23:00. Una marca que sale catorce veces no
       marca nada, y gastar el aviso es el fallo que esta app tiene
       prohibido.

       Y era además el MISMO error que corregimos esa tarde: CAPE a
       secas no es tormenta. Así que a la hora del otro modelo se le
       pide la combinación entera —gasolina Y tapa abierta—, igual que
       en `assess()`. El código de tormenta se raya siempre, que ese no
       admite interpretación.

       Si ese modelo NO publica inhibición (ECMWF es el caso, medido:
       0 horas de 24), no se puede comprobar la combinación y NO se
       raya por CAPE. No se calla nada: el bloque de arriba sigue
       diciendo la diferencia de CAPE con su número. Lo que no se hace
       es marcar una hora afirmando algo que no se ha podido comprobar. */
    const H = deEsteSitio(S.discrepa)?.d?.hourly;   // del sitio abierto, no del anterior
    D.porCape.forEach(o => {
      const cin = H?.[`convective_inhibition_${o.om}`];
      if (!cin || !cin.some(v => has(v))) return;   // ese modelo no la publica
      o.porCape.forEach(x => {
        const i = H.time.findIndex(t => new Date(t).getTime() === x.d.getTime());
        if (i >= 0 && has(cin[i]) && cin[i] < 75) meter(x.d);
      });
    });
  }
  return { set, sabido };
}

/* ═══════════════════════════════════════════════════════════════════
   QUÉ DÍA ES, DICHO SIN QUE SE PUEDA ENTENDER AL REVÉS
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026, mirando el aviso de CAPE de Bermeo:

     *«¿del CAPE mañana llega tal… mañana de cuándo? ¿de esta mañana?
       ¿de mañana sábado? Lío, ¿no?»*

   Y lío es. En castellano **«mañana» son dos cosas**: el día siguiente
   y la primera mitad del día. Y en esa misma tarjeta, justo encima,
   ponía «ahora hasta 19:00» — o sea que las dos lecturas cabían.

   Aquí eso no es una pega de estilo: decide si sube a una torre de
   60 m hoy por la tarde o mañana por la noche.

   La regla, a partir de hoy: **el día siguiente lleva SIEMPRE su nombre
   detrás** — «mañana sábado», no «mañana». Con el nombre puesto, no hay
   segunda lectura posible.

   Y va en un solo sitio porque estaba escrito CINCO veces, cada una en
   su rincón: el parte, el aviso de no apta, el tramo de horas, la curva
   del viento y la comparativa. Arreglar una y dejar cuatro es lo que él
   lleva pidiendo que deje de pasar desde el 01-09.
   ═══════════════════════════════════════════════════════════════════ */
function nombreDeDia(d) {
  const h = new Date();
  const n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate())
                      - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
  if (n === 0) return 'hoy';
  const nom = d.toLocaleDateString('es', { weekday: 'long' });
  if (n === 1) return `mañana ${nom}`;
  return `el ${nom}`;
}

/** Un tramo de horas dicho en cristiano: «mañana de 16:00 a 17:00». */
function tramoHoras(fechas) {
  if (!fechas.length) return '';
  const dia = nombreDeDia;
  const hm = d => String(d.getHours()).padStart(2, '0') + ':00';
  // Tramos seguidos, para no soltar una lista de doce horas sueltas
  const tramos = [];
  let ini = fechas[0], ant = fechas[0];
  for (const f of fechas.slice(1)) {
    if (f - ant > 3600e3 + 60e3 || dia(f) !== dia(ant)) { tramos.push([ini, ant]); ini = f; }
    ant = f;
  }
  tramos.push([ini, ant]);
  return tramos.map(([a, b]) => a.getTime() === b.getTime()
    ? `${dia(a)} a las ${hm(a)}`
    : `${dia(a)} de ${hm(a)} a ${hm(b)}`).join(' y ');
}

/* ── Qué publica cada modelo, dicho en pantalla ───────────────────────
   Aitor lo preguntó el 25-08-2026: «¿y qué modelo publica el estado del
   cielo, si no es un lío?». Y es un lío: cada modelo tiene agujeros
   distintos, y hasta ahora había que acordarse.

   MEDIDO ese día en Bilbao, Bermeo y Vitoria, 48 horas cada uno — sale
   igual en los tres, así que es del modelo y no del punto:

     Automático  cielo ✓  tapa ✓  elevación ✓  isocero ✓  visibilidad ✓
     GFS         cielo ✓  tapa ✓  elevación ✓  isocero ✓  visibilidad ✓
     ICON        cielo ✓  tapa ✓  elevación ✗  isocero ✓  visibilidad ✓
     ECMWF       cielo ✓  tapa ✗  elevación ✗  isocero ✗  visibilidad ✗
     AROME HD    cielo ✗  tapa ✗  elevación ✗  isocero ✗  visibilidad ✗

   No se pinta de memoria: se cuenta de los datos que acaban de llegar,
   así que si Open-Meteo cambia algo, el texto cambia solo.            */
const CAMPOS_DECISION = [
  ['weather_code',           'estado del cielo'],
  ['convective_inhibition',  'la tapa'],
];

/* ── ¿Y qué es «Automático», exactamente? ────────────────────────────
   Pendiente desde que Aitor lo preguntó el 25-08-2026: «cuando miro aquí
   modelo automático entiendo que será el bueno?». Y la respuesta es «a
   ratos», que es la peor de las respuestas si no se dice cuáles.

   Open-Meteo coge, para cada hora, el modelo de malla más fina que llegue
   hasta ahí, y cuando ese se acaba salta al siguiente SIN AVISAR. MEDIDO
   ese día en Bermeo: coincide con AROME HD hoy y mañana, con el ARPEGE de
   Météo-France del 27 al 29, y con el KNMI del 30 en adelante. De las 168
   horas de la semana, AROME solo cubre 63.

   Y esa misma tarde se vio para qué importa: en Bilbao, para el 26,
   Automático era AROME las 24 horas de 24 — y AROME daba 610 J/kg de
   CAPE donde ECMWF daba 1.930 y la máxima cinco grados por encima de la
   oficial de Euskalmet.

   No se pinta de una tabla aprendida: se compara hora a hora con los
   datos que acaban de llegar. Si Open-Meteo cambia la escalera, el texto
   cambia solo. Y si no coincide con ninguno de los que tenemos, se dice
   que es otro, en vez de callarlo o de inventarse cuál.            */
function quienEsAutomatico() {
  const H = deEsteSitio(S.discrepa)?.d?.hourly;   // del sitio abierto, no del anterior
  if (!H?.time || !H['temperature_2m_best_match']) return null;

  const casi = (a, b) => has(a) && has(b) && Math.abs(a - b) < 0.051;
  const ahora = Date.now();
  const tramos = [];

  for (let i = 0; i < H.time.length; i++) {
    const t = new Date(H.time[i]).getTime();
    if (t < ahora - 3600e3) continue;
    let quien = null;
    for (const m of MODELOS_TORMENTA) {
      if (m.om === 'best_match') continue;
      if (casi(H['temperature_2m_best_match'][i], H[`temperature_2m_${m.om}`]?.[i])
       && casi(H['cape_best_match'][i], H[`cape_${m.om}`]?.[i])) { quien = m.nom; break; }
    }
    const ult = tramos[tramos.length - 1];
    if (ult && ult.quien === quien) ult.hasta = new Date(H.time[i]);
    else tramos.push({ quien, desde: new Date(H.time[i]), hasta: new Date(H.time[i]) });
  }
  // Tramos de una sola hora sueltos no aportan: solo despistan
  return tramos.filter(x => x.hasta - x.desde >= 2 * 3600e3);
}

function pintarQueEs() {
  const el = $('#mselQue');
  if (!el) return;
  if (modeloDato().om !== 'best_match') { el.hidden = true; el.innerHTML = ''; return; }
  const T = quienEsAutomatico();
  if (!T?.length) { el.hidden = true; el.innerHTML = ''; return; }

  const primero = T[0];
  const resto = T.slice(1).filter(x => x.quien !== primero.quien)[0];
  el.hidden = false;
  el.innerHTML = `<b>Aquí y ahora, Automático es ${primero.quien
      ? esc(primero.quien) : 'un modelo que no está en la lista de arriba'}</b>`
    + `, hasta ${esc(horaDia(primero.hasta.toISOString()))}`
    + (resto ? `. Después pasa a ${resto.quien ? esc(resto.quien) : 'otro'} sin avisar.` : '.')
    + ` <span class="dim">Open-Meteo coge para cada hora el modelo de malla más fina que llegue,
       y cambia solo. Malla más fina no quiere decir que acierte más.</span>`;
}

function pintarQueFalta() {
  const el = $('#mselFalta');
  if (!el) return;
  const H = deEsteSitio(S.discrepa)?.d?.hourly;   // del sitio abierto, no del anterior
  const mio = modeloDato();
  if (!H?.time) { el.hidden = true; return; }

  const vacio = c => { const v = H[`${c}_${mio.om}`]; return !v || v.every(x => !has(x)); };

  /* ── LO QUE EL CARGADO NO PUBLICA, YA SE LO PIDE LA APP A OTRO ────
     Cazado el 01-09-2026: este cartel decía «AROME HD no publica estado
     del cielo ni la tapa — por esa vía no puede avisar de tormenta ni
     aunque la haya», y es FALSO desde que hay reparto: el código del
     cielo lo pone ARPEGE por acierto y la tapa se pide prestada a ICON,
     y con los dos decide `assess()`. Encima mandaba al Automático, que
     él quitó el 30-08.

     Un cartel que dice «no puedo avisarte de tormenta» cuando sí puede
     es de los que hacen que se deje de creer a la app — o peor, que
     mire a otro sitio teniendo el aviso aquí. Ahora solo se queja de lo
     que se ha quedado SIN DUEÑO; lo prestado se dice como prestado. */
  /* `prestadosDe` es una LISTA de {k, de}, no un diccionario. Esta misma
     mañana lo escribí como `prestados[c]` y el arreglo del cartel NO
     FUNCIONABA: seguía diciendo «no puede avisar de tormenta» teniendo
     el cielo y la tapa prestados. Y mis pruebas eran regex sobre el
     fuente, así que pasaron en verde con el fallo dentro — la lección de
     siempre: una prueba que no EJECUTA no prueba nada. (01-09-2026.) */
  const prestados = new Set((S.data?.fc?.prestadosDe || []).map(x => x?.k));
  const sinDueño = CAMPOS_DECISION.filter(([c]) => vacio(c) && !prestados.has(c)).map(([, n]) => n);
  const cubiertos = CAMPOS_DECISION.filter(([c]) => vacio(c) && prestados.has(c)).map(([, n]) => n);

  if (sinDueño.length) {
    const buenos = MODELOS_TORMENTA
      .filter(m => m.om !== mio.om && CAMPOS_DECISION.every(([c]) => {
        const v = H[`${c}_${m.om}`]; return v && v.some(x => has(x));
      }))
      .map(m => m.nom);
    el.hidden = false;
    el.innerHTML = `<b>${esc(mio.name)} no publica ${esc(sinDueño.join(' ni '))}, y nadie se lo presta.</b>
      Por esa vía no puede avisar de tormenta ni aunque la haya.
      ${buenos.length ? `Para eso, ${esc(buenos.slice(0, 3).join(', '))}.` : ''}`;
    return;
  }

  if (cubiertos.length) {
    el.hidden = false;
    el.innerHTML = `<b>${esc(mio.name)} no publica ${esc(cubiertos.join(' ni '))}, pero la app se lo pide a quien sí lo mide.</b>
      El aviso de tormenta sigue en pie: sale de esos datos, no del modelo que tengas puesto.`;
    return;
  }

  el.hidden = true; el.innerHTML = '';
}

function pintarDiscrepancia() {
  pintarQueFalta();
  pintarQueEs();

  /* La barra de 48 h se repinta AQUÍ, no solo al cargar la ficha. La
     consulta de discrepancia llega después del primer pintado, así que
     sin esto la barra se quedaría con el estado «todavía no se sabe» y
     nunca marcaría las horas. */
  if (S.data?.hours?.length && $('#tl')) {
    try { renderTimeline(S.data.hours); } catch { /* no romper la ficha */ }
  }

  const el = $('#vModelos');
  if (!el) return;
  const D = discrepanciaTormenta();
  if (!D) { el.hidden = true; el.innerHTML = ''; return; }

  const lista =
    D.porCodigo.slice(0, 3).map(o =>
      `<li data-s="warn"><b>${esc(o.nom)}</b> da tormenta ${esc(tramoHoras(o.horas))}</li>`).join('')
    + D.porCape.slice(0, 2).map(o => {
        const peor = o.porCape.reduce((a, b) => b.suyo > a.suyo ? b : a);
        return `<li data-s="warn"><b>${esc(o.nom)}</b> llega a
          <b>${peor.suyo.toFixed(0)} J/kg</b> ${esc(tramoHoras(o.porCape.map(x => x.d)))}
          — donde el tuyo da ${has(peor.mio) ? peor.mio.toFixed(0) : 'sin dato'}</li>`;
      }).join('');
  if (!lista) { el.hidden = true; el.innerHTML = ''; return; }

  el.hidden = false;
  el.dataset.s = 'warn';
  /* ── UNA LÍNEA, NO UN RECUADRO ──────────────────────────────────
     Suyo, 02-09-2026, con este bloque delante otra vez:
       *«esto dijimos fuera y más cosas»* · *«al final lío con esos
       textos»*.

     Y tenía razón dos veces: además de ocupar media pantalla, **decía lo
     mismo que la línea que ya sale en su tarjeta de Mis estaciones**
     («ECMWF llega a 750 J/kg el 04 sept a las 16:00 — aquí sin dato»).
     Dos sitios contando lo mismo con distinto formato es justo lo que le
     hace no saber dónde mirar.

     Se queda el dato —qué modelo, cuánto, cuándo y qué da el suyo— y
     nada más. El «se queda corto» y el «son previsiones que no coinciden»
     se van: eso ya lo sabe, y le tapaba el número.

     Y EL AVISO DEL CIELO SE FUE TAMBIÉN, unas horas después, porque
     había dejado de ser verdad ese mismo día. Suyo, leyéndolo:

       *«Tu modelo no publica el estado del cielo… — lío, que si tu modelo
         sí, que si el otro que no… lío»*

     Decía que por esa vía no se podía avisar de tormenta. Y desde el
     cambio de esta tarde **el símbolo del cielo se le pide al europeo**
     cuando el suyo no lo publica (ver `cieloQueSePresta`), así que sí se
     puede. Era un aviso que se quedó viejo en horas, y encima le hacía
     comparar dos modelos de cabeza para no enterarse de nada.

     `sinCampo` mira la consulta de discrepancia, que pregunta a cada
     modelo por separado y SIN el reparto. Que ahí falte no quiere decir
     que la app no lo tenga.                                           */
  el.innerHTML = `<ul class="acc__l">${lista}</ul>`;
}


/* ══════════════════════════════════════════════════════════════════════
   RAYOS DE VERDAD — descargas medidas, no previsión
   ──────────────────────────────────────────────────────────────────────
   Esto es lo que le faltaba a la app desde el principio. El rayo es el
   ÚNICO veto de Aitor —«debo acudir siempre y cuando no caigan rayos,
   porque la torre está pegada a la caseta y es un pararrayos»— y hasta
   el 25-08-2026 la app no leía ni una sola descarga: enseñaba el mapa de
   Blitzortung en un marco y ahí se acababa. Veía sin enterarse.

   Ahora lee las descargas que localiza la RED DE AEMET: detectores en la
   península, Baleares y Canarias, más los de Portugal, Francia e Italia.
   Es la fuente oficial, la misma con la que AEMET hace sus mapas.

   Cómo, y por qué así (todo MEDIDO el 25-08-2026, nada supuesto):

   · AEMET publica un PNG por hora, georreferenciado, sin clave, en el
     mismo sitio del que sale el compuesto de radar. Cada píxel opaco es
     una descarga: azul negativa, roja positiva.
   · De los cuatro tamaños que publica se pide LOCL (7296x2620, 0,35 km
     por píxel) porque es el único que da CADA descarga por separado:
     975 en la hora de las 15:00 del 24-08. En el tamaño pequeño esas
     mismas 975 salían fundidas en 28 manchas.
   · La imagen va en WEB MERCATOR. Comprobado contra el compuesto de
     radar de la misma hora: cuadrando por Mercator, el 68 % de las
     descargas cae sobre un píxel con eco de lluvia; leyéndola como
     lat/lon plana, solo el 27 %. La diferencia son 25 km en Euskadi.
   · No se descarga la imagen entera para mirarla: se recorta al vuelo
     la caja que interesa con createImageBitmap. Medido: 111 ms el
     recorte y 3 ms leer los píxeles.

   LA VALIDACIÓN QUE IMPORTA. El 24-08-2026 a las 15:35 Aitor escribió
   «estoy escuchando truenos no muy cercanos», en Bermeo y sin lluvia. El
   mapa de AEMET de esa hora pone la descarga más cercana a 3,7 km de
   Bermeo (43,439 / -2,761). O sea que aquel día me equivoqué al situar
   los truenos en Navarra: los tenía encima. Él ya me lo dijo entonces
   —«no puede ser de Navarra, no se escucha hombre»—.

   EL LÍMITE, Y HAY QUE DECIRLO SIEMPRE: esto NO es tiempo real. Cada
   mapa cubre una hora entera y se publica después de terminarla, así que
   una descarga puede tardar más de una hora en aparecer. Sirve para
   saber lo que YA ha caído —de dónde venía la tormenta de anoche, si
   está descargando la zona esta mañana—, no para enterarse del rayo que
   está cayendo ahora mismo. Para eso siguen estando el radar, el mapa en
   vivo de Blitzortung y, sobre todo, los ojos y los oídos: si se oye el
   trueno, ya estás dentro del alcance.

   Fuente: © AEMET. Autorizado el uso citando a AEMET como autora.
   ══════════════════════════════════════════════════════════════════════ */

/* A menos de esto se considera que la tormenta está ENCIMA del
   emplazamiento. La regla del 30/30 pone el corte en 10 km (30 segundos
   entre relámpago y trueno); aquí se usan 15 porque la posición que da
   una imagen de 0,35 km por píxel no es un punto exacto y porque el
   error tiene que caer del lado seguro. */
const RAYO_ENCIMA = 15;
/** Hasta aquí la tormenta es de la zona: se ve, se oye y puede venir. */
const RAYO_CERCA  = 30;
/** Caja que se recorta de la imagen para mirar alrededor de un punto. */
const RAYO_RADIO  = 60;

const Rayos = {
  cat: null,          // catálogo de AEMET (qué horas hay publicadas)
  catT: 0,            // cuándo se pidió
  marcos: new Map(),  // 'fichero|caja' -> descargas ya leídas

  /** El catálogo, con cinco minutos de memoria. */
  async catalogo() {
    if (this.cat && Date.now() - this.catT < 5 * 60e3) return this.cat;
    const r = await fetch('/rayos');
    const d = await r.json().catch(() => null);
    if (!r.ok || !d || d.error) {
      throw new Error(d?.reason || `AEMET no ha dado el catálogo de rayos (${r.status})`);
    }
    this.cat = d; this.catT = Date.now();
    return d;
  },

  /** ¿Península o Canarias? Se decide con los límites que da AEMET. */
  ambito(cat, place) {
    for (const k of ['PB', 'CN']) {
      const b = cat.ambitos?.[k]?.bounds;
      if (b && place.lon >= b.lon0 && place.lon <= b.lon1
            && place.lat >= b.lat0 && place.lat <= b.lat1
            && cat.ambitos[k].marcos?.length) return k;
    }
    return null;
  },

  /** Caja en grados alrededor de uno o varios puntos, con margen en km. */
  caja(puntos, km) {
    const lats = puntos.map(p => p.lat), lons = puntos.map(p => p.lon);
    const dLat = km / 111.32;
    const cos = Math.cos((Math.max(...lats) + Math.min(...lats)) / 2 * Math.PI / 180);
    const dLon = km / (111.32 * Math.max(0.2, cos));
    return {
      lat0: Math.min(...lats) - dLat, lat1: Math.max(...lats) + dLat,
      lon0: Math.min(...lons) - dLon, lon1: Math.max(...lons) + dLon,
    };
  },

  /* ── Leer una hora ───────────────────────────────────────────────────
     Devuelve las descargas de ese mapa que caen dentro de la caja, cada
     una con su posición y su polaridad. Los píxeles pegados se juntan en
     una sola descarga: el símbolo que dibuja AEMET ocupa unos 2x2. */
  async leer(amb, marco, caja, cat) {
    const clave = `${marco.f}|${caja.lat0.toFixed(2)},${caja.lon0.toFixed(2)},`
                + `${caja.lat1.toFixed(2)},${caja.lon1.toFixed(2)}`;
    if (this.marcos.has(clave)) return this.marcos.get(clave);

    const B = cat.ambitos[amb].bounds;
    const my = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360));
    const y0 = my(B.lat0), y1 = my(B.lat1);

    const r = await fetch(`/rayos?f=${encodeURIComponent(marco.f)}`);
    if (!r.ok) throw new Error(`AEMET no ha dado el mapa de las ${horaHM(marco.desde)} (${r.status})`);
    const blob = await r.blob();

    // El tamaño real de la imagen se lee de la propia imagen: si AEMET
    // cambia la resolución, esto sigue cuadrando solo.
    const entera = await createImageBitmap(blob);
    const W = entera.width, H = entera.height;
    const aX = lon => (lon - B.lon0) / (B.lon1 - B.lon0) * W;
    const aY = lat => (y1 - my(lat)) / (y1 - y0) * H;

    const sx = clamp(Math.floor(aX(caja.lon0)), 0, W - 1);
    const ex = clamp(Math.ceil(aX(caja.lon1)),  1, W);
    const sy = clamp(Math.floor(aY(caja.lat1)), 0, H - 1);
    const ey = clamp(Math.ceil(aY(caja.lat0)),  1, H);
    const sw = Math.max(1, ex - sx), sh = Math.max(1, ey - sy);

    const trozo = await createImageBitmap(blob, sx, sy, sw, sh);
    entera.close?.();
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(trozo, 0, 0);
    trozo.close?.();
    const px = cx.getImageData(0, 0, sw, sh).data;

    // Manchas pegadas = una descarga. Recorrido plano, sin recursión.
    const visto = new Uint8Array(sw * sh);
    const descargas = [];
    const pila = [];
    for (let i0 = 0; i0 < sw * sh; i0++) {
      if (visto[i0] || px[i0 * 4 + 3] <= 50) continue;
      pila.length = 0; pila.push(i0); visto[i0] = 1;
      let n = 0, sX = 0, sY = 0, rojo = 0, azul = 0;
      while (pila.length) {
        const i = pila.pop();
        const x = i % sw, y = (i - x) / sw;
        n++; sX += x; sY += y;
        // AEMET dibuja las negativas en azul y las positivas en rojo.
        // Se compara canal contra canal en vez de buscar un color exacto,
        // que cambia con la resolución y con el antialias.
        if (px[i * 4] > px[i * 4 + 2]) rojo++; else azul++;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= sw || yy >= sh) continue;
          const j = yy * sw + xx;
          if (!visto[j] && px[j * 4 + 3] > 50) { visto[j] = 1; pila.push(j); }
        }
      }
      const gx = sx + sX / n + 0.5, gy = sy + sY / n + 0.5;
      descargas.push({
        lon: B.lon0 + gx / W * (B.lon1 - B.lon0),
        lat: (2 * Math.atan(Math.exp(y1 - gy / H * (y1 - y0))) - Math.PI / 2) * 180 / Math.PI,
        pos: rojo > azul,
      });
    }

    this.marcos.set(clave, descargas);
    return descargas;
  },

  /* ── Qué ha caído alrededor de un punto ──────────────────────────── */
  async cerca(place, { horas = 6, radio = RAYO_RADIO } = {}) {
    const cat = await this.catalogo();
    const amb = this.ambito(cat, place);
    if (!amb) return { fuera: true, fuente: cat.fuente };

    const todos = cat.ambitos[amb].marcos;
    const marcos = todos.slice(-horas);
    const caja = this.caja([place], radio);

    const filas = [];
    for (const m of marcos) {
      const d = await this.leer(amb, m, caja, cat);
      const conD = d.map(x => ({ ...x, km: kmEntre(place, x) }))
                    .filter(x => x.km <= radio)
                    .sort((a, b) => a.km - b.km);
      filas.push({
        desde: m.desde, hasta: m.hasta,
        n: conD.length,
        encima: conD.filter(x => x.km <= RAYO_ENCIMA).length,
        cerca:  conD.filter(x => x.km <= RAYO_CERCA).length,
        pos:    conD.filter(x => x.pos).length,
        masCerca: conD[0] || null,
      });
    }

    const conAlgo = filas.filter(f => f.n);
    const ultima  = conAlgo[conAlgo.length - 1] || null;
    return {
      fuente: cat.fuente, licencia: cat.licencia, pagina: cat.pagina,
      radio, filas, ultima,
      total: filas.reduce((a, f) => a + f.n, 0),
      // Hasta cuándo llega lo publicado. Con esto se dice el retraso real
      // en pantalla en vez de poner un número inventado.
      hasta: todos[todos.length - 1]?.hasta || null,
      horasCatalogo: todos.length,
    };
  },

  /* ── Por dónde pasó la tormenta ───────────────────────────────────
     La pregunta de Aitor no es «¿qué tiempo hace aquí?», es «¿a cuál de
     mis sitios mando gente?». Y detrás de una noche de rayos vienen las
     averías de suministro: el rayo tumba la red, la compañía no repone y
     hay que subir un grupo electrógeno por la pista.

     Se leen las horas de una sola vez para TODOS los emplazamientos
     guardados, recortando una caja que los cubra a todos: una lectura
     por hora, no una por torre. */
  async sobreTorres(torres, { horas = 12, radio = RAYO_CERCA } = {}) {
    if (!torres?.length) return null;
    const cat = await this.catalogo();
    const amb = this.ambito(cat, torres[0]);
    if (!amb) return null;

    const marcos = cat.ambitos[amb].marcos.slice(-horas);
    const caja = this.caja(torres, radio + 5);
    const porTorre = torres.map(t => ({ t, n: 0, encima: 0, masCerca: null, cuando: null }));

    for (const m of marcos) {
      const d = await this.leer(amb, m, caja, cat);
      if (!d.length) continue;
      for (const fila of porTorre) {
        for (const x of d) {
          const km = kmEntre(fila.t, x);
          if (km > radio) continue;
          fila.n++;
          if (km <= RAYO_ENCIMA) fila.encima++;
          if (!fila.masCerca || km < fila.masCerca.km) fila.masCerca = { ...x, km };
          fila.cuando = m;                       // la última hora con descargas
        }
      }
    }

    return {
      desde: marcos[0]?.desde || null,
      hasta: marcos[marcos.length - 1]?.hasta || null,
      radio,
      tocadas: porTorre.filter(f => f.n).sort((a, b) => b.n - a.n),
      total: porTorre.reduce((a, f) => a + f.n, 0),
    };
  },
};

/** Hora corta de un instante ISO, en la hora del sitio. */
function horaHM(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

/** Hora con el día delante cuando no es hoy. Una ventana de doce horas
 *  cruza la medianoche, y «entre las 19:00 y las 07:00» sin decir de qué
 *  día se lee mal. Aquí leer mal es mandar a alguien a un sitio. */
function diasAtras(d) {
  const hoy = new Date();
  return Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
                   - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
}

function horaDia(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const dias = diasAtras(d);
  const h = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return dias === 0 ? `hoy a las ${h}` : dias === 1 ? `ayer a las ${h}`
       : `el ${d.toLocaleDateString('es', { day: '2-digit', month: 'short' })} a las ${h}`;
}

/** «las 15:00 y las 16:00» si las dos son de hoy; con el día delante si
 *  no. Una ventana de doce horas cruza la medianoche y «entre las 19:00
 *  y las 07:00» no dice de qué día es cada una. */
function rangoHoras(a, b) {
  const da = new Date(a), db = new Date(b);
  if (isNaN(da) || isNaN(db)) return '—';
  const hm = d => d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  if (diasAtras(da) === 0 && diasAtras(db) === 0) return `las ${hm(da)} y las ${hm(db)}`;
  return `${horaDia(a)} y ${horaDia(b)}`;
}

/** Cuánto hace, en palabras, de un instante que ya pasó. */
function haceCuanto(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (!isFinite(min)) return '';
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `hace ${h} h ${m} min` : `hace ${h} h`;
}


/* ---------- Pestaña Rayos ────────────────────────────────────────────
   Dos cosas distintas, y separadas a propósito porque contestan a
   preguntas distintas:

     1. LO QUE HA CAÍDO. Descargas medidas por la red de AEMET, hora a
        hora, con su distancia a este emplazamiento y a los guardados.
        Es dato, no previsión. Va con retraso y el retraso se dice.
     2. LO QUE ESTÁ CAYENDO. El mapa en vivo de Blitzortung, que es de
        voluntarios y no es oficial, pero va al minuto.

   Lo peor que podría hacer esta pantalla es mezclarlas: leer «0 rayos»
   de un mapa que llega con una hora de retraso y entenderlo como «no
   está cayendo nada ahora». Por eso cada bloque dice de cuándo es.  */

function renderRayos() {
  pintarRayosVivo();
  cargarRayosAemet();
}

/** El mapa en vivo. Se carga solo al entrar en la pestaña. */
function pintarRayosVivo() {
  const el = $('#rayos');
  if (!el) return;
  const p = S.place || { lat: 43.42, lon: -2.72, name: 'Bermeo' };
  const url = `https://map.blitzortung.org/#8/${p.lat.toFixed(3)}/${p.lon.toFixed(3)}`;
  if (el.dataset.en === url) return;          // ya está en ese sitio
  el.dataset.en = url;
  el.innerHTML = `<iframe src="${url}" loading="lazy" referrerpolicy="no-referrer"
      title="Rayos detectados cerca de ${esc(p.name || '')}"></iframe>`;
}

/* Lo medido por AEMET. Se pide una vez por emplazamiento y se guarda en
   S.rayos, porque también lo usa la ficha de Torre. */
async function cargarRayosAemet({ forzar = false } = {}) {
  const dst = $('#rayosAemet');
  if (!dst || !S.place) return;

  const clave = `${S.place.lat.toFixed(3)},${S.place.lon.toFixed(3)}`;
  if (!forzar && S.rayos?.clave === clave && Date.now() - S.rayos.t < 10 * 60e3) {
    pintarRayosAemet(); return;
  }

  dst.innerHTML = `<p class="note">Leyendo las descargas de las últimas horas…</p>`;
  try {
    const r = await Rayos.cerca(S.place, { horas: 6 });
    /* Los emplazamientos guardados (el ♥), no S.torres: esa lista solo
       existe si él ha entrado en la pestaña «Mis torres» en esta sesión,
       y este bloque tiene que salir igual entrando directo a Rayos. */
    const torres = (S.saved || []).filter(p => has(p?.lat) && has(p?.lon));
    let anoche = null;
    try { anoche = await Rayos.sobreTorres(torres, { horas: 12 }); }
    catch { anoche = null; }                    // lo de las torres es extra: si falla, no arrastra
    S.rayos = { clave, t: Date.now(), d: r, anoche, error: null };
  } catch (e) {
    S.rayos = { clave, t: Date.now(), d: null, anoche: null, error: String(e.message || e) };
  }
  pintarRayosAemet();
  // La ficha de Torre lleva el aviso corto: que se entere del cambio.
  if (S.data) seguro('rayos en torre', pintarRayosTorre);
  if (S.data) seguro('antes de salir', pintarAntesDeSalir);

  /* Y de paso, el cuaderno. Va al final y sin `await`: si falla, él ni
     se entera, porque esto no le sirve HOY para nada. */
  apuntarParaCalibrar(S.rayos);
}

/* ── EL CUADERNO DE CALIBRADO ────────────────────────────────────────
   Idea de la sesión de comparativas, 27-08-2026, y con un caso detrás:
   en el punto exacto donde cayó la única descarga de ese día —junto a
   Zarautz— y a la hora en que cayó, había **CAPE 510 con la tapa en 50**.
   Por debajo del umbral de 700: la regla NO habría saltado esa hora.

   Eso NO es motivo para bajar el umbral. Un caso no es una regla, y ese
   error ya se cometió dos veces el mismo día. Lo que hace falta es un
   montón de casos MEDIDOS en su zona, y para tenerlos hay que empezar a
   guardarlos.

   Aprovecha que la app YA lee las descargas de AEMET cada vez que él
   abre la pestaña Rayos: manda al servidor dónde y cuándo cayeron, y
   allí se apunta lo que decían los modelos en ese punto y esa hora.

   NO DECIDE NADA. No avisa, no cambia el semáforo, no toca umbrales. En
   dos semanas habrá un histograma con el que decidir de verdad. */
function apuntarParaCalibrar(R) {
  try {
    if (!R || R.error || !R.d) return;
    const descargas = [];

    /* Una por marco horario: la más cercana de cada hora. El servidor ya
       agrupa por celda de 0,05°, así que mandar más sería gastar por
       gusto — dos chispas de la misma hora y el mismo sitio tienen el
       mismo CAPE. */
    for (const f of R.d.filas || []) {
      const m = f.masCerca;
      if (m && has(m.lat) && has(m.lon) && f.desde) {
        descargas.push({ lat: m.lat, lon: m.lon, cuando: f.desde });
      }
    }
    /* Y las de alrededor de sus emplazamientos, que son las que de verdad
       importan para SU zona. */
    for (const t of R.anoche?.tocadas || []) {
      const m = t?.masCerca;
      /* `t.cuando` es el MARCO horario de AEMET (el objeto con `desde`),
         no una fecha. Lo comprobé leyendo `sobreTorres`, que es donde se
         rellena — al primer intento puse `t.desde` y no existe. */
      const cuando = t?.cuando?.desde;
      if (m && has(m.lat) && has(m.lon) && cuando) {
        descargas.push({ lat: m.lat, lon: m.lon, cuando });
      }
    }
    if (!descargas.length) return;

    fetch('/api/calibrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descargas }),
    }).catch(() => {});      // en el monte sin línea esto no puede molestar
  } catch { /* el cuaderno nunca puede romper la pantalla de rayos */ }
}

function pintarRayosAemet() {
  const dst = $('#rayosAemet');
  if (!dst) return;
  /* Y la pestaña Rayos, igual que la ficha: las descargas son del sitio
     que se ha preguntado, no del que estuviera antes. */
  const R = deEsteSitio(S.rayos);

  /* Un fallo aquí NO puede dejar un hueco en blanco: en esta app un
     hueco callado se lee como «aquí no pasa nada», y aquí «nada» sería
     «no han caído rayos». */
  if (!R || R.error) {
    dst.innerHTML = `<p class="note" data-s="nd"><b>No he podido leer las descargas de AEMET.</b>
      ${esc(R?.error || 'sin respuesta')}. <b>Eso no quiere decir que no haya rayos</b>:
      quiere decir que no lo sé. Mira el mapa en vivo de aquí abajo y el radar.</p>`;
    return;
  }
  if (R.d?.fuera) {
    dst.innerHTML = `<p class="note">La red de AEMET no cubre este punto.</p>`;
    return;
  }

  const d = R.d;
  const retraso = d.hasta ? Math.round((Date.now() - new Date(d.hasta)) / 60000) : null;

  // — Titular: lo último que ha caído —
  let cab;
  if (!d.total) {
    cab = `<div class="ray__t" data-s="go"><b>Ni una descarga</b> a menos de ${d.radio} km
      en las últimas ${d.filas.length} horas publicadas.</div>`;
  } else {
    const u = d.ultima;
    const nivel = u.encima ? 'no' : u.cerca ? 'warn' : 'go';
    const donde = u.masCerca
      ? `la más cercana a <b>${kmTxt(u.masCerca.km)} km</b>`
      : '';
    cab = `<div class="ray__t" data-s="${nivel}">
      <b>${u.n} descarga${u.n === 1 ? '' : 's'}</b> a menos de ${d.radio} km
      entre ${rangoHoras(u.desde, u.hasta)} — ${donde}.
      ${u.encima ? `<b>${u.encima} de ellas a menos de ${RAYO_ENCIMA} km: la tormenta pasó por encima.</b>` : ''}
      ${u.pos ? `<span class="dim">${u.pos} positiva${u.pos === 1 ? '' : 's'} (menos frecuentes y unas dos veces más intensas).</span>` : ''}
    </div>`;
  }

  // — Hora a hora —
  const filas = d.filas.map(f => {
    const nivel = f.encima ? 'no' : f.cerca ? 'warn' : f.n ? 'go' : '';
    return `<tr${nivel ? ` data-s="${nivel}"` : ''}>
      <td>${horaHM(f.desde)}–${horaHM(f.hasta)}</td>
      <td class="num">${f.n || '—'}</td>
      <td class="num">${f.masCerca ? kmTxt(f.masCerca.km) + ' km' : '—'}</td>
      <td>${f.encima ? 'encima' : f.cerca ? 'en la zona' : f.n ? 'lejos' : ''}</td>
    </tr>`;
  }).join('');

  // — Por dónde pasó, sobre sus emplazamientos —
  let torres = '';
  const A = R.anoche;
  if (A && A.tocadas?.length) {
    torres = `<div class="ray__tor">
      <h3 class="ch">Por dónde pasó · tus emplazamientos</h3>
      <p class="note">Descargas a menos de ${A.radio} km entre ${rangoHoras(A.desde, A.hasta)}.
        Detrás de una noche así vienen las averías de
        suministro: el rayo tumba la red y hay que subir el grupo.</p>
      <ul class="ray__l">${A.tocadas.map(f => `<li data-s="${f.encima ? 'no' : 'warn'}">
        <b>${esc(f.t.name)}</b> — ${f.n} descarga${f.n === 1 ? '' : 's'},
        la más cercana a ${kmTxt(f.masCerca.km)} km${f.encima
          ? `, ${f.encima} a menos de ${RAYO_ENCIMA} km` : ''}
        <span class="dim">(última entre ${rangoHoras(f.cuando.desde, f.cuando.hasta)})</span>
      </li>`).join('')}</ul></div>`;
  } else if (A) {
    torres = `<div class="ray__tor"><h3 class="ch">Por dónde pasó · tus emplazamientos</h3>
      <p class="note">Ninguno de tus ${(S.saved || []).length} emplazamientos ha tenido
      descargas a menos de ${A.radio} km entre ${rangoHoras(A.desde, A.hasta)}.</p></div>`;
  }

  dst.innerHTML = cab + `
    <table class="ray__tb"><thead><tr>
      <th>Hora (mapa de AEMET)</th><th class="num">Descargas</th>
      <th class="num">La más cercana</th><th></th>
    </tr></thead><tbody>${filas}</tbody></table>
    <p class="note"><b>Esto va con retraso, y hay que contar con él.</b>
      Cada mapa cubre una hora entera y AEMET lo publica al terminarla:
      lo último que hay aquí llega hasta las <b>${d.hasta ? horaHM(d.hasta) : '—'}</b>${retraso !== null ? `, o sea ${haceCuanto(d.hasta)}` : ''}.
      De lo que haya caído después, esta tabla <b>no sabe nada todavía</b>.
      Para eso, el mapa en vivo de aquí abajo, el radar, y el oído: si se oye
      el trueno, ya estás dentro del alcance.</p>
    ${torres}
    <p class="note dim">Fuente: ${esc(d.fuente)}. ${esc(d.licencia || '')}
      Incluye nube-tierra e intranube.</p>`;
}

/* ── El aviso corto, en la pantalla donde decide ──────────────────────
   Va aparte del aviso de la tapa a propósito, y no se mezclan las
   palabras: la tapa (CAPE e inhibición) dice «PUEDE romper» y sale del
   modelo; esto dice «HA CAÍDO» y sale de una medida. Aitor distingue
   perfectamente las dos cosas y juntarlas les quitaría valor a las dos.

   Y hay un tercer estado que también va aparte, que es el que engaña:
   «todavía no lo sé». El mapa de AEMET se publica por horas cerradas,
   así que siempre hay un rato reciente del que no hay dato. Un mapa
   limpio de esa franja NO significa que no esté cayendo.              */

/* Cuánto tiempo sigue contando una descarga para el semáforo. La regla
   del 30/30 dice media hora desde el último trueno; aquí se estira a 90
   minutos porque el mapa viene por horas cerradas y con retraso: dentro
   de esa hora no se sabe el minuto. Pasado ese rato la descarga sigue
   contándose y diciéndose, pero como historia, no como veto. */
const RAYO_VIGENTE = 90 * 60e3;
/** Y hasta aquí se sigue avisando de que hay tormenta por la zona. */
const RAYO_RECIENTE = 3 * 3600e3;

/* ═══════════════════════════════════════════════════════════════════
   LA PUERTA DE «¿ESTO ES DE ESTE EMPLAZAMIENTO?»
   ───────────────────────────────────────────────────────────────────
   El 31-08-2026 se arregló que la comparativa de un sitio no se usara en
   otro: *«que no me ponga en mis sitios una cosa y otra en ahora»*. Pero
   se arregló SOLO en la comparativa. El barrido del 01-09 encontró la
   misma cosa en cuatro estados más, y uno de ellos es el peor posible:
   **los rayos**, que son su único veto.

   Cada uno de estos estados tarda en llegar y se guarda aparte:

     S.rayos       las descargas de AEMET      (sello: `clave`)
     S.discrepa    el desacuerdo entre modelos (sello: `clave`)
     S.comparativa los modelos de ese sitio    (sello: `_sitio`)
     S.diariaMulti los 10 días de ese sitio    (no tenía sello: se le pone)

   Si cambia de emplazamiento mientras uno de ellos está en camino, lo
   que se pinta es lo del sitio ANTERIOR. Con los rayos eso significa
   verlos donde no han caído — o, peor, NO verlos donde sí.

   Por eso ya no lo decide cada pintado por su cuenta: se pregunta aquí.
   Y quien recibe `null` NO pinta el dato viejo: dice que está mirando.  */
function deEsteSitio(est, place = null) {
  const p = place ?? S.place;
  if (!est || !p) return null;
  const aqui = `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
  const suyo = est.clave ?? est._sitio ?? est.sitio ?? null;
  /* Sin sello NO se da por bueno: un estado sin marcar es justo el que
     no se puede comprobar, y darlo por válido es volver al fallo. */
  if (suyo == null) return null;
  return String(suyo) === aqui ? est : null;
}

/* ═══ ANTES DE SALIR ══════════════════════════════════════════════════
   Suyo, 06-09-2026 desde Calpe, después de contar cómo trabaja de verdad:
   el 90 % de las salidas son a la caseta, con el 4x4 por pista y a veces
   un grupo a remolque; los contadores y las CGP con fusibles están fuera,
   en postes a dos metros; hace guardias y decide a quién manda. Y esto,
   textual: *«podemos matar a un técnico si enviamos con CAPE, viento o
   lluvia a trabajar»* · *«si va y le pilla con un fusible en el poste un
   rayo o una racha o lluvia se electrocuta, eso no puede ser»*.

   Lo que le faltaba no eran datos —la app ya lee las descargas de AEMET,
   la estación más cercana y siete modelos— sino tenerlos JUNTOS en el
   momento de mandar a alguien, y una regla que no se pueda esquivar:
   **con uno en rojo, sale en rojo**, aunque los otros digan verde.

   Cuatro renglones, en el orden que él dio (1 lluvia, 2 rayos, 3 rachas):
     · Rayos MEDIDOS por AEMET: la única medida que ya pisa al modelo.
     · Lo MEDIDO en la estación más cercana: racha y lluvia de la última
       hora, con su hora. Una medida de hace más de dos horas no vale
       como «ahora»: se dice que es vieja.
     · Las 3 horas siguientes pasadas por `assess()`, la misma regla del
       semáforo, con la ráfaga peor de cualquier modelo (`peorRacha`) y
       la lluvia peor de la comparativa.
     · El radar: aquí no se lee el eco, así que se dice y se manda a la
       pestaña. Un hueco callado sería el fallo de siempre.

   Lo que NO hace: no decide. Describe, con cifras y su hora, y él manda.
   Y 'nd' no se esconde nunca detrás de un verde: sin dato es sin dato.
   Solo en SUS emplazamientos, como el veredicto: sus listones son de
   sus sitios.                                                          */
const SALIR_HORAS = 3;
const SALIR_MEDIDA_VIEJA = 2 * 3600e3;

/* Rojo si hay rojo; si no, sin dato; si no, ámbar; si no, verde. Distinto
   de `worst()`, donde el «sin dato» pisa al rojo: aquí un rojo medido no
   puede quedar tapado por un hueco de otra fila. */
function estadoSalir(xs) {
  if (xs.includes('no')) return 'no';
  if (xs.includes('nd')) return 'nd';
  if (xs.includes('warn')) return 'warn';
  return 'go';
}

function antesDeSalir() {
  const p = S.place;
  if (!p || !S.data?.hours?.length) return null;
  const thr = S.thr || DEFAULT_THR;
  const filas = [];
  const hh = h => `${String(h.date.getHours()).padStart(2, '0')}:00`;

  /* 1 · Rayos medidos */
  {
    const R = deEsteSitio(S.rayos);
    let s = 'nd', txt;
    if (!R) txt = 'descargas de AEMET todavía no leídas';
    else if (R.error) txt = `no se han podido leer las descargas de AEMET (${esc(String(R.error).slice(0, 50))}). No saberlo no es que no caiga nada`;
    else {
      const d = R.d, u = d?.ultima;
      const hasta = d?.hasta ? ` — medido hasta las ${horaHM(d.hasta)}, ${haceCuanto(d.hasta)}` : '';
      if (!u) { s = 'go'; txt = `sin descargas a menos de ${d?.radio ?? RAYO_RADIO} km en las últimas ${d?.horasCatalogo ?? 6} h${hasta}`; }
      else {
        const edad = Date.now() - new Date(u.hasta).getTime();
        const cuando = `entre ${rangoHoras(u.desde, u.hasta)} (${haceCuanto(u.hasta)})`;
        const masCerca = u.masCerca ? `, la más cercana a ${kmTxt(u.masCerca.km)} km` : '';
        if (u.encima > 0 && edad <= RAYO_VIGENTE) {
          s = 'no'; txt = `<b>${u.encima} descarga${u.encima === 1 ? '' : 's'} a menos de ${RAYO_ENCIMA} km</b> ${cuando}${masCerca}`;
        } else if (u.cerca > 0 && edad <= RAYO_RECIENTE) {
          s = 'warn'; txt = `${u.cerca} descarga${u.cerca === 1 ? '' : 's'} a menos de ${RAYO_CERCA} km ${cuando}${masCerca} — tormenta por la zona`;
        } else if (edad <= RAYO_RECIENTE) {
          s = 'go'; txt = `descargas solo lejos${masCerca} ${cuando}`;
        } else {
          s = 'go'; txt = `la última descarga en ${d.radio} km fue ${haceCuanto(u.hasta)}; nada desde entonces${hasta}`;
        }
      }
    }
    filas.push({ k: 'Rayos medidos', s, txt });
  }

  /* 2 · Lo medido en la estación más cercana */
  {
    const O = S.obs && S.obs.clave === key(p) ? S.obs : null;
    let s = 'nd', txt;
    const edadDe = x => { const t = x.medidoEn ? Date.parse(x.medidoEn) : NaN; return Number.isFinite(t) ? Date.now() - t : null; };
    const cuando = x => { const t = x.medidoEn ? Date.parse(x.medidoEn) : NaN; return Number.isFinite(t) ? `a las ${horaHM(x.medidoEn)}` : 'sin hora'; };
    const fresca = x => { const e = edadDe(x); return e !== null && e <= SALIR_MEDIDA_VIEJA; };
    const donde = x => `${esc(x.nombre)} (a ${kmTxt(Number(x.km))} km${x.alturaAnemometro ? `, racha a ${x.alturaAnemometro} m` : ''}, ${cuando(x)})`;
    if (!O) txt = 'estaciones cercanas todavía no consultadas';
    else if (O.error) txt = `no he podido preguntar a las estaciones (${esc(O.error.slice(0, 50))}). Que no haya medida no es que no haya viento`;
    else {
      const es = O.es || [];
      const conRacha = es.filter(x => has(x.racha)), conLluvia = es.filter(x => has(x.lluvia));
      if (!conRacha.length && !conLluvia.length) txt = 'ninguna estación cercana mide racha ni lluvia';
      else {
        const estados = [], partes = [];
        const frescasR = conRacha.slice(0, 3).filter(fresca);
        if (frescasR.length) {
          const peor = frescasR.reduce((a, b) => (b.racha > a.racha ? b : a));
          const st = peor.racha >= listonRafaga().no ? 'no' : peor.racha >= listonRafaga().warn ? 'warn' : 'go';
          estados.push(st);
          partes.push(`${st === 'go' ? '' : '<b>'}racha ${wtxt(peor.racha, true)}${st === 'go' ? '' : '</b>'} en ${donde(peor)}`);
        } else if (conRacha.length) {
          estados.push('nd');
          partes.push(`la racha más reciente es ${cuando(conRacha[0])} en ${esc(conRacha[0].nombre)}: vieja, no vale como «ahora»`);
        } else { estados.push('nd'); partes.push('sin medida de racha cerca'); }
        const frescasL = conLluvia.slice(0, 3).filter(fresca);
        if (frescasL.length) {
          const peor = frescasL.reduce((a, b) => (b.lluvia > a.lluvia ? b : a));
          const st = peor.lluvia >= thr.rainNo ? 'no' : peor.lluvia >= thr.rainWarn ? 'warn' : 'go';
          estados.push(st);
          partes.push(`${st === 'go' ? '' : '<b>'}${mmTxt(peor.lluvia)} mm de lluvia${st === 'go' ? '' : '</b>'} en ${donde(peor)}`);
        } else if (conLluvia.length) {
          estados.push('nd');
          partes.push(`la lluvia más reciente es ${cuando(conLluvia[0])}: vieja`);
        } else { estados.push('nd'); partes.push('sin pluviómetro cerca'); }
        s = estadoSalir(estados);
        txt = partes.join(' · ');
      }
    }
    filas.push({ k: 'Medido en la estación más cercana', s, txt });
  }

  /* 3 · Las horas siguientes, con la regla del semáforo y lo peor de cualquier modelo */
  {
    const hs = S.data.hours.slice(0, SALIR_HORAS);
    const estados = [], motivos = [];
    for (const h of hs) {
      const a = assess(h, thr, S.perfil, p);
      estados.push(a.st);
      for (const r of a.reasons) if (r.s !== 'go') motivos.push({ s: r.s, txt: `${hh(h)} · ${r.txt}` });
    }
    /* La lluvia que ve otro modelo y el tuyo no (la ráfaga ya la mira `assess` vía `peorRacha`). */
    const C = deEsteSitio(S.comparativa, p)?.hourly;
    if (C?.time) {
      C.__porHora ??= new Map(C.time.map((x, i) => [String(x).slice(0, 13), i]));
      let peor = null;
      for (const h of hs) {
        const i = C.__porHora.get(String(h.t).slice(0, 13));
        if (i === undefined) continue;
        for (const m of COMPARAR) {
          if (m.om === 'best_match') continue;
          const mm = C[`precipitation_${m.om}`]?.[i];
          if (has(mm) && (!peor || mm > peor.mm)) peor = { mm, quien: m.name, h };
        }
      }
      const propio = Math.max(0, ...hs.map(h => (has(h.prec) ? h.prec : 0)));
      if (peor && peor.mm >= thr.rainWarn && peor.mm > propio + 0.05) {
        const st = peor.mm >= thr.rainNo ? 'no' : 'warn';
        estados.push(st);
        motivos.push({ s: st, txt: `${hh(peor.h)} · ${peor.quien} ve ${mmTxt(peor.mm)} mm/h donde tu modelo da ${mmTxt(propio)}` });
      }
    }
    const orden = { no: 0, nd: 1, warn: 2, go: 3 };
    motivos.sort((a, b) => orden[a.s] - orden[b.s]);
    const s = estadoSalir(estados);
    const txt = motivos.length
      ? motivos.slice(0, 4).map(m => (m.s === 'no' ? `<b>${m.txt}</b>` : m.txt)).join(' · ')
      : `nada llega a tus listones de ${hh(hs[0])} a ${hh(hs[hs.length - 1])}, ni en tu modelo ni en los otros`;
    filas.push({ k: `Las ${SALIR_HORAS} horas siguientes`, s, txt });
  }

  return { estado: estadoSalir(filas.map(f => f.s)), filas, cuando: Date.now() };
}

function pintarAntesDeSalir() {
  const el = $('#vSalir');
  if (!el) return;
  const suyo = !!(S.place && (S.saved || []).some(p => key(p) === key(S.place)));
  if (!suyo || !S.data?.hours?.length) { el.hidden = true; el.innerHTML = ''; return; }

  /* Lo que falte se pide, una vez y sin bloquear: cada carga repinta esto al llegar. */
  const P = pintarAntesDeSalir;
  if (!deEsteSitio(S.rayos) && !P._rayos) {
    P._rayos = true;
    Promise.resolve().then(() => cargarRayosAemet()).catch(() => {}).finally(() => { P._rayos = false; });
  }
  if (!(S.obs && S.obs.clave === key(S.place)) && !P._obs) {
    P._obs = true;
    Promise.resolve().then(() => cargarObservacion()).catch(() => {}).finally(() => { P._obs = false; });
  }

  const A = antesDeSalir();
  if (!A) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.dataset.s = A.estado;
  el.innerHTML = `<b class="acc__k">Antes de salir · ahora y ${SALIR_HORAS} h
      <span class="salir__st" data-s="${A.estado}">${VT[A.estado]}</span></b>
    <ul class="acc__l salir__l">
      ${A.filas.map(f => `<li data-s="${f.s}"><span class="salir__k">${esc(f.k)}:</span> ${f.txt}</li>`).join('')}
      <li data-s="nd"><span class="salir__k">Radar:</span> el eco de ahora no se lee aquí —
        <button type="button" class="salir__ir" data-ir="radar">míralo en Radar</button> antes de salir</li>
    </ul>
    <p class="acc__nc acc__nc--suave">Con uno en rojo, sale en rojo. Cifras y medidas con su hora; la decisión es tuya.</p>`;
  el.querySelector('[data-ir]')?.addEventListener('click', () => { try { setView('radar'); } catch {} });
}

function pintarRayosTorre() {
  const el = $('#vRayos');
  if (!el) return;
  const R = deEsteSitio(S.rayos);
  const u = R?.d?.ultima;

  /* ── AQUÍ NO SE ESCONDE NADA ──────────────────────────────────────
     Antes, esta única línea juntaba CUATRO cosas distintas y las
     trataba igual: no se ha preguntado, no se ha podido leer, no ha
     caído nada, y ha caído lejos. Las cuatro acababan en un bloque
     oculto. O sea que si AEMET no contestaba, el sitio donde siempre
     pone «Rayos medidos por AEMET» se quedaba en blanco — y un blanco,
     aquí, se lee como «no ha caído nada». En la pestaña Rayos sí se
     decía, pero él está mirando ÉSTA. (Barrido del 01-09-2026.)      */
  if (!R) {
    el.hidden = false;
    el.innerHTML = `<p class="note">Mirando las descargas de AEMET de este emplazamiento…</p>`;
    return;
  }
  if (R.error) {
    el.hidden = false;
    el.innerHTML = `<p class="note note--avisa"><b>No he podido leer los rayos de AEMET</b> `
      + `(${esc(String(R.error).slice(0, 60))}). <b>Eso no quiere decir que no haya caído nada:`
      + ` quiere decir que no lo sé.</b> Mira el mapa en vivo de la pestaña Rayos y el radar.</p>`;
    return;
  }
  if (!u || !u.cerca) { el.hidden = true; el.innerHTML = ''; return; }

  const edad = Date.now() - new Date(u.hasta);
  const vigente  = edad <= RAYO_VIGENTE;
  const reciente = edad <= RAYO_RECIENTE;
  const encima   = u.encima > 0;

  // Ni vigente ni reciente: pasó y ya está. Que no ensucie la ficha de
  // decisión — para eso está la pestaña Rayos, con su tabla entera.
  if (!reciente) { el.hidden = true; el.innerHTML = ''; return; }

  const nivel = encima && vigente ? 'no' : 'warn';

  /* — Y AQUÍ SÍ SE MANDA SOBRE EL SEMÁFORO ─────────────────────────
     Es el único sitio de la app donde una MEDIDA pisa al modelo, y es el
     único que se lo ha ganado. Su regla, textual: «debo acudir siempre y
     cuando no caigan rayos, porque la torre está pegada a la caseta y es
     un pararrayos». El veto es del emplazamiento entero, no del trabajo:
     da igual el perfil, da igual estar bajo techo.

     El 24-08-2026 el «estado del cielo» del modelo no dijo tormenta en
     NINGUNA de las horas en que estaba descargando de verdad. Con eso,
     una descarga medida a menos de 15 km hace un rato no puede quedarse
     en un aviso de segunda fila mientras la chapa de arriba dice APTO.

     Pero solo mientras esté VIGENTE. Poner NO APTO por una descarga de
     hace seis horas sería exactamente el error contrario, y de los que
     hacen que una app se deje de creer. */
  if (nivel === 'no') {
    const b = $('#vBadge'), t = $('#vTitle'), w = $('#vWhy'), v = $('#verdict');
    if (b && t && w && v) {
      v.style.setProperty('--vc', VC.no);
      b.className = 'verdict__badge'; b.textContent = VT.no;
      t.textContent = 'Han caído rayos encima de este emplazamiento';
      w.textContent = `${u.encima} descarga${u.encima === 1 ? '' : 's'} a menos de `
        + `${RAYO_ENCIMA} km entre ${rangoHoras(u.desde, u.hasta)} `
        + `(${haceCuanto(u.hasta)}), medidas por la red de AEMET. `
        + `La más cercana, a ${kmTxt(u.masCerca.km)} km.`;
    }
  }

  const cuerpo = encima
    ? `<b>${u.encima} de ellas a menos de ${RAYO_ENCIMA} km</b>, la más cercana a `
      + `${kmTxt(u.masCerca.km)} km. **La tormenta ha pasado por encima del `
      + `emplazamiento.** Y con la torre pegada a la caseta, la descarga es del sitio `
      + `entero, no solo de la torre.`
    : `la más cercana a ${kmTxt(u.masCerca.km)} km. Tormenta por la zona: puede venir.`;

  el.hidden = false;
  el.dataset.s = nivel;
  el.innerHTML = `<b class="acc__k">Rayos medidos por AEMET</b>
    <ul class="acc__l"><li data-s="${nivel}">
      ${u.n} descarga${u.n === 1 ? '' : 's'} a menos de ${R.d.radio} km
      entre ${rangoHoras(u.desde, u.hasta)} (${haceCuanto(u.hasta)}) —
      ${cuerpo}
    </li></ul>
    <p class="acc__nc">Lo medido llega hasta las ${horaHM(R.d.hasta)}
      (${haceCuanto(R.d.hasta)}); de lo de después no hay dato todavía, y eso
      <b>no es lo mismo que decir que no cae nada</b>.</p>`;
}

/* ---------- Cámaras cercanas (Windy) ────────────────────────────────
   Las 23 fijas de arriba están comprobadas una a una, pero solo cubren
   unos cuantos sitios. Windy tiene miles, y las sirve por cercanía a un
   punto: pides "qué cámaras hay cerca de esta torre" y te las da.

   La clave NO está aquí: vive en el servidor. Esta parte solo llama a
   /webcams y pinta lo que llegue.

   Si no hay clave puesta o Windy no responde, se dice en pantalla. Una
   cámara que no carga no significa que haga buen tiempo.            */

/* ── EL RADIO, EN UN SOLO SITIO (02-09-2026) ───────────────────────
   Estaba escrito a mano en tres: el valor por defecto de la función y
   los dos textos que dicen «a menos de 60 km». Cambiar uno y olvidar
   otro deja la pantalla afirmando un número que no es el que se ha
   pedido — la misma clase de fallo que persigue `sin-modelos-a-mano`.

   80 km y no 60, MEDIDO ese día desde BI BERMEO: Donostia cae entre
   57,9 y 60,2 km, o sea que 60 la parte por la mitad y deja fuera
   justo las que él nombró (Teledonosti, Miramar Gardens, Pasealeku
   Berria, la Catedral del Buen Pastor, las cuatro a 60,2 km).
   Vitoria-Gasteiz está a 63 km, también fuera. Con 80 hay 72 cámaras
   —dos peticiones a Windy, cacheadas media hora— y entran las 15 de
   Donostia y las 2 de Pasaia. */
const CAMS_RADIO = 80;          // km alrededor del emplazamiento abierto
const CAMS_RADIO_OESTE = 45;    // km alrededor de cada punto de la línea del oeste

async function camsCercanas(place, radio = CAMS_RADIO) {
  const r = await fetch(`/webcams?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}&radio=${radio}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(d.reason || `error ${r.status}`);
    e.sinClave = !!d.sinClave;
    throw e;
  }
  /* Si el servidor no ha podido traer la lista entera, lo dice con
     `parcial`. Se saca aquí para que la pantalla NO cante un número
     como si fuera todo lo que hay: durante días puso «40 cámaras a
     menos de 60 km» cuando Windy tenía 53, y un recuento cerrado se
     lee como que no hay más. */
  const falta = d.parcial ? (d.reason || 'no se ha podido traer la lista entera') : null;
  const cams = (d.webcams ?? []).map(w => ({
    id: 'w' + w.webcamId,
    z: 'Cerca de ti · Windy',
    nom: w.title || w.location?.city || 'Cámara',
    tipo: 'windy',
    lat: w.location?.latitude, lon: w.location?.longitude,
    /* La imagen buena es la de 640x480. MEDIDO el 25-08-2026: la API
       solo devuelve `preview`, que son 400x224, y estirada a lo ancho de
       la pantalla se ve fatal —Aitor: «qué mal se ven, en Windy se ven
       muy bien»—. El mismo servidor sirve `full`, que es el original sin
       recortar: comprobado, 200 y 640x480. Si algún día deja de estar,
       la etiqueta cae sola a `preview` con onerror. */
    img: `https://imgproxy.windy.com/_/full/plain/current/${w.webcamId}/original.jpg?v=2`,
    imgAlt: w.images?.current?.preview || w.images?.current?.thumbnail || null,
    /* El reproductor del día: 24 horas de lapso que se pueden rebobinar.
       Es lo que él pedía —«si quiero ver si ha llovido a las 10 am ya no
       puedo, son las 16 h»—. Estaba en la respuesta de Windy desde
       siempre y la app no lo usaba: solo se caía a él cuando no había
       imagen, y siempre había imagen. */
    dia: w.player?.day || null,
    visor: w.player?.live || w.player?.day || null,
    visto: w.lastUpdatedOn || null,
    /* NO se enseña la región que da Windy: MIENTE. Medido el 25-08-2026
       en Bilbao, «San Mamés · Comunidad de Madrid» y «El Desierto ·
       Canarias», las dos con coordenadas de Bizkaia. Windy geocodifica
       el NOMBRE del sitio, no el punto. Lo que se enseña es lo que
       calculamos nosotros con las coordenadas: a cuántos km y en qué
       dirección está de TU emplazamiento, que además es lo útil. */
    que: (w.categories || []).map(x => x.name).filter(Boolean).slice(0, 2).join(' · '),
  })).filter(c => c.img || c.visor);
  return { cams, falta };
}

/** Hacia dónde cae un punto desde otro, en nombre de rumbo. */
/* Devuelve el rumbo CON TODAS LAS LETRAS. Lo pidió él el 28-08-2026
   después de leer «al OSO» dos veces en la misma pantalla: *«y esta con
   los oso, jejej»*. Tres de los dieciséis rumbos chocan con palabras
   corrientes en castellano —OSO, ESE y ENE— y no hay forma de leerlos
   sin tropezar. Ver `rumboLargo()`. */
function rumboA(desde, hasta) {
  const r = Math.PI / 180;
  const dLon = (hasta.lon - desde.lon) * r;
  const y = Math.sin(dLon) * Math.cos(hasta.lat * r);
  const x = Math.cos(desde.lat * r) * Math.sin(hasta.lat * r)
          - Math.sin(desde.lat * r) * Math.cos(hasta.lat * r) * Math.cos(dLon);
  return rumboLargo((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
}

/** Hora corta de una marca ISO, para saber si la imagen es de ahora. */
function horaCorta(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const min = Math.round((Date.now() - d) / 60000);
  return min < 90 ? `hace ${Math.max(1, min)} min`
                  : d.toLocaleString('es', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

/** Distancia aproximada en km, para ordenar por cercanía. */
/* ── EL ORDEN DE SUS TORRES ───────────────────────────────────────────
   Pedido por él el 26-08-2026: «¿por qué cuando cambio de día no salen
   las estaciones en el mismo orden?» y «que salgan en orden por cercanía
   de Bermeo».

   Iban ordenadas por gravedad, así que cada día salían en un sitio
   distinto. Y tiene razón en el motivo: **si el orden baila, hay que
   releer la lista entera**; con un orden fijo se sabe de memoria dónde
   mira cada torre y se lee de un vistazo.

   El orden es SIEMPRE el mismo —de casa hacia fuera— pase lo que pase
   con el tiempo. Lo grave se ve por el color y la etiqueta, no por la
   posición. Bermeo son las coordenadas que da el buscador de esta misma
   app (43,4209 / -2,7215), no de memoria.                             */
const BERMEO = { lat: 43.4209, lon: -2.7215 };

/* Empate a distancia -> por nombre, para que dos sitios a los mismos
   kilómetros tampoco se intercambien de una carga a otra. */
function deCasaAFuera(a, b) {
  const d = kmEntre(BERMEO, a) - kmEntre(BERMEO, b);
  return d || String(a.name ?? '').localeCompare(String(b.name ?? ''));
}

/* ═══ EL VIAJE ES PARTE DE LA RESPUESTA ═══════════════════════════════
   Suyo, 30-08-2026 a las 22:15, y es la mejor descripción de para qué
   existe esta app:

     *«Quiero que entendáis el concepto: me pasan a las 2 de la mañana
       "Arbaiza, estación caída". Yo, ANTES DE SALIR, tengo que saber qué
       me voy a encontrar allí si voy.»*

   **Él no está allí cuando decide.** De Bermeo a Arbaiza hay 44 km en
   recta y más de una hora de reloj, de noche y por monte. Así que la
   app le estaba dando la hora equivocada: la de AHORA, y encima la de
   su casa. Las horas que deciden su noche son otras dos:

       02:00  cuando le llaman     ← la única que daba la app
       03:30  CUANDO LLEGA         ← la que de verdad importa
       05:00  mientras está allí

   CÓMO SE CALCULA, y sin inventar nada: la distancia sale de sus
   coordenadas (`kmEntre`), y de recta a carretera se multiplica por
   **1,5** — medido en el caso que él mismo puso: Bermeo→Arbaiza, 44 km
   de recta contra unos 66 por carretera. La velocidad media, **55 km/h**,
   que es lo que se hace de noche por carretera de monte con curvas; él
   dijo «más de una hora» para esos 66 km y sale 72 min.

   Es una ESTIMACIÓN y se dice como tal («sobre las 03:30»): la app no
   sabe de obras, nieve ni de si va con el remolque. Lo que hace es dejar
   de contestar a la hora equivocada.                                  */
const VIAJE_VUELTAS = 1.5;      // de km en recta a km de carretera (medido)
const VIAJE_KMH     = 55;       // de noche, por monte

/** Cuánto se tarda desde su base hasta un emplazamiento, y a qué hora
 *  llegaría saliendo ahora. Una sola función: la usan la tarjeta de cada
 *  sitio y la ficha, para que no digan cosas distintas. */
/* ── AHORA, Y A HORAS VISTA ──────────────────────────────────────────
   Suyo, 02-09-2026: *«si entro a la app a las 18 quiero saber que hay ya
   y que habrá dentro de 1 hora 2 o 4»*. Una sola función para las dos
   pantallas: la tarjeta de Mis estaciones y el «cuándo» de Ahora. */
/* Las horas de reloj, no «+1 h». Suyo, 02-09-2026: *«y eso de más 1 más
   2… mejor poner "a las 21 h esto, a las 22 esto"»*. Él trabaja con la
   hora a la que llega, no con cuántas horas faltan desde que mira. La
   etiqueta se calcula de la hora real en `enHoras`. */
const TRAMOS = [[0, 'ahora'], [1, ''], [2, ''], [4, '']];
function enHoras(hs, n) {
  if (!hs?.length) return null;
  const t = Date.now() + n * 36e5;
  return hs.find(h => h.date.getTime() + 36e5 > t) || null;
}

/* ── DE TAL HORA A TAL HORA, ESTO ────────────────────────────────────
   Suyo, 02-09-2026, rematando lo de los tramos:
     *«de tal hora a tal hora abra esto, punto y esto es lo que hay ahora
       mismo»* · *«ya con eso»*

   Mejor que cuatro horas sueltas: las horas seguidas con el mismo
   veredicto se juntan en una franja. Así no lee cuatro renglones para
   enterarse de que en las próximas seis horas no pasa nada.

   Empieza en la hora EN CURSO, no en la siguiente: es «lo que hay ahora
   mismo» y sigue desde ahí.                                            */
function franjasDeEstado(hs, cuantas = 12) {
  if (!hs?.length) return [];
  const i0 = hs.findIndex(h => h.date.getTime() + 36e5 > Date.now());
  if (i0 < 0) return [];
  const out = [];
  for (const h of hs.slice(i0, i0 + cuantas)) {
    const ult = out[out.length - 1];
    if (ult && ult.st === h.st) ult.fin = h.date;
    else out.push({ st: h.st, ini: h.date, fin: h.date });
  }
  return out;
}

function viajeA(place, desde = new Date()) {
  if (!has(place?.lat) || !has(place?.lon)) return null;
  const recta = kmEntre(BERMEO, place);
  const carretera = recta * VIAJE_VUELTAS;
  const min = Math.round(carretera / VIAJE_KMH * 60);
  /* Un sitio a la vuelta de la esquina no tiene «hora de llegada» que
     valga: con menos de 20 min lo de ahora y lo de al llegar es lo
     mismo, y sacar dos cifras iguales solo ocupa sitio. */
  if (min < 20) return { km: recta, carretera, min, cerca: true, llegada: desde, salida: desde };
  return { km: recta, carretera, min, cerca: false, salida: desde,
           llegada: new Date(desde.getTime() + min * 60000) };
}

/** La hora del pronóstico que le va a tocar AL LLEGAR. Devuelve también
 *  la de un rato después, que es «mientras estás allí»: lo que decide no
 *  es solo cómo está al bajarse del coche, sino si aguanta. */
function alLlegar(horas, place, desde = new Date()) {
  const v = viajeA(place, desde);
  if (!v || v.cerca || !horas?.length) return null;
  const t = v.llegada.getTime();
  const i = horas.findIndex(h => h.date.getTime() + 36e5 > t);
  if (i < 0) return null;
  return { v, h: horas[i], luego: horas[i + 2] ?? null };
}

/* ═══ ¿ESTÁS MIRANDO TU SITIO O EL PUEBLO DE AL LADO? ════════════════
   Suyo, 30-08-2026 a las 22:16. La ficha le decía «tu suelo · sobre el
   mar: 36 m» y su caseta de Bermeo está a **133**. No era un dato malo:
   tenía seleccionado **el pueblo** —lo que devuelve el buscador cuando
   escribes «Bermeo»— y su estación base está 0,9 km monte arriba y 97 m
   más alta, en la Finca Ganeta.

   Y esa diferencia decide: 97 m de desnivel en la costa vasca son otra
   racha y otra nube. Él mismo lo dijo esa noche: *«yo quiero saber en la
   caseta el tiempo que voy a encontrarme»*.

   A las dos de la mañana, medio dormido, eso no se nota de un vistazo:
   los dos se llaman «Bermeo». Así que se dice, con el número.          */
function avisoNoEsTuSitio() {
  const el = $('#noEsTuSitio');
  if (!el) return;
  el.innerHTML = '';
  if (!S.place || !S.saved?.length) return;
  /* Si lo que miras ES uno de los tuyos, no hay nada que decir. */
  if (S.saved.some(p => key(p) === key(S.place))) return;

  /* El tuyo más cercano, y solo si está de verdad al lado: más allá de
     3 km ya no es «el pueblo de tu sitio», es otro sitio distinto y
     avisar sería ruido. */
  let cerca = null;
  for (const p of S.saved) {
    const d = kmEntre(S.place, p);
    if (d <= 3 && (!cerca || d < cerca.d)) cerca = { p, d };
  }
  if (!cerca) return;

  const miCota  = LS.get(COTA_CACHE + key(cerca.p), null);
  const estaCota = S.data?.fc?.elevation;
  const dz = (has(miCota) && has(estaCota)) ? Math.round(miCota - estaCota) : null;

  el.innerHTML = `<div class="ojo">
    <b>Esto no es tu estación.</b> Estás mirando <b>${esc(S.place.name)}</b>;
    la tuya, <b>${esc(cerca.p.name)}</b>, está a ${kmTxt(cerca.d)} km${
      has(dz) && Math.abs(dz) >= 25
        ? ` y <b>${Math.abs(dz)} m más ${dz > 0 ? 'arriba' : 'abajo'}</b>` : ''}.
    <button class="ojo__b" data-ir-sitio="${esc(key(cerca.p))}">Abrir la mía</button>
  </div>`;
}

function kmEntre(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const la1 = a.lat * r, la2 = b.lat * r;
  const h = Math.sin(dLat/2)**2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ══════════════════════════════════════════════════════════
   La línea del oeste
   Los frentes entran por el Cantábrico de oeste a este. Mirando
   cámaras escalonadas por la costa se ve venir lo que llegará
   aquí en unas horas. El margen es una estimación con la velocidad
   típica de un frente (40 km/h): sirve para hacerse una idea, no
   para fiarlo todo a ella.
   ══════════════════════════════════════════════════════════ */
const OESTE = [
  { id:'penas',    nom:'Cabo Peñas',              lat:43.657, lon:-5.847, zona:'Asturias' },
  { id:'ribadesella',nom:'Ribadesella',           lat:43.463, lon:-5.058, zona:'Asturias' },
  { id:'sanvicente',nom:'San Vicente de la Barquera', lat:43.389, lon:-4.396, zona:'Cantabria' },
  { id:'santander',nom:'Santander',               lat:43.462, lon:-3.805, zona:'Cantabria' },
  { id:'laredo',   nom:'Laredo',                  lat:43.412, lon:-3.412, zona:'Cantabria' },
  { id:'castro',   nom:'Castro Urdiales',         lat:43.383, lon:-3.216, zona:'Cantabria' },
  { id:'bermeo',   nom:'Aquí',                    lat:43.420, lon:-2.722, zona:'Bizkaia' }
];

const VEL_FRENTE = 40;          // km/h, velocidad típica de un frente atlántico

function margenHoras(punto, aqui) {
  const km = kmEntre(aqui, punto);
  const h = km / VEL_FRENTE;
  if (h < 0.5) return 'aquí';
  if (h < 1.5) return '≈ 1 h';
  return '≈ ' + Math.round(h) + ' h';
}

function pintarOeste() {
  const el = $('#camsOeste');
  if (!el) return;
  const aqui = S.place ? { lat: S.place.lat, lon: S.place.lon } : { lat: 43.42, lon: -2.72 };

  el.innerHTML = OESTE.map(p => {
    const km = Math.round(kmEntre(aqui, p));
    const esAqui = km < 12;
    return `<button class="oeste${esAqui ? ' oeste--aqui' : ''}" data-oeste="${p.id}">
      <b>${esc(p.nom)}</b>
      <span>${esc(p.zona)}</span>
      <i>${esAqui ? 'tu zona' : km + ' km · ' + margenHoras(p, aqui)}</i>
    </button>`;
  }).join('');

  if (el.dataset.listo) return;
  el.dataset.listo = '1';
  el.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-oeste]');
    if (!b) return;
    const p = OESTE.find(x => x.id === b.dataset.oeste);
    $$('.oeste').forEach(x => x.classList.toggle('is-on', x === b));
    const av = $('#camsAviso');
    av.textContent = `Buscando cámaras cerca de ${p.nom}…`;
    try {
      const { cams, falta } = await camsCercanas({ ...p, name: p.nom }, CAMS_RADIO_OESTE);
      av.textContent = (cams.length
        ? `${cams.length} cámaras alrededor de ${p.nom}. Lo que veas aquí llegará ${margenHoras(p, S.place || { lat:43.42, lon:-2.72 })}.`
        : `Windy no tiene cámaras a menos de ${CAMS_RADIO_OESTE} km de ${p.nom}.`)
        + (falta ? ` ⚠ Y puede haber más que no han llegado: ${falta}.` : '');
      pintarCams([...cams, ...CAMS]);
    } catch (e) {
      av.textContent = `No se han podido pedir las cámaras de ${p.nom} (${e.message}).`;
    }
  });
}

async function renderCams() {
  pintarOeste();
  const el = $('#cams');
  if (!el) return;
  pintarCams(CAMS);                       // lo verificado, al instante

  // Y encima, las que Windy tenga cerca de la torre que estés mirando
  const p = S.place || { lat: 43.42, lon: -2.72 };
  const av = $('#camsAviso');
  try {
    if (av) av.textContent = 'Buscando cámaras cerca…';
    const { cams: extra, falta } = await camsCercanas(p);
    if (av) av.textContent = (extra.length
      ? `${extra.length} cámaras más encontradas a menos de ${CAMS_RADIO} km de ${p.name || 'aquí'}.`
      : `Windy no tiene ninguna cámara a menos de ${CAMS_RADIO} km de ${p.name || 'aquí'}.`)
      + (falta ? ` ⚠ Y puede haber más que no han llegado: ${falta}.` : '');
    pintarCams([...extra, ...CAMS]);
  } catch (e) {
    if (av) av.textContent = e.sinClave
      ? 'Falta poner la clave de Windy en el servidor: de momento solo salen las comprobadas a mano.'
      : `No se han podido pedir más cámaras (${e.message}). Salen solo las comprobadas a mano.`;
  }
}

function pintarCams(fuente) {
  const el = $('#cams');
  if (!el) return;

  // Ordenadas por cercanía al emplazamiento que tengas abierto: lo que
  // pasa a 20 km de tu torre dice mucho más que lo que pasa en Canarias.
  const aqui = S.place ? { lat: S.place.lat, lon: S.place.lon } : { lat: 43.42, lon: -2.72 };
  const lista = fuente.filter(c => has(c.lat) && has(c.lon))
                      .map(c => ({ ...c, km: Math.round(kmEntre(aqui, c)),
                                   rumbo: rumboA(aqui, c) }))
                      .sort((a, b) => a.km - b.km);

  const zonas = [...new Set(lista.map(c => c.z))];
  el.innerHTML = zonas.map(z => `
    <div class="camz">
      <span class="camz__k">${esc(z)}</span>
      ${lista.filter(c => c.z === z).map(c => `
        <div class="cam" data-cam="${c.id}">
          <div class="cam__h">
            <div>
              <b>${esc(c.nom)}</b>
              <span class="cam__q">${esc(c.que)}</span>
              <span class="cam__d">a ${c.km} km${c.rumbo ? ` al ${c.rumbo}` : ''} · ${
                c.tipo === 'iframe' ? 'en directo'
                : c.tipo === 'windy' ? (c.visto ? 'Windy · ' + horaCorta(c.visto) : 'Windy')
                : 'imagen'}</span>
            </div>
            <div class="cam__bs">
              ${c.dia ? `<button class="cam__b cam__b--dia" data-cam-dia="${c.id}"
                   title="Las últimas 24 horas, para ver si llovió">El día</button>` : ''}
              <button class="cam__b" data-cam-b="${c.id}">Ver</button>
            </div>
          </div>
          <div class="cam__v" id="cam-${c.id}"></div>
        </div>`).join('')}
    </div>`).join('');

  el._todas = fuente;
  if (el.dataset.listo) return;
  el.dataset.listo = '1';
  el.addEventListener('click', ev => {
    /* — Las últimas 24 horas ──────────────────────────────────────
       Lo pidió él el 25-08-2026, y con razón: «si quiero ver si ha
       llovido a las 10 am ya no puedo, son las 16 h». Una foto de ahora
       no contesta a eso. El reproductor de Windy sí: 24 horas de lapso
       que se rebobinan. Estaba en la respuesta de la API desde el primer
       día y la app no lo usaba. */
    const bd = ev.target.closest('[data-cam-dia]');
    if (bd) {
      const cd = (el._todas || CAMS).find(x => x.id === bd.dataset.camDia);
      const vd = $(`#cam-${cd.id}`);
      if (vd.dataset.on === 'dia') {
        vd.innerHTML = ''; delete vd.dataset.on; vd.className = 'cam__v';
        bd.textContent = 'El día';
        return;
      }
      vd.dataset.on = 'dia';
      vd.className = 'cam__v';
      bd.textContent = 'Cerrar';
      const otro = bd.parentElement.querySelector('[data-cam-b]');
      if (otro) otro.textContent = 'Ver';
      vd.innerHTML = `<iframe src="${cd.dia}" allowfullscreen loading="lazy"
          title="Últimas 24 h de ${esc(cd.nom)}"></iframe>`;
      return;
    }

    const b = ev.target.closest('[data-cam-b]');
    if (!b) return;
    const c = (el._todas || CAMS).find(x => x.id === b.dataset.camB);
    const v = $(`#cam-${c.id}`);
    if (v.dataset.on) {                       // cerrar y dejar de gastar datos
      v.innerHTML = ''; delete v.dataset.on; v.className = 'cam__v';
      b.textContent = 'Ver';
      return;
    }
    v.dataset.on = '1';
    b.textContent = 'Cerrar';
    // A las imágenes fijas se les añade la hora para que no salga la
    // guardada del navegador: aquí lo que importa es lo de AHORA.
    if (c.tipo === 'windy') {
      const bd = b.parentElement.querySelector('[data-cam-dia]');
      if (bd) bd.textContent = 'El día';
      /* La foto se enseña con SU proporción, no metida a la fuerza en un
         16:9 recortado: la de Windy es 4:3 y así salía cortada por arriba
         y por abajo, y encima estirada. */
      v.className = c.img ? 'cam__v cam__v--foto' : 'cam__v';
      v.innerHTML = c.img
        ? `<img src="${c.img}" alt="${esc(c.nom)}" referrerpolicy="no-referrer"
             ${c.imgAlt ? `onerror="this.onerror=null;this.src='${c.imgAlt}'"` : ''}>`
        : `<iframe src="${c.visor}" allowfullscreen loading="lazy" title="${esc(c.nom)}"></iframe>`;
      return;
    }
    v.className = c.tipo === 'iframe' ? 'cam__v' : 'cam__v cam__v--foto';
    v.innerHTML = c.tipo === 'iframe'
      ? `<iframe src="${c.url}" allowfullscreen loading="lazy"
           referrerpolicy="no-referrer" title="${esc(c.nom)}"></iframe>`
      : `<img src="${c.url}${c.url.includes('?') ? '&' : '?'}_=${Date.now()}"
           alt="${esc(c.nom)}" referrerpolicy="no-referrer"
           onerror="this.parentElement.innerHTML='&lt;p class=cam__x&gt;Esta cámara no responde ahora mismo. No es que no llueva: es que no hay imagen.&lt;/p&gt;'">`;
  });
}

/* ---------- 9. Render: AHORA ---------- */

/* ── QUÉ CIELO SE PONE CUANDO SON VARIAS HORAS ──────────────────────
   A nivel de módulo desde el 28-08-2026: la usan **las franjas del día
   Y la tira de 10 días**. Estuvo un rato metida dentro de la función de
   los diez días y «Ahora» reventaba al no verla — lo cazó `abrir.cjs`,
   que es justo para lo que se puso.

   La regla, que salió de un caso suyo del 27-08 en SOLLUBEMENDI:
     · **El agua manda por lo PEOR** — una hora de lluvia en ocho es una
       hora de lluvia, y no se diluye.
     · **El cielo, por lo que MÁS SE REPITE** — siete horas de sol y una
       nube no son una mañana cubierta. */
const HAY_AGUA = 51;          // de aquí para arriba, moja

/* ═══════════════════════════════════════════════════════════════════
   EL CIELO DE UN DÍA ENTERO SE MIDE, NO SE VOTA
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026 a las 23:15, con la versión ya arreglada delante:

     *«sigo viendo en 10 días el sábado nuboso… todo el día»*

   Y esta vez el dibujo SÍ salía de sus horas. El fallo era otro: se
   cogía **el código que más se repetía**, y eso esconde la forma del
   día. Medido ese sábado en Bermeo:

     CUBIERTO ×7  ·  nuboso ×5  ·  poco nuboso ×3
     de 11:00 a 15:00 el cielo bajaba al 37-53 %

   Ganaba «cubierto» por siete votos y **desaparecían las cinco horas
   centrales de claros** — las que él veía en «Horas» dibujadas con sol.
   La franja de la app lo contaba bien —«Cubierto al principio,
   mayormente despejado después»— y el dibujo del día decía solo nube.

   Un día no es una votación entre sus horas: es cuánto cielo hubo. La
   media de nubosidad de ese sábado era **71 %**, que es «nuboso» — ni
   el cubierto que salía ni el sol que él esperaba, sino la verdad.

   Los cortes son los de Open-Meteo para el código de tiempo, los mismos
   que usa el modelo hora a hora, así que un día despejado entero sigue
   saliendo despejado y uno tapado entero sigue saliendo tapado.
   ═══════════════════════════════════════════════════════════════════ */
function cieloDelDia(sel) {
  const prom = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
  /* Con capas, el día se mide por lo que TAPA: bajas y medias. Las altas
     solo velan el sol (05-09-2026, ver `veladoSiToca`). Sin capas, la
     total, como antes. */
  /* Con comparativa cargada, cada hora aporta su MEDIANA votada; si no,
     las capas del dueño. Así el dibujo del día y el de las horas salen
     de la misma cuenta (06-09-2026). */
  const votos = sel.map(h => (h.t ? cieloVotado(h.t, h.sitio) : null));
  const bm = sel.map((h, k) => votos[k] ? votos[k].bm
                          : has(h.nubesBajas) && has(h.nubesMedias)
                          ? Math.min(100, h.nubesBajas + h.nubesMedias) : null).filter(has);
  const altas = sel.map((h, k) => votos[k] && has(votos[k].alta) ? votos[k].alta : h.nubesAltas).filter(has);
  const conCapas = bm.length && bm.length * 2 >= sel.length;
  const nubes = conCapas ? bm : sel.map(h => h.nubes).filter(has);
  if (!nubes.length) return null;
  const media = prom(nubes);
  const velado = conCapas && altas.length && prom(altas) >= 50;
  if (media < 12) return velado ? VELADO : 0;    // despejado
  if (media < 50) return velado ? VELADO : 1;    // poco nuboso
  if (media < 80) return 2;                      // nuboso
  return 3;                                      // cubierto
}

function codigoFranja(sel) {
  /* Cada hora con SU código visto: cielo del dueño del cielo, agua del
     dueño de la lluvia. Ver `codigoQueSeVe()`. */
  const cs = sel.map(h => codigoQueSeVe(h, h.code)).filter(has);
  if (!cs.length) return undefined;

  const mojan = cs.filter(c => c >= HAY_AGUA);
  /* El agua manda, y el sirimiri TAMBIÉN aunque sea una hora de ocho:
     *«con sirimiri no sube a mástil ni a torre»*. Esa hora es la que
     decide, y esconderla sería esconder la decisión. Lo intenté diluir
     el 31-08-2026 —él se quejaba, con razón, de que seis horas de sol
     salían etiquetadas de llovizna— y el candado lo paró. La respuesta
     no era callar el agua: era DECIR LAS DOS COSAS, y eso se hace en el
     rótulo de la franja (`tituloFranja`), no aquí. */
  if (mojan.length) return mojan.sort((x, y) => y - x)[0];

  /* Solo cielo: la que más manda. En empate gana la más tapada, que
     para trabajar es la que menos promete. */
  const cuenta = new Map();
  for (const c of cs) cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1] || tapado(b[0]) - tapado(a[0]))[0][0];
}

/* ═══ EL RÓTULO DE LA FRANJA DICE LAS DOS COSAS ══════════════════════
   Suyo, 31-08-2026 a las 00:05, mirando la franja de mañana:

     *«en esa franja dice que puede caer poca agua pero nada de sol; las
       demás apps no ponen agua pero ponen sol y nubes, y ésta solo nube»*

   MEDIDO en su caseta para esa mañana (lunes, 6-13 h): **seis horas con
   0,0 mm y 0 % de probabilidad**, con el cielo pasando de despejado a
   parcial, y **solo las dos últimas** con 0,1 mm. La tarjeta las
   etiquetaba las ocho como «Llovizna débil».

   PRIMERO LO INTENTÉ MAL: diluir la llovizna en `codigoFranja()`. **El
   candado lo paró**, y menos mal — hay una prueba del 25-08 que dice
   *«el sirimiri no se diluye: con sirimiri no sube a mástil ni a
   torre»*. Esa hora es justo la que decide; esconderla habría sido
   esconder la decisión, con sus palabras de esa noche encima: *«me
   juego la vida en tomar una decisión»*.

   La respuesta no era callar el agua: era **decir las dos cosas**. El
   dibujo sigue avisando del agua —eso no se toca— y las palabras
   cuentan lo que de verdad hay: qué domina y desde qué hora moja.     */
/** ¿La franja tiene DOS cielos? Devuelve {m1, m2} (el dominante de cada
 *  mitad) o null. Es UNA función a propósito: de ella beben el texto de
 *  la franja Y su dibujo — suyo, 31-08-2026: *«mayormente despejado y
 *  nubla después, ¿por qué no pinta un sol también?»*. Si texto y dibujo
 *  calcularan el corte cada uno por su lado, un día dirían cosas
 *  distintas, que es el fallo de esta casa. */
function cieloPartido(sel) {
  const cs = (sel || []).map(h => codigoQueSeVe(h, h.code)).filter(has);
  if (cs.length < 4 || cs.some(c => c >= HAY_AGUA)) return null;
  const gana = xs => { const c = new Map();
    for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || tapado(b[0]) - tapado(a[0]))[0][0]; };
  /* ── EL CORTE VA DONDE CAMBIA EL CIELO, NO POR LA MITAD ────────────
     Suyo, 01-09-2026, y llevaba días diciéndolo:

       *«me mosqueo cuando dice esta mañana sol, ya al mediodía nube, y me
         dibuja una nube para todo el día»*

     Partía por la mitad, y esa cuenta le borraba el sol: una mañana de
     6 a 13 con sol de 8 a 10 y nubes de 11 a 13 tiene 4 horas de nube
     contra 3 de sol, así que el dominante de la «primera mitad» ya era
     nube — y como la tarde también, las dos mitades coincidían y el día
     salía con UNA nube.

     Ahora se prueban todos los cortes posibles (dejando al menos dos
     horas a cada lado) y se elige el que deja los dos bloques más
     limpios: el que más horas acierta con su propio dominante. Con eso,
     sol de 8 a 10 y nubes desde las 11 parte a las 11, que es la hora en
     que de verdad cambia.

     Es UNA función y la usan las tres cosas: el texto de la franja, sus
     dos iconos, y el dibujo partido del día en «10 días». */
  const grupo = c => (c <= 1 || c === VELADO ? 0 : 1);   // el velado es del bando del sol
  let mejor = null;
  for (let k = 2; k <= cs.length - 2; k++) {
    const a1 = cs.slice(0, k), a2 = cs.slice(k);
    const g1 = gana(a1), g2 = gana(a2);
    if (grupo(g1) === grupo(g2)) continue;          // no es un cambio de verdad
    /* Cuántas horas quedan bien explicadas por su bloque: cuanto más
       alto, más limpio es el corte. */
    const acierto = a1.filter(c => c === g1).length + a2.filter(c => c === g2).length;
    if (!mejor || acierto > mejor.acierto) mejor = { m1: g1, m2: g2, corte: k, acierto };
  }
  if (!mejor) return null;
  return { m1: mejor.m1, m2: mejor.m2, corte: mejor.corte };
}

/* ═══ EL CIELO DE UNA HORA, UNA SOLA VEZ ═════════════════════════════
   cieloVisto(h) es lo ÚNICO que decide qué cielo se pinta y se escribe
   para una hora: código visto (codigoQueSeVe), día o noche, y texto.
   Ahora, Horas, Mis estaciones, franjas y 10 días lo llaman a él. */
function cieloVisto(h) {
  if (!h) return { code: undefined, dia: 1, txt: null };
  const code = codigoQueSeVe(h, h.code);
  const hh = h.date instanceof Date ? h.date.getHours()
           : (h.t ? Number(String(h.t).slice(11, 13)) : NaN);
  const dia = has(h.day) ? h.day : (hh >= 8 && hh <= 19 ? 1 : 0);
  return { code, dia, txt: textoVisto(code, dia) };
}

/* Los tramos de cielo de un conjunto de horas: [{code, dia, txt, hora,
   desde, hasta, n}], por bandos (sol 0-1, velo 4, nube 2-3, agua ≥51).
   null si no hay al menos 4 horas con dato. El agua nunca se absorbe como
   «parpadeo»: una hora de sirimiri decide (regla del 31-08). */
function tramosDeCielo(sel) {
  const hs = (sel || []).map(h => ({ c: codigoQueSeVe(h, h.code), h })).filter(x => has(x.c));
  if (hs.length < 4) return null;
  const bando = c => (c >= HAY_AGUA ? 3 : c === VELADO ? 1 : c <= 1 ? 0 : 2);
  const horaNum = h => (h?.date instanceof Date) ? h.date.getHours()
                     : (h?.t ? Number(String(h.t).slice(11, 13)) : NaN);
  let tr = [];
  for (const x of hs) {
    const b = bando(x.c);
    if (tr.length && tr[tr.length - 1].b === b) { tr[tr.length - 1].cs.push(x.c); tr[tr.length - 1].hs.push(x.h); }
    else tr.push({ b, cs: [x.c], hs: [x.h] });
  }
  const fundir = () => { for (let k = tr.length - 1; k > 0; k--) if (tr[k].b === tr[k - 1].b) {
    tr[k - 1].cs = tr[k - 1].cs.concat(tr[k].cs); tr[k - 1].hs = tr[k - 1].hs.concat(tr[k].hs); tr.splice(k, 1); } };
  // Pegar el tramo i al vecino j: se queda el bando de j
  const pegar = (i, j) => { const a = Math.min(i, j), b = Math.max(i, j);
    tr[j] = { b: tr[j].b, cs: tr[a].cs.concat(tr[b].cs), hs: tr[a].hs.concat(tr[b].hs) }; tr.splice(i, 1); fundir(); };
  /* El agua es intocable en las dos direcciones: ni se absorbe como
     parpadeo, ni absorbe horas secas (una hora seca pegada a una de
     llovizna no es llovizna). Cazado en Bermeo, 09-09-2026 00:20. */
  const seco = k => k >= 0 && k < tr.length && tr[k].b !== 3;
  // 1) Una hora suelta entre dos tramos secos del mismo bando es un parpadeo del modelo: fuera
  for (let k = tr.length - 2; k >= 1; k--)
    if (tr[k].cs.length < 2 && seco(k) && seco(k - 1) && tr[k - 1].b === tr[k + 1].b) pegar(k, k - 1);
  // 2) Una hora suelta en un extremo se pega al de al lado, si los dos son secos
  if (tr.length > 1 && tr[0].cs.length < 2 && seco(0) && seco(1)) pegar(0, 1);
  if (tr.length > 1 && tr[tr.length - 1].cs.length < 2 && seco(tr.length - 1) && seco(tr.length - 2)) pegar(tr.length - 1, tr.length - 2);
  // 3) Como mucho tres tramos SECOS (el agua no cuenta para el tope): el más corto seco con vecino seco
  //    (a igual largo, antes el velo) al vecino seco más largo
  while (tr.filter(t => t.b !== 3).length > 3) {
    let i = -1;
    for (let k = 0; k < tr.length; k++) {
      if (!seco(k) || !(seco(k - 1) || seco(k + 1))) continue;
      if (i < 0 || tr[k].cs.length < tr[i].cs.length
          || (tr[k].cs.length === tr[i].cs.length && tr[k].b === 1 && tr[i].b !== 1)) i = k;
    }
    if (i < 0) break;
    const izq = seco(i - 1), der = seco(i + 1);
    const j = izq && der ? (tr[i - 1].cs.length >= tr[i + 1].cs.length ? i - 1 : i + 1) : izq ? i - 1 : i + 1;
    pegar(i, j);
  }
  const gana = xs => { const c = new Map();
    for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || tapado(b[0]) - tapado(a[0]))[0][0]; };
  return tr.map(t => {
    const mojan = t.cs.filter(c => c >= HAY_AGUA);
    const code = mojan.length ? mojan.sort((a, b) => b - a)[0] : gana(t.cs);
    const desde = horaNum(t.hs[0]), hasta = horaNum(t.hs[t.hs.length - 1]);
    const medio = t.hs[Math.floor(t.hs.length / 2)];
    const hm = horaNum(medio);
    const dia = has(medio?.day) ? medio.day : (hm >= 8 && hm <= 19 ? 1 : 0);
    return { code, dia, txt: textoVisto(code, dia) ?? '—',
             hora: `${String(desde).padStart(2, '0')}:00`, desde, hasta, b: t.b, n: t.hs.length };
  });
}

/* ═══ EL RESUMEN DE UN CONJUNTO DE HORAS, UNA SOLA VEZ ═════════════════
   Franjas de «Ahora» y tarjetas de «10 días» pintan con ESTO y con nada
   más. code: el de la franja (el agua manda por lo peor; si no, el más
   repetido, empate a lo más tapado — codigoFranja). partes: los tramos
   con su hora. iconos: uno, o dos si el cielo cambia (el primer tramo y
   el peor de los siguientes: lo que va a encontrarse y lo que más le
   frena). */
function resumenCielo(sel) {
  const hs = (sel || []).filter(h => h && has(codigoQueSeVe(h, h.code)));
  if (!hs.length) return null;
  const code = codigoFranja(hs);
  const dia = esDeDia(hs);
  const partes = tramosDeCielo(hs);
  const peso = c => (c >= HAY_AGUA ? 100 + c : tapado(c));
  let iconos;
  if (partes && partes.length >= 2) {
    /* ── LO PEOR Y LO QUE MÁS DURA, EN ORDEN DE RELOJ (09-09-2026) ─────
       Calpe, 15:17, la mañana del jueves: «sol · lluvia desde las 7 ·
       sol desde las 9», y los iconos ponían sol y luego lluvia. Suyo:
       *«sol a la mañana y pone de 7 a 9 lluvia»*. La regla anterior
       cogía el PRIMER tramo (las 6, una hora sola) y el peor, y se leía
       «empieza bien y acaba lloviendo», al revés de lo que decía el
       dato. Ahora: el tramo peor (lo que le frena) y el más largo de los
       demás (lo que más va a ver), pintados en el orden en que pasan.
       Para esa mañana: lluvia 7-8 h y después sol 9-13 h. */
    const peor = partes.reduce((a, b) => (peso(b.code) > peso(a.code) ? b : a));
    const resto = partes.filter(t => t !== peor);
    const largo = resto.reduce((a, b) => (b.n > a.n ? b : a));
    iconos = [peor, largo].sort((a, b) => a.desde - b.desde);
    /* Dos iconos iguales no cuentan nada: se deja uno, que abarca los dos. */
    if (iconos[0].code === iconos[1].code)
      iconos = [{ code: iconos[0].code, dia, desde: iconos[0].desde, hasta: iconos[1].hasta }];
  } else {
    const hn = h => (h.date instanceof Date) ? h.date.getHours() : Number(String(h.t).slice(11, 13));
    iconos = [{ code, dia, desde: hn(hs[0]), hasta: hn(hs[hs.length - 1]) }];
  }
  return { code, dia, txt: textoVisto(code, dia), partes, iconos };
}


function tituloFranja(sel, code, desde = '') {
  const base = textoVisto(code, esDeDia(sel)) ?? '—';
  if (!has(code) || !sel?.length) return base;

  /* ── EL CIELO MIXTO SE DICE EN ORDEN, NO CON UNA PALABRA ────────────
     Cazado por él el 31-08-2026 a las 21:17, martes por la mañana: la
     franja decía «Cubierto» y las tarjetas de Horas enseñaban luna y
     soles hasta las 10:00. Las dos tenían razón — 6-9 despejado, 10-13
     nublado, y el empate lo gana el más tapado — pero UNA PALABRA para
     un tramo partido en dos es mentir con la verdad: «en un sitio dibuja
     una cosa y en otro diferente».

     Si las dos mitades del tramo tienen cielos distintos, se dicen las
     dos y en su orden: «Despejado al principio, cubierto después». Con
     agua por medio no se entra aquí: eso ya lo cuenta el bloque de la
     llovizna de abajo. */
  /* ── LA MISMA LÍNEA DE TIEMPO QUE LOS ICONOS (09-09-2026) ────────────
     Con agua o sin ella: si la franja tiene tramos, la frase los cuenta
     en orden y con su hora, y son los MISMOS tramos de los que salen los
     dos iconos. Así no puede pasar lo de Bermeo a las 00:20: icono de
     cubierto y llovizna con la frase «Mayormente despejado». La línea de
     los milímetros de debajo sigue diciendo de qué hora a qué hora moja. */
  const linea = tramosDeCielo(sel);
  if (linea && linea.length >= 2)
    return linea.map((t, i) => i === 0 ? t.txt : `${t.txt.toLowerCase()} desde las ${t.hora}`).join(' · ');

  if (code < HAY_AGUA) {
    /* ── CON LA HORA, NO CON «AL PRINCIPIO» ──────────────────────────
       Calpe, 08-09-2026 a las 14:40, cielo azul de punta a punta y la
       tarde decía «Sol velado al principio, parcialmente nuboso
       después». Los modelos tenían razón —el velo entraba a las 16 y la
       nube media a las 19— pero «al principio» metía en el mismo saco
       las 14 y las 15 limpias con las 16-18 veladas, porque el corte de
       cieloPartido() solo distingue bando sol y bando nube, y el velado
       es del bando del sol. Suyo: *«eso nada, cielo azul todo el rato»*.

       Ahora la franja se cuenta por tramos y con su hora: «Despejado ·
       sol velado desde las 16:00 · nubes desde las 19:00». Tramos de al
       menos dos horas (una hora suelta se pega al de al lado, que un
       modelo parpadea), tres como mucho. El dibujo partido y los dos
       iconos siguen saliendo de cieloPartido(), que no cambia. */
    const tramos = tramosDeCielo(sel);
    if (tramos && tramos.length >= 2) {
      return tramos.map((t, i) => i === 0 ? t.txt : `${t.txt.toLowerCase()} desde las ${t.hora}`).join(' · ');
    }
    return base;
  }

  const cs = sel.map(h => codigoQueSeVe(h, h.code)).filter(has);
  const mojadas = cs.filter(c => c >= HAY_AGUA).length;
  /* Si moja en un tercio o más de la franja, el agua ES la franja y no
     hace falta matizar nada. */
  if (!cs.length || mojadas * 3 >= cs.length) return base;

  /* El cielo que domina en las horas que NO mojan: eso es lo que él ve
     por la ventana la mayor parte de la franja. */
  const secas = cs.filter(c => c < HAY_AGUA);
  if (!secas.length) return base;
  const cuenta = new Map();
  for (const c of secas) cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
  const cielo = [...cuenta.entries()].sort((a, b) => b[1] - a[1] || tapado(b[0]) - tapado(a[0]))[0][0];
  const txtCielo = textoVisto(cielo, esDeDia(sel));
  if (!txtCielo) return base;

  return `${txtCielo}, con ${base.toLowerCase()}${desde}`;
}

function renderNow() {
  const { fc } = S.data, C = fc.current, hrs = S.data.hours, c = hrs[0];

  /* Ver `codigoQueSeVe()`: si el dueño de la lluvia ve agua, eso manda
     sobre el código del cielo — el rótulo no puede decir «Cubierto»
     mientras la tarjeta de al lado dice que llueve. */
  /* Las capas de AHORA, si el modelo las trae en `current`; si no, las
     de la hora en curso. Con ellas el velo de cirros no sale «Cubierto». */
  /* UN SOLO CAMINO (09-09-2026): la hora en curso ya lleva el código y
     las capas de `current` (ver conAhora en buildHours), así que el
     dibujo grande y la primera tarjeta de «Horas» son la misma cuenta. */
  const V = cieloVisto(c);
  const codVisto = V.code;
  $('#nowIco').innerHTML = icon(codVisto, V.dia);
  $('#nowT').className = ''; $('#nowT').textContent = num(C.temperature_2m, 0) ?? '--';
  /* ── EL SÍMBOLO GRANDE NO PUEDE IR SOLO ───────────────────────────
     Suyo, 30-08-2026, con Bermeo cubierto y chispeando: *«pero en el
     símbolo pone sol»*. Y era verdad: el rótulo grande sale del código
     de tiempo del modelo CARGADO, y ese día daban, a la misma hora y en
     el mismo punto:

         ICON  cubierto (92 % de nubes)   ·   ECMWF  may. despejado (36 %)
         GFS   parc. nuboso (65 %)        ·   Automático  DESPEJADO (13 %)

     O sea que el dibujo que más se mira dependía entero de qué botón
     tuviera pulsado, sin decírselo.

     `cieloRaro()` ya avisaba de esto en la tarjeta de Nubosidad desde el
     28-08 —cuando él mandó la foto de medio cielo cubierto con la app
     diciendo «Despejado 0 %»— pero **el rótulo grande no lo miraba**.
     Aquí se le engancha: no se cambia el símbolo, que es el de su
     modelo, se le pone al lado lo que ven los demás. */
  $('#nowDesc').className = has(wmoText(codVisto)) ? '' : 'dim';
  $('#nowDesc').innerHTML = esc(textoCielo(codVisto, V.dia)) + avisoCielo(C.cloud_cover);
  /* ── EL NÚMERO GRANDE ES EL AIRE, Y LA SENSACIÓN SOLO SI APORTA ────
     Suyo, 01-09-2026 con la cabecera delante: *«¿por qué pone sensación?
     yo quiero la temperatura real»*. Y llevaba razón en lo que se lee:
     salía «23» arriba y «Sensación 23°» debajo, los dos iguales, sin que
     nada dijera cuál es cuál. Dos números idénticos con una sola
     etiqueta se leen como que el grande ES la sensación.

     Ahora el grande se rotula como lo que es —el aire— y la sensación
     solo aparece cuando **se separa 2° o más**, que es cuando de verdad
     le cambia algo (con viento y humedad, o con sol pegando). Si va
     igual, no se dice: un número repetido es ruido. */
  (() => {
    const el = $('#nowFeel');
    if (!el) return;
    const aire = C.temperature_2m, sens = C.apparent_temperature;
    if (!has(sens) || !has(aire)) { el.innerHTML = has(sens) ? `Sensación ${sens.toFixed(0)}°` : ''; return; }
    const dif = Math.abs(sens - aire);
    el.innerHTML = dif >= 2
      ? `<b>${aire.toFixed(0)}° de aire</b> · sensación ${sens.toFixed(0)}°`
      : `<b>${aire.toFixed(0)}°</b> de temperatura del aire`;
  })();

  /* Se dice a qué momento corresponden estas cifras. `current.time` es
     la hora de validez que da la fuente; `current.interval` los segundos
     que tarda en refrescarse (900 = 15 min). No se redondea ni se
     disimula: si el dato tiene doce minutos, se dice que los tiene. */
  (() => {
    const el = $('#nowVal');
    if (!el) return;
    if (!C?.time) { el.textContent = ''; return; }
    const t = new Date(C.time);
    if (Number.isNaN(t.getTime())) { el.textContent = ''; return; }
    const min = Math.max(0, Math.round((Date.now() - t.getTime()) / 60000));
    const hm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    const cada = C.interval ? ` · se refresca cada ${Math.round(C.interval / 60)} min` : '';
    const viejo = min >= 60;
    /* Y la hora en que la app PIDIÓ la previsión, que no es la misma:
       «Medido a las 15:15» seguía igual mientras la franja de mañana
       cambiaba, porque la app había recargado a las 15:25 y traído una
       pasada nueva (Calpe, 09-09-2026). Dos relojes, los dos escritos. */
    /* En su color, arriba y a mano: «en vez de abajo, que no lo ve nadie»
       (suyo, 15:32). Es el reloj que hay que mirar antes de comparar dos
       capturas. */
    const pedida = S.data?.at ? (d => ` · <b class="cover__pedida">previsión pedida a las ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</b>`)(new Date(S.data.at)) : '';
    el.innerHTML = `Medido a las <b>${hm}</b>${diaSiNoEsHoy(t)}`
      + (viejo ? ` — <b>hace ${Math.floor(min / 60)} h ${min % 60} min</b>, pulsa recargar`
               : min >= 1 ? ` — hace ${min} min` : '')
      + cada + pedida;
  })();

  const d0 = fc.daily;
  /* ── LA MÁXIMA Y LA MÍNIMA, CON SU HORA ───────────────────────────
     Suyo, el mismo rato: *«máxima y mínima… la mínima ¿cuándo, a qué
     hora pone esos 15 grados?»*. Y es justo lo que le hace falta saber:
     una mínima de 15 a las 6 de la mañana le cambia el día; a las 23:00
     no. El dato ya estaba, solo faltaba decir cuándo.

     La hora se busca en las horas del día, no se inventa: si no se puede
     localizar, se dice el número a secas como antes. */
  (() => {
    const el = $('#nowRange');
    if (!el) return;
    const mx = d0?.temperature_2m_max?.[0], mn = d0?.temperature_2m_min?.[0];
    if (!has(mx) || !has(mn)) { el.innerHTML = ''; return; }

    /* «Hoy» comparando año, mes y día — no hay `diaDe()` en este ámbito
       y no se inventa una que ya exista con otro nombre. */
    const h0 = new Date();
    const mismoDia = d => d.getFullYear() === h0.getFullYear()
                       && d.getMonth() === h0.getMonth()
                       && d.getDate() === h0.getDate();
    /* ── EN TODO EL DÍA, NO SOLO EN LO QUE QUEDA DE ÉL ────────────────
       Calpe, 08-09-2026 a las 23:49: «Máx 32° a las 23:00 · Mín 23° a las
       23:00». Los números eran del día entero (daily), pero la hora se
       buscaba en S.data.hours, que empieza en la hora en curso: a las
       23:49 solo quedaba las 23:00 y las dos horas salían iguales, y
       falsas. Ahora se busca en fc.hourly, que trae el día desde las
       00:00, la hora cuya temperatura más se acerca al dato del día; si
       ninguna se acerca a menos de un grado, no se pone hora. */
    const Hh = fc.hourly;
    const idxHoy = (Hh?.time || []).map((t, i) => i)
      .filter(i => has(Hh.temperature_2m?.[i]) && mismoDia(new Date(Hh.time[i])));
    const cuando = valor => {
      let mejor = null;
      for (const i of idxHoy) {
        const d = Math.abs(Hh.temperature_2m[i] - valor);
        if (!mejor || d < mejor.d) mejor = { i, d };
      }
      if (!mejor || mejor.d > 1) return '';
      const hh = new Date(Hh.time[mejor.i]).getHours();
      return ` <small>a las ${String(hh).padStart(2, '0')}:00</small>`;
    };
    el.innerHTML = `Máx ${mx.toFixed(0)}°${cuando(mx)} · Mín ${mn.toFixed(0)}°${cuando(mn)}`;
  })();

  $('#tz').textContent = fc.timezone_abbreviation ?? '';

  // Portada
  // Qué modelo está produciendo lo que se ve. Sin esto, el PC y el móvil
  // pueden enseñar previsiones distintas —cada aparato guarda su propia
  // elección— y no hay forma de saber por qué. MEDIDO el 23-08-2026:
  // el PC daba 27-34° con ECMWF y el móvil 27-30° con el automático.
  const cm = $('#coverMod');
  if (cm) {
    const m = modeloDato();
    cm.hidden = false;
    cm.innerHTML = `<b>${esc(m.name)}</b>${m.res ? ` · ${esc(m.res)}` : ''}`;
  }

  $('#coverName').textContent = S.place.name;

  /* El mismo nombre, arriba, para el móvil. En pantalla pequeña la portada
     solo sale en «Ahora», así que sin esto las otras siete pestañas enseñan
     números sin decir de qué sitio son. Lo pidió él el 03-09-2026 con el
     caso de Calpe, y mandó la captura de otra app que lo hace así: el
     nombre arriba y siempre a la vista. */
  const tp = $('#topPlace');
  if (tp) {
    tp.textContent = S.place.name || '';
    tp.hidden = !S.place.name;
  }
  $('#coverSub').textContent = [S.place.admin1, S.place.country].filter(Boolean).join(' · ');
  Cover.load(S.place, c);

  // Franjas del día
  //
  // UNA FRANJA ES SIEMPRE DE UN SOLO DÍA. Antes se filtraba por hora sin
  // mirar la fecha, y como la lista de horas empieza en la hora actual y
  // no a medianoche, a las 19:00 la franja "Tarde · 14–20 h" juntaba las
  // 19 y 20 de HOY con las 14 a 18 de MAÑANA. El resumen salía de esa
  // mezcla: se leyó "Llovizna moderada" un domingo de 34° y sol raso,
  // porque la llovizna era del lunes. Y la franja "Mañana" era entera del
  // día siguiente sin avisar de ello.
  //
  // Ahora: se ancla al día, y si la franja ya ha pasado se enseña la del
  // día siguiente CON EL DÍA ESCRITO. Y si solo queda un trozo de la
  // franja, el título dice las horas que de verdad cubre.
  /* ── QUÉ CIELO SE PONE EN LA FRANJA ─────────────────────────────────
     Lo encontró él, 27-08-2026, en BI SOLLUBEMENDI: la tarjeta
     «MAÑANA · 6-13 h · VIERNES» decía **Cubierto**, y al pasar a Horas
     las 10:00 y las 11:00 salían **con sol**. La misma app diciendo dos
     cosas en dos pantallas.

     Y no era un fallo de datos. De las ocho horas de esa franja, con el
     Automático, **SIETE eran «despejado» y una sola —las 07:00— era
     «cubierto»**. Con 0 % de nubes a las 06:00, 100 % a las 07:00 y 0 %
     otra vez a las 08:00: un pico de una hora entre dos ceros, que en el
     Automático suele ser la costura entre dos modelos.

     La regla que había era «el código PEOR de la franja», y para el AGUA
     está bien —una hora de chaparrón en ocho es una hora en la que no se
     sube—. Pero para las NUBES no: una hora tapada no convierte una
     mañana de sol en una mañana cubierta, y encima contradecía a la
     pantalla de al lado.

     Así que se parte en dos, que es lo honrado:

       · Si hay agua (código ≥ 51: llovizna, lluvia, chubasco, tormenta)
         manda LA PEOR. Eso no se diluye nunca.
       · Si es solo cielo (0-3, niebla), manda **la que más se repite**.

     Y con eso las dos pantallas dicen lo mismo, porque las dos describen
     las mismas horas.                                                  */

  /* ── SOL O LUNA: LA FRANJA ENTERA, NO SU PRIMERA HORA ──────────────
     Suyo, 28-08-2026: *«el icono de 7 a 13, una luna, cuando estaba ya
     despejado y era de día»*.

     Ponía `sel[0].day`, o sea el `is_day` de la PRIMERA hora de la
     franja. La franja de mañana empieza a las 6:00 y en Bermeo a finales
     de agosto el sol sale a las 7:20: esa primera hora es noche, así que
     ocho horas de sol se dibujaban con una luna.

     Ahora cuenta las horas: si la mayoría son de día, es de día. La
     franja de noche (21-23 h) sigue saliendo con luna, porque ahí sí lo
     son todas.

     Y si el modelo no publica `is_day` no se adivina: se mira si la hora
     del medio cae entre las 8 y las 19, que es de día todo el año aquí. */
  const deDia = sel => {
    const con = sel.filter(h => has(h.day));
    if (con.length) return con.filter(h => h.day === 1).length * 2 >= con.length ? 1 : 0;
    const media = sel[Math.floor(sel.length / 2)]?.date.getHours();
    return has(media) && media >= 8 && media <= 19 ? 1 : 0;
  };

  const bands = [['Mañana', 6, 13], ['Tarde', 14, 20], ['Noche', 21, 23]];
  const diaDe = d => d.toDateString();
  const hoy = hrs.length ? diaDe(hrs[0].date) : null;

  // Se preparan primero y SE ORDENAN POR HORA. Si no, a las 21:40 del
  // domingo salía «Mañana lunes · Tarde lunes · Noche», con la noche de
  // HOY la última y sin decir el día: leído del tirón, no hay quien lo
  // entienda. Ahora van en el orden en que van a pasar.
  const trozos = bands.map(([name, a, b]) => {
    const enFranja = h => h.date.getHours() >= a && h.date.getHours() <= b;
    let sel = hrs.filter(h => diaDe(h.date) === hoy && enFranja(h));
    if (!sel.length) {
      const primera = hrs.find(enFranja);
      if (!primera) return null;
      const dia = diaDe(primera.date);
      sel = hrs.filter(h => diaDe(h.date) === dia && enFranja(h));
    }
    if (!sel.length) return null;
    return { name, a, b, sel };
  }).filter(Boolean).sort((x, y) => x.sel[0].date - y.sel[0].date);

  $('#parts').innerHTML = trozos.map(({ name, a, b, sel }) => {

    const ts = sel.map(h => h.temp).filter(has);
    /* UN SOLO CAMINO: código, tramos e iconos salen de resumenCielo(),
       lo mismo que en «10 días» (09-09-2026). */
    const R = resumenCielo(sel);
    const code = R ? R.code : codigoFranja(sel);
    const gm = Math.max(...sel.map(h => h.gust ?? 0));
    // Y a qué hora es esa racha (suyo, 09-09-2026: «que se aplique siempre»).
    const hGm = sel.find(h => (h.gust ?? 0) === gm)?.date;
    const gmCuando = gm > 0 && hGm ? ` · a las ${String(hGm.getHours()).padStart(2, '0')}:00` : '';
    /* El viento medio, además de la racha. Suyo, 08-09-2026: «está bien
       saber las rachas pero también me gustaría saber el viento que hay a
       10 m». Va la horquilla de la franja, a la misma altura que la racha. */
    const vs = sel.map(h => h.wind).filter(has);
    const vTxt = vs.length ? (Math.min(...vs) === Math.max(...vs)
                   ? wtxt(vs[0], true)
                   : `${wtxt(Math.min(...vs))}–${wtxt(Math.max(...vs), true)}`) : null;
    // Los milímetros ESCRITOS. Con solo el icono no se distingue una
    // llovizna de un chaparrón, y el número no admite interpretación.
    const mm = sel.map(h => h.prec).filter(has).reduce((a, b) => a + b, 0);

    /* ── Y A QUÉ HORA EMPIEZA, QUE SI NO PARECE UN FALLO ──────────────
       Suyo, 30-08-2026, con la pantalla delante: *«en el símbolo
       mayormente despejado, pero pone lluvia en esta franja; no está
       bien eso»*.

       Y tenía razón en lo que se lee, aunque los dos números fueran
       buenos: el símbolo grande es **la hora en curso** (las 14, con
       sol) y la franja es **de 14 a 20** con el peor código de las siete
       horas. A las 14:10 se leía «sol» y «llovizna moderada» a la vez,
       como si uno de los dos mintiera.

       No mentía ninguno: empezaba a las 15:00. Ahora lo dice, y con eso
       las dos cifras cuentan lo mismo. */
    /* ── DE QUÉ HORA A QUÉ HORA, NO SOLO DESDE CUÁNDO ─────────────────
       Suyo, 31-08-2026 a las 00:25: *«hay que poner claras las cosas: de
       qué hora a qué hora va a llover, o de qué hora a qué hora son las
       previsiones»*.

       Ponía solo el comienzo —«desde las 12:00»— y con eso él no sabe si
       tiene que esperar una hora o toda la tarde. Y esperar es
       exactamente lo que hace: *«mucha lluvia, cuando cae, esperamos a
       que amaine»*.

       Se dicen las dos puntas. Y si las horas mojadas van sueltas —el
       sirimiri de costa va a ratos— se dice ASÍ, que no es lo mismo tres
       horas seguidas que tres repartidas en toda la tarde. Es la misma
       regla que ya usa el parte desde el 26-08.                       */
    const mojadas = sel.filter(h => has(h.prec) && h.prec >= 0.1);
    const hh = d => `${String(d.getHours()).padStart(2, '0')}:00`;
    let desde = '';
    if (mojadas.length) {
      const h1 = mojadas[0].date, h2 = mojadas[mojadas.length - 1].date;
      /* Seguidas = tantas horas mojadas como horas hay entre la primera
         y la última. Si hay huecos, van sueltas. */
      const seguidas = mojadas.length === (h2.getHours() - h1.getHours() + 1);
      const todaLaFranja = h1.getHours() === sel[0].date.getHours()
                        && h2.getHours() === sel[sel.length - 1].date.getHours();
      desde = todaLaFranja ? ' toda la franja'
        : seguidas
          ? (h1.getHours() === h2.getHours()
              ? ` solo a las ${hh(h1)}`
              : ` de ${hh(h1)} a ${hh(h2)}`)
          : ` en ${mojadas.length} horas sueltas, entre las ${hh(h1)} y las ${hh(h2)}`;
    }

    // Horas que de verdad se están enseñando
    const h1 = sel[0].date.getHours(), h2 = sel[sel.length - 1].date.getHours();
    const completa = h1 === a && h2 === b;
    const rotulo = completa ? `${a}–${b} h` : (h1 === h2 ? `${h1} h` : `${h1}–${h2} h`);
    // El día se escribe SIEMPRE, no solo cuando no es hoy. Con tres
    // franjas que pueden caer en dos días distintos, poner el día en unas
    // sí y en otras no es peor que no ponerlo en ninguna.
    const dia = sel[0].date;
    const esHoy = diaDe(dia) === hoy;
    const nombreDia = dia.toLocaleDateString('es', { weekday: 'long' });
    const cuando = ` · <b>${esc(esHoy ? 'hoy ' + nombreDia : nombreDia)}</b>`;

    return `<div class="part" data-ini="${esc(sel[0].t ?? '')}" data-fin="${esc(sel[sel.length - 1].t ?? '')}"><div class="part__k">${name} · ${rotulo}${cuando}</div>
      <div class="part__b"><div class="part__i">${(() => {
        /* El dibujo acompaña al texto: si la franja tiene dos cielos,
           dos iconos en su orden. Misma función que decide la frase. */
        /* ── UN ICONO POR TRAMO, SIN ELEGIR (09-09-2026, 15:30) ───────
           Suyo, tras cuatro semanas: *«todos los días hay algo mal en los
           iconos, la interpretación»*. Y era eso: pedir a dos dibujos que
           resuman siete horas es interpretar, y cada regla para elegir
           «los dos» acierta un día y falla al siguiente. Ahora la franja
           pinta TODOS sus tramos, cada uno con sus horas debajo, en el
           mismo orden que la frase. No hay nada que elegir. */
        const d = deDia(sel);
        if (R && R.partes && R.partes.length >= 2) {
          const rot = t => (t.desde === t.hasta ? `${t.desde} h` : `${t.desde}-${t.hasta} h`);
          return `<span class="part__tira">${R.partes.map(t => `<i>${icon(t.code, d)}<u>${rot(t)}</u></i>`).join('')}</span>`;
        }
        return icon(code, d);
      })()}</div>
      <div class="part__t">${ts.length ? `${Math.min(...ts).toFixed(0)}–${Math.max(...ts).toFixed(0)}°` : nd}</div></div>
      <div class="part__s">${esc(tituloFranja(sel, code, desde))}${
        /* Las franjas se ven en Ahora, en Torre y en Mis torres: con esto
           el aviso del cielo llega a las tres de una vez. Ver
           `avisoCielo()`. Solo en la franja que está EN CURSO, que es la
           única que se puede contrastar con lo que él ve por la ventana. */
        (sel[0].date.getHours() <= new Date().getHours()
         && new Date().getHours() <= sel[sel.length - 1].date.getHours()
         && sel[0].date.toDateString() === new Date().toDateString())
          ? avisoCielo(sel[0].cloud, { corto: true }) : ''}${
        /* LA LLUVIA SIEMPRE, TAMBIÉN CUANDO ES CERO. Suyo, 28-08-2026,
           señalando estos tres recuadros: *«ahí falta precipitación, 0 o
           en mm; no hay dentro de los recuadros»*.

           Ponía la lluvia solo cuando la había. Y un hueco no dice «no
           llueve»: dice «no lo he mirado». Es el mismo fallo que la app
           lleva quitando todo el día —el pulso en tres estados, «Miradas
           también», «no la mide»— y aquí seguía vivo en la pantalla que
           más mira.

           Un 0,0 medido es un dato, y de los que más le sirven: en sus
           sitios el 90 % del trabajo es caseta, fusibles al aire y
           armarios de intemperie. */
        `<br>${(() => {
          if (!has(mm)) return 'Lluvia: sin dato';
          if (mm <= 0) {
            /* ── «SIN LLUVIA» A SECAS NO PUEDE CONVIVIR CON «LLOVIZNA» ──
               Cazado el 01-09-2026 en su pantallazo de la franja: arriba
               «Parcialmente nuboso, con llovizna moderada» (el cielo, de
               ARPEGE) y justo debajo «Sin lluvia · 0,0 mm» (el agua, de
               ECMWF). Las dos líneas eran verdad y juntas se leían como
               una contradicción. Cuando OTROS modelos sí ven agua en la
               franja, la calma lleva dueño: no es «sin lluvia», es «tu
               modelo la ve seca». El chip de al lado ya dice quiénes. */
            const o = lluviaEnLaFranjaQueNoVesTu(sel[0].date, sel[sel.length - 1].date);
            /* `duenoLluvia()`, como los otros siete sitios: con el elegido vacío
               salía «otro modelo la ve seca». Revisión del 04-09-2026. */
            return o ? `${nombreDeModelo(duenoLluvia()) || 'Tu modelo'} la ve seca · 0,0 mm`
                     : 'Sin lluvia · 0,0 mm';
          }
          if (mm < 0.1) return 'Menos de 0,1 mm en la franja';
          return `${mmTxt(mm)} mm en la franja${desde}`;
        })()}${
        /* ── Y SI EL TUYO NO VE AGUA PERO OTRO SÍ, SE DICE ────────────
           Suyo, 30-08-2026 a las 14:25, probando los cinco modelos uno a
           uno y mirando este recuadro: *«el icon marca agua y el europeo
           en el dibujo de la franja de 14h tarde los otros arome no
           marca»*.

           MEDIDO esa tarde en Bermeo, franja de 14 a 20 h, por las dos
           vías: ECMWF 2,3 mm y GFS 0,8 mm; Automático, ICON y AROME HD
           0,0. O sea que el desacuerdo era real, y el recuadro solo
           enseñaba «Sin lluvia · 0,0 mm».

           No se toca el número —es el de su modelo, y él lo ha elegido—:
           al lado va quién ve agua, con el mismo gesto que ya usan las
           nubes en este mismo renglón. En «Torre» esto ya estaba; aquí
           faltaba. */
        (() => {
          if (has(mm) && mm >= 0.1) return '';
          const o = lluviaEnLaFranjaQueNoVesTu(sel[0].date, sel[sel.length - 1].date);
          if (!o) return '';
          return ` <span class="nd__ojo">⚠ ${esc(o.quien)} sí (${mmTxt(o.mm)} mm${o.cuando ? `, ${o.cuando}` : ''})</span>`;
        })()}`
      /* ── Y A QUÉ ALTURA, QUE SI NO SON DOS CIFRAS SIN DUEÑO ────────
         Cazado el 30-08-2026 comparando dos pantallazos suyos de la
         misma hora: aquí ponía **«Racha máx 47 km/h»** y en «Mis torres»,
         para el mismo sitio y el mismo día, **«Racha máxima 39»**. La
         del día no puede ser menor que la de la tarde.

         Los dos números eran BUENOS y eran de alturas distintas: 39 es
         el peor de los cinco modelos **a 10 m**, y 47 es ese mismo 39
         llevado a su altura de trabajo (39 × 1,19 = 46,4). Ninguno de
         los dos lo decía.

         Es el mismo motivo por el que la tabla de «Mis torres» lleva
         escrito «a 10 m» en la cabecera desde que él preguntó *«¿es a
         10 m o qué significa?»*. Aquí faltaba. */
      }${vTxt ? `<br>Viento ${vTxt}<small> a ${S.hgt} m</small>` : ''}${gm > 0 ? `<br>Racha máx ${wtxt(gm, true)}<small> a ${S.hgt} m${gmCuando}</small>` : ''}${
        avisoTormentaFranja(sel)}</div></div>`;
  }).join('');

  /* ── EL COLOR DE «AHORA» ────────────────────────────────────────────
     Suyo, 26-08-2026: «luego en ahora pones bonito con colores que se
     vean bien».

     El color **significa algo o no se pone**. Una tarjeta naranja porque
     queda bonito es peor que gris: enseña a no hacer caso al naranja, y
     el naranja es lo que tiene que parar a un operario.

     Y los listones NO me los invento:
       · viento, ráfaga y lluvia salen de SUS umbrales (`S.thr`), los
         mismos que usa el semáforo de las torres. Si él los cambia en
         Ajustes, esto cambia con ellos.
       · la visibilidad va con la definición de niebla de AEMET
         (menos de 1 km es niebla; menos de 200 m, niebla densa).
       · el UV, con la escala de la OMS.
     Lo que no tiene un listón defendible se queda gris. */
  /* ── LO LARGO SE LEE A LO ANCHO ───────────────────────────────────
     Suyo, 29-08-2026, con una foto de la casilla de Precipitación:
     *«aquí, en vez de vertical, ¿se podría poner de derecha a izquierda
     para su mejor lectura?»*.

     Y tenía razón: el aviso —«Automático no ve agua · GEM, ARPEGE,
     ECMWF, HARMONIE y GFS sí (sirimiri)»— se estrujaba en una columna de
     132 px, saliendo en ocho renglones de dos palabras, **teniendo el
     hueco de al lado vacío**. Un texto que se lee en zigzag no se lee.

     EL CORTE ESTÁ EN 45, MEDIDO. La primera vez lo puse en 90 y no
     saltaba: ese aviso tiene 74 caracteres. Contados los de esa misma
     pantalla suya —los tres que se estrujaban eran de **74, 86 y 109**,
     y los que se leían bien de **7, 25 y 28**—, el corte cae limpio en
     45. Es su queja de siempre —*«pequeño, con todo el sitio que hay»*—
     aplicada al ancho en vez de al tamaño de letra. */
  const dt = (k, v, s, st) => {
    const largo = s && s.replace(/<[^>]*>/g, '').length > 45;
    return `<div class="dt${largo ? ' dt--ancha' : ''}"${
      st && st !== 'go' ? ` data-st="${st}"` : ''}>
    <div class="dt__k">${k}</div>
    <div class="dt__v">${v}</div>${s ? `<div class="dt__s">${s}</div>` : ''}</div>`;
  };

  const porUmbral = (val, warn, no) => !has(val) ? null
    : val >= no ? 'no' : val >= warn ? 'warn' : 'go';

  /* La visibilidad va al revés: cuanto menos, peor. */
  const stVis = m => !has(m) ? null : m < 200 ? 'no' : m < 1000 ? 'warn' : 'go';
  const txtVis = m => !has(m) ? '' : m < 200 ? 'Niebla densa'
    : m < 1000 ? 'Niebla' : m < 4000 ? 'Bruma' : '';

  const stUv = u => !has(u) ? null : u >= 8 ? 'no' : u >= 6 ? 'warn' : 'go';
  const txtUv = u => !has(u) ? '' : u >= 11 ? 'Extremo — no estar al sol'
    : u >= 8 ? 'Muy alto — crema y gorra' : u >= 6 ? 'Alto'
    : u >= 3 ? 'Moderado' : 'Bajo';

  const uvHoy = fc.daily?.uv_index_max?.[0];

  /* ── LO QUE FALTABA EN «AHORA» ────────────────────────────────────────
     Suyo, 30-08-2026, con la pantalla delante: *«EN AHORA NO VEO LISTADO
     DE CAPE NI LLUVIA»* y *«cuando no trabajo, para mirar de un vistazo
     hay que añadir más cosas: lo utilizaría para diario, ir a monte,
     surf, senderismo — tiene que haber info»*.

     Tenía razón: la tormenta solo salía en «Torre» y en «Mis torres»,
     que son las pantallas de trabajo. Un domingo que se va al monte no
     entra ahí.

     NO CUESTA NI UNA PETICIÓN MÁS: `cape`, la tapa, el isocero, el
     viento a 120 m y la nieve **ya venían** en la misma consulta desde
     hace días. Solo faltaba enseñarlos. */
  const capeTxt = !has(c?.cape) ? '' : c.cape >= (S.thr?.capeNo ?? 1000) ? 'alta'
    : c.cape >= (S.thr?.capeWarn ?? 300) ? 'moderada' : 'baja';
  const tapaTxt = !has(c?.cin) ? ''
    : c.cin < 25 ? 'Sin tapa: si hay CAPE, rompe'
    : c.cin < 50 ? 'Tapa floja'
    : c.cin < 200 ? 'Tapa que aguanta' : 'Tapa fuerte';
  /* El mismo listón que usa el vigilante: CAPE ≥ 700 con la tapa por
     debajo de 75. Un número distinto aquí y allí sería otro renglón que
     dice una cosa mientras el aviso dice otra. */
  const tormenta = has(c?.cape) && has(c?.cin) && c.cape >= 700 && c.cin < 75;

  /* ── CUÁNDO EMPIEZA A LLOVER, no solo cuánto cae ahora ───────────────
     «0,0 mm» con nubarrones encima no le dice nada. Lo que sirve es la
     hora. Se mira en las próximas 24 h, que es lo que dura una salida. */
  const proxima = (() => {
    for (let i = 1; i < Math.min(25, hrs.length); i++)
      if (has(hrs[i].prec) && hrs[i].prec >= (S.thr?.rainWarn ?? 0.2)) return hrs[i];
    return null;
  })();
  const agua24 = hrs.slice(0, 24).reduce((a2, h) => a2 + (has(h.prec) ? h.prec : 0), 0);

  $('#det').innerHTML = [
    dt('Viento a 10 m de altura', has(C.wind_speed_10m) ? `${wtxt(C.wind_speed_10m)}<small> ${wu().lbl}</small>` : nd,
       has(C.wind_direction_10m) ? `del ${rumboLargo(C.wind_direction_10m)}` : '',
       porUmbral(C.wind_speed_10m, S.thr.windWarn, S.thr.windNo)),
    /* La ráfaga es la que decide, no la media: lo que tumba a alguien en
       un mástil es el golpe, no el promedio de la hora. Por eso lleva su
       listón dicho al lado. */
    (() => {
      /* Mismo gesto que el cielo y que la lluvia: el número es el suyo y
         no se toca; al lado, quién se separa. Ver `rachaQueNoVesTu()`. */
      const r = has(C.wind_gusts_10m) ? rachaQueNoVesTu(C.wind_gusts_10m) : null;
      return dt('Ráfaga a 10 m de altura',
        has(C.wind_gusts_10m)
          ? `${wtxt(C.wind_gusts_10m)}<small> ${wu().lbl}</small>${avisoRacha(C.wind_gusts_10m, { corto: true })}`
          : nd,
        /* EL PIE NO REPITE EL NÚMERO QUE YA ESTÁ ARRIBA. Visto en pantalla
           al verificarlo el 30-08-2026: la casilla decía «10 km/h ⚠ ICON
           55 km/h» y justo debajo «ECMWF da 10 km/h y ICON 55 km/h». Dos
           veces lo mismo en cuatro centímetros. En este mismo proyecto ya
           está escrito por qué no vale: *«decir dos veces lo mismo es
           ruido»*. Arriba va el dato; aquí, lo que significa. */
        !has(C.wind_gusts_10m) ? ''
          : r ? (r.limite
                  ? `<b>${esc(r.quien)}</b> cruza tu listón de ${wtxt(r.limite, true)}`
                    + ` y ${esc(modeloDato().name)} no`
                  : `<b>${esc(r.quien)}</b> se separa ${difVista(r.suya, r.mia, true)} de tu modelo`)
                + ` · tu listón: ${wtxt(listonRafaga().warn, true)} / ${wtxt(listonRafaga().no, true)}`
              : `Tu listón: ${wtxt(listonRafaga().warn, true)} / ${wtxt(listonRafaga().no, true)}`,
        /* Si otro cruza un listón que el tuyo no cruza, la casilla se pone
           en ámbar: el número sigue siendo verde para TU modelo, pero la
           certeza ya no la hay, y eso es lo que hay que pintar. Mismo
           criterio que las horas rayadas de la barra de Torre. */
        r && r.limite ? 'warn' : porUmbral(C.wind_gusts_10m, listonRafaga().warn, listonRafaga().no));
    })(),
    dt('Humedad', show(C.relative_humidity_2m, '%')),
    /* EL MISMO NÚMERO SIRVE PARA DOS COSAS, y hasta hoy solo se decía
       una. La que había: si el rocío se pega a la temperatura, el aire
       está saturado y **condensa sobre el metal** — el resbalón con el
       cielo despejado. La que faltaba, suya del 29-08-2026: *«con eso se
       sabe si hay bochorno»*, y eso decide si sus operarios aguantan
       dentro de una caseta o en una azotea. Se dicen las dos, que es el
       mismo dato leído para dos trabajos distintos. */
    dt('Punto de rocío', show(c?.dew, '°C'),
       [has(c?.dew) && has(C.temperature_2m) && C.temperature_2m - c.dew <= 2
          ? 'Pegado a la temperatura: aire saturado, condensa sobre el metal' : '',
        has(c?.dew) ? `Para el calor: <b>${esc(comoSeSiente(c.dew))}</b>` : '',
       ].filter(Boolean).join('<br>'),
       has(c?.dew) && c.dew >= 18 ? 'warn' : ''),
    dt('Presión', show(C.pressure_msl ?? C.surface_pressure, 'hPa'),
       has(C.pressure_msl) ? 'Reducida al nivel del mar' : 'En superficie'),
    /* La nubosidad, con quién la acompaña. El 28-08-2026 él mandó una
       foto del cielo de Bermeo, azul, y el Automático marcaba 100 % con
       0 % la hora antes y 0 % la hora después. Seis de siete daban 0-6.
       No se toca el número; se dice quién lo ve y quién no. */
    (() => {
      const raro = cieloRaro(C.cloud_cover);
      /* Se dice el ABANICO entero, que es lo que de verdad informa: «los
         modelos van de 0 a 100 %» se entiende sin explicar nada, y le
         dice que mire por la ventana — que es exactamente lo que hizo el
         28-08 para cazar este fallo. */
      const cap = nubesPorCapas(C);
      const R = distanciaRejilla();
      const lejos = R && R.km >= 8;
      const l = [];
      /* HAY MODELOS QUE NO PUBLICAN EL TOTAL, Y CALLARLO PARECE UNA APP ROTA.
         Suyo, 28-08-2026: *«en AguaceroWx solo funciona nubosidad con ICON
         y GFS»*. Se fue a medir a 7 días y en tres sitios —Bermeo, Vitoria
         y Madrid— y salió esto:

           ICON · ECMWF · GFS · GEM   168 de 168 horas
           ARPEGE                     117 h (lo que alcanza, 4,3 días)
           HARMONIE                    79 h (lo que alcanza, 2,4 días)
           AROME HD                    NINGUNA, en los tres sitios

         **AROME HD no publica nubosidad total.** La comparativa ya lo
         descartaba bien —filtra por `has()`— así que ningún cero falso se
         estaba colando. Pero eligiendo AROME HD la fila salía en blanco sin
         explicación. Ahora se dice, y se enseñan sus capas, que ésas sí las
         tiene. No se nombra a AROME: se mira el dato, que mañana puede
         cambiar. */
      /* ── Y NO SE MEZCLAN DOS MODELOS EN LA MISMA FILA ────────────────
         Fallo mío, metido y cazado el 28-08-2026 en media hora.

         AROME HD no publica el total, así que `completar()` lo trae del
         **Automático** —eso ya estaba bien hecho y avisado desde antes—.
         Pero las capas SÍ las publica AROME, y `completar()` no las
         sustituye porque no están vacías. Resultado: el total de un
         modelo y las capas de otro, en el mismo renglón y sin decirlo.

         Va contra su norma de siempre. Cuando pasa, se dice de quién es
         cada cifra y **no se compara el uno con el otro**: el aviso de
         «el total se come la capa» no tiene sentido entre dos modelos
         distintos. */
      /* ── DE QUIÉN ES CADA CIFRA, SACADO DEL DATO ──────────────────
         Corregido el 30-08-2026, y lo cazó él en un pantallazo.

         Este aviso estaba ESCRITO A MANO —«el total es del modelo
         automático, las capas sí son de AROME HD»— y era verdad hasta
         que el día antes se repartió cada dato al modelo que lo mide.
         Desde entonces el total Y las tres capas salen los dos de ICON,
         pero el cartel seguía diciendo lo de siempre: nombraba un modelo
         que ya no era, y encima decía «son dos modelos, no los compares
         entre sí» cuando ya son el MISMO y sí se pueden comparar.

         Un texto a mano envejece con el primer cambio. Ahora se lee de
         `prestadosDe`, que es de donde salió el dato de verdad. */
      const deQuien = k => {
        const x = (fc?.prestadosDe || []).find(p => p.k === k);
        return x ? nombreDeModelo(x.de) : modeloDato().name;
      };
      const delTotal = deQuien('cloud_cover');
      /* Y su `om`, que es con lo que se mira `CAPAS_PROPIAS`. `deQuien`
         devuelve el NOMBRE de pantalla, no el id. */
      const omDelTotal = (() => {
        const x = (fc?.prestadosDe || []).find(p => p.k === 'cloud_cover');
        return x ? x.de : modeloDato().om;
      })();
      const deCapas = [...new Set(['cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high']
                        .map(deQuien))];
      const mismos = deCapas.length === 1 && deCapas[0] === delTotal;

      if (!has(C.cloud_cover) && cap) {
        l.push(`${esc(modeloDato().name)} no publica el total de nubosidad.`
             + ` Éstas son sus capas:`);
      } else if (cap && delTotal !== modeloDato().name) {
        l.push(mismos
          /* Mismo modelo: se dice de quién es y ya está. Comparar total
             y capas entre sí VUELVE a tener sentido, que es lo que este
             cartel llevaba un día prohibiendo sin motivo. */
          /* ── «SE COMPARAN» SOLO SI SON DEL MODELO ─────────────────
             Suyo, 02-09-2026, con la caja fotografiada: arriba decía «el
             total y las capas son de ECMWF… así que SÍ se comparan», y
             tres renglones más abajo «AROME HD no publica las capas: el
             13 % es una cuenta hecha con la humedad». Las dos frases en
             el mismo recuadro, negándose.

             Y la culpa estaba mal repartida: el que no publica las capas
             ahí no es AROME, es **ECMWF** —ver `CAPAS_PROPIAS`—, que es
             de quien venían. Se le echaba a AROME por usar
             `modeloDato()` en vez del dueño de verdad.

             Si las capas se las calcula Open-Meteo con la humedad, NO se
             comparan con el total: uno es dato y la otra una cuenta. */
          ? (capasPropias(omDelTotal) === false
              ? `El total y las capas son de <b>${esc(delTotal)}</b>, pero `
                + `<b>ese modelo no publica las capas</b>: se las calcula `
                + `Open-Meteo con la humedad. El total sí es suyo.`
              : `El total y las capas son de <b>${esc(delTotal)}</b> —`
                + `${esc(modeloDato().name)} no las publica—, así que sí se comparan entre sí.`)
          : `⚠ el total es de <b>${esc(delTotal)}</b> y las capas de`
            + ` <b>${esc(listar(deCapas))}</b>.`
            + ` <b>Son dos modelos: no los compares entre sí</b>`);
      }
      if (cap) {
        l.push(`Por capas: ${cap.linea}`);
        /* ── Y SI SON DE DOS MODELOS, NO SE COMPARAN. PUNTO ───────────
           Cazado el 30-08-2026 en un pantallazo suyo. La tarjeta decía
           «son dos modelos: no los compares entre sí» y **tres renglones
           más abajo los comparaba**: «las capas no explican este total,
           suman 25 % y el total dice 52 %».

           Pues claro que no lo explican: el 52 % es de ICON y el 25 % de
           AROME. Que dos modelos distintos no coincidan no es un aviso,
           es lo normal. El cartel se contradecía a sí mismo y le hacía
           dudar de un dato que estaba bien.

           Con dos modelos solo se dice qué capa manda —que es cierto
           dentro de su propio modelo— y se callan los descuadres. */
        /* Y ESTE AVISO TAMPOCO, si las capas son calculadas. Se arregló
           el `noCuadra` el 02-09-2026 y se quedó éste, que es el mismo
           caso por otra puerta: con ECMWF cargado salía «las capas no
           explican este total: suman 29 % y el total dice 97 %» — pues
           claro, el total es del modelo y las capas una cuenta de
           Open-Meteo con la humedad. Que no cuadren no es un fallo del
           modelo, y decirlo son dos renglones para no decidir nada.
           Suyo, viéndolo otra vez el 03-09. */
        if (cap.sinExplicar && mismos && capasPropias(omDelTotal) === true) {
          l.push(`⚠ <b>las capas no explican este total</b>: suman`
               + ` ${Math.round(cap.suma)} % y el total dice`
               + ` ${Math.round(C.cloud_cover)} %. No se puede decir qué capa manda`);
        } else if (cap.manda.v >= 20) {
          l.push(`Manda la de ${cap.manda.n}: ${cap.manda.que}`);
        }
        /* Y AQUÍ NO SE RECOMIENDA A CIEGAS. Ver `CAPAS_PROPIAS`: con
           ECMWF el total es el dato del modelo y las capas son una
           cuenta de Open-Meteo, así que decirle «fíate de las capas»
           sería mandarle a lo calculado por delante de lo publicado. */
        /* EL DESCUADRE SOLO SE DENUNCIA SI LAS CAPAS SON DEL MODELO.
           Con capas calculadas por Open-Meteo el descuadre es entre un
           dato y una cuenta: no es un fallo del modelo, y decirlo era
           tres renglones para no decidir nada. Que son calculadas ya se
           dice arriba, una vez. */
        if (cap.noCuadra && mismos && capasPropias(omDelTotal) === true) {
          l.push(`⚠ <b>estos dos números no cuadran</b>: el total dice`
               + ` ${Math.round(C.cloud_cover)} % y hay una capa al`
               + ` ${Math.round(cap.manda.v)} %, que es imposible — y las capas`
               + ` son suyas, así que el descuadre es del propio modelo`);
        }
      }
      if (raro) l.push(`⚠ los modelos van de ${raro.bajo} a ${raro.alto} % · mediana ${raro.mediana} %`);
      /* Y dónde lee. El 28-08 comparó nuestro ECMWF con su Windy: 45 %
         contra 15 %. Ninguno mentía —nuestro nudo de tierra cae 19 km
         adentro— pero la ficha se lo callaba. */
      if (lejos) {
        l.push(`⚠ ${esc(modeloDato().name)} lee su nudo a <b>${kmTxt(R.km)} km</b>`
             + `${R.rumbo ? ` al ${R.rumbo}` : ''}, no justo aquí`);
      }
      if (raro || lejos || cap?.noCuadra || cap?.sinExplicar) {
        l.push(`<a href="#" data-ir="satelite">míralo en el satélite</a>`);
      }
      return dt('Nubosidad', show(C.cloud_cover, '%'), l.join('<br>'),
        /* Ámbar solo cuando hay algo que mirar. Que el total venga de
           otro modelo se DICE, pero ya no pinta de ámbar: es lo normal
           desde que cada dato se le pide al que lo mide, y un ámbar
           permanente deja de significar nada. */
        (raro || (mismos && (cap?.sinExplicar || cap?.noCuadra))) ? 'warn' : '');
    })(),
    dt('Visibilidad', has(c?.vis) ? `${kmTxt(c.vis / 1000)}<small> km</small>` : nd,
       txtVis(c?.vis), stVis(c?.vis)),
    /* EL «AHORA» DE LA LLUVIA NO PUEDE MENTIR.
       Dos veces el 26-08-2026, con él de pie en Bermeo: la app decía
       `0,0 mm` y estaba cayendo. A las 19:00 lo veía solo ECMWF; a las
       21:00, solo el Automático. **Se van turnando**, así que el que
       tenga cargado acierta unas veces sí y otras no.

       No se toca el número —es el dato del modelo y se respeta— pero al
       lado va lo que ven los demás. Un cero pelado con agua encima es de
       los que hacen subir a alguien a un mástil mojado. */
    (() => {
      const otro = lluviaQueNoVesTu({ prec: C.precipitation });
      const pie = !otro ? 'En la última hora'
        : otro.quien
          ? `⚠ ${esc(nombreDeModelo(duenoLluvia()))} no ve agua · <b>${esc(otro.quien)}</b> sí`
            + (otro.sirimiri ? ' (sirimiri)' : ` (${mmTxt(otro.mm)} mm/h)`)
            + (otro.soloEnTorre
               ? ` · ${esc(otro.soloEnTorre)} no está en este selector: sale en Torre`
               : '')
          /* Él mismo, en la celda de al lado. No es «otro modelo». */
          : `⚠ ${esc(nombreDeModelo(duenoLluvia()))} no ve agua aquí, pero <b>sí en la celda`
            + ` de al lado</b> (${mmTxt(otro.enLaOtraCelda)} mm/h)`;
      /* EL NÚMERO NO PUEDE IR SOLO. Suyo, 30-08-2026: *«pone 0mm pero ya
         te esta diciendo que 2 marcan agua entonces ese 0mm creo que no
         pinta no?»*. El aviso estaba —debajo—, pero lo que se lee de un
         vistazo es el número grande, y un «0 mm» limpio es calma.
         En «Torre» esta misma casilla ya ponía «Sin lluvia» con el aviso
         al lado; aquí el 0 iba desnudo. Se le pega la marca corta, la
         misma que usan las nubes. El dato no se toca. */
      const marca = otro && otro.quien
        ? ` <span class="nd__ojo">⚠ ${esc(otro.quien)} sí</span>` : '';
      return dt('Precipitación', showLluvia(C.precipitation) + marca, pie,
        otro ? 'warn' : porUmbral(C.precipitation, S.thr.rainWarn, S.thr.rainNo));
    })(),

    /* CUÁNDO, no solo cuánto. Ver arriba.
       Y SI EL TUYO NO LA VE, SE MIRA QUIÉN SÍ. Suyo, 30-08-2026:
       *«proxima lluvia no se espera...eso mal no?»*. Decía «no se
       espera» en verde mientras la casilla de al lado avisaba de que dos
       modelos veían sirimiri. Ver `lluviaQueVieneYNoVesTu()`. */
    (() => {
      if (proxima) {
        return dt('Próxima lluvia',
          `${String(proxima.date.getHours()).padStart(2, '0')}:00`,
          `${mmTxt(proxima.prec)} mm esa hora · ${mmTxt(agua24)} mm en 24 h`,
          'warn');
      }
      if (agua24 >= 0.2) {
        return dt('Próxima lluvia', 'ya',
          `${mmTxt(agua24)} mm en las próximas 24 h`, 'warn');
      }
      /* El modelo cargado no ve nada. Antes se cerraba en falso con un
         «no se espera» en verde. Ahora se pregunta a los demás. */
      const otra = lluviaQueVieneYNoVesTu();
      if (otra) {
        return dt('Próxima lluvia',
          `${String(otra.hora.getHours()).padStart(2, '0')}:00<small> según otros</small>`,
          `⚠ ${esc(nombreDeModelo(duenoLluvia()))} no la ve · <b>${esc(otra.quien)}</b> sí`
            + ` (${mmTxt(otra.mm24)} mm en 24 h)`
            + (otra.soloEnTorre
               ? ` · ${esc(otra.soloEnTorre)} no está en este selector: sale en Torre`
               : ''),
          'warn');
      }
      /* Aquí sí: NINGUNO de los siete ve agua. Ahora «no se espera»
         significa lo que dice. */
      return dt('Próxima lluvia', 'no se espera',
        `${mmTxt(agua24)} mm en 24 h · ninguno de los modelos la ve`, 'go');
    })(),

    /* LA TORMENTA, TAMBIÉN AQUÍ. Estaba solo en las pantallas de trabajo
       y un domingo en el monte no entra ahí. */
    (() => {
      const otro = tormenta ? null : tormentaQueNoVesTu(c);
      return dt('Tormenta', has(c?.cape) ? `${Math.round(c.cape)}<small> de CAPE</small>` : nd,
        [capeTxt ? `Inestabilidad ${capeTxt}` : '', tapaTxt,
         tormenta ? '<b>gasolina y sin tapa: puede romper</b>' : '',
         otro ? `<span class="nd__ojo">⚠ ${esc(otro.quien)} ve tormenta: CAPE ${Math.round(otro.cape)} · tapa ${Math.round(otro.cin)}</span>` : '']
          .filter(Boolean).join(' · '),
        tormenta ? 'no' : otro ? 'warn' : has(c?.cape) && c.cape >= (S.thr?.capeWarn ?? 300) ? 'warn' : 'go');
    })(),

    /* ── EN LO ALTO DE LA TORRE ─────────────────────────────────
       El viento a 10 m es el de la caseta. Esta tarjeta decía el de
       120 m «para la campa», y él lo cortó de raíz desde Calpe,
       08-09-2026: *«no está bien, las torres miden 50 metros. No 120»*.
       Y de paso lo de siempre: *«lo que me interesa en Mis estaciones es
       lo que me voy a encontrar en la caseta base»* — eso no se toca,
       sigue a 10 m. Aquí va lo alto de la torre: 50 m, estimado con
       windAt() entre los niveles que publica el modelo (10 y 80 m), y
       dicho que es estimado. Sirve para el día que decida subir; la
       decisión es suya. */
    (() => {
      const r = c?.levels ? windAt(TORRE_ALTO_M, c.levels) : { v: null };
      const soloSuelo = r.note === 'solo-10' || r.note === 'bajo-suelo';
      const v = soloSuelo ? null : r.v;
      const de = (fc?.prestadosDe || []).find(x => x.k === 'wind_speed_80m');
      return dt('Viento arriba',
        has(v) ? `${wtxt(v)}<small> ${wu().lbl}</small>` : nd,
        has(v)
          ? `A ${TORRE_ALTO_M} m, lo alto de la torre${r.exact ? '' : ' · estimado entre los 10 y los 80 m del modelo'}${
              de ? ` · de ${esc(nombreDeModelo(de.de))}` : ''}`
          : 'El modelo solo publica el viento a 10 m: arriba no se puede estimar',
        porUmbral(v, S.thr.windWarn ?? 45, S.thr.windNo ?? 60));
    })(),

    /* El isocero: por dónde anda la cota de nieve y el frío de verdad.
       Vale para el monte en invierno y para saber si arriba hiela. */
    dt('Isocero', has(c?.frz) ? `${Math.round(c.frz)}<small> m</small>` : nd,
       has(c.frz)
         ? (c.frz < 1000 ? 'Bajo: puede nevar en el monte'
            : c.frz < 1600 ? 'Frío arriba' : 'Alto: no hiela en la sierra')
         : '',
       has(c.frz) && c.frz < 1000 ? 'warn' : 'go'),

    /* Y lo que de verdad se nota en la piel andando o en el agua. */
    dt('Sensación', has(c?.feels) ? `${c.feels.toFixed(0)}<small> °C</small>` : nd,
       has(c?.feels) && has(c?.temp)
         ? (c.feels - c.temp <= -3 ? 'Más frío de lo que marca: viento'
            : c.feels - c.temp >= 3 ? 'Más calor: humedad y sol'
            : 'Como marca el termómetro')
         : ''),
  ].join('') + (() => {
    /* CADA FRASE, SOLO CUANDO ES VERDAD. Con el Automático cargado, la
       nota antigua habría dicho «Automático no publica todo» —falso: lo
       publica todo, mal cosido— y «el viento gana 5,6 km/h» —falso: ese
       número es del marcador de AROME—. Cazado el 30-08-2026 al quitarle
       el cielo al Automático. */
    if (!fc.suplidas?.length) return '';
    const normales = (fc.prestadosDe || []).some(x => !x.porAcierto);
    const cab = normales
      ? `<b>${esc(modeloDato().name)} no publica todo</b>, así que
         cada dato se le pide al que sí lo publica:<br>${deQuienSale(fc).join('<br>')}<br>`
      : '';
    const viento = modeloDato()?.om === 'meteofrance_arome_france_hd'
      ? `<b>El viento y la ráfaga sí son de ${esc(modeloDato().name)}</b>, que es en lo
         que gana: 5,6 km/h de error contra el aparato.`
      : '';
    return `<p class="det__nota">${cab}${viento}${fraseLluviaPorAcierto(fc)}${fraseCieloDelAutomatico(fc)}</p>`;
  })()
    /* ── Y SI ALGÚN NÚMERO ERA IMPOSIBLE, TAMBIÉN ────────────────────
       Solo cuando se ha tenido que TIRAR algo: pegar un −10 al cero es
       ruido y no merece un cartel, pero un dato que hubo que quitar sí,
       porque deja un hueco y él tiene que saber por qué está. */
    + ((fc.imposibles || []).some(x => x.tirados) ? `<p class="det__nota det__nota--avisa">
        <b>Algún número no era posible y se ha quitado.</b> ${esc(listar(
          fc.imposibles.filter(x => x.tirados).map(x =>
            `${NOMBRES_COMPL[x.campo] || x.campo} (${x.tirados} h, lo peor ${x.peor})`)))}.
        Donde falta, falta de verdad: es mejor el hueco que un número que no puede ser.</p>` : '')
    /* ── Y SI EL RELLENO LARGO SE HA CAÍDO, DESDE QUÉ HORA ───────────
       Revisión del 04-09-2026: `completarLargo()` apuntaba el fallo en
       `rellenoFallo` y nadie lo leía. Aquí, junto a la nota de arriba. */
    + notaRellenoFallo(fc)
    /* ── Y SI HOY SE HA CAÍDO ALGUNO, SE DICE ────────────────────────
       Un rescate callado es tan malo como el fallo: él tiene que saber
       que hoy el dato viene de otro sitio, sobre todo si es el CAPE. */
    + (fc.seCayo?.length ? `<p class="det__nota det__nota--avisa">
        <b>Hoy uno no ha contestado.</b> ${esc(listar(fc.seCayo.map(x =>
          `${NOMBRES_COMPL[x.k] || x.k}, que da ${nombreDeModelo(x.muerto)},
           lo ha traído ${nombreDeModelo(x.salvo)}`)))}.
        No es un fallo de la app: ese modelo no ha publicado ese dato hoy.</p>` : '');

  // Sol
  const sr = fc.daily?.sunrise?.[0], ss = fc.daily?.sunset?.[0];
  const hm = s => s ? s.slice(11, 16) : null;
  $('#sun').innerHTML = `<div class="det">
    ${dt('Amanecer', hm(sr) ?? nd)}${dt('Atardecer', hm(ss) ?? nd)}
    ${dt('UV máx hoy', show(uvHoy, '', 1), txtUv(uvHoy), stUv(uvHoy))}</div>`;

  // Aire
  const A = S.data.aq?.current;
  $('#aq').innerHTML = A ? [
    dt('Índice europeo', show(A.european_aqi), A.european_aqi <= 20 ? 'Bueno'
      : A.european_aqi <= 40 ? 'Aceptable' : A.european_aqi <= 60 ? 'Moderado'
      : A.european_aqi <= 80 ? 'Pobre' : 'Muy pobre',
      porUmbral(A.european_aqi, 60, 80)),
    dt('PM2.5', show(A.pm2_5, 'µg/m³', 1)),
    dt('PM10', show(A.pm10, 'µg/m³', 1)),
    dt('Ozono', show(A.ozone, 'µg/m³')),
  ].join('') : `<p class="note">Calidad del aire no disponible para este punto.</p>`;

  pintarMarAhora(dt);
}

/* ── LA MAR, EN LA PORTADA ────────────────────────────────────────────
   Suyo, 29-08-2026: *«abajo de Sol y aire hay que poner oleaje etc»* ·
   **«hay sitio»** · *«cómo está la mar, oleaje, altura de ola»* ·
   *«datos, datos, lo que digo siempre»*.

   Y hay sitio de verdad: ese panel se quedaba medio vacío. Él **hace
   surf y kayak**, y hasta hoy para ver la mar tenía que irse a otra
   pestaña — cuando «Ahora» es la que abre por defecto y la que mira de
   un vistazo.

   LA CLAVE ES EL PERIODO, no solo la altura. **1,4 m con 8 segundos y
   1,4 m con 4 no son lo mismo**: uno es mar de fondo con forma y el otro
   marejadilla picada. Se dan los dos, y la palabra al lado — pero la
   escala es la de siempre del mar, no un listón inventado por nosotros,
   y no decide nada: decide él.

   Si el punto no es de costa, no se pinta nada. Nada de huecos. */
function pintarMarAhora(dt) {
  const el = $('#marAhora');
  if (!el) return;
  const M = S.data?.mar;
  const C = M?.current;
  if (!C || !has(C.wave_height)) { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;

  const T = C.wave_period;
  /* Cómo se llama esa mar. Escala marina de siempre: por debajo de 6 s es
     mar de viento —corta y picada—; de 8 para arriba, mar de fondo. */
  const forma = !has(T) ? ''
    : T < 6 ? 'mar de viento: corta y picada'
    : T < 8 ? 'entre viento y fondo'
    : T < 11 ? 'mar de fondo: con forma'
    : 'fondo largo, olas bien formadas';

  const mx = M.hourly?.wave_height?.slice(0, 24).filter(has);
  const pico = mx?.length ? Math.max(...mx) : null;

  el.innerHTML = [
    dt('Altura de ola', show(C.wave_height, 'm', 1),
       [rumboLargo(C.wave_direction) ? `Del ${rumboLargo(C.wave_direction)}` : '',
        has(pico) && pico > C.wave_height + 0.2
          ? `Sube a <b>${pico.toFixed(1).replace('.', ',')} m</b> en las próximas 24 h` : '',
       ].filter(Boolean).join('<br>')),
    dt('Periodo', show(T, 's', 1), forma),
    /* ── LAS MAREAS, PEDIDAS POR ÉL AQUÍ MISMO ──────────────────────
       31-08-2026, señalando esta columna: «en la parte derecha falta
       poner horas de bajamar y pleamar». Las dos próximas, de la MISMA
       tabla oficial de Euskalmet que usa la pestaña Mar — nunca una
       marea calculada. Si la tabla no está cargada aún, no se inventa
       hueco: simplemente no salen hasta que llegue. */
    ...proximasMareas(2).map(e =>
      dt(e.tipo === 'high' ? '▲ Pleamar' : '▼ Bajamar',
         `${esc(e.hora)}`,
         `${esc(e.cuando.toLocaleDateString('es', { weekday: 'short' }))} · ${e.altura.toFixed(2).replace('.', ',')} m · tabla oficial`)),
    dt('Temp. del agua', show(C.sea_surface_temperature, '°C', 1)),
    dt('Mar de fondo', show(M.hourly?.swell_wave_height?.[0], 'm', 1),
       [has(C.swell_wave_period) ? `Periodo ${C.swell_wave_period.toFixed(1).replace('.', ',')} s` : '',
        'La que viene de lejos, por debajo de la del viento'].filter(Boolean).join('<br>')),
    /* ── Y LO QUE DE VERDAD DISTINGUE UN DÍA DE OTRO ─────────────────
       Puesto el 29-08-2026 al ver que la tarjeta se quedaba con cuatro
       cifras y medio panel en blanco —su norma: «vacío jamás nada»—.

       Pero no es relleno: **el mar de viento contra el de fondo es lo
       que separa una mar con forma de una picada**, y él hace surf y
       kayak. Medido en Bermeo esa noche: fondo 1,2 m y viento 0,02 —
       mar limpia—. Con esos dos números al lado se ve solo. */
    dt('Mar de viento', show(C.wind_wave_height, 'm', 1),
       has(C.wind_wave_height)
         ? (C.wind_wave_height < 0.2 ? 'Casi nada: la mar está limpia'
            : C.wind_wave_height >= (C.swell_wave_height ?? 0) ? 'Manda el viento: picada'
            : 'La levanta el viento de aquí')
         : ''),
    dt('Corriente', show(C.ocean_current_velocity, 'm/s', 1),
       'Del agua, no del viento'),
  ].join('');
}

/* ---------- 10. Render: HORAS y DÍAS ---------- */

/* ── HASTA DÓNDE LLEGA EL MODELO QUE LLEVAS ──────────────────────────
   Puesto el 29-08-2026 al poner AROME por defecto. AROME HD es el mejor
   en racha —medido— pero **solo llega a unas 48 h**. Pasado eso no hay
   dato, y un hueco no puede leerse como «no pasa nada».

   El Automático resolvía esto **cambiando de modelo por su cuenta y sin
   decirlo**, que es justo lo que él quitó hoy. Aquí se hace al revés: se
   dice hasta cuándo llega y a partir de dónde hay que mirar otro. */
function hastaDondeLlega(fc) {
  const H = fc?.hourly;
  if (!H?.time?.length) return null;
  const g = H.wind_gusts_10m || H.temperature_2m;
  if (!g) return null;
  let ultimo = -1;
  for (let i = 0; i < H.time.length; i++) if (has(g[i])) ultimo = i;
  if (ultimo < 0) return null;
  const fin = new Date(H.time[ultimo]);
  const horas = Math.round((fin - Date.now()) / 3600e3);
  /* Solo es noticia si se queda corto de verdad: los globales llegan a
     10 días y ahí no hay nada que avisar. */
  if (horas > 120) return null;
  return { fin, horas };
}

/* El nombre bonito de un modelo a partir de su id de Open-Meteo. Estaba
   escrito a mano en la nota del alcance; ahora lo usan dos sitios. */
function nombreDeModelo(om) {
  return COMPARAR.find(m => m.om === om)?.name
      || MODELS.find(m => m.om === om)?.name || 'otro modelo';
}

function avisoAlcanceModelo(fc) {
  const a = hastaDondeLlega(fc);
  if (!a) return '';
  const cuando = a.fin.toLocaleString('es', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  /* ── Y DE AHÍ EN ADELANTE, EL QUE LLEGUE ─────────────────────────────
     Suyo, 29-08-2026, y mejor que lo que yo tenía escrito: *«pues si
     solo llega a 2 días, el resto mete el que llega, pero siempre se
     actualizará, y en 2 días al menos tenemos lo bueno»*.

     Yo iba a dejar los días 3 al 10 en blanco con un cartel. Un hueco no
     sirve para nada: mejor **lo mejor en su ventana y algo decente
     después**, con la raya bien marcada de dónde acaba uno y empieza el
     otro. Se rellena con `RELLENO_LARGO` en `completarLargo()`. */
  const relleno = fc?.rellenoDesde ? nombreDeModelo(RELLENO_LARGO) : null;
  return `<p class="note note--avisa">
    <b>${esc(modeloDato().name)} llega hasta ${esc(cuando)}</b> —unas ${a.horas} h—,
    y es el que mejor acierta en tus sitios: 5,6 km/h de error contra el aparato.
    ${relleno
      ? `De ahí en adelante lo que ves es de <b>${esc(relleno)}</b>, que sí llega.
         <b>Los dos primeros días son los buenos</b>; lo de más allá, para hacerse una idea.
         ${fc?.rellenoDe2?.length
           ? `Y ${esc(listar(fc.rellenoDe2.map(k => NOMBRES_COMPL[k] || k)))} sale de
              <b>${esc(nombreDeModelo(RELLENO_2))}</b>, que es el único que lo publica.`
           : ''}`
      : `De ahí en adelante <b>no hay dato suyo</b>.`}</p>`;
}

function renderHours() {
  const hrs = S.data.hours;
  const av = $('#avisoAlcance');
  if (av) av.innerHTML = avisoAlcanceModelo(S.data?.fc);
  drawGraph($('#graph'), hrs);
  $('#hlist').innerHTML = hrs.slice(0, 48).map(h => `
    <div class="hcard" data-s="${h.st}">
      <div class="hcard__h">${String(h.date.getHours()).padStart(2,'0')}:00</div>
      <div class="hcard__d">${h.date.toLocaleDateString('es',{weekday:'short'})}</div>
      <div class="hcard__i">${(v => icon(v.code, v.dia))(cieloVisto(h))}</div>
      <div class="hcard__t">${has(h.temp) ? `${h.temp.toFixed(0)}°` : '—'}</div>
      <div class="hcard__r">
        <span>💧 ${has(h.pop) ? h.pop + '%' : '—'} · ${has(h.prec) ? mmTxt(h.prec) + ' mm' : 'sin dato'}${
          (c => c !== null ? ` <span class="nd__ojo">⚠ ${esc(h.cieloDe || 'otro modelo')} ve ${esLlovizna(c) ? 'llovizna' : 'lluvia'}</span>` : '')(aguaPrestada(h))}</span>
        <span>💨 ${has(h.wind) ? wtxt(h.wind, true) : '—'} · ${has(h.dir) ? 'del ' + rumboLargo(h.dir) : '—'}</span>
        <span class="faint">Rocío ${has(h.dew) ? h.dew.toFixed(0)+'°' : '—'} · HR ${has(h.hum) ? h.hum+'%' : '—'}</span>
      </div>
      <div class="hcard__g">Racha ${has(h.gust) ? wtxt(h.gust, true) : '—'}</div>
      ${lineaCapeHora(h)}
    </div>`).join('');
}

/* ── CAPE Y TAPA, HORA A HORA ───────────────────────────────────────
   Suyo, 28-08-2026, señalando esta pantalla: *«aquí falta poner si habrá
   CAPE, inhibición, etc.»*. Y con su regla delante: *«tú me pones los
   valores y yo valoraré qué hacer»*.

   Así que van los DOS NÚMEROS y una palabra, y ningún veredicto. La
   palabra de la tapa sale de `textoTapa()`, que es la misma escala que
   ya usa el mapa —sin tapa / floja / aguanta / fuerte—: una escala y no
   dos que aprenderse.

   Cuando se cumplen a la vez las dos condiciones calibradas —CAPE de 700
   para arriba y tapa por debajo de 75— la línea se pone en ámbar y se
   dice qué significa esa pareja. **No cambia el semáforo ni veta nada**:
   es un número más para que decida él.

   Y si el modelo NO publica la tapa —pasa a menudo, y el tope de la nube
   un tercio de las horas— se dice «no la publica». Un hueco se lee como
   «no hay tapa», que es justo lo contrario de no saberlo. Misma regla
   que el pulso del vigilante: sin dato se dice sin dato. */
function lineaCapeHora(h) {
  if (!has(h.cape) && !has(h.cin)) return '';
  const rompe = has(h.cape) && h.cape >= CAPE_COMBINACION && has(h.cin) && h.cin < 75;
  const cape = has(h.cape) ? `CAPE ${h.cape.toFixed(0)}` : 'CAPE: no lo publica';
  /* OJO CON LA PALABRA CUANDO SALTA LA REGLA, que si no se repite el lío
     que él cazó esta misma mañana. `textoTapa()` llama «aguanta» a todo
     lo que está entre 50 y 200, y la regla calibrada rompe por debajo de
     75: con la tapa en 68 saldría «tapa 68 (aguanta) — la tapa no la
     sujeta» en la MISMA línea. Eso es «coinciden, no coinciden» otra vez.

     Así que cuando salta la regla no se pone la palabra: se dicen los dos
     números y los dos listones, y ya se ve por qué salta. Las dos escalas
     se quedan como están —la palabra es de la escala del mapa y el 75 es
     de lo medido—, pero no se pisan en la misma frase. */
  const tapa = !has(h.cin) ? 'tapa: no la publica'
             : rompe       ? `tapa ${h.cin.toFixed(0)}`
                           : `tapa ${h.cin.toFixed(0)} (${textoTapa(h.cin)})`;
  return `<div class="hcard__c${rompe ? ' hcard__c--ojo' : ''}">${cape} · ${tapa}${
    rompe ? ` — los dos a la vez: CAPE de ${CAPE_COMBINACION} para arriba`
          + ' y tapa por debajo de 75' : ''}</div>`;
}

/* ── EL DIBUJO DE UN DÍA, POR EL MISMO CAMINO QUE TODO (09-09-2026) ───
   Las horas del día salen de horaDe() —las mismas que «Horas» y «Mis
   estaciones»— y el dibujo de resumenCielo(), la misma que pinta las
   franjas de «Ahora». Antes esta tarjeta montaba sus horas a mano (sin
   codigoAjeno, sin day) y medía el cielo con otra regla: por eso «10
   días» podía decir una cosa y «Horas» otra. El código diario del modelo
   sigue sin usarse como dibujo (regla del 04-09): sin horas con dato,
   hueco honesto. Sin horas de 6 a 20 pero con horas de noche, la luna. */
function iconosDelDia(dia) {
  const hs = horasDelDia(S.data?.fc, dia);
  const conDato = hs.filter(h => has(codigoQueSeVe(h, h.code)));
  let deNoche = false;
  let delDia = conDato.filter(h => h.date.getHours() >= 6 && h.date.getHours() <= 20);
  if (!delDia.length) {
    delDia = conDato.filter(h => h.date.getHours() >= 21 || h.date.getHours() <= 5);
    deNoche = true;
  }
  if (!delDia.length) return SIN_DIBUJO;
  const R = resumenCielo(delDia);
  if (!R || !has(R.code)) return SIN_DIBUJO;
  const d = deNoche ? 0 : 1;
  /* Un icono por tramo, sin elegir (09-09-2026): ver la franja de «Ahora».
     En la tarjeta del día el rótulo es la hora en que empieza cada tramo,
     que es lo que cabe. */
  if (!R.partes || R.partes.length < 2) return icon(R.code, d);
  return `<span class="dcard__ii" data-n="${R.partes.length}">${
    R.partes.map(t => `<i>${icon(t.code, d)}<u>${has(t.desde) ? `${t.desde}h` : ''}</u></i>`).join('')}</span>`;
}

function renderDays() {
  /* Puede llamarla el repintado de la comparación a 10 días ANTES de
     que `go()` haya terminado — cazado en la segunda pasada del 31-08:
     sin este guard, S.data aún null y la pestaña entera se caía. */
  if (!S.data?.fc?.daily) return;
  const D = S.data.fc.daily;
  const avd = $('#avisoAlcanceDias');
  if (avd) avd.innerHTML = avisoAlcanceModelo(S.data?.fc);
  if (!D?.time) return;
  const all = D.temperature_2m_max.concat(D.temperature_2m_min).filter(has);
  const lo = Math.min(...all), hi = Math.max(...all), span = Math.max(hi - lo, 1);


/* ── DOS DIBUJOS POR DÍA: MAÑANA Y TARDE ────────────────────────────
     Suyo, 28-08-2026, señalando la tira de 10 días: *«estos dibujos no
     cuadran. Hoy ponéis nubes y hay un sol terrible; a lo mejor por la
     tarde. Podrías poner sol a la mañana y nuboso por la tarde: la
     lógica.»*

     Y la lógica es esa. Un solo dibujo para veinticuatro horas no puede
     ser verdad ningún día que cambie el tiempo, y aquí cambia casi todos.
     El código diario que da el modelo coge lo PEOR del día, así que una
     hora tapada a las siete de la mañana pinta nubes sobre un día de sol.

     Se parte en dos con la MISMA regla que las franjas: **el agua manda
     por lo peor; el cielo, por lo que más se repite.** Si de un día no
     hay horas —los últimos de los diez no traen detalle— se cae al código
     diario de siempre y no se inventa nada. */
  /* ── LOS DÍAS LEJANOS TAMBIÉN, NO SOLO LOS DOS PRIMEROS ────────────
     Cazado por él el 31-08-2026 a las 00:19 comparando con tiempo.com:
     *«en 10 días creo que no»*. Y no.

     MEDIDO en su caseta, cielo hora a hora de 08 a 20 h:

         vie 4 sept   la app: ☁ cubierto, 33°   →  0 0 0 0 0 0 0 0 0 0 0 0 1
         dom 6 sept   la app: ☁ cubierto, 29°   →  0 0 0 0 0 0 0 0 0 0 0 0 0

     Días **despejados de sol a sol** pintados de cubierto. El motivo:
     `S.data.hours` solo trae **48 horas**, así que del tercer día en
     adelante esto se caía al código DIARIO, que es el peor de las 24 h
     — y en la costa ese peor es la nube baja de la madrugada, cuando él
     duerme. Por eso tiempo.com le ponía sol y la suya nube.

     Las horas de los diez días SÍ están: se piden con `forecast_days:
     10` y viven en `fc.hourly`. Solo había que mirarlas.               */
  /* ═══════════════════════════════════════════════════════════════
     EL DIBUJO DEL DÍA SALE DE SUS HORAS, NUNCA DEL «CÓDIGO DEL DÍA»
     ───────────────────────────────────────────────────────────────
     Suyo, 04-09-2026 a las 23:00, y no es una queja de estética:

       *«si yo miro en 10 días y veo el sábado nublado, vale, ala, todo
         el día; pero resulta que nublado solo unas horas… menudo
         pronóstico que le digo a la gente que me da mi app»*
       *«y otros en la playa el sábado y yo en casa, porque el sábado
         ponía nublado todo el día»*

     Le costó un sábado. Y llevaba **siete días seguidos** diciendo que
     esto bailaba: *«lo reparas y baila al día siguiente»*.

     ── QUÉ PASABA, MEDIDO ESE DÍA ──
     El `weather_code` DIARIO que publica el modelo **no resume el día:
     es el PEOR momento de las 24 horas**. Pedido a ECMWF para Bermeo:

       04-09  código del día: CUBIERTO   ·  sus 15 h de luz: DESPEJADO 9
       08-09  código del día: LLOVIZNA   ·  0,0 mm y las 15 h CUBIERTO

     Un día entero de sol salía con nubarrón porque alguna hora de noche
     estaba tapada. Y en «Horas», que va hora a hora, salía el sol de
     verdad. **Las dos pantallas decían cosas distintas y ninguna estaba
     rota: es que una usaba el peor rato del día.**

     ── LA REGLA, A PARTIR DE AHORA ──
     El dibujo sale **siempre de las horas de luz de ese día**. El
     código diario del modelo NO se usa como icono, ni de reserva.
     Cuando no hay horas con dato, se dice que no se sabe en vez de
     pintar un nubarrón inventado: un hueco honesto no le manda a casa
     un sábado de sol.
     ═══════════════════════════════════════════════════════════════ */
  /* iconosDelDia() es ahora global: la usa también vigilarCielo(). */

  /* ── EL ⚡ DICE CUÁNDO ─────────────────────────────────────────────
     El ⚡ de la tarjeta sale del weather_code DIARIO —el peor rato de las
     24 h—, y no se quita a propósito: mirar solo 6-20 escondería la
     tormenta de noche, que es la que rompe postes y le manda a la caseta
     al amanecer. Lo que faltaba era la HORA, como ya hace la franja
     («⚡ Riesgo de tormenta · 03:00»). Con sol dibujado y «⚡» debajo,
     sin hora, parecía una contradicción; con «· 03:00» es información.
     Revisión del 04-09-2026. */
  const horaDeTormenta = dia => {
    const H = S.data?.fc?.hourly;
    if (!H?.time) return null;
    for (let i = 0; i < H.time.length; i++) {
      if (!String(H.time[i]).startsWith(dia)) continue;
      const c = H.weather_code?.[i], cape = H.cape?.[i], cin = H.convective_inhibition?.[i];
      if (isStormCode(c) || (has(cape) && has(cin) && cape >= 700 && cin < 75))
        return `${String(new Date(H.time[i]).getHours()).padStart(2, '0')}:00`;
    }
    return null;
  };

  $('#dlist').innerHTML = D.time.map((t, i) => {
    const d = new Date(t + 'T12:00');
    const mx = D.temperature_2m_max[i], mn = D.temperature_2m_min[i];
    const racha = D.wind_gusts_10m_max?.[i];
    // La hora de esa racha, sacada de las horas del día (09-09-2026).
    const rachaCuando = (() => {
      if (!has(racha)) return '';
      const hs = horasDelDia(S.data?.fc, t).filter(h => has(h.gust10));
      if (!hs.length) return '';
      const peor = hs.reduce((a, b) => (b.gust10 > a.gust10 ? b : a));
      return peor.gust10 >= racha * 0.85 ? ` <small>a las ${String(peor.date.getHours()).padStart(2, '0')}:00</small>` : '';
    })();
    const pop = D.precipitation_probability_max?.[i];
    const mm = D.precipitation_sum?.[i];
    const tormenta = isStormCode(D.weather_code[i]);
    // Color del borde por la racha, que es lo que decide el ascenso
    const nivel = !has(racha) ? 'nd'
      : racha >= listonRafaga().no ? 'no' : racha >= listonRafaga().warn ? 'warn' : 'go';
    return `<li class="dcard" data-s="${nivel}" data-dia="${esc(t)}">
      <div class="dcard__top"></div>
      <div class="dcard__d">${i === 0 ? 'Hoy' : d.toLocaleDateString('es',{weekday:'short'})}</div>
      <div class="dcard__f">${d.toLocaleDateString('es',{day:'numeric',month:'short'})}</div>
      <div class="dcard__i">${iconosDelDia(t)}</div>
      <div class="dcard__t"><b>${has(mx)?mx.toFixed(0)+'°':'—'}</b>
        <span>${has(mn)?mn.toFixed(0)+'°':'—'}</span></div>
      <div class="dcard__r">💧 ${has(pop)?pop+'%':'—'} · ${has(mm)?mmTxt(mm)+' mm':'sin dato'}</div>
      <div class="dcard__g">Racha ${has(racha) ? wtxt(racha, true) : '—'}${rachaCuando}</div>
      ${(() => {
        /* ── Y SI OTRO MODELO TE CRUZA EL LISTÓN, SE DICE ─────────────
           MEDIDO el 01-09-2026: el domingo 6 esta tarjeta pintaba «37»
           en verde y ICON daba 54, por encima de su aviso de 45. En la
           pantalla con la que planifica la semana. El listón es SUYO, no
           un porcentaje: salta solo cuando otro cruza 45 o 60 y el de la
           tarjeta no. */
        const R = rachaDelDiaQueNoVesTu(t);
        if (!R) return '';
        return `<div class="dcard__x" data-r="1" title="${esc(R.peor.nom)} ${wtxt(R.peor.v, true)}">`
             /* El listón pasa por `wtxt` como la racha: era el ÚNICO sitio de
                la app que lo imprimía crudo (en km/h y sin unidad), y con
                nudos puestos salía «29 kt — tu listón es 45». Revisión
                del 04-09-2026. */
             + `⚠ ${esc(R.peor.nom)} da <b>${wtxt(R.peor.v, true)}</b> — tu listón es ${wtxt(R.listón, true)}</div>`;
      })()}
      ${(() => {
        /* SOLO CUANDO DE VERDAD SE SEPARAN. El corte en 6° no es a ojo:
           por debajo de eso los modelos bailan siempre y una marca que
           sale todos los días no marca nada —la lección de las catorce
           horas rayadas del 25-08—. Con 6° o más ya no es ruido: es que
           uno de los dos está equivocado y él tiene que saberlo. */
        const D = desacuerdoDelDia(t);
        if (!D || D.dif < 6) return '';
        return `<div class="dcard__x" title="${esc(D.alto.nom)} ${D.alto.v.toFixed(0)}° · `
             + `${esc(D.bajo.nom)} ${D.bajo.v.toFixed(0)}°">⚠ los ${D.n} modelos van de `
             + `<b>${D.bajo.v.toFixed(0)}°</b> a <b>${D.alto.v.toFixed(0)}°</b></div>`;
      })()}
      ${(() => {
        /* Solo si la tarjeta enseña agua: sin agua no hay nada que matizar. */
        /* Por los milímetros de la tarjeta, no por el código diario: ese
           es la peor hora y marcaba «agua» en días de 0,0 mm. */
        if (!(has(mm) && mm >= 0.1)) return '';
        const A = aguaDelDiaQueNoVenTodos(t);
        if (!A) return '';
        const quien = A.mojan.length
          ? `solo <b>${esc(A.mojan[0].nom)}</b> ve agua (${mmTxt(A.mojan[0].v)} mm)`
          : `ninguno pasa de 0,5 mm en el día`;
        const lista = xs => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
        return `<div class="dcard__x" title="${esc(A.secos.join(', '))}: secos">⚠ ${quien} · `
             + `${esc(lista(A.secos))}, ${A.secos.length === 1 ? 'seco' : 'secos'}</div>`;
      })()}
      ${tormenta ? `<div class="dcard__s">⚡ Riesgo de tormenta${horaDeTormenta(t) ? ' · ' + horaDeTormenta(t) : ''}</div>` : ''}
    </li>`;
  }).join('');
}

/* ---------- 11. Gráfico SVG ---------- */

function drawGraph(el, hrs) {
  const W = 900, H = 210, P = { t: 22, r: 12, b: 26, l: 30 };
  const pts = hrs.slice(0, 48);
  const temps = pts.map(p => p.temp).filter(has);
  if (!temps.length) { el.innerHTML = `<p class="note">Sin datos horarios.</p>`; return; }
  const tmin = Math.min(...temps) - 2, tmax = Math.max(...temps) + 2;
  const gmax = Math.max(...pts.map(p => p.gust ?? 0), 10);
  const pmax = Math.max(...pts.map(p => p.prec ?? 0), 1);

  const X = i => P.l + i / (pts.length - 1) * (W - P.l - P.r);
  const Yt = v => P.t + (1 - (v - tmin) / (tmax - tmin)) * (H - P.t - P.b);
  const Yg = v => P.t + (1 - v / gmax) * (H - P.t - P.b);

  const line = (f, key) => pts.map((p, i) => has(p[key])
    ? `${i && has(pts[i - 1][key]) ? 'L' : 'M'}${X(i).toFixed(1)} ${f(p[key]).toFixed(1)}` : '').join(' ');

  const bars = pts.map((p, i) => {
    if (!has(p.prec) || p.prec <= 0) return '';
    const h = p.prec / pmax * (H - P.t - P.b) * .5;
    return `<rect x="${X(i) - 4}" y="${H - P.b - h}" width="8" height="${h}" rx="2" fill="#4d9dff" opacity=".42"/>`;
  }).join('');

  const ticks = pts.map((p, i) => (p.date.getHours() % 6 === 0)
    ? `<text x="${X(i)}" y="${H - 8}" fill="#63708d" font-size="11" text-anchor="middle">${String(p.date.getHours()).padStart(2, '0')}</text>
       <line x1="${X(i)}" y1="${P.t}" x2="${X(i)}" y2="${H - P.b}" stroke="rgba(150,175,225,.1)"/>` : '').join('');

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%">
    <defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb02e" stop-opacity=".28"/>
      <stop offset="1" stop-color="#ffb02e" stop-opacity="0"/></linearGradient></defs>
    ${ticks}${bars}
    <path d="${line(Yt, 'temp')} L${X(pts.length - 1)} ${H - P.b} L${X(0)} ${H - P.b} Z" fill="url(#gt)" stroke="none"/>
    <path d="${line(Yg, 'gust')}" stroke="#ff4d5e" stroke-width="2" fill="none" stroke-dasharray="4 3" opacity=".85" vector-effect="non-scaling-stroke"/>
    <path d="${line(Yg, 'wind')}" stroke="#4d9dff" stroke-width="2.2" fill="none" vector-effect="non-scaling-stroke"/>
    <path d="${line(Yt, 'temp')}" stroke="#ffb02e" stroke-width="2.4" fill="none" vector-effect="non-scaling-stroke"/>
    </svg>` + leyendaGrafico();
}

/* ---------- «¿A qué hora salgo?» ───────────────────────────────────
   Su pregunta de verdad no es si manda gente: es CUÁNDO. Lo contó el
   24-08-2026: *«hay muchas veces que si te pasan la avería a las 3 de la
   mañana pues vas a las 7, horario laboral. Si no es un crítico que tira
   muchas otras que dependen de ahí, porque hay PTN, WMS y equipos de
   transmisión»*.

   Entonces de madrugada lo que necesita no es el tiempo de AHORA, es el
   de las 7. Y si el sitio es crítico y sale ya, necesita la hora en que
   escampa.

   Un color no responde a eso. Una hora sí.

   SU HORARIO, dicho por él el 24-08-2026: **jornada de 07:00 a 14:30, y
   guardia de 24 horas**. (El 07:00-22:00 que aparece en el cartel de
   obligado cumplimiento de una de sus casetas NO es su turno: son los
   teléfonos a los que hay que llamar según la hora.)

   Por eso, fuera de la jornada, lo útil es enseñarle cómo estará al
   empezar la siguiente: si la avería entra a las 3 y no es crítica, irá
   a las 7.

   LÍMITE QUE ÉL PUSO, y no se cruza: la app dice SOLO cuándo escampa.
   Nada de baterías, criticidad del nodo ni si el camino es accesible de
   noche. Sus palabras: *«suele ponerlo en Argos, generalmente hay muchas
   variables… eso ya depende de uno mismo, eso mejor no tocar»*. Tiene
   razón: eso es criterio suyo con datos que la app no tiene, y opinar de
   ello sería inventar.                                                */
function cuandoSalir(horas) {
  if (!horas?.length) return null;
  const ahora = horas[0];
  const f = d => `${String(d.getHours()).padStart(2, '0')}:00`;
  const dia = d => {
    const hoy = new Date();
    const dif = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate())
                          - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000);
    return dif === 0 ? '' : dif === 1 ? ' de mañana'
         : ' del ' + d.toLocaleDateString('es', { weekday: 'long' });
  };

  const r = { estadoAhora: ahora.st };

  // Cuándo se despeja, si ahora no está bien
  if (ahora.st !== 'go') {
    const i = horas.findIndex(h => h.st === 'go');
    r.despeja = i > 0 ? `${f(horas[i].date)}${dia(horas[i].date)}` : null;
  }

  // Y qué va a haber al empezar la jornada, que es cuando irá si no es
  // crítico. Solo tiene sentido enseñarlo si aún no ha llegado esa hora.
  const LAB_INI = 7, LAB_FIN = 14;        // jornada 07:00 - 14:30
  const hAhora = ahora.date.getHours();
  const enJornada = hAhora >= LAB_INI && hAhora <= LAB_FIN;
  const h7 = horas.find(h => h.date.getHours() === LAB_INI);
  if (h7 && !enJornada) {
    r.jornada = { hora: `${f(h7.date)}${dia(h7.date)}`, st: h7.st,
                  motivo: h7.reasons?.find(x => x.s === h7.st)?.txt ?? '' };
  }
  return r;
}

/* ---------- ¿SE LLEGA? El acceso al emplazamiento ───────────────────
   La mitad de su decisión, y la app no la miraba. Su regla, textual:
   «si no hay rayos tengo que ir porque el coche me llega». O sea que
   antes que el viento y antes que la lluvia, lo que decide es si se
   llega.

   Lo que contó y enseñó el 24-08-2026:
     · «con nieve también, con cadenas, en invierno en los montes cae
        bien aquí en el norte»
     · Cuando se va la tensión hay que subir un GRUPO ELECTRÓGENO EN
       REMOLQUE por la pista. Con remolque, una pista embarrada o con
       hielo no es difícil: es imposible.
     · En las azoteas se sube por trampillas con escalera de tijera,
       escaleras verticales de pates y suelos de rejilla. Mojados.
     · Y sus fotos: recintos comidos por helechos y zarzas.

   Lo que se mira, todo medido, nada supuesto:
     · NIEVE — la que cae y la que ya hay en el suelo.
     · HIELO — la isocero por debajo de la cota del emplazamiento con
       humedad, o temperatura de 2° o menos con precipitación.
     · BARRO — lluvia acumulada en las últimas horas.
     · RAMAS — racha capaz de tirar ramas a la pista.
     · NIEBLA — visibilidad corta, que de noche por pista es lo que hay.

   Si no está puesta la cota del emplazamiento se DICE, no se inventa:
   sin cota no se puede comparar con la isocero.                       */
function acceso(horas, cota) {
  if (!horas?.length) return null;
  const h = horas[0];
  const proximas = horas.slice(0, 6);
  const avisos = [];

  /* ── LOS HUECOS SE CUENTAN, NO SE SUMAN COMO CEROS ─────────────────
     El 31-08-2026 se arregló que AROME no publicaba la nieve — pero solo
     la MITAD: se consiguió que el dato llegara, y se dejó el `?? 0`, que
     es lo que lo escondía. O sea que el día que la nieve vuelva a faltar
     por otro motivo, estos contadores volverán a dar CERO y cero se lee
     «no ha nevado». Suyo, ese mismo día y otra vez el 01-09: *«los
     errores que se repiten y repiten»*.

     Ahora se suma solo lo que HAY y se cuenta lo que falta; si no hay ni
     un valor, no se afirma nada: se dice que no se sabe.               */
  const sumaDe = (arr, campo) => {
    let suma = 0, hay = 0, faltan = 0;
    for (const x of arr) {
      if (has(x?.[campo])) { suma += x[campo]; hay++; } else faltan++;
    }
    return { suma, hay, faltan, todoHueco: hay === 0 && faltan > 0 };
  };
  const sinDato = [];

  // — Nieve —
  const nv = sumaDe(proximas, 'nieve');
  const nieveCae = nv.suma;
  const nieveSuelo = has(h.nieveSuelo) ? h.nieveSuelo : null;
  if (nv.todoHueco || nieveSuelo === null) sinDato.push('la nieve');
  if (nieveSuelo !== null && nieveSuelo >= 0.03)
    avisos.push({ n: 'no', t: `${(nieveSuelo * 100).toFixed(0)} cm de nieve en el suelo — `
      + `cadenas, y con remolque olvídate` });
  else if (!nv.todoHueco && nieveCae >= 1)
    avisos.push({ n: 'no', t: `${nieveCae.toFixed(0)} cm de nieve en las próximas 6 h — `
      + `la pista se cierra` });
  else if (!nv.todoHueco && nieveCae > 0)
    avisos.push({ n: 'warn', t: `Va a nevar algo (${nieveCae.toFixed(1).replace('.', ',')} cm) — lleva cadenas` });

  // — Hielo —
  /* ── AQUÍ EL HUECO QUITABA EL AVISO, QUE ES EL LADO MALO ───────────
     `(h.hum ?? 0) > 70` y `(h.prec ?? 0) > 0`: sin humedad o sin lluvia,
     la condición no se cumplía y **el aviso de hielo no salía**. O sea
     que un dato que falta te dejaba la pista limpia en pantalla. En los
     demás sitios el `?? 0` como mucho sobra-avisa; aquí callaba.

     Ahora, con el isocero pegado a la cota y SIN saber la humedad, se
     avisa igual y se dice que falta ese dato: con hielo, el error tiene
     que caer del lado de avisar. (01-09-2026.) */
  if (has(cota) && has(h.frz) && h.frz < cota + 200 && (!has(h.hum) || h.hum > 70)) {
    avisos.push({ n: 'no', t: `Isocero a ${h.frz.toFixed(0)} m y el emplazamiento a ${cota} m — `
      + `hielo en la pista y en las escaleras`
      + (has(h.hum) ? '' : ` <b>(sin dato de humedad: avisado por si acaso)</b>`) });
  } else if (has(h.temp) && h.temp <= 2 && (!has(h.prec) || h.prec > 0)) {
    avisos.push({ n: 'no', t: `${h.temp.toFixed(0)}° con precipitación — placas de hielo`
      + (has(h.prec) ? '' : ` <b>(sin dato de lluvia: avisado por si acaso)</b>`) });
  }
  else if (has(cota) && has(h.frz) && h.frz < cota + 500)
    avisos.push({ n: 'warn', t: `Isocero a ${h.frz.toFixed(0)} m, cerca de la cota (${cota} m) — `
      + `ojo al hielo de madrugada` });

  // — Barro —
  const lv = sumaDe(horas.slice(0, 12), 'prec');
  const lluvia = lv.suma;
  if (lv.todoHueco) sinDato.push('la lluvia acumulada');
  if (!lv.todoHueco && lluvia >= 15)
    avisos.push({ n: 'warn', t: `${lluvia.toFixed(0)} mm en 12 h — pista embarrada, `
      + `y con remolque peor` });

  // — Ramas —
  const conRacha = proximas.map(x => x.gust10).filter(has);
  const rachaMax = conRacha.length ? Math.max(...conRacha) : null;
  if (!conRacha.length) sinDato.push('la racha');
  if (rachaMax !== null && rachaMax >= 70)
    avisos.push({ n: 'warn', t: `Rachas de ${wtxt(rachaMax, true)} — ramas y árboles en la pista` });

  // — Niebla —
  if (has(h.vis) && h.vis < 500)
    avisos.push({ n: 'no', t: `Visibilidad ${kmTxt(h.vis / 1000)} km — niebla cerrada` });
  else if (has(h.vis) && h.vis < 1500)
    avisos.push({ n: 'warn', t: `Visibilidad ${kmTxt(h.vis / 1000)} km — niebla` });

  /* Y si faltó algún dato de los que deciden el acceso, se DICE. Sin
     esto, «nada que te frene» podía significar «no lo he podido mirar»,
     que es justo lo que este proyecto tiene prohibido desde el 27-08. */
  if (sinDato.length)
    avisos.push({ n: 'warn', sinDato: true,
      t: `No tengo ${sinDato.join(' ni ')} de este sitio. <b>Eso no quiere decir que no
          haya: quiere decir que no lo sé</b>, así que el acceso está a medio mirar.` });

  const sinCota = !has(cota);
  return { avisos, sinCota, cota, sinDato,
           nivel: avisos.some(a => a.n === 'no') ? 'no'
                : avisos.length ? 'warn' : 'go' };
}

/* ---------- Riesgo eléctrico dentro de cada franja del día ──────────
   Idea de Aitor, el 24-08-2026: *«aquí igual se podría meter CAPE o CIN
   también, tema de rayos dentro de los símbolos»*. Y tiene razón: las
   franjas dicen si llueve y cuánto sopla, pero no si en ESA parte del
   día se puede armar. Y él lo que decide es a qué hora manda a la
   cuadrilla.

   Se busca la peor hora de la franja con la combinación que rompe —CAPE
   por encima de 700 con la tapa por debajo de 75, la misma regla que en
   todo lo demás, calibrada sobre 1.536 horas reales— y se dice a qué
   hora. Si no se da, se calla: una franja tranquila no tiene por qué
   decir nada.                                                          */
/* De qué hora a qué hora, en texto: «a las 21:00», «de 20:00 a 23:00» o,
   si van sueltas, «entre las 20:00 y las 23:00 (2 horas)». Suyo,
   09-09-2026: «que ponga riesgo de tormenta de tal hora a tal hora».
   OJO: se llama rangoDeHoras porque rangoHoras(a, b) ya existe para la
   pestaña Rayos y durante dos horas la pisé (cazado en el repaso). */
function rangoDeHoras(hs) {
  const h2 = d => `${String(d.getHours()).padStart(2, '0')}:00`;
  const xs = hs.map(h => h.date).sort((a, b) => a - b);
  if (!xs.length) return '';
  const a = xs[0], b = xs[xs.length - 1];
  if (xs.length === 1) return `a las ${h2(a)}`;
  const seguidas = xs.length === Math.round((b - a) / 3600e3) + 1;
  return seguidas ? `de ${h2(a)} a ${h2(b)}` : `entre las ${h2(a)} y las ${h2(b)} (${xs.length} horas sueltas)`;
}

function avisoTormentaFranja(horas) {
  if (!horas?.length) return '';

  /* La LECTURA primero, el número después. Lo pidió él el 25-08-2026:
     «si no hay, pones sin riesgo o lo que sea; y si hay, valora». Lo de
     «ojito» era broma suya: el texto va en tono de parte de trabajo,
     porque puede acabar copiado en un correo a la cuadrilla. Tiene razón: un «CAPE 310 · tapa 81» no le dice si
     puede mandar gente, y eso es lo único que necesita saber de un
     vistazo. El número se queda detrás, para quien quiera mirarlo.

     La escala sale de lo MEDIDO, no de la intuición:
       · CAPE ≥700 con la tapa por debajo de 75 es la combinación que
         cazó las tormentas de Lekeitio y Durango (23-08) y la de Bermeo
         (24-08, 720 con la tapa en 14, con truenos que oyó él).
         Calibrado sobre 1.536 horas reales: salta el 4 % del tiempo.
       · Por debajo de 200 de CAPE no hay con qué, se diga lo que se diga
         de la tapa.
       · Y con mucha gasolina pero tapa gorda, lo normal es oírla lejos:
         eso se dice tal cual, sin alarmar.

     LO QUE NUNCA DICE: que vaya a caer. El modelo dice si PUEDE. Quien
     dice si ha caído es la red de AEMET, y eso va en su propio bloque. */

  const pico = horas.reduce((a, b) => (b.cape ?? 0) > (a.cape ?? 0) ? b : a, horas[0]);
  if (!has(pico.cape)) return '';

  /* Regla suya, del 25-08-2026: «más datos mejor, pero sin liar al que
     lo lee, y datos verídicos». Verídico incluye DE CUÁNDO es el número:
     estas cifras son las del peor momento de la franja, no un promedio,
     y se dice a qué hora es. Sin eso, un CAPE de 560 en una franja de
     seis horas no se sabe si es a las cuatro o a las nueve. */
  const hPico = String(pico.date.getHours()).padStart(2, '0');
  const cifras = `CAPE ${pico.cape.toFixed(0)}`
    + (has(pico.cin) ? ` · tapa ${pico.cin.toFixed(0)}` : '')
    + ` · lo peor a las ${hPico}:00`;

  /* La combinación que rompe, Y ALGO QUE LA ENCIENDA.
     Los mismos tres ingredientes que `assess()`, y por el mismo motivo:
     el 25-08-2026 Girona daba CAPE 1500 con la tapa en 33 y esta franja
     iba a poner «⚡ Riesgo de tormenta»… con 0 % de probabilidad de
     lluvia y el cielo poco nuboso. No cayó ni una descarga (medido en
     los mapas de AEMET: 0 en 60 km en cinco horas).
     Si falta el dato de probabilidad se avisa igual — un hueco nunca
     puede valer como «no hay disparador». */
  const combinacion = horas.filter(h => has(h.cape) && has(h.cin)
                                     && h.cape >= 700 && h.cin < 75);
  const malas = combinacion.filter(h => !has(h.pop) || h.pop >= 10);

  if (malas.length) {
    const peor = malas.reduce((a, b) => b.cape > a.cape ? b : a);
    const hh = String(peor.date.getHours()).padStart(2, '0');
    return `<br><span class="part__ray">⚡ Riesgo de tormenta ${rangoDeHoras(malas)}</span>`
         + `<br><span class="part__ray--cif">lo peor a las ${hh}:00: CAPE ${peor.cape.toFixed(0)} y la tapa en `
         + `${peor.cin.toFixed(0)}, hay gasolina y está abierta</span>`;
  }

  /* ── SI OTRO MODELO VE TORMENTA EN LA FRANJA, EL TITULAR NO PUEDE
     DECIR «BAJO» (09-09-2026) ───────────────────────────────────────
     Calpe, esta tarde: la franja decía «Riesgo eléctrico bajo» con AROME
     (CAPE 210, tapa 200) mientras la tarjeta Tormenta llevaba desde las
     9 el chip «GFS ve tormenta: 2.320, tapa 11». A las 16:40 tronaba a
     7,5 km y hubo 130 descargas en 60 km. Suyo: *«acertó poca lluvia
     pero no daba tormenta, y se escuchó»*. La regla de la casa ya
     estaba escrita —el rayo no admite promedios, basta con que uno
     acierte— y aquí no se aplicaba. Ahora sí: si tu modelo no la ve
     pero otro sí (CAPE ≥ 700 y tapa < 75 a alguna hora de la franja),
     sale en ámbar con su nombre y sus cifras, y las tuyas al lado. */
  {
    let ajena = null;
    const horasAjenas = [];
    for (const h of horas) {
      const o = typeof tormentaQueNoVesTu === 'function' ? tormentaQueNoVesTu(h, h.sitio) : null;
      if (!o) continue;
      horasAjenas.push(h);
      if (!ajena || o.cape > ajena.cape) ajena = { ...o, h };
    }
    if (ajena) {
      const hh = String(ajena.h.date.getHours()).padStart(2, '0');
      return `<br><span class="part__ray">⚡ Riesgo de tormenta ${rangoDeHoras(horasAjenas)} <small>(lo ve ${esc(ajena.quien)})</small></span>`
           + `<br><span class="part__ray--cif">${esc(ajena.quien)}, lo peor a las ${hh}:00: CAPE ${Math.round(ajena.cape)} y la tapa en ${Math.round(ajena.cin)}`
           + ` · tu modelo: ${cifras}</span>`;
    }
  }

  // Cargado, pero sin chispa. Se DICE, no se calla: es distinto de «no
  // hay riesgo», y si el cielo cambia esto cambia con él.
  if (combinacion.length) {
    const peor = combinacion.reduce((a, b) => b.cape > a.cape ? b : a);
    const hh = String(peor.date.getHours()).padStart(2, '0');
    return `<br><span class="part__ray--ojo">Ambiente cargado, sin nada que lo dispare ${rangoDeHoras(combinacion)}</span>`
         + `<br><span class="part__ray--cif">CAPE ${peor.cape.toFixed(0)} y la tapa en `
         + `${peor.cin.toFixed(0)}, pero ${peor.pop} % de probabilidad de lluvia</span>`;
  }

  // Sin la combinación: se valora igual, en corto.
  let lectura, clase = 'part__ray--ojo';
  const tapaAbierta = has(pico.cin) && pico.cin < 75;

  if (pico.cape < 200) {
    lectura = 'Sin riesgo eléctrico';
  } else if (pico.cape >= (S.thr?.capeNo ?? 1000)) {
    lectura = 'Inestabilidad alta, pero con tapa';
    clase = 'part__ray';                 // este merece verse
  } else if (pico.cape >= 500 && tapaAbierta) {
    lectura = 'Riesgo moderado — tapa abierta';
    clase = 'part__ray';
  } else if (pico.cape >= 500) {
    lectura = 'Riesgo eléctrico bajo';
  } else {
    lectura = tapaAbierta ? 'Riesgo bajo, pero sin tapa' : 'Riesgo eléctrico muy bajo';
  }

  return `<br><span class="${clase}">${lectura}</span>`
       + `<br><span class="part__ray--cif">${cifras}</span>`;
}


/* La leyenda del gráfico va en HTML, NO dentro del SVG.
   El SVG se dibuja con `preserveAspectRatio="none"` para que llene la
   caja, y eso lo estira a lo ancho: en un móvil de 380 px, un dibujo de
   900 se aplasta a menos de la mitad. Las líneas aguantan —para eso
   están—, pero el texto salía deformado y diminuto, ilegible. Aitor lo
   vio en el móvil el 24-08-2026: «aquí no se lee bien» y «se ve borroso».
   Los trazos llevan ahora `vector-effect="non-scaling-stroke"` para que
   el grosor no se deforme con el estirado. */
function leyendaGrafico() {
  const it = (color, txt, extra = '') =>
    `<span class="leg__i"><i style="background:${color};${extra}"></i>${txt}</span>`;
  return `<div class="leg">
    ${it('#ffb02e', 'temperatura')}
    ${it('#4d9dff', `viento a ${S.hgt} m (${wu().lbl})`)}
    ${it('#ff4d5e', 'ráfaga', 'opacity:.9')}
    ${it('#4d9dff', 'lluvia', 'opacity:.45')}
  </div>`;
}

/* ---------- 12. Mareas ---------- */

/* ---------- Mareas oficiales de Euskalmet ───────────────────────────
   COMPARADO el 23-08-2026 en Bermeo: el modelo de Open-Meteo daba la
   pleamar a las 14:03 y la bajamar a las 20:12; Euskalmet, 14:35 y
   20:50. Entre media hora y cuarenta minutos adelantado, siempre.
   La amplitud del modelo era buena, pero la hora no, y para salir a la
   mar media hora es mucho.

   Ahora se usa la TABLA OFICIAL. Si Euskalmet no responde, no se
   sustituye por el modelo a escondidas: se dice que no hay tabla.

   Solo cubre la costa vasca. Fuera de ahí no se enseña nada.        */

const MAREAS = { datos: null, pedido: null, error: null };

async function cargarMareas() {
  if (MAREAS.datos || MAREAS.pedido) return MAREAS.pedido;
  MAREAS.pedido = (async () => {
    try {
      const r = await fetch('/mareas');
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.reason || `error ${r.status}`);
      MAREAS.datos = d; MAREAS.error = null;
    } catch (e) {
      MAREAS.error = e.message || 'sin respuesta';
    } finally {
      MAREAS.pedido = null;
    }
  })();
  return MAREAS.pedido;
}

/** ¿Cubre Euskalmet este punto? Su tabla es de la costa vasca. */
const enCostaVasca = p => p && kmEntre({ lat: 43.36, lon: -2.45 }, p) < 90;

/* PEGADO AL MAR, que no es lo mismo que `enCostaVasca`. Ese es un radio
   de 90 km y vale para saber si hay mareas; para el sirimiri no sirve,
   porque mete dentro sitios de interior como Arbaiza —comprobado el
   27-08-2026, la prueba lo cazó—. Aquí se mide contra la línea de costa
   de verdad, con cuatro puntos del litoral vizcaíno. */
const COSTA = [
  { lat: 43.4209, lon: -2.7215 },   // Bermeo
  { lat: 43.3650, lon: -2.4950 },   // Lekeitio
  { lat: 43.3400, lon: -3.0200 },   // Getxo / abra de Bilbao
  { lat: 43.3200, lon: -2.4200 },   // Ondarroa
];
const cercaDelMar = p => !!p && COSTA.some(c => kmEntre(c, p) < 20);
/* OJO: `cercaDelMar` YA NO decide el aviso de sirimiri. Lo hizo durante una
   hora el 27-08-2026 y estaba mal: le chispeó en Vitoria, a 45 km del mar, y
   el aviso no habría salido. El sirimiri es de frente, no de costa. Se deja
   la función porque describe bien «pegado al mar», pero no se use para esto. */

/** Los próximos extremos, en orden. */
function proximasMareas(n = 4) {
  const d = MAREAS.datos;
  if (!d?.dias?.length) return [];
  const ahora = new Date();
  const out = [];
  for (const dia of d.dias) {
    for (const ev of dia.eventos) {
      const t = new Date(`${dia.fecha}T${ev.hora}:00`);
      if (t.getTime() > ahora.getTime() - 45 * 60000) out.push({ ...ev, cuando: t });
    }
  }
  return out.sort((a, b) => a.cuando - b.cuando).slice(0, n);
}



/** Extremos del nivel del mar por interpolación parabólica sobre la
 *  serie horaria real del modelo. No es una tabla oficial de mareas. */
function tideExtrema(times, h) {
  const out = [];
  for (let i = 1; i < h.length - 1; i++) {
    if (!has(h[i - 1]) || !has(h[i]) || !has(h[i + 1])) continue;
    const up = h[i] > h[i - 1] && h[i] >= h[i + 1];
    const dn = h[i] < h[i - 1] && h[i] <= h[i + 1];
    if (!up && !dn) continue;
    const d = h[i - 1] - 2 * h[i] + h[i + 1];
    const off = d !== 0 ? clamp(0.5 * (h[i - 1] - h[i + 1]) / d, -1, 1) : 0;
    out.push({
      type: up ? 'hi' : 'lo',
      time: new Date(new Date(times[i]).getTime() + off * 3600e3),
      height: h[i] - 0.25 * (h[i - 1] - h[i + 1]) * off,
    });
  }
  return out;
}


/** Tabla de mareas en pantalla. Oficial o nada. */
function pintarMareas() {
  const lista = $('#tidelist'), nota = $('#tideNote');
  if (!lista) return;

  if (!enCostaVasca(S.place)) {
    lista.innerHTML = `<p class="note">La tabla oficial de Euskalmet cubre la costa vasca.
      Para este punto no hay tabla, y <b>no se muestra una estimación del modelo</b>:
      una marea calculada puede irse media hora, y eso no sirve para salir a la mar.</p>`;
    if (nota) nota.innerHTML = '';
    return;
  }

  const ex = proximasMareas(4);
  if (!ex.length) {
    lista.innerHTML = MAREAS.error
      ? `<p class="note"><b>Euskalmet no responde ahora mismo</b> (${esc(MAREAS.error)}).
         No se enseña una marea calculada en su lugar: mira la tabla oficial antes de salir.</p>`
      : `<p class="note">Cargando la tabla oficial de Euskalmet…</p>`;
    if (nota) nota.innerHTML = '';
    return;
  }

  lista.innerHTML = ex.map(e => `
    <div class="td td--${e.tipo === 'high' ? 'hi' : 'lo'}">
      <div class="td__k">${e.tipo === 'high' ? '▲ Pleamar' : '▼ Bajamar'}</div>
      <div class="td__t">${esc(e.hora)}</div>
      <div class="td__h">${esc(e.cuando.toLocaleDateString('es', { weekday: 'short' }))} · ${e.altura.toFixed(2).replace('.', ',')} m</div>
    </div>`).join('');

  if (nota) nota.innerHTML = `<p class="note"><b>Tabla oficial de Euskalmet.</b>
    Las alturas son <b>sobre el cero del puerto</b>, la misma referencia que usan las tablas de
    siempre, así que coinciden con las suyas.
    Hora oficial peninsular. Antes se calculaban con un modelo y se iban
    <b>entre 30 y 40 minutos</b>; eso ya no pasa.</p>`;
}

/** Marcas de pleamar y bajamar sobre la curva de marea.
 *
 *  DOS FALLOS QUE HABÍA AQUÍ:
 *
 *  1. El código usaba `ex.map(...)` con `e.time`, `e.height` y `e.type`,
 *     que eran los campos de la estimación por modelo que se retiró. Con
 *     la tabla oficial de Euskalmet los campos son `cuando`, `altura` y
 *     `tipo`, y `ex` ni siquiera estaba declarado en esta función: la
 *     gráfica reventaba con "ex is not defined" CADA VEZ que se dibujaba.
 *
 *  2. Aunque se hubiera arreglado el nombre, poner el punto a la altura
 *     de Euskalmet sobre esta curva habría sido un error de fondo:
 *     Euskalmet mide sobre el CERO DEL PUERTO y la curva va sobre el
 *     NIVEL MEDIO. Son dos referencias distintas y el punto habría salido
 *     donde no es.
 *
 *  Por eso ahora se marca solo el CUÁNDO, con una raya vertical en la
 *  hora oficial y una P o una B. La altura oficial está en la lista de
 *  abajo, en su propia referencia y sin mezclarse con nada.            */
function marcasMarea(X, T, n, H) {
  const ex = proximasMareas(6);
  if (!ex.length || !T?.length) return '';
  const t0 = new Date(T[0]).getTime();
  return ex.map(e => {
    const i = (e.cuando.getTime() - t0) / 3600e3;     // posición exacta, con decimales
    if (!(i >= 0 && i <= n - 1)) return '';
    const x = X(i).toFixed(1);
    const alto = e.tipo === 'high';
    const col = alto ? '#4d9dff' : '#8b7bff';
    return `<line x1="${x}" y1="13" x2="${x}" y2="${H - 22}" stroke="${col}"
        stroke-width="1.6" opacity=".8"/>
      <text x="${x}" y="10" fill="${col}" font-size="10" font-weight="800"
        text-anchor="middle">${alto ? 'P' : 'B'}</text>`;
  }).join('');
}

function renderSea() {
  const M = S.data.mar;
  /* ── NO SE BORRAN LOS HIJOS DE LA TARJETA ────────────────────────────
     Aquí había un `card.innerHTML = …` para decir «esto no es costa», y
     se llevaba por delante **#tide, #tidelist y #tideNote**, que viven
     dentro de #seaCard. La secuencia que lo rompía es la suya de todos
     los días: mirar el Oiz y volver a Bermeo — al volver, `$('#tide')`
     ya era `null` y petaba con «Cannot set properties of null», dejando
     a Bermeo **sin curva de marea y sin la tabla de Euskalmet**.

     Cinco veces en su diario de fallos, en cuatro publicaciones del
     28-08-2026 (1517, 2111, 2130 y 2346). Lo encontró la sesión de
     revisión nocturna leyendo ese diario; confirmado en el DOM.

     Ahora el aviso tiene su propio hueco y los hijos solo se esconden. */
  const nota = $('#seaNote');
  const dentro = ['#tide', '#tidelist', '#tideNote'].map($);
  if (!M?.hourly?.sea_level_height_msl) {
    if (nota) {
      nota.hidden = false;
      // Un 4xx es «aquí no hay mar»; lo demás es que no ha contestado.
      const caido = S.marFallo && !/HTTP 4\d\d/.test(S.marFallo);
      nota.innerHTML = caido
        ? `No he podido leer el modelo marino (${esc(S.marFallo)}): no es que aquí no haya mar,
        es que no ha contestado. Vuelve a probar al refrescar. No se muestra nada estimado.`
        : `Este emplazamiento no está en la costa o el modelo marino no lo cubre,
        así que no hay datos de marea ni oleaje. No se muestra nada estimado.`;
    }
    dentro.forEach(e => { if (e) e.hidden = true; });
    $('#seaDet').innerHTML = ''; $('#waveGraph').innerHTML = '';
    return;
  }
  if (nota) { nota.hidden = true; nota.innerHTML = ''; }
  dentro.forEach(e => { if (e) e.hidden = false; });
  const T = M.hourly.time, L = M.hourly.sea_level_height_msl;
  pintarMareas();

  // Curva de marea
  const W = 900, H = 190, P = 26;
  const n = Math.min(L.length, 72);
  const vs = L.slice(0, n).filter(has);
  if (vs.length) {
    const mn = Math.min(...vs), mx = Math.max(...vs), sp = Math.max(mx - mn, .1);
    const X = i => P + i / (n - 1) * (W - P * 2);
    const Y = v => 14 + (1 - (v - mn) / sp) * (H - 42);
    const path = L.slice(0, n).map((v, i) => has(v) ? `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}` : '').join(' ');
    const nowI = T.slice(0, n).findIndex(t => new Date(t).getTime() >= Date.now());
    $('#tide').innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%">
      <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4d9dff" stop-opacity=".45"/>
        <stop offset="1" stop-color="#4d9dff" stop-opacity="0"/></linearGradient></defs>
      <path d="${path} L${X(n - 1)} ${H - 22} L${X(0)} ${H - 22} Z" fill="url(#tg)" stroke="none"/>
      <path d="${path}" stroke="#6fb4ff" stroke-width="2.4" fill="none"/>
      ${nowI >= 0 ? `<line x1="${X(nowI)}" y1="8" x2="${X(nowI)}" y2="${H - 22}" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/>
        <text x="${X(nowI)}" y="${H - 6}" fill="#fff" font-size="11" text-anchor="middle" opacity=".8">ahora</text>` : ''}
      ${marcasMarea(X, T, n, H)}</svg>`;
  }

  const C = M.current || {};
  const dt = (k, v, s) => `<div class="dt"><div class="dt__k">${k}</div><div class="dt__v">${v}</div>${s ? `<div class="dt__s">${s}</div>` : ''}</div>`;
  /* Igualada con la de «Ahora» el 30-08-2026: la pestaña del MAR tenía
     MENOS mar que Ahora — sin mar de viento, sin corriente y sin el
     periodo del fondo. Para surf y kayak son justo las que separan una
     mar limpia de una picada, y los campos ya venían en la petición. */
  $('#seaDet').innerHTML = [
    dt('Altura de ola', show(C.wave_height, 'm', 1), rumboLargo(C.wave_direction) ? `Del ${rumboLargo(C.wave_direction)}` : ''),
    dt('Periodo', show(C.wave_period, 's', 1)),
    dt('Temp. del agua', show(C.sea_surface_temperature, '°C', 1)),
    dt('Mar de fondo', show(C.swell_wave_height ?? M.hourly.swell_wave_height?.[0], 'm', 1),
       has(C.swell_wave_period) ? `Periodo ${C.swell_wave_period.toFixed(1).replace('.', ',')} s` : ''),
    dt('Mar de viento', show(C.wind_wave_height, 'm', 1),
       has(C.wind_wave_height)
         ? (C.wind_wave_height < 0.3 ? 'Casi nada: la mar está limpia' : 'La levanta el viento de aquí')
         : ''),
    dt('Corriente', show(C.ocean_current_velocity, 'm/s', 1),
       has(C.ocean_current_velocity) ? 'Del agua, no del viento' : ''),
  ].join('');

  /* ── OLEAJE 48 H ──────────────────────────────────────────────────
     Suyo, 29-08-2026 a las 18:25, con una foto del móvil: *«se ve mal
     desde el móvil»* · *«oleaje»*.

     Y la causa era del propio dibujo: el SVG iba con
     `preserveAspectRatio="none"`, que **estira la imagen y aplasta el
     texto de dentro**. El «máx 1,8 m» salía espachurrado y minúsculo en
     una esquina — en el ordenador se salvaba y en el móvil no.

     Se saca el texto FUERA del SVG, que es donde tenía que estar: el
     dibujo se puede estirar, las letras no.

     Y de paso se le dice **cuándo**, que era la otra mitad que faltaba:
     un gráfico de 48 horas sin una sola hora escrita no dice si el pico
     es esta tarde o pasado mañana. Él va a hacer surf y kayak: la hora
     del máximo es justo el dato. */
  const wv = M.hourly.wave_height?.slice(0, 48) ?? [];
  const wt = M.hourly.time?.slice(0, 48) ?? [];
  if (wv.filter(has).length) {
    /* ── EL SUELO DE ESCALA NO ES UN DATO ───────────────────────────
       El ,5 está para que la curva no toque el techo. Ese mismo `mx` se
       imprimía como «lo más alto 0,5 m» — con la HORA del máximo real al
       lado, así que no parecía un número redondo: parecía medido. En
       Bermeo no pasa (el Cantábrico no baja de 0,42); en Calpe pasa el
       13,7 % de las ventanas y en Miami el 34,6 %. Revisión 04-09-2026. */
    const mxReal = Math.max(...wv.filter(has));
    const mx = Math.max(mxReal, .5);                 // solo para la escala Y()
    const iMx = wv.findIndex(v => v === mxReal);
    const hMx = wt[iMx] ? wt[iMx].slice(11, 16) : null;
    const dMx = wt[iMx] ? new Date(wt[iMx]) : null;
    const cuando = dMx ? `${nombreDeDia(dMx)} a las ${hMx}` : '';
    const X = i => 20 + i / (wv.length - 1) * 860;
    const Y = v => 12 + (1 - v / mx) * 110;
    const p = wv.map((v, i) => has(v) ? `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}` : '').join(' ');
    /* Cuatro horas escritas, repartidas. Van en HTML debajo, no dentro
       del SVG estirado, por lo mismo de arriba. */
    /* Las marcas llevaban «mñ» para el día siguiente, y «mñ» es
       «mañana»: el mismo lío que arriba, en abreviado. Ahora va el día
       abreviado —«sáb 14:00»—, que ocupa lo mismo y no se puede leer
       de dos maneras. Suyo, 04-09-2026. */
    const hoyTxt = new Date().toDateString();
    const marcas = [0, 12, 24, 36].filter(i => wt[i]).map(i => {
      const d = new Date(wt[i]);
      const dia = d.toDateString() === hoyTxt
        ? '' : d.toLocaleDateString('es', { weekday: 'short' }).replace('.', '') + ' ';
      return `<span>${dia}${wt[i].slice(11, 16)}</span>`;
    }).join('');
    /* ── «AHORA» ES AHORA, NO EL PRIMER DATO DE LA LISTA ──────────────
       Lo cazó él el 02-09-2026 mirando su propia pantalla: la tarjeta de
       la izquierda ponía «Altura de ola 0,7 m» y esta gráfica, al lado,
       «Ahora 1.2 m · lo más alto 1.2 m hoy a las 00:00». Dos números para
       la misma cosa, a cuatro centímetros.

       El motivo: `wv[0]` es la PRIMERA hora de la serie del mar, y esa
       serie empieza a medianoche — así que «Ahora» estaba enseñando la
       ola de las 00:00. Casi el doble que la de verdad. Es el número con
       el que mira si sale con el kayak o si la mar deja trabajar en el
       muelle. */
    const iAhora = (() => {
      const t = Date.now(); let mejor = 0, dif = Infinity;
      wt.forEach((x, i) => {
        if (!has(wv[i])) return;
        const d = Math.abs(new Date(x).getTime() - t);
        if (d < dif) { dif = d; mejor = i; }
      });
      return mejor;
    })();
    $('#waveGraph').innerHTML = `
      <div class="ola__cab">Ahora <b>${has(wv[iAhora]) ? mTxt(wv[iAhora]) : '—'} m</b>
        · lo más alto <b>${mTxt(mxReal)} m</b>${cuando ? ` ${cuando}` : ''}</div>
      <svg viewBox="0 0 900 150" preserveAspectRatio="none" class="ola__svg">
        <path d="${p} L${X(wv.length - 1)} 138 L20 138 Z" fill="#8b7bff" opacity=".18"/>
        <path d="${p}" stroke="#a89bff" stroke-width="2.4" fill="none"/>
      </svg>
      <div class="ola__horas">${marcas}</div>`;
  }
}

/* ---------- 13. Avisos oficiales ---------- */

/* ---------- Enlaces a las fuentes oficiales ────────────────────────
   OJO: estas direcciones se rompen. Euskalmet rehízo su web y las tres
   suyas daban 404 el 24-08-2026; lo vio Aitor, no la app. Comprobadas y
   corregidas ese día:

     rayos  → .../meteodat/rayoshv.apl   (red LINET, la buena)
     avisos → /el-tiempo/alertas-meteorologia-extrema/
     radar  → /observacion/radar-kapildui-precipitaciones/

   La revisión automática debería probarlas de vez en cuando: un enlace
   muerto en la pantalla de fuentes oficiales es de lo peor que puede
   pasar, porque es justo donde va a mirar cuando tiene que decidir. */
/* ── HURACANES Y TORMENTAS TROPICALES DEL MUNDO ──────────────────────
   Suyo, 01-09-2026, enseñando el seguidor de Windy: *«me gustaría saber
   si hay tornados por Filipinas, grandes lluvias… me gustaría seguirlo y
   ver cómo damos el pronóstico. Esto ya por hobby»*.

   Fuente: el **National Hurricane Center** de la NOAA, pública y oficial.
   Va al final de Avisos y **solo se pinta cuando hay alguna**: él ya se
   quejó de que hay avisos que ocupan demasiada pantalla, y esto es un
   extra, no parte de su trabajo.

   Y se dice lo que la lista NO cubre —los tifones del Pacífico oeste—,
   que media verdad en una lista de tormentas es peor que no tenerla. */
async function renderTropicales() {
  const caja = $('#tropicalCard'), dentro = $('#tropical');
  if (!caja || !dentro) return;
  try {
    const r = await fetch('/rayos?tormentas=1', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const t = j.tormentas || [];
    if (!t.length) { caja.hidden = true; dentro.innerHTML = ''; return; }

    /* La categoría en palabras, con SUS unidades (km/h siempre). La
       escala Saffir-Simpson va en nudos; aquí se convierte. */
    const cat = x => {
      if (x.clase !== 'HU') return x.clase === 'TS' ? 'tormenta tropical' : 'depresión tropical';
      const k = x.vientoKmh ?? 0;
      return k >= 252 ? 'huracán 5' : k >= 209 ? 'huracán 4'
           : k >= 178 ? 'huracán 3' : k >= 154 ? 'huracán 2' : 'huracán 1';
    };
    const rumbo = g => {
      if (!has(+g)) return '';
      const R = ['norte','noreste','este','sureste','sur','suroeste','oeste','noroeste'];
      return ' hacia el ' + R[Math.round(((+g % 360) / 45)) % 8];
    };

    caja.hidden = false;
    dentro.innerHTML = t.map(x => `
      <div class="trop">
        <div class="trop__n"><b>${esc(x.nombre)}</b>
          <span class="trop__c" data-h="${x.clase === 'HU' ? 'si' : 'no'}">${esc(cat(x))}</span></div>
        <div class="trop__d">Vientos <b>${has(x.vientoKmh) ? x.vientoKmh + ' km/h' : 'sin dato'}</b>${
          has(x.avanceKmh) ? ` · avanza a ${x.avanceKmh} km/h${esc(rumbo(x.rumbo))}` : ''}${
          has(x.presion) ? ` · ${x.presion} hPa` : ''}</div>
        <div class="trop__p dim">${has(x.lat) && has(x.lon)
          ? `${x.lat.toFixed(1)}, ${x.lon.toFixed(1)}` : ''}</div>
      </div>`).join('')
      + `<p class="note">${esc(j.fuente)}. <b>${esc(j.cubre)}</b></p>`;
  } catch (e) {
    /* Si no se puede leer, se DICE — no se deja la tarjeta en blanco ni
       se esconde como si no hubiera tormentas. */
    caja.hidden = false;
    dentro.innerHTML = `<p class="note">No he podido leer las tormentas activas `
      + `(${esc(String(e.message || e).slice(0, 60))}). <b>Eso no quiere decir que no las haya.</b></p>`;
  }
}

function renderAlerts() {
  const p = S.place;
  const links = [
    ['⚡', 'Euskalmet · Rayos', 'Red LINET — nube-tierra en × y dentro de la nube en ○', 'https://www.euskalmet.euskadi.eus/s07-5853x/es/meteorologia/meteodat/rayoshv.apl?e=5&R01HNoPortal=true'],
    ['⚡', 'Blitzortung', 'Red mundial de detección de rayos, en vivo', 'https://map.blitzortung.org/'],
    ['🌩', 'AEMET · Rayos', 'Descargas detectadas por la red nacional', 'https://www.aemet.es/es/eltiempo/observacion/rayos'],
    ['🇪🇸', 'AEMET · Avisos', 'Avisos oficiales del Estado', 'https://www.aemet.es/es/eltiempo/prediccion/avisos'],
    ['🌦', 'Euskalmet · Avisos', 'Alertas de meteorología extrema', 'https://www.euskalmet.euskadi.eus/el-tiempo/alertas-meteorologia-extrema/'],
    ['📡', 'Euskalmet · Radar', 'Radar Kapildui de precipitación', 'https://www.euskalmet.euskadi.eus/observacion/radar-kapildui-precipitaciones/'],
    ['📡', 'AEMET · Radar', 'Radar nacional de precipitación', 'https://www.aemet.es/es/eltiempo/observacion/radar'],
    ['🌍', 'Meteoalarm', 'Avisos oficiales de toda Europa', 'https://meteoalarm.org/es/live/'],
    ['🌊', 'Puertos del Estado', 'Tabla de mareas oficial (referencia del puerto)', 'https://www.puertos.es/es-es/oceanografia/Paginas/portus.aspx'],
    ['📍', 'Predicción del punto', 'Open-Meteo para estas coordenadas',
      p ? `https://open-meteo.com/en/docs#latitude=${p.lat}&longitude=${p.lon}` : 'https://open-meteo.com'],
  ];
  $('#links').innerHTML = links.map(([i, t, s, u]) =>
    `<a class="lk" href="${u}" target="_blank" rel="noopener">
      <span class="lk__i">${i}</span><span><b>${t}</b><span>${s}</span></span></a>`).join('');

  // Riesgo propio calculado a partir del modelo (claramente diferenciado
  // de un aviso oficial, que esta app no puede emitir).
  const hrs = S.data?.hours ?? [];
  /* Se cuenta ANTES de recortar: con 20 horas de galerna el titular decía
     «6 horas en 48 h». Revisión del 04-09-2026. */
  const malas = hrs.filter(h => h.st === 'no');
  const bad = malas.slice(0, 6);
  const el = $('#alerts');

  el.innerHTML = `
    <div class="al" style="--vc:var(--no)">
      <div class="al__h"><span class="al__lvl">LÉELO</span>
        <span class="al__t">El CAPE no es un detector de rayos</span></div>
      <p>El <b>CAPE</b> y el índice de elevación que ves en <b>Ahora</b> miden el
      <b>potencial</b> de que se formen tormentas dentro de unas horas. <b>No son un detector de
      descargas.</b> Puede haber rayos con CAPE bajo, y puede haber CAPE alto sin una sola descarga.</p>
      <p><b>Las descargas que SÍ han caído están en la pestaña Rayos</b>, leídas de la red de
      detección de AEMET: cuántas, a qué hora y a cuántos kilómetros de aquí. Pero ese mapa se
      publica por horas cerradas, así que <b>siempre hay un rato reciente del que todavía no hay
      dato</b> —la propia pestaña te dice hasta qué hora sabe—. Para ese rato, el mapa en vivo de
      Blitzortung, el radar y estos enlaces oficiales.</p>
      <p>Y por encima de todo, la <b>regla 30/30</b>: si entre el relámpago y el trueno pasan menos
      de 30 segundos, todo el mundo abajo; no se vuelve a subir hasta 30 minutos después del último
      trueno. Si se oye el trueno, ya estás dentro del alcance.</p>
    </div>
    <div class="al" style="--vc:var(--warn)">
      <div class="al__h"><span class="al__lvl">IMPORTANTE</span>
        <span class="al__t">Esta app no emite avisos oficiales</span></div>
      <p>Los avisos con valor legal los emiten <b>AEMET</b> y <b>Euskalmet</b>. Sus webs no permiten
      la consulta automática desde el navegador, así que aquí tienes el acceso directo abajo.
      Aquí abajo los tienes en un toque.</p>
    </div>` +
    (bad.length ? `
    <div class="al" style="--vc:var(--no)">
      <!-- SE ME QUEDÓ VIVO UN «NO APTO». Esta mañana quité los rótulos
           que autorizan de toda la app —orden suya repetida cinco veces:
           «vosotros cifras, yo decido»— y este, en el bloque de avisos,
           se me escapó. Lo encontró la otra sesión repasando el código
           publicado: de 21 apariciones de «APTO», veinte eran comentarios
           y **una estaba en pantalla**.
           Ahora dice cuántas horas y por qué, que es el dato. Lo que se
           haga con eso es suyo. -->
      <div class="al__h"><span class="al__lvl">FUERA DE TUS UMBRALES</span>
        <span class="al__t">${malas.length} hora${bad.length > 1 ? 's' : ''} en 48 h</span></div>
      <p>${bad.map(h => `${h.date.toLocaleString('es', { weekday: 'short', hour: '2-digit' })} — ${esc(h.reasons.find(r => r.s === 'no')?.txt ?? '')}`).join('<br>')}</p>
      <div class="al__w">Cálculo propio sobre datos de modelo y tus umbrales. No es un aviso oficial.</div>
    </div>` : `
    <div class="al" style="--vc:var(--go)">
      <div class="al__h"><span class="al__lvl">SIN SUPERAR</span>
        <span class="al__t">Ninguna hora supera tus umbrales en 48 h</span></div>
      <div class="al__w">Cálculo propio sobre datos de modelo. No sustituye a los avisos oficiales.</div>
    </div>`);
}

/* ---------- 14. Radar (Leaflet en carga diferida) ---------- */

const Radar = {
  map: null, frames: [], layers: {}, i: 0, timer: null, playing: false,

  async open() {
    /* Hasta el 05-09-2026 el radar se cargaba UNA vez por sesión: a las
       dos horas seguía enseñando el eco de la primera vez, y si cambiaba
       de sitio el mapa se quedaba en el anterior. Ahora, al volver, se
       piden fotogramas nuevos si los que hay tienen más de 5 min y se
       centra en el sitio actual. */
    if (this.map) { await this.refrescar(); return; }
    const el = $('#radar');
    el.innerHTML = `<div class="radar__ph">Cargando radar…</div>`;
    try {
      await this.lib();
      const p = S.place;
      el.innerHTML = '';
      this.map = L.map(el, { zoomControl: true, attributionControl: true })
        .setView([p.lat, p.lon], 8);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 12, attribution: '© OpenStreetMap · © CARTO',
      }).addTo(this.map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
        { maxZoom: 12, pane: 'shadowPane' }).addTo(this.map);

      this.marca = L.circleMarker([p.lat, p.lon], {
        radius: 7, color: '#fff', weight: 2, fillColor: '#4d9dff', fillOpacity: 1,
      }).addTo(this.map).bindPopup(esc(p.name));
      this.sitio = { lat: p.lat, lon: p.lon };

      await this.cargarFotogramas();
      this.play();
      setTimeout(() => this.map.invalidateSize(), 60);
    } catch (e) {
      el.innerHTML = `<div class="radar__ph">No se ha podido cargar el radar (${esc(e.message)}).
        Usa el radar de AEMET o Euskalmet en la pestaña Avisos.</div>`;
    }
  },

  /* Pide el catálogo a RainViewer y deja el mapa en el último fotograma
     real. Quita las capas viejas: sus rutas caducan y RainViewer las
     contesta con un gris. */
  async cargarFotogramas() {
    const d = await jget(API.rain, {});
    const frames = [...(d.radar?.past ?? []), ...(d.radar?.nowcast ?? [])];
    if (!frames.length) throw new Error('sin fotogramas');
    Object.values(this.layers).forEach(l => this.map.removeLayer(l));
    this.layers = {};
    this.host = d.host;
    this.frames = frames;
    this.leido = Date.now();
    $('#rTime').max = frames.length - 1;
    this.i = (d.radar?.past?.length ?? 1) - 1;
    $('#rTime').value = this.i;
    this.frame(this.i);
  },

  async refrescar() {
    const p = S.place;
    if (p && this.sitio && (this.sitio.lat !== p.lat || this.sitio.lon !== p.lon)) {
      this.map.setView([p.lat, p.lon], this.map.getZoom());
      this.marca?.setLatLng([p.lat, p.lon]).bindPopup(esc(p.name));
      this.sitio = { lat: p.lat, lon: p.lon };
    }
    setTimeout(() => this.map.invalidateSize(), 60);
    if (Date.now() - (this.leido || 0) < 5 * 60e3) return;
    try { await this.cargarFotogramas(); }
    catch { /* se queda lo que había: mejor un eco de hace 6 min que nada */ }
  },

  lib() {
    if (window.L) return Promise.resolve();
    /* Leaflet venía de unpkg, igual que MapLibre hasta el 23-08: el
       service worker no cachea nada de fuera, así que SIN COBERTURA el
       radar no arrancaba —y él trabaja en el monte—. MapLibre se bajó a
       vendor/ aquel día y este se quedó fuera (revisión del 04-09-2026).
       Ahora es local: leaflet@1.9.4 oficial de npm, bajado el 05-09 con
       integridad sha512-nxS1ynzJOmOlHp+iL3FyWqK89GtNL8U8rvlMOsQdTTssxZwC
       Xh8N2NB3GDQOL+YR3XnWyZAxwQixURb+FA74PA== (869.361 bytes el paquete;
       147.552 el .js y 14.806 el .css). El CSS pide sus imágenes por
       ruta relativa `images/…`, que van al lado. */
    return new Promise((ok, err) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = './vendor/leaflet/leaflet.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = './vendor/leaflet/leaflet.js';
      s.onload = ok;
      s.onerror = () => err(new Error('sin conexión'));
      document.head.appendChild(s);
    });
  },

  frame(i) {
    const f = this.frames[i];
    if (!f) return;
    if (!this.layers[i]) {
      /* ── RAINVIEWER NO SIRVE POR ENCIMA DE z7 ────────────────────────
         Y no falla con un error: devuelve **HTTP 200 con un cartel
         dibujado** que pone «Zoom Level Not Supported». Al acercarse, la
         pestaña Radar se llenaba de doce cuadros grises donde debería ir
         el eco. Lo vio la sesión de revisión nocturna; medido aquí antes
         de tocar nada, con el fotograma real:

             z5  8441 b · imagen distinta en cada tesela   -> dato bueno
             z7  1096 b · PNG en blanco                    -> dato bueno, seco
             z8  3269 b · **la misma imagen exacta** en teselas de
                          sitios opuestos del mundo        -> el cartel

         `maxNativeZoom: 7` hace que Leaflet estire la tesela de z7 en vez
         de pedir una que no existe. Se ve más basto de cerca, pero **se ve
         el eco**; un cuadro gris se lee como «aquí no llueve», y eso es lo
         que no puede pasar.

         Y es de los fallos que se leen como calma: anoche estaba seco y por
         eso no cantaba. */
      this.layers[i] = L.tileLayer(`${this.host}${f.path}/512/{z}/{x}/{y}/4/1_1.png`,
        { opacity: 0, zIndex: 300, maxZoom: 12, maxNativeZoom: 7 }).addTo(this.map);
    }
    Object.entries(this.layers).forEach(([k, l]) => l.setOpacity(+k === i ? .82 : 0));
    this.i = i;
    $('#rTime').value = i;
    const d = new Date(f.time * 1000);
    const past = f.time * 1000 <= Date.now();
    $('#rStamp').textContent =
      `${past ? '' : '+'}${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
    $('#rStamp').style.color = past ? '' : 'var(--warn)';
    // Precarga del siguiente
    const nx = (i + 1) % this.frames.length;
    if (!this.layers[nx]) {
      this.layers[nx] = L.tileLayer(`${this.host}${this.frames[nx].path}/512/{z}/{x}/{y}/4/1_1.png`,
        { opacity: 0, zIndex: 300, maxZoom: 12, maxNativeZoom: 7 }).addTo(this.map);
    }
  },

  play() {
    this.playing = true;
    $('#rPlayIco').innerHTML = '<path d="M8.5 4.5v15M15.5 4.5v15"/>';
    clearInterval(this.timer);
    this.timer = setInterval(() => this.frame((this.i + 1) % this.frames.length), 620);
  },
  pause() {
    this.playing = false;
    $('#rPlayIco').innerHTML = '<path d="M7 4.5v15l13-7.5Z"/>';
    clearInterval(this.timer);
  },
};


/* ---------- Tus emplazamientos ──────────────────────────────────────
   Base propia de torres: Vantage, Totem o lo que sea. Vive en el
   teléfono, así que el buscador las encuentra SIN COBERTURA, que es
   justo donde suelen estar.

   Se importan pegando texto tal cual sale de Argos o de una hoja: el
   lector admite coma, punto y coma, tabulador o espacios, y coordenadas
   en decimal o en grados-minutos-segundos.

   Nada se adivina: la línea que no traiga dos coordenadas válidas se
   deja fuera y se te enseña, para que la corrijas tú.               */

const sinTildes = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Grados-minutos-segundos → decimal. */
function dms(g, m, sg, hemi) {
  let v = Math.abs(+g) + (+m || 0) / 60 + (+sg || 0) / 3600;
  if (/[SWO]/i.test(hemi)) v = -v;
  return v;
}

/** Lee una línea suelta. Devuelve el sitio o null si no hay coordenadas. */
function leerLineaSitio(linea) {
  let l = linea.trim();
  if (!l || /^#/.test(l)) return null;

  let lat = null, lon = null, trozo = null;

  // 1) Grados, minutos y segundos: 43°25'12"N  2°43'20"W
  const reDMS = /(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*([\d.,]+)?\s*["″]?\s*([NSEWO])/gi;
  const dd = [...l.matchAll(reDMS)];
  if (dd.length >= 2) {
    const a = dd.map(x => ({ v: dms(x[1], x[2], (x[3] || '0').replace(',', '.'), x[4]), h: x[4].toUpperCase() }));
    const la = a.find(x => 'NS'.includes(x.h)), lo = a.find(x => 'EWO'.includes(x.h));
    if (la && lo) { lat = la.v; lon = lo.v; trozo = dd[0][0] + '…' + dd[1][0]; }
  }

  // 2) Decimal: 43.4201 -2.7224 · 43,4201; -2,7224
  if (lat === null) {
    const m = l.match(/(-?\d{1,2}[.,]\d{3,})\s*[,;\t ]+\s*(-?\d{1,3}[.,]\d{3,})/);
    if (m) { lat = parseFloat(m[1].replace(',', '.')); lon = parseFloat(m[2].replace(',', '.')); trozo = m[0]; }
  }

  if (lat === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  // Lo que queda, quitando las coordenadas, es el nombre
  let resto = trozo ? l.replace(trozo, ' ') : l;
  if (dd.length >= 2) resto = resto.replace(reDMS, ' ');
  resto = resto.replace(/[,;\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  /* Altura de TRABAJO solo si viene marcada: "h45", "h 45 m". Un «413 m»
     a secas es la COTA del monte (Sollube), y hasta el 05-09-2026 se
     registraba como altura de trabajo: la racha se extrapolaba a 413 m
     sobre el suelo. Se guarda aparte, como cota. */
  let alt = null, cota = null;
  const ma = resto.match(/\b[hH]\s?(\d{2,3})\s*m?\b/);
  if (ma) { alt = +ma[1]; resto = resto.replace(ma[0], ' ').trim(); }
  const mcota = resto.match(/\b(\d{2,4})\s*m\b/);
  if (mcota) { cota = +mcota[1]; resto = resto.replace(mcota[0], ' ').trim(); }

  const op = /vantage|vodafone/i.test(resto) ? 'Vantage'
           : /totem|orange/i.test(resto)     ? 'Totem'
           : /cellnex/i.test(resto)          ? 'Cellnex' : '';
  if (op) resto = resto.replace(/vantage|vodafone|totem|orange|cellnex/ig, ' ').replace(/\s{2,}/g, ' ').trim();

  // Código de emplazamiento tipo BI1234 / 1234ABC, si lo hay al principio
  let cod = '';
  const mc = resto.match(/^([A-Z]{1,3}[-_ ]?\d{3,6}[A-Z]?)\b/i);
  if (mc) { cod = mc[1].toUpperCase().replace(/[-_ ]/g, ''); resto = resto.slice(mc[0].length).trim(); }

  const name = resto.replace(/^[-–·:.\s]+|[-–·:.\s]+$/g, '') || cod || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  return { cod, name, op, lat: +lat.toFixed(6), lon: +lon.toFixed(6), alt, cota };
}

function importarSitios(txt) {
  const buenas = [], malas = [];
  for (const l of String(txt).split(/\r?\n/)) {
    if (!l.trim()) continue;
    const r = leerLineaSitio(l);
    r ? buenas.push(r) : malas.push(l.trim());
  }
  // No duplicar: mismo código, o mismo punto a menos de ~30 m
  const cerca = (a, b) => Math.abs(a.lat - b.lat) < 0.0003 && Math.abs(a.lon - b.lon) < 0.0003;
  let nuevos = 0, repetidos = 0;
  for (const r of buenas) {
    const ya = S.sitios.find(x => (r.cod && x.cod === r.cod) || cerca(x, r));
    if (ya) { Object.assign(ya, { ...r, name: ya.name || r.name }); repetidos++; }
    else { S.sitios.push(r); nuevos++; }
  }
  LS.set('sitios', S.sitios);
  return { nuevos, repetidos, malas };
}

/** Busca en tus emplazamientos. Funciona sin conexión. */
function buscarSitios(term) {
  const t = sinTildes(term);
  if (!t) return [];
  return S.sitios
    .filter(x => sinTildes(x.name).includes(t) || sinTildes(x.cod).includes(t) || sinTildes(x.op).includes(t))
    .slice(0, 8)
    .map(x => ({
      name: x.cod ? `${x.name} · ${x.cod}` : x.name,
      admin1: [x.op, x.alt ? `${x.alt} m` : ''].filter(Boolean).join(' · ') || 'Emplazamiento propio',
      country: '', lat: x.lat, lon: x.lon, mio: true, alt: x.alt,
    }));
}

/* ---------- Catálogo de emplazamientos (Vantage, Vodafone, Totem…) ────
   2.692 emplazamientos con coordenadas, exportados del Centro Operativo
   (Argos). Se sirve como fichero estático (`data/estaciones.json`) y el
   service worker lo precachea, así que el buscador los encuentra por
   nombre, código, argosId o municipio TAMBIÉN SIN COBERTURA —que es donde
   están—. Solo lleva lo justo para buscar: ni llaves, ni contactos, ni
   notas de acceso.

   El fichero se regenera desde centro-operativo/data/estaciones.json; los
   1.039 sitios sin coordenadas no entran, porque sin lat/lon no hay tiempo
   que dar y no se inventa un punto.                                     */
async function cargarEstaciones() {
  if (S.estaciones) return S.estaciones;
  try {
    const r = await fetch('data/estaciones.json', { cache: 'force-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    S.estaciones = await r.json();
    S.estacionesFallo = null;
  } catch (e) {
    /* ── NO SE GUARDA LA LISTA VACÍA ─────────────────────────────────
       Cazado el 01-09-2026 buscando el patrón entero en vez de la
       función del día — suyo: *«esto me suena de ayer o anteayer y
       vuelve a fallar»*.

       Esto hacía `catch { S.estaciones = []; }`, y como `[]` también
       vale como «ya cargado», la línea de arriba lo daba por bueno y
       **no reintentaba nunca más en toda la sesión**. Un tropiezo de un
       segundo dejaba el buscador muerto: escribía BI SOLLUBEMENDI y le
       salía «nada», que él lee como «ese sitio no está», cuando lo que
       pasa es que el catálogo no se ha cargado. Sus 2.692 sitios.

       Ahora se deja SIN poner, para que el siguiente intento vuelva a
       pedirlo, y se apunta el fallo para poder decirlo en pantalla. */
    S.estacionesFallo = String(e?.message || e).slice(0, 60);
    return [];
  }
  return S.estaciones;
}

const titulo = s => (s || '').replace(/\b\p{L}/gu, c => c.toUpperCase());

/** Busca en el catálogo de emplazamientos. Requiere que ya esté cargado
 *  (cargarEstaciones()); si no lo está, devuelve vacío sin bloquear. */
function buscarEstaciones(term) {
  const t = sinTildes(term);
  if (t.length < 2 || !S.estaciones?.length) return [];
  const cand = [];
  for (const e of S.estaciones) {
    const c = sinTildes(e.c), n = sinTildes(e.n), m = sinTildes(e.m), a = e.a ? sinTildes(e.a) : '';
    // Menor puntuación = mejor: primero lo que EMPIEZA por lo escrito.
    let s;
    if (c.startsWith(t) || a.startsWith(t)) s = 0;
    else if (n.startsWith(t))              s = 1;
    else if (c.includes(t) || a.includes(t)) s = 2;
    else if (n.includes(t) || m.includes(t)) s = 3;
    else continue;
    cand.push({ s, e });
  }
  cand.sort((x, y) => x.s - y.s || x.e.c.localeCompare(y.e.c));
  return cand.slice(0, 8).map(({ e }) => ({
    name: e.n && e.n !== e.c ? `${e.n} · ${e.c}` : e.c,
    admin1: [e.o, titulo(e.m)].filter(Boolean).join(' · '),
    country: '', lat: e.lat, lon: e.lon, est: true,
  }));
}

function renderSitios() {
  const el = $('#sitios');
  if (!el) return;
  if (!S.sitios.length) {
    el.innerHTML = `<p class="note">Todavía no has importado ninguno.
      Pega la lista abajo y aparecerán en el buscador.</p>`;
    return;
  }
  el.innerHTML = `<div class="sitl">` + S.sitios.map((x, i) => `
    <div class="sit">
      <div>
        <b>${esc(x.name)}</b>
        <span>${esc([x.cod, x.op, x.alt ? `${x.alt} m` : ''].filter(Boolean).join(' · '))}</span>
        <span class="sit__c">${x.lat.toFixed(5)}, ${x.lon.toFixed(5)}</span>
      </div>
      <button class="sit__x" data-sit="${i}" title="Quitar">✕</button>
    </div>`).join('') + `</div>`;
}

/* ---------- 15. Búsqueda de emplazamiento ---------- */

const COORD = /^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/;

async function search(term) {
  const m = term.match(COORD);
  if (m) {
    const lat = parseFloat(m[1].replace(',', '.')), lon = parseFloat(m[2].replace(',', '.'));
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return [{ name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, admin1: 'Coordenadas', country: '', lat, lon }];
    }
  }
  // Los tuyos primero, y sin red: en el monte no hay buscador que valga.
  const mios = buscarSitios(term);
  // Después, el catálogo de emplazamientos (Vantage, Vodafone, Totem…),
  // que también funciona sin cobertura.
  await cargarEstaciones();
  const est = buscarEstaciones(term);

  let fuera = [];
  try {
    const d = await jget(API.geo, { name: term, count: 8, language: 'es', format: 'json' });
    fuera = (d.results ?? []).map(r => ({
      name: r.name, admin1: r.admin1 ?? '', country: r.country ?? '',
      lat: r.latitude, lon: r.longitude, elev: r.elevation,
    }));
  } catch { /* sin cobertura: se sigue con los tuyos */ }

  return [...mios, ...est, ...fuera];
}

/* ── EL MISMO SITIO NO SALE DOS VECES ────────────────────────────────
   Suyo, 02-09-2026, mirando la lista:  *«duplicadas las estaciones»*.

   Medido: de sus 2.692 fichas hay **34 puntos con más de una**, y de
   ésos **4 son la misma ficha repetida** — misma coordenada al metro,
   mismo nombre, mismo operador, y el código interno de una es el código
   de la otra:

       BI MAYOR 10 LAS ARENAS   c=ES-TIMS-52275 (a=96069)  +  c=96069
       VI AVDA MADRID BETOÑO    c=ES-TIMS-53856 (a=71943)  +  c=71943
       VI CATEDRAL VIEJA        c=ES-TIMS-53897 (a=78185)  +  c=78185
       VI CUENCA DEBA           c=ES-TIMS-50934 (a=74835)  +  c=74835

   Los otros 30 son dos códigos de Totem en el mismo punto con nombres
   distintos (BI0025 y BI0152, por ejemplo). Ésos NO se tocan: pueden ser
   dos antenas de verdad en el mismo emplazamiento y no me consta que no.

   Y no se borra nada del catálogo —su regla: nunca se pierde nada—: se
   agrupan al ENSEÑARLOS, y la ficha que queda lleva los dos códigos. */
function sinDuplicados(list) {
  const porPunto = new Map();
  const fuera = new Set();
  for (const r of list) {
    if (!has(r?.lat) || !has(r?.lon)) continue;
    const k = `${r.lat.toFixed(5)},${r.lon.toFixed(5)}`;
    const antes = porPunto.get(k);
    if (!antes) { porPunto.set(k, r); continue; }
    /* Solo si es la MISMA ficha: mismo nombre, o el código de una es el
       código interno de la otra. Nombres distintos = sitios distintos. */
    const mismaFicha = antes.n === r.n
      || antes.a === r.c || r.a === antes.c;
    if (!mismaFicha) continue;
    /* Se queda la que tiene el código corto —el que él usa— y se apunta
       el otro para poder decirlo. */
    const queda = String(r.c || '').startsWith('ES-TIMS-') ? antes : r;
    const otro  = queda === antes ? r : antes;
    queda.otroC = otro.c;
    porPunto.set(k, queda);
    fuera.add(otro);
  }
  return fuera.size ? list.filter(r => !fuera.has(r)) : list;
}

function renderAc(list) {
  const ac = $('#ac');
  /* ── SI EL CATÁLOGO NO SE CARGÓ, SE DICE ─────────────────────────────
     Sin esto, un fallo al leer `data/estaciones.json` dejaba el buscador
     devolviendo «nada» para sus 2.692 emplazamientos, y «nada» se lee
     como «ese sitio no existe». Es el mismo fallo del almacén, pero en
     el buscador: un hueco JAMÁS puede leerse como una respuesta. */
  if (!list.length && S.estacionesFallo) {
    ac.innerHTML = `<li class="ac__fallo" data-no="1">`
      + `<span>No he podido cargar tu catálogo de emplazamientos`
      + ` (${esc(S.estacionesFallo)}).</span>`
      + `<small>Eso no quiere decir que el sitio no esté: vuelve a escribir para reintentar.</small></li>`;
    ac._list = [];          // que no quede la lista de la búsqueda anterior
    ac.hidden = false;
    return;
  }
  if (!list.length) { ac.hidden = true; return; }
  list = sinDuplicados(list);
  ac.innerHTML = list.map((r, i) => {
    const cls = r.mio ? ' class="is-mio"' : r.est ? ' class="is-est"' : '';
    const ic  = r.mio ? '<i>▮</i> ' : r.est ? '<i>▲</i> ' : '';
    return `<li data-i="${i}"${cls}><span>${ic}${esc(r.name)}</span>
     <small>${esc([r.admin1, r.country].filter(Boolean).join(' · '))}</small></li>`;
  }).join('');
  ac._list = list;
  ac.hidden = false;
}


/* ---------- Trabajar sin cobertura ──────────────────────────────────
   En el monte, junto a las torres, muchas veces no hay señal. Y es
   justo donde hace falta mirar esto.

   Reglas, porque aquí equivocarse cuesta caro:

   1. Lo guardado se enseña SIEMPRE con su hora de descarga. Un dato sin
      fecha es peor que no tener dato: no sabes si es de hace diez
      minutos o de anteayer.
   2. Si la copia tiene más de 6 h se avisa en ámbar, y más de 24 h en
      rojo, porque una previsión vieja ya no vale para decidir.
   3. Nunca se rellena nada. Si de una torre no hay copia, se dice.     */

const COPIA_AVISA_H  = 6;     // a partir de aquí, aviso en ámbar
const COPIA_CADUCA_H = 24;    // a partir de aquí, aviso en rojo

/** Guarda la copia con su sello de tiempo. */
function guardarCopia(place, data) {
  LS.set('cache.' + ckey(place), { ...data, _t: Date.now() });
}

/** Devuelve {data, edadH, t} o null. */
function leerCopia(place) {
  const c = LS.get('cache.' + ckey(place));
  if (!c) return null;
  const t = c._t ?? null;
  const edadH = t ? (Date.now() - t) / 3600000 : null;
  return { data: c, t, edadH };
}

function textoEdad(t, edadH) {
  if (!t) return 'de una descarga anterior, sin hora registrada';
  const h = new Date(t);
  const cuando = h.toLocaleString('es', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  if (edadH < 1)  return `descargado hace ${Math.max(1, Math.round(edadH * 60))} min (${cuando})`;
  if (edadH < 48) return `descargado hace ${Math.round(edadH)} h (${cuando})`;
  return `descargado el ${cuando}`;
}

function nivelEdad(edadH) {
  if (edadH === null) return 'warn';
  if (edadH >= COPIA_CADUCA_H) return 'no';
  if (edadH >= COPIA_AVISA_H)  return 'warn';
  return 'go';
}

/** Barra fija que avisa de que lo que se ve es una copia guardada. */
function avisoCopia(info) {
  const el = $('#copia');
  if (!el) return;
  if (!info) { el.hidden = true; el.innerHTML = ''; return; }
  const n = nivelEdad(info.edadH);
  el.hidden = false;
  el.dataset.s = n;
  const extra = n === 'no'
    ? ' <b>Tiene más de un día: no decidas con esto.</b> Busca cobertura o llama a control.'
    : n === 'warn'
      ? ' <b>Conviene actualizarla</b> en cuanto pilles cobertura.'
      : '';
  el.innerHTML = `<b>Sin conexión.</b> Estás viendo una copia guardada,
    ${esc(textoEdad(info.t, info.edadH))}.${extra}`;
}

/* ---------- Preparar la salida al monte ----------
   Descarga la previsión de TODOS los emplazamientos guardados y la deja
   en el teléfono. Se hace de dos en dos para no disparar el límite del
   servicio, y se cuenta lo que ha entrado de verdad. */

async function prepararMonte() {
  const btn = $('#btnMonte');
  const est = $('#monteEstado');
  const sitios = [...S.saved];
  if (S.place && !sitios.some(p => key(p) === key(S.place))) sitios.unshift(S.place);

  if (!sitios.length) {
    if (est) est.textContent = 'Guarda antes algún emplazamiento con el ♥.';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Descargando…'; }
  let ok = 0, fallo = 0, i = 0;

  const siguiente = async () => {
    while (i < sitios.length) {
      const p = sitios[i++];
      if (est) est.textContent = `Descargando ${ok + fallo + 1} de ${sitios.length}…`;
      try {
        const d = await loadAll(p);
        guardarCopia(p, d);
        ok++;
      } catch { fallo++; }
    }
  };
  await Promise.all([siguiente(), siguiente()]);   // de dos en dos

  LS.set('monte.t', Date.now());
  if (btn) { btn.disabled = false; btn.textContent = 'Guardar para el monte'; }
  pintarEstadoMonte();
  toast(fallo
    ? `Guardados ${ok} de ${sitios.length} — ${fallo} sin descargar`
    : `Listo: ${ok} emplazamiento${ok > 1 ? 's' : ''} guardado${ok > 1 ? 's' : ''} para consultar sin cobertura`, 4600);
}

/** Qué hay guardado ahora mismo y de cuándo. */
function pintarEstadoMonte() {
  const est = $('#monteEstado');
  if (!est) return;
  const sitios = [...S.saved];
  if (S.place && !sitios.some(p => key(p) === key(S.place))) sitios.unshift(S.place);
  if (!sitios.length) { est.textContent = 'Guarda algún emplazamiento con el ♥ y podrás descargarlo aquí.'; return; }

  const copias = sitios.map(p => ({ p, c: leerCopia(p) })).filter(x => x.c);
  if (!copias.length) { est.innerHTML = `<b>No hay nada guardado todavía.</b>
    Descárgalo antes de salir, con cobertura.`; return; }

  const masVieja = Math.max(...copias.map(x => x.c.edadH ?? 999));
  const n = nivelEdad(masVieja);
  est.innerHTML = `<span class="mst" data-s="${n}"></span>
    Guardados <b>${copias.length} de ${sitios.length}</b>.
    La más antigua, ${esc(textoEdad(copias.find(x => (x.c.edadH ?? 999) === masVieja).c.t, masVieja))}.`;
}

/* ---------- 16. Carga y pintado ---------- */

async function go(place, { silent = false } = {}) {
  S.place = place;
  LS.set('place', place);
  // Si el mapa de modelos está abierto, que salte al nuevo sitio (no se
  // quede en el anterior). Si no lo está, no hace nada.
  if (typeof Maps !== 'undefined') Maps.irA(place);
  $('#pName').className = ''; $('#pName').textContent = place.name;
  $('#pMeta').className = 'dim';
  $('#pMeta').textContent = [place.admin1, place.country].filter(Boolean).join(' · ')
    + ` · ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`
    + (has(place.elev) ? ` · ${place.elev} m` : '');

  $('#reloadSvg').classList.add('spin');
  try {
    const data = await loadAll(place);
    data.hours = buildHours(data.fc, S.hgt);
    S.data = data;
    /* ── LA VOTACIÓN ANTES DE PINTAR (09-09-2026) ────────────────────
       Calpe, 21:24, dos capturas de «Ahora» del mismo minuto con la mañana
       del jueves distinta: la primera pintada con el cielo de AROME a
       secas, la segunda cinco segundos después, cuando llegó la votación
       de los cuatro modelos y repintó. Las dos eran coherentes por dentro,
       pero él vio «un icono que cambia solo», y con cuatro semanas de
       iconos bailando eso ya no vale. Ahora se espera a la comparativa
       (como mucho 7 s) y lo primero que se pinta es lo definitivo. Si
       tarda más, se pinta con lo que hay y la votación repinta al llegar,
       como antes. */
    await Promise.race([cargarComparativa(place).catch(() => {}), new Promise(r => setTimeout(r, 7000))]);
    /* Y la comparación a diez días, para la pestaña «10 días». Va aquí
       al lado porque comparte el mismo disparador: sitio nuevo, datos
       nuevos. No se espera a ella —llega cuando llega y repinta sola—,
       así que no retrasa nada de lo que él mira primero. */
    cargarDiariaMulti(place);
    S.sel = 0;
    guardarCopia(place, data);
    avisoCopia(null);
    paint();
    // Las descargas medidas van por su cuenta: tardan lo suyo y no pueden
    // retrasar la ficha. Si fallan, lo dicen en su sitio y ya está.
    cargarRayosAemet({ forzar: true }).catch(() => {});
    // Y si otro modelo ve tormenta donde el tuyo no, que se sepa.
    cargarDiscrepancia(place).catch(() => {});
    if (!silent) toast(`Datos actualizados · ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`);
  } catch (e) {
    const cuota = /429/.test(e.message);
    const copia = leerCopia(place);
    if (copia) {
      const c = copia.data;
      c.hours = buildHours(c.fc, S.hgt);
      S.data = c;
      avisoCopia(copia);
      paint();
      toast(cuota ? 'Límite diario agotado — mostrando copia guardada'
                  : `Sin conexión — copia ${textoEdad(copia.t, copia.edadH)}`, 5600);
    } else {
      avisoCopia(null);
      avisoSinDatos(cuota, e.message);
      toast(cuota ? 'Límite diario de la API agotado desde esta conexión' : 'Sin datos: ' + e.message, 5200);
    }
  } finally {
    $('#reloadSvg').classList.remove('spin');
    syncFav();
  }
}

/* Clave de emplazamiento (identidad) y clave de caché (identidad + modelo). */
/** Explica en pantalla por qué no hay datos, en vez de dejar esqueletos
 *  grises. Un hueco sin explicación en una app de decisión es peor que
 *  un error: no sabes si es que no hay viento o es que no hay dato. */
function avisoSinDatos(cuota, msg) {
  const html = cuota ? `
    <div class="nodata">
      <b>No hay datos ahora mismo desde esta conexión</b>
      <p>El servicio gratuito de previsión (Open-Meteo) ha alcanzado su
      <b>límite diario de peticiones</b> para tu red. Se repone al cambiar el día
      en horario UTC (sobre las 02:00).</p>
      <p><b>Mientras tanto sí funcionan:</b> las pestañas <b>Mapas</b> y <b>Radar</b>,
      que usan otro servicio distinto. Y desde el móvil con datos móviles
      (otra red) funciona todo.</p>
      <p class="nodata__x">Ningún dato de esta pantalla se rellena con estimaciones:
      si no hay dato, no se muestra nada.</p>
    </div>` : `
    <div class="nodata">
      <b>No se han podido descargar los datos</b>
      <p>${esc(msg || '')}</p>
      <p>Comprueba la conexión y pulsa el botón de actualizar.</p>
    </div>`;
  const t = document.querySelector('[data-v="tower"]');
  if (t && !t.querySelector('.nodata')) t.insertAdjacentHTML('afterbegin', html);
}

const key   = p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;

/* ── SUS TORRES, LAS MISMAS EN TODOS SUS APARATOS ─────────────────────
   Suyo, 26-08-2026 a las 23:39, abriendo la app en el Mac: *«en la app
   web no veo ninguna de mis torres, Arbaiza etc no salen con sus
   CAPEs»*, *«no salen como aquí»*.

   Y tenía que pasar: vivían en el `localStorage` del aparato. Estaban en
   el Android y el Mac estaba vacío. Peor todavía: **el día que cambiara
   de móvil se quedaba sin ellas**, y son catorce con sus coordenadas
   puestas a mano desde cada caseta.

   REGLA: **nunca se pierde un emplazamiento.** Al arrancar se JUNTAN la
   lista del aparato y la del servidor; no se pisa una con otra. Quitar
   solo lo hace él, con el corazón, y eso sí se manda como sustitución.

   Y si el servidor no contesta, **no pasa nada**: se sigue con lo que
   hay en el aparato. Esto es una comodidad, no puede ser un punto de
   fallo — sin cobertura en el monte la app tiene que funcionar igual. */
/* ── LA COTA VIAJA CON EL EMPLAZAMIENTO ──────────────────────────────
   Encontrado el 27-08-2026 hablando de lo que de verdad hace: subir un
   grupo electrógeno en remolque, de noche, por una pista de monte, solo,
   después de que un rayo haya tumbado la red.

   Para esa salida la app compara **el isocero con la cota del sitio** y
   le dice si va a haber hielo en la pista. Sin cota no puede: se calla y
   pone «sin la cota de este emplazamiento no puedo».

   Y la cota vivía **solo en el `localStorage` de cada aparato**. Los
   emplazamientos sí se sincronizaban desde el 26-08 —él lo pidió al ver
   el Mac vacío— pero su configuración no. O sea: cambiaba de móvil, o
   reinstalaba la app, y **perdía las cotas sin enterarse**. Justo esa
   noche. Justo ese aviso.

   Y ese mismo día reinstaló en el Mac y estaba a punto de reinstalar en
   el móvil.

   El servidor ya sabía guardar `elev`, `tipo` y `hgt` —estaba previsto
   en `limpiar()`— pero la app nunca se los mandaba. Ahora sí, en las dos
   direcciones y con la misma regla que la lista: **nunca se pierde nada**.
   Lo que hay aquí manda sobre lo que llega; lo que llega rellena huecos. */
function conSuConfig(p) {
  const c = LS.get('cfg.' + key(p), null);
  const vieja = LS.get('siteElev.' + key(p), null);
  const cota = has(c?.cota) ? c.cota : (has(vieja) ? vieja : null);
  const o = { ...p };
  if (has(cota)) o.elev = cota;
  if (c?.tipo) o.tipo = c.tipo;
  if (has(c?.alt)) o.hgt = c.alt;
  return o;
}

function adoptarConfig(torres) {
  let cambios = 0;
  for (const t of torres) {
    if (!has(t?.elev) && !t?.tipo) continue;
    const k = 'cfg.' + key(t);
    const yo = LS.get(k, null);
    /* NUNCA se pisa lo que él haya puesto en ESTE aparato: solo se
       rellenan los huecos. Si aquí ya hay cota, la de fuera no entra. */
    const cota = has(yo?.cota) ? yo.cota : (has(t.elev) ? t.elev : null);
    const tipo = yo?.tipo || t.tipo || 'torre';
    const alt  = has(yo?.alt) ? yo.alt : (has(t.hgt) ? t.hgt : S.hgt);
    if (yo && yo.cota === cota && yo.tipo === tipo && yo.alt === alt) continue;
    LS.set(k, { tipo, cota, alt });
    if (has(cota)) LS.set('siteElev.' + key(t), cota);
    cambios++;
  }
  return cambios;
}

/* ── LA COPIA DE LAS TORRES, PARA CUANDO EL SERVIDOR NO CONTESTA ──────
   Desde GitHub Pages (pentxa-design.github.io) el servidor de Vercel no
   deja hablar a /api/* con otro dominio (sin cabeceras CORS), así que un
   aparato recién instalado allí se quedaría sin sus torres. Para eso está
   `data/torres-copia.json`: las 20 del servidor a 07-09-2026, con sus
   cotas. Solo entra cuando AQUÍ no hay ninguna: nunca pisa una lista que
   ya exista en el aparato, y en cuanto el servidor vuelva a contestar,
   manda él. */
async function torresDeLaCopia() {
  if (S.saved.length) return null;
  try {
    const r = await fetch('data/torres-copia.json', { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j?.torres) && j.torres.length ? j : null;
  } catch { return null; }
}

async function sincronizarTorres({ mandar = false } = {}) {
  let j = null;
  try {
    const r = await fetch('/api/torres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torres: S.saved.map(conSuConfig),
                             modo: mandar ? 'mandar' : 'juntar' }),
      cache: 'no-store',
    });
    if (r.ok) j = await r.json();
  } catch {}
  if (!Array.isArray(j?.torres)) {
    j = await torresDeLaCopia();
    if (!j) return false;
  }
  try {

    /* La configuración que venga se adopta SIEMPRE, aunque la lista de
       sitios no haya cambiado: es el caso de este aparato recién
       instalado con las torres ya puestas pero sin una sola cota. */
    const nuevaCfg = adoptarConfig(j.torres);

    /* Si el servidor devuelve algo distinto de lo que hay aquí, se
       adopta y se repinta. Es el caso del Mac vacío: llega la lista del
       móvil y aparecen las catorce. */
    /* ── UNA LISTA VACÍA NUNCA PISA UNA LLENA ────────────────────────
       Cazado el 01-09-2026 con el almacén de Vercel suspendido. Hoy la
       app se salva porque el servidor devuelve 500 y el `if (!r.ok)` de
       arriba corta — pero eso es suerte, no diseño: si el día de mañana
       el almacén contesta OK con la lista VACÍA (un fichero recién
       creado, una caja equivocada, un despliegue a medias), esta rama
       adoptaría el vacío y **le borraría sus veinte emplazamientos del
       aparato**, que es lo único que le queda cuando el servidor falla.

       Perder un emplazamiento significa no mirar ese sitio antes de
       mandar a alguien. Así que el vacío se rechaza y se dice. */
    if (!j.torres.length && S.saved.length) {
      S.torresNoSeAdopto = 'el servidor devolvió la lista vacía y aquí hay '
        + S.saved.length + ': se queda la de este aparato';
      return false;
    }

    const igual = j.torres.length === S.saved.length
      && j.torres.every((p, i) => key(p) === key(S.saved[i]));
    if (!igual) {
      S.saved = j.torres;
      LS.set('saved', S.saved);
      syncFav();
      if (S.view === 'torres') cargarTorres();
    } else if (nuevaCfg && S.view === 'torres') {
      cargarTorres();          // las cotas nuevas cambian el aviso de acceso
    }
    return true;
  } catch { return false; }
}

/* ═══ SUS AJUSTES, IGUALES EN EL MAC Y EN EL MÓVIL ════════════════════
   Suyo, 30-08-2026 a las 19:50, con los dos aparatos delante:

     *«PERO YO QUIERO TENER LO MISMO QUE EN EL MAC. SI SE TOCA ALGO QUE
       SE VEAN IGUAL. LA MAYORÍA DE LAS VECES TIRO DEL MÓVIL, SOCIO»*
     *«el pronóstico tiene que ser lo mismo: el Mac tiene que ser una
       calca en el móvil»*

   Ese día el Mac llevaba un modelo y el móvil otro —cada uno con su
   elección guardada solo en su aparato— y los titulares no coincidían.
   El MISMO agujero que ya taparon las torres el 26-08: lo que él
   configura no puede vivir en un solo cacharro.

   VIAJAN los ajustes que cambian el pronóstico o la lectura: el modelo,
   la unidad de viento, la altura de trabajo, los umbrales y el tamaño
   de letra. NO viajan `place` (cada aparato mira donde quiera: abrir
   Boiro en el Mac no puede cambiarle el móvil mientras conduce), ni el
   estado de pantalla, ni los emplazamientos, que ya tienen su
   `/api/torres`. El tipo de trabajo de cada sitio también va por
   torres, con su emplazamiento.

   LA REGLA es la CONTRARIA a la de las torres: aquí **manda el último
   cambio**, campo por campo. Cambiar de modelo es una decisión que pisa
   a propósito la anterior; y por campos, para que tocar el modelo en el
   móvil no le devuelva unos umbrales viejos del Mac. Cada ajuste lleva
   la hora en que se tocó (`ajustesT`) y gana el más nuevo.

   CUÁNDO: al arrancar, al volver a la app (es el gesto real: sacar el
   móvil del bolsillo), cada 5 min con la comprobación de versión, y
   nada más tocar un ajuste. Si el servidor no contesta, la app sigue
   con lo suyo — el ajuste local nunca se pierde ni se bloquea.       */

const AJUSTES_QUE_VIAJAN = ['model', 'wunit', 'hgt', 'thr', 'zoom'];

/** Se llama nada más tocar él un ajuste: apunta la hora del cambio y
 *  manda en breve. El retén de 800 ms junta una ráfaga de toques (los
 *  cuatro umbrales seguidos) en un solo envío. */
function ajusteTocado(k) {
  const t = LS.get('ajustesT', {});
  t[k] = Date.now();
  LS.set('ajustesT', t);
  clearTimeout(ajusteTocado._t);
  ajusteTocado._t = setTimeout(() => sincronizarAjustes(), 800);
}

/** Lo que ESTE aparato tiene que contar: solo los ajustes que él ha
 *  tocado aquí alguna vez, cada uno con su hora. Un aparato recién
 *  instalado no manda nada — y por eso mismo lo adopta todo. */
function recogerAjustes() {
  const t = LS.get('ajustesT', {});
  const val = { model: S.model, wunit: S.wunit, hgt: S.hgt,
                thr: S.thr, zoom: LS.get('zoom', 1) };
  const out = {};
  for (const k of AJUSTES_QUE_VIAJAN)
    if (t[k] && val[k] !== undefined) out[k] = { v: val[k], t: t[k] };
  return out;
}

/** Adopta del servidor lo que sea MÁS NUEVO que lo de aquí, y aplica
 *  cada cosa por su camino: el modelo recarga los datos, los umbrales
 *  recalculan el semáforo, la letra solo cambia el tamaño. */
function adoptarAjustes(remoto) {
  const t = LS.get('ajustesT', {});
  /* Lo que vale AHORA en este aparato, para reconocer en la respuesta
     nuestro propio cambio aunque venga con otra hora (ver abajo). */
  const mio = { model: S.model, wunit: S.wunit, hgt: S.hgt,
                thr: S.thr, zoom: LS.get('zoom', 1) };
  let repintar = false, recargar = false;
  for (const k of AJUSTES_QUE_VIAJAN) {
    const r = remoto?.[k];
    if (!r || r.v === undefined || r.v === null) continue;
    if (t[k] && Number(t[k]) >= Number(r.t)) {
      /* Mismo valor con hora más vieja: es NUESTRO cambio, con la hora
         que el servidor le recortó (un reloj adelantado marca horas del
         futuro). Se adopta SU hora — si no, este aparato se creería
         «más nuevo» para siempre y no adoptaría nada de nadie. */
      if (JSON.stringify(r.v) === JSON.stringify(mio[k])) t[k] = Number(r.t);
      continue;
    }
    t[k] = Number(r.t);
    if (k === 'model' && r.v !== S.model) {
      S.model = r.v; LS.set('model', S.model);
      /* La migración del arranque mueve best_match→arome UNA vez; si el
         modelo llega de fuera es que él ya eligió, y no se le pisa. */
      LS.set('fueraAuto', true);
      recargar = true;
    } else if (k === 'wunit' && r.v !== S.wunit) {
      S.wunit = r.v; LS.set('wunit', S.wunit); repintar = true;
    } else if (k === 'hgt' && +r.v !== S.hgt) {
      S.hgt = +r.v; LS.set('hgt', S.hgt); repintar = true;
    } else if (k === 'thr') {
      S.thr = { ...DEFAULT_THR, ...r.v }; LS.set('thr', S.thr); repintar = true;
    } else if (k === 'zoom') {
      ponerZoom(r.v, false);        // sin `guardar`: guardamos nosotros,
      LS.set('zoom', +r.v);         // que ponerZoom marcaría hora nueva
    }
  }
  LS.set('ajustesT', t);
  if (recargar) {
    if (S.place) go(S.place);       // go repinta entero, selector incluido
    return true;
  }
  if (repintar) {
    renderThr();
    if (S.data) S.data.hours = buildHours(S.data.fc, S.hgt);
    paint();
  }
  return repintar;
}

async function sincronizarAjustes() {
  try {
    const r = await fetch('/api/ajustes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ajustes: recogerAjustes() }),
      cache: 'no-store',
    });
    if (!r.ok) return false;
    const j = await r.json();
    if (j?.ajustes) adoptarAjustes(j.ajustes);
    return true;
  } catch { return false; }
}
const ckey  = p => `${key(p)}#${S.model}`;


/** Por qué falta el estado del cielo.
 *  AROME y algún otro modelo de área limitada NO publican weather_code.
 *  Un «Sin dato» pelado parece una avería; conviene decir a qué se debe. */

/* ═══ EL AVISO DEL CIELO — UNO SOLO PARA LAS TRES PANTALLAS ═══════════
   Suyo, 30-08-2026: *«pero que quede automatizado, sin tener que
   corregir a diario, y también en Torre, Ahora y Mis torres»*.

   Y es la lección de toda la mañana: **el fallo se repite porque cada
   pantalla escribe el cielo por su cuenta**. Pasó con el reparto de
   modelos (una pedía todo al Automático), con la columna de nulos (hubo
   que taparla dos veces) y ahora con el símbolo.

   `cieloRaro()` ya sabía desde el 28-08 que los modelos no ven el mismo
   cielo —salió con su foto de medio cielo cubierto y la app diciendo
   «Despejado 0 %»— pero solo lo decía en la tarjeta de Nubosidad. El
   rótulo grande, la ficha de Torre y las franjas seguían sin mirarlo.

   Aquí vive UNA vez. El día que cambie la regla, cambia en las tres o
   no cambia en ninguna. Y `pruebas.js` no deja publicar si alguna
   pantalla escribe el cielo sin pasar por aquí.

   NO CAMBIA EL SÍMBOLO, que es el de su modelo y él lo ha elegido: le
   pone al lado lo que ven los demás, con el número. Decide él.
   ═════════════════════════════════════════════════════════════════════ */
/* ── EL AVISO TIENE QUE DECIR POR QUÉ HA SALTADO ────────────────────
   Lo vio él en su pantalla el 02-09-2026: «Despejado ⚠ los otros ven
   18 % de nubes». Un 18 % no es motivo de aviso, y así leído parece que
   la app se queja por nada.

   Y no era eso: el aviso había saltado por el ABANICO —los modelos se
   separan 50 puntos o más entre ellos— pero el texto enseñaba la
   MEDIANA. O sea que decía un número que no era el que lo disparó.

   Es el mismo fallo del veredicto de la racha del mismo día: enseñar un
   número y razonar con otro. Ahora el texto dice lo que ha pasado:
   · si uno se descuelga  → «los otros ven X %», que es la mediana
   · si el abanico es ancho → «van de X a Y», que es lo que de verdad
     hay: los modelos no se ponen de acuerdo sobre el cielo.           */
function avisoCielo(nubes, { corto = false } = {}) {
  const r = cieloRaro(nubes);
  if (!r) return '';
  /* `cuantos` es cuántos se separan 45 puntos o más de lo que él ve. Si
     no hay ninguno, lo que saltó fue el abanico entre ellos. */
  /* ── LA RAMA MUERTA ──────────────────────────────────────────────
     `r.cuantos === 0` no era cierto NUNCA: `cieloRaro` devuelve null antes
     de contar si no hay nadie en contra. Así que siempre salía «los
     otros ven X %» con la mediana — y cuando lo que disparó el aviso
     fue UN modelo a un abismo (él 3 %, otros 0·2·5·95) el titular decía
     «⚠ los otros ven 5 %»: un triángulo con un número que le daba la
     razón, y cuatro centímetros más abajo «van de 0 a 95 %». Los datos
     para decirlo bien ya venían en `r` (porAbismo, quienes, suLectura)
     y no los leía nadie. Revisión del 04-09-2026. */
  if (r.porAbismo) {
    const q = esc(r.quienes?.[0] || 'otro modelo');
    return corto
      ? ` <span class="nd__ojo">⚠ ${q} lo ve ${r.suLectura}</span>`
      : ` <span class="nd__ojo">⚠ ${q} ve el cielo ${r.suLectura}:`
        + ` van del ${r.bajo} al ${r.alto} % de nubes</span>`;
  }
  return corto
    ? ` <span class="nd__ojo">⚠ otros ${r.mediana} %</span>`
    : ` <span class="nd__ojo">⚠ los otros ven ${r.mediana} % de nubes</span>`;
}

/* ── DE NOCHE NO HAY SOL QUE VELAR ─────────────────────────────────
   Calpe, 08-09-2026 a las 23:49: luna con velo y debajo «Sol velado».
   El código 4 es el mismo, el texto no: de noche es «Velo de nubes
   altas». `dia` es el is_day de la hora (o el 8-19 de esDeDia). */
function textoVisto(code, dia = 1) {
  if (code === VELADO && dia === 0) return 'Velo de nubes altas';
  return wmoText(code);
}
/* De día si la mayoría de las horas lo son; sin is_day, la hora del medio
   entre las 8 y las 19. Misma regla que deDia() en las franjas. */
function esDeDia(sel) {
  const con = (sel || []).filter(h => has(h.day));
  if (con.length) return con.filter(h => h.day === 1).length * 2 >= con.length ? 1 : 0;
  const media = sel?.[Math.floor(sel.length / 2)]?.date?.getHours();
  return has(media) && media >= 8 && media <= 19 ? 1 : 0;
}

function textoCielo(code, dia = 1) {
  const t = textoVisto(code, dia);
  if (t) return t;
  return `Estado del cielo: ${esc(modeloDato().name)} no lo publica`;
}

/** Ejecuta el pintado de una sección sin que se lleve por delante el resto.
 *
 *  LO QUE PASÓ (23-08-2026): renderSea() reventaba con "ex is not defined"
 *  y, como iba en medio de paint(), se llevaba todo lo que venía detrás:
 *  los avisos, la tabla de mareas y —lo peor— la línea que dice
 *  «⚠ Datos caducados, pulsa actualizar». El aviso que existía justo para
 *  cantar los datos viejos lo mataba el propio fallo.
 *
 *  Y en el arranque paint() se ejecuta ANTES de pedir datos nuevos, así
 *  que al petar tampoco se llegaba a refrescar, ni a mirar si hay versión
 *  nueva, ni a registrar el funcionamiento sin cobertura. La app se
 *  quedaba congelada en la última copia buena: se vio una previsión de
 *  hacía OCHO HORAS en pantalla, sin una sola marca de que lo fuera.
 *
 *  Ahora cada sección va aparte. Si una falla, las demás siguen, y la que
 *  ha fallado lo DICE en su sitio en vez de quedarse en blanco: un hueco
 *  callado se confunde con "aquí no pasa nada".                        */
function seguro(nombre, fn, destino) {
  try { fn(); return true; }
  catch (e) {
    // Que salga también en el aviso de arriba, no solo en su hueco
    try { Petardazo.registrar('pintar ' + nombre, e); } catch { console.error(e); }
    const el = destino && document.querySelector(destino);
    if (el) el.innerHTML = `<p class="note"><b>Esta parte no se ha podido dibujar</b>
      (${esc(String(e.message || e).slice(0, 80))}). El resto de la app sigue bien.
      No te fíes de lo que hubiera aquí antes.</p>`;
    return false;
  }
}

function paint() {
  if (!S.data) return;
  seguro('comparativa', renderComparativa);
  document.querySelectorAll('.nodata').forEach(e => e.remove());
  seguro('torre',  renderTower);
  seguro('ahora',  renderNow);
  seguro('horas',  renderHours);
  seguro('días',   renderDays);
  seguro('mar',    renderSea,   '#seaCard');
  seguro('avisos', renderAlerts);
  seguro('tropicales', renderTropicales);
  // La tabla oficial de mareas se pide aparte, sin bloquear el pintado
  if (enCostaVasca(S.place)) cargarMareas().then(pintarMareas).catch(() => {});
  const d = new Date(S.data.at);
  const stale = Date.now() - S.data.at > 45 * 60e3;
  $('#updated').innerHTML = `${stale ? '⚠ ' : ''}Datos de las ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` +
    (stale ? ' <b>(caducados, pulsa actualizar)</b>' : '') +
    ` · <span class="build" title="Versión de la app que tienes cargada">v${BUILD}</span>`;
  clock();
  vigilarCielo('pintar');
}

/* ═══ LA APP SE VIGILA EL CIELO A SÍ MISMA (09-09-2026) ═════════════════
   Aitor, tras cuatro semanas: *«cada día algo mal: en Ahora una cosa, en
   10 días otra… lo reparaba, pasaban 24 h y vuelta a empezar»*.

   Después de cada pintado se comprueba que lo que HAY EN PANTALLA es lo
   que dicen las horas ahora mismo: el icono grande contra la hora en
   curso, la primera tarjeta de «Horas» contra el icono grande, cada
   franja contra sus horas, cada día de «10 días» contra las suyas. Si
   algo no cuadra, se repinta, se apunta en torre.fallos y se avisa; si
   tras repintar sigue sin cuadrar, sale la barra roja, porque entonces
   es un fallo de verdad y él tiene que saberlo antes de decidir. */
function comprobarCielo() {
  const faltas = [];
  if (!S.data?.hours?.length) return faltas;
  const codigos = el => [...(el?.querySelectorAll?.('svg[data-code]') || [])]
    .map(x => x.dataset.code).filter(x => x !== '').map(Number);
  const h0 = cieloVisto(S.data.hours[0]);
  const grande = codigos($('#nowIco'))[0];
  if (has(grande) && has(h0.code) && grande !== h0.code)
    faltas.push(`Ahora pinta ${grande} y la hora en curso dice ${h0.code}`);
  const primera = document.querySelector('#hlist .hcard');
  if (primera) {
    const c1 = codigos(primera)[0];
    if (has(c1) && has(grande) && c1 !== grande) faltas.push(`Horas pinta ${c1} en la hora en curso y Ahora ${grande}`);
  }
  document.querySelectorAll('#parts .part[data-ini]').forEach(p => {
    const sel = S.data.hours.filter(h => h.t >= p.dataset.ini && h.t <= p.dataset.fin);
    const R = resumenCielo(sel);
    if (!R) return;
    const esperado = R.partes && R.partes.length >= 2 ? R.partes.map(t => t.code) : [R.code];
    const enDom = codigos(p.querySelector('.part__i'));
    if (enDom.join() !== esperado.join())
      faltas.push(`franja «${p.querySelector('.part__k')?.textContent.trim()}» pinta ${enDom.join('/')} y sus horas dicen ${esperado.join('/')}`);
  });
  document.querySelectorAll('#dlist .dcard[data-dia]').forEach(li => {
    const esperado = [...iconosDelDia(li.dataset.dia).matchAll(/data-code="(\d+)"/g)].map(m => Number(m[1]));
    const enDom = codigos(li.querySelector('.dcard__i'));
    if (enDom.join() !== esperado.join())
      faltas.push(`día ${li.dataset.dia} pinta ${enDom.join('/')} y sus horas dicen ${esperado.join('/')}`);
  });
  return faltas;
}

function vigilarCielo(origen = '') {
  let faltas;
  try { faltas = comprobarCielo(); } catch (e) { console.warn('[cielo] no se pudo comprobar', e); return; }
  if (!faltas.length) return;
  console.warn('[cielo]', origen, faltas);
  try {
    const log = JSON.parse(localStorage.getItem('torre.fallos') || '[]');
    log.unshift({ t: new Date().toISOString(), donde: 'cielo ' + origen, msg: faltas.join(' · ').slice(0, 300), v: BUILD });
    localStorage.setItem('torre.fallos', JSON.stringify(log.slice(0, 5)));
  } catch {}
  seguro('ahora', renderNow);
  seguro('horas', renderHours);
  seguro('días',  renderDays);
  let otraVez = [];
  try { otraVez = comprobarCielo(); } catch {}
  if (otraVez.length) Petardazo.registrar('cielo', otraVez.join(' · '));
  else toast('El cielo no cuadraba entre pantallas y se ha repintado: ' + faltas[0], 7000);
}

function clock() {
  const tz = S.data?.fc?.timezone;
  if (!tz) return;
  const t = () => {
    try {
      $('#clock').textContent = new Date().toLocaleTimeString('es', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
    } catch {}
  };
  t(); clearInterval(clock._i); clock._i = setInterval(t, 20000);
}

/* ---------- 17. Guardados ---------- */

/* SIN × EN LAS CHAPAS. Suyo, 27-08-2026: *«esto me lo quitas que no
   salga porque sin querer le doy a la x y se borra alguno»*.

   Y tiene toda la razón: la × iba pegada al nombre, en una barra que se
   arrastra con el dedo, y **borraba el emplazamiento en el acto y sin
   preguntar**. Perder un sitio de un roce, en una lista de quince que se
   usa para repartir gente, es un fallo de los caros — y encima callado:
   no se nota hasta que lo echas de menos.

   Quitar un sitio sigue pudiéndose, pero **a propósito**: se abre y se
   pulsa el ♥ de arriba, que es un gesto que nadie hace sin querer.     */
function renderPills() {
  $('#pills').innerHTML = S.saved.map((p, i) =>
    `<button class="pill${S.place && key(p) === key(S.place) ? ' is-on' : ''}" data-i="${i}">
      ${esc(p.name)}</button>`).join('')
    || `<span class="pill" style="cursor:default;opacity:.55">Guarda tus emplazamientos con ♥</span>`;
}

function syncFav() {
  const on = S.place && S.saved.some(p => key(p) === key(S.place));
  $('#btnFav').classList.toggle('is-on', !!on);
  renderPills();
}

/* ── EL TAMAÑO DE LETRA ─────────────────────────────────────────────
   Suyo, 28-08-2026, dos veces en cinco minutos: *«esto más grande, casi
   no veo»* y *«pequeño, con todo el sitio que hay, cuesta leerlos»*.

   Y no tenía forma de arreglarlo: la app no traía ningún ajuste, así que
   lo que no leía no lo leía y punto. No es un extra de accesibilidad —él
   la mira en el móvil, en el monte, de noche y con guantes; esa es su
   situación normal de uso.

   Toca UN número: `--zoom` multiplica la raíz, y como todos los tamaños
   de `styles.css` van en `rem`, sube la app entera sin descuadrar nada.

   Se guarda en el aparato y se aplica en el arranque, antes del primer
   pintado, para que no haya un salto de tamaño al abrir. */
const ZOOMS = [1, 1.15, 1.3, 1.5];

function ponerZoom(z, guardar = true) {
  const v = ZOOMS.includes(+z) ? +z : 1;
  document.documentElement.style.setProperty('--zoom', v);
  if (guardar) { LS.set('zoom', v); ajusteTocado('zoom'); }
  $$('#letraB .letra__x').forEach(b =>
    b.classList.toggle('is-on', +b.dataset.z === v));
}

function arrancarZoom() {
  ponerZoom(LS.get('zoom', 1), false);
  $('#letraB')?.addEventListener('click', e => {
    const b = e.target.closest('.letra__x');
    if (!b) return;
    ponerZoom(b.dataset.z);
    toast(`Letra ${b.textContent.trim().toLowerCase()}`);
  });
}

/* ---------- 18. Umbrales ---------- */

/* `u:'w'` marca los umbrales que son de viento: se muestran y se
   escriben en la unidad elegida, pero se guardan en km/h. */
const THR_LABELS = {
  windWarn: ['Viento — avisar desde', 'w'], windNo: ['Viento — tu tope', 'w'],
  /* LOS NOMBRES DE SUS PROPIOS UMBRALES, sin «precaución» ni «no apto».
     Los cazó el guardián el 28-08-2026 al enseñarle a mirar rótulos, y
     son de los peores sitios donde podían quedar: es la pantalla donde
     él PONE sus números, así que la app le estaba diciendo cómo llamar a
     lo suyo. Ahora son lo que son: el primero es cuando quiere que se lo
     avisen, el segundo su tope. */
  gustWarn: ['Ráfaga — avisar desde', 'w'], gustNo: ['Ráfaga — tu tope', 'w'],
  capeWarn: ['CAPE — avisar desde', 'J/kg'],   capeNo: ['CAPE — tu tope', 'J/kg'],
  rainWarn: ['Lluvia — avisar desde', 'mm/h'], rainNo: ['Lluvia — tu tope', 'mm/h'],
  visWarn : ['Visibilidad mínima', 'm'],     feelsWarn: ['Sensación térmica mínima', '°C'],
};

function renderThr() {
  $('#thrGrid').innerHTML = Object.entries(THR_LABELS).map(([k, [lbl, u]]) => {
    const esViento = u === 'w';
    const unidad = esViento ? wu().lbl : u;
    const valor  = esViento ? wv(S.thr[k]).toFixed(wu().d) : S.thr[k];
    return `<div class="tf"><label for="thr_${k}">${lbl} <span class="faint">(${unidad})</span></label>
      <input id="thr_${k}" type="number" step="any" value="${valor}" data-thr="${k}"${
        esViento ? ' data-wind="1"' : ''}></div>`;
  }).join('');

  /* ── QUÉ LISTONES MANDAN DE VERDAD EN TU PERFIL ────────────────────
     Cazado en el barrido del 01-09-2026, y era engañoso de verdad: en el
     perfil de fábrica —«Con torre o mástil», el de sus catorce sitios de
     monte, el que usa el 90 % del tiempo— el veredicto NO mira gustWarn
     ni gustNo. Mira `rafagaBestia` (70 km/h, y avisa desde 49), porque
     ahí abajo el viento no le para: eso se decidió con él el 24-08 y NO
     se toca.

     Lo que sí estaba mal es que esta pantalla le dejaba bajar su tope a
     50 sin decirle que ahí no iba a cambiar nada. MEDIDO: con el perfil
     de fábrica, una racha de 62 daba «precaución» con el tope en 60 y
     seguía dando «precaución» con el tope en 50.

     Un ajuste que no hace lo que parece es peor que no tenerlo. */
  const nota = $('#thrPerfil');
  if (nota) {
    const P = PERFILES[S.perfil];
    if (S.perfil === 'torre') {
      nota.innerHTML = `Estás en <b>${esc(P?.nom || 'Subir a la torre')}</b>: aquí mandan
        <b>tus listones de ráfaga</b>, y a tu altura de trabajo.`;
      nota.className = 'note';
    } else {
      nota.innerHTML = `<b>OJO con los dos de ráfaga.</b> Estás en
        <b>${esc(P?.nom || S.perfil)}</b>, y ahí el viento no decide con tus listones:
        el veredicto avisa a <b>${wtxt(P.rafagaBestia * 0.7, true)}</b> y se pone en rojo a
        <b>${wtxt(P.rafagaBestia, true)}</b>, porque a ras de suelo la ráfaga molesta pero
        no impide trabajar — lo decidiste así el 24-08.
        <b>Tus dos listones de ráfaga se aplican al subir</b> (perfil «Subir a la torre»).
        Los de lluvia, CAPE y visibilidad sí valen aquí.`;
      nota.className = 'note note--avisa';
    }
  }
}


/* ---------- Comprobación de versión ─────────────────────────────────
   Problema real detectado: el botón de actualizar de la app solo
   recarga los DATOS, no la página. Si el navegador se había quedado
   con una versión antigua guardada, se podía estar mirando una app
   vieja sin enterarse — inaceptable en una herramienta de decisión.

   Ahora la app pregunta al servidor qué versión hay publicada y, si no
   coincide con la que está corriendo, se recarga sola una vez.       */

/* ── EL CASCO INCOMPLETO SE DICE ─────────────────────────────────────
   sw.js apunta en ./__faltan.json lo que no pudo precachear al instalar
   (revisión 04-09-2026, §4: antes un 404 se tragaba en silencio y en el
   monte, sin cobertura, el mapa no arrancaba «sin motivo»). La lista es
   una foto del momento de instalar: un fichero puede haberse curado
   después (el SW guarda lo que se pide con red), así que aquí se mira
   CADA uno en la caché antes de decir que falta. */
async function avisarCascoIncompleto(faltan) {
  const lista = [];
  try {
    for (const u of faltan || []) if (!(await caches.match(u))) lista.push(String(u).replace(/^\.\//, ''));
  } catch { return; }
  S.cascoFaltan = lista;
  if (!lista.length) return;
  console.warn('casco incompleto:', lista);
  toast(`Sin cobertura te faltará: ${lista.join(', ')}. Abre la app con red para completarlo.`, 9000);
}
async function revisarCasco() {
  try {
    if (!('caches' in window)) return;
    const r = await caches.match('./__faltan.json');
    if (r) await avisarCascoIncompleto(await r.json());
  } catch { /* sin caché no hay nada que revisar */ }
}

async function comprobarVersion({ recargar = true } = {}) {
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const { build } = await r.json();
    if (!build || build === BUILD) return build;

    if (recargar && !sessionStorage.getItem('recargando')) {
      /* Red de seguridad: si por lo que sea el aparato no consigue el
         build nuevo (caché HTTP, CDN a medias), NO se recarga sin fin.
         A la tercera en 3 minutos se para y se le dice qué hacer. */
      let veces = [];
      try { veces = JSON.parse(sessionStorage.getItem('recargasVersion') || '[]').filter(t => Date.now() - t < 180e3); } catch {}
      if (veces.length >= 3) {
        toast(`No consigo actualizar a ${build} (sigo en ${BUILD}). Cierra la app del todo y vuelve a abrirla.`, 6000);
        return build;
      }
      veces.push(Date.now());
      try { sessionStorage.setItem('recargasVersion', JSON.stringify(veces)); } catch {}
      sessionStorage.setItem('recargando', build);
      toast(`Versión nueva (${build}) — actualizando…`, 2000);
      // Limpiar cachés propias para que no quede nada viejo
      try {
        /* Todas las cachés de versión, sí; la lista de avisos recibidos, NO:
           no es de una versión, es suya (los últimos 40, que pidió releer).
           Hasta el 05-09-2026 se tiraba aquí en cada publicación; el
           service worker tampoco la tira ya (sw.js, DE_SIEMPRE). */
        if ('caches' in window)
          await Promise.all((await caches.keys()).filter(k => k !== 'avisos-recibidos').map(k => caches.delete(k)));
        /* Y el casco de verdad, saltándose la caché HTTP del navegador:
           GitHub Pages lo sirve con max-age=600 y, tras publicar, la
           recarga volvía a coger el app.js viejo durante 10 minutos →
           version.json nuevo + BUILD viejo → otra recarga, y otra
           (10-09-2026). cache:'reload' lo trae fresco y lo deja en la
           caché HTTP y en la del service worker. */
        await Promise.all(['index.html', 'styles.css', 'app.js', 'maps.js']
          .map(f => fetch(f, { cache: 'reload' }).catch(() => {})));
        const rs = await navigator.serviceWorker?.getRegistrations?.() ?? [];
        await Promise.all(rs.map(x => x.update()));
      } catch {}
      setTimeout(() => location.reload(), 700);
    }
    return build;
  } catch { return null; }
}

/* ---------- 19. Arranque ---------- */



/* ---------- Mapa a pantalla completa ─────────────────────────────────
   Encajar el mapa midiendo alturas resultó frágil: la primera vez que se
   entra, las chapas y la barra de color aún no están dibujadas y el
   cálculo sale corto, dejando el deslizador fuera de pantalla.

   Esto lo resuelve sin medir nada. Es una caja fija con tres filas:
   controles arriba, mapa en medio ocupando todo lo que sobre, y mandos
   de hora abajo. Los tres se ven siempre, sea cual sea la pantalla.

   Se sale con Esc o con el mismo botón.                             */

function pantallaCompletaMapa(activar) {
  const sec = document.querySelector('.view[data-v="models"]');
  if (!sec) return;
  const on = activar ?? !sec.classList.contains('is-pantalla');
  sec.classList.toggle('is-pantalla', on);
  document.body.classList.toggle('sin-scroll', on);

  const txt = $('#mapFullTxt');
  if (txt) txt.textContent = on ? 'Salir' : 'Pantalla completa';

  if (typeof Maps !== 'undefined' && Maps.map) {
    [60, 260, 600].forEach(t => setTimeout(() => Maps.map.resize(), t));
  }
}

addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const sec = document.querySelector('.view[data-v="models"].is-pantalla');
  if (sec) pantallaCompletaMapa(false);
});

/* ---------- Encajar el mapa en la pantalla ───────────────────────────
   Aitor, 23-08-2026: «que sea a pantalla completa y que se vea lo de los
   modelos arriba y el slider».

   Antes el mapa tenía una altura fija y el deslizador se quedaba por
   debajo del borde: había que bajar la página para cambiar de hora, y
   trabajando con modelos eso es insufrible.

   Aquí se mide lo que ocupa de verdad la cabecera y los mandos, y se le
   da al mapa exactamente lo que sobra. Así entra todo de una vez:
   modelos y capas arriba, mapa en medio, deslizador abajo.          */

function ajustarAltoMapa() {
  const sec  = document.querySelector('.view[data-v="models"]');
  const mapa = document.querySelector('.mapc');
  if (!sec || !mapa || sec.offsetParent === null) return;

  // NO se mide con getBoundingClientRect().top: eso depende de por dónde
  // esté desplazada la página y daba un mapa demasiado alto, dejando el
  // deslizador fuera de pantalla. Se suma lo que ocupa cada pieza.
  const alto = el => {
    if (!el || el.hidden) return 0;
    const r = el.getBoundingClientRect();
    return r.height || el.offsetHeight || 0;
  };

  const cabecera = alto(document.querySelector('header.top'));
  // Se publica para el CSS: es lo único que hay que medir en móvil
  document.documentElement.style.setProperty('--alto-top', Math.round(cabecera) + 'px');

  // EN MÓVIL NO SE MIDE. Medir y fijar píxeles era perseguir un blanco
  // móvil: el pie de la capa se parte en dos líneas DESPUÉS de haber
  // medido, crece, y empuja el deslizador fuera de la pantalla. Medido el
  // 23-08-2026 en 375 px: el deslizador empezaba en el píxel 968 de 1000
  // y el pie entero quedaba fuera. Ahí abajo el alto lo reparte el CSS
  // con flexbox, que no tiene que adivinar nada.
  if (window.matchMedia('(max-width: 700px)').matches) {
    mapa.style.height = '';
    if (typeof Maps !== 'undefined' && Maps.map) setTimeout(() => Maps.map.resize(), 60);
    return;
  }

  // Todo lo que va DENTRO de la sección por encima del mapa
  let encima = 0;
  for (const el of sec.querySelectorAll('.mmob, .msel--map, .ovl, .lgtop')) encima += alto(el);

  // Y lo que va por debajo: mandos de hora y pie
  const debajo = alto(sec.querySelector('.radar__bar')) + alto(sec.querySelector('.mapfoot'));

  const libre = window.innerHeight - cabecera - encima - debajo - 18;
  mapa.style.height = Math.max(320, Math.round(libre)) + 'px';
  if (typeof Maps !== 'undefined' && Maps.map) setTimeout(() => Maps.map.resize(), 60);
}

let _ajuste;
addEventListener('resize', () => { clearTimeout(_ajuste); _ajuste = setTimeout(ajustarAltoMapa, 120); });

/* Vigilante de tamaños.
 *
 * Perseguir el momento bueno con temporizadores no funcionaba: la primera
 * vez que se entra en Modelos, las chapas de modelo y capa y la barra de
 * color todavía no están dibujadas, así que el cálculo creía que sobraba
 * sitio y el mapa se pasaba del borde dejando el deslizador fuera.
 *
 * Con esto no hay que adivinar nada: en cuanto cualquiera de esas piezas
 * cambia de alto, el mapa se vuelve a encajar solo. */
function vigilarAltoMapa() {
  const sec = document.querySelector('.view[data-v="models"]');
  if (!sec || sec._vigilado || typeof ResizeObserver === 'undefined') return;
  sec._vigilado = true;

  let pendiente;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(ajustarAltoMapa);
  });
  for (const sel of ['.mmob', '.msel--map', '.ovl', '.lgtop', '.radar__bar', '.mapfoot']) {
    const el = sec.querySelector(sel);
    if (el) ro.observe(el);
  }
  const cab = document.querySelector('header.top');
  if (cab) ro.observe(cab);
}

/** Vistas donde manda el mapa: la portada estorba y se encoge.
 *  Aitor, 23-08-2026: «para andar con modelos así está mal, no veo bien».
 *  Se queda una tira con el sitio, la temperatura y el modelo, que es lo
 *  que hay que tener delante mientras se mira un mapa. */
const VISTAS_MAPA = ['models', 'radar', 'rayos', 'cams'];

function setView(v) {
  if (v === 'tower') v = 'now';   // Torre se mudó a Ahora el 31-08-2026; los enlaces viejos siguen valiendo
  S.view = v;
  const cover = document.querySelector('#cover');
  cover?.classList.toggle('is-mini', VISTAS_MAPA.includes(v));
  cover?.classList.toggle('is-oculto', v === 'models');
  // Marca para el CSS de móvil: en Modelos la pantalla no se desplaza,
  // porque desplazarla movía el mapa mientras buscabas el deslizador.
  document.body.classList.toggle('mapa-movil', v === 'models');

  // Salir de Modelos deja la pantalla completa puesta y la capa se queda
  // tapando la app entera. Al cambiar de pestaña, se quita siempre.
  if (v !== 'models') {
    document.querySelector('.view[data-v="models"]')?.classList.remove('is-pantalla');
    document.body.classList.remove('sin-scroll');
    const t = document.querySelector('#mapFullTxt');
    if (t) t.textContent = 'Pantalla completa';
  }
  document.body.dataset.view = v;          // la portada fija se muestra según la pestaña
  $$('.tab').forEach(t => t.classList.toggle('is-on', t.dataset.v === v));
  $$('.view').forEach(s => s.classList.toggle('is-on', s.dataset.v === v));
  // La fila de pestañas se desliza: si la activa queda fuera de pantalla
  // parece que esa pestaña «ha desaparecido». Se trae siempre a la vista.
  try {
    $('.tab.is-on')?.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
  } catch {}
  // maps.js y el visor de radar se cargan después que este fichero:
  // si la vista guardada era una de ellas, se abre cuando estén listos.
  if (v === 'torres') { cargarTorres(); renderSitios(); pintarEstadoMonte();
                        cargarObservacion(); cargarMarcador(); }
  if (v === 'cams')   renderCams();
  if (v === 'rayos')  renderRayos();
  /* Cazado el 31-08-2026 en su pantallazo: el aviso «los modelos van de
     27° a 41°» no salía NUNCA — la lista se pintaba al cargar (antes de
     llegar la comparación de 10 días) y al entrar en la pestaña nadie
     repintaba. renderDays se protege sola si aún no hay datos. */
  if (v === 'days')   renderDays();
  if (v === 'sea')    cargarMareas().then(() => { if (S.view === 'sea') pintarMareas(); });
  const abrir = () => {
    if (v === 'radar'  && typeof Radar !== 'undefined') Radar.open();
    if (v === 'models' && typeof Maps  !== 'undefined') {
      Maps.open();
      // Encajar el mapa en lo que quede de pantalla, para que el
      // deslizador de horas no acabe por debajo del borde.
      vigilarAltoMapa();
      [250, 900].forEach(t => setTimeout(ajustarAltoMapa, t));
    }
  };
  if (document.readyState === 'complete') abrir();
  else window.addEventListener('load', abrir, { once: true });
  LS.set('view', v);
}

function bind() {
  // Pestañas
  $('#tabs').addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (t) setView(t.dataset.v);
  });

  // Búsqueda
  let tmr;
  // Al escribir, el buscador se lleva toda la barra (más sitio para teclear
  // un nombre de estación en el móvil). Al salir, vuelve todo a su sitio;
  // el retardo deja que el toque sobre un resultado se registre antes.
  const barra = document.querySelector('.top__in');
  $('#q').addEventListener('focus', () => barra.classList.add('searching'));
  $('#q').addEventListener('blur', () => setTimeout(() => {
    if (document.activeElement !== $('#q')) barra.classList.remove('searching');
  }, 200));

  $('#q').addEventListener('input', e => {
    clearTimeout(tmr);
    const v = e.target.value.trim();
    if (v.length < 2) { $('#ac').hidden = true; return; }
    tmr = setTimeout(async () => {
      try { renderAc(await search(v)); } catch { $('#ac').hidden = true; }
    }, 220);
  });
  $('#q').addEventListener('keydown', e => {
    if (e.key === 'Escape') $('#ac').hidden = true;
    if (e.key === 'Enter') {
      const first = $('#ac')._list?.[0];
      if (first && !$('#ac').hidden) { pick(first); }
    }
  });
  $('#ac').addEventListener('click', e => {
    const li = e.target.closest('li');
    /* El aviso de «no he podido cargar el catálogo» es un `li` sin
       índice: pulsarlo no debe elegir nada ni reventar. */
    if (!li || li.dataset.no === '1') return;
    const elegido = $('#ac')._list?.[+li.dataset.i];
    if (elegido) pick(elegido);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search')) $('#ac').hidden = true;
  });

  function pick(p) {
    $('#ac').hidden = true; $('#q').value = ''; $('#q').blur();
    go(p);
  }

  // Geolocalización
  $('#btnGeo').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('Este navegador no permite geolocalización');
    toast('Localizando…');
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      let name = `${lat.toFixed(4)}, ${lon.toFixed(4)}`, admin1 = 'Mi ubicación', country = '';
      try {
        const r = await jget(API.rev, { latitude: lat, longitude: lon, localityLanguage: 'es' }, { timeout: 5000 });
        if (r.city || r.locality) { name = r.city || r.locality; admin1 = r.principalSubdivision ?? ''; country = r.countryName ?? ''; }
      } catch {}
      go({ name, admin1, country, lat, lon });
    }, err => toast('No se ha podido obtener la ubicación: ' + err.message, 3800),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  // Recargar
  $('#btnReload').addEventListener('click', async () => {
    await comprobarVersion();          // por si hay app nueva publicada
    if (S.place) go(S.place);
  });

  // Favoritos
  $('#btnFav').addEventListener('click', () => {
    if (!S.place) return;
    const i = S.saved.findIndex(p => key(p) === key(S.place));
    /* SE DICE QUÉ SITIO Y CUÁNTOS QUEDAN. Antes ponía «Emplazamiento
       guardado» a secas y bastaba, porque el nombre aparecía al momento
       en la fila de arriba. Esa fila se quitó el 28-08-2026 a petición
       suya, así que el aviso se quedó siendo la ÚNICA señal de que la
       cosa ha ido a algún sitio — y no decía a cuál.

       Suyo ese mismo día: *«que pueda añadir a favoritos luego si quiero
       o no, eso a mi criterio»*. Pues que se vea que se ha hecho, y
       dónde ha caído. */
    const nom = S.place.name || 'Este emplazamiento';
    if (i >= 0) {
      S.saved.splice(i, 1);
      toast(`${nom} quitado de Mis estaciones · quedan ${S.saved.length}`);
    } else {
      S.saved.push(S.place);
      toast(`${nom} guardado en Mis estaciones · ya son ${S.saved.length}`);
    }
    LS.set('saved', S.saved); syncFav();
    /* Quitar es una decisión suya: se manda como sustitución para que el
       borrado llegue a los demás aparatos. Añadir también, que así la
       lista queda igual en todos sin esperar al siguiente arranque. */
    sincronizarTorres({ mandar: true });
    if (S.view === 'torres') cargarTorres();
  });
  /* ── SE ABRE EL SITIO PINCHANDO SU TARJETA ──────────────────────────
     Suyo, 28-08-2026, señalando la fila de nombres de arriba: *«esto
     fuera, no hace falta que salgan aquí»*.

     Pero esa fila era **la única manera** de saltar de un emplazamiento a
     otro: quitarla a secas le dejaba sin poder cambiar de sitio salvo
     buscándolo por el nombre. Así que primero el reemplazo y luego la
     tijera — la tarjeta entera de «Mis torres» abre ese emplazamiento, y
     ahí ya están los catorce con sus cifras delante, que es mejor sitio
     para elegir que una fila de nombres a secas.

     Y la fila se quitó por lo de siempre con él: le comía dos centímetros
     de pantalla en todas las pestañas. */
  /* El atajo «míralo en el satélite» del aviso de nubosidad. Va delegado
     en el documento y no en la propia etiqueta porque ese bloque se
     repinta entero cada vez que llega la comparativa: un manejador
     puesto en el elemento se perdería en el siguiente pintado. */
  /* ── EL ENLACE A LA GUÍA LLEVA DE VERDAD ────────────────────────
     La chapa del CAPE salió de «Ahora» el 02-09-2026 —suyo: «TODA ESTA
     CHAPA VALE PARA ALGO?»— y se dejó el enlace apuntando a la Guía.
     Un enlace que no lleva a ningún sitio es peor que el párrafo que
     quitó: promete algo y no lo cumple. */
  document.addEventListener('click', e => {
    const g = e.target.closest('a[data-ir-guia]');
    if (g) {
      e.preventDefault();
      setView('guia');
      const dest = document.getElementById(`g-${g.dataset.irGuia}`);
      if (dest) dest.scrollIntoView({ block: 'center' });
      else window.scrollTo({ top: 0 });
      return;
    }
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-ir="satelite"]');
    if (!a) return;
    e.preventDefault();
    setView('models');
    if (typeof Maps !== 'undefined' && Maps.setLayer) Maps.setLayer('sat_ir');
    window.scrollTo({ top: 0 });
  });

  $('#torres')?.addEventListener('click', e => {
    /* ── EL PARTE NO ES UN BOTÓN ────────────────────────────────────
       Suyo, 02-09-2026, en cuanto vio la tarjeta fusionada:
         *«cuando hago un clic ahí dentro me lleva a la pantalla de
           Ahora, es un fallo»*

       Y es mío, de esa misma tarde: al meter el parte DENTRO de la
       tarjeta, todo lo que antes vivía fuera pasó a estar bajo el
       «abrir sitio». La tabla de la estación tiene números que uno
       quiere leer y comparar, no un enlace disfrazado: pinchar para
       mirar un 32 km/h y acabar en otra pantalla es perder el sitio.

       Se abre desde el nombre y los números de arriba; el parte, la
       comparación y la tira de horas se quedan quietos. */
    /* ── SALTAR DE PANTALLA TIENE QUE SER UN BOTÓN ──────────────────
       Suyo, 02-09-2026, dos veces:  *«cuando hago un clic ahí dentro me
       lleva a la pantalla de Ahora, es un fallo»* y, después de acotarlo
       a la cabecera:  *«sigo pinchando en la pantalla, SIN NADA Bermeo
       me lleva a Ahora, me salta de página de Mis estaciones a Ahora»*.

       La primera vez lo acoté; no bastaba, porque él pincha en el nombre
       y en el semáforo, que ES la cabecera. Y tiene razón de fondo: la
       tarjeta ya lo dice TODO desde que se fusionó con el parte, así que
       ir a «Ahora» ya no aporta nada — y perder la página en la que
       estabas, con veinte sitios, sí quita.

       Se queda como botón, al lado de «Ajustar»: explícito y a propósito.
       Nada de saltos por rozar la pantalla.                            */
    const abrir = e.target.closest('[data-abrir]');
    if (!abrir) return;
    const p = S.saved.find(x => key(x) === abrir.dataset.abrir);
    if (p) { go(p); setView('now'); window.scrollTo({ top: 0 }); }
  });

  /* «Abrir la mía» del aviso de «esto no es tu estación». */
  $('#noEsTuSitio')?.addEventListener('click', e => {
    const b = e.target.closest('[data-ir-sitio]'); if (!b) return;
    const p = S.saved.find(x => key(x) === b.dataset.irSitio);
    if (p) { go(p); window.scrollTo({ top: 0 }); }
  });

  // Modelo numérico — recarga los datos que deciden el GO/NO-GO
  /* Se escucha en los DOS sitios: el de Torre y el clon de «Ahora». La
     misma función para los dos, que si no acabarían diciendo cosas
     distintas — el fallo que hoy nos costó cuatro torres sin vigilar. */
  const alPulsarModelo = e => {
    const b = e.target.closest('.mbtn'); if (!b) return;
    if (b.dataset.wu) {                       // cambio de unidad de viento
      S.wunit = b.dataset.wu; LS.set('wunit', S.wunit); ajusteTocado('wunit');
      renderThr(); paint();
      if (typeof Maps !== 'undefined' && Maps.map) { Maps.legend(); }
      toast(`Viento en ${wu().lbl}`);
      return;
    }
    if (!b.dataset.m) return;
    S.model = b.dataset.m; LS.set('model', S.model); ajusteTocado('model');
    // Aquí había una llamada a `Maps.fetchGrid()`, una función que ya no
    // existe. Lanzaba un TypeError que se comía el resto del manejador,
    // así que NO se llegaba a `go(S.place)` y el modelo cambiaba de
    // nombre sin recargar los datos. Visto el 24-08-2026 en consola.
    // El mapa tiene su propio selector de modelo; este es el de Torre.
    if (S.place) go(S.place);
  };
  $('#msel').addEventListener('click', alPulsarModelo);
  $('#mselAhora')?.addEventListener('click', alPulsarModelo);


  // Altura de trabajo
  $('#hsel')?.addEventListener('click', e => {
    const b = e.target.closest('.hbtn'); if (!b) return;
    S.hgt = +b.dataset.h; LS.set('hgt', S.hgt); ajusteTocado('hgt');
    if (S.data) { S.data.hours = buildHours(S.data.fc, S.hgt); paint(); }
  });

  // Timeline
  $('#tl').addEventListener('click', e => {
    const h = e.target.closest('.tlh'); if (!h) return;
    S.sel = +h.dataset.i;
    $$('.tlh').forEach(x => x.classList.toggle('is-sel', x === h));
    renderTlDetail(S.data.hours[S.sel]);
  });

  // Umbrales
  $('#thrGrid').addEventListener('change', e => {
    const k = e.target.dataset.thr; if (!k) return;
    const v = parseFloat(e.target.value);
    if (Number.isNaN(v)) { renderThr(); return; }
    // Los umbrales de viento se escriben en la unidad activa pero se
    // guardan siempre en km/h.
    S.thr[k] = e.target.dataset.wind ? wkmh(v) : v;
    LS.set('thr', S.thr); ajusteTocado('thr');
    if (S.data) { S.data.hours = buildHours(S.data.fc, S.hgt); paint(); }
    toast('Umbral actualizado');
  });

  // Parte de decisión (botón retirado de la interfaz a petición;
  // la función `parte()` se conserva por si vuelve a hacer falta)
  // Sin cobertura y emplazamientos propios
  // Ficha de cada emplazamiento
  $('#torres')?.addEventListener('click', e => {
    const aj = e.target.closest('[data-aj]');
    if (aj) { abrirAjuste(aj.dataset.aj); return; }
    const g = e.target.closest('[data-guardar]');
    if (!g) return;
    const k = g.dataset.guardar;
    const caja = g.closest('.aj');
    const num = sel => {
      const v = caja.querySelector(`[data-c="${sel}"]`).value.trim();
      return v === '' ? null : Number(v);
    };
    const c = {
      tipo: caja.querySelector('[data-c="tipo"]').value,
      alt:  num('alt') ?? S.hgt,
      cota: num('cota'),
    };
    const t = (S.torres || []).find(x => key(x.place) === k);
    if (!t) return;
    guardarCfg(t.place, c);
    toast(`${t.place.name}: trabajo a ${c.alt} m${has(c.cota) ? `, cota ${c.cota} m` : ''}`);
    cargarTorres();
  });

  $('#btnMonte')?.addEventListener('click', prepararMonte);
  $('#btnImp')?.addEventListener('click', () => {
    const txt = $('#impTxt').value;
    if (!txt.trim()) return;
    const r = importarSitios(txt);
    renderSitios();
    $('#impTxt').value = '';
    const partes = [];
    if (r.nuevos)    partes.push(`${r.nuevos} nuevo${r.nuevos > 1 ? 's' : ''}`);
    if (r.repetidos) partes.push(`${r.repetidos} ya lo tenías`);
    $('#impRes').innerHTML = (partes.join(' · ') || 'Nada que añadir')
      + (r.malas.length
        ? `<br><b>${r.malas.length} línea${r.malas.length > 1 ? 's' : ''} sin coordenadas
           válidas, no se han metido:</b><br><small>${r.malas.slice(0, 6).map(esc).join('<br>')}</small>`
        : '');
    toast(r.nuevos ? `${r.nuevos} emplazamiento(s) añadido(s)` : 'Sin novedades');
  });
  $('#btnExp')?.addEventListener('click', async () => {
    const txt = S.sitios.map(x =>
      [x.cod, x.name, x.op, x.lat.toFixed(6), x.lon.toFixed(6), x.alt ? x.alt + ' m' : '']
        .filter(Boolean).join(' ')).join('\n');
    try { await navigator.clipboard.writeText(txt); toast('Lista copiada'); }
    catch { $('#impTxt').value = txt; toast('Copia el texto del recuadro'); }
  });
  $('#sitios')?.addEventListener('click', e => {
    const b = e.target.closest('[data-sit]');
    if (!b) return;
    S.sitios.splice(+b.dataset.sit, 1);
    LS.set('sitios', S.sitios);
    renderSitios();
  });

  $('#btnParte')?.addEventListener('click', copiarParte);

  /* Altitud del suelo. Se guarda en la CONFIGURACIÓN del emplazamiento,
     no suelta como antes: así viaja al servidor y no se pierde al
     reinstalar, y así la que pone él manda sobre la automática.

     Y vaciar la casilla la BORRA, no la pone a cero. Antes se guardaba
     el valor a pelo y bastaba con dejarla en blanco para que el sitio se
     quedara «a 0 m sobre el mar» — que es lo que él fotografió en
     Sollube, con «Diferencia −669 m» en rojo. */
  document.addEventListener('change', e => {
    if (e.target.id !== 'siteElev') return;
    const txt = String(e.target.value).trim();
    const v = txt === '' ? null : parseFloat(txt);
    const cota = (v === null || Number.isNaN(v)) ? null : v;
    const c = cfgDe(S.place);
    guardarCfg(S.place, { tipo: c?.tipo || 'torre', cota, alt: c?.alt ?? S.hgt });
    if (cota === null) LS.set('siteElev.' + key(S.place), null);
    renderElev();
  });

  // Radar
  $('#rPlay').addEventListener('click', () => Radar.playing ? Radar.pause() : Radar.play());
  $('#rTime').addEventListener('input', e => { Radar.pause(); Radar.frame(+e.target.value); });

  // Cartografía
  $('#mapLayers').addEventListener('click', e => {
    const b = e.target.closest('.ovb'); if (b) Maps.setLayer(b.dataset.l);
  });
  $('#mapModels').addEventListener('click', e => {
    const b = e.target.closest('.mbtn'); if (!b) return;
    if (b.dataset.tm) Maps.setModel(b.dataset.tm);
    if (b.dataset.tb) Maps.setBase(b.dataset.tb);
    if (b.dataset.tr) Maps.setTerrain(!Maps.terrain);
    if (b.dataset.tv) Maps.setValores(!Maps.verValores);
    if (b.dataset.tp) Maps.setPaso(+b.dataset.tp);
    if (b.dataset.tb2) Maps.setBarbas(!Maps.verBarbas);
    if (b.dataset.tl) Maps.setRayos(!Maps.verRayos);
  });
  // El botón de rayos de la barra del reloj (Mac y móvil)
  $('#mapRayosBtn')?.addEventListener('click', () => Maps.setRayos(!Maps.verRayos));
  // Selector de móvil
  $('#mapMob').addEventListener('click', e => {
    const b = e.target.closest('[data-abrir]');
    if (b) Maps.hoja(b.dataset.abrir);
  });
  $('#mapHoja').addEventListener('click', e => {
    if (e.target.closest('[data-cerrar]') || e.target.id === 'mapHoja') { Maps.cerrarHoja(); return; }
    const i = e.target.closest('.hoja__i');
    if (!i) return;
    if (i.dataset.l)  { Maps.setLayer(i.dataset.l);  Maps.cerrarHoja(); }
    if (i.dataset.tm) { Maps.setModel(i.dataset.tm); Maps.cerrarHoja(); }
  });

  $('#mapFull')?.addEventListener('click', () => pantallaCompletaMapa());
  $('#mapPrev').addEventListener('click', () => Maps.paso(-1));
  $('#mapNext').addEventListener('click', () => Maps.paso(+1));
  $('#mapNow') .addEventListener('click', () => Maps.ahora());
  $('#mapPlay').addEventListener('click', () => Maps.playing ? Maps.pause() : Maps.play());
  // Mientras se arrastra solo se mueve la etiqueta de la hora; el mapa
  // se redibuja al soltar. Antes se reconstruía en cada movimiento y el
  // visor se quedaba en blanco y a tirones.
  $('#mapTime').addEventListener('input',  e => { Maps.pause(); Maps.previewT(e.target.value); });
  $('#mapTime').addEventListener('change', e =>
    (Maps.layer === 'radar' || Maps.layer === 'aemet') ? Maps.setT(e.target.value) : Maps.irAPosicion(e.target.value));
  $('#mapOpa').addEventListener('input', e => Maps.setOpacity(+e.target.value / 100));

  // Instalación PWA
  let deferred;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e; $('#btnInstall').hidden = false;
  });
  $('#btnInstall').addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt(); await deferred.userChoice;
    deferred = null; $('#btnInstall').hidden = true;
  });

  // Avisos al móvil
  montarAvisos();
  mirarPulso();
  setInterval(mirarPulso, 10 * 60e3);
  montarCampo();
  pintarRecibidos();
  /* Si llega uno con la app abierta, se pinta al momento en vez de
     esperar a que él salga y entre. */
  navigator.serviceWorker?.addEventListener('message', e => {
    if (e.data?.tipo === 'avisoNuevo') pintarRecibidos();
    if (e.data?.tipo === 'avisoCaducado') montarAvisos();
    // El SW se ha vuelto a suscribir solo (app cerrada): que el panel lo refleje.
    if (e.data?.tipo === 'avisoRenovado') montarAvisos();
    // Al instalar, algo del casco no bajó ni a la segunda: se le dice qué.
    if (e.data?.tipo === 'precache-faltan') avisarCascoIncompleto(e.data.faltan);
  });

  // Refresco al volver a primer plano si los datos están caducados
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.data && Date.now() - S.data.at > 20 * 60e3 && S.place) go(S.place, { silent: true });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   Ningún fallo puede quedarse callado
   ───────────────────────────────────────────────────────────────────
   El 23-08-2026 una variable huérfana en la gráfica de mareas reventaba
   el pintado, y como iba en medio se llevaba por delante el aviso de
   "datos caducados" y la petición de datos nuevos. Resultado: una
   previsión de OCHO HORAS antes en pantalla, sin una sola marca.

   Nadie se enteró porque el fallo solo salía por la consola, y a la
   consola no mira quien está decidiendo si manda a alguien a una torre.

   Desde aquí, cualquier error suelto de la app sale EN PANTALLA, y se
   guardan los últimos cinco para poder enseñarlos.
   ═══════════════════════════════════════════════════════════════════ */

const Petardazo = {
  vistos: new Set(),

  registrar(donde, e) {
    const msg = String(e?.message || e || 'error desconocido').slice(0, 160);
    const clave = donde + '|' + msg;
    if (this.vistos.has(clave)) return;      // no repetir el mismo
    this.vistos.add(clave);

    // Diario de a bordo, para poder enseñarlo después
    try {
      const log = JSON.parse(localStorage.getItem('torre.fallos') || '[]');
      log.unshift({ t: new Date().toISOString(), donde, msg, v: BUILD });
      localStorage.setItem('torre.fallos', JSON.stringify(log.slice(0, 5)));
    } catch {}

    console.error('[' + donde + ']', e);
    this.pintar(msg);
  },

  pintar(msg) {
    const el = document.querySelector('#petado');
    if (!el) return;
    el.hidden = false;
    el.innerHTML = `<span><b>Algo ha fallado dentro de la app.</b>
      Lo que ves puede estar incompleto o ser de antes — <b>no decidas con esto
      sin comprobarlo</b>. <code>${esc(msg)}</code></span>
      <button type="button" data-acc="recargar">Recargar</button>
      <button type="button" data-acc="cerrar" aria-label="Cerrar">✕</button>`;
    el.onclick = ev => {
      const acc = ev.target.closest('[data-acc]')?.dataset.acc;
      if (acc === 'recargar') location.reload();
      if (acc === 'cerrar')   { el.hidden = true; el.innerHTML = ''; }
    };
  },

  vigilar() {
    window.addEventListener('error', ev => {
      // Un <img> que no carga no es un fallo de la app
      if (ev.target && ev.target !== window && ev.target.tagName) return;
      this.registrar('app', ev.error || ev.message);
    });
    window.addEventListener('unhandledrejection', ev => {
      const r = ev.reason;
      /* Las teselas del mapa ya tienen su propio aviso, no se duplica.

         `Received N bytes, expected M` añadido el 25-08-2026. Es la
         librería de teselas cuando una petición de rango vuelve cortada;
         salió dos veces en su Mac esa mañana (2.280 y 2.232 bytes de
         65.536 pedidos) y le sacó la barra roja. Ya se reintenta tres
         veces con espera creciente antes de darla por perdida, y cuando
         se pierde el mapa saca SU cartel, que además dice lo que hay que
         decir —«donde no hay color puede ser que no haya llegado el
         dato, no que no pase nada»— y ofrece reintentar.

         O sea que el hueco NO es silencioso: está cubierto por donde
         toca. Lo que sobraba era el segundo aviso encima, y dos carteles
         para el mismo fallo gastan el rojo. */
      const m = String(r?.message || r || '');
      /* «signal is aborted without reason» (06-09-2026, Calpe, cambiando
         de capa en el mapa): es un AbortError de verdad, pero el NOMBRE va
         en `r.name` y el mensaje no lo lleva, así que se colaba a la barra
         roja. Una descarga cancelada por cambiar de capa no es un fallo. */
      if (r?.name === 'AbortError') return;
      if (/OmHttpBackend|Aborted\(OOM\)|abortada|AbortError|signal is aborted|aborted a request/i.test(m)) return;
      if (/Received \d+ bytes, expected \d+/i.test(m)) return;
      this.registrar('promesa', r);
    });
  },
};

async function init() {
  Petardazo.vigilar();
  S.saved  = LS.get('saved', []);
  /* Se juntan con las del servidor en cuanto arranca, sin bloquear el
     pintado: si tarda o falla, la app va igual con lo del aparato. */
  setTimeout(() => sincronizarTorres(), 0);
  setTimeout(() => sincronizarAjustes(), 0);
  S.sitios = LS.get('sitios', []);
  /* ── POR DEFECTO, LA CASETA (10 m) — NO LA TORRE ──────────────────
     Suyo, 01-09-2026, mirando el selector: *«esto al final no sé si me
     lía más: la altura es la caseta, a la torre decido yo si se sube o
     no»*.

     Y llevaba razón en algo que no habíamos visto: **por defecto estaba
     en 40 m**, o sea que la app le estimaba el viento arriba de la torre
     cuando el 90 % de su trabajo es a pie de caseta y en un poste de 3 m.
     De 10 a 40 m el viento se multiplica por 1,36 de mediana en Euskadi
     (medido, 378 horas), así que una racha de 33 se le pintaba como 45 —
     justo su listón de aviso.

     Es el «no» que cuesta cobertura del que él mismo habló: la app
     frenándole por un viento que no está donde él trabaja. Los 10 m son
     el dato CRUDO del modelo, sin estimar nada, y es su sitio real. Las
     alturas de arriba siguen ahí para el día que decida subir — que es
     decisión suya, no de la app. */
  S.hgt   = LS.get('hgt', 10);
  /* ── Por qué ICON y no el Automático ──────────────────────────────
     Cambiado el 25-08-2026 a petición suya: «pon un modelo que para mi
     zona es el mejor». La razón NO es que acertara un día —eso no se
     sabe aún—, es estructural y está medida:

     · **Es el único que publica TODOS los campos que deciden**: estado
       del cielo, tapa, CAPE, isocero y visibilidad. AROME HD no da ni
       cielo ni tapa (0 horas de 24 medidas); ECMWF no da tapa, ni
       isocero, ni visibilidad, ni índice de elevación.
     · **Lee cerca**: de 1,7 a 4,9 km de sus emplazamientos, frente a los
       14-18 km de ECMWF y GFS en Bermeo.
     · **Llega a 5 días**, no a 2,6 como AROME.
     · Y el Automático, que estaba por defecto, en Euskadi ES AROME los
       dos primeros días — o sea que traía sus mismos agujeros sin decirlo.

     Lo que NO se afirma: que acierte más. Eso hay que medirlo día a día
     contra las estaciones, y para eso está `/estaciones?historia=`.
     Si sale que otro acierta más, se cambia y ya está.

     Solo cambia el valor POR DEFECTO. Si él ya eligió uno, manda el suyo. */
  /* ── POR DEFECTO, AROME HD. Y EL AUTOMÁTICO, FUERA ─────────────────
     Decisión suya, 29-08-2026: *«estadísticamente el automático va
     fallando, así que fuera»* · *«hacemos como hemos dicho»*.

     LO MEDIDO QUE LA SOSTIENE — marcador, 39 muestras contra estaciones
     reales, error en racha y veces que **se queda corto**, que es el
     error que manda a alguien a una torre con más viento del dicho:

         AROME HD   5,6 km/h   corto  1 de 23   <- el mejor
         ICON       7,0        corto  4 de 23
         ARPEGE     8,6        corto  4 de 22
         HARMONIE   8,6        corto  1 de 22
         GEM       10,2        corto  7 de 22
         ECMWF     10,3        corto  4 de 23
         GFS       14,8        corto 11 de 22   <- el peor

     Y CON UNA PEGA DICHA, que él conoce: **cuatro casos no son una
     estadística**. Lo del Automático son cuatro anécdotas de la semana
     —el sirimiri del 26, las nubes del 28, la lluvia de Boiro del 29— y
     ese modelo **acaba de entrar al marcador hoy**. Se le dijo antes de
     hacerlo; decidió igual, y es su app.

     Se le quita la pega que tenía AROME: no publica nubes ni la tapa,
     pero desde hoy esas se piden a ICON y se dice de quién son. Ver
     `QUIEN_LO_MIDE`.

     Lo que queda vivo: **AROME llega a 2,1 días**. Pasado eso hay que
     saltar, y se dice — nunca a escondidas, que es lo que hacía el
     Automático. */
  S.model = LS.get('model', 'arome');
  /* Ver `MODELS`: el Automático dejó de aportar nada el 02-09-2026, y a
     quien lo tuviera guardado se le pasa a AROME HD, que es lo que ya
     estaba haciendo por debajo. No le cambia ningún número. */
  if (S.model === 'best_match') { S.model = 'arome'; LS.set('model', 'arome'); }

  /* Y AL QUE YA TENÍA EL AUTOMÁTICO GUARDADO, se le mueve UNA VEZ. Su
     elección de siempre manda, pero esta la tomó él hoy expresamente y
     no va a andar buscando el botón. Si mañana vuelve a elegir el
     Automático a mano, se respeta y no se le toca más. */
  if (S.model === 'best_match' && !LS.get('fueraAuto', false)) {
    S.model = 'arome';
    LS.set('model', S.model);
    LS.set('fueraAuto', true);
  }
  S.perfil = LS.get('perfil', 'hierro');
  // Nombres viejos (caseta/azotea/poste/monte/urbana) → al de hierro, que
  // es donde cae la mayor parte de su trabajo.
  if (S.perfil === 'dentro' || S.perfil === 'torre') { /* válidos */ }
  else S.perfil = 'hierro';
  // Los nombres cambiaron el 24-08-2026 (caseta/azotea/poste → monte/urbana).
  // Si hay guardado uno viejo, se cae al de monte, que es el 70 % de su trabajo.
  LS.set('perfil', S.perfil);
  S.wunit = LS.get('wunit', 'kmh');
  S.thr   = { ...DEFAULT_THR, ...LS.get('thr', {}) };
  renderThr(); renderPills(); bind(); arrancarZoom();
  // La app abre SIEMPRE en «Ahora», no en la última pestaña que se dejó.
  // Es la pantalla de cabecera: foto del sitio, temperatura, racha y el
  // reparto de mañana/tarde/noche de un vistazo. De ahí se decide a dónde ir.
  //
  // ÚNICA EXCEPCIÓN: cuando la recarga no la ha pedido él, sino que la ha
  // provocado el mapa al quedarse sin memoria. Ahí devolverle a «Ahora»
  // sería castigarle por un fallo nuestro: vuelve a donde estaba.
  let vistaForzada = null;
  try {
    vistaForzada = sessionStorage.getItem('om_vista');
    sessionStorage.removeItem('om_vista');
  } catch {}

  /* ── SI VIENE DE UN AVISO, SE ABRE DONDE DICE EL AVISO ─────────────
     Suyo, 01-09-2026, y tiene toda la razón: *«¿y dónde me lleva de la
     app? ¿para ver qué, Ahora? No tiene sentido»*.

     Y no lo tenía: el aviso decía «se está armando en GERNIKA» y al
     tocarlo se abría la pantalla del sitio que él tuviera puesto, que
     podía ser Bermeo. Un aviso que no te lleva a lo que te está avisando
     es medio aviso — y él lo toca precisamente para ver qué pasa.

     Ahora el aviso trae en su dirección DÓNDE mirar:
       · `?sitio=lat,lon` → abre ESE emplazamiento
       · `?v=torres`      → abre «Mis estaciones» (cuando afecta a varios)
     Sin parámetros, se comporta como siempre. */
  let deAviso = null;
  try {
    const q = new URLSearchParams(location.search);
    const v = q.get('v');
    if (v) vistaForzada = v;
    const sitio = q.get('sitio');
    if (sitio && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(sitio)) {
      const [la, lo] = sitio.split(',').map(Number);
      deAviso = (LS.get('saved', []) || []).find(x =>
        Math.abs(x.lat - la) < 0.002 && Math.abs(x.lon - lo) < 0.002) || { lat: la, lon: lo, name: 'Del aviso' };
    }
    /* La dirección se limpia para que al recargar no vuelva a saltar
       al sitio del aviso de hace horas. */
    if (v || sitio) history.replaceState(null, '', location.pathname);
  } catch {}

  setView(vistaForzada || 'now');

  const p = deAviso || LS.get('place', null);

  // Pintado instantáneo desde caché mientras se descarga lo nuevo
  if (p) {
    // Ojo con el orden: esto es solo el pintado instantáneo de la copia
    // guardada. Si falla, NO puede impedir que se pidan los datos nuevos,
    // que es justo lo que pasaba y dejaba la app congelada en una copia
    // vieja. Por eso va envuelto y go() queda fuera.
    try {
      const c = LS.get('cache.' + ckey(p));
      if (c?.fc) {
        S.place = p; S.data = c; S.data.hours = buildHours(c.fc, S.hgt);
        $('#pName').className = ''; $('#pName').textContent = p.name;
        $('#pMeta').className = 'dim';
        $('#pMeta').textContent = [p.admin1, p.country].filter(Boolean).join(' · ');
        paint();
      }
    } catch (e) { console.error('[arranque] copia guardada:', e); }
    go(p, { silent: true });
  } else {
    // Sin nada guardado: Bermeo como punto de partida
    go({ name: 'Bermeo', admin1: 'Bizkaia', country: 'España', lat: 43.4209, lon: -2.7215 });
  }

  sessionStorage.removeItem('recargando');
  comprobarVersion();
  setInterval(() => comprobarVersion(), 5 * 60e3);
  /* Y los ajustes con el mismo pulso: es lo que hace que el Mac abierto
     toda la tarde adopte lo que él tocó en el móvil, y al revés. El
     gesto real es sacar el móvil del bolsillo: visibilitychange. */
  setInterval(() => sincronizarAjustes(), 5 * 60e3);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { comprobarVersion(); sincronizarAjustes(); }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    setTimeout(revisarCasco, 4000);   // cuando el SW nuevo ya ha instalado
    // Cuando entra una versión nueva, recargar UNA vez para no dejar
    // al usuario trabajando con una app antigua sin saberlo.
    let recargado = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recargado) return;
      recargado = true;
      location.reload();
    });
  }
}

init();


/* ═══════════════════════════════════════════════════════════════════
   AVISOS AL MÓVIL
   ───────────────────────────────────────────────────────────────────
   Suyo, 26-08-2026: «¿esta app no podría enviarme notificaciones al
   teléfono?», y el motivo, dicho por él mismo un rato después: «por
   correo no me entero de nada».

   TRES COSAS QUE SE DICEN CLARAS Y NO SE ESCONDEN:

   1. **En iPhone hay que instalar la app en la pantalla de inicio.**
      Apple no entrega ningún aviso a una página abierta en Safari. Si no
      está instalada, aquí se dice — y no se ofrece un botón que no va a
      funcionar, que es la forma más rápida de que deje de fiarse.

   2. **El permiso se pide con el dedo encima del botón.** Pedirlo solo
      al abrir la app hace que el navegador lo bloquee para siempre, y
      recuperarlo es entrar en ajustes del sistema.

   3. **Si lo deniega, se dice cómo darle la vuelta.** Un «no» del
      navegador no se puede volver a preguntar desde aquí.
   ═══════════════════════════════════════════════════════════════════ */

/* La clave pública, tal y como la quiere el navegador: bytes, no texto. */
function claveABytes(b64) {
  const relleno = '='.repeat((4 - (b64.length % 4)) % 4);
  const limpio = (b64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const cru = atob(limpio);
  return Uint8Array.from([...cru].map(c => c.charCodeAt(0)));
}

function puedeAvisos() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/* En iPhone: instalada = se abre a pantalla completa. Es la única señal
   fiable, y es la que decide si esto puede funcionar o no. */
function estaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

function esApple() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/* ── CÓMO SE LLAMA CADA APARATO ───────────────────────────────────────
   Suyo, 29-08-2026: *«solo tengo Ulefone, iPhone e iMac»* · *«2
   terminales, un PC»*. Los tres estaban apuntados como **«móvil
   (instalada)»**, los tres igual — incluido el ordenador de sobremesa.

   Y eso importa el día que falle uno: en la lista de Avisos se ve
   «3 aparatos» y ya está, sin poder saber cuál dejó de recibir. Con tres
   todavía se adivina; con el iPhone y el Mac en dos navegadores, no.

   No se pregunta nada: lo que se puede saber solo, se saca solo. El
   navegador dice si es iPhone, Android o de sobremesa, y si la app está
   instalada en la pantalla de inicio o abierta en una pestaña — que para
   los avisos NO es lo mismo. */
function comoSeLlamaEsteAparato() {
  return nombreDeAparato(navigator.userAgent, navigator.platform,
                         navigator.maxTouchPoints, estaInstalada());
}

/* Aparte y pura para poder probarla: en Node no se puede falsear
   `navigator`, y una etiqueta que nadie ha comprobado es una suposición. */
function nombreDeAparato(ua, plat, touch, instalada) {
  let que;
  if (/iPhone|iPod/.test(ua)) que = 'iPhone';
  else if (/iPad/.test(ua) || (plat === 'MacIntel' && touch > 1)) que = 'iPad';
  else if (/Android/.test(ua)) que = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) que = 'Mac';
  else if (/Windows/.test(ua)) que = 'Windows';
  else que = 'aparato';

  /* El navegador solo se dice en los de sobremesa, que es donde él puede
     tener dos y acabar con dos suscripciones del mismo ordenador. */
  let nav = '';
  if (que === 'Mac' || que === 'Windows') {
    if (/Edg\//.test(ua)) nav = ' · Edge';
    else if (/OPR\//.test(ua)) nav = ' · Opera';
    else if (/Chrome\//.test(ua)) nav = ' · Chrome';
    else if (/Firefox\//.test(ua)) nav = ' · Firefox';
    else if (/Safari\//.test(ua)) nav = ' · Safari';
  }
  return `${que}${nav}${instalada ? ' · instalada' : ' · en el navegador'}`;
}

async function montarAvisos() {
  const btn = $('#btnAvisos'), est = $('#avisoEstado'),
        nota = $('#avisoNota'), prueba = $('#btnAvisoPrueba');
  if (!btn || !est) return;

  /* El contador se pinta SIEMPRE, en todos los estados. Es lo que
     contesta a «¿estoy cubierto o no?» sin tener que esperar a una
     tormenta para averiguarlo. */
  let nAparatos;
  const di = (txt, detalle = '') => {
    const cont = nAparatos === null || nAparatos === undefined
      ? `<span class="apar apar--duda">no sé cuántos móviles hay activados</span>`
      : nAparatos === 0
        ? `<span class="apar apar--no">0 aparatos activados — no te llega nada</span>`
        : `<span class="apar apar--si">${esc(aparatosTxt(nAparatos))}</span>`;
    est.textContent = txt;
    nota.innerHTML = cont + (detalle ? `<br>${detalle}` : '');
  };

  /* Se pregunta antes de pintar nada, para que hasta el mensaje de
     «no admite avisos» lleve el recuento. */
  try {
    const r = await fetch('/api/suscribir', { cache: 'no-store' });
    nAparatos = r.ok ? (await r.json()).aparatos : null;
  } catch { nAparatos = null; }

  if (!puedeAvisos()) {
    btn.hidden = true;
    return di('Este navegador no admite avisos.',
      'Los avisos van por el <b>navegador</b>, no por la app de Claude. En iPhone hace falta Safari; en Android, Chrome.');
  }

  /* iPhone sin instalar: no se ofrece el botón. Apple no entrega nada a
     una pestaña de Safari, y un botón que no hace nada es peor que no
     tener botón. */
  if (esApple() && !estaInstalada()) {
    btn.hidden = true;
    return di('Falta instalar la app en la pantalla de inicio.',
      'En el iPhone: <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>. Luego ábrela desde ahí y vuelve aquí. '
      + 'Apple no deja que llegue ningún aviso a una página abierta en Safari.');
  }

  if (Notification.permission === 'denied') {
    btn.hidden = true;
    return di('Los avisos están bloqueados en este aparato.',
      'Hay que desbloquearlos en los ajustes del navegador — desde aquí ya no se puede volver a preguntar. '
      + 'En iPhone: <b>Ajustes → Notificaciones → Aitor Meteo</b>.');
  }

  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const ya = reg ? await reg.pushManager.getSubscription() : null;

  /* NO BASTA CON QUE EL MÓVIL TENGA PERMISO: hay que preguntarle al
     servidor si lo tiene apuntado. El 26-08-2026 su Android tenía las dos
     cosas del lado del móvil y el servidor no sabía nada de él — la app
     ponía «ACTIVADOS» y no le habría llegado ni un aviso. */
  let enServidor = null;                 // null = no se ha podido saber
  if (ya) {
    try {
      const r = await fetch('/api/suscribir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprobar: ya.endpoint }), cache: 'no-store',
      });
      if (r.ok) enServidor = !!(await r.json()).apuntado;
    } catch { enServidor = null; }
  }

  /* El caso que le pasó a él: el móvil dice que sí y el servidor que no.
     Se dice tal cual y se le da el botón para arreglarlo. */
  if (ya && enServidor === false) {
    btn.textContent = 'Volver a activarlos';
    btn.dataset.modo = 'activar';
    btn.hidden = false;
    prueba.hidden = true;
    btn.onclick = () => activarAvisos();
    /* ── «NINGÚN AVISO» ERA DEMASIADO ─────────────────────────────
       Lo cazó él en su pantalla el 02-09-2026: arriba salía «1 aparato
       activado» en verde y debajo «Así no te llegaría ningún aviso».
       Las dos cosas a la vez, y la segunda no era cierta: lo que no
       está apuntado es ESTE aparato, pero si hay otros —su móvil, por
       ejemplo— a ésos sí les llega.

       Y la diferencia le importa: no es lo mismo «estoy vendido» que
       «al Mac no, al móvil sí», que es justo lo que pasa desde que la
       cuota del almacén se suspendió. */
    const otros = (nAparatos ?? 0) > 0;
    return di(`A MEDIAS: ${estoEs()} cree que sí, el servidor no lo tiene.`,
      otros
        ? `A <b>${estoEs()}</b> no le llegarían avisos. `
          + `A los <b>${esc(aparatosTxt(nAparatos))}</b> sí — si tu móvil está entre ellos, `
          + `los avisos te siguen llegando ahí. Pulsa «Volver a activarlos» para sumar éste.`
        : 'Así <b>no te llegaría ningún aviso</b>. Pulsa «Volver a activarlos».');
  }

  if (ya && enServidor === null) {
    btn.textContent = 'Volver a activarlos';
    btn.dataset.modo = 'activar';
    btn.hidden = false;
    prueba.hidden = false;
    btn.onclick = () => activarAvisos();
    prueba.onclick = () => avisoDePrueba();
    return di('No he podido comprobarlo con el servidor.',
      'El móvil tiene permiso, pero <b>no puedo confirmar</b> que los avisos vayan a llegar. Manda uno de prueba.');
  }

  if (ya) {
    btn.textContent = `Quitar los avisos de ${estoEs()}`;
    btn.dataset.modo = 'quitar';
    prueba.hidden = false;
    /* ── SE DICE DE QUÉ AVISA, UNA POR UNA ──────────────────────────
       Puesto el 29-08-2026 por lo que preguntó esa mañana: *«en el móvil
       no tengo ninguna notificación»*. Estaba todo bien —tres aparatos
       vivos, la clave puesta, las tareas corriendo— y el silencio era
       CORRECTO, porque hasta ese día el vigilante **solo miraba el
       rayo**. Pero eso no lo ponía en ningún sitio.

       Una app que avisa tiene que decir **de qué avisa**: si no, un día
       tranquilo y un aviso roto se ven exactamente igual. Es la misma
       regla de siempre de esta casa, aplicada al propio aviso. */
    di(`Avisos ACTIVADOS en ${estoEs()}.`,
       'Te llega el <b>parte de la mañana</b> y, aunque tengas la app cerrada, un aviso cuando cambia algo:'
       + '<br>⚡ <b>rayo</b> — CAPE 700 con la tapa por debajo de 75'
       + '<br>🌧 <b>agua</b> — desde 0,3 mm/h; «fuerte» a partir de 2,0'
       + '<br>💨 <b>racha</b> — por encima de 70 km/h, la que te hace no salir'
       + '<br>Solo de lo que <b>cambia</b>: que aparezca, que empeore o que se adelante. '
       + 'Pruébalo con el botón de al lado: si no suena, hay que verlo <b>ahora</b>, no el día de la tormenta.');
  } else {
    btn.textContent = `Activar avisos en ${estoEs()}`;
    btn.dataset.modo = 'activar';
    prueba.hidden = true;
    di(`Avisos apagados en ${estoEs()}.`,
       'Se piden <b>una vez por aparato</b>. Tu móvil, tu iPhone y tu Mac son tres: hay que darle en cada uno.');
  }

  btn.hidden = false;
  btn.onclick = () => (btn.dataset.modo === 'quitar' ? quitarAvisos() : activarAvisos());
  prueba.onclick = () => avisoDePrueba();

  /* ── Y EL NOMBRE DEL APARATO SE REFRESCA SOLO ────────────────────────
     El nombre bueno (Android, iPhone, Mac · Chrome) solo se guardaba al
     darse de alta, así que sus tres aparatos seguirían poniendo «móvil
     (instalada)» los tres hasta que los reactivase uno a uno — y eso no
     lo va a hacer, ni tiene por qué.

     Se manda de nuevo la misma suscripción con el nombre nuevo: el
     servidor la reemplaza por `endpoint`, así que no crea ninguna fila
     nueva. Y se recuerda cuál se mandó, para no escribir en cada carga.
     Lo que la app puede averiguar sola, no se le pregunta. */
  if (ya && enServidor === true) refrescarNombreAparato();
}

/* ── «ESTE MÓVIL» EN UN ORDENADOR DE SOBREMESA ───────────────────────
   Suyo, 29-08-2026: *«además, en el iMac ponía dar de alta a este
   móvil»* · *«y no es un móvil»*.

   Tiene razón y no es una tontería: si la app le llama móvil a su
   ordenador, lo siguiente que se pregunta es si de verdad sabe con qué
   está hablando — y de eso depende que se crea lo que le diga. Sale de
   lo mismo que el nombre del aparato: **lo que se puede saber solo, se
   sabe solo**. */
function estoEs() {
  return comoLlamarlo(nombreDeAparato(navigator.userAgent, navigator.platform,
                                      navigator.maxTouchPoints, estaInstalada()));
}

/* Pura, para poder probarla: en Node no se puede falsear `navigator`. */
function comoLlamarlo(n) {
  if (n.startsWith('iPhone')) return 'este iPhone';
  if (n.startsWith('iPad')) return 'este iPad';
  if (n.startsWith('Android')) return 'este móvil';
  if (n.startsWith('Mac')) return 'este Mac';
  if (n.startsWith('Windows')) return 'este ordenador';
  return 'este aparato';
}

/* Y en plural, para el contador: con un iPhone, un Android y un Mac,
   «3 móviles activados» era falso en un tercio. */
function aparatosTxt(n) {
  return n === 1 ? '1 aparato activado' : `${n} aparatos activados`;
}

async function refrescarNombreAparato() {
  try {
    const nombre = comoSeLlamaEsteAparato();
    if (LS.get('apodoMandado', null) === nombre) return;
    const reg = await navigator.serviceWorker.ready;
    const sus = await reg.pushManager.getSubscription();
    if (!sus) return;
    const r = await fetch('/api/suscribir', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suscripcion: sus.toJSON(), apodo: nombre }),
    });
    if (r.ok) LS.set('apodoMandado', nombre);
  } catch { /* si no se puede, el nombre viejo no rompe nada */ }
}

async function activarAvisos() {
  const btn = $('#btnAvisos');
  btn.disabled = true;
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') { toast('No has dado permiso'); return montarAvisos(); }

    const r = await fetch('/api/suscribir', { cache: 'no-store' });
    const { publica } = await r.json();
    if (!publica) throw new Error('el servidor no tiene la clave de firma');

    const reg = await navigator.serviceWorker.ready;
    const sus = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveABytes(publica),
    });

    const alta = await fetch('/api/suscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suscripcion: sus.toJSON(),
                             apodo: comoSeLlamaEsteAparato() }),
    });
    /* ── SI EL SERVIDOR NO PUEDE GUARDARLO, NO SE PIERDE ─────────────
       Puesto el 01-09-2026 con el almacén de Vercel suspendido y sus
       avisos de tormenta sin salir. Antes esto solo decía «no se ha
       podido» y ahí acababa todo: el teléfono quedaba fuera y no había
       manera de meterlo.

       Ahora la suscripción se enseña para que la copie y la pase por el
       chat: con eso se puede apuntar a mano en el servidor —en una
       variable de entorno, que es gratis y no depende del almacén— y sus
       avisos vuelven. No es bonito, pero funciona sin pagar nada, que es
       lo que él pidió. */
    if (!alta.ok) {
      const caja = $('#avApunte');
      if (caja) {
        caja.hidden = false;
        const codigo = JSON.stringify(sus.toJSON());
        caja.innerHTML = `<b>El servidor no ha podido guardarlo</b> (${alta.status}).
          Tu teléfono está listo, solo falta apuntarlo.
          <b>Dale a Copiar y pega el código en el chat</b> — lo apunto a mano y te vuelven
          los avisos, sin pagar nada:
          <textarea readonly rows="3" class="av__json">${esc(codigo)}</textarea>
          <button type="button" class="btn" id="avCopiar">Copiar el código</button>`;
        /* Botón de copiar: en el móvil, seleccionar a mano un JSON de 300
           caracteres es un suplicio, y este paso es el que le devuelve los
           avisos de tormenta. Con respaldo por si el navegador no deja usar
           el portapapeles (pasa sin HTTPS o si lo tiene capado). */
        const bCop = $('#avCopiar');
        if (bCop) bCop.onclick = async () => {
          try {
            await navigator.clipboard.writeText(codigo);
            bCop.textContent = '✓ Copiado — pégalo en el chat';
          } catch {
            const ta = caja.querySelector('.av__json');
            ta?.focus(); ta?.select();
            bCop.textContent = 'Selecciónalo y copia a mano';
          }
        };
      }
      throw new Error('el servidor no ha podido apuntarlo (' + alta.status
        + '). Te he dejado abajo el código para pasármelo');
    }
    const j = await alta.json().catch(() => ({}));
    if (!j.ok) throw new Error('el servidor no lo ha guardado');

    toast('Avisos activados');
  } catch (e) {
    /* Se dice el motivo. Un «no se pudo» a secas deja sin saber si es el
       móvil, el permiso o el servidor — y eso no se arregla nunca. */
    toast('No se ha podido: ' + (e?.message || e), 5000);
  } finally {
    btn.disabled = false;
    montarAvisos();
  }
}

async function quitarAvisos() {
  const btn = $('#btnAvisos');
  btn.disabled = true;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sus = await reg.pushManager.getSubscription();
    if (sus) await sus.unsubscribe();
    toast(`Avisos quitados de ${estoEs()}`);
  } catch (e) {
    toast('No se ha podido quitar: ' + (e?.message || e), 4000);
  } finally {
    btn.disabled = false;
    montarAvisos();
  }
}

/* ── LA PRUEBA, EN DOS MITADES ────────────────────────────────────────
   Suyo, 26-08-2026, con el Android ya apuntado: *«no me llega»*. Y el
   servidor decía `enviados: 1`, o sea que SALIÓ.

   Entre «sale del servidor» y «suena en el bolsillo» hay dos tramos, y
   sin separarlos no se puede arreglar nada:

     A. el móvil sabe enseñar un aviso  → se prueba SIN servidor, desde
        la propia página
     B. el aviso viaja de nuestro servidor al móvil

   Un solo toque dispara los dos, y por el que falte se sabe dónde
   mirar. Si no llega el A, es cosa del teléfono (Android tiene los
   avisos capados para la app, o la batería la está durmiendo). Si llega
   el A y no el B, el problema es del camino y es nuestro.       */
async function avisoDePrueba() {
  const b = $('#btnAvisoPrueba');
  b.disabled = true;
  try {
    /* MITAD A — sin servidor de por medio, la enseña el propio móvil. */
    try {
      const reg0 = await navigator.serviceWorker.ready;
      const t0 = 'Aitor Meteo · prueba 1 de 2';
      const c0 = 'Esta la enseña tu móvil, sin pasar por el servidor. Si ves esta y no la 2, el fallo es del camino.';
      await reg0.showNotification(t0, {
        body: c0,
        icon: './icons/icon-192.png?v=20260827', badge: './icons/icon-192.png?v=20260827', tag: 'prueba-local',
      });
      /* Que quede en la lista igual que las que vienen de fuera: si
         llegan dos y en la lista sale una, no se sabe si la otra llegó. */
      reg0.active?.postMessage({ tipo: 'apunta',
        aviso: { titulo: t0, cuerpo: c0, tag: 'prueba', llegado: Date.now(), enviado: null } });
    } catch (e) {
      toast('Tu móvil no ha podido enseñar el aviso: ' + (e?.message || e), 6000);
    }

    /* Se manda la dirección de ESTE aparato: el servidor solo avisa a
       esa, y solo si ya estaba apuntada. Así nadie puede usar la prueba
       para hacerle sonar el móvil desde fuera. */
    const reg = await navigator.serviceWorker.ready;
    const sus = await reg.pushManager.getSubscription();
    if (!sus) { toast('Este móvil no está apuntado'); return; }
    const r = await fetch('/api/prueba-aviso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sus.endpoint }),
    });
    const j = await r.json().catch(() => ({}));
    toast(r.ok && j.enviados
      ? 'Van DOS avisos: uno al instante y otro en unos segundos. Baja la persiana de notificaciones y mira si están los dos.'
      : 'El segundo no ha salido: ' + (j.error || j.nota || r.status), 8000);
  } catch (e) {
    toast('No ha salido: ' + (e?.message || e), 5000);
  } finally { b.disabled = false; }
}


/* ── LOS AVISOS QUE LE HAN LLEGADO ────────────────────────────────────
   Suyo, 26-08-2026, con el primero recién recibido: *«pero se va
   seguido, ¿dónde queda o dónde puedo releerlo?»*.

   Los guarda el service worker según llegan (es lo único que corre con
   la app cerrada). Aquí solo se leen y se pintan.

   SE DICEN DOS HORAS, no una: cuándo se ENVIÓ y cuándo LLEGÓ. Un push
   puede quedarse por el camino y aparecer veinte minutos tarde; si solo
   pusiera una hora, un aviso viejo se leería como de ahora mismo. Es la
   misma regla de toda la app: el dato lleva su hora encima.        */
async function pintarRecibidos() {
  const el = $('#recibidos');
  if (!el) return;

  let lista = [];
  try {
    const cache = await caches.open('avisos-recibidos');
    const r = await cache.match('lista');
    if (r) lista = await r.json();
  } catch { lista = []; }

  if (!lista.length) {
    el.innerHTML = `<p class="note">Aquí se irán guardando los avisos que te lleguen al móvil,
      para que puedas <b>volver a leerlos</b> con calma. Se guardan en <b>este</b> aparato
      y solo los que lleguen a partir de ahora.</p>`;
    return;
  }

  const hm = t => new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const dia = t => {
    const d = new Date(t), h = new Date(); h.setHours(0, 0, 0, 0);
    const ayer = new Date(h); ayer.setDate(ayer.getDate() - 1);
    if (d >= h) return '';
    if (d >= ayer) return 'ayer, ';
    return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' }) + ', ';
  };

  /* BORRAR: suyo, 27-08-2026. Un cajón que solo crece se convierte en un
     montón por el que hay que bucear, y entonces no se mira. Cada uno con
     su aspa, y un botón para vaciarlo entero.

     El de vaciar PIDE CONFIRMACIÓN: aquí dentro puede estar el aviso de
     una tormenta que aún no ha pasado, y perderlo por un roce con el dedo
     en el bolsillo no puede ser. */
  el.innerHTML = `<div class="rec__todo">
      <button class="btn btn--sec" id="btnVaciarAvisos">Borrar todos (${lista.length})</button>
    </div>` + lista.map((a, i) => {
    /* El retraso solo se dice cuando lo hay de verdad: si un aviso tardó
       un cuarto de hora en llegar, eso cambia cómo se lee. */
    const tarde = a.enviado ? Math.round((a.llegado - new Date(a.enviado).getTime()) / 60000) : null;
    const retraso = has(tarde) && tarde >= 3
      ? ` <span class="rec__t">· salió a las ${hm(a.enviado)}, tardó ${tarde} min</span>` : '';
    return `<div class="rec" data-tag="${esc(a.tag || 'meteo')}">
      <div class="rec__h"><b>${esc(a.titulo || 'Aviso')}</b>
        <span class="rec__c">${dia(a.llegado)}${hm(a.llegado)}${retraso}</span>
        <button class="rec__x" data-borrar="${i}" aria-label="Borrar este aviso">×</button></div>
      ${a.cuerpo ? `<div class="rec__b">${esc(a.cuerpo)}</div>` : ''}
    </div>`;
  }).join('');

  el.querySelectorAll('[data-borrar]').forEach(b => {
    b.onclick = () => borrarAvisos(+b.dataset.borrar);
  });
  const vaciar = $('#btnVaciarAvisos');
  if (vaciar) vaciar.onclick = () => {
    /* Se dice CUÁNTOS se van a borrar, no un «¿seguro?» a secas: la
       pregunta tiene que llevar dentro lo que se pierde. */
    if (confirm(`¿Borrar los ${lista.length} avisos guardados?\n\n`
              + 'Ojo: si alguno es de una tormenta que aún no ha pasado, lo pierdes.')) {
      borrarAvisos('todos');
    }
  };
}

/* Quita uno por su posición, o todos. Se escribe la lista entera de
   vuelta: es lo único que hay y son cuarenta apuntes de texto. */
async function borrarAvisos(cual) {
  try {
    const cache = await caches.open('avisos-recibidos');
    let lista = [];
    const r = await cache.match('lista');
    if (r) lista = await r.json();
    lista = cual === 'todos' ? [] : lista.filter((_, i) => i !== cual);
    await cache.put('lista', new Response(JSON.stringify(lista),
      { headers: { 'Content-Type': 'application/json' } }));
  } catch { /* si no se puede, se deja como estaba */ }
  pintarRecibidos();
}


/* ── MANDARNOS UN DATO DEL SITIO ──────────────────────────────────────
   Suyo, 27-08-2026: *«para que os envíe datos de los sites, actívame
   algo para que desde el móvil pueda enviarte»*. Y el 26: *«necesito
   conectar con vosotros desde el móvil para enviaros datos en directo
   cuando esté en el monte»*.

   POR QUÉ ESTO Y NO UN CHAT: en una caseta, con una mano, con guantes y
   a veces con mala cobertura, abrir un navegador y buscar una
   conversación no se hace. Esta app ya está en su pantalla de inicio.

   TRES DECISIONES, y las tres por cómo trabaja él:

   1. **Sin formato.** Escribe como habla y ya lo ordenamos nosotras. Un
      formulario con casillas en el monte se deja para luego, y para
      luego es nunca.
   2. **Si no hay cobertura, se guarda y se manda solo.** Lo que mide en
      un cordal no se puede perder porque no haya línea: se queda en el
      móvil y sale al recuperarla.
   3. **Nunca dice «enviado» sin estarlo.** Es la regla 2 de esta app: un
      hueco callado no puede parecer que todo fue bien.             */

/* La clave de la cola, escrita a mano en cada sitio Y NO EN UNA CONSTANTE.
   Aquí abajo, `const` no vale: este bloque está al final del fichero y
   `montarCampo()` se llama desde el arranque, que corre ANTES de llegar
   aquí. Resultado el 27-08-2026 a las 07:26, con él ya trabajando:
   «Cannot access 'CAMPO_COLA' before initialization» y **la app entera
   con la banda roja de error**.

   Se salvó por lo que ya estaba puesto: la app avisa en rojo de que algo
   ha fallado en vez de enseñar datos a medias en silencio. Eso funcionó.
   Lo que falló fui yo publicando sin abrirla después. */

async function montarCampo() {
  const b = $('#btnCampo'), t = $('#campoTexto'), sit = $('#btnCampoSitio');
  if (!b || !t) return;
  b.onclick = () => mandarCampo();
  if (sit) sit.onclick = () => ponerDonde();
  pintarHilo();
  refrescarHilo();

  /* La foto: un botón por entrada —«Hacer foto» abre la cámara y «De la
     galería» abre su carpeta—, y el envío sale en cuanto elige. Por qué
     son DOS y no uno está explicado largo en el index.html: con un solo
     <input> siempre se pierde una de las dos opciones, y cuál se pierde
     depende del móvil. Los dos casos le pasaron a él el 27-08-2026. */
  for (const [idBoton, idEntrada] of [['#btnCampoCamara', '#campoCamara'],
                                      ['#btnCampoFoto',   '#campoFichero']]) {
    const bt = $(idBoton), inp = $(idEntrada);
    if (!bt || !inp) continue;
    bt.onclick = () => inp.click();
    /* Elegir la foto NO la manda: la deja preparada. Ver `prepararFoto`. */
    inp.onchange = () => { if (inp.files?.[0]) prepararFoto(inp.files[0]); inp.value = ''; };
  }
  const bEnv = $('#btnCampoEnviarFoto'), bQui = $('#btnCampoQuitar'),
        bUbi = $('#btnCampoUbiPrevia');
  if (bEnv) bEnv.onclick = () => mandarFoto();
  if (bQui) bQui.onclick = () => quitarFotoEnEspera('Quitada. No se ha mandado nada.');
  if (bUbi) bUbi.onclick = () => ponerDonde();
  /* Si quedó algo sin salir de la última vez, se intenta ahora. */
  soltarCola();
  window.addEventListener('online', soltarCola);
}

/* Dónde está. Se guarda APARTE, no dentro del texto.

   Primera versión: pegaba «(estoy en 43.417, -2.726)» dentro del cuadro
   de texto. Resultado el 27-08-2026: de sus tres primeras notas, DOS
   llegaron solo con las coordenadas y sin una palabra. Él le daba al
   botón, veía algo escrito en el cuadro y lo mandaba creyendo que ya
   estaba. Suyo: *«es muy cansino»*.

   La culpa era del diseño, no suya: **si el botón escribe en el cuadro,
   parece que ya has escrito.** Ahora la ubicación va por su lado, el
   cuadro se queda para sus palabras, y el cursor salta ahí solo. */
let campoUbi = null;

/* ── EL GPS QUE AÚN VIENE DE CAMINO ──────────────────────────────────
   Suyo, 04-09-2026: *«esto pasa muy a menudo, el tema de la ubicación;
   creo que la pilla de ahora, que está puesto Calpe… pero no debe
   pillar de ahí ya que pongo mi ubicación pinchada»*, *«al enviar»*.

   Y tenía toda la razón. Ese día mandó dos fotos desde su casa de
   Bermeo con **doce segundos** de diferencia: la de las 16:00:59 salió
   rotulada **«Calpe»** —el emplazamiento que tenía abierto, a 700 km— y
   la de las 16:01:11 ya con su GPS. Mismo sitio, misma mano, y una
   salió mal.

   No era el móvil ni él: era una **carrera**. Él pincha «Añadir dónde
   estoy», el GPS tarda unos segundos, y si manda antes de que conteste
   `campoUbi` sigue vacío — y la nota se caía al emplazamiento **sin
   decir nada**.

   Lo peor es que esto **ya estaba escrito aquí abajo** desde el
   29-08-2026, con cuatro fotos suyas de Busturia y la primera rotulada
   Bermeo a 4,5 km. Se documentó y no se arregló. Por eso le ha vuelto a
   pasar, y con razón se queja de que es a menudo.

   Aquí se guarda la petición en marcha para que **al enviar se la
   espere**. Y si no llega, se dice: una foto con las coordenadas de
   Calpe congela los cinco modelos para Alicante y la comparación queda
   falseada sin que se note. */
let ubiPidiendo = null;

/* La foto elegida y todavía SIN mandar. Se declara aquí arriba, junto a
   `campoUbi`, porque `ponerDonde()` la mira: dejándola abajo con el resto
   del envío de fotos quedaba usada antes de existir, y eso lo canta la
   prueba «ningún const/let se usa antes de existir». El porqué de que
   exista está largo en `prepararFoto`. */
let fotoEnEspera = null;

/* De dónde salió el cuadro de texto cuando se baja debajo de la foto, para
   poder devolverlo exactamente a su sitio. Aquí arriba por lo mismo que
   `fotoEnEspera`: `prepararFoto` lo usa antes de este punto del fichero. */
let MOVIDO = null;

function ponerDonde() {
  const est = $('#campoEstado'), t = $('#campoTexto'), b = $('#btnCampoSitio');
  if (!navigator.geolocation) { est.textContent = 'Este móvil no da la ubicación.'; return; }
  est.textContent = 'Buscando dónde estás…';
  b.disabled = true;
  /* Se guarda la petición en marcha: si manda antes de que el GPS
     conteste, `esperarLaUbi()` la espera en vez de caer al
     emplazamiento a escondidas. */
  let listo;
  ubiPidiendo = new Promise(r => { listo = r; });
  navigator.geolocation.getCurrentPosition(
    p => {
      ubiPidiendo = null; listo?.();
      campoUbi = { lat: +p.coords.latitude.toFixed(5), lon: +p.coords.longitude.toFixed(5),
                   metros: Math.round(p.coords.accuracy), t: Date.now() };
      b.disabled = false;
      b.textContent = '✓ Ubicación cogida';
      /* Si hay una foto esperando, su aviso tiene que cambiar AHORA de
         «no lleva tu ubicación» a «va con tu ubicación». Verlo cambiar es
         justo lo que él pedía: saber si está pinchada o no. */
      pintarPrevia();

      /* CON UNA FOTO ESPERANDO, NI SE ROBA EL FOCO NI SE HABLA DE OTRA COSA.

         Suyo, 29-08-2026, justo después de publicar la confirmación:
         *«al añadir la ubicación se envía sola… pinchas y ya se envía sin
         darle yo»*. **Y no se enviaba**: comprobado en el servidor, no salió
         ni una foto. Lo que pasaba es que lo PARECÍA, y la culpa era de
         estas dos líneas.

         `t.focus()` está pensado para el flujo de TEXTO, donde mandarle el
         cursor al cuadro es lo correcto. Con una foto en espera es justo lo
         contrario: el móvil desplaza la página al cuadro, **sube el teclado
         y la foto se le va de la pantalla** — y a la vez el aviso ámbar se
         pone verde. Las dos cosas juntas se leen como «ya ha salido».

         Que la app le haga creer que ha mandado algo que no ha mandado es
         el mismo fallo que el silencio que parece respuesta, por el otro
         lado. Así que con foto esperando: no se toca el foco, se le lleva
         la foto a la vista, y se le dice DÓNDE está y que la mande él. */
      if (fotoEnEspera) {
        est.innerHTML = `Cogida (${campoUbi.lat}, ${campoUbi.lon} · ±${campoUbi.metros} m).`
                      + ' <b>La foto sigue aquí SIN mandar</b> — dale a'
                      + ' «Enviar la foto» cuando quieras.';
        $('#campoPrevia')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        /* Se le dice lo que falta, no lo que ya está hecho. */
        est.innerHTML = `Cogida (${campoUbi.lat}, ${campoUbi.lon} · ±${campoUbi.metros} m).`
                      + ' <b>Ahora escribe qué ves y dale a Enviar.</b>';
        t.focus();
      }
    },
    e => {
      ubiPidiendo = null; listo?.();
      b.disabled = false;
      est.textContent = 'No he podido cogerla: ' + (e?.message || 'sin permiso');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}

/**
 * Si el GPS venía de camino, se le espera antes de mandar.
 *
 * Sin esto, un envío hecho dos segundos después de pinchar la ubicación
 * salía con el emplazamiento abierto —Calpe, a 700 km de Bermeo— y sin
 * avisar. Le pasó el 29-08 y otra vez el 04-09.
 *
 * El tope es el mismo que el del GPS (12 s), así que no alarga nada: o
 * contesta, o ya había fallado igual.
 *
 * @returns {Promise<boolean>} si al final hay ubicación buena
 */
async function esperarLaUbi(est) {
  if (!ubiPidiendo) return !!ubiVigente();
  if (est) est.textContent = 'Esperando a tu ubicación…';
  await Promise.race([ubiPidiendo, new Promise(r => setTimeout(r, 12500))]);
  return !!ubiVigente();
}

/* CÓMO SE ETIQUETA DE DÓNDE VIENE LA NOTA.

   Esto se escribió mal la primera vez y le costó a Aitor una comparación
   falsa. El 27-08-2026 mandó fotos desde **Llodio** con la ubicación
   puesta, y llegaron rotuladas **«cerca de BI BERMEO»** — que es su
   emplazamiento seleccionado, a **40 km y en otra provincia**. Las
   coordenadas que iban al lado eran las buenas; la etiqueta las
   contradecía. Y una etiqueta que contradice a su propio número es peor
   que no poner nada: por poco se apunta como fallo de la app una
   llovizna de Bermeo que él nunca vio, porque él estaba en Llodio.

   El fallo de fondo: se decía «cerca de» SIN MIRAR LA DISTANCIA. Ahora
   se mira:
     · sin ubicación  → el emplazamiento elegido, tal cual (es lo único
                        que sabemos, y no se disfraza de medición)
     · a menos de 5 km → «cerca de X», que ahí sí es verdad
     · más lejos       → «a N km de X», con el número delante, para que
                        quien lo lea sepa que NO es ese sitio           */
/* ── LA UBICACIÓN CADUCA A LOS 5 MINUTOS ──────────────────────────────
   Lo vio él el 27-08-2026: *«la pestañita de mandar coordenadas creo que
   está siempre activada»*. Y tenía razón — pero solo en las fotos.

   Al mandar un TEXTO la ubicación se olvidaba (ver `mandarCampo`, y el
   comentario de allí lo dice bien: «arrastrar la anterior sería peor que
   no tenerla»). Al mandar una FOTO no se olvidaba. Así que se quedaba
   pegada indefinidamente: coges la posición en Derio, dos horas después
   mandas una foto desde Bermeo sin tocar el botón, y **la nota sale con
   las coordenadas de Derio y hora de ahora**. Los cinco modelos se
   congelan para Derio. Eso no es un hueco: es un dato falso con pinta de
   medición, y encima con el sello de calidad de «lleva coordenadas».

   Tampoco vale borrarla en cada envío: él manda las fotos a rachas
   —dos seguidas desde Derio, con 62 segundos entre una y otra— y
   obligarle a dar al botón cada vez acaba en que no lo da ninguna.

   Así que caduca. Cinco minutos: sobra para una tanda desde el mismo
   sitio y no llega para haberse movido a otro. Pasado ese rato se tira,
   se le dice, y la nota sale con el emplazamiento elegido — que ya se
   etiqueta honradamente con la distancia.                             */
const UBI_VIVE = 5 * 60e3;

function ubiVigente() {
  if (!campoUbi) return null;
  if (Date.now() - (campoUbi.t ?? 0) <= UBI_VIVE) return campoUbi;
  campoUbi = null;
  const b = $('#btnCampoSitio');
  if (b) b.textContent = 'Añadir dónde estoy';
  return null;
}

/* DE DÓNDE SALEN LAS COORDENADAS DE LA NOTA. Se guarda con ella.

   El 29-08-2026 mandó cuatro fotos seguidas desde Axpe-San Bartolomé
   (Busturia). La primera, 12:56, salió con `lat/lon` de **BI BERMEO** —el
   emplazamiento que tenía abierto—, a **4,5 km**; las tres siguientes,
   12:58-12:59, ya con su GPS. Los cinco modelos se congelaron para Bermeo
   en la primera (racha 22,7 en vez de 28,8).

   Y nada en la nota decía cuál era cuál. La etiqueta `sitio` sí lo
   insinuaba —«BI BERMEO» a secas contra «cerca de BI BERMEO»—, pero eso es
   una sutileza de una palabra, y el `decia` tenía exactamente la misma
   pinta de medición en los dos casos. Confirmado por él: *«no es Bermeo
   ninguna»*.

   Un dato congelado para un sitio donde no estaba no es un hueco: es un
   fallo de la app inventado, y este cuaderno existe justo para lo
   contrario. Así que la nota dice de dónde vienen sus números.        */
function fuenteDeUbi() {
  return ubiVigente() ? 'gps' : 'emplazamiento';
}

/* ── UN SOLO BOTÓN AZUL EN PANTALLA ───────────────────────────────────
   Suyo, 29-08-2026, en cuanto vio la confirmación funcionando:
   *«el problema está que hay 2 enviar»*. Y tenía razón: con una foto
   esperando salían **dos botones azules a la vez** —el «Enviar» de arriba,
   que es el del texto, y el «Enviar la foto» de la previa—. Dos botones
   principales en la misma pantalla no es elegir: es adivinar.

   El primer intento fue dejarlos los dos y que hicieran lo mismo, con el
   de arriba en gris. **No bastó**, y lo dijo enseguida: *«arriba enviar y
   abajo enviar foto… como 2 pantallas»*. Y es que el problema no era solo
   el color: los cuatro botones de arriba quedan a media pantalla de la
   foto, así que con la previa abierta la tarjeta se lee como DOS sitios
   distintos donde mandar. En un móvil, con una mano y en el monte, eso es
   justo lo que no puede pasar.

   Así que con una foto esperando **la fila de arriba se esconde entera**.
   Queda una sola pantalla: el cuadro de texto, la foto, el aviso de la
   ubicación y sus tres botones debajo. Un solo sitio, un solo azul.

   Se esconde y no se desactiva, a propósito: un botón gris sigue siendo un
   botón que se mira y se piensa. Y lo de «los dos hacen lo mismo» se queda
   igualmente —`mandarCampo` manda la foto si hay una esperando—, porque el
   teclado del móvil puede mandar el formulario por su cuenta.

   Al mandarla o al quitarla, todo vuelve a su sitio.                  */
function pintarBotonEnviar() {
  const fila = $('#campoBotones');
  if (fila) fila.hidden = !!fotoEnEspera;
  const b = $('#btnCampo');
  if (!b) return;
  b.textContent = fotoEnEspera ? 'Enviar (va con la foto)' : 'Enviar';
}

function etiquetaDeSitio() {
  const nombre = S.place?.name ?? null;
  const ubi = ubiVigente();
  if (!ubi) return nombre;

  /* ── LA REFERENCIA ES EL SITIO SUYO MÁS CERCANO AL GPS ─────────────
     Cazado el 31-08-2026 en su ronda de cuatro emplazamientos: mandó
     fotos DESDE Punta Galea —a 30 metros de BI PUNTAGALEA, que está en
     su lista— y llegaron como **«a 25 km de BI BERMEO»**, porque la
     referencia era lo que llevaba seleccionado en pantalla.

     No es el fallo de Llodio del 27-08 (aquel decía «cerca de» sin
     mirar la distancia y MENTÍA; este dice una verdad inútil): es la
     pata que faltaba. Teniendo el GPS y su lista, la referencia buena
     es SU emplazamiento más cercano — «en BI PUNTAGALEA» le dice a él
     y al cuaderno de campo exactamente qué estación estaba pisando.

     El seleccionado solo queda de referencia cuando no hay nada suyo
     más a mano. Sin GPS, como siempre: el elegido tal cual.           */
  let ref = (nombre && has(S.place?.lat) && has(S.place?.lon))
    ? { name: nombre, lat: S.place.lat, lon: S.place.lon } : null;
  for (const p of (S.saved || [])) {
    if (!has(p?.lat) || !has(p?.lon)) continue;
    if (!ref || kmEntre(ubi, p) < kmEntre(ubi, ref)) ref = p;
  }
  if (!ref) return null;
  const km = kmEntre(ubi, ref);
  if (!Number.isFinite(km)) return `cerca de ${ref.name}`;
  return km < 0.5 ? `en ${ref.name}`
       : km < 5 ? `cerca de ${ref.name}`
       : `a ${Math.round(km)} km de ${ref.name}`;
}

async function mandarCampo() {
  /* Con una foto esperando, este botón manda la foto CON el texto. Ver
     `pintarBotonEnviar`: no puede haber dos «Enviar» que hagan cosas
     distintas, y menos si el usuario está en el monte con una mano. */
  if (fotoEnEspera) return mandarFoto();

  const b = $('#btnCampo'), t = $('#campoTexto'), est = $('#campoEstado');
  const texto = (t.value || '').trim();
  if (!texto) {
    est.innerHTML = ubiVigente()
      ? 'Tengo tu ubicación, pero <b>falta que escribas qué ves.</b>'
      : 'Escribe algo primero.';
    t.focus();
    return;
  }

  b.disabled = true;
  est.textContent = 'Enviando…';
  /* Igual que en la foto: si el GPS venía de camino se le espera. Sin
     esto, una nota mandada dos segundos después de pinchar la ubicación
     salía con el emplazamiento abierto y sin avisar. */
  await esperarLaUbi(est);
  /* Si ha cogido la ubicación de verdad, esa manda sobre el emplazamiento
     que tenga abierto en la app: puede estar mirando el Oiz y estar en
     Gernika. */
  const nota = {
    texto,
    sitio: etiquetaDeSitio(),
    lat: ubiVigente()?.lat ?? (S.place?.lat ?? null),
    lon: ubiVigente()?.lon ?? (S.place?.lon ?? null),
    ubiFuente: fuenteDeUbi(),
  };

  const salida = await enviarCampo(nota);
  if (salida.ok) {
    t.value = '';
    /* La ubicación se olvida al enviar: la siguiente nota puede ser desde
       otro sitio, y arrastrar la anterior sería peor que no tenerla. */
    campoUbi = null;
    $('#btnCampoSitio').textContent = 'Añadir dónde estoy';
    /* Si tenía una foto esperando, su aviso decía «va con tu ubicación» y
       acaba de dejar de ser verdad. Se repinta. */
    pintarPrevia();
    est.innerHTML = '✓ <b>Recibido.</b> Lo miramos y te contestamos al móvil.';
    pintarHilo();
  } else {
    /* SIN COBERTURA NO SE PIERDE. Se guarda en el móvil y sale sola en
       cuanto haya línea. Y se le dice, que es lo importante: no puede
       creerse que lo mandó si no salió. */
    const cola = LS.get('campo.pendientes', []);
    cola.push({ ...nota, guardado: Date.now() });
    LS.set('campo.pendientes', cola);
    t.value = '';
    est.innerHTML = salida.por === 'sin-red'
      ? '⚠ <b>Sin cobertura ahora mismo.</b> Lo he guardado en el móvil'
        + ' y sale solo en cuanto tengas línea. No lo vuelvas a escribir.'
      : '⚠ <b>No es tu cobertura: el fallo es nuestro.</b> Lo he guardado'
        + ' en el móvil y sale solo en cuanto se arregle. No lo vuelvas a'
        + ' escribir, y no esperes respuesta hasta entonces.';
  }
  b.disabled = false;
}

/* ── POR QUÉ NO SALIÓ: NO ES LO MISMO ────────────────────────────────
   Hasta el 04-09-2026 esto devolvía `true` o `false` y la app siempre
   decía lo mismo: «sin cobertura». El 04-09, a las 4 de la mañana, él
   mandó una nota con el almacén de Vercel suspendido y la app le echó
   la culpa a su cobertura, que estaba perfecta. Él, tres horas después:
   *«¿y cuándo me contestas al de 3 horas?»* — creyendo que la nota
   había salido y que era yo el que no le contestaba.

   Culparle a él de un fallo nuestro no vale. Ahora se distingue:

     · 'sin-red'   → el fetch ni sale del móvil. Eso SÍ es su cobertura.
     · 'servidor'  → el móvil llega y el servidor dice que no. Eso es
                     nuestro, y se dice que es nuestro.

   En los dos casos la nota se guarda en el móvil y sale sola después:
   lo que cambia es lo que se le cuenta, no lo que se hace con ella. */
async function enviarCampo(nota) {
  let r;
  try {
    r = await fetch('/api/campo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nota), cache: 'no-store',
    });
  } catch { return { ok: false, por: 'sin-red' }; }

  try {
    if (r.ok && (await r.json()).ok === true) return { ok: true };
  } catch { /* contestó algo que no es JSON: sigue siendo cosa nuestra */ }
  return { ok: false, por: 'servidor' };
}

/* Lo que se quedó sin mandar. Se vacía en orden y solo se quita de la
   cola lo que de verdad ha salido. */
async function soltarCola() {
  const cola = LS.get('campo.pendientes', []);
  if (!cola.length) return;
  const quedan = [];
  for (const n of cola) if (!(await enviarCampo(n)).ok) quedan.push(n);
  LS.set('campo.pendientes', quedan);
  const est = $('#campoEstado');
  if (est && quedan.length < cola.length) {
    const n = cola.length - quedan.length;
    est.innerHTML = `✓ <b>Enviado${n > 1 ? 's' : ''} ${n} dato${n > 1 ? 's' : ''}</b> que tenías guardado${n > 1 ? 's' : ''} sin cobertura.`;
  }
}


/* ── UNA FOTO DEL SITIO ───────────────────────────────────────────────
   Suyo, 27-08-2026: *«¿y fotos no os puedo enviar?»*. Y es lo más útil
   que puede mandar: el cielo desde el cordal, o la pantalla del
   anemómetro, dicen en un vistazo lo que en texto son tres frases.

   SE ENCOGE ANTES DE SALIR, y no es un detalle: una foto de móvil son
   4 MB, y desde un cordal con una raya de cobertura eso no sube nunca.
   Reducida a 1.600 px de lado largo y JPEG al 70 % se queda en unos
   300 KB — sube en segundos y se ve igual de bien lo que importa, que
   es el cielo, no los píxeles.                                       */
/* ── LA FOTO NO SALE SOLA ─────────────────────────────────────────────
   Suyo, 29-08-2026: *«en el momento que hago la foto la envía sola, no le
   doy ni a enviar… o si la cojo de galería se envía sola sin darle yo.
   Entonces no sé si está pinchada la ubicación o no. Ese es el fallo»*.

   Y era literal: `inp.onchange` llamaba a `mandarFoto()` en cuanto elegía
   la imagen. Entre tocar la foto y salir disparada no había ni un
   instante para mirar si llevaba su GPS.

   POR QUÉ ESO IMPORTA TANTO: sin ubicación viva, la nota sale con las
   coordenadas del emplazamiento que tenga abierto en pantalla, y el
   servidor congela los CINCO modelos para ESE punto. Ese mismo día, a las
   12:56, mandó una foto desde Axpe-San Bartolomé con BI BERMEO abierto:
   se guardó contra Bermeo, a 4,5 km, con racha 22,7 en vez de 28,8. Casi
   se apunta en el cuaderno como fallo de la app algo que solo era el
   sitio equivocado.

   El día antes se tapó el síntoma —avisarle DESPUÉS de mandarla—. No
   valía: para entonces la nota mala ya estaba guardada.

   Ahora la foto se queda en espera, se ve, y **dice con qué ubicación va
   a salir antes de salir**. Cuesta un toque más; él pidió exactamente
   ese toque.

   `fotoEnEspera` se declara arriba, con `campoUbi`.                   */

async function prepararFoto(fichero) {
  const est = $('#campoEstado');
  const botones = ['#btnCampoCamara', '#btnCampoFoto'].map($).filter(Boolean);
  botones.forEach(x => { x.disabled = true; });
  est.textContent = 'Preparando la foto…';

  let datos;
  try {
    datos = await encogerFoto(fichero);
  } catch (e) {
    est.textContent = 'No he podido leer la foto: ' + (e?.message || e);
    botones.forEach(x => { x.disabled = false; });
    return;
  }
  botones.forEach(x => { x.disabled = false; });

  fotoEnEspera = { datos, kb: Math.round(datos.length * 0.75 / 1024) };
  const img = $('#campoPreviaImg');
  if (img) img.src = 'data:image/jpeg;base64,' + datos;
  const caja = $('#campoPrevia');
  if (caja) caja.hidden = false;
  est.textContent = '';
  /* El cuadro de texto baja DEBAJO de la foto: un solo sitio, menos
     pantalla. Ver `bajarCuadroALaFoto`. */
  bajarCuadroALaFoto();
  pintarPrevia();
  pintarBotonEnviar();
}

/* QUE EL COMENTARIO VA CON LA FOTO, DICHO EN LA PANTALLA.

   Suyo, 29-08-2026: *«¿hay algún sitio donde pueda poner un comentario, o
   tengo que enviar la foto y luego poner el comentario?»*.

   **Ya funcionaba**: `mandarFoto` coge lo que haya en `#campoTexto` y lo manda
   dentro de la misma nota. Pero no lo decía en ningún sitio, y con la previa
   abierta el cuadro de texto queda ARRIBA, separado de la foto, así que ni se
   relaciona con ella. Una función que existe y no se ve es una función que no
   existe — y aquí cuesta caro: sus palabras al lado de la foto son la mitad
   del dato («llueve fino», «esto es la ría, no el mar»).

   PRIMER INTENTO, y no bastó: se le puso un renglón diciendo «escríbelo en
   el cuadro de arriba». Lo leyó y contestó lo que había que contestar:
   *«es que hago la foto y no sé dónde poner, un poco lioso; o que se pueda
   poner debajo de la foto y ya está, así se ocupan menos pantallas»*. Tenía
   razón: explicar dónde está una cosa es peor que ponerla donde toca.

   Así que **el cuadro se MUEVE**. Con una foto esperando baja dentro de la
   previa, justo debajo de la imagen y encima de los botones; al mandarla o
   quitarla, vuelve a su sitio. Se mueve el mismo elemento y no se duplica:
   dos cuadros serían dos textos posibles y un sitio donde perder lo escrito.

   `MOVIDO` recuerda de dónde salió para poder devolverlo exactamente ahí. */

function bajarCuadroALaFoto() {
  const t = $('#campoTexto'), btns = $('#campoPreviaBtns');
  if (!t || !btns || MOVIDO) return;
  MOVIDO = { padre: t.parentNode, antesDe: t.nextSibling };
  t.placeholder = 'Si quieres, di algo de esta foto…';
  btns.parentNode.insertBefore(t, btns);
}

function subirCuadroASuSitio() {
  const t = $('#campoTexto');
  if (!t || !MOVIDO) return;
  t.placeholder = 'Qué estás viendo o midiendo…';
  MOVIDO.padre.insertBefore(t, MOVIDO.antesDe);
  MOVIDO = null;
}

/* Lo que va a pasar con la ubicación, DICHO ANTES de mandar. Se repinta
   solo cuando coge la posición, para que vea el cambio al momento. */
function pintarPrevia() {
  const p = $('#campoPreviaUbi');
  if (!p || $('#campoPrevia')?.hidden) return;
  const u = ubiVigente();
  if (u) {
    p.className = 'note ok';
    /* «Todavía sin mandar» va en las DOS ramas, verde y ámbar. En verde
       parece de más y no lo es: el 29-08 el aviso pasando de ámbar a verde
       ya le hizo creer que la foto había salido. Que se ponga bien no es
       que se haya ido. */
    p.innerHTML = `📍 <b>Va con tu ubicación</b> (${u.lat}, ${u.lon} · ±${u.metros} m).`
                + ` Pesa ${fotoEnEspera?.kb ?? '?'} KB.`
                + ' <b>Todavía sin mandar: dale a «Enviar la foto».</b>'
                ;
    return;
  }
  const nombre = S.place?.name ? `«${S.place.name}»` : 'el que tienes elegido';
  const caducada = !!campoUbi;
  p.className = 'note warn';
  p.innerHTML = `⚠ <b>Esta foto NO lleva tu ubicación.</b> Saldrá con el`
              + ` emplazamiento ${nombre}, y el tiempo que guardo con ella será`
              + ` el de ahí, no el tuyo.`
              + (caducada ? ' <b>La que cogiste tiene más de 5 minutos.</b>' : '')
              + ' Si no estás ahí, dale a «Añadir dónde estoy» antes de enviar.'
              + ` Pesa ${fotoEnEspera?.kb ?? '?'} KB.`
              + ' <b>Todavía sin mandar.</b>'
              ;
}

function quitarFotoEnEspera(aviso) {
  fotoEnEspera = null;
  /* Antes de esconder la caja: si el cuadro de texto está dentro, hay que
     sacarlo o se esconde con ella y se queda sin poder escribir. */
  subirCuadroASuSitio();
  const caja = $('#campoPrevia');
  if (caja) caja.hidden = true;
  const img = $('#campoPreviaImg');
  if (img) img.removeAttribute('src');
  pintarBotonEnviar();
  if (aviso) $('#campoEstado').textContent = aviso;
}

async function mandarFoto() {
  const est = $('#campoEstado');
  if (!fotoEnEspera) { est.textContent = 'No hay ninguna foto preparada.'; return; }
  const { datos, kb } = fotoEnEspera;
  /* ── PRIMERO SE ESPERA AL GPS SI VENÍA DE CAMINO ─────────────────
     Suyo, 04-09-2026: «pongo mi ubicación pinchada… al enviar». Mandó
     dos fotos con doce segundos de diferencia y la primera salió
     rotulada «Calpe», a 700 km. El GPS aún no había contestado. */
  await esperarLaUbi(est);
  /* Si la ubicación se le ha pasado de hora, la nota sale con el
     emplazamiento elegido — y hay que DECÍRSELO, no dejar que crea que
     la foto lleva sus coordenadas. */
  const teniaUbi = !!campoUbi, sigueVigente = !!ubiVigente();
  /* Los DOS botones de foto, no solo uno: desde el 27-08-2026 hay
     «Hacer foto» y «De la galería», y mientras sube una no se puede
     empezar otra por el otro lado. Y el de enviar, que si no se manda dos
     veces la misma dando dos toques seguidos. */
  const botones = ['#btnCampoCamara', '#btnCampoFoto', '#btnCampoEnviarFoto']
    .map($).filter(Boolean);
  const b = { set disabled(v) { botones.forEach(x => { x.disabled = v; }); } };
  b.disabled = true;

  est.textContent = `Enviando la foto (${kb} KB)…`;

  try {
    const r = await fetch('/api/foto', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foto: datos,
        texto: ($('#campoTexto').value || '').trim(),
        sitio: etiquetaDeSitio(),
        lat: ubiVigente()?.lat ?? (S.place?.lat ?? null),
        lon: ubiVigente()?.lon ?? (S.place?.lon ?? null),
        ubiFuente: fuenteDeUbi(),
      }), cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      $('#campoTexto').value = '';
      /* SE LE AVISA SIEMPRE QUE LA FOTO NO LLEVE SU GPS, no solo cuando la
         ubicación ha caducado.

         Antes solo saltaba el caso `teniaUbi && !sigueVigente`. Si NUNCA le
         daba al botón, la foto salía con las coordenadas del emplazamiento
         y sin decir ni pío. Eso le pasó el 29-08-2026 a las 12:56: foto en
         Busturia, congelada contra Bermeo, a 4,5 km, y nadie se enteró
         hasta que él dijo *«no es Bermeo ninguna»*. */
      const nombreSitio = S.place?.name ? `«${S.place.name}»` : 'el que tienes elegido';
      let pega = '';
      if (teniaUbi && !sigueVigente) {
        pega = ' <b>⚠ Tu ubicación era de hace más de 5 minutos, así que NO la he'
             + ` usado</b> — la foto va con el emplazamiento ${nombreSitio}.`
             + ' Si estás en otro sitio, dale otra vez a «Añadir dónde estoy».';
      } else if (!sigueVigente) {
        pega = ` <b>⚠ Esta foto va con el emplazamiento ${nombreSitio}, no con`
             + ' tu GPS.</b> Si no estás ahí, el tiempo que guardo con ella no es'
             + ' el tuyo: dale a «Añadir dónde estoy» y mándala otra vez.';
      }
      /* Se retira la que estaba en espera ANTES de escribir el resultado:
         `quitarFotoEnEspera` con aviso pisaría este texto. */
      quitarFotoEnEspera();
      est.innerHTML = `✓ <b>Foto recibida</b> (${j.kb} KB). La miramos.` + pega;
      pintarHilo();
    } else {
      /* NO se dice «enviada» si no salió. Y la foto no se guarda para
         luego: ocuparía demasiado en el móvil. Se le dice que la repita
         cuando tenga línea, que es la verdad. */
      est.innerHTML = '⚠ <b>No ha salido</b>: ' + esc(j.error || 'sin cobertura')
                    + '. Vuelve a intentarlo cuando tengas línea.';
    }
  } catch {
    est.innerHTML = '⚠ <b>No ha salido</b> — sin cobertura. Repítelo cuando tengas línea.';
  }
  b.disabled = false;
}

/* Reduce la foto en el propio móvil. Si algo falla por el camino se dice,
   no se manda la original de 4 MB por su cuenta. */
function encogerFoto(fichero, lado = 1600, calidad = 0.7) {
  return new Promise((res, rej) => {
    const lector = new FileReader();
    lector.onerror = () => rej(new Error('no se puede abrir'));
    lector.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('no parece una foto'));
      im.onload = () => {
        const f = Math.min(1, lado / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * f);
        c.height = Math.round(im.height * f);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', calidad).split(',')[1]);
      };
      im.src = lector.result;
    };
    lector.readAsDataURL(fichero);
  });
}


/* ── LO QUE MANDÓ Y LO QUE LE CONTESTAMOS ─────────────────────────────
   Suyo, 27-08-2026: *«¿y si os escribo algo podéis contestarme? ¿o solo
   lo que os envío lo veis y listo?»*.

   Contestar ya se podía —le llega al móvil como aviso—, pero la respuesta
   quedaba suelta, sin pegarse a lo que él había mandado. Al día siguiente
   tendría su nota por un lado y nuestra contestación por otro.

   Aquí van juntas, y las suyas SIN contestar salen marcadas. Eso último
   es la regla de siempre: **el silencio no puede parecer una respuesta.**
   Si mandó algo y nadie le ha dicho nada, tiene que verlo.           */
/* ── QUE LA RESPUESTA APAREZCA SOLA ───────────────────────────────────
   Encontrado el 27-08-2026 a las 14:11, y con él delante esperando.

   Mandó dos notas a las 14:08 y **se le contestaron a las 14:10** —en
   2,7 y 2,2 minutos, que es justo lo que queríamos—. Pero escribió
   diciendo que no había contestación… porque **el hilo solo se pintaba
   al abrir la pestaña**. La respuesta estaba en el servidor y su
   pantalla seguía enseñando «Aún sin contestar».

   Es la regla 2 otra vez, y de las tontas: no faltaba el dato, es que no
   se refrescaba. Y el daño no es cosmético — si cree que no le
   contestamos, deja de mandar fotos, y lo que él mide es lo único que
   dice si esta app acierta.

   Se mira cada 20 s, y SOLO cuando la pestaña está delante y el hilo se
   ve: ni gasta datos en el monte con la app en el bolsillo, ni pide nada
   con la pantalla apagada. Y al volver a la app se refresca en el acto,
   que es cuando más falta hace.                                       */
function refrescarHilo() {
  const seVe = () => document.visibilityState === 'visible'
                  && $('#campoHilo')?.offsetParent != null;
  setInterval(() => { if (seVe()) pintarHilo(); }, 20e3);
  document.addEventListener('visibilitychange', () => { if (seVe()) pintarHilo(); });
}

async function pintarHilo() {
  const el = $('#campoHilo');
  if (!el) return;

  let notas = [];
  try {
    const r = await fetch('/api/campo?n=8', { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    notas = (await r.json()).notas || [];
  } catch (e) {
    /* Un fallo del servidor o de la red NO borra el hilo que ya se ve: se
       queda lo último leído y se avisa encima. Solo se vacía cuando el
       servidor contesta bien y dice que no hay notas (revisión 04-09-2026). */
    const ya = el.querySelector('.hilo');
    const aviso = `<div class="hilo__caido">No he podido leer tus notas ahora mismo (${esc(e?.message || 'sin red')}).</div>`;
    if (ya) { el.querySelector('.hilo__caido')?.remove(); ya.insertAdjacentHTML('afterbegin', aviso); }
    else el.innerHTML = aviso;
    return;
  }

  if (!notas.length) { el.innerHTML = ''; return; }

  const sinLeer = notas.filter(n => !n.respuesta).length;
  el.innerHTML = `<div class="hilo">
    <div class="hilo__h">Lo que has mandado${
      sinLeer ? ` · ${sinLeer} sin contestar todavía` : ''}
      <button class="hn__todo" id="btnVaciarHilo">Borrar todo</button></div>
    ${notas.map(n => `
      <div class="hn${n.respuesta ? '' : ' hn--sin'}">
        <div class="hn__c">${esc(n.hora || '')}${n.sitio ? ' · ' + esc(n.sitio) : ''}${
          n.foto ? ' · 📷 con foto' : ''}
          <button class="rec__x" data-quitar="${esc(n.cuando)}" aria-label="Borrar esta nota">×</button></div>
        <div class="hn__t">${esc(n.texto || '')}</div>
        ${n.foto
          ? `<a class="hn__foto" href="${BACKEND}/api/foto?f=${encodeURIComponent(n.foto)}" target="_blank" rel="noopener">
               <img src="${BACKEND}/api/foto?f=${encodeURIComponent(n.foto)}" alt="La foto que mandaste" loading="lazy">
             </a>`
          : ''}
        ${n.respuesta
          ? `<div class="hn__r"><b>Respuesta</b> · ${esc(n.respuesta.hora)}<br>${esc(n.respuesta.texto)}
               <button class="hn__resp" data-responder="${esc(n.cuando)}">Responder a esto</button></div>`
          : '<div class="hn__f">Aún sin contestar.</div>'}
      </div>`).join('')}
  </div>`;

  el.querySelectorAll('[data-quitar]').forEach(b => {
    b.onclick = () => borrarNota(b.dataset.quitar);
  });

  /* ── RESPONDER SOBRE LO MISMO, SIN EMPEZAR DE CERO ─────────────────
     Suyo, 29-08-2026: *«cuando me escribes, ¿se podría poner un botón
     para responderte sobre ese tema sin darle a otro nuevo? El nuevo que
     se quede, pero para responderte digo»*.

     Y tiene razón en las dos mitades. Hasta ahora, para contestar a algo
     que le habíamos dicho tenía que escribir una nota suelta, y al otro
     lado llegaba sin saber de qué hablaba — con catorce emplazamientos y
     varios asuntos a la vez, «pues no» no dice nada.

     No se monta ningún hilo nuevo ni se toca el botón de siempre: el
     texto se prepara ya escrito con la cita de a qué responde, y él
     escribe debajo. Lo que se manda es una nota normal, así que el resto
     de la máquina no se entera. */
  el.querySelectorAll('[data-responder]').forEach(b => {
    b.onclick = () => {
      const n = notas.find(x => x.cuando === b.dataset.responder);
      if (!n) return;
      const caja = $('#campoTexto');
      if (!caja) return;
      const corto = (n.respuesta?.texto || '').slice(0, 60);
      caja.value = `Sobre lo que me dijiste (${n.respuesta?.hora || ''}): «${corto}${
        (n.respuesta?.texto || '').length > 60 ? '…' : ''}»\n\n`;
      caja.focus();
      /* El cursor al final, que si no se pone delante de la cita y
         escribe encima de ella. */
      caja.setSelectionRange(caja.value.length, caja.value.length);
      caja.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
  });
  const vac = $('#btnVaciarHilo');
  if (vac) vac.onclick = () => {
    /* La pregunta lleva dentro lo que se pierde, no un «¿seguro?» pelado.
       Aquí puede haber una respuesta nuestra que aún no ha aplicado. */
    if (confirm(`¿Borrar las ${notas.length} notas y sus respuestas?\n\n`
              + 'Se borran también las fotos que mandaste con ellas.')) borrarNota('todas');
  };
}

/* Borra en el servidor, no solo de la pantalla: si solo se quitara aquí,
   volvería a salir al recargar y parecería que no se ha borrado. */
async function borrarNota(cual) {
  const el = $('#campoHilo');
  try {
    const r = await fetch('/api/campo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrar: cual }), cache: 'no-store',
    });
    if (!r.ok) throw new Error(r.status);
  } catch {
    /* No se dice «borrado» si no se ha borrado. */
    const est = $('#campoEstado');
    if (est) est.innerHTML = '⚠ <b>No se ha podido borrar</b> — sin cobertura. Inténtalo luego.';
    return;
  }
  if (el) pintarHilo();
}


/* ── ¿SIGUE VIVO EL QUE VIGILA? ───────────────────────────────────────
   Suyo, 27-08-2026, al enterarse de que el vigilante llevaba once horas
   parado mientras él trabajaba: *«joe con esos fallos… que eso no
   ocurra»*.

   Y tiene razón en que no basta con prometer mirarlo. El problema de
   fondo es el de siempre en esta app:

       **Un vigilante parado se ve exactamente igual que un vigilante
       tranquilo.**

   Lo que había para detectarlo —la revisión de mantenimiento— corría en
   el mismo Mac que el vigilante. Se atascaron los dos en un diálogo de
   permiso de la noche anterior y no quedó nadie para decirlo.

   Así que el aviso se pone DONDE ÉL SÍ MIRA, que es esta pantalla, y no
   depende de que corra ninguna tarea: cada vez que abre la app se
   pregunta cuándo fue la última pasada. Si hace mucho, se le dice arriba
   del todo, en rojo.

   El listón son 4 horas y media: el vigilante pasa cada 3, así que eso
   es una pasada perdida y algo de margen. Menos que eso sería cantar por
   un retraso normal, y una alarma que canta se deja de mirar.        */
async function mirarPulso() {
  const card = $('#parteCard');
  if (!card) return;

  let d = null;
  try {
    const r = await fetch('/api/vigilante?pulso=1', { cache: 'no-store' });
    if (r.ok) d = await r.json();
  } catch { d = null; }

  const viejo = $('#pulsoAviso');
  if (viejo) viejo.remove();

  const el = document.createElement('div');
  el.id = 'pulsoAviso';
  card.prepend(el);
  el.innerHTML = textoPulso(d);
  el.className = clasePulso(d);
}

/* CALLAR NO VALE, Y ESTE ERA EL FALLO. Hasta el 27-08-2026 esto solo
   hablaba cuando el vigilante llevaba 4 h 30 muerto; el resto del tiempo,
   silencio. Y el silencio decía DOS cosas a la vez: «va bien» y «no he
   podido preguntar».

   Suyo, ese día: *«no puedo estar dándole a permitir cada 4 minutos»* y
   *«si me voy a la calle y me estáis esperando, no avanzamos»*. Lo grave
   que hay detrás lo dijo la sesión de comparativas y es exacto: **una
   tarea parada se ve igual que una tarde tranquila**.

   Así que ahora se dice SIEMPRE en cuál de los tres estados está. Es la
   regla 2 de esta app aplicada al propio vigilante: un hueco callado se
   confunde con «aquí no pasa nada». */
const PULSO_MALO = 240;        // 4 h. La pasada va cada 3 h: una perdida ya se ve.

function estadoPulso(d) {
  /* ── «NO CONTESTA» Y «CONTESTA PERO NO LO SABE» NO SON LO MISMO ────
     Suyo, 02-09-2026, viendo el cartel amarillo: *«??»*.

     Y con razón: le decía «no he podido preguntar por el vigilante, sin
     cobertura o el servidor sin contestar» cuando el servidor SÍ estaba
     contestando — lo que no podía era leer CUÁNDO fue la última pasada,
     porque esa marca vive en el almacén de Vercel, suspendido hasta el
     26-09. O sea que el vigilante estaba corriendo y el cartel le decía
     que a lo mejor estaba solo.

     Son tres estados, no dos, y el de en medio es el de ahora:
       · no contesta              → no se sabe nada
       · contesta y dice el fallo → el vigilante VIVE, le falta la marca
       · contesta con la hora     → se sabe todo                        */
  if (!d) return 'nolose';
  if ((d.haceMin === null || d.haceMin === undefined) && d.fallo) return 'sinmarca';
  if (d.haceMin === null || d.haceMin === undefined) return 'nolose';
  return d.haceMin > PULSO_MALO ? 'muerto' : 'vivo';
}

function clasePulso(d) {
  const e = estadoPulso(d);
  return 'pulso' + (e === 'muerto' ? ' pulso--mal'
    : (e === 'nolose' || e === 'sinmarca') ? ' pulso--nolose' : ' pulso--ok');
}

function textoPulso(d) {
  const e = estadoPulso(d);

  /* NO SÉ ≠ VA BIEN. Si él está en el monte sin cobertura no se le puede
     decir «el vigilante está muerto» —sería falsa alarma donde más duele—
     pero tampoco se le puede dejar creer que ha comprobado algo. */
  /* El de en medio: contesta, pero no puede leer su propia marca. */
  /* Este texto decía «el almacén está suspendido hasta el 26 de
     septiembre». Dos cosas mal a la vez, las dos corregidas el
     04-09-2026: el almacén se mudó a Redis esa mañana y **ya no está
     suspendido**, y aquella fecha no la respaldaba nada —Vercel nunca
     dio plazo de vuelta—. Un aviso que da por rota una cosa que
     funciona le hace desconfiar de las que sí están rotas. */
  if (e === 'sinmarca')
    return `<b>El vigilante contesta, pero no sabe decir cuándo pasó.</b>
      <b>Está corriendo</b> —lo lanza cron-job.org cada media hora, no depende
      de tu Mac—: lo que no hay es el sello de la última pasada. Suele ser que
      aún no ha hecho ninguna desde el último cambio; en media hora estará.
      Los avisos siguen saliendo.`;

  if (e === 'nolose')
    return `<b>No he podido preguntar por el vigilante.</b> Sin cobertura o el
      servidor sin contestar. <b>Esto NO quiere decir que esté bien</b>: quiere
      decir que no lo sé. Vuelve a mirarlo cuando tengas línea.`;

  if (e === 'muerto') {
    const h = Math.floor(d.haceMin / 60), m = d.haceMin % 60;
    return `<b>⚠ NADIE ESTÁ VIGILANDO</b><br>
      El vigilante lleva <b>${h} h ${m} min</b> sin pasar por tus emplazamientos.
      Debería hacerlo cada 3 horas. <b>Lo que ves aquí es del último rato que miró</b>
      — los números que ves son del último rato que miró.`;
  }

  const cuanto = d.haceMin < 60 ? `hace ${Math.max(0, d.haceMin)} min`
    : `hace ${Math.floor(d.haceMin / 60)} h ${String(d.haceMin % 60).padStart(2, '0')} min`;

  /* ── PASAR NO ES AVISAR ────────────────────────────────────────────
     El servidor manda dos cosas más que esta pantalla no pintaba:
     `envia` (si de verdad va a mandar el aviso o está mudo) y `lista`
     (si está mirando SUS emplazamientos o la lista de respaldo escrita a
     mano). Sin ellas ponía «Vigilante en pie» con el mismo aplomo
     estuviera avisando o no.

     Es el fallo del 29-08 a medio arreglar —«se le dijo que estaba
     cubierto con el Mac apagado»—: se arregló el servidor para que lo
     dijera y no se arregló la pantalla para que lo leyera. Cazado en el
     barrido del 01-09-2026. */
  const pegas = [];
  if (d.envia === false)
    pegas.push(`<b>PERO ESTÁ MUDO</b>: mira, y NO manda avisos al móvil.
      O sea que pasa por tus sitios y no te cuenta lo que ve.`);
  if (d.lista === 'respaldo')
    pegas.push(`<b>Y NO está mirando TU lista</b>, sino la de respaldo escrita a
      mano: puede faltarle algún emplazamiento de los tuyos.`);

  return `<b>Vigilante en pie.</b> Última pasada por tus
    ${d.sitios ? `<b>${d.sitios}</b> ` : ''}emplazamientos <b>${cuanto}</b>.`
    + (pegas.length ? `<br><span class="pulso__pega">${pegas.join('<br>')}</span>` : '');
}
