/* ═══════════════════════════════════════════════════════════════════
   EL CALIBRADOR: qué había de verdad cuando cayó un rayo

   Idea de la sesión de comparativas, 27-08-2026, y sale de un caso real
   de ese mismo día. En el punto exacto donde cayó la única descarga —
   junto a Zarautz (43,266 / −2,173)— y en la hora en que cayó, había:

       CAPE 510  ·  tapa 50

   **Por debajo del umbral de 700.** La regla de la app NO habría saltado
   esa hora (sí la siguiente, con 760/51).

   Y AQUÍ ESTÁ LO IMPORTANTE, QUE ES DE MÉTODO: eso NO significa que haya
   que bajar el umbral. Un caso no es una regla. Ese es exactamente el
   error que se cometió dos veces el mismo día — inventarse un listón
   («tope de 9.000 m») comparando dos sitios una tarde.

   Lo que hace falta para mover un umbral es un montón de casos MEDIDOS
   en SU zona. Y eso no lo tiene nadie… salvo que se vaya guardando.

   Así que esto guarda, por cada celda-hora en la que AEMET midió alguna
   descarga cerca de sus emplazamientos, lo que decían los modelos ahí en
   ese momento. En dos semanas hay un histograma de verdad: «de N
   descargas medidas, cuántas estaban por encima de 700 y cuántas por
   debajo». Con eso se decide, o no se decide, pero con sus datos.

   NO DECIDE NADA HOY. No manda avisos, no cambia umbrales, no toca el
   semáforo. Solo apunta. Es el cuaderno, no el criterio.

   ── Cómo se usa ────────────────────────────────────────────────────
   POST /api/calibrar   { descargas: [ {lat, lon, cuando} ] }
        `cuando` es el inicio del marco horario de AEMET, en ISO.
        Contesta cuántas eran nuevas y cuántas ya estaban.

   GET  /api/calibrar   devuelve el recuento y el histograma.
        Sin clave: son datos de modelo, no hay nada personal.
   ═══════════════════════════════════════════════════════════════════ */

import { put } from '../lib/blob-falso.mjs';
import { leerJSON, fallo } from '../lib/almacen.mjs';

const LIBRO = 'avisos/calibrado.json';
const APP = 'https://weather-app-ochre-one-76.vercel.app';

/* Los mismos tres que deciden en la app y en el vigilante. ECMWF y
   AROME HD quedan fuera porque NO publican la tapa: sin tapa no se puede
   aplicar la regla, así que tampoco se puede puntuar. */
const MODELOS = ['best_match', 'icon_eu', 'gfs_seamless'];
const NOMBRE = { best_match: 'Automático', icon_eu: 'ICON', gfs_seamless: 'GFS' };

const CAPE_MIN = 700, TAPA_MAX = 75;   // el umbral que se quiere puntuar

/* ── LA HORA, Y ES LA QUINTA VEZ QUE UTC MUERDE EN ESTE PROYECTO ────
   Los marcos de AEMET vienen en UTC (`2026-08-27T13:00:00Z`), y en
   Bermeo eso son **las 15:00**. Open-Meteo, en cambio, devuelve las horas
   en LOCAL (`timezone=auto`).

   La primera versión de esto cortaba el texto —`cuando.slice(0,13)`— y
   buscaba «T13» en las horas locales del modelo: **dos horas antes de
   que cayera nada**. El CAPE que apuntaba no describía el rayo, describía
   otro momento. Medido el 27-08-2026 con la descarga de Zarautz: por la
   hora buena ICON daba 520, por la mala 290.

   Y encima la hora entra en la clave de la celda, así que la misma
   descarga entraba DOS VECES —una por cada formato— y el dedup no la
   veía. El total decía 2 donde había 1.

   Ahora: se exige zona horaria, se convierte a hora local de Madrid con
   `Intl` —que sabe de veranos e inviernos, cosa que restar 2 no— y esa
   hora local es la que se usa para la clave Y para buscar en el modelo.
   Sin zona **no se acepta**: un cuaderno con horas dudosas no vale para
   calibrar nada, que es justo para lo que existe. */
