# TRASPASO · App Torre de Aitor

## ⬛ LO DE HOY, 03-09-2026 — LÉELO SI TE ESCRIBE DESDE EL MÓVIL

Está entrando desde el móvil por Remote Control y **su sesión del móvil no
tiene el hilo de la mañana**. Si te habla de «esto», «lo de las nubes» o
«el arreglo de la agenda», es de aquí. Esto es lo que pasó, en orden:

**1. El cielo, medido contra su ojo y sus fotos.** A las 07:48 mandó tres
fotos desde Askatasun Hiribidea 29, Bermeo, con hora y coordenadas: capa
uniforme gris azulada de lado a lado, sin un claro. A las 07:00 los modelos
daban — **ECMWF 94 %** (clava), ICON 71 % (corto), **Automático 9 %** y
**GFS 0 %** (fallan de lleno). La lluvia la clavaron los cinco: 0 mm, y él
dijo «sin agua». Está apuntado en `data/campo.md`.

**2. La agenda familiar tenía el tiempo mal.** `agenda-familiar` pedía a su
app pero **sin decir el modelo**, así que Open-Meteo le daba el Automático.
Medido: racha 0,5 km/h de diferencia y temperatura 0,1° —da igual— pero **el
símbolo del tiempo no coincidía ni una hora de 24**. A las 07:00 la agenda
decía «despejado» y su app «cubierto». Arreglado: el código de tiempo —ahora,
por horas y por días— se pide a `ecmwf_ifs025`, que es de donde lo saca su
app. Publicado.

**3. Las mareas, nuevas en la agenda.** Las dos siguientes desde la hora que
sea, de la tabla **oficial de Euskalmet** por la misma puerta (`/mareas` de
su app). Comprobado clavado contra su app: pleamar 09:16 · 3,95 m.

**4. En la app de torres, publicado hoy:** el punto colgando de las franjas,
el aviso de capas que ya no salta cuando las capas son calculadas, la chapa
del CAPE movida a la Guía con su enlace, y el buscador ya no enseña dos veces
el mismo emplazamiento (4 fichas repetidas de 2.692; las otras 30 son dos
operadores en el mismo punto y NO se tocan).

**5. RESUELTO hoy 04-09 a las 07:05 — el almacén.** Vercel sacó el Blob del
plan gratuito y el 01-09 dejó `avisos-aitor` en «Billing State: Inactive»:
`/api/campo`, `/api/torres` y la agenda daban 403. Él dijo «no pago nada», así
que se ha mudado a **Upstash Redis, plan Free** (`almacen-aitor`, fra1,
Eviction OFF), conectado a los dos proyectos. Él hizo los clics guiado paso a
paso; yo no creo cuentas.

**Cómo quedó el código:** las trece llamadas sueltas al almacén pasan por
**una puerta** (`lib/almacen.mjs`: el QUÉ) sobre **un motor**
(`lib/motor.mjs`: el DÓNDE). El motor elige solo por las variables
`KV_REST_API_*`; sin ellas vuelve al Blob. Guardias en las dos apps que no
dejan publicar un `api/` o un `lib/` que importe `@vercel/blob` por su cuenta,
las dos vistas en ROJO. `prueba-motor.mjs` (17 comprobaciones) arranca el
motor contra un Upstash de mentira, y antes de publicar se probó contra el
Redis real: 7 de 7.

**Lo que se perdió:** citas de la agenda y notas de campo anteriores a hoy.
Estaban dentro del Blob suspendido. Todo arrancó limpio.

**8. LA REVISIÓN DE ARRIBA ABAJO — noche del 04 al 05-09.** Él, harto: *«revisar
si os da la gana la app de arriba abajo»*. Se hizo con 12 áreas en paralelo y
cada hallazgo contra dos escépticos: **134 → 66 confirmados, en 7 clases**.
Está entero en **`REVISION-2026-09-04.md`** (247 KB): informe por clases,
huecos de cobertura y los 66 uno a uno. **Léelo antes de tocar nada.**

Arreglados esa misma noche los cuatro con los que decía empezar:
- `S.parteDia === 'mañana'` **nunca era cierto** desde mi cambio de la mañana →
  «Sin lluvia HOY» bajo el parte de otro día. Ahora viaja `S.parteDiaFecha`
  y la cabecera compara `salto`. Regla: **nunca comparar contra texto de
  presentación.**
- Los dos dibujos de «10 días» rotulados «mañana»/«tarde» con el corte
  suelto (8:00-19:00) → ahora `rot(manana)`/`rot(tarde)` = las horas reales.
- `tu listón es ${R.listón}` crudo → `wtxt(R.listón, true)`.
- AEMET: `.then(x => x.json())` sin `x.ok` → `S.medidoSinAemet` + cabecera de
  cuatro estados. Y `assess()` emite `'nd'` si falta lluvia o CAPE en todos los
  perfiles (antes solo viento, solo torre).

**Y lo peor que salió, sin buscarlo:** en `pruebas.js` el recuento y el
`process.exit(1)` estaban en la línea 6371 y **todo lo añadido detrás desde el
30-08 (73 asserts) se imprimía pero no podía vetar**. El total pasó de 863 a
**936**. Movido al final, y `revisar.sh` vigila que siga siéndolo.

**Segunda tanda, 05-09 01:30-02:00 — hechas y publicadas:** clase 2 entera
(`porAbismo` en `avisoCielo`, `duenoLluvia()` en la franja, `quienLoMide` para
el dueño del cielo), clase 4 entera (casilla de ráfaga con `difVista`,
`deQuien` y el semáforo de viento/ráfaga/dron comparan **lo que se imprime**:
59,6 se ve «60» y es NO), clase 5 (`wtxt` con coma), clase 6 (oleaje con
`mxReal`, Avisos cuenta antes de recortar) y el ⚡ del día con su hora. Cinco
reglas nuevas en `NO-SE-TOCA.md`. Total de la suite: **949**.

**QUEDAN — clase 3 y clase 7**, y son las gordas: `rellenoFallo` que nadie
lee (app.js ~2983) y el «Nada llega a tus listones» sobre horas sin rellenar;
`renderSea` que dice «no está en la costa» cuando el marine falló; `pintarHilo`
que borra el hilo entero con un 500; `sw.js` que se traga los 404 del
precacheo; `satelite.js` que inventa horas por aritmética. Y toda la clase 7:
**Radar se pide una vez por sesión y nunca se refresca**, Leaflet desde unpkg
(sin cobertura no hay radar), las ocho `netlify/functions` con
`netlify-cdn-cache-control` que Vercel ignora (el `stale-if-error` de mareas no
existe), `rayos.js` cae entero si falla Canarias, `foto.mjs` con el `if (i < 0)
i = 0` gemelo del de campo, `importarSitios` registra la COTA como altura de
trabajo, `calibrar.mjs` sigue contando al Automático, cámaras de Windy sin
cortacaché, y `middleware.js`/`lib/`/`api/*.js` fuera de ESLint. Con línea y
escenario en `REVISION-2026-09-04.md`. Empezaría por Radar (su pestaña de
«¿está cayendo AHORA?») y por las cabeceras de Vercel (una función
`cabeceras(ttl)` en `lib/` para los ocho).

