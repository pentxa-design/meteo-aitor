/* ═══════════════════════════════════════════════════════════════════
   PRUEBAS DE LOS HUECOS QUE MENTÍAN (revisión del 04-09-2026)

   Tres cosas de la misma clase —un hueco que se lee como «aquí no pasa
   nada»— y una cuarta de dependencia de fuera:

   1. En el perfil de fábrica (hierro) una ráfaga, una lluvia o un CAPE a
      null no generaban motivo y la hora salía en VERDE con «Nada llega a
      tus listones». Aquí se ejecuta `assess()` DE VERDAD, sacada del
      app.js que se publica, con horas con hueco.
   2. `completarLargo()` apuntaba el fallo del relleno en `rellenoFallo` y
      nadie lo leía. Ahora se apunta desde qué hora y `notaRellenoFallo()`
      lo pinta en «Ahora».
   3. Leaflet venía de unpkg.com: sin cobertura el radar no arrancaba.
      Ahora vive en vendor/leaflet/ (1.9.4 oficial de npm).
   4. El catálogo del radar iba directo a api.rainviewer.com desde el
      navegador, saltándose `/om`. Ahora pasa por `via('rain')`.

   Se corre solo: `node prueba-huecos.cjs`. Cada prueba se vio en ROJO
   con el app.js anterior antes de darla por buena.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `  — ${pista}` : ''}`); }
};

const raiz = __dirname;
const src = fs.readFileSync(path.join(raiz, 'app.js'), 'utf8');

/* Igual que en pruebas.js: se prueba el fichero que se publica, no una
   copia. Lo declarado con `function` sale del eval; lo de `const` no, y
   por eso hay dos ayudantes. */
