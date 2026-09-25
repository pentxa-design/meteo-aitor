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
   ESAS pantallas A ESA HORA con datos en los que se note.

   Esto arranca la app ENTERA en un navegador de mentira (como
   `paridad.cjs`), con el reloj puesto a las 02:30, 07:30, 13:30 y 20:30,
   y con DATOS TRAMPA QUE CAMBIAN CADA HORA: la mar de fondo vale 0,1 m a
   las 00:00, 0,8 a las 07:00, 2,1 a las 20:00; el pico de ola de las 24
   PRIMERAS horas de la serie (3,0) no es el de las 24 SIGUIENTES (2,0);
   el orto es a las 08:01, para que el `is_day` de Open-Meteo diga
   «noche» al principio de las 08:00; la racha de cada día es distinta y
   el día de tormenta lleva la racha más floja. Una pantalla que lea el
   índice 0, la hora fija o el color del vecino enseña un número que NO
   es el que toca, y aquí se ve.

   No conoce los seis fallos: conoce la FORMA. Si mañana alguien escribe
   una tarjeta nueva que lea `hourly[0]`, esto la caza sin que nadie le
   haya dicho que existe.

   Corre en `revisar.sh`: si falla, NO SE PUBLICA. Sin red y sin Vercel:
   cero llamadas, cero gasto (25-09: «recuerda lo del gasto de Vercel»).
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

/* Las horas a las que se mira: madrugada (guardia), su hora (07:13 fue
   el pantallazo), mediodía y tarde-noche. Se puede cambiar con
   PANTALLAS_HORAS=2,7 para depurar. */
