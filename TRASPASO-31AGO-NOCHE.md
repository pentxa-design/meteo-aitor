# RELEVO · noche del 31-08-2026 · «tres pasadas» de Aitor

> Escrito a las 22:10 por si se corta la sesión. **Todo lo de aquí está
> MEDIDO** (dos equipos de revisión + cronómetro en navegador), no supuesto.
> Estado publicado en ese momento: **v2026.08.31-2129**.

## 1 · LO QUE YA ESTÁ ARREGLADO EN LOCAL (sin publicar aún)

Todos con `node --check` OK y 0 fallos en pruebas.js. Falta: pruebas nuevas,
candado y deploy.

| # | fallo (todos CONFIRMADOS con evidencia) | arreglo aplicado |
|---|---|---|
| 1 | **«Ninguno ve agua» sin decir de qué ventana** — en Ahora decía «los 7 coinciden en seco» (hora en curso) mientras el chip de la franja decía «GEM y ICON sí (0,3 mm)» | cabecera → «Ninguno ve agua **a esta hora**» + barrido de 24 h que dice quién ve algo y desde qué hora |
| 2 | **«Próxima lluvia» ciega al sirimiri** — exigía una hora suelta ≥0,2 mm, así que 0,1+0,1+0,1 daba «ninguno la ve» EN VERDE mientras el chip de al lado decía lo contrario | acepta el ACUMULADO ≥0,2 (mismo listón que el chip) y da la primera hora con agua |
| 3 | **El chip del 41° nunca salía** — `renderDays` se pintaba antes de llegar la comparación multi-modelo y `setView('days')` no repintaba (no había rama para 'days') | `if (v === 'days') renderDays();` en setView |
| 4 | **Tabla «Racha» vs tira** — la tabla prometía «los 5 juntos» y enseñaba el modelo CARGADO (21) mientras la tira daba ICON 22 | la celda toma el máximo de los 5 del MISMO `S.parteRaw` que pinta la tira, y dice de quién es |
| 5 | **El dueño del cielo no salía en su tira** — la tabla decía «Cubierto 99 %» (ARPEGE) y la tira de nubes listaba 5 modelos sin ARPEGE | fila del dueño al principio, sacada de `S.torres[].horas` **emparejando por timestamp** (no por índice: las dos consultas arrancan distinto) |
| 6 | **«tapa 3 — sin tapa»** sonaba a contradicción | palabra de la escala → **«abierta»** (+ prueba actualizada en pruebas.js:1874) |
| 7 | **Horas pintaba el icono con el código crudo** — única pantalla que no pasaba por `codigoQueSeVe()`: el agua del dueño no mandaba en el dibujo | `icon(codigoQueSeVe(h, h.code), h.day)` |
| 8 | **«0,0 mm» inventado** en Horas y 10 días cuando NO hay dato (la probabilidad sí ponía «—») | `'sin dato'`, nunca cero |
| 9 | **is_day nulo → luna a mediodía** — `null` no activa el valor por defecto de `icon()` | respaldo por hora local (8-19 h), el mismo criterio de `deDia()` |
| 10 | **`undefined !== null` en iconosDelDia** — media franja con horas pero sin códigos pintaba una nube gris inventada rotulada «tarde» | `has()` en vez de `=== null` |

## 1-BIS · PUBLICADO Y VERIFICADO (v2026.08.31-2202)

Los 10 de arriba **más** estos, todos con prueba y candado verde (627 pruebas):

| # | fallo | arreglo |
|---|---|---|
| 11 | **La T850 no podía pintar su escala nueva** — los regex de la marca solo admitían letras y «t850» fue la primera con dígitos: `marcaDe` devolvía «t» y dejaba `interpolation=linear850` roto | `[a-z0-9]+` en los dos, con prueba que ejercita el caso con dígitos |
| 12 | **Las capas «Viento X m» pintan la componente U, no la velocidad** — el servicio NO publica `wind_speed` (comprobado contra su catálogo): con viento del sur el color decía calma bajo un rótulo de km/h | rótulo honesto: «Viento X m · barbas», y el pie dice que **barbas y números son el viento real** y el color solo una componente; para la fuerza, Ráfagas (que sí es velocidad) |
| 13 | `RANGOS` no cubría t850 (si llega en Kelvin, pintaría 290° sin avisar) | `t850: [-60, 45, '°C']` |
| 14 | `LENTOS` con tres IDs inventados (`gfs_global`, `gfs025`, `icon_global`) | IDs reales + prueba de que todo ID de LENTOS existe en TMODELS |

