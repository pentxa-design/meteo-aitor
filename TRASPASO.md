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
- **16:21-16:23, sus diez capturas del 1526 (el «después»):** la costa se ve en todas (T850, Temperatura, CAPE, Inhibición, Isocero, Base y Tope convectivos, Nubes + lluvia, Índice de elevación); donde no pasa nada, mapa en blanco. Quedaba el bloque: **MEDIDO que en ECMWF HRES (rejilla gaussiana reducida) la librería ignora `interpolation` —linear y nearest dan la misma imagen, 0 píxeles distintos—, en ICON-EU y ECMWF 25 km sí interpola.** Build 1533: degradado continuo (`ESCALAS_SUAVES`) también en base/tope convectivos, tapa, agua e isocero; ráfagas, CAPE (listones) y presión (isobaras) siguen a saltos.

### §13 · 14-09-2026, 20:00-21:00, desde el portátil (SSD enchufado allí): los bloques del mapa con su rango en la URL

Suyo, esa noche, con la app en la mano: «los mapas van muy muy lentos», «van muy lentos de siempre», «tarda horrores en cargar» (ECMWF 25 km, temperatura, «Cargando… 23 s»).

**Medido** en la app publicada (build 1630), capa ICON-EU recién abierta, con el intermediario elegido por la carrera (683 ms frente a 2291 del directo): 37 peticiones para una capa —9 catálogos, 5 HEAD, 24 trozos de 256 KB—, cada trozo 0,5-2,6 s y **todos `x-vercel-cache: MISS`**, 14,9 s hasta la última tesela. Un trozo de 256 KB al S3 directo desde Bermeo: 5,2 s (ttfb 1,5 s). Los ficheros: 32 MB por hora ICON-EU, 44 MB ECMWF 25 km.

**Causa de raíz:** el CDN de Vercel no guarda un 206 y no distingue dos peticiones por su cabecera `Range`, así que cada bloque va SIEMPRE borde → S3 → borde, para cada persona y cada vez. Y los bloques que pide la librería son siempre los mismos (alineados a 256 KB, fichero inmutable dentro de su pasada, que va en la ruta).

**Arreglo:** maps.js envuelve `fetch` solo para las URL del intermediario que acaban en `.om`: `HEAD x.om` → `GET x.om?cabecera=1`; `GET x.om` + `Range: bytes=a-b` → `GET x.om?rango=a-b`. api/omtiles.js (`bloquePorUrl`) los traduce al Range de S3 y contesta **200** con el cuerpo exacto, `content-length`/`x-content-length`, `x-rango`, y `cabeceras(86400, …)` (un día de CDN, una semana de stale). Errores (400/404/416/502) sin caché. El camino de antes (Range de verdad, HEAD de verdad, S3 directo) se queda tal cual.

Probado con `scratchpad/prueba-bloques.mjs` (25 comprobaciones contra el S3 de verdad, arrancando el manejador en Node: cabecera, bloque, último bloque parcial, rangos malos, fichero inexistente, camino viejo, y el envoltorio en un window de mentira) y tres comprobaciones estáticas nuevas en `prueba-mapas.mjs`. Lo que queda igual de lento: el PRIMER toque de cada bloque de cada hora (borde → S3). Lo que cambia: todos los siguientes, desde cualquier móvil, salen del CDN de París.

Pendiente de medir en producción tras publicar: `x-vercel-cache: HIT` en los `?rango=` a la segunda carga, y el tiempo de ECMWF 25 km temperatura. Si el primer toque sigue doliendo, el siguiente paso es calentar desde el servidor (cron) la cabecera + índice de las horas próximas de los modelos que usa, ahora que los bloques ya son cacheables.

**Publicado y medido (build 2026.09.14-2032, 20:35-20:55, desde el portátil, conexión floja de ~0,5 MB/s):**

- ICON-EU (temperatura 2 m), segunda apertura: 3,7 s hasta la última petición (antes 14,9 s). Los 13 bloques `?rango=` en 8-75 ms.
- Bloque nuevo (hora 0600 de mañana, nunca pedido): 1º toque MISS 1,0 s → 2º toque **HIT** 0,54 s (son 256 KB por esta conexión; la cabecera `?cabecera=1` MISS 454 ms → HIT 76 ms). El CDN los guarda.
- **ECMWF 25 km, temperatura 2 m, en frío** (primer usuario de esa hora): 31 bloques, 0,6-3,2 s cada uno, 16,7 s hasta el último (abre 4 horas: la que ves y las vecinas de la precarga). Eso es lo que tenía él con «23 s».
- **ECMWF 25 km, segunda apertura** (misma sesión, tras recargar la página): los 24 bloques en 8-27 ms, ninguno de red.
- El envoltorio está activo (`window.fetch.bloquesPorUrl === true`), ningún `.om` se pide ya sin `?rango=`/`?cabecera=`.

Lo que queda: el primer toque de cada bloque de cada hora sigue siendo borde → S3 (0,6-3 s). Siguiente paso, ahora que ya son cacheables: calentar desde el servidor (cron, cada pasada nueva) la cabecera + índice + bloques de las horas próximas de los modelos que él usa (ICON-EU, ECMWF 25 km, AROME HD), así el primer usuario también los encuentra en el CDN. Y medir `msHastaUltima` con cuidado: incluye precargas tardías (moveend), no es «tiempo hasta pintar».

**Ojo, un resto del deploy desde el portátil:** `probar-avisos.sh` no encontró `clave-avisos.txt` (vive en el iMac), así que el aparato de mentira «prueba automática» (endpoint `…/PRUEBA-AUTOMATICA-<epoch>`, dado de alta ~18:33 UTC) se quedó guardado en el almacén: `/api/suscribir` dice 4 aparatos. Se limpia solo en el primer envío real de `avisar.mjs` (410 → de baja). Si quieres quitarlo antes, desde el iMac: `U=… ./probar-avisos.sh` entero, que ese sí tiene la clave y lo da de baja.

### §14 · 14-09-2026, 21:00-21:50, desde el portátil: el mapa se precalienta solo al abrir la app (build 2026.09.14-2133)

Suyo: «¿para que el mapa tire más rápido? … si es para mejoras, adelante».

Por qué desde el aparato y no desde un cron: la caché del CDN de Vercel es por región; lo que pida un cron desde Alemania no calienta el nodo de París que usan sus móviles. Así que `Maps.calentar()` (maps.js) arranca a los 15 s de cargar la app, con la pestaña a la vista, y pide con la librería —misma caché de bloques de 256 KB, `ajustarCacheDeBloques()` compartida con `open()`— la tesela del sitio y sus 8 vecinas al zoom 5 de la hora actual del modelo y capa guardados. Una vez por pasada/hora/sitio (`torre.calentado`), de una en una, nunca con ahorro de datos ni 2G, y `open()` la aborta si abre el mapa antes. Fallos tragados: es un extra.

**Medido en producción** (portátil, 21:45): con ECMWF 25 km + temperatura guardados, a los 22 s de abrir la app ya estaban pedidos 1 `?cabecera=1` + 5 `?rango=` del fichero 2100Z (sello puesto). Después, tocar «Mapa»: **las 6 teselas pintadas en 2,09 s desde el clic, con CERO peticiones de bloques a la red** (ni a la caché HTTP: salieron de la caché de bloques de la librería, ya llena). Antes, ese mismo modelo en frío: 16,7 s.

Ojo para medirlo: con la pestaña OCULTA (`document.visibilityState === 'hidden'`) el precalentado no arranca, a propósito. En el panel del navegador del portátil hubo que forzar `visibilityState` a mano para probarlo.

`pruebas.js`: la prueba «cambia la caché de bloques a 256 KB antes de la primera tesela» buscaba el `new vieja.constructor(...)` dentro de open(); ahora comprueba que open() llama a `ajustarCacheDeBloques()` antes de `addProtocol` y que hay ≥ 2 llamadas (open + calentar). `prueba-mapas.mjs`: una comprobación estática más.

**Resto de las dos publicaciones desde el portátil:** `probar-avisos.sh` no tiene aquí la clave (`clave-avisos.txt` vive en el iMac), así que quedó al menos UN aparato de mentira «prueba automática» en el almacén (`/api/suscribir` → 4 aparatos a las 21:50; antes de hoy eran 3). Se dan de baja solos en el primer aviso real (410). Desde el iMac, `U=https://weather-app-ochre-one-76.vercel.app ./probar-avisos.sh` los limpia antes.

**15-09-2026, 0:44 (build 2026.09.15-0044):** `calentar()` calienta también la tesela del sitio de las DOS horas siguientes del deslizador (con `tpaso`, 3 h de fábrica), que es lo que abre el fichero (cabecera + índice). Así mover la hora tampoco espera la primera vez. Sondeo a las 0:50: los bloques de la hora en curso de ECMWF 25 km e ICON-EU estaban MISS (pasada nueva de 12Z, nadie la había abierto): el primer toque sigue costando ~1 s por bloque desde el borde; los siguientes, HIT.

