# PARA QUÉ EXISTE ESTA APP: EL POSTE DE LOS FUSIBLES

**Suyo, 01-09-2026, explicando por fin la cadena entera** — y es el trabajo
más frecuente y más peligroso que hace, no el de subir a la torre:

> *«Ves el poste con 2 cajas de fusibles que está a 3 metros del suelo, pues
> esos con el viento, rayos se rompen los fusibles y dan paso al contador que
> está más abajo, y del contador va al cuadro eléctrico, y nos quedamos sin
> luz y tengo que reparar esos fusibles. Y por eso tengo que saber si me podré
> subir o no con lluvias, vientos y rayos.»*

**LA CADENA, tal cual:**

    temporal → rompe los fusibles del poste (a 3 m)
             → el contador se queda sin paso
             → el cuadro eléctrico sin tensión
             → el emplazamiento sin luz, tirando de baterías
             → ÉL SUBE 3 m POR ESCALERA A CAMBIAR ESOS FUSIBLES

**Y aquí está lo que lo hace distinto de todo lo demás:**

1. **VA DURANTE EL TEMPORAL EL 90 % DE LAS VECES.** Corregido por él el
   01-09-2026 con dos palabras —*«durante el 90 %»*— cuando yo había escrito
   «después, o durante». **Es al revés de lo que yo suponía, y lo cambia
   todo.**

   La avería la causa el mal tiempo, y el servicio no espera: le toca subir
   **con la tormenta encima**, no cuando ha escampado. Así que la pregunta que
   le importa NO es «¿qué tiempo hará hoy?» ni «¿ha pasado ya?». Es:

   > **«Esto que tengo encima ahora mismo, ¿me deja subir? Y si no, ¿a qué
   > hora me deja?»**

   **Consecuencias, y son de diseño, no de adorno:**
   · Lo que más vale de esta app es **la ventana**: «ahora no, a partir de las
     20:30 sí, y te dura 3 horas». Eso es `cuandoSalir()` / `cuandoSePuede()`,
     y no es una función más: es LA función.
   · El **rayo en tiempo real** pesa más que el histórico. El mapa de AEMET
     llega con hasta 70 min de retraso, y **70 minutos, estando él debajo de
     la torre, son una eternidad**. Por eso Blitzortung en vivo, el radar y la
     regla del trueno no son el respaldo: en «durante» son la fuente buena.
   · Los **avisos al móvil** dejan de ser una comodidad: si está subido a la
     escalera y se acerca una célula, el aviso es lo único que se lo dice.
     (01-09: caídos por la suspensión del almacén de Vercel — arreglarlo es
     prioridad, no mantenimiento.)
   · Y un pronóstico a 10 días no le salva de nada ese día. **La hora
     siguiente, sí.**

5. **Y NO PUEDE ESPERAR A QUE ESCAMPE, PORQUE AL OTRO LADO HAY GENTE.**
   Suyo, 01-09-2026, cerrando la explicación:

   > *«No podemos dejar sin cobertura a la gente y sin internet. Y además, si
   > esa cae, esa tira 20 estaciones más — hay mucho tráfico en esa.»*

   Ese emplazamiento es **nodo de tránsito**: si se queda sin luz y agota
   baterías, **se lleva por delante otras veinte estaciones**. No es un sector
   caído: es una comarca sin móvil y sin internet, con las llamadas de
   emergencia dentro.

   **LO QUE ESTO SIGNIFICA PARA LA APP, y es lo más importante de todo este
   fichero:**

   > **LOS DOS ERRORES CUESTAN. Un «sí» equivocado lo puede matar. Un «no»
   > equivocado deja a una comarca sin teléfono más horas de las necesarias.**

   Así que **ser conservador NO es gratis y no es automáticamente seguro**.
   Una app que diga «no» a lo bruto para cubrirse le está costando cobertura
   a mucha gente, y además él dejará de creerla — y el día que el «no» sea de
   verdad, subirá igual.

   Por eso esta app no puede quedarse en un semáforo. Tiene que dar **la
   ventana exacta**: no «hoy malo», sino «**ahora no; de 20:30 a 23:30 sí, y
   ahí te da tiempo**». Esa precisión no es lujo: es lo único que le permite
   hacer su trabajo sin jugársela.

   Y por eso los guardias, las pruebas que pueden fallar y el «vacío jamás»
   son innegociables: **la precisión aquí es seguridad por los dos lados.**

6. **PERO NO TODAS SON IGUALES.** Lo matizó él en el acto:

   > *«Hay otras que solo se cae ella, otras que tiran 2 o 3, etc.»*

   O sea que **el peso del «no» cambia según el sitio**: aguantar una hora más
   en una que solo se cae ella no le cuesta a casi nadie; aguantar esa misma
   hora en la de transición deja a una comarca sin teléfono.

   **Y ESO ES CRITICIDAD, QUE ES SUYA Y NO SE INVENTA.** El 24-08 puso el
   límite con todas las letras: *«baterías, criticidad del nodo y si el camino
   es accesible de noche — eso suele ponerlo en Argos, hay muchas variables,
   eso mejor no tocar»*. **Sigue en pie: la app NO deduce a cuántas arrastra un
   emplazamiento, ni pondera el riesgo con eso, ni le empuja a subir.**

   Lo único que tendría sentido —y solo si él lo pide— es un **dato suyo por
   emplazamiento**, escrito a mano como la cota: «esta arrastra 20 / arrastra
   3 / cae sola». Con eso el parte podría ordenárselas cuando hay varias en
   rojo a la vez, que es su pregunta de coordinador: **no «¿qué tiempo hace?»,
   sino «¿a cuál mando primero?»**. La app enseñaría su número; no lo
   calcularía.
2. **Sube a un poste de intemperie colgado de línea aérea… y con una torre de
   60 m al lado haciendo de pararrayos.** Él lo remató así: *«y la caseta
   pegada y la torre de 60 metros al lado, de pararrayos»*. Esto es lo que
   ata todo el veto: **la torre no le protege, le ATRAE el rayo encima**. Es
   el captador más alto en varios kilómetros, la caseta está pegada, el poste
   está debajo y la línea aérea le mete la sobretensión en las manos. Por eso
   el rayo veta **el emplazamiento entero** y no solo subir a la torre — y por
   eso el veto es a 15 km / 90 min, no los 10 km de la regla del 30/30: el
   error tiene que caer del lado seguro.
3. **Y lo hace en tensión, a 3 metros, sobre una escalera.** Con lluvia o
   sirimiri esa escalera y esos armarios resbalan, y con guantes dieléctricos
   mojados tampoco se abre un cuadro. Es su criterio del 25-08 y es este
   trabajo el que lo justifica.
4. **A 3 m la ráfaga importa menos que en la torre, pero no es cero**: mueve
   la escalera y le abre las tapas en las manos.

**POR ESO NOS MACHACA CON LOS FALLOS TONTOS, y tiene toda la razón.** Un
número mal puesto aquí no es una app fea: es un hombre subido a una escalera,
a tres metros, con las manos en unos fusibles vivos, bajo una línea aérea que
un rayo acaba de reventar. Cada «fallo tonto» de los que se han cazado estos
días —el verde con 54 km/h detrás, el «sin lluvia» con llovizna al lado, el
cartel que decía que no podía avisar de tormenta— se leía justo antes de subir
ahí.

---

# NO LE HAGAS ELEGIR LO QUE PUEDE ELEGIR LA APP

**Suyo, 01-09-2026, después de tres mensajes preguntando qué modelo poner
en cada sitio:** *«y luego si pongo Bermeo, ¿dónde tengo que poner…?
menudo lío»*.

Y tenía razón: **el lío se lo estábamos dando nosotros.** Le habíamos
puesto un selector de modelo que parece una decisión y no lo es, porque:

· en Bermeo el **Automático** le da AROME 35 horas de cada 48 (medido el
  24-08), que es justo lo que elegiría él;
· fuera de Europa se cae solo al que llegue —comprobado con Manila: el
  selector no se movió y cargó ICON—;
· y **el agua y el cielo son del europeo pase lo que pase** (el cielo
  pasó a ECMWF el 02-09-2026, ver más abajo), porque eso se decidió con
  medidas, no con el botón.

**LA RESPUESTA QUE SE LE DIO, Y QUE VALE PARA SIEMPRE:**

> **Déjalo en Automático y no lo toques nunca más.** El selector NO es una
> decisión que tenga que tomar: es una herramienta para curiosear cuando
> quiera comparar («a ver qué dice ICON de esta racha»).

**Y LA REGLA GENERAL, que es la que hay que aplicar a lo que venga:**

Él ya lo dijo el 28-08: *«vosotros, con ponerme los datos, me sobra; el
resto es cosa mía»*. Así que **cada vez que la app le pida elegir algo,
hay que preguntarse si puede elegirlo ella con lo que ya sabe.** Si puede,
que lo elija y lo DIGA — nunca que lo elija en silencio. Lo que se le
pregunta tiene que ser lo que solo él sabe: su cota, sus umbrales, dónde
trabaja, si sube o no.

Un ajuste de más no es una opción: es trabajo que le pasamos a él.

---

# UNA COMPROBACIÓN QUE NO PUEDE FALLAR NO COMPRUEBA NADA

**Suyo, 30-08-2026 por la noche, y es la mejor pregunta que ha hecho:**

> *«¿Cómo puede haber fallos si repasáis 2 y 3 veces?»*
> *«Me juego la vida en tomar una decisión.»* · *«Esto no es broma, señores.»*

**La respuesta honesta: porque repasar solo encuentra lo que ya sospechas.**
Ese día la ficha de Torre llevaba días enseñando un **✓ verde**: *«El modelo
lee tu sitio bien. 0 m de diferencia»*. Pasó todos los repasos, porque los dos
números cuadraban — y cuadrar parecía la prueba.

**Nadie había medido de dónde salía cada número.** Al medirlo:

| | |
|---|---|
| tres modelos, tres nudos distintos, el mismo punto | los tres devolvieron **285 m**, calcado |
| dos puntos a 1,5 km, el mismo modelo | **997 m** y **285 m** |

O sea que `fc.elevation` **no es la altitud del nudo del modelo: es la del
punto que le pides**, del mapa de alturas de Open-Meteo. Y la cota automática
salía de `/om?api=elev`, **que es ese mismo mapa**. La app estaba restando un
número consigo mismo: **siempre 0, siempre visto bueno**.

**Un ✓ que no puede salir mal no informa: da confianza falsa**, y debajo de él
se decide si sube gente a un monte de noche.

## LA REGLA

1. **Antes de comparar dos números, saber de dónde sale cada uno.** Si salen
   de la misma fuente, no se comparan: se dice que son la misma cosa.
2. **Toda afirmación verde tiene que poder ser roja.** Si no existe ningún dato
   con el que salga mal, no es una comprobación: es un adorno. Su prueba tiene
   que ejercitar **el caso que falla**, no solo el que pasa.
3. **Medir gana a repasar.** Los tres fallos gordos de este proyecto —la capa
   de presión en «10 hPa», `fueraDeRango()` escrito y sin llamar, y este— los
   cazó una medición, no una lectura. Repasar dos veces sigue haciendo falta;
   no basta.

## Y EL PASO QUE FALTABA: ROMPERLO PARA VER LA PRUEBA EN ROJO

**Suyo, 01-09-2026, después de que le contara el mismo arreglo tres días
seguidos:**

> *«esto me suena de ayer o anteayer y vuelve a fallar»* ·
> *«mañana no sé, pero pasado ¿otra vez lo mismo?»*

La regla 2 de arriba ya estaba escrita desde el 30-08. **El problema es que yo
no la ejecutaba**: escribía la prueba, la veía verde y publicaba. Y una prueba
que solo ha estado verde no ha demostrado nada — no se sabe si está mirando.

Ese día pasó TRES veces, las tres cazadas solo por romper a propósito:

| lo que hice | lo que descubrí al romperlo |
|---|---|
| guardia nueva del almacén, verde a la primera | rompí `calibrar` para que dijera «0 casos» → **roja**. Valía. |
| guardia nueva de la red, 18 verdes a la primera | rompí `rayos` para que dijera «0 descargas» → **siguió verde**. La prueba leía el cuerpo como texto y nunca lo convertía a datos: **tenía dentro el mismo fallo que perseguía**. |
| aviso de Euskalmet, verde con pruebas de texto — **y publicado** | al arrancar la app de verdad, **el aviso no salía**. Lo di por bueno sin verlo en pantalla. |

### La regla, operativa

**Una prueba no cuenta hasta que se ha visto ROJA.** El orden es:

1. Se escribe el arreglo.
2. Se escribe la prueba y sale verde.
3. **Se desactiva el arreglo a propósito** (un `if (false &&`, un valor cambiado)
   y se vuelve a correr.
4. Si **no** se pone roja: la prueba no vale, y lo que hay que arreglar es la
   prueba. No se publica.
5. Se restaura el arreglo, se comprueba verde otra vez, y entonces sí.

Y una segunda, del mismo día: **una prueba que lee el código con `regex` no es
una prueba, es un recordatorio.** Sirve para que un texto no desaparezca; no
sirve para saber si algo funciona. Para eso hay que ARRANCARLO: `abrir.cjs`
levanta la app entera, `prueba-almacen-caido.mjs` y `prueba-fuente-caida.mjs`
levantan las funciones con la avería puesta. Todo arreglo que se vea en pantalla
va probado por ahí, no por `regex`.

---

# VACÍO JAMÁS. NADA.

**Suyo, 29-08-2026, y es una norma, no una preferencia:** *«vacío jamás nada»*.

Salió al montar el alcance de los modelos. Yo iba a dejar los días 3 al 10 en
blanco con un cartel, porque AROME solo llega a 48 h. Él lo cortó en seco y
propuso lo correcto: *«si solo llega a 2 días, el resto mete el que llega, pero
siempre se actualizará, y en 2 días al menos tenemos lo bueno»*.

**UN HUECO NO INFORMA DE NADA, Y ENCIMA MIENTE**: se lee igual que «aquí no
pasa nada». Es el mismo error que el vigilante mudo, el mapa sin memoria y el
buzón que decía «0 notas» cuando no podía leer.

## La regla, en dos partes

1. **Donde debería haber un dato y no lo hay, se pone lo que se pueda y se dice
   de dónde sale.** Nunca en blanco, nunca en silencio. Si de verdad no hay nada
   que poner, se escribe **por qué** no lo hay.
2. **Lo que no aplica sí puede no aparecer.** El oleaje en Vitoria no es un
   hueco: es que allí no hay mar. Eso no se rellena ni se explica.

## Cómo se cumple hoy

- **Alcance del modelo**: AROME llega a 48 h; de ahí en adelante rellena ECMWF
  y la app dice desde qué hora (`completarLargo()`, `RELLENO_LARGO`).
- **Campos que un modelo no publica**: se piden al que sí los publica y se
  nombra (`QUIEN_LO_MIDE`, `deQuienSale()`).
- **Estación sin pluviómetro**: la lluvia se toma de la más cercana que sí mida,
  con su nombre (`medidasDeTodos()`).
- **Modelo que no da un campo**: sale «no la publica», nunca un cero.
- **Buzón ilegible**: contesta el error, no «0 notas».
- **Vigilante mudo o con lista vieja**: lo canta en el pulso.

---

> **LEE PRIMERO `TRASPASO.md`** (en esta misma carpeta). Ahí está el estado al
> día, lo que queda pendiente y las trampas que ya han picado. Se escribió el
> 26-08-2026 por orden suya: *«si se te satura ese chat, pásale la info al otro
> chat fijado»*. Un chat lleno ya no puede avisar a nadie, y las sesiones mueren
> sin decir nada — por eso el relevo va por fichero y va apuntado aquí, que es
> lo único que se lee siempre.
>
> Y antes de tocar nada: **con esta app se decide si sube gente a una torre**.
> Su veto es el **rayo**, no el viento.

# Aitor Meteo · app de decisión para trabajo en altura

> ## EMPIEZA POR AQUÍ
>
> Este fichero es largo porque guarda todo lo medido. **Para ponerte al día
> en un minuto, lee solo este bloque.** Lo de abajo es el histórico, y se
> consulta cuando haga falta.
>
> **Quién es.** Aitor coordina el mantenimiento de estaciones de **Vantage
> Towers y Vodafone** (y casetas de Renfe) en Euskadi. **No sube: reparte
> gente.** Jornada de 07:00 a 14:30, guardia 24 h una semana de cada tres —
> pero **decide siempre**, porque cuando los de guardia son los chavales,
> las llamadas las resuelve él.
>
> **Qué hace de verdad.** El 70 % de las veces va a la caseta o al armario
> de a pie de torre y al poste de los contadores. Subir a la torre es
> **una vez al año**. Tiene emplazamientos en el monte, en azoteas, en
> metros, teatros, campos de fútbol y garajes subterráneos.
>
> **Lo que decide.** *«Debo acudir siempre y cuando no caigan rayos, porque
> la torre está pegada a la caseta y es un pararrayos.»* El viento no le
> para. **El rayo sí, y veta el emplazamiento entero.** Y si el coche
> llega, va.
>
> **La app está en Vercel:** https://weather-app-ochre-one-76.vercel.app
> Publicar: `./deploy.sh "qué has cambiado"`. Netlify ya NO se usa —
> suspendió el sitio el 24-08-2026 por agotar créditos.
>
> **Las tres reglas** (más abajo, con detalle): datos reales y nada
> inventado · si no hay dato, se dice · verificar en pantalla antes de
> publicar.
>
> **LO QUE NO SE TOCA**, dicho por él: baterías, criticidad del nodo y si
> el camino es accesible de noche. Eso está en Argos y es criterio suyo.
> Tampoco los umbrales del semáforo sin preguntarle.
>
> **Lo último que se hizo (25-08-2026, tarde):** la lluvia se dice en
> tres —**bien, poco o sirimiri**— y con sirimiri **no se sube** (criterio
> suyo). Antes, ese mismo día: aviso de **sirimiri**
> —que no existe en milímetros y la app no lo veía—, y las **cámaras**
> arregladas: imagen de 640, botón «El día» para rebobinar 24 h, y el
> rumbo calculado por nosotros porque el de Windy miente. Ver las dos
> secciones del final.
>
> Por la mañana: **la app ya lee los rayos.** Descargas medidas por la red de AEMET, hora a hora, con su
> distancia a cada emplazamiento; el rayo cercano y reciente pisa el
> semáforo y lo pone en NO APTO; y un bloque de «por dónde pasó» sobre
> sus diez sitios guardados. Ver *«Los rayos, por fin medidos»*.
>
> Antes de eso (24-08, noche): perfiles replanteados por «¿hay hierro
> alto encima?», bloque de acceso (nieve, hielo contra la cota, barro,
> ramas, niebla), «a qué hora escampa», y el aviso de calor de caseta,
> **retirado el 25-08**: la app da el tiempo de la calle y nada más. Ver
> *«Las dieciséis fotos que cambiaron la app»*.
>
> **Lo siguiente:** velocidad del mapa, un tablero de todos sus
> emplazamientos ordenados por riesgo, y sus umbrales de empresa.


