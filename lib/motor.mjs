/* ═══════════════════════════════════════════════════════════════════
   EL MOTOR DEL ALMACÉN — DÓNDE SE GUARDAN LAS COSAS DE VERDAD
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-09-2026 a las 22:20, con la agenda sin poder guardar y esta
   app dando 403 desde hacía tres días:

     *«yo no puedo andar así, para eso estáis»*
     *«no pago nada»*

   QUÉ PASÓ. Vercel sacó su Blob del plan gratuito. El almacén
   `avisos-aitor` se quedó en **«Billing State: Inactive»** el
   01-09-2026 con 6,02 MB y 44 ficheros dentro. No está agotado por
   uso —6 MB no agotan nada—: es el plan. Y Vercel **no da fecha de
   vuelta**; reactivarlo pide tarjeta, y él ha dicho que no.

   QUÉ ES ESTO. El sitio donde se guarda, separado de la puerta. La
   puerta (`almacen.mjs`) dice QUÉ se guarda y cómo se cuentan los
   fallos; esto dice DÓNDE. Se puede cambiar el dónde sin tocar el qué.

   HAY DOS, Y ELIGE SOLO:

     · **Redis** (Upstash), si están sus dos variables. Plan gratuito de
       verdad: 256 MB y 500.000 órdenes al mes. Sus 6 MB caben ochenta
       veces, y las dos apps juntas no llegan a 20.000 órdenes al mes.
     · **El Blob de Vercel**, si no las hay. Es lo que había hasta hoy.

   POR QUÉ ASÍ Y NO CAMBIANDO EL CÓDIGO A PELO. Porque el día que se
   conecte el Redis, **no hay que publicar nada**: Vercel mete las
   variables y a la siguiente llamada ya está escribiendo en el sitio
   nuevo. Y si algún día se vuelve atrás, se quitan y vuelve solo.

   LO QUE NO SE PUEDE PERDER, PASE LO QUE PASE. La diferencia entre
   «este cajón no existe todavía» y «no he podido leer». Los dos
   motores la marcan igual: el primero devuelve `null`, el segundo
   LANZA. Si se confunden, la app le dice «no hay avisos» cuando lo que
   pasa es que está ciega, y eso manda a alguien a una torre de 60 m
   con galerna. Su regla desde el 27-08: **vacío jamás**.
   ═══════════════════════════════════════════════════════════════════ */

/* ── EL BLOB SE CARGA SOLO SI SE USA ─────────────────────────────────
   Import perezoso a propósito, por dos motivos:

     1. Con el Redis enchufado, `@vercel/blob` deja de hacer falta. Un
        paquete que no se carga es un paquete que no puede romperse en
        un despliegue.
     2. La agenda no tiene `node_modules` en el Mac, y con el import
        arriba las pruebas del motor no arrancaban en local. Una prueba
        que no se puede correr es una prueba que no corre nadie. */
let _blob = null;
const blob = async () => (_blob ??= await import('@vercel/blob'));

/* Vercel las llama `KV_*` cuando el Redis se conecta desde su panel, y
   `UPSTASH_*` cuando se pega a mano. Valen las dos. */
const URL_R = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || '';
const TOK_R = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

/** ¿Con qué se está guardando ahora mismo? Sale en `/api/vigilante` y
 *  en las pruebas, para no tener que adivinarlo. */
export const motor = () => (URL_R && TOK_R ? 'redis' : 'blob');

/* ── REDIS POR HTTP, SIN LIBRERÍA ────────────────────────────────────
   Upstash habla REST: se le manda la orden como lista JSON y contesta
   `{ result: … }`. No hace falta traerse un paquete para eso, y un
   paquete menos es una cosa menos que se rompa sola en un despliegue. */
async function orden(...partes) {
  const r = await fetch(URL_R, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOK_R}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(partes),
    cache: 'no-store',
  });
  if (!r.ok) {
    /* Cualquier fallo del almacén SUBE. Nunca se convierte en un vacío:
       eso es lo que hacía el Blob viejo y lo que costó tres días. */
    throw new Error(`Redis ${r.status}: ${(await r.text()).slice(0, 120)}`);
  }
  const j = await r.json();
  if (j.error) throw new Error(`Redis: ${String(j.error).slice(0, 120)}`);
  return j.result;                       // `null` = ese cajón no existe
}

/* ── LO QUE USA LA PUERTA ────────────────────────────────────────────
   Tres verbos y ya. Texto, bytes y borrar. */

/** Lee texto. `null` si el cajón no existe (y SOLO por eso). */
export async function leerTexto(ruta) {
  if (motor() === 'redis') {
    const v = await orden('GET', ruta);
    return v === null || v === undefined ? null : String(v);
  }
  const { get } = await blob();
  const r = await get(ruta, { access: 'private', useCache: false });
  if (!r?.stream) return null;
  return await new Response(r.stream).text();
}

/** Lee bytes. `null` si el cajón no existe. En Redis van en base64. */
export async function leerCrudo(ruta) {
  if (motor() === 'redis') {
    const v = await orden('GET', ruta);
    if (v === null || v === undefined) return null;
    return Buffer.from(String(v), 'base64');
  }
  const { get } = await blob();
  const r = await get(ruta, { access: 'private', useCache: false });
  if (!r?.stream) return null;
  return Buffer.from(await new Response(r.stream).arrayBuffer());
}

const COMUN = { access: 'private', addRandomSuffix: false, allowOverwrite: true };

export async function guardarTexto(ruta, texto, tipo = 'application/json') {
  if (motor() === 'redis') return void await orden('SET', ruta, texto);
  const { put } = await blob();
  await put(ruta, texto, { ...COMUN, contentType: tipo });
}

export async function guardarCrudo(ruta, bytes, tipo) {
  if (motor() === 'redis') {
    return void await orden('SET', ruta, Buffer.from(bytes).toString('base64'));
  }
  const { put } = await blob();
  await put(ruta, bytes, { ...COMUN, contentType: tipo });
}

export async function borrarCrudo(rutas) {
  const lista = Array.isArray(rutas) ? rutas : [rutas];
  if (!lista.length) return;
  if (motor() === 'redis') return void await orden('DEL', ...lista);
  const { del } = await blob();
  await del(lista);
}

/* ── «NO EXISTE» EN CADA MOTOR ───────────────────────────────────────
   En Redis un cajón que no existe devuelve `null` y no lanza, así que
   aquí solo hay que reconocer las formas del Blob. */
export const esNoExiste = e =>
  e?.name === 'BlobNotFoundError' || /not.?found|no such|404/i.test(String(e?.message || ''));