### §15 · 15-09-2026, 07:50-08:05, iMac: vuelta tras cerrarse la app; la subida a GitHub, preparada
- Lo del portátil (§13-§14) estaba entero al volver: builds 2032/2133/0044 publicados (sellos locales = web), TRASPASO al día, y la agenda con su build 0036 publicado y la nota al día. El aparato de mentira del almacén ya no está (`/api/suscribir` → 3 aparatos).
- `data/cobertura.json` confirmado (6b96ad1). Remoto `origin` añadido al repo de casa (`git@github.com:pentxa-design/meteo-aitor.git`); la deploy key `~/.ssh/meteo_aitor_deploy` autentica contra ese repo (comprobado con `ssh -T`: «Hi pentxa-design/meteo-aitor!»). La clave del agente no vale y no hay `gh` instalado.
- **`git push` está en la lista `deny` de `~/.claude/settings.json` (26-08, red de seguridad que vale en todos los modos) y Claude no lo lanza ni por script.** Queda `subir-a-github.sh`: el paso 12 del guion del domingo hecho script — rama `casa-<fecha>`, nunca main, nunca `--force`; aborta si hay cambios sin confirmar o algo con pinta de clave entre lo seguido. Lo corre Aitor. Si la deploy key resulta de solo lectura, GitHub lo dirá al empujar y habrá que darle escritura en Settings → Deploy keys.
- **OJO, el repo de GitHub es PÚBLICO:** casa lleva las notas (CLAUDE.md, TRASPASO.md, REPARTO-AHORA.md, data/campo.md con su diario de campo), el correo de contacto VAPID en `api/*.mjs`, y copias sueltas que se colaron con `git add -A` (`.almacen-caido-*`, `.audit-tmp`, `.netlify/functions/*.zip`). Ninguna clave (escaneado). Si no quiere las notas públicas, o se pone el repo privado o se sacan antes de subir.
- **08:20, subido por Aitor con el script:** rama `casa-2026-09-15` en `pentxa-design/meteo-aitor`, punta f778fce, 768 objetos, 11,5 MB. La deploy key SÍ tiene escritura. La próxima vez, el mismo script: si la rama del día ya existe avanza en limpio; si no, crea la nueva.
- **12:55, PENDIENTE DE MIRAR:** `/estaciones` (AEMET) devolvió dos veces `"estaciones":[]` con `medido:true` y sin `sinClave` (12:50 y 12:54). Una lista vacía sin motivo es un hueco de los que la regla 2 prohíbe: hay que ver si AEMET no publicó la hora, si la clave caducó, o si el filtro de radio/hora se comió todo, y que la respuesta lo DIGA. Euskalmet (`/api/euskalmet`) sí contestaba (Almike y Matxitxako, dato de 11 min).
- 12:55: Aitor pidió una captura de la capa de nubes del mapa. El candado de la app (código de 6 cifras) la impide desde el panel del navegador —no se teclean códigos—; se le mandó en su lugar una rejilla de nube baja AROME HD/ICON dibujada con datos de `/om` (scratchpad de la sesión). Si vuelve a pedir capturas del mapa, o las hace él en el móvil o teclea el código en el iMac.
- **13:05, VISTO EN SU CHROME (él delante): las capas de nubes no se ven sobre el fondo Claro.** «Nubes total» de ECMWF 25 km a las 14:00 y «Nubes bajas» de AROME HD salían como un velo azul clarito sobre el mapa claro: «no se aprecia bien» (suyo). Con FONDO → Oscuro se ve perfectamente (la nube baja de AROME HD entrando por la costa, Bermeo bajo el borde, interior raso; cuadra con el satélite de las 11:45 y con Meteored). **Pendiente:** que la escala de nubes (`clouds`, `clouds_low`, `clouds_mid`, `clouds_high`, `clouds_rain`) tenga contraste sobre Claro y Color, no solo sobre Oscuro; o que al elegir una capa de nubes con fondo claro la app lo diga. Medirlo con captura antes/después, no a ojo.
- 13:05: el mapa se le abrió en ECMWF 25 km (cayó ahí desde HRES por el zoom de lejos) y a él «no le cuadraba» con lo que veía por la ventana: hoy los de 25 km NO ven la nube baja de la costa hasta media tarde (medido en /om: ECMWF 0-12 % de baja hasta las 14). AROME HD sí. Es el caso de Calpe otra vez: para nube baja en la costa, el fino.
- **13:23, builds 2026.09.15-1315 y 1323 (commits edeb029, 1dfd11a): LAS NUBES COMO EN WINDY.** Suyo, con Windy al lado en su Chrome: «mira qué bien se ve en Windy, ¿lo podrías poner en la nuestra? con esa claridad y resolución… me encanta». La resolución ya estaba (Windy pinta ECMWF 9 km = nuestro HRES de cerca; AROME HD 1,3 km). Lo que no se veía era el color de fábrica de `cloud_cover` (azul clarito) sobre el fondo Claro. Puesto: escala propia `nubes` (blanca, transparente en 0 % → 0,97 en 100 %, con `color_blend`) en las cinco capas de nubes; `sueloParaNubes()` pone bajo esas capas un fondo ocre (`sueloLayer`, background #bfae74 al 0,8, justo debajo de `water`) y el mar en azul acero (`marLayer`, fill sobre `water` #6f8aa0 al 0,85) solo en Claro y Color; en Oscuro no hace falta; se quitan con `quitarCapasDeDatos()`. Las capas de nubes van a ≥ 0,92 de opacidad (a 0,75 salían lavadas sobre el mar). Cinco pruebas vistas en rojo antes + la guardia del «color pleno» actualizada; dos filas en NO-SE-TOCA. **Comprobado en su Chrome (build 1323, Claro, AROME HD, Nubes bajas, zoom 7,4):** orden `sueloLayer, water, marLayer, costaLayer, omLayer`, nube blanca con degradado sobre mar azul acero y tierra ocre, números encima; al pasar a Temperatura el suelo se quita.
- **Lo que queda de Windy y NO se ha hecho:** las partículas de viento animadas. Es otro trabajo (una capa propia de partículas sobre el campo u/v; la librería de teselas da valores por punto, no la rejilla). Apuntado como idea, no empezado.
- **17:52-18:16, builds 1758 · 1805 · 1816 (commits 14dca7b, a986e91, 568f747): la nube se oscurece donde llueve, orden de capas arreglado, temperatura continua.** Suyo, con Windy al lado: «cuando esas nubes lleven agua o sean más oscuras, ¿las pintará?» · «blancas, negras donde pinta agua» · «verde donde lloverá» · «así quiero» · «mira capa temperatura 2m qué bien se ve». Puesto: «Nubes total» lleva `precipitation` encima con la escala `sombraLluvia` (gris oscuro desde 0,05 mm/h, verde 1-2, amarillo 4, rojo 15, morado 40; continua; `encimaEscala` en TLAYERS y en los dos `omUrl` de la capa de encima). **Fallo de orden cazado en su Chrome:** `firstLabelLayer()` devuelve la capa que sigue al último relleno, que en cuanto omLayer está montada es la propia omLayer → la capa «de encima» (omLayer2) y la costa quedaban DEBAJO de la nube (con el azul clarito de antes se veían a través; con la nube al 0,92 no). Arreglo: `encimaDe('omLayer')` para omLayer2 y `firstLabelLayer(true)` (salta las capas propias) para la costa. Orden medido en producción (1805, mié 16 06:00): `sueloLayer, marLayer, omLayer, omLayer2, costaLayer`. Temperatura 2 m y T850 con `color_blend` (tempc y t850 en ESCALAS_SUAVES). 4 pruebas más vistas en rojo antes; 1023 en verde.
- **PENDIENTE DE VER CON SUS OJOS:** la foto de mié 16 06:00 sobre Bermeo con la nube gris/verde. Mi ventana de Chrome (grupo de pestañas del extension) se quedó al ~300 % de zoom de página (viewport 471×231, el mapa a 0 px de alto) y no pude capturar; `resize_window` no lo arregla porque es zoom de página, no tamaño de ventana; el atajo cmd+0 no lo admite la herramienta. Se lo pedí a él, que la tiene delante.
- **Del otro chat** (lista «Capa Nubes + lluvia como Windy», 17:50): contestado en REPARTO-AHORA.md (arriba del todo, 18:15). NO hecho a propósito: tercera capa `cloud_cover_low` en gris (tres variables por tesela: medir memoria antes), «sin Valores» por capa (mando suyo), colores de suelo más oscuros (#6f6a40/#3b4550: lo decide él mirándolo).
- **18:23, build 2026.09.15-1823 (commit b35063a): T850 y Ráfagas como AguaceroWx.** Suyo, con sus dos pantallazos de AguaceroWx (GFS 12z, F33): «y estas quiero como AguaceroWx, compara la nuestra y la de ellos, la de ráfaga y la de temp 850». T850: rampa continua −10 (morado #5b2a86) → 30 (rojo #8f1d1d) cada 4 °C, la misma que ellos (`t8m`/`t8c`). Ráfagas: rampa continua azul → verde → amarillo → naranja → rojo → morado (0-120), **con salto seco en 49 y en 70** (dos cortes pegados 48/49 y 69/70: los listones del perfil de hierro, el que sale por defecto desde el 13-09) y el 60 (torre) como corte; calma transparente como antes. `rafagas` entra en ESCALAS_SUAVES. Las guardias de los listones (antes «45 y 60») y de la T850 («−15..31») actualizadas y vistas en rojo; 1023 en verde. El otro chat proponía además dos líneas de contorno blancas en 49 y 70: NO puesto, porque las isolíneas de la librería salen a 0 trazos en el primer pintado (medido el 14-09, §12) y una línea que a veces no está es peor que un salto de color que siempre está.
- **Sin ver con mis ojos** (mi ventana de Chrome sigue al ~300 %): la comparación lado a lado con AguaceroWx a la misma hora la hace él en su Chrome. Si algo no cuadra, primero mirar modelo y hora (AguaceroWx: GFS 12z F33 = mié 16 21:00 UTC; el mapa nuestro arranca en ICON-EU).
- **18:40, VISTO CON MIS OJOS en su Chrome (build 1823, ICON-EU, «Nubes total», zoom 6,8, mié 16 a las 05:00 y a las 06:00):** nube gris al 100 % sobre todo el Cantábrico y Bizkaia, con el núcleo gris oscuro y las manchas verdes de la lluvia entre Santander y Donostia, y la costa por encima. Se parece al pantallazo de Windy de las 06:00 (nube gris con la lluvia encima de Bermeo). La ventana de Chrome volvió a su tamaño (2440×1197) sin hacer nada: lo del 300 % era la ventana encogida, no zoom.
- **Lista del otro chat de las 18:25 («la nube gorda más densa y con el núcleo más oscuro»):** el punto 3 (lluvia verde encima, costa por encima de todo) ya está. El 1 (subir la opacidad en lo alto de la escala a 1,0) es un matiz: hoy 100 % = 0,97 × 0,92 de capa ≈ 0,89; se cambia en un minuto si él lo ve pálido. El 2 (tercera capa `cloud_cover_low` en gris) NO se pone sin medir: es una tercera variable por tesela y hora, y el núcleo oscuro ya lo da la sombra de lluvia; con HRES es memoria (OOM del 23-08). Si él, viéndolo, quiere más oscuro el núcleo, antes se prueba subiendo el gris de `sombraLluvia` (0,05-0,5 mm/h), que no cuesta una tesela más.

### §16 · 15-09-2026, 18:55-19:30, portátil (SSD en el MacBook): una capa de nubes, ráfagas como AguaceroWx, deslizador calentado

Aitor trajo el SSD al portátil con este encargo («a ver si me pones bien todo»):

1. **Una sola capa de nubes.** Sus dos capturas de las 18:30 (ICON-EU, 17:00): en «Nubes + lluvia» había verde en Cantabria y Aquitania y en «Nubes total» no, porque `sombraLluvia` solo se ponía verde desde 1-2 mm/h. Él: «sí, quítala, es lo mismo». Fuera `clouds_rain`; `sombraLluvia` con los verdes de Windy: gris oscuro solo con trazas (0,05-0,2 mm/h), verde claro desde 0,2, verde 1, verde-azulado 3, azul 8, morado 20, magenta 40. La nube (`nubes`) y el suelo ocre, como los dejó el iMac. Prueba de las «cinco capas» → cuatro, y comprueba que `clouds_rain` no vuelva.
2. **Ráfagas con la paleta de AguaceroWx** (sus capturas de las 18:13): azules hasta 48, naranja desde 48-49, rojo en 70, granate, morado. Los saltos secos en 49 y 70 y el corte en 60 se quedan (las pruebas los exigen). Temp. 850 NO se toca: el build 1823 ya lleva la rampa de AguaceroWx; lo que él vio a las 18:14 como bandas era la copia vieja de las 00:48 de su Chrome «sin conexión» (medido: su MacBook tenía la red a trompicones, 0,9 → 15,6 s la misma petición).
3. **Deslizador** («la de Temp. 850 al mover el deslizador tarda»): `precargar()` calienta las dos horas siguientes enteras, el centro de la tercera y casi la de detrás; nuevo `calentarLinea()`: con el mapa quieto 3 s, el centro de cada hora de la línea de tiempo de la capa abierta, de una en una, hacia delante y luego hacia atrás, abortable desde `cancelarPrecarga()`; y `calentar()` al abrir la app calienta también la tesela del sitio de Ráfagas y Temp. 850 para la hora actual.

Publicado con `deploy.sh` desde el portátil (ver build abajo). Medidas y comprobación con capturas, abajo. `probar-avisos.sh` vuelve a dejar un aparato «prueba automática» en el almacén (sin clave aquí).

**19:49, publicado: build 2026.09.15-1849.** Comprobado en el maps.js servido: sin `clouds_rain`, `slm` nuevo (verde desde 0,2), `rfc` con el naranja en 48-49, `calentarLinea()`, `pedir(en(3*d), [centro])` y el precalentado de Ráfagas/T850. Prueba de la precarga actualizada a la regla nueva (la de «una hora entera y el centro de la segunda» paró la primera publicación). Pendiente que Aitor lo vea con sus ojos: «Nubes total» ICON-EU 17:00 con verde en Cantabria y Aquitania; Ráfagas azul → naranja desde 48; y el deslizador de Temp. 850 tras dejar el mapa quieto unos segundos.

**19:55, CAZADO AL COMPARAR CON AGUACEROWX (portátil): la capa de Ráfagas del mapa iba 3,6 veces corta.** Con el panel abierto y el candado quitado por él, ICON-EU a las 16:00 de hoy: el mapa casi transparente y «7» en Madrid, «8» en Andorra, con la propia app dando racha 63 km/h en Bermeo. Medido contra la API a esa hora: Madrid 27,0 km/h = 7,5 m/s; Andorra 23,0 = 6,4 m/s; Bermeo 60,5 = 16,8 m/s. La tesela `.om` trae la racha en m/s (como los u/v de las barbas, que sí se multiplican por 3,6); la escala de fábrica lo convertía (`esViento` en `escala()`), pero la escala propia `rafagas` del 14-09 devuelve el valor tal cual: los cortes de 49 y 70 km/h se aplicaban a m/s (176 y 252 km/h) y el naranja/rojo no salía nunca, y los «Valores» y el clic rotulaban m/s como km/h. Arreglo de raíz (build de las 20:00): `breakpoints: rfm.map(k => k / 3.6)` (cortes en la unidad de la tesela) + `conv: v => v * 3.6` (número en km/h), el mismo conversor para color y texto, como presión y visibilidad; prueba nueva en el grupo de ráfagas. Temp. 850 y 2 m (°C), precipitación (mm/h), nubes (%) y presión (con su `conv`) no tienen este problema. **Regla para NO-SE-TOCA: toda escala propia sobre una variable de viento lleva los cortes en m/s y `conv` a km/h.**

**19:22-19:40, sus fotos de Bermeo (guardadas en el portátil, «esto para luego»):** cielo cerrado al 85-95 % de nube gris baja con un claro azul, sin llover; bandera tendida (viento ~18-20 km/h, rachas 45-50). Cuadra con la agenda de las 19:20 (franja en curso «Cubierto», viento 18-20, racha 47) y con la app de las 18:52 salvo el cielo («parcialmente nuboso» con el dato de las 18). Y su lección para el mapa: «nubes grises, por eso os decía lo de las nubes; ya no son blancas» → la escala `nubes` pasa a gris con la nubosidad total (blanca hasta el 55 %, gris claro 70, gris 85, gris oscuro 100), sin pedir la nube baja (parche preparado, se publica tras el build de las barbas).

**19:17-19:28, builds 2026.09.15-1917 y 1928 (portátil):**
- 1917: la racha de la tesela en m/s → cortes en m/s y número en km/h (ver 19:55 arriba). Comprobado en el panel: «Valores» 24·19·56·33… km/h a las 16:00 (antes 7·8) y la costa cantábrica en naranja (≥ 48).
- Suyo, 19:11, con el mapa delante: «Cargando Ráfagas… 34 s», «las barbas de viento no las pone, ni dirección, y está marcado Barbas». Dos causas: (a) mi precarga del build 1849 (dos horas enteras + la línea de tiempo de seguido) le robaba las descargas a la capa visible — vuelve a lo medido (una entera + centro de la siguiente) y `calentarLinea()` solo con la capa pintada, 12 pasos por delante y 6 por detrás, una hora cada 0,5 s, abortable; (b) las barbas en Ráfagas estaban apagadas desde el 01-09 («State not found»): la causa real era la MARCA de escala (`escala_propia=sinColor`) que `omUrl()` mete al buscar la capa por variable y que `barbas()` pasaba directa a la librería. Ahora `componentes()` da u/v de 10 m para `gusts` y `barbas()` limpia la marca. **Comprobado en el panel (1928): 24 barbas dibujadas en Ráfagas.**
- OJO: cada `deploy.sh` vacía la caché del CDN (los bloques `?rango=` vuelven a MISS para todos). Hoy se ha publicado diez veces entre los dos chats; mejor en tandas.

**19:36, build 2026.09.15-1936: la nube gris con el cielo cerrado.** Escala `nubes` por nubosidad total: blanca hasta el 55 % (#e6eaee al 0,62), gris claro al 70 (#d2d8de al 0,80), gris al 85 (#b9c1cb al 0,92), gris oscuro al 100 (#98a2ae al 0,97); la sombra de lluvia y el suelo ocre siguen igual. Prueba «la escala nubes…» reescrita (blanca hasta el 55, neutra y gris del 70 en adelante) y su fila de NO-SE-TOCA renombrada. Motivo: sus fotos de las 19:22 (cielo cerrado gris sin llover; la capa lo pintaba blanco).

### §17 · 15-09-2026, 19:45-20:20, portátil: lluvia como Windy, ciudades, nubes con el agua en azul, y PARTÍCULAS de viento

Sus mensajes de las 19:50-19:58 con capturas de Windy y de Meteored (temp. 2 m, temp. 850 y «Nubes, precipitación y nieve») delante: «la realidad de lo que marcan los modelos, punto; nada inventado» · «nubes: si son de cielo azul y alguna nube, blancas; si avecinan lluvia, más grises; si llevan mucha agua y el cielo se pone oscuro, más negras» · «nubes: este [Meteored] marca agua en azul, que sería lo suyo» · «temperatura: más frío más azul, más calor más naranja a rojo; la 850 lo mismo, así sabemos si bajan o suben» · «pero esto a diario según marquen las pautas los modelos».

1. **Build 2026.09.15-1951 (publicación 12):** Precipitación con la paleta de Windy (`cc`: azul → cian → verde → amarillo → naranja → rojo → morado), suelo oscuro debajo solo en Claro/Color (`sueloParaLluvia()`, capas `sueloLluviaLayer`/`marLluviaLayer`, se quitan en `quitarCapasDeDatos()`), y `CIUDADES_VALORES` (~66 ciudades) entra en `valores()` para que el mapa lleve nombres y números como Meteored/Windy. Comprobado en el maps.js servido.
2. **La sombra de la lluvia sobre «Nubes total» pasa de verde a AZUL** (`slc`): gris en cuanto el modelo ve agua (0,05-0,15 mm/h), azul claro `#a9ecf6` desde 0,2, azul `#2fa6e6` en 3, azul fuerte en 8, azul casi negro `#0d1f4f` en 20-40. La nube en sí sigue gris con el cielo cerrado (§16, build 1936). Prueba renombrada: `Nubes total lleva la lluvia encima con su propia sombra: la nube se oscurece donde llueve y va a azul donde llueve de verdad (como Meteored)`; fila de NO-SE-TOCA cambiada a la vez.
3. **Temperatura 2 m y 850:** no se tocan; ya van azul (frío) → verde → amarillo → naranja → rojo → granate, la de 850 con la rampa de AguaceroWx que él pidió a las 18:13. Las capturas de Meteored siguen la misma lógica.
4. **PARTÍCULAS DE VIENTO** («viento movimiento bandera», sus capturas con «Animación de partículas»): botón «Partículas» al lado de «Barbas» (`data-tpart`, `Maps.setParticulas`, guardado en `tpart`, encendido por defecto). `particulas()` lee u/v de 10 m (las mismas teselas de las barbas, cero peticiones nuevas) en una rejilla de pantalla (una muestra cada 40 px, tope 600 puntos, tandas de 24) y `animarParticulas()` mueve 600-3.500 motas sobre `<canvas id="mapParticulas">` (halo oscuro + trazo blanco, estela con `destination-in`, ~33 fps, tope 4 px/fotograma). Se paran con `pararParticulas()` desde `limpiarBarbas()` (mover el mapa, cambiar capa u hora), con el botón, con la pestaña del navegador oculta (vuelven solas con `visibilitychange`) y con el mapa fuera de la vista de la app (`offsetParent === null`: sondeo cada 1 s, sin dibujar). Solo en capas con componentes (`componentes()`: ráfagas y viento 10/20/50/100 m). Prueba estática nueva en `prueba-mapas.mjs`.
5. **Trampa del linter:** `deploy.sh` pasa ESLint con `no-self-compare` y `no-undef`: la comprobación de NaN `u !== u` y `new Path2D()` a secas tumbaron la publicación 13; queda `Number.isNaN(suma)` y `new window.Path2D()`.

Publicado desde el portátil (build abajo). Pendiente de mirar con él el lunes con viento de verdad: velocidad de las motas por zoom (`esc = 0,10 · 1,25^(z−6)`) y el número de motas en el iPhone (batería).

**21:10, iMac (SSD de vuelta del portátil):** el repo del SSD ya trae los commits del portátil (HEAD 18dd247, árbol limpio, sello local = web = 2026.09.15-2010): no hay nada que «traerse», es la misma copia. `probar-avisos.sh` desde el iMac, con clave: los cuatro pasos en verde («los avisos al móvil llegan»). El almacén sigue con **6 aparatos** (los suyos son 3): los tres de más son los «prueba automática» que dejó el portátil sin clave; se dan de baja solos en el primer aviso real (410).

**Sus fotos de Bermeo de esta tarde-noche (las tiene el portátil; aquí, lo que contó):** 20:24 cielo cerrado · 20:30 chispeo corto · 20:45 se abre; y a las 20:50 la captura de «Ahora» con el chip de GFS. Lo que decía la app a las 21:09 (por `/om`, Bermeo, tierra), horas 20-21-22:

| | 20:00 | 21:00 | 22:00 |
|---|---|---|---|
| AROME HD (el suyo) | nube baja **94 %**, 0,0 mm, sin código | nube baja **34 %** (se abre), 0,0 mm | 100 %, 0,0 mm |
| ECMWF | cubierto (59 %), 0,0 | **llovizna (51)**, 0,1 mm, 25 % | llovizna, 0,1 mm, 57 % |
| ICON | cubierto, 84 % baja, 0,0 | **chubasco (80)**, 0,4 mm, 60 % | 68 %, 0,0 |
| GFS | **llovizna (51)**, 0,1 mm | llovizna, 0,2 mm | llovizna, 0,2 mm, 100 % |

Euskalmet Almike (Bermeo) a las 21:00: 0,0 mm, humedad 85 %, racha 29; Matxitxako humedad 100 % (dentro de la nube). **Lectura:** el chispeo corto de las 20:30 es lo que GFS ponía desde las 20 (llovizna 0,1) y ECMWF desde las 21; el pluviómetro no llegó a contarlo. Y «se abre» a las 20:45 lo tiene AROME HD clavado en su hora 21 (94 % → 34 %), sin código (no lo publica): el chip de GFS en «Ahora» hacía su trabajo de decir lo que otro modelo ve. Cuatro modelos, cuatro lecturas distintas de la misma hora, y él vio las cuatro por la ventana en veinte minutos.

**23:53-00:05 (portátil, SSD de vuelta en el MacBook): el chip de Horas dice cuánta agua ve el otro.** Su captura de Horas (miércoles 05-08 h y 12-17 h): «⚠ ECMWF ve llovizna» en cada hora y 0,0 mm de AROME debajo; suyo: «cuando pones tal modelo ve lluvia, no pones cuánta ve» · «la cantidad que vea» · «no inventes nada, lo que dice el modelo» · «jamás quiero nada inventado: lo que mandan los modelos siempre, en viento, CAPE, lluvia, ráfagas». Nuevo `mmQueVeElOtro(h)` en app.js: busca en la comparativa de ESTE sitio (`deEsteSitio(S.comparativa, h.sitio)`) la serie `precipitation_<om>` del modelo que presta el código (`h.cieloDe` → `COMPARAR`) a la misma hora (`H.time.indexOf(h.t)`) y el chip queda «⚠ ECMWF ve llovizna · 0,1 mm», tal cual lo publica ese modelo, **0,0 incluido** (una primera versión decía «menos de 0,1 mm» con cero; retirada antes de publicar: eso ya es interpretar). Sin comparativa o sin esa hora, sin número. «Horas» ya se repintaba al llegar la comparativa (09-09). Pruebas: grupo «El chip de Horas dice cuánta agua ve el otro modelo» + fila en NO-SE-TOCA. Build: ver abajo.

**00:10-00:20 (portátil): cada hora de «Horas» dice lo que ven los demás, con número.** Suyo, 23:58-00:07, mandando capturas de Euskalmet (miércoles: llovizna 0,1-0,8 mm de 07 a 17 h), Meteored (4,7 l/m² el miércoles, gotas 12-17 h; jueves 0,2-0,3 de 03 a 06 y 11-12 h) y Windy (mblue: agua 02-08 h, seco por la tarde, 0,01 in a las 23; rachas 41 a las 05 y 38 a las 14): «si alguno ve lluvia, CAPE, etc., que lo pongáis» · «y si se puede, cuánto» · «datos, datos y datos» · «no quiero jugar con las vidas de los trabajadores» · «el lunes entro a trabajar y hay que decidir con esta app». Nuevo en app.js, debajo del CAPE de cada tarjeta de hora (`chipsOtrosHora(h)`), solo con la comparativa de ESE sitio (`horaEnComparativa(h)`, la misma cuenta de hora que tormentaQueNoVesTu):
- **Lluvia** (`lluviaQueVenOtrosHora`): los modelos que ven ≥ 0,1 mm y más que el dueño de la lluvia, cada uno con su número tal cual («⚠ ICON ve 0,4 mm · GFS 0,2 mm»); el que presta el código no se repite (ya lleva el suyo en «ve llovizna · 0,1 mm»).
- **Tormenta**: `tormentaQueNoVesTu(h)` (CAPE ≥ 700 y tapa < 75, la regla calibrada) cuando el dueño no rompe: «⚠ GFS ve tormenta: CAPE 900 · tapa 40».
- **Racha** (`rachaQueNoVesTuHora`): la misma regla que rachaQueNoVesTu de «Ahora» pero a esa hora: cruza su listón o va 20 km/h por encima → «⚠ ICON da 52 km/h a 10 m — tu listón es 49» o «(tú ves 25)».
Estilo `.hcard__otros` en styles.css. Pruebas en el grupo «El chip de Horas dice cuánta agua ve el otro modelo» y fila en NO-SE-TOCA. Build 2026.09.16-0004 = el chip literal; el siguiente = los tres chips (ver abajo).

**00:22, publicados y comprobados en producción (Bermeo, Horas, con la comparativa cargada): build 2026.09.16-0004 (chip literal) y 2026.09.16-0012 (los tres chips).** Ejemplo real servido: «mié 04:00: ⚠ ECMWF ve llovizna · 0,4 mm | ⚠ GFS ve 1,5 mm · ICON 0,1 mm» · «mié 12:00: ⚠ ECMWF ve llovizna · 0,3 mm | ⚠ GFS ve 0,1 mm» · «mié 09:00: ⚠ ICON ve 0,5 mm». 24 de 48 horas con chip, sin errores de consola. Cuadra con Euskalmet (0,1-0,8 mm de 07 a 17 h) y Meteored (gotas 12-17 h) mientras AROME HD da 0,0 desde las 12: por eso hacía falta. «Automático» (best_match de Open-Meteo) sale como uno más, igual que en las franjas.

**16-09-2026, 11:37, dato de campo suyo (Bermeo): «hoy sirimiri está tirando y cielo cubierto» · «ahora para, ahora se pone a tirar».** Modelos a las 10-13 h (Open-Meteo, punto de Bermeo): AROME HD **0,0 mm** en las cuatro horas (sin código ni nube total en la API) · ECMWF 0,2 mm y llovizna (51) todas las horas, nube 81-91 % · GFS 0,3 / 0,5 / 0,3 / 0,1 mm, llovizna (51-53), nube 100 % · ICON 0,1 a las 10 y 0,0 después, cubierto (3), nube 94-98 %. La app: «Ahora» = Cubierto · AROME HD la ve seca · 0,0 mm + chip «ECMWF ve llovizna»; «Horas» 11:00 = «⚠ ECMWF ve llovizna · 0,2 mm | ⚠ GFS ve 0,5 mm». Segundo día seguido (ayer 20:24 igual) en que el dueño AROME HD no ve el sirimiri de la costa y lo ven ECMWF y GFS: los chips lo cubren; si sigue así, el marcador de acierto de la lluvia (ELEGIDO_POR_ACIERTO.precipitation) es quien tiene que hablar, no una regla nueva.

**16-09-2026, 10:45, sus fotos desde Sukarrieta (ría de Urdaibai, mirando a Mundaka e Izaro):** cielo cubierto del todo, gris claro y uniforme (estrato bajo), suelo mojado de sirimiri, ría en calma, viento flojo. Modelos a las 10-11 h: nube 89-100 % (ECMWF, ICON, GFS), ECMWF 0,2 mm llovizna, GFS 0,3-0,5, ICON 0,1 → 0,0, AROME HD 0,0. La capa Nubes del mapa lo pinta gris (cerrado) con trazas gris oscuro/azul claro por ECMWF y GFS; con ICON-EU (el del mapa por defecto) gris con 0,1 a las 10. **Todas las fotos de campo (ayer y hoy) están en el SSD: `CLAUDE/copias/campo-bermeo-2026-09/`** (nombre = fecha_hora_sitio), fuera del repo para que `deploy.sh` no las suba.

### §18 · 16-09-2026, 12:08-13:00, portátil: revisión antes del lunes («revísame la app que no falle»)

Suyo, 12:11-12:16, con capturas de Ahora, Horas, 10 días, Mar y de la agenda: «verifica que esté todo ok» · «si ves algo mal corriges y publicas» · «agenda familiar para lo último que esté bien también» · «datos reales quiero» · «el SSD externo con los datos lo tienes tú, lo dejo contigo unos días» (el «Extreme Pro2» del aviso de macOS es un disco personal del iMac, no el de trabajo).

1. **Los puntos rojos del mapa** (su captura 12:08) son la capa «⚡ Rayos»: descargas reales de AEMET, rojo la última hora, ámbar la anterior. No es previsión.
2. **Build 2026.09.16-1215:** el pie de Nubes total decía «tirando a verde donde llueve»; ahora «el agua del modelo en azul: claro con llovizna, casi negro con chaparrón (como Meteored)».
3. **Agenda familiar, build 2026.09.16-1224:** `api/tiempo.mjs` da en cada hora `prestada` con la cantidad («ECMWF ve llovizna · 0,4 mm», literal, 0,0 incluido) y `otros` (lista: «GFS ve 0,2 mm · ICON 0,1 mm», «ECMWF da 34 km/h» con la regla de rachaQueNoVesTu, listón 40); `app.js` los pinta con `chipOjo`. Sin CAPE: es la agenda de casa. Cuatro pruebas nuevas en `prueba-tiempo.mjs` sobre la salida REAL del handler (35 bien). Comprobado en producción: 26 de 48 horas con chip, sin errores de consola.
4. **Por qué «Ahora» decía «Parcialmente nuboso» a las 12:00 con el cielo cerrado y sirimiri (sus fotos de las 10:45 y su mensaje de las 11:37).** No es un fallo de código: es la votación del cielo con sus pesos. A las 12:00 la nube baja+media por modelo era AROME HD **22+1 = 23 %** (peso 3), ECMWF 35+29 = 64 (1), ICON 61+74 = 100 (2), GFS 100+0 = 100 (1); la mediana ponderada cae en 64 → «parcialmente nuboso» (el corte de cubierto es 70). A las 11:00 AROME daba 67+1 y salía lo mismo; a las 13:00 AROME 48+59 = 100 y sale «cubierto». O sea: AROME HD, que manda con peso 3, no vio ni el sirimiri (0,0 mm) ni la nube baja de la costa esta mañana, y con su peso arrastra la votación. La regla se acordó así (Calpe, 10-09) y no se toca sin él. Dos opciones si quiere: (a) que cuando el código prestado diga llovizna, el cielo no baje de «cubierto» (una nube que chispea no es parcial); (b) bajar el peso de AROME en el cielo cuando no publica nube total. Se lo he contado con estos números; decide él.
5. **FALLO REAL, arreglado y publicado (build siguiente):** en «Mis estaciones» la app pedía las estaciones de AEMET **sitio a sitio, 20 peticiones a la vez** (`/estaciones?lat&lon&radio=40`), cada una con dos llamadas a AEMET; AEMET corta por límite de uso («Se ha alcanzado uno de los límites de uso. Vuelva a intentarlo el próximo minuto») y **11 de 20 sitios volvían con 502**; la cabecera de la tabla lo decía («no he podido preguntar a AEMET»), pero media tabla se quedaba sin la medida real. Ahora: `netlify/functions/estaciones.js` entiende `?puntos=lat,lon|…` (tope 40) con UNA descarga de AEMET compartida entre las peticiones en curso del aislado (`descargarTodas`; se suelta al acabar, para que un 503 de AEMET siga viéndose como 503: la prueba de cabeceras lo tumbó con una memoria de 4 minutos), y `app.js` pide la tabla entera en un lote (el mismo `puntos` que ya manda a Euskalmet). El modo sitio a sitio sigue para lo demás (`cargarObs`, `historia=`). Pruebas: «la tabla de Mis estaciones pide AEMET en UN lote (?puntos=), no sitio a sitio» y la del servidor; fila en NO-SE-TOCA.
6. **Recorrido de pestañas en producción (build 1215):** Ahora, Horas, 10 días, Mar, Radar, Rayos, Cámaras, Avisos y Mis estaciones: sin errores visibles, sin «undefined/NaN» en pantalla, service worker activo; los únicos errores de consola eran los 502 de AEMET del punto 5.

**13:05, publicado y comprobado: build 2026.09.16-1237.** En producción, «Mis estaciones»: UNA petición `/estaciones?puntos=…` (20 sitios) → 200 en 1,4 s, `S.medidoSinAemet = null`, 33 menciones de AEMET en la tabla; el modo sitio a sitio (`?lat&lon`) sigue contestando (6 estaciones). Primer intento (memoria de 4 minutos) tumbado por `prueba-cabeceras.mjs` («estaciones.js con la fuente en 503: contestó 200»): la descarga se comparte solo entre peticiones en curso. Commit local abajo.

**16-09-2026, 13:00, su foto desde la plaza de Bermeo (feria, paraguas abiertos): «sirimiri a las 13:00».** Cielo cubierto y sirimiri. Modelos a las 13 h: AROME HD 0,0 · ECMWF 0,2 mm llovizna (51) · GFS 0,1 mm (51) · ICON 0,0 cubierto. La app a esa hora: «Cubierto» (votación 100 %) y en Horas «⚠ ECMWF ve llovizna · 0,2 mm | ⚠ GFS ve 0,1 mm». Tercera observación seguida en que AROME HD no ve el sirimiri de la costa y ECMWF/GFS sí. Foto en `copias/campo-bermeo-2026-09/2026-09-16_1300_bermeo-plaza-sirimiri.jpg`.

**23:34-23:40, sus capturas de la app (Mar, 10 días, Horas, Ahora) y de la agenda (build 1224), y su veredicto: «hoy acertó el tiempo la app, hasta la poca lluvia que cayó a las 22:30-23:00»** (la franja Noche decía «ECMWF y GFS ven algo de lluvia a las 23:00 (0,1 mm)» con AROME seca). Dato de campo: cuarta observación del día en que el préstamo ECMWF/GFS acierta la llovizna que AROME HD no ve. Lo único que he cambiado al verlas: en Horas el chip «GFS ve 0,1 mm» salía debajo del CAPE, lejos de la gota; ahora cada chip va al lado de su número (`chipsOtrosHora(h, parte)`: lluvia junto a la gota, racha bajo la racha, tormenta bajo el CAPE). Build abajo. Él: «a ver mañana cómo están estos pantallazos»: mañana jueves toca comparar con la realidad lo que dicen (madrugada 0,4 mm a la 01:00 por AROME; mañana y tarde AROME seca y GFS+ECMWF con 1,6 y 1,0 mm).

**17-09-2026, 09:00, sus fotos de Bermeo: «17 grados, fresco»; cielo con claros azules y cúmulos, ~50-60 % tapado, seco.** Modelos a las 09 h: AROME nube baja 85 %, 0,0 mm, 17,9° · ECMWF total 95 % (baja 65), 0,1 mm llovizna, 14,4° · ICON total 60 % (baja 59), código 2 parcialmente nuboso, 0,0 mm, 15,6° · GFS 100 %, 0,1 mm, 15,9°. La app decía «Cubierto» (votación: mediana ponderada de baja+media = 85, la de AROME con peso 3) y «ECMWF ve llovizna»; la realidad era parcialmente nuboso y seco. Hoy el que clavó el cielo fue ICON, y AROME clavó temperatura y lluvia (seco). Estaciones AEMET de madrugada: 0,2 mm a las 04 (Matxitxako) y 05 (Forua), nada más; la app daba 0,4 a la 01:00 por AROME. Fotos en copias/campo-bermeo-2026-09/2026-09-17_0900_*.jpg.

**PENDIENTE (17-09-2026, 09:20), suyo: «cuando pase algo como lo de ayer en Valencia me gustaría saber» (trombas de agua del 16-09 en Valencia).** Propuesta hecha, a la espera de su sí y del alcance (toda España o Euskadi + zona de Calpe): el vigilante manda un aviso al móvil cuando AEMET publique alerta naranja o roja, con zona y fenómeno, una vez por episodio; y en la pestaña Avisos un apartado «Resto de España». Sin inventar: solo avisos oficiales de AEMET.

### §19 · 17-09-2026, 09:20-10:00, portátil: avisos de toda España (solo información) y rayos solo donde pintan

1. **Avisos oficiales de toda España.** Suyo, con las trombas de Valencia del 16-09 (AEMET: 72 mm/24 h en el aeropuerto, 51 mm en una hora en Valencia centro; garajes inundados, riadas): «cuando pase algo como lo de ayer en Valencia me gustaría saber» · «me gusta saber si va a llover un montón en algún punto» · «es solo info» · «España».
   - `api/alertas-espana.js` (edge): lee el feed Atom de Meteoalarm de España (los avisos CAP de AEMET, sin clave), `leerFeed()` saca nivel (amarillo/naranja/rojo por el título), fenómeno en español, zona, onset/expires; quita caducados y repetidos; 10 min de CDN; 8 s de tope. Probado con el feed real de las 07:35: 18 naranjas (Ibiza y Formentera, Campo de Cartagena, Guadalentín, Levante almeriense, litoral sur de Alicante…), 94 amarillos, 0 rojos vigentes.
   - Pestaña Avisos: apartado «ESPAÑA» al final (`pintarAlertasEspana`): rojos y naranjas con zona, fenómeno y horas; los amarillos solo se cuentan; si no se puede leer, lo dice. «Solo información: no es tu zona ni tus listones».
   - Vigilante: `avisarEspana()` al final de cada pasada, con el fallo tragado: un aviso al móvil (`tag 'espana'`, no importante) cuando aparece un naranja o rojo NUEVO, con hasta 4 zonas y «y N más»; lo avisado se guarda en `avisos/espana.json` (400 claves); **la primera pasada solo apunta lo que hay, sin avisar** (el estreno no puede ser 60 zonas de golpe). Respeta `VIGILANTE_ENVIA`.
   - Pruebas: grupo «Avisos oficiales de toda España, solo información» (leerFeed con un feed de mentira: rojo, naranja repetido, amarillo y caducado) y fila en NO-SE-TOCA.
2. **Rayos solo donde pintan algo.** Suyo, 09:45, con «Viento 10 m · barbas» de ECMWF lleno de puntos rojos de Murcia: «aunque ponga capa de viento siempre salen esos puntos rojos, no debería ser así, ¿no?» · «en capas donde tiene sentido: ESO ES». `rayosProceden()`: solo en los grupos Lluvia (incluye radar), Tormenta y Satélite; `rayos()` se limpia fuera de ellos aunque el botón esté encendido, y los dos botones (barra y reloj) solo se ven encendidos donde actúan. Prueba y fila en NO-SE-TOCA.
3. Sus capturas de las 09:42 (Nubes total, CAPE, Tormentas Meteosat, Agua precipitable, Inhibición, Precipitación, Reflectividad, Radar AEMET) cuadran entre sí y con los avisos: tormentas reales en Albacete, costa de Murcia y Almería, Valencia y Mallorca; CAPE 1.000-2.000 sobre el Mediterráneo. «¿Esos puntos rojos están bien? ¿no son demasiados?»: sí, son las descargas de AEMET de dos horas, y con tormentas activas salen cientos.

**10:05, suyo en mayúsculas: «QUÍTALE LOS CÓDIGOS HASTA QUE TENGAMOS REMATADA LA APP» · «QUÍTALE EL CÓDIGO HASTA NUEVA ORDEN».** El candado queda APAGADO con un interruptor en el guion inline de index.html (`var APAGADO = true;` → la app abre sin pedir el código de 6 cifras). El resto del candado (hash, 24 h, «si falla, se abre») sigue tal cual y `prueba-candado.cjs` lo sigue probando encendiéndolo con `window.__probarCandado`, más dos pruebas nuevas de que está apagado. Para volver a ponerlo cuando él lo diga: `APAGADO = false`. Fila en NO-SE-TOCA. Build abajo.

**10:15-10:30, suyo: «si me va a gastar créditos en Vercel lo de los avisos de toda España no me interesa, que luego me quedo sin avisos como pasó hace un mes; por cuenta gratuita, no voy a pagar».** Cuentas: la función de España se ejecuta solo en fallo de caché; cada 15 min eran ≤ 144 ejecuciones/día (≈ 4.300/mes de 1.000.000 del plan gratuito, 0,4 %). Ajustado igualmente: el vigilante mira España UNA vez por hora (`CADA_MS = 55 min`, lee `avisos/espana.json` antes para saltar sin pedir) y el CDN guarda la respuesta 30 min (`cabeceras(1800)`): 24 lecturas al día. Lo de hace un mes fue Netlify (300 créditos en tres días por las teselas), no esto. Builds 2026.09.17-1011 (candado apagado) y la siguiente (ahorro).

**10:35, DECISIÓN SUYA, definitiva: fuera del vigilante lo de España.** Sus palabras seguidas: «lo de España una vez al día ya vale» → «no quiero consumir créditos, que luego para mis estaciones me quedo mal» → «así que igual hasta ni lo pongas, no me la juego» → «esto está hecho para mi trabajo, no para hobby» → «prefiero los datos actualizados en mis sitios que no me gaste créditos por España entera, que al final solo era para info» → «eso es demasiado, ni Windy lo hace así más que cada 3 horas» → «nada, que no quiero gastar créditos, socio; prefiero para mis avisos; a ver si la cagamos con eso». Hecho: `avisarEspana()` y su gancho eliminados del vigilante (cero coste de fondo); queda solo el apartado ESPAÑA de la pestaña Avisos, que se lee únicamente cuando él abre la pestaña (una llamada, 30 min de CDN). Pruebas cambiadas: «el vigilante NO consulta los avisos de España» y «la pestaña Avisos solo pide España cuando él la abre». Fila de NO-SE-TOCA reescrita. Si algún día quiere el aviso al móvil, está en el historial (commit 7032759) y se vuelve a poner en diez minutos, con su sí. Build abajo.

**10:50, cerrado con él:** «vale, déjalo así, solo cuando abra». Queda: el apartado ESPAÑA de la pestaña Avisos se lee solo al abrirla (sin gasto de fondo); el móvil solo avisa de SUS sitios. Build 2026.09.17-1025.

### §20 · 17-09-2026, 10:35 en adelante: pruebas de la app en sitios con tormenta y viento (suyo: «ya que tengo libre hasta el lunes, ir mirando cómo va nuestra app en sitios donde va a caer rayos, fuertes vientos, a ver cómo se porta; busca sitios en cualquier lado del mundo o España; y al final del día a ver qué dicen las cámaras web y lo de AEMET»)

**Cartagena, 10:38.** Modelo que manda: ECMWF 25 km (AROME HD no cubre). La app: «Llovizna débil», 1,2 mm en la franja de la mañana, ⚡ Riesgo de tormenta 12-13 h (CAPE 1140, tapa 7), tarde 14-20 h (CAPE 1240, tapa 11), noche (CAPE 1090, tapa 7); rachas 30-32 km/h; en Horas, CAPE 1220-1250 con tapa 89→75→7 (se abre a las 12). AEMET medido: Cartagena 22,5 mm a las 08:00 en una hora (Tentegorra 37,4 mm/h), rachas 40-41; Cabo de Palos rachas 47-49 toda la madrugada; Torre Pacheco 15,6 mm a las 03:00. Lectura: el riesgo eléctrico lo clava (CAPE alto y tapa abierta, con los rayos de AEMET encima en el mapa) y la racha se queda corta (30 previsto, 40-49 medido en la costa); la lluvia de un modelo de 25 km (0,3 mm/h) no dice nada de los 37 mm/h de una célula: para eso están el radar y los rayos. GFS con CAPE 820-1140 y tapa 12-36 también rompe.

**Ibiza, 10:40.** Manda AROME HD (sí cubre Baleares): «Despejado», AROME la ve seca, y los chips: «ECMWF, GFS, Automático y ICON ven lluvia de 10 a 13 (9,6 mm)», «ven lluvia de 14 a 15 (23,9 mm)», «ICON ve nubes 10-13 (baja y media hasta el 100 %)»; ⚡ riesgo de tormenta 14-19 h (CAPE 1050, tapa 6); racha 48 km/h a las 16. AEMET tiene a Ibiza en naranja por lluvia y tormentas hasta las 23:59. Lectura: el dueño AROME se queda solo con «seco y despejado» mientras los otros cuatro y AEMET ven la tormenta; lo salvan los chips y el riesgo eléctrico, que sí sale. Es el mismo patrón que el sirimiri de Bermeo: AROME HD corto con la convección y la nube baja mediterránea. Sin estación cerca para medir (Campos-Salines racha 40, Manacor 36 a las 08).

**Ciudad del Cabo, 10:42 (prueba de viento fuerte, hoy 90 km/h de racha según GFS).** Manda ECMWF 25 km: despejado, rachas 61-68 km/h de 10 a 17 h (estado «warn» hora a hora), 58 por la noche, 61 de madrugada; CAPE 0. rachaQueNoVesTu: «Automático da 80 km/h, tu listón es 70» (cruza el listón «no»). PENDIENTE DE MIRAR: en la franja no aparece el chip de racha de otro modelo (¿se calla en sitios que no son suyos?). Sin medida real (sin AEMET).

**10:50, CAZADO en Ciudad del Cabo y arreglado (build siguiente):** `rachaEnLaFranjaQueNoVesTu()` dejaba fuera al Automático (`best_match`) y solo miraba el listón de aviso (49); en Ciudad del Cabo el cargado (ECMWF) daba 61-68 km/h, ICON 59-72 y el Automático 77-85 —cruzando su listón «no» de 70— y la franja no decía nada, mientras «Ahora» (rachaQueNoVesTu, que sí mira los dos listones y todos los modelos) decía «Automático da 80 km/h, tu listón es 70». Igualado: los dos listones y todos los modelos, y el chip dice el listón que cruza (`limite`). Él: «pues sí, buena cazada, me encanta que busques esos fallos». Prueba y fila en NO-SE-TOCA. PENDIENTE suyo (10:45): «diséñame un icono chulo para la app de agenda, con símbolo del tiempo también».

**10:57, build 2026.09.17-1057:** rayos del mapa apagados de serie (`trayos2`, suyo: «en radar AEMET etc. no deberían salir, es un lío; solo en rayos, del resto no; y no quiero en todas»). Y **`busca-extremos.mjs`** (herramienta, no guardia): recorre 50 puntos de España y 51 ciudades del mundo con aeropuerto, pide a Open-Meteo el día (racha máx, CAPE máx, lluvia) y añade lo MEDIDO: AEMET (por el intermediario de la app, en un lote) para España y el METAR del aeropuerto (aviationweather.gov) para el mundo. Primera pasada, 11:00: España → racha Tenerife 62 prevista (47,5 medida a las 08), CAPE Cartagena 1820 (medido: 37,4 mm en 6 h en Tentegorra, racha 41), lluvia Ibiza 15,5 mm prevista (0 medido hasta las 08). Mundo → Ciudad del Cabo racha 90 prevista a las 18 (METAR 08:00: 63 de racha), **Génova 166,6 mm hoy con pico de 87 mm/h a las 13:00** (METAR 09:00 viento 43), Calcuta CAPE 4210. Siguiente: abrir Génova en la app.

**11:05, Génova (build 1057): el hueco gordo del día.** Manda AROME HD (cubre Liguria): 0,1 mm/h de 11 a 18. ECMWF 1,3 mm/h, GFS 1 mm/h, e ICON (icon_seamless = ICON-D2 en Italia) y el Automático: **23 mm a las 12, 87 mm a las 13, 48 mm a las 14** (158 mm en tres horas). METAR LIMJ 08:50: TS FEW015CB, viento 43 km/h: la tormenta ya está allí. La app dice: «Llovizna moderada · 0,1 mm en la franja · ⚠ Automático da 61 km/h, tu listón es 49 · ⚡ Riesgo de tormenta 11-13 (CAPE 1630, tapa 0)», tarde «0,6 mm en la franja» con riesgo 14-18. Lo que NO dice: que otro modelo ve 158 mm. El chip «X ve lluvia (N mm)» de la franja no sale cuando el dueño ve algo (0,1); en Ibiza sí salió porque AROME daba 0,0. Con su regla de «si alguno ve lluvia, que lo pongáis», esto tiene que salir cuando otro ve claramente más que el dueño. Arreglo abajo.

**11:15, arreglo de Génova (build siguiente):** `lluviaEnLaFranjaQueNoVesTu(desde, hasta, minimo)`: con el dueño seco (< 0,1 mm) sigue igual (mínimo 0,1); con el dueño mojado, el chip sale si otro modelo ve al menos 1 mm MÁS que él en la franja y dice «⚠ ICON y Automático ven más lluvia de 12:00 a 14:00 (158 mm)». Prueba y fila en NO-SE-TOCA. Comprobación en producción abajo.

**11:15, publicado build 2026.09.17-1115** (la publicación anterior se cortó porque al MacBook se le acabó la batería; sin daño: el SSD y el trabajo estaban en disco). Comprobación en Génova abajo. **Sábado 19 en Bermeo, suyo: «las temperaturas no coinciden» (Windy/meteoblue 21/16):** ECMWF 25 km en celda de tierra 23,7/9,6 (lo que enseña la app), ICON 22,1/12,4, GFS 25,5/13,8, Automático (ARPEGE) 21,4/15,1, UKMO 21,9/14,2; ECMWF en la celda del mar (43,5, -2,75) 19,8/14,0. La mínima de 10° es la celda de monte de ECMWF; en la costa los demás dan 12-16. El chip «los modelos van de X a Y» de 10 días solo mira la MÁXIMA y con 6° o más (aquí 4°); la mínima tiene 5,5° de horquilla y no se dice. Propuesto: que mire también la mínima. A la espera de su sí.

**11:30, build siguiente (él: «hazlo, ¿qué opinas?» · «Meteored también da 21 grados el sábado»):** (1) en 10 días, `desacuerdoDelDia()` mira también la MÍNIMA (la petición diaria multi-modelo trae `temperature_2m_min`); la tarjeta pinta «⚠ mínima: de 10° a 15° según el modelo» desde 5° de horquilla (la máxima sigue en 6°). (2) El chip de lluvia de la franja con el dueño mojado da cada modelo con su cifra: «⚠ ven más lluvia de 11:00 a 13:00: Automático 110,8 mm · ICON 110,7 mm · ECMWF 3,9 mm · GFS 3,4 mm» (antes ponía a los cuatro con la cifra del más alto). Pruebas y fila en NO-SE-TOCA. PENDIENTE de decidir con él: la máxima del sábado (ECMWF 23,7 y GFS 25,5 frente a 21-22 de ICON, ARPEGE, UKMO, Windy y Meteored) no salta porque el listón de la máxima es 6° y la horquilla es 4°: ¿bajarlo a 4°? La agenda familiar no lleva aún ni la mínima ni las cifras por modelo (pendiente de portar).

**11:45, build siguiente:** listón del chip de la máxima en 10 días de 6° a 4° (él: «¿qué me recomiendas?» → 4°, «oki, hazlo»). El sábado de Bermeo pasa a decir «los 4 modelos van de 21° a 26°» además de la mínima. Prueba y fila en NO-SE-TOCA.

**PENDIENTES suyos, 17-09-2026 11:45-11:50, por este orden después de las pruebas reales:**
1. **Agenda**: pasar los chips nuevos (mínima desde 5°, máxima desde 4°, cifras por modelo en la lluvia de la franja) para que siga siendo copia de la app.
2. **Icono de la agenda** «chulo, con símbolo del tiempo también» (borrador SVG en el scratchpad del portátil: calendario morado-rosa con sol y nube).
3. **Tocar un día en «10 días» y ver ese día entero, hora a hora**, en la agenda Y en la app («me lo piden los de casa, lo prefieren; Apple en su app lo tiene así»). La agenda ya trae todas las horas de los 10 días en `api/tiempo.mjs` («ahora se puede tocar DOM 30 y hay que poder enseñar la tira de ese día»): falta la vista al pulsar. En la app, `horasDelDia(fc, t)` existe; falta el detalle al pulsar la tarjeta.

**12:00, agenda familiar build 2026.09.17-1136:** portados los chips de la app: horquilla de temperaturas por día (`temp: {max, min}` en `api/tiempo.mjs`, máxima desde 4°, mínima desde 5°, con tres modelos o más; para eso la petición pide también `best_match` —«Automático», que es ARPEGE— SOLO para la horquilla, `PEDIDOS = [...DUENOS, 'best_match']`; el reparto y los préstamos siguen siendo DUENOS) y, en la lluvia de franjas y días, con el dueño mojado «ven más lluvia … : ICON 110,8 mm · ECMWF 3,9 mm» (`aguaQueNoVesTu` devuelve `masQue` y `lista`). Comprobado en la API viva: sábado «los 4 modelos van de 22° a 26°» + «mínima: de 10° a 15° según el modelo». 38 pruebas sobre la salida real. **Ronda de pruebas reales cerrada (Cartagena, Ibiza, Ciudad del Cabo, Génova, Calcuta):** tres huecos cazados y arreglados (racha de la franja sin Automático ni listón «no»; lluvia de la franja callada con el dueño mojado; rayos en todas las capas), y el riesgo eléctrico acertó en los cinco.

**12:20, builds app 2026.09.17-1145 y agenda 2026.09.17-1141: tocar un día en «10 días» abre ese día entero, hora a hora.** Suyo: «quieren saber el sábado qué día va a hacer entero, por horas; me lo piden los de casa, lo prefieren, Apple en su app lo tiene así; en la app también». App: `tarjetaHora(h)` (una sola plantilla para «Horas» y para el detalle), `renderDiaDetalle()` (contenedor `#diaDetalle` debajo de `#dlist`, clic delegado en las tarjetas `data-dia`, `S.diaAbierto`, botón Cerrar, la tarjeta abierta con `is-abierta`; se repinta con `renderDays`). Agenda: `tarjetaHora(h, etiqueta)` + `abrirDia(fecha)` con `#diaDetalle` tras la sección de días. Comprobado en producción: agenda sábado 24 horas (00:00 a 23:00); app sábado abre debajo de los 10 días con las mismas tarjetas y chips. Pruebas en pruebas.js y prueba-tiempo.mjs (40); fila en NO-SE-TOCA.

**11:52, build 2026.09.17-1152:** el detalle del día usa `horasDelDia(S.data.fc, dia)` (los 10 días) con `assess()` para el semáforo, no las 48 h de «Horas»: probando el sábado, el detalle se cortaba a las 12:00 y el domingo salía vacío.

**12:30, agenda build 2026.09.17-1156: icono nuevo** (suyo: «diséñame un icono chulo para la agenda, con símbolo del tiempo también» · «sí, púlelo bien»). Fuente en `icons/icono.svg` e `icons/icono-maskable.svg` (calendario con el degradado morado-rosa de la app, sol y nube); `hacer-iconos.sh` rasteriza con qlmanage + sips (192, 512, maskable 512, apple-touch 180); `index.html` y el manifest llevan `?v=20260917` para que el móvil coja el nuevo (en iPhone, el icono de la pantalla de inicio se renueva al volver a añadir la app). `hacer-iconos.mjs` (dibujo a píxel) queda por historia. **Repaso de coherencia que él pidió («no quiero que se baile nada»)**, en producción, Bermeo, build 1152: `comprobarCielo()` de la propia app sin faltas (Ahora, Horas y 10 días cuadran); cabecera 20° parcialmente nuboso; franjas con AROME seca y chips de ECMWF/GFS; horas 12-14 en ámbar por la regla del sirimiri (llovizna prestada); Mar con la tabla oficial de Euskalmet (bajamar 15:16 · 1,66; pleamar 21:19 · 3,56) y oleaje 1,6 m subiendo a 2,4 el viernes. Sin errores de consola.

**12:45, builds app 2026.09.17-1213 y agenda 2026.09.17-1210 (suyo: al abrir un día, «que ponga también si alguno ve nube o agua, etc.» · «nada inventado, ¿ok?»):** la comparación entre modelos de la app (`cargarComparativa`) pasa de 2 a 10 días (una petición, ~150 KB), así el día abierto lleva los chips de agua, racha y tormenta cualquier día; y cada hora dice además si otro modelo fino ve nubes cuando lo pintado es raso o velo (`chipsOtrosHora(h, 'nubes')`, la regla de la franja para esa hora, bajo el dibujo). Agenda: lo mismo por hora (`nubesQueNoVesTu(CMP, [i], código)`), en producción 19 horas con chip de nubes hoy («ICON ve nubes (baja y media hasta el 100 %)»). Comprobado en la app: el sábado en Bermeo abre 24 horas SIN chips, y es correcto: los cinco modelos dan 0 % de nube, 0 mm y rachas de 5 a 24: no hay nada que decir. Nada inventado: solo el número que publica cada modelo, con su nombre.

### §21 · 17-09-2026, 13:30-14:00, portátil: apuestas para comprobar a las 22:00 y dos fallos cazados probando por el mundo

Suyo: *«yo quiero mirar en predicción: si en nuestra app dice que a las 18 h va a haber agua fuerte o viento en algún pueblo o ciudad, y poder mirar si acierta; y así a las 22 h revisamos todo»* · *«¿en ningún punto del mundo da agua, vientos fuertes, CAPE alto? Filipinas, Miami…»*.

**Cómo se buscó:** `scratchpad/apuestas-18h.mjs` (copia de las listas de `busca-extremos.mjs` + Chichijima, Iwo To, Guam, Saipán, Naha, Cebú, Kaohsiung, Nasáu, San Juan, Cancún, Nueva Orleans, Houston): racha, lluvia y CAPE de cada modelo entre las 16 y las 22 h de Madrid. Luego se abrió cada sitio EN LA APP (`go()` desde la consola) y se copió la tarjeta de cada hora tal cual. La lista entera con los números está en `scratchpad/apuestas-2026-09-17.md`; resumen:

| Sitio | Dueño en la app | Lo que dice la app | Contraste a las 22 h |
|---|---|---|---|
| Tenerife Norte (Los Rodeos) | ECMWF | racha 59 a las 16-17 h, 58 a las 18, bajando a 46 a las 22 (chip ICON 52) | AEMET C447A (a las 11 UTC ya 53,6) · METAR GCXO |
| Ibiza (Es Codolá) | AROME HD | 0,0 mm toda la tarde; chips GFS 15,7 mm a las 14 h y 8,2 a las 15, ECMWF 1,7-1,8; CAPE 1040 tapa 50 a las 15 h; «ICON ve tormenta» 17-20 h | AEMET B954 · METAR LEIB (a las 13:00 ya TS con CB) |
| Cuenca | AROME HD | 0,0 mm; «ECMWF ve llovizna 0,6 mm» 16-17 h y «lluvia 1,6 mm» 18-20 h | AEMET 8096 |
| Ciudad del Cabo | ECMWF | racha 67-63 km/h 16-18 h; «Automático da 90 — listón 70» a las 18-19 h | METAR FACT |
| Trieste | AROME → «—» (fallo, abajo) | chips ECMWF 5,3-6,6 mm/h 16-20 h, GFS 5,9 a las 16; ICON seco | METAR LIPQ |
| Chichijima (Dujuan) | ECMWF | hora Tokio: 23 h racha 64, madrugada 62-70, 1,0 mm/h desde la 01, CAPE 1250-1850 tapa 0 | sin METAR (RJAO/RJAW no publican): JMA o Windy |

Sin apuntar en la app pero en el barrido: Las Palmas (Gando ya 63 km/h a las 11 UTC; ICON 57 a las 19 h), Génova (ICON 5,6 mm a las 16 h), Dublín (ECMWF 62,6 a las 16 h), Bergen (ICON 64,8 vs ECMWF 37,8).

**Fallo 1, arreglado (build siguiente): dentro de la caja de AROME pero fuera de su malla.** Trieste cae dentro de la caja de AROME HD (lon −12…16, lat 37,5…55), Open-Meteo contesta 200 y la temperatura, la lluvia, la racha y el CAPE vienen TODOS nulos (385/385). El `catch` del rebote a ICON solo saltaba con un error, no con un 200 vacío: la ficha se quedaba en «—», «sin dato», «Racha —», «CAPE: no lo publica», con AROME de dueño y solo los chips de los otros con números. `completar()` no lo arreglaba porque solo presta los complementos, no lo principal. Ahora, si el dueño contesta sin UNA temperatura en diez días, se trata como «no cubre este punto» y rebota al global con su toast (`cubreElPunto`, `.then` antes del `.catch`). Prueba nueva en `pruebas.js`. En España no pasa (todo está dentro de la malla), pero él prueba la app por el mundo y lo vio.

**Fallo 2, pendiente de la siguiente publicación: «⚠ otro modelo ve llovizna» sin nombre.** En Ibiza (16 y 21 h) el código del cielo lo presta `meteofrance_arpege_europe`, que no está ni en `MODELS` ni en `COMPARAR`, así que `nombreDeModelo()` cae a «otro modelo». Su norma: el modelo siempre con nombre. Se pone tabla para los prestamistas sin ficha (ARPEGE, HARMONIE, GEM). Y como ARPEGE no está en la comparativa, ahí no se puede decir cuántos mm ve: se queda «ve llovizna» con nombre y sin cifra, que es lo que hay.

**Ojo con la hora:** las tarjetas van en hora LOCAL del sitio (Tenerife −1, Tokio +7). Para el contraste, Madrid 22:00 = Canarias 21:00 = Tokio 05:00 del viernes.

**Contraste a las 22:00:** `scratchpad/contraste-22h.mjs` (historia de 12 h de AEMET en las cuatro estaciones apostadas vía `/estaciones?puntos=…&historia=12` y METAR de 12 h de GCXO, GCLP, LEIB, FACT, LIPQ, LIMJ, EIDW, ENBR, PGUM, PGSN). Probado a las 13:55: Ibiza lleva tormenta (TS, CB) desde las 09:30 UTC y Es Codolá aún 0,0 mm (tormenta seca de momento); Ciudad del Cabo ya 37 kt = 69 km/h de racha a las 11:25 UTC (ECMWF decía 67; el Automático 90 es lo que hay que ver); Los Rodeos 53,6 y Gando 63 a las 11 UTC; Génova con tormenta a las 08-09 UTC (ICON daba la lluvia a las 16 h).

### §22 · 17-09-2026, 13:55-14:20, portátil: la reflectividad como en AguaceroWx

Suyo, con AguaceroWx (GFS 06z, «Composite Reflectivity» y «Precipitation Type Reflectivity») al lado de nuestra capa Precipitación en ECMWF 25 km: *«me gusta más su pintada, ¿lo podrías igualar? el nuestro parece más irreal»* · *«se ven más profesional, ¿verdad?»* · *«a ver si lo igualas, que tú sé que puedes»*.

Lo que hace que la suya se vea «profesional»: el mapa es NEGRO donde no hay eco, el color arranca en 5 dBZ a corte seco y la escala es la de radar (verde → amarillo → rojo → morado). Lo nuestro ya tenía la capa **Reflectividad** (mm/h del modelo → dBZ por Marshall-Palmer, ESTIMADA) con casi los mismos colores, pero: (1) la escala se fundía desde 0 dBZ, así que 0,01 mm/h salía como velo verdoso sobre medio Atlántico; (2) «Valores» rotulaba «−9» sobre el mar; (3) sobre fondo Claro o Color el verde flojo se perdía. Cambios en `maps.js`:

- `DBZ_SIN_ECO = 4.9`: la escala de dBZ arranca ahí con alfa 0 (quince tramos, como antes, para que la barra cuadre). Por debajo de 5 dBZ no se pinta. **No se toca el dato:** al pulsar el punto sale el número exacto.
- «Valores» no rotula por debajo de 5 dBZ (convenio del radar: sin eco).
- `sueloParaLluvia(modo)`: con la capa de dBZ (Reflectividad y Radar + previsión) el suelo va casi negro (`#1b1d21`) y el mar negro (`#0b0c0f`), como AguaceroWx; con mm/h sigue el gris de Windy; en fondo Oscuro no se pone nada encima.
- Cuatro pruebas nuevas en `pruebas.js` (1061 ✓).

Lo que NO se ha igualado (apuntado por si lo pide): las isobaras (líneas de presión) que AguaceroWx dibuja encima, y su «tipo de precipitación» (verde lluvia, azul nieve, rosa hielo): eso es otro campo del modelo, no sale de los mm/h.

Sus dos preguntas (14:15): «¿dBZ qué es?» → decibelios de reflectividad, la unidad en que el radar mide la fuerza del eco: 5 dBZ apenas llovizna, 20 ≈ 0,6 mm/h, 35 ≈ 5-6 mm/h (chaparrón), 45 ≈ 20 mm/h (tormenta), 55+ granizo probable. «¿Valores?» → el botón del mapa que imprime los números del modelo encima de la capa.

**14:15-14:30, builds 1413 y siguiente.** Suyo: *«y si es de lluvia prefiero en mm»* → la misma pintada negra bajo Precipitación (mm/h): primer azul al 75 %, nada por debajo de 0,1 mm/h, «Valores» con un decimal y sin «0» donde no se pinta. *«Más fino, no en cuadrados, si puedes»* → la librería de teselas admite `nearest/linear/cubic/monotone`; las capas de lluvia (`INTERPOLACION_SUAVE`: lluvia, dbz, sombraLluvia) pasan a `monotone` (cúbica monótona: redondea sin rebasar los nodos, la cúbica normal sí rebasa) y la lluvia en mm/h entra en `ESCALAS_SUAVES` (color_blend). MEDIDO en producción con datos en caché, 4 teselas z5 ECMWF 25 km: linear 194 ms · monotone 260 ms (la medición vieja de ×25 era `cubic` + `tile_size=512`). Probado en vivo con `setTiles` antes de publicar: monotone y cubic se ven igual; se queda monotone. El resto de capas sigue en lineal hasta medir ICON-D2.

**Pendiente que ha pedido (14:12-14:16, capturas de AguaceroWx):** *«mira cómo combina los colores»* · *«según intensidad»* → su capa «Reflectividad del tipo de precipitación»: verde lluvia, azul nieve, rosa lluvia helada, morado granizo, cada uno con su rampa por intensidad. Con lo que dan las teselas de Open-Meteo: ECMWF 25 km tiene `precipitation` + `precipitation_type` + `snowfall_water_equivalent`; ICON-EU tiene `rain`, `showers`, `snowfall_water_equivalent`; AROME solo `precipitation`; GFS no trae precipitación en teselas. Se puede montar «Tipo de precipitación» apilando: lluvia (verde por mm/h) + nieve (azul por mm/h de agua equivalente) encima, y en ECMWF el tipo 3 (lluvia helada) en rosa. Nada inventado: cada color sale de una variable del modelo. También le gustó la capa de ráfagas de AguaceroWx (azul → rojo continua, con isobaras y rótulos): las isobaras son `contours=true` de la librería, ya usado en Presión.

**14:35, capa nueva «Tipo de precipitación» (grupo Lluvia, `id:'tipo'`).** Lo pedido en las capturas de las 14:12-14:14: lluvia en verde y nieve en azul, cada una con su rampa por intensidad (mm/h). Base `precipitation` con escala `lluviaVerde` (verdes hasta 4 mm/h, amarillo a 7, naranja 12-20, rojo 35, morado 60: la rampa de radar de AguaceroWx pasada a mm/h) y encima `snowfall_water_equivalent` con `nieveAzul`. Las dos del mismo modelo, apiladas con el mecanismo `encima` que ya usaba «Nubes total». Lo publican ECMWF 25 km, ICON-EU e ICON-D2; AROME solo lluvia → `publicaEncima` mira `meta.variables` y, si falta, lo dice en el sello en vez de pedir una capa de «trozos sin cargar». Lluvia helada y granizo no vienen en teselas: no se pintan (y se dice en la descripción). Ojo al despliegue 6 (14:25): falló «a otras horas» porque el parche de esta capa se aplicó mientras revisar.sh releía maps.js; no era la hora, era el archivo cambiando debajo. Lección: no tocar el repo mientras corre un despliegue.

### §23 · 18-09-2026, 00:10-00:30, portátil: el iPhone, el enlace caído y la ubicación que le sigue

**El chat en el iPhone «perdido toda la tarde».** El Mac decía Remote Control «on» y el iPhone no recibía nada. Apagar y encender el enlace (`set_remote_control` off → on) lo arregló al momento. No fue el sueño del Mac (él: «el MacBook estaba despierto»); lo más probable es que el puente se rompiera cuando el portátil se apagó por batería a mediodía y quedara marcado como activo sin estarlo. No hay registro que lo confirme. **Si vuelve a pasar: lo primero es reconectar el enlace**, no buscar en la app.

**«Aitor Meteo como app no la veo en el iPhone» / «quiero darle acceso a ubicación».** La añadió a la pantalla de inicio **desde Chrome, no desde Safari**. En iOS eso es un acceso directo que abre dentro de Chrome: los permisos (ubicación) son los de Chrome en Ajustes, no aparece como app propia, y —lo importante para su trabajo— **los avisos al móvil (push) en iPhone solo funcionan si la app se añade desde Safari** (Compartir → Añadir a pantalla de inicio). Manifiesto, iconos e icono de Apple comprobados: todo 200.

**«¿Por qué tengo que darle a ubicación cada vez que me muevo de sitio?»** → `irAMiUbicacion()` y `seguirSiEsMiUbicacion()` en `app.js`: el sitio que sale del GPS va marcado `gps: true`; al arrancar y al volver a pantalla se vuelve a leer la ubicación en silencio y, si se ha movido más de `KM_PARA_MOVERSE` (1 km), se cambia al sitio nuevo con «Te has movido: ahora en …». Un sitio elegido por nombre (torre, pueblo) no se toca nunca. Sin permiso o sin señal, en silencio no se dice nada. Cuatro pruebas nuevas (1071 ✓).

**01:51-02:00, Horas en el iPhone («se ve raro en Horas, vertical, fino» · «¿en agenda mejor?»).** Reproducido en el navegador a 375 px: tarjetas de 118 px y las 48 estiradas a 541 px (la altura de la hora con más chips), «0% · 0,0 mm» y «Racha 28 km/h» partidos en dos líneas. Arreglo en `styles.css`: `.hlist{align-items:flex-start}` (cada tarjeta con su altura), `.hcard{width:150px}` en pantalla estrecha (como las horas de la agenda, que él prefirió) y `.hcard__g{white-space:nowrap}`. Probado en vivo inyectando el CSS antes de publicar: alturas de 304 a 431 px según lo que lleve cada hora. Dos pruebas nuevas (1073 ✓).

**01:56-02:05, «en Mar ya no sale el tiempo» · «ni en Horas».** Las horas del eje (06 · 12 · 18 · 00) de la gráfica de Horas, y el «ahora» y las letras P/B de la gráfica de mareas, iban DENTRO de un SVG con `preserveAspectRatio="none"`, que en el iPhone las aplastaba hasta dejarlas ilegibles (el «ahora» era una mancha). Misma lección que la leyenda (24-08) y el oleaje (29-08): el texto va FUERA del SVG. Ahora las dos gráficas se envuelven en `.gcaja` (position:relative) y los rótulos van en `.grot` (capa absoluta, pointer-events:none) colocados por porcentaje: `grot__h` (horas y «ahora»), `grot__pb` (P/B, con `rotulosMarea()`). Tres pruebas nuevas (1076 ✓). Regla para el futuro: **ningún `<text>` dentro de un SVG estirado**, y la prueba lo vigila.

**09:36, la portada en el móvil («en Mar ya no sale el tiempo» · «ni en Horas» · «sigo sin ver en 10 días el mapa arriba» · «en el Mac lo veo»).** Lo que echaba de menos era la PORTADA (sitio, temperatura, franjas) arriba de cada pestaña, que en escritorio sale en todas y en móvil la había dejado yo solo en Ahora («para no comerse la pantalla»). Ahora en pantalla estrecha sale en Ahora, Horas, 10 días y Mar; fuera en mapa, radar, rayos, cámaras, torres, guía y avisos. Prueba nueva (1077 ✓). Nota para mí: «el mapa arriba» y «el tiempo arriba» son la portada con la foto de Gaztelugatxe, no un mapa.

**18-09-2026, 11:40, datos de campo suyos:** *«sirimiri toda la mañana, paraba y otra vez empezaba»* · *«16 grados de media en Bermeo y Bilbao»*. AEMET (UTC): Matxitxako 06-11Z lluvia 0 · 0,4 · 0 · 0,2 · 0 · 0 mm; Forua 0 · 0,2 · 0,4 · 0 · 0 · 0,6 mm — sirimiri a ratos, tal cual lo dijo. Temperatura a las 08Z (10:00): Forua 16,0 · Bilbao aeropuerto 15,9 · Matxitxako 17,2; a las 11Z: 17,6 · 18,6 · 18,3. **Modelos para 06-12 h (pasadas de la mañana):** ECMWF llovizna (código 51) todas las horas con 0,1-0,3 mm/h → lo clavó; AROME HD (dueño) 0,1 mm a las 06 y 07 y seco después → se lo perdió otra vez (van cinco veces con el sirimiri de la costa); ICON seco hasta las 11; GFS 0,2 a las 09-10 con llovizna. La app a las 09:43 decía «Cubierto · lluvia débil desde las 11:00» (AROME) con el chip «ve más lluvia de 09:00 a 13:00: ECMWF 2,1 mm»: el chip avisó, el dueño no. **Y la temperatura de Ahora: 19° a las 09:43 con AEMET en 16** (el «19° · Medido a las 09:30» sale del `current` de Open-Meteo, que es modelo a 15 min, no estación). Apuntado para el marcador de acierto: el sirimiri costero es de ECMWF, y el «ahora» de temperatura va 2-3° caliente en mañanas de sirimiri.

**14:08-14:25, sus capturas de las 17:00, la nuestra (ECMWF 25 km) y AguaceroWx (GFS 06z, reflectividad compuesta):** *«esos dibujos verdes no me gustan mucho»* · *«formas raras»* · *«veo rojos también, el nuestro no marca»* · *«afina esta capa, esas pintadas son algo raras»* (esta última con Precipitación en mm/h). Diagnóstico honesto: (1) lo que pintaba medio Atlántico de verde pálido era el tramo 5-10 dBZ = 0,07-0,15 mm/h de llovizna del global, que un radar apenas ve → la Reflectividad no pinta nada hasta 10 dBZ (`DBZ_SIN_ECO = 9.9`; 15 tramos, barra igual), y los dos primeros verdes con más cuerpo; en Precipitación (mm/h) sigue saliendo todo desde 0,1, pero el tramo 0,1-0,3 entra como velo (40 %) para que cada celda de 25 km no sea un cuadro macizo. (2) Los rojos: nuestra reflectividad sale de la lluvia MEDIA de una hora en una celda de 25 km convertida por Marshall-Palmer, y eso nunca llega a 50 dBZ; la de AguaceroWx es la reflectividad simulada del propio modelo, instantánea, que ve los núcleos. Con AROME HD o ICON-D2 (1-2 km) aquí sí salen naranjas y rojos en tormentas. No se toca la conversión: sería inventar intensidad. (3) La tierra gris: la sombra del relieve al 32 % sobre el suelo negro; bajo las capas de lluvia (`CON_SUELO_NEGRO`) la sombra se apaga, el botón Relieve no cambia. Pruebas actualizadas (1080 ✓).

**14:24-14:40, «se satura bien a lo primero y se desatura después» · «como sin contraste» · «y no el fondo, el contraste en general» · «dale duro, púlelo bien».** Tres causas y tres arreglos en `maps.js`: (1) al pasar las escalas de lluvia a color_blend, el tramo 0→0,1 se fundía de alfa 0 al primer color y las trazas de 0,02 mm/h del global salían como velo sobre TODO el mapa → `corteSeco()`: breakpoint a 0,099 con alfa 0 en lluvia, lluviaVerde y nieveAzul (`desde: 1` para que la barra no cambie); (2) la capa iba al 75 % del deslizador y se lavaba con el fondo → bajo suelo negro (`CON_SUELO_NEGRO`) la opacidad mínima es 0,95, como en nubes (0,92); (3) primer azul de la llovizna al 55 %. **Y tres publicaciones seguidas paradas por guardas de datos en vivo**, no por código: `prueba-mal-tiempo` (fetch a Manila falló) y dos veces `prueba-mapas` (el catálogo de ECMWF HRES de Open-Meteo contestaba «{}»). En `revisar.sh` el comentario decía «esto AVISA pero no bloquea» y la línea hacía `|| exit 1`: ahora avisa a gritos y sigue. La de mal tiempo se deja bloqueando (es el vigilante con números reales), pero si vuelve a fallar por «fetch failed» es red, no código: reintentar.

**Contraste de las apuestas del 17-09 (hecho el 18-09 a las 14:45; el de las 22:00 se quedó sin hacer por lo del iPhone).** Con METAR de ayer 14Z-20Z (16-22 h local); AEMET no devolvía ya la historia de ayer por la tarde.
- **Tenerife Norte**: racha máx 33 kt = 61 km/h. ECMWF (dueño) decía 59 → **acierto**.
- **Ibiza**: la tormenta fue a mediodía (12Z: +TSRA y 61 km/h en Es Codolá, 0,3 mm hasta entonces); por la tarde solo chubascos flojos y racha ≤ 22 km/h. AROME 0,0 mm se quedó corto; GFS 15,7 mm a las 14 h se pasó mucho; ECMWF 1,8 fue el más cerca. La racha de 61 no la vio nadie (AROME 30-35, ICON 39).
- **Cuenca**: sin datos AEMET de la tarde; queda sin contrastar.
- **Ciudad del Cabo**: racha máx 32 kt = 59 km/h de 14 a 20Z (y 69 a las 11:25Z). ECMWF 60-67 → **acierto**; el Automático con 90 se pasó.
- **Trieste**: de 14 a 20Z NADA de lluvia y racha 9 kt. Los 32 mm de ECMWF y los 18 de GFS para la tarde no cayeron (la lluvia fue por la mañana, 08-12Z); **ICON, con 0,5 mm, fue el que acertó**. Ojo: el chip de la app decía «ECMWF 6,6 mm/h a las 18 y 20 h».
- **Génova**: tormenta con lluvia a las 16:20-16:50Z (18:20 local). ICON la daba a las 16 h local con 5,6 mm → acertó el qué, dos horas antes.
- **Dublín**: racha máx 26 kt = 48 km/h; ECMWF decía 62,6 → se pasó.
- **Bergen**: racha ≤ 13 kt = 24 km/h con chubascos; ICON decía 64,8 y ECMWF 37,8 → los dos se pasaron, ICON mucho.
- **Chichijima (Dujuan)**: sin METAR, sin contrastar.
Lectura para el marcador: en viento, ECMWF va bien en Canarias y Ciudad del Cabo y se pasa en Dublín; el Automático se pasa; en lluvia de tormenta nadie clava la hora ni la cantidad y los globales tienden a poner de más (Trieste, Ibiza-GFS).

**14:46, «uf», su captura del Mac: «No se ha podido cargar el mapa ({… "Failed to initialize WebGL"})» · «en el iMac va bien» · «¿será que falta actualizar?».** No es la versión: es Chrome, que tras varias pérdidas de contexto WebGL en la misma pestaña (hoy el mapa se ha recargado muchas veces) corta WebGL a esa página hasta que se recarga. Arreglo en `maps.js`: el `catch` de open() reconoce el fallo de WebGL, recarga sola UNA vez (marca `mapaSinWebGL` en sessionStorage, que se borra cuando el mapa carga bien) y, si vuelve a fallar, lo dice en cristiano con botón «Recargar» y el consejo de cerrar pestañas o reiniciar el navegador. Dos pruebas nuevas (1083 ✓). **Y la SSD se queda en este MacBook Pro** (suyo, 14:50: «no la saco, ya se queda en este MacBook Pro»).

**17:15, decisión suya: avisos oficiales SOLO de España.** Enseñó el aviso amarillo de tormentas de Meteoalarm en Emilia-Romaña; comprobé que Meteoalarm tiene el mismo feed por país (Italia, Francia, Portugal, Alemania…) y le propuse enseñar los del país del sitio que esté mirando, solo al abrir la pestaña Avisos. Dijo **«No»**. No se vuelve a proponer.

**20:37, Baquio (la ubicación le siguió sola: Bermeo → Barakaldo → Baquio en el día), «falta dirección de viento poner» · «lo quiero arriba también» · «si no tengo que desplazarme hasta abajo» · «de dónde llega».** Tres sitios: (1) portada, nueva línea `#nowViento`: «Viento 8 km/h del noreste (40°) · racha 17 km/h a 10 m», del `current` del modelo; (2) cada franja: «Viento 9–12 km/h del noroeste a 10 m», con el rumbo de la hora de MÁS viento de la franja, literal del modelo (no una media de rumbos, que sería un número que no ha publicado nadie); (3) la línea de lo medido: «AEMET Matxitxako (5,2 km): 19,1° · viento 12 km/h del noroeste · racha 20 km/h · HR 80 % · 0,0 mm en la hora · a las 20:00». Tres pruebas nuevas (1086 ✓). Su pregunta «¿AEMET? ¿pero no pillas de nuestra app?»: la app no tiene sensores propios; lo medido sale de la estación oficial de AEMET más cercana, pedida a través de nuestro propio `/estaciones` (el mismo camino que «Mis estaciones»), y las mareas de Euskalmet. El resto es modelo, y se dice cuál.

**19-09-2026, 12:24, datos de campo suyos (tres fotos, Bermeo): cielo azul con velos altos finos (cirros y estelas), sol pleno, «brisa hay».** Modelos a las 12:00: AROME nubes 0/0/0 % y viento 17 km/h del este (83°) → el viento lo clava, el velo alto no lo ve; ECMWF baja 0 · media 0 · alta 52 %, código 0, viento 4 km/h → el cielo lo clava, el viento se lo come; ICON baja 41 % · alta 51 % → inventa nube baja que no hay; GFS alta 22 %, 23,2° (caliente). AEMET Matxitxako 08Z: 18,4°, viento 16,6 racha 26,6 del este (95°). Para el marcador: sobre el cielo de la costa, otra vez ECMWF; sobre el viento a 10 m, AROME.

### §24 · 19-09-2026, 12:26-12:45, portátil: repaso de sus capturas de escritorio y el oleaje por horas

**Sus ocho capturas de las 12:26 («revisa esto luego»)**, revisadas: Ahora, Horas, 10 días y Mar consistentes entre sí (misma racha 30 a las 12:00 en portada, franja, Horas y 10 días; CAPE 50 del tramo 12-13 contra 60 de la franja porque la franja lleva el máximo a las 13:00; «Mín 16°» sin hora porque ninguna hora del hourly se acerca a menos de un grado al mínimo del daily, regla del 08-09). Dos cosas que sí mejoran: (1) la lectura AEMET de Matxitxako era de las 10:00 a las 12:26 —el feed de AEMET va con retraso para esa estación— y la línea no decía cuánto de vieja: PENDIENTE poner «hace 2 h» cuando pase de 60 min; (2) el «Ha cambiado a las 12:26: antes sol velado» junto a «Sol velado · despejado desde las 17:00» se lee redundante (compara el texto entero); menor, se deja.

**«Si quiero saber qué oleaje va a haber en Bermeo sobre las 18 h, ¿dónde miro? Hay regatas» · «en Mar solo pone lo de ahora, ¿no?».** Tenía razón: estado de la mar (ahora) y gráfica de 48 h con el máximo, pero ni un número por hora. Nueva tarjeta «Oleaje por horas» bajo la gráfica (`#waveHours`, `pintarOleajeHoras()`): una tarjeta por hora desde la hora en curso, 48 h, con ola y de dónde viene, periodo, mar de fondo (altura y periodo), mar de viento, y el viento a 10 m de esa misma hora con rumbo y racha del modelo de tiempo. Al modelo marino se le piden además `wave_direction` y `wind_wave_height` por horas. Sin semáforo: para la mar no tiene listones. Tierra adentro la tira se vacía. Cuatro pruebas nuevas (1090 ✓).

## §25 · MAR EN EL MAPA Y LA CELDA DE LA PESTAÑA MAR (19-09-2026, 15:00-17:00, portátil)

**Lo que pidió**, el sábado de las regatas de Bermeo (4 largos, 5.556 m,
campo del espigón hacia Izaro), con Windy y Ventusky delante: *«en mapas
no tengo mar, ¿lo pones? sería lo suyo ponerlo»* y, sobre la nota de la
celda, *«sí»*.

**Lo hecho**
- `maps.js`: grupo **Mar** al final de la lista de capas: Altura de ola,
  Periodo, Mar de fondo, Periodo del fondo, Mar de viento (m y s, tal cual
  el modelo). Escalas de color de la leyenda Mar de Ventusky (sus capturas
  de las 15:23), fundidas (`color_blend`) pero en interpolación LINEAL.
- Modelos de olas con `mar:true` en `TMODELS` (no salen en la fila de
  botones) y lista `MODELOS_OLAS` = EWAM (DWD, 0,05°, Europa, cada hora)
  → ECMWF WAM 0,25° → GFS Wave 0,16°. `resolverModelo()` busca SOLO ahí,
  en orden estricto, y marca `mar:true` (no «sustituido»): el cartel dice
  «Mar: olas de EWAM…».
- El clic lee también la dirección (`direccion` de la capa, misma pasada
  y hora, tesela descargada si hace falta): «1,9 m · del norte (2°)».
  Si el modelo no publica esa dirección, no se inventa.
- `app.js`, pestaña Mar: `notaCeldaMar()` → «Leído en la celda del
  modelo de olas: mar abierto a 13 km al norte de Bermeo (43,54, -2,71).
  Pegada a la costa, la ola puede ser otra.» Con `acimut()` nuevo.
- Sin asterisco en las capas de mar (`propia()` las da por propias).

**MEDIDO en local antes de publicar (servidor estático, Chrome del
portátil)** — esto es lo que decide el orden de modelos:
- `meteofrance_wave` (MFWAM 0,08°, el que lee la pestaña Mar): 26 MB por
  paso, 9,2 M de puntos. Primera tesela 14 s; después `Aborted(OOM)` tres
  veces, dos recargas solas del guardia de memoria y el mapa muerto. FUERA
  del mapa (sigue en la pestaña Mar por la API de puntos, que es otra cosa).
- `dwd_ewam`: 36-59 MB de memoria, pinta en ~10 s, fondo y mar de viento.
- `ecmwf_wam025`: 41 MB, bien, pero sin dato a <20 km de la costa y sin
  fondo/viento. `ncep_gfswave016`: 48 MB, hueco grande junto a la costa.
- `ecmwf_wam` (9 km, el de Windy) está en el bucket y NO se ha probado.
- Ningún modelo tiene celda en los primeros 5-15 km de costa: el campo de
  regatas (1,5 km) no lo cubre nadie. Se deja vacío, no se rellena.
- Interpolación monótona en el mar: polígonos de lados rectos donde las
  celdas de tierra no tienen dato. Lineal se ve como Ventusky.

**Contraste del día (nada inventado):** organización de la regata: NNW,
1,5 m, 13 s. Modelos a 13 km: 1,9-2,1 m, 319°, 12 s. Boya de Donostia
(EuskOOS, 13:00Z): 2,4 m, hmax 3,5, 343°, tp 12,5 s. Boya de Mutriku
(09:00Z): 2,5 m, tp 13,3 s, del N.

**PENDIENTE (encontrado hoy, sin hacer):** EuskOOS publica las boyas en
un ERDDAP público, sin clave y con CORS abierto:
`https://www.euskoos.eus/erddap/tabledap/boyaDonostia_NRT_hourly_data.json?time,hm0,hmax,tp,tm02,wave_dir&orderByMax("time")`
(43,566 N · 2,012 O; hm0 = altura significativa, hmax, tp = periodo de
pico, tm02, wave_dir = de dónde viene) y `mutriku_50_wave` (hm0, hmax,
tp, dirtp; cada 30 min). La de Sopelana lleva parada desde mayo de 2026.
`Bilbao_Station` da error 500 en el servidor. Es el «medido de verdad»
del mar para la pestaña Mar, como la línea de AEMET en Ahora. La API de
Euskalmet con nuestra clave NO lista boyas (153 estaciones, ninguna).

**HECHO en la publicación siguiente (19-09-2026, 16:15):** la boya ya está
en la pestaña Mar. `BOYAS_EUSKOOS` en `app.js` (Donostia, Mutriku,
Sopelana, plataformas de Pasaia y Bilbao, posiciones del
`platforms.geojson` de EuskOOS), `leerBoya()` pide SOLO las últimas 6 h
(`time>=now-6hours&orderByMax("time")`, 404 = no ha hablado → no sale) y
`pintarBoyaMar()` enseña la más cercana que conteste hasta 80 km, con
caché de 10 min y una sola petición en marcha por sitio. Cada campo pasa
por su rango (la plataforma de Bilbao manda -9999 en el agua: centinela,
no medida). Sin clave, sin Vercel: va por CORS desde el navegador.
Medido en local a las 16:05: «Medido de verdad · Plataforma de Bilbao
(EuskOOS, 30 km): ola 2,0 m · máxima 3,5 m · periodo 14,3 s · a las
15:40», con el modelo al lado diciendo 2,0 m · 12,2 s. Cuadran.

**Dato de campo, 19-09-2026 19:21, Bermeo, campo de regatas (sus fotos desde
el espigón):** cielo despejado sin una nube; mar casi llana dentro del
campo, al abrigo del espigón, sin marejadilla de viento; el fondo del NO
rompía en blanco en las rocas de la punta y bajo Izaro. A esa hora:
modelo (celda 13 km N) 1,8 m · 320° · 11,7 s · mar de viento 0,1 m;
plataforma de Bilbao 17:00Z 1,8 m · máx 2,5 · 12,5 s · viento 5,9 del
ENE; boya de Donostia 17:00Z 2,3 m · máx 4,5 · 13,3 s · 340°. Todo
cuadra con la foto: fondo largo del NO que se ve en las rocas, y dentro
del campo, mucho menos. La nota «pegada a la costa, la ola puede ser
otra» es exactamente esto.

### §26 · 20-09-2026, 10:15-10:30, iMac (SSD de vuelta del MacBook, cinco días de portátil)

- **Estado al enchufar:** HEAD 65ccd96 (19-09 19:22), árbol limpio, 50 commits «Aitor (portátil)» desde a9f03d9; sello local = web = **2026.09.19-1615**. Leídos §17 a §25. Nada que integrar a mano: **el repo del SSD es la única copia**, y 65ccd96 desciende de f778fce (la rama `casa-2026-09-15` de GitHub): la subida es un avance limpio, **sin rebase ni cherry-pick** («los dos historiales no comparten base» del mensaje del portátil no aplica: es la misma historia). `git push` sigue en `deny` para Claude: la sube Aitor con `./subir-a-github.sh` → rama `casa-2026-09-20`.
- **`probar-avisos.sh` desde el iMac (con clave):** los cuatro pasos en verde, «los avisos al móvil llegan». El almacén está en **3 aparatos**, los suyos: los «prueba automática» que dejaba el portátil (que allí fallan siempre por no tener `clave-avisos.txt`, con 410 de caducada) ya se limpiaron solos con algún aviso real de estos días.
- **El SSD vuelve al MacBook** en cuanto Aitor suba a GitHub: el trabajo sigue allí. Reglas que siguen: candado apagado (`APAGADO = true`) hasta que él diga; nada inventado, cifras literales del modelo; avisos oficiales solo España; sin cuentas de pago ni claves nuevas.
- Pendientes que deja el portátil y que no se han tocado aquí: «hace 2 h» en la línea de AEMET cuando la lectura pase de 60 min (§24); `ecmwf_wam` de 9 km sin probar en el mapa (§25); velocidad y número de motas de viento en el iPhone (§17).

### §27 · 20-09-2026, 10:30-10:55, iMac: lo que quedaba antes de la prueba de fuego del lunes (build 2026.09.20-1038)

Encargo del chat del portátil (vía Aitor), cuatro puntos. Hecho y no hecho:

1. **HECHO. La lectura de AEMET dice cuánto de vieja es** (§24): `haceTxt(cuando, ahora)` en app.js, delante de `pintarMedidoCerca`; la línea «Medido de verdad» pone «· a las 10:00 **(hace 2 h)**» cuando la lectura pasa de 60 min (de 61 a 119 en minutos, desde 2 h en horas enteras; sin fecha, nada). Cinco pruebas vistas en rojo antes. En producción a las 10:40, Matxitxako de las 10:00 → 40 min → sin coletilla, correcto.
2. **HECHO Y FUERA. `ecmwf_wam` (olas 9 km, el de Windy) medido en el Chrome del iMac** metiéndolo primero en `MODELOS_OLAS` desde la consola (build 1615, «Altura de ola», zoom 6, Cantábrico): el montón de JS sube de 56 a **219 MB**, pinta a los **~55 s** y acto seguido el mapa se queda sin memoria y se recarga solo (cartel «se había quedado sin memoria», `torre.teselasALaVez` a 2). **EWAM en las mismas condiciones: 47 → 54 MB y pintado en menos de 20 s, 0 fallos.** Se queda fuera, como `meteofrance_wave`; el comentario de TMODELS ya no dice «sin probar» sino lo medido, y una guardia fija `MODELOS_OLAS` (EWAM primero, sin ecmwf_wam ni meteofrance_wave), vista en rojo rompiendo la lista.
3. **NO HECHO: motas de viento en el iPhone.** Hace falta su iPhone delante. Queda para el lunes con viento de verdad, como decía §17.
4. **HECHO. Repaso de la prueba de fuego en producción (build 1038, Chrome del iMac):** Bermeo y Vitoria-Gasteiz (interior), pestañas Ahora, Horas, 10 días, Mar y Mapa: **0 «undefined/NaN», 0 «--», 0 tarjetas vacías** (Horas 96 y 48 tarjetas, 10 días 10, Mar 48 horas de oleaje + boya «Plataforma de Bilbao (EuskOOS, 30 km): ola 1,5 m · máxima 2,1 m · periodo 11,1 s · a las 10:20»; en Vitoria la parte de mar no aparece, que es lo que toca). Candado apagado en lo servido (`var APAGADO = true`). `probar-avisos.sh` desde el iMac: 4/4 en verde, 3 aparatos (los suyos). Mapa: EWAM pinta; ráfagas ICON-EU pinta; 0 fallos.

Publicado en UNA tanda (`deploy.sh`, 1101 pruebas en verde): build 2026.09.20-1038. GitHub: la sube Aitor con `./subir-a-github.sh` (rama `casa-2026-09-20`, avance limpio sobre lo de esta mañana). **El SSD vuelve al MacBook esta noche**: aquí no queda nada pendiente que necesite el disco, y el trabajo sigue allí. Ojo al que lo coja: en el Chrome del iMac dejé el mapa en Ráfagas y el sitio en Bermeo, como estaban.

**11:00, OPCIÓN A publicada (build 2026.09.20-1052, commits 6c2bc29 y 98e177b): sin rumbo en el clic de las capas de Mar.** Orden del chat del MacBook vía Aitor («si la B se alarga, publica ya la A»). **Medido antes en el Chrome del iMac (build 1038, EWAM, «Altura de ola», dom 20 a las 11:00):** el clic decía «1,8 m · del norte (2°)» en 43,60/-2,90 **y también** en 43,90/-3,50; la API marina del mismo modelo y hora (`/om?api=marine&models=ewam`) daba **318° y 319°** (noroeste) en esos dos puntos, con 1,80 y 1,82 m. La altura cuadra; el rumbo sale siempre ~2°. Y ojo: el ejemplo de §25 («1,9 m · del norte (2°)») ya era ese mismo 2°. Hecho: `RUMBO_EN_CLIC_MAR = false` en maps.js (junto a MODELOS_OLAS), la lectura sigue escrita detrás del interruptor; guardia nueva vista en rojo y la del portátil («el clic … lee también de dónde viene la ola») reescrita para admitir el interruptor. 1102 en verde.

**OPCIÓN B, PARA EL MACBOOK (sin hacer):** averiguar qué devuelve `OMWeatherMapLayer.getValueFromLatLong(lat, lng, uD)` sobre la variable `wave_direction`: no son grados. Pistas: (1) `uD` sale de `omUrl(L_.direccion, …)` con `limpiarMarca`, pero `omUrl` mete `interpolation=linear` y la marca de la escala de la CAPA (`ola`) al buscar por variable — la tesela de dirección puede estar pidiéndose con la escala de altura y devolviendo el valor «pintado» o un índice; (2) la dirección es circular: interpolar linealmente 350° y 10° da 180°, y un «2» constante huele a valor normalizado (¿0-1?, ¿radianes?); (3) comparar en consola `getValueFromLatLong` de `wave_height` (que cuadra) y de `wave_direction` en el mismo punto, y contra la API marina del mismo modelo (`models=ewam`). Cuando cuadre en dos puntos con la API, `RUMBO_EN_CLIC_MAR = true` y las dos guardias.

### §28 · 20-09-2026, 11:00-12:30, portátil: MIS ESTACIONES A PIE DE CASETA, y los fallos de sus catorce pantallazos

**Lo que dijo**, con las tarjetas delante y la prueba de fuego al día
siguiente: *«eso de trabajo a 40 metros fuera, solo a pie de caseta,
resto sobra»* · *«de torre no quiero ver nada»* · *«el 90 % del trabajo
es a pie de caseta: contadores, fusibles, cuadros, grupos electrógenos,
cortar la hierba del recinto»* · *«ya decido yo con lo que tengo en la
base de la caseta más 40 metros de torre»* · *«tienen que cuadrar los
datos»* · *«con calma y revisa 2 veces»*.

**Lo que estaba mal (visto en sus capturas de las 11:03-11:07):**
1. BI BERMEO, Balmaseda, Zornotza: «nuestro pronóstico se pasó 4 km/h —
   el de ECMWF, que es el que se enseña arriba». Arriba (cabecera) se
   enseñaba el modelo cargado con 9 y la estación midió 9: clavado. El 13
   era el más alto de los cinco. La frase acusaba al modelo equivocado.
2. Gernika2 y Zornotza: «a las 15:00 · racha 30» y dos líneas más abajo
   «Racha máxima 31 a las 15:00». No era redondeo: la línea de horas es
   el modelo cargado y la máxima es la más alta de los cinco, y ninguna
   decía de quién era.
3. Almike y Matxitxako (AEMET): «Entre ellos: los 5 de acuerdo, 11 km/h
   de diferencia» con los modelos de 2 a 13. Se contradecía sola.
4. Matxitxako (Euskalmet): humedad **101 %** medida, y «ninguno se acerca»
   con los modelos de 72 a 90. Sensor saturado tomado como medida.
5. Amorebieta-Etxano: veredicto «se pasó 9 km/h» comparando la hora en
   curso del modelo con una lectura de AEMET de hace 65 min.
6. Sollubemendi (trabajo a 40 m): «racha 40 a las 15:00» (estimada a
   40 m, sin decirlo) y «racha máxima 35 a 10 m». Y con trabajo a 10 m,
   dos casillas iguales: «racha a 10 m» y «racha a 10 m de altura».

**Lo hecho (build de esta publicación):**
- `ALTURA_CASETA = 10` en `app.js`: `cargarTorres` (y la vía de copia)
  construyen las horas con `buildHours(fc, ALTURA_CASETA, p)`. Nada se
  estima a otra altura en Mis estaciones: cabecera, semáforo, línea de
  horas, racha máxima y tabla contra el aparato, todo a 10 m.
- Cabecera: UNA racha («racha a 10 m · a pie de caseta») y UN viento
  («viento a 10 m · del …»). Pie: «A pie de caseta · a 10 m · cota X».
  Ajustar solo pide la cota; tipo y altura guardados se conservan sin
  pintarse. (En Ahora sigue su ajuste de altura: es otra pantalla.)
- Veredicto: si la lectura tiene más de 60 min, **sin veredicto** («la
  lectura de X es de hace 65 min… se compara cuando llegue la de esta
  hora»). Si el más alto de los cinco no es el cargado, se juzga a los
  dos con nombre y cifra: «el más alto de los cinco (ECMWF 13 km/h) se
  pasó 4 km/h; el de la cabecera (AROME HD 9 km/h) clavó».
- `hrMedida()`: la humedad medida no pasa de 100; se enseña «100 % (el
  aparato marca 101)» en la tabla, en el aparato y en la línea de AEMET
  de Ahora, y se compara con 100.
- `frasesContraste`: «los 5 de acuerdo: de 12 a 13 km/h» solo hasta 5
  km/h; de 5 a 12, «de 2 a 13 km/h entre los 5: 11 km/h de diferencia».
- «Racha máxima 31 km/h a 10 m a las 15:00 · la más alta de los 5, la da
  ECMWF» y la línea de horas cierra con «cifras de AROME HD a 10 m».
- Pruebas: 7 nuevas y 4 adaptadas (las que fijaban la altura de trabajo).
  1109 en verde. Comprobado en local con dos sitios guardados (uno con
  alt 40): cabecera, pie, horas y máxima como se describe. El veredicto
  y la humedad se comprueban en producción, que es donde está
  `/estaciones`.
- Y la resta del veredicto va entre los enteros que se ven: en Zornotza
  salía «AROME HD 7 km/h clavó» con la estación en 4 (4,4 y 6,6 por
  dentro). Ahora `dif` y `difC` son `Math.round(medido) − Math.round(modelo)`.
- Comprobado en producción (build 1134, con tres sitios guardados desde el
  navegador): BI BERMEO «el más alto de los cinco (ECMWF 13 km/h) clavó;
  el de la cabecera (AROME HD 10 km/h) clavó»; Zornotza con Amorebieta a
  38 min ya da veredicto; Sollubemendi contra Matxitxako sigue en «no se
  pueden comparar» por los 236 m. La humedad de Matxitxako marcaba ya
  100 a esa hora: el caso 101 queda cubierto por la prueba.
- Publicado como build 2026.09.20-1143 y comprobado en producción: Zornotza «el de la cabecera (AROME HD 7 km/h) se pasó 3 km/h» con la estación en 4; «Entre ellos: de 3 a 13 km/h entre los 5: 10 km/h de diferencia».

**Y su orden, dicho esa misma tarde** («priorizo en: LLUVIA, VIENTO, CAPE,
NIEVE» · «NUBOSIDAD» · «lo primero siempre es si va a llover o no y cuándo;
ahí decido trabajos» · «para mañana nada, hoy todo»; esa noche programa a
la gente para el lunes): la tarjeta de Mis estaciones va ahora lluvia →
racha y viento a 10 m → CAPE y tapa → nieve (cm/h del modelo, tal cual;
en ámbar si hay o si el isocero está a la altura del sitio) → nubes (% y
lo que se ve) → rocío/temperatura, isocero, elevación, visibilidad. El
parte: lluvia → racha máxima → CAPE (también en el caso RAYO). La línea
de horas: lluvia · racha · CAPE · nieve solo si la hay · temperatura. La
tabla contra el aparato: lluvia, racha, viento, CAPE, cielo, temperatura,
humedad. «Lo que mide el aparato»: la lluvia primera. Pruebas adaptadas
(las que fijaban «las cuatro que decide» ahora son cinco con la nieve) y
4 nuevas: 1113 en verde.

### §29 · 20-09-2026, 11:50-12:30, portátil: AHORA DE UNA PASADA

**Lo que dijo**, con Ahora en pantalla: *«en un sitio todo escrito cuando
hay margen y cuesta leer»* · *«aprovecha el espacio, y ponlo bonito y
claro, en color»* · *«luego está el resto en recuadros; yo prefiero leer
todo en una pasada y menos complicado, porque tengo que mirar muchas
estaciones»* · *«fíjate todo lo que tengo que leer para saber en esa
estación qué me voy a encontrar… mucho lío»* · *«dame datos exactos de lo
que me encuentro y algunos modelos lo que ven, como en portada:
despejado, pero GFS ve lluvia a tal hora»* · *«simplifícalo»*.

**Lo hecho (app.js, index.html, styles.css):**
- Las casillas de Ahora son CINCO, en su orden: lluvia, ráfaga a 10 m,
  viento a 10 m con su dirección (la casilla «Dirección» se funde con
  ésta), riesgo eléctrico, sensación. Las dos de «estimado a X m» solo
  salen si él ha puesto una altura distinta de 10 (con 10 repetían el
  mismo número con un «×1,00»). `kLluvia, kRafaga, kViento, kRiesgo,
  kSensacion, ...(S.hgt === 10 ? [] : kAltura)`.
- «Antes de salir» a todo el ancho (`.acc` y `.cuando` sin `max-width:
  62ch`), cada línea con borde y etiqueta del color de su estado.
- La comparativa de modelos («¿Coinciden los modelos?») se pliega:
  `plegarComparativa(el)` deja a la vista la frase de color de cada
  bloque (ráfaga, lluvia, tormenta, nubes, bochorno) y mete las barras
  modelo a modelo y sus párrafos en un `<details>` «Ver por modelo ·
  …». No se quita nada: queda un toque más lejos.
- El bloque de la cota (`#elev`) pasa a estar DEBAJO de las cifras.
- 3 pruebas nuevas (1116 en verde). Comprobado en local con Bermeo
  guardado: cinco casillas en orden, cinco plegables, «Antes de salir»
  a 817 px de 998.

**INCIDENTE, y es mío (portátil, 11:40-12:45):** al comprobar Mis
estaciones en producción desde el navegador de pruebas, guardé tres
sitios inventados (BI BERMEO 43,421/-2,723 · BI SOLLUBEMENDI
43,376/-2,796 · BI ZORNOTZA 43,218/-2,733, con coordenadas
aproximadas) y la app los sincronizó con SU lista del servidor
(`/api/torres`, modo «juntar»): 23 sitios en vez de 20. Lo cazó el
guardia del vigilante («mirados: 0», fallos en todos) en la publicación
de las 12:35. Arreglo: `POST /api/torres` en modo «mandar» con los 20
reales (los mismos que `data/torres-copia.json` del 07-09; copia del
estado sucio en el scratchpad del portátil). Y para que ningún aparato
suyo que hubiera adoptado los 23 los vuelva a colar al arrancar,
`api/torres.mjs` lleva ahora una lista de BORRADOS
(`avisos/torres-borrados.json`): lo que sale por «mandar» (o llega en
`borrados`) no lo readmite el «juntar»; si él lo vuelve a guardar con el
corazón, deja de estar borrado. Sembradas las tres claves. LECCIÓN:
nunca guardar sitios de prueba en producción; para probar Mis
estaciones se usa el servidor local, y si hace falta producción, se
mira con la lista que ya tiene (la app la trae sola).
- Publicado como build 2026.09.20-1221.

**Y a las 12:45, en Mis estaciones (build de esta publicación):** la línea de horas de la tarjeta va en cuatro columnas (ahora, 13:00, 14:00, 16:00) con la hora arriba y las cifras debajo, a letra 1 rem, y las notas (viaje, modelo) debajo aparte —«aquí todo está agrupado con todo el sitio que hay»—. Y la portada del pueblo buscado NO se enseña en Mis estaciones a ningún ancho («esa no es mi estación… en Mis estaciones solo las estaciones»; Ahora, Horas y 10 días siguen igual). PENDIENTE que pidió: portada de SU estación en Mis estaciones (la primera de la lista o la que fije él), que es una obra aparte porque la portada está atada a S.place.

### §30 · 20-09-2026, 12:50-13:30, portátil: LA PORTADA DE SU ESTACIÓN EN MIS ESTACIONES

**Lo que dijo:** *«esa no es mi estación, aquí debería poner BI BERMEO»* ·
*«que salga BI BERMEO, o el primero de la lista, o el que meta yo a
mano»* · *«aunque tenga en Ahora puesto Mundaka, en Mis estaciones no
debe ser igual; en el resto (Ahora, Horas, 10 días) sí»* · *«hoy lo que
quiero es dejarlo todo terminado, adelante»* · *«tengo 9 horas para
esto, dale»* · *«autorizado para cambios y subidas de esta app»*.

**Lo hecho:**
- `pintarPortadaEstacion()` y `estacionDePortada()` en app.js: en Mis
  estaciones la portada (foto, temperatura, franjas, lo medido) es la de
  SU estación, pintada con la misma `renderNow()` y el mismo `loadAll()`
  que Ahora: los datos de la estación se cargan aparte, se guardan en
  `S.portadaEstacion` (15 min), y para pintar se cambian S.place/S.data
  un instante y se devuelven en el `finally`. `renderNow()` lleva una
  guardia: en Mis estaciones, si alguien pide repintar la del sitio
  buscado (el refresco de cada 15 min), pinta la de la estación.
  `setView()` repinta la del sitio buscado al salir de Mis estaciones.
- Cuál: la fijada con el botón «Portada» de cada tarjeta (marcado en la
  elegida), si no la primera de la lista. La elección VIAJA entre
  aparatos como el modelo o los listones: `portadaEstacion` en
  `AJUSTES_QUE_VIAJAN`, en `recogerAjustes/adoptarAjustes` y en `CAMPOS`
  de `api/ajustes.mjs` (clave lat,lon a tres decimales).
- Si no hay datos de la estación, la portada se ESCONDE
  (`.cover-fijo.sin-estacion`), nunca se queda con el pueblo de Ahora.
  En el móvil también sale (antes Mis estaciones iba sin portada).
- La línea «Medido de verdad» de la portada compara contra la portada
  que se enseña (`mostrada`), no contra S.place.
- Probado en local (servidor estático): Ahora en Mundaka; Mis estaciones
  enseña BI BERMEO con S.place intacto; «Portada» en Sollubemendi la
  cambia y marca el botón; al volver a Ahora, Mundaka. 1120 pruebas.
- El comprobador del cielo (comprobarCielo) compara la portada contra las horas que la portada enseña (las de la estación en Mis estaciones) y no contra las del sitio buscado; sin esto, paridad.cjs veía «Ahora pinta 51 y la hora en curso dice 53». Publicado como build 2026.09.20-1426.

### §31 · 20-09-2026, 15:40-16:05, portátil: EN ROJO LO QUE SALTA (Mis estaciones)

Suyo, con la app delante: «en Mis estaciones, al dar la pasada, quiero que si hay algo
que salte alarma que salte en rojo; por ejemplo en Sollube si ve CAPE que lo ponga en
rojo, si ve lluvia en rojo; así con una mirada ya se ve». Y: «si no hay nada, como hoy,
no pinta nada de rojo, claro».

- **Etiqueta del parte** (`est` en renderParte): LLUVIA y AL FILO pasan de ámbar a
  ROJO (`no`); RAYO ya lo era; SIRIMIRI se queda en ámbar (moja pero no marca, y en
  Bermeo lo hay muchos días: en rojo a diario se dejaría de mirar); SIN RAYO verde.
- **La etiqueta dentro de la tarjeta** ahora lleva su color (`<span class="pt__b"
  data-s="${P.est}">`): antes salía gris porque las reglas eran `.pt[data-s] .pt__b` y
  dentro de `.tor` no hay `.pt`. Reglas nuevas `.pt__b[data-s=…]` al final del CSS.
- **Las cinco cifras que decide** (`num()`): tercer nivel `aviso === 'rojo'` →
  `data-a="2"` (rojo, negrita). Lluvia ≥ rainWarn o llovizna por código; racha ≥ tope
  (`listonRafaga().no`, 70 en hierro); CAPE ≥ capeWarn (300, Ajustes); tapa cuando
  cape ≥ 700 y cin < 75; nieve > 0. El ámbar `data-a="1"` sigue para lo de antes y se
  repite al final del CSS con `.tor .tor__d…` para que mande sobre ctx/decide (antes
  estaba por delante y decide lo pisaba).
- **La tarjeta entera** se marca con `data-alarma="1"` (marco y nombre en rojo) cuando
  el parte del sitio va en rojo o la hora en curso pasa de los listones de arriba.
- **El CAPE del día en el parte** («120 de CAPE · tapa 3») va en rojo desde capeWarn
  (`capeTxt`, clase `rojo`), y la línea de lluvia lleva `pt__l--rojo` (barra y
  «Llueve poco/bien» en rojo) cuando el pico llega a rainWarn.
- Pruebas: 1128 ✓ (5 nuevas: LLUVIA en rojo, AL FILO en rojo, SIRIMIRI en ámbar,
  secos en verde, CSS/markup del rojo; una adaptada: la celda de la racha ahora va en
  dos líneas). Comprobado en local: hoy nada en rojo, SIN RAYO en verde dentro de la
  tarjeta, 0 celdas rojas, 0 tarjetas con alarma.

### §32 · 21-09-2026, 20:45-21:00, iMac: repaso general al volver el SSD (la prueba de fuego, día 1)

- **Lo que trajo el portátil hoy, SIN sección en este fichero:** ocho commits (05:03 → 15:57) cuyos cuerpos son las notas: el veto de rayos se perdía en la ventana en la que manda (4628113), cinco «ramas hermanas» sin arreglar (3a48a7d), las barbas del mapa apuntaban siempre del suroeste (ebb0a92: `getValueFromLatLong` devuelve la primera variable de cada pareja; el «2°» del clic de mar era la altura 1,84), el cielo votado comprobado en Bilbao (9d30f86), de interruptor a regla `puedeLeerse()` (4451f33: fuera `RUMBO_EN_CLIC_MAR`), el vigilante pedía 40 a la vez y se le caían 7 de 20 (6395c2b), verde cada 3 h (bf2ebc7) y la galerna (1b528ae: la cadencia la manda el riesgo). Quien quiera el detalle: `git log 947da1c..HEAD`.
- **Estaba publicado y sin confirmar:** `api/ajustes.mjs` con las marcas del Centro Operativo (`?que=marcas`, almacén `centro/marcas.json`, CORS para `centro-operativo-eulen.netlify.app`) y los sellos del build 2026.09.21-1840. Confirmado aquí (commit de arriba). En producción `/api/ajustes?que=marcas` contesta con marcas ya guardadas, y la web del CO lleva `js/marcas.js` enlazado: las dos puntas están.
- **Estado medido a las 20:50:** local = web = build **2026.09.21-1840**; `revisar.sh` entero en verde; `/om`, `/estaciones` (Matxitxako de las 20:00), `/api/euskalmet` (Almike, 16 min), `/rayos`, `/satelite` (18:15Z), `/mareas` contestan; vigilante: última pasada 20:00, «envía», 20 sitios de 20, 0 no mirados, ojo CAPE 140 · racha 34 · agua 0. Agenda: build 18-09-0155, tiempo OK. Centro Operativo: 200, sección Tiempo con las cifras de la app (publicado ayer a las 18:25 desde aquí).
- **Almacén de avisos: 6 aparatos, los suyos son 3.** Los otros tres son «prueba automática» del `probar-avisos.sh` del portátil (allí no hay clave y el paso 3 falla siempre); se van solos en el primer aviso real. Si molestan, se limpian desde el iMac, que sí tiene la clave.
- **GitHub:** `casa-2026-09-20` está en 947da1c; HEAD desciende de ahí (avance limpio). La sube Aitor con `./subir-a-github.sh` antes de llevarse el SSD al MacBook.

### §33 · 23-09-2026, 13:50-14:50, iMac: EL GASTO DE VERCEL («haz lo que sea para que no nos capen»)

**Lo que vio él** (Uso → Fluid Active CPU, 24-08 a 23-09): **7 h 31 min** con **4 h/mes** en el plan gratuito; 99,6 % la app del tiempo (agenda 2 min; el Centro Operativo está en Netlify y solo llama a las marcas). Por días: 20-33 min del 3 al 18-09 y **6-13 desde el 19-09** — el corte es del 18-09, cuando «Medido de verdad» de Ahora dejó de pedir Euskalmet en cada pintado. Sus palabras: «esto es mucho consumo» · «si no entro que no gaste» · «yo lo que quiero es no pagar» · «haz lo que sea para que no nos capen» · «confío en tu criterio».

**Medido en Vercel → Observability → Functions (12 h de producción, antes de tocar nada):** /api/euskalmet 26 llamadas · 34 s (**1,3 s cada una**); /api/vigilante 131 · 20 s; /api/om 280 · 13 s (es de borde y también cuenta: Vercel factura los dos runtimes como Fluid); /api/ajustes 230 · 6 s (las marcas y la jornada del CO); /api/marcador 26 · 6 s (0,23 s cada una); /api/torres 28 · 2,8 s; resto < 2 s. Dos revisores en paralelo (uno adversario sobre mi parche, otro de auditoría de todas las funciones) — sus informes están resumidos en los commits de hoy.

**Hecho, en cinco builds (1408 · 1431 · 1439 · 1445), todo con pruebas vistas en rojo:**
1. **`/api/euskalmet`** (commits 9ac348c, 006c447, da0cb21): agente HTTPS keep-alive con la CA de IZENPE (antes 10-20 conexiones TLS nuevas por llamada), 6 sockets, timeout 9 s; respuesta en el CDN según `segundosDeCache()` (5 min si se leyó todo, 1 min si alguna estación cayó por red, nada si Euskalmet no contesta); un fallo de red (timeout, ECONNRESET, 5xx, **429**) es «no he podido», distinto de «no mide viento», y no se guarda en `cacheFicha`/`cacheSensor`; reintento único con socket reutilizado; plazo global de 15 s. **Medido:** 2,1 s la primera llamada, 0,1 s del CDN después.
   **Cazado al medir:** Euskalmet devuelve **«429 Please wait 7 seconds before retrying»** cuando se le pide mucho de golpe (con 24 sockets, las cuatro fichas de Bermeo a la vez), y la app lo decía como «no publica viento en esta hora» — así que estaciones que sí miden desaparecían sin explicación, y con la caché nueva ese engaño se quedaba 5 min. Ahora el 429 es fallo de red, se espera lo que pide el servidor (todas las peticiones en vuelo) y se reintenta una vez. Comprobado: Almike y Matxitxako vuelven con racha y «hace 10 min»; el lote de 3 puntos, 6 estaciones leídas de 16 pedidas, 0 caídas, 3,1 s.
2. **«Si no entro, que no gaste»** (670ccfb): una pestaña en segundo plano en el Mac mandaba los ajustes cada 5 min y el pulso cada 10 (~216 llamadas en 12 h, más de la mitad de las del vigilante). Ahora solo con `visibilityState === 'visible'`, y el pulso se mira al volver a primer plano.
3. **El vigilante en pasada saltada** (670ccfb): ya no pide `/api/torres` (otra función Node entera, 28 invocaciones de balde), no lee el estado dos veces, y `web-push` se carga perezoso solo al enviar. El pulso y la saltada devuelven **`cpuMs` y `frio`**: medido en producción, pulso 7 ms caliente y 91 ms frío. Lo estimado pasa a medido.
4. **`/api/marcador`** (126c1d3): el GET va 5 min al CDN (recontaba 1,1 MB de muestras en cada apertura de Mis torres; el libro solo cambia cuando escribe el vigilante). Medido: MISS 0,77 s → HIT 0,11 s.

**Lo que NO se tocó, y por qué:** la cadencia del cron (cada 15 min): él pidió bajarla a la hora y luego dijo «lo que quiero es no pagar, el resto te encargas tú» — bajarla no ahorra nada medible (20 s de CPU en 12 h) y en tormenta dejaría al vigilante pasando cada hora. Tampoco la cadencia verde/ámbar/rojo ni el freno de 20 min (seguridad, suya).

**Queda de la auditoría (no urgente):** resumen precalculado del marcador y libro por meses (a 20.000 muestras el POST del vigilante costará ~1,2 s); las ≤8 llamadas `/om` en serie del vigilante por estación en una sola; el CO consulta las marcas cada ~3 min desde cada pestaña (230 en 12 h: barato, pero podría ser cada 10 y al volver). **Y medir mañana en Uso:** objetivo < 5 min/día, que son 2,5 h/mes. Ojo al que mida: cada `deploy.sh` vacía el CDN (hoy cinco publicaciones).

### §34 · 25-09-2026, 07:13-08:15, iMac: SUS DIECISIETE PANTALLAZOS («dale una vuelta si hay fallos»)

**Lo que mandó:** 17 capturas del móvil a las 07:13 (Ahora, Horas, 10 días, Mar, Mis estaciones y el marcador). Y después: *«¿pero todavía seguimos teniendo fallos?»* · *«esto no puede ser»*. Sí los había: **seis, todos de pantalla, ninguno de decisión** (semáforo, veto de rayos y ventana intactos). Arreglados en el commit 3c66f38 y publicados como build **2026.09.25-0731**, con 8 pruebas vistas en rojo antes (banco: 1284 bien, 0 mal).

| pantalla | lo que se veía | por qué | cómo queda |
|---|---|---|---|
| Horas | **luna a las 08:00** con el sol ya fuera | `horaDe` fiaba el día/noche al `is_day` del modelo y, si faltaba, a un 8-19 fijo | `diaDeLaHora()`: el medio de la hora contra el orto y el ocaso de `daily`; luego `is_day`; luego el 8-19 |
| Mar (portada y Ahora) | «Mar de fondo» y «Sube a» de **medianoche** | leían el índice 0 de la serie marina | `iHoraMar()` = hora en curso; `picoOleaje24h()` = máximo de las 24 h siguientes |
| 10 días | chapa de racha **en rojo con 36 km/h** | el CSS coloreaba la chapa por el semáforo del día (tormenta), no por la racha | `data-s` en la propia chapa: su color es el de LA RACHA |
| Mis torres (tarjeta) | «Sirimiri de 23:00 a 00:00» sin decir quién | la línea de agua no nombraba al modelo que lo ve cuando no es el cargado | `· lo ve ICON` / `· lo ve GFS` |
| Mis estaciones | «Anemómetros de AEMET cerca…» con Almike de Euskalmet debajo | texto viejo del 18-09 | «Anemómetros de AEMET y Euskalmet cerca de tu emplazamiento» |
| Marcador | «N por debajo de 10» (¿de qué?) | frase a medias | «N veces más de 10 km/h corto» |

**Comprobado sobre lo publicado, desde el panel del navegador (candado apagado):** `build 2026.09.25-0731`; 08:00 → `day:1`, 20:00 → `day:0`; «Mar de fondo 0,9 m … Sube a 2,1 m»; chapas `jue:no / racha=go`; «Sirimiri de 23:00 a 00:00 · lo ve ICON»; el texto de anemómetros; y las cabeceras de Mis estaciones **resueltas** tras cargar el lote: «Almike (Bermeo) · Euskalmet · a 1,1 km · 106 m · mide a 18 m · hace 5 min», Matxitxako, FORUA, BILBAO AEROPUERTO, MUTRIKU (AEMET, hace 35 min).

**Lo que en sus capturas parecía fallo y NO lo es:**
- «ESTACIÓN midiendo…» en todas las cabeceras: es la **carga** del lote de Euskalmet (7-8 s con el CDN frío). A los 20 s están todas. Si molesta, lo honesto es un «leyendo Euskalmet…» con segundos, no cambiar el dato.
- «Medido de verdad» en Ahora con la lectura de AEMET de **hace 2 h** mientras Almike (Euskalmet) tenía dato de hace 5 min: es lo decidido el 18-09 por el gasto de Vercel (§33). **Mejora posible, no hecha:** cuando la ficha de Euskalmet ya esté en caché del CDN (5 min), enseñar la más reciente de las dos y decir de cuál es. No se toca sin medir el gasto.
- «Cuadra, 10 km/h de diferencia»: el listón del veredicto está en 15 y 10 está por debajo. La frase es correcta; podría decir «cuadra (a 10 km/h)» para que no parezca contradicción.

**Por qué se colaron, dicho con honestidad para él:** las 1276 pruebas comprueban lo que la app DICE con datos dados, y ninguna miraba esas pantallas **a esa hora**: la mar de la portada solo se equivoca cuando la serie marina arranca a medianoche y la abres a las 07:00; la luna solo sale cuando el modelo cargado no trae `is_day` y la hora cae fuera del 8-19; la chapa roja solo cuando el día está en rojo por otra cosa. Son los pantallazos suyos los que las cazan, y por eso cada uno tiene ahora su prueba. La regla sigue siendo la tercera: verificar en pantalla, y a la hora en que él la mira.

**Git:** 3c66f38 + este commit con los sellos del 0731. HEAD desciende de `casa-2026-09-23` (avance limpio). La sube Aitor con `./subir-a-github.sh`.

### §35 · 25-09-2026, 08:20-09:00, iMac: «QUE NO VUELVA A PASAR» — el guardia de pantallas, y el repaso programado que no repasaba

**Suyo, después de §34:** *«que no vuelva a pasar porque me suena que no es la primera vez, a ver si mañana estamos con lo mismo»* · *«revisar en paralelo, manda agentes… dejarlo bien de una vez»* · *«recuerda lo del gasto de Vercel, es súper importante, más que lo de Euskalmet»*. Tenía razón en lo primero: el 01-09 ya dijo «esto me suena de ayer o anteayer» y está en CLAUDE.md.

**Por qué se colaban.** Los seis fallos de §34 tenían la MISMA FORMA —una pantalla que lee la hora equivocada (la mar leía la medianoche; la luna por el `is_day` del principio de la hora), un color que sale de otra cosa (la chapa por el semáforo del día), un texto que desmiente la fila de al lado («Anemómetros de AEMET» con Almike debajo; «Sirimiri» sin «lo ve ICON»)— y **ninguna de las 1.276 pruebas arrancaba esas pantallas a esa hora con datos en los que se notara**: `pruebas.js` prueba funciones con datos dados; `abrir.cjs` solo mira que la app no reviente; `paridad.cjs` compara dos pantallas entre sí (si las dos leen mal igual, cuadran).

**Lo puesto: `pantallas.cjs`** (commit 2a4692b), en `revisar.sh` detrás de `paridad.cjs`, así que **`deploy.sh` no publica si falla**. Arranca la app entera en jsdom con un `Date` falso DENTRO de la ventana (Proxy, como `hora-falsa.cjs` pero en el contexto de jsdom) a las **02:30, 07:30, 13:30 y 20:30**, con **datos trampa que cambian cada hora**: mar de fondo = (hora+1)/10 (0,1 a medianoche, 0,8 a las 07:00); pico de ola 3,0 en el índice 1 y 2,0 de la hora 24 en adelante (las 24 PRIMERAS dan 3,0, las 24 SIGUIENTES 2,0); orto 08:01 y ocaso 20:10, con el `is_day` horario al principio de la hora (como Open-Meteo) y el de `current` al minuto; racha diaria [30, 90, 60, …] con tormenta (código 95) el día 0; ICON el único con agua (0,6 mm, código 61) a las 03, 04, 21 y 22; Almike (Euskalmet, 1,1 km) para el sitio 1 y `sinEstacion` para el 2, que se queda con FORUA (AEMET); un marcador con Matxitxako. Ocho comprobaciones sobre el DOM: día/noche de 48 horas por el medio de la hora contra orto/ocaso; sol/luna de cada tarjeta (solo códigos 0-2); «Mar de fondo» y «Sube a» de `#marAhora` (y «Mar de fondo» de `#seaCard`) contra la hora en curso; `data-s` de cada `.dcard__g` contra `listonRafaga()` más una regex en styles.css contra `.dcard[data-s=…] .dcard__g`; «lo ve X» en `.tor[data-ir=k] .tor__agua` cuando `L.quien !== modeloDato().name`; cabeceras «ESTACIÓN» sin «midiendo…», con las dos redes, y el pie «Anemómetros de …» nombrándolas; el marcador sin «Cargando» y con su estación; y genéricos en nueve zonas (NaN, undefined, null, `[object`, Infinity, «Invalid Date», «—°», decimales con punto salvo millares, carteles de carga). Se planta a sí mismo si la trampa no muerde («TRAMPA SIN DIENTES»). **Tarda 8 s.** Sin red, sin Vercel.

**Visto en rojo, como manda la casa** (sobre una copia en el scratchpad con `PANTALLAS_DIR`, sin tocar los ficheros de verdad porque tres agentes los estaban leyendo): a) la luna vieja → «día/noche mal en 4 de 48: 08:00→noche 20:00→día» y «08:00 con luna, 20:00 con sol»; b) la mar vieja → «Mar de fondo 0,1 m y a esta hora la serie da 0,8» y «Sube a 3,0 m y el máximo de las próximas 24 h es 2,0»; c) la chapa sin `data-s` → rojo; c2) una regla CSS `.dcard[data-s=no] .dcard__g` → rojo; d) sin `${veQuien}` → rojo; e) el pie «Anemómetros de AEMET» → rojo; f) una tarjeta que suelte NaN → rojo; g) un `0.0 mm` con punto → rojo. Los ocho. Dos cosas que cazó la primera pasada y eran DE LA TRAMPA, no de la app: «CC BY-SA 4.0» de la foto de portada leído como decimal, y el `current.is_day` de las 20:30 calculado al principio de la hora (Open-Meteo lo da al minuto). Y una del propio guardia: en verde el proceso no terminaba nunca (los `setInterval` de la app mantienen viva la ventana) → `w.close()` por hora y `process.exit(0)`.

