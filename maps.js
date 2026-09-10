/* ═══════════════════════════════════════════════════════════════════
   Cartografía meteorológica — teselas nativas
   ───────────────────────────────────────────────────────────────────
   Usa el servicio oficial de teselas de Open-Meteo (map-tiles) con su
   librería oficial @openmeteo/weather-map-layer sobre MapLibre GL.

   Esto NO es un iframe de otra web: el mapa, las capas y los controles
   son de esta app. De fuera vienen los datos del modelo y el mapa base,
   igual que en cualquier visor meteorológico profesional.

   Resolución: la NATIVA del modelo (ECMWF 0,25°, AROME 1,3 km…), no una
   rejilla remuestreada. Cada modelo publica solo algunas variables: las
   que no tiene no se ofrecen, y se avisa. Nunca se sustituye una capa
   por otra parecida sin decirlo.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

/* ---------- De dónde se bajan las teselas ──────────────────────────
   ESTO TUMBÓ LA APP ENTERA EL 24-08-2026.

   La cartografía pasaba SIEMPRE por nuestro dominio (la función
   `/omtiles`), y esa función se descarga el fichero entero en el servidor
   y lo reenvía. Cada tesela cuenta dos veces: entra y sale. Los ficheros
   de ECMWF HRES son rejillas de 6,6 millones de puntos. En tres días —del
   21 al 24 de agosto— se comieron los 300 créditos del plan y Netlify
   suspendió el sitio: 503 «usage_exceeded» en TODO, hasta el index.html.
   Aitor se quedó sin app, estando de guardia.

   El proxy existía por un motivo real: en algunas redes móviles no se
   alcanza el origen S3 de Open-Meteo y el mapa se quedaba en «leyendo
   modelo…» para siempre. Ese motivo sigue siendo válido.

   Solución: **directo primero, proxy solo si esa red no llega.** Se
   comprueba una vez y se recuerda 6 horas. En uso normal el gasto de
   nuestro servidor es CERO; en la red donde falle, funciona igual que
   antes. Se puede forzar con ?tiles=directo o ?tiles=proxy.            */
/* ═══════════════════════════════════════════════════════════════════
   EL HOST DE LAS TESELAS CAMBIÓ EL 04-09-2026, Y NO AVISARON
   ───────────────────────────────────────────────────────────────────
   Suyo, esa tarde, con el mapa en blanco y teniendo que irse a Windy:
   *«ni mirar mi mapa puedo, qué tristeza»* · *«mapas no va»*.

   `map-tiles.open-meteo.com` **dejó de existir**: no es un corte, es
   NXDOMAIN — el nombre ya no resuelve. Open-Meteo pasó a servir los
   ficheros `.om` desde su origen en S3, que es el que usa su propia
   librería `@openmeteo/weather-map-layer`. Comprobado ese día:

     · openmeteo.s3.amazonaws.com/data_spatial → 206 con Range, CORS
       abierto (`Access-Control-Allow-Origin: *`), los 9 modelos del
       selector con catálogo real.
     · data-spatial.open-meteo.com → 403 salvo con Referer de
       open-meteo.com. NO vale para esta app.
     · maps.open-meteo.com → es su web, devuelve HTML para cualquier
       ruta. Da 200 a todo y no sirve nada.

   La app ya usaba el sistema nuevo (protocolo `om://`, ficheros `.om`
   renderizados en el navegador): lo único muerto era el host. Se cambia
   AQUÍ y en los dos proxys de reserva, y `prueba-mapas.mjs` vigila que
   el host viejo no vuelva a colarse por ningún sitio.
   ═══════════════════════════════════════════════════════════════════ */
const TILES_DIRECTO = 'https://openmeteo.s3.amazonaws.com/data_spatial';
/** Zoom máximo que sirve RainViewer de verdad (medido 10-09-2026). */
const RAINVIEWER_ZMAX = 7;

const TILES_PROXY   = (typeof location !== 'undefined')
  ? (typeof BACKEND !== 'undefined' ? BACKEND : location.origin) + '/omtiles' : TILES_DIRECTO;

let TILES = TILES_DIRECTO;
const RECUERDA_MS = 6 * 3600e3;

/** Decide de dónde se piden las teselas. Se llama antes de montar el mapa. */
async function elegirOrigenTeselas() {
  const forzado = (typeof location !== 'undefined')
    && (location.search.match(/[?&]tiles=(directo|proxy)/) || [])[1];
  if (forzado) { TILES = forzado === 'proxy' ? TILES_PROXY : TILES_DIRECTO; return TILES; }

  try {
    const g = JSON.parse(localStorage.getItem('torre.origenTeselas2') || 'null');
    if (g && Date.now() - g.t < RECUERDA_MS) {
      TILES = g.proxy ? TILES_PROXY : TILES_DIRECTO;
      return TILES;
    }
  } catch { /* si no se puede leer, se prueba */ }

  // Prueba corta contra el host de Open-Meteo. Si responde, directo.
  let directo = false;
  try {
    const ac = new AbortController();
    const reloj = setTimeout(() => ac.abort(), 6000);
    const r = await fetch(`${TILES_DIRECTO}/dwd_icon_eu/latest.json`,
                          { signal: ac.signal, cache: 'no-store' });
    clearTimeout(reloj);
    directo = r.ok;
  } catch { directo = false; }

  TILES = directo ? TILES_DIRECTO : TILES_PROXY;
  try {
    localStorage.setItem('torre.origenTeselas2',
      JSON.stringify({ proxy: !directo, t: Date.now() }));
  } catch { /* sin sitio para guardarlo: se vuelve a probar la próxima vez */ }
  return TILES;
}

/* Lectura de metadatos del modelo con reintentos.

   `latest.json` (y los `.om`) van DIRECTOS al origen S3 de Open-Meteo,
   cross-origin, NO por el proxy de Netlify que sí protege las APIs de
   punto. En una red floja —el monte— un único intento se queda en
   "Failed to fetch" y el mapa no llega ni a arrancar. Aquí se reintenta
   con espera creciente antes de rendirse.                              */
async function jgetMeta(url, { timeout = 12000, tries = 3 } = {}) {
  let ultimo;
  for (let i = 0; i < tries; i++) {
    try { return await jget(url, {}, { timeout }); }
    catch (e) {
      ultimo = e;
      if (i < tries - 1) await new Promise(r => setTimeout(r, 600 * (i + 1) * (i + 1)));
    }
  }
  throw ultimo;
}

const TMODELS = [
  { id:'ecmwf_ifs', name:'ECMWF HRES', res:'9 km',
    desc:'Centro Europeo, alta resolución — 6 días hora a hora. El de referencia' },
  { id:'meteofrance_arome_france_hd', name:'AROME HD', res:'1,3 km',
    desc:'La mayor resolución que cubre Euskadi. Viento nativo a 20 y 50 m' },
  // MEDIDO el 26-08-2026: NO LLEGA A EUSKADI. Ninguno de los doce
  // emplazamientos tiene dato («No data is available for this location»).
  // El texto decía «muy fino para tormentas» y no decía esto, que es lo
  // único que le importa a quien lo va a pulsar desde aquí.
  { id:'dwd_icon_d2', name:'ICON-D2', res:'2 km',
    desc:'DWD alemán de área limitada — 2 días, muy fino para tormentas. '
       + 'OJO: NO cubre Euskadi, su dominio se queda al norte. Para Alemania y Centroeuropa' },
  { id:'meteofrance_arpege_europe', name:'ARPEGE', res:'11 km',
    desc:'Météo-France Europa — 4 días. Viento nativo a 50 y 100 m' },
  { id:'dwd_icon_eu', name:'ICON-EU', res:'7 km', desc:'DWD alemán sobre Europa' },
  { id:'knmi_harmonie_arome_europe', name:'HARMONIE', res:'2 km',
    desc:'KNMI holandés de alta resolución sobre Europa occidental' },
  { id:'ncep_gfs013', name:'GFS', res:'13 km',
    desc:'NOAA — llega a 16 días, útil para planificar la semana' },
  { id:'ecmwf_ifs025', name:'ECMWF 25 km', res:'0,25°',
    desc:'Centro Europeo global con todos los niveles de presión (850 hPa, 500 hPa…)' },
  { id:'ncep_gfs025', name:'GFS 25 km', res:'0,25°',
    desc:'NOAA global con todos los niveles de presión' },
  { id:'dwd_icon', name:'ICON global', res:'0,125°',
    desc:'DWD global con niveles de presión' },
];


/* `v` es el nombre EXACTO de la variable en el servicio de teselas.
   Si el modelo elegido no la publica, la capa no aparece.

   NOTA — capas marinas retiradas (21-08-2026): los modelos de oleaje
   pintaban color sobre tierra firme, donde no tienen dato, y la
   consulta puntual fallaba en ellos. Hasta poder enmascarar la tierra
   correctamente NO se publican: es preferible no tener la capa que
   tenerla mintiendo. Los datos de mar siguen en la pestaña «Mar»,
   que usa la API de puntos y sí está verificada. */
const TLAYERS = [
  { id:'precipitation', g:'Lluvia', name:'Precipitación', v:'precipitation', unit:'mm/h', escala:'lluvia',
    desc:'Intensidad de lluvia prevista' },
  { id:'snow_depth', g:'Lluvia', name:'Espesor de nieve', v:'snow_depth', unit:'m',
    desc:'Nieve acumulada en el suelo' },
  { id:'aemet', g:'Lluvia', name:'Radar AEMET', v:null, unit:'dBZ', aemet:true,
    desc:'Compuesto nacional de radar de AEMET — observación real, cada 10 minutos' },
  { id:'refl', g:'Lluvia', name:'Reflectividad', v:'precipitation', unit:'dBZ', dbz:true, escala:'dbz',
    desc:'Lluvia del modelo convertida a dBZ (Marshall-Palmer) — ESTIMADA, no es eco de radar' },
  { id:'radar', g:'Lluvia', name:'Radar observado', v:null, unit:'',
    desc:'Lo que YA está cayendo (RainViewer) — observación, no previsión' },
  /* ── RADAR + PREVISIÓN EN UNA TIRA (09-09-2026) ──────────────────────
     Suyo, en Calpe con la tormenta subiendo por la costa: «como Windy lo
     ve quiero». Una sola tira: hasta ahora el radar observado (RainViewer,
     con su media hora de extrapolación), y a partir de ahí la lluvia del
     modelo convertida a dBZ, hora a hora, 24 h. El sello dice en cada
     paso si es radar, extrapolación o previsión, y de qué modelo. */
  { id:'radarprev', g:'Lluvia', name:'Radar + previsión', v:'precipitation', unit:'dBZ', dbz:true, escala:'dbz', mixta:true,
    desc:'Hasta ahora, lo que ha caído (radar); después, lo que viene según el modelo (reflectividad estimada), en la misma tira' },

  { id:'sat_ir', g:'Satélite', name:'Nubes (infrarrojo)', v:null, unit:'', sat:'ir',
    desc:'Meteosat en infrarrojo — la nube que HAY, de día y de noche. Cuanto más blanco, más alto el tope: más potente la nube' },
  { id:'sat_conv', g:'Satélite', name:'Tormentas', v:null, unit:'', sat:'convection', sol:true,
    desc:'Meteosat, combinación para convección — distingue la nube que está creciendo. Solo sirve de día' },
  { id:'sat_vis', g:'Satélite', name:'Visible', v:null, unit:'', sat:'visible', sol:true,
    desc:'Meteosat en visible de alta resolución — la foto tal cual. Solo de día' },

  { id:'gusts',  g:'Torre', name:'Ráfagas', v:'wind_gusts_10m', unit:'km/h',
    escala:'rafagas',
    desc:'Racha máxima — la capa que decide el ascenso. El color cambia en TUS listones: naranja a los 45, rojo a los 60' },
  /* ── OJO CON ESTAS CUATRO: EL COLOR ES LA COMPONENTE, NO LA VELOCIDAD
     Medido el 31-08-2026 contra el catálogo del servicio de teselas: NO
     publica `wind_speed_*` — solo `wind_u_component_*` y `wind_v_component_*`
     (y `wind_gusts_10m`, que sí es velocidad). La librería pinta UNA
     variable por capa, así que el fondo de color es la componente
     oeste→este CON SIGNO: con viento del sur o del este sale «calma» de
     color aunque esté soplando.

     LAS BARBAS Y LOS NÚMEROS SÍ SON BUENOS: `componentes()` lee U y V y
     calcula el módulo de verdad. Así que la capa NO se retira —las barbas
     son lo que él mira para saber de dónde viene— pero el rótulo dice lo
     que es, y para la fuerza está «Ráfagas», que es velocidad medida y
     además es SU dato (su listón está en km/h de racha). */
  { id:'wind10', g:'Torre', arrows:true, name:'Viento 10 m · barbas', v:'wind_u_component_10m', unit:'km/h',
    desc:'BARBAS y números = viento real (módulo de U y V). El COLOR de fondo es solo la componente oeste-este: para la fuerza, mira Ráfagas' },
  { id:'wind20', g:'Torre', arrows:true, name:'Viento 20 m · barbas', v:'wind_u_component_20m', unit:'km/h',
    desc:'Altura baja de torre — nativo en AROME. BARBAS y números = viento real; el color de fondo es solo la componente oeste-este' },
  { id:'wind50', g:'Torre', arrows:true, name:'Viento 50 m · barbas', v:'wind_u_component_50m', unit:'km/h',
    desc:'Altura típica de torre — nativo en AROME. BARBAS y números = viento real; el color de fondo es solo la componente oeste-este' },
  { id:'wind100', g:'Torre', arrows:true, name:'Viento 100 m · barbas', v:'wind_u_component_100m', unit:'km/h',
    desc:'Torre alta. BARBAS y números = viento real; el color de fondo es solo la componente oeste-este' },

  { id:'cape', g:'Tormenta', name:'CAPE', v:'cape', unit:'J/kg', escala:'capeE',
    /* MEDIDO el 25-08-2026 contra AguaceroWx: NO es el mismo número.
       Ellos pintan MUCAPE (la burbuja más inestable de toda la columna)
       y aquí sale el de superficie, que es el único que publica
       Open-Meteo. Para GFS en Bilbao mañana a las 17:00: 510 aquí, 915
       allí. El de ellos es siempre mayor o igual, por definición. */
    desc:'Energía convectiva de SUPERFICIE: potencial de tormenta, no descargas. '
       + 'AguaceroWx pinta el "más inestable" (MUCAPE), que sale más alto: no es fallo, es otra burbuja' },
  { id:'cin',  g:'Tormenta', name:'Inhibición', v:'convective_inhibition', unit:'J/kg', escala:'tapa',
    /* El color va AL REVÉS que en las demás capas y hay que decirlo, o el
       mapa engaña: visto en producción el 01-09-2026 a las 23:00, toda la
       cornisa salía en ROJO porque la tapa era 0 — y rojo se lee como
       «peligro» de un vistazo. Sin CAPE, una tapa de cero no es nada:
       no hay nada que destapar. Las dos se miran juntas o no se miran. */
    desc:'ROJO es tapa CERO (nada frena la tormenta) y AZUL es tapa fuerte: al revés que las demás capas. '
       + 'Y OJO: tapa 0 sin CAPE no significa nada — mira las dos juntas. '
       + 'La "tapa" que impide que rompa la tormenta. MEDIDO: aquí sale en POSITIVO (150 = tapa fuerte). '
       + 'En AguaceroWx y otros visores lo verás en negativo (−150): es la misma cosa con el signo cambiado. '
       /* MEDIDO el 27-08-2026, GFS 0,25° a las 17:00, tapa de superficie nuestra
          contra el MUCIN de AguaceroWx: Bilbao 20/91, Donostia 62/79, Tolosa
          62/55, Durango 7/12, Santander 24/26. CUATRO DE CINCO al revés de lo
          que decía antes este texto («su MUCIN SIEMPRE tiene menos tapa»).
          Con el CAPE sí hay regla —MUCAPE ≥ el de superficie por definición—,
          pero con la tapa NO: la burbuja más inestable puede estar elevada y
          llevar encima más aire que atravesar. Decirle que allí siempre verá
          menos tapa le empujaba a descontar la tapa que ve, que es el lado
          imprudente. */
       + 'Y ojo, su MUCIN es de otra burbuja, la más inestable, y puede tener MÁS o MENOS tapa que ésta según a qué altura esté: '
       + 'medido con GFS, el 26-08 en Bilbao 119 aquí y 58 allí, y el 27-08 en el mismo sitio 20 aquí y 91 allí. '
       + 'Aquí no hay regla como con el CAPE: mira de qué burbuja habla cada uno' },
  { id:'cct',  g:'Tormenta', name:'Tope convectivo', v:'convective_cloud_top', unit:'m', minValido:0, escala:'topecv',
    desc:'Altura a la que llega el tope de la nube de tormenta. Cuanto más alto, más potente' },
  { id:'ccb',  g:'Tormenta', name:'Base convectiva', v:'convective_cloud_base', unit:'m', minValido:0, escala:'basecv',
    desc:'Altura a la que EMPIEZA la nube de tormenta. Compárala con la cota del emplazamiento: si la base baja de esa altura, la torre está dentro de la nube' },
  { id:'frz',  g:'Tormenta', name:'Isocero', v:'freezing_level_height', unit:'m',
    desc:'Altura de la cota de 0 °C — por debajo, riesgo de hielo en la estructura' },
  { id:'li',   g:'Tormenta', name:'Índice de elevación', v:'lifted_index', unit:'°C', escala:'elevacion',
    desc:'Lifted Index, en °C. NEGATIVO es malo: de −2 a −5 tormentas probables, '
       + 'por debajo de −5 tormenta fuerte. Positivo, aire estable' },
  { id:'gh500', densa:true, g:'Tormenta', name:'Geopotencial 500', v:'geopotential_height_500hPa', unit:'m', contours:true,
    desc:'Configuración sinóptica en altura' },

  { id:'clouds_rain', g:'Cielo', name:'Nubes + lluvia', v:'cloud_cover', unit:'%',
    encima:'precipitation',
    desc:'Nubosidad en gris y, encima, dónde puede llover — sin taparse' },
  { id:'clouds',      g:'Cielo', name:'Nubes total', v:'cloud_cover', unit:'%', desc:'Nubosidad total' },
  { id:'clouds_low',  g:'Cielo', name:'Nubes bajas', v:'cloud_cover_low', unit:'%',
    desc:'Las que te dejan sin ver la torre' },
  { id:'clouds_mid',  g:'Cielo', name:'Nubes medias', v:'cloud_cover_mid', unit:'%', desc:'Nubosidad media' },
  { id:'clouds_high', g:'Cielo', name:'Nubes altas', v:'cloud_cover_high', unit:'%', desc:'Nubosidad alta' },
  { id:'vis', g:'Cielo', name:'Visibilidad', v:'visibility', unit:'m', escala:'visibilidad',
    desc:'Visibilidad horizontal. Si no se ve la torre desde abajo, no se sube' },
  { id:'swr', densa:true, g:'Cielo', name:'Radiación solar', v:'shortwave_radiation', unit:'W/m²',
    desc:'Radiación de onda corta en superficie' },

  { id:'temp', densa:true, temp:true, g:'Aire', name:'Temperatura 2 m', v:'temperature_2m', unit:'°C', escala:'tempc',
    desc:'La temperatura del aire, la de siempre. Medida a 2 m del suelo' },
  { id:'t850', densa:true, temp:true, g:'Aire', name:'Temp. 850 hPa', v:'temperature_850hPa', unit:'°C', escala:'t850',
    desc:'Masa de aire a ~1500 m' },
  // 'Sensación térmica' (apparent_temperature) se ha retirado: NINGÚN modelo
  // la publica en el servicio de teselas, así que la capa daba error en
  // todas. La sensación con viento sigue estando en la pestaña Torre, que
  // usa la API de puntos, donde sí existe.
  { id:'dew', densa:true, temp:true,  g:'Aire', name:'Punto de rocío', v:'dew_point_2m', unit:'°C',
    desc:'Si se acerca a la temperatura, hay niebla o rocío sobre la estructura: resbala' },
  { id:'rh', densa:true,   g:'Aire', name:'Humedad', v:'relative_humidity_2m', unit:'%', escala:'humedad',
    desc:'Humedad relativa. Cerca del 100 % hay niebla o rocío: la estructura resbala' },
  { id:'pres', densa:true, g:'Aire', name:'Presión', v:'pressure_msl', unit:'hPa', contours:true, escala:'presion', desc:'Presión al nivel del mar' },
  { id:'tcwv', densa:true, g:'Aire', name:'Agua precipitable', v:'total_column_integrated_water_vapour', unit:'kg/m²',
    desc:'Vapor de agua en toda la columna' },
  { id:'surft', densa:true, temp:true, g:'Aire', name:'Temp. del suelo', v:'surface_temperature', unit:'°C',
    desc:'Temperatura del suelo y del mar' },

];

const BASEMAPS = [
  { id:'claro',  name:'Claro',  url:'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id:'color',  name:'Color',  url:'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  { id:'oscuro', name:'Oscuro', url:'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
];



/* ── Reflectividad estimada ─────────────────────────────────────────
   Ningún modelo publica reflectividad de radar. Lo que sí se puede es
   convertir la lluvia prevista a dBZ con la relación de Marshall-Palmer,
   que es la que usan los radares meteorológicos:

        Z = 200 · R^1.6        dBZ = 10 · log10(Z)

   Es la misma cuenta que hace cualquier visor que ofrezca "precipitación
   tipo reflectividad". Se etiqueta SIEMPRE como estimada: no es un eco
   de radar medido, es lluvia del modelo traducida a la escala de dBZ.
   Para reflectividad medida de verdad está la capa «Radar observado».  */

/* Escala de reflectividad, VERDE desde el principio.
   
   Se probó primero la tabla NEXRAD, que pinta de azul y cian los ecos
   flojos (5-15 dBZ). Sobre un mapa con el mar en azul eso no se
   distingue: la lluvia suave se confunde con el agua. Y además no es lo
   que se ve en AguaceroWx ni en la otra app que se usa a diario, donde
   el verde arranca abajo del todo.

   Que coincida importa de verdad: si el mismo chubasco sale de un color
   distinto en cada visor, se lee mal la intensidad.

   Referencia:  verde 5-30 · verde-amarillo 35 · amarillo 40
                naranja 45-50 · rojo 55 · granate y morado 60+          */
const DBZ = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 75];
const DBZ_COLORES = ['#a8e6a0','#a8e6a0','#7ad46a','#4cc23c','#22a83a','#12903a',
                     '#1a7a3a','#c8d13a','#f2e12a','#f5a72a','#ea5a2a','#d4232f',
                     '#a01a52','#7b2a8c','#b06fd0'];

const hexRGBA = (c, a = 1) => {
  const n = c.replace('#','');
  return [parseInt(n.slice(0,2),16), parseInt(n.slice(2,4),16), parseInt(n.slice(4,6),16), a];
};

/** mm/h que corresponden a cada dBZ según Marshall-Palmer. */
const mmDeDbz = dbz => dbz <= 0 ? 0 : Math.pow(Math.pow(10, dbz / 10) / 200, 1 / 1.6);

/* El primer tramo va con alfa 0. Sin eso la capa pintaba TODO el mapa
   opaco, incluso donde no llueve, y parecía que el mapa no funcionaba. */
/* Marca propia para pedir la escala de dBZ. Va en la URL para que cada
   capa tenga su propia entrada de caché en MapLibre, y se retira antes de
   entregarle la URL a la librería, que no la entiende. */
const MARCA = 'escala_propia';
/* [a-z0-9], no [a-z]: la escala «t850» fue la PRIMERA con dígitos y los
   dos regex solo admitían letras — `marcaDe` devolvía "t" y `limpiarMarca`
   dejaba `interpolation=linear850`, así que la capa T850 se quedaba sin su
   escala nueva (y con la URL rota). Reproducido en node el 31-08-2026. */
const limpiarMarca = u => u.replace(new RegExp(`[&?]${MARCA}=[a-z0-9]+`), '');

/* IDs REALES de TMODELS: los tres globales llevaban nombres inventados
   (gfs_global, gfs025, icon_global) y el cartel «es de los que más tardan»
   no salía nunca para ellos — con ICON global medido en más de 30 s. */
const LENTOS = new Set(['ecmwf_ifs', 'ecmwf_ifs025', 'ncep_gfs013', 'ncep_gfs025', 'dwd_icon']);

/* Rangos de cordura por capa. No es meteorología fina: es cazar que la
   UNIDAD de la tesela haya cambiado por debajo, que ya ha pasado dos
   veces (presión y visibilidad). Fuera de estos márgenes el número no
   puede ser bueno, y más vale decirlo que pintarlo. */
const RANGOS = {
  pres:  [850, 1085, 'hPa'],
  temp:  [-60, 60, '°C'],
  t850: [-60, 45, '°C'],   // a 1500 m nunca se sale de ahí en la Tierra
  dew:   [-60, 45, '°C'],
  rh:    [0, 100, '%'],
  vis:   [0, 100, 'km'],
  gusts: [0, 400, 'km/h'],
};
/** Devuelve el aviso para la barra de estado, o null si el número es creíble. */
function fueraDeRango(L_, valor) {
  const r = RANGOS[L_?.id];
  if (!r || !Number.isFinite(valor)) return null;
  const [min, max, u] = r;
  if (valor >= min && valor <= max) return null;
  return `OJO: ${L_.name} da ${valor.toFixed(1)} ${u}, que es imposible. `
       + `La fuente ha debido de cambiar la unidad: NO te fíes de esta capa hasta revisarla.`;
}
const marcaDe = u => u.match(new RegExp(`${MARCA}=([a-z0-9]+)`))?.[1] ?? null;

const ESCALA_DBZ = {
  type: 'breakpoint',
  unit: 'dBZ',
  breakpoints: DBZ.map(mmDeDbz),
  colors: DBZ_COLORES.map((c, i) => hexRGBA(c, i === 0 ? 0 : 1)),
};


/* ── Reflectividad estimada ─────────────────────────────────────────
   Ningún modelo publica reflectividad de radar. Lo que sí se puede es
   convertir la lluvia prevista a dBZ con la relación de Marshall-Palmer,
   que es la que usan los radares meteorológicos:

        Z = 200 · R^1.6        dBZ = 10 · log10(Z)

   Es la misma cuenta que hace cualquier visor que ofrezca "precipitación
   tipo reflectividad". Se etiqueta SIEMPRE como estimada: no es un eco
   de radar medido, es lluvia del modelo traducida a la escala de dBZ.
   Para reflectividad medida de verdad está la capa «Radar observado».  */



/* ── Quitar el fondo del compuesto de AEMET ──────────────────────────
   MEDIDO sobre radw202608212300_3857.png (962x1079, paleta de 9 colores):

     índice 0  blanco             alfa   0   ·  20,1 % de la imagen
     índice 1  gris azulado claro alfa 178   ·  79,8 %   ← el fondo
     índices 2-8  eco de lluvia   alfa 178   ·   0,07 %

   Es decir: cuatro quintas partes del PNG son un fondo semiopaco que
   tapa el mapa, y el eco de verdad son unos pocos píxeles. Tal cual
   viene, la capa parece rota. Aquí se deja ese fondo en transparente y
   se conserva el eco intacto: no se cambia ni un color de la lluvia,
   solo se quita lo que no es dato.                                   */

const FONDO_AEMET = [
  [239, 242, 249],   // el fondo medido
  [255, 255, 255],   // blanco, por si cambian la paleta
];

async function limpiarRadarAemet(url, señal) {
  const r = await fetch(url, { signal: señal });
  if (!r.ok) throw new Error(`AEMET respondió ${r.status}`);
  const blob = await r.blob();
  const img = await createImageBitmap(blob);

  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  img.close?.();

  const d = cx.getImageData(0, 0, c.width, c.height);
  const px = d.data;
  let eco = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const esFondo = FONDO_AEMET.some(([R, G, B]) =>
      Math.abs(px[i] - R) < 9 && Math.abs(px[i+1] - G) < 9 && Math.abs(px[i+2] - B) < 9);
    if (esFondo) px[i + 3] = 0;
    else { px[i + 3] = 255; eco++; }   // el eco, a plena opacidad: es el dato
  }
  cx.putImageData(d, 0, 0);
  return { url: c.toDataURL('image/png'), eco, total: c.width * c.height };
}


