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
- 18:59 suyo: «está lloviendo bien a ratos en Bermeo desde las 17 h».
- 19:25 suyo: «cae bien» · «y sigue tirando bien» (lluvia fuerte que sigue pasadas las 19).

## 07-10 · balance de la lluvia de 15 a 18 h (hecho a las 19:30)

Medido: AEMET por hora (por /estaciones?historia=10; horas 14Z+15Z+16Z = 15 a 18 h). Previsto: la app por /om (última pasada de cada modelo, celda de tierra; horas 16+17+18).

| sitio | medido | AROME HD | ECMWF 9 km | ECMWF 25 km | ICON | GFS |
|---|---|---|---|---|---|---|
| Matxitxako | 1,2 | 15,2 | 4,4 | 6,4 | 5,8 | 2,5 |
| Forua | 6,6 | 8,9 | 5,6 | 6,4 | 6,4 | 2,7 |
| Bilbao aeropuerto | 21,2 | 7,6 | 5,8 | 5,7 | 8,9 | 2,4 |
| Amorebieta | 20,2 | **17,4** | 7,2 | 6,4 | 9,5 | 2,2 |
| Güeñes | 19,2 | **18,5** | 6,7 | 5,7 | 7,2 | 2,3 |

**Quién se acercó:** AROME HD en Amorebieta, Güeñes y Forua (el único que dio cantidades de 15-20 mm, que es lo que cayó). Falló en el sitio: se pasó en Matxitxako (15 frente a 1) y se quedó corto en Bilbao (8 frente a 21) — la banda cayó unos km más al sur/oeste de donde la ponía. ECMWF (9 y 25 km), ICON y GFS: todos en 2-10 mm donde cayeron 20. Windy dio lo mismo que la app (AROME 10-12 mm en Bermeo, ECMWF 3-4).

## 07-10 noche → 08-10 mañana (AEMET por hora, consultado el 08-10 a las 07:11)

| estación | 18-20 h (17Z+18Z) | 20 h a 08 h | total |
|---|---|---|---|
| Matxitxako | **9,2** | 0,8 | 10,0 |
| Forua | 11,0 | 2,2 | 13,2 |
| Bilbao aeropuerto | 8,1 | 3,4 | 11,5 |
| Punta Galea | 5,0 | 0,7 | 5,7 |
| Güeñes | 16,2 | 9,5 | 25,7 |

- El chaparrón de la costa fue de **18 a 20 h** (sus «llueve bien desde las 17» y «sigue tirando bien» a las 19:25), no de 16 a 18 como lo ponía AROME: en Bermeo llegó con unas 2 h de retraso sobre el modelo.
- **Noche de 21 a 23 h:** ECMWF, GFS e ICON daban 4,5 mm en Bermeo; AROME, seco. Medido: Matxitxako 0, Forua 0,4, Bilbao 0,3-0,5. **Acertó AROME.**
- Lo pendiente del 06-10 (rayos de AEMET de 21 a 22 h): ya no se puede leer; el catálogo de AEMET guarda 24 h y no se miró a tiempo.
- 08-10 07:50 suyo: «Bermeo lloviendo bien ahora».
- 08-10 10:12 suyo: «Vitoria capital, lloviendo sirimiri, algo más» · «12 grados» (de camino a Anda). App a las 10-11 h: AROME 0,1-0,5 mm, ECMWF 9 y 25 km 0,2 con llovizna (51), GFS 0,1-0,3 llovizna, ICON 0,3 chubasco. Todos aciertan: sirimiri o algo más.

## 10-10 mañana: nubes en Laredo y Bermeo (suyo, desde el MacBook)

- **Antes de las 08:43** él veía en Windy (ECMWF 9 km) «sin nubes hasta las 14» en Laredo y el
  mapa nuestro tapado. El iMac aclaró la rampa a las 08:43 (nada hasta el 25 %, blanco del 70 %).
  A las 09:12 las nubes pasaron a interpolación monótona, para quitar los cuadros.
- **09:15, suyo:** «ojo que aquí hay nubes» · «el acierto, de momento, el nuestro». Laredo a las
  09 h: ECMWF 9 km 100 % (66 baja), AROME baja 100 %, ECMWF 25 km 71 %, GFS 100 %, ICON 46 %.
- **09:50, suyo:** «Bermeo 100 % cubierto; a la mañana había menos nubes y más claros» · «a esta
  hora tapado» · «sin agua».

| Bermeo | 08 h | 09 h | 10 h |
|---|---|---|---|
| ECMWF 9 km | 84 (44) | **100 (100)** | 71 (48) |
| ICON | 81 (56) | **100 (58)** | 60 (45) |
| GFS | 22 (0) | 60 (5) | 92 (46) |
| AROME HD (baja; no da total) | 100 | 89 | 21 |
| ECMWF 25 km (el que manda en el cielo) | 52 (20) | **38 (22)** | **25 (23)** |

