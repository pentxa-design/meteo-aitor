/* ═══════════════════════════════════════════════════════════════════
   NINGUNA CLASE PINTADA SIN ESTILO
   ───────────────────────────────────────────────────────────────────
   Cazado por él el 30-08-2026 con un pantallazo de «10 días»: en la
   tarjeta del lunes, las palabras **«mañana» y «tarde» salían montadas
   encima de la temperatura y de la racha**.

   La causa: el 28-08 se partió el día en dos dibujos —idea suya, *«sol a
   la mañana y nuboso por la tarde: la lógica»*— y se escribió el
   marcado `<span class="dcard__ii">`… **pero el estilo no se escribió
   nunca**. Sin la regla CSS, los dos iconos y sus rótulos caen como
   texto suelto y se montan sobre lo de al lado.

   Y NO LO CAZÓ NADA: `node --check` pasa, ESLint pasa, y el arranque en
   jsdom también —la app no se rompe, solo se ve mal—. Es el mismo
   patrón que el guardia del mapa escrito y sin llamar, o el reparto
   hecho en una pantalla y no en la otra: **la mitad del trabajo hecha,
   sin nadie que compruebe la otra mitad**.

   Suyo esa misma mañana: *«que quede automatizado, sin tener que
   corregir a diario»*. Pues esto.

   QUÉ HACE: saca del código toda clase que se pinta y comprueba que
   exista en `styles.css`. Si falta alguna, NO SE PUBLICA.

   Corre en `revisar.sh`.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const CSS = ['styles.css'];
const CODIGO = ['app.js', 'maps.js', 'index.html'];

/* Clases que vienen de fuera o se montan a mano y no llevan estilo
   nuestro. Para añadir una hay que venir aquí a propósito. */
const DE_FUERA = [
  /^maplibregl/, /^mapboxgl/,          // la librería del mapa trae los suyos
  /^leaflet/, /^om-/,                  // teselas de Open-Meteo
];

/* Contenedores que a propósito NO llevan regla: son cajas que solo
   agrupan, y sus hijos sí están estilados. Se comprobó uno a uno el
   30-08-2026 antes de meterlos aquí — no es una lista para acallar el
   guardia, es una lista de casos mirados. */
const SIN_ESTILO_A_PROPOSITO = {
  cmp:      'bloque BEM: se estilan sus hijos .cmp__*',
  letra:    'bloque BEM: se estilan sus hijos .letra__*',
  ola:      'bloque BEM: se estilan sus hijos .ola__*',
  pt__izq:  'caja que solo agrupa dentro de .pt, sin columna hermana',
  sk:       'marca los textos de «cargando»; el texto ya se lee sin estilo',
};

/* ── Y EL CSS CRÍTICO, QUE VA EN LÍNEA EN EL HEAD ──────────────────
   Añadido el 04-09-2026 al poner el candado. Sus reglas TIENEN que ir
   en línea: si esperaran a `styles.css` se vería la app un instante y
   luego se taparía, que es peor que no taparla. La guardia miraba solo
   `styles.css` y las daba por huérfanas.

   No es un agujero: se sigue exigiendo que la clase tenga estilo en
   algún sitio. Lo que cambia es que ese sitio puede ser el `<style>`
   del `index.html`, que se publica igual que el fichero. */
const enLinea = (fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .match(/<style>([\s\S]*?)<\/style>/g) || []).join('\n');
const css = CSS.map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n')
          + '\n' + enLinea;

/* Las clases QUE EXISTEN en la hoja. Se cogen de los selectores, no del
   fichero entero: así una clase nombrada dentro de un comentario no
   cuenta como definida —que sería el mismo fallo por el otro lado. */
const definidas = new Set();
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/\.([A-Za-z][\w-]*)/g)) {
  definidas.add(m[1]);
}

const usadas = new Map();          // clase → dónde se usa
for (const f of CODIGO) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  /* `class="a b c"` en HTML y en plantillas. Se ignoran los trozos con
     `${…}` dentro, que son clases calculadas y se comprueban solas al
     mirar el resto de la línea. */
  for (const m of src.matchAll(/class\s*=\s*["'`]([^"'`]*)["'`]/g)) {
    /* Si la clase se calcula —`class="tlh${'${'}i === S.sel ? …"`— la comilla
       corta el valor por la mitad y el trozo suelto no es una clase. Se
       queda solo lo de DELANTE del `${'${'}`, que sí es literal. Sin esto el
       guardia señalaba `.sel`, que no existe, y un detector que grita
       donde no hay nada se acaba desconectando. */
    const literal = m[1].split('${')[0];
    for (const c of literal.split(/\s+/)) {
      if (!c || c.includes('{')) continue;
      /* Y si el trozo acaba en `-` o `_` es un modificador a medias
         —`class="rz--"` de `rz--${'${'}estado}`—: tampoco es una clase. */
      if (/[-_]$/.test(c)) continue;
      if (!/^[A-Za-z][\w-]*$/.test(c)) continue;
      if (!usadas.has(c)) usadas.set(c, f);
    }
  }
  /* Y las que se añaden por código: classList.add('x'), className = 'x' */
  for (const m of src.matchAll(/classList\.(?:add|toggle|remove)\(\s*'([\w-]+)'/g)) {
    if (!usadas.has(m[1])) usadas.set(m[1], f);
  }
}

const huerfanas = [...usadas].filter(([c]) =>
  !definidas.has(c)
  && !DE_FUERA.some(rx => rx.test(c))
  && !SIN_ESTILO_A_PROPOSITO[c]);

if (huerfanas.length) {
  console.log('\n  ✗ SE PINTAN CLASES QUE NO EXISTEN EN styles.css:\n');
  for (const [c, f] of huerfanas) console.log(`     .${c}   (en ${f})`);
  console.log('\n     Sin estilo, eso sale como texto suelto y se monta encima de');
  console.log('     lo de al lado. Le pasó el 30-08 con «mañana» y «tarde» sobre');
  console.log('     los números de «10 días». No lo caza node --check ni ESLint.');
  console.log('     Escribe su regla, o añádela a DE_FUERA si viene de fuera.\n');
  process.exit(1);
}

console.log(`  ✓ las ${usadas.size} clases que se pintan tienen su estilo`);