const HORAS = (process.env.PANTALLAS_HORAS || '2,7,13,20').split(',').map(Number);
const ORTO = 8 * 60 + 1, OCASO = 20 * 60 + 10;          // 08:01 y 20:10: el día de sus pantallazos
const p2 = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:00`;
const dia = d => iso(d).slice(0, 10);
const coma = v => v.toFixed(1).replace('.', ',');

const SITIOS = [{ name: 'BI BERMEO', lat: 43.413, lon: -2.7183 },
                { name: 'BI SOLLUBEMENDI', lat: 43.39, lon: -2.75 }];
const MOJADO = 'icon_seamless';                 // el único modelo que ve agua…
const HORAS_AGUA = new Set([3, 4, 21, 22]);     // …y a estas horas locales
const RACHA_DIA = [30, 90, 60, 35, 40, 45, 50, 25, 20, 30];   // hoy: tormenta con racha floja

/* ── LOS DATOS TRAMPA, construidos alrededor del reloj falso ────────── */
function trampa(fijo) {
  const ahora = new Date(fijo);
  const hoy0 = new Date(fijo); hoy0.setHours(0, 0, 0, 0);
  /* Open-Meteo decide `is_day` al PRINCIPIO de la hora: a las 08:00 con
     el orto a las 08:01 dice noche. Es exactamente lo que pintó la luna. */
  const isDay = hh => (hh * 60 >= ORTO && hh * 60 < OCASO) ? 1 : 0;

  const valor = (om, campo, d) => {
    const hh = d.getHours();
    const agua = om === MOJADO && HORAS_AGUA.has(hh);
    switch (campo) {
      case 'is_day': return isDay(hh);
      case 'weather_code': return agua ? 61 : 1;
      case 'precipitation': return agua ? 0.6 : 0;
      case 'precipitation_probability': return agua ? 60 : 5;
      case 'cape': return 40;
      case 'convective_inhibition': return 120;
      case 'lifted_index': return 2;
      case 'wind_gusts_10m': return 20;
      case 'temperature_2m': case 'apparent_temperature': return 20;
      case 'relative_humidity_2m': return 70;
      case 'dew_point_2m': return 14;
      case 'visibility': return 20000;
      case 'surface_pressure': case 'pressure_msl': return 1013;
      case 'uv_index': return 3;
      case 'snowfall': case 'snow_depth': return 0;
      case 'freezing_level_height': return 3000;
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

  const fc = (p) => {
    const lats = (p.get('latitude') || '43.42').split(','), lons = (p.get('longitude') || '-2.72').split(',');
    const modelos = (p.get('models') || 'best_match').split(',');
    const multi = modelos.length > 1;
    const hq = (p.get('hourly') || '').split(',').filter(Boolean);
    const cq = (p.get('current') || '').split(',').filter(Boolean);
    const dq = (p.get('daily') || '').split(',').filter(Boolean);
    const past = Number(p.get('past_days') || 0), fdays = Number(p.get('forecast_days') || 7);
    const T = []; for (let i = -24 * past; i < 24 * fdays; i++) T.push(new Date(hoy0.getTime() + i * 3600e3));
    const D = []; for (let i = -past; i < fdays; i++) D.push(new Date(hoy0.getTime() + i * 86400e3));
    const uno = (lat, lon) => {
      const out = { latitude: +lat, longitude: +lon, elevation: 30, timezone: 'Europe/Madrid',
                    utc_offset_seconds: 7200, hourly: { time: T.map(iso) } };
      if (multi) {
        for (const om of modelos) for (const k of hq) out.hourly[`${k}_${om}`] = T.map(d => valor(om, k, d));
      } else {
        const om = modelos[0];
        for (const k of hq) out.hourly[k] = T.map(d => valor(om, k, d));
        if (cq.length) {
          const c = { time: iso(ahora), interval: 900 };
          for (const k of cq) c[k] = valor(om, k, ahora);
          /* El `current` de verdad se evalúa AL MINUTO: a las 20:30 con el
             ocaso a las 20:10 dice noche. El de la serie horaria, al
             principio de la hora. La primera pasada de esta guardia
             tomó el de la hora para los dos y cantó un fallo que era de
             la trampa, no de la app. */
          if (cq.includes('is_day')) { const m = ahora.getHours() * 60 + ahora.getMinutes(); c.is_day = (m >= ORTO && m < OCASO) ? 1 : 0; }
          out.current = c;
        }
        if (dq.length) {
          const dd = { time: D.map(dia) };
          for (const k of dq) dd[k] = D.map((d, idx) => diario(k, d, idx - past));
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
  const marine = {
    latitude: 43.42, longitude: -2.72, utc_offset_seconds: 7200, timezone: 'Europe/Madrid', elevation: 11,
    current_units: { wave_height: 'm', wave_period: 's', wave_direction: '°', sea_surface_temperature: '°C',
                     swell_wave_height: 'm', swell_wave_period: 's', wind_wave_height: 'm', ocean_current_velocity: 'km/h' },
    current: { time: iso(ahora), interval: 900, wave_height: 1.0, wave_period: 9, wave_direction: 320,
               sea_surface_temperature: 20, swell_wave_height: fondo[iAhora], swell_wave_period: 8.5,
               wind_wave_height: 0.2, ocean_current_velocity: 1 },
    hourly_units: { wave_height: 'm', wave_period: 's', swell_wave_height: 'm', swell_wave_period: 's',
                    sea_level_height_msl: 'm', wind_wave_height: 'm', wave_direction: '°' },
    hourly: { time: T3.map(iso), sea_level_height_msl: T3.map(() => 0), wave_height: ola,
              wave_period: T3.map(() => 9), wave_direction: T3.map(() => 320), swell_wave_height: fondo,
              swell_wave_period: T3.map(() => 8.5), wind_wave_height: T3.map(() => 0.2) },
  };

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
           esperadoFondo: fondo[iAhora], fondo0: fondo[0],
           esperadoPico: Math.max(...ola.slice(iAhora, iAhora + 24)),
           picoViejo: Math.max(...ola.slice(0, 24)) };
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
  const R = o => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(o), text: () => Promise.resolve(JSON.stringify(o)) });
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
  w.__fallos = [];
  w.addEventListener('error', e => w.__fallos.push(e.message));
  const errOrig = w.console.error;
  w.console.error = (...a) => { w.__fallos.push(a.map(String).join(' ')); errOrig(...a); };
  w.eval(js + ';window.__p={go,S,LS,cargarTorres,setView,paint,listonRafaga,modeloDato};');
  return w;
}

const espera = ms => new Promise(r => setTimeout(r, ms));
const txt = (doc, sel) => (doc.querySelector(sel)?.textContent || '').replace(/\s+/g, ' ').trim();

/* ── LAS COMPROBACIONES: la FORMA de los fallos, no los seis ────────── */
async function unaHora(hh) {
  const fijo = new Date(); fijo.setHours(hh, 30, 0, 0);
  const TR = trampa(fijo.getTime());
  const F = [];
  const falla = m => F.push(m);

  /* La trampa tiene que poder morder. Si el número «bueno» y el «viejo»
     coinciden, esta pasada no comprueba nada y hay que decirlo. */
  if (TR.picoViejo === TR.esperadoPico) falla('TRAMPA SIN DIENTES: el pico de las 24 primeras horas coincide con el de las 24 siguientes');
  if (TR.fondo0 === TR.esperadoFondo) falla('TRAMPA SIN DIENTES: la mar de fondo de medianoche coincide con la de ahora');
  if (TR.isDay(8) !== 0 || TR.isDay(20) !== 1) falla('TRAMPA SIN DIENTES: el is_day de las 08:00 y las 20:00 ya dice lo que toca');

  const w = montar(fijo.getTime(), TR);
  const A = w.__p, doc = w.document;
  A.LS.set('model', 'arome'); A.S.model = 'arome';
  A.S.saved = SITIOS.map(s => ({ ...s }));
  try { await A.go({ ...SITIOS[0] }); } catch (e) { falla(`la app no arranca: ${e.message}`); return F; }
  await espera(150);
  for (const v of ['now', 'hours', 'days', 'sea']) { try { A.setView(v); } catch (e) { falla(`setView(${v}): ${e.message}`); } }
  try { A.paint(); } catch (e) { falla(`paint(): ${e.message}`); }
  try { A.setView('torres'); await A.cargarTorres(); } catch (e) { falla(`Mis torres: ${e.message}`); }
  for (let i = 0; i < 30 && !(A.S.medidoTorres instanceof w.Map || A.S.medidoTorres instanceof Map) ; i++) await espera(100);
  for (let i = 0; i < 30 && !Array.isArray(A.S.lluviaTorres); i++) await espera(100);
  await espera(250);

  /* 1. Horas: de día o de noche, por el MEDIO de la hora contra el orto y el ocaso. */
  const esperadoDia = d => { const m = d.getHours() * 60 + 30; return (m >= ORTO && m < OCASO) ? 1 : 0; };
  const hrs = A.S.data?.hours || [];
  if (hrs.length < 24) falla('Horas: no hay horas construidas');
  const malDia = hrs.slice(0, 48).filter(h => h.day !== esperadoDia(h.date))
    .map(h => `${p2(h.date.getHours())}:00→${h.day === 1 ? 'día' : 'noche'}`);
  if (malDia.length) falla(`Horas: día/noche mal en ${malDia.length} de 48 (orto 08:01, ocaso 20:10): ${malDia.slice(0, 4).join(' ')}`);

  /* 2. …y el DIBUJO de la tarjeta va con eso: sol de día, luna de noche. */
  let vistas = 0; const malDibujo = [];
  for (const c of doc.querySelectorAll('#hlist .hcard')) {
    const hora = Number((c.querySelector('.hcard__h')?.textContent || '').slice(0, 2));
    const svg = c.querySelector('.hcard__i svg'); const code = Number(svg?.dataset.code);
    if (!svg || !(code === 0 || code === 1 || code === 2)) continue;
    vistas++;
    const luna = /M20 14\.5A8\.6/.test(svg.innerHTML);
    const noche = esperadoDia(new Date(2000, 0, 1, hora)) === 0;
    if (luna !== noche) malDibujo.push(`${p2(hora)}:00 con ${luna ? 'luna' : 'sol'}`);
  }
  if (!vistas) falla('Horas: ninguna tarjeta con sol o luna (¿cambió el marcado de la tarjeta?)');
  if (malDibujo.length) falla(`Horas: el dibujo no va con la hora: ${malDibujo.slice(0, 4).join(', ')}`);

  /* 3. La mar de la portada es la de AHORA, y «sube a» mira las 24 SIGUIENTES. */
  const mar = txt(doc, '#marAhora');
  const fondo = mar.match(/Mar de fondo\s*([\d,]+)\s*m/);
  if (!fondo) falla('Ahora: no sale «Mar de fondo» con su número');
  else if (fondo[1] !== coma(TR.esperadoFondo))
    falla(`Ahora: «Mar de fondo ${fondo[1]} m» y a esta hora la serie da ${coma(TR.esperadoFondo)} m (a medianoche daba ${coma(TR.fondo0)})`);
  const sube = mar.match(/Sube a\s*([\d,]+)\s*m/);
  if (!sube) falla(`Ahora: no sale «Sube a X m en las próximas 24 h» y la serie sube a ${coma(TR.esperadoPico)}`);
  else if (sube[1] !== coma(TR.esperadoPico))
    falla(`Ahora: «Sube a ${sube[1]} m» y el máximo de las próximas 24 h es ${coma(TR.esperadoPico)} (las 24 PRIMERAS de la serie dan ${coma(TR.picoViejo)})`);
  const fondo2 = txt(doc, '#seaCard').match(/Mar de fondo\s*([\d,]+)\s*m/);
  if (fondo2 && fondo2[1] !== coma(TR.esperadoFondo))
    falla(`Mar: «Mar de fondo ${fondo2[1]} m» y a esta hora la serie da ${coma(TR.esperadoFondo)} m`);

  /* 4. 10 días: la chapa de la racha lleva el color de LA RACHA, no el del día. */
  const liston = A.listonRafaga();
  let chapas = 0; const malChapa = [];
  for (const li of doc.querySelectorAll('#dlist .dcard')) {
    const g = li.querySelector('.dcard__g'); if (!g) continue;
    const m = (g.textContent || '').match(/Racha\s*(\d+)/); if (!m) continue;
    chapas++;
    const r = Number(m[1]);
    const esperado = r >= liston.no ? 'no' : r >= liston.warn ? 'warn' : 'go';
    if (g.dataset.s !== esperado)
      malChapa.push(`${(li.querySelector('.dcard__d')?.textContent || '').trim()} racha ${r} → chapa «${g.dataset.s || 'sin marca'}» (el día va «${li.dataset.s}»)`);
  }
  if (!chapas) falla('10 días: no hay chapas de racha');
  if (malChapa.length) falla(`10 días: la chapa de la racha no lleva el color de la racha: ${malChapa.slice(0, 3).join(' · ')}`);
  if (/\.dcard\[data-s=[^\]]*\]\s+\.dcard__g/.test(css))
    falla('styles.css: hay una regla que colorea .dcard__g por el data-s del DÍA (.dcard[data-s=…] .dcard__g)');

  /* 5. Mis torres: si el agua la ve OTRO modelo, se dice quién. */
  const dueno = A.modeloDato()?.name;
  const Ls = (A.S.lluviaTorres || []).filter(L => L && L.llueve);
  if (!Ls.length) falla('Mis torres: la trampa da agua de ICON a las 03, 04, 21 y 22 y ninguna tarjeta ve lluvia');
  for (const L of Ls) {
    const t = doc.querySelector(`.tor[data-ir="${L.k}"] .tor__agua`);
    const tx = (t?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t) { falla(`Mis torres: ${L.k} sin línea de agua`); continue; }
    if (L.quien && L.quien !== dueno && !tx.includes(`lo ve ${L.quien}`))
      falla(`Mis torres: «${tx.slice(0, 70)}» sin decir que lo ve ${L.quien} (el cargado es ${dueno})`);
  }

  /* 6. Mis estaciones: la cabecera resuelve, y el pie nombra las redes que hay en la tabla. */
  const torres = txt(doc, '#torres');
  if (/midiendo…/.test(torres)) falla('Mis estaciones: sigue «midiendo…» con Euskalmet y AEMET ya contestados');
  const cabeceras = [...doc.querySelectorAll('#torres th')].map(t => t.textContent.replace(/\s+/g, ' ').trim()).filter(t => t.startsWith('ESTACIÓN'));
  if (!cabeceras.length) falla('Mis estaciones: ninguna cabecera ESTACIÓN');
  const redes = new Set();
  for (const c of cabeceras) { if (/Euskalmet/.test(c)) redes.add('Euskalmet'); if (/AEMET/.test(c)) redes.add('AEMET'); }
  if (!redes.has('Euskalmet')) falla(`Mis estaciones: la trampa contesta Almike (Euskalmet, 1,1 km) y ninguna cabecera la enseña: «${cabeceras[0] || ''}»`);
  if (!redes.has('AEMET')) falla(`Mis estaciones: al segundo sitio le toca FORUA (AEMET) y ninguna cabecera la enseña: «${cabeceras[1] || ''}»`);
  const pie = [...doc.querySelectorAll('p')].map(p => p.textContent.replace(/\s+/g, ' ')).find(t => /Anem[oó]metros de/.test(t)) || '';
  if (!pie) falla('Mis estaciones: falta el pie «Anemómetros de …»');
  for (const r of redes) if (pie && !pie.includes(r)) falla(`Mis estaciones: el pie dice «${pie.slice(0, 55).trim()}…» y en la tabla hay una estación de ${r}`);
  if ((A.S.medidoTorres?.size ?? 0) !== SITIOS.length) falla(`Mis estaciones: medidas para ${A.S.medidoTorres?.size ?? 'ningún'} sitio de ${SITIOS.length}`);

  /* 7. Marcador: contesta, y con lo que le han contestado. */
  const marc = txt(doc, '#marcador');
  if (/Cargando el marcador/.test(marc)) falla('Marcador: sigue en «Cargando…» con la respuesta contestada');
  if (!/Matxitxako/.test(marc)) falla('Marcador: no enseña la estación que contesta la trampa');

  /* 8. Lo genérico, en cada zona pintada: nada de NaN, undefined, decimales
     con punto (los millares con punto, «2.680», sí valen) ni carteles de
     «cargando» cuando ya está todo contestado. */
  const ZONAS = ['#cover', '#parts', '#nowAemet', '#marAhora', '#seaCard', '#hlist', '#dlist', '#torres', '#marcador'];
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
  console.log(`    ✓ pantallas: Horas, Ahora, Mar, 10 días, Mis torres, Mis estaciones y marcador, a ${HORAS.length} horas del día`);
  process.exit(0);
})().catch(e => { console.log(`  ✗ pantallas.cjs se ha roto: ${e.stack || e}`); process.exit(1); });