## Con quién hablas

Aitor es **coordinador de torres de telefonía móvil en Euskadi** (Vodafone/Vantage,
y también antenas en azoteas). Con esta app decide **si manda operarios a subir a
una torre de 40 m**, muchas veces en el monte. Sus palabras: *«nos jugamos la vida»*.

Habla en castellano, de tú, sin jerga técnica salvo que la pida.

## Las tres reglas que no se rompen

1. **Datos reales, nada inventado.** Ni siquiera en ejemplos o pruebas. Si un dato
   se puede medir, se mide (altitudes: `/om?api=elev`, o la API de Open-Meteo).
   Una vez se puso «Sollube 680 m» de memoria cuando son 413 y disparó una alerta
   falsa. No repetir.
2. **Si no hay dato, se dice.** Un hueco en blanco NUNCA puede parecer «aquí no
   pasa nada». El fallo más grave que ha tenido la app fue perder teselas por
   saturación y dejar zonas sin pintar donde sí llovía.
3. **Verificar en pantalla antes de publicar.** `node --check` no basta.

## Publicar

```bash
"/Volumes/SSD EXTERNO/CLAUDE/weather-app/deploy.sh" "qué has cambiado"
```

**`deploy.sh` pasa `./revisar.sh` primero y ABORTA si falla.** No se puede
publicar código roto ni queriendo. `revisar.sh` hace `node --check` y luego
ESLint con `no-undef`, que es lo que caza las variables huérfanas.

Probado el 23-08-2026 metiendo un fallo del tipo de `ex`: `node --check`
lo daba por bueno y el deploy lo paró con código 1.

ESLint se instala solo la primera vez. `node_modules`, `package.json`,
`eslint.config.mjs` y `revisar.sh` NO se suben al sitio (comprobado: 404).
Sin internet, `revisar.sh` avisa y publica solo con la sintaxis revisada.

**Sitio: https://weather-app-ochre-one-76.vercel.app** (Vercel, equipo
`meteo-aitor-bermeo`). El viejo de Netlify **ya no se usa**.

Funciones: `/om` (datos), `/estaciones` (AEMET), `/mareas`, `/satelite`,
`/webcams` (Windy), `/radar-aemet`, `/omtiles` (reserva). El código sigue en
`netlify/functions/` y `api/` son envoltorios de una línea: la firma de las
funciones de Netlify v2 es la misma que la de las Edge Functions de Vercel.

Las claves viven como variables de entorno, **nunca en el código**.

## Qué hay montado

Pestañas: Torre · Mis torres · Ahora · Horas · 10 días · Mar · Radar · Rayos ·
Cámaras · Modelos · Avisos · Guía.

29 capas de mapa, 63 cámaras, **descargas medidas por la red de AEMET**, mapa en
vivo de Blitzortung, radar de AEMET, funcionamiento sin cobertura, ficha de altura
y cota por emplazamiento, y comparador de modelos.

Funciones de servidor: `/om`, `/estaciones`, `/mareas`, `/satelite`, `/webcams`,
`/radar-aemet`, **`/rayos`** y `/omtiles` (reserva).

## Ya verificado — no repetir

Contrastada el 22-08-2026 contra **AguaceroWx, Windy y Ventusky**. Las ráfagas
cuadran en las cuatro fuentes (33,1 vs 33 · 36,0 vs 37 · 17,3 vs 17). También
T850, punto de rocío, CAPE, CIN y reflectividad. **No hay fallos de datos.**

Tres hechos medidos que explican casi cualquier discrepancia futura:

- **La resolución cambia el número más que el modelo.** En Bermeo, ECMWF de 25 km
  daba 0,5 km/h en la celda de tierra y 27 en la del mar, a 10 km. El de 9 km,
  19,3. Antes de gritar «fallo», mirar si se lee tierra o agua y a qué resolución.
- **El viento medio baila; la ráfaga no.** Factor racha/viento: 1,15 sobre agua,
  1,7-2,4 sobre tierra. Comparar siempre ráfagas.
- **El CIN sale positivo aquí y negativo en AguaceroWx.** Misma cantidad.

De 10 m a 40 m el viento se multiplica por **1,36** de mediana en Euskadi, y por
1,74 uno de cada diez días (378 horas medidas con niveles nativos de AROME).

## Criterio meteorológico acordado

- **El CAPE por sí solo NO da NO APTO.** Es la gasolina, no la chispa. NO APTO
  solo con tormenta en curso: código de tormenta, o CAPE alto **y lloviendo**.
- **Para costa y monte, AROME HD (1,3 km).** ECMWF 25 km promedia mar y monte.
  Pero AROME solo llega a 2 días; para 7 días, ECMWF o GFS.
- **La nubosidad es el campo menos fiable de cualquier modelo.** No decidir con él.
- **Ninguna capa de modelo mide rayos**, y eso no ha cambiado: son campos de
  potencial. Lo que sí cambió el 25-08-2026 es que la app **lee las descargas
  medidas por la red de AEMET** (ver *«Los rayos, por fin medidos»*). Van con
  hasta 70 min de retraso; para el hueco reciente, Blitzortung —de voluntarios,
  no oficial— y el oído.

## Cómo trabaja de verdad

> El detalle completo está en **`../CONTEXTO-AITOR.md`**, que es común a todos sus
> proyectos. Aquí queda lo que afecta a esta app.


No todo es subir a una torre. También trabajan **abajo, en casetas a pie de
emplazamiento (CDC)**, y ahí el criterio cambia: el viento casi no cuenta, pero
el rayo y el acceso sí.

**Los domingos no se sale.** Ni por un sector caído: hace falta algo mayor,
una pérdida de servicio de las gordas. Conviene tenerlo en cuenta antes de
plantearle nada operativo en domingo.

**No todas las salidas son por la torre.** Buena parte de las averías de Vantage
son de otro tipo, y muchas dependen del tiempo:

- **Calor.** Es la cadena más importante y la que mejor se puede anticipar:
  se para el aire de la caseta (**Vantage**) → sube la temperatura dentro →
  se caen tarjetas Huawei de los nodos y RTN, y con ellas **sectores de Vodafone**.
  Una avería de infraestructura acaba en pérdida de servicio.
  Depende de la racha de días calurosos y de si la noche refresca, no solo de la
  máxima del día.
- **Sin tensión.** Las averías de **suministro son de Vantage**, así que salen
  ellos: revisar fusibles en contadores, comprobar acometidas. Suelen venir
  detrás de tormenta, cuando el rayo tumba la red — por eso interesa saber por
  dónde pasó la tormenta de anoche.

Los emplazamientos están en pueblos, ciudades, colegios, metros, hoteles y postes
eléctricos, no solo en el monte.

**Reparto de responsabilidades:** la infraestructura (casetas, suministro, aires,
desbroce, vallados) es de **Vantage**; el equipo de radio (nodos y RTN Huawei,
tarjetas, sectores) es de **Vodafone**. Aitor coordina sobre las dos.
En el norte **todo el equipo de Vodafone es Huawei**.

**Cómo se alimenta un emplazamiento:** cuadro eléctrico a **220/240 V** →
rectificadores → **−54 V de continua** (planta de −48 nominales, en flotación) →
equipo de radio. Ahí hay **baterías** dando respaldo.

Eso enlaza los dos tipos de avería: **el calor castiga las baterías y les quita
autonomía**, así que un verano largo deja el emplazamiento con menos aguante para
cuando la tormenta tumbe la red. Calor y falta de tensión no son problemas
independientes.

**La infraestructura es de Vantage Towers, no de Vodafone** (Vodafone le vendió las
casetas). Ellos llevan también el mantenimiento de las casetas: **desbroce de
maleza, reparación de aires y vallados.**

El desbroce tiene un riesgo propio que no es el de altura: **fuego**. Una
desbrozadora contra una piedra en monte seco enciende. Regla aplicable, la
**30-30-30**: más de 30°, menos del 30 % de humedad y más de 30 km/h de viento
= peligro extremo, no se trabaja con maquinaria. Cuenta también los días
acumulados sin llover.

**Dos ideas propuestas el 23-08-2026, pendientes de que él decida:**
1. Aviso de racha de calor por emplazamiento (máximas altas + mínimas que no bajan).
2. Aviso al abrir la app de por dónde pasó tormenta durante la noche, cruzando el
   eco de radar con sus emplazamientos guardados.
3. Semáforo de **día apto para desbroce** con la regla 30-30-30 y los días sin
   llover — mismo formato que el de altura, pero con criterio de fuego.

La app trata todo como trabajo en altura. Pendiente: un tercer tipo de
emplazamiento —**caseta**— junto a torre y azotea, con umbrales propios.

## La app se quedaba congelada en datos viejos (23-08-2026)

El fallo más grave encontrado hasta ahora, y **no daba la cara**.

`renderSea()` usaba `ex.map(...)` con los campos `time`, `height` y `type`
de la estimación de mareas por modelo que se retiró. Con la tabla oficial
de Euskalmet los campos son `cuando`, `altura` y `tipo`, y `ex` ni siquiera
estaba declarado: **la gráfica reventaba con «ex is not defined» en cada
pintado.** Solo en sitios de costa, o sea, en Bermeo.

La cadena de daños:

1. `renderSea()` va **en medio** de `paint()`, así que se llevaba por
   delante los avisos, la tabla de mareas y la línea
   «⚠ Datos caducados, pulsa actualizar». El aviso que existía justo para
   cantar los datos viejos lo mataba el propio fallo.
2. En `init()`, `paint()` se ejecuta **antes** de `go()`. Al petar, nunca
   se pedían datos nuevos, ni se comprobaba la versión, ni se registraba
   el service worker.
3. Resultado medido: **una previsión de hace 489 minutos en pantalla, sin
   una sola marca de que lo fuera.**

Puesto: `ex` arreglado (y las marcas de marea ya no dibujan la altura,
porque Euskalmet mide sobre el cero del puerto y la curva sobre el nivel
medio: se marca solo la hora con una P o una B); `paint()` va por
secciones con `seguro()`, y la que falla lo dice en su sitio; y el
arranque pide datos nuevos aunque el pintado de la copia falle.

**Regla que sale de aquí:** ningún fallo de una sección puede dejar en
blanco otra. Un hueco callado se confunde con «aquí no pasa nada».

## Las franjas del día mezclaban dos días (23-08-2026)

La lista de horas empieza en la hora actual, no a medianoche. Las franjas
se filtraban solo por hora, sin mirar la fecha, así que a las 19:00 la
franja «Tarde · 14–20 h» juntaba las 19 y 20 de HOY con las 14 a 18 de
MAÑANA, y como coge el código peor salía «Llovizna moderada» un domingo de
34° y sol raso. La franja «Mañana» era entera del día siguiente sin decirlo.

Ahora cada franja es de un solo día, dice el día cuando no es hoy, y el
título enseña las horas que de verdad cubre («Tarde · 19–20 h»).

## El mapa se quedaba sin memoria (23-08-2026)

MEDIDO: encadenando capas, el WebAssembly de la librería de Open-Meteo
abortaba con `Aborted(OOM)`. **Lo grave no era el fallo, era cómo se
presentaba:** a partir de ahí no se pintaba ni una tesela más, pero la app
seguía enseñando la capa anterior, con su hora y su leyenda. Medio mapa en
gris que se lee como «aquí no pasa nada».

Datos de la medición:
- El montón de JavaScript estaba en **98 MB de 4 GB**: no es memoria del
  navegador, es la del descodificador.
- El caché de bloques está topado en **8 MB** (128 × 64 KB), así que
  tampoco era eso.
- Bajar de 4 a 2 las descargas simultáneas **no lo arregló** (7 OOM igual).
- Dos ciclos independientes murieron **en la misma capa: Viento 10 m**.
  Es la única con barbas, y las barbas eran **200 flechas × 2 lecturas
  punto a punto = 400 consultas** sobre la rejilla gaussiana de ECMWF HRES
  (6,6 millones de puntos).

Puesto: barbas con separación de 96 px y tope de 96, `clearBlockCache()`
al cambiar de capa o modelo y después de las barbas, y sobre todo
**recuperación sola**: se guardan pestaña, capa y hora, se recarga, y al
volver se le dice que ha pasado. Máximo dos veces por sesión; a la tercera
se para y se le manda a ICON-EU o AROME HD.

### Cuánto aguanta, con números (30-08-2026)

El OOM sigue ahí, pero ahora se sabe **a partir de qué punto salta**, que
es lo que no se había medido nunca. Dos series limpias (localStorage y
sessionStorage vaciados antes de cada una), cambiando de capa cada 6-7 s
sin tocar nada más, sobre `weather-app-ochre-one-76.vercel.app`:

| Modelo del mapa | Serie de capas | Cuándo cae |
|---|---|---|
| **ECMWF HRES** · 9 km · 145 pasos | Ráfagas → CAPE → Isocero → Visibilidad → Espesor de nieve | **al 5.º** |
| **ICON-EU** · 7 km · 31 pasos | las mismas + Temperatura, Reflectividad, Inhibición, Nubes | **9 sin caer** |

Medido por dos vías, que coincidieron: la bandera interna `Maps._sinMemoria`
y el rastro que deja la recuperación (`om_recargas` a 1 y
`torre.teselasALaVez` bajando a 1).

**Por qué importa:** ECMWF HRES es el modelo con el que arranca el mapa, y
esas cinco capas son exactamente el repaso de las que deciden. O sea que le
va a pasar a él, no es un caso de laboratorio. Lo que la app hace cuando
pasa **está bien y se comprobó en pantalla**: sale el cartel, se recarga
sola volviendo a la misma capa y hora, y a la tercera se planta con «no
decidas con esto» y le manda a ICON-EU o AROME HD.

**Lo que NO está comprobado, y por eso no se ha tocado nada:** `setLayer()`
y `setModel()` llaman a `soltarMemoria()` **sin `await`**, siendo `async`
(maps.js:2691 y 2705), así que el vaciado del caché de bloques y la carga
de la capa nueva pueden solaparse. Es una sospecha de leer el código, no
una medida — la prueba con el `await` puesto a mano quedó sin concluir. No
se publica nada sobre esto hasta medirlo.

## Cómo se busca este tipo de fallo (23-08-2026)

`node --check` NO basta: solo mira la sintaxis. Una variable huérfana como
`ex` pasa el check y revienta en tiempo de ejecución.

Para buscarlas de verdad, ESLint con `no-undef`, declarando como globales
lo que app.js y maps.js se pasan entre sí (comparten ámbito global porque
son scripts clásicos, no módulos). Se saca la lista sola:

```bash
node -e "const fs=require('fs');const n=new Set();
for(const f of ['app.js','maps.js','sw.js'])for(const l of fs.readFileSync(f,'utf8').split('\n')){let m;
if((m=l.match(/^(?:async\s+)?function\s+([A-Za-z_\$][\w\$]*)/)))n.add(m[1]);
if((m=l.match(/^(?:const|let|var)\s+([A-Za-z_\$][\w\$]*)/)))n.add(m[1]);}
console.log(JSON.stringify([...n].sort()))"
```

**Resultado del 23-08-2026: 0 errores** en app.js, maps.js y sw.js. Los 3
avisos de `require-atomic-updates` están mirados y son falsos positivos
(`f` es local de cada llamada; `deferred` solo lo mueve el botón instalar).

## El vigilante de fallos

`Petardazo` (en app.js) engancha `error` y `unhandledrejection` y saca
**en pantalla**, arriba del todo y en rojo, cualquier fallo suelto. Guarda
los últimos cinco en `localStorage['torre.fallos']` con hora y versión.

Si Aitor dice que le ha salido la barra roja, pedirle eso:
```js
JSON.parse(localStorage.getItem('torre.fallos'))
```

Filtra a propósito los errores de teselas y los `Aborted(OOM)`, que ya
tienen su propio aviso en el mapa y si no saldrían dos carteles.

## Satélite de EUMETSAT (23-08-2026)

Nube **observada**, para complementar el radar: el radar dice dónde cae
agua, el satélite enseña la nube ANTES de que llueva.

Fuente: **EUMETView** (`view.eumetsat.int/geoserver/wms`), el visor público
de EUMETSAT. WMS abierto, **sin clave**, y sirve con
`access-control-allow-origin: *`, así que las imágenes las pide el
navegador directamente. Tres capas, cada 15 min:

| Capa en la app | WMS | Nota |
|---|---|---|
| Nubes (infrarrojo) | `msg_fes:ir108` | día y noche |
| Tormentas | `msg_fes:rgb_convection` | **solo de día** |
| Visible | `msg_fes:rgb_eview` | **solo de día** |

Dos cuidados que NO son adorno, los dos medidos al montarlo:

1. **Hay que fijar `time=` en cada petición.** Sin él, cada cuadro viene
   de la pasada que le pilla más a mano y la imagen sale con COSTURAS
   visibles entre cuadrantes.
2. **Las horas se preguntan, no se calculan.** Si se pide una pasada aún
   no publicada, EUMETSAT devuelve imagen VACÍA, y un mapa vacío se lee
   como «no hay nubes». Por eso la función `/satelite` lee el catálogo
   (GetCapabilities, 280 KB, en el servidor y cacheado) y devuelve solo
   horas que existen de verdad. Retraso típico medido: 25-30 min.

**Aviso de noche.** Tormentas y Visible usan canales solares: de noche la
imagen sale NEGRA, y negro se lee como «despejado». `avisoNoche()` calcula
la altura del sol en el centro del mapa y, por debajo de 3°, saca un
cartel: *«Lo negro no es sin nubes, es sin luz»*, y manda al infrarrojo.
La fórmula está contrastada contra el orto y el ocaso que da la propia app
para Bermeo (07:25 y 21:01 → −0,8° y −0,7°, o sea el horizonte).

## Barrido de las 34 capas (23-08-2026, noche)

Hecho antes de las pruebas reales del lunes. **34 de 34 correctas, 0 fallos.**

- **29 capas de modelo**: para cada una se resolvió el modelo, se construyó
  la URL, se descargó la tesela de Bermeo y se leyó el valor en el punto.
  Todas devolvieron número. 10 salen sustituidas por otro modelo y las 10
  lo avisan.
