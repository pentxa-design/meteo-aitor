/* ═══════════════════════════════════════════════════════════════════
   ENVIARLE EL AVISO AL MÓVIL
   ───────────────────────────────────────────────────────────────────
   Lo llama el vigilante (o cualquier tarea nuestra) cuando hay algo que
   NO puede esperar a que abra la app. Va con clave: sin ella, cualquiera
   podría hacerle sonar el teléfono a las tres de la mañana, y entonces
   dejaría de hacerle caso a los de verdad.

   REGLA DE LO QUE SE ENVÍA, y es la de siempre en esta app: **el aviso
   dice la hora del dato**. Un push puede llegar con retraso; si no dice
   de cuándo es, se lee como si fuera de ahora, y con eso se manda a
   alguien a una torre.

   LIMPIEZA. Si Apple o Google responden 404 o 410, ese aparato ya no
   existe (desinstaló, o caducó el permiso). Se borra en el momento: una
   lista con direcciones muertas hace que los envíos tarden y acaben
   fallando también los buenos.
   ═══════════════════════════════════════════════════════════════════ */

import webpush from 'web-push';
import { leer, guardar } from './suscribir.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'solo POST' });

  const clave = process.env.AVISOS_CLAVE;
  const dada = req.headers['x-clave'] || req.body?.clave;
  if (!clave || dada !== clave) return res.status(401).json({ error: 'sin clave' });

  const { VAPID_PUBLICA, VAPID_PRIVADA, VAPID_CONTACTO } = process.env;
  if (!VAPID_PUBLICA || !VAPID_PRIVADA) {
    return res.status(500).json({ error: 'faltan las claves de firma' });
  }
  webpush.setVapidDetails(VAPID_CONTACTO || 'mailto:pentxa@gmail.com',
                          VAPID_PUBLICA, VAPID_PRIVADA);

  const titulo = String(req.body?.titulo || 'Aitor Meteo').slice(0, 90);
  const cuerpo = String(req.body?.cuerpo || '').slice(0, 350);
  const tag = String(req.body?.tag || 'meteo').slice(0, 40);
  const importante = !!req.body?.importante;

  const todos = await leer();

  /* `soloA` limita el envío a UN aparato. Existe por la comprobación
     automática que corre en cada publicación: sin esto, cada deploy le
     haría sonar el móvil de verdad, y a la tercera vez dejaría de
     mirarlos. Con esto la prueba se manda a un aparato de mentira y él
     no se entera. */
  const soloA = req.body?.soloA;
  const aparatos = soloA ? todos.filter(a => a.endpoint === soloA) : todos;

  if (!aparatos.length) {
    return res.status(200).json({ ok: true, enviados: 0,
      nota: soloA ? 'ese aparato no está apuntado' : 'ningún móvil apuntado' });
  }

  const carga = JSON.stringify({ titulo, cuerpo, tag, importante,
                                 enviado: new Date().toISOString(),
                                 /* A DÓNDE LLEVA EL AVISO. Suyo, 01-09-2026:
                                    «¿y dónde me lleva de la app? no tiene
                                    sentido». Quien manda el aviso dice dónde
                                    hay que mirar; por defecto, la portada. */
                                 url: req.body?.url || './' });

  const muertos = [];
  const resultados = await Promise.all(aparatos.map(async a => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: a.keys }, carga, { TTL: 3600 });
      return { apodo: a.apodo, ok: true };
    } catch (e) {
      const cod = e?.statusCode;
      if (cod === 404 || cod === 410) muertos.push(a.endpoint);
      return { apodo: a.apodo, ok: false, cod, motivo: String(e?.body || e?.message || e).slice(0, 200) };
    }
  }));

  /* Se guarda a partir de TODOS, no del subconjunto: con `soloA` la
     lista filtrada tiene un solo aparato, y guardar eso borraría los
     demás. Es el fallo clásico de mezclar filtro y guardado. */
  /* ── LIMPIAR LA LISTA NUNCA PUEDE TUMBAR EL AVISO ──────────────────
     Cazado el 01-09-2026 en el log de Vercel: con el almacén suspendido,
     este `guardar()` lanzaba `BlobStoreSuspendedError` y **el envío
     entero devolvía 500** — aunque los avisos ya hubieran salido. Un
     aparato de baja tumbaba el aviso a todos, y por una tarea de
     limpieza que no corre prisa.

     El aviso es lo primero: si no se puede limpiar, se dice y se sigue. */
  let limpiado = null;
  if (muertos.length) {
    try { await guardar(todos.filter(a => !muertos.includes(a.endpoint))); limpiado = true; }
    catch (e) { limpiado = 'no se pudo: ' + String(e?.message || e).slice(0, 80); }
  }

  const bien = resultados.filter(r => r.ok).length;
  return res.status(200).json({ ok: bien > 0, enviados: bien, deBaja: muertos.length,
                                limpiado, resultados });
}
