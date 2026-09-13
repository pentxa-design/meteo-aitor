/* ═══════════════════════════════════════════════════════════════════
   EL MARCADOR: cuánto se equivoca cada modelo EN SUS ESTACIONES

   Aitor, 28-08-2026, después de una mañana entera de arreglos:
   *«lo dicho, la prio es mejorar la fiabilidad de la app, con datos de
   los modelos etc. y de lo que estamos aprendiendo»*.

   ── POR QUÉ HACE FALTA ──────────────────────────────────────────────

   En dos noches seguidas hemos visto lo mismo y no hemos podido hacer
   nada con ello, porque **dos casos no son una regla**:

     · 27-08, madrugada, MATXITXAKO: el aparato midió **71,3** y el
       pronóstico daba 47,2 de máxima. AROME fue el único que se acercó
       (63,7).
     · 28-08, 05:00, BILBAO AEROPUERTO: el aparato midió **28** e **ICON
       dio 6,8** — cuatro veces menos, y ICON es el modelo que sale por
       defecto. AROME dio 35,6, el más cercano por arriba.

   La app ya enseña ese contraste, pero **se lo lleva el viento**: cada
   vez que se refresca la pantalla, el caso anterior desaparece. Nadie
   lleva la cuenta, así que a la semana siguiente se vuelve a decidir por
   corazonadas y por los dos casos que uno recuerde.

   Esto lleva la cuenta. Cada vez que él abre la app y la pantalla de
   estaciones compara los siete modelos contra un anemómetro, esa
   comparación **se apunta aquí**. En dos semanas hay un marcador de
   verdad, con sus estaciones y sus horas.

   ── LO QUE NO HACE, Y ES A PROPÓSITO ────────────────────────────────

   **No cambia nada.** No toca el modelo por defecto, no mueve umbrales,
   no manda avisos. Es el cuaderno, no el criterio — igual que
   `calibrar.mjs` con los rayos. La regla de esta casa desde que se
   inventó un listón sin medirlo: primero se junta, luego se decide.

   **Y no promedia entre estaciones.** Ya está medido en este proyecto
   que el error CAMBIA DE SIGNO en ocho kilómetros: en el cabo de
   Matxitxako los modelos se quedaban 22 cortos y en el valle de Forua se
   pasaban 20. Un promedio de las dos da cero y diría que los modelos
   aciertan. Así que el marcador es **por estación**, siempre.

   ── LO QUE SÍ MIDE ──────────────────────────────────────────────────

   Por cada estación y cada modelo:
     · **n** — cuántas comparaciones hay. Con menos de 5 no se dice nada.
     · **sesgo** — la media CON SIGNO: negativo si el modelo se queda
       corto. Es lo que de verdad importa, porque quedarse corto es lo
       que le manda a alguien a una torre con más viento del que creía.
     · **error** — la media del error a secas, sin signo.
     · **peor** — la vez que más se quedó corto, con su hora.
     · **cortas** — cuántas veces se quedó corto por 15 km/h o más.

   ── CÓMO SE USA ─────────────────────────────────────────────────────

   POST /api/marcador  { muestras: [ {estacion, altitud, hora, medido,
                                      modelos: {ECMWF: 31, ICON: 6.8…}} ] }
        `hora` es la hora LOCAL del dato medido, en texto «AAAA-MM-DDTHH».
        Una muestra por estación y hora: la misma dos veces no cuenta dos.

   GET  /api/marcador   devuelve el marcador por estación.
        Sin clave: son cifras de modelos contra estaciones públicas, no
        hay nada suyo aquí dentro.
   ═══════════════════════════════════════════════════════════════════ */

import { put } from '../lib/blob-falso.mjs';
import { leerJSON } from '../lib/almacen.mjs';

const LIBRO = 'marcador-modelos.json';

/** Cuántas muestras hacen falta antes de decir nada de un modelo. */
const MINIMO = 5;

/** Se queda «corto de verdad» a partir de aquí. Es la mitad de su margen
    de precaución de racha (45), no un número elegido a ojo. */
const CORTO = 15;

