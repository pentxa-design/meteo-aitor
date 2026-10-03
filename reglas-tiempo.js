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

  /* ═════════════════════════════════════════════════════════════════
     LOS RAYOS MEDIDOS POR AEMET — EL LECTOR, UNO PARA LAS TRES WEBS
     ─────────────────────────────────────────────────────────────────
     Es el `Rayos` de la app desde el 25-08-2026 (CLAUDE.md, «Los rayos, por
     fin medidos»): el catálogo por `/rayos` de la app (aemet.es no manda
     CORS), cada hora una imagen LOCL en Web Mercator, la hora SIGUIENTE a
     la de su nombre, los píxeles pegados juntos en una descarga. Desde el
     03-10-2026 lo usan también el Centro Operativo y la agenda, pidiéndolo a
     la app (`base`), y por orden suya como mucho cada media hora fuera de la
     app: «si hay margen pones media hora y listo» · «así no andamos
     pillados». Solo corre en un navegador (lee píxeles con canvas). */
  const RAYO_ENCIMA = 15;              // km: veto del emplazamiento entero (30/30 estirado al error de la imagen)
  const RAYO_CERCA  = 30;              // km: la tormenta es de la zona
  const RAYO_RADIO  = 60;              // km: caja que se recorta alrededor de un punto
  const RAYO_VIGENTE = 90 * 60e3;      // cuánto sigue vetando una descarga (el mapa va por horas cerradas)
  const clampR = (v, a, b) => Math.max(a, Math.min(b, v));
  const horaCorta = iso => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  function kmEntre(a, b) {
    const R = 6371, r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    const la1 = a.lat * r, la2 = b.lat * r;
    const h = Math.sin(dLat/2)**2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }


  function loQueAunCuenta(filas, ahora = Date.now()) {
    const conAlgo = (filas || []).filter(f => f && f.n);
    const vigentes = conAlgo.filter(f =>
      f.hasta && ahora - new Date(f.hasta).getTime() <= RAYO_VIGENTE);
    if (!vigentes.length) return conAlgo[conAlgo.length - 1] || null;
    if (vigentes.length === 1) return vigentes[0];
    return {
      desde: vigentes[0].desde, hasta: vigentes[vigentes.length - 1].hasta,
      n:      vigentes.reduce((a, f) => a + f.n, 0),
      encima: vigentes.reduce((a, f) => a + f.encima, 0),
      cerca:  vigentes.reduce((a, f) => a + f.cerca, 0),
      pos:    vigentes.reduce((a, f) => a + f.pos, 0),
      masCerca: vigentes.reduce((m, f) =>
        f.masCerca && (!m || f.masCerca.km < m.km) ? f.masCerca : m, null),
    };
  }

  function lectorDeRayos({ base = '' } = {}) {
    const clamp = clampR;
    return {
    cat: null,          // catálogo de AEMET (qué horas hay publicadas)
    catT: 0,            // cuándo se pidió
    marcos: new Map(),  // 'fichero|caja' -> descargas ya leídas

    /** El catálogo, con cinco minutos de memoria. */
    async catalogo() {
      if (this.cat && Date.now() - this.catT < 5 * 60e3) return this.cat;
      const r = await fetch(`${base}/rayos`, { cache: 'no-store' });   // el catálogo del veto, nunca de la caché del navegador
      const d = await r.json().catch(() => null);
      if (!r.ok || !d || d.error) {
        throw new Error(d?.reason || `AEMET no ha dado el catálogo de rayos (${r.status})`);
      }
      this.cat = d; this.catT = Date.now();
      return d;
    },

    /** ¿Península o Canarias? Se decide con los límites que da AEMET. */
    ambito(cat, place) {
      for (const k of ['PB', 'CN']) {
        const b = cat.ambitos?.[k]?.bounds;
        if (b && place.lon >= b.lon0 && place.lon <= b.lon1
              && place.lat >= b.lat0 && place.lat <= b.lat1
              && cat.ambitos[k].marcos?.length) return k;
      }
      return null;
    },

    /** Caja en grados alrededor de uno o varios puntos, con margen en km. */
    caja(puntos, km) {
      const lats = puntos.map(p => p.lat), lons = puntos.map(p => p.lon);
      const dLat = km / 111.32;
      const cos = Math.cos((Math.max(...lats) + Math.min(...lats)) / 2 * Math.PI / 180);
      const dLon = km / (111.32 * Math.max(0.2, cos));
      return {
        lat0: Math.min(...lats) - dLat, lat1: Math.max(...lats) + dLat,
        lon0: Math.min(...lons) - dLon, lon1: Math.max(...lons) + dLon,
      };
    },

    /* ── Leer una hora ───────────────────────────────────────────────────
       Devuelve las descargas de ese mapa que caen dentro de la caja, cada
       una con su posición y su polaridad. Los píxeles pegados se juntan en
       una sola descarga: el símbolo que dibuja AEMET ocupa unos 2x2. */
    async leer(amb, marco, caja, cat) {
      const clave = `${marco.f}|${caja.lat0.toFixed(2)},${caja.lon0.toFixed(2)},`
                  + `${caja.lat1.toFixed(2)},${caja.lon1.toFixed(2)}`;
      if (this.marcos.has(clave)) return this.marcos.get(clave);

      const B = cat.ambitos[amb].bounds;
      const my = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360));
      const y0 = my(B.lat0), y1 = my(B.lat1);

      const r = await fetch(`${base}/rayos?f=${encodeURIComponent(marco.f)}`);
      if (!r.ok) throw new Error(`AEMET no ha dado el mapa de las ${horaCorta(marco.desde)} (${r.status})`);
      const blob = await r.blob();

      // El tamaño real de la imagen se lee de la propia imagen: si AEMET
      // cambia la resolución, esto sigue cuadrando solo.
      const entera = await createImageBitmap(blob);
      const W = entera.width, H = entera.height;
      const aX = lon => (lon - B.lon0) / (B.lon1 - B.lon0) * W;
      const aY = lat => (y1 - my(lat)) / (y1 - y0) * H;

      const sx = clamp(Math.floor(aX(caja.lon0)), 0, W - 1);
      const ex = clamp(Math.ceil(aX(caja.lon1)),  1, W);
      const sy = clamp(Math.floor(aY(caja.lat1)), 0, H - 1);
      const ey = clamp(Math.ceil(aY(caja.lat0)),  1, H);
      const sw = Math.max(1, ex - sx), sh = Math.max(1, ey - sy);

      const trozo = await createImageBitmap(blob, sx, sy, sw, sh);
      entera.close?.();
      const c = document.createElement('canvas');
      c.width = sw; c.height = sh;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(trozo, 0, 0);
      trozo.close?.();
      const px = cx.getImageData(0, 0, sw, sh).data;

      // Manchas pegadas = una descarga. Recorrido plano, sin recursión.
      const visto = new Uint8Array(sw * sh);
      const descargas = [];
      const pila = [];
      for (let i0 = 0; i0 < sw * sh; i0++) {
        if (visto[i0] || px[i0 * 4 + 3] <= 50) continue;
        pila.length = 0; pila.push(i0); visto[i0] = 1;
        let n = 0, sX = 0, sY = 0, rojo = 0, azul = 0;
        while (pila.length) {
          const i = pila.pop();
          const x = i % sw, y = (i - x) / sw;
          n++; sX += x; sY += y;
          // AEMET dibuja las negativas en azul y las positivas en rojo.
          // Se compara canal contra canal en vez de buscar un color exacto,
          // que cambia con la resolución y con el antialias.
          if (px[i * 4] > px[i * 4 + 2]) rojo++; else azul++;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= sw || yy >= sh) continue;
            const j = yy * sw + xx;
            if (!visto[j] && px[j * 4 + 3] > 50) { visto[j] = 1; pila.push(j); }
          }
        }
        const gx = sx + sX / n + 0.5, gy = sy + sY / n + 0.5;
        descargas.push({
          lon: B.lon0 + gx / W * (B.lon1 - B.lon0),
          lat: (2 * Math.atan(Math.exp(y1 - gy / H * (y1 - y0))) - Math.PI / 2) * 180 / Math.PI,
          pos: rojo > azul,
        });
      }

      this.marcos.set(clave, descargas);
      return descargas;
    },

    /* ── Qué ha caído alrededor de un punto ──────────────────────────── */
    async cerca(place, { horas = 6, radio = RAYO_RADIO } = {}) {
      const cat = await this.catalogo();
      const amb = this.ambito(cat, place);
      if (!amb) return { fuera: true, fuente: cat.fuente };

      const todos = cat.ambitos[amb].marcos;
      const marcos = todos.slice(-horas);
      const caja = this.caja([place], radio);

      const filas = [];
      for (const m of marcos) {
        const d = await this.leer(amb, m, caja, cat);
        const conD = d.map(x => ({ ...x, km: kmEntre(place, x) }))
                      .filter(x => x.km <= radio)
                      .sort((a, b) => a.km - b.km);
        filas.push({
          desde: m.desde, hasta: m.hasta,
          n: conD.length,
          encima: conD.filter(x => x.km <= RAYO_ENCIMA).length,
          cerca:  conD.filter(x => x.km <= RAYO_CERCA).length,
          pos:    conD.filter(x => x.pos).length,
          masCerca: conD[0] || null,
        });
      }

      const ultima = loQueAunCuenta(filas);
      return {
        fuente: cat.fuente, licencia: cat.licencia, pagina: cat.pagina,
        radio, filas, ultima,
        /* Cuántas horas se han MIRADO de verdad. Aquí iba el largo del
           catálogo ENTERO de AEMET (24 marcos), y se escribía en pantalla
           como «sin descargas en las últimas 24 h» habiendo leído 6:
           dieciocho horas que nadie había mirado, afirmadas limpias
           (21-09-2026). */
        horasMiradas: marcos.length,
        total: filas.reduce((a, f) => a + f.n, 0),
        // Hasta cuándo llega lo publicado. Con esto se dice el retraso real
        // en pantalla en vez de poner un número inventado.
        hasta: todos[todos.length - 1]?.hasta || null,
      };
    },

    /* ── Por dónde pasó la tormenta ───────────────────────────────────
       La pregunta de Aitor no es «¿qué tiempo hace aquí?», es «¿a cuál de
       mis sitios mando gente?». Y detrás de una noche de rayos vienen las
       averías de suministro: el rayo tumba la red, la compañía no repone y
       hay que subir un grupo electrógeno por la pista.

       Se leen las horas de una sola vez para TODOS los emplazamientos
       guardados, recortando una caja que los cubra a todos: una lectura
       por hora, no una por torre. */
    async sobreTorres(torres, { horas = 12, radio = RAYO_CERCA } = {}) {
      if (!torres?.length) return null;
      const cat = await this.catalogo();
      const amb = this.ambito(cat, torres[0]);
      if (!amb) return null;

      const marcos = cat.ambitos[amb].marcos.slice(-horas);
      const caja = this.caja(torres, radio + 5);
      /* `marcosEncima`: cada hora con descargas a menos de RAYO_ENCIMA de esa
         torre, con su `hasta`. Hace falta para el VETO de cada una en Mis
         estaciones y Avisos, no solo en la ficha abierta (03-10-2026). */
      const porTorre = torres.map(t => ({ t, n: 0, encima: 0, masCerca: null, cuando: null, marcosEncima: [] }));

      for (const m of marcos) {
        const d = await this.leer(amb, m, caja, cat);
        if (!d.length) continue;
        for (const fila of porTorre) {
          for (const x of d) {
            const km = kmEntre(fila.t, x);
            if (km > radio) continue;
            fila.n++;
            if (km <= RAYO_ENCIMA) {
              fila.encima++;
              const ult = fila.marcosEncima[fila.marcosEncima.length - 1];
              if (ult?.hasta === m.hasta) { ult.n++; ult.km = Math.min(ult.km, km); }
              else fila.marcosEncima.push({ desde: m.desde, hasta: m.hasta, n: 1, km });
            }
            if (!fila.masCerca || km < fila.masCerca.km) fila.masCerca = { ...x, km };
            fila.cuando = m;                       // la última hora con descargas
          }
        }
      }

      return {
        desde: marcos[0]?.desde || null,
        hasta: marcos[marcos.length - 1]?.hasta || null,
        radio,
        tocadas: porTorre.filter(f => f.n).sort((a, b) => b.n - a.n),
        total: porTorre.reduce((a, f) => a + f.n, 0),
      };
    },
    };
  }

  /* ── LO MEDIDO, CONTADO IGUAL EN LAS TRES (03-10-2026) ──────────────
     `rayosConCache` lee como mucho cada `cada` (media hora fuera de la app,
     orden suya: «si hay margen pones media hora y listo»), guarda en el
     aparato lo bueno y NUNCA un fallo (un fallo se reintenta a los 2 min y
     se dice como fallo: «no es que no haya caído nada, es que no lo sé»).
     `vetaRayo` y `textoRayos` son la regla y la frase, las mismas en el
     Centro Operativo y en la agenda. */
  const horaRayo = iso => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const kmRayo = v => String(Math.round(v * 10) / 10).replace('.', ',');
  function rayosConCache({ lector, cada = 30 * 60e3, clave = 'rayos-medidos', almacen = null, horas = 3 } = {}) {
    const mem = new Map(), pidiendo = new Map();
    try {
      const g = JSON.parse(almacen?.getItem(clave) || '{}');
      for (const [k, v] of Object.entries(g)) if (v && !v.fallo && Date.now() - v.t < cada) mem.set(k, v);
    } catch { /* sin almacén: solo en memoria */ }
    const guardar = () => {
      try { const g = {}; for (const [k, x] of mem) if (!x.fallo) g[k] = x; almacen?.setItem(clave, JSON.stringify(g)); } catch { /* lleno */ }
    };
    const k = p => `${(+p.lat).toFixed(3)},${(+p.lon).toFixed(3)}`;
    async function leer(p) {
      const c = mem.get(k(p));
      if (c && Date.now() - c.t < (c.fallo ? 2 * 60e3 : cada)) return c;
      if (pidiendo.has(k(p))) return pidiendo.get(k(p));
      const pide = (async () => {
        let v;
        try {
          const r = await lector.cerca(p, { horas });
          const u = r.ultima;
          v = { t: Date.now(), fuera: !!r.fuera, hasta: r.hasta || null, horas: r.horasMiradas ?? horas,
                u: u && u.n ? { n: u.n, encima: u.encima, cerca: u.cerca, hasta: u.hasta, km: u.masCerca?.km ?? null } : null };
        } catch (e) { v = { t: Date.now(), fallo: String(e?.message || e).slice(0, 80) }; }
        mem.set(k(p), v); guardar(); pidiendo.delete(k(p));
        return v;
      })();
      pidiendo.set(k(p), pide);
      return pide;
    }
    return { leer, guardado: p => mem.get(k(p)) || null };
  }
  /** ¿Han caído rayos a menos de RAYO_ENCIMA km en los últimos RAYO_VIGENTE? */
  function vetaRayo(v, ahora = Date.now()) {
    return !!(v?.u && v.u.encima > 0 && ahora - new Date(v.u.hasta).getTime() <= RAYO_VIGENTE);
  }
  /** La frase de lo medido, con su nivel: 'no' (veta), 'warn' (por la zona), 'go', 'nd'. */
  function textoRayos(v, ahora = Date.now()) {
    if (!v) return { nivel: 'nd', texto: 'Leyendo los rayos medidos por AEMET…' };
    if (v.fallo) return { nivel: 'nd', texto: `No he podido leer los rayos de AEMET ahora (${v.fallo}): no es que no haya caído nada, es que no lo sé.` };
    if (v.fuera) return { nivel: 'nd', texto: 'Este sitio queda fuera del mapa de rayos de AEMET.' };
    const m = v.hasta ? Math.round((ahora - new Date(v.hasta)) / 60000) : null;
    const hasta = v.hasta ? ` Lo medido llega hasta las ${horaRayo(v.hasta)} (hace ${m < 120 ? `${m} min` : `${Math.floor(m / 60)} h`}); lo más reciente aún no está publicado.` : '';
    if (vetaRayo(v, ahora)) return { nivel: 'no', veta: true,
      texto: `Han caído rayos encima: ${v.u.encima} descarga${v.u.encima === 1 ? '' : 's'} a menos de ${RAYO_ENCIMA} km`
           + (has(v.u.km) ? `, la más cercana a ${kmRayo(v.u.km)} km` : '') + `, medidas por AEMET hasta las ${horaRayo(v.u.hasta)}.` + hasta };
    if (v.u && v.u.cerca > 0) return { nivel: 'warn',
      texto: `Rayos por la zona: ${v.u.cerca} a menos de ${RAYO_CERCA} km` + (has(v.u.km) ? `, la más cercana a ${kmRayo(v.u.km)} km` : '')
           + `, medidos por AEMET hasta las ${horaRayo(v.u.hasta)}.` + hasta };
    return { nivel: 'go', texto: `Rayos medidos por AEMET: ninguno a menos de ${RAYO_RADIO} km en las últimas ${v.horas ?? 3} h.` + hasta };
  }

  /* ── EL RAYO DE UN MODELO EN UNA HORA: LA REGLA (03-10-2026) ────────
     Código de tormenta (95/96/99) o su PROPIA pareja CAPE ≥ 700 con la tapa
     por debajo de 75 (calibrado sobre 960-2.904 horas reales, CLAUDE.md, «La
     tapa entra en la decisión»), con ECMWF 9 km, ICON y GFS —el Automático
     no: es una mezcla; medido contra AEMET el 03-10, 82 % frente a 73 %—.
     «¿Coinciden los modelos?» llevaba su propia versión sin códigos y con el
     Automático, y decía «ninguno ve tormenta» con ICON dando 95. */
  const CAPE_COMBINACION = 700;
  const TAPA_ROMPE = 75;
  /* Los cinco con nombre (no el Automático). El código de tormenta cuenta de
     cualquiera; la pareja, solo del que publica su propia tapa (ECMWF 25 km y
     AROME HD no la publican: con ellos solo cuenta su código, y AROME tampoco
     publica código). Es lo que ya hacían el parte y las franjas de la app; el
     Centro Operativo y la tabla de «¿Coinciden?» se quedaban sin el código de
     ECMWF 25 km (03-10-2026). */
  const MODELOS_RAYO = Object.freeze([
    { om: ECMWF_9KM, nom: 'ECMWF 9 km', res: '9 km' },
    { om: 'icon_seamless', nom: 'ICON', res: '7-13 km' },
    { om: 'gfs_seamless', nom: 'GFS', res: '13-25 km' },
    { om: 'ecmwf_ifs025', nom: 'ECMWF', res: '25 km' },
    { om: 'meteofrance_arome_france_hd', nom: 'AROME HD', res: '1,3 km' },
  ]);
  /** Los «otros» del agua: los cinco con nombre menos el dueño. */
  const otrosDelAgua = (duenoOm = DUENO_AGUA) => MODELOS_TORMENTA.filter(m => m.om !== duenoOm && m.om !== 'best_match');
  function rayoDelModelo({ cape, cin, code } = {}) {
    const porCodigo = isStormCode(code);
    const porPareja = has(cape) && has(cin) && cape >= CAPE_COMBINACION && cin < TAPA_ROMPE;
    return { salta: porCodigo || porPareja, porCodigo, porPareja };
  }

  return Object.freeze({
    has, LISTON, DUENO_AGUA, AGUA_ACUERDO, RELLENO_AGUA, CIELO_PRESTADO, ECMWF_9KM,
    MODELOS_TORMENTA, NOMBRES, nombreDe, mojaEsaHora, lluviaDeUnSitio,
    HAY_AGUA, AGUA_FUERTE, WMO, wmoText, esLlovizna, isStormCode, mmRedonda,
    palabraLluvia, palabraDeLaVentana, comoLlueve, iconoDeAgua, codigoConAgua, codigoDeVarias, tramosDeCodigos,
    RAYO_ENCIMA, RAYO_CERCA, RAYO_RADIO, RAYO_VIGENTE, kmEntre, loQueAunCuenta, lectorDeRayos,
    rayosConCache, vetaRayo, textoRayos,
    CAPE_COMBINACION, TAPA_ROMPE, MODELOS_RAYO, rayoDelModelo, otrosDelAgua,
  });
})();
