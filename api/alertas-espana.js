/* ═══════════════════════════════════════════════════════════════════
   AVISOS OFICIALES DE TODA ESPAÑA — solo información (17-09-2026)
   ───────────────────────────────────────────────────────────────────
   Suyo, la mañana después de las trombas de Valencia del 16-09 (según
   las estaciones de AEMET: 72 mm en 24 h en el aeropuerto, 51 mm en UNA
   hora en Valencia centro; garajes inundados, riadas):

     «cuando pase algo como lo de ayer en Valencia me gustaría saber»
     «me gusta saber si va a llover un montón en algún punto»
     «es solo info» · «España»

   Fuente: los avisos CAP que emite AEMET, tal como los publica
   Meteoalarm (EUMETNET) en su feed Atom de España. No hace falta clave.
   Nada se interpreta: nivel (amarillo, naranja, rojo), fenómeno, zona y
   horas van tal cual vienen. Los amarillos solo se cuentan; los naranjas
   y rojos se listan. El vigilante lee esto mismo para avisar al móvil
   cuando aparece uno nuevo.

   Un fallo aquí NUNCA puede tumbar nada: la app lo dice y el vigilante
   sigue con lo suyo.
   ═══════════════════════════════════════════════════════════════════ */
import { cabeceras } from '../lib/cabeceras.mjs';

const FEED = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-spain';
const NIVEL = { Yellow: 'amarillo', Orange: 'naranja', Red: 'rojo' };
const FENOMENO = {
  Rain: 'lluvia', Thunderstorm: 'tormentas', Wind: 'viento', Coastalevent: 'fenómenos costeros',
  'High-temperature': 'calor', 'Low-temperature': 'frío', 'Snow-ice': 'nieve o hielo', Snow: 'nieve',
  Fog: 'niebla', 'Forest-fire': 'incendios', Avalanches: 'aludes', Flooding: 'inundaciones',
  Flood: 'inundaciones',
};

const etiqueta = (texto, nombre) => {
  const m = texto.match(new RegExp(`<${nombre}>([^<]*)</${nombre}>`));
  return m ? m[1].trim() : null;
};

/* El feed, a la lista de avisos: uno por zona y fenómeno, con su nivel.
   Sale también en las pruebas, con un feed de mentira. */
export function leerFeed(xml, ahora = Date.now()) {
  const avisos = [];
  const vistos = new Set();
  for (const e of xml.split('<entry>').slice(1)) {
    const titulo = etiqueta(e, 'title') || '';
    const m = titulo.match(/^(Yellow|Orange|Red)\s+(.+?)\s+Warning issued/i);
    if (!m) continue;
    const nivel = NIVEL[m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()];
    if (!nivel) continue;
    const tipo = m[2];
    const zona = etiqueta(e, 'cap:areaDesc');
    const hasta = etiqueta(e, 'cap:expires');
    if (hasta && new Date(hasta).getTime() < ahora) continue;          // ya caducado
    const clave = `${nivel}|${zona}|${tipo}|${etiqueta(e, 'cap:onset')}`;
    if (vistos.has(clave)) continue;                                   // la misma zona repetida
    vistos.add(clave);
    avisos.push({
      id: etiqueta(e, 'cap:identifier'),
      nivel,
      fenomeno: FENOMENO[tipo] || tipo.toLowerCase(),
      zona,
      desde: etiqueta(e, 'cap:onset'),
      hasta,
      severidad: etiqueta(e, 'cap:severity'),
    });
  }
  const orden = { rojo: 0, naranja: 1, amarillo: 2 };
  avisos.sort((a, b) => (orden[a.nivel] - orden[b.nivel]) || String(a.desde).localeCompare(String(b.desde)));
  return {
    fuente: 'AEMET, vía Meteoalarm',
    actualizado: etiqueta(xml.slice(0, 4000), 'updated'),
    rojos: avisos.filter(a => a.nivel === 'rojo'),
    naranjas: avisos.filter(a => a.nivel === 'naranja'),
    amarillos: avisos.filter(a => a.nivel === 'amarillo').length,
    total: avisos.length,
  };
}

export default async () => {
  const ac = new AbortController();
  const reloj = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(FEED, { signal: ac.signal, headers: { 'user-agent': 'AitorMeteo/1 (+pentxa@gmail.com)' } });
    if (!r.ok) return json({ error: true, reason: `Meteoalarm respondió ${r.status}` }, 502);
    const xml = await r.text();
    const d = leerFeed(xml);
    return json({ ...d, consultado: new Date().toISOString() }, 200);
  } catch (e) {
    return json({ error: true, reason: String(e?.message || e).slice(0, 100) }, 502);
  } finally {
    clearTimeout(reloj);
  }
};

function json(cuerpo, status) {
  const ok = status === 200;
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: cabeceras(ok ? 1800 : 0, { navegador: 600, revalidar: 3600, origen: 'meteoalarm' }),
  });
}

export const config = { runtime: 'edge' };
