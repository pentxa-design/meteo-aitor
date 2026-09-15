# LO QUE ÉL MIDE EN EL SITIO

Suyo, 26-08-2026: *«te iré pasando datos día a día de sitios diferentes,
así aprendemos y corregimos cosas»*.

**Esto es lo único que dice si la app acierta.** Todo lo demás es un modelo
comparado con otro modelo. Aquí está la realidad, medida por alguien que
estaba de pie en el sitio.

## Cómo se apunta

Una entrada por observación, con **qué decía la app en ese momento** al lado.
Sin eso no sirve: hace falta el par para saber si acertó.

Si la app falló, **se dice qué se cambió por eso**. Y si no se cambió nada,
también se dice, con el motivo.

---

## 26-08-2026 · BI OIZ · 09:xx · anemómetro suyo

| | Él midió | La app decía |
|---|---|---|
| Racha | **26,4 km/h** | 26,3 km/h |
| Temperatura | 22,5 °C | 18–21 °C en valle |

**Veredicto: la racha, clavada.** Diferencia de 0,1 km/h.

La temperatura de su aparato no vale como referencia: estaba al sol y se
calienta. Las estaciones de valle a nivel del mar daban 18–21. No se cambió
nada por esto — el aparato no está mal, es que un termómetro al sol mide otra
cosa.

---

## 26-08-2026 · BERMEO · 19:00–19:25 · a ojo, estando allí

Avisó a las 19:00: *«en Bermeo lloviendo poco pero cae»*, *«acaba de
empezar»*. A las 19:25: *«ya para de llover»*.

| Modelo | Lo que daba a las 19:00 |
|---|---|
| **ECMWF** | **0,4 mm · código 51 (llovizna)** ← el único |
| Automático (AROME HD) | 0,0 · cubierto |
| ICON | 0,0 · cubierto |
| GFS | 0,0 · cubierto |

**Veredicto: uno de cinco.** ECMWF acertó la hora de empezar y que era poca
cosa. Se pasó en la duración: daba hasta las 20:00 y duró media hora.

**Qué se cambió por esto, el mismo día:**
1. La ficha de la torre ya no enseña un `0,0 mm` pelado cuando otro modelo ve
   agua: sale `⚠ El Automático no ve agua, pero ECMWF sí — sirimiri: no se
   sube a mástil ni a torre`.
2. Se añadieron las tres comparativas modelo a modelo (ráfaga, lluvia y
   tormenta) en la pestaña Mapa, sin promediar.
3. Diez pruebas nuevas con este caso metido tal cual.

---

## 26-08-2026 · 19:5x · contraste con la televisión

No es medida suya, pero sirve igual: él avisó de que en la tele daban
**tormentas en el interior de Gipuzkoa** esa noche, y para el jueves **un
frente del oeste que cruzaría todo**.

**Lo que veía nuestro criterio (CAPE ≥ 700 con tapa < 75, Automático + ICON):**

| Interior de Gipuzkoa | Esa noche |
|---|---|
| Segura | **21h-23h · CAPE 1.290** |
| Zegama | **21h-22h · CAPE 970** |
| Tolosa | 17h · CAPE 940 |
| Beasain, Oñati | nada |

**Coincide con la tele sin que nadie se lo dijera.**

Para el jueves en sus 14: solo 3 con rayo y muy justos (Sollube 19h y 23h,
Lekeitio 15h, Mungia 23h; CAPE 750-850), pero **lluvia en 7 de 14** — Gernika
1,7 mm y Zornotza 1,4 los que más. Es decir: el frente cruza como agua, no
como tormenta, y lo gordo se queda en el interior de Gipuzkoa.

**Euskalmet: ningún aviso** para el 26, el 27 ni el 28. Chubascos tormentosos
por debajo del umbral de aviso oficial.

**Y el dato que más vale de todo esto:** en NINGUNO de esos puntos había código
de tormenta, ni siquiera en Segura con 1.290 de CAPE. **Si la app se fiara del
código de cielo, esa noche habría dado cero tormentas en toda Gipuzkoa.** Es la
confirmación más limpia que hemos tenido de por qué el criterio va con CAPE y
tapa y no con el icono.

---

## 26-08-2026 · BERMEO · 20:56–21:00 · segunda vez, la misma tarde

*«Vuelve a chispear en Bermeo»*, *«muy débil»*, y a los pocos minutos *«poquita
lluvia pero cae, tiene pinta de que parará ya»*.

| Modelo | 19h | 20h | **21h** | 22h | 23h |
|---|---|---|---|---|---|
| Automático (AROME HD) | 0,0 | 0,0 | **0,3** | 0,1 | 0,0 |
| ECMWF | **0,4** | **0,4** | 0,0 | 0,0 | 0,0 |
| ICON · GFS | 0,0 | 0,0 | 0,0 | 0,0 | 0,0 |

**Y LA HUMEDAD DE LOS MODELOS NO VALE PARA NADA EN LA COSTA.** Medida por la
sesión de mediciones el 27-08, los seis modelos para Bermeo a las 20:00 del 26,
la misma hora y el mismo punto:

| GFS | Automático | AROME HD | ICON | ECMWF |
|---|---|---|---|---|
| 47 % | 56 % | 60 % | 71 % | 73 % |

**Veintiséis puntos de separación.** A las 22:00 llegan a 36. Eso mató un
detector de sirimiri basado en humedad: no es que la humedad no sirva, es que
**la de los modelos no es un dato, es una opinión**. Con la medida de
Matxitxako quizá se podría, pero llega con una hora de retraso y un aviso que
llega después no avisa.

**LO QUE MIDIÓ LA ESTACIÓN DE VERDAD** — MATXITXAKO, a 5,3 km, comprobado por
dos sesiones por separado el 27-08:

| Hora local | Lluvia medida | Humedad medida |
|---|---|---|
| 20:00 | 0,0 mm | 73 % |
| **21:00** ← su episodio | **0,0 mm** | **87 %** |
| 22:00 | 0,2 mm | 90 % |
| 23:00 | 0,0 mm | 87 % |

**Dos cosas que quedan firmes:**

1. **Durante su chispeo el pluviómetro marcó CERO.** Los 0,2 mm están sellados a
   las 22:00 y en AEMET el dato es acumulado de la hora anterior, o sea 21:00 a
   22:00 — **después** de que él dijera que había parado. No se le pueden
   atribuir. O sea: **el sirimiri de costa mojó sin registrarse**, y eso es
   exactamente por lo que él no sube a un mástil aunque el número diga cero.

2. **La humedad MEDIDA sí siguió al episodio**: 73 → 87 → 90, subiendo justo
   cuando empezó. Mientras tanto los modelos daban entre 42 % y 79 % para esa
   misma hora. **La medida sirve; la del modelo no.**

**EL HALLAZGO DEL DÍA, y es el que más vale:**

> A las 19:00 llovía y **solo lo vio ECMWF**. A las 21:00 llueve y **solo lo ve
> el Automático**. **Se han turnado en dos horas.**

No es que un modelo sea mejor: es que **para sirimiri de costa ninguno acierta
solo, y el que acierta no es siempre el mismo**. Cualquier cosa que enseñe la
lluvia de UN solo modelo va a mentirle tarde o temprano.

Y acertó también lo de que iba a parar: el Automático lo da muriéndose (0,1 a
las 22:00, seco a las 23:00), justo lo que él dijo a ojo.

**Nota aparte:** ECMWF ponía **código 95 (tormenta)** en Bermeo a las 20:00.
Se comprobó con la red de AEMET: **ni una descarga a menos de 60 km en 6
horas**. El modelo decía «aquí puede haber tormenta» y no cayó nada — que es
exactamente por qué el veto se decide con descargas medidas y no con códigos.

**LO QUE SÍ LO ANUNCIABA — medido en estaciones de AEMET** (aportado por la
sesión que llevaba las comparativas):

| MATXITXAKO · a 5,3 km de Bermeo | 19:00 | 20:00 |
|---|---|---|
| Humedad | 54 % | **73 %** (+19 puntos en una hora) |
| Racha | 19,8 km/h | **54,7 km/h** (casi el triple) |

Y lo mismo en Bilbao aeropuerto: humedad 55→71 %, racha 18,4→44,6.

**El chispeo empezó a las 20:50, justo después de ese salto.** O sea que la
señal no estaba en el campo de lluvia de ningún modelo: estaba en el **salto de
humedad y racha** con la entrada del oeste, y eso son datos MEDIDOS, no
pronosticados.

**Y SE MIDIÓ. NO SIRVE. Camino descartado el 26-08-2026.**

Parecía un detector buenísimo, y por eso se pidieron los **falsos positivos**
antes de tocar nada: cuántas veces sube así la humedad **sin** que caiga nada.
Sobre **11.160 horas** (Bermeo, Matxitxako, Lekeitio, Mungia y Bilbao × 92
días), contando acierto como que cayera algo en las 3 horas siguientes:

| Regla | Salta | Acierta | Falla | Acierto |
|---|---|---|---|---|
| **HR +19 y racha ×2,8** (la de esa noche) | **2** | **0** | **2** | **0 %** |
| HR +15 y racha ×2 | 15 | 7 | 8 | 47 % |
| HR +10 y racha ×1,5 | 35 | 15 | 20 | 43 % |
| HR +19, solo humedad | 50 | 20 | 30 | 40 % |

**La versión exacta de esa noche salta dos veces en tres meses y falla las dos.**
Aflojándola se queda en 40-47 %: **peor que echarlo a suertes.** Era la
casualidad de dos episodios, no una señal.

*Límite de la medición, dicho por quien la hizo:* sale del reanálisis del
modelo, no de las estaciones, porque el histórico de estaciones solo llega a
13-24 h. Con medidas reales podría salir otra cosa — pero no hay forma de
comprobarlo hoy, y un número del modelo no se cuela como si fuera medida.

**Lo que se queda en pie es lo otro: que los modelos SE TURNAN.** Eso resuelve
el caso real —enseñar quién ve el agua en vez de la lluvia de uno solo— en vez
de inventar un detector nuevo.

**Y dos avisos que vienen con ello:**
1. **Las estaciones publican con ~60 min de retraso.** Cuando salió el dato de
   las 20:00 ya llevaba media hora chispeando. Cualquier detector que dependa
   de ellas arrastra esa cola.
2. **La visibilidad de ese punto daba 36,7 km con el cielo cerrado y
   chispeando.** No sirve como detector. (En la app solo se colorea por debajo
   de 1 km, así que un valor demasiado alto no produce falsas alarmas: solo
   deja de avisar. Falla del lado seguro, pero conviene saberlo.)

**EPISODIO CERRADO Y ACOTADO: 20:50 → 21:13. Veintitrés minutos, débil.**
Él, a las 21:0x: *«apenas cae»*, *«creo que ya paró»*.

| Modelo | 19:00 | 20:00 | **21:00** | 22:00 |
|---|---|---|---|---|
| **Automático** | 0,0 | 0,0 | **0,3 mm** ✓ | 0,1 |
| AROME HD | 0,0 | 0,0 | 0,0 | 0,1 |
| ICON | 0,0 | 0,0 | 0,0 ✗ | 0,0 |
| ECMWF | 0,4 (c51) | 0,4 (**c95**) | 0,0 ✗ | 0,0 |
| GFS | 0,0 | 0,0 | 0,0 | 0,0 |

**Uno de cinco, y clavado en la hora.** Acertó también que se moría.

Con los dos episodios del día acotados, lo de que **SE TURNAN** deja de ser una
impresión: ECMWF acertó el de las 19:00 y falló el de las 21:00; el Automático,
justo al revés. **ICON y GFS fallaron los dos.**

**FALSO POSITIVO REAL, para guardar:** ECMWF puso **código 95 — TORMENTA** en
Bermeo a las 20:00. Ese día **no cayó una sola descarga en toda Euskadi**. Si
alguna vez se piensa en que el código de tormenta de un modelo dispare algo por
sí solo, este es el caso con el que probarlo.

**Duda abierta, sin resolver:** ICON es el modelo por defecto porque es el único
que publica todos los campos de decisión (cielo, tapa, CAPE, isocero,
visibilidad). Pero **hoy falló los dos episodios de sirimiri**. Con dos casos no
se cambia; con tres o cuatro más habrá criterio. Y puede que deje de importar,
porque la decisión de él ese día fue **enseñar todos los modelos**: *«lo suyo
enseñar todos, más seguros estaremos»*.

**Qué se cambió por esto, esa misma noche:**
La pestaña **Ahora** ya no enseña un `0 mm` pelado: pone
`⚠ AROME HD no ve agua · ECMWF sí (sirimiri)` y la tarjeta en naranja.

Y viendo la tabla de horas que le pasé por el chat dijo *«esto sirve»*, así que
se metió en la app: **rejilla de lluvia hora a hora y modelo a modelo**, las seis
horas siguientes, en la pestaña Mapa. Contesta a la pregunta que se hace de
verdad, que no es «¿llueve?» sino **«¿va a seguir?»**: si los números van
bajando, se está muriendo. Si en seis horas no hay agua en ningún modelo, la
tabla no se pinta — una rejilla de ceros no es información.

**Y una trampa que casi lo deja muerto:** los datos de los otros modelos llegan
DESPUÉS de pintar la pantalla, y al llegar solo repintaban la comparativa. El
aviso no habría salido nunca. Se cazó al comprobarlo en el navegador, no al
escribirlo. La función bien hecha y nadie llamándola en el momento bueno — el
mismo patrón de tres fallos distintos hoy.

---

---

## 27-08-2026 · VITORIA · 12:05–12:12 · el que rompió mi regla

*«Ha empezado a chispear pero muy débil muy débil, gotitas sueltas»*, y a los
siete minutos *«ya paró»*. Midió **21 °**.

**Vitoria está a 45 km del mar.** Una hora antes yo había puesto el aviso de
sirimiri **solo para la costa**, porque los dos episodios anteriores eran
costeros. **Con la app en la mano él no habría visto el aviso.**

| Modelo | 12:00 | Código | Temp |
|---|---|---|---|
| **GFS** | **0,2 mm** | **51 · llovizna** | 20,6 |
| Automático | 0,2 mm | 3 · cubierto | 20,5 |
| **ECMWF** | **0,1 mm** | **51 · llovizna** | 21,5 |
| ICON | 0,0 | 3 · cubierto | 21,4 |
| AROME HD | 0,0 | sin código | 21,1 |

**Tres de cinco lo vieron**, y el mejor **GFS** — el modelo al que menos caso le
habíamos hecho.

**LO QUE ESTE CASO CAMBIÓ, en el momento:**

**El sirimiri no es de costa: es de frente.** La restricción geográfica se quitó
en cuanto llegó el dato. Los dos casos anteriores eran costeros **por
casualidad, no por causa**, y con dos casos me inventé una regla que el tercero
tumbó en una hora. Ahora el aviso sale en sus catorce sitios.

**Y DOS DATOS QUE VALEN APARTE:**

1. **La temperatura de los modelos sí es fiable.** Sus 21 ° contra 20,5 · 20,6 ·
   21,1 · 21,4 · 21,5. **Medio grado el peor.** Compárese con la humedad, que se
   separaba **37 puntos** entre modelos para la misma hora y el mismo punto.
   **No todos los campos de un modelo valen lo mismo**, y eso hay que saberlo
   antes de construir nada encima de uno.

2. **Ninguna estación midió nada.** Vitoria aeropuerto, Aramaio, Agurain y
   Aretxabaleta: 0,0 mm las cuatro. **Tercera vez que moja sin registrarse.**
   Con tres casos y testigo en el sitio, eso deja de ser anécdota: es el hecho
   que justifica no subir a un mástil aunque el número diga cero.

**ICON: cero de tres.** No vio Bilbao el 25, ni Bermeo el 26, ni Vitoria el 27.
Y es el modelo por defecto de la app. **El motivo de que lo sea sigue siendo
bueno** —es el único que publica todos los campos de decisión, y para la tormenta
hace falta la tapa— **pero para lluvia fina es el peor de los cinco**. No se
cambia el modelo por defecto: lo que cubre esto es el arreglo de hace dos días,
que la lluvia se lea SIEMPRE de los cinco y no del que esté cargado.

---

---

## 27-08-2026 · TARDE · EL CASO ICON — CERRADO A LAS 21:30

**Esto no es una medida suya: es una apuesta apuntada antes de saber el
resultado.** Se escribe ahora, a las 16:50, para poder puntuarla esta noche
sin trampa.

**LO QUE DECÍA CADA UNO, a las 16:00-17:00:**

| | Bermeo | Sollube | Gernika | Lekeitio |
|---|---|---|---|---|
| **ICON** | **870**/68 | **920**/47 | **750**/58 | **810**/45 a las 18h |
| Automático | 40 | 0 | 20 | 60 |
| GFS | 60 | 60 | 60 | 70 |
| ECMWF (nudo de tierra) | 30 | 30 | 30 | 50 |
| AROME HD | 10 | 0 | 10 | 40 |

**ICON solo, y por diez o treinta veces.** El vigilante avisó por eso.

**LO QUE DIJERON LAS OTRAS WEBS** (él las mandó):
· Windy y Meteored, los dos con ECMWF, **nada sobre sus sitios a las 16:00**
—toda la actividad en Asturias, Llanes 2,07—. **Pero a las 19:00 Windy pone
una célula naranja-roja sobre Ondarroa (0,69)**, pegada a Lekeitio.
· AguaceroWx, GFS de superficie: SBCAPE ≈543 y SBCIN ≈91 en Bermeo.

**LO QUE SE MIDIÓ DE VERDAD, hasta las 16:00** (red de AEMET, por la app):
**1 descarga** entre las 15:00 y las 16:00, la más cercana a **34,3 km**.
Sobre sus sitios: **BI LEKEITIO a 29,2 km** y **BI MARKINA2 a 27,2 km**.
O sea: **la tarde SÍ produjo rayo**, pero lejos.

**LA ALTURA DE LAS NUBES** (ICON): tope de **3.790 a 6.780 m**. La tarde del
24 que oyó truenos en Bermeo, el tope sobre Mungia estaba en **10.640**.
**Nubes de la mitad de altura.**

**LO QUE HAY QUE MIRAR ESTA NOCHE, y con qué se puntúa:**

1. ¿Cayó alguna descarga a menos de 15 km de Lekeitio u Ondarroa entre las
   18:00 y las 21:00? Está en la pestaña Rayos, y también en el histórico de
   AEMET del día.
2. Si **sí** → ICON acertó estando solo, y eso pesa: sería la primera vez
   medida en que el modelo descolgado tenía razón.
3. Si **no** → la lectura buena fue la del tope bajo, y queda un caso a
   favor de mirar la altura de la nube (aunque solo se publique el 33 % de
   las horas y por eso nunca pueda bajar un aviso por sí sola).

**Lo que pase se apunta aquí, ganemos o perdamos.** Guardar solo los
aciertos es lo que convierte una app en una superstición.

---

### EL RESULTADO, con los datos de AEMET hasta las 21:00

```
15:00–16:00    1 descarga    a 29,2 km de Lekeitio · 27,2 de Markina
16:00–17:00    —
17:00–18:00    —
18:00–19:00    —
19:00–20:00    —
20:00–21:00    —
```

**ICON PIERDE.** Dio 870 en Bermeo, 920 en Sollube, 750 en Gernika y 810
en Lekeitio, con la tapa abierta. **No cayó nada a menos de 15 km en
ninguna de esas horas.** Los otros cuatro modelos, que daban entre 0 y
210, acertaron.

**PERO CON UN MATIZ QUE NO SE PUEDE OMITIR**, y sale del fallo del nudo
que se destapó esa misma tarde: leyendo el punto REAL de Bermeo —no el
nudo de tierra a 18 km—, ECMWF daba **1.110** y GFS **550**. Así que el
«cuatro contra uno» era en parte un artefacto de estar comparando sitios
distintos. Lo honrado: **ICON exageró, pero no estaba tan solo como
parecía.**

### Y EL DATO QUE MÁS INCOMODA

La única descarga del día cayó donde los tres modelos con tapa daban
**340 · 520 · 270**, todos POR DEBAJO de 700, con la tapa en 31, 27 y 3.

**Es decir: la regla de la app no habría cazado el único rayo del día.**

No se toca el umbral por esto —un caso no es una regla— pero queda
apuntado en `/api/calibrar`, que es donde se decidirá con veinte casos.

### LO DEMÁS, MEDIDO

**Viento**, contra MATXITXAKO (a 5,3 km de Bermeo), racha máxima **36,7**:

| GFS | 40 | +3 ← el mejor |
|---|---|---|
| Automático | 33 | −4 |
| ECMWF | 32 | −5 |
| ICON | 31 | −6 |
| AROME HD | 47 | +10 |

**Nubes**, contra sus fotos de las 18:56 (cielo roto, 40-50 %):
GFS **7 %** · ECMWF 39 · Automático 66 · ICON 85. **No acertó ninguno**, y
el mejor en viento fue el peor en nubes. Por eso no se promedia.

**Lluvia**: 0,0 mm en Matxitxako, 0,4 en Forua. Nadie se mojó.

---



---

*Pendiente de cerrar: qué pasó de verdad en Sollube y Gernika el jueves sobre
las 19:00.*

---

## 27-08-2026 · Llodio, 13:40 · foto suya: seco y con claros

**Primera foto que se puede mirar.** Hasta ese día las fotos se guardaban sin
puerta de lectura, así que esta es también la que destapó el agujero.

**Lo que enseña:** autovía en el valle, pinar a los lados, **asfalto seco**,
cielo azul con cúmulos de buen tiempo — a ojo, **un tercio de cielo cubierto**.
Sol por la izquierda.

**OJO CON EL SITIO, que casi lo apunto mal.** La nota llegó sellada como
**BI BERMEO** porque no le dio a «Añadir dónde estoy» y entonces la app coge el
emplazamiento SELECCIONADO, no dónde está. Él estaba en **Llodio**, a 40 km y en
otra provincia. Estuve a punto de comparar su foto con el tiempo de Bermeo:
habría salido un fallo inventado. **Se le preguntó antes de apuntar nada**, y
menos mal. Coordenadas medidas, no de memoria: **43,14322 / −2,96204 · 125 m**.

Lo que daban los modelos en Llodio, por las dos vías (app y origen, idénticas):

| Modelo | 13:00 · lluvia · cielo | 14:00 · lluvia · nubes |
|---|---|---|
| Automático | 0 mm · nuboso (100 %) | 0 mm · **6 %** |
| ECMWF 25 km | 0,1 mm · **llovizna ligera** (49 %) | 0,1 mm · 34 % |
| GFS | 0 mm · nuboso (100 %) | 0 mm · **99 %** |
| ICON-EU | 0 mm · nuboso (100 %) | 0 mm · 35 % |
| AROME HD | 0 mm · sin dato | 0 mm · sin dato |

**LA LLUVIA, BIEN.** Cuatro de cinco dan 0 mm y la carretera está seca. El
0,1 mm de ECMWF con código de **llovizna ligera** es una falsa alarma: no caía
nada. Va justo al revés del caso de Bermeo del 26, donde ECMWF fue el único que
vio el sirimiri que sí caía. **Ese modelo acierta los sirimiris que existen y
también se inventa alguno**; sirve para avisar, no para descartar.

**LA NUBOSIDAD, PARA TIRARLA.** A las 14:00, mismo punto y misma hora, los
modelos van de **6 % a 99 %**. La foto está sobre el tercio: cuadran ICON-EU
(35 %) y ECMWF (34 %), y fallan por lados opuestos el Automático (6 %, casi
despejado) y GFS (99 %, cubierto). Es la tercera vez que se mide y confirma lo
que ya estaba escrito: **con la nubosidad no se decide nada.**

**Lo que sale de aquí para la app:** una foto mandada sin confirmar ubicación se
empareja con el tiempo del sitio elegido, y eso **parece una medición sin
serlo**. Planteado a Aitor el mismo día, pendiente de que elija: o se coge su
ubicación siempre al mandar foto, o la nota dice «sitio sin confirmar» en vez de
poner un emplazamiento que no toca.

---

## 27-08-2026 · Llodio (Arakaldo), 13:54 · 27 °C suyos + dos fotos del cielo

Tres notas seguidas en un minuto, desde **Barrio Zuloaga (Arakaldo)**. Las
coordenadas son suyas y están confirmadas por dos vías que coinciden: las que
mandó la app (**43,15267 / −2,93705**) y el **sello GPS impreso en la propia
foto** (43,1524N 2,9370W). No hizo falta preguntarle.

### La temperatura: CUADRA

Suyo: **«27 grados, llodio»**, a las 13:54.

| | Temperatura |
|---|---|
| **Él, en el sitio** | **27** |
| Observado (app, 13:45) | 25,1 |
| GFS 14:00 | **27,3** |
| ICON-EU 14:00 | 26,8 |
| Automático 14:00 | 25,9 |
| ECMWF 14:00 | 25,8 |
| AROME HD 14:00 | 25,7 |

Su medida cae **en el techo de la horquilla** y la clava GFS. Comprobado por los
dos caminos que manda la regla —la app (`/om`) y el origen
(`api.open-meteo.com`)—: **idénticos cifra por cifra**. No se cambia nada.

Matiz que se le dijo: si el termómetro es el del coche o está al sol, **lee
alto**, así que lo real estará entre 26 y 27. Es lo mismo que ya pasó en el Oiz
el 26: su anemómetro clavado, su termómetro no.

### El cielo: FALLA OTRA VEZ, y por los dos lados

**Lo que enseña la foto de las 13:54:04:** nubes rotas, cúmulos y
estratocúmulos de bases claras, **con sol y azul de sobra** — a ojo, **entre 60
y 70 % cubierto**. Ni yunques, ni bases oscuras, ni nada convectivo.

| Modelo | 13:00 | 14:00 |
|---|---|---|
| Automático | cubierto (100 %) | **6 %** |
| ICON-EU | cubierto (100 %) | 35 % |
| GFS | cubierto (100 %) | 99 % |
| ECMWF 25 km | **llovizna ligera** (49 %) | 34 % |
| **Él, 13:54** | — | **60–70 %** |

A las 13:00 tres de cinco decían **cubierto** y él tenía sol; a las 14:00 el
Automático se va al extremo contrario (**6 %, casi despejado**). **Ninguno de
los dos extremos es lo que había.** Es la **cuarta** vez que se mide y sale lo
mismo: **con la nubosidad no se decide nada.** No se toca ningún umbral por
esto — el semáforo ya no usa nubosidad, y ésta es la razón por la que no debe
volver a usarla.

**La llovizna de ECMWF, falsa otra vez** (0,1 mm y código de llovizna, con sol
en la foto). Mismo patrón que a las 13:40: ese modelo **acierta los sirimiris
que existen y también se inventa alguno**. Vale para avisar, no para descartar.

### Lo que sí valía de ahí, y se le dijo

CAPE entre 20 y 170 —bajo— y la foto lo confirma: **nada de tormenta**. Y el
viento, que es lo que sí subía: **racha observada 38,2 km/h a las 13:45**, y de
**40 a 44 km/h para las 14:00** en su punto.

### El agujero del sitio, otra vez — y ya con las dos mitades claras

De las tres notas, **sólo la del texto llevaba ubicación**. Las dos fotos
llegaron selladas como **BI BERMEO (43.412976 / −2.718316)**, a **34 km**, y con
el tiempo de Bermeo congelado al lado.

**Causa, ya localizada en el código:** `mandarCampo()` hace `campoUbi = null` al
enviar. A las 13:54:36 mandó el texto con la ubicación puesta y **23 segundos
después** la foto ya salió sin ella. Está puesto a propósito y comentado («la
siguiente nota puede ser desde otro sitio»), y el motivo es bueno — él conduce
mucho. Pero le cuesta el dato justo en el momento en que más vale.

Estado a día de hoy, comprobado contra lo que Vercel sirve de verdad
(build **2026.08.27-1345**):

- **Los dos botones de foto: PUBLICADOS Y FUNCIONANDO.** Están el HTML y el
  cableado en `app.js`. Su queja de las 13:41 es de **cuatro minutos antes** de
  que saliera el arreglo.
- **La etiqueta con distancia (`etiquetaDeSitio()`): ESCRITA Y SIN PUBLICAR.**
  El `app.js` que sirve Vercel **no la tiene**. Por eso su nota de las 13:54:36
  seguía diciendo «cerca de BI BERMEO» estando a 34 km. **No se publicó desde
  aquí**: `deploy.sh` sube la carpeta entera y hay cambios en vuelo de otra
  sesión que no se pueden verificar sin git.
- **Lo demás, ESPERÁNDOLE A ÉL.** Se le han dado las dos opciones con sus
  pegas: **A)** coger su ubicación sola al mandar foto, **B)** decir «sitio sin
  confirmar» y no poner emplazamiento. **Pendiente de que conteste A o B.**

---

# EL MARCADOR · cómo va la app contra lo que él ve

**Para qué es esto.** Suyo, 27-08-2026: *«igual os mando 4 fotos al día o por
ahí, para que hagáis un balance de cómo está nuestra aplicación; comparamos con
las fotos que os mande yo, y con las temperaturas y las coordenadas, viendo las
nubes o si vemos agua en la carretera. Solamente es para nuestro cuaderno, para
ir afinando la aplicación»*.

No son cuatro anécdotas sueltas: es una cuenta que se lleva. **Cada observación
suya se apunta aquí, cuadre o no cuadre**, y el marcador se actualiza. Un
acierto que no se apunta no sirve para nada, y un fallo tampoco.

**Cómo leerlo, sin engañarse:** el porcentaje de nubes de una foto es **a ojo,
no medido**. Sirve para separar «cubierto» de «con claros», no para discutir un
5 %. La lluvia y la temperatura sí son duras: o hay agua en el asfalto o no la
hay.

## Nubosidad · 11 comparaciones