function sacar(firma, hasta = '\n}') {
  const i = src.indexOf(firma);
  if (i < 0) throw new Error(`no encuentro «${firma}» en app.js`);
  const j = src.indexOf(hasta, i) + hasta.length;
  return src.slice(i, j);
}
function sacarConst(nombre) {
  const i = src.indexOf(`const ${nombre}`);
  if (i < 0) throw new Error(`no encuentro «const ${nombre}» en app.js`);
  const limpio = src
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
    .replace(/^([^'"\n]*?)\/\/.*$/gm, (l, pre) => pre + ' '.repeat(l.length - pre.length));
  const j = limpio.indexOf(';', i);
  return src.slice(i, j + 1).replace(new RegExp(`^const\\s+${nombre}\\s*=`), `globalThis.${nombre} =`);
}
const tiene = firma => src.includes(firma);

/* ── Lo mínimo para que assess() corra fuera del navegador ──────────── */
globalThis.has = v => v !== null && v !== undefined && !Number.isNaN(v);
globalThis.esc = v => String(v);
globalThis.key = p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
/* Los listones salen de app.js, su dueño: copiarlos aquí a mano deja el
   banco midiendo con el número viejo el día que se recalibren (21-09). */
eval(sacarConst('CAPE_COMBINACION'));
eval(sacarConst('TAPA_ROMPE'));
globalThis.RANK = { go: 0, warn: 1, no: 2, nd: 3 };
globalThis.worst = (a, b) => (RANK[b] > RANK[a] ? b : a);
globalThis.wtxt = v => `${v.toFixed(0)} km/h`;
globalThis.wRed = v => (has(v) ? Math.round(v) : null);
globalThis.wmoText = c => ({ 95: 'tormenta', 63: 'lluvia', 51: 'llovizna' }[c] ?? '—');
globalThis.isStormCode = c => [95, 96, 99].includes(c);
eval(sacar('function deEsteSitio(est, place = null) {').replace('function deEsteSitio', 'globalThis.deEsteSitio = function'));
eval(sacarConst('mmTxt'));
eval(sacarConst('kmTxt'));
eval(sacarConst('esLlovizna'));
eval(sacar('function comoLlueve('));
eval(sacarConst('PERFILES'));           // los de verdad: rafagaBestia 70 / 90 / null
globalThis.perfil = () => PERFILES[S.perfil] ?? PERFILES.hierro;
globalThis.S = { perfil: 'hierro', comparativa: null, place: null };
eval(sacarConst('NUBE_ALTA'));
eval(sacarConst('NUBE_BAJA'));
eval(sacar('function loQueMideLaNube(h, place) {'));
globalThis.COMPARAR = [];
eval(sacar('function peorRacha('));
/* `assess` decide el color de la ráfaga con `nivelRacha`, que compara el
   número TAL COMO SE IMPRIME (25-09-2026). Van con ella sus dos
   ayudantes de unidades y el listón del perfil. */
/* Ojo: un `const` dentro de un eval NO sale del eval. Se asigna a mano. */
globalThis.WU = eval('(' + (src.match(/^const WU = (\{[\s\S]*?\n\});/m) || [])[1] + ')');
globalThis.wu   = () => WU[globalThis.S?.wunit] ?? WU.kmh;
globalThis.wv   = kmh => has(kmh) ? kmh * wu().f : null;
globalThis.wRed = v => { const x = wv(v); return has(x) ? Number(x.toFixed(wu().d)) : null; };
eval(sacar('function listonRafaga('));
eval(sacar('function nivelRacha('));
globalThis.nivelRacha = nivelRacha;
eval(sacar('function assess('));

const THR = { windWarn: 45, windNo: 60, gustWarn: 50, gustNo: 70,
              rainWarn: 0.2, rainNo: 2.0, capeWarn: 500, capeNo: 1000,
              visWarn: 1000, feelsWarn: -5 };
/* Una tarde tranquila de sábado en Bermeo: nada roza ningún listón. Lo
   que se cambia en cada prueba es UN campo, a null, y solo ese. */
const hora = extra => ({
  date: new Date(2026, 8, 5, 14), cape: 120, cin: 200, pop: 5, prec: 0, code: 1,
  wind: 12, gust: 20, gust10: 20, h: 3, temp: 18, rh: 60, vis: 20000, li: null,
  feels: 17, nieve: 0, nieveSuelo: 0, dew: 10, ...extra });
const juzgar = (extra, perfilQue = 'hierro') => {
  S.perfil = perfilQue;
  return assess(hora(extra), THR, perfilQue);
};
const diceNada = r => r.reasons.some(x => /^Nada llega a tus listones$/.test(x.txt));
const sinDato = (r, que) => r.reasons.some(x => x.s === 'nd' && x.txt.startsWith(`${que}: sin dato del modelo`));
const pinta = r => r.reasons.map(x => `[${x.s}] ${x.txt}`).join(' · ') || '(sin motivos)';

console.log('\n  Un hueco no es verde — perfil hierro, el de fábrica');
{
  const r = juzgar({ prec: null });
  ok('hierro con la lluvia a null: SIN DATO y dice «Lluvia: sin dato del modelo»',
     r.st === 'nd' && sinDato(r, 'Lluvia'), pinta(r));
  ok('hierro con la lluvia a null: no afirma «Nada llega a tus listones»', !diceNada(r), pinta(r));
}
{
  const r = juzgar({ cape: null });
  ok('hierro con el CAPE a null: SIN DATO y dice «CAPE: sin dato del modelo»',
     r.st === 'nd' && sinDato(r, 'CAPE'), pinta(r));
}
{
  const r = juzgar({ gust: null, gust10: null });
  ok('hierro con la ráfaga a null y sin comparativa: SIN DATO y dice «Ráfaga: sin dato del modelo»',
     r.st === 'nd' && sinDato(r, 'Ráfaga'), pinta(r));
  ok('hierro con la ráfaga a null: no afirma «Nada llega a tus listones»', !diceNada(r), pinta(r));
}
{
  const r = juzgar({ gust: null, gust10: null }, 'dentro');
  ok('dentro (sala técnica) con la ráfaga a null: también SIN DATO, no verde',
     r.st === 'nd' && sinDato(r, 'Ráfaga') && !diceNada(r), pinta(r));
}
{
  const r = juzgar({ gust: null, gust10: null }, 'torre');
  ok('torre con la ráfaga a null: sigue en SIN DATO (lo que ya había)',
     r.st === 'nd' && sinDato(r, 'Ráfaga'), pinta(r));
}
{
  /* La comparativa rescata el hueco: ICON da 75 a 10 m en esa hora. La
     racha no está a null: está en 75 y pasa su ámbar.

     ERA 55 HASTA EL 25-09-2026, cuando el ámbar salía del 70 % de 70 y
     valía 49. Ese día él lo subió a 70 —*«40, 50 es poco, eso es a
     diario en invierno aquí»*— y con 55 esto ya NO tiene que avisar: es
     la consecuencia buscada, no un fallo. Se sube el caso por encima de
     su listón nuevo para seguir probando lo que esta prueba prueba —que
     el hueco se rescata de la comparativa—, y no el número del listón,
     que se comprueba en su sitio. */
  S.place = { lat: 43.42, lon: -2.72 };
  S.comparativa = { clave: '43.420,-2.720',
    hourly: { time: ['2026-09-05T14:00'], wind_gusts_10m_icon_eu: [75] } };
  COMPARAR.push({ om: 'icon_eu', name: 'ICON' });
  const r = juzgar({ gust: null, gust10: null });
  ok('hierro con la ráfaga a null pero ICON da 75 en la comparativa: OJO con 75 km/h, no SIN DATO',
     r.st === 'warn' && r.reasons.some(x => /^Ráfaga 75 km\/h/.test(x.txt)) && !sinDato(r, 'Ráfaga'), pinta(r));
  /* Y con 55, que antes saltaba, ahora NO: su listón está en 70. */
  S.comparativa.hourly.wind_gusts_10m_icon_eu = [55];
  const r55 = juzgar({ gust: null, gust10: null });
  ok('y con 55 ya no avisa: su ámbar está en 70 desde el 25-09',
     r55.st !== 'warn' || !r55.reasons.some(x => /^Ráfaga 55/.test(x.txt)), pinta(r55));
  S.place = null; S.comparativa = null; COMPARAR.length = 0;
}
{
  const r = juzgar({});
  ok('hora completa y tranquila: sigue en verde y dice «Nada llega a tus listones»',
     r.st === 'go' && r.reasons.length === 1 && diceNada(r), pinta(r));
}
{
  const r = juzgar({ prec: null, cape: null, gust: null, gust10: null });
  ok('con los tres a null salen los tres motivos de SIN DATO, uno por dato',
     r.st === 'nd' && sinDato(r, 'Lluvia') && sinDato(r, 'CAPE') && sinDato(r, 'Ráfaga')
       && r.reasons.filter(x => x.s === 'nd').length === 3, pinta(r));
}

/* ── 2. El fallo del relleno largo se ve en pantalla ────────────────── */
console.log('\n  Si el relleno largo se cae, se dice desde qué hora y por qué');
eval(sacar('function nombreDeDia(d) {'));
eval(sacarConst('VT'));
/* Las claves que nos inventamos nosotros: `completarLargo` las quita de
   la petición por esta lista. Si no está, la API contesta 400 a la
   petición entera y los diez días se quedan vacíos (22-09-2026). */
eval(sacarConst('CLAVES_NUESTRAS'));
eval(sacarConst('RELLENO_LARGO'));
eval(sacarConst('RELLENO_2'));
globalThis.DAILY = 'uv_index_max';
globalThis.API = { fc: 'https://torre.test/om?api=fc' };
globalThis.nombreDeModelo = om => ({ ecmwf_ifs025: 'ECMWF', gfs_seamless: 'GFS' }[om] ?? om);
/* 14-09-2026: completarLargo apunta qué faltaba antes de rellenar (queFaltaba). */
eval(sacar('function queFaltaba('));
eval(sacar('async function completarLargo(f, p) {'));
if (tiene('function notaRellenoFallo(fc) {')) eval(sacar('function notaRellenoFallo(fc) {'));
else globalThis.notaRellenoFallo = () => { throw new Error('notaRellenoFallo no existe en app.js'); };

/* 72 horas desde el sábado 05-09 a las 00:00; el modelo cargado da ráfaga
   solo las primeras 48, como AROME. La hora 48 es el lunes 07 a las 00:00. */
const horas = Array.from({ length: 72 }, (_, i) => {
  const d = new Date(2026, 8, 5, i);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`;
});
const dias = Array.from({ length: 10 }, (_, i) => `2026-09-${String(5 + i).padStart(2, '0')}`);
const partirDe = () => ({
  hourly: { time: horas.slice(),
            wind_gusts_10m: horas.map((_, i) => (i < 48 ? 20 : null)),
            precipitation:  horas.map((_, i) => (i < 48 ? 0 : null)) },
  daily:  { time: dias.slice(), uv_index_max: dias.map(() => null) },
});
const sitio = { lat: 43.42, lon: -2.72 };

(async () => {
  /* ── LO QUE SALE A LA RED, MIRADO EN LA PETICIÓN (22-09-2026) ───────
     La guarda definitiva de la clase, y la única que habría parado la
     regresión de esa noche: aquí `completarLargo` es la función DE
     VERDAD, sacada de app.js, y la API es de mentira — así que se puede
     leer el `hourly` que pide y comprobar que no lleva ninguna clave
     nuestra.

     Si una se cuela, Open-Meteo contesta **HTTP 400 a la petición
     entera** y los diez días se quedan vacíos. Pasó el 01-09 con
     `weather_code_lluvia` y volvió a pasar el 22-09 con
     `cape_de_la_tapa`, porque la guarda de entonces solo miraba que
     siguiera escrita la línea del arreglo viejo. Ésta mira el hecho. */
  {
    let pedido = null;
    globalThis.jget = async (_u, q) => { pedido = q; throw new Error('corta aquí'); };
    const f = partirDe();
    for (const k of CLAVES_NUESTRAS) f.hourly[k] = horas.map(() => 1);
    await completarLargo(f, sitio);
    const campos = String(pedido?.hourly || '').split(',');
    const coladas = CLAVES_NUESTRAS.filter(k => campos.includes(k));
    ok('ninguna clave nuestra sale en la petición del relleno de 10 días',
       coladas.length === 0,
       coladas.length ? `se coló: ${coladas.join(', ')} — la API contesta 400 a TODO`
                      : `${CLAVES_NUESTRAS.length} claves metidas a propósito, ninguna sale`);
    ok('y las de verdad sí salen: el filtro no se ha pasado de frenada',
       campos.includes('wind_gusts_10m') && campos.includes('precipitation'),
       `pidió: ${campos.join(', ')}`);
  }
  {
    globalThis.jget = async () => { throw new Error('HTTP 502 del relleno'); };
    const f = partirDe();
    await completarLargo(f, sitio);
    ok('si ECMWF no contesta, se apunta el motivo y DESDE QUÉ HORA falta (la 49.ª, lunes 00:00)',
       f.rellenoFallo === 'HTTP 502 del relleno' && f.rellenoFallaDesde === '2026-09-07T00:00',
       `rellenoFallo=${f.rellenoFallo} rellenoFallaDesde=${f.rellenoFallaDesde}`);
    ok('y las horas siguen a null: no se inventa nada para tapar el hueco',
       f.hourly.wind_gusts_10m[48] === null && f.rellenoDesde === undefined);
  }
  {
    let llamadas = 0;
    globalThis.jget = async () => {
      llamadas++;
      if (llamadas > 1) throw new Error('GFS no contesta');
      return { hourly: { time: horas.slice(), wind_gusts_10m: horas.map(() => 30), precipitation: horas.map(() => 0.1) },
               daily: { time: dias.slice(), sunrise: dias.map(() => '07:30') } };
    };
    const f = partirDe();
    await completarLargo(f, sitio);
    ok('si entran las horas pero se cae la segunda pasada de los días, no se inventa una hora: desde=null',
       f.rellenoDesde === '2026-09-07T00:00' && f.rellenoFallo === 'GFS no contesta' && f.rellenoFallaDesde === null,
       `rellenoDesde=${f.rellenoDesde} rellenoFallo=${f.rellenoFallo} rellenoFallaDesde=${f.rellenoFallaDesde}`);
  }
  {
    let html = '';
    try { html = notaRellenoFallo({ rellenoFallo: 'HTTP 502 del relleno', rellenoFallaDesde: '2026-09-07T03:00' }); }
    catch (e) { html = `ERROR ${e.message}`; }
    /* El día se nombra relativo a HOY («hoy», «mañana lunes», «el lunes»),
       así que se pide con la misma puerta que usa la app: si no, la prueba
       se pondría roja sola el propio 07-09. */
    const dia = nombreDeDia(new Date(2026, 8, 7, 3));
    ok('la nota de «Ahora» pone SIN DATO, el día y la hora desde la que falta, el modelo y el motivo',
       /det__nota/.test(html) && html.includes(VT.nd) && html.includes(`desde ${dia} a las 03:00`)
         && /ECMWF/.test(html) && /HTTP 502 del relleno/.test(html), html.replace(/\s+/g, ' ').slice(0, 200));
    ok('y no se lee como «aquí no pasa nada»: lo dice con esas palabras',
       /no porque no pase nada/.test(html), html.replace(/\s+/g, ' ').slice(0, 200));
    let h2 = '';
    try { h2 = notaRellenoFallo({ rellenoFallo: 'GFS no contesta', rellenoFallaDesde: null }); }
    catch (e) { h2 = `ERROR ${e.message}`; }
    ok('con solo la segunda pasada caída, la nota lo dice así y no inventa una hora',
       /las horas sí entraron/.test(h2) && !/desde/.test(h2) && /GFS no contesta/.test(h2), h2.replace(/\s+/g, ' ').slice(0, 200));
    let h3 = 'x';
    try { h3 = notaRellenoFallo({ rellenoDesde: '2026-09-07T00:00' }); } catch (e) { h3 = `ERROR ${e.message}`; }
    ok('sin fallo de relleno, la nota no sale', h3 === '');
  }
  {
    const iNow = src.indexOf('function renderNow() {');
    const fin = src.indexOf('\nfunction ', iNow + 1);
    const cuerpo = iNow < 0 ? '' : src.slice(iNow, fin < 0 ? undefined : fin);
    const iNota = cuerpo.indexOf('notaRellenoFallo(fc)');
    const iImposible = cuerpo.indexOf('Algún número no era posible');
    ok('renderNow() pinta la nota del relleno junto a «Algún número no era posible y se ha quitado»',
       iNota > 0 && iImposible > 0 && iNota > iImposible,
       `notaRellenoFallo en ${iNota}, la de imposibles en ${iImposible}`);
  }

  /* ── 3. Leaflet en casa, no en unpkg ──────────────────────────────── */
  console.log('\n  Leaflet en vendor/, para que el radar arranque sin cobertura');
  {
    const iLib = src.indexOf('  lib() {\n    if (window.L) return Promise.resolve();');
    const lib = iLib < 0 ? '' : src.slice(iLib, src.indexOf('\n  },', iLib));
    ok('Radar.lib() carga ./vendor/leaflet/leaflet.js y .css, no unpkg',
       lib.includes("'./vendor/leaflet/leaflet.js'") && lib.includes("'./vendor/leaflet/leaflet.css'")
         && !/https:\/\/unpkg\.com/.test(lib),
       lib ? lib.match(/href = '[^']*'|src = '[^']*'/g)?.join(' · ') : 'no encuentro Radar.lib()');
    ok('en todo app.js no queda ninguna URL de unpkg.com', !/unpkg\.com\//.test(src));
  }
  {
    const dir = path.join(raiz, 'vendor', 'leaflet');
    const js = path.join(dir, 'leaflet.js'), css = path.join(dir, 'leaflet.css');
    const jsTxt = fs.existsSync(js) ? fs.readFileSync(js, 'utf8') : '';
    ok('vendor/leaflet/leaflet.js existe y es la 1.9.4', /version="1\.9\.4"/.test(jsTxt),
       jsTxt ? `${jsTxt.length} caracteres, sin «version="1.9.4"»` : 'no existe');
    /* Medido el 05-09-2026 sobre dist/leaflet.js del paquete oficial
       leaflet-1.9.4.tgz (integridad sha512-nxS1ynzJ…FA74PA==, 869.361 bytes). */
    const sha = jsTxt ? crypto.createHash('sha256').update(fs.readFileSync(js)).digest('hex') : '';
    ok('y es el fichero oficial de npm, byte a byte (sha256 db49d009…5641a)',
       sha === 'db49d009c841f5ca34a888c96511ae936fd9f5533e90d8b2c4d57596f4e5641a', sha);
    const cssTxt = fs.existsSync(css) ? fs.readFileSync(css, 'utf8') : '';
    const imgs = [...cssTxt.matchAll(/url\((images\/[^)]+)\)/g)].map(m => m[1]);
    const faltan = imgs.filter(i => !fs.existsSync(path.join(dir, i)));
    ok('vendor/leaflet/leaflet.css existe y cada imagen que pide por ruta relativa está al lado',
       cssTxt.length > 0 && imgs.length >= 3 && faltan.length === 0,
       cssTxt ? `pide ${imgs.join(', ')}; faltan: ${faltan.join(', ') || 'ninguna'}` : 'no existe');
  }

  /* ── 4. El catálogo del radar pasa por el intermediario ───────────── */
  console.log('\n  El catálogo del radar pasa por /om como todo lo demás');
  {
    globalThis.location = { protocol: 'https:', hostname: 'torre.test', origin: 'https://torre.test' };
    eval(sacarConst('PROXY'));
    eval(sacarConst('BACKEND'));   // desde el 07-09 via() sale por BACKEND (en Vercel es el propio origen)
    eval(sacarConst('directo'));
    eval(sacarConst('via'));
    eval(sacar('const API = {', '\n};').replace('const API', 'globalThis.API'));
    ok('con servidor, API.rain va por /om?api=rain', API.rain === 'https://torre.test/om?api=rain', API.rain);
    let u = null;
    try { u = new URL(API.rain); } catch { u = null; }
    ok('y jget(API.rain, {}) puede hacer new URL() y lleva el selector api=rain',
       u !== null && u.searchParams.get('api') === 'rain', String(API.rain));
    globalThis.PROXY = null;
    ok('sin servidor (fichero local) se cae a api.rainviewer.com, como fc/geo/elev',
       API.rain === 'https://api.rainviewer.com/public/weather-maps.json', API.rain);
    ok('y `directo` sigue teniendo la URL del radar de reserva',
       directo.rain === 'https://api.rainviewer.com/public/weather-maps.json');
  }

  console.log(`\n  ${bien} bien, ${mal} mal`);
  if (mal) process.exit(1);
})();