**Fijado:** 5 pruebas en `pruebas.js` (que `revisar.sh` lo LLAME —la lección de `fueraDeRango`—, que corra a las cuatro horas, que la trampa tenga dientes, orto 08:01, `.vercelignore`), `pantallas.cjs` en `otrosGuardias`, y una fila en NO-SE-TOCA. Banco: **1289 bien, 0 mal.**

**EL REPASO PROGRAMADO NO REPASABA.** La tarea del escritorio `repaso-diario-meteo` (07:15 y 23:15, «solo mira y cuenta») figura encendida, pero `list_task_runs` dice: **5 ejecuciones desde el 13-09** (13, 14, 15, 20 y 22), las «succeeded» de **4-6 segundos** (dos Bash y fin: nunca llegó a abrir la app), y la del 22-09 «running» con 598 mensajes, colgada. Ninguna de las tareas del escritorio ha corrido desde el 22-09 a las 07:49 (parte-diario-0630, mensajes-de-aitor, vigilante-tormentas: todas con `lastRunAt` de ese minuto): corren solo con la app de Claude abierta en el iMac, y la app se cerró (este mismo chat arrancó con «The app was quit while you were working»). **No se puede decir que ese repaso vigile nada.** Lo hecho: pasada a **06:50 y 23:50** (antes de que él mire a las 07:00), y añadidas al SKILL las siete comprobaciones l-r (luna contra el orto, mar de la portada, chapa de racha, «lo ve», cabeceras y pie de estaciones, marcador, decimales) con el aviso de que un parte que no llega al final no puede decir «todo en orden» y de que cuesta UNA carga de la app. La vigilancia que sí corre siempre es `revisar.sh` en cada publicación. Aclaración para él, que preguntó: esas «5 veces» son de ESA tarea de Claude en el iMac, no de la app ni del vigilante de Vercel (cron-job.org cada 15 min, que en verde ya pasa cada 3 h, en ámbar cada 30 min y en rojo cada 15 — que es justo la cadencia «cada dos o tres horas» que él propone).

