/* ═══════════════════════════════════════════════════════════════════
   LA APP PONE EL TIEMPO. ÉL DECIDE.

   Orden suya del 28-08-2026, viendo en ARBAIZA un «riesgo sirimiri, no
   se tocan los cuadros eléctricos»:

     «¿Por lo que lo digáis vosotros? Además ayer os comenté: hasta con
      lluvia tengo que tocarlos. Y los cuadros están DENTRO de la caseta.
      Otra cosa es el contador, a 1 metro del suelo, pero también se
      puede revisar. Esos comentarios mejor no ponerlos, YO DECIDO.»

     «Vosotros me tenéis que poner: en Sollube o en Arbaiza te va a
      llover fuerte, va a haber rachas de tal, no habrá rayos… solo info
      del tiempo en ese lugar, detallada, y yo decido si se va, si se va
      más tarde, si se sube al poste.»

   Y tiene razón de sobra: **la app no sabe qué avería es, ni si el
   cuadro está dentro, ni si lleva guantes.** Él sí.

   Esto recorre TODO el texto que él puede leer y falla si aparece una
   orden. No mira los comentarios del código —ahí sí se explica el
   porqué— solo lo que sale en pantalla.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

/* Frases que MANDAN. La app no manda. */
const ORDENES = [
  /\bno se sube\b/i, /\bno subas\b/i, /\bno se tocan?\b/i, /\bno se abren?\b/i,
  /\bno abras\b/i, /\bno toques\b/i, /\bno se trabaja\b/i,
  /\bantes de autorizar\b/i, /\btrátalo como\b/i, /\bdeberías\b/i,
  /\btienes que (ir|esperar|subir|bajar)\b/i, /\bno vayas\b/i, /\bespera a que\b/i,

  /* ── LOS RÓTULOS QUE AUTORIZAN ──────────────────────────────────────
     Añadidos el 28-08-2026, y por un fallo mío. Esa mañana quité de toda
     la app los rótulos que deciden —orden suya repetida cinco veces:
     «vosotros cifras, pronósticos perfectos y yo decido»— y **me dejé uno
     vivo**: un `NO APTO` en el bloque de avisos.

     Lo encontró la otra sesión leyendo el código publicado, no este
     guardián, que es lo que más molesta: el guardián existe justo para
     eso. Vigilaba las frases largas («no se sube», «no se tocan») y no
     los rótulos de una palabra, que son los que más deciden porque son
     los que se leen de un vistazo.

     Ahora también. Si alguien vuelve a escribir APTO, NO APTO o
     PRECAUCIÓN en pantalla, la publicación se para. */
  /\bNO APTO\b/, /\bAPTO\b/, /\bPRECAUCI[ÓO]N\b/, /\bAUTORIZADO\b/,
  /\bPROHIBIDO\b/, /\bPUEDES SUBIR\b/i, /\bNO PUEDES\b/i,
];

/* Lo que sí puede decir: el tiempo y su consecuencia física. Estas no
   son órdenes aunque lo parezcan, y por eso se dejan pasar. */
const PERMITIDO = [
  /moja/i, /mojad/i, /resbal/i, /racha/i, /rayo/i, /descarga/i,
];

function textosVisibles(fichero) {
  const src = fs.readFileSync(fichero, 'utf8');
  /* Fuera los comentarios: ahí se explica el porqué de las cosas y ahí
     sí aparecen las frases, citadas. */
  const sinComentarios = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  return sinComentarios;
}

let mal = 0;
for (const f of ['app.js', 'index.html']) {
  const t = textosVisibles(path.join(__dirname, f));
  for (const re of ORDENES) {
    const m = t.match(new RegExp('.{0,70}' + re.source + '.{0,70}', 'gi'));
    if (!m) continue;
    for (const trozo of m) {
      console.log(`  ✗ ${f}: «…${trozo.replace(/\s+/g, ' ').trim()}…»`);
      mal++;
    }
  }
}

if (mal) {
  console.log('');
  console.log('  La app pone el tiempo; él decide. Dilo como dato, no como orden:');
  console.log('    «no se sube»   →  «moja: pates y peldaños resbalan»');
  console.log('    «no se tocan»  →  «lo que esté a la intemperie estará mojado»');
  console.log('    «no se trabaja»→  «racha de 78: a ras de suelo se nota»');
  process.exit(1);
}
console.log(`  ✓ ningún texto de pantalla le dice qué hacer`);
