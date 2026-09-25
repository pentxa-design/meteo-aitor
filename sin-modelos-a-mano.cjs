/* ═══════════════════════════════════════════════════════════════════
   NINGÚN TEXTO DE PANTALLA NOMBRA UN MODELO A MANO
   ───────────────────────────────────────────────────────────────────
   Pedido por él el 30-08-2026 — *«pues eso, que no vuelva a suceder»*,
   *«es una cagada»*— y propuesto por la sesión secundaria, que contó las
   veces que ha pasado. **Son tres, y siempre igual:**

     · 22 al 27-08 · «con la tapa, el MU SIEMPRE tiene menos»   5 días
     · 24 al 27-08 · `fueraDeRango()` escrito y sin llamar      3 días
     · 27 al 30-08 · «las capas SÍ son de AROME HD»             3 días

   Las tres eran verdad el día que se escribieron. Las tres se quedaron
   cuando cambió lo de debajo. Y las dos primeras se cerraron con un «no
   volverá a pasar» que no bastó, porque un propósito no es un guardia.

   LA REGLA: un nombre de modelo que se PINTA sale de una función
   —`modeloDato()`, `deQuienSale()`, `nombreDeModelo()`, `quienLoMide()`—
   y nunca escrito dentro del texto. Así, el día que cambie el reparto
   cambian los doce sitios a la vez o no cambia ninguno.

   DÓNDE SÍ SE PUEDE ESCRIBIR, y por eso hay lista blanca:
     · la definición de los modelos (`MODELS`, `COMPARAR`…): ahí es donde
       vive el nombre, es su sitio;
     · la Guía y las leyendas del mapa, donde se EXPLICA cada modelo por
       su nombre y eso no cambia solo;
     · los hechos medidos con su fecha —«AROME 5,6 km/h de error»—, que
       son historia y no un dato en vivo.

   Corre en `revisar.sh`: si salta, NO SE PUBLICA.
   Probado metiendo a mano una frase con un modelo (ver el final).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const NOMBRES = ['AROME HD', 'AROME', 'ICON-D2', 'ICON-EU', 'ICON', 'ECMWF',
                 'GFS', 'ARPEGE', 'HARMONIE', 'GEM', 'Automático'];

/* Trozos de texto donde el nombre SÍ puede ir escrito. Se comparan por
   inclusión, así que basta un cacho reconocible de la frase. Para añadir
   uno hay que venir aquí a propósito: no se cuela por descuido. */
const BLANCA = [
  /* La tabla NOMBRE_PRESTAMISTA que alimenta nombreDeModelo() (17-09-2026):
     ahí el nombre va pegado a su id de Open-Meteo, es el dato mismo, no
     una etiqueta de pantalla. Sin ella ARPEGE salía como «otro modelo». */
  '_arpege_europe: ',
  '_arome_france: ',
  'gem_seamless: ',
  /* Explicaciones fijas: lo que ES cada modelo, no lo que sirve hoy. */
  'el más fino que cubre Euskadi',
  /* Salieron al cerrar el hueco de las plantillas (25-09-2026): son
     explicaciones de lo que cada modelo ES o de lo que publica según su
     documentación (capas de nubes), no de quién sirve el dato hoy. */
  'AROME es el de más resolución sobre Euskadi',
  'no da ni',
  'publican sus capas',
  'no lo tenemos comprobado',
  'al Automático no se le pide',
  'Prueba con <b>ICON-EU</b>',
  'gastan mucha menos memoria',
  'DWD alemán',
  'NOAA · global',
  'Centro Europeo',
  'Open-Meteo elige',
  'Météo-France',
  /* Hechos medidos, con su fecha. Son historia; no cambian solos. */
  'de error contra el aparato',
  'se queda corto',
  'km/h de error',
  /* La comparativa y el marcador nombran modelos porque su asunto ES
     comparar modelos: ahí el nombre es el dato, no la etiqueta. */
  'no publica la tapa',
  'publican la tapa',
  /* Hechos medidos con su fecha dentro: son historia, no un dato vivo. */
  'el 26-08-2026 a las 19:00 en Bermeo',
  'el 26-08 solo ECMWF vio el sirimiri',
  'el 26-08 en Bilbao 119 aquí',
  /* Recomendaciones de la GUÍA y del MAPA. Los modelos del mapa son otra
     lista —ICON-D2, ARPEGE-EU…— que no entra en el reparto de la ficha:
     ahí el nombre se explica, no se afirma de quién es un dato. */
  'Para Euskadi:',
  'Para ir a 7 días',
  'un modelo de malla fina como',
  'Altura baja de torre',
  'Altura típica de torre',
  /* El propio modelo Automático, hablando de sí mismo. */
  'Aquí y ahora, Automático es',
  /* El cartel del mapa cuando ECMWF HRES lo tumba dos veces y la app se
     pasa sola a ICON-EU (31-08-2026). Son modelos DEL MAPA —otra lista,
     elegidos por botón, no por reparto— y la frase es la acción del
     propio selector: no envejece con el reparto de la ficha. */
  'te paso a ICON-EU',
  'ECMWF HRES sigue en la barra',
];

