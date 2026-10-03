# Para la sesión del iMac — 03-10-2026, noche (desde el MacBook)

Lo que se ha hecho en el MacBook entre las 19:30 y las 20:45, y lo que te toca. El detalle
técnico está en TRASPASO.md, «§67, avance (03-10, noche, MacBook)».

## 0. Lo primero de todo

1. **`./subir-a-github.sh`**. El MacBook NO tiene la llave `~/.ssh/meteo_aitor_deploy`, así
   que estos cinco commits están en la SSD pero no en GitHub: 5deddf1, 939ac74, 93a6561,
   0c37e74 y el de esta nota.
2. Mira el pulso (`/api/vigilante?pulso=1`). A las 20:30 corrió con el código nuevo:
   20 sitios, ninguno sin mirar, sin fallos.

## 1. Publicado (hasta 2026.10.03-2033). Cada prueba vista en ROJA antes de publicar

- **§67 1, la parte que quedaba.** `quienVeRayo(h, place)` en app.js es una sola respuesta
  por hora: tu pareja CAPE+tapa con disparador y tu código, más la pareja con su propia
  tapa y el código de cada uno de los demás, sin el Automático.
  - `avisoTormentaFranja` saca de ahí el tramo de horas y los nombres; antes cortaba en
    tu pareja y no miraba ningún código.
  - `discrepanciaTormenta` (la barra de 48 h) mira cada hora contra la tuya de esa misma
    hora. Antes, tu código a cualquier hora borraba los de los demás, y un modelo con
    código perdía sus horas de CAPE.
- **§67 7, el vigilante:**
  - Los dos partes nombran los sitios sin mirar, aunque sean de 1 a 3. El segundo parte
    no dice «sale X» si a X no se le ha podido mirar.
  - Sin dato de AROME a una hora, decide ECMWF (`SUST_AGUA`, `elDueno`), y el aviso dice
    «AROME HD no da dato a esa hora».
  - `agua[dia].tramos` son las horas del dueño, no la unión de todos. Lo que solo ven los
    demás va en `aguaOtros` y el parte lo dice aparte, con nombre y hora.
- **§67 8, en parte:**
  - `lluviaQueNoVesTu` solo dice «sirimiri» con ≤ AGUA_ACUERDO.
  - `comoLlueve` con el código prestado: sirimiri solo si quien lo presta da ≤ 1 mm/h
    (`mmDelQuePresta`).
  - La fila Cielo de Mis estaciones va firmada («lo votan los 5» / «lo dice ECMWF»).
  - «Próxima lluvia» dice «según AROME HD» y quién la ve antes. **Esto no tiene guardia
    que pueda pararlo:** en pantallas.cjs el dueño nunca ve lluvia. Falta una trampa con
    lluvia del dueño.
- Hay siete líneas nuevas en NO-SE-TOCA.md.

## 2. Preguntas hechas a Aitor esta noche, sin contestar (no tocar sin su respuesta)

Contexto: había tormenta con trombas e inundaciones en Bilbao, rayos en Bermeo, y él se
quejaba de que no le avisaba nada.

1. **El dueño de la lluvia del vigilante pasó solo a ICON** (aprendido) en la pasada de las
   20:30. Con AROME dando 11–25 mm/h en Zornotza, Oiz, Matiena y Lemona, e ICON ≤ 1, ahí
   no salta «llueve bien». Le pregunté si vuelve a mandar AROME HD.
2. **¿Que la lluvia fuerte (≥ 15 mm/h, escala de AEMET) vibre como el rayo?** Hoy el agua
   va `importante: false` (decisión suya del 01-10, tras una falsa alarma de un solo
   modelo). Le recomendé que sí.
3. **¿Que el vigilante lea los rayos MEDIDOS** (AEMET o Meteosat) a menos de 15 km de sus
   sitios y avise vibrando? Hoy no los lee (ver las notas en `vigilante.mjs` ~1318 y
   ~1427); solo la app al abrirla.
4. **Deusto 2 es CRÍTICO (suyo)** y no está en `/api/torres`. Lo tiene que guardar él con el
   corazón en Aitor Meteo. Te va a pasar el TIMS; luego hay que añadirlo con
   `critico: true` en `SITIOS` de `api/vigilante.mjs` (los críticos se reconocen a menos de
   300 m). Begoña: dijo «deja Begoña».

## 3. Lo que queda del §67

- §67 8: **el «77 % en rojo»**, sin localizar desde el MacBook. Está en tus informes de los
  agentes de esta tarde.
- §67 9: ventana de trabajo y Avisos (`assess()` con la lluvia de un solo modelo; «ninguna
  hora supera tus umbrales» con 12 mm/h; la ventana en sitios que no son suyos).
- §67 10: los menores.

## 4. Lo que vale saber de esta noche

- En el MacBook, el ✗ de avisos de deploy.sh es falsa alarma: su fichero de clave es el de
  8 bytes del 27-09, que no vale.
- AROME iba tarde en Bilbao: 0–1 mm a las 19–20 h con el agua cayendo, y lo fuerte (16,9 mm)
  lo ponía a las 22. ICON y ECMWF ya daban agua a las 19.
