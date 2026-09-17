/* ═══════════════════════════════════════════════════════════════════
   EL CANDADO, ARRANCADO DE VERDAD
   ───────────────────────────────────────────────────────────────────
   Suyo, 04-09-2026: *«me pones un código de 6 cifras que caduca cada
   24 h para poder entrar»*, *«por seguridad»*.

   Lo que se prueba, por orden de importancia:

     1. **QUE NUNCA LE DEJE FUERA.** Es lo primero y manda sobre todo lo
        demás. Esta app decide si alguien sube a una torre de 60 m: una
        pantalla negra en un cordal es peor que cualquier cotilleo. Si
        falta `crypto.subtle`, si el almacenamiento está bloqueado, si
        falta el HTML del candado — se ABRE.
     2. Que con el código bueno entre y no lo vuelva a pedir en 24 h.
     3. Que con el malo no entre.
     4. Que a las 24 h lo pida otra vez, que es lo que él pidió.
     5. Que el número NO esté escrito en la página.
   ═══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const { webcrypto } = require('node:crypto');

let bien = 0, mal = 0;
const ok = (q, c, p = '') => { c ? (bien++, console.log(`    ✓ ${q}`))
                                 : (mal++, console.log(`    ✗ ${q}${p ? `\n        ${p}` : ''}`)); };

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const CODIGO = '115611';

/** Monta la página con el candado y devuelve el dom ya arrancado. */
function montar({ conCrypto = true, guardado = null, almacenRoto = false } = {}) {
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', url: 'https://x.test/' });
  const w = dom.window;
  if (conCrypto) {
    Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
    Object.defineProperty(w, 'isSecureContext', { value: true, configurable: true });
  } else {
    Object.defineProperty(w, 'crypto', { value: {}, configurable: true });
    Object.defineProperty(w, 'isSecureContext', { value: false, configurable: true });
  }
  return { dom, w };
}

/* jsdom corre los scripts al construir, así que hay que preparar el
   entorno ANTES. Se monta a mano: se lee el script del candado y se
   ejecuta con el window ya listo. */
/* Se busca por una marca de dentro, no por la forma exacta del
   `<script>`: si mañana cambia una línea, esta prueba no puede irse a
   verde por no encontrarlo. */
const iIni = HTML.indexOf('<script>', HTML.indexOf('EL CANDADO —'));
const iFin = HTML.indexOf('</script>', iIni);
const guionCandado = (iIni > 0 && iFin > iIni && HTML.slice(iIni, iFin).includes('candado.hasta'))
  ? [HTML.slice(iIni, iFin + '</script>'.length)] : null;
if (!guionCandado) { console.log('    ✗ no encuentro el guion del candado en index.html'); process.exit(1); }
const GUION = guionCandado[0].replace(/^<script>|<\/script>$/g, '');

async function correr({ conCrypto = true, hasta = null, almacenRoto = false, probar = true } = {}) {
  const dom = new JSDOM(HTML.replace(GUION, ''), { runScripts: 'outside-only', url: 'https://x.test/' });
  const w = dom.window;
  const guardado = {};
  Object.defineProperty(w, 'localStorage', {
    configurable: true,
    value: {
      getItem: k => { if (almacenRoto) throw new Error('bloqueado'); return guardado[k] ?? null; },
      setItem: (k, v) => { if (almacenRoto) throw new Error('bloqueado'); guardado[k] = String(v); },
    },
  });
  if (hasta !== null) guardado['candado.hasta'] = String(hasta);
  if (conCrypto) {
    Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
    Object.defineProperty(w, 'isSecureContext', { value: true, configurable: true });
  } else {
    Object.defineProperty(w, 'crypto', { value: {}, configurable: true });
    Object.defineProperty(w, 'isSecureContext', { value: false, configurable: true });
  }
  w.TextEncoder = TextEncoder;
  if (probar) w.__probarCandado = true;     // el interruptor está apagado hasta nueva orden; aquí se enciende para probarlo
  w.eval(GUION);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  await new Promise(r => setTimeout(r, 30));
  const bloqueado = () => w.document.documentElement.hasAttribute('data-bloqueado');
  const teclear = async cod => {
    const e = w.document.getElementById('candEntrada');
    e.value = cod;
    e.dispatchEvent(new w.Event('input'));
    await new Promise(r => setTimeout(r, 60));
  };
  return { w, bloqueado, teclear, guardado };
}

(async () => {
console.log('\n  Lo primero: que NUNCA le deje fuera\n');
{
  const a = await correr({ conCrypto: false });
  ok('sin crypto.subtle (http, navegador viejo) la app se ABRE', !a.bloqueado(),
     'una pantalla negra en un cordal es peor que cualquier cotilleo');

  const b = await correr({ almacenRoto: true });
  ok('con el almacenamiento bloqueado (modo privado) también se puede entrar',
     !b.bloqueado() || !!b.w.document.getElementById('candEntrada'),
     'si no se puede ni leer la marca, no se le puede dejar encerrado');
}

console.log('\n  El código de seis cifras\n');
{
  const a = await correr();
  ok('al abrir sin sesión, pide el código', a.bloqueado());
  ok('y se ve la pantalla del candado', !a.w.document.getElementById('candado').hidden);

  await a.teclear('000000');
  ok('con un código que no es, NO entra', a.bloqueado());
  ok('y lo dice en vez de quedarse mudo',
     !a.w.document.getElementById('candErr').hidden);

  await a.teclear(CODIGO);
  ok('con el suyo, entra', !a.bloqueado());
  ok('y se guarda para no volver a pedirlo', !!a.guardado['candado.hasta']);

  const hasta = Number(a.guardado['candado.hasta']);
  const horas = (hasta - Date.now()) / 3600000;
  ok('la sesión dura 24 h, que es lo que él pidió', horas > 23.9 && horas < 24.1,
     `dura ${horas.toFixed(1)} h`);
}

console.log('\n  Y caduca de verdad\n');
{
  const dentro = await correr({ hasta: Date.now() + 3600e3 });
  ok('dentro de las 24 h no lo vuelve a pedir', !dentro.bloqueado());

  const fuera = await correr({ hasta: Date.now() - 1000 });
  ok('pasadas las 24 h lo pide otra vez', fuera.bloqueado());
}

console.log('\n  El número no está escrito en la página\n');
{
  ok('el código NO aparece en claro en el HTML', !HTML.includes(CODIGO),
     'quien abra el fuente lo leería de un vistazo');
  ok('lo que va es el hash', /[0-9a-f]{64}/.test(HTML));
}

console.log('\n  Apagado hasta nueva orden (17-09-2026)\n');
{
  /* Suyo: «quítale el código hasta que tengamos rematada la app» · «hasta nueva orden». */
  const off = await correr({ probar: false });
  ok('con el interruptor apagado (como está ahora) la app abre sin pedir código',
     !off.bloqueado() && !!off.w.document.getElementById('candado').hidden);
  ok('y el interruptor está apagado en index.html de verdad', /var APAGADO = true;/.test(HTML),
     'cuando él diga, APAGADO = false y vuelve el candado');
}

console.log(`\n  ${bien} bien, ${mal} mal\n`);
process.exit(mal ? 1 : 0);
})();
