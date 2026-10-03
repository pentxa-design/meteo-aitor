/* ═══════════════════════════════════════════════════════════════════
   LAS REGLAS DEL TIEMPO — UNA SOLA COPIA PARA LAS TRES WEBS
   ───────────────────────────────────────────────────────────────────
   Suyo, 03-10-2026 a las 22:15, con las tres abiertas a la vez en Bermeo:
   la app decía «Lluvia moderada», la agenda «Llovizna intensa» y el Centro
   Operativo «Lluvia», a la misma hora y con los mismos 17,4 mm/h de AROME
   HD. *«estar mal en las 3 apps, eso no puede ser»* · *«raíz: tenéis que
   buscar el porqué hace eso y atajarlo»*.

   EL PORQUÉ: cada web llevaba su copia de las reglas, escrita a mano. La
   agenda lo decía en su cabecera: «si cambia la regla en weather-app, hay
   que cambiarla aquí». Cada arreglo llegaba a una y no a las otras, y nada
   las comparaba entre sí.

   EL ARREGLO: las reglas viven SOLO aquí. La app carga este fichero; el
   Centro Operativo lo lleva dentro de js/weather.js y la agenda en
   lib/reglas-tiempo.mjs, copiados por `sincronizar-reglas.mjs`, letra por
   letra. Si una copia no es idéntica a ésta, NO se publica ninguna de las
   tres (`reglas-iguales.mjs`, en las tres cadenas de revisión).

   Aquí no hay pantalla, ni `S`, ni nada de una web concreta: solo reglas
   que reciben los datos de Open-Meteo (`hourly` con sufijo por modelo) y
   devuelven qué pasa. Cómo se pinta lo decide cada web.

   ⚠ SE EDITA SOLO AQUÍ, en weather-app/reglas-tiempo.js.
   ═══════════════════════════════════════════════════════════════════ */
