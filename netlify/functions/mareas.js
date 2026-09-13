/* ═══════════════════════════════════════════════════════════════════
   Mareas oficiales de Euskalmet
   ───────────────────────────────────────────────────────────────────
   Por qué existe: la app venía calculando las mareas a partir de
   `sea_level_height_msl` de Open-Meteo, que es un MODELO de nivel del
   mar, no una tabla de mareas. COMPARADO el 23-08-2026 contra Euskalmet
   en Bermeo:

       Euskalmet   pleamar 14:35 · bajamar 20:50
       el modelo   pleamar 14:03 · bajamar 20:12

   Entre 30 y 38 minutos adelantado, siempre. La amplitud sí era buena
   (1,54 m frente a 1,50), pero para salir a la mar media hora es mucho.

   Euskalmet publica los extremos ya calculados en un fichero suelto,
   con el formato `AAAAMMDD:HH:MM:SS:high|low#altura`. Eso es una tabla
   oficial, no una estimación, y es lo que debe enseñarse.

   Se pasa por aquí y no desde el navegador porque euskalmet.euskadi.eus
   no manda cabecera CORS.

   Las alturas son sobre el CERO DEL PUERTO, la misma referencia que usan
   las tablas oficiales y los marineros. No se convierte nada.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

const FUENTE = 'https://www.euskalmet.euskadi.eus/vamet/sea/es/webmet00-latest.html';
const PAGINA = 'https://www.euskalmet.euskadi.eus/la-mar/euskadi/';

const RE = /(\d{8}):(\d{2}):(\d{2}):(\d{2}):(high|low)#(-?\d+(?:[.,]\d+)?)/g;

export default async () => {
  try {
    // MEDIDO el 23-08-2026: cinco llamadas seguidas tardaron 0,1 s / 0,1 s
    // / 0,8 s / 3,8 s y once coma nueve segundos. Euskalmet va a saltos, y
    // cuando se pasa del límite del servidor el usuario recibe un 502 y se
    // queda sin tabla de mareas. Se corta antes y se deja que responda la
    // copia guardada, que para una tabla de tres días es igual de válida.
    const r = await fetch(FUENTE, {
      headers: { 'user-agent': 'AitorMeteo/1.0', accept: 'text/html' },
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return json({ error: true, reason: `Euskalmet respondió ${r.status}` }, 502);

    const txt = await r.text();
    const vistos = new Set();
    const dias = new Map();

    for (const m of txt.matchAll(RE)) {
      const [, comp, hh, mm, , tipo, alt] = m;
      const fecha = `${comp.slice(0, 4)}-${comp.slice(4, 6)}-${comp.slice(6, 8)}`;
      const hora = `${hh}:${mm}`;
      const clave = `${fecha}|${hora}|${tipo}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);

      const altura = Number(String(alt).replace(',', '.'));
      if (!Number.isFinite(altura)) continue;

      if (!dias.has(fecha)) dias.set(fecha, []);
      dias.get(fecha).push({
        hora, altura, tipo,
        etiqueta: tipo === 'high' ? 'Pleamar' : 'Bajamar',
      });
    }

    if (!dias.size) return json({ error: true, reason: 'Euskalmet no ha publicado mareas' }, 502);

    const salida = [...dias.entries()]
      .map(([fecha, eventos]) => ({ fecha, eventos: eventos.sort((a, b) => a.hora.localeCompare(b.hora)) }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return json({
      oficial: true,
      fuente: 'Euskalmet · La mar',
      pagina: PAGINA,
      referencia: 'altura sobre el cero del puerto, publicada por Euskalmet',
      husoHorario: 'hora oficial peninsular',
      consultado: new Date().toISOString(),
      dias: salida,
    }, 200);
  } catch (e) {
    return json({ error: true, reason: String(e.message || e) }, 502);
  }
};

function json(cuerpo, status) {
  const ok = status === 200;
  return new Response(JSON.stringify(cuerpo), {
    status,
    // Las mareas de tres días no cambian en horas: se cachean de sobra.
    // `stale-if-error` es lo importante: si Euskalmet no responde, el CDN
    // sirve la última tabla buena en vez de dejarle sin mareas. Una tabla
    // de hace unas horas sigue siendo la tabla oficial correcta; un 502
    // no le sirve para nada a quien va a salir a la mar.
    //
    // Va SOLO en la respuesta buena: es la copia guardada la que lleva el
    // permiso de servirse cuando la fuente falla; ponerlo también en el
    // 502, como se hacía, no servía de nada. Y hasta el 05-09-2026 iba en
    // una cabecera de Netlify que Vercel ignoraba: no había stale-if-error.
    headers: cabeceras(ok ? 10800 : 0, {
      navegador: 1800, revalidar: 21600, siError: 86400, origen: 'euskalmet',
    }),
  });
}

export const config = { path: '/mareas' };
