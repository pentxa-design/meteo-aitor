# Ideas sacadas de Windy (26-10-2026, tarde)

Recorrido de Windy con la cuenta Premium de Aitor, en Bermeo (43,42 / −2,72),
**solo mirando**: no se ha tocado código, ni publicado nada, ni cambiado ningún
ajuste de su cuenta. Cada dato nuestro de abajo está pedido por **`/om` de la app**,
no por fuera.

Para cada idea: **qué hace Windy** (lo que se vio), **qué tenemos hoy**, **dónde
encaja** (la **app**, su herramienta de trabajo, con el rayo como veto; o la
**agenda**, para su mujer y su hija: cuatro capas, el europeo siempre y nada de
modelos) y **cuánto costaría**.

**Lo primero que salta a la vista:** la app ya tiene casi todo lo que enseña Windy
(29 capas, radar de AEMET y el de Windy incrustado, satélite, rayos de AEMET,
comparador de modelos, cámaras, ensemble en el globo de la lluvia acumulada). Lo
que falta no son capas: son **cuatro maneras de leer lo que ya llega**.

---

## ⚠ Antes de las ideas: un fallo de verdad que salió al medir

**Desde la conexión de casa, Open-Meteo contesta hoy «Daily API request limit
exceeded»** (límite DIARIO agotado, no el de por minuto). Pasó en la primera
consulta que hice directa, a las ~14:20; por `/om` (Vercel) todo va bien.

Lo que eso rompe hoy:

- **Las flechas de viento de la agenda** se piden **desde el navegador**, directas
  a `api.open-meteo.com` (`agenda-familiar/app.js:2707`). En casa, hoy, no van a
  salir.
- **Y el aviso dice algo falso:** el `catch` mira `/limit|429/` y contesta *«la API
  del tiempo ha recibido demasiadas peticiones **este minuto** … lo vuelvo a pedir
  yo sola dentro de un minuto»* — y reintenta cada 65 s, cuando el cupo no vuelve
  hasta mañana. Un reintento que no puede funcionar, cada minuto, todo el día.
- La app publicada no se ve afectada: va por `/om`. Pero en local (`localhost`,
  `PROXY` es `null`, `app.js:40`) **sí** pide directo: las pruebas que levantan la
  app en el iMac gastan el mismo cupo de casa.

**Lo que habría que hacer (no hecho, esta sesión es solo de estudio):** que la
agenda pida el viento por el `/om` de la app, igual que ya pide los trozos del
mapa por `/omtiles`; y distinguir «Daily» de «Minutely» en el aviso. Coste: poco.

---

## Resumen, de más útil a menos para él

| # | Idea | Dónde | Coste |
|---|---|---|---|
| 1 | **Abanico del ensemble en la racha:** «entre 25 y 36 km/h; N de 51 cruzan tus 45» | app (y agenda en una palabra) | **medio** — el ensemble ya llega por `/om` |
| 2 | **Lluvia de chubasco separada de la de frente** (`showers`) como señal que suma a la tormenta | app | **poco** — un campo más; medir antes con sus casos |
| 3 | **Quién acertó estos tres días** en la estación cercana, modelo a modelo | app | medio-alto — `/om?api=hist` existe y nadie lo usa |
| 4 | **Estaciones medidas encima del mapa** (racha del anemómetro y su edad), en capa aparte | app | medio |
| 5 | Comprobar que el **radar de Windy incrustado** enseña los rayos | app | **poco** — es mirar |
| 6 | **Línea de la isocero** sobre el relieve (invierno: qué montes hielan) | app | poco-medio |
| 7 | **Avisos oficiales pintados por zonas** en el mapa | app | medio-alto |
| 8 | **El tiempo a lo largo de la carretera** (su «Planificador de ruta») | app | alto |
| 9 | **«Seguro / puede cambiar»** por día, sacado del n.º 1 | agenda | poco, una vez hecho el 1 |

Y una nota de método que vale más que varias ideas: **la tabla del punto de Windy,
en su cuenta, sale de «meteoblue AI», no del europeo** (ver al final).

---

## 1 · El abanico del ensemble para la racha — LA MÁS ÚTIL

