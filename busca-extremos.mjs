/* ═══════════════════════════════════════════════════════════════════
   BUSCA-EXTREMOS — dónde está hoy lo gordo, para probar la app allí
   ───────────────────────────────────────────────────────────────────
   Suyo, 17-09-2026, con libre hasta el lunes: «ir mirando cómo va nuestra
   app en sitios donde va a caer rayos, fuertes vientos, a ver cómo se
   porta» · «busca sitios en cualquier lado del mundo o España» · «hay
   que forzar la app para que busque errores de CAPE, vientos, lluvias
   donde los haya y así podemos verificar qué es lo que marca y cómo» ·
   «pruebas reales».

   Esto NO es la app: es la caña de pescar. Recorre una lista de sitios
   (capitales de España y ciudades del mundo con aeropuerto), pide a
   Open-Meteo el día de hoy (racha máxima, CAPE máximo, lluvia total) y
   saca los cinco más brutos de cada cosa. Para los de España añade lo
   MEDIDO por AEMET en las últimas horas (racha y lluvia por hora) a
   través del intermediario de la app; para los del mundo, el METAR del
   aeropuerto (observación real, de aviationweather.gov). Con la lista,
   se abre cada sitio en la app y se compara lo que marca con lo medido.

   Uso:  node busca-extremos.mjs            (todo)
         node busca-extremos.mjs espana     (solo España)
         node busca-extremos.mjs mundo      (solo mundo)
   No lo corre deploy.sh: es una herramienta, no una guardia.
   ═══════════════════════════════════════════════════════════════════ */
const APP = 'https://weather-app-ochre-one-76.vercel.app';

const ESPANA = [
  ['Bermeo', 43.42, -2.72, 'LEBB'], ['Bilbao', 43.26, -2.93, 'LEBB'], ['Donostia', 43.32, -1.98, 'LESO'],
  ['Vitoria', 42.85, -2.67, 'LEVT'], ['Santander', 43.46, -3.80, 'LEXJ'], ['Oviedo', 43.36, -5.85, 'LEAS'],
  ['A Coruña', 43.37, -8.40, 'LECO'], ['Vigo', 42.24, -8.72, 'LEVX'], ['León', 42.60, -5.57, 'LELN'],
  ['Burgos', 42.34, -3.70, 'LEBG'], ['Logroño', 42.47, -2.45, 'LELO'], ['Pamplona', 42.82, -1.64, 'LEPP'],
  ['Zaragoza', 41.65, -0.88, 'LEZG'], ['Huesca', 42.14, -0.41, 'LEHC'], ['Lleida', 41.62, 0.63, 'LEDA'],
  ['Barcelona', 41.39, 2.17, 'LEBL'], ['Girona', 41.98, 2.82, 'LEGE'], ['Tarragona', 41.12, 1.25, 'LERS'],
  ['Castellón', 39.99, -0.04, 'LECH'], ['Valencia', 39.47, -0.38, 'LEVC'], ['Alicante', 38.35, -0.48, 'LEAL'],
  ['Calpe', 38.64, 0.04, 'LEAL'], ['Murcia', 37.99, -1.13, 'LEMI'], ['Cartagena', 37.60, -0.99, 'LELC'],
  ['Almería', 36.83, -2.46, 'LEAM'], ['Granada', 37.18, -3.60, 'LEGR'], ['Málaga', 36.72, -4.42, 'LEMG'],
  ['Cádiz', 36.53, -6.29, 'LERT'], ['Tarifa', 36.01, -5.60, 'LEJR'], ['Sevilla', 37.39, -5.99, 'LEZL'],
  ['Huelva', 37.26, -6.94, 'LEZL'], ['Córdoba', 37.89, -4.78, 'LEBA'], ['Jaén', 37.77, -3.79, 'LEGR'],
  ['Badajoz', 38.88, -6.97, 'LEBZ'], ['Cáceres', 39.48, -6.37, 'LEBZ'], ['Madrid', 40.42, -3.70, 'LEMD'],
  ['Toledo', 39.86, -4.02, 'LEMD'], ['Albacete', 38.99, -1.86, 'LEAB'], ['Cuenca', 40.07, -2.13, 'LEMD'],
  ['Valladolid', 41.65, -4.72, 'LEVD'], ['Salamanca', 40.97, -5.66, 'LESA'], ['Soria', 41.76, -2.47, 'LEVT'],
  ['Teruel', 40.34, -1.11, 'LETL'], ['Palma', 39.57, 2.65, 'LEPA'], ['Ibiza', 38.91, 1.43, 'LEIB'],
  ['Mahón', 39.89, 4.27, 'LEMH'], ['Las Palmas', 28.12, -15.43, 'GCLP'], ['Tenerife', 28.47, -16.25, 'GCXO'],
  ['Estaca de Bares', 43.79, -7.68, 'LECO'], ['Cabo Vilán', 43.16, -9.21, 'LECO'],
];
const MUNDO = [
  ['Ciudad del Cabo', -33.93, 18.42, 'FACT'], ['Wellington', -41.29, 174.78, 'NZWN'], ['Invercargill', -46.41, 168.35, 'NZNV'],
  ['Punta Arenas', -53.16, -70.91, 'SCCI'], ['Ushuaia', -54.80, -68.30, 'SAWH'], ['Tórshavn', 62.01, -6.77, 'EKVG'],
  ['Reikiavik', 64.13, -21.90, 'BIRK'], ['Bergen', 60.39, 5.32, 'ENBR'], ['Estocolmo', 59.33, 18.07, 'ESSA'],
  ['Londres', 51.50, -0.12, 'EGLL'], ['Dublín', 53.35, -6.26, 'EIDW'], ['Brest', 48.39, -4.49, 'LFRB'],
  ['Marsella', 43.30, 5.37, 'LFML'], ['Génova', 44.41, 8.93, 'LIMJ'], ['Trieste', 45.65, 13.78, 'LIPQ'],
  ['Atenas', 37.98, 23.73, 'LGAV'], ['Estambul', 41.01, 28.98, 'LTFM'], ['Tel Aviv', 32.09, 34.78, 'LLBG'],
  ['Nairobi', -1.29, 36.82, 'HKJK'], ['Lagos', 6.52, 3.38, 'DNMM'], ['Kinshasa', -4.32, 15.32, 'FZAA'],
  ['Bombay', 19.08, 72.88, 'VABB'], ['Calcuta', 22.57, 88.36, 'VECC'], ['Daca', 23.81, 90.41, 'VGHS'],
  ['Bangkok', 13.76, 100.50, 'VTBS'], ['Singapur', 1.35, 103.82, 'WSSS'], ['Yakarta', -6.21, 106.85, 'WIII'],
  ['Manila', 14.60, 120.98, 'RPLL'], ['Taipéi', 25.03, 121.56, 'RCTP'], ['Hong Kong', 22.32, 114.17, 'VHHH'],
  ['Nagasaki', 32.75, 129.87, 'RJFU'], ['Tokio', 35.68, 139.69, 'RJTT'], ['Sapporo', 43.06, 141.35, 'RJCC'],
  ['Sídney', -33.87, 151.21, 'YSSY'], ['Darwin', -12.46, 130.84, 'YPDN'], ['Perth', -31.95, 115.86, 'YPPH'],
  ['Honolulu', 21.31, -157.86, 'PHNL'], ['Anchorage', 61.22, -149.90, 'PANC'], ['Seattle', 47.61, -122.33, 'KSEA'],
  ['Denver', 39.74, -104.99, 'KDEN'], ['Dallas', 32.78, -96.80, 'KDFW'], ['Miami', 25.76, -80.19, 'KMIA'],
  ['Nueva York', 40.71, -74.01, 'KJFK'], ['Chicago', 41.88, -87.63, 'KORD'], ['Ciudad de México', 19.43, -99.13, 'MMMX'],
  ['Panamá', 8.98, -79.52, 'MPTO'], ['Bogotá', 4.71, -74.07, 'SKBO'], ['Manaos', -3.12, -60.02, 'SBEG'],
  ['São Paulo', -23.55, -46.63, 'SBGR'], ['Buenos Aires', -34.60, -58.38, 'SAEZ'], ['Santiago', -33.45, -70.67, 'SCEL'],
];