**7. El MAPA, 04-09 por la noche — resuelto y con guardia.** `map-tiles.open-meteo.com`
**desapareció del DNS** (NXDOMAIN); no era un corte. Estuve siete horas diciendo
«volverá solo». Ahora `TILES_DIRECTO`, los dos proxys `omtiles` y
`prueba-mapas.mjs` apuntan a **`openmeteo.s3.amazonaws.com/data_spatial`** (el
origen que usa la librería oficial; CORS `*`, Range 206, los 9 modelos). Ojo:
`maps.open-meteo.com` es su web y da 200 con HTML a cualquier ruta — falso
positivo; `data-spatial.open-meteo.com` da 403 sin Referer de open-meteo.com.
Comprobado en el navegador con la capa de temperatura pintada y valores leídos.
`prueba-mapas.mjs` corre en cada publicación y **no deja volver al host muerto**.
Lección: un 502 de horas se mira con `nslookup` antes de esperar.

**6. Visto de refilón y sin mirar:** el Centro Operativo saca un error en
rojo, *«No se pudo actualizar desde la fuente automática: Failed to fetch»*.

**Sus reglas de hoy, que son nuevas:** el orden es **lluvia → CAPE → viento**
(él: «para mí la lluvia es lo más»); las horas van de reloj («a las 22:00»),
nunca «+1 h»; el color solo cuando una cifra cruza SU listón; y nada de
párrafos donde caben números.

---

**Estado al 27-08-2026, 16:35.** Empezado por claude-6e, al día por claude-e4.

> Orden suya: *«si se te satura ese chat, pásale la info al otro chat fijado
> llamado METEO-SECUNDARIO»*. Esto está aquí y no en un mensaje entre
> sesiones a propósito: **un chat saturado ya no puede escribir a nadie**, y
> las sesiones mueren sin avisar. El fichero se queda.

---

## LO PRIMERO, ANTES DE TOCAR NADA

**Con esta app se decide si sube gente a una torre.** Palabras suyas del
26-08-2026: *«nos jugamos la vida, esta app no es por diversión, es por
obligación y precaución»*. Un dato mal dicho con seguridad es peor que decir
«no lo sé».

**Su veto es el RAYO**, no el viento: la torre está pegada a la caseta y hace
de pararrayos. Con viento va. Con sirimiri va a la caseta pero **no sube a
mástil ni a torre** — los cuadros de intemperie mojados no se tocan.

**Antes de publicar:** `./revisar.sh` (sintaxis + ESLint + arranque real + 130 pruebas) y
`./deploy.sh`, que además recorre el camino del «sí» de los avisos y falla si
no llegan. `deploy.sh` sube la carpeta ENTERA: gana el último que publica, así
que **avisa a las otras sesiones antes de tocar `app.js`**.

---

## SI ESTE CHAT SE ATASCA — orden suya, 27-08-2026

*«Si se atasca el chat, pasa la info a METEO SECUNDARIO, al otro chat. Y
seguiríamos allí de lo malo.»*

Todo lo que hace falta está en ficheros, no en la conversación: este
TRASPASO, `.claude/PERMISOS.md`, `data/campo.md` y el `CLAUDE.md` del
proyecto. **Léelos antes de tocar nada.** Un chat lleno ya no puede avisar.

### Y ESTO ES LO QUE NO PUEDE FALLAR NUNCA

1. **Él solo refresca la app.** Todo lo demás corre solo: el parte de las
   06:30 desde el servidor, el vigilante, los avisos al móvil.