**Contraste de la calle (08:15, suyo):** «nuboso por Sollube, Bermeo y Mungia» y «el coche marca 18°». La app, cargada a las 07:34 con Bermeo/AROME: portada **«Mayormente despejado»** (cielo votado; ECMWF 55 % total con **0 % de baja**), 18,9° a las 08:00 (cuadra con el coche; Forua AEMET 14,9° a las 07:00 en el valle). Por `/om` a las 08:00: AROME nube baja **31 % Bermeo, 94 % Sollube, 72 → 100 % Mungia**; ICON 75 % baja en los tres; ECMWF 55-64 % total y 0 baja. O sea que los dos que leen su punto (AROME 1,3 km, ICON 7 km) veían la nube baja que él vio, y el de 25 km —que en Bermeo lee 18 km tierra adentro— no. En Bermeo la mediana de baja+media se quedó entre 15 y 40 → «Mayormente despejado». No se ha tocado nada: es un caso medido para la cuestión del cielo en la costa (§ «EL CIELO PASA AL EUROPEO»), no un fallo de código.

**Gasto de Vercel:** no se ha podido medir hoy (Chrome no estaba conectado; el panel de Uso solo se ve con su sesión). Nada de lo de hoy añade una sola llamada: el guardia es local y el repaso programado sigue siendo una carga por pasada. Queda medirlo en cuanto abra Chrome.