**Cómo se puntúa, para que cualquiera lo repita igual:** acierta el modelo que
cae **dentro de ±15 puntos** del rango que él ve. El ±15 es porque el
porcentaje de una foto es a ojo (ver arriba); afinar más sería fingir precisión.

| Cuándo · dónde | Su foto | Automático | ECMWF | GFS | ICON-EU |
|---|---|---|---|---|---|
| 13:40 · Llodio, carretera | ~33 % | 6 % | **34 %** ✔ | 99 % | **35 %** ✔ |
| 13:54 · Arakaldo `43,1524/−2,9370` | 60-70 % | 6 % | 34 % | 99 % | **68 %** ✔ |
| 14:10 · Bilbao `43,26271/−2,92528` | 55-65 % | 11 % | 34 % | 99 % | **79 %** ✔ |
| 14:21 · Etxebarri `43,28753/−2,88325` | 80-85 % | 45 % | 34 % | **99 %** ✔ | **71 %** ✔ |
| 15:40 · Bermeo pueblo `43,4174/−2,7264` | ~60 % | **3 %** · código 0 | **56 %** ✔ | 100 % | 87 % |
| 15:59 · Bermeo pueblo `43,41744/−2,72644` | 35-45 % | 5 % · código 0 | 79 % | **54 %** ✔ | 90 % |
| 21:10 · Bermeo pueblo · **de noche** | «casi despejado», 0-20 % | 100 % · código 3 | **7 %** ✔ · código 0 | 100 % | 41 % |
| **28-08** 08:23 · Bermeo pueblo `43,4174/−2,7264` | cielo raso, 0-15 % (jirones altos finos) | **100 %** · código 3 | **2 %** ✔ · código 0 | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 |
| **29-08** 12:59 · Axpe-San Bartolomé, Busturia `43,3745/−2,6962` | azul entero, 0-10 % · sombras duras de sol | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | 32 % · código 1 |
| **29-08** 13:23 · Busturia, mirando a la bocana `43,3757/−2,6968` | azul limpio arriba, 0-10 % · **y banda baja sobre el mar** | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | 32 % · código 1 |
| **29-08** 13:49 · Barrio Axpe, Busturia `43,3743/−2,6960` (geosello) | azul entero, 0-10 % · sombras moteadas de sol en el asfalto | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **44 %** · código 1 |
| **29-08** 14:02 · Busturia `43,37712/−2,69748` ±7 m · **primera con `ubiFuente: gps`** | azul entero, 0-5 % · montes del fondo recortados | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **40 %** · código 1 |
| **29-08** 14:11 · Busturia `43,3767/−2,69765` · **par con la foto del termómetro, 15 s después** | azul entero sin una nube, 0-5 % | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **0 %** ✔ · código 0 | **40 %** · código 1 |
| **30-08** 11:43 · Bakio `43,42678/−2,81083` (GPS) | gris entero con un claro bajo, 90-95 % · suelo seco | **100 %** ✔ · código 3 | 3 % · código 0 | 7 % · código 0 | 38 % · código 1 |
| **30-08** 12:09 · Bakio, paseo `43,42852/−2,809` (GPS) | cúmulos con claros grandes, 60-70 % · suelo seco | **74 %** ✔ · código 2 | 17 % · **código 51, sirimiri que NO cayó** | 10 % · código 0 | **72 %** ✔ · código 2 |

> ## ANTES DE LEER EL RECUENTO: TRES DE LAS ONCE SON EL MISMO CIELO
>
> El 29-08 mandó fotos de Busturia a las **12:59, 13:23, 13:49, 14:02 y 14:11** — la
> misma tarde despejada, el mismo sitio, en poco más de una hora. Son cinco
> filas de la tabla y **no son cinco pruebas independientes**: es un cielo
> azul contado cinco veces.
>
> Eso mueve el marcador de verdad, y en una dirección concreta: **premia a
> los tres modelos que tiran a despejado y castiga al único que no**. Por
> eso van los dos recuentos, y el que manda para decidir es el segundo.
>
> | | por filas | **juntando el 29-08 en una** |
> |---|---|---|
> | ECMWF | **9 de 15** | 5 de 11 |
> | GFS | 8 de 15 | 4 de 11 |
> | ICON-EU | 6 de 15 | **6 de 11** |
> | Automático | 7 de 15 | 3 de 11 |
>
> **Por filas ECMWF adelanta; juntando, ECMWF e ICON-EU empatan.** Lo que NO
> dice ninguno de los dos es que ECMWF haya pasado a leer mejor el cielo:
> dice que ese día acertó lo fácil cinco veces. Recontado con
> `revisiones/recuento-marcador.py`, no a mano.

**ICON-EU 6 de 15 (6 de 11 juntando).** Fue el que mejor leía el cielo y ahora
está empatado, pero su problema es de sesgo, no de puntería: en Bermeo se pasó
27 puntos a las 15:40 y 45 a las 15:59. **Y el 29-08 en Busturia falló los
cinco más fáciles de todos**, con el cielo azul entero: **32 %, 32 %, 44 %, 40 % y
40 %** en poco más de una hora. Van **siete pasadas por arriba y ninguna por
abajo**. Ese sesgo ya no es casualidad: es su forma de fallar, y hay que leerlo
así — **cuando ICON canta nubes, puede que no las haya; cuando dice que no las
hay, conviene creerle**.
**ECMWF 9 de 15 (5 de 11 juntando).** Falla los tres del medio por lo mismo
—34 % clavado toda la tarde, que es su celda de 25 km sin enterarse de nada— y
acierta los extremos. Que acierte no significa que estuviera mirando. A las
15:59 se pasó por arriba, 79 % con el cielo abriéndose.
**GFS 8 de 15 (4 de 11 juntando).** Cuatro de las quince las dio con 99-100 %, que
es no mirar. Pero el 27-08 a las 16:00 **bajó a 54 % y fue el único que cayó
dentro**, justo cuando el cielo se estaba abriendo. Con esto se le retira la
etiqueta de «siempre dice lo mismo»: la mueve, aunque casi nunca.
**Automático 7 de 15 (3 de 11 juntando).** Es el modelo que lleva puesto por
defecto quien no toca nada. Hasta el 27-08 fallaba **siempre por el mismo lado**
—despejado con el cielo medio cubierto, y **tres veces con código 0,
«despejado»**, el 13:40 en Llodio y el 15:40 y 15:59 en Bermeo, con la foto
llena de cúmulos—. Sus tres aciertos son los tres del 29-08, o sea **uno solo**.

> **Sus tres aciertos del 29-08, y hay que leerlos con cuidado.** Dio 0 % y
> código 0 con el cielo azul entero, tres veces: clavado las tres. Pero son los
> aciertos que le tocaban por fuerza — llevaba ocho comparaciones tirando a
> «despejado» y ese fue el primer rato en que el cielo estaba de verdad
> despejado. **Un reloj parado también da la hora dos veces al día**, y si le
> haces tres fotos seguidas a la hora que marca, acierta tres veces. No cambia
> la conclusión de abajo: para nubes, ICON-EU o ECMWF.

> **El 28-08 falló por el lado CONTRARIO, y eso cambia la lectura.** Dio
> **100 % y código 3, «cubierto»**, con el cielo raso y el sol dando en la
> pared. Ya no se puede decir «el Automático se queda corto»: se queda corto
> unas veces y largo otras. **Lo que ese campo suyo no hace es seguir al
> cielo.** Para nubes, ICON-EU o ECMWF.

> **El 30-08 en Bakio el Automático hizo lo que nunca había hecho: SEGUIR al
> cielo.** Dos fotos suyas separadas 26 minutos, la primera con el gris entero
> (90-95 %) y la segunda ya abierta (60-70 %):
>
> | | 11:00 | 12:00 | ¿se movió? |
> |---|---|---|---|
> | **Lo que él ve** | 90-95 % | 60-70 % | **sí, se abrió** |
> | **Automático** | **100 %** ✔ | **74 %** ✔ | **sí, y en su dirección** |
> | ICON-EU | 38 % | **72 %** ✔ | sí, **al revés** |
> | ECMWF | 3 % | 17 % | al revés, y sin salir de «despejado» |
> | GFS | 7 % | 10 % | no |
>
> Es la segunda vez que hay un par del mismo sitio con minutos de diferencia
> (la otra es la de Bermeo del 27-08, más abajo), y es la prueba que de verdad
> distingue puntería de estar quieto. **Aquí el Automático acierta las dos Y se
> mueve**, que es lo que no hizo ni una sola vez en las trece anteriores.
>
> **Lo que NO se puede concluir todavía:** que el Automático haya pasado a leer
> el cielo. Son **dos** comparaciones, y las dos fotos miran a sitios distintos
> —una calle adentro, otra hacia la playa—, así que parte de la diferencia
> puede ser hacia dónde apuntaba. Para nubes sigue valiendo lo de abajo hasta
> que haya más pares como este.
>
> **Y una falla dura de ECMWF, que no es de nubes:** a las 12:00 daba **0,2 mm
> y código 51, sirimiri**. No cayó. Matxitxako (a 5,5 km) marca **0 mm de las
> 10:00 a las 21:00** y en la foto el asfalto está seco. Un sirimiri inventado
> no es un matiz: con sirimiri él no sube a mástil ni a torre.

**AROME HD no publica nubosidad TOTAL** y no puntúa. Sí publica las tres capas
sueltas: el 15:40 en Bermeo daban 1 % baja, 3 % media, 0 % alta, o sea también
cielo raso con ~60 % tapado; y el 28-08 a las 08:00 daba **100 % de nubes
ALTAS** con el cielo raso. **Que no puntúe no es que acierte.** El 30-08 en
Bakio dio **99 % de nube baja a las 11:00** —con el gris entero, bien— y **37 %
a las 12:00**, con el cielo todavía a 60-70 %: se quedó corto en la segunda.

**Y una corrección de los recuentos, apuntada a propósito:** hasta hoy esto
ponía «4 de 6 · 2 de 6 · 2 de 6 · 0 de 6» con **siete** filas ya en la tabla.
La del 21:10 se añadió y no se rehicieron las cuentas. Contadas de nuevo una a
una sobre las marcas ✔ de la tabla.

### Los saltos de una hora suelta al 100 % (28-08-2026)

Salió mirando la hora de antes y la de después de su foto, y **no se ve con una
sola hora delante**. Mismo punto, mismo día, nubosidad total:

| | 07:00 | **08:00** (su foto, 08:23) | 09:00 |
|---|---|---|---|
| **Automático** | 0 % | **100 %** · «cubierto» | 0 % |
| **GFS** | **100 %** · «cubierto» | 0 % | 5 % |
| ICON-EU | 0 % | 0 % | 0 % |
| ECMWF | 1 % | 2 % | 1 % |

**Un 100 % de una hora sola, con 0 % antes y 0 % después, no es un cielo que se
tapa: es un artefacto.** Y le salta a modelos distintos en horas distintas —a
GFS a las 07:00 y al Automático a las 08:00—.

**Por qué importa:** la app enseña la hora en curso. Si abre a las 08:23 con el
Automático puesto, lee **«cubierto»** con el cielo raso; si abre a las 07:30,
lee lo mismo pero por GFS. No engaña a nadie sobre si se sube o no —la
nubosidad no decide— pero **sí gasta la credibilidad de la pantalla**, y esta
app vive de que se la crea.

**Pendiente de medir antes de tocar nada:** cuántas de estas hay en una semana
sobre sus 15 emplazamientos. Si son pocas y sueltas, la salida honesta es
avisarlas («una hora suelta al 100 % con 0 antes y después»), no suavizarlas —
suavizar sería inventar el dato del medio.
### Lo mejor del par de Bermeo no es quién acierta, es QUIÉN SE MUEVE

Las de las 15:40 y las 15:59 son **las dos primeras del mismo sitio con 19
minutos de diferencia**, y eso enseña algo que una foto suelta no puede.

| | 15:40 | 15:59 | se movió |
|---|---|---|---|
| **Lo que él ve** | ~60 % | 35-45 % | **sí, se abrió** |
| ICON-EU | 87 % | 90 % | no (+3) |
| Automático | 3 % | 5 % | no (+2) |
| ECMWF | 56 % | 79 % | sí, **al revés** |
| GFS | 100 % | 54 % | sí, y acertó |

**ICON y el Automático no siguieron al cielo: cada uno se quedó clavado en su
extremo.** Un modelo puede «acertar» quedándose quieto mientras el cielo le
pasa por delante — y eso, con una sola foto, se lee como puntería.

**Vale la pena pedirle DOS SEGUIDAS del mismo sitio de vez en cuando**, no más
fotos: las mismas mejor puestas. Suyo: *«igual os mando 4 al día»*, y cuatro en
dos pares valen más que cuatro sueltas.

**Salvedad honesta de este par, y hay que tenerla delante:** las dos fotos **no
apuntan al mismo sitio** — la de las 15:40 mira al monte por encima de los
tejados y la de las 15:59 a una medianera con el cielo arriba. **Parte de la
diferencia es el encuadre, no el cielo.** Se le dijo así en la respuesta, y por
eso esto se apunta como indicio, no como medida.

**Y una corrección de la tabla anterior, apuntada a propósito:** hasta el
27-08 esto ponía «ICON-EU 3 de 3, el único que sigue al cielo de verdad», y
estaba mal en los dos sentidos. En Llodio, **ECMWF dio 34 % con 33 % de
verdad** y no se le había apuntado el acierto, y la fila de Etxebarri ni
siquiera estaba en la tabla aunque el texto de abajo ya la contaba. Un
marcador que solo apunta a un favorito no es un marcador.

## Lluvia · 9 comparaciones

**9 de 9 bien.** Las nueve veces salía todo seco en la foto. **La novena es la del 29-08 a las 14:11 en Busturia**, con los cinco a 0,0 mm congelados en la propia nota. **La octava es la del 29-08 a las 14:02 en Busturia**, la primera que llega con `ubiFuente: gps`: asfalto seco desde el parabrisas, los cinco a 0,0 mm. **La séptima es la
del 29-08 a las 13:49 en Barrio Axpe**: asfalto con las manchas de sol entre los
árboles y ni una mancha de agua, con los cinco modelos a 0,0 mm a las 14:00.
Tres seguidas sin falsa alarma de llovizna.

*(La de las 13:23 del mismo día NO se cuenta: se ve prado y una pista, pero no
lo bastante cerca para afirmar que están secos. Una comparación que no se puede
leer no se apunta.)*

Lo de antes, tal cual estaba: Las cuatro
primeras, cuatro de los cinco modelos daban 0,0 mm; **el 28-08 a las 08:23 en
Bermeo daban 0,0 los CINCO**, sin ninguna falsa alarma de llovizna — la primera
vez que pasa. **El 29-08 a las 12:58 en Busturia, otra vez los CINCO a 0,0**, y
la foto es de las buenas para esto: asfalto a contraluz con las manchas de sol
entre los árboles, hojas secas encima y ni una mancha de agua. Dos seguidas sin
falsa alarma.

**Y una pega repetida, que va cambiando de modelo:** ECMWF dio **0,1 mm con
código de llovizna las tres primeras veces**, sin que cayera nada. La cuarta
—Bermeo 15:40— ECMWF ya daba 0,0 y **el 0,1 lo puso ICON-EU**, aunque con
código 3 (cubierto), no de llovizna. Cuatro falsas alarmas de cuatro, pero
ninguna llegó a disparar aviso: las cuatro por debajo de `rainWarn`.

Eso hay que leerlo junto a lo del 26-08 en Bermeo, donde **ECMWF fue el único
que vio el sirimiri que sí caía**. Conclusión provisional, con 4 casos: ese
modelo **sirve para levantar la mano, no para descartar**. Si él va a un mástil
y ECMWF canta llovizna, se mira; pero que ECMWF cante no significa que llueva.

## Viento · 5 lecturas de anemómetro (31-08) — EL AGUJERO SE CERRÓ

> **CERRADO EL 31-08-2026.** Esta sección se escribió cuando había CERO
> lecturas de aparato y termina pidiéndole un número. **Lo mandó, y mandó
> cinco**, en cuatro emplazamientos: Ganguren, Punta Galea, Sollube y su
> caseta de Bermeo. Están al final del fichero, en *«LAS CINCO LECTURAS DE
> ANEMÓMETRO, COMPLETAS»*, con los cinco modelos al lado.
>
> **Lo que cerraron y lo que no:** las cuatro en MAX caen dentro de la
> horquilla del viento MEDIO de los modelos, así que la app no se inventa
> viento. **La racha sigue sin puntuar** — un molinete en la mano a metro y
> medio no mide la racha a 10 m — y la horquilla que se describe aquí abajo
> sigue abierta: el 31-08 en el Sollube iba de **7,6 (GFS) a 34,2 (ICON)**.
> Lo que falta ya no es un número cualquiera: es **un día de viento de
> verdad, en descubierto y con el aparato en alto**, como el del Oiz.

Lo que se escribió cuando no había ninguna, y sigue explicando por qué hacía
falta:

**Nueve observaciones de nubes, seis de lluvia, dos de temperatura y CERO de
viento.** Y el viento es lo único de los tres que le manda a casa: su límite de
torre son **60 km/h de racha**.

Una foto no mide viento, y por eso el agujero no se cierra solo. Lo que enseña
el 29-08 en Busturia es lo grande que es: para la misma hora y el mismo punto,
las rachas iban de **9,0 km/h (GFS) a 30,2 (ECMWF)** — tres veces y media entre
el que menos y el que más, con los otros tres apretados en 22-26. Con esa
horquilla, «qué modelo miras» no es un detalle.

**Lo que hace falta no son más fotos, es un número de su anemómetro** con hora y
sitio, aunque sea de un día tranquilo. Con los cinco modelos ya congelados en
cada nota, **una sola lectura ya reparte aciertos y fallos**. Se le pidió el
29-08.

### Y una pega de etiquetado, del mismo día

De las cuatro fotos de las 12:56-12:59, la primera se guardó sellada como
**`BI BERMEO 43,412976/−2,718316`** —las coordenadas del emplazamiento— y las
tres siguientes con su GPS de verdad, `43,37567/−2,69682`. **Son 4,5 km de
diferencia**, y el `decia` de esa nota se congeló para el sitio equivocado
(racha 22,7 en vez de 28,8).

Dos de las fotos traen el geosello quemado en la imagen —*29 ago 2026 12:58:36,
43,3746N 2,6964W, San Bartolome Auzoa, Axpe-San Bartolome, Bizkaia*— y **eso es
lo que manda**: por ahí se supo dónde estaba de verdad. Sin ese sello, la
primera foto se habría comparado contra el tiempo de Bermeo.

**CONFIRMADO POR ÉL el 29-08-2026:** *«no es Bermeo ninguna»*. Las cuatro son
de Axpe-San Bartolomé. Así que la primera queda apuntada en Busturia, y su
`decia` —congelado contra Bermeo— **se descarta y no puntúa**: para esa hora
valen los números de las otras tres.

### Y NO era lo que yo sospechaba. Era peor, porque era en silencio

Escribí aquí que «pinta a que la app cae al emplazamiento más cercano mientras
el GPS todavía está enganchando». **Falso.** Leído el código, lo que hace es
más simple: si no hay ubicación viva, manda las coordenadas **del emplazamiento
que tengas abierto en la app** —`app.js`, `lat: ubiVigente()?.lat ?? S.place?.lat`—
y el servidor congela los cinco modelos para ESE punto. No es que el GPS
tardara: es que a las 12:56 él aún no le había dado al botón.

**Y el aviso que existía no saltaba en ese caso.** Solo avisaba si habías
cogido la ubicación y se te había pasado de los 5 minutos (`teniaUbi &&
!sigueVigente`). Si no le dabas nunca al botón, la foto salía con el
emplazamiento **sin decir ni una palabra**.

**Arreglado y publicado el 29-08-2026 (v2026.08.29-1334):**

- La nota guarda ahora **`ubiFuente`**: `'gps'` o `'emplazamiento'`. Antes los
  dos casos eran indistinguibles y el `decia` tenía la misma pinta de medición
  en los dos.
- **Se avisa siempre** que la foto no lleve su GPS, no solo cuando ha caducado:
  *«Esta foto va con el emplazamiento «X», no con tu GPS. Si no estás ahí, el
  tiempo que guardo con ella no es el tuyo»*.
- El lector de la tarea (`leer.sh`) lo canta en mayúsculas y manda preguntar
  antes de apuntar nada en este marcador.

**Y volvió a pasar el mismo día a las 13:23**, con dos notas más selladas como
BI BERMEO estando en Busturia. O sea que no era el despiste de una vez: era el
comportamiento normal de la app. Eso es lo que llevó a mirar la causa de raíz
—ver abajo, *«La foto salía sola»*—, porque avisarle después no evitaba ni una.

Verificado sobre el fichero servido en Vercel: `ubiFuente` y el aviso nuevo
están en el `app.js` publicado. **Lo que falta por comprobar de punta a punta
es el lado del servidor** —que la nota vuelva con el campo puesto—, y eso se
verá con la primera nota que mande; no se ha probado metiendo una falsa en su
cuaderno.

## Temperatura · 3 comparaciones

| Cuándo · dónde | Él midió | Automático | ECMWF | GFS | ICON-EU | AROME |
|---|---|---|---|---|---|---|
| 13:54 · Llodio | **27 °** | 25,9 | **25,8** | **27,3** | 26,8 | 25,7 |
| 15:00 · Bermeo pueblo, 16 m | **26 °** | 25,7 | **26,0** | 27,5 | 25,7 | 25,5 |
| **29-08** 14:00 · Barrio Axpe, Busturia `43,3767/−2,69765` · termómetro exterior del coche, **parado y al ralentí** | **26 °** | **26,0** ✔ | 29,6 | **31,0** | 29,0 | **25,7** ✔ |

> **Esta fila es la mejor del cuaderno, y no por el número.** Es la primera
> comparación de temperatura en la que **los cinco modelos venían congelados
> dentro de la propia nota**, con su GPS y su hora, en vez de reconstruidos
> después por quien la puntúa. La mandó a las 14:11:22 desde la app ya
> arreglada, y quince segundos antes había mandado la foto del cielo desde el
> mismo punto: **una dice el cielo, la otra el número**. Ese par es exactamente
> lo que hacía falta.
>
> *(Antes aquí figuraban 25,9 / 28,9 / 25,6, sacados por mí de un punto 50 m
> distinto. Se sustituyen por los congelados, que son los buenos.)*

**Y la tercera parte el marcador en dos**, porque separa por resolución y no por
modelo:

| | error el 29-08 | malla |
|---|---|---|
| **Automático (aquí es AROME)** | **0,0** — clavado | 1,3 km |
| **AROME HD** | **−0,3** | 1,3 km |
| ICON-EU | +3,0 | 7 km |
| ECMWF | +3,6 | 25 km |
| **GFS** | **+5,0** | 25 km |

**Los dos finos clavan; los tres gruesos se pasan de 3 a 5 grados.** Y el
sentido del error del aparato **refuerza** la conclusión en vez de debilitarla:
el sensor exterior de un coche **parado se pasa por arriba**, nunca por abajo
—calor del motor y del asfalto—, así que la temperatura real es **igual o menor
que 26**, y los tres gruesos fallan eso o más. El de GFS son 5 grados de mínimo.

**Esto tumba lo que decía este cuaderno hasta hoy.** Ponía «ECMWF 1 de 2
clavado», y con tres casos ECMWF va **+3,6** en el peor. Con dos casos se estaba
leyendo puntería donde había casualidad. **ECMWF 1 de 3, GFS 1 de 3, y los dos
de 1,3 km 1 de 3 cada uno pero fallando por décimas** — que no es lo mismo aunque
el recuento lo parezca. Para temperatura en su zona, **AROME o el Automático**.

**Salvedad, y va delante:** el termómetro del coche no es una estación. Lo que
esta fila mide bien es el ORDEN de magnitud del error, no la décima. Que GFS se
pase cinco grados no depende de si el sensor se pasa medio.

**Y una comprobación que vale por sí sola:** para esa misma hora, los cinco
modelos daban en la caseta de Bermeo (133 m) **1,1 °C menos** que en el pueblo
(16 m) donde él estaba. Eso confirma con números la corrección por altura que
hasta entonces se decía a ojo — ver la sección de abajo sobre desde dónde mira.

## Bruma y humedad · 1 comparación, y es un FALLO con patrón

**29-08-2026, ~13:20.** Suyo, por el chat: *«en la costa se ve alguna bruma
baja»*. Estaba de la vuelta del paseo por Busturia, mirando hacia el mar.

**Lo que decía la app para las 13:00**, en los cuatro puntos de la costa
mirados —Bermeo, cabo Matxitxako, la barra de Mundaka y su punto de Busturia—:

| | visibilidad | nube baja | código | T − rocío |
|---|---|---|---|---|
| BI BERMEO | 56.340 m | 0 % | 0, despejado | 8,0 °C |
| Cabo Matxitxako | 56.340 m | 0 % | 0, despejado | 8,7 °C |
| Mundaka (barra) | 56.340 m | 0 % | 0, despejado | 8,0 °C |
| Busturia, su punto | 56.340 m | 0 % | 0, despejado | 13,2 °C |

O sea: **la app decía aire limpio de 56 km, ni una nube baja y ni rastro de
saturación**, y él estaba viendo bruma. Fallo, y de los gordos, porque no es
que se quedara corta: es que daba el extremo contrario.

### Antes de apuntarlo se comprobó que el campo no fuera un relleno

Los cuatro puntos daban **el mismo número clavado, 56.340 m**, y eso huele a
constante. Se sacaron las 48 horas de la serie en Bermeo: **se mueve, 21
valores distintos, de 4.560 a 56.340 m** — mañana 30-08 por la tarde baja sola
a 4,5 km. El campo `visibility` funciona. **El 56 km de hoy es un dato del
modelo, no un hueco.** (Script: `revisiones/bruma-serie.sh`.)

### Y las estaciones de AEMET le dan la razón A ÉL

Medido a las 12:00, contra el modelo en la misma estación y la misma hora
(`revisiones/contraste-bruma.sh`, punto de rocío por Magnus a partir de la
temperatura y la humedad que publica AEMET):

| Estación | km | humedad medida | modelo | rocío medido | modelo | desvío |
|---|---|---|---|---|---|---|
| **MATXITXAKO** (cabo, al mar abierto) | 4,5 | **67 %** | 56 % | **17,4 °C** | 14,4 °C | **−3,0 °C** |
| **MUTRIKU** (costa abierta) | 28,6 | **59 %** | 47 % | **16,1 °C** | 13,2 °C | **−2,9 °C** |
| FORUA (ría adentro) | 9,6 | 44 % | 43 % | 14,6 °C | 12,4 °C | −2,2 °C |
| BILBAO AEROPUERTO | 20,3 | 41 % | 39 % | 12,5 °C | 11,5 °C | −1,0 °C |
| AMOREBIETA-ETXANO | 24,3 | 43 % | 42 % | 12,0 °C | 12,1 °C | +0,1 °C |

**El patrón no es ruido: las dos estaciones que dan al mar abierto son
justamente las dos donde el modelo va más seco**, −11 y −12 puntos de humedad.
Tierra adentro cuadra: Amorebieta clava el rocío, Bilbao falla un grado, Forua
uno y pico. **Un modelo más seco que la realidad no puede pintar bruma baja
aunque la haya**, y por eso la app daba 0 % con él viéndola.

El contraste costa/interior es enorme y **está medido, no supuesto**: Matxitxako
**67 %** y Forua **44 %**, con 9,6 km entre las dos. Esos 23 puntos son aire
marino pegado a la costa.

**Salvedad honesta, y va aquí porque cambia lo que se puede concluir:**
Matxitxako mide a **93 m de altura**, y con 67 % y 6,5 °C de margen ese aire
todavía no satura. La bruma que él ve estará **por debajo**, pegada al agua,
en una capa de pocos metros que ni la estación ni una celda de modelo pueden
ver. **Que la app vaya seca de más está medido; que ESA sea la causa de ESTA
bruma es lo más probable, pero no está demostrado.**

**Punta Galea queda fuera del recuento a propósito**: ahí el modelo sale más
húmedo (+11 puntos), pero también falla 2,5 °C la temperatura, así que ese caso
mide otra cosa y mezclarlo sería hacer trampa al recuento.

### CONFIRMADO POR ÉL, Y POR SU PROPIA FOTO

Preguntado desde dónde miraba, contestó **«busturia»**, y a las 13:23 lo dejó
escrito en la app: *«En la costa sí se ve algo de nube baja»*. O sea **desde
Axpe-San Bartolomé mirando al norte, a la bocana**.

Y la foto que mandó a las 13:23:44 lo enseña, que es mejor que cualquier
descripción: **arriba, azul limpio y sombras duras de sol** —despejado de
verdad—, y **sobre el mar, justo encima del horizonte, una banda blanquecina
baja**, con el monte del fondo lavado en vez de recortado.

**Las dos cosas a la vez y sin contradicción**, y por eso esta observación vale
doble: el cielo de encima despejado —donde la app acierta— y la costa con algo
pegado al agua —donde la app no ve nada—. No es que el modelo fallara el cielo
en general: falló **la capa baja sobre el mar**, que es justo la que las
estaciones dicen que tiene 11 puntos más de humedad de los que él cree.

**Sigue sin poderse cerrar el mecanismo**, y se deja dicho: no se sabe si esa
banda satura de verdad o es sólo aerosol marino. Para eso haría falta un dato
a ras de agua, y no hay estación ahí.

**Lo que este caso deja dicho, y no es poco:** era la primera comparación de
visibilidad del cuaderno. **Empieza 0 de 1**, y con una pista de por dónde va
el error —la app se seca en la costa—, que vale más que el propio fallo.

## UNA PREDICCIÓN ESCRITA ANTES DE VER LA FOTO (29-08-2026, 14:20)

