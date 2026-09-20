/* ═══════════════════════════════════════════════════════════════════
   SUS EMPLAZAMIENTOS, LOS MISMOS EN TODOS SUS APARATOS
   ───────────────────────────────────────────────────────────────────
   Suyo, 26-08-2026 a las 23:39, abriendo la app en el Mac: *«en la app
   web no veo ninguna de mis torres, Arbaiza etc no salen con sus CAPEs»*.

   Y era exactamente lo que tenía que pasar: los emplazamientos vivían en
   el `localStorage` del aparato. Los tenía en el Android y el Mac estaba
   vacío. La app hasta lo decía —«guárdalos con el ♥»— pero hacerlo
   catorce veces en cada aparato es absurdo, y peor: **el día que cambie
   de móvil se queda sin ellos**.

   Aquí se guarda la lista en el mismo almacén privado que los avisos.
   Un solo usuario, una sola lista.

   LA REGLA QUE MANDA AQUÍ: **NUNCA SE PIERDE UN EMPLAZAMIENTO.**
   Cuando dos aparatos no coinciden se JUNTAN las dos listas, no se pisa
   una con otra. Si sobra alguno, lo quita él con el corazón y eso sí se
   respeta — pero un fallo de red o un aparato viejo no le pueden borrar
   una torre. Perder un emplazamiento significa que un día no mira ese
   sitio antes de mandar a alguien.
   ═══════════════════════════════════════════════════════════════════ */

import { leerLista as leerDelAlmacen, guardarJSON } from '../lib/almacen.mjs';

const CAJON = 'avisos/torres.json';

/* La misma clave que usa la app para pares de coordenadas. Tiene que
   coincidir con `key()` de app.js o se duplicarían los sitios. */
const clave = p => `${Number(p.lat).toFixed(3)},${Number(p.lon).toFixed(3)}`;

/* ── NO PUDE LEER ≠ NO HAY NADA ──────────────────────────────────────
   Cazado el 01-09-2026 con el almacén de Vercel suspendido: la lectura
   devolvía `[]` y el GET contestaba **HTTP 200 con la lista vacía**, o
   sea que desde fuera parecía que él no tiene ni un emplazamiento
   guardado. Tiene veinte.

   Un fallo de lectura se LANZA para que el que llama decida: el GET
   contesta 500 (y la app, que ya mira `r.ok`, se queda con la lista del
   aparato). Que no exista el fichero todavía sigue siendo lista vacía de
   verdad. Eso ya no se decide aquí: lo decide la única puerta,
   `lib/almacen.mjs`, igual para las siete funciones.                   */
async function leerLista() {
  return (await leerDelAlmacen(CAJON)).dato;
}

const guardarLista = filas => guardarJSON(CAJON, filas);

/* ── LO QUE ÉL QUITA, QUITADO SE QUEDA (20-09-2026) ──────────────────
   Cazado ese día, y era culpa del portátil: al probar Mis estaciones en
   producción desde un navegador de pruebas con tres sitios inventados,
   la app los sincronizó («juntar») y su lista pasó de 20 a 23. Se
   quitaron con «mandar»… pero cualquier aparato suyo que hubiera
   adoptado la lista de 23 los volvería a colar al arrancar, porque el
   «juntar» une sin preguntar.

   Por eso hay una lista de BORRADOS: cada clave que sale por «mandar»
   (o que llega en `borrados`) queda apuntada, y el «juntar» no la
   readmite. Si él vuelve a guardar ese sitio con el corazón (llega en
   un «mandar»), deja de estar borrado. La regla de arriba sigue en pie:
   un arranque automático no borra nada; solo apunta lo que ÉL quitó. */
const CAJON_BORRADOS = 'avisos/torres-borrados.json';
const esClave = k => typeof k === 'string' && /^-?\d+\.\d{3},-?\d+\.\d{3}$/.test(k);
async function leerBorrados() {
  try {
    const d = (await leerDelAlmacen(CAJON_BORRADOS)).dato;
    return new Set(Array.isArray(d) ? d.filter(esClave) : []);
  } catch { return new Set(); }
}

