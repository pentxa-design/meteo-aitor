/* ═══════════════════════════════════════════════════════════════════
   QUIÉN ACIERTA EL CIELO, MEDIDO CONTRA EL SATÉLITE
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026, con lo que veía por la ventana en la mano:
   *«buen tiempo en Bermeo todo el día con nubes blancas de algodón,
   pero deja de sobra pasar el sol»* — y la app le daba el cielo
   cubierto cuatro horas seguidas.

   Ese día el cielo pasó de ARPEGE a ECMWF. **Con UN día.** Y un día no
   es una medición: es un caso. Esto existe para convertirlo en número,
   igual que se hizo con el agua.

   CÓMO MIDE, Y POR QUÉ ASÍ:

   · La referencia es el **satélite visible de EUMETSAT** (cada 15 min),
     que es una MEDIDA, no otro modelo. Se recorta una caja de ~25 km
     alrededor del sitio y se cuenta qué parte sale clara — la nube es
     blanca y el mar y la tierra, oscuros.

   · **NO se comparan porcentajes**, y es a propósito: el brillo del
     satélite y el «% de nubosidad» de un modelo no son la misma escala,
     y restarlos sería el fallo que este proyecto lleva persiguiendo —
     comparar dos números sin saber de dónde sale cada uno.

     Lo que se compara es **LA LECTURA**: despejado, pocas nubes, nuboso
     o cubierto. Que es lo que él mira, y lo que se equivocó hoy.

   · Solo de DÍA. El satélite visible de noche sale negro, y negro no es
     despejado: es sin luz. Las horas de poca luz se descartan.

   Se lanza a mano (`node medir-cielo.mjs`) y **acumula** en
   `data/cielo-marcador.md`: una tanda por ejecución, sin pisar las de
   antes. Con una semana dentro habrá con qué decidir; con un día, no.

   NO decide nada por su cuenta y no toca la app: escribe el número y ya.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const APP = 'https://weather-app-ochre-one-76.vercel.app';

/* Sus sitios, y a propósito no solo la costa: el europeo de 25 km lee
   Bermeo a 18 km tierra adentro, así que si falla solo en la costa hay
   que poder verlo. */
const SITIOS = [
  { n: 'BI BERMEO',       lat: 43.4130, lon: -2.7183 },
  { n: 'BI SOLLUBEMENDI', lat: 43.3698, lon: -2.7628 },
  { n: 'BI OIZ',          lat: 43.2280, lon: -2.5936 },
  { n: 'BI GERNIKA2',     lat: 43.3167, lon: -2.6790 },
  { n: 'VI ARBAIZA',      lat: 42.8900, lon: -2.6800 },
];

const MODELOS = [
  ['ECMWF',      'ecmwf_ifs025'],
  ['ARPEGE',     'meteofrance_arpege_europe'],
  ['ICON',       'icon_seamless'],
  ['GFS',        'gfs_seamless'],
  ['HARMONIE',   'knmi_harmonie_arome_europe'],
  ['Automático', 'best_match'],
];

/* ── LAS DOS ESCALAS, Y SUS CORTES ────────────────────────────────────
   Los del satélite salen de la tanda del 02-09 en Bermeo, contrastada
   con lo que él vio y con la predicción de Euskalmet de ese día:
     38 % claros → nuboso (Euskalmet: «muy nuboso al comienzo»)
      9 % claros → pocas nubes (él: «pocas nubes, sol de sobra»)
      3 % claros → despejado
   Son cortes de UNA tanda: si con más días no cuadran, se cambian y se
   dice — pero se cambian con números, no a ojo.                        */
const leeSat = c => c > 70 ? 'cubierto' : c > 35 ? 'nuboso'
               : c > 8 ? 'pocas' : 'despejado';
const leeMod = v => v > 75 ? 'cubierto' : v > 50 ? 'nuboso'
               : v > 25 ? 'pocas' : 'despejado';

/* Se acierta si coincide la lectura, y se acepta el vecino: entre
   «pocas» y «nuboso» hay un continuo, y clavar la frontera exacta sería
   pedirle al modelo más precisión de la que tiene. Lo que NO se perdona
   es confundir despejado con cubierto, que es su queja. */
const ORDEN = ['despejado', 'pocas', 'nuboso', 'cubierto'];
const fallo = (a, b) => Math.abs(ORDEN.indexOf(a) - ORDEN.indexOf(b));