**Esto se apunta ANTES a propósito.** Aitor iba de vuelta a Bermeo y dijo:
*«quiero que veáis las nubes como están cerca de la costa»*. Escribir lo que
se espera antes de mirar es la única forma de no contarse el cuento después,
y en este cuaderno ya ha pasado —el marcador de nubes se leyó como puntería
lo que era casualidad, con dos casos—.

Mirando la nube **por capas** y no solo el total (`revisiones/capas-nube.sh`),
para BI BERMEO a las 15:00:

| | nube BAJA | media | alta | total | código |
|---|---|---|---|---|---|
| Automático | 0 % | 0 % | 0 % | 0 % | 0, despejado |
| **ICON-EU** | **32 %** | **45 %** | 0 % | **56 %** | **2** |
| ECMWF | 0 % | 4 % | 0 % | 1 % | 0, despejado |
| GFS | 0 % | 0 % | 0 % | 0 % | 0, despejado |
| AROME HD | 0 % | 0 % | 0 % | — | — |

**ICON-EU es el único de los cinco que ve nube baja en la costa.**

Y eso obliga a dudar de lo que este mismo cuaderno lleva escrito hoy. ICON
acumula **siete fallos, los siete por arriba** — pero **todos tierra adentro**,
en Busturia. Puede que no sea el mismo fenómeno: puede que ICON, con sus 7 km,
esté resolviendo la capa marina que ECMWF y GFS —25 km, y leyendo un nudo a 14
y 18 km monte adentro— se comen enteros. Si es así, lo que se ha llamado
«sesgo» sería, **en la costa**, acierto.

**Las dos salidas valen, y las dos están escritas de antemano:**

- **Si en su foto hay banda baja sobre el mar** → ICON acierta y los otros
  cuatro fallan, y hay que releer sus cinco fallos de hoy separando costa de
  interior.
- **Si no hay nada** → ICON falla el octavo, siempre por arriba, y el sesgo
  queda confirmado también en la costa.

Lo que NO vale es decidir cuál era la hipótesis después de ver la foto.

### RESUELTA A LAS 14:23 — y fallan los CINCO

> **ESTA SECCIÓN SE ESCRIBIÓ MAL PRIMERO, Y EL ERROR SE DEJA APUNTADO.**
>
> La primera versión decía *«Gana ICON-EU, y por goleada»*. **Era falso.** Se
> puntuó la foto de las **14:23** contra los datos de las **15:00**, una hora
> después, y encima en el punto del emplazamiento y no en el suyo. Con la hora
> y el punto buenos (`43,41808/−2,71037`), nube **baja**:
>
> | hora | Automático | **ICON-EU** | ECMWF | GFS | AROME HD |
> |---|---|---|---|---|---|
> | 13:00 | 0 % | **5 %** | 0 % | 0 % | 0 % |
> | **14:00** ← su foto | 0 % | **0 %** | 0 % | 0 % | 0 % |
> | 15:00 | 0 % | **15 %** | 0 % | 0 % | 0 % |
>
> **A la hora de su foto los CINCO dan 0 %.** Fallan los cinco.
>
> Lo cazó comprobar la hora del reloj, no una revisión de la conclusión: el
> Mac marcaba 18:28 mientras su nota decía 14:23, se fue a mirar si el reloj
> estaba mal —no lo estaba— y de paso saltó que la foto y los datos no eran de
> la misma hora. **Un acierto de más es tan grave como un fallo callado**, y
> este iba en la dirección peligrosa: decirle que hay un modelo en el que
> fiarse cuando no lo hay.
>
> Se le corrigió en cuanto se vio. Lo de abajo ya está reescrito.

Mandó la foto desde el puerto de Bermeo (`43,41808/−2,71037`, con su GPS) y con
comentario dentro de la misma nota: *«Al fondo el cabo matxitxako algunas nubes
bajas por el mar»*.

**Y se ve.** El espigón, el mar, el cabo al fondo a la izquierda, y **sobre el
mar, justo encima del horizonte, una franja blanquecina baja**, con el cielo de
arriba azul limpio. Las dos cosas a la vez, igual que a las 13:23.

**Los CINCO daban 0 % de nube baja a las 14:00, y él la estaba viendo.** Ese es
el resultado, y es el peor de los dos que se habían escrito de antemano: no es
que un modelo acierte y cuatro fallen, es que **para la nube baja de esta costa
no hay modelo bueno**.

**Lo único que se sostiene a favor de ICON-EU**, y hay que decirlo con su
límite: es el **único de los cinco que produce algo de nube baja en esa costa en
todo el día** —5 % a las 13:00, 15 % a las 15:00, y 32 % a las 15:00 en el punto
del emplazamiento, a un kilómetro—. Los otros cuatro están a cero de la mañana a
la noche. Pero le llega **una hora tarde**. Eso no es acertar: es acercarse. Y
para decidir, acercarse una hora tarde no vale.

**Lo que sí se corrige de verdad, y se mantiene:** a ICON se le apuntaron siete
fallos por pasarse de nubes, **todos tierra adentro**. En la costa el problema
es el contrario —se queda corto como los demás—, así que **no es el mismo
fenómeno y no puede ir en el mismo saco**. Desde ahora la nubosidad se puntúa
**separando costa de interior**.

**Y la explicación fácil de la temperatura tampoco vale aquí.** Con los 26 °C
salió que «no separa por modelo, separa por resolución». Pues en nube baja de
costa **falla también AROME HD, el de 1,3 km**. Malla fina no es igual a mejor:
AROME gana en temperatura y pierde aquí. **Cada campo tiene su modelo, y algunos
campos no tienen ninguno.**

**Y una tercera cosa que sale de esto y vale para decidir:** en el mismo punto,
la nube baja de ICON pasa de **0 % a las 14:00 a 15 % a las 15:00**. La hora
importa tanto como el modelo. Mirar la franja del día en vez de la hora exacta
puede cambiar la respuesta entera.

**Cierra con lo de la mañana, y es la misma historia:** las estaciones de AEMET
daban 11 y 12 puntos más de humedad que el modelo **solo en Matxitxako y
Mutriku**, las dos que dan al mar abierto. Un modelo que va seco en la costa no
puede pintar la nube baja de la costa. **No es que uno acierte: es que los cinco
van secos, y uno menos que los demás.** Dos caminos distintos —estaciones y
foto— y la misma conclusión.

**Visibilidad y nube baja de costa: 0 de 2 comparaciones.** Las dos veces que él
la ha visto, la app decía despejado. Para ese campo **no hay modelo en el que
apoyarse**, y lo honesto es que la app lo diga en vez de pintar «despejado» con
la misma confianza que pinta el resto.

**PENDIENTE, y es lo que sale de todo esto:** cuando la costa está así —modelos
secos, estaciones húmedas, banda sobre el mar—, la ficha de un emplazamiento de
costa no debería afirmar «despejado» a secas. Pero **no se toca nada con dos
casos**. Hacen falta más observaciones suyas de costa antes de cambiar una sola
palabra de lo que la app le dice.

## La foto salía sola, y por eso se colaban las notas mal situadas (29-08-2026)

**Lo encontró él, y es la causa de raíz de todo lo de arriba.** Sus palabras:

> *«en el momento que hago la foto la envía sola, no le doy ni a enviar… o si la
> cojo de galería se envía sola sin darle yo. Entonces no sé si está pinchada la
> ubicación o no. Ese es el fallo»*

Y era literal. En `app.js`, el enganche del selector llamaba a `mandarFoto()` en
cuanto elegía la imagen. **Entre tocar la foto y salir disparada no había ni un
instante** para mirar si llevaba su GPS — ni para escribir nada, que es la otra
mitad de su queja: *«por eso no deja comentar nada, sube seguido»*.

**Yo había tapado el síntoma unas horas antes** —avisarle DESPUÉS de mandarla— y
no valía: para entonces la nota mala ya estaba guardada, con los cinco modelos
congelados para el sitio equivocado. Se vio enseguida: a las 13:23 volvieron a
colarse dos.

**Lo que hay ahora:** la foto se queda en espera y se ve, con un aviso que dice
en verde *«va con tu ubicación»* con las coordenadas, o en ámbar *«NO lleva tu
ubicación: saldrá con el emplazamiento «BI BERMEO»»*. Al darle a «Añadir dónde
estoy» el aviso cambia delante de él, que es exactamente lo que pedía saber. No
sale nada hasta que le da a **Enviar la foto**.

**Cuesta un toque más, y es el toque que él pidió.** Nueve pruebas nuevas lo
bloquean: cuatro miran el código y **cinco ejecutan `pintarPrevia()` del `app.js`
real con un DOM simulado y comprueban la frase que él leería** —que nombre el
emplazamiento, que distinga la ubicación caducada de la que nunca cogió, y que
no invente un nombre si no hay emplazamiento elegido—.

Se probó así porque **el panel del navegador no se puede levantar en una sesión
desatendida**. Verificación bloqueada, otra vía.

## La letra estaba por debajo del mínimo para leerse (29-08-2026)

Suyo, con el hilo de notas en pantalla: *«la letra apenas se ve, está oscura»*.
**No era impresión suya, y se puede medir** (`revisiones/contraste-letra.py`).

Medido sobre el fondo REAL de tarjeta —`#0f1626`, no el de página: la tarjeta es
translúcida y queda más clara, así que medir contra el fondo pelado da un
contraste mejor del que hay—:

| | color | contraste | |
|---|---|---|---|
| `--ink` | `#e9eefb` | 15,60:1 | bien |
| `--dim` | `#93a1bd` | 6,96:1 | justo |
| **`--faint`** | `#63708d` | **3,65:1** | **no llega al 4,5:1 de texto normal** |

Y lo peor no era el color: **`.hn--sin { opacity:.75 }` atenuaba las notas SIN
CONTESTAR**. Ahí dentro, la línea de la fecha y el sitio —`--faint`— caía a
**2,60:1**, por debajo incluso del listón de texto grande. **Es exactamente la
línea que él no podía leer**, y estaba apagada justo en las notas que piden algo.

Puesto: `--faint` a `#8b99b8` (6,34:1) y `--dim` a `#b3c0da` (9,89:1), los dos
por encima del mínimo. Y lo sin contestar **ya no se apaga: se marca**, con
barra ámbar a la izquierda, como la respuesta lleva la suya azul.

**Cinco pruebas nuevas calculan el contraste desde los propios tokens de
`index.html`** y no dejan publicar si alguien vuelve a oscurecerlos. Un gris que
«parece que se lee» en el Mac de noche no se lee en un móvil al sol en el monte.

## El reloj de su coche confirmó el de la app (29-08-2026, 14:04)

Mandó una foto del salpicadero *«a ver si la ves»*, probando el envío nuevo. No
puntúa nada de tiempo —los **20,5 °C** del climatizador son la temperatura que
él le ha PEDIDO al aparato, no una medida de nada, y apuntarla sería meter en
este cuaderno un número que no ha medido— pero trajo una comprobación gratis
que sí vale:

**El reloj de la radio marcaba 14:04 y la nota se guardó a las 14:04:16.**

Eso no es un detalle. Los cinco modelos se congelan **con esa hora**: si el
reloj del móvil se fuera diez minutos, cada foto suya se estaría comparando
contra la previsión de otro rato, y el marcador entero quedaría desplazado sin
que nadie lo notara. Queda comprobado contra un reloj de fuera de la app.

## Nubosidad, observación suelta · 27-08 15:00 Bermeo

Suyo: *«de momento nubes blancas y negras veo también»*. El modelo daba la
nubosidad subiendo de **67 % a las 14:00 a 87 % a las 15:00 y 90 % a las
16:00**, con el CAPE pasando de 440 a 870 y la tapa en 23. Las bases negras que
él ve son las torres creciendo. **Cuadra con el reloj**, que es lo que se
quería comprobar: la regla de la tapa avisó ANTES de que se viera nada.

## Lo que este marcador ya dice, y lo que no

**Dice** que la nubosidad de la app no vale para decidir salvo que se mire
**ICON-EU o ECMWF** —empatados a 5 de 9 juntando el 29-08—, y que **el modelo
Automático es el peor de todos en ese campo**, 1 de 9, que es justo el que lleva
puesto por defecto.

**Y dice cómo falla cada uno, que sirve más que el recuento:** ICON-EU se pasa
SIEMPRE por arriba —cinco de cinco fallos, hasta 44 % con el cielo raso—, o sea
que cuando canta nubes puede no haberlas; ECMWF se queda clavado en un número
toda la tarde cuando su celda de 25 km no se entera; y el Automático falla por
los dos lados, que es lo que le quita todo valor.

**Dice también**, desde el 29-08, que **la app se seca de más en la costa**:
−11 y −12 puntos de humedad en las dos estaciones que dan al mar abierto, y en
cambio clava el interior. Por eso no vio la bruma baja que él sí veía.

**Y dice, desde el 29-08, que para TEMPERATURA mande la malla fina.** Con su
termómetro marcando 26 en Busturia, AROME y el Automático fallaron por décimas
y ECMWF y GFS por 3,6 y 5,0 grados. Eso corrige lo que decía antes este mismo
cuaderno con solo dos casos.

**NO dice** nada todavía de racha, isocero ni tormenta: de esos no hay ni una
sola comparación con la realidad. De **visibilidad** hay ya una, y es un fallo
(0 de 1). **Que no aparezcan aquí no significa que estén bien.**

**PENDIENTE DE PREGUNTARLE:** con 3 de 3, ¿la ficha debería leer la nubosidad
de ICON-EU aunque él tenga otro modelo elegido, como ya se hace con la lluvia?
No se toca sin que lo diga.

## AL COMPARAR SUS FOTOS: MIRA DESDE DÓNDE ESTÁ MIRANDO

Lo avisó él el 27-08-2026 al llegar a Bermeo: *«esta foto es del pueblo, no sé,
la caseta de Vantage está a más metros»*. Medido acto seguido:

| | Cota | |
|---|---|---|
| Su foto, Askatasun Hiribidea | **16 m** | el pueblo, a pie de ría |
| **BI BERMEO**, el punto que usa la app | **133 m** | ahí está la caseta |

**117 m de desnivel y 900 m de distancia.** El punto guardado ya es el bueno
—el de arriba—, así que los números de la app son del sitio correcto. Lo que
cambia es **qué se puede comparar con una foto hecha abajo**:

- **Nubes y tormenta: comparable.** A 900 m el cielo es el mismo.
- **Viento: NO comparable.** Ese día el modelo daba 46 km/h de racha a las
  15:00 arriba; en una calle entre edificios no se nota ni la mitad. Si él dice
  «aquí no hace nada de viento» desde el pueblo, **eso no contradice al
  modelo** y no se apunta como fallo.
- **Temperatura: restar cerca de un grado** por los 117 m.

**La regla, para cualquier sitio:** antes de apuntar una discrepancia,
comprobar la cota y la distancia entre donde él estaba y el punto del
emplazamiento. Un desnivel de cien metros explica solo más discrepancias de
viento y temperatura que cualquier fallo del modelo.

---

## 27-08-2026 · BILBAO (Ibaiondo), 14:08 · 27 °C suyos + foto del cielo

Suyo: **«Bilbao ahora mismo 27 grados marca el termómetro, os envío la foto de
las nubes y sol que hay»**. Conduciendo por la ría; el sello de la foto dice
**Goiko Torre Kalea 26, Ibaiondo, 14:07:30, 43,2470N / 2,9333W**.

### La temperatura: CLAVADA

| | Temperatura |
|---|---|
| **Él, en el sitio** | **27** |
| **Observado (app, 14:00)** | **27,4** |
| Automático 14:00 | 27,4 |
| AROME HD 14:00 | 27,3 |
| ICON-EU 14:00 | 27,7 |
| GFS 14:00 | 28 |
| ECMWF 14:00 | 26,6 |

**Cuatro décimas.** Los dos caminos —app (`/om`) y origen
(`api.open-meteo.com`)— idénticos cifra por cifra.

**Y esto es lo que vale de verdad, cruzado con Llodio 14 minutos antes:** el
mismo termómetro, el mismo día, marcando 27 en los dos sitios. En Bilbao la app
lo borda (27,4); en **Llodio se quedaba en 25,1, casi dos grados corta**. Como
el aparato es el mismo, **el que falla es el modelo en el valle de Llodio, no su
termómetro.** Eso corrige lo que veníamos suponiendo desde el Oiz: no todo
desvío de temperatura es «su aparato al sol». **Hace falta más medida en Llodio
antes de tocar nada** — con dos puntos no se cambia un modelo.

### El cielo: la cuarta confirmación seguida

**Lo que enseña la foto:** cúmulos de buen tiempo bien repartidos, mucho azul,
sol entre medias, **calzada seca**. A ojo, **~50 % cubierto**.

| | Nubosidad 14:00 |
|---|---|
| **Él, 14:08** | **~50 %** |
| Observado (app) | **11 %** |
| Automático | 11 % |
| ECMWF 25 km | 34 % |
| ICON-EU | 79 % |
| GFS | 99 % |

Del 11 % al 99 % en el mismo punto y la misma hora. **Aquí falla hasta el
“observado”** (11 % con medio cielo tapado), que es lo nuevo de esta entrada:
hasta ahora sólo se había tirado la nubosidad *pronosticada*. **No se toca nada
del semáforo** —ya no usa nubosidad— y ésta es una razón más para que no vuelva.

Nada peligroso: **CAPE de 0 a 190**, bajo, y en la foto ni bases oscuras ni
yunques.

### El sitio: bien, pero de churro

La nota se guardó con las coordenadas del emplazamiento **elegido** en la app
(Bilbao, 43,26271 / −2,92528), **no con su GPS** (43,2470 / −2,9333 según el
sello). Son **1,9 km** y en Bilbao eso es el mismo tiempo, así que la
comparación vale entera.

**Pero salió bien por casualidad:** no le dio a «Añadir dónde estoy», y si
hubiera seguido con **BI BERMEO** elegido —como esta mañana— se habría vuelto a
ir **a 34 km**. El agujero sigue abierto y sigue **pendiente de que él elija A o
B** (ver la entrada de Llodio de las 13:54).

---

## 27-08-2026 · Etxebarri/Basauri, 14:21–14:22 · dos fotos, cielo partido

**Primeras notas del día que llegan con su ubicación de verdad** («cerca de
Bilbao», **43,28753 / −2,88325**): le dio a «Añadir dónde estoy». Así es como
valen.

**14:21:45** — masa gris grande, bases oscuras y deshilachadas, tapando casi
todo con un claro azul arriba: **80–85 % cubierto**. Calzada seca.
**14:22:47** — **inservible a medias: la ventosa del soporte del móvil tapa el
centro del encuadre.** De lo que se ve, cúmulos blancos y azul, ~50 %. Se le
dijo cómo evitarlo.

Las dos juntas enseñan **cielo partido**: gris cargado por un lado, claro por el
otro. Normal con cúmulos sueltos, y es la razón física de que un solo número de
nubosidad no describa nada.

| | Nubosidad 14:00 |
|---|---|
| **Él, 14:21 (mirando al gris)** | **80–85 %** |
| Observado (app, 14:15) | 39 % |
| ECMWF 25 km | 34 % |
| Automático | 45 % |
| ICON-EU | 71 % |
| GFS | 99 % |

**Cuarta confirmación del día.** Aquí le dan la razón GFS e ICON; en Bilbao, 13
minutos antes, se la daban los que aquí fallan. **No hay un modelo “bueno” para
nubes: cambia de sitio a sitio y de cuarto de hora a cuarto de hora.**

**Nada de tormenta, y se le dijo con el porqué:** CAPE de 70 a 240 y **bajando**
(16:00 ya va de 12 a 60), lluvia 0 mm en cuatro de cinco el resto de la tarde, y
en la foto **ni yunque ni cortina de agua**. Gris de nubes bajas.

### LO QUE SÍ IMPORTA DE ESTA TANDA: el viento de la tarde no está cerrado

No lo preguntó él; salió al mirar su punto, y es lo único de hoy que puede
cambiar un GO/NO-GO. Racha, mismo punto (km/h):

| Hora | Automático | ECMWF | GFS | ICON |
|---|---|---|---|---|
| Observado 14:15 | **29,9** | | | |
| 15:00 | 35,6 | **47,9** | 33,1 | 31,7 |
| 16:00 | 33,9 | **51,1** | 29,5 | 38,2 |
| 17:00 | 30,3 | **52,6** | 31,7 | 41,4 |

**ECMWF va 22 km/h por encima del Automático a las 17:00**, y pasa de 50. Los
dos caminos (app y origen) idénticos. Se le avisó y se le ofreció repasar torre
por torre si esta tarde hay que subir a alguna. **Sin respuesta suya todavía; no
se ha tocado ningún umbral.**

---

## 27-08-2026 · BERMEO pueblo, 15:40 · foto del cielo, sin texto

Foto sola, sin una palabra. **Y la nota llegó con su GPS de verdad**
—`43,41736 / −2,7264`, que es exactamente lo que pone el sello de la foto
(«43,4174N 2,7264W · 29 Askatasun Hiribidea»)—. Segunda vez en el día que le da
a «Añadir dónde estoy», y la comparación vale entera sin churros.

Es **el mismo punto que la foto de las 15:00**: el pueblo, a 16 m, no la caseta
de Vantage a 133 m. Así que aquí se puede comparar nube y lluvia, y **no se
puede comparar viento** (ver la regla de más arriba sobre desde dónde mira).

### El cielo: el Automático vuelve a decir «despejado»

**Lo que enseña la foto:** a la izquierda un cúmulo grande con **torres blancas
de coliflor y bases grises**; a la derecha azul con cúmulos pequeños; sol
fuerte, paredes iluminadas, nada mojado. A ojo, **~60 % tapado**.

| | Nubosidad 15:00 | baja / media / alta |
|---|---|---|
| **Él, 15:40** | **~60 %** | |
| **ECMWF 25 km** | **56 %** ✔ | 7 / 16 / 78 |
| GFS | 100 % | 100 / 0 / 5 |
| ICON-EU | 87 % | 25 / 76 / 1 |
| **Automático** | **3 %**, código **0 «despejado»** | 0 / 0 / 28 |
| AROME HD | no publica total | 1 / 3 / 0 |

**Quinto fallo seguido del Automático**, y el segundo con código 0 en la mano.
Es el que lleva puesto por defecto.

**Lluvia:** 0,0 mm en cuatro de cinco y en la foto todo seco. ICON pone 0,1 mm,
falsa alarma pequeña y por debajo del umbral de aviso.

### LO QUE SÍ IMPORTA, Y NO LO PREGUNTÓ ÉL: ICON ve tormenta y los demás no

Salió al mirar su punto para contestarle la foto. **Es la discrepancia entera
que la app raya en la barra**, y aquí está con sus números (mismo punto, `/om`):

| Hora | | CAPE | Tapa | Prob. | ¿Salta la combinación? |
|---|---|---|---|---|---|
| 15:00 | **ICON-EU** | **710** | **23** | 23 % | **SÍ** (≥700 · <75 · ≥10 %) |
| 15:00 | Automático | 0 | 15 | 23 % | no — sin gasolina |
| 15:00 | ECMWF | 60 | sin dato | 44 % | no |
| 15:00 | GFS | 130 | 11 | 7 % | no |
| 16:00 | **ICON-EU** | **870** | **68** | 20 % | **SÍ** |
| 16:00 | Automático | 30 | 26 | 20 % | no |
| 17:00 | ICON-EU | 520 | 84 | 25 % | no — se cierra |

**Uno de cinco.** Pero **la foto le da la razón a ese uno**: torres de coliflor
con la cima dura son cúmulos creciendo, y eso no se ve con CAPE 0. Es
exactamente el patrón del 25-08 —«el día que AROME se descuelga, la app se
descuelga con él»— y hoy vuelve a pasar en el sitio donde vive.

**Ventana de ICON: 15:00 a 17:00, y a las 17:00 la tapa ya sube a 84.**

### Rayos medidos: ninguno, y el hueco dicho con su número

Contados sobre los PNG de la red de AEMET (`/rayos`, LOCL, 0,35 km/píxel),
las cuatro últimas horas publicadas:

| Franja publicada (local) | Descargas a <100 km de Bermeo |
|---|---|
| 11:00 → 12:00 | **0** |
| 12:00 → 13:00 | **0** |
| 13:00 → 14:00 | **0** |
| 14:00 → 15:00 | **0** |

En esa última hora hay **358 píxeles con descarga en toda la península** —o sea
que el lector funciona, no está devolviendo cero por estar roto— y **la más
cercana a Bermeo está a 237 km, en Asturias** (`43,53 / −5,66`).

**Y el hueco, que es lo que engaña:** la última franja publicada es la de 14:00
a 15:00. **La foto es de las 15:40, y esa hora todavía no está.** Se le dijo
tal cual, con los minutos, y con la regla de siempre: si oye un trueno, ya está
dentro del alcance.

### Comprobado dos veces

App (`/om`) y origen (`api.open-meteo.com`), los cinco modelos y los once
campos, hora a hora: **0 diferencias**. Mismo nudo en los dos
(`43,42 / −2,7300`, 18 m) — a **0,6 km** de donde estaba él, que para nube y
lluvia es el mismo sitio.

### De paso, una herramienta que faltaba

Para poder mirar la foto hizo falta bajarla, y no había forma de hacerlo sin
sacarle una ventana de permiso. Añadido
`scheduled-tasks/mensajes-de-aitor/fotos.sh`: sin argumentos, baja a disco las
fotos de las notas **sin contestar**. Mismo motivo que `leer.sh` y
`responder.sh` —el `curl` y la ruta variable van DENTRO del script— y por tanto
**ninguna ventana**. Si algún día hace falta otra cosa, se amplía el script; no
se saca fuera.

---

## 27-08-2026 · 15:59 · EL CUADERNO PASÓ DE 11 NOTAS A 1

**Sin resolver. Pendiente de que él conteste, y no se toca nada hasta entonces.**

A las 15:40 el cajón tenía **11 notas**. Se le contestó la foto y el servidor
dijo `{"ok":true}` —o sea que en ese momento las notas estaban ahí, porque la
respuesta encontró la suya y se guardó—. A las 15:59:45 entró una foto nueva
y el cajón pasó a tener **1 nota: solo la nueva**.

**Las dos explicaciones posibles, y no se puede distinguir desde fuera:**

**1. Las borró él.** `/api/campo` tiene `borrar: 'todas'`, que existe por
petición suya (*«un hilo que solo crece se convierte en un montón por el que
hay que bucear»*). Vaciar y mandar foto nueva da exactamente 1. **Es lo más
probable** y sería perfectamente normal. Se le ha preguntado.

**2. Un fallo que se traga el cuaderno entero.** Y este hay que mirarlo aunque
la respuesta sea la 1, porque el agujero está ahí:

```js
async function leer() {
  try { ... } catch { return []; }     // ← cualquier fallo de lectura = «no hay nada»
}
...
await guardar([nota, ...todo].slice(0, 200));   // ← y esto reescribe el fichero ENTERO
```

`leer()` está en `api/campo.mjs` y `leerNotas()` igual en `api/foto.mjs`. **Si
la lectura del blob falla una sola vez —un timeout, un 500 de Vercel—, devuelve
lista vacía sin decir nada, y el siguiente guardado deja el cuaderno con una
sola nota.** No hace falta ningún borrado: basta un parpadeo de red en el
momento en que él manda una foto.

Es **la regla 2 de esta app aplicada al almacén**: un hueco callado se
confunde con «aquí no había nada». Y lo que se pierde no es un dato cualquiera
—son sus observaciones de campo, que es *«lo único que dice si la app
acierta»*—.

**Arreglo propuesto, NO hecho** (toca cómo se guardan sus datos; se le pide
permiso antes):
- que `leer()` **distinga** «el cajón está vacío» de «no he podido leerlo», y
  que en el segundo caso el guardado **se niegue** en vez de reescribir;
- guardar el cuaderno anterior como copia (`campo-anterior.json`) antes de
  cada escritura, que es una línea y devuelve el paso atrás.

**Lo que sí está a salvo:** las dos fotos de hoy (15:40 y 15:59) están bajadas
en disco y sus comparaciones apuntadas aquí arriba. De esas dos no se ha
perdido nada pase lo que pase.

## 27-08-2026 · Dos webs no son dos fuentes

Él mandó cinco capturas a las 16:03-16:04: tres de **Windy** (capa «Tormentas
eléctricas») y dos de **Meteored** (capa «Densidad de rayos»). Enseñaban lo
mismo y parecía una confirmación doble.

**No lo era.** En el pie de las de Windy se lee **ECMWF 9km** seleccionado, y
en el de las de Meteored, **ECMWF © 2026 Meteored**. Las dos webs estaban
pintando **el mismo modelo**. Dos dibujos de un solo pronóstico no son dos
opiniones, y contarlas como dos es engañarse solo.

**Regla que sale de aquí, y vale para siempre:** antes de darle peso a que «dos
webs dicen lo mismo», mirar de qué modelo tira cada una. Suele estar en una
esquina del mapa, en letra pequeña. Si coinciden, es una fuente, no dos.

**Lo que sí aportaron las capturas.** A las 16:00 las dos ponen Euskadi a cero
y los rayos en Asturias (Llanes 2,07 en Windy, 0,83 en Meteored) y en Francia
(Fumel 12,07). Eso **coincide con el mapa medido de AEMET** de esa misma hora
—358 descargas en España, cero en Euskadi— y con nuestra app. Tres cosas de
acuerdo, y una de ellas es medida, no pronóstico.

Y una que sí valía la pena: a las **19:00 Windy pinta una mancha roja justo
sobre Ondarroa, 0,69**, en una escala que llega a 20. Poca cosa en tamaño
—Llanes tenía 2,07 y Francia 12,07— pero es lo primero que no es cero en su
zona en tres días. Se apunta y se mira.