const ReglasTiempo = (() => {
  const has = v => v !== null && v !== undefined && !Number.isNaN(v);

  /* Sus listones de lluvia (mm/h): 0,2 «llueve poco», 2,0 «llueve bien». */
  const LISTON = Object.freeze({ rainWarn: 0.2, rainNo: 2.0 });
  /* La lluvia es de su DUEÑO (03-10-2026): AROME HD; donde no llega, ECMWF. */
  const DUENO_AGUA = 'meteofrance_arome_france_hd';
  const AGUA_ACUERDO = 1;                   // mm/h: «otro modelo la acompaña» / «poquita agua»
  const RELLENO_AGUA = 'ecmwf_ifs025';      // donde el dueño no llega (más allá de 48 h)
  const CIELO_PRESTADO = 'ecmwf_ifs025';    // de quién sale el código si el dueño no lo publica
  const ECMWF_9KM = 'ecmwf_ifs';
  /* Los que se miran para el agua de «los demás» y para la tormenta. El
     «Automático» (best_match) no: es una mezcla (03-10-2026). */
  const MODELOS_TORMENTA = Object.freeze([
    { om: 'ecmwf_ifs025',                nom: 'ECMWF' },
    { om: 'icon_seamless',               nom: 'ICON' },
    { om: 'gfs_seamless',                nom: 'GFS' },
    { om: 'meteofrance_arome_france_hd', nom: 'AROME HD' },
    { om: ECMWF_9KM,                     nom: 'ECMWF 9 km' },
  ]);
  const NOMBRES = Object.freeze({
    meteofrance_arome_france_hd: 'AROME HD', ecmwf_ifs025: 'ECMWF', icon_seamless: 'ICON',
    gfs_seamless: 'GFS', best_match: 'Automático', ecmwf_ifs: 'ECMWF 9 km',
  });
  const nombreDe = om => NOMBRES[om] || om;

  /* ¿Esa hora de ese modelo moja? Con 0,05 mm o más, sí. Y con el CÓDIGO
     de llovizna (51-57) aunque no marque milímetros: es la regla del
     sirimiri (CLAUDE.md de weather-app, 25-08). */
  function mojaEsaHora(mm, c) {
    const llovizna = has(c) && c >= 51 && c <= 57;
    return { cuenta: (has(mm) && mm >= 0.05) || llovizna, sirimiri: llovizna && (!has(mm) || mm < 0.2) };
  }

  /* ── LA LLUVIA DE UN SITIO EN UNA VENTANA (03-10-2026) ──────────────
     Ventana, cantidad y pico del DUEÑO; «Llueve bien» solo si otro modelo
     da más de AGUA_ACUERDO a la misma hora; el sirimiri del código
     prestado de ECMWF solo con ECMWF ≤ AGUA_ACUERDO («esa poquita agua
     débil es sirimiri en el País Vasco», suyo, 03-10); lo de los demás, en
     `otros`, con nombre, número y horas. Historia completa en el TRASPASO
     §67 de weather-app. */
  function lluviaDeUnSitio(H, k, desde, finVentana, thr = LISTON, duenoOm = DUENO_AGUA, nombreDeModelo = nombreDe) {
    const rw = thr?.rainWarn ?? 0.2, rn = thr?.rainNo ?? 2;
    const nombre = om => (MODELOS_TORMENTA.find(m => m.om === om)?.nom) || nombreDeModelo(om);
    const otrosM = MODELOS_TORMENTA.filter(m => m.om !== duenoOm && m.om !== 'best_match');
    const serieDe = om => H[`precipitation_${om}`];
    const pD = serieDe(duenoOm), pR = serieDe(RELLENO_AGUA);
    const tiempo = i => new Date(H.time[i]).getTime();
    const dentro = i => { const t = tiempo(i); return t >= desde && t <= finVentana; };
    const esLlov = c => has(c) && c >= 51 && c <= 57;

    /* Lo que dice el dueño en la hora i: { mm, om } o null si no hay dato. */
    const delDueno = i => has(pD?.[i]) ? { mm: pD[i], om: duenoOm }
                        : has(pR?.[i]) ? { mm: pR[i], om: RELLENO_AGUA } : null;
    /* ¿Sirimiri en la hora i, y de quién es la llovizna? */
    const sirimiriEn = (i, own) => {
      if (own.mm >= rw) return null;
      const cPropio = H[`weather_code_${own.om}`]?.[i];
      if (esLlov(cPropio)) return nombre(own.om);
      if (own.om !== CIELO_PRESTADO) {
        const c = H[`weather_code_${CIELO_PRESTADO}`]?.[i], mm = serieDe(CIELO_PRESTADO)?.[i];
        if (esLlov(c) && (!has(mm) || mm <= AGUA_ACUERDO)) return nombre(CIELO_PRESTADO);
      }
      return null;
    };

    const horas = [], siri = [], deQuien = new Set(), fuertes = [], acompanan = new Set(), bienSolo = [], poco = [];
    let pico = 0, hPico = null, alguno = false, sirimiriDe = null;
    const otros = new Map();
    /* `veCada` se queda: dice quién ve agua en CADA hora (la tarjeta lo usa
       para nombrar al que ve la de ahora). Es información con nombre, no
       mezcla. */
    const veCada = new Map();
    let seco = Infinity, mojado = 0;
    const totales = new Map();
    for (let i = 0; i < H.time.length; i++) {
      if (!dentro(i)) continue;
      const t = tiempo(i);
      for (const m of MODELOS_TORMENTA) {
        const v = serieDe(m.om)?.[i];
        if (!has(v)) continue;
        totales.set(m.nom, (totales.get(m.nom) || 0) + v);
        if (mojaEsaHora(v, H[`weather_code_${m.om}`]?.[i]).cuenta)
          (veCada.get(m.nom) ?? veCada.set(m.nom, []).get(m.nom)).push(t);
      }
      const own = delDueno(i);
      if (own) {
        alguno = true;
        const s = sirimiriEn(i, own);
        if (own.mm >= 0.05 || s) {
          horas.push(t); deQuien.add(nombre(own.om));
          if (s) { siri.push(t); sirimiriDe = sirimiriDe || s; }
          if (own.mm > pico) { pico = own.mm; hPico = t; }
        }
        if (own.mm >= rn) {
          bienSolo.push(t);
          const con = otrosM.filter(m => m.om !== own.om && (serieDe(m.om)?.[i] ?? 0) > AGUA_ACUERDO);
          if (con.length) { fuertes.push(t); con.forEach(m => acompanan.add(m.nom)); }
        } else if (own.mm >= rw) poco.push(t);
      }
      for (const m of otrosM) {
        if (own && m.om === own.om) continue;
        const v = serieDe(m.om)?.[i];
        if (!has(v)) continue;
        alguno = true;
        if (v < rw) continue;
        const o = otros.get(m.nom) || { nom: m.nom, ini: t, fin: t, pico: 0, hPico: null, n: 0, horas: [] };
        o.fin = t; o.n++; o.horas.push(t); if (v > o.pico) { o.pico = v; o.hPico = t; }
        otros.set(m.nom, o);
      }
    }
    for (const v of totales.values()) { if (v < seco) seco = v; if (v > mojado) mojado = v; }
    const listaOtros = [...otros.values()].sort((a, b) => b.pico - a.pico);
    const dueno = nombre(duenoOm);
    if (!alguno) return { k, llueve: false, sinDato: true, otros: [], dueno };
    if (!horas.length) return { k, llueve: false, otros: listaOtros, dueno, veCada: Object.fromEntries(veCada) };

    /* ¿SIGUE MOJANDO PASADO EL CORTE? «Escampa a las 00:00» era el final de
       la ventana, no el de la lluvia. Se mira hasta 12 h más allá. */
    let sigueHasta = null;
    const ultima = horas[horas.length - 1];
    const iUlt = H.time.findIndex(x => new Date(x).getTime() === ultima);
    if (iUlt >= 0 && iUlt + 1 < H.time.length && !dentro(iUlt + 1) && tiempo(iUlt + 1) > finVentana) {
      for (let i = iUlt + 1; i < H.time.length && tiempo(i) <= finVentana + 12 * 3600e3; i++) {
        const own = delDueno(i);
        if (!own || !(own.mm >= 0.05 || sirimiriEn(i, own))) break;
        sigueHasta = tiempo(i);
      }
    }

    /* LA FRASE LLEVA LAS HORAS DE SU FUERZA: «Llueve bien a las 23:00», no
       «Llueve bien de 18:00 a 23:00» porque de 18 a 20 hubo sirimiri. El
       resto de horas mojadas se dice aparte (`horasAgua`). */
    const fuerte = fuertes.length > 0;
    const horasFuerza = fuerte ? fuertes : bienSolo.length ? bienSolo : poco.length ? poco
      : siri.length === horas.length ? horas : horas.filter(t => !siri.includes(t));
    const ini = new Date(horas[0]), fin = new Date(ultima);
    const tramo = Math.round((fin - ini) / 3600e3) + 1;
    return { k, llueve: true, dueno, ini, fin, pico, hPico: hPico ? new Date(hPico) : null,
             quien: [...deQuien].join(' y '), picoAbarca: true,
             horasAgua: horas.map(t => new Date(t)), nHoras: horas.length, sueltas: tramo > horas.length,
             soloSirimiri: siri.length === horas.length, sirimiriDe, horasSirimiri: siri.map(t => new Date(t)),
             fuerte, horasFuertes: fuertes.map(t => new Date(t)), acompanan: [...acompanan],
             horasFuerza: horasFuerza.map(t => new Date(t)),
             sigueHasta: sigueHasta ? new Date(sigueHasta) : null,
             otros: listaOtros, veCada: Object.fromEntries(veCada),
             discrepan: seco > 0 && seco !== Infinity ? (mojado / Math.max(seco, 0.1)) >= 3 : mojado >= 0.5 };
  }

  /* ── LA PALABRA Y EL DIBUJO DE LA LLUVIA DE UNA HORA ────────────────
     Antes en tres sitios: `comoLlueve`/`iconoDeAgua`/`codigoQueSeVe` en la
     app, `cieloAhora` en el Centro Operativo, y la agenda enseñando el
     código prestado tal cual. El 03-10-2026 a las 22:00 en Bermeo, con
     17,4 mm/h de AROME HD y el código de llovizna de ECMWF: la app «Lluvia
     moderada», la agenda «Llovizna intensa», el Centro Operativo «Lluvia».

     LA REGLA: mandan los milímetros del DUEÑO; el código solo afina lo que
     la cantidad no sabe decir (hielo, nieve, chubasco, tormenta), y la
     llovizna solo decide por debajo del listón. Y la intensidad del dibujo
     es la de AEMET con esos milímetros: débil < 2, moderada 2-15, fuerte
     desde 15 mm/h (antes, con 2 o con 40 mm/h salía «moderada»). */
  const HAY_AGUA = 51;                                // de aquí para arriba, moja
  const AGUA_FUERTE = 15;                             // mm/h: «lluvia fuerte» de AEMET
  const ENGELANTE = new Set([56, 57, 66, 67]);        // si hiela, el hielo dice más que la cantidad
  const esLlovizna = c => has(c) && c >= 51 && c <= 57;
  const isStormCode = c => c === 95 || c === 96 || c === 99;
  const mmRedonda = v => (has(v) ? Number(v.toFixed(1)) : v);

  /* Los textos de los códigos (tabla WMO 4677 de Open-Meteo; el 4, «sol
     velado», es propio de la app). Los mismos en las tres webs. */
  const WMO = Object.freeze({
    0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nuboso', 3:'Cubierto',
    4:'Sol velado',
    45:'Niebla', 48:'Niebla engelante',
    51:'Llovizna débil', 53:'Llovizna moderada', 55:'Llovizna intensa',
    56:'Llovizna engelante débil', 57:'Llovizna engelante intensa',
    61:'Lluvia débil', 63:'Lluvia moderada', 65:'Lluvia fuerte',
    66:'Lluvia engelante débil', 67:'Lluvia engelante fuerte',
    71:'Nieve débil', 73:'Nieve moderada', 75:'Nieve intensa', 77:'Granos de nieve',
    80:'Chubascos débiles', 81:'Chubascos moderados', 82:'Chubascos torrenciales',
    85:'Chubascos de nieve débiles', 86:'Chubascos de nieve fuertes',
    95:'Tormenta', 96:'Tormenta con granizo', 99:'Tormenta fuerte con granizo',
  });
  const wmoText = c => WMO[c] ?? (has(c) ? `Código ${c}` : null);

  /* La palabra de los milímetros sueltos: su escala (bien / poco / sirimiri /
     cuatro gotas). Los listones se comparan con lo que se IMPRIME (un
     decimal); el «no cae nada» tiene que ser de verdad nada (0,04 moja). */
  function palabraLluvia(mm, esSirimiri = false, thr = LISTON) {
    if (!has(mm)) return 'sin dato';
    const v = mmRedonda(mm);
    if (v >= mmRedonda(thr?.rainNo ?? 2))   return 'Llueve bien';
    if (v >= mmRedonda(thr?.rainWarn ?? 0.2)) return 'Llueve poco';
    if (esSirimiri) return 'Sirimiri';
    return mm > 0 ? 'Cuatro gotas' : 'Sin lluvia';
  }

  /* La palabra de una ventana de `lluviaDeUnSitio`, con la regla del
     acuerdo: «Llueve bien» solo si otro modelo acompaña al dueño. */
  function palabraDeLaVentana(L, thr = LISTON) {
    if (L.soloSirimiri) return 'Sirimiri';
    if (L.pico >= (thr?.rainNo ?? 2) && !L.fuerte) return 'Puede llover bien';
    return palabraLluvia(L.pico, false, thr);
  }

  /* ¿Cómo llueve en esta hora? `mm` es del dueño; `codigoPropio`, el código
     del MISMO modelo que da los mm (si lo publica); `codigo`, el del cielo
     (prestado si `codigoAjeno`); `mmDelQuePresta`, los mm del que presta el
     código (número o función, para no buscarlo si no hace falta). */
  function comoLlueve({ mm, codigoPropio, codigo, codigoAjeno, mmDelQuePresta } = {}, thr = LISTON) {
    if (!has(mm)) return { k: 'nd', et: 'sin dato' };
    if (mmRedonda(mm) >= mmRedonda(thr.rainNo))   return { k: 'bien', et: 'Llueve bien' };
    if (mmRedonda(mm) >= mmRedonda(thr.rainWarn)) return { k: 'poco', et: 'Llueve poco' };
    /* Por debajo del listón: sirimiri, o nada. Si el código de llovizna es
       PRESTADO, solo si el que lo presta da poca agua (≤ AGUA_ACUERDO). */
    if (esLlovizna(codigoPropio ?? codigo)) {
      const mmP = !has(codigoPropio) && codigoAjeno
        ? (typeof mmDelQuePresta === 'function' ? mmDelQuePresta() : mmDelQuePresta) : null;
      if (!(has(mmP) && mmP > AGUA_ACUERDO)) return { k: 'sirimiri', et: 'Sirimiri' };
    }
    if (mm > 0) return { k: 'poco', et: 'Cuatro gotas' };
    /* El código de lluvia del MISMO modelo con 0,0 por redondeo: moja algo. */
    if (has(codigoPropio) && codigoPropio >= 61 && codigoPropio < 95) return { k: 'poco', et: 'Cuatro gotas' };
    return { k: 'no', et: 'Sin lluvia' };
  }

  /* El dibujo del agua para la palabra `k`, afinado con el código `c`. */
  function iconoDeAgua(k, c, mm, thr = LISTON) {
    const moja = has(mm) && mm >= (thr?.rainWarn ?? 0.2);
    if (ENGELANTE.has(c)) return k === 'bien' ? 67 : (moja || c >= 66) ? 66 : c;
    if (has(c) && ((c >= 71 && c <= 77) || c === 85 || c === 86)) return c;      // nieve
    const chubasco = has(c) && c >= 80 && c <= 82;
    if (k === 'bien') {
      if (has(mm) && mm >= AGUA_FUERTE) return 65;                              // fuerte, la diga quien la diga
      return chubasco ? 81 : 63;
    }
    if (k === 'sirimiri') return esLlovizna(c) ? c : 51;
    if (moja) return chubasco ? 80 : 61;
    return has(c) && c >= 61 && c <= 65 ? 61 : 51;
  }

  /* El código que se DIBUJA en una hora, si hay agua o tormenta. Si no la
     hay, `agua:false` y `cieloSeco` es el código del cielo sin gotas: el
     cielo seco lo decide cada web (la app lo vota entre modelos). */
  function codigoConAgua({ mm, codigoPropio, codigo, codigoCielo = codigo, codigoAjeno, mmDelQuePresta } = {}, thr = LISTON) {
    const tormenta = [codigoPropio, codigoCielo].find(c => has(c) && c >= 95);
    if (has(tormenta)) return { agua: true, code: tormenta, k: 'tormenta' };
    if (has(mm)) {
      const k = comoLlueve({ mm, codigoPropio, codigo, codigoAjeno, mmDelQuePresta }, thr).k;
      if (k === 'sirimiri' || k === 'poco' || k === 'bien')
        return { agua: true, k, code: iconoDeAgua(k, [codigoPropio, codigoCielo].find(c => has(c) && c >= HAY_AGUA), mm, thr) };
      /* «Sin lluvia»: ni una gota en el dibujo; lo que vea otro modelo va en
         su etiqueta, con su nombre. */
      return { agua: false, k, cieloSeco: has(codigoCielo) && codigoCielo >= HAY_AGUA ? 3 : codigoCielo };
    }
    /* Sin milímetros no hay palabra: manda el código, como siempre. */
    if (has(codigoPropio) && codigoPropio >= HAY_AGUA) return { agua: true, code: codigoPropio, k: 'codigo' };
    if (has(codigoCielo) && codigoCielo >= HAY_AGUA) return { agua: true, code: codigoCielo, k: 'codigo' };
    return { agua: false, k: 'nd', cieloSeco: codigoCielo };
  }

  /* El dibujo de una FRANJA a partir del de cada hora: el agua manda (el
     sirimiri también, aunque sea una hora de ocho); si no hay agua, el
     cielo que más se repite, y en empate el más tapado (el 4, sol velado,
     cuenta entre 1 y 2). Es `codigoFranja` de la app (27-08 y 31-08). */
  const tapado = c => (c === 4 ? 1.5 : c);
  function codigoDeVarias(cs) {
    cs = (cs || []).filter(has);
    if (!cs.length) return undefined;
    const mojan = cs.filter(c => c >= HAY_AGUA);
    if (mojan.length) return mojan.sort((x, y) => y - x)[0];
    const cuenta = new Map();
    for (const c of cs) cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || tapado(b[0]) - tapado(a[0]))[0][0];
  }

  /* ── LOS TRAMOS DE CIELO DE UNA FRANJA O UN DÍA ─────────────────────
     Es `tramosDeCielo` de la app. La agenda llevaba su versión y metía el
     AGUA en un tramo seco: madrugada del domingo 4, Bermeo, 6,4 mm/h a las
     00:00 y la agenda decía «Cubierto · llovizna débil desde las 04:00»
     (03-10-2026). EL AGUA ES INTOCABLE en las dos direcciones: ni se pega a
     un tramo seco, ni absorbe horas secas (Bermeo, 09-09-2026). Como mucho
     `maxSecos` tramos secos; el agua no cuenta para el tope.
     `xs`: [{ c: código que se ve, hora: 0-23, ref: lo que quiera la web }],
     en orden. Devuelve [{ code, b, n, desde, hasta, refs }]. */
  function tramosDeCodigos(xs, maxSecos = 3) {
    const hs = (xs || []).filter(x => has(x.c));
    if (!hs.length) return [];
    const bando = c => (c >= HAY_AGUA ? 3 : c === 4 ? 1 : c <= 1 ? 0 : 2);
    const tr = [];
    for (const x of hs) {
      const b = bando(x.c), u = tr[tr.length - 1];
      if (u && u.b === b) { u.cs.push(x.c); u.hs.push(x); } else tr.push({ b, cs: [x.c], hs: [x] });
    }
    const fundir = () => { for (let k = tr.length - 1; k > 0; k--) if (tr[k].b === tr[k - 1].b) {
      tr[k - 1].cs = tr[k - 1].cs.concat(tr[k].cs); tr[k - 1].hs = tr[k - 1].hs.concat(tr[k].hs); tr.splice(k, 1); } };
    /* Pegar el tramo i al vecino j: se queda el bando de j. */
    const pegar = (i, j) => { const a = Math.min(i, j), b = Math.max(i, j);
      tr[j] = { b: tr[j].b, cs: tr[a].cs.concat(tr[b].cs), hs: tr[a].hs.concat(tr[b].hs) }; tr.splice(i, 1); fundir(); };
    const seco = k => k >= 0 && k < tr.length && tr[k].b !== 3;
    // 1) Una hora suelta entre dos tramos secos del mismo bando es un parpadeo del modelo: fuera
    for (let k = tr.length - 2; k >= 1; k--)
      if (tr[k].cs.length < 2 && seco(k) && seco(k - 1) && tr[k - 1].b === tr[k + 1].b) pegar(k, k - 1);
    // 2) Una hora suelta en un extremo se pega al de al lado, si los dos son secos
    if (tr.length > 1 && tr[0].cs.length < 2 && seco(0) && seco(1)) pegar(0, 1);
    if (tr.length > 1 && tr[tr.length - 1].cs.length < 2 && seco(tr.length - 1) && seco(tr.length - 2)) pegar(tr.length - 1, tr.length - 2);
    // 3) Como mucho `maxSecos` tramos SECOS: el más corto seco con vecino seco (a igual largo, antes el velo) al vecino seco más largo
    while (tr.filter(t => t.b !== 3).length > maxSecos) {
      let i = -1;
      for (let k = 0; k < tr.length; k++) {
        if (!seco(k) || !(seco(k - 1) || seco(k + 1))) continue;
        if (i < 0 || tr[k].cs.length < tr[i].cs.length
            || (tr[k].cs.length === tr[i].cs.length && tr[k].b === 1 && tr[i].b !== 1)) i = k;
      }
      if (i < 0) break;
      const izq = seco(i - 1), der = seco(i + 1);
      const j = izq && der ? (tr[i - 1].cs.length >= tr[i + 1].cs.length ? i - 1 : i + 1) : izq ? i - 1 : i + 1;
      pegar(i, j);
    }
    const gana = cs => { const c = new Map();
      for (const x of cs) c.set(x, (c.get(x) ?? 0) + 1);
      return [...c.entries()].sort((a, b) => b[1] - a[1] || tapado(b[0]) - tapado(a[0]))[0][0]; };
    return tr.map(t => {
      const mojan = t.cs.filter(c => c >= HAY_AGUA);
      return { code: mojan.length ? mojan.sort((a, b) => b - a)[0] : gana(t.cs), b: t.b, n: t.hs.length,
               desde: t.hs[0].hora, hasta: t.hs[t.hs.length - 1].hora, refs: t.hs.map(x => x.ref) };
    });
  }

  return Object.freeze({
    has, LISTON, DUENO_AGUA, AGUA_ACUERDO, RELLENO_AGUA, CIELO_PRESTADO, ECMWF_9KM,
    MODELOS_TORMENTA, NOMBRES, nombreDe, mojaEsaHora, lluviaDeUnSitio,
    HAY_AGUA, AGUA_FUERTE, WMO, wmoText, esLlovizna, isStormCode, mmRedonda,
    palabraLluvia, palabraDeLaVentana, comoLlueve, iconoDeAgua, codigoConAgua, codigoDeVarias, tramosDeCodigos,
  });
})();
