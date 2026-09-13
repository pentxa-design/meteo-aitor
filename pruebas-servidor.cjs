/* ═══════════════════════════════════════════════════════════════════
   PRUEBAS DE LO QUE CORRE EN EL SERVIDOR

   `pruebas.js` solo mira `app.js`. Y el 27-08-2026 se coló un fallo en
   `api/calibrar.mjs` que ninguna prueba podía ver: **la quinta vez que
   UTC muerde en este proyecto**.

   Los marcos de AEMET vienen en UTC (`2026-08-27T13:00:00Z`) y en Bermeo
   eso son las 15:00. El código cortaba el texto y buscaba «T13» en las
   horas LOCALES de Open-Meteo: leyó el CAPE de dos horas antes de que
   cayera el rayo (290 en vez de 520), y además guardó la misma descarga
   dos veces porque la hora entra en la clave.

   Esto saca las funciones del fichero de verdad, igual que `pruebas.js`,
   y las prueba con las horas reales de aquel día.
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

let bien = 0, mal = 0;
const ok = (que, cond, pista) => {
  if (cond) { bien++; console.log(`    ✓ ${que}`); }
  else { mal++; console.log(`    ✗ ${que}${pista ? `  — ${pista}` : ''}`); }
};

const src = fs.readFileSync(path.join(__dirname, 'api', 'calibrar.mjs'), 'utf8');
const sacar = (firma, hasta = '\n}') => {
  const i = src.indexOf(firma);
  if (i < 0) throw new Error(`no encuentro «${firma}» en api/calibrar.mjs`);
  return src.slice(i, src.indexOf(hasta, i) + hasta.length);
};
const sacarConst = n => sacar(`const ${n}`, ';').replace(new RegExp(`^const\\s+${n}\\s*=`), `globalThis.${n} =`);

eval(sacarConst('LLEVA_ZONA'));
eval(sacar('function horaLocal(cuando) {'));
eval(sacarConst('celda'));

console.log('\n  La hora de AEMET viene en UTC y el modelo la da en local');

/* EL CASO REAL: la descarga junto a Zarautz del 27-08-2026. AEMET la
   pone en el marco que empieza a las 13:00Z; en Bermeo son las 15:00. */
ok('13:00Z de agosto son las 15:00 aquí (verano, +2)',
   horaLocal('2026-08-27T13:00:00Z') === '2026-08-27T15',
   horaLocal('2026-08-27T13:00:00Z'));

ok('y en invierno son las 14:00 (+1), que por eso no se resta a mano',
   horaLocal('2026-01-15T13:00:00Z') === '2026-01-15T14',
   horaLocal('2026-01-15T13:00:00Z'));

ok('cruzando la medianoche cambia el DÍA, no solo la hora',
   horaLocal('2026-08-27T23:00:00Z') === '2026-08-28T01',
   horaLocal('2026-08-27T23:00:00Z'));

ok('la medianoche local se dice 00, nunca 24',
   horaLocal('2026-08-27T22:00:00Z') === '2026-08-28T00',
   horaLocal('2026-08-27T22:00:00Z'));

console.log('\n  Sin zona horaria no se acepta');

ok('una hora sin zona se rechaza', horaLocal('2026-08-27T15:00') === null,
   'suponer la zona y acertar «casi siempre» no vale para calibrar un umbral');
ok('vacío, nulo y basura también', horaLocal('') === null
   && horaLocal(null) === null && horaLocal('mañana') === null);
ok('pero un desfase explícito sí vale',
   horaLocal('2026-08-27T15:00:00+02:00') === '2026-08-27T15',
   horaLocal('2026-08-27T15:00:00+02:00'));

console.log('\n  Una muestra por celda-hora, no por chispa');

/* Las dos coordenadas son las dos lecturas que se hicieron de la MISMA
   descarga aquel día. Tienen que dar la misma clave. */
const a = celda(43.266, -2.173, horaLocal('2026-08-27T13:00:00Z'));
const b = celda(43.2672, -2.1732, horaLocal('2026-08-27T13:00:00Z'));
ok('dos chispas de la misma celda y hora son UNA muestra', a === b, `${a} vs ${b}`);

ok('la clave lleva la hora LOCAL, no la de AEMET',
   a.startsWith('2026-08-27T15'), a);

ok('otra hora es otra muestra',
   celda(43.266, -2.173, horaLocal('2026-08-27T14:00:00Z')) !== a);
ok('y a diez kilómetros también',
   celda(43.366, -2.173, horaLocal('2026-08-27T13:00:00Z')) !== a);

console.log(`\n  ${bien} bien, ${mal} mal\n`);
if (mal) {
  console.log('  ✗ NO SE PUBLICA. Con las horas mal, el cuaderno de calibrado no vale.\n');
  process.exit(1);
}

/* ═══════════════════════════════════════════════════════════════════
   EL MARCADOR DE MODELOS

   Suyo, 28-08-2026: «la prio es mejorar la fiabilidad de la app, con
   datos de los modelos y de lo que estamos aprendiendo».

   Y lo que hemos aprendido en dos noches son DOS CASOS, que no son una
   regla: Matxitxako 71,3 medidos contra 47,2 de pronóstico, y Bilbao
   con ICON dando 6,8 contra 28 medidos. Esto los junta.

   Lo que se prueba aquí es que el cuaderno no miente: que una muestra
   repetida no cuenta dos veces, que un hueco no entra como cero, y —la
   importante— que NO se promedia entre estaciones, porque ya está
   medido que el error cambia de signo en ocho kilómetros.
   ═══════════════════════════════════════════════════════════════════ */

const srcM = fs.readFileSync(path.join(__dirname, 'api', 'marcador.mjs'), 'utf8');
const sacarM = (firma, hasta = '\n}') => {
  const i = srcM.indexOf(firma);
  if (i < 0) throw new Error(`no encuentro «${firma}» en api/marcador.mjs`);
  return srcM.slice(i, srcM.indexOf(hasta, i) + hasta.length);
};
const sacarConstM = n => sacarM(`const ${n}`, ';')
  .replace(new RegExp(`^const\\s+${n}\\s*=`), `globalThis.${n} =`);

eval(sacarConstM('MINIMO'));
eval(sacarConstM('CORTO'));
eval(sacarConstM('RETRASO_MAX_MIN'));
eval(sacarConstM('clave'));
/* Los dos de la lluvia, desde el 29-08-2026. El candado extrae cada
   función suelta y sin estos `limpiar()` no arranca — que es justo lo
   que cazó al añadir la segunda magnitud. */
eval(sacarConstM('MAGNITUDES'));
eval(sacarConstM('HUMEDAD_CERO_DUDOSO'));
eval(sacarConstM('magOk'));
eval(sacarConstM('HORA_OK'));
eval(sacarConstM('num'));
eval(sacarM('function limpiar(m) {'));
eval(sacarM('function contar(muestras) {'));

console.log('\n  El marcador: una muestra por estación y hora');

ok('la misma estación y hora dan la misma clave',
   clave('AEMET', 'matxitxako', '2026-08-28T05') === clave('AEMET', ' MATXITXAKO ', '2026-08-28T05'));
ok('otra hora es otra muestra',
   clave('AEMET', 'MATXITXAKO', '2026-08-28T06') !== clave('AEMET', 'MATXITXAKO', '2026-08-28T05'));
ok('y otra estación también',
   clave('AEMET', 'FORUA', '2026-08-28T05') !== clave('AEMET', 'MATXITXAKO', '2026-08-28T05'));