**Tres agentes de solo lectura** lanzados en paralelo (más lecturas a índice fijo / reglas de reloj; contradicciones texto-color-fuente; revisión adversaria de `pantallas.cjs`): sus informes, y lo que salga de ellos, en la § siguiente.

### §36 · 25-09-2026, 09:00-10:30, iMac: LOS DIECISÉIS DE LOS AGENTES, Y LA SERIE QUE NO EMPEZABA A MEDIANOCHE

**Suyo, en medio:** *«revisar en paralelo, manda agentes… dejarlo bien de una vez»* · *«¿por qué vuelve a fallar cuando me decís que ya no va a volver a pasar?»* · y a las 08:27, con la portada diciendo «Despejado» bajo un cielo tapado en Munguía: *«Mal»* · *«De momento verán que han fallado casi todos en Bermeo»*.

**Los tres agentes (solo lectura, en paralelo)** sacaron dieciséis fallos más de la misma familia que los seis de §34, y ninguno era nuevo: estaban ya en la app. Arreglados en un solo lote (build 2026.09.25-0848), cada uno con su prueba y **catorce de ellos vistos en rojo** deshaciéndolos sobre una copia con `pantallas.cjs` v2:

| pantalla | lo que decía | qué se ha hecho |
|---|---|---|
| Horas | la chapa «Racha 22 km/h» en rojo por el semáforo de la HORA (sirimiri) | `nivelRacha()`: una decisión para la chapa de la hora y la del día; CSS `.hcard__g[data-s]` |
| Ahora · Tormenta | «Tapa que aguanta · gasolina y sin tapa: puede romper» (tapa 68) | cuando salta la regla, número y listón: «tapa 68 (por debajo de 75)» |
| Mis estaciones · cifras | «68 tapa J/kg · aguanta» en ROJO | «por debajo de 75: con este CAPE rompe» |
| Ahora · Próxima lluvia | «no se espera · ninguno de los modelos la ve» en verde SIN comparativa (primer pintado, cambio de sitio, carga caída) | `lluviaQueVieneYNoVesTu()` devuelve `{sabido:false}` y la casilla dice «a los demás todavía no he podido preguntarles» |
| Mis estaciones · «Lo que se está midiendo» | «No hay estaciones de AEMET a menos de 60 km» (se pregunta también a Euskalmet a 25) | nombra las dos redes, y si Euskalmet no contestó lo dice antes que nada |
| Mis torres · nota del parte | «ECMWF y AROME HD no la publican» a mano, invisible para `sin-modelos-a-mano.cjs` (línea sin comillas dentro de una plantilla) | leído del reparto (`MODELOS_TORMENTA` − `CON_TAPA`); el guardia ya cuenta acentos graves y mira dentro de las plantillas (7 explicaciones fijas pasaron a BLANCA) |
| Ahora · Sol y aire | «Sube a 2,0 m en las próximas 24 h» sin hora | `picoOleaje24hCon()` + `aLasHora()`: «Sube a 2,0 m a las 04:00 de mañana sábado» |
| Ahora / Mar · Mar de viento | 0,2 con rama «picada» en Ahora; 0,3 sin ella en Mar | `fraseMarDeViento()`, una para las dos |
| Mar · Mar de fondo | `hourly[0]` (medianoche) si `current` no la trae | `iHoraMar()` |
| Mar · gráfica 48 h | desde la medianoche: a las 20:00, 20 h pasadas y «lo más alto» ya pasado | desde ahora (`i0Ola`) |
| Mis torres · «Antes de salir» | «No se despeja en las próximas 24 h» mirando solo lo que queda de hoy | «en lo que queda de hoy» / «el sábado» (`ventanaParte()`) |
| Mis torres · pestañas del parte | HOY encendida sobre el parte de mañana (a partir de ~22:00) | `ventanaParte().salto` |
| completar() | pegaba las columnas prestadas POR POSICIÓN: dos llamadas a caballo de un cambio de hora desplazaban cielo, tapa, isocero y nieve una hora, sin marca | `alinear()`: cada hora por su tiempo (como ya hacía `completarTorres`) |
| 10 días · dibujo del día | día/noche fijo por la ventana 6-20 h | el de sus horas (`R.dia`, que sale de `diaDeLaHora`) |
| Mis torres · pista | «sin agua en las últimas 72 h» **habiendo mirado UNA hora** | ver abajo; y `lineaPista` dice las horas que miró de verdad (`mirados`) |
| Ahora · Máx/Mín | «Mín 14°» sin hora en cuanto la mínima quedaba antes de la hora de carga | ver abajo |
| Marcador | «error medio 5 km/h · 7 veces» | «en 7 comparaciones» |

