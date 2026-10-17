# Para la sesión del iMac — 17-10-2026 (desde el MacBook)

## 0. Lo primero
- `./subir-a-github.sh`: los commits del MacBook de hoy están sin subir (el MacBook no tiene la llave).
- **Publicar el Centro Operativo** (`../centro-operativo`, `./publicar-cloudflare.sh`): `js/weather.js` lleva
  `LISTON.gustWarn: 60` (antes 70). Es la orden suya de hoy y la app y el vigilante ya lo tienen. Pasa antes
  la revisión del CO.

## 1. Publicado hoy desde el MacBook (hasta 2026.10.17-1141), cada cosa con su prueba vista en rojo
- **Lluvia del mapa:** lo flojo (0,1-0,6 mm/h) como velo; los cortes de Windy pasados a mm/h (rojo desde
  7 = 20 mm en 3 h, magenta 10). Suyo: «los mapas de lluvia pintan demasiado» · «Windy pinta en rojo y el
  nuestro en amarillo» · «quiero como Windy». Las PALABRAS de los avisos siguen con AEMET.
- **Al entrar en una capa de lluvia el mapa se pone en AROME HD** (registro de aciertos: 53 %, la mitad de la
  lluvia fuerte; ICON 49 %, GFS y ECMWF 45 %; ECMWF pinta agua en 3 de 4 horas secas). Si él cambia, manda él.
- **Ventanita del mapa:** las capas de números, barbas y partículas van DENTRO de `.mapc` (hace caja propia;
  el arreglo del 15-10, comparando z-index, no podía funcionar).
- **Hora en curso:** `conAhora` no deja que el `current` del cargado (AROME, que no publica código: Open-Meteo
  se lo fabrica) pise un cielo prestado. App y agenda, el mismo cielo.
- **Racha: aviso a 60** (suyo: «cuando superen rachas de 60 me preocuparé» · «sí, 60»). Perfiles caseta y
  dentro, y `RACHA_TOPE` del vigilante. El rojo sigue en 90; el 70 del 4x4 (`TOPE_ACCESO`) es otro.

## 2. Windy (su cuenta Pro)
- Colores vivos del 16-10: ya sincronizados por la cuenta (iguales en el MacBook). Mandados por correo.
- «Temperatura [temp]» cambiada a la rampa de la T850 de la app (frío en azules; fuera el amarillo a −25 °C).
  La de antes, en `revisiones/windy-temp-antes-17-10-2026.json`.

## 3. Pendiente
- Velocidad de T850 y viento: él los nota lentos; en el MacBook no se reprodujo (≈2 s). Pedirle captura con el
  «Cargando… N s» y el aparato.
- ECMWF de 9 km con el mapa más alejado (hoy desde zoom 6), como Windy: hay que medir la memoria en el Ulefone.
- Lo que se pueda seguir aprendiendo de Windy.

## 4. Añadido a las 13:45
- Publicado 2026.10.17-1340: la costa del mapa en dos tramos (CARTO desde zoom 7; Natural Earth 1:10M por
  debajo, `data/costa.geojson`), porque con el mapa alejado se pintaban los cortes de tesela como una raya
  recta en el mar junto a Bermeo.
- Investigado en su Windy Pro: la niebla de Windy son manchas blancas (ICON). Se puede hacer una capa
  «Niebla» igual con la `visibility` de ICON-D2/ICON-EU (Open-Meteo la publica). Hecha: ver §5.
  La densidad de rayos prevista de Windy no está en los mapas de Open-Meteo.

## 5. Añadido por la tarde: la capa Niebla (suyo: «la capa de niebla no esperes, hazlo, ni preguntes más»)
- **Capa «Niebla»** (grupo Cielo, junto a Visibilidad): la `visibility` del modelo pintada como Windy, blanca
  donde baja de 2 km y más opaca cuanto más cerrada (200 m o menos, casi opaca); por encima, nada. Lleva el
  suelo ocre de las nubes. AROME HD no trae visibilidad en los mapas: al entrar desde AROME el mapa se pone en
  ICON-EU (ECMWF 9 km e ICON-D2 sí la traen y se respetan). Ojo: las pasadas de 03/09/15/21 UTC de ICON-EU
  solo llegan a 30 h; para más lejos, ECMWF 9 km.
- **Nada blanco encima de la nube ni de la niebla** (`rayasParaNubes`): al estrenarla, la frontera de CARTO
  (casi blanca y ancha) salía como una banda de niebla siguiendo el Pirineo desde Hendaia, y la sombra de los
  embalses asomaba en azul claro como motas. Con el suelo ocre puesto (Nubes y Niebla), fronteras, carreteras,
  ríos, agua y edificios van en ocres oscuros; al salir recuperan su color (guardado por estilo). En
  Precipitación no se toca.
- Mirado en el panel: el domingo 18 a las 08:00 ICON-EU solo da niebla en las cumbres de Picos y del Pirineo;
  el lunes 19 a las 09:00 da 500-760 m en Vitoria y Miranda (fuera de la pasada corta; con la siguiente larga
  se verá).
- **Medidor de cobertura (`medir-cobertura.cjs`), tres agujeros cerrados.** Publicando esto, con Open-Meteo dando
  503 («The service is overloaded»), la medida dio a ECMWF 9 km y HARMONIE como si dejaran de publicar 24 campos
  y lo escribió en `data/cobertura.json` y en el bloque de app.js. Lo paró la prueba «las cuatro piezas del agua
  van juntas». Restaurado de git. Causas: (1) el modelo que no contesta decía «se queda como estaba» pero no se
  apuntaba en `sinMedir`; (2) el medido a medias (un sitio con 503) podía perder campos; (3) un 503 en Miami
  quitaba «llega fuera de Europa» (GEM). Prueba en `pruebas-servidor.cjs` que ejecuta el medidor con un
  Open-Meteo de mentira.
- Su pregunta de la tarde («la lluvia, ¿dónde la veo mejor: europeo, ICON o AROME?»): AROME HD, por el
  registro (53 % frente a 49 % y 45 %); más allá de 48 h, ICON.
- **Publicado 2026.10.17-1456 — la ventanita de la lluvia, «lo que caería»** (suyo, mirando el domingo de la DANA
  desde el sábado: «agua caída hasta esa hora… un poco lioso» · «yo quiero saber lo que daría en 1 h, 3 h, 6 h
  y 24 h»). Ahora: «Lo que caería desde el dom a las 11:00» con 1, 3, 6 y 24 horas, cada una con su «hasta las…»;
  si el modelo no llega a 24 h lo dice («AROME HD solo llega hasta el lun a las 08:00») y suma solo lo que hay.
  `aguaQueCaeria()` en maps.js (sustituye a `acumuladoDe`). Y el aviso «X no llega hasta lo que estás mirando»
  vuelve a leer, con la tesela cargada, antes de afirmarlo (salió falso encima de Gandia en rojo).
- La DANA del 18-10 (lo que dan los modelos, pedido por él): AROME HD 173 l en Gandia, 100 en Valencia, 58 en
  Castellón el domingo; en malla, 311 a 15 km frente a Valencia y 36 puntos ≥ 100. ECMWF 9 km, máx. 151; GFS
  154-170; ICON 132 en Gandia.
