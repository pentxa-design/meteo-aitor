/* ═══════════════════════════════════════════════════════════════════
   ABRIR LA APP DE VERDAD ANTES DE PUBLICARLA
   ───────────────────────────────────────────────────────────────────
   Suyo, 27-08-2026, después de que le saliera la banda roja DOS VECES en
   una mañana por fallos míos: *«hazlo así siempre, comprobarlo antes de
   enviármelo»*.

   Y es la única forma de cazarlos. Los dos fallos de esa mañana:

     · «Cannot access 'CAMPO_COLA' before initialization»
     · «Cannot set properties of null (setting 'innerHTML')»

   Ninguno de los dos lo coge `node --check` —la sintaxis es perfecta— ni
   ESLint `no-undef` —las variables existen—. Solo se ven **arrancando la
   app**. Y yo publicaba sin abrirla.

   Esto monta el `index.html` con el `app.js` en un navegador de mentira,
   lo arranca, y falla si salta cualquier error. Corre en `revisar.sh`,
   así que si revienta NO SE PUBLICA.

   Lo que NO comprueba: que los datos sean correctos ni que se vea bien.
   Solo que la app **arranca sin romperse**. Eso ya es lo que fallaba.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch {
  /* ── SIN jsdom NO SE PUBLICA (26-09-2026) ─────────────────────────
     Los tres guardias que ARRANCAN la app entera se saltaban solos y
     salían con éxito si faltaba jsdom. O sea: quita una dependencia y
     el candado que mira las pantallas —el que sustituye a sus
     pantallazos— se abre en verde sin decir nada. Un hueco no puede
     leerse como «todo bien». Si de verdad hace falta publicar sin él,
     SIN_JSDOM=1 lo permite y lo dice por pantalla. */
  if (process.env.SIN_JSDOM === '1') {
    console.log('  · jsdom no está y SIN_JSDOM=1: la prueba de arranque SIN COMPROBAR (pedido a mano)');
    process.exit(0);
  }
  console.log('  ✗ jsdom no está instalado y la prueba de arranque se quedan sin comprobar.');
  console.log('    npm install jsdom   ·   o SIN_JSDOM=1 para publicar a ciegas');
  process.exit(1);
}