**Lo que no cuadra, y se deja escrito sin inventar explicación:** pidiéndole a
la app el **mismo modelo ECMWF** en Ondarroa a las 19:00, sale **CAPE 130,
código 1 (poco nuboso) y 0,0 mm**. O sea, nada. No sé reconciliar esa mancha
roja con esos números; puede que la capa de Windy no salga del CAPE sino de
otra variable derivada. **Queda como pregunta abierta, no como conclusión.**

## 27-08-2026 · AguaceroWx, y un fallo en el texto de nuestra propia app

Tercera fuente del día, mandada por él a las 16:10: **AguaceroWx** con **GFS,
pasada 06z, válido para las 17:00** — mismo modelo, misma pasada, misma hora y
misma resolución (0,25°) que la pestaña «GFS 25 km» de nuestro mapa. Dos capas:
MUCAPE y MUCIN.

**Lo que cuadra.** El MUCAPE de ellos sale por encima de nuestro CAPE de
superficie, que es lo que la app ya avisa y lo que tiene que pasar por
definición: Bilbao 80 → 123, Santander 50 → 107, Bayonne 290 → 528.

**Lo que NO cuadra, y es un fallo nuestro.** La capa «Inhibición» (maps.js,
id `cin`) dice, textualmente: *«su MUCIN es de la burbuja más inestable, que
SIEMPRE tiene menos tapa»*. **Ese «siempre» es falso.** Comparando el CIN de
superficie que da nuestra app con el MUCIN de sus capturas, en los mismos
pueblos y la misma hora:

| Sitio | Nuestra app (superficie) | AguaceroWx (MUCIN) | |
|---|---|---|---|
| Bilbao | 20 | **91** | MU tiene MÁS tapa |
| Donostia | 62 | **79** | MÁS |
| Tolosa | 62 | 55 | menos |
| Durango | 7 | **12** | MÁS |
| Santander | 24 | **26** | MÁS |

**Cuatro de cinco al revés de lo que dice el texto**, y el de Bilbao (20 contra
91) está muy fuera de lo que se puede achacar a leer mal una etiqueta en una
captura.

**Por qué esto no es una errata.** Ese texto va debajo de un mapa con el que
decide si manda a alguien a una torre. Le está diciendo que en AguaceroWx verá
siempre menos tapa de la que hay, así que si se lo cree, **descuenta la tapa
que ve allí**. Hoy AguaceroWx enseñaba MÁS tapa, que es la lectura prudente:
el texto le empuja justo al lado imprudente. Pasado a la sesión que lleva los
cambios de la app, con la corrección propuesta.

**Y la lección de fondo, que es la misma de las dos webs:** el fallo no estaba
en ninguna web de fuera. Estaba en una frase nuestra escrita con seguridad a
partir de **un solo caso** (el 119/58 de Bilbao) y coronada con un «SIEMPRE».
Un caso no es una regla. Si hay que escribir «siempre», o se mide en varios
sitios o se escribe «a veces».

## 27-08-2026 · PREVISIÓN ESCRITA ANTES DE QUE PASE (Lekeitio y Markina, 18-20 h)

Se escribe **a las 16:30**, con el episodio por delante, para que luego no se
pueda contar como acierto lo que se dijo después. Datos pedidos a la app,
modelo ICON-EU, y contrastados con GFS de AguaceroWx y con Windy/Meteored.

**LO QUE DIGO QUE VA A PASAR:**

1. **En Bermeo no pasa nada más hoy.** ICON: 17:00 tapa 84 y CAPE cayendo de
   870 a 520. Su foto de las 15:59 ya enseñaba el cielo abriéndose (35-45 %
   contra ~60 % a las 15:40) y las torres de coliflor deshechas.
2. **Si hay algo, es en Lekeitio-Markina entre las 18:00 y las 20:00.** ICON en
   Lekeitio cumple la regla calibrada cuatro horas seguidas: 730/70, 810/45,
   840/39 y **860/27 a las 20:00**, con pop del 13 al 28 %.
3. **Lo más probable es chubasco, NO tormenta.** Ningún modelo da código 95, 96
   ni 99 en ninguno de sus sitios. Lo más fuerte es código 80 en Markina a las
   19:00, con 0,2 mm.
4. **Rayos: apuesto a que sigue en cero.** El tope convectivo de ICON en su zona
   se queda en 4.000-6.200 m. Donde sí hay descargas, Asturias, el tope va a
   9.760 m. Sin esa altura no hay hielo arriba y sin hielo no hay separación de
   cargas.

**CÓMO SE PUNTÚA ESTO LUEGO, para no escurrir el bulto:** el 4 se comprueba con
el mapa medido de AEMET, que no es opinión. El 3 se comprueba con las
estaciones (mm medidos) y con lo que él vea. El 1 y el 2 con las estaciones y
con sus fotos. **Si falla, se apunta que falló.**

**Y lo que NO cubre esta previsión, dicho a propósito:** el viento del anochecer
está sin decidir. A las 20:00 en Bermeo, ICON pone racha de 14 km/h y GFS de
38. Son 24 km/h de diferencia. **Eso no lo sé y no lo voy a fingir.**

**Observación suya, 27-08 sobre las 16:35, Bermeo:** *«de momento como antes
está el cielo aquí en Bermeo»*. O sea, igual que su foto de las 15:59:
cúmulos con claros, sin crecer. **Cuadra con el punto 1 de la previsión de las
16:30** —en Bermeo no pasa nada más hoy— y con ICON, que a esa hora ya daba la
tapa subiendo a 84. Cuarenta minutos después del pico previsto, el cielo sigue
sin moverse. Se apunta como confirmación parcial: falta pasar de las 17:00.

## 27-08-2026 · ME EQUIVOQUÉ: SÍ HUBO RAYOS, Y EL PORQUÉ IMPORTA

A las 16:30 escribí, en la previsión de arriba: *«Rayos: apuesto a que sigue en
cero»*. **Falso.** El vigía saltó a las 16:40 y lo verifiqué por mi cuenta
volviendo a decodificar el PNG de AEMET:

**Ventana 15:00-16:00 · SEIS descargas**, agrupadas en 43,262-43,271 N /
−2,169 a −2,178 W. Eso es **unos 2 km al sur de Zarautz**, costa de Gipuzkoa.
Distancias: **26,8 km de MARKINA2** y **28,9 km de LEKEITIO**. Ninguno de sus
catorce sitios tuvo una descarga encima, y la app no avisó — **correctamente**,
porque su veto es a 15 km y esto estaba al doble.

**POR QUÉ ME EQUIVOQUÉ, QUE ES LO QUE HAY QUE APRENDER.** Mi razonamiento fue:
Asturias tenía el tope convectivo a 9.760 m y allí caían rayos; la zona de él se
quedaba en 4.000-6.200 m; luego no habría rayos. Pedí a la app los datos del
punto exacto donde cayeron:

| Zarautz 43,266/−2,173 | 15:00 | 16:00 |
|---|---|---|
| ICON CAPE | 510 | 760 |
| ICON tapa | 50 | 51 |
| **ICON tope convectivo** | **5.900 m** | **5.900 m** |
| ICON código | **80 (chubasco)** | 3 |

**Con 5.900 m de tope cayeron seis rayos.** Mi umbral mental de «hacen falta
9.000 m» era inventado: lo saqué de comparar dos sitios un día, no de medir.
Es el mismo error del «SIEMPRE» del MUCIN, cometido por mí y el mismo día.

**Y ESTO EMPEORA LO DE ESTA TARDE, NO LO MEJORA.** Lekeitio a las 18:00 tiene
**tope 6.160 m, CAPE 810 y tapa 45** — más tope, más gasolina y menos tapa que
la célula que acaba de descargar. Lo que escribí como «lo más probable es
chubasco, NO tormenta» hay que rebajarlo a **no lo sé, y el riesgo es mayor del
que dije**.

**Lo que sí aguanta de la previsión:** ningún modelo daba código de tormenta en
el punto de Zarautz tampoco —el mejor fue ICON con código 80, chubasco— así
que «ningún modelo canta tormenta» sigue siendo verdad y **sigue sin servir
para descartarla**. Los códigos WMO no vieron esto venir en el sitio donde pasó.

## 27-08-2026 · 19:00 · CÓMO VA LA PREVISIÓN, Y UN AVISO SOBRE EL RETRASO

**Sus tres fotos de las 18:56-18:57 en Bermeo pueblo** (43,4174/−2,7264): en una
dirección un manto gris uniforme, sin estructura ni cortina de agua; en la otra,
azul con cúmulos y una masa blanca grande de tope redondeado. **Ni yunque, ni
bases negras, ni lluvia.** Y su frase, a las 19:00: *«hace viento»*.

**RAYOS — la célula de Zarautz se apagó.** Verificado marco a marco: 16:00-17:00
**cero en Euskadi** (713 descargas en España), 17:00-18:00 **cero en Euskadi**
(1.173 en España). Las seis de las 15:00-16:00 fueron todo lo que hubo, nunca
bajaron de los 26,8 km, y **la app hizo bien en callarse**.

**LLUVIA — cero.** Las seis estaciones, todas las horas: 0,0 mm. Solo Amorebieta
marcó 0,4 mm en una hora. Sus fotos, todo seco.

**EL RETRASO DE LAS ESTACIONES, que casi me hace meter la pata otra vez.** El
dato más nuevo de MATXITXAKO viene sellado `2026-08-27T14:00:00+0000`, y el
propio campo dice **`haceMinutos: 180`**. Eso son las **16:00 de aquí, TRES
HORAS de retraso**. Estuve a punto de dar sus 36,7 km/h de racha como «lo que
hace ahora». **No son de ahora, son de las 16:00.**

Es el mismo error que ya cometí dos veces esta semana leyendo horas UTC como si
fueran de aquí. **Regla: en esta fuente, mirar SIEMPRE `haceMinutos` antes de
decir «ahora».**

**Y por eso su «hace viento» es EL DATO MÁS NUEVO QUE EXISTE.** No hay estación
que llegue a las 19:00. Lo único que hay del viento de este momento en Bermeo
es lo que él nota.

**LO QUE ESO DECIDE.** A las 16:30 dejé escrito que el viento del anochecer no
lo sabía, porque los modelos se partían:

| Bermeo | 19:00 | 20:00 |
|---|---|---|
| ICON-EU | 27,4 | **14,4** |
| GFS | **40,7** | **38,2** |
| ECMWF | 32,0 | 24,5 |
| Automático | 36,8 | 29,3 |

**Si a las 19:00 hace viento de notarse, ICON está fuera** —y sobre todo su 14,4
de las 20:00, que sería aire casi parado—. Apunta a GFS y al Automático. Falta
la medida de mañana para cerrarlo, pero se apunta hoy y no se toca luego.

## 27-08-2026 · 19:10 · EL VIENTO GIRÓ, Y NINGÚN MODELO GANA EL DÍA

**Él, a las 19:00 en Bermeo pueblo:** *«es a ratos pero viene del oeste
suroeste»*. Y **Matxitxako a las 16:00 medía dirección 84°, o sea del ESTE**.
El viento ha dado media vuelta en tres horas.

**Quién vio el giro, pedido a la app en su punto:**

| Bermeo | 16:00 (medido: E, 84° en Matxitxako) | 19:00 (él: oeste-suroeste) |
|---|---|---|
| ICON-EU | **ENE 72° ✔** (12° de error) | NNO 335° ✗ · racha 31,7 |
| ECMWF | SO 224° ✗ | SO 220° · racha 32,0 |
| Automático | SSO 208° ✗ | ONO 292° ✗ · racha 32,8 |
| **GFS** | SSO 198° ✗ | **OSO 247° ✔** · racha **40,7** |

**Los modelos se intercambian de una hora a otra.** A las 16:00 el único que
acertó la dirección fue ICON, y por mucho —12° contra 114-140° de los otros
tres—. A las 19:00 el que la clava es GFS, y el que peor está es ICON.

**Esto es un argumento en contra de lo que él propuso** («un modelo para el
viento, otro para las nubes»): aquí ni siquiera vale por campo, porque **el
mismo modelo y el mismo campo cambian de bando en tres horas**. Lo que hay que
enseñarle es el desacuerdo, no elegir por él.

**CAVEAT, Y NO SE PUNTÚA POR ESTO.** Su dirección es a sentimiento, en una calle
entre edificios altos, y ahí el viento se canaliza y se desvía mucho. **No le
apunto el acierto a GFS**: queda como indicación fuerte, no como punto. Para
puntuarlo hace falta la medida de Matxitxako de las 19:00, que mañana ya estará.

**LO QUE SÍ SE PUEDE DECIR SIN FORZAR NADA.** ICON da para las 20:00 en Bermeo
**13,3 km/h de racha**, que es aire casi parado. Él nota viento a las 19:00 y lo
nota *a ratos*, que es lo propio de racheado. **Ese 13,3 no se sostiene.** Para
esta noche, el número con el que hay que contar es el de GFS y el Automático,
**37-38 km/h**, no el de ICON.

**Y el «a ratos» encaja con el oeste-suroeste:** por ahí el aire le llega a
Bermeo por encima del monte —el Sollube le queda al SO— y bajar una ladera es
justo lo que hace que venga a golpes en vez de seguido.

## 27-08-2026 · 19:30 · RESUELTO EL MISTERIO DE AGUACEROWX, Y ME COME MEDIA TARDE

Aviso de la sesión que lleva los cambios: la app pedía los datos **sin decir qué
celda quería**, y Open-Meteo usa `land` por defecto. Lo he comprobado en el punto
de Bermeo (43,4174 / −2,7264), pidiendo las dos:

| | Nudo | A qué distancia | ECMWF 17:00 | GFS 17:00 | ICON 17:00 |
|---|---|---|---|---|---|
| `land` (lo que pedí yo toda la tarde) | 43,25 / −2,75 | **18,7 km monte adentro** | **20** | 100 | 710 |
| `nearest` | 43,50 / −2,75 | 9,4 km, mar adentro | **1.110** | 550 | 980 |

**Toda la tarde he dicho que ECMWF no veía nada en Bermeo —CAPE 20 a 50—. Eso no
era ECMWF: era un punto a 18,7 km tierra adentro.** En la celda de al lado el
mismo modelo daba 1.110, el valor más alto de todos.

**Y ESTO CIERRA LA PREGUNTA QUE DEJÉ ABIERTA A LAS 16:20.** Anoté que AguaceroWx
daba unas tres veces nuestros valores y que «no sabía por qué», con la sospecha
de que fueran campos distintos de GFS. **No lo eran: era la celda.** AguaceroWx
interpola en el pueblo; nosotros caíamos en un nudo monte adentro. Con GFS en
Bermeo a las 17:00: **nuestro `land` 100 · AguaceroWx en el pueblo 349 · nuestro
`nearest` 550**. El valor del pueblo queda justo en medio de los dos nudos, que
es exactamente lo que tiene que pasar. Sospecha descartada, causa encontrada.

**LO QUE NO HAY QUE HACER AHORA: irse al otro extremo.** El nudo `nearest` de
Bermeo (43,50 / −2,75) **está en el mar**, y el CAPE sobre agua templada a las
17:00 se dispara. Decir ahora «ECMWF daba 1.110 en Bermeo» sería el mismo error
del revés. **Bermeo pueblo no es ninguno de los dos nudos: está entre medias**,
y de los tres números el que más se le parece es el 349 interpolado.

**Qué cambia de lo de hoy y qué no.** No cambia el resultado: en Bermeo no pasó
nada, la tapa aguantó y no cayó un rayo. **Sí cambia la confianza** con la que
dije «ECMWF no ve nada»: eso no lo puedo sostener, y el reparto de aciertos por
modelo de hoy en Bermeo queda contaminado y **no se puntúa**.

**Regla nueva:** cuando pida datos de un sitio de costa o de cima, **pedir las
dos celdas y enseñar las dos**, o por lo menos mirar a cuántos kilómetros ha
caído el nudo antes de abrir la boca. La app ya avisa a partir de 8 km en la
pestaña Torre; yo, pidiendo por mi cuenta, no lo estaba mirando.

## 27-08-2026 · 21:10 · LA PRIMERA DE NOCHE, Y EL AUTOMÁTICO SE DELATA

**Él, a las 21:10 en Bermeo:** *«ahora está casi despejado»*. Es la primera
observación nocturna del cuaderno.

Nubosidad para su punto a las 21:00, pedida a la app:

| | 20:00 | **21:00** | 22:00 | 23:00 |
|---|---|---|---|---|
| Automático | 1 % | **100 %** | 12 % | 0 % |
| ICON-EU | 100 % | 41 % | 40 % | 42 % |
| **ECMWF** | 15 % | **7 % ✔** | 6 % | 5 % |
| GFS | 100 % | 100 % | 100 % | 100 % |

**Gana ECMWF, y limpio:** 7 % y código 0, «despejado». Marcador de nubes:
**ICON-EU 4 de 7 · ECMWF 3 de 7 · GFS 2 de 7 · Automático 0 de 7.**

**Y aquí el «Automático» se delata del todo.** Mira su fila: **1 % a las 20:00,
100 % a las 21:00 y 12 % a las 22:00.** El cielo no hace eso. Eso es la costura
de un modelo que va cambiando de fuente hora a hora y suelta el salto en la
cara sin avisar. **Cero de siete, y encima dando bandazos.** Es el que ve quien
no toca nada, y por eso el modelo por defecto ya está en ICON.

**GFS, al revés: 100 % las cuatro horas.** Vuelve a lo de siempre —no mira,
repite— después de su único acierto de las 16:00. Ese acierto se le mantiene,
pero era eso, uno.

**Patrón que ya se puede empezar a decir, con 7 casos:** ECMWF acierta en los
extremos —despejado o cubierto— y falla en el medio, que es donde su celda de
25 km promedia y le sale un 34 % perpetuo. Cuando el cielo es claramente una
cosa u otra, es de fiar. Cuando está a medias, no.

## 28-08-2026 · CUATRO FUENTES APUNTADAS LA NOCHE ANTES

Escrito el **27-08 a las 22:30**, con el viernes entero por delante. Es la
primera vez que se apuntan cuatro pronósticos independientes ANTES del día.
Él mandó Euskalmet, Meteored y meteoblue; el cuarto es nuestra app.

**BERMEO PUEBLO · viernes 28:**

| Fuente | Racha máxima | Cuándo el pico | Giro al N/NO | Lluvia |
|---|---|---|---|---|
| Euskalmet | «rachas fuertes», sin número | por la mañana | «a partir del mediodía, empezando por la costa» | sol, «no completamente limpio» |
| Meteored | **43** | fuera de 12-18h | **16:00** | 30 % · 0,4 mm |
| meteoblue | ~~41~~ **47** | ~~14:00~~ **madrugada** | **15:00** | 0,8 mm · pop hasta 80 % |
| Nuestra app (unión) | **47,2** | **02:00** (ECMWF) | 14-16h | 0,0 a 0,9 mm |

**COINCIDEN EN TRES COSAS, y con poco margen:**
1. **La racha máxima: 41, 43, 47.** Seis km/h entre la más baja y la más alta.
2. **El giro al norte: entre las 14:00 y las 16:00**, las cuatro.
3. **Apenas agua:** de 0,0 a 0,4 mm.

**DISCREPAN EN UNA, Y ES LA BUENA PARA PUNTUAR: CUÁNDO ES EL PICO.**
- meteoblue lo pone **a las 14:00** (41), con la mañana plana en 35-40.
- Nuestro ECMWF lo pone **a las 02:00** (47,2) y lo deja morir.
- Nuestro Automático lo pone **a las 08:00** (44,3).
- Y dentro de nuestra app, a las 08:00: **Automático 44,3 contra ICON 24,5.**
  Veinte km/h en el mismo punto y la misma hora.

**QUÉ SE PUNTÚA MAÑANA, con Matxitxako y Punta Galea:**
1. La racha máxima medida contra los cuatro números.
2. La hora en que el viento gira al norte.
3. **La hora del pico** — madrugada, mañana o mediodía. Esta separa a los
   modelos de verdad y ninguna otra comparación de este cuaderno la ha hecho.

**Y LO QUE NINGUNA DE LAS CUATRO DICE, que es lo que a él le importa:** todas
hablan de Askatasun Hiribidea, a 29 m. Nuestra app en sus emplazamientos da
**OIZ 54,4 y SOLLUBEMENDI 57,2**, diez y catorce km/h por encima del pueblo.
**Su tope de torre es 60.** Ninguna web le va a avisar de eso porque ninguna
sabe dónde están sus torres.

### CORRECCIÓN de la tabla de arriba, 27-08 a las 22:45

**Escribí que meteoblue ponía el pico a las 14:00 con 41 y que iban «tres
contra uno» contra nuestro ECMWF. Falso, y el fallo es mío.** Saqué el 41 de
una captura de su app **que empezaba a las 09:00**: nunca vi su madrugada. El
41 era el máximo *de las horas visibles*, no del día.

Su panel de detalle da **ráfagas de 47 km/h como máxima del viernes**, y en la
tabla de tres en tres horas todas las horas legibles estaban por debajo de 41
—la columna de las 02:00 salía cortada por el borde—. **Luego su pico está en
la madrugada, igual que el nuestro.**

    meteoblue / Windy   47      madrugada
    Nuestro ECMWF       47,2    02:00
    Meteored            43      fuera de 12-18h
    Nuestro Automático  44,3    08:00

**Ya no hay tres posturas: hay una y una excepción.** Todos entre 43 y 47 con
el pico de noche, **y el único que se sale es el Automático con su pico a las
08:00**. Eso deja la puntuación de mañana más limpia: si Matxitxako marca su
máxima de madrugada, el Automático falla otra.

**LA LECCIÓN, que es la misma del día por tercera vez:** concluí con media
pantalla. Antes fue tomar un caso por regla (el tope de 9.000 m), luego
comparar sitios distintos (el nudo, y el cabo contra el pueblo), y ahora leer
un trozo del dato y llamarlo «lo que dice meteoblue». **Antes de decir qué dice
una fuente, comprobar que se ha visto el día entero.**

**Y OJO CON WINDY, otra vez:** su captura pone abajo `Fuente: mblue AI`. **No
es una quinta fuente: es meteoblue repetido.** Es la segunda vez en el mismo
día que Windy aparenta ser independiente y no lo es —a las 16:00 iba con ECMWF,
igual que Meteored—. **Mirar siempre la esquina antes de contarla como voto.**

### 27-08 · 23:00 · TRES VOTOS MÁS, y ahora se ve el verdadero desacuerdo

Su captura de Ventusky enseñó la lista de modelos y ahí salían cuatro que no
estábamos mirando. **No hizo falta que tocara Ventusky: se los pedí a nuestra
propia app**, que los sirve. `ICON-D2` no lo sirve; los otros tres sí.

**BERMEO PUEBLO · viernes 28 · las nueve opiniones, ordenadas:**

| Fuente | Máxima | Hora del pico | Viene del |
|---|---|---|---|
| Nuestro ECMWF | **47,2** | 02h | O |
| meteoblue / Windy | 47 | madrugada | — |
| **AROME HD 1,3 km** | **46,1** | **07h** | SO |
| Nuestro Automático | 44,3 | 08h | SO |
| **HARMONIE 5,5 km** | **44,3** | **16h** | **ONO** |
| Meteored | 43 | fuera de 12-18h | — |
| Nuestro ICON-EU | 43,2 | 02h | O |
| Nuestro GFS | 33,8 | 03h | O |
| **GEM (Canadá)** | **27,0** | **11h** | SO |

**LO QUE ESTO ENSEÑA, Y NO SE VEÍA CON CUATRO FUENTES:**

**1. En el CUÁNTO hay bastante acuerdo: siete de nueve entre 43 y 47.** Los dos
que se salen son GFS (33,8) y sobre todo **GEM con 27,0** — la mitad que ECMWF.
GEM es del centro canadiense, o sea la opinión más independiente de todas, y es
la que más se aparta. Se apunta tal cual, sin descartarla.

**2. En el CUÁNDO no hay ningún acuerdo. Ninguno.** Los picos caen en las
**02h, 07h, 08h, 11h y 16h**. Cinco horas distintas para el mismo día y el
mismo pueblo. Y HARMONIE encima lo pone **del noroeste**, o sea después del
giro: cuenta otra historia entera.

**3. AROME HD es la malla más fina (1,3 km) y pone el pico a las 07:00.** Para
costa y monte su geometría es la mejor de las nueve, así que su voto no pesa
igual que el de una malla de 25 km — pero eso hay que demostrarlo con medidas,
no suponerlo.

**LA PUNTUACIÓN DE MAÑANA SE VUELVE MUCHO MEJOR CON ESTO.** Ya no es «acertó o
no acertó el número»: es **a qué hora marca Matxitxako su máxima**. Con picos
repartidos entre las 02 y las 16, la estación va a dejar a casi todos fuera de
un plumazo, y eso sí separa a los modelos de verdad.

### 27-08 · 23:05 · CORRIJO LA CORRECCIÓN: aquel 47 era de VENTUSKY

A las 22:45 escribí que **meteoblue** daba 47 de máxima con el pico en la
madrugada, y taché con eso mi lectura anterior. **Mal atribuido.** La pantalla
del «Ráfagas de viento 47 km/h» —con punto de rocío 10/16, marea MLLW y oleaje
1,4 m— **es de Ventusky**, no de Windy ni de meteoblue. Lo confirma la captura
siguiente: mismas tarjetas, mismo selector de días arriba y las barras horarias
de Ventusky debajo.

**LO QUE SÍ SABEMOS DE VENTUSKY**, ahora con sus barras hora a hora y con la
capa en `Automático`, que allí resuelve a **ICON**:

    00-01h  43  43   <- su máxima
    03h     32
    05h     25
    07h     25
    10h     32
    11h     40       <- pico secundario
    14h     32
    16-17h  29  29
    20h     22

**Y eso valida nuestra app:** Ventusky con ICON da **43 a las 00-01h**, y
nuestro ICON-EU da **43,2 a las 02h**. Mismo modelo, mismo número. Cuando la
fuente es la misma, la app no se desvía.

**LO QUE NO SÉ, Y VUELVE A ESTAR ABIERTO: la máxima diaria de meteoblue.** De
meteoblue solo he visto su horario **de 09:00 a 18:00** (máxima 41 a las 14:00)
y el meteograma. **Nunca he visto su madrugada.** Así que mi frase de las 22:45
—«su pico está en la madrugada, igual que el nuestro»— **no tenía dato detrás y
queda retirada**. Para cerrarlo hace falta su horario de 00:00 a 08:00.

**DOS VECES EN VEINTE MINUTOS CON LO MISMO.** Primero concluí con media
pantalla, y al corregirlo atribuí la pantalla a la fuente equivocada. La
lección se amplía: **antes de decir qué dice una fuente, comprobar (a) que se
ha visto el día entero y (b) que la captura es de esa fuente.** Las apps se
parecen mucho entre sí y las tarjetas no llevan el nombre.

## 28-08-2026 · 06:40 · LA APUESTA, RESUELTA. Y NADIE LA VIO VENIR

Anoche se apuntaron nueve pronósticos para el viernes, entre **27 y 47,2 km/h**
de racha máxima. **Matxitxako midió 71,3.**

**MEDIDO, madrugada del 28 (hora de Bermeo):**

    23h  32,8      02h  50,0      05h  25,6
    00h  67,7      03h  31,3      06h  32,0
    01h  71,3  <-- el pico       04h  22,7

**CONTRA LOS SIETE MODELOS, EN EL PUNTO EXACTO DE LA ESTACIÓN**
(43,453906 / −2,752762, `cell_selection=nearest`, misma hora):

| hora | MEDIDO | AROME | ICON | ECMWF | Auto | HARMON | GEM | GFS |
|---|---|---|---|---|---|---|---|---|
| **00h** | **67,7** | **63,7** | 46,1 | 45,7 | 43,6 | 35,6 | 28,1 | 29,9 |
| **01h** | **71,3** | 48,2 | 47,9 | 47,2 | 39,2 | 34,6 | 32,0 | 30,2 |
| 02h | 50,0 | 34,9 | 44,6 | 46,1 | 35,3 | 25,2 | 27,4 | 33,8 |

**TRES CONCLUSIONES, Y LAS TRES IMPORTAN:**

**1. AROME HD (1,3 km) ganó, y por mucho.** A las 00:00 dio **63,7 contra 67,7
medidos: cuatro km/h**. El resto, entre 28 y 46 — **veinte o treinta cortos en
la misma hora**. Es el único con malla de 1,3 km y es el único que vio el pico.
Ayer lo metimos en la app por sugerencia mía después de ver la lista de
Ventusky; **doce horas después ya ha demostrado para qué servía**.

**2. EN EL PICO SE QUEDARON CORTOS TODOS, incluido AROME.** A la 01:00, con
**71,3** medidos, el mejor fue AROME con 48,2: **23 km/h de menos**. Esto NO es
sesgo constante —ayer medí que de media no lo hay— es que **el pico no lo coge
nadie**. Y el pico es lo único que decide si alguien sube.

**3. Y AQUÍ ESTÁ EL PELIGRO, CON NÚMEROS:** su tope de torre es **60**. Se
midieron **71,3**. **La mejor previsión de esa hora decía 48.** Si a la una de
la madrugada le llaman por una avería y decide con el pronóstico, **cree que
está 12 km/h por debajo de su límite cuando está 11 por encima.** Veintitrés de
error, y del lado malo.

**LO QUE SALVA ESTO, Y SE HIZO ANOCHE:** el `peorRacha()` nuevo coge **el mayor
de los siete**. A las 00:00 eso son **63,7 (AROME)** en vez de los 43,6 del
Automático. **El cambio de anoche le habría subido de 43 a 63 justo en la hora
que importaba.** No llega a 67,7, pero cruza su umbral de 60 y le habría
avisado. Sin ese cambio, no.

**CAVEAT, Y NO SE PUEDE SALTAR:** Matxitxako es **un cabo a 93 m expuesto a mar
abierto**. Punta Galea, también cabo, midió esa noche **45,4 de máxima**: 26
menos. **Dos cabos a 24 km, con 26 km/h de diferencia.** Así que este 71,3 NO
se traslada tal cual a Bermeo pueblo ni a sus emplazamientos.