/* ── Radar oficial de AEMET ──────────────────────────────────────────
   AEMET publica el compuesto nacional como imagen PNG ya proyectada en
   Web Mercator, una cada 10 minutos, con estos límites geográficos fijos.
   Se superpone directamente sobre el mapa: es observación real de radar
   español, no una estimación a partir del modelo.

   Fuente: AEMET · https://www.aemet.es                                */

const AEMET_RADAR = {
  base: 'https://www.aemet.es/es/api-eltiempo/radar/imagen-radar/compo/',
  // Esquina suroeste y noreste de la imagen (las publica la propia AEMET)
  bounds: [[-16.08, 27.22], [12.14, 51.30]],
  /** Por dónde se pide la imagen.
   *
   *  aemet.es NO manda cabecera CORS, así que el navegador puede
   *  enseñar la imagen pero no leer sus píxeles. Y hay que leerlos: el
   *  PNG trae un fondo gris azulado al 70 % de opacidad que ocupa el
   *  80 % de la imagen y tapa el mapa entero. Publicada, la app la pide
   *  por su propio intermediario, que sí da permiso.                */
  via(fichero) {
    /* Antes, en localhost/127.0.0.1 se pedía DIRECTO a aemet.es, y como
       aemet.es no manda CORS el navegador no deja leer los píxeles:
       «Radar AEMET no disponible (Failed to fetch)» en la app del Mac
       (127.0.0.1:8767) el 10-09-2026 a las 11:02 y a las 19:05, con el
       servidor de Vercel contestando en 0,2 s. Ahora, siempre que la app
       venga de un servidor (http/https), va por su intermediario:
       en el Mac lo reenvía servir.js a Vercel, en Pages BACKEND es Vercel
       y en Vercel es el propio origen. Directo solo si se abre como
       fichero (file://), que es donde no hay intermediario posible. */
    const conServidor = location.protocol === 'https:' || location.protocol === 'http:';
    return conServidor ? `${typeof BACKEND !== 'undefined' ? BACKEND : location.origin}/radar-aemet?f=${fichero}`
                       : this.base + fichero;
  },

  /** Nombres de los últimos N fotogramas, de más antiguo a más reciente. */
  ficheros(n = 8) {
    const p = v => String(v).padStart(2, '0');
    const base = Math.floor(Date.now() / 600000) * 600000;
    const out = [];
    // MEDIDO (22 ago 2026, 20:05Z): AEMET publica con unos 20 MINUTOS de
    // retraso, no 10. Los dos fotogramas más recientes daban 404 y el
    // último de la tira salía siempre en blanco. Se saltan los dos.
    for (let i = n + 1; i >= 2; i--) {
      const d = new Date(base - i * 600000);
      const nombre = `radw${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}`
                   + `${p(d.getUTCHours())}${p(d.getUTCMinutes())}_3857.png`;
      out.push({ t: d.getTime(), nombre, url: this.via(nombre) });
    }
    return out;
  },
};


/* ── Barbas de viento ────────────────────────────────────────────────
   La librería acepta el parámetro `arrows` pero NO dibuja nada: se
   comprobó pidiendo la misma tesela con y sin él y salen idénticas
   byte a byte. Así que las barbas se dibujan aquí, con las componentes
   U y V reales del modelo leídas punto a punto.

   Convención meteorológica estándar, en nudos:
     media barba =  5 kt      barba entera = 10 kt      banderola = 50 kt
   La barba apunta en la dirección DE DONDE VIENE el viento.           */

const KT_POR_MS = 1.943844;

/** ¿Es un valor real o la marca de "sin dato" del modelo?
 *
 *  Algunas variables (tope y base de nube convectiva) traen −500 cuando
 *  NO hay nube convectiva. Mostrar −500 m como si fuera una altura sería
 *  inventarse un dato: aquí se descarta y se dice que no hay. */
const valorReal = (v, L_) => {
  if (v === null || v === undefined || Number.isNaN(v)) return false;
  if (L_?.minValido !== undefined && v < L_.minValido) return false;
  if (v <= -400) return false;          // centinela habitual
  return true;
};

/** Dibuja una barba para una velocidad dada en nudos. */
function svgBarba(kt, gradosDesde) {
  const L = 30;                       // largo del asta
  const x = 22, y0 = 22 - L / 2, y1 = 22 + L / 2;
  let e = [`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`];

  if (kt < 3) {                       // calma: circulito
    return `<g stroke="#111" stroke-width="1.6" fill="none">
      <circle cx="${x}" cy="22" r="4"/></g>`;
  }

  let resto = Math.round(kt / 5) * 5; // se redondea a 5 kt, como en los mapas
  let pos = y0;                       // las plumas van en el extremo superior
  const paso = 4.4;

  const banderolas = Math.floor(resto / 50); resto -= banderolas * 50;
  const enteras   = Math.floor(resto / 10); resto -= enteras * 10;
  const medias    = resto >= 5 ? 1 : 0;

  for (let i = 0; i < banderolas; i++) {
    e.push(`<polygon points="${x},${pos} ${x},${pos+7} ${x+11},${pos+3.5}" fill="#111"/>`);
    pos += 9;
  }
  for (let i = 0; i < enteras; i++) {
    e.push(`<line x1="${x}" y1="${pos}" x2="${x+11}" y2="${pos-4}"/>`);
    pos += paso;
  }
  if (medias) {
    e.push(`<line x1="${x}" y1="${pos}" x2="${x+6}" y2="${pos-2.4}"/>`);
  }
  return `<g stroke="#111" stroke-width="1.7" stroke-linecap="round" fill="none"
           transform="rotate(${gradosDesde} ${x} 22)">${e.join('')}</g>`;
}

/* ── Control de peticiones de teselas ────────────────────────────────
   MEDIDO (21 ago 2026): a zoom amplio MapLibre pide cientos de teselas a
   la vez. Cada una abre un fichero .om de unos 42 MB, así que salen
   cientos de peticiones simultáneas y el servidor responde 429 (Too Many
   Requests). MapLibre deja esas teselas EN BLANCO y no dice nada.

   Consecuencia real, comprobada contra AguaceroWx y ECMWF: la borrasca
   del Atlántico (4,6 mm/h medidos en la propia tesela) NO se pintaba.
   En pantalla, "el servidor no me lo ha servido" se veía igual que
   "aquí no llueve". Para decidir si alguien sube a una torre eso no
   puede pasar.

   Por eso: se limita cuántas van a la vez, se reintenta con espera
   creciente, y lo que aun así falle SE AVISA en pantalla.            */
const Peticiones = {
  /* CUÁNTAS TESELAS SE DESCODIFICAN A LA VEZ.
     Es lo que marca si el mapa va fluido o a tirones, y también lo que
     puede dejarlo en blanco. Historia medida:

     · 23-08-2026: con 4 a la vez el WebAssembly reventaba con
       Aborted(OOM) encadenando capas, y a partir de ahí el mapa NO
       volvía a pintar NI UNA tesela. Se bajó a 2.
     · Pero bajar de 4 a 2 NO arregló el OOM por sí solo (7 abortos
       igual). La causa real era otra: la librería guardaba los bloques
       descomprimidos y nadie los vaciaba. Eso se arregló con
       `clearBlockCache()` al cambiar de capa o de modelo.

     O sea que el 2 era una precaución tomada contra la causa equivocada,
     y desde entonces se está pagando en lentitud sin necesidad. ECMWF
     HRES tarda ~40 s en pintar el punto de rocío (medido el 24-08-2026),
     y de esa espera buena parte es la cola de dos en dos.

     Se sube a 3. Pero NO a ciegas: si alguna vez vuelve a faltar
     memoria, `avisoSinMemoria()` baja este número y lo recuerda, así que
     el que lo sufra una vez no lo vuelve a sufrir. Rápido por defecto,
     prudente en cuanto haya un motivo real.

     Aitor decide con esto si manda gente a una torre: más vale un mapa
     un poco más lento que un mapa en blanco. Por eso la marcha atrás es
     automática y permanente, no un ajuste que haya que tocar.        */
  max: (() => {
    try {
      const g = +localStorage.getItem('torre.teselasALaVez');
      if (g >= 1 && g <= 4) {
        /* ── EL CASTIGO CADUCA ──────────────────────────────────────
           Cazado el 31-08-2026: sus OOM del sábado le dejaron esto en 1
           PARA SIEMPRE, y con 1 cada capa carga los cuadros de uno en
           uno — 48 segundos mirando un mapa vacío, «tomo un café para
           esperar, poco profesional». Un castigo sin caducidad convierte
           un mal día en una app lenta de por vida.

           Ahora: si el último corte de memoria fue hace más de 24 h, se
           recupera UN punto por arranque, con techo en 2 — el 3 se probó
           en su máquina el 25-08 y provocó OOM a los dos minutos, así
           que ahí no se vuelve solo. */
        const cuando = +localStorage.getItem('torre.oomCuando') || 0;
        /* ── Y EL CASTIGO DEL 30-08 SE LEVANTA YA, UNA VEZ ────────────
           Su pregunta del 31-08: «hace 1 semana los mapas iban de cine,
           ¿por qué ahora como una patata?». Respuesta con fecha: el
           sábado el OOM de ECMWF HRES lo dejó en 1 PARA SIEMPRE. La
           causa ya no existe —el mapa arranca en ICON-EU y se cambia
           solo si HRES lo tumba—, así que esperarse 24 h a recuperar
           era castigarle un día más por un problema ya resuelto. Se
           sube a 2 una única vez; si volviera a faltar memoria, la
           marcha atrás sigue ahí y vuelve a bajar. */
        if (g === 1 && !localStorage.getItem('torre.castigoLevantado')) {
          localStorage.setItem('torre.castigoLevantado', '1');
          localStorage.setItem('torre.teselasALaVez', '2');
          return 2;
        }
        if (g < 2 && Date.now() - cuando > 24 * 3600e3) {
          const mas = g + 1;
          localStorage.setItem('torre.teselasALaVez', String(mas));
          return mas;
        }
        return g;
      }
    } catch { /* sin localStorage: el valor de siempre */ }
    // PROBADO EN SU MÁQUINA el 25-08-2026 y REVERTIDO: se subió a 3
    // razonando que el OOM no era culpa de la concurrencia (el 23-08
    // bajar de 4 a 2 no lo había arreglado). A los dos minutos de
    // publicarlo, con punto de rocío y ECMWF HRES, su mapa se quedó sin
    // memoria y se recargó solo. O sea que la concurrencia SÍ influye,
    // aunque no fuera la causa única. Vuelve a 2.
    //
    // Lo que SÍ se queda es la marcha atrás automática de abajo: aquel
    // día hizo su trabajo —detectó, bajó el número, recargó sola y se lo
    // dijo dejándolo en la misma capa y la misma hora—. Sin ella se
    // habría quedado con el mapa muerto y sin enterarse.
    //
    // Si alguien vuelve a intentar subirlo: hay que medirlo EN SU
    // MÁQUINA con el mapa a la vista, no razonarlo. Desde un panel
    // oculto no se piden teselas y la prueba no mide nada.
    return 2;
  })(),
  enCurso: 0,
  espera: [],
  fallos: 0,
  servidas: 0,
  onCambio: null,

  turno() {
    if (this.enCurso < this.max) { this.enCurso++; return Promise.resolve(); }
    return new Promise(r => this.espera.push(r));
  },
  libera() {
    const siguiente = this.espera.shift();
    if (siguiente) siguiente();      // le cede el hueco; enCurso no baja
    else this.enCurso--;
  },

  /** Ejecuta fn con reintentos. No reintenta si se ha abortado a
   *  propósito (cambio de hora o de capa): eso no es un fallo. */
  async conReintento(fn, ac, intentos = 3) {
    await this.turno();
    try {
      for (let i = 0; i < intentos; i++) {
        if (ac?.signal?.aborted) throw new Error('abortada');
        try {
          const r = await fn();
          this.servidas++;
          return r;
        } catch (e) {
          if (ac?.signal?.aborted) throw e;            // abortada: no cuenta
          if (i === intentos - 1) {
            this.fallos++;
            this.onCambio?.(this.fallos, this.servidas);
            throw e;
          }
          await new Promise(r => setTimeout(r, 500 * (i + 1) * (i + 1)));
        }
      }
    } finally { this.libera(); }
  },

  reset() { this.fallos = 0; this.servidas = 0; this.onCambio?.(0, 0); },
};



/* ── Escalas propias ─────────────────────────────────────────────────
   Se construyen cuando la librería ya está cargada, porque dos de ellas
   parten de la escala oficial.

   Por qué hacen falta (COMPROBADO en Bermeo, 21 ago 2026):

   · Presión — la tesela trae 101.895 (pascales) y la escala oficial va de
     940 a 1060 (hPa). Todo se salía de rango y la capa quedaba de un color
     plano, sin informar de nada.
   · Visibilidad — la librería le asigna la escala del geopotencial,
     4.600-6.000, y encima etiquetada en W/m². El valor real era 39.792 m.
     Mismo problema: color plano y unidad falsa.

   En ambos casos el mapa pintaba algo. Ese es justo el peligro: no daba
   error, daba un color equivocado.                                    */
let _escalas = null;
function escalasPropias() {
  if (_escalas) return _escalas;

  // Presión. OJO A LA UNIDAD, que ha cambiado por debajo:
  //
  //   · 21-08-2026: la tesela traía 101.895 → PASCALES. Se multiplicaron
  //     los cortes por 100 y se dividió el valor por 100 al leerlo.
  //   · 24-08-2026: la tesela trae 1.008 → hPa. Con la cuenta de antes,
  //     el mapa ponía «10 hPa» en TODAS las ciudades (1008/100 = 10,08) y
  //     salía de un violeta plano, porque 1.008 se cae por debajo del
  //     corte más bajo, que estaba en 94.000. Un número inventado en una
  //     capa de decisión es peor que no tener capa.
  //
  // Los cortes van ya en hPa, que es lo que llega hoy. Y para que no
  // vuelva a colarse en silencio, el valor que se ENSEÑA se adapta:
  // si viene con pinta de pascales (más de 10.000) se pasa a hPa. Si
  // encima el resultado se sale de lo posible en la Tierra (850-1085),
  // `presionRara()` lo canta en la barra de estado.
  const oficial = OMWeatherMapLayer.getColorScale('pressure_msl', false);
  const presion = {
    scale: { ...oficial },                    // cortes tal cual: hPa
    eje: oficial.breakpoints, unidad: 'hPa',
    conv: v => (v > 10000 ? v / 100 : v),     // pascales → hPa si hiciera falta
  };

  // Humedad. La escala oficial es casi transparente hasta el 85 % y sobre
  // el mapa claro no se veía NADA: Aitor la abrió el 24-08-2026 y solo
  // salían los números, sin color. Y lo que a él le importa no es
  // distinguir 40 de 50, es ver de un golpe dónde el aire está saturado,
  // que es donde hay niebla y rocío y la torre resbala. Por eso el color
  // arranca de verdad en el 70 y el 95-100 salta a la vista.
  const hm  = [0, 40, 55, 70, 80, 88, 94, 98, 101];
  const hc  = [['#7fc9b0',0], ['#7fc9b0',.10], ['#7fc9b0',.22], ['#63b8c9',.38],
               ['#4a9fd4',.55], ['#3f7fc8',.70], ['#3a5fbf',.85], ['#5b3fb0',1], ['#5b3fb0',1]];
  /* ── TEMPERATURA CON EL ROJO DONDE QUEMA ────────────────────────────
     Suyo, 31-08-2026, con la ola del viernes en pantalla y Windy al
     lado: *«el color del mapa tristón comparado con Meteored y Windy,
     pálido»* · *«debería estar en rojo con esas altas temperaturas»*.

     Y es que la escala de fábrica va de −80 a +50: un rango para el
     planeta entero, donde los 17 grados que separan un día suave (24°)
     de una ola seria (41°) caben en un palmo de amarillo. Windy comprime
     su escala al rango que se vive aquí, y por eso su 41 GRITA.

     Esta va de −20 a +46, que cubre todo lo que ha pasado y pasará en
     Euskadi (y en Calpe, y en Gijón), con los cortes pegados a lo que
     decide: 30 naranja, 34 rojo, 38 granate, 42+ morado — los colores
     de «día de aires acondicionados sufriendo en las casetas». */
  const tpm = [-20, -10, 0, 5, 10, 15, 20, 25, 30, 34, 38, 42, 46];
  const tpc = [['#4b1e8f',1], ['#2447d6',1], ['#1f8fe8',1], ['#2fc9b8',1],
               ['#2fb84a',1], ['#8fd026',1], ['#f5d800',1], ['#ff9d00',1],
               ['#f95c00',1], ['#e11400',1], ['#a80016',1], ['#700024',1],
               ['#3f001f',1]];
  /* ── RÁFAGAS: LA CAPA QUE DECIDE, CON SUS LISTONES DENTRO ──────────
     Suyo, 01-09-2026: *«los colores de los mapas hay que mejorarlos sí o
     sí: más contraste y más vivos»*, comparando con AguaceroWx, Meteored
     y Windy. Y esta capa iba con la escala de fábrica de la librería,
     que es la más pálida de todas — siendo **la capa con la que decide
     si sube alguien a una torre**.

     Pero lo importante no es que sea más viva: es que **el color cambia
     donde le cambia a él la decisión**. Ninguna app del mundo puede hacer
     esto, porque ninguna sabe cuáles son sus límites:

         hasta 25 .... azules y verdes, ahí no pasa nada
         25-45 ....... amarillos, se nota pero se trabaja
         **45** ...... NARANJA FUERTE — su listón de aviso
         **60** ...... ROJO — su tope: por encima, no se sube
         75-100+ ..... granate y morado, temporal de verdad

     Así, de un vistazo y sin leer un número, ve dónde se le pasa el
     límite. Los cortes de 45 y 60 salen de SUS umbrales, no de una escala
     de manual. */
  const rfm = [0, 10, 20, 30, 40, 45, 52, 60, 70, 85, 100, 120];
  const rfc = [['#1a3a6b',1], ['#1f6fd0',1], ['#20a8d8',1], ['#2fc9a0',1],
               ['#8fd026',1], ['#ff9d00',1], ['#f95c00',1], ['#e11400',1],
               ['#b0000f',1], ['#7a0020',1], ['#4f0033',1], ['#2b0040',1]];
  const rafagas = {
    scale: { type:'breakpoint', unit:'km/h', breakpoints: rfm,
             colors: rfc.map(([c,a2]) => hexRGBA(c, a2)) },
    eje: rfm, unidad: 'km/h', pos: rfm.map((_, i) => i),
  };

  /* ── CAPE: LA GASOLINA, CON LOS CORTES QUE ÉL USA ──────────────────
     La segunda de las tres con las que decide, y también iba con la
     escala de fábrica. Los cortes NO son de manual, son los suyos y los
     que este proyecto tiene medidos:

         300 ..... su `capeWarn`: a partir de ahí ya se mira
         700 ..... el listón de la COMBINACIÓN (`CAPE_COMBINACION`), el
                   calibrado el 24-08 con Lekeitio y Durango
         1000 .... su `capeNo`
         2000 .... «seria» en la chuleta de la Guía
         3000+ ... lo de Manila de esta tarde

     Por debajo de 300 va en azules apagados a propósito: ahí no hay nada
     que mirar y no tiene que llamarle la atención. El salto de color
     gordo está en el 700, que es donde empieza a importar de verdad. */
  const cpm = [0, 100, 200, 300, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000];
  const cpc = [['#101c33',1], ['#16345c',1], ['#1d5a94',1], ['#2f9bd0',1],
               ['#35c9a8',1], ['#f5d800',1], ['#ff9d00',1], ['#f95c00',1],
               ['#e11400',1], ['#a80016',1], ['#700024',1], ['#42003a',1]];
  const capeE = {
    scale: { type:'breakpoint', unit:'J/kg', breakpoints: cpm,
             colors: cpc.map(([c,a2]) => hexRGBA(c, a2)) },
    eje: cpm, unidad: 'J/kg', pos: cpm.map((_, i) => i),
  };

  /* ── LA TAPA: LOS COLORES DICEN LO MISMO QUE LAS PALABRAS ──────────
     La tercera pata del rayo, y la más traicionera de leer: **aquí lo
     BAJO es lo malo**, al revés que todas las demás. Una tapa de 5 con
     CAPE alto es una tormenta esperando; una de 200 es el día tranquilo.

     Así que los cortes son exactamente los de `textoTapa()` en app.js
     —la escala que él ya lee en palabras— para que el mapa y el texto
     digan lo mismo:

         <25 ...... «abierta»  → ROJO: si hay gasolina, rompe
         25-50 .... «floja»    → naranja
         50-75 .... el listón de la combinación (CAPE≥700 y tapa<75)
         75-200 ... «aguanta»  → verdes
         >200 ..... «fuerte»   → azules: puesta de verdad

     Es la única capa donde el rojo está en los números pequeños, y por
     eso el pie de la capa lo dice con todas las letras. */
  const cnm = [0, 10, 25, 50, 75, 100, 150, 200, 300, 500];
  const cnc = [['#e11400',1], ['#f95c00',1], ['#ff9d00',1], ['#f5d800',1],
               ['#c8d400',1], ['#8fd026',1], ['#2fb84a',1], ['#2fc9b8',1],
               ['#2080d8',1], ['#25378f',1]];
  const tapa = {
    scale: { type:'breakpoint', unit:'J/kg', breakpoints: cnm,
             colors: cnc.map(([c,a2]) => hexRGBA(c, a2)) },
    eje: cnm, unidad: 'J/kg', pos: cnm.map((_, i) => i),
  };

  const tempc = {
    scale: { type:'breakpoint', unit:'°C', breakpoints: tpm,
             colors: tpc.map(([c,a]) => hexRGBA(c, a)) },
    eje: tpm.slice(0, -1), unidad: '°C', pos: tpm.slice(0, -1).map((_, i) => i),
  };

  /* ── T850: LA CAPA DE LAS MASAS DE AIRE, CON SUS COLORES ────────────
     Suyo, 31-08-2026, con Meteored al lado: *«en temperatura 850 quisiera
     ver los cambios de verde a rojo como en los demás mapas; ahí se
     aprecia que viene calima de África, aire caliente. En nuestro mapa no
     se nota nada, entonces esa capa no pinta nada — con toda la
     importancia que tiene para los cambios de temperatura»*.

     Y es exactamente para lo que existe esta capa: el aire a ~1500 m es
     la MASA, sin el suelo por medio — el verde→rojo ES el frente, la
     advección africana, el cambio de tiempo. El rango útil aquí va de
     −15 a +30; con la escala planetaria quedaba un amarillo plano.
     Cortes al uso de los mapas de masas: 18 naranja (cálida), 22 rojo
     (africana), 25+ granate (la ola del viernes daba 26). */
  const t8m = [-15, -10, -5, 0, 5, 10, 14, 18, 22, 25, 28, 31];
  const t8c = [['#4b1e8f',1], ['#2447d6',1], ['#1f8fe8',1], ['#2fc9b8',1],
               ['#2fb84a',1], ['#8fd026',1], ['#f5d800',1], ['#ff9d00',1],
               ['#f24e00',1], ['#d40b10',1], ['#8e0020',1], ['#4d0028',1]];
  const t850 = {
    scale: { type:'breakpoint', unit:'°C', breakpoints: t8m,
             colors: t8c.map(([c,a]) => hexRGBA(c, a)) },
    eje: t8m.slice(0, -1), unidad: '°C', pos: t8m.slice(0, -1).map((_, i) => i),
  };

  const humedad = {
    scale: { type:'breakpoint', unit:'%', breakpoints: hm,
             colors: hc.map(([c,a]) => hexRGBA(c, a)) },
    eje: hm.slice(0, -1), unidad: '%', pos: hm.slice(0, -1).map((_, i) => i),
  };

  // Visibilidad: escala pensada para trabajo en altura. Lo que importa no
  // es distinguir 30 de 40 km, es ver de un vistazo dónde no se ve la
  // torre. Por eso la niebla va en rojo y el aire limpio, transparente.
  const vm = [0, 200, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000];
  const vc = [['#7b1020',1], ['#c0203a',1], ['#e8552f',1], ['#f59b35',1],
              ['#ffd33d',.9], ['#dede4a',.75], ['#a8d96a',.5], ['#7fc9b0',.3],
              ['#7fc9b0',0], ['#7fc9b0',0]];
  const visibilidad = {
    scale: { type:'breakpoint', unit:'m', breakpoints: vm,
             colors: vc.map(([c,a]) => hexRGBA(c, a)) },
    eje: vm.map(v => v / 1000), unidad: 'km',
    conv: v => v / 1000,                      // metros → km
    pos: vm.map((_, i) => i),                 // por tramos, igual que la lluvia
  };

  // Lluvia en VERDE. La escala oficial de Open-Meteo arranca en azules
  // claros, y con el mar pintado de azul la lluvia floja se confunde con
  // el agua: en el mapa no se distingue si eso es un chubasco o es el
  // Cantábrico. Mismos cortes de intensidad, otros colores.
  const mm = [0, 0.1, 0.3, 0.6, 1, 2, 4, 7, 12, 20, 35, 60];
  const cc = [['#a8e6a0',0], ['#a8e6a0',.55], ['#7ad46a',.75], ['#4cc23c',.9],
              ['#22a83a',1], ['#12903a',1], ['#1a7a3a',1], ['#c8d13a',1],
              ['#f2e12a',1], ['#f5a72a',1], ['#d4232f',1], ['#7b2a8c',1]];
  const lluvia = {
    scale: { type:'breakpoint', unit:'mm/h', breakpoints: mm,
             colors: cc.map(([c,a]) => hexRGBA(c, a)) },
    eje: mm, unidad: 'mm/h',
    // Los saltos de lluvia no son regulares (0,1 · 0,3 · 1 · 4 · 20 · 60).
    // Repartidos en milímetros lineales, media barra se la comen los 60 mm
    // y los valores normales quedan amontonados a la izquierda, ilegibles.
    // Se reparten por tramos, que es como se lee una escala de lluvia.
    pos: mm.map((_, i) => i),
  };

  // Índice de elevación. La librería no conoce esta variable y le encaja
  // la escala de TEMPERATURA, de −80 a +50: con ese rango, toda la
  // península sale del mismo color y no se distingue un +7 (estable) de
  // un −2 (tormentas probables), que es justo la diferencia que importa.
  //
  // Aquí el peligro va hacia los NEGATIVOS, al revés que la temperatura:
  // lo estable no se pinta para no ensuciar el mapa, y el aviso sube por
  // amarillo, naranja, rojo y morado según se hunde el índice.
  const li = [-15, -8, -5, -2, 0, 4, 20];
  const lic = [['#7b2a8c',1], ['#d4232f',1], ['#ea5a2a',1], ['#f2e12a',1],
               ['#9fd7a8',.38], ['#9fd7a8',0], ['#9fd7a8',0]];
  const elevacion = {
    scale: { type:'breakpoint', unit:'°C', breakpoints: li,
             colors: lic.map(([c,a]) => hexRGBA(c, a)) },
    eje: li, unidad: '°C', pos: li.map((_, i) => i),
  };

  // Base convectiva. La escala oficial la pinta al revés de lo que
  // interesa aquí: la base BAJA (peligrosa, nube pegada al suelo) sale
  // con opacidad 0,15-0,6 y casi no se ve, mientras la base alta
  // (inofensiva) sale a todo color. Comprobado leyendo sus tramos.
  //
  // Invertido: lo bajo salta a la vista en rojo y lo alto desaparece.
  // MEDIDO en 12 puntos de la península: 8 devolvían −500. Es el
  // centinela de "aquí no hay nube convectiva". Los números ya lo
  // filtraban, pero el MAPA lo pintaba: sin este primer tramo
  // transparente, media España salía del color más alarmante justo
  // donde no hay ninguna tormenta.
  const bc  = [-9999, 0, 500, 1000, 1500, 2500, 4000, 9000];
  const bcc = [['#b3122b',0],                       // sin nube: no se pinta
               ['#b3122b',1], ['#e03a1f',.92], ['#f5872a',.82], ['#f2d02a',.6],
               ['#9fd7a8',.32], ['#9fd7a8',0], ['#9fd7a8',0]];
  const basecv = {
    scale: { type:'breakpoint', unit:'m', breakpoints: bc,
             colors: bcc.map(([c,a]) => hexRGBA(c, a)) },
    eje: bc.slice(1), desde: 1, unidad: 'm', pos: bc.slice(1).map((_, i) => i),
  };

  // Tope convectivo: aquí es al revés que la base. Cuanto MÁS ALTO llega
  // el tope, más potente es la tormenta. Sin nube, transparente.
  const tc  = [-9999, 0, 3000, 5000, 7000, 9000, 16000];
  const tcc = [['#9fd7a8',0],                       // sin nube: no se pinta
               ['#9fd7a8',.30], ['#f2d02a',.6], ['#f5872a',.8],
               ['#e03a1f',.9], ['#b3122b',1], ['#7b2a8c',1]];
  const topecv = {
    scale: { type:'breakpoint', unit:'m', breakpoints: tc,
             colors: tcc.map(([c,a]) => hexRGBA(c, a)) },
    eje: tc.slice(1), desde: 1, unidad: 'm', pos: tc.slice(1).map((_, i) => i),
  };

  _escalas = {
    basecv, topecv, humedad,
    elevacion,
    lluvia,
    // La tesela trae mm/h; lo que se lee es dBZ, así que se convierte con
    // la misma cuenta de Marshall-Palmer con la que está hecha la escala.
    dbz: { scale: ESCALA_DBZ, eje: DBZ, unidad: 'dBZ',
           conv: v => v > 0 ? 10 * Math.log10(200 * Math.pow(v, 1.6)) : 0 },
    presion, visibilidad, tempc, t850, rafagas, capeE, tapa,
  };
  return _escalas;
}