- **5 capas observadas**: Radar AEMET (8 imágenes, eco en el 1,2 % de la
  península), Radar observado (13 fotogramas) y las 3 de satélite (12
  pasadas cada una, ninguna en negro).

**Cruces de coherencia que salieron bien:**
- Punto de rocío 21,1 °C con temperatura 23,9 °C da 84 % de humedad, y la
  capa de Humedad —que viene de OTRO modelo (ICON-EU)— marcaba 83,9 %.
- Nubes bajas 0 + medias 23,7 + altas 35,4 cuadran con el total de 51,0.
- Radiación solar 41,7 W/m² a las 21:00, con el ocaso a las 21:01.
- CAPE por teselas 2.434 J/kg frente a 2.720 de la API. Un 10 % de
  diferencia porque **no son la misma resolución**: las teselas son ECMWF
  HRES de 9 km y la API es ECMWF de 0,25°. Es el efecto ya documentado.

**Lo que NO se pudo medir:** la fluidez. El panel del navegador se congela
cuando Aitor usa el Mac, así que cualquier cronómetro miente. Contra los
tirones lo que se hizo es de mecanismo: al mover la hora se cambia la
plantilla de teselas en caliente (`setTiles`) en vez de tirar la capa y
rehacerla, tanto en modelo como en satélite.

## La racha estimada daba números imposibles (23-08-2026, noche)

Encontrado probando el semáforo sobre **288 horas de 6 emplazamientos
reales** (Bermeo, Zarautz, Sollube, Bilbao, Vitoria, Ordizia).

`gustAt()` escalaba la racha por la proporción entre el viento medio a la
altura y el de 10 m, **sin ningún límite**. De madrugada la capa pegada al
suelo se desacopla: en superficie quedan 1-3 km/h mientras arriba sigue
habiendo viento. Dividir por ese casi-cero disparaba la cuenta.

Caso peor medido — **Vitoria, lunes 05:00**: racha de 20 km/h a 10 m
convertida en **100 km/h a 40 m**, con un viento medio a 40 m de 7. Una
racha 14 veces el viento medio no existe (lo normal es 1,3-2,0).

Alcance: **44 de 288 horas (15,3 %)** amplificadas por encima de lo
defendible, y **11 salían NO APTO solo por eso**.

**El arreglo, con su justificación:** tope de amplificación `(altura/10)^0,4`.
A 40 m da **1,74**, que es EXACTAMENTE el percentil 90 medido en Euskadi
para el viento medio de 10 a 40 m. Se permite amplificar hasta el peor día
de cada diez y de ahí no se pasa. Más un suelo: la racha nunca queda por
debajo del viento medio a esa altura.

Comprobado después: **0 horas por encima del tope, 0 rachas por debajo del
viento medio.** Vitoria lunes 05:00 pasa de 100 km/h y NO APTO a 34 km/h y
APTO. El dato crudo de 10 m no se toca nunca. Las horas con la
amplificación limitada quedan marcadas con `gustLim`.

**PENDIENTE DE QUE AITOR LO APRUEBE:** este cambio QUITA avisos rojos.
Está avisado. Si lo prefiere como estaba, se quita el tope.

## Sin cobertura no habia mapa (23-08-2026, noche)

**MapLibre se cargaba desde `unpkg.com`**, un CDN de terceros. El service
worker no cachea nada de otro origen (`if (url.origin !== location.origin)
return`), así que la librería NUNCA se guardaba: **sin cobertura el mapa no
arrancaba** — ni modelos, ni radar, ni satélite. Y él trabaja en el monte.

De paso, una herramienta con la que se decide subir a una torre no puede
depender de que un servidor ajeno esté en pie.

Puesto: MapLibre 4.7.1 vive ahora en `vendor/` (js 784 KB + css 64 KB) y
las tres librerías están en el SHELL del service worker.

Comprobado tras publicar: **0 peticiones a unpkg**, las tres cargan de
`/vendor/`, y la caché guarda **4,0 MB** con todo lo crítico y con
contenido real (no cáscaras vacías):

| | KB |
|---|---|
| index.html · app.js · maps.js · styles.css | 351 |
| vendor/maplibre-gl.js + .css | 848 |
| vendor/openmeteo-weather-map-layer | 2.918 |

Son 4 MB que se rebajan una vez por versión publicada. En el monte valen
su peso en oro.

## Huecos en los campos que deciden (23-08-2026, noche)

Aitor preguntó dónde mirar la «tapa» y al enseñárselo salió que **la ficha
de Torre ponía «sin dato»** justo ahí. Medido para Bermeo, horas con valor
sobre 24:

| Campo | Automático | ECMWF | GFS | ICON | AROME HD |
|---|---|---|---|---|---|
| inhibición (tapa) | 24 | **0** | 24 | 24 | **0** |
| índice de elevación | 24 | **0** | 24 | **0** | **0** |
| isocero | 24 | **0** | 24 | 24 | **0** |
| visibilidad | 24 | **0** | 24 | 24 | **0** |
| **estado del cielo** | 24 | 24 | 24 | 24 | **0** |

Lo más grave: **AROME HD —el que se usa para costa y monte— no publica el
estado del cielo**, y `isStormCode(h.code)` es lo que dispara el NO APTO por
tormenta. Sin ese campo esa vía no salta nunca.

`completar()` ya rellenaba huecos desde el modelo automático, pero
`COMPLEMENTOS` solo llevaba 6 campos. Añadidos `convective_inhibition`,
`lifted_index` y `freezing_level_height`, con sus nombres en cristiano en
`NOMBRES_COMPL`.

Comprobado después con los 5 modelos: **0 campos críticos vacíos tras el
relleno** (AROME HD pasa de 5 huecos a 0, rellenando 9 valores).

Además, la tabla de tormenta de la pestaña Torre ahora **traduce la tapa a
palabras** (sin tapa / floja / aguanta / fuerte, cortes en 25, 50 y 200,
sacados de lo medido ese día) y **dice de qué modelo sale cada valor
prestado**, que antes solo se avisaba en la pestaña Ahora.

**PARA QUE NO VUELVA A PASAR:** la revisión automática de las 07:00 y 20:00
comprueba en cada pasada, modelo por modelo, que ningún campo de decisión
queda vacío después del relleno. Es su comprobación número 2, la primera
después del código.

## El mapa no se veía (24-08-2026, mañana)

Quedaba una sola cosa por comprobar de la noche anterior: entrar en la
pestaña Mapa. **No pintaba nada.** Y no era el tiempo: era la app.

Medido paso a paso, para no repetir el camino:

| Comprobación | Resultado |
|---|---|
| teselas de datos | 206 OK, servidas por nuestro dominio |
| decodificadas | 512x512, **ni un píxel transparente**, amarillo en el centro |
| `omSrc` en el mapa | 9 de 9 teselas `loaded`, con textura |
| posición de `omLayer` | **8 de 95** |

Ahí estaba. `firstLabelLayer()` buscaba «la primera línea de frontera» por
el nombre, y en el mapa de CARTO `boundary_county` va en la posición 9,
**antes del relleno de agua y del terreno**. La capa de ráfagas se metía
debajo de la cartografía. Datos perfectos, enterrados.

Arreglado mirando el ORDEN y no el nombre: se busca el último relleno
(`fill`, `background`, `raster`) del mapa base y se entra justo detrás,
delante de fronteras y rótulos. Funciona igual en Claro, Color y Oscuro,
sin depender de cómo se llamen las capas de cada estilo.

**El segundo, que salió al comprobar el primero.** `apply()` solo quitaba
`omLayer`, `omLayer2` y `radarLayer`. El satélite y el radar de AEMET se
borraban únicamente a sí mismos. Pasando por Radar AEMET → Nubes →
Ráfagas el mapa acababa con **tres capas montadas**: se veía el eco del
radar sobre el satélite mientras la leyenda decía «Ráfagas · kt» y las
ráfagas quedaban debajo, tapadas. Leer una capa creyendo que es otra es
peor que no tener mapa. Ahora hay un único `quitarCapasDeDatos()` que las
borra todas antes de pintar.

Comprobado después sobre lo publicado (v2026.08.24-0748): capa por encima
de todo relleno y por debajo de los rótulos, en las tres bases; y tras la
secuencia Radar AEMET → Nubes → Ráfagas queda **una sola** capa de datos.

**Lo que hay que aprender de esto, más que el arreglo:** la revisión
automática dio la app por buena con el mapa en blanco, porque comprobaba
que `#mapStamp` y `#mapStatus` traían texto — y era verdad. **Que el mapa
responda no es que el mapa se vea.** La revisión de las 07:00/13:00/20:00
ya comprueba las teselas cargadas, el orden de la capa y que no haya más
de una capa de datos a la vez.

Y un apunte de método: revisando en un panel de navegador oculto, el
navegador deja de repintar y el pantallazo va atrasado. Dos veces pareció
un fallo lo que solo era un fotograma viejo. **Medir el estado en el
código; la imagen, solo para confirmar.**

## La ficha decía un modelo y enseñaba números de otro (24-08-2026)

Revisando el mapa salió esto, que es peor que el mapa en blanco.

Con **AROME HD** seleccionado, la ficha de Torre a 40 m ponía:

> «AROME HD solo publica viento a 10 m. Para estimar la altura usa AROME,
> ICON o GFS»

Dos cosas mal en una frase. Se recomienda a sí mismo, y **es falso**:
medido ese día en Bermeo, AROME HD publica los 80 m, 24 horas de 24. Lo
que había cargado en pantalla eran los datos de **ECMWF**, que sí es
verdad que solo da los 10 m. El nombre era de un modelo y los números de
otro, y nada en la pantalla lo decía.

De dónde sale: todo —la chapa de la portada, los textos, la clave de la
copia guardada— colgaba de `S.model`, el modelo SELECCIONADO. Y `S.model`
cambia por dentro sin avisar: si el modelo de área limitada no cubre el
punto, `loadAll()` se cae al automático y lo reescribe. Basta ese hueco
para que etiqueta y datos se separen.

Arreglado de raíz: el dato se lleva grabado su modelo (`fc._modelo`, se
sella en `loadAll()` después de traerlo) y todas las etiquetas salen de
`modeloDato()`, nunca de lo seleccionado. El selector sigue marcando lo
que has elegido tú; lo que se lee encima de los números es de dónde
salen los números.

De paso, el texto ya no se recomienda a sí mismo. Niveles de viento por
modelo, medidos ese día en Bermeo (horas con valor sobre 24):

| Modelo | 10 m | 80 m | 120 m | 180 m |
|---|---|---|---|---|
| Automático | 24 | 24 | 24 | 24 |
| ECMWF 25 km | 24 | **0** | **0** | **0** |
| AROME HD | 24 | 24 | **0** | **0** |
| GFS | 24 | 24 | 24 | **0** |
| ICON | 24 | 24 | 24 | 24 |

Comprobado tras publicar (v2026.08.24-0808): con AROME a 40 m ya
interpola de verdad (10 m = 15,9 km/h, 80 m = 32,3 → α=0,31 → 15 kt de
viento y 33 kt de ráfaga), y con ECMWF el aviso nombra a ECMWF y manda a
«ICON, GFS, AROME HD o Automático».

**Y una medida que vale la pena tener a mano:** ese día, el modelo
**Automático coincidió con AROME HD en 35 de 48 horas** en Bermeo, y con
ICON o ECMWF en 1 de 48. En esta zona el Automático es casi siempre
AROME — pero no siempre, así que no son intercambiables.

Contraste con lo medido en ese momento: AROME daba 21 kt de racha a 10 m
en Bermeo y el anemómetro de **MATXITXAKO** (a 4,5 km) marcaba **21 kt**.

## Repaso capa por capa del mapa (24-08-2026, mañana)

Aitor fue abriendo capas y mandando capturas. Salieron cinco cosas.

**1. Presión daba un número inventado.** Ponía **10 hPa** en todas las
ciudades y el mapa salía de un violeta plano. La escala se construyó el
21-08 midiendo que la tesela venía en PASCALES (101.895); el 24-08 viene
en hPa (1.008). Con la cuenta vieja: 1008/100 = 10,08 → «10», y 1.008 se
caía por debajo del corte más bajo, que estaba en 94.000.
Los cortes van ya en hPa y el valor que se enseña se adapta solo. Y para
que no vuelva a colarse callado, `fueraDeRango()` compara cada capa con
lo posible en la Tierra (presión 850-1085 hPa, temperatura −60/60,
humedad 0-100…) y lo canta en la barra de estado. Comprobado después:
**1013, 1012, 1010, 1009 hPa**.

**2. Humedad no se veía.** La escala oficial es casi transparente hasta
el 85 % y sobre el mapa claro no salía color: solo los números sueltos.
Escala propia, que arranca de verdad en el 70 y satura en morado cerca
del 100, que es donde hay niebla y rocío y la estructura resbala.

**3. El punto de rocío NO estaba roto: tardaba.** Con ECMWF HRES pinta a
los ~40 s (rejilla de 6,6 millones de puntos y solo 2 descargas a la vez,
que es lo que evita el `Aborted(OOM)`). Él le hizo la foto antes. Pero el
fallo estaba igual: **durante esos 40 s el mapa está vacío y no dice
nada**. Ahora sale un cartel con los segundos que lleva y la frase que
importa: «el mapa está vacío porque aún no ha llegado el dato, no porque
no lo haya». Solo aparece si tarda más de 1,5 s, y solo dice que un
modelo es lento si lo es de verdad (`LENTOS`).

**4. Los números de la capa anterior se quedaban en pantalla.** Al
cambiar a Humedad seguían los **1013, 1012** de la presión debajo del
rótulo «Humedad». Un número bajo la etiqueta equivocada engaña más que un
hueco. `apply()` ya limpia valores y barbas de entrada.

**5. Una llamada muerta cortaba el cambio de modelo.** En `app.js`
quedaba `Maps.fetchGrid()`, función que ya no existe. Lanzaba un
TypeError que se comía el resto del manejador, así que **no se llegaba a
`go(S.place)`**: el modelo cambiaba de nombre sin recargar los datos.

Y el aviso del satélite decía **«el sol está casi puesto» a las 8 de la
mañana**, con el sol saliendo. El número (3°) era bueno; la frase, al
revés. Ahora compara la altura del sol media hora después y distingue
amanecer de anochecer.

Nombres: la capa de temperatura del aire se llama **«Temperatura 2 m»** y
la del suelo **«Temp. del suelo»**, que se confundían.

## La tapa entra en la decisión (24-08-2026)

La noche del 23 cayeron rayos en el **Duranguesado y Lekeitio** y rompieron
postes y fusibles. Aitor lo contó al día siguiente. Medido después, hora a
hora, lo que daba el modelo:

| Sitio | Hora | CAPE | Tapa | ¿Rompió? |
|---|---|---|---|---|
| Lekeitio | 19:00 | 780 | 229 | no |
| Lekeitio | 22:00 | 960 | **13** | sí |
| Lekeitio | 23:00 | 1360 | **15** | sí |
| Durango | 23:00 | 1070 | **56** | sí |
| Durango | 19:00 | 820 | 188 | no |

**Y el «estado del cielo» del modelo NO dijo tormenta en ninguna de esas
horas.** Quien se fíe de ese campo no ve venir nada. Lo que avisó fue el
CAPE subiendo mientras la tapa se caía de 229 a 13.

Hasta ese día la tapa se enseñaba en la ficha pero **no decidía**: el NO
APTO por tormenta pedía código de tormenta, o CAPE ≥1000 *y* lluvia en la
misma hora. Lekeitio a las 23:00 tenía 1360 de CAPE y **0,0 mm**.

Se le preguntó a Aitor y eligió **precaución destacada, no rojo**: el rojo
se reserva a tormenta en curso, porque una app que grita se deja de creer.

Umbrales **calibrados sobre 960 horas reales** (5 emplazamientos, 8 días):

| Regla | Salta en | Días |
|---|---|---|
| CAPE ≥1000 y tapa <50 | 1,0 % de las horas | 3 de 8 |
| **CAPE ≥800 y tapa <75** | **2,8 %** | 4 de 8 |
| CAPE ≥700 y tapa <100 | 4,6 % | 4 de 8 |

Se eligió 800/75: con 1000/50 se quedaba fuera Lekeitio a las 22:00 (CAPE
960), que ya había descargado. El aviso va DELANTE de los avisos sueltos
de CAPE y los desactiva, para no decir dos veces lo mismo.

Comprobado llamando a `assess()` con los valores de esa noche: salta en
las tres horas que descargaron y se calla en las que no.

## La app estaba planteada para el que sube (24-08-2026, tarde)

Aitor lo dijo así: *«lo de torre ya sé que sí, pero la avería es dentro de
la caseta; si no hay rayos tengo que ir porque el coche me llega. Otra
cosa es subir a torre a cambiar una antena, esporádica de vez en cuando».*

**Y ahí estaba el fallo de fondo: la app la hicimos para el operario que
sube, y él no sube. Reparte gente.**

Lo que hay de verdad en un emplazamiento del monte:

- La torre de 40 m con las antenas arriba.
- **Pegada a ella, la caseta**, y ahí dentro está casi todo el trabajo:
  cuadros eléctricos, aires acondicionados, equipos de fuerza,
  rectificadores, nodos y radioenlaces.
- **Postes de 3 m** con contadores, CGP y fusibles — acometida de
  Iberdrola, en tensión, a la intemperie y en escalera.
- Y muchas **urbanas**: azoteas, camarotes, hoteles, metro, empresas.

**El veto es el rayo, y es del EMPLAZAMIENTO entero, no del trabajo.** Sus
palabras: *«porque la torre está pegada a la caseta y es un pararrayos»*.
Con 40 m de captador al lado, toma de tierra común y las manos en un
rectificador o en un CGP, da igual estar bajo techo.

**El calor no le impide ir: le obliga.** Si lo averiado es el aire, la
sala se calienta y los equipos se caen. Es urgencia, no riesgo. Estaba al
revés en la app.

### Lo que se ha cambiado

Tres **perfiles de trabajo** (`PERFILES` en `app.js`), con **caseta por
defecto**, que es lo que más hace. `assess()` recibe el perfil y decide
distinto:

| | Caseta y poste | Azotea o urbana | Subir a la torre |
|---|---|---|---|
| Ráfaga | solo si ≥80 km/h | veta a ≥70 | umbrales suyos (45/60) a la altura |
| Lluvia | avisa: no abrir cuadros fuera | igual | resbala: 0,2 / 2,0 |
| Altura de trabajo | **no se pregunta** (estás en el suelo) | sí | sí |

Comprobado con Vitoria de hoy a las 21:00 (racha 76,3 km/h, CAPE 420,
tapa 107). Antes los tres decían NO APTO. Ahora:

- **Caseta y poste** → PRECAUCIÓN, «molesta para la escalera del poste y
  para abrir armarios, pero no impide el trabajo dentro». Él iría.
- **Azotea** → NO APTO. A 76 km/h en una azotea, no.
- **Torre** → NO APTO, 104 km/h a 40 m.

Los tres ciertos, cada uno para lo suyo.

### Lo que queda de este replanteamiento

- ~~**El veto de rayos con datos de verdad.**~~ **HECHO el 25-08-2026**,
  y por ese camino: analizando la imagen que publica AEMET y contando
  descargas alrededor de cada emplazamiento. Ver *«Los rayos, por fin
  medidos»*.
- **El calor como urgencia** en el perfil de caseta: si la temperatura
  pasa de 30, decir que la sala estará muy por encima si el aire es la
  avería.
- **Un tablero de todos sus emplazamientos** ordenados por riesgo. Es un
  coordinador: su pregunta no es «¿qué tiempo hace aquí?», es «¿a cuál de
  mis sitios puedo mandar gente ahora?».
- Y su pregunta de verdad pide **una hora, no un color**: «ahora no, a
  partir de las 20:30 sí».

## La regla de la tapa, validada en directo (24-08-2026, 15:40)

Primera vez que se comprueba con una tormenta **mientras estaba pasando**.

A las 15:35 Aitor escribió: *«estoy escuchando truenos no muy cercanos»*.
Estaba en Bermeo, sin lluvia. Lo que daba el modelo en ese momento:

| Sitio | CAPE | Tapa |
|---|---|---|
| **Bermeo** | **720** | **14** |
| Sollube | 400 | **1** |
| Gernika | 240 | **1** |
| Amorebieta | 140 | **2** |

**Con el umbral de 800 NO saltaba, por 80 J/kg.** Se recalibró en caliente a
**700 con tapa <75** y con eso sí salta. Medido sobre 1.536 horas: pasa de
2,9 % a 4,0 % de las horas, y caza además Lekeitio y Durango de la noche
anterior.

Yo me equivoqué al leerlo: dije que los truenos venían de las células de
Navarra. Él me corrigió — *«no puede ser de Navarra, no se escucha
hombre»* — y tenía razón: **el trueno no pasa de unos 15 km**. Nunca
situar una tormenta más lejos de lo que el sonido puede viajar.

Dónde estaba de verdad, con sus propias capas (AROME HD e ICON-EU, 14:00):

| | CAPE | Tapa | Tope convectivo |
|---|---|---|---|
| Laredo | **1832** | 46 | — |
| Santoña | 881 | 56 | — |
| **Mungia** | 208 | 11 | **10.640 m** |
| Ondarroa | 228 | 6 | 10.130 m |
| Bilbao | 217 | 3 | 8.428 m |
| Bermeo | 187 | 32 | 5.525 m |

Nubes de **10 km de alto a 15 km de Bermeo**, y toda la franja costera al
oeste de Bilbao con la tapa por debajo de 30. El radar de Windy de las
15:40 confirmó la célula sobre la ría con descargas detectadas.

**Y lo que más importa de todo esto, dicho por él: «esto no avisó nadie de
las tormentas».** No había aviso de AEMET ni de Euskalmet. Son células que
se forman en dos horas y los avisos oficiales van por provincia y por medio
día. La tapa las vio; los avisos no. Y él estaba **de guardia y solo**.

Otro detalle suyo: **oía truenos pero NO veía el relámpago** (nube baja y
monte de por medio). Sin ver el fogonazo la regla del 30/30 no se puede
aplicar, y entonces vale la conservadora: si se oye el trueno, ya estás
dentro del alcance.

## Netlify tumbó la app entera (24-08-2026, 16:00)

**El fallo más caro del día, y no fue de código.**

Aitor estaba de guardia, con tormenta encima, y la app dejó de responder:
**503 «usage_exceeded» en TODO**, hasta el `index.html`. El correo de
Netlify: *«Tus proyectos han sido suspendidos — el uso de su crédito ha
agotado su límite de 300 créditos»*, ciclo del 21 de agosto al 20 de
septiembre. **Tres días para fundir el plan entero.**

**Qué se lo comió:** la función `/omtiles`. Se descargaba el fichero `.om`
ENTERO en el servidor y lo reenviaba (`arrayBuffer()`), así que cada tesela
contaba dos veces, entrando y saliendo. Los ficheros de ECMWF HRES son
rejillas de 6,6 millones de puntos. Una tarde abriendo capas basta.

**Arreglado en dos frentes:**

1. **La causa.** Las teselas se piden **directas a
   openmeteo.s3.amazonaws.com** (desde el 04-09-2026; el host viejo map-tiles.open-meteo.com desapareció del DNS). El proxy queda solo de reserva, para las
   redes móviles donde ese host no se alcanza —que era el motivo real por
   el que existía—. Se comprueba una vez al arrancar y se recuerda 6 h;
   se puede forzar con `?tiles=directo` o `?tiles=proxy`.
2. **El sitio.** Movido a **Vercel**, donde Aitor ya tenía cuenta
   (`pentxa-5443`, equipo `meteo-aitor-bermeo`). Publicar es igual que
   antes: `./deploy.sh "mensaje"`, que ahora llama a `vercel deploy --prod`.
   El `deploy.sh` viejo queda como `deploy-netlify-viejo.sh`.

Comprobado tras mover: app, `/om` con datos reales, `/mareas`, `/satelite`,
`/omtiles` y `/radar-aemet` todos correctos.

**Lo único que quedó pendiente y es DE ÉL:** las dos claves de entorno en
Vercel — `AEMET_KEY` (estaciones medidas) y `WINDY_KEY` (cámaras). No las
toco yo. Hasta que las ponga, `/estaciones` devuelve 503 con
`{"sinClave":true}` — que al menos lo dice, no se calla.

**La lección, que va más allá de esta app:** una herramienta con la que se
decide mandar gente al monte no puede depender de un plan gratuito que se
suspende sin avisar. Y el aviso llegó por correo, no a la app. Él se enteró
porque dejó de funcionar.

## Las dieciséis fotos que cambiaron la app (24-08-2026, noche)

Aitor mandó dieciséis fotos de emplazamientos suyos. **Tiraron abajo dos
planteamientos míos seguidos**, y el resultado es lo que hay ahora.

Lo que enseñan, y no se puede deducir de ningún dato:

| Sitio | Qué es |
|---|---|
| Barazar (N-240) | armario de intemperie en un helechal, bajo torre |
| Monte Banderas (Deusto) | torreta cargada de antenas… **en Bilbao** |
| Peruri (Getxo) | azotea, mástil, armario abierto con baterías |
| Gernika | azotea sobre viviendas, se sube por **trampilla** |
| Durango | portal → pasillo → **escalera vertical de pates** → rejilla |
| Zamudio y BEC | armarios **dentro de un edificio** |
| BU-550 (Burgos) | poste con transformador, CGP y **líneas aéreas** |
| Berango | la CGP y el contador **en la fachada, en la calle** |
| Górliz | torre, vallado y la furgoneta hasta la puerta |

**Sus palabras:** *«el 70 % de las veces voy a caseta y poste de 2 metros.
Casetas en el monte, en metros, en restaurantes, en teatros, en azoteas,
en campos de fútbol, en garajes subterráneos»*.

### Lo que se aprendió, y lo que se cambió

**«Caseta» no es un sitio: es lo que hay dentro.** Y monte no es lo
contrario de ciudad. Los perfiles por lugar (monte/urbana) estaban mal.

**Lo único que separa el riesgo es: ¿HAY HIERRO ALTO ENCIMA?** Con torre o
mástil eres el pararrayos, en Barazar o en Deusto. Sin nada encima, dentro
de un edificio, el tiempo no pinta nada. Los `PERFILES` quedaron así:

| | Cuándo | Qué manda |
|---|---|---|
| `hierro` | monte, azotea, campanario — **por defecto** | el rayo |
| `dentro` | sala técnica, garaje, empresa | nada |
| `torre` | **solo cuando sube** — revisión anual, cambiar antena | la ráfaga |

Su regla, textual: *«cuando vaya a torre de 40 metros que solo sea torre»*.

**El acceso es media decisión, y no existía.** Se añadió `acceso()`:
nieve caída y en el suelo, hielo comparando la **isocero con la cota del
emplazamiento**, barro por lluvia acumulada, ramas por racha, y niebla.
Menciona el remolque, porque con el grupo detrás una pista embarrada no es
difícil, es imposible. Sin cota puesta **lo dice**, no se calla.
Se añadieron `snowfall` y `snow_depth` a `HOURLY`.

**La respuesta útil es una hora, no un color.** `cuandoSalir()`: «se
despeja a partir de las 23:00», y fuera de jornada «a las 07:00, al
empezar la jornada: PRECAUCIÓN». **Su horario: 07:00 a 14:30, guardia 24 h
una semana de cada tres** — pero la app le hace falta siempre, porque
**cuando los de guardia son los chavales, decide él**.

**El calor, con SU número.** El panel de alarmas de Barakaldo pone
`TEMP > 32`. Ya no hace falta inventarse el umbral.

> **QUITADO EL 25-08-2026. Lo de arriba está mal y ya no existe en la app.**
>
> Dos errores encadenados, los dos míos. Primero leí de una foto que su
> alarma era `TEMP > 32`; me corrigió: el panel **solo mide** la sala, y
> la alarma que le llega es de **42°, y solo si el aire se avería**. Y
> cuando reescribí el aviso con el 42, me paró del todo:
>
> > *«Lo del panel olvídate. Solo el tiempo real en la calle. Lo de dentro
> > de la caseta no afecta para la app. Ya puede haber en la calle 40
> > grados que dentro de la caseta habrá 25 si está el aire funcionando.»*
>
> **Todas las casetas llevan aire, enfría todo el día y casi nunca falla.
> La temperatura de dentro la fija el aire, no el tiempo.** No es un dato
> meteorológico y la app no pinta nada ahí.
>
> Retirado el bloque `#vCaseta` de `app.js` y su `<p>` de `index.html`.
> **No volver a meterlo.**
>
> **La lección, que vale para más cosas:** me inventé una cadena causal
> —calor fuera → caseta caliente → tarjetas caídas— que era verdad en el
> papel y falsa en su realidad, porque me faltaba un dato de una sola
> línea: que hay aire en todas y que funciona. Antes de cruzar el tiempo
> con una consecuencia operativa, preguntarle si esa cadena existe de
> verdad.

### LO QUE LA APP NO DEBE TOCAR

Límite que puso él y no se cruza: **baterías, criticidad del nodo y si el
camino es accesible de noche**. *«Suele ponerlo en Argos, generalmente hay
muchas variables… eso ya depende de uno mismo, eso mejor no tocar»*.
Y las autonomías **no son norma**: *«algunos no hay y se caen seguido,
otros aguantan 6 horas según»*.

### Lo más peligroso que hace, y sigue sin cubrir

Se va la tensión —normalmente tras una tormenta—, la compañía no repone, y
hay que **subir un grupo electrógeno en remolque** por la pista del monte.
De noche, con el temporal recién pasado, y en invierno **con nieve y
cadenas**. El bloque de acceso ya ayuda; falta cruzarlo con dónde pasó la
tormenta esa noche.

## Un modelo del mapa que no llega a Euskadi (26-08-2026, 20:00)

Encontrado en la revisión de la tarde. **ICON-D2 no cubre ninguno de sus
doce emplazamientos**, y el mapa no lo decía.

En la barra de modelos del mapa, su botón ponía *«DWD alemán de área
limitada — 2 días, muy fino para tormentas · 2 km»*. Es el reclamo
perfecto para él, porque su veto es el rayo. Al pulsarlo, Euskadi entera
se quedaba **en blanco** y la barra de estado decía lo de siempre:
«ICON-D2 · 2 km · pasada de las 17:00 · 49 pasos». Ni una palabra. El
color empezaba en Cataluña.

Medido por dos vías que coinciden:

| Vía | Qué dijo |
|---|---|
| la app, pulsando en Bermeo | «ICON-D2 no tiene valor de ráfagas en este punto» |
| la API, `models=icon_d2` en Bermeo | «No data is available for this location» |
| por puntos, sus 12 emplazamientos | **0 con dato** |

Y una trampa que costó un intento: **no vale mirar el BBOX del modelo.**
El de ICON-D2 es `BBOX[43.18,-3.94,58.08,20.34]` y Bermeo (43.41, −2.72)
cae DENTRO. La rejilla va rotada y el borde de verdad es curvo. Hay que
leer el valor en el punto.

Y otra: la lectura puntual lanza `State not found for key` si la librería
no tiene ese fichero abierto — que **no es «sin dato», es «no lo he
mirado»**. El primer intento se lo tragaba con un `catch` y no avisaba
nunca. Ahora carga antes la tesela del punto, igual que `consultar()`, y
si ni así se puede leer **se calla**, que afirmar un hueco sin comprobarlo
es el mismo fallo por el otro lado.

Puesto (v2026.08.26-2027): `avisoSinDominio()` saca cartel —«ICON-D2 no
llega hasta BI OIZ… no porque no pase nada»—; el botón de ICON-D2 avisa
en su propio texto; y se saca de `alternativas()`, porque sustituir una
capa por un modelo que aquí no tiene nada es cambiar un hueco por otro.
Comprobado en pantalla que sale con ICON-D2 y que **desaparece con AROME
HD** (Oiz, 47 km/h): no da falso positivo.

**Cuidado al revisar esto:** con el panel del navegador oculto MapLibre
deja de pedir teselas, `listo()` no llega a ser cierto nunca y el aviso
no salta. Parecía roto y era el panel. Hay que forzar el repintado con
capturas intercaladas.

### La tapa en la costa: el mapa y la ficha no dicen lo mismo

Salió contrastando tesela contra API en Bermeo. **No es un fallo, es el
efecto costa**, pero conviene tenerlo delante porque la tapa decide:

| ICON-EU, Bermeo, 20:00 | tapa | CAPE |
|---|---|---|
| celda de **tierra** (`cell_selection=land`, la que usa la ficha) | 109 | 930 |
| celda de **mar** | 146 | 730 |
| la **tesela del mapa**, que interpola entre las dos | 137 | — |

El resto cuadró: ráfagas 1,6 % · temperatura 0,1 % · isocero 0,0 % ·
presión 0,0 % · visibilidad 1,2 %.

## Los rayos, por fin medidos (25-08-2026)

El agujero más viejo de la app, y el más gordo: **el rayo es el único
veto de Aitor y la app no leía ni una sola descarga**. La pestaña Rayos
era el mapa de Blitzortung metido en un marco. Se veía, pero la app no se
enteraba, así que el semáforo podía decir APTO con una tormenta encima.

### De dónde salen las descargas

AEMET publica las que localiza SU red —detectores en España más los de
Portugal, Francia e Italia, nube-tierra e intranube— como **imágenes PNG
horarias georreferenciadas, sin clave**, en el mismo sitio del que ya
salía el compuesto de radar:

```
https://www.aemet.es/es/api-eltiempo/rayos/timeline      catálogo de 24 h
https://www.aemet.es/es/api-eltiempo/rayos/bounds/PB     [[-18,35],[14,47]]
https://www.aemet.es/es/api-eltiempo/rayos/leyenda       azul −, rojo +
https://www.aemet.es/es/api-eltiempo/rayos/imagen/rayos/<fichero>.png
```

El identificador que llevan los ficheros **cambia cada hora**, así que no
se puede construir el nombre: se lee del catálogo. La app lo pide por
`/rayos` (función nueva), porque aemet.es no manda CORS y hay que **leer
los píxeles**, no solo enseñar la imagen.

**Camino descartado, para que nadie lo vuelva a probar:** con la clave de
AEMET, `GET /opendata/api/red/rayos/mapa` contesta 200 y entrega un **GIF
de 640x480 y 16,6 KB**. Funciona, pero a esa resolución las descargas
salen fundidas en manchas. Los otros caminos de OpenData (`red/descargas/
mapa`, `red/rayos`, `observacion/rayos`) dan 404.

### Las cuatro cosas que hubo que medir

| | Medido |
|---|---|
| **Qué tamaño pedir** | De los cuatro que publica (PNBL, CCAA, PROV, LOCL) solo **LOCL** (7296×2620, 0,35 km/píxel) da cada descarga suelta: **975 en la hora de las 15:00 del 24-08**. Las mismas 975 salían en 302 manchas en PROV, 90 en CCAA y **28 en PNBL**. |
| **Qué proyección** | **Web Mercator**, no lat/lon plana. Comprobado contra el compuesto de radar de la misma hora: por Mercator el **68 %** de las descargas cae sobre un píxel con eco de lluvia; leyendo la imagen como plana, el **27 %**. La diferencia son **25 km** en Euskadi. |
| **Qué periodo cubre** | **La hora SIGUIENTE a la que lleva en el nombre.** Lo dice la página de interpretación de AEMET. Leerlo al revés desplaza una hora entera la última descarga. |
| **Cuánto cuesta leerla** | Con `createImageBitmap(blob, sx, sy, sw, sh)` recortando la caja de alrededor del punto: **111 ms el recorte y 3 ms los píxeles**. Seis horas tardan ~1,9 s; las 24 del catálogo, 7,4 s. Los ficheros pesan de **185 B** (hora sin una sola descarga) a unos **20 KB**. Nada que ver con el agujero que abrió `/omtiles` en Netlify. |

Los píxeles pegados se juntan en una sola descarga con un recorrido plano
sobre el recorte: el símbolo que dibuja AEMET ocupa unos 2×2 píxeles en
LOCL. La polaridad se saca comparando canal rojo contra canal azul, no
buscando un color exacto: el color cambia con el antialias.

### LA VALIDACIÓN, y una corrección mía

El 24-08-2026 a las 15:35 Aitor escribió: *«estoy escuchando truenos no
muy cercanos»*. Estaba en Bermeo y sin lluvia. Yo le dije que las células
estaban en Navarra y él me corrigió: *«no puede ser de Navarra, no se
escucha hombre»*.

**Tenía razón, y ahora está medido.** El mapa de AEMET de esa hora
—15:00 a 16:00— pone, alrededor de Bermeo:

| | |
|---|---|
| descargas a menos de 60 km | **24** |
| a menos de 15 km | **8** |
| la más cercana | **3,9 km** (43,442 / −2,760) |
| positivas | 16 de 24 |

No estaban en Navarra: las tenía encima. Que 16 de 24 fueran **positivas**
—las que suelen ir con el doble de intensidad— explica que se oyeran tan
bien sin verse el relámpago.

Y sobre **sus diez emplazamientos guardados de verdad**, esa misma
tormenta, en las 24 h del catálogo:

