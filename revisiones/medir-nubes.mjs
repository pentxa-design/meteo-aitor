import { imagenPNG } from '../lib/rayos-png.mjs';
const APP = 'https://weather-app-ochre-one-76.vercel.app';
const DIAS = +process.argv[2] || 7;
const torres = (await (await fetch(`${APP}/api/torres`)).json()).torres;
const MOD = ['ecmwf_ifs025', 'ecmwf_ifs', 'icon_seamless', 'gfs_seamless', 'meteofrance_arome_france_hd', 'best_match'];
const NOM = { ecmwf_ifs025: 'ECMWF 25 km', ecmwf_ifs: 'ECMWF 9 km', icon_seamless: 'ICON', gfs_seamless: 'GFS', meteofrance_arome_france_hd: 'AROME HD', best_match: 'Automático' };
const u = `https://api.open-meteo.com/v1/forecast?latitude=${torres.map(t => t.lat).join(',')}&longitude=${torres.map(t => t.lon).join(',')}&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&models=${MOD.join(',')}&past_days=${DIAS}&forecast_days=1&timezone=UTC&cell_selection=land`;
const om = await (await fetch(u)).json();
const L = Array.isArray(om) ? om : [om];
const B = { lat0: 42.6, lat1: 43.6, lon0: -3.6, lon1: -1.8, W: 360, H: 200 };
const ahora = Date.now() - 45 * 60e3;
const horas = L[0].hourly.time.filter(t => new Date(t + 'Z').getTime() <= ahora);
const res = Object.fromEntries(MOD.map(m => [m, { n: 0, ok: 0, nubSiSat: 0, satNub: 0, despSiSat: 0, satDesp: 0, costa: { n: 0, ok: 0 } }]));
const COSTA = /BERMEO|LEKEITIO|PUNTAGALEA|SOLLUBE|MUNGIA|GERNIKA/;
let leidas = 0, fallos = 0;
const total = m => (o, i) => { const H = o.hourly; const c = H[`cloud_cover_${m}`]?.[i]; if (c != null) return c;
  const v = [H[`cloud_cover_low_${m}`]?.[i], H[`cloud_cover_mid_${m}`]?.[i], H[`cloud_cover_high_${m}`]?.[i]].filter(x => x != null); return v.length ? Math.max(...v) : null; };
for (const t of horas) {
  let img;
  try {
    const r = await fetch(`https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=msg_fes:clm&styles=&crs=EPSG:4326&bbox=${B.lat0},${B.lon0},${B.lat1},${B.lon1}&width=${B.W}&height=${B.H}&format=image/png&time=${t}:00Z`, { signal: AbortSignal.timeout(20000) });
    img = await imagenPNG(await r.arrayBuffer()); leidas++;
  } catch { fallos++; continue; }
  const i = L[0].hourly.time.indexOf(t);
  for (let s = 0; s < torres.length; s++) {
    const x = Math.round((torres[s].lon - B.lon0) / (B.lon1 - B.lon0) * B.W), y = Math.round((B.lat1 - torres[s].lat) / (B.lat1 - B.lat0) * B.H);
    const px = await img.pixeles(x - 1, y - 1, 3, 3);
    let nub = 0, cnt = 0;
    for (let k = 0; k < 9; k++) { const r = px[k * 4], g = px[k * 4 + 1], b = px[k * 4 + 2], a = px[k * 4 + 3]; if (a < 50) continue; cnt++; if (r > 200 && g > 200 && b > 200) nub++; }
    if (!cnt) continue;
    const satNub = nub / cnt >= 0.5;
    for (const m of MOD) {
      const c = total(m)(L[s], i); if (c == null) continue;
      const modNub = c >= 50, R = res[m];
      R.n++; if (modNub === satNub) R.ok++;
      if (satNub) { R.satNub++; if (modNub) R.nubSiSat++; } else { R.satDesp++; if (!modNub) R.despSiSat++; }
      if (COSTA.test(torres[s].name)) { R.costa.n++; if (modNub === satNub) R.costa.ok++; }
    }
  }
}
console.log(`${DIAS} días · ${leidas} horas de satélite leídas (${fallos} fallidas) · ${torres.length} sitios`);
const filas = MOD.map(m => { const R = res[m]; return { modelo: NOM[m], horasSitio: R.n, acierto: (100 * R.ok / R.n).toFixed(1) + ' %',
  've nubes cuando hay': (100 * R.nubSiSat / R.satNub).toFixed(0) + ' %', 've despejado cuando lo está': (100 * R.despSiSat / R.satDesp).toFixed(0) + ' %',
  'acierto en la costa': (100 * R.costa.ok / R.costa.n).toFixed(1) + ' %' }; }).sort((a, b) => parseFloat(b.acierto) - parseFloat(a.acierto));
console.table(filas);