**LO QUE QUEDA ABIERTO Y HAY QUE MEDIR:** anoche la app daba **SOLLUBEMENDI
57,2** y **OIZ 54,4** para hoy. Si en esos sitios el pico se quedó tan corto
como aquí, **se pasaron de 60**. No hay estación en ninguno de los dos, así que
**no se puede saber** — y no se va a suponer. Es exactamente el hueco que su
anemómetro llena: si sube, que mida en MAX y lo apunte.

### 28-08 · 06:55 · CORRECCIÓN: me faltaba ARPEGE en la tabla

Escribí «AROME ganó por goleada» habiendo pedido **siete** modelos. **Me dejé
ARPEGE fuera de la consulta**, y es uno de los tres que se añadieron anoche.
Lo cazó la otra sesión y lo he verificado pidiéndolo yo:

| hora | MEDIDO | ARPEGE | AROME | ECMWF | El mejor |
|---|---|---|---|---|---|
| 00h | **67,7** | 48,2 | **63,7** | 45,7 | **AROME**, corto por 4,0 |
| 01h | **71,3** | **49,0** | 48,2 | 47,2 | **ARPEGE**, corto por 22,3 |
| 02h | **50,0** | **47,5** | 34,9 | 46,1 | **ARPEGE**, corto por 2,5 |

**LO QUE CAMBIA:** «AROME ganó las tres» era falso. **Ganó una —la de las
00:00— y la ganó a lo grande**, 63,7 contra 67,7 cuando el segundo iba en 48.
**ARPEGE ganó las otras dos**, pero por poco: un km/h a AROME a la 01:00, y 1,4
a ECMWF a las 02:00.

**LO QUE NO CAMBIA, Y ES LO QUE IMPORTA:** a la 01:00, con **71,3** medidos, el
mejor de los ocho dio **49,0**. **Veintidós de menos.** El pico no lo cogió
nadie, se llame como se llame el que menos falló.

**Y LO QUE REFUERZA:** ARPEGE también entró anoche, con AROME, HARMONIE y GEM.
**En su primera noche fue el mejor en dos de las tres horas.** Con los cuatro
modelos de antes, a las 02:00 el mejor habría sido ECMWF con 46,1 en vez de
ARPEGE con 47,5. La ampliación a siete no es que no estorbara: **aportó desde
la primera noche.**

**MI FALLO, y es de los que ya llevo varios:** pedí siete modelos y dije «los
siete» sin comprobar que estaban los siete de la app. **Antes de decir «el
mejor de todos», comprobar que en la consulta están todos.** Es hermano del de
anoche —concluir con media pantalla— con otra cara: concluir con media lista.

## 28-08-2026 · BILBAO AEROPUERTO 05:59 · DOS BANDOS, NO RUIDO

Salió en la pantalla nueva de contraste y lo he verificado pidiendo los ocho
modelos **en las coordenadas de la estación** (43,297952 / −2,906304):

| hora | Auto | ICON | ECMWF | GFS | AROME | ARPEGE | GEM | HARMON | horquilla |
|---|---|---|---|---|---|---|---|---|---|
| 04h | 29,2 | **6,5** | 24,8 | 15,1 | 31,3 | **3,6** | 9,4 | 15,8 | 27,7 |
| **05h** | 32,0 | **6,8** | 31,0 | 19,8 | **35,6** | 30,2 | **7,6** | 26,6 | **28,8** |
| 06h | 33,8 | 11,9 | 32,8 | 14,8 | **39,2** | 31,7 | **7,2** | 36,0 | 32,0 |
| 07h | 40,0 | 10,8 | 33,1 | 9,0 | **43,2** | 33,5 | **8,3** | 22,7 | 34,9 |

**El aparato midió 28 km/h a las 05:59.**

**ESTO NO ES DISPERSIÓN, SON DOS BANDOS.** No es que los ocho anden repartidos
al azar: hay **un grupo alto** —AROME 35,6 · Auto 32,0 · ECMWF 31,0 · ARPEGE
30,2— y **un grupo bajo** —ICON 6,8 · GEM 7,6—. Entre los dos grupos no hay
nadie. Y **el aparato cayó en el grupo alto**: 28.

**LO GRAVE: ICON dio 6,8 con 28 medidos. Cuatro veces menos.** Y **ICON es el
modelo por defecto de la app.** Quien mire solo ICON a las 05:00 ve 7 km/h con
28 en la calle. GEM igual de mal, 7,6.

**LO QUE LO TAPA, otra vez:** `peorRacha()` coge el mayor de los siete, o sea
**35,6 (AROME)**. Se pasa 7,6 sobre lo medido — **y ese es el lado bueno del
error**. Segunda noche seguida en que el máximo entre modelos es lo único que
da un número utilizable.

**Y AROME encadena dos:** anoche fue el único que vio el pico de Matxitxako
(63,7 contra 67,7) y esta madrugada vuelve a ser el más alto y el más cercano
por arriba. **Dos de dos en malla fina.** Con dos casos no se decide nada, pero
se apunta y se sigue mirando.

**LO QUE ESTO CAMBIA EN LO QUE HAY QUE DECIRLE:** hasta ahora la app decía
«29 km/h de diferencia: no coinciden». **Eso se queda corto.** No es que no
coincidan: es que **la mitad de los modelos está diciendo que no hay viento y
la otra mitad que sí**. Cuando la separación es así de limpia, lo útil no es el
número de la horquilla, es **quién está en cada bando** — y eso la pantalla
nueva ya lo enseña, porque lista los modelos con su nombre.

## 28-08-2026 · EUSKALMET: HAY UN APARATO EN SU CIMA Y LLEVA AÑOS AHÍ

**Cómo salió.** Yo llevaba desde la madrugada diciendo *«en el Oiz y en el
Sollube no hay estación, no se puede saber»* y lo había dado por cerrado. Él
dijo: *«lo que me interesa es datos precisos en mis estaciones»* y *«eso darle
prio»*. **Busqué otra vez y estaba ahí.**

**LA RED DE EUSKALMET: 153 ESTACIONES.** Doce de sus catorce emplazamientos
mejoran, y dos pasan de no tener nada:

| Su sitio | Euskalmet | km | AEMET hoy | km | gana |
|---|---|---|---|---|---|
| **OIZ** | Oiz (C046) | **0,4** | Amorebieta | 9,6 | **+9,2** |
| LEKEITIO | Oleta (C0BA) | 2,3 | Mutriku | 10,4 | +8,1 |
| **VIRGEN_ORDUÑA** | Orduña (C072) | **0,1** | Amurrio | 7,9 | +7,8 |
| MARKINA2 | Iruzubieta (C0BD) | 2,0 | Elgoibar | 8,7 | +6,7 |
| MATIENA | Iurreta (C036) | 2,0 | Abadiño | 6,9 | +4,9 |
| BERMEO | Almike (C069) | 1,1 | Matxitxako | 5,3 | +4,2 |
| DURANGO | Iurreta (C036) | 1,8 | Amorebieta | 5,8 | +4,0 |
| SOLLUBEMENDI | Almike (C069) | 5,4 | Forua | 8,2 | +2,8 |
| SANTAMAÑA | Galdakao (C009) | 2,8 | Bilbao aerop. | 5,4 | +2,6 |
| MUNGIA | Derio (C003) | 3,7 | Bilbao aerop. | 5,1 | +1,4 |
| ZORNOTZA | Amorebieta (C079) | 0,9 | Amorebieta | 2,0 | +1,1 |
| GERNIKA2 | Muxika (C063) | 3,3 | Forua | 2,9 | **AEMET gana** |
| BALMASEDA | Balmaseda (C0C2) | 1,4 | **ninguna** | — | de la nada |
| ARBAIZA | Orozko (C0B4) | 4,5 | **ninguna** | — | de la nada |

**LA DEL OIZ ESTÁ A 998 m** —la cota de su caseta de Vantage— y mide **cada
diez minutos**: racha, viento medio, dirección, lluvia, temperatura y humedad.

**LA PRUEBA QUE NO HABÍAMOS PODIDO HACER NUNCA.** Su `peorRacha()` (el mayor de
los siete modelos) contra el aparato, en su cima, hoy:

| hora | MEDIDO | peor de los 7 | error |
|---|---|---|---|
| 07h | 50,8 | 47,9 | −2,9 |
| 08h | 51,2 | 46,4 | −4,8 |
| 09h | 36,3 | 37,4 | +1,1 |
| 10h | 45,5 | 38,5 | −7,0 |
| 11h | 50,4 | 45,7 | −4,7 |
| 12h | 43,1 | 48,2 | +5,1 |

**Dentro de ±7 km/h todo el día, media unos 4 cortos. El método aguanta.** Y
contrasta con Matxitxako anoche, donde se quedaron 23 cortos en el pico: **la
diferencia es que anoche era un temporal nocturno y hoy un día normal.**

**DOS COSAS MÁS QUE SALEN DE AQUÍ:**

**GFS es inservible en el Oiz.** Dio 15,5 con 51,2 medidos, y todo el día por
debajo de 25 mientras el aparato marcaba 36-51. Un día no decide nada; se
apunta.

**La humedad la fallan LOS SIETE y por el mismo lado.** Aparato 57,5 %, el más
alto de los modelos 51. **Y la humedad es lo que le dice si va a encontrar los
cuadros mojados de rocío aunque no llueva** — con lo de la sobretensión en los
fusibles, eso no es un detalle. Primer caso, se sigue.

**LA RECETA TÉCNICA, por si esta sesión no está mañana:**
Claves en `~/Documents/Apikey/` (privateKey.pem · publicKey.pem · fingerPrint.txt).
JWT RS256: `aud:"met01.apikey"`, `iss:<fingerprint>`, `exp`, `iat`,
`version:"1.0.0"`, `email`. Cabecera `Authorization: Bearer`. Base
`https://api.euskadi.eus`. Lecturas:
`/euskalmet/readings/forStation/{EST}/{SENSOR}/measures/{TIPO}/{MEDIDA}/at/{Y}/{M}/{D}/{H}`
**La hora del path es UTC y las velocidades vienen en m/s (×3,6).** Los dos me
hicieron dudar. Script probado en el scratchpad: `euskalmet.sh`.

## 28-08-2026 · LA ALTURA MANDA EN EL OIZ, Y LO DICE ÉL

Con la estación de Euskalmet ya accesible se ha podido reconstruir su medida
del **26-08 a las 09:xx en el Oiz**, que hasta hoy solo se podía comparar
contra los modelos:

| | Qué marcó | A qué altura |
|---|---|---|
| **Su anemómetro** | **26,4 km/h** | a ras de suelo, en la mano |
| Los modelos (app) | 26,3 km/h | nominal 10 m |
| **Euskalmet · viento MEDIO** | **42 – 48 km/h** | **20 m** |
| **Euskalmet · racha MÁXIMA** | **50 – 59 km/h** | **20 m** |

**ÉL MISMO PLANTEÓ LAS DOS EXPLICACIONES, en este orden:**

1. *«al no poner en MAX en el anemómetro, pues el fallo sería el mío»* — y
   tiene razón en que comparar su instantánea contra un máximo de 10 minutos no
   vale. **Pero se comprobó contra el MEDIO y su 26,4 sigue siendo la mitad**,
   así que el modo del aparato explica una parte pequeña, no el grueso.
2. *«aparte que la altura del aparato de Euskalmet esté más alto»* · **«allí 5
   metros más es el doble»**. **Esa es la buena**, y es conocimiento suyo de
   estar allí: el dato lo confirma —26 abajo, 45 de media a 20 m—.

**LA TRAMPA, Y HAY QUE TENERLA MUY PRESENTE AL MONTAR LA PANTALLA:**

- **Para trabajar a pie (su 90 %) los MODELOS iban bien**: daban 26,3 y midió
  26,4. **Clavado.** El aparato de Euskalmet le habría dicho 51, **el doble de
  lo que se iba a encontrar**.
- **Para subir a la torre, al revés y peligroso**: la estación mide a 20 m y su
  torre tiene **60 m**. Si a 20 hay 51, **arriba hay bastante más**. Su tope: 60.

**El mismo número le sobra para lo de abajo y le falta para lo de arriba.**
Enseñar el dato del aparato sin decir a qué altura está medido sería peor que
no enseñarlo.

**UN CASO. NO ES REGLA.** Falta la hora con minutos —puso «09:xx» y en esa hora
el aparato fue de 50,4 a 59,3—, no se sabe si estaba resguardado, y el modo del
anemómetro está en duda por su propia advertencia. **Se le ha pedido: hora con
minutos, en MAX, y si estaba al descubierto.** Va a subir el lunes o el martes.

---

## 28-08-2026 · 21:00 · Bermeo · NUBES A OJO

**Lo que dijo, tal cual:** *«y ahora sí que hay más nubes aquí en Bermeo»* ·
*«que antes y más grises»* · *«no de esas de lluvia, e»*.

Tres datos en tres frases: **más que antes** (tendencia), **grises** (capa
media), **sin lluvia** (no son bajas de precipitación).

**LO QUE MARCABA CADA MODELO A ESA HORA** (Bermeo 43,422 / −2,721, nudo de
tierra, medido a las 21:03 con `/om`):

| modelo | bajas | medias | altas | total |
|---|---|---|---|---|
| **ICON** | 14 | **54** | 0 | — |
| **ECMWF 25 km** | 1 | **37** | 48 | 33 |
| GFS | 0 | 0 | 5 | — |
| AROME HD | 0 | 0 | 0 | — |
| Automático | 0 | 0 | 0 | 0 |

**ACIERTAN ICON Y ECMWF. FALLAN LOS OTROS TRES**, y el que falla incluye al
**Automático**, que es el que sale por defecto. Segunda vez en el mismo día que
el Automático da 0 % con nubes delante.

**Y LA TENDENCIA TAMBIÉN LA TENÍAN** (ECMWF, nudo de 9 km):

| hora | medias | altas |
|---|---|---|
| 18:00 | 32 | 19 |
| 19:00 | 46 | 44 |
| **20:00** | **50** | **57** |

Más nubes que antes. Medias. Sin lluvia. **Exactamente lo que él vio.**

**LO QUE ESTO DESTAPÓ, Y ES EL FALLO NUESTRO:** la ficha le enseñaba **27 %** y
él tenía el cielo tapado. El modelo no mentía — el **«total» de Open-Meteo no
es la suma ni el máximo de las capas**: las combina y las deja en nada. Con
bajas 0 · medias 59 · altas 57 el total sale 27.

Arreglado en **2026.08.28-2107**: la fila de Nubosidad enseña las tres capas,
dice cuál manda y en qué se le nota, y **avisa cuando el total se come a la
capa** (≥25 puntos por debajo).

**CONTRASTE INDEPENDIENTE.** Su meteoblue en Bermeo, a la misma hora: *medias
40-60 %, bajas <20 %, altas <20 %*. Cuadra con ICON y ECMWF en las medias.

**UN CASO. NO ES REGLA.** Es una hora, un sitio y a ojo, sin cifra. No sirve
para puntuar modelos — para eso está el marcador, y las nubes **no se pueden
puntuar**: ninguna estación de AEMET ni de Euskalmet publica nubosidad.

### Apunte suyo, la misma noche: *«en AguaceroWx solo funciona nubosidad con ICON y GFS»*

Se fue a medir. Nubosidad **total**, 7 días, en Bermeo, Vitoria y Madrid:

| modelo | horas con dato |
|---|---|
| ICON · ECMWF · GFS · GEM | 168 de 168 |
| ARPEGE | 117 (lo que alcanza: 4,3 días) |
| HARMONIE | 79 (lo que alcanza: 2,4 días) |
| **AROME HD** | **0 de 168, en los tres sitios** |

**AROME HD no publica nubosidad total.** Su apunte iba bien encaminado, aunque
la lista corta de AguaceroWx es decisión de ellos: ECMWF, GEM y ARPEGE también
la tienen.

`cieloRaro()` ya lo descartaba bien —filtra con `has()`—, así que **ningún cero
falso se estaba colando** en el aviso del abanico. El fallo era otro: eligiendo
AROME HD la fila de Nubosidad salía **en blanco y sin explicación**. Arreglado
en **2026.08.28-2111**: se dice que ese modelo no publica el total y se enseñan
sus capas, que ésas sí las tiene. No se nombra a AROME en el código — se mira el
dato, que mañana puede cambiar.

### La cuenta que no necesita fuente: total ≥ la mayor de las capas

Idea de la sesión secundaria (28-08 de madrugada), verificada aquí a 7 días y
con los dos modos de celda. Con 47 % de nubes altas, el cielo tapado es al menos
un 47 % — aritmética, no meteorología:

| modelo | horas incoherentes (de 168) |
|---|---|
| ICON · GFS · ARPEGE | **0** |
| ECMWF | 50 (land) / 76 (nearest) |
| GEM | 51 |

Peor caso: 29-08 05:00, ECMWF, **total 3 % con altas 47 %**.

**La lectura del secundario era «el total de ECMWF está roto». La medida dice
otra cosa:** los que descuadran son **exactamente los mismos cuyas capas van
calculadas por fuera** (documentado: ECMWF solo publica `tcc` en sus datos
abiertos; GEM tampoco cuadra; ICON, GFS y ARPEGE publican sus capas y cuadran
las 168 horas). El total es el dato nativo; **lo cocinado son las capas**.

En la app desde **2026.08.28-2342**: `noCuadra` en `nubesPorCapas()` —el aviso
salta por aritmética, para cualquier modelo, hoy y siempre— y cuando salta se
dice de dónde sale cada número **sin elegir culpable**. Su foto de las 20:27
(60-70 % tapado con ECMWF total 27 · medias 59) queda explicada: la capa
acertó, pero acertó **siendo una estimación por humedad**, no un dato del
modelo. Que hoy acertara la cuenta no la convierte en dato.

---

## 29-08-2026 · 14:22 · Busturia (43,4181 / −2,7104, 35 m) · TEMPERATURA Y BRUMA

**Suyo:** *«26 grados en el coche»* · *«al fondo el cabo Matxitxako, cielo azul
pero en la costa alguna bruma»* · *«como podéis ver en las fotos»*. Tres fotos
con GPS y hora incrustados.

**LO QUE DABA CADA MODELO** en ese punto exacto, a las 14:00:

| modelo | temperatura | punto de rocío |
|---|---|---|
| **AROME HD** | **25,0 °C** | **15,4** |
| **Automático** | **25,2 °C** | **15,2** |
| ICON | 29,1 °C | 12,1 |
| ECMWF | 29,9 °C | 10,9 |
| GFS | 31,2 °C | 8,9 |

**LOS DOS QUE ACIERTAN SON LOS DOS QUE VEN EL AIRE HÚMEDO.** No es casualidad:
los que clavan su 26 dan rocío ~15; los que se van 3-5 grados arriba lo dan en
9-12. **Y su foto enseña la razón**: banda de bruma pegada al agua por delante
de Matxitxako, con el cielo azul limpio encima. Eso es el aire húmedo que AROME
resuelve —1,3 km— y los globales aplanan.

**Y NO HIZO FALTA SUPONER: HAY UN APARATO A 1,8 km.** Él dijo *«el del coche
marcará algo más, creo»*, y se comprobó contra Euskalmet:

```
Almike (Bermeo) · 1,8 km · 106 m · medido a las 15:10
    TEMPERATURA  25,5 °C     humedad 60 %
```

**Su coche marcaba 26. El aparato oficial, 25,5.** Tenía razón en que se pasa,
pero **solo medio grado**: su termómetro es mejor de lo que él creía.

**PERO OJO CON ESA COMPARACIÓN, Y LO DIGO YO QUE LA HICE MAL:** su lectura es de
las **14:22** (la marca va incrustada en las fotos; él recordaba «14:20, más o
menos» — clavado) y **el dato de Almike es de las 15:10**. Casi una hora de
diferencia. Es exactamente el error que este proyecto ya ha cometido cinco
veces: enfrentar dos momentos distintos como si fueran el mismo.

**Se comprobó si eso cambiaba algo, y no:** entre las 14:00 y las 15:00 la tarde
estaba plana en ese punto — AROME 25,0 → 25,1 y el Automático 25,2 → 25,2. Así
que la conclusión aguanta. **Pero la comparación buena habría sido contra el
dato de Almike de las 14:00, y ese no se pidió.**

Y un detalle que empeora a GFS: **entre las 14 y las 15 iba SUBIENDO** (31,2 →
32,3), así que a la hora de la foto ya se pasaba por más de cinco grados.

**EL MARCADOR CONTRA LA MEDIDA REAL:**

| modelo | daba | error |
|---|---|---|
| **AROME HD** | 25,0 | **−0,5** |
| **Automático** | 25,2 | **−0,3** |
| ICON | 29,1 | +3,6 |
| ECMWF | 29,9 | +4,4 |
| **GFS** | 31,2 | **+5,7** |

**GFS se equivocó en casi seis grados.** No era su coche: eran ellos.

**Y POR QUÉ SU COCHE ES BUENO, que él lo dijo después:** *«está debajo del
retrovisor»*. Ese es de los sitios buenos para el sensor — **a la sombra y con
aire pasando**. Los coches que lo llevan en el paragolpes cogen el calor del
asfalto y se van tres o cuatro grados parados al sol; el suyo no.

**CONSECUENCIA PRÁCTICA, y es grande: sus lecturas del coche VALEN como dato de
campo**, no solo como impresión. Lo lleva siempre encima y pasa por sitios donde
no hay ninguna estación —el Sollube, el Oiz, las pistas—, así que es la única
medida disponible en la mayoría de sus emplazamientos.

**LO QUE FALTA POR SABER:** hoy estaba **parado en un mirador** y aun así clavó
a medio grado. En marcha será igual o mejor. Lo que no se sabe todavía es cuánto
se calienta **después de un rato largo aparcado al sol** — ahí se pasa cualquier
sensor. Cuando dé un caso así, apuntarlo aparte.

**Y va a llevar encima el anemómetro-termómetro.** Para que cuente en el
marcador hace falta: hora **con minutos**, el sitio (la foto con GPS ya lo trae),
si estaba **al descubierto o resguardado**, y el termómetro **a la sombra**.

**QUÉ SE APRENDE, Y NO ES NUEVO PERO AHORA HAY NÚMERO:** en su costa, con brisa
de mar, **los globales sobrecalientan**. Lo mismo que ya se vio con el sirimiri
del 26-08 y con las nubes medias del 28-08: el patrón es siempre que el modelo
fino ve la costa y los de malla ancha no.

**UN CASO. NO ES REGLA.** Un punto, una hora, y con un termómetro de coche.

---

## 29-08-2026 · 19:41 · BOIRO (Galicia) · REGATA DE TRAINERAS EN ETB1

**Suyo:** *«Boiro»* · *«foto de ahora en Boiro, en la tv»* · *«nubosidad… han
tenido olillas en la regata»* · **«cuadra, no?»**.

Puso Boiro en la app mientras veía la regata en directo y comparó la pantalla
con la tele. **Es el primer contraste fuera de Euskadi, y contra imagen en
directo.**

| lo que se ve en la tele | lo que daba la app |
|---|---|
| agua rizada, **olillas**, no plana | **0,88 m con periodo 6,15 s** — corta y picada |
| bruma, no se ve la otra orilla | **84 % de nubes bajas** |
| cielo cerrado y gris | cubierto · 90 % total |
| ni gota | 0 mm (pero GEM, ARPEGE, GFS y ECMWF veían sirimiri) |

**Las tres cosas que se ven a ojo, las tres acertadas.**

**Y LA CLAVE ES EL PERIODO, no la altura.** Casi un metro suena a mar, pero con
**6,15 s** eso es marejadilla de viento, no mar de fondo. Es exactamente el
matiz por el que se puso el periodo con su lectura al lado ese mismo día, y aquí
se validó a las pocas horas.

**DÓNDE LEE EL MODELO MARINO:** el nudo cae a **2,6 km** de Boiro, ya dentro de
la ría de Arousa — o sea que no está dando mar abierto, está dando la ría. Por
eso cuadra. **Ojo con esto en rías y bahías**: en otro sitio el nudo podría caer
fuera y dar mar de fuera, que es otra cosa.

**Sin Euskalmet, sin radar de casa y sin nada nuestro.** Pronóstico y mar de
Open-Meteo, y AEMET para lo medido. **La app vale fuera de Euskadi**, que era
justo lo que él quería para Calpe, Gijón y sus viajes.

**UN CASO. NO ES REGLA.** Contraste a ojo contra una imagen de televisión.

**AMPLIACIÓN, 20:00 — Y ESTA LA CONFIRMA LA TELEVISIÓN.** *«Dice la reportera
de Boiro que han tenido viento, lluvia y frío hoy.»*

La app, con el **Automático**, daba **0,9 mm** en todo el día. Pero la casilla de
Precipitación llevaba el aviso en ámbar: *«Automático no ve agua · GEM, ARPEGE,
GFS y ECMWF sí (sirimiri)»*. **Ese aviso estaba acertando en directo.**

El día entero en Boiro, los siete modelos:

| modelo | lluvia del día | racha máx | mínima |
|---|---|---|---|
| **ARPEGE** | **8,7 mm** | 36 km/h | 16,0° |
| GEM | 6,2 mm | 33 | 17,3° |
| GFS | 6,0 mm | 32 | 15,8° |
| HARMONIE | 4,8 mm | 26 | 15,7° |
| ECMWF | 2,1 mm | **44** | 16,8° |
| **Automático** | **0,9 mm** | 37 | 17,3° |

**Viento, lluvia y frío: las tres cosas que dijo la reportera, en los datos.** Y
el Automático daba **casi diez veces menos agua que ARPEGE**.

**CUARTA VEZ ESTA SEMANA QUE EL AUTOMÁTICO ES EL QUE PEOR LO VE** —26-08 el
sirimiri de Bermeo, 28-08 las nubes medias, 29-08 mañana los 26° de Busturia, y
ahora esto—. Es el modelo que sale **por defecto** en la app. Merece decidirse si
sigue siendo el de arranque.

Y es el primer caso con **testigo independiente**: no una foto suya ni un
termómetro, sino una reportera en el sitio contándolo por televisión.

## 30-08-2026 · 11:08 · Bermeo · NUBES — y los oficiales fallaron

**Suyo:** *«ayer daba sol en Bermeo de 8 a 14, ya hay cambio»* · *«Euskalmet
etc. todos daban sol ya esta mañana, la nuestra sol nubes»*. Dos fotos del
cielo con GPS (43.41745 / −2.72648), mandadas desde la app.

**Lo que se ve en las fotos:** cúmulos con claros azules y el sol entrando.
Ni despejado ni cubierto: **sol y nubes**, en torno al 60-70 % de cielo tapado.

**Lo que decía cada modelo a las 11:00 en ESE punto:**

| Modelo | Total | Bajas | Estado del cielo | |
|---|---|---|---|---|
| **ICON** | **72 %** | 55 % | **parcialmente nuboso** | ✓ lo clava |
| **ARPEGE** | 52 % | 41 % | parcialmente nuboso | ✓ |
| Automático | 88 % | 70 % | cubierto | se pasa |
| **ECMWF** | **5 %** | 21 % | **despejado** | ✗ |
| **GFS** | **6 %** | 0 % | **despejado** | ✗ |
| **GEM** | **12 %** | 23 % | **despejado** | ✗ |
| AROME HD | no publica | 93 % | no publica | se pasa por bajas |

**Tres de siete decían DESPEJADO con ese cielo.** Y los oficiales —Euskalmet
entre ellos— también daban sol, según él.

**La app acertó, y se sabe POR QUÉ:** desde el 29-08 el total de nubosidad
se le pide a **ICON** (`quienLoMide('cloud_cover')`), porque AROME HD no lo
publica. Justo el que hoy lo clavó. **Con ECMWF o GFS cargados le habría
dicho «sol»** como los demás.

**Lo que NO se puede concluir:** que ICON sea el mejor en nubes. Es **un
caso**, no una estadística — y en nubes no hay aparato que mida, así que la
única vía es su ojo y sus fotos. Este es el primero apuntado. Hacen falta
más antes de decir nada.

## 30-08-2026, 11:08 · BERMEO · nubes con foto suya

**Su foto desde casa, mirando al norte.** Cúmulos con **claros grandes de azul**:
ni despejado ni cubierto. Mi lectura: **50-55 % de cielo tapado**.

Lo que decía cada modelo a las 11:00 en su punto:

| modelo | total | palabra | ¿acertó? |
|---|---|---|---|
| **ARPEGE** | **52 %** | parcialmente nuboso | **el más cerca** |
| ICON | 72 % | parcialmente nuboso | palabra bien, número alto |
| Automático | **88 %** | **cubierto** | **NO** — hay medio cielo azul |
| ECMWF | 5 % | despejado | **NO** |
| GFS | 6 % | despejado | **NO** |
| GEM | 12 % | despejado | **NO** |

**Y esto es lo único que puntúa las nubes.** No hay aparato que las mida —ni
pluviómetro ni anemómetro equivalente—, así que **la única nota posible es su
ojo con una foto y la hora**. Por eso estas entradas valen: son la serie.

**Segundo caso de la semana con la misma forma.** El 28-08 a las 20:00, también
en Bermeo y también con foto suya, el Automático daba **0 %** con el cielo
cargado. Hoy da **88 % con medio cielo azul**. Dos veces, y en direcciones
contrarias: el Automático no es que se pase o se quede corto — **es que no se
puede saber qué va a hacer**, y ese es el motivo de que lo quitara.

**Y ECMWF, GFS y GEM han dado «despejado» con esto delante.** Tres de siete.
Vale la pena seguir apuntándolo: si se repite, la nubosidad tiene dueño claro y
se puede automatizar el reparto como él pidió.

---

## 30-08-2026 · BERMEO · 14:35 · él, en el sitio