**LO MEDIDO, que es lo que cambia cómo se leen las series (por `/om`, una llamada):**

| petición | primera hora de la serie |
|---|---|
| `past_hours=1` (loadAll, cargado a las 07:34) | **06:00** — la hora anterior, NO la medianoche |
| `past_days=3&past_hours=1` (cargarTorres) | **07:00** — `past_hours` MANDA: los tres días pasados no venían; y trae 16 días |
| marina | 00:00 de hoy |
| `daily[0]` | hoy (past_hours no lo mueve) |

Consecuencias: `cargarTorres` y `completarTorres` van con `past_days: 3` **sin** `past_hours` (la pista vuelve a tener 72 h de verdad; el 23-09 CLAUDE.md decía que `fc.hourly` «trae el día desde las 00:00» y era falso); `loadAll` y `completar` con `past_hours: 24`, para que la hora de la mínima exista en la serie (a las 13:00 la de las 05:00 ya no estaba). `S.data.hours` sigue empezando en la hora en curso (`idx0` por tiempo), así que ninguna pantalla que lea de ahí cambia.

**`pantallas.cjs` v2** (lo pidió el agente adversario, que corrió 19 roturas y 13 se le escapaban a la v1): cinco horas (02, 07, 13, 20 y **23**, para el parte de mañana); la trampa empieza la serie donde Open-Meteo (past_hours manda); una sola carga (sitio, lista y modelo en localStorage antes de arrancar); el cargado NO trae la tapa (como AROME de verdad) y se la pide a ICON, que vale 5 solo a las 10:00 y **llega una hora desplazada** (así se ve si se pega por posición); a las 13:30 el cargado lleva CAPE 800 y tapa 68 y `current` no trae la mar de fondo; a las 20:30 la comparativa de los siete modelos **no contesta**; la mínima (14°) a las 05:00 y la máxima (24°) a las 15:00; racha 90 a las 05 y 15; mar de viento 0,25 (donde Ahora y Mar decían cosas distintas). Nuevas comprobaciones: chapa de Horas, `data-dia` del dibujo y el dibujo grande de la portada, `#seaDet` (el `#seaCard` de la v1 no contenía la lista: la comprobación 3b estaba muerta), «Sube a … a las HH:00», paridad de la mar de viento, «lo más alto» de la gráfica, `quien === 'ICON'` y las horas del agua en la tarjeta, Almike/FORUA por nombre, cifra en rojo sin «aguanta», `pista.mirados ≥ 72`, marcador con «se queda 12 km/h corto» y «en 20 comparaciones», Tormenta sin «aguanta», Próxima lluvia con la comparativa caída, «Mín 14° a las 05:00», tapa 5 a las 10:00 y 120 a las 09:00, pestaña del parte, y los avisos `[cielo]` de `vigilarCielo` como fallo. **Tarda 10 s.** Catorce roturas sobre copia, catorce rojos (a-o en `romper2.sh` del scratchpad; el detalle en el commit).