**Windy:** encima de cada día del pronóstico del punto pone un **% de
«predicibilidad»** con un punto verde o amarillo. En Bermeo: lunes 90 %, martes
60 %, miércoles 70 %, jueves 80 %, viernes 80 %, sábado 70 %, domingo 60 %. Es de
meteoblue y **no publica cómo lo calcula** → **ese % no se copia.**

**Nosotros hoy:** el ensemble (51 miembros de ECMWF) solo se usa en el globo de
la lluvia acumulada del mapa (`maps.js:6021`). La racha que se ve es un número
solo.

**Lo que sí se puede hacer con datos nuestros**, medido ahora por `/om?api=ens`,
ECMWF ENS, **racha máxima del día en Bermeo**, 8 de cada 10 miembros entre:

| día | p10 | mediana | p90 |
|---|---|---|---|
| lun 26 | 25 | 30 | 36 km/h |
| mar 27 | 27 | 32 | 37 |
| mié 28 | 25 | 29 | 32 |
| jue 29 | 16 | 19 | 27 |
| vie 30 | 15 | 22 | 33 |
| sáb 31 | 19 | 26 | 37 |
| **dom 1** | **17** | **24** | **42** |

Y la lluvia del martes: entre 0,1 y 1,5 mm (o sea, ni seguro que llueva ni seguro
que no). Ojo: es el ensemble de **25 km**, no el de 9.

**Por qué le sirve a él:** su CLAUDE.md lo dice — *los dos errores cuestan*. «32
km/h» no le dice si mañana se puede fiar; **«entre 27 y 37, y ninguno de los 51
llega a tus 45»** sí. Y al revés: el domingo uno de cada diez pasa de 42. Encaja
con **su listón** (se cuenta cuántos de 51 cruzan 45 y 60), no con un % inventado.

**Dónde:** app — en «10 días» y en el parte, al lado de la racha. Agenda — ver n.º 9.

**Coste:** medio. El endpoint ya está (`ens`, ~9 KB por punto). Lo que cuesta es
decidir dónde se pinta sin llenar de números la pantalla.

**Cuidado:** el ensemble va a 25 km → en la costa lee tierra adentro (el caso de
Bermeo a 18 km, ya medido). Decirlo.

---

## 2 · La lluvia de chubasco, aparte

**Windy:** en el **meteograma** separa **«Lluvia»** de **«Lluvia convectiva»** (otro
color), y debajo una fila **«Base de nube»** en metros hora a hora (700, 600, 1.800…
en verde cuando es baja).

**Nosotros hoy:** la app **no pide `showers`** (0 apariciones en `app.js`). Solo
`precipitation`.

**Medido por `/om`, Bermeo, próximas 72 h, suma de cada campo:**

| modelo | `showers` (chubasco) | `rain` | `precipitation` |
|---|---|---|---|
| **ECMWF 9 km** (`ecmwf_ifs`) | **0,9 mm** | 0,5 | 1,4 |
| GFS 13 km | **2,1** | 2,0 | 4,1 |
| ECMWF 25 km | **0** | 1,8 | 1,8 ← no lo separa |
| ARPEGE | 0 | 1,3 | 1,3 ← no lo separa |
| ICON-EU | 0 | 0 | 0 ← no se puede saber hoy |
| AROME HD | **no lo publica** (0 de 72 h) | — | 0,5 |

O sea: **el europeo de 9 km sí lo separa**, el de 25 km no.

**Por qué le sirve:** lluvia de chubasco = convección **en marcha**. Para su veto
(el rayo) es una pista más, de la familia de «el agua que cae es una medida, la
probabilidad una previsión».

**Regla, la de la altura de la nube del 27-08: SUMA Y NUNCA RESTA.** Un 0 de
chubasco no puede bajar un aviso — ECMWF 25 km y ARPEGE dan 0 siempre.

**Antes de enseñarlo:** medir por `/om?api=hist` qué daba `showers` de ECMWF 9 km
en sus casos reales (Lekeitio 23-08 22-23 h, Durango 23-08 23 h, Bermeo 24-08 15
h) y en un día de lluvia de frente sin rayos. Si no separa esos dos casos, no se
pone.

**Coste:** poco (un campo en `HOURLY` y un texto), más la medición.

---

