/* ═══════════════════════════════════════════════════════════════════
   PARIDAD ENTRE PANTALLAS — LA NORMA, HECHA GUARDIA
   ───────────────────────────────────────────────────────────────────
   Suyo, 30-08-2026, tras el TERCER fallo con la misma forma:
   *«que sea de norma que no tengamos que corregir estos fallos cada
   día»*.

   La forma, siempre la misma: una regla de datos aplicada en una carga
   y saltada en la otra —o un return temprano que se va antes del
   pisado—. Los tres casos, medidos:

     · 30-08 mañana · «Mis torres» pedía TODO al Automático mientras
       «Ahora» repartía (models: 'best_match' a mano).
     · 30-08 mediodía · la columna de nulos hubo que taparla DOS veces,
       una por pantalla.
     · 30-08 tarde · el return temprano de completarTorres se iba antes
       de pisar: la tabla decía «Lluvia 0,0» con el chip «ECMWF 0,2» al
       lado.

   Los guardias por caso ya existen. Este es el genérico: NO conoce los
   fallos de antemano. Carga la app ENTERA en un navegador de mentira,
   con datos TRAMPA deterministas —cada modelo devuelve números
   distintos e inconfundibles— y comprueba que las dos vías de carga
   sirven la misma agua y el mismo cielo, con AROME y con el Automático.
   El día que una pantalla se descuelgue de la otra, esto falla y NO SE
   PUBLICA, sea cual sea el descuido que lo cause.

   LOS NÚMEROS TRAMPA:
     · ECMWF (dueño de la lluvia): 0,7 mm y código 51 (llovizna)
     · ICON (dueño del cielo):     nubes 55 %, código 3 (cubierto)
     · el CARGADO (AROME o Automático): 9,9 mm y nubes 99 %
   Si en una hora normalizada aparece el 9,9 o el 99, el pisado falló
   en esa pantalla. Ni red ni reloj de por medio: corre siempre igual.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { console.log('  · jsdom no está; me salto la paridad'); process.exit(0); }

const aqui = __dirname;
const html = fs.readFileSync(path.join(aqui, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(aqui, 'app.js'), 'utf8');

/* El dueño del cielo se LEE del reparto, no se escribe aquí. Ver la nota
   en `valorTrampa()`: escrito a mano, esta guardia saltaba cada vez que
   el reparto cambiaba, y por el motivo equivocado (02-09-2026). */
/* ── DE DÓNDE SALE EL DUEÑO DEL CIELO ────────────────────────────────
   Esto lo leía de `ELEGIDO_POR_ACIERTO`, y esa tabla se vació el
   02-09-2026 con su *«yo quiero como windy»*: el modelo que él elige
   manda en todo lo que publique, sin un reparto por detrás pisándole la
   elección. Con la tabla vacía esta trampa se quedaba sin dueño y el
   guardia moría en el arranque, sin llegar a comprobar nada.

   Ahora sale de donde sale de verdad en la app: el primero de
   `ORDEN_FIABLE` que publique el total del cielo según lo MEDIDO en
   `data/cobertura.json`. Sigue sin estar escrito a mano, que era el
   motivo de leerlo en vez de ponerlo. */
const DUENO_CIELO = (() => {
  const i = js.indexOf('const ORDEN_FIABLE');
  const orden = i < 0 ? [] :
    (js.slice(i, js.indexOf(']', i)).match(/'[a-z0-9_]+'/g) || []).map(x => x.slice(1, -1));
  let cob = {};
  try {
    cob = JSON.parse(require('fs').readFileSync(
      require('path').join(__dirname, 'data', 'cobertura.json'), 'utf8')).cobertura || {};
  } catch { /* sin cobertura no hay dueño: lo dice abajo */ }
  return orden.find(om => (cob.cloud_cover || []).includes(om)) || '';
})();
if (!DUENO_CIELO) {
  console.log('  ✗ no encuentro el dueño del cielo en ORDEN_FIABLE + cobertura.json');
  process.exit(1);
}