/* ── HAY DOS MATXITXAKO ──────────────────────────────────────────
   Encontrado el 28-08-2026 mirando el cuaderno con Euskalmet ya
   encendido: salía «MATXITXAKO · 93 m», que es la de AEMET. La de
   Euskalmet, con el MISMO NOMBRE, está a 433 m — 340 metros más arriba.

   Identificarlas por el nombre las metía en el mismo saco: el fallo que
   este proyecto lleva persiguiendo todo el día, comparar dos sitios
   distintos creyendo que son uno. */
ok('las dos MATXITXAKO son DOS estaciones, no una',
   clave('Euskalmet', 'MATXITXAKO', '2026-08-28T05')
     !== clave('AEMET', 'MATXITXAKO', '2026-08-28T05'),
   'una está a 93 m y la otra a 433');
ok('sin red se supone AEMET, que es la que había antes de Euskalmet',
   clave(null, 'FORUA', '2026-08-28T05') === clave('AEMET', 'FORUA', '2026-08-28T05'),
   'las muestras viejas no tenían red y no se pueden perder');

console.log('\n  Lo que NO entra en el cuaderno');

const base = { estacion: 'FORUA', hora: '2026-08-28T05', medido: 24.5,
               modelos: { ECMWF: 31, ICON: 6.8 } };

ok('una muestra buena entra', limpiar(base) !== null);
ok('sin hora en el formato exacto NO entra',
   limpiar({ ...base, hora: '2026-08-28 05:00' }) === null,
   'suponer la zona horaria ya mordió cinco veces en este proyecto');
ok('sin medida no entra', limpiar({ ...base, medido: null }) === null);
ok('una racha de 300 km/h no es una medida, es un fallo de la fuente',
   limpiar({ ...base, medido: 300 }) === null);
ok('un modelo sin dato se queda FUERA, no entra como cero',
   Object.keys(limpiar({ ...base, modelos: { ECMWF: 31, ICON: null } }).modelos).length === 1,
   'un hueco valiendo cero le diría que ICON falla cuando lo que pasa es que no publica');
ok('si ningún modelo tiene dato, la muestra no vale',
   limpiar({ ...base, modelos: { ECMWF: null } }) === null);
ok('una medida con tres horas de retraso no se apunta',
   limpiar({ ...base, haceMinutos: 200 }) === null,
   'AEMET llegó a 3 h el 28-08: eso ya no habla de la misma hora');
ok('con retraso normal sí', limpiar({ ...base, haceMinutos: 40 }) !== null);

console.log('\n  El marcador NO promedia entre estaciones');

/* EL CASO MEDIDO: en el cabo los modelos se quedan cortos y en el valle
   se pasan. Promediar los dos da cero y diría que aciertan. */
const dosSitios = [
  { estacion: 'MATXITXAKO', hora: '2026-08-27T02', medido: 71.3, modelos: { ICON: 49 } },
  { estacion: 'FORUA',      hora: '2026-08-27T02', medido: 24.5, modelos: { ICON: 44 } },
];
const marc = contar(dosSitios);
ok('salen DOS estaciones, no una media', marc.length === 2, JSON.stringify(marc.map(e => e.estacion)));
const cabo = marc.find(e => e.estacion === 'MATXITXAKO');
const valle = marc.find(e => e.estacion === 'FORUA');
ok('en el cabo ICON se queda corto (sesgo negativo)',
   cabo.modelos[0].sesgo < 0, String(cabo.modelos[0].sesgo));
ok('y en el valle se pasa (sesgo positivo)',
   valle.modelos[0].sesgo > 0, String(valle.modelos[0].sesgo));
ok('los dos signos se conservan: nadie los suma',
   Math.sign(cabo.modelos[0].sesgo) !== Math.sign(valle.modelos[0].sesgo));

console.log('\n  Con pocos casos no se dice nada');

ok('con una sola muestra el modelo NO se da por bueno ni por malo',
   cabo.modelos[0].bastante === false,
   'un sesgo sacado de dos tardes es una anécdota con decimales');

const seis = Array.from({ length: 6 }, (_, i) => ({
  estacion: 'BILBAO AEROPUERTO', hora: `2026-08-2${8}T0${i}`, medido: 28,
  modelos: { ICON: 6.8, 'AROME HD': 35.6 },
}));
const bil = contar(seis)[0];
ok('con seis ya se puede hablar', bil.modelos.every(m => m.bastante === true));

/* ── LA LLUVIA EN EL MARCADOR (29-08-2026) ────────────────────────────
   Yo llevaba días diciéndole «AROME es el que mejor acierta» y eso estaba
   medido SOLO en racha. Esto puntúa la lluvia, y no como el viento. */
console.log('\n  La lluvia: el que nunca moja no puede ganar');

ok('sin magnitud es racha: las muestras viejas no se quedan huérfanas',
   limpiar({ estacion: 'X', hora: '2026-08-28T05', medido: 40,
             modelos: { ICON: 38 } })?.magnitud === 'racha');

ok('una hora SECA en la que nadie anunció nada NO se guarda',
   limpiar({ estacion: 'X', hora: '2026-08-28T05', magnitud: 'lluvia', medido: 0,
             modelos: { ICON: 0, GFS: 0 } }) === null,
   'con las horas secas dentro, el que diga «cero siempre» sale el mejor');

ok('si llovió de verdad, sí se guarda',
   limpiar({ estacion: 'X', hora: '2026-08-28T05', magnitud: 'lluvia', medido: 3.2,
             modelos: { ICON: 0, GFS: 0 } })?.medido === 3.2,
   'y ese es justo el caso que hay que apuntar: llovió y no lo vieron');

ok('si un modelo la anunció y no cayó CON EL AIRE SECO, se guarda',
   limpiar({ estacion: 'X', hora: '2026-08-28T05', magnitud: 'lluvia', medido: 0,
             humedad: 70, modelos: { ICON: 4.1, GFS: 0 } }) !== null,
   'la falsa alarma juzgable es la del aire seco; ver el cero dudoso');

ok('un 300 mm/h es un fallo de la fuente, no una medida',
   limpiar({ estacion: 'X', hora: '2026-08-28T05', magnitud: 'lluvia', medido: 300,
             modelos: { ICON: 4 } }) === null);

ok('racha y lluvia de la misma estación y hora son DOS muestras',
   clave('AEMET', 'X', '2026-08-28T05', 'racha')
   !== clave('AEMET', 'X', '2026-08-28T05', 'lluvia'));

ok('y la clave de una racha no cambia: lo guardado sigue valiendo',
   clave('AEMET', 'X', '2026-08-28T05', 'racha') === clave('AEMET', 'X', '2026-08-28T05'));

{
  /* Cinco horas de lluvia de verdad. Uno la ve, el otro dice siempre cero. */
  const lluvias = Array.from({ length: 5 }, (_, i) => ({
    estacion: 'FORUA', hora: `2026-08-28T0${i}`, magnitud: 'lluvia', medido: 4,
    modelos: { 'AROME HD': 3.8, 'EL QUE NUNCA MOJA': 0 },
  })).map(limpiar);
  const f = contar(lluvias)[0];
  ok('el marcador de lluvia sale con su unidad', f.magnitud === 'lluvia' && f.unidad === 'mm/h');
  ok('y el que nunca moja queda el último, no el primero',
     f.modelos[0].modelo === 'AROME HD' && f.modelos[1].modelo === 'EL QUE NUNCA MOJA');
  ok('se le cuenta que se queda corto las cinco veces', f.modelos[1].cortas === 5);
  ok('el mínimo de la racha NO se ha movido: sigue en 5',
     MAGNITUDES.racha.minimo === MINIMO && MINIMO === 5);
}

