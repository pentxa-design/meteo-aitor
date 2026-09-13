/* ═══════════════════════════════════════════════════════════════════
   LA ÚNICA PUERTA PARA LEER DEL ALMACÉN
   ───────────────────────────────────────────────────────────────────
   Suyo, 01-09-2026 a las 20:30, después de que le saliera el MISMO
   fallo por tercer día seguido, esta vez en `/api/calibrar`:

     *«pero esto es lo que digo a diario, siempre falla casi lo mismo…
       ¿podéis hacer que esto no pase nunca más?»*

   Y llevaba razón. El fallo era siempre éste:

     El almacén no contesta  →  la función lo captura  →  devuelve una
     lista vacía  →  y responde **200 OK**.

   Con lo cual «no he podido leer» le llega a la pantalla como **«aquí
   no hay nada»**, que es justo lo que él tiene prohibido desde el 27-08:
   *«vacío jamás»*. Un hueco NUNCA puede leerse como «aquí no pasa nada»,
   porque el día que el almacén se caiga con galerna, la app le dirá que
   no hay avisos y mandará a alguien a una torre de 60 m.

   Y lo peor no era el fallo: era CÓMO lo arreglaba yo. Uno por uno,
   según iban apareciendo. Torres el 26, ajustes y campo el 30, marcador
   y suscribir hoy… y hoy mismo salía `calibrar`, que decide si su
   listón de CAPE 700 es el bueno y respondía *«no se te escapa ni un
   rayo»* cuando la verdad era que no había podido leer ni un caso.

   Por eso esto no es otro parche. Es **la única puerta**: aquí vive la
   diferencia entre las dos cosas que se confundían, y ninguna función
   vuelve a decidirlo por su cuenta.

     · **NO EXISTE TODAVÍA** (`BlobNotFoundError`) → eso SÍ es vacío de
       verdad. Es lo normal el primer día de cada cajón. Devuelve el
       valor por defecto y `hay: false`.
     · **CUALQUIER OTRA COSA** (suspendido, sin red, clave mala, JSON
       roto) → **LANZA**. Quien llame decide qué contarle, pero ya no
       puede confundirlo con «no hay nada», porque no recibe un vacío:
       recibe una excepción.

   Y para que esto no dependa de que yo me acuerde el mes que viene,
   hay una guardia en `pruebas-servidor.cjs` — «Nadie lee el almacén por
   su cuenta» — que RECORRE `api/` y falla si aparece un `get(` del Blob
   fuera de aquí. Un fichero nuevo que lo intente no llega a publicarse.
   ═══════════════════════════════════════════════════════════════════ */

import { get } from './blob-falso.mjs';

/** ¿Es «todavía no existe» o es «no he podido leer»? */
export const noExiste = e =>
  e?.name === 'BlobNotFoundError' || /not.?found/i.test(String(e?.message || ''));

/**
 * Lee un JSON del almacén.
 *
 * @param {string} ruta      el cajón, p.ej. 'avisos/torres.json'
 * @param {*}      pordefecto qué devolver cuando el cajón AÚN NO EXISTE
 * @returns {Promise<{dato:*, hay:boolean}>}
 * @throws  si el almacén falla por cualquier otro motivo — a propósito.
 */
export async function leerJSON(ruta, pordefecto = null) {
  try {
    const r = await get(ruta, { access: 'private', useCache: false });
    /* Sin `stream` es que el cajón no está creado: vacío de verdad. */
    if (!r?.stream) return { dato: pordefecto, hay: false };
    const txt = await new Response(r.stream).text();
    if (!txt.trim()) return { dato: pordefecto, hay: false };
    return { dato: JSON.parse(txt), hay: true };
  } catch (e) {
    if (noExiste(e)) return { dato: pordefecto, hay: false };
    throw e;                       // ← el resto SUBE. Nunca un vacío.
  }
}

/** Lo mismo, pero exigiendo una lista: si lo guardado no es un array se
 *  trata como cajón sin estrenar, no como error. */
export async function leerLista(ruta) {
  const { dato, hay } = await leerJSON(ruta, []);
  return Array.isArray(dato) ? { dato, hay } : { dato: [], hay: false };
}

/* ── CÓMO CONTARLO CUANDO FALLA ──────────────────────────────────────
   Para que las siete funciones digan lo mismo y no cada una lo suyo. Su
   regla, tal cual: un hueco se dice, no se disimula. */
export const NO_PUDE = 'no he podido leer el almacén; esto NO quiere decir que esté vacío';

/** Respuesta única para «no he podido leer». Nunca 200: un 200 lo pinta
 *  la app como dato bueno. */
export const fallo = (res, e, extra = {}) =>
  res.status(500).json({ error: String(e?.message || e).slice(0, 120), nota: NO_PUDE, ...extra });