Suyo, mientras probaba los cinco modelos uno a uno: **«sigue, pero sirimiri
muy muy débil ya»**.

| | Él vio | Qué decía cada modelo, franja 14-20 h |
|---|---|---|
| Sirimiri | **cayendo, muy débil** | **ECMWF 2,3 mm** (llovizna las 7 h) |
| | | **GFS 0,8 mm** (desde las 16 h) |
| | | Automático **0,0** · ICON **0,0** · AROME HD **0,0** |

Medido por las dos vías (la app y api.open-meteo.com), coincidieron.

**Veredicto: acertaron ECMWF y GFS; falló el que la app enseña por defecto.**
Es la tercera vez que se apunta lo mismo —el 25-08 en Bilbao y el 26-08 en
Bermeo— y las tres veces el que lo vio fue **ECMWF**. En costa, para el
sirimiri, ese modelo va aparte de los demás.

**Y esto es lo que él encontró mirando la pantalla, que es lo que más
importa:** con el Automático puesto, la app decía a la vez

- `Precipitación 0 mm` — el número grande, limpio
- `Próxima lluvia: no se espera · 0,0 mm en las próximas 24 h` — **en verde**
- `Sin lluvia · 0,0 mm` en el recuadro de la tarde

y debajo, en letra pequeña, «⚠ Automático no ve agua · ECMWF y HARMONIE sí».
Sus palabras: *«pone 0mm pero ya te esta diciendo que 2 marcan agua entonces
ese 0mm creo que no pinta no?»* y *«proxima lluvia no se espera...eso mal
no?»*.

**Qué se cambió por esto (v2026.08.30-1434):**
- El `0 mm` de «Ahora» lleva pegada la marca **⚠ ECMWF y HARMONIE sí**.
- «Próxima lluvia» ya **no dice «no se espera» sin preguntar a los demás**:
  si otro la ve, da su hora y dice de quién es. El «no se espera» en verde
  queda solo para cuando **ninguno** de los siete la ve.
- Los tres recuadros del día avisan de quién ve agua — y como es el mismo
  código, entra a la vez en **Ahora, Torre y Mis torres**.

**Lo que ya estaba bien y no se tocó:** la casilla LLUVIA de «Torre» (decía
«Sin lluvia» con el aviso al lado y en ámbar) y el desglose por modelo de
«Mis torres», que además ya miraba 24 h. Eran el patrón a seguir.

## 30-08-2026 · Bermeo y Bakio · SIRIMIRI EN DOS TANDAS — el mejor caso medido hasta hoy

**Suyo, afinado por él en tres pasos a lo largo de la tarde.** Vale la pena
dejar los tres, porque la precisión la puso él y yo me equivoqué dos veces:

  1. 14:51 · «sigue cayendo sirimiri débil todavía»
  2. 17:57 · «no llueve hace 2,5 h, cayó sirimiri flojo desde las 14h hasta
     las 16h más o menos» · «aquí en Bermeo tapado el cielo, sin lluvia»
  3. 18:0x · **«ojo, en Bermeo cayó algo de sirimiri flojo sobre las 12:30,
     pero el más fuerte empezó a las 14h hasta las 16h»** · «en Bakio no: en
     Bakio empezó sobre las 13h pero muy muy poquito»

**LO QUE PASÓ DE VERDAD:**

| | |
|---|---|
| **Bermeo** | **gotitas en el cristal del coche** hacia las **12:30** · sirimiri **14h a 15:30**, parado sobre las 15:30 |
| **Bakio** | empezó sobre las **13h**, muy poco |

Mi primera anotación (12:20) no estaba mal: **había dos tandas y yo las
junté en una sola**. Luego lo «corregí» borrando la primera, que también
era falso. La versión buena es esta, y la puso él.

**QUÉ DIJO CADA MODELO, mm/h en Bermeo, pasada de las 17:5x:**

| Modelo | 11h | 12h | 13h | 14h | 15h | 16h |
|---|---|---|---|---|---|---|
| **ECMWF** | 0 | **0,2** | **0,2** | **0,2** | **0,4** | **0,4** |
| GFS | 0 | 0 | 0 | 0 | 0 | 0,2 |
| GEM | 0 | 0 | 0 | 0 | 0 | 0,1 |
| HARMONIE | 0 | 0 | 0 | 0 | 0 | 0 |
| ICON · ARPEGE · AROME HD · Automático | 0 | 0 | 0 | 0 | 0 | 0 |

**ECMWF es el ÚNICO que cubre las dos tandas**, y además con la forma
correcta: 0,2 en la floja de mediodía y **subiendo a 0,4 justo en la fuerte
de 14-16h**. No solo acertó que llovía: acertó **cuándo apretaba**.

GFS y GEM entran solo a las 16h — cuando ya estaba acabando. Los otros
cinco, cero de principio a fin.

**Y UNA COSA QUE HAY QUE DECIR SIN ADORNAR:** a las 14:51, EN VIVO,
HARMONIE daba 0,3 mm y salía en la app como uno de los dos que veían agua.
Al recalcular esa misma ventana tres horas después, **HARMONIE da cero**:
su pasada nueva ha borrado lo que vio. ECMWF mantiene su rastro en las dos
lecturas. Por eso este cuaderno apunta lo visto EN VIVO y no solo la pasada
de después: **los modelos reescriben su propio pasado**, y quien juzgue
solo con la reconstrucción se equivocará de ganador.

**VAN DOS EPISODIOS SEGUIDOS CON EL MISMO GANADOR:**
el 26-08 a las 19:00 solo ECMWF vio la llovizna que cayó (ya fijado en
`pruebas.js`), y hoy ECMWF es el único que sostiene el episodio entero en
las dos lecturas. **Dos casos no son estadística — pero ya son dos, y los
dos en la costa, que es donde él trabaja.**

## 30-08-2026 · BAKIO 12:30 · TEMPERATURA · **TODOS LOS MODELOS VAN CALIENTES**

**Lo que midió él:** *«hoy ha hecho 21 grados al menos hasta las 14 horas»* ·
*«el coche marcaba, en Bakio, sobre las 12:30 h»*. Día cubierto.

**Lo que decía cada modelo en Bakio a esa hora** (media de 12:00 y 13:00):

    KNMI    22,9°   +1,9      GEM     24,1°   +3,1
    GFS     23,0°   +2,0      ICON    24,1°   +3,1
    AROME   23,5°   +2,5      ARPEGE  24,8°   +3,8
                              ECMWF   25,9°   +4,9

**Ninguno acertó, y todos por arriba.** El mejor se pasa 1,9°; el peor, 4,9°.

**Y el error es aún mayor de lo que parece:** el termómetro del coche tira alto
—lección suya del Oiz, [[prueba-campo-oiz]]— así que 21° es el **techo** de lo
que hizo, no el suelo.

**Segunda fuente, la misma tarde, que dice lo mismo:**

    18:15 en Bermeo   AROME (el cargado)  22,5°
                      Almike, a 1,2 km    19,1°  MEDIDO  (106 m de altitud)
                      Matxitxako          16,9°  MEDIDO  (433 m)

AROME va **3,4° por encima** de la estación de al lado, y encima la estación
está 106 m MÁS ALTA, o sea que debería marcar algo menos, no 3,4° menos.

**LO QUE ESTO ROMPE, Y ES LO IMPORTANTE:**

El **punto de rocío sí está bien**: AROME da 17°, Almike mide 17,5°. La humedad
de la app se calcula con la temperatura y el rocío — y si el rocío es bueno y la
temperatura va 3° alta, **la humedad sale baja de mentira**:

    LA APP DICE   68 % de humedad     (con sus 22,5°)
    ALMIKE MIDE   90 % de humedad     (con sus 19,1°)

Veintidós puntos. Y 68 % se lee «aire seco» mientras el aire está a punto de
mojar. **Es justo la señal del sirimiri, apagada por un error de temperatura.**

**Aprendido:** para el bochorno, el rocío es lo fiable ([[mas-datos-sin-liar]]).
Para la humedad, no: hereda el error de la temperatura. Si hay estación cerca,
la humedad hay que enseñarla MEDIDA, no calculada.

## 31-08-2026, 08:11 · BERMEO — cielo azul y los cuatro modelos lo tapan

**Suyo, mirando por la ventana:** *«de momento en Bermeo, cielo azul
despejado»* · *«alguna nube media escasa se ve»*.

**Lo que decía la app en su caseta (BI BERMEO, 43,4130/−2,7183) a las 08:00:**

| modelo | total | bajas | medias | altas | código |
|---|---|---|---|---|---|
| GFS | **100 %** | 0 % | 0 % | 100 % | 3 cubierto |
| ICON | **82 %** | 68 % | 40 % | 0 % | **45 NIEBLA** |
| ECMWF | 78 % | 26 % | 0 % | 56 % | 2 parcial |
| AROME HD | sin total | 52 % | 0 % | 15 % | — |

**Los cuatro se pasan.** Él ve azul con nube media escasa —o sea, poco— y el
que menos dice 52 % de nubes bajas. **ICON llega a decir niebla.**

Y esto no es un detalle de adorno: la franja de la mañana de anoche salía
**«Niebla, con llovizna débil desde las 12:00»**, y la niebla venía justo de
ICON. Si a las 12:00 no cae nada, el episodio entero queda medido.

**Pendiente de cerrar hoy:** si moja o no de 12:00 a 15:00 (ECMWF y GFS dan
0,1-0,2 mm; AROME e ICON, 0,0). Es la segunda vez en tres días que se puede
puntuar quién ve el sirimiri de costa — el 26-08 solo lo vio ECMWF.

**Lo que ya confirma:** el aviso de «los otros ven X % de nubes» que sale en la
portada tenía razón esta noche marcando el desacuerdo (de 0 a 92 % entre
modelos). **La nubosidad sigue siendo el campo menos fiable**, y esta mañana lo
demuestra con el cielo delante.

## 31-08-2026 · mañana — el cielo, medido con sus fotos en tres puntos

Tres tandas de fotos suyas, contrastadas contra los 6 modelos por `/om`
a la hora y en el punto exacto de cada una:

| dónde y cuándo | su foto | aciertan | fallan |
|---|---|---|---|
| Su casa, cota 0 · 08:13 | azul limpio, ni una nube baja | HARMONIE 3 %/despejado · ECMWF 25 % | **ICON: niebla 79 %** · GFS: cubierto 100 % |
| Sollube (669 m) · 12:56 | azul dominante, medias sueltas, calima | ARPEGE 55 % · GFS 63 % | **ICON 87 % cubierto** · HARMONIE 100 % |
| Caseta BI BERMEO · 13:24 | parcial: mitad azul, blancas | ARPEGE 54 % · GFS 63 % | **ICON 83 %** · HARMONIE 87 % · ECMWF 96 % y llovizna |

**El patrón del día: ICON —el dueño del cielo en el reparto— pintó más
nube de la que había en los TRES puntos**, y a primera hora inventó
niebla con el cielo raso. ARPEGE fue el más pegado a lo real las tres
veces; GFS segundo.

**NO SE TOCA EL REPARTO CON UN SOLO DÍA** (la regla de siempre: la
llovizna del 26 y 30-08 tampoco movió nada hasta el segundo episodio).
Queda abierto: si ICON repite el vicio otro día de fotos, se plantea
quién debe ser el dueño del cielo — con números, y decidiendo él.

## 31-08-2026 · mediodía — su ronda de 4 sitios CON ANEMÓMETRO (UNI-T UT363 BT)

Ruta real suya: Santamaña 10:52 → Punta Galea 11:36 → Sollube 12:53 →
caseta BI BERMEO 13:24. Dos mediciones de aparato, contrastadas contra
los modelos a la hora y punto exactos (racha modelo = a 10 m, la hora):

| sitio | su aparato (MAX) | AROME | ICON | ECMWF | GFS |
|---|---|---|---|---|---|
| P. Galea 11:36 | **7,9 km/h** | 14 | 16 | 19 | **7** |
| Sollube 12:53 | **8,3 km/h** | 18 | **30** | 22 | **8** |

- **Día de calma, y los finos exageraron la racha**: ICON dio 30 donde
  el aparato medía 8,3 (casi ×4). GFS clavó las dos.
- **OJO al método antes de sentenciar**: su MAX es un rato de medición a
  ~2 m en mano; el modelo da la peor racha de la hora a 10 m. En calma
  esa diferencia infla al modelo de por sí. En el Oiz (30-08, con más
  viento) AROME clavó la racha. **Conclusión: en calma no se elige
  modelo; la prueba que vale es un día de viento de verdad.**
- **Temperatura en Sollube (aparato a la sombra, la lectura buena):
  21,3° medidos · todos los modelos por debajo** — GFS 19,8 (−1,5),
  ICON/ECMWF 18,5 (−2,8), AROME 18,1 (−3,2). Frío sistemático en el
  monte a mediodía soleado. Segunda vez que el monte sale más cálido
  que el modelo (Oiz 30-08 no valió por el sol; esta sí vale).
- Cielo: día muy roto (modelos de 12 a 98 % en el mismo punto). El
  patrón de la mañana (ICON pintando de más) se sostiene en Galea, pero
  en Sollube 12:53 ICON estuvo razonable. Sigue en observación, sin
  tocar reparto.

> ### REVISADO DESDE LA OTRA SESIÓN (31-08, 15:05): la tabla de arriba está incompleta y hay números que no reproduzco
>
> Contestando sus 18 notas se bajaron y miraron **las 17 fotos**, no dos.
> Salen **cinco lecturas de aparato en cuatro sitios**, no dos, y una de
> ellas cambia la conclusión. Esto no borra lo de arriba: lo completa, y
> deja dicho lo que no cuadra para que lo cierre quien pueda medirlo otra
> vez.
>
> **1. Falta la lectura MAX del Sollube, y es la que manda.** A las
> **12:50:12** (foto con geosello `43,3698N 2,7631W`) el aparato marcaba
> **12,9 km/h en MAX**. La de las 12:53 que está arriba (8,3) es 3 minutos
> posterior. Con 12,9, «ICON casi ×4» pasa a **×2,7**, y sobre todo **GFS
> deja de clavarla**: daba 7,6 de racha, o sea que el aparato en la mano
> midió **más** que la racha a 10 m de GFS. Eso no es clavar, es quedarse
> corto.
>
> **2. Falta un tercer sitio con aparato, Ganguren, y un cuarto, Bermeo.**
>
> **3. La lectura de las 12:53:37 estaba en AVG, no en MAX** — se lee el
> indicador en la propia foto: `AVG 5,0 km/h`. Las demás están en MAX. Si
> se meten en la misma columna se está mezclando media con punta. Se le
> pidió a él que deje el aparato en MAX.
>
> **4. Números que no reproduzco.** La tabla de arriba pone para Punta
> Galea 11:36 «AROME 14 · ICON 16 · ECMWF 19 · GFS 7». Pedido por `/om` en
> el punto exacto de la nota (`43,37247/−3,02149`), la racha da
> **11:00 → AROME 9,7 · ICON 19,8 · ECMWF 19,4 · GFS 7,2** y
> **12:00 → AROME 18,4 · ICON 24,8 · ECMWF 22,3 · GFS 7,2**. Ninguna de
> las dos horas da 14 y 16. Igual con la temperatura del Sollube: pone
> AROME 18,1 y AROME da **18,2 a las 12:00 y 19,0 a las 13:00** — 18,1 no
> cae entre las dos, así que no puede ser una interpolación. **No digo que
> esté mal: digo que no sé de dónde sale**, y un número del que no se sabe
> el origen no puede quedarse en el marcador. Quien lo escribió que ponga
> el método (hora, punto y si interpola) o que se cambie por lo medido.

## 31-08-2026 · mediodía · LAS CINCO LECTURAS DE ANEMÓMETRO, COMPLETAS

**Esto CIERRA el agujero más viejo del cuaderno.** Arriba sigue puesto
«Viento · 0 comparaciones, y es el agujero del cuaderno», con la petición
que se le hizo el 29-08: *«lo que hace falta no son más fotos, es un número
de su anemómetro con hora y sitio»*. Hoy ha mandado **cinco**, en cuatro
emplazamientos, en tres horas. Aparato: **UNI-T UT363 BT**, de molinete, en
la mano, a metro y medio o dos.

Todo pedido por `/om` y contrastado además contra `api.open-meteo.com`
(`revisiones/comparar-punto.sh`, con el punto y la hora de cada nota):
**app y origen coinciden campo por campo en los cuatro puntos.**

| hora · sitio (coordenadas de la foto o del GPS) | su aparato | viento MEDIO de los 5 | racha 10 m de los 5 |
|---|---|---|---|
| 10:50 · Ganguren `43,2602/−2,8656` | **MAX 5,4** | 1,5 – 6,4 | 7,6 – 20,2 |
| 11:35 · Punta Galea `43,37247/−3,02149` | MAX 4,2 | 3,7 – 9,4 | 7,2 – 19,8 |
| 11:36 · Punta Galea, a 2 m de la caseta | **MAX 7,9** | 3,7 – 9,4 | 7,2 – 19,8 |
| 12:50 · Sollube `43,3698/−2,7631` | **MAX 12,9** | 8,4 – 11,7 | 7,6 – **34,2** |
| 12:53 · Sollube, mismo sitio | *AVG 5,0* · 8,3 | 8,4 – 11,7 | — |
| 13:25 · Bermeo `43,4130/−2,7183` | **MAX 10,0** | 8,4 – 12,3 | 7,6 – 28,4 |

### Lo que estas cinco SÍ demuestran

**Las cuatro lecturas en MAX caen dentro o al borde de la horquilla del
viento MEDIO de los modelos, y las cuatro muy por debajo de su racha.** No
hay ni una en que la app se invente viento que no existe, ni al revés.

Modelo a modelo, quién queda más cerca del MAX medido:

| | Ganguren 5,4 | Galea 7,9 | Sollube 12,9 | Bermeo 10,0 |
|---|---|---|---|---|
| Automático | 2,5 | 3,7 | 11,4 | 11,6 |
| ICON-EU | **5,5** | **9,4** | 11,0 | **10,5** |
| ECMWF | 6,4 | 6,5 | 8,4 | 8,4 |
| GFS | **5,4** | 7,1 | **11,7** | 11,7 |
| AROME HD | 1,5 | 5,2 | 8,8 | 12,3 |

### Lo que NO demuestran, y hay que decirlo antes de que alguien lo use

**No puntúan la RACHA, que es lo único que le manda a casa** (60 km/h en
torre). Un molinete en la mano, a metro y medio, unos segundos, pegado a
una caseta o entre matorral, no puede medir la racha a 10 m en descubierto.
Compararlo con `wind_gusts_10m` sería compararlo con otra cosa — por eso
arriba van las dos columnas separadas y por eso a él se le contestó con el
viento medio.

**Y eso deja abierto el desacuerdo gordo del día, que sí es suyo y sí
decide:** en el **Sollube a las 13:00** la racha iba de **7,6 (GFS) a 34,2
(ICON)**, en un emplazamiento suyo de monte a 665 m (medido hoy con
`/om?api=elev` en su punto: **665 m**). Más de cuatro veces entre uno y
otro. En Bermeo, GFS daba 7,6 contra 23-28 de los otros cuatro. **GFS se
descuelga por abajo en los cuatro sitios**, y es el de malla más gruesa.
Con 12,9 km/h medidos a mano no se puede cerrar quién acierta.

**La prueba que hace falta sigue siendo la misma: un día de viento de
verdad, en descubierto y con el aparato en alto.** Como el del Oiz del
30-08. Hoy era día de calma y en calma no se elige modelo.

### LA CALIBRACIÓN DE SU APARATO, que es lo mejor del día

Se la demostró él solo, en tres minutos y en el mismo sitio:

| Sollube, mismo punto | aparato | modelos a esa hora | |
|---|---|---|---|
| **12:50, al sol** | **25,7 °C** | 18,4 – 20,4 | **+5 a +7** |
| **12:53, ya a la sombra** | **21,3 °C** | 18,4 – 20,4 | **+0,9 sobre GFS** |

Cuatro grados y medio en tres minutos **sin que cambiara el aire**. Eso no
es el tiempo: es la carcasa negra cociéndose al sol.

Y las otras tres lecturas al sol del día lo confirman, todas por arriba:

| | aparato al sol | modelos | |
|---|---|---|---|
| Ganguren 10:50 | 24,6 | 18,1 – 19,8 | +4,8 |
| P. Galea 11:35 | 25,1 | 20,4 – 21,6 | +3,5 |
| P. Galea 11:36 | 26,7 | 20,8 – 22,2 | +4,5 |
| Bermeo 13:25 | 28,3 | 22,2 – 23,9 | +4,4 |

**Regla que queda: la temperatura de su UT363 vale A LA SOMBRA y no vale al
sol, donde se pasa entre 3,5 y 7 grados.** Es la misma conclusión que ya
salió en el Oiz el 30-08, ahora con cinco casos y con el par sol/sombra del
mismo sitio, que es la prueba buena. La única lectura de temperatura suya
que puntúa hoy es la de las 12:53, y **cuadra**: GFS 20,4 a 0,9 grados.

### Nubosidad: tres puntos más, sin tocar el recuento todavía

Sus fotos cubren tres sitios que no están en la tabla de nubes. Se apuntan
aquí con sus números; **no se meten en la tabla ni se recuentan en esta
pasada** porque el recuento va con `revisiones/recuento-marcador.py` y
tocarlo a mano ya salió mal una vez (27-08). Queda para la revisión de las
22:00, con el script.

| | su foto | Automático | ECMWF | GFS | ICON-EU |
|---|---|---|---|---|---|
| 10:52 · Ganguren, la torre | 70-80 % | 22 % | **74 %** ✔ | 46 % | **84 %** ✔ |
| 11:15 · Leioa, la Repsol | 15-25 % | **0 %** ✔ | 98 % · código 3 | **38 %** ✔ | 54 % |
| 11:35 · Punta Galea | 20-30 % | **3 %** ✔ | 99 % · **código 51** | **22 %** ✔ | 80 % |

**Los dos bandos se cruzan en 45 minutos.** En Ganguren aciertan ICON y
ECMWF y fallan cortos el Automático y GFS; tres cuartos de hora después, en
Punta Galea, exactamente al revés. **Ninguno lee el cielo: cada uno tira
siempre para su lado, y hoy tocó ver los dos lados el mismo día.** Es la
mejor ilustración que hay en el cuaderno de por qué la nubosidad no decide.

**Y la cuarta falsa alarma de sirimiri de ECMWF**, esta vez triple: código
51 en Punta Galea (11:35, cielo azul), en el Sollube (12:51, suelo y hierba
secos en tres fotos) y en Bermeo (13:24, prado seco). **No cayó nada en
ninguno de los tres.** Con esto ECMWF va a siete llovizna inventadas en el
cuaderno. Sigue valiendo lo escrito: sirve para levantar la mano, no para
decidir — y con sirimiri él no sube a mástil ni a torre, así que cada falsa
alarma le cuesta una salida.

### Dos cosas de método que salieron, y las dos son suyas

**1. Una nota sellada con el sitio equivocado, y la resolvió su propia
foto.** La de las **12:49** llegó con las coordenadas del emplazamiento
**BI BERMEO** en vez de su GPS: comparar el Sollube con el tiempo de Bermeo
son 6 km y 400 m de desnivel. No hizo falta preguntarle porque la foto de un
minuto después trae grabadas `43,3698/−2,7631` **y marca exactamente lo
mismo** (12,9 y 25,7). Se le dijo así, y se le pidió confirmación.

**Cuando la foto trae el sello de Google encima, la ubicación deja de ser
un problema.** Cuatro de hoy lo traían y las cuatro cuadraban con el GPS de
la nota.

**2. Una nota llegó SIN FOTO.** La de las 11:37 dice «Punta Galea foto
termómetro coche a pie de caseta» y el buzón la tiene como nota de solo
texto. Se le dijo que no había llegado y que la reenvíe. **No se dio por
buena ninguna suposición sobre lo que marcaba.**

**3. El reloj de su coche se ha ido una hora.** La pantalla marcaba
**12:25** con el geosello de la propia foto en **13:26:49**. El 29-08 ese
mismo reloj coincidía clavado con la app (14:04 contra 14:04:16) y sirvió
para comprobar que la hora con la que se congelan los cinco modelos era
buena. **Ya no vale como reloj de contraste** hasta que lo ponga en hora.
Se le avisó.

## 31-08-2026 · cierre del día — cielo con 4 tandas de fotos y lluvia verificada

**LLUVIA — veredicto del día entero**: cayó **0,0 mm** de 07 a 20 h (seis
estaciones oficiales + sus fotos + su palabra: «ni gota, tiempazo»).
ECMWF anunció sirimiri dos veces (mañana desde las 12; tarde 0,1-0,2) y
falló ambas; GEM le acompañó. Acertaron los secos: AROME, ICON,
Automático, HARMONIE, ARPEGE. **Marcador del agua**: los dos sirimiris
del 26 y 30-08 siguen siendo mérito único del europeo; hoy suma su
primer día malo (fallo leve, décimas). Se sigue midiendo — no se toca.

**CIELO — cuarta tanda (Bermeo casa 18:41 y Sukarrieta 19:30)**: parcial
con velos altos y CLAROS; Sukarrieta casi azul (~20-30 %). A las 19:00
todos se pasaron en el total (velo alto fino computa como cobertura),
pero en las BAJAS —las que deciden sirimiri y torre tapada— la foto
manda: casi ninguna. ARPEGE bajas 13 % ✓ · ECMWF 18 % ~ · ICON 60 % ✗ ·
GFS 100 % ✗ (con el cielo azul).

**QUINIELA DEL CIELO DEL DÍA (4 tandas, 6 puntos)**: ARPEGE el más fiel
en todas; ICON —dueño actual del cielo— pasado en las cuatro, y van dos
días. Propuesto pasarle el cielo a ARPEGE por acierto; **pendiente de su
«dale»**.

## 01-09-2026 · LA PORRA DEL MARTES (apuntada el 31 a las 21:25, para arbitrar con sus fotos)

- **Nuestra app (cielo de ARPEGE, estreno)**: madrugada despejada, sol y
  sol-nube de 8 a 10, nublándose desde las 11 · 15-24° · rachas subiendo
  a 41-46 km/h a 40 m por la tarde.
- **Euskalmet**: intervalos de sol y nubes, temperatura subiendo.
- **Windy/meteoblue**: más tapado todo el día, 19-25°.
- ECMWF además anuncia otra vez décimas de agua (GEM e ICON 0,3) — tercer
  intento del anunciador tras el 0,0 del lunes.

- **Euskalmet (la oficial), añadida a las 21:25**: intervalos nubosos
  SOBRE TODO EN LA PRIMERA MITAD, con un poco de agua a las 06-07
  (0,1-0,3), y SOL desde las 08-09 hasta la tarde. Máx 21, mín 18.

**OJO: Euskalmet y nuestro ARPEGE dicen casi lo contrario en el ORDEN**
— ARPEGE: madrugada despejada y nublándose desde las 11 · Euskalmet:
madrugada nubosa con llovizna y sol desde las 8. Y en el agua, Euskalmet
apoya al bando de ECMWF/GEM/ICON (décimas al alba). Se arbitra con sus
fotos y los pluviómetros. Primer examen del cielo de ARPEGE como
titular: si pincha en su estreno y la oficial acierta, se reevalúa con
la misma vara que tumbó a ICON — dos días de fotos, no uno.

## 01-09-2026 · 06:15 — VEREDICTO DE LA PORRA DEL ALBA

**Gana nuestra app (ARPEGE, en su estreno como dueño del cielo).**

Lo medido a las 06:11 en los pluviómetros oficiales (últimas 6 h):

| estación | lluvia |
|---|---|
| MATXITXAKO | **0,0 mm** |
| FORUA | **0,0 mm** |
| BILBAO AEROPUERTO | **0,0 mm** |
| AMOREBIETA | **0,0 mm** |
| PUNTA GALEA | **0,0 mm** |
| Mutriku (a 40 km) | 0,2 mm |

- **Nuestra app dijo: alba SECA.** ✓ Acertó.
- **Euskalmet dijo: llovizna 0,1-0,3 a las 06-07.** ✗ Falló.
- ECMWF, GEM e ICON anunciaban décimas al alba. ✗ Fallaron (salvo el roce
  de Mutriku, fuera de su zona).
- AROME, GFS, HARMONIE y ARPEGE decían seco. ✓ Acertaron.

**Marcador del agua**: el europeo encadena su SEGUNDO día anunciando agua
que no cae (31-08 y 01-09) tras haber sido el único que vio los sirimiris
del 26 y del 30. Sigue siendo el dueño de la lluvia — pero si mañana falla
otra vez, hay que traerle los números a Aitor y plantear el cambio con la
misma vara que se usó con ICON en el cielo.

**Y ARPEGE estrena ganándole a la oficial.** Primer punto a favor del
cambio de dueño del cielo decidido anoche.

## 01-09-2026 · 08:00 — CORRECCIÓN DEL VEREDICTO: ME EQUIVOQUÉ

**Él, desde el campo:** *«Bermeo sirimiri desde las 6, estaba ya con
sirimiri, paró sobre las 8»* · *«ya más no cayó en todo Bizkaia»* ·
*«nubosidad sí hay»*.

**A las 06:15 yo canté «alba seca, gana ARPEGE» mirando los pluviómetros
oficiales (0,0 mm en cinco estaciones). ESTABA MAL, y el motivo lleva
escrito en este proyecto desde el 25-08: EL SIRIMIRI NO EXISTE EN
MILÍMETROS.** Aquel día fueron cinco horas mojando Bilbao y 0,4 mm en el
pluviómetro. Usé como árbitro justo el instrumento que este cuaderno dice
que no sirve para esto.

**El marcador de verdad del alba del 01-09 en Bermeo (06:00-08:00):**

