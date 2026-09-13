/* ═══════════════════════════════════════════════════════════════════
   Intermediario hacia las cámaras web de Windy
   ───────────────────────────────────────────────────────────────────
   Por qué existe: la API de Windy exige una clave. Si la clave viajara
   dentro de la app, cualquiera que abriera la web podría leerla en el
   código —y hay robots que rastrean webs públicas buscando justo eso—
   y dejarnos sin cupo. Aquí la clave vive en el servidor de Netlify
   como variable de entorno y NUNCA sale al navegador.

   Se pide siempre por cercanía a un punto, porque lo que interesa es
   lo que se ve cerca de la torre, no un listado mundial.

   No inventa nada: si Windy no responde o no hay clave puesta, se
   devuelve el error tal cual para que la app lo diga en pantalla.
   ═══════════════════════════════════════════════════════════════════ */

import { cabeceras } from '../../lib/cabeceras.mjs';

/* ── EL TOPE DE 40 QUE SE COMÍA DONOSTIA (02-09-2026) ──────────────
   Suyo: *«en cámaras me faltan muchas en la app, ni San Sebastián
   tengo»*, con capturas de Windy enseñando ocho cámaras solo en la
   Concha.

   Y lo primero que despistaba: **subir el radio no cambiaba nada**.
   Medido contra la app publicada, desde BI BERMEO:

     radio= 60  →  total 53   ·  devueltas 40
     radio=100  →  total 94   ·  devueltas 40
     radio=150  →  total 178  ·  devueltas 40

   O sea que el radio SÍ hacía efecto —el `total` que devuelve Windy
   subía de 53 a 178— pero la lista se quedaba clavada en 40 siempre.
   El 40 no era de Windy: era **nuestro**, el valor por defecto de
   `limite` de esta misma función, que iba tal cual a `limit=`.

   Y Windy sirve **ordenado por cercanía** (comprobado paginando las
   178: de 7,8 km a 145,4 km, sin un solo salto atrás). Así que las 40
   primeras son SIEMPRE las 40 más cercanas, se pida el radio que se
   pida — y ahí está el porqué de que el radio pareciera no hacer nada.

   Las 40 primeras se acaban a **30,5 km** de Bermeo. Donostia empieza
   en la **posición 46**, a 57,9 km. Nunca llegaba a entrar. Las que él
   nombró una a una están todas ahí detrás:

     46-49  San Sebastián Sur / Oeste / La Concha
     51     Noroeste · Kontxa hondartza · isla de Santa Clara
     52     Paesi Baschi · Plaza Lasala
     55     Teledonosti - Radio Donosti
     56     Miramar Gardens
     58     Pasealeku Berria
     59     Catedral del Buen Pastor

   **Arreglado paginando**, que es lo único que se puede hacer: Windy
   no sirve más de 50 de golpe, así que para traer 150 hay que pedir
   tres veces con `offset`. Ver `POR_PETICION`.                      */

const API = 'https://api.windy.com/webcams/api/v3/webcams';

/* Lo máximo que Windy entrega en UNA petición. Medido el 28-08-2026 en
   Madrid (532 cámaras a 40 km, llegaban 50) y otra vez el 02-09-2026 en
   Bermeo: `limite=50&desde=0` devuelve exactamente 50, y `desde=150` de
   un total de 178 devuelve 28. Para pasar de ahí hay que paginar. */
const POR_PETICION = 50;

/* Cuántas se traen si no se pide otra cosa. Con el radio de 80 km que
   usa la pestaña Cámaras, desde Bermeo hay 72 — o sea que entran todas
   en dos peticiones y sobra sitio. No se pone más alto porque cada
   página son ~72 KB y él abre la app en el monte, con la cobertura
   justa. La respuesta se cachea media hora en el CDN. */
const POR_DEFECTO = 150;

/* Y un tope duro: 5 peticiones a Windy por llamada, ni una más. El
   agujero de `/omtiles` que fundió los 300 créditos de Netlify en tres
   días (24-08-2026) empezó por no tener ningún tope escrito. */
const TOPE = 250;

const num = (v, min, max, porDefecto) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : porDefecto;
};

