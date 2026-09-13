/* ═══════════════════════════════════════════════════════════════════
   Observación real de estaciones de AEMET
   ───────────────────────────────────────────────────────────────────
   Esto NO es previsión: es lo que están midiendo ahora mismo los
   anemómetros de AEMET. Es el contraste de realidad que faltaba en la
   app: el modelo dice una cosa y la estación de al lado dice lo que hay.

   AEMET va en dos pasos: se pide el recurso y devuelve una URL con los
   datos de verdad, que hay que descargar aparte. Y el fichero viene en
   latin-1, no en UTF-8.

   La clave vive como variable de entorno AEMET_KEY, nunca en el código.

   Cada estación reporta a su ritmo: unas cada hora, otras cada varias.
   Por eso SIEMPRE se devuelve la hora de cada medida. Un dato de hace
   cuatro horas no es «lo que hay ahora», y quien lo mire tiene que
   poder distinguirlo.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

/** Cuándo caduca la clave de AEMET.
 *
 *  Su api_key es un JWT con fecha de caducidad dentro (tres meses desde
 *  que se genera). Cuando expire, las estaciones dejarán de responder y
 *  desde fuera parecerá que «AEMET no va». Para que no pase eso a
 *  traición, se mira la fecha y se avisa con un mes de antelación.
 *
 *  Se renueva gratis en:
 *  https://opendata.aemet.es/centrodedescargas/obtencionAPIKey        */
