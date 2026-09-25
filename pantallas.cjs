/* ═══════════════════════════════════════════════════════════════════
   LAS PANTALLAS, A LA HORA A LA QUE ÉL LAS MIRA
   ───────────────────────────────────────────────────────────────────
   Suyo, 25-09-2026, después de mandar diecisiete pantallazos a las
   07:13 con seis fallos de pantalla dentro:

     *«¿pero todavía seguimos teniendo fallos?»* · *«esto no puede ser»*
     *«que no vuelva a pasar, porque me suena que no es la primera vez»*

   Y no lo era. Los seis tenían LA MISMA FORMA: una pantalla que lee la
   hora equivocada (la mar de la portada leía la MEDIANOCHE; la luna a
   las 08:00 con el sol fuera), un color que sale de otra cosa (la chapa
   de la racha pintada por el semáforo del día), o un texto que afirma
   algo que la fila de al lado desmiente («Anemómetros de AEMET» con
   Almike de Euskalmet debajo; «Sirimiri de 23:00 a 00:00» sin decir que
   lo ve ICON). Las 1.276 pruebas estaban en verde porque ninguna miraba
   ESAS pantallas A ESA HORA con datos en los que se note. Esa misma
   mañana tres agentes de lectura sacaron DIECISÉIS más de la misma
   familia (§35-36 del TRASPASO) y este guardia cubre también esas.

   Esto arranca la app ENTERA en un navegador de mentira (como
   `paridad.cjs`), con el reloj puesto a las 02:30, 07:30, 13:30, 20:30 y
   23:30, y con DATOS TRAMPA QUE CAMBIAN CADA HORA: la mar de fondo vale
   0,1 m a las 00:00, 0,8 a las 07:00, 2,1 a las 20:00; el pico de ola de
   las 24 PRIMERAS horas de la serie (3,0) no es el de las 24 SIGUIENTES
   (2,0); el orto es a las 08:01, para que el `is_day` de Open-Meteo diga
   «noche» al principio de las 08:00; la racha de cada día es distinta y
   el día de tormenta lleva la racha más floja; la mínima del día (14°)
   cae a las 05:00 y la máxima (24°) a las 15:00; ICON es el único que ve
   agua (03, 04, 21 y 22 h) y su tapa vale 5 solo a las 10:00. Una
   pantalla que lea el índice 0, la hora fija, la posición en vez de la
   hora, o el color del vecino, enseña un número que NO es el que toca,
   y aquí se ve.

   LA SERIE EMPIEZA DONDE EMPIEZA DE VERDAD (medido el 25-09 por /om):
   con `past_hours: N` Open-Meteo empieza N horas antes de la hora en
   curso —y si además va `past_days`, manda past_hours—; solo con
   `past_days: N`, a las 00:00 de N días atrás; y la marina a las 00:00
   de hoy. Las horas 00 y 01 no se prueban: a esas horas «medianoche» y
   «ahora» coinciden y la trampa no muerde (lo dice sola si se pide).

   No conoce los fallos: conoce la FORMA. Si mañana alguien escribe una
   tarjeta nueva que lea `hourly[0]`, esto la caza sin que nadie le haya
   dicho que existe.

   Corre en `revisar.sh`: si falla, NO SE PUBLICA. Sin red y sin Vercel:
   cero llamadas, cero gasto (25-09: «recuerda lo del gasto de Vercel»).
   Para verlo en rojo sobre una copia rota, sin tocar los ficheros:
     PANTALLAS_DIR=/ruta/copia PANTALLAS_HORAS=7,20 node pantallas.cjs
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { console.log('  · jsdom no está; me salto las pantallas'); process.exit(0); }

/* PANTALLAS_DIR: para probar el guardia sobre una COPIA rota a propósito
   sin tocar los ficheros de verdad (así se vio en rojo el 25-09-2026). */
const aqui = process.env.PANTALLAS_DIR || __dirname;
const html = fs.readFileSync(path.join(aqui, 'index.html'), 'utf8');
const js   = fs.readFileSync(path.join(aqui, 'app.js'), 'utf8');
const css  = fs.readFileSync(path.join(aqui, 'styles.css'), 'utf8');

