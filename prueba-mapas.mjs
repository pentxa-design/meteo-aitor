/* ═══════════════════════════════════════════════════════════════════
   EL MAPA, COMPROBADO DE VERDAD
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026 a las 16:15, con el mapa en blanco toda la tarde y
   teniendo que irse a Windy:

     *«ni mirar mi mapa puedo, qué tristeza»*
     *«menos mal que te digo de revisar a diario, pero aquí el único que
       busca fallos soy yo»*
     *«si revisaras mapas hubieras encontrado el fallo»*

   Y llevaba razón entera. Ese día había **1.100 pruebas** corriendo en
   cada publicación —el vigilante, los avisos, el almacén, los iconos,
   las restas— y **ninguna tocaba el mapa**. Lo único que él usa que no
   vigilaba nadie. Lo encontró él, a las cuatro de la tarde, después de
   una mañana entera de fallos.

   Aquella vez no se había roto nada aquí: el host viejo de teselas
   estaba caído y `api.open-meteo.com` iba bien. Pero eso no lo salva:
   **si nadie mira, da igual de quién sea la culpa, porque lo descubre
   él.**

   ── POR QUÉ ESTO AVISA Y NO BLOQUEA ──
   La cartografía la sirve Open-Meteo. Que su servidor esté caído no es
   motivo para no poder publicar un arreglo de otra cosa — sería
   dejarle sin arreglos por un fallo ajeno. Así que **se dice a gritos y
   se sigue**. Lo que no puede pasar es que no se diga.
   ═══════════════════════════════════════════════════════════════════ */

/* El 04-09-2026 por la tarde el host viejo (map-tiles.open-meteo.com)
   desapareció del DNS. Este es el origen S3 que usa la librería oficial. */
const TILES = 'https://openmeteo.s3.amazonaws.com/data_spatial';
/* Los modelos del selector del mapa que tienen teselas propias. */
const MODELOS = [
  ['ECMWF HRES', 'ecmwf_ifs025'],
  ['AROME HD', 'meteofrance_arome_france_hd'],
  ['ICON-EU', 'dwd_icon_eu'],
  ['GFS', 'ncep_gfs025'],
];

let bien = 0, mal = 0, caidos = 0;
const ok = (q, c, p = '') => { c ? (bien++, console.log(`    ✓ ${q}`))
                                 : (mal++, console.log(`    ✗ ${q}${p ? `\n        ${p}` : ''}`)); };

const pide = async (u, ms = 15000) => {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(ms) });
    return { ok: r.ok, status: r.status, r };
  } catch (e) { return { ok: false, status: 0, err: String(e?.message || e) }; }
};


/* ── EL HOST MUERTO NO PUEDE VOLVER A COLARSE ─────────────────────────
   `map-tiles.open-meteo.com` ya no existe. Si alguien lo vuelve a
   escribir en un fichero de la app —por copiar de un comentario viejo,
   por deshacer un cambio— el mapa se queda en blanco otra vez sin que
   nadie se entere hasta que lo vea él. Esto lo para antes de publicar. */
import { readFileSync, readdirSync } from 'node:fs';
{
  const ficheros = ['maps.js', 'app.js', 'index.html', 'sw.js',
    ...readdirSync('api').filter(f => /\.(m?js)$/.test(f)).map(f => 'api/' + f),
    ...readdirSync('netlify/functions').filter(f => /\.(m?js)$/.test(f)).map(f => 'netlify/functions/' + f)];
  const conElViejo = ficheros.filter(f => {
    const t = readFileSync(f, 'utf8');
    /* Se busca en CÓDIGO, no en comentarios: quitar el comentario que
       explica la mudanza sería perder la historia. */
    const sinComentarios = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    return /map-tiles\.open-meteo\.com/.test(sinComentarios);
  });
  ok('el host muerto (map-tiles.open-meteo.com) no está en ningún fichero de código',
     conElViejo.length === 0, conElViejo.length ? `está en: ${conElViejo.join(', ')}` : '');
}

/* ── LOS BLOQUES CON SU RANGO EN LA URL (14-09-2026) ───────────────
   Medido desde el portátil: 24 trozos de 256 KB por capa, todos MISS en
   el CDN porque iban con cabecera Range. maps.js los pide ahora como
   `?rango=a-b` (y el HEAD como `?cabecera=1`) y api/omtiles.js los
   contesta con 200 y un día de CDN. Si alguien quita una de las dos
   mitades, el mapa sigue funcionando… igual de lento que antes, y nadie
   se entera. Esto lo mira. */
{
  const proxy = readFileSync('api/omtiles.js', 'utf8');
  const mapa = readFileSync('maps.js', 'utf8');
  ok('api/omtiles.js entiende el bloque por URL (?rango=a-b) y la cabecera (?cabecera=1)',
     /searchParams\.get\('rango'\)/.test(proxy) && /searchParams\.get\('cabecera'\)/.test(proxy));
  ok('… y los contesta con 200 y un día de CDN (cabeceras(86400', /cabeceras\(86400, \{ navegador: 86400/.test(proxy));
  ok('maps.js precalienta el mapa al abrir la app con la MISMA caché de bloques que open()',
     /async calentar\(\)/.test(mapa) && (mapa.match(/this\.ajustarCacheDeBloques\(\)/g) || []).length >= 2
     && /Maps\.calentar\(\)/.test(mapa));
  ok('maps.js envuelve fetch: HEAD .om → ?cabecera=1 y Range → ?rango=',
     /\?cabecera=1/.test(mapa) && /\?rango=\$\{m\[1\]\}-\$\{m\[2\]\}/.test(mapa) && /instalarBloquesPorUrl\(\);/.test(mapa));
}

console.log('\n  El servidor de mapas de Open-Meteo\n');

const raiz = await pide(`${TILES}/dwd_icon_eu/latest.json`);
if (!raiz.ok) {
  caidos++;
  console.log(`    ⚠ NO CONTESTA (${raiz.status || raiz.err}).`);
  console.log('      La cartografía la sirve Open-Meteo, no esta app. El mapa');
  console.log('      estará en blanco hasta que vuelvan. El resto de la app va');
  console.log('      por otra vía (api.open-meteo.com) y sigue en pie.');
  const api = await pide('https://api.open-meteo.com/v1/forecast?latitude=43&longitude=-2&hourly=temperature_2m&forecast_days=1');
  console.log(`      Comprobado: la API de datos contesta ${api.status} — ${api.ok ? 'esa SÍ va' : 'esa TAMPOCO va'}.`);
} else {
  ok('el catálogo del modelo se lee (latest.json)', true);

  /* Y cada modelo del selector, que es lo que él pincha. */
  for (const [nom, om] of MODELOS) {
    const m = await pide(`${TILES}/${om}/latest.json`);
    if (!m.ok) { caidos++; console.log(`    ⚠ ${nom}: no contesta (${m.status || m.err})`); continue; }
    let j = null;
    try { j = await m.r.json(); } catch { /* abajo */ }
    ok(`${nom} trae su catálogo con la pasada dentro`,
       !!(j && (j.reference_time || j.variables || j.time)),
       JSON.stringify(j || {}).slice(0, 90));
  }
}

console.log(`\n  ${bien} bien, ${mal} mal${caidos ? ` · ${caidos} sin contestar (fuente de fuera)` : ''}\n`);
/* Solo se corta la publicación si el fallo es NUESTRO (una comprobación
   que falla estando el servidor en pie). Si está caído, se avisa. */
process.exit(mal ? 1 : 0);
