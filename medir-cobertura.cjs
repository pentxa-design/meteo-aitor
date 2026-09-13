/* ═══════════════════════════════════════════════════════════════════
   QUIÉN PUBLICA CADA COSA — MEDIDO, NO ESCRITO A MANO
   ───────────────────────────────────────────────────────────────────
   Suyo, 30-08-2026, después de cazar el segundo fallo del mismo tipo en
   dos días:

     *«PERO ESTOS ARREGLOS QUE NO SEAN DE UN DÍA Y LUEGO SE QUEDE COJO,
       QUE LO HAGA EL AUTOMATISMO»* · *«SI NO, UN CAMBIO Y NO NOS
       ENTERAMOS»*

   Y tiene toda la razón. Los dos fallos eran el mismo fallo:

     · 29-08 · un texto a mano decía «el total es del modelo automático»
       cuando ya venía de ICON. Envejeció con el primer cambio.
     · 30-08 · una tabla a mano repartía diez campos y se dejaba CINCO
       cayendo al Automático, que es el que él quiso quitar.

   Ninguno de los dos rompía nada. Por eso no se notaban: el dato salía,
   solo que peor de lo que podía, y con el nombre equivocado debajo.

   ESTO LO MIDE. Pregunta a los siete modelos qué publican de verdad,
   escribe el resultado en `data/cobertura.json`, y **compara con lo que
   había**. Si un modelo deja de publicar algo —o empieza—, lo canta.

   El reparto de la app sale de aquí. No hay tabla que mantener: si
   mañana AROME empieza a publicar la nubosidad, deja de pedírsela a
   ICON él solo.

   SE EJECUTA:
     · en cada publicación (`revisar.sh`), así que no puede quedarse vieja
     · y desde la tarea diaria, que avisa al móvil si algo cambió

   Uso:  node medir-cobertura.cjs [--escribir]
         sin `--escribir` solo mide y compara, no toca nada.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const APP = process.env.APP_URL || 'https://weather-app-ochre-one-76.vercel.app';
const FICHERO = path.join(__dirname, 'data', 'cobertura.json');

/* Los que salen en la app, con el nombre que él ve en pantalla.
   EL AUTOMÁTICO ENTRA EL 02-09-2026. Faltaba desde el principio, y no
   era inocente: la app usa esta tabla para saber qué le falta al modelo
   elegido y a quién pedírselo. Con el Automático fuera de la medición,
   la tabla decía que no publica NI UN CAMPO —0 de 28— así que al
   elegirlo se le pedía TODO prestado a otros, cada cosa a uno.
   Suyo, viéndolo en pantalla: *«que quede en ahora y mis estaciones etc
   igual los iconos lo mismo que en uno ponga sol y en el otro nubes»*.
   Medido el mismo día en Bermeo, misma hora: el Automático da racha
   14,8 km/h donde AROME da 11,5 y el europeo 4,7. No es ninguno de los
   tres: es su propia mezcla, y hay que medirlo como a los demás. */
const MODELOS = [
  ['best_match', 'Automático'],
  ['meteofrance_arome_france_hd', 'AROME HD'],
  ['icon_seamless', 'ICON'],
  ['meteofrance_arpege_europe', 'ARPEGE'],
  ['ecmwf_ifs025', 'ECMWF'],
  ['knmi_harmonie_arome_europe', 'HARMONIE'],
  ['gem_seamless', 'GEM'],
  ['gfs_seamless', 'GFS'],
];

/* TODO lo que la app llega a pedir por horas. Si mañana se añade un
   campo a la app y no está aquí, la prueba de `pruebas.js` lo canta. */
const CAMPOS = [
  'temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'dew_point_2m',
  'precipitation', 'precipitation_probability', 'weather_code',
  'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
  'visibility', 'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m',
  'wind_speed_180m', 'wind_direction_10m', 'wind_direction_80m', 'wind_gusts_10m',
  'snowfall', 'snow_depth', 'cape', 'lifted_index', 'convective_inhibition',
  'freezing_level_height', 'surface_pressure', 'pressure_msl', 'uv_index',
];

