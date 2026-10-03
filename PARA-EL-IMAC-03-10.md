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

## 5. Añadido a las 21:00: lo que pasó después y lo que le propuse

**Hecho y publicado (2026.10.03-2046, commit ee5fba7):** BI DEUSTOII (ES-TIMS-46853,
Vantage, Lehendakari Aguirre 29) está en su lista (`/api/torres`, modo juntar, con las
coordenadas de su planta: 43.271656, −2.948538) y es CRÍTICA (`critico: true` en `SITIOS`).
Tiene su prueba con reloj falso vista en rojo. Su hija está allí. Ahora son 21 sitios.

**Lo que pasó esta noche (sus palabras):**
- «calles inundadas en Deusto», trombas en Bilbao.
- «en Bermeo cayendo tromba de agua ahora mismo» a las 20:55.
- «hay algunos sitios que cayó agua y no avisó nadie» · «tanto vigilante cada poco… pues
  ya ves» · «algo estamos haciendo mal».

**Lo medido contra lo previsto:**
- AROME HD iba tarde todo el rato. En Bilbao y en Bermeo daba 0–1 mm a las 19–20 con el
  agua cayendo.
- La pasada de AROME de las 20:36 subió mucho:
  - Deusto II: 14,8 · 28,7 · 28,4 · 3 l/m² a las 20, 21, 22 y 23 (60,1 mm en la franja de
    21 a 23).
  - Bermeo: 3,2 · 18,5 · 16,1 · 6,5 a las 21, 22, 23 y 00.
- ICON, GFS y ECMWF se quedan en 1–3 l/m² por hora. ICON da código 95 en Bilbao de 19 a 23
  y en Bermeo a las 22.
- El vigilante decide la lluvia con ICON (dueño aprendido, desde la pasada de las 20:30),
  así que no avisa del agua donde AROME da 15–28 l/m².
- Recordatorio para quien compare cifras: Open-Meteo da `precipitation` como la suma de
  la HORA ANTERIOR (comprobado con `minutely_15`: 4 × 4,2 = 16,8, frente a 16,9 en la
  hora). «22:00 = 18,5» quiere decir de 21 a 22.

**Las cuatro propuestas que le hice. «¿A, B, C y D?», sin contestar todavía:**
- **A.** El vigilante lee en cada pasada la LLUVIA MEDIDA en las estaciones cerca de sus
  sitios (AEMET y Euskalmet, que ya tiene `/estaciones` y `/api/euskalmet`). Si mide lluvia
  fuerte en la última hora, avisa vibrando, lo diga o no el modelo. Hoy lo medido solo se
  apunta para el registro y no avisa.
- **B.** Igual con los RAYOS MEDIDOS a menos de 15 km (AEMET o Meteosat), vibrando. Hoy el
  vigilante no lee descargas: solo la app al abrirla.
- **C.** La lluvia fuerte (≥ 15 l/m² por hora, escala de AEMET, con otro modelo de acuerdo)
  vibra como el rayo (`importante: true`). Hoy el agua nunca vibra (decisión del 01-10).
- **D.** Mientras no se vea claro, el dueño de la lluvia del vigilante es AROME HD y no el
  aprendido. Hoy el aprendido es ICON, y se queda corto con las trombas.

Le pregunté también si lo hago yo con la SSD puesta o lo dejo para el iMac. Si te lo
encarga a ti: cada una con su prueba vista en rojo, como siempre.

**Otro hueco que salió:** la app abierta no se refresca sola (§67 10). Él veía la
previsión de antes de las 20:36 hasta que la recargó.

## 6. «¿Cambiar la lluvia al modelo que acertó?» (suyo, 21:00)

Lo MEDIDO por Euskalmet (`/api/euskalmet?puntos=…`) a las 20:40, contra los modelos de esa
hora (Open-Meteo: la hora de las 21:00 es de 20 a 21):
- **Almike (Bermeo, a 1,1 km):** 3,8 mm en 60 min. Daban, de 20 a 21: AROME HD 3,2 ·
  GFS 1,7 · EC9km 1,5 · ECMWF 1,1 · ICON 0,9. La cantidad más cercana es la de AROME, pero
  le llegó tarde: de 19 a 20 daba 0. La tromba que él vio fue a las 20:55, después de esa
  medida.
- **Zorrotza (a 2,2 km de Deusto II):** 0,9 mm en 50 min. Todos daban ~1 mm; la pasada nueva
  de AROME (28,7 de 20 a 21 en Deusto II) todavía no se veía allí a las 20:40.
- `/estaciones` (AEMET) devolvió las estaciones sin historia de lluvia. Está por mirar.

Conclusión que le di: con dos estaciones y una hora no se puede decir que un modelo
«acertó». El dueño aprendido (ICON, 56 % de acierto desde el 01-10, frente al 37 % de
AROME) sale sobre todo de días de lluvia floja. En tormenta, AROME (1,3 km) es el que ve
las células, aunque con retraso, y los demás las aplanan. Por eso lo que de verdad lo
arregla es la **A** (avisar con lo medido), que no depende de elegir modelo. Para la **D**,
le propuse: lluvia floja con el aprendido, lluvia fuerte con AROME HD, o la de cualquier
modelo que dé ≥ 15 con otro de acuerdo. Lo decide él.

## 7. Añadido a las 21:10: HECHO por decisión suya («a tu criterio, pero ojo con el gasto»)

Publicado en **2026.10.03-2109**, con las pruebas vistas en rojo:
- **D: manda AROME HD en la lluvia del vigilante**, aunque el registro aprenda otro.
  Suyo: *«quien acertó hoy y los litros sobre todo, ese manda»* · *«así lo quiero»*. El
  aprendido se sigue calculando y el pulso lo enseña en `dueno.loAprendido`, pero no manda.
  - La línea vieja del candado («el dueño aprendido dice la lluvia fuerte») queda tachada
    y apuntada a la prueba nueva.
  - **TAREA PARA TI:** que el aprendizaje premie a quien acierta los LITROS en horas de
    lluvia, no el acierto equilibrado que hoy cuenta las horas secas. Hasta que eso esté
    medido, no le devuelvas el mando al aprendido.
  - OJO: `?verificar=1` (la pantalla de Avisos) sigue diciendo «Dueño de la lluvia: ICON»
    porque lee el registro. Hay que alinearlo con lo que de verdad manda.
- **C: la tromba vibra.** `AGUA_TROMBA = 15` mm/h («lluvia fuerte» de AEMET): el aviso de
  las 3 h va `importante: true` si hay agua de 15 para arriba. La de 2 a 15 sigue sin vibrar.
- **A, sin hacer** (te toca). El vigilante ya pide en cada pasada `/api/euskalmet` (línea
  ~924, para el marcador) y `/estaciones` (~794), así que NO añade llamadas. Euskalmet da
  `lluvia` + `lluviaMin` + `medidoEn` por estación. Propuesta: lluvia medida fuerte en la
  última hora a ≤ 5 km de un sitio suyo → aviso que vibra, «medido en X: N mm en M min».
  `/estaciones` devolvió esa noche las estaciones sin historia de lluvia: está por mirar.
- **B, NO hecho, por el gasto.** Leer los rayos medidos en el servidor obliga a decodificar
  las imágenes de AEMET o de Meteosat en cada pasada (CPU de Vercel). Queda para que él lo
  decida sabiendo lo que cuesta.

**Commits de esta sesión del MacBook, todos sin subir a GitHub:**
5deddf1, 939ac74, 93a6561, 0c37e74, 34ec376, ee5fba7, 87bf46f, 0c8c142 y el de esta sección.
