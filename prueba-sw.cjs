/* ═══════════════════════════════════════════════════════════════════
   PRUEBAS DEL SERVICE WORKER (sw.js)

   Es lo único de la app que corre con ella CERRADA: guarda el casco para
   el monte sin cobertura, recibe los avisos de tormenta, los apunta para
   que él los relea y renueva la suscripción cuando el navegador la
   caduca. Hasta el 05-09-2026 no lo ejecutaba ninguna prueba (revisión
   del 04-09, §4 y §14): `pruebas-servidor.cjs` solo mira tres frases
   del fuente con regex, y una regex es un recordatorio, no una prueba.

   Aquí sw.js se carga ENTERO dentro de un entorno falso (self, caches,
   fetch, clients, registration) y se disparan sus eventos como lo haría
   el navegador. Todo es de mentira y se nota: el origen es torre.prueba
   y los cuerpos son «contenido de /x». Lo que se mide es el mecanismo.

   Lo que no se puede ejercitar sin un navegador de verdad —que Android
   abra la ventana, que Apple entregue el push— no se simula con trampa:
   se prueba lo que sw.js decide y con qué llama al navegador.

   Con SW=<ruta> se prueba otro fichero (para verla en rojo con el viejo).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `  — ${pista}` : ''}`); }
};

const RUTA_SW = process.env.SW || path.join(__dirname, 'sw.js');
const src = fs.readFileSync(RUTA_SW, 'utf8');

/* El ámbito del service worker de mentira. Todo lo relativo se resuelve
   contra esto, igual que en el navegador contra la URL de sw.js. */
const BASE = 'https://torre.prueba/';
const abs = k => (typeof k === 'string' ? new URL(k, BASE).href : k.url);

/* Una Cache de mentira. Guarda el cuerpo ya leído, porque un Response
   solo se puede leer una vez y aquí se lee al guardar y al sacar. */
function cacheFalsa() {
  const m = new Map();
  return {
    async put(k, r) {
      m.set(abs(k), { status: r.status, headers: [...r.headers], body: Buffer.from(await r.arrayBuffer()) });
    },
    async match(k) {
      const e = m.get(abs(k));
      return e ? new Response(e.body, { status: e.status, headers: e.headers }) : undefined;
    },
    async keys() { return [...m.keys()]; },
    tiene(k) { return m.has(abs(k)); },
    async texto(k) { const r = await this.match(k); return r ? r.text() : null; },
    async json(k) { const r = await this.match(k); return r ? r.json() : null; },
  };
}

/* El CacheStorage de mentira: cajas por nombre, como caches.open(). */
function almacenFalso() {
  const cajas = new Map();
  return {
    async open(n) { if (!cajas.has(n)) cajas.set(n, cacheFalsa()); return cajas.get(n); },
    async keys() { return [...cajas.keys()]; },
    async delete(n) { return cajas.delete(n); },
    async match(k) {
      for (const c of cajas.values()) { const r = await c.match(k); if (r) return r; }
      return undefined;
    },
    caja(n) { return cajas.get(n); },
  };
}

/* Carga sw.js en un contexto nuevo y devuelve los mandos: disparar un
   evento y leer lo que el service worker le pidió al navegador. */
