/* ═══════════════════════════════════════════════════════════════════
   EL MOTOR DE RECAMBIO, EJECUTADO
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-09-2026: *«déjalo montado y listo, que no haya errores»*.

   El 03-09 escribí en la agenda un `RUMBOS` usado antes de declararlo.
   Pasó el `node --check` sin pestañear y dejó la pantalla del tiempo
   con un error en producción. La lección fue clara y es la de aquí:
   **mirar el código no vale; hay que ARRANCARLO.**

   Esto arranca el motor de Redis contra un Upstash de mentira que
   contesta como el de verdad. Si el día que se enchufe el Redis algo
   no cuadra, se cae AQUÍ y no en su móvil un sábado en el monte.

   Lo que se comprueba, y por qué cada cosa:

     · Que elige solo según las variables, sin tocar código.
     · Que lo guardado vuelve igual — texto y bytes.
     · Que un cajón que no existe da vacío **y no lanza**.
     · Que un almacén caído **LANZA y no da vacío**. Ésta es la que
       importa: es el fallo que le costó tres días de app diciendo
       «no hay nada» cuando lo que pasaba era que estaba ciega.
   ═══════════════════════════════════════════════════════════════════ */

let bien = 0, mal = 0;
const ok = (que, cierto, pista = '') => {
  if (cierto) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `\n        ${pista}` : ''}`); }
};

/* ── EL UPSTASH DE MENTIRA ───────────────────────────────────────────
   Habla igual que el de verdad: recibe la orden como lista JSON y
   contesta `{ result: … }`, con `null` cuando la clave no existe. */
const CAJONES = new Map();
const PEDIDAS = [];
let ROMPER = null;                 // para probar el almacén caído

const fetchFalso = async (url, opciones) => {
  const partes = JSON.parse(opciones.body);
  PEDIDAS.push({ url, auth: opciones.headers.Authorization, partes });

  if (ROMPER) return { ok: false, status: ROMPER, text: async () => 'no autorizado' };

  const [orden, clave, ...resto] = partes;
  let result = null;
  if (orden === 'GET') result = CAJONES.has(clave) ? CAJONES.get(clave) : null;
  else if (orden === 'SET') { CAJONES.set(clave, resto[0]); result = 'OK'; }
  else if (orden === 'DEL') {
    result = [clave, ...resto].filter(k => CAJONES.delete(k)).length;
  }
  return { ok: true, status: 200, json: async () => ({ result }) };
};

/* Las variables van ANTES del import: el motor las lee al cargarse. */
process.env.KV_REST_API_URL   = 'https://ejemplo.upstash.io';
process.env.KV_REST_API_TOKEN = 'clave-de-mentira';
globalThis.fetch = fetchFalso;

const M = await import('./lib/motor.mjs');
const P = await import('./lib/almacen.mjs');

console.log('\n  El motor elige solo, sin tocar código\n');
ok('con las dos variables puestas, guarda en Redis', M.motor() === 'redis');
ok('la dirección del almacén no lleva la clave pegada',
   !M.motor.toString().includes('token='));

console.log('\n  Lo que se guarda, vuelve igual\n');
{
  await M.guardarTexto('avisos/torres.json', '{"a":1}');
  ok('el texto vuelve tal cual', await M.leerTexto('avisos/torres.json') === '{"a":1}');

  const p = PEDIDAS.at(-2);
  ok('la orden va como lista JSON, que es lo que entiende Upstash',
     Array.isArray(p.partes) && p.partes[0] === 'SET');
  ok('y la clave viaja en la cabecera Authorization',
     p.auth === 'Bearer clave-de-mentira');

  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x10, 0x42]);
  await M.guardarCrudo('campo/fotos/x.jpg', bytes, 'image/jpeg');
  const vuelta = await M.leerCrudo('campo/fotos/x.jpg');
  ok('los bytes de una foto vuelven idénticos', Buffer.compare(bytes, vuelta) === 0,
     'si esto falla, sus fotos del monte se guardan corruptas');
  ok('y por dentro van en base64, que es lo que aguanta Redis',
     CAJONES.get('campo/fotos/x.jpg') === bytes.toString('base64'));
}

console.log('\n  Un cajón sin estrenar SÍ es vacío de verdad\n');
{
  ok('leerTexto de algo que no existe devuelve null, sin lanzar',
     await M.leerTexto('avisos/nada.json') === null);
  ok('leerCrudo igual', await M.leerCrudo('campo/fotos/nada.jpg') === null);

  const { dato, hay } = await P.leerJSON('avisos/nada.json', { casos: [] });
  ok('y la puerta lo cuenta como «no había fichero», no como «no tiene nada»',
     hay === false && Array.isArray(dato.casos));
}

console.log('\n  Con el almacén caído, LANZA. Nunca un vacío\n');
{
  ROMPER = 401;
  let lanzo = false;
  try { await M.leerTexto('avisos/torres.json'); } catch { lanzo = true; }
  ok('un 401 del almacén lanza en vez de devolver null', lanzo,
     'esto es lo que le decía «no hay avisos» estando ciega');

  lanzo = false;
  try { await P.leerLista('avisos/torres.json'); } catch { lanzo = true; }
  ok('y la puerta lo deja subir: no lo confunde con «no existe»', lanzo);

  lanzo = false;
  try { await M.guardarTexto('avisos/torres.json', '{}'); } catch { lanzo = true; }
  ok('guardar con el almacén caído también lanza, no se calla', lanzo,
     'un guardado que falla en silencio le pierde una cita o una nota');

  ROMPER = 500;
  lanzo = false;
  try { await M.leerTexto('avisos/torres.json'); } catch { lanzo = true; }
  ok('y un 500 igual', lanzo);
  ROMPER = null;
}

console.log('\n  Borrar de verdad\n');
{
  await M.guardarTexto('a.json', '1');
  await M.guardarTexto('b.json', '2');
  await M.borrarCrudo(['a.json', 'b.json']);
  ok('borra todas las rutas que se le pasan, no solo la primera',
     !CAJONES.has('a.json') && !CAJONES.has('b.json'));
  ok('y con la lista vacía no manda ninguna orden', await (async () => {
    const antes = PEDIDAS.length;
    await M.borrarCrudo([]);
    return PEDIDAS.length === antes;
  })(), 'una orden DEL sin claves es un error en Redis');
}

console.log('\n  Y sin las variables, sigue con el Blob de siempre\n');
{
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  const otro = await import('./lib/motor.mjs?sin-variables');
  ok('sin variables, el motor vuelve al Blob', otro.motor() === 'blob',
     'si esto falla, quitar las variables deja las apps sin almacén');
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