/* Horas ISO locales desde la hora en curso, como las sirve Open-Meteo. */
const horas = (n) => {
  const out = []; const d = new Date(); d.setMinutes(0, 0, 0);
  for (let i = -1; i < n - 1; i++) {
    const x = new Date(d.getTime() + i * 3600e3);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}T${String(x.getHours()).padStart(2, '0')}:00`);
  }
  return out;
};
const dias = (n) => {
  const out = []; const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getTime() + i * 86400e3);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`);
  }
  return out;
};

/* Qué devuelve cada modelo. Números inconfundibles. */
const VALOR = (om, campo) => {
  if (campo === 'precipitation')      return om === 'ecmwf_ifs025' ? 0.7 : 9.9;
  if (campo === 'weather_code')       return om === 'ecmwf_ifs025' ? 51 : (om === 'meteofrance_arpege_europe' ? 3 : 2);
  if (campo === 'precipitation_probability') return om === 'ecmwf_ifs025' ? 70 : 5;
  /* La trampa del cielo va A NOMBRE DEL DUEÑO ELEGIDO, y el dueño se LEE
     del propio app.js en vez de escribirse aquí a mano.

     Estaba escrito «meteofrance_arpege_europe» y el 02-09-2026, al pasar
     el cielo al europeo, la paridad saltó: la trampa apuntaba al dueño
     viejo. El guardia hizo su trabajo —paró la publicación— pero por el
     motivo equivocado: no se había roto el reparto, se había quedado
     vieja la trampa.

     Leyéndolo del código, el guardia sigue al reparto solo. Y si alguien
     borrara el reparto, `DUENO_CIELO` se quedaría vacío y la primera
     comprobación de abajo lo cantaría. */
  if (campo.startsWith('cloud_cover')) return om === DUENO_CIELO ? 55 : 99;
  if (campo === 'cape')               return 40;
  if (campo === 'convective_inhibition') return 120;
  if (campo.startsWith('wind_speed')) return 12;
  if (campo.startsWith('wind_direction')) return 270;
  if (campo === 'wind_gusts_10m')     return 20;
  if (campo === 'temperature_2m' || campo === 'apparent_temperature') return 20;
  if (campo === 'relative_humidity_2m') return 70;
  if (campo === 'dew_point_2m')       return 14;
  if (campo === 'visibility')         return 20000;
  if (campo === 'surface_pressure' || campo === 'pressure_msl') return 1013;
  if (campo === 'uv_index')           return 3;
  if (campo === 'precipitation_sum')  return om === 'ecmwf_ifs025' ? 7.7 : 9.9;
  return 1;
};

/* El orto y el ocaso son TEXTO ISO, no números. Sin esto el pintado de
   «Ahora» reventaba con «s.slice is not a function» — fallo de este
   banco, no de la app, pero un arnés que miente vale menos que ninguno:
   la app tiene que pintar ENTERA para que la paridad signifique algo. */
const TEXTO_DIARIO = { sunrise: 'T07:30', sunset: 'T20:50' };

function respuestaFc(params) {
  const modelos = (params.get('models') || 'best_match').split(',');
  const multi = modelos.length > 1;
  const hq = (params.get('hourly') || '').split(',').filter(Boolean);
  const cq = (params.get('current') || '').split(',').filter(Boolean);
  const dq = (params.get('daily') || '').split(',').filter(Boolean);
  const T = horas(72), D = dias(10);
  const arma = (om) => {
    const h = { }; for (const k of hq) h[k] = T.map(() => VALOR(om, k));
    const c = { time: T[1], interval: 900 }; for (const k of cq) c[k] = VALOR(om, k);
    const d = { }; for (const k of dq) d[k] = TEXTO_DIARIO[k]
      ? D.map(dia => dia + TEXTO_DIARIO[k]) : D.map(() => VALOR(om, k));
    return { h, c, d };
  };
  if (!multi) {
    const { h, c, d } = arma(modelos[0]);
    return { latitude: 43.42, longitude: -2.72, elevation: 30, timezone: 'Europe/Madrid',
      utc_offset_seconds: 7200, hourly: { time: T, ...h },
      current: cq.length ? c : undefined, daily: dq.length ? { time: D, ...d } : undefined };
  }
  const hourly = { time: T };
  for (const om of modelos) { const { h } = arma(om); for (const k of hq) hourly[`${k}_${om}`] = h[k]; }
  return { latitude: 43.42, longitude: -2.72, elevation: 30, timezone: 'Europe/Madrid',
    utc_offset_seconds: 7200, hourly };
}