function arrancar(op = {}) {
  const manejadores = {};
  const registro = {
    peticiones: [],     // { ruta, metodo, cuerpo, vez }
    veces: {},          // ruta → cuántas veces se pidió
    mensajes: [],       // lo que se mandó a las ventanas: { a, ...mensaje }
    notificaciones: [], // showNotification(titulo, opciones)
    abiertas: [],       // clients.openWindow(url)
    focos: [],          // ventana.focus()
    navegaciones: [],   // [ventana, destino]
    suscripciones: [],  // pushManager.subscribe(opciones)
    avisosConsola: [],  // console.warn
    skipWaiting: 0, claim: 0, cerradas: 0,
  };

  const ventanas = (op.ventanas || []).map(url => ({
    url,
    focus: async () => { registro.focos.push(url); },
    navigate: async d => { registro.navegaciones.push([url, d]); },
    postMessage: m => { registro.mensajes.push({ a: url, ...m }); },
  }));

  const caches = op.caches || almacenFalso();

  const fetchFalso = async (x, init = {}) => {
    const url = abs(x);
    const ruta = new URL(url).pathname;
    const metodo = (init.method || (x && x.method) || 'GET').toUpperCase();
    registro.veces[ruta] = (registro.veces[ruta] || 0) + 1;
    let cuerpo = null;
    try { cuerpo = init.body ? JSON.parse(init.body) : null; } catch { cuerpo = init.body; }
    registro.peticiones.push({ ruta, metodo, cuerpo, vez: registro.veces[ruta] });
    if (op.red) {
      const r = op.red(ruta, registro.veces[ruta], metodo, cuerpo);
      if (r !== undefined) return r;
    }
    return new Response(`contenido de ${ruta}`, { status: 200 });
  };

  class RequestFalso extends Request {
    constructor(input, init) { super(typeof input === 'string' ? abs(input) : input, init); }
  }

  const sandbox = {
    caches,
    fetch: fetchFalso,
    Request: RequestFalso,
    Response,
    URL,
    setTimeout, clearTimeout,
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    console: {
      log() {}, info() {}, error() {},
      warn: (...a) => { registro.avisosConsola.push(a.join(' ')); },
    },
    location: { origin: new URL(BASE).origin, href: BASE + 'sw.js' },
    addEventListener: (t, fn) => { (manejadores[t] = manejadores[t] || []).push(fn); },
    skipWaiting: async () => { registro.skipWaiting++; },
    clients: {
      matchAll: async () => ventanas,
      claim: async () => { registro.claim++; },
      openWindow: async u => {
        registro.abiertas.push(u);
        if (op.abrirFalla && registro.abiertas.length === 1) throw new Error('el navegador no ha abierto nada');
        return {};
      },
    },
    registration: {
      scope: BASE,
      showNotification: async (titulo, opciones) => { registro.notificaciones.push({ titulo, ...opciones }); },
      pushManager: {
        subscribe: async opciones => {
          registro.suscripciones.push(opciones);
          if (op.suscribirFalla) throw new Error('el navegador no deja suscribir');
          return {
            options: opciones,
            toJSON: () => ({ endpoint: 'https://push.prueba/nueva', keys: { p256dh: 'p256dh-nueva', auth: 'auth-nueva' } }),
          };
        },
      },
    },
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: RUTA_SW });

  /* Dispara un evento como el navegador: llama a TODOS los manejadores
     y espera a lo que hayan metido en waitUntil. Devuelve si alguno
     reventó, que en un service worker de verdad es «instalación fallida». */
  async function disparar(tipo, ev = {}) {
    const promesas = [];
    ev.waitUntil = p => { promesas.push(p); };
    let error = null;
    for (const h of manejadores[tipo] || []) {
      try { h(ev); } catch (e) { error = e; }
    }
    try { await Promise.all(promesas); } catch (e) { error = e; }
    return { error, cuantos: (manejadores[tipo] || []).length };
  }

  return { disparar, registro, caches, ventanas, valor: expr => vm.runInContext(expr, sandbox) };
}

const evPush = (datos, ventanas) => ({
  data: datos == null ? null : {
    json: () => JSON.parse(datos),
    text: () => datos,
  },
  ventanas,
});

