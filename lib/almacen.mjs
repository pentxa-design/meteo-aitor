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

import {
  leerTexto, leerCrudo, guardarTexto, guardarCrudo, borrarCrudo, esNoExiste,
} from './motor.mjs';

/** ¿Es «todavía no existe» o es «no he podido leer»? */
export const noExiste = esNoExiste;

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
    const txt = await leerTexto(ruta);
    /* `null` es que el cajón no está creado: vacío de verdad. */
    if (txt === null || !txt.trim()) return { dato: pordefecto, hay: false };
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


/* ═══════════════════════════════════════════════════════════════════
   LA MISMA PUERTA, PERO PARA ESCRIBIR
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-09-2026 a las 22:20, con el almacén suspendido y las dos
   apps caídas a la vez:

     *«yo no puedo andar así, para eso estáis»*

   La lectura ya tenía una sola puerta desde el 01-09. La escritura NO:
   estaba repetida en **trece sitios** —nueve en la app de torres y
   cuatro en la agenda— con las mismas cuatro opciones copiadas a mano
   en cada uno. Mientras el almacén funcionó, eso solo era feo. El día
   que hubo que cambiar de almacén, se convirtió en trece oportunidades
   de que se me escapara una y algo dejara de guardar en silencio.

   Que es exactamente lo que él lleva diciendo desde el 01-09: **el
   parche del día no vale; si el fallo se puede repetir en otro sitio,
   una sola puerta y una guardia que la vigile.**

   Así que a partir de aquí NADIE llama a `put` ni a `del` por su
   cuenta. Se pasa por aquí. Y cuando haya que mudar el almacén de
   sitio —que va a haber que hacerlo, porque Vercel lo ha dejado fuera
   del plan gratuito— se cambia **este fichero y ya está**, no trece.

   La guardia que lo hace cumplir está en `pruebas-servidor.cjs`:
   recorre `api/` y no deja publicar un fichero que se salte la puerta.
   ═══════════════════════════════════════════════════════════════════ */

/* El DÓNDE se guarda vive en `motor.mjs`, y ahí están las opciones del
   almacén escritas una sola vez. Aquí solo el QUÉ. */

/** Guarda un JSON. El caso de trece de cada catorce llamadas. */
export const guardarJSON = (ruta, dato) =>
  guardarTexto(ruta, JSON.stringify(dato), 'application/json');

/** Guarda bytes tal cual: una foto suya del monte, o un día comprimido.
 *  `tipo` es el content-type ('image/jpeg', 'application/gzip'…). */
export const guardarBytes = (ruta, bytes, tipo) => guardarCrudo(ruta, bytes, tipo);

/**
 * Lee bytes en crudo (una foto). Misma regla que `leerJSON`: si el
 * cajón no existe devuelve `null`, y **cualquier otro fallo lanza**.
 * Una foto que no carga porque el almacén está caído no puede
 * confundirse con una foto que nunca se subió.
 */
export async function leerBytes(ruta) {
  try {
    return await leerCrudo(ruta);
  } catch (e) {
    if (noExiste(e)) return null;
    throw e;
  }
}

/** Borra cajones. Se traga el fallo a propósito: si no se puede borrar
 *  lo viejo, se reintenta en la siguiente pasada. Perder un borrado no
 *  le rompe nada; perder un guardado sí. */
export const borrar = async rutas => {
  try { await borrarCrudo(rutas); return true; } catch { return false; }
};