function caducidad(clave) {
  try {
    const p = String(clave).split('.');
    if (p.length !== 3) return null;
    const pad = p[1] + '='.repeat((4 - (p[1].length % 4)) % 4);
    const d = JSON.parse(Buffer.from(pad.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (!d.exp) return null;
    const dias = Math.round((d.exp * 1000 - Date.now()) / 86400000);
    return { fecha: new Date(d.exp * 1000).toISOString().slice(0, 10), dias };
  } catch { return null; }
}

const API = 'https://opendata.aemet.es/opendata/api/observacion/convencional/todas';

const num = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : def;
};

const km = (aLat, aLon, bLat, bLon) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2
          + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export default async (request) => {
  const clave = process.env.AEMET_KEY;
  const p = new URL(request.url).searchParams;
  const lat = num(p.get('lat'), -90, 90, null);
  const lon = num(p.get('lon'), -180, 180, null);
  const radio = num(p.get('radio'), 5, 200, 60);
  const limite = num(p.get('limite'), 1, 20, 6);
  /* Horas de historia que se piden de la estación más cercana. AEMET
     manda en la misma respuesta las últimas 24 h de TODAS las estaciones
     y hasta ahora se tiraban: solo se guardaba la fila más reciente. Con
     esto se puede contestar «¿cuánto llovió de verdad esta mañana?», que
     es lo que hace falta para saber si el modelo acertó. */
  const historia = num(p.get('historia'), 0, 24, 0);

  if (!clave) return json({ error: true, sinClave: true, reason: 'Falta la clave de AEMET' }, 503);
  if (lat === null || lon === null) return json({ error: true, reason: 'faltan lat y lon' }, 400);

  try {
    // Paso 1: AEMET devuelve la dirección donde están los datos
    const r1 = await fetch(`${API}?api_key=${encodeURIComponent(clave)}`);
    const meta = await r1.json();
    if (!r1.ok || meta.estado !== 200 || !meta.datos) {
      const cad = caducidad(clave);
      const caducada = cad && cad.dias < 0;
      return json({
        error: true,
        caducada: caducada || undefined,
        reason: caducada
          ? `La clave de AEMET caducó el ${cad.fecha}. Hay que pedir una nueva en `
            + `opendata.aemet.es/centrodedescargas/obtencionAPIKey`
          : (meta.descripcion || `AEMET respondió ${r1.status}`),
      }, 502);
    }

    // Paso 2: los datos, que vienen en latin-1
    const r2 = await fetch(meta.datos);
    if (!r2.ok) return json({ error: true, reason: `datos de AEMET: ${r2.status}` }, 502);
    const crudo = new TextDecoder('iso-8859-1').decode(await r2.arrayBuffer());
    const todas = JSON.parse(crudo);

    // La más reciente de cada estación, dentro del radio
    const porEstacion = new Map();
    const filasPorEstacion = new Map();
    for (const o of todas) {
      if (typeof o.lat !== 'number' || typeof o.lon !== 'number') continue;
      const d = km(lat, lon, o.lat, o.lon);
      if (d > radio) continue;
      const ya = porEstacion.get(o.idema);
      if (!ya || String(o.fint || '') > String(ya.fint || '')) porEstacion.set(o.idema, { ...o, _km: d });
      if (historia) {
        if (!filasPorEstacion.has(o.idema)) filasPorEstacion.set(o.idema, []);
        filasPorEstacion.get(o.idema).push(o);
      }
    }

    const ahora = Date.now();
    const estaciones = [...porEstacion.values()]
      .sort((a, b) => a._km - b._km)
      .slice(0, limite)
      .map(o => {
        const t = o.fint ? new Date(o.fint) : null;
        const minutos = t ? Math.round((ahora - t.getTime()) / 60000) : null;
        // AEMET publica el viento en m/s
        const kmh = v => (typeof v === 'number' ? Math.round(v * 3.6 * 10) / 10 : null);
        return {
          id: o.idema,
          nombre: o.ubi ?? o.idema,
          km: Math.round(o._km * 10) / 10,
          // Dónde está de verdad. Hace falta para cruzar lo que mide la
          // estación con lo que ve el radar en ese mismo punto.
          lat: o.lat, lon: o.lon,
          altitud: typeof o.alt === 'number' ? o.alt : null,
          viento: kmh(o.vv),
          racha: kmh(o.vmax),
          direccion: typeof o.dv === 'number' ? o.dv : null,
          temperatura: typeof o.ta === 'number' ? o.ta : null,
          humedad: typeof o.hr === 'number' ? o.hr : null,
          lluvia: typeof o.prec === 'number' ? o.prec : null,
          medidoEn: o.fint ?? null,
          haceMinutos: minutos,
          // Hora a hora, si se ha pedido. Se devuelve TAL CUAL lo mide la
          // estación: si un campo no viene, va en null y se dice, que no
          // es lo mismo que un cero.
          historia: historia ? (filasPorEstacion.get(o.idema) || [])
            .sort((a, b) => String(a.fint).localeCompare(String(b.fint)))
            .slice(-historia)
            .map(x => ({
              cuando: x.fint ?? null,
              lluvia: typeof x.prec === 'number' ? x.prec : null,
              temperatura: typeof x.ta === 'number' ? x.ta : null,
              humedad: typeof x.hr === 'number' ? x.hr : null,
              viento: kmh(x.vv),
              racha: kmh(x.vmax),
              visibilidad: typeof x.vis === 'number' ? x.vis : null,
            })) : undefined,
        };
      });

    const cad = caducidad(clave);

    return json({
      medido: true,
      fuente: 'AEMET · observación convencional',
      // Aviso con un mes de antelación, para que no caduque a traición
      claveCaduca: cad && cad.dias <= 30 ? cad : undefined,
      unidades: { viento: 'km/h', temperatura: '°C', lluvia: 'mm' },
      consultado: new Date().toISOString(),
      estaciones,
    }, 200);
  } catch (e) {
    return json({ error: true, reason: String(e.message || e) }, 502);
  }
};

function json(cuerpo, status) {
  const ok = status === 200;
  return new Response(JSON.stringify(cuerpo), {
    status,
    // Las estaciones publican cada hora: no tiene sentido pedirlo más.
    headers: cabeceras(ok ? 600 : 0, { navegador: 300, revalidar: 1800, origen: 'aemet-observacion' }),
  });
}

export const config = { path: '/estaciones' };