(async () => {
  const SHELL = arrancar().valor('SHELL');
  const V = arrancar().valor('V');

  /* ════════════════════════════════════════════════════════════════
     §4 · El precacheo no se traga los fallos
     ════════════════════════════════════════════════════════════════ */
  console.log('\n  Instalar el casco con un fichero que da 404');

  {
    const sw = arrancar({
      ventanas: [BASE + 'index.html'],
      red: (ruta, vez) => {
        if (ruta === '/data/estaciones.json') return new Response('no está', { status: 404 });
        if (ruta === '/maps.js' && vez === 1) throw new TypeError('Failed to fetch'); // se corta a la primera
        return undefined;
      },
    });
    const { error } = await sw.disparar('install');
    const caja = sw.caches.caja(V);

    ok('la instalación con un 404 en el casco NO se bloquea: acaba sin error y llama a skipWaiting',
       !error && sw.registro.skipWaiting === 1,
       error ? String(error) : `skipWaiting=${sw.registro.skipWaiting}`);
    ok('el fichero que da 404 se pide DOS veces (un reintento) antes de darlo por perdido',
       sw.registro.veces['/data/estaciones.json'] === 2,
       `se pidió ${sw.registro.veces['/data/estaciones.json']} veces`);
    ok('el que se corta a la primera y va a la segunda queda guardado con cuerpo',
       sw.registro.veces['/maps.js'] === 2 && await caja.texto('./maps.js') === 'contenido de /maps.js',
       `veces=${sw.registro.veces['/maps.js']}, guardado=${caja.tiene('./maps.js')}`);
    const unaVez = SHELL.filter(u => !['./data/estaciones.json', './maps.js'].includes(u));
    ok('los que van a la primera se piden una sola vez',
       unaVez.every(u => sw.registro.veces[new URL(u, BASE).pathname] === 1),
       unaVez.map(u => `${u}:${sw.registro.veces[new URL(u, BASE).pathname]}`).join(' '));
    const guardados = [];
    for (const u of unaVez) if (await caja.texto(u) === `contenido de ${new URL(u, BASE).pathname}`) guardados.push(u);
    ok(`los otros ${unaVez.length} del casco quedan guardados de verdad, con su cuerpo`,
       guardados.length === unaVez.length, `guardados ${guardados.length} de ${unaVez.length}`);
    ok('el que falta NO se guarda (un 404 guardado sería peor que un hueco)',
       !caja.tiene('./data/estaciones.json'));
    ok('la lista de lo que falta queda en la caché bajo ./__faltan.json',
       JSON.stringify(await caja.json('./__faltan.json')) === JSON.stringify(['./data/estaciones.json']),
       JSON.stringify(await caja.json('./__faltan.json')));
    const aviso = sw.registro.mensajes.find(m => m.tipo === 'precache-faltan');
    ok('y se avisa a la ventana abierta con {tipo:"precache-faltan", faltan:[...]}',
       aviso && JSON.stringify(aviso.faltan) === JSON.stringify(['./data/estaciones.json']),
       JSON.stringify(sw.registro.mensajes));
    ok('y sale un console.warn que nombra el fichero perdido',
       sw.registro.avisosConsola.some(t => t.includes('estaciones.json')),
       JSON.stringify(sw.registro.avisosConsola));
  }

  console.log('\n  Instalar con todo bien, y con la app cerrada');

  {
    const sw = arrancar({ ventanas: [BASE] });
    const { error } = await sw.disparar('install');
    const caja = sw.caches.caja(V);
    ok('con todo guardado, ./__faltan.json es una lista VACÍA (comprobado, no «sin comprobar»)',
       !error && JSON.stringify(await caja.json('./__faltan.json')) === '[]',
       JSON.stringify(await caja.json('./__faltan.json')));
    ok('y entonces no se manda ningún mensaje ni console.warn',
       sw.registro.mensajes.length === 0 && sw.registro.avisosConsola.length === 0);
    ok('cada fichero del casco se ha pedido una sola vez',
       SHELL.every(u => sw.registro.veces[new URL(u, BASE).pathname] === 1));
  }

  {
    /* Lo normal: la versión nueva se instala con la app cerrada. No hay
       ventana a la que avisar, y la lista en caché es lo único que queda. */
    const sw = arrancar({
      ventanas: [],
      red: ruta => (ruta === '/vendor/maplibre-gl.js' ? (() => { throw new TypeError('Failed to fetch'); })() : undefined),
    });
    const { error } = await sw.disparar('install');
    const caja = sw.caches.caja(V);
    ok('sin ninguna ventana abierta, un fichero que no baja ni a la segunda queda apuntado en la caché igual',
       !error && JSON.stringify(await caja.json('./__faltan.json')) === JSON.stringify(['./vendor/maplibre-gl.js']),
       JSON.stringify(await caja.json('./__faltan.json')));
    ok('la red caída para ese fichero también se reintenta una vez (dos peticiones)',
       sw.registro.veces['/vendor/maplibre-gl.js'] === 2, `veces=${sw.registro.veces['/vendor/maplibre-gl.js']}`);
    ok('y la instalación acaba aunque no haya nadie a quien avisar',
       sw.registro.skipWaiting === 1 && sw.registro.mensajes.length === 0);
  }

  console.log('\n  Lo que lleva el casco');

  ok('el casco lleva Leaflet desde vendor/leaflet/ (js y css)',
     SHELL.includes('./vendor/leaflet/leaflet.js') && SHELL.includes('./vendor/leaflet/leaflet.css'),
     'sin él, la pestaña Radar no arranca sin cobertura');
  ok('el casco sigue llevando MapLibre, la capa de Open-Meteo y el catálogo de emplazamientos',
     SHELL.includes('./vendor/maplibre-gl.js') && SHELL.includes('./vendor/openmeteo-weather-map-layer-0.0.20.js')
     && SHELL.includes('./data/estaciones.json'));
  ok('todo el casco es de este origen: ninguna dirección de fuera (unpkg, cdn…)',
     SHELL.every(u => u.startsWith('./')), SHELL.filter(u => !u.startsWith('./')).join(' '));

  /* ════════════════════════════════════════════════════════════════
     Activar una versión nueva
     ════════════════════════════════════════════════════════════════ */
  console.log('\n  Activar una versión nueva');

  {
    const caches = almacenFalso();
    await caches.open('torre-2026.08.24-1615');
    await caches.open(V);
    const avisos = await caches.open('avisos-recibidos');
    await avisos.put('lista', new Response(JSON.stringify([{ titulo: 'aviso de anoche' }])));
    const sw = arrancar({ caches });
    const { error } = await sw.disparar('activate');
    ok('al activar se tiran las cachés de versiones viejas y se reclama a los clientes',
       !error && !caches.caja('torre-2026.08.24-1615') && caches.caja(V) && sw.registro.claim === 1);
    /* Solo se prueba lo que hace sw.js. La otra puerta —comprobarVersion()
       en app.js borra TODAS las cachés al ver un build nuevo— sigue abierta
       a 05-09-2026 y no se puede cerrar desde el service worker. */
    ok('pero al activar ya NO se tira avisos-recibidos: el service worker respeta la lista (la otra puerta, comprobarVersion en app.js, va aparte)',
       caches.caja('avisos-recibidos') && (await caches.caja('avisos-recibidos').json('lista'))?.[0]?.titulo === 'aviso de anoche',
       `cachés que quedan: ${(await caches.keys()).join(', ')}`);
  }

  /* ════════════════════════════════════════════════════════════════
     §14 · Los avisos que llegan con la app cerrada
     ════════════════════════════════════════════════════════════════ */
  console.log('\n  Recibir un aviso y apuntarlo');

  {
    /* El aviso de muestra canta a prueba a propósito: sitio, distancia
       y hora inventados. Regla de la casa: nada que parezca un dato real. */
    const sw = arrancar({ ventanas: [BASE + 'index.html'] });
    const r1 = await sw.disparar('push', evPush(JSON.stringify({
      titulo: 'Rayo en SITIO DE PRUEBA', cuerpo: 'descarga a 0,0 km (dato de prueba)', tag: 'rayo',
      url: './?sitio=sitio-de-prueba', enviado: '2000-01-01T00:00:00+00:00', importante: true,
    })));
    const n = sw.registro.notificaciones[0];
    ok('cada aviso que llega se enseña con showNotification, con su título y su cuerpo',
       !r1.error && n && n.titulo === 'Rayo en SITIO DE PRUEBA' && n.body === 'descarga a 0,0 km (dato de prueba)',
       JSON.stringify(n));
    ok('el aviso lleva su etiqueta, la dirección a abrir y la hora del dato (enviado)',
       n && n.tag === 'rayo' && n.data && n.data.url === './?sitio=sitio-de-prueba' && n.data.enviado === '2000-01-01T00:00:00+00:00'
       && n.requireInteraction === true, JSON.stringify(n && n.data));
    const lista1 = await sw.caches.caja('avisos-recibidos').json('lista');
    ok('y queda apuntado en la caché avisos-recibidos con título, cuerpo, etiqueta, llegada y hora del dato',
       lista1 && lista1.length === 1 && lista1[0].titulo === 'Rayo en SITIO DE PRUEBA' && lista1[0].tag === 'rayo'
       && typeof lista1[0].llegado === 'number' && lista1[0].enviado === '2000-01-01T00:00:00+00:00',
       JSON.stringify(lista1));
    ok('con la app abierta se le manda {tipo:"avisoNuevo"} para que repinte la lista',
       sw.registro.mensajes.some(m => m.tipo === 'avisoNuevo'), JSON.stringify(sw.registro.mensajes));

    /* 44 más: 45 en total. Solo caben 40, el más nuevo delante. */
    for (let i = 2; i <= 45; i++) {
      await sw.disparar('push', evPush(JSON.stringify({ titulo: `aviso ${i}`, cuerpo: `cuerpo ${i}` })));
    }
    const lista = await sw.caches.caja('avisos-recibidos').json('lista');
    ok('la lista se queda en 40: llegan 45 y quedan 40',
       lista.length === 40, `hay ${lista.length}`);
    ok('el más nuevo va PRIMERO (el 45 arriba) y el más viejo que queda es el 6',
       lista[0].titulo === 'aviso 45' && lista[39].titulo === 'aviso 6',
       `${lista[0].titulo} … ${lista[39].titulo}`);
    ok('el primero de todos (el del rayo) ya no está: se cayó por el fondo',
       !lista.some(a => a.titulo === 'Rayo en SITIO DE PRUEBA'));
    ok('sin etiqueta ni dirección se ponen las de siempre: tag "meteo" y la raíz',
       sw.registro.notificaciones[1].tag === 'meteo' && sw.registro.notificaciones[1].data.url === './'
       && sw.registro.notificaciones[1].requireInteraction === false);
  }

  {
    const sw = arrancar({ ventanas: [] });
    const r = await sw.disparar('push', evPush('esto no es JSON'));
    ok('un push que no venga en JSON no se pierde: el texto va de cuerpo y el título es el de la app',
       !r.error && sw.registro.notificaciones[0]?.titulo === 'Aitor Meteo'
       && sw.registro.notificaciones[0]?.body === 'esto no es JSON',
       JSON.stringify(sw.registro.notificaciones[0]));
    const r2 = await sw.disparar('push', evPush(null));
    ok('un push sin datos también se enseña (título de la app, cuerpo vacío)',
       !r2.error && sw.registro.notificaciones[1]?.titulo === 'Aitor Meteo' && sw.registro.notificaciones[1]?.body === '');
  }

  {
    const sw = arrancar({ ventanas: [BASE] });
    const r = await sw.disparar('message', {
      data: { tipo: 'apunta', aviso: { titulo: 'Aitor Meteo · prueba 1 de 2', cuerpo: 'local', tag: 'prueba', llegado: 1, enviado: null } },
    });
    const lista = await sw.caches.caja('avisos-recibidos').json('lista');
    ok('la app puede apuntar uno que ha enseñado ella ({tipo:"apunta"}) y entra en la misma lista',
       !r.error && lista && lista.length === 1 && lista[0].titulo === 'Aitor Meteo · prueba 1 de 2'
       && sw.registro.mensajes.some(m => m.tipo === 'avisoNuevo'),
       JSON.stringify(lista));
    const r2 = await sw.disparar('message', { data: { tipo: 'apunta' } });
    ok('un "apunta" sin aviso dentro no apunta nada ni revienta',
       !r2.error && (await sw.caches.caja('avisos-recibidos').json('lista')).length === 1);
  }

  {
    /* La caché no se puede escribir (disco lleno, modo privado). El aviso
       se tiene que ENSEÑAR igual: perderlo por no poder guardarlo sería
       el fallo al revés. */
    const rota = { open: async () => { throw new Error('QuotaExceededError'); }, keys: async () => [], delete: async () => false, match: async () => undefined, caja: () => undefined };
    const sw = arrancar({ caches: rota, ventanas: [BASE] });
    const r = await sw.disparar('push', evPush(JSON.stringify({ titulo: 'Tormenta', cuerpo: 'x' })));
    ok('si la caché no se puede escribir, la notificación se enseña igual y el push no revienta',
       !r.error && sw.registro.notificaciones.length === 1 && sw.registro.notificaciones[0].titulo === 'Tormenta',
       r.error ? String(r.error) : '');
  }

  /* ════════════════════════════════════════════════════════════════
     Tocar el aviso abre la app
     ════════════════════════════════════════════════════════════════ */
  console.log('\n  Tocar el aviso abre la app');

  const clic = (sw, data) => sw.disparar('notificationclick', {
    notification: { data, close: () => { sw.registro.cerradas++; } },
  });

  {
    const sw = arrancar({ ventanas: [] });
    const r = await clic(sw, { url: './?sitio=oiz' });
    ok('sin ninguna ventana abierta, se abre la app en la dirección del aviso resuelta ENTERA contra el ámbito',
       !r.error && sw.registro.abiertas.length === 1 && sw.registro.abiertas[0] === BASE + '?sitio=oiz',
       JSON.stringify(sw.registro.abiertas));
    ok('y el aviso se cierra al tocarlo', sw.registro.cerradas === 1);
  }
  {
    const sw = arrancar({ ventanas: [BASE + 'index.html'] });
    await clic(sw, { url: './?sitio=oiz' });
    ok('con la app ya abierta se ENFOCA esa ventana y se la lleva a la dirección del aviso, sin abrir otra',
       sw.registro.focos.length === 1 && sw.registro.navegaciones.length === 1
       && sw.registro.navegaciones[0][1] === BASE + '?sitio=oiz' && sw.registro.abiertas.length === 0,
       JSON.stringify({ focos: sw.registro.focos, nav: sw.registro.navegaciones, abiertas: sw.registro.abiertas }));
  }
  {
    const sw = arrancar({ ventanas: [BASE + '?sitio=oiz'] });
    await clic(sw, { url: './?sitio=oiz' });
    ok('si la ventana abierta ya está en esa dirección, se enfoca y no se navega',
       sw.registro.focos.length === 1 && sw.registro.navegaciones.length === 0 && sw.registro.abiertas.length === 0);
  }
  {
    const sw = arrancar({ ventanas: ['https://otra.prueba/cosa'] });
    await clic(sw, { url: './' });
    ok('una ventana de OTRO origen no vale: se abre la app aparte',
       sw.registro.focos.length === 0 && sw.registro.abiertas.length === 1 && sw.registro.abiertas[0] === BASE,
       JSON.stringify(sw.registro.abiertas));
  }
  {
    const sw = arrancar({ ventanas: [], abrirFalla: true });
    const r = await clic(sw, { url: './?sitio=oiz' });
    ok('si abrir falla, se reintenta con la raíz antes que no abrir nada',
       !r.error && sw.registro.abiertas.length === 2 && sw.registro.abiertas[1] === BASE,
       JSON.stringify(sw.registro.abiertas));
  }
  {
    const sw = arrancar({ ventanas: [] });
    await clic(sw, undefined);
    ok('un aviso sin dirección abre la raíz de la app',
       sw.registro.abiertas[0] === BASE, JSON.stringify(sw.registro.abiertas));
    const sw2 = arrancar({ ventanas: [] });
    await clic(sw2, { url: 'http://[' });
    ok('una dirección que no se puede resolver cae a la raíz, no a nada',
       sw2.registro.abiertas[0] === BASE, JSON.stringify(sw2.registro.abiertas));
  }

  /* ════════════════════════════════════════════════════════════════
     El navegador caduca la suscripción
     ════════════════════════════════════════════════════════════════ */
  console.log('\n  El navegador caduca la suscripción de push');

  /* La suscripción vieja TRAE clave de firma, a propósito: lo que se
     mide es que el service worker no la reutilice. api/suscribir.mjs es
     la única fuente (VAPID_PUBLICA); si se rotara, la vieja sería una
     clave muerta y los envíos fallarían sin ruido. */
  const claveVieja = new Uint8Array([4, 5, 6]).buffer;
  const vieja = { endpoint: 'https://push.prueba/vieja', options: { userVisibleOnly: true, applicationServerKey: claveVieja } };

  /* El servidor de mentira da la clave por GET /api/suscribir, como el de
     verdad. "AQID" en base64 son los bytes 1,2,3. */
  const conClave = otra => (ruta, vez, metodo, cuerpo) => {
    if (ruta === '/api/suscribir' && metodo === 'GET') return new Response('{"publica":"AQID","aparatos":1}', { status: 200 });
    return otra ? otra(ruta, vez, metodo, cuerpo) : undefined;
  };
  /* ArrayBuffer.isView y no instanceof: sw.js corre en otro contexto de
     vm y su Uint8Array no es el de aquí. */
  const bytes = c => (ArrayBuffer.isView(c) ? Array.from(c).join(',') : `no son bytes: ${String(c)}`);

  {
    /* EL CASO: la app cerrada. No hay ventana; si el service worker no
       renueva él, no renueva nadie y los avisos mueren sin ruido. */
    const sw = arrancar({ ventanas: [], red: conClave() });
    const r = await sw.disparar('pushsubscriptionchange', { oldSubscription: vieja, newSubscription: null });
    const alta = sw.registro.peticiones.find(p => p.ruta === '/api/suscribir' && p.metodo === 'POST');
    const clave = sw.registro.suscripciones[0]?.applicationServerKey;
    ok('con la app CERRADA, el propio service worker vuelve a suscribirse, y con la clave de firma que da el servidor (GET /api/suscribir, "AQID" → bytes [1,2,3]), no con la de la suscripción vieja',
       !r.error && sw.registro.peticiones.some(p => p.ruta === '/api/suscribir' && p.metodo === 'GET')
       && sw.registro.suscripciones.length === 1 && sw.registro.suscripciones[0].userVisibleOnly === true
       && clave !== claveVieja && bytes(clave) === '1,2,3',
       JSON.stringify({ clave: bytes(clave), peticiones: sw.registro.peticiones }));
    ok('y manda la suscripción nueva a /api/suscribir por POST, como {suscripcion:{endpoint,keys}}',
       alta && alta.cuerpo && alta.cuerpo.suscripcion && alta.cuerpo.suscripcion.endpoint === 'https://push.prueba/nueva'
       && alta.cuerpo.suscripcion.keys.p256dh === 'p256dh-nueva' && alta.cuerpo.suscripcion.keys.auth === 'auth-nueva',
       JSON.stringify(sw.registro.peticiones));
  }
  {
    const sw = arrancar({ ventanas: [BASE], red: conClave() });
    await sw.disparar('pushsubscriptionchange', { oldSubscription: vieja, newSubscription: null });
    ok('con la app abierta, además se le dice {tipo:"avisoRenovado"} para que refresque el panel',
       sw.registro.mensajes.some(m => m.tipo === 'avisoRenovado') && !sw.registro.mensajes.some(m => m.tipo === 'avisoCaducado'),
       JSON.stringify(sw.registro.mensajes));
  }
  {
    const sw = arrancar({ ventanas: [BASE], suscribirFalla: true, red: conClave() });
    const r = await sw.disparar('pushsubscriptionchange', { oldSubscription: vieja, newSubscription: null });
    ok('si el navegador no deja suscribir, no se manda nada al servidor y se le pide a la app que lo haga ({tipo:"avisoCaducado"})',
       !r.error && !sw.registro.peticiones.some(p => p.metodo === 'POST')
       && sw.registro.mensajes.some(m => m.tipo === 'avisoCaducado'),
       JSON.stringify({ peticiones: sw.registro.peticiones, mensajes: sw.registro.mensajes }));
  }
  {
    const sw = arrancar({
      ventanas: [BASE],
      red: conClave((ruta, vez, metodo) => (ruta === '/api/suscribir' && metodo === 'POST'
        ? new Response('{"error":"no he podido leer el almacén"}', { status: 503 }) : undefined)),
    });
    const r = await sw.disparar('pushsubscriptionchange', { oldSubscription: vieja, newSubscription: null });
    ok('si el servidor no puede guardarla (503), se avisa a la app con {tipo:"avisoCaducado"}: un silencio no vale',
       !r.error && sw.registro.mensajes.some(m => m.tipo === 'avisoCaducado'),
       JSON.stringify(sw.registro.mensajes));
  }
  {
    const nueva = { toJSON: () => ({ endpoint: 'https://push.prueba/la-del-navegador', keys: { p256dh: 'x', auth: 'y' } }) };
    const sw = arrancar({ ventanas: [] });
    await sw.disparar('pushsubscriptionchange', { oldSubscription: vieja, newSubscription: nueva });
    const alta = sw.registro.peticiones.find(p => p.metodo === 'POST');
    ok('si el navegador ya trae la suscripción nueva, no se vuelve a suscribir: se manda ésa',
       sw.registro.suscripciones.length === 0 && alta && alta.cuerpo.suscripcion.endpoint === 'https://push.prueba/la-del-navegador',
       JSON.stringify(sw.registro.peticiones));
  }
  {
    /* El servidor no da la clave (sin VAPID_PUBLICA da 500). Aunque la
       suscripción vieja traiga una, NO vale: se le pide a la app. */
    const sw = arrancar({
      ventanas: [BASE],
      red: (ruta, vez, metodo) => (ruta === '/api/suscribir' && metodo === 'GET'
        ? new Response('{"error":"falta la clave de firma"}', { status: 500 }) : undefined),
    });
    const r = await sw.disparar('pushsubscriptionchange', { oldSubscription: vieja, newSubscription: null });
    ok('si el servidor no da la clave (GET /api/suscribir falla), NO se renueva con la de la suscripción vieja —si VAPID hubiera rotado sería una clave muerta— y se le pide a la app ({tipo:"avisoCaducado"})',
       !r.error && sw.registro.suscripciones.length === 0 && !sw.registro.peticiones.some(p => p.metodo === 'POST')
       && sw.registro.mensajes.some(m => m.tipo === 'avisoCaducado'),
       JSON.stringify({ suscripciones: sw.registro.suscripciones.length, peticiones: sw.registro.peticiones, mensajes: sw.registro.mensajes }));
  }

  console.log(`\n  ${bien} bien, ${mal} mal\n`);
  if (mal) {
    console.log('  ✗ NO SE PUBLICA. Lo que corre con la app cerrada no puede fallar en silencio.\n');
    process.exit(1);
  }
})().catch(e => {
  console.log(`\n  ✗ la prueba ha reventado: ${e && e.stack || e}\n`);
  process.exit(1);
});
