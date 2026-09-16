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

/* ── UNA DESCARGA PARA TODOS (16-09-2026, 12:40, portátil) ──────────
   MEDIDO en producción, pestaña «Mis estaciones»: la app pedía las
   estaciones sitio a sitio —20 peticiones a la vez— y cada una bajaba
   el fichero entero de AEMET (dos llamadas: la del recurso y la de los
   datos). Cuarenta llamadas en un segundo, y AEMET corta: «Se ha
   alcanzado uno de los límites de uso. Vuelva a intentarlo el próximo
   minuto». Once de veinte sitios volvían con 502 y la cabecera decía
   «no he podido preguntar a AEMET». Con lo que él quiere de esa tabla
   —la medida real al lado del modelo— eso es media tabla sin medida.

   Dos cosas:
   1. `?puntos=lat,lon|lat,lon|…` contesta a varios sitios con UNA
      descarga (el fichero trae todas las estaciones de España; se
      filtra por punto en memoria). La app lo usa para la tabla entera.
   2. Si llegan varias peticiones A LA VEZ al mismo aislado, comparten
      la descarga en curso (una sola llamada a AEMET); en cuanto acaba se
      suelta, para que la siguiente vuelva a preguntar y un 503 de AEMET
      se vea como tal (la prueba de cabeceras lo exige: la fuente caída
      no puede contestar 200). El CDN ya guarda cada respuesta buena
      10 minutos. */
let memo = { promesa: null };
function descargarTodas(clave) {
  if (memo.promesa) return memo.promesa;
  const promesa = (async () => {
    const r1 = await fetch(`${API}?api_key=${encodeURIComponent(clave)}`);
    const meta = await r1.json();
    if (!r1.ok || meta.estado !== 200 || !meta.datos) {
      const e = new Error(meta.descripcion || `AEMET respondió ${r1.status}`);
      e.deAemet = true;
      throw e;
    }
    const r2 = await fetch(meta.datos);
    if (!r2.ok) throw new Error(`datos de AEMET: ${r2.status}`);
    const crudo = new TextDecoder('iso-8859-1').decode(await r2.arrayBuffer());
    return JSON.parse(crudo);
  })();
  memo = { promesa };
  const soltar = () => { if (memo.promesa === promesa) memo = { promesa: null }; };
  promesa.then(soltar, soltar);
  return promesa;
}

function cercanas(todas, lat, lon, radio, limite, historia, ahora) {
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
  return [...porEstacion.values()]
    .sort((a, b) => a._km - b._km)
    .slice(0, limite)
    .map(o => {
      const t = o.fint ? new Date(o.fint) : null;
      const minutos = t ? Math.round((ahora - t.getTime()) / 60000) : null;
      const kmh = v => (typeof v === 'number' ? Math.round(v * 3.6 * 10) / 10 : null);   // AEMET publica el viento en m/s
      return {
        id: o.idema,
        nombre: o.ubi ?? o.idema,
        km: Math.round(o._km * 10) / 10,
        lat: o.lat, lon: o.lon,          // dónde está de verdad: para cruzarla con el radar en ese punto
        altitud: typeof o.alt === 'number' ? o.alt : null,
        viento: kmh(o.vv),
        racha: kmh(o.vmax),
        direccion: typeof o.dv === 'number' ? o.dv : null,
        temperatura: typeof o.ta === 'number' ? o.ta : null,
        humedad: typeof o.hr === 'number' ? o.hr : null,
        lluvia: typeof o.prec === 'number' ? o.prec : null,
        medidoEn: o.fint ?? null,
        haceMinutos: minutos,
        /* Hora a hora, si se ha pedido. TAL CUAL lo mide la estación: un
           campo que no viene va en null, que no es lo mismo que un cero. */
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
}

export default async (request) => {
  const clave = process.env.AEMET_KEY;
  const p = new URL(request.url).searchParams;
  const lat = num(p.get('lat'), -90, 90, null);
  const lon = num(p.get('lon'), -180, 180, null);
  const radio = num(p.get('radio'), 5, 200, 60);
  const limite = num(p.get('limite'), 1, 20, 6);
  /* Varios sitios de una vez: «lat,lon|lat,lon|…» (un tercer valor por
     punto, la cota, se admite y se ignora: es el mismo texto que ya
     manda la app a Euskalmet). Tope 40. */
  const puntos = (p.get('puntos') || '').split('|').filter(Boolean).slice(0, 40).map(s => {
    const [a, b] = s.split(',');
    return { lat: num(a, -90, 90, null), lon: num(b, -180, 180, null) };
  });
  /* Horas de historia que se piden de la estación más cercana. AEMET
     manda en la misma respuesta las últimas 24 h de TODAS las estaciones
     y hasta ahora se tiraban: solo se guardaba la fila más reciente. Con
     esto se puede contestar «¿cuánto llovió de verdad esta mañana?», que
     es lo que hace falta para saber si el modelo acertó. */
  const historia = num(p.get('historia'), 0, 24, 0);

  if (!clave) return json({ error: true, sinClave: true, reason: 'Falta la clave de AEMET' }, 503);
  const porLote = puntos.length > 0;
  if (porLote && puntos.some(q => q.lat === null || q.lon === null)) return json({ error: true, reason: 'puntos mal formados' }, 400);
  if (!porLote && (lat === null || lon === null)) return json({ error: true, reason: 'faltan lat y lon' }, 400);
  try {
    const todas = await descargarTodas(clave);
    const ahora = Date.now();
    const cad = caducidad(clave);
    const comun = {
      medido: true,
      fuente: 'AEMET · observación convencional',
      claveCaduca: cad && cad.dias <= 30 ? cad : undefined,
      unidades: { viento: 'km/h', temperatura: '°C', lluvia: 'mm' },
      consultado: new Date().toISOString(),
    };
    if (porLote) {
      return json({ ...comun, puntos: puntos.map(q => ({ lat: q.lat, lon: q.lon,
        estaciones: cercanas(todas, q.lat, q.lon, radio, limite, historia, ahora) })) }, 200);
    }
    return json({ ...comun, estaciones: cercanas(todas, lat, lon, radio, limite, historia, ahora) }, 200);
  } catch (e) {
    if (e?.deAemet) {
      const cad = caducidad(clave);
      const caducada = cad && cad.dias < 0;
      return json({
        error: true,
        caducada: caducada || undefined,
        reason: caducada
          ? `La clave de AEMET caducó el ${cad.fecha}. Hay que pedir una nueva en `
            + `opendata.aemet.es/centrodedescargas/obtencionAPIKey`
          : String(e.message || e),
      }, 502);
    }
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