**PRECALENTADO DE MODELOS: probado, medido y RETIRADO el mismo día.**
Empeoraba todo — ARPEGE 10,3 → 20,1 s; ICON-EU 1,2 → **20,7 s**. Una tesela no
calienta un fichero de 32 MB en el origen, y la cola competía con lo que él
mira. Tras retirarlo, medido: **volver a una capa vista = 174 ms**. La lección
queda escrita en `maps.js` y hay una prueba que impide que vuelva sin números.

## 2 · PENDIENTE, POR ORDEN (lo GRAVE primero)

~~**G1 · T850**~~ HECHO (ver 1-bis). **G2 · viento**: rotulado honesto hecho;
queda decidir si además se retira el color de fondo o se calcula el módulo.

**(histórico) G1 · La T850 no puede pintar su escala nueva.** `maps.js:283` y `:308`: los
regex de la marca solo admiten letras (`[a-z]+`) y `t850` lleva dígitos —
`marcaDe()` devuelve `"t"` y `limpiarMarca()` deja `interpolation=linear850`.
REPRODUCIDO en node. Arreglo: `[a-z0-9]+` en los dos, o renombrar la escala a
`masas` en `maps.js:213` y `:816`. **Y prueba que ejercite el caso con dígitos.**

**G2 · Las capas «Viento X m» pintan la COMPONENTE U, no la velocidad.**
`maps.js:154-161`: `v:'wind_u_component_10m'` con rótulo «km/h». Verificado en
el vendor: la librería NO combina U y V. Con viento del este o del sur el mapa
pinta calma bajo un rótulo de velocidad. **Es el peor de todos: un dato que
miente en la capa del viento, que es la que decide.** Opciones: pedir
`wind_speed_XXm` si el servicio la publica (comprobar antes), o retirar el
color y dejar barbas + valores del módulo (que `barbas()` ya calcula bien).

**M3 · RANGOS no cubre `t850`** (`maps.js:291-298`): si la tesela cambia a
Kelvin, pintaría 290° sin el «OJO» de la barra. Añadir `t850: [-60, 45, '°C']`.

**M4 · LENTOS con 3 IDs muertos** (`maps.js:285`): `gfs_global`, `gfs025`,
`icon_global` no existen; los reales son `ncep_gfs013`, `ncep_gfs025`,
`dwd_icon`. El cartel «es de los que más tardan» nunca sale para los globales.
Añadir prueba: todo ID de LENTOS existe en TMODELS.

**M5 · `om_cambiado` se escribe y no lo lee nadie** (`maps.js:2145`): tras el
auto-cambio a ICON-EU y la recarga no queda aviso. Mismo patrón que
`fueraDeRango()` declarado y sin llamar. Leerlo en `recuperarTrasRecarga()` o
quitarlo.

**M6 · El cartel de la 3.ª caída recomienda ICON-EU… estando ya en ICON-EU**
(`maps.js:2153`). Hacerlo dependiente del modelo actual (no recomendarse a sí
mismo, como se hizo con ICON-D2 el 26-08).

**M7 · 10 días: el icono solo mira 6-20 h** pero pop/mm/⚡ son de 24 h →
tormenta nocturna con icono de sol. Mínimo: si `tormenta` es true, el icono no
puede ser 0-3.

**L8** · último color de tempc/t850 no aparece en la leyenda (el `slice(0,-1)`
copiado de humedad, donde era inocuo porque duplicaba el último color).
**L9** · etiqueta «0.00» en la barra de temperatura (usar toFixed(0) con enteros).
**L10** · capa `vis`: `unit:'m'` en el pie y km en leyenda/valores/popup.
**L11** · `avisoSinDominio` recomienda «Para Euskadi» aunque el sitio esté en
Calpe, y puede recomendar el modelo que acaba de fallar.
**L12** · botón ECMWF HRES sigue como «El de referencia» sin avisar de que es
el que tumba el mapa (precedente: ICON-D2 lleva su «OJO» desde el 26-08).
**L13** · engelante (48/56/57/66/67) sin marca de hielo; chubascos idénticos a
lluvia; granizo (96/99) igual que tormenta simple; copos de nieve invisibles
(los puntos caen dentro de sus propias rayas, `app.js:515-516`); rayos del sol
del código 2 recortados por el viewBox (`app.js:521`).