/* Solo lo que hace falta para pintar un emplazamiento. Nada más: esta
   lista dice dónde trabaja: no se le añaden campos por si acaso. */
/* UN HUECO NO ES UN CERO. Aitor, 28-08-2026, con la pantalla delante:
   *«¿a qué se refiere altitud real de la base de la torre?»* — y en la
   foto, SOLLUBEMENDI con **0 m** y «Diferencia −669 m» en rojo. Sollube
   está a 669 m: ese 0 era un hueco disfrazado.

   La causa está en esta línea, y es de las que no se ven leyendo:
   `+null` es **0**, y `Number.isFinite(0)` es **true**. Así que un campo
   vacío entraba como «cero metros sobre el mar» y de ahí salía a la
   pantalla, al aviso de hielo y al desnivel contra el modelo.

   `num()` exige que el valor SEA algo antes de convertirlo. Null, cadena
   vacía y undefined se quedan fuera, que es lo que son: sin dato. */
const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(+v))
  ? null : +v;

function limpiar(p) {
  const lat = num(p?.lat), lon = num(p?.lon);
  if (lat === null || lon === null) return null;
  const o = { name: String(p.name ?? '').slice(0, 60), lat, lon };
  const elev = num(p.elev), hgt = num(p.hgt);
  if (elev !== null) o.elev = elev;
  if (p.admin1)  o.admin1  = String(p.admin1).slice(0, 60);
  if (p.country) o.country = String(p.country).slice(0, 60);
  if (hgt !== null) o.hgt = hgt;
  if (p.tipo) o.tipo = String(p.tipo).slice(0, 20);
  return o;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try { return res.status(200).json({ torres: await leerLista() }); }
    catch (e) { return res.status(500).json({ error: String(e?.message || e) }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'solo GET o POST' });

  const llegan = Array.isArray(req.body?.torres) ? req.body.torres.map(limpiar).filter(Boolean) : null;
  if (!llegan) return res.status(400).json({ error: 'falta la lista' });

  try {
    /* DOS MODOS, y la diferencia importa:

       · `juntar` (por defecto): se unen las dos listas. Es lo que hace un
         aparato al arrancar, y no puede borrar nada de otro aparato.
       · `mandar`: la lista que llega SUSTITUYE a la guardada. Solo se usa
         cuando él quita un emplazamiento con el corazón — o sea, cuando
         hay una intención suya detrás, no un arranque automático. */
    const sustituir = req.body?.modo === 'mandar';
    const previas = await leerLista();
    const borrados = await leerBorrados();

    let final;
    if (sustituir) {
      final = llegan;
      const quedan = new Set(final.map(clave));
      for (const p of previas) if (!quedan.has(clave(p))) borrados.add(clave(p));
      for (const k of (Array.isArray(req.body?.borrados) ? req.body.borrados : []))
        if (esClave(k) && !quedan.has(k)) borrados.add(k);
      for (const k of quedan) borrados.delete(k);   // lo vuelve a poner él: deja de estar borrado
      await guardarJSON(CAJON_BORRADOS, [...borrados]);
    } else {
      const vistas = new Map(previas.map(p => [clave(p), p]));
      for (const p of llegan) if (!vistas.has(clave(p)) && !borrados.has(clave(p))) vistas.set(clave(p), p);
      final = [...vistas.values()];
    }

    /* Un POST vacío en modo juntar NO borra: es lo que manda un aparato
       nuevo la primera vez, y si vaciara la lista le quitaría las torres
       a todos los demás. */
    if (!sustituir && !llegan.length) {
      return res.status(200).json({ torres: previas, guardadas: previas.length, nota: 'nada que juntar' });
    }

    await guardarLista(final);
    return res.status(200).json({ torres: final, guardadas: final.length,
                                  juntadas: sustituir ? 0 : final.length - previas.length });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
