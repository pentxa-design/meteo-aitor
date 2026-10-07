# Bermeo, 06-10-2026

- **14:05** — suyo: 26° y solazo; le llegan partes con «⚡ rayo en 21 sitios» (código de tormenta de ECMWF 9 km / pareja de los modelos). AEMET: 0 descargas a menos de 60 km en 6 h.
- **15:10** — fotos: cielo azul con cirros. Radar AEMET y RainViewer limpios en Euskadi; tope convectivo ~2.000 m; ICON 0,1-0,7 mm/h hacia las 17 h en la costa; solo ECMWF 9 km da código de tormenta (17 y 20 h).
- **15:40** — suyo: «de momento ni gota».
- **18:55** — suyo, con fotos: nubes de algodón (cúmulos y algo de estratocúmulo), gris hacia el sur, seco. Ni tormenta ni lluvia fuerte: lo que daba ECMWF 9 km (código de tormenta a las 17 y 3-5 mm) no pasó.
- **~19:00** — suyo: «cayeron dos gotitas de agua fina, que apenas mojó el suelo, y paró». Matxitxako y Forua: 0 mm de 15 a 18 h. **Veredicto del día:** acertó AROME HD (el que manda en la lluvia: costa casi seca, algo suelto por la tarde); ECMWF 9 km se pasó (código de tormenta a las 17 y 20 h, 3-5 mm). Bien apagados los avisos de modelo.
- **19:05** — suyo: «más nubes que claros, pero no un 100 %» (fotos de las 18:55: cúmulos y estratocúmulos con claros, velo alto fino). Modelos a las 19 h: total 87-100 % en todos (ECMWF 25 km 97, ECMWF 9 km 87, ICON 100, GFS 100); la nube BAJA, la que tapa, 15-40 % salvo GFS y AROME HD (100). El 97 % lo sube la nube ALTA (100 % en casi todos): el velo fino cuenta como cielo cubierto.

## 22:00-22:20 — tormenta encima de Bermeo

**Suyo:** 21:5x «lloviendo y tronando y rayos» · 22:18 «lloviendo muy fuerte y tronando en Bermeo ahora».

**Medido (Euskalmet, por /api/euskalmet, dato de las 22:10):**
- Almike (Bermeo, 1,1 km): **1,1 mm en 20 min** (≈ 3,3 mm/h), racha 16,6 km/h.
- Matxitxako (4,6 km, 433 m, anemómetro a 65 m): **3,2 mm en 20 min** (≈ 9,6 mm/h), **racha 65,3 km/h**.

**Lo que daban los modelos para Bermeo a las 22:00 (por /om, pedido a las 22:00):**

| | mm 22:00 | CAPE |
|---|---|---|
| **AROME HD** | **2,9** | 900 (1.090-1.160 de 19 a 23) |
| ECMWF 9 km | 0 (tormenta a las 19, código 80) | 350 |
| ECMWF 25 km | 0,1 (3,4 a las 19-20) | 420 |
| ICON | 0,1 | 210 |
| GFS | 0 | 0 |

**AEMET rayos:** a las 22:19 lo publicado llega solo hasta las 21:00 (nada a < 15 km de 19 a 21 h; el más cercano a 40,8 km, Ugao-Zeberio, de 20 a 21 h). La hora de 21 a 22 está pendiente de publicar: se completa al salir.

**Hallazgo:** el «puede tronar» pide CAPE ≥ 700 con la tapa DEL MISMO modelo < 75. AROME no publica tapa → su CAPE de 1.160 no puede disparar el aviso. ICON daba tapa 39 a las 22:00. Propuesto a él: CAPE de AROME + tapa de ICON, midiendo antes cuánto saltaría. Pendiente de su sí.
- 22:21 suyo: «aquí está tirando bien» (lluvia fuerte en Bermeo).

## Quién lo vio venir CON HORAS (pasadas de 00, 06 y 12 UTC)

Pedido por él a las 22:25: *«en directo cualquiera, yo quiero saber hace unas horas quién estuvo más cerca»*.
Fuente: Open-Meteo Single Runs API, **repetido por /om?api=runs (añadido 06-10 22:30): mismos números exactos**, Bermeo 43,413 / −2,7183. Horas locales 20 · 21 · 22 · 23, «mm / CAPE / código»:

