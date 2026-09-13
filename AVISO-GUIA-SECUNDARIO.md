# Aviso de METEO -SECUNDARIO sobre la Guia

---

## 29-08-2026 · CUATRO COSAS EN LA GUIA (METEO -SECUNDARIO)

Medido sobre **v2026.08.29-0016**, bajando `index.html` y `app.js` publicados.
Acotando el trozo de la Guia entre «Chuleta de capas» y «Ninguna de estas
capas mide rayos»: **10.777 caracteres**.

### 1 · LA CHULETA NO LLEVA NINGUNO DE LOS DOS NUMEROS QUE DECIDEN

```
'700' dentro de la Guia -> 0 veces
'75'  dentro de la Guia -> 0 veces
```

Y sin embargo, en el codigo:

```
CAPE_COMBINACION = 700
TAPA_ABIERTA     = 75
'por debajo de 75' -> 10 veces en el resto de la app
```

**La hoja que Aitor imprime y le pasa a la cuadrilla no lleva ni el 700 ni el
75.** Lleva estas bandas:

| CAPE | lo que dice la chuleta |
|---|---|
| <300 | nada |
| **300-1000** | **posible** |
| 1000-2000 | seria |
| >2000 | fuerte |

**El 700 cae partiendo esa banda por la mitad.** Un CAPE de 400 y uno de 900
son «posible» los dos, y el segundo es el que dispara la regla de la app. Lo
mismo con la tapa: la chuleta explica «150 = tapa fuerte» y el signo de
AguaceroWx, pero **no dice el 75**, que es el liston de verdad.

**Es la unica pantalla pensada para llevarse encima y funcionar sin
cobertura**, y es justo donde faltan los dos numeros.

### 2 · LA GUIA MANDA A LAS CAPAS Y EL CODIGO DICE QUE NO

En la Guia, literal:

> **Nubes bajas %** — Las que tapan la torre. **Usa esta, no "Nubes total".**

Pero en la pestaña Torre, la propia app explica que **ECMWF y AROME HD no
publican las capas**: su total es el dato del modelo y **las capas son una
cuenta que hace Open-Meteo con la humedad** (`CAPAS_PROPIAS`:
`ecmwf_ifs025: false`, `meteofrance_arome_france_hd: false`).

Y el comentario del propio codigo, sobre por que ahi no se recomienda a ciegas:

> *«decirle "fiate de las capas" seria mandarle a lo calculado por delante de
> lo publicado»*

**La Guia hace exactamente eso, y sin distinguir modelo.** Con ICON, GFS y
ARPEGE el consejo es bueno; con ECMWF y AROME HD le manda al numero
calculado. Basta una coletilla: *«y con ECMWF y AROME HD ojo, que esas capas
no son suyas: ahi el bueno es el total»*.

### 3 · LA CHULETA VA EN KT Y EL DECIDE EN KM/H

```html
<b>Ráfagas</b><span>kt</span>
<b>Viento 10 / 20 / 50 / 100 m</b><span>kt</span>
```

Dentro de la Guia: **`kt` 2 veces, `km/h` 1 vez**. Sus topes son **45 y 60
km/h** — o sea **24 y 32 kt**. En la hoja que se lleva al monte tiene que
convertir de cabeza. Su regla, dicha el 27-08: *«aqui siempre kilometros hora
socio»*. Si el mapa publica en kt, que la chuleta ponga los dos.

### 4 · Menores

- **Hueco en la escala del Indice de elevacion**: «+3 o mas · nada» y luego
  «0 a −2 · ojo». Un +1 o un +2 no caen en ninguna banda.
- **«Activar avisos en este movil»** sale igual en el Mac. Y «Avisos apagados
  en este movil» junto a «2 moviles activados» se lee como que se contradicen,
  aunque sea correcto.

### Y una observacion de fondo, que no es un fallo

**EL ORDEN** de la chuleta es: 1 rafagas · 2 indice y CAPE · 3 radar ·
4 rocio e isocero. **Esta montado para subir a la torre.** Pero el propio
Aitor lo dijo el 28-08: *«el 90 % de las ocasiones vas a las casetas o
equipos intemperie que estan a pie»*, y ahi lo que manda es **si llueve**
—por sobretension en los fusibles y por agua entrando en los armarios—, no la
racha. En esa hoja la lluvia no aparece hasta el punto 3 y como «¿esta
cayendo AHORA?», que es otra pregunta distinta de «¿va a llover cuando abra
el armario?».

**Merece pensarse un segundo orden, el del 90 %.** No lo toco yo: es tuyo.
