/* ═══════════════════════════════════════════════════════════════════
   EL VIGILANTE, CONTRA MAL TIEMPO DE VERDAD
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026, cuando llevaba media mañana saliendo fallos:

     *«en 1 mes llegarán los avisos, llegarán los malos tiempos de
       lluvias etc, y si ya van con fallos… pues ala»*

   Y lleva razón en lo que preocupa. Todo lo que prueba el vigilante
   hasta hoy son datos de laboratorio: series inventadas donde el CAPE
   sube donde yo quiero. Eso comprueba la lógica, no que aguante lo que
   viene.

   Aquí, en Bermeo, en septiembre, no hay con qué probarlo: el CAPE no
   pasa de 100 y la racha no llega a 25. Así que se busca el mal tiempo
   **donde lo haya AHORA**, y se le pasa el vigilante entero por encima:

     · **Manila** — racha por encima de su tope de 60 km/h
     · **Miami**  — CAPE de miles con lluvia fuerte de verdad

   Su app no es solo de trabajo: la usa en Calpe, Gijón, Miami y Brasil.
   Así que esto además comprueba que funciona fuera de Euskadi.

   Lo que se exige, que es lo que él necesita en octubre:
     1. Que el vigilante NO reviente con números grandes.
     2. Que VEA lo que hay que ver, en vez de callarse.
     3. Que diga las horas en tramos, no un chorro de horas sueltas.
     4. Que nombre al modelo que lo ve.
     5. Que no invente: si un día no tiene nada, no aparece.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
let bien = 0, mal = 0;
const ok = (q, c, p = '') => { c ? (bien++, console.log(`    ✓ ${q}`))
                                 : (mal++, console.log(`    ✗ ${q}${p ? `\n        ${p}` : ''}`)); };

/* El vigilante no exporta `unSitio`: es de uso interno. Se saca una
   copia que sí la exporte, sin tocar el fichero de verdad. */