export default async (request) => {
  const clave = process.env.WINDY_KEY;
  const p = new URL(request.url).searchParams;

  if (!clave) {
    return new Response(JSON.stringify({
      error: true,
      sinClave: true,
      reason: 'Falta la clave de Windy en el servidor',
    }), { status: 503, headers: cab(false) });
  }

  /* ── Y `Number(null)` ES 0, QUE ES UNA LATITUD VÁLIDA (02-09-2026) ──
     Cazado por la prueba nueva de esta misma función. Sin `lat`,
     `p.get('lat')` da `null`, `Number(null)` da **0**, y 0 pasa el
     rango de −90 a 90 tan campante. O sea que una llamada sin
     coordenadas NO daba 400: se iba a buscar cámaras a **0, −2,7**, en
     el Atlántico frente a Ghana, y volvía con un 200 y

         {"total":0,"webcams":[]}

     Comprobado así en la app publicada antes de tocar nada. Un cero de
     cámaras en verde se lee «aquí no hay cámaras», y lo que pasaba de
     verdad es que se estaba mirando a 4.800 km. Es la regla 2 de esta
     app por la puerta de atrás, la misma del `?? 0` de la nieve.

     La coordenada tiene que VENIR, no valer 0 por defecto. */
  const dado = v => v !== null && String(v).trim() !== '';
  const lat = dado(p.get('lat')) ? num(p.get('lat'), -90, 90, null) : null;
  const lon = dado(p.get('lon')) ? num(p.get('lon'), -180, 180, null) : null;
  if (lat === null || lon === null) {
    return new Response(JSON.stringify({ error: true, reason: 'faltan lat y lon' }),
      { status: 400, headers: cab(false) });
  }
  const radio  = num(p.get('radio'), 1, 250, 60);            // km
  const limite = num(p.get('limite'), 1, TOPE, POR_DEFECTO);

  /* Desde cuál empezar. Sigue siendo opcional y por defecto 0; lo usa
     la paginación de aquí dentro, y se deja expuesto porque es lo que
     permitió MEDIR el fallo desde fuera sin tener la clave. */
  const desde = num(p.get('desde'), 0, 500, 0);

  const pagina = (cuantas, salto) => {
    const url = new URL(API);
    url.searchParams.set('nearby', `${lat},${lon},${radio}`);
    url.searchParams.set('limit', String(cuantas));
    if (salto > 0) url.searchParams.set('offset', String(salto));
    url.searchParams.set('include', 'location,images,player,categories');
    url.searchParams.set('lang', 'es');
    return url;
  };

  const webcams = [];
  let total = null;      // lo que Windy dice que hay en ese radio
  let falta = null;      // por qué la lista no está entera, si no lo está
  let salto = desde;

  while (webcams.length < limite) {
    const cuantas = Math.min(POR_PETICION, limite - webcams.length);

    let r, cuerpo;
    try {
      r = await fetch(pagina(cuantas, salto),
        { headers: { 'x-windy-api-key': clave, accept: 'application/json' } });
      cuerpo = await r.text();
    } catch (e) {
      /* La PRIMERA página no se puede salvar: sin nada que enseñar, la
         app tiene que ver un error, no una lista vacía en verde. */
      if (!webcams.length) {
        return new Response(JSON.stringify({ error: true, reason: String(e.message || e) }),
          { status: 502, headers: cab(false) });
      }
      falta = `Windy dejó de responder a media lista (${String(e.message || e)})`;
      break;
    }

    if (!r.ok) {
      if (!webcams.length) return new Response(cuerpo, { status: r.status, headers: cab(false) });
      falta = `Windy respondió ${r.status} a media lista`;
      break;
    }

    let d;
    try { d = JSON.parse(cuerpo); } catch {
      if (!webcams.length) {
        return new Response(JSON.stringify({ error: true, reason: 'Windy no ha devuelto JSON' }),
          { status: 502, headers: cab(false) });
      }
      falta = 'Windy dejó de devolver JSON a media lista';
      break;
    }

    const lote = Array.isArray(d.webcams) ? d.webcams : [];
    if (Number.isFinite(d.total)) total = d.total;
    webcams.push(...lote);
    salto += lote.length;

    if (lote.length < cuantas) break;                 // ya no quedan más
    if (total !== null && salto >= total) break;      // se han traído todas
  }

  /* Y si se ha llegado al tope teniendo Windy más, se DICE. Un listado
     recortado en silencio es exactamente el fallo que se arregla aquí:
     la app llevaba días diciendo «40 cámaras a menos de 60 km» cuando
     había 53, y eso se lee como que no hay más. */
  if (!falta && total !== null && desde + webcams.length < total) {
    falta = `Windy tiene ${total} y aquí caben ${limite}`;
  }

  const salida = { total, webcams };
  if (falta) { salida.parcial = true; salida.reason = falta; }

  return new Response(JSON.stringify(salida), { status: 200, headers: cab(true) });
};

/* Caché corta: una cámara enseña lo que pasa AHORA. Media hora de
   listado cacheado es aceptable (la lista de cámaras cambia poco), pero
   las imágenes las pide el navegador directamente y esas no se cachean. */
function cab(ok) {
  return cabeceras(ok ? 1800 : 0, { navegador: 300, revalidar: 3600, origen: 'windy-webcams' });
}

export const config = { path: '/webcams' };