## 3 · Quién acertó estos tres días, en su estación

**Windy:** al pinchar una estación (vi **LEBB, aeropuerto de Bilbao**: «hace 24 m ·
14:00», 24 °C, viento 4 km/h, vis. +10 km, 1019 hPa) tiene una pestaña
**«Observación vs. pronóstico»**: las curvas de seis modelos contra lo medido los
**tres últimos días**, y el **error medio de cada modelo** (meteoblue AI: 0,3 °C en
temperatura y 3,9 km/h en viento). El sábado la estación marcó una racha de **61
km/h** y se ve qué modelo la vio.

**Nosotros hoy:** la ficha ya dice **cuántos modelos aciertan AHORA** contra la
estación (`app.js` ~2001, verde/ámbar/rojo) — eso Windy no lo tiene. Lo que no
tenemos es **la memoria**: los últimos días. Y `/om?api=hist` (lo que cada modelo
pronosticó en días pasados) **está montado desde el 04-09 y la app no lo llama
nunca.**

**Por qué le sirve:** es su pregunta de cada mañana — *«¿de quién me fío hoy?»* — y
con un dato suyo, no con fama: «estos tres días, en Matxitxako, ICON se quedó 3
km/h corto en racha y AROME 11».

**Dónde:** app, en la casilla de la estación de «Ahora».

**Coste:** medio-alto (pedir 3 días × modelos y cruzarlos con `?historia=` de
`/estaciones`). **Reglas que ya están y valen:** calla si la estación está a más
de 200 m de desnivel; lo medido y lo calculado solo se juntan en esa línea de
veredicto, que la pidió él.

---

## 4 · Las estaciones encima del mapa

**Windy:** con la capa que sea, pinta encima **chapitas con el viento MEDIDO** de
aeropuertos, estaciones oficiales, particulares y boyas (Airp · WMO · PWS ·
ShipBuoy, cada una se enciende aparte). Color por fuerza, flecha con el rumbo. En
la zona: 4 en Bilbao, 7 en Castro, 11 en Ondarroa, 23 en Mondragón…

**Nosotros hoy:** el mapa **no pinta estaciones**. Están en la ficha y en el parte.

**Por qué le sirve:** en «durante», con la célula encima, **ver de un vistazo qué
marcan los anemómetros alrededor** (Matxitxako, Oiz…) vale más que el color del
modelo. Junio en el Oiz: 32 horas por encima de 60 y el pronóstico avisó de dos.

**Regla que manda:** *lo medido y lo calculado no se mezclan* → **capa aparte**,
con «MEDIDO» en la etiqueta y la **edad** de cada dato («hace 12 min»), nunca
números mezclados con los del modelo.

**Coste:** medio. Ojo con el gasto de Vercel: `/api/euskalmet` es la llamada cara
(1,3 s de CPU); las de AEMET son más baratas.

---

## 5 · El radar incrustado, ¿lleva los rayos?

**Windy:** su radar tiene tira **«Hace 24 h · Hace 6 h · Hace 1 h · Sig. 1 h»**
(la hora siguiente extrapolada, «nowcast»), sello **«14:20 · hace 3 m»**, y en
«Más opciones»: **Mostrar rayos** y **Sonido**.

**Nosotros hoy:** «Radar Windy (directo)» incrusta `embed2.html` con `overlay=radar`
(`maps.js:4158`). **No he comprobado** si ese visor incrustado enseña los rayos; no
conozco un parámetro que los encienda.

**Coste:** poco — mirarlo con una tormenta encima. Si no los enseña, decirlo en la
leyenda de esa capa («sin rayos: míralos en Rayos»), que callarlo es un hueco.

---

## 6 · La isocero como línea

**Windy:** en «Mostrar en el mapa → Isolíneas» deja poner la **altitud de
congelación** como líneas encima de cualquier capa.

**Nosotros hoy:** la isocero es una capa de color, y el mapa ya sabe dibujar
líneas (presión, geopotencial 500).

**Por qué:** en invierno, con el remolque, qué montes quedan por encima del hielo
se lee mejor como una línea sobre el relieve que como un color.

**Coste:** poco-medio. **Ojo:** en los trozos del mapa la isocero **solo la publica
ICON-EU** (medido en `latest.json`: ECMWF 9 km, AROME HD y ARPEGE no) → saldría de
ICON-EU y se dice.

