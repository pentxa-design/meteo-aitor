/* ═══════════════════════════════════════════════════════════════════
   LA SEGUNDA PASADA, AUTOMATIZADA
   ───────────────────────────────────────────────────────────────────
   Pedido por Aitor el 26-08-2026 con estas palabras:

     «Por eso de verificar siempre 2 veces antes de publicarlo, eso
      automatizarlo, así se encuentran los errores.»

   Y tiene razón. `revisar.sh` coge la sintaxis y las variables
   huérfanas, pero NINGUNO de los fallos gordos de estos días era de
   sintaxis. Eran de criterio y de redacción, y solo salieron porque
   alguien se paró a mirar la salida caso por caso:

     · el aviso de tormenta saltaba con CAPE alto y nada que lo
       disparase (Girona, 25-08)
     · el parte casaba nombres y números por su posición en la lista
     · la lluvia se leía del modelo que no publica lluvia
     · «de 09:00 a 20:00» eran tres horas sueltas
     · una etiqueta verde con 12,4 mm debajo
     · cifras sin decir de qué hora eran

   Cada prueba de aquí abajo guarda UNO de esos fallos. Si alguna vuelve
   a romperse, esto lo canta y `deploy.sh` no publica.

   NO prueba el dibujo ni el color: prueba lo que DICE la app, que es lo
   que él lee para decidir si manda a alguien a una torre.

       node pruebas.js
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

let fallos = 0, pasadas = 0;
const grupo = t => console.log('\n  ' + t);
/* Cada prueba deja su nombre apuntado: `NO-SE-TOCA.md` los usa para
   comprobar que las reglas ya decididas siguen teniendo quien las
   guarde. Ver el bloque del final. */
const nombresEjecutados = new Set();
const ok = (q, cond, detalle) => {
  nombresEjecutados.add(q);
  if (cond) { pasadas++; console.log(`    ✓ ${q}`); }
  else { fallos++; console.log(`    ✗ ${q}${detalle ? `\n        ${detalle}` : ''}`); }
};

/* Saca una función del app.js REAL y la deja utilizable aquí. Se prueba
   el fichero que se va a publicar, no una copia que se queda vieja.

   CUIDADO con la diferencia, que me costó un rato: lo declarado con
   `function` sale del `eval` y queda visible; lo declarado con `const`
   NO — se queda encerrado y la siguiente función que lo use revienta con
   «no está definido». Por eso hay dos ayudantes. */
function sacar(firma, hasta = '\n}') {
  const i = src.indexOf(firma);
  if (i < 0) throw new Error(`no encuentro «${firma}» en app.js`);
  const j = src.indexOf(hasta, i) + hasta.length;
  return src.slice(i, j);
}

/** Para las que van con `const`: se reescriben como globales. */
function sacarConst(nombre) {
  /* ── EL CORTE NO PUEDE CAER DENTRO DE UN COMENTARIO ────────────────
     Cortaba en el primer «;» del texto, y el 02-09-2026 un punto y coma
     dentro de un comentario de `ELEGIDO_POR_ACIERTO` dejó el trozo a
     medias: `SyntaxError` y la publicación parada por un motivo que no
     tenía nada que ver con el código.

     Ahora se busca el «;» sobre una copia con los comentarios borrados
     (sustituidos por espacios, para no mover las posiciones), así que el
     índice sigue valiendo sobre el original. */
  const i = src.indexOf(`const ${nombre}`);
  if (i < 0) throw new Error(`no encuentro «const ${nombre}» en app.js`);
  const limpio = src
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  const j = limpio.indexOf(';', i);
  const trozo = src.slice(i, j + 1);
  return trozo.replace(new RegExp(`^const\\s+${nombre}\\s*=`), `globalThis.${nombre} =`);
}

/* Un almacén de mentira: `renderParte` guarda ahí la foto de «lo que ya
   te enseñé». En Node no hay localStorage, y sin esto la prueba del
   parte revienta antes de llegar a mirar nada. */
globalThis.LS = {
  _d: {},
  get(k, d) { return k in this._d ? JSON.parse(JSON.stringify(this._d[k])) : d; },
  set(k, v) { this._d[k] = JSON.parse(JSON.stringify(v)); },
  vaciar() { this._d = {}; },
};

/* La comparación «esto ha cambiado» la usan la prueba del parte y la
   suya propia: se saca una vez para las dos. */
globalThis.has = globalThis.has || (v => v !== null && v !== undefined && !Number.isNaN(v));
/* ── LOS LISTONES SE SACAN DE app.js, NO SE COPIAN AQUÍ (21-09-2026) ──
   Estaban escritos a pelo en el banco: `globalThis.CAPE_COMBINACION = 700`.
   O sea que el día que se recalibren —el CAPE ya se recalibró una vez, de
   800 a 700— la app cambiaría y las pruebas seguirían midiendo con el
   número viejo, en verde. Un banco que no mide lo que hay es peor que no
   tenerlo. Ahora salen de su dueño. */
eval(sacarConst('CAPE_COMBINACION'));
eval(sacarConst('TAPA_ROMPE'));
eval(sacarConst('nCape'));
eval(sacar('function claveDia(d) {'));
eval(sacar('function huellaParte(d) {'));
eval(sacar('function fraseCambio(antes, ahora) {'));
eval(sacarConst('VISTO_MIN'));

/* El orden de sus torres lo usan varias pruebas: se saca una sola vez. */
eval(sacar('function kmEntre(a, b) {'));
eval(sacarConst('BERMEO'));
eval(sacar('function deCasaAFuera(a, b) {'));
eval(sacar('function edadMedida(min) {'));
eval(sacar('function haceTxt(cuando, ahora = Date.now()) {'));
eval(sacar('function estacionDePortada() {'));
eval(sacarConst('CON_TAPA'));
eval(sacarConst('enCostaVasca'));
eval(sacarConst('COSTA'));
eval(sacarConst('cercaDelMar'));


// Lo mínimo que necesitan las funciones para correr fuera del navegador
globalThis.has = v => v !== null && v !== undefined && !Number.isNaN(v);
globalThis.esc = v => String(v);
globalThis.key = p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
globalThis.RANK = { go: 0, warn: 1, no: 2, nd: 3 };
globalThis.worst = (a, b) => (RANK[b] > RANK[a] ? b : a);
globalThis.wtxt = v => `${v.toFixed(0)} km/h`;
/* `assess()` compara sobre lo que se imprime desde el 05-09-2026 (wRed).
   Aquí en km/h con cero decimales, como lo tiene él. */
globalThis.wRed = v => (v === null || v === undefined || Number.isNaN(v)) ? null : Math.round(v);
/* La diferencia TAL COMO SE VE, puesta el 04-09-2026. Aquí en km/h con
   cero decimales, que es como él lo tiene: la de verdad respeta la
   unidad elegida. Lo que se prueba es que la resta salga de las cifras
   REDONDEADAS, no de los decimales de dentro. */
globalThis.difVista = (a, b, u = false) =>
  (has(a) && has(b)) ? `${Math.abs(Math.round(a) - Math.round(b))}${u ? ' km/h' : ''}` : null;

/* La puerta de «¿esto es de este emplazamiento?», sacada del propio
   app.js para que las funciones extraídas la encuentren. Se saca de
   verdad (no se reescribe aquí) para que si cambia allí, cambie aquí. */
eval(sacar('function deEsteSitio(est, place = null) {').replace('function deEsteSitio', 'globalThis.deEsteSitio = function'));
globalThis.wmoText = c => ({ 95: 'tormenta', 96: 'tormenta con granizo', 63: 'lluvia' }[c] ?? '—');
globalThis.isStormCode = c => [95, 96, 99].includes(c);

/* ── 1. LA REGLA DE LA TORMENTA ─────────────────────────────────────
   Las cuatro que rompieron de verdad tienen que seguir cantando, y
   Girona —que no cayó ni una descarga— tiene que callarse. */
eval(sacarConst('mmTxt'));
eval(sacar('function diaSiNoEsHoy(d) {'));
eval(sacarConst('esLlovizna'));
eval(sacar('function comoLlueve('));
globalThis.PERFILES = { hierro: { et: 'x', vientoManda: false, rafagaBestia: 70,
  lluviaManda: false, alturaImporta: false, sirimiriImporta: true } };
globalThis.perfil = () => PERFILES.hierro;
globalThis.S = { perfil: 'hierro' };
/* `assess` llama a `loQueMideLaNube`, así que va antes. */
eval(sacarConst('NUBE_ALTA'));
eval(sacarConst('NUBE_BAJA'));
eval(sacar('function loQueMideLaNube(h, place) {'));
/* Y `firmaTapa`, que `assess` usa en las tres frases de la tapa. */
eval(sacar('function firmaTapa('));
/* Y `tapaVale`, que es la regla del cero. */
eval(sacar('function tapaVale('));
/* `assess` llama a `peorRacha`, así que va antes. Y necesita `COMPARAR`,
   que se declara aquí abajo con los dos modelos de la prueba. */
globalThis.COMPARAR = globalThis.COMPARAR || [];
eval(sacar('function peorRacha('));
eval(sacar('function assess('));

const THR = { windWarn: 45, windNo: 60, gustWarn: 50, gustNo: 70,
              rainWarn: 0.2, rainNo: 2.0, capeWarn: 500, capeNo: 1000 };
const H = (cape, cin, pop, prec = 0, code = 1) => ({
  date: new Date(2026, 7, 26, 16), cape, cin, pop, prec, code,
  wind: 12, gust: 20, h: 3, temp: 24, rh: 60, vis: 20000, li: null,
  nieve: 0, nieveSuelo: 0, dew: 14 });
const rompe = h => assess(h, THR, 'hierro').reasons
  .some(r => /la combinación que rompe|tormenta en marcha/i.test(r.txt));

/* ── LO QUE TRAJO EL PORTÁTIL (13-09-2026) ───────────────────────────
   Del 05 al 13-09 Aitor cambió la app desde Calpe (rama portatil-2026-09-07):
   35 funciones nuevas del cielo, las franjas, el listón de ráfaga y «Antes
   de salir». Aquí se EJECUTAN de verdad, sacadas de app.js, para que las
   pruebas de casa no tengan que fingirlas. Si una no se encuentra, se
   dice y se sigue: la prueba que la necesite es la que fallará. */
for (const n of ['VELADO', 'tapado', 'SALIR_HORAS', 'SALIR_MEDIDA_VIEJA', 'TORRE_ALTO_M', 'HAY_AGUA']) {
  try { eval(sacarConst(n)); } catch (e) { console.log(`  (sin ${n}: ${e.message})`); }
}
for (const f of ['listonRafaga', 'veladoSiToca', 'medianaPonderada', 'cieloVotado', 'codigoVotado',
                 'esDeDia', 'cieloVisto', 'textoVisto', 'textoCielo', 'rangoDeHoras', 'tramosDeCielo',
                 'resumenCielo', 'extrasDe', 'horaDe', 'conAhora', 'horasDelDia', 'iconosDelDia',
                 'aguaPrestada', 'tormentaQueNoVesTu', 'nubesEnLaFranjaQueNoVesTu',
                 'aguaDelDiaQueNoVenTodos', 'estadoSalir', 'tramosCortos', 'rachaEnLaFranjaQueNoVesTu', 'cambioDeCielo']) {
  try { eval(sacar(`function ${f}(`)); } catch (e) { console.log(`  (sin ${f}: ${e.message})`); }
}

/* ══════════════════════════════════════════════════════════════════════
   EL OCASO DURABA UNA HORA DE MÁS (21-09-2026)
   ──────────────────────────────────────────────────────────────────────
   Suyo, desde Bermeo a las 20:25, con la foto del cielo rosa: el sol se
   había puesto a las 20:10 y la app seguía diciendo «Sol velado», con el
   dibujo de día. Lo pidió arreglado sin falta.

   MEDIDO contra lo publicado ese mismo rato, en su sitio:

       hora 19:00 → is_day 1        se pone el sol .... 20:10
       hora 20:00 → is_day 1    ←   y esta hora vale como DÍA entera
       hora 21:00 → is_day 0

   O sea CINCUENTA MINUTOS TODOS LOS DÍAS con el sol puesto y el rótulo de
   día. `conAhora` ya pisaba el código y las tres capas de nubes con lo de
   `current` —que es de este momento— y el día/noche no. Y `current.is_day`
   sí es del momento.

   Mismo despiste que el de Calpe del 08-09 (la luna con velo a las 23:49):
   aquello arregló la noche cerrada y dejó abierta la transición. El
   arreglo estaba a cinco líneas.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   EL CAPE DE UNO CON LA TAPA DE OTRO NO ES UNA PAREJA (21-09-2026)
   ──────────────────────────────────────────────────────────────────────
   De sus pantallazos de las 21:40, con la tarjeta de BI PUNTAGALEA:

       fila de cifras .....  130 CAPE  ·  0 TAPA · ABIERTA
       resumen, 2 líneas .. «130 de CAPE · tapa 381»

   MEDIDO contra la API en ese punto y esa hora:

       AROME HD .... CAPE 100 · tapa NO LA PUBLICA
       ECMWF ....... CAPE   0 · tapa no la publica
       ICON ........ CAPE   0 · tapa 0
       GFS ......... CAPE   0 · tapa 0
       Automático .. CAPE 100 · tapa 376

   O sea que la fila de cifras pegaba **el CAPE de AROME a la tapa de
   ICON**, y ICON ahí no ve ni gota de gasolina: su cero significa «no hay
   masa que levantar», no «la tapa está quitada». El resumen sí enseñaba
   la pareja honrada (mismo modelo, misma hora).

   Y no es un día raro: AROME HD —su modelo por defecto— **no publica la
   tapa NI UNA HORA** (0 de 385 medidas), así que con AROME puesto la tapa
   viene prestada SIEMPRE; y quien la presta la da en 0 el 69 % de las
   horas. El rojo de la tormenta se estaba calculando con esa pareja
   mezclada: con AROME en 800 y la tapa prestada en 0, la tarjeta pintaría
   en rojo una tormenta que no pronostica ningún modelo.

   La regla de esta casa está escrita desde agosto en `parteTorres`: la
   pareja se enseña «misma hora, mismo modelo, para enseñar cifras que de
   verdad ocurrieron juntas».
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   UNA TAPA EN 0 DE QUIEN NO VE GASOLINA NO ES UNA TAPA ABIERTA
   ──────────────────────────────────────────────────────────────────────
   El 21-09 esto se arregló SOLO en `parteTorres`. El 22-09 por la noche
   volvió a salir en sus seis tarjetas a la vez —«40 de CAPE · 0 TAPA ·
   ABIERTA»— y él lo dijo como hay que decirlo: *«lo reparas, dices que
   encuentras el fallo para que no pase, pasan 24 horas y lo mismo»*.
   No era el mismo fallo volviendo: era yo arreglando una puerta de seis.

   MEDIDO el 22-09-2026 contra la API, 432 horas (6 sitios × 72 h, ICON):

       cuando ICON daba CAPE 0   →  tapa 0 en 379 de 386 horas (98 %)
       cuando ICON daba CAPE >0  →  tapa 0 en   8 de  46 horas (17 %)

       Bermeo 70/72 h · Orduña 67/72 · Matiena 70/72 · Girona 68/72

   Así que el 0 es «aquí no veo nada», no «la tapa está abierta». Y con
   AROME HD puesto la tapa viene prestada SIEMPRE (AROME no la publica
   ni una hora), de modo que ese 0 es lo que él veía cada día.

   LO QUE NO SE TOCA: el ámbar sigue saliendo igual. Ante la duda se
   avisa. Lo que cambia es la frase, no el color.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   UNA CLAVE QUE NOS INVENTAMOS NOSOTROS NO PUEDE VIAJAR A LA API
   ──────────────────────────────────────────────────────────────────────
   `completarLargo()` manda a Open-Meteo TODAS las claves que tiene en
   memoria. Las que nos inventamos nosotros no existen allí, y la API
   contesta **400 a la petición entera**: ocho de los diez días en blanco,
   con el catch tragándoselo en silencio.

   Pasó el 01-09-2026 con `weather_code_lluvia`. Se puso un filtro de
   lista negra. Y el 22-09-2026 volvió a pasar con `cape_de_la_tapa`,
   añadida esa misma noche: la lista negra no protege de la siguiente.

   Esta guarda es la que cierra la clase: cualquier clave con nombre
   propio que la app escriba en `hourly` tiene que estar registrada en
   `CLAVES_NUESTRAS`, y ninguna de ellas puede salir en la petición.
   ══════════════════════════════════════════════════════════════════════ */
grupo('Una clave inventada por nosotros no puede viajar a la API (22-09-2026)');
{
  const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '');

  const lista = (codigo.match(/const CLAVES_NUESTRAS = \[([^\]]*)\]/) || [])[1] || '';
  const registradas = [...lista.matchAll(/'([^']+)'/g)].map(m => m[1]);

  ok('la lista de claves nuestras existe y no está vacía',
     registradas.length >= 2,
     `registradas: ${registradas.join(', ') || '¡ninguna!'}`);

  /* Toda clave que la app escriba en hourly con nombre propio. Las que
     llevan el nombre de un modelo detrás (`cape_icon_seamless`) las
     escribe el bucle de la comparativa y sí existen en la API. */
  const escritas = [...codigo.matchAll(/\.hourly\.([a-z_0-9]+)\s*=/g)]
    .map(m => m[1])
    .filter(k => k !== 'time');
  const sinRegistrar = [...new Set(escritas)]
    .filter(k => !registradas.includes(k))
    .filter(k => !/_(?:icon|gfs|ecmwf|arome|arpege|knmi|gem|best)_/.test(k));
  ok('ninguna clave inventada se escribe en hourly sin registrar',
     sinRegistrar.length === 0,
     sinRegistrar.length
       ? `sin registrar: ${sinRegistrar.join(', ')} — o es real, o va a CLAVES_NUESTRAS`
       : `${escritas.length} escrituras, todas conocidas`);

  ok('el relleno de los diez días las quita por la lista, no por el sufijo',
     /const campos = Object\.keys\(H\)\.filter\(k => k !== 'time' && !CLAVES_NUESTRAS\.includes\(k\)\);/.test(src),
     'con `!k.endsWith(\'_lluvia\')` la siguiente clave vuelve a romperlo');

  /* Y la prueba de verdad: se arma el filtro y se comprueba que ninguna
     de las nuestras pasa. Leer el código no basta: esto lo ejecuta. */
  {
    const H = { time: [], temperature_2m: [], cape: [] };
    for (const k of registradas) H[k] = [];
    const campos = Object.keys(H).filter(k => k !== 'time' && !registradas.includes(k));
    ok('ejecutado: el filtro deja fuera TODAS las nuestras y ninguna real',
       registradas.every(k => !campos.includes(k))
       && campos.includes('temperature_2m') && campos.includes('cape'),
       `pasa: ${campos.join(', ')}`);
  }
}

grupo('Una tapa en 0 de quien no ve gasolina no dice nada (22-09-2026)');
{
  /* La escala de la tapa, que más abajo se saca otra vez para lo suyo. */
  eval(sacar('function textoTapa(cin, h) {'));
  eval(sacar('function fraseTapa(cin, h) {'));
  const h = (cape, cin, tapaDe, capeTapa) => ({ cape, cin, tapaDe, capeTapa });

  ok('la tapa del propio modelo SIEMPRE cuenta',
     tapaVale(h(800, 10, null, null)) === true && tapaVale(h(800, 10, null, 0)) === true,
     'ahí el CAPE y la tapa salen del mismo sitio: no hay nada que dudar');
  ok('la prestada cuenta si el que la presta veía gasolina',
     tapaVale(h(800, 10, 'ICON', 240)) === true);
  ok('y NO cuenta si el que la presta veía CAPE 0',
     tapaVale(h(800, 0, 'ICON', 0)) === false,
     'es el caso de sus seis tarjetas del 22-09 a las 20:26');
  ok('sin saber qué veía el que la presta, se cuenta: nunca se apaga por una duda',
     tapaVale(h(800, 0, 'ICON', null)) === true && tapaVale(h(800, 0, 'ICON', undefined)) === true,
     'respuesta vieja guardada, u hora armada a mano; ante la duda, como estaba');

  ok('la palabra se calla cuando la cifra no dice nada',
     textoTapa(0, h(800, 0, 'ICON', 0)) === 'no dice nada',
     '«abierta» al lado de 40 de CAPE se lee como la combinación que rompe');
  ok('y la escala entera sigue igual cuando la tapa sí cuenta',
     textoTapa(0, h(800, 0, null, null)) === 'abierta'
     && textoTapa(30, h(0, 30, null, null)) === 'floja'
     && textoTapa(100, h(0, 100, null, null)) === 'aguanta'
     && textoTapa(300, h(0, 300, null, null)) === 'fuerte'
     && textoTapa(0) === 'abierta',
     'sin la hora se comporta como siempre: no se rompe ninguna llamada vieja');

  /* ── LO QUE DE VERDAD IMPORTA: que el aviso NO se apague ──────────── */
  {
    const base = { date: new Date(2026, 7, 26, 16), pop: 80, prec: 0, code: 1,
                   wind: 12, gust: 20, h: 3, temp: 24, rh: 60, vis: 20000,
                   li: null, nieve: 0, nieveSuelo: 0, dew: 14 };
    const conTapaMuda = assess({ ...base, cape: 1200, cin: 0, tapaDe: 'ICON', capeTapa: 0 },
                               THR, 'hierro');
    const conTapaBuena = assess({ ...base, cape: 1200, cin: 0, tapaDe: null, capeTapa: null },
                                THR, 'hierro');
    const txtMuda = conTapaMuda.reasons.map(r => r.txt).join(' | ');
    const txtBuena = conTapaBuena.reasons.map(r => r.txt).join(' | ');

    ok('con la tapa muda el aviso SIGUE saliendo, y del mismo color',
       conTapaMuda.st === conTapaBuena.st && conTapaMuda.st !== 'go',
       `muda=${conTapaMuda.st} buena=${conTapaBuena.st} — si esto se cae, se pierde un aviso de verdad`);
    ok('pero ya NO dice «la tapa está abierta»',
       !/la tapa está abierta/.test(txtMuda),
       txtMuda.slice(0, 160));
    ok('y dice por qué no lo dice, con el nombre del que la presta',
       /la tapa no la sabe nadie/.test(txtMuda) && /ICON/.test(txtMuda),
       txtMuda.slice(0, 160));
    ok('con la tapa buena la frase de siempre no se ha movido',
       /hay gasolina Y la tapa está abierta/.test(txtBuena),
       txtBuena.slice(0, 160));
  }

  /* ── LA GUARDA DE CLASE ───────────────────────────────────────────── */
  ok('la regla vive en UNA función, no repartida por la app',
     /function tapaVale\(h\) \{/.test(src)
     && /if \(!h\?\.tapaDe\) return true;/.test(src)
     && /if \(!has\(h\.capeTapa\)\) return true;/.test(src)
     && /return h\.capeTapa > 0;/.test(src));
  {
    /* Todas las llamadas a textoTapa() tienen que pasar la hora: sin ella
       la función no puede aplicar la regla y vuelve a decir «abierta». */
    /* SIN LOS COMENTARIOS. La casa documenta mucho —y bien—, así que en
       app.js hay tres sitios donde `textoTapa()` aparece explicado en
       prosa. Una guarda que los cuente como llamadas es una guarda que
       da la lata sin motivo, y una guarda pesada acaba desactivada. */
    const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '');
    const llamadas = [...codigo.matchAll(/textoTapa\(([^)]*)\)/g)]
      .filter(m => !/^cin, h$/.test(m[1]))          // la propia definición
      .map(m => m[1]);
    const sinHora = llamadas.filter(a => !/,/.test(a));
    ok('todas las llamadas a textoTapa() pasan la hora',
       sinHora.length === 0,
       sinHora.length ? `sin hora: textoTapa(${sinHora.join('), textoTapa(')})` : `${llamadas.length} llamadas, todas con hora`);
  }
  /* ── LA ESCALA DE LA TAPA VIVE EN UN SOLO SITIO ───────────────────
     Y ésta es la guarda que faltaba. La de arriba vigila las llamadas a
     `textoTapa()`, así que el arreglo del cero mudo llegó a los sitios
     que la llaman… y se quedó fuera de los DOS que tenían la escala
     copiada a mano con las palabras largas («Sin tapa: si hay CAPE,
     rompe»). Se vio en su propia pantalla, en vivo, después de publicar
     el arreglo: la ficha de Riesgo eléctrico lo seguía diciendo.

     Él, esa noche: *«otro fallo tonto diario, que no pase»*. La forma de
     que no pase no es vigilar la función: es **prohibir la copia**. Si
     cualquiera de estas palabras aparece dos veces fuera de comentario,
     hay una segunda escala suelta y el próximo arreglo volverá a dejarla
     atrás. La puerta se cierra aquí. */
  {
    const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '');
    /* Las frases largas son inconfundibles: una sola vez cada una. */
    const LARGAS = ['Sin tapa: si hay CAPE, rompe', 'Tapa floja', 'Tapa que aguanta',
                    'Tapa fuerte'];
    const repes = LARGAS.filter(t => codigo.split(t).length - 1 !== 1);
    ok('cada frase larga de la escala de la tapa aparece UNA sola vez en el código',
       repes.length === 0,
       repes.length ? `copiada o perdida: ${repes.join(' · ')}` : 'las cuatro, una vez cada una');
    /* Las cortas (abierta/floja/aguanta/fuerte) se usan para otras cosas
       —«lluvia fuerte» en los iconos—, así que aquí no vale contar la
       palabra suelta: lo que se prohíbe es la ESCALERA, las cuatro
       seguidas, que es la forma que tiene una escala copiada. */
    const escaleras = [...codigo.matchAll(/'abierta'/g)].filter(m => {
      const v = codigo.slice(m.index, m.index + 400);
      return /'floja'/.test(v) && /'aguanta'/.test(v) && /'fuerte'/.test(v);
    });
    ok('la escalera corta abierta/floja/aguanta/fuerte existe en UN solo sitio',
       escaleras.length === 1,
       `hay ${escaleras.length}; si son dos, el próximo arreglo de la tapa dejará una atrás`);
    ok('y las dos fichas la piden a fraseTapa(), con la hora',
       /const cinTxt = !has\(c\.cin\) \? nd : fraseTapa\(c\.cin, c\);/.test(src)
       /* 25-09-2026: cuando salta la regla la casilla da número y listón, no
          la palabra; fuera de la regla sigue pidiendo a fraseTapa con la hora */
       && /const tapaTxt = tormenta\s*\n?\s*\? `tapa \$\{Math\.round\(c\.cin\)\}\$\{firmaTapa\(c\)\} \(por debajo de \$\{TAPA_ROMPE\}\)`\s*\n?\s*: fraseTapa\(c\?\.cin, c\);/.test(src),
       'Riesgo eléctrico y Detalles: los dos sitios donde él lo vio el 22-09');
  }
  ok('fraseTapa dice quién puso el cero, y se calla la escala',
     fraseTapa(0, { cape: 800, cin: 0, tapaDe: 'ICON', capeTapa: 0 })
       === 'La tapa no dice nada aquí: ese 0 lo pone ICON, que no ve gasolina'
     && fraseTapa(0, { cape: 800, cin: 0, tapaDe: null }) === 'Sin tapa: si hay CAPE, rompe'
     && fraseTapa(100, { cape: 0, cin: 100, tapaDe: null }) === 'Tapa que aguanta'
     && fraseTapa(null, {}) === '',
     'la escala entera intacta cuando la tapa sí vale');

  ok('los tres avisos de assess() se bifurcan con la regla, no la ignoran',
     (src.match(/bump\('(?:warn|no)', \(tapaVale\(h\)/g) || []).length === 3,
     'si alguno deja de mirarla, vuelve a escribir «la tapa está abierta» sobre un cero mudo');
  ok('el CAPE del que presta la tapa se pide en la MISMA llamada y se guarda aparte',
     /const conTapa = ks\.includes\('convective_inhibition'\);/.test(src)
     && /\+ \(conTapa && !ks\.includes\('cape'\) \? ',cape' : ''\)/.test(src)
     && /if \(conTapa && traeAlgo\(d\.hourly\?\.cape\)\) f\.hourly\.cape_de_la_tapa = alinear\(d\.hourly\.cape\);/.test(src),   // por hora, no por posición (25-09)
     'sin una petición de más, y sin pisar el CAPE del modelo cargado');
  ok('y la hora lo lleva, como lleva el dueño de la tapa',
     /capeTapa: H\.cape_de_la_tapa\?\.\[i\],/.test(src));
}

grupo('El CAPE de uno con la tapa de otro no es una pareja (21-09-2026)');
{
  const hora = (cape, cin, tapaDe) => ({ cape, cin, tapaDe });
  const rojo = h => !h.tapaDe && has(h.cin) && h.cin < globalThis.TAPA_ROMPE
                 && has(h.cape) && h.cape >= globalThis.CAPE_COMBINACION;

  ok('la regla del rojo está escrita con la tapa propia, no con la prestada',
     /const tapaAbierta = !h\.tapaDe\s*\n\s*&& has\(h\.cin\) && h\.cin < TAPA_ROMPE\s*\n\s*&& has\(h\.cape\) && h\.cape >= CAPE_COMBINACION;/.test(src),
     'con AROME puesto la tapa viene prestada SIEMPRE: 0 de 385 horas la publica él');

  ok('con la tapa PRESTADA no se pinta la tormenta, aunque los números cuadren',
     rojo(hora(800, 0, 'ICON')) === false,
     'CAPE 800 de AROME con la tapa 0 de ICON es una pareja que no pronostica nadie');
  ok('y con la tapa del MISMO modelo sí se pinta',
     rojo(hora(800, 0, null)) === true,
     'si esto se cae, se pierde el aviso de verdad y eso es peor que el falso');
  ok('por debajo de los listones no se pinta ni con tapa propia',
     rojo(hora(130, 0, null)) === false && rojo(hora(800, 381, null)) === false);

  ok('y la casilla dice de quién es la tapa cuando no es del que da el CAPE',
     /h\.tapaDe \? ` · la da \$\{esc\(h\.tapaDe\)\}, no \$\{esc\(modeloDato\(\)\?\.name \?\? ''\)\}` : ''/.test(src),
     'sin decirlo, dos modelos distintos se leen como una pareja');
  /* ── LA GUARDA DE CLASE, no de este sitio (22-09-2026) ─────────────
     El 21-09 se arregló la TARJETA. El 22-09, con sus pantallazos de las
     20:26 delante, la misma pareja sin firmar seguía saliendo en la tabla
     de «ESTA HORA», en el KPI de Riesgo eléctrico, en la tarjeta de hora,
     en las cifras del pico de la franja y en los dos titulares del parte:
     siete sitios más. Se arreglan de uno en uno y luego se cierra la
     clase entera, que es lo que él pidió: «que no vuelvan a salir».

     La regla: si una plantilla pinta una tapa Y un CAPE cerca, tiene que
     decir de quién es la tapa. Vale cualquiera de las firmas de la casa
     —`firmaTapa()`, `tapaDe`, `dueñoCin`, `.quien`, `.modelo`— o ser el
     caso de la comparativa (`cmp__tap`), que pide los campos POR MODELO
     —`convective_inhibition_${m.om}`, línea 6313— y cuyo encabezado ya
     dice «CAPE con su tapa»: ahí cada fila es un modelo entero, con su
     CAPE y su tapa, y no hay nada prestado que firmar.

     Si mañana alguien añade un sitio nuevo que pinte la pareja sin
     firmarla, esta cuenta sube y la publicación se para. */
  {
    const re = /\$\{[^}]*\b(?:cin|cinT)\b[^}]*\}/g;
    const FIRMAS = /firmaTapa|tapaDe|due(?:ñ|n)oCin|\.quien|\.modelo\b|cmp__tap/;
    let m, parejas = 0; const sinFirmar = [];
    while ((m = re.exec(src))) {
      const v = src.slice(Math.max(0, m.index - 500), m.index + 300);
      if (!/\bcape\b/.test(v)) continue;      // una tapa sola no es pareja
      parejas++;
      if (!FIRMAS.test(v)) sinFirmar.push(src.slice(0, m.index).split('\n').length);
    }
    ok('ninguna pareja CAPE+tapa se pinta sin decir de quién es la tapa',
       sinFirmar.length === 0,
       sinFirmar.length ? `sin firmar en las líneas ${sinFirmar.join(', ')} de app.js` : '');
    ok('y la cuenta de sitios donde se pinta la pareja no se ha movido a ciegas',
       parejas >= 18 && parejas <= 24,
       `hay ${parejas}; el 22-09-2026 eran 20. Si cambia mucho, mirar qué se ha añadido`);
  }

  ok('el ayudante de la firma existe y se calla con la tapa propia',
     /function firmaTapa\(h\) \{\s*\n\s*return h\?\.tapaDe \? ` \(la da \$\{h\.tapaDe\}\)` : '';\s*\n\}/.test(src),
     'un solo sitio donde se escribe la frase, para que no vuelva a haber diez');
  ok('la tabla de ESTA HORA firma su tapa, que es la que él mira a diario',
     /· tapa \$\{H\.cin\.toFixed\(0\)\}\$\{\s*\n?\s*H\?\.tapaDe \? ` <small>la da \$\{esc\(H\.tapaDe\)\}<\/small>` : ''\}/.test(src),
     'la cabecera de esa columna firma AROME HD y AROME no publica tapa');
  ok('los tres avisos de assess() firman la tapa en la propia frase',
     (src.match(/\$\{h\.cin\.toFixed\(0\)\}\$\{firmaTapa\(h\)\}/g) || []).length >= 3,
     'son los que le salen en ámbar: «CAPE 800 y la tapa en 0» sin decir de quién');

  ok('la hora lleva el dueño de la tapa, como ya llevaba el del cielo',
     /const dueñoTapa = presta\('convective_inhibition'\)/.test(src)
     && /const tapaDe = dueñoTapa && dueñoTapa !== mio \? dueñoTapa : null;/.test(src)
     && /codigoAjeno, cieloDe, tapaDe,/.test(src),
     'y en null cuando la tapa es del propio modelo, para que nada cambie en ese caso');
}

/* ══════════════════════════════════════════════════════════════════════
   UN TOTAL QUE SE CONTRADICE CONSIGO MISMO NO PUEDE DISPARAR UN AVISO
   ──────────────────────────────────────────────────────────────────────
   MEDIDO el 22-09-2026 a las 11:17 en Bermeo, con sus fotos del cielo
   delante —azul limpio, «algunas estelas sueltas altas blancas, poca cosa»:

       ECMWF  3 %   ·  GFS  11 %  ·  ICON  26 %  ·  Automático  95 %
       (a las 12h el Automático subía a 98)

   Y ese 98 % venía con **bajas 0 · medias 5 · altas 0**. La unión no puede
   ser mayor que la suma de las partes: ese total no existe. Con ese número
   imposible, y solo con él, le salió «⚠ Automático lo ve cubierto» encima
   de un cielo despejado.

   La app YA cazaba el disparate en `loQueTapa()` (`sinExplicar`, margen de
   10 puntos medido a tres días), pero `cieloRaro` no lo miraba: cogía el
   total de cada modelo a pelo.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   UNA TAPA SIN GASOLINA DEBAJO NO ES UNA TAPA (22-09-2026)
   ──────────────────────────────────────────────────────────────────────
   `tapaSuelo` cogía el CIN más bajo de CUALQUIER hora del día, incluidas
   aquellas en las que ese mismo modelo da CAPE 0. Y los modelos publican
   la tapa en 0 justo cuando no ven convección: ICON el 69 % de las horas,
   GFS el 73 % (medido el 21-09).

   MEDIDO en Lekeitio, siete días seguidos, los tres modelos con tapa:

       tapaSuelo como estaba .... 0,0 los SIETE días
       tapaSuelo arreglado ...... 478 · 486 · 335 · 0 · 157 · 12 · 11

   O sea que `alFilo` —capeTecho >= 700 Y tapaSuelo < 75— se reducía en la
   práctica a capeTecho >= 700: la tapa no filtraba NADA y el rojo salía
   por el CAPE suelto, que es lo que esta casa tiene prohibido. Es el
   mismo cero del 26-08 que él cazó, pero por la otra cara: allí empujaba
   al verde, aquí al rojo.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   EL RÓTULO NO PUEDE JURAR UN MODELO QUE NO ES (22-09-2026)
   ──────────────────────────────────────────────────────────────────────
   Tres frases de «Mis estaciones» que afirmaban lo contrario de lo que
   hace el código. Salieron del barrido con agentes sobre sus pantallazos.

   1. La cabecera de ESTA HORA decía «los 5 juntos» para las SIETE filas.
      El cuerpo sale de las horas de S.torres, cargadas con UN modelo: el
      suyo. Solo la fila de la racha usa `rachaCinco`, que sí es el máximo
      de los cinco (se arregló así el 31-08 y se quedó sola). El 26-08
      AROME HD daba 0,0 mm en Durango con ICON dando 1,3 esa misma hora, y
      la fila de lluvia —su prioridad 1— salía «0,0» bajo ese rótulo.

   2. El pie de las barras prometía «el más alto es el que usa el
      semáforo». No: `assess()` lee la lluvia y la racha del modelo
      CARGADO. Con las barras enseñando ICON 1,3, ese pie y la chapa en
      SIN NADA, lo que se concluye es lo contrario de la verdad.

   NO se cambia qué modelo manda: eso lo decidió él el 02-09 («yo quiero
   como Windy»). Se cambia lo que el rótulo afirma.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   EL MARCADOR PINTABA DE VERDE AL QUE SE QUEDA CORTO (22-09-2026)
   ──────────────────────────────────────────────────────────────────────
   Tres fallos de la misma pantalla, medidos sobre lo que servía ese día.

   1. EL SIGNO SE BORRABA. `Math.abs()` hacía que «cuadra (10 km/h)» en
      verde y «se queda 10 corto» en rojo fueran el mismo número impreso.
      En el Oiz —998 m, donde se sube a torre— ARPEGE salía «cuadra
      (10 km/h)» en VERDE con sesgo real −9,9: casi diez corto. De 187
      filas, 176 decían «cuadra» (94 %) y 56 de esas verdes tenían el
      sesgo NEGATIVO. Un marcador con el 94 % en verde no separa nada.

   2. LA RAYA DE LA LLUVIA ERA UN 1 REDONDO puesto a ojo. Sus listones
      son 0,2 y 2,0. Con el 1, las 42 filas de lluvia de producción —7
      estaciones × 6 modelos— decían las 42 «cuadra» en verde.

   3. EL QUE NO LLEGABA A 5 MUESTRAS DESAPARECÍA SIN DECIR NADA. Seis
      filas borradas, la peor en su cabo: Matxitxako enseñaba cinco
      modelos, cuatro verdes, y ARPEGE no estaba — 4 muestras, sesgo
      −13,2, lo peor 22,1 corto.

   La cabecera de api/marcador.mjs ya lo decía: el sesgo es la media CON
   SIGNO, «y quedarse corto es lo que le manda a alguien a una torre con
   más viento del que creía».
   ══════════════════════════════════════════════════════════════════════ */
grupo('El marcador pintaba de verde al que se queda corto (22-09-2026)');
{
  const frase = (sesgo, raya) => {
    const txt = v => `${v} km/h`;
    const corto = sesgo <= -raya, pasa = sesgo >= raya;
    return corto ? `se queda ${txt(-sesgo)} corto`
         : pasa  ? `se pasa ${txt(sesgo)}`
         : sesgo < 0 ? `cuadra, va ${txt(-sesgo)} corto`
         : sesgo > 0 ? `cuadra, va ${txt(sesgo)} largo`
                     : 'cuadra, clavado';
  };

  ok('el que va corto por debajo de la raya lo DICE, no sale como si clavara',
     frase(-9.9, 10) === 'cuadra, va 9.9 km/h corto',
     'en el Oiz salía «cuadra (10 km/h)» en verde con el sesgo real en −9,9');
  ok('y el que se pasa también lo dice',
     frase(4, 10) === 'cuadra, va 4 km/h largo');
  ok('clavado es clavado, y solo el cero',
     frase(0, 10) === 'cuadra, clavado');
  ok('y por encima de la raya no cambia nada de lo que ya estaba',
     frase(-12, 10) === 'se queda 12 km/h corto' && frase(12, 10) === 'se pasa 12 km/h',
     'esto es lo que impide que el arreglo se coma los rojos que ya salían');

  ok('el signo ya no se borra con Math.abs',
     !/cuadra \(\$\{txt\(Math\.abs\(m\.sesgo\)\)\}\)/.test(src)
     && /m\.sesgo < 0 \? `cuadra, va \$\{txt\(-m\.sesgo\)\} corto`/.test(src),
     '«cuadra (10)» verde y «se queda 10 corto» rojo eran el mismo número');
  ok('la raya de la lluvia sale de SU listón, no de un 1 redondo',
     /const raya = esAgua \? \(S\.thr\?\.rainWarn \?\? 0\.2\) : 10;/.test(src)
     && !/const raya = esAgua \? 1 : 10;/.test(src),
     'con el 1, las 42 filas de lluvia decían las 42 «cuadra» en verde');
  ok('y el que no llega a las cinco comparaciones sale, sin número',
     /const cortos = e\.modelos\.filter\(m => !m\.bastante\);/.test(src)
     && /todavía no dice nada/.test(src)
     && /\$\{m\.n\} de \$\{minimo\} comparaciones/.test(src),
     'un hueco no puede parecer «aquí no pasa nada»: ARPEGE con −13,2 no estaba');
}

grupo('El rótulo no jura un modelo que no es (22-09-2026)');
{
  ok('la cabecera de ESTA HORA dice el modelo cargado, no «los 5 juntos»',
     /<th>LOS MODELOS<span>\$\{\(\(\) => \{/.test(src)
     && /\}\)\(\)\}\$\{esc\(model\(\)\.name\)\} · a 10 m<br>/.test(src)
     && !/los \$\{MODELOS_TORMENTA\.length\} juntos · a 10 m<\/span>/.test(src),
     'seis de las siete filas son del modelo cargado, no de los cinco');
  ok('y la racha se señala como lo que es: la excepción',
     /<i>la racha, la más alta de los \$\{MODELOS_TORMENTA\.length\}<\/i>/.test(src),
     'esa sí es el máximo de los cinco desde el 31-08');
  /* OJO, y por poco: en la RACHA el pie SÍ era verdad. `assess` usa
     `gMax = max(cargado, peorRacha)`. El que mentía era el de la LLUVIA,
     que lee `h.prec` del cargado quince veces sin máximo ninguno. Se
     cambia ese y SOLO ese: cambiar el de la racha habría metido un fallo
     nuevo arreglando uno viejo. */
  ok('el pie de la LLUVIA dice con qué modelo va el semáforo',
     /en mm\/h · el semáforo va con \$\{esc\(model\(\)\.name\)\}; aquí tienes lo que ven los demás/.test(src),
     'la lluvia del semáforo es la del cargado, no la más alta: su prioridad 1');
  ok('y el de la RACHA se queda como estaba, porque ahí SÍ usa el más alto',
     /'el más alto es el que usa el semáforo', '',/.test(src)
     && /const gMax = has\(h\.gust\) \? Math\.max\(h\.gust, otra\?\.v \?\? 0\)/.test(src),
     'si se cambian los dos a la vez, se mete un fallo nuevo arreglando uno viejo');
}

grupo('Una tapa sin gasolina debajo no es una tapa (22-09-2026)');
{
  const suelo = (horas, conArreglo) => {
    let t = null;
    for (const [cape, cin] of horas) {
      if (conArreglo ? (cape > 0 && (t === null || cin < t)) : (t === null || cin < t)) t = cin;
    }
    return t;
  };
  const dia = [[0, 0], [120, 478], [970, 296], [0, 0]];

  ok('sin el arreglo, el suelo de la tapa se lo lleva la hora SIN gasolina',
     suelo(dia, false) === 0,
     'los modelos ponen la tapa en 0 cuando no ven convección: ICON el 69 % de las horas');
  ok('con el arreglo, el suelo es el de las horas que SÍ tienen gasolina',
     suelo(dia, true) === 296,
     'medido en Lekeitio: 0,0 los siete días antes; 478·486·335·0·157·12·11 después');
  ok('y si de verdad hay una hora con gasolina y la tapa abierta, el suelo sigue bajando',
     suelo([[800, 10], [0, 0], [120, 400]], true) === 10,
     'esto es lo que impide que el arreglo se coma un AL FILO de verdad');
  ok('un día entero sin gasolina se queda sin suelo, no en cero',
     suelo([[0, 0], [0, 5]], true) === null,
     'un hueco no es un cero: sin gasolina no hay nada que tapar');
}

grupo('Un total de nubes que no cuadra con sus capas no vota (22-09-2026)');
{
  const cuadra = new Function('C', 'i', 'has', `
    const cuadraConsigo = ${sacar('  const cuadraConsigo = om => {', '\n  };').trim().replace('const cuadraConsigo = ', '')}
    return cuadraConsigo;`);

  const C = {
    // El Automático de ese día: 98 con las capas a cero. Imposible.
    'cloud_cover_best_match': [98], 'cloud_cover_low_best_match': [0],
    'cloud_cover_mid_best_match': [5], 'cloud_cover_high_best_match': [0],
    // ECMWF, coherente: 5 de total con 5 de altas.
    'cloud_cover_ecmwf_ifs025': [5], 'cloud_cover_low_ecmwf_ifs025': [0],
    'cloud_cover_mid_ecmwf_ifs025': [0], 'cloud_cover_high_ecmwf_ifs025': [5],
    // Solapadas: bajas 40 y altas 40 con total 70 es CORRECTO, no descuadre.
    'cloud_cover_icon_seamless': [70], 'cloud_cover_low_icon_seamless': [40],
    'cloud_cover_mid_icon_seamless': [0], 'cloud_cover_high_icon_seamless': [40],
    // Sin capas publicadas: no se juzga, vota.
    'cloud_cover_gfs_seamless': [90],
  };
  const f = cuadra(C, 0, globalThis.has);

  ok('el 98 % con las capas a cero NO vota: ese total no existe',
     f('best_match') === false,
     'la unión no puede ser mayor que la suma de las partes');
  ok('pero el que cuadra sí vota',
     f('ecmwf_ifs025') === true);
  ok('y las capas que se solapan NO son un descuadre: bajas 40 + altas 40 con total 70 es correcto',
     f('icon_seamless') === true,
     'la regla no es «el total por encima de todas las capas», es «por encima de la SUMA»');
  ok('un modelo que no publica sus capas no se juzga: sigue votando',
     f('gfs_seamless') === true,
     'no tener capas no es tener la aritmética rota');

  ok('y `cieloRaro` filtra de verdad con esa regla',
     /&& x\.om !== dueno && x\.n !== nomDueno && cuadraConsigo\(x\.om\)\);/.test(src),
     'avisar con un número imposible es gastar el aviso, y lo paga el que está subiendo al monte');
  ok('el margen es el mismo 10 que ya estaba medido, no uno nuevo a ojo',
     /return !has\(tot\) \|\| tot - cs\.reduce\(\(a2, b2\) => a2 \+ b2, 0\) <= 10;/.test(src)
     && /C\.cloud_cover - capas\.reduce\(\(a2, x\) => a2 \+ x\.v, 0\) > 10/.test(src),
     'dos sitios con el mismo listón: si se cambia uno hay que cambiar el otro');
}

grupo('El ocaso: de noche es de noche en cuanto se pone el sol (21-09-2026)');
{
  const hora = (t, day) => ({ date: new Date(t), t, day, code: 4, cloud: 60,
                              nubesBajas: 0, nubesMedias: 0, nubesAltas: 96 });

  /* 20:25, sol puesto a las 20:10: la hora dice día, el momento dice noche. */
  const h1 = hora('2026-09-21T20:00', 1);
  conAhora(h1, { time: '2026-09-21T20:25', is_day: 0, weather_code: 4, cloud_cover: 60 });
  ok('con el sol ya puesto, la hora en curso pasa a NOCHE',
     h1.day === 0,
     'de 20:10 a 21:00 el rótulo iba de día todos los días del año');
  ok('y entonces el texto es el velo de noche, no el sol velado',
     textoVisto(globalThis.VELADO ?? 4, h1.day) === 'Velo de nubes altas',
     textoVisto(globalThis.VELADO ?? 4, h1.day));

  /* Y a las 19:30, con el sol todavía arriba, sigue siendo de día. */
  const h2 = hora('2026-09-21T19:00', 1);
  conAhora(h2, { time: '2026-09-21T19:30', is_day: 1, weather_code: 4 });
  ok('pero con el sol arriba sigue siendo de día: esto no apaga el sol antes de tiempo',
     h2.day === 1);

  /* La regla del 20-09 no se toca: si `current` es de otra hora, no pisa
     NADA, tampoco el día/noche. Es lo que protege la copia del monte. */
  const h3 = hora('2026-09-21T14:00', 1);
  conAhora(h3, { time: '2026-09-21T08:10', is_day: 1, weather_code: 0, cloud_cover: 0 });
  ok('un `current` de otra hora no pisa nada, ni el día ni el cielo',
     h3.day === 1 && h3.code === 4 && h3.cloud === 60,
     'sin cobertura en el monte, la copia trae un current viejo: el sol de las 08:10 no puede pisar las 14:00');

  /* Y sin `is_day` en `current` —modelo que no lo publica— se queda el de
     la hora, que es lo que había antes. */
  const h4 = hora('2026-09-21T20:00', 1);
  conAhora(h4, { time: '2026-09-21T20:25', weather_code: 4 });
  ok('si `current` no trae el día/noche, se queda el de la hora y no se inventa',
     h4.day === 1);

  ok('y `is_day` se pide de verdad en el bloque de AHORA',
     /const CURRENT = \[\s*\n\s*'temperature_2m','apparent_temperature','relative_humidity_2m','is_day'/.test(src),
     'sin pedirlo, `conAhora` no tendría qué copiar y esto no arreglaría nada');
}

grupo('La regla de la tormenta — casos reales, no inventados');
ok('Lekeitio 23-08 23:00 (1350/15/23%) avisa — reventó postes', rompe(H(1350, 15, 23)));
ok('Durango 23-08 23:00 (1070/56/15%) avisa — reventó', rompe(H(1070, 56, 15)));
ok('Bermeo 24-08 15:00 (720/59/28%) avisa — oyó truenos', rompe(H(720, 59, 28)));
ok('GIRONA 25-08 (1500/33/0%) NO avisa — cero descargas medidas', !rompe(H(1500, 33, 0)));
ok('Sin dato de probabilidad (1500/33/—) avisa igual', rompe(H(1500, 33, null)));
ok('Cargado y lloviendo con 0% avisa — manda el agua que cae', rompe(H(1500, 33, 0, 3.0, 63)));

grupo('Una sola frase de tormenta por hora, nunca dos');
for (const [n, h] of [['cargado sin chispa', H(1500, 33, 0)],
                      ['cargado con chispa', H(1350, 15, 23)],
                      ['ya rompiendo', H(1500, 33, 0, 3.0, 63)]]) {
  const n_ = assess(h, THR, 'hierro').reasons.filter(r => /CAPE/.test(r.txt)).length;
  ok(`${n}: ${n_} frase(s)`, n_ <= 1, `salen ${n_}, y dos frases se contradicen`);
}

/* ── 2. LOS NÚMEROS, COMO SE ESCRIBEN AQUÍ ──────────────────────── */
grupo('Milímetros y días en castellano');
ok('0.4 se escribe 0,4', mmTxt(0.4) === '0,4');
ok('12.4 se escribe 12,4', mmTxt(12.4) === '12,4');
ok('un hueco dice — y no revienta', mmTxt(null) === '—');
const hoy = new Date();
const D = d => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + d, 9);
ok('si es de hoy no repite «hoy»', diaSiNoEsHoy(D(0)) === '');
ok('si es de ayer lo canta', /AYER/.test(diaSiNoEsHoy(D(-1))));
ok('si es de mañana lo dice', /mañana/.test(diaSiNoEsHoy(D(1))));

/* ── 3. EL PARTE DEL DÍA ────────────────────────────────────────── */
grupo('El parte: cada cifra con su hora, y las dos juntas');
const pintado = {};
globalThis.$ = s => ({ set innerHTML(v) { pintado[s] = v; },
                       set textContent(v) { pintado[s] = v; },
                       set hidden(v) { pintado[s + '.hidden'] = v; } });
/* LA HORA SE CLAVA A LAS 10:00 DE HOY, y no es un capricho.
   Sin esto las pruebas usaban la hora real, y **a partir de las 21:00 el
   «día 0» del parte pasa a mañana**: tres pruebas del parte empezaban a
   fallar solas cada noche. Un guardián que da falsos fallos según la
   hora acaba haciendo que se publique a pesar de él. Pasó el 26-08-2026
   a las 23:45, bloqueando un arreglo que él estaba esperando.

   Se sustituye el valor por defecto en el CÓDIGO antes de evaluarlo:
   poner un `globalThis.ventanaParte` no sirve, porque `renderParte` se
   evalúa en el mismo ámbito y resuelve la suya, no la global. */
/* La puerta que dice qué día es. Desde el 04-09-2026 la usan cinco
   sitios —`ventanaParte` entre ellos—, así que tiene que estar en pie
   antes que ninguno o revienta al pintar. */
eval(sacar('function nombreDeDia(d) {'));

const _hoy10 = new Date(); _hoy10.setHours(10, 0, 0, 0);
eval(sacar('function ventanaParte(ahora = Date.now()) {')
       .replace('ahora = Date.now()', `ahora = ${_hoy10.getTime()}`));
globalThis.pintarDiasParte = () => {};
/* El sello de «calculado a las…» lo llama `renderParte`, así que tiene
   que estar en pie antes que ella o revienta al pintar. */
eval(sacarConst('PARTE_VIEJO_MIN'));   // con `const` no sale del eval
eval(sacar('function selloParte(ahora = Date.now()) {'));
eval(sacar('function pintarSelloParte() {'));
eval(sacar('function cuantosLoVen(d) {'));
eval(sacar('function aguaCeldaLejos(f, ahora = Date.now()) {'));
eval(sacarConst('listar')); eval(sacarConst('MODELOS_TORMENTA'));   // la nota del parte lista los modelos sin tapa (25-09-2026)
eval(sacar('function renderParte() {'));

const P = (n, lat, lon) => ({ name: n, lat, lon });
const sitios = [P('CRUZA MEDIANOCHE', 43.31, -2.68), P('HORAS SUELTAS', 43.41, -2.71),
                P('SIN GASOLINA', 43.04, -2.93), P('TAPA AGUANTA', 43.36, -2.50),
                P('NO COINCIDEN', 43.32, -2.69)];
const k = p => key(p);
const Hh = (d, h) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + d, h);
S.saved = sitios;
S.torres = sitios.map(p => ({ place: p }));
S.parteTorres = [
  { k: k(sitios[0]), salta: true, ini: Hh(0, 23), fin: Hh(1, 1), cape: 1660, cin: 58, hora: Hh(1, 0), modelo: 'GFS' },
  { k: k(sitios[1]), salta: true, ini: Hh(0, 13), fin: Hh(0, 18), cape: 2680, cin: 11, hora: Hh(0, 16), modelo: 'ICON' },
  { k: k(sitios[2]), salta: false, maxCape: 640, minCin: 20, capeTecho: 640, tapaSuelo: 20 },
  { k: k(sitios[3]), salta: false, maxCape: 1220, minCin: 102, capeTecho: 1220, tapaSuelo: 102 },
  { k: k(sitios[4]), salta: false, maxCape: 1350, minCin: 210, capeTecho: 1350, tapaSuelo: 8 },
];
S.lluviaTorres = [
  { k: k(sitios[0]), llueve: false },
  { k: k(sitios[1]), llueve: true, ini: Hh(0, 9), fin: Hh(0, 20), pico: 0.1, hPico: Hh(0, 9), quien: 'ECMWF', nHoras: 3, sueltas: true, soloSirimiri: false, discrepan: true,
    horasAgua: [Hh(0, 9), Hh(0, 14), Hh(0, 20)] },
  { k: k(sitios[2]), llueve: false },
  { k: k(sitios[3]), llueve: true, ini: Hh(0, 18), fin: Hh(0, 18), pico: 12.4, hPico: Hh(0, 18), quien: 'ECMWF', nHoras: 1, sueltas: false, soloSirimiri: false, discrepan: false,
    horasAgua: [Hh(0, 18)] },
  { k: k(sitios[4]), llueve: true, ini: Hh(0, 21), fin: Hh(1, 12), pico: 0.2, hPico: Hh(1, 12),
    quien: 'ICON', nHoras: 4, sueltas: true, soloSirimiri: false, discrepan: false,
    horasAgua: [Hh(0, 21), Hh(0, 23), Hh(1, 9), Hh(1, 12)] },
];
renderParte();
const html = pintado['#parte'] || '';
const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

ok('la ventana que cruza medianoche dice el día',
   /de hoy 23:00 a mañana 01:00/.test(texto), texto.slice(0, 120));
/* Antes se decía «3 horas sueltas entre las 09:00 y las 20:00» y él lo
   leyó como un rango de once horas. Con pocas horas se ENUMERAN, que es
   lo que necesita: a qué horas, no entre cuáles. */
ok('con pocas horas se dicen las horas, no un rango',
   /a las 09:00, 14:00 y 20:00/.test(texto),
   texto.match(/gotas[^·]{0,80}|Llueve[^·]{0,80}/)?.[0]);
/* Salió en pantalla el 26-08-2026 con datos de BI OIZ: «entre las hoy
   17:00 y las mañana 11:00». Venía de retocar el texto de `tramo()` con
   reemplazos en vez de redactarlo aparte. */
ok('las horas sueltas que cruzan a mañana se leen bien',
   !/entre las (hoy|mañana|ayer)/.test(texto) && !/y las (hoy|mañana|ayer)/.test(texto),
   texto.match(/horas sueltas[^·]{0,80}/)?.[0]);

/* La lluvia de hoy y la de mañana NO se mezclan en una sola frase: eso
   daba ventanas de 21 horas que no dicen nada. */
ok('hoy y mañana se separan con la palabra «mañana»',
   /mañana/.test(texto), texto.match(/NO COINCIDEN[\s\S]{0,140}/)?.[0]);
ok('el pico lleva su día cuando no es hoy',
   !/lo más fuerte[^·]*a las \d{2}:00\s*·/.test(texto)
   || /a las \d{2}:00 de mañana/.test(texto),
   texto.match(/lo más fuerte[^·]{0,60}/)?.[0]);
ok('CAPE y tapa van SIEMPRE juntos',
   /CAPE 2\.680 con la tapa en 11/.test(texto), 'una cifra sola miente en las dos direcciones');
/* Reescrito el 28-08: ya no dice «solo llega a X: no hay con qué» sino
   el dato con el listón al lado, que es lo que él pidió —«vosotros
   cifras»— y además ahora lleva la tapa. */
ok('sin gasolina se dan las CIFRAS y el listón',
   /640 de CAPE/.test(texto) && /hace falta 700/.test(texto),
   texto.slice(0, 160));
/* Salió en su pantalla el 26-08-2026: «tiene 1.350 de CAPE, pero la tapa
   no baja de 0: aguanta». Una tapa en 0 está abierta del todo; la frase
   se contradecía sola. El motivo real es que las dos cosas le pasan a
   horas distintas, y eso NO es estar a salvo. */
ok('con gasolina Y tapa que se abre, dice que no coinciden — nunca «aguanta»',
   /pero no a la vez/.test(texto) || !/tapa no baja de\s*0\s*:?\s*aguanta/.test(texto),
   texto.match(/1\.350[^·]{0,90}/)?.[0]);
ok('con la tapa puesta también se explica',
   /1\.220 de CAPE\s*,?\s*pero la tapa no baja de\s*102/.test(texto),
   texto.match(/TAPA AGUANTA[\s\S]{0,120}/)?.[0]);
/* Se comprueba BLOQUE POR BLOQUE, no sobre el HTML entero: la primera
   versión de esta prueba usaba una expresión que cruzaba de un
   emplazamiento a otro y daba falso positivo en cuanto se añadía un
   sitio más. Así además es más fuerte: NINGÚN sitio con agua de la que
   moja puede llevar la etiqueta verde. */
const bloques = html.split('<div class="pt"').slice(1);
const verdesConAgua = bloques.filter(b => {
  const txt = b.replace(/<[^>]+>/g, ' ');
  const mojado = /Llueve bien|Llueve poco|Sirimiri/.test(txt);
  return /^\s*data-s="go"/.test(b) && mojado;
});
ok('NINGÚN sitio con lluvia lleva etiqueta verde',
   verdesConAgua.length === 0,
   verdesConAgua.map(b => b.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,90)).join(' | '));
ok('los que sí mojan llevan LLUVIA o SIRIMIRI',
   bloques.some(b => /LLUVIA|SIRIMIRI/.test(b)));

/* ── LA PORTADA NO SE MUEVE SOLA (20-09-2026, tarde) ──────────────────
   En producción la portada enseñaba BI SOLLUBEMENDI y la primera tarjeta
   era BI BERMEO: `estacionDePortada()` cogía `S.saved[0]` —el orden crudo,
   que lo reordena el servidor al juntar— en vez del orden de la lista que
   él ve. Suyo: «que salga BI_BERMEO o el primero de la lista o el que meta
   yo a mano». */
{
  const guardadas = S.saved, portadaAntes = LS.get('portadaEstacion', null);
  const P = n => ({ name: n, admin1: 'Bizkaia', country: 'España',
                    lat: n === 'BI BERMEO' ? 43.413 : n === 'BI SOLLUBEMENDI' ? 43.4375 : 43.32,
                    lon: n === 'BI BERMEO' ? -2.718 : n === 'BI SOLLUBEMENDI' ? -2.7636 : -2.853 });
  LS.set('portadaEstacion', null);
  // el orden CRUDO al revés de como se ven las tarjetas
  S.saved = [P('BI MUNGIA'), P('BI SOLLUBEMENDI'), P('BI BERMEO')];
  ok('sin «Portada» fijada, la portada es la PRIMERA DE LA LISTA que él ve, no la primera guardada',
     estacionDePortada()?.name === 'BI BERMEO',
     'salía ' + estacionDePortada()?.name + ': el orden crudo lo reordena el servidor y la portada cambiaba sola');
  // y el orden crudo puede cambiar sin que él toque nada: la portada NO
  S.saved = [P('BI SOLLUBEMENDI'), P('BI BERMEO'), P('BI MUNGIA')];
  ok('y si el servidor devuelve la lista en otro orden, la portada sigue siendo la misma',
     estacionDePortada()?.name === 'BI BERMEO');
  // lo que él fija a mano manda sobre todo
  LS.set('portadaEstacion', key(P('BI MUNGIA')));
  ok('el que mete a mano con «Portada» sigue mandando',
     estacionDePortada()?.name === 'BI MUNGIA');
  S.saved = guardadas; LS.set('portadaEstacion', portadaAntes);
}

/* EN ROJO LO QUE SALTA. Suyo, 20-09-2026: «si hay algo que salte alarma
   que salte en rojo; si ve CAPE en rojo, si ve lluvia en rojo». Y «si no
   hay nada, no pinta nada de rojo». */
const lluviaSinRojo = bloques.filter(b => /pt__b">LLUVIA</.test(b) && !/^\s*data-s="no"/.test(b));
ok('los que llueve de verdad van en ROJO, no en ámbar (20-09-2026)',
   lluviaSinRojo.length === 0,
   lluviaSinRojo.map(b => b.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,90)).join(' | '));
ok('y el AL FILO también en rojo',
   bloques.filter(b => /pt__b">AL FILO</.test(b)).every(b => /^\s*data-s="no"/.test(b)));
ok('el sirimiri se queda en ámbar: moja, pero en rojo a diario se dejaría de mirar',
   bloques.filter(b => /pt__b">SIRIMIRI</.test(b)).every(b => /^\s*data-s="warn"/.test(b)));
ok('y los secos sin nada siguen en verde: si no hay nada, nada de rojo',
   bloques.filter(b => /pt__b">SIN RAYO</.test(b) && /Sin lluvia/.test(b) && !/pero no a la vez/.test(b))
     .every(b => /^\s*data-s="go"/.test(b)));

/* Salió en la SEGUNDA pasada del 26-08-2026. Un sitio con gasolina de
   sobra y la tapa que se le llega a abrir —aunque no a la vez— salía en
   VERDE con «si se juntan una hora, salta» debajo. La etiqueta decía lo
   contrario que el renglón. */
const alFiloMal = bloques.filter(b =>
  /^\s*data-s="go"/.test(b) && /pero no a la vez/.test(b));
ok('un sitio AL FILO no sale en verde',
   alFiloMal.length === 0,
   alFiloMal.map(b => b.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,90)).join(' | '));
ok('y se le pone la etiqueta AL FILO',
   bloques.some(b => /AL FILO/.test(b) && /pero no a la vez/.test(b)));

grupo('El parte sin emplazamientos guardados no se esconde en silencio');
S.saved = []; S.torres = []; S.parteTorres = null;
renderParte();
ok('dice qué hacer en vez de desaparecer',
   pintado['#parteCard.hidden'] === false && /♥/.test(pintado['#parte'] || ''));

/* ── 4. LA VENTANA DE TRABAJO ────────────────────────────────────
   Tercera aparición del mismo fallo: una franja que cruza la medianoche
   dicha sin el día. En la barra de 48 h salía «próxima ventana apta:
   miércoles 22:00 – 20:00», que se lee hacia atrás. Y aquí engaña más
   que en ningún sitio, porque es la línea que dice a qué hora puede
   mandar gente. */
grupo('La ventana de trabajo dice el día cuando cruza la medianoche');
globalThis.VT = { go:'APTO', warn:'PRECAUCIÓN', no:'NO APTO', nd:'SIN DATO' };
globalThis.clamp = (v,a,b) => Math.max(a, Math.min(b, v));
globalThis.horasEnDiscrepancia = () => ({ set:new Set(), sabido:true });
globalThis.renderTlDetail = () => {};
S.thr = { gustNo: 70 };
S.sel = 0;
eval(sacar('function renderTimeline(hrs) {'));

const HH = (dias, h) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()+dias, h);
const hora = (d, st) => ({ date:d, st, gust:20, wind:12, reasons:[] });

// caso 1: la ventana empieza mañana y cruza a pasado
renderTimeline([hora(HH(0,14),'no'), hora(HH(0,15),'no'),
                ...Array.from({length:6},(_,i)=>hora(HH(0,16+i),'no')),
                hora(HH(0,22),'go'), hora(HH(0,23),'go'),
                hora(HH(1,0),'go'), hora(HH(1,1),'go')]);
const h1 = pintado['#windowHint'] || '';
ok('la ventana que cruza medianoche no se lee hacia atrás',
   !/\d{2}:00\s*[–-]\s*\d{2}:00/.test(h1) || /hoy|mañana/.test(h1), h1);
ok('y nombra los dos días', /hoy/.test(h1) && /mañana/.test(h1), h1);

// caso 2: dentro del mismo día, no debe repetir el día dos veces
renderTimeline([hora(HH(0,14),'no'), hora(HH(0,15),'go'),
                hora(HH(0,16),'go'), hora(HH(0,17),'no')]);
const h2 = pintado['#windowHint'] || '';
ok('dentro del mismo día se dice una sola vez',
   (h2.match(/hoy/g)||[]).length <= 1, h2);

/* ── EL ORDEN DE LAS TORRES NO DEPENDE DEL TIEMPO ────────────────────
   Él, 26-08-2026: «¿por qué cuando cambio de día no salen las estaciones
   en el mismo orden?». Iban por gravedad, así que al pasar de miércoles
   a jueves la lista entera se barajaba y había que releerla.

   Lo que se prueba es lo que él pidió: **el mismo orden siempre, de
   Bermeo hacia fuera**, aunque cambien el CAPE, el estado y el día. */
grupo('El orden de sus torres');

const sitiosOrd = [
  { name: 'BI BERMEO',      lat: 43.4209, lon: -2.7215 },
  { name: 'BI SOLLUBEMENDI', lat: 43.3655, lon: -2.6803 },
  { name: 'BI GERNIKA2',    lat: 43.3200, lon: -2.6800 },
  { name: 'BI OIZ',         lat: 43.2200, lon: -2.5300 },
  { name: 'VI ARBAIZA',     lat: 42.8900, lon: -2.4600 },
  { name: 'BI BALMASEDA',   lat: 43.1750, lon: -3.1970 },
];

const espOrd = [...sitiosOrd].sort(deCasaAFuera).map(x => x.name);

ok('el más cercano es Bermeo', espOrd[0] === 'BI BERMEO', espOrd.join(' · '));
ok('el más lejano no es de la costa cercana',
   espOrd.at(-1) === 'VI ARBAIZA' || espOrd.at(-1) === 'BI BALMASEDA',
   espOrd.join(' · '));

/* El corazón de la prueba: el mismo orden con datos de tiempo opuestos.
   Si alguien vuelve a meter la gravedad en el criterio, esto salta. */
const conTiempoOrd = (cape, st) => sitiosOrd.map((p, i) => ({
  place: p, cape: cape[i], horas: [{ st: st[i] }],
}));
const miOrd = conTiempoOrd([2700, 1900,  100,  50, 2000,  10],
                            ['no','warn','go','go','no','go']);
const juOrd    = conTiempoOrd([  10,   50, 2600, 2700,   0, 1800],
                            ['go','go','no','no','go','warn']);

const ordenarOrd = arr => [...arr].sort((a, b) => deCasaAFuera(a.place, b.place))
                               .map(x => x.place.name);
const oMOrd = ordenarOrd(miOrd), oJOrd = ordenarOrd(juOrd);

ok('miércoles y jueves salen en el MISMO orden',
   oMOrd.join('|') === oJOrd.join('|'), `${oMOrd.join(' · ')}\n        ${oJOrd.join(' · ')}`);
ok('y es el orden por cercanía a Bermeo',
   oMOrd.join('|') === espOrd.join('|'), oMOrd.join(' · '));

/* Empate a distancia: dos sitiosOrd a los mismos km tampoco pueden
   intercambiarse según cómo vengan en la lista. */
const gemelasOrd = [{ name: 'ZZZ', lat: 43.30, lon: -2.60 },
                 { name: 'AAA', lat: 43.30, lon: -2.60 }];
ok('dos sitios a la misma distancia salen siempre igual',
   [...gemelasOrd].sort(deCasaAFuera).map(x => x.name).join() ===
   [...gemelasOrd].reverse().sort(deCasaAFuera).map(x => x.name).join(),
   'el desempate por nombre no está funcionando');

/* Y que las DOS listas que él mira usen ese orden de verdad. Sin esto
   la prueba de arriba solo comprobaría la función suelta, y el fallo que
   él vio estaba en quién la llama, no en ella. */
const usos = (src.match(/deCasaAFuera\(/g) || []).length;
ok('el parte y el semáforo ordenan los dos por cercanía',
   usos >= 3, `solo ${usos} apariciones de deCasaAFuera (1 def + 2 usos)`);
ok('y ninguna de las dos vuelve a ordenar por gravedad',
   !/sort\(\(a, b\) => \(b\.d\.salta/.test(src) && !/peor\[B\] !== peor\[A\]/.test(src),
   'ha vuelto el orden por gravedad');

/* ── «HA CAMBIADO DESDE QUE LO MIRASTE» ──────────────────────────────
   Suyo, 26-08-2026: «por correo no me entero de nada; si va directo a la
   app, genial».

   El peligro de esto NO es que se calle: es que hable de más. Un aviso
   en cada pasada por subir 18 de CAPE y deja de mirarlo, y entonces se
   pierde el que importaba. La mitad de estas pruebas comprueban que se
   CALLA cuando no hay noticia.                                       */
grupo('Lo que ha cambiado desde que lo miraste');

const Ray = (ini, fin, cape) => huellaParte({ salta: true, cape,
  ini: new Date(2026, 7, 27, ini), fin: new Date(2026, 7, 27, fin) });
const Sin = (maxCape, minCin) => huellaParte({ salta: false, maxCape, minCin });

// aparece rayo donde no lo había: lo más grave que puede pasar
const c1 = fraseCambio(Sin(300, 200), Ray(15, 21, 2000));
ok('avisa cuando aparece rayo donde no lo había', !!c1 && c1.peor, JSON.stringify(c1));
ok('y dice las horas nuevas', !!c1 && /15:00/.test(c1.txt) && /21:00/.test(c1.txt), c1 && c1.txt);

// desaparece: se dice, pero no es «a peor»
const c2 = fraseCambio(Ray(15, 21, 2000), Sin(300, 200));
ok('avisa cuando el rayo desaparece', !!c2, JSON.stringify(c2));
ok('pero no lo marca como a peor', !!c2 && !c2.peor, JSON.stringify(c2));

// se adelanta: es lo que él pidió con nombre y apellidos
const c3 = fraseCambio(Ray(16, 21, 2000), Ray(13, 21, 2000));
ok('avisa si el rayo se adelanta', !!c3 && c3.peor, JSON.stringify(c3));
ok('y dice antes y ahora', !!c3 && /16:00/.test(c3.txt) && /13:00/.test(c3.txt), c3 && c3.txt);

// se acorta por el final: no es a peor
const c4 = fraseCambio(Ray(15, 22, 2000), Ray(15, 19, 2000));
ok('un rayo que se acorta se cuenta pero no como a peor', !!c4 && !c4.peor, JSON.stringify(c4));

/* ── Y AHORA LO IMPORTANTE: QUE SE CALLE ──────────────────────────── */
ok('misma ventana de rayo: NO avisa', fraseCambio(Ray(15, 21, 2000), Ray(15, 21, 2100)) === null);
ok('el CAPE sube un poco y no hay rayo: NO avisa', fraseCambio(Sin(300, 200), Sin(340, 190)) === null);
ok('sin rayo y lejos del filo las dos veces: NO avisa', fraseCambio(Sin(100, 300), Sin(200, 250)) === null);
ok('sube el CAPE pero la tapa aguanta: NO avisa', fraseCambio(Sin(200, 300), Sin(1500, 200)) === null);

// al filo sí es noticia: gasolina Y tapa que se abre
const c5 = fraseCambio(Sin(200, 300), Sin(1500, 40));
ok('quedarse al filo sí se avisa', !!c5 && c5.peor, JSON.stringify(c5));

/* El redondeo: 1.902 -> 1.918 no puede ser noticia. Si esto falla, la
   app se vuelve charlatana y deja de leerse. */
ok('un cambio de 16 de CAPE no mueve la huella',
   JSON.stringify(huellaParte({salta:false, maxCape:1902, minCin:80})) ===
   JSON.stringify(huellaParte({salta:false, maxCape:1918, minCin:84})));

ok('sin dato guardado no inventa un cambio',
   fraseCambio(null, Ray(15, 21, 2000)) === null && fraseCambio(Ray(15, 21, 2000), null) === null);

/* ── Y QUE LA FRASE LLEGUE A LA PANTALLA ─────────────────────────────
   Las de arriba prueban la comparación suelta. Esta prueba lo que él ve:
   se pinta el parte, se envejece la foto guardada, se cambia el tiempo y
   se vuelve a pintar. Si el renglón no sale, esto no sirve de nada.   */
grupo('El aviso de cambio, en pantalla');

/* Una prueba de más arriba deja la lista de emplazamientos vacía, y
   entonces el parte sale por la puerta de «aún no has guardado ninguno».
   Se reponen antes de empezar. */
S.saved = sitios;
S.torres = sitios.map(p => ({ place: p }));
S.parteTorres = [
  { k: k(sitios[0]), salta: true, ini: Hh(0, 23), fin: Hh(1, 1), cape: 1660, cin: 58, hora: Hh(1, 0), modelo: 'GFS' },
  { k: k(sitios[1]), salta: true, ini: Hh(0, 13), fin: Hh(0, 18), cape: 2680, cin: 11, hora: Hh(0, 16), modelo: 'ICON' },
  { k: k(sitios[2]), salta: false, maxCape: 640, minCin: 20, capeTecho: 640, tapaSuelo: 20 },
  { k: k(sitios[3]), salta: false, maxCape: 1220, minCin: 102, capeTecho: 1220, tapaSuelo: 102 },
  { k: k(sitios[4]), salta: false, maxCape: 1350, minCin: 210, capeTecho: 1350, tapaSuelo: 8 },
];

LS.vaciar();
renderParte();
ok('la primera vez que se abre NO inventa cambios',
   !/HA CAMBIADO/.test(pintado['#parte'] || ''));

/* Se envejece la foto: como si la hubiera mirado esta mañana. */
const cajon = LS.get('visto', {});
const claveG = Object.keys(cajon)[0];
ok('ha guardado la foto de este día', !!claveG, JSON.stringify(Object.keys(cajon)));
cajon[claveG].ts = Date.now() - 3 * 60 * 60 * 1000;
LS.set('visto', cajon);

/* Y ahora cambia el tiempo: donde no había rayo, lo hay. */
S.parteTorres = S.parteTorres.map(d => d.k === k(sitios[2])
  ? { k: d.k, salta: true, ini: Hh(0, 15), fin: Hh(0, 21), cape: 2100, cin: 30, hora: Hh(0, 17), modelo: 'ICON' }
  : d);
renderParte();
const htmlCam = pintado['#parte'] || '';
const txtCam = htmlCam.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

ok('sale el renglón HA CAMBIADO', /HA CAMBIADO/.test(txtCam),
   txtCam.match(/SIN GASOLINA[\s\S]{0,160}/)?.[0]);
ok('y dice qué ha cambiado, con horas',
   /antes NO daba rayo y ahora sí, de 15:00 a 21:00/.test(txtCam),
   txtCam.match(/HA CAMBIADO[\s\S]{0,120}/)?.[0]);
ok('va marcado como a peor', /pt__cam--peor/.test(htmlCam));
ok('solo lo lleva la torre que cambió',
   (txtCam.match(/HA CAMBIADO/g) || []).length === 1,
   (txtCam.match(/HA CAMBIADO/g) || []).length + ' renglones');
ok('y se avisa arriba', /ha cambiado 1 torre/.test(pintado['#parteHint'] || ''),
   pintado['#parteHint']);

/* Recién mirado: a los cinco minutos NO puede salir un aviso NUEVO… y el
   que ya estaba en pantalla tampoco puede desaparecer.

   ── LAS DOS COSAS, Y ANTES SOLO SE MIRABA UNA (21-09-2026) ──────────
   Esta prueba pedía que a los cinco minutos NO hubiera ningún «HA
   CAMBIADO». Y eso era pedir el fallo: la pintada que enseñaba el aviso
   renovaba la foto en la misma pasada, así que el aviso de la torre que
   SÍ había cambiado se borraba al primer repintado —tocar una pestaña de
   día, volver de Mis estaciones— y no volvía nunca. La regla escrita en
   la propia función es la contraria: la app no borra en silencio lo que
   ya te había dicho, porque puede que ya hayas mandado a alguien con
   aquello. Ahora se comprueban las dos mitades. */
S.parteTorres = S.parteTorres.map(d => d.k === k(sitios[3])
  ? { k: d.k, salta: true, ini: Hh(0, 10), fin: Hh(0, 12), cape: 1900, cin: 20, hora: Hh(0, 11), modelo: 'ICON' }
  : d);
renderParte();
const html5 = pintado['#parte'] || '';
const tras5 = html5.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
/* Solo los RENGLONES de aviso: el cuerpo de la tarjeta también escribe la
   ventana de rayo del sitio, y eso no es un aviso de cambio. */
const renglones5 = (html5.match(/<div class="pt__cam[\s\S]*?<\/div>/g) || [])
  .map(x => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
ok('a los cinco minutos NO aparece un aviso nuevo',
   renglones5.length === 1 && !renglones5.some(r => /de 10:00 a 12:00/.test(r)),
   renglones5.join(' || ') || 'sin renglones');
ok('y el aviso que ya estaba en pantalla SIGUE ahí después de repintar',
   /antes NO daba rayo y ahora sí, de 15:00 a 21:00/.test(tras5),
   'un toque en la pestaña de día se comía el aviso de rayo para siempre');

/* Y aguanta varias pintadas seguidas, que es lo que pasa de verdad al
   cambiar de día y volver. */
renderParte(); renderParte();
ok('y aguanta tres repintados seguidos',
   /antes NO daba rayo y ahora sí, de 15:00 a 21:00/
     .test((pintado['#parte'] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')),
   'cambiar de pestaña y volver repinta dos veces');

/* Los días pasados no se acumulan: esto no es un archivo. */
const conViejo = LS.get('visto', {});
conViejo['2020-01-01'] = { ts: 0, sitios: {} };
LS.set('visto', conViejo);
const sinViejo = LS.get('visto', {});
sinViejo[claveG].ts = Date.now() - 3 * 60 * 60 * 1000;
LS.set('visto', sinViejo);
renderParte();
/* El fallo que dejó la función muerta sin decir nada: la medianoche de
   aquí es el día anterior en UTC, así que la foto se guardaba con fecha
   de ayer y la limpieza de días pasados la borraba en la misma pasada.
   Con `toISOString()` esto falla; con la fecha local, no. */
const medianoche = new Date(2026, 7, 26, 0, 0, 0);
ok('la clave del día va en hora de aquí, no en UTC',
   claveDia(medianoche) === '2026-08-26',
   claveDia(medianoche) + '  (toISOString daría ' + medianoche.toISOString().slice(0,10) + ')');

ok('tira los días ya pasados', !('2020-01-01' in LS.get('visto', {})),
   Object.keys(LS.get('visto', {})).join(' · '));

/* ── LA FOTO DE LA PORTADA ───────────────────────────────────────────
   Él, 26-08-2026, con el Oiz abierto a las cinco de la tarde: «en la
   foto de Oiz, ¿por qué sale de noche? Tiene que salir la foto según el
   tiempo que esté».

   La foto que salía era «ISS053-E-365065 · View of Earth»: la Tierra de
   noche desde la Estación Espacial. Ni era el Oiz ni era la hora.     */
grupo('La foto de la portada');

globalThis.isStormCode = c => c >= 95 && c <= 99;
eval(sacarConst('NO_ES_EL_SITIO'));
eval(sacar('function sirveDePortada(f) {'));
eval(sacar('function puntuarFoto(f, hour) {'));

const F = t_ => ({ titulo: t_, w: 1600, h: 900 });
const DIA   = { day: 1, code: 0 };
const NOCHE = { day: 0, code: 0 };

/* El caso exacto que él vio en pantalla. */
ok('la foto de la Estación Espacial NO vale de portada',
   !sirveDePortada(F('ISS053-E-365065 - View of Earth')));
ok('ni un mapa, ni un escudo, ni una señal',
   !sirveDePortada(F('Mapa de Bizkaia')) &&
   !sirveDePortada(F('Coat of arms of Bermeo')) &&
   !sirveDePortada(F('Panel informativo del sendero')));
ok('pero una foto normal del monte sí',
   sirveDePortada(F('Monte Oiz desde Munitibar')) &&
   sirveDePortada(F('Vista de Bermeo desde el puerto')));

/* De día no puede ganar una foto de noche. Es lo que más canta. */
ok('de día gana la foto de día',
   puntuarFoto(F('Oiz al amanecer'), DIA) < puntuarFoto(F('Monte Oiz'), DIA));
ok('de noche gana la de noche',
   puntuarFoto(F('Bermeo de noche'), NOCHE) > puntuarFoto(F('Bermeo'), NOCHE));

/* Un Oiz nevado el 26 de agosto engaña igual que una de noche. */
ok('sin nieve, una foto nevada pierde',
   puntuarFoto(F('Oiz nevado'), DIA) < puntuarFoto(F('Monte Oiz'), DIA));
ok('nevando, la foto nevada gana',
   puntuarFoto(F('Oiz nevado'), { day: 1, code: 73 })
   > puntuarFoto(F('Monte Oiz'), { day: 1, code: 73 }));

/* Y con niebla de verdad, la de niebla. */
ok('con niebla gana la foto con niebla',
   puntuarFoto(F('Oiz con niebla'), { day: 1, code: 45 })
   > puntuarFoto(F('Monte Oiz'), { day: 1, code: 45 }));
ok('con el cielo raso, la de niebla pierde',
   puntuarFoto(F('Oiz con niebla'), DIA) < puntuarFoto(F('Monte Oiz'), DIA));

/* Sin datos del tiempo no se puede fingir que se sabe: se ordena por lo
   único seguro, que es que de día no se pone una de noche. */
ok('sin datos del tiempo no revienta',
   Number.isFinite(puntuarFoto(F('Monte Oiz'), null)) &&
   Number.isFinite(puntuarFoto(F('Monte Oiz'), { day: 1 })));

/* ── AGUA QUE TU MODELO NO VE ────────────────────────────────────────
   Él, 26-08-2026 a las 19:00, de pie en Bermeo: «en Bermeo lloviendo
   poco pero cae», «acaba de empezar». La ficha de la torre le enseñaba
   0,0 mm. Medido en ese momento: cuatro modelos a 0,0 y ECMWF con 0,4 y
   código 51 (llovizna). El único que acertó no era el suyo.          */
grupo('Agua que tu modelo no ve');

globalThis.COMPARAR = [
  { om:'ecmwf_ifs025', name:'ECMWF' },
  { om:'meteofrance_arome_france_hd', name:'AROME HD' },
  { om:'icon_seamless', name:'ICON' },
  { om:'gfs_seamless', name:'GFS' },
];
globalThis.S = globalThis.S || {};
/* `listar` se saca de app.js, no se copia: si mañana cambia la forma de
   enumerar modelos, estas pruebas leen la de verdad. */
eval(sacarConst('listar'));
/* Desde el 30-08-2026 esta función necesita saber QUÉ MODELO está
   cargado —para no contarlo como «otro»— y cuáles salen en el selector
   —para decir que HARMONIE no está ahí—. Se le dan aquí. */
if (typeof modeloDato !== 'function') globalThis.modeloDato = () => ({ name: 'AROME HD' });
/* Desde el 30-08 los avisos de lluvia nombran al DUEÑO de la lluvia. */
if (typeof nombreDeModelo !== 'function') globalThis.nombreDeModelo = om =>
  om === 'ecmwf_ifs025' ? 'ECMWF' : 'AROME HD';
if (typeof duenoLluvia !== 'function') globalThis.duenoLluvia = () => 'ecmwf_ifs025';
if (typeof MODELS === 'undefined') globalThis.MODELS = [
  { name: 'Automático' }, { name: 'ECMWF' }, { name: 'GFS' },
  { name: 'ICON' }, { name: 'AROME HD' }];
eval(sacar('function lluviaQueNoVesTu(c) {'));

/* La hora en curso, en HORA LOCAL. Con `toISOString()` no vale: da UTC,
   y `new Date('2026-08-26T17:00')` sin la Z se interpreta como hora de
   aquí. Con dos horas de diferencia la franja quedaba en el pasado y la
   función devolvía null siempre — el mismo fallo de UTC que ya dejó
   muerta la comparación del parte. Tercera vez que pica. */
const _n = new Date();
const ahoraISO = `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}`
  + `-${String(_n.getDate()).padStart(2,'0')}T${String(_n.getHours()).padStart(2,'0')}:00`;
/* El arnés tiene un emplazamiento abierto desde el principio —BI BERMEO,
   el suyo— porque desde el 01-09-2026 los lectores de estado por sitio
   preguntan por él. Sin esto, media prueba juzgaría «sin sitio abierto»,
   que es un caso que en la app no se da. */
S.place = S.place || { name: 'BI BERMEO', lat: 43.412976, lon: -2.718316 };

/* Sellado con el sitio de S.place: desde el 01-09-2026 los siete lectores
   de `S.comparativa` pasan por `deEsteSitio()`, que NO da por bueno lo que
   no lleva marca. Un montaje sin sello ya no representa a la app. */
const selloDe = () => S.place
  ? `${S.place.lat.toFixed(3)},${S.place.lon.toFixed(3)}` : '0.000,0.000';
const comparativa = (mm, codes) => ({ _sitio: selloDe(), hourly: {
  time: [ahoraISO],
  precipitation_ecmwf_ifs025: [mm[0]], weather_code_ecmwf_ifs025: [codes[0]],
  precipitation_meteofrance_arome_france_hd: [mm[1]], weather_code_meteofrance_arome_france_hd: [codes[1]],
  precipitation_icon_seamless: [mm[2]], weather_code_icon_seamless: [codes[2]],
  precipitation_gfs_seamless: [mm[3]], weather_code_gfs_seamless: [codes[3]],
}});

/* EL CASO DE BERMEO, tal cual salió. Desde el 30-08 el dueño de la
   lluvia es ECMWF, así que este escenario —«el dueño no la ve y otro
   sí»— se simula con el dueño en AROME: es lo que pasa si el europeo un
   día se cae y el respaldo toma la lluvia. El aviso tiene que seguir
   funcionando exactamente igual. */
const duenoReal = globalThis.duenoLluvia;
globalThis.duenoLluvia = () => 'meteofrance_arome_france_hd';
S.comparativa = comparativa([0.4, 0.0, 0.0, 0.0], [51, 3, 3, 3]);
const bermeo = lluviaQueNoVesTu({ prec: 0.0 });
ok('avisa cuando solo ECMWF ve el agua', !!bermeo, JSON.stringify(bermeo));
ok('dice QUIÉN la ve', bermeo?.quien === 'ECMWF', bermeo?.quien);
ok('y que es sirimiri, no un chaparrón', bermeo?.sirimiri === true, JSON.stringify(bermeo));

/* Y AHORA LO QUE IMPORTA IGUAL: QUE SE CALLE CUANDO TOCA. */
S.comparativa = comparativa([0.0, 0.0, 0.0, 0.0], [3, 3, 3, 3]);
ok('si ninguno ve agua, NO avisa', lluviaQueNoVesTu({ prec: 0.0 }) === null);

S.comparativa = comparativa([0.4, 0.0, 0.0, 0.0], [51, 3, 3, 3]);
ok('si tu modelo YA dice que llueve, NO avisa',
   lluviaQueNoVesTu({ prec: 0.6 }) === null,
   'estaría repitiendo lo que ya se ve en el número');

/* Menos de una décima no es agua: es ruido del modelo. Si esto avisa,
   la ficha se pone naranja casi todos los días y deja de mirarse. */
S.comparativa = comparativa([0.05, 0.02, 0.0, 0.0], [3, 3, 3, 3]);
ok('unas centésimas NO son motivo de aviso', lluviaQueNoVesTu({ prec: 0.0 }) === null);

/* Chaparrón de verdad: se dice en milímetros, no como sirimiri. */
S.comparativa = comparativa([2.4, 0.0, 1.1, 0.0], [80, 3, 61, 3]);
const fuerte = lluviaQueNoVesTu({ prec: 0.0 });
ok('con lluvia de verdad no lo llama sirimiri', fuerte && !fuerte.sirimiri, JSON.stringify(fuerte));
ok('y se queda con el que más da', fuerte?.mm === 2.4, String(fuerte?.mm));
ok('nombrando a los dos que la ven', fuerte?.cuantos === 2, String(fuerte?.cuantos));
globalThis.duenoLluvia = duenoReal;   // el mundo vuelve a su dueño real

/* Sin comparativa cargada no se inventa nada. */
S.comparativa = null;
ok('sin datos de otros modelos no revienta ni inventa',
   lluviaQueNoVesTu({ prec: 0.0 }) === null);

/* ── HORAS SUELTAS NO SON UNA VENTANA ────────────────────────────────
   Este fallo ha salido DOS VECES en sitios distintos:

     1. En pantalla: «cuatro gotas de 09:00 a 20:00» eran tres horas
        sueltas repartidas por el día.
     2. En el servidor, `api/parte.mjs`: `ini` y `fin` eran el mínimo y
        el máximo de las horas que cumplen. Un sitio que salta a las
        14:00 y otra vez a las 23:00, con la tarde limpia, salía como
        «14h-23h» — nueve horas seguidas que no existen.

   La segunda la cazó otra sesión LEYENDO el código, no probándolo. Por
   eso queda aquí: para que la próxima la cace una prueba.

   La diferencia importa de verdad: «no salgas en toda la tarde» y «hay
   un hueco de tres horas en medio» es la jornada de alguien.        */
grupo('Horas sueltas no son una ventana');

/* Los dos ayudantes salen del fichero del servidor, no de una copia. */
const srvParte = fs.readFileSync(path.join(__dirname, 'api', 'parte.mjs'), 'utf8');
const sacaSrv = (firma, hasta = '\n}') => {
  const i = srvParte.indexOf(firma);
  if (i < 0) throw new Error(`no encuentro «${firma}» en api/parte.mjs`);
  return srvParte.slice(i, srvParte.indexOf(hasta, i) + hasta.length);
};
eval(sacaSrv('const hh = h =>', ';').replace(/^const hh =/, 'globalThis.hh ='));
eval(sacaSrv('function enTramos(hs) {'));
eval(sacaSrv('function tramosTxt(x) {'));

ok('horas seguidas salen como un tramo',
   JSON.stringify(enTramos([14, 15, 16, 17])) === JSON.stringify([{ini:14, fin:17}]));

/* EL CASO: dos episodios con la tarde limpia en medio. */
const dosEpisodios = enTramos([14, 23]);
ok('dos horas separadas NO se juntan en una ventana',
   dosEpisodios.length === 2, JSON.stringify(dosEpisodios));
ok('y se dicen las dos, con la «y» delante',
   tramosTxt({ tramos: dosEpisodios }) === '14h y 23h',
   tramosTxt({ tramos: dosEpisodios }));

const conHueco = enTramos([13, 14, 15, 20, 21, 22]);
ok('un hueco de cuatro horas parte el aviso en dos',
   tramosTxt({ tramos: conHueco }) === '13h-15h y 20h-22h',
   tramosTxt({ tramos: conHueco }));

/* Una hora sola se dice como hora, no como «18h-18h». */
ok('una hora sola no se escribe como un rango',
   tramosTxt({ tramos: enTramos([18]) }) === '18h',
   tramosTxt({ tramos: enTramos([18]) }));

/* Y la costura de medianoche se mide contra el ÚLTIMO tramo. */
ok('si el día acaba a las 23:00 y enlaza, se dice',
   tramosTxt({ tramos: enTramos([21, 22, 23]), sigue: true, hastaMadrugada: 2 })
   === '21h-23h y sigue hasta las 02h de mañana');
ok('un pico suelto a las 23:00 se ve como tramo aparte',
   enTramos([14, 15, 23]).at(-1).ini === 23,
   JSON.stringify(enTramos([14, 15, 23])));

/* Sin horas, no hay tramos ni frase. */
ok('sin horas no inventa una ventana',
   enTramos([]).length === 0 && tramosTxt({ tramos: [] }) === '');

/* ── NADA DECLARADO DESPUÉS DE ARRANCAR ──────────────────────────────
   El 27-08-2026 a las 07:26, con él ya trabajando, la app entera salió
   con la banda roja: «Cannot access 'CAMPO_COLA' before initialization».

   Causa: puse `const CAMPO_COLA` al FINAL de app.js y lo usaba desde una
   función que se llama al arrancar. `init()` corre en la línea 6637; el
   `const` estaba después. Cuando arranca, esa constante todavía no
   existe — y en JavaScript eso no es `undefined`, es un error que tumba
   el arranque entero.

   **NI `node --check` NI ESLint LO COGEN.** La sintaxis es perfecta y la
   variable está declarada, así que `no-undef` la da por buena. Solo se ve
   abriendo la app, y yo publiqué sin abrirla.

   Esto lo comprueba mirando el fichero, no ejecutándolo: cualquier
   `const` o `let` de nivel superior declarado DESPUÉS de `init()` y usado
   ANTES rompe el arranque.                                            */
grupo('Nada declarado después de arrancar');

const lineas = src.split('\n');
const iInit = lineas.findIndex(l => /^init\(\);/.test(l.trim()));
ok('se encuentra la llamada a init()', iInit > 0, 'no está o cambió de forma');

/* Nombres declarados con const/let en el nivel superior (sin sangría)
   por debajo de esa línea. */
const tardios = [];
lineas.forEach((l, i) => {
  if (i <= iInit) return;
  const m = l.match(/^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/);
  if (m) tardios.push({ nombre: m[1], linea: i + 1 });
});

/* ¿Alguno se usa antes de declararse? Se busca la palabra entera. */
const rotos = [];
for (const t_ of tardios) {
  const re = new RegExp(`\\b${t_.nombre}\\b`);
  for (let i = 0; i < t_.linea - 1; i++) {
    if (re.test(lineas[i])) { rotos.push(`${t_.nombre} se declara en la ${t_.linea} y se usa en la ${i + 1}`); break; }
  }
}

ok('ningún const/let se usa antes de existir',
   rotos.length === 0,
   rotos.join('\n        ') + '\n        Esto TUMBA la app entera al arrancar y no lo coge ni el linter.');

/* ── «NINGUNO VE AGUA» NO PUEDE SER SILENCIO ─────────────────────────
   Avisado por la sesión de mediciones el 27-08-2026. Cuando un sitio no
   tiene lluvia, el parte no decía NADA de agua, y ese silencio se lee
   como «está seco».

   Y en la costa es falso más veces de las que parece: el 26-08 en Bermeo
   chispeó de 20:50 a 21:13 y solo lo vio uno de cinco modelos.

   Se probó a montar un aviso con humedad y nubes y SE DESCARTÓ con dato:
   mientras chispeaba, la humedad en Bermeo era del **54 %**. Un umbral
   así no habría cazado el episodio real. Por eso esto no es un detector:
   es decir lo que se sabe en vez de callar.                          */
grupo('Ninguno ve agua no es silencio');

const enCosta = { name: 'BI BERMEO', lat: 43.412976, lon: -2.718316 };
const tierraAdentro = { name: 'VI ARBAIZA', lat: 43.047556, lon: -2.931611 };

/* La restricción geográfica se quitó el 27-08-2026: le chispeó en VITORIA,
   a 45 km del mar. El sirimiri es de frente, no de costa. Lo que se prueba
   ahora es que el aviso sale TAMBIÉN tierra adentro. */
ok('el aviso NO depende de estar en la costa', true, 'quitada la restricción');

/* Y en pantalla: un sitio de costa sin lluvia tiene que DECIRLO. */
S.saved = [enCosta];
S.torres = [{ place: enCosta }];
S.parteTorres = [{ k: k(enCosta), salta: false, maxCape: 300, minCin: 200, capeTecho: 300, tapaSuelo: 200 }];
S.lluviaTorres = [{ k: k(enCosta), llueve: false }];
LS.vaciar();
renderParte();
const seco = (pintado['#parte'] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/* El aviso se movió al PIE del parte el 28-08 —salía repetido en los
   catorce y así no lo lee nadie—, y al quitar las etiquetas queda en
   minúscula y con «hoy» detrás. */
ok('un sitio sin lluvia dice que ninguno ve agua',
   /ninguno de los cinco modelos ve agua/i.test(seco), seco.slice(0, 200));
ok('y avisa de que el sirimiri se les escapa',
   /el sirimiri se les escapa/.test(seco));
ok('con los tres casos medidos', /tres veces en agosto/.test(seco));
ok('y NO le dice qué hacer con eso',
   !/no se sube|no se toca|no se abre|antes de autorizar/i.test(seco),
   'orden suya del 28-08: la app pone el tiempo, él decide');

/* EL CASO DE VITORIA: tierra adentro también tiene que llevarlo. */
S.saved = [tierraAdentro];
S.torres = [{ place: tierraAdentro }];
S.parteTorres = [{ k: k(tierraAdentro), salta: false, maxCape: 200, minCin: 300, capeTecho: 200, tapaSuelo: 300 }];
S.lluviaTorres = [{ k: k(tierraAdentro), llueve: false }];
renderParte();
ok('tierra adentro TAMBIÉN entra en el aviso',
   /ninguno\s+de los cinco modelos ve agua/i.test((pintado['#parte'] || '')),
   'le chispeó en Vitoria, a 45 km del mar');

S.saved = [enCosta]; S.torres = [{ place: enCosta }];
S.parteTorres = [{ k: k(enCosta), salta: false, maxCape: 300, minCin: 200, capeTecho: 300, tapaSuelo: 200 }];

/* Si SÍ llueve, no se repite: ya lo dice el renglón de la lluvia. */
S.lluviaTorres = [{ k: k(enCosta), llueve: true, ini: Hh(0, 9), fin: Hh(0, 10),
                    pico: 1.2, hPico: Hh(0, 9), quien: 'ICON', nHoras: 2,
                    sueltas: false, soloSirimiri: false, discrepan: false,
                    horasAgua: [Hh(0, 9), Hh(0, 10)] }];
renderParte();
ok('si llueve NO se añade el aviso de seco',
   !/Ninguno de los cinco modelos ve agua/.test((pintado['#parte'] || '')),
   'estaría diciendo dos cosas a la vez');

/* Y QUE SE PINTE, no solo que se calcule. Las dos cosas se rompen por
   separado: la función puede estar perfecta y nadie llamarla — que es
   exactamente el fallo que casi deja muerto el aviso de sirimiri el
   26-08. Aquí se comprueba que `renderParte` deja el sello puesto. */
S.parteCuando = new Date().setHours(9, 12, 0, 0);
S.saved = [enCosta]; S.torres = [{ place: enCosta }];
S.parteTorres = [{ k: k(enCosta), salta: false, maxCape: 300, minCin: 200, capeTecho: 300, tapaSuelo: 200 }];
S.lluviaTorres = [{ k: k(enCosta), llueve: false }];
pintado['#parteSello'] = undefined;
renderParte();
ok('renderParte DEJA el sello puesto en pantalla',
   /Datos pedidos hoy a las 09:12/.test(pintado['#parteSello'] || ''),
   'la función buena y nadie llamándola es un fallo que ya pasó');

/* ── LA ALTURA DE LA NUBE: SUMA, PERO NUNCA CALLA ────────────────
   Puesto el 27-08-2026. Aitor mandó los pantallazos del mapa de la app
   con «Tope convectivo» y «Base convectiva» y ahí se vio que el tope de
   ese día no pasaba de 6,8 km, cuando la tarde que oyó truenos llegaba a
   10,6 km. Buena señal… y a punto estuve de usarla para BAJAR el aviso.

   LO IMPIDIÓ LA MEDIDA, y por eso estas pruebas existen. De los cinco
   casos que de verdad rompieron, TRES no tienen tope publicado —entre
   ellos los dos que le reventaron los postes en Lekeitio y Durango—, y
   GFS no lo publica NUNCA (0 de 1.008 horas medidas). Una regla que
   bajara el aviso por «tope bajo» habría callado justo esos.

   Así que el tope SUMA y jamás RESTA. Y estas pruebas lo bloquean. */
const hCombi = { cape: 1200, cin: 20, pop: 40, precipitation: 0 };

ok('SIN dato de tope no se dice nada (y el aviso queda intacto)',
   loQueMideLaNube({ ...hCombi }, null) === '',
   'callar es lo correcto; lo que no vale es leerlo como «no pasa nada»');

ok('el -500 del modelo NO es una altura',
   loQueMideLaNube({ ...hCombi, convective_cloud_top: -500,
                     convective_cloud_base: -500 }, null) === '',
   'sería pintar una nube bajo tierra');

let txt = loQueMideLaNube({ ...hCombi, convective_cloud_top: 10640 }, null);
ok('MUNGIA 24-08 (tope 10.640) se dice que es tan alta como la de Lekeitio',
   /10,6 km/.test(txt) && /Lekeitio/.test(txt), txt);

/* EL TOPE BAJO NO TRANQUILIZA, Y ESTO LO GUARDA.
   Mi primera versión decía «aunque la nube se queda en X km y a esa
   altura se electrifica poco». Duró tres horas. La tumbó una descarga
   MEDIDA ese mismo día junto a Zarautz (43,266/−2,173), donde ICON daba
   **tope de 5.900 m**, CAPE 780 y tapa 26. O sea que mi frase habría
   dicho «se electrifica poco» en el punto y la hora del rayo.

   El umbral de 9.000 m salió de comparar dos sitios un día. No vale ni
   para tranquilizar ni para nada: el tope se dice, no se interpreta. */
txt = loQueMideLaNube({ ...hCombi, convective_cloud_top: 4080 }, null);
ok('con el tope bajo se dice la altura', /4,1 km/.test(txt), txt);
ok('y NUNCA que se electrifique poco',
   !/electrifica poco/.test(txt) && !/poco/.test(txt),
   'con 5,9 km cayó una descarga junto a Zarautz el 27-08');
ok('al revés: avisa de que un tope bajo NO descarta el rayo',
   /NO quiere decir que no haya rayo/.test(txt) && /Zarautz/.test(txt), txt);

/* Y el caso de Zarautz, con su número exacto. */
txt = loQueMideLaNube({ ...hCombi, convective_cloud_top: 5900 }, null);
ok('ZARAUTZ 27-08 (tope 5.900, y CAYÓ) no se lee como tranquilizador',
   !/poco/.test(txt) && /NO quiere decir/.test(txt), txt);

/* Y LO QUE DE VERDAD NO SE PUEDE ROMPER: que el aviso siga saliendo. */
let r = assess({ cape: 1200, cin: 20, pop: 40, precipitation: 0,
                 convective_cloud_top: 4080 }, THR, 'hierro', null);
ok('con el tope BAJO el aviso de la combinación SIGUE saliendo',
   JSON.stringify(r).includes('la combinación que rompe'),
   'LEKEITIO y DURANGO reventaron sin tope publicado');
r = assess({ cape: 1200, cin: 20, pop: 40, precipitation: 0 }, THR, 'hierro', null);
ok('y sin tope ninguno, también',
   JSON.stringify(r).includes('la combinación que rompe'));

/* ── ¿DE CUÁNDO ES EL PARTE? ─────────────────────────────────────
   Suyo, 27-08-2026, mirando el parte de BI BERMEO en el móvil:
   *«¿cuándo está actualizado? no veo la hora, ¿es de hoy? ¿de ayer?»*
   y después *«no veo: actualizado a las xxxx»*.

   Y no lo veía porque no estaba. La única hora de la pantalla era la de
   la foto de portada. Un parte con el que se decide si sube gente y sin
   hora al lado no distingue el de ahora del que se quedó cargado anoche.

   Las tres pruebas son los tres estados, y la tercera es la que de
   verdad ocurre: el móvil se queda con la app abierta toda la noche. */
const T = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };

S.parteCuando = null;
ok('sin datos no se inventa un sello', selloParte() === null,
   'mejor nada que una hora falsa');

S.parteCuando = T(15, 43);
let sello = selloParte(T(15, 45));
ok('recién pedido dice la hora y que es de HOY',
   /Datos pedidos hoy a las 15:43/.test(sello.txt), sello.txt);

/* «CALCULADO» NO VUELVE. Suyo, 28-08-2026: «¿en vez de poner
   "calculado" podéis poner "datos actualizados a las xx"?». Sonaba a
   cuenta interna de la app y lo que él quiere saber es de cuándo son
   los números. Y NO se pone «actualizados» a secas: los datos se PIDEN
   a esa hora, pero la pasada del modelo detrás es más vieja —entre 2,6
   y 8,6 h esa misma mañana—, así que «actualizados a las 15:43» se
   leería como que el pronóstico es de las 15:43. */
ok('no vuelve la palabra «calculado», que le sonaba a cuenta interna',
   !/[Cc]alculado/.test(sello.txt), sello.txt);
ok('ni se dice «actualizados», que diría que el pronóstico es de esa hora',
   !/actualizad/i.test(sello.txt), sello.txt);
ok('y dice que el sello vale para TODOS los emplazamientos, no para uno',
   /emplazamientos a la vez/.test(sello.txt), sello.txt);
ok('y no sale en rojo ni en ámbar', sello.clase === '');

sello = selloParte(T(18, 16));
ok('a las dos horas y media avisa de que está viejo',
   /⚠/.test(sello.txt) && /hace 2 h 33 min/.test(sello.txt), sello.txt);
ok('y manda recargar', /recargar/.test(sello.txt));
ok('marcado como viejo', sello.clase === 'viejo');

/* EL CASO DE VERDAD: la app abierta desde anoche. */
S.parteCuando = T(21, 4) - 86400000;
sello = selloParte(T(7, 10));
ok('un parte de AYER lo dice con todas las letras',
   /de AYER a las 21:04/.test(sello.txt), sello.txt);
ok('y dice claramente que NO son de hoy',
   /NO son de hoy/.test(sello.txt), 'es la pregunta que hizo él');
ok('y va en rojo, no en tenue', sello.clase === 'ayer',
   'lo tenue es justo lo que no encontró');

/* ── LO QUE DICEN LAS LEYENDAS DE LAS CAPAS ─────────────────────────
   El 27-08-2026 la leyenda de la capa Inhibición llevaba cinco días
   diciendo que el MUCIN de AguaceroWx «SIEMPRE tiene menos tapa». Es
   falso: medido ese día con GFS, cuatro de cinco pueblos al revés
   (Bilbao 20 aquí y 91 allí). Y empujaba al lado imprudente, porque le
   decía que descontara la tapa que ve allí.

   Con el CAPE sí hay regla —MUCAPE ≥ el de superficie, por
   definición—; con la tapa NO, porque la burbuja más inestable se elige
   por su energía, no por su tapa. Esto guarda esa diferencia. */
const mapsSrc = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');

/* ── REFLECTIVIDAD COMO EN AGUACEROWX (17-09-2026) ─────────────────
   Suyo: «me gusta más su pintada, el nuestro parece más irreal» · «se
   ven más profesional, ¿verdad? a ver si lo igualas». Negro donde no
   hay eco, color desde 5 dBZ, y sin «−9» rotulados sobre el mar. */
/* ── WEBGL BLOQUEADO (18-09-2026, 14:46) ─────────────────────────────
   Su captura: «No se ha podido cargar el mapa ({"requestedAttributes"…
   "Failed to initialize WebGL"})». Chrome corta WebGL tras varias
   pérdidas de contexto; se cura recargando. La app recarga sola una vez
   y, si no, lo dice en cristiano con botón. */
grupo('Si el navegador bloquea WebGL, el mapa se recarga solo una vez y luego lo dice en cristiano');
ok('el catch reconoce el fallo de WebGL, recarga una vez con marca en sessionStorage y no entra en bucle',
   /const sinWebGL = \/WebGL\|context\/i\.test\(String\(e\?\.message \|\| e\)\);/.test(mapsSrc)
   && /sessionStorage\.setItem\(marca, '1'\)/.test(mapsSrc)
   && /setTimeout\(\(\) => location\.reload\(\), 800\);/.test(mapsSrc)
   && /sessionStorage\.removeItem\('mapaSinWebGL'\)/.test(mapsSrc));
ok('y a la segunda lo dice con botón, no con el JSON del navegador',
   /El navegador ha bloqueado el dibujo del mapa \(WebGL\)<\/b>/.test(mapsSrc)
   && /onclick="location\.reload\(\)">Recargar<\/button>/.test(mapsSrc));

grupo('El mapa de reflectividad: negro sin eco, color desde 5 dBZ');
ok('la escala de dBZ no pinta nada hasta 10 dBZ (0,15 mm/h) y mantiene los 15 tramos de la barra',
   /const DBZ_SIN_ECO = 9\.9;/.test(mapsSrc)
   && /breakpoints: \[0, mmDeDbz\(DBZ_SIN_ECO\), \.\.\.DBZ\.slice\(2\)\.map\(mmDeDbz\)\]/.test(mapsSrc)
   && /colors: DBZ_COLORES\.map\(\(c, i\) => hexRGBA\(c, i <= 1 \? 0 : 1\)\)/.test(mapsSrc),
   'suyo, 18-09 con AguaceroWx al lado: «esos dibujos verdes no me gustan» — el velo era el tramo 5-10 dBZ; en mm/h sigue saliendo todo');
ok('«Valores» no rotula por debajo de 5 dBZ (pero el pulsar el punto sigue dando el número)',
   /if \(e\?\.unidad === 'dBZ' && txt < DBZ_SIN_ECO\) continue;/.test(mapsSrc)
   && !/if \(e\?\.unidad === 'dBZ'[^\n]*\n[^\n]*pop\.setHTML/.test(mapsSrc));
ok('bajo la lluvia, en mm/h y en dBZ, el suelo va negro como en AguaceroWx',
   /const CON_SUELO_NEGRO = new Set\(\['lluvia', 'lluviaVerde', 'dbz'\]\);/.test(mapsSrc)
   && /sueloParaLluvia\(CON_SUELO_NEGRO\.has\(L_\.escala\)\)/.test(mapsSrc)
   && /setPaintProperty\('hillLayer', 'raster-opacity', CON_SUELO_NEGRO\.has\(L_\.escala\) \? 0 : 0\.32\)/.test(mapsSrc)
   && /const tono = \{ tierra: '#1b1d21'[^}]*mar: '#0b0c0f'/.test(mapsSrc)
   && !/#5a5f66/.test(mapsSrc),
   'suyo: «y si es de lluvia prefiero en mm»: misma pintada negra, leyendo milímetros');
ok('y en el fondo Oscuro no se pone suelo encima (ya está oscuro)',
   /sueloParaLluvia\(on\) \{[\s\S]{0,400}if \(!on \|\| this\.base === 'oscuro'\) \{ quitar\(\); return; \}/.test(mapsSrc));
ok('en mm/h nada se pinta ni se rotula por debajo de 0,1, y los rótulos llevan un decimal',
   /\['#4a7fd8',0\], \['#4a7fd8',\.55\], \['#3f9fe0',\.8\]/.test(mapsSrc)
   && /if \(e\?\.unidad === 'mm\/h' && txt < 0\.1\) continue;/.test(mapsSrc)
   && /e\?\.unidad === 'mm\/h'\) \? 1 : 0;/.test(mapsSrc),
   'un «0» encima de una mancha azul de 0,3 mm/h es un número que miente');

/* ── SIN CUADRADOS (17-09-2026) ──────────────────────────────────────
   Suyo: «más fino» · «no en cuadrados» · «si puedes». Las capas de
   lluvia se interpolan con cúbica MONÓTONA (no rebasa los nodos) y se
   funden entre cortes; el resto sigue en lineal hasta que se mida. */
ok('las capas de lluvia piden interpolación monótona y el resto lineal',
   /const INTERPOLACION_SUAVE = new Set\(\['lluvia', 'dbz', 'sombraLluvia', 'lluviaVerde', 'nieveAzul'\]\);/.test(mapsSrc)
   && /interpolation: INTERPOLACION_SUAVE\.has\(L_\?\.escala\) \? 'monotone' : 'linear'/.test(mapsSrc)
   && !/interpolation: 'cubic'/.test(mapsSrc),
   'cúbica monótona: redondea sin pintar más agua de la que dan los nodos');
ok('las escalas fundidas de lluvia y nieve llevan corte seco en 0,1: de 0 a 0,099 no se pinta nada',
   /const corteSeco = \(bp, cols\) => \(\{\s*breakpoints: \[bp\[0\], bp\[1\] - 1e-3, \.\.\.bp\.slice\(1\)\],\s*colors: \[cols\[0\], cols\[0\], \.\.\.cols\.slice\(1\)\],\s*\}\);/.test(mapsSrc)
   && (mapsSrc.match(/\.\.\.corteSeco\((mm|nvm), /g) || []).length === 3
   && (mapsSrc.match(/\n    desde: 1,\n/g) || []).length === 3,
   'suyo, 18-09 14:24: «se satura bien a lo primero y se desatura después» — el velo era el fundido de 0 a 0,1 sobre las trazas del global');
ok('y la lluvia en mm/h va fundida entre cortes (color_blend), como la reflectividad',
   /const ESCALAS_SUAVES = new Set\(\[[^\]]*'lluvia', 'lluviaVerde', 'nieveAzul'\]\);/.test(mapsSrc));

/* ── TIPO DE PRECIPITACIÓN, SEGÚN INTENSIDAD (17-09-2026) ───────────
   Suyo, con la capa de AguaceroWx: «mira cómo combina los colores» ·
   «SEGÚN INTENSIDAD». Verde la lluvia, azul la nieve, cada una con su
   rampa por mm/h, las dos del mismo modelo. Lo que no publica el modelo
   (lluvia helada, granizo) no se pinta, y si no publica nieve se dice. */
ok('la capa «Tipo de precipitación» apila la nieve (agua equivalente) sobre la lluvia, del mismo modelo',
   /\{ id:'tipo', g:'Lluvia', name:'Tipo de precipitación', v:'precipitation', unit:'mm\/h', escala:'lluviaVerde',\s*encima:'snowfall_water_equivalent', encimaEscala:'nieveAzul',/.test(mapsSrc));
ok('la lluvia va en verdes por intensidad y la nieve en azules, y nada por debajo de 0,1',
   /const lvc = \[\['#9be3a0',0\], \['#9be3a0',\.85\]/.test(mapsSrc)
   && /const nvc = \[\['#a9c8ff',0\], \['#a9c8ff',\.85\]/.test(mapsSrc)
   && /lluvia, lluviaVerde, nieveAzul,/.test(mapsSrc));
ok('la capa de encima solo se pide si ESE modelo publica la variable, y si no, se dice',
   /const publicaEncima = !!L_\.encima && \(!R\.meta\?\.variables \|\| R\.meta\.variables\.includes\(L_\.encima\)\);/.test(mapsSrc)
   && /this\._sinEncima = \(L_\.encima && !publicaEncima\) \? L_\.encima : null;/.test(mapsSrc)
   && /this\._sinEncima \? ` · SIN \$\{this\._sinEncima === 'snowfall_water_equivalent' \? 'NIEVE'/.test(mapsSrc)
   && /if \(publicaEncima\) \{\s*const u2 = this\.omUrl\(L_\.encima/.test(mapsSrc),
   'AROME no trae nieve en teselas: pedirla era una capa de «trozos sin cargar»');
const htmlSrc = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

grupo('La tapa de AguaceroWx: no hay regla (27-08-2026)');

const capaCin = (mapsSrc.match(/id:'cin'[\s\S]*?\},\n/) || [''])[0];
const descCin = capaCin.replace(/\/\*[\s\S]*?\*\//g, '');   // fuera los comentarios

ok('la capa Inhibición NO afirma que allí siempre haya menos tapa',
   !/SIEMPRE tiene menos tapa|siempre.{0,20}menos tapa/i.test(descCin),
   'era el texto que le empujaba a descontar la tapa que ve');
ok('y dice que puede ser MÁS o MENOS',
   /M[ÁA]S o MENOS tapa/i.test(descCin), descCin.slice(0, 120));
ok('con los dos casos medidos, uno en cada dirección',
   /119.{0,20}58/.test(descCin) && /20.{0,20}91/.test(descCin),
   'un solo caso se lee como si fuera la regla');

const guia = (htmlSrc.match(/Con la <b>tapa<\/b>[\s\S]{0,600}?<\/div>/) || [''])[0];
ok('la Guía tampoco la afirma',
   guia.length > 0 && !/en la suya sale más baja/.test(htmlSrc),
   'la Guía decía lo mismo con otras palabras');
ok('y en la Guía sigue en pie la regla del CAPE, que esa sí vale',
   /mayor o igual <b>siempre<\/b>, por definición/.test(htmlSrc),
   'MUCAPE ≥ superficie es de definición, no se toca');

/* ── EL NUDO QUE NO ES TU SITIO ──────────────────────────────────
   27-08-2026. Aitor mandó los mapas de superficie de AguaceroWx —SBCAPE
   y SBCIN, la MISMA variable que usa la app— y no cuadraban.

   No fallaba ninguno de los dos: leían puntos distintos. La app pedía
   los datos sin decir qué celda quería, Open-Meteo usaba `land` por
   defecto, y la tierra firme más cercana a BI BERMEO en la malla de
   ECMWF está a 18,3 km, en los montes entre Gernika y Durango.

   Números reales de aquel día, a las 17:00 en Bermeo:
       lo que enseñaba la app (nudo a 18,3 km) ... CAPE   20
       lo que da ECMWF en Bermeo (nudo a 10 km) .. CAPE 1110

   Cincuenta y cinco veces. Y encima al revés de lo cómodo: había MÁS
   energía sobre su costa de la que la app decía, no menos. */
eval(sacarConst('CELDA_LEJOS_KM'));
eval(sacar('function avisoCeldaLejos(f, ahora = Date.now()) {'));

/* HORAS RELATIVAS A HOY, Y RELOJ FIJO. Con fechas clavadas del 27-08 y
   `Date.now()` de verdad, estas diez pruebas pasaban a las 16:00 y
   fallaban a las 19:00 — el fallo que este mismo fichero avisa más
   arriba con `ventanaParte`. Ahora las horas se construyen sobre HOY y
   el reloj se le pasa a la función. */
const diaHoy = new Date().toISOString().slice(0, 10);
const tCerca = [`${diaHoy}T16:00`, `${diaHoy}T17:00`, `${diaHoy}T18:00`];
const RELOJ = new Date(`${diaHoy}T16:30`).getTime();
const fBase = t => ({
  hourly: { time: t, cape: [20, 20, 30], convective_inhibition: [80, 80, 80] },
});

ok('sin celda de al lado no se dice nada',
   avisoCeldaLejos(fBase(tCerca), RELOJ) === null);

/* EL CASO DE BERMEO, con sus cifras. */
let f = fBase(tCerca);
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [900, 1110, 800], convective_inhibition: [40, 30, 60] } };
let A = avisoCeldaLejos(f, RELOJ);
ok('BERMEO 27-08: el nudo de al lado SÍ dispara y se cuenta', !!A);
ok('y se da el peor, no el primero', A && A.cape === 1110, A && String(A.cape));
ok('con las dos distancias, que es lo que explica el desacuerdo',
   A && A.km === 18.3 && A.kmCerca === 10.0);
ok('y con lo que decía el nudo de tierra, para poder compararlos',
   A && A.capeT === 20, 'sin eso parece que la app mentía, y no mentía');

/* Si el nudo de tierra YA avisa, esto sobra: no se dice dos veces. */
f = { hourly: { time: tCerca, cape: [1200, 1200, 1200],
                convective_inhibition: [20, 20, 20] } };
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [900, 1110, 800], convective_inhibition: [40, 30, 60] } };
ok('si el nudo de tierra ya avisa, NO se repite',
   avisoCeldaLejos(f, RELOJ) === null, 'decir dos veces lo mismo es ruido');

/* Y si al lado no hay nada, tampoco se llena la pantalla. */
f = fBase(tCerca);
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [100, 120, 90], convective_inhibition: [40, 30, 60] } };
ok('si al lado tampoco hay gasolina, no se dice nada',
   avisoCeldaLejos(f, RELOJ) === null);

/* La tapa puesta al lado tampoco es aviso: es la combinación o nada. */
f = fBase(tCerca);
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [1110, 1110, 1110], convective_inhibition: [200, 200, 200] } };
ok('mucha gasolina al lado pero con la tapa puesta NO es aviso',
   avisoCeldaLejos(f, RELOJ) === null, 'la regla es CAPE Y tapa, aquí también');

/* EL SEGUNDO MOTIVO, que salió al comprobar el primero contra datos de
   verdad. Con solo «la combinación entera al lado» esto NO habría saltado
   nunca con ECMWF —el modelo del caso que lo originó— porque ECMWF **no
   publica la tapa**: 0 horas de 24. Se quedaba mudo justo en Bermeo con
   1.120 J/kg a diez kilómetros.

   Medido después de arreglarlo: salta **1 vez en 45 combinaciones
   sitio-modelo en 48 horas**, y es justo esa. */
f = { hourly: { time: tCerca, cape: [10, 10, 20],
                convective_inhibition: [null, null, null] } };
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [1120, 900, 800], convective_inhibition: [null, null, null] } };
A = avisoCeldaLejos(f, RELOJ);
ok('BERMEO con ECMWF: sin tapa publicada, TAMBIÉN se cuenta', !!A,
   'si no, el caso que lo originó se quedaba mudo');
ok('y queda marcado como «no seguro»', A && A.seguro === false,
   'sin tapa no se puede afirmar que rompa');
ok('con los dos números para comparar', A && A.cape === 1120 && A.capeT === 10);

/* Y no se dispara por cualquier diferencia: hace falta que sea gorda. */
f = { hourly: { time: tCerca, cape: [600, 600, 600], convective_inhibition: [null, null, null] } };
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [900, 900, 900], convective_inhibition: [null, null, null] } };
ok('una diferencia pequeña NO se cuenta', avisoCeldaLejos(f, RELOJ) === null,
   'el mapa se llenaría de avisos que no mueven nada');

f = { hourly: { time: tCerca, cape: [10, 10, 10], convective_inhibition: [null, null, null] } };
f._cerca = { km: 18.3, kmCerca: 10.0, hourly: {
  time: tCerca, cape: [400, 400, 400], convective_inhibition: [null, null, null] } };
ok('mucha diferencia pero poca gasolina TAMPOCO', avisoCeldaLejos(f, RELOJ) === null,
   '400 J/kg no rompen nada, por muy multiplicados que estén');

/* ── ¿CUÁNTOS MODELOS LO VEN? ────────────────────────────────────
   Suyo, 27-08-2026, viendo el parte de BI BERMEO con «RAYO de 15:00 a
   16:00 · lo ve ICON»: eso no dice si los demás lo ven o no.

   Y la cuenta NO es sobre cinco. ECMWF y AROME HD no publican la tapa
   —0 horas de 24, medido—, así que ni ven ni dejan de ver. Decir «1 de
   5» afirmaría que cuatro lo descartan, y cuatro ni lo han mirado. */
ok('uno de tres se dice', cuantosLoVen({ nVen: 1, nPodian: 3 })
   === ' · 1 de 3 que publican la tapa');
ok('si lo ven todos los que podían, no se dice nada',
   cuantosLoVen({ nVen: 3, nPodian: 3 }) === '',
   'el caso normal no necesita coletilla');
ok('con un solo modelo con tapa tampoco se dice',
   cuantosLoVen({ nVen: 1, nPodian: 1 }) === '',
   '«1 de 1» no informa de nada');
ok('sin contadores no se inventa una cuenta',
   cuantosLoVen({}) === '' && cuantosLoVen(null) === '');

/* ── EL AGUA TAMBIÉN LA LEÍA DONDE NO ERA ────────────────────────
   Mismo fallo del nudo, aplicado a la lluvia, y para él pesa MÁS que el
   CAPE: **con sirimiri no sube a mástil ni a torre**.

   Medido el 27-08-2026 en BI BERMEO con ECMWF: la app enseñaba **1,2 mm**
   en 48 h —nudo a 18 km, monte adentro— y el mismo modelo da **3,3 mm**
   en Bermeo. Casi tres veces más agua, y hacia el lado peligroso. */
S.thr = { ...(S.thr || {}), rainWarn: 0.2 };

let g = { hourly: { time: tCerca, precipitation: [0, 0, 0] } };
ok('sin celda de al lado no se dice nada del agua',
   aguaCeldaLejos(g, RELOJ) === null);

g = { hourly: { time: tCerca, precipitation: [0, 0, 0] } };
g._cerca = { km: 18.3, kmCerca: 10.0,
             hourly: { time: tCerca, precipitation: [0.1, 0.6, 0.3] } };
let G = aguaCeldaLejos(g, RELOJ);
ok('si al lado moja y aquí no, se cuenta', !!G);
ok('y se da la hora del peor', G && G.mm === 0.6);
ok('con lo que decía el nudo de tierra', G && G.mmT === 0);

/* Si aquí también avisa, no hace falta contarlo. */
g = { hourly: { time: tCerca, precipitation: [0.5, 0.5, 0.5] } };
g._cerca = { km: 18.3, kmCerca: 10.0,
             hourly: { time: tCerca, precipitation: [0.6, 0.6, 0.6] } };
ok('si aquí también moja, no se repite', aguaCeldaLejos(g, RELOJ) === null);

/* Y por debajo de su umbral de aviso no se dice: sería ruido. */
g = { hourly: { time: tCerca, precipitation: [0, 0, 0] } };
g._cerca = { km: 18.3, kmCerca: 10.0,
             hourly: { time: tCerca, precipitation: [0.1, 0.1, 0.1] } };
ok('cuatro gotas al lado no son aviso', aguaCeldaLejos(g, RELOJ) === null,
   'se usa SU umbral de lluvia, no uno nuevo');

/* ── LAS CHAPAS NO LLEVAN × ──────────────────────────────────────
   Suyo, 27-08-2026: *«esto me lo quitas que no salga porque sin querer
   le doy a la x y se borra alguno»*.

   La × iba pegada al nombre, en una barra que se arrastra con el dedo, y
   **borraba el emplazamiento en el acto y sin preguntar**. En una lista
   de quince sitios con la que reparte gente, perder uno de un roce es de
   los fallos caros — y encima callado: no se nota hasta que lo echas de
   menos. Quitar sigue pudiéndose, pero a propósito, con el ♥. */
eval(sacar('function renderPills() {'));
S.saved = [{ name: 'BI BERMEO', lat: 43.412976, lon: -2.718316 },
           { name: 'BI OIZ', lat: 43.22805, lon: -2.5936 }];
S.place = S.saved[0];
pintado['#pills'] = undefined;
renderPills();
const pills = pintado['#pills'] || '';
ok('las chapas salen con sus nombres', /BI BERMEO/.test(pills) && /BI OIZ/.test(pills));
ok('y NINGUNA lleva × de borrar', !/data-del/.test(pills) && !/class="x"/.test(pills),
   'le borraba emplazamientos de un roce');
ok('sin emplazamientos se dice cómo se guardan',
   (renderPills(S.saved = []) , /♥/.test(pintado['#pills'] || '')));

/* ── EL PULSO DEL VIGILANTE SE DICE SIEMPRE ──────────────────────
   27-08-2026. Hasta hoy la app solo hablaba cuando el vigilante llevaba
   4 h 30 muerto. El resto del tiempo, silencio — y el silencio valía a
   la vez por «va bien» y por «no he podido preguntar».

   Suyo ese día: *«no puedo estar dándole a permitir cada 4 minutos»*,
   *«si me voy a la calle y me estáis esperando, no avanzamos»*. Y el
   fondo del asunto, que es lo que arregla esto: **una tarea parada se ve
   igual que una tarde tranquila**. Es la regla 2 de la app aplicada al
   propio vigilante. */
eval(sacarConst('PULSO_MALO'));
eval(sacar('function estadoPulso(d) {'));
eval(sacar('function textoPulso(d) {'));
eval(sacar('function clasePulso(d) {'));

ok('sin respuesta NO se dice que vaya bien',
   estadoPulso(null) === 'nolose' && /no lo sé/.test(textoPulso(null)),
   'sin cobertura no se puede afirmar nada, ni bueno ni malo');
ok('y se dice con todas las letras que eso NO es que esté bien',
   /NO quiere decir que esté bien/.test(textoPulso(null)));

ok('una pasada reciente se CANTA, no se calla',
   estadoPulso({ haceMin: 20, sitios: 14 }) === 'vivo'
   && /Vigilante en pie/.test(textoPulso({ haceMin: 20, sitios: 14 })),
   'el silencio no puede significar «va bien»');
ok('y dice cuánto hace y cuántos sitios',
   /hace 20 min/.test(textoPulso({ haceMin: 20, sitios: 14 }))
   && /14/.test(textoPulso({ haceMin: 20, sitios: 14 })));

ok('a las 4 horas ya avisa de que nadie vigila',
   estadoPulso({ haceMin: 241 }) === 'muerto'
   && /NADIE ESTÁ VIGILANDO/.test(textoPulso({ haceMin: 241 })),
   'la pasada va cada 3 h: una perdida tiene que verse');
ok('y a las 3 horas y media todavía no, que sería falsa alarma',
   estadoPulso({ haceMin: 210 }) === 'vivo');

ok('los tres estados se pintan distinto',
   clasePulso({ haceMin: 20 }).includes('pulso--ok')
   && clasePulso({ haceMin: 300 }).includes('pulso--mal')
   && clasePulso(null).includes('pulso--nolose'));

/* ── EL CIELO DE LA FRANJA ───────────────────────────────────────
   Lo encontró ÉL, 27-08-2026, en BI SOLLUBEMENDI: la tarjeta «MAÑANA ·
   6-13 h · VIERNES» decía **Cubierto** y en la pestaña Horas las 10:00 y
   las 11:00 salían **con sol**. La misma app diciendo dos cosas.

   Los datos de aquel momento (Automático): de las ocho horas de la
   franja, SIETE «despejado» y UNA —las 07:00— «cubierto», con 0 % de
   nubes antes y después. La regla era «el peor código de la franja».

   Para el AGUA esa regla es la buena: una hora de chaparrón en ocho es
   una hora en la que no se sube. Para las NUBES no. */
eval(sacarConst('HAY_AGUA'));
/* Desde el 30-08 cada hora se lee con `codigoQueSeVe()`: cielo del
   dueño del cielo, agua del dueño de la lluvia. */
if (typeof HAY_AGUA === 'undefined') globalThis.HAY_AGUA = 51;
eval(sacar('function codigoQueSeVe(h, codigoDelCielo, thr = S.thr) {'));
eval(sacar('function codigoFranja(sel) {'));   // sacada a nivel de módulo el 28-08

const horasCon = cs => cs.map(c => ({ code: c }));

ok('SOLLUBE 27-08: siete horas de sol y una nube NO son una mañana cubierta',
   codigoFranja(horasCon([0, 3, 0, 0, 0, 0, 0, 0])) === 0,
   'era lo que contradecía a la pestaña Horas');

ok('pero una hora de LLUVIA en ocho sí manda',
   codigoFranja(horasCon([0, 0, 0, 61, 0, 0, 0, 0])) === 61,
   'una hora en la que no se sube es una hora en la que no se sube');

ok('y una hora de TORMENTA también',
   codigoFranja(horasCon([0, 0, 95, 0, 0])) === 95);

ok('el sirimiri no se diluye',
   codigoFranja(horasCon([0, 0, 0, 51])) === 51,
   'con sirimiri no sube a mástil ni a torre');

ok('si moja de dos formas, la peor',
   codigoFranja(horasCon([51, 61, 95, 51])) === 95);

ok('mayoría cubierta sigue saliendo cubierta',
   codigoFranja(horasCon([3, 3, 3, 0, 3])) === 3);

ok('en empate gana la más tapada, que es la que menos promete',
   codigoFranja(horasCon([0, 3])) === 3);

ok('sin códigos no se inventa ninguno',
   codigoFranja(horasCon([])) === undefined && codigoFranja([{ code: null }]) === undefined);

/* ── LA COTA VIAJA CON EL EMPLAZAMIENTO ──────────────────────────
   27-08-2026, hablando de lo que de verdad hace: subir un grupo
   electrógeno en remolque, de noche, por una pista de monte, solo,
   después de que un rayo tumbe la red.

   Para esa salida la app compara el ISOCERO con la COTA del sitio y
   avisa del hielo. Sin cota se calla. Y la cota vivía **solo en el
   localStorage de cada aparato**: al reinstalar la app se perdía sin que
   nadie lo dijera. Ese mismo día reinstaló en el Mac.

   Regla: lo de ESTE aparato manda; lo que llega rellena huecos. Nunca
   se pisa una cota que él haya puesto aquí. */
eval(sacar('function conSuConfig(p) {'));
eval(sacar('function adoptarConfig(torres) {'));

const sitio1 = { name: 'BI OIZ', lat: 43.22805, lon: -2.5936 };
const kOiz = 'cfg.' + k(sitio1);

/* MANDAR: la cota que hay aquí se envía con el emplazamiento. */
LS.vaciar();
LS.set(kOiz, { tipo: 'torre', cota: 1026, alt: 40 });
let env = conSuConfig(sitio1);
ok('la cota se manda con el emplazamiento', env.elev === 1026, JSON.stringify(env));
ok('y el tipo y la altura de trabajo también',
   env.tipo === 'torre' && env.hgt === 40);

/* Aparato recién instalado: sin nada. Lo que llega se adopta. */
LS.vaciar();
let n1 = adoptarConfig([{ ...sitio1, elev: 1026, tipo: 'hierro', hgt: 40 }]);
ok('un aparato recién instalado ADOPTA la cota que llega',
   n1 === 1 && LS.get(kOiz, null)?.cota === 1026,
   'es el caso del Mac reinstalado esta tarde');
ok('y la deja también donde la busca el aviso de hielo',
   LS.get('siteElev.' + k(sitio1), null) === 1026);

/* Lo que él haya puesto AQUÍ no se pisa. */
LS.vaciar();
LS.set(kOiz, { tipo: 'torre', cota: 1026, alt: 40 });
adoptarConfig([{ ...sitio1, elev: 400, tipo: 'dentro' }]);
ok('una cota de fuera NO pisa la que él puso en este aparato',
   LS.get(kOiz, null)?.cota === 1026,
   'perder una cota buena es quedarse sin aviso de hielo');

/* Y sin nada que adoptar, no se inventa. */
LS.vaciar();
ok('sin cota en ninguno de los dos lados no se inventa una',
   adoptarConfig([{ ...sitio1 }]) === 0 && LS.get(kOiz, null) === null);

/* ── EL GUARDIA DE LAS CAPAS TIENE QUE ESTAR ENCHUFADO ──────────────
   El 24-08-2026 la capa de Presión ponía «10 hPa» en toda Europa: la
   tesela había pasado de pascales a hPa y la app seguía dividiendo por
   100. No dio ningún error, porque no lo había: dio un número. Contra
   eso se escribió `fueraDeRango()`, que compara cada valor con lo
   posible en la Tierra.

   Y el 27-08-2026, en la revisión de las 22:00, salió que **estaba
   declarada y no la llamaba nadie**: tres días de código muerto donde
   el CLAUDE.md decía «lo canta en la barra de estado». ESLint no lo ve
   —una función sin usar no es una variable huérfana— y en pantalla no
   se nota, porque solo se notaría el día que una fuente cambie de
   unidad. Por eso se comprueba aquí. */
{
  grupo('El guardia de las capas del mapa');
  const m = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');

  const llamadas = (m.match(/fueraDeRango\s*\(/g) || []).length;
  ok('fueraDeRango() se LLAMA, no solo se declara',
     llamadas >= 3,
     `aparece ${llamadas} vez/veces contando la declaración; el 27-08 estaba muerta`);

  ok('se comprueba donde se pintan los números de la capa',
     /imposible \|\|= fueraDeRango\(/.test(m),
     'sin esto, un número imposible sale en el mapa sin decir nada');
  ok('y también al pulsar en un punto',
     /const imposible = fueraDeRango\(/.test(m),
     'con los números apagados, el popup es la única lectura que hay');

  // La función, sacada del maps.js de verdad, con los dos casos medidos.
  const i = m.indexOf('const RANGOS');
  const trozo = m.slice(i, m.indexOf('\n}', m.indexOf('function fueraDeRango')) + 2)
                 .replace(/^const RANGOS/, 'globalThis.RANGOS');
  eval(trozo);

  ok('la presión de 10 hPa del 24-08 se canta',
     !!fueraDeRango({ id:'pres', name:'Presión' }, 10));
  ok('y 1013 hPa se calla',
     fueraDeRango({ id:'pres', name:'Presión' }, 1013) === null);
  ok('la visibilidad va comprobada en km, no en metros',
     fueraDeRango({ id:'vis', name:'Visibilidad' }, 41.4) === null
     && !!fueraDeRango({ id:'vis', name:'Visibilidad' }, 41425),
     'si se comprobasen los metros crudos, avisaría de un día despejado');
  ok('sin dato no se inventa un aviso',
     fueraDeRango({ id:'temp', name:'Temperatura 2 m' }, null) === null,
     'un hueco no es un valor imposible: es un hueco');
}

/* ── EL SEMÁFORO MIRA A LOS SIETE, NO AL CARGADO ─────────────────
   Aprobado por él el 27-08-2026 a las 23:50. Esa noche, en Sollube: con
   ECMWF cargado el rótulo ponía **19 km/h y verde**, mientras ARPEGE
   daba 46 y AROME 45. El aviso de discrepancia salía, pero abajo.

   Medido por perfil antes de tocarlo, sobre 720 horas:
     · caseta y poste (su umbral 70): **0 horas** cambian a «no se
       trabaja». Donde de verdad trabaja, no le mueve nada.
     · subir a torre (sus 45/60): ahí sí pesa, y ahí toca ser prudente.

   Y su concepto de trabajo, en sus palabras del 28-08-2026:
     · a la CASETA va salvo rayos, más de 70 de racha o diluvio;
     · a la TORRE **no se sube ni lloviendo ni con más de 60**. */

const horaRacha = (g10, g, cuando) => ({ gust10: g10, gust: g, date: cuando });   // (era «horaDe»; ese nombre es de app.js desde el 09-09)
const isoDe = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
const cuando1 = new Date(); cuando1.setMinutes(0, 0, 0);

globalThis.COMPARAR = [
  { om: 'ecmwf_ifs025', name: 'ECMWF' },
  { om: 'meteofrance_arpege_europe', name: 'ARPEGE' },
];

S.comparativa = { _sitio: selloDe(), hourly: {
  time: [isoDe(cuando1).slice(0, 16)],
  wind_gusts_10m_ecmwf_ifs025: [19],
  meteofrance_arpege_europe: null,
  wind_gusts_10m_meteofrance_arpege_europe: [46],
} };

let r_ = peorRacha(horaRacha(19, 19, cuando1));
ok('SOLLUBE 27-08: coge el peor de los modelos, no el cargado',
   r_ && r_.v10 === 46 && r_.quien === 'ARPEGE',
   JSON.stringify(r_));

/* A LA ALTURA DE TRABAJO, con el factor del propio modelo cargado.
   Comparar 10 m contra un umbral de 40 m sería inflarlo sin querer. */
r_ = peorRacha(horaRacha(20, 30, cuando1));      // factor 1,5
ok('y lo escala a la altura con el factor del modelo cargado',
   r_ && Math.abs(r_.v - 69) < 0.5, r_ && String(r_.v));

/* SIN COMPARATIVA NO SE INVENTA NADA: él en el monte sin cobertura. */
S.comparativa = null;
ok('sin comparativa devuelve null y el semáforo va como siempre',
   peorRacha(horaRacha(19, 19, cuando1)) === null,
   'sin cobertura no se puede empeorar el veredicto con datos que no hay');

S.comparativa = { _sitio: selloDe(), hourly: { time: [isoDe(cuando1).slice(0, 16)] } };
ok('con la comparativa pero sin rachas, tampoco',
   peorRacha(horaRacha(19, 19, cuando1)) === null);

/* Y una hora que no está en la comparativa no se coge de otra. */
S.comparativa = { _sitio: selloDe(), hourly: { time: ['2020-01-01T00:00'],
  wind_gusts_10m_ecmwf_ifs025: [99] } };
ok('una hora que no está NO se rellena con la de al lado',
   peorRacha(horaRacha(19, 19, cuando1)) === null,
   'sería el fallo de las franjas que mezclaban dos días');

/* ── EL POSTE DE LA ACOMETIDA, CON LLUVIA ────────────────────────
   Regla suya del 28-08-2026 que no estaba en ningún sitio:

     *«Cuando está lloviendo no se debe subir a los postes de luz, que
       están los fusibles allí a 2 metros, por sobretensión.»*

   Es un TERCER caso: en la caseta la lluvia no le para, a la torre no
   sube ni lloviendo, y en el poste **manda el agua sobre algo en
   tensión**, no el resbalar. El aviso saltaba solo desde 2,0 mm/h, y una
   lluvia de 0,5 moja el fusible igual. Ahora desde 0,2.

   Y NO es veto: *«eso lo valoro yo»*. Se cuenta y decide él. */
const conLluvia = mm => JSON.stringify(assess(
  { prec: mm, gust: 20, gust10: 20, wind: 10, h: 10, date: new Date() },
  THR, 'hierro', null));

ok('lluvia normal (0,5) YA avisa de los fusibles del poste',
   /fusibles del poste/.test(conLluvia(0.5)),
   'antes solo hablaba a partir de 2,0 y el fusible se moja igual');
ok('y dice QUÉ va a estar mojado, sin decirle qué hacer',
   /contador/.test(conLluvia(0.5)) && /fusibles del poste/.test(conLluvia(0.5))
   && !/no (se |lo )?(toc|abr|sub)/i.test(conLluvia(0.5)),
   'orden suya del 28-08: los cuadros pueden estar dentro y él decide'); 
ok('y no le manda ni le sugiere nada',
   !/valora|decid|no se |NO abras|conviene|deberías/i.test(conLluvia(0.5)),
   'ni siquiera «lo valoras tú»: eso ya lo sabe'); 
ok('NO es veto: sigue siendo aviso, no «no apto»',
   !/"s":"no"/.test(conLluvia(0.5)) || /warn/.test(conLluvia(0.5)),
   'a la caseta va igual; lo que no hace es abrir el cuadro mojado');
ok('con lluvia fuerte también, claro', /fusibles del poste/.test(conLluvia(4)));
ok('sin lluvia no se dice nada del poste', !/fusibles del poste/.test(conLluvia(0)));

/* ── EL AVISO DEL SIRIMIRI, UNA VEZ Y NO CATORCE ─────────────────
   Visto el 28-08-2026 mirando el parte publicado. Al quitarle la
   restricción de costa —bien quitada— pasó de salir en tres sitios a
   salir en TODOS, con el mismo párrafo largo repetido diez veces.

   Es el fallo de las catorce horas rayadas del 25-08: una marca que
   aparece siempre deja de marcar nada. Y él ya avisó de que leer diez
   veces lo mismo «es muy cansino». */
eval(sacar('  const avisoSirimiri = (secos) => {', '\n  };').trim().replace(/^const/, 'globalThis.avisoSirimiri =').replace('avisoSirimiri = avisoSirimiri =','avisoSirimiri ='));

ok('sin sitios secos no se dice nada', avisoSirimiri([]) === '');
ok('con uno se le nombra',
   /En <b>BI OIZ<\/b> ninguno/.test(avisoSirimiri(['BI OIZ'])));
ok('con varios se dice cuántos, no se repite',
   /En <b>4<\/b> de tus emplazamientos/.test(avisoSirimiri(['a','b','c','d'])));
ok('con todos se dice «en todos»',
   /En todos tus emplazamientos/.test(avisoSirimiri('abcdefghijklmn'.split(''))));
ok('y sale UNA sola vez, no una por sitio',
   (avisoSirimiri(['a','b','c','d']).match(/el sirimiri se les escapa/g) || []).length === 1,
   'diez párrafos iguales no los lee nadie');
/* OJO: el texto va partido en dos líneas en el fuente, así que las
   expresiones tienen que aceptar el salto. Es la trampa nº 2 que este
   mismo fichero avisa más arriba. */
ok('sigue diciendo lo importante: los tres casos medidos',
   /tres veces en\s+agosto/.test(avisoSirimiri(['a']))
   && /ni las estaciones lo midieron/.test(avisoSirimiri(['a'])));
ok('y NO le dice qué hacer',
   !/no se sube|no se toca|no se abre/i.test(avisoSirimiri(['a'])),
   'él decide: la app pone el tiempo'); 

/* ── NADA SE REPITE EN LA PANTALLA ───────────────────────────────
   Orden suya, 28-08-2026 a las 00:20: *«revisar 2 veces las cosas, y
   tres si hace falta, ahí es donde se buscan los errores»* y
   *«automatizarlo y veréis cómo se trabaja mejor»*.

   Y con razón, porque esa misma noche pasó esto: al quitarle la
   restricción de costa al aviso del sirimiri —bien quitada— **el mismo
   párrafo largo empezó a salir en los CATORCE emplazamientos**. Ninguna
   prueba lo cogió. Lo vi yo abriendo el parte publicado, o sea a mano.

   Es un fallo de familia conocida: las catorce horas rayadas del 25-08 y
   los dos carteles para el mismo fallo del 25-08 por la noche. **Una
   advertencia que sale siempre deja de advertir.** Y él ya lo dijo con
   sus palabras: leer diez veces lo mismo «es muy cansino».

   Esto lo caza solo: se pinta el parte con sus catorce sitios y se
   comprueba que ningún párrafo largo aparece más de dos veces. No es una
   prueba de ESTE aviso: es una prueba de que **nadie llene la pantalla de
   copias**, sea del sirimiri o de lo que venga mañana. */
function parrafosRepetidos(html, minLargo = 90) {
  /* CUARTA VERSIÓN, y las tres anteriores NO cazaban su propio caso.
     Solo se supo reintroduciendo el fallo a propósito y mirando con una
     sonda. Vale la pena dejar las cuatro escritas, porque el patrón se
     repite:

       1ª · cortaba por CUALQUIER etiqueta → los `<b>` de dentro partían
            el párrafo en trozos cortos.
       2ª · arreglado eso, seguía sin cazarlo: el texto lleva **saltos de
            línea de verdad** dentro (plantilla escrita en varias líneas).
       3ª · aplastado el espacio, tampoco: **cada copia lleva el nombre
            del sitio** —«En SITIO 8 ninguno…»— así que para una
            comparación exacta eran quince textos DISTINTOS.

     Y esa tercera es el caso general, no una rareza: **el texto repetido
     casi siempre lleva algo que cambia** — un nombre, una hora, un
     número. Comparar exacto no sirve.

     Ahora se compara por **la cola**: los últimos 80 caracteres, que son
     la parte que no cambia. Comprobado con el fallo reintroducido: lo
     caza. Y comprobado sin él: no da falsos positivos.

     Orden suya del 28-08: *«revisar 2 veces las cosas, y tres si hace
     falta; ahí es donde se buscan los errores»*. Hicieron falta cuatro. */
  const SEP = '\u0000';
  const trozos = String(html || '')
    .replace(/<\/?(b|i|em|strong|span|small|a|u|code)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, SEP)
    .replace(/\s+/g, ' ')
    .split(SEP)
    .map(t => t.trim())
    .filter(t => t.length >= minLargo);

  const cuenta = new Map();
  for (const t of trozos) {
    const cola = t.slice(-80);          // la parte que no cambia
    const y = cuenta.get(cola) ?? { n: 0, txt: t };
    cuenta.set(cola, { n: y.n + 1, txt: y.txt });
  }
  return [...cuenta.values()].filter(v => v.n > 2)
                             .sort((a, b) => b.n - a.n)
                             .map(v => [v.txt, v.n]);
}

/* Los catorce, todos secos: el caso que lo destapó. */
S.saved = []; S.torres = []; S.parteTorres = []; S.lluviaTorres = [];
for (let n = 0; n < 14; n++) {
  const sitio = { name: `SITIO ${n}`, lat: 43.2 + n * 0.02, lon: -2.7 - n * 0.02 };
  S.saved.push(sitio);
  S.torres.push({ place: sitio });
  S.parteTorres.push({ k: k(sitio), salta: false, maxCape: 300, minCin: 200, capeTecho: 300, tapaSuelo: 200 });
  S.lluviaTorres.push({ k: k(sitio), llueve: false });
}
LS.vaciar();
renderParte();
const repes = parrafosRepetidos(pintado['#parte'] || '');
ok('con sus catorce sitios ningún párrafo se repite más de dos veces',
   repes.length === 0,
   repes.length ? `${repes[0][1]} veces: «${repes[0][0].slice(0, 70)}…»` : '');

/* LA PRUEBA DE LA PRUEBA, y esta vez con la forma REAL del fallo.
   La primera versión de esto usaba cien equis seguidas y pasaba siempre
   —incluso cuando el guardián no cazaba nada—, o sea que no probaba
   nada. Ahora imita el caso de verdad: **mismo final, principio
   distinto, con etiquetas dentro y saltos de línea**, que es como sale
   el HTML de la app. */
const falso = n => `<div class="x">En <b>SITIO ${n}</b> ninguno de los cinco
  modelos ve <b>agua</b> hoy. Aun así, el sirimiri se les escapa y si al llegar
  está mojando no se sube a mástil ni a torre.</div>`;

ok('la comprobación caza texto repetido aunque cambie el principio',
   parrafosRepetidos([1, 2, 3, 4].map(falso).join('')).length === 1,
   'las tres primeras versiones NO lo cazaban, y por eso existe esta prueba');
ok('y no se queja si solo sale dos veces',
   parrafosRepetidos([1, 2].map(falso).join('')).length === 0,
   'dos no es repetir: es que hay dos sitios');

/* ── UN CIELO QUE NO VE NADIE MÁS ────────────────────────────────
   28-08-2026, 08:25. Él mandó una foto del cielo de Bermeo: azul, con
   cuatro hebras altas. Un 10-15 % tapado a ojo.

   El Automático —el que sale por defecto— daba **100 %**, con 0 % la hora
   antes y 0 % la hora después. Los otros seis: 0, 0, 0, 0, 1 y 6.

   Un pico de una hora entre ceros, igual que el «Cubierto» de Sollube del
   día anterior: la costura de la mezcla de modelos. No se corrige el
   número —no somos nadie para reescribir un modelo— pero tampoco se
   enseña solo: un 100 % con el cielo azul hace que se deje de creer la
   app entera. */
eval(sacar('function cieloRaro(nubes) {'));
globalThis.modeloDato = () => ({ name: 'Automático', om: 'best_match' });
/* El cielo va ENTERO a su dueño por acierto (ARPEGE desde el 30-08), y
   desde el 02-09-2026 «los otros» son los otros DEL DUEÑO, no los del
   modelo cargado: antes el dueño se quedaba dentro de la lista y se
   comparaba consigo mismo. En el banco, el dueño es 'e' (ARPEGE). */
globalThis.quienLoMide = campo => (campo === 'cloud_cover' ? 'e' : null);

const cielo = (mios, otros) => {
  const t = ['2999-01-01T00:00'];
  const h = { time: t };
  COMPARAR.forEach((m, n) => { h[`cloud_cover_${m.om}`] = [otros[n] ?? null]; });
  S.comparativa = { _sitio: selloDe(), hourly: h };
  return cieloRaro(mios);
};
globalThis.COMPARAR = [
  { om: 'a', name: 'ECMWF' }, { om: 'b', name: 'ICON' }, { om: 'c', name: 'GFS' },
  { om: 'd', name: 'AROME HD' }, { om: 'e', name: 'ARPEGE' },
];

/* Ahora «los otros» son CUATRO, no cinco: el quinto es el dueño del
   cielo, o sea el que ha puesto el 100 que se está comparando. */
const rCielo = cielo(100, [0, 0, 0, 1, 6]);
ok('BERMEO 28-08: 100 % con el cielo azul se canta',
   rCielo && rCielo.cuantos === 4 && rCielo.mediana === 0, JSON.stringify(rCielo));
ok('y el DUEÑO del cielo no se compara consigo mismo',
   rCielo.total === 4,
   'con el dueño dentro, el aviso saltaba el 72 % de las horas y dejaba de significar algo');

ok('si todos coinciden, no se dice nada', cielo(80, [75, 80, 85, 78, 82]) === null);
ok('una diferencia pequeña tampoco', cielo(50, [20, 25, 30, 22, 28]) === null,
   '30 puntos es matiz, no desacuerdo');
/* CAMBIADO EL 28-08-2026, y el principio sigue siendo el mismo.
   Antes esto se callaba: si nadie se pone de acuerdo, no hay un modelo
   descolgado al que señalar. Cierto — pero **callarse era peor**, porque
   dejaba «Despejado · 0 %» escrito como un hecho.

   Lo destapó él esa tarde con una foto del cielo de Bermeo: medio cielo
   cubierto, la app diciendo 0 %, y los siete modelos repartidos de 0 a
   100. Tres lo veían. La app no dijo nada porque la regla pedía que se
   separasen cinco de seis.

   Ahora se dice el ABANICO —«van de 0 a 100 %»— que es justamente no
   señalar a nadie y contar lo que hay. */
const nadieSabe = cielo(100, [0, 90, 10, 95, 5]);
ok('si nadie se pone de acuerdo, se dice el abanico',
   nadieSabe !== null && nadieSabe.bajo === 0 && nadieSabe.alto === 100,
   JSON.stringify(nadieSabe));
ok('y no se señala a ningún modelo: se da el rango y la mediana',
   nadieSabe && has(nadieSabe.mediana) && has(nadieSabe.abanico),
   'eso no es un modelo descolgado: es que nadie lo sabe');

/* EL CASO DE SU FOTO, 28-08-2026 a las 20:00 en Bermeo. */
/* El quinto valor es el del DUEÑO del cielo ('e'), y tiene que cuadrar
   con lo que se enseña en pantalla: el 0 % de aquella noche. Antes daba
   igual porque el dueño entraba en «los otros» — que era justo el fallo
   (02-09-2026). Los otros cuatro siguen siendo los mismos, con el 100. */
const suFoto = cielo(0, [45, 100, 56, 17, 0]);
ok('BERMEO 28-08 20:00: con 0 % en pantalla y otros dando 100, se avisa',
   suFoto !== null, 'la app decía Despejado y había medio cielo cubierto');
ok('y se dice el abanico entero, de 0 a 100',
   suFoto && suFoto.bajo === 0 && suFoto.alto === 100, JSON.stringify(suFoto));
ok('sin comparativa no se inventa nada',
   (S.comparativa = null, cieloRaro(100)) === null);

/* ── LAS NUBES, POR CAPAS ────────────────────────────────────────
   Suyo, 28-08-2026 a las 21:00 desde su ventana de Bermeo: *«ahora sí
   que hay más nubes aquí en Bermeo, que antes y más grises, no de esas
   de lluvia»*. La ficha decía 27 %. El modelo tenía medias 59 y altas
   57 con bajas 0: el «total» no es la suma ni el máximo, y se las come.

   Los números de estas pruebas son los MEDIDOS ese día, no inventados:
   ECMWF a las 20:00 en el nudo de 9 km. */
eval(sacar('function nubesPorCapas(C) {'));

const bermeo2100 = nubesPorCapas({
  cloud_cover: 27, cloud_cover_low: 0, cloud_cover_mid: 59, cloud_cover_high: 57,
});
ok('BERMEO 28-08 21:00: manda la capa de las medias',
   bermeo2100 && bermeo2100.manda.n === 'medias', JSON.stringify(bermeo2100?.manda));
ok('y se canta que el total (27) no cuadra con la capa (59)',
   bermeo2100 && bermeo2100.noCuadra === true && bermeo2100.descuadre === 32);
ok('las tres capas salen con su nombre y su cifra',
   /bajas.*0.*medias.*59.*altas.*57/s.test(bermeo2100.linea), bermeo2100.linea);
ok('las medias se explican como lo que él ve: grises y sin lluvia',
   /grises/.test(bermeo2100.manda.que) && /no llueve/.test(bermeo2100.manda.que));

ok('si el total es mayor que todas las capas, cuadra y no se avisa',
   nubesPorCapas({ cloud_cover: 90, cloud_cover_low: 88, cloud_cover_mid: 20,
                   cloud_cover_high: 10 }).noCuadra === false);
ok('un cielo limpio no se marca',
   nubesPorCapas({ cloud_cover: 0, cloud_cover_low: 0, cloud_cover_mid: 0,
                   cloud_cover_high: 0 }).noCuadra === false);

/* ── EL TOTAL NO PUEDE SER MENOR QUE LA MAYOR DE SUS CAPAS ───────
   Aritmética pura: con 47 % de nubes altas, el cielo tapado es al menos
   un 47 %. Los números son los MEDIDOS: ECMWF en Bermeo el 29-08-2026 a
   las 05:00, el peor descuadre de las 168 horas miradas. */
const roto = nubesPorCapas({ cloud_cover: 3, cloud_cover_low: 9,
                             cloud_cover_mid: 4, cloud_cover_high: 47 });
ok('ECMWF 29-08 05:00: total 3 % con altas 47 % se canta como imposible',
   roto.noCuadra === true && roto.descuadre === 44);
/* ── Y EL DESCUADRE AL REVÉS: EL TOTAL POR ENCIMA DE LA SUMA ────
   Encontrado por la otra sesión el 29-08-2026 en «Ahora»: el Automático
   daba **total 73 % con bajas 20 · medias 0 · altas 0**, y la app decía
   «Manda la de bajas», hablando de un 20 % con el cielo tapado al 73.
   La unión nunca puede ser mayor que la suma de las partes.
   El margen de 10 puntos está medido: es donde ICON, GFS y ARPEGE —los
   que publican sus capas— dan cero en 3 días. */
const alReves = nubesPorCapas({ cloud_cover: 73, cloud_cover_low: 20,
                                cloud_cover_mid: 0, cloud_cover_high: 0 });
ok('AUTOMÁTICO 29-08: total 73 con capas que suman 20 se canta',
   alReves.sinExplicar === true && alReves.suma === 20);
ok('y en ese caso NO se dice qué capa manda, que es lo que engañaba',
   alReves.manda.n === 'bajas' && alReves.sinExplicar === true);
ok('solaparse no es descuadrar: bajas 40 + altas 40 con total 70 es legítimo',
   nubesPorCapas({ cloud_cover: 70, cloud_cover_low: 40, cloud_cover_mid: 0,
                   cloud_cover_high: 40 }).sinExplicar === false);
ok('y diez puntos justos todavía no saltan',
   nubesPorCapas({ cloud_cover: 40, cloud_cover_low: 30, cloud_cover_mid: 0,
                   cloud_cover_high: 0 }).sinExplicar === false);
ok('once sí',
   nubesPorCapas({ cloud_cover: 41, cloud_cover_low: 30, cloud_cover_mid: 0,
                   cloud_cover_high: 0 }).sinExplicar === true);

ok('un punto de diferencia es redondeo, no descuadre',
   nubesPorCapas({ cloud_cover: 40, cloud_cover_low: 41, cloud_cover_mid: 10,
                   cloud_cover_high: 5 }).noCuadra === false);
/* ── DIEZ PUNTOS, NO DOS (03-09-2026) ────────────────────────────────
   Él vio el aviso en pantalla y preguntó qué quería decir: *«¿qué quiere
   decir 0 % con altas el 2?»*. Nada. Dos puntos es redondeo.

   Este aviso está para cazar disparates —el peor medido fue **total 3 %
   con altas al 47 %**, el 29-08— y saltaba por dos puntos de la capa que
   menos le importa: las altas son cirros, dejan pasar el sol y no tapan
   la torre. Las que le tapan son las BAJAS.

   Diez puntos, el mismo margen que ya usaba `sinExplicar`: así los dos
   avisos del cielo tienen un solo criterio en vez de dos. */
ok('dos puntos ya sí',
   nubesPorCapas({ cloud_cover: 40, cloud_cover_low: 42, cloud_cover_mid: 10,
                   cloud_cover_high: 5 }).noCuadra === false);
ok('y once puntos sí saltan, que ahí ya no es redondeo',
   nubesPorCapas({ cloud_cover: 40, cloud_cover_low: 51, cloud_cover_mid: 10,
                   cloud_cover_high: 5 }).noCuadra === true);
ok('los dos avisos del cielo usan el MISMO margen, no uno cada uno',
   /manda\.v - C\.cloud_cover > 10/.test(src) && /suma < manda\.v - 10|> 10/.test(src),
   'dos avisos de lo mismo con dos criterios distintos es como se llega a que uno grite por nada');
ok('sin total no se puede juzgar si cuadra',
   nubesPorCapas({ cloud_cover: null, cloud_cover_low: 90,
                   cloud_cover_mid: 4, cloud_cover_high: 7 }).noCuadra === false);
ok('con sirimiri manda la de bajas',
   nubesPorCapas({ cloud_cover: 95, cloud_cover_low: 95, cloud_cover_mid: 10,
                   cloud_cover_high: 0 }).manda.n === 'bajas');
ok('sin dato de capas no se inventa una línea',
   nubesPorCapas({ cloud_cover: 40 }) === null);
ok('si solo falta una capa, se enseñan las otras dos',
   nubesPorCapas({ cloud_cover: 40, cloud_cover_mid: 50 }).capas.length === 1);

/* AROME HD no publica nubosidad total —medido a 7 días en Bermeo, Vitoria
   y Madrid: 168 de 168 horas vacías—. Sus capas sí las tiene, así que la
   fila no puede quedarse en blanco. */
const soloCapas = nubesPorCapas({
  cloud_cover: null, cloud_cover_low: 30, cloud_cover_mid: 2, cloud_cover_high: 0,
});
ok('sin total pero con capas, la fila sigue teniendo qué decir',
   soloCapas && soloCapas.capas.length === 3 && soloCapas.manda.n === 'bajas');
ok('y sin total no se puede decir que descuadre',
   soloCapas.noCuadra === false);

/* ── LAS NUBES, MODELO A MODELO (Torre) ──────────────────────────
   Suyo: *«al igual que rachas hay que meter lluvia y nubosidad de los
   modelos»* · *«en mis torres etc y torre»*. Los números son los MEDIDOS
   en Bermeo el 28-08-2026 a las 21:00, no inventados. */
/* La procedencia de las capas se saca de app.js TAL CUAL, no se copia:
   si mañana se comprueba HARMONIE y se añade, estas pruebas lo ven. */
eval(sacarConst('CAPAS_PROPIAS'));
eval(sacarConst('capasPropias'));
eval(sacar('function tablaNubes(H, i, hora) {'));

const Hn = (d) => {
  const H = { time: ['2999-01-01T21:00'] };
  COMPARAR.forEach((m, n) => {
    const x = d[n]; if (!x) return;
    H[`cloud_cover_${m.om}`]      = [x[0]];
    H[`cloud_cover_low_${m.om}`]  = [x[1]];
    H[`cloud_cover_mid_${m.om}`]  = [x[2]];
    H[`cloud_cover_high_${m.om}`] = [x[3]];
  });
  return H;
};

/* El orden de COMPARAR es: Automático · ECMWF · AROME HD · ICON · GFS.
   EL DESCUADRE VA EN **ICON** desde el 03-09-2026: es de los que publican
   sus capas de verdad, y desde ese día el aviso solo se le canta a ésos.
   Puesto en el Automático o en ECMWF —capas calculadas con la humedad— el
   aviso ya no salta, y con razón: medido, con ECMWF saltaba el 23 % de
   las horas. Ver `CAPAS_PROPIAS`. */
/* Con `om` REALES, que si no `capasPropias` no reconoce a nadie: el
   fixture de aquí arriba usa «a», «b», «c»… y con eso el filtro nuevo los
   descarta a todos. El orden aquí es ECMWF · ICON · GFS · AROME · ARPEGE. */
const tn = conOm(
  ['ecmwf_ifs025', 'icon_seamless', 'gfs_seamless',
   'meteofrance_arome_france_hd', 'meteofrance_arpege_europe'], [
  [70, 60, 20, 10],   // ECMWF · normal
  [27, 0, 59, 57],    // ICON · DESCUADRA: total 27 con las medias al 59
  [30, 10, 25, 10],   // GFS · normal
  [null, 0, 2, 0],    // AROME HD · sin total
  [68, 14, 54, 0],    // ARPEGE · no descuadra
]);

ok('BERMEO 28-08 21:00: se canta que hay números que no cuadran',
   /no cuadran/.test(tn), tn.slice(0, 200));
ok('y se dice con qué modelo y con qué capa', /ICON/.test(tn) && /medias/.test(tn));
ok('el modelo que no publica el total se marca «sin total», no como cero',
   /sin total/.test(tn));
ok('cada modelo enseña sus tres capas', /bajas.*59.*altas/s.test(tn));
ok('no se promedia: salen los cinco por separado',
   COMPARAR.every(m => tn.includes(m.name)));

// Todos de acuerdo y sin capa escondida: no se le avisa de nada
const tnOk = tablaNubes(Hn([
  [80, 78, 10, 5], [85, 80, 12, 4], [75, 70, 8, 6], [82, 79, 9, 5], [78, 74, 11, 3],
]), 0, 'viernes 21:00');
ok('si coinciden y el total representa a las capas, en verde',
   /Coinciden en el cielo/.test(tnOk) && !/se queda corto/.test(tnOk));

// Abanico enorme: el caso de su foto del mediodía
const tnAbre = tablaNubes(Hn([
  [0, 0, 0, 0], [100, 90, 10, 5], [45, 40, 5, 2], [17, 15, 2, 0], [56, 50, 5, 1],
]), 0, 'viernes 21:00');
ok('cuando se abren 100 puntos se le dice que no lo saben',
   /No coinciden en el cielo/.test(tnAbre));

ok('con un solo modelo no se monta una comparativa',
   tablaNubes(Hn([[27, 0, 59, 57]]), 0, 'x') === '');

/* ── LO CALCULADO NO SE RECOMIENDA POR ENCIMA DE LO PUBLICADO ────
   Comprobado en la documentación el 28-08-2026: ECMWF **no publica** las
   capas —sus datos abiertos solo llevan el total—, se las calcula
   Open-Meteo con la humedad. ICON, GFS y ARPEGE sí las publican.
   Así que un ECMWF con el total corto NO puede disparar el «mira las
   capas»: sería enfrentar su dato contra una cuenta nuestra. */
ok('ECMWF: sus capas NO son suyas', capasPropias('ecmwf_ifs025') === false);
ok('ICON, GFS y ARPEGE: las suyas sí',
   ['icon_seamless','gfs_seamless','meteofrance_arpege_europe']
     .every(m => capasPropias(m) === true));
ok('de los no comprobados no se afirma nada, ni que sí ni que no',
   capasPropias('knmi_harmonie_arome_europe') === null &&
   capasPropias('gem_seamless') === null);

// COMPARAR en las pruebas usa om a..e; se le pone el om real a los dos primeros
/* `function` y no `const`, para poder usarla ANTES de esta línea: el
   caso de la tabla de nubes la necesita y un `const` no sube — reventó
   con «Cannot access 'conOm' before initialization» (03-09-2026). */
function conOm(oms, datos) {
  const viejo = COMPARAR.map(m => m.om);
  COMPARAR.forEach((m, n) => { if (oms[n]) m.om = oms[n]; });
  const H = Hn(datos);
  const r = tablaNubes(H, 0, 'viernes 21:00');
  COMPARAR.forEach((m, n) => { m.om = viejo[n]; });
  return r;
}
/* ── EL DESCUADRE SOLO SE CANTA A QUIEN PUBLICA SUS CAPAS ────────────
   Suyo, 03-09-2026, tras subir el margen de 1 a 10 puntos:
     *«a ver si es para siempre y no salga a diario»*

   Hacía bien en dudar: subir el margen NO bastaba. MEDIDO sobre 168
   horas por modelo en Bermeo, cuántas veces saltaría el aviso:

     ECMWF ......  68/168 (40 %)  →  con 10 puntos: 38 (23 %)
     ICON .......   0             →   0
     GFS ........   0             →   0
     Automático .   6 ( 4 %)      →   3 ( 2 %)

   **ECMWF seguía saltando una hora de cada cuatro**, y ECMWF es el que
   lleva su cielo: le habría salido a diario igual. Porque el margen no
   era el problema — **las capas de ECMWF no son suyas**, se las calcula
   Open-Meteo con la humedad. Comparar el total del modelo con una cuenta
   ajena descuadra por definición.

   Con el filtro de `CAPAS_PROPIAS`: **0 de 672 horas medidas**. Y el
   aviso sigue en pie para ICON, GFS y ARPEGE, donde un descuadre sí
   significa algo. */
const soloIcon = conOm(['icon_seamless'], [
  [27, 0, 59, 57], [40, 35, 20, 10], [38, 33, 18, 9], [42, 38, 15, 8], [36, 30, 12, 6],
]);
// El MISMO descuadre en ECMWF, que ya no se canta: sus capas son calculadas.
const soloEcmwf = conOm(['ecmwf_ifs025'], [
  [27, 0, 59, 57], [40, 35, 20, 10], [38, 33, 18, 9], [42, 38, 15, 8], [36, 30, 12, 6],
]);
ok('un ECMWF descuadrado se canta igualmente',
   !/no cuadran/.test(soloEcmwf) && /no cuadran/.test(soloIcon),
   'con ECMWF saltaba el 23 % de las horas medidas: eso es ruido, no aviso');
/* La coletilla se acortó el 03-09-2026: decía «Ese modelo no publica las
   capas: el total es suyo y las capas son una cuenta hecha con la
   humedad» —dos renglones explicando el aviso que acababa de dar— y la
   fila del modelo ya lleva «calculadas con la humedad» junto a las
   cifras. Lo que se exige no cambia: que se diga de dónde salen las capas
   y que NO se culpe al total. */
ok('y se dice que sus capas son una cuenta, sin culpar al total',
   /calculadas con la humedad/.test(soloEcmwf)
   && !/el total.*roto|no fiable/.test(soloEcmwf),
   'no se le grita, pero en su fila SÍ se dice de dónde salen sus capas');
ok('si coinciden y todo cuadra, en verde',
   /Coinciden en el cielo/.test(tnOk) && !/no cuadran/.test(tnOk));
ok('pero se dice que sus capas van calculadas',
   /calculadas con la humedad/.test(soloEcmwf));
ok('y el pie explica quién publica las suyas y quién no',
   /ICON<\/b>, <b>GFS<\/b> y <b>ARPEGE<\/b> publican sus capas/.test(soloEcmwf));

/* ── CAPE Y TAPA EN LAS TARJETAS DE HORAS ────────────────────────
   Suyo, 28-08-2026: «aquí falta poner si habrá CAPE, inhibición, etc.».

   Y la prueba que de verdad importa es la SEGUNDA: esa misma mañana él
   cazó «29 km/h: no coinciden · cuadran con el aparato» y dijo «lío».
   La primera versión de esta línea repetía el fallo sin querer, porque
   `textoTapa()` llama «aguanta» a todo lo que hay entre 50 y 200 y la
   regla calibrada rompe por debajo de 75: con la tapa en 68 salía
   «tapa 68 (aguanta) — la tapa no la sujeta» en la misma frase.
   Esta prueba está para que no vuelva. */
console.log('\n  CAPE y tapa, hora a hora');

eval(sacar('function textoTapa(cin, h) {'));
eval(sacar('function lineaCapeHora(h) {'));

const sinEtiquetas = t => t.replace(/<[^>]*>/g, '');

ok('con los dos números se pintan los dos',
   sinEtiquetas(lineaCapeHora({ cape: 300, cin: 120 })) === 'CAPE 300 · tapa 120 (aguanta)',
   sinEtiquetas(lineaCapeHora({ cape: 300, cin: 120 })));

ok('sin ninguno de los dos NO se pinta una línea vacía',
   lineaCapeHora({}) === '');

ok('si el modelo no publica la tapa se DICE, no se deja el hueco',
   sinEtiquetas(lineaCapeHora({ cape: 870 })).includes('no la publica'),
   'un hueco se lee «no hay tapa», que es lo contrario de no saberlo');

ok('y si no publica el CAPE, igual',
   sinEtiquetas(lineaCapeHora({ cin: 40 })).includes('CAPE: no lo publica'));

/* La pareja calibrada: CAPE >= 700 Y tapa < 75 en la misma hora. */
ok('los dos a la vez se marcan en ámbar',
   lineaCapeHora({ cape: 870, cin: 68 }).includes('hcard__c--ojo'));

ok('con el CAPE justo por debajo, no',
   !lineaCapeHora({ cape: 690, cin: 68 }).includes('hcard__c--ojo'));

ok('con la tapa por encima de 75, tampoco',
   !lineaCapeHora({ cape: 870, cin: 120 }).includes('hcard__c--ojo'));

ok('sin tapa publicada NO se marca en ámbar por el CAPE solo',
   !lineaCapeHora({ cape: 2000 }).includes('hcard__c--ojo'),
   'sin la tapa no se sabe si rompe: eso es no saberlo, no es que rompa');

/* EL LÍO QUE ÉL CAZÓ, EN SU CASO EXACTO */
const c68 = sinEtiquetas(lineaCapeHora({ cape: 870, cin: 68 }));
ok('con la tapa en 68 NO se dice «aguanta» y que no sujeta a la vez',
   !(c68.includes('aguanta') && c68.includes('no la sujeta')), c68);

ok('cuando salta la regla se dicen los dos listones, no una palabra suelta',
   c68.includes('700') && c68.includes('75'), c68);

ok('y cuando NO salta, la palabra de la escala del mapa sí va',
   sinEtiquetas(lineaCapeHora({ cape: 300, cin: 30 })).includes('floja')
   && sinEtiquetas(lineaCapeHora({ cape: 300, cin: 20 })).includes('abierta'),
   sinEtiquetas(lineaCapeHora({ cape: 300, cin: 30 })));

ok('la línea nunca le dice qué hacer',
   !/no se sube|no subas|espera|autoriz|debes|no toques/i.test(
     [c68, sinEtiquetas(lineaCapeHora({ cape: 300, cin: 120 }))].join(' ')),
   'vosotros cifras, la decisión la toma él');

/* ── LAS DOS FRASES DEL CONTRASTE CON SU ESTACIÓN ────────────────
   Suyo, 28-08-2026: «hay un comentario que pone 29 km/h de diferencia:
   no coinciden, y luego cuadran con el aparato… coinciden, no coinciden,
   pero cuadran… lío».

   No había nada mal por debajo: `corto` se calcula contra el MAYOR de
   los modelos, que es el que se queda `peorRacha()`. El fallo era que
   las dos frases comparaban cosas distintas y no lo decían. */
console.log('\n  Las dos frases del contraste con su estación');

eval(sacar('function frasesContraste(filas, medido) {'));

const siete = d => [{ n: 'ECMWF', v: 50 + d }, { n: 'ICON', v: 45 }, { n: 'GFS', v: 50 }];

/* SU CASO: 29 de diferencia entre ellos Y el más fuerte cuadrando. Las
   dos cosas a la vez son verdad, y es lo que le sonaba a contradicción. */
const suyo = frasesContraste([{ n: 'ICON', v: 74 }, { n: 'GFS', v: 60 }, { n: 'ECMWF', v: 45 }], 71);
ok('29 entre ellos y el más fuerte cuadrando caben en la misma tarjeta',
   suyo.acuerdo.t.includes('no se ponen de acuerdo') && suyo.juicio.includes('cuadra'),
   `${suyo.acuerdo.t} | ${suyo.juicio}`);

ok('cada frase dice contra QUÉ compara, que era todo el lío',
   suyo.acuerdo.t.includes('entre el más flojo') === false
   && suyo.juicio.includes('el más fuerte'),
   'la etiqueta «Entre ellos:» / «Contra el aparato:» la pone la plantilla');

ok('y se NOMBRA al más fuerte, que es el que se queda la app',
   suyo.juicio.includes('ICON'), suyo.juicio);

/* Los tres tramos del acuerdo */
ok('con menos de 12 de diferencia, de acuerdo',
   frasesContraste(siete(3), 52).acuerdo.c === 'ok');
ok('entre 12 y 25, se dice el abanico',
   frasesContraste([{ n: 'a', v: 60 }, { n: 'b', v: 42 }], 50).acuerdo.c === 'reg');
ok('de 25 para arriba, no se ponen de acuerdo',
   frasesContraste([{ n: 'a', v: 74 }, { n: 'b', v: 45 }], 50).acuerdo.c === 'mal');

/* Los tres tramos del juicio, SIEMPRE contra el más fuerte */
ok('si la estación midió mucho más, el más fuerte se queda corto',
   frasesContraste([{ n: 'a', v: 45 }, { n: 'b', v: 40 }], 71).juicio.includes('se queda'),
   frasesContraste([{ n: 'a', v: 45 }, { n: 'b', v: 40 }], 71).juicio);
ok('si midió mucho menos, se pasa',
   frasesContraste([{ n: 'a', v: 70 }, { n: 'b', v: 65 }], 45).juicio.includes('se pasa'));
ok('y a menos de 15 de diferencia, cuadra',
   frasesContraste([{ n: 'a', v: 50 }, { n: 'b', v: 45 }], 47).juicio.includes('cuadra'));

ok('«cuadra» dice CUÁNTA diferencia hay, no se queda en la palabra',
   /\d/.test(frasesContraste([{ n: 'a', v: 50 }, { n: 'b', v: 45 }], 47).juicio),
   'sin la cifra, «cuadra» es una opinión');

/* ── EL CASO DE BILBAO AEROPUERTO: PARTIDOS EN DOS ───────────────
   28-08-2026, 05:00, aparato en 28 km/h. Medido con los siete en las
   coordenadas de la estación (43,297952 / −2,906304).

   «28,8 de diferencia, no se ponen de acuerdo» es verdad y se queda
   corto: no es dispersión, es que la mitad dice que NO HAY VIENTO. Y
   ICON, el modelo por defecto, daba 6,8 con 28 en la calle. */
const bilbao05 = [
  { n: 'AROME HD', v: 35.6 }, { n: 'ECMWF', v: 31.0 }, { n: 'ARPEGE', v: 30.2 },
  { n: 'HARMONIE', v: 26.6 }, { n: 'GFS', v: 19.8 }, { n: 'GEM', v: 7.6 },
  { n: 'ICON', v: 6.8 },
];
const bil = frasesContraste(bilbao05, 28);
ok('BILBAO 28-08 a las 05:00: se dice que están PARTIDOS EN DOS',
   /partidos en dos/.test(bil.acuerdo.t), bil.acuerdo.t);
ok('y se nombra quién está en cada bando',
   /AROME HD/.test(bil.acuerdo.t) && /ICON/.test(bil.acuerdo.t), bil.acuerdo.t);
ok('con el tramo de cada grupo, no solo los nombres',
   /36 km\/h/.test(bil.acuerdo.t) && /8 km\/h/.test(bil.acuerdo.t), bil.acuerdo.t);
ok('y sigue marcado en rojo', bil.acuerdo.c === 'mal');
/* Y el juicio, contra el MÁS FUERTE — que es lo que se queda la app en
   `peorRacha()`. Aquí AROME da 35,6 con 28 medidos: se pasa 7,6, dentro
   de los ±15, así que «cuadra». Y es la lectura buena: el error cae del
   lado seguro. Es lo que tapó este caso y el de Matxitxako de anoche.
   Si el juicio se hiciera contra ICON —6,8 con 28 medidos— diría que se
   queda 21 corto, que es la verdad de ICON y no la que usa la app. */
ok('el juicio se hace contra el MÁS FUERTE, no contra el que va por defecto',
   /AROME HD/.test(bil.juicio) && /cuadra/.test(bil.juicio), bil.juicio);

/* Y no se llama «partidos en dos» a una dispersión normal. */
const escalera = [{ n: 'a', v: 40 }, { n: 'b', v: 34 }, { n: 'c', v: 28 },
                  { n: 'd', v: 22 }, { n: 'e', v: 16 }, { n: 'f', v: 11 }];
ok('una escalera repartida NO son dos bandos',
   !/partidos/.test(frasesContraste(escalera, 30).acuerdo.t),
   frasesContraste(escalera, 30).acuerdo.t);
ok('ni con pocos modelos, que dos contra uno no es un bando',
   !/partidos/.test(frasesContraste([{ n: 'a', v: 40 }, { n: 'b', v: 8 }], 30).acuerdo.t));
ok('ni con horquilla pequeña aunque haya un hueco',
   !/partidos/.test(frasesContraste(
     [{ n: 'a', v: 24 }, { n: 'b', v: 23 }, { n: 'c', v: 12 }, { n: 'd', v: 11 }], 20).acuerdo.t));

ok('ninguna de las dos frases le dice qué hacer',
   !/no se sube|no subas|espera|autoriz|debes|no toques/i.test(
     suyo.acuerdo.t + ' ' + suyo.juicio));

/* ── EL AGUA EN LA TARJETA, Y SOBRE TODO CUÁNDO ESCAMPA ──────────
   28-08-2026, después de que él contara cómo trabaja de verdad: «a la
   torre se sube solo para cambiar alguna antena esporádica; el 90 % de
   las ocasiones vas a las casetas o equipos intemperie que están a
   pie». La racha manda en el 10 %. En el 90 % manda si llueve y cuándo
   para — fusibles al aire con tensión, y armarios que hay que abrir a
   cielo descubierto con radioenlaces dentro.

   Y su frase de siempre: «o les digo esperar 2 horas que amaina el
   temporal». Esa hora es el dato. */
console.log('\n  El agua en la tarjeta del emplazamiento');

eval(sacar('function lineaAguaTorre(k) {'));

const H0 = h => { const d = new Date(); d.setHours(h, 0, 0, 0); return d.getTime(); };
/* La hora en la que corre la prueba. Todo lo que se monta abajo se
   coloca RELATIVO a ella, nunca a una hora fija del reloj. */
const h = new Date().getHours();
const soloTexto = t => t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

S.lluviaTorres = [{ k: 'seco', llueve: false }];
ok('sin agua se dice que está seco, no se calla',
   /^<div class="tor__agua" data-a="seco">Seco /.test(lineaAguaTorre('seco')),
   'callar se lee igual que «no lo he mirado»');
/* ── Y SE DICE LA VENTANA QUE SE HA MIRADO (20-09-2026) ──────────────
   Antes ponía siempre «en las próximas 24 h», y casi nunca son 24 horas:
   a las 19:00 la ventana del parte son las seis que quedan de hoy. Con 4
   mm a las 02:00 dentro de los datos pero fuera de la ventana, la tarjeta
   decía «Seco en las próximas 24 h» y la tira de colores de debajo, que sí
   llega a las 07:00, decía otra cosa. */
ok('y NO se afirman 24 horas cuando la ventana es otra',
   !/en las próximas 24 h/.test(lineaAguaTorre('seco'))
   && /lo que queda de hoy|Seco el /.test(lineaAguaTorre('seco')),
   'la ventana del parte es lo que queda del día, o el día que él tenga pulsado');

ok('un emplazamiento que no está en la lista NO inventa una línea',
   lineaAguaTorre('no-existe') === '');

/* ESTÁ CAYENDO AHORA: lo que le sirve es la hora a la que para. */
const ahora = new Date().getHours();
/* SIN TOPES DE RELOJ. Los `Math.min(22, ...)` y `Math.max(0, ...)` que
   había aquí daban por hecho que la prueba se ejecuta entre las 01:00 y
   las 20:00: a las 23:37 del 28-08-2026 el final se aplastaba contra las
   22:00 y el escenario dejaba de ser «está cayendo ahora». Segunda prueba
   atada al reloj que aparece el mismo día.

   `setHours()` ya rueda de día solo —25 son las 01:00 de mañana y −1 las
   23:00 de ayer—, así que la ventana es de verdad «empezó hace una hora y
   acaba en dos», corra a la hora que corra. */
S.lluviaTorres = [{ k: 'cae', llueve: true, ini: H0(ahora - 1),
                    fin: H0(ahora + 2), pico: 1.2,
                    hPico: H0(ahora + 1), nHoras: 4, sueltas: false,
                    soloSirimiri: false }];
const cae = lineaAguaTorre('cae');
ok('si está cayendo AHORA, lo primero que se dice es a qué hora escampa',
   /escampa a las/.test(soloTexto(cae)), soloTexto(cae));
ok('y se marca como que es ahora, no como algo de luego',
   /data-a="ahora"/.test(cae));

/* PARA LUEGO: entonces lo que sirve es cuándo empieza.

   OJO CON LA HORA DE LA PRUEBA. La primera versión ponía la lluvia a
   las 20:00 fijas, y a las 19:30 de un viernes la prueba se cayó sola:
   a esa hora «las 20:00» ya es «dentro de un rato», así que la línea
   decía «escampa a las…» y no «de 20 a 22». **Una prueba que depende de
   la hora a la que se ejecute no prueba nada**: falla o pasa según el
   reloj, y el día que falle de verdad nadie la creerá.
   Ahora la lluvia se pone SIEMPRE dentro de seis horas, sea la hora que
   sea, y se comprueba con esas mismas horas. */
const H6 = (h + 6) % 24, H7 = (h + 7) % 24;
S.lluviaTorres = [{ k: 'luego', llueve: true, ini: H0(H6), fin: H0(H7), pico: 3.0,
                    hPico: H0(H6), nHoras: 2, sueltas: false, soloSirimiri: false }];
const luego = soloTexto(lineaAguaTorre('luego'));
ok('si es para luego se dice desde qué hora hasta cuál',
   new RegExp(`de ${String(H6).padStart(2,'0')}:00 a ${String((h+8)%24).padStart(2,'0')}:00`).test(luego),
   luego);
ok('y con cuánta agua, en palabras y no en milímetros pelados',
   /Llueve bien/.test(luego), luego);

/* HORAS SUELTAS: tres repartidas no son once seguidas. Ya me lo corrigió. */
S.lluviaTorres = [{ k: 'sueltas', llueve: true, ini: H0(9), fin: H0(20), pico: 0.4,
                    hPico: H0(12), nHoras: 3, sueltas: true, soloSirimiri: false }];
const su = soloTexto(lineaAguaTorre('sueltas'));
ok('tres horas repartidas se dicen SUELTAS, no «de 09:00 a 21:00»',
   /3 horas sueltas entre las 09:00 y las 20:00/.test(su), su);

/* EL SIRIMIRI DE COSTA: moja igual y con 0,1 mm. */
S.lluviaTorres = [{ k: 'siri', llueve: true, ini: H0(7), fin: H0(9), pico: 0.1,
                    hPico: H0(8), nHoras: 3, sueltas: false, soloSirimiri: true }];
ok('el sirimiri se llama sirimiri, que moja igual',
   /Sirimiri/.test(soloTexto(lineaAguaTorre('siri'))),
   soloTexto(lineaAguaTorre('siri')));

ok('la línea del agua NUNCA le dice qué hacer',
   ![cae, luego, su].some(t => /no se sube|no subas|espera|no abras|autoriz|debes/i.test(t)),
   'vosotros cifras: la hora de escampar es un dato, no una orden');

/* ── NO SE COMPARA UNA CIMA CONTRA UN VALLE ──────────────────────
   28-08-2026. Él, mirando la tabla de GERNIKA2:

     «en Oiz casi están cerca, pero GERNIKA2 está mucho más alto de
      donde está la unidad meteorológica; NO ES QUE SE HAYA PASADO,
      están en otra altitud, otro terreno»

   La app decía «nuestro pronóstico se pasó 8 km/h» comparando su
   emplazamiento a 266 m contra Arteaga, que está a 19. Doscientos
   cuarenta y siete metros de desnivel. Eso no mide el acierto del
   modelo: mide que son dos sitios.

   Y ya estaba medido en este proyecto que el error cambia de signo en
   ocho kilómetros —cabo de Matxitxako 22 cortos, valle de Forua 20 de
   más—. Con 247 m de desnivel, más de lo mismo. */
console.log('\n  El veredicto calla cuando la estación está a otra altura');

const desnivelCorta = (cota, altEst) => Math.abs(cota - altEst) >= 200;

ok('GERNIKA2 (266 m) contra Arteaga (19 m): NO se compara',
   desnivelCorta(266, 19), '247 m de desnivel');
ok('OIZ (1026 m) contra la estación del Oiz (998 m): SÍ se compara',
   !desnivelCorta(1026, 998), '28 m de desnivel');
ok('BERMEO (133 m) contra Almike (106 m): SÍ',
   !desnivelCorta(133, 106));
ok('SOLLUBEMENDI (675 m) contra Almike (106 m): NO',
   desnivelCorta(675, 106), '569 m: es la cima contra el pueblo');
ok('y da igual el signo: una estación 300 m MÁS ALTA tampoco vale',
   desnivelCorta(100, 400));
ok('justo en el listón de 200 ya no se compara',
   desnivelCorta(300, 100));
ok('con 199 todavía sí, pero con reservas',
   !desnivelCorta(299, 100));

/* ── QUÉ ME FRENA Y HASTA QUÉ HORA ───────────────────────────────
   28-08-2026. Es la pregunta que ha hecho CINCO veces con las mismas
   palabras y que la app no contestaba:

     «espero a que amaine» · «les digo esperar 2 horas» · «espero a que
     paren, si no me los como» · «iré media hora más tarde, o cuando el
     pronóstico me diga que baja la intensidad de los rayos, o viento, o
     un chaparrón muy fuerte»

   No decide «voy o no voy». Decide A QUÉ HORA VOY. Y sus tres frenos
   para SALIR —no para subir— son rayo, racha de 70 (vuelca el 4x4) y
   lluvia fuerte. Lo dijo él: «si hay unas rachas de 70 puedo volcar con
   el 4x4, espero a que amaine». */
console.log('\n  Qué le frena y hasta qué hora');

/* Se saca como global, igual que las demás: un `const` dentro de `eval`
   se queda encerrado en el eval y no lo ve la prueba. */
eval(sacar('const cuandoSePuede = (k) => {', '\n  };')
       .replace('const cuandoSePuede =', 'globalThis.cuandoSePuede ='));

const H0b = h => { const d = new Date(); d.setHours(h, 0, 0, 0); return d; };
const libre = { racha: 30, lluvia: 0, rayo: false, frenos: [] };

S.cuandoTorres = [{ k: 'ok', ahora: libre, libreDesde: libre, horasLibres: 9,
                    seEstropeaEn: null, esHoy: true }];
ok('si nada le frena, se dice y punto — y desde el 01-09, con su ámbito: llegar',
   /Nada te frena para llegar/.test(cuandoSePuede('ok')), cuandoSePuede('ok'));

S.cuandoTorres = [{ k: 'luego', ahora: libre, libreDesde: libre, horasLibres: 3,
                    seEstropeaEn: H0b(18), esHoy: true }];
ok('y si se va a estropear, a qué hora',
   /El camino se estropea a las <b>18:00/.test(cuandoSePuede('luego')), cuandoSePuede('luego'));

/* EL CASO SUYO: no puede salir ahora, ¿a qué hora sí? */
S.cuandoTorres = [{ k: 'espera',
  ahora: { racha: 78, lluvia: 0, rayo: false, frenos: ['racha'] },
  libreDesde: { t: H0b(19) }, horasLibres: 4, seEstropeaEn: null, esHoy: true }];
const esp = cuandoSePuede('espera');
ok('con racha de 78 dice que le frena la racha',
   /racha/.test(esp) && /78/.test(esp), esp);
ok('y dice POR QUÉ le frena una racha: vuelca el 4x4',
   /vuelca/.test(esp), 'no es que no suba: es que no llega');
ok('y le da LA HORA a la que deja de frenarle',
   /19:00/.test(esp), esp);
ok('y cuánto le dura la ventana, que cargar el grupo lleva rato',
   /4 h/.test(esp), esp);

/* UNA HORA SUELTA NO ES UNA VENTANA */
S.cuandoTorres = [{ k: 'corta',
  ahora: { racha: 80, lluvia: 0, rayo: false, frenos: ['racha'] },
  libreDesde: { t: H0b(15) }, horasLibres: 1, seEstropeaEn: null, esHoy: true }];
ok('una sola hora libre se dice que es UNA, no se vende como ventana',
   /solo esa hora/.test(cuandoSePuede('corta')), cuandoSePuede('corta'));

/* EL RAYO VA EN ROJO Y NO DEPENDE DE NADA MÁS */
S.cuandoTorres = [{ k: 'rayo',
  ahora: { racha: 20, lluvia: 0, rayo: true, frenos: ['rayo'] },
  libreDesde: null, horasLibres: 0, seEstropeaEn: null, esHoy: true }];
const conRayo = cuandoSePuede('rayo');
ok('el rayo se marca aparte de los demás frenos',
   /data-v="rayo"/.test(conRayo), conRayo);
ok('y si no se despeja en 24 h, se dice',
   /No se despeja/.test(conRayo), conRayo);

ok('en ninguno de los casos se le dice qué hacer',
   !['ok','luego','espera','corta','rayo'].some(() => false)
   && !/no salgas|no vayas|debes|espera a|no subas/i.test(esp + conRayo),
   'la hora es un dato; salir o no, lo decide él');

/* ══════════════════════════════════════════════════════════════════════
   Y LA VENTANA ES LA DEL DÍA QUE ESTÁ MIRANDO (21-09-2026)
   ──────────────────────────────────────────────────────────────────────
   `S.cuandoTorres` se calculaba SIEMPRE de ahora a dentro de 24 h,
   mirase el día que mirase. Al tocar la pestaña «MAR 23» la tarjeta
   cambiaba lluvia, racha y CAPE al día 23 y dejaba debajo, en verde,
   «Nada te frena para llegar» — que era de HOY. Dos verdades de ventanas
   distintas sin etiquetar, pegadas.

   Y le pega justo cuando más lo usa: programa las tareas de noche para
   el día siguiente, así que la pestaña que mira NO es la de hoy.

   El dueño de «qué día cubre el parte» ya existía —`ventanaParte()`— y
   estaba a ochenta líneas: el arreglo no se había aplicado a esta rama
   hermana. Igual que AL FILO.

   Estas pruebas MUEVEN EL CÁLCULO DE VERDAD: el bloque que construye
   `S.cuandoTorres` sale de app.js tal cual y se le dan horas de hoy y de
   mañana; después el texto se pinta con ESO, no con un objeto a mano.
   ══════════════════════════════════════════════════════════════════════ */
{
  const solo = (n) => new Function(
    'const g = {};' + sacarConst(n).replace('globalThis.', 'g.') + ` return g.${n};`)();
  const MT = solo('MODELOS_TORMENTA'), TA = solo('TOPE_ACCESO'), LF = solo('LLUVIA_FUERTE');

  const calcularCuando = new Function(
    'S', 'sitios', 'arr', 'v_', 'desde', 'finVentana', 'has', 'key',
    'MODELOS_TORMENTA', 'isStormCode', 'CAPE_COMBINACION', 'TOPE_ACCESO', 'LLUVIA_FUERTE',
    sacar('  S.cuandoTorres = sitios.map((p, n) => {', '\n  }).filter(Boolean);')
    + '\n  return S.cuandoTorres;');

  /* Reloj clavado a las 10:00 de hoy, como el resto del fichero. */
  const T10 = _hoy10.getTime();
  const dd  = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const HOY = dd(_hoy10), MAN = dd(new Date(T10 + 24 * 3600e3));

  /* 48 horas: hoy tranquilo hasta las 18:00, y MAÑANA cerrado de 00 a 08.
     Con la ventana vieja (ahora → +24 h) la pestaña de mañana veía las
     horas buenas de hoy y cantaba verde. */
  const time = [], gust = [], lluv = [], cape = [], cin = [], code = [];
  for (const dia of [HOY, MAN]) for (let h = 0; h < 24; h++) {
    time.push(`${dia}T${String(h).padStart(2, '0')}:00`);
    const cierra = (dia === HOY && h >= 18) || (dia === MAN && h < 9);
    gust.push(cierra ? 80 : 30); lluv.push(0); cape.push(100); cin.push(200); code.push(3);
  }
  const H = { time,
    'wind_gusts_10m_ecmwf_ifs025': gust, 'precipitation_ecmwf_ifs025': lluv,
    'cape_ecmwf_ifs025': cape, 'convective_inhibition_ecmwf_ifs025': cin,
    'weather_code_ecmwf_ifs025': code };
  const SITIO = [{ lat: 43.412976, lon: -2.718316, name: 'BI BERMEO' }];
  const K = globalThis.key(SITIO[0]);

  const paraElDia = sel => {
    const antes = S.parteSel; S.parteSel = sel;
    const v_ = ventanaParte(T10);
    S.parteSel = antes;
    return calcularCuando(S, SITIO, [{ hourly: H }], v_, v_.desde, v_.hasta,
      globalThis.has, globalThis.key, MT, globalThis.isStormCode,
      globalThis.CAPE_COMBINACION, TA, LF);
  };

  /* ── HOY ─────────────────────────────────────────────────────────── */
  S.cuandoTorres = paraElDia(0);
  const hoy = cuandoSePuede(K);
  ok('en la pestaña de HOY la ventana empieza ahora y la frase sigue siendo la suya',
     /Nada te frena para llegar/.test(hoy) && /se estropea a las <b>18:00/.test(hoy), hoy);
  ok('y la ventana de hoy NO se mete en el día siguiente',
     S.cuandoTorres[0].esHoy === true
     && S.cuandoTorres[0].ahora.t.getHours() === 9,   // la hora en curso entra entera
     JSON.stringify(S.cuandoTorres[0]?.ahora?.t));

  /* ── MAÑANA: ESTO ES LO QUE ESTABA MAL ───────────────────────────── */
  S.cuandoTorres = paraElDia(1);
  const man = cuandoSePuede(K);
  ok('en la pestaña de MAÑANA la ventana es el día entero, de 00:00 a 23:59',
     S.cuandoTorres[0].esHoy === false && S.cuandoTorres[0].nFrenadas === 9,
     String(S.cuandoTorres[0]?.nFrenadas));
  ok('y dice lo que frena ESE día, con sus horas y su hueco',
     /Para llegar te frena/.test(man) && /9 h<\/b> del día/.test(man)
     && /Se despeja a las <b>09:00/.test(man) && /15 h/.test(man), man);
  ok('y ya NO canta el verde de hoy en la pestaña de mañana',
     !/Nada te frena para llegar/.test(man) && !/18:00/.test(man),
     'esto es EXACTAMENTE lo que hacía la app hasta el 21-09-2026: mirabas mañana y leías hoy');

  /* Un día limpio entero sí se dice, y se dice que es el día entero. */
  const limpio = { ...H, 'wind_gusts_10m_ecmwf_ifs025': gust.map(() => 30) };
  S.parteSel = 1;
  const v1 = ventanaParte(T10); S.parteSel = 0;
  S.cuandoTorres = calcularCuando(S, SITIO, [{ hourly: limpio }], v1, v1.desde, v1.hasta,
    globalThis.has, globalThis.key, MT, globalThis.isStormCode,
    globalThis.CAPE_COMBINACION, TA, LF);
  ok('un día entero sin frenos se dice como lo que es: todo el día',
     /Nada te frena para llegar<\/b> en todo el día/.test(cuandoSePuede(K)), cuandoSePuede(K));
}

/* ── RESULTADO ──────────────────────────────────────────────────── */
/* ── CADA APARATO CON SU NOMBRE ──────────────────────────────────
   Suyo, 29-08-2026: «solo tengo Ulefone, iPhone e iMac» · «2 terminales,
   un PC». Los tres estaban apuntados como «móvil (instalada)», los tres
   igual, incluido el ordenador de sobremesa. El día que uno deje de
   recibir avisos hay que poder ver CUÁL sin adivinarlo. */
console.log('\n  El nombre de cada aparato');
eval(sacar('function nombreDeAparato(ua, plat, touch, instalada) {'));

const UA = {
  ulefone: 'Mozilla/5.0 (Linux; Android 13; Ulefone Armor) Chrome/120 Mobile Safari/537.36',
  iphone:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1',
  macCh:   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  macSa:   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17 Safari/605.1.15',
};

ok('su Ulefone sale como Android',
   nombreDeAparato(UA.ulefone, '', 0, true) === 'Android · instalada');
ok('su iPhone sale como iPhone',
   nombreDeAparato(UA.iphone, '', 0, true) === 'iPhone · instalada');
ok('su iMac ya no se llama «móvil»',
   !/móvil/.test(nombreDeAparato(UA.macCh, 'MacIntel', 0, false)));

/* Los dos navegadores del MISMO ordenador son dos suscripciones. Si los
   dos se llamaran igual, no habría forma de saber cuál está muerto. */
ok('y Chrome y Safari del mismo Mac se distinguen',
   nombreDeAparato(UA.macCh, 'MacIntel', 0, false)
   !== nombreDeAparato(UA.macSa, 'MacIntel', 0, false),
   nombreDeAparato(UA.macCh, 'MacIntel', 0, false));

/* En iPhone, instalada o en pestaña NO es lo mismo: en pestaña no hay
   avisos. Tiene que verse en la etiqueta. */
ok('instalada y en pestaña se distinguen, que en iPhone es la diferencia entre avisar y no',
   nombreDeAparato(UA.iphone, '', 0, true) !== nombreDeAparato(UA.iphone, '', 0, false));
ok('un aparato desconocido no se inventa un nombre',
   /^aparato/.test(nombreDeAparato('cosa rara', '', 0, false)));

/* Y cómo se le habla a cada uno. Suyo, 29-08: «en el iMac ponía dar de
   alta a este móvil» · «y no es un móvil». Si la app le llama móvil a su
   ordenador, lo siguiente que se pregunta es si sabe con qué habla. */
eval(sacar('function comoLlamarlo(n) {'));
eval(sacar('function aparatosTxt(n) {'));
const comoSeLeHabla = (ua, plat, inst) =>
  comoLlamarlo(nombreDeAparato(ua, plat, 0, inst));
ok('a su iMac NO se le llama móvil',
   comoSeLeHabla(UA.macCh, 'MacIntel', false) === 'este Mac',
   comoSeLeHabla(UA.macCh, 'MacIntel', false));
ok('a su iPhone se le llama iPhone',
   comoSeLeHabla(UA.iphone, '', true) === 'este iPhone');
ok('y al Ulefone sí, que ese sí lo es',
   comoSeLeHabla(UA.ulefone, '', true) === 'este móvil');
ok('el contador dice «aparatos», que tres no son tres móviles',
   aparatosTxt(3) === '3 aparatos activados' && aparatosTxt(1) === '1 aparato activado');

/* ── EL BOCHORNO ─────────────────────────────────────────────────
   Suyo, 29-08-2026: «poner dato de visibilidad, humedad y punto de rocío
   a 2 m, con eso se sabe si hay bochorno». Se lee por el ROCÍO, no por la
   humedad relativa: 90 % a 8 grados no agobia y a 22 sí. */
console.log('\n  El bochorno, por el punto de rocío');
eval(sacar('function comoSeSiente(rocio) {'));

ok('15° es cómodo', comoSeSiente(15) === 'cómodo');
ok('17° ya se nota', comoSeSiente(17) === 'se nota');
ok('19° es bochorno', comoSeSiente(19) === 'bochorno');
ok('22° es agobiante', comoSeSiente(22) === 'agobiante');
ok('sin dato no se inventa una palabra', comoSeSiente(null) === '');

/* MEDIDO en Bermeo el 29-08-2026: HARMONIE 16,5 · ICON 16,1 · AROME 15,9
   · GEM 15,7 · ARPEGE 15,1 · ECMWF 14,9 · GFS 12,0. Cuatro grados y medio
   de abanico, y cruza el listón: dos dicen «se nota» y cinco «cómodo».
   Ese desacuerdo es justo lo que pidió poder ver. */
const hoyBermeo = [16.5, 16.1, 15.9, 15.7, 15.1, 14.9, 12.0];
ok('BERMEO 29-08: los siete NO dicen lo mismo, y por eso hay que enseñarlos',
   new Set(hoyBermeo.map(comoSeSiente)).size === 2,
   [...new Set(hoyBermeo.map(comoSeSiente))].join(' / '));
ok('y el listón de avisar es 18, no la media',
   comoSeSiente(17.9) !== 'bochorno' && comoSeSiente(18) === 'bochorno');

/* ── LA FOTO NO PUEDE SALIR SOLA ───────────────────────────────────────
   Suyo, 29-08-2026: *«en el momento que hago la foto la envía sola, no le
   doy ni a enviar… entonces no sé si está pinchada la ubicación o no. Ese
   es el fallo»*.

   El daño no es la prisa: es que sin ubicación viva la nota sale con las
   coordenadas del emplazamiento abierto y el servidor congela los CINCO
   modelos para ESE punto. Ese día, a las 12:56, una foto de Axpe-San
   Bartolomé quedó guardada contra Bermeo, a 4,5 km (racha 22,7 en vez de
   28,8). Estuvo a punto de apuntarse en el cuaderno como fallo de la app.

   Esto se comprueba sobre el CÓDIGO porque no hay forma de probarlo con
   una función suelta: el fallo vivía en una línea de enganche de un
   `onchange`. Si alguien vuelve a poner ahí `mandarFoto`, no publica. */
{
  grupo('La foto se confirma antes de salir');

  ok('elegir una foto la PREPARA, no la manda',
     /inp\.onchange\s*=\s*\(\)\s*=>\s*\{[^}]*prepararFoto\(/.test(src),
     'el 29-08 esa línea llamaba a mandarFoto() y la foto salía sola');

  ok('y ese enganche ya NO llama a mandarFoto',
     !/inp\.onchange\s*=\s*\(\)\s*=>\s*\{[^}]*mandarFoto\(/.test(src));

  ok('mandarFoto ya no recibe el fichero: sale de la que está en espera',
     /async function mandarFoto\(\)/.test(src),
     'si vuelve a aceptar un fichero es que alguien la llama saltándose la confirmación');

  ok('sin foto preparada, mandarFoto no manda nada',
     /if \(!fotoEnEspera\)/.test(src));

  ok('hay un botón de enviar la foto, y es el que la manda',
     /#btnCampoEnviarFoto/.test(src) && /bEnv\.onclick = \(\) => mandarFoto\(\)/.test(src));

  /* Los tres estados del aviso de ubicación. El que importa es el de
     enmedio: antes NO existía y por eso el 12:56 se coló. */
  ok('la previa dice cuándo VA con su ubicación',
     /Va con tu ubicación/.test(src));
  ok('y dice a gritos cuándo NO la lleva',
     /NO lleva tu ubicación/.test(src));
  ok('y distingue la que ha caducado de la que nunca cogió',
     /más de 5 minutos/.test(src) && /const caducada = !!campoUbi/.test(src));

  ok('coger la ubicación repinta la previa al momento',
     (src.match(/pintarPrevia\(\)/g) || []).length >= 3,
     'tiene que llamarse al preparar, al coger sitio y al mandar texto');

  /* Y AHORA LO QUE DE VERDAD IMPORTA: qué LEE él en el aviso.
     Las de arriba miran el código; estas ejecutan `pintarPrevia` del
     app.js real con un DOM de mentira y comprueban la frase. Un aviso
     que existe pero no nombra el sitio no le sirve de nada en el monte.

     Se hace así porque el panel del navegador no se puede levantar en
     una sesión desatendida. Verificación bloqueada, otra vía. */
  const caja = { hidden: false };
  const parrafo = { className: '', innerHTML: '' };
  globalThis.$ = sel => sel === '#campoPreviaUbi' ? parrafo
                      : sel === '#campoPrevia' ? caja : null;
  globalThis.S = { place: { name: 'BI BERMEO', lat: 43.412976, lon: -2.718316 } };
  globalThis.campoUbi = null;
  globalThis.fotoEnEspera = { datos: '', kb: 274 };
  globalThis.ubiVigente = () => globalThis._ubi;
  eval(sacar('function pintarPrevia() {'));

  /* 1. Con su GPS puesto: verde y con las coordenadas a la vista. */
  globalThis._ubi = { lat: 43.37567, lon: -2.69682, metros: 12 };
  pintarPrevia();
  ok('con ubicación: lo dice en verde y enseña las coordenadas',
     parrafo.className === 'note ok'
     && /Va con tu ubicación/.test(parrafo.innerHTML)
     && parrafo.innerHTML.includes('43.37567')
     && parrafo.innerHTML.includes('±12 m'),
     parrafo.innerHTML);

  /* 2. EL CASO DEL 12:56: nunca cogió la ubicación. Tiene que NOMBRAR el
        emplazamiento — «no lleva tu ubicación» a secas no dice contra qué
        se va a guardar. */
  globalThis._ubi = null;
  globalThis.campoUbi = null;
  pintarPrevia();
  ok('SIN ubicación: avisa en ámbar y NOMBRA el emplazamiento',
     parrafo.className === 'note warn'
     && /NO lleva tu ubicación/.test(parrafo.innerHTML)
     && parrafo.innerHTML.includes('BI BERMEO'),
     parrafo.innerHTML);
  ok('y no le dice que la caducada si nunca la cogió',
     !/más de 5 minutos/.test(parrafo.innerHTML), parrafo.innerHTML);

  /* 3. La cogió y se le pasó de hora: eso SÍ hay que distinguirlo, que
        es el caso en que él cree que la lleva puesta. */
  globalThis.campoUbi = { lat: 43.3, lon: -2.6, metros: 9, t: 0 };
  pintarPrevia();
  ok('caducada: se le dice que la que cogió ya no vale',
     /más de 5 minutos/.test(parrafo.innerHTML), parrafo.innerHTML);

  /* Sin emplazamiento elegido no se inventa un nombre. */
  globalThis.S = { place: null };
  globalThis.campoUbi = null;
  pintarPrevia();
  ok('sin emplazamiento elegido no se inventa un nombre',
     /el que tienes elegido/.test(parrafo.innerHTML), parrafo.innerHTML);

  /* NUNCA PUEDE PARECER QUE YA SE MANDÓ.
     Suyo, 29-08-2026, con la confirmación ya publicada: «al añadir la
     ubicación se envía sola… pinchas y ya se envía sin darle yo». Y NO se
     enviaba —comprobado en el servidor, cero fotos—: lo parecía, porque el
     aviso pasaba de ámbar a verde y el foco saltaba al cuadro de texto,
     que en el móvil sube el teclado y le quita la foto de la pantalla.
     Que la app le haga creer que ha mandado algo que no ha mandado es el
     mismo fallo que el silencio que parece respuesta, por el otro lado. */
  for (const [caso, ubi] of [['con ubicación', { lat: 43.3, lon: -2.6, metros: 8 }],
                             ['sin ubicación', null]]) {
    globalThis._ubi = ubi;
    globalThis.campoUbi = null;
    pintarPrevia();
    ok(`${caso}: dice que TODAVÍA está sin mandar`,
       /[Tt]odavía sin mandar/.test(parrafo.innerHTML), parrafo.innerHTML);
  }

  /* El foco: con foto esperando se le lleva la FOTO a la vista; sin ella,
     el cursor al cuadro de texto, que ahí sí es lo correcto. Se comprueba
     que las dos ramas existen y que `t.focus()` está en una sola. */
  ok('al coger el sitio con foto esperando se le lleva la foto a la vista',
     /if \(fotoEnEspera\)[\s\S]{0,500}?scrollIntoView/.test(src));
  {
    /* Solo dentro de `ponerDonde`: en `mandarCampo` hay otro `t.focus()`
       legítimo, el de «falta que escribas qué ves». */
    /* Sin los comentarios: el de arriba NOMBRA `t.focus()` al explicar por
       qué no puede saltar con una foto esperando, y contarlo daría dos. */
    const cuerpo = sacar('function ponerDonde() {').replace(/\/\*[\s\S]*?\*\//g, '');
    ok('y el foco al cuadro de texto solo va en la rama SIN foto',
       (cuerpo.match(/t\.focus\(\)/g) || []).length === 1
       && /\} else \{[\s\S]{0,400}?t\.focus\(\)/.test(cuerpo),
       'si salta el foco con la foto esperando, el teclado se la tapa y cree que ya salió');
  }

  ok('y se le dice que la foto sigue ahí sin mandar',
     /La foto sigue aquí SIN mandar/.test(src));

  /* Suyo, 29-08-2026: «¿hay algún sitio donde pueda poner un comentario, o
     tengo que enviar la foto y luego el comentario?». Ya funcionaba y no se
     decía. Una función que existe y no se ve es una función que no existe. */
  ok('el cuadro de texto BAJA debajo de la foto, no se explica dónde está',
     /function bajarCuadroALaFoto\(\)[\s\S]{0,400}?insertBefore\(t, btns\)/.test(src),
     'primero se le puso un renglón diciendo «escríbelo arriba» y dijo que era lioso');
  ok('y vuelve a su sitio al mandar o quitar la foto',
     /function subirCuadroASuSitio\(\)[\s\S]{0,300}?MOVIDO\.padre\.insertBefore/.test(src)
     && /subirCuadroASuSitio\(\);[\s\S]{0,200}?campoPrevia/.test(src));
  ok('se MUEVE el mismo cuadro, no se crea un segundo',
     (src.match(/id="campoTexto"/g) || []).length === 0
     && (fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
         .match(/id="campoTexto"/g) || []).length === 1,
     'dos cuadros serían dos textos posibles y un sitio donde perder lo escrito');
  ok('y el texto del cuadro se manda de verdad dentro de la nota',
     /texto: \(\$\('#campoTexto'\)\.value \|\| ''\)\.trim\(\)/.test(src));

  /* DOS BOTONES «ENVIAR» A LA VEZ, NO. Suyo, 29-08-2026: «el problema está
     que hay 2 enviar». Con una foto esperando salían dos azules. */
  ok('con foto esperando, el «Enviar» de arriba manda la foto',
     /async function mandarCampo\(\)[\s\S]{0,400}?if \(fotoEnEspera\) return mandarFoto\(\)/
       .test(src),
     'si no, hay dos botones que hacen cosas distintas y hay que adivinar');
  /* Suyo, al ver el primer intento: «arriba enviar y abajo enviar foto…
     como 2 pantallas». No bastaba con ponerlo gris: la fila entera se
     esconde, para que no haya dos sitios donde mandar. */
  ok('con foto esperando se esconde la fila de botones de arriba',
     /function pintarBotonEnviar\(\)[\s\S]{0,300}?#campoBotones[\s\S]{0,120}?hidden = !!fotoEnEspera/
       .test(src));
  ok('y esa fila existe con su id en el html',
     /id="campoBotones"/.test(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')));
  ok('al quitar o mandar la foto, el botón vuelve a su sitio',
     (src.match(/pintarBotonEnviar\(\)/g) || []).length >= 3,
     'tiene que llamarse al preparar, al quitar y en la declaración');

  /* Y con la caja cerrada no escribe nada: si no, dejaría un aviso
     colgado después de mandar la foto. */
  caja.hidden = true;
  parrafo.innerHTML = 'SIN TOCAR';
  pintarPrevia();
  ok('con la previa cerrada no deja ningún aviso colgado',
     parrafo.innerHTML === 'SIN TOCAR');

  delete globalThis.$; delete globalThis.S; delete globalThis.campoUbi;
  delete globalThis.fotoEnEspera; delete globalThis.ubiVigente;
}

/* ── LA LETRA SE TIENE QUE PODER LEER ──────────────────────────────────
   Suyo, 29-08-2026: *«la letra apenas se ve, está oscura»*, con el hilo de
   notas en pantalla. No era impresión: `--faint` daba **3,65:1** sobre el
   fondo de tarjeta, por debajo del 4,5:1 que pide el texto normal. Y
   dentro de una nota sin contestar —que se pintaba al 75 %— se quedaba en
   **2,60:1**, ni el listón de texto grande.

   Esto se mide, no se mira: un gris «que parece que se lee» en el Mac a
   las 10 de la noche no se lee en un móvil al sol en el monte. */
{
  grupo('La letra se puede leer');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  const canal = c => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  const contraste = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mezcla = (f, b, a) => f.map((c, i) => c * a + b[i] * (1 - a));

  const tono = n => (html.match(new RegExp(`--${n}:(#[0-9a-f]{6})`, 'i')) || [])[1];
  /* El fondo REAL sobre el que cae el texto: la tarjeta es translúcida
     (--card rgba(19,27,47,.66)) y queda más clara que --bg. Medir contra
     --bg pelado daría un contraste mejor del que hay. */
  const fondo = mezcla(hex('#131b2f'), hex(tono('bg')), 0.66);

  for (const [n, minimo] of [['ink', 7], ['dim', 4.5], ['faint', 4.5]]) {
    const c = contraste(hex(tono(n)), fondo);
    ok(`--${n} llega al ${minimo}:1 sobre la tarjeta`,
       c >= minimo, `${tono(n)} da ${c.toFixed(2)}:1`);
  }

  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  /* El sentido estaba del revés: se apagaba justo lo que sigue pendiente. */
  ok('lo SIN CONTESTAR no se atenúa con opacity',
     !/\.hn--sin\{[^}]*opacity/.test(css.replace(/\s/g, '')),
     'el .75 dejaba la fecha y el sitio en 2,60:1');
  ok('y se marca de otra forma, que si no no se distingue',
     /\.hn--sin\{[\s\S]{0,220}?border-left/.test(css));
}

/* ── EL DRON ─────────────────────────────────────────────────────
   Suyo, 29-08-2026: «me gusta volar mis drones de DJI» · «DJI Mini 3
   Pro» · «Mavic 2 Pro» · «los fabricantes pueden ponerlo, está bien».
   El listón es del FABRICANTE: 10,7 m/s = nivel 5 = 38 km/h, y vale para
   los dos. Y la altura es 120 m, el techo legal de vuelo — que la app ya
   calculaba desde antes, para las torres. */
console.log('\n  El dron, en el perfil de viento');
eval(sacarConst('DRON_TOPE'));
eval(sacarConst('DRON_ALTURA'));
eval(sacar('function lineaDron(rows) {'));
globalThis.wtxt = (v) => `${Math.round(v)} km/h`;
/* Desde el 29-08 la línea del dron dice de QUIÉN es el nivel de 120 m,
   porque AROME no lo publica y viene prestado. Necesita mirar el estado. */
globalThis.S = globalThis.S || {};
S.data = S.data || {};
if (typeof COMPARAR === 'undefined') globalThis.COMPARAR = [];
if (typeof MODELS === 'undefined') globalThis.MODELS = [];

ok('el tope es el de DJI, 38 km/h, no uno inventado', DRON_TOPE === 38);
ok('y se lee a 120 m, el techo de vuelo, no a 10 m del suelo', DRON_ALTURA === 120);

const filas = h => [{ h: 10, v: 25 }, { h: 80, v: 30 }, { h: 120, v: h }, { h: 180, v: 40 }];
const conViento = lineaDron(filas(12));
ok('con poco viento da la cifra y el tope, sin decirle qué hacer',
   /120 m/.test(conViento) && /38 km\/h/.test(conViento) && !/no vueles|espera|puedes volar/i.test(conViento));
ok('y no marca nada si está por debajo', !/data-ojo/.test(conViento));
ok('por encima del tope SÍ se marca', /data-ojo="1"/.test(lineaDron(filas(45))));
ok('justo en el tope ya cuenta', /data-ojo="1"/.test(lineaDron(filas(38))));
ok('siempre dice que ese tope es «se sostiene», no «se vuela bien»',
   /se sostiene/.test(conViento));
ok('sin dato a 120 m no se inventa una línea', lineaDron([{ h: 10, v: 20 }]) === '');

/* ── LA MAR EN LA PORTADA ────────────────────────────────────────
   Suyo, 29-08-2026: «abajo de Sol y aire hay que poner oleaje etc» ·
   «hay sitio» · «datos, datos, lo que digo siempre». Hace surf y kayak,
   y «Ahora» es la pestaña que abre por defecto. */
console.log('\n  La mar, en la portada');
globalThis.proximasMareas = globalThis.proximasMareas || (() => []);   // la tabla no está en el banco
/* 14-09-2026: la portada del mar imprime con la unidad de la respuesta. */
try { eval(sacarConst('UNIDADES_MAR')); } catch (e) { console.log(`  (sin UNIDADES_MAR: ${e.message})`); }
for (const f of ['unidadMar', 'avisoUnidadesMar', 'notaUnidadesMar']) { try { eval(sacar(`function ${f}(`)); } catch (e) { console.log(`  (sin ${f}: ${e.message})`); } }
/* 25-09-2026: la portada ya lee la mar de AHORA con estos dos ayudantes. */
eval(sacar('function iHoraMar(tiempos, ahora = Date.now()) {'));
eval(sacar('function picoOleaje24hCon(alturas, tiempos, ahora = Date.now()) {')); eval(sacar('function picoOleaje24h(alturas, tiempos, ahora = Date.now()) {'));
eval(sacar('function fraseMarDeViento(wv, sw) {'));   // una frase para Ahora y Mar (25-09-2026)
try { eval(sacar('function nombreDeDia(d) {')); } catch {}
eval(sacar('function aLasHora(t, ahora = Date.now()) {'));   // «Sube a X m a las HH:00» (25-09-2026)
eval(sacar('function pintarMarAhora(dt) {'));
/* Las de la app que usa por dentro. `show` y `rumboLargo` se sacan tal
   cual para que la prueba mire el texto de verdad, no una imitación. */
eval(sacar('function show(v, unit'));
if (typeof rumboLargo !== 'function') globalThis.rumboLargo = () => 'noroeste';
if (typeof nd === 'undefined') globalThis.nd = '<span class="faint">sin dato</span>';

const marDe = (ola, per, agua) => {
  let salida = '';
  globalThis.$ = () => ({ set innerHTML(v) { salida = v; }, set hidden(v) {} });
  globalThis.S = { data: { mar: { current: {
    wave_height: ola, wave_period: per, sea_surface_temperature: agua, wave_direction: 315 },
    hourly: { wave_height: [ola], swell_wave_height: [1.6] } } } };
  pintarMarAhora((k, v, s2) => `[${k}|${v}|${s2 || ''}]`);
  return salida;
};

/* MEDIDO en Bermeo el 29-08: ola 1,44 m con periodo 8,1 s. */
const marBermeo = marDe(1.44, 8.1, 23.6);
ok('da la altura y el periodo, que son dos datos distintos',
   /Altura de ola/.test(marBermeo) && /Periodo/.test(marBermeo));
ok('y la temperatura del agua, que la pidió él',
   /Temp\. del agua/.test(marBermeo));
ok('8,1 s se lee como mar de fondo', /mar de fondo/.test(marBermeo));

/* La misma altura con periodo corto NO es la misma mar. Es justo lo que
   distingue un día de surf de uno de chapoteo. */
const picada = marDe(1.44, 4.3, 26.4);
ok('la MISMA altura con 4,3 s se lee distinto: picada',
   /corta y picada/.test(picada) && !/mar de fondo/.test(picada));

ok('sin dato de mar no se pinta nada, ni un hueco',
   marDe(null, null, null) === '');
ok('y no le dice qué hacer: ni «buen día de surf» ni nada parecido',
   !/surf|no salgas|puedes|buen día/i.test(marBermeo));

/* ── HASTA DÓNDE LLEGA EL MODELO ─────────────────────────────────
   Al poner AROME HD por defecto (decisión suya del 29-08: «el automático
   va fallando, así que fuera»), aparece un problema nuevo: AROME solo
   llega a ~48 h. El Automático lo tapaba cambiando de modelo SIN
   DECIRLO, que es justo lo que él quitó. Aquí se dice. */
console.log('\n  Hasta dónde llega el modelo');
eval(sacar('function hastaDondeLlega(fc) {'));

/* Las horas van en LOCAL y sin Z, que es como las manda Open-Meteo con
   `timezone=auto`. Generarlas en UTC desplazaba la cuenta dos horas: el
   fixture mentía, no la app. */
const conHoras = n => {
  const t = [], g = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() + i * 3600e3);
    t.push(new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    g.push(10);
  }
  return { hourly: { time: t, wind_gusts_10m: g } };
};
ok('un modelo de 48 h se canta', hastaDondeLlega(conHoras(48)) !== null);
ok('y dice cuántas horas le quedan',
   hastaDondeLlega(conHoras(48)).horas >= 46 && hastaDondeLlega(conHoras(48)).horas <= 48);
ok('uno de 10 días NO se canta: ahí no hay nada que avisar',
   hastaDondeLlega(conHoras(240)) === null);
ok('sin datos no se inventa un aviso', hastaDondeLlega({}) === null);

/* Y lo que no alcanza, lo rellena otro — idea suya: «si solo llega a 2
   días, el resto mete el que llega, pero en 2 días tenemos lo bueno». */
eval(sacarConst('RELLENO_LARGO'));
ok('el relleno es ECMWF: llega a 10 días y es global',
   RELLENO_LARGO === 'ecmwf_ifs025');

/* CADA CAMPO, AL QUE DE VERDAD LO PUBLICA. Medido el 29-08 en Bermeo:
   el índice de elevación **solo lo da GFS** —ICON no—, y pedírselo a
   ICON hacía que la app dijera «de ICON» y enseñara «sin dato». */
/* Estas dos miraban la tabla a mano. Desde el 30-08-2026 el reparto lo
   calcula `quienLoMide()` con la cobertura medida, y se comprueba abajo
   contra `data/cobertura.json` — que es más fuerte: prueba el mecanismo,
   no una línea escrita. */
ok('el reparto se calcula, no se escribe',
   /const om = quienLoMide\(k, cargado\);/.test(src)
   && /await repartirConRespaldo\(faltan, cargado, pedirYPegar\)/.test(src));

/* ── LA CAÍDA NO PUEDE CAMBIARLE EL MODELO PARA SIEMPRE ──────────
   Fallo mío del 29-08, cazado en el repaso antes de que lo probara en el
   monte. La caída a ICON hacía `LS.set('model', ...)`: iba a Miami, se
   le pasaba a ICON y **se quedaba así al volver a Bermeo**. Y saltaba con
   cualquier error de red, no solo con «no cubre este punto».

   Es «cambia solo y sin avisar», que es justo por lo que él quitó hoy el
   Automático. */
ok('la caída a ICON NO guarda el cambio',
   !/modeloUsado = 'icon';[\s\S]{0,120}LS\.set\('model'/.test(src),
   'su elección no se toca: ICON solo para esa carga');
ok('y la ficha enseña el que DE VERDAD sirvió los números',
   /f\._modelo = modeloUsado;/.test(src) && !/f\._modelo = S\.model;/.test(src));
/* El nombre ya no va escrito: sale del primero de ORDEN_FIABLE que
   llegue fuera de Europa, medido en Miami. Lo que se comprueba es que
   siga diciendo «solo aquí», que es lo que importa: que su elección no
   se le queda cambiada. */
ok('el toast dice que es solo aquí, no para siempre',
   /enseñando \$\{nRebote\} solo aquí/.test(src));
ok('y el rebote se calcula con lo medido, no escrito a mano',
   /ORDEN_FIABLE\.find\(om => om !== M\.om && GLOBALES\.includes\(om\)\)/.test(src));

/* ── DENTRO DE LA CAJA PERO FUERA DE LA MALLA (17-09-2026) ─────────
   Trieste: AROME HD contesta 200 con la temperatura, la lluvia, la
   racha y el CAPE todos nulos —la caja lo incluye, la malla no— y el
   `catch` no saltaba. La ficha salía en «—» con AROME de dueño y solo
   los chips de los otros tenían números. Un 200 sin una sola
   temperatura en diez días es «no cubre el punto» y rebota igual. */
/* ── SEGUIRLE SIN QUE TOQUE NADA (18-09-2026) ───────────────────────
   Suyo, desde el iPhone: «¿por qué tengo que darle a ubicación cada vez
   que me muevo de sitio?». Si el sitio puesto salió del GPS, al abrir y
   al volver a pantalla se vuelve a mirar dónde está y, si se ha movido
   más de un kilómetro, se cambia con un toast. Un sitio elegido por
   nombre no se toca nunca. */
/* ── LAS HORAS EN EL MÓVIL, SIN COLUMNAS VACÍAS (18-09-2026, 01:51) ──
   Suyo, desde el iPhone: «se ve raro en Horas, vertical, fino» · «¿en
   agenda mejor?». Tarjetas de 150 px en pantalla estrecha, cada una con
   su altura, y la racha en una línea. */
/* ── NINGÚN TEXTO DENTRO DE UN SVG ESTIRADO (18-09-2026, 01:57) ──────
   Suyo, desde el iPhone: «en Mar ya no sale el tiempo» · «ni en Horas».
   Las horas del eje, el «ahora» y las P/B de las mareas iban dentro del
   SVG con preserveAspectRatio="none" y salían aplastadas. Van en HTML. */
/* ── LA PORTADA TAMBIÉN EN HORAS, 10 DÍAS Y MAR EN EL MÓVIL (18-09-2026) ──
   Suyo: «en Mar ya no sale el tiempo» · «ni en Horas» · «sigo sin ver en
   10 días el mapa arriba» · «en el Mac lo veo». */
/* ── LO MEDIDO Y LO CALCULADO NO SE MEZCLAN (18-09-2026, 11:45) ──────
   Suyo: «16 grados de media en Bermeo y Bilbao» con la app en 19. El 19
   era el `current` del modelo y ponía «Medido». Ahora dice de qué modelo
   es, y debajo va la estación AEMET más cercana, medida de verdad. */
/* ── DE DÓNDE LLEGA EL VIENTO, ARRIBA (18-09-2026, 20:37) ───────────
   Suyo, en Baquio: «falta dirección de viento poner» · «lo quiero arriba
   también» · «si no tengo que desplazarme hasta abajo». */
/* ── OLEAJE POR HORAS (19-09-2026) ───────────────────────────────────
   Suyo, con regatas a las 18:00: «¿dónde miro qué oleaje va a haber en
   Bermeo sobre las 18 h? en Mar solo pone lo de ahora, ¿no?». */
grupo('Mar: una tarjeta por hora con ola, rumbo, periodo, mar de fondo, mar de viento y viento a 10 m');
{
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('se piden al modelo marino el rumbo de la ola y el mar de viento por horas',
     /hourly: 'sea_level_height_msl,wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,wind_wave_height'/.test(src));
  ok('la tira #waveHours existe y se pinta desde la hora en curso con los números tal cual',
     /id="waveHours"/.test(html)
     && /function pintarOleajeHoras\(M, iAhora\)/.test(src)
     && /pintarOleajeHoras\(M, iAhora\);/.test(src)
     && /<span>🌊 \$\{has\(dirO\) \? 'del ' \+ esc\(rumboLargo\(dirO\)\) : 'rumbo sin dato'\}<\/span>/.test(src)
     && /periodo \$\{has\(per\) \? mTxt\(per\) \+ ' s' : '—'\}/.test(src)
     && /mar de viento \$\{has\(mv\) \? mTxt\(mv\) \+ ' m' : '—'\}/.test(src));
  ok('el viento de cada hora sale del modelo de tiempo a 10 m, con rumbo y racha, y sin semáforo',
     /wtxt\(h\.w10 \?\? h\.wind, true\)\}\$\{has\(h\.dir\) \? ' del ' \+ esc\(rumboLargo\(h\.dir\)\) : ''\}/.test(src)
     && /Racha \$\{wtxt\(h\.gust10 \?\? h\.gust, true\)\}<small> a 10 m<\/small>/.test(src)
     && !/hcard hcard--mar" data-s=/.test(src));
  ok('tierra adentro la tira se vacía, no se queda con el mar de otro sitio',
     /\$\('#waveGraph'\)\.innerHTML = ''; if \(\$\('#waveHours'\)\) \$\('#waveHours'\)\.innerHTML = '';/.test(src));
}

grupo('El viento y su rumbo salen arriba: portada, franjas y lo medido por AEMET');
{
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la portada lleva viento a 10 m, rumbo largo y racha del current del modelo',
     /id="nowViento"/.test(html)
     && /const el = \$\('#nowViento'\);/.test(src)
     && /Viento <b>\$\{wtxt\(v, true\)\}<\/b>\$\{has\(d\) \? ` del <b>\$\{esc\(rumboLargo\(d\)\)\}<\/b> \(\$\{Math\.round\(d\)\}°\)` : ''\}/.test(src));
  ok('cada franja dice de dónde llega el viento: el rumbo de la hora de más viento, literal del modelo',
     /const hMax = vs\.length \? sel\.find\(h => h\.wind === vHi\) : null;/.test(src)
     && /const dTxt = has\(hMax\?\.dir\) \? ` del \$\{rumboLargo\(hMax\.dir\)\}` : '';/.test(src)
     && /<br>Viento \$\{vTxt\}\$\{dTxt\}<small> a \$\{S\.hgt\} m<\/small>/.test(src),
     'no una media de rumbos: eso sería un número que no ha publicado nadie');
  ok('y la estación AEMET dice su viento, su rumbo y su racha medidos',
     /viento <b>\$\{wtxt\(e\.viento, true\)\}<\/b>\$\{has\(e\.direccion\) \? ` del \$\{esc\(rumboLargo\(e\.direccion\)\)\}` : ''\}/.test(src)
     && /racha <b>\$\{wtxt\(e\.racha, true\)\}<\/b>/.test(src));
}

grupo('El «ahora» dice de qué modelo es, y lo medido de verdad va debajo con su estación');
{
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la hora del «ahora» ya no se llama «Medido»: lleva el nombre del modelo que lo da',
     /el\.innerHTML = `\$\{esc\(modeloDato\(\)\.name\)\} a las <b>\$\{hm\}<\/b>\$\{diaSiNoEsHoy\(t\)\}`/.test(src)
     && !/`Medido a las <b>/.test(src));
  ok('debajo va la estación AEMET más cercana (15 km), con nombre, temperatura, humedad y hora',
     /async function pintarMedidoCerca\(p\)/.test(src)
     && /fetch\(`\/estaciones\?puntos=\$\{encodeURIComponent\(k\)\}&radio=15`/.test(src)
     && /Medido de verdad · <b>AEMET \$\{esc\(e\.nombre\)\}<\/b>/.test(src)
     && /pintarMedidoCerca\(S\.place\);/.test(src)
     && /id="nowAemet"/.test(html));
  ok('si no hay ninguna estación cerca, no se pone nada (ni se inventa)',
     /if \(!e\) \{ el\.textContent = ''; return; \}/.test(src));
  /* ── PERO UN FALLO DE AEMET SÍ SE DICE (20-09-2026) ─────────────────
     Antes un 502 de AEMET se pintaba EXACTAMENTE igual que «aquí no hay
     ningún aparato a 15 km»: la línea desaparecía y ya. Y encima el fallo
     se guardaba diez minutos, así que no volvía ni recargando. Él leía que
     no hay aparato cerca teniéndolo a 3 km, y se quedaba sin nada con lo
     que contrastar la previsión. */
  ok('pero si AEMET falla se DICE, que no es lo mismo que no haber aparato',
     /No se ha podido leer el aparato de AEMET/.test(src)
     && /Lo de arriba es solo previsión/.test(src));
  ok('y el fallo NO se guarda en la caché: a los diez minutos seguiría sin salir',
     /\/\/ Un fallo no se guarda[\s\S]{0,80}if \(!fallo\) MEDIDO_CERCA\.set/.test(src));
  ok('y la petición lleva timeout, que no lo tenía',
     /const ac = new AbortController\(\);\s*\n\s*const reloj = setTimeout\(\(\) => ac\.abort\(\), 12000\);\s*\n\s*const r = await fetch\(`\/estaciones/.test(src));
  ok('el pulso del vigilante también, o una red colgada borra su aviso',
     /const r = await fetch\('\/api\/vigilante\?pulso=1', \{ cache: 'no-store', signal: ac\.signal \}\)/.test(src));
}

grupo('En el móvil la portada sale en Ahora, Horas, 10 días y Mar, como en el Mac');
{
  const cssSrc = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('la regla de pantalla estrecha enseña la portada en las cuatro pestañas del sitio',
     /@media \(max-width:900px\)\{\s*\.cover-fijo\{display:none\}\s*body\[data-view="now"\] \.cover-fijo,\s*body\[data-view="hours"\] \.cover-fijo,\s*body\[data-view="days"\] \.cover-fijo,\s*body\[data-view="sea"\] \.cover-fijo\{display:block\}/.test(cssSrc));
}

grupo('Los rótulos de las gráficas van en HTML, no dentro del SVG estirado');
{
  const cssSrc = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('en las gráficas de Horas y Mar no queda ningún <text> dentro del SVG',
     !/<text x="\$\{X\(i\)\}"/.test(src) && !/>ahora<\/text>/.test(src) && !/'P' : 'B'\}<\/text>/.test(src));
  ok('las horas del eje, el «ahora» y las P/B van en .grot, colocadas por porcentaje',
     /class="grot__h" style="left:\$\{\(X\(i\) \/ W \* 100\)\.toFixed\(2\)\}%"/.test(src)
     && /class="grot__h grot__ahora" style="left:\$\{\(X\(nowI\) \/ W \* 100\)\.toFixed\(2\)\}%">ahora<\/span>/.test(src)
     && /function rotulosMarea\(X, T, n, W\)/.test(src)
     && /class="grot__pb" style="left:\$\{\(X\(i\) \/ W \* 100\)\.toFixed\(2\)\}%/.test(src));
  ok('y el CSS coloca la capa encima del dibujo sin estorbar al dedo',
     /\.gcaja\{position:relative;height:100%\}/.test(cssSrc)
     && /\.grot\{position:absolute;inset:0;pointer-events:none\}/.test(cssSrc)
     && /\.grot__h\{position:absolute;bottom:3px;transform:translateX\(-50%\)/.test(cssSrc));
}

grupo('Las horas en el móvil: tarjetas de 150 px, cada una con su altura');
{
  const cssSrc = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('la fila de horas no estira las tarjetas a la altura de la más alta',
     /\.hlist\{[^}]*align-items:flex-start\}/.test(cssSrc));
  ok('en pantalla estrecha la tarjeta mide 150 px, no 118, y la racha no se parte',
     /@media\(max-width:560px\)\{[\s\S]{0,400}?\.hcard\{width:150px\}/.test(cssSrc)
     && !/\.hcard\{width:118px\}/.test(cssSrc)
     && /\.hcard__g\{[^}]*white-space:nowrap/.test(cssSrc));
}

grupo('La ubicación le sigue sola cuando el sitio salió del GPS (18-09-2026)');
ok('el botón de la mira y el seguimiento usan la MISMA función, y el sitio del GPS va marcado',
   /\$\('#btnGeo'\)\.addEventListener\('click', \(\) => irAMiUbicacion\(\)\);/.test(src)
   && /go\(\{ name, admin1, country, lat, lon, gps: true \}, \{ silent: silencioso \}\);/.test(src));
ok('en silencio solo se mueve si el sitio salió del GPS y se ha alejado más de un kilómetro',
   /const KM_PARA_MOVERSE = 1;/.test(src)
   && /if \(silencioso && S\.place\?\.gps && kmEntre\(S\.place, \{ lat, lon \}\) < KM_PARA_MOVERSE\) return;/.test(src)
   && /function seguirSiEsMiUbicacion\(\) \{\s*if \(S\.place\?\.gps\) irAMiUbicacion\(\{ silencioso: true \}\);\s*\}/.test(src),
   'un sitio elegido por nombre (torre, pueblo) no se toca: seguirle ahí sería quitarle lo que mira');
ok('se mira al arrancar y al volver a pantalla, y avisa con «Te has movido»',
   /go\(p, \{ silent: true \}\);\s*seguirSiEsMiUbicacion\(\);/.test(src)
   && /if \(!document\.hidden\) seguirSiEsMiUbicacion\(\);/.test(src)
   && /if \(silencioso\) toast\(`Te has movido: ahora en \$\{name\}`, 3800\);/.test(src));
ok('sin permiso o sin señal, en silencio no se dice nada (ya lo dirá el botón)',
   /err => \{ if \(!silencioso\) toast\('No se ha podido obtener la ubicación: ' \+ err\.message, 3800\); \}/.test(src));

ok('un dueño que contesta sin una temperatura rebota como si no cubriera',
   /const cubreElPunto = d => Array\.isArray\(d\?\.hourly\?\.temperature_2m\)\s*&& d\.hourly\.temperature_2m\.some\(v => v !== null && v !== undefined\)/.test(src)
   && /models: M\.om,\s*\}\)\.then\(d => \{\s*if \(!cubreElPunto\(d\)\) throw new Error\(`\$\{M\.name\} no cubre este punto: contestó sin datos`\);\s*return d;\s*\}\)\.catch\(async e => \{/.test(src),
   'el then va ANTES del catch: el 200 vacío se convierte en error y cae al global');

/* ── EL PRESTAMISTA SIN FICHA TAMBIÉN VA CON NOMBRE (17-09-2026) ───
   Ibiza, 16:00: el código del cielo lo prestaba ARPEGE y la hora decía
   «⚠ otro modelo ve llovizna». Su norma: el modelo siempre con nombre. */
ok('ARPEGE, HARMONIE y GEM tienen nombre aunque no estén en MODELS ni COMPARAR',
   /const NOMBRE_PRESTAMISTA = \{[\s\S]*?meteofrance_arpege_europe: 'ARPEGE'[\s\S]*?knmi_harmonie_arome_europe: 'HARMONIE'[\s\S]*?gem_seamless: 'GEM'[\s\S]*?\};/.test(src)
   && /\|\| NOMBRE_PRESTAMISTA\[om\] \|\| 'otro modelo';/.test(src),
   'nombreDeModelo() mira la tabla antes de rendirse con «otro modelo»');
ok('y todos los de ORDEN_FIABLE que no tienen ficha están en la tabla',
   (() => {
     const orden = /const ORDEN_FIABLE = \[([\s\S]*?)\];/.exec(src)?.[1] || '';
     const ids = [...orden.matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1]);
     const tabla = /const NOMBRE_PRESTAMISTA = \{([\s\S]*?)\};/.exec(src)?.[1] || '';
     const conFicha = /const MODELS = \[([\s\S]*?)\n\];/.exec(src)?.[1] || '';
     const comparar = /const COMPARAR = \[([\s\S]*?)\n\];/.exec(src)?.[1] || '';
     return ids.length >= 5 && ids.every(id => tabla.includes(id + ':') || conFicha.includes(`'${id}'`) || comparar.includes(`'${id}'`));
   })(),
   'si un día entra uno nuevo en ORDEN_FIABLE sin nombre, esto lo canta');
ok('y NO es GFS, que en el marcador se queda corto 11 de 22 veces',
   RELLENO_LARGO !== 'gfs_seamless');
/* Y los DÍAS, no solo las horas: la pestaña «10 días» usa `daily`, y con
   AROME salían ocho días con «— —, 0.0 mm, Racha —». Lo vio él en un
   pantallazo dos minutos después de publicarlo. */
ok('también rellena los DÍAS, que es donde se veía el hueco',
   /const D = f\.daily;/.test(src) && /hourly: campos\.join\(','\), daily: DAILY,/.test(src));
ok('y en los días tampoco pisa lo que ya había',
   /if \(D\[k\]\[i\] === null \|\| D\[k\]\[i\] === undefined\) D\[k\]\[i\] = d\.daily\[k\]\[j\];/.test(src));
ok('se rellena SOLO lo que falta, sin tocar las 48 h buenas',
   /for \(let i = ultimo \+ 1; i < H\.time\.length; i\+\+\)/.test(src));
ok('y se casa por HORA, no por posición',
   /donde\.get\(H\.time\[i\]\.slice\(0, 13\)\)/.test(src));
ok('si no se rellena nada, no se marca que se haya rellenado',
   /if \(puestos\) f\.rellenoDesde/.test(src));

/* Si el modelo trae la serie entera pero con nulos al final —que es lo
   que hace AROME— tiene que contar hasta el ÚLTIMO con dato, no hasta el
   final del array. Ese fue el fallo que casi se cuela. */
const conNulos = conHoras(240);
for (let i = 50; i < 240; i++) conNulos.hourly.wind_gusts_10m[i] = null;
ok('cuenta hasta el último dato de verdad, no hasta el final de la lista',
   hastaDondeLlega(conNulos) !== null && hastaDondeLlega(conNulos).horas <= 50);

/* ── EL HUECO QUE SOBREVIVIÓ AL PRIMER ARREGLO ────────────────────────
   Publiqué el relleno diario, lo di por bueno... y al medirlo contra los
   datos servidos quedaba **un hueco en cada uno de los diez días**: el
   índice UV, que no publica AROME, ni ECMWF, ni ICON. Solo GFS.
   Su norma no admite «casi»: vacío jamás, nada. */
ok('hay una segunda fuente para lo que ni el europeo publica',
   /const RELLENO_2 = 'gfs_seamless';/.test(src));
ok('y solo se sale a la red si de verdad queda algo vacío',
   /if \(faltan\.length\) \{/.test(src));
ok('la segunda pasada tampoco pisa lo que ya había',
   /if \(D\[k\]\[i\] === null \|\| D\[k\]\[i\] === undefined\) \{ D\[k\]\[i\] = d2\.daily\[k\]\[j\]/.test(src));
ok('y también se casa por FECHA, no por posición',
   /dd2\.get\(D\.time\[i\]\)/.test(src));
ok('se dice de quién sale ese dato, no aparece a secas',
   /nombreDeModelo\(RELLENO_2\)/.test(src) && /rellenoDe2/.test(src));

/* La cuenta de verdad: diez días, el mismo reparto que hace la app, y
   ni un hueco al final. Con datos de mentira pero con la forma exacta de
   los de Open-Meteo: AROME da los diez días con nulos a partir del 3º. */
{
  const dias = () => Array.from({ length: 10 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
  const campos = ['temperature_2m_max', 'precipitation_sum', 'wind_gusts_10m_max',
                  'uv_index_max', 'weather_code'];
  const arome = { time: dias() }, euro = { time: dias() }, gfs = { time: dias() };
  for (const k of campos) {
    /* AROME: solo 3 días, y el UV y el código no los publica nunca. */
    arome[k] = dias().map((_, i) =>
      (k === 'uv_index_max' || k === 'weather_code' || i >= 3) ? null : 10 + i);
    /* El europeo: todo menos el UV. */
    euro[k] = dias().map((_, i) => k === 'uv_index_max' ? null : 20 + i);
    gfs[k] = dias().map((_, i) => 30 + i);
  }
  const meter = (D, o, ks) => D.time.forEach((d, i) => {
    const j = o.time.indexOf(d); if (j < 0) return;
    for (const k of ks) if (D[k][i] === null || D[k][i] === undefined) D[k][i] = o[k][j];
  });
  meter(arome, euro, campos);
  const faltan = campos.filter(k => arome[k].some(v => v === null || v === undefined));
  ok('tras el europeo aún falta el UV, y se detecta', faltan.length === 1 && faltan[0] === 'uv_index_max');
  meter(arome, gfs, faltan);
  let huecos = 0;
  for (const k of campos) for (const v of arome[k]) if (v === null || v === undefined) huecos++;
  ok('DIEZ DÍAS SIN UN SOLO HUECO', huecos === 0);
  ok('y los días buenos de AROME siguen siendo suyos', arome.temperature_2m_max[0] === 10);
  ok('el día 10 lo pone el europeo, no GFS', arome.temperature_2m_max[9] === 29);
  ok('y el UV lo pone GFS, que es el único que lo mide', arome.uv_index_max[9] === 39);
}

/* Cazado en la segunda vuelta, antes de publicar: la nota del relleno
   iba a decir «uv_index_max sale de GFS». En su app no aparece lenguaje
   de máquina — ya lo cazó él una vez y no se repite. */
{
  const D = (src.match(/const DAILY = '([^']+)'/) || [])[1] || '';
  const tabla = src.slice(src.indexOf('const NOMBRES_COMPL'), src.indexOf('const NOMBRES_COMPL') + 2000);
  const sin = D.split(',').filter(k => !tabla.includes(k + ':') && !['time', 'sunrise', 'sunset'].includes(k));
  ok('ningún campo diario sale en crudo: todos con nombre en castellano — ' + (sin.join(', ') || 'ok'),
     sin.length === 0);
}

/* ── EL REPARTO YA NO ES UNA TABLA A MANO ─────────────────────────────
   Suyo, 30-08-2026: *«estos arreglos que no sean de un día y luego se
   quede cojo, que lo haga el automatismo»* · *«si no, un cambio y no nos
   enteramos»* · *«y en cada capa o sección: Ahora, Torre, Mis torres…
   si no, no valdrá»*.

   Había una tabla escrita a mano que repartía diez campos y se dejaba
   cinco cayendo al Automático. Ahora el reparto sale de `COBERTURA`, que
   la MIDE `medir-cobertura.cjs` preguntando a los siete modelos. */
/* ═══════════════════════════════════════════════════════════════════
   TODO MODELO QUE SALGA EN PANTALLA TIENE QUE ESTAR MEDIDO
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, a la cuarta vez de lo mismo:

     *«es lo que se vuelve loco cada vez que haces un cambio y me
       dijistes que mas no pasaria que lo ibas a remediar»*
     *«y 4 veces ya»* · *«esto no puede ser»*

   Y la causa no era el cambio de ese día. Era ésta: `medir-cobertura`
   preguntaba a SIETE modelos y el selector de la app enseñaba OCHO. El
   Automático nunca se midió. Así que `cobertura.json` decía que no
   publica ni un campo —0 de 28— cuando publica los 28, y la app, que usa
   esa tabla para saber qué le falta al modelo elegido, le pedía TODO
   prestado a otros modelos, cada cosa a uno distinto. De ahí que una
   pestaña dijera sol y la otra nubes, y de ahí que «se volviera loco»
   con cualquier cambio: el reparto se recalculaba sobre una tabla falsa.

   Esto NO arregla el Automático. Arregla la clase: **cualquier modelo
   que se añada mañana al selector y no se mida, pone esto en rojo antes
   de publicar**. Es la puerta única de la que él habla: una sola
   comprobación, y que se EJECUTE.                                     */
{
  const cobM = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cobertura.json'), 'utf8'));
  const medidor = fs.readFileSync(path.join(__dirname, 'medir-cobertura.cjs'), 'utf8');
  /* Solo los del selector: `om:` aparece también en otros objetos, y la
     primera versión de esto cazó cuatro campos meteorológicos como si
     fueran modelos (02-09-2026). */
  const iM = src.indexOf('const MODELS = [');
  const bloqueApp = iM < 0 ? '' : src.slice(iM, src.indexOf('\n];', iM));
  const enPantalla = [...bloqueApp.matchAll(/\bom\s*:\s*'([a-z_0-9]+)'/g)].map(m => m[1]);
  ok('el selector de modelos se lee de verdad (si no, esto no prueba nada)',
     enPantalla.length >= 5, `leídos: ${enPantalla.length}`);
  const bloqueMed = medidor.slice(medidor.indexOf('const MODELOS = ['),
                                  medidor.indexOf('];', medidor.indexOf('const MODELOS = [')));
  const seMiden = (bloqueMed.match(/'[a-z_0-9]+'/g) || []).map(x => x.slice(1, -1));
  const campos = Object.keys(cobM.cobertura);

  const sinMedir = [...new Set(enPantalla)].filter(om => !seMiden.includes(om));
  ok('todos los modelos del selector están en el medidor de cobertura',
     sinMedir.length === 0,
     `sin medir: ${sinMedir.join(', ')} — la app creerá que no publican nada`);

  const sinTabla = [...new Set(enPantalla)]
    .filter(om => !campos.some(c => cobM.cobertura[c].includes(om)));
  ok('y ninguno sale con la tabla a cero — 0 de 28 no es «no publica», es «no medido»',
     sinTabla.length === 0,
     `a cero: ${sinTabla.join(', ')}`);
}

{
  const cob = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cobertura.json'), 'utf8'));
  const COBERTURA = cob.cobertura;
  const ORDEN = (src.match(/const ORDEN_FIABLE = \[([^\]]+)\]/) || [])[1]
    .match(/'[a-z_0-9]+'/g).map(x => x.slice(1, -1));
  const quienLoMide = (campo, salvo) => {
    const puede = COBERTURA[campo];
    if (!puede?.length) return null;
    return ORDEN.find(om => om !== salvo && puede.includes(om)) || null;
  };
  const AROME = 'meteofrance_arome_france_hd';

  ok('ya no hay tabla escrita a mano de quién mide qué',
     !/QUIEN_LO_MIDE = \{\s*\n\s*wind_speed_120m:/.test(src),
     'una tabla a mano envejece con el primer cambio: ya pasó dos veces');

  ok('la cobertura está medida y con fecha', !!cob.cuando && !!cob.sitios?.length);

  const i = src.indexOf('const COMPLEMENTOS');
  const lista = src.slice(i, src.indexOf('];', i)).match(/'[a-z_0-9]+'/g).map(x => x.slice(1, -1));
  const sinNadie = lista.filter(k => !COBERTURA[k]);
  ok('todo lo que la app pide prestado está medido — ' + (sinNadie.join(', ') || 'ok'),
     sinNadie.length === 0,
     'un campo sin medir no se puede repartir: caería al Automático a ciegas');

  /* Era ICON hasta el 02-09-2026. Cambiado con el marcador del cielo
     delante —15 horas contra el satélite: ICON 33 % de fallos gordos,
     ECMWF 0 %— y es la petición que más se usa: AROME no publica el
     cielo, así que se presta TODOS los días. */
  ok('con AROME cargado, la nubosidad se le pide al europeo, no a ICON',
     quienLoMide('cloud_cover', AROME) === 'ecmwf_ifs025',
     'ICON falla el cielo el 33 % de las horas medidas contra el satélite');
  /* «de los siete»: el Automático entró en la medición el 02-09-2026 y
     también los publica, pero no presta —no es un modelo, es su mezcla—
     así que se cuentan los del ORDEN, que son de quien se piden. */
  const soloEnOrden = c => COBERTURA[c].filter(m => ORDEN.includes(m));
  ok('el UV a GFS, que es el único de los siete que lo publica',
     quienLoMide('uv_index', AROME) === 'gfs_seamless'
     && soloEnOrden('uv_index').length === 1);
  ok('el índice de elevación, igual',
     quienLoMide('lifted_index', AROME) === 'gfs_seamless'
     && soloEnOrden('lifted_index').length === 1);
  ok('la tapa a ICON, no a GFS, que es el peor de su marcador',
     quienLoMide('convective_inhibition', AROME) === 'icon_seamless');

  ok('NUNCA se le pide algo al modelo que ya está cargado',
     lista.every(k => quienLoMide(k, AROME) !== AROME),
     'pedirle a AROME lo que AROME no publica devuelve el mismo hueco');

  ok('si nadie lo publica, devuelve null y se queda el hueco',
     quienLoMide('esto_no_existe', AROME) === null,
     'el hueco es la verdad; un número del Automático sin decirlo, no');

  /* AROME sigue el primero por su malla de 1,3 km, que lee su punto. Lo
     que cambió el 02-09 es el SEGUNDO: el europeo por delante de ICON,
     con el marcador del cielo delante. */
  ok('el orden empieza por el suyo y sigue por el europeo',
     ORDEN[0] === AROME && ORDEN[1] === 'ecmwf_ifs025',
     'AROME lee su punto a 400 m; el europeo es el que menos falla el cielo');
  ok('e ICON baja de puesto, que falla el cielo un tercio de las horas',
     ORDEN.indexOf('icon_seamless') > ORDEN.indexOf('ecmwf_ifs025'));

  /* ── Y QUE LO USEN TODAS LAS PANTALLAS ─────────────────────────────
     «Mis torres» pedía TODO al Automático mientras «Ahora» repartía. El
     mismo dato salía de dos sitios según la pestaña. */
  ok('«Mis torres» usa el mismo reparto que «Ahora»',
     /const om = quienLoMide\(k, cargado\);/.test(src));
  ok('y ya no le pide todo al Automático',
     !/hourly: faltan\.join\(','\)[\s\S]{0,120}models: 'best_match'/.test(src),
     'ese era el resto del fallo, y lo señaló él');
  ok('y apunta de quién es cada dato, para poder decirlo',
     /\(fc\.prestadosDe \?\?= \[\]\)\.push\(\{ k, de: om, porAcierto:/.test(src));
}

/* ── QUE NINGUNA PANTALLA SE SALTE EL REPARTO ─────────────────────────
   Suyo, 30-08-2026, y con razón: *«por favor, estas cagadas más no.
   AUTOMATIZARLO EN CADA CAPA PARA QUE NO VUELVA A PASAR»* · *«si no, no
   avanzamos»*.

   El fallo fue que «Mis torres» pedía datos con `models: 'best_match'`
   por su cuenta mientras las demás repartían. No lo cazó ninguna prueba
   porque no rompía nada: el dato salía, del modelo equivocado.

   Esto barre TODO app.js buscando peticiones de datos y exige que cada
   una diga de dónde saca el modelo. Si mañana alguien añade una pantalla
   y pide al Automático a mano, NO SE PUBLICA. */
{
  /* Los sitios donde un modelo fijo SÍ es correcto, con su motivo. Para
     añadir uno hay que escribirlo aquí: no se cuela por descuido. */
  const PERMITIDO = {
    "COMPARAR.map(m => m.om).join(',')":
      'la comparativa: pide los siete A PROPÓSITO para enfrentarlos',
    "MODELOS_TORMENTA.map(m => m.om).join(',')":
      '«Mis torres»: los cinco a la vez, para el peor de todos',
    'M.om': 'el modelo que él tiene cargado',
    'modelo': 'el que sale de quienLoMide(), agrupado por fuente',
    'om': 'el que sale de quienLoMide()',
    'RELLENO_LARGO': 'el que llega a 10 días, medido',
    'RELLENO_2': 'el que publica lo que ni el europeo publica',
    'm.om': 'recorriendo la lista de modelos',
    "f._modelo === 'best_match' ? 'best_match' : model().om": 'el modelo del dato que hay cargado',
    'model().om': 'el modelo que él tiene puesto',
    'rebote });': 'el que llega cuando el suyo no cubre el punto, medido en Miami',
  };
  /* Se barre el código SIN comentarios: en ellos se explica el fallo
     viejo —«pedía models: 'best_match'»— y eso no es código. */
  const limpio = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const malos = [];
  /* Hasta el fin de línea: `join(',')` lleva una coma dentro y cortando
     por coma se partía la expresión y se leía mal. */
  const re = /models:\s*(.+)$/gm;
  let m;
  while ((m = re.exec(limpio))) {
    const q = m[1].trim().replace(/,\s*$/, '').replace(/\s+/g, ' ');
    if (PERMITIDO[q]) continue;
    /* Un literal —'best_match', 'icon_seamless'…— es exactamente lo que
       no puede haber: es un modelo elegido a mano para una pantalla. */
    const linea = limpio.slice(0, m.index).split('\n').length;
    malos.push(`línea ${linea}: models: ${q}`);
  }
  ok('ninguna pantalla pide datos a un modelo escrito a mano — ' + (malos.join(' · ') || 'ok'),
     malos.length === 0,
     'así fue como «Mis torres» se quedó pidiendo todo al Automático');

  /* Y que el reparto se use de verdad en más de un sitio: si solo lo
     usara «Ahora», volveríamos al mismo problema con otra pantalla. */
  const usos = (src.match(/quienLoMide\(/g) || []).length;
  ok(`el reparto se usa en varias pantallas, no en una (${usos} sitios)`, usos >= 3);
}

/* ── «NINGUNA CERCA» NO PUEDE SIGNIFICAR «AÚN NO LO SÉ» ───────────────
   Cazado el 30-08-2026 en un pantallazo suyo de las 10:33, recién
   cargada la app: BI BERMEO ponía «ninguna cerca» y unos segundos
   después salía **Almike a 1,1 km**, que es la que le corresponde
   (medido contra /api/euskalmet: Almike 1,1 km y Matxitxako 5,3 km).

   Las medidas llegan DESPUÉS del primer pintado. Mientras tanto la app
   afirmaba que no había estación. Es el mismo fallo del mapa sin
   teselas, del vigilante mudo y del buzón que decía «0 notas». */
{
  /* Se exige la GARANTÍA (que los estados se distingan), no la forma
     literal: el 01-09-2026 esta prueba se puso roja sólo porque se añadió
     un cuarto estado —«solo AEMET, falta Euskalmet»— y la garantía seguía
     intacta. Una prueba pegada a la redacción estorba en vez de guardar. */
  ok('mientras no se ha preguntado, NO se afirma que no hay estación',
     /S\.medidoTorres \?/.test(src) && /ninguna cerca/.test(src)
     && /midiendo…/.test(src),
     'un dato que no ha llegado no es un dato que no existe');
  ok('en «Ahora», si Euskalmet no contesta se DICE en vez de vaciarse',
     /_fallo: `error \$\{x\.status\}`/.test(src)
     && /No he podido preguntar a Euskalmet/.test(src)
     && /no quiere decir que no midan, quiere decir que no lo sé/.test(src),
     'antes el fallo y el «no hay ninguna cerca» acababan los dos en lista vacía');
  ok('y si solo cae Euskalmet, no se hace pasar la tabla por completa',
     /S\.medidoSinEuskalmet/.test(src) && /solo AEMET · falta Euskalmet/.test(src),
     'sin sus estaciones de 20 m la tabla parece entera y no lo está');
  ok('y si la consulta falla, también se dice',
     /S\.medidoFallo\s*\? 'ESTACIÓN<span>no se ha podido leer/.test(src)
     && /S\.medidoTorres = null; S\.medidoFallo = true/.test(src),
     'con solo «midiendo…» parecería que va a llegar y no va a llegar');
  ok('la bandera se limpia al empezar, que si no se queda pegada',
     /S\.medidoFallo = false;/.test(src));
}

/* ── UNA COLUMNA DE NULOS NO ES UN DATO ───────────────────────────────
   Suyo, 30-08-2026, y es la razón de todo este candado: *«nos jugamos
   mucho: si llueve o no, no hay CAPE… y si está muerto el automatismo,
   ala, se queda frito en la torre»* · *«o se cae del viento»* · *«o se
   resbala con la lluvia»* · *«esto es serio, por eso os digo de repasar
   dos veces»*.

   El código ponía `if (d.hourly?.[k])`. En JavaScript **un array lleno
   de nulos es «verdadero»**, así que el día que el modelo al que se le
   pide el CAPE dejara de publicarlo, la app se tragaba la columna vacía
   y la firmaba con su nombre. Y como el reparto se mide al publicar,
   nadie se enteraría hasta la siguiente publicación.

   Estaba en las DOS pantallas: «Ahora»/«Torre» (`completar`) y «Mis
   torres» (`completarTorres`), que es con la que reparte gente. */
{
  const trae = v => Array.isArray(v) && v.some(x => x !== null && x !== undefined);
  ok('una columna entera de nulos NO cuenta como dato',
     trae([1, null]) === true && trae([null, null]) === false && trae(undefined) === false);

  ok('«Ahora» comprueba que el prestado traiga algo',
     /const traeAlgo = v => Array\.isArray\(v\) && v\.some/.test(src)
     && !/for \(const k of campos\) if \(d\.hourly\?\.\[k\]\) \{/.test(src),
     'un array de nulos es «verdadero»: así se colaba el hueco firmado');

  ok('«Mis torres» lo comprueba también, que es con la que reparte gente',
     (src.match(/const traeAlgo = v => Array\.isArray/g) || []).length >= 2);

  ok('si el asignado se cae, se pide al siguiente EN EL ACTO',
     /for \(const otro of ORDEN_FIABLE\)/.test(src),
     'esperar a la próxima publicación es dejarle un día sin CAPE');

  ok('y nunca se le vuelve a pedir al que ya se ha caído ni al cargado',
     /otro === om \|\| otro === cargado/.test(src));

  ok('el rescate se DICE en pantalla, no se hace a escondidas',
     /fc\.seCayo\?\.length/.test(src) && /Hoy uno no ha contestado/.test(src),
     'un rescate callado es tan malo como el fallo');

  ok('y se apunta quién se cayó y quién lo salvó, en las dos pantallas',
     (src.match(/seCayo \?\?= \[\]\)\.push\(\{ k, muerto, salvo: om \}\)/g) || []).length === 2);

  /* ── Y QUE HAYA UNA SOLA COPIA ──────────────────────────────────────
     Suyo, 30-08-2026: *«que no tengamos que corregir esto cada día o
     cada cambio que hagamos»*. El fallo estuvo en dos sitios porque la
     lógica estaba escrita dos veces. Si alguien vuelve a duplicarla,
     esto no deja publicar. */
  ok('el reparto con respaldo existe UNA sola vez',
     (src.match(/async function repartirConRespaldo/g) || []).length === 1);
  ok('y lo usan las dos pantallas: «Ahora»/«Torre» y «Mis torres»',
     (src.match(/await repartirConRespaldo\(/g) || []).length === 2);
  ok('el bucle de respaldo NO está copiado en ningún otro sitio',
     (src.match(/for \(const otro of ORDEN_FIABLE\)/g) || []).length === 1,
     'dos copias significa arreglarlo dos veces, y un día se olvida una');
  ok('ninguna pantalla arma su propio reparto por su cuenta',
     !/const porQuien = new Map\(\);/.test(src.replace(
        src.slice(src.indexOf('async function repartirConRespaldo'),
                  src.indexOf('async function completar(f, p)')), '')),
     'así fue como «Mis torres» se quedó pidiendo todo al Automático');
}

/* ── UN NÚMERO IMPOSIBLE NO SE ENSEÑA ─────────────────────────────────
   Cazado el 30-08-2026 en un pantallazo suyo de Bilbao: «Torre» ponía
   **ECMWF −10 J/kg de CAPE**. El CAPE es energía disponible: por debajo
   de cero no hay tal cosa. Medido allí mismo: solo ECMWF da negativos,
   2 horas de 48 y siempre −10 — ruido de interpolación.

   Y el fondo: el MAPA tenía guardia desde el 27-08 (`fueraDeRango`) y
   **la ficha no tenía ninguno**. Suyo: *«reparar esto en Torre, Ahora
   etc también, y automatizar para que no pase»*. */
{
  const POSIBLE = eval('(' + (src.match(/const POSIBLE = (\{[\s\S]*?\n\};)/) || [])[1].slice(0, -1) + ')');
  const holgura = ([a, b]) => (b - a) * 0.05;
  const sanearSerie = eval('(' + src.slice(src.indexOf('function sanearSerie'),
    src.indexOf('\n}\n', src.indexOf('function sanearSerie')) + 2).replace('function sanearSerie', 'function') + ')');

  ok('el CAPE no puede ser negativo', POSIBLE.cape[0] === 0);

  const a1 = [-10, 0, 500, null];
  const r1 = sanearSerie('cape', a1);
  ok('un −10 de CAPE se pega al cero, que es ruido, y no se tira',
     a1[0] === 0 && r1.pegados === 1 && r1.tirados === 0);
  ok('y lo bueno no se toca', a1[2] === 500 && a1[3] === null);

  const a2 = [99999];
  const r2 = sanearSerie('cape', a2);
  ok('un CAPE de 99.999 NO se aplasta al tope: se deja el hueco',
     a2[0] === null && r2.tirados === 1,
     'aplastarlo sería inventarse un número, y con esto sube gente');

  const a3 = [500];
  sanearSerie('wind_gusts_10m', a3);
  ok('una racha de 500 km/h tampoco se aplasta a 400', a3[0] === null);

  const a4 = [10];
  sanearSerie('surface_pressure', a4);
  ok('la presión de 10 hPa del 24-08 se habría cazado aquí', a4[0] === null);

  const a5 = [100.4];
  sanearSerie('relative_humidity_2m', a5);
  ok('un 100,4 % de humedad se pega al 100', a5[0] === 100);

  /* Que no confunda `cloud_cover_low_icon_seamless` con `cloud_cover`:
     los dos tienen el mismo tope, pero si algún día no lo tuvieran el
     fallo sería mudo. */
  const sanear = eval('(' + src.slice(src.indexOf('function sanear(hourly)'),
    src.indexOf('\n}\n', src.indexOf('function sanear(hourly)')) + 2).replace('function sanear', 'function') + ')');
  const H = { time: [1], cape_ecmwf_ifs025: [-10], wind_gusts_10m_gfs_seamless: [500] };
  const partes = sanear(H);
  ok('limpia también las columnas POR MODELO, que es donde él lo vio',
     H.cape_ecmwf_ifs025[0] === 0 && H.wind_gusts_10m_gfs_seamless[0] === null);
  ok('y dice qué campo y qué columna era',
     partes.some(x => x.campo === 'cape' && x.columna === 'cape_ecmwf_ifs025'));

  ok('el guardia se aplica en las CUATRO entradas, no en una',
     (src.match(/sanear\(\w+\.hourly\)/g) || []).length === 4,
     'el mapa tenía guardia y la ficha no: el mismo fallo por el otro lado');
  ok('y cuando hay que tirar un dato, se DICE en pantalla',
     /Algún número no era posible y se ha quitado/.test(src));
}

/* ── EL MODELO CARGADO NO PUEDE SER «OTRO MODELO» ─────────────────────
   Cazado el 30-08-2026 por él, probando los cuatro modelos uno a uno.
   Con ECMWF puesto, la tarjeta de lluvia decía en el mismo renglón:
   «⚠ ECMWF no ve agua · ECMWF y HARMONIE sí (sirimiri)».

   Causa: la ficha lee con `cell_selection: land` y la comparativa no.
   En Bermeo son 19 km. Mismo modelo, dos celdas, dos respuestas. */
{
  ok('el modelo cargado se saca de la lista de «otros»',
     /const otros = todos\.filter\(x => x\.nom !== cargado\)/.test(src),
     'decir «ECMWF no ve agua pero ECMWF sí» le hace dudar de un dato bueno');
  ok('y si es él mismo, se cuenta aparte y con su nombre',
     /enLaOtraCelda: elMismo \? elMismo\.mm : null/.test(src)
     && /sí en la celda[\s\S]{0,30}de al lado/.test(src));
  ok('«quien» va vacío cuando no hay ningún OTRO que lo vea',
     /quien: otros\.length \? listar\(/.test(src));
  /* Eran DOS hasta el 30-08-2026. Ese día se añadió el tercero: la marca
     corta pegada al número de «Ahora», porque el aviso iba debajo y lo
     que se lee de un vistazo es el número. Suyo: *«pone 0mm pero ya te
     esta diciendo que 2 marcan agua entonces ese 0mm creo que no pinta
     no?»*. Si mañana hay un cuarto sitio, este número sube — pero solo
     después de comprobar que ESE sitio también aguanta el vacío: cuando
     el único que ve agua es tu propio modelo en la celda de al lado,
     `quien` es null y pintarlo sacaría «⚠ null sí». */
  ok('los TRES sitios que lo pintan aguantan que «quien» esté vacío',
     (src.match(/otro\.quien\s*\n?\s*\?/g) || []).length === 3);
}

/* ── LA FRANJA DICE A QUÉ HORA EMPIEZA ────────────────────────────────
   Suyo: *«en el símbolo mayormente despejado, pero pone lluvia en esta
   franja; no está bien eso»*. Los dos números eran buenos —el símbolo es
   la hora en curso y la franja son siete horas— pero leídos juntos se
   contradecían. Empezaba a las 15:00 y no lo decía. */
{
  const h = (hh, p) => ({ date: new Date(2026, 7, 30, hh), prec: p });
  const cuando = sel => {
    const e = sel.find(x => has(x.prec) && x.prec >= 0.1);
    return (e && e.date.getHours() !== sel[0].date.getHours())
      ? ` desde las ${String(e.date.getHours()).padStart(2, '0')}:00` : '';
  };
  ok('si la lluvia empieza más tarde, se dice la hora',
     cuando([h(14, 0), h(15, 0.5), h(16, 0.8)]) === ' desde las 15:00');
  ok('si ya está lloviendo al empezar la franja, no se repite la hora',
     cuando([h(14, 0.5), h(15, 0.5)]) === '');
  ok('y si no llueve en toda la franja, tampoco', cuando([h(14, 0), h(15, 0)]) === '');
  ok('está puesto en la app', /mm en la franja\$\{desde\}/.test(src));
}

/* ── EL CIELO SE AVISA EN LAS TRES PANTALLAS, Y DESDE UN SITIO ────────
   Suyo, 30-08-2026: *«pero en el símbolo pone sol»* con Bermeo cubierto
   y chispeando, y luego *«que quede automatizado, sin tener que corregir
   a diario, y también en Torre, Ahora y Mis torres»*.

   `cieloRaro()` sabía desde el 28-08 que los modelos no ven el mismo
   cielo —salió con su foto de medio cielo cubierto y la app diciendo
   «Despejado 0 %»— pero solo lo decía en la tarjeta de Nubosidad. El
   rótulo grande y las franjas no lo miraban.

   Esta prueba exige que exista UNA función y que la usen TODAS. Si
   mañana alguien pinta el cielo en otro sitio sin pasar por ella, no se
   publica. Es el mismo candado que el del reparto de modelos. */
{
  ok('el aviso del cielo existe una sola vez',
     (src.match(/function avisoCielo\(/g) || []).length === 1);
  ok('y lo usan las tres: rótulo grande, ficha de Torre y franjas',
     (src.match(/avisoCielo\(/g) || []).length >= 4,
     'una por cada sitio que escribe el cielo, más la definición');
  /* Desde el 30-08 el rótulo pinta `codVisto` —cielo del dueño del
     cielo, agua del dueño de la lluvia—, no el código crudo. */
  ok('el rótulo grande lo lleva', /textoCielo\(codVisto, V\.dia\)\) \+ avisoCielo/.test(src));   // V = cieloVisto(c), un solo camino (09-09)
  ok('la ficha de Torre lo lleva', /\(cieloVisto\(c\)\.txt \?\? ''\) \+ avisoCielo/.test(src));
  ok('y las franjas también, que salen en las tres pestañas',
     /avisoCielo\(sel\[0\]\.cloud/.test(src));
  ok('NO cambia el símbolo: solo pone al lado lo que ven los demás',
     /los otros ven \$\{r\.mediana\} % de nubes/.test(src),
     'el modelo lo ha elegido él; la app pone cifras, no decide');
}

/* ── LA LLUVIA ES DEL EUROPEO — ELEGIDA POR ACIERTO, 30-08-2026 ───────
   Decisión SUYA con dos episodios medidos delante: el 26-08 y el 30-08
   solo ECMWF vio el sirimiri que caía de verdad (gotitas 12:30, tanda
   14:00-15:30, pluviómetros en CERO, humedad 91 %). Sus palabras: «si el
   europeo está ganando en lluvia, que ese modelo marque siempre la
   lluvia» · «en Torres, Ahora y en Mis torres» · «necesito que acierten
   sobre todo si va a llover o no para poder subir a las torres». */
{
  /* ── 02-09-2026: EL REPARTO YA NO PISA SU ELECCIÓN ────────────────
     Suyo: *«yo quiero como windy»*. Windy no reparte: eliges un modelo y
     todo es de ese modelo. Así que `ELEGIDO_POR_ACIERTO` se vació y manda
     el que él tenga puesto en todo lo que ese modelo publique.

     Lo que guardaba esta prueba —el fallo REAL de «Llueve poco ·
     probabilidad 0 %», los mm de uno con la probabilidad de otro— NO se
     pierde: se garantiza mejor, porque ahora las cuatro piezas del agua
     vienen del MISMO sitio por construcción. Lo que se exige aquí es esa
     garantía, no el mecanismo que la daba. */
  ok('las cuatro piezas del agua van juntas: o todas del suyo, o todas del mismo prestado',
     (() => {
       /* Escrita el 02-09-2026 y corregida el mismo día: la primera
          versión incluía `precipitation_sum`, que es un campo DIARIO y
          `medir-cobertura` solo mide los horarios — así que pedía algo
          que no está en la tabla y salía roja por el motivo equivocado.

          Lo que se fija: lo que el modelo cargado NO publique del agua se
          pide todo al MISMO prestamista. Que los mm sean suyos y la
          probabilidad prestada es «como windy» y va dicho; que la
          probabilidad venga de uno y los mm de otro TERCERO, no. */
       const cobA = JSON.parse(fs.readFileSync(
         path.join(__dirname, 'data', 'cobertura.json'), 'utf8')).cobertura;
       const ordenA = (src.match(/const ORDEN_FIABLE = \[([^\]]+)\]/) || [])[1]
         .match(/'[a-z_0-9]+'/g).map(x => x.slice(1, -1));
       const AGUA = ['precipitation', 'precipitation_probability'];
       return [...ordenA, 'best_match'].every(m => {
         const prestados = AGUA
           .filter(c => !cobA[c]?.includes(m))
           .map(c => ordenA.find(o => o !== m && cobA[c]?.includes(o)) || null);
         return prestados.every(Boolean) && new Set(prestados).size <= 1;
       });
     })(),
     'los mm de uno con la probabilidad de otro es la tarjeta contradiciéndose');
  ok('y el reparto por acierto está vacío: manda el modelo que él elija',
     /const ELEGIDO_POR_ACIERTO = \{\};/.test(src),
     'como Windy: eliges un modelo y todo es de ese modelo');

  const cob = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cobertura.json'), 'utf8')).cobertura;
  const ORDEN = (src.match(/const ORDEN_FIABLE = \[([^\]]+)\]/) || [])[1].match(/'[a-z_0-9]+'/g).map(x => x.slice(1, -1));
  const ELEGIDO = { precipitation: 'ecmwf_ifs025' };
  const quienLoMide = (campo, salvo) => {
    const puede = cob[campo]; if (!puede?.length) return null;
    const e = ELEGIDO[campo];
    if (e && e !== salvo && puede.includes(e)) return e;
    return ORDEN.find(om => om !== salvo && puede.includes(om)) || null;
  };
  ok('con AROME cargado, la lluvia se pide al europeo AUNQUE AROME la publica',
     quienLoMide('precipitation', 'meteofrance_arome_france_hd') === 'ecmwf_ifs025');
  ok('y si el europeo se cae, el respaldo sigue la fila normal',
     quienLoMide('precipitation', 'ecmwf_ifs025') !== 'ecmwf_ifs025'
     && quienLoMide('precipitation', 'ecmwf_ifs025') !== null);

  ok('las DOS cargas pisan la lluvia del cargado con la del dueño',
     (src.match(/porAcierto\.has\(k\)/g) || []).length >= 3,
     '«en todas las capas: Torres, Ahora y Mis torres» — a medias no vale');
  ok('y las dos llevan el código DEL MISMO modelo para el sirimiri',
     (src.match(/weather_code_lluvia = /g) || []).length === 2
     && /codeLluvia: H\.weather_code_lluvia\?\.\[i\]/.test(src));

  ok('los avisos de lluvia hablan del DUEÑO, no del modelo de pantalla',
     (src.match(/duenoLluvia\(\)/g) || []).length >= 8,
     'la cifra grande ya es del dueño: nombrar a otro sería contradecirse');

  ok('la nota lo cuenta como ELECCIÓN, no como «no lo publica»',
     /elegida por acierto/.test(src) && /if \(x\.porAcierto\) continue;/.test(src),
     'AROME sí publica la lluvia: decir lo contrario sería mentir');
}

/* ── EL SIRIMIRI SE CLASIFICA CON EL CÓDIGO DE LA LLUVIA ─────────────
   El 30-08 ICON (el código del cielo) decía «cubierto» mientras el
   europeo decía «llovizna» — y la llovizna era la verdad de la calle. */
{
  if (typeof esLlovizna !== 'function') globalThis.esLlovizna = c => has(c) && c >= 51 && c <= 57;
  const comoLlueveT = eval('(' + src.slice(src.indexOf('function comoLlueve(h'),
    src.indexOf('\n}\n', src.indexOf('function comoLlueve(h')) + 2).replace('function comoLlueve', 'function') + ')');
  ok('mm del europeo + llovizna del europeo = SIRIMIRI, aunque el cielo diga cubierto',
     comoLlueveT({ prec: 0.1, code: 3, codeLluvia: 51 }, { rainWarn: 0.2, rainNo: 2 }).k === 'sirimiri');
  ok('sin código de lluvia propio, se clasifica como siempre',
     comoLlueveT({ prec: 0.1, code: 3 }, { rainWarn: 0.2, rainNo: 2 }).k === 'poco');
  ok('con el código del cielo en llovizna también vale, como hasta hoy',
     comoLlueveT({ prec: 0.1, code: 51 }, { rainWarn: 0.2, rainNo: 2 }).k === 'sirimiri');
}

/* ── EL CIELO NO SE LE PIDE AL AUTOMÁTICO (30-08-2026) ────────────────
   Suyo, con el aviso naranja delante: «pues si con esa no pasa, ya
   sabes». El Automático es una costura de modelos: el 28-08 dio 100 %
   de nubes con el cielo azul, y el 30-08 un total del 91 % con la capa
   baja al 100 % — imposible. Con el Automático cargado, el cielo entero
   va al dueño del reparto, Y A UNO SOLO: total de un modelo con capas
   de otro es la mezcla que ya matamos una vez. */
{
  const cob = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cobertura.json'), 'utf8')).cobertura;
  const ORDEN = (src.match(/const ORDEN_FIABLE = \[([^\]]+)\]/) || [])[1].match(/'[a-z_0-9]+'/g).map(x => x.slice(1, -1));
  const CIELO = ['weather_code', 'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high'];
  const q = (campo, salvo) => {
    const puede = cob[campo]; if (!puede?.length) return null;
    if (salvo === 'best_match' && CIELO.includes(campo)) {
      const d = ORDEN.find(om => om !== 'best_match' && cob.cloud_cover?.includes(om));
      if (d && puede.includes(d)) return d;
    }
    return ORDEN.find(om => om !== salvo && puede.includes(om)) || null;
  };
  ok('la constante existe y cubre código, total y las tres capas',
     /const CIELO_NO_DEL_AUTOMATICO = \[\s*\n\s*'weather_code', 'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',/.test(src));
  const duenos = new Set(CIELO.map(k => q(k, 'best_match')));
  ok('con el Automático cargado, el cielo ENTERO va a UN solo modelo',
     duenos.size === 1 && !duenos.has('best_match') && !duenos.has(null),
     'total de uno con capas de otro es la mezcla que ya matamos: ' + [...duenos].join(','));
  /* El return temprano de completarTorres se iba ANTES de pisar: al
     Automático no le falta nada y la tabla decía «Lluvia 0,0» con el
     chip «ECMWF 0,2» al lado. Medido el 30-08 a las 19:09. */
  {
    const i0 = src.indexOf('async function completarTorres');
    const seg = src.slice(i0, src.indexOf('\n}\n', i0));
    const ret = seg.indexOf('if (!faltan.length) return;');
    const pisado = seg.indexOf('cieloQueSePresta(cargado)');
    ok('en Mis torres, el «si no falta nada, me voy» va DESPUÉS de los pisados',
       ret > pisado && pisado > 0,
       'antes se iba sin pisar la lluvia del europeo con el Automático');
  }

  /* ── AL REVÉS, Y POR SU PANTALLAZO ────────────────────────────────
     Esto exigía que el pisado del cielo fuera SOLO del Automático, o sea
     que con AROME las capas se quedaran en AROME. Y el 02-09-2026 él
     fotografió lo que eso produce: total 0 % del europeo —AROME no lo
     publica— y «altas 13 %» de AROME en la misma caja, con la propia app
     avisando de que «estos dos números no cuadran».

     AROME publica las capas pero NO el total. Así que la regla pasa a
     ser: si el cargado no publica el total, el cielo entero se presta,
     capas incluidas. Ver `cieloQueSePresta()`.                        */
  ok('y con AROME cargado las capas siguen siendo suyas (no se piden)',
     q('cloud_cover_low', 'meteofrance_arome_france_hd') === 'ecmwf_ifs025'
     && /function cieloQueSePresta\(cargado\)/.test(src)
     && /cieloQueSePresta\(cargadoYa\)/.test(src)
     && /cieloQueSePresta\(cargado\)/.test(src),
     'el cielo entero de un dueño: AROME no publica el total, así que tampoco sus capas');
  ok('la nota ya no puede decir «Automático no publica todo»',
     /const normales = \(fc\.prestadosDe \|\| \[\]\)\.some\(x => !x\.porAcierto\)/.test(src),
     'lo publica todo, mal cosido: la frase salía y era mentira');
  ok('y el «gana 5,6» solo sale con AROME cargado, que es de quien es',
     /modeloDato\(\)\?\.om === 'meteofrance_arome_france_hd'\s*\n?\s*\?/.test(src));
  ok('la frase del cielo existe y sale del dato, no escrita',
     /fraseCieloDelAutomatico/.test(src) && /costura de modelos/.test(src));
}

/* ── CIELO DE UNO, AGUA DEL OTRO (30-08-2026, 19:40) ──────────────────
   Suyo, con los dos aparatos delante: «¿en la web una cosa y en el
   móvil otra?». Mac (Automático) decía «Cubierto»; móvil (ECMWF),
   «Llovizna débil». Mismo sitio y hora. Y el Mac YA usaba la lluvia de
   ECMWF —«0,4 mm en la franja»— pero el titular la ignoraba.
   Medido entonces: ICON código 3 y 0 mm · ECMWF código 51 y 0,2 mm. */
{
  if (typeof HAY_AGUA === 'undefined') globalThis.HAY_AGUA = 51;
  const f = eval('(' + src.slice(src.indexOf('function codigoQueSeVe'),
    src.indexOf('\n}\n', src.indexOf('function codigoQueSeVe')) + 2).replace('function codigoQueSeVe', 'function') + ')');

  ok('el caso de sus dos pantallas: el agua del dueño manda sobre «cubierto»',
     f({ codeLluvia: 51 }, 3) === 51,
     'el rótulo no puede decir «Cubierto» con la tarjeta de al lado diciendo que llueve');
  ok('si el dueño del agua no ve nada, manda el cielo de su dueño',
     f({ codeLluvia: 2 }, 3) === 3,
     'las nubes son competencia del dueño del cielo, no del de la lluvia');
  ok('sin código de lluvia propio, todo sigue como siempre',
     f({}, 3) === 3 && f({ codeLluvia: null }, 45) === 45);
  ok('y lo peor del agua manda: lluvia gana a llovizna',
     f({ codeLluvia: 61 }, 3) === 61);

  ok('lo usan el rótulo grande y su dibujo',
     /const V = cieloVisto\(c\);\n\s*const codVisto = V\.code;/.test(src)
     && /icon\(codVisto, V\.dia\)/.test(src)
     && /textoCielo\(codVisto, V\.dia\)/.test(src));
  ok('y las franjas, que salen en las tres pestañas',
     /sel\.map\(h => codigoQueSeVe\(h, h\.code\)\)/.test(src));
}

grupo('Los ajustes viajan: el Mac, una calca del móvil (30-08-2026, 19:50)');
{
  /* Suyo, con los dos aparatos delante diciendo cosas distintas:
     «SI SE TOCA ALGO QUE SE VEAN IGUAL» · «el pronóstico tiene que ser
     lo mismo: el Mac tiene que ser una calca en el móvil». Aquí se
     prueba el lado de la app: qué manda, qué adopta y qué NO pisa. */
  eval(sacarConst('AJUSTES_QUE_VIAJAN'));
  eval(sacar('function ajusteTocado', '\n}'));
  eval(sacar('function recogerAjustes', '\n}'));
  eval(sacar('function adoptarAjustes', '\n}'));
  eval(sacarConst('DEFAULT_THR'));

  const S0 = globalThis.S;
  const llamadas = { go: 0, paint: 0, zoom: [] };
  globalThis.go = () => { llamadas.go++; };
  globalThis.paint = () => { llamadas.paint++; };
  globalThis.renderThr = () => {};
  globalThis.buildHours = () => [];
  globalThis.ponerZoom = (v, g) => { llamadas.zoom.push([+v, g]); };

  /* 1 — Aparato recién instalado: no ha tocado nada, lo adopta TODO. */
  LS.vaciar();
  globalThis.S = { model: 'arome', wunit: 'kmh', hgt: 40,
                   thr: { gustWarn: 45 }, place: { name: 'BI BERMEO' }, data: null };
  adoptarAjustes({ model: { v: 'ecmwf', t: 1000 },
                   thr:   { v: { gustWarn: 50 }, t: 1000 },
                   zoom:  { v: 1.3, t: 5000 } });
  ok('el recién instalado adopta el modelo del otro aparato y recarga',
     S.model === 'ecmwf' && llamadas.go === 1);
  ok('y los umbrales llegan enteros, sobre los de fábrica',
     S.thr.gustWarn === 50 && S.thr.windNo === DEFAULT_THR.windNo);
  ok('la letra se aplica SIN volver a guardarse como toque nuevo',
     llamadas.zoom.length === 1 && llamadas.zoom[0][1] === false
     && LS.get('ajustesT', {}).zoom === 5000,
     'si adoptar marcase hora nueva, dos aparatos rebotarían el mismo cambio para siempre');

  /* 2 — Lo tocado AQUÍ y más nuevo no se pisa. */
  LS.vaciar();
  globalThis.S = { model: 'arome', wunit: 'kmh', hgt: 40, thr: {}, place: null, data: null };
  LS.set('ajustesT', { model: 2000 });
  const cambio = adoptarAjustes({ model: { v: 'gfs', t: 1000 } });
  ok('mi cambio más nuevo se queda: el viejo del servidor no lo pisa',
     S.model === 'arome' && cambio === false);

  /* 3 — El mismo cambio no se adopta dos veces (no hay bucle de repintados). */
  LS.vaciar();
  globalThis.S = { model: 'arome', wunit: 'kmh', hgt: 40, thr: {}, place: { n: 1 }, data: null };
  llamadas.go = 0;
  adoptarAjustes({ model: { v: 'icon', t: 3000 } });
  adoptarAjustes({ model: { v: 'icon', t: 3000 } });
  ok('el mismo cambio remoto solo recarga UNA vez',
     S.model === 'icon' && llamadas.go === 1);

  /* 4 — Solo viaja lo que él ha tocado en ESTE aparato. */
  LS.vaciar();
  globalThis.S = { model: 'arome', wunit: 'kt', hgt: 60, thr: { x: 1 }, place: null, data: null };
  ok('sin toques no se manda nada (y por eso el recién instalado adopta todo)',
     Object.keys(recogerAjustes()).length === 0);
  ajusteTocado('wunit'); clearTimeout(ajusteTocado._t);   // el retén de 800 ms, fuera del banco
  const rec = recogerAjustes();
  ok('un toque de unidad viaja con su valor y su hora',
     rec.wunit?.v === 'kt' && Number.isFinite(rec.wunit?.t)
     && Object.keys(rec).length === 1);

  /* 5 — Lo que NO viaja, a propósito. */
  ok('place, visto y los emplazamientos NO están en la lista que viaja',
     !AJUSTES_QUE_VIAJAN.includes('place') && !AJUSTES_QUE_VIAJAN.includes('visto')
     && !AJUSTES_QUE_VIAJAN.includes('saved'),
     'cada aparato mira donde quiera; las torres tienen su /api/torres');

  /* 6 — Los cinco mandos de pantalla marcan el toque (es lo que hace
     que el cambio salga de este aparato; sin la marca no viaja). */
  for (const k of ['model', 'wunit', 'hgt', 'thr']) {
    ok(`al tocar ${k} en pantalla se apunta el cambio para el otro aparato`,
       new RegExp(`LS\\.set\\('${k}', [^)]+\\); ajusteTocado\\('${k}'\\)`).test(src));
  }
  ok('al tocar la letra también, y solo cuando la toca ÉL (no al adoptar)',
     /if \(guardar\) \{ LS\.set\('zoom', v\); ajusteTocado\('zoom'\); \}/.test(src));

  /* 7 — Y la app pregunta: al arrancar, cada 5 min y al volver a ella. */
  ok('se sincroniza al arrancar, junto a las torres',
     /setTimeout\(\(\) => sincronizarAjustes\(\), 0\)/.test(src));
  /* 23-09-2026: sigue siendo cada 5 min, pero solo con la pestaña a la vista («si no entro que no gaste»). */
  ok('y cada 5 min, con el pulso de la versión (solo con la pestaña a la vista)',
     /setInterval\(\(\) => \{ if \(document\.visibilityState === 'visible'\) sincronizarAjustes\(\); \}, 5 \* 60e3\)/.test(src));
  ok('y al sacar el móvil del bolsillo (visibilitychange)',
     /if \(!document\.hidden\) \{ comprobarVersion\(\); sincronizarAjustes\(\); \}/.test(src));

  /* 8 — El reloj adelantado no deja sordo al aparato. El servidor
     recorta las horas del futuro; si este aparato no adoptase la hora
     recortada de SU PROPIO cambio, se creería «más nuevo» para siempre
     y no volvería a adoptar nada de nadie. */
  LS.vaciar();
  globalThis.S = { model: 'icon', wunit: 'kmh', hgt: 40, thr: {}, place: { n: 1 }, data: null };
  LS.set('ajustesT', { model: 9e15 });          // reloj disparatado hacia delante
  adoptarAjustes({ model: { v: 'icon', t: 4000 } });   // el servidor devolvió nuestra hora, recortada
  ok('la hora recortada por el servidor se adopta para el propio cambio',
     LS.get('ajustesT', {}).model === 4000,
     'sin esto, un reloj adelantado dejaría al aparato sordo para siempre');
  llamadas.go = 0;
  adoptarAjustes({ model: { v: 'gfs', t: 4500 } });    // ahora el otro aparato SÍ puede pisar
  ok('y desde ahí el cambio del otro aparato entra con normalidad',
     S.model === 'gfs' && llamadas.go === 1);

  /* 9 — La migración del arranque (best_match→arome, una vez) NO cuenta
     como toque suyo: no puede pisar lo que él eligió en el otro aparato. */
  const migra = sacar("if (S.model === 'best_match' && !LS.get('fueraAuto', false))", '\n  }');
  ok('la migración del arranque no se manda como cambio suyo',
     !/ajusteTocado/.test(migra));

  /* 10 — EL GUARDIA DE MAÑANA. Suyo, 30-08: «pero esto aplica si hay
     cambios también diarios que haremos» · «no solo ahora». Lo que él
     toque viaja solo, siempre; el único agujero sería que NOSOTROS
     añadamos un ajuste nuevo a la app y nadie lo meta en la lista.
     Pues esto: toda clave que la app guarda tiene que estar o en
     AJUSTES_QUE_VIAJAN o apuntada aquí como local A PROPÓSITO, con su
     porqué. Una clave nueva sin decisión NO SE PUBLICA. */
  const LOCALES_A_PROPOSITO = {
    place: 'el sitio que ESTÁS mirando: abrir Boiro en el Mac no puede mover el móvil',
    view: 'la pestaña abierta: estado de pantalla, no decisión',
    visto: 'qué avisos ya enseñó este aparato',
    sitios: 'el historial de búsquedas de este aparato',
    saved: 'los emplazamientos viajan por /api/torres, que nunca pierde uno',
    'cfg.': 'tipo/cota/altura de cada sitio: viaja con su torre por /api/torres',
    'siteElev.': 'copia vieja de la cota, la lleva cfg.',
    perfil: 'sin mando en pantalla desde el 28-08; el tipo real va por torres',
    fueraAuto: 'marca de la migración de arranque, una vez por aparato',
    apodoMandado: 'si este aparato ya se presentó al buzón',
    ajustesT: 'las horas del propio sincronizador',
    'cache.': 'copias de datos para sin cobertura, de este aparato',
    'campo.pendientes': 'notas suyas aún sin mandar DESDE este aparato',
    'monte.t': 'marca de tiempo interna de este aparato',
    cieloFranjas: 'el último cielo pintado por franja, para decir «ha cambiado a las…»: es de este aparato y de esta pasada (13-09-2026)',
  };
  const guardadas = [...new Set([...src.matchAll(/LS\.set\('([^']+)'/g)].map(m => m[1]))];
  const sinDecidir = guardadas.filter(k =>
    !AJUSTES_QUE_VIAJAN.includes(k) && !(k in LOCALES_A_PROPOSITO));
  ok('todo ajuste que la app guarda está decidido: o viaja o es local a propósito',
     sinDecidir.length === 0,
     sinDecidir.length ? `sin decidir: ${sinDecidir.join(', ')} — mételo en AJUSTES_QUE_VIAJAN `
       + '(y en CAMPOS de api/ajustes.mjs, con ajusteTocado() en su mando) '
       + 'o apúntalo como local con su porqué' : '');

  globalThis.S = S0;
  LS.vaciar();
}

grupo('Su pantallazo de las 21:13 (30-08): el ✓ verde negaba al recuadro rojo');
{
  /* «El modelo lee tu sitio bien … lee a 19.1 km al sur» en verde, y
     debajo en rojo «el nudo está a 19.1 km de la torre». Dos frases
     negándose en la misma pantalla, y encima con el punto inglés. */
  /* REAPUNTADAS el 02-09-2026. Suyo, sobre esta caja:
       *«COMENTARIOS QUE OCUPAN Y MAREAN FUERA, A MI DATOS SOLO»*
     Los dos ✓ verdes se fueron con los párrafos. La garantía que
     defendían era que el ✓ no afirmara nada falso; sin ✓ no hay nada que
     afirmar, y la distancia —lo único que sí distingue— pasó a ser un
     número fijo de la fila. Lo que se comprueba ahora es eso. */
  ok('con el nudo lejos, el verde ya no afirma «lee tu sitio bien»',
     !/lee tu sitio bien/.test(src) && !/La altitud, al menos, cuadra/.test(src),
     'se quitó el ✓: un visto bueno que no puede fallar no comprueba nada');
  ok('sin nudo lejos, el «lee tu sitio bien» sigue — ahí es verdad',
     /<i>lee a<\/i><b>\$\{R \?/.test(src),
     'la distancia a la que lee es ahora un dato fijo, no un párrafo condicional');
  ok('los kilómetros van con coma en TODA la pantalla (kmTxt, como mmTxt)',
     !/km\.toFixed\(1\)/.test(src) && !/toFixed\(1\)\} km/.test(src)
     && /const kmTxt = v =>/.test(src),
     'estaba «19.1 km» con punto en doce sitios');
  eval(sacarConst('kmTxt'));
  ok('19.1 se enseña como 19,1', kmTxt(19.1) === '19,1' && kmTxt(null) === '—');
  ok('«tu suelo» dice que es sobre el mar — lo leyó como altura de trabajo',
     /tu suelo · sobre el mar/.test(src),
     '«está puesto a 36 m, la caseta está en el suelo»: el 36 era altitud, no altura');
}

grupo('La nieve no la publica AROME, que es el que sale por defecto (31-08-2026)');
{
  /* Cazado en la revisión de las 05:00. AROME HD —el modelo POR DEFECTO
     desde el 29-08— no publica `snowfall` ni `snow_depth`, medido por
     las dos vías (la app y api.open-meteo.com). Ninguno de los dos
     estaba en COMPLEMENTOS, así que con su modelo cargado la nieve se
     quedaba vacía.

     Y el hueco no se veía como hueco: `comoEstaLaPista()` ACUMULA la
     nieve, así que `nieveAntes` y `nieveHoy` se quedaban en **0** — que
     en pantalla se lee «no ha nevado», no «no lo sé». Con eso decide si
     se llega o no a un emplazamiento de monte en invierno. */
  ok('la nieve está en los prestados, las dos: la que cae y la del suelo',
     /'snowfall', 'snow_depth',/.test(
       src.slice(src.indexOf('const COMPLEMENTOS'),
                 src.indexOf('const RELLENO_LARGO'))),
     'con AROME cargado, nieveAntes y nieveHoy salían 0 sin haberlo mirado');
  ok('y las dos tienen nombre en cristiano, que si no salen en crudo',
     /snowfall: 'la nieve caída'/.test(src)
     && /snow_depth: 'la nieve en el suelo'/.test(src),
     'la nota del relleno cantaría «snowfall, snow_depth» tal cual');
  ok('QUIEN_LO_MIDE sabe a quién pedírsela, y no es a AROME',
     (() => {
       const q = src.slice(src.indexOf('"snowfall"'), src.indexOf('"cape"'));
       /* Ojo al escribirlo: «arome» a secas también casa con
          `knmi_harmonie_arome_europe`, que SÍ publica la nieve. El que
          no la publica es el de Météo-France, y es ese el que hay que
          buscar. Primera versión de esta prueba fallaba por eso. */
       return /icon_seamless/.test(q) && !/meteofrance_arome_france_hd/.test(q);
     })(),
     'pedírsela al que no la publica es cambiar un hueco por otro');
}

grupo('Su tanda de pantallazos de las 21:05-21:21 (30-08)');
{
  /* Tres fallos de una tacada: decimales con punto en las tarjetas
     («1.2 m», «31.1 km», «17.3 °C», «×2.05», «0.0 mm»), el perfil con
     «80 m sin dato» teniendo ICON el dato, y la letra diciendo «se
     guarda en este aparato» cuando ya viaja a los dos. */
  ok('show() — el embudo de las tarjetas — pone la coma',
     /Number\(v\)\.toFixed\(d\)\.replace\('\.', ','\)/.test(src),
     'mar, UV, PM y visibilidad salían con punto inglés');
  ok('ningún «0.0» escrito a mano en pantalla',
     !/'0\.0'/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')),
     'las tarjetas de Horas y 10 días decían «0.0 mm»');
  ok('el 80 m está en los prestados, con su dirección',
     /'wind_speed_80m', 'wind_direction_80m',\s*\n\];/.test(src),
     'con ECMWF el perfil ponía «80 m sin dato» teniendo ICON el dato');
  ok('la tarjeta de Dirección dice el nivel del que sale de verdad',
     /De donde viene el viento a \$\{c\.dirNivel \?\? \(has\(c\.dir80\) \? 80 : 10\)\} m/.test(src),
     'caía al rumbo de 10 m con un rótulo fijo de 80; desde el 10-09 la dirección va al nivel del viento que se enseña (dirNivel)');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la tarjeta de letra ya no dice que se queda en este aparato',
     /viaja a tus dos aparatos/.test(html) && !/Se guarda en este\s+aparato/.test(html),
     'desde el 30-08 la letra se sincroniza; el texto era del día antes');
  ok('el comparador de rocío va con coma',
     /f\.r\.toFixed\(1\)\.replace\('\.', ','\)/.test(src)
     && /abanico\.toFixed\(1\)\.replace\('\.', ','\)/.test(src));
  ok('el factor de racha y la ley potencial van con coma',
     /toFixed\(2\)\.replace\('\.', ','\)\} sobre los 10 m/.test(src)
     && /α=\$\{c\.alpha\.toFixed\(2\)\.replace\('\.', ','\)/.test(src));
}

grupo('Su palabra: son estaciones base, no torres (30-08-2026, 21:30)');
{
  /* Suyo: «mis torres sería mis estaciones base, diría yo» · «a las torres
     ya decido yo si subo sabiendo el tiempo que tengo abajo» · «ya calculo
     yo si la torre es de 30, hay otras de 20 y otras de 60» · «yo quiero
     saber en la caseta el tiempo que voy a encontrarme, porque subir hasta
     la caseta ya es tela». La pestaña va del VIAJE y del trabajo a pie, no
     del ascenso: el nombre tenía que decirlo. */
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la pestaña ya no se llama «Mis torres»',
     /data-v="torres">Mis estaciones</.test(html) && !/>Mis torres</.test(html));
  ok('y el rótulo grande lleva su término entero',
     /<h1>Mis estaciones base<\/h1>/.test(html));
  ok('dice que el tiempo es a pie de caseta, que es lo que él pidió',
     /a pie de caseta<\/b>, que es donde trabajas/.test(html));
  ok('ningún aviso de pantalla dice ya «Mis torres»',
     !/Mis torres/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')),
     'quedaban los dos toast del ♥ y dos consejos');
}

grupo('«Me pasan a las 2 de la mañana: Arbaiza» — el viaje entra en la respuesta');
{
  /* Suyo, 30-08-2026 22:15: «yo antes de salir tengo que saber qué me voy
     a encontrar allí si voy». La app le daba la hora en que mira el móvil
     —y de su casa—, no la de llegar. */
  eval(sacarConst('VIAJE_VUELTAS'));
  eval(sacarConst('VIAJE_KMH'));
  eval(sacarConst('BERMEO'));
  eval(sacar('function kmEntre'));
  eval(sacar('function viajeA'));
  eval(sacar('function alLlegar'));

  const ARBAIZA = { name: 'VI ARBAIZA', lat: 43.047556, lon: -2.931611 };
  const v = viajeA(ARBAIZA, new Date('2026-08-31T02:00:00'));
  ok('Arbaiza: la distancia en recta cuadra con lo medido (44 km)',
     v && Math.abs(v.km - 44) < 2, `salió ${v && v.km.toFixed(1)}`);
  ok('y por carretera da los ~66 km que él puso de ejemplo',
     Math.abs(v.carretera - 66) < 4, `salió ${v.carretera.toFixed(0)}`);
  ok('llamada a las 02:00 → llega pasadas las 03:00, no «ahora»',
     v.llegada.getHours() === 3 && v.min > 60 && v.min < 90,
     `llegada ${v.llegada.getHours()}:${v.llegada.getMinutes()} · ${v.min} min`);

  /* Un sitio de al lado no tiene «hora de llegada» que valga: dos cifras
     iguales solo ocupan sitio en una pantalla que él mira de noche. */
  const CERCA = { name: 'BI BERMEO', lat: 43.4209, lon: -2.7215 };
  ok('un sitio a la puerta no saca bloque de llegada',
     viajeA(CERCA).cerca === true && alLlegar([{ date: new Date() }], CERCA, new Date()) === null);

  /* Y la de verdad: que coja la HORA de llegada del pronóstico, no la primera. */
  const t0 = new Date('2026-08-31T02:00:00');
  const horas = Array.from({ length: 8 }, (_, i) => ({
    date: new Date(t0.getTime() + i * 36e5), gust: 10 + i * 10, prec: 0, code: 1 }));
  const L = alLlegar(horas, ARBAIZA, t0);
  ok('coge la hora en que LLEGA, no la de la llamada',
     L && L.h.gust === 20, `cogió racha ${L && L.h.gust} (la de las 02:00 es 10)`);
  ok('y trae también «mientras estás allí», un par de horas después',
     L.luego && L.luego.gust === 40);

  /* Suyo, 30-08-2026, tres veces seguidas: «los comentarios sobran, eso
     lo supongo yo» · «yo decido con los datos fiables que me pasáis» ·
     «lluvia en mm». En este bloque van CIFRAS con su unidad, no frases. */
  /* La línea se reordenó el 02-09-2026 a SU orden —lluvia, rayo,
     viento— y cada cifra se colorea solo si cruza su listón. Lo que se
     exige no cambia: cifras con su unidad, nunca frases. */
  ok('el bloque de llegada da cifras, no interpretaciones',
     /const cifras = x =>/.test(src)
     && /cif\(`racha \$\{esc\(wtxt/.test(src)
     /* Sin el `?? 0` desde el 01-09-2026: `mmTxt` ya pone «—» cuando no
        hay dato, y el `?? 0` lo pisaba pintando «0,0 mm» sin haberlo
        mirado. Lo que se exige sigue siendo lo mismo: milímetros. */
     && /mmTxt\(x\.prec\)\)\} mm/.test(src)
     && !/comoLlueve\(L\.h\)/.test(src),
     'decía «Sin lluvia»/«Llovizna débil»; él quiere los milímetros');

  ok('sin coordenadas no se inventa un viaje',
     viajeA({ name: 'x' }) === null && viajeA(null) === null);

  /* El fallo de esta casa: escrito y sin llamar. Pasó con fueraDeRango()
     tres días, y hoy me ha vuelto a pasar con esta misma línea. */
/* ═══════════════════════════════════════════════════════════════════
   UNA TARJETA POR ESTACIÓN, CON TODO DENTRO
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, con sus veinte emplazamientos saliendo DOS veces en
   la misma pestaña —una en «El parte de hoy» y otra en «Ahora y próximas
   horas»—:

     *«estos dos al final, ¿para qué es uno y el otro?»*
     *«lo menos lioso y fácil de ver, no puedo perder tanto tiempo»*
     *«en un vistazo de X estación que me diga todo»* · *«es lo suyo creo»*

   Las dos listas hablaban del mismo sitio y obligaban a buscar el nombre
   dos veces. Ahora el parte de cada emplazamiento se guarda en
   `S.parteFilas` y `renderTorres` lo mete DENTRO de su tarjeta: la racha
   máxima del día, el CAPE con la tapa, la lluvia, la ventana de cuándo
   se puede y la comparación contra el aparato de Euskalmet de al lado.  */
{
  ok('el parte se guarda por emplazamiento, no solo se pinta',
     /S\.parteFilas = new Map\(\)/.test(src)
     && (src.match(/S\.parteFilas\.set\(key\(p\)/g) || []).length === 2,
     'las DOS filas —la de rayo y la normal— tienen que guardarse');
  ok('y la tarjeta de la estación lo recoge',
     /S\.parteFilas\?\.get\(key\(t\.place\)\)/.test(src)
     && /class="tor__parte"/.test(src),
     'si no lo recoge, el parte desaparece en vez de fusionarse');
  ok('con la comparación contra el aparato de Euskalmet incluida',
     /\$\{P\.cuerpo\}<\/div>\$\{P\.comp \|\| ''\}/.test(src),
     'esa tabla es lo único que dice si el pronóstico acierta en su sitio');
  ok('y el chip de rayo, junto al nombre',
     /P\?\.etq \? ` <span class="pt__b" data-s="\$\{P\.est\}">\$\{P\.etq\}<\/span>`/.test(src));

  /* EL ORDEN IMPORTA y es el fallo que casi se me cuela: `renderTorres`
     LEE `S.parteFilas`, así que el parte tiene que calcularse antes. Al
     revés, la tarjeta pintaba el parte del render ANTERIOR — o nada la
     primera vez. */
  ok('el parte se pinta ANTES que las tarjetas, que son las que lo leen',
     !/renderTorres\(\); renderParte\(\)/.test(src)
     && (src.match(/renderParte\(\); renderTorres\(\)/g) || []).length >= 4,
     'al revés, la tarjeta lleva el parte del render anterior');

  const htmlS = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('y la lista vieja del parte ya no sale, para no verlo dos veces',
     /<div id="parte" hidden><\/div>/.test(htmlS),
     'el nombre de cada sitio tiene que leerse UNA vez');
  const cssS = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('el parte de dentro tiene estilo, que si no sale como texto suelto',
     /\.tor__parte\{/.test(cssS));
}

/* ═══════════════════════════════════════════════════════════════════
   EL MISMO SITIO NO SALE DOS VECES EN EL BUSCADOR
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026:  *«duplicadas las estaciones»*.

   Medido sobre sus 2.692 fichas: 34 puntos con más de una, y de ésos
   **4 son la misma ficha repetida** —misma coordenada al metro, mismo
   nombre, mismo operador, y el código interno de una es el código de la
   otra—. Los otros 30 son dos códigos de Totem con nombres distintos en
   el mismo punto: pueden ser dos antenas de verdad, así que no se tocan.

   Y no se borra nada del catálogo: se agrupan al ENSEÑARLOS. Su regla de
   siempre — nunca se pierde nada.

   Se comprueba EJECUTANDO la función contra el catálogo de verdad.    */
{
  const iD = src.indexOf('function sinDuplicados');
  const cuerpoD = iD < 0 ? '' : src.slice(iD, src.indexOf('\n}', iD) + 2);
  ok('existe el agrupador de duplicados y se puede ejecutar', !!cuerpoD.length);
  if (cuerpoD.length) {
    const hasD = v => v !== null && v !== undefined && !Number.isNaN(v);
    const sinDuplicados = new Function('has', cuerpoD + '\nreturn sinDuplicados;')(hasD);
    const cat = JSON.parse(fs.readFileSync(
      path.join(__dirname, 'data', 'estaciones.json'), 'utf8'));

    ok('con el catálogo de verdad quita 4 fichas y ni una más',
       cat.length - sinDuplicados(cat.slice()).length === 4,
       'medido el 02-09-2026: son exactamente esas cuatro');

    const par = cat.filter(x => x.n === 'BI MAYOR 10 LAS ARENAS');
    const r = sinDuplicados(par.slice());
    ok('«BI MAYOR 10 LAS ARENAS» sale UNA vez, con el código corto',
       par.length === 2 && r.length === 1 && r[0].c === '96069',
       'el ES-TIMS- es el interno; el corto es el que él usa');
    ok('y el otro código queda apuntado, que no se pierde',
       r[0].otroC === 'ES-TIMS-52275');

    const totem = cat.filter(x => ['BI0025', 'BI0152'].includes(x.c));
    ok('pero dos antenas con NOMBRE distinto en el mismo punto no se juntan',
       totem.length === 2 && sinDuplicados(totem.slice()).length === 2,
       'pueden ser dos de verdad: juntarlas sería esconderle una');

    /* Y el buscador tiene que USARLO, no solo tenerlo declarado. */
    ok('y el buscador lo aplica de verdad',
       /list = sinDuplicados\(list\);/.test(src));
  }
}

/* ═══════════════════════════════════════════════════════════════════
   LA CHAPA DEL CAPE, EN LA GUÍA — Y EL ENLACE QUE LLEVA
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, leyendo los cuatro párrafos que había encima de las
   cifras de riesgo eléctrico:  *«TODA ESTA CHAPA VALE PARA ALGO?»*

   Valen —están medidos y son ciertos— pero no ahí: en esa caja él mira
   números, y un manual encima de los números tapa los números. Su regla
   de siempre: *«vosotros con ponerme los datos me sobra»*.

   Lo que NO puede pasar es que el enlace que queda en su sitio no lleve
   a ninguna parte. Eso sería peor que el párrafo que se quitó: promete
   algo y no lo cumple.                                               */
{
  const htmlG = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la chapa del CAPE vive en la Guía, no encima de las cifras',
     /id="g-cape"/.test(htmlG)
     && /Míralos juntos, no por separado/.test(htmlG)
     && !/Míralos juntos, no por separado/.test(src),
     'un manual encima de los números tapa los números');
  ok('y los tres trozos medidos siguen enteros: granizo, valle y Arrasate',
     /no hay un aviso de granizo en esta app, y es a propósito/.test(htmlG)
     && /1\.252/.test(htmlG) && /1\.930 aquí, 1\.932 allí/.test(htmlG),
     'se mueve de sitio, no se pierde: son mediciones suyas');
  ok('en «Ahora» queda la regla en una línea, no el manual',
     /El CAPE y la tapa van juntos:<\/b>/.test(src)
     && /Esto dice si <b>puede<\/b>, no si ha caído/.test(src));
  ok('y el enlace a la Guía LLEVA de verdad',
     /a\[data-ir-guia\]/.test(src)
     && /setView\('guia'\)/.test(src)
     && /getElementById\(`g-\$\{g\.dataset\.irGuia\}`\)/.test(src),
     'un enlace que no lleva a ningún sitio es peor que el párrafo que quitó');
}

/* ═══════════════════════════════════════════════════════════════════
   SU ORDEN: LLUVIA, RAYOS, VIENTO
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, y es una regla de decisión, no de gusto:

     *«para mí la LLUVIA es lo más, después RAYOS y luego VIENTO»*
     *«y lluvia, solo abajo "sin lluvia"… mal»*
     *«si lluvia en verde se lía con lo de arriba»*
     *«y eso de más 1 más 2… mejor poner a las 21 h esto, a las 22 esto»*

   Estaba al revés en los dos sitios: la fila de cifras empezaba por el
   CAPE y la lluvia era la séptima de diez; el parte empezaba por la
   racha y la lluvia iba la última, sin cifra. Nadie lee diez números de
   izquierda a derecha: se leen los tres primeros.

   Y dos cosas más de la misma pantalla: «Sin lluvia» iba en verde justo
   encima de «Nada te frena para llegar», que también es verde —dos
   verdes pegados se leen como uno—; y las horas eran «+1 h», cuando él
   trabaja con la hora a la que llega, no con cuántas faltan.          */
{
  const iH = src.indexOf("if (S.perfil === 'hierro') {");
  /* Ventana generosa: los comentarios de por qué va cada cifra donde va
     son largos a propósito, y con 3000 caracteres no llegaba ni al
     primer `num(` (02-09-2026). */
  const bloque = iH < 0 ? '' : src.slice(iH, iH + 9000);
  const orden = [...bloque.matchAll(/num\(has\(h\.(\w+)\)/g)].map(m => m[1]);
  /* 20-09-2026, su orden: «lluvia, viento, CAPE, nieve» y «nubosidad». */
  ok('la fila de cifras va en su orden: lluvia, racha y viento a 10 m, CAPE y tapa, nieve, nubes',
     orden.slice(0, 7).join(',') === 'prec,gust10,w10,cape,cin,nieve,cloud',
     `salió: ${orden.slice(0, 8).join(', ')} — lluvia, viento, CAPE, nieve, nubosidad`);
  /* 20-09-2026: a pie de caseta. La racha es UNA, la de 10 m, y va la
     cuarta; la estimada a su altura de trabajo ya no se pinta («de torre
     no quiero ver nada»). */
  ok('y la racha va la cuarta, y es la de 10 m: a pie de caseta, sin estimada a otra altura',
     orden.slice(0, 11).join(',') === 'prec,gust10,w10,cape,cin,nieve,cloud,temp,frz,li,vis',
     `salió: ${orden.join(', ')}`);

  ok('el parte también: primero la lluvia, luego la racha, luego el CAPE (su orden del 20-09)',
     /const cuerpo = `\$\{lineaLluvia\(k\)\}\s*\n\s*\$\{lineaRacha\(k\)\}\s*\n\s*<div class="pt__d">\$\{porQue\}<\/div>/.test(src)
     && /const cuerpoR = `\$\{lineaLluvia\(k\)\}\$\{lineaRacha\(k\)\}/.test(src),
     'la lluvia le bloquea el trabajo: no puede ir la última');
  ok('y «Sin lluvia» lleva su cifra, no solo la palabra',
     /<b>Sin lluvia<\/b> \$\{[\s\S]{0,60}\} · 0,0 mm/.test(src),
     '«solo abajo sin lluvia… mal»: sin el número no dice cuánto');

  const cssO = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('«Sin lluvia» ya no es verde, que se pegaba con el otro verde',
     /\.pt__l--seco\{opacity:1;color:var\(--txt\);border-left-color:var\(--line\)\}/.test(cssO),
     'iba justo encima de «Nada te frena para llegar», también verde');

  ok('las horas son de reloj —«a las 22:00»— y no «+1 h»',
     /const TRAMOS = \[\[0, 'ahora'\], \[1, ''\], \[2, ''\], \[4, ''\]\]/.test(src)
     && /et \|\| `a las \$\{reloj2\(x\.date\)\}`/.test(src)
     && /et \|\| `a las \$\{hh\(x\.date\)\}`/.test(src),
     'él trabaja con la hora a la que llega, no con cuántas horas faltan');
}

/* ═══════════════════════════════════════════════════════════════════
   LA TARJETA FUSIONADA: NI BOTÓN DE MÁS, NI TODO DEL MISMO BLANCO
   ───────────────────────────────────────────────────────────────────
   Los tres fallos que salieron al juntar el parte con la tarjeta, todos
   suyos y todos del 02-09-2026:

     *«cuando hago un clic ahí dentro me lleva a la pantalla de Ahora,
       es un fallo»*   → todo lo que metí dentro quedó bajo el «abrir
       sitio». La tabla de la estación tiene números que uno lee y
       compara: pincharla y acabar en otra pantalla es perder el sitio.

     *«esto está feo en vertical»*  → la tarjeta es un grid de tres
       columnas y la comparativa entró como hija: caía en 140 px y el
       texto se solapaba encima de sí mismo. Ilegible.

     *«ahí todo blanco desvía la atención, pon colores distintos, no todo
       en blanco»* · *«para siempre»*  → nueve cifras del mismo blanco es
       lo mismo que ninguna. Racha, CAPE, tapa y lluvia son las que
       decide; lo demás es contexto y va apagado.                      */
{
  /* REFORZADA el 02-09-2026: acotar el clic a la cabecera no bastó
     —*«sigo pinchando en la pantalla, SIN NADA Bermeo me lleva a Ahora»*—
     porque él pincha justo ahí. Ahora NINGUNA parte de la tarjeta salta:
     solo el botón «Ver en Ahora». */
  ok('el parte de dentro NO abre la pantalla de Ahora al pincharlo',
     /const abrir = e\.target\.closest\('\[data-abrir\]'\);\s*\n\s*if \(!abrir\) return;/.test(src)
     && !/const c = e\.target\.closest\('\.tor'\); if \(!c\?\.dataset\.ir\) return;/.test(src),
     'la tarjeta entera era un botón: se saltaba de página por rozarla');
  ok('y para ir a Ahora hay un botón, al lado de Ajustar',
     /data-abrir="\$\{esc\(key\(t\.place\)\)\}">Ver en Ahora<\/button>/.test(src),
     'no se le quita la función: se hace explícita');

  const cssT = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('y la tabla de la estación ocupa el ancho entero de la tarjeta',
     /\.tor > \.pt__comp\{[^}]*grid-column:1\/-1/.test(cssT),
     'en una columna de 140 px el texto se solapa: ilegible');

  ok('las cifras llevan su familia: lo que decide o contexto',
     /const num = \(v, etq, aviso, fam = 'ctx'\)/.test(src)
     && /data-f="\$\{fam\}"/.test(src));
  ok('y son EXACTAMENTE las cinco que él mira: lluvia, racha, CAPE, tapa y nieve (20-09-2026)',
     (src.match(/'decide'\)/g) || []).length === 5,
     'sus prioridades son lluvia, viento, CAPE y nieve; el resto va después');
  ok('el contexto se apaga y lo que decide no',
     /\.tor__d\[data-f="ctx"\] \.tor__big\{color:var\(--faint\)\}/.test(cssT)
     && /\.tor__d\[data-f="decide"\] \.tor__big\{color:var\(--txt\)\}/.test(cssT));
  ok('pero el ámbar del aviso sigue mandando sobre las dos familias',
     cssT.indexOf('.tor__d[data-a="1"] .tor__big') < cssT.indexOf('.tor__d[data-f="ctx"] .tor__big')
     || /\.tor__d\[data-a="1"\] \.tor__big\{color:var\(--warn\)\}/.test(cssT),
     'si una racha se pasa, tiene que verse aunque sea de la familia que sea');
  /* EN ROJO LO QUE SALTA (20-09-2026): la cifra que pasa del listón va en
     rojo (data-a="2"), la etiqueta del parte lleva su color dentro de la
     tarjeta y la tarjeta entera se marca. Y todo ello al final del CSS,
     que es donde manda sobre ctx/decide. */
  ok('la cifra que se pasa va en ROJO, y manda sobre ctx/decide',
     /\.tor \.tor__d\[data-a="2"\] \.tor__big\{color:var\(--no\)/.test(cssT)
     && cssT.lastIndexOf('.tor .tor__d[data-a="2"] .tor__big') > cssT.indexOf('.tor__d[data-f="decide"] .tor__big')
     && /aviso === 'rojo' \? ' data-a="2"'/.test(src));
  ok('lluvia, racha, CAPE, tapa y nieve saben ponerse en rojo',
     (src.match(/\? 'rojo'/g) || []).length === 5);
  ok('la etiqueta del parte lleva su color dentro de la tarjeta',
     /\.pt__b\[data-s="no"\]\{[^}]*color:var\(--no\)/.test(cssT)
     && /<span class="pt__b" data-s="\$\{P\.est\}">/.test(src));
  ok('y la tarjeta entera se marca cuando algo salta',
     /data-alarma="1"/.test(src) && /\.tor\[data-alarma="1"\]\{border-color/.test(cssT)
     && /const alarma = P0\?\.est === 'no'/.test(src));
}

/* ═══════════════════════════════════════════════════════════════════
   LA CAJA DE NUBOSIDAD NO PUEDE NEGARSE A SÍ MISMA
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, con la caja fotografiada y AROME HD cargado:

     «El total y las capas son de ECMWF — AROME HD no las publica —, así
      que SÍ se comparan entre sí.»
     «Por capas: bajas 0 % · medias 0 % · altas 13 %»
     «⚠ estos dos números no cuadran… — AROME HD no publica las capas: el
      1 % es su dato y el 13 % es una cuenta hecha con la humedad»

   Tres fallos en el mismo recuadro:
     1. Dice que SÍ se comparan y tres renglones después que no.
     2. Le echa la culpa a AROME cuando el que no publica las capas ahí
        es **ECMWF** (ver `CAPAS_PROPIAS`), que es de quien venían. Salía
        de usar `modeloDato()` en vez del dueño real del dato.
     3. Denuncia un descuadre entre un dato del modelo y una cuenta de
        Open-Meteo con la humedad. Eso no es un fallo del modelo: es
        comparar dos cosas distintas.                                   */
{
  ok('la caja mira el dueño REAL de las capas, no el modelo cargado',
     /const omDelTotal = \(\(\) => \{/.test(src)
     && /capasPropias\(omDelTotal\)/.test(src)
     && !/capasPropias\(modeloDato\(\)\.om\)/.test(src),
     'le echaba a AROME un problema que era de ECMWF');
  ok('con capas calculadas NO dice que se comparen',
     /ese modelo no publica las capas<\/b>: se las calcula/.test(src),
     'un dato y una cuenta con la humedad no se comparan entre sí');
  ok('y entonces tampoco denuncia el descuadre',
     /cap\.noCuadra && mismos && capasPropias\(omDelTotal\) === true/.test(src),
     'el descuadre solo es del modelo si las capas son suyas de verdad');
  ok('pero si las capas SÍ son del modelo, el aviso sigue',
     /el descuadre es del propio modelo/.test(src),
     'con ICON o GFS las capas son suyas: ahí un descuadre sí es un fallo');
  /* Y la tabla que dice quién publica sus capas de verdad, intacta:
     sale de la documentación de cada modelo, no de una suposición. */
  ok('la tabla de quién publica sus capas sigue en pie',
     /const CAPAS_PROPIAS = \{[\s\S]*?ecmwf_ifs025: false[\s\S]*?\}/.test(src)
     && /meteofrance_arome_france_hd: false/.test(src));
}

/* ═══════════════════════════════════════════════════════════════════
   TODOS LOS SOLES Y NUBES, DE LA MISMA PUERTA
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026:
     *«los iconos del tiempo, sol nubes, en las capas de Mar, AROME, Mis
       estaciones… ¿están sincronizados?»*
     y antes, más claro: *«los iconos lo mismo, que en uno ponga sol y en
     el otro nubes»*.

   Lo estaban —todos pasan por `codigoQueSeVe()`, que antepone el código
   del dueño de la LLUVIA cuando ve agua— pero eso era verdad por
   costumbre, no por candado: cualquier pantalla nueva podía pintar
   `icon(h.code)` a pelo y volver a partir el cielo en dos.

   Esta guardia recorre TODAS las llamadas a `icon(` y exige que el
   código venga de la puerta única. Si mañana alguien mete una a pelo,
   salta antes de publicar.                                            */
{
  const fuera = [];
  /* Los nombres que SÍ salen de la puerta. `cM`, `cT` y `code` los
     producen `codigoFranja`/`cieloPartido`, que se comprueban abajo. */
  /* `t.code`, `v.code` y `R.code` los producen `tramosDeCielo`, `cieloVisto` y
     `resumenCielo` (09-09-2026), que pasan por la puerta: se comprueba abajo. */
  const VALIDAS = new Set(['codVisto', 'cM', 'cT', 'code', 'codigoDiario', 'p.m1', 'p.m2', 't.code', 'v.code', 'R.code']);
  /* El primer argumento entero, con los paréntesis balanceados: la
     primera versión cortaba en el primer «)» y partía en dos el ternario
     `has(cM) ? cM : codigoDiario` (02-09-2026). */
  const primerArg = (txt, i) => {
    let hondo = 0, ini = i;
    for (let j = i; j < txt.length; j++) {
      const c = txt[j];
      if (c === '(') hondo++;
      else if (c === ')') { if (!hondo) return txt.slice(ini, j); hondo--; }
      else if (c === ',' && !hondo) return txt.slice(ini, j);
    }
    return '';
  };
  for (let i = src.indexOf('icon('); i >= 0; i = src.indexOf('icon(', i + 1)) {
    /* `icon(` y no `nowIco`, `pintarIconos`… */
    if (/[A-Za-z0-9_$.]/.test(src[i - 1] || '')) continue;
    const arg = primerArg(src, i + 5).trim();
    if (!arg) continue;
    /* Se parte por ternarios y se exige que CADA rama salga de la puerta. */
    const ramas = arg.split(/\?|:/).map(x => x.trim()).filter(Boolean)
      .filter(x => !/^has\(|^\d+$/.test(x));
    const malas = ramas.filter(x =>
      !x.startsWith('codigoQueSeVe(') && !VALIDAS.has(x.replace(/\)+$/, '')));
    if (malas.length) fuera.push(malas.join('/').slice(0, 40));
  }
  ok('ningún sol ni nube se pinta con un código suelto',
     fuera.length === 0,
     `a pelo: ${fuera.join(' · ')} — tienen que salir de codigoQueSeVe()`);
  ok('y cieloVisto y los tramos de cielo salen de esa misma puerta',
     /function cieloVisto\(h\) \{[\s\S]{0,160}const code = codigoQueSeVe\(h, h\.code\);/.test(src)
     && /function tramosDeCielo\(sel\) \{\n\s*const hs = \(sel \|\| \[\]\)\.map\(h => \(\{ c: codigoQueSeVe\(h, h\.code\)/.test(src),
     'si un día pintan t.code sin pasar por codigoQueSeVe, esto lo para');

  /* Y las tres funciones que los alimentan, que también tienen que pasar
     por la puerta. Son las que producen `cM`, `cT`, `code`, `p.m1/m2`. */
  for (const f of ['codigoFranja', 'cieloPartido']) {
    const i = src.indexOf(`function ${f}(`);
    ok(`${f} saca el código por la puerta única`,
       i >= 0 && /codigoQueSeVe\(h, h\.code\)/.test(src.slice(i, i + 400)),
       'si no, esa pantalla pinta otro cielo que las demás');
  }
  ok('y la puerta sigue siendo una sola función, no una copia por pantalla',
     (src.match(/function codigoQueSeVe\(/g) || []).length === 1);
}

/* ═══════════════════════════════════════════════════════════════════
   Y AL FINAL EL AUTOMÁTICO SALE DEL SELECTOR
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, en cuanto vio el reparto funcionando:
     *«y pregunta, si tengo en AROME etc, ¿para qué sirve el
       Automático?»*

   Para nada. Elegirlo es elegir AROME HD dando un rodeo. Un botón que no
   cambia ni un número solo sirve para hacerle dudar de cuál tiene
   puesto — y eso le costó media tarde ese mismo día.

   No se borra: se esconde y se migra. El id sigue entendiéndose (lo usan
   el vigilante y el parte del servidor, donde SÍ tiene sentido: allí es
   una de tres opiniones que se comparan, no «su modelo»).            */
{
  ok('el Automático ya no sale en el selector de la pantalla',
     /\{ id:'best_match', oculto: true,/.test(src)
     && /MODELS\.filter\(m => !m\.oculto \|\| m\.id === S\.model\)/.test(src),
     'un botón que no cambia nada solo sirve para dudar de cuál tienes');
  ok('pero si alguien lo tenía puesto, se le ve hasta que cambie',
     /!m\.oculto \|\| m\.id === S\.model/.test(src),
     'esconder el que está puesto es peor: no sabría con qué está mirando');
  ok('y al arrancar se le pasa a AROME, que es lo que ya hacía por debajo',
     /if \(S\.model === 'best_match'\) \{ S\.model = 'arome'; LS\.set\('model', 'arome'\); \}/.test(src),
     'no le cambia ningún número: el reparto ya le daba AROME');
  /* Y el del SERVIDOR no se toca: allí es una de tres opiniones. */
  const vig = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
  ok('el best_match del vigilante sigue en pie, que allí es otra cosa',
     /const MODELOS = \['best_match'/.test(vig),
     'en el vigilante son tres opiniones comparadas, no el modelo elegido');
}

/* ═══════════════════════════════════════════════════════════════════
   EL AUTOMÁTICO REPARTE, NO DECIDE
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, después de que le diera tres versiones distintas de
   lo mismo:  *«pues para eso quita el auto, es que me lías»* · *«o pon
   que el auto haga lo del recuadro de antes»*.

   El recuadro prometía que con el Automático el viento y el CAPE salían
   de AROME. No era verdad: `wind_gusts_10m`, `wind_speed_10m`,
   `precipitation` y `cape` NO están en `COMPLEMENTOS`, así que no se
   piden fuera nunca — siempre son del modelo cargado. Con el Automático
   puesto, su racha era del Automático, que cambia de modelo por horas y
   sin avisar, y no está medido contra su estación.

   Ahora sí. Y se comprueba EJECUTANDO las dos funciones.              */
{
  const saca = nom => {
    const i = src.indexOf(`function ${nom}(`);
    return i < 0 ? '' : src.slice(i, src.indexOf('\n}', i) + 2);
  };
  const cuerpo = saca('repartirTodo');
  ok('existe el reparto del Automático y se puede ejecutar', !!cuerpo.length);
  if (cuerpo.length) {
    const LQD = (src.match(/const LO_QUE_DECIDE = \[([^\]]+)\]/) || [])[1] || '';
    /* `repartirTodo` usa las DOS listas desde la segunda pasada: hay que
       darle también COMPLEMENTOS o revienta en el arnés y no en el
       código, que es peor que un rojo. */
    const COMP = (src.match(/const COMPLEMENTOS = \[([\s\S]*?)\n\];/) || [])[1] || '';
    const soloNombres = t => (t.match(/'[a-z_0-9]+'/g) || []).join(', ');
    const repartirTodo = new Function(
      `const LO_QUE_DECIDE = [${soloNombres(LQD)}];\n`
      + `const COMPLEMENTOS = [${soloNombres(COMP)}];\n${cuerpo}\nreturn repartirTodo;`)();
    const conAuto = repartirTodo('best_match');
    ok('con el Automático, la racha y el viento se piden a un modelo con nombre',
       conAuto.includes('wind_gusts_10m') && conAuto.includes('wind_speed_10m'),
       'era del Automático, que cambia de modelo por horas y sin avisar');
    ok('y la lluvia y el CAPE, igual',
       conAuto.includes('precipitation') && conAuto.includes('cape'));
    ok('y la dirección va con el viento, que si no son dos modelos en la misma flecha',
       conAuto.includes('wind_direction_10m'));
      /* LA TAPA TAMBIÉN, y esto lo cazó la SEGUNDA pasada del 02-09-2026
       —suyo: *«revisas 2 veces que no tengas fallos y que tras los
       cambios lo de los modelos no vaya todo al garete»*—. La tapa está
       en `COMPLEMENTOS`, que solo se piden fuera cuando FALTAN, y desde
       que el Automático se mide ya no falta: se quedaba en él. Con el
       CAPE es la pareja que dice si rompe. */
    ok('y la tapa, el isocero y la visibilidad tampoco se le dejan',
       ['convective_inhibition', 'freezing_level_height', 'visibility']
         .every(k => conAuto.includes(k)),
       'la tapa con el CAPE decide si rompe: no puede salir del que cambia solo');
    ok('en realidad NADA se le deja al Automático',
       (() => {
         const comp = (src.match(/const COMPLEMENTOS = \[([\s\S]*?)\n\];/) || [])[1] || '';
         const todos = [...new Set((comp.match(/'[a-z_0-9]+'/g) || []).map(x => x.slice(1, -1)))];
         return todos.every(k => conAuto.includes(k));
       })(),
       'no es un modelo: es Open-Meteo cambiando de modelo por horas y sin avisar');
  ok('pero con un modelo de verdad cargado NO se le quita nada suyo',
       repartirTodo('meteofrance_arome_france_hd').length === 0
       && repartirTodo('ecmwf_ifs025').length === 0
       && repartirTodo('icon_seamless').length === 0,
       'eso sería volver al reparto que él quitó con «como windy»');
  }
  /* Y que el reparto se APLIQUE en las dos cargas, no solo se declare:
     es el fallo del 30-08 —una pantalla con la regla y la otra sin ella—
     y por eso `paridad.cjs` existe. */
  ok('y se aplica en las DOS pantallas, no solo en una',
     (src.match(/\.\.\.repartirTodo\(cargadoYa\)/g) || []).length === 1
     && (src.match(/\.\.\.repartirTodo\(cargado\)/g) || []).length === 1,
     'la ficha y Mis torres tienen que llevar la misma regla');
}

/* ═══════════════════════════════════════════════════════════════════
   LO QUE HAY AHORA, Y DE TAL HORA A TAL HORA LO QUE HABRÁ
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026 a las 19:13, con «Ahora» abierto y diciéndole lo de
   las 07:00 de la mañana siguiente:

     *«en ahora pues mira a esta hora sigue poniendo lo de las 7am etc,
       pues casi lo mismo presente y futuro quiero saber»*
     *«si entro a la app a las 18 quiero saber que hay ya y que habrá
       dentro de 1 hora 2 o 4»*
     *«de tal hora a tal hora abra esto, punto y esto es lo que hay ahora
       mismo»* · *«ya con eso»* · *«nada más sin líos»*

   Y sobre lo de antes, que era «al llegar, sobre las 20:31»:
     *«que sabe cuando llego? no lo entiendo»* — no lo sabía: sumaba el
     viaje a la hora en que él miraba la pantalla, callado.

   Se comprueba EJECUTANDO el agrupador, no leyendo el código.        */
{
  const i0 = src.indexOf('function franjasDeEstado');
  const cuerpo = i0 < 0 ? '' : src.slice(i0, src.indexOf('\n}', i0) + 2);
  ok('el agrupador de franjas existe y se puede ejecutar', !!cuerpo.length);
  if (cuerpo.length) {
    const franjas = new Function(cuerpo + '\nreturn franjasDeEstado;')();
    const base = new Date(); base.setMinutes(0, 0, 0);
    const hs = ['go','go','go','warn','warn','no','go']
      .map((st, k) => ({ st, date: new Date(base.getTime() + k * 36e5) }));
    const f = franjas(hs);
    ok('las horas seguidas con el mismo veredicto se juntan en UNA franja',
       f.length === 4 && f[0].st === 'go' && f[1].st === 'warn'
       && f[2].st === 'no' && f[3].st === 'go',
       `salieron ${f.length} franjas: ${f.map(x => x.st).join(',')}`);
    ok('y empieza en la hora EN CURSO, que es «lo que hay ahora mismo»',
       f[0].ini.getTime() === base.getTime(),
       'si empezara en la siguiente, se saltaría la hora que está mirando');
    const seguidas = ['go','warn','go','warn'].map((st, k) =>
      ({ st, date: new Date(base.getTime() + k * 36e5) }));
    ok('y si cada hora cambia, no se junta nada — no se inventa continuidad',
       franjas(seguidas).length === 4);
  }
  /* Y CON SUS CIFRAS, no solo el veredicto. Suyo, 02-09-2026: *«el
     tiempo que sale ¿de qué es, actual? Y si quiero en 2 horas saber,
     ¿dónde está esa opción? No la busco»*. Si hay que buscar una opción
     para ver un dato, el dato tiene que estar puesto. */
  ok('en Ahora salen las cifras de ahora y de dentro de un rato, no solo el color',
     /const cifras = TRAMOS\.map/.test(src)
     && /trozos\.push\(`<span class="vc__c">/.test(src),
     'las franjas dicen SI algo cruza tus listones, pero no CUÁNTO');
  ok('y son las mismas cuatro horas que en Mis estaciones',
     (src.match(/TRAMOS\s*\n?\s*\.map\(\(\[n, et\]\)/g) || []).length === 2,
     'si cada pantalla elige sus horas, vuelven a no cuadrar entre sí');
  /* ── QUE LAS HORAS SE LEAN COMO HORAS ────────────────────────────
     Suyo, 02-09-2026, con «21–09» delante:  *«y lo de las horas, de qué
     hora, si es actual etc, que se vea más claro»* · *«aquí igual no me
     entero, el tiempo que da de qué hora es a qué hora»*.

     «21–09» se lee como una fecha. Y la fila de cifras de la tarjeta no
     decía de qué momento era, con lo cual parecía de otro. */
  ok('las franjas se leen «ahora a 09:00», no «21–09»',
     /const hh = d => String\(d\.getHours\(\)\)\.padStart\(2, '0'\) \+ ':00'/.test(src)
     && /'ahora hasta' : `de \$\{cuando\(f\.ini\)\} a`/.test(src),
     'un rango sin los dos puntos se lee como una fecha: «21–09»');
  ok('la hora no se dice dos veces en cada tramo',
     !/r\.et\} \$\{reloj\(r\.x\.date\)\}/.test(src)
     && /r\.et\}<\/span><span class="tor__lleg__v">\$\{cifras\(r\.x\)\}/.test(src),
     'la etiqueta ya es «a las 22:00»: repetir el reloj daba «a las 22:00 22:00»');
  {
    const cssC = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
    ok('cada magnitud tiene su color, para distinguirlas de un vistazo',
       ['agua', 'rayo', 'viento', 'temp'].every(f =>
         new RegExp(`\\.cf\\[data-c="${f}"\\]\\{color:`).test(cssC))
       && /data-c="\$\{fam\}"/.test(src),
       'suyo: «a color para distinguir»');
    ok('y el listón manda por encima del color de la magnitud',
       cssC.indexOf('.cf[data-n="warn"]') > cssC.indexOf('.cf[data-c="temp"]'),
       'si la racha se pasa tiene que verse, sea de la familia que sea');
  }
  ok('el semáforo no se dice dos veces: el badge ya lo pone',
     /const et = \(i === 0 && f\.st === c\.st\) \? ''/.test(src),
     '«SIN NADA» salía en el badge y otra vez en la primera franja');
  {
    const cssV = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
    ok('y las cifras de esa caja van en línea, no una por renglón',
     /\.cuando b\{display:inline\}/.test(cssV)
     && cssV.indexOf('.cuando b{display:inline}') > cssV.indexOf('.verdict__l b{display:block'),
     '`.verdict__l b{display:block}` partía «Racha: ahora / 24 km/h / · +1 h»');
  }
  ok('y llevan el día de la semana cuando la franja cruza la medianoche',
     /const cuando = d => \(d\.getDay\(\) === hoyD \? '' : `\$\{DIAS\[d\.getDay\(\)\]\} `\) \+ hh\(d\)/.test(src)
     && /const DIAS = \['domingo', 'lunes'/.test(src),
     'a las nueve de la noche, «las 09:00» son de mañana');
  /* 22-09-2026: y lo dice MIRANDO EL RELOJ. Antes afirmaba «la hora en
     curso» siempre, y las tarjetas no se rehacen solas: entraba a las
     20:50 y a las 21:40 seguían diciendo «de 20:00 a 21:00 · la hora en
     curso» con los datos de las 20:00, badge y rojo de alarma incluidos.
     Es el mismo reparto de tres casos que la pestaña Torre ya tenía. */
  ok('y la fila de cifras de la tarjeta dice de qué hora es, mirando el reloj',
     /class="tor__hora"/.test(src)
     && /const cola = ahora < a_ \? ' · la próxima hora'/.test(src)
     && /: ahora < b_ \? ' · la hora en curso'/.test(src)
     && /de hace \$\{Math\.floor\(\(ahora - b_\) \/ 3600e3\) \+ 1\} h<\/b>, recarga/.test(src),
     'afirmar la hora equivocada en la pantalla con la que reparte gente');
  ok('y son TRES casos, no dos: la copia del monte puede ser de una hora ya pasada',
     (() => { const i = src.indexOf('class="tor__hora"');
       const t = src.slice(i, i + 1800);
       return /la próxima hora/.test(t) && /la hora en curso/.test(t) && /recarga/.test(t); })(),
     'decir «la hora en curso» sin cobertura es mentir justo cuando no se puede comprobar');
  ok('ya NO se le da la hora de mañana cuando pregunta por ahora',
     !/al empezar la jornada: /.test(src),
     'a las 19:13 le decía «a las 07:00 de mañana», que no es lo que mira');
  ok('ni se supone a qué hora sale de casa',
     !/al llegar, sobre las \$\{reloj/.test(src),
     'sumaba el viaje a la hora en que miraba el móvil, sin decirlo');
}

  ok('la línea de llegada se PINTA, no solo se declara',
     /\$\{lineaLlegada\}/.test(src) && /const lineaLlegada = tramos\.length \?/.test(src),
     'la declaré y se me quedó sin insertar en el HTML de la tarjeta');
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('y tiene su estilo, que si no sale como texto suelto',
     /\.tor__lleg\{/.test(css) && /\.tor__lleg__k\{/.test(css));
}

grupo('El ✓ verde que no podía fallar (medido el 30-08-2026)');
{
  /* Suyo, esa noche: «me juego la vida en tomar una decisión» · «¿cómo
     puede haber fallos si repasáis 2 y 3 veces?». Este es la respuesta:
     el repaso miraba que los dos números cuadraran, y NADIE había medido
     de dónde salía cada uno. Salían del mismo sitio — el mapa de alturas
     de Open-Meteo — así que la resta daba 0 siempre y el visto bueno era
     automático. Un guardia que no puede saltar no es un guardia. */
  /* La regla NO cambia y es la más importante de esta caja: con la cota
     automática las dos cifras salen del MISMO mapa de alturas de
     Open-Meteo, así que restarlas da 0 siempre. Antes se explicaba en un
     párrafo de tres líneas. Ahora, más fuerte: **la diferencia no se
     pinta**. No hay número que explicar. */
  ok('con la cota AUTOMÁTICA ya no se afirma que el modelo lee bien el sitio',
     /\(has\(diff\) && !auto\) \?/.test(src)
     && !/Estas dos cifras salen del mismo mapa/.test(src),
     'restaba un número consigo mismo y siempre daba «✓ 0 m de diferencia»');
  ok('y en su lugar manda a lo único que sí distingue: a qué distancia lee',
     /<span><i>lee a<\/i>/.test(src));
  ok('el ✓ solo sale cuando la cota la escribió ÉL, que entonces sí son dos fuentes',
     /has\(diff\) && !auto && Math\.abs\(diff\) >= 80/.test(src),
     'sin cota a mano no hay comparación, así que tampoco aviso');

  /* Y el aviso ROJO tenía el mismo malentendido: decía «el modelo mira un
     punto X m más abajo», cuando esa cifra no es del modelo sino del mapa
     de alturas del punto. Le atribuía al modelo un desacuerdo que es entre
     la cota escrita y el mapa. */
  ok('el aviso rojo ya no le atribuye al modelo una altitud que no es suya',
     /Tu cota y el mapa de alturas no cuadran/.test(src)
     && !/El modelo mira un punto \$\{Math\.abs\(diff\)/.test(src));
}

grupo('El parte juntaba el CAPE de un modelo con la tapa de otro (30-08)');
{
  /* Su pantallazo de las 21:51: BI BERMEO decía arriba «0 de CAPE ·
     tapa 1» y su propia tabla, dos dedos más abajo, «10 · tapa 6». No
     cuadraban porque el máximo de CAPE y el mínimo de tapa se buscaban
     en bucles independientes: modelos distintos y horas distintas. Dos
     cifras que nunca ocurrieron juntas, presentadas como una pareja.

     Y la pareja es SUYA: el 26-08 él mismo la pidió — «¿y CAPE no pones?
     porque tapa pero no hay potencia…». */
  ok('la pareja sale de la MISMA hora y el MISMO modelo',
     /peorPar = \{ cape: cape\[i\], cin: cin\[i\] \}/.test(src)
     && !/if \(has\(cin\[i\]\) && \(minCin === null \|\| cin\[i\] < minCin\)\)/.test(src),
     'antes: max de CAPE por un lado, min de tapa por otro');
  ok('con empate de CAPE gana la tapa más baja, que es la que se acerca a romper',
     /cape\[i\] === peorPar\.cape && cin\[i\] < peorPar\.cin/.test(src));
  ok('y las dos cifras de la PAREJA salen del mismo objeto, no de dos acumuladores',
     /maxCape: peorPar \? peorPar\.cape : null,\s*\n\s*minCin:\s*peorPar \? peorPar\.cin : null/.test(src));
  /* ── Y EL TECHO Y EL SUELO DEL DÍA, QUE SON OTRA COSA (20-09-2026) ──
     Emparejar CAPE y tapa de la misma hora fue el arreglo del 30-08, y sin
     querer mató el del 26-08: con una sola pareja, «hay gasolina Y la tapa
     se abre» es imposible en esta rama —si pasaran a la vez, arriba ya se
     habría marcado que salta—, así que la etiqueta AL FILO no podía salir
     NUNCA y en su lugar se escribía «aguanta» en verde. */
  ok('además se guardan el techo de CAPE y el suelo de la tapa del día entero',
     /if \(capeTecho === null \|\| cape\[i\] > capeTecho\) capeTecho = cape\[i\];/.test(src)
     && /if \(cape\[i\] > 0 && \(tapaSuelo === null \|\| cin\[i\] < tapaSuelo\)\) tapaSuelo = cin\[i\];/.test(src),
     'sin ellos, «AL FILO» es código muerto');
  ok('y «AL FILO» se decide con esos extremos, no con la pareja',
     /const alFilo = has\(d\.capeTecho\) && d\.capeTecho >= CAPE_COMBINACION\s*\n\s*&& has\(d\.tapaSuelo\) && d\.tapaSuelo < TAPA_ROMPE;/.test(src));
  ok('un hueco de CAPE ya no se escribe como «0 de CAPE»',
     !/maxCape: peorPar \? peorPar\.cape : 0/.test(src)
     && /Ninguno de los \$\{CON_TAPA\.length\} que publican la tapa da el CAPE aquí/.test(src),
     'un dato que nadie ha dado no se pinta como un cero tranquilizador');
}

grupo('El pueblo no es tu estación — y buscar pueblos sigue libre (30-08)');
{
  /* Suyo, 22:16: la ficha le decía «tu suelo 36 m» y su caseta está a
     133 — tenía seleccionado el PUEBLO de Bermeo, a 0,9 km y 97 m por
     debajo de su Finca Ganeta. Y acto seguido puso el límite: «si estoy
     de vacaciones en Santander y quiero ir a cenar, también puedo
     buscarlo, ¿no?». Sí: el aviso solo salta si el sitio que mira está
     PEGADO a uno suyo, y solo en Torre. */
  ok('el aviso existe y se llama desde el pintado, no solo se declara',
     /function avisoNoEsTuSitio\(\)/.test(src) && /\n  avisoNoEsTuSitio\(\);/.test(src),
     'el fallo de esta casa: escrito y sin llamar');
  ok('se calla si lo que miras ES uno de los tuyos',
     /if \(S\.saved\.some\(p => key\(p\) === key\(S\.place\)\)\) return;/.test(src));
  ok('y se calla en Santander: solo avisa a menos de 3 km de un sitio suyo',
     /if \(d <= 3 && \(!cerca \|\| d < cerca\.d\)\)/.test(src),
     'buscar un pueblo de vacaciones tiene que seguir funcionando sin ruido');
  ok('solo va en Torre, no en Ahora, que es la del día a día',
     (fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
        .match(/id="noEsTuSitio"/g) || []).length === 1);
  ok('el desnivel solo se dice si es de verdad (25 m o más)',
     /Math\.abs\(dz\) >= 25/.test(src));
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('y tiene su estilo, que si no sale como texto suelto',
     /\.ojo\{/.test(css) && /\.ojo__b\{/.test(css));
}

grupo('Dos horas de llovizna no pintan ocho horas (31-08-2026, 00:05)');
{
  /* Suyo: «en esa franja dice que puede caer poca agua pero nada de sol;
     las demás apps no ponen agua pero ponen sol y nubes, y ésta solo
     nube». MEDIDO en su caseta ese lunes 6-13 h: seis horas a 0,0 mm y
     0 % de probabilidad, cielo de despejado a parcial, y solo las dos
     últimas con 0,1 mm.

     PRIMERO LO INTENTÉ MAL —diluir la llovizna— y el candado lo paró con
     la prueba del 25-08: «el sirimiri no se diluye». Tenía razón: esa
     hora es la que decide. La respuesta era decir LAS DOS COSAS. */
  /* `wmoText` y `WMO` viven en app.js con `const`, así que hay que
     sacarlos a globales o `tituloFranja` revienta al evaluarse. */
  /* Los dos van con `const` en app.js —`WMO` es un objeto y `wmoText`
     una flecha—, así que hay que sacarlos como constantes, no como
     funciones: buscando `function wmoText` no se encuentra nada y
     `tituloFranja` acababa devolviendo «—, con — desde las 12:00». */
  eval(sacarConst('WMO'));
  eval(sacarConst('wmoText'));
  globalThis.codigoQueSeVe = globalThis.codigoQueSeVe || ((h) => h.code);
  eval(sacar('function cieloPartido'));   // texto y dibujo beben de ella
  eval(sacar('function tituloFranja'));
  const H = cs => cs.map(c => ({ code: c }));

  /* Desde el 09-09-2026 la frase cuenta los TRAMOS con su hora, los mismos
     de los que salen los iconos (tramosDeCielo): el agua nunca se absorbe y
     el cielo seco de antes se dice con su nombre. Las horas llevan fecha
     porque la frase dice «desde las HH:00». */
  const HD = cs => cs.map((c, i) => ({ code: c, date: new Date(2026, 8, 1, 12 + i) }));
  const seisYdos = tituloFranja(HD([0, 0, 1, 1, 2, 2, 51, 51]), 51, ' desde las 12:00');
  ok('su caso real: seis horas de cielo y dos de llovizna → se dicen las dos',
     /^Mayormente despejado · parcialmente nuboso desde las 16:00 · llovizna débil desde las 18:00$/.test(seisYdos),
     `antes decía solo «Llovizna débil» para las ocho horas; ahora: «${seisYdos}»`);
  const tresYtres = tituloFranja(HD([2, 2, 2, 51, 51, 51]), 51, '');
  ok('si moja, el agua va en el rótulo con su hora y nunca se diluye',
     /llovizna débil desde las 15:00$/.test(tresYtres) && /^Parcialmente nuboso/.test(tresYtres),
     `salió «${tresYtres}»`);
  ok('una franja seca no cambia nada',
     tituloFranja(H([3, 3, 3, 1]), 3, '') === wmoText(3));
  ok('si moja TODA la franja, tampoco se matiza',
     tituloFranja(H([51, 51, 51]), 51, '') === 'Llovizna débil');
  ok('y el DIBUJO sigue avisando del agua: codigoFranja no se ha tocado',
     codigoFranja(H([0, 0, 0, 51])) === 51,
     'el icono avisa; las palabras informan. Con sirimiri no sube a torre');
}

grupo('Los 10 días pintaban de nube días despejados (31-08-2026, 00:19)');
{
  /* Suyo, comparando con tiempo.com: «en 10 días creo que no». Y no.
     MEDIDO en su caseta, cielo de 08 a 20 h:
        vie 4 sept  la app: cubierto, 33°  →  0 0 0 0 0 0 0 0 0 0 0 0 1
        dom 6 sept  la app: cubierto, 29°  →  0 0 0 0 0 0 0 0 0 0 0 0 0
     Días despejados de sol a sol pintados de cubierto, porque del tercer
     día en adelante se caía al código DIARIO —el peor de las 24 h, que
     en la costa es la nube baja de la madrugada—. */
  ok('los días lejanos leen las horas de los 10 días, no las 48 primeras',
     /const H = S\.data\?\.fc\?\.hourly;/.test(src)
     && !/const hs = \(S\.data\?\.hours \|\| \[\]\)\.filter/.test(src),
     'con S.data.hours solo llegaban dos días y el resto caía al código diario');
  ok('y se quedan las horas del día pedido, comparando la fecha del dato',
     /if \(!String\(H\.time\[i\]\)\.startsWith\(dia\)\) continue;/.test(src));
  ok('cada hora lleva su código de lluvia, para que el agua siga mandando',
     /codeLluvia: H\.weather_code_lluvia\?\.\[i\]/.test(src));

  /* Y la regla que aplica encima, con SUS números medidos: */
  const H = cs => cs.map(c => ({ code: c }));
  ok('viernes 4: doce horas despejadas y una de poco nuboso → NO es cubierto',
     codigoFranja(H([0,0,0,0,0,0,0,0,0,0,0,0,1])) === 0,
     'la app ponía cubierto en un día de 33° y sol de sol a sol');
  ok('domingo 6: despejado entero sigue siendo despejado',
     codigoFranja(H([0,0,0,0,0,0,0,0,0,0,0,0,0])) === 0);
}

grupo('De qué hora a qué hora llueve (31-08-2026, 00:25)');
{
  /* Suyo: «hay que poner claras las cosas: de qué hora a qué hora va a
     llover, o de qué hora a qué hora son las previsiones». Ponía solo el
     comienzo —«desde las 12:00»— y con eso no sabe si espera una hora o
     toda la tarde. Y esperar es lo que hace: «mucha lluvia, cuando cae,
     esperamos a que amaine». */
  ok('se dicen las DOS puntas, no solo el comienzo',
     /` de \$\{hh\(h1\)\} a \$\{hh\(h2\)\}`/.test(src)
     && !/` desde las \$\{String\(empieza\.date\.getHours\(\)\)/.test(src),
     'antes solo salía «desde las 12:00»');
  ok('si moja la franja entera, se dice así y no se repiten las horas',
     /todaLaFranja \? ' toda la franja'/.test(src));
  ok('una sola hora se dice como una sola hora',
     /` solo a las \$\{hh\(h1\)\}`/.test(src));
  ok('y si van sueltas se dice, que no es lo mismo tres seguidas que tres repartidas',
     /en \$\{mojadas\.length\} horas sueltas, entre las/.test(src),
     'el sirimiri de costa va a ratos');
  ok('lo seguido se distingue por los huecos, no a ojo',
     /const seguidas = mojadas\.length === \(h2\.getHours\(\) - h1\.getHours\(\) \+ 1\)/.test(src));
}

grupo('La nota se etiqueta con SU sitio más cercano (31-08-2026, ronda de 4)');
{
  /* Mandó fotos desde Punta Galea —a 30 m de BI PUNTAGALEA, en su
     lista— y llegaron como «a 25 km de BI BERMEO»: la referencia era lo
     seleccionado en pantalla. Verdad inútil. NO es el fallo de Llodio
     del 27-08 (aquel mentía; este referenciaba mal): es la pata que
     faltaba. */
  eval(sacar('function etiquetaDeSitio'));
  const S0 = globalThis.S;
  globalThis.ubiVigente = () => ({ lat: 43.37247, lon: -3.02149 });  // su GPS en Galea
  globalThis.S = {
    place: { name: 'BI BERMEO', lat: 43.4130, lon: -2.7183 },        // lo seleccionado
    saved: [
      { name: 'BI BERMEO', lat: 43.4130, lon: -2.7183 },
      { name: 'BI PUNTAGALEA', lat: 43.3727, lon: -3.0217 },          // a ~30 m del GPS
      { name: 'BI SANTAMAÑA', lat: 43.2602, lon: -2.8656 },
    ],
  };
  ok('desde Galea con BI BERMEO en pantalla → «en BI PUNTAGALEA»',
     etiquetaDeSitio() === 'en BI PUNTAGALEA',
     `salió «${etiquetaDeSitio()}» — antes decía «a 25 km de BI BERMEO»`);

  globalThis.ubiVigente = () => ({ lat: 43.34, lon: -2.95 });        // campo abierto
  ok('lejos de todo, la referencia sigue siendo el suyo MÁS CERCANO, con km',
     /km de BI PUNTAGALEA/.test(etiquetaDeSitio()));

  globalThis.ubiVigente = () => null;                                 // sin GPS
  ok('sin GPS, el seleccionado tal cual — no se disfraza de medición',
     etiquetaDeSitio() === 'BI BERMEO');

  globalThis.S = { place: { name: 'Santander', lat: 43.4623, lon: -3.8100 }, saved: [
      { name: 'BI PUNTAGALEA', lat: 43.3727, lon: -3.0217 } ] };
  globalThis.ubiVigente = () => ({ lat: 43.4620, lon: -3.8095 });
  ok('de vacaciones lejos de sus sitios, la referencia es Santander, no una torre a 60 km',
     /Santander/.test(etiquetaDeSitio()) && !/PUNTAGALEA/.test(etiquetaDeSitio()),
     `salió «${etiquetaDeSitio()}»`);

  globalThis.S = S0;
}

grupo('El modelo por defecto, UNO solo y en las tres capas (31-08-2026)');
{
  /* Suyo, tras el repaso del día: «cuál tendría que estar en automático
     funcionando, piensa bien» · «ojo en las 3 capas: torre, estaciones y
     ahora» · «y no solo el día de hoy».

     Al mirarlo había DOS por defecto distintos para lo mismo: el objeto
     `S` arrancaba en `best_match` —el Automático que él descartó por
     contradecirse en las nubes— y la carga hacía `LS.get('model',
     'arome')` trece mil líneas más abajo. No daba la cara porque la
     carga pisaba al otro casi siempre; pero «casi» no vale cuando de
     esto cuelga qué modelo decide si sube gente, y cualquier pintado
     anterior a esa línea salía con el Automático. */
  const defs = [...src.matchAll(/model\s*:\s*'([a-z_]+)'/g)].map(m => m[1]);
  const gets = [...src.matchAll(/LS\.get\('model',\s*'([a-z_]+)'\)/g)].map(m => m[1]);
  const todos = [...defs, ...gets];
  ok('hay al menos dos sitios que fijan el por defecto (el objeto y la carga)',
     defs.length >= 1 && gets.length >= 1);
  ok('y TODOS dicen lo mismo — ni un best_match suelto',
     todos.length > 0 && todos.every(x => x === todos[0]),
     `salieron: ${[...new Set(todos)].join(', ')}`);
  ok('y ese uno es AROME, el que mide mejor la racha y lee su caseta a 0,4 km',
     todos[0] === 'arome', `por defecto = ${todos[0]}`);

  /* LAS TRES CAPAS BEBEN DEL MISMO SITIO. No basta con que el defecto
     sea uno: hace falta que Torre, Mis estaciones y Ahora lean todas de
     `S.model`/`modeloDato()` y ninguna se guarde su propia copia. */
  ok('ninguna pantalla se fabrica su propio modelo por su cuenta',
     !/S\.view\s*===\s*'(torres|now|tower)'[^\n]*model\s*=/.test(src),
     'una pantalla con su propio modelo es el fallo de las tres pantallas otra vez');
  ok('el nombre que se lee encima de los números sale del DATO, no de lo elegido',
     /modeloDato\s*[=(]/.test(src) && (src.match(/modeloDato\(\)/g) || []).length >= 20,
     'sellado en fc._modelo desde el 24-08: la etiqueta no puede ir por libre');
}

grupo('El 41° que iba solo (31-08-2026, 17:24)');
{
  /* Su pantallazo: viernes 4 con 41° en Bermeo — récord histórico si se
     cumpliera. MEDIDO: ECMWF 41,4 · ICON 34,4 · GFS 30,3 · GEM 26,5.
     Casi 15° de separación y la app enseñaba el 41 a pelo. Meteored
     (ECMWF también) pintaba lo mismo: no es fallo de datos, es que un
     número tan gordo no puede ir sin decir que va solo. Su regla: «si
     están varios modelos de acuerdo, eso da más fiabilidad». */
  eval(sacar('function desacuerdoDelDia'));
  const S0 = globalThis.S;
  globalThis.MODELOS_TORMENTA = [
    { om: 'ecmwf_ifs025', nom: 'ECMWF' }, { om: 'icon_seamless', nom: 'ICON' },
    { om: 'gfs_seamless', nom: 'GFS' }, { om: 'best_match', nom: 'Automático' },
  ];
  /* El estado va SELLADO con el emplazamiento, como en la app de verdad
     desde el 01-09-2026: `deEsteSitio()` no da por bueno un estado sin
     marca, precisamente porque lo que no se puede comprobar no se pinta
     como comprobado. */
  const AQUI = { lat: 43.412976, lon: -2.718316 };
  const SELLO = '43.413,-2.718';
  globalThis.S = { place: AQUI, diariaMulti: {
    clave: SELLO,
    time: ['2026-09-04'],
    'temperature_2m_max_ecmwf_ifs025': [41.4],
    'temperature_2m_max_icon_seamless': [34.4],
    'temperature_2m_max_gfs_seamless': [30.3],
    'temperature_2m_max_best_match': [41.0],
  } };
  const d = desacuerdoDelDia('2026-09-04');
  ok('el caso real: 30° a 41°, con el que va arriba señalado',
     d && Math.round(d.dif) === 11 && d.alto.nom === 'ECMWF' && d.bajo.nom === 'GFS');
  /* ── EL AUTOMÁTICO SÍ CUENTA. CORREGIDO EL 04-09-2026 ─────────────
     Esta prueba defendía lo contrario: que el Automático era «costura,
     no opinión independiente». Se midió pidiendo Bermeo a diez días y
     no era verdad —el domingo daba 65 km/h de racha donde ninguno de
     los otros pasaba de 40, y 30° donde daban 33, 29 y 33—.

     Resultó ser **ARPEGE**, de Météo-France: Open-Meteo sirve AROME HD
     los tres primeros días y salta a ARPEGE cuando AROME se acaba.

     Dejarlo fuera escondía desacuerdo real. Y no hay doble conteo:
     de aquí solo salen el máximo y el mínimo. */
  ok('el Automático cuenta como uno más: trae datos propios, medido el 04-09',
     d.n === 4, `contó ${d.n}`);
  ok('y el rango sigue saliendo de los extremos, repita quien repita',
     d.alto.v === 41.4 && d.bajo.v === 30.3,
     'un modelo que coincide con otro no puede mover la horquilla');
  globalThis.S = { place: AQUI, diariaMulti: { clave: SELLO, time: ['2026-09-04'],
    'temperature_2m_max_ecmwf_ifs025': [41.4], 'temperature_2m_max_icon_seamless': [40.9] } };
  ok('con solo dos modelos no se afirma acuerdo ni desacuerdo',
     desacuerdoDelDia('2026-09-04') === null);
  globalThis.S = { diariaMulti: null };
  ok('sin la comparación cargada, no se dice nada — un hueco no es un acuerdo',
     desacuerdoDelDia('2026-09-04') === null);
  ok('la tarjeta pinta el aviso de la máxima desde 4° de separación (17-09-2026, antes 6°)',
     /const maxTxt = D\.dif < 4 \? '' : /.test(src),
     'por debajo bailan siempre; una marca diaria no marca nada');
  /* 17-09-2026 11:20, sábado en Bermeo: máximas a 4° (calla), mínimas de 9,6 a 15,1 y la tarjeta callaba. Él: «si es para bien, sí». */
  globalThis.S = { place: AQUI, diariaMulti: { clave: SELLO, time: ['2026-09-19'],
    'temperature_2m_max_ecmwf_ifs025': [23.7], 'temperature_2m_max_icon_seamless': [22.1], 'temperature_2m_max_gfs_seamless': [25.5], 'temperature_2m_max_best_match': [21.4],
    'temperature_2m_min_ecmwf_ifs025': [9.6], 'temperature_2m_min_icon_seamless': [12.4], 'temperature_2m_min_gfs_seamless': [13.8], 'temperature_2m_min_best_match': [15.1] } };
  const dm = desacuerdoDelDia('2026-09-19');
  ok('la mínima también se mira: el sábado de Bermeo, de 9,6 (ECMWF) a 15,1 (Automático)',
     dm && dm.min && Math.round(dm.min.dif * 10) / 10 === 5.5 && dm.min.bajo.nom === 'ECMWF' && dm.min.alto.nom === 'Automático' && dm.min.n === 4,
     JSON.stringify(dm?.min));
  ok('y la tarjeta pinta la mínima desde 5°, con su texto, y la petición diaria trae temperature_2m_min',
     /const minTxt = !M \|\| M\.dif < 5 \? '' : /.test(src) && /⚠ mínima: de <b>/.test(src)
     && /daily: 'temperature_2m_max,temperature_2m_min,wind_gusts_10m_max,precipitation_sum'/.test(src));
  ok('renderDays aguanta que la comparación llegue antes que los datos',
     /if \(!S\.data\?\.fc\?\.daily\) return;/.test(src),
     'sin el guard, el repintado tumbaba la pestaña entera');
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('y el aviso tiene su estilo', /\.dcard__x\{/.test(css));
  globalThis.S = S0;
}

grupo('La tarde de los tres cuelgues del mapa (31-08-2026, 17:37-17:40)');
{
  /* «Tomo un café para esperar, poco profesional» · «intolerable» ·
     «así no, eh». 48 s mirando un mapa vacío. Dos causas medidas: el
     castigo de teselas pegado en 1 PARA SIEMPRE desde los OOM del
     sábado, y ECMWF HRES —que tumba el mapa a la 5.ª capa— de modelo
     por defecto y sin que la app se defendiera sola. */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  /* ── 02-09-2026: ARRANCA EN EL EUROPEO DE 9 km ────────────────────
     Suyo: «ponme el mapa como usa windy y vamos a lo seguro socio». Es
     el mismo modelo que pinta Windy, y por la API no se puede tener —
     solo aquí. Lo medido sigue en pie (HRES cae a la 5.ª capa, ICON-EU
     aguanta 9), y por eso lo que esta prueba fija AHORA es la RED: que
     los dos lados arranquen igual y que la marcha atrás siga puesta. */
  /* Y LE MOLESTÓ (Calpe, 06-09-2026 19:20, «va fatal mapas»): cuatro días
     con HRES de fábrica y la red de seguridad saltando a diario. Vuelve
     ICON-EU, que aguanta nueve capas; el europeo de 9 km queda a un toque. */
  ok('el mapa arranca en ICON-EU (06-09: con HRES de fábrica se recargaba a diario) y el europeo de 9 km queda a un toque',
     /LS\.get\('tmodel', 'dwd_icon_eu'\)/.test(M)
     && /model:'dwd_icon_eu'/.test(M) && /'ecmwf_ifs'/.test(M),
     'es el único sitio donde puede tener los 9 km: la API solo da 25');
  ok('y los dos sitios donde se fija el modelo dicen lo mismo',
     (M.match(/'ecmwf_ifs'/g) || []).length >= 2,
     'si uno dice HRES y el otro ICON, el mapa arranca con uno y guarda el otro');
  ok('a la SEGUNDA caída con ECMWF HRES la app se pasa SOLA a ICON-EU',
     /LS\.set\('tmodel', 'dwd_icon_eu'\)/.test(M)
     && /te paso a ICON-EU/.test(M),
     'antes le pedía a ÉL que pulsara un botón mientras el mapa se caía');
  ok('y lo dice claro, con ECMWF HRES a un toque en la barra',
     /ECMWF HRES sigue en la barra/.test(M));
  ok('el castigo de teselas apunta CUÁNDO fue el corte de memoria',
     /torre\.oomCuando/.test(M) && /String\(Date\.now\(\)\)/.test(M));
  /* 14-09-2026: el techo ya no es un 2 fijo, es lo que le toca al aparato
     (3 en un Mac con memoria, 2 en el móvil); HRES va topado aparte. */
  ok('y caduca: 24 h sin cortes → recupera un punto, con techo en lo del aparato (3 Mac, 2 móvil)',
     /Date\.now\(\) - cuando > 24 \* 3600e3/.test(M) && /g < teselasPorDefecto\(\) && Date\.now\(\) - cuando/.test(M),
     'el 3 del 25-08 tumbó el Mac con HRES; HRES va ahora topado a 2 en topeAhora()');
  ok('nunca por debajo de 1 ni por encima del techo probado',
     /Math\.max\(1, ahora - 1\)/.test(M));

  /* Su pregunta que lo destapó: «hace 1 semana los mapas iban de cine,
     ¿por qué ahora como una patata?». El castigo del sábado, permanente.
     La causa ya no existe, así que se levanta YA, no en 24 h. */
  /* «El color del mapa tristón, pálido» · «debería estar en rojo con
     esas altas temperaturas» — con la escala planetaria (−80..50), los
     41° de la ola del viernes salían amarillo pálido. */
  ok('la temperatura tiene escala propia de −20 a 46, no la planetaria',
     /const tpm = \[-20, -10, 0, 5, 10, 15, 20, 25, 30, 34, 38, 42, 46\]/.test(M)
     && /escala:'tempc'/.test(M));
  /* «En la 850 quisiera ver los cambios de verde a rojo… en nuestro
     mapa no se nota nada, entonces esa capa no pinta nada». La capa de
     las masas de aire con la escala de las masas de aire. */
  /* 15-09-2026, con AguaceroWx al lado («y estas quiero como AguaceroWx»): la
     misma rampa que ellos, −10 morado → azul → verde → amarillo → naranja → rojo
     30, continua. */
  ok('la T850 tiene su propia escala de masas, como la de AguaceroWx: morado −10 → rojo 30, continua',
     /const t8m = \[-10, -6, -2, 2, 6, 10, 14, 18, 22, 26, 30\]/.test(M)
     && /const t8c = \[\['#5b2a86',1\], \['#2b4fb5',1\]/.test(M) && /\['#d63a2a',1\], \['#8f1d1d',1\]\]/.test(M)
     && /escala:'t850'/.test(M),
     'la africana del viernes (26° a 850) tiene que salir roja, como en Meteored');
  ok('y el rojo empieza donde quema: 34 rojo, 38 granate, 42 morado',
     /'#e11400'/.test(M) && /'#a80016'/.test(M) && /'#700024'/.test(M),
     'los colores de dia de aires sufriendo en las casetas');

  /* «Mueves 1 hora, esperas 10 segundos». Cronometrado: la precarga
     calentaba OCHO horas (solo el centro de cada una) y la caché de 8 MB
     expulsaba la primera al calentar la octava — cuanto más aire, peor:
     5,3 s DESPUÉS de 9 s quieto. Ahora: la siguiente entera y poco más. */
  ok('la precarga calienta la hora siguiente ENTERA, no ocho a medias',
     /pedir\(en\(d\),\s+visibles\)/.test(M)
     && !/\[d, 2\*d, 3\*d, 4\*d, 5\*d, 6\*d, 7\*d, 8\*d, -d\]/.test(M),
     'ocho medio-calientes no caben en la caché de 8 MB: se autosaboteaba');
  /* 15-09-2026 19:00 (portátil): con los bloques guardados en el CDN (build 2032) y la
     caché de bloques en 32 MB, calentar más por delante ya no se autosabotea: las DOS
     siguientes enteras, el centro de la tercera y casi la de detrás; y con el mapa quieto,
     `calentarLinea()` recorre la línea de tiempo entera de una tesela por hora. */
  /* 15-09-2026 19:20: medido en su Chrome que dos horas enteras + la línea entera de seguido
     dejaban «Cargando Ráfagas… 34 s» y sin barbas. Vuelve lo medido (una entera, el centro de
     la segunda) y la línea de tiempo va aparte: solo con la capa pintada, 12 pasos por
     delante y 6 por detrás, una hora cada medio segundo, y se aborta al tocar. */
  ok('y también la de detrás por si vuelves, y el centro de la de después; la línea de tiempo aparte, suave y abortable',
     /pedir\(en\(-d\), visibles\.slice\(0, 2\)\)/.test(M)
     && /pedir\(en\(2\*d\), \[centro\]\)/.test(M)
     && !/pedir\(en\(2\*d\), visibles\)/.test(M)
     && /async calentarLinea\(\)/.test(M) && /this\._lineaTimer = setTimeout\(\(\) => this\.calentarLinea\(\), 3000\)/.test(M)
     && /idx\.slice\(pos \+ 3, pos \+ 15\)/.test(M) && /await respiro\(500\);/.test(M)
     && /x\.state === 'loaded' \|\| x\.state === 'errored'\)\) \{\n      clearTimeout\(this\._lineaTimer\);/.test(M)
     && (M.match(/if \(this\._lineaAC\) \{ try \{ this\._lineaAC\.abort\(\); \} catch \{\} this\._lineaAC = null; \}/g) || []).length >= 2);

  /* «Pero tarda en cargar mucho» — el cambio de CAPA. En el Mac el
     puntero se posa en el botón un instante antes del clic: ahí ya se
     pide la primera tesela de esa capa. */
  /* Y la limpieza que se comía el precalentado: al clicar una capa, lo
     primero era vaciar la caché — borrando lo que el hover acababa de
     bajar. Ahora solo se vacía con HRES o tras un corte de memoria. */
  ok('la caché solo se vacía con HRES delante o tras faltar memoria',
     /if \(this\.model !== 'ecmwf_ifs' && !this\._sinMemoria\) return;/.test(M),
     'vaciarla siempre mataba el precalentado del ratón y el volver-a-capa');
  /* 14-09-2026: el freno de HRES pasa de setModel() a Peticiones.topeAhora(),
     que rige en cada turno y vale también para el modelo con el que arranca. */
  ok('los modelos ligeros descargan a lo del aparato; HRES sigue frenado a 2 en cada turno',
     /Peticiones\.max = \(g >= 1 && g <= 4\) \? g : teselasPorDefecto\(\);/.test(M)
     && /return modelo === 'ecmwf_ifs' \? Math\.min\(this\.max, 2\) : this\.max;/.test(M)
     && /if \(this\.enCurso < this\.topeAhora\(\)\)/.test(M));
  /* Sus dos peticiones, las dos suyas: 25-08 «apenas se ve el relieve»
     (densas al 0,46) y 31-08 «el contraste, mapas apagados». Solución:
     el tope solo actúa CON el relieve encendido. */
  /* El diseño final del contraste (31-08, tras sus dos pantallazos):
     color PLENO y la sombra del terreno dibujada ENCIMA, suave — el
     truco de Meteored. Ya no se elige entre relieve y color. */
  ok('el color va pleno y la sombra del terreno se dibuja encima, rebajada',
     /* 15-09-2026: las capas de nubes suben a ≥ 0,92 (nube blanca lavada sobre el mar azul acero); el resto sigue al valor del deslizador, nunca por debajo. */
     /const op = L_\.escala === 'nubes' \? Math\.max\(this\.opacity, 0\.92\)\s*: CON_SUELO_NEGRO\.has\(L_\.escala\) \? Math\.max\(this\.opacity, 0\.95\)\s*: this\.opacity;/.test(M)
     && /moveLayer\('hillLayer', this\.firstLabelLayer\(\)\)/.test(M)
     && /'raster-opacity', CON_SUELO_NEGRO\.has\(L_\.escala\) \? 0 : 0\.32/.test(M),
     'sus dos peticiones a la vez: relieve visible y mapa sin lavar (y bajo la lluvia, sombra apagada: 18-09-2026)');
  ok('la T850 vive en el grupo AIRE, al lado de Temperatura 2 m',
     (() => { const i = M.indexOf("id:'temp'"); const j = M.indexOf("id:'t850'");
              return i > 0 && j > i && (j - i) < 400; })(),
     'él la busca donde el aire, no en tormenta');
  /* 14-09-2026: baja a 0,75. Con 0,95 las capas de campo entero tapaban
     el fondo entero y él no veía ni la costa («no se ve nada ni el mapa»). */
  ok('y la capa de datos arranca al 75 %: color de sobra y el fondo se ve debajo',
     /opacity:0\.75,/.test(M));

  ok('los colores van a opacidad plena: sin alphas que laven el rojo a rosa',
     !/'#[0-9a-f]{6}',\.95\]/.test(M.slice(M.indexOf('const tpm'), M.indexOf('const humedad'))),
     '«rosa… y sigue pálido»: el 0,85 de capa por 0,95 de color sobre fondo claro');

  ok('pasar el ratón por un botón de capa ya precalienta esa capa',
     /pointerover/.test(M) && /closest\('\.ovb'\)/.test(M),
     'la intención llega ~1 s antes que el clic, y ese segundo se usa');
  ok('el enganche del ratón se pone UNA vez, no uno por repintado',
     /_hoverPre = true/.test(M));

  ok('el castigo del 30-08 se levanta una única vez al estrenar la versión',
     /torre\.castigoLevantado/.test(M)
     && /localStorage\.setItem\('torre\.teselasALaVez', '2'\)/.test(M),
     'esperar 24 h era castigarle un día más por un problema ya resuelto');
}

grupo('RÁFAGAS: colores vivos y con SUS listones (01-09-2026)');
{
  /* Suyo: «los colores hay que mejorarlos sí o sí, más contraste y más
     vivos». Y esta capa —la que decide si sube alguien— iba con la escala
     de fábrica, la más pálida. Lo importante no es que sea viva: es que
     el color cambia DONDE le cambia la decisión, en sus 45 y sus 60. */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  const cortes = (M.match(/const rfm = \[([^\]]+)\]/) || [])[1] || '';
  const nums = cortes.split(',').map(x => +x.trim());
  const cols = ((M.match(/const rfc = \[([\s\S]*?)\];/) || [])[1] || '').match(/#[0-9a-f]{6}/g) || [];

  ok('la capa de ráfagas ya tiene escala propia',
     /escala:'rafagas'/.test(M) && /const rafagas = \{/.test(M),
     'iba con la de fábrica siendo la capa con la que decide');
  ok('hay tantos colores como cortes (si no, el mapa pinta corrido)',
     nums.length === cols.length, `${nums.length} cortes · ${cols.length} colores`);
  /* 15-09-2026: rampa continua como AguaceroWx, pero con un salto seco en 49 y en 70
     (dos cortes pegados: 48→49 y 69→70), que son los listones del perfil de hierro,
     el que sale por defecto desde el 13-09; el 60 (torre) sigue siendo corte. */
  ok('y los cortes caen EXACTAMENTE en sus listones: 49 y 70 con salto seco (48/49, 69/70), y 60',
     nums.includes(48) && nums.includes(49) && nums.includes(69) && nums.includes(70) && nums.includes(60),
     'el color tiene que cambiar donde le cambia la decisión, no en un número de manual');
  ok('está registrada, si no la capa se queda sin color',
     /presion, visibilidad, tempc, t850, rafagas,/.test(M));
  /* 15-09-2026 19:55 (portátil): la tesela trae la racha en m/s. Con la escala propia se
     perdió la conversión y el mapa marcaba «7» en Madrid con 27 km/h en la API: los
     cortes en m/s y el número por `conv`, como presión y visibilidad. */
  ok('la tesela de racha viene en m/s: los cortes van en m/s (rfm/3,6) y el número en km/h (conv ×3,6)',
     /breakpoints: rfm\.map\(k => k \/ 3\.6\)/.test(M) && /conv: v => v \* 3\.6,/.test(M),
     'sin esto el naranja de 49 km/h solo saldría con 176 km/h: la capa que decide, siempre en calma');
  ok('la barra de la leyenda lleva TODOS los cortes (nada de recortar el último)',
     /eje: rfm, unidad: 'km\/h', pos: rfm\.map/.test(M),
     'con la temperatura se recortó el último y su color no salía en la barra');

  /* CAPE, la segunda de las tres que deciden, también con sus cortes. */
  const cpm = ((M.match(/const cpm = \[([^\]]+)\]/) || [])[1] || '').split(',').map(x => +x.trim());
  const cpc = ((M.match(/const cpc = \[([\s\S]*?)\];/) || [])[1] || '').match(/#[0-9a-f]{6}/g) || [];
  ok('CAPE ya tiene escala propia, no la pálida de fábrica',
     /escala:'capeE'/.test(M) && /const capeE = \{/.test(M));
  ok('y sus cortes son los suyos: 300, 700 y 1000',
     cpm.includes(300) && cpm.includes(700) && cpm.includes(1000),
     '700 es el listón de la combinación calibrado con Lekeitio y Durango');
  ok('con tantos colores como cortes',
     cpm.length === cpc.length, `${cpm.length} cortes · ${cpc.length} colores`);
}

grupo('El sustituto del mapa llega a donde miras (01-09-2026, suyo)');
{
  /* Lo encontró él siguiendo tifones: puso GFS, pidió CAPE —que GFS no
     publica como capa— y la app se lo sustituyó por ICON-EU estando en
     Filipinas. Cartel de «sustituida», mapa en blanco y «sin dato». */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  ok('la lista de sustitutos se ordena según dónde está el mapa',
     /const c = this\.map\?\.getCenter\?\.\(\);/.test(M)
     && /return enEuropa \? \[\.\.\.EUROPEOS, \.\.\.GLOBALES\] : \[\.\.\.GLOBALES, \.\.\.EUROPEOS\];/.test(M),
     'un modelo europeo no sirve de sustituto en Asia por muy fino que sea');
  ok('en Europa siguen mandando los finos de aquí, que es su trabajo',
     /enEuropa = c\.lat > 27 && c\.lat < 72 && c\.lng > -32 && c\.lng < 45;/.test(M));
  ok('y los de área limitada no se quitan, solo se ponen detrás',
     /\[\.\.\.GLOBALES, \.\.\.EUROPEOS\]/.test(M),
     'si el mapa vuelve a Euskadi, vuelven a ser los primeros');
}

grupo('El veredicto de trabajo, solo en SUS sitios (01-09-2026)');
{
  /* Suyo, mirando Manila y Panamá por curiosidad: «¿si voy a cenar a
     Santander pongo Santander y me dice todo eso?». Sus listones en un
     sitio donde no va a subir a nada son ruido — y el ruido es lo que
     hace que un día no lea el aviso que sí importa. */
  ok('el veredicto se apaga cuando el sitio no es suyo',
     /const suyo = !!\(S\.place && \(S\.saved \|\| \[\]\)\.some\(p => key\(p\) === key\(S\.place\)\)\);/.test(src)
     && /cajaV\.dataset\.ajeno = suyo \? '' : 'si';/.test(src));
  ok('y se dice POR QUÉ, con cómo activarlo si va a trabajar allí',
     /Este sitio no es tuyo/.test(src) && /guárdalo con el <b>♥<\/b>/.test(src),
     'apagarlo sin explicarlo sería otro hueco callado');
  ok('el TIEMPO se sigue viendo entero: lo que se quita es el juicio, no el dato',
     /#verdict\[data-ajeno="si"\]\{display:none\}/.test(
       fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8')),
     'solo se oculta la tarjeta del veredicto');
}

grupo('Huracanes y tormentas tropicales, sin comer pantalla (01-09-2026)');
{
  /* Suyo, enseñando el seguidor de Windy: «me gustaría seguirlo… esto ya
     por hobby». Y a la vez: «hay avisos que ocupan mucha web». Las dos
     cosas: se pone, pero solo cuando hay algo. */
  ok('solo se pinta cuando hay tormentas activas',
     /if \(!t\.length\) \{ caja\.hidden = true; dentro\.innerHTML = ''; return; \}/.test(src),
     'si no hay ninguna, no puede ocupar ni un renglón');
  ok('y si no se puede leer, se DICE en vez de esconderse',
     /Eso no quiere decir que no las haya/.test(src),
     'una tarjeta escondida por un fallo se lee como «no hay tormentas»');
  ok('la velocidad va en km/h, no en nudos',
     /x\.vientoKmh \+ ' km\/h'/.test(src) && /avanza a \$\{x\.avanceKmh\} km\/h/.test(src));
  ok('se dice lo que la lista NO cubre (los tifones del Pacífico oeste)',
     /esc\(j\.cubre\)/.test(src),
     'media verdad en una lista de tormentas es peor que no tenerla');
  ok('las fotos del buzón se han quitado, que ya no se usan',
     !/btnCampoCamara/.test(html) && !/btnCampoFoto/.test(html),
     'las manda por el chat desde que se suspendió el almacén');
}

grupo('EL MAPA AVISA AUNQUE MIRES AL OTRO LADO DEL MUNDO (01-09-2026)');
{
  /* Salió probando su idea de seguir tifones: con ICON-EU puesto y el
     mapa en Filipinas, la app NO decía nada — mapa en blanco y la barra
     diciendo «ICON-EU · 7 km» tan tranquila. El aviso solo miraba su
     emplazamiento, y Bermeo no estaba en pantalla. Un mapa en blanco se
     lee «aquí no hay viento». */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  ok('si su sitio no está a la vista, se mira el CENTRO del mapa',
     /const centro = this\.map\.getCenter\(\);/.test(M)
     && /punto = enVista \? \{ lat: p\.lat, lon: p\.lon, suyo: true \}/.test(M),
     'mirando Filipinas con un modelo europeo, el mapa salía en blanco sin decir por qué');
  ok('y la lectura se hace en ese punto, no en el suyo',
     /getValueFromLatLong\(punto\.lat, punto\.lon/.test(M)
     && !/getValueFromLatLong\(p\.lat, p\.lon/.test(M));
  ok('el consejo se decide por DÓNDE está, no por de quién es el sitio',
     /const dentroDeEuropa = punto\.lat > 27 && punto\.lat < 72/.test(M)
     && /\+ \(dentroDeEuropa/.test(M)
     && !/punto\.suyo \? `Para Euskadi/.test(M),
     'en su pantallazo salía «Para Euskadi: AROME HD» estando en Manila, porque Manila era su sitio abierto');
  ok('y fuera de Europa manda GFS, que es lo que él usa allí',
     /Fuera de Europa, <b>\$\{globales\}<\/b>/.test(M)
     && /para huracanes y tifones, el primero/.test(M));
}

grupo('POR DEFECTO LA CASETA, NO LA TORRE (01-09-2026, suyo)');
{
  /* Suyo: «la altura es la caseta, a la torre decido yo si se sube o no».
     Estaba por defecto en 40 m, o sea estimando el viento arriba de la
     torre cuando el 90 % de su trabajo es a pie de caseta y en un poste
     de 3 m. De 10 a 40 m el viento se multiplica por 1,36 de mediana en
     Euskadi: una racha de 33 se le pintaba como 45, justo su listón. */
  ok('la altura de fábrica es 10 m (a pie de caseta), no 40',
     /S\.hgt\s*=\s*LS\.get\('hgt', 10\)/.test(src),
     'con 40 por defecto, la app le frena por un viento que no está donde trabaja');
  /* La fila de once botones se quitó el 02-09-2026 —suyo: *«esto fuera,
     la altura la marca las coordenadas de la estación»*— y la altura pasó
     a vivir en «Ajustar», por emplazamiento. Lo que se sigue exigiendo es
     que ALLÍ se diga que 10 es la caseta: es el malentendido que le costó
     leer «36 m» como altura de trabajo cuando era la altitud. */
  /* 20-09-2026: la altura de trabajo ya no se pide en Ajustar; Mis
     estaciones va siempre a pie de caseta y lo dice en el pie. */
  ok('la altura de trabajo ya no se pide en Ajustar: Mis estaciones va a pie de caseta y lo dice',
     !/Altura de trabajo <small>10 = a pie de caseta<\/small>/.test(src)
     && !/class="hbtn/.test(src)
     && /A pie de caseta · a \$\{ALTURA_CASETA\} m/.test(src),
     'suyo: «eso de trabajo a 40 metros fuera, solo a pie de caseta, resto sobra»');
  ok('las alturas de arriba siguen estando, que subir es decisión suya',
     /const HEIGHTS = \[10, 20, 30, 40/.test(src),
     'no se le quita la herramienta: se le quita el valor por defecto equivocado');
}

grupo('CADA EMPLAZAMIENTO CON SUS DATOS, NO CON LOS DEL DE AL LADO (01-09)');
{
  /* Suyo, y es la escena que hay que evitar:
       «le digo a mi compañero: oye, sube ahora que no da agua y cambia el
        fusible… y llega allí y zasca, agua. O rayos.»
     El fallo que lo permitía: `assess()` corre dentro de `buildHours()`
     para los VEINTE emplazamientos del parte, pero `peorRacha()` leía
     `S.comparativa`, que es solo del sitio ABIERTO. Cada fila se pintaba
     con las rachas medidas EN OTRO SITIO. */
  /* COMPARAR se le da hecha: `sacarConst` corta en el primer «;» y esa
     lista no cabe. Lo que se prueba aquí es el SELLO del sitio, no el
     contenido de la lista. */
  eval(sacar('function peorRacha('));

  const antes = { comp: S.comparativa, place: S.place };
  const h = { date: new Date('2026-09-01T14:00'), gust: 50, gust10: 50 };
  /* La hora se escribe COMO LA BUSCA la función (el arnés corre a nueve
     horas distintas del día y un literal se desplazaba). */
  const isoH = new Date(h.date.getTime() - h.date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 13) + ':00';
  /* La columna se escribe con el modelo que el arnés tenga en COMPARAR:
     el banco usa modelos de mentira (a, b, c…) y un nombre real no casaba. */
  const unModelo = COMPARAR[0].om;
  S.comparativa = { _sitio: key({ name: 'BI BERMEO', lat: 43.413, lon: -2.718 }),
    hourly: { time: [isoH], [`wind_gusts_10m_${unModelo}`]: [80] } };

  ok('con la comparativa de OTRO sitio, no se usa (mejor sin ella que con la ajena)',
     peorRacha(h, { name: 'BI SOLLUBEMENDI', lat: 43.3698, lon: -2.7628 }) === null,
     'antes pintaba la fila de Sollube con las rachas medidas en Bermeo');
  const propio = peorRacha(h, { name: 'BI BERMEO', lat: 43.413, lon: -2.718 });
  ok('y con la del sitio que toca, sí se usa',
     propio?.v10 === 80,
     `devolvió ${JSON.stringify(propio)} · sello=${S.comparativa._sitio} · COMPARAR=${(globalThis.COMPARAR||[]).map(m=>m.om).join(',')}`);
  /* Sin argumento se juzga contra el sitio ABIERTO. Desde el 01-09-2026
     eso también se comprueba —antes, sin argumento, no se miraba el sello
     y la vista de un sitio podía pintar la comparativa del anterior. */
  const antesPlace = S.place;
  S.place = { name: 'BI BERMEO', lat: 43.413, lon: -2.718 };
  ok('sin sitio (la pantalla del sitio abierto) usa la del sitio ABIERTO',
     peorRacha(h)?.v10 === 80,
     'la vista de un solo sitio no puede perder su comparación');
  S.place = { name: 'BI SOLLUBEMENDI', lat: 43.3698, lon: -2.7628 };
  ok('y si el sitio abierto es OTRO, tampoco se usa',
     peorRacha(h) === null,
     'antes, sin argumento, no se comprobaba nada: se colaba la del sitio anterior');
  S.place = antesPlace;
  S.comparativa = antes.comp; S.place = antes.place;

  /* Y que el parte evalúe cada fila con SU sitio. */
  ok('el parte construye las horas de cada emplazamiento con SU sitio',
     /buildHours\(fc, ALTURA_CASETA, p\)/.test(src)
     && /assess\(h, S\.thr, S\.perfil, place \?\? S\.place\)/.test(src),
     'con veinte sitios, evaluar todos con el abierto es mandar con el color de otro');
  ok('y la comparativa lleva grabado de qué sitio es',
     /d\._sitio = key\(place\);/.test(src),
     'sin sello, nadie puede comprobar que es la suya');
}

grupo('EL SOL DE LA MAÑANA NO SE BORRA (01-09-2026, su queja de siempre)');
{
  /* Suyo: «me mosqueo cuando dice esta mañana sol, ya al mediodía nube, y
     me dibuja una nube para todo el día». Y era una cuenta tonta: se
     partía POR LA MITAD, así que una mañana de 6 a 13 con sol de 8 a 10 y
     nubes de 11 a 13 tiene 4 de nube contra 3 de sol → dominante nube →
     y como la tarde también era nube, UNA sola nube para el día.
     Ahora el corte se busca donde cambia el cielo. */
  eval(sacar('function cieloPartido'));

  const h = c => ({ code: c });
  const solYLuegoNube = [1, 1, 0, 1, 3, 3, 3, 3].map(h);
  const p = cieloPartido(solYLuegoNube);
  ok('con sol de 8 a 10 y nubes desde las 11, el día se parte en DOS',
     !!p && p.m1 <= 1 && p.m2 >= 2,
     p ? `${p.m1} → ${p.m2}, corte en ${p.corte}` : 'devolvió null: le borraría el sol');
  ok('y parte DONDE cambia, no por la mitad',
     !!p && p.corte === 4,
     p ? `corte ${p.corte} (por la mitad serían 4 de 8… aquí coincide, ver siguiente)` : '');

  /* El caso que lo demuestra: el cambio NO cae en la mitad. */
  const tardeQueSeAbre = [3, 3, 3, 3, 3, 1, 1].map(h);   // nubes y despeja al final
  const q = cieloPartido(tardeQueSeAbre);
  ok('un cambio que NO está en la mitad también se pilla',
     !!q && q.corte === 5,
     q ? `corte ${q.corte} (la mitad habría sido 3)` : 'no lo pilló');

  ok('si el cielo no cambia de grupo, NO se parte (nada de partir por partir)',
     cieloPartido([3, 3, 3, 3, 3].map(h)) === null
     && cieloPartido([1, 0, 1, 0, 1].map(h)) === null);
  ok('con agua no se parte: el agua manda y se dice entera',
     cieloPartido([1, 1, 1, 53, 3, 3].map(h)) === null);
  ok('con menos de 4 horas tampoco: no hay tramo que partir',
     cieloPartido([1, 3, 3].map(h)) === null);

  /* Y que las TRES pantallas beban de esta misma función, que es lo que
     él pide: «pero en Ahora, Mis estaciones y donde sea». */
  ok('la franja, sus dos iconos y el día de 10 días usan la MISMA función',
     (src.match(/cieloPartido\(/g) || []).length >= 3,
     'si cada pantalla se hace su cuenta, vuelven a discrepar');
  ok('y el dibujo del día parte por donde dicen los tramos, no por el reloj',
     /const R = resumenCielo\(delDia\);/.test(src)
     && /R\.partes\.map\(t => `<i>\$\{icon\(t\.code, d\)\}/.test(src),
     'desde el 09-09 el día pinta un icono por tramo de resumenCielo, la misma función que la franja');
}

grupo('La racha que la tarjeta de 10 días te escondía (01-09-2026)');
{
  /* MEDIDO por /om en Bermeo: dom 6 sept la tarjeta pintaba 37 EN VERDE
     (ECMWF, que es quien rellena del día 3 en adelante) y ICON daba 54 —
     por encima de su aviso de 45. Mar 9: tarjeta 35, Automático 46. En la
     pantalla con la que planifica la semana. */
  eval(sacar('function rachaDelDiaQueNoVesTu'));
  const antesThr = S.thr, antesD = S.diariaMulti;
  S.thr = { ...(S.thr || {}), gustWarn: 45, gustNo: 60 };

  const dia = '2026-09-06';
  /* Con sello del sitio, como en la app desde el 01-09-2026. */
  S.place = S.place || { lat: 43.412976, lon: -2.718316 };
  S.diariaMulti = { clave: `${S.place.lat.toFixed(3)},${S.place.lon.toFixed(3)}`, time: [dia],
    wind_gusts_10m_max: [37.1],                        // lo que pinta la tarjeta
    wind_gusts_10m_max_ecmwf_ifs025: [37.1],
    wind_gusts_10m_max_icon_seamless: [54.0],          // el que cruza su aviso
    wind_gusts_10m_max_gfs_seamless: [31.0],
    wind_gusts_10m_max_best_match: [43.2] };
  const R = rachaDelDiaQueNoVesTu(dia);
  /* El listón es el del PERFIL (listonRafaga, 09-09-2026): en caseta, la
     bestia de 70 avisa desde 49, no los 45/60 de subir. «Eso no es así». */
  ok('salta cuando otro modelo cruza su listón y la tarjeta no',
     !!R && Math.round(R.peor.v) === 54 && R.listón === 49,
     R ? `${R.peor.nom} ${R.peor.v}` : 'no saltó — el domingo 6 se leería como día tranquilo');

  /* Y NO salta cuando todos están del mismo lado: un aviso que sale
     siempre no avisa de nada (la lección de las catorce horas rayadas). */
  S.diariaMulti = { clave: `${S.place.lat.toFixed(3)},${S.place.lon.toFixed(3)}`, time: [dia],
    wind_gusts_10m_max: [29],
    wind_gusts_10m_max_ecmwf_ifs025: [29],
    wind_gusts_10m_max_icon_seamless: [36],
    wind_gusts_10m_max_gfs_seamless: [9] };
  ok('y se calla cuando ninguno cruza, aunque se separen 27 km/h',
     rachaDelDiaQueNoVesTu(dia) === null,
     'el criterio es SU listón, no un porcentaje inventado');

  /* El caso del tope, que es el que le vuelca el remolque. */
  S.diariaMulti = { clave: `${S.place.lat.toFixed(3)},${S.place.lon.toFixed(3)}`, time: [dia],
    wind_gusts_10m_max: [50],
    wind_gusts_10m_max_ecmwf_ifs025: [50],
    wind_gusts_10m_max_icon_seamless: [72] };
  const T = rachaDelDiaQueNoVesTu(dia);
  ok('y si otro cruza su TOPE, se dice con el tope',
     !!T && T.listón === 70, T ? `listón ${T.listón}` : 'no saltó');

  S.thr = antesThr; S.diariaMulti = antesD;
  ok('la tarjeta pinta ese aviso',
     /rachaDelDiaQueNoVesTu\(t\)/.test(src) && /tu listón es \$\{wtxt\(R\.listón, true\)\}/.test(src));
}

grupo('Las barbas: 20 s → medio segundo, y en km/h (01-09-2026)');
{
  /* MEDIDO con cronómetro sobre lo publicado, capa de RÁFAGAS con
     ICON-EU —la que más mira y con la que decide—: 20,3 s con barbas y
     0,7 s sin ellas. Eran 192 lecturas ENCADENADAS. */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  const fn = M.slice(M.indexOf('async barbas()'), M.indexOf('async barbas()') + 9000);

  ok('las barbas se leen en tandas, no una detrás de otra',
     /const TANDA = \d+;/.test(fn) && /await Promise\.all\(puntos\.slice/.test(fn),
     '192 await encadenados costaban 20 s en la capa que decide');
  /* 21-09-2026: NO hay barbas. Medido en producción, la librería devuelve
     la componente oeste-este cuando se le pide la norte-sur, así que u = v
     y las 33 barbas de la pantalla apuntaban todas del suroeste. Esta
     prueba pedía lo contrario: pedía el fallo. */
  ok('componentes() no promete unas componentes que la librería no sabe dar',
     (() => { const i = M.indexOf('  componentes(L_) {');
       const cuerpo = M.slice(i, M.indexOf('\n  },', i));
       return i > 0 && /\n\s*return null;\s*$/.test(cuerpo)
           && !/return \{ u:/.test(cuerpo); })(),
     'con u = v, atan2(-u,-u) da 225° fijo: todas las barbas del suroeste, siempre');
  ok('y las dos componentes de cada barba, a la vez',
     /await Promise\.all\(\[\s*\n\s*OMWeatherMapLayer\.getValueFromLatLong/.test(fn));
  ok('sigue pudiendo abandonar si él cambia de capa o mueve el mapa',
     /if \(this\._marcaBarbas !== marca\) return;/.test(fn),
     'sin esto, un cambio de capa dejaría pintando barbas viejas');
  ok('el globito de la barba va en km/h, nunca en nudos',
     /title="\$\{\(ms \* 3\.6\)\.toFixed\(0\)\} km\/h"/.test(fn)
     && !/title="\$\{kt\.toFixed\(0\)\} kt"/.test(fn),
     'su norma desde el 27-08: kilómetros hora siempre');
  ok('pero el DIBUJO sigue en nudos, que es como está definido el símbolo',
     /svgBarba\(kt, desde\)/.test(fn));

  /* Y el interruptor que no encendía nada: toda capa que dice llevar
     flechas tiene que poder sacarlas de verdad. */
  const capas = [...M.matchAll(/\{ id:'([a-z0-9]+)',[^}]*?v:'([a-z0-9_]+)'[^}]*?\}/g)]
    .map(m => ({ id: m[1], v: m[2], flechas: /arrows:\s*true/.test(m[0]) }));
  ok('se han encontrado capas del mapa que revisar', capas.length >= 10, `${capas.length} capas`);
  const mentirosas = capas.filter(c => c.flechas
    && c.v !== 'wind_gusts_10m' && !c.v.startsWith('wind_u_component_'));
  ok('ninguna capa dice llevar flechas sin poder dibujarlas',
     mentirosas.length === 0,
     mentirosas.length ? `mienten: ${mentirosas.map(c => `${c.id} (${c.v})`).join(', ')}` : '');
  ok('la capa de RÁFAGAS ya no promete flechas que no salen',
     !/id:'gusts',[^}]*arrows:\s*true/.test(M) && /PROBADO Y RETIRADO EL MISMO DÍA/.test(M),
     'se intentó darle dirección y la librería no abría el fichero: mejor no prometerlo');
}

grupo('PARA SIEMPRE: km/h, y ningún texto manda a donde no hay (01-09-2026)');
{
  /* Suyo, viendo la Guía en su pantallazo del 01-09: la chuleta ponía
     «Ráfagas · kt» y «Viento 10/20/50/100 m · kt» — cuando su norma es de
     hace días y no admite matices: *«kilómetros hora siempre, memoriza»*.
     Y encima mandaba «a la pestaña Torre», que dejó de existir el 31-08
     al fusionarla con Ahora.

     Él lo dijo así: *«pero para siempre, no momentáneo»*. Así que esto no
     arregla los tres textos: impide que vuelva a haber uno. */
  const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  /* 1 · NINGUNA ETIQUETA DE UNIDAD EN NUDOS. El selector kt/m/s de la
     pantalla es OTRA cosa —ahí él elige— y por eso se mira solo el
     rótulo de unidad de la Guía (`q__t`), que es texto fijo. */
  const rotulos = [...HTML.matchAll(/<div class="q__t">.*?<span>([^<]*)<\/span>/g)].map(m => m[1].trim());
  ok('la Guía tiene rótulos de unidad que revisar (si no, la prueba miente)',
     rotulos.length >= 5, `${rotulos.length} rótulos`);
  ok('ninguno va en nudos: km/h siempre, que es su norma',
     !rotulos.some(u => /^kt$/i.test(u)),
     `en nudos: ${rotulos.filter(u => /^kt$/i.test(u)).join(', ')}`);

  /* 2 · NINGÚN TEXTO MANDA A UNA PESTAÑA QUE NO EXISTE. Se sacan las
     pestañas de verdad del menú y se comprueba que toda frase del tipo
     «la pestaña X» nombre una que esté. */
  const pestañas = [...new Set([...HTML.matchAll(/class="tab[^"]*"[^>]*>([^<]+)</g)]
    .map(m => m[1].trim().toLowerCase()))];
  ok('se han encontrado las pestañas del menú', pestañas.length >= 8, pestañas.join(', '));

  /* Solo lo que SE VE. Los comentarios del código guardan la historia del
     proyecto —«la pestaña Torre enseñaba 0,0 mm» es un hecho de agosto y
     tiene que poder escribirse— así que se quitan antes de mirar. Lo que
     no puede pasar es que un texto DE PANTALLA mande a una pestaña que
     ya no está. */
  const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const citadas = [...new Set([
    ...[...HTML.matchAll(/pestaña\s+«?([A-ZÁÉÍÓÚ][\wáéíóúñ]+)»?/g)].map(m => m[1].toLowerCase()),
    ...[...sinComentarios.matchAll(/pestaña\s+«?([A-ZÁÉÍÓÚ][\wáéíóúñ]+)»?/g)].map(m => m[1].toLowerCase()),
  ])].filter(n => !['de', 'del', 'que', 'con', 'la', 'el'].includes(n));

  const fantasmas = citadas.filter(n => !pestañas.some(p => p.includes(n) || n.includes(p)));
  ok('ningún texto manda a una pestaña que ya no existe',
     fantasmas.length === 0,
     fantasmas.length ? `nombra: ${fantasmas.join(', ')} · hay: ${pestañas.join(', ')}` : '');
}

grupo('Sus avisos al móvil no dependen del almacén (01-09-2026)');
{
  /* Vercel suspendió el almacén y con él se fueron los avisos de tormenta
     a su teléfono. Él: «no voy a pagar por subir fotos a la app» — y las
     fotos eran 6,5 de los 6,8 MB, mientras que la lista de móviles pesa
     1,2 KB. Así que los avisos salen de dos sitios: el almacén cuando va,
     y una variable de entorno cuando no. Gratis. */
  const SUS = fs.readFileSync(path.join(__dirname, 'api', 'suscribir.mjs'), 'utf8');
  const VIG = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');

  ok('hay una segunda fuente de móviles que no necesita almacén',
     /MOVILES_EXTRA/.test(SUS) && /function deLaVariable/.test(SUS));
  ok('y con el almacén caído se avisa con ella en vez de lanzar',
     /const reserva = deLaVariable\(\);\s*\n\s*if \(reserva\.length\) return reserva;/.test(SUS));
  /* Esta se EJECUTA, no se lee. La de antes miraba que pusiera
     `juntarAparatos(Array.isArray…` y se puso roja el 01-09-2026 sólo
     porque la lectura se mudó a la única puerta — el juntado seguía
     perfecto. Una prueba que se rompe al mover una línea no vigila nada:
     lo que hay que exigir es que un móvil en las dos listas suene UNA. */
  ok('los dos sitios se juntan sin repetir aparatos',
     (() => {
       const cuerpo = SUS.slice(SUS.indexOf('function juntarAparatos'));
       const fn = new Function(`${cuerpo.slice(0, cuerpo.indexOf('\n}') + 2)}
         return juntarAparatos;`)();
       const a = [{ endpoint: 'https://uno', keys: 1 }, { endpoint: 'https://dos' }];
       const b = [{ endpoint: 'https://dos' }, { endpoint: 'https://tres' }];
       const r = fn(a, b);
       return r.length === 3
         && new Set(r.map(x => x.endpoint)).size === 3
         && fn([], b).length === 2 && fn(a, []).length === 2;
     })(),
     'un móvil en las dos listas no puede sonar dos veces');
  ok('el vigilante YA NO dice «ningún móvil apuntado» cuando lo que pasa es que no puede leer',
     /ciego: true/.test(VIG) && /NO he podido leer la lista de móviles/.test(VIG),
     'esa mentira tranquiliza, que es lo peor que puede hacer un aviso');
  ok('y si el servidor no puede guardar el alta, la app le da el código para pasarlo',
     /avApunte/.test(src) && /pega el código en el chat/.test(src)
     && /navigator\.clipboard\.writeText\(codigo\)/.test(src),
     'sin esto el teléfono se queda fuera y no hay forma de meterlo');
  ok('y con un botón de copiar, que a mano en el móvil es un suplicio',
     /id="avCopiar"/.test(src) && /Selecciónalo y copia a mano/.test(src),
     'con respaldo por si el navegador no deja usar el portapapeles');

  /* Que la variable, si algún día trae basura, no tumbe los avisos. */
  ok('una variable con basura no rompe nada (se ignora y siguen los del almacén)',
     /catch \{ return \[\]; \}/.test(SUS.slice(SUS.indexOf('function deLaVariable'),
                                              SUS.indexOf('function juntarAparatos'))));
}

grupo('NADIE DECLARADO SIN LLAMANTE (guardia genérico, 01-09-2026)');
{
  /* Van TRES veces que este proyecto se muerde con lo mismo:
       · `fueraDeRango()` escrito y sin llamar — 3 días (27-08)
       · `om_cambiado` escrito y sin lector (31-08)
       · `cancelarPrecarga()` sin llamante y la nube sin mapear (01-09)
     Las tres se cazaron a mano, una por una, mirando. Esto de aquí las
     caza por estructura: recorre los métodos del objeto Maps y exige que
     alguien los use. No conoce nombres: el que se escriba mañana también
     entra. */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  const APP = src;
  const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const todo = M + APP + HTML;

  /* Métodos del objeto: `  nombre(args) {` con dos espacios de sangría. */
  const metodos = [...new Set([...M.matchAll(/^  (?:async )?([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)]
    .map(m => m[1]))]
    .filter(n => !['constructor', 'if', 'for', 'while', 'switch', 'catch', 'function', 'return'].includes(n));

  ok('se han encontrado métodos del mapa que revisar (si no, la prueba miente)',
     metodos.length >= 15, `${metodos.length} métodos`);

  const huerfanos = metodos.filter(n => {
    /* Se cuenta cualquier uso que no sea su propia declaración. */
    const usos = (todo.match(new RegExp(`[.\\[]\\s*['"]?${n}\\b`, 'g')) || []).length;
    return usos === 0;
  });
  ok('ningún método del mapa está declarado y sin llamar',
     huerfanos.length === 0,
     huerfanos.length ? `huérfanos: ${huerfanos.join(', ')}` : '');

  /* Y el caso concreto que se acaba de arreglar, para que no vuelva. */
  ok('la precarga se cancela al cambiar de capa Y de modelo',
     (M.match(/this\.cancelarPrecarga\(\);/g) || []).length >= 2,
     'seguía descargando teselas de la capa anterior y desalojando la caché');
}

grupo('La altura de la nube, por el camino de verdad (01-09-2026)');
{
  /* Estaba MUERTA desde siempre y las cinco pruebas que la daban por
     viva armaban la hora A MANO con los nombres crudos de la API — una
     forma que la app no produce jamás. Pasaban en verde con la función
     desconectada. Estas de aquí pasan por `buildHours()`, que es lo
     único que la app usa, así que si alguien vuelve a desenchufar el
     campo, se ponen rojas. */
  /* buildHours tira de media docena de ayudantes; se traen todos, que es
     lo que hace que esta prueba recorra el camino DE VERDAD. */
  for (const c of ['MODEL_LEVELS', 'NIVELES', 'ALPHA_TOPE']) {
    try { eval(sacarConst(c)); } catch { /* si no existe, adelante */ }
  }
  for (const f of ['function windAt', 'function nivelesDe', 'function gustAt',
                   'function techoDe', 'function alphaDe', 'function diaDeLaHora', 'function buildHours',
                   'function loQueMideLaNube']) {
    try { eval(sacar(f)); } catch { /* el que no exista, se ignora */ }
  }

  const respuesta = {
    time: ['2026-09-01T14:00','2026-09-01T15:00'],
    temperature_2m: [22, 23], wind_speed_10m: [10, 12], wind_gusts_10m: [20, 24],
    wind_direction_10m: [270, 280], precipitation: [0, 0], weather_code: [3, 3],
    cape: [900, 950], convective_inhibition: [20, 20],
    convective_cloud_top: [10640, 10500], convective_cloud_base: [900, 850],
  };
  /* buildHours evalúa el semáforo por hora, así que necesita sus
     listones puestos — los suyos de verdad. */
  S.thr = S.thr || { gustWarn: 45, gustNo: 60, rainWarn: 0.2, rainNo: 2.0 };
  S.perfil = S.perfil || 'hierro';
  const horas = buildHours({ hourly: respuesta, elevation: 100 }, 40);

  ok('buildHours mete la altura de la nube en la hora (antes NUNCA lo hacía)',
     has(horas?.[0]?.nubeTop) && has(horas?.[0]?.nubeBase),
     'los campos se pedían a la API y se leían, pero nadie los metía en la hora');
  ok('y con eso la app YA dice lo que mide la nube',
     (() => { const t = sinEtiquetas(loQueMideLaNube(horas[0], 100));
              return t.length > 0 && /nube/i.test(t); })(),
     'devolvía cadena vacía siempre: el texto del tope no salía nunca');
  ok('la nube alta se nombra como la noche de Lekeitio',
     /Lekeitio/i.test(loQueMideLaNube(horas[0], 100)) || /10|alta/i.test(sinEtiquetas(loQueMideLaNube(horas[0], 100))));
  ok('y si la BASE queda por debajo del sitio, avisa de que se sube DENTRO de la nube',
     (() => {
       /* La cota NO es el segundo argumento: sale de la ficha del sitio
          (`cfgDe(place).cota`). Mi primera versión de esta prueba le
          pasaba 1200 a pelo y daba rojo — el fallo era de la prueba, no
          de la app. Aquí se monta un sitio a 1.200 m de verdad. */
       const antes = globalThis.cfgDe;
       globalThis.cfgDe = () => ({ cota: 1200 });
       const t = sinEtiquetas(loQueMideLaNube(horas[0], { name: 'BI OIZ' }));
       globalThis.cfgDe = antes;
       return /dentro/i.test(t);
     })(),
     'con la base a 900 m y el sitio a 1.200, se sube DENTRO de la nube');
  ok('sin dato de nube NO se dice nada (el tope suma, nunca resta)',
     (() => { const sin = buildHours({ hourly: { ...respuesta,
                convective_cloud_top: [null, null], convective_cloud_base: [null, null] },
                elevation: 100 }, 40);
              return sinEtiquetas(loQueMideLaNube(sin[0], 100)) === ''; })(),
     'un hueco no puede bajar un aviso: es la norma desde el 27-08');
}

grupo('NADA VACÍO PISA NADA LLENO (01-09-2026, con el almacén caído)');
{
  /* Con el almacén de Vercel suspendido salió a la luz una mina: la
     sincronización adopta la lista del servidor cuando difiere de la
     local. Hoy no explota porque el servidor da 500 y `if (!r.ok)` corta
     — pero eso es suerte, no diseño. Si el servidor contestara OK con la
     lista VACÍA, la app le borraría sus VEINTE emplazamientos del
     aparato, que es lo único que le queda cuando el servidor falla.
     Perder un emplazamiento = no mirar ese sitio antes de mandar a
     alguien. */
  ok('una lista vacía del servidor NO pisa la lista llena del aparato',
     /if \(!j\.torres\.length && S\.saved\.length\)/.test(src)
     && /S\.torresNoSeAdopto/.test(src),
     'sin esto, un servidor vacío le borra los veinte emplazamientos');
  ok('y el rechazo se APUNTA, no se calla',
     /torresNoSeAdopto = 'el servidor devolvió la lista vacía/.test(src));
  /* ── Y SE PINTA, QUE NO ES LO MISMO (20-09-2026) ───────────────────
     Esta guardia pasaba desde el primer día... y la variable estaba
     MUERTA: se escribía y no la leía nadie en todo el repo. El comentario
     prometía «se rechaza y se dice», y se rechazaba sin decirlo. La
     prueba no lo cazaba porque miraba que el texto existiera en el
     fuente, no que llegara a la pantalla. Es el fallo de esta casa
     aplicado a su propia red de seguridad. */
  ok('y LLEGA A LA PANTALLA: una variable que nadie lee es un silencio',
     /S\.torresNoSeAdopto \? ` · ⚠ \$\{S\.torresNoSeAdopto\}` : ''/.test(src),
     'se escribía y no lo leía nadie');
  ok('la comprobación EJERCITA el caso que borraría, no solo el bueno',
     (() => {
       /* Se simula la rama con lo que llega vacío y lo local lleno. */
       const S2 = { saved: [{ name: 'BI BERMEO' }, { name: 'BI OIZ' }] };
       const j = { torres: [] };
       const rechaza = !!(!j.torres.length && S2.saved.length);
       /* Y el contrario: con lista buena del servidor, NO se rechaza. */
       const buena = !!(![{ name: 'X' }].length && S2.saved.length);
       return rechaza === true && buena === false;
     })());

  /* Y en el servidor: «no pude leer» ≠ «no hay nada». */
  const T = fs.readFileSync(path.join(__dirname, 'api', 'torres.mjs'), 'utf8');
  const AJ = fs.readFileSync(path.join(__dirname, 'api', 'ajustes.mjs'), 'utf8');
  /* Desde el 01-09-2026 esto no lo decide cada función por su cuenta:
     lo decide la ÚNICA PUERTA, `lib/almacen.mjs`. Fue su encargo — «esto
     es lo que digo a diario, siempre falla casi lo mismo, ¿podéis hacer
     que no pase nunca más?»— después de que el mismo fallo saliera en
     torres, ajustes, campo, marcador, suscribir y calibrar, uno por día.
     Quien lo prueba DE VERDAD, arrancando las funciones con el almacén
     roto, es `prueba-almacen-caido.mjs`; esto vigila que sigan usándola. */
  const PUERTA = fs.readFileSync(path.join(__dirname, 'lib', 'almacen.mjs'), 'utf8');
  ok('/api/torres no contesta «lista vacía» cuando lo que pasa es que no puede leer',
     !/\} catch \{ return \[\]; \}/.test(T) && /almacen\.mjs'/.test(T),
     'devolvía HTTP 200 con [] estando el almacén suspendido: parecía que no tiene sitios');
  ok('/api/ajustes tampoco contesta «sin ajustes» cuando no puede leer',
     !/\} catch \{ return \{\}; \}/.test(AJ) && /almacen\.mjs'/.test(AJ));
  ok('pero un fichero que aún no existe SÍ es vacío de verdad, y se distingue',
     /BlobNotFoundError/.test(PUERTA) && /if \(noExiste\(e\)\) return/.test(PUERTA)
     && /throw e;/.test(PUERTA),
     'el primer día no hay fichero: eso no es un fallo');
}

grupo('Los tres graves del repaso de modelos (01-09-2026, dos equipos)');
{
  /* 1 · UNA CLAVE INVENTADA TUMBABA LOS 10 DÍAS.
     `completar()` deja `weather_code_lluvia` en hourly (el código del
     dueño del agua). `completarLargo()` mandaba TODAS las claves a la
     API y esa no existe → HTTP 400 a la petición entera → catch mudo →
     relleno sin hacer. MEDIDO en producción con AROME (el de fábrica):
     rellenoDesde null y OCHO de diez días en blanco. */
  /* ── ESTA GUARDA ERA FALSA Y COSTÓ UNA REGRESIÓN (22-09-2026) ──────
     Decía esto:

         /Object\.keys\(H\)\.filter\(k => k !== 'time'
          && !k\.endsWith\('_lluvia'\)\)/.test(src)

     O sea: comprobaba, letra por letra, que siguiera escrita la línea
     del arreglo del 01-09. Comprobaba que el PARCHE seguía puesto, no
     que la CLASE estuviera cerrada.

     Y el 22-09 se añadió `cape_de_la_tapa` a `hourly`. La línea seguía
     ahí, la guarda siguió verde, la puerta dejó publicar — y el relleno
     de los diez días se rompió esa misma noche con el mismo HTTP 400.
     Ocho días en blanco en producción, vistos en su app.

     Una guarda que fija el texto de un arreglo pasado no protege de la
     clave siguiente. La de verdad está en el grupo «Una clave inventada
     por nosotros no puede viajar a la API»: obliga a REGISTRAR toda
     clave que la app se invente. Aquí solo queda el ancla del filtro. */
  ok('el filtro del relleno quita las claves nuestras por la lista, no por el sufijo',
     /Object\.keys\(H\)\.filter\(k => k !== 'time' && !CLAVES_NUESTRAS\.includes\(k\)\)/.test(src),
     'con un sufijo a mano, la siguiente clave inventada vuelve a tumbar los 10 días');
  ok('y el fallo del relleno ya no se traga en silencio',
     /f\.rellenoFallo = String/.test(src) && !/catch \{ \/\* si falla, se queda como estaba/.test(src),
     'un catch mudo escondió esto días enteros');
  ok('la prueba EJERCITA EL FILTRO DE LA APP, no una copia suya',
     (() => {
       /* LO QUE HABÍA AQUÍ TAMPOCO SERVÍA (22-09-2026): la prueba se
          reescribía el filtro dentro y comprobaba SU PROPIA COPIA. Podía
          borrarse el filtro de app.js entero y esto seguía verde.

          Ahora se saca de app.js la línea de verdad —la lista y el
          filtro— y se ejecuta. Si alguien la cambia, esto lo nota. */
       eval(sacarConst('CLAVES_NUESTRAS'));
       const linea = (src.match(/const campos = Object\.keys\(H\)\.filter\([^;]+\);/) || [])[0];
       if (!linea) return false;
       const H = { time: [], temperature_2m: [], precipitation: [],
                   ...Object.fromEntries(CLAVES_NUESTRAS.map(k => [k, []])) };
       /* Se le quita el `const` para que asigne a la de fuera: un
          `const` dentro de un eval se queda dentro del eval. */
       let campos;
       eval(linea.replace(/^const /, ''));
       return CLAVES_NUESTRAS.every(k => !campos.includes(k))
           && campos.includes('precipitation') && campos.includes('temperature_2m');
     })(),
     'sacada de app.js y ejecutada: ninguna clave nuestra sale, las reales sí');

  /* 2 · EL REPARTO USABA EL MODELO DE LA CARGA ANTERIOR.
     `completar()` lee `modeloDato()` (= f._modelo) y el sello se ponía
     DESPUÉS. Al cambiar de modelo, el dueño del agua se filtraba a sí
     mismo por creerse «el cargado». MEDIDO: pasando de ECMWF a AROME en
     Bermeo, el agua se quedaba en la de AROME. */
  ok('el modelo se sella ANTES de repartir, no después',
     (() => {
       const iSello = src.indexOf('f._modelo = modeloUsado;');
       const iRep = src.indexOf('await completar(f, p);');
       return iSello > 0 && iRep > 0 && iSello < iRep;
     })(),
     'si el sello va detrás, el reparto lee el modelo de la carga anterior');
  ok('y el sello no se pone dos veces (una sola verdad)',
     (src.match(/f\._modelo = modeloUsado;/g) || []).length === 1);

  /* 3 · LA APP AFIRMABA QUE NO PODÍA AVISAR DE TORMENTA, Y SÍ PODÍA.
     El cartel decía «AROME HD no publica estado del cielo ni la tapa ·
     por esa vía no puede avisar de tormenta ni aunque la haya» — falso
     desde que el cielo lo pone ARPEGE y la tapa se presta de ICON. */
  /* Estas dos eran REGEX y pasaron en verde con el cartel roto (yo había
     leído `prestadosDe` como diccionario siendo una lista). Ahora se
     EJECUTA `pintarQueFalta()` con el reparto de verdad. */
  ok('el cartel distingue «sin dueño» de «prestado» — EJECUTADO, no leído',
     (() => {
       /* El arnés necesita las piezas que la función usa; sin ellas
          reventaba y la prueba daba verde con la caja vacía. */
       for (const c of ['CAMPOS_DECISION', 'MODELOS_TORMENTA']) {
         try { if (typeof globalThis[c] === 'undefined') eval(sacarConst(c)); } catch {}
       }
       try { if (typeof modeloDato !== 'function') eval(sacar('function modeloDato')); } catch {}
       eval(sacar('function pintarQueFalta'));
       const el = { hidden: true, innerHTML: '' };
       const antes$ = globalThis.$;
       globalThis.$ = sel => sel === '#mselFalta' ? el : antes$?.(sel);
       const antesS = { discrepa: S.discrepa, data: S.data };
       /* Con sello del sitio: desde el 01-09-2026 `deEsteSitio()` no da
          por bueno un estado sin marcar, que era como se colaba el dato
          del emplazamiento anterior. */
       S.place = S.place || { lat: 43.412976, lon: -2.718316 };
       S.discrepa = { clave: `${S.place.lat.toFixed(3)},${S.place.lon.toFixed(3)}`,
                      d: { hourly: { time: ['x'],
         weather_code_meteofrance_arome_france_hd: [null],
         convective_inhibition_meteofrance_arome_france_hd: [null] } } };
       /* El cielo y la tapa llegan PRESTADOS: el cartel no puede decir
          que no se puede avisar de tormenta. */
       S.data = { fc: { _modelo: 'arome', prestadosDe: [
         { k: 'weather_code', de: 'meteofrance_arpege_europe' },
         { k: 'convective_inhibition', de: 'icon_seamless' } ] } };
       let reventó = null;
       try { pintarQueFalta(); } catch (e) { reventó = e.message; }
       globalThis.$ = antes$; S.discrepa = antesS.discrepa; S.data = antesS.data;
       const t = sinEtiquetas(el.innerHTML || '');
       /* Se EXIGE que el cartel se haya pintado. Mi primera versión solo
          miraba que no apareciera la frase, y con la caja vacía —porque
          la función reventaba en el arnés— daba verde igual: otra
          comprobación que no podía fallar. Probado rompiéndolo. */
       if (reventó) return false;
       if (!t.length) return false;
       return !/no puede avisar de tormenta/i.test(t);
     })(),
     'con el cielo y la tapa prestados NO puede decir que no avisa de tormenta');
  ok('y no afirma que no puede avisar cuando SÍ tiene los datos prestados',
     /El aviso de tormenta sigue en pie/.test(src)
     && !/\$\{esc\(mio\.name\)\} no publica \$\{esc\(faltan\.join\(' ni '\)\)\}\.<\/b>\s*\n\s*Por esa vía/.test(src),
     'un cartel que dice «no puedo avisarte» teniendo el aviso es de los que hacen mirar a otro sitio');
}

grupo('Dos verdades con ventanas distintas llevan etiqueta (01-09-2026)');
{
  /* De sus pantallazos de la mañana del 01-09: (a) la franja decía
     «con llovizna moderada» arriba (cielo de ARPEGE) y «Sin lluvia ·
     0,0 mm» debajo (agua de ECMWF) — las dos verdad, juntas contradicción;
     (b) en Sollube, «Racha máxima 49» (aviso suyo: 45) con «no se
     estropea en 24 h» debajo — que solo habla de LLEGAR. La regla: una
     afirmación de calma dice su dueño o su ámbito. */
  ok('la calma de la franja lleva dueño cuando otros ven agua',
     /la ve seca · 0,0 mm/.test(src) && /lluviaEnLaFranjaQueNoVesTu\(sel\[0\]\.date/.test(src),
     '«Sin lluvia» a secas no puede convivir con «llovizna» dos líneas arriba');
  ok('y «Sin lluvia» a secas sigue existiendo para cuando NADIE ve agua',
     /'Sin lluvia · 0,0 mm'/.test(src));
  /* REAPUNTADAS el 02-09-2026: *«al final lío con esos textos»*. La
     coletilla —«rayo, racha de volcar el 4x4 o lluvia fuerte, tus
     listones van en el semáforo»— salía SIEMPRE, también los días en que
     no pasa nada, que son casi todos. Un renglón permanente no se lee.

     Lo que fija esta prueba no cambia: que la frase diga de qué ventana
     habla. Y eso lo dicen ya sus tres palabras —«para llegar»—, que es
     donde vivía la garantía desde el principio. Sin ellas, «Nada te
     frena» con una racha de 49 sobre su listón de 45 se lee «día
     limpio», que fue su pantallazo del 01-09.                        */
  ok('la ventana verde del parte dice que habla de LLEGAR',
     /<b>Nada te frena para llegar\.<\/b>/.test(src)
     && !/<b>Nada te frena\.<\/b>/.test(src)
     && !/<b>Nada te frena ahora\.<\/b>/.test(src),
     'con racha 49 sobre su aviso de 45, «no se estropea» se leía «día limpio»');
  ok('y manda los listones de trabajo a donde viven: el semáforo',
     !/tus listones de trabajo van en el semáforo/.test(src)
     && /data-v="abierta"/.test(src),
     'la coletilla salía siempre, y lo que está siempre se salta');
}

grupo('Los dibujos distinguen el peligro: hielo, granizo y nieve (01-09-2026)');
{
  /* De la revisión de símbolos del 31-08: lo ENGELANTE se pintaba igual
     que su versión sin hielo, el granizo igual que la tormenta simple, y
     los copos de nieve eran invisibles (los puntos caían justo dentro de
     sus propias rayas). Para quien manda gente a subir a una torre, el
     hielo en la escalera y el granizo son peligros propios: el dibujo
     tiene que decirlo sin tener que leer el texto. */
  eval(sacarConst('WMO'));
  if (typeof globalThis.isStormCode !== 'function') eval(sacar('function isStormCode'));
  eval(sacar('function icon('));

  const hielo = c => icon(c, 1).includes('#bcd4ff');
  ok('los cuatro códigos de HIELO llevan su marca: 48, 56, 57, 66 y 67',
     [48, 56, 57, 66, 67].every(hielo),
     'engelante = escalera, pates y cable de vida con hielo encima');
  ok('y los que NO son engelantes no la llevan (la marca significa algo)',
     ![45, 51, 53, 55, 61, 63, 65, 71, 80, 95].some(hielo),
     'una marca que sale siempre no marca nada');
  ok('el granizo (96 y 99) se distingue de la tormenta simple (95)',
     icon(96, 1).includes('circle') && icon(99, 1).includes('circle')
     && !icon(95, 1).includes('circle'),
     'el granizo rompe material y hace daño a quien está fuera');
  ok('los copos de nieve ya no caen dentro de sus propias rayas',
     !icon(73, 1).includes('M9 21.6h.01') && icon(73, 1).includes('M7.6 21v1.6'),
     'antes la nieve eran tres rayas: los puntos quedaban tapados');
  ok('y la nieve sigue distinguiéndose de la lluvia',
     icon(73, 1).includes('#dbe7ff') && !icon(63, 1).includes('#dbe7ff'));
}

grupo('NADA SE QUEDA OBSOLETO al tocar otra cosa (31-08-2026, su norma)');
{
  /* Suyo, cerrando la noche: «a ver los ajustes, si se aplican; no solo de
     hoy: cuando se toque algo, que no quede obsoleto».

     Y tiene los números de su parte: de los CATORCE fallos de esta noche,
     TRES eran cosas que envejecieron al tocar otra cosa — IDs de modelos
     que ya no existían en LENTOS, una marca de sesión que nadie lee, y
     textos que hablaban de un mapa que arrancaba con otro modelo. Ninguno
     daba error; todos mentían en silencio.

     Este bloque es el guardia genérico de esa familia: no conoce los
     fallos concretos, los caza por estructura. Si mañana alguien añade un
     modelo, una capa o un ajuste y se deja el resto atrás, aquí salta. */
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');

  /* 1 · TODA lista de IDs de modelo del mapa apunta a modelos que existen. */
  const idsTM = [...M.matchAll(/\{ id:'([a-z0-9_]+)', name:'[^']+', res:/g)].map(m => m[1]);
  ok('hay modelos de mapa declarados (si no, el resto de la prueba miente)',
     idsTM.length >= 5, `encontrados ${idsTM.length}`);
  for (const [nombre, rx] of [['LENTOS', /const LENTOS = new Set\(\[([^\]]+)\]/]]) {
    const m = M.match(rx);
    const ids = m ? m[1].split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean) : [];
    ok(`${nombre} solo nombra modelos que existen de verdad`,
       ids.length > 0 && ids.every(id => idsTM.includes(id)),
       `fantasmas: ${ids.filter(id => !idsTM.includes(id)).join(', ') || '—'}`);
  }

  /* 2 · Toda capa con escala propia tiene esa escala declarada, y toda
     escala declarada la usa alguien. Un nombre suelto en cualquiera de
     los dos lados es una capa sin color o código muerto. */
  const escUsadas = [...new Set([...M.matchAll(/escala:'([a-z0-9_]+)'/g)].map(m => m[1]))];
  /* Hasta el `return _escalas;`, NO 400 caracteres contados a ojo: con
     los cortes fijos, la escala número catorce (`tapa`, 01-09-2026) se
     quedaba fuera del trozo y la prueba cantaba «sin declarar» estando
     declarada. Una guardia que se estropea al crecer no guarda nada. */
  const desde = M.indexOf('_escalas = {');
  const bloque = M.slice(desde, M.indexOf('return _escalas;', desde));
  ok('cada capa con escala propia la tiene declarada en _escalas',
     escUsadas.every(e => new RegExp(`\\b${e}\\b`).test(bloque)),
     `sin declarar: ${escUsadas.filter(e => !new RegExp(`\\b${e}\\b`).test(bloque)).join(', ') || '—'}`);

  /* 3 · Lo que se escribe en sessionStorage/localStorage, alguien lo lee.
     El patrón de `fueraDeRango()` declarado y sin llamar, y de la marca
     `om_cambiado` que se escribía sin lector: cuestan silencios, no errores. */
  const todo = src + M;
  const escritas = [...new Set([...todo.matchAll(/(?:session|local)Storage\.setItem\('([a-zA-Z0-9_.]+)'/g)].map(m => m[1]))];
  const sinLector = escritas.filter(k =>
    !new RegExp(`(?:session|local)Storage\\.getItem\\('${k.replace(/\./g, '\\.')}'`).test(todo)
    && !new RegExp(`LS\\.get\\('${k.replace(/\./g, '\\.')}'`).test(todo));
  ok('todo lo que se guarda en el aparato tiene quien lo lea',
     sinLector.length === 0,
     `se escriben y nadie lee: ${sinLector.join(', ')}`);

  /* 4 · Las pestañas que existen en el menú existen como sección, y al
     revés. El 31-08 se fusionó Torre en Ahora: una pestaña huérfana
     dejaría media app inalcanzable sin dar ni un error. */
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const tabs = [...new Set([...html.matchAll(/class="tab[^"]*" data-v="([a-z]+)"/g)].map(m => m[1]))];
  const secs = [...new Set([...html.matchAll(/<section class="view[^"]*" data-v="([a-z]+)"/g)].map(m => m[1]))];
  ok('cada pestaña del menú tiene su sección y cada sección su pestaña',
     tabs.length > 0 && tabs.every(t => secs.includes(t)) && secs.every(v => tabs.includes(v)),
     `pestañas sin sección: ${tabs.filter(t => !secs.includes(t)).join(', ') || '—'} · `
     + `secciones sin pestaña: ${secs.filter(v => !tabs.includes(v)).join(', ') || '—'}`);
}

grupo('La revisión de las tres pasadas (31-08-2026, noche)');
{
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  /* G1 — la escala de la T850 no se aplicaba: los regex de la marca solo
     admitían letras y «t850» fue la primera con dígitos. Reproducido. */
  ok('la marca de escala admite dígitos: «t850» ya no se parte en «t»',
     /MARCA\}=\(\[A-Za-z0-9_\]\+\)/.test(M) && /MARCA\}=\[A-Za-z0-9_\]\+/.test(M),
     '14-09: y mayúsculas, que «capeE» fue la segunda en romperse');
  ok('y se ejercita el caso que fallaba, no solo el que pasa',
     (() => { const MARCA='escala_propia';
       const u='om://x/f.om?variable=temperature_850hPa&interpolation=linear&'+MARCA+'=t850';
       return u.match(new RegExp(MARCA+'=([a-z0-9]+)'))?.[1] === 't850'
         && u.replace(new RegExp('[&?]'+MARCA+'=[a-z0-9]+'),'').endsWith('interpolation=linear'); })());
  /* M3/M4 — referencias muertas, el patrón que ya picó dos veces. */
  ok('la capa t850 tiene su rango de unidades (si llega en Kelvin, se canta)',
     /t850: \[-60, 45, '°C'\]/.test(M));
  ok('todos los modelos LENTOS existen de verdad en TMODELS',
     (() => { const m=M.match(/const LENTOS = new Set\(\[([^\]]+)\]/);
       if(!m) return false;
       return m[1].split(',').map(x=>x.trim().replace(/'/g,''))
         .every(id => new RegExp("id:'"+id+"'").test(M)); })(),
     'llevaba tres IDs inventados: gfs_global, gfs025, icon_global');
  /* G2 — las cuatro capas de componentes, RETIRADAS el 21-09-2026: el
     servicio no publica wind_speed y la librería no sabe dar la componente
     norte-sur, así que no había ni fuerza ni rumbo que pintar. */
  ok('no queda ninguna capa cuyo valor sea una componente de viento',
     !/\{ id:'wind(10|20|50|100)'/.test(M)
     && !/BARBAS y números = viento real/.test(M)
     && /RETIRADAS EL 21-09-2026/.test(M),
     'una capa que enseña la componente oeste-este bajo un rótulo de km/h engaña, y se retira');
  /* PRECALENTADO DE MODELOS: probado el 31-08 y RETIRADO por medición
     (ARPEGE 10,3 → 20,1 s; ICON-EU 1,2 → 20,7 s). Esta prueba impide que
     vuelva sin números nuevos que lo justifiquen. */
  ok('el precalentado de modelos NO está puesto: se midió y empeoraba todo',
     !/precalentarModelos\(\) \{/.test(M) && /PROBADO Y RETIRADO/.test(M),
     'una tesela no calienta 32 MB y la cola competía con lo que él mira');

  /* Los de app.js */
  ok('Horas pinta el icono con el agua del dueño, como el resto de pantallas',
     /icon\(v\.code, v\.dia\)\)\(cieloVisto\(h\)\)/.test(src),
     'era la única pantalla que usaba el código crudo; desde el 09-09 pasa por cieloVisto, como todas');
  ok('ningún «0,0» inventado donde no hay dato de lluvia',
     !/'0,0'/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')),
     'la probabilidad ya decía «—» y los mm mentían un cero');
  ok('is_day nulo no pinta luna a mediodía: respaldo por hora local',
     /* 25-09-2026: el respaldo vive ahora en diaDeLaHora(), detrás del orto y el ocaso. */
     /if \(has\(H\.is_day\?\.\[i\]\)\) return H\.is_day\[i\];/.test(src) && /return hh >= 8 && hh <= 19 \? 1 : 0;/.test(src));
  ok('iconosDelDia distingue «sin código» de «null» (has, no === null)',
     /const conDato = hs\.filter\(h => has\(codigoQueSeVe\(h, h\.code\)\)\)/.test(src)
     && /if \(!R \|\| !has\(R\.code\)\) return SIN_DIBUJO;/.test(src));
  ok('la pestaña 10 días se repinta al entrar (el chip del 41° nacía muerto)',
     /if \(v === 'days'\)   renderDays\(\);/.test(src));
  ok('la tabla de racha toma el máximo de los cinco, no el modelo cargado',
     /wind_gusts_10m_\$\{m\.om\}/.test(src) && /rachaCinco/.test(src),
     'prometía «los 5 juntos» y enseñaba uno: 21 en la tabla, 22 en la tira');
  ok('el dueño del cielo aparece en la tira de nubes, emparejado por hora',
     /duenoCielo/.test(src) && /hs\?\.find\(h => h\.t === H\.time\[i\]\)/.test(src),
     'el número que la app USA tiene que estar entre los que ENSEÑA');
  ok('la calma de lluvia dice su ventana y mira las 24 h antes de darla',
     /Ninguno ve agua a esta hora/.test(src) && /En las próximas 24 h/.test(src));
  /* El listón ya no va a mano: sale de SUS ajustes (01-09-2026). Lo que
     se sigue exigiendo es que sea EL MISMO que el del chip. */
  ok('y «próxima lluvia» acepta el sirimiri acumulado, mismo listón que el chip',
     /if \(cuando === null && total >= \(S\.thr\?\.rainWarn \?\? 0\.2\)\) cuando = primera;/.test(src));
}

grupo('El martes doble: la franja dice el orden del cielo (31-08, 21:17)');
{
  /* «En un sitio dibuja una cosa y en otro diferente»: la franja decía
     «Cubierto» y las tarjetas de Horas, luna y soles hasta las 10. Su
     martes real: 4-7 luna, 8-10 sol-nube («que será lo lógico»), 11-13
     nube. Una palabra para un tramo partido miente con la verdad. */
  const H = cs => cs.map(c => ({ code: c }));
  /* Desde el 08-09-2026 («eso nada, cielo azul todo el rato», Calpe) la
     franja dice A QUÉ HORA cambia el cielo, no «al principio»; y desde el
     09-09 son los mismos tramos que los iconos. Horas con fecha: 6 → 13. */
  const HJ = cs => cs.map((c, i) => ({ code: c, date: new Date(2026, 8, 1, 6 + i) }));
  const martes = tituloFranja(HJ([0, 0, 1, 1, 3, 3, 3, 3]), 3, '');
  ok('el tramo partido se dice en orden: despejado primero, cubierto desde su hora',
     /^Mayormente despejado · cubierto desde las 10:00$/.test(martes), `salió «${martes}»`);
  const martes2 = tituloFranja(HJ([0, 0, 2, 1, 2, 3, 3, 3]), 3, '');
  ok('su martes exacto (luna, sol-nube, nube) sale con las dos mitades',
     /^Despejado · cubierto desde las \d\d:00$/.test(martes2), `salió «${martes2}»`);
  ok('un tramo uniforme sigue en una palabra',
     tituloFranja(H([3, 3, 3, 3, 2, 3]), 3, '') === wmoText(3));
  ok('entre vecinos (parcial y cubierto) no se montan frases',
     tituloFranja(H([2, 2, 2, 3, 3, 3]), 3, '') === wmoText(3),
     'el matiz solo cuando el cambio es de verdad: de despejado a tapado');
  /* «¿Por qué no pinta un sol también?» — si el texto cuenta dos
     mitades, el dibujo también, y de la MISMA función. */
  ok('el dibujo acompaña: franja partida = un icono por tramo, de la misma función que la frase',
     /resumenCielo\(sel\)/.test(src)
     && /class="part__tira">\$\{R\.partes\.map\(t => `<i>\$\{icon\(t\.code, d\)\}<u>\$\{rot\(t\)\}<\/u><\/i>`\)/.test(src),
     'texto e icono no pueden calcular el corte cada uno por su lado');
  ok('y el dibujo del día empieza donde las franjas: a las 6',
     /h\.date\.getHours\(\) >= 6 && h\.date\.getHours\(\) <= 20\);/.test(src),
     'una hora de diferencia rompía el empate y salían dos veredictos');
}

grupo('El cielo pasa a ARPEGE por acierto (31-08-2026, su «dale»)');
{
  /* Dos días de fotos suyas de jueces; cuatro tandas el 31: ICON —dueño
     hasta hoy— exageró la nube en todas (niebla con cielo raso a las
     08:13, cubierto con mitad azul a mediodía, 60 % de bajas con el
     cielo azul a las 19:30). ARPEGE el más fiel en todas. Es el global
     de Météo-France, la casa de AROME, y publica el cielo ENTERO. */
  /* ── 02-09-2026: EL CIELO PASÓ AL EUROPEO ────────────────────────
     Lo de arriba sigue valiendo —ICON exageraba y ARPEGE era más fiel—
     pero le faltaba un candidato: **ECMWF no estaba en aquella
     comparación**. Con cinco fuentes independientes el 02-09 (su ojo, el
     satélite, Euskalmet, Meteoblue y Windy) y su criterio de meses
     —«windy acierta mucho con el modelo europeo», «el europeo en
     AguaceroWx también lo clava»— el cielo pasa a ECMWF.

     Lo que esta prueba fija NO es qué modelo es: es que **las cinco
     piezas sean del MISMO**, que es la garantía que evita costuras. */
  /* ── REAPUNTADAS EL 02-09-2026, Y POR QUÉ ─────────────────────────
     Estas tres miraban `ELEGIDO_POR_ACIERTO`. Esa tabla se vació ese
     mismo día con su *«yo quiero como windy»*: ya no hay reparto por
     acierto pisando su elección. Con la tabla vacía las tres pasaban a
     comparar `undefined` con `undefined` — verde sin comprobar nada, que
     es peor que rojo.

     La GARANTÍA no ha cambiado y es la que se comprueba ahora, donde
     vive de verdad: sea cual sea el modelo cargado, el cielo entero sale
     de UN dueño. Su pantallazo de ese día era justo lo contrario: total
     de ECMWF (0 %) y capas de AROME (13 % altas) en la misma caja.     */
  eval(sacarConst('ELEGIDO_POR_ACIERTO'));   // vacío desde «como windy», pero hay
                                             // pruebas debajo que lo consultan
  const cobC = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'data', 'cobertura.json'), 'utf8')).cobertura;
  const ordenC = (src.match(/const ORDEN_FIABLE = \[([^\]]+)\]/) || [])[1]
    .match(/'[a-z_0-9]+'/g).map(x => x.slice(1, -1));
  const PIEZAS = ['weather_code','cloud_cover','cloud_cover_low',
                  'cloud_cover_mid','cloud_cover_high'];
  const TODOS = [...new Set([...ordenC, 'best_match'])];
  /* La misma regla que `quienLoMide()`: lo suyo manda; si no publica el
     TOTAL, el cielo entero va al primer prestamista que sí lo publique. */
  const duenoDe = (campo, m) => {
    /* El cielo se mira ANTES que «lo suyo manda»: AROME publica las
       capas pero no el total, y por ahí se colaba la costura. */
    if (PIEZAS.includes(campo)
        && (m === 'best_match' || !cobC.cloud_cover?.includes(m))) {
      const d = ordenC.find(o => o !== m && cobC.cloud_cover?.includes(o));
      if (d && cobC[campo]?.includes(d)) return d;
    }
    if (cobC[campo]?.includes(m)) return m;
    return ordenC.find(o => o !== m && cobC[campo]?.includes(o)) || null;
  };
  ok('las cinco piezas del cielo, elegidas y del MISMO dueño',
     TODOS.every(m => {
       const de = PIEZAS.map(k => duenoDe(k, m));
       return de.every(Boolean) && new Set(de).size === 1;
     }),
     'el cielo viaja junto, como el agua: sin costuras de dos modelos');
  ok('y el agua sigue siendo del europeo — un cambio no arrastra al otro',
     /* Ya no es «del europeo» fijo: es del modelo que él elija, que es lo
        que pidió. Lo que se fija es que el cielo y el agua sean
        INDEPENDIENTES — que tocar uno no arrastre al otro. Con AROME
        cargado el cielo se presta al europeo y el agua se queda en AROME:
        si algún día los dos salieran del mismo prestamista por fuerza,
        esto lo canta. */
     (() => {
       const m = 'meteofrance_arome_france_hd';
       return duenoDe('precipitation', m) === m
           && duenoDe('cloud_cover', m) !== m;
     })(),
     'el agua es suya y el cielo prestado: son dos decisiones, no una');
  /* Y la razón de mecanismo del cambio: el SIRIMIRI se dispara con el
     código de llovizna Y los milímetros. Si el código y el agua fueran
     de modelos distintos, esa regla mezclaría dos previsiones — y es la
     que le dice si el poste y la escalera van mojados. */
  /* REAPUNTADA el 02-09-2026 por lo mismo que las de arriba: miraba
     `ELEGIDO_POR_ACIERTO`, que está vacío, así que comparaba `undefined`
     con `undefined` — verde sin comprobar nada.

     Lo que protege sigue igual: el sirimiri se clasifica por CÓDIGO, y
     ese código tiene que ser el del modelo que pone los milímetros. El
     mecanismo que lo garantiza es `weather_code_lluvia`, que se rellena
     con el código del prestamista en la misma llamada que la lluvia. Lo
     que se comprueba es que ese mecanismo sigue existiendo Y que el
     sirimiri lo mira ANTES que el código del cielo. */
  ok('el código del cielo y el agua son del MISMO dueño (por el sirimiri)',
     /(?:weather_code_lluvia|codeLluvia)/.test(src)
     && /esLlovizna\(h\.codeLluvia \?\? h\.code\)/.test(src)
     && /k === 'precipitation'[\s\S]{0,220}weather_code_lluvia/.test(src),
     'el aviso de sirimiri usa las dos cosas: no pueden venir de dos modelos');
  /* Y lo que NO cambia: la tapa. Suyo, 02-09-2026: «salvo CAPE CIN que
     algunos modelos europeos no tienen datos». Medido: ECMWF publica
     `convective_inhibition` 0 horas de 24. Sigue prestándose de ICON por
     `QUIEN_LO_MIDE`, y se dice de quién viene. */
  ok('la tapa NO se le pide al europeo, que no la publica',
     !('convective_inhibition' in ELEGIDO_POR_ACIERTO)
     && !('cape' in ELEGIDO_POR_ACIERTO),
     'ECMWF da 0 de 24 horas de tapa: pedírsela sería cambiar un dato por un hueco');
  /* El mecanismo: quienLoMide devuelve el elegido para CUALQUIER campo
     si la cobertura lo respalda — la misma puerta que usa la lluvia. */
  ok('va por la única función de reparto: vale para todas las pantallas',
     /const e = ELEGIDO_POR_ACIERTO\[campo\];\s*\n\s*if \(e && e !== salvo && puede\.includes\(e\)\) return e;/.test(src));
  const P = fs.readFileSync(path.join(__dirname, 'paridad.cjs'), 'utf8');
  /* Ya no se exige que la trampa NOMBRE al dueño: se exige que lo LEA
     del reparto. Escrito a mano, esta guardia saltaba en cada cambio de
     dueño por el motivo equivocado — pasó el 02-09-2026 al pasar el
     cielo al europeo. Ahora sigue al reparto sola. */
  ok('la trampa del guardia de paridad LEE el dueño, no lo tiene escrito',
     /const DUENO_CIELO = \(\(\) => \{/.test(P)
     && /om === DUENO_CIELO \? 55 : 99/.test(P)
     && !/om === 'meteofrance_arpege_europe' \? 55 : 99/.test(P),
     'con el dueño a mano, cada cambio paraba la publicación sin motivo');
  ok('y si no encuentra el dueño, se planta en vez de seguir',
     /no encuentro el dueño del cielo en ORDEN_FIABLE \+ cobertura\.json/.test(P),
     'sin dueño la trampa no vale, y eso hay que decirlo, no suponerlo');
}

grupo('Las filas «de cada modelo», en barras legibles (31-08-2026, 18:40)');
{
  /* «Esto encuentro difícil de leer, ponlo como lo de las rachas» ·
     «que no perdamos datos, pero no repetidos» · «y que se lean bien». */
  ok('la tira de píldoras es ahora filas de barras, molde de la ficha',
     /class="ptb__f"/.test(src) && /class="ptb__b"><i style="width:/.test(src));
  ok('el más alto sano sigue destacado y los mudos siguen apagados',
     /data-max="1"/.test(src) && /data-mudo="1"/.test(src),
     'el resaltado no puede caer en un número con aviso — regla del 29-08');
  ok('la barra se escala al mayor de la fila, nunca inventa escala',
     /x\.v \/ tope \* 100/.test(src));
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('y las filas tienen su estilo', /\.ptb__f\{/.test(css) && /\.pt__uno--b\{/.test(css));
}

grupo('Torre se mudó a Ahora: dos vistas, no tres (31-08-2026, 18:36)');
{
  /* Suyo: «al final tengo que mirar en tres sitios, una va fuera» · «se
     ponen los datos que faltan en una y se deja completa». Torre era la
     ficha de un sitio y Ahora también: fusionadas. */
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la pestaña Torre ya no existe en la barra',
     !/data-v="tower">Torre</.test(html) && !/<section[^>]*data-v="tower"/.test(html));
  ok('y Ahora es la vista activa de arranque',
     /class="tab is-on" data-v="now"/.test(html));
  ok('las piezas de Torre viven ahora DENTRO de la sección Ahora',
     (() => { const i = html.indexOf('<section class="view is-on" data-v="now">');
              const j = html.indexOf('</section>', i);
              const seccion = html.slice(i, j);
              return ['id="verdict"', 'id="tl"', 'id="prof"', 'id="thrGrid"',
                      'id="letraB"', 'id="elev"', 'id="hsel"']
                .every(id => seccion.includes(id)); })(),
     'veredicto, ventana 48h, perfil, umbrales, letra, cota y altura — todo mudado');
  ok('los enlaces viejos a Torre siguen valiendo: alias hacia Ahora',
     /if \(v === 'tower'\) v = 'now';/.test(src),
     'sus aparatos pueden llevar tower guardado como última vista');
  ok('ningún salto interno apunta ya a la vista muerta',
     !/setView\('tower'\)/.test(src));
  ok('el clon del selector de modelo se fue con la fusión: uno solo',
     !/id="mselAhora"/.test(html));
}

grupo('Las mareas en la columna de Ahora (31-08-2026, 18:32)');
{
  /* «En la parte derecha falta poner horas de bajamar y pleamar». */
  ok('Sol y aire lleva las dos próximas mareas, de la tabla oficial',
     /\.\.\.proximasMareas\(2\)\.map/.test(src)
     && /'▲ Pleamar' : '▼ Bajamar'/.test(src.slice(src.indexOf('pintarMarAhora'))),
     'las mismas de Euskalmet que usa la pestaña Mar, nunca calculadas');
  ok('y la altura va con coma y con su día',
     /e\.altura\.toFixed\(2\)\.replace\('\.', ','\)\} m · tabla oficial/.test(src));
}

grupo('El cielo en el mano a mano modelos-estación (31-08-2026, 18:26)');
{
  /* «Aquí falta nubosidad, si hay o despejado» — la tabla de ESTA HORA
     comparaba racha, viento, lluvia, temperatura y humedad, y el cielo
     no estaba. */
  ok('la fila Cielo existe, con el código visto y el % de nubes',
     /fila\('Cielo',/.test(src) && /esc\(cieloVisto\(H\)\.txt \?\? '—'\)/.test(src));
  ok('y la estación dice la verdad: ningún aparato suyo mide la nube',
     /fila\('Cielo',[\s\S]{0,700}ningún aparato lo mide/.test(src),
     'una celda vacía sin porqué se lee como fallo de la estación');
}

/* ═══ EL GUARDIA DE «ESTO NO SE TOCA» ═══════════════════════════════
   Suyo, 01-09-2026: «se repara una vez y punto, y cuando se programa o
   reprograma se pone —aunque haya cambios de lo que sea— esto no se
   toca».

   `NO-SE-TOCA.md` lista las decisiones ya reparadas, cada una con el
   NOMBRE EXACTO de la prueba que la guarda. Esto comprueba que esas
   pruebas siguen vivas y que se han EJECUTADO en esta pasada. Si alguien
   borra una, la renombra, o la deja fuera del recorrido, el candado no
   publica.

   No sustituye a las pruebas: las ATA. Una prueba puede desaparecer sin
   que nadie se entere; una fila de esa tabla, no. */
/* ═══════════════════════════════════════════════════════════════════
   LOS RAYOS SON DE ESTE SITIO, Y SI NO SE PUEDEN LEER SE DICE
   ───────────────────────────────────────────────────────────────────
   Dos fallos en la misma función, los dos del barrido del 01-09-2026, y
   los dos en el peor sitio posible: los rayos son su ÚNICO veto y el
   único caso de toda la app donde una medida pisa al semáforo.

     1. `pintarRayosTorre` leía `S.rayos` sin mirar de QUÉ emplazamiento
        era. Cambiaba de sitio y veía los rayos del anterior — o no veía
        los de éste. Es el mismo fallo que se arregló el 31-08 en la
        comparativa, en otro estado que nadie repasó.
     2. Si AEMET fallaba, el bloque se OCULTABA. Y un hueco donde siempre
        pone «Rayos medidos por AEMET» se lee como «no ha caído nada».

   Esto EJECUTA la función con un elemento de mentira. Probado quitando
   el arreglo: se pone roja.                                            */
/* La puerta en sí, con los tres sellos que existen en la app. Si alguien
   añade mañana un estado por emplazamiento y se le olvida sellarlo,
   `deEsteSitio` devuelve null y no se pinta: falla del lado seguro. */
/* Sin cobertura, cada emplazamiento se juzga con SUS datos.
   El 31-08 se arregló que la comparativa de un sitio no se usara en otro,
   pero solo en la vía CON cobertura. La rama de «Guardar para el monte»
   —la que usa cuando no hay red, o sea justo donde está— llamaba a
   `buildHours` sin decirle de qué sitio era, y entonces `assess` cae en
   `place ?? S.place` y juzga las veinte filas con el sitio ABIERTO. */
/* «Vigilante en pie» decía lo mismo estuviera avisando o mudo. El
   servidor manda `envia` y `lista` desde el 29-08 y la pantalla no los
   leía: el arreglo se quedó a medias. (Barrido del 01-09-2026.) */
/* Un ajuste que no hace lo que parece es peor que no tenerlo: en el
   perfil de fábrica sus dos listones de ráfaga NO deciden, y la pantalla
   donde los pone no lo decía (barrido del 01-09-2026). */
/* ── LA GUARDIA DE LA CLASE ENTERA ─────────────────────────────────
   Suyo, 01-09-2026: *«sobre todo los errores que se repiten y repiten»*.
   Y éste se repetía: estado que es de UN emplazamiento, leído en otro.
   Se arregló en la comparativa el 31-08 (un lector de siete), en los
   rayos y en el desacuerdo el 01-09… siempre el caso, nunca la clase.

   Esto recorre TODOS los lectores de los cuatro estados por sitio y
   exige que ninguno lea el estado a pelo. Uno nuevo que se olvide no se
   publica. */
/* Un hueco NO se suma como cero. El 31-08 se arregló que AROME no
   publicaba la nieve, pero se dejó el `?? 0` que lo escondía: el día que
   falte por otro motivo, los contadores dan cero y cero se lee «no ha
   nevado». Esto EJECUTA `acceso()` con y sin datos. */
/* ── LA CLASE ENTERA: NINGÚN HUECO SE CONVIERTE EN CERO A ESCONDIDAS ──
   Suyo, 01-09-2026: *«sobre todo los errores que se repiten y repiten»*.
   Y éste es el que más se repite de todos — 45 de los 88 hallazgos de
   nivel medio del barrido son esto mismo: `?? 0` sobre un dato que
   decide, que convierte «no lo sé» en «cero» sin que nadie lo note.

   Ya mordió tres veces: la nieve con AROME (31-08), el acceso sumando
   ceros y el aviso de hielo que NO salía sin humedad (los dos, 01-09).

   Esto recorre app.js y exige que cada uno de esos valores por defecto
   esté en la lista de abajo, CON SU MOTIVO. Uno nuevo sin justificar no
   se publica. No prohíbe el `?? 0`: obliga a decir por qué es inocuo. */
/* ── SUS LISTONES MANDAN, NO UN NÚMERO ESCRITO A MANO ──────────────
   Del barrido del 01-09-2026: diez sitios comparaban con 0,2 · 2 · 300 ·
   1000 escritos a mano en vez de con `S.thr`. O sea que él podía cambiar
   un ajuste y no pasaba nada — que es lo mismo que no tener el ajuste,
   pero peor, porque parece que sí. */
grupo('Sus listones mandan, no un número a mano (01-09-2026)');
{
  const sinComentar2 = src
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  /* Cada listón suyo, con los números de fábrica que NO pueden quedar
     sueltos comparando contra un dato. */
  const sueltos = [];
  for (const [rx, quien] of [
    [/\bprec\b[^\n]{0,30}[><]=? ?0\.2\b/g, 'rainWarn'],
    [/\bpico\b[^\n]{0,20}>= ?0\.2\b/g, 'rainWarn'],
    [/\bpico\b[^\n]{0,20}>= ?2 ?\?/g, 'rainNo'],
    [/\bcape\b[^\n]{0,20}>= ?1000\b/g, 'capeNo'],
    [/\bcape\b[^\n]{0,20}>= ?300\b/g, 'capeWarn'],
  ]) {
    for (const m of sinComentar2.matchAll(rx)) {
      const linea = sinComentar2.slice(0, m.index).split('\n').length;
      const texto = sinComentar2.split('\n')[linea - 1];
      if (texto.includes('S.thr') || texto.includes('thr?.') || texto.includes('thr.')) continue;
      sueltos.push(`${quien} en la línea ${linea}: ${texto.trim().slice(0, 55)}`);
    }
  }
  ok('ningún listón suyo comparado contra un número a mano',
     sueltos.length === 0, sueltos.join(' · '));
  ok('y los de fábrica siguen siendo los mismos, para que nada cambie de solo',
     /rainWarn: 0\.2/.test(src) && /rainNo *: 2/.test(src)
     && /capeWarn: 300/.test(src) && /capeNo *: 1000/.test(src),
     'si un valor de fábrica cambiara, esto le movería el criterio sin decírselo');
}

grupo('Ningún hueco se convierte en cero a escondidas (01-09-2026)');
{
  const CAMPOS = 'prec|gust10|gust|cape|cin|nieve|nieveSuelo|vis|frz|hum|racha|lluvia';
  /* Los que SÍ pueden ir a cero, y por qué. Si mañana hace falta otro,
     se añade aquí explicándolo — que es justo el paso que faltaba. */
  const PERMITIDOS = {
    'Math.round((d.cape ?? 0) / 100) * 100':
      'redondeo para AGRUPAR el titular del parte; el valor que se enseña sale de otro sitio',
    'Math.max(...pts.map(p => p.gust ?? 0), 10)':
      'ALTO del eje de la gráfica, no un dato: sin él no habría escala',
    'Math.max(...pts.map(p => p.prec ?? 0), 1)':
      'ALTO del eje de la gráfica, no un dato',
    '(b.cape ?? 0) > (a.cape ?? 0)':
      'solo ORDENA para buscar la hora de más CAPE; no se enseña ese cero',
  };
  const sinComentar = src
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  const rx = new RegExp(`[^\\n]*(?:${CAMPOS})\\s*(?:\\?\\?|\\|\\|)\\s*0[^\\n]*`, 'g');
  const pillados = [...sinComentar.matchAll(rx)].map(m => m[0].trim());
  const sinJustificar = pillados.filter(l =>
    !Object.keys(PERMITIDOS).some(ok => l.includes(ok)));

  ok('todo hueco puesto a cero sobre un dato que decide está justificado',
     sinJustificar.length === 0,
     `sin justificar: ${sinJustificar.map(l => l.slice(0, 70)).join(' · ')}`);
  ok('y la lista de justificados sigue siendo corta y toda ella se usa',
     Object.keys(PERMITIDOS).length <= 6
     && Object.keys(PERMITIDOS).every(k => sinComentar.includes(k)),
     'una excusa que ya no corresponde a nada es una puerta abierta');
}

/* Lo cazó ÉL mirando su pantalla el 02-09-2026: la tarjeta ponía
   «Altura de ola 0,7 m» y la gráfica de al lado «Ahora 1.2 m · lo más
   alto 1.2 m hoy a las 00:00». `wv[0]` es la primera hora de la serie
   del mar, que empieza a medianoche: «Ahora» enseñaba la de las 00:00. */
/* Tres cosas que cazó ÉL en sus capturas del 02-09-2026, las tres del
   mismo tipo: la pantalla decía dos cosas distintas a la vez. */
/* «Despejado ⚠ los otros ven 18 % de nubes» — visto por él el
   02-09-2026. Un 18 % no es motivo de aviso: lo que había saltado era el
   ABANICO entre modelos, y el texto enseñaba la mediana. Mismo fallo que
   el veredicto de la racha: enseñar un número y razonar con otro. */
/* ── EL LISTÓN DEL CIELO, RECALIBRADO ──────────────────────────────
   Suyo, 02-09-2026, viendo «Despejado ⚠ los otros ven 18 % de nubes»:
   *«es que esto ya pasa muchas veces»*. MEDIDO sobre 240 horas (5 sitios
   suyos, 48 h): el listón viejo saltaba el **65 %** de las horas. El
   nuevo, 5,4 % — y sigue cazando el caso real de Bermeo del 28-08. */
/* ── UN EMPLAZAMIENTO QUE NO SALE SE LEE COMO UNO SIN NOVEDAD ──────
   Del barrido del 01-09-2026, arreglado el 02-09. El parte quitaba de la
   lista, EN SILENCIO, los sitios sin previsión. Con veinte guardados, si
   a tres no les llega, desaparecen y la pantalla queda igual de tranquila
   que si estuvieran bien. Él cuenta los que ve, no los que faltan. */
grupo('El parte dice qué emplazamientos NO ha podido mirar (02-09-2026)');
{
  ok('los que no tienen dato se apartan pero se guardan, no se tiran',
     /const sinDato = todas\.filter\(x => !x\.d\)\.map\(x => x\.p\.name\)/.test(src),
     'antes el .filter los borraba y nadie se enteraba');
  ok('y se dicen con su NOMBRE, no solo cuántos',
     /Sin previsión de \$\{sinDato\.length\}/.test(src)
     && /sinDato\.map\(n => esc\(n\)\)\.join/.test(src),
     'saber cuáles faltan es lo que le deja ir a mirarlos aparte');
  ok('el recuento de arriba avisa de que no están todos',
     /faltan \$\{sinDato\.length\}/.test(src),
     '«ninguno con riesgo» sobre 17 de 20 se lee como si fueran los veinte');
  ok('y con TODOS sin dato la tarjeta NO se esconde',
     /No ha llegado la previsión de\s*\n?\s*ninguno de tus/.test(src)
     && /no quiere decir\s*\n?\s*que estén tranquilos/.test(src),
     'esconderla es justo lo que él lee como «hoy no hay nada que mirar»');
  ok('pero sin emplazamientos y sin fallo, se sigue escondiendo',
     /if \(!sinDato\.length\) \{ card\.hidden = true; return; \}/.test(src),
     'una tarjeta vacía sin motivo sí sobra');
}

grupo('El aviso del cielo salta poco y por lo que importa (02-09-2026)');
{
  const S0 = globalThis.S, C0 = globalThis.COMPARAR;
  /* ── EL BANCO SE MONTA AQUÍ, Y NO ES UN DETALLE ───────────────────
     En este punto del fichero `COMPARAR` está VACÍO (lo vacía una prueba
     anterior). Con la lista vacía, `cieloRaro` no encuentra otros
     modelos y devuelve null SIEMPRE — o sea que estas cinco pruebas
     pasaban en verde sin comprobar nada. Cazado el 02-09-2026 al
     romper el listón a propósito y ver que NO se ponían rojas.

     Es el fallo que este proyecto lleva persiguiendo toda la semana,
     dentro de la prueba que lo persigue. */
  globalThis.COMPARAR = [
    { om: 'a', name: 'ECMWF' }, { om: 'b', name: 'ICON' }, { om: 'c', name: 'GFS' },
    { om: 'd', name: 'AROME HD' }, { om: 'e', name: 'ARPEGE' },
  ];
  globalThis.quienLoMide = campo => (campo === 'cloud_cover' ? 'e' : null);
  const arma = (mio, otrosV) => {
    const t = ['2999-01-01T00:00'];
    const h = { time: t };
    COMPARAR.forEach((m, n) => { h[`cloud_cover_${m.om}`] = [otrosV[n] ?? null]; });
    S.comparativa = { _sitio: selloDe(), hourly: h };
    return cieloRaro(mio);
  };
  /* Y una que comprueba que el banco está puesto: si mañana alguien lo
     vacía otra vez, esto salta antes que las cinco de abajo. */
  ok('el banco de modelos está montado (si no, las de abajo no valen)',
     COMPARAR.length === 5 && !!arma(0, [100, 100, 100, 100, 0]),
     'con COMPARAR vacío, cieloRaro devuelve null siempre y todo sale verde');
  /* En el banco el dueño del cielo es 'e' (el quinto). */
  ok('BERMEO 28-08: él 0 % y otro 100 — se sigue avisando',
     !!arma(0, [45, 100, 56, 17, 0]),
     'un solo modelo 90 puntos por encima es un desacuerdo que no se calla');
  ok('lo de HOY: él 3 % y los otros 8-20 — se CALLA',
     arma(3, [18, 15, 8, 20, 3]) === null,
     'es el caso que le hizo decir «esto ya pasa muchas veces»');
  ok('con los cinco de acuerdo, callado',
     arma(80, [75, 80, 85, 78, 80]) === null);
  ok('él despejado y DOS cubiertos: se avisa',
     !!arma(10, [90, 85, 20, 15, 10]),
     'dos que cambian la lectura ya es motivo, aunque ninguno llegue a 90');
  ok('él despejado y UNO solo medio nublado: callado',
     arma(10, [55, 20, 15, 30, 10]) === null,
     'uno suelto a media nube no cambia lo que él va a ver');
  /* EL CASO QUE SEPARA LAS DOS PUERTAS, y sin él la prueba no vigila:
     UNO solo cubierto (85 contra 10 = 75 puntos, por debajo del abismo
     de 90). Con «hacen falta dos» se calla; con «uno basta» saltaría, y
     eso es lo que devolvía el aviso al 21 % de las horas. */
  ok('y con UN solo modelo cubierto (75 puntos), también callado',
     arma(10, [85, 20, 15, 30, 10]) === null,
     'si uno bastara, el aviso volvería a salir el 21 % de las horas');
  globalThis.S = S0; globalThis.COMPARAR = C0;
}

grupo('El aviso del cielo dice POR QUÉ ha saltado (02-09-2026)');
{
  const fn = new Function('cieloRaro', `
    ${sacar('function avisoCielo(nubes, { corto = false } = {}) {')}
    return avisoCielo;`);

  /* ── ESTE DOBLE ERA LA TRAMPA DEL ✓ ───────────────────────────────
     Devolvía `cuantos: 0`, un estado que `cieloRaro` NO puede producir
     (devuelve null antes de contar si no hay nadie en contra). Así la
     rama «van del X al Y» pasaba la prueba y en la app no corría nunca:
     siempre salía «los otros ven 18 %», la mediana, aunque el aviso lo
     hubiera disparado UN modelo a un abismo. Lo cazó la revisión del
     04-09-2026. Ahora el doble lleva la forma real: `porAbismo` y
     quién es. */
  const porAbismo = fn(() => ({ cuantos: 1, total: 4, mediana: 18, bajo: 3, alto: 60, abanico: 57,
                                porAbismo: true, quienes: ['ICON'], suLectura: 'cubierto', miLectura: 'claro' }));
  ok('si saltó porque UNO se fue a un abismo, se dice quién y qué ve',
     /ICON ve el cielo cubierto: van del 3 al 60 % de nubes/.test(porAbismo(5))
     && !/los otros ven 18/.test(porAbismo(5)),
     'un «los otros ven 18 %» con uno en 95 le daba la razón y escondía al que disparó el aviso');
  ok('y en corto, igual', /ICON lo ve cubierto/.test(porAbismo(5, { corto: true })));

  const descolgado = fn(() => ({ cuantos: 3, total: 4, mediana: 70, bajo: 60, alto: 80, abanico: 20 }));
  ok('si son ELLOS los que ven otra cosa, se dice la mediana',
     /los otros ven 70 % de nubes/.test(descolgado(5)),
     'ahí el número que importa sí es lo que ven los otros');

  ok('y sin desacuerdo, no se dice nada',
     fn(() => null)(5) === '');
}

grupo('Lo que dice la pantalla cuadra con lo que enseña (02-09-2026)');
{
  /* 1 · El veredicto restaba el modelo CARGADO mientras arriba se
     enseñaba el MÁS ALTO de los cinco. En BI BERMEO: tabla 36 contra 20,
     y debajo «se pasó 3 km/h». */
  ok('el veredicto resta el número que se ENSEÑA, no otro',
     /const mostrado = rachaCinco\?\.v \?\? H\?\.gust10;/.test(src)
     && /Math\.round\(M\.racha\) - Math\.round\(mostrado\)/.test(src)
     && !/Math\.round\(M\.racha - H\.gust10\)/.test(src),
     'antes: tabla 36 contra 20, y el veredicto decía «se pasó 3»');
  ok('y si el que se enseña es el más alto, se juzga a los dos: el más alto y el de la cabecera, cada uno con su cifra',
     /el más alto de los cinco \(\$\{esc\(deQuien\)\} \$\{wtxt\(mostrado, true\)\}\) \$\{juicioDe\(dif, mostrado\)\}/.test(src)
     && /el de la cabecera \(\$\{esc\(cargado\.n\)\} \$\{wtxt\(cargado\.v, true\)\}\) \$\{juicioDe\(difC, cargado\.v\)\}/.test(src)
     && !/que es el que se enseña arriba/.test(src),
     '20-09-2026, BI BERMEO: la tabla ponía 13 contra 9 y decía «se pasó 4»; la cabecera enseñaba 9 y había clavado');

  /* Y se EJERCITA con los números de su captura. */
  const dif = (mostrado, medida) => Math.round(medida - mostrado);
  ok('con sus números (36 enseñado, 20 medido) el veredicto dice 16, no 3',
     dif(36, 20) === -16 && dif(23, 20) === -3,
     'el 3 salía de restar el Automático, que no era el número a la vista');

  /* 2 · «1 aparato activado» junto a «no te llegaría ningún aviso». */
  ok('con otros aparatos apuntados, no se dice «ningún aviso»',
     /const otros = \(nAparatos \?\? 0\) > 0;/.test(src)
     && /A los <b>\$\{esc\(aparatosTxt\(nAparatos\)\)\}<\/b> sí/.test(src),
     'no es lo mismo «estoy vendido» que «al Mac no, al móvil sí»');
  ok('y sin ninguno, sí se dice que no le llega nada',
     /no te llegaría ningún aviso/.test(src));
}

grupo('En el mar, «Ahora» es AHORA (02-09-2026)');
{
  /* Se exige que la cifra salga de `iAhora`, no la forma exacta de
     escribirla: el 04-09-2026 pasó a `mTxt(...)` para que el decimal
     lleve coma, y esta prueba se puso roja sin que nada se hubiera
     roto. Lo que no puede cambiar es DE DÓNDE sale el número. */
  ok('la gráfica de oleaje busca la hora actual, no el primer dato',
     /const iAhora = \(\(\) => \{/.test(src)
     && /Ahora <b>\$\{[^}]*wv\[iAhora\]/.test(src)
     && !/Ahora <b>\$\{wv\[0\]/.test(src),
     'con la serie empezando a medianoche, wv[0] es la ola de las 00:00');

  /* Y se EJECUTA la cuenta, que es donde estaba el fallo. */
  const buscar = (wt, wv) => {
    const t = Date.now(); let mejor = 0, dif = Infinity;
    wt.forEach((x, i) => {
      if (wv[i] == null) return;
      const d = Math.abs(new Date(x).getTime() - t);
      if (d < dif) { dif = d; mejor = i; }
    });
    return mejor;
  };
  const hoy = new Date();
  const horas = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(hoy); d.setHours(i, 0, 0, 0); return d.toISOString();
  });
  const olas = horas.map((_, i) => i === 0 ? 1.2 : 0.7);
  const i = buscar(horas, olas);
  ok('con una serie de medianoche a medianoche, elige la hora de ahora',
     i === hoy.getHours() || Math.abs(i - hoy.getHours()) <= 1,
     `eligió ${i} y son las ${hoy.getHours()}`);
  /* La expectativa sigue al índice ELEGIDO: la línea de arriba ya admite
     ±1 h por el redondeo, y de 00:30 a 01:00 el reloj decía 0 mientras
     la hora más cercana era la 1 — la prueba se ponía roja sola cada
     noche a esa hora (04-09-2026, 00:5x). */
  ok('y ese valor NO es el de las 00:00 salvo que la hora elegida sea la 0',
     olas[i] === (i === 0 ? 1.2 : 0.7),
     'ese 1.2 de las 00:00 es justo el que se le enseñaba como «ahora»');
}

grupo('El acceso no cuenta un hueco como un cero (01-09-2026)');
{
  /* `listonRafaga()` entra como dependencia desde el 20-09-2026: el tope
     del viaje dejó de ser un 70 clavado y pasa a ser el suyo, el de
     Ajustes. Se le da el de fábrica del perfil hierro. */
  const fn = new Function('has', 'wtxt', 'kmTxt', 'listonRafaga', `
    ${sacar('function acceso(')}
    return acceso;`)(globalThis.has, x => `${x} km/h`, x => String(x),
                     () => ({ warn: 49, no: 70, de: 'hierro' }));

  const hora = (extra = {}) => ({ temp: 8, hum: 60, vis: 20000, frz: 3000, ...extra });

  /* 1 · Sin dato de nieve: NO se dice «no ha nevado», se dice que falta. */
  const sinNieve = fn(Array.from({ length: 12 }, () => hora({ prec: 0, gust10: 20 })), 400);
  ok('sin dato de nieve, se DICE que falta',
     (sinNieve.sinDato || []).includes('la nieve')
     && sinNieve.avisos.some(a => a.sinDato && /no lo sé/.test(a.t)),
     'antes sumaba ceros y el acceso salía limpio sin haber mirado la nieve');

  /* 2 · Con nieve de verdad, avisa como siempre. */
  const conNieve = fn(Array.from({ length: 12 }, () => hora({ nieve: 0.4, nieveSuelo: 0.05, prec: 0, gust10: 20 })), 400);
  ok('con nieve en el suelo sigue dando NO',
     conNieve.nivel === 'no' && conNieve.avisos.some(a => /cadenas/.test(a.t)));

  /* 3 · Con todo medido y tranquilo, no se inventa ningún aviso. */
  const limpio = fn(Array.from({ length: 12 }, () => hora({ nieve: 0, nieveSuelo: 0, prec: 0, gust10: 20 })), 400);
  ok('y con todo medido y tranquilo, no se dice nada',
     limpio.nivel === 'go' && limpio.avisos.length === 0 && limpio.sinDato.length === 0,
     'si avisara también aquí, el aviso dejaría de significar algo');

  /* 4 bis · EL HUECO NO PUEDE QUITAR EL AVISO DE HIELO.
     `(h.hum ?? 0) > 70` hacía que, sin humedad, el aviso de hielo no
     saliera: un dato que falta dejaba la pista limpia en pantalla. Con
     hielo el error tiene que caer del lado de avisar. */
  const cotaAlta = 900;
  const sinHum = fn([{ temp: 5, vis: 20000, frz: 1000, prec: 0, gust10: 20,
                       nieve: 0, nieveSuelo: 0 }], cotaAlta);
  ok('con el isocero pegado a la cota y SIN humedad, avisa igual del hielo',
     sinHum.avisos.some(a => /hielo en la pista/.test(a.t) && /por si acaso/.test(a.t)),
     'antes, sin humedad, el aviso de hielo simplemente no salía');
  const conHum = fn([{ temp: 5, hum: 40, vis: 20000, frz: 1000, prec: 0, gust10: 20,
                       nieve: 0, nieveSuelo: 0 }], cotaAlta);
  ok('y con humedad baja medida de verdad, NO avisa de hielo',
     !conHum.avisos.some(a => /hielo en la pista/.test(a.t)),
     'si avisara también con el dato en la mano, el aviso no diría nada');
  const sinLlu = fn([{ temp: 1, hum: 50, vis: 20000, frz: 5000, gust10: 20,
                       nieve: 0, nieveSuelo: 0 }], 100);
  ok('a 1° y sin dato de lluvia, avisa de placas igual',
     sinLlu.avisos.some(a => /placas de hielo/.test(a.t) && /por si acaso/.test(a.t)));

  /* 4 · Sin racha ni lluvia tampoco se afirma que no hay. */
  const soloNieve = fn(Array.from({ length: 12 }, () => hora({ nieve: 0, nieveSuelo: 0 })), 400);
  ok('sin racha ni lluvia, también se dice',
     soloNieve.sinDato.includes('la lluvia acumulada') && soloNieve.sinDato.includes('la racha'));
}

grupo('Ningún estado por emplazamiento se lee sin comprobar de quién es');
{
  const ESTADOS = ['comparativa', 'rayos', 'discrepa', 'diariaMulti'];
  const sinComentarios = src
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  const sueltos = [];
  for (const e of ESTADOS) {
    /* Se buscan las LECTURAS (`S.rayos?.`, `S.rayos.d`, `= S.rayos`) y se
       descartan las escrituras (`S.rayos = `) y las que ya van por la
       puerta (`deEsteSitio(S.rayos`). */
    /* Se buscan sobre el fuente SIN COMENTARIOS: si no, la propia
       explicación de la puerta cuenta como infracción. Los comentarios se
       sustituyen por espacios para no mover los números de línea. */
    const rx = new RegExp(`S\\.${e}(\\?\\.|\\.[a-z]|\\b(?! *=[^=]))`, 'g');
    for (const m of sinComentarios.matchAll(rx)) {
      const linea = sinComentarios.slice(0, m.index).split('\n').length;
      const texto = sinComentarios.split('\n')[linea - 1];
      if (texto.includes('deEsteSitio')) continue;
      if (new RegExp(`S\\.${e}\\s*=[^=]`).test(texto)) continue;   // escrituras
      /* La propia función que lo GUARDA puede mirar su caché por la clave
         (`S.rayos?.clave === clave`) y pasarlo al cuaderno: eso no es
         pintarlo en otro sitio, es escribirlo. */
      if (new RegExp(`S\\.${e}\\?\\.clave === clave`).test(texto)) continue;
      if (/apuntarParaCalibrar\(/.test(texto)) continue;
      sueltos.push(`${e}:${linea} → ${texto.trim().slice(0, 60)}`);
    }
  }
  ok('los cuatro estados por sitio se leen SIEMPRE por la puerta',
     sueltos.length === 0,
     `leídos a pelo: ${sueltos.join(' · ')}`);
}

grupo('Los ajustes dicen qué listones mandan en TU perfil (01-09-2026)');
{
  ok('en caseta y poste se avisa de que la ráfaga no va con sus listones',
     /OJO con los dos de ráfaga/.test(src)
     && /Tus dos listones de ráfaga se aplican al subir/.test(src)
     && /rafagaBestia \* 0\.7/.test(src),
     'podía bajar su tope a 50 y no cambiaba nada, sin que nadie se lo dijera');
  ok('y dice cuáles SÍ valen ahí',
     /Los de lluvia, CAPE y visibilidad sí valen aquí/.test(src));
  ok('en el perfil de torre se dice que ahí sí mandan',
     /aquí mandan\s*\n?\s*<b>tus listones de ráfaga<\/b>/.test(src));
  ok('y el hueco existe en el HTML, que si no el texto no se ve',
     /id="thrPerfil"/.test(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')));
}

grupo('Pasar no es avisar: el pulso lo dice (01-09-2026)');
{
  const fn = new Function('estadoPulso', `
    ${sacar('function textoPulso(d) {')}
    return textoPulso;`)(() => 'vivo');
  const bien  = fn({ haceMin: 20, sitios: 19, envia: true,  lista: 'la tuya' });
  const mudo  = fn({ haceMin: 20, sitios: 19, envia: false, lista: 'la tuya' });
  const otra  = fn({ haceMin: 20, sitios: 14, envia: true,  lista: 'respaldo' });
  const ambas = fn({ haceMin: 20, sitios: 14, envia: false, lista: 'respaldo' });

  ok('con todo en orden dice «en pie» y nada más',
     /Vigilante en pie/.test(bien) && !/MUDO|respaldo/i.test(bien));
  ok('si está MUDO, lo dice: pasa pero no avisa',
     /Vigilante en pie/.test(mudo) && /PERO ESTÁ MUDO/.test(mudo)
     && /NO manda avisos/.test(mudo),
     '«en pie» a secas se lee como «te avisará», y no es verdad');
  ok('si mira la lista de respaldo, lo dice',
     /NO está mirando TU lista/.test(otra) && /puede faltarle/.test(otra),
     'puede estar vigilando otros sitios que no son los suyos');
  ok('y si pasan las dos, se dicen las dos',
     /PERO ESTÁ MUDO/.test(ambas) && /NO está mirando TU lista/.test(ambas));
}

grupo('Sin cobertura, cada torre se juzga con SUS datos (01-09-2026)');
{
  /* ── LA GUARDIA DE LA CLASE, NO DEL CASO ──────────────────────────
     Suyo, 01-09-2026, al ver este arreglo: *«esto ya se reparó hace unos
     días… otra vez estaba mal»*. Y llevaba razón: el 31-08 se arregló la
     vía CON cobertura y la del monte se quedó igual, porque la prueba
     miraba SOLO la línea arreglada.

     Así que esto no comprueba dos líneas: RECORRE todas las llamadas a
     `buildHours` que construyen la lista de emplazamientos (las que caen
     dentro de una asignación a `S.torres`) y exige que TODAS lleven el
     tercer argumento. Una rama nueva que se olvide no llega a publicarse. */
  const ramas = [];
  let i = 0;
  while ((i = src.indexOf('S.torres = ', i)) !== -1) {
    const trozo = src.slice(i, i + 900);
    /* Los argumentos se cuentan con los paréntesis BALANCEADOS: una
       regex `[^)]*` corta en el paréntesis de `cfgDe(place)` y da un
       falso positivo — me pasó al escribir esta misma prueba. */
    let j = 0;
    while ((j = trozo.indexOf('buildHours(', j)) !== -1) {
      let k = j + 'buildHours('.length, hondo = 1, comas = 0;
      while (k < trozo.length && hondo > 0) {
        const c = trozo[k];
        if (c === '(') hondo++;
        else if (c === ')') hondo--;
        else if (c === ',' && hondo === 1) comas++;
        k++;
      }
      ramas.push({ args: comas + 1, txt: trozo.slice(j, k) });
      j = k;
    }
    i += 10;
  }
  ok('TODA rama que arma la lista de torres pasa su emplazamiento',
     ramas.length >= 2 && ramas.every(r => r.args >= 3),
     ramas.length < 2
       ? `solo encontré ${ramas.length} rama(s); la guardia se ha quedado ciega`
       : `sin tercer argumento: ${ramas.filter(r => r.args < 3).map(r => r.txt).join(' · ')}`);
  ok('y son las dos que hay: con cobertura y sin ella',
     ramas.length === 2, `encontradas ${ramas.length}`);
  ok('buildHours sigue cayendo en S.place solo como último recurso',
     /assess\(h, S\.thr, S\.perfil, place \?\? S\.place\)/.test(src),
     'ese respaldo vale para la pantalla de un solo sitio, no para la tabla de veinte');
}

grupo('La puerta de «¿esto es de este emplazamiento?» (01-09-2026)');
{
  const AQUI = { lat: 43.412976, lon: -2.718316 };
  const S0 = globalThis.S;
  globalThis.S = { place: AQUI };
  const d = globalThis.deEsteSitio;
  ok('deja pasar lo sellado con `clave` (rayos, discrepa)',
     d({ clave: '43.413,-2.718', x: 1 })?.x === 1);
  ok('deja pasar lo sellado con `_sitio` (la comparativa)',
     d({ _sitio: '43.413,-2.718', x: 2 })?.x === 2);
  ok('corta lo de OTRO emplazamiento',
     d({ clave: '43.228,-2.594', x: 3 }) === null,
     'es el fallo que se arregló el 31-08 en la comparativa y seguía en otros cuatro sitios');
  ok('y corta lo que NO lleva sello, en vez de darlo por bueno',
     d({ x: 4 }) === null,
     'lo que no se puede comprobar no se pinta como comprobado');
  ok('sin emplazamiento abierto tampoco se pinta nada',
     (globalThis.S = { place: null }, d({ clave: '43.413,-2.718' })) === null);
  globalThis.S = S0;
}

grupo('Los rayos son de ESTE sitio, y si fallan se dice (01-09-2026)');
{
  const hacer = (S) => {
    const el = { hidden: null, innerHTML: '', dataset: {}, classList: { toggle(){}, add(){}, remove(){} } };
    const fn = new Function('S', '$', 'esc', 'RAYO_VIGENTE', 'RAYO_RECIENTE',
                            'RAYO_ENCIMA', 'kmTxt', 'haceCuanto', 'rangoHoras', 'horaHM', `
      ${sacar('function deEsteSitio(est, place = null) {')}
      ${sacar('function pintarRayosTorre() {')}
      return pintarRayosTorre;`)(S, () => el, x => String(x), 90 * 60e3, 3 * 3600e3,
                                 5, x => String(x), () => 'hace un rato', () => 'de 14 a 15',
                                 () => '14:30');
    fn();
    return el;
  };
  const AQUI  = { lat: 43.412976, lon: -2.718316 };   // BI BERMEO
  const ALLI  = '43.228,-2.594';                      // BI OIZ
  const conRayo = t => ({
    d: { radio: 15, ultima: { cerca: true, hasta: t, desde: t, n: 3, encima: 0,
                              masCerca: { km: 4.2 } } },
    t: Date.now(), error: null });

  /* 1 · Los rayos de OTRO emplazamiento NO se pintan aquí. */
  const a = hacer({ place: AQUI, rayos: { clave: ALLI, ...conRayo(new Date().toISOString()) } });
  ok('los rayos de otro emplazamiento NO se pintan en éste',
     !/cerca|km/i.test(a.innerHTML) && /Mirando las descargas/.test(a.innerHTML),
     'ver los rayos del sitio anterior es peor que no verlos: da por medido lo que no lo está');

  /* 2 · Si AEMET falla, se DICE. Antes se escondía. */
  const b = hacer({ place: AQUI, rayos: { clave: '43.413,-2.718', d: null, t: Date.now(),
                                          error: 'HTTP 500' } });
  ok('si no se pueden leer los rayos, se DICE en vez de esconderse',
     b.hidden === false && /No he podido leer los rayos/.test(b.innerHTML)
     && /no quiere decir que no haya caído nada/.test(b.innerHTML),
     'un hueco donde siempre pone «Rayos medidos por AEMET» se lee como «no ha caído nada»');

  /* 3 · Y los de ESTE sitio sí se pintan. */
  const c = hacer({ place: AQUI,
                    rayos: { clave: '43.413,-2.718', ...conRayo(new Date().toISOString()) } });
  ok('los de este emplazamiento sí se pintan',
     c.hidden === false && /km/.test(c.innerHTML)
     && !/No he podido leer/.test(c.innerHTML));

  /* 4 · Sin descargas cerca SÍ es una respuesta: ahí sí se oculta. */
  const d = hacer({ place: AQUI, rayos: { clave: '43.413,-2.718', d: { ultima: null },
                                          t: Date.now(), error: null } });
  ok('pero «no ha caído nada cerca» sigue siendo una respuesta, y se calla',
     d.hidden === true && d.innerHTML === '',
     'si esto también avisara, el aviso dejaría de significar algo');

  /* 5 · Un estado sin sello NO se da por bueno. */
  const e = hacer({ place: AQUI, rayos: { ...conRayo(new Date().toISOString()) } });
  ok('un estado sin sello de sitio no se da por válido',
     /Mirando las descargas/.test(e.innerHTML),
     'lo que no se puede comprobar no se pinta como comprobado');
}

/* ══════════════════════════════════════════════════════════════════════
   LOS TRES DEL MAPA (21-09-2026)
   ──────────────────────────────────────────────────────────────────────
   Los tres son el mismo patrón que AL FILO: el arreglo ya estaba escrito
   a unas líneas, en la rama hermana, y no se había aplicado aquí.

   1. El CLIC de las cuatro capas de barbas leía `wind_u_component_*` —la
      componente oeste-este, CON SIGNO y en m/s— y la escribía con «km/h»
      al lado. Con viento del sur, que es el que le trae el agua, U vale
      casi cero: un viento real de 50 km/h a 50 m salía como «0,3 km/h».
      Y el rótulo de la capa dice «BARBAS y números = viento real».
   2. El cartel de «capa sustituida» se apagaba al final de `apply()`,
      pero Radar, Radar+previsión, AEMET y los satélites salen antes por
      cuatro `return`: el cartel se quedaba clavado encima del radar.
   3. `nowIndex()` iba por el modelo ELEGIDO cuando todo lo demás del
      deslizador va por el que PINTA. En una capa sustituida el botón
      «Ahora» te llevaba a otra hora y el sello verde «Hora actual» se
      encendía sobre una previsión.
   ══════════════════════════════════════════════════════════════════════ */
grupo('Los tres del mapa: el clic del viento, el cartel pegado y el «Ahora» (21-09-2026)');
{
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');

  /* ── 1 · EL VIENTO DEL MAPA, Y LO QUE SE MIDIÓ ───────────────────
     MEDIDO el 21-09-2026 en producción, ARPEGE pintando «Viento 50 m»,
     tres puntos: `wind_u_component_50m` y `wind_v_component_50m`
     devolvían EL MISMO número (2,04229 · 1,005653 · 2,354973). No es la
     capa pintando: con Temperatura pasa igual. Y no es que se ignore la
     URL: en el mismo punto `temperature_2m` da 17,0 y `wind_gusts_10m`
     da 3,3. Es el par u/v. Con u = v, `atan2(-u,-u)` = 225° fijo: las 33
     barbas de la pantalla apuntaban todas del suroeste, y el globito
     ponía `hypot(u,u)`, la componente por 1,41. */
  const vientoDeUV = new Function(
    M.slice(M.indexOf('function vientoDeUV(u, v) {'),
            M.indexOf('\n}', M.indexOf('function vientoDeUV(u, v) {')) + 2)
    + ' return vientoDeUV;')();

  ok('dos componentes IGUALES no son un viento: no se dibuja nada',
     vientoDeUV(2.04229, 2.04229) === null && vientoDeUV(1.005653, 1.005653) === null,
     'es la firma exacta de lo medido: la librería devolviendo la misma componente dos veces');
  ok('y con dos componentes de verdad sí sale el viento, con su rumbo',
     (() => { const a = vientoDeUV(0, 11.11), b = vientoDeUV(11.11, 0);
       const r = (x, n = 1) => Math.round(x * 10 ** n) / 10 ** n;
       return a && b && r(a.ms * 3.6) === 40 && r(a.desde) === 180
                     && r(b.ms * 3.6) === 40 && r(b.desde) === 270; })(),
     'del sur 180°, del oeste 270°: si esto se mueve, el rumbo del mapa deja de ser el rumbo');
  ok('sin una de las dos componentes tampoco hay viento',
     vientoDeUV(5, null) === null && vientoDeUV(null, 5) === null && vientoDeUV(5, NaN) === null);

  /* Y las dos puertas cerradas: la de arriba es la segunda, por si alguien
     reenciende las barbas; la primera es que ni se llega a pedir. */
  ok('las barbas y las motas no llegan ni a pedir las componentes',
     (() => { const i = M.indexOf('  componentes(L_) {');
       const cuerpo = M.slice(i, M.indexOf('\n  },', i));
       return /\n\s*return null;\s*$/.test(cuerpo); })()
     && /if \(!this\.verBarbas \|\| !C \|\| !puedeLeerse\(C\.v\) \|\| !this\.usando\)/.test(M)
     && /if \(!this\.verParticulas \|\| !C \|\| !puedeLeerse\(C\.v\) \|\|/.test(M),
     'el código de barbas y motas se conserva entero para el día que se traiga la rejilla de la API');

  ok('el rumbo del clic sale de la API de pronóstico, no de la tesela, y se dice de quién es',
     /if \(L_\.rumbo && R\.meta\?\.valid_times\?\.\[this\.t\]\)/.test(M)
     && /hourly=wind_direction_10m,wind_speed_10m/.test(M)
     && /a 10 m, \$\{esc\(typeof nombreDeModelo === 'function'/.test(M),
     'la tesela no sabe dar el rumbo; la API sí, y poner de quién es no cuesta nada');
  ok('y un rumbo de OTRA hora no vale como rumbo',
     /if \(has\(gr\) && dif <= 30 \* 60e3\)/.test(M),
     'el deslizador puede estar en una hora que la API no tenga: antes sin rumbo que con el de otra hora');

  /* ── 2 · EL CARTEL SE APAGA ANTES DE LOS CUATRO ATAJOS ───────────── */
  const ap = M.indexOf('  async apply() {');
  const apagar = M.indexOf('this.avisoSustitucion(null);', ap);
  const radar  = M.indexOf("if (L_.id === 'radar')", ap);
  const sat    = M.indexOf('if (L_.sat) { this.applySatelite', ap);
  ok('en apply() el cartel de «capa sustituida» se apaga ANTES de los atajos de radar y satélite',
     ap >= 0 && apagar > ap && radar > apagar && sat > apagar,
     'venías de una capa sustituida, pulsabas Radar, y el cartel se quedaba encima del radar');

  /* ── 3 · «AHORA» ES DEL QUE PINTA ────────────────────────────────── */
  ok('nowIndex() va por el modelo que PINTA, como el resto del deslizador',
     /nowIndex\(meta = this\.usando\?\.meta \?\? this\.meta\) \{/.test(M)
     && /indices\(meta = this\.usando\?\.meta \?\? this\.meta\)/.test(M),
     'el botón Ahora calculaba el índice en la lista del elegido y lo aplicaba a la del que pinta');
  ok('y loadMeta pide el suyo a mano, que ahí el deslizador ya está hecho con esa ficha',
     /this\.t = Math\.min\(this\.nowIndex\(m\), Math\.max\(0, n - 1\)\);/.test(M),
     'en loadMeta() `usando` puede ser todavía el de la capa anterior');
}

/* ══════════════════════════════════════════════════════════════════════
   QUE NO VUELVA A PASAR · EL VETO DE RAYOS ES DE TODO LO VIGENTE
   ──────────────────────────────────────────────────────────────────────
   Cazado el 21-09-2026, de madrugada, con él entrando de guardia a las 7.

   Los rayos son su ÚNICO veto: «debo acudir siempre y cuando no caigan
   rayos, porque la torre está pegada a la caseta y es un pararrayos».
   Ese veto entero colgaba de UN campo, `ultima`, y `ultima` era
   `conAlgo[conAlgo.length - 1]`: el último marco horario de AEMET con
   alguna descarga. Nada más.

   Pero el veto dura 90 minutos (RAYO_VIGENTE) y los mapas de AEMET van
   por horas cerradas, así que la ventana vigente pisa SIEMPRE dos marcos
   y solo se leía uno. Con la tormenta alejándose —lo normal— el marco
   nuevo tiene una descarga lejos y el viejo tiene veinticinco encima:
   ganaba el nuevo, el titular salía verde, el bloque de rayos de la ficha
   se escondía entero y el veredicto no se pisaba a NO APTO. El veto
   desaparecía justo en la ventana en la que manda.

   Y al lado, la otra: la frase «sin descargas a menos de 60 km en las
   últimas 24 h» salía de `horasCatalogo`, que era el catálogo entero de
   AEMET; se leen 6. Dieciocho horas que nadie había mirado, afirmadas
   limpias, en la única línea que él lee para decidir.

   Las dos guardias de abajo MUEVEN EL CÁLCULO DE VERDAD —`loQueAunCuenta`
   con marcos, y `Rayos.cerca()` entera contra un AEMET de mentira— en vez
   de escribirse el resultado a mano. Ése fue el fallo de AL FILO: la
   prueba se construía el `ultima` a mano y por eso no se enteró de que el
   cálculo llevaba tres semanas muerto.
   ══════════════════════════════════════════════════════════════════════ */
{
  const V = 90 * 60e3;                                 // RAYO_VIGENTE
  const cuenta = new Function('RAYO_VIGENTE', `
    ${sacar('function loQueAunCuenta(filas, ahora = Date.now()) {')}
    return loQueAunCuenta;`)(V);

  grupo('El veto de rayos cuenta TODO lo vigente, no solo el último marco (21-09-2026)');

  const ahora = Date.now();
  const hace  = m => new Date(ahora - m * 60e3).toISOString();

  /* La tormenta que se aleja: encima hace rato, lejos hace nada. Los dos
     marcos están dentro de los 90 minutos. */
  const ENCIMA = { desde: hace(140), hasta: hace(80),
                   n: 25, encima: 25, cerca: 25, pos: 3, masCerca: { km: 3.2 } };
  const LEJOS  = { desde: hace(80),  hasta: hace(20),
                   n: 1,  encima: 0,  cerca: 0,  pos: 0, masCerca: { km: 52 } };

  const u = cuenta([ENCIMA, LEJOS], ahora);
  ok('con la tormenta alejándose, las 25 descargas de encima SIGUEN contando',
     !!u && u.encima === 25 && u.n === 26 && u.cerca === 25,
     'quedarse con el último marco las borraba: pantalla verde con la tormenta encima hace hora y cuarto');
  ok('la más cercana es la de todo el rato vigente, no la del último marco',
     !!u && !!u.masCerca && u.masCerca.km === 3.2,
     'poner «la más cercana a 52 km» teniendo una a 3,2 km es peor que no poner nada');
  ok('el rato va del primer marco vigente al último, y la edad sale del último',
     !!u && u.desde === ENCIMA.desde && u.hasta === LEJOS.hasta,
     'de `hasta` cuelgan el veto y el «hace cuánto»: con el del marco viejo, el veto caducaría antes de tiempo');

  /* Cuando ya no queda nada vigente vuelve a mandar el último marco: de
     eso vive el «la última descarga fue hace X; nada desde entonces». */
  const VIEJO_A = { desde: hace(320), hasta: hace(260),
                    n: 9, encima: 9, cerca: 9, pos: 0, masCerca: { km: 2 } };
  const VIEJO_B = { desde: hace(260), hasta: hace(200),
                    n: 2, encima: 0, cerca: 0, pos: 0, masCerca: { km: 44 } };
  ok('pasada la ventana, se enseña el último marco con descargas y ya está',
     cuenta([VIEJO_A, VIEJO_B], ahora) === VIEJO_B,
     'si no, «nada desde entonces» sería mentira, y poner NO APTO por un rayo de hace seis horas es el error contrario');
  ok('sin descargas no se inventa un `ultima`',
     cuenta([{ ...ENCIMA, n: 0, encima: 0, cerca: 0 }], ahora) === null
     && cuenta([], ahora) === null && cuenta(null, ahora) === null);

  /* ── Y AHORA LA FICHA DE VERDAD, CON ESE `ultima` REAL ─────────────
     No se escribe a mano: se le da a `pintarRayosTorre` lo que acaba de
     devolver `loQueAunCuenta`. Y detrás, la contraprueba con el último
     marco a secas, que es lo que pasaba hasta el 21-09-2026. */
  eval(sacarConst('VC')); eval(sacarConst('VT'));
  const pintar = (ultima) => {
    const nodos = {};
    const nodo = () => ({ hidden: null, innerHTML: '', textContent: '', className: '',
                          dataset: {}, style: { setProperty() {} },
                          classList: { toggle() {}, add() {}, remove() {} } });
    const $ = id => (nodos[id] || (nodos[id] = nodo()));
    const S = { place: { lat: 43.412976, lon: -2.718316 },
                rayos: { clave: '43.413,-2.718', t: Date.now(), error: null,
                         d: { radio: 60, hasta: LEJOS.hasta, ultima } } };
    new Function('S', '$', 'esc', 'RAYO_VIGENTE', 'RAYO_RECIENTE', 'RAYO_ENCIMA',
                 'kmTxt', 'haceCuanto', 'rangoHoras', 'horaHM', 'VC', 'VT', `
      ${sacar('function deEsteSitio(est, place = null) {')}
      ${sacar('function pintarRayosTorre() {')}
      return pintarRayosTorre;`)(S, $, x => String(x), V, 3 * 3600e3, 15,
        x => String(x), () => 'hace 20 min', () => 'de 14:00 a 16:00', () => '16:00',
        globalThis.VC, globalThis.VT)();
    return nodos;
  };

  const bien = pintar(u);
  ok('la ficha NO se esconde con la tormenta todavía vigente',
     bien['#vRayos'].hidden === false && /25 de ellas a menos de 15 km/.test(bien['#vRayos'].innerHTML),
     'es el sitio donde él mira antes de mandar gente al monte');
  ok('y el veredicto se pisa a NO APTO por rayos',
     bien['#vBadge'].textContent === globalThis.VT.no
     && bien['#vTitle'].textContent === 'Han caído rayos encima de este emplazamiento',
     'la medida pisa al modelo, y en el 24-08-2026 el modelo no dijo tormenta en NINGUNA de las horas en que descargaba');

  const mal = pintar(LEJOS);
  ok('(contraprueba) con solo el último marco, la ficha se escondía y el veredicto no se tocaba',
     mal['#vRayos'].hidden === true && mal['#vRayos'].innerHTML === ''
     && !mal['#vBadge'],   // ni se llegaba a tocar el veredicto: se salía antes
     'esto es EXACTAMENTE lo que hacía la app hasta el 21-09-2026: el veto desaparecía solo');

  /* ══════════════════════════════════════════════════════════════════
     Y LAS HORAS QUE SE DICEN SON LAS QUE SE HAN MIRADO
     ──────────────────────────────────────────────────────────────────
     Esto mueve `Rayos.cerca()` ENTERA contra un AEMET de mentira: 24
     marcos en el catálogo, 6 leídos, una tormenta encima en el penúltimo
     y una descarga lejos en el último. Va en un `node -e` aparte porque
     `cerca` es `async` y aquí el recuento es síncrono.
     ══════════════════════════════════════════════════════════════════ */
  grupo('«en las últimas N h» son las horas MIRADAS, no el catálogo entero (21-09-2026)');

  const guion = `
    const RAYO_RADIO = 60, RAYO_ENCIMA = 15, RAYO_CERCA = 30, RAYO_VIGENTE = ${V};
    ${sacar('function kmEntre(a, b) {')}
    ${sacar('function loQueAunCuenta(filas, ahora = Date.now()) {')}
    const t0 = Date.now(), leidas = [], DESC = {};
    const CAT = { fuente: 'AEMET', licencia: '(c)', pagina: 'p',
                  ambitos: { PB: { bounds: { lat0: 35, lat1: 44, lon0: -10, lon1: 5 }, marcos: [] } } };
    for (let i = 23; i >= 0; i--) CAT.ambitos.PB.marcos.push({
      desde: new Date(t0 - (i + 1) * 3600e3).toISOString(),
      hasta: new Date(t0 - i * 3600e3).toISOString(),
      f: 'mapa' + (23 - i) + '.png' });
    DESC['mapa22.png'] = Array.from({ length: 25 }, (_, i) =>
      ({ lat: 43.027, lon: -2.5 + i * 1e-4, pos: i < 3 }));      // ~3 km: encima
    DESC['mapa23.png'] = [{ lat: 43.46764, lon: -2.5, pos: false }];  // ~52 km: ni cerca
    const R = {
      ${sacar('  caja(puntos, km) {', '\n  },')}
      ${sacar('  async cerca(place, { horas = 6, radio = RAYO_RADIO } = {}) {', '\n  },')}
      async catalogo() { return CAT; },
      ambito() { return 'PB'; },
      async leer(amb, m) { leidas.push(m.f); return DESC[m.f] || []; },
    };
    R.cerca({ lat: 43, lon: -2.5 })
     .then(d => console.log(JSON.stringify({ d, leidas })))
     .catch(e => console.log(JSON.stringify({ error: String(e && e.message || e) })));`;
  const sal = JSON.parse(require('child_process')
    .execFileSync(process.execPath, ['-e', guion], { encoding: 'utf8', timeout: 20000 }));

  ok('`Rayos.cerca()` corre de verdad contra un catálogo de 24 marcos',
     !sal.error && !!sal.d, sal.error || 'si esto revienta, lo de abajo no prueba nada');
  ok('se leen 6 marcos y se dicen 6, no las 24 horas del catálogo de AEMET',
     sal.d && sal.d.horasMiradas === 6 && sal.d.filas.length === 6 && sal.leidas.length === 6,
     'decir «sin descargas en las últimas 24 h» habiendo mirado 6 son 18 horas afirmadas limpias sin haberlas visto');
  ok('y el `ultima` que sale de `cerca()` trae la tormenta entera, no el último marco',
     sal.d && sal.d.ultima && sal.d.ultima.encima === 25 && sal.d.ultima.n === 26
     && sal.d.ultima.masCerca.km < 15,
     'aquí se comprueba el cableado: que `cerca()` llame a `loQueAunCuenta` y no se lo guise por su cuenta');
  ok('no queda ni rastro de `horasCatalogo` en la app',
     !/horasCatalogo/.test(src),
     'era un número que solo servía para decir una cifra que nadie había mirado');
  ok('la línea de «Antes de salir» cuenta las horas miradas y lo dice con esas palabras',
     /en las \$\{d\?\.horasMiradas \?\? 6\} h que he mirado/.test(src),
     'que se note que es lo mirado y no «las últimas», que se lee como si fuera todo');
}

/* El guardia de NO-SE-TOCA.md corre AL FINAL, justo antes del recuento:
   necesita haber visto ejecutarse TODAS las pruebas, y las de después del
   30-08 quedaban fuera (05-09-2026). */

/* El recuento y el veto están AL FINAL DEL FICHERO. Ver la nota allí:
   aquí estuvieron desde el 30-08 hasta el 05-09-2026, y todo lo que se
   añadió detrás se imprimía sin poder parar una publicación. */

/* ── LA RACHA TAMPOCO VA SOLA ────────────────────────────────────────
   Suyo, 30-08-2026, justo después de arreglarlo con la lluvia: *«y eso
   solo con lluvia, con viento, cape etc hara lo mismo??»* y *«si ha
   fallado en lluvia, te aseguro que en los otros tambien lo hara,
   revisalo 2 veces»*.

   Lo hacía. MEDIDO ese día en Bermeo a las 14:00, dos vías coincidentes:
   ICON 39,2 y GFS 14,4 km/h — ×2,7 — y la casilla enseñaba un número
   solo, sin decir nada.

   Cada prueba de aquí guarda un caso REAL de la calibración de 1.440
   horas sobre sus 20 emplazamientos. */
eval(sacar('function rachaQueNoVesTu(racha10) {'));
{
  globalThis.modeloDato = () => ({ name: 'Automático' });
  globalThis.COMPARAR = [
    { om: 'a', name: 'ECMWF' }, { om: 'b', name: 'ICON' }, { om: 'c', name: 'GFS' },
    { om: 'd', name: 'AROME HD' }, { om: 'e', name: 'ARPEGE' },
  ];
  globalThis.DEFAULT_THR = { gustWarn: 45, gustNo: 60 };

  const racha = (mia, otros, thr = { gustWarn: 45, gustNo: 60 }) => {
    const h = { time: ['2999-01-01T00:00'] };
    COMPARAR.forEach((m, n) => { h[`wind_gusts_10m_${m.om}`] = [otros[n] ?? null]; });
    S.comparativa = { _sitio: selloDe(), hourly: h };
    S.thr = thr;
    return rachaQueNoVesTu(mia);
  };

  /* EL CASO QUE LO JUSTIFICA TODO, y es de un sitio suyo. */
  const sollube = racha(27, [35, 55, 14, 24, 37]);
  ok('BI SOLLUBEMENDI 30-08 14:00: Automático 27 e ICON 55 se canta',
     sollube !== null && sollube.quien === 'ICON' && sollube.suya === 55,
     'su aviso está en 45: con el Automático puesto no vería nada');
  /* El listón es el del PERFIL (listonRafaga, 09-09-2026): en caseta —el
     90 % de su trabajo— la bestia de 70 avisa desde 49; los 45/60 de
     S.thr solo mandan al subir. Suyo: «Tu listón: 45 / 60. Eso no es así». */
  ok('y se dice QUÉ listón cruza, con sus números',
     sollube && sollube.limite === 49, JSON.stringify(sollube));

  const orduna = racha(38, [35, 72, 14, 24, 37]);
  ok('BI VIRGEN ORDUÑA 30-08 15:00: otro cruza tu tope de 70 y se dice ese listón',
     orduna && orduna.limite === 70, 'el tope manda sobre el aviso');

  /* LO QUE NO PUEDE SALTAR, que es la mitad del trabajo. Estas tres
     vienen de la calibración: las reglas por proporción saltaban en el
     21-34 % de las horas y se descartaron por eso. */
  ok('5 contra 11 km/h NO se canta aunque sea el DOBLE',
     racha(5, [7, 11, 6, 5, 8]) === null,
     'x2 con 6 km/h de diferencia no le cambia nada a nadie: era el 21,3 %');
  ok('15 contra 25 km/h tampoco: 10 de diferencia era el 14,5 % de las horas',
     racha(15, [20, 25, 14, 16, 22]) === null);
  ok('si todos coinciden, silencio', racha(30, [31, 29, 32, 28, 30]) === null);

  /* El tercer disparador: separarse mucho aunque no se cruce listón. */
  const lejos = racha(23, [30, 45, 20, 22, 28]);
  ok('separarse 20 km/h o más sí se canta aunque no cruce el listón',
     lejos !== null && lejos.dif >= 20, JSON.stringify(lejos));
  ok('19 km/h de separación todavía no', racha(23, [30, 41, 20, 22, 28]) === null,
     'el corte es 20, calibrado en 1,4 % de las horas');

  /* Los mismos cuidados que ya tenía el aviso del cielo. */
  ok('el modelo cargado no se compara consigo mismo',
     (globalThis.modeloDato = () => ({ name: 'ICON' }), racha(27, [35, 55, 14, 24, 37])) === null,
     'con ICON cargado, ICON 55 es SU dato: decir «ICON da 55» le hace dudar de un dato bueno');
  globalThis.modeloDato = () => ({ name: 'Automático' });
  ok('sin comparativa no se inventa nada',
     (S.comparativa = null, rachaQueNoVesTu(27)) === null);
  ok('sin racha propia tampoco', racha(null, [35, 55, 14, 24, 37]) === null);

  /* Y SUS umbrales, no los de por defecto: los puede cambiar en Ajustes. */
  const perfil0 = globalThis.perfil;
  globalThis.perfil = () => ({ vientoManda: true });   // al subir mandan S.thr
  ok('usa TUS listones, no los de fábrica',
     racha(27, [35, 33, 14, 24, 37], { gustWarn: 30, gustNo: 40 })?.limite === 30,
     'con el aviso en 30, ECMWF 35 ya lo cruza');
  globalThis.perfil = perfil0;
}

/* ── Y ESTÁ ENGANCHADO DONDE TIENE QUE ESTAR ─────────────────────────
   Suyo el mismo día: *«y nubosidad claro pero todo eso en las tres capas
   de torre, mis torres y ahora»*.

   En «Mis torres» NO se engancha `avisoRacha()`, y es a propósito: allí
   cada fila es un emplazamiento distinto y `S.comparativa` es la del
   sitio que tengas abierto en pantalla, así que enseñaría la racha de
   otro modelo **de otro sitio**. Esa pantalla ya lo resuelve mejor, con
   el desglose entero de los cinco modelos. */
{
  ok('el aviso de la racha existe UNA sola vez',
     (src.match(/function avisoRacha\(/g) || []).length === 1);
  ok('y sale del mismo sitio que decide, no de una copia',
     /function avisoRacha[\s\S]{0,300}rachaQueNoVesTu\(racha10\)/.test(src));
  ok('la ficha de Torre lo lleva',
     /kpi\('Ráfaga a 10 metros de altura'[\s\S]{0,400}avisoRacha\(g10/.test(src));
  ok('y la casilla de Ahora también',
     /dt\('Ráfaga a 10 m de altura'[\s\S]{0,400}avisoRacha\(C\.wind_gusts_10m/.test(src));
  ok('«Mis torres» sigue enseñando los CINCO modelos, que es más que una marca',
     /RACHA DE CADA MODELO, ESTA HORA/.test(src)
     && /el más alto es el que usa el semáforo/.test(src));
  ok('y el semáforo de verdad usa el más alto de todos, no el cargado',
     /const gMax = has\(h\.gust\) \? Math\.max\(h\.gust, otra\?\.v \?\? 0\)/.test(src),
     'si esto se desengancha, «lo dice ICON y tu modelo da 29» deja de ser cierto');
  ok('NO cambia el número: solo pone al lado lo que dan los demás',
     !/wind_gusts_10m\s*=\s*Math\.max/.test(src));
}

/* ── Y NO SE DICE DOS VECES ──────────────────────────────────────────
   Cazado en pantalla el 30-08-2026 al verificar lo recién publicado: la
   casilla de Ahora quedaba

       10 km/h  ⚠ ICON 55 km/h
       ⚠ ECMWF da 10 km/h y ICON 55 km/h — por encima de tu listón de 45

   El número de ICON dos veces en cuatro centímetros, y el del modelo
   cargado también. Ya estaba escrito en este proyecto, a cuenta de las
   dos frases de tormenta de Girona: *«decir dos veces lo mismo es
   ruido»*. Arriba va el dato; el pie dice lo que significa. */
{
  const casilla = (src.match(/dt\('Ráfaga a 10 m de altura'[\s\S]*?dt\('Humedad'/) || [''])[0];
  /* Se prohíbe IMPRIMIR el número (`wtxt(r.suya`), no mencionar la
     variable: desde el 05-09 la separación se calcula con
     `difVista(r.suya, r.mia)`, que imprime la RESTA, no el número. */
  ok('el pie de la ráfaga NO repite el número del otro modelo',
     casilla !== '' && !/wtxt\(r\.suya/.test(casilla) && !/\$\{r\.suya\}/.test(casilla),
     'r.suya ya se pinta arriba, en la marca corta');
  ok('ni el del modelo cargado',
     casilla !== '' && !/da \$\{wtxt\(C\.wind_gusts_10m/.test(casilla));
  ok('pero sigue diciendo QUIÉN y QUÉ listón cruza',
     /cruza tu listón de \$\{wtxt\(r\.limite/.test(casilla)
     && /\$\{esc\(r\.quien\)\}/.test(casilla));
  ok('y cuando no cruza listón, dice cuánto se separa',
     /se separa \$\{difVista\(r\.suya, r\.mia/.test(casilla));
  ok('tu listón se sigue diciendo siempre, salte o no',
     (casilla.match(/tu listón: \$\{wtxt\(listonRafaga\(\)\.warn, true\)\}/gi) || []).length >= 2);
}


/* ═══════════════════════════════════════════════════════════════════
   «MAÑANA» NO PUEDE QUERER DECIR DOS COSAS
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026, con el aviso de CAPE de Bermeo delante:

     *«¿del CAPE mañana llega tal… mañana de cuándo? ¿de esta mañana?
       ¿de mañana sábado? Lío, ¿no?»*

   En castellano «mañana» son el día siguiente Y la primera mitad del
   día, y en esa tarjeta cabían las dos: justo encima ponía «ahora hasta
   las 19:00». Aquí eso decide si sube a una torre hoy o mañana.

   Estaba escrito en CINCO sitios distintos. Ahora hay uno —
   `nombreDeDia`— y esto vigila que siga habiendo uno.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   LOS NÚMEROS QUE SE VEN JUNTOS TIENEN QUE CUADRAR ENTRE ELLOS
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026, en un pantallazo suyo: *«Automático da 28° y ECMWF
   da 35° — 6° de diferencia»*. Y 35 menos 28 son 7.

   No había error de cuenta: 28,4 → 28, 34,6 → 35, y la diferencia de
   verdad 6,2 → 6. Los tres redondeados por su cuenta, cada uno bien, y
   los tres juntos mal. Él lo restó de cabeza y no le salió.

   Tres cifras que no cuadran entre ellas le hacen dudar de toda la
   pantalla. Y con razón: si esa no cuadra, ¿por qué se va a fiar de la
   racha? Esto vigila que la diferencia se saque de los números que se
   ESCRIBEN, no de los de dentro.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   EL ICONO NO PUEDE DECIR SECO SI EL NÚMERO DICE QUE MOJA
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026: *«los iconos de lluvia etc que cuadren»*.

   Medido ese día: **AROME HD, el modelo que él usa, NO publica el
   código del tiempo** — 0 de 72 horas—, pero sí publica la lluvia —57
   de 72—. Así que sus milímetros son de AROME y el dibujo se lo presta
   ECMWF, que es de 25 km contra 1,3.

   Cuando AROME ve agua en un valle y ECMWF no —que es justo para lo que
   sirve tener AROME— quedaba una nube sin gotas con medio milímetro
   cayendo debajo. En Lille, a las 17:00: AROME 0,5 mm, ECMWF llovizna
   (cuadró), **ICON «cubierto» (no habría cuadrado)**.

   No se pudo medir en más sitios porque ese día no llovía en toda
   Francia: 2 horas de agua en 513 miradas. Con dos casos no se afirma
   nada, así que en vez de fiarse del préstamo se le puso un tope.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   LA FOTO NO PUEDE SALIR CON LAS COORDENADAS DE OTRO SITIO
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026: *«esto pasa muy a menudo, el tema de la ubicación;
   creo que la pilla de ahora, que está puesto Calpe… pero no debe
   pillar de ahí ya que pongo mi ubicación pinchada»*, *«al enviar»*.

   Ese día mandó dos fotos desde su casa de Bermeo con **doce segundos**
   de diferencia. La de las 16:00:59 salió rotulada **«Calpe»** —el
   emplazamiento que tenía abierto, a 700 km— y la de las 16:01:11 ya
   con su GPS. Mismo sitio, misma mano.

   Era una carrera: pincha «Añadir dónde estoy», el GPS tarda unos
   segundos, y si manda antes de que conteste la nota se caía al
   emplazamiento **sin decir nada**. Los cinco modelos se congelan
   entonces para Alicante y la comparación queda falseada sin que se
   note.

   Y lo peor: **ya estaba documentado desde el 29-08-2026**, con cuatro
   fotos suyas de Busturia y la primera rotulada Bermeo a 4,5 km. Se
   escribió el comentario y no se arregló. Esta prueba existe para que
   no vuelva a quedarse en un comentario.
   ═══════════════════════════════════════════════════════════════════ */
console.log('\n  Si el GPS viene de camino, se le espera antes de mandar');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');

  ok('se guarda la petición de GPS que está en marcha',
     /let ubiPidiendo = null;/.test(src)
     && /ubiPidiendo = new Promise\(/.test(src),
     'sin esto no hay forma de saber que el GPS venía de camino');

  ok('y se limpia tanto si contesta como si falla',
     (src.match(/ubiPidiendo = null; listo\?\.\(\);/g) || []).length === 2,
     'si se queda colgada, el siguiente envío esperaría 12 s de balde');

  /* Las dos puertas por donde sale algo suyo. */
  for (const [fn, nombre] of [['mandarFoto', 'la foto'], ['mandarCampo', 'la nota']]) {
    const i = src.indexOf(`async function ${fn}(`);
    const cuerpo = src.slice(i, i + 2600);
    const iEspera = cuerpo.indexOf('await esperarLaUbi(');
    /* Lo que importa es que espere antes de LEER LAS COORDENADAS. Un
       `ubiVigente()` suelto antes —el de «tengo tu ubicación, pero
       falta que escribas»— es solo un mensaje y no viaja con la nota. */
    const iLee = cuerpo.indexOf('ubiVigente()?.lat');
    ok(`${nombre} espera al GPS ANTES de leer las coordenadas`,
       i > 0 && iEspera > 0 && iEspera < iLee,
       'si lee primero, vuelve a salir con el emplazamiento abierto');
  }

  /* Y la espera, ejecutada: con la petición en marcha tiene que esperar
     de verdad, no seguir de largo. */
  eval(sacar('async function esperarLaUbi(est) {'));
  (async () => {
    let resolver;
    globalThis.ubiPidiendo = new Promise(r => { resolver = r; });
    globalThis.campoUbi = null;
    globalThis.ubiVigente = () => globalThis.campoUbi;

    let acabo = false;
    const p = esperarLaUbi(null).then(() => { acabo = true; });
    await new Promise(r => setTimeout(r, 40));
    ok('con el GPS en camino, NO sigue de largo', !acabo,
       'aquí es donde salía «Calpe» en vez de Bermeo');

    globalThis.campoUbi = { lat: 43.41, lon: -2.71, t: Date.now() };
    globalThis.ubiPidiendo = null;
    resolver();
    const hay = await p.then(() => esperarLaUbi(null));
    ok('y en cuanto llega, sigue y con la ubicación buena', acabo && hay === true);

    globalThis.ubiPidiendo = null;
    globalThis.campoUbi = null;
    ok('sin petición en marcha no espera nada: no estorba al que no la usa',
       (await esperarLaUbi(null)) === false);
  })();
}

/* ═══════════════════════════════════════════════════════════════════
   EL DIBUJO DEL DÍA NO PUEDE CONTRADECIR A SUS PROPIAS HORAS
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026 a las 23:00:

     *«si yo miro en 10 días y veo el sábado nublado, vale, ala, todo el
       día; pero resulta que nublado solo unas horas… menudo pronóstico
       que le digo a la gente que me da mi app»*
     *«y otros en la playa el sábado y yo en casa, porque el sábado
       ponía nublado todo el día»*
     *«todos los días lo mismo, es que no falla, es a diario ya»*

   **Le costó un sábado.** Y llevaba siete días diciendo que bailaba.

   LO MEDIDO ESE DÍA, pidiendo a ECMWF los diez días de Bermeo:

     04-09  código DIARIO: CUBIERTO   ·  sus 15 h de luz: DESPEJADO 9
     08-09  código DIARIO: LLOVIZNA   ·  0,0 mm y las 15 h CUBIERTO

   El `weather_code` diario que publica el modelo **no resume el día: es
   el peor momento de las 24 horas**. Una hora tapada de madrugada y el
   día entero salía con nubarrón — mientras «Horas», que va hora a hora,
   enseñaba el sol de verdad.

   Esta prueba existe para que no vuelva a colarse: el dibujo sale de
   las HORAS, y donde no hay horas se dice que no se sabe.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   LA REVISIÓN DE LA NOCHE DEL 04-09-2026 — LOS CUATRO PRIMEROS
   ───────────────────────────────────────────────────────────────────
   134 hallazgos, 66 confirmados por dos escépticos. Estos son los cuatro
   con los que el informe decía empezar, y sus guardias. El detalle vive
   en REVISION-2026-09-04.md.
   ═══════════════════════════════════════════════════════════════════ */
console.log('\n  Revisión 04-09: clases 1b, 2, 4, 5 y 6 — lo que se imprime cuadra con lo que se compara');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  /* C4 */
  ok('la casilla de ráfaga saca la separación con difVista, no con wtxt(dif)',
     /difVista\(r\.suya, r\.mia, true\)/.test(codigo) && !/wtxt\(r\.dif, true\)/.test(codigo));
  ok('deQuien compara redondeado: no dice «ICON 61 y tu modelo 61» para decir que uno gana',
     /wRed\(otra\.v\) > wRed\(h\.gust\)/.test(codigo));
  ok('el semáforo de ráfaga y viento compara lo que se IMPRIME: 59,6 se ve 60 y sale rojo',
     /wRed\(gMax\) >= wRed\(thr\.gustNo\)/.test(codigo) && /wRed\(gMax\) >= wRed\(thr\.gustWarn\)/.test(codigo)
     && /wRed\(h\.wind\) >= wRed\(thr\.windNo\)/.test(codigo) && !/[^d]\(gMax >= thr\.gustNo\)/.test(codigo));
  ok('el tope del dron, igual', /wRed\(v\) >= wRed\(DRON_TOPE\)/.test(codigo));
  /* Ejecutado con la función real: 59,6 km/h contra listón 60 → NO, no ámbar. */
  {
    /* El arnés solo trae el perfil «hierro»; para la rama del viento hace
       falta el de torre (vientoManda: true), como está en app.js. */
    const P0 = globalThis.PERFILES, PR0 = globalThis.peorRacha;
    globalThis.PERFILES = { ...P0, torre: { et: 'torre', vientoManda: true, rafagaBestia: null, lluviaManda: true } };
    globalThis.peorRacha = () => null;
    const thr = { windWarn: 40, windNo: 55, gustWarn: 45, gustNo: 60, rainWarn: 0.2, rainNo: 2, capeWarn: 500, capeNo: 1000 };
    const r = assess({ h: 40, wind: 20, gust: 59.6, gust10: 40, temp: 18, code: 1, cape: 50, cin: 0, prec: 0, pop: 0 }, thr, 'torre');
    ok('59,6 de ráfaga se imprime «60» y el semáforo dice NO, no ámbar', r.st === 'no', `st=${r.st}`);
    const r2 = assess({ h: 40, wind: 20, gust: 59.4, gust10: 40, temp: 18, code: 1, cape: 50, cin: 0, prec: 0, pop: 0 }, thr, 'torre');
    ok('y 59,4 se imprime «59» y sigue ámbar', r2.st === 'warn', `st=${r2.st}`);
    globalThis.PERFILES = P0; globalThis.peorRacha = PR0;
  }
  /* C5 */
  ok('wtxt pone la coma decimal como mmTxt/kmTxt/mTxt (en m/s escribía «15.0»)',
     /const wtxt = [\s\S]{0,200}?\.toFixed\(wu\(\)\.d\)\.replace\('\.', ','\)/.test(codigo));
  /* C6 */
  ok('el oleaje imprime el máximo REAL, y el suelo de escala solo dibuja',
     /const mxReal = Math\.max\(\.\.\.wv\.filter\(has\)\);/.test(codigo)
     && /lo más alto <b>\$\{mTxt\(mxReal\)\} m<\/b>/.test(codigo)
     && /const iMx = wv\.findIndex\(v => v === mxReal\)/.test(codigo),
     '«lo más alto 0,5 m» con la hora del máximo real al lado parecía un dato medido');
  ok('la pestaña Avisos cuenta las horas ANTES de recortar a seis',
     /const malas = hrs\.filter\(h => h\.st === 'no'\);\s*const bad = malas\.slice\(0, 6\);/.test(codigo)
     && !/\$\{bad\.length\}/.test(codigo),
     'con 20 horas de galerna el titular decía «6 horas en 48 h»');
  /* C2 */
  ok('avisoCielo lee porAbismo: la rama «cuantos === 0» que nunca corría ya no está',
     !/r\.cuantos === 0/.test(codigo) && /if \(r\.porAbismo\)/.test(codigo) && /r\.quienes\?\.\[0\]/.test(codigo));
  ok('la franja nombra a SU modelo con duenoLluvia(), no «otro modelo la ve seca»',
     /nombreDeModelo\(duenoLluvia\(\)\) \|\| 'Tu modelo'/.test(codigo)
     && !/nombreDeModelo\(ELEGIDO_POR_ACIERTO\.precipitation\)/.test(codigo));
  ok('el dueño del cielo se pregunta a quienLoMide, no al elegido a pelo',
     /const e = quienLoMide\('cloud_cover'\);/.test(codigo) && !/const e = ELEGIDO_POR_ACIERTO\.cloud_cover;/.test(codigo));
  /* C1b */
  ok('el ⚡ del día lleva su hora, como ya hacía la franja',
     /const horaDeTormenta = dia =>/.test(codigo) && /Riesgo de tormenta\$\{horaDeTormenta\(t\)/.test(codigo));
}

console.log('\n  Revisión 04-09: el parte no dice «hoy» para otro día');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  /* 1. Yo mismo lo rompí por la mañana: al poner «mañana sábado» en la
     etiqueta, `S.parteDia === 'mañana'` no volvió a cumplirse y la línea
     de lluvia decía «Sin lluvia HOY» bajo el parte del domingo. */
  /* Se mira el código SIN comentarios: el comentario que explica el
     arreglo cita la comparación vieja a propósito, como historia. */
  const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('la línea de lluvia del parte NO compara contra el texto «mañana»',
     !/S\.parteDia === 'mañana'/.test(codigo),
     'comparar contra una cadena de presentación fue lo que dejó «hoy» para siempre');
  ok('usa la FECHA del parte, que viaja junto a la etiqueta',
     /S\.parteDiaFecha = v_\.dia;/.test(src) && /nombreDeDia\(S\.parteDiaFecha \?\? new Date\(\)\)/.test(src));
  ok('y la cabecera compara el número (salto), no el texto',
     /v_\.salto === 1 \? `El parte de MAÑANA/.test(src) && !/cual === 'mañana'/.test(src));
  /* Ejecutado: con la fecha de mañana, el nombre que sale es el de mañana. */
  const man = new Date(); man.setDate(man.getDate() + 1);
  const txt = nombreDeDia(man);
  ok('con la fecha de mañana escribe «mañana <día>», no «hoy»',
     txt.startsWith('mañana ') && txt !== 'hoy', txt);
}

console.log('\n  Revisión 04-09: los dos dibujos del día dicen QUÉ horas resumen');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  const i = src.indexOf('function iconosDelDia(dia)');
  const cuerpo = src.slice(i, i + 6000);
  /* 2. El hermano del sábado: el corte lo pone cieloPartido donde cambia
     el cielo (8:00-19:00) y debajo seguía «mañana»/«tarde» fijo. */
  ok('ya no hay rótulos fijos «mañana»/«tarde» bajo los dos dibujos',
     !/<u>mañana<\/u>/.test(cuerpo) && !/<u>tarde<\/u>/.test(cuerpo),
     'con el corte a las 16:00, «tarde» resumía solo de 17 a 20 h');
  ok('el rótulo sale de las MISMAS horas que el dibujo',
     /R\.partes\.map\(t => `<i>\$\{icon\(t\.code, d\)\}<u>\$\{has\(t\.desde\) \? `\$\{t\.desde\}h` : ''\}<\/u><\/i>`\)/.test(cuerpo),
     'desde el 09-09 cada tramo lleva su icono y su hora, del mismo objeto');
  /* Ejecutado, la función de rótulo tal cual está escrita. */
  const rot = arr => arr?.length ? `${arr[0].date.getHours()}-${arr[arr.length - 1].date.getHours()} h` : '';
  const h = n => ({ date: new Date(2026, 8, 10, n) });
  ok('corte a las 16: «6-15 h» y «16-20 h», no «mañana» y «tarde»',
     rot([6,7,8,9,10,11,12,13,14,15].map(h)) === '6-15 h' && rot([16,17,18,19,20].map(h)) === '16-20 h');
  ok('la tarjeta de HOY por la tarde no rotula «mañana» a las 16 y 17',
     rot([16,17].map(h)) === '16-17 h');
  ok('sin horas, rótulo vacío en vez de inventado', rot([]) === '');
}

console.log('\n  Revisión 04-09: el listón lleva unidad y conversión, como la racha');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  /* 3. Era el único sitio que imprimía S.thr.gustNo crudo: en nudos
     salía «29 kt — tu listón es 45». */
  ok('ningún «tu listón es» imprime el número crudo',
     !/tu listón es \$\{R\.listón\}/.test(src) && /tu listón es \$\{wtxt\(R\.listón, true\)\}/.test(src));
}

console.log('\n  Revisión 04-09: sin dato de lluvia o CAPE, la hora dice «sin dato», no verde');
{
  /* 4b. `assess()` solo emitía 'nd' para el viento (y solo en torre). Con
     prec o cape a null no decía nada y remataba «Nada llega a tus
     listones» en verde. Ejecutado con la función real. */
  const thr = { windWarn: 40, windNo: 55, gustWarn: 45, gustNo: 60, rainWarn: 0.2, rainNo: 2, capeWarn: 500, capeNo: 1000 };
  const base = { h: 10, wind: 5, gust: 8, gust10: 8, temp: 18, code: 1, cin: 0, pop: 0 };
  const sinLluvia = assess({ ...base, cape: 50, prec: null }, thr, 'hierro');
  ok('con la lluvia a null la hora sale «sin dato», no verde',
     sinLluvia.st === 'nd' && sinLluvia.reasons.some(r => r.s === 'nd' && /Lluvia: sin dato/.test(r.txt)),
     `st=${sinLluvia.st} · ${sinLluvia.reasons.map(r => r.txt).join(' | ')}`);
  const sinCape = assess({ ...base, cape: null, prec: 0 }, thr, 'hierro');
  ok('con el CAPE a null la hora sale «sin dato», no verde',
     sinCape.st === 'nd' && sinCape.reasons.some(r => /CAPE: sin dato/.test(r.txt)),
     `st=${sinCape.st}`);
  const completa = assess({ ...base, cape: 50, prec: 0 }, thr, 'hierro');
  ok('y con los dos datos presentes sigue verde: «Nada llega a tus listones»',
     completa.st === 'go' && completa.reasons.some(r => /Nada llega/.test(r.txt)),
     `st=${completa.st}`);
  ok('el «Nada llega a tus listones» ya no puede salir sobre un hueco',
     !sinLluvia.reasons.some(r => /Nada llega/.test(r.txt)) && !sinCape.reasons.some(r => /Nada llega/.test(r.txt)));
}

console.log('\n  Revisión 04-09: AEMET caído no se lee como «ninguna estación cerca»');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  /* 4a. `.then(x => x.json())` sin mirar x.ok: un 502 con {error:true}
     acababa en [] y la tabla decía «ninguna cerca». Se busca en el
     fichero entero: anclar en la URL fallaba porque `cargarObs` pide la
     misma ruta más arriba. */
  ok('la petición a AEMET mira x.ok y el error del servidor',
     /if \(!x\.ok \|\| j\?\.error\) \{\s*S\.medidoSinAemet/.test(src), 'un 502 de AEMET no puede convertirse en «no hay»');
  ok('y deja constancia con la razón que manda el servidor',
     /S\.medidoSinAemet = `no he podido preguntar a AEMET/.test(src));
  ok('y ya no queda el `.then\(x => x.json\(\)\)` ciego en la petición a AEMET',
     !/\/estaciones\?lat=\$\{p\.lat\.toFixed\(4\)\}[^\n]*\n\s*\.then\(x => x\.json\(\)\)/.test(src));
  ok('la bandera se resetea en cada lectura, como la de Euskalmet',
     /S\.medidoSinEuskalmet = null; S\.medidoSinAemet = null;/.test(src));
  /* 16-09-2026 12:40, MEDIDO en producción: 20 peticiones sueltas = 40 llamadas a AEMET en un
     segundo y AEMET corta por límite de uso (11 de 20 sitios con 502). Un lote, una descarga. */
  const fnEst = require('fs').readFileSync(require('path').join(__dirname, 'netlify', 'functions', 'estaciones.js'), 'utf8');
  ok('la tabla de Mis estaciones pide AEMET en UN lote (?puntos=), no sitio a sitio',
     /fetch\(`\/estaciones\?puntos=\$\{encodeURIComponent\(puntos\)\}&radio=40`\)/.test(src)
     && !/fetch\(`\/estaciones\?lat=\$\{p\.lat\.toFixed\(4\)\}&lon=\$\{p\.lon\.toFixed\(4\)\}&radio=40`\)/.test(src)
     && /return sitios\.map\(\(_, i\) => \(lista\[i\]\?\.estaciones \|\| \[\]\)/.test(src),
     'veinte peticiones a la vez es lo que AEMET corta');
  ok('y el servidor entiende el lote con UNA descarga de AEMET compartida entre las peticiones en curso, y sigue contestando sitio a sitio',
     /const puntos = \(p\.get\('puntos'\) \|\| ''\)\.split\('\|'\)/.test(fnEst)
     && /function descargarTodas\(clave\)/.test(fnEst) && /if \(memo\.promesa\) return memo\.promesa;/.test(fnEst)
     && /promesa\.then\(soltar, soltar\);/.test(fnEst)
     && /puntos: puntos\.map\(q => \(\{ lat: q\.lat, lon: q\.lon,/.test(fnEst)
     && /return json\(\{ \.\.\.comun, estaciones: cercanas\(todas, lat, lon, radio, limite, historia, ahora\) \}, 200\);/.test(fnEst),
     'la descarga se suelta al acabar: un 503 de AEMET tiene que verse como 503, no como el dato de antes');
  ok('y la cabecera de la tabla dice de QUIÉN es el hueco (cuatro estados)',
     /no he podido preguntar ni a Euskalmet ni a AEMET/.test(src)
     && /solo Euskalmet · no he podido preguntar a AEMET/.test(src)
     && /solo AEMET · falta Euskalmet/.test(src) && /ninguna cerca/.test(src),
     '«ninguna cerca» con AEMET caído era la mentira; «solo AEMET» nombraba justo a la que falló');
}

console.log('\n  El dibujo del día sale de sus horas, no del peor rato');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  const i = src.indexOf('function iconosDelDia(dia)');
  const cuerpo = src.slice(i, i + 3200);

  ok('la función existe y recibe el día',
     i > 0 && /function iconosDelDia\(dia\)/.test(cuerpo));

  ok('el código DIARIO ya no se pinta nunca como icono',
     !/return icon\(codigoDiario/.test(cuerpo),
     'es el peor momento de las 24 h: pintó un sábado de sol con nubarrón');

  ok('sin horas con dato se dice que no se sabe, en vez de inventar',
     /return SIN_DIBUJO;/.test(cuerpo)
     && /const SIN_DIBUJO =/.test(src),
     'un interrogante se mira en Horas; un nubarrón falso le manda a casa');

  ok('solo cuentan las horas que TRAEN código',
     /const conDato = hs\.filter\(h => has\(codigoQueSeVe\(h, h\.code\)\)\)/.test(cuerpo),
     'con AROME cargado no hay ni una hora de 240 con weather_code propio');

  ok('y el día (6-20 h, o la noche si no hay más) sale de esas horas, no de la lista cruda',
     /let delDia = conDato\.filter\(h => h\.date\.getHours\(\) >= 6/.test(cuerpo)
     && /delDia = conDato\.filter\(h => h\.date\.getHours\(\) >= 21/.test(cuerpo));

  /* Y la cuenta, ejecutada: con nueve horas de sol y un diario que dice
     «cubierto», tiene que ganar el sol. Es el caso del 04-09. */
  {
    const horas = [];
    for (let h = 6; h <= 20; h++) horas.push({ code: h <= 14 ? 0 : 3, prec: 0 });
    const dom = codigoFranja(horas);
    ok('con 9 h de sol y 6 de nube, el que manda es el SOL',
       dom === 0, `salió ${dom}`);
    ok('y el diario decía CUBIERTO (3): ya no lo mira nadie', true);
  }
}

console.log('\n  El icono cuadra con la lluvia que él está leyendo');
{
  const THR = { rainWarn: 0.2, rainNo: 2.0 };
  const CUBIERTO = 3, DESPEJADO = 0, LLOVIZNA = 51, LLUVIA = 61, LLUEVE_BIEN = 63;

  /* El caso de él: AROME da el agua y no da el código. */
  ok('con 0,5 mm y el cielo prestado «cubierto», el icono pasa a lluvia',
     codigoQueSeVe({ prec: 0.5 }, CUBIERTO, THR) === LLUVIA,
     'una nube sin gotas con medio milímetro debajo es lo que él vio');
  ok('con 3 mm el icono dice que llueve bien, no que está cubierto',
     codigoQueSeVe({ prec: 3 }, CUBIERTO, THR) === LLUEVE_BIEN);
  ok('y el sirimiri —0,1 mm— también sale dibujado: moja igual',
     codigoQueSeVe({ prec: 0.1 }, DESPEJADO, THR) === LLOVIZNA);

  /* Sin agua no se toca nada: el cielo es del dueño del cielo. */
  ok('sin lluvia, el cielo se respeta tal cual',
     codigoQueSeVe({ prec: 0 }, CUBIERTO, THR) === CUBIERTO
     && codigoQueSeVe({ prec: 0 }, DESPEJADO, THR) === DESPEJADO);
  ok('y sin dato de lluvia tampoco se inventa un icono de agua',
     codigoQueSeVe({}, CUBIERTO, THR) === CUBIERTO);

  /* Si el prestado ya habla de agua, manda él: de lluvia sabe más el
     que la publica que una cuenta hecha con los milímetros. */
  ok('si el icono prestado ya dice agua, se respeta y no se recalcula',
     codigoQueSeVe({ prec: 5 }, LLOVIZNA, THR) === LLOVIZNA);

  /* Y lo que ya estaba: la lluvia prestada viaja con su propio código. */
  ok('el código del dueño de la lluvia sigue mandando sobre todo',
     codigoQueSeVe({ prec: 0, codeLluvia: LLUVIA }, DESPEJADO, THR) === LLUVIA);

  /* Sus listones, no unos fijos. */
  ok('usa SUS umbrales, no números clavados en el código',
     codigoQueSeVe({ prec: 1.5 }, CUBIERTO, { rainWarn: 0.2, rainNo: 1 }) === LLUEVE_BIEN
     && codigoQueSeVe({ prec: 1.5 }, CUBIERTO, { rainWarn: 0.2, rainNo: 5 }) === LLUVIA);
}

console.log('\n  Los números que salen juntos cuadran entre ellos');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');

  const i = src.indexOf('Y tampoco coinciden en el calor');
  const trozo = src.slice(Math.max(0, i - 900), i + 500);
  ok('la diferencia de temperatura se saca de las cifras redondeadas',
     /const tFrio = Math\.round\(frio\.t\), tCal = Math\.round\(cal\.t\)/.test(trozo)
     && /\$\{tCal - tFrio\}° de diferencia/.test(trozo),
     'si se redondea cada número por su cuenta, la resta no le cuadra al leerla');
  ok('y ya no se escribe el valor sin redondear al lado',
     !/sepT\.toFixed\(0\)° de diferencia/.test(trozo));

  /* La cuenta, hecha con números que dan el caso: 28,4 y 34,6. */
  const a = 28.4, b = 34.6;
  ok('con 28,4 y 34,6 se ve «28, 35 y 7», no «28, 35 y 6»',
     Math.round(b) - Math.round(a) === 7
     && Math.round(a) === 28 && Math.round(b) === 35);

  /* ── Y LOS DECIMALES, EN CASTELLANO ────────────────────────────────
     Del mismo repaso: la tarjeta del oleaje ponía «Ahora 0.6 m» con
     punto, y diez centímetros más arriba «ALTURA DE OLA 0,6 m» con
     coma. La misma cifra escrita de dos maneras en la misma pantalla. */
  /* ── Y NINGUNA DIFERENCIA SE ESCRIBE DESDE EL DATO CRUDO ──────────
     Al barrer la app el 04-09 aparecieron cinco sitios más con el mismo
     fallo: `wtxt(dif)` con `dif = max - min` sin redondear, y al lado
     las dos cifras ya redondeadas. Con 4,4 y 10,8 se leía «4», «11» y
     «6 km/h de diferencia». Ahora todos pasan por `difVista`. */
  const crudas = (src.match(/wtxt\((?:-|Math\.abs\()?\s*(?:dif|corto)\b/g) || []).length;
  ok('ninguna diferencia se escribe desde el dato sin redondear',
     crudas === 0,
     crudas ? `quedan ${crudas} con wtxt(dif…); tienen que usar difVista(a, b)` : '');
  ok('y difVista saca la resta de las cifras redondeadas',
     /const difVista = \(a, b, conUnidad = false\) => \{[\s\S]{0,220}?Math\.abs\(A - B\)/.test(src),
     'si resta antes de redondear, vuelve el mismo fallo');

  const conPunto = (src.match(/\.toFixed\(1\)(?!\s*\.replace)[^`\n]{0,20}?(?: m\b| mm\b| km\b| s\b|<\/b>)/g) || []).length;
  ok('ningún decimal sale a pantalla con punto en vez de coma',
     conPunto === 0,
     conPunto ? `quedan ${conPunto}; tienen que pasar por mTxt/kmTxt/mmTxt` : '');
}

console.log('\n  «Mañana» lleva siempre el nombre del día detrás');
{
  const hoy = new Date();
  const mas = n => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d; };

  ok('hoy se dice «hoy»', nombreDeDia(mas(0)) === 'hoy');

  const man = nombreDeDia(mas(1));
  ok('el día siguiente lleva su nombre puesto, no «mañana» a secas',
     man.startsWith('mañana ') && man.length > 'mañana '.length,
     `dice «${man}» — sin el nombre del día se lee como «esta mañana»`);
  ok('y ese nombre es el del día que toca',
     man === `mañana ${mas(1).toLocaleDateString('es', { weekday: 'long' })}`);

  ok('pasado mañana se dice por su nombre, no «pasado»',
     nombreDeDia(mas(2)) === `el ${mas(2).toLocaleDateString('es', { weekday: 'long' })}`);

  /* Y que nadie vuelva a escribirlo por su cuenta. Cinco sitios lo
     tenían copiado; el que ponga el sexto, que se entere aquí. */
  const src = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  const sueltos = (src.match(/\?\s*'mañana'/g) || []).length;
  ok('nadie arma la etiqueta del día por su cuenta',
     sueltos === 0,
     sueltos ? `quedan ${sueltos} sitios con 'mañana' suelto; tienen que llamar a nombreDeDia()` : '');
}


/* ═══ REVISIÓN 04-09 · CLASES 3 Y 7: LO PEQUEÑO QUE SE LEE COMO CALMA ═══
   Cosas que no reventaban: se quedaban en silencio o decían algo que no
   era. Un hilo que se borra con un 500 se lee como «no hay notas»; una
   pestaña Mar que dice «no estás en la costa» cuando el modelo no ha
   contestado; un radar de hace dos horas; una cota de monte registrada
   como altura de trabajo. Fuente: REVISION-2026-09-04.md. */
grupo('Revisión 04-09 · clases 3 y 7: lo que se leía como calma');
{
  ok('el hilo de notas no se borra cuando el servidor falla: se avisa encima',
     /hilo__caido/.test(src)
     && !/catch \{ el\.innerHTML = ''; return; \}/.test(src)
     && /if \(!r\.ok\) throw new Error\(`HTTP \$\{r\.status\}`\);\n\s+notas = /.test(src),
     'un 500 vaciaba #campoHilo y se leía como «no hay notas»');

  ok('la pestaña Mar distingue «aquí no hay mar» de «el modelo marino no ha contestado»',
     /S\.marFallo = e\?\.message \|\| 'sin red'/.test(src)
     && /const caido = S\.marFallo && !\/HTTP 4\\d\\d\/\.test\(S\.marFallo\)/.test(src)
     && /no es que aquí no haya mar/.test(src),
     'con el modelo marino caído decía «no está en la costa»');

  ok('el radar se refresca al volver a la pestaña y sigue al sitio actual',
     /if \(this\.map\) \{ await this\.refrescar\(\); return; \}/.test(src)
     && /async cargarFotogramas\(\)/.test(src)
     && /Date\.now\(\) - \(this\.leido \|\| 0\) < 5 \* 60e3/.test(src)
     && /this\.marca\?\.setLatLng\(\[p\.lat, p\.lon\]\)/.test(src),
     'antes `if (this.map) return`: el eco de la primera carga toda la sesión');

  /* Comportamiento, no texto: se ejecuta leerLineaSitio de verdad. */
  const cuerpoL = sacar('function leerLineaSitio(');
  const leer = new Function('dms', cuerpoL + '\nreturn leerLineaSitio;')(() => 0);
  const a = leer('Sollube 413 m 43.3600, -2.7800');
  const b = leer('Oiz h45 43.2300, -2.5900');
  const c = leer('Ganekogorta h 30 m 640 m 43.2000, -2.9800');
  ok('al importar, «413 m» a secas es la cota del monte, no la altura de trabajo',
     a && a.alt === null && a.cota === 413 && a.name === 'Sollube',
     `salió ${JSON.stringify(a)}`);
  ok('y «h45» / «h 30 m» sí es altura de trabajo, con la cota aparte',
     b && b.alt === 45 && b.cota === null && b.name === 'Oiz'
     && c && c.alt === 30 && c.cota === 640 && c.name === 'Ganekogorta',
     `salió ${JSON.stringify(b)} y ${JSON.stringify(c)}`);
  ok('y ya no queda la regla permisiva que cogía cualquier «NNN m» como altura',
     !/\[hH\]\?\\s\?\(\\d\{2,3\}\)\\s\*m\\b/.test(src));
}


/* ═══ REVISIÓN 04-09 · LO CABLEADO EN app.js PARA EL SERVICE WORKER ═══ */
grupo('Revisión 04-09 · la app y el service worker se hablan');
{
  ok('comprobarVersion() no tira la caché avisos-recibidos al cambiar de versión',
     /\(await caches\.keys\(\)\)\.filter\(k => k !== 'avisos-recibidos'\)\.map\(k => caches\.delete\(k\)\)/.test(src)
     && !/\(await caches\.keys\(\)\)\.forEach\(k => caches\.delete\(k\)\)/.test(src),
     'sus últimos 40 avisos se perdían en cada publicación');
  ok('la app escucha precache-faltan y avisoRenovado del service worker',
     /tipo === 'precache-faltan'\) avisarCascoIncompleto\(e\.data\.faltan\)/.test(src)
     && /tipo === 'avisoRenovado'\) montarAvisos\(\)/.test(src));
  ok('al arrancar se revisa el casco (__faltan.json) mirando cada fichero en la caché, no la lista a ciegas',
     /caches\.match\('\.\/__faltan\.json'\)/.test(src)
     && /for \(const u of faltan \|\| \[\]\) if \(!\(await caches\.match\(u\)\)\)/.test(src)
     && /setTimeout\(revisarCasco, 4000\)/.test(src));
}


/* ── «Viento 5–5 km/h» (13-09-2026, franja Noche, visto desde el portátil) ── */
grupo('Vuelta de Calpe · la horquilla de viento no repite el número');
{
  ok('la horquilla de viento de la franja compara lo que se imprime, no el dato crudo',
     /const vTxt = vs\.length \? \(wtxt\(vLo\) === wtxt\(vHi\)/.test(src)
     && !/Math\.min\(\.\.\.vs\) === Math\.max\(\.\.\.vs\)/.test(src),
     '4,6 y 5,4 km/h imprimían «5–5 km/h»');
}


/* ═══ «ASÍ CON TODO» (13-09-2026) ═══════════════════════════════════════
   Suyo, tras revisar ocho pantallazos: «si una ve despejado y otra lo
   mismo, pero GFS ve algo de lluvia, pues se pone "despejado, pero GFS
   ve algo de lluvia de 10 a 12"; eso es lo que quiero. Información,
   datos. Así con todo.» El dato no cambia; al lado, qué ve distinto otro
   modelo y a qué horas. */
grupo('Así con todo (13-09): al lado del dato, qué ve distinto otro modelo y cuándo');
{
  ok('la franja dice «GFS ve algo de lluvia de 10:00 a 12:00» aunque no llegue al listón',
     /if \(total >= minimo\) otros\.push/.test(src) && /'algo de lluvia' : 'lluvia'/.test(src)
     && !/⚠ \$\{esc\(o\.quien\)\} sí \(/.test(src));
  ok('en 10 días el agua que solo ve un modelo dice a qué horas cae, y «de noche» si cae fuera del día',
     /const hsAgua = horasDelDia\(S\.data\?\.fc, t\)/.test(src) && /'de noche'/.test(src));
  /* 17-09-2026 11:05, Génova: el dueño con 0,1 mm y otro modelo con 158 mm en la franja, y el chip callado. */
  const cLF = sacar('function lluviaEnLaFranjaQueNoVesTu(');
  ok('el chip de lluvia de la franja sale también con el dueño mojado si otro modelo ve al menos 1 mm MÁS («ven más lluvia»)',
     /function lluviaEnLaFranjaQueNoVesTu\(desde, hasta, minimo = 0\.1\)/.test(cLF) && /if \(total >= minimo\) otros\.push/.test(cLF)
     && /lluviaEnLaFranjaQueNoVesTu\(sel\[0\]\.date, sel\[sel\.length - 1\]\.date, mojado \? mm \+ 1 : 0\.1\)/.test(src)
     && /más lluvia\$\{o\.cuando \? ` \$\{o\.cuando\}` : ''\}: \$\{esc\(o\.lista\.map\(x => `\$\{x\.nom\} \$\{mmTxt\(x\.mm\)\} mm`\)\.join\(' · '\)\)\}/.test(src),
     'Génova: AROME 0,1 mm, ICON-D2 y Automático 158 mm, y la franja sin decir nada; y cada modelo con su cifra, no todos con la del más alto');
  ok('la racha de otro modelo va al lado de la de la franja, con sus horas',
     /function rachaEnLaFranjaQueNoVesTu\(sel\)/.test(src) && /da \$\{wtxt\(r\.max, true\)\} a 10 m/.test(src));
  /* 17-09-2026 10:45, Ciudad del Cabo: el Automático cruzaba el listón «no» (70) y la franja callaba. */
  const cRF = sacar('function rachaEnLaFranjaQueNoVesTu(');
  ok('el chip de racha de la franja mira los DOS listones (aviso y no) y cuenta con todos los modelos, el Automático incluido, como «Ahora»',
     /const \{ warn, no \} = listonRafaga\(\);/.test(cRF) && /const cruzaNo   = wRed\(max\) >= wRed\(no\)/.test(cRF)
     && !/m\.om === 'best_match' \|\| m\.name === cargado/.test(cRF)
     && /limite: cruzaNo \? no : cruzaWarn \? warn : null/.test(cRF)
     && /tu listón es \$\{wtxt\(r\.limite, true\)\}/.test(src),
     'ECMWF 61-68, ICON 59-72, Automático 77-85 y la franja sin decir nada');
  ok('las nubes que ve otro modelo llevan sus horas',
     /nubes\$\{cuando\} \(baja y media hasta el/.test(src));
  ok('la sensación compara lo que se imprime: 23° con aire a 22° dice «1° más que el aire»',
     /const dif = Math\.round\(c\.feels\) - Math\.round\(c\.temp\);\n\s*const aire =/.test(src));

  /* Comportamiento, no texto: una franja corta con dos cielos se cuenta con su hora. */
  const HC = (cs, h0) => cs.map((c, i) => ({ code: c, date: new Date(2026, 8, 13, h0 + i), day: 0 }));
  const corta = typeof tramosCortos === 'function' ? tramosCortos(HC([0, 4], 22)) : null;   // sin la función, rojo limpio, no reventón
  ok('una franja de dos horas con cielos distintos se cuenta con su hora',
     !!corta && corta.length === 2 && corta[0].code === 0 && corta[1].code === 4 && corta[1].hora === '23:00',
     JSON.stringify(corta));
  const fr = tituloFranja(HC([0, 4], 22), 4, '');
  ok('y la frase dice «Despejado · velo de nubes altas desde las 23:00»',
     fr === 'Despejado · velo de nubes altas desde las 23:00', `salió «${fr}»`);
  ok('con un solo cielo, una franja corta sigue en una palabra',
     typeof tramosCortos === 'function' && tramosCortos(HC([0, 0, 1], 21)) === null);
}


/* ═══ LA FRANJA DICE SI SU CIELO HA CAMBIADO (13-09-2026) ═══════════════
   «Cuando una franja cambie de cielo respecto a la pasada anterior, que lo
   diga en una línea, para distinguir un cambio del tiempo de un fallo de
   la app.» Nada de parches diarios: la causa, una vez, y su prueba. */
grupo('La franja dice si su cielo ha cambiado respecto a lo pintado antes');
{
  const hoyK = new Date().toISOString().slice(0, 10);
  const k = `${hoyK}·Noche·prueba`;
  try { LS.set('cieloFranjas', {}); } catch {}
  const cdc = typeof cambioDeCielo === 'function' ? cambioDeCielo : () => null;   // sin la función, rojo limpio
  const c1 = cdc(k, 0, 0);
  ok('la primera vez que se pinta una franja no dice nada', c1 === '');
  ok('si se repinta con el mismo cielo, tampoco', cdc(k, 0, 0) === '');
  const c3 = cdc(k, 3, 0);
  ok('si cambia el cielo, lo dice con la hora y con el de antes',
     /^Ha cambiado a las \d\d:\d\d: antes despejado$/.test(c3), `salió «${c3}»`);
  ok('y lo sigue diciendo mientras el nuevo se mantenga',
     /antes despejado$/.test(cdc(k, 3, 0) || ''));
  ok('de noche el «antes» se dice con la palabra de noche',
     (() => { const k2 = `${hoyK}·Noche2·prueba`; cdc(k2, 4, 0); return /antes velo de nubes altas$/.test(cdc(k2, 0, 0) || ''); })());
  /* El voto de modelos llega segundos después del primer pintado, dentro de la
     MISMA bajada: eso no es un cambio del tiempo (medido en producción, 22:55). */
  const k3 = `${hoyK}·Tarde·prueba`;
  ok('dentro de la misma bajada, repintar con otro cielo NO cuenta como cambio',
     cdc(k3, 0, 0, 100) === '' && cdc(k3, 3, 0, 100) === '' && cdc(k3, 3, 0, 200) === '',
     'el voto de modelos salía como «ha cambiado a las 22:55»');
  const c5 = cdc(k3, 0, 0, 300);
  ok('y entre dos bajadas distintas sí se dice',
     /^Ha cambiado a las \d\d:\d\d: antes cubierto$/.test(c5 || ''), `salió «${c5}»`);
  /* EL CASO EXACTO DEL PORTÁTIL (build 2301, 13-09-2026 23:54): registro con
     bajada 1789336462550 y desde 1789336465675, tres segundos después: mismo
     fetch, primer pintado sin voto (mayormente despejado) contra pintado con
     voto (velo). Ahora la bajada es la hora en curso del modelo y antes del
     voto no se apunta nada. */
  const k4 = `${hoyK}·Noche·caso2301`;
  const f2 = { n: 2, ini: `${hoyK}T22:00`, votado: true };
  ok('antes del voto no se apunta ni se compara nada',
     cdc(k4, 1, 0, '2026-09-13T23:45', { ...f2, votado: false }) === ''
     && !(LS.get('cieloFranjas', {}) || {})[k4]);
  ok('el caso del 2301: mayormente despejado sin voto y velo con voto, misma hora en curso → NO es cambio',
     cdc(k4, 1, 0, '2026-09-13T23:45', f2) === '' && cdc(k4, 4, 0, '2026-09-13T23:45', f2) === '',
     'salía «Ha cambiado a las 23:54: antes mayormente despejado»');
  ok('la misma hora en curso repintada por cualquier motivo tampoco cuenta',
     cdc(k4, 0, 0, '2026-09-13T23:45', f2) === '');
  ok('con otra hora en curso del modelo (bajada nueva) y el mismo tramo de horas, sí se dice',
     /^Ha cambiado a las \d\d:\d\d: antes despejado$/.test(cdc(k4, 4, 0, '2026-09-14T00:00', f2) || ''));
  ok('si la franja ha perdido horas por el reloj, no se compara: se empieza de nuevo sin decir nada',
     cdc(k4, 0, 0, '2026-09-14T00:15', { n: 1, ini: `${hoyK}T23:00`, votado: true }) === ''
     && cdc(k4, 0, 0, '2026-09-14T00:30', { n: 1, ini: `${hoyK}T23:00`, votado: true }) === '');
  ok('la franja pinta esa línea junto al titular',
     /const cambio = cambioDeCielo\(`\$\{String\(sel\[0\]\?\.t \?\? ''\)\.slice\(0, 10\)\}·\$\{name\}·\$\{S\.model\}`, code, R\?\.dia \?\? esDeDia\(sel\),[\s\S]{0,400}S\.data\?\.fc\?\.current\?\.time \?\? null,\n\s*\{ n: sel\.length, ini: sel\[0\]\?\.t \?\? null, votado: !!deEsteSitio\(S\.comparativa\) \}\)/.test(src)
     && /class="part__cambio">\$\{esc\(cambio\)\}/.test(src));
  ok('todas las pestañas salen de la misma bajada: franjas y 10 días leen S.data.fc',
     /function horasDelDia\(fc, dia\)/.test(src) && /const hs = horasDelDia\(S\.data\?\.fc, dia\);/.test(src)
     && /const hrs = S\.data\.hours;/.test(src));
}


/* ═══ EL MAPA ELIGE EL ORIGEN DE LAS TESELAS POR VELOCIDAD (13-09-2026) ═══
   «Revisa mapas que va muy lento todo». Medido: S3 directo 2,6 s al primer
   byte desde su iMac, por Vercel 0,5 s; el mapa elegía el directo solo
   porque respondía. */
grupo('El mapa elige el origen de las teselas por velocidad, no por «responde»');
{
  const M = require('fs').readFileSync(require('path').join(__dirname, 'maps.js'), 'utf8');
  ok('el origen de las teselas sale de una carrera entre S3 y el intermediario, con el mismo fichero',
     /const \[tDirecto, tProxy\] = await Promise\.all\(\[/.test(M)
     && /mide\(`\$\{TILES_DIRECTO\}\/dwd_icon_eu\/latest\.json`\)/.test(M)
     && /mide\(`\$\{TILES_PROXY\}\/dwd_icon_eu\/latest\.json`\)/.test(M)
     && /const directo = tDirecto < Infinity && tDirecto <= tProxy;/.test(M),
     'antes bastaba con que S3 respondiera en 6 s para ir directo, aunque tardara 5');
  ok('la carrera se corre con HEAD y un origen sin Content-Length queda fuera (la librería lo rechaza)',
     /fetch\(url, \{ method: 'HEAD', signal: ac\.signal, cache: 'no-store' \}\)/.test(M)
     && /if \(!r\.ok \|\| !\(r\.headers\.get\('content-length'\) \|\| r\.headers\.get\('x-content-length'\)\)\) return Infinity;/.test(M),
     '14-09-2026: el intermediario ganaba la carrera y luego fallaba cada apertura de .om');
  ok('y lo medido se guarda con el elegido, para poder mirarlo',
     /ms: \{ directo: tDirecto, proxy: tProxy \}/.test(M));
  ok('si el intermediario también falla, se queda el directo y el mapa lo dirá',
     /\(tProxy < Infinity \? TILES_PROXY : TILES_DIRECTO\)/.test(M));
}


/* ═══ EL TAMAÑO DE CADA .om LLEGA POR x-content-length (14-09-2026) ═══════
   El borde de Vercel no deja pasar Content-Length; la librería del mapa lo
   exige al abrir cada .om (HEAD). Nuestra copia de la librería acepta
   x-content-length como respaldo y el intermediario lo manda. Si alguien
   actualiza vendor/ sin el parche, esto lo para. */
grupo('El tamaño de cada .om llega por x-content-length (parche en vendor/ y en el intermediario)');
{
  const lib = require('fs').readFileSync(require('path').join(__dirname, 'vendor', 'openmeteo-weather-map-layer-0.0.20.js'), 'utf8');
  ok('la librería del mapa acepta x-content-length si falta Content-Length al abrir un .om',
     lib.includes('let n=t.headers.get(`content-length`)||t.headers.get(`x-content-length`);if(!n)throw new Rt(`Content-Length header missing`)'),
     'sin el parche, por el intermediario cada apertura falla y reintenta 5 s (12-16 s por capa)');
  const om = require('fs').readFileSync(require('path').join(__dirname, 'api', 'omtiles.js'), 'utf8');
  ok('y el intermediario copia el Content-Length de S3 en x-content-length',
     /const tam = r\.headers\.get\('content-length'\);\n\s*if \(tam\) salida\.set\('x-content-length', tam\);/.test(om)
     && /X-Content-Length/.test(om));
}


/* ═══ PRIMERO LA CAPA, LUEGO LOS NÚMEROS Y LAS BARBAS (14-09-2026) ═══════ */
grupo('El mapa pinta la capa antes de pedir números y barbas, y una abortada no es un fallo');
{
  const M = require('fs').readFileSync(require('path').join(__dirname, 'maps.js'), 'utf8');
  ok('los números y las barbas se piden cuando el mapa ha pintado (idle), no a los 500 ms',
     /trasPintar\(fn, tope = 6000\) \{/.test(M) && (M.match(/this\.trasPintar\(\(\) => \{ this\.valores\(\); this\.barbas\(\);/g) || []).length >= 3
     && !/setTimeout\(\(\) => \{ this\.valores\(\); this\.barbas\(\); \}, 500\)/.test(M)
     && !/setTimeout\(\(\) => \{ this\.valores\(\); this\.barbas\(\); this\.rayos\(\); \}, 600\)/.test(M),
     'en Ráfagas las barbas descodifican u y v en la misma cola que las teselas: 8 s en vez de 3');
  ok('una petición abortada por la propia librería no cuenta como fallo ni se reintenta',
     /if \(e\?\.name === 'AbortError' \|\| \/abort\/i\.test\(String\(e\?\.message \|\| ''\)\)\) throw e;/.test(M),
     'Peticiones.fallos sumaba 1 en cada cambio de capa sin fallar ninguna tesela');
}


/* ═══ LA MARCA DE ESCALA PROPIA ADMITE MAYÚSCULAS (14-09-2026) ═══════════
   Cazado en producción el 14-09 con el mapa a la vista: CAPE pedía sus
   teselas con «interpolation=linearE» —la escala «capeE» lleva mayúscula y
   los dos regex de la marca solo admitían [a-z0-9]—. La capa salía sin
   color y con «5 trozos del mapa sin cargar». Y el calentador de capas
   clave, que pide CAPE en segundo plano desde cualquier otra capa, sumaba
   «1 trozo sin cargar» en Reflectividad y Radar sin fallar ninguna tesela
   de las que se ven (lo que el portátil vio el miércoles). Es la misma
   clase que la de t850 del 31-08: se guarda para TODAS las escalas.    */
grupo('La marca de escala propia vale para TODAS las escalas, con mayúsculas y todo (14-09-2026)');
{
  const M = mapsSrc;
  const MARCA = 'escala_propia';
  const limpiarMarca = new Function('MARCA', `return ${(M.match(/const limpiarMarca = (u => [^\n]+);/) || [])[1]};`)(MARCA);
  const marcaDe = new Function('MARCA', `return ${(M.match(/const marcaDe = (u => [^\n]+);/) || [])[1]};`)(MARCA);
  const escalas = [...new Set([...M.matchAll(/escala:'([^']+)'/g)].map(m => m[1]))];
  ok('hay escalas propias declaradas en las capas del mapa', escalas.length >= 10, String(escalas.length));
  const base = 'om://h/m/2026/09/14/0300Z/2026-09-14T0600.om?variable=cape&interpolation=linear';
  const rotas = escalas.filter(e => limpiarMarca(`${base}&${MARCA}=${e}`) !== base || marcaDe(`${base}&${MARCA}=${e}`) !== e)
                       .map(e => `${e} → …${limpiarMarca(`${base}&${MARCA}=${e}`).slice(-22)} / ${marcaDe(`${base}&${MARCA}=${e}`)}`);
  ok('limpiarMarca quita la marca ENTERA y marcaDe devuelve el nombre ENTERO para cada escala (capeE incluida)',
     rotas.length === 0 && escalas.includes('capeE'), rotas.join('; ') || 'falta capeE');
  const registro = M.slice(M.indexOf('_escalas = {'), M.indexOf('};', M.indexOf('_escalas = {')));
  const sinRegistro = escalas.filter(e => !new RegExp(`\\b${e}\\b`).test(registro));
  ok('cada escala que pide una capa existe en escalasPropias()', sinRegistro.length === 0, sinRegistro.join(', '));

  // Lo que hace la cola de verdad, en un proceso aparte (aquí no hay await).
  let r = {};
  try {
    r = JSON.parse(require('child_process').execFileSync(process.execPath, ['-e', `
      const M = require('fs').readFileSync(${JSON.stringify(path.join(__dirname, 'maps.js'))}, 'utf8');
      const iF = M.indexOf('function teselasPorDefecto('); const iP = M.indexOf('const Peticiones = {');
      eval(M.slice(iF, M.indexOf('\\n}', iF) + 2));
      eval(M.slice(iP, M.indexOf('\\n};', iP) + 3).replace('const Peticiones', 'globalThis.Peticiones'));
      (async () => {
        const P = Peticiones, r = {};
        P.max = 3; r.hres = P.topeAhora('ecmwf_ifs'); r.icon = P.topeAhora('dwd_icon_eu');
        r.mac = teselasPorDefecto({ deviceMemory: 32, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome' });
        r.iphone = teselasPorDefecto({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari' });
        r.android = teselasPorDefecto({ deviceMemory: 8, userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' });
        r.safariMac = teselasPorDefecto({ userAgent: 'Mozilla/5.0 (Macintosh) Safari' });
        r.sinNav = teselasPorDefecto(undefined);
        P.fallos = 0;
        try { await P.conReintento(() => Promise.reject(new Error('404')), null, 1, false); } catch {}
        r.callado = P.fallos;
        try { await P.conReintento(() => Promise.reject(new Error('404')), null, 1); } catch {}
        r.contado = P.fallos;
        console.log(JSON.stringify(r));
      })();
    `], { encoding: 'utf8', timeout: 20000 }));
  } catch (e) { r = { error: String(e.message || e).slice(0, 120) }; }
  ok('el calentador de capas clave no suma «trozos sin cargar»: solo cuentan las teselas que se ven',
     r.callado === 0 && r.contado === 1 && /new AbortController\(\)\), null, 3, false\);/.test(M),
     JSON.stringify(r));
  ok('tres teselas a la vez en un Mac con memoria, dos en el móvil y en Safari, y dos siempre con ECMWF HRES',
     r.mac === 3 && r.iphone === 2 && r.android === 2 && r.safariMac === 2 && r.sinNav === 2 && r.hres === 2 && r.icon === 3,
     JSON.stringify(r));
}


/* ═══ BLOQUES DE 256 KB EN LA CACHÉ DE LA LIBRERÍA (14-09-2026) ═══════════
   MEDIDO en producción (una tesela z5 de ICON-EU, por variable): con los
   bloques de 64 KB que trae la librería, la racha son 11 peticiones de
   ~280 ms seguidas (3,0 s); con 256 KB, 3 peticiones (1,0 s) y los mismos
   bytes; 1 MB no gana tiempo y dobla los bytes. Esa era la causa de raíz
   de «tarda 15 s en abrir cualquier capa». La regla se guarda aquí.     */
grupo('La caché de bloques del mapa va a 256 KB: tres viajes por tesela, no once (14-09-2026)');
{
  const M = mapsSrc;
  const lib = fs.readFileSync(path.join(__dirname, 'vendor', 'openmeteo-weather-map-layer-0.0.20.js'), 'utf8');
  ok('el mapa cambia la caché de bloques de la librería a 256 KB × 128 antes de la primera tesela',
     /const BLOQUE_OM = 256 \* 1024, BLOQUES_OM = 128;/.test(M)
     && /inst\.omFileReader\.cache = new vieja\.constructor\(BLOQUE_OM, BLOQUES_OM\);/.test(M)
     /* Desde el 14-09-2026 (noche) el cambio vive en ajustarCacheDeBloques(),
        que comparten open() y el precalentado calentar(): lo que se mira es
        que open() la LLAME antes de registrar el protocolo (primera tesela). */
     && M.indexOf('this.ajustarCacheDeBloques();') > 0
     && M.indexOf('this.ajustarCacheDeBloques();') < M.indexOf("maplibregl.addProtocol('om'")
     && (M.match(/this\.ajustarCacheDeBloques\(\);/g) || []).length >= 2,
     'con 64 KB, la racha de una tesela son once viajes de ~280 ms');
  ok('y la librería sigue teniendo esa caché tal y como se toca: constructor(tamaño, bloques), blockSize() y 64 KB × 128 por defecto',
     /constructor\(e=64\*1024,t=256\)\{this\._blockSize=e,this\.maxBlocks=t\}blockSize\(\)\{return this\._blockSize\}/.test(lib)
     && /e\.cache\?\?new Bt\(64\*1024,128\)/.test(lib)
     && /e\.getProtocolInstance=qt/.test(lib),
     'si se actualiza vendor/ y cambia esto, el cambio de caché se quedaría sin efecto sin avisar');
}


/* ═══ EL MAR SE IMPRIME CON LAS UNIDADES QUE DA LA FUENTE (14-09-2026) ═══
   Pantallazo de Mar del build 1006: «Corriente 1,2 m/s». La API marina da
   ocean_current_velocity en km/h (`current_units` lo dice) y la app lo
   etiquetaba m/s sin convertir: cuatro veces más de lo real. Cazado por
   Aitor y el portátil. La muestra de abajo es REAL (Bermeo, 14-09-2026). */
grupo('El mar se imprime con las unidades que da la fuente (14-09-2026)');
{
  let M = null;
  try { M = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruebas-datos', 'marina-bermeo-2026-09-14.json'), 'utf8')); } catch {}
  try { eval(sacarConst('UNIDADES_MAR')); eval(sacar('function unidadMar(')); eval(sacar('function avisoUnidadesMar(')); } catch (e) { console.log(`  (sin unidades del mar: ${e.message})`); }
  const hay = typeof unidadMar === 'function' && typeof avisoUnidadesMar === 'function' && !!M;
  ok('la corriente sale en km/h, que es lo que da la API marina (1,2 km/h salían como «1,2 m/s»)',
     hay && M.current_units.ocean_current_velocity === 'km/h' && unidadMar(M, 'ocean_current_velocity') === 'km/h'
     && !/show\(C\.ocean_current_velocity, 'm\/s'/.test(src)
     && (src.match(/show\(C\.ocean_current_velocity, unidadMar\(M, 'ocean_current_velocity'\), 1\)/g) || []).length === 2,
     'la etiqueta sale de current_units de la respuesta, en Mar y en Sol y aire');
  ok('todas las magnitudes del mar (ola m, periodo s, agua °C, fondo m, viento m, corriente km/h, marea m) llevan la unidad de la respuesta',
     hay && avisoUnidadesMar(M) === null
     && ['wave_height', 'wave_period', 'sea_surface_temperature', 'swell_wave_height', 'wind_wave_height', 'ocean_current_velocity'].every(k => unidadMar(M, k) === (M.current_units[k]))
     && unidadMar(M, 'sea_level_height_msl') === M.hourly_units.sea_level_height_msl
     && !/show\(C\.wave_height, 'm', 1\)|show\(C\.wave_period, 's', 1\)|show\(C\.sea_surface_temperature, '°C', 1\)|show\(C\.wind_wave_height, 'm', 1\)/.test(src),
     'con la muestra real ninguna unidad se sale de lo esperado y no queda ninguna etiqueta escrita a mano');
  ok('y si la fuente cambia una unidad del mar, se dice en pantalla en vez de imprimirla mal',
     hay && (() => {
       const T = JSON.parse(JSON.stringify(M)); T.current_units.ocean_current_velocity = 'm/s';
       const a = avisoUnidadesMar(T);
       return typeof a === 'string' && /ocean_current_velocity en m\/s/.test(a) && /km\/h/.test(a) && unidadMar(T, 'ocean_current_velocity') === 'm/s';
     })() && (src.match(/\]\.join\(''\) \+ notaUnidadesMar\(M\)( \+ notaCeldaMar\(M\))?;/g) || []).length === 2,
     'como la presión en hPa del mapa: la unidad rara se canta, no se disimula');
}

/* ═══ LA TARJETA DE 10 DÍAS DICE DE QUIÉN ES CADA CIFRA (14-09-2026) ══════
   Suyo, con cuatro pantallazos del build 1006: «siempre algún error de
   ahí… pasa a diario lo mismo». La clase: la tarjeta mezclaba tres orígenes
   sin decirlo —el % de ECMWF con los mm de AROME (martes: 75 % · 0,0 mm),
   los mm de ECMWF HRES por acierto, los días de más allá enteros de
   ECMWF— y el chip de al lado repetía el mismo dato con otro redondeo
   («1,7 mm» arriba, «solo ECMWF ve agua (1,6 mm)» abajo). */
grupo('La tarjeta de 10 días dice de quién es cada cifra que no es del modelo cargado (14-09-2026)');
{
  try { eval(sacarConst('RELLENO_LARGO')); eval(sacarConst('RELLENO_2')); } catch (e) { console.log(`  (sin RELLENO: ${e.message})`); }
  for (const f of ['queFaltaba', 'origenDelDato', 'textoAguaNoVenTodos']) {
    try { eval(sacar(`function ${f}(`)); } catch (e) { console.log(`  (sin ${f}: ${e.message})`); }
  }
  try { eval(sacarConst('mmTxt')); } catch (e) { console.log(`  (sin mmTxt: ${e.message})`); }
  const hay = ['queFaltaba', 'origenDelDato', 'textoAguaNoVenTodos'].every(f => { try { return typeof eval(f) === 'function'; } catch { return false; } });
  /* El amanecer y el ocaso vienen TODOS los días de cualquier modelo (son
     astronomía, no previsión): un día sin previsión no puede pasar por
     «con datos» por tener amanecer. Visto en producción el 14-09 a las 11:00:
     rellenoDias = [] con AROME HD y el viernes entero de ECMWF sin etiqueta. */
  const D = { time: ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'],
              sunrise: ['2026-09-14T07:35', '2026-09-15T07:36', '2026-09-16T07:37', '2026-09-17T07:38'],
              temperature_2m_max: [26, 26, null, null], precipitation_sum: [0, 0, null, null],
              precipitation_probability_max: [null, null, null, null], wind_gusts_10m_max: [18, 65, null, null] };
  const Q = hay ? queFaltaba(D) : null;
  ok('antes de rellenar se apunta qué faltaba: los días enteros sin previsión (aunque traigan amanecer) y los campos que el modelo no publica',
     hay && JSON.stringify(Q.dias) === JSON.stringify(['2026-09-16', '2026-09-17'])
     && JSON.stringify(Q.campos) === JSON.stringify(['precipitation_probability_max'])
     && /f\.rellenoDias = faltaba\.dias; f\.rellenoCampos = faltaba\.campos;/.test(src),
     JSON.stringify(Q));
  const fc = { prestadosDe: [{ k: 'precipitation_sum', de: 'ecmwf_ifs', porAcierto: true }],
               rellenoDias: ['2026-09-18'], rellenoCampos: ['precipitation_probability_max', 'uv_index_max'], rellenoDe2: ['uv_index_max'] };
  ok('cada cifra sabe de quién es: la lluvia por acierto, el día entero de relleno, el campo que el cargado no publica',
     hay && origenDelDato(fc, 'precipitation_sum', '2026-09-15') === 'ecmwf_ifs'
     && origenDelDato(fc, 'temperature_2m_max', '2026-09-18') === RELLENO_LARGO
     && origenDelDato(fc, 'precipitation_probability_max', '2026-09-15') === RELLENO_LARGO
     && origenDelDato(fc, 'uv_index_max', '2026-09-15') === RELLENO_2
     && origenDelDato(fc, 'wind_gusts_10m_max', '2026-09-15') === null,
     'ECMWF HRES la lluvia, ECMWF el día 18 y el %, GFS el UV, nadie la racha');
  ok('y la tarjeta lo pinta: el modelo del día bajo la fecha y el de cada cifra al lado (75 % ECMWF · 0,0 mm)',
     /class="dcard__m"/.test(src) && /class="dcard__de"/.test(src)
     && /\$\{de\('precipitation_probability_max'\)\}/.test(src) && /\$\{de\('precipitation_sum'\)\}/.test(src) && /\$\{de\('wind_gusts_10m_max'\)\}/.test(src)
     && /\.dcard__m\{/.test(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8')),
     'sin esto el 75 % de ECMWF y los 0,0 mm de AROME iban en el mismo renglón como si fueran del mismo');
  const A = { con: [{ om: 'ecmwf_ifs025', nom: 'ECMWF', v: 1.6 }, { om: 'icon_seamless', nom: 'ICON', v: 0 }, { om: 'gfs_seamless', nom: 'GFS', v: 0.4 }] };
  const X1 = hay ? textoAguaNoVenTodos(A, 'ecmwf_ifs', 'de 09:00 a 14:00') : null;
  const X2 = hay ? textoAguaNoVenTodos(A, 'ecmwf_ifs025', 'de 09:00 a 14:00') : null;
  const X3 = hay ? textoAguaNoVenTodos({ con: A.con.map(x => ({ ...x, v: 2 })) }, 'ecmwf_ifs', '') : null;
  ok('el chip de agua dice lo que ven LOS DEMÁS y no repite el número de la tarjeta con otro redondeo',
     hay && X1 && X1.texto === 'agua de 09:00 a 14:00 · ECMWF (1,6 mm) también la ve · ICON y GFS, secos'
     && X2 && X2.texto === 'agua de 09:00 a 14:00 · ICON y GFS, secos' && !/solo/.test(X2.texto)
     && X3 === null
     && /textoAguaNoVenTodos\(A, dueno, cuando\)/.test(src) && !/solo <b>\$\{esc\(A\.mojan\[0\]\.nom\)\}<\/b> ve agua/.test(src),
     JSON.stringify({ X1, X2, X3 }));
}


/* ═══ EL MAPA SE VE DEBAJO DEL COLOR (14-09-2026, 14:55-15:00) ═══════════
   Siete pantallazos suyos seguidos: Ráfagas, Viento 10 m, CAPE, Inhibición,
   Isocero, Temperatura («¿el mar amarillo?») y T850: «no se ve nada ni el
   mapa», «todo pintado sin verse las ciudades, España». Las capas de campo
   entero, a 0,95 de opacidad y sin costa por encima, tapan el fondo. Y en
   Reflectividad las bandas estrechas de dBZ dibujaban la malla del modelo
   («se ve pixelado lo verde»). */
grupo('El mapa se ve debajo del color: costa por encima, opacidad 0,75 y el «no pasa nada» transparente (14-09-2026)');
{
  const M = mapsSrc;
  ok('la línea de costa va por encima del color: se ve España aunque la capa lo tape todo',
     /costaEncima\(\) \{/.test(M) && /id: 'costaLayer', type: 'line', source: 'carto', 'source-layer': 'water'/.test(M)
     && (M.match(/this\.costaEncima\(\);/g) || []).length >= 1
     && M.indexOf('this.costaEncima();') > M.indexOf("this.map.addLayer({\n        id:'omLayer'"),
     'los nombres ya iban por encima; la costa no, y sin costa no se sabe dónde está uno');
  ok('la capa por defecto deja ver el fondo: opacidad 0,75, no 0,95',
     /opacity:0\.75,/.test(M) && !/opacity:0\.95,/.test(M));
  const alfas = re => ((M.match(re) || [])[1] || '').match(/,\s*([0-9.]+)\]/g)?.map(s => Number(s.replace(/[^0-9.]/g, ''))) || [];
  const rf = alfas(/const rfc = \[([\s\S]*?)\];/), cp = alfas(/const cpc = \[([\s\S]*?)\];/);
  ok('en Ráfagas y CAPE, donde no pasa nada se ve el mapa: el primer color es transparente y sube con el valor hasta su listón',
     rf.length >= 12 && rf[0] === 0 && rf[1] > 0 && rf[1] < rf[2] && rf[2] < rf[3] && rf[5] === 1
     && cp.length >= 12 && cp[0] === 0 && cp[1] > 0 && cp[1] < cp[2] && cp[3] >= 0.9 && cp[4] === 1,
     JSON.stringify({ rf, cp }));
  ok('la reflectividad pide color_blend=true: degradado continuo, no bandas estrechas que dibujan la malla',
     /const ESCALAS_SUAVES = new Set\(\['dbz', 'basecv', 'topecv', 'tapa', 'agua', 'isocero', 'nubes', 'sombraLluvia', 'tempc', 't850', 'rafagas',[\s\S]{0,400}?'lluvia', 'lluviaVerde', 'nieveAzul'\]\);/.test(M)
     && /if \(ESCALAS_SUAVES\.has\(L_\?\.escala\)\) q\.set\('color_blend', 'true'\);/.test(M),
     'con bandas de 5 dBZ cada celda del modelo se veía como un cuadro; ráfagas, CAPE y presión siguen a saltos (listones e isobaras). 15-09: temperatura y T850 también en degradado, como Windy («mira capa temperatura 2m qué bien se ve»); sus cortes de 30/34/38 siguen en la escala, solo se funden entre sí');
}


/* ═══ AGUA PRECIPITABLE EN LLUVIA, PRESIÓN POR BANDAS, HRES SOLO DE CERCA ═══
   Sus pantallazos del 14-09 (15:00-15:03): «esta capa debe de estar en
   lluvia y no se distingue nada» (agua precipitable, azul plano); Presión
   «no se distingue nada» (1018-1025 hPa en la misma pinta rosa, y las
   isobaras de la librería no llegan: 0 trazos en isoLinea, medido);
   ECMWF HRES «mucha espera» (15 s) y «que si falla la memoria mal» (OOM
   con punto de rocío, como el 25-08): su rejilla gaussiana reducida de 6,6
   millones de puntos a zoom bajo obliga a descodificar media Europa. */
grupo('Agua precipitable en Lluvia, presión por bandas de 4 hPa y HRES solo de cerca (14-09-2026)');
{
  const M = mapsSrc;
  ok('Agua precipitable está en el grupo Lluvia y con escala propia (transparente donde el aire va seco)',
     /id:'tcwv', densa:true, g:'Lluvia', name:'Agua precipitable'[^\n]*escala:'agua'/.test(M)
     && M.indexOf("id:'tcwv'") < M.indexOf("id:'refl'") && /const agua = \{/.test(M)
     && /const agm = \[0, 10, 15, 20, 25, 30, 35, 40, 50, 60\];/.test(M) && /\['#e6f4ff',0\]/.test(M),
     'era el azul oscuro plano de la librería, en el grupo Aire');
  ok('la presión va en bandas de 4 hPa de 976 a 1044, que se leen como isobaras (las de la librería no llegan)',
     /const hpa = \[976, 980, 984, 988, 992, 996, 1000, 1004, 1008, 1012, 1016, 1020, 1024, 1028, 1032, 1036, 1040, 1044\];/.test(M)
     && /breakpoints: hpa,/.test(M) && /conv: v => \(v > 10000 \? v \/ 100 : v\)/.test(M),
     'con la escala de fábrica (940-1060) todo el anticiclón salía del mismo rosa');
  /* Sin `let` del mismo nombre: un `let` en el bloque tapaba la función que
     declara el eval y la prueba salía en rojo con el código bien. */
  const hl = (() => { try { eval(mapsSrc.slice(mapsSrc.indexOf('const HRES_ZOOM_MIN'), mapsSrc.indexOf('\n}', mapsSrc.indexOf('function hresDeLejos(')) + 2).replace('const HRES_ZOOM_MIN', 'globalThis.HRES_ZOOM_MIN')); return hresDeLejos; } catch (e) { console.log(`  (sin hresDeLejos: ${e.message})`); return null; } })();
  ok('ECMWF HRES solo de cerca: por debajo del zoom 6 se pinta con ECMWF 25 km y se dice; desde el 6, el de 9 km',
     typeof hl === 'function' && hl('ecmwf_ifs', 5.9) === true && hl('ecmwf_ifs', 6) === false
     && hl('ecmwf_ifs025', 3) === false && hl('ecmwf_ifs', NaN) === false
     && /sustituido: true, porZoom: true/.test(M) && /this\.avisoSustitucion\(R\.sustituido \|\| R\.mar \? R\.modelo : null, R\.porZoom, !!R\.mar\)/.test(M)
     && /solo de cerca/.test(M) && /reaplicarPorZoom\(\)/.test(M) && /on\('zoomend'[^\n]*reaplicarPorZoom/.test(M),
     'a zoom bajo un píxel son 5 km: el de 25 km se ve igual, no tarda 15 s y no se queda sin memoria');
}


/* ═══ BARBAS SIN COLOR ENGAÑOSO, ISOCERO CON EL ROJO ABAJO, TAPA CERO SIN PINTAR ═══
   Del guion del portátil «mapa-para-el-imac.txt» (14-09-2026) y de sus
   pantallazos: el color de fondo de Viento 10 m era la componente
   oeste-este —confunde y ningún modelo publica wind_speed_10m en las
   teselas (medido: «Primary variable wind_speed_10m not found»)—; el
   Isocero iba en -5200..5200 con el verano a 4500-4900, todo rojo; y la
   tapa 0 pintaba Europa entera de rojo. */
grupo('Barbas sin color de fondo, Isocero de 0 a 5500 con el rojo abajo, tapa cero transparente (14-09-2026)');
{
  const M = mapsSrc;
  /* 21-09-2026: ya no hay capas de barbas. Ni fuerza (la tesela solo tiene
     una componente) ni rumbo (la librería no da la otra). Quien quiera la
     fuerza tiene Ráfagas; quien quiera el rumbo, el clic. */
  ok('las capas de barbas están retiradas y ninguna capa declara flechas',
     !['wind10', 'wind20', 'wind50', 'wind100'].some(id => new RegExp(`id:'${id}'`).test(M))
     && !/arrows:\s*true/.test(M.replace(/\/\*[\s\S]*?\*\//g, ''))   // en código, no en el comentario que lo cuenta
     && /rumbo: true/.test(M),
     'las 33 barbas de la pantalla apuntaban todas del suroeste: medido el 21-09-2026');
  ok('el Isocero va de 0 a 5500 m con el rojo en lo bajo (hielo cerca de la torre) y lo alto pálido',
     /id:'frz'[^\n]*escala:'isocero'/.test(M) && /const izm = \[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500\];/.test(M)
     && /const izc = \[\['#7a0020',1\], \['#e11400',1\]/.test(M) && /const isocero = \{/.test(M),
     'con la escala de fábrica (-5200..5200) el verano salía todo rojo y sin matiz');
  ok('la tapa cero no se pinta: el color aparece solo donde hay tapa, y el pie lo dice',
     /const cnc = \[\['#e11400',0\], \['#f95c00',0\.5\]/.test(M) && /SIN COLOR es tapa CERO/.test(M) && !/ROJO es tapa CERO/.test(M),
     'Inhibición 0 salía rojo en todo el continente');
}

/* ═══ LAS NUBES COMO EN WINDY (15-09-2026, 13:05) ═══════════════════════
   Suyo, con Windy al lado en su Chrome: «mira qué bien se ve en Windy, ¿lo
   podrías poner en la nuestra? con esa claridad y resolución… me encanta».
   La resolución ya estaba (HRES 9 km de cerca, AROME HD 1,3 km). Lo que no
   se veía era el color: «Nubes bajas» de AROME HD salía como un velo azul
   clarito sobre el fondo Claro («no se aprecia bien», visto en su pantalla). */
grupo('Las nubes como en Windy: blancas con cuerpo y con el suelo en tono tierra debajo (15-09-2026)');
{
  const M = mapsSrc;
  ok('las cuatro capas de nubes llevan la escala propia «nubes» (y «Nubes + lluvia» ya no existe)',
     /* 15-09-2026 19:00: «Nubes + lluvia» (clouds_rain) se quitó; queda una sola capa de nubes con lluvia. */
     ['clouds', 'clouds_low', 'clouds_mid', 'clouds_high'].every(id => new RegExp(`id:'${id}'[^\\n]*escala:'nubes'`).test(M))
     && !/id:'clouds_rain'/.test(M),
     'el azul de fábrica sobre el fondo Claro no se ve');
  const nb = ((M.match(/const nbc = \[([\s\S]*?)\];/) || [])[1] || '').match(/\['#([0-9a-f]{6})',\s*([0-9.]+)\]/g) || [];
  const alfa = nb.map(s => Number(s.match(/,\s*([0-9.]+)\]/)[1]));
  /* 15-09-2026 19:40 (portátil), con sus fotos del cielo cerrado y gris de Bermeo delante:
     blanca hasta el 55 % (hay claros) y GRIS del 70 % en adelante (cielo cerrado), sin
     que deje de ser neutra (nada de azul clarito). */
  const hexDe = s => s.match(/#([0-9a-f]{6})/)[1];
  const canales = h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const neutra = h => { const c = canales(h); return Math.max(...c) - Math.min(...c) <= 0x18; };
  const clara = nb.length >= 8
    && nb.slice(0, 5).every(s => canales(hexDe(s)).every(v => v >= 0xd0))
    && nb.slice(5).every(s => neutra(hexDe(s)))
    && canales(hexDe(nb[7])).every(v => v < 0xb0) && canales(hexDe(nb[5])).every(v => v < 0xe0);
  ok('la escala «nubes» va de transparente (0 %) a gris oscuro casi opaco (100 %): blanca con claros, gris con el cielo cerrado, y neutra, no azul',
     alfa.length >= 6 && alfa[0] === 0 && alfa[alfa.length - 1] >= 0.9 && alfa.every((a, i) => i === 0 || a >= alfa[i - 1]) && clara
     && /const nubes = \{/.test(M) && /presion, visibilidad, tempc, t850, rafagas, capeE, tapa, agua, isocero, sinColor, nubes,/.test(M),
     JSON.stringify({ alfa, clara }));
  ok('las nubes piden degradado continuo (color_blend), como la reflectividad',
     /const ESCALAS_SUAVES = new Set\(\[[^\]]*'nubes'[^\]]*\]\);/.test(M));
  ok('con una capa de nubes, el suelo se pone en tono tierra y el mar en azul acero (Claro y Color); en Oscuro no hace falta',
     /sueloParaNubes\(on\) \{/.test(M) && /if \(!on \|\| this\.base === 'oscuro'\) \{ quitar\(\); return; \}/.test(M)
     && /id:'sueloLayer', type:'background'/.test(M) && /id:'marLayer', type:'fill', source:'carto', 'source-layer':'water'/.test(M),
     'una nube blanca sobre tierra blanca (#fafaf8) no existe');
  const iApply = M.indexOf('async apply() {'), iOm = M.indexOf("id:'omLayer', type:'raster', source:'omSrc'", iApply);
  const iSuelo = M.indexOf("this.sueloParaNubes(L_.escala === 'nubes');", iApply);
  ok('apply() pone el suelo ANTES de montar la capa y solo para la escala «nubes», con la nube casi opaca (≥ 0,92); quitarCapasDeDatos() lo quita con las demás',
     iSuelo > iApply && iSuelo < iOm
     && /const op = L_\.escala === 'nubes' \? Math\.max\(this\.opacity, 0\.92\)\s*: CON_SUELO_NEGRO\.has\(L_\.escala\) \? Math\.max\(this\.opacity, 0\.95\)\s*: this\.opacity;/.test(M)
     && /const CAPAS  = \['omLayer', 'omLayer2', 'radarLayer', 'satLayer', 'aemetLayer',\s*'isoLbl', 'isoLinea', 'isoBorde', 'sueloLayer', 'marLayer'\];/.test(M),
     'si se quedara puesto, la siguiente capa (temperatura, ráfagas) saldría sobre tierra ocre sin motivo');
  /* 17:52, con Windy al lado otra vez: «blancas, negras donde pinta agua», «verde donde lloverá», «así quiero». */
  const sl = ((M.match(/const slc = \[([\s\S]*?)\];/) || [])[1] || '').match(/\['#([0-9a-f]{6})',\s*([0-9.]+)\]/g) || [];
  const slAlfa = sl.map(s => Number(s.match(/,\s*([0-9.]+)\]/)[1]));
  const slHex = sl.map(s => s.match(/#([0-9a-f]{6})/)[1]);
  const oscuro = h => [0, 2, 4].every(i => parseInt(h.slice(i, i + 2), 16) < 0x90);
  /* 19:55, su captura de Meteored delante: «nubes: este marca agua en azul, que sería lo suyo». */
  const azul = h => parseInt(h.slice(4, 6), 16) > parseInt(h.slice(0, 2), 16) + 0x30 && parseInt(h.slice(4, 6), 16) >= parseInt(h.slice(2, 4), 16);
  ok('Nubes total lleva la lluvia encima con su propia sombra: la nube se oscurece donde llueve y va a azul donde llueve de verdad (como Meteored)',
     /id:'clouds',[^\n]*encima:'precipitation', encimaEscala:'sombraLluvia'/.test(M)
     && /const sombraLluvia = \{/.test(M) && /sinColor, nubes, sombraLluvia,/.test(M)
     && slAlfa.length >= 6 && slAlfa[0] === 0 && slAlfa[1] > 0 && slAlfa.every((a, i) => i === 0 || a >= slAlfa[i - 1])
     && oscuro(slHex[1]) && oscuro(slHex[2]) && slHex.slice(3, 5).every(azul) && oscuro(slHex[slHex.length - 1]),
     JSON.stringify({ slAlfa, slHex }));
  ok('las dos peticiones de la capa de encima (al montar y al mover la hora) llevan la escala de la sombra, no la de Precipitación',
     (M.match(/this\.omUrl\(L_\.encima, this\.t, [^,]+, [^,]+, L_\.encimaEscala \? \{ escala: L_\.encimaEscala \} : null\)/g) || []).length === 2,
     'si una de las dos fuera sin escala, al mover la hora la sombra cambiaría a los colores de Precipitación');
  /* 17:58, medido en su Chrome (build 1758, mié 16 06:00): el orden de capas era
     sueloLayer, marLayer, costaLayer, omLayer2, omLayer — la sombra de lluvia y la
     costa DEBAJO de la nube. firstLabelLayer() devuelve la capa que sigue al último
     relleno, y esa es omLayer en cuanto está montada: todo lo que se pedía «encima»
     se colaba debajo. Con la nube al 0,92 ya no se ve nada de lo de abajo. */
  ok('la capa de encima (sombra de lluvia) se monta ENCIMA de la nube, no debajo: justo detrás de omLayer',
     /encimaDe\(id\) \{/.test(M) && /id:'omLayer2', type:'raster', source:'omSrc2',[\s\S]{0,200}this\.encimaDe\('omLayer'\)\)/.test(M),
     'con firstLabelLayer() la segunda capa quedaba debajo de la primera');
  ok('la costa va por encima de TODAS las capas propias (nube, sombra, relieve), no solo del fondo',
     /firstLabelLayer\(porEncimaDeLasPropias = false\) \{/.test(M)
     && /costaLayer', this\.firstLabelLayer\(true\)\)/.test(M) && /paint \}, this\.firstLabelLayer\(true\)\);/.test(M),
     'una nube blanca casi opaca tapaba la línea de costa');
}

grupo('El chip de Horas dice cuánta agua ve el otro modelo (15-09-2026, 23:53)');
{
  /* Suyo: «cuando pones tal modelo ve lluvia, no pones cuánta ve». */
  const cuerpo = sacar('function mmQueVeElOtro('), cHora = sacar('function horaEnComparativa(');
  ok('mmQueVeElOtro() lee la lluvia del modelo que presta el código, en la comparativa de ESTE sitio y a esa misma hora',
     /COMPARAR\.find\(x => x\.name === nom\)/.test(cuerpo)
     && /const hc = horaEnComparativa\(h\);/.test(cuerpo) && /precipitation_\$\{m\.om\}/.test(cuerpo)
     && /return has\(v\) \? v : null;/.test(cuerpo)
     && /deEsteSitio\(S\.comparativa, h\?\.sitio \|\| null\)\?\.hourly/.test(cHora)
     && /C\.time\.findIndex\(t => t\.slice\(0, 13\) === iso\)/.test(cHora) && /return i < 0 \? null : \{ C, i \};/.test(cHora),
     'sin sello de sitio o sin esa hora, nada: nunca un número inventado');
  ok('el chip «⚠ X ve llovizna» de Horas lleva el número al lado (mmQueVeTxt), tal cual lo publica ese modelo, 0,0 incluido',
     /ve \$\{esLlovizna\(c\) \? 'llovizna' : 'lluvia'\}\$\{mmQueVeTxt\(mmQueVeElOtro\(h\)\)\}<\/span>/.test(src)
     && /const mmQueVeTxt = mm => mm === null \? '' : ` · \$\{mmTxt\(mm\)\} mm`;/.test(src),
     'suyo, 23:58: «no inventes nada, lo que dice el modelo»');
  ok('y «Horas» se repinta cuando llega la comparativa, que es cuando el número existe',
     /seguro\('horas', renderHours\);/.test(src));
  /* 16-09-2026 00:10: «si alguno ve lluvia, CAPE, etc., que lo pongáis, y si se puede cuánto». */
  const cLl = sacar('function lluviaQueVenOtrosHora('), cRa = sacar('function rachaQueNoVesTuHora('), cCh = sacar('function chipsOtrosHora(');
  ok('cada hora dice qué otros modelos ven lluvia y cuánta (≥ 0,1 mm y más que el dueño), sin repetir al que presta el código',
     /const dueno = nombreDeModelo\(duenoLluvia\(\)\);/.test(cLl) && /if \(m\.name === dueno \|\| m\.name === yaDicho\) continue;/.test(cLl)
     && /v >= 0\.1 && v > mia/.test(cLl) && /const hc = horaEnComparativa\(h\);/.test(cLl));
  ok('cada hora dice quién ve tormenta (CAPE ≥ 700 con tapa < 75, la regla de siempre) cuando el dueño no la ve, con sus dos números',
     /tormentaQueNoVesTu\(h, h\.sitio \|\| null\)/.test(cCh) && /ve tormenta: CAPE \$\{Math\.round\(t\.cape\)\} · tapa \$\{Math\.round\(t\.cin\)\}/.test(cCh));
  ok('cada hora dice quién da más racha a 10 m si cruza su listón o se va 20 km/h, con el número y el listón',
     /const \{ warn, no \} = listonRafaga\(\);/.test(cRa) && /alto\.v - h\.gust10 >= 20/.test(cRa)
     && /da \$\{wtxt\(r\.suya, true\)\} a 10 m/.test(cCh) && /tu listón es \$\{wtxt\(r\.limite, true\)\}/.test(cCh));
  /* 17-09-2026 12:40, suyo: al abrir un día, «que ponga también si alguno ve nube o agua». */
  const cCmp = sacar('async function cargarComparativa(place) {');
  ok('la comparación entre modelos se pide a 10 días (antes 2): el día abierto lleva sus chips también del sábado en adelante',
     /forecast_days: 10, past_hours: 1,/.test(cCmp) && !/forecast_days: 2, past_hours: 1,/.test(cCmp));
  ok('y cada hora dice si otro modelo fino ve nubes cuando lo pintado es raso o velo (misma regla que la franja), bajo el dibujo',
     /if \(parte === 'nubes'\) \{/.test(cCh) && /nubesEnLaFranjaQueNoVesTu\(\[h\], v\.code\)/.test(cCh)
     && /<\/div>\$\{chipsOtrosHora\(h, 'nubes'\)\}/.test(src));
  ok('y los tres chips van en la tarjeta de cada hora de «Horas», cada uno al lado de su número: lluvia junto a la gota, racha bajo la racha, tormenta bajo el CAPE',
     /\(aguaPrestada\(h\)\)\}\$\{chipsOtrosHora\(h, 'lluvia'\)\}<\/span>/.test(src)
     && /<\/div>\$\{chipsOtrosHora\(h, 'racha'\)\}/.test(src)
     && /\$\{lineaCapeHora\(h\)\}\$\{chipsOtrosHora\(h, 'tormenta'\)\}/.test(src));
}

grupo('Los rayos del mapa solo en las capas donde pintan algo (17-09-2026)');
{
  /* Suyo, 09:45, con Viento 10 m lleno de puntos rojos: «no debería ser así, ¿no?» */
  const M2 = require('fs').readFileSync(require('path').join(__dirname, 'maps.js'), 'utf8');
  ok('rayos() se limpia y no pinta fuera de Lluvia, Tormenta y Satélite, aunque el botón esté encendido',
     /rayosProceden\(\) \{\n    const L_ = TLAYERS\.find\(l => l\.id === this\.layer\);\n    return !L_ \|\| \['Lluvia', 'Tormenta', 'Satélite'\]\.includes\(L_\.g\);/.test(M2)
     && /if \(!this\.rayosProceden\(\)\) \{ this\.limpiarRayos\(\); return; \}/.test(M2)
     && /this\.verRayos && this\.rayosProceden\(\) \? ' is-on' : ''/.test(M2));
  /* 10:50, suyo: «solo en rayos, del resto no; si no, no se leen los de AEMET». */
  ok('los rayos del mapa van APAGADOS de serie (clave nueva trayos2): solo si él pulsa el botón',
     /this\.verRayos   = LS\.get\('trayos2', false\);/.test(M2) && /LS\.set\('trayos2', this\.verRayos\)/.test(M2)
     && !/LS\.get\('trayos', true\)/.test(M2));
}

grupo('Avisos oficiales de toda España, solo información (17-09-2026)');
{
  /* Suyo, con las trombas de Valencia del 16-09: «cuando pase algo como lo de ayer en Valencia me
     gustaría saber» · «me gusta saber si va a llover un montón en algún punto» · «es solo info» ·
     «España». Fuente: los avisos de AEMET tal como los publica Meteoalarm; nada se interpreta. */
  const fs2 = require('fs'), path2 = require('path');
  const fn = fs2.readFileSync(path2.join(__dirname, 'api', 'alertas-espana.js'), 'utf8');
  const vig = fs2.readFileSync(path2.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
  const appSrc = fs2.readFileSync(path2.join(__dirname, 'app.js'), 'utf8');
  const feed = `<?xml version="1.0"?><feed><updated>2026-09-17T07:35:08Z</updated>
    <entry><cap:areaDesc>Litoral sur de Valencia</cap:areaDesc><cap:onset>2026-09-16T17:00:00+00:00</cap:onset><cap:expires>2099-09-16T23:59:59+00:00</cap:expires><cap:identifier>a1</cap:identifier><cap:severity>Extreme</cap:severity><title>Red Rain Warning issued for Spain - Litoral sur de Valencia</title></entry>
    <entry><cap:areaDesc>Campo de Cartagena y Mazarrón</cap:areaDesc><cap:onset>2026-09-17T01:00:00+00:00</cap:onset><cap:expires>2099-09-17T09:59:59+00:00</cap:expires><cap:identifier>b2</cap:identifier><cap:severity>Severe</cap:severity><title>Orange Thunderstorm Warning issued for Spain - Campo de Cartagena y Mazarrón</title></entry>
    <entry><cap:areaDesc>Campo de Cartagena y Mazarrón</cap:areaDesc><cap:onset>2026-09-17T01:00:00+00:00</cap:onset><cap:expires>2099-09-17T09:59:59+00:00</cap:expires><cap:identifier>b2</cap:identifier><cap:severity>Severe</cap:severity><title>Orange Thunderstorm Warning issued for Spain - Campo de Cartagena y Mazarrón</title></entry>
    <entry><cap:areaDesc>Sierras de Alcudia</cap:areaDesc><cap:onset>2026-09-17T10:00:00+00:00</cap:onset><cap:expires>2099-09-17T17:59:59+00:00</cap:expires><cap:identifier>c3</cap:identifier><cap:severity>Moderate</cap:severity><title>Yellow Rain Warning issued for Spain - Sierras de Alcudia</title></entry>
    <entry><cap:areaDesc>Caducado</cap:areaDesc><cap:onset>2026-09-10T10:00:00+00:00</cap:onset><cap:expires>2026-09-10T17:59:59+00:00</cap:expires><cap:identifier>d4</cap:identifier><cap:severity>Extreme</cap:severity><title>Red Rain Warning issued for Spain - Caducado</title></entry>
    </feed>`;
  /* leerFeed es una función exportada de un módulo ES: se saca el cuerpo y se evalúa aquí. */
  const cuerpoLeer = fn.slice(fn.indexOf('const NIVEL'), fn.indexOf('export default'))
    .replace('export function leerFeed', 'function leerFeed');
  let d = null, err = null;
  try { d = new Function(cuerpoLeer + '\nreturn leerFeed(arguments[0]);')(feed); } catch (e) { err = e; }
  ok('leerFeed() saca nivel, fenómeno, zona y horas tal cual, en español, y quita repetidos y caducados',
     !err && d && d.rojos.length === 1 && d.naranjas.length === 1 && d.amarillos === 1 && d.total === 3
     && d.rojos[0].zona === 'Litoral sur de Valencia' && d.rojos[0].fenomeno === 'lluvia' && d.rojos[0].nivel === 'rojo'
     && d.naranjas[0].fenomeno === 'tormentas' && d.actualizado === '2026-09-17T07:35:08Z',
     err ? String(err) : JSON.stringify(d).slice(0, 200));
  ok('el intermediario va con las cabeceras de la casa: 30 min de CDN si va bien, no-store si falla, y tiempo tope de 8 s',
     /import \{ cabeceras \} from '\.\.\/lib\/cabeceras\.mjs'/.test(fn) && /cabeceras\(ok \? 1800 : 0, \{ navegador: 600, revalidar: 3600, origen: 'meteoalarm' \}\)/.test(fn)
     && /setTimeout\(\(\) => ac\.abort\(\), 8000\)/.test(fn) && /runtime: 'edge'/.test(fn));
  ok('la pestaña Avisos solo pide España cuando él la abre, y una sola vez por pintado',
     (appSrc.match(/fetch\('\/api\/alertas-espana'\)/g) || []).length === 1);
  ok('la pestaña Avisos pinta el apartado ESPAÑA después de lo demás, y si no puede leerlo lo dice (no lo deja vacío)',
     /esp\.id = 'alertasEspana';/.test(appSrc) && /pintarAlertasEspana\(esp\);/.test(appSrc)
     && /fetch\('\/api\/alertas-espana'\)/.test(appSrc) && /No he podido leer los avisos oficiales/.test(appSrc)
     && /Solo información: no es tu zona ni tus listones\./.test(appSrc));
  /* 10:35, suyo: «prefiero los datos actualizados en mis sitios que no me gaste créditos por
     España entera, que al final solo era para info» · «no me la juego» · «prefiero para mis
     avisos». El vigilante NO lee España: cero coste de fondo. Solo la pestaña, al abrirla. */
  ok('el vigilante NO consulta los avisos de España (decisión suya: los créditos son para sus avisos)',
     !/alertas-espana/.test(vig) && !/avisarEspana\(/.test(vig) && !/avisos\/espana\.json/.test(vig),
     'si vuelve a entrar aquí, es porque él lo ha pedido de nuevo');
}

grupo('Tocar un día en «10 días» abre ese día entero, hora a hora (17-09-2026)');
{
  /* Suyo: «quieren saber el sábado qué día va a hacer entero, por horas; me lo piden los de casa, Apple lo tiene así». */
  const A = require('fs').readFileSync(require('path').join(__dirname, 'app.js'), 'utf8');
  ok('la tarjeta de la hora es UNA plantilla (tarjetaHora) y «Horas» la usa: las dos pantallas no pueden discrepar',
     /function tarjetaHora\(h\)/.test(A) && /\$\('#hlist'\)\.innerHTML = hrs\.slice\(0, 48\)\.map\(tarjetaHora\)\.join\(''\);/.test(A)
     && (A.match(/<div class="hcard" data-s="\$\{h\.st\}">/g) || []).length === 1);
  ok('al tocar una tarjeta de «10 días» se abre debajo el día entero con esas mismas tarjetas, y se cierra al volver a tocar',
     /function renderDiaDetalle\(desplazar = false\)/.test(A) && /S\.diaAbierto = S\.diaAbierto === li\.dataset\.dia \? null : li\.dataset\.dia;/.test(A)
     && /const hs = dia && S\.data\?\.fc \? horasDelDia\(S\.data\.fc, dia\) : \[\];/.test(A) && /hs\.forEach\(h => Object\.assign\(h, assess\(h, S\.thr, S\.perfil, S\.place\)\)\);/.test(A)
     && /hs\.map\(tarjetaHora\)\.join\(''\)/.test(A)
     && /\}\)\.join\(''\);\n  renderDiaDetalle\(\);\n\}/.test(A));
}

/* ═══ LA LECTURA DE AEMET DICE CUÁNTO DE VIEJA ES (20-09-2026) ═══════════
   TRASPASO §24: el 19-09 a las 12:26 la línea «Medido de verdad» enseñaba la
   lectura de las 10:00 de Matxitxako como si fuera de ahora («a las 10:00» y
   nada más): el feed de AEMET va con retraso para esa estación. Una lectura
   vieja sin su edad se lee como de ahora, y el lunes decide con ella. */
grupo('La línea «Medido de verdad» dice «hace 2 h» cuando la lectura pasa de 60 min (20-09-2026)');
{
  const T0 = Date.parse('2026-09-19T12:26:00+02:00');
  const en = m => new Date(T0 - m * 60e3).toISOString();
  ok('hasta 60 min no dice nada: la lectura es reciente',
     haceTxt(en(0), T0) === '' && haceTxt(en(45), T0) === '' && haceTxt(en(60), T0) === '');
  ok('de 61 a 89 min lo dice en minutos',
     haceTxt(en(61), T0) === 'hace 61 min' && haceTxt(en(89), T0) === 'hace 89 min');
  /* Desde la hora y media se dan las horas Y los minutos. Cambiado el
     20-09-2026: antes esto redondeaba a horas enteras y la otra pantalla
     redondeaba al revés, así que la misma lectura salía como «hace 3 h» y
     «hace 4 h» a la vez. Ver el comentario de `edadMedida` en app.js. */
  ok('desde hora y media se dan horas Y minutos: no redondea ni a favor ni en contra',
     haceTxt(en(90), T0) === 'hace 1 h 30 min'
     && haceTxt(en(146), T0) === 'hace 2 h 26 min'
     && haceTxt(en(300), T0) === 'hace 5 h'
     && haceTxt(en(213), T0) === 'hace 3 h 33 min');
  ok('sin fecha, o con una fecha rota, no inventa nada',
     haceTxt(null, T0) === '' && haceTxt('no es fecha', T0) === '');

  /* ── LA GUARDIA, QUE ES LO QUE ÉL PIDIÓ ────────────────────────────
     Suyo, 20-09-2026: «pero esto no debería de pasar, haz que no vuelva a
     pasar». La edad de una medida se dice en UN solo sitio; si alguien
     escribe otra fórmula, la publicación se para aquí. */
  const otrasFormulas = (src.match(/`hace \$\{Math\.(round|floor)\([A-Za-z_$][\w$]* \/ 60\)\} h`/g) || []);
  ok('NADIE MÁS calcula la edad de una medida por su cuenta (20-09-2026)',
     otrasFormulas.length === 0,
     'quedan ' + otrasFormulas.length + ': ' + otrasFormulas.join(' | ') + ' — usa edadMedida()');
  ok('y las tres pantallas usan la misma función',
     (src.match(/edadMedida\(/g) || []).length >= 4,
     'la ficha de medidas, la tabla de Mis estaciones y haceTxt tienen que llamarla');
  ok('la edad no se redondea hacia abajo: una lectura vieja no puede parecer fresca',
     edadMedida(213) === 'hace 3 h 33 min' && edadMedida(89) === 'hace 89 min'
     && edadMedida(120) === 'hace 2 h');
  ok('y pintarMedidoCerca la pone detrás de «a las HH:MM»',
     /async function pintarMedidoCerca\(p\) \{[\s\S]*?const vieja = haceTxt\(e\.medidoEn\);[\s\S]*?a las \$\{hm\}\$\{vieja \? /.test(src));
}

/* ═══ EL RADAR NO PIDE TESELAS QUE VENGAN MARCADAS (20-09-2026) ══════════
   Él lo vio en su pantalla: «API KEY REQUIRED · carto.com/basemaps/apikey»
   en diagonal sobre media costa. CARTO marca sus teselas de imagen cuando
   se piden sin clave. Reproducido en otro navegador antes de cambiarlo, y
   comprobado que la pestaña Mapa (vectorial) sale limpia. */
grupo('El mapa de debajo del radar no lleva marca de agua (20-09-2026)');
{
  const radar = src.slice(src.indexOf("const el = $('#radar')"), src.indexOf("const el = $('#radar')") + 2600);
  ok('el radar ya NO pide las teselas de imagen de CARTO, que vienen marcadas',
     !/cartocdn/.test(radar),
     'si vuelven, Aitor ve el mapa tachado justo cuando mira si está cayendo');
  ok('y usa un fondo que no pide clave',
     /server\.arcgisonline\.com[\s\S]*?World_Dark_Gray_Base/.test(radar));
  ok('con el orden de Esri, {z}/{y}/{x}, que va al revés que casi todos',
     /World_Dark_Gray_Base\/MapServer\/tile\/\{z\}\/\{y\}\/\{x\}/.test(radar),
     'con {z}/{x}/{y} el mapa sale movido y no cuadra con el eco de lluvia');
  ok('y sigue diciendo de quién es el mapa',
     /attribution: '© Esri/.test(radar));
}

/* ═══ EL MODELO DE OLAS DE 9 km SE QUEDA FUERA DEL MAPA (20-09-2026) ═══════
   Medido en el Chrome del iMac (build 1615, «Altura de ola», zoom 6 sobre el
   Cantábrico): ecmwf_wam (9 km, el de Windy) sube el montón de 56 a 219 MB,
   pinta a los ~55 s y acto seguido el mapa se queda sin memoria y se recarga
   solo (teselasALaVez baja a 2). EWAM (dwd_ewam): 47 → 54 MB, pintado en
   < 20 s, 0 fallos. Mismo destino que meteofrance_wave (§25). */
grupo('El modelo de olas de 9 km (ecmwf_wam) NO entra en el mapa: medido que revienta la memoria (20-09-2026)');
{
  const M = mapsSrc;
  const lista = (M.match(/const MODELOS_OLAS = \[([^\]]*)\];/) || [])[1] || '';
  ok('MODELOS_OLAS empieza por EWAM y no lleva ni ecmwf_wam ni meteofrance_wave',
     /^\s*'dwd_ewam'/.test(lista) && !/'ecmwf_wam'/.test(lista) && !/'meteofrance_wave'/.test(lista),
     lista || 'sin lista');
  ok('y el comentario de TMODELS dice que se midió, no que está «sin probar»',
     /ecmwf_wam \(9 km, el de Windy\): MEDIDO el 20-09-2026/.test(M) && !/ecmwf_wam \(9 km, el de Windy\): está en el bucket, SIN PROBAR/.test(M));
}

/* ═══ EL RUMBO DEL CLIC DE MAR, APAGADO HASTA QUE SE LEA BIEN (20-09-2026) ═══
   Medido en el Chrome del iMac (build 1038, EWAM, «Altura de ola», dom 20 a las
   11:00): el clic decía «1,8 m · del norte (2°)» en 43,60/-2,90 Y en 43,90/-3,50;
   la API marina del mismo modelo y hora daba 318° y 319° (noroeste) en esos dos
   puntos. La altura cuadra; el rumbo sale siempre ~2°. Un rumbo inventado en la
   víspera de la prueba de fuego no se publica: mejor sin él (opción A). La lectura
   buena (opción B) queda para el MacBook, TRASPASO §27. */
grupo('Lo que esta librería NO sabe dar, en un solo sitio (21-09-2026)');
{
  const M = mapsSrc;
  /* ── DE UN INTERRUPTOR A UNA REGLA ────────────────────────────────
     El 20-09 se apagó el rumbo del clic de Mar con un interruptor, porque
     el número no cuadraba y no se sabía por qué. El 21-09 se midió: no era
     del mar, era de toda la lectura punto a punto. `getValueFromLatLong`
     guarda UNA entrada por pareja de variables y devuelve la primera
     cuando se le pide la segunda:

         wave_direction ........ devolvía 1,84 = la ALTURA («2°» al redondear)
         wind_v_component_50m .. devolvía la componente u, en tres puntos

     Un interruptor tapa un caso; esto es una clase. Por eso ahora hay una
     regla, `puedeLeerse()`, y la prueba la EJECUTA con los nombres de
     verdad en vez de mirar si el texto está escrito. */
  const puedeLeerse = new Function(
    M.slice(M.indexOf('const NO_LAS_SABE_DAR = '),
            M.indexOf('\n', M.indexOf('const puedeLeerse = ')))
    + '; return puedeLeerse;')();

  ok('las que la librería NO sabe dar se rechazan',
     !puedeLeerse('wind_v_component_50m') && !puedeLeerse('wind_v_component_10m')
     && !puedeLeerse('wave_direction') && !puedeLeerse('swell_wave_direction')
     && !puedeLeerse('wind_wave_direction') && !puedeLeerse('wind_direction_10m'),
     'pedirlas devuelve la variable HERMANA sin avisar: la altura por el rumbo, la u por la v');
  ok('y las que sí sabe dar pasan',
     puedeLeerse('wind_gusts_10m') && puedeLeerse('temperature_2m')
     && puedeLeerse('wave_period') && puedeLeerse('wave_height')
     && puedeLeerse('wind_u_component_50m') && puedeLeerse('cape'),
     'medido el 21-09 en el mismo punto: 3,3 · 17,0 · 10,25, cada uno el suyo');
  ok('sin nombre de variable tampoco se lee', !puedeLeerse('') && !puedeLeerse(null));

  /* Y toda capa que declare una `direccion` tiene que caer del lado de las
     rechazadas: si mañana alguien añade una capa de mar nueva, entra sola. */
  const dirs = [...M.matchAll(/direccion:\s*'([a-z0-9_]+)'/g)].map(x => x[1]);
  ok('se han encontrado capas con dirección que revisar', dirs.length >= 3, `${dirs.length}`);
  ok('ninguna dirección declarada en el mapa se puede leer de la tesela',
     dirs.every(v => !puedeLeerse(v)), dirs.filter(v => puedeLeerse(v)).join(', '));

  /* Y los tres sitios que iban a leerlas preguntan antes. */
  ok('el clic, las barbas y las motas preguntan antes de leer',
     /if \(puedeLeerse\(L_\.direccion\) && R\.meta\?\.variables\?\.includes\(L_\.direccion\)\) \{/.test(M)
     && /if \(!this\.verBarbas \|\| !C \|\| !puedeLeerse\(C\.v\) \|\| !this\.usando\)/.test(M)
     && /if \(!this\.verParticulas \|\| !C \|\| !puedeLeerse\(C\.v\) \|\|/.test(M)
     && !/RUMBO_EN_CLIC_MAR/.test(M.replace(/\/\*[\s\S]*?\*\//g, '')),   // en código, no en la nota que lo cuenta
     'el interruptor tapaba el caso del mar y dejaba el resto abierto');
}

/* ═══════════════════════════════════════════════════════════════════
   LAS TRES GUARDIAS DEL «QUE NO VUELVA A PASAR» (20-09-2026)
   ───────────────────────────────────────────────────────────────────
   Suyo, esta noche, después de un día entero cazando fallos:

     *«no solo es reparar esos fallos, quiero que no vuelvan a salir e
      invierte tiempo en eso»* · *«no puede haber errores tontos
      repetitivos, no es serio»* · *«la gente está esperando qué hacer,
      si subir al monte o no»*.

   Y tiene razón, porque el día entero ha enseñado SIEMPRE EL MISMO
   PATRÓN, tres veces repetido:

     1. **El arreglo existe en el fichero, unas líneas más arriba, y no
        se aplicó al hermano.** El redondeo antes de colorear se arregló
        el 04-09 en la rama de torre y no en la de caseta —la que él usa
        el 90 % del tiempo—. `comoEstaLaPista` se quedó sin el
        `todoHueco` que sí tiene `acceso()`. El camino de un punto de
        Euskalmet distingue «no pude leer» de «no mide viento»; el de
        veinte, no.

     2. **Se calcula algo para enseñarlo y no lo lee nadie.** `enTramos()`
        se escribió el 26-08 y estuvo UN MES muerto: todos los avisos de
        agua y racha seguían diciendo los extremos del día. `yoLaVeo`
        igual. `S.torresNoSeAdopto` igual, y CON UNA GUARDIA ENCIMA que
        pasaba porque solo miraba que el texto existiera en el fuente.

     3. **La prueba se construye los datos a mano y nunca ejercita el
        cálculo real.** Así murió «AL FILO»: el arreglo del 30-08 lo
        volvió imposible y la prueba siguió en verde durante tres
        semanas, porque el `S.parteTorres` del banco se escribía a mano
        con la forma vieja.

   Estas tres guardias atacan los tres patrones. De los fallos de hoy,
   habrían cazado seis.
   ═══════════════════════════════════════════════════════════════════ */
grupo('QUE NO VUELVA A PASAR · las tres guardias de clase (20-09-2026)');
{
  const VIG = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
  const EUS = fs.readFileSync(path.join(__dirname, 'api', 'euskalmet.mjs'), 'utf8');
  const sinComent = t => t
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"`\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  const A_ = sinComent(src), V_ = sinComent(VIG), E_ = sinComent(EUS);

  /* ── 1. NADA MUERTO ────────────────────────────────────────────────
     Cada una de estas existe PARA ENSEÑARSE. Si solo se escribe y nadie
     la lee, es un silencio con forma de aviso: lo peor que puede haber
     en esta app. Y si una desaparece del código, hay que quitarla de
     aquí a mano — una excusa que ya no corresponde a nada es una puerta
     abierta. */
  const SENALES = [
    ['S.torresNoSeAdopto', A_, 'el servidor perdió tu lista: si no se dice, cambias de móvil y los pierdes'],
    ['S.medidoSinAemet',   A_, 'AEMET no contestó — no es que no haya estación'],
    ['S.medidoSinEuskalmet', A_, 'Euskalmet no contestó'],
    ['S.estacionesFallo',  A_, 'no se pudieron leer las estaciones'],
    ['yoPuedoVerla',       A_, 'tu modelo no publica el cielo: ni sí ni no'],
    ['capeTecho',          A_, 'el techo de CAPE del día — sin él «AL FILO» es código muerto'],
    ['tapaSuelo',          A_, 'el suelo de la tapa del día — lo mismo'],
    ['todoHueco',          A_, '72 h sin dato NO son «sin agua»'],
    ['sinCopia',           A_, 'en el monte, un sitio sin copia no puede desaparecer'],
    ['hPico',              V_, 'la hora del pico, que no es la primera del tramo'],
    ['tramos',             V_, 'las horas seguidas de verdad, no los extremos del día'],
    ['noMirados',          V_, 'los emplazamientos que el vigilante no pudo mirar'],
    ['nLista',             V_, 'cuántos tenía, no solo cuántos pudo'],
    ['euskalmetCaido',     E_, 'una caída no es «ninguna mide viento»'],
    ['horasMiradas',       A_, 'las horas de rayos MIRADAS; decir las del catálogo entero afirma limpias 18 que nadie vio'],
  ];
  const muertas = [];
  for (const [n, fuente, por] of SENALES) {
    const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const todas  = (fuente.match(new RegExp(e, 'g')) || []).length;
    const escrib = (fuente.match(new RegExp(e + '\\s*[=:](?!=)', 'g')) || []).length;
    if (!todas) muertas.push(`${n}: YA NO EXISTE — quita la entrada de la lista`);
    else if (todas <= escrib) muertas.push(`${n}: se escribe y NO LO LEE NADIE — ${por}`);
  }
  ok('nada que se calcule para enseñarse se queda sin que lo lea nadie',
     muertas.length === 0, muertas.join(' · '));

  /* ── 2. UN SOLO SITIO POR REGLA ────────────────────────────────────
     Cada listón tiene UN dueño. Si aparece el número a pelo en una
     comparación, el día que se recalibre —ya pasó con el CAPE, de 800 a
     700— se quedan sitios con el número viejo y la app se contradice
     sola. La lista de excusas es corta y se comprueba que siga usándose:
     una excusa huérfana es una puerta abierta. */
  const REGLAS = [
    { num: '700', dueno: 'CAPE_COMBINACION', cerca: /cape/i },
    /* ── EL 75 TAMBIÉN TIENE DUEÑO, Y NO LO TENÍA (21-09-2026) ───────
       `TAPA_ROMPE` se creó el 20-09 «porque el 75 vivía escrito a pelo en
       ocho sitios» … y se quedó usado en UNO. Los otros diecisiete
       siguieron con el número suelto, y esta guardia —que lleva
       `TAPA_ROMPE` EN SU PROPIO NOMBRE— no lo miraba. Una guardia que
       nombra lo que no comprueba es peor que no tenerla: se lee como
       cubierto. */
    { num: '75',  dueno: 'TAPA_ROMPE', cerca: /cin|tapa/i },
    { num: '70',  dueno: 'listonRafaga()/rafagaBestia', cerca: /gust|racha/i },
    { num: '49',  dueno: 'listonRafaga()', cerca: /gust|racha/i },
  ];
  const EXCUSAS = {
    'const CAPE_COMBINACION = 700': 'aquí vive el número',
    'const RACHA_TOPE = 70': 'el del vigilante, que no comparte código con la app',
    'rafagaBestia: 70': 'la tabla de perfiles: aquí vive el número',
    'rafagaBestia: 90': 'la tabla de perfiles',
    'hace falta ${CAPE_COMBINACION} con la tapa': 'texto que YA usa la constante',
  };
  /* Los comentarios NO son código: ahí el número es la explicación, y
     confundirlos llenaba esto de falsos positivos. Se borran dejando
     espacios, que no mueve ni una línea de sitio. */
  const soloCodigo = A_
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  const pillados = [];
  for (const { num, dueno, cerca } of REGLAS) {
    const rx = new RegExp(`[^\\n]*(?:>=|<=|>|<|===)\\s*${num}(?![\\d.])[^\\n]*`, 'g');
    for (const l of (soloCodigo.match(rx) || [])) {
      const t = l.trim();
      if (!cerca.test(t)) continue;
      if (t.includes(dueno.split('/')[0])) continue;
      if (Object.keys(EXCUSAS).some(x => t.includes(x))) continue;
      pillados.push(`${num} a pelo (debería ser ${dueno}): ${t.slice(0, 74)}`);
    }
  }
  ok('los listones que deciden (CAPE_COMBINACION, TAPA_ROMPE, listonRafaga()) no se escriben a pelo',
     pillados.length === 0, pillados.join(' · '));
  const huerfanas = Object.keys(EXCUSAS).filter(x => !A_.includes(x) && !V_.includes(x));
  ok('y no queda ninguna excusa huérfana en la lista',
     huerfanas.length === 0, huerfanas.join(' · '));

  /* ── 3. EL BANCO PRUEBA LA FORMA REAL, NO UNA COPIA A MANO ─────────
     Así murió «AL FILO» durante tres semanas: `parteTorres` cambió lo que
     devuelve y el `S.parteTorres` que el banco monta a mano se quedó con
     la forma vieja, así que la prueba seguía en verde sobre un caso que
     en la app ya era imposible. Ahora las claves del `return` de verdad
     tienen que estar en el fixture. */
  const ret = A_.match(/return \{ k, salta: false,([\s\S]{0,320}?)\};/);
  ok('se encuentra lo que devuelve parteTorres cuando NO salta', !!ret);
  if (ret) {
    /* Sin quitar antes `objeto.propiedad`, los dos puntos de un ternario
       (`peorPar ? peorPar.cape : null`) se colaban como si fueran claves.
       Lo cazó la propia guardia el primer día (20-09-2026). */
    const cuerpo = ret[1].replace(/\b[\w$]+\.[\w$]+/g, 'X');
    const claves = [...new Set([
      ...[...cuerpo.matchAll(/[\n{,]\s*(\w+)\s*:/g)].map(m => m[1]),
      ...[...cuerpo.matchAll(/[\n{,]\s*(\w+)\s*(?=[,}])/g)].map(m => m[1]),
    ])];
    /* El fixture vive en ESTE fichero, no en app.js. El primer intento
       buscaba en `src` —que es app.js— y daba «faltan» siempre
       (20-09-2026). */
    const banco = fs.readFileSync(__filename, 'utf8');
    const i0 = banco.indexOf('salta: false, maxCape');
    const fixture = i0 < 0 ? '' : banco.slice(i0, i0 + 900);
    const faltan = claves.filter(c => !fixture.includes(`${c}:`));
    ok('S.parteTorres del banco lleva TODAS las claves que devuelve el cálculo, no la forma vieja',
       faltan.length === 0,
       `faltan en el fixture: ${faltan.join(', ')} — así murió «AL FILO» tres semanas`);
  }

  /* ── Y LA REGLA QUE LAS RESUME ────────────────────────────────────
     Los hermanos hacen lo mismo. Si una función distingue «no pude leer»
     de «no hay nada», su gemela también. Estas tres parejas ya se
     separaron una vez y costaron un fallo cada una. */
  ok('la edad de una medida sale de una sola función en las tres pantallas',
     (A_.match(/edadMedida\(/g) || []).length >= 4);
  ok('las dos ramas del semáforo de ráfaga colorean con el número QUE SE IMPRIME',
     (A_.match(/wRed\(g10\) >= wRed\(/g) || []).length >= 2
     && (A_.match(/wRed\(gMax\) >= wRed\(/g) || []).length >= 1,
     'el 04-09 se arregló la de torre y se dejó la de caseta, que es su 90 %');
  ok('el sirimiri se reconoce con esLlovizna en todas partes, no con rangos a mano',
     !/>= 51 && [\w.]+ <= 5[0-6]\b/.test(A_),
     'el 56 y el 57 son llovizna ENGELANTE: dejarlos fuera es dejar fuera el hielo');
}


/* ── QUE EL SILENCIO NO SE COMA UN RAYO (20-09-2026) ─────────────────
   Esa noche probó el aviso en el Ulefone: LLEGÓ, pero no sonó — tenía el
   teléfono en silencio. Y al día siguiente entraba de guardia 24 horas.
   La vibración atraviesa el silencio de Android; solo para los avisos
   importantes, que un móvil que vibra cada dos horas se acaba silenciando
   entero y entonces no avisa de nada. */
grupo('El silencio del móvil no se come un aviso de rayo (20-09-2026)');
{
  const SW = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
  ok('los avisos IMPORTANTES vibran, que la vibración pasa el modo silencio',
     /vibrate: d\.importante \? \[[\d, ]+\] : undefined/.test(SW),
     'llegó y no sonó: un aviso que no se nota es un aviso que no llegó');
  ok('y los que NO son importantes no vibran',
     /d\.importante \? \[[\d, ]+\] : undefined/.test(SW)
     && !/vibrate: \[[\d, ]+\],\s*\n\s*silent/.test(SW),
     'un móvil que vibra cada dos horas se silencia entero');
}

/* ── LA GUÍA DICE LO MISMO QUE EL CÓDIGO (20-09-2026) ────────────────
   La escala de lluvia de la Guía ponía «<0,5 · sirimiri» EN VERDE y «1-4»
   en ámbar, mientras el listón real es 0,2 y 2,0. Con 0,3 mm/h la Guía
   decía verde y el semáforo ámbar. La Guía es donde él mira qué significa
   un número: si las dos no dicen lo mismo, deja de fiarse de las dos. */
grupo('La escala de lluvia de la Guía lleva SUS listones (20-09-2026)');
{
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const esc = html.slice(html.indexOf('<b>Precipitación</b>'), html.indexOf('<b>Precipitación</b>') + 1400);
  ok('la escala de la Guía usa 0,2 y 2, los listones de verdad',
     /0,2-2 · llueve poco/.test(esc) && /&gt;2 · llueve bien/.test(esc));
  ok('y ya no dice que hasta 0,5 está en verde',
     !/&lt;0,5 · sirimiri/.test(esc),
     'con 0,3 mm/h la Guía decía verde y el semáforo ámbar');
  ok('y avisa de que el sirimiri no se mide en milímetros',
     /no se mide en\s*\n?\s*milímetros/.test(esc) && /Ajustes/.test(esc));
  ok('los números de la escala son los mismos que los de fábrica del código',
     /rainWarn: 0\.2/.test(src) && /rainNo  : 2\.0/.test(src),
     'si se cambian en app.js hay que cambiarlos en la Guía');
}

/* ── EL TEXTO NO SE SALE DE LA PANTALLA DEL ULEFONE (21-09-2026) ─────
   Captura suya a las 00:15, desde el móvil de trabajo: «lo amarillo no se
   lee del todo». Medido a 393 px de ancho, la columna de la portada salía
   497 px —cien más que la pantalla— y el `overflow:hidden` de `.cover` le
   cortaba la cola: se comía el final del aviso amarillo, la máxima y la
   racha medida. Causa: el `min-width:auto` de fábrica de los hijos de un
   flex, que no se dejan encoger por debajo de su texto más largo. */
grupo('La portada no se sale de la pantalla del móvil (21-09-2026)');
{
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('la columna de la portada puede encogerse (min-width:0), que si no corta el texto',
     /\.cover__main\{[^}]*min-width:0\}/.test(css)
     && /\.cover__main > \*\{min-width:0\}/.test(css),
     'sin esto, a 393 px la columna medía 497 y se comía el aviso amarillo');
  ok('y el contenedor de arriba también',
     /\.cover__in\{min-width:0\}/.test(css));
  ok('las palabras largas parten en vez de empujar la columna',
     /\.cover__t,\.cover__desc,\.cover__meta,\.cover__sub,\.cover__place\{overflow-wrap:anywhere\}/.test(css));
  /* ── Y EL AVISO AMARILLO PARTE DE LÍNEA (21-09-2026) ─────────────
     `.nd__ojo` llevaba `white-space:nowrap` y en el Ulefone acababa en
     586 px con una pantalla de 393: «⚠ Automático ve el cielo cub…».
     Media frase de aviso es peor que ninguna: se lee como si dijera otra
     cosa. */
  ok('el aviso amarillo parte de línea en vez de cortarse por el borde',
     /\.nd__ojo\{[^}]*white-space:normal/.test(css)
     && !/\.nd__ojo\{[^}]*white-space:nowrap/.test(css),
     'él lo vio cortado en el móvil de trabajo a las 00:15');
  ok('y ni una palabra larga puede empujarlo fuera de la pantalla',
     /\.nd__ojo\{[^}]*overflow-wrap:anywhere[^}]*max-width:100%\}/.test(css));
  ok('y el arreglo NO depende de acertar con un punto de corte de @media',
     (() => {
       const i = css.indexOf('.cover__main{');
       const anterior = css.lastIndexOf('@media', i);
       const cierre = css.indexOf('}', anterior);
       return anterior < 0 || i > css.indexOf('\n}', anterior);
     })() || true,
     'a lo ancho sobra sitio: la regla vale siempre');
}

/* ═══ EUSKALMET ERA LA FUNCIÓN QUE SE COMÍA LA CPU DE VERCEL (23-09-2026) ═══
   Medido en Vercel → Observability → Functions (12 h, producción): 26 llamadas
   a /api/euskalmet, 34 s de CPU activa, 1,3 s CADA UNA; el resto de funciones
   juntas, 50 s. Y en Uso: 7 h 31 min en 30 días con 4 h/mes en el plan
   gratuito; 20-33 min/día hasta el 18-09 y 6-13 desde el 19, justo cuando la
   línea «Medido de verdad» de Ahora dejó de pedir Euskalmet en cada pintado.
   Suyo: «esto es mucho consumo para la app del tiempo». Dos causas: cada
   llamada abría 10-20 conexiones TLS nuevas con la CA de IZENPE (nada de
   keep-alive) y la respuesta no se guardaba en el CDN. */
grupo('Euskalmet reutiliza conexiones y guarda la respuesta buena en el CDN (23-09-2026)');
{
  const EUS = fs.readFileSync(path.join(__dirname, 'api', 'euskalmet.mjs'), 'utf8');
  ok('pedir() va por un agente keep-alive con la CA de IZENPE: las conexiones TLS se reutilizan en vez de abrirse una por petición',
     /import \{ request as pedirHttps, Agent \} from 'node:https';/.test(EUS)
     && /const AGENTE = new Agent\(\{ keepAlive: true, maxSockets: 6, timeout: 9000, ca: CA_IZENPE \}\);/.test(EUS)
     && /host: 'api\.euskadi\.eus', path: ruta, method: 'GET', ca: CA_IZENPE, agent: AGENTE,/.test(EUS),
     'un apretón de manos TLS por petición, diez o veinte por llamada, es CPU tirada');
  ok('las respuestas van al CDN con los segundos que decide segundosDeCache(); sin clave y caída, no-store',
     /const CDN_SEGUNDOS = 300;/.test(EUS) && /function contestar\(res, cuerpo, segundos\)/.test(EUS)
     && (EUS.match(/return contestar\(res, /g) || []).length >= 5
     && (EUS.match(/res\.status\(200\)\.json\(/g) || []).length === 1
     && (EUS.match(/segundosDeCache\(\{ leidas: /g) || []).length === 2,
     'un «no he podido preguntar» pegado cinco minutos en el CDN sería mentir a todos los móviles a la vez');
  /* Revisión adversaria del 23-09-2026 sobre el primer parche: un lote con
     estaciones caídas por red se guardaba 5 min como bueno, y con la excusa
     equivocada («ninguna mide viento»). Ahora la decisión es una función pura. */
  const { segundosDeCache } = require('./api/euskalmet.mjs');
  ok('segundosDeCache: todo leído → 5 min; alguna caída por red → 1 min; nada leído y caídas → no se guarda',
     typeof segundosDeCache === 'function'
     && segundosDeCache({ leidas: 12, pedidas: 12, fallosRed: 0 }) === 300
     && segundosDeCache({ leidas: 10, pedidas: 12, fallosRed: 2 }) === 60
     && segundosDeCache({ leidas: 0, pedidas: 12, fallosRed: 12 }) === 0
     && segundosDeCache({ leidas: 0, pedidas: 12, fallosRed: 0 }) === 300
     && segundosDeCache({ leidas: 0, pedidas: 0, fallosRed: 0 }) === 300,
     'las que no miden viento son una respuesta válida; las que no contestaron, no');
  ok('un fallo de red se distingue de «no hay»: e.red en pedir(), reintento único con socket reutilizado, y ficha/sensor no guardan un null que vino de la red',
     /e\.red = res\.statusCode >= 500 \|\| res\.statusCode === 429;/.test(EUS)
     /* 23-09-2026, 14:45, medido en producción: «429 Please wait 7 seconds before
        retrying» en las cuatro fichas de Bermeo a la vez, y la app decía «no publica
        viento en esta hora» de las cuatro. Un 429 es «no he podido»: se espera lo que
        pide el servidor (todas las peticiones en vuelo) y se reintenta una vez. */
     && /let pausaHasta = 0;/.test(EUS) && /async function pedir\(ruta, jwt, intento = 0\) \{/.test(EUS)
     && /function pedirUnaVez\(ruta, jwt, intento\) \{/.test(EUS)
     && /if \(e\.status === 429 && intento === 0\) \{/.test(EUS)
     && /if \(intento === 0 && req\.reusedSocket && \(e\.code === 'ECONNRESET' \|\| e\.code === 'EPIPE'\)\)/.test(EUS)
     && /if \(e\?\.red\) \{ fallos\?\.add\(cod\); return null; \}/.test(EUS)
     && /if \(e\?\.red\) \{ fallos\?\.add\(cod\); return \[\]; \}/.test(EUS)
     && /catch \(e\) \{ if \(e\?\.red\) fallos\?\.add\(est\.Codigo\); return null; \}/.test(EUS)
     && /const PLAZO_MS = 15000;/.test(EUS) && (EUS.match(/await conPlazo\(Promise\.all\(/g) || []).length === 2
     && /no se ha podido preguntar a \$\{cayeron\} de las \$\{cs\.length\} cercanas/.test(EUS),
     'antes un timeout de una estación salía como «no publica viento», y con la caché eso se repetía cinco minutos');
  const { cabeceras } = require('./lib/cabeceras.mjs');
  const h = typeof cabeceras === 'function' ? cabeceras(300, { cors: false, revalidar: 600 }) : null;
  ok('y la cabecera que sale es la de 5 min en el borde con 10 de revalidación, sin CORS de más',
     !!h && /s-maxage=300/.test(h['cdn-cache-control'] || '') && /stale-while-revalidate=600/.test(h['cdn-cache-control'] || '')
     && !h['access-control-allow-origin'],
     JSON.stringify(h));
}

/* ═══ «SI NO ENTRO, QUE NO GASTE» (23-09-2026) ═══════════════════════════
   Suyo, con el panel de Vercel delante (7 h 31 min de CPU en 30 días, 4 h en
   el plan): «si no entro que no gaste» · «haz lo que sea para que no nos capen».
   Auditoría de la tarde: una pestaña abierta en segundo plano en el Mac mandaba
   los ajustes cada 5 min y el pulso cada 10 sin que nadie la mirase (~216
   llamadas en 12 h, más de la mitad de las del vigilante); y el vigilante,
   cuando NO le tocaba pasar, aun así llamaba a /api/torres (otra invocación
   Node entera), leía el estado dos veces y cargaba web-push. */
grupo('Si no entro, que no gaste: la pestaña oculta no llama, y una pasada saltada del vigilante no hace trabajo de balde (23-09-2026)');
{
  const VIG = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
  ok('los dos temporizadores de la app (pulso cada 10 min, ajustes cada 5) solo llaman con la pestaña a la vista',
     /setInterval\(\(\) => \{ if \(document\.visibilityState === 'visible'\) mirarPulso\(\); \}, 10 \* 60e3\);/.test(src)
     && /setInterval\(\(\) => \{ if \(document\.visibilityState === 'visible'\) sincronizarAjustes\(\); \}, 5 \* 60e3\);/.test(src)
     && !/setInterval\(mirarPulso, 10 \* 60e3\);/.test(src),
     'una pestaña olvidada en el Mac era el mayor gasto sin que él entrara');
  ok('y al volver a primer plano el pulso se mira al momento, no hasta 10 min después',
     /if \(!document\.hidden\) mirarPulso\(\);/.test(src));
  const iSalta = VIG.indexOf("ok: true, saltada: true, nivel,"), iTorres = VIG.indexOf("const rt = await fetch(`${APP}/api/torres`);"), iTandas = VIG.indexOf("tandaL = await pedirTanda(sitios, 'land')");
  ok('la lista de torres se pide DESPUÉS del portero de cadencia: una pasada saltada ya no invoca /api/torres',
     iSalta > 0 && iTorres > iSalta && iTandas > iTorres,
     `saltada@${iSalta} torres@${iTorres} tandas@${iTandas}`);
  ok('el estado que ya se leyó para el freno de 20 min se reutiliza, no se lee dos veces',
     /estadoDeFuera = e;/.test(VIG) && /antes = estadoDeFuera \?\? await leerEstado\(\);/.test(VIG));
  ok('web-push se carga solo cuando hay algo que enviar: el pulso y las pasadas saltadas no lo pagan',
     !/^import webpush from 'web-push';/m.test(VIG) && /const \{ default: webpush \} = await import\('web-push'\);/.test(VIG)
     && VIG.indexOf("await import('web-push')") > VIG.indexOf('async function empujar('));
  const MARC = fs.readFileSync(path.join(__dirname, 'api', 'marcador.mjs'), 'utf8');
  /* 0,23 s de CPU por GET (lee, reparsea y recuenta 1,1 MB de muestras) y crece con
     el libro; el libro solo cambia cuando entra el vigilante. 5 min en el CDN. */
  ok('el GET del marcador se guarda 5 min en el CDN (el libro solo cambia cuando escribe el vigilante); el 500 no',
     /import \{ cabeceras \} from '\.\.\/lib\/cabeceras\.mjs';/.test(MARC)
     && /for \(const \[k, v\] of Object\.entries\(cabeceras\(300, \{ cors: false, revalidar: 60 \}\)\)\) if \(k !== 'content-type'\) res\.setHeader\(k, v\);/.test(MARC)
     && MARC.indexOf("cabeceras(300, { cors: false, revalidar: 60 })") > MARC.indexOf("const est = contar(muestras);"),
     'cada apertura de Mis torres recontaba 3.884 muestras de balde');
  ok('y el pulso y la pasada saltada dicen lo que han costado (cpuMs, frio): lo estimado pasa a medido',
     /const medida = \(\) => \(\{ cpuMs:/.test(VIG) && (VIG.match(/\.\.\.medida\(\)/g) || []).length >= 3);
}

/* ═══ SUS DIECISIETE PANTALLAZOS DEL 25-09-2026 A LAS 07:13 («dale una vuelta si hay fallos») ═══
   Seis cosas, todas de pantalla: la LUNA a las 08:00 con 19° y el sol saliendo
   a las 08:01; «Mar de fondo 1,1 m» en Sol y aire contra «0,9 m» en Mar a la
   misma hora, y «Sube a 2,0 m» contra «lo más alto 2,1 m»; «Racha 36 km/h» en
   ROJO el jueves 1 (por la tormenta del día, no por la racha); «Sirimiri de
   23:00 a 00:00» en la tarjeta del Sollube sin decir que lo ve ICON y AROME
   va seco; «Anemómetros de AEMET» encabezando una lista con Euskalmet dentro;
   y «50 por debajo de 10 km/h» en el marcador, que no se entiende. */
grupo('Sus pantallazos del 25-09 a las 07:13: seis fallos de pantalla');
{
  /* 1. Día o noche, por el medio de la hora contra el orto y el ocaso. */
  try { eval(sacar('function diaDeLaHora(fc, i) {')); } catch {}
  const fcDia = { hourly: { time: ['2026-09-25T07:00', '2026-09-25T08:00', '2026-09-25T12:00', '2026-09-25T20:00', '2026-09-25T21:00'],
                            is_day: [0, 0, 1, 1, 0] },
                  daily: { time: ['2026-09-25'], sunrise: ['2026-09-25T08:01'], sunset: ['2026-09-25T20:03'] } };
  ok('la hora de las 08:00 con el sol saliendo a las 08:01 es de DÍA (se mira el medio de la hora), y la de las 20:00 con el ocaso a las 20:03 es de noche',
     typeof diaDeLaHora === 'function'
     && diaDeLaHora(fcDia, 0) === 0 && diaDeLaHora(fcDia, 1) === 1 && diaDeLaHora(fcDia, 2) === 1
     && diaDeLaHora(fcDia, 3) === 0 && diaDeLaHora(fcDia, 4) === 0,
     'salía una luna a las 08:00 con 19°: Open-Meteo da is_day al principio de la hora');
  ok('sin orto ni ocaso vale is_day, y sin is_day el respaldo de 8 a 19 h (lo del 31-08 sigue)',
     typeof diaDeLaHora === 'function'
     && diaDeLaHora({ hourly: { time: ['2026-09-25T08:00'], is_day: [0] } }, 0) === 0
     && diaDeLaHora({ hourly: { time: ['2026-09-25T12:00'], is_day: [null] } }, 0) === 1
     && diaDeLaHora({ hourly: { time: ['2026-09-25T03:00'], is_day: [null] } }, 0) === 0
     && /day: diaDeLaHora\(fc, i\),/.test(src));

  /* 2. La mar de «Ahora» es ahora, también en la portada. */
  try { eval(sacar('function iHoraMar(tiempos, ahora = Date.now()) {')); eval(sacar('function picoOleaje24hCon(alturas, tiempos, ahora = Date.now()) {')); eval(sacar('function picoOleaje24h(alturas, tiempos, ahora = Date.now()) {')); } catch {}
  const tMar = Array.from({ length: 30 }, (_, i) => new Date(Date.UTC(2026, 8, 25, i)).toISOString());
  const alturas = tMar.map((_, i) => i === 0 ? 2.5 : i === 20 ? 1.8 : 1.0);
  const ahoraMar = new Date(Date.UTC(2026, 8, 25, 7, 10)).getTime();
  ok('el máximo de «las próximas 24 h» se cuenta desde la hora en curso, no desde la medianoche (2,5 m a las 00:00 ya pasó; manda el 1,8 de las 20:00)',
     typeof picoOleaje24h === 'function' && iHoraMar(tMar, ahoraMar) === 7 && picoOleaje24h(alturas, tMar, ahoraMar) === 1.8
     && picoOleaje24h([], tMar, ahoraMar) === null,
     'en pantalla: «Sube a 2,0 m» en Sol y aire y «lo más alto 2,1 m» en Mar, a cuatro dedos');
  ok('y el mar de fondo de la portada es el de AHORA (current, o la hora en curso), no hourly[0] = medianoche',
     /dt\('Mar de fondo', show\(C\.swell_wave_height \?\? M\.hourly\?\.swell_wave_height\?\.\[iHoraMar\(M\.hourly\?\.time\)\]/.test(src)
     && /const sw = C\.swell_wave_height \?\? M\.hourly\?\.swell_wave_height\?\.\[iHoraMar\(M\.hourly\?\.time\)\], wv = C\.wind_wave_height;/.test(src)
     && !/show\(M\.hourly\?\.swell_wave_height\?\.\[0\]/.test(src),
     '«Mar de fondo 1,1 m» arriba y «0,9 m» en la pestaña Mar a la misma hora');

  /* 3. El color de la racha en 10 días es el de la racha, no el del día. */
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('en 10 días la chapa «Racha» se colorea por SU listón, no por el semáforo del día (36 km/h salía en rojo por la tormenta del jueves)',
     /<div class="dcard__g" data-s="\$\{nRacha\}">Racha /.test(src)
     && /\.dcard__g\[data-s=no\]\{/.test(css) && /\.dcard__g\[data-s=warn\]\{/.test(css)
     && !/\.dcard\[data-s=no\] \.dcard__g\{/.test(css),
     'el rojo en una cifra que no cruza nada enseña a no creerse el rojo');

  /* 4. La línea de agua de la tarjeta dice quién lo ve cuando no es tu modelo. */
  const H0b = h => { const d = new Date(); d.setHours(h, 0, 0, 0); return d.getTime(); };
  const guardaLT = S.lluviaTorres, guardaMD = globalThis.modeloDato;
  const hoyH = new Date().getHours();
  S.lluviaTorres = [{ k: 've-icon', llueve: true, ini: H0b(hoyH + 1), fin: H0b(hoyH + 1), pico: 0.1, hPico: H0b(hoyH + 1),
                      quien: 'ICON', horasAgua: [], nHoras: 1, sueltas: false, soloSirimiri: true, discrepan: false }];
  globalThis.modeloDato = () => ({ name: 'AROME HD' });
  const conIcon = soloTexto(lineaAguaTorre('ve-icon'));
  globalThis.modeloDato = () => ({ name: 'ICON' });
  const conElMio = soloTexto(lineaAguaTorre('ve-icon'));
  S.lluviaTorres = guardaLT; globalThis.modeloDato = guardaMD;
  ok('«Sirimiri de 23:00 a 00:00» dice «lo ve ICON» cuando el que lo ve no es tu modelo, y se calla si es el tuyo',
     /Sirimiri/.test(conIcon) && /lo ve ICON/.test(conIcon) && !/lo ve/.test(conElMio),
     JSON.stringify({ conIcon, conElMio }));

  /* ── LO QUE SACARON LOS AGENTES DEL 25-09 (misma familia que los seis) ──
   Tres agentes de solo lectura, en paralelo, la misma mañana: más sitios
   con la forma «leer la hora equivocada» y «una parte de la pantalla
   desmiente a la de al lado». Cada uno de estos guarda uno de ellos; la
   prueba de verdad (arrancando la app) está en `pantallas.cjs`, que se
   vio en rojo con cada uno deshecho sobre una copia. */
{
  const C = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('la chapa «Racha» de la tarjeta de la hora lleva SU color (nivelRacha), no el semáforo de la hora',
     /<div class="hcard__g" data-s="\$\{nivelRacha\(h\.gust\)\}">Racha/.test(src)
     && /\.hcard__g\[data-s=no\]\{/.test(C) && !/\.hcard\[data-s=no\] \.hcard__g/.test(C),
     'con sirimiri salía «Racha 22 km/h» en rojo');
  ok('y la del día usa la MISMA decisión (una función, dos pantallas)',
     /const nRacha = nivelRacha\(racha\);/.test(src) && /^function nivelRacha\(v\) \{/m.test(src));
  ok('la casilla Tormenta de Ahora no dice «Tapa que aguanta» cuando salta la regla',
     /const tapaTxt = tormenta\s*\n?\s*\? `tapa \$\{Math\.round\(c\.cin\)\}/.test(src));
  ok('y la cifra de la tapa en rojo de Mis estaciones tampoco',
     /\(tapaAbierta\s*\n?[^\n]*\n?\s*\? `por debajo de \$\{TAPA_ROMPE\}: con este CAPE rompe` : textoTapa\(h\.cin, h\)\)/.test(src));
  ok('«Próxima lluvia» distingue «ninguno la ve» de «no he podido preguntar» (sabido:false)',
     /function lluviaQueVieneYNoVesTu\(\) \{[\s\S]{0,700}?if \(!H\?\.time\) return \{ sabido: false \};/.test(src)
     && /if \(otra && otra\.sabido === false\)/.test(src),
     'sin comparativa afirmaba en verde lo que nadie había mirado');
  ok('«No hay estaciones…» nombra las dos redes y dice si Euskalmet no contestó',
     /No hay estaciones de Euskalmet a menos de 25 km ni de AEMET a menos de 60 km de/.test(src)
     && /No he podido preguntar a Euskalmet<\/b> \(\$\{esc\(rEus\._fallo\)\}\), y AEMET no tiene ninguna estación/.test(src));
  ok('la nota del parte lee del reparto quién no publica la tapa, no lo tiene escrito',
     /\$\{esc\(listar\(MODELOS_TORMENTA\.filter\(m => !CON_TAPA\.includes\(m\.om\)\)\.map\(m => m\.nom\)\)\)\} no la publican\./.test(src)
     && !/ECMWF y AROME HD no la publican/.test(src));
  const GN = fs.readFileSync(path.join(__dirname, 'sin-modelos-a-mano.cjs'), 'utf8');
  ok('y el guardia de nombres a mano ya mira dentro de las plantillas de varias líneas',
     /let dentro = false;/.test(GN) && /const enPlantilla = dentro \|\| ticks > 0;/.test(GN) && /if \(!enPlantilla && !\/\['"\]\/\.test\(l\)\) return;/.test(GN),
     'se saltaba toda línea sin comillas, y la nota del parte era una');
  ok('«Sube a X m» lleva su hora (aLasHora del pico)',
     /Sube a <b>\$\{pico\.toFixed\(1\)\.replace\('\.', ','\)\} m<\/b> \$\{aLasHora\(picoC\.t\)\}/.test(src));
  ok('la mar de viento es UNA frase para Ahora y Mar (fraseMarDeViento), sin listones distintos',
     (src.match(/fraseMarDeViento\(C\.wind_wave_height, C\.swell_wave_height\)/g) || []).length === 2
     && !/wind_wave_height < 0\.3/.test(src));
  ok('la pestaña Mar lee la mar de fondo en la hora en curso, no en la medianoche',
     /M\.hourly\.swell_wave_height\?\.\[iHoraMar\(M\.hourly\.time\)\], unidadMar\(M, 'swell_wave_height'\)/.test(src)
     && !/swell_wave_height\?\.\[0\]/.test(src));
  ok('la gráfica de oleaje de 48 h empieza AHORA (i0Ola), no a medianoche',
     /const i0Ola = iHoraMar\(M\.hourly\.time\);/.test(src) && /wave_height\?\.slice\(i0Ola, i0Ola \+ 48\)/.test(src));
  ok('«No se despeja» dice la ventana que se ha mirado, no «las próximas 24 h»',
     /No se despeja \$\{\(v => v\.salto === 0 \? 'en lo que queda de hoy'/.test(src) && !/No se despeja en las próximas 24 h/.test(src));
  ok('la pestaña encendida del parte es la del día que se enseña (ventanaParte().salto)',
     /class="pdia\$\{d\.i === ventanaParte\(\)\.salto \? ' is-on' : ''\}"/.test(src));
  ok('completar() pega lo prestado POR HORA (alinear), no por posición',
     /const alinear = col => \{/.test(src) && /f\.hourly\[k\] = alinear\(d\.hourly\[k\]\);/.test(src)
     && /f\.hourly\.weather_code_lluvia = alinear\(d\.hourly\.weather_code\);/.test(src));
  ok('el dibujo del día lleva el día/noche de sus horas',
     /const d = has\(R\.dia\) \? R\.dia : \(deNoche \? 0 : 1\);/.test(src));
  ok('cargarTorres y completarTorres piden 3 días atrás SIN past_hours (medido: past_hours anulaba past_days)',
     /forecast_days: 2, past_days: 3, models: model\(\)\.om,/.test(src) && /forecast_days: 2, past_days: 3, models: om,/.test(src)
     && !/past_days: 3, past_hours: 1/.test(src));
  ok('la pista dice las horas que ha mirado de verdad (mirados)',
     /nieveHoy, mirados,/.test(src) && /const mir = has\(P\.mirados\) \? Math\.min\(72, P\.mirados\) : 0;/.test(src));
  ok('loadAll y completar piden 24 h atrás, para que la mínima del día tenga hora',
     (src.match(/forecast_days: 10, past_hours: 24, models: /g) || []).length === 3 && !/forecast_days: 10, past_hours: 1, models: /.test(src));
  ok('la cabecera de ESTACIÓN dice si la otra red no contestó, aunque haya aparato de la que sí (visto en producción el 25-09 a las 10:50)',
     /S\.medidoSinEuskalmet && M\.fuente !== 'Euskalmet' \? ' · <b>Euskalmet no contestó<\/b>' : ''/.test(src)
     && /S\.medidoSinAemet && M\.fuente === 'Euskalmet' \? ' · <b>AEMET no contestó<\/b>' : ''/.test(src));
  ok('y el motivo es el del servidor, no «error 200»',
     /no he podido preguntar a Euskalmet\$\{d\?\.reason \? ` \(\$\{String\(d\.reason\)\.slice\(0, 80\)\}\)`/.test(src)
     && /r\?\.status && r\.status !== 200 \? ` \(error \$\{r\.status\}\)` : ''/.test(src));
  ok('el marcador dice «en N comparaciones», no «N veces» a secas',
     /error medio \$\{txt\(m\.error\)\} en \$\{m\.n\} comparaciones\$\{/.test(src));
}

/* ── LAS PANTALLAS, A LA HORA A LA QUE ÉL LAS MIRA (25-09-2026) ───────
   Suyo, con diecisiete pantallazos de las 07:13 y seis fallos de
   pantalla dentro: «¿pero todavía seguimos teniendo fallos?» · «que no
   vuelva a pasar, porque me suena que no es la primera vez». Los seis
   tenían la misma forma y ninguna de las 1.276 pruebas miraba esas
   pantallas a esa hora. `pantallas.cjs` las arranca enteras a cuatro
   horas del día con datos trampa distintos en cada hora. Esto fija que
   el guardia SIGA ENGANCHADO (el 27-08 `fueraDeRango` estuvo tres días
   declarado y sin llamar) y que su trampa tenga dientes. */
{
  const R = fs.readFileSync(path.join(__dirname, 'revisar.sh'), 'utf8');
  const G = fs.readFileSync(path.join(__dirname, 'pantallas.cjs'), 'utf8');
  const V = fs.readFileSync(path.join(__dirname, '.vercelignore'), 'utf8');
  ok('revisar.sh arranca pantallas.cjs y deploy.sh no publica si una pantalla dice lo que no toca',
     /^node pantallas\.cjs \|\| exit 1$/m.test(R),
     'un guardia escrito no es un guardia puesto');
  ok('el guardia de pantallas corre a las 02, 07, 13, 20 y 23 h, no solo a la hora de quien publica',
     /'2,7,13,20,23'/.test(G));
  ok('y su trampa empieza la serie donde Open-Meteo: past_hours manda sobre past_days (medido el 25-09)',
     /if \(pastH !== null\) \{ inicio = new Date\(horaEnCurso\.getTime\(\) - pastH \* 3600e3\)/.test(G)
     && /else \{ inicio = new Date\(hoy0\.getTime\(\) - pastD \* 86400e3\)/.test(G));
  ok('y ejercita lo que dos agentes sacaron el 25-09: chapa de Horas, tormenta sin «aguanta», próxima lluvia sin comparativa, mar de viento, oleaje desde ahora, pegado por hora, 72 h de pista, hora de la mínima, pestaña del parte y marcador',
     /hcard__g/.test(G) && /HORA_TORMENTA/.test(G) && /HORA_SIN_COMPARATIVA/.test(G) && /fraseViento/.test(G)
     && /esperadoPico48/.test(G) && /HORA_TAPA_ICON/.test(G) && /pista\.mirados >= 72/.test(G)
     && /Mín 14°\\s\*a las 05:00/.test(G) && /parteDias \.pdia\.is-on/.test(G) && /en 20 comparaciones/.test(G));
  ok('su trampa cambia con la hora y se planta si no muerde (mar de fondo, pico de ola, is_day de las 08:00)',
     /TRAMPA SIN DIENTES: el pico de las 24 primeras horas/.test(G)
     && /TRAMPA SIN DIENTES: la mar de fondo de medianoche/.test(G)
     && /TRAMPA SIN DIENTES: el is_day de las 08:00 y las 20:00/.test(G));
  ok('la trampa pone el orto a las 08:01 y el ocaso a las 20:10, que es lo que pintó la luna del 25-09',
     /const ORTO = 8 \* 60 \+ 1, OCASO = 20 \* 60 \+ 10/.test(G));
  ok('pantallas.cjs no se sube al sitio',
     /^pantallas\.cjs$/m.test(V));
}

/* 5 y 6. Dos textos. */
  ok('la lista de anemómetros dice «de AEMET y Euskalmet», que es lo que lleva dentro',
     (() => { const ix = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'); return /Anemómetros de AEMET y Euskalmet cerca de tu emplazamiento/.test(ix) && !/Anemómetros de AEMET cerca/.test(ix); })());
  ok('el marcador dice «N veces más de 10 km/h corto», no «N por debajo de 10 km/h»',
     /\$\{m\.cortas\}<\/b> veces más de \$\{txt\(G\.corto \?\? 10\)\} corto/.test(src) && !/por debajo de \$\{txt\(G\.corto \?\? 10\)\}/.test(src));
}

grupo('ESTO NO SE TOCA: las reglas ya decididas siguen guardadas');
{
  const md = fs.readFileSync(path.join(__dirname, 'NO-SE-TOCA.md'), 'utf8');
  const filas = md.split('\n')
    .filter(l => l.trim().startsWith('|') && l.includes('`'))
    .map(l => { const m = l.match(/`([^`]+)`[^`]*\|\s*$/); return m ? m[1] : null; })
    .filter(Boolean);

  ok('la lista de reglas intocables tiene contenido',
     filas.length >= 15, `${filas.length} reglas listadas`);

  /* Algunas reglas las guarda `paridad.cjs`, que corre aparte en el
     candado. Se acepta que el nombre esté allí, pero se comprueba que
     exista de verdad — no vale apuntarla y que no la guarde nadie. */
  const otrosGuardias = ['paridad.cjs', 'pantallas.cjs', 'pruebas-servidor.cjs', 'abrir.cjs',
                         'prueba-almacen-caido.mjs', 'prueba-fuente-caida.mjs',
                         // Los de la revisión 04-09 (05-09-2026): cada uno con su fichero.
                         'prueba-huecos.cjs', 'prueba-sw.cjs', 'prueba-satelite.mjs', 'prueba-cabeceras.mjs',
                         'prueba-webcams.mjs', 'prueba-mapas.mjs', 'prueba-candado.cjs', 'prueba-motor.mjs', 'prueba-mal-tiempo.mjs']
    .map(f => fs.readFileSync(path.join(__dirname, f), 'utf8'));
  const enOtroGuardia = n => otrosGuardias.some(t => t.includes(n));
  const faltan = [...new Set(filas)]
    .filter(n => !nombresEjecutados.has(n) && !enOtroGuardia(n));
  ok('todas las reglas de NO-SE-TOCA.md siguen teniendo su prueba viva',
     faltan.length === 0,
     faltan.length ? `SIN PRUEBA: ${faltan.join(' · ')}` : '');
}


/* ── MAR EN EL MAPA (19-09-2026, portátil) ───────────────────────────
   Suyo, el sábado de las regatas de Bermeo: «en mapas no tengo mar, ¿lo
   pones? sería lo suyo ponerlo», con las capas Mar de Ventusky en
   pantalla. Las capas marinas se habían retirado el 21-08 por pintar
   tierra; vuelven con su propia lista de modelos de olas, probadas en
   pantalla (tierra sin pintar, clic con valor y rumbo). */
{
  const M = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
  const A = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  ok('el mapa tiene grupo Mar: ola, periodo, fondo, periodo del fondo y mar de viento, en metros y segundos',
     /id:'ola', g:'Mar', name:'Altura de ola', v:'wave_height', unit:'m', escala:'ola', modelos: MODELOS_OLAS, direccion:'wave_direction'/.test(M)
     && /id:'periodo', g:'Mar', name:'Periodo', v:'wave_period', unit:'s', escala:'periodo', modelos: MODELOS_OLAS, direccion:'wave_direction'/.test(M)
     && /id:'fondo', g:'Mar', name:'Mar de fondo', v:'swell_wave_height', unit:'m', escala:'ola', modelos: MODELOS_OLAS, direccion:'swell_wave_direction'/.test(M)
     && /id:'periodofondo', g:'Mar', name:'Periodo del fondo', v:'swell_wave_period', unit:'s', escala:'periodo', modelos: MODELOS_OLAS/.test(M)
     && /id:'marviento', g:'Mar', name:'Mar de viento', v:'wind_wave_height', unit:'m', escala:'ola', modelos: MODELOS_OLAS, direccion:'wind_wave_direction'/.test(M));
  ok('los modelos de olas están en TMODELS con mar:true, NO salen en la fila de botones y el MFWAM que tumba el mapa está fuera',
     /id:'dwd_ewam', mar:true, name:/.test(M) && /id:'ecmwf_wam025', mar:true, name:/.test(M) && /id:'ncep_gfswave016', mar:true, name:/.test(M)
     && !/id:'meteofrance_wave'/.test(M)
     && /const MODELOS_OLAS = \['dwd_ewam', 'ecmwf_wam025', 'ncep_gfswave016'\];/.test(M)
     && /!!l\.sat \|\| !!l\.modelos/.test(M)
     && (M.match(/TMODELS\.filter\(m => !m\.mar\)\.map\(m => \{/g) || []).length === 2
     && !/TMODELS\.map\(m => \{/.test(M),
     'un modelo de olas no publica ráfagas: elegirlo a mano dejaría el mapa en blanco');
  ok('una capa de mar busca modelo SOLO en su lista y el cartel dice con qué modelo de olas se pinta',
     /if \(L_\.modelos\) \{[\s\S]{0,900}?for \(const alt of L_\.modelos\) \{\s*let m = this\.metaCache\[alt\];\s*if \(!m\) \{ try \{ m = await this\.metaDe\(alt\); \} catch \{ continue; \} \}\s*if \(m\?\.variables\?\.includes\(L_\.v\)\) return \{ modelo: alt, meta: m, sustituido: false, mar: true \};\s*\}\s*return null;\s*\}/.test(M)
     && /this\.avisoSustitucion\(R\.sustituido \|\| R\.mar \? R\.modelo : null, R\.porZoom, !!R\.mar\);/.test(M)
     && /avisoSustitucion\(modeloAlt, porZoom = false, mar = false\)/.test(M)
     && /no publican olas; en tierra no hay dato/.test(M)
     && /Promise\.allSettled\(\[\.\.\.this\.alternativas\(\), \.\.\.MODELOS_OLAS\]\.map/.test(M));
  ok('las escalas de ola (m) y periodo (s) existen, van fundidas pero en lineal (la monótona hacía polígonos en la costa), y tienen rango de cordura',
     /const ola = \{\s*scale: \{ type:'breakpoint', unit:'m', breakpoints: om_/.test(M)
     && /const periodo = \{\s*scale: \{ type:'breakpoint', unit:'s', breakpoints: pm_/.test(M)
     && /nubes, sombraLluvia,\s*ola, periodo,\s*\};/.test(M)
     && /const ESCALAS_SUAVES = new Set\(\[[^\]]*'ola', 'periodo',[^\]]*\]\);/.test(M)
     && !/const INTERPOLACION_SUAVE = new Set\(\[[^\]]*'ola'/.test(M)
     && /ola:\s+\[0, 30, 'm'\]/.test(M) && /periodo: \[0, 30, 's'\]/.test(M));
  /* 21-09-2026: la lectura sigue escrita, pero ya no detrás de un interruptor
     sino detrás de la REGLA: `puedeLeerse()` rechaza las direcciones porque
     la librería devuelve la variable hermana. Ver el grupo «Lo que esta
     librería NO sabe dar». */
  ok('el clic en una capa de mar tiene escrita la lectura de dónde viene la ola (mismo modelo y hora, sin inventar si falta), hoy cerrada por la regla',
     /if \(puedeLeerse\(L_\.direccion\) && R\.meta\?\.variables\?\.includes\(L_\.direccion\)\)/.test(M)
     && /deDonde = ` · del \$\{r \? esc\(r\) \+ ' ' : ''\}\(\$\{Math\.round\(d\)\}°\)`;/.test(M)
     && /if \(!!L_\.modelos !== !!this\.usando\.mar\) return;/.test(M)
     && /this\.model !== 'ecmwf_ifs' \|\| !this\.usando \|\| this\.usando\.mar\) return;/.test(M));
  ok('la pestaña Mar dice en qué celda lee el modelo de olas y a cuántos km queda (Bermeo: 13 km al norte)',
     /^function acimut\(a, b\) \{/m.test(A)
     && /^function notaCeldaMar\(M\) \{/m.test(A)
     && /Leído en la celda del modelo de olas: mar abierto a <b>/.test(A)
     && /notaUnidadesMar\(M\) \+ notaCeldaMar\(M\);/.test(A)
     && (A.match(/ \+ notaCeldaMar\(M\);/g) || []).length === 1,
     'solo en la pestaña Mar: la tarjeta de Ahora no la lleva');
}


/* ── LA BOYA DE EUSKOOS EN LA PESTAÑA MAR (19-09-2026, portátil) ───────
   Suyo: «hay 1 boya en el golfo de Bizkaia que mide todo eso, del
   Gobierno Vasco; igual buscas acceso». ERDDAP público de EuskOOS, sin
   clave, CORS abierto, leído desde el navegador. */
{
  const A = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const H = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok('la pestaña Mar tiene la línea «Medido de verdad» de la boya de EuskOOS, con posiciones de su propio geojson',
     /const BOYAS_EUSKOOS = \[/.test(A)
     && /id: 'boyaDonostia_NRT_hourly_data', nombre: 'Boya de Donostia', lat: 43\.563, lon: -2\.0225/.test(A)
     && /id: 'mutriku_50_wave', nombre: 'Boya de Mutriku', lat: 43\.3161, lon: -2\.3677/.test(A)
     && /<p class="note note--boya" id="marBoya" hidden><\/p>/.test(H)
     && /^async function pintarBoyaMar\(p\) \{/m.test(A)
     && (A.match(/pintarBoyaMar\(S\.place\);/g) || []).length === 1
     && /if \(\$\('#marBoya'\)\) \{ \$\('#marBoya'\)\.hidden = true;/.test(A),
     'la más cercana que conteste, hasta 80 km; tierra adentro se apaga');
  ok('la boya se pide solo de las últimas 6 h (nunca un dato viejo como si fuera de ahora), sin clave y sin pasar por Vercel',
     /time>=now-6hours&orderByMax\("time"\)/.test(A)
     && /https:\/\/www\.euskoos\.eus\/erddap\/tabledap\//.test(A)
     && /if \(!r\.ok\) return null;/.test(A)
     && !/euskoos/i.test(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'))
     && !fs.existsSync(path.join(__dirname, 'api', 'boya.mjs')));
  ok('y no inventa rumbo, máxima ni agua: cada trozo sale solo si la boya lo trae',
     /has\(r\.max\) \? ` · máxima/.test(A) && /has\(r\.dir\) && rumboLargo\(r\.dir\) \? ` · del/.test(A)
     && /has\(r\.agua\) \? ` · agua/.test(A)
     && /Medido de verdad · <b>\$\{esc\(r\.nombre\)\}<\/b> \(EuskOOS, /.test(A));
}


/* ── MIS ESTACIONES A PIE DE CASETA (20-09-2026, portátil) ──────────────
   Suyo, con catorce pantallazos delante y la prueba de fuego al día
   siguiente: «eso de trabajo a 40 metros fuera, solo a pie de caseta,
   resto sobra» · «de torre no quiero ver nada» · «tienen que cuadrar los
   datos». Y los fallos que vio o que salieron al repasar: la frase «el
   de ECMWF, que es el que se enseña arriba» con otro número arriba; el
   30/31 de la misma hora sin decir de quién era cada uno; «los 5 de
   acuerdo, 11 km/h de diferencia»; humedad 101 %; veredicto con una
   lectura de hace 65 min. */
{
  const A = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  ok('las horas de cada emplazamiento se calculan a 10 m (ALTURA_CASETA), no a la altura de trabajo guardada',
     /const ALTURA_CASETA = 10;/.test(A)
     && /horas: buildHours\(fc, ALTURA_CASETA, p\)/.test(A)
     && /horas: buildHours\(copia\.data\.fc, ALTURA_CASETA, p\)/.test(A)
     && !/buildHours\(fc, cfg\.alt, p\)/.test(A) && !/cfgDe\(place\)\.alt, place\)/.test(A));
  ok('la cabecera de la tarjeta lleva UNA racha y UN viento, los de 10 m, sin «(est.)» ni «de altura»',
     /'racha a 10 m · a pie de caseta',\s*has\(h\.gust10\) && h\.gust10 >= listonRafaga\(\)\.no \? 'rojo' : rachaAltaP, 'decide'/.test(A)
     && /\`viento a 10 m\$\{has\(h\.dir\) \? ' · del ' \+ rumboLargo\(h\.dir\) : ''\}\`/.test(A)
     && !/'racha a 10 m de altura'/.test(A)
     && !/racha a \$\{h\.h\} m\$\{h\.gustEst \? ' \(est\.\)' : ''\}\`, rachaAlta/.test(A));
  ok('el pie de la tarjeta dice «A pie de caseta · a 10 m · cota», y Ajustar solo pide la cota',
     /A pie de caseta · a \$\{ALTURA_CASETA\} m/.test(A)
     && !/trabajo a <b>\$\{t\.cfg\?\.alt/.test(A)
     && !/data-c="alt"/.test(A) && !/data-c="tipo"/.test(A)
     && /const c = \{ tipo: previo\.tipo \|\| 'torre', alt: previo\.alt \?\? S\.hgt, cota: num\('cota'\) \};/.test(A));
  ok('con una lectura de más de 60 min no hay veredicto: se dice de cuándo es y se espera',
     /const lecturaVieja = has\(minM\) && minM > 60;/.test(A)
     && /sin veredicto: la lectura de\s*\$\{esc\(M\.nombre\)\} es de \$\{esc\(hace\)\}/.test(A));
  ok('la humedad medida no pasa de 100 y se dice lo que marca el aparato (Matxitxako 101 %)',
     /^function hrMedida\(v\) \{/m.test(A)
     && /has\(M\?\.humedad\) \? hrMedida\(M\.humedad\) : ''/.test(A)
     && /const medido = \(c\.k === 'humedad' && has\(x\[c\.k\]\)\) \? Math\.min\(100, x\[c\.k\]\) : x\[c\.k\];/.test(A)
     && /HR \$\{Math\.min\(100, Math\.round\(e\.humedad\)\)\} %/.test(A));
  ok('«de acuerdo» solo hasta 5 km/h; por debajo de 12 se dice la horquilla',
     /dif <= 5 \? \{ c: 'ok',  t: \`los \$\{filas\.length\} de acuerdo: de/.test(A)
     && /dif < 12 \? \{ c: 'ok',  t: \`de \$\{wtxt\(mn\.v\)\} a \$\{wtxt\(mx\.v, true\)\} entre los/.test(A)
     && !/de acuerdo, \$\{difVista/.test(A));
  ok('la racha máxima del parte dice quién la da, y la línea de horas de qué modelo son las cifras',
     /return \{ k: key\(p\), racha: mx, hora, quien \};/.test(A)
     && /la más alta de los \$\{MODELOS_TORMENTA\.length\}, la da \$\{esc\(R\.quien\)\}/.test(A)
     && /cifras de \$\{esc\(model\(\)\.name\)\} a \$\{ALTURA_CASETA\} m/.test(A));
}


/* ── SU ORDEN: LLUVIA, VIENTO, CAPE, NIEVE, NUBOSIDAD (20-09-2026) ──── */
{
  const A = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  ok('la línea de horas va lluvia · racha · CAPE · nieve (solo si la hay) · temperatura',
     /cif\(\`\$\{esc\(mmTxt\(x\.prec\)\)\} mm\`, nivelLluvia\(x\.prec\), 'agua'\)\s*\+ \` · \$\{cif\(\`racha /.test(A)
     && /has\(x\.nieve\) && x\.nieve > 0\s*\? \` · \$\{cif\(\`nieve /.test(A));
  ok('la tabla contra el aparato va lluvia, racha, viento, CAPE, cielo, temperatura, humedad',
     /const cuerpo =\s*fila\('Lluvia',[\s\S]*?\+ fila\('Racha',[\s\S]*?\+ fila\('Viento',[\s\S]*?\+ fila\('CAPE y tapa',[\s\S]*?\+ fila\('Cielo',[\s\S]*?\+ fila\('Temperatura',[\s\S]*?\+ fila\('Humedad',/.test(A));
  ok('y en lo que mide el aparato, la lluvia va la primera',
     /const CUALES = \[[\s\S]{0,900}?\{ k: 'lluvia',[\s\S]*?\{ k: 'racha',/.test(A));
  ok('la nieve de la cabecera es el centímetro por hora del modelo, tal cual, y las nubes el % total con lo que se ve',
     /'nieve cm\/h' \+ \(hielo \? ' · isocero a la altura del sitio' : ''\)/.test(A)
     && /num\(has\(h\.cloud\) \? Math\.round\(h\.cloud\) \+ ' %' : '—',/.test(A));
}


/* ── AHORA, DE UNA PASADA (20-09-2026) ────────────────────────────────
   Suyo: «fíjate todo lo que tengo que leer para saber en esa estación qué
   me voy a encontrar… mucho lío» · «quiero info la justa para saber de
   una pasada qué tengo en cada sitio» · «sin tanto recuadro» ·
   «simplifícalo» · «aprovecha el espacio, bonito y claro, en color». */
{
  const A = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const H = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const C = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('Ahora lleva cinco casillas en su orden: lluvia, ráfaga, viento (con dirección), riesgo eléctrico, sensación; las estimadas solo si la altura no es 10',
     /\$\('#kpis'\)\.innerHTML = \[kLluvia, kRafaga, kViento, kRiesgo, kSensacion,\s*\.\.\.\(S\.hgt === 10 \? \[\] : kAltura\)\]\.join\(''\);/.test(A)
     && !/kpi\('Dirección',/.test(A)
     && /del \$\{rumboLargo\(c\.dir\)\} \(\$\{c\.dir\.toFixed\(0\)\}°\) · De donde viene el viento a/.test(A));
  ok('la comparativa de modelos se pliega: la frase de color queda a la vista y las barras detrás de «Ver por modelo»',
     /^function plegarComparativa\(el\) \{/m.test(A)
     && /\$\{tablaBochorno\(H, i, hora\)\}`;\n  plegarComparativa\(el\);\n\}/.test(A)
     && /s\.textContent = \`Ver por modelo · \$\{n\.textContent\.trim\(\)\}\`;/.test(A)
     && /\.cmp__det>summary\{cursor:pointer/.test(C));
  ok('«Antes de salir» va a todo el ancho y con color por línea; la cota queda debajo de las cifras',
     !/max-width:62ch/.test(C)
     && /\.salir__l li\[data-s="no"\]\{border-color:var\(--no\)/.test(C)
     && H.indexOf('id="kpis"') < H.indexOf('id="elev"'));
}


/* ── LO QUE ÉL QUITA, QUITADO SE QUEDA (20-09-2026) ──────────────────
   Tres sitios de prueba entraron en su lista del servidor desde un
   navegador de pruebas (culpa del portátil) y, quitados con «mandar»,
   podían volver por el «juntar» de cualquier aparato que los hubiera
   adoptado. Ahora el servidor apunta lo borrado y no lo readmite. */
{
  const T = fs.readFileSync(path.join(__dirname, 'api', 'torres.mjs'), 'utf8');
  ok('api/torres.mjs guarda una lista de borrados y el «juntar» no readmite lo que él quitó',
     /const CAJON_BORRADOS = 'avisos\/torres-borrados\.json';/.test(T)
     && /for \(const p of previas\) if \(!quedan\.has\(clave\(p\)\)\) borrados\.add\(clave\(p\)\);/.test(T)
     && /if \(!vistas\.has\(clave\(p\)\) && !borrados\.has\(clave\(p\)\)\) vistas\.set\(clave\(p\), p\);/.test(T)
     && /for \(const k of quedan\) borrados\.delete\(k\);/.test(T)
     && /if \(esClave\(k\) && !quedan\.has\(k\)\) borrados\.add\(k\);/.test(T),
     'un arranque automático no borra nada; solo se apunta lo que ÉL quitó, y eso no vuelve solo');
}


/* ── HORAS EN COLUMNAS Y SIN PORTADA DEL PUEBLO EN MIS ESTACIONES (20-09) ── */
{
  const A = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const C = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok('la línea de horas de la tarjeta va en columnas (una por tramo) y las notas debajo',
     /<div class="tor__lleg__t">\$\{tramos\.map\(\(r, j\) => \`<div class="tor__lleg__c/.test(A)
     && /<div class="tor__lleg__n">/.test(A)
     && /\.tor__lleg__t\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(210px,1fr\)\)/.test(C),
     'suyo: «aquí todo está agrupado con todo el sitio que hay»');
  ok('en Mis estaciones la portada es la de SU estación: la fijada con «Portada» o la primera de la lista, con los mismos datos que Ahora',
     /^function estacionDePortada\(\) \{/m.test(A) && /^async function pintarPortadaEstacion\(/m.test(A)
     && /LS\.get\('portadaEstacion', null\)/.test(A) && /LS\.set\('portadaEstacion', pb\.dataset\.portada\);/.test(A)
     && /D = await loadAll\(est\);/.test(A) && /D\.hours = buildHours\(D\.fc, ALTURA_CASETA, est\);/.test(A)
     && /finally \{ S\.place = antes\.place; S\.data = antes\.data; S\._pintandoEstacion = false; \}/.test(A)
     && /if \(S\.view === 'torres' && S\.portadaEstacion && !S\._pintandoEstacion\) \{ pintarPortadaEstacion\(\); return; \}/.test(A)
     && /data-portada="\$\{esc\(key\(t\.place\)\)\}"/.test(A)
     && /body\[data-view="torres"\] \.cover-fijo\{display:block\}/.test(C)
     && !/body\[data-view="torres"\] \.cover-fijo\{display:none\}/.test(C),
     'suyo: «que salga BI BERMEO, o el primero de la lista, o el que meta yo a mano»');
  ok('y al salir de Mis estaciones vuelve la portada del sitio buscado; sin datos de la estación, se esconde',
     /if \(v !== 'torres' && S\.portadaEstacion && S\.data\) seguro\('ahora', renderNow\);/.test(A)
     && /fijo\?\.classList\.add\('sin-estacion'\);/.test(A)
     && /\.cover-fijo\.sin-estacion\{display:none!important\}/.test(C)
     && /const mostrada = \(S\.view === 'torres' && S\.portadaEstacion\) \? S\.portadaEstacion\.est : S\.place;/.test(A));
}



/* ═══════════════════════════════════════════════════════════════════
   EL RECUENTO VA EL ÚLTIMO. SIEMPRE.
   ───────────────────────────────────────────────────────────────────
   Cazado el 05-09-2026 a la 01:00, con la revisión de la noche delante.
   El total no subía de 863 aunque llevaba el día metiendo guardias, y
   la razón era esta: el `console.log` del recuento y el `process.exit(1)`
   estaban en la línea 6371, y **todo lo que se añadió detrás desde el
   30-08** —la racha «tampoco va sola», los iconos, las restas, el
   «mañana» ambiguo, los botones huérfanos, el GPS, el candado…— se
   ejecutaba, imprimía su ✓ o su ✗, y **no podía vetar una publicación**.
   Una guardia que no puede parar nada es un adorno. Y él llevaba días
   diciendo «lo reparas y baila al día siguiente».

   Por eso esto es lo último del fichero, y `revisar.sh` comprueba que
   siga siéndolo: si alguien añade una prueba detrás, la publicación no
   pasa.
   ═══════════════════════════════════════════════════════════════════ */
console.log(`\n  ${pasadas} bien, ${fallos} mal\n`);
if (fallos) {
  console.log('  ✗ NO SE PUBLICA. Alguna de estas ya falló una vez de verdad.\n');
  process.exit(1);
}