2. **Antes de publicar: `./revisar.sh`.** Son CUATRO puertas — sintaxis,
   ámbitos, **arrancar la app de verdad** (`abrir.cjs`) y 93 pruebas. La
   tercera se puso el 27-08 porque le llegaron TRES fallos en una mañana
   que ni la sintaxis ni el linter cogían. **Nunca publiques sin ella.**
   **Y NUNCA ESCRIBAS UNA RUTA CON EL ESPACIO.** Hay dos enlaces sin
   espacios y todo va por ahí: `/Users/aitor/CLAUDE` y
   `/Users/aitor/vigilante`. Una ruta con espacio obliga a comillas o a
   `\`, y eso le saca un diálogo de permiso que **ningún ajuste tapa**.
   Si él no está delante, la tarea se queda parada. Ver `.claude/PERMISOS.md`.
3. **Míralo abriéndolo**, no leyendo el código. `node abrir.cjs` monta la
   app con datos reales en dos escenarios: sin cobertura y con cobertura.
   El fallo del 27-08 solo salía **con** cobertura.
4. **Mira su buzón al empezar:**
   `curl -s "https://weather-app-ochre-one-76.vercel.app/api/campo?n=20"`
   Puede haber mandado algo desde el monte que nadie ha visto.

## NO TOQUES ESTO SIN LEER (26-08-2026, 21:40)

**La clave de los avisos está ahora en DOS sitios y hay un orden para
arreglarlo. Si te lo saltas, `probar-avisos.sh` se queda sin clave.**

- Ruta vieja (la que usa `probar-avisos.sh` HOY):
  `~/.claude/scheduled-tasks/vigilante-tormenta-aitor/clave-avisos.txt`
- Ruta nueva, ya copiada por la sesión del vigilante:
  `/Volumes/SSD EXTERNO/CLAUDE/vigilante/clave-avisos.txt`

**El orden es:** primero se cambia el script para que lea la ruta nueva, se
comprueba que `./probar-avisos.sh` sigue dando las cuatro en verde, **y solo
entonces** se avisa a la sesión del vigilante para que borre la copia vieja.
Nunca al revés — si se borra la vieja con el script todavía apuntando ahí, nos
quedamos sin poder comprobar si los avisos salen, justo el día que haya que
comprobarlo.

## PENDIENTE (por orden)

1. **GitHub Actions sin estrenar.**

   **DÓNDE VIVE, que esto no está en ningún otro sitio.** NO está en este
   repositorio ni en ninguna carpeta del disco: está en un repositorio de
   GitHub **de su cuenta personal**, creado por él mismo el 26-08-2026.

   | | |
   |---|---|
   | Cuenta | `pentxa-design` |
   | Repositorio | **`vigilante-torres`** · privado |
   | Fichero | `.github/workflows/vigilante.yml` |
   | Secreto | `CRON_SECRET` (Ajustes → Secretos y variables → Comportamiento) |
   | Cadencia | `0 */3 * * *` — cada 3 h, más un botón para lanzarlo a mano |
   | Qué hace | `GET` a `/api/vigilante` con `Authorization: Bearer $CRON_SECRET` |

   **LA FORMA EXACTA, que hay dos y solo una está en el YAML** (comprobado
   el 27-08-2026 leyendo el fichero publicado; yo lo tenía apuntado mal):

   ```
   curl -s --max-time 120 -w '\n%{http_code}' -H "Authorization: Bearer $CRON_SECRET" https://weather-app-ochre-one-76.vercel.app/api/vigilante
   ```

   **`GET`, no `POST`. `Authorization: Bearer`, no `x-clave`.** El endpoint
   acepta las dos cabeceras —está así en `vigilante.mjs`— pero si alguien
   monta un cron externo copiando el método equivocado se queda sin
   vigilante y no se entera. Un `GET` sin `?pulso=1` corre la pasada
   entera; con `?pulso=1` solo devuelve la hora y no hace falta clave.

   **Cómo se sabe si ha pasado GitHub o el Mac** (que es la pregunta que
   importa, porque el pulso se mueve igual con los dos):

   | | cuándo corre, en hora de Bermeo |
   |---|---|
   | **GitHub** (`37 */3 * * *`, en **UTC**) | 02, 05, 08, 11, 14, 17, 20 y **23**, en el minuto **:37** |
   | **La tarea del Mac** (local) | 00, 03, 06, 09, 12, 15, 18 y 21 |

   **No coinciden en ninguna.** Una pasada a las :37 de una de esas horas
   **es GitHub, seguro**. Cualquier otra es el Mac.

   Hay una copia del YAML en `/Volumes/SSD EXTERNO/CLAUDE/vigilante-github/`.

   **No llegó a correr: GitHub tuvo un major outage de Actions esa tarde**
   (comprobado en githubstatus.com, «Actions: major_outage»). Cuando se
   recuperen: pestaña **Comportamiento** → *Vigilante de tormentas* →
   *Ejecutar flujo de trabajo*. Y comprobar que la llamada llega de verdad
   mirando la fecha de `avisos/vigilante.json` en el Blob — no basta con que
   GitHub lo dé por bueno.
2. **Su iPhone sin apuntar.** Solo tiene el Android. Cada aparato va por
   separado: Avisos → «Activar avisos en este móvil» → «Enviarme uno de
   prueba».
3. **Los avisos de TORMENTA van por push Y por correo, siempre.** No quitar el
   correo sin que lo decida él. Motivo: de un push que sale bien no hay forma
   de saber si le ha sonado, y el vigilante existe para cuando NO está mirando
   la app.

---

## LO DEL 27-08-2026 (última versión: `2026.08.27-1631`)

- **El modelo no lee tu sitio, lee tierra firme.** Lo mayor del día. La app
  enseñaba CAPE 20 para ECMWF en Bermeo cuando ECMWF daba **1.110** en
  Bermeo: leía un nudo a **18,3 km**, monte adentro. Lo destapó él con los
  mapas de superficie de AguaceroWx. Detalle entero en `CLAUDE.md`.
- **El parte dice a qué hora se calculó**, y canta en rojo si es de ayer.
- **La altura de la nube suma al aviso y nunca lo baja** — medido: tres de
  cinco casos que rompieron NO tenían tope publicado.
- **El sirimiri ya no es solo de costa**: le chispeó en Vitoria, a 45 km del
  mar. Tercer episodio, y en dos de los tres **ninguna estación lo midió**.
- **Icono nuevo** (brújula con sol y nube), sin torre a propósito: la del
  Centro Operativo ya es una torre azul y se confundían.
- **Los diálogos de permiso, cortados de raíz.** Ver `.claude/PERMISOS.md`.

## LO QUE SE MONTÓ EL 26-08

**En la app** (última versión publicada: `2026.08.26-1916`)
- Orden fijo de sus torres, **de Bermeo hacia fuera** (43,4209 / -2,7215), en
  el parte y en el semáforo. **Prohibido reordenar por gravedad** — hay dos
  pruebas que bloquean el deploy. Motivo suyo: si el orden baila hay que
  releer la lista entera.
- **«HA CAMBIADO desde que lo miraste»** dentro del parte, por día.
- **Avisos al móvil** con su lista para releerlos, y contador «N móviles
  activados» en rojo cuando hay cero.
- La ficha de la torre **ya no calla el agua** que ve otro modelo.
- **Tres comparativas modelo a modelo** en Mapa: ráfaga, lluvia y tormenta.
  Sin promediar nunca: el desacuerdo ES la información.
- «Ahora» con color solo donde hay un listón detrás.
- Foto de portada filtrada y puntuada por hora y tiempo.

**En el servidor** (Vercel; almacén Blob `avisos-aitor`; variables
`VAPID_*`, `AVISOS_CLAVE`, `CRON_SECRET`). Funciones en `.mjs` a propósito:
las `.js` de `api/` corren en Edge y `web-push` necesita Node.
- `/api/parte` — cron diario 06:30. **Ya no depende del Mac.**
- `/api/vigilante` — el vigilante entero. Probado con tres pasadas: avisa la
  primera, se calla la segunda con el mismo tiempo, y caza el cambio de
  ventana. Le falta quién lo llame cada 3 h (punto 1).

---

## TRAMPAS QUE YA HAN PICADO

- **UTC. Tres veces.** `claveDia()` y la hora del vigilante van en hora local.
  Con `toISOString()` la medianoche de aquí es el día anterior allí, y eso
  dejó una función muerta sin dar un solo error.
- **Probar solo el camino del «no».** El guardado de suscripciones estuvo roto
  y no se cogió porque se probó dos veces el rechazo y nunca el acierto. Lo
  encontró él en su propio móvil. De ahí salió `probar-avisos.sh`.
- **El punto ciego del modelo.** El Automático en Euskadi es AROME HD y **no
  publica la tapa ni el código de cielo**. Con él solo salían 0 avisos el día
  que ICON daba 8 de 10. Todo lo que decida algo lee VARIOS modelos.
- **Un hueco callado se lee como un no.** Si un modelo no publica la tapa, hay
  que escribir «no lo sabe», no dejarlo en blanco.

---

## SUS DATOS DE CAMPO

Va a ir pasando medidas hechas en el sitio, día a día. **Es lo único que dice
si la app acierta**; lo demás es comparar un modelo con otro.

Se apuntan en **`data/campo.md`**, con lo que midió él, lo que decía la app en
ese momento, y qué se cambió por eso. Ya están dentro el del Oiz (racha 26,4
medida contra 26,3 de la app) y el de Bermeo (sirimiri que solo vio ECMWF).

## PENDIENTE · LAS CÁMARAS: FALTAN, Y NO ES EL RADIO (02-09-2026, 18:40)

Suyo: *«en cámaras me faltan muchas en la app, ni San Sebastián tengo»*, con
capturas de Windy enseñando **ocho o más cámaras solo en Donostia** (Catedral
del Buen Pastor, Paseauku Berria, Noroeste, playa de La Concha, Miramar
Gardens, Teledonosti, Paesi Baschi…).

**MEDIDO antes de dejarlo, y el resultado descarta lo obvio:**

    /webcams?lat=43.413&lon=-2.718&radio=60   → 40 cámaras · 0 de Donostia
    /webcams?...&radio=100                    → 40 cámaras · 0 de Donostia
    /webcams?...&radio=150                    → 40 cámaras · 0 de Donostia

**El radio no cambia NADA.** Siempre 40. O sea que no es que Donostia caiga
fuera del círculo: es que **algo topa la lista en 40** y el parámetro no se
está aplicando —o Windy lo ignora, o la función no lo pasa, o hay un `limit`
fijo—. Hay que mirar `netlify/functions/webcams.js` antes de tocar el radio,
que era lo que yo iba a hacer y habría sido el arreglo equivocado.

Él lo dejó para después. **No empezar por subir el radio: empezar por saber
de dónde sale ese 40.**

### §8 · tercera tanda (05-09-2026, 01:36, build 2026.09.05-0136) — publicada
Clases 3 y 7 del informe, lo pequeño que se leía como calma. Publicado y comprobado en producción con grep (todos presentes) y con `/rayos` (PB 24 marcos, CN 24) y `/api/campo` 200:
- `pintarHilo`: un 500 o un corte ya NO borra el hilo; se queda lo último leído y avisa encima (`.hilo__caido`).
- Pestaña Mar: solo dice «no estás en la costa» con un 4xx; con 5xx/corte dice que el modelo marino no ha contestado (`S.marFallo`).
- Radar: al volver a la pestaña se vuelven a pedir fotogramas si tienen >5 min y se centra en el sitio actual (`Radar.refrescar`, `cargarFotogramas`). **No visto en navegador esta noche** (el candado pide el código y no lo tecleo yo): cubierto por prueba de texto; verlo con él o desde su móvil.
- `leerLineaSitio`: «413 m» a secas es cota (`cota`), altura de trabajo solo con `h` delante (`h45`, `h 30 m`).
- `rayos.js`: Canarias opcional; si AEMET no da sus límites, la península sale igual.
- `campo.mjs`/`foto.mjs`: sin la hora en el modelo se devuelve `sinHora`, no la de medianoche.
- 8 pruebas nuevas (6 en pruebas.js, 2 en pruebas-servidor.cjs), vistas en rojo; 6 filas en NO-SE-TOCA.md. **El guardia de NO-SE-TOCA corre ahora justo antes del recuento** (antes no veía las pruebas de después del 30-08).

Descartado con medida: el cortacaché de las cámaras Windy (la imagen ya manda `max-age=150`, se renueva sola); y `calibrar.mjs`/vigilante siguen con el trío `best_match, icon_eu, gfs_seamless` porque el Automático es ARPEGE y publica CAPE y tapa: quitarlo no arregla nada y cambia el vigilante.

**Queda de la revisión (para hacer con luz):** `rellenoFallo` sin leer + «Nada llega a tus listones» con horas sin rellenar; `sw.js` precache que se traga un 404; `satelite.js` inventa horas; cabeceras `netlify-cdn-cache-control` que Vercel ignora (mareas sin stale-if-error) → `cabeceras(ttl)` común en lib/; Leaflet desde unpkg y `API.rain` directo en Radar; `middleware.js`, `lib/` y `api/*.js` fuera de ESLint; omtiles fuera de prueba-fuente-caida. Detalle en REVISION-2026-09-04.md.

### §8 · cuarta tanda (05-09-2026, 06:16, build 2026.09.05-0616) — publicada
Lo que quedaba de la revisión, hecho con un workflow de 24 agentes (5 implementadores por grupo de ficheros, 1 de ESLint, 12 revisores adversarios, 3 correcciones, 3 segundas vueltas) y cableado a mano. Comprobado en producción con curl:
- **Huecos que mentían** (`assess()`): en el perfil de caseta, una ráfaga a null sin comparativa que la rescate es SIN DATO; con cualquier 'nd' no sale «Nada llega a tus listones»; `f.rellenoFallo`/`rellenoFallaDesde` se pintan en «Ahora» (`notaRellenoFallo`). **Él lo verá**: en «Mis torres» las horas en que el modelo no publica ráfaga pasan de verde a SIN DATO.
- **Leaflet local** en `vendor/leaflet/` (1.9.4 oficial, sha256 db49d009…5641a) y `API.rain` por `/om?api=rain` (300 s). Sin `unpkg.com` en app.js. Deploy comprueba los dos ficheros.
- **Service worker**: un 404 del casco no bloquea la instalación; se reintenta, se apunta en `./__faltan.json` y se avisa (`precache-faltan`); la app lo revisa al arrancar mirando cada fichero en la caché (`revisarCasco`/`avisarCascoIncompleto`); `avisos-recibidos` sobrevive a la versión (SW y `comprobarVersion`); renovación de suscripción con la clave del servidor. 48 pruebas en `prueba-sw.cjs`.
- **Satélite**: sin horas futuras; la última hora se comprueba con GetMap (502 o PNG en blanco de 96 B → se retira); la barra y «ahora» de satélite/AEMET van por sus fotogramas, no por los índices del modelo. Medido en prod: 12 horas por capa, última 03:45Z, 0 futuras.
- **Cabeceras de Vercel**: `lib/cabeceras.mjs` única puerta; los 8 intermediarios + `api/omtiles.js` (el que corre de verdad para /omtiles). Medido: `cdn-cache-control` sale en todos (om elev s-maxage=2592000, mareas 10800 + stale-if-error=86400, omtiles 120, satélite 420, rain 300). **stale-if-error: se manda, Vercel no lo promete** (sus dos páginas se contradicen).
- **ESLint y revisar.sh** cubren ya middleware.js, lib/*.mjs, netlify/functions/*.js y api/*.js. **omtiles** en prueba-fuente-caida (netlify y api).
- 25 filas nuevas en NO-SE-TOCA.md (solo nombres literales); el guardia conoce los 9 ficheros prueba-*.

**Pendiente / para mirar con él:**
- `api/vigilante.mjs:758 noPudeLeerElEstado` y `:1207 noSeGuardo`, `api/euskalmet.mjs:67 API` y `:287 apunta`: variables asignadas y nunca usadas; huelen a avisos que se calculan y no se dicen. El vigilante no se ha tocado.
- El catálogo del satélite se lee una vez por sesión de mapa (`_satCat`): «ahora» puede tener más de una hora si el mapa lleva abierto un rato.
- Pestaña Radar con Leaflet local y el radar refrescado: no vistos en navegador (candado); verlo con él.
- Sin servidor (fichero local) `API.mar` vale undefined (`directo` tiene `mar`, `via` pide `marine`): solo afecta a abrir index.html a pelo.

### §9 · 13-09-2026, la vuelta de Calpe (en curso)
- Aitor trabajó del 05 al 13-09 en el portátil sobre una COPIA de la web publicada (rama `portatil-2026-09-07` de `pentxa-design/meteo-aitor`, 73 commits, guion en `PARA-EL-DOMINGO.md`). Casa NO estaba en git: hoy se ha creado el repo de seguridad (`a0c29da`) y la copia `~/casa-antes-portatil-20260913-1847.tgz`; el clon está en `~/portatil-2026-09-07`; los seis ficheros de casa eran idénticos a la base `e5ab019` → vía 6A (`git am -3` de los parches, script `scratchpad/domingo-paso-6A.sh`). **Pendiente: aplicar los parches** (el guardián del modo automático lo bloquea; espera a Aitor), luego pruebas de casa (romperán varias: tocan `codigoQueSeVe`, franjas, `renderDays`…), sello, publicar, iPhone.
- **Vigilante, arreglado y publicado (build 2026.09.13-1901):** el sello `cuando` solo se escribía si el estado cambiaba o cada 20 h (herencia de la cuota del Blob); el pulso de la app resucitaba al vigilante en cada apertura pasadas 4 h y cada pasada mandaba «He estado X h sin vigilar» (10-09, 18:55/57/58) y la CPU de Vercel al 180 %. Ahora se escribe cada pasada (>25 min), una pasada resucitada no se repite en 20 min (`x-revivido`, `globalThis.__ultimaPasadaVigilante`) y `noSeGuardo`/`noPudeLeerElEstado` salen en la respuesta. Medido: a las 17:03Z el pulso ya daba `haceMin: 1`.
- Quedan del guion: §11 (avisos que gritan por todo: horas pasadas, «de 18h a 18h», «por encima» con igual, uno por pasada, silencio 23-06), §15 (Vercel Usage y previews de `meteo_aitor_bermeo`: cuenta de Aitor), guardián de nombres repetidos en revisar.sh, tarea `repaso-diario-meteo` 07:15/23:15, CORS opcional para Pages.
- **19:28, publicado el build 2026.09.13-1928 con los 55 parches del portátil** (commit `1b9eb7d`, etiqueta `publicado-20260913`). Los tres sellos coinciden en la web; /api/torres, /om y data/torres-copia.json contestan 200. El banco de casa: 33 pruebas fallaban porque buscaban la implementación vieja (cieloPartido, codVisto crudo, listones 45/60 de S.thr, «al principio/después», HRES de fábrica…); se actualizaron a las reglas nuevas del portátil, con fecha y su porqué (listonRafaga en caseta 49/70, tramos con hora, ICON-EU de fábrica, un icono por tramo, dirNivel), y un fallo real del portátil se arregló en la app (`h.gust ?? 0` al buscar la hora de la racha máxima). El banco carga ahora las 35 funciones nuevas desde app.js (bloque «LO QUE TRAJO EL PORTÁTIL» al principio de pruebas.js). `revisar.sh` lleva el guardián de nombres repetidos de primer nivel (§12 del guion). Comprobado en navegador contra producción (Sollubemendi): BUILD 1928, `comprobarCielo()` → [], icono grande = primera tarjeta de Horas, 20 emplazamientos, cuatro franjas con Madrugada, consola sin errores, sin NaN.
- **19:41, build 2026.09.13-1941: los avisos del vigilante (§11 del guion).** Sin avisos de horas ya pasadas (un tramo de hoy acabado antes de h0 no es cambio); «a las 18h» en vez de «de 18h a 18h» (`tramoTxt`/`rangoTxt`); la racha dice «llega a tu listón de 70» si iguala y «por encima» solo si supera; un aviso por pasada con «N torres» en el título y hasta seis en el cuerpo; horas de silencio 23:00-06:00 (solo `importante`: tormenta inminente, racha de 70, «sin vigilar»; lo demás se calla y lo cuenta el parte de las 06:30). 5 pruebas nuevas en pruebas-servidor.cjs (vistas en rojo) y 5 filas en NO-SE-TOCA.md.
- **cron-job.org SÍ llama cada media hora** (visto en su consola a las 19:55 desde el Chrome de Aitor: trabajo «Vigilante Aitor Meteo» activo, todas las ejecuciones de hoy y ayer con 200 OK y 7-8 s; a las 19:30, 859 ms). Lo que parecía «parado» era el sello sin escribir. Con el sello arreglado entra en juego la cadencia adaptativa del 01-09 (`huecoPrevio < 55` y nada en marcha → se salta la pasada de la media hora): en día tranquilo, una pasada completa por hora y el sello se mueve cada hora; con algo en marcha, cada media. La app pinta «NADIE VIGILA» a los 240 min, así que cuadra. Efecto secundario bueno: la CPU de Vercel baja a la mitad en días tranquilos (antes, con el sello viejo, la regla nunca saltaba y todas las pasadas eran completas).
- Creada la tarea programada `repaso-diario-meteo` (07:15 y 23:15, solo mira y cuenta) según §9 del guion; ojo: `revision-aitor-meteo` la apagó él el 31-08 por gasto, así que si le sobra, se apaga esta.
- 20:15: los previews de la rama del portátil en meteo_aitor_bermeo ya están pausados (lo hizo Aitor/portátil). Queda solo mirar en Vercel → Usage cuándo se reinicia la cuota.
- **21:07, build 2026.09.13-2107 (suyo, esta noche):** fuera el silencio de 23-06 —«trabajo de día y de noche, los avisos las 24 horas»— y cadencia que sube sola en `api/vigilante.mjs`: verde (nada apuntado) una pasada cada 2 h, ámbar (rayo, agua o racha apuntados) cada media, rojo (rayo de hoy por delante, racha de 70 por delante o tormenta ya avisada) cada cuarto. El portero es `cadaMin = { verde: 115, ambar: 25, rojo: 10 }`; su ojeada a mano (`mirar=1`) y la ventana del parte nunca se saltan.
- **OJO, el cuarto de hora todavía no es verdad:** cron-job.org está puesto **cada media hora** (visto en su consola a las 19:55), así que el rojo sale cada media, no cada cuarto. Para que lo sea hay que bajar el trabajo «Vigilante Aitor Meteo» a 15 min en cron-job.org (cuenta suya). Apuntado también en el comentario del código para que no mienta.
- **21:45, build 2026.09.13-2145: la pantalla decía una cadencia que ya no existía.** El cartel del pulso seguía con «lo lanza cron-job.org cada media hora» y «Debería hacerlo cada 3 horas» (lo apuntó la revisión del 04-09 y seguía igual): con el verde de 2 h, un hueco normal se le leería como avería y cuatro horas como UNA pasada perdida cuando son dos. Arreglados los tres textos de `textoPulso`/`PULSO_MALO` en app.js y los comentarios que mentían en `api/vigilante.mjs` (el marcador ya no son 48 rondas al día: un día tranquilo da ~12) y en `api/parte.mjs` («sigue dependiendo del Mac», que es falso desde cron-job.org). Guardia nueva de clase en pruebas-servidor.cjs (177 bien, 0 mal) y fila en NO-SE-TOCA.md: el cartel no puede nombrar una cadencia que el vigilante no tenga. `revisar.sh` entero en verde (960 + 152 + …), publicado y comprobados los tres sellos.
- **21:07, builds 2058 y 2107 (vigilante):** cadencia por niveles decidida en cada llamada de cron-job.org — verde (nada apuntado) cada 2 h, ámbar (rayo/agua/racha apuntados) cada media, rojo (rayo de HOY por delante, racha ≥ 70 por delante o tormenta ya avisada) cada cuarto; y SIN horas de silencio (suyo: «trabajo de día y de noche, avisos las 24 h»). Para que el rojo sea de verdad cada cuarto, **cron-job.org tiene que llamar cada 15 min** (hoy 30): lo cambia Aitor en Editar → Programación. Gasto estimado: mes normal < 1 h de las 4; con diez días de tormenta, ~2 h.
- **Seguir el chat desde el iPhone:** esta sesión es local (`isRemote:false`, de antes del interruptor «Conectar nuevas sesiones a Control remoto», que ya está activado en el iMac). Solo una sesión NUEVA (Bifurcar o Nuevo) sale en el móvil. El iMac no se duerme (reposo 0 con corriente, y la app lo sujeta). Para fotos y medidas desde el monte sin chat: la nota de campo de la app (/api/campo, con foto) y la tarea `mensajes-de-aitor`, que se vuelve a encender cada media hora de 07 a 21.

### §9b · 22:25, pedidos de Aitor para el chat del iPhone (serene-dahl), tras revisar ocho pantallazos del build 2145
Todo cuadra entre pestañas (Ahora = Horas = franjas = 10 días, comprobado hora a hora). Lo que quiere que se haga, en sus palabras: *«si una ve despejado y otra lo mismo pero GFS ve algo de lluvia, pues se pone "despejado, pero GFS ve algo de lluvia de 10 a 12"; eso es lo que quiero»*.
1. **Franjas**: el chip `lluviaEnLaFranjaQueNoVesTu` ya dice «GFS sí (1,2 mm, de 06:00 a 10:00)» desde el 09-09; que salga SIEMPRE que otro modelo vea agua y el titular esté seco, con sus horas, y pegado al titular («Despejado · GFS ve algo de lluvia de 10 a 12»), no solo cuando cruza el listón.
2. **10 días**: «solo ECMWF ve agua (2,4 mm)» → añadir las horas («de 22 a 03») y, si caen fuera de las 6-20 h que dibuja el día, decir «de noche» (viernes 18: tarjeta con 2,4 mm y dibujos secos).
3. Franjas cortas (< 4 h) con cielos distintos (Noche 22-23: 22 limpia, 23 velo): decir «Despejado · velo de nubes altas desde las 23:00» en vez de quedarse con la más tapada.
4. Sensación 23° con aire 22° sin decir «1° más»: comparar lo que se imprime (redondeado), como se hizo con las rachas el 04-09 (`difVista`).
Reglas de siempre: nada inventado, km/h, coma, prueba en rojo antes de publicar, deploy.sh.
5. **«Así con todo»** (Aitor, 22:28): la regla es general, no solo la lluvia. Cada dato se queda como lo da el modelo cargado y, AL LADO, se dice qué ve distinto otro modelo y a qué horas: lluvia («GFS ve algo de lluvia de 10 a 12»), racha («ICON da 62 de 14 a 16»), tormenta («GFS ve tormenta a las 15»), nubes («AROME ve nubes de 8 a 13»), temperatura («GFS da 33° a las 15»). Información, no veredicto: el dibujo y el número no cambian. Ya existen los chips de racha, tormenta y nubes en franjas; falta que lleven horas todos y que estén en franjas, Horas y 10 días por igual.
- **22:30: los puntos 1-5 de §9b los hace la sesión APP METEO -PRINCIPAL (iMac), orden de Aitor «hazlo». El chat del iPhone NO toca app.js hasta que esa publicación salga (se apuntará aquí).**
- **22:50, publicado §9b (build 2026.09.13-2236), commit a6df9b3.** El chat del iPhone puede volver a tocar app.js.
- 22:47: cron-job.org «Vigilante Aitor Meteo» pasado a cada 15 min (*/15 * * * *) por Aitor. El rojo ya es de verdad cada cuarto de hora; en verde el vigilante sigue saltando las llamadas hasta las 2 h.
- **22:58: regla fija «nada de parches diarios» (memoria nada-de-parches-diarios.md) y publicado el aviso de cambio por franja (build 2026.09.13-2254): «Ha cambiado a las HH:MM: antes despejado» cuando el cielo de una franja cambia respecto a lo pintado antes, por aparato y modelo (LS cieloFranjas, local a propósito). 7 pruebas nuevas, 2 filas en NO-SE-TOCA.
- 23:05: cazado en producción y corregido antes de que lo viera él: el voto de modelos (segundos después del primer pintado) salía como «ha cambiado». Ahora cambioDeCielo compara solo entre bajadas distintas (S.data.at). Build 2026.09.13-2301.
- 00:10 (14-09): falsa alarma del 2301 cazada por el portátil («Ha cambiado a las 23:54» con el antes y el ahora de la misma bajada, 3 s de diferencia). Causa: S.data.at es reloj y la app pinta varias veces por bajada (copia guardada, fresca, voto). Ahora la bajada es fc.current.time, no se apunta nada antes del voto, y no se compara si la franja perdió horas. Prueba con el caso exacto. Build 2026.09.14-0007. **Mapa:** publicado a las 00:01 que el origen de teselas se elige por carrera de velocidad (S3 directo 2,6 s vs Vercel 0,5 s desde el iMac). Queda para el 14-09 lo gordo de la lentitud (15 s por capa), con las pistas del portátil: caché de bloques 8 MB→128 MB en Mac, precargar hora actual de viento/racha/reflectividad, cambio de hora sin rehacer capa, cronómetro antes/después; objetivo < 3 s por capa en Mac con ICON-EU.

