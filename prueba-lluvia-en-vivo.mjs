/* ═══════════════════════════════════════════════════════════════════
   LA LLUVIA DE SU DUEÑO, CON EL TIEMPO DE HOY Y EN SUS SITIOS
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-10-2026: «automatiza esto, no me vale reparar hoy y mañana mal
   otra vez». Las pruebas de pruebas.js miran la regla con datos puestos
   a mano; ésta la mira con el pronóstico DE VERDAD de ese momento, en sus
   emplazamientos, que es como él caza los fallos: mirando la pantalla el
   día que llueve raro.

   Se pide por la propia app (`/om`), igual que la pantalla, y se pasa por
   la MISMA función que pintan el parte, la línea roja, la etiqueta y la
   tarjeta (`lluviaDeUnSitio`, sacada del app.js de verdad). Si alguna
   frase de hoy incumple la regla, NO SE PUBLICA.

   Sin red no se puede mirar, y se DICE (no se da por bueno en silencio).
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import vm from 'node:vm';

const APP = 'https://weather-app-ochre-one-76.vercel.app';
const AR = 'meteofrance_arome_france_hd', EC = 'ecmwf_ifs025', IC = 'icon_seamless', GF = 'gfs_seamless';
const src = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');

/* Los sitios: la lista escrita a mano del vigilante (la misma que usa si
   el almacén no contesta). Son los suyos, con sus coordenadas. */
const vig = fs.readFileSync(new URL('./api/vigilante.mjs', import.meta.url), 'utf8');
const sitios = [...vig.matchAll(/\{ n: '([^']+)',\s*lat: ([\d.]+),\s*lon: (-?[\d.]+)/g)]
  .map(m => ({ n: m[1], lat: +m[2], lon: +m[3] }));
if (sitios.length < 10) { console.log(`  ✗ solo encuentro ${sitios.length} sitios en api/vigilante.mjs: la prueba no puede mirar nada`); process.exit(1); }

/* Las piezas, del fichero de verdad. */
const sacar = firma => { const i = src.indexOf(firma); if (i < 0) throw new Error(`no encuentro ${firma}`); return src.slice(i, src.indexOf('\n}\n', i) + 2); };
const sacarConst = nombre => { const m = src.match(new RegExp(`^const ${nombre} = [\\s\\S]*?;[^\\n]*\\n`, 'm')); if (!m) throw new Error(`no encuentro const ${nombre}`); return m[0]; };
const ctx = {
  console, Date, Math, JSON, Map, Set, Number, String, Array, Object,
  S: { thr: { rainWarn: 0.2, rainNo: 2 } },
  has: v => v !== null && v !== undefined && !Number.isNaN(v),
  nombreDeModelo: om => ({ [AR]: 'AROME HD', [EC]: 'ECMWF', [IC]: 'ICON', [GF]: 'GFS' }[om] || om),
  duenoLluvia: () => AR,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('./reglas-tiempo.js', import.meta.url), 'utf8') + '\n;globalThis.ReglasTiempo = ReglasTiempo;', ctx);
vm.runInContext([sacarConst('AGUA_ACUERDO'), sacarConst('RELLENO_AGUA'), sacarConst('CIELO_PRESTADO'),
  sacarConst('MODELOS_TORMENTA'), sacar('function mojaEsaHora('), sacar('function lluviaDeUnSitio('),
  'globalThis.__f = { lluviaDeUnSitio, AGUA_ACUERDO };'].join('\n'), ctx);
const { lluviaDeUnSitio, AGUA_ACUERDO } = ctx.__f;

const q = new URLSearchParams({
  latitude: sitios.map(s => s.lat.toFixed(4)).join(','), longitude: sitios.map(s => s.lon.toFixed(4)).join(','),
  hourly: 'precipitation,weather_code', models: [AR, EC, IC, GF, 'best_match'].join(','),
  forecast_days: '2', timezone: 'Europe/Madrid', cell_selection: 'land',
});
let datos;
try {
  const r = await fetch(`${APP}/om?${q}`, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`/om contesta ${r.status}`);
  datos = await r.json();
} catch (e) {
  console.log(`  ⚠ SIN COMPROBAR con el tiempo de hoy: ${e.message}. No es un «todo bien»: es que no se ha podido mirar.`);
  process.exit(0);
}
const lista = Array.isArray(datos) ? datos : [datos];

const ahora = Date.now();
const finHoy = new Date(); finHoy.setHours(23, 59, 59, 999);
const desde = ahora - 3600e3;
const llov = c => c >= 51 && c <= 57;
const hh = d => String(new Date(d).getHours()).padStart(2, '0') + ':00';
const malos = [], resumen = [];
lista.forEach((d, n) => {
  const H = d?.hourly, s = sitios[n];
  if (!H?.time || !s) { malos.push(`${s?.n ?? n}: sin horas de /om`); return; }
  const L = lluviaDeUnSitio(H, s.n, desde, finHoy.getTime());
  const i = t => H.time.findIndex(x => new Date(x).getTime() === +t);
  const P = om => H[`precipitation_${om}`] || [], C = om => H[`weather_code_${om}`] || [];
  for (const t of (L.horasAgua || [])) {
    const k = i(t), own = P(AR)[k] ?? P(EC)[k];
    const siri = own < 0.2 && (llov(C(AR)[k]) || (llov(C(EC)[k]) && !(P(EC)[k] > AGUA_ACUERDO)));
    if (!(own >= 0.05 || siri)) malos.push(`${s.n} ${hh(t)}: en la ventana con el dueño en ${own} y sin sirimiri`);
  }
  for (const t of (L.fuerte ? L.horasFuerza : [])) {
    const k = i(t);
    const otro = [EC, IC, GF].some(om => P(om)[k] > AGUA_ACUERDO);
    if (!(P(AR)[k] >= 2 && otro)) malos.push(`${s.n} ${hh(t)}: «Llueve bien» con AROME ${P(AR)[k]} y sin otro por encima de ${AGUA_ACUERDO}`);
  }
  const otroVe = [EC, IC, GF].some(om => H.time.some((x, k) => { const t = new Date(x).getTime(); return t >= desde && t <= finHoy.getTime() && P(om)[k] >= 0.2; }));
  if (!L.llueve && otroVe && !L.otros?.length) malos.push(`${s.n}: su modelo la ve seca, otro ve agua y NO se dice`);
  resumen.push(`${s.n}: ${L.llueve ? `${L.soloSirimiri ? 'sirimiri' : L.fuerte ? 'llueve bien' : 'agua'} ${hh(L.ini)}-${hh(+L.fin + 3600e3)}${L.sigueHasta ? ` (sigue hasta ${hh(+L.sigueHasta + 3600e3)})` : ''}`
    : L.otros?.length ? `AROME seca · ${L.otros[0].nom} ve agua` : 'seco'}`);
});

if (malos.length) {
  console.log('  ✗ CON EL TIEMPO DE HOY, la lluvia incumple su regla:');
  for (const m of malos.slice(0, 8)) console.log('     ' + m);
  process.exit(1);
}
console.log(`  ✓ con el tiempo de hoy en sus ${lista.length} sitios, la lluvia cumple su regla`);
console.log('     ' + resumen.slice(0, 6).join(' · '));