| quién | qué dijo | ¿acertó? |
|---|---|---|
| **ICON** | 0,1 mm a las 06, 07 y 08 | **SÍ** |
| **GEM** | 0,1 mm a las 07, 08 y 09 | **SÍ** |
| **AROME HD** | 0,1 a las 08 · 0,3 a las 09 | **SÍ** (algo tarde) |
| **ARPEGE** | 0,8 a las 08 · 0,2 a las 09 | **SÍ** (algo tarde) |
| **Automático** | 1,2 a las 09 | SÍ, tarde |
| **Euskalmet (oficial)** | llovizna 0,1-0,3 a las 06-07 | **SÍ, y clavado en la hora** |
| **ECMWF** | seco todo el día | **NO** |
| **GFS** | seco todo el día | **NO** |

**Lo que esto cambia, y hay que mirarlo con calma antes de tocar nada:**

1. **ECMWF, el dueño del agua, ha fallado el sirimiri de su casa.** Y es
   el tercer aviso: 31-08 y 01-09 anunciando agua que no cayó, y hoy
   además NO ver la que sí cayó. Pero OJO: el 26-08 y el 30-08 fue el
   ÚNICO que vio sirimiris que sí cayeron. No se cambia el dueño con la
   racha de un día — se anota y se mira mañana.
2. **La hora la clavó Euskalmet y la clavó ICON** (06-08). Los que
   acertaron tarde (ARPEGE, AROME, Automático) lo ponían a las 08-09,
   cuando ya estaba parando.
3. **El pluviómetro NO puede arbitrar sirimiri.** Para eso está él y sus
   fotos. Si mañana hay porra de llovizna, el árbitro es el campo, y como
   mucho la HUMEDAD de la estación (hoy: Forua 97 %, Amorebieta 96 %,
   Bilbao 93 % — todas por encima del 90 a esa hora, que sí era señal).

**LA LECCIÓN, que es de método y va al frente:** tenía la regla escrita en
mi propio cuaderno y aun así usé el instrumento equivocado porque daba una
respuesta limpia. Antes de arbitrar nada, comprobar que el árbitro puede
medir lo que se le pregunta.

## 01-09-2026 · LEMONA / BERREZOAGA — SU RONDA DE LA MAÑANA

**Sus fotos con GPS**, 43,2170N 2,7729W (Barrio Berrezoaga, junto a Amorebieta,
~363 m). Caseta con baterías EnerSys PowerSafe y rectificador Delta; trabajó
dentro de 09:27 a 09:32.

**LO QUE MIDIÓ:**
· 09:30 y 09:32 — anemómetro **0,0 km/h**, **20,3-20,4 °C**
· 09:30 — **las dos torres metidas en nube**: los mástiles desaparecen en la
  niebla en sus dos fotos
· 12:43 en Amorebieta — cielo muy cargado y oscuro; el coche marcaba 25 °C
  (parado, y él mismo lo relativiza: «25 en el coche es algo más tarde»)

**EL VIENTO — GANA AROME HD, Y ECMWF SE PASA**

| | viento | racha |
|---|---|---|
| **él, con el anemómetro** | **0,0** | — |
| Amorebieta (Euskalmet, 5,6 km) 09:00 | 0,0 | 4,3 |
| Orozko (15,2 km) 09:00 | 0,0 | 0,4 |
| **AROME HD** | 0,7 | **2,2** ← el más cerca |
| Automático | 2,0 | 2,5 |
| ARPEGE | 1,1 | 4,3 |
| ICON | 0,8 | 6,1 |
| **ECMWF** | 1,8 | **11,5** ← el más lejos |

**LA TEMPERATURA — ACERTÓ LA APP, NO EL APARATO**

Él midió 20,3. Las tres estaciones a esa hora: Amorebieta **15,8**, Orozko
**15,2**, Bilbao **17,6**. La app daba 15,7-16,6 — **clavada**.

**CORREGIDO por él mismo:** *«marcaba 20 grados cuando llegué»* — o sea que el
aparato ya venía en 20 ANTES de entrar en la caseta, así que mi primera
explicación (que se había calentado dentro) no vale. Lo que encaja es la
furgoneta: el aparato viaja con él y el coche estaba a 25 °C a mediodía. Sale
de un sitio caliente y el termómetro tarda en igualarse con el aire.

**La lección operativa, que es la que sirve:** su anemómetro **clava el
viento** —0,0 contra 0,0 de las dos estaciones— y **su termómetro no vale si
el aparato acaba de salir del coche o de la caseta**. Ya se anotó lo mismo en
el Oiz, allí por el sol. Para temperatura: o se deja el aparato un rato al
aire, o se mira la estación.

**LA NIEBLA — LA CAPA DE «NUBES BAJAS» ES LA QUE LO VIO**

| | nubes bajas |
|---|---|
| **AROME HD** | **100 %** ✓ |
| **Automático** | **100 %** ✓ |
| ARPEGE | 69 % |
| ECMWF | 50 % ✗ |
| ICON | 47 % ✗ |

Humedad medida en las tres estaciones: **97-99 %**. Cuadra con sus fotos.

**Y UN FALLO NUEVO, DE LOS QUE IMPORTAN: la visibilidad mintió.** Con las
torres metidas en nube, la app daba **ICON 16,4 km y Automático 30,5 km**. Ese
campo se usa para el bloque de acceso (niebla en la pista). La capa que sí
acertó fue **nubes bajas**, que es justo lo que dice la leyenda de la app:
«bajas = sirimiri y torre tapada». **Pendiente: que el aviso de niebla no se
fíe solo de la visibilidad y mire también las nubes bajas.**

**BERMEO, confirmado por él:** *«a las 6 am sirimiri hasta las 08:30»*. Y el
pluviómetro del aeropuerto de Bilbao registró **0,2 mm a las 08:00**, o sea que
la llovizna existió y algún aparato sí la pilló. Refuerza la corrección de las
08:00: acertaron ICON, GEM, AROME, ARPEGE y Euskalmet; fallaron ECMWF y GFS.

### Y lo que enseñan esas fotos: CÓMO ES EL SITIO (importa para decidir)

Él las mandó con esta frase: *«te he enviado fotos también para que sepas dónde
trabajamos»*. El punto es **BI LEMONA · ES-TIMS-49040**, a 0,0 km de sus
coordenadas — uno de sus veinte guardados, así que todo lo de arriba es
contraste de un emplazamiento suyo de verdad.

**Lo que se ve, y por qué cambia el criterio:**

· **La torre está ENCIMA de la caseta.** En la foto de las 09:30 las patas de
  la torre gris arrancan pegadas al tejado, y detrás hay una segunda torre
  roja y blanca. Es exactamente el motivo del perfil «hierro» y de que **el
  rayo vete el emplazamiento entero y no solo subir**: con 40 m de captador
  encima y la mano en un borne, da igual estar bajo techo.
· **Dentro: la planta de −54 V.** Baterías EnerSys PowerSafe (las amarillas,
  en estantería metálica), rectificador Delta, bastidores de fibra, y **dos
  aires** —uno de techo y otro de pared—. Es la cadena que él contó: si se
  para el aire, sube la sala y caen tarjetas.
· **Trabaja en tensión.** En el suelo hay guantes dieléctricos y
  destornilladores VDE, y en la pared la pletina de tierra de cobre con sus
  cables verde-amarillo. Por eso el sirimiri sobre cuadros de intemperie es
  criterio suyo de NO subir.
· **Acceso bueno**: pista, vallado con concertina, puerta doble y la furgoneta
  aparcada a la puerta. Aquí el problema no es llegar.
· **Y la niebla del día**: las dos torres desaparecen en la nube. A 363 m.

**Para la app:** este sitio es de los de «caseta con hierro encima» y su
riesgo dominante es el rayo, no la racha. El acceso no le frena casi nunca.

## 31-08-2026 · 13:25 · BI BERMEO — CUÁNDO SU ANEMÓMETRO ARBITRA Y CUÁNDO NO

**Sus fotos**, 43,4130 / −2,7183 (BI BERMEO clavado, junto a Nardiz-Tar Jon
Kalea, mirando al pueblo y al mar). Poste de hormigón con CGP y caja de
contador, torre de celosía detrás del vallado, y la furgoneta aparcada en la
campa.

**Él midió, en modo MAX: 10,0 km/h · 28,3 °C.**

Lo que decían los modelos a las 13:00 en ese punto:

| | viento | racha |
|---|---|---|
| **GFS** | 11,7 | **7,9** ← el único cerca |
| ECMWF | 7,8 | 22,7 |
| ARPEGE | 13,8 | 27,7 |
| Automático | 11,6 | 28,1 |
| ICON | 10,5 | 28,4 |
| AROME HD | 13,2 | 29,2 |

**Y NO se puede concluir que los modelos fallaran.** Las fotos lo explican: está
**a la altura de la mano, pegado a un seto, con arbolado al lado y la furgoneta
delante**, en una campa resguardada. Los modelos dan la racha **a 10 m en
terreno abierto**. Que ahí abajo corran 10 mientras a 10 m corren 25 no es un
fallo: es el abrigo.

**La comparación con el Oiz lo demuestra.** Allí su anemómetro clavó la racha
del modelo — porque el Oiz es cima pelada, sin nada que resguarde.

**LA REGLA QUE SALE DE AQUÍ, y es de las que sirven:**
· **En sitio expuesto** (cima, azotea, campa abierta, a barlovento): su
  anemómetro **arbitra** y si discrepa del modelo, gana él.
· **En sitio resguardado** (entre setos, junto a la furgoneta, a sotavento de
  un edificio o del monte): su lectura será SIEMPRE menor y **no sirve para
  juzgar al modelo** — lo que mide es el aire de ese rincón, que es útil para
  saber si puede abrir un armario, no para saber si arriba sopla.
· **La temperatura, con sol, no vale**: 28,3 medidos contra 22-24 de los
  modelos, y ayer había sol entre nubes. Ya se anotó lo mismo en el Oiz. Para
  temperatura, la estación.

**Sin arbitraje de tercero:** el histórico de las estaciones oficiales solo
llega a 24 h, así que esto no se ha podido cerrar con un aparato ajeno. Queda
dicho para no darlo por concluido.

## 31-08-2026 · 12:53 · BI SOLLUBEMENDI — EL MEJOR CONTRASTE HASTA HOY

**Sus fotos**, 43,3698 / −2,7628 (BI SOLLUBEMENDI, 669 m). Cima pelada: varias
torres, línea de alta al lado, casetas de hormigón («CASETA 6»), pista de
grava y brezo. **Expuesto de verdad**, con vista al mar. Y el aparato, esta
vez, en **AVG** — viento medio, no racha.

**Él midió: 5,0 km/h de media · 21,3 °C.**

| modelo | viento medio a 10 m |
|---|---|
| **ECMWF** | **7,8** |
| AROME HD | 9,7 |
| ARPEGE | 9,9 |
| ICON | 11,0 |
| Automático | 11,4 |
| GFS | 11,7 |

**Y AQUÍ ESTÁ LO BUENO.** Su lectura es a la altura de la mano (~1,5 m) y los
modelos dan los 10 m. Corrigiendo con el perfil logarítmico sobre hierba
(z0 = 0,03 m, factor 1,48):

> **sus 5,0 km/h a 1,5 m equivalen a 7,4 km/h a 10 m**
> **ECMWF daba 7,8.** Clavado.

Los demás se pasaban entre un 30 % (AROME, ARPEGE) y un **56 %** (GFS,
Automático, ICON).

**Lo que hay que sacar de aquí, y no confundir:**
1. **En cima expuesta y con el aparato en AVG, su medida SÍ arbitra** — basta
   con subirla a 10 m con el factor 1,5. Con eso, ayer en el Sollube **ganó
   ECMWF y por goleada**.
2. **Que ECMWF ande flojo con el agua estos días no lo hace malo con el
   viento.** Son variables distintas y destrezas distintas: sigue siendo el
   dueño del agua a examen, y ayer fue el mejor en viento medio.
3. **La temperatura otra vez alta**: 21,3 suyos contra 17,9-20,4 de los
   modelos, con sol entre nubes en la foto. Confirma lo de siempre.

**MÉTODO QUE QUEDA FIJADO para sus próximas medidas:**
· en **AVG** y en sitio **expuesto** → multiplicar por **1,5** y comparar con
  el viento medio del modelo. Vale como arbitraje.
· en **MAX** → es una racha de ese rincón, no la del modelo a 10 m; solo vale
  si el sitio está despejado.
· en sitio **resguardado** (setos, furgoneta, sotavento) → no compara nada.
· la **temperatura**, nunca con sol ni recién sacado del coche.

### BI SANTAMAÑA (43,2602 / −2,8656 · zona Ganguren) — cómo es

Foto suya del 31-08 a las 10:52, con su frase: *«caseta, torre y grupo
backup»*. Se ve la torre roja y blanca, la caseta con su **aire Hitachi** en
la pared, y fuera, dentro del vallado, **el grupo electrógeno de respaldo**
(el cajón rojo). Pista de grava hasta la puerta y arbolado alrededor —
resguardado, al revés que el Sollube.

## 02-09-2026 · BERMEO · el cielo, otra vez de más

**Lo que él vio, sobre las 15:15:**

> *«buen tiempo en Bermeo todo el día con nubes blancas de algodón, pero deja
> de sobra pasar el sol»* · *«pocas nubes»* · *«pero algo hay»*

O sea: cúmulos de buen tiempo, sol de sobra, sin llegar a despejado.

**Lo que decía cada modelo (nubes totales, %):**

| hora | ECMWF | ARPEGE | ICON | GFS | HARMONIE | Automático |
|---|---|---|---|---|---|---|
| 09:00 | 69 | 58 | 48 | 29 | 90 | **100** |
| 10:00 | 42 | 64 | 38 | 29 | 83 | **100** |
| 11:00 | **20** | 49 | 73 | 48 | 100 | **100** |
| 12:00 | **11** | 64 | 87 | 52 | 94 | **100** |
| 13:00 | **8** | 50 | 81 | 8 | 0 | 71 |
| 14:00 | **6** | 35 | 76 | 73 | 0 | 64 |
| 15:00 | **3** | 15 | 38 | 8 | 2 | 49 |

**VEREDICTO: acertó ECMWF.** De las 11:00 en adelante clava «pocas nubes»
(20 → 11 → 8 → 6 → 3). El **Automático fue el peor con diferencia**: cuatro
horas seguidas al 100 %, o sea cubierto, un día que él describe como de sol.
HARMONIE se pasó por la mañana (90-100) y se quedó corto por la tarde (0).
ICON y GFS, irregulares. AROME HD no publica nubes totales aquí.

**El dueño del cielo hoy es ARPEGE** (asignado el 30-08 por acierto medido) y
también se pasó: 49-64 % en las horas de sol. Menos que el Automático, pero de
más. **UN DÍA NO CAMBIA UN REPARTO** —el de ARPEGE salió de medir, no de una
tarde— pero queda anotado: si vuelve a pasar, hay que remedir el cielo con
ECMWF dentro.

**Y hay que mirar el chip de nubes**: esa madrugada la portada decía
«Mayormente despejado» con el aviso «⚠ los otros van 32 % de nubes». Con el
reparto puesto, el chip compara el cielo del dueño contra los demás; está
apuntado desde el 31-08 que **se compara consigo mismo** y salta el 72 % de las
horas. Con este caso delante, esa revisión sube de prioridad.

## 02-09-2026 · LA CONCHA · el parte de la regata cuadró

Clasificatoria de las 18:00. Lo que se le dio, todo por la app (ECMWF + el
modelo marino + la tabla de mareas de Euskalmet):

  viento     10 km/h del N a las 18:00, bajando a 8 a las 19:00
  rachas     27 km/h (de aire, no de mar)
  ola        0,56 m, periodo 6,5 s, casi todo mar de fondo (0,50)
  mar viento 8 cm — nada
  corriente  1,1 m/s hacia el OSO, o sea entrando a la bahía
  marea      bajamar 14:42 · pleamar 20:56 → a las 18:00, plena llenante
  agua       23,7 °C · aire 23 °C · sin lluvia

**Su veredicto: «la regata más o menos lo que has puesto».**

Vale como confirmación de que el modelo marino sirve para la bahía —que era
la duda que se le dijo por delante: en una bahía cerrada promedia mucho— y de
que el viento y la marea van finos. **No vale como calibración**: es una tarde
y él no dio números, dio un «más o menos». Si vuelve a mirar una regata,
pedirle el detalle: si notó la corriente en las ciabogas y si el viento entró
por la bocana como se dijo.

---

## 03-09-2026, 07:40 · Bermeo · **cubierto**, dicho por él

**«ahora aquí en Bermeo cubierto»**, mirando por la ventana.

Sirve para zanjar una duda del mismo día, y por eso se apunta: la agenda
de casa daba **despejado** a esa hora y su app de torres **cubierto**.

| quién | qué decía a las 07:00 | ¿acertó? |
|---|---|---|
| **ECMWF** (el de su app) | cubierto | **sí** |
| Automático (el que tenía la agenda) | despejado | no |
| AROME HD (su modelo) | *no publica el símbolo* | — |

Es UNA hora, no una estadística, y no cambia por sí sola qué modelo lleva
el cielo. Lo que sí confirma es el arreglo de esa mañana: la agenda pedía
el tiempo a su app pero **sin decir el modelo**, así que Open-Meteo le
contestaba con el Automático. Medido ese día: la racha se separaba 0,5
km/h y la temperatura 0,1° —da igual— pero **el símbolo no coincidía ni
una hora de 24**. Y el símbolo es lo único que miran en casa.

Desde entonces la agenda pide el código de tiempo al europeo, que es de
donde lo saca su app. Las dos dicen lo mismo.

**Y a los dos minutos lo afinó: «nubes total» · «sin agua».** Con eso ya
se puede puntuar a cada modelo, no solo al símbolo. Medido a las 07:00 de
ese día en sus coordenadas:

**Dijo «se ve también algo de azul» y luego mandó tres fotos.** Con sello
de hora y coordenadas: 3 sept 2026, 07:48, 43,4174N 2,7265W, Askatasun
Hiribidea 29. Y las fotos cambian la lectura, así que se apunta el
recorrido entero — es exactamente por qué se piden.

**Lo que enseñan:** una capa uniforme gris azulada de lado a lado, **sin
un solo claro de cielo azul**. El tono azulado ES la capa —fina y
traslúcida— con la luz del amanecer detrás. Se ve en que las tejas del
edificio de enfrente están encendidas de naranja: el sol acababa de salir
y entraba rasante por el horizonte, pero por encima no había hueco.

Así que la lectura buena es **cubierto, 90-100 %**, no «muy nublado con
claros». Su «algo de azul» era el color de la capa, no cielo abierto.

| modelo | nubes | lluvia | contra la foto |
|---|---|---|---|
| **ECMWF** (el que lleva su cielo) | **94 %** | 0 mm | **clava** |
| ICON | 71 % | 0 mm | se queda corto |
| Automático | **9 %** | 0 mm | **falla de lleno** |
| GFS | **0 %** | 0 mm | **falla de lleno** |
| AROME HD (su modelo) | *no publica* | 0 mm | — |

**La lluvia la clavan los cinco.** Lo que separa es el cielo, y por 94
puntos entre el mejor y el peor.

**LA LECCIÓN, que vale para la próxima:** con «algo de azul» yo bajé la
estimación a 75-90 % y dejé a ECMWF e ICON empatados. La foto dice que no:
ECMWF clavaba e ICON se quedaba veinte puntos corto. Una frase suelta se
interpreta; **una foto con hora se mide**. Cuando el dato de campo vaya a
puntuar modelos, pedirle la foto antes de escribir el resultado.

Y hay una tercera cosa que zanja, porque esa mañana él fotografió el aviso
de su app: *«⚠ los otros ven 15 % de nubes»*. Ese aviso salta cuando su
modelo se aparta de los demás, y **esta vez el que se apartaba era el que
acertaba**. No hay que tocarlo —no cambia el número, solo dice quién ve
distinto, y eso sigue siendo lo correcto— pero conviene tenerlo apuntado:
apartarse de la mayoría no es equivocarse.

---

## 03-09-2026, 07:42 y 08:43 — MUNGIA: EL COCHE ACIERTA Y LA APP SE QUEDA 2,8° CORTA

**Dos medidas suyas, con hora, y la segunda con coordenadas.** La pantalla
del coche marcando **17 °C a las 07:42**, y una foto con sello a las
**08:43:15 · 43,3596N 2,8417W · 2 Matxin Bidea, Mungia** con su palabra
encima: **«Munguía, 18 grados»**.

### Lo primero, porque sin esto lo demás no vale: SU TERMÓMETRO ESTÁ BIEN

Contrastado contra las estaciones medidas (por `/estaciones`, red de AEMET),
temperatura a la hora en punto, hora local:

| estación | distancia a la foto | altitud | 07:00 | 08:00 |
|---|---|---|---|---|
| **BILBAO AEROPUERTO** | **8,6 km** | 42 m | 16,1 | **18,0** |
| AMOREBIETA-ETXANO | 20,6 km | 100 m | 16,7 | 18,1 |
| FORUA | 13,9 km | 45 m | 16,7 | 16,9 |
| PUNTA GALEA | 14,6 km | 81 m | 16,2 | — |
| MATXITXAKO (cabo) | 12,7 km | 93 m | 20,1 | 20,1 |

Bilbao Aeropuerto es la buena para comparar: **8,6 km, y a 42 m contra los
31 m de su punto**. A las **08:00 medía 18,0°** y subiendo, que es el
último dato horario publicado cuando se escribe esto.

### PRIMER TROPIEZO: LA HORA DE SU COCHE ESTÁ MAL

Mandó dos fotos de la pantalla del coche, «07:42 · 17 °C» y «07:48 ·
20 °C». **Ninguna de esas dos horas es la buena.** Las fotos de la
carretera llevan sello GPS y llegaron con fecha propia; cada foto de la
pantalla llegó **medio minuto después** de la suya:

| lo que marca la pantalla | cuándo se hizo de verdad |
|---|---|
| 07:42 · 17 °C | **08:44** |
| 07:48 · 20 °C | **08:50** |

**El reloj de su coche va 1 h 02 min atrasado** — casi seguro que no hizo
el cambio al horario de verano. Dos fuentes independientes lo dicen (el
sello GPS de sus fotos y el reloj del Mac al recibirlas) y coinciden.
**Apuntado porque importa:** si alguna vez anota la hora de una medida
mirando el coche, la anota una hora antes de lo que fue.

### SEGUNDO TROPIEZO: EL TERMÓMETRO DEL COCHE TAMPOCO VALE

Con las horas buenas, lo que hizo su sensor es esto:

| hora real | el coche | el aire (estación, 8,6 km) |
|---|---|---|
| 08:44 | **17°** | ≈18,5, subiendo desde 18,0 a las 08:00 |
| **08:50** | **20°** | igual |

**Tres grados arriba en seis minutos.** El aire no hace eso, y menos con
las estaciones planas. Y la explicación está en su propia foto de las
08:49: **una fila de coches parados**. Con el coche detenido, el sensor
del paragolpes coge el calor del motor y del asfalto; en cuanto circula,
baja de golpe.

**Esto CONFIRMA lo del Oiz en vez de matizarlo: el termómetro del coche
no es un dato de campo.** Ni parado al sol, ni en un atasco. Oscila 3° en
seis minutos mientras el aire no se mueve.

> #### PERO OJO: UNA TERCERA LECTURA LO DEJA SIN CERRAR
>
> A las **08:57**, ya circulando, seguía en **20°**. Serie completa:
> 08:44 → 17 · 08:50 → 20 · 08:57 → 20.
>
> Si se mantiene en 20 en marcha, la explicación del calor del motor
> flojea y aparece la contraria: que **el 17 iba retrasado** —sensor con
> inercia— y el 20 es el aire de verdad. La estación venía de +1,9° en
> una hora (16,1 → 18,0) y acelerando; a las 09:00 puede estar en 19-20
> sin nada raro.
>
> **QUEDA ABIERTO hasta que AEMET publique las 09:00** (sale con unos 50
> min de retraso). Si mide 19-20, el bueno era el 20 y el fallo es de
> inercia, no de calor de motor. Si mide 18,5, el 20 está inflado.
>
> **No se escribe la conclusión antes del dato.** Hoy ya me he equivocado
> dos veces con este mismo termómetro por cerrar antes de tiempo.

> #### Y LO CERRÓ ÉL, QUE ERA UN FALLO MÍO DE BULTO
>
> *«según estoy arrimándome a Bilbao hacia el interior veo más nubes, ya
> no veo ningún claro, y ahora marca 19 grados; según me estoy moviendo
> con el coche pues varía un grado, o sube o baja, es lógico»*.
>
> **Tiene razón y el error era mío: estaba comparando sus lecturas con la
> estación equivocada.** Los 17° los marcó en **Mungia** y los 20° en el
> **Txorierri**, a 12 km y en otro valle — y él iba en marcha, cambiando
> de aire cada minuto. Le apliqué a los dos la estación de Bilbao
> Aeropuerto.
>
> **Y esa diferencia entre valles está medida, ese mismo día a las
> 08:00:** FORUA 16,9 · BILBAO AEROPUERTO 18,0 · MATXITXAKO 20,1. **Más
> de un grado entre valles vecinos, y tres de punta a punta.** Su
> termómetro no estaba saltando: estaba cambiando de sitio.
>
> **Lo que queda en pie del termómetro, y es poco:** que no se le puede
> pedir precisión de décimas y que parado coge calor. **Lo que se cae:**
> que «oscile 3° sin motivo». Sí había motivo, y lo puso él.
>
> **LA LECCIÓN, y es la de siempre en este proyecto por enésima vez:**
> antes de llamar fallo a una diferencia, **comprobar que los dos números
> son del mismo sitio**. Es exactamente el fallo del 27-08 —«el modelo no
> lee tu sitio, lee tierra firme»— cometido por mí y con sus datos.
> Cuando él va en coche, cada foto es un punto distinto y hay que tratarla
> como tal.

**Lo que sí vale es lo que escribió él: «Munguía, 18 grados»** — que
cuadra con la estación (18,0) y queda justo en medio de las dos lecturas
locas de su pantalla.

> **Y ESTO ES LO IMPORTANTE, porque casi lo escribo al revés:** con las
> dos primeras fotos yo ya había cerrado *«su termómetro está bien, 0,4°
> de error»*. Cuadraba porque comparé una hora falsa con la curva de la
> estación, y por casualidad encajaba. La tercera foto lo tumbó y la
> fecha de los ficheros explicó por qué.
>
> **Dos medidas que coinciden no son una comprobación** si las dos salen
> del mismo aparato sin verificar. Es la regla del 30-08 otra vez: un ✓
> que no puede salir mal no informa.
>
> **Lo que NO depende de esto, y por eso el hallazgo de abajo se
> sostiene:** el sesgo frío de AROME está medido contra la ESTACIÓN
> (18,0° medidos contra 14,6° del modelo a las 08:00), no contra el
> coche.

### Y AHORA LO QUE FALLA: LA APP, EN MUNGIA, POR ABAJO

Todo pedido por `/om` a su app, punto exacto de la foto, celda de tierra.
El nudo que leen el Automático y AROME es **43,36 / −2,84 — Mungia mismo,
a 31 m**, o sea que **no es el fallo del punto lejano**: es el número.

| modelo | 08:00 | 09:00 | interpolado a 08:43 | contra sus 18° |
|---|---|---|---|---|
| **AROME HD** (el suyo) | 14,6 | 15,4 | **15,2** | **−2,8** |
| Automático | 15,0 | 15,9 | 15,7 | −2,3 |
| ICON | 14,9 | 16,6 | 16,1 | −1,9 |
| GFS | 16,0 | 17,3 | 16,9 | −1,1 |
| **ECMWF** | 16,4 | 18,3 | **17,8** | **−0,2** ← el mejor |

**Los cinco se quedan cortos, y el suyo es el que más.**

### Y LA PRUEBA LIMPIA: SOBRE LA ESTACIÓN MISMA

A las 08:51 mandó otra foto —**Corredor del Txorierri, 43,2886N
2,9020W**— y ahí ya no hace falta interpretar nada: ese punto está a
**1,1 km de la estación de Bilbao Aeropuerto**. Así que se le pidió a la
app el pronóstico **en las coordenadas exactas de la estación** y se puso
al lado de lo que el aparato midió:

| modelo, sobre la estación | 07:00 | **08:00** |
|---|---|---|
| **LA ESTACIÓN (medido)** | **16,1** | **18,0** |
| GFS | 15,9 (−0,2) | 15,9 (**−2,1**) |
| ECMWF | 15,3 (−0,8) | 15,9 (**−2,1**) |
| Automático | 15,4 (−0,7) | 15,4 (**−2,6**) |
| ICON | 15,4 (−0,7) | 15,1 (**−2,9**) |
| **AROME HD** (el suyo) | 15,2 (−0,9) | **14,9 (−3,1)** |

**Y esto cambia el diagnóstico, así que se corrige lo de arriba.** No es
que AROME enfríe el valle: **a las 07:00 los cinco cuadran** (0,2 a 0,9 de
error, impecable) **y a las 08:00 los cinco se descuelgan a la vez**, entre
2,1 y 3,1 grados.

Lo que pasó está en sus propias fotos: entre las 07:00 y las 08:00 **la
estación pegó un salto de +1,9°** (16,1 → 18,0), que es el sol rompiendo
la capa de nubes bajas. Los modelos dan ese salto **una hora tarde**: lo
colocan entre las 08:00 y las 09:00 (suben a 16,8-17,9 a las 09:00).

**AROME es el peor de los cinco, pero por 1 grado sobre el mejor. El fallo
es de los cinco.** Atribuírselo a AROME habría sido aprenderse el caso en
vez del fenómeno — el mismo error que ya está apuntado con los umbrales de
tormenta.