const aqui = __dirname;
const html = fs.readFileSync(path.join(aqui, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(aqui, 'app.js'), 'utf8');

/* Una respuesta real de `/om`, guardada. Se puede refrescar cuando se
   quiera con el `curl` que hay en el README de `pruebas-datos/`. */
const OM = JSON.parse(fs.readFileSync(path.join(aqui, 'pruebas-datos', 'om.json'), 'utf8'));

/* DOS ESCENARIOS, y el segundo es el que importaba.
   La primera versión solo probaba «sin cobertura» y daba todo por bueno,
   mientras a él le reventaba la app con el móvil a tope de 5G. Es el
   mismo error de siempre: probar por el lado que funciona.

   1. SIN RED    — él en el monte, sin línea
   2. CON RED    — él en casa o en la furgoneta, todo respondiendo

   Los caminos que corren son DISTINTOS: con red se adoptan sus torres
   del servidor, se pinta el parte, se pinta el hilo de notas… y ahí es
   donde estaba el `null`. */
function arrancar(conRed, euskalmetCaido = false, abrirTorres = false, horaVieja = false) {
const dom = new JSDOM(html, {
  url: 'https://weather-app-ochre-one-76.vercel.app/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const w = dom.window;

/* Se le da un navegador POBRE a propósito: sin red, sin service worker
   listo, sin caché, sin ubicación. Es el peor caso real —él en el monte
   sin cobertura— y es donde más fallos salen. Si arranca así, arranca. */
/* Respuestas creíbles para lo que pide la app al arrancar. No hace falta
   que los datos sean buenos: hace falta que TENGA datos, que es cuando se
   recorren los caminos que rompen. */
const respuesta = obj => Promise.resolve({
  ok: true, status: 200,
  json: () => Promise.resolve(obj),
  text: () => Promise.resolve(JSON.stringify(obj)),
});
w.fetch = (u = '') => {
  if (!conRed) return Promise.reject(new Error('sin red'));
  const s_ = String(u);
  if (s_.includes('/api/campo')) return respuesta({ notas: [{
    texto: 'nota de prueba', hora: '27/8/2026, 8:00:00', cuando: '2026-08-27T06:00:00.000Z',
    sitio: 'BI BERMEO', respuesta: { texto: 'contestado', hora: '27/8/2026, 8:01:00' } }], total: 1 });
  if (s_.includes('/api/torres')) return respuesta({ torres: [
    { name: 'BI BERMEO', lat: 43.412976, lon: -2.718316 },
    { name: 'BI OIZ', lat: 43.22805, lon: -2.5936 }] });
  if (s_.includes('/api/suscribir')) return respuesta({ publica: 'x', aparatos: 2 });

  /* DATOS DEL TIEMPO DE VERDAD, guardados de una consulta real.
     Sin esto la app no llega a pintar NADA —se queda sin datos y se salta
     todos los renders—, así que el comprobador daba «todo bien» mientras
     a él le reventaba la pantalla. Es otra vez el mismo error: probar por
     un camino que no es el que él recorre. */
  if (s_.includes('/om?') || s_.includes('open-meteo')) return respuesta(OM);
  /* Tercer escenario (01-09-2026): Euskalmet no contesta. Suyo, ese día:
     «esto me suena de ayer o anteayer y vuelve a fallar». Sus estaciones
     de 20 m —Oiz, Sollube, Punta Galea— desaparecían de la pantalla sin
     una palabra, y un hueco callado se lee como «aquí no hay nada». */
  if (s_.includes('/api/euskalmet')) {
    if (euskalmetCaido) return Promise.resolve({
      ok: false, status: 503,
      json: () => Promise.reject(new Error('503')),
      text: () => Promise.resolve('caído'),
    });
    return respuesta({ ok: true, estaciones: [], puntos: [] });
  }
  if (s_.includes('/estaciones')) {
    /* `horaVieja` imita EXACTAMENTE lo que devolvía una copia guardada:
       `medidoEn` de hace tres horas y `haceMinutos` congelado en 20,
       porque ese contador lo calculó el servidor cuando contestó. Antes,
       la app se creía el 20 y le pintaba una hora reciente que nunca
       existió. (01-09-2026.) */
    const hace3h = new Date(Date.now() - 3 * 3600e3).toISOString();
    return respuesta({ estaciones: [{
      nombre: 'BILBAO AEROPUERTO', km: 12.4, altitud: 39, racha: 21, temp: 19,
      medidoEn: horaVieja ? hace3h : new Date(Date.now() - 12 * 60e3).toISOString(),
      haceMinutos: horaVieja ? 20 : 12,
    }] });
  }
  if (s_.includes('/rayos')) return respuesta({ ambitos: {} });
  if (s_.includes('/mareas')) return respuesta({});
  return respuesta({});
};
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.caches = { open: () => Promise.reject(new Error('sin caché')) };
const reg = {
  showNotification: () => Promise.resolve(),
  pushManager: { getSubscription: () => Promise.resolve(null), subscribe: () => Promise.resolve(null) },
  active: { postMessage() {} },
};
w.navigator.serviceWorker = {
  register: () => Promise.resolve(reg),
  ready: conRed ? Promise.resolve(reg) : new Promise(() => {}),
  addEventListener() {}, controller: null,
};
if (conRed) w.caches = { open: () => Promise.resolve({
  match: () => Promise.resolve(null), put: () => Promise.resolve(),
}) };
w.navigator.geolocation = { getCurrentPosition() {} };
w.scrollTo = () => {};
w.requestAnimationFrame = cb => setTimeout(cb, 0);

const fallos = [];
const sitio = e => ((e && e.stack) || '').split('\n')[1]?.trim() || '';

w.addEventListener('error', e => fallos.push(['error', e.message, sitio(e.error)]));
w.addEventListener('unhandledrejection', e =>
  fallos.push(['promesa sin recoger', e.reason?.message ?? String(e.reason), sitio(e.reason)]));

try {
  w.eval(js);
} catch (e) {
  fallos.push(['al arrancar', e.message, sitio(e)]);
}

/* Se le da un momento para que corran los `setTimeout(0)` del arranque:
   ahí es donde vive la sincronización de sus torres y el pintado del
   hilo, que son de lo último que se añadió y de lo que más rompe. */
/* Y si hace falta, se abre «Mis estaciones» —que es donde vive la tabla
   de observaciones— y se le da otro rato: `cargarObservacion()` solo
   corre al entrar ahí, así que sin este paso el escenario no ejercitaba
   nada y daba un falso «no dice nada» (01-09-2026). */
if (abrirTorres) {
  setTimeout(() => {
    try {
      const t = [...w.document.querySelectorAll('.tab')]
        .find(x => /mis estaciones/i.test(x.textContent || ''));
      if (t) t.click();
    } catch { /* si no está, el escenario lo dirá igual */ }
  }, 900);
}
return new Promise(res => setTimeout(() => res(Object.assign(fallos, { _doc: w.document })),
                                     abrirTorres ? 4200 : 1800));
}

(async () => {
  let mal = 0;
  for (const [conRed, et] of [[false, 'sin cobertura'], [true, 'con cobertura']]) {
    const fallos = await arrancar(conRed);
    if (!fallos.length) { console.log(`  ✓ arranca ${et}`); continue; }
    mal++;
    console.log(`  ✗ SE ROMPE ${et.toUpperCase()}:`);
    for (const [tipo, msg, donde] of fallos) {
      console.log(`     ${tipo}: ${msg}`);
      if (donde) console.log(`        ${donde}`);
    }
  }
  /* Y el tercero: con red, pero con Euskalmet caído. No basta con que
     arranque — se exige que lo DIGA. */
  {
    const fallos = await arrancar(true, true, true);
    if (fallos.length) {
      mal++;
      console.log('  ✗ SE ROMPE CON EUSKALMET CAÍDO:');
      for (const [tipo, msg] of fallos) console.log(`     ${tipo}: ${msg}`);
    } else {
      const txt = fallos._doc?.body?.textContent || '';
      if (/No he podido preguntar a Euskalmet/.test(txt)) {
        console.log('  ✓ con Euskalmet caído lo DICE, no se queda vacío');
      } else {
        mal++;
        console.log('  ✗ CON EUSKALMET CAÍDO NO DICE NADA:');
        console.log('     faltan sus estaciones de 20 m y la pantalla calla,');
        console.log('     que se lee como «aquí no mide nadie». Un hueco jamás.');
        console.log('     PISTA · ¿llegó a pintar observaciones?: '
          + (/BILBAO AEROPUERTO/.test(txt) ? 'sí' : 'NO — no entra a esa función'));
        console.log('     PISTA · #obs existe: ' + !!fallos._doc?.getElementById('obs'));
      }
    }
  }

  /* Cuarto: una medida vieja servida como si fuera de ahora. */
  {
    const fallos = await arrancar(true, false, true, true);
    const txt = fallos._doc?.body?.textContent || '';
    const dice3h = /hace 3 h/.test(txt);
    const miente = /hace 20 min/.test(txt);
    if (fallos.length) {
      mal++;
      console.log('  ✗ SE ROMPE CON UNA MEDIDA VIEJA:');
      for (const [tipo, msg] of fallos) console.log(`     ${tipo}: ${msg}`);
    } else if (dice3h && !miente) {
      console.log('  ✓ una medida de hace 3 h se dice de hace 3 h, no de hace 20 min');
    } else {
      mal++;
      console.log('  ✗ UNA MEDIDA VIEJA SE PINTA COMO RECIENTE:');
      console.log(`     ¿dice «hace 3 h»?: ${dice3h ? 'sí' : 'NO'}`);
      console.log(`     ¿dice «hace 20 min»?: ${miente ? 'SÍ — está mintiendo' : 'no'}`);
      console.log('     Es el número con el que contrasta al modelo antes de mandar a alguien.');
    }
  }

  if (mal) {
    console.log();
    console.log('     Esto es la banda roja que él ve arriba del todo. NO se publica.');
    process.exit(1);
  }
  process.exit(0);
})();