**Banco:** 1311 bien, 0 mal (22 pruebas nuevas). **NO-SE-TOCA:** cinco filas nuevas.

**El cielo de esta mañana (su «Mal», 08:27):** portada «Despejado» / franja «Mayormente despejado ⚠ ICON ve nubes de 08:00 a 13:00 (baja y media hasta el 84 %)» bajo un cielo tapado de nube baja y media en Munguía y Bermeo. Medido en la propia app (la comparativa de las 07:34, nube baja+media a las 08:00): **ECMWF 0, GFS 0, AROME 27, ICON 79** → el cielo votado (mediana de los cuatro) se quedó en 27 → «Mayormente despejado». Dos de cuatro no vieron la nube baja; el aviso salió, pero debajo del titular. Euskalmet a las 07:40 daba «Poco nuboso» con «intervalos nubosos de nubes bajas». La temperatura sí cuadró (19° la app, 18° su coche, 19,9° Matxitxako). **No se ha tocado la regla del cielo**: es el segundo caso medido de la costa en que los de malla gruesa no ven la nube baja (el primero, §«EL CIELO PASA AL EUROPEO»); con dos casos no se recalibra. Queda apuntado como candidato: que el titular pierda la certeza cuando el abanico entre modelos es de más de 60 puntos («Despejado según ECMWF y GFS; ICON ve nube baja al 84 %»), o cruzar con el satélite, que es medida.

