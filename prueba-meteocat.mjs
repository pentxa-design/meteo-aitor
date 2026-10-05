/* ═══════════════════════════════════════════════════════════════════
   LOS PLUVIÓMETROS DE METEOCAT: QUE SUMEN BIEN Y QUE NO GASTEN DE MÁS
   ───────────────────────────────────────────────────────────────────
   (05-10-2026, «ojo con el gasto»). Se arranca lib/meteocat.mjs con un
   almacén en memoria y una red de mentira que cuenta las consultas:
     · Barcelona coge la estación más cercana y suma las medias horas.
     · Repetir enseguida NO vuelve a pedir nada (caché del almacén).
     · Fuera de Cataluña no se pide nada.
     · Pasado el tope del mes, no se pide y se dice «sin cupo».
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const aqui = path.dirname(fileURLToPath(import.meta.url));
let bien = 0, mal = 0;
const ok = (n, c, x = '') => { if (c) { bien++; console.log('    ✓ ' + n); } else { mal++; console.log('    ✗ ' + n + (x ? '\n        ' + x : '')); } };

const tmp = fs.mkdtempSync(path.join(aqui, '.meteocat-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
fs.mkdirSync(path.join(tmp, 'lib'));
for (const f of ['meteocat.mjs', 'almacen.mjs']) fs.copyFileSync(path.join(aqui, 'lib', f), path.join(tmp, 'lib', f));
fs.writeFileSync(path.join(tmp, 'lib', 'motor.mjs'), `
export const motor = () => 'memoria';
const M = () => (globalThis.__ALMACEN ??= new Map());
export async function leerTexto(r) { const v = M().get(r); return v == null ? null : String(v); }
export async function leerCrudo(r) { return null; }
export async function guardarTexto(r, t) { M().set(r, String(t)); }
export async function guardarCrudo(r, b) {}
export async function borrarCrudo(r) {}
export const esNoExiste = () => false;
`);
process.env.METEOCAT_KEY2 = 'clave-de-mentira';
const hoy = new Date().toISOString().slice(0, 10);
const consultas = [];
globalThis.fetch = async (u) => {
  consultas.push(String(u));
  const R = o => ({ ok: true, status: 200, json: async () => o, text: async () => JSON.stringify(o) });
  if (String(u).includes('/estacions/metadades')) return R([
    { codi: 'X4', nom: 'Barcelona - el Raval', coordenades: { latitud: 41.3839, longitud: 2.16775 } },
    { codi: 'XX', nom: 'Lejos', coordenades: { latitud: 41.7, longitud: 2.5 } }]);
  if (String(u).includes('/variables/mesurades/35/')) return R([
    { codi: 'X4', variables: [{ codi: 35, lectures: [
      { data: `${hoy}T10:00Z`, valor: 0.2, estat: 'V' }, { data: `${hoy}T10:30Z`, valor: 0.3, estat: 'V' },
      { data: `${hoy}T11:00Z`, valor: 1.0, estat: 'N' }] }] }]);
  return { ok: false, status: 404, text: async () => '' };
};
const { lluviaMeteocat } = await import(pathToFileURL(path.join(tmp, 'lib', 'meteocat.mjs')).href);
console.log('\n  los pluviómetros de Meteocat\n');

const BCN = { lat: 41.39, lon: 2.17 }, BERMEO = { lat: 43.413, lon: -2.718 };
const r1 = await lluviaMeteocat([BCN, BERMEO], [hoy]);
ok('Barcelona coge la estación más cercana (el Raval) y suma las dos medias horas: 0,5 mm a las 10 h', r1[0]?.estacion === 'Barcelona - el Raval' && r1[0].horas[`${hoy}T10`] === 0.5, JSON.stringify(r1[0]));
ok('   y una lectura sin validar (estado N) no cuenta', r1[0]?.horas?.[`${hoy}T11`] === undefined, JSON.stringify(r1[0]?.horas));
ok('Bermeo, fuera de Cataluña, se queda en null', r1[1] === null);
const n1 = consultas.length;
await lluviaMeteocat([BCN], [hoy]);
ok('repetirlo enseguida no gasta: 0 consultas nuevas (la lista y el día, del almacén)', consultas.length === n1, `${consultas.length - n1} nuevas`);
const n2 = consultas.length;
const r3 = await lluviaMeteocat([BERMEO], [hoy]);
ok('pedir solo Bermeo no gasta ni una consulta', consultas.length === n2 && r3[0] === null);
globalThis.__ALMACEN.set('meteocat/cuenta.json', JSON.stringify({ mes: new Date().toISOString().slice(0, 7), n: 600 }));
globalThis.__ALMACEN.delete(`meteocat/lluvia-${hoy}.json`);
let err = null; try { await lluviaMeteocat([BCN], [hoy]); } catch (e) { err = String(e.message); }
ok('con el tope del mes (600) gastado no se pide y se DICE «sin cupo»', /sin cupo/.test(err || '') && consultas.length === n2, err);

console.log(`\n  ${bien} bien · ${mal} mal\n`);
process.exit(mal ? 1 : 0);