/* SE MIDE EN DOS SITIOS, y no es un capricho.

   AROME cubre España y se acaba en la frontera; GEM y GFS son globales.
   Medir solo en Bermeo diría que AROME publica cosas que en Calpe
   también, vale —pero en Miami no hay AROME que valga. Con dos puntos
   dentro de España se comprueba que la cobertura es del MODELO y no de
   una celda concreta que ese día venía vacía. */
const SITIOS = [
  { n: 'Bermeo', lat: 43.42, lon: -2.72 },
  { n: 'Calpe',  lat: 38.64, lon: 0.045 },
];

/* ── Y HASTA DÓNDE LLEGA CADA UNO ────────────────────────────────────
   Puesto el 30-08-2026. La app tenía escrito a mano «si AROME no cubre
   este punto, tira de ICON». Es correcto —ICON es global— pero estaba a
   mano, y una cosa a mano es la que se queda coja.

   Él se va a Calpe en septiembre, a Gijón, y habló de Miami y Brasil.
   Un punto fuera de Europa dice, sin discusión, qué modelo llega. */
const FUERA = { n: 'Miami', lat: 25.7617, lon: -80.1918 };

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function pedir(om, sitio) {
  const u = new URL(`${APP}/om`);
  u.searchParams.set('api', 'fc');
  u.searchParams.set('latitude', sitio.lat);
  u.searchParams.set('longitude', sitio.lon);
  u.searchParams.set('hourly', CAMPOS.join(','));
  u.searchParams.set('forecast_days', 2);
  u.searchParams.set('timezone', 'auto');
  u.searchParams.set('models', om);
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${om}: HTTP ${r.status}`);
  const d = await r.json();
  if (!d?.hourly?.time) throw new Error(`${om}: sin horas`);
  return d.hourly;
}

async function medir() {
  const cobertura = {};
  for (const c of CAMPOS) cobertura[c] = [];
  const globales = [];

  for (const [om, nombre] of MODELOS) {
    /* Un modelo que falla NO se apunta como «no publica nada»: eso sería
       borrarlo del reparto por un corte de red. Se dice y se deja fuera
       de esta medida, que es distinto. */
    const porSitio = [];
    for (const s of SITIOS) {
      try { porSitio.push(await pedir(om, s)); }
      catch (e) { console.log(`  · ${nombre} en ${s.n}: ${e.message}`); }
      await dormir(150);
    }
    if (!porSitio.length) { console.log(`  ⚠ ${nombre}: no ha contestado, se queda como estaba`); continue; }

    for (const c of CAMPOS) {
      /* Publica el campo si lo da en ALGÚN sitio medido con al menos la
         mitad de las horas. Una celda vacía de un día no borra un modelo
         del reparto; un campo que no existe da cero en los dos. */
      const vale = porSitio.some(h => {
        const v = h[c];
        return Array.isArray(v) && v.filter(x => x !== null && x !== undefined).length >= v.length / 2;
      });
      if (vale) cobertura[c].push(om);
    }
    const n = CAMPOS.filter(c => cobertura[c].includes(om)).length;

    /* ¿Llega fuera de Europa? Se mira un campo que publica TODO el
       mundo —la temperatura—: si ahí no da nada, es que el modelo no
       cubre el punto, no que le falte ese dato. */
    let global = false;
    try {
      const h = await pedir(om, FUERA);
      global = (h.temperature_2m || []).some(v => v !== null && v !== undefined);
    } catch { global = false; }
    if (global) globales.push(om);

    console.log(`  ${nombre.padEnd(10)} publica ${String(n).padStart(2)} de ${CAMPOS.length}`
              + `  ·  ${global ? 'llega a ' + FUERA.n : 'solo Europa'}`);
  }
  return { cobertura, globales };
}

/** Lo que cambia respecto a la última medida. Es el aviso que él pidió. */
function comparar(antes, ahora) {
  if (!antes?.cobertura) return [];
  const cambios = [];
  const nom = om => (MODELOS.find(m => m[0] === om) || [om, om])[1];
  for (const c of new Set([...Object.keys(antes.cobertura),
                           ...Object.keys(ahora).filter(k => k !== 'globales')])) {
    const a = new Set(antes.cobertura[c] || []);
    const b = new Set(ahora[c] || []);
    for (const om of b) if (!a.has(om)) cambios.push(`${nom(om)} EMPIEZA a publicar ${c}`);
    for (const om of a) if (!b.has(om)) cambios.push(`${nom(om)} DEJA de publicar ${c}`);
  }
  const ga = new Set(antes.globales || []), gb = new Set(ahora.globales || []);
  for (const om of gb) if (!ga.has(om)) cambios.push(`${nom(om)} YA llega fuera de Europa`);
  for (const om of ga) if (!gb.has(om)) cambios.push(`${nom(om)} YA NO llega fuera de Europa`);
  return cambios;
}

(async () => {
  console.log('\n▸ Midiendo qué publica cada modelo…');
  const { cobertura, globales } = await medir();

  const publican = CAMPOS.filter(c => cobertura[c].length);
  if (publican.length < CAMPOS.length / 2) {
    console.log('\n  ✗ La medida ha salido casi vacía: será la red, no los modelos.');
    console.log('    NO se escribe nada: mejor la de ayer que una en blanco.\n');
    process.exit(1);
  }

  let antes = null;
  try { antes = JSON.parse(fs.readFileSync(FICHERO, 'utf8')); } catch { /* la primera vez no hay */ }
  const cambios = comparar(antes, { ...cobertura, globales });

  const huerfanos = CAMPOS.filter(c => !cobertura[c].length);
  if (huerfanos.length) console.log(`\n  ⚠ sin ningún modelo que los publique: ${huerfanos.join(', ')}`);

  if (cambios.length) {
    console.log('\n  ⚠ HA CAMBIADO ALGO DESDE LA ÚLTIMA MEDIDA:');
    for (const c of cambios) console.log(`      · ${c}`);
  } else if (antes) {
    console.log('\n  ✓ nada ha cambiado desde ' + (antes.cuando || '?').slice(0, 10));
  }

  /* ── Y SE ESCRIBE EN LA APP, que es lo que lo hace automático ──────
     Sin esto seguiría habiendo una tabla que alguien tiene que copiar a
     mano, y volveríamos al punto de partida. El bloque de app.js entre
     las dos marcas lo escribe ESTE fichero y nadie más. */
  const aplicar = () => {
    const f = path.join(__dirname, 'app.js');
    const src = fs.readFileSync(f, 'utf8');
    const A = '   ─── NO TOCAR A MANO DE AQUÍ ─── generado por medir-cobertura.cjs ───*/\n';
    const B = '/* ─── HASTA AQUÍ ─';
    const i = src.indexOf(A), j = src.indexOf(B, i);
    if (i < 0 || j < 0) { console.log('  ✗ no encuentro las marcas en app.js'); process.exit(1); }
    const bloque = 'const COBERTURA = ' + JSON.stringify(cobertura, null, 2) + ';\n\n'
      + '/* Hasta dónde llega cada uno, medido en ' + FUERA.n + '. El rebote cuando\n'
      + '   el modelo cargado no cubre el punto sale de aquí, no de una línea\n'
      + '   escrita a mano: él se va a Calpe, a Gijón, y habló de Miami y Brasil. */\n'
      + 'const GLOBALES = ' + JSON.stringify(globales, null, 2) + ';\n';
    fs.writeFileSync(f, src.slice(0, i + A.length) + bloque + src.slice(j));
    console.log('  → reparto escrito en app.js');
  };

  if (process.argv.includes('--escribir')) {
    fs.mkdirSync(path.dirname(FICHERO), { recursive: true });
    fs.writeFileSync(FICHERO, JSON.stringify({
      cuando: new Date().toISOString(),
      sitios: SITIOS.map(s => s.n),
      fuera: FUERA.n,
      cobertura,
      globales,
    }, null, 2) + '\n');
    console.log(`\n  → escrito en data/cobertura.json`);
    aplicar();
  }

  /* El código de salida es el aviso: 0 todo igual, 2 algo cambió. Así lo
     puede mirar `revisar.sh` y la tarea diaria sin leer texto. */
  console.log('');
  process.exit(cambios.length ? 2 : 0);
})().catch(e => { console.log('  ✗ ' + e.message); process.exit(1); });