/** Tope de muestras guardadas. Con una cada cuarto de hora y seis
    estaciones, 20.000 son más de tres meses. Se tiran las más viejas. */
const TOPE = 20000;

/** Más allá de esto, la medida y el pronóstico ya no hablan de lo mismo.
    AEMET llegó a retrasarse 3 h el 28-08; por encima no se apunta. */
const RETRASO_MAX_MIN = 150;

/* «No pude leer» ≠ «no hay muestras»: con el almacén suspendido esto
   contestaba 200 con cero muestras, como si nunca se hubiera anotado
   nada. Por la única puerta (lib/almacen.mjs), que lanza. */
async function leerLibro() {
  const { dato } = await leerJSON(LIBRO, { muestras: [] });
  return Array.isArray(dato?.muestras) ? dato : { muestras: [] };
}

const guardarLibro = d => put(LIBRO, JSON.stringify(d),
  { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });

/** Una muestra por estación y hora. Y la RED entra en la clave.

    Encontrado el 28-08-2026 al mirar el cuaderno con Euskalmet ya
    encendido: aparecía **MATXITXAKO a 93 m**, y esa es la de AEMET. La de
    Euskalmet, con el mismo nombre, está a **433 m** — 340 metros más
    arriba y en otro sitio del cabo.

    Identificar por el nombre las estaba metiendo en el mismo saco, que es
    exactamente el fallo que este proyecto lleva persiguiendo todo el día:
    comparar dos sitios distintos creyendo que son uno. Con eso, en una
    semana el marcador habría dicho cualquier cosa de ese punto.

    Con la red delante son dos: `AEMET|MATXITXAKO` y `Euskalmet|MATXITXAKO`. */
/* AQUÍ el «AEMET» por defecto SE QUEDA, y es a propósito: las muestras
   guardadas antes de que existiera Euskalmet no llevan red, y quitarlo
   las dejaría huérfanas. Lo dice una prueba que ya saltó al intentarlo.

   El fallo del 29-08-2026 —Almike partida en dos, 7 muestras como
   Euskalmet y 2 como AEMET **cuando AEMET no tiene estación ahí**— no
   estaba aquí: estaba en el cliente, que mandaba la red sin saberla.
   Arreglado allí (`medidasDeTodos`, `apuntarEnElMarcador`): ahora manda
   «sin red» en vez de suponer. */
const clave = (red, estacion, hora, magnitud) =>
  `${String(red || 'AEMET').trim()}|${String(estacion).trim().toUpperCase()}|${hora}`
  + (magnitud && magnitud !== 'racha' ? `|${magnitud}` : '');

/* ── LA LLUVIA, DESDE EL 29-08-2026 ───────────────────────────────────
   Hasta hoy este cuaderno solo puntuaba RACHAS. Y yo llevaba días
   diciéndole «AROME es el que mejor acierta» sin aclarar que eso está
   medido **solo en viento**. En lluvia no tenía ni una medida.

   No se puntúa igual, y es importante: **casi todas las horas no llueve**.
   Si se cuenta el error de las 24 h del día, un modelo que diga «cero
   siempre» saca un error casi perfecto en un mes seco. Sería un marcador
   que premia al que nunca moja.

   Por eso solo cuenta la hora en que **la estación midió lluvia O algún
   modelo la anunció** (≥ 0,2 mm, que es el escalón real del pluviómetro).
   Ahí es donde se acierta o se falla. Las horas secas en las que todos
   dicen seco no enseñan nada y se tiran. */
/* EL MÍNIMO ES EL MISMO PARA LAS DOS, y a propósito. Al montar esto le
   puse 20 a la racha «porque sí» y el candado saltó: eso habría subido
   el listón de 5 a 20 y borrado de la pantalla el marcador de viento que
   ya tiene ganado. Un número elegido a ojo no entra aquí. Si algún día
   se mide que la lluvia necesita más muestras, se sube CON la medida
   delante y escrita. */