const ficheros = ['app.js', 'maps.js'];
const malos = [];

for (const f of ficheros) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');

  /* Los comentarios se borran conservando los saltos de línea, para que
     los números de línea sigan siendo los de verdad. Ahí dentro se
     explican los fallos viejos —«decía AROME HD»— y eso no es pantalla. */
  const limpio = src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));

  /* SE MIRA LÍNEA A LÍNEA, y no plantilla a plantilla. Lo intenté así
     primero y las plantillas anidadas —`${`...`}`— hacían que el barrido
     se comiera medio fichero y señalara líneas que no tenían nada. Un
     detector que grita donde no hay nada se acaba desconectando, que es
     como se pierden los guardias. */
  /* Las plantillas `…` de varias líneas: la línea de en medio no lleva
     comilla ninguna y este guardia se la saltaba. Así se le escapó
     «ECMWF y AROME HD no la publican» en la nota del parte (25-09-2026).
     Se cuenta el acento grave: uno impar abre o cierra una plantilla. */
  let dentro = false;
  limpio.split('\n').forEach((l, i) => {
    const linea = i + 1;
    const ticks = (l.match(/`/g) || []).length;
    const enPlantilla = dentro || ticks > 0;
    if (ticks % 2 === 1) dentro = !dentro;
    /* La DEFINICIÓN de los modelos es su sitio: ahí vive el nombre. */
    if (/\b(name|nom|id|om|windy)\s*:/.test(l)) return;
    if (BLANCA.some(b => l.includes(b))) return;
    /* Y solo si va dentro de comillas, o dentro de una plantilla abierta en
       una línea anterior: un nombre suelto en código no se pinta. */
    if (!enPlantilla && !/['"]/.test(l)) return;
    for (const n of NOMBRES) {
      const rx = new RegExp('(^|[^\\w${])' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])');
      if (rx.test(l)) {
        malos.push({ f, linea, n, txt: l.trim().slice(0, 110) });
        break;
      }
    }
  });
}

if (malos.length) {
  console.log('\n  ✗ HAY TEXTO DE PANTALLA QUE NOMBRA UN MODELO A MANO:\n');
  for (const x of malos) {
    console.log(`     ${x.f}:${x.linea}  «${x.n}»`);
    console.log(`       ${x.txt}\n`);
  }
  console.log('     Un nombre escrito envejece con el primer cambio: ya ha pasado');
  console.log('     TRES veces y una de ellas estuvo cinco días mintiendo.');
  console.log('     Sácalo de modeloDato(), deQuienSale() o nombreDeModelo().');
  console.log('     Si de verdad es una explicación fija, añádela a BLANCA\n');
  process.exit(1);
}

console.log('  ✓ ningún texto de pantalla nombra un modelo a mano');
