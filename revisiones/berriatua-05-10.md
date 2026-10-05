# Berriatua (Markina-Xemein), 05-10-2026 — lo previsto contra lo visto

**13:10-13:12, fotos suyas** (43,2954 N · 2,4824 W): cielo azul, solo cúmulos de buen tiempo pequeños; un operario arriba de la torre.

**Lo que daba la app a esa hora (/om, celda de tierra):**

| hora | ECMWF 9 km | ICON | GFS | AROME HD |
|---|---|---|---|---|
| 13 | 14 % nubes · CAPE 790 / tapa 6 | 54 % · 300 / 8 | 13 % · 230 / 4 | CAPE 600 |
| 14 | 34 % · 1230 / 9 | 42 % · 660 / 9 | 12 % · 310 / 1 | 760 |
| 15 | 68 % · 1840 / 3 | 68 % · 720 / 8 | 12 % · 230 / 9 | 740 |
| 16 | 95 % · **código 95** · 1770 / 2 · 0,2 mm | 49 % · 400 / 27 | 11 % · 140 / 19 | 660 |

Ninguno da agua hasta las 15-16 h. Rayo medido por AEMET (6 h, < 60 km, hasta las 13:00): **0 descargas**.

**Con la regla del 04-10:** 13-15 h «puede tronar» (ámbar, pareja de ECMWF 9 km); 16 h rojo (código 95 de ECMWF 9 km). Lo visto a las 13:10 cuadra con «ahora no hay nada»; los cúmulos que se ven son los que, con ese CAPE, pueden crecer por la tarde. **Queda por ver la tarde** (15-17 h): si a las 16 h hubo célula o no.

## Bermeo y Bilbao, 15:30 (suyo: «en Bermeo calor y niebla, mucha nube baja» · «por Bilbao azul el cielo»)

| medido 15:00 (AEMET) | °C | HR |
|---|---|---|
| Matxitxako (costa) | 22,2 | 91 % |
| Forua (valle) | 25,0 | 78 % |
| Bilbao aeropuerto | 27,4 | 56 % |

| modelo en Bermeo, 15 h | °C | HR | nube baja | vis |
|---|---|---|---|---|
| AROME HD (1,3 km) | 21,0 | 89 % | **89 %** | — |
| ECMWF 9 km | 21,7 | 85 % | 30 % | 3,1 km |
| ICON | 22,5 | 81 % | 60 % | 27 km |
| **ECMWF 25 km (dueño del cielo)** | 25,1 | 65 % | **4 %** | — |
| GFS | 27,2 | 48 % | 12 % | 24 km |

El cielo de las tres webs sale de ECMWF 25 km, que en Bermeo lee un nudo 18 km tierra adentro: da el tiempo de Forua, no la niebla de la costa. AROME HD y ECMWF 9 km sí la ven. Se le preguntó si cambiar el dueño del cielo (ECMWF 9 km) o avisar la nube baja de AROME; **cerró la pregunta sin elegir: no se ha tocado nada.**

## ¿Quién acierta las nubes? Medido contra el satélite (05-10, 16:00)

Suyo: «el que acertó nubes, ponle a ese». Referencia: la **máscara de nubes de EUMETSAT** (`msg_fes:clm`, cada 15 min, guardada desde 2020; azul mar despejado, verde tierra despejada, blanco nube), en una caja de 3×3 píxeles alrededor de cada sitio. Modelo «nublado» con ≥ 50 % de nube total. Sus 21 sitios, 7 días, 176 horas, 3.696 horas-sitio (`revisiones/medir-nubes.mjs 7`; el pasado de los modelos, de api.open-meteo.com por fuera, porque /om no aguanta 21 sitios × 6 modelos × 8 días de golpe).

| modelo | acierto | ve nubes cuando las hay | ve despejado cuando lo está | costa |
|---|---|---|---|---|
| **ECMWF 25 km (el que manda hoy)** | **82,9 %** | 92 % | **51 %** | 79,5 % |
| ECMWF 9 km | 82,5 % | 92 % | 49 % | 79,2 % |
| GFS | 82,5 % | 95 % | 36 % | 79,3 % |
| ICON | 81,4 % | 96 % | **27 %** | 76,2 % |
| Automático | 80,7 % | 92 % | 40 % | 76,5 % |
| AROME HD | 80,6 % | 91 % | 42 % | 76,5 % |

**El que acierta ya es el que manda.** ICON es el que más falla cuando está despejado (lo pinta nublado 3 de cada 4 veces). Hoy en Bermeo, hora a hora contra el satélite: ECMWF 25 km 6 de 8, GFS 5, AROME HD 5, ECMWF 9 km 4, ICON 3; en Bilbao GFS 8 de 8, AROME 7, ECMWF 25 km 6, ICON 4. La niebla de las 15:00 en Bermeo solo la tenía AROME HD (89 %), pero AROME también daba 84-95 % de 12 a 14 h con el satélite limpio. No se cambia nada.

## Bermeo por la tarde (19:24, suyo: «cielo azul toda la tarde · muy poquitas nubes blancas»)

Satélite (máscara de nubes) en Bermeo: nube a las 15 y 16 h (la niebla de las 15:30), **despejado de 17 a 19 h**. Modelos a las 19 h: ECMWF 25 km **63 %** (el que pone el cielo: falla), ECMWF 9 km 15 %, ICON 5 %, AROME HD 3 %, GFS 32 %. Esta tarde (15-19 h) en Bermeo: ECMWF 25 km acertó 2 de 5; ECMWF 9 km, ICON y AROME HD, 4 de 5. En Bilbao, ECMWF 25 km 5 de 5.

Es el nudo de 18 km tierra adentro otra vez. Con 7 días y 21 sitios ECMWF 25 km sigue arriba (82,9 % frente a 82,5 % del de 9 km, empatados en la costa), así que no se cambia por un día; si Bermeo se repite, el candidato es ECMWF 9 km (el mismo europeo, que lee Bermeo a 2 km).
