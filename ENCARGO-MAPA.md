# ENCARGO · repasar los diez modelos del mapa

**De Aitor, 28-08-2026 a las 21:30:** *«entrar y comprobar que cargan bien los
modelos»* · *«empiezas por lluvia»* · *«izquierda a derecha»* · *«que lo haga el
otro chat, dale trabajo»*.

Lo escribo aquí porque **no consigo alcanzar a esa sesión**: sus mensajes me
llegan, mis respuestas rebotan. `claude-c9` se queda con la lentitud de Euskalmet.

## Orden exacto, de izquierda a derecha

Selector `.mbtn[data-tm]` en la pestaña **Mapa**:

| # | `data-tm` | botón |
|---|---|---|
| 1 | `ecmwf_ifs` | ECMWF HRES · 9 km · 15d |
| 2 | `meteofrance_arome_france_hd` | AROME HD · 1,3 km · 2.1d |
| 3 | `dwd_icon_d2` | ICON-D2 · 2 km |
| 4 | `meteofrance_arpege_europe` | ARPEGE · 11 km · 4.3d |
| 5 | `dwd_icon_eu` | ICON-EU · 7 km · 1.3d |
| 6 | `knmi_harmonie_arome_europe` | HARMONIE · 2 km · 2.4d |
| 7 | `ncep_gfs013` | GFS · 13 km · 16d |
| 8 | `ecmwf_ifs025` | ECMWF 25 km · 6d |
| 9 | `ncep_gfs025` | GFS 25 km · 16d |
| 10 | `dwd_icon` | ICON global · 0,125° · 7.5d |

**Capa: empezar por «Precipitación».** Si da tiempo, repetir con «Nubes total»
y «Ráfagas».

**OJO con ICON-D2:** su dominio **no cubre Euskadi**, se queda al norte. Que
salga vacío sobre Bermeo **es lo correcto**, no un fallo. Lo dice su propio
`title`.

## Qué anotar por modelo

1. Si dibuja o no.
2. Segundos hasta que desaparece el cartel «Cargando…».
3. El texto de la barra de abajo: modelo · resolución · pasada · nº de pasos.
4. Si aparece `#mapFallos` — el cartel rojo de sin memoria.

## Cómo entrar

Su Chrome **ya tiene la sesión abierta y la ha dejado abierta a propósito**.
Con las herramientas de Chrome, a `https://weather-app-ochre-one-76.vercel.app`.

**NO tecleéis su código de acceso.** Él lo ofreció y yo me negué; con su sesión
ya autenticada no hace falta.

## Lo que YA está comprobado — no lo repitáis

- Le han cargado bien hoy: **Precipitación** (11 s), **Reflectividad** e
  **Inhibición** (3 s) con ECMWF HRES; **Temp. 850 hPa** con ICON-EU (5 s).
- El OOM de las 21:03 fue con **ECMWF HRES + Nubes total** y media Europa en
  pantalla. La protección hizo lo que tenía que hacer.
- **El slider YA no carga mientras se arrastra.** `app.js:9241`: el evento
  `input` solo mueve la etiqueta de la hora, y `change` —al soltar— es el que
  pinta. Esa mitad estaba hecha desde antes; el mensaje que mandasteis
  proponiéndolo iba con información vieja.

Última publicada: **2026.08.28-2124**, 286 pruebas en verde.

---

## HECHO — 29-08-2026, 22:05, por METEO -SECUNDARIO

Entrado por su Chrome, con su sesión ya abierta (**no se tecleó ningún código**).
Versión durante la prueba: de la `-2142` a la `-2226` — **estaba publicando cada
pocos minutos**, y eso recargó la página dos veces a media medición. Los tiempos
de abajo hay que leerlos con eso puesto.

### 1 · PRECIPITACIÓN NO SIRVE HOY, y conviene apuntarlo

El encargo decía «empieza por lluvia». **Hoy no llueve en toda España**: los
valores sobre las ciudades salen **0** en todas y la capa de precipitación es
**transparente**. El mapa sale en blanco **y es correcto**.

Con una capa a cero no se puede distinguir «cargó y no hay nada» de «no cargó».
**Se repitió con Ráfagas**, que es lo que dice el propio CLAUDE.md: *«elige
Ráfagas, que siempre tiene valores en todas partes»*.

### 2 · UNA FALSA ALARMA MÍA, y la digo entera

En la primera pasada medí **los mismos seis valores** con ECMWF, AROME e
ICON-D2 y **0 teselas nuevas**, y estuve a punto de cantar el fallo del 24-08
—«la barra dice un modelo y enseña otro»— en el mapa.

**Era falso.** Repetida la prueba con calma, **los valores SÍ cambian**:

```
ECMWF HRES   57 teselas nuevas   7 11 9 14 15 8 20 15 16 21 …
ICON-D2       0 teselas nuevas   6 9 18 11 27 11 11 14 7 18 …
GFS 25 km     0 teselas nuevas   (sin valores)
```

La primera medición leyó los números **antes** de que se actualizaran. **Mi
método estaba mal, no la app.**

### 3 · LO QUE SÍ QUEDA ANOTADO

- **GFS 25 km no pinta ni un valor** sobre las ciudades con Ráfagas. Los otros
  sí. Merece mirarse.
- **ICON-D2 y GFS 25 km no piden teselas nuevas** aunque los números cambien.
  Puede ser caché legítima; no lo he podido cerrar con la página recargándose.
- **`torre.teselasALaVez` está en `1`**, el mínimo. Eso significa que su
  navegador **ha sufrido OOM al menos dos veces** y la app bajó la concurrencia
  y **lo recordó**. Con 1 tesela a la vez el mapa le va lentísimo, y **de ahí no
  sube solo nunca**. Convendría que se recuperase con el tiempo, o al menos
  decírselo.
- **Cuatro fallos guardados en `torre.fallos`**, los cuatro del 28-08 y el
  mismo: `pintar mar · Cannot set properties of null (setting 'innerHTML')`, en
  cuatro versiones distintas.

### 4 · LO QUE FALTA

Los diez modelos **uno a uno con Ráfagas y la página quieta**. Con él publicando
cada cinco minutos no se puede cronometrar nada. **Media hora sin deploys y se
cierra.**

## PRIORIDAD 1 NUEVA (31-08, 18:05) — FLUIDEZ DEL CURSOR DE TIEMPO

Suyo, moviendo el deslizador con Windy al lado: *«que tire de un color a
otro; este va como una patata y tarda»* · *«joe qué rápido es Windy»*.

La diferencia es estructural (Windy sirve PNGs precocinados; nosotros dato
crudo .om decodificado en cliente) y NO se renuncia al dato crudo. Pero hay
margen real:

1. **Precargar el paso t+1** (y quizá t−1) en cuanto termina de pintar el
   actual: al mover el cursor, el .om ya está bajado y el cambio de color
   es casi inmediato. Cuidado con la memoria: precargar UNO, no la serie
   (el OOM del 23-08 vino de encadenar).
2. Valorar caché de los últimos 2-3 pasos decodificados (¿lo hace ya la
   librería con clearBlockCache? medir antes).
3. Medir SIEMPRE en su patrón real: mover el cursor 5-6 pasos seguidos en
   ECMWF 25 km e ICON-EU.

Contexto ya hecho hoy (no repetir): castigo de teselas con caducidad y
levantado una vez; ICON-EU por defecto; auto-cambio si HRES tumba dos veces;
escalas nuevas tempc y t850.
