/* ═══════════════════════════════════════════════════════════════════
   Service worker
   ───────────────────────────────────────────────────────────────────
   REGLA: nunca mostrar algo viejo haciéndolo pasar por actual.

   · Con cobertura → SIEMPRE la versión que hay en el servidor.
     (La primera versión servía la copia guardada antes de mirar la red,
      y eso dejaba al usuario con una app antigua sin saberlo. Corregido.)
   · Sin cobertura → la última copia guardada, y la app lo dice en
     pantalla con la hora de la descarga.
   ═══════════════════════════════════════════════════════════════════ */

const V     = 'torre-2026.09.12-1134';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './maps.js',
  './manifest.webmanifest',
  // Catálogo de emplazamientos: para que el buscador los encuentre sin
  // cobertura, justo donde están. ~300 KB, se baja una vez por versión.
  './data/estaciones.json',
  './icons/icon-192.png?v=20260827', './icons/icon-512.png?v=20260827',
  // Las librerías del mapa. Sin ellas, sin cobertura no hay mapa: ni
  // modelos, ni radar, ni satélite. Son 3,8 MB y se bajan una vez por
  // versión publicada, pero en el monte valen su peso en oro.
  './vendor/maplibre-gl.css',
  './vendor/maplibre-gl.js',
  './vendor/openmeteo-weather-map-layer-0.0.20.js',
  // Leaflet, el mapa del radar de la pestaña Radar. Se cargaba de unpkg
  // y de fuera no se guarda nada: sin cobertura no había radar. La misma
  // clase de fallo que MapLibre el 23-08, cazada por la revisión del
  // 04-09-2026. Desde el 05-09 vive en vendor/leaflet/.
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
];

/* ── LO QUE NO SE PUDO GUARDAR SE APUNTA Y SE DICE ──────────────────
   Hasta el 05-09-2026 un fichero del casco que diera 404 se saltaba en
   silencio (`.then(r => r.ok ? c.put(u, r) : null).catch(() => null)`).
   Lo cazó la revisión del 04-09: en casa no se nota porque hay red; en
   el monte sin cobertura el mapa no arranca o el buscador de sus
   emplazamientos sale vacío, y nada dice por qué.

   · Cada fichero se pide DOS veces antes de darlo por perdido: un corte
     de un segundo en el monte no puede dejar el casco cojo una versión
     entera.
   · La instalación NO se bloquea aunque falte algo. Si se bloqueara, el
     service worker viejo se quedaría para siempre y no entraría ni la
     versión que lo arregle.
   · Lo que falta queda en la caché de esta versión bajo FALTAN —una
     lista JSON, vacía cuando está todo— y se avisa a las ventanas
     abiertas con {tipo:'precache-faltan', faltan:[...]}. La lista en
     caché es la que vale: lo normal es que la versión se instale con la
     app cerrada y no haya nadie a quien mandar el mensaje. La app TIENE
     que leerla con caches.match(FALTAN) al arrancar; a 05-09-2026 aún no
     lo hace (`grep __faltan app.js` = 0): queda pendiente en app.js. */
const FALTAN = './__faltan.json';
const REINTENTO_MS = 1000;

async function bajar(u) {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      // cache:'reload' evita que el precacheo se llene con copias viejas
      // guardadas por el navegador: se pide todo a la red de verdad.
      const r = await fetch(new Request(u, { cache: 'reload' }));
      if (r.ok) return r;
    } catch { /* red caída o cortada a medias: se vuelve a pedir */ }
    if (intento === 1) await new Promise(r => setTimeout(r, REINTENTO_MS));
  }
  return null;
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    const perdidos = new Set();
    await Promise.all(SHELL.map(async u => {
      const r = await bajar(u);
      if (!r) { perdidos.add(u); return; }
      // Un put que falle (sin sitio en el disco) cuenta como que falta:
      // lo que no está guardado no está, diga lo que diga la red.
      try { await c.put(u, r); } catch { perdidos.add(u); }
    }));
    const faltan = SHELL.filter(u => perdidos.has(u));   // en el orden del casco
    try {
      await c.put(FALTAN, new Response(JSON.stringify(faltan),
        { headers: { 'Content-Type': 'application/json' } }));
    } catch { /* si ni esto cabe, el aviso de abajo sale igual */ }
    if (faltan.length) {
      console.warn(`[sw] ${V}: ${faltan.length} del casco sin guardar (sin cobertura faltarán): ${faltan.join(', ')}`);
      try {
        const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        cs.forEach(w => w.postMessage({ tipo: 'precache-faltan', faltan, version: V }));
      } catch { /* sin ventanas a las que avisar; la lista queda en la caché */ }
    }
    await self.skipWaiting();
  })());
});