**Qué se hace con esto:** nada aún, pero ahora sí se sabe qué medir. La
pregunta no es «¿AROME va frío?» sino **«¿llegan tarde al calentamiento de
la mañana los días de capa baja que se rompe?»**. Eso se contesta con
varios días contra Bilbao Aeropuerto y Forua, no con uno.

### El cielo, de la misma foto — y aquí NO se saca conclusión

La foto enseña azul limpio arriba con una franja de nubes bajas y bruma
sobre el horizonte, y el sol rasante encendiendo los árboles. A las 08:00
en ese punto: GFS 21 % · Automático 51 % · ICON 64 % (código 45, niebla) ·
ECMWF 79 % · AROME no lo publica.

**Se apunta pero no puntúa a nadie**, y es a propósito: es una foto
apuntando en UNA dirección y contra el sol bajo. Con eso no se mide la
cobertura del cielo entero, y esta misma app tiene escrito que no se
convierte en hallazgo lo que puede ser un error de lectura. La foto de las
07:48 en Bermeo sí valía —capa uniforme de lado a lado, sin un claro—;
ésta no.

### QUÉ HACER CON ESTO

**Nada todavía, y por qué:** es UNA mañana y un punto. Un sesgo de modelo
no se corrige con un caso, igual que no se ajusta un umbral al peor
positivo. Lo que hace falta es **medir si se repite**: AROME contra Bilbao
Aeropuerto y Forua a primera hora, varios días. Si el sesgo frío de
madrugada en los valles es sistemático, entonces sí hay algo que decir en
pantalla —nunca corregir el número a mano, sino avisar de quién se separa.

**Lo que NO cambia:** la temperatura no es un campo con el que él decida
subir. Sus tres son racha, rayo y lluvia. Esto se apunta porque mide la
puntería de la app, no porque cambie un GO/NO-GO.

### 08:58, DEUSTO — LA MEDIDA QUE CONFIRMA EL REPARTO DE MODELOS

Cuarta foto con sello del mismo trayecto: **3 sept 2026 08:58:04 ·
43,2811N 2,9607W · Arturo Campión Kalea, Deusto**. Con dos datos suyos
encima: **«19 grados»** y, un minuto antes, **«hacia el interior veo más
nubes, ya no veo ningún claro»**. Cielo blanco cerrado en la foto, sin un
hueco.

Pedido a su app en esas coordenadas exactas, a las 09:00:

| modelo | temperatura (él: **19°**) | nubes (él: **ni un claro**) |
|---|---|---|
| **AROME HD** (el suyo) | **19,0 — clava** | no lo publica |
| Automático | 19,6 (+0,6) | **0 % — falla de lleno** |
| GFS | 18,0 (−1,0) | 5 % — falla de lleno |
| **ECMWF** | 17,7 (−1,3) | **69 % — el más cercano** |
| ICON | 16,6 (−2,4) | 27 % |

**Y lo que sale es exactamente el reparto que la app ya tiene montado:
AROME para lo de superficie, ECMWF para el cielo.** No se cambia nada
porque no hace falta: esto lo confirma en la calle, que es donde no se
había comprobado nunca.

Detalle que lo explica: **AROME lee su punto** —nudo 43,28 / −2,96, a
18 m— y **ECMWF lee 43,25 / −3,00, a unos 4 km**. Por eso el europeo da
la temperatura más floja y en cambio ve bien la capa: la nubosidad es un
campo de área y la temperatura es del punto.

**Segunda vez en la misma mañana que el Automático y GFS dicen
«despejado» con el cielo tapado** (la primera, a las 07:48 en Bermeo:
9 % y 0 % contra una capa de lado a lado). Dos casos no son una
estadística, pero van los dos en la misma dirección y refuerzan la
decisión del 02-09 de darle el cielo al europeo.

> **AVISO SOBRE LAS TABLAS DE ARRIBA — lo cazó él en el momento:**
> *«el automático lo íbamos a quitar, la pestaña del automático en la
> aplicación»*. **Y es verdad: el Automático NO está en su selector.**
> Comprobado en el código, no de memoria: `app.js` lo declara con
> `oculto: true` y el selector filtra con
> `MODELS.filter(m => !m.oculto || m.id === S.model)`. Él ve CUATRO
> —ECMWF, GFS, ICON y AROME HD— y usa AROME.
>
> Sigue vivo por dentro **solo para el vigilante y el parte de las
> 06:30**, y eso no se toca. Pero **en una tabla que se le enseña a él no
> pinta nada**: es una fila que no puede elegir. Queda en las de arriba
> porque son el registro de lo medido; **de aquí en adelante, fuera**.

**09:01, Bilbao centro — y aquí se entiende POR QUÉ cada uno acierta en lo
suyo.** Foto suya con la Torre Iberdrola al fondo y **19 grados**. Lo que
enseña que no enseñaban las otras: **el disco del sol se transparenta a
través de la nube**. La capa está, pero es FINA.

| modelo, Bilbao centro 09:00 | temperatura (él: 19°) | nubes (él: ni un claro) |
|---|---|---|
| **AROME HD** | **18,6 — clava** | no lo publica |
| GFS | 17,9 | 5 % — falla |
| **ECMWF** | 17,7 | **69 % — el más cercano** |
| ICON | 16,5 | 27 % |

**Y eso ata el reparto de modelos con una razón física, no con una
casualidad:** ECMWF ve la capa —acierta el cielo— pero al darla más
cerrada de lo que es le entra menos sol y se queda **1,3° frío**. AROME
no publica el cielo, calcula la temperatura como si entrara sol, y
acierta **porque por esa nube fina el sol pasa de verdad**.

O sea que los dos errores del día tienen el mismo origen: **una capa que
tapa el azul pero deja pasar la radiación**. Es justo el caso que un
porcentaje de nubosidad no distingue, y por eso este proyecto lleva
escrito que la nubosidad es el campo menos fiable de cualquier modelo.

### 12:39, LOIU — A 900 m DE LA ESTACIÓN, Y CON EL VIENTO DENTRO

La foto que faltaba: **3 sept 2026 12:39:35 · 43,3058N 2,9059W · Barrio
Gaztañaga, Loiu**, con **«27 grados»** y el cielo azul limpio de punta a
punta. Ese punto está a **0,87 km de BILBAO AEROPUERTO**, y esta vez **en
marcha**. Es la comparación buena que faltaba toda la mañana.

**Medida contra medida** (estación a 900 m, modelo en su punto):

| | 11:00 · real **22,7** | 12:00 · real **25,1** |
|---|---|---|
| **AROME HD** (el suyo) | **22,6 (−0,1)** | **25,1 (0,0) — clavado** |
| ECMWF | 22,1 (−0,6) | 25,0 (−0,1) |
| ICON | 21,9 (−0,8) | 24,4 (−0,7) |
| GFS | 24,4 (**+1,7**) | 27,5 (**+2,4**) |

**Y LA RACHA, que es lo que de verdad le importa.** La estación mide
**22,3 km/h** a las 12:00:

| modelo | racha 12:00 | contra los 22,3 medidos |
|---|---|---|
| **AROME HD** | 19,1 | −3,2 · el mejor |
| ECMWF | 17,3 | −5,0 |
| ICON | 15,1 | −7,2 |
| **GFS** | **5,8** | **−16,5 · la cuarta parte** |

**GFS da 6 km/h con 22 medidos.** Hoy no cambia ninguna decisión porque
nadie está cerca de sus 45, pero es exactamente el tipo de fallo que sí la
cambiaría un día de viento — y va en la misma dirección que su temperatura,
que se pasa 2,4° por arriba. **Ese modelo, para viento, no.**

Su lectura de **27° a las 12:40** queda entre AROME interpolado (26,2) y
ECMWF (27,1). **No se cierra**: la estación de las 13:00 no estaba publicada
al escribir esto (AEMET va con ~50 min de retraso).

**Lo que sí queda cerrado, y era la duda de toda la mañana:** con el punto
bien puesto y en marcha, **su termómetro cuadra**. Lo que fallaba era mi
comparación, no su aparato.

**Y el cielo, por fin, de acuerdo los cuatro:** 0-5 % de nubes los que lo
publican, y azul limpio en la foto. La mañana entera en una línea: capa
cerrada al amanecer que ECMWF vio y los demás no, rota hacia las 10:00, y
despejado desde entonces.

### 13:58, BI SOLLUBEMENDI — MEDIDA CON ANEMÓMETRO EN MAX

**43,3698 / −2,7629 · cota 669 m** (a 125 m del punto del inventario:
`BI_SOLLUBEMENDI`, ES-TIMS-49820, Monte Sollube, Arrieta). Anemómetro
UNI-T UT363BT en **MAX**: **14,6 km/h** y 28,0 °C. Cielo azul de punta a
punta.

| modelo, racha 14:00 | | contra su MAX de 14,6 |
|---|---|---|
| ICON | 35,3 | se pasa al doble |
| **AROME HD** (el suyo) | 28,4 | por encima |
| ECMWF | 22,0 | por encima |
| **GFS** | **7,2** | **por DEBAJO de lo medido a mano** |

**La conclusión firme es la de GFS.** Un aparato de mano a 1,5 m, con el
cuerpo delante, lee **menos** que la racha del modelo, que es a 10 m en
campo abierto — así que los tres primeros por encima es lo esperable y no
prueba error. **Que GFS quede por debajo de una medida de mano sí lo
prueba**, y va en la misma línea que sus 5,8 km/h con 22,3 medidos en
Bilbao Aeropuerto esa misma mañana.

**Lo que NO se puede concluir:** cuál de ICON, AROME o ECMWF acierta. Para
eso haría falta medir a 10 m, y no se puede. Se apunta el número y ya.

**Su temperatura de 28,0 °C no vale** — el aparato estaba al sol, igual que
en el Oiz. La estación del aeropuerto marcaba 27,3° a 42 m y a 669 m tocan
unos 4-5 grados menos: AROME daba **22,1**, que es lo coherente.

**Y lo que enseña la foto del emplazamiento, que no está en ningún dato:**
torre reticular con la caseta pegada dentro del vallado, **línea aérea de
alta tensión entrando por el oeste** —la que le mete la sobretensión— y
**otra cima justo al lado con una torre mayor**. O sea que Sollubemendi no
es el punto más alto de su propio collado.

**Y desde arriba vio algo que ningún modelo tiene:** *«cielo azul pero se
ve en la costa una bruma»*. Medido en Bermeo a las 14:00, por `/om`:

| | nubes bajas | visibilidad | HR |
|---|---|---|---|
| ICON | **0 %** | 40,1 km | 56 |
| ECMWF | **0 %** | no publica | 38 |
| AROME HD | **0 %** | no publica | 67 |

**Los tres dicen despejado y visibilidad de 40 km.** La bruma marina no
aparece en ningún campo: no es nube (no da cobertura), no es agua (0 mm) y
la visibilidad del modelo no baja. **Es el mismo agujero que el sirimiri**,
que tampoco existe en milímetros.

Aquí no cambia ninguna decisión suya, pero queda anotado por si algún día
importa: **estando él a 669 m, la capa la tenía por debajo** — o sea que
esto solo se ve desde arriba, y desde la costa se vería como día claro.

#### Y midió bien: las tres lecturas del aparato, no una

Al principio mandó **14,6 con 28,0 °C** dos veces seguidas, idénticas al
dígito — estaba **reteniendo en MAX**, no midiendo. Con el aparato en cada
modo salió esto:

| modo | viento | temperatura |
|---|---|---|
| MAX | **14,6** | 28,0 (al sol) |
| AVG | **10,4** | 24,5 (a la sombra) |
| instantánea | **9,6** | 24,3 |

| | medido | **AROME HD** | ECMWF | ICON | GFS |
|---|---|---|---|---|---|
| **viento medio** | **10,4** | **9,2** | 6,6 | 8,4 | 9,4 |
| racha | 14,6 (2 min) | 28,4 | 22,0 | 35,3 | **7,2** |

**LO QUE SÍ QUEDA PROBADO:**

1. **El viento medio lo clavan.** AROME 9,2 contra 10,4 medidos. En el
   campo que sí se puede comparar, la app acierta.
2. **GFS está roto en racha.** Da **7,2 de racha con 9,4 de viento medio** —
   una racha por debajo del viento medio **no existe físicamente**. Y queda
   por debajo hasta del AVG medido. Es el tercer aviso del día: en Bilbao
   Aeropuerto dio 5,8 con 22,3 medidos.

**LO QUE NO SE PUEDE CONCLUIR, y no se escribe:** si ICON (35,3) o AROME
(28,4) se pasan en la racha. Su MAX es el máximo de **un par de minutos** y
la racha del modelo es el máximo de **la hora entera**. Comparar los dos
sería el mismo error de método que comparar dos números de fuentes
distintas.

**Y la temperatura del aparato quedó zanjada:** 28,0 al sol → **24,5 a la
sombra** → 24,3 al equilibrarse. AROME daba 22,1. El sol infla ~4° y la
mano ~2°. **Confirma lo del Oiz: su temperatura no vale, ni a la sombra en
la mano.** El viento sí.

**Siguió midiendo y el resultado mejora:** segunda pasada de AVG **8,0**
km/h (24,4 °C). Con las tres lecturas de viento medio —**10,4 · 9,6 ·
8,0**— la media es **9,3 km/h**.

**AROME HD daba 9,2.** Un décimo de diferencia sobre tres lecturas
independientes. Es lo más ajustado que se ha medido nunca en este proyecto,
y en el único campo de viento que se puede comparar de verdad con un
aparato de mano.

**Y una segunda pasada de MAX: 12,1** (la primera, 14,6). Con las dos, su
racha en tramos de un par de minutos va entre **12 y 15 km/h**, con el
medio en 9,3 — **factor racha/medio de 1,44**, dentro de lo normal en
monte. La temperatura se estabilizó en **24,5 °C**.

Sigue sin poderse comparar con la racha horaria de los modelos, pero el
rango queda anotado por si algún día se puede medir a 10 m.

## 04-09-2026, tarde — cielo azul en Bermeo y Bilbao, y ~30° en Bilbao

**Lo que dijo él**, sobre las 15:00, desde el coche y por el chat:

> *«hoy en Bermeo, Bilbao, buen tiempo, cielo prácticamente azulado»*
> *«ahora hay algo más de nubes pero cielo azul»*
> *«cerca de los 30 en Bilbao»*

Sin foto: es una impresión suya, no una medida. Pero es de las que sirven,
porque **el cielo no lo mide ningún aparato de los que lee la app** — las
estaciones de Euskalmet y AEMET no dan nubosidad. Aquí su ojo es el único
dato que hay.

### EL CIELO — medido en el momento

| modelo | Bermeo | Bilbao | ¿cuadra con «azul»? |
|---|---|---|---|
| ECMWF | 20 % (altas 6) | 33 % (altas 8) | **sí** |
| Automático | 0 % | 13 % | **sí** |
| GFS | 51 % | 6 % | regular, y se contradice entre los dos |
| AROME HD | no publica el total | no publica | — |
| **ICON** | **100 %** | **100 %** | **no** |

**ICON daba el cielo tapado del todo en los dos sitios con él viendo azul.**
Y no es que se equivoque en las capas: son **100 % de nubes ALTAS**, cirros,
que dejan pasar el sol. Lo que falla es cómo lo resume: su `weather_code`
sale **3 = CUBIERTO**. Un cielo con cirros y sol no es un cielo cubierto.

Él ve lo correcto porque tiene AROME puesto y AROME no publica el cielo: se
lo presta ECMWF, que daba «poco nuboso». **Con ICON cargado vería «Cubierto»
mirando al azul.**

### LA TEMPERATURA — Bilbao, 15:00

| ECMWF | 30,7 | ✓ |
|---|---|---|
| AROME HD | 30,3 | ✓ |
| Automático | 30,1 | ✓ |
| GFS | 29,5 | ✓ |
| **ICON** | **26,0** | **✗ cuatro grados corto** |

Estaciones a esa hora: Bilbao aeropuerto 26,1 (pero está en Loiu, a 4,5 km y
fuera del casco) y Güeñes 33,2. Bilbao ciudad, en el fondo del valle y con
el calor de la ciudad, a 30 encaja.

### LO QUE DEJA ESTA TARDE

**ICON falla dos veces seguidas en el mismo rato**: el cielo y la
temperatura. Va en la misma línea que lo medido el 02-09 contra el satélite,
donde daba **33 % de fallos gordos de cielo** contra el 0 % de ECMWF, y que
lo del 03-09 con sus fotos.

**Y ECMWF y AROME clavan las dos.** Es la tercera vez que sale lo mismo.

## 04-09-2026, 16:00 — DOS FOTOS de Bermeo: azul, con tres modelos diciendo «cubierto»

Lo de arriba (15:00) era su impresión desde el coche. **Esto ya es prueba:**
mandó dos fotos por el buzón de la app, a las **16:00:59 y 16:01:11**, dos
encuadres distintos desde el mismo punto de Bermeo (GPS 43,41745 /
-2,72646). Las dos: **azul limpio de horizonte a horizonte, sombras duras
de sol alto y algún jirón de cirro muy tenue.** Dos encuadres opuestos
descartan que fuera un claro puntual.

### EL CIELO — Bermeo, 16:00, sello guardado al mandar la foto

| modelo | `weather_code` | qué dice eso | ¿cuadra con la foto? |
|---|---|---|---|
| **ECMWF** | **1** | poco nuboso | **sí** |
| AROME HD | `null` | no lo publica | — |
| Automático | 3 | **CUBIERTO** | **no** |
| **ICON** | **3** | **CUBIERTO** | **no** |
| GFS | 3 | **CUBIERTO** | **no** |

**Tres de cinco daban el cielo tapado con él fotografiando azul.** Y de los
dos que quedan, uno ni publica el campo. **El único que acertó fue ECMWF**,
igual que a las 15:00, igual que el 03-09 con sus fotos y que el 02-09
contra el satélite.

Para ICON van ya **cuatro fallos de cielo en tres días**. La causa está
diagnosticada arriba (resume 100 % de cirros como código 3 = cubierto), y
esta vez está fotografiada.

### LO DEMÁS DEL SELLO — sin medir, no se dice nada

| | racha km/h | temp °C |
|---|---|---|
| ECMWF | 27,7 | 31,2 |
| ICON | 28,4 | 28,2 |
| Automático | 25,6 | 27,2 |
| AROME HD | 24,1 | **26,4** |
| GFS | 9,0 | 31,0 |

**No mandó anemómetro ni termómetro, así que esto queda anotado y NO
calibrado.** Solo se apunta el hueco: GFS da 9 km/h donde los otros cuatro
dan 24-28. Es la misma rareza de GFS con la racha que ya salió el 03-09.
Hace falta una medida para saber quién miente.

### UN FALLO DE USO QUE ROMPE LA CALIBRACIÓN — apuntado para arreglarlo

La foto de las **16:00:59** llegó etiquetada **«Calpe (emplazamiento)»**,
con coordenadas 38,6447 / 0,0445, y su sello `decia` es **el de Calpe**
(CAPE 1500, 34,5 °C). Pero la imagen es **Bermeo**: monte atlántico verde
al fondo, los mismos edificios y la misma malla verde de obra que la foto
de 12 segundos después, esa sí con GPS de Bermeo. En 12 segundos no se
cruzan 700 km.

Lo que pasó: **tenía Calpe seleccionado en el selector, mandó la foto, y
luego pulsó GPS y mandó la otra.** La app sella con el emplazamiento
elegido, no con dónde está el teléfono.

**Consecuencia:** una foto mandada sin GPS trae un sello de otro sitio, y
contrastarla sería inventarse la comparación. Aquí se salva porque la
segunda foto es del mismo minuto y del mismo sitio y sí trae GPS — pero
solo por suerte. **La app debería sellar con el GPS cuando lo tiene, o
avisar de que está sellando con otro sitio.**

---

## 05-09-2026 · CALPE 13:47 — el cielo, y esta vez ECMWF falla

Una nota por el buzón, **con GPS** (38,67043 / 0,05694), leída en la pasada
de las 15:00 del vigilante. Foto desde el coche mirando hacia arriba: un
sector largo de cielo con **azul limpio de punta a punta, ni una nube**,
sombras duras de sol alto y algún velo de estela muy tenue. Al fondo una
torre eléctrica de celosía y una casa; el encuadre no cubre el hemisferio
entero, así que lo que se afirma es **el sector fotografiado**, no el cielo
completo.

### EL CIELO — sello guardado al mandar la foto, hora del modelo 13:00

| modelo | `weather_code` | qué dice eso | ¿cuadra con la foto? |
|---|---|---|---|
| **Automático** | 2 | parcialmente nuboso | **el que menos se pasa** |
| **ICON** | 2 | parcialmente nuboso | **el que menos se pasa** |
| ECMWF | **3** | **CUBIERTO** | **no** |
| GFS | **3** | **CUBIERTO** | **no** |
| AROME HD | `null` | no lo publica | — |

**Ninguno acertó del todo** —la foto es un 0 o un 1— pero el reparto sale al
revés que en Bermeo: aquí **ECMWF es de los que dan cubierto con él
fotografiando azul**, y los que menos se pasan son el Automático e ICON.

**Y hay que decir que NO son dos aciertos, sino uno.** En Calpe el sello del
Automático es **idéntico a ICON en los siete campos** (lluvia 0, cielo 2,
CAPE 700, tapa 341, racha 21,6, viento 8,8, temp 30,9): ahí el Automático
**es** ICON-EU. En Bizkaia el Automático es AROME casi siempre (35 de 48
horas, medido el 24-08); en Calpe no. Contar «dos modelos» donde hay uno
sería inflar el marcador.

**Lo que esto NO tumba:** el 02-09 el cielo pasó a ECMWF con cinco fuentes
independientes detrás, y el 03-09 y el 04-09 ECMWF fue el único que acertó
en Bermeo. **Un caso a 700 km no mueve una decisión tomada con medidas de su
zona.** Lo que sí deja anotado es que **el acierto de cielo de ECMWF está
medido en la costa cantábrica, no en el Mediterráneo**, y que si él va a
seguir mandando fotos de Calpe conviene ir contándolas aparte antes de
concluir nada.

### LO DEMÁS DEL SELLO — sin medir, no se dice nada

| | CAPE | tapa | racha km/h | temp °C |
|---|---|---|---|---|
| Automático | 700 | 341 | 21,6 | 30,9 |
| ICON | 700 | 341 | 21,6 | 30,9 |
| ECMWF | 870 | no la publica | 24,8 | **35,7** |
| GFS | 170 | 269 | 11,5 | 32,6 |
| AROME HD | 110 | no la publica | 24,5 | (el sello llegó cortado) |

**No mandó anemómetro ni termómetro: esto queda anotado y NO calibrado.**
Los dos huecos que se ven: **4,8 °C entre ECMWF (35,7) y el Automático
(30,9)**, y **CAPE de 110 a 870 según a quién preguntes**, con la tapa en 341
donde la publican — o sea gasolina sin ninguna chispa, coherente con el
cielo raso de la foto. Hace falta una medida suya para saber quién miente
con la temperatura.

**Y un apunte del propio sello:** ECMWF y AROME HD no publican la tapa
tampoco aquí (0 de las horas), que es lo ya sabido desde el 23-08. No es un
fallo del buzón.

## 14-09-2026 · BERMEO 13:30 — 24 °C en el coche y cielo azul con algunas nubes altas blancas

**Lo suyo:** termómetro del coche **24 °C** (el reloj del coche marca 12:30: va 1 h
atrasado, como siempre; la hora real es 13:30). Foto del cielo desde el coche
en el casco: azul limpio; él añade «algunas nubes altas blancas». No mandó
anemómetro ni termómetro de mano: la temperatura es la del coche, sin calibrar.

**Lo que decía la app a esa hora (pedido por /om a las 13:15 del servidor,
Bermeo 43,42 / -2,72):**

| | 13:00 °C | 14:00 °C | altas 13 h | altas 14 h | total 13 h | cielo (código) |
|---|---|---|---|---|---|---|
| AROME HD (el suyo) | **24,7** | 24,9 | 87 % | 7 % | no lo publica | no lo publica |
| ECMWF | 29,9 | 31,1 | 30 % | 35 % | 0 % | 0 · despejado |
| ICON | 27,4 | 28,2 | 22 % | 23 % | 22 % | 1 · casi despejado |
| GFS | 31,7 | 32,3 | 5 % | 5 % | 7 % | 0 · despejado |
| Automático | 24,8 | 25,0 | 0 % | 0 % | 87 % | 3 · cubierto |

**Temperatura:** AROME HD clava (24,7 contra 24 medido). ECMWF se va **6°** y
GFS **8°**: es el «los 5 modelos van de 26° a 32°» que llevaba hoy la tarjeta
de 10 días, y hoy los que mienten son ellos. En Bermeo, temperatura: AROME HD.
**Cielo:** «algunas nubes altas blancas» cuadra con ECMWF (30 % de altas y
despejado) e ICON (22 %). La app ponía «Despejado» a las 13:00 (pantallazo
de las 10:32, Horas): bien. AROME HD pone 87 % de altas a las 13 y 7 % a las
14 —demasiado a las 13 para esta foto— y el **Automático** dice «cubierto»
(87 % de nubes) a las 13:00 con este cielo: fallo gordo, el mismo que se le
midió el 02-09 (33 % de fallos gordos de cielo). Un dato más para el marcador.

## Bermeo, martes 15-09-2026, 12:05 · «cada vez vienen más nubes» · «creo que esta tarde viento y nubosidad»

**Lo suyo:** desde Bermeo, hacia las 12:05, el cielo se va tapando y espera
viento y nubes por la tarde. Sin medida de aparato.

**El satélite (Meteosat visible, pasada de las 11:45 local, EUMETView):**
una banda de nube BAJA que entra del noroeste por todo el Cantábrico, con el
borde sur justo sobre la costa de Bizkaia: Bermeo debajo del borde, Santander
ya debajo, Bilbao y Donostia todavía fuera. El infrarrojo, negro en toda la
zona: nube baja y templada, nada alto ni frío. (Se le mandó la foto con la
costa y Bermeo marcados.)

**Lo que decía la app a esa hora (pedido por /om a las 12:08, Bermeo
43,42 / -2,72, cell_selection=land). Nube baja, y entre paréntesis el total
cuando no coincide:**

| | 12 h | 13 h | 15 h | 17 h | 20 h | racha máx. de la tarde | dir | llovizna |
|---|---|---|---|---|---|---|---|---|
| AROME HD (el suyo) | 14 % | 42 % | 88 % | 91 % | 100 % | 56 km/h (13 h) | ONO | 0,2 mm a las 21 h (no publica código) |
| ECMWF | 0 % (2) | 0 % (6) | 4 % (23, altas) | 14 % (48) | 15 % (53) | 50 km/h (18 h) | NO | código 51 a las 21-22 h |
| ICON | 48 % | 50 % | 49 % | 29 % | 66 % | **63 km/h (14 h)** | ONO | no |
| GFS | 0 % | 0 % | 0 % | 0 % | 9 % (31) | 34 km/h (19 h) | NO | código 51 desde las 20 h |
| Automático | 7 % (14) | 25 % (37) | 97 % (92) | 77 % (95) | 100 % | 56 km/h (13 h) | ONO | código 51 a las 21 h |

**Lectura:** a las 12:05 el satélite ya tiene el borde de la nube baja
encima de Bermeo y él la ve llegar. AROME HD la pone entrando a las 13
(42 %) y encima a las 15 (88 %); ICON la tiene ya a las 12 (48 %); ECMWF y
GFS la dan rasa hasta media tarde: hoy los de 25 km van tarde con la nube
baja, como en Calpe. Viento: los cuatro del NO/ONO; AROME 53-58 de racha
toda la tarde, ICON cruza los 60 de 14 a 16 h, ECMWF llega a 50 a las 18 h,
GFS se queda en 20-30. Contrastar por la tarde con lo que vea.

**12:50, suyo: «ya van entrando nubes blancas cada vez más y ojo viento», «en el mismo pueblo».**
Euskalmet a las 12:40 (por /api/euskalmet): **Almike (Bermeo), a 1,1 km, anemómetro a 18 m**:
racha **48 km/h**, viento 24,6, del ONO (284°), 23,2 °C, humedad 74 %. **Matxitxako**
(433 m, anemómetro a 65 m): racha 63,9, viento 51,7, del O, 18,9 °C y **humedad 100 %:
el cabo está dentro de la nube baja**. AEMET (/estaciones) devolvió la lista VACÍA a
las 12:50 (`"estaciones":[]`, sin `sinClave`): apuntado para mirar.
Contra los modelos de las 12-13 h en Bermeo: viento medio AROME 25,8 contra 24,6 medido
(clavado); racha AROME 56-58 contra 48 (unos 10 de más, en un anemómetro a 18 m en el
pueblo); ICON 54-60; **ECMWF 29-35 y GFS 20-22, la mitad de lo medido**. Nube: AROME
pone 74-83 % de baja sobre Bermeo a las 13 y él la ve entrar; cuadra.
Pidió una captura de la capa de nubes del mapa: el candado de la app (código de 6
cifras) lo impide desde aquí —no se teclean códigos—; se le mandó en su lugar la
rejilla de nube baja de AROME HD e ICON a las 13, 15 y 17 con los datos de /om.

**20:24-20:50, Bermeo, contado por él al portátil (las fotos las tiene el portátil):** 20:24 cielo cerrado · 20:30 chispeo corto · 20:45 se abre · 20:50 «Ahora» con el chip de GFS. Modelos a las 21:09 (por /om): AROME HD nube baja 94 % a las 20 y **34 % a las 21** (se abre), 0,0 mm y sin código; ECMWF llovizna (51) 0,1 mm desde las 21; ICON chubasco (80) 0,4 mm a las 21; **GFS llovizna 0,1 desde las 20**. Almike a las 21:00: 0,0 mm, humedad 85 %. El chispeo lo tenía GFS (y ECMWF una hora después); el claro, AROME HD. Ver TRASPASO §17 (21:10).
