# Quién acierta el cielo, medido contra el satélite

Cada tanda es una ejecución de `medir-cielo.mjs`. La referencia es el
satélite visible de EUMETSAT —una MEDIDA, no otro modelo— y lo que se
compara es LA LECTURA (despejado/pocas/nuboso/cubierto), no el
porcentaje: el brillo del satélite y el «% de nubosidad» de un modelo
no son la misma escala.

**«LEJOS» es confundir despejado con nuboso o peor.** Es su queja:
«me mosqueo cuando dice esta mañana sol y me dibuja una nube todo el
día». Un día no decide nada — hace falta una semana.

## Tanda del 2026-09-02 (18:40)

15 horas medibles, 5 emplazamientos.

| modelo | horas | clava | cerca | LEJOS |
|---|---|---|---|---|
| ECMWF | 15 | 100 % | 0 % | **0 %** |
| ARPEGE | 15 | 100 % | 0 % | **0 %** |
| GFS | 15 | 100 % | 0 % | **0 %** |
| Automático | 15 | 73 % | 7 % | **20 %** |
| ICON | 15 | 20 % | 47 % | **33 %** |
| HARMONIE | 15 | 47 % | 7 % | **47 %** |

Horas medidas, sitio por sitio:

- **BI BERMEO 16:00** — satélite 0 % claros → **despejado** · ECMWF 2 · ARPEGE 18 · ICON 69 · GFS 10 · HARMONIE 78 · Automático 96
- **BI BERMEO 17:00** — satélite 0 % claros → **despejado** · ECMWF 1 · ARPEGE 16 · ICON 58 · GFS 6 · HARMONIE 72 · Automático 87
- **BI BERMEO 18:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 15 · ICON 36 · GFS 5 · HARMONIE 0 · Automático 61
- **BI SOLLUBEMENDI 16:00** — satélite 0 % claros → **despejado** · ECMWF 2 · ARPEGE 21 · ICON 70 · GFS 10 · HARMONIE 85 · Automático 27
- **BI SOLLUBEMENDI 17:00** — satélite 0 % claros → **despejado** · ECMWF 1 · ARPEGE 15 · ICON 58 · GFS 6 · HARMONIE 79 · Automático 15
- **BI SOLLUBEMENDI 18:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 16 · ICON 44 · GFS 5 · HARMONIE 0 · Automático 6
- **BI OIZ 16:00** — satélite 0 % claros → **despejado** · ECMWF 3 · ARPEGE 14 · ICON 50 · GFS 6 · HARMONIE 35 · Automático 0
- **BI OIZ 17:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 20 · ICON 48 · GFS 5 · HARMONIE 67 · Automático 0
- **BI OIZ 18:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 12 · ICON 43 · GFS 5 · HARMONIE 0 · Automático 0
- **BI GERNIKA2 16:00** — satélite 0 % claros → **despejado** · ECMWF 2 · ARPEGE 16 · ICON 53 · GFS 10 · HARMONIE 69 · Automático 11
- **BI GERNIKA2 17:00** — satélite 0 % claros → **despejado** · ECMWF 1 · ARPEGE 20 · ICON 46 · GFS 6 · HARMONIE 70 · Automático 18
- **BI GERNIKA2 18:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 15 · ICON 35 · GFS 5 · HARMONIE 0 · Automático 4
- **VI ARBAIZA 16:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 8 · ICON 5 · GFS 6 · HARMONIE 0 · Automático 0
- **VI ARBAIZA 17:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 14 · ICON 1 · GFS 0 · HARMONIE 17 · Automático 0
- **VI ARBAIZA 18:00** — satélite 0 % claros → **despejado** · ECMWF 0 · ARPEGE 14 · ICON 2 · GFS 0 · HARMONIE 5 · Automático 0

### AVISO SOBRE ESTA PRIMERA TANDA — leerlo antes de usarla

**No sirve para decidir, y hay que decirlo:** son 15 horas **de la tarde**
(16:00-18:00 local), con el cielo ya despejado. Acertar «despejado» un día
despejado es fácil, y por eso ECMWF y ARPEGE empatan a 100 %.

**La diferencia entre los dos estuvo por la mañana** —11:00 a 13:00, cuando
ARPEGE daba 49-64 % y ECMWF 20-8— y esas pasadas del satélite ya no estaban
disponibles al lanzar esto: EUMETSAT solo publica las últimas horas.

**Lo que sí se puede leer ya**, porque es un fallo gordo y repetido:
· **ICON** falla de largo (33 % de fallos gordos) y **HARMONIE** casi la mitad.
· El **Automático** se equivoca una hora de cada cinco.

**Para que la medición valga hay que lanzarlo VARIAS VECES AL DÍA**, sobre
todo por la mañana, que es cuando los modelos se separan de verdad. Con una
sola tanda por la tarde nunca se verá la diferencia que motivó el cambio.