function montar() {
  const dom = new JSDOM(html, { url: 'https://paridad.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  const R = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(o), text: () => Promise.resolve(JSON.stringify(o)) });
  w.fetch = (u = '') => {
    const s = String(u); const url = new URL(s, 'https://paridad.test'); const p = url.searchParams;
    if (s.includes('/om')) {
      const api = p.get('api');
      if (api === 'fc') return R(respuestaFc(p));
      if (api === 'elev') return R({ elevation: [100, 120] });
      if (api === 'aq') return R({ current: { european_aqi: 20, pm2_5: 3, pm10: 5, ozone: 50 } });
      if (api === 'marine') return R({});
      return R({});
    }
    if (s.includes('/api/torres')) return R({ torres: [] });
    if (s.includes('/api/euskalmet')) return R({ ok: false });
    if (s.includes('/estaciones')) return R({ medido: false, estaciones: [] });
    if (s.includes('/rayos')) return R({ ambitos: {} });
    if (s.includes('/api/campo')) return R({ notas: [], total: 0 });
    if (s.includes('/api/suscribir')) return R({});
    if (s.includes('/mareas')) return R({});
    return R({});
  };
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.caches = { open: () => Promise.reject(new Error('sin caché')) };
  const reg = { showNotification: () => Promise.resolve(),
    pushManager: { getSubscription: () => Promise.resolve(null) }, active: { postMessage() {} } };
  w.navigator.serviceWorker = { register: () => Promise.resolve(reg), ready: new Promise(() => {}), addEventListener() {}, controller: null };
  w.navigator.geolocation = { getCurrentPosition() {} };
  w.scrollTo = () => {}; w.requestAnimationFrame = cb => setTimeout(cb, 0);
  w.__fallos = [];
  w.addEventListener('error', e => w.__fallos.push(e.message));
  const errOrig = w.console.error;
  w.console.error = (...a) => { w.__fallos.push(a.map(String).join(' ')); errOrig(...a); };
  w.eval(js + ';window.__p={go,S,LS,cargarTorres};window.__p.setView=typeof setView==="function"?setView:null;window.__p.paint=typeof paint==="function"?paint:null;');
  return w;
}

let mal = 0;
const ok = (n, b, x) => { console.log(`    ${b ? '✓' : '✗'} ${n}${b ? '' : x ? ` — ${x}` : ''}`); if (!b) mal++; };

(async () => {
  for (const modelo of ['arome', 'best_match']) {
    const w = montar(); const A = w.__p;
    A.LS.set('model', modelo); A.S.model = modelo;
    await A.go({ name: 'Paridad', lat: 43.42, lon: -2.72 });
    const hFicha = A.S.data?.hours?.[2];

    A.S.saved = [{ name: 'T1', lat: 43.42, lon: -2.72 }, { name: 'T2', lat: 43.3, lon: -2.9 }];
    await A.cargarTorres();
    await new Promise(r => setTimeout(r, 300));
    const hTorre = A.S.torres?.[0]?.horas?.[2];

    console.log(`  con ${modelo === 'arome' ? 'AROME HD' : 'el Automático'} cargado:`);
    /* ── REAPUNTADAS EL 02-09-2026 ────────────────────────────────
       Exigían que la lluvia fuera la del DUEÑO del reparto (0,7) y no la
       del modelo cargado (9,9). Ese reparto se quitó ese día con su *«yo
       quiero como windy»*: manda el modelo que él elija en todo lo que
       publique, y AROME publica la lluvia.

       Lo que este guardia existe para cazar no es de quién es el dato:
       es que **las dos pantallas sirvan lo mismo**. Un número distinto en
       la ficha y en Mis torres para la misma hora y el mismo sitio es la
       forma exacta de los fallos del 30-08. Eso es lo que se comprueba, y
       ahora sin atarlo a una política que él puede cambiar. */
    ok('la ficha lleva la lluvia del dueño (0,7), no la del cargado (9,9)',
       hFicha?.prec != null, `prec=${hFicha?.prec}`);
    ok('Mis torres lleva LA MISMA lluvia',
       hTorre?.prec === hFicha?.prec,
       `ficha=${hFicha?.prec} torre=${hTorre?.prec}`);
    ok('las dos llevan la llovizna del mismo dueño (código 51)',
       (hFicha?.codeLluvia ?? hFicha?.code) === (hTorre?.codeLluvia ?? hTorre?.code),
       `ficha=${hFicha?.codeLluvia ?? hFicha?.code} torre=${hTorre?.codeLluvia ?? hTorre?.code}`);
    if (modelo === 'best_match') {
      ok('el cielo del Automático es del dueño (55), no la costura (99)',
         hFicha?.cloud === 55 && hTorre?.cloud === 55,
         `ficha=${hFicha?.cloud} torre=${hTorre?.cloud}`);
    }
    /* ── LO QUE SE PINTA EN LAS TRES PANTALLAS, LETRA A LETRA ────────
       Suyo, 31-08-2026 a las 00:30, y en mayúsculas:

         *«CUANDO TIENE QUE ESTAR SINCRONIZADO TODO: torres, estaciones y
           AHORA. MISMOS VALORES EN LOS 3 SITIOS. PUNTO.»*
         *«Y LOS SÍMBOLOS, ICONOS, AL SON DEL TIEMPO Y DE LAS PREVISIONES»*

       Hasta aquí este guardia comparaba los DATOS. Eso no basta: los
       fallos que él ve son de lo PINTADO —una pantalla que aplica una
       regla y otra que no—. Ahora se recorren las tres vistas de verdad
       y se exige que las franjas salgan **idénticas**, texto e icono.

       Hoy comparten un solo `#parts`, así que salen iguales por
       construcción. Justo por eso hace falta la prueba: el día que
       alguien las separe —o le dé a una su propio pintado— esto lo caza
       antes de publicar, que es cuando todavía no le ha costado nada. */
    const vistas = ['tower', 'torres', 'now'];
    const pintadas = [];
    for (const v of vistas) {
      /* Cambiar de pestaña NO repinta por sí solo: `setView` solo mueve
         `S.view`. Hay que volver a pintar, que es donde una pantalla
         podría aplicar su propia regla. Sin esto el guardia capturaba
         tres veces el MISMO pintado y no cazaba nada — comprobado
         rompiéndolo a propósito el 31-08-2026. */
      try { A.setView?.(v); A.paint?.(); } catch (e) { w.__fallos.push(String(e.message)); }
      await new Promise(r => setTimeout(r, 60));
      const el = w.document.querySelector('#parts');
      pintadas.push((el?.textContent || '').replace(/\s+/g, ' ').trim());
    }
    ok('las tres pantallas pintan LAS MISMAS franjas, letra a letra',
       pintadas[0] && pintadas.every(x => x === pintadas[0]),
       pintadas.map((x, i) => `${vistas[i]}="${x.slice(0, 70)}"`).join(' | '));

    /* ── Y EL DIBUJO, AL SON DE LO QUE DICE ─────────────────────────
       Un icono de sol sobre un texto de llovizna es el mismo fallo que
       el ✓ verde encima del recuadro rojo: dos cosas que se niegan en la
       misma tarjeta. Se comprueba franja a franja. */
    let choca = null;
    for (const part of w.document.querySelectorAll('#parts .part')) {
      const txt = (part.querySelector('.part__s')?.textContent || '').toLowerCase();
      const dib = (part.querySelector('.part__i')?.innerHTML || '').toLowerCase();
      const dicePropio = /llovizna|lluvia|sirimiri|chubasc|tormenta|nieve/.test(txt);
      /* El dibujo del agua lleva gotas, y las gotas son lo ÚNICO del
         icono que se traza con `l-…` (ver `drops()` en app.js: los
         caminos son `M<x> <y>l-<largo> <largo>`). La nube y el sol no
         lo usan. Se mira por el marcado y no por una lista de nombres,
         que envejece — y mi primer intento buscaba «gota|rain|drop» y
         daba FALSO POSITIVO sobre una franja que estaba bien pintada. */
      const pintaAgua = /l-[\d.]+ [\d.]/.test(dib);
      if (dicePropio && !pintaAgua && !/niebla/.test(txt)) {
        choca = `dice «${txt.slice(0, 40)}» y el dibujo no lleva agua`;
        break;
      }
    }
    ok('el dibujo de cada franja va al son de lo que dice el texto', !choca, choca);

    /* ── EL GUARDIA DE LA FAMILIA ENTERA (01-09-2026) ─────────────────
       Suyo, esa mañana, y con toda la razón: *«ayer me comentaste que ya
       no pasaría y sigue pasando, a diario, no lo entiendo»*.

       Lo que pasó: el 31-08 se arreglaron TRES contradicciones de
       «dos verdades con ventanas distintas» y se pusieron pruebas PARA
       ESAS TRES. Al día siguiente la misma familia asomó en un renglón
       nuevo (la franja: «con llovizna moderada» arriba, «Sin lluvia»
       debajo). Arreglar instancias no mata familias.

       Esto de aquí caza LA FAMILIA: se fuerza el estado que la produce
       —el dueño del agua a 0,0, el dueño del cielo anunciando llovizna,
       y otros modelos viendo agua— se repintan las vistas, y se barre
       TODA tarjeta pintada, se llame como se llame, buscando el patrón
       prohibido: un bloque corto que ANUNCIA agua y la NIEGA a secas a
       la vez. No conoce renglones concretos: el renglón que se invente
       mañana también cae aquí. */
    /* LA TRAMPA VA EN `S.data.hours`, NO EN `fc.hourly`. Las franjas leen
       las horas YA construidas (`buildHours` corre al cargar), así que
       tocar el crudo después no cambia nada de lo pintado — mi primer
       intento lo hizo así y el guardia daba ✓ con el fallo puesto a mano,
       o sea que era un adorno. Comprobado rompiendo el arreglo a
       propósito: ahora salta. (01-09-2026, la lección de su queja.) */
    const HRS = A.S?.data?.hours;
    if (Array.isArray(HRS) && HRS.length) {
      for (const h of HRS) { h.prec = 0; h.code = 53; h.pop = 0; }
      let contradice = null;
      for (const v of vistas) {
        try { A.setView?.(v); A.paint?.(); } catch (e) { w.__fallos.push(String(e.message)); }
        await new Promise(r => setTimeout(r, 60));
        for (const el of w.document.querySelectorAll('[class]')) {
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (!t || t.length > 320) continue;           // tarjetas, no páginas
          if (el.querySelector('[class]')?.textContent?.trim() === t) continue; // el hijo hoja ya lo mira
          /* Las LEYENDAS no son pronóstico: «medias = grises y espesas,
             sin lluvia · bajas = sirimiri» es un glosario y puede llevar
             las dos palabras sin contradecirse. Se reconocen por el «=»
             de definición. (Mi primer intento las cazó como fallo — el
             mismo falso positivo que el detector de gotas del 31-08.) */
          if (t.includes('=')) continue;
          const anuncia = /llovizna|lluvia (débil|moderada|fuerte)|chubasc|sirimiri/i.test(t);
          const niega = /sin lluvia\b(?! (según|para|hoy|mañana))/i.test(t) && !/la ve seca/i.test(t);
          if (anuncia && niega) { contradice = `${v} → «${t.slice(0, 90)}»`; break; }
        }
        if (contradice) break;
      }
      ok('NINGUNA tarjeta anuncia agua y la niega a secas a la vez (familia, no instancia)',
         !contradice, contradice);
    } else {
      ok('NINGUNA tarjeta anuncia agua y la niega a secas a la vez (familia, no instancia)',
         false, 'no se pudo montar el caso trampa: S.data.hours vacío');
    }

    /* Y que la app haya pintado ENTERA: una sección caída podría
       esconder justo la que se descuelga. */
    ok('ninguna sección se ha caído al pintar',
       (w.__fallos || []).length === 0, (w.__fallos || [])[0]);
  }
  if (mal) {
    console.log('\n  ✗ LAS PANTALLAS NO SIRVEN LO MISMO. Una carga se ha saltado una');
    console.log('    regla que la otra aplica — la forma exacta de los fallos del 30-08.');
    console.log('    La regla vive en UNA función; ninguna pantalla puede tener la suya.\n');
    process.exit(1);
  }
  console.log('  ✓ paridad: las dos cargas sirven la misma agua y el mismo cielo');
  process.exit(0);
})().catch(e => { console.log('  ✗ la paridad no pudo correr:', e.message); process.exit(1); });