const Maps = {
  /* ── EL MAPA ARRANCA EN EL EUROPEO DE 9 km, COMO WINDY ─────────────
     Suyo, 02-09-2026: *«ponme el mapa como usa windy y vamos a lo seguro
     socio»* · *«windy utiliza el europeo de 9 km»* · *«me dicen los que
     revisan los mapas que para aquí ese es el mejor modelo»*.

     Y es el MISMO: `ecmwf_ifs` son los 9 km del HRES, los que pinta
     Windy. Por la API solo hay el de 25 km (comprobado ese día:
     `ecmwf_ifs025` 0,25°, `ecmwf_ifs04` 0,4°, los `aifs` de IA a 0,25°),
     así que **el de 9 km solo se puede ver aquí, en el mapa**.

     LO QUE HAY QUE SABER, Y ESTÁ MEDIDO: con HRES el mapa se queda sin
     memoria al QUINTO cambio de capa; con ICON-EU aguanta nueve (dos
     series limpias, 30-08-2026). Por eso arrancaba en ICON-EU.

     Se cambia igual porque lo que él pide es acertar, y porque la red de
     seguridad ya está puesta y probada en pantalla: sale el cartel, se
     recarga sola volviendo a la misma capa y hora, y a la tercera se
     planta y le manda a ICON-EU o AROME HD. O sea que el peor caso es
     una recarga, no un mapa en blanco callado.

     Si le molesta, se vuelve a `dwd_icon_eu` en esta misma línea. */
  /* ── Y LE MOLESTÓ ──────────────────────────────────────────────────
     Suyo, 06-09-2026 a las 19:20 desde Calpe, con el cartel rojo de «el
     mapa se había quedado sin memoria y se ha recargado solo» encima de
     la lluvia del jueves: *«va fatal mapas»*. Cuatro días con HRES de
     fábrica y la red de seguridad saltando a diario. Se vuelve a lo
     medido: arranca en ICON-EU (7 km, 5 días, aguanta nueve capas), y el
     europeo de 9 km sigue a un toque en la barra para cuando quiera
     mirar «como Windy» una capa concreta. La elección a mano se guarda
     como siempre; solo se limpia UNA vez la que dejó el arranque de HRES
     (ver `open()`).                                                    */
  map:null, model:'dwd_icon_eu', layer:'precipitation', base:'claro',
  meta:null, t:0, playing:false, verValores:true, verBarbas:true,
  verRayos:true, _rayosTimer:null, _rayosN:0,
  _frames:[], _encima:[], timer:null, radarFrames:null, radarHost:null,
  /* 0,95 y no 0,85: suyo, 31-08-2026, comparando con Meteored — «el
     contraste, sobre todo los mapas apagados». El 15 % de transparencia
     dejaba pasar el fondo claro con su relieve y lavaba TODAS las capas
     a pastel. Los rótulos no sufren: van por encima de la capa de datos
     desde el arreglo del 24-08. El mando de opacidad sigue en la barra
     para quien la quiera suave. */
  opacity:0.95,
  terrain:true,

  /** Lleva el mapa al emplazamiento elegido y mueve el marcador. Si el
   *  mapa aún no se ha abierto, no hace nada: open() ya arranca centrado
   *  en S.place. Se llama al cambiar de sitio (buscar una estación) para
   *  que el mapa NO se quede en el punto anterior. */
  irA(p) {
    if (!this.map || !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return;
    const clave = `${p.lat},${p.lon}`;
    if (clave === this._centro) return;
    this._centro = clave;
    this._marcador?.setLngLat([p.lon, p.lat])
      .setPopup(new maplibregl.Popup({ offset:16 }).setText(p.name || ''));
    this.map.flyTo({ center:[p.lon, p.lat], zoom: Math.max(this.map.getZoom(), 8), speed:1.4, essential:true });
  },

  async open() {
    // Si el mapa ya estaba montado, al volver a la pestaña se recentra en
    // el emplazamiento actual (por si se cambió de sitio con el mapa cerrado).
    if (this.map) { setTimeout(() => this.map.resize(), 60); this.irA(S.place); return; }
    /* ICON-EU de arranque, no ECMWF HRES: medido en SU máquina — HRES
       tumba el mapa a la 5.ª capa por memoria; ICON-EU aguantó 9. El
       modelo pesado sigue a un toque en la barra, pero la app no puede
       abrir por defecto con el que la tira. (31-08-2026, la tarde de
       los tres cuelgues seguidos.) */
    /* El de fábrica es el europeo de 9 km desde el 02-09-2026 (ver la
       nota de `model:` arriba). Lo que él haya elegido a mano manda. */
    /* Una sola vez: quien tuviera guardado HRES por el arranque del 02-09
       vuelve a ICON-EU. Si lo vuelve a elegir a mano, se respeta. */
    if (!LS.get('tmodelLimpio0609', false)) {
      if (LS.get('tmodel', null) === 'ecmwf_ifs') LS.set('tmodel', 'dwd_icon_eu');
      LS.set('tmodelLimpio0609', true);
    }
    this.model = LS.get('tmodel', 'dwd_icon_eu');
    this.layer = LS.get('tlayer', 'precipitation');
    this.base  = LS.get('tbase',  'claro');
    this.terrain = LS.get('tterrain', true);
    this.pasoHoras = LS.get('tpaso', 3);
    this.verValores = LS.get('tvals', true);
    this.verBarbas  = LS.get('tbarbs', true);
    this.verRayos   = LS.get('trayos', true);

    const el = document.querySelector('#mapc');
    el.innerHTML = `<div class="radar__ph">Cargando cartografía…</div>`;
    try {
      await this.libs();
      el.innerHTML = '';
      const p = S.place;

      // Menos peticiones simultáneas: es lo que provocaba los 429.
      if (maplibregl.config) maplibregl.config.MAX_PARALLEL_IMAGE_REQUESTS = 6;

      Peticiones.onCambio = (f) => this.avisoTeselas(f);
      this.vigilarMemoria();

      // La librería SOLO admite el esquema `om://`. Se intentó registrar un
      // segundo esquema `omdbz://` para la reflectividad y lo rechazaba con
      // "Invalid OM protocol URL", así que esa capa no cargaba NI UNA tesela.
      // Ahora hay un único protocolo y la escala de dBZ se pide con un
      // parámetro propio, que se quita antes de entregar la URL a la
      // librería para que no se confunda.
      maplibregl.addProtocol('om', (params, ac) => {
        const nombre = marcaDe(params.url);
        const url = nombre ? limpiarMarca(params.url) : params.url;
        const E = nombre ? escalasPropias()[nombre] : null;
        const ajustes = E
          ? { ...OMWeatherMapLayer.defaultOmProtocolSettings,
              colorScales: { custom: E.scale } }
          : undefined;
        return Peticiones.conReintento(
          () => OMWeatherMapLayer.omProtocol({ ...params, url }, ac, ajustes), ac);
      });

      // Segundo protocolo idéntico pero con la escala de colores de dBZ:
      // así la misma lluvia se puede pintar como reflectividad de radar.



      this.map = new maplibregl.Map({
        container: el,
        style: (BASEMAPS.find(b => b.id === this.base) || BASEMAPS[0]).url,
        center: [p.lon, p.lat], zoom: 5.2, attributionControl: false,
      });
      this.map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'top-left');
      this.map.addControl(new maplibregl.AttributionControl({ compact:true }), 'bottom-right');
      this.map.addControl(new maplibregl.ScaleControl({ unit:'metric' }), 'bottom-left');

      // El evento 'load' puede haber saltado ya, o tardar si el estilo va
      // lento. Sin esta salvaguarda el visor se quedaba colgado y no
      // llegaba a pedir los metadatos del modelo.
      await new Promise(r => {
        if (this.map.loaded()) return r();
        this.map.once('load', r);
        setTimeout(r, 9000);
      });

      this._marcador = new maplibregl.Marker({ color:'#e03050' })
        .setLngLat([p.lon, p.lat])
        .setPopup(new maplibregl.Popup({ offset:16 }).setText(p.name))
        .addTo(this.map);
      this._centro = `${p.lat},${p.lon}`;
      // Los rayos, también en la primera apertura, aunque apply() tarde.
      setTimeout(() => this.rayos(), 1500);

      this.relieve(); this.mar();
      // Al mover o ampliar el mapa se sigue precargando, y si estaba
      // reproduciéndose NO se detiene: solo se piden las teselas de la
      // nueva vista.
      this.map.on('moveend', () => { this.precargar(this._dir ?? 1); this.valores(); this.barbas(); this.rayosPronto(); });
      this.map.on('move', () => { this.limpiarValores(); this.limpiarBarbas(); });
      this.map.on('zoomend', () => { this._pedidas = new Set(); this.precargar(this._dir ?? 1); });
      this.map.on('click', e => this.consultar(e.lngLat));
      this.map.getCanvas().style.cursor = 'crosshair';
      this.ui();
      await elegirOrigenTeselas();
      await this.loadMeta();
    } catch (e) {
      el.innerHTML = `<div class="radar__ph">No se ha podido cargar el mapa (${esc(e.message)}).</div>`;
    }
  },

  /* Carga diferida: nada de esto pesa en el arranque de la app. */
  libs() {
    if (window.maplibregl && window.OMWeatherMapLayer) return Promise.resolve();
    const css = u => new Promise(ok => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = u; l.onload = ok; l.onerror = ok;
      document.head.appendChild(l);
    });
    const js = u => new Promise((ok, err) => {
      const s = document.createElement('script');
      s.src = u; s.onload = ok;
      s.onerror = () => err(new Error('sin conexión'));
      document.head.appendChild(s);
    });
    // MapLibre venía de unpkg.com, un servidor de terceros. Dos problemas:
    // el service worker NO cachea nada de fuera, así que SIN COBERTURA el
    // mapa no arrancaba —y él trabaja en el monte—; y encima una
    // herramienta con la que se decide subir a una torre no puede
    // depender de que un CDN ajeno esté en pie. Ahora es local.
    return css('vendor/maplibre-gl.css')
      .then(() => js('vendor/maplibre-gl.js'))
      .then(() => js('vendor/openmeteo-weather-map-layer-0.0.20.js'));
  },

  /* ---------- Metadatos reales del modelo ---------- */
  async loadMeta() {
    this.status('leyendo modelo…');
    try {
      const m = await jgetMeta(`${TILES}/${this.model}/latest.json`, { timeout:15000 });
      this.meta = m;
      this.metaCache[this.model] = m;
      this.precargarMetas();   // el resto de fichas, en paralelo y de fondo
      const n = (m.valid_times || []).length;
      const sl = document.querySelector('#mapTime');
      sl.max = Math.max(0, n - 1);
      this.t = Math.min(this.nowIndex(), Math.max(0, n - 1));
      sl.value = this.t;
      // Si venimos de una recarga por falta de memoria, a la hora de antes
      if (!this._recuperado) { this._recuperado = true; this.recuperarTrasRecarga(); }
      this.ui();
      this.apply();
      this.ocultarModeloCaido();
    } catch (e) {
      this.status('no se ha podido leer el modelo: ' + e.message);
      this.avisoModeloCaido(e);
    }
  },

  /** Paso más cercano a una hora concreta dentro de una lista de horas.
   *
   *  Cada modelo publica su propia lista de horas, y una capa sustituida
   *  usa la del modelo que la sirve. El número de paso NO se puede
   *  reutilizar entre listas: hay que buscar la hora equivalente.      */
  indiceDeHora(meta, fecha) {
    const T = meta?.valid_times ?? [];
    if (!T.length || !fecha) return null;
    let best = 0, bd = Infinity;
    T.forEach((t, i) => {
      const d = Math.abs(new Date(t).getTime() - fecha.getTime());
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  },

  /** La hora que se está mirando ahora mismo, como fecha real.
   *
   *  Se lee de la lista del modelo QUE PINTA, que en una capa sustituida
   *  no es el que está seleccionado.                                   */
  horaMirada() {
    // Las dos capas de radar llevan su propia tira de imágenes, con sus
    // horas y sus intervalos de 10 minutos. Si se lee el meta de un
    // modelo con un paso de radar sale una hora que no es.
    if (this.layer === 'radar') {
      const t = this.radarFrames?.[this.t]?.time;
      return t ? new Date(t * 1000) : null;
    }
    if (this.layer === 'aemet') {
      const t = this._aemet?.[this.t]?.t;
      return t ? new Date(t) : null;
    }
    if (this.capaSat()) {
      const t = this._sat?.horas?.[this.t];
      return t ? new Date(t) : null;
    }
    const m = this.usando?.meta ?? this.meta;
    const v = m?.valid_times?.[this.t];
    return v ? new Date(v) : null;
  },

  /* ── LAS CAPAS OBSERVADAS VAN POR SU PROPIA TIRA ──────────────────
     Medido leyendo el código el 05-09-2026 (revisión del 04-09, área
     mapa): el deslizador del satélite recorría `_idx`, los índices del
     MODELO con el paso elegido. Con 12 fotogramas cada 15 min y el paso
     de fábrica de 3 h, `_idx = [0,3,6,9,12,…]`: la muesca 3 enseñaba el
     fotograma 9 (+2 h 15 en vez de +45 min) y de la muesca 4 en adelante
     `_sat.horas[12]` no existía y el pulgar saltaba solo al final. Dos
     tercios de la barra muertos. Y mientras se arrastraba, el sello
     escribía una hora de PREVISIÓN del modelo sobre una capa que solo
     tiene las últimas 2 h 45. Los botones ◀ ▶ sí iban fotograma a
     fotograma: dos mandos de la misma barra moviéndose distinto.

     Una sola puerta: si la capa es observada, aquí está su tira de
     horas (en milisegundos) y el deslizador va por ÍNDICE DE FOTOGRAMA;
     si es de modelo, devuelve null y se sigue por posiciones de `_idx`.
     Tira vacía = observada pero aún sin cargar: se queda en el 0 y
     setT() → apply() la carga.                                        */
  tiraObservada() {
    if (this.layer === 'radar') return (this.radarFrames ?? []).map(f => f.time * 1000);
    if (this.layer === 'radarprev') return (this._mixta ?? []).map(x => x.time);
    if (this.layer === 'aemet') return (this._aemet ?? []).map(x => x.t);
    if (this.capaSat())        return (this._sat?.horas ?? []).map(h => new Date(h).getTime());
    return null;
  },

  /** El sello de hora de una capa observada, como lo escribe su apply:
   *  el satélite lleva día y mes (sus pasadas cruzan medianoche y se
   *  miran de un día para otro); radar y AEMET, día de la semana y hora. */
  selloObservado(d) {
    const f = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
    if (this.capaSat()) Object.assign(f, { day: '2-digit', month: 'short' });
    return d.toLocaleString('es', f);
  },

  /** Coloca el paso en la hora pedida dentro de una tira de imágenes.
   *
   *  Vale para radar, donde no hay valid_times sino fotogramas sueltos.
   *  Si la hora pedida cae fuera de la tira (el radar solo tiene pasado
   *  reciente) se queda en el extremo más cercano, que es lo honrado:
   *  nunca se inventa un fotograma que no existe.                     */
  pasoEnTira(horas) {
    if (!horas?.length) return 0;
    if (!this.horaPedida) return Math.min(this.t, horas.length - 1);
    const objetivo = this.horaPedida.getTime();
    this.horaPedida = null;
    let best = 0, bd = Infinity;
    horas.forEach((h, i) => { const d = Math.abs(h - objetivo); if (d < bd) { bd = d; best = i; } });
    return best;
  },

  nowIndex(meta = this.meta) {
    const T = meta?.valid_times ?? [];
    if (!T.length) return 0;
    const now = Date.now();
    let best = 0, bd = Infinity;
    T.forEach((t, i) => {
      const d = Math.abs(new Date(t).getTime() - now);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  },

  /** Todas las capas se ofrecen: las que este modelo no publique se
   *  pintarán con otro modelo, avisando. */
  available() { return TLAYERS; },

  /** ¿Esta capa la publica el modelo elegido? */
  propia(l) {
    return l.id === 'radar' || l.id === 'aemet' || !!l.sat
        || (this.meta?.variables ?? []).includes(l.v);
  },


  /** URL del fichero .om exacto para una variable y un paso de tiempo.
   *
   *  El parámetro `time_step` de la librería recalcula por su cuenta qué
   *  pasada usar y acaba pidiendo carpetas que aún no existen ("File not
   *  found"). Aquí se construye la ruta con los DOS datos que publica el
   *  propio modelo en latest.json — `reference_time` (la pasada) y
   *  `valid_times[t]` (la hora) — así que lo que se pide es siempre un
   *  fichero que el servidor tiene de verdad.
   *
   *    …/{modelo}/AAAA/MM/DD/HH00Z/AAAA-MM-DDTHHMM.om?variable=…
   */
  omUrl(variable, t, modelo = this.model, meta = this.meta, capa = null) {
    const ref = meta?.reference_time;
    const vt  = meta?.valid_times?.[t];
    if (!ref || !vt) return null;
    const R = new Date(ref), V = new Date(vt);
    if (isNaN(R) || isNaN(V)) return null;
    const p2 = n => String(n).padStart(2, '0');
    const dir  = `${R.getUTCFullYear()}/${p2(R.getUTCMonth()+1)}/${p2(R.getUTCDate())}/${p2(R.getUTCHours())}00Z`;
    const file = `${V.getUTCFullYear()}-${p2(V.getUTCMonth()+1)}-${p2(V.getUTCDate())}`
               + `T${p2(V.getUTCHours())}${p2(V.getUTCMinutes())}`;
    // Parámetros de calidad de la librería oficial:
    //  interpolation=cubic → sin escalones entre celdas del modelo
    //  tile_size=512       → el doble de píxeles por tesela
    //  color_blend=true    → degradado continuo en vez de bandas planas
    // MEDIDO: 'cubic' + tile_size 512 multiplicaba por 25 el tiempo de la
    // primera tesela de cada hora (9,4 s frente a 0,37 s). El suavizado
    // final lo hace MapLibre con raster-resampling, que es gratis.
    const q = new URLSearchParams({ variable, interpolation: 'linear' });
    // Ojo: hay dos capas con la variable `precipitation` (Precipitación y
    // Reflectividad). Buscar por variable devolvía siempre la primera, así
    // que Reflectividad nunca llegaba a usar el protocolo de dBZ.
    const L_ = capa || TLAYERS.find(l => l.id === this.layer && l.v === variable)
            || TLAYERS.find(l => l.v === variable);
    if (L_?.arrows)   q.set('arrows', 'true');     // barbas de viento
    if (L_?.contours) q.set('contours', 'true');   // isobaras / isohipsas
    // Las escalas propias se piden con la marca de arriba sobre el mismo
    // esquema `om://`. Registrar un esquema aparte NO funciona: la librería
    // devuelve "Invalid OM protocol URL" y la capa se queda sin una sola
    // tesela, con el mapa en blanco y sin decir nada.
    if (L_?.escala) q.set(MARCA, L_.escala);  // se retira antes de llamar a la librería
    return `om://${TILES}/${modelo}/${dir}/${file}.om?${q}`;
  },


  /* ---------- Sustitución de modelo por capa ----------
     Si el modelo que has elegido no publica la capa que quieres ver, en
     vez de hacerla desaparecer se busca otro modelo que sí la tenga.

     REGLA: eso SIEMPRE se dice en pantalla. Nunca vas a ver una capa
     creyendo que es ECMWF cuando en realidad es GFS. El aviso sale en
     la barra de estado y en un cartel sobre el mapa.                  */

  metaCache: {},

  async metaDe(modelo) {
    if (this.metaCache[modelo]) return this.metaCache[modelo];
    const m = await jgetMeta(`${TILES}/${modelo}/latest.json`, { timeout: 12000 });
    this.metaCache[modelo] = m;
    return m;
  },

  /** Orden de preferencia para sustituir: primero los globales completos. */
  /** Orden en el que se busca un modelo que sí publique la capa.
   *
   *  Primero los EUROPEOS de área limitada: cubren Euskadi entera y sus
   *  ficheros son mucho más pequeños que los globales. MEDIDO: con
   *  ICON global, «Tope convectivo» tardaba más de 30 s en aparecer; es
   *  el fichero más pesado de todos. ICON-EU publica lo mismo y pesa una
   *  fracción.
   *
   *  ICON-D2 (2 km) iba después de ICON-EU porque se creía que Euskadi le
   *  quedaba «en el borde». MEDIDO el 26-08-2026: no le queda en el borde,
   *  es que NO LLEGA — 0 de 12 emplazamientos con dato. Se saca de la lista
   *  de sustitutos: sustituir una capa por un modelo que aquí no tiene
   *  nada es cambiar un hueco por otro hueco, y encima con nombre nuevo.
   *  Sigue elegible a mano (su botón ya avisa), pero no se elige solo.
   *  Los globales quedan de último recurso. */
  /* ── EL SUSTITUTO TIENE QUE LLEGAR A DONDE ESTÁS MIRANDO ───────────
     Cazado por él el 01-09-2026, siguiendo tifones: puso **GFS** (global),
     pidió **CAPE** —que GFS no publica como capa— y la app se lo
     sustituyó por **ICON-EU**… estando el mapa en Filipinas. Resultado:
     cartel de «capa sustituida», mapa en blanco y, al pinchar, «ICON-EU
     no tiene valor en este punto».

     La sustitución en sí estaba bien y avisaba —eso es correcto—, pero
     **elegía el sustituto mirando solo la calidad, no la cobertura**. Un
     modelo europeo no sirve de sustituto en Asia por muy fino que sea.

     Ahora la lista se ordena según DÓNDE está el mapa: dentro del hueco
     europeo, primero los finos de aquí (que es lo suyo para su trabajo);
     fuera, primero los globales. Los de área limitada quedan detrás, no
     se quitan: si el mapa vuelve a Europa, vuelven a ser los primeros. */
  alternativas() {
    const EUROPEOS = ['dwd_icon_eu', 'meteofrance_arpege_europe',
                      'knmi_harmonie_arome_europe', 'meteofrance_arome_france_hd'];
    const GLOBALES = ['ecmwf_ifs', 'ecmwf_ifs025', 'ncep_gfs013', 'ncep_gfs025', 'dwd_icon'];

    /* Caja generosa de Europa: si el centro del mapa cae fuera, ningún
       modelo de área limitada de los nuestros va a tener dato ahí. */
    let enEuropa = true;
    try {
      const c = this.map?.getCenter?.();
      if (c) enEuropa = c.lat > 27 && c.lat < 72 && c.lng > -32 && c.lng < 45;
    } catch { /* sin mapa todavía: se deja el orden de siempre */ }

    return enEuropa ? [...EUROPEOS, ...GLOBALES] : [...GLOBALES, ...EUROPEOS];
  },

  /** Devuelve con qué modelo y metadatos hay que pintar esta capa. */
  /** Se traen TODAS las fichas de modelo a la vez y se dejan en caché.
   *  Antes se pedían de una en una según hacían falta, y la primera capa
   *  que necesitaba sustituto se comía 1,4 s solo en averiguar con qué
   *  modelo pintarla. Son ficheros pequeños y van a otro servidor
   *  distinto al de las teselas, así que no estorban. */
  precargarMetas() {
    if (this._metasPedidas) return;
    this._metasPedidas = true;
    Promise.allSettled(this.alternativas().map(m => this.metaDe(m))).then(() => this.ui());
  },

  /** Cuántos días de previsión publica un modelo. MEDIDO: va de 2 días
   *  (AROME, ICON-D2) a 16 (GFS). Los de más detalle son los que menos
   *  lejos llegan, y eso hay que verlo ANTES de elegir, no después de
   *  buscar en vano una hora que ese modelo no tiene. */
  diasDe(modelo) {
    const m = modelo === this.model ? this.meta : this.metaCache[modelo];
    const vt = m?.valid_times;
    if (!vt?.length) return null;
    const h = (new Date(vt[vt.length - 1]) - new Date(vt[0])) / 3600000;
    return Math.round(h / 24 * 10) / 10;
  },

  async resolverModelo(L_) {
    if (!L_?.v) return null;
    if (this.meta?.variables?.includes(L_.v)) {
      return { modelo: this.model, meta: this.meta, sustituido: false };
    }
    // Primero, lo que ya esté en caché: es instantáneo y evita esperar
    // a una petición por cada modelo que no valga.
    for (const alt of this.alternativas()) {
      if (alt === this.model) continue;
      const m = this.metaCache[alt];
      if (m?.variables?.includes(L_.v)) return { modelo: alt, meta: m, sustituido: true };
    }
    for (const alt of this.alternativas()) {
      if (alt === this.model || this.metaCache[alt]) continue;
      let m = null;
      try { m = await this.metaDe(alt); } catch { continue; }
      if (m?.variables?.includes(L_.v)) {
        return { modelo: alt, meta: m, sustituido: true };
      }
    }
    return null;
  },

  /* ---------- Calentar las capas con las que decides ----------
     MEDIDO: abrir una variable por primera vez cuesta 2 s de media y
     hasta 7,9 s. Una vez abierta, la siguiente tesela son 198 ms.

     Ráfagas, Precipitación y CAPE son las tres con las que se decide si
     alguien sube a una torre, y se salta entre ellas constantemente.
     Se abren en segundo plano, de una en una y por la misma cola que
     limita las peticiones, para que el salto sea inmediato y sin
     saturar el servidor.                                            */

  CLAVES: ['gusts', 'precipitation', 'cape'],

  calentarClaves() {
    clearTimeout(this._cal);
    this._cal = setTimeout(async () => {
      if (!this.map || !this.usando) return;
      const z = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
      const centro = this.tilesVisibles(z)[0];
      if (!centro) return;
      this._pedidas ??= new Set();

      for (const id of this.CLAVES) {
        if (id === this.layer) continue;
        const L_ = TLAYERS.find(l => l.id === id);
        if (!L_?.v) continue;
        let R = null;
        try { R = await this.resolverModelo(L_); } catch { continue; }
        if (!R) continue;
        const u = this.omUrl(L_.v, this.t, R.modelo, R.meta);
        if (!u) continue;
        const k = `${limpiarMarca(u)}/${z}/${centro[0]}/${centro[1]}`;
        if (this._pedidas.has(k)) continue;
        this._pedidas.add(k);
        try {
          await Peticiones.conReintento(
            () => OMWeatherMapLayer.omProtocol({ url: k, type: 'image' }, new AbortController()), null);
        } catch { /* si no entra, la capa se abrirá al pulsarla */ }
      }
    }, 1800);
  },


  /* ---------- Fotogramas en memoria ----------
     El motivo del retardo: cada hora del modelo es un fichero distinto
     que hay que bajar y descodificar, y antes, al cambiar de hora, se
     tiraba el trabajo ya hecho y había que rehacerlo al volver.

     Ahora cada hora ya vista se queda como una capa propia con opacidad
     0, y cambiar de hora es solo encender una y apagar otra: instantáneo,
     como el radar. Se guardan hasta 14 horas y se van soltando las más
     lejanas para no comerse la memoria.                               */




  /** Enciende la hora pedida y apaga las demás. */




  /** Suelta las horas más alejadas de la que estás viendo. */


  /** Deja listas en segundo plano las horas siguientes, ya como capas. */





  /* ---------- Paso temporal ----------
     Windy y Ventusky animan de 3 en 3 horas, no hora a hora. Por eso
     van fluidos: descargan la tercera parte de ficheros y cada paso
     enseña un cambio de verdad, no un movimiento que casi no se aprecia.

     `pasoHoras` decide cada cuántas horas del modelo se salta. El
     deslizador recorre solo esas horas; las intermedias siguen existiendo
     y se pueden ver poniendo el paso a 1 h.                            */

  pasoHoras: 3,

  /** Índices reales del modelo que recorre el deslizador. */
  indices(meta = this.usando?.meta ?? this.meta) {
    const T = meta?.valid_times ?? [];
    if (!T.length) return [];
    if (this.pasoHoras <= 1) return T.map((_, i) => i);
    const t0 = new Date(T[0]).getTime();
    const out = [];
    let objetivo = t0;
    for (let i = 0; i < T.length; i++) {
      const ti = new Date(T[i]).getTime();
      if (ti + 1 >= objetivo) { out.push(i); objetivo = ti + this.pasoHoras * 3600e3; }
    }
    return out;
  },

  /** Ajusta el deslizador al paso elegido, conservando la hora mirada. */
  ajustarSlider() {
    const idx = this.indices();
    this._idx = idx;
    const sl = document.querySelector('#mapTime');
    if (!sl || !idx.length) return;
    sl.max = idx.length - 1;
    // Buscar la posición más cercana a la hora que se estaba viendo
    let mejor = 0, d = Infinity;
    idx.forEach((ti, k) => { const dd = Math.abs(ti - this.t); if (dd < d) { d = dd; mejor = k; } });
    this._pos = mejor;
    sl.value = mejor;
    this.t = idx[mejor];
  },

  /** Mueve el deslizador por posiciones, no por horas del modelo.
   *  En una capa observada la posición ES el fotograma (ver
   *  tiraObservada): nada de traducir por `_idx`, que es del modelo. */
  irAPosicion(pos) {
    const T = this.tiraObservada();
    if (T) {
      const t = Math.max(0, Math.min(Math.max(0, T.length - 1), +pos || 0));
      const sl = document.querySelector('#mapTime');
      if (sl) sl.value = t;
      this.setT(t);
      return;
    }
    const idx = this._idx ?? this.indices();
    const p = Math.max(0, Math.min(idx.length - 1, +pos));
    this._pos = p;
    this.setT(idx[p]);
  },

  setPaso(h) {
    if (h === this.pasoHoras) return;
    this.pasoHoras = h; LS.set('tpaso', h);
    this._fuente = null;
    this.ajustarSlider();
    this.ui();
    this.apply();
  },

  /* La descarga completa de la línea de tiempo se ha RETIRADO.
     Motivo medido: cada hora del modelo es un fichero de unos 42 MB.
     Bajarlas todas en segundo plano saturaba la conexión y las teselas
     que el usuario estaba mirando se quedaban esperando detrás. Peor el
     remedio que la enfermedad. Ahora solo se adelantan 2 horas. */

  /* ---------- Pintar ---------- */
  async apply() {
    if (!this.map || !this.meta) return;
    const L_ = TLAYERS.find(l => l.id === this.layer);
    if (!L_) return;

    Peticiones.reset();
    this._fallosCerrados = false;
    // El cartel de «cargando» de la capa ANTERIOR se apaga aquí. Si no,
    // al pasar a Radar observado seguía poniendo «Cargando Reflectividad»,
    // que es otra vez el rótulo diciendo una cosa y la pantalla otra.
    clearInterval(this._relojCarga);
    this.cargando(false);
    this.quitarCapasDeDatos();
    // Y los números de la capa ANTERIOR se borran ya. Si no, mientras
    // carga la nueva se quedan en pantalla bajo el nombre de la nueva:
    // el 24-08-2026 el mapa ponía «Humedad» con los 1013, 1012 de la
    // presión encima. Un número bajo la etiqueta equivocada engaña más
    // que un hueco.
    this.limpiarValores();
    this.limpiarBarbas();

    /* Los rayos van encima de cualquier capa, también de las dos que
       salen por aquí antes de llegar al final de apply() (09-09-2026). */
    if (L_.id === 'radar') { this.applyRadar(); setTimeout(() => this.rayos(), 600); return; }
    if (L_.id === 'radarprev') { this.applyMixta(); setTimeout(() => this.rayos(), 600); return; }
    if (L_.id === 'aemet') { this.applyAemet(); setTimeout(() => this.rayos(), 600); return; }
    if (L_.sat) { this.applySatelite(L_); setTimeout(() => this.rayos(), 600); return; }

    // ¿Este modelo publica la capa, o hay que ir a buscarla a otro?
    const R = await this.resolverModelo(L_);
    if (!R) {
      this.status(`ningún modelo disponible publica ${L_.name.toLowerCase()}`);
      this.avisoSustitucion(null);
      return;
    }
    const cambioFuente = this._fuente !== `${R.modelo}|${this.layer}`;
    if (cambioFuente) { this._fuente = `${R.modelo}|${this.layer}`; }
    this.usando = R;

    // El paso se ajusta a la lista de horas del modelo que REALMENTE
    // pinta, que en una capa sustituida no es el elegido.
    //
    // OJO con los dos espacios de numeración: `this.t` es el índice de la
    // hora dentro del modelo, pero el deslizador va por POSICIONES, que con
    // paso de 3 h son muchas menos. Traducir de uno a otro es trabajo de
    // ajustarSlider(); tocar sl.value a mano descuadraba el deslizador.
    {
      const n = R.meta.valid_times.length;
      if (this.horaPedida) {
        // Venimos de cambiar de capa: a la hora equivalente, no al mismo paso
        this.t = this.indiceDeHora(R.meta, this.horaPedida) ?? 0;
        this.horaPedida = null;
      } else if (this.t > n - 1) {
        this.t = Math.min(this.nowIndex(R.meta), n - 1);
      }
      this.ajustarSlider();
    }
    this.avisoSustitucion(R.sustituido ? R.modelo : null);

    this.ajustarSlider();

    // Una sola capa, sin fotogramas superpuestos. El sistema de mantener
    // varias horas montadas a la vez se probó y dejaba el mapa en blanco:
    // más vale una capa que se ve que un truco de velocidad que no pinta.
    const url = this.omUrl(L_.v, this.t, R.modelo, R.meta);
    if (!url) { this.status('sin hora válida para esta capa'); return; }

    try {
      // Las capas DENSAS (punto de rocío, temperatura, humedad…) pintan
      // todo el mapa de color, y con 0,58 el relieve que va debajo
      // desaparecía. Aitor lo dijo el 25-08-2026: «apenas se ve la tierra,
      // el relieve». En el monte saber dónde está el cordal y dónde el
      // valle importa, porque el viento no es el mismo. Bajado a 0,46:
      // el color se sigue leyendo y la sombra del terreno se transparenta.
      // El deslizador CAPA sigue mandando por encima de esto.
      /* Y el 31-08 pidió lo otro: «el contraste, sobre todo los mapas
         apagados», con Meteored al lado. Las dos peticiones son suyas y
         las dos valen: CON el relieve puesto se transparenta (0,6, algo
         más de color que el 0,46 de entonces) — SIN relieve no hay nada
         que ver debajo y el color va a plena potencia, como Meteored.
         El botón Relieve de la barra es ahora también el mando del
         contraste, y el deslizador CAPA sigue mandando por encima. */
      /* Sus dos peticiones (25-08 «que se vea el relieve» y 31-08 «el
         contraste, mapas apagados») se sirven A LA VEZ con el truco de
         los mapas profesionales: el COLOR va pleno y la SOMBRA del
         terreno se dibuja ENCIMA, suave. Ya no hay que elegir. */
      const op = this.opacity;
      this.map.addSource('omSrc', {
        type:'raster', tiles:[`${url}/{z}/{x}/{y}`], tileSize:256, maxzoom:12,
        attribution:'Datos de modelo: Open-Meteo',
      });
      this.map.addLayer({
        id:'omLayer', type:'raster', source:'omSrc',
        paint:{ 'raster-opacity': op, 'raster-fade-duration': 120,
                'raster-resampling': 'linear' },
      }, this.firstLabelLayer());
      /* La sombra del terreno, POR ENCIMA del color y rebajada: así el
         cordal y el valle se siguen leyendo sin lavar la capa. */
      if (this.terrain && this.map.getLayer('hillLayer')) {
        try {
          this.map.moveLayer('hillLayer', this.firstLabelLayer());
          this.map.setPaintProperty('hillLayer', 'raster-opacity', 0.32);
        } catch {}
      }

      if (L_.encima) {
        const u2 = this.omUrl(L_.encima, this.t, R.modelo, R.meta);
        if (u2) {
          this.map.addSource('omSrc2', {
            type:'raster', tiles:[`${u2}/{z}/{x}/{y}`], tileSize:256, maxzoom:12 });
          this.map.addLayer({ id:'omLayer2', type:'raster', source:'omSrc2',
            paint:{ 'raster-opacity':0.9, 'raster-resampling':'linear' } },
            this.firstLabelLayer());
        }
      }

      if (L_.contours) this.isobaras(url);
    } catch (e) {
      this.status('la capa no ha podido dibujarse: ' + e.message);
      return;
    }

    this.vigilarCarga(L_);
    this.precargar(this._dir ?? 1);
    this.calentarClaves();
    this.stamp();
    this.legend();
    setTimeout(() => { this.valores(); this.barbas(); this.rayos(); }, 600);
  },

  /** Altura del sol sobre el horizonte, en grados, en un punto y momento.
   *
   *  Fórmula astronómica estándar (declinación y ángulo horario). No hace
   *  falta más precisión: aquí solo se quiere saber si hay luz o no.   */
  alturaSol(fecha, lat, lon) {
    const rad = Math.PI / 180;
    const d = (fecha.getTime() / 86400000) + 2440587.5 - 2451545.0;
    const g = (357.529 + 0.98560028 * d) * rad;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    const e = (23.439 - 0.00000036 * d) * rad;
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad / 15;
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const h = (gmst + lon / 15 - ra) * 15 * rad;
    const sen = Math.sin(lat * rad) * Math.sin(dec)
              + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(h);
    return Math.asin(Math.max(-1, Math.min(1, sen))) / rad;
  },

  /** Aviso cuando una capa que necesita sol se está mirando de noche.
   *
   *  Tormentas y Visible se hacen con los canales solares. De noche el
   *  satélite sigue mandando imagen, pero sale NEGRA. Y un mapa negro se
   *  lee como "aquí no hay nubes", que puede ser exactamente lo contrario
   *  de lo que está pasando. Así que se dice con todas las letras y se le
   *  manda al infrarrojo, que sí ve de noche.                          */
  avisoNoche(L_, cuando) {
    if (!L_?.sol || !this.map) { this.avisoSustitucion(null); return false; }
    const c = this.map.getCenter();
    const alt = this.alturaSol(cuando, c.lat, c.lng);
    if (alt > 3) { this.avisoSustitucion(null); return false; }
    // ¿Amanece o anochece? Media hora más tarde lo dice. Sin esto el
    // aviso ponía «el sol está casi puesto» a las 8 de la mañana, con el
    // sol saliendo: Aitor lo vio el 24-08-2026 a las 08:15. El número
    // era bueno (3°) y la frase, al revés.
    const luego = this.alturaSol(new Date(cuando.getTime() + 1800e3), c.lat, c.lng);
    const sube  = luego > alt;
    const grados = `${alt.toFixed(0)}°`;
    const titular = alt < 0
      ? (sube ? 'Todavía es de noche: esta capa no ve nada.'
              : 'De noche esta capa no ve nada.')
      : 'Con el sol tan bajo, esta capa apenas ve.';
    const donde = alt < 0
      ? (sube ? `el sol aún no ha salido (${grados})`
              : `el sol ya se ha puesto (${grados})`)
      : (sube ? `el sol acaba de salir (${grados} sobre el horizonte)`
              : `el sol está a punto de ponerse (${grados})`);
    const el = document.querySelector('#mapSust');
    if (el) {
      el.hidden = false; el.dataset.k = 'noche';
      el.innerHTML = `<b>${titular}</b> Funciona con luz del sol, y a esta hora `
        + `${donde}. <b>Lo negro no es «sin nubes», es «sin luz».</b> `
        + (sube ? 'Según suba el sol irá mejorando. ' : '')
        + 'Para ver la nube ahora, usa <b>Nubes (infrarrojo)</b>.';
    }
    return true;
  },

  /** La clave de satélite de la capa activa, o null si no es de satélite. */
  capaSat() {
    return TLAYERS.find(l => l.id === this.layer)?.sat ?? null;
  },

  /** Satélite de EUMETSAT: la nube que HAY, no la que calcula un modelo.
   *
   *  Va como fuente WMS de MapLibre. Dos cuidados que no son adorno:
   *
   *  · SE FIJA LA HORA en cada petición. Sin `time`, el servidor sirve
   *    cada cuadro de la pasada que le pilla más a mano y la imagen sale
   *    con COSTURAS: trozos de mapa de momentos distintos pegados. Se vio
   *    al probarlo el 23-08-2026.
   *
   *  · LAS HORAS VIENEN DE /satelite, no se calculan aquí. Medido el
   *    05-09-2026: el catálogo de EUMETSAT declara un INTERVALO
   *    (inicio/fin/PT15M), a más de 15 min del fin el WMS devuelve un
   *    502 vacío —que pintado es «no hay nubes»— y a menos, la pasada
   *    vecina con otra etiqueta. Por eso /satelite recorta el intervalo
   *    a lo que ya ha pasado y comprueba con un GetMap que la última
   *    hora se sirve antes de dársela a este mapa.                     */
  async applySatelite(L_) {
    const st = document.querySelector('#mapStamp');
    const sl = document.querySelector('#mapTime');
    try {
      // El catálogo se pide una vez y vale para las tres capas
      if (!this._satCat) {
        this.status('leyendo el catálogo de EUMETSAT…');
        this._satCat = await jget(API.sat, { n: 12 }, { timeout: 15000 });
      }
      const cat = this._satCat;
      if (cat?.error || !cat?.capas?.[L_.sat]) {
        throw new Error(cat?.reason || 'EUMETSAT no ofrece esta capa ahora');
      }
      const C = cat.capas[L_.sat];
      this._sat = C;

      sl.max = C.horas.length - 1;
      this.t = this.pasoEnTira(C.horas.map(h => new Date(h).getTime()));
      if (this.t >= C.horas.length) this.t = C.horas.length - 1;
      sl.value = this.t;

      const hora = C.horas[this.t];
      const q = new URLSearchParams({
        service: 'WMS', version: '1.1.1', request: 'GetMap',
        layers: C.wms, styles: '', format: 'image/png', transparent: 'true',
        srs: 'EPSG:3857', width: '512', height: '512', time: hora,
      });
      const url = `${cat.wms}?${q}&bbox={bbox-epsg-3857}`;

      ['satLayer'].forEach(id => { if (this.map.getLayer(id)) this.map.removeLayer(id); });
      ['satSrc'].forEach(id => { if (this.map.getSource(id)) this.map.removeSource(id); });

      this.map.addSource('satSrc', { type: 'raster', tiles: [url], tileSize: 512 });
      this.map.addLayer({ id: 'satLayer', type: 'raster', source: 'satSrc',
        paint: { 'raster-opacity': this.opacity, 'raster-fade-duration': 0 } },
        this.firstLabelLayer());

      const d = new Date(hora);
      st.textContent = d.toLocaleString('es', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      // Lo que se ve es de hace un rato: la última pasada tarda en salir
      const min = Math.round((Date.now() - d.getTime()) / 60000);
      st.style.color = min > 60 ? 'var(--warn)' : '';
      st.title = `Pasada de hace ${min} minutos`;

      document.querySelector('#mapLegend').hidden = true;
      this.avisoNoche(L_, d);
      this.status(`${esc(cat.fuente)} · ${C.wms} · cada ${C.pasoMin} min · pasada de hace ${min} min`);
    } catch (err) {
      ['satLayer'].forEach(id => { if (this.map.getLayer(id)) this.map.removeLayer(id); });
      ['satSrc'].forEach(id => { if (this.map.getSource(id)) this.map.removeSource(id); });
      document.querySelector('#mapLegend').hidden = true;
      if (st) { st.textContent = '—'; st.style.color = 'var(--warn)'; }
      // Nunca un mapa en blanco callado
      this.status(`No se ha podido traer el satélite (${String(err.message || err).slice(0, 70)}). `
        + `No se pinta nada: un mapa sin nubes NO significa que el cielo esté despejado.`);
      this._satCat = null;      // que se reintente al volver a entrar
    }
  },

  /** Radar de AEMET como superposición de imagen, dentro de la app. */
  async applyAemet() {
    try {
      if (!this._aemet) this._aemet = AEMET_RADAR.ficheros(8);
      const F = this._aemet;
      const sl = document.querySelector('#mapTime');
      sl.max = F.length - 1;
      this.t = this.pasoEnTira(F.map(x => x.t));
      if (this.t >= F.length) this.t = F.length - 1;
      sl.value = this.t;

      const f = F[this.t];
      ['aemetLayer'].forEach(id => { if (this.map.getLayer(id)) this.map.removeLayer(id); });
      ['aemetSrc'].forEach(id => { if (this.map.getSource(id)) this.map.removeSource(id); });

      // Se limpia el fondo antes de pintar: si no, tapa el mapa entero.
      // Si la limpieza falla, NO se pinta la imagen cruda haciendo como
      // si nada: se dice que no se ha podido y se deja el mapa limpio.
      let limpia;
      /* Un «Failed to fetch» suelto (red que parpadea, función de Vercel
         arrancando) no es que AEMET no esté: el 10-09-2026 a las 11:02
         salió el cartel con el servidor respondiendo en 0,2 s. Se
         reintenta una vez a los 1,5 s antes de decir que no hay radar. */
      try { limpia = await limpiarRadarAemet(f.url); }
      catch (err1) {
        this.status('Radar AEMET: primer intento fallido, reintentando…');
        await new Promise(r => setTimeout(r, 1500));
        try { limpia = await limpiarRadarAemet(f.url); }
        catch (err) {
          this.status(`Radar AEMET no disponible ahora mismo (${err.message}). `
                    + `No se pinta nada: un mapa en blanco no significa que no llueva.`);
          document.querySelector('#mapLegend').hidden = true;
          return;
        }
      }
      this._ecoAemet = limpia;

      const [[w, s2], [e, n]] = AEMET_RADAR.bounds;
      this.map.addSource('aemetSrc', {
        type: 'image', url: limpia.url,
        coordinates: [[w, n], [e, n], [e, s2], [w, s2]],   // NO, NE, SE, SO
      });
      this.map.addLayer({ id:'aemetLayer', type:'raster', source:'aemetSrc',
        paint:{ 'raster-opacity': this.opacity, 'raster-fade-duration': 0 } },
        this.firstLabelLayer());

      const d = new Date(f.t);
      const st = document.querySelector('#mapStamp');
      st.textContent = d.toLocaleString('es', { weekday:'short', hour:'2-digit', minute:'2-digit' });
      st.style.color = '';
      document.querySelector('#mapLegend').hidden = true;
      this.avisoSustitucion(null);
      // Distinguir "no llueve" de "no hay dato" es lo que más importa aquí.
      const pc = (100 * this._ecoAemet.eco / this._ecoAemet.total);
      const cuanto = this._ecoAemet.eco === 0
        ? 'sin eco en toda la península: no está lloviendo en ningún sitio'
        : `eco de lluvia en el ${pc < 0.1 ? '<0,1' : pc.toFixed(1)} % del territorio`;
      this.status(`Radar AEMET · compuesto nacional · observación real, no previsión · ${cuanto}`);
    } catch (e) {
      this.status('radar de AEMET no disponible: ' + e.message);
    }
  },

  /* ── RADAR + PREVISIÓN: la tira mixta ──────────────────────────────
     Fotogramas del radar observado (RainViewer: pasado + media hora de
     extrapolación) y, a continuación, las horas del modelo de
     reflectividad hasta 24 h. Cada paso sabe lo que es. */
  async applyMixta() {
    try {
      if (!this.radarFrames) {
        const d = await jget(API.rain, {}, { timeout:12000 });
        this.radarHost = d.host;
        this.radarFrames = [...(d.radar?.past ?? []), ...(d.radar?.nowcast ?? [])];
      }
      const LR = TLAYERS.find(l => l.id === 'refl');
      const R = await this.resolverModelo(LR);
      if (!R) throw new Error('ningún modelo publica la reflectividad');
      this.usando = R;
      const radar = (this.radarFrames || []).map(f => ({ kind:'radar', time: f.time * 1000, f }));
      const ultimoRadar = radar.length ? radar[radar.length - 1].time : Date.now();
      const T = R.meta?.valid_times ?? [];
      const modelo = [];
      T.forEach((iso, i) => {
        const ms = new Date(iso).getTime();
        if (ms > ultimoRadar && ms <= ultimoRadar + 24 * 3600e3) modelo.push({ kind:'modelo', time: ms, i });
      });
      this._mixta = [...radar, ...modelo];
      if (!this._mixta.length) throw new Error('sin imágenes');
      const sl = document.querySelector('#mapTime');
      sl.max = this._mixta.length - 1;
      /* Se abre en el ÚLTIMO fotograma observado (el «ahora» del radar), o
         en la hora que se estaba mirando si vienes de otra capa. */
      const tiempos = this._mixta.map(x => x.time);
      if (this.horaPedida) this.t = this.pasoEnTira(tiempos);
      else { const fut = tiempos.findIndex(h => h > Date.now()); this.t = fut < 0 ? tiempos.length - 1 : Math.max(0, fut - 1); }
      if (this.t >= this._mixta.length) this.t = this._mixta.length - 1;
      sl.value = this.t;
      this.frameMixta(this.t);
      this.legend();
    } catch (e) {
      this.status('radar + previsión no disponible: ' + e.message);
    }
  },

  frameMixta(t) {
    const x = this._mixta?.[t];
    if (!x || !this.map) return;
    const st = document.querySelector('#mapStamp');
    const d = new Date(x.time);
    const hora = d.toLocaleString('es', { weekday:'short', hour:'2-digit', minute:'2-digit' });
    const M = TMODELS.find(m => m.id === this.usando?.modelo);
    const nombre = M?.name || this.usando?.modelo || 'modelo';
    try {
      if (x.kind === 'radar') {
        const url = `${this.radarHost}${x.f.path}/256/{z}/{x}/{y}/4/1_1.png`;
        if (this.map.getSource('radarSrc')) this.map.getSource('radarSrc').setTiles([url]);
        else {
          /* RainViewer solo sirve teselas hasta z7: de z8 en adelante
           devuelve una imagen «Zoom Level Not Supported» (medido el
           10-09-2026 en 256 y 512 px). Con maxzoom 12 el mapa las pedía y
           al acercarse a Calpe el radar se quedaba en blanco o con
           cajitas grises. Con 7, el mapa estira la de z7. */
        this.map.addSource('radarSrc', { type:'raster', tileSize:256, maxzoom:RAINVIEWER_ZMAX, tiles:[url] });
          this.map.addLayer({ id:'radarLayer', type:'raster', source:'radarSrc',
            paint:{ 'raster-opacity': this.opacity } }, this.firstLabelLayer());
        }
        if (this.map.getLayer('omLayer')) this.map.setLayoutProperty('omLayer', 'visibility', 'none');
        this.map.setLayoutProperty('radarLayer', 'visibility', 'visible');
        const pasado = x.time <= Date.now();
        if (st) { st.textContent = `${hora} · ${pasado ? 'radar' : 'radar, extrapolado'}`; st.style.color = pasado ? '' : 'var(--warn)';
                  st.title = pasado ? 'Observado (RainViewer)' : 'Extrapolación a corto plazo'; }
      } else {
        const LR = TLAYERS.find(l => l.id === 'refl');
        const url = this.omUrl('precipitation', x.i, this.usando.modelo, this.usando.meta, LR);
        if (!url) return;
        if (this.map.getSource('omSrc')) this.map.getSource('omSrc').setTiles([`${url}/{z}/{x}/{y}`]);
        else {
          this.map.addSource('omSrc', { type:'raster', tiles:[`${url}/{z}/{x}/{y}`], tileSize:256, maxzoom:12,
                                        attribution:'Datos de modelo: Open-Meteo' });
          this.map.addLayer({ id:'omLayer', type:'raster', source:'omSrc',
            paint:{ 'raster-opacity': this.opacity, 'raster-fade-duration': 120, 'raster-resampling': 'linear' } },
            this.firstLabelLayer());
        }
        if (this.map.getLayer('radarLayer')) this.map.setLayoutProperty('radarLayer', 'visibility', 'none');
        this.map.setLayoutProperty('omLayer', 'visibility', 'visible');
        if (st) { st.textContent = `${hora} · previsión ${nombre}`; st.style.color = 'var(--acc)'; st.title = 'Previsión del modelo, reflectividad estimada'; }
      }
      const nRadar = this._mixta.filter(y => y.kind === 'radar').length;
      this.status(`radar observado (${nRadar} imágenes, RainViewer) y después previsión ${nombre} (${this._mixta.length - nRadar} h)`);
    } catch (e) {
      this.status('radar + previsión: ' + e.message);
    }
  },

  /* Radar observado, dentro del mismo mapa (sin salir de la app). */
  async applyRadar() {
    try {
      if (!this.radarFrames) {
        const d = await jget(API.rain, {}, { timeout:12000 });
        this.radarHost = d.host;
        this.radarFrames = [...(d.radar?.past ?? []), ...(d.radar?.nowcast ?? [])];
      }
      const F = this.radarFrames;
      if (!F.length) throw new Error('sin imágenes');
      const sl = document.querySelector('#mapTime');
      sl.max = F.length - 1;
      this.t = this.pasoEnTira(F.map(x => x.time * 1000));
      if (this.t >= F.length) this.t = F.length - 1;
      sl.value = this.t;

      const f = F[this.t];
      this.map.addSource('radarSrc', {
        // maxzoom 7: RainViewer no sirve más (ver RAINVIEWER_ZMAX)
        type:'raster', tileSize:256, maxzoom:RAINVIEWER_ZMAX,
        tiles:[`${this.radarHost}${f.path}/256/{z}/{x}/{y}/4/1_1.png`],
      });
      this.map.addLayer({ id:'radarLayer', type:'raster', source:'radarSrc',
        paint:{ 'raster-opacity': this.opacity } }, this.firstLabelLayer());

      const d = new Date(f.time * 1000);
      const st = document.querySelector('#mapStamp');
      st.textContent = d.toLocaleString('es', { weekday:'short', hour:'2-digit', minute:'2-digit' });
      const pasado = f.time * 1000 <= Date.now();
      st.style.color = pasado ? '' : 'var(--warn)';
      st.title = pasado ? 'Observado' : 'Extrapolación a corto plazo';
      this.status(`radar observado · ${F.length} imágenes · RainViewer`);
      document.querySelector('#mapLegend').hidden = true;
    } catch (e) {
      this.status('radar no disponible: ' + e.message);
    }
  },

  /* ---------- Isobaras (y las isohipsas del geopotencial) ────────────
     La app YA le pedía las líneas a la librería con `contours=true` en la
     dirección, pero nunca salían. MEDIDO el 24-08-2026: la misma tesela
     pedida como IMAGEN sale idéntica con y sin ese parámetro —ni un píxel
     de diferencia sobre 262.144—. La librería no las dibuja encima del
     color: las entrega aparte, como tesela VECTORIAL, en una capa que se
     llama `contours` y con el valor en la propiedad `value`. Pedida así
     devuelve 8.192 bytes de líneas.

     Así que van en su propia fuente vectorial, encima del color y debajo
     de los nombres del mapa. Tres capas:

       · isoBorde  — trazo claro por debajo, para que la línea se vea
                     igual sobre el fondo Claro que sobre el Oscuro.
       · isoLinea  — la isobara.
       · isoLbl    — su valor (1012, 1016…), que es lo que te dice de un
                     vistazo dónde está el anticiclón y dónde la borrasca.

     Los números salen de los glifos de CARTO, que son de fuera: sin
     cobertura se quedan las líneas sin etiquetar. Las líneas, que son el
     dato, se dibujan igual.                                            */
  isobaras(url) {
    try {
      if (this.map.getSource('isoSrc')) return;
      this.map.addSource('isoSrc', {
        type:'vector', tiles:[`${url}/{z}/{x}/{y}`], maxzoom:12 });
      const antes = this.firstLabelLayer();
      this.map.addLayer({ id:'isoBorde', type:'line', source:'isoSrc',
        'source-layer':'contours',
        layout:{ 'line-join':'round' },
        paint:{ 'line-color':'#ffffff', 'line-width':2.6, 'line-opacity':0.45 } }, antes);
      this.map.addLayer({ id:'isoLinea', type:'line', source:'isoSrc',
        'source-layer':'contours',
        layout:{ 'line-join':'round' },
        paint:{ 'line-color':'#1b2740', 'line-width':1.1, 'line-opacity':0.8 } }, antes);
      this.map.addLayer({ id:'isoLbl', type:'symbol', source:'isoSrc',
        'source-layer':'contours',
        layout:{ 'symbol-placement':'line', 'symbol-spacing':240,
                 'text-field':['to-string', ['get','value']], 'text-size':11,
                 'text-font':['Open Sans Bold','Arial Unicode MS Bold'],
                 'text-allow-overlap':false, 'text-padding':4 },
        paint:{ 'text-color':'#1b2740', 'text-halo-color':'#ffffff', 'text-halo-width':1.1 } },
        antes);
    } catch (e) {
      // Sin isobaras se sigue viendo el color: no se tira la capa entera.
      this.status('las isobaras no han podido dibujarse: ' + e.message);
    }
  },

  /* Quita TODAS las capas de datos antes de pintar la nueva.
     Antes cada capa solo se borraba a sí misma, y la lista de `apply()`
     se dejaba fuera el satélite y el radar de AEMET. Resultado, medido
     el 24-08-2026: pasando por Radar AEMET → Nubes → Ráfagas, el mapa
     enseñaba el eco del radar sobre el satélite mientras la leyenda
     ponía «Ráfagas · kt» y las ráfagas quedaban debajo, tapadas. Leer
     una capa creyendo que es otra es peor que no tener mapa. */
  quitarCapasDeDatos() {
    const CAPAS  = ['omLayer', 'omLayer2', 'radarLayer', 'satLayer', 'aemetLayer',
                    'isoLbl', 'isoLinea', 'isoBorde'];
    const FUENTES = ['omSrc', 'omSrc2', 'radarSrc', 'satSrc', 'aemetSrc', 'isoSrc'];
    CAPAS.forEach(id => { if (this.map.getLayer(id)) this.map.removeLayer(id); });
    FUENTES.forEach(id => { if (this.map.getSource(id)) this.map.removeSource(id); });
  },

  /* Dónde insertar el dato meteorológico dentro del mapa base.
     Tiene que quedar ENCIMA de todo lo que rellena (fondo, mar, terreno,
     manzanas) y DEBAJO de lo que orienta (fronteras, carreteras, nombres).

     Buscar «la primera línea de frontera» NO vale: el 24-08-2026 se
     comprobó que en el mapa de CARTO `boundary_county` va en la posición 9
     de 95, ANTES del relleno de agua y del terreno. La capa de ráfagas se
     insertaba ahí y quedaba enterrada bajo la cartografía: teselas
     descargadas, decodificadas y en color —comprobado, 512x512 y ni un
     píxel transparente— pero en pantalla el mapa salía en blanco. Ese es
     exactamente el fallo que no puede pasar: parecía que no soplaba nada.

     Lo que sí vale es mirar el ORDEN, no el nombre: se busca el último
     relleno del mapa base y se entra justo detrás. Así funciona con
     cualquier estilo (Claro, Color, Oscuro) sin depender de cómo se
     llamen sus capas. Las capas propias no cuentan, que si no cada una
     empujaría a la siguiente. */
  firstLabelLayer() {
    const ls = this.map.getStyle()?.layers || [];
    const PROPIAS = /^(omLayer2?|satLayer|radarLayer|aemetLayer|hillLayer)$/;
    const RELLENO = new Set(['background', 'fill', 'fill-extrusion', 'raster']);
    let ultimo = -1;
    ls.forEach((x, i) => { if (!PROPIAS.test(x.id) && RELLENO.has(x.type)) ultimo = i; });
    // Detrás del último relleno. Si no hubiera nada más, arriba del todo.
    return ls[ultimo + 1]?.id;
  },

  stamp() {
    const T = (this.usando?.meta ?? this.meta)?.valid_times ?? [];
    const iso = T[this.t];
    const st = document.querySelector('#mapStamp');
    if (!iso) { st.textContent = '—'; return; }
    const d = new Date(iso);
    st.textContent = d.toLocaleString('es', { weekday:'short', day:'2-digit', month:'short',
                                              hour:'2-digit', minute:'2-digit' });
    const ahora = this.t === this.nowIndex();
    st.style.color = ahora ? 'var(--go)' : '';
    st.title = ahora ? 'Hora actual' : 'Previsión';

    const usado = this.usando?.modelo ?? this.model;
    const metaUsada = this.usando?.meta ?? this.meta;
    const M = TMODELS.find(m => m.id === usado);
    const ref = metaUsada.reference_time
      ? new Date(metaUsada.reference_time).toLocaleString('es',
          { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
      : '—';
    const dias = (T.length && new Date(T[T.length-1]) - new Date(T[0])) / 864e5;
    this.status(`${M.name} · ${M.res} · pasada de las ${ref} · ${T.length} pasos (${dias.toFixed(0)} días)`
      + (this.usando?.sustituido ? ' · CAPA SUSTITUIDA' : ''));
  },

  /* ---------- El modelo no llega hasta donde él trabaja ──────────────
     MEDIDO el 26-08-2026. ICON-D2 está en la barra de modelos del mapa
     descrito como «DWD alemán de área limitada — 2 días, muy fino para
     tormentas · 2 km». Es el reclamo perfecto para Aitor, porque su veto
     es el rayo. Y NO cubre NINGUNO de sus doce emplazamientos.

     Comprobado por dos vías que coinciden:
       · la app, pulsando en Bermeo → «ICON-D2 no tiene valor de ráfagas
         en este punto»
       · la API de Open-Meteo con models=icon_d2 en Bermeo →
         «No data is available for this location»
       · y por puntos, 0 de 12 emplazamientos con dato.

     Lo grave no era eso: era que en el mapa se veía EUSKADI ENTERA EN
     BLANCO con la barra de estado diciendo lo de siempre —«ICON-D2 ·
     2 km · pasada de las 17:00 · 49 pasos»—, sin una palabra. El color
     empezaba en Cataluña. Un mapa en blanco encima de sus torres se lee
     como calma, que es exactamente la regla 2 rota. Solo se enteraba si
     pulsaba encima.

     NO vale mirar el BBOX del modelo: el de ICON-D2 es
     BBOX[43.18,-3.94,58.08,20.34] y Bermeo (43.41, -2.72) cae DENTRO,
     porque la rejilla va rotada y el borde de verdad es curvo. Hay que
     leer el valor en SU punto, que es lo que se hace aquí.

     Y si su emplazamiento no está a la vista, esto se calla: sin la
     tesela descargada, «sin dato» sería afirmar algo que no se ha
     mirado.                                                            */
  async avisoSinDominio(L_) {
    const el = document.querySelector('#mapSust');
    if (!el || !this.map || !L_?.v || !this.usando?.meta) return;
    if (el.dataset.k === 'sust' || el.dataset.k === 'noche') return;

    const p = (typeof S !== 'undefined') ? S.place : null;
    const quitar = () => {
      if (el.dataset.k === 'dominio') { el.hidden = true; el.dataset.k = ''; el.innerHTML = ''; }
    };
    /* ── SE MIRA SU SITIO, Y SI NO ESTÁ A LA VISTA, EL CENTRO ─────────
       Cazado el 01-09-2026 probando su idea de seguir tifones: con
       ICON-EU puesto y el mapa en Filipinas, **la app no decía nada** —
       mapa en blanco y la barra tan tranquila con «ICON-EU · 7 km». El
       aviso solo miraba su emplazamiento, y Bermeo no estaba en pantalla,
       así que se callaba.

       Un mapa en blanco se lee «aquí no hay viento», y es «este modelo no
       llega aquí». Es la regla 2 de esta app en la pantalla más grande.
       Ahora: si su sitio está a la vista, se mira su sitio; si no, el
       CENTRO de lo que está mirando. */
    const centro = this.map.getCenter();
    const enVista = p && p.lat != null && p.lon != null
                 && this.map.getBounds().contains([p.lon, p.lat]);
    const punto = enVista ? { lat: p.lat, lon: p.lon, suyo: true }
                          : { lat: centro.lat, lon: centro.lng, suyo: false };
    if (!Number.isFinite(punto.lat) || !Number.isFinite(punto.lon)) { quitar(); return; }

    const url = this.omUrl(L_.v, this.t, this.usando.modelo, this.usando.meta);
    if (!url) { quitar(); return; }

    // La lectura puntual solo funciona si la librería tiene ese fichero
    // abierto; si no, lanza «State not found for key» — que NO es «sin
    // dato», es «no lo he mirado». Así que primero se carga la tesela de
    // su punto, igual que hace consultar() al pulsar, y solo se avisa
    // cuando la lectura sale bien y de verdad no hay valor. Si ni así se
    // puede leer, esto se calla: afirmar un hueco sin haberlo comprobado
    // es el mismo fallo por el otro lado.
    const leer = () => OMWeatherMapLayer.getValueFromLatLong(punto.lat, punto.lon, limpiarMarca(url));
    let r = null;
    try { r = await leer(); } catch {
      const z = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
      const n = 2 ** z;
      const x = Math.floor((punto.lon + 180) / 360 * n);
      const y = Math.floor((1 - Math.asinh(Math.tan(punto.lat * Math.PI / 180)) / Math.PI) / 2 * n);
      try {
        await OMWeatherMapLayer.omProtocol(
          { url: `${url}/${z}/${x}/${y}`, type: 'image' }, new AbortController());
        r = await leer();
      } catch { return; }        // no se ha podido mirar: no se dice nada
    }
    const v = r?.value;
    if (v !== null && v !== undefined && !Number.isNaN(v)) { quitar(); return; }

    const mod = TMODELS.find(m => m.id === this.usando.modelo);
    el.hidden = false; el.dataset.k = 'dominio';
    /* El texto cambia según DÓNDE mira: su emplazamiento o media España
       de distancia. Y no se recomienda un modelo que tampoco llegue —
       antes decía «Para Euskadi: AROME HD…» aunque estuviera mirando
       Filipinas, que es un consejo inútil y encima confunde. */
    /* ── EL CONSEJO SE DECIDE POR DÓNDE ESTÁ, NO POR DE QUIÉN ES ────
       En su pantallazo del 01-09-2026 salía «ICON-EU no llega hasta
       Manila… Para Euskadi: AROME HD, ICON-EU, ARPEGE». Manila era su
       sitio ABIERTO, así que se trataba como «suyo» y le recomendaba
       modelos de aquí estando en Filipinas. El nombre del sitio sí sale
       de quién es; **el consejo sale de la geografía**.

       Él lo tenía claro antes que yo: *«yo, saliendo de Europa, miraré
       todo con GFS: es el mejor para esos lugares»*. */
    const dentroDeEuropa = punto.lat > 27 && punto.lat < 72
                        && punto.lon > -32 && punto.lon < 45;
    const donde = punto.suyo ? esc(p.name || 'tu emplazamiento') : 'lo que estás mirando';
    /* Los nombres salen de TMODELS, no escritos a mano: si un modelo se
       renombra, este texto le sigue. Lo exige el guardia
       `sin-modelos-a-mano.cjs`, y con razón — ya pasó con ICON-D2. */
    const nombresDe = ids => ids
      .map(id => TMODELS.find(m => m.id === id)?.name)
      .filter(Boolean).join(', ');
    /* GFS delante a propósito: es el americano y el que se mira para
       huracanes y tifones. Suyo, 01-09-2026: «creo que los expertos miran
       con GFS, el americano, siempre». */
    const globales = nombresDe(['ncep_gfs013', 'ncep_gfs025', 'ecmwf_ifs025', 'dwd_icon']);
    const europeos = nombresDe(['meteofrance_arome_france_hd', 'dwd_icon_eu',
                                'meteofrance_arpege_europe', 'ecmwf_ifs025']);
    el.innerHTML = `<b>${esc(mod?.name || this.usando.modelo)} no llega hasta ${donde}.</b> `
      + `El mapa sale en blanco ahí porque ese modelo no tiene dato, `
      + `<b>no porque no pase nada</b>. `
      + (dentroDeEuropa
          ? `Para Euskadi: ${europeos}.`
          : `Ese es de área limitada y aquí no llega. Fuera de Europa, <b>${globales}</b> — `
            + `y para huracanes y tifones, el primero.`);
  },

  /** Cartel visible cuando la capa NO viene del modelo que elegiste. */
  /** Teselas que el servidor no ha llegado a servir.
   *
   *  Se avisa SIEMPRE. Un hueco sin pintar no significa que no haya
   *  fenómeno: puede ser que no haya llegado el dato, y eso hay que
   *  saberlo antes de mandar a nadie a trabajar en altura.           */
  avisoTeselas(fallos) {
    const el = document.querySelector('#mapFallos');
    if (!el) return;
    if (this._sinMemoria) return;          // hay un aviso más grave puesto
    if (this._avisoRecarga) return;        // "me he recargado solo": no pisarlo
    /* ── Y NO SE DICE DOS VECES ─────────────────────────────────────
       Cazado con su pantallazo del móvil del 31-08-2026 a las 00:14:
       los DOS carteles a la vez, montados uno sobre otro y sobre los
       mandos de la hora, tapando el mapa entero y sin poder leer
       ninguno de los dos.

       Y el segundo es consecuencia del primero: si el modelo no llega
       hasta su sitio —el cartel de arriba—, **claro que faltan trozos**.
       Contarlo aparte no añade nada y encima esconde el que sí explica
       lo que pasa. Es la misma regla que ya rige en `Petardazo` con los
       errores de teselas y en `assess()` con las frases de tormenta:
       una sola frase por cosa. */
    const dom = document.querySelector('#mapSust');
    if (dom && !dom.hidden && dom.dataset.k === 'dominio') {
      el.hidden = true; el.innerHTML = '';
      return;
    }
    if (!fallos) { el.hidden = true; el.innerHTML = ''; return; }
    if (this._fallosCerrados) return;      // lo ha cerrado él a mano
    el.hidden = false;
    // "Tesela" es jerga. El mapa se descarga a cuadros y lo que falla es
    // un cuadro; se dice así, que es lo que se ve en pantalla.
    el.innerHTML = `<b>${fallos} trozo${fallos > 1 ? 's' : ''} del mapa sin cargar.</b>
      Donde no hay color puede ser que no haya llegado el dato, no que no pase nada.
      <span class="msust__acc"><button type="button" data-acc="reintentar">Reintentar</button><button
        type="button" data-acc="cerrar" aria-label="Cerrar aviso">✕</button></span>`;
    el.onclick = (ev) => {
      const acc = ev.target.closest('[data-acc]')?.dataset.acc;
      if (acc === 'cerrar')     { this._fallosCerrados = true; this.avisoTeselas(0); }
      if (acc === 'reintentar') { this.recargarCapa(); }
    };
  },

  /** Vuelve a pedir la capa desde cero, borrando lo que ya hay pintado. */
  recargarCapa() {
    this._fallosCerrados = false;
    Peticiones.reset();
    this._fuente = null;
    this.apply();
  },

  avisoSustitucion(modeloAlt) {
    const el = document.querySelector('#mapSust');
    if (!el) return;
    if (!modeloAlt) {
      // No se borra el cartel de «cargando»: ese lo quita quien lo puso.
      if (el.dataset.k === 'carga') return;
      el.hidden = true; el.innerHTML = ''; el.dataset.k = '';
      return;
    }
    const alt = TMODELS.find(m => m.id === modeloAlt);
    const sel = TMODELS.find(m => m.id === this.model);
    el.hidden = false; el.dataset.k = 'sust';
    el.innerHTML = `<b>Ojo:</b> esta capa no la publica <b>${esc(sel?.name || this.model)}</b>.
      Se está mostrando con <b>${esc(alt?.name || modeloAlt)}</b>${alt?.res ? ` · ${alt.res}` : ''}.`;
  },

  /* ---------- Que un mapa vacío no parezca «aquí no pasa nada» ────────
     MEDIDO el 24-08-2026: el punto de rocío con ECMWF HRES tarda cerca de
     40 segundos en pintar. No está roto —su rejilla son 6,6 millones de
     puntos y solo se descargan 2 teselas a la vez, que es lo que evita el
     Aborted(OOM)—, pero durante esos 40 s el mapa se queda BLANCO y sin
     decir nada. Aitor le hizo una foto creyendo que la capa fallaba.

     Un hueco callado en una app con la que se decide subir a una torre es
     el fallo de siempre: no sabes si es que no hay dato o es que no ha
     llegado. Así que mientras faltan teselas, se dice.                  */
  cargando(on, texto) {
    const el = document.querySelector('#mapSust');
    if (!el) return;
    if (on) {
      // 'dominio' («este modelo no llega hasta aquí») es más grave que
      // «cargando»: si se pisa, vuelve a parecer que solo falta esperar.
      if (el.dataset.k === 'sust' || el.dataset.k === 'noche'
          || el.dataset.k === 'dominio') return;  // ya hay aviso
      el.hidden = false; el.dataset.k = 'carga'; el.innerHTML = texto;
    } else if (el.dataset.k === 'carga') {
      el.hidden = true; el.dataset.k = ''; el.innerHTML = '';
    }
  },

  /** Modelos de rejilla grande: son los que se hacen esperar de verdad. */
  /** Vigila las teselas de la capa y avisa mientras no estén todas. */
  vigilarCarga(L_) {
    clearInterval(this._relojCarga);
    if (!this.map || !L_) return;
    const mod = TMODELS.find(m => m.id === (this.usando?.modelo ?? this.model));
    const listo = () => {
      const sc = this.map.style?.sourceCaches?.omSrc;
      const t = sc ? Object.values(sc._tiles || {}) : [];
      return t.length > 0 && t.every(x => x.state === 'loaded' || x.state === 'errored');
    };
    if (listo()) { this.cargando(false); this.avisoSinDominio(L_);
      return; }
    let visto = 0;                 // milisegundos con la pestaña DELANTE
    let ultimo = Date.now();
    const pinta = () => {
      const seg = Math.round(visto / 1000);
      // Lo de «tarda» solo se dice de los que de verdad tardan. MEDIDO el
      // 24-08-2026: ECMWF HRES cerca de 40 s con el punto de rocío, por su
      // rejilla de 6,6 millones de puntos. ICON-EU va en 2 s.
      const lento = LENTOS.has(mod?.id) ? ` ${esc(mod.name)} es de los que más tardan.` : '';
      this.cargando(true,
        `<b>Cargando ${esc(L_.name)}…</b> ${seg} s.${lento} `
        + `<b>El mapa está vacío porque aún no ha llegado el dato, no porque no lo haya.</b>`);
    };
    // Nada de parpadeos: si la capa entra rápida, el cartel no llega a
    // salir. Solo aparece cuando de verdad se está haciendo esperar.
    const ESPERA_MIN = 1500;
    this._relojCarga = setInterval(() => {
      // Solo cuenta el tiempo con la pestaña a la vista. Si te vas a por
      // un café, el navegador congela las descargas: contar ese rato
      // haría saltar el aviso de «no ha llegado» sin que pase nada.
      const ahora = Date.now();
      if (!document.hidden) visto += ahora - ultimo;
      ultimo = ahora;
      if (listo()) {
        clearInterval(this._relojCarga);
        this.cargando(false);
        this.avisoSinDominio(L_);
        return;
      }
      if (visto < ESPERA_MIN) return;
      if (visto > 120000) {
        clearInterval(this._relojCarga);
        this.cargando(true, `<b>Esta capa no ha llegado en 2 minutos.</b> `
          + `Prueba con otro modelo o dale a Reintentar. `
          + `<b>No des por bueno un mapa vacío.</b>`);
        return;
      }
      pinta();
    }, 1000);
  },

  /** Suelta los bloques ya descodificados que la librería guarda dentro.
   *
   *  CAUSA DEL OOM: la librería mantiene un Map de ficheros abiertos y sus
   *  bloques descomprimidos, y NUNCA lo vaciaba nadie. Cada capa y cada
   *  modelo abren ficheros distintos, así que encadenando capas la memoria
   *  del WebAssembly solo subía hasta reventar con Aborted(OOM).
   *
   *  Se vacía al cambiar de capa o de modelo, no al mover la hora: dentro
   *  de una misma capa esos bloques son justo lo que hace que el
   *  deslizador vaya rápido, y la velocidad es prioridad. Al cambiar de
   *  capa, en cambio, no vale ni uno: son otros ficheros.               */
  async soltarMemoria() {
    /* ── SOLO SE VACÍA CUANDO HACE FALTA DE VERDAD ───────────────────
       Cazado el 31-08-2026 cronometrando su queja («cargando, se tira
       un café»): la limpieza total al cambiar de capa TAMBIÉN borraba
       lo que el precalentado del ratón acababa de bajar — el clic
       llegaba con la despensa recién vaciada, y volver a una capa ya
       vista se pagaba entera otra vez.

       La caché está topada en 8 MB desde el 23-08, así que dejarla
       viva no es el OOM del pasado: aquel lo disparaba ECMWF HRES
       (6,6 millones de puntos). Se vacía solo con HRES delante o si ya
       ha faltado memoria; con los modelos ligeros se conserva, y volver
       a una capa vista o clicar tras el precalentado es casi gratis. */
    if (this.model !== 'ecmwf_ifs' && !this._sinMemoria) return;
    try { await OMWeatherMapLayer.clearBlockCache?.(); } catch {}
  },

  /** Vigila si el descodificador del mapa se queda sin memoria.
   *
   *  MEDIDO (23 ago 2026, tras encadenar muchos cambios de capa y de hora):
   *  la consola escupe `Aborted(OOM)` desde el WebAssembly de la librería
   *  de Open-Meteo. El montón de JavaScript estaba en 98 MB de 4 GB, así
   *  que no es memoria del navegador: es la del propio descodificador.
   *
   *  Lo peligroso no es el fallo, es cómo se presentaba: a partir de ahí
   *  NINGUNA tesela vuelve a pintarse, pero la app seguía enseñando la
   *  capa anterior, con su hora y su leyenda, como si todo fuese bien.
   *  Un mapa en blanco que parece "aquí no pasa nada" es exactamente lo
   *  que no puede ocurrir en una herramienta con la que se decide subir
   *  a una torre. Así que se dice, se dice fuerte, y se ofrece recargar. */
  vigilarMemoria() {
    if (this._vigilandoMem) return;
    this._vigilandoMem = true;
    const esOOM = (m) => /aborted\(oom\)|out of memory|memory access out of bounds/i.test(String(m || ''));
    const caer = (m) => { if (esOOM(m)) this.avisoSinMemoria(); };
    window.addEventListener('error', (e) => caer(e?.message || e?.error?.message));
    window.addEventListener('unhandledrejection', (e) => caer(e?.reason?.message || e?.reason));
    // La librería aborta escribiendo por consola, sin lanzar nada que se
    // pueda capturar, así que también se escucha ahí.
    const orig = console.error;
    console.error = (...a) => { try { caer(a.join(' ')); } catch {} return orig.apply(console, a); };
  },

  /** Cartel de "el mapa ha dejado de pintar", y recuperación sola.
   *
   *  Cuando el WebAssembly aborta no hay vuelta atrás dentro de la página:
   *  el módulo queda muerto y ninguna tesela vuelve a descodificarse. La
   *  única cura real es recargar. Así que se recarga solo, guardando capa,
   *  modelo y hora, y al volver se le dice lo que ha pasado.
   *
   *  Se recarga como mucho DOS veces por sesión. Si a la tercera sigue
   *  cayendo, se para y se le dice a las claras que cambie de modelo: una
   *  app que se recarga en bucle mientras alguien decide si sube a una
   *  torre es peor que una app que reconoce que no puede.               */
  avisoSinMemoria() {
    if (this._sinMemoria) return;
    this._sinMemoria = true;

    /* MARCHA ATRÁS: si ha faltado memoria, se descodifica de una en una
       menos a partir de ahora, y se recuerda entre sesiones. Así el que
       lo sufra una vez no lo vuelve a sufrir, sin tener que tocar nada.
       Nunca baja de 1. */
    try {
      const ahora = Peticiones.max;
      const menos = Math.max(1, ahora - 1);
      if (menos < ahora) {
        localStorage.setItem('torre.teselasALaVez', String(menos));
        localStorage.setItem('torre.oomCuando', String(Date.now()));
        Peticiones.max = menos;
      }
    } catch { /* si no se puede guardar, al menos baja en esta sesión */ }
    const el = document.querySelector('#mapFallos');
    if (!el) return;
    el.hidden = false;
    el.classList.add('msust--muerto');

    let veces = 0;
    try { veces = +(sessionStorage.getItem('om_recargas') || 0); } catch {}

    if (veces < 2) {
      try {
        const h = this.horaMirada();
        if (h) sessionStorage.setItem('om_hora', h.toISOString());
        sessionStorage.setItem('om_vista', LS.get('view', 'models'));
        sessionStorage.setItem('om_recargas', String(veces + 1));
        sessionStorage.setItem('om_aviso', '1');
      } catch {}
      el.innerHTML = `<b>El mapa se ha quedado sin memoria.</b>
        Recargando para arreglarlo — vuelves a la misma capa y a la misma hora.`;
      setTimeout(() => location.reload(), 1600);
      return;
    }

    /* ── A LA SEGUNDA CAÍDA NO SE SUGIERE: SE ACTÚA ──────────────────
       Suyo, 31-08-2026, con el cartel delante y el mapa cayéndose por
       tercera vez: *«intolerable»* · *«así no, eh»*. Y tiene razón: el
       cartel le pedía A ÉL que pulsara ICON-EU mientras la app seguía
       intentando lo que ya sabía que la tumbaba. Una herramienta seria
       se defiende sola.

       MEDIDO el 30-08 en su máquina: ECMWF HRES tumba el mapa a la 5.ª
       capa; ICON-EU aguantó 9 sin caer. Así que a la segunda recarga se
       pasa SOLO a ICON-EU, se dice bien claro, y ECMWF HRES sigue en la
       barra por si lo quiere a propósito. */
    if (this.model === 'ecmwf_ifs') {
      try {
        LS.set('tmodel', 'dwd_icon_eu');
        const h = this.horaMirada();
        if (h) sessionStorage.setItem('om_hora', h.toISOString());
        sessionStorage.setItem('om_vista', LS.get('view', 'models'));
        sessionStorage.setItem('om_recargas', '0');
        sessionStorage.setItem('om_cambiado', '1');
      } catch {}
      el.innerHTML = `<b>ECMWF HRES ha tumbado el mapa dos veces: te paso a ICON-EU,</b>
        que aguanta y es más fino aquí (7 km). ECMWF HRES sigue en la barra si lo quieres.`;
      setTimeout(() => location.reload(), 1800);
      return;
    }

    el.innerHTML = `<b>El mapa se ha vuelto a quedar sin memoria y ha dejado de dibujar.</b>
      Ya se ha recargado dos veces y sigue cayendo. Lo que ves puede estar
      incompleto: <b>no decidas con esto</b>. Prueba con <b>ICON-EU</b> o
      <b>AROME HD</b>, que gastan mucha menos memoria que ECMWF HRES.
      <span class="msust__acc"><button type="button" data-acc="recargar">Recargar igualmente</button></span>`;
    el.onclick = (ev) => {
      if (ev.target.closest('[data-acc]')?.dataset.acc === 'recargar') {
        try { sessionStorage.setItem('om_recargas', '0'); } catch {}
        location.reload();
      }
    };
  },

  /** Al volver de una recarga por falta de memoria: misma hora y aviso. */
  recuperarTrasRecarga() {
    let iso = null, aviso = false, cambiado = false;
    try {
      iso = sessionStorage.getItem('om_hora');
      aviso = sessionStorage.getItem('om_aviso') === '1';
      cambiado = sessionStorage.getItem('om_cambiado') === '1';
      sessionStorage.removeItem('om_hora');
      sessionStorage.removeItem('om_aviso');
      sessionStorage.removeItem('om_cambiado');
    } catch {}
    if (iso) { const d = new Date(iso); if (!isNaN(d)) this.horaPedida = d; }

    /* ── SI SE LE CAMBIÓ EL MODELO, SE LE DICE AL VOLVER ──────────────
       `om_cambiado` se escribía y NO LO LEÍA NADIE: el cartel de «te paso
       a ICON-EU» duraba 1,8 s antes de la recarga y al volver no quedaba
       rastro — si estaba mirando otra cosa, se encontraba en otro modelo
       sin saber por qué. Es el patrón de `fueraDeRango()` declarado y sin
       llamar, y lo cazó el guardia nuevo de «nada se queda obsoleto» en
       su primer arranque (31-08-2026, con él delante). */
    if (cambiado) {
      const elC = document.querySelector('#mapFallos');
      if (elC) {
        this._avisoRecarga = true;
        setTimeout(() => { this._avisoRecarga = false;
          if (elC.textContent.includes('te he pasado')) { elC.hidden = true; elC.innerHTML = ''; }
        }, 25000);
        elC.hidden = false;
        elC.innerHTML = `<b>Tumbó el mapa dos veces por memoria, así que te he pasado a otro modelo.</b>
          Estás en la misma capa y en la misma hora. El de antes sigue en la barra si lo quieres.
          <span class="msust__acc"><button type="button" data-acc="cerrar" aria-label="Cerrar aviso">✕</button></span>`;
        elC.onclick = (ev) => {
          if (ev.target.closest('[data-acc]')?.dataset.acc === 'cerrar') {
            this._avisoRecarga = false; elC.hidden = true; elC.innerHTML = '';
          }
        };
      }
      return;
    }
    if (!aviso) return;
    const el = document.querySelector('#mapFallos');
    if (!el) return;
    this._avisoRecarga = true;
    // Se queda 25 segundos: lo justo para leerlo sin estorbar el mapa
    setTimeout(() => {
      this._avisoRecarga = false;
      if (el.textContent.includes('recargado solo')) { el.hidden = true; el.innerHTML = ''; }
    }, 25000);
    el.hidden = false;
    el.innerHTML = `<b>El mapa se había quedado sin memoria y se ha recargado solo.</b>
      Estás en la misma capa y en la misma hora. Ya está dibujando de nuevo.
      <span class="msust__acc"><button type="button" data-acc="cerrar" aria-label="Cerrar aviso">✕</button></span>`;
    el.onclick = (ev) => {
      if (ev.target.closest('[data-acc]')?.dataset.acc === 'cerrar') {
        this._avisoRecarga = false; el.hidden = true; el.innerHTML = '';
      }
    };
  },

  /** Cierra los globitos de consulta abiertos.
   *
   *  Uno de la capa anterior es un dato falso: llegó a verse "4081 m ·
   *  Isocero" con la capa de Viento 10 m ya puesta.                   */
  cerrarPopups() {
    (this._pops ||= []).forEach(p => { try { p.remove(); } catch {} });
    this._pops = [];
  },

  /** El catálogo del modelo (latest.json) no ha llegado tras varios
   *  intentos. Como se pide DIRECTO al origen S3 de Open-Meteo, si esa red
   *  falla el mapa no arranca. En vez de un "Failed to fetch" mudo abajo,
   *  se dice claro y se da un botón para reintentar SIN recargar la app. */
  avisoModeloCaido(e) {
    const el = document.querySelector('#mapFallos');
    if (!el) return;
    this._modeloCaido = true;
    const msg = String(e?.message || '');
    const red = /fetch|network|failed|load failed|timeout|abort/i.test(msg);
    /* ── DE QUIÉN ES EL FALLO, DICHO CON SU NOMBRE ──────────────────
       Suyo, 04-09-2026 a las 16:12, con el mapa en blanco y teniendo que
       irse a Windy: *«tener que mirar en otra app teniendo el mío,
       porque no va»*, *«ni mirar mi mapa puedo, qué tristeza»*, *«se
       repara una cosa y se jode otra»*.

       Y esa vez **no se había roto nada aquí**: `map-tiles.open-meteo.com`
       no respondía —ni desde su móvil ni desde Vercel—, mientras
       `api.open-meteo.com` iba perfecta. El fichero del mapa llevaba sin
       tocarse desde el 24-08.

       Pero el cartel decía «el servicio de mapas ha respondido con un
       error», que no dice de QUIÉN es el servicio. Y cuando lleva una
       mañana entera saliendo fallos, un aviso así se lee como «otra
       más», y encima le deja pensando que igual es su cobertura.

       Un 502/503/504 es del servidor de enfrente. Se dice, se dice que
       el resto de la app sigue en pie, y se le manda a Windy sin
       vergüenza: mejor que se quede sin mirar el cielo. */
    const caido = /50[0234]|internal error|no se ha podido llegar|bad gateway/i.test(msg);
    el.hidden = false;
    el.classList.remove('msust--muerto');
    el.innerHTML = `<b>No se ha podido leer el modelo.</b> `
      + (caido
          ? `<b>El servidor de mapas de Open-Meteo no contesta</b> — no es tu cobertura ni un fallo de esta app: la cartografía la sirven ellos y ahora mismo está caída. <b>El resto de la app sigue funcionando</b> (Ahora, Horas, 10 días, Radar y Rayos van por otra vía). Para ver capas mientras tanto, Windy tiene servidores propios. `
          : red
          ? `No se ha llegado a <b>openmeteo.s3.amazonaws.com</b> — la cartografía se pide directa al origen de Open-Meteo, no por esta app. Suele ser cobertura floja o el servidor. `
          : `El servicio de mapas ha respondido con un error. `)
      + `<span class="msust__acc"><button type="button" data-acc="remodelo">Reintentar</button></span>`;
    el.onclick = (ev) => {
      if (ev.target.closest('[data-acc]')?.dataset.acc === 'remodelo') {
        el.hidden = true; el.innerHTML = ''; el.onclick = null;
        this.status('leyendo modelo…');
        this.loadMeta();
      }
    };
  },

  /** Quita el aviso anterior cuando una lectura posterior SÍ funciona.
   *  No toca el cartel de "sin memoria" (msust--muerto), que es otra cosa. */
  ocultarModeloCaido() {
    if (!this._modeloCaido) return;
    this._modeloCaido = false;
    const el = document.querySelector('#mapFallos');
    if (el && !el.classList.contains('msust--muerto')) {
      el.hidden = true; el.innerHTML = ''; el.onclick = null;
    }
  },

  /* La barra de estado lleva DOS cosas y no pueden pisarse:
     el modelo y su pasada (lo de siempre), y el aviso de que un número
     de la capa es imposible. `status()` puede llamarse después de
     `valores()`, así que el aviso se guarda aparte y se vuelve a poner
     cada vez que se reescribe la línea. */
  status(t) {
    this._statusBase = t;
    const e = document.querySelector('#mapStatus');
    if (e) e.textContent = this._avisoRango ? `${t} · ${this._avisoRango}` : t;
  },

  /** Pone o quita el aviso de valor imposible sin tocar el resto de la línea. */
  avisoRango(txt) {
    if ((this._avisoRango || null) === (txt || null)) return;
    this._avisoRango = txt || null;
    this.status(this._statusBase ?? '');
  },




  /* ---------- Precarga ----------
     Cada hora del modelo es un fichero distinto en el servidor: al
     moverte había que descargarlo y descodificarlo entero, y se notaba
     mucho. Aquí se piden por lo bajo las horas de alrededor de la que
     estás viendo, para que al pulsar ◀ ▶ o arrastrar ya estén listas.
     Solo se piden las teselas que caben en pantalla.                 */

  tilesVisibles(z) {
    const b = this.map.getBounds();
    const n = 2 ** z;
    const x1 = Math.floor((b.getWest()  + 180) / 360 * n);
    const x2 = Math.floor((b.getEast()  + 180) / 360 * n);
    const y1 = Math.floor((1 - Math.asinh(Math.tan(b.getNorth() * Math.PI/180)) / Math.PI) / 2 * n);
    const y2 = Math.floor((1 - Math.asinh(Math.tan(b.getSouth() * Math.PI/180)) / Math.PI) / 2 * n);
    const out = [];
    for (let x = Math.max(0,x1); x <= Math.min(n-1,x2); x++)
      for (let y = Math.max(0,y1); y <= Math.min(n-1,y2); y++) out.push([x,y]);
    return out;
  },

  /** Cancela la precarga. SOLO al cambiar de capa o de modelo: lo ya
   *  pedido para otras horas de la misma capa sigue sirviendo. */
  cancelarPrecarga() {
    if (this._ac) { try { this._ac.abort(); } catch {} this._ac = null; }
    clearTimeout(this._pre);
    this._pedidas = new Set();
    this._enCurso = 0;
    this._cola = [];
  },

  /** Precarga en la DIRECCIÓN en la que te estás moviendo.
   *
   *  Antes se abortaba todo en cada paso, así que al pulsar ▶ varias
   *  veces seguidas se cancelaba precisamente la hora que ibas a ver a
   *  continuación y había que descargarla de cero: de ahí las esperas.
   *  Ahora no se aborta nada, no se pide dos veces lo mismo y como
   *  mucho hay 4 descargas simultáneas.                              */
  /** Calienta el fichero de las horas siguientes.
   *
   *  MEDIDO: abrir por primera vez el .om de una hora cuesta unos 9 s
   *  (son ficheros de ~42 MB y hay que leer su índice). Una vez abierto,
   *  cualquier otra tesela de esa misma hora tarda ~0,35 s.
   *
   *  Por eso aquí se pide UNA SOLA tesela de cada hora próxima: con eso
   *  el fichero queda abierto y al llegar allí ya no se espera. Pedir
   *  nueve teselas por hora, como se hacía antes, solo servía para
   *  saturar la conexión.                                              */
  precargar(dir = 1) {
    const L_ = TLAYERS.find(l => l.id === this.layer);
    if (!L_?.v || !this.usando || !this.map) return;
    clearTimeout(this._pre);
    this._pre = setTimeout(() => {
      const R = this.usando;
      const total = R.meta.valid_times.length;
      const d = dir >= 0 ? 1 : -1;
      const z = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
      const centro = this.tilesVisibles(z)[0];
      if (!centro) return;
      if (!this._ac) this._ac = new AbortController();
      this._pedidas ??= new Set(); this._cola ??= []; this._enCurso ??= 0;

      const idx = this._idx ?? this.indices();
      const pos = this._pos ?? 0;
      /* MEDIDO OTRA VEZ el 31-08-2026, cronómetro en mano sobre lo
         publicado (ECMWF 25 km + T850), porque él lo sufría: «mueves 1
         hora, esperas 10 segundos».

           · pasos seguidos con el deslizador: 1,7 s y 0,4 s  ← bien
           · tras 9 s quieto mirando el mapa:  5,3 s          ← ¡PEOR!

         La versión anterior calentaba OCHO horas hacia delante (nota del
         22-08 abajo), pero solo la tesela del CENTRO de cada una, y la
         caché de bloques está topada en 8 MB desde el 23-08: al calentar
         la octava hora, expulsaba los bloques de la primera — justo la
         que ibas a pedir. Cuanto más aire le dabas, más se saboteaba.

         Ahora se calienta POCO Y BIEN: la hora siguiente ENTERA (todas
         las teselas que estás viendo, que es lo que el mapa va a pedir),
         la de detrás por si vuelves, y solo el centro de la siguiente.
         Cabe en la caché y es lo que el dedo va a tocar. */
      const visibles = this.tilesVisibles(z);
      const pedir = (t, tiles) => {
        const u = this.omUrl(L_.v, t, R.modelo, R.meta);
        if (!u) return;
        for (const xy of tiles) {
          const k = `${u}/${z}/${xy[0]}/${xy[1]}`;
          if (this._pedidas.has(k)) continue;
          this._pedidas.add(k);
          this._cola.push(k);
        }
      };
      const en = off => { const t = idx[pos + off]; return (t === undefined || t < 0 || t >= total) ? null : t; };
      if (en(d)  !== null) pedir(en(d),  visibles);          // la siguiente, entera
      if (en(-d) !== null) pedir(en(-d), visibles.slice(0, 2)); // la de detrás, casi
      if (en(2*d) !== null) pedir(en(2*d), [centro]);        // la de después, el centro
      if (this._pedidas.size > 400) this._pedidas = new Set();
      this.bombear();
    }, 500);
  },

  /* ── PRECALENTAR OTROS MODELOS: PROBADO Y RETIRADO (31-08-2026) ─────
     La idea era buena y encajaba: si el CDN sirve helado el fichero de un
     modelo la primera vez (10,3 s medidos), tocarlo de antemano con una
     tesela debería dejarlo caliente. Se montó, se publicó y SE MIDIÓ en
     su propio navegador. Resultado:

         ARPEGE en frío, ANTES del precalentado ......  10,3 s
         ARPEGE con el precalentado puesto ...........  20,1 s   ← PEOR
         ICON-EU, que iba a 1,2 s .................... 20,7 s   ← PEOR

     O sea que **empeoraba todo**: una tesela suelta no calienta un
     fichero de 32 MB en el origen —la librería pide decenas de rangos—,
     y mientras tanto la cola de precarga compite con lo que él está
     mirando y desaloja los bloques de la caché (topada en 8 MB desde el
     23-08). Retirado el mismo día, con los números apuntados para que no
     se le ocurra a nadie más.

     LO QUE SÍ FUNCIONÓ hoy y se queda: precarga de la hora siguiente
     ENTERA (el cursor pasó de 5-10 s a ~1 s), caché que solo se vacía con
     el modelo pesado, y arranque en ICON-EU.

     Lo que queda por probar para el modelo frío, en este orden: (a) pedir
     el .om con Range de la CABECERA completa (los primeros ~256 KB traen
     el índice, que es lo que la librería relee) en vez de una tesela;
     (b) si (a) tampoco, aceptar que es del origen y avisarlo en el cartel
     de carga —que ya distingue modelos LENTOS— sin fingir que se arregla. */
  bombear() {
    // De dos en dos: una sola iba demasiado lenta para adelantarse al dedo,
    // y más de dos empiezan a estorbar a las teselas que se están viendo.
    const LIMITE = 2;
    while (this._enCurso < LIMITE && this._cola.length) {
      const u = this._cola.shift();
      this._enCurso++;
      OMWeatherMapLayer.omProtocol({ url: u, type: 'image' }, this._ac)
        .catch(() => {})
        .then(() => { this._enCurso--; this.bombear(); });
    }
  },


  /* ---------- Valores sobre el mapa ----------
     Números del modelo en las ciudades visibles, como en un visor
     profesional. Se leen con la misma función que usa la consulta al
     pulsar: son valores del modelo, no etiquetas decorativas. Si un
     punto no tiene dato, no se pinta nada — no se rellena con el vecino. */

  async valores() {
    if (!this.map || !this.meta || !this.verValores) { this.limpiarValores(); return; }
    const L_ = TLAYERS.find(l => l.id === this.layer);
    if (!L_?.v || L_.id === 'radar') { this.limpiarValores(); return; }
    const R = this.usando;
    const url = this.omUrl(L_.v, this.t, R?.modelo, R?.meta);
    if (!url) return;
    /* Turno: si mientras se descodifican las teselas (segundos) el
       usuario cambia de hora, capa o modelo, esta pasada ya no vale y
       NO debe pintar. Sin esto, la pasada vieja podía terminar después
       de la nueva y dejar los números de otra hora bajo el sello de
       esta (10-09-2026). */
    const turno = (this._turnoVal = (this._turnoVal || 0) + 1);
    const vigente = () => turno === this._turnoVal && url === this.omUrl(L_.v, this.t, this.usando?.modelo, this.usando?.meta);

    // Ciudades que el propio mapa base ya está etiquetando
    let puntos = [];
    try {
      const feats = this.map.queryRenderedFeatures({ layers: this.capasEtiqueta() });
      const vistos = new Set();
      for (const f of feats) {
        const nom = f.properties?.name;
        if (!nom || vistos.has(nom)) continue;
        if (f.geometry?.type !== 'Point') continue;
        vistos.add(nom);
        puntos.push({ nom, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] });
        if (puntos.length >= 26) break;
      }
    } catch { puntos = []; }

    // Si el mapa no da ciudades (poco zoom, estilo sin etiquetas…), se
    // reparten los valores en una rejilla regular sobre lo que se ve.
    if (puntos.length < 6) {
      const c = this.map.getCanvas();
      const W = c.clientWidth, H = c.clientHeight;
      // Mapa sin tamaño (pestaña oculta, candado puesto): no hay dónde
      // repartir puntos; sin esto salían seis etiquetas iguales en (0,0).
      if (!W || !H) { this.limpiarValores(); return; }
      const cols = Math.max(3, Math.min(7, Math.round(W / 190)));
      const filas = Math.max(2, Math.min(6, Math.round(H / 170)));
      puntos = [];
      for (let i = 1; i <= cols; i++) {
        for (let j = 1; j <= filas; j++) {
          const px = W * i / (cols + 1), py = H * j / (filas + 1);
          const ll = this.map.unproject([px, py]);
          puntos.push({ nom: '', lat: ll.lat, lng: ll.lng });
        }
      }
    }
    if (!puntos.length) { this.limpiarValores(); return; }

    const e = this.escala();
    const f = e?.factor ?? 1;
    // Algunas capas no se leen en las unidades de la tesela (pascales →
    // hPa, metros → km, mm/h → dBZ). Se convierte SIEMPRE con el mismo
    // conversor que usa la escala, para que el número y el color cuadren.
    const aTexto = v => e?.conv ? e.conv(v) : v * f;
    const dec = (e?.unidad === 'm' || e?.unidad === 'mm') ? 1 : 0;

    const cap = document.querySelector('#mapVals');
    if (!cap) return;
    const frag = [];
    // Asegurar que las teselas visibles están descodificadas: si no, la
    // lectura puntual devolvería nulo y no saldría ningún número.
    const zc = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
    await Promise.all(this.tilesVisibles(zc).slice(0, 9).map(([x, y]) =>
      OMWeatherMapLayer.omProtocol({ url: `${url}/${zc}/${x}/${y}`, type: 'image' },
        new AbortController()).catch(() => {})));
    if (!vigente()) return;

    // Lo peor que puede hacer una capa NO es quedarse en blanco: es dar
    // un número creíble y equivocado. El 24-08-2026 la Presión ponía
    // «10 hPa» en toda Europa —la tesela había pasado de pascales a hPa y
    // la app seguía dividiendo por 100— y no saltó ningún error, porque
    // no lo había: había un número. Aquí se compara CADA valor con lo
    // posible en la Tierra, y el peor se canta en la barra de estado.
    let imposible = null;
    for (const p of puntos) {
      let v = null;
      try { v = (await OMWeatherMapLayer.getValueFromLatLong(p.lat, p.lng, limpiarMarca(url)))?.value; } catch {}
      if (!vigente()) return;
      if (!valorReal(v, L_)) continue;
      const pt = this.map.project([p.lng, p.lat]);
      const simbolo = e?.unidad === '°C' ? '°' : '';
      const txt = aTexto(v);
      imposible ||= fueraDeRango(L_, txt);
      const d = Math.abs(txt) >= 100 ? 0 : dec;
      frag.push(`<span class="mval" style="left:${pt.x.toFixed(0)}px;top:${pt.y.toFixed(0)}px">${txt.toFixed(d)}${simbolo}</span>`);
    }
    if (!vigente()) return;
    cap.innerHTML = frag.join('');
    this.avisoRango(imposible);
  },

  capasEtiqueta() {
    return (this.map.getStyle().layers || [])
      .filter(l => l.type === 'symbol' && /place|city|town|village/i.test(l.id))
      .map(l => l.id);
  },

  limpiarValores() {
    const c = document.querySelector('#mapVals'); if (c) c.innerHTML = '';
    // Sin números leídos no hay nada comprobado: el aviso de la capa
    // anterior no puede quedarse colgado bajo otra etiqueta.
    this.avisoRango(null);
  },

  /* ---------- Relieve y mar ----------
     Sombreado del terreno de Esri/USGS por debajo del dato del modelo:
     en trabajo de monte importa ver dónde está el cordal y dónde el
     valle, porque el viento no es el mismo. El mar se tiñe de azul
     porque los mapas base claros lo dejan casi blanco y no se
     distingue de la tierra.                                          */

  relieve() {
    if (!this.map || !this.terrain) return;
    try {
      if (!this.map.getSource('hillSrc')) {
        this.map.addSource('hillSrc', {
          type:'raster', tileSize:256, maxzoom:14,
          tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'],
          attribution:'Sombreado del terreno © Esri, USGS',
        });
      }
      if (!this.map.getLayer('hillLayer')) {
        // Justo encima del agua/tierra del mapa base, debajo de todo lo demás
        const ls = this.map.getStyle().layers || [];
        const primeraLinea = ls.find(l => l.type === 'line' || l.type === 'symbol');
        this.map.addLayer({
          id:'hillLayer', type:'raster', source:'hillSrc',
          paint:{ 'raster-opacity': 0.45, 'raster-saturation': -1, 'raster-contrast': 0.15 },
        }, primeraLinea ? primeraLinea.id : undefined);
      }
    } catch {}
  },

  quitarRelieve() {
    try {
      if (this.map?.getLayer('hillLayer')) this.map.removeLayer('hillLayer');
      if (this.map?.getSource('hillSrc'))  this.map.removeSource('hillSrc');
    } catch {}
  },

  /** El mar en azul: los estilos claros lo dejan casi blanco. */
  mar() {
    if (!this.map) return;
    const azul = '#a9cfe6';
    for (const l of (this.map.getStyle().layers || [])) {
      if (!/water|ocean|sea/i.test(l.id)) continue;
      try {
        if (l.type === 'fill') this.map.setPaintProperty(l.id, 'fill-color', azul);
        if (l.type === 'background' && /water|ocean/i.test(l.id))
          this.map.setPaintProperty(l.id, 'background-color', azul);
      } catch {}
    }
  },

  /* ---------- Leyenda y consulta de valores ----------
     La escala de color la da la propia librería, así que la leyenda
     que ves es EXACTAMENTE la que se ha usado para pintar: no es una
     barra decorativa inventada aparte.

     Ojo con las unidades: el viento viene del modelo en m/s. Se
     convierte a km/h para mostrarlo, porque es la unidad con la que se
     trabaja aquí, y se indica siempre cuál se está mostrando.        */

  escala() {
    const L_ = TLAYERS.find(l => l.id === this.layer);
    if (!L_?.v) return null;

    // Escala propia: la barra se reparte sobre el eje que se lee de verdad
    // (dBZ, hPa o km), no sobre los valores internos de la tesela.
    if (L_.escala) {
      const E = escalasPropias()[L_.escala];
      if (E) return { unidad: E.unidad, factor: 1, conv: E.conv,
                      breakpoints: (E.pos ?? E.eje).slice(),
                      colors: E.scale.colors.slice(E.desde ?? 0),
                      convertida: false, etiquetas: E.eje };
    }

    let cs;
    try { cs = OMWeatherMapLayer.getColorScale(L_.v, false); } catch { return null; }
    if (!cs?.breakpoints?.length) return null;
    // El modelo publica el viento en m/s. Se convierte a la MISMA unidad
    // que use el resto de la app (km/h, kt o m/s), para no leer un número
    // en una unidad en el mapa y en otra en la pestaña Torre.
    const esViento = cs.unit === 'm/s';
    if (esViento) {
      const f = 3.6 * (typeof wu === 'function' ? wu().f : 1);   // m/s → km/h → unidad activa
      return {
        unidad: (typeof wu === 'function' ? wu().lbl : 'km/h'),
        factor: f, breakpoints: cs.breakpoints, colors: cs.colors,
        convertida: true, origen: 'm/s',
      };
    }
    return {
      unidad: cs.unit || L_.unit || '', factor: 1,
      breakpoints: cs.breakpoints, colors: cs.colors, convertida: false,
    };
  },

  legend() {
    const el = document.querySelector('#mapLegend');
    if (!el) return;
    const e = this.escala();
    if (!e) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;

    const bp = e.breakpoints, n = bp.length;
    const min = bp[0], max = bp[n - 1], span = (max - min) || 1;
    const rgba = c => `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;

    // Un color por tramo: se reparten los colores sobre los cortes reales
    const stops = bp.map((v, i) => {
      const c = e.colors[Math.min(i, e.colors.length - 1)];
      return `${rgba(c)} ${((v - min) / span * 100).toFixed(2)}%`;
    }).join(',');

    // Etiquetas: como mucho 7, repartidas
    const paso = Math.max(1, Math.ceil(n / 7));
    const ticks = bp.map((v, i) => {
      if (i % paso && i !== n - 1) return '';
      const val = e.etiquetas ? e.etiquetas[i] : v * e.factor;
      const txt = Math.abs(val) >= 100 ? val.toFixed(0)
                : Math.abs(val) >= 10  ? val.toFixed(0)
                : Math.abs(val) >= 1   ? val.toFixed(1) : val.toFixed(2);
      return `<span style="left:${((v - min) / span * 100).toFixed(2)}%">${txt}</span>`;
    }).join('');

    el.innerHTML = `
      <div class="lgtop__bar" style="background:linear-gradient(90deg,${stops})">
        <div class="lgtop__ticks">${ticks}</div>
      </div>
      <div class="lgtop__u">${esc(TLAYERS.find(l=>l.id===this.layer)?.name || '')}
        · <b>${e.unidad}</b>${e.convertida ? ` <span class="lgtop__nota">convertido de ${e.origen}</span>` : ''}</div>`;

    if (typeof ajustarAltoMapa === 'function') requestAnimationFrame(ajustarAltoMapa);
  },

  /** Pulsar el mapa: valor exacto del modelo en ese punto.
   *
   *  Importante: la lectura puntual solo encuentra valor si la tesela
   *  que cubre ese punto ya está descodificada. Antes se contestaba
   *  "sin dato" cuando en realidad solo faltaba cargarla — justo lo
   *  contrario de lo que esta app promete. Ahora se carga primero esa
   *  tesela concreta y solo se dice "sin dato" cuando de verdad no lo hay.
   */
  async consultar(lngLat) {
    const L_ = TLAYERS.find(l => l.id === this.layer);
    // SIEMPRE el modelo que está pintando, no el que está seleccionado.
    // En una capa sustituida no son el mismo, y preguntar al seleccionado
    // devolvía "sin dato" encima de una zona con color.
    const R = this.usando;
    if (!L_?.v || !R?.meta) return;
    const url = this.omUrl(L_.v, this.t, R.modelo, R.meta);
    if (!url) return;
    const nombreModelo = TMODELS.find(m => m.id === R.modelo)?.name || R.modelo;

    this.cerrarPopups();
    const pop = new maplibregl.Popup({ offset: 10, closeButton: true, className: 'omPop' })
      .setLngLat(lngLat).setHTML('<b>Leyendo el modelo…</b>').addTo(this.map);
    (this._pops ||= []).push(pop);

    const leer = async () => (await OMWeatherMapLayer.getValueFromLatLong(
      lngLat.lat, lngLat.lng, limpiarMarca(url)))?.value;

    try {
      let v = null;
      try { v = await leer(); } catch {}

      if (v === null || v === undefined || Number.isNaN(v)) {
        // Cargar la tesela exacta de ese punto y volver a intentarlo
        const z = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
        const n = 2 ** z;
        const x = Math.floor((lngLat.lng + 180) / 360 * n);
        const y = Math.floor((1 - Math.asinh(Math.tan(lngLat.lat * Math.PI/180)) / Math.PI) / 2 * n);
        pop.setHTML('<b>Descargando ese punto…</b>');
        try {
          await OMWeatherMapLayer.omProtocol(
            { url: `${url}/${z}/${x}/${y}`, type: 'image' }, new AbortController());
          v = await leer();
        } catch {}
      }

      const e = this.escala();
      const f = e?.factor ?? 1, u = e?.unidad ?? (L_.unit || '');
      const hora = new Date(R.meta.valid_times[this.t])
        .toLocaleString('es', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

      if (!valorReal(v, L_)) {
        const sinFenomeno = L_.minValido !== undefined && has(v);
        pop.setHTML(sinFenomeno
          ? `<b>Sin nube convectiva</b><br><small>El modelo no sitúa aquí ninguna
             nube de desarrollo vertical a esta hora
             <br>${lngLat.lat.toFixed(3)}, ${lngLat.lng.toFixed(3)}</small>`
          : `<b>Sin dato</b><br><small>El modelo
          ${esc(nombreModelo)} no tiene valor de
          ${esc(L_.name.toLowerCase())} en este punto
          <br>${lngLat.lat.toFixed(3)}, ${lngLat.lng.toFixed(3)}</small>`);
        return;
      }

      const val = e?.conv ? e.conv(v) : v * f;
      // Con los números apagados esta es la única lectura que hay, así
      // que el aviso de «esto no puede ser» va también aquí. Un número
      // imposible dado sin más se lee como un dato bueno.
      const imposible = fueraDeRango(L_, val);
      pop.setHTML(`<b>${val.toFixed(Math.abs(val) < 10 ? 1 : 0)} ${esc(u)}</b>
         ${imposible ? `<small style="color:var(--no);font-weight:700">${esc(imposible)}</small>` : ''}
         <br><small>${esc(L_.name)} · ${esc(hora)}
         <br>${lngLat.lat.toFixed(3)}, ${lngLat.lng.toFixed(3)}
         <br>${esc(nombreModelo)}${R.sustituido ? ' · capa sustituida' : ''}</small>`);
      this.avisoRango(imposible);
    } catch (err) {
      pop.setHTML(`<b>No se ha podido leer</b><br><small>${esc(String(err.message||err).slice(0,90))}</small>`);
    }
  },


  /* ---------- Barbas de viento sobre el mapa ---------- */

  /** Nombre de las componentes U y V de la capa de viento activa. */
  componentes(L_) {
    /* ── LAS RÁFAGAS TAMBIÉN LLEVAN DIRECCIÓN ────────────────────────
       Cazado el 01-09-2026 midiendo el mapa: la capa de Ráfagas declara
       `arrows: true` desde siempre y NO dibujaba ni una barba, porque
       aquí se exigía que la variable empezara por `wind_u_component_` y
       la suya es `wind_gusts_10m`. Un interruptor encendido que no
       encendía nada — el mismo patrón que `fueraDeRango()` y que
       `cancelarPrecarga()`.

       PROBADO Y RETIRADO EL MISMO DÍA: se hizo que devolviera las dos
       componentes de 10 m para la capa de ráfagas y **no salió ni una
       barba**. El motivo, medido en pantalla: `getValueFromLatLong`
       responde *«State not found for key: …?variable=wind_u_component_10m»*,
       que en esta librería significa «ese fichero no lo tengo abierto»,
       no «no hay dato». La precarga de teselas de arriba no llega a
       registrarlas cuando la variable no es la de la capa. Y así, además
       de no pintar nada, se pedían doce teselas de más que fallaban.

       Así que se deja como está —sin barbas en ráfagas— y lo que se quita
       es la MENTIRA: el `arrows: true` de esa capa, que prometía flechas
       desde siempre. Cuando alguien resuelva lo de la precarga por
       variable, se vuelve a poner: la dirección del golpe SÍ le importa
       (de costado a la torre o de frente al camino no es lo mismo). */
    if (!L_?.v?.startsWith('wind_u_component_')) return null;
    return { u: L_.v, v: L_.v.replace('wind_u_component_', 'wind_v_component_') };
  },

  async barbas() {
    const cont = document.querySelector('#mapBarbs');
    if (!cont) return;
    const L_ = TLAYERS.find(l => l.id === this.layer);
    const C = this.componentes(L_);
    if (!this.verBarbas || !C || !this.usando) { cont.innerHTML = ''; return; }

    const R = this.usando;
    const uUrl = this.omUrl(C.u, this.t, R.modelo, R.meta);
    const vUrl = this.omUrl(C.v, this.t, R.modelo, R.meta);
    if (!uUrl || !vUrl) { cont.innerHTML = ''; return; }
    // Mismo turno que valores(): barbas de otra hora son un dato falso.
    const turnoB = (this._turnoBarb = (this._turnoBarb || 0) + 1);
    const vigenteB = () => turnoB === this._turnoBarb && uUrl === this.omUrl(C.u, this.t, this.usando?.modelo, this.usando?.meta);

    // Rejilla regular sobre lo que se ve, con separación cómoda.
    //
    // MEDIDO (23 ago 2026): con separación de 78 px, una pantalla de
    // portátil da 25 × 8 = 200 barbas, y cada barba son DOS lecturas
    // punto a punto del modelo. 400 consultas sobre la rejilla gaussiana
    // de ECMWF HRES (6,6 millones de puntos) tumbaban el descodificador
    // con Aborted(OOM), siempre en esta capa y en ninguna otra. Con 96 px
    // y un tope de 96 barbas el mapa aguanta, y encima se lee mejor:
    // 200 flechas en un mapa de toda España es una maraña.
    const c = this.map.getCanvas();
    const W = c.clientWidth, H = c.clientHeight;
    const sep = 96;
    let cols = Math.max(3, Math.floor(W / sep));
    let filas = Math.max(2, Math.floor(H / sep));
    const TOPE = 96;
    while (cols * filas > TOPE) { if (cols >= filas) cols--; else filas--; }

    // Asegurar que las teselas están descodificadas para poder leer puntos
    const z = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
    const tiles = this.tilesVisibles(z).slice(0, 6);
    await Promise.all([uUrl, vUrl].flatMap(u => tiles.map(([x, y]) =>
      OMWeatherMapLayer.omProtocol({ url:`${u}/${z}/${x}/${y}`, type:'image' },
        new AbortController()).catch(() => {}))));
    if (!vigenteB()) return;

    const marca = `${R.modelo}|${this.layer}|${this.t}`;
    this._marcaBarbas = marca;
    const piezas = [];
    /* ── LAS BARBAS, EN TANDAS Y NO DE UNA EN UNA ────────────────────
       MEDIDO el 01-09-2026 con cronómetro sobre lo publicado, en su capa
       de RÁFAGAS —la que más mira, la que decide— con ICON-EU:

           con barbas .......... 20,3 s
           sin barbas ..........  0,7 s   ← veintinueve veces más rápido

       O sea que las barbas eran TODO el tiempo de espera de esa capa. Y
       no era el dato ni la red: eran 96 barbas × 2 lecturas = **192
       `await` encadenados**, cada uno esperando al anterior. Las teselas
       ya están descodificadas antes del bucle, así que las lecturas
       pueden ir a la vez sin pedir nada nuevo.

       Van en tandas de 12 para no despertar al `Aborted(OOM)` del 23-08
       —que vino de saturar el descodificador— y entre tanda y tanda se
       conserva el abandono por `_marcaBarbas`, que es lo que corta
       cuando él cambia de capa o mueve el mapa. */
    const puntos = [];
    for (let i = 1; i <= cols; i++)
      for (let j = 1; j <= filas; j++)
        puntos.push({ px: W * i / (cols + 1), py: H * j / (filas + 1) });

    const TANDA = 12;
    for (let k = 0; k < puntos.length; k += TANDA) {
      if (this._marcaBarbas !== marca) return;        // cambió algo: abandonar
      const leidos = await Promise.all(puntos.slice(k, k + TANDA).map(async ({ px, py }) => {
        const ll = this.map.unproject([px, py]);
        try {
          const [ru, rv] = await Promise.all([
            OMWeatherMapLayer.getValueFromLatLong(ll.lat, ll.lng, uUrl),
            OMWeatherMapLayer.getValueFromLatLong(ll.lat, ll.lng, vUrl),
          ]);
          return { px, py, u: ru?.value, v: rv?.value };
        } catch { return { px, py, u: null, v: null }; }
      }));
      for (const { px, py, u, v } of leidos) {
        if (!has(u) || !has(v)) continue;             // sin dato: no se dibuja nada
        const ms = Math.hypot(u, v);
        const kt = ms * KT_POR_MS;
        // Dirección DE DONDE viene, en grados meteorológicos
        const desde = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360;
        /* El globito va en KM/H: su norma desde el 27-08 y sin matices.
           El DIBUJO de la barba se sigue calculando en nudos, que es
           como está definido el símbolo — pero el número que él lee, no. */
        piezas.push(`<svg class="barb" style="left:${px.toFixed(0)}px;top:${py.toFixed(0)}px"
          viewBox="0 0 44 44" title="${(ms * 3.6).toFixed(0)} km/h">${svgBarba(kt, desde)}</svg>`);
      }
    }
    if (this._marcaBarbas === marca) cont.innerHTML = piezas.join('');
    // Las lecturas punto a punto dejan bloques abiertos que ya no sirven
    this.soltarMemoria();
  },

  limpiarBarbas() { const c = document.querySelector('#mapBarbs'); if (c) c.innerHTML = ''; },

  /* ── RAYOS ENCIMA DEL MAPA (09-09-2026) ─────────────────────────────
     Suyo, en Calpe con la tormenta subiendo por la costa, mirando Windy:
     «los rayos encima del radar». Las descargas son las de AEMET que ya
     lee la pestaña Rayos (Rayos.leer, pixel a pixel del mapa oficial), de
     las dos últimas horas publicadas: ROJO la última, ÁMBAR la anterior;
     borde blanco las positivas. Se leen para lo que se ve en pantalla,
     se vuelven a pedir al mover el mapa y cada 5 minutos, y van encima de
     cualquier capa. AEMET publica por horas y con retraso: el pie del
     mapa dice hasta qué hora hay dato, que no es «ahora». */
  setRayos(on) {
    this.verRayos = !!on; LS.set('trayos', this.verRayos);
    this.ui(); this.verRayos ? this.rayos() : this.limpiarRayos();
  },
  limpiarRayos() {
    clearTimeout(this._rayosTimer); this._rayosTimer = null;
    if (!this.map) return;
    for (const id of ['rayosLayer', 'rayosHalo']) if (this.map.getLayer(id)) this.map.removeLayer(id);
    if (this.map.getSource('rayosSrc')) this.map.removeSource('rayosSrc');
    const el = document.querySelector('#mapRayos'); if (el) el.textContent = '';
  },
  rayosPronto() {
    clearTimeout(this._rayosDeb);
    this._rayosDeb = setTimeout(() => this.rayos(), 700);
  },
  async rayos() {
    if (!this.map || !this.verRayos || typeof Rayos === 'undefined') return;
    clearTimeout(this._rayosTimer);
    this._rayosTimer = setTimeout(() => this.rayos(), 5 * 60e3);
    const pedido = ++this._rayosN;
    const el = document.querySelector('#mapRayos');
    // La primera lectura tarda (dos mapas de toda España, pixel a pixel): que se sepa.
    if (el && !this.map.getSource('rayosSrc')) el.textContent = '⚡ leyendo las descargas de AEMET…';
    try {
      const cat = await Rayos.catalogo();
      const c = this.map.getCenter();
      const amb = Rayos.ambito(cat, { lat: c.lat, lon: c.lng });
      if (!amb) { if (el) el.textContent = '⚡ AEMET no cubre esta zona'; return; }
      const b = this.map.getBounds();
      const caja = { lat0: b.getSouth(), lat1: b.getNorth(), lon0: b.getWest(), lon1: b.getEast() };
      const marcos = cat.ambitos[amb].marcos.slice(-2);
      const feats = [];
      for (let k = 0; k < marcos.length; k++) {
        const ds = await Rayos.leer(amb, marcos[k], caja, cat);
        const edad = marcos.length - 1 - k;        // 0 = la última hora publicada
        for (const d of ds) feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [d.lon, d.lat] },
                                         properties: { edad, pos: d.pos ? 1 : 0 } });
      }
      if (pedido !== this._rayosN || !this.verRayos || !this.map) return;   // llegó tarde
      const data = { type: 'FeatureCollection', features: feats };
      const src = this.map.getSource('rayosSrc');
      if (src) src.setData(data);
      else {
        this.map.addSource('rayosSrc', { type: 'geojson', data });
        this.map.addLayer({ id: 'rayosHalo', type: 'circle', source: 'rayosSrc',
          paint: { 'circle-radius': 7.5, 'circle-color': '#000', 'circle-opacity': 0.35 } });
        this.map.addLayer({ id: 'rayosLayer', type: 'circle', source: 'rayosSrc',
          paint: { 'circle-radius': 4.5,
                   'circle-color': ['case', ['==', ['get', 'edad'], 0], '#ff3b30', '#ffb020'],
                   'circle-stroke-color': ['case', ['==', ['get', 'pos'], 1], '#ffffff', '#1a1a1a'],
                   'circle-stroke-width': 1.2, 'circle-opacity': 0.95 } });
      }
      const hasta = marcos[marcos.length - 1]?.hasta;
      const hh = hasta && typeof horaHM === 'function' ? horaHM(hasta) : '—';
      if (el) el.textContent = feats.length
        ? `⚡ ${feats.length} descargas AEMET en lo que ves · rojo última hora, ámbar la anterior · publicado hasta las ${hh}`
        : `⚡ sin descargas AEMET en lo que ves · publicado hasta las ${hh}`;
    } catch (e) {
      /* Con el estilo del mapa a medio cargar, addSource revienta: se
         reintenta unas veces antes de darlo por perdido. */
      if (/style|load/i.test(String(e?.message || e)) && (this._rayosRe = (this._rayosRe || 0) + 1) <= 6) {
        setTimeout(() => this.rayos(), 1200); return;
      }
      this._rayosRe = 0;
      if (el) el.textContent = '⚡ rayos AEMET no disponibles: ' + (e?.message || e);
    }
  },

  setBarbas(on) {
    this.verBarbas = !!on; LS.set('tbarbs', this.verBarbas);
    this.ui();
    this.verBarbas ? this.barbas() : this.limpiarBarbas();
  },

  /* ---------- Controles ---------- */
  ui() {
    const disp = this.available();


    const grupos = [...new Set(disp.map(l => l.g))];
    document.querySelector('#mapLayers').innerHTML = grupos.map(g =>
      `<div class="lgrp" data-g="${g.toLowerCase().replace(/[^a-z]/g,'')}">
         <span class="lgrp__k">${g}</span>` +
      disp.filter(l => l.g === g).map(l =>
        `<button class="ovb${l.id === this.layer ? ' is-on' : ''}${this.propia(l) ? '' : ' is-alt'}"
           data-l="${l.id}" title="${esc(l.desc)}${this.propia(l) ? '' : ' · no la publica este modelo: se mostrará con otro'}"
           >${l.name}${this.propia(l) ? '' : '<i>*</i>'}</button>`).join('') +
      `</div>`).join('');

    /* ── EL RATÓN AVISA ANTES QUE EL CLIC ─────────────────────────────
       Suyo, 31-08-2026: *«pero tarda en cargar mucho»* — cambiar de capa
       con un modelo gordo son 6-10 s de mapa vacío, porque cada variable
       es otro trozo del fichero y no se pide hasta el clic.

       En el Mac, el puntero pasa por encima del botón un instante antes
       de pulsar. Ese instante se aprovecha: al posarse, se pide YA la
       tesela del centro de esa capa (una sola petición, por la misma
       cola con tope que usa la precarga de horas). Cuando llega el clic,
       la cabecera del fichero y el primer bloque ya están en la caché.
       En el móvil no hay puntero y esto simplemente no se dispara. */
    if (!this._hoverPre) { this._hoverPre = true;
    document.querySelector('#mapLayers').addEventListener('pointerover', (e) => {
      const b = e.target.closest('.ovb'); if (!b || b.classList.contains('is-on')) return;
      const L_ = TLAYERS.find(l => l.id === b.dataset.l);
      if (!L_?.v || L_.sat || L_.id === 'radar' || L_.id === 'aemet' || !this.usando) return;
      const u = this.omUrl(L_.v, this.t, this.usando.modelo, this.usando.meta);
      if (!u || !this.map) return;
      const z = Math.min(12, Math.max(0, Math.round(this.map.getZoom())));
      const centro = this.tilesVisibles(z)[0]; if (!centro) return;
      const k = `${u}/${z}/${centro[0]}/${centro[1]}`;
      this._pedidas ??= new Set(); this._cola ??= []; this._enCurso ??= 0;
      if (this._pedidas.has(k)) return;
      this._pedidas.add(k); this._cola.push(k); this.bombear();
    }); }

    document.querySelector('#mapModels').innerHTML =
      `<span class="msel__k">Modelo</span>` +
      TMODELS.map(m => {
        const d = this.diasDe(m.id);
        return `<button class="mbtn${m.id === this.model ? ' is-on' : ''}" data-tm="${m.id}"
          title="${esc(m.desc)} · ${m.res}${d ? ` · llega a ${d} días` : ''}">${m.name}${
          d ? `<i class="mbtn__d">${d < 10 ? d.toFixed(d % 1 ? 1 : 0) : Math.round(d)}d</i>` : ''}</button>`;
      }).join('') +
      `<span class="msel__k" style="margin-left:auto">Fondo</span>` +
      BASEMAPS.map(b => `<button class="mbtn${b.id === this.base ? ' is-on' : ''}" data-tb="${b.id}">${b.name}</button>`).join('') +
      `<button class="mbtn${this.terrain ? ' is-on' : ''}" data-tr="1" title="Sombreado del terreno (Esri/USGS)">Relieve</button>` +
      `<button class="mbtn${this.verValores ? ' is-on' : ''}" data-tv="1" title="Números del modelo sobre las ciudades">Valores</button>` +
      `<button class="mbtn${this.verBarbas ? ' is-on' : ''}" data-tb2="1" title="Barbas de viento — media ≈ 9 km/h, entera ≈ 19, banderola ≈ 93 (el símbolo se dibuja en nudos por convenio)">Barbas</button>` +
      `<button class="mbtn${this.verRayos ? ' is-on' : ''}" data-tl="1" title="Descargas detectadas por AEMET en las dos últimas horas publicadas, encima del mapa">⚡ Rayos</button>` +
      `<span class="msel__k" style="margin-left:12px">Paso</span>` +
      [1,3,6].map(h => `<button class="mbtn${h === this.pasoHoras ? ' is-on' : ''}" data-tp="${h}"
         title="${h === 3 ? 'Como Windy y Ventusky: fluido' : h === 1 ? 'Máximo detalle, más lento' : 'Muy fluido, menos detalle'}">${h} h</button>`).join('');

    // Selector de móvil: mismos datos, presentados en lista
    const mm = document.querySelector('#mmobModelo');
    const mc = document.querySelector('#mmobCapa');
    if (mm) mm.textContent = TMODELS.find(m => m.id === this.model)?.name ?? this.model;
    if (mc) mc.textContent = TLAYERS.find(l => l.id === this.layer)?.name ?? '—';
    if (!document.querySelector('#mapHoja').hidden) this.hoja(this._hoja);

    // Las chapas y la leyenda cambian de alto al pintarse; hay que volver a
    // encajar el mapa o el deslizador se sale de la pantalla.
    if (typeof ajustarAltoMapa === 'function') requestAnimationFrame(ajustarAltoMapa);

    const bR = document.querySelector('#mapRayosBtn');
    if (bR) bR.classList.toggle('is-on', !!this.verRayos);
    const L_ = TLAYERS.find(l => l.id === this.layer);
    document.querySelector('#mapDesc').textContent =
      L_ ? `${L_.name}${L_.unit ? ` · ${L_.unit}` : ''} — ${L_.desc}` : '';
  },

  /* ---------- Selector de móvil ----------
     En el teléfono, una tira horizontal con 29 capas se convierte en un
     barrido a ciegas. Aquí se abre una lista vertical con los grupos
     separados y por colores, que es como se lee de un vistazo.

     No hay datos nuevos ni distintos: es la misma lista de arriba. */

  hoja(tipo) {
    const el = document.querySelector('#mapHoja');
    if (!el) return;
    this._hoja = tipo;
    el.hidden = false;

    let cuerpo;
    if (tipo === 'modelo') {
      cuerpo = `<div class="hoja__g"><span class="hoja__k">Modelo</span>` +
        TMODELS.map(m => {
          const d = this.diasDe(m.id);
          return `<button class="hoja__i${m.id === this.model ? ' is-on' : ''}" data-tm="${m.id}">
            <b>${esc(m.name)}</b><small>${esc(m.res || '')}${
              d ? ` · llega a <b>${d} días</b>` : ''}${m.desc ? ` · ${esc(m.desc)}` : ''}</small>
          </button>`;
        }).join('') + `</div>`;
    } else {
      const disp = this.available();
      const grupos = [...new Set(disp.map(l => l.g))];
      cuerpo = grupos.map(g =>
        `<div class="hoja__g" data-g="${g.toLowerCase().replace(/[^a-z]/g,'')}">
           <span class="hoja__k">${esc(g)}</span>` +
        disp.filter(l => l.g === g).map(l =>
          `<button class="hoja__i${l.id === this.layer ? ' is-on' : ''}${this.propia(l) ? '' : ' is-alt'}" data-l="${l.id}">
             <b>${esc(l.name)}${this.propia(l) ? '' : ' <i>*</i>'}</b><small>${esc(l.desc || '')}</small>
           </button>`).join('') + `</div>`).join('') +
        `<p class="hoja__n">Las marcadas con <i>*</i> no las publica el modelo
           elegido: se muestran con otro y el mapa te avisa de cuál.</p>`;
    }

    el.innerHTML = `<div class="hoja__c">
        <div class="hoja__t">${tipo === 'modelo' ? 'Elegir modelo' : 'Elegir capa'}
          <button class="hoja__x" data-cerrar="1" aria-label="Cerrar">✕</button></div>
        <div class="hoja__s">${cuerpo}</div>
      </div>`;
  },

  cerrarHoja() {
    const el = document.querySelector('#mapHoja');
    if (el) { el.hidden = true; el.innerHTML = ''; }
    this._hoja = null;
  },

  setLayer(id) {
    if (id === this.layer) return;
    // LA HORA NO SE MUEVE AL CAMBIAR DE CAPA. Si estás en el domingo a
    // las 18:00 mirando CAPE y pasas a Viento 10 m, sigues en el domingo
    // a las 18:00. Comparar dos capas solo tiene sentido a la misma hora,
    // y saltar solo al "ahora" obligaba a recolocar el deslizador cada vez.
    // La resuelve apply(), que es quien sabe qué modelo acaba pintando.
    this.horaPedida = this.horaMirada();
    this.cerrarPopups();
    /* ── SE CORTA LA PRECARGA DE LA CAPA QUE DEJAS ────────────────────
       `cancelarPrecarga()` llevaba escrita desde el principio —con su
       comentario diciendo «SOLO al cambiar de capa o de modelo»— y NO LA
       LLAMABA NADIE (cazado el 01-09-2026, el mismo patrón que
       `fueraDeRango()` y que `om_cambiado`). Efecto: al cambiar de capa,
       la cola seguía bajando y descodificando teselas de la ANTERIOR,
       compitiendo con lo que él está mirando y desalojando la caché de
       bloques, que está topada en 8 MB. Es exactamente lo que este
       proyecto tiene medido como la causa de que el mapa vaya lento. */
    this.cancelarPrecarga();
    this.soltarMemoria();
    this.layer = id; LS.set('tlayer', id);
    this.pause();
    this.ui(); this.apply();
  },

  async setModel(id) {
    if (id === this.model) return;
    // Se recuerda QUÉ HORA se estaba mirando, no el número de paso: cada
    // modelo tiene su propia lista de horas y su propio alcance. Cambiar
    // de ECMWF (15 días) a AROME (2) y quedarse en el paso 40 llevaba a
    // una hora que ese modelo no tiene.
    const horaMirada = this.horaMirada();
    this.cerrarPopups();
    this.cancelarPrecarga();     // igual que en setLayer: ver el porqué allí
    this.soltarMemoria();

    this.model = id; LS.set('tmodel', id);
    /* El tope de descargas es el freno de HRES; a los ligeros no hay
       que frenarlos igual. Con castigo guardado se respeta el castigo. */
    try {
      const g = +localStorage.getItem('torre.teselasALaVez');
      const base = (g >= 1 && g <= 4) ? g : 3;
      Peticiones.max = (id === 'ecmwf_ifs') ? Math.min(base, 2) : base;
    } catch {}
    this.pause();
    await this.loadMeta();

    if (horaMirada && this.meta?.valid_times?.length) {
      const vt = this.meta.valid_times.map(v => new Date(v));
      const ultima = vt[vt.length - 1];
      if (horaMirada > ultima) {
        const nom = TMODELS.find(m => m.id === id)?.name || id;
        const d = this.diasDe(id);
        const ult = ultima.toLocaleString('es', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        this.avisoAlcance(`<b>${esc(nom)} solo llega a ${String(d).replace('.', ',')} días</b>,
          hasta el ${esc(ult)}. Estabas mirando más lejos, así que te he traído a la
          hora actual. Para ir a 7 días, usa <b>ECMWF</b> o <b>GFS</b>.`);
      } else {
        this.avisoAlcance(null);
        // Ir a la hora equivalente, no al mismo número de paso
        this.t = this.indiceDeHora(this.meta, horaMirada) ?? 0;
        const sl = document.querySelector('#mapTime');
        if (sl) sl.value = this.t;
        this.apply();
      }
    }
  },

  /** Aviso de que el modelo elegido no llega tan lejos. */
  avisoAlcance(html) {
    const el = document.querySelector('#mapAlcance');
    if (!el) return;
    if (!html) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = html;
  },

  setBase(id) {
    if (id === this.base || !this.map) return;
    this.base = id; LS.set('tbase', id);
    this._fuente = null;
    this.map.setStyle((BASEMAPS.find(b => b.id === id) || BASEMAPS[0]).url);
    this.map.once('idle', () => { this.relieve(); this.mar(); this.apply(); });
    setTimeout(() => { this.relieve(); this.mar(); this.apply(); }, 2500);
    this.ui();
  },

  /** Cambia solo la hora. Si la capa ya está montada, se le cambia la
   *  plantilla de teselas en caliente; reconstruirla en cada paso del
   *  slider era lo que lo dejaba en blanco y a tirones. */
  setValores(on) {
    this.verValores = !!on; LS.set('tvals', this.verValores);
    this.ui(); this.verValores ? this.valores() : this.limpiarValores();
  },

  setTerrain(on) {
    this.terrain = !!on; LS.set('tterrain', this.terrain);
    if (this.terrain) this.relieve(); else this.quitarRelieve();
    this.ui();
  },

  /** Avanza o retrocede n horas del modelo, sin salirse del rango. */
  paso(n) {
    this.pause();
    if (this.capaSat()) {
      const total = this._sat?.horas?.length ?? 0;
      if (!total) return;
      const t = Math.max(0, Math.min(total - 1, this.t + n));
      document.querySelector('#mapTime').value = t;
      this.setT(t);
      return;
    }
    if (this.layer === 'aemet') {
      const total = this._aemet?.length ?? 0;
      if (!total) return;
      const t = Math.max(0, Math.min(total - 1, this.t + n));
      document.querySelector('#mapTime').value = t;
      this.setT(t);
      return;
    }
    if (this.layer === 'radarprev') {
      const total = this._mixta?.length ?? 0;
      if (!total) return;
      const t = Math.max(0, Math.min(total - 1, this.t + n));
      document.querySelector('#mapTime').value = t;
      this.setT(t);
      return;
    }
    if (this.layer === 'radar') {
      const total = this.radarFrames?.length ?? 0;
      if (!total) return;
      const t = Math.max(0, Math.min(total - 1, this.t + n));
      document.querySelector('#mapTime').value = t;
      this.setT(t);
      return;
    }
    const idx = this._idx ?? this.indices();
    if (!idx.length) return;
    const p = Math.max(0, Math.min(idx.length - 1, (this._pos ?? 0) + n));
    document.querySelector('#mapTime').value = p;
    this.irAPosicion(p);
  },

  /** Vuelve a la hora en curso.
   *  En una capa observada, «ahora» es el ÚLTIMO FOTOGRAMA OBSERVADO:
   *  el de antes de la primera hora futura (el radar lleva extrapolación
   *  por delante) o, si todos son pasados, el último de la tira. Antes
   *  satélite y AEMET pasaban por nowIndex(), que es un índice del
   *  modelo y no tiene nada que ver con sus fotogramas (05-09-2026). */
  ahora() {
    this.pause();
    const T = this.tiraObservada();
    let t;
    if (T) {
      const fut = T.findIndex(h => h > Date.now());
      t = !T.length ? 0 : fut < 0 ? T.length - 1 : Math.max(0, fut - 1);
    } else {
      t = this.nowIndex();
    }
    document.querySelector('#mapTime').value = t;
    this.setT(t);
  },

  setT(t) {
    const dirMov = (+t >= this.t) ? 1 : -1;
    this._dir = dirMov;
    if (+t !== this.t) this.cerrarPopups();
    this.t = +t;
    const L_ = TLAYERS.find(l => l.id === this.layer);

    // Satélite: si la capa ya está montada, solo se le cambia la hora en
    // la plantilla de teselas. Tirarla y rehacerla en cada fotograma daba
    // un parpadeo blanco que hacía la animación inservible.
    if (L_?.sat && this._sat?.horas?.[this.t] && this.map?.getSource('satSrc')) {
      try {
        const hora = this._sat.horas[this.t];
        const src = this.map.getSource('satSrc');
        const nueva = src.tiles[0].replace(/time=[^&]*/, 'time=' + encodeURIComponent(hora));
        src.setTiles([nueva]);
        const d = new Date(hora);
        const st = document.querySelector('#mapStamp');
        if (st) st.textContent = d.toLocaleString('es', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        this.avisoNoche(L_, d);
        return;
      } catch { /* si falla, se rehace entera abajo */ }
    }

    // Radar + previsión: solo cambia el fotograma, sin rehacer la capa.
    if (L_?.id === 'radarprev' && this._mixta?.length) { this.frameMixta(this.t); return; }
    if (!L_ || L_.id === 'radar' || L_.id === 'aemet' || L_.sat || !this.usando || !this.map?.getSource('omSrc')) {
      this.apply(); return;
    }
    const url = this.omUrl(L_.v, this.t, this.usando.modelo, this.usando.meta);
    if (!url) return;
    try {
      this.map.getSource('omSrc').setTiles([`${url}/{z}/{x}/{y}`]);
      // Las isobaras son del mismo fichero: se mueven con la hora.
      if (this.map.getSource('isoSrc')) this.map.getSource('isoSrc').setTiles([`${url}/{z}/{x}/{y}`]);
      if (L_.encima && this.map.getSource('omSrc2')) {
        const u2 = this.omUrl(L_.encima, this.t, this.usando.modelo, this.usando.meta);
        if (u2) this.map.getSource('omSrc2').setTiles([`${u2}/{z}/{x}/{y}`]);
      }
      this.stamp();
      this.precargar(dirMov);
      /* Los números y las barbas son de la hora ANTERIOR hasta que
         lleguen los nuevos, y con ECMWF HRES eso son 17-24 s. El
         10-09-2026 a las 11:05 Aitor tenía dos capturas de «14:00» con
         Argel al 77 % y al 37 %: una era de otra hora. Se borran YA y
         se vuelven a pintar cuando estén descodificados los de esta. */
      this.limpiarValores();
      this.limpiarBarbas();
      clearTimeout(this._tv);
      this._tv = setTimeout(() => { this.valores(); this.barbas(); }, 500);
    } catch { this.apply(); }
  },

  /** Solo mueve la etiqueta de la hora: se usa mientras se arrastra.
   *  En las capas observadas (radar, AEMET, satélite) el deslizador va
   *  por FOTOGRAMAS de su tira y el sello es la hora de ese fotograma.
   *  En las de modelo va por POSICIONES del paso elegido (1 h / 3 h /
   *  6 h), no por horas del modelo. El comentario de antes decía «fuera
   *  del radar» y era de cuando el radar era la única observada: AEMET y
   *  satélite entraban por la rama del modelo y el sello enseñaba una
   *  fecha de PREVISIÓN sobre una imagen de hace un rato (05-09-2026). */
  previewT(t) {
    const T = this.tiraObservada();
    if (T) {
      this.t = Math.max(0, Math.min(Math.max(0, T.length - 1), +t || 0));
      const h = T[this.t];
      const st = document.querySelector('#mapStamp');
      if (h && st) st.textContent = this.selloObservado(new Date(h));
      return;
    }
    const idx = this._idx ?? this.indices();
    const p = Math.max(0, Math.min(idx.length - 1, +t));
    this._pos = p;
    this.t = idx[p] ?? this.t;
    this.stamp();
  },

  setOpacity(o) {
    this.opacity = o;
    const L_ = TLAYERS.find(l => l.id === this.layer);
    // (el velo de las densas murió el 31-08: la sombra va encima del color)
    ['omLayer','radarLayer'].forEach(id => {
      if (this.map?.getLayer(id)) this.map.setPaintProperty(id, 'raster-opacity', o);
    });
  },

  /** Cuántos pasos tiene la capa activa. Cada tipo lleva su propia tira. */
  totalPasos() {
    if (this.layer === 'radar') return this.radarFrames?.length ?? 0;
    if (this.layer === 'radarprev') return this._mixta?.length ?? 0;
    if (this.layer === 'aemet') return this._aemet?.length ?? 0;
    if (this.capaSat())        return this._sat?.horas?.length ?? 0;
    return this._idx?.length ?? this.meta?.valid_times?.length ?? 0;
  },

  play() {
    const n = this.totalPasos();
    if (!n) return;
    this.playing = true;
    document.querySelector('#mapPlayIco').innerHTML = '<path d="M8.5 4.5v15M15.5 4.5v15"/>';
    clearInterval(this.timer);
    const observada = this.layer === 'radar' || this.layer === 'radarprev' || this.layer === 'aemet' || this.capaSat();
    this.timer = setInterval(() => {
      const total = this.totalPasos();
      if (!total) { this.pause(); return; }
      // En el modelo el deslizador va por POSICIONES, no por horas
      if (observada) {
        this.t = (this.t + 1) % total;
        document.querySelector('#mapTime').value = this.t;
        this.setT(this.t);
      } else {
        this._pos = ((this._pos ?? 0) + 1) % total;
        document.querySelector('#mapTime').value = this._pos;
        this.irAPosicion(this._pos);
      }
    }, observada ? 600 : 900);
  },

  pause() {
    this.playing = false;
    const i = document.querySelector('#mapPlayIco');
    if (i) i.innerHTML = '<path d="M7 4.5v15l13-7.5Z"/>';
    clearInterval(this.timer);
  },
};