const LLEVA_ZONA = /([Zz]|[+-]\d{2}:?\d{2})$/;

function horaLocal(cuando) {
  const t = String(cuando || '').trim();
  if (!LLEVA_ZONA.test(t)) return null;          // sin zona no se adivina
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  const p = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(d);
  const g = k => p.find(x => x.type === k)?.value;
  if (!g('year') || !g('hour')) return null;
  /* `Intl` puede devolver «24» para medianoche según el entorno. */
  const h = g('hour') === '24' ? '00' : g('hour');
  return `${g('year')}-${g('month')}-${g('day')}T${h}`;
}

/* UNA MUESTRA POR CELDA-HORA, no por chispa. Dos descargas separadas
   cuatrocientos metros en la misma hora tienen el MISMO CAPE: contarlas
   dos veces solo sirve para que un día tormentoso pese como veinte días
   normales y el histograma mienta. Se redondea a 0,05° (~4 km). */
const celda = (lat, lon, horaL) =>
  `${horaL}|${(Math.round(lat / 0.05) * 0.05).toFixed(2)}|${(Math.round(lon / 0.05) * 0.05).toFixed(2)}`;

/* Por la única puerta (lib/almacen.mjs). Antes esto tenía un `catch`
   que devolvía `{casos: []}` pasara lo que pasara, y el 01-09-2026 con
   el almacén suspendido respondía 200 diciendo «0 casos · SE LE ESCAPAN:
   0» — o sea, *«tu listón de CAPE 700 es perfecto»*— cuando la verdad
   era que no había leído ni un caso. Ahora sube el error. */
async function leerLibro() {
  const { dato } = await leerJSON(LIBRO, { casos: [] });
  return Array.isArray(dato?.casos) ? dato : { casos: [] };
}

const guardarLibro = d => put(LIBRO, JSON.stringify(d),
  { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });

/* Lo que decían los modelos en ese punto y esa hora. Se pide por `/om`,
   que es la regla de esta casa: todo dato que se use pasa por la misma
   cadena que ve él. Ir por fuera no comprobaría nada. */