const MAGNITUDES = {
  racha:  { tope: 250, corto: 10, unidad: 'km/h', minimo: MINIMO },
  lluvia: { tope: 120, corto: 1,  unidad: 'mm/h', minimo: MINIMO, umbral: 0.2 },
};
const magOk = m => (m === 'lluvia' ? 'lluvia' : 'racha');

/* ── EL CERO DEL PLUVIÓMETRO NO SIEMPRE ES UN CERO ────────────────────
   Medido el 30-08-2026, con él en la calle contándolo: en Bermeo cayó
   sirimiri real —gotitas a las 12:30, tanda de 14:00 a 15:30— y los
   pluviómetros de Matxitxako (4,6 km), Forua y Almike marcaron **CERO
   todo el episodio**. La humedad de Matxitxako subió del 69 % al 91 %
   justo en esas horas: el agua estaba, el cubilete no la recoge.

   Ya estaba escrito el 25-08: «el sirimiri moja aunque el pluviómetro
   marque cero». Lo que no estaba era la consecuencia para ESTE cuaderno:
   con esa regla a medias, ECMWF —el único que acertó, 0,2-0,4 mm— salía
   PENALIZADO contra un aparato que marcaba 0, y los seis que no vieron
   nada puntuaban perfecto. Un marcador que premia al ciego.

   LA REGLA: un cero del pluviómetro solo vale como cero si el aire
   estaba seco. Con la humedad medida en 90 % o más —lo que marcaban las
   estaciones DURANTE el sirimiri: 90, 91, 91, 93— ese cero no distingue
   «seco» de «sirimiri que no marca», y la hora no enseña nada: NO SE
   GUARDA. Y sin humedad conocida, tampoco: afirmar un cero sin poder
   comprobarlo es el mismo fallo por el otro lado.

   Las horas con agua MEDIDA (≥0,2) se guardan siempre: ahí el aparato
   sí habla. */
const HUMEDAD_CERO_DUDOSO = 90;

/** Que la hora venga escrita como «2026-08-28T05», y no se adivine.
    Ya mordió el UTC cinco veces en este proyecto: suponer la zona y
    acertar «casi siempre» no vale para un cuaderno de medidas. */
const HORA_OK = /^\d{4}-\d{2}-\d{2}T\d{2}$/;

const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(+v))
  ? null : +v;

function limpiar(m) {
  const medido = num(m?.medido);
  const hora = String(m?.hora ?? '');
  const estacion = String(m?.estacion ?? '').trim().slice(0, 40);
  /* Sin magnitud es «racha»: las muestras guardadas antes de que esto
     existiera son todas de viento, y no se quedan huérfanas. Es la misma
     decisión que con la red, y por el mismo motivo. */
  const magnitud = magOk(m?.magnitud);
  const G = MAGNITUDES[magnitud];
  if (!estacion || !HORA_OK.test(hora) || medido === null) return null;
  // Una racha negativa o de 300 km/h no es una medida, es un fallo de la fuente.
  if (medido < 0 || medido > G.tope) return null;
  if (num(m?.haceMinutos) !== null && Math.abs(num(m.haceMinutos)) > RETRASO_MAX_MIN) return null;

  const modelos = {};
  for (const [k, v] of Object.entries(m?.modelos || {})) {
    const x = num(v);
    if (x === null || x < 0 || x > G.tope) continue;   // hueco no es cero
    modelos[String(k).slice(0, 24)] = Math.round(x * 10) / 10;
  }
  if (!Object.keys(modelos).length) return null;

  /* El cero dudoso, ANTES que nada: si el aparato marca seco pero el
     aire estaba saturado —o no sabemos la humedad—, esa hora no juzga a
     ningún modelo. Ver HUMEDAD_CERO_DUDOSO arriba. */
  if (G.umbral !== undefined && medido < G.umbral) {
    const hum = num(m?.humedad);
    if (hum === null || hum >= HUMEDAD_CERO_DUDOSO) return null;
  }

  /* La hora seca en la que NADIE anunció nada no se guarda: no enseña
     nada y llenaría el cuaderno de ceros. Ver MAGNITUDES. */
  if (G.umbral !== undefined
      && medido < G.umbral
      && !Object.values(modelos).some(v => v >= G.umbral)) return null;

  const o = { estacion, hora, magnitud, medido: Math.round(medido * 10) / 10, modelos,
              red: String(m?.red || m?.fuente || 'AEMET').trim().slice(0, 20) };
  const hum2 = num(m?.humedad);
  if (hum2 !== null) o.humedad = Math.round(hum2);   // para poder auditar la regla
  const alt = num(m?.altitud);
  if (alt !== null) o.altitud = Math.round(alt);
  return o;
}