| Emplazamiento | Descargas a <30 km | A <15 km | La más cercana |
|---|---|---|---|
| **BI MUNGIA** | 21 | 10 | **0,8 km** |
| **BI SOLLUBEMENDI** | 16 | 9 | **1,2 km** |
| **BI GERNIKA2** | 12 | 7 | **1,6 km** |
| **BI BERMEO** | 11 | 8 | **4,7 km** |
| BI ZORNOTZA | 13 | 1 | 13,3 km |
| BI OIZ | 9 | 1 | 13,3 km |
| BI LEKEITIO MOV | 8 | 1 | 14,1 km |
| BI DURANGO OESTE | 12 | 0 | 17,3 km |
| BI MARKINA2 | 6 | 0 | 16,5 km |
| VI ARBAIZA | 4 | 1 | 11,6 km |

**Los diez tuvieron descargas a menos de 30 km, y cuatro las tuvieron
prácticamente encima.** Y de aquella tarde ya está anotado que *«esto no
avisó nadie de las tormentas»*: no hubo aviso de AEMET ni de Euskalmet, y
él estaba de guardia y solo.

### Lo que hace la app con esto

**1. El único sitio donde una medida pisa al modelo.** Descarga a menos de
**15 km** y **de hace menos de 90 minutos** → el semáforo se pone en NO
APTO, con el titular «han caído rayos encima de este emplazamiento», y da
igual el perfil: el veto es del sitio entero, no del trabajo, porque la
torre está pegada a la caseta y es un pararrayos.

Los 15 km, y no los 10 de la regla del 30/30, porque la posición que da
una imagen de 0,35 km por píxel no es un punto exacto y el error tiene
que caer del lado seguro. Los 90 minutos, y no los 30 de la regla, porque
el mapa viene por horas cerradas: dentro de esa hora no se sabe el
minuto. **Pasado ese rato la descarga se sigue contando y diciendo, pero
como historia, no como veto** — poner NO APTO por un rayo de hace seis
horas es el error contrario, y de los que hacen que una app se deje de
creer.

**2. Tres mensajes que NO se mezclan nunca**, porque él distingue
perfectamente entre los tres y juntarlos les quita valor a los tres:

| | De dónde sale | Qué dice |
|---|---|---|
| La tapa (CAPE ≥700, inhibición <75) | del modelo | **puede** romper |
| Las descargas de AEMET | de una medida | **ha caído** |
| El retraso del catálogo | de la propia hora publicada | **todavía no lo sé** |

**3. El tercero es el que engaña, y por eso va en pantalla con el número
real.** El mapa se publica por horas cerradas, así que siempre hay un rato
reciente sin dato: medido el 25-08, entre **8 y 70 minutos** según en qué
punto de la hora mires. Un mapa limpio de esa franja NO significa que no
esté cayendo. La app dice hasta qué hora sabe y cuánto hace de eso, y
manda al mapa en vivo de Blitzortung, al radar y al oído: **si se oye el
trueno, ya estás dentro del alcance**.

**4. Por dónde pasó.** Sobre los emplazamientos guardados (el ♥), las
últimas doce horas, ordenados por descargas. Es la respuesta a la avería
que viene detrás: el rayo tumba la red, la compañía no repone y hay que
subir el grupo electrógeno en remolque por la pista.

La pestaña Rayos quedó partida en dos, a propósito y con las etiquetas
puestas: **lo que ha caído** (AEMET, oficial, con retraso) y **lo que está
cayendo** (Blitzortung, al minuto, de voluntarios).

Fuente y licencia: © AEMET. Autorizado el uso de la información y su
reproducción citando a AEMET como autora.

## El mapa iba lento por una precaución equivocada (25-08-2026)

`Peticiones.max` estaba en **2** teselas descodificándose a la vez. Se puso
el 23-08 contra los `Aborted(OOM)`… pero lo medido aquel mismo día dice que
**bajar de 4 a 2 NO arregló nada** (7 abortos igual). La causa real era otra:
la librería guardaba los bloques descomprimidos y nadie los vaciaba, y eso
se arregló con `clearBlockCache()`.

O sea que el 2 era una precaución contra la causa equivocada, y desde
entonces se pagaba en lentitud sin motivo. El punto de rocío con ECMWF HRES
tardaba ~40 s (medido el 24-08) y buena parte era la cola de dos en dos.

**Subido a 3, pero con marcha atrás automática.** `avisoSinMemoria()` baja
el número y lo guarda en `localStorage['torre.teselasALaVez']`, así que
quien sufra un OOM una vez no lo vuelve a sufrir. Nunca baja de 1.

Comprobado en pantalla: arranca en 3 · un fallo → 2 · otro → 1 · y de ahí
no baja. Y lo recuerda entre sesiones.

> **CORRECCIÓN — el 3 se REVIRTIÓ el mismo 25-08 y hoy arranca en 2.**
> Medido en la revisión del 31-08-2026 a las 00:45 sobre lo publicado
> (v2026.08.31-0032): `Peticiones.max` vale **2**, y `torre.teselasALaVez`
> estaba vacío, o sea que ese 2 es el de fábrica, no una marcha atrás.
> El porqué está escrito en `maps.js:525`: *«PROBADO EN SU MÁQUINA el
> 25-08-2026 y REVERTIDO»* — a los dos minutos de publicar el 3, con punto
> de rocío y ECMWF HRES, su mapa se quedó sin memoria.
>
> Lo de arriba se queda porque explica la medición; **el número bueno es
> el 2**. Quien lea este bloque y vuelva a subirlo estaría repitiendo una
> prueba que ya salió mal en su Mac.

**Por qué así y no midiendo:** desde un panel de navegador oculto no se
piden teselas (0 servidas), así que la prueba de encadenar capas no mide
nada. Y subirlo a ciegas arriesga el peor fallo posible, que es el mapa en
blanco. Una marcha atrás automática es mejor que un cronómetro que miente.

### Y una cosa que NO se puede hacer: el vigilante en la nube

Probado el 25-08 con una tarea real. **El sandbox de la nube trae el Gmail
enganchado** (`mcp__Gmail__send_message`, comprobado) — o sea que SÍ podría
escribirle. Pero **bloquea toda la salida a internet**: Open-Meteo, AEMET y
hasta su propia app en Vercel devuelven `000` / `EGRESS_BLOCKED`. Solo deja
pasar Anthropic y los repositorios de paquetes.

Puede avisar, pero no tiene de qué. **El vigilante se queda en el Mac**, y
para las semanas de guardia hay que dejar el Mac despierto.

## El sirimiri no existe en milímetros (25-08-2026, tarde)

Aitor lo contó de pasada: *«esta mañana en Bilbao sirimiri casi hasta las
13 h»*, y mandó fotos de las cámaras con las carreteras mojadas. **La app
no había dicho nada.**

Contrastado por tres sitios, que es lo que hay que hacer siempre:

| | esta mañana en Bilbao |
|---|---|
| **Lo que decía nuestra app AYER** | cubierto de 00:00 a 14:00, **0,0 mm todas las horas**. Ni un código de llovizna. No lo vio venir. |
| **Lo que dice la pasada de HOY** | llovizna a las 08:00, 09:00 (0,1 mm) y 11:00. Lo pilló ya cayendo, y lo cortó a las 11. |
| **Lo que cayó de verdad** (estaciones AEMET) | Bilbao aeropuerto **0,4 mm** a las 10:00; Güeñes 0,4 a las 10:00; Sopuerta 0,6 a las 09:00. Güeñes al 93 % de humedad a las 11:00 y todavía 77 % a las 13:00 — cuadra con lo que él vio. |

**El fallo de fondo:** el aviso de lluvia de la app va en MILÍMETROS
(0,2 avisa, 2,0 da NO APTO) y el sirimiri no llega ni de lejos. Cinco
horas mojando y 0,4 mm en el pluviómetro. La app le habría dicho que no
llovía mientras se le mojaba el poste, el armario y la escalera.

**Lo que NO sirve para detectarlo: la humedad del modelo.** Medido ese
día en Bilbao, el modelo daba **73 %** cuando la estación medía **88 %**.
Una regla por humedad y visibilidad no habría saltado ni una vez.

**La regla que quedó:** código de llovizna (51-57) con precipitación por
debajo del umbral de aviso. Calibrada sobre **2.112 horas** (11
emplazamientos suyos, 8 días):

| regla | salta en |
|---|---|
| código de llovizna a secas | 8,9 % de las horas |
| **código de llovizna Y bajo el umbral** | **6,2 %** ← esta |
| humedad ≥95 %, cubierto y vis <5 km | 1,7 %, y no caza lo suyo |

Salta en 3-6 días de 8 según el sitio, en tandas de 1 a 4 horas. Es
**aviso, nunca NO APTO**: el sirimiri no para el trabajo, lo hace
resbaladizo, y gritar por sirimiri sería gastar el rojo.

Texto distinto por perfil, con `sirimiriImporta` en `PERFILES`:
`torre` → «pates, peldaños y cable de vida resbalan igual que con
lluvia»; `hierro` → «la escalera del poste y las rejillas resbalan, y no
se abren cuadros ni se tocan contadores o fusibles a la intemperie»;
`dentro` → callado, que ahí no pinta nada.

**Lo que sigue sin cubrir:** la app avisa las horas que el modelo marca
como llovizna, no el episodio entero. Esta mañana marcó 08, 09 y 11, y él
lo tuvo casi hasta las 13. Rellenar los huecos sería inventar; hace falta
medirlo antes.

**Y una herramienta nueva que salió de aquí:** `/estaciones` acepta
`?historia=N` y devuelve las **N últimas horas medidas** de cada estación,
no solo el último dato. AEMET manda las 24 h de todas las estaciones en la
misma respuesta y hasta ahora se tiraban. Con eso se puede contrastar
siempre lo previsto contra lo que cayó.

## Las cámaras se veían mal y no se podía rebobinar (25-08-2026, tarde)

Otra suya, del mismo rato: *«qué mal se ven, en Windy se ven muy bien, y
además puedo ir hacia atrás; aquí no deja: si quiero ver si ha llovido a
las 10 am ya no puedo, son las 16 h»*. Tres cosas, y las tres eran
nuestras:

1. **La imagen era de 400x224.** Es lo único que devuelve la API en
   `images.current.preview`, y estirada al ancho de la pantalla con
   `object-fit: cover` salía pastosa y recortada. **MEDIDO: el mismo
   servidor sirve `full`, que son 640x480** — la original sin tocar.
   Puesta esa, con caída a la pequeña por `onerror`, y enseñada con su
   propia proporción (4:3) en vez de metida a la fuerza en un 16:9.
2. **No se podía ir hacia atrás, y sí se podía.** La respuesta de Windy
   trae `player.day`, un reproductor de **24 horas rebobinables**. Estaba
   ahí desde el primer día: el código solo se caía a él cuando no había
   imagen, y siempre había imagen. Ahora cada cámara tiene su botón
   **«El día»**. Comprobado que se puede empotrar (sin `X-Frame-Options`
   ni `frame-ancestors`).
3. **Windy MIENTE en la región.** En Bilbao salía «San Mamés · Comunidad
   de Madrid» y «El Desierto · Canarias», las dos con coordenadas de
   Bizkaia: Windy geocodifica el NOMBRE, no el punto. Ya no se enseña su
   región. En su lugar va lo que calculamos nosotros con las coordenadas
   —**«a 7 km al O»**— que además es lo que él necesita saber.

## Bien, poco o sirimiri — y el radar que no lo ve (25-08-2026, tarde)

Aitor puso el criterio, y cambia lo que se había hecho por la mañana:

> *«me gusta saber si va a llover bien, poco o sirimiri. Con sirimiri
> puedo ir a las casetas pero no a los mástiles y menos a las torres»*

Y añadió el porqué, que no está en ningún modelo:

> *«hay cuadros eléctricos de intemperie y con sirimiri hay peligro al
> tocarlos, con guantes y todo»*

**Lo que se cambió:** el sirimiri era PRECAUCIÓN en los tres perfiles. Ya
no. En el perfil de **subir** (mástil o torre) es **NO APTO**, porque lo
dice quien reparte la gente. En **caseta y poste** sigue siendo aviso, y
el texto ahora dice las dos cosas que él quiere oír: que se puede ir, y
que a los cuadros de intemperie mojados no se les mete mano ni con
guantes. Dentro de un edificio, callado.

**La escala de tres**, con SUS umbrales de lluvia, no con otros nuevos:

| | cuándo |
|---|---|
| **Sirimiri** | código de llovizna (51-57) y por debajo de `rainWarn` |
| **Cuatro gotas** | algo de mm pero sin código de llovizna |
| **Llueve poco** | de `rainWarn` a `rainNo` (0,2 a 2,0 por defecto) |
| **Llueve bien** | `rainNo` o más |

La casilla de la ficha ya no pone «Precipitación 0,0 mm/h»: pone la
palabra delante y los milímetros detrás. Un 0,0 solo se lee «no llueve» y
esta mañana mojaba.

### EL RADAR NO SIRVE PARA ESTO, y está medido

La idea era suya y era buena: si el modelo dice llovizna, mirar la
reflectividad para confirmar si es sirimiri o es agua de verdad. Se probó
antes de montarlo. **No se sostiene, y por eso NO se ha puesto.**

Cruzando el compuesto de AEMET con los pluviómetros de 20 estaciones de
Bizkaia y Gipuzkoa, **256 pares estación-hora**, dos fotogramas de radar
por hora y una caja de 8 km alrededor de cada estación:

| Escalón máximo del radar | horas | con 0 mm | con lluvia | mm máx |
|---|---|---|---|---|
| **sin eco** | 185 | 180 | **5** | **1,2** |
| azul (2-3) | 28 | 26 | 2 | 0,4 |
| cian (4) | 27 | 21 | 6 | 3,2 |
| verde (5-7) | 14 | **14** | **0** | 0 |
| amarillo (8) | 2 | **2** | **0** | 0 |

Las dos cosas que lo tumban:

1. **De las 13 horas en que una estación midió lluvia, en 5 el radar no
   tenía NADA encima.** Entre ellas 0,4 mm en el aeropuerto de Bilbao y
   **1,2 mm en Balmaseda**. Aquí el haz pasa por encima de la nube baja
   de la costa: un radar limpio no dice que no esté cayendo.
2. **Verde y amarillo salieron 16 veces y en las 16 cayeron 0 mm** al
   suelo. Eco arriba que se evapora antes de llegar.

O sea que el radar aquí **puede sumar pero nunca vetar**: su presencia
dice algo, su ausencia no dice nada. Lo que sí se ha hecho es escribirlo
en la pestaña Radar, con los números, para que un mapa limpio no se lea
como «no llueve» — que es exactamente la regla 2 de esta app.

**La lección de método:** la idea era buena, encajaba, y era falsa. Se
tardó veinte minutos en medirla y habría sido una función preciosa
mintiendo en una app con la que se decide subir a una torre.

## Gasolina, tapa… y una chispa (25-08-2026, tarde)

**Lo encontró él, y la app estaba a punto de mentirle.**

Mirando el este de España, Girona daba a las 18:00 **CAPE 1.500 con la
tapa en 33** — más gasolina que Lekeitio la noche que le rompió los
postes. La app iba a sacar **«⚡ Riesgo de tormenta»**. Aitor miró AEMET
y Windy y dijo: *«AEMET no marca nada en Girona ni Windy»*.

**Tenía razón, y está medido:** contando descargas sobre los PNG de la
red de AEMET, **cero rayos en 60 km en cinco horas** alrededor de Girona.

Lo que faltaba era el disparador: **0 % de probabilidad de lluvia y el
cielo poco nuboso**. Depósito lleno y tapa quitada no encienden nada si
nada empuja el aire hacia arriba.

Sus propios pantallazos lo enseñaban solos, y son del mapa de la app:
**«Tope convectivo» en blanco sobre Cataluña**, el CAPE gordo **sobre el
mar** y no sobre tierra, y Blitzortung con los únicos rayos en el
Atlántico, al oeste de Portugal.

### Los cuatro positivos, y el corte

| caso | CAPE | tapa | prob. | ¿rompió? |
|---|---|---|---|---|
| Lekeitio 23-08 22:00 | 980 | 13 | **25 %** | sí |
| Lekeitio 23-08 23:00 | 1350 | 15 | **23 %** | sí |
| Durango 23-08 23:00 | 1070 | 56 | **15 %** | sí |
| Bermeo 24-08 15:00 | 720 | 59 | **28 %** | sí (oyó truenos) |
| **Girona 25-08 18:00** | **1500** | **33** | **0 %** | **no** |

Calibrado sobre **2.904 horas** (11 emplazamientos suyos, 14 al 24 de
agosto): la combinación sola salta **81 h (2,8 %)**; pidiendo además
probabilidad ≥10 % baja a **30 h (1,0 %)**.

**El corte es 10 %, no 15**, aunque 15 saldría casi igual (28 h). Quince
es exactamente lo que tenía Durango, o sea el borde del positivo más
justo: ajustar el listón al peor caso es aprenderse los casos, no el
fenómeno.

**HONESTIDAD SOBRE ESTA CALIBRACIÓN: son CUATRO positivos.** Es fina, no
robusta. Si aparece una tormenta real con la probabilidad por debajo del
10 %, el número se sube y no se discute.

### Lo que se hizo, y lo que NO

**No se ha quitado ni un aviso: se han separado en dos.** Las 51 horas
que se caen del ⚡ no se callan, pasan a decir **«Ambiente cargado, sin
nada que lo dispare»** con sus cifras y el porcentaje. Callarlas sería
romper la regla 2. Estado nuevo `info` en `assess()`: **no entra en
`RANK`, así que no toca el semáforo** — es un dato que leer, no un aviso.

**Y si falta el dato de probabilidad, se avisa igual** (`!has(h.pop) ||
h.pop >= 10`). Un hueco no puede valer como «no hay disparador».

Comprobado con los ocho casos sacando la función del fichero publicado:
las cuatro que rompieron siguen dando ⚡, Girona baja a «cargado», el
hueco de probabilidad avisa, y una tarde tranquila sigue en riesgo bajo.

### Una sola frase por hora (v2026.08.25-1832)

Al partir la condición en dos rompí un invariante que ya estaba escrito
arriba —*«va antes que los avisos sueltos de CAPE y los desactiva: decir
dos veces lo mismo es ruido»*—. Lo cazó la sesión de al lado probando lo
publicado: **Girona se quedaba con las dos frases**, la nueva diciendo
«nada que lo dispare» y la suelta de `capeNo` diciendo «puede romper».
Dos mensajes opuestos en el mismo veredicto.

Probando después los nueve casos uno a uno salieron dos más, y una era
anterior a todo esto:

