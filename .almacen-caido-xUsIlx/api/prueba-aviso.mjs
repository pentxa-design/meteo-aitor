/* ═══════════════════════════════════════════════════════════════════
   EL AVISO DE PRUEBA
   ───────────────────────────────────────────────────────────────────
   Para que compruebe HOY que le suena el móvil, y no el día que haya
   tormenta. Un aviso que nadie ha probado no es un aviso: es una
   suposición.

   SOLO PUEDE AVISARSE A SÍ MISMO. Se manda la dirección del propio
   aparato y solo se envía a ESA, y solo si ya estaba apuntada. Sin esto,
   cualquiera que diera con la dirección de la función podría hacerle
   sonar el teléfono de madrugada — y a la tercera vez dejaría de mirar
   los avisos de verdad, que es lo único que no nos podemos permitir.
   ═══════════════════════════════════════════════════════════════════ */

import webpush from 'web-push';
import { leer } from './suscribir.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'solo POST' });

  const endpoint = req.body?.endpoint;
  if (!endpoint) return res.status(400).json({ error: 'falta el aparato' });

  const aparatos = await leer();
  const mio = aparatos.find(a => a.endpoint === endpoint);
  if (!mio) return res.status(404).json({ error: 'este aparato no está apuntado' });

  const { VAPID_PUBLICA, VAPID_PRIVADA, VAPID_CONTACTO } = process.env;
  if (!VAPID_PUBLICA || !VAPID_PRIVADA) return res.status(500).json({ error: 'faltan las claves de firma' });
  webpush.setVapidDetails(VAPID_CONTACTO || 'mailto:pentxa@gmail.com', VAPID_PUBLICA, VAPID_PRIVADA);

  const ahora = new Date().toLocaleTimeString('es-ES',
    { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

  try {
    await webpush.sendNotification({ endpoint: mio.endpoint, keys: mio.keys },
      JSON.stringify({
        titulo: 'Aitor Meteo · prueba 2 de 2',
        cuerpo: `Esta viene del servidor. Si la ves, los avisos funcionan de verdad. Enviada a las ${ahora}.`,
        tag: 'prueba',
        enviado: new Date().toISOString(),
      }), { TTL: 600 });
    return res.status(200).json({ ok: true, enviados: 1 });
  } catch (e) {
    return res.status(200).json({ ok: false, enviados: 0,
      error: `${e?.statusCode || ''} ${String(e?.body || e?.message || e)}`.trim().slice(0, 200) });
  }
}