async function loQueHabia(lat, lon, horaL) {
  const dia = horaL.slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);
  /* `past_days` porque la descarga puede ser de hace horas y la pasada
     del modelo ya haber cambiado de día. Dos días llegan de sobra: el
     marco más viejo del catálogo de AEMET es de hace 24 h. */
  const atras = dia === hoy ? 1 : 2;
  const u = `${APP}/om?api=fc&latitude=${lat}&longitude=${lon}&timezone=auto`
          /* LA ISOCERO ENTRA AQUÍ EL 28-08-2026, y entra ahora aunque no
             sirva todavía. Suyo, esa mañana: *«en otoño caerán granizo,
             lluvia racheada, etc., y eso dificulta el acceso a las
             rurales»*, y antes *«fuerte agua, granizo, me dificulta hasta
             meter mano a los fusibles de los postes»*.

             Hoy la app NO ve el granizo: solo aparece si un modelo pone
             el código 96 o 99, y esos códigos ya fallaron —en Zarautz
             cayó un rayo con los cinco dando código sin tormenta—.

             Lo único físico que hay es que el granizo llega al suelo
             cuando la **isocero está baja**: si está alta se derrite por
             el camino. Eso es física conocida, pero **no está medido en
             sus montes**, y aquí no se publica una regla sin medirla —ya
             pasó con el tope de 9.000 m, tres horas en pantalla hasta que
             una descarga en Zarautz con tope de 5.900 la tumbó—.

             Así que la isocero se GUARDA desde hoy en cada descarga
             medida, sin usarla para nada. Cuando llegue el otoño y
             granice de verdad, habrá números suyos con los que decidir en
             vez de un umbral copiado de un libro. */
          + `&hourly=cape,convective_inhibition,convective_cloud_top,freezing_level_height`
          + `&forecast_days=1`
          + `&past_days=${atras}&cell_selection=land&models=${MODELOS.join(',')}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`om ${r.status}`);
  const H = (await r.json()).hourly;
  if (!H?.time) throw new Error('sin horas');

  /* Se compara TEXTO contra la hora local que devuelve Open-Meteo, y la
     que entra ya viene convertida a local por `horaLocal()`. Nada de
     `getHours()` sobre un Date: el servidor corre en UTC. */
  const i = H.time.findIndex(t => t.slice(0, 13) === horaL);
  if (i < 0) return null;

  const out = {};
  for (const m of MODELOS) {
    const c = H[`cape_${m}`]?.[i], k = H[`convective_inhibition_${m}`]?.[i];
    const tp = H[`convective_cloud_top_${m}`]?.[i];
    const iso = H[`freezing_level_height_${m}`]?.[i];
    out[NOMBRE[m]] = {
      cape: c ?? null, tapa: k ?? null,
      tope: (tp ?? null) !== null && tp > 0 ? Math.round(tp) : null,
      /* Para el granizo del otoño. Se guarda, no se usa: ver arriba. */
      isocero: (iso ?? null) !== null ? Math.round(iso) : null,
      /* `saltaria` solo cuando se SABEN los dos. Si falta la tapa no es
         que no salte: es que no se puede decir, y eso se guarda como
         `null` para que el recuento no lo cuente como un «no». */
      saltaria: (c === null || c === undefined || k === null || k === undefined)
        ? null : (c >= CAPE_MIN && k < TAPA_MAX),
    };
  }
  return out;
}

/* El recuento, que es para lo que existe todo esto. */
function histograma(casos) {
  const r = { total: casos.length, porModelo: {}, cortes: {} };
  for (const nom of Object.values(NOMBRE)) {
    const v = casos.map(c => c.modelos?.[nom]).filter(Boolean);
    const conDato = v.filter(x => x.saltaria !== null);
    r.porModelo[nom] = {
      casos: v.length,
      sinTapa: v.length - conDato.length,
      habriaSaltado: conDato.filter(x => x.saltaria).length,
      seLeEscapan: conDato.filter(x => !x.saltaria).length,
      capeMin: conDato.length ? Math.min(...conDato.map(x => x.cape)) : null,
      capeMediana: mediana(conDato.map(x => x.cape)),
    };
  }
  /* Y lo que de verdad se quiere saber: si el listón estuviera en otro
     sitio, ¿cuántas de las que se escapan se habrían cazado? Se calcula
     con el mejor modelo de cada caso, que es como decide la app (unión). */
  for (const corte of [300, 400, 500, 600, 700, 800, 1000]) {
    r.cortes[corte] = casos.filter(c =>
      Object.values(c.modelos || {}).some(m =>
        m.cape !== null && m.tapa !== null && m.cape >= corte && m.tapa < TAPA_MAX)).length;
  }
  return r;
}

const mediana = a => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    let libro;
    try { libro = await leerLibro(); }
    catch (e) { return fallo(res, e); }   // ← nunca «0 casos» sin haber leído
    return res.status(200).json({
      ok: true,
      queEsEsto: 'Qué decían los modelos donde y cuando AEMET midió una descarga. '
               + 'Sirve para decidir el umbral con datos de su zona, no de un manual. '
               + 'NO decide nada por sí solo.',
      umbralActual: { cape: CAPE_MIN, tapa: TAPA_MAX },
      resumen: histograma(libro.casos || []),
      /* Los últimos, para poder mirarlos a mano. El fichero entero puede
         crecer y no hace falta escupirlo cada vez. */
      ultimos: (libro.casos || []).slice(-25),
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'método' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  /* LIMPIEZA, CON CLAVE. Existe por lo del 27-08-2026: la primera versión
     de esto guardó la MISMA descarga dos veces, una con la hora en UTC y
     otra en local, y la de UTC había leído el CAPE de dos horas antes.
     Dos filas se borran a mano; dentro de dos semanas, no. Va con clave
     porque borrar el cuaderno no puede estar al alcance de cualquiera. */
  if (body.reiniciar === true) {
    if (!process.env.AVISOS_CLAVE || req.headers['x-clave'] !== process.env.AVISOS_CLAVE) {
      return res.status(401).json({ error: 'sin permiso' });
    }
    const antes = (await leerLibro()).casos?.length ?? 0;
    await guardarLibro({ casos: [], tocado: new Date().toISOString(),
                         nota: 'reiniciado el 27-08-2026: horas en dos formatos' });
    return res.status(200).json({ ok: true, borrados: antes });
  }

  const lista = Array.isArray(body.descargas) ? body.descargas : [];
  if (!lista.length) return res.status(200).json({ ok: true, nuevas: 0, nota: 'nada que apuntar' });

  const libro = await leerLibro();
  const yaEstan = new Set((libro.casos || []).map(c => c.celda));

  /* Tope por llamada. Un día de tormenta gorda podría traer cientos de
     descargas y cada una nueva cuesta una consulta a `/om`. Cuarenta
     celdas-hora son de sobra para un día, y lo que se deje fuera se
     recoge en la siguiente vuelta. */
  const TOPE = 40;
  const nuevas = [];
  const vistas = new Set();
  const sinZona = [];
  for (const d of lista) {
    const lat = Number(d?.lat), lon = Number(d?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    /* Sin zona horaria NO se acepta. Podría suponerse una y acertar casi
       siempre, pero «casi siempre» en un cuaderno que existe para
       calibrar un umbral es peor que no tenerlo. */
    const horaL = horaLocal(d?.cuando);
    if (!horaL) { sinZona.push(String(d?.cuando || '').slice(0, 25)); continue; }
    const k = celda(lat, lon, horaL);
    if (yaEstan.has(k) || vistas.has(k)) continue;
    vistas.add(k);
    nuevas.push({ k, lat, lon, horaL, cuando: String(d.cuando) });
    if (nuevas.length >= TOPE) break;
  }

  const apuntados = [];
  const fallos = [];
  for (const n of nuevas) {
    try {
      const modelos = await loQueHabia(n.lat, n.lon, n.horaL);
      if (!modelos) { fallos.push({ celda: n.k, por: 'esa hora no está en el modelo' }); continue; }
      /* Se guardan las DOS horas: la que llegó (UTC, la de AEMET) y la
         local con la que se leyó el modelo. Así, si algún día vuelve a
         haber duda, se ve de dónde salió cada número. */
      apuntados.push({ celda: n.k, cuando: n.cuando, horaLocal: n.horaL,
                       lat: n.lat, lon: n.lon, modelos,
                       apuntado: new Date().toISOString() });
    } catch (e) {
      fallos.push({ celda: n.k, por: String(e?.message || e).slice(0, 80) });
    }
  }

  if (apuntados.length) {
    /* Se relee justo antes de escribir: entre la lectura de arriba y
       ahora ha habido consultas a `/om` que tardan, y otra pasada puede
       haber apuntado algo. Sin esto se pisan. */
    const otra = await leerLibro();
    const tengo = new Set((otra.casos || []).map(c => c.celda));
    const juntos = [...(otra.casos || []), ...apuntados.filter(a => !tengo.has(a.celda))];
    /* Se guardan los últimos 2.000. A razón de unas pocas celdas-hora por
       día de tormenta, son años. */
    await guardarLibro({ casos: juntos.slice(-2000), tocado: new Date().toISOString() });
  }

  return res.status(200).json({ ok: true, nuevas: apuntados.length,
                                yaEstaban: lista.length - nuevas.length - sinZona.length,
                                sinZona: sinZona.length ? sinZona : undefined,
                                fallos: fallos.length ? fallos : undefined });
}