| | qué pasaba | cómo queda |
|---|---|---|
| Combinación **sin** chispa | salía además el aviso suelto de CAPE, contradiciéndola | los sueltos se guardan con `!laCombinacion` |
| Combinación **lloviendo** con `pop` = 0 | «nada que lo dispare» encima de «tormenta en marcha» | `hayChispa` incluye `lloviendo`: **el agua que cae es una medida, la probabilidad es una previsión** |
| **Ya rompiendo** | el rojo, y debajo el ámbar «mira el radar ANTES de autorizar» | `rompiendo` silencia el ámbar; el rojo va solo |

**Y el color NO baja: se queda en PRECAUCIÓN.** Lo que sobraba era el
titular de rayo, no el ámbar — con 1.500 J/kg encima una célula se forma
en dos horas, que es exactamente lo que le pasó en Bermeo el 24-08 sin
que lo avisara nadie. El estado `info` que se probó primero se retiró:
dejaba Girona en ámbar igual, por la puerta de atrás, y sin decir por qué.

Comprobado sacando `assess()` del fichero publicado y pasándole los nueve
casos: **una sola frase de tormenta en cada uno, ninguna contradictoria.**

### Y una regla de método que puso él ese día

> *«Prefiero que mires el tiempo de nuestra app, si no no sabemos si
> falla o no al comparar con otras web.»*

Yo le había dado la tabla de CAPE del este de España tirando de
`api.open-meteo.com` **por fuera**, y se la enseñé sin decirlo; él
preguntó *«los datos es de nuestra app no?»* y no lo eran.

**Tiene toda la razón: consultar la fuente por fuera no comprueba nada.**
La app puede estar rota en el proxy, en la caché, en el mapeo de campos o
en la hora, y yo no me entero. Cada consulta que hago es una prueba
gratis de la cadena entera. **Todo dato que se le enseñe va por `/om`,
`/estaciones`, `/rayos`, `/radar-aemet` o `/mareas`.** Ir por fuera, solo
para contrastar, y diciendo cuál es cuál.

Rehecha así, la app devolvió para Girona **exactamente los mismos
números** — o sea que la app no fallaba: el dato era bueno y lo que
estaba mal era la regla que lo leía.

## AROME se descolgó, y es el que sale por defecto (25-08-2026, noche)

**Medido para el miércoles 26 sobre los NUEVE emplazamientos suyos, todo
pedido por `/om`.** Salió mirando la discrepancia que avisó la sesión de
al lado, y es más gordo de lo que parecía.

| mañana 26 | AROME (Automático) | ECMWF | ICON-EU |
|---|---|---|---|
| Bilbao | 0,0 mm · CAPE 610 | 6,6 mm · **1930** | 0,8 mm · 1150 |
| Bermeo | 0,0 mm · CAPE 550 | 0,9 mm · 1760 | 0,8 mm · 900 |
| Sollube | 0,0 mm · CAPE 420 | 0,9 mm · 1760 | 0,9 mm · 1380 |
| Mungia | 0,0 mm · CAPE 480 | 0,9 mm · 1760 | 0,9 mm · 1060 |
| Gernika | 0,0 mm · CAPE 430 | 0,9 mm · 1760 | 0,7 mm · 1380 |
| Durango | 0,0 mm · CAPE 380 | 0,9 mm · 1760 | 0,3 mm · 1840 |
| **Oiz** | 0,0 mm · CAPE **300** | 0,6 mm · **2520** | 0,4 mm · 2050 |
| Lekeitio | 0,0 mm · CAPE 310 | 0,6 mm · 2520 | 0,2 mm · 1150 |
| Arbaiza | 0,0 mm · CAPE 280 | 0,0 mm · 1180 | 0,0 mm · 730 |

**AROME da 0,0 mm en los nueve** y su CAPE va de **tres a ocho veces**
por debajo. En Oiz: 300 contra 2.050 y 2.520.

**Y LA OFICIAL LE DA LA RAZÓN A LOS OTROS DOS.** Euskalmet para Bilbao
mañana: *«Intervalos nubosos y probables tormentas a partir de la
tarde»*, máxima **31°**. AROME da **36°** —cinco grados por encima de la
oficial— y cero lluvia. ECMWF 30° y ICON 29°, pegados a Euskalmet.
El pantallazo lo mandó Aitor.

**Por qué importa tanto:** en Bizkaia el Automático es AROME casi
siempre (medido el 24-08: 35 de 48 horas en Bermeo). Así que el día que
AROME se descuelga, **la app se descuelga con él y sin decirlo**. Este
es el caso: mirándola como la mira siempre, mañana no vería ni una
señal de tormenta.

**Lo que NO se puede concluir:** que AROME esté mal siempre. Es el de 1,3
km y es el bueno aquí para costa y monte — eso está medido y no cambia.
Lo que dice este caso es otra cosa: **cuando un modelo se separa tanto
del resto, la app tiene que cantarlo**, no elegir por él en silencio.

**Lo que se hizo esa noche:** avisarle a él directamente, con la tabla,
y decirle que mañana mire ECMWF o ICON antes de decidir sobre la tarde.
El aviso automático de discrepancia lo estaba montando la otra sesión.

**Y la lección de método:** esto salió porque él mandó el pantallazo de
Euskalmet. Contrastar con la oficial de aquí no es un lujo: es lo único
que distingue «los modelos discrepan» de «nuestro modelo se ha
descolgado».

## La barra decía APTO donde nadie sabía nada (25-08-2026, noche)

**Lo encontró él con «hay que corregir algo?».** El aviso de discrepancia
entre modelos ya estaba puesto y decía lo suyo. Pero medido en el sitio
publicado, BI BERMEO, pestaña Torre, para el miércoles 26:

```
14:00 APTO · 15:00 APTO · 16:00 APTO · 17:00 PRECAUCIÓN
```

y a esas 15:00 y 16:00 les daban tormenta **ECMWF, ICON, Meteored, Windy
y Euskalmet**. El texto estaba más abajo; **la barra es lo que se mira de
un vistazo**, y un verde limpio se lee como «puedes mandar a quien
quieras». Además el `windowHint` calculaba la ventana apta continua
**atravesando** esas horas.

**No se ha cambiado ningún color, y a propósito:** no sabemos que ECMWF
tenga razón sobre AROME. Lo que se sabe con certeza es que no se sabe, y
eso es lo que había que pintar. A esas horas se les quita la CERTEZA:

- van **rayadas** sobre el color que les toque (mismo lenguaje que las
  alturas estimadas),
- la **ventana apta se corta** al llegar a una, en vez de atravesarla,
- y al **pinchar** en la hora se dice con palabras, delante de los motivos.

### Tres estados, no dos

`horasEnDiscrepancia()` devuelve `{set, sabido}`. `S.discrepa` se pide
por emplazamiento y llega DESPUÉS del primer pintado, así que un Set
vacío puede ser «coinciden» o «todavía no ha llegado» — y pintarlos
igual sería repetir el fallo que esto arregla. Mientras no se sabe no se
marca nada **y tampoco se afirma nada**; la barra se repinta desde
`pintarDiscrepancia()` cuando llega la consulta. Lo avisó la sesión de al
lado antes de que se publicara.

### Y el primer intento estaba mal: rayaba 14 horas

Rayando toda hora en que otro modelo pasara de 700 J/kg, **BI BERMEO
salía con 14 horas seguidas rayadas** — casi el día entero, porque ECMWF
tiene CAPE alto de 10:00 a 23:00. Una marca que sale catorce veces no
marca nada.

Y era **el mismo error corregido esa misma tarde**: CAPE a secas no es
tormenta. Ahora al otro modelo se le exige **la combinación entera**,
igual que en `assess()`: código de tormenta (que no admite
interpretación) o CAPE ≥700 **con su propia tapa por debajo de 75**.

**Si ese modelo no publica inhibición no se raya por CAPE** — ECMWF es el
caso, medido: 0 horas de 24. No se calla nada: el bloque de arriba sigue
diciendo la diferencia de CAPE con su número. Lo que no se hace es
marcar una hora afirmando algo que no se ha podido comprobar.

Comprobado ejecutando la función **del fichero publicado** contra datos
reales:

| | rayadas | cuáles |
|---|---|---|
| BI BERMEO | **1** | mañana 14:00 |
| **BI OIZ** | **4** | mañana **14:00, 15:00, 16:00 y 17:00** |

Las cuatro de Oiz son exactamente la ventana en que coincidían las seis
fuentes. Antes eran 14 y no marcaban nada.

**Nota de método:** el panel del navegador se colgó a mitad de la
comprobación. En vez de insistir, se sacó `horasEnDiscrepancia()` y
`discrepanciaTormenta()` del `app.js` **publicado** y se ejecutaron en
node con datos reales de `/om`. Verificación bloqueada, otra vía.

## Dos carteles para el mismo fallo (25-08-2026, noche)

Salió de una pregunta suya —*«el panel del navegador se me colgó, ¿y eso
repáralo?»*—. **El cuelgue era de mi herramienta, no de la app** (panel
oculto, y encima lo maté yo lanzando una recarga desde dentro del propio
script). La app respondía con **2 MB de 4.295** y cero errores en
consola. Pero al comprobarlo aparecieron dos fallos guardados de esa
madrugada:

```
05:21:02  promesa  Received 2280 bytes, expected 65536
05:21:07  promesa  Received 2232 bytes, expected 65536
```

Es `getBytes()` de la librería de teselas: pide un rango de 64 KB y le
vuelve cortado. Se reintenta **tres veces con espera creciente**
(`Peticiones.conReintento`), así que esas dos fallaron tres veces cada
una.

**Lo que se comprobó antes de tocar nada, y es lo importante: el hueco
NO era silencioso.** Al agotarse los reintentos, `avisoTeselas()` saca su
propio cartel sobre el mapa:

> **N trozos del mapa sin cargar.** Donde no hay color puede ser que no
> haya llegado el dato, no que no pase nada. · Reintentar · ✕

Eso es exactamente lo que tiene que decir, y ya estaba. **El único fallo
era que ADEMÁS saltaba la barra roja de `Petardazo`**, diciendo lo mismo
por segunda vez — cuando el propio código dice «las teselas del mapa ya
tienen su propio aviso, no se duplica». El filtro no contemplaba ese
mensaje. Añadido `/Received \d+ bytes, expected \d+/i`.

Comprobado con siete mensajes, los dos primeros los suyos reales: se
callan los cuatro duplicados y **siguen saliendo en rojo los fallos de
verdad** (`ex is not defined`, `Cannot read properties of undefined`,
`Failed to fetch`).

**La lección, que es de método:** la pregunta era «arregla el cuelgue» y
el cuelgue no existía. Comprobarlo en vez de darlo por bueno destapó otra
cosa distinta y real. Y al mirarla, la mayor parte ya estaba bien
resuelta: lo que había que quitar era un aviso de más, no añadir uno.

## MUCAPE no es nuestro CAPE (25-08-2026, noche)

Aitor mandó capturas de **AguaceroWx** para el miércoles 26 y los números
no cuadraban con los nuestros. **No era un fallo: son variables distintas,
y conviene saberlo porque él contrasta con AguaceroWx constantemente.**

AguaceroWx pinta **MUCAPE** y **MUCIN** — «most unstable», la burbuja más
inestable de toda la columna. La app pinta el de **superficie**, que es el
único que publica Open-Meteo (comprobado: `mucape`, `most_unstable_cape` y
`cape_mu` devuelven 400).

MEDIDO para el 26-08 a las 17:00, mismo modelo GFS y mismo punto:

| | nuestra app | AguaceroWx |
|---|---|---|
| CAPE en Bilbao | **510** | **915** (MUCAPE) |
| Tapa en Bilbao | **119** | **58** (MUCIN, −58 en su signo) |

Con la ENERGÍA el patrón es de manual y va siempre en la misma dirección:
**MUCAPE ≥ el de superficie, por definición** — se elige precisamente la
burbuja que más tiene. Ahí AguaceroWx siempre se verá más gordo, y no
porque exagere.

> ### CORREGIDO EL 27-08-2026: con la TAPA no hay tal regla
>
> Aquí se escribió que la burbuja más inestable tiene **también** siempre
> menos tapa. **Es falso**, y estuvo cinco días en la leyenda de la capa
> Inhibición y en la Guía diciéndoselo a él.
>
> Medido el 27-08 a las 17:00, GFS 0,25°, nuestra tapa de superficie
> contra el MUCIN de sus capturas de AguaceroWx:
>
> | | app (superficie) | AguaceroWx (MUCIN) | |
> |---|---|---|---|
> | **Bilbao** | **20** | **91** | MU tiene MÁS tapa |
> | Donostia | 62 | 79 | MÁS |
> | Tolosa | 62 | 55 | menos |
> | Durango | 7 | 12 | MÁS |
> | Santander | 24 | 26 | MÁS |
>
> **Cuatro de cinco al revés.** Y Bilbao (20 contra 91) está muy fuera de
> cualquier error de leer la etiqueta en un pantallazo.
>
> **Por qué falla el razonamiento:** la burbuja más inestable se elige por
> tener el máximo CAPE, no la mínima tapa. Si está elevada, encima lleva
> más aire que atravesar y su CIN puede salir mayor. Que sea la más
> inestable no dice nada de su tapa.
>
> **Y el error empujaba al lado imprudente**, que es lo grave: el texto le
> decía que allí siempre vería MENOS tapa, o sea que descontara
> mentalmente la tapa que ve. El 27-08 AguaceroWx enseñaba MÁS tapa, que
> es la lectura prudente. Iba debajo de un mapa con el que decide si sube
> gente.
>
> Corregido en `maps.js` (capa `cin`) y en la Guía de `index.html`: los
> dos casos, el 26-08 (119/58) y el 27-08 (20/91), puestos como los dos
> casos que son y no como una regla.
>
> **La lección:** «por definición» valía para el CAPE y se extendió a la
> tapa por simetría, sin medirlo. Una regla que suena de manual sigue
> necesitando su medición.

**Y esto no es cosmético: cambia la decisión.** Con GFS, nuestra tapa de
119 dice «aguanta» y la combinación no salta; su MUCIN de 58 dice
«abierta». Una tormenta puede romper desde una burbuja elevada con la
superficie todavía tapada. Cuando los dos no cuadren, mirar de qué
burbuja habla cada uno antes de decidir cuál miente.

**Con ECMWF, en cambio, cuadramos bien**: nuestra app da 1.930 en Bilbao
y 1.760 en Bermeo, Gernika y Durango; AguaceroWx da 1.682 en Bilbao,
2.069 en Bermeo, 2.271 en Gernika y 1.951 en Durango. Mismo rango. Que a
nosotros nos salga el MISMO número en cuatro pueblos es la celda de 25 km:
comparten casilla. AguaceroWx interpola y los separa.

Escrito en la leyenda de las capas CAPE e Inhibición y en la Guía, para
que no haya que acordarse.

## Nuestro CAPE es de superficie, y en valles se queda corto (25-08-2026)

Salió contrastando con **AguaceroWx**, que él tiene y que enseña CAPE y
CIN **«most unstable»**. Comparado punto a punto, mismo modelo y misma
hora (miércoles 26 a las 17:00, ECMWF):

| | nuestra app (superficie) | AguaceroWx (MU) |
|---|---|---|
| **Bilbao** | **1.930** | **1.932** ← clavado |
| Santurtzi | 1.930 | 1.712 |
| Durango | 1.760 | 1.951 |
| Bermeo | 1.760 | 2.069 |
| Balmaseda | 1.160 | 1.578 |
| **Arrasate** | **10** | **1.252** |
| **Amurrio** | **70** | **915** |

**Bilbao coincide clavado: la cadena de datos está bien.** Pero Arrasate
y Amurrio se despegan enteros, y **no es artefacto de celda**: los CUATRO
modelos nuestros dan bajo allí (ECMWF 10, ICON 210, GFS 40, AROME 70).

Es la diferencia de MEDIDA. El «most unstable» busca la porción de aire
más inestable **a cualquier altura**; el de superficie solo mira la que
está a ras de suelo. En un valle de interior por la tarde, con una capa
fría pegada al suelo y aire inestable encima, el de superficie sale casi
a cero y **la tormenta se forma igual, arriba**. Y una tormenta elevada
suelta rayos exactamente igual — que es su veto.

**NO se puede arreglar con la fuente actual.** Probado contra `/om`:
Open-Meteo sirve `cape`, `lifted_index` y `convective_inhibition`, y
**no existe** `mucape`, `cape_mu`, `most_unstable_cape` ni
`convective_available_potential_energy`.

**Lo que se ha hecho, que es lo único honesto:** la ficha ya no dice
«Energía convectiva disponible» sino **«Energía convectiva DE
SUPERFICIE»**, y debajo se explica el límite con los números de Arrasate
y Bilbao, y se le manda a AguaceroWx cuando el sitio es de valle y el día
pinta de tormenta. Etiquetar el dato con su método, que es la regla de
esta app.

**Y una confirmación buena que salió del mismo contraste:** el CIN de
GFS en AguaceroWx (que va en negativo: −191 allí es tapa 191 aquí) dice
**tapa gorda en la costa** —Bermeo y Gernika −191, Santurtzi −157— y
**tapa abierta tierra adentro** —Durango −61, Arrasate −43, Azpeitia −46,
Laudio −50—. Es exactamente lo que había marcado nuestra app: riesgo
eléctrico en Durango, Oiz, Markina, Zornotza y Lekeitio, y no en Bermeo,
Sollube, Mungia y Gernika. Dos fuentes distintas, mismo reparto.

## La tapa: dónde gana la app (25-08-2026, noche)

Aitor encontró en AguaceroWx la capa **SBCIN**, que sí es la misma medida
que el `convective_inhibition` de la app —a diferencia del MUCAPE, que no
lo es—. Cotejado GFS contra GFS, miércoles 26 a las 17:00:

| | app | AguaceroWx |
|---|---|---|
| Reinosa | 72 | 64 |
| Guernica | 94 | 84 |
| Bermeo | 94 | 81 |
| Durango | 94 | 68 |

**Cuadran** (8 a 26 J/kg), y parte puede ser la pasada: la suya es la
25/08 12z y Open-Meteo no dice cuál sirve. Otros tres puntos salieron muy
dispares, pero **NO se anotan como discrepancia**: al leer el pantallazo
se le asignó el mismo valor a Arrasate y a Beasain, señal de que las
etiquetas se solapaban y se leyó mal. No se convierte en hallazgo lo que
puede ser un error de lectura.

