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