**Gasto de Vercel:** sin medir (Chrome sin conectar en toda la mañana). Hoy: una publicación (vacía el CDN), una llamada de medida a `/om`, y las llamadas del panel del navegador al comprobar. Nada nuevo que corra solo.

**Y uno más, cazado al verificar el 0848 en la web (build 2026.09.25-0857):** la cabecera de BI BERMEO en Mis estaciones ponía «MATXITXAKO · AEMET · a 5,3 km» mientras `S.medidoSinEuskalmet` decía «no he podido preguntar a Euskalmet (error 200)»: el lote de Euskalmet había contestado 200 con `ok:false` (ninguna estación leída, seguramente el 429) y, como AEMET sí tenía aparato, la cabecera se quedó con el de 5,3 km sin decir que el de 1,1 (Almike) no se había podido leer. Un aparato más lejos no es el más cercano: es el que quedó. Ahora la cabecera añade «· Euskalmet no contestó» (y al revés, «AEMET no contestó» si el que sale es de Euskalmet), y el motivo es el `reason` del servidor, no «error 200». El guardia lo ejercita a las 07:30 (el lote de Euskalmet devuelve 200 `ok:false`) y se vio en rojo quitando la nota sobre una copia. Banco: 1313.

**El cielo, tercera vez en la mañana (10:18, Barakaldo):** su foto con una capa entera de nubes medias y el sol velado; la app «Despejado» con sol. Medido por `/om` a las 10:00: AROME 0 % baja, GFS 0 %, ECMWF 3 % (26 total), **ICON 72 %**. Tres de cuatro no la ven; el voto se va con ellos. **Con los modelos no hay regla que arregle esto: hace falta una medida, y la hay.** Sobre la misma imagen de Meteosat de las 08:00Z (la de `/satelite`), `GetFeatureInfo` de EUMETView (`msg_fes:ir108`, JSON, CORS `*`, con `time=`) da el gris del infrarrojo en el punto: **Barakaldo 38, Bermeo 40, Sollube 40, Mungia 40** (los cuatro bajo la nube que él vio) frente a Vitoria 28, Donostia 28, Pamplona 26, Zaragoza 22, Madrid 23, Albacete 20, Sevilla 16, Valencia 14. El visible (`rgb_eview`) separa peor la nube fina (Barakaldo 120 frente a 111-115 de suelo; Bermeo 171). El estilo del servidor no lleva tabla de colores (GetStyles: raster a secas), así que **el gris no se puede convertir a grados**: el umbral hay que MEDIRLO, no ponerlo (el suelo frío de la meseta a primera hora también sube el gris: Vitoria 28 sin saber si tenía nube). Propuesta, sin hacer: muestrear cada hora desde el iMac el IR de sus 20 sitios contra el consenso de los cuatro modelos (todos ≥80 = nube, todos ≤10 = limpio) durante 2-3 días, sacar el umbral de ahí, y entonces poner en la portada una línea «Satélite (medido a las HH:MM): nube encima» y el chip ⚠ cuando contradiga al titular. Cero Vercel (el navegador pide a EUMETView directo; `/satelite` ya está en el borde y cacheado). No se instala nada sin que él diga.