/* Las cachés de versiones viejas se tiran al activar. La de los avisos
   recibidos NO es de una versión: hasta el 05-09-2026 aquí solo se
   salvaba V, así que la lista de los últimos 40 avisos se borraba con
   cada publicación —y se publica varias veces al día—. Él la pidió para
   releer lo de hoy y lo de ayer, y le duraba lo que durase la versión.
   Medido en prueba-sw.cjs.

   OJO: ésta es solo UNA de las dos puertas por las que se borraba. La
   otra está en app.js, en comprobarVersion(): al ver un build distinto
   en version.json hace `(await caches.keys()).forEach(k => caches.delete(k))`
   —todas, ésta incluida— y corre al arrancar, cada 5 min, al volver la
   app a primer plano y tras «actualizar». Con la app abierta o en
   segundo plano cuando se publica (lo normal) la lista se sigue
   perdiendo por allí. Desde aquí no se puede parar: caches.delete()
   desde la ventana no pasa por el service worker. Lo midió la revisión
   adversaria del 05-09-2026; queda pendiente excluir AVISOS en app.js.
   Hasta entonces lo que se garantiza es solo lo que se prueba: que el
   service worker ya no la tira. */
const AVISOS = 'avisos-recibidos';
const DE_SIEMPRE = [AVISOS];

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== V && !DE_SIEMPRE.includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Las APIs meteorológicas no se tocan: van siempre a la red y, si
  // falla, es la app quien decide mostrar su copia avisando de la hora.
  if (url.origin !== location.origin) return;

  // El intermediario /om lleva datos meteorológicos: va siempre a la red
  // y lo cachea el CDN, no el service worker. Así nunca se sirve una
  // previsión vieja disfrazada de actual.
  /* ── Y TODO LO DEMÁS QUE SEA UNA MEDIDA, IGUAL ─────────────────────
     Lo cazó el barrido del 01-09-2026, y estaba MEDIDO: con la red lenta,
     el service worker servía a los 4 s su copia de `/estaciones` — un 200
     con cuerpo de hace tres horas. Y como la antigüedad viaja en un
     contador relativo que el navegador vuelve a convertir en hora de
     reloj al pintar, la racha se rejuvenecía sola: una medida de las
     18:35 se le pintaba «a las 21:36 · hace 20 min». La marca de «dato
     viejo» tampoco saltaba, porque mira ese mismo contador congelado.

     Aquí sólo se listaba `/om` porque el resto se pensó para Netlify
     (`/.netlify/`), y en Vercel esas rutas no existen: `/estaciones`,
     `/rayos`, `/mareas` y `/api/*` son del mismo origen y caían todas en
     el camino de caché.

     Una MEDIDA nunca se sirve de una copia. Si no hay red, que la app lo
     diga —que ya sabe— en vez de enseñar un número viejo con cara de
     nuevo. Lo que sí se sigue cacheando es el casco de la app (índice,
     scripts, estilos, el mapa), que es lo que le hace falta en el monte.
     El resto de exclusiones se dejan escritas de una en una a propósito:
     un `startsWith('/api/')` a secas dejaría fuera lo que venga mañana
     sin que nadie lo piense. */
  const NUNCA_DE_COPIA = [
    '/om',            // la previsión
    '/estaciones',    // lo medido por AEMET
    '/api/euskalmet', // lo medido por Euskalmet
    '/rayos',         // las descargas: su veto
    '/mareas',        // la tabla oficial
    '/radar', '/satelite', '/webcams',
    '/api/vigilante', '/api/campo', '/api/marcador', '/api/calibrar',
    '/api/torres', '/api/ajustes', '/api/suscribir', '/api/avisar',
    '/api/parte', '/api/foto', '/api/prueba-aviso', '/api/estaciones',
  ];
  if (NUNCA_DE_COPIA.some(r => url.pathname === r || url.pathname.startsWith(r + '/'))
      || url.pathname.startsWith('/.netlify/')
      || url.pathname.startsWith('/omtiles/')) return;

  /* Todo lo propio: RED PRIMERO, pero con dos salvedades que salieron
     el 26-08-2026 pensando en cómo trabaja él de verdad — en el monte,
     con una rayita, no con fibra.

     1. **LA RED NO PUEDE HACERLE ESPERAR SIN LÍMITE.** Antes se
        esperaba a la red aunque hubiera copia guardada al lado. Con
        cobertura mala eso es una pantalla en blanco mientras decide si
        manda a alguien a una torre. Ahora, si en 4 segundos la red no
        ha contestado Y hay copia, se sirve la copia. La petición a la
        red sigue viva por detrás y refresca la caché para la próxima.

     2. **LA PUERTA NO SE CIERRA POR DENTRO.** Si el pase de 24 h le
        caduca en el monte, la red devuelve un 401 con la pantalla de la
        contraseña. Antes se le enseñaba ESO, teniendo su app guardada.
        Sin cobertura entraba y con media rayita se quedaba fuera —
        justo al revés de lo que interesa. Ahora un 401 con copia
        guardada sirve la copia. No debilita la puerta: esa copia está
        en SU móvil y en ningún sitio más; quien no haya entrado nunca
        no tiene nada que servir.                                     */
  e.respondWith((async () => {
    const guardada = () => caches.match(request);
    const conCache = async () => (await guardada())
      || (request.mode === 'navigate' ? caches.match('./index.html') : undefined);

    /* El casco de la app (index, app.js, maps.js, styles.css) se pide
       REVALIDANDO. GitHub Pages lo sirve con max-age=600: tras publicar,
       el navegador tenía hasta 10 minutos un app.js VIEJO que este mismo
       handler guardaba en la caché nueva; version.json (sin caché) decía
       otro build y la app recargaba en bucle hasta que caducaba (cazado
       el 10-09-2026 en el Mac; es el «parpadeo» del iPhone del 07-09).
       Con cache:'no-cache' el servidor contesta 304 si no ha cambiado:
       cuesta lo mismo y nunca sirve un casco caducado. */
    const nombre = url.pathname.split('/').pop();
    const esCasco = nombre === '' || /^(index\.html|styles\.css|app\.js|maps\.js|version\.json)$/.test(nombre);
    let pedida = request;
    if (esCasco) {
      try {
        pedida = request.mode === 'navigate'
          ? new Request(request.url, { cache: 'no-cache', credentials: 'same-origin' })
          : new Request(request, { cache: 'no-cache' });
      } catch { pedida = request; }
    }
    const red = fetch(pedida).then(net => {
      if (net && net.status === 200) {
        const copy = net.clone();
        caches.open(V).then(c => c.put(request, copy)).catch(() => {});
      }
      return net;
    });
    red.catch(() => {});                 // que no cante como no capturada

    // Si tarda más de 4 s y hay copia, se sirve la copia.
    const espera = new Promise(r => setTimeout(() => r('tarde'), 4000));
    const quien = await Promise.race([red.then(() => 'red'), espera]);
    if (quien === 'tarde') {
      const hit = await conCache();
      if (hit) return hit;
    }

    try {
      const net = await red;
      // 401 = la puerta. Si tenemos su app guardada, se la damos.
      if (net && net.status === 401) {
        const hit = await conCache();
        if (hit) return hit;
      }
      return net;
    } catch {
      const hit = await conCache();
      if (hit) return hit;
      throw new Error('sin red y sin copia guardada');
    }
  })());
});