## 3 · MAPA LENTO — DIAGNÓSTICO CON CRONÓMETRO (medido en navegador limpio)

| caso | tiempo | red |
|---|---|---|
| Primera capa al abrir (ICON-EU precip) | 11,6 s | 0,17 s (43 peticiones) |
| Cambiar de capa dentro del mismo modelo | 0,8-1,2 s | — |
| Volver a una capa ya vista | 1,1 s | — |
| Cambio a modelo caliente (ECMWF25) | 1,2 s | — |
| **Cambio a modelo FRÍO (ARPEGE 1.ª vez)** | **10,3 s** | — |
| Cambio a modelo frío ya usado hoy (GFS25) | 2,6 s | — |

**Las mejoras de hoy funcionan** (dentro de un modelo, ~1 s). El monstruo es
**abrir un modelo frío**: el CDN de Open-Meteo sirve helada la pasada nueva la
primera vez que alguien la pide — de 11,6 s solo 0,17 son de red nuestra.

Mejoras diseñadas y **sin aplicar**:
- **A) `precalentarModelos()`**: tras pintar la capa activa, pedir por la cola
  la tesela centro del mismo paso en ICON-EU / ECMWF25 / ARPEGE. Una vez por
  sesión. Convierte los 10 s en ~1 s la primera vez que él cambia de modelo.
- **B) pasada anunciada sin ficheros (404)**: medido a las 21:20 —
  `latest.json` de ICON-EU ya anunciaba la 17z y los `.om` daban 404. Guardar
  el último meta bueno por modelo y caer a él, con cartel propio.

## 4 · LA PORRA DEL MARTES (arbitrar por la mañana con sus fotos)

- **Nuestra app (ARPEGE, estreno como dueño del cielo)**: madrugada despejada,
  **seco**, sol/sol-nube 8-10, nublándose desde las 11. 15-24°, rachas 41-46 a 40 m.
- **Euskalmet (oficial)**: madrugada NUBOSA, **llovizna 0,1-0,3 a las 06-07**,
  sol desde las 8. Máx 21.
- ECMWF/GEM/ICON: 0,1-0,3 mm al alba (con la oficial). AROME/GFS/HARMONIE: seco.
- **La pelea es el alba: mojada o seca.** Árbitro: sus fotos + pluviómetro de
  Almike. Si ARPEGE pincha, se le aplica la misma vara que a ICON (dos días de
  fotos, no uno).

## 5 · REGLAS QUE HAN GUIADO ESTA NOCHE (no re-descubrirlas)

- Una comprobación que no puede fallar no comprueba nada (norma nueva en CLAUDE.md).
- Un hueco JAMÁS se pinta de cero — y eso incluye los dibujos.
- La regla vive en UNA función; texto y dibujo beben de la misma.
- Emparejar por timestamp, nunca por índice, entre dos consultas distintas.
- Medir antes de tocar; el candado antes de publicar; y la tercera pasada
  sobre lo ya arreglado.

## 6 · POR QUÉ LA TAREA DE LAS 03:30 NO HIZO NADA (medido, 01-09 06:20)

Leído su propio registro de sesión (`8a68a96b….jsonl`, 49 mensajes): arrancó
bien, leyó el traspaso, detectó que el código iba por delante del documento
(v-2335 contra v-2202 que decía el doc) y **lanzó el Workflow de los dos
equipos… en segundo plano**. Ahí acaba la sesión. Los agentes murieron con
ella sin devolver nada. No fue el límite de uso: fue el mecanismo.

**REGLA NUEVA para tareas programadas:** nunca dejar trabajo en segundo
plano — o se trabaja en línea, o se espera el resultado del Workflow y se
aplican los arreglos ANTES de terminar. Y publicar cada arreglo en cuanto
esté (con su prueba y candado verde), no acumular para el final.
Grabado en la propia tarea.

## 7 · EL DEPLOY QUE SE ATRAGANTABA (resuelto, 01-09 06:12)

