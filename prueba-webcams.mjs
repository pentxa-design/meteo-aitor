/* ═══════════════════════════════════════════════════════════════════
   LAS CÁMARAS SE CORTABAN EN 40 Y DONOSTIA EMPEZABA EN LA 46
   ───────────────────────────────────────────────────────────────────
   Suyo, 02-09-2026: *«en cámaras me faltan muchas en la app, ni San
   Sebastián tengo»*, con capturas de Windy enseñando ocho cámaras solo
   en la Concha —Catedral del Buen Pastor, Pasealeku Berria, Miramar
   Gardens, Teledonosti…— que en su app no salía ninguna.

   Lo que despistaba era que **subir el radio no cambiaba nada**: 60,
   100 o 150 km devolvían siempre 40. Medido contra la app publicada,
   el `total` que manda Windy SÍ subía (53 → 94 → 178); lo que estaba
   clavado era la lista. El 40 era el valor por defecto de `limite` en
   `netlify/functions/webcams.js`, que iba tal cual a `limit=` de Windy.

   Y como Windy sirve ORDENADO POR CERCANÍA, las 40 primeras son
   siempre las 40 más cercanas: se acababan a 30,5 km de Bermeo y
   Donostia empieza a 57,9 km, en la posición 46.

   Esto NO lee el código: ARRANCA la función con un doble de Windy y
   mira qué devuelve. El doble no se ha inventado — es la respuesta
   REAL medida ese día desde BI BERMEO, guardada en
   `pruebas-datos/webcams-bermeo.json`, y se comporta como Windy: no
   sirve más de 50 de golpe y respeta `limit` y `offset`.
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `\n        ${pista}` : ''}`); }
};

const REAL = JSON.parse(fs.readFileSync(
  path.join(aqui, 'pruebas-datos', 'webcams-bermeo.json'), 'utf8'));

/* Lo que Windy no pasa de una petición. Si algún día lo sube, esta
   prueba sigue valiendo: lo que se comprueba es que la función NO se
   quede en la primera página. */
const WINDY_MAX = 50;

/* ── EL DOBLE DE WINDY ────────────────────────────────────────────
   Sirve de `REAL.webcams` el trozo que le pidan, con el mismo tope por
   petición que el de verdad, y apunta cada llamada para poder mirar
   después CUÁNTAS se hicieron y con qué. `romperEn` deja caer la
   petición número N, que es como se prueba el fallo a media lista. */