/* ═══════════════════════════════════════════════════════════════════
   AVISOS AL MÓVIL
   ───────────────────────────────────────────────────────────────────
   Pedido por él el 26-08-2026: «¿esta app no podría enviarme
   notificaciones al teléfono?». La app ya estaba instalada en su móvil,
   que en iPhone es condición obligatoria: sin instalarla en la pantalla
   de inicio, Apple no deja llegar ningún aviso.

   Esto es lo único que corre con la app CERRADA. Por eso va aquí y no
   en app.js.

   Y una regla que vale para todo lo de esta app: **el aviso dice la
   hora del dato, no la de llegada**. Un aviso que llega tarde y no lo
   dice se lee como si fuera de ahora, y con eso se manda a alguien.
   ═══════════════════════════════════════════════════════════════════ */

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { cuerpo: e.data && e.data.text() }; }

  const titulo = d.titulo || 'Aitor Meteo';
  const opciones = {
    body: d.cuerpo || '',
    icon: './icons/icon-192.png?v=20260827',
    badge: './icons/icon-192.png?v=20260827',
    tag: d.tag || 'meteo',        // uno nuevo del mismo tipo sustituye al viejo
    renotify: true,
    requireInteraction: !!d.importante,
    data: { url: d.url || './', enviado: d.enviado || null },
  };
  e.waitUntil((async () => {
    await self.registration.showNotification(titulo, opciones);
    await apuntarAviso({ titulo, cuerpo: opciones.body, tag: d.tag || 'meteo',
                         llegado: Date.now(), enviado: d.enviado || null });
  })());
});