const HORAS = (process.env.PANTALLAS_HORAS || '2,7,13,20,23').split(',').map(Number);
const ORTO = 8 * 60 + 1, OCASO = 20 * 60 + 10;          // 08:01 y 20:10: el día de sus pantallazos
const p2 = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:00`;
const dia = d => iso(d).slice(0, 10);
const coma = v => v.toFixed(1).replace('.', ',');

const SITIOS = [{ name: 'BI BERMEO', lat: 43.413, lon: -2.7183 },
                { name: 'BI SOLLUBEMENDI', lat: 43.39, lon: -2.75 }];
const CARGADO = 'meteofrance_arome_france_hd';   // el que él tiene puesto (AROME HD)
const MOJADO = 'icon_seamless';                 // el único modelo que ve agua…
const HORAS_AGUA = new Set([3, 4, 21, 22]);     // …y a estas horas locales
const HORAS_RACHA = new Set([5, 15]);           // racha de 90 a estas horas (listón NO), 20 el resto
const HORA_TAPA_ICON = 10;                      // la tapa de ICON vale 5 solo a las 10:00 (para ver si se pega por hora)
const HORA_TORMENTA = 13;                       // a esa hora falsa el cargado lleva CAPE 800 y tapa 68 todo el día
const HORA_SIN_COMPARATIVA = 20;                // a esa hora falsa la comparativa (7 modelos) NO contesta
const HORA_SIN_FONDO = 13;                      // a esa hora `current` no trae mar de fondo (se lee de la serie)
const RACHA_DIA = [30, 90, 60, 35, 40, 45, 50, 25, 20, 30];   // hoy: tormenta con racha floja

/* ── LOS DATOS TRAMPA, construidos alrededor del reloj falso ────────── */
function trampa(fijo, hh) {
  const ahora = new Date(fijo);
  const hoy0 = new Date(fijo); hoy0.setHours(0, 0, 0, 0);
  const horaEnCurso = new Date(fijo); horaEnCurso.setMinutes(0, 0, 0);
  /* Open-Meteo decide `is_day` al PRINCIPIO de la hora: a las 08:00 con
     el orto a las 08:01 dice noche. Es exactamente lo que pintó la luna. */
  const isDay = h => (h * 60 >= ORTO && h * 60 < OCASO) ? 1 : 0;

  const valor = (om, campo, d) => {
    const h = d.getHours();
    const agua = om === MOJADO && HORAS_AGUA.has(h);
    const cargadoTormenta = om === CARGADO && hh === HORA_TORMENTA;
    switch (campo) {
      case 'is_day': return isDay(h);
      case 'weather_code': return agua ? 61 : 1;
      case 'precipitation': return agua ? 0.6 : 0;
      case 'precipitation_probability': return agua ? 60 : 5;
      case 'cape': return cargadoTormenta ? 800 : 40;
      /* El cargado NO publica la tapa (como AROME HD de verdad): la app se la
         pide a ICON, y así se ve si lo prestado se pega por hora. Solo a la
         hora de la tormenta el cargado la trae (68) para probar esa casilla. */
      case 'convective_inhibition':
        if (om === CARGADO) return cargadoTormenta ? 68 : null;
        return om === MOJADO && h === HORA_TAPA_ICON ? 5 : 120;
      case 'lifted_index': return 2;
      case 'wind_gusts_10m': return HORAS_RACHA.has(h) ? 90 : 20;
      case 'temperature_2m': case 'apparent_temperature': return h === 5 ? 14 : h === 15 ? 24 : 18;
      case 'relative_humidity_2m': return 70;
      case 'dew_point_2m': return 14;
      case 'visibility': return 20000;
      case 'surface_pressure': case 'pressure_msl': return 1013;
      case 'uv_index': return 3;
      case 'snowfall': case 'snow_depth': return 0;
      case 'freezing_level_height': return 3000;
      case 'convective_cloud_top': case 'convective_cloud_base': return null;   // sin nube de tormenta
      default:
        if (campo.startsWith('cloud_cover')) return 10;
        if (campo.startsWith('wind_speed')) return 12;
        if (campo.startsWith('wind_direction')) return 270;
        return 1;
    }
  };
  const diario = (campo, d, i) => {          // i = 0 es HOY
    switch (campo) {
      case 'sunrise': return `${dia(d)}T08:01`;
      case 'sunset':  return `${dia(d)}T20:10`;
      case 'temperature_2m_max': return 24;
      case 'temperature_2m_min': return 14;
      case 'precipitation_sum': return 0;
      case 'precipitation_probability_max': return 10;
      case 'weather_code': return i === 0 ? 95 : 1;
      case 'wind_gusts_10m_max': return RACHA_DIA[i] ?? 30;
      case 'uv_index_max': return 5;
      default: return 1;
    }
  };

  let comparativasCaidas = 0;
  const fc = (p) => {
    const lats = (p.get('latitude') || '43.42').split(','), lons = (p.get('longitude') || '-2.72').split(',');
    const modelos = (p.get('models') || 'best_match').split(',');
    const multi = modelos.length > 1;
    const hq = (p.get('hourly') || '').split(',').filter(Boolean);
    const cq = (p.get('current') || '').split(',').filter(Boolean);
    const dq = (p.get('daily') || '').split(',').filter(Boolean);
    const pastH = p.has('past_hours') ? Number(p.get('past_hours')) : null;
    const pastD = Number(p.get('past_days') || 0), fdays = Number(p.get('forecast_days') || 7);
    /* La comparativa de los siete modelos de UN sitio, caída a una hora:
       «Próxima lluvia» no puede decir «ninguno la ve» sin haberla mirado. */
    if (multi && lats.length === 1 && hh === HORA_SIN_COMPARATIVA) { comparativasCaidas++; return { _caida: true }; }
    /* Donde empieza la serie, como Open-Meteo (medido el 25-09-2026). */
    let inicio, nHoras;
    if (pastH !== null) { inicio = new Date(horaEnCurso.getTime() - pastH * 3600e3); nHoras = pastH + 16 * 24 + 1; }
    else { inicio = new Date(hoy0.getTime() - pastD * 86400e3); nHoras = (pastD + fdays) * 24; }
    /* La petición de `completar()` (un modelo que no es el cargado, para
       pocos campos) llega UNA HORA ANTES que la del cargado: es lo que
       pasa cuando las dos caen a caballo de un cambio de hora. Pegar por
       posición desplaza todo lo prestado; casar por hora, no. */
    const esComplemento = !multi && lats.length === 1 && modelos[0] !== CARGADO && hq.length && !hq.includes('temperature_2m');
    if (esComplemento) { inicio = new Date(inicio.getTime() - 3600e3); nHoras += 1; }
    const T = []; for (let i = 0; i < nHoras; i++) T.push(new Date(inicio.getTime() + i * 3600e3));
    const D = []; for (let i = -pastD; i < fdays; i++) D.push(new Date(hoy0.getTime() + i * 86400e3));
    const uno = (lat, lon) => {
      const out = { latitude: +lat, longitude: +lon, elevation: 30, timezone: 'Europe/Madrid',
                    utc_offset_seconds: 7200, hourly: { time: T.map(iso) } };
      if (multi) {
        for (const om of modelos) for (const k of hq) out.hourly[`${k}_${om}`] = T.map(d => valor(om, k, d));
        if (dq.length) {
          out.daily = { time: D.map(dia) };
          for (const om of modelos) for (const k of dq) out.daily[`${k}_${om}`] = D.map((d, idx) => diario(k, d, idx - pastD));
        }
      } else {
        const om = modelos[0];
        for (const k of hq) out.hourly[k] = T.map(d => valor(om, k, d));
        if (cq.length) {
          const c = { time: `${iso(ahora).slice(0, 14)}${p2(ahora.getMinutes())}`, interval: 900 };
          for (const k of cq) c[k] = valor(om, k, ahora);
          /* El `current` de verdad se evalúa AL MINUTO: a las 20:30 con el
             ocaso a las 20:10 dice noche. El de la serie horaria, al
             principio de la hora. */
          if (cq.includes('is_day')) { const m = ahora.getHours() * 60 + ahora.getMinutes(); c.is_day = (m >= ORTO && m < OCASO) ? 1 : 0; }
          out.current = c;
        }
        if (dq.length) {
          const dd = { time: D.map(dia) };
          for (const k of dq) dd[k] = D.map((d, idx) => diario(k, d, idx - pastD));
          out.daily = dd;
        }
      }
      return out;
    };
    return lats.length > 1 ? lats.map((la, i) => uno(la, lons[i])) : uno(lats[0], lons[0]);
  };

  /* La mar: la serie empieza a las 00:00 de HOY, como la de verdad. */
  const T3 = []; for (let i = 0; i < 72; i++) T3.push(new Date(hoy0.getTime() + i * 3600e3));
  const ola   = T3.map((_, i) => (i === 1 ? 3.0 : i >= 24 ? 2.0 : 1.0));
  const fondo = T3.map(d => Math.round((d.getHours() + 1) * 10) / 100);   // 00:00→0,1 · 07:00→0,8 · 20:00→2,1
  const iAhora = T3.findIndex(d => dia(d) === dia(ahora) && d.getHours() === ahora.getHours());
  const current = { time: iso(ahora), interval: 900, wave_height: 1.0, wave_period: 9, wave_direction: 320,
                    sea_surface_temperature: 20, swell_wave_period: 8.5, wind_wave_height: 0.25, ocean_current_velocity: 1 };
  /* A una de las horas `current` NO trae la mar de fondo, y la app tiene
     que leerla de la serie EN LA HORA EN CURSO, no en la medianoche. */
  if (hh !== HORA_SIN_FONDO) current.swell_wave_height = fondo[iAhora];
  const marine = {
    latitude: 43.42, longitude: -2.72, utc_offset_seconds: 7200, timezone: 'Europe/Madrid', elevation: 11,
    current_units: { wave_height: 'm', wave_period: 's', wave_direction: '°', sea_surface_temperature: '°C',
                     swell_wave_height: 'm', swell_wave_period: 's', wind_wave_height: 'm', ocean_current_velocity: 'km/h' },
    current,
    hourly_units: { wave_height: 'm', wave_period: 's', swell_wave_height: 'm', swell_wave_period: 's',
                    sea_level_height_msl: 'm', wind_wave_height: 'm', wave_direction: '°' },
    hourly: { time: T3.map(iso), sea_level_height_msl: T3.map(() => 0), wave_height: ola,
              wave_period: T3.map(() => 9), wave_direction: T3.map(() => 320), swell_wave_height: fondo,
              swell_wave_period: T3.map(() => 8.5), wind_wave_height: T3.map(() => 0.25) },
  };
  let iPico = iAhora; for (let i = iAhora; i < Math.min(72, iAhora + 24); i++) if (ola[i] > ola[iPico]) iPico = i;
  let iPico48 = iAhora; for (let i = iAhora; i < Math.min(72, iAhora + 48); i++) if (ola[i] > ola[iPico48]) iPico48 = i;

  /* Las estaciones: el primer sitio tiene Almike (Euskalmet) a 1,1 km;
     el segundo NO tiene Euskalmet que mida viento, y le toca FORUA (AEMET).
     Así en la tabla salen las DOS redes y el pie tiene que nombrarlas. */
  const hace = min => new Date(fijo - min * 60e3).toISOString();
  const almike = (lat, lon) => ({ nombre: 'Almike (Bermeo)', id: 'C0', lat: +lat, lon: +lon, altitud: 106,
    racha: 20.5, viento: 12.3, direccion: 270, temperatura: 18.2, humedad: 80, alturaAnemometro: 18,
    fuente: 'Euskalmet', medidoEn: hace(5), haceMinutos: 5, km: 1.1 });
  const forua = { nombre: 'FORUA', km: 2.9, altitud: 45, racha: 18, viento: 10, direccion: 250,
    temperatura: 19, humedad: 75, lluvia: 0, medidoEn: hace(35), haceMinutos: 35 };
  const euskalmet = (p) => {
    const puntos = (p.get('puntos') || '').split('|').filter(Boolean);
    if (!puntos.length) return { ok: true, hayClave: true, estaciones: [almike(43.41, -2.72)] };
    return { ok: true, hayClave: true, fuente: 'Euskalmet · Gobierno Vasco', consultado: new Date(fijo).toISOString(),
      estacionesLeidas: 1, estacionesPedidas: 1, estacionesCaidas: 0,
      puntos: puntos.map((x, i) => {
        if (i === 1) return { sinEstacion: true, miradas: 3, porque: 'ninguna de las cercanas mide viento' };
        const [la, lo] = x.split(','); return almike(la, lo);
      }) };
  };
  const aemet = (p) => {
    const puntos = (p.get('puntos') || '').split('|').filter(Boolean);
    if (!puntos.length) return { estaciones: [forua] };
    return { puntos: puntos.map(() => ({ estaciones: [forua] })) };
  };
  const marcador = { ok: true, muestras: 40, minimoParaFiarse: 5, cortoDesde: 10,
    porMagnitud: { racha: { unidad: 'km/h', minimo: 5, corto: 10 }, lluvia: { unidad: 'mm/h', minimo: 5, corto: 1 } },
    estaciones: [{ estacion: 'Matxitxako', red: 'Euskalmet', magnitud: 'racha', unidad: 'km/h', altitud: 433,
      muestras: 20, desde: hace(3000), hasta: hace(60),
      modelos: [{ modelo: 'AROME HD', n: 20, bastante: true, sesgo: -12.4, error: 13.1, cortas: 7, peor: -22.1, peorHora: hace(600) },
                { modelo: 'ICON', n: 20, bastante: true, sesgo: 3.1, error: 6, cortas: 0, peor: -4, peorHora: null },
                { modelo: 'GFS', n: 3, bastante: false, sesgo: null, error: null, cortas: 0, peor: null, peorHora: null }] }] };

  return { fc, marine, euskalmet, aemet, marcador, isDay,
           comparativasCaidas: () => comparativasCaidas,
           esperadoFondo: fondo[iAhora], fondo0: fondo[0],
           esperadoPico: ola[iPico], horaPico: T3[iPico], picoViejo: Math.max(...ola.slice(0, 24)),
           esperadoPico48: ola[iPico48], picoViejo48: Math.max(...ola.slice(0, 48)) };
}

/* ── EL NAVEGADOR DE MENTIRA, con el reloj parado a la hora falsa ──── */
function montar(fijo, TR) {
  const dom = new JSDOM(html, { url: 'https://pantallas.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  /* El reloj falso va DENTRO de la ventana: `hora-falsa.cjs` cambia el
     Date de node, y el app.js corre en el contexto de jsdom, que tiene el
     suyo. Mismo truco, otro sitio. */
  w.eval(`(function () {
    const Real = Date, fijo = ${fijo};
    Date = new Proxy(Real, {
      construct(T, a) { return a.length ? new T(...a) : new T(fijo); },
      apply(T) { return new T(fijo).toString(); },
      get(T, p) { return p === 'now' ? () => fijo : T[p]; },
    });
  })()`);
  /* El sitio, la lista y el modelo YA guardados: así el arranque de la
     app carga lo mismo que el guardia y no hay dos cargas en carrera. */
  w.localStorage.setItem('torre.place', JSON.stringify(SITIOS[0]));
  w.localStorage.setItem('torre.saved', JSON.stringify(SITIOS));
  w.localStorage.setItem('torre.model', JSON.stringify('arome'));
  const R = o => Promise.resolve(o && o._caida
    ? { ok: false, status: 500, json: () => Promise.reject(new Error('500')), text: () => Promise.resolve('caída') }
    : { ok: true, status: 200, json: () => Promise.resolve(o), text: () => Promise.resolve(JSON.stringify(o)) });
  w.fetch = (u = '') => {
    const s = String(u); const url = new URL(s, 'https://pantallas.test'); const p = url.searchParams;
    if (s.includes('/om')) {
      const api = p.get('api');
      if (api === 'fc') return R(TR.fc(p));
      if (api === 'elev') return R({ elevation: [100, 120] });
      if (api === 'aq') return R({ current: { european_aqi: 20, pm2_5: 3, pm10: 5, ozone: 50 } });
      if (api === 'marine' || api === 'mar') return R(TR.marine);
      return R({});
    }
    if (s.includes('marine-api')) return R(TR.marine);
    if (s.includes('/api/euskalmet')) return R(TR.euskalmet(p));
    if (s.includes('/estaciones')) return R(TR.aemet(p));
    if (s.includes('/api/marcador')) return R(TR.marcador);
    if (s.includes('/api/torres')) return R({ torres: [] });
    if (s.includes('/api/campo')) return R({ notas: [], total: 0 });
    if (s.includes('/rayos')) return R({ ambitos: {} });
    return R({});
  };
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.caches = { open: () => Promise.reject(new Error('sin caché')) };
  const reg = { showNotification: () => Promise.resolve(),
    pushManager: { getSubscription: () => Promise.resolve(null) }, active: { postMessage() {} } };
  w.navigator.serviceWorker = { register: () => Promise.resolve(reg), ready: new Promise(() => {}), addEventListener() {}, controller: null };
  w.navigator.geolocation = { getCurrentPosition() {} };
  w.scrollTo = () => {}; w.requestAnimationFrame = cb => setTimeout(cb, 0);
  w.__fallos = []; w.__cielo = [];
  w.addEventListener('error', e => w.__fallos.push(e.message));
  const errOrig = w.console.error, warnOrig = w.console.warn;
  w.console.error = (...a) => { w.__fallos.push(a.map(String).join(' ')); errOrig(...a); };
  /* `vigilarCielo` repinta EN SILENCIO cuando dos pantallas discrepan:
     aquí eso es un hallazgo, no un detalle. */
  w.console.warn = (...a) => { if (/^\[cielo\]/.test(String(a[0]))) w.__cielo.push(a.map(String).join(' ')); warnOrig(...a); };
  w.eval(js + ';window.__p={go,S,LS,setView,paint,listonRafaga,modeloDato,ventanaParte,nivelRacha};');
  return w;
}

const espera = ms => new Promise(r => setTimeout(r, ms));
const txt = (doc, sel) => (doc.querySelector(sel)?.textContent || '').replace(/\s+/g, ' ').trim();
const LUNA = /M20 14\.5A8\.6/;

/* ── LAS COMPROBACIONES: la FORMA de los fallos, no los casos ───────── */
async function unaHora(hh) {
  const fijo = new Date(); fijo.setHours(hh, 30, 0, 0);
  const TR = trampa(fijo.getTime(), hh);
  const F = [];
  const falla = m => F.push(m);
  const esperadoDia = d => { const m = d.getHours() * 60 + 30; return (m >= ORTO && m < OCASO) ? 1 : 0; };
  const hMar = d => p2(new Date(d).getHours()) + ':00';

  /* La trampa tiene que poder morder. Si el número «bueno» y el «viejo»
     coinciden, esta pasada no comprueba nada y hay que decirlo. */
  if (TR.picoViejo === TR.esperadoPico) falla('TRAMPA SIN DIENTES: el pico de las 24 primeras horas coincide con el de las 24 siguientes');
  if (TR.fondo0 === TR.esperadoFondo) falla('TRAMPA SIN DIENTES: la mar de fondo de medianoche coincide con la de ahora');
  if (TR.isDay(8) !== 0 || TR.isDay(20) !== 1) falla('TRAMPA SIN DIENTES: el is_day de las 08:00 y las 20:00 ya dice lo que toca');

  const w = montar(fijo.getTime(), TR);
  const A = w.__p, doc = w.document;
  try { await A.go({ ...SITIOS[0] }); } catch (e) { falla(`la app no arranca: ${e.message}`); return F; }
  await espera(150);
  for (const v of ['now', 'hours', 'days', 'sea']) { try { A.setView(v); } catch (e) { falla(`setView(${v}): ${e.message}`); } }
  try { A.paint(); } catch (e) { falla(`paint(): ${e.message}`); }
  try { A.setView('torres'); } catch (e) { falla(`Mis torres: ${e.message}`); }    // setView ya llama a cargarTorres()
  for (let i = 0; i < 40 && !Array.isArray(A.S.torres); i++) await espera(100);
  for (let i = 0; i < 40 && !(A.S.medidoTorres instanceof w.Map || A.S.medidoTorres instanceof Map); i++) await espera(100);
  for (let i = 0; i < 40 && !Array.isArray(A.S.lluviaTorres); i++) await espera(100);
  await espera(250);

  /* 1. Horas: de día o de noche, por el MEDIO de la hora contra el orto y el ocaso. */
  const hrs = A.S.data?.hours || [];
  if (hrs.length < 24) falla('Horas: no hay horas construidas');
  const malDia = hrs.slice(0, 48).filter(h => h.day !== esperadoDia(h.date))
    .map(h => `${p2(h.date.getHours())}:00→${h.day === 1 ? 'día' : 'noche'}`);
  if (malDia.length) falla(`Horas: día/noche mal en ${malDia.length} de 48 (orto 08:01, ocaso 20:10): ${malDia.slice(0, 4).join(' ')}`);

  /* 2. …y el DIBUJO va con eso: sol de día, luna de noche, en la tarjeta y en la portada. */
  let vistas = 0; const malDibujo = [], malDia2 = [];
  for (const c of doc.querySelectorAll('#hlist .hcard')) {
    const hora = Number((c.querySelector('.hcard__h')?.textContent || '').slice(0, 2));
    const svg = c.querySelector('.hcard__i svg'); const code = Number(svg?.dataset.code);
    if (!svg || !(code === 0 || code === 1 || code === 2)) continue;
    vistas++;
    const luna = LUNA.test(svg.innerHTML);
    const noche = esperadoDia(new Date(2000, 0, 1, hora)) === 0;
    if (luna !== noche) malDibujo.push(`${p2(hora)}:00 con ${luna ? 'luna' : 'sol'}`);
    if (svg.dataset.dia !== undefined && (svg.dataset.dia === '0') !== luna) malDia2.push(`${p2(hora)}:00`);
  }
  if (!vistas) falla('Horas: ninguna tarjeta con sol o luna (¿cambió el marcado de la tarjeta?)');
  if (malDibujo.length) falla(`Horas: el dibujo no va con la hora: ${malDibujo.slice(0, 4).join(', ')}`);
  if (malDia2.length) falla(`Horas: el dibujo y su data-dia no cuadran a las ${malDia2.slice(0, 3).join(', ')} (¿se redibujó la luna?)`);
  const grande = doc.querySelector('#nowIco svg');
  if (grande && /^[012]$/.test(grande.dataset.code || '')) {
    const luna = LUNA.test(grande.innerHTML);
    if (luna !== (esperadoDia(fijo) === 0)) falla(`Ahora: el dibujo grande va con ${luna ? 'luna' : 'sol'} a las ${p2(hh)}:30`);
  } else if (!grande) falla('Ahora: no hay dibujo grande');

  /* 3. La mar es la de AHORA, en las tres pantallas que la enseñan. */
  const mar = txt(doc, '#marAhora'), seaDet = txt(doc, '#seaDet'), ola = txt(doc, '#waveGraph');
  const fondo = mar.match(/Mar de fondo\s*([\d,]+)\s*m/);
  if (!fondo) falla('Ahora: no sale «Mar de fondo» con su número');
  else if (fondo[1] !== coma(TR.esperadoFondo))
    falla(`Ahora: «Mar de fondo ${fondo[1]} m» y a esta hora la serie da ${coma(TR.esperadoFondo)} m (a medianoche daba ${coma(TR.fondo0)})`);
  const sube = mar.match(/Sube a\s*([\d,]+)\s*m\s*a las (\d\d):00/);
  if (!sube) falla(`Ahora: no sale «Sube a X m a las HH:00» y la serie sube a ${coma(TR.esperadoPico)} a las ${hMar(TR.horaPico)}`);
  else {
    if (sube[1] !== coma(TR.esperadoPico))
      falla(`Ahora: «Sube a ${sube[1]} m» y el máximo de las próximas 24 h es ${coma(TR.esperadoPico)} (las 24 PRIMERAS de la serie dan ${coma(TR.picoViejo)})`);
    if (`${sube[2]}:00` !== hMar(TR.horaPico)) falla(`Ahora: «Sube a … a las ${sube[2]}:00» y el pico es a las ${hMar(TR.horaPico)}`);
  }
  const fondo2 = seaDet.match(/Mar de fondo\s*([\d,]+)\s*m/);
  if (!fondo2) falla('Mar: no sale «Mar de fondo» con su número en la pestaña Mar');
  else if (fondo2[1] !== coma(TR.esperadoFondo))
    falla(`Mar: «Mar de fondo ${fondo2[1]} m» y a esta hora la serie da ${coma(TR.esperadoFondo)} m${hh === HORA_SIN_FONDO ? ' (hoy current no la trae: se lee de la serie)' : ''}`);
  const fraseViento = t => t.match(/Mar de viento\s*[\d,]+\s*m\s*(.*?)\s*(?:Corriente|$)/);
  const viento1 = fraseViento(mar), viento2 = fraseViento(seaDet);
  if (viento1 && viento2 && viento1[1].trim() !== viento2[1].trim())
    falla(`Ahora y Mar no dicen lo mismo de la mar de viento: «${viento1[1].trim()}» / «${viento2[1].trim()}»`);
  const masAlto = ola.match(/lo más alto\s*([\d,]+)\s*m/);
  if (!masAlto) falla('Mar: la gráfica de oleaje no dice «lo más alto»');
  else if (masAlto[1] !== coma(TR.esperadoPico48))
    falla(`Mar: la gráfica dice «lo más alto ${masAlto[1]} m» y desde ahora el máximo de 48 h es ${coma(TR.esperadoPico48)} (desde la medianoche daría ${coma(TR.picoViejo48)})`);
  const ahoraOla = ola.match(/Ahora\s*([\d,]+)\s*m/);
  if (ahoraOla && ahoraOla[1] !== coma(1.0)) falla(`Mar: la gráfica dice «Ahora ${ahoraOla[1]} m» y la ola de ahora es 1,0`);

  /* 4. Las chapas de racha —del día y de la hora— llevan el color de LA RACHA. */
  const liston = A.listonRafaga();
  const nivel = r => (r >= liston.no ? 'no' : r >= liston.warn ? 'warn' : 'go');
  let chapas = 0; const malChapa = [];
  for (const li of doc.querySelectorAll('#dlist .dcard')) {
    const g = li.querySelector('.dcard__g'); if (!g) continue;
    const m = (g.textContent || '').match(/Racha\s*(\d+)/); if (!m) continue;
    chapas++;
    if (g.dataset.s !== nivel(Number(m[1])))
      malChapa.push(`${(li.querySelector('.dcard__d')?.textContent || '').trim()} racha ${m[1]} → chapa «${g.dataset.s || 'sin marca'}» (el día va «${li.dataset.s}»)`);
  }
  if (!chapas) falla('10 días: no hay chapas de racha');
  if (malChapa.length) falla(`10 días: la chapa de la racha no lleva el color de la racha: ${malChapa.slice(0, 3).join(' · ')}`);
  let chapasH = 0; const malChapaH = [];
  for (const c of doc.querySelectorAll('#hlist .hcard')) {
    const g = c.querySelector('.hcard__g'); if (!g) continue;
    const m = (g.textContent || '').match(/Racha\s*(\d+)/); if (!m) continue;
    chapasH++;
    if (g.dataset.s !== nivel(Number(m[1])))
      malChapaH.push(`${(c.querySelector('.hcard__h')?.textContent || '').trim()} racha ${m[1]} → chapa «${g.dataset.s || 'sin marca'}» (la hora va «${c.dataset.s}»)`);
  }
  if (!chapasH) falla('Horas: no hay chapas de racha');
  if (malChapaH.length) falla(`Horas: la chapa de la racha no lleva el color de la racha: ${malChapaH.slice(0, 3).join(' · ')}`);
  if (/\.(dcard|hcard)\[data-s=[^\]]*\][^{,]*\.(dcard|hcard)__g/.test(css))
    falla('styles.css: hay una regla que colorea la chapa de racha por el data-s del DÍA o de la HORA');
  if (/\.(dcard|hcard)__g[^{]*\{[^}]*var\(--c\)/.test(css))
    falla('styles.css: la chapa de racha coge var(--c), que es el color del día/hora');

  /* 5. Mis torres: el agua que ve OTRO modelo lleva su nombre, y sus horas son las suyas. */
  const dueno = A.modeloDato()?.name;
  const Ls = (A.S.lluviaTorres || []).filter(L => L && L.llueve);
  if (Ls.length !== SITIOS.length) falla(`Mis torres: ${Ls.length} de ${SITIOS.length} tarjetas ven el agua de ICON (03, 04, 21 y 22 h)`);
  const HORAS_TXT = { 2: [/03:00/, /22:00/], 7: [/21:00/, /23:00/], 13: [/21:00/, /23:00/], 20: [/escampa a las 23:00/], 23: [/03:00/, /22:00/] };
  for (const L of Ls) {
    const t = doc.querySelector(`.tor[data-ir="${L.k}"] .tor__agua`);
    const tx = (t?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t) { falla(`Mis torres: ${L.k} sin línea de agua`); continue; }
    if (L.quien !== 'ICON') falla(`Mis torres: ${L.k} no sabe quién ve el agua (quien=${L.quien}); la trampa moja solo con ICON`);
    if (dueno !== 'ICON' && !tx.includes('lo ve ICON')) falla(`Mis torres: «${tx.slice(0, 70)}» sin decir que lo ve ICON (el cargado es ${dueno})`);
    for (const rx of HORAS_TXT[hh] || []) if (!rx.test(tx)) falla(`Mis torres: «${tx.slice(0, 80)}» y el agua de ICON va ${rx}`);
  }

  /* 6. Mis estaciones: cabeceras resueltas y con nombre, pie con las dos redes,
        la pista con sus 72 h de verdad, y ninguna cifra en rojo diciendo «aguanta». */
  const torres = txt(doc, '#torres');
  if (/midiendo…/.test(torres)) falla('Mis estaciones: sigue «midiendo…» con Euskalmet y AEMET ya contestados');
  const cabeceras = [...doc.querySelectorAll('#torres th')].map(t => t.textContent.replace(/\s+/g, ' ').trim()).filter(t => t.startsWith('ESTACIÓN'));
  if (cabeceras.length !== SITIOS.length) falla(`Mis estaciones: ${cabeceras.length} cabeceras ESTACIÓN para ${SITIOS.length} sitios`);
  if (!/Almike/.test(cabeceras[0] || '')) falla(`Mis estaciones: al primer sitio le toca Almike y la cabecera dice «${cabeceras[0] || ''}»`);
  if (!/FORUA/.test(cabeceras[1] || '')) falla(`Mis estaciones: al segundo sitio le toca FORUA y la cabecera dice «${cabeceras[1] || ''}»`);
  const redes = new Set();
  for (const c of cabeceras) { if (/Euskalmet/.test(c)) redes.add('Euskalmet'); if (/AEMET/.test(c)) redes.add('AEMET'); }
  const pie = [...doc.querySelectorAll('p')].map(p => p.textContent.replace(/\s+/g, ' ')).find(t => /Anem[oó]metros de/.test(t)) || '';
  if (!pie) falla('Mis estaciones: falta el pie «Anemómetros de …»');
  for (const r of redes) if (pie && !pie.includes(r)) falla(`Mis estaciones: el pie dice «${pie.slice(0, 55).trim()}…» y en la tabla hay una estación de ${r}`);
  if ((A.S.medidoTorres?.size ?? 0) !== SITIOS.length) falla(`Mis estaciones: medidas para ${A.S.medidoTorres?.size ?? 'ningún'} sitio de ${SITIOS.length}`);
  const pista = A.S.torres?.[0]?.pista;
  if (!pista || !(pista.mirados >= 72)) falla(`Mis torres: la pista solo ha mirado ${pista?.mirados ?? 'ninguna'} horas pasadas (se piden 3 días)`);
  if (/no hay más horas pasadas cargadas/.test(torres)) falla('Mis torres: la línea de la pista dice que no hay horas pasadas cargadas, y se piden 3 días');
  for (const c of doc.querySelectorAll('#torres .tor__d[data-a="2"]'))
    if (/aguanta/.test(c.textContent)) { falla(`Mis estaciones: una cifra en ROJO dice «aguanta»: «${c.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)}»`); break; }

  /* 7. Marcador: contesta, con lo que le han contestado, y con las palabras enteras. */
  const marc = txt(doc, '#marcador');
  if (/Cargando el marcador/.test(marc)) falla('Marcador: sigue en «Cargando…» con la respuesta contestada');
  if (!/Matxitxako/.test(marc)) falla('Marcador: no enseña la estación que contesta la trampa');
  if (!/AROME HD\s*se queda\s*12 km\/h corto/.test(marc)) falla(`Marcador: AROME HD va 12,4 corto y no lo dice así: «${marc.slice(0, 120)}»`);
  if (!/en 20 comparaciones/.test(marc)) falla('Marcador: no dice en cuántas comparaciones (20)');
  if (/\d+ veces(?! más de)/.test(marc)) falla('Marcador: «N veces» sin decir de qué');

  /* 8. Ahora: la tormenta sin contradecirse, la próxima lluvia sin afirmar lo que no se ha mirado,
        la hora de la mínima, y lo prestado pegado POR HORA. */
  const ahoraTxt = txt(doc, '#now') || txt(doc, '.view[data-v="now"]');
  const casillaTormenta = [...doc.querySelectorAll('.dt')].map(d => d.textContent.replace(/\s+/g, ' ')).find(t => /^\s*Tormenta/.test(t)) || '';
  if (hh === HORA_TORMENTA) {
    if (!/puede romper/.test(casillaTormenta)) falla(`Ahora: con CAPE 800 y tapa 68 la casilla Tormenta no dice «puede romper»: «${casillaTormenta.slice(0, 90)}»`);
    if (/aguanta/.test(casillaTormenta)) falla(`Ahora: la casilla Tormenta dice «aguanta» y «puede romper» a la vez: «${casillaTormenta.slice(0, 90)}»`);
  }
  const casillaLluvia = [...doc.querySelectorAll('.dt')].map(d => d.textContent.replace(/\s+/g, ' ')).find(t => /Próxima lluvia/.test(t)) || '';
  if (hh === HORA_SIN_COMPARATIVA) {
    if (!TR.comparativasCaidas()) falla('TRAMPA: la comparativa no llegó a pedirse, así que no se puede saber qué dice «Próxima lluvia» sin ella');
    if (/ninguno de los modelos la ve/.test(casillaLluvia)) falla(`Ahora: «Próxima lluvia» dice «ninguno de los modelos la ve» con la comparativa CAÍDA: «${casillaLluvia.slice(0, 90)}»`);
    if (!/no he podido preguntarles/.test(casillaLluvia)) falla(`Ahora: con la comparativa caída «Próxima lluvia» no dice que no ha podido preguntar: «${casillaLluvia.slice(0, 90)}»`);
  }
  const rango = txt(doc, '#nowRange');
  if (!/Mín 14°\s*a las 05:00/.test(rango)) falla(`Ahora: «${rango}» — la mínima del día (14°) es a las 05:00 y no lo dice`);
  if (!/Máx 24°\s*a las 15:00/.test(rango)) falla(`Ahora: «${rango}» — la máxima del día (24°) es a las 15:00 y no lo dice`);
  const tarjeta = h => [...doc.querySelectorAll('#hlist .hcard')].find(c => (c.querySelector('.hcard__h')?.textContent || '').startsWith(p2(h)));
  const c10 = tarjeta(HORA_TAPA_ICON), c09 = tarjeta(HORA_TAPA_ICON - 1);
  const capeTxt = c => (c?.querySelector('.hcard__c')?.textContent || '').replace(/\s+/g, ' ');
  if (hh === HORA_TORMENTA) { /* a esta hora el cargado trae su propia tapa: no se presta nada */ }
  else if (!c10 || !c09) falla('Horas: no encuentro las tarjetas de las 09:00 y las 10:00');
  else {
    if (!/tapa 5\b/.test(capeTxt(c10))) falla(`Horas: a las 10:00 ICON da tapa 5 y la tarjeta dice «${capeTxt(c10).slice(0, 60)}» (¿lo prestado se pegó por posición?)`);
    if (!/tapa 120\b/.test(capeTxt(c09))) falla(`Horas: a las 09:00 ICON da tapa 120 y la tarjeta dice «${capeTxt(c09).slice(0, 60)}» (¿lo prestado se pegó por posición?)`);
  }

  /* 9. El parte: la pestaña encendida es la del día que se enseña. */
  const on = doc.querySelector('#parteDias .pdia.is-on');
  const salto = A.ventanaParte().salto;
  if (!on) falla('Mis torres: ninguna pestaña del parte encendida');
  else if (Number(on.dataset.dia) !== salto) falla(`Mis torres: la pestaña encendida es la ${on.dataset.dia} y el parte enseña el día ${salto}`);

  /* 10. Lo genérico, en cada zona pintada: nada de NaN, undefined, decimales
      con punto (los millares con punto, «2.680», sí valen) ni carteles de
      «cargando» cuando ya está todo contestado; ni avisos del cielo. */
  const ZONAS = ['#cover', '#parts', '#nowAemet', '#nowRange', '#marAhora', '#seaDet', '#waveGraph', '#hlist', '#dlist', '#torres', '#marcador', '#parteDias'];
  for (const z of ZONAS) {
    let t = txt(doc, z); if (!t) continue;
    t = t.replace(/v?\d{4}\.\d{2}\.\d{2}(-\d{4})?/g, '').replace(/CC BY[-\w]* \d\.\d/g, '');   // el sello y la licencia de la foto
    const m = t.match(/\bNaN\b|\bundefined\b|\bnull\b|\[object|Infinity|Invalid Date|a las NaN|—°/);
    if (m) falla(`${z}: sale «${m[0]}»: …${t.slice(Math.max(0, m.index - 30), m.index + 30)}…`);
    for (const d of t.matchAll(/\d\.(\d+)/g)) {
      if (d[1].length === 3) continue;                       // millares: 2.680
      falla(`${z}: decimal con punto «${d[0]}» (aquí van con coma): …${t.slice(Math.max(0, d.index - 30), d.index + 30)}…`);
      break;
    }
    const ph = t.match(/midiendo…|Cargando emplazamientos|Cargando el marcador|Consultando estaciones|Consultando \d+ emplazamiento|Evaluando condiciones/);
    if (ph) falla(`${z}: se queda en «${ph[0]}» con todo contestado`);
  }
  for (const e of w.__cielo.slice(0, 2)) falla(`el vigilante del cielo ha tenido que repintar: ${String(e).slice(0, 140)}`);
  for (const e of w.__fallos.slice(0, 3)) falla(`la app ha soltado un error: ${String(e).slice(0, 120)}`);
  /* La app deja temporizadores puestos (el pulso cada 10 min, el reloj).
     Sin cerrar la ventana, el proceso no termina nunca cuando todo va
     bien — la primera pasada entera se quedó colgada en verde. */
  try { w.close(); } catch { /* nada */ }
  return F;
}

(async () => {
  let mal = 0;
  for (const hh of HORAS) {
    const F = await unaHora(hh);
    if (!F.length) { console.log(`    ✓ a las ${p2(hh)}:30 las pantallas dicen lo que toca`); continue; }
    mal += F.length;
    console.log(`    ✗ a las ${p2(hh)}:30:`);
    for (const f of F) console.log(`        · ${f}`);
  }
  if (mal) {
    console.log(`\n  ✗ PANTALLAS: ${mal} cosa${mal > 1 ? 's' : ''} que no dice${mal > 1 ? 'n' : ''} lo que toca. No se publica.`);
    process.exit(1);
  }
  console.log(`    ✓ pantallas: Horas, Ahora, Mar, 10 días, Mis torres, Mis estaciones, el parte y el marcador, a ${HORAS.length} horas del día`);
  process.exit(0);
})().catch(e => { console.log(`  ✗ pantallas.cjs se ha roto: ${e.stack || e}`); process.exit(1); });