Tres veces la noche del 31-08. La causa NO era el CLI ni el Mac: Vercel
tardaba más de la cuenta en confirmar el despliegue, el CLI salía con error
**aunque la publicación estuviera subiendo bien** (comprobado las tres veces:
la versión servida era la nueva), y el `| tail -3` del script se tragaba el
código de salida. Ahora `deploy.sh` reintenta hasta 3 veces, conserva el
código real con PIPESTATUS y **aborta con ruido** si de verdad falla.
Publicado en v2026.09.01-0612 con 3 pruebas en `pruebas-servidor.cjs`.

## 8 · LOS TRES GRAVES DEL 01-09 (dos equipos, verificados en pantalla)

Publicados en **v2026.09.01-0726**. Los tres los encontró el repaso de
modelos que él pidió, y los tres estaban afectando a su vista POR DEFECTO.

**G-A · Los 10 días salían VACÍOS con AROME.** `completar()` deja en
`hourly` la clave sintética `weather_code_lluvia` (el código del dueño del
agua, para el sirimiri). `completarLargo()` mandaba TODAS las claves a
Open-Meteo y esa no existe: **HTTP 400 a la petición entera** (reproducido
a mano contra el proxy), y el `catch` mudo se lo tragaba. Medido en
producción con AROME: `rellenoDesde` null y **8 de 10 días en blanco**, con
el UV al lado (que llega por otra puerta) para que pareciera avería.
→ Filtro `!k.endsWith('_lluvia')`, y el catch ya apunta `rellenoFallo`.
→ **Verificado tras publicar: 10 de 10 días con dato.**

**G-B · El reparto usaba el modelo de la carga ANTERIOR.** `completar()`
decide con `modeloDato()` (= `f._modelo`) y ese sello se ponía DESPUÉS. Al
tocar el selector, el dueño del agua se filtraba a sí mismo por creerse «el
cargado»: el agua se quedaba en la de AROME y la probabilidad venía de ICON.
Solo fallaba al cambiar de modelo — justo cuando él compara.
→ El sello va antes de repartir. **Verificado encadenando ECMWF → AROME →
ICON → AROME: el agua sigue siendo del europeo por acierto en los cuatro.**

**G-C · La app afirmaba que NO podía avisar de tormenta, pudiendo.** El
cartel decía «AROME HD no publica estado del cielo ni la tapa · por esa vía
no puede avisar de tormenta ni aunque la haya» — falso desde que el cielo lo
pone ARPEGE y la tapa se presta de ICON, que es con lo que decide `assess()`.
Encima mandaba al Automático, que él quitó el 30-08.
→ Ahora distingue «sin dueño» (se queja) de «prestado» (lo dice y añade que
el aviso sigue en pie).

**Siete pruebas nuevas** lo fijan, y una EJERCITA el caso que fallaba (la
lista de campos con la clave sintética dentro), no solo el que pasa.

### Y el guardia de FAMILIA (v2026.09.01-0658), que es la respuesta a su queja

*«ayer me comentaste que ya no pasaría y sigue pasando, a diario»* — y tenía
razón: el 31-08 se arreglaron tres contradicciones y se pusieron pruebas
PARA ESAS TRES; al día siguiente la familia asomó por un renglón nuevo.
Ahora `paridad.cjs` monta el estado que produce el fallo (agua a 0, cielo
anunciando llovizna, otros modelos viendo agua), repinta las tres vistas y
barre TODA tarjeta buscando el patrón prohibido: anunciar agua y negarla a
la vez. **Probado rompiendo el arreglo a propósito: salta con su frase
exacta.** Mi primera versión daba ✓ con el fallo puesto (la trampa iba en
`fc.hourly` cuando las franjas leen `S.data.hours`) — era un adorno y se
tiró. Un guardia que no puede fallar no guarda nada.

## 9 · VERCEL SUSPENDIÓ EL ALMACÉN (01-09-2026, mediodía)

**Su pantallazo lo dijo con todas las letras: «Vercel Blob: This store has
been suspended».** Reproducido desde fuera: `list()` y `head()` funcionan
(o sea, LOS FICHEROS ESTÁN AHÍ), pero leer contenido y escribir dan 403.

