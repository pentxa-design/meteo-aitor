/* Que ningún modelo se quede sin nombre.

   El 27-08-2026 añadí GFS a la lista del parte y del vigilante y **se
   habría llamado «Automático»**, porque el nombre salía de un `if` con
   dos ramas. El nombre de un modelo encima de los números de otro es un
   fallo que ya picó el 24-08 en la ficha de Torre.

   Esto compara las dos listas y falla si alguna no cuadra. */
const fs = require('fs');
let mal = 0;
for (const f of ['api/parte.mjs', 'api/vigilante.mjs']) {
  const s = fs.readFileSync(f, 'utf8');
  const mods = (s.match(/const MODELOS = \[([^\]]*)\]/) || [])[1];
  const noms = (s.match(/const NOMBRE = \{([^}]*)\}/) || [])[1];
  if (!mods || !noms) { console.log(`  ✗ ${f}: no encuentro MODELOS o NOMBRE`); mal++; continue; }
  const lista = mods.split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean);
  const faltan = lista.filter(m => !new RegExp(`\\b${m}\\s*:`).test(noms));
  if (faltan.length) { console.log(`  ✗ ${f}: sin nombre → ${faltan.join(', ')}`); mal++; }
  else console.log(`  ✓ ${f}: los ${lista.length} modelos tienen nombre`);
}
process.exit(mal ? 1 : 0);