/* ── QUEDA GUARDADO ───────────────────────────────────────────────────
   Suyo, 26-08-2026, nada más recibir el primero: *«pero se va seguido,
   ¿dónde queda o dónde puedo releerlo?»*.

   Y tiene toda la razón. Un aviso de tormenta se lee de refilón, con el
   móvil en la mano y a lo mejor conduciendo. Si al apartarlo desaparece
   para siempre, no sirve para volver a mirarlo con calma antes de mandar
   a alguien.

   Se guardan aquí, en el service worker, porque es lo único que corre
   con la app CERRADA — que es justo cuando llegan. La app los lee luego.

   Los últimos 40 y nada más: esto es para releer lo de hoy y lo de ayer,
   no un archivo. */
async function apuntarAviso(a) {
  try {
    const cache = await caches.open(AVISOS);
    const r = await cache.match('lista');
    const previos = r ? await r.json() : [];
    const lista = [a, ...previos].slice(0, 40);
    await cache.put('lista', new Response(JSON.stringify(lista),
      { headers: { 'Content-Type': 'application/json' } }));
    /* Si la app está abierta, que se entere sin esperar. */
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cs.forEach(c => c.postMessage({ tipo: 'avisoNuevo' }));
  } catch { /* que no se pierda el aviso por no poder guardarlo */ }
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  /* ── AL TOCAR EL AVISO SE ABRE LA APP, SIEMPRE ────────────────────────
     Suyo, 01-09-2026: *«le doy a los mensajes que quedan arriba en el
     móvil para entrar y se van»*. Y era esto: la dirección iba RELATIVA
     (`'./'`) y en Android, dentro de un service worker, eso no siempre
     resuelve — se cerraba el aviso y no se abría nada. El aviso que no
     lleva a ningún sitio es medio aviso: él lo toca justamente para ver
     qué pasa.

     Ahora la dirección se resuelve ENTERA contra el ámbito del service
     worker, la búsqueda de ventana abierta compara por origen (no por
     `includes`, que fallaba si la app estaba en otra ruta), y si abrir
     falla se reintenta con la raíz. */
  const base = self.registration.scope;
  let destino = base;
  try { destino = new URL((e.notification.data && e.notification.data.url) || './', base).href; }
  catch { destino = base; }

  e.waitUntil((async () => {
    try {
      const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of abiertas) {
        try {
          if (new URL(c.url).origin === new URL(base).origin) {
            await c.focus();
            if ('navigate' in c && destino !== c.url) { try { await c.navigate(destino); } catch {} }
            return;
          }
        } catch {}
      }
      await self.clients.openWindow(destino);
    } catch {
      /* Último recurso: la raíz. Antes que no abrir nada. */
      try { await self.clients.openWindow(base); } catch {}
    }
  })());
});