const num = v => (Number.isFinite(v) ? v : null);
const r1 = v => (v === null ? '—' : Math.round(v * 10) / 10);

async function openMeteo(lista) {
  const out = [];
  for (let i = 0; i < lista.length; i += 40) {
    const trozo = lista.slice(i, i + 40);
    const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + trozo.map(x => x[1]).join(',')
      + '&longitude=' + trozo.map(x => x[2]).join(',')
      + '&hourly=wind_gusts_10m,cape,precipitation&forecast_days=1&timezone=auto&wind_speed_unit=kmh';
    const r = await fetch(u);
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
    let d = await r.json();
    if (!Array.isArray(d)) d = [d];
    d.forEach((x, k) => {
      const h = x.hourly || {};
      const max = (a, conHora) => {
        let m = null, hora = null;
        (a || []).forEach((v, j) => { if (Number.isFinite(v) && (m === null || v > m)) { m = v; hora = h.time?.[j]?.slice(11, 16); } });
        return conHora ? { v: m, hora } : m;
      };
      const g = max(h.wind_gusts_10m, true), c = max(h.cape, true);
      const p = (h.precipitation || []).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
      const pMax = max(h.precipitation, true);
      out.push({ nombre: trozo[k][0], lat: trozo[k][1], lon: trozo[k][2], icao: trozo[k][3],
                 racha: num(g.v), rachaHora: g.hora, cape: num(c.v), capeHora: c.hora,
                 lluvia: Math.round(p * 10) / 10, lluviaHoraMax: pMax.hora, lluviaMax: num(pMax.v) });
    });
  }
  return out;
}