const pide = async (url, tipo = 'json') => {
  const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url.slice(0, 60)}`);
  return tipo === 'json' ? r.json() : r.arrayBuffer();
};

/* ── EL SATÉLITE ─────────────────────────────────────────────────────
   Sin librería de imagen: el PNG se pide con `format=image/png` y se
   descodifica con `createImageBitmap`… que en node no existe. Así que se
   pide a EUMETSAT en un formato que se pueda leer a pelo: una imagen
   diminuta (16x16) y se mira el brillo medio. A esa escala cada píxel es
   ~1,5 km, que para «cuánta nube hay encima» sobra.

   Se usa `image/geotiff`? No: no hace falta. Con 16x16 en PNG el fichero
   es pequeño y se puede medir el brillo con el propio WMS pidiendo
   `format=image/jpeg`, cuyo cabecero da el tamaño pero no los píxeles.

   LO HONESTO: node no trae descodificador de imagen, así que esto usa
   `sharp` o `pngjs` si están, y si no, DICE que no puede medir en vez de
   inventarse un número. */
let leerPixeles = null;
try {
  const { PNG } = await import('pngjs');
  leerPixeles = buf => {
    const png = PNG.sync.read(Buffer.from(buf));
    let claros = 0, total = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const a = png.data[i + 3];
      if (a < 128) continue;
      const g = (png.data[i] * 299 + png.data[i + 1] * 587 + png.data[i + 2] * 114) / 1000;
      if (g > 140) claros++;
      total++;
    }
    return total ? 100 * claros / total : null;
  };
} catch {
  leerPixeles = null;
}

async function main() {
  if (!leerPixeles) {
    console.log('  ✗ No puedo leer las imágenes del satélite: falta `pngjs`.');
    console.log('    Instálalo con `npm install pngjs` y vuelve a lanzarlo.');
    console.log('    NO se apunta nada: un marcador a medias es peor que ninguno.');
    process.exit(1);
  }

  console.log('▸ Pidiendo las pasadas del satélite…');
  const sat = await pide(`${APP}/satelite`);
  const vis = sat.capas?.visible;
  if (!vis?.horas?.length) {
    console.log('  ✗ El satélite no ha dado pasadas. No se apunta nada.');
    process.exit(1);
  }

  /* Una pasada por hora en punto, y solo de día (el visible de noche es
     negro, y negro no es despejado). */
  const porHora = new Map();
  for (const h of vis.horas) if (h.slice(14, 16) === '00') porHora.set(h.slice(11, 13), h);
  console.log(`  ${porHora.size} horas en punto disponibles`);

  const filas = [];
  for (const s of SITIOS) {
    console.log(`▸ ${s.n}`);
    /* Lo que dijo cada modelo, de una sola petición. */
    const q = new URLSearchParams({
      api: 'fc', latitude: s.lat, longitude: s.lon, timezone: 'auto',
      hourly: 'cloud_cover', forecast_days: '1',
      models: MODELOS.map(m => m[1]).join(','),
    });
    const fc = await pide(`${APP}/om?${q}`);
    const H = fc.hourly;

    for (const [hh, iso] of porHora) {
      /* La caja del satélite, ~25 km de lado. */
      const m = 0.15;
      const p = new URLSearchParams({
        service: 'WMS', version: '1.1.1', request: 'GetMap', layers: vis.wms,
        bbox: `${s.lon - m},${s.lat - m},${s.lon + m},${s.lat + m}`,
        width: '80', height: '80', srs: 'EPSG:4326',
        format: 'image/png', transparent: 'true', time: iso,
      });
      let claros = null;
      try { claros = leerPixeles(await pide(`${sat.wms}?${p}`, 'buf')); } catch { claros = null; }
      if (claros === null) continue;

      /* Hora local del modelo que corresponde a esta pasada UTC. */
      /* `toLocaleString('sv')` devuelve «2026-09-02 18:00:00» con ESPACIO
         y las horas de Open-Meteo llevan «T»: comparando tal cual no
         casaba ni una y el marcador salía vacío. Se cambia el espacio
         por la T antes de buscar. */
      const local = new Date(iso).toLocaleString('sv', { timeZone: fc.timezone })
        .slice(0, 13).replace(' ', 'T');
      const i = H.time.findIndex(t => t.slice(0, 13) === local);
      if (i < 0) continue;

      /* De noche el visible no vale: se descarta por brillo total bajo
         en TODA la caja, que es como se ve una imagen sin luz. */
      const deNoche = claros < 0.5 && Number(hh) > 19;
      if (deNoche) continue;

      const real = leeSat(claros);
      const fila = { sitio: s.n, hora: local.slice(11) + ':00', claros: Math.round(claros), real, mod: {} };
      for (const [nom, om] of MODELOS) {
        const v = H[`cloud_cover_${om}`]?.[i];
        if (v == null) continue;
        fila.mod[nom] = { v, lee: leeMod(v), fallo: fallo(leeMod(v), real) };
      }
      filas.push(fila);
    }
  }

  if (!filas.length) {
    console.log('  ✗ Ni una hora medible. No se apunta nada.');
    process.exit(1);
  }

  /* ── EL RECUENTO ─────────────────────────────────────────────────── */
  const cuenta = {};
  for (const [nom] of MODELOS) cuenta[nom] = { n: 0, clava: 0, cerca: 0, lejos: 0, suma: 0 };
  for (const f of filas) for (const [nom, d] of Object.entries(f.mod)) {
    const c = cuenta[nom];
    c.n++; c.suma += d.fallo;
    if (d.fallo === 0) c.clava++; else if (d.fallo === 1) c.cerca++; else c.lejos++;
  }

  console.log('\n  QUIÉN ACIERTA EL CIELO (contra el satélite)\n');
  console.log(`  ${'modelo'.padEnd(12)} ${'horas'.padStart(6)} ${'clava'.padStart(7)} ${'cerca'.padStart(7)} ${'LEJOS'.padStart(7)}`);
  const orden = Object.entries(cuenta).filter(([, c]) => c.n)
    .sort((a, b) => (a[1].suma / a[1].n) - (b[1].suma / b[1].n));
  for (const [nom, c] of orden) {
    console.log(`  ${nom.padEnd(12)} ${String(c.n).padStart(6)} `
      + `${(100 * c.clava / c.n).toFixed(0).padStart(6)}% `
      + `${(100 * c.cerca / c.n).toFixed(0).padStart(6)}% `
      + `${(100 * c.lejos / c.n).toFixed(0).padStart(6)}%`);
  }
  console.log(`\n  «LEJOS» es confundir despejado con nuboso o peor: es lo que le molesta.`);

  /* ── SE APUNTA, SIN PISAR LO DE ANTES ────────────────────────────── */
  const f = path.join(aqui, 'data', 'cielo-marcador.md');
  const hoy = filas[0] ? new Date().toISOString().slice(0, 10) : '';
  let txt = '';
  if (!fs.existsSync(f)) {
    txt += `# Quién acierta el cielo, medido contra el satélite\n\n`
      + `Cada tanda es una ejecución de \`medir-cielo.mjs\`. La referencia es el\n`
      + `satélite visible de EUMETSAT —una MEDIDA, no otro modelo— y lo que se\n`
      + `compara es LA LECTURA (despejado/pocas/nuboso/cubierto), no el\n`
      + `porcentaje: el brillo del satélite y el «% de nubosidad» de un modelo\n`
      + `no son la misma escala.\n\n`
      + `**«LEJOS» es confundir despejado con nuboso o peor.** Es su queja:\n`
      + `«me mosqueo cuando dice esta mañana sol y me dibuja una nube todo el\n`
      + `día». Un día no decide nada — hace falta una semana.\n`;
  }
  txt += `\n## Tanda del ${hoy} (${new Date().toTimeString().slice(0, 5)})\n\n`
    + `${filas.length} horas medibles, ${SITIOS.length} emplazamientos.\n\n`
    + `| modelo | horas | clava | cerca | LEJOS |\n|---|---|---|---|---|\n`;
  for (const [nom, c] of orden) {
    txt += `| ${nom} | ${c.n} | ${(100 * c.clava / c.n).toFixed(0)} % | `
      + `${(100 * c.cerca / c.n).toFixed(0)} % | **${(100 * c.lejos / c.n).toFixed(0)} %** |\n`;
  }
  txt += `\nHoras medidas, sitio por sitio:\n\n`;
  for (const f2 of filas.slice(0, 40)) {
    const quien = Object.entries(f2.mod).map(([n, d]) => `${n} ${d.v}`).join(' · ');
    txt += `- **${f2.sitio} ${f2.hora}** — satélite ${f2.claros} % claros → **${f2.real}** · ${quien}\n`;
  }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.appendFileSync(f, txt);
  console.log(`\n  Apuntado en data/cielo-marcador.md (${filas.length} horas)`);
}

main().catch(e => {
  console.log(`  ✗ ${e.message}`);
  console.log('    NO se apunta nada: un marcador a medias es peor que ninguno.');
  process.exit(1);
});