Total % (baja). **A las 09-10 aciertan ECMWF 9 km e ICON; ECMWF 25 km, el que manda en el cielo
de la app desde el 05-10, da 25-38 % con el cielo tapado.** A las 08 h («menos nubes, con
claros») se acercan más ECMWF 25 km y GFS. Por mirar: Laredo a las 11-13 h (ECMWF 9 km da 37 ·
20 · 27 %; ICON 53 · 83 · 89 %).
- **11:37, Laredo, su foto desde el coche:** cielo azul con velo alto fino (cirros,
  una estela) y nubes bajas solo en el horizonte, sobre los montes. Ni rastro de nube baja encima.
  A las 11 h daban: ECMWF 9 km 37 % (23 baja) · ECMWF 25 km 16 % (25 baja) · ICON 53 % (22 baja)
  · GFS 100 % (todo alta) · AROME HD baja 0, media y alta 100. **Aciertan ECMWF 9 y 25 km** (poca
  nube, la que hay alta y fina). AROME y GFS lo tapan con nube media o alta que desde el suelo es
  un velo. El mapa con ECMWF HRES y la rampa de las 08:43 lo pinta casi limpio, como Windy.
- **12:14, Bilbao, suyo: «Bilbao igual»** (cielo azul con velo alto, como Laredo). A las 12 h daban:
  ECMWF 9 km 23 % (22 baja) · ECMWF 25 km 39 % (18 baja) · ICON 58 % (40 baja) · GFS 100 % (0
  baja, todo alta) · AROME HD baja 32 %. A las 11 h, AROME daba 100 % de nube baja: falló. **Otra
  vez acierta ECMWF 9 km.** Para la tarde, ECMWF 9 km sube la nube baja a 55-95 % desde las 13-15 h.
- **Suyo: «solo Bermeo estaba con nube».** Laredo y Bilbao, azul con velo; Bermeo, tapado (09:50).
  Para Bermeo de 10 a 12 h, ECMWF 9 km daba 71 · 100 · 100 % e ICON 60 · 73 · 96 %, frente al 23-41 %
  de ECMWF 9 km en Bilbao y Laredo. **El contraste entre sitios lo vio ECMWF 9 km;** ECMWF 25 km
  (25-44 % en Bermeo) no lo separó.
- **16:13, Ajo (Cantabria), suyo:** «hay más nubes desde hace 2 horas» · «diría que un 80 % de
  nubes, a 90». O sea, nube desde las 14 h aproximadamente, al 80-90 %. Daban, de 14 a 16 h:
  ECMWF 9 km 100 % (baja 76 · 99 · 100) · ECMWF 25 km 100 · 100 · 98 (baja 53-56) · ICON 87 · 97
  · 95 (baja 69-80) · GFS 54 · 1 · 6 · AROME HD baja 3 · 6 · 99. **Aciertan ECMWF 9 y 25 km e
  ICON** (entrada de nube baja a las 13-14 h). GFS y AROME la daban casi limpia hasta las 16 h.
  ECMWF 9 km ya lo daba esta mañana: «100 % de nube baja desde las 14 h».
- **Ajo, más suyo:** «sin agua» · «nubes blancas, no grises» · «pero bastante cubierto». Los
  cinco modelos daban 0,0 mm de 13 a 17 h: **aciertan todos en el agua.** Nube blanca de buen
  tiempo con el cielo bastante tapado, que es justo como la pinta el mapa desde las 14:19 (blanca,
  sin el gris de las trazas).
- **Ajo, 16:30, suyo:** «hay como resol». Bastante cubierto, pero con nube fina que deja pasar
  el sol y deslumbra. No es el cubierto gris y cerrado que se leería en un «100 % de nube baja»
  (ECMWF 9 km a las 15-16 h). El porcentaje dice cuánto cielo tapa, no cuánta luz quita.
- **Ajo, sus dos fotos de las 16:30:** nubes blancas y grises claras en bancos (estratocúmulos),
  con huecos de azul sobre los montes, y **sol directo**: sombras marcadas en el suelo y fachadas
  iluminadas. Calculo un 70-80 % de cielo tapado, nube baja y fina, sin agua. Cuadra con lo que
  dijo él («80 a 90 %», «resol»). ECMWF 9 km (baja al 99-100 %) e ICON (69-80 %) aciertan la nube;
  el «100 %» se queda algo alto para un cielo con huecos y sol.
- **Ajo, 17:30, sus dos fotos al aire libre:** el techo es de **altocúmulos** (nube MEDIA, en
  borreguitos blancos), que tapa un 85-90 % del cielo hacia el sol y algo más de la mitad hacia el
  otro lado, con huecos azules. Encima, velo alto fino (cirros), y nube baja casi nada. El sol
  pasa a través: de ahí el «resol». En total, unos 70-80 % de cielo tapado y sin agua.
  Capas a las 17 h (baja-media-alta): **ECMWF 9 km 29-94-85**, ICON 61-59-99, ECMWF 25 km 50-0-100,
  AROME 29-6-67, GFS 26-0-5 (total 32). **Solo ECMWF 9 km ve la capa media que hay**; ECMWF 25 km
  la pone como nube baja y alta, y AROME y GFS casi no la ven.
  **Para el texto del cielo:** con media + baja ≥ 70, `codigoVotado` diría «Cubierto», y lo que
  hay es altocúmulo fino con sol. La nube media fina no quita la luz como la baja cerrada. Lo dejo
  apuntado para quien toque el cielo (ver PARA-EL-IMAC-10-10.md, punto 2).
- **Ajo, 17:41, otra foto suya:** la misma capa de altocúmulos en bancos, unos 75-85 %
  con huecos azules y sol directo (casa iluminada, sombras en la calle). Sin agua. Confirma lo de
  las 17:30.