### §10 · 14-09-2026, mañana: el mapa «va muy lento todo» — causa de raíz y medida
- **Causa:** la librería del mapa abre cada `.om` con un **HEAD** y exige `Content-Length`. El borde (Edge) de Vercel NUNCA deja pasar `Content-Length` (medido: ni con el cuerpo leído entero; las funciones Node sí lo mandan, pero meterían las teselas en la cuota de CPU de 4 h). Por el intermediario, cada apertura fallaba («OmHttpBackendError: Content-Length header missing», 24 veces en dos cambios de capa) y reintentaba con esperas de 0,5-5 s. Y el directo a S3 desde su iMac va fatal: 500 ms de ida y vuelta, 1 MB en 14,6 s.
- **Arreglo (builds 0846→0905):** `api/omtiles.js` reenvía el HEAD como HEAD, copia el tamaño en `x-content-length`, y los trozos con `Range` vuelven leídos enteros, sin CDN (`cabeceras(300, {cdn:false})`, nuevo en lib) y con `Vary: Range`; la copia de la librería en `vendor/` acepta `x-content-length` como respaldo (parche de una línea, con guardia en pruebas.js para que no se pierda al actualizar); la carrera de orígenes de maps.js se corre con HEAD y descarta un origen sin tamaño. Todo en el borde: **CPU de Vercel, 0**.
- **Cronómetro (Mac, ICON-EU, zoom 5,2, caché de bloques vaciada, «pintado» = evento idle de MapLibre):** antes, directo a S3 desde el iMac: precipitación, racha y reflectividad **sin pintar en 20 s**; después, por el intermediario: precipitación **3,0 s**, reflectividad **2,9 s**, racha **8,0 s**. ECMWF HRES: sin pintar en 60 s y `Aborted(OOM)` en el navegador de pruebas — es el límite conocido del 23-08 (6,6 M de puntos), no se ha tocado; el mapa arranca en ICON-EU.
- Pendiente menor: `Peticiones.fallos` cuenta 1 por cambio de capa aunque no falle ninguna tesela (una petición abortada por la propia librería sin `ac` se cuenta como fallo); las AbortError «signal is aborted without reason» de maps.js:3573 salen en consola al cambiar deprisa (no en la barra roja). Y la racha (gusts) tarda más del doble que las otras capas: mirar por qué (¿dos variables?).
- **09:24, build 0924:** números y barbas se piden cuando el mapa ha pintado (`trasPintar`, evento idle o 6 s), no a los 500 ms; una petición abortada por la propia librería no cuenta como fallo. OJO: el commit 796fe27 decía además «3 teselas a la vez en Mac salvo HRES» y ESO NO IBA en el 0924 (el parche abortó a medias); entró en el 0945.
- **09:45, build 0945 (commit 6c21e02), cazado en producción con el mapa a la vista:** el «1 trozo sin cargar» que el portátil veía el miércoles en Reflectividad y Radar era el **calentador de capas clave** pidiendo CAPE con la URL rota: la escala «capeE» lleva mayúscula y los dos regex de la marca (`limpiarMarca`/`marcaDe`) solo admitían `[a-z0-9]` → `interpolation=linearE` → «Invalid interpolation». **La capa CAPE estaba rota entera** (17 de 24 teselas fallaban, «5 trozos del mapa sin cargar», sin color) desde que existe «capeE» (ya estaba en el estado de casa del 13-09). Arreglo: `[A-Za-z0-9_]` y una prueba que recorre TODAS las escalas declaradas (vista en rojo antes). Además: el calentador ya no suma «trozos sin cargar» (`conReintento(…, cuenta=false)`); **3 teselas a la vez en un ordenador con ≥ 8 GB declarados, 2 en móvil y en Safari (`teselasPorDefecto()`), y HRES topado a 2 en cada turno (`Peticiones.topeAhora()`)**, decidido por Aitor («lo prudente después del desbordamiento del 23 de agosto»). El castigo por OOM sigue mandando y ahora recupera hasta lo del aparato.
- **10:06, build 1006 (commit 6935182): LA CAUSA DE RAÍZ de «tarda 15 s en abrir cualquier capa».** La librería lee cada `.om` por bloques de **64 KB** y cada bloque es una petición de ~280 ms por el intermediario, una detrás de otra dentro de la descodificación: la racha de UNA tesela z5 eran 11 viajes. Medido en producción (una tesela z5 de ICON-EU, por variable, tiempo · peticiones · kB):

  | variable | 64 KB (antes) | 256 KB (ahora) | 1 MB (probado, no) |
  |---|---|---|---|
  | ráfagas | 3,0 s · 11 · 643 | 1,0 s · 3 · 513 | 0,9 s · 2 · 1025 |
  | viento u (barbas) | 3,4 s · 13 · 772 | 1,3 s · 4 · 769 | 0,9 s · 2 · 1025 |
  | CAPE | 1,7 s · 6 · 322 | 0,7 s · 2 · 257 | 0,3 s · 1 · — |
  | precipitación | 1,0 s · 4 · 193 | 0,6 s · 2 · 257 | 0,7 s · 2 · 1025 |
  | abrir la hora (temp, fichero frío) | 3,1 s · 10 · 579 | 2,4 s · 5 · 1025 | 1,7 s · 3 · 2049 |

  Se queda en **256 KB × 128 bloques = 32 MB** (antes 8 MB): mismos bytes en las capas pesadas, un tercio de viajes; 1 MB no gana tiempo y dobla los bytes (en el móvil cuestan). Se cambia en `maps.js` antes de la primera tesela con `getProtocolInstance()` + la misma clase de caché de la librería; guardado en pruebas (la nuestra y la firma del vendor). Confirmado en producción tras publicar (hora T1700, fichero frío): ráfagas 1,3 s · 4 · 769 kB, CAPE 1,05 s, precipitación 0,84 s, abrir la hora 2,1 s.
