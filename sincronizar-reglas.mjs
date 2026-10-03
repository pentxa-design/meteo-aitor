/* ═══════════════════════════════════════════════════════════════════
   COPIA LAS REGLAS DEL TIEMPO A LAS OTRAS DOS WEBS, LETRA POR LETRA
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-10-2026: «estar mal en las 3 apps, eso no puede ser». Las
   reglas viven SOLO en reglas-tiempo.js. Esto las pone tal cual:

     · en el Centro Operativo, dentro de js/weather.js, entre las dos
       marcas ▼▼▼ / ▲▲▲ (solo se toca ese fichero: es la regla de ese chat);
     · en la agenda, en lib/reglas-tiempo.mjs (servidor) y reglas-tiempo.js
       (navegador).

   Nadie las edita allí: `reglas-iguales.mjs` no deja publicar ninguna de
   las tres si una copia se separa en una letra.

       node sincronizar-reglas.mjs          copia
       node sincronizar-reglas.mjs --mirar  solo dice si están iguales
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const FUENTE = path.join(AQUI, 'reglas-tiempo.js');
export const CO = path.resolve(AQUI, '..', 'centro-operativo', 'js', 'weather.js');
export const AGENDA = path.resolve(AQUI, '..', 'agenda-familiar', 'lib', 'reglas-tiempo.mjs');
/* Y la del navegador de la agenda (su portada parte las horas en tramos allí). */
export const AGENDA_WEB = path.resolve(AQUI, '..', 'agenda-familiar', 'reglas-tiempo.js');
export const CABECERA_WEB = '// Copia exacta de weather-app/reglas-tiempo.js, la pone weather-app/sincronizar-reglas.mjs.\n// NO SE EDITA AQUÍ: se edita allí y se vuelve a copiar.\n';
export const INICIO = '/* ▼▼▼ REGLAS DEL TIEMPO — copia exacta de weather-app/reglas-tiempo.js, la pone weather-app/sincronizar-reglas.mjs. NO SE EDITA AQUÍ: se edita allí y se vuelve a copiar ▼▼▼ */';
export const FIN = '/* ▲▲▲ FIN DE LAS REGLAS DEL TIEMPO ▲▲▲ */';
export const CABECERA_AGENDA = '// Copia exacta de weather-app/reglas-tiempo.js, la pone weather-app/sincronizar-reglas.mjs.\n// NO SE EDITA AQUÍ: se edita allí y se vuelve a copiar.\n';
export const PIE_AGENDA = '\nexport default ReglasTiempo;\nexport { ReglasTiempo };\n';

export const fuente = () => fs.readFileSync(FUENTE, 'utf8');

/** Lo que hay entre las marcas en el weather.js del Centro Operativo (null si no están). */
export function bloqueCO(txt) {
  const i = txt.indexOf(INICIO), j = txt.indexOf(FIN);
  if (i < 0 || j < 0 || j < i) return null;
  return txt.slice(i + INICIO.length + 1, j);
}
/** Lo que lleva la agenda, sin su cabecera ni su pie (null si no es una copia). */
export function cuerpoAgenda(txt) {
  if (!txt.startsWith(CABECERA_AGENDA) || !txt.endsWith(PIE_AGENDA)) return null;
  return txt.slice(CABECERA_AGENDA.length, txt.length - PIE_AGENDA.length);
}

function copiar() {
  const F = fuente();
  const hechos = [];
  if (fs.existsSync(CO)) {
    let w = fs.readFileSync(CO, 'utf8');
    const bloque = `${INICIO}\n${F}${FIN}`;
    if (bloqueCO(w) !== null) {
      const i = w.indexOf(INICIO), j = w.indexOf(FIN) + FIN.length;
      w = w.slice(0, i) + bloque + w.slice(j);
    } else {
      const ancla = 'const Meteo = (() => {\n';
      if (!w.includes(ancla)) throw new Error(`no encuentro «const Meteo = (() => {» en ${CO}`);
      w = w.replace(ancla, ancla + '\n' + bloque + '\n');
    }
    fs.writeFileSync(CO, w);
    hechos.push('Centro Operativo (js/weather.js)');
  } else hechos.push(`⚠ no encuentro ${CO}: el Centro Operativo NO se ha copiado`);
  if (fs.existsSync(path.dirname(AGENDA))) {
    fs.writeFileSync(AGENDA, CABECERA_AGENDA + F + PIE_AGENDA);
    fs.writeFileSync(AGENDA_WEB, CABECERA_WEB + F);
    hechos.push('agenda (lib/reglas-tiempo.mjs y reglas-tiempo.js)');
  } else hechos.push(`⚠ no encuentro ${path.dirname(AGENDA)}: la agenda NO se ha copiado`);
  return hechos;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (process.argv.includes('--mirar')) {
    const { mirar } = await import('./reglas-iguales.mjs');
    process.exit(mirar() ? 0 : 1);
  }
  for (const h of copiar()) console.log('  ✓ copiadas a ' + h);
  console.log('  → publica también el Centro Operativo (./publicar-cloudflare.sh) y la agenda (./deploy.sh): hasta entonces, lo publicado de esas dos no lleva estas reglas.');
}