**Y un dato suyo que importa: en AguaceroWx el CIN SOLO va con GFS.**
La app lo tiene también con **ICON-EU (7 km)** y con el Automático
—medido: ICON 24 h de 24, ECMWF y AROME 0 de 24—. O sea que **para la
tapa la app le da algo que AguaceroWx no puede darle**, y encima con el
triple de resolución, que en sus montes es justo donde se decide.

Se ve en el reparto de mañana con ICON-EU, tapa hora a hora:

```
                  13    14    15    16    17
BI OIZ            17     5     6    19    27   ← abierta de par en par
BI DURANGO        24    20    25    33    18
BI ZORNOTZA       54    46    37    48    36
BI MARKINA2        0     0     0    35    85
BI GERNIKA2       80    52    53    80   128
BI BERMEO        100    67    91   127   166   ← puesta
BI LEKEITIO      104   102   154   163   155
```

**El eje Zornotza–Durango–Oiz–Markina tiene la tapa prácticamente quitada
de 13:00 a 17:00.** La costa la tiene puesta. Es exactamente el reparto
que ya había marcado `assess()` y que confirmó el CIN de GFS de
AguaceroWx: dos fuentes y tres modelos, mismo resultado.

## El modelo no lee tu torre: lee su nudo (25-08-2026, noche)

Salió persiguiendo una diferencia con AguaceroWx en la inhibición y acabó
siendo lo más útil de la noche.

Los modelos no leen el emplazamiento: leen el **nudo de su rejilla más
cercano**, y Open-Meteo devuelve cuál ha usado en `latitude`/`longitude`
de la respuesta. Hasta hoy la app no lo miraba.

MEDIDO en cuatro sitios suyos, distancia del emplazamiento al nudo:

| | Automático | ECMWF | GFS | ICON | AROME HD |
|---|---|---|---|---|---|
| **BI BERMEO** | 0,4 km | **18,3 km** | **14,2 km** | 4,9 km | 0,4 km |
| BI OIZ | 0,9 km | 7,9 km | 6,6 km | 3,4 km | 0,9 km |
| Bilbao | 0,5 km | 5,5 km | 2,7 km | 5,5 km | 0,5 km |
| VI ARBAIZA | 0,9 km | 7,7 km | 0,5 km | 1,7 km | 0,9 km |

**El caso gordo: en Bermeo, ECMWF lee el nudo 43,250 / −2,750 — 18,3 km
AL SUR, tierra adentro**, en los montes entre Gernika y Durango. O sea que
el CAPE de 1.760 «de Bermeo» es en realidad el del interior. Y GFS lee a
14,2 km. AROME HD y el Automático, a 400 metros.

Esto explica de una vez varias cosas que parecían fallos:
- Por qué Bilbao y Llodio devolvían el MISMO número clavado con GFS
  (510/119) y Bermeo, Gernika y Durango otro (500/94): cada trío cae en
  la misma casilla de 0,25°.
- Por qué AguaceroWx da un valor distinto en cada pueblo: interpola el
  campo en vez de dar el nudo.
- Y refuerza lo que ya estaba escrito el 22-08 sobre ECMWF de 25 km
  mezclando mar y monte: no es solo resolución, es que **el punto que lee
  no es el tuyo**.

**Puesto en la app**, debajo de la altitud del modelo: «Dónde lee de
verdad ECMWF — a 18,3 km al S». Se marca en ámbar a partir de 8 km, con
la recomendación de irse a AROME HD o ICON para el punto exacto. Se
calcula de la respuesta, no de una tabla: si Open-Meteo cambia la
rejilla, el número cambia solo.

## El parte del día, dentro de la app (26-08-2026, madrugada)

Le monté el parte de la tormenta como página aparte para el móvil. Lo usó,
**cazó dos fallos míos**, y luego dijo lo que había que decir: *«hay que
hacer algo mejor que el enlace… app o algo de avisos… y que me salga el
parte»*. Tiene razón: la app ya la lleva en el móvil, funciona sin
cobertura, y un enlace suelto es una cosa más que recordar.

Va arriba del todo en **Mis torres**. Sus emplazamientos ordenados por lo
que rompe, y por sitio: la ventana de rayo, **CAPE y tapa juntos con su
hora**, y la lluvia en palabras.

### Los dos fallos que corrigió él

**1. Números sin su hora.** Le puse «tapa 54 · 46 · 37 · 48 · 36». Eran
las 13, 14, 15, 16 y 17, pero no lo ponía en ningún sitio.

**2. La tapa sin el CAPE.** *«¿Y CAPE no pones? Porque tapa pero no hay
potencia…»*. Los dos casos de ese día lo demuestran: **Arbaiza con la
tapa en 20 —abiertísima— y solo 640 de CAPE**, y **Bermeo con 1.220 de
CAPE y la tapa en 102**. Ninguno rompe, y por motivos contrarios. Una
cifra sola miente en las dos direcciones. Ahora van SIEMPRE juntas.

Y una tercera suya, la de la lluvia: *«cuando va a llover que me avise
lluvia, que siempre no hay rayos»*.

### Siete cosas que salieron al repasarlo dos veces

Él lo pidió así: *«hazlo despacio y bien, sin prisas, que nos jugamos la
vida, y lo vuelves a repasar todo dos veces»*. Salieron siete, y **dos
eran graves**:

| | qué pasaba |
|---|---|
| **Emparejado por posición** | el parte casaba datos y nombres por su sitio en la lista. Si añade o quita un emplazamiento entre pedir y pintar, **saldrían los números de un sitio bajo el nombre de otro**. Ahora se empareja por clave, como el resto de la pestaña |
| **La lluvia, del modelo de pantalla** | leía la lluvia del modelo cargado, que en Euskadi es AROME → **«sin lluvia en 24 h» en los diez emplazamientos** el día que ICON daba 1,3 mm en Durango. El punto ciego de siempre. Ahora mira todos los modelos y dice cuál lo ve |
| Horas sueltas como si fueran seguidas | «Cuatro gotas de 09:00 a 20:00» eran tres horas repartidas. Ahora dice «en 3 horas sueltas, entre las…» |
| Horas contadas por modelo | si ICON y ECMWF veían agua a las 19:00, contaba dos horas. Ahora se cuentan distintas |
| Ventana cruzando medianoche | «de 23:00 a 01:00» sin decir de qué día. Ahora «de hoy 23:00 a mañana 01:00» |
| Números a la inglesa | «CAPE 2680» y «0.4 mm». Y a mano, no con `toLocaleString`, que necesita que el navegador traiga la tabla de idiomas |
| **Etiqueta verde con lluvia debajo** | un sitio salía en verde «SIN RAYO» y debajo **12,4 mm a las 18:00**. Mismo fallo que la barra de 48 h de la tarde: la etiqueta afirmaba lo que el renglón de abajo desmentía. Ahora la etiqueta dice LLUVIA o SIRIMIRI |

Y de rebote: **los milímetros iban con punto en el resto de la app**
(`0.4 mm/h` en la ficha de Torre) mientras el parte decía `0,4`, en la
misma pantalla — y en la franja del día ya ponía «Menos de 0,1» con coma.
Unificado con `mmTxt()`, probado con nueve valores incluidos los huecos.

Comprobado sacando `renderParte()` del fichero y pasándole casos puestos a
propósito: cruce de medianoche, una sola hora, horas sueltas, sirimiri de
mañana, sin gasolina y tapa que aguanta. Y verificado después contra lo
publicado, campo por campo.

## La segunda pasada, automatizada (26-08-2026)

Pedido por él con estas palabras: *«por eso de verificar siempre 2 veces
antes de publicarlo, eso automatizarlo, así se encuentran los errores»*.

Y tiene toda la razón. `revisar.sh` cogía la sintaxis y las variables
huérfanas — pero **NINGUNO de los fallos gordos de estos días era de
sintaxis**. Eran de criterio y de redacción, y solo salieron porque
alguien se paró a mirar la salida caso por caso.

**`pruebas.js`** saca las funciones del `app.js` de verdad —no de una
copia que se queda vieja— y comprueba **lo que DICE la app**, que es lo
que él lee para decidir. **22 pruebas**, y cada una guarda un fallo que
ya ocurrió:

| lo que guarda | el fallo que evita |
|---|---|
| Lekeitio, Durango y Bermeo siguen avisando | que un cambio de umbral deje de cazar las que rompieron de verdad |
| **Girona NO avisa** | el aviso con CAPE alto y nada que lo dispare |
| sin dato de probabilidad avisa igual | que un hueco valga como «no hay disparador» |
| cargado y lloviendo avisa | que la probabilidad prevista pise al agua que cae |
| una sola frase de tormenta por hora | las dos frases contradictorias de aquella tarde |
| 0,4 y no 0.4 · «de AYER» | los números a la inglesa y los datos viejos sin cantar |
| ventana que cruza medianoche | «de 23:00 a 01:00» sin decir de qué día |
| horas sueltas dichas como sueltas | «de 09:00 a 20:00» para tres horas repartidas |
| CAPE y tapa siempre juntos | la cifra sola, que miente en las dos direcciones |
| ninguna etiqueta verde con lluvia debajo | el verde «SIN RAYO» con 12,4 mm al lado |
| sin emplazamientos guardados **se dice** | la tarjeta que desaparecía en silencio |

Enganchado a `revisar.sh`, o sea que **`deploy.sh` no publica si falla
alguna**. Probado de verdad, no de palabra: se cambió `TAPA_POP` de 10 a
0, se intentó publicar, y **no publicó** — código de salida 1 y el sitio
se quedó en la versión anterior. Restaurado, publica.

`pruebas.js` está en `.vercelignore`: comprobado que da **404** en el
sitio.

**Cómo añadir una prueba cuando aparezca un fallo nuevo:** que la prueba
diga en su nombre **el caso real**, no la condición técnica. «Girona
25-08 (1500/33/0%) NO avisa — cero descargas medidas» explica sola por
qué existe; «cape>=700 && cin<75 && pop>=10» no explica nada dentro de
seis meses.

**Dos trampas del banco de pruebas, por si hay que tocarlo:**
1. Lo declarado con `function` sale del `eval` y queda visible; **lo
   declarado con `const` NO** — se queda encerrado. Por eso hay
   `sacar()` y `sacarConst()`.
2. Al quitar las etiquetas HTML para comparar texto se meten espacios, así
   que las expresiones de comparación tienen que aceptarlos (`\s*`).

## EL MODELO NO LEE TU SITIO: LEE TIERRA FIRME (27-08-2026)

**Lo destapó él**, mandando los mapas de **superficie** de AguaceroWx —SBCAPE
y SBCIN, que son la MISMA variable que usa la app— y viendo que no cuadraban.

No fallaba ninguno de los dos. **Leían puntos distintos.**

La app pedía los datos **sin decir qué celda quería**, así que Open-Meteo
usaba la suya por defecto: `land`, o sea **busca tierra firme**. Y para un
sitio pegado al agua, la tierra firme más cercana en una malla de 25 km
puede caer muy lejos.

**BI BERMEO, 27-08-2026 a las 17:00:**

| | dónde lee | CAPE | tapa |
|---|---|---|---|
| **ECMWF, celda de tierra** (lo que enseñaba la app) | **18,3 km al S** | **20** | — |
| **ECMWF, celda de al lado** (Bermeo de verdad) | 10,0 km | **1.110** | — |
| GFS, celda de tierra | 14,2 km al S | 100 | 7 |
| **GFS, celda de al lado** | **2,1 km** | **550** | **94** |
| AguaceroWx SBCAPE/SBCIN en el punto | interpola | **≈543** | **≈91** |

**AguaceroWx clava la celda de al lado: 543 contra 550 y 91 contra 94.** O
sea que su número era bueno y el nuestro también — pero el nuestro era el de
los montes entre Gernika y Durango, que no es Bermeo.

**A quién le pasa** (distancia del nudo de tierra al emplazamiento):

| | GFS | ECMWF | ICON |
|---|---|---|---|
| **BI BERMEO** | 14,2 km | **18,3 km** | 4,9 km |
| **BI SOLLUBEMENDI** | 10,9 km | 13,5 km | 1,2 km |
| **BI LEKEITIO MOV** | 9,6 km | 12,9 km | 4,5 km |
| BI MUNGIA | 5,1 km | 11,5 km | 2,0 km |
| BI MARKINA2 | 5,9 km | 0,8 km | 0,8 km |

**Son sus tres sitios de costa, y solo con los modelos de malla gruesa.**
ICON los lee a 1-5 km. Tierra adentro no pasa.

**Y esto tumbó una conclusión mía de esa misma tarde.** Yo le había dicho
«ICON está solo, los otros cuatro no ven nada». Era falso: estaba comparando
ICON **en Bermeo** contra los demás **a 15 km monte adentro**. Leyendo todos
el punto de Bermeo, ECMWF daba 1.110, GFS 550 e ICON 760 — **los tres de
acuerdo en que había energía**. El que decía que no era AROME HD, el de 1,3 km,
que sí lee Bermeo clavado. No era «uno contra cuatro»: era **los gruesos
contra el fino**.

### Lo que se hizo, y lo que NO

**NO se ha cambiado ningún número de la ficha.** Lo de superficie
—temperatura, viento, lluvia— sigue saliendo de la celda de tierra, que es
la que corresponde a un sitio en tierra: una celda de mar tiene otra física
y su viento no es el de tierra.

**Lo que se hace es CONTARLO.** `cell_selection: 'land'` va ahora escrito a
mano en `loadAll` (antes era un descuido), y cuando el nudo se va a **8 km o
más** —el mismo listón con el que la ficha ya pintaba el «dónde lee de
verdad» en ámbar— se pide **también** el nudo más cercano, solo para CAPE y
tapa. Si ahí salta la combinación y en el de tierra no, sale un aviso ámbar
debajo del «dónde lee», con las dos distancias y los dos números.

**El vigilante sí une las dos celdas**, porque para avisar el fallo caro es
el que se calla. **Medido antes de ponerlo**, sobre sus 15 emplazamientos y
48 horas: **8 horas de aviso con la celda de tierra, 10 con las dos**. Dos
horas más en dos días, las dos en la costa (Bermeo 18h, Lekeitio 21h). No es
ruido: es lo que faltaba.

## LA ALTURA DE LA NUBE SUMA, PERO NUNCA CALLA (27-08-2026)

También de sus pantallazos, los del mapa de la app con «Tope convectivo» y
«Base convectiva». Esa tarde el tope no pasaba de 6,8 km y **la tarde del
24 que oyó truenos llegaba a 10.640 m**. Buena pista… y estuve a punto de
usarla para BAJAR el aviso.

**Lo impidió la medida:**

| | |
|---|---|
| horas con tope publicado (ICON) | **33 %** |
| horas con tope publicado y CAPE ≥ 700 | **36 %** |
| horas con tope publicado (GFS) | **0 de 1.008** |
| casos reales que rompieron **sin** tope publicado | **3 de 5** |

Los tres sin dato incluyen **Lekeitio y Durango, los que le reventaron los
postes**. Una regla de «tope bajo → bajar el aviso» los habría callado. Es
la regla 2 de esta app: un hueco no puede valer como «aquí no pasa nada».

**Así quedó:** el tope **suma y jamás resta**. Sobre 9 km, «tan alta como la
noche de Lekeitio». Bajo 7 km, «**aunque** la nube se queda en X km y a esa
altura se electrifica poco» —empieza por «aunque» para que no se lea como
que no hay riesgo—. Sin dato, **no se dice nada y el aviso queda intacto**.
Y si la **base** cae por debajo de la cota del sitio, se avisa de que quien
suba estaría **dentro** de la nube. Cinco pruebas bloquean el deploy si
alguien intenta que el tope baje un aviso.

## EL PARTE NO DECÍA DE CUÁNDO ERA (27-08-2026)

Suyo: *«¿cuándo está actualizado? no veo la hora, ¿es de hoy? ¿de ayer?»*.
Y no lo veía **porque no estaba**: la única hora de la pantalla era la de la
foto de portada, que es otra cosa.

Ahora, entre las pestañas de día y la lista: `Calculado hoy a las 15:43`. A
partir de 45 min se pone en ámbar y manda recargar. **Y si es de ayer** —la
app abierta toda la noche, que es el caso que de verdad ocurre— sale en rojo
con fondo: *«NO es de hoy: recarga antes de decidir»*.

## EL GUARDIA DE LAS CAPAS ESTABA DECLARADO Y NO LO LLAMABA NADIE (27-08-2026, 22:00)

Encontrado en la revisión de la noche, y es de los que no dan la cara.

El 24-08 la capa de Presión ponía **10 hPa** en toda Europa: la tesela había
pasado de pascales a hPa y la app seguía dividiendo por 100. **No dio ningún
error, porque no lo había: dio un número.** Contra eso se escribió
`fueraDeRango()`, que compara cada valor con lo posible en la Tierra, y en
este mismo fichero quedó escrito que *«lo canta en la barra de estado»*.

**No lo cantaba.** Medido por dos vías que coinciden:

| Vía | Qué dijo |
|---|---|
| el `maps.js` de aquí | `fueraDeRango` aparece **1 vez**: su declaración |
| el `maps.js` **servido** en Vercel | **1 vez**, la misma |

O sea **tres días de código muerto** donde el CLAUDE.md afirmaba que había un
guardia. Y no lo cazaba nada: `revisar.sh` pasa ESLint con `no-undef`, que
mira variables huérfanas, **no funciones que nadie usa**; y en pantalla no se
nota, porque solo se notaría el día que una fuente cambie de unidad — que es
exactamente el día en que hace falta.

**Enganchado en los dos sitios donde se lee un número de la capa:**

- `valores()` — los números sobre las ciudades. Se comprueba **cada punto**
  (hasta 26) con el valor YA convertido, y el peor sale en la barra de estado
  detrás del modelo y su pasada. Se borra solo al cambiar de capa, que si no
  quedaría un aviso colgado bajo otra etiqueta.
- `consultar()` — al pulsar en el mapa. Va aquí también porque **con los
  números apagados el popup es la única lectura que hay**.

Cuidado con una trampa que casi me la cuela a mí: la comprobación tiene que ir
sobre el valor **convertido**, no sobre el crudo de la tesela. La visibilidad
viene en metros y se enseña en km; comprobando el crudo, un día despejado de
41.425 m saldría como «41.425 km, imposible». Así lo medí yo primero, y el
fallo era de mi comprobación, no de la app. Hay una prueba que lo fija.

**Siete pruebas nuevas en `pruebas.js`** (178 en total), y bloquean el deploy:
que `fueraDeRango` se LLAME y no solo se declare, que esté en los dos sitios,
la presión de 10 hPa del 24-08, los 1013 buenos, la visibilidad en km y no en
metros, y que un hueco no se convierta en aviso. Probado de verdad: quitando
las llamadas, las tres primeras fallan.

