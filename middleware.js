/* ═══════════════════════════════════════════════════════════════════
   La puerta
   ───────────────────────────────────────────────────────────────────
   Pedido por Aitor el 25-08-2026, cuando salió que su app está en
   internet sin contraseña y él quería meter ahí la lista de sus
   emplazamientos.

   POR QUÉ AQUÍ Y NO EN LA APP. Una contraseña metida en el JavaScript
   no protege NADA: cualquiera abre el código fuente del navegador y la
   lee. Esto corre en el servidor de Vercel, ANTES de servir la página,
   así que quien no pase por aquí no ve ni el HTML.

   TRES DECISIONES, y las tres son por su trabajo, no por comodidad:

   1. **Si no hay clave puesta, se abre.** Fallar abierto, nunca
      cerrado. Él usa esto para decidir si manda gente a una torre, a
      veces de guardia a las tres de la mañana. Que un fallo de
      configuración le deje sin previsión en el monte es peor que que
      la app quede visible.

   2. **Solo se protege la NAVEGACIÓN a la página.** Ni app.js, ni las
      teselas, ni las funciones de datos. Si se protegiera todo, el
      service worker se quedaría sin poder refrescar su caché y la app
      dejaría de funcionar sin cobertura — que es justo cuando más la
      necesita. Lo que se guarda dentro (sus emplazamientos) vive en el
      navegador de su móvil, no en el servidor, así que la puerta está
      donde tiene que estar.

   3. **Un día, no una hora.** Suyo, textual: «cada día, no cada hora».
      La cookie dura 24 h y va firmada; no se puede fabricar sin la
      clave. Si caduca estando sin cobertura, el service worker sigue
      sirviendo lo que tenga guardado: la puerta no se cierra por
      dentro.

   La clave NO está en este fichero ni en el repositorio: vive como
   variable de entorno `APP_CLAVE` en Vercel.
   ═══════════════════════════════════════════════════════════════════ */

const COOKIE = 'torre_pase';
const DIA = 24 * 60 * 60;            // segundos que dura el pase

/* Firma del pase: fecha de caducidad + HMAC con la clave. Así el
   servidor no tiene que recordar nada y el pase no se puede falsificar. */
async function firmar(hasta, clave) {
  const k = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(clave),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(String(hasta)));
  return [...new Uint8Array(s)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function paseValido(cookie, clave) {
  if (!cookie) return false;
  const [hasta, firma] = String(cookie).split('.');
  if (!hasta || !firma) return false;
  if (Number(hasta) < Math.floor(Date.now() / 1000)) return false;
  return firma === await firmar(hasta, clave);
}

/* Comparación en tiempo constante: comparar con === filtra por el
   primer carácter distinto y eso, medido con paciencia, deja adivinar
   la clave dígito a dígito. */
function igual(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

const PUERTA = (aviso) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aitor Meteo</title><style>
:root{color-scheme:dark}
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0b1220;
  color:#e8eefc;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
form{width:min(92vw,340px);text-align:center}
h1{font-size:22px;margin:0 0 4px;letter-spacing:-.02em}
p{color:#8fa3c8;font-size:13.5px;margin:0 0 22px}
input{width:100%;box-sizing:border-box;padding:15px;font-size:22px;text-align:center;
  letter-spacing:.35em;border-radius:13px;border:1px solid #2a3550;
  background:#111a2b;color:#e8eefc}
input:focus{outline:0;border-color:#4d7cff}
button{width:100%;margin-top:11px;padding:14px;font-size:16px;font-weight:650;
  border:0;border-radius:13px;background:#4d7cff;color:#fff;cursor:pointer}
.mal{color:#ff6b7a;font-size:13.5px;margin-top:12px}
.pie{color:#5b6c8d;font-size:12px;margin-top:26px}
</style></head><body>
<form method="POST">
  <h1>Aitor Meteo</h1>
  <p>Trabajo en altura · acceso privado</p>
  <input name="clave" type="password" inputmode="numeric" autocomplete="current-password"
         autofocus placeholder="clave" aria-label="Clave">
  <button type="submit">Entrar</button>
  ${aviso ? `<div class="mal">${aviso}</div>` : ''}
  <div class="pie">Una vez al día. Después no vuelve a preguntar.</div>
</form></body></html>`;

export default async function middleware(request) {
  const clave = process.env.APP_CLAVE;

  // Sin clave configurada, la app se abre. A propósito: ver arriba.
  if (!clave) return;

  const url = new URL(request.url);

  /* Solo la puerta de entrada. Todo lo demás —app.js, teselas, /om,
     /rayos— pasa sin preguntar, para no romper el funcionamiento sin
     cobertura. */
  const esPagina = request.headers.get('sec-fetch-dest') === 'document'
                || (request.method === 'GET' && !/\.[a-z0-9]{2,5}$/i.test(url.pathname)
                    && (request.headers.get('accept') || '').includes('text/html'));
  const esPost = request.method === 'POST' && esPagina;
  if (!esPagina && !esPost) return;

  const galletas = Object.fromEntries((request.headers.get('cookie') || '')
    .split(';').map(c => c.trim().split('=')).filter(x => x[0]));

  if (await paseValido(galletas[COOKIE], clave)) return;

  if (esPost) {
    const cuerpo = new URLSearchParams(await request.text());
    if (igual(String(cuerpo.get('clave') || ''), clave)) {
      const hasta = Math.floor(Date.now() / 1000) + DIA;
      const pase = `${hasta}.${await firmar(hasta, clave)}`;
      return new Response('', {
        status: 303,
        headers: {
          location: url.pathname + url.search,
          'set-cookie': `${COOKIE}=${pase}; Path=/; Max-Age=${DIA}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    // Un respiro contra el que prueba a lo bruto. Cuatro cifras son
    // diez mil combinaciones: sin esto se agotan en un rato.
    await new Promise(r => setTimeout(r, 1200));
    return new Response(PUERTA('Esa no es.'), {
      status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  return new Response(PUERTA(''), {
    status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const config = {
  // El service worker y el manifiesto quedan fuera: si se les pide
  // contraseña, la app deja de poder instalarse y de funcionar sin red.
  matcher: ['/((?!sw\\.js|manifest\\.webmanifest|icons/|vendor/|api/|_next/).*)'],
};