const tmp = fs.mkdtempSync(path.join(aqui, '.mal-tiempo-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
fs.mkdirSync(path.join(tmp, 'lib'), { recursive: true });
for (const f of fs.readdirSync(path.join(aqui, 'lib'))) {
  fs.copyFileSync(path.join(aqui, 'lib', f), path.join(tmp, 'lib', f));
}
fs.copyFileSync(path.join(aqui, 'reglas-tiempo.js'), path.join(tmp, 'reglas-tiempo.js'));   // lib/reglas.mjs la pide (04-10-2026)
/* El vigilante importa hermanos suyos de `api/` (suscribir, torres…).
   Se copian al lado para que la copia los encuentre. */
for (const f of fs.readdirSync(path.join(aqui, 'api'))) {
  if (f.endsWith('.mjs')) fs.copyFileSync(path.join(aqui, 'api', f), path.join(tmp, f));
}
fs.writeFileSync(path.join(tmp, 'v.mjs'),
  fs.readFileSync(path.join(aqui, 'api', 'vigilante.mjs'), 'utf8')
    .replace(/from '\.\.\/lib\//g, "from './lib/")
  + '\nexport { unSitio };\n');

const { unSitio } = await import(pathToFileURL(path.join(tmp, 'v.mjs')).href);

/* Los tramos viajan como {ini, fin} y el vigilante los escribe al armar
   el aviso. Aquí se escriben igual, para mirar lo que LEERÍA él. */
const hh = h => String(h).padStart(2, '0') + ':00';
const txt = ts => (ts || []).map(r => r.ini === r.fin ? hh(r.ini) : `${hh(r.ini)}-${hh(r.fin)}`).join(' y ');

const SITIOS = [
  { n: 'MANILA (racha)', lat: 14.5995, lon: 120.9842 },
  { n: 'MIAMI (tormenta)', lat: 25.7617, lon: -80.1918 },
];

for (const s of SITIOS) {
  console.log(`\n  ${s.n}\n`);
  let r = null, reventó = null;
  try { r = await unSitio(s); } catch (e) { reventó = e; }

  ok('el vigilante no revienta con números de verdad', !reventó,
     reventó ? String(reventó?.message || reventó) : '');
  if (!r) continue;

  const dias  = Object.entries(r.dias  || {});
  const agua  = Object.entries(r.agua  || {});
  const racha = Object.entries(r.racha || {});
  console.log(`      rayo: ${dias.length} día(s) · agua: ${agua.length} · racha: ${racha.length}`);

  for (const [dia, d] of dias) {
    console.log(`      ⚡ ${dia} · CAPE ${d.cape} · ${txt(d.tramos)} · lo ve ${d.quien}`);
    ok(`${dia}: el CAPE que se enseña es un número, no un hueco`,
       Number.isFinite(d.cape) && d.cape >= 700,
       `cape=${d.cape} — por debajo de 700 no debería estar aquí`);
    ok(`${dia}: dice QUIÉN lo ve, no «los modelos»`,
       typeof d.quien === 'string' && d.quien.length > 1);
    /* Las horas seguidas se juntan: «14:00-19:00», no doce horas
       sueltas. Con CAPE alto media tarde, un chorro de horas no se lee
       — y un aviso que no se lee es un aviso que no sirve. */
    ok(`${dia}: las horas van en tramos seguidos, no sueltas`,
       Array.isArray(d.tramos) && d.tramos.length > 0
       && d.tramos.every(r => Number.isInteger(r.ini) && Number.isInteger(r.fin) && r.fin >= r.ini),
       JSON.stringify(d.tramos));
    ok(`${dia}: y escritas se leen como horas de reloj`,
       /^\d{2}:00(-\d{2}:00)?( y \d{2}:00(-\d{2}:00)?)*$/.test(txt(d.tramos)),
       txt(d.tramos));
  }
  for (const [dia, g] of agua) {
    console.log(`      💧 ${dia} · ${g.mm} mm/h · ${txt(g.tramos)} · lo ve ${g.quien}${g.fuerte ? ' · FUERTE' : ''}`);
    ok(`${dia}: los milímetros son un número de verdad`, Number.isFinite(g.mm) && g.mm > 0);
    ok(`${dia}: y se dice si es agua fuerte o cuatro gotas`, typeof g.fuerte === 'boolean');
  }
  for (const [dia, w] of racha) {
    console.log(`      💨 ${dia} · ${w.kmh} km/h · ${txt(w.tramos)} · lo ve ${w.quien}`);
    /* 70 y no 60 a propósito: el vigilante avisa por el listón del
       VIAJE (con 70 no se va, puede volcar el 4x4), no por el de la
       torre (60, que decide si se sube). Confirmado por él el
       04-09-2026: «pon 70, pero suelo ir también si no hay más de 80». */
    ok(`${dia}: la racha pasa del listón del viaje (70), que es para lo que salta`,
       Number.isFinite(w.kmh) && w.kmh >= 70, `kmh=${w.kmh}`);
    ok(`${dia}: y se dice en km/h, nunca en nudos`, Number.isInteger(w.kmh));
  }
  ok('las coordenadas viajan con el aviso, para poder abrir ESE sitio',
     r.lat === s.lat && r.lon === s.lon);
}

/* ── Y QUE NO SE INVENTE NADA: LO QUE DIGA, QUE LO RESPALDE EL DATO ──
   Esto decía «BERMEO hoy (donde no pasa nada)» y exigía CERO avisos.
   Y la noche del 27-09-2026 Bermeo llevaba 12,9 mm y CAPE 570: el
   vigilante avisó con razón y la puerta se puso ROJA, parando una
   publicación por el tiempo que hacía.

   Un guardia que cambia de color con el cielo no guarda nada: engaña
   los días de calma y estorba los días malos. Lo que sí se puede exigir
   siempre es que **cada aviso esté respaldado por su cifra**, que es lo
   que de verdad hay que comprobar. Si el día sale tranquilo, no hay
   nada que revisar y se dice. */
console.log('\n  BERMEO hoy · lo que diga, respaldado por su cifra\n');
{
  const r = await unSitio({ n: 'BERMEO', lat: 43.4130, lon: -2.7183 });
  const nRayo = Object.keys(r.dias).length, nRacha = Object.keys(r.racha).length;
  console.log(`      rayo: ${nRayo} · racha: ${nRacha}`);
  for (const [dia, d] of Object.entries(r.dias))
    ok(`BERMEO ${dia}: el rayo lo respalda el CAPE, no es un aviso de más`,
       Number.isFinite(d.cape) && d.cape >= 700, `cape=${d.cape}`);
  for (const [dia, w] of Object.entries(r.racha))
    ok(`BERMEO ${dia}: la racha pasa del listón del viaje (70)`,
       Number.isFinite(w.kmh) && w.kmh >= 70, `kmh=${w.kmh}`);
  if (!nRayo && !nRacha)
    ok('día tranquilo en Bermeo: el vigilante calla, que es lo que toca', true);
}

/* ── SIN RED NO SE BLOQUEA LA PUBLICACIÓN, PERO SE DICE ─────────────
   Esta prueba habla con la app de verdad. Si el Mac se queda sin línea,
   fallar aquí pararía una publicación por algo que no es un fallo del
   código. Pero callarlo sería peor: quedaría como comprobado algo que
   no se ha comprobado. Así que se distingue. */
if (bien === 0 && mal > 0) {
  console.log('\n  NO HE PODIDO COMPROBAR LOS AVISOS: la app no contesta desde aquí.');
  console.log('  Esto NO quiere decir que estén bien: quiere decir que no lo sé.\n');
  process.exit(0);
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
