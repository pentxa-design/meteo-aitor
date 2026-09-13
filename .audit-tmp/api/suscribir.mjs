/* ═══════════════════════════════════════════════════════════════════
   APUNTAR SU MÓVIL PARA LOS AVISOS
   ───────────────────────────────────────────────────────────────────
   Suyo, 26-08-2026: «¿esta app no podría enviarme notificaciones al
   teléfono?» y, más claro todavía: «por correo no me entero de nada».

   Aquí solo se guarda la dirección a la que Apple o Google entregan el
   aviso. No lleva nada suyo dentro: ni dónde está, ni sus torres, ni
   quién es. Y va en un almacén PRIVADO.

   POR QUÉ NO EN EL MAC. Él lo dijo con todas las letras: «notificaciones
   por la app, terminal móvil, y no depender del Mac». Un aviso de
   tormenta que solo sale si su ordenador está encendido no es un aviso
   de guardia. Esto corre en el servidor.
   ═══════════════════════════════════════════════════════════════════ */

import { put } from '../lib/blob-falso.mjs';
import { leerLista as leerDelAlmacen } from '../lib/almacen.mjs';

const CAJON = 'avisos/moviles.json';

/* Cada aparato suyo es una fila. Si vuelve a dar permiso desde el mismo
   móvil, se pisa la suya y no se duplica: dos filas iguales serían dos
   notificaciones para el mismo teléfono. */
export default async function handler(req, res) {
  /* Con GET devuelve la clave pública de firma. La app la necesita para
     pedir el permiso, y tiene que ser LA MISMA con la que luego se firma
     el envío. Por eso sale de la variable de entorno y no está copiada
     en el código: dos copias acaban desparejándose y entonces los avisos
     dejan de llegar SIN dar ningún error, que es el fallo peor. */
  if (req.method === 'GET') {
    const pub = process.env.VAPID_PUBLICA;
    if (!pub) return res.status(500).json({ error: 'falta la clave de firma' });
    res.setHeader('Cache-Control', 'no-store');
    /* CUÁNTOS APARATOS HAY APUNTADOS. Sugerido por la sesión del
       vigilante el 26-08-2026, y es la regla de siempre de esta app:
       **un silencio no puede parecer «todo bien»**. Con cero móviles
       apuntados no le llega nada, y hasta ahora la única forma de
       enterarse era provocar una tormenta. Ahora lo pone en pantalla.
       Es solo un número: no dice de quién ni permite avisar a nadie. */
    let aparatos = null;                 // null = no se ha podido saber
    try { aparatos = (await leer()).length; } catch { aparatos = null; }
    return res.status(200).json({ publica: pub, aparatos });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'solo GET o POST' });

  /* ¿ESTE APARATO ESTÁ APUNTADO AQUÍ? Preguntado por la app antes de
     decirle «avisos activados».

     Existe por lo del 26-08-2026: su Android tenía permiso y suscripción,
     la app ponía «ACTIVADOS» y el servidor no lo tenía guardado. La app
     miraba solo el móvil. **Una app que dice que avisa y no avisa es
     peor que una que no avisa**: se sale de casa creyendo que estás
     cubierto. */
  if (req.body?.comprobar) {
    try {
      const filas = await leer();
      return res.status(200).json({ apuntado: filas.some(a => a.endpoint === req.body.comprobar) });
    } catch (e) {
      /* Si no se puede comprobar, se dice — no se contesta que sí. */
      return res.status(503).json({ error: 'no se ha podido comprobar', detalle: String(e?.message || e) });
    }
  }

  const s = req.body?.suscripcion;
  if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) {
    return res.status(400).json({ error: 'suscripción incompleta' });
  }

  try {
    const previas = await leer();
    const otras = previas.filter(x => x.endpoint !== s.endpoint);
    const fila = {
      endpoint: s.endpoint,
      keys: s.keys,
      apodo: String(req.body?.apodo || 'móvil').slice(0, 40),
      alta: new Date().toISOString(),
    };
    await guardar([...otras, fila]);
    return res.status(200).json({ ok: true, aparatos: otras.length + 1,
                                  yaEstaba: previas.length !== otras.length });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

/* EL ALMACÉN ES PRIVADO Y SE LEE Y SE ESCRIBE COMO PRIVADO.
   Falló el 26-08-2026 en el móvil de Aitor: se guardaba con
   `access: 'public'` y el servidor contestaba «Cannot use public access
   on a private store». Resultado: la app decía «avisos ACTIVADOS» y el
   servidor no tenía apuntado el teléfono. El fallo se me pasó porque
   probé las dos formas de decir que NO —suscripción incompleta y aparato
   inventado— y ninguna de decir que SÍ.

   Y privado tiene que ser: con el `endpoint` y las `keys` de su móvil
   cualquiera podría hacerle sonar el teléfono de madrugada. */
/* ── LOS MÓVILES DE RESERVA, EN UNA VARIABLE DE ENTORNO ──────────────
   Puesto el 01-09-2026, con el almacén de Vercel SUSPENDIDO y sus avisos
   de tormenta sin salir. Él lo dijo claro: *«no voy a pagar por subir
   fotos a la app»* — y tiene razón, porque las fotos eran 6,5 de los
   6,8 MB. Pero sus avisos no pueden depender de eso: la lista de móviles
   pesa 1,2 KB.

   Así que el vigilante mira DOS sitios: el almacén (cuando funcione) y
   `MOVILES_EXTRA`, una variable de entorno con la suscripción de su
   teléfono. Gratis, sin almacén y sin depender de nadie. Se juntan por
   `endpoint`, así que un móvil que esté en los dos no suena dos veces.

   Y si un día se levanta el almacén, esto no estorba: suma. */
function deLaVariable() {
  const txt = process.env.MOVILES_EXTRA;
  if (!txt) return [];
  try {
    const j = JSON.parse(txt);
    const filas = Array.isArray(j) ? j : [j];
    return filas.filter(a => a?.endpoint && a?.keys);
  } catch { return []; }
}

/** Junta las dos fuentes sin repetir aparatos. */
function juntarAparatos(a, b) {
  const vistos = new Set();
  return [...a, ...b].filter(x => {
    if (!x?.endpoint || vistos.has(x.endpoint)) return false;
    vistos.add(x.endpoint); return true;
  });
}

export async function leer() {
  try {
    /* OJO: cuando el fichero no existe todavía, `get` devuelve **null**;
       no lanza. Desestructurarlo directamente revienta con «Cannot
       destructure property 'stream' of null», que es lo que pasó en el
       primer intento del arreglo. */
    const { dato, hay } = await leerDelAlmacen(CAJON);
    if (!hay) return deLaVariable();     // aún no hay fichero: quedan los de la variable
    return juntarAparatos(dato, deLaVariable());
  } catch (e) {
    /* Con el almacén caído NO se lanza si hay móviles en la variable de
       entorno: se avisa con ellos, que es lo que importa. Si tampoco los
       hay, se lanza para que el vigilante pueda decir que está ciego —
       nunca «ningún móvil apuntado», que es mentira. */
    const reserva = deLaVariable();
    if (reserva.length) return reserva;
    throw e;
  }
}

export async function guardar(filas) {
  await put(CAJON, JSON.stringify(filas), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