Comprobado sobre lo publicado (v2026.08.27-2217): con Temperatura, 17 números
en pantalla y **ningún aviso falso**; y forzando los 10 hPa del 24-08, la barra
pasa a *«AROME HD · 1,3 km · pasada… · OJO: Presión da 10.0 hPa, que es
imposible»* y vuelve a su sitio al quitarlo.

**La lección, que no es del mapa:** un guardia escrito no es un guardia
puesto. Todo lo que este fichero dé por hecho que vigila algo tiene que tener
debajo una prueba que falle si se desenchufa.

## EL CIELO PASA AL EUROPEO, Y EL MAPA A LOS 9 km (02-09-2026)

**Empezó con un dato suyo por la ventana:** *«buen tiempo en Bermeo todo el
día con nubes blancas de algodón, pero deja de sobra pasar el sol»* ·
*«pocas nubes»*. Y la app, con ARPEGE de dueño del cielo, daba 49-64 % a
esas horas — el Automático llegó a dar **100 % cuatro horas seguidas**.

**Cinco fuentes independientes le dieron la razón:**

| | |
|---|---|
| el **satélite** (medida, EUMETSAT cada 15 min) | 38 % → 15 % → 9 % → 3 % |
| **Euskalmet** | «poco nuboso desde las 12:00» |
| **Meteoblue** | bajas 80-95 % a las 11:00 → <20 % por la tarde |
| **Windy** (con ECMWF puesto) | Bermeo 70 % → 3 % |
| **ECMWF** en nuestra app | 20 · 8 · 3 — clava la evolución |

**Y lo que decidió el cambio no fue el día, fue esto:** la elección de
ARPEGE (31-08) se hizo **contra ICON**, y **ECMWF nunca estuvo en esa
comparación**. Más su criterio de meses, que no es de una tarde: *«windy
acierta mucho con el modelo europeo»* · *«el europeo en AguaceroWx también
lo clava, casi siempre»* · *«me dicen los que revisan los mapas que para
aquí ese es el mejor modelo»*.

**Y una razón de mecanismo, que es la que lo hace irreversible:** el aviso
de **sirimiri** se dispara con el CÓDIGO de llovizna y los MILÍMETROS. El
código era de ARPEGE y el agua de ECMWF: **dos modelos dentro de la misma
regla**, y es la que le dice si el poste y la escalera van mojados. Ahora
van del mismo dueño.

**Dos pegas que puso él y que quedan en pie:**

1. *«windy utiliza el europeo de 9 km»*. **Y no es el mismo.** Comprobado:
   Open-Meteo NO sirve el de 9 km por la API (`ecmwf_ifs025` son 25 km,
   `ecmwf_ifs04` 44 km, los `aifs` de IA a 0,25°). El de 9 km existe solo
   en las TESELAS del mapa — y por eso **el mapa arranca ahora en
   `ecmwf_ifs`, los 9 km, el mismo que pinta Windy**.
2. Ese ECMWF de 25 km, en Bermeo, lee el nudo **18,3 km tierra adentro**.
   En sus tres sitios de costa no lee su punto. Si el cielo afloja ahí,
   ésta es la primera sospecha.

**Y lo que NO cambia, dicho por él:** *«salvo CAPE CIN que algunos modelos
europeos no tienen datos»*. Medido: ECMWF publica la tapa **0 horas de 24**.
Sigue viniendo de ICON por `QUIEN_LO_MIDE` y se dice de quién.

**El precio del mapa a 9 km, que hay que tener delante:** con ECMWF HRES el
mapa se queda sin memoria **al quinto cambio de capa** (con ICON-EU aguanta
nueve, medido el 30-08). Se cambia igual porque la red de seguridad está
puesta y probada: cartel, recarga sola a la misma capa y hora, y a la
tercera se planta y manda a ICON-EU. El peor caso es una recarga.

## EL AVISO DE NUBES SALTABA DOS DE CADA TRES HORAS (02-09-2026)

Suyo, viendo «Despejado ⚠ los otros ven 18 % de nubes»: *«es que esto ya
pasa muchas veces»*. **MEDIDO sobre 240 horas** (5 emplazamientos suyos,
48 h): saltaba el **65 %**.

| criterio | salta | ¿caza el Bermeo del 28-08? |
|---|---|---|
| el viejo (abanico ≥50 o descolgado ≥45) | **65,0 %** | sí |
| descolgarse ≥60 de la mediana | 0,8 % | — |
| cambia la lectura, UNO lo dice | 21,2 % | sí |
| cambia la lectura, DOS o más | 2,9 % | **NO** ← se cargaba el caso real |
| **las dos puertas juntas ← puesto** | **5,4 %** | **sí** |

Salta si **dos o más cambian la lectura** (él claro, ellos cubierto) **o**
si **uno solo se separa 90 puntos** — que es el caso que él fotografió el
28-08: la app decía Despejado y otro daba 100 %.

**Y dos lecciones de método del mismo rato:**

1. **Las cinco pruebas nuevas pasaban sin comprobar nada.** `COMPARAR`
   estaba vacío en ese punto del fichero, así que `cieloRaro` devolvía
   null siempre. Se vio SOLO al romper el listón a propósito. Ahora el
   banco se monta dentro del bloque y hay una prueba que salta si se
   vacía.
2. **La decisión estaba DUPLICADA** —una guarda y el reparto— y por eso
   romper una no cambiaba nada. **Una decisión duplicada no es más segura:
   es una que no se puede vigilar**, porque ninguna prueba puede verla
   fallar. Ahora vive en una sola línea.

## Pendiente

- **Sus umbrales de empresa.** Los actuales son genéricos, puestos por mí.
- Ver el radar de AEMET con lluvia encima para cerrar esa capa.
- Velocidad: abrir una hora nueva cuesta 2 s con ICON-EU y 6,4 s con ECMWF HRES.

## Cómo trabaja él

Manda pantallazos de AguaceroWx, Windy y Ventusky para contrastar (tiene premium
hasta enero de 2027). **Ventusky es la mejor para eso**: su URL lleva la hora en
UTC y el modelo, y el globito se ancla al nombre del sitio.

Cuando compares, asegúrate de que coinciden modelo, hora válida y punto exacto.
Varias veces han parecido fallos que solo eran horas o celdas distintas.

## LO MEDIDO Y LO CALCULADO NO SE MEZCLAN NUNCA

Suyo, 28-08-2026, dicho ya dos veces: *«datos reales siempre en la app, de
los modelos, y lo de las estaciones de Euskalmet aparte, sin mezclar nada»*.

**Son dos naturalezas distintas.** Un modelo calcula; un anemómetro mide. Y en
sus cimas eso no es un matiz: junio en el Oiz dio 32 horas por encima de sus
60 km/h y el pronóstico solo habría avisado de dos.

Cómo está montado, y así se queda:

- **Izquierda del parte: los modelos.** Racha del día, CAPE y tapa, lluvia, las
  cifras de la hora en curso y los siete modelos uno a uno, sin promediar.
- **Derecha: la estación.** Lo que marca el aparato, con su nombre, distancia,
  altitud, altura de medición y antigüedad del dato. **Dentro de esa caja no
  entra ni un número calculado.**
- **Un hueco no se rellena con la otra fuente.** Si la estación no tiene
  pluviómetro, pone «no la mide». Si ninguna cercana tiene anemómetro, pone
  «sin aparato cerca». Si el CAPE no lo mide ningún aparato, se dice.
- **La única línea que junta las dos** es el veredicto final —«nuestro
  pronóstico se quedó 8 corto»—, y es una comparación pedida por él. Se calla
  sola cuando la estación está a más de 200 m de desnivel de su emplazamiento,
  porque entonces no compara nada.

Y la regla hermana, del mismo día: **lo que la app pueda averiguar sola, que no
se lo pregunte.** La cota salía vacía, se leía como 0 m y le gritaba en rojo por
un desnivel de 669 m que no existía. Si un campo derivable está vacío, no se
calcula con él ni se avisa de nada — nunca se trata como cero.

## LA RACHA TAMPOCO PODÍA IR SOLA (30-08-2026)

Salió de él, y en cadena. Primero cazó lo de la lluvia mirando la pantalla:
*«pone 0mm pero ya te esta diciendo que 2 marcan agua entonces ese 0mm creo
que no pinta no?»* y *«proxima lluvia no se espera...eso mal no?»*. Y en
cuanto se arregló, lo generalizó él solo:

> *«y eso solo con lluvia, con viento, cape etc hara lo mismo??»*
> *«si ha fallado en lluvia, te aseguro que en los otros tambien lo hara,
> revisalo 2 veces»*
> *«y nubosidad claro pero todo eso en las tres capas de torre, mis torres
> y ahora»*

**Tenía razón.** MEDIDO ese día en Bermeo a las 14:00, por las dos vías (la
app y `api.open-meteo.com`, que coincidieron campo por campo):

| en «Ahora» | más alto | más bajo | |
|---|---|---|---|
| **Ráfaga a 10 m** | **ICON 39,2** | **GFS 14,4** | **×2,7 — 25 km/h** |
| CAPE | GEM 180 | ECMWF 40 | ×4,5 |
| Visibilidad | ICON 29,8 km | HARMONIE 10,5 km | ×2,8 |
| Humedad | HARMONIE 91 % | GFS 61 % | 30 puntos |
| Temperatura | GFS 26° | HARMONIE 21,2° | 4,8° |

Todas esas casillas enseñaban **un solo número, sin decir nada**. Solo
Precipitación y Nubosidad preguntaban a los demás.

### El listón, calibrado — no puesto a ojo

Sobre **1.440 horas**: sus 20 emplazamientos, 3 días, los 7 modelos contra
el Automático (`revisiones/calibrar-discrepancia.mjs`).

| criterio | salta en |
|---|---|
| otro cruza sus 45 km/h y el cargado no | 1,7 % |
| otro cruza sus 60 km/h y el cargado no | 0,1 % |
| se separa ≥20 km/h | 1,4 % |
| **los tres juntos ← el elegido** | **2,7 %** |
| (descartado) se separa ≥10 km/h | 14,5 % |
| (descartado) el más alto es ≥1,5 veces | 34,6 % |
| (descartado) el más alto es ≥2 veces | 21,3 % |

El 2,7 % es el mismo nivel al que salta la combinación de tormenta de
`assess()` (2,8-4,0 %) y la mitad que el aviso del cielo (8-9 %).

**Las reglas por proporción se descartaron por ruido puro:** «el doble»
salta con **5 contra 11 km/h**, que no le cambia nada a nadie. El criterio
bueno **se define por lo que le cambia la decisión** —cruzar SU listón— no
por un porcentaje abstracto.

**El caso que lo justifica, de ese mismo día y de un sitio suyo:**
BI SOLLUBEMENDI a las 14:00, Automático **27** e **ICON 55**. Su aviso está
en 45. Con el Automático puesto —que es el que sale por defecto— no vería
nada. Y BI VIRGEN ORDUÑA a las 15:00: Automático 38, ICON **62**, con su
tope en 60.

### Dónde se enganchó, y dónde NO

`rachaQueNoVesTu()` decide y `avisoRacha()` escribe, **en un solo sitio**,
igual que `cieloRaro()`/`avisoCielo()`. Va en la ficha de **Torre** y en la
casilla de **Ahora**, pegado al número y en ámbar cuando otro cruza un
listón que el tuyo no cruza. **El número no se toca**: es el de su modelo y
lo ha elegido él.

**En «Mis torres» NO se enganchó, y es a propósito.** Allí cada fila es un
emplazamiento distinto y `S.comparativa` es la del sitio que tengas abierto
en pantalla: pondría la racha de otro modelo **de otro sitio**. Esa pantalla
ya lo resuelve mejor, con el desglose entero de los cinco modelos.

**Y una cosa que se comprobó antes de tocarla, porque parecía otro fallo:**
la cabecera de «Mis torres» dice «los 5 juntos» y la fila enseña el del
modelo cargado. Pero **el semáforo sí usa el más alto de todos y sí dice de
quién es** — `gMax = Math.max(h.gust, peorRacha(h).v)` y el motivo escribe
*«lo dice ICON, y tu modelo da 29»*. Eso estaba bien. Hay una prueba que
falla si alguien lo desengancha.

### Lo que cazó la verificación en pantalla

Publicado y comprobado sobre el fichero servido, la casilla quedaba así:

```
10 km/h  ⚠ ICON 55 km/h
⚠ ECMWF da 10 km/h y ICON 55 km/h — por encima de tu listón de 45 km/h
```

**El número de ICON dos veces en cuatro centímetros**, y el del cargado
también. Ya estaba escrito aquí a cuenta de las dos frases de tormenta de
Girona: *«decir dos veces lo mismo es ruido»*. Corregido en la v2205: arriba
va el dato, y el pie dice lo que significa —«ICON cruza tu listón de 45 km/h
y ECMWF no»—. Cinco pruebas lo fijan.

**Y esto no lo cazaron las pruebas: lo cazó mirar la pantalla.** Las 527
pasaban en verde con el texto repetido. Es la tercera regla de esta app.

### Lo que NO se tocó, y por qué

**Viento medio, temperatura, humedad, visibilidad y punto de rocío siguen
sin marca.** No tienen listón de decisión con el que medir «desacuerdo que
importa», así que cualquier corte sería inventado — y la app ya tiene
escrito que un ámbar permanente deja de significar nada. El CAPE tampoco:
su desacuerdo ya lo cubre la combinación de tormenta de `assess()`, que
mira CAPE **y** tapa juntos, que es como se decide.

## LA NIEVE SE QUEDABA EN CERO SIN HABERLA MIRADO (31-08-2026, 05:00)

Encontrado en la revisión de la madrugada, comparando la caché de la app
con el origen. **AROME HD —el modelo que sale por defecto desde el
29-08— no publica `snowfall` ni `snow_depth`**, y ninguno de los dos
estaba en `COMPLEMENTOS`.

Medido por las dos vías, que coincidieron campo por campo
(`revisiones/nieve.mjs`):

| | snowfall | snow_depth | isocero |
|---|---|---|---|
| Automático | sí | sí | sí |
| ECMWF 25 km | sí | sí | **no** (ya estaba cubierto) |
| GFS | sí | sí | sí |
| ICON | sí | sí | sí |
| **AROME HD** | **NO** | **NO** | **no** (ya estaba cubierto) |

**Y el hueco no se veía como hueco, que es lo que lo hace grave.**
`comoEstaLaPista()` no enseña la nieve: la **acumula**
—`nieveAntes += nv`, `nieveHoy += nv`—. Con AROME cargado, `nv` era
`null` todas las horas, así que los dos contadores se quedaban en **0**.
Cero no se lee «no lo sé»: se lee **«no ha nevado»**. Es la regla 2 de
esta app por la puerta de atrás, y debajo se decide si se llega o no a un
emplazamiento de monte en invierno, de noche y con el remolque detrás.

En agosto no cambia nada. En enero decide.

**Arreglado** (v2026.08.31-0523): `snowfall` y `snow_depth` en
`COMPLEMENTOS`, con su nombre en cristiano en `NOMBRES_COMPL` («la nieve
caída», «la nieve en el suelo»). `QUIEN_LO_MIDE` ya sabía a quién
pedírselas —ICON primero— así que no hubo que tocarlo. Comprobado sobre
lo publicado, con AROME cargado en Bermeo: las dos salen prestadas de
ICON y la caché queda con **0 campos vacíos** de los catorce de decisión.

**Tres pruebas nuevas lo fijan**, y una de ellas ya salió roja mientras se
escribía: la que comprueba que la nieve NO se le pide a AROME buscaba
`arome` a secas, y eso casa también con `knmi_harmonie_arome_europe`, que
sí la publica. El que no la publica es el de Météo-France y hay que
nombrarlo entero. Un descuido de esos convierte una prueba en un adorno.

**Cuidado al colocar cosas en `COMPLEMENTOS`:** hay una prueba que ancla
`'wind_speed_80m', 'wind_direction_80m',` al **final** del array. Lo nuevo
va antes de esas dos, no detrás.

### Y una nota de método, del mismo rato

Repasando el mapa capa por capa, **CAPE, Presión, Humedad, Visibilidad e
Isocero devolvieron CERO números** en la primera lectura. Estuve a punto
de anotarlo como hallazgo. No lo era: son las capas `densa:true` y
tardan, y desde un panel oculto los `setTimeout` van estrangulados, así
que mi ventana de medida se quedaba corta. Con la espera fuera de
JavaScript salieron las cinco, con valores posibles:

| | medido | posible |
|---|---|---|
| Presión | 1014-1023 hPa | 850-1085 |
| Temperatura | 10-23 °C | −60/60 |
| Humedad | 61-95 % | 0-100 |
| Visibilidad | 9-40 km | 0-100 |
| Ráfagas | 2-47 km/h | 0-400 |
| Isocero | 3.671-4.584 m | — |
| Espesor de nieve | 0,0 m en todas | — |

Y contrastando la tesela con la API por puntos en Bermeo, mismo modelo
(ICON-EU) y misma hora: **presión clavada** (1021,4 contra 1021,5),
temperatura 2,1 °C y ráfaga 2,6 km/h de diferencia — que es el efecto
costa ya documentado, porque la API pide `cell_selection=land` y la
tesela interpola entre la celda de tierra y la de mar.

**La lección:** un cero de mi instrumento no es un cero del dato. Antes de
escribir un hallazgo hay que descartar que el fallo sea de la medición —
igual que con la visibilidad en metros del 27-08.

### Y era peor de lo que parecía: el bloque de acceso no podía saltar

Al repasarlo por segunda vez salió el alcance de verdad. No es solo que
`comoEstaLaPista()` acumulara ceros: **`acceso()` decide la nieve con
`x.nieve ?? 0` y `h.nieveSuelo ?? 0`**, y con AROME cargado esos campos
llegaban `undefined`. O sea que las tres ramas de nieve del bloque de
acceso —

```
nieveSuelo >= 0,03  → «cadenas, y con remolque olvídate»
nieveCae   >= 1     → «la pista se cierra»
nieveCae   > 0      → «lleva cadenas»
```

— **no podían dispararse nunca**. No es que avisaran de menos: es que con
su modelo por defecto eran código muerto, igual que `fueraDeRango()`
declarado y sin llamar del 27-08. Y el `?? 0` es justo lo que lo
escondía: convierte «no lo sé» en «cero», que es lo que este fichero
lleva escrito desde el principio que no se puede hacer.

Comprobado hoy que el bloque no sale en Bermeo, y **eso es correcto**: no
hay nieve, el isocero está a 4.500 m, no llueve y se ve a 40 km. No hay
nada que decir. Lo que se ha arreglado es que en enero sí pueda decirlo.