{
  /* Y que no se mezclen: km/h y mm/h en la misma cuenta darían un número
     sin sentido. Misma estación, misma hora, las dos magnitudes. */
  const mezcla = [
    { estacion: 'X', hora: '2026-08-28T05', medido: 40, modelos: { ICON: 38 } },
    { estacion: 'X', hora: '2026-08-28T05', magnitud: 'lluvia', medido: 4, modelos: { ICON: 3 } },
  ].map(limpiar);
  const filas = contar(mezcla);
  ok('una fila por magnitud, nunca las dos en el mismo saco', filas.length === 2);
  ok('y la racha va primero, que es con lo que él decide',
     filas[0].magnitud === 'racha' && filas[1].magnitud === 'lluvia');
}
ok('BILBAO 28-08: ICON se queda 21 corto de media',
   bil.modelos.find(m => m.modelo === 'ICON').sesgo === -21.2,
   String(bil.modelos.find(m => m.modelo === 'ICON').sesgo));
ok('y las seis cuentan como «se quedó corto de verdad»',
   bil.modelos.find(m => m.modelo === 'ICON').cortas === 6);
ok('AROME queda por delante, porque se ordena por ERROR y no por sesgo',
   bil.modelos[0].modelo === 'AROME HD', bil.modelos[0].modelo);
ok('y se guarda la peor vez con su hora',
   bil.modelos.find(m => m.modelo === 'ICON').peorHora === '2026-08-28T00',
   bil.modelos.find(m => m.modelo === 'ICON').peorHora);

/* ═══════════════════════════════════════════════════════════════════
   EL VIGILANTE, AHORA CON AGUA Y RACHA
   ───────────────────────────────────────────────────────────────────
   Suyo, 29-08-2026: «¿y el vigilante no avisa que viene lluvia? sería
   interesante» y «que avise de rachas superiores a 70 km/h también».

   Estas pruebas guardan las dos decisiones que evitan que se vuelva
   ruido, porque las dos se equivocaron primero:

     · el listón del agua NO puede ser 0,1 — medido el mismo día, con
       sol y cielo azul, 0,1 salía 47 veces en 48 h;
     · la primera pasada tiene que ser MUDA, o le suenan los catorce
       sitios de golpe el día que se publique.
   ═══════════════════════════════════════════════════════════════════ */
console.log('\n  El vigilante: agua y racha');

const vig = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
const numVig = n => Number(vig.match(new RegExp('const ' + n + ' = ([0-9.]+);'))[1]);

ok('el agua se avisa desde 0,3 mm/h, no desde 0,1',
   numVig('AGUA_MIN') === 0.3,
   `0,1 salía 47 horas de 48 en un día de sol; está en el comentario`);
ok('y «fuerte» es el mismo 2,0 que usa el semáforo de la app',
   numVig('AGUA_FUERTE') === 2.0);
ok('la racha del viaje es 70 km/h, la suya del 4x4',
   numVig('RACHA_TOPE') === 70);
ok('y NO se ha tocado el listón de la torre, que es otro',
   !/const RACHA_TORRE/.test(vig) && numVig('RACHA_TOPE') !== 60);

ok('se pide la lluvia y la racha en la MISMA consulta, sin llamadas nuevas',
   /hourly=cape,convective_inhibition,precipitation,wind_gusts_10m/.test(vig));

ok('la primera pasada no avisa de agua: se estrena en silencio',
   /const hayAguaGuardada = !!antes\?\.aguaSitios;/.test(vig)
   && /if \(vb && !va && hayAguaGuardada\)/.test(vig));
ok('ni de racha',
   /const hayRachaGuardada = !!antes\?\.rachaSitios;/.test(vig)
   && /if \(rb && !ra && hayRachaGuardada\)/.test(vig));
ok('y se guardan las dos, o la pasada siguiente volvería a estrenar',
   /aguaSitios: Object\.fromEntries/.test(vig) && /rachaSitios: Object\.fromEntries/.test(vig));

ok('el agua no se mezcla con el rayo: lleva su propio aviso',
   /titulo: `🌧 AGUA/.test(vig) && /tag: 'agua'/.test(vig));
ok('y la racha el suyo',
   /titulo: `💨 RACHA/.test(vig) && /tag: 'racha'/.test(vig));
ok('el rayo sigue siendo el único que manda con su veto, sin tocar',
   /tag: 'tormenta', importante: true/.test(vig));

ok('del vaivén de milímetros NO se avisa: solo aparecer, agravarse o adelantarse',
   /const aFuerte = !va\.fuerte && vb\.fuerte;/.test(vig)
   && /const antesDe = vb\.ini <= va\.ini - 2;/.test(vig));
ok('y la racha igual: sube 10 km/h o se adelanta 2 h',
   /const masFuerte = rb\.kmh >= ra\.kmh \+ 10;/.test(vig));

/* ── EL PARTE DE LA MAÑANA, YA SIN EL MAC ────────────────────────
   Suyo, 29-08-2026: «a veces dejo el Mac encendido y otras no». El parte
   de las 06:39 corría allí, así que los días que lo apagaba no salía —
   justo el que mira antes de entrar a trabajar. */
console.log('\n  El parte, desde el servidor');

ok('el parte sale por la mañana y una sola vez al día',
   /const tocaParte = h0 >= HORA_PARTE && h0 < 12 && antes\?\.parteDe !== claveHoy;/.test(vig));
/* Desde el 01-09-2026 la condición lleva además que el parte HAYA
   LLEGADO a algún aparato: «no estar mudo» no es «haber avisado». */
ok('y se guarda la fecha para no repetirlo en cada pasada',
   /parteDe: \(tocaParte && !soloMirar/.test(vig)
   && /e\.tag === 'parte' && \(e\.enviados \|\| 0\) > 0/.test(vig));
ok('si NO se llegó a enviar, no se marca como dado: se reintenta',
   /: \(antes\?\.parteDe \?\? null\)/.test(vig));
ok('un día sin nada TAMBIÉN manda parte: es la señal de vida',
   /sin nada por encima de tus listones/.test(vig));
ok('y dice cuántos sitios ha mirado, que un cero sin contexto no vale',
   /Los \$\{buenos\.length\} emplazamientos/.test(vig));
/* 12 es EL TOPE del plan Hobby de Vercel, y con /api/ajustes (30-08,
   el sync de aparatos) se ha llegado. La 13.ª no cabe: tendrá que ir
   dentro de una función que ya exista, como el parte va en el vigilante. */
ok('no se pasa del tope de funciones de Vercel: la próxima va dentro de una',
   require('fs').readdirSync(require('path').join(__dirname, 'api'))
     .filter(f => f.endsWith('.mjs')).length <= 12);

ok('y el pulso dice si el vigilante puede hablar, sin clave',
   /envia: process\.env\.VIGILANTE_ENVIA === '1'/.test(vig)
   && /haceMin, envia,/.test(vig),
   'un vigilante mudo y uno tranquilo no se pueden ver igual');

/* ── EL BUZÓN DE CAMPO ───────────────────────────────────────────
   Dos fallos que destapó él la tarde del 29-08-2026 preguntando por unas
   fotos que había mandado. */
console.log('\n  El buzón de campo');
const campo = fs.readFileSync(path.join(__dirname, 'api', 'campo.mjs'), 'utf8');

/* 1. «0 notas» y «no he podido leerlo» tienen que verse distinto. Me lo
      comí yo entero: di por perdidas sus notas cuando las había borrado
      él, porque el servidor contestaba cero en los dos casos. */
ok('leer() ya NO se traga el error y devuelve vacío',
   !/} catch \{ return \[\]; \}\s*\}/.test(campo),
   'un fallo que se lee como calma es el error de esta casa');