| pasada | AROME HD | ECMWF 9 km | ECMWF 25 km | ICON | GFS |
|---|---|---|---|---|---|
| 00 UTC | 0 mm todas · CAPE 1.210-1.230 | 0,1 · **1,1** · 0,5 · 0 (llovizna) | 0,5-0,7 llovizna | 0 · 0,3 · 0,3 · 0 | 0 · 0,2 · **0,6** · **1,1** |
| 06 UTC | 0 mm todas · **CAPE 1.150-1.390** | **2,7 mm y código 95 (tormenta) a las 20** · 0,6 · 0,2 · 0 | 0,9 · 0,4 · 0,4 · 0,4 | 0 · 0,3 · 0 · 0 | 0 · 0,3 · 0,2 · 0,7 |
| 12 UTC | 0,1 · 0 · 0,1 · 0 · CAPE 1.170-1.230 | 1,3 · 0,2 · 0 · 0 | **3,4 a las 20** · 0,1… | 0,2 · 0,1 · 0,2 · 0,1 | 0,2 · 0 · 0 · 0 |

**Veredicto con horas de antelación:**
- **Nadie clavó la lluvia fuerte de las 22.** Todos se quedaron cortos (medido 3-10 mm/h a las 22:10).
- **La tormenta la dijo ECMWF 9 km**: código 95 en la pasada de 06 UTC, para las 20 h. Llegó unas 2 h más tarde. **Corrige el veredicto de la tarde** («ECMWF 9 km se pasó»): se adelantó, no se inventó la tormenta.
- **AROME HD tuvo la energía más alta en TODAS las pasadas** (1.150-1.390 J/kg a esas horas) pero 0 mm hasta su última pasada. Gasolina sí, chispa no; y sin tapa publicada no puede disparar el aviso.
- **GFS (00 UTC)** fue el que más cerca puso el agua EN HORA (0,6 a las 22, 1,1 a las 23), pero sin energía.
- 22:26 suyo: «ya baja la lluvia» · «los truenos se alejan» · «lo que duró 20 minutos o algo más» · «poco».

## 07-10 · 15:35 — sirimiri en Bermeo

**Suyo:** «Bermeo cayendo sirimiri majo».
**La app a las 15 h (por /om):** AROME HD (dueño del agua) **0 mm**; ECMWF 9 km 0,3 mm código 51 (llovizna); ECMWF 25 km 2 mm código 61; GFS 0,2 código 51; ICON 0. **El sirimiri lo veían ECMWF y GFS; el dueño no.**
**Lo que viene (misma consulta):** 17 h AROME HD **10,4 mm** · ICON **código 95** · ECMWF 9 km código 80 → 18 h ECMWF 9 km **código 95**, ICON 4,3 mm. Tres modelos con tormenta o chaparrón fuerte entre las 17 y las 18.
- 15:53 suyo: «pues en Bermeo sirimiri» (sigue el sirimiri; AROME daba 0,6 mm a las 16 y 10,4 a las 17).
- 15:53 suyo: «me dicen que por el interior, Zalla, cae más fuerte; aquí sirimiri». Euskalmet 15:40: La Garbea (717 m, a 5 km de Zalla) 0,2 mm en 50 min, racha 56; Almike 0 mm (el sirimiri no llega al pluviómetro), Matxitxako 0,1 mm.
- 15:54 suyo: «ahora cae más fuerte» en Bermeo (AROME daba 0,6 mm a las 16 y 10,4 a las 17).
- 15:55 suyo: «y otra vez sirimiri» (el fuerte duró unos minutos, desde las 15:54).
- 15:55 suyo: «va algo fuerte unos segundos pero sigue el sirimiri» (rachas de agua de segundos, fondo de sirimiri).
- 15:56 suyo: «diría que es algo más fuerte que sirimiri» (lluvia débil, no llovizna).
- 15:58 suyo: «CAE MÁS AHORA, MÁS FUERTE» — entra la banda (AROME la ponía de 16:30 a 18:00, 10 mm/h a las 17).
- 16:01 — sus capturas del mapa (AROME HD e ICON-EU, 17:00) y del satélite (15:30): CAPE AROME **870** en Bermeo, 804 Bilbao · tapa ICON **0** · tope convectivo ICON **11.240 m** (más que Lekeitio, 10.640) · base convectiva **260 m** (Sollube, 665 m, dentro de la nube) · lluvia AROME 10 mm/h. AEMET hasta las 15:00: 4 descargas a < 100 km, la más cercana a **87,7 km** (Santander, 14-15 h). La pareja «CAPE de AROME + tapa de ICON» daría aviso de tormenta para las 17 h.
- 16:16 suyo: «aquí ya flojo, sirimiri cae».