async function aemet(sitios) {
  const puntos = sitios.map(s => `${s.lat},${s.lon}`).join('|');
  const r = await fetch(`${APP}/estaciones?puntos=${encodeURIComponent(puntos)}&radio=30&limite=4&historia=6`);
  const d = await r.json().catch(() => null);
  if (!r.ok || !d || d.error) return sitios.map(() => ({ nota: `AEMET: ${d?.reason || r.status}` }));
  return d.puntos.map(p => {
    const es = p.estaciones || [];
    let racha = null, rachaDe = null, lluvia = null, lluviaDe = null;
    for (const e of es) {
      if (Number.isFinite(e.racha) && (racha === null || e.racha > racha)) { racha = e.racha; rachaDe = `${e.nombre} ${(e.medidoEn || '').slice(11, 16)}`; }
      const hs = e.historia || [];
      const tot = hs.reduce((s, x) => s + (Number.isFinite(x.lluvia) ? x.lluvia : 0), 0);
      if (hs.length && (lluvia === null || tot > lluvia)) { lluvia = Math.round(tot * 10) / 10; lluviaDe = e.nombre; }
    }
    return { racha, rachaDe, lluvia6h: lluvia, lluviaDe, estaciones: es.length };
  });
}

async function metar(icaos) {
  const u = `https://aviationweather.gov/api/data/metar?ids=${[...new Set(icaos)].join(',')}&format=json`;
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'AitorMeteo/1 (+pentxa@gmail.com)' } });
    if (!r.ok) return {};
    const d = await r.json();
    const por = {};
    for (const m of d) por[m.icaoId] = { viento: m.wspd != null ? Math.round(m.wspd * 1.852) : null,
                                        racha: m.wgst != null ? Math.round(m.wgst * 1.852) : null,
                                        hora: (m.reportTime || '').slice(11, 16), crudo: m.rawOb };
    return por;
  } catch { return {}; }
}

const que = process.argv[2] || 'todo';
const tabla = (titulo, filas, campo, f) => {
  console.log(`\n  ${titulo}`);
  for (const s of [...filas].filter(x => x[campo] !== null).sort((a, b) => b[campo] - a[campo]).slice(0, 5)) console.log('    ' + f(s));
};

if (que !== 'mundo') {
  const es = await openMeteo(ESPANA);
  const top = new Map();
  for (const campo of ['racha', 'cape', 'lluvia']) for (const s of [...es].sort((a, b) => (b[campo] ?? -1) - (a[campo] ?? -1)).slice(0, 5)) top.set(s.nombre, s);
  const lista = [...top.values()];
  const obs = await aemet(lista);
  lista.forEach((s, i) => { s.obs = obs[i]; });
  const mide = s => s.obs?.nota ? s.obs.nota : `medido AEMET: racha ${r1(s.obs.racha)} (${s.obs.rachaDe || '—'}) · lluvia 6 h ${r1(s.obs.lluvia6h)} mm (${s.obs.lluviaDe || '—'})`;
  console.log('\nESPAÑA · hoy según Open-Meteo (best_match) · y lo medido por AEMET cerca');
  tabla('Racha máxima prevista', lista, 'racha', s => `${s.nombre.padEnd(16)} ${r1(s.racha)} km/h a las ${s.rachaHora}  |  ${mide(s)}`);
  tabla('CAPE máximo previsto', lista, 'cape', s => `${s.nombre.padEnd(16)} ${r1(s.cape)} J/kg a las ${s.capeHora}  |  ${mide(s)}`);
  tabla('Lluvia del día prevista', lista, 'lluvia', s => `${s.nombre.padEnd(16)} ${r1(s.lluvia)} mm (pico ${r1(s.lluviaMax)} a las ${s.lluviaHoraMax})  |  ${mide(s)}`);
}
if (que !== 'espana') {
  const mu = await openMeteo(MUNDO);
  const top = new Map();
  for (const campo of ['racha', 'cape', 'lluvia']) for (const s of [...mu].sort((a, b) => (b[campo] ?? -1) - (a[campo] ?? -1)).slice(0, 5)) top.set(s.nombre, s);
  const lista = [...top.values()];
  const met = await metar(lista.map(s => s.icao));
  const mide = s => { const m = met[s.icao]; return m ? `METAR ${s.icao} ${m.hora}: viento ${r1(m.viento)} · racha ${r1(m.racha)} km/h` : `sin METAR ${s.icao}`; };
  console.log('\nMUNDO · hoy según Open-Meteo (best_match) · y el METAR del aeropuerto');
  tabla('Racha máxima prevista', lista, 'racha', s => `${s.nombre.padEnd(16)} ${r1(s.racha)} km/h a las ${s.rachaHora}  |  ${mide(s)}`);
  tabla('CAPE máximo previsto', lista, 'cape', s => `${s.nombre.padEnd(16)} ${r1(s.cape)} J/kg a las ${s.capeHora}  |  ${mide(s)}`);
  tabla('Lluvia del día prevista', lista, 'lluvia', s => `${s.nombre.padEnd(16)} ${r1(s.lluvia)} mm (pico ${r1(s.lluviaMax)} a las ${s.lluviaHoraMax})  |  ${mide(s)}`);
}
console.log('\n  Siguiente paso: abrir cada sitio en la app (buscador) y comparar lo que marca con lo medido.\n');