---

## 7 · Los avisos oficiales en el mapa

**Windy:** capa «Avisos climatológ.» con zonas coloreadas (Moderado · Alta ·
Extrema) y filtro **Todo / Hoy / Mañana / Más tarde**. Hoy, nada en Euskadi.

**Nosotros hoy:** `/api/alertas-espana` los trae de Meteoalarm y los **lista**. No
se pintan.

**Coste:** medio-alto, y **medir antes** si el feed trae el contorno de cada zona o
solo su código (si es solo código, hacen falta los contornos aparte). Utilidad
para él, moderada: él mismo dijo de la tarde del 24-08 que *«esto no avisó nadie»*.

---

## 8 · El tiempo por la carretera

**Windy:** «Planificador de ruta» en el menú: el pronóstico a lo largo de un
trayecto.

**Por qué podría servirle:** el acceso es media decisión (nieve, hielo, barro, el
remolque). Hoy la app mira el emplazamiento, no el camino.

**Coste:** alto. Lo dejo apuntado, no lo recomendaría ahora.

---

## 9 · Para la agenda: «seguro» o «puede cambiar»

Lo mismo que el n.º 1, sin números de modelo: debajo de cada día, **«seguro»** si
los 51 miembros dicen lo mismo y **«puede cambiar»** si no («el martes puede llover
o no»). Ellas *«no saben lo que son modelos»*; esto no les pide saberlo.

**Coste:** poco una vez hecho el 1. **No** copiar el % de Windy (receta de
meteoblue, no publicada).

---

## Lo que NO se copia, y por qué

| Lo de Windy | Por qué no |
|---|---|
| **Capa «Tormentas eléctricas»** (densidad de rayos prevista, l/km², ECMWF 9 km / ALADIN 2,3 km) | Open-Meteo no la da. **Medido por `/om`:** `lightning_density`, `lightning_potential` y `thunderstorm_probability` salen **0 de 24 h** en ECMWF 9 km, AROME HD e ICON-EU. |
| **«Pronóstico extremo»** (por día: Temperatura · Viento · Lluvia, escala «extreme cold ↔ extreme warm») | Es el índice de extremos de ECMWF. No lo he encontrado en Open-Meteo (**no medido**: solo no lo conocemos). |
| **% de predicibilidad** | Receta de meteoblue, no publicada. Lo nuestro, el n.º 1. |
| **% de «Nubes»** | Ya decidido el 26-10 (§84): cuenta parte de los cirros con una receta que no publica. |
| **«Niebla»** | Windy la cambia **sola a ICON** (se ve en el chip de modelo, sin una frase). La app ya hace eso mejor: dice de quién sale. |
| **«Elevación de modelo: 100 m»** del punto | La lección del 30-08: saber de dónde sale un número antes de compararlo. No se sabe cómo lo saca Windy. |
| **Airgram** (viento y temperatura por niveles de presión, 1000-700 hPa) | Para la torre de 40 m ya están los 10/80/120 m. Arriba de eso no le cambia nada. |
| **Comparar previsiones** | Ya existe: pestaña Modelos. |
| **Tipo de precipitación**, **Acumulación de lluvia**, **cámaras** con «hace 8 m · a 7,8 km» | Ya están en la app (y las cámaras ya dicen distancia y rumbo). |

---

## Nota de método: la tabla del punto de Windy NO es el europeo

En su cuenta, el pronóstico del punto de Windy (la tabla de abajo, el meteograma,
el airgram) sale de **«Fuente: meteoblue AI»**. El mapa sí va en ECMWF 9 km, pero
la tabla no, salvo que se cambie la fuente a mano (las que ofrece: meteoblue AI,
ECMWF 9 km, GFS 22 km, ICON-EU 7 km, ICON 13 km, AROME-HD 1,3 km, AROME FR 2,5 km).

**Consecuencia para contrastar:** cuando Aitor mande una captura de **la tabla** de
Windy, no es «el europeo» — es meteoblue AI. Antes de comparar con la app, mirar
qué pone en «Fuente». Es la regla de siempre: mismo modelo, misma hora, mismo
punto.