- **Cómo se ha medido y cómo NO:** los tiempos de «capa pintada» (evento idle de MapLibre) salían falsos porque el panel del navegador del iMac estaba **oculto** (Aitor en el iPhone): con el panel oculto no hay rAF y el idle no llega («sin idle en 16 s»), o llega tarde (racha 8,9 s, 13,5 s). Lo fiable es medir el mecanismo con `fetch` (PerformanceResourceTiming: peticiones y kB por variable), que es lo de la tabla. Memoria `medir-tiempos-navegador.md`.
- **Queda:** HRES como está (decidido). El proyecto se queda en el SSD externo (Aitor: «prefiero que se quede en ssd externo», «no lo hagas»); él ha quitado «poner en reposo los discos» en Ajustes. La sesión del iPhone (serene-dahl) murió («se eliminó el entorno de esta sesión»); desde las 09:50 Aitor sigue ESTA sesión (APP METEO -PRINCIPAL) desde el iPhone.

### §11 · 14-09-2026, 10:30-11:10: sus cuatro pantallazos del 1006 («siempre algún error de ahí, pasa a diario lo mismo»)
- **Corriente «1,2 m/s» en Mar y en Sol y aire (build 1058, commit 72c1867):** la API marina da `ocean_current_velocity` en **km/h** (`current_units` lo dice) y la app lo etiquetaba m/s sin convertir: cuatro veces más. Cazado por Aitor y el portátil. Clase arreglada: TODAS las magnitudes del mar (ola, periodo, agua, fondo, viento, corriente, marea) se imprimen con la unidad que trae la respuesta (`unidadMar`), y si la fuente cambia una unidad se dice en pantalla (`avisoUnidadesMar`/`notaUnidadesMar`), como la presión en hPa del mapa. Prueba con una muestra REAL (`pruebas-datos/marina-bermeo-2026-09-14.json`) vista en rojo antes. Nada de nudos: sus números van en km/h (regla suya). Comprobado en producción: «Corriente 1,2 km/h».
- **La tarjeta de 10 días mezclaba tres orígenes sin decirlo (builds 1058 y 1105, commit 72c1867 y siguiente):** el % de ECMWF con los mm de AROME («75 % · 0,0 mm» el martes), los mm por acierto, y los días de más allá enteros de ECMWF; y el chip repetía el mismo dato con otro redondeo («1,7 mm» arriba, «solo ECMWF ve agua (1,6 mm)» abajo —los dos de ECMWF—; el 1,7 era ECMWF HRES por acierto y el 1,6 ECMWF 25 km). Clase: `queFaltaba(D)` apunta ANTES de rellenar los días sin previsión y los campos que el modelo no publica (`f.rellenoDias`, `f.rellenoCampos`); `origenDelDato(fc, campo, dia)` dice de quién es cada cifra (por acierto → relleno del día → campo no publicado); la tarjeta pinta el modelo del día bajo la fecha (`dcard__m`) y el de cada cifra al lado (`dcard__de`: «75 % ECMWF · 0,0 mm»); el chip de agua (`textoAguaNoVenTodos`) dice lo que ven LOS DEMÁS respecto al modelo de la tarjeta, sin repetir su número («agua de 09:00 a 14:00 · ICON y GFS, secos»). El 1105 corrige que `sunrise`/`sunset` (vienen todos los días, son astronomía) hacían pasar por «con datos» un viernes entero de ECMWF. Cuatro pruebas nuevas vistas en rojo; filas en NO-SE-TOCA.
- Lo demás de los cuatro pantallazos cuadra hora a hora (franjas = Horas = 10 días: temperaturas, viento, rachas y sus horas, CAPE y «lo peor a las»). OJO: los datos de la tarjeta se guardan en el aparato; con datos viejos (antes del 1058) las etiquetas no salen hasta pulsar «Actualizar» o que se refresque solo.