/** El marcador, por estación y modelo. Nunca entre estaciones. */
function contar(muestras) {
  const porEstacion = new Map();

  for (const m of muestras) {
    /* Se agrupa por RED + NOMBRE, no por nombre. Hay dos Matxitxako y
       están a 340 m de diferencia. */
    /* Y por MAGNITUD: mezclar km/h con mm/h en la misma cuenta daría un
       número sin sentido. Una fila por estación y magnitud. */
    const mag = magOk(m.magnitud);
    const id = `${m.red || 'AEMET'} · ${m.estacion} · ${mag}`;
    if (!porEstacion.has(id))
      porEstacion.set(id, { estacion: m.estacion, red: m.red || 'AEMET',
                            magnitud: mag, unidad: MAGNITUDES[mag].unidad,
                            altitud: m.altitud ?? null,
                            n: 0, desde: m.hora, hasta: m.hora, modelos: new Map() });
    const E = porEstacion.get(id);
    E.n++;
    if (m.hora < E.desde) E.desde = m.hora;
    if (m.hora > E.hasta) E.hasta = m.hora;
    if (m.altitud != null) E.altitud = m.altitud;

    for (const [nom, v] of Object.entries(m.modelos)) {
      if (!E.modelos.has(nom))
        E.modelos.set(nom, { modelo: nom, n: 0, suma: 0, sumaAbs: 0,
                             cortas: 0, peor: null, peorHora: null });
      const M = E.modelos.get(nom);
      const d = v - m.medido;            // negativo = el modelo se queda corto
      M.n++;
      M.suma += d;
      M.sumaAbs += Math.abs(d);
      if (d <= -MAGNITUDES[mag].corto) M.cortas++;
      if (M.peor === null || d < M.peor) { M.peor = d; M.peorHora = m.hora; }
    }
  }

  return [...porEstacion.values()]
    .sort((a, b) => (a.magnitud === b.magnitud ? b.n - a.n : a.magnitud === 'racha' ? -1 : 1))
    .map(E => ({
      estacion: E.estacion,
      red: E.red,
      magnitud: E.magnitud,
      unidad: E.unidad,
      altitud: E.altitud,
      muestras: E.n,
      desde: E.desde,
      hasta: E.hasta,
      modelos: [...E.modelos.values()]
        .map(M => ({
          modelo: M.modelo,
          n: M.n,
          /* Con pocas muestras no se dice el número: se dice que faltan.
             Un sesgo sacado de dos tardes es una anécdota con decimales. */
          bastante: M.n >= MAGNITUDES[E.magnitud].minimo,
          sesgo: M.n ? Math.round(M.suma / M.n * 10) / 10 : null,
          error: M.n ? Math.round(M.sumaAbs / M.n * 10) / 10 : null,
          cortas: M.cortas,
          peor: M.peor === null ? null : Math.round(M.peor * 10) / 10,
          peorHora: M.peorHora,
        }))
        /* Se ordena por el ERROR, no por el sesgo: un modelo que un día
           se pasa 20 y otro se queda 20 corto tiene sesgo cero y no
           acierta ninguna de las dos veces. */
        .sort((a, b) => (a.error ?? 999) - (b.error ?? 999)),
    }));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    /* Si no se puede leer, se DICE — no se contesta «cero muestras». */
    let muestras;
    try { ({ muestras } = await leerLibro()); }
    catch (e) {
      return res.status(500).json({ ok: false,
        error: String(e?.message || e).slice(0, 120),
        nota: 'no he podido leer el marcador; esto NO quiere decir que esté vacío' });
    }
    const est = contar(muestras);
    return res.status(200).json({
      ok: true,
      muestras: muestras.length,
      minimoParaFiarse: MINIMO,
      cortoDesde: CORTO,
      /* Cada magnitud con su vara de medir: quedarse 10 km/h corto de
         racha y quedarse 1 mm/h corto de lluvia no son lo mismo. */
      porMagnitud: MAGNITUDES,
      estaciones: est,
      nota: 'Cuaderno, no criterio. No cambia umbrales ni el modelo por defecto. '
          + 'Y no se promedia entre estaciones: el error cambia de signo en 8 km. '
          + 'En LLUVIA solo se cuentan las horas en que llovió o algún modelo dijo que llovería: '
          + 'con las horas secas dentro, el que nunca moja saldría el mejor. '
          + 'Y un cero del pluviómetro con la humedad al 90 % o más NO cuenta: el sirimiri '
          + 'moja sin marcar, y esa hora no juzga a nadie (medido el 30-08 en Matxitxako).',
    });
  }

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'solo GET y POST' });

  /* Reiniciar sí pide clave: borrar el cuaderno es la única acción de
     aquí que se puede lamentar. Apuntar no, que lo hace la propia app
     desde el navegador y no hay nada que proteger en un dato de modelo. */
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body ??= {};

  if (body.reiniciar) {
    if (!process.env.AVISOS_CLAVE || req.headers['x-clave'] !== process.env.AVISOS_CLAVE)
      return res.status(401).json({ error: 'sin permiso' });
    await guardarLibro({ muestras: [] });
    return res.status(200).json({ ok: true, reiniciado: true });
  }

  /* La purga del 30-08-2026: aplicar la regla del cero dudoso a lo YA
     guardado. Las muestras de lluvia de aquella tarde entraron sin
     humedad y con los pluviómetros a cero MIENTRAS caía sirimiri — son
     exactamente lo que la regla nueva ya no deja entrar, y dejarlas
     dentro sesgaría el marcador a favor de los que no lo vieron. Con
     clave, como reiniciar: borrar medido es cosa seria. */
  if (body.purgar === 'lluvia-cero-dudoso') {
    if (!process.env.AVISOS_CLAVE || req.headers['x-clave'] !== process.env.AVISOS_CLAVE)
      return res.status(401).json({ error: 'sin permiso' });
    const libro0 = await leerLibro();
    const antes = libro0.muestras.length;
    libro0.muestras = libro0.muestras.filter(x => {
      if (magOk(x.magnitud) !== 'lluvia') return true;
      if ((num(x.medido) ?? 0) >= (MAGNITUDES.lluvia.umbral ?? 0.2)) return true;
      const h = num(x.humedad);
      return h !== null && h < HUMEDAD_CERO_DUDOSO;
    });
    await guardarLibro(libro0);
    return res.status(200).json({ ok: true, quitadas: antes - libro0.muestras.length,
      quedan: libro0.muestras.length });
  }

  const entran = Array.isArray(body.muestras) ? body.muestras : [];
  if (!entran.length)
    return res.status(200).json({ ok: true, nuevas: 0, nota: 'nada que apuntar' });

  const libro = await leerLibro();
  const vistas = new Set(libro.muestras.map(m => clave(m.red, m.estacion, m.hora, m.magnitud)));

  let nuevas = 0, repetidas = 0, malas = 0;
  for (const cruda of entran.slice(0, 200)) {
    const m = limpiar(cruda);
    if (!m) { malas++; continue; }
    const k = clave(m.red, m.estacion, m.hora, m.magnitud);
    if (vistas.has(k)) { repetidas++; continue; }
    vistas.add(k);
    libro.muestras.push(m);
    nuevas++;
  }

  if (nuevas) {
    // Las más viejas se van. Se ordena por hora, que es texto comparable.
    libro.muestras.sort((a, b) => (a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0));
    if (libro.muestras.length > TOPE)
      libro.muestras = libro.muestras.slice(-TOPE);
    await guardarLibro(libro);
  }

  return res.status(200).json({ ok: true, nuevas, repetidas, malas,
                                total: libro.muestras.length });
}