ok('y el GET contesta con el error, no con un cero',
   /catch \(e\) \{ return res\.status\(500\)/.test(campo));

/* 2. Y al mandar una nota, si la lectura fallaba se guardaba SOLO la
      nueva — o sea que un fallo de red le borraba el hilo entero. */
ok('guardar una nota nueva no puede llevarse por delante las viejas',
   /const todo = await leer\(\);[\s\S]{0,200}await guardar\(\[nota, \.\.\.todo\]/.test(campo));

/* 3. Borrar del móvil archivaba nada y destruía la foto. Suyo:
      «¿pero no se quedan archivadas si las borro del móvil?» */
ok('borrar ARCHIVA en vez de destruir',
   /await guardarArchivo\(\[\.\.\.fuera, \.\.\.viejas\]/.test(campo));
ok('y la foto ya no se borra del servidor',
   !/del\(fuera\)/.test(campo) && !/from '@vercel\/blob';/.test(campo.split('\n')[0])
   || !/\bdel\(/.test(campo));
ok('se archiva ANTES de quitarla del hilo, no después',
   campo.indexOf('guardarArchivo') < campo.indexOf('await guardar(quedan)'));
ok('el archivo tiene tope, que tampoco puede crecer sin fin',
   /\.slice\(0, 500\)/.test(campo));

/* ── LOS CRÍTICOS ────────────────────────────────────────────────
   Suyo, 29-08-2026: «BI_SANTAMAÑA es un crítico muy importante que
   tenemos». Hasta ese día solo MATIENA lo estaba, y un crítico entra en
   el titular del aviso y fuerza el correo si no se puede leer. */
console.log('\n  Los emplazamientos críticos');
ok('MATIENA sigue siendo crítico', /'MATIENA'[\s\S]{0,90}critico: true/.test(vig));
ok('y SANTAMAÑA también, desde el 29-08', /'SANTAMAÑA'[\s\S]{0,90}critico: true/.test(vig));
ok('y no se ha marcado ningún otro sin querer',
   (vig.match(/critico: true/g) || []).length === 2,
   String((vig.match(/critico: true/g) || []).length));

/* ── QUE NO SE QUEDE NINGUNO SIN VIGILAR ─────────────────────────
   El 29-08-2026, al ir a añadir GALDAMES, se vio que el vigilante miraba
   CATORCE y él tenía DIECINUEVE en favoritos: cuatro emplazamientos
   suyos sin que nadie los mirara, y en la app iguales que el resto. */
console.log('\n  Todos sus emplazamientos, vigilados');
const cuantos = (vig.match(/^  \{ n: '/gm) || []).length;
ok('el vigilante mira los 19, no los 14 de antes', cuantos === 19, String(cuantos));
for (const n of ['GALDAMES','ZEBERIO','LEMONA','PUNTA GALEA','AMURRIO','SANTAMAÑA'])
  ok(`${n} está en la lista`, vig.includes(`n: '${n}'`));
/* GALDAMES lleva las coordenadas de SU MAPA, no las de la planta: están
   a 155 m una de otra pero a **133 m de desnivel**, y la de la planta cae
   ladera abajo. Cuando él manda un mapa, ese manda. */
ok('GALDAMES usa el punto que mandó él, no el de la planta',
   /n: 'GALDAMES',\s+lat: 43\.239979,\s+lon: -3\.123619/.test(vig)
   && !/lat: 43\.2411/.test(vig));

/* ── LA RAÍZ: QUE LA LISTA NO SE PUEDA QUEDAR VIEJA ──────────────
   Suyo, 29-08-2026: «pues error grave, ¿no?» · «menudo plan». Y lo era:
   el vigilante llevaba su propia lista escrita a mano y él añade sitios
   desde la app, así que **el desajuste se creaba solo**. Cuatro
   emplazamientos suyos llevaban días sin que nadie los mirara. */
console.log('\n  La lista del vigilante ya no se queda vieja');
ok('lee SU lista de verdad, la que guarda la app',
   /fetch\(`\$\{APP\}\/api\/torres`\)/.test(vig));
ok('y la de escrita a mano solo se usa si eso falla',
   /let sitios = SITIOS, listaDeRespaldo = true;/.test(vig));
ok('cuando usa la de respaldo, LO DICE en la respuesta',
   /listaDeRespaldo, cuantosSitios: sitios\.length,/.test(vig));
ok('y le manda un aviso, que un vigilante con la lista vieja no puede callar',
   /No he podido leer tu lista de emplazamientos/.test(vig));
ok('pero solo una vez, no en cada pasada',
   /antes\?\.listaDeRespaldo !== true/.test(vig));
ok('el pulso dice DE QUÉ LISTA salió, que el número de sitios no distingue',
   /lista: e\.listaDeRespaldo \? 'respaldo' : 'la tuya'/.test(vig),
   'las dos listas pueden tener los mismos sitios');

/* Y el parte de la mañana, por el mismo motivo. Puesto el 30-08-2026: le
   dije que sale solo con el Mac apagado y luego no podía comprobarlo
   desde fuera. Un dato que no se puede mirar se acaba contando de
   memoria. */
ok('el pulso dice si salió el parte de la mañana',
   /parteDe: e\.parteDe \?\? null/.test(vig),
   'sin esto, «te ha salido el parte» es una suposición');
ok('y también cuando el vigilante se acaba de revivir',
   (vig.match(/parteDe: e\.parteDe \?\? null/g) || []).length >= 2,
   'que es justo cuando más falta hace saberlo');
ok('lo CRÍTICO se arrastra a la lista nueva, que la app no lo trae',
   /critico: SITIOS\.some\(v => v\.critico && cerca\(v, x\)\)/.test(vig));

/* ── EL CERO DEL PLUVIÓMETRO NO SIEMPRE ES UN CERO (30-08-2026) ───────
   Sirimiri real en Bermeo —contado por él desde la calle— y los
   pluviómetros en CERO con la humedad al 91 %. El marcador, tal como
   estaba, PENALIZABA a ECMWF (el único que acertó) y daba error 0 a los
   seis ciegos. En la magnitud con la que decide si sube gente. */
console.log('\n  El cero dudoso: el sirimiri moja sin marcar');

ok('el caso de hoy: pluviómetro 0, humedad 91, ICON dice 0 → NO se guarda',
   limpiar({ estacion: 'MATXITXAKO', hora: '2026-08-30T14', magnitud: 'lluvia',
             medido: 0, humedad: 91, modelos: { ICON: 0, 'AROME HD': 0 } }) === null,
   'guardarla daría error 0 al que no vio el sirimiri: premio al ciego');

ok('y ECMWF con 0,4 tampoco sale penalizado por ese cero',
   limpiar({ estacion: 'MATXITXAKO', hora: '2026-08-30T15', magnitud: 'lluvia',
             medido: 0, humedad: 91, modelos: { ECMWF: 0.4 } }) === null,
   'el aparato no midió su sirimiri: esa hora no juzga a nadie');

ok('sin humedad conocida, un cero tampoco vale',
   limpiar({ estacion: 'X', hora: '2026-08-30T14', magnitud: 'lluvia',
             medido: 0, modelos: { ECMWF: 0.4 } }) === null,
   'afirmar un cero sin poder comprobarlo es el mismo fallo al revés');

ok('con el aparato marcando agua, se guarda SIEMPRE, humedad aparte',
   limpiar({ estacion: 'X', hora: '2026-08-30T15', magnitud: 'lluvia',
             medido: 0.4, humedad: 91, modelos: { ECMWF: 0.4, ICON: 0 } })?.medido === 0.4);

ok('la humedad queda guardada, para poder auditar la regla',
   limpiar({ estacion: 'X', hora: '2026-08-30T10', magnitud: 'lluvia',
             medido: 0, humedad: 70.4, modelos: { ECMWF: 0.4 } })?.humedad === 70);

ok('la RACHA no pide humedad: su aparato no tiene este problema',
   limpiar({ estacion: 'X', hora: '2026-08-30T14',
             medido: 30, modelos: { ICON: 28 } })?.medido === 30);

ok('la purga retroactiva existe y va con clave, como reiniciar',
   /body\.purgar === 'lluvia-cero-dudoso'/.test(srcM)
   && (srcM.match(/AVISOS_CLAVE/g) || []).length >= 4);

/* ── EL VIGILANTE INVITA AL EUROPEO — SOLO PARA EL AGUA ──────────────
   El 30-08 cayó sirimiri dos veces y el vigilante calló: sus tres
   modelos daban cero y el único que lo veía no estaba en la lista. */
console.log('\n  El vigilante mira al que ve el agua');

ok('la lista del agua incluye al europeo',
   /const MODELOS_AGUA = \[\.\.\.MODELOS, 'ecmwf_ifs025'\]/.test(vig));
ok('la petición trae a los cuatro', /models=\$\{MODELOS_AGUA\.join/.test(vig));
ok('el bucle del agua recorre los cuatro',
   /for \(const m of MODELOS_AGUA\) \{\s*\n\s*const mm = H_\[`precipitation_/.test(vig));
ok('pero la TORMENTA sigue solo con los que publican la tapa',
   !/for \(const m of MODELOS_AGUA\) \{\s*\n\s*const c = /.test(vig)
   && /ecmwf_ifs025: 'ECMWF'/.test(vig),
   'ECMWF no publica la tapa: en CAPE+tapa no puede opinar');

/* ═══ /api/ajustes — lo mismo en el Mac y en el móvil ═══════════════
   Suyo, 30-08-2026: «SI SE TOCA ALGO QUE SE VEAN IGUAL» y «el Mac tiene
   que ser una calca en el móvil». La regla es la contraria a la de las
   torres: aquí manda el último cambio, campo por campo. Estas pruebas
   fijan las dos cosas que la harían mentir: que un bloque entero pise
   campos que no ha tocado, y que un reloj mal puesto gane para siempre. */
console.log('\n  Los ajustes: manda el último cambio, campo por campo');

const A = (() => {
  const srcA = fs.readFileSync(path.join(__dirname, 'api', 'ajustes.mjs'), 'utf8');
  const corta = (firma, hasta = '\n}') => {
    const i = srcA.indexOf(firma);
    if (i < 0) throw new Error(`no encuentro «${firma}» en api/ajustes.mjs`);
    return srcA.slice(i, srcA.indexOf(hasta, i) + hasta.length);
  };
  /* `limpiar` y `juntar` existen también en el marcador: se evalúan aquí
     dentro, en su propio ámbito, y salen con nombre propio. */
  return eval(corta('const CAMPOS', '\n};') + '\n'
    + corta('function limpiar') + '\n'
    + corta('function juntar') + '\n'
    + ';({ CAMPOS, limpiar, juntar })');
})();

ok('un campo que no está en el contrato NO viaja (basura de versión vieja)',
   Object.keys(A.limpiar({ hack: { v: 1, t: 1 }, place: { v: 'Boiro', t: 1 } })).length === 0,
   'place es local a cada aparato: abrir Boiro en el Mac no puede mover el móvil');
ok('el modelo entra con su hora',
   A.limpiar({ model: { v: 'ecmwf_ifs025', t: 123 } }).model?.t === 123);
ok('sin hora no entra: un ajuste sin fecha no puede competir',
   !A.limpiar({ model: { v: 'ecmwf_ifs025' } }).model);
(() => {
  const f = A.limpiar({ model: { v: 'arome', t: Date.now() + 9e9 } });
  ok('una hora del futuro se recorta a ahora (reloj mal puesto, no cambio nuevo)',
     f.model && f.model.t <= Date.now(),
     'sin el recorte, ese aparato ganaría todos los empates para siempre');
})();
ok('la letra solo admite sus cuatro tamaños',
   !A.limpiar({ zoom: { v: 2, t: 1 } }).zoom
   && A.limpiar({ zoom: { v: 1.15, t: 1 } }).zoom?.v === 1.15);
ok('umbrales con texto dentro no entran',
   !A.limpiar({ thr: { v: { gustWarn: 'alto' }, t: 1 } }).thr
   && A.limpiar({ thr: { v: { gustWarn: 45 }, t: 1 } }).thr?.v.gustWarn === 45);

/* El caso que da nombre a la regla: el móvil toca el MODELO; los
   UMBRALES del Mac, más viejos pero no tocados, se quedan como están. */
(() => {
  const guardado = { model: { v: 'arome', t: 200 }, thr: { v: { gustWarn: 45 }, t: 300 } };
  const j = A.juntar(guardado, A.limpiar({ model: { v: 'ecmwf', t: 250 } }));
  ok('tocar el modelo en el móvil NO devuelve umbrales viejos del Mac',
     j.model.v === 'ecmwf' && j.thr.v.gustWarn === 45 && j.thr.t === 300,
     'se junta campo por campo, nunca el bloque entero');
  const k = A.juntar(guardado, A.limpiar({ model: { v: 'gfs', t: 100 } }));
  ok('un cambio más viejo que lo guardado no pisa nada',
     k.model.v === 'arome' && k.model.t === 200);
  const e = A.juntar(guardado, A.limpiar({ model: { v: 'gfs', t: 200 } }));
  ok('en empate de hora gana el que llega (el POST de ahora)',
     e.model.v === 'gfs');
})();

const srcAjustes = fs.readFileSync(path.join(__dirname, 'api', 'ajustes.mjs'), 'utf8');
ok('si el blob no se puede escribir, se DICE (guardado:false), no se calla',
   /ok: false, guardado: false/.test(srcAjustes));
ok('la respuesta no se cachea: un ajuste de hace 5 min ya es viejo',
   /Cache-Control', 'no-store'/.test(srcAjustes));
/* La lectura se mudó a la única puerta el 01-09-2026 y la ESCRITURA el
   03-09, así que las dos se exigen allí. Aquí queda lo que sigue siendo
   de este fichero: que no se le escape un `public` propio. */
{
  /* El DÓNDE se guarda se separó de la puerta el 03-09-2026, para poder
     mudar el almacén sin tocar el resto. Así que esto se exige ahora en
     `lib/motor.mjs`, que es quien habla con el Blob. */
  const motor = fs.readFileSync(path.join(__dirname, 'lib', 'motor.mjs'), 'utf8');
  ok('el blob va en privado y se lee por stream, como el de torres',
     /access: 'private', useCache: false/.test(motor)
     && /new Response\(r\.stream\)/.test(motor)
     && /access: 'private'/.test(motor)
     && !/access: 'public'/.test(motor)
     && !/access: 'public'/.test(srcAjustes),
     'el primer borrador usaba una firma de get que no existe y guardaba en público');
}
/* Puesto tras metérsela DOS veces la misma noche: una prueba de dos
   aparatos escribió en sus ajustes de verdad y sus cacharros adoptaron
   valores de laboratorio (uno de ellos «kt», y él dice km/h siempre). */
ok('las pruebas tienen su propio cajón: no pueden tocar sus ajustes',
   /const CAJON_PRUEBA = 'avisos\/ajustes-prueba\.json'/.test(srcAjustes)
   && /const cajon = req => \(req\?\.prueba === true \? CAJON_PRUEBA : CAJON\)/.test(srcAjustes));
ok('y el GET también sabe mirar el cajón de pruebas',
   /esPrueba \? CAJON_PRUEBA : CAJON/.test(srcAjustes));
ok('vaciar el de pruebas no pide clave; el suyo, sí',
   /body\.prueba !== true\s*\n\s*&& \(req\.headers\['x-clave'\]/.test(srcAjustes));

ok('el reinicio existe y va con clave, como la purga del marcador',
   /body\.reiniciar === true/.test(srcAjustes)
   && /x-clave/.test(srcAjustes) && /AVISOS_CLAVE/.test(srcAjustes));

/* ── EL DEPLOY NO PUEDE FALLAR EN SILENCIO ──────────────────────────
   Tres veces la noche del 31-08 el CLI de Vercel salió con error y el
   `| tail -3` se tragó el código de salida: el script seguía como si
   hubiera publicado y solo se descubría comprobando la versión servida.
   Suyo: «solucionar de permanente ya esos fallos». */
/* ── LA CUOTA NO SE GASTA EN NO DECIR NADA ───────────────────────────
   El 01-09-2026 Vercel suspendió el almacén: «Blob Advanced Operations
   2K / 2K». El gastador principal era el vigilante, escribiendo su
   estado CADA 30 MINUTOS —1.440 veces al mes— casi siempre para guardar
   lo mismo. Se llevó por delante el buzón, la sincronización y los
   avisos al móvil. */
/* Suyo, 01-09-2026: «le doy a los mensajes que quedan arriba en el móvil
   para entrar y se van». El aviso que no lleva a ningún sitio es medio
   aviso: él lo toca justamente para ver qué pasa. */
/* Suyo, 01-09-2026, al ver que la CPU salía justo en el límite del plan
   gratis: «ni Windy te avisa cada media hora — 1 o 3 horas te avisan». */
/* ── NADIE LEE EL ALMACÉN POR SU CUENTA ────────────────────────────
   Ésta es la que hace que no vuelva a pasar. Suyo, 01-09-2026: *«esto es
   lo que digo a diario, siempre falla casi lo mismo… ¿podéis hacer que
   esto no pase nunca más?»*.

   El fallo se repetía porque cada función se leía el almacén por su
   cuenta, con su propio `catch`, y siempre había una que se lo tragaba y
   devolvía vacío con un 200. Ahora hay UNA puerta (lib/almacen.mjs) y
   esto vigila que nadie abra otra: una función nueva que importe `get`
   del Blob no pasa de aquí. */
/* ── UN BOTÓN QUE EL CÓDIGO ESPERA TIENE QUE EXISTIR ──────────────────
   Suyo, 04-09-2026, nada más volver el almacén: *«activado, pero no hay
   botón de fotos… ni de adjuntar de galería, solo sms»*.

   Qué había pasado. El 01-09, con el almacén de Vercel suspendido y sin
   dónde guardar, él dijo «quita lo de las fotos que ya no lo vamos a
   usar» y se quitaron los dos botones del `index.html`. Pero TODO lo
   demás se quedó: los dos <input>, la previa, el envío, `api/foto.mjs`,
   y en `app.js` el código que busca `#btnCampoCamara` y `#btnCampoFoto`
   para engancharlos.

   Y como se busca con `$('#…')` y se comprueba con `if (!bt) continue`,
   la app arrancaba tan tranquila. Ni un error en consola. La función
   estaba entera y viva, y simplemente no había por dónde llamarla.
   Tres días.

   Esto lo caza: recorre `app.js`, junta todos los botones que pide y
   comprueba que existen en el `index.html` o que los crea la propia
   app. El que no esté, se dice por su nombre. */
console.log('\n  Ningún botón que el código espera se ha quedado sin poner');
{
  const app  = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  const enHtml   = new Set([...html.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]));
  /* Los que la propia app se pinta al vuelo también valen. */
  const alVuelo  = new Set([
    ...[...app.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]),
    ...[...app.matchAll(/id='([A-Za-z0-9_-]+)'/g)].map(m => m[1]),
    ...[...app.matchAll(/\.id\s*=\s*['"]([A-Za-z0-9_-]+)/g)].map(m => m[1]),
  ]);
  const pedidos = new Set([...app.matchAll(/'#(btn[A-Za-z0-9_-]*)'/g)].map(m => m[1]));

  /* ── LA ÚNICA EXCEPCIÓN, Y CON SU MOTIVO ──────────────────────────
     `btnParte` engancha `copiarParte()`, que arma el parte en texto con
     sus umbrales y la ventana apta para pegarlo donde quiera. No tiene
     botón en el HTML y no se sabe si se quitó a propósito: desde el
     02-09 él quiere el parte de trabajo en PDF, no la app en papel.
     Se le preguntó el 04-09 y está pendiente de que decida. Si dice que
     sí, se pone el botón y esta línea se borra; si dice que no, se borra
     la función entera y esta línea también. Lo que no vale es dejarlo
     así callado, que es como se perdieron los de las fotos. */
  const PERDONADOS = { btnParte: 'pendiente de que él diga si lo quiere (04-09-2026)' };

  const huerfanos = [...pedidos]
    .filter(id => !enHtml.has(id) && !alVuelo.has(id) && !PERDONADOS[id])
    .sort();

  ok('todo botón que app.js engancha existe de verdad',
     huerfanos.length === 0,
     huerfanos.length ? `sin poner en index.html: ${huerfanos.join(', ')}` : '');

  /* Y que los de las fotos —los que se perdieron— sigan puestos. */
  for (const id of ['btnCampoCamara', 'btnCampoFoto']) {
    ok(`el botón ${id === 'btnCampoCamara' ? 'de hacer foto' : 'de la galería'} sigue en su sitio`,
       enHtml.has(id), 'estuvo tres días sin estar, con todo lo demás funcionando');
  }
}

console.log('\n  Nadie toca el almacén por su cuenta');
{
  const dir = path.join(__dirname, 'api');

  /* ── AHORA TAMBIÉN LA ESCRITURA ────────────────────────────────────
     Hasta el 03-09-2026 esto solo vigilaba la LECTURA, y la escritura
     estaba repartida en nueve ficheros con las mismas cuatro opciones
     copiadas a mano. Ese día Vercel dejó el Blob fuera del plan
     gratuito, hubo que mudar el almacén de sitio, y nueve sitios que
     tocar son nueve oportunidades de que se escape uno y algo deje de
     guardarse en silencio. Suyo, esa noche: *«yo no puedo andar así,
     para eso estáis»*.

     Ya no hay excepciones: ni siquiera `foto.mjs`, que servía el
     binario de la imagen y ahora pasa por `leerBytes`/`guardarBytes`.
     Un fichero de `api/` que importe del Blob no se publica. */
  const chivatos = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mjs'))) {
    const t = fs.readFileSync(path.join(dir, f), 'utf8');
    if (/'@vercel\/blob'/.test(t)) chivatos.push(f);   // vale el import normal y el perezoso
  }
  ok('ninguna función abre el almacén a su manera (ni para leer ni para guardar)',
     chivatos.length === 0,
     chivatos.length ? `${chivatos.join(', ')} → tiene que usar lib/almacen.mjs`
                     : '');

  const alm = fs.readFileSync(path.join(__dirname, 'lib', 'almacen.mjs'), 'utf8');
  ok('y la puerta distingue «no existe» de «no he podido leer»',
     /if \(noExiste\(e\)\) return/.test(alm) && /throw e;/.test(alm));

  /* Que la puerta siga sirviendo para las dos cosas. Si alguien quita
     una de éstas, las funciones se quedan sin por dónde guardar y
     volverían a llamar al Blob por su cuenta. */
  for (const nombre of ['guardarJSON', 'guardarBytes', 'leerBytes', 'borrar']) {
    ok(`la puerta ofrece ${nombre}`,
       new RegExp(`export (const|async function|function) ${nombre}\\b`).test(alm));
  }

  /* Y que las opciones del almacén estén escritas UNA vez, no nueve.
     Viven en el motor desde el 03-09; la puerta ya no sabe de ellas. */
  const mot = fs.readFileSync(path.join(__dirname, 'lib', 'motor.mjs'), 'utf8');
  const veces = (mot.match(/allowOverwrite:/g) || []).length;
  ok('las opciones del almacén están en un solo sitio', veces === 1,
     veces !== 1 ? `aparecen ${veces} veces en motor.mjs; tienen que ir en la constante COMUN` : '');
  ok('y la puerta ya no sabe DÓNDE se guarda: eso es del motor',
     !/allowOverwrite/.test(alm) && /from '\.\/motor\.mjs'/.test(alm),
     'si la puerta vuelve a llamar al Blob, mudar el almacén deja de ser un fichero');

  /* ── EL MOTOR ES EL ÚNICO QUE HABLA CON EL BLOB ──────────────────
     Antes bastaba con vigilar `api/`. Ahora hay dos ficheros en `lib/`
     y el reparto tiene que aguantar: la puerta dice QUÉ se guarda, el
     motor dice DÓNDE. Si la puerta vuelve a importar del Blob, el día
     que haya que mudar el almacén vuelven a ser dos sitios. */
  const enLib = fs.readdirSync(path.join(__dirname, 'lib'))
    .filter(x => x.endsWith('.mjs'))
    .filter(x => /'@vercel\/blob'/.test(
      fs.readFileSync(path.join(__dirname, 'lib', x), 'utf8')));
  ok('solo motor.mjs habla con el Blob, en toda la app', 
     enLib.length === 1 && enLib[0] === 'motor.mjs',
     enLib.length ? `también: ${enLib.filter(x => x !== 'motor.mjs').join(', ')}` : 'nadie lo importa');

  /* ── Y QUE EL MOTOR DE RECAMBIO SIGA ESTANDO ─────────────────────
     Puesto el 03-09-2026, cuando Vercel dejó su Blob fuera del plan
     gratuito y él dijo «no pago nada». El Redis se enchufa poniendo dos
     variables, sin publicar. Si alguien quita este camino, volvemos a
     depender de un almacén de pago sin darnos cuenta. */
  ok('hay un segundo motor listo, que se enciende con dos variables',
     /KV_REST_API_URL/.test(mot) && /KV_REST_API_TOKEN/.test(mot)
     && /UPSTASH_REDIS_REST_URL/.test(mot),
     'sin esto, mudar el almacén vuelve a ser publicar código');
  ok('y el motor dice con cuál está guardando, en vez de adivinarlo',
     /export const motor = /.test(mot));

  /* Que la prueba de verdad —la que arranca las funciones con el almacén
     roto— siga estando y siga corriéndose al publicar. */
  ok('y se prueba arrancándolas con el almacén roto, no leyendo el código',
     fs.existsSync(path.join(__dirname, 'prueba-almacen-caido.mjs'))
     && /prueba-almacen-caido/.test(fs.readFileSync(path.join(__dirname, 'revisar.sh'), 'utf8')),
     'sin esto en revisar.sh, la guardia no corre al publicar');
}

/* Lo cazó el chat de al lado el 01-09-2026: al no poder guardar estado,
   el vigilante no se cae —eso ya estaba— pero DEJA DE AVISAR de los
   cambios, que es la mayor parte de lo que avisa. Y son 25 días. */
/* ── AVISADO ES QUE HAYA LLEGADO ────────────────────────────────────
   Barrido del 01-09-2026. El vigilante marcaba la tormenta como «ya
   avisado» sin mirar si el envío había entregado nada. Con el push
   fallando, la pasada siguiente veía «ya avisado» y NO lo reintentaba:
   el aviso se perdía para siempre y el vigilante seguía diciendo que
   todo bien. Lo mismo con el parte de la mañana. */
console.log('\n  Avisado es que haya LLEGADO, no que se haya intentado');
{
  const v = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
  ok('la tormenta solo se marca si llegó a algún aparato',
     /e\.tag === 'tormenta' && \(e\.enviados \|\| 0\) > 0/.test(v),
     'si no, un envío fallido se traga el aviso de tormenta para siempre');
  ok('y si no llegó, se conserva lo de antes para reintentar',
     /\? firmaAhora\s*\n\s*: \(antes\?\.ultimoAviso \?\? null\)/.test(v));
  ok('el parte de la mañana, igual',
     /e\.tag === 'parte' && \(e\.enviados \|\| 0\) > 0/.test(v));

  /* Y se EJERCITA la cuenta, que es donde estaba el fallo. */
  const marcado = (inminentes, enviados, antesUA) =>
    !inminentes.length ? null
      : (enviados.some(e => e.tag === 'tormenta' && (e.enviados || 0) > 0)
           ? 'FIRMA' : (antesUA ?? null));
  ok('con el envío fallido NO se marca (y se reintenta)',
     marcado([1], [{ tag: 'tormenta', enviados: 0 }], null) === null);
  ok('con el envío bueno SÍ se marca (y no se repite)',
     marcado([1], [{ tag: 'tormenta', enviados: 2 }], null) === 'FIRMA');
  ok('y sin tormenta se limpia, para que la próxima sí avise',
     marcado([], [], 'FIRMA_VIEJA') === null);
}

console.log('\n  Sin estado, el vigilante avisa por lo que HAY');
const vgc = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
ok('sabe cuándo está ciego',
   /const ciego = !antes\?\.sitios;/.test(vgc));
ok('y entonces avisa por estado absoluto, no por cambio',
   /if \(ciego\) \{/.test(vgc) && /soloEstado: true/.test(vgc),
   'sin esto, 25 días sin avisos de «ahora da rayo» ni «aparece agua»');
ok('solo de lo gordo: su tope de racha y la lluvia fuerte',
   /r\.kmh >= 60/.test(vgc) && /ag\.mm >= 2/.test(vgc),
   'avisar de todo sin poder comparar sería darle la lata 25 días');
ok('y se dice que es un aviso por lo que hay, no por lo que ha cambiado',
   /el vigilante no puede comparar con antes/.test(vgc));
ok('el marcador tampoco contesta «cero muestras» cuando no puede leer',
   /no he podido leer el marcador; esto NO quiere decir que esté vacío/.test(
     fs.readFileSync(path.join(__dirname, 'api', 'marcador.mjs'), 'utf8')));

console.log('\n  El vigilante afloja cuando no pasa nada');
const vg = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
ok('si no hay nada en marcha, se salta la pasada (cadencia de una hora)',
   /saltada: true/.test(vg) && /huecoPrevio < 55/.test(vg),
   'pasar cada media hora un día tranquilo se llevaba 3,2 de las 4 h de CPU del mes');
ok('pero vuelve a media hora en cuanto hay rayo, agua, racha o aviso vivo',
   /const algoEnMarcha = !!\(antes && \(/.test(vg)
   && /antes\.ultimoAviso/.test(vg) && /aguaSitios/.test(vg) && /rachaSitios/.test(vg));
ok('nunca se salta su ojeada a mano ni la ventana del parte',
   /const ojeadaAMano = req\.query\?\.mirar === '1'/.test(vg)
   && /!ojeadaAMano && !algoEnMarcha && !ventanaDelParte/.test(vg));
ok('y saltarse una pasada NO cuenta como estar caído (el aviso salta a las 4 h)',
   /huecoMin > 240/.test(vg),
   'con cadencia de 1 h, un listón de 4 h no da falsos avisos');

console.log('\n  Tocar el aviso abre la app');
const swSrc = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
ok('la dirección del aviso se resuelve ENTERA, no relativa',
   /new URL\(\(e\.notification\.data && e\.notification\.data\.url\) \|\| '\.\/', base\)\.href/.test(swSrc),
   'con «./» a secas, Android cerraba el aviso y no abría nada');
ok('la ventana ya abierta se busca por ORIGEN, no por includes',
   /new URL\(c\.url\)\.origin === new URL\(base\)\.origin/.test(swSrc));
ok('y si abrir falla, se reintenta con la raíz antes que no abrir nada',
   /Último recurso: la raíz/.test(swSrc) && /openWindow\(base\)/.test(swSrc));

console.log('\n  El vigilante no gasta cuota en no decir nada');
// (el fuente del vigilante ya está leído arriba, en `vig`)
ok('solo escribe su estado si algo ha cambiado',
   /const cambia = sinHora\(nuevo\) !== sinHora\(antes\);/.test(vig)
   && /if \(cambia \|\| viejo\) \{/.test(vig) && /await guardarEstado\(nuevo\);/.test(vig),
   'escribía cada 30 min: 1.440 escrituras al mes para no decir nada');
ok('la hora se deja FUERA de la comparación (si no, cambiaría siempre)',
   /const \{ cuando, \.\.\.r \} = e \|\| \{\}; return JSON\.stringify\(r\);/.test(vig),
   'con la hora dentro, todo cambia siempre y no se ahorra nada');
ok('pero se refresca al menos cada 25 min, para que el pulso no envejezca ni resucite en bucle',
   /> 25 \* 60e3/.test(vig) && !/> 20 \* 3600e3/.test(vig),
   'él mira «última pasada hace X min»; con 20 h de sello viejo el pulso resucitaba al vigilante en cada apertura (13-09-2026)');

console.log('\n  Publicar no puede fallar en silencio');
const srcDeploy = fs.readFileSync(path.join(__dirname, 'deploy.sh'), 'utf8');
ok('el deploy reintenta hasta tres veces',
   /for intento in 1 2 3; do/.test(srcDeploy));
ok('y NO se traga el código de salida del CLI (ni lo mata `set -e`)',
   /set -[a-z]*o pipefail/.test(srcDeploy)
   && /if vercel deploy --prod --yes 2>&1 \| tail -3; then/.test(srcDeploy),
   /* La primera versión usaba PIPESTATUS, pero con `set -e` la tubería
      suelta mataba el script ANTES de leerlo y el reintento no llegaba a
      correr nunca (cazado el 01-09). En contexto de condición, `set -e`
      no mata y `pipefail` ya da el estado del CLI, no el del tail. La
      prueba mira la INTENCIÓN —que el fallo no se trague— no el
      mecanismo concreto, que ya ha cambiado una vez. */
   'con la tubería fuera de una condición, set -e mataba el script');
ok('si los tres fallan, aborta con ruido en vez de dar por publicado',
   /NO SE HA PUBLICADO: tres intentos fallidos/.test(srcDeploy)
   && /exit 1/.test(srcDeploy));

/* ── Y LO QUE QUEDA PUBLICADO SE COMPRUEBA, NO SE IMPRIME ───────────
   Lo cazó el barrido del 01-09-2026. La comprobación de después de
   publicar recorría los seis ficheros con `curl` y PINTABA el código en
   pantalla sin mirarlo, y pedía /version.json para escupirlo sin
   compararlo jamás con la versión recién construida. Ninguna de esas
   líneas podía hacer fallar el guion. O sea que si producción se quedaba
   en el despliegue anterior, el guion decía «publicado» igual — y él se
   quedaba con la app de antes creyendo que llevaba la corrección.

   Es su miedo, con sus palabras: «que si el vercel se atasca... el tío
   muerto en el suelo por una app llamada vercel». */
console.log('\n  Lo publicado se comprueba, no se imprime');
ok('se compara la versión servida con la recién construida',
   /publicado" != "\$BUILD"/.test(srcDeploy)
   && /PRODUCCIÓN NO SIRVE ESTA VERSIÓN/.test(srcDeploy),
   'sin esto, un despliegue que no llega a producción se da por bueno');
ok('y si no coincide, se aborta en vez de seguir',
   /NO DES POR PUBLICADO NADA[\s\S]{0,80}exit 1/.test(srcDeploy));
ok('se espera a que el alias apunte, en vez de suponer 4 segundos',
   /for intento in \$\(seq 1 18\)/.test(srcDeploy)
   && !/^sleep 4$/m.test(srcDeploy),
   'el alias de producción tarda lo que tarda');
ok('cada fichero servido se mira, no solo se pinta',
   /\[ "\$cod" = 200 \] \|\| falta=1/.test(srcDeploy)
   && /ALGO PUBLICADO NO SE SIRVE/.test(srcDeploy),
   'antes el código HTTP iba dentro de un printf y no podía hacer fallar nada');
ok('y ya no queda el patrón viejo que se tragaba el resultado',
   !/printf "   %-16s %s\\n" "\$f" "\$\(curl/.test(srcDeploy));


/* ── Revisión 04-09, clase 7: en el servidor ─────────────────────── */
{
  const srcRayos = fs.readFileSync(path.join(__dirname, 'netlify', 'functions', 'rayos.js'), 'utf8');
  ok('los rayos de la península no caen si AEMET no da Canarias',
     /bounds\/CN`\)\.catch\(\(\) => null\)/.test(srcRayos)
     && /CN: bCN \? \{ bounds: caja\(bCN\)/.test(srcRayos),
     'un Promise.all tumbaba el catálogo entero, y el rayo es su único veto');
  const srcCampo = fs.readFileSync(path.join(__dirname, 'api', 'campo.mjs'), 'utf8');
  const srcFoto  = fs.readFileSync(path.join(__dirname, 'api', 'foto.mjs'), 'utf8');
  ok('una nota sin su hora en el modelo NO se empareja con la de medianoche (campo y foto)',
     /sinHora: `el modelo no tiene la hora \$\{marca\}`/.test(srcCampo)
     && /sinHora: `el modelo no tiene la hora \$\{marca\}`/.test(srcFoto)
     && !/if \(i < 0\) i = 0;/.test(srcCampo) && !/if \(i < 0\) i = 0;/.test(srcFoto),
     '`if (i < 0) i = 0` cogía la primera hora del fichero: las 00:00');
}


/* ── El vigilante escribe su sello en cada pasada (13-09-2026) ───────── */
{
  const vig2 = fs.readFileSync(path.join(__dirname, 'api', 'vigilante.mjs'), 'utf8');
  ok('el sello «cuando» del vigilante se escribe en cada pasada, no una vez cada 20 h',
     /> 25 \* 60e3;/.test(vig2) && !/> 20 \* 3600e3;/.test(vig2),
     'con el sello viejo, cada pulso resucitaba al vigilante y llegaban «He estado 12 h sin vigilar» en bucle');
  ok('una pasada resucitada por el pulso no se repite antes de 20 min',
     /'x-revivido': '1'/.test(vig2) && /__ultimaPasadaVigilante/.test(vig2));
  ok('si el estado no se pudo guardar o leer, la pasada lo dice en su respuesta',
     /noSeGuardo: noSeGuardo \|\| undefined/.test(vig2) && /noPudeLeerElEstado: noPudeLeerElEstado \|\| undefined/.test(vig2),
     'eran dos banderas mudas');
}

console.log(`\n  ${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