### §12 · 14-09-2026, 14:55-15:30: el mapa «no se ve nada ni el mapa» — nueve pantallazos suyos y el guion del portátil (`~/Desktop/mapa-para-el-imac.txt`)
- **Lo que vio:** Reflectividad HRES «pixelado»; Ráfagas, Viento 10 m, CAPE, Inhibición, Isocero, Temperatura («¿el mar amarillo?»), T850 y Presión «todo pintado sin verse las ciudades, España», «no se distingue nada»; Agua precipitable «debe de estar en lluvia y se ve mal»; ECMWF HRES «mucha espera» (14-15 s, un rectángulo pintado) y «que si falla la memoria mal» (OOM con punto de rocío, como el 25-08).
- **Builds 1508 → 1519 → 1526 (commit 5f450c2), la clase, no capa a capa:**
  1. **La costa por encima del color** (`costaEncima()`: el contorno del agua del propio fondo CARTO, línea oscura en Claro/Color y clara en Oscuro, re-puesta en cada `apply()`), **opacidad por defecto 0,75** (era 0,95). Los nombres y las fronteras ya iban por encima; faltaba la costa.
  2. **El «no pasa nada» es transparente:** ráfagas < 10 km/h (alfa 0 → 1 en el listón de 45), CAPE < 100 (alfa 0 → 0,9 en 300), tapa 0 (alfa 0; el pie dice «SIN COLOR es tapa CERO» en vez de «ROJO es tapa CERO»). Lluvia y reflectividad ya lo eran.
  3. **Reflectividad con `color_blend=true`** (solo dBZ: en Ráfagas y CAPE los cortes son sus listones y tienen que verse como saltos).
  4. **Agua precipitable → grupo Lluvia**, escala propia `agua` (0-60 kg/m², transparente hasta 10).
  5. **Presión por bandas de 4 hPa (976-1044)** en vez del degradado 940-1060 (todo el anticiclón de 1018-1025 salía del mismo rosa).
  6. **Isocero 0-5500 m con el rojo abajo** (escala `isocero`), en vez de -5200..5200 todo rojo en verano.
  7. **Barbas sin color de fondo** (escala `sinColor`): el color era la componente oeste-este y se leía como fuerza; **ningún modelo publica `wind_speed` en las teselas** (medido: «Primary variable wind_speed_10m not found»), así que la fuerza la dan barbas y números.
  8. **ECMWF HRES solo de cerca:** su rejilla es gaussiana reducida (6,6 millones de puntos, lo dice `latest.json`): a zoom < 6 se pinta con ECMWF 25 km, con cartel («solo de cerca… acerca el mapa»), y al cruzar el zoom 6 se repinta solo (`hresDeLejos`, `reaplicarPorZoom`). Es más que lo que pedía el portátil (avisar y cargar solo la tesela de la vista): quita la espera Y el OOM de lejos. Por defecto sigue ICON-EU.
  Todo con prueba vista en rojo antes y fila en NO-SE-TOCA (14 pruebas nuevas; 1014 en verde).
- **Isobaras:** la librería SÍ las produce (MVT con capa `contours` y `value`, 8 KB por tesela z5 con la escala propia; medido) y MapLibre las pinta (128 trazos en la fuente, 32 en pantalla) **cuando se fuerza la recarga de la fuente** (`setTiles`); en el primer pintado salían 0. En estudio (siguiente entrada).
- **Cómo medir esto:** el panel del navegador del iMac sigue oculto (Aitor en el iPhone): las capturas de aquí no valen para «antes/después»; las suyas sí. Pedirle las mismas siete capturas del guion con el build 1526.
