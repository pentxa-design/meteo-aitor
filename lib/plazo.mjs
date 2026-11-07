/* CONTESTAR A TIEMPO A QUIEN LLAMA (05-11-2026)
 *
 * cron-job.org espera 30 s como mucho. Algunas pasadas del vigilante en
 * hora en punto tardan más, y cada una le mandaba a Aitor un correo
 * «Cronjob failed · Tiempo de espera agotado» (4-11 a las 18 y 22 GMT,
 * 5-11 a las 05 y 07 GMT) aunque la pasada terminaba igual: el pulso
 * marcaba la última a la hora buena.
 *
 * Así que si el trabajo no ha acabado a los `plazoMs`, se contesta 202
 * («sigue en marcha») y el trabajo sigue por detrás con `waitUntil` de
 * Vercel. Lo que el trabajo escriba después en `res` se descarta, porque
 * la respuesta ya salió. Sin `waitUntil` (fuera de Vercel) no se adelanta
 * nada: mejor un correo de más que cortar una pasada a medias. */

const CONTEXTO = Symbol.for('@vercel/request-context');

export function waitUntilDeVercel() {
  const ctx = globalThis[CONTEXTO]?.get?.();
  return typeof ctx?.waitUntil === 'function' ? p => ctx.waitUntil(p) : null;
}

export async function conPlazo(trabajo, req, res, { plazoMs = 25000, waitUntil = waitUntilDeVercel() } = {}) {
  if (!waitUntil) return trabajo(req, res);
  let fuera = false;
  const callado = new Proxy(res, {
    get(t, p) {
      const v = t[p];
      if (typeof v !== 'function') return v;
      if (['status', 'json', 'send', 'end', 'setHeader', 'writeHead', 'write'].includes(p))
        return (...a) => (fuera ? callado : v.apply(t, a));
      return v.bind(t);
    },
  });
  const hecho = Promise.resolve().then(() => trabajo(req, callado));
  let reloj;
  const tiempo = new Promise(r => { reloj = setTimeout(() => r('plazo'), plazoMs); });
  const quien = await Promise.race([hecho.then(() => 'hecho', () => 'hecho'), tiempo]);
  clearTimeout(reloj);
  if (quien === 'hecho') return hecho;
  if (res.headersSent || res.writableEnded) { waitUntil(hecho.catch(() => {})); return; }
  fuera = true;
  waitUntil(hecho.catch(() => {}));
  res.status(202).json({ sigue: true, plazoMs, nota: 'la pasada sigue en marcha; el pulso dirá cuándo acaba' });
}