**QUÉ SE HA PERDIDO: NADA.** 48 ficheros, 6,8 MB, todos listados con su
tamaño — 20 emplazamientos (2 KB), buzón (0,7 KB), archivo de notas (45 KB),
móviles apuntados (1,2 KB), ajustes y **39 fotos suyas de campo** (6,5 MB).
Bloqueados, no borrados.

**QUÉ SE HA CAÍDO, y NO es solo lo de las fotos:**

| | estado |
|---|---|
| **Avisos push a su móvil** | **CAÍDO** — `empujar()` llama a `leer()` (moviles.json) y con el almacén suspendido lanza: no sale ni un aviso |
| Buzón de campo y fotos | CAÍDO |
| Sincronización Mac↔móvil (ajustes) | CAÍDO (devuelve `{}` en silencio) |
| Lista de emplazamientos en el servidor | CAÍDO (devuelve `[]` en silencio) |
| **Pronósticos, semáforo, rayos, mapas, cámaras, radar** | **BIEN** — no tocan el almacén |

**LO QUE HAY QUE MIRAR (es de su cuenta, no lo toco yo):** vercel.com →
proyecto → Storage → el Blob store dirá el motivo. 6,8 MB es ridículo para
el tope de almacenamiento del plan gratis, así que lo más probable es
**operaciones o tráfico**, o un tope de gasto de la cuenta.

**Y el dato que importa para decidir: las fotos son 6,5 de los 6,8 MB.**
Los datos que de verdad hacen falta —móviles, torres, ajustes— pesan
**50 KB entre todos**. Él ya ha dicho que las fotos las manda por el chat,
así que si hay que mover algo a otro sitio gratis, es una cosa minúscula.

**PENDIENTE, cuando él lo diga:** los avisos al móvil no pueden depender de
esto. O se levanta el almacén, o los 50 KB críticos se mudan a un almacén
gratis. Mientras tanto, sus avisos de tormenta NO le llegan al teléfono.

## 10 · LA TARDE DEL 01-09: CUATRO EQUIPOS SOBRE SUS CAPTURAS

**ARREGLADO Y VERIFICADO EN PANTALLA (v2026.09.01-1529):**

**La tarjeta de 10 días escondía rachas por encima de su listón.** Del día 3
en adelante el número lo pone ECMWF (es quien rellena), y los demás modelos
se pedían pero NO se leían. Medido por /om en Bermeo:

| día | tarjeta | de verdad |
|---|---|---|
| **dom 6 sept** | **37 en VERDE** | **ICON 54** — cruza su aviso de 45 |
| **mié 9 sept** | 35 | **Automático 46** |

En la pantalla con la que planifica la semana. Ahora la tarjeta avisa —«⚠ ICON
da 54 km/h — tu listón es 45»— y el criterio es SU listón (45/60), no un
porcentaje: se calla cuando todos están del mismo lado, aunque se separen
27 km/h. Cuatro pruebas, una de ellas con el caso del tope.

**Antes, en la misma tanda:** la Guía en km/h (nunca kt) con guardia
permanente · ningún texto visible manda ya a «la pestaña Torre» (guardia que
compara contra el menú de verdad) · el globito de las barbas en km/h · las
barbas en tandas en vez de 192 esperas encadenadas · `revisar.sh` ya no puede
saltarse las pruebas si falla la cobertura · el reintento del deploy ahora
reintenta de verdad.

**RETIRADO POR MEDICIÓN (y escrito el porqué):** se intentó dar flechas de
dirección a la capa de Ráfagas —declaraba `arrows: true` desde siempre y no
dibujaba ni una—. Con las dos componentes de 10 m tampoco salieron:
`getValueFromLatLong` responde *«State not found for key: …?variable=…»*, que
en esa librería significa «ese fichero no lo tengo abierto». Además pedía doce
teselas de más que fallaban. Se quitó el `arrows: true` mentiroso y queda
apuntado para cuando alguien resuelva la precarga por variable.

**CORRECCIÓN DE MI PROPIO DIAGNÓSTICO:** dije que las barbas costaban 20 s en
la capa de Ráfagas. **Era falso**: esa capa nunca las ha dibujado, así que mi
A/B estaba contaminado. Los 10-20 s de esa capa **no son de red** (medido: una
sola petición de 4 ms) — son de descodificación o pintado, y la causa sigue
SIN encontrar. No inventarla.

## 11 · PENDIENTE DE LA MISMA TANDA (los equipos lo dejaron medido)

