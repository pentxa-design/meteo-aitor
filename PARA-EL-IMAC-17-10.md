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
- La niebla de Windy («está top») frente a nuestra capa Visibilidad, y lo que se pueda aprender de Windy.

## 4. Añadido a las 13:45
- Publicado 2026.10.17-1340: la costa del mapa en dos tramos (CARTO desde zoom 7; Natural Earth 1:10M por
  debajo, `data/costa.geojson`), porque con el mapa alejado se pintaban los cortes de tesela como una raya
  recta en el mar junto a Bermeo.
- Investigado en su Windy Pro: la niebla de Windy son manchas blancas (ICON). Se puede hacer una capa
  «Niebla» igual con la `visibility` de ICON-D2/ICON-EU (Open-Meteo la publica); pendiente de su sí.
  La densidad de rayos prevista de Windy no está en los mapas de Open-Meteo.
