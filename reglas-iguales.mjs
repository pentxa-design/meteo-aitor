/* ═══════════════════════════════════════════════════════════════════
   LAS TRES WEBS LLEVAN LAS MISMAS REGLAS DEL TIEMPO, O NO SE PUBLICA
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-10-2026: «estar mal en las 3 apps, eso no puede ser» · «raíz».
   El porqué era que cada web llevaba su copia escrita a mano. Ahora la
   copia es una (reglas-tiempo.js) y esto comprueba tres cosas:

     1. Que app.js NO tenga su propia versión de una regla que vive en
        reglas-tiempo.js: si declara una función con el mismo nombre, tiene
        que ser un envoltorio que llame a ReglasTiempo.
     2. Que el Centro Operativo lleve el fichero ENTERO y sin una letra
        distinta entre sus marcas.
     3. Que la agenda lo lleve igual en lib/reglas-tiempo.mjs.

   Si no están las carpetas de las otras dos (otro aparato), se DICE: no se
   da por bueno lo que no se ha podido mirar.
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FUENTE, CO, AGENDA, AGENDA_WEB, CABECERA_WEB, fuente, bloqueCO, cuerpoAgenda } from './sincronizar-reglas.mjs';

export function mirar() {
  const F = fuente();
  const mal = [], dice = [];

  /* 1. app.js no lleva su propia copia. */
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(F + '\n;globalThis.__R = ReglasTiempo;', ctx);
  const nombres = Object.keys(ctx.__R).filter(k => typeof ctx.__R[k] === 'function');
  const app = fs.readFileSync(path.join(path.dirname(FUENTE), 'app.js'), 'utf8');
  for (const n of nombres) {
    const m = app.match(new RegExp(`^function ${n}\\([^)]*\\)\\s*\\{([\\s\\S]*?)^\\}`, 'm'))
           || app.match(new RegExp(`^function ${n}\\([^)]*\\)\\s*\\{(.*)\\}`, 'm'));
    if (m && !new RegExp(`ReglasTiempo\\.${n}\\(`).test(m[1]))
      mal.push(`app.js tiene su propia «function ${n}» y no llama a ReglasTiempo.${n}: es una segunda copia de la regla`);
  }

  /* 2. Centro Operativo. */
  if (!fs.existsSync(CO)) dice.push(`⚠ SIN MIRAR el Centro Operativo: no encuentro ${CO}`);
  else {
    const b = bloqueCO(fs.readFileSync(CO, 'utf8'));
    if (b === null) mal.push('el Centro Operativo (js/weather.js) no lleva las reglas del tiempo entre sus marcas ▼▼▼/▲▲▲ — pásale `node sincronizar-reglas.mjs`');
    else if (b !== F) mal.push(`las reglas del Centro Operativo NO son iguales a reglas-tiempo.js (${difiere(b, F)}) — pásale \`node sincronizar-reglas.mjs\` y publícalo`);
  }

  /* 3. Agenda. */
  if (!fs.existsSync(path.dirname(AGENDA))) dice.push(`⚠ SIN MIRAR la agenda: no encuentro ${path.dirname(AGENDA)}`);
  else if (!fs.existsSync(AGENDA)) mal.push('la agenda no lleva lib/reglas-tiempo.mjs — pásale `node sincronizar-reglas.mjs`');
  else {
    const c = cuerpoAgenda(fs.readFileSync(AGENDA, 'utf8'));
    if (c === null) mal.push('lib/reglas-tiempo.mjs de la agenda no es una copia (le falta la cabecera o el pie)');
    else if (c !== F) mal.push(`las reglas de la agenda NO son iguales a reglas-tiempo.js (${difiere(c, F)}) — pásale \`node sincronizar-reglas.mjs\` y publícala`);
  }
  if (fs.existsSync(path.dirname(AGENDA_WEB))) {
    const w = fs.existsSync(AGENDA_WEB) ? fs.readFileSync(AGENDA_WEB, 'utf8') : null;
    if (w === null) mal.push('la agenda no lleva reglas-tiempo.js para el navegador — pásale `node sincronizar-reglas.mjs`');
    else if (!w.startsWith(CABECERA_WEB) || w.slice(CABECERA_WEB.length) !== F)
      mal.push(`el reglas-tiempo.js del navegador de la agenda NO es igual (${difiere(w.slice(CABECERA_WEB.length), F)}) — pásale \`node sincronizar-reglas.mjs\``);
  }

  for (const d of dice) console.log('  ' + d);
  if (mal.length) {
    console.log('  ✗ LAS TRES WEBS NO LLEVAN LAS MISMAS REGLAS DEL TIEMPO:');
    for (const m of mal) console.log('     ' + m);
    return false;
  }
  console.log(`  ✓ las reglas del tiempo son UNA: app, Centro Operativo y agenda llevan reglas-tiempo.js tal cual (${nombres.length} reglas)`);
  return true;
}

function difiere(a, b) {
  const la = a.split('\n'), lb = b.split('\n');
  for (let i = 0; i < Math.max(la.length, lb.length); i++)
    if (la[i] !== lb[i]) return `primera diferencia en la línea ${i + 1}: «${(la[i] ?? '(nada)').trim().slice(0, 60)}»`;
  return 'distinto final';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) process.exit(mirar() ? 0 : 1);