**G-1 · El semáforo por hora usa la comparativa de OTRO emplazamiento.**
`peorRacha(h)` lee `S.comparativa`, que es del sitio ABIERTO, pero `assess()`
corre dentro de `buildHours()` para los VEINTE emplazamientos de «Mis
estaciones». Cada fila —su color, su tira de horas, el motivo «lo dice ICON»—
se calcula con las rachas medidas en otro sitio. **Es de decisión: mirar.**

**G-2 · El veredicto «se pasó X km/h» resta dos números distintos.** La celda
enseña el máximo de los cinco (`rachaCinco`) y la resta usa solo el modelo
cargado (`H.gust10`). Por eso su captura de Mungia decía «28 · 12 · se pasó
15» (28−12=16). Que la resta use el mismo número que se pinta, y que la frase
diga de quién es.

**G-3 · El chip de nubes se compara CONSIGO MISMO y sale en el 72 % de las
horas.** `cieloRaro()` excluye al modelo CARGADO en vez de al DUEÑO del dato
(ARPEGE desde el 31-08), así que ARPEGE entra en «los otros». Medido sobre 192
horas: sale en 138, y en 64 de ellas su propio número está a menos de 10
puntos de la mediana que anuncia. El aviso estaba calibrado para el 8-9 %.
La lluvia ya lo tiene bien (`duenoLluvia()`); al cielo no se le llevó.

**G-4 · En 10 días, `desacuerdoDelDia` devuelve null con menos de 3 modelos y
la tarjeta lo trata igual que «se ponen de acuerdo».** Los días 8, 9 y 10 solo
llegan ECMWF y GFS, así que el chip de temperatura no puede salir NUNCA — y no
se dice. Un hueco leído como acuerdo.

## 12 · LOS AVISOS AL MÓVIL, DE VUELTA (01-09-2026, ~17:00)

**Por qué se cayeron:** Vercel suspendió el almacén con **«Blob Advanced
Operations 2K / 2K»** — agotadas las 2.000 escrituras del mes del plan gratis
(su pantallazo del panel). **No era el espacio** (6,8 MB de 1 GB). Y el
gastador principal éramos nosotros: el vigilante escribía su estado **cada 30
minutos**, 1.440 veces al mes, casi siempre para guardar lo mismo.
**Su ciclo se renueva el 26 de septiembre.**

**Cómo se arregló, en tres piezas y sin pagar nada:**

1. **Los avisos salen del almacén.** `api/suscribir.mjs` mira ahora DOS
   sitios: el almacén (cuando funcione) y la variable de entorno
   `MOVILES_EXTRA`. Se juntan por `endpoint`, así que un móvil en las dos
   listas no suena dos veces. Su teléfono está apuntado ahí a mano.
2. **La app le da el código cuando el servidor no puede guardarlo**, con
   botón de copiar — que seleccionar un JSON de 300 caracteres en el móvil
   es un suplicio.
3. **El vigilante deja de gastar cuota**: solo escribe si algo cambia
   (comparando sin la hora, que si no cambiaría siempre), más un refresco
   diario para que el pulso no envejezca. De ~1.440 escrituras al mes a unas
   decenas.

**Y LA CAUSA REAL DE QUE NO SONARA, que costó encontrar:** el envío salía bien
—Google lo aceptaba con `ok:true` las tres veces— y el teléfono no pintaba
nada. **Era Chrome**, que había marcado la app como *«posible spam»* y le
había **silenciado las notificaciones por su cuenta**. Como llevaban días sin
llegar (por el almacén), su heurística las dio por basura. Se levanta en
Chrome → Configuración → Notificaciones → «Revisar» → Permitir, y quitando
«notificaciones más silenciosas».

**LECCIÓN QUE HAY QUE TENER DELANTE:** *«el envío correcto no es el aviso
recibido»*. Entre nuestro `ok:true` y su bolsillo hay dos porteros que pueden
tirar el aviso sin decírselo a nadie —**Chrome y el ahorro de batería del
móvil**— y ninguno de los dos nos avisa. Con una torre de 60 m encima de él,
**esa vía no puede ser la única**: queda pendiente montar el aviso por correo
como segunda pata. Él ya lo tenía escrito como norma: *el correo solo si el
push no llega*.