function doblarWindy({ romperEn = null, comoFalla = 'red', datos = REAL } = {}) {
  const llamadas = [];
  globalThis.fetch = async (u) => {
    const url = new URL(String(u));
    const limit  = Number(url.searchParams.get('limit'));
    const offset = Number(url.searchParams.get('offset') || 0);
    llamadas.push({ limit, offset });

    if (romperEn === llamadas.length) {
      if (comoFalla === 'red') { const e = new Error('fetch failed'); e.cause = { code: 'ENOTFOUND' }; throw e; }
      if (comoFalla === '503') return new Response('upstream caído', { status: 503 });
      return new Response('<html>no soy json</html>', { status: 200 });
    }

    const trozo = datos.webcams.slice(offset, offset + Math.min(limit, WINDY_MAX));
    return new Response(JSON.stringify({ total: datos.total, webcams: trozo }),
      { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return llamadas;
}

const mod = await import(pathToFileURL(path.join(aqui, 'netlify', 'functions', 'webcams.js')).href);
process.env.WINDY_KEY = 'la-de-mentira-de-la-prueba';

const pedir = async (qs = '') => {
  const r = await mod.default(new Request(`https://x/webcams?lat=43.413&lon=-2.718${qs}`));
  const txt = await r.text();
  /* El cuerpo NO siempre es JSON: cuando Windy contesta mal, la función
     reenvía su cuerpo tal cual, y eso puede ser texto plano. Se convierte
     con cuidado, que si no la prueba peta y parece un fallo de la app.
     Es el mismo cuidado que lleva `prueba-fuente-caida.mjs`. */
  let d = null;
  try { d = JSON.parse(txt); } catch { d = null; }
  return { code: r.status, txt, d: d ?? {} };
};

/* Donostia, por coordenadas y no por el nombre: Windy geocodifica el
   NOMBRE y miente con la región (medido el 25-08-2026: «San Mamés ·
   Comunidad de Madrid»). El punto no miente. */
const DONOSTIA = { lat: 43.3183, lon: -1.9812 };
const km = (a, b) => {
  const r = Math.PI / 180, R = 6371;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const deDonostia = ws => (ws || []).filter(w =>
  km(DONOSTIA, { lat: w.location?.latitude, lon: w.location?.longitude }) < 15);

/* ══ 1. EL CASO DE ÉL ══════════════════════════════════════════════ */
console.log('\n  Donostia empieza en la posición 46: con tope de 40 no salía ninguna\n');
{
  const llamadas = doblarWindy();
  const { code, d } = await pedir('&radio=60');

  ok('con 53 cámaras en Windy llegan las 53, no 40',
     code === 200 && d.webcams.length === 53,
     `${code} · llegaron ${d.webcams?.length}`);

  ok('y entre ellas SALEN las de Donostia (eran 0)',
     deDonostia(d.webcams).length === 7,
     `salieron ${deDonostia(d.webcams).length}`);

  const titulos = d.webcams.map(w => w.title || '').join(' | ');
  ok('sale la Concha, que es la que él enseñó en la captura',
     /Concha/i.test(titulos));

  ok('no se pide a Windy más de 50 de golpe',
     llamadas.every(l => l.limit <= WINDY_MAX),
     JSON.stringify(llamadas));

  ok('se pagina con `offset`, que es como Windy da las siguientes',
     llamadas.length === 2 && llamadas[0].offset === 0 && llamadas[1].offset === 50,
     JSON.stringify(llamadas));

  ok('y no se pide ni una página de más una vez traídas todas',
     llamadas.length === 2,
     `${llamadas.length} peticiones a Windy`);

  ok('el `total` que dice Windy se conserva tal cual',
     d.total === 53, String(d.total));

  ok('trayéndolas todas, NO se dice que la lista esté coja',
     !d.parcial, JSON.stringify(d.reason));
}

/* ══ 2. UN HUECO NO SE PINTA DE DATO ═══════════════════════════════ */
console.log('\n  Si no se puede traer la lista entera, se DICE\n');
{
  doblarWindy({ romperEn: 1 });
  const { code, d } = await pedir('&radio=60');
  ok('si la PRIMERA página se cae, no se devuelve 200 con lista vacía',
     code !== 200 && !(Array.isArray(d.webcams) && d.webcams.length === 0 && code === 200),
     `${code} · ${JSON.stringify(d).slice(0, 90)}`);
}
{
  doblarWindy({ romperEn: 1, comoFalla: '503' });
  const { code } = await pedir('&radio=60');
  ok('y si Windy contesta 503 a la primera, se propaga el código',
     code === 503, String(code));
}
{
  doblarWindy({ romperEn: 2 });
  const { code, d } = await pedir('&radio=60');
  ok('si se cae una página POSTERIOR, se devuelve lo que hay…',
     code === 200 && d.webcams.length === 50, `${code} · ${d.webcams?.length}`);
  ok('…pero marcado como incompleto, no como la lista entera',
     d.parcial === true && typeof d.reason === 'string' && d.reason.length > 0,
     JSON.stringify({ parcial: d.parcial, reason: d.reason }));
}
{
  doblarWindy({ romperEn: 2, comoFalla: 'basura' });
  const { d } = await pedir('&radio=60');
  ok('lo mismo si a media lista deja de mandar JSON',
     d.parcial === true, JSON.stringify(d.reason));
}
{
  doblarWindy();
  const { d } = await pedir('&radio=60&limite=10');
  ok('y si el tope pedido deja fuera cámaras que Windy tiene, se dice',
     d.webcams.length === 10 && d.parcial === true && /53/.test(d.reason || ''),
     JSON.stringify({ n: d.webcams.length, parcial: d.parcial, reason: d.reason }));
}

/* ══ 3. LO DE ANTES SIGUE FUNCIONANDO ══════════════════════════════ */
console.log('\n  Y lo que ya hacía, lo sigue haciendo\n');
{
  const llamadas = doblarWindy();
  const { d } = await pedir('&radio=60&limite=10');
  ok('un `limite` pequeño se respeta y no pagina de más',
     d.webcams.length === 10 && llamadas.length === 1, `${d.webcams.length} · ${llamadas.length} peticiones`);
}
{
  doblarWindy();
  const { d } = await pedir('&radio=60&limite=50&desde=50');
  ok('`desde` sigue sirviendo para saltar (fue como se midió el fallo)',
     d.webcams.length === 3 && d.webcams[0].webcamId === REAL.webcams[50].webcamId,
     `${d.webcams.length}`);
}
{
  doblarWindy();
  const r = await mod.default(new Request('https://x/webcams?lon=-2.7'));
  ok('sin lat ni lon sigue siendo un 400, no una lista vacía',
     r.status === 400, String(r.status));
}
{
  const guardada = process.env.WINDY_KEY;
  delete process.env.WINDY_KEY;
  const r = await mod.default(new Request('https://x/webcams?lat=43.4&lon=-2.7'));
  const b = JSON.parse(await r.text());
  ok('sin clave puesta lo dice, no se calla',
     r.status === 503 && b.sinClave === true, `${r.status}`);
  process.env.WINDY_KEY = guardada;
}

/* ══ 4. Y EN LA APP: EL RECUENTO NO PUEDE AFIRMAR MÁS DE LO QUE SABE ══
   Esto NO lee el código con `regex` —eso sería un recordatorio, no una
   prueba—: saca `camsCercanas` y `renderCams` del `app.js` de verdad y
   las EJECUTA con un `/webcams` de mentira. */
console.log('\n  En la app, una lista coja no se canta como si fuera entera\n');
{
  const app = fs.readFileSync(path.join(aqui, 'app.js'), 'utf8');
  const sacar = (firma, hasta = '\n}') => {
    const i = app.indexOf(firma);
    if (i < 0) throw new Error(`no encuentro «${firma}» en app.js`);
    return app.slice(i, app.indexOf(hasta, i) + hasta.length);
  };
  const CAMS_RADIO = Number(app.match(/const CAMS_RADIO = (\d+);/)?.[1]);

  /* `camsCercanas` con un servidor de mentira que devuelve lo que se le
     diga. Se le pasa `fetch` a mano, que es como lo hace
     `prueba-fuente-caida.mjs` con `cargarEstaciones`. */
  const traer = cuerpo => new Function('fetch', 'CAMS_RADIO',
    `${sacar('async function camsCercanas(place, radio = CAMS_RADIO) {')}\nreturn camsCercanas;`
  )(async () => ({ ok: true, json: async () => cuerpo }), CAMS_RADIO);

  const sitio = { lat: 43.413, lon: -2.718, name: 'BI BERMEO' };

  const entera = await traer({ total: 53, webcams: REAL.webcams })(sitio);
  ok('devuelve las cámaras Y si la lista viene coja, no solo las cámaras',
     Array.isArray(entera.cams) && 'falta' in entera,
     JSON.stringify(Object.keys(entera)));
  ok('con la lista entera, las 53 llegan a pantalla sin perderse en el filtro',
     entera.cams.length === 53, String(entera.cams.length));
  ok('y entre ellas siguen las 7 de Donostia después de mapearlas',
     deDonostia(entera.cams.map(c => ({ location: { latitude: c.lat, longitude: c.lon } }))).length === 7);
  ok('con la lista entera NO se avisa de nada',
     entera.falta === null, JSON.stringify(entera.falta));

  const coja = await traer({ total: 53, webcams: REAL.webcams.slice(0, 40),
                             parcial: true, reason: 'Windy tiene 53 y aquí caben 40' })(sitio);
  ok('con la lista coja, la app se entera',
     typeof coja.falta === 'string' && /53/.test(coja.falta), JSON.stringify(coja.falta));

  /* Y ahora la pantalla. El fallo que se arregla es EXACTAMENTE éste:
     el cartel decía «40 cámaras más encontradas a menos de 60 km» —un
     recuento cerrado— cuando Windy tenía 53. */
  const cartel = { textContent: '' };
  const pintadas = [];
  const correr = (falta) => new Function(
    'pintarOeste', '$', 'pintarCams', 'S', 'CAMS', 'camsCercanas', 'CAMS_RADIO',
    `${sacar('async function renderCams() {')}\nreturn renderCams;`
  )(() => {}, sel => (sel === '#camsAviso' ? cartel : { }),
    l => pintadas.push(l), { place: sitio }, [],
    async () => ({ cams: REAL.webcams.slice(0, 40).map(w => ({ id: w.webcamId })), falta }),
    CAMS_RADIO);

  await correr(null)();
  ok('el cartel dice el radio que de verdad se ha pedido, no un 60 a mano',
     cartel.textContent.includes(`${CAMS_RADIO} km`) && !/\b60 km\b/.test(cartel.textContent),
     cartel.textContent);

  await correr('Windy tiene 53 y aquí caben 40')();
  ok('y si faltan cámaras lo AVISA, en vez de cerrar el recuento',
     /53/.test(cartel.textContent) && /puede haber más/i.test(cartel.textContent),
     cartel.textContent);
}

console.log(`\n  ${bien} bien · ${mal} mal\n`);
process.exit(mal ? 1 : 0);