/* La app también puede pedir que se apunte un aviso que ha enseñado ella
   misma (la prueba local). Sin esto, la lista salía coja: llegaban dos
   avisos al móvil y en la lista solo aparecía uno, que es peor que no
   tener lista — hace dudar de si el otro llegó. */
self.addEventListener('message', e => {
  if (e.data?.tipo === 'apunta' && e.data.aviso) {
    e.waitUntil(apuntarAviso(e.data.aviso));
  }
});

/* ── SI EL NAVEGADOR CADUCA LA SUSCRIPCIÓN, SE RENUEVA AQUÍ ──────────
   El navegador rota la suscripción de push cada cierto tiempo, y lo hace
   por su cuenta: con la app CERRADA casi siempre. Hasta el 05-09-2026
   esto solo mandaba «avisoCaducado» a las ventanas abiertas para que la
   app volviera a pedir el permiso. Medido en prueba-sw.cjs: con cero
   ventanas el manejador no hacía nada, el mensaje se perdía y los envíos
   morían en silencio — que es el peor fallo posible: no llega nada y
   parece que no hay tormenta.

   Ahora renueva el propio service worker: pide la clave de firma al
   servidor (GET /api/suscribir, la misma que usa la app), se suscribe
   con ella, manda la nueva a /api/suscribir —el mismo camino que usa la
   app; el servidor pisa por endpoint, no duplica— y avisa a la app con
   «avisoRenovado». Solo si no lo consigue se le pide a la app que lo
   haga ella («avisoCaducado», como antes).

   La clave se pide SIEMPRE al servidor y nunca se reutiliza la que trae
   la suscripción vieja (oldSubscription.options.applicationServerKey):
   api/suscribir.mjs dice que tiene que ser LA MISMA con la que se firma
   el envío y vive en VAPID_PUBLICA; si un día se rota, renovar con la
   vieja daría una suscripción que el servidor no puede firmar y los
   envíos morirían sin ruido, justo lo que esto quiere cerrar. Lo señaló
   la revisión adversaria del 05-09-2026. Es una petición más, y solo
   cuando el navegador caduca la suscripción. */
async function renovarSuscripcion(e) {
  const donde = new URL('./api/suscribir', self.registration.scope).href;
  try {
    let nueva = e.newSubscription || null;
    if (!nueva) {
      const r = await fetch(donde, { cache: 'no-store' });
      if (!r.ok) return false;
      const { publica } = await r.json();
      if (!publica) return false;
      nueva = await self.registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: claveDeFirmaABytes(publica),
      });
    }
    const alta = await fetch(donde, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suscripcion: nueva.toJSON() }),
    });
    return alta.ok;
  } catch { return false; }
}

/* La misma cuenta que claveABytes() en app.js: la clave viene en base64
   de URL y subscribe() la quiere en bytes. Se repite aquí porque el
   service worker no puede leer app.js. */
function claveDeFirmaABytes(b64) {
  const relleno = '='.repeat((4 - (b64.length % 4)) % 4);
  const limpio = (b64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const cru = atob(limpio);
  return Uint8Array.from([...cru].map(c => c.charCodeAt(0)));
}

self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil((async () => {
    const renovada = await renovarSuscripcion(e);
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cs.forEach(c => c.postMessage({ tipo: renovada ? 'avisoRenovado' : 'avisoCaducado' }));
  })());
});
