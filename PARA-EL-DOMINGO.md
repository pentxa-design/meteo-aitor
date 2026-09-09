# PARA EL DOMINGO · traer al Mac de casa lo hecho en el portátil

Última actualización: 09-09-2026 09:35 (portátil, Calpe). Procedimientos 6A y 6B ensayados el 08-09 sobre copias de e5ab019: los dos aplican limpios. Este documento se actualiza con cada commit de la rama; en caso de duda, la verdad es `git log e5ab019..portatil-2026-09-07`.

## 1. Qué es esto y qué tienes que hacer

Eres una sesión de Claude en el Mac de casa de Aitor, el domingo 13-09-2026. Aitor ha pasado la semana en Calpe con el portátil, cambiando la app del tiempo «Aitor Meteo» sobre una COPIA de la web publicada. Esa copia y sus cambios están en la rama `portatil-2026-09-07` del repositorio `pentxa-design/meteo-aitor` (GitHub). El proyecto REAL, con el servidor y las herramientas de publicar, vive solo en este Mac de casa y no está en GitHub.

Tu trabajo: llevar cada cambio del portátil al proyecto de casa como PARCHE, sin perder nada de casa, sellar la versión, probar, publicar en Vercel como lo hace siempre casa, y comprobar que el iPhone de Aitor se actualiza una sola vez. Lee el documento entero antes de escribir nada. Aitor solo te va a decir «lee PARA-EL-DOMINGO.md y haz lo que pone»; no cuentes con que recuerde más.

Aitor trabaja en altura, en torres. La pestaña «Mis estaciones» decide si alguien sube o no. Ahí no puede haber datos a medias: si algo no cuadra, se para y se pregunta.

## 2. Cómo está el patio

Hay tres cosas distintas, y las pruebas están todas en /Users/aitor/AitorMeteo (solo lectura) y en la web publicada.

(a) LA RAMA DEL PORTÁTIL. `master` local = `origin/portatil-2026-09-07` (las dos en 0b9299f; lo dice `git branch -vv`). Son 12 commits (`git rev-list --count master` → 12). El primero, e5ab019 (05-09-2026 15:15, «Copia de la versión publicada en Vercel (build 2026.09.05-0616)»), son los 17 ficheros PÚBLICOS de la web tal cual estaban en Vercel: app.js (16.287 líneas), maps.js, index.html, styles.css, sw.js, version.json, chuleta.html, manifest.webmanifest, icons/, vendor/ y data/estaciones.json. No trae nada del servidor: ni api/, ni lib/, ni vercel.json. Encima van 11 commits hechos entre el 05-09 15:48 y el 08-09 00:00 (`git log --format='%h %ad %s' --date=iso master`). `git diff --stat e5ab019 master`: app.js +506/−33 líneas, maps.js 24, index.html +4 (el `<div id="vSalir">`), styles.css +10 (`.salir__*`), data/torres-copia.json nuevo (147 líneas), sw.js y version.json solo en la línea del sello, y tres cosas que son solo para GitHub Pages: .nojekyll, .gitignore (`.tools/`) y .claude/launch.json (que apunta a /Users/aitor/AitorMeteo, ruta del portátil). El build sellado en la punta es 2026.09.07-2359 en los tres sitios (app.js:14, sw.js:13, version.json) y es lo que hoy sirve https://pentxa-design.github.io/meteo-aitor/version.json.

Cómo ha vivido el portátil sin servidor: `.tools/servir.js` (fuera del repo, está en .gitignore) sirve los ficheros de /Users/aitor/AitorMeteo en http://127.0.0.1:8767 y reenvía TODO lo que no sea un fichero estático (/api/*, /om, /rayos, /estaciones, …) a https://weather-app-ochre-one-76.vercel.app cambiando la cabecera Host (`const ORIGEN = 'weather-app-ochre-one-76.vercel.app'`). O sea: el portátil siempre ha usado el backend real de casa; nunca ha tenido backend propio. Lo acompañan vigila.sh (relanza servir.js), tunel.sh (túnel localhost.run para verlo desde el móvil) y sellar.sh (pone el mismo build en app.js, sw.js y version.json).

(b) origin/main EN GITHUB. 142 commits; punta 711af1a del 21-08-2026 07:46 («v10.157: capas fluidas y detalle diario por horas»). Es la aplicación de agosto, otra estructura: `git ls-tree --name-only origin/main` da api/ (12 funciones: weather, marine, euskalmet, euskalmet-status, euskalmet-tides, aemet, aemet-status, aemet-radar, map-forecast, map-mu, map-arome-15m, rainviewer), lib/, vercel.json, service-worker.js, package.json (10.157.0), README.txt, VERSION.txt y un index.html de 5.300 líneas con todo el JavaScript dentro (registra `service-worker.js?v=10.157`). NO tiene app.js, ni maps.js, ni sw.js, ni version.json. `git merge-base master origin/main` no devuelve nada (exit 1): no hay ancestro común. `git grep -n -E "const BUILD|/om\b|'/rayos|/estaciones|/api/torres|/api/campo|/api/vigilante" origin/main -- index.html api lib` no encuentra NADA: las rutas que usa la app actual no existen ahí; las que llama origin/main son /api/weather, /api/marine, /api/aemet, /api/map-*, /api/rainviewer, /api/webcams… Solo comparten la semilla (vendor/leaflet y openmeteo-weather-map-layer-0.0.20.js); la copia base ya usa maplibre-gl y otros iconos (`git diff --stat origin/main e5ab019 -- vendor icons`). Las fechas cuadran: app.js del commit base cita más de 60 revisiones fechadas del 23-08 al 05-09-2026 (líneas 35, 190, 224, 242, 345, 360, 552, 892, 1608…), sw.js habla del 05-09, y maps.js:151 dice «capas marinas retiradas (21-08-2026)», justo el día del último push. Conclusión: el Mac de casa dejó de subir a GitHub el 21-08 y siguió trabajando dos semanas largas (app.js/maps.js/sw.js nuevos, rutas /om, /rayos, /estaciones, /api/torres…) sin publicarlo en origin/main. origin/main está ATRASADA y no sirve de base para nada de esto.

(c) LO QUE DESPLIEGA EL MAC DE CASA (https://weather-app-ochre-one-76.vercel.app). Hoy 08-09-2026 he bajado app.js, maps.js, sw.js, index.html, styles.css y version.json de Vercel y son BYTE A BYTE idénticos a e5ab019 (`diff -q` en los seis): build 2026.09.05-0616 en app.js:14, sw.js:13 y version.json. Es decir, desde que se hizo la copia base casa no ha publicado nada nuevo, y la rama del portátil es, a día de hoy, «lo publicado + 11 commits». Pero el proyecto de casa tiene además todo el servidor, que en la copia no está: las cabeceras de Vercel lo delatan (`x-vercel-id: cdg1::lhr1…` para /om, /rayos, /estaciones, /satelite, /mareas, /radar-aemet, /webcams —funciones edge, todas con `access-control-allow-origin: *`— y `cdg1::iad1…` para /api/torres, /api/campo, /api/euskalmet, /api/vigilante —funciones Node, sin ninguna cabecera CORS—). Pistas de cómo publica casa, sacadas del propio código: app.js:13 «Fecha de compilación — la sustituye deploy.sh en cada publicación», app.js:14081 «`pruebas.js` no deja publicar si alguna pantalla escribe el cielo sin pasar por aquí», sw.js:103 «Medido en prueba-sw.cjs», app.js:2787 «data/campo.md». Como GitHub está en el 21-08 y Vercel en el 05-09, Vercel NO despliega desde GitHub: casa publica con la CLI (deploy.sh → `vercel --prod` o parecido). api/, deploy.sh, pruebas.js, vercel.json y .vercel/ viven SOLO en el Mac de casa.

RESUMEN: portátil = copia de la web publicada el 05-09 + cambios de pantalla en 6 ficheros públicos (+1 json nuevo); casa = esa misma web (sin cambios publicados desde el 05-09) + el servidor + las herramientas de publicar; origin/main = la app de agosto, sin parentesco git con ninguna de las dos. Lo que hay que llevar a casa son los cambios de app.js, maps.js, index.html, styles.css y data/torres-copia.json (sw.js y version.json solo cambian en el sello), y hay que llevarlos como PARCHE, nunca como merge. He ensayado los dos caminos en el scratchpad sobre una copia exacta de e5ab019 y sobre una «casa» que había seguido trabajando: los dos aplican (ver procedimiento).

### Rutas del servidor que usa la app

- /om?api=fc|geo|elev|marine|aq|rain — intermediario de Open-Meteo (previsión, geocodificación, altitud del terreno, oleaje, calidad del aire) y del catálogo de RainViewer; app.js:42-70 (`PROXY`, `via`, `API`). Existe para cachear en el CDN y no gastar el cupo por IP. Función edge; ya manda `access-control-allow-origin: *` también al OPTIONS.
- /omtiles — intermediario de las teselas espaciales de Open-Meteo que pinta el mapa (maps.js:63 `TILES_PROXY`); el servidor se descarga el fichero entero. Edge, CORS *.
- /estaciones?lat=&lon=&radio= (y ?historia=) — estaciones de AEMET alrededor de un punto: la medida real de viento, racha y lluvia que se compara con el modelo (app.js:6051, 6370, 15080). Edge, CORS *.
- /api/euskalmet?lat=&lon=&radio= y ?puntos= — estaciones de Euskalmet (medido) para el sitio abierto y para todos los emplazamientos (app.js:6057, 6356). Función Node; hoy SIN cabeceras CORS (al OPTIONS contesta 200 pero sin ellas).
- /rayos, /rayos?f=<marco>, /rayos?tormentas=1 — descargas de AEMET: marcos horarios, lista de rayos de un marco y resumen de tormentas en curso (app.js:9563, 9608, 13023). Edge, CORS *.
- /mareas — mareas para la tarjeta de oleaje (app.js:12693). Edge, CORS *.
- /satelite — catálogo de pasadas de EUMETSAT (app.js:70 `API.sat`). Edge, CORS *.
- /radar-aemet?f=<fichero> — imágenes del radar de AEMET para el mapa (maps.js:452 `AEMET_RADAR.via`). Edge, CORS *.
- /webcams?lat=&lon=&radio= — cámaras cercanas al sitio (app.js:10371). Edge, CORS *.
- /api/torres (GET; POST {torres, modo:'juntar'|'mandar'}) — la lista de emplazamientos compartida entre aparatos, con cotas y tipo; es lo que hace que un aparato vacío reciba las 20 del móvil (app.js:13881). Node, SIN CORS, OPTIONS → 405. El portátil añadió `torresDeLaCopia()`: si esto falla y el aparato no tiene ninguna, carga data/torres-copia.json.
- /api/ajustes (POST {ajustes}) — sincroniza umbrales y ajustes entre aparatos (app.js:14047 `sincronizarAjustes`). Node, SIN CORS.
- /api/marcador (GET; POST {muestras}) — el «marcador» modelo-contra-estación (sesgo de cada modelo por estación); el POST apunta muestras en segundo plano y se traga el fallo a propósito (app.js:1532, 1617). Node.
- /api/calibrar (POST {descargas}) — cuaderno de rayos: apunta las descargas cerca de sus emplazamientos para calibrar (app.js:9910). Node.
- /api/campo (GET ?n=8; POST) — notas de campo (lo que él ve desde la calle) y su hilo (app.js:16174, 16494, 16581). Node, SIN CORS.
- /api/foto (POST; GET ?f=) — la foto adjunta a una nota de campo; en el hilo va como `<img src>` y `<a href>` con `${BACKEND}` delante (app.js:16377, 16522). Node. Para el <img> no hace falta CORS.
- /api/suscribir (GET; POST) — alta, baja y estado de la suscripción push para los avisos de tormenta (app.js:15345-15536). Node, SIN CORS.
- /api/prueba-aviso (POST) — manda un aviso de prueba al aparato (app.js:15655). Node.
- /api/vigilante?pulso=1 — latido del vigilante del servidor (el que manda los avisos): última pasada, hace cuántos minutos, si envía, parte del día y nº de sitios (hoy: 20). Sin `?pulso=1` contesta 401 y es normal (app.js:16625 `mirarPulso`). Node, SIN CORS.
- version.json — no es una función, es un fichero estático, pero es parte del contrato: `comprobarVersion()` (app.js:14352) lo pide al arrancar, cada 5 min y al volver a primer plano; si `build` no coincide con `const BUILD`, borra las cachés (menos avisos-recibidos) y recarga. Por eso el sello tiene que ir igual en app.js, sw.js (`const V = 'torre-<build>'`, nombre de la caché del service worker) y version.json.

## 3. Procedimiento, paso a paso

### 0. Antes de escribir nada: leer este documento entero. La sesión de Claude en casa no ejecuta deploy.sh, ni vercel, ni nada que escriba en el proyecto hasta el paso 3 (copia de seguridad). Todo lo anterior es solo lectura.

(nada que ejecutar; solo leer)

### 1. Localizar el proyecto real en el Mac de casa: el app.js que lleva `const BUILD =` fuera de node_modules, y a su lado las herramientas de publicar (deploy.sh, pruebas.js, vercel.json, .vercel/project.json). Si salen varias carpetas, la buena es la que tiene api/, vercel.json, deploy.sh y .vercel/ juntos.

```bash
find "$HOME" -maxdepth 6 -name app.js -not -path "*/node_modules/*" -not -path "*/Library/*" -not -path "*/.Trash/*" -exec grep -l "^const BUILD = " {} + 2>/dev/null
mdfind -name app.js | grep -v -E "node_modules|/Library/|/System/"
find "$HOME" -maxdepth 6 \( -name deploy.sh -o -name pruebas.js -o -name vercel.json -o -path "*/.vercel/project.json" \) -not -path "*/node_modules/*" -not -path "*/Library/*" 2>/dev/null
# Cuando lo tengas, guarda la CARPETA (no el fichero) en una variable y úsala en todos los pasos:
P="/ruta/a/la/carpeta/del/proyecto"   # <- la que contiene app.js, api/, deploy.sh
```

### 2. Leer el estado de casa y confirmar que esa carpeta es la que publica en Vercel: su version.json debe ser igual al de la web (a 08-09 los dos dicen 2026.09.05-0616). Si el BUILD de casa es posterior a 2026.09.05-0616, casa ha publicado después de la copia y en el paso 5 saldrán diferencias (irás por la vía 6B). Leer también deploy.sh y el principio de pruebas.js para saber cómo sella, prueba y publica casa; no ejecutarlos todavía.

```bash
cd "$P" && ls -la
grep -n "^const BUILD" app.js; grep -n "^const V" sw.js; cat version.json; echo
curl -s https://weather-app-ochre-one-76.vercel.app/version.json; echo
cat .vercel/project.json 2>/dev/null
git -C "$P" rev-parse --is-inside-work-tree 2>/dev/null && { git -C "$P" status --short | head -20; git -C "$P" log --oneline -5; git -C "$P" branch -vv; }
cat deploy.sh 2>/dev/null; sed -n '1,40p' pruebas.js 2>/dev/null
```

### 3. Copia de seguridad de casa ANTES de tocar nada: un .tgz aparte y, además, un commit de seguridad. Si $P es un repo git, se trabaja en una rama nueva (lo que hubiera sin commitear viaja con ella; main no se toca). Si NO es un repo git, se crea uno solo para poder fusionar a 3 vías y deshacer: no afecta a Vercel (la CLI no sube .git).

```bash
tar -C "$(dirname "$P")" --exclude=node_modules -czf "$HOME/casa-antes-portatil-$(date +%Y%m%d-%H%M).tgz" "$(basename "$P")" && ls -la "$HOME"/casa-antes-portatil-*.tgz
# Si YA es repo git:
git -C "$P" checkout -b traer-portatil-2026-09-13 && git -C "$P" add -A && git -C "$P" commit -q -m "Estado de casa antes de traer el portátil (13-09-2026)"; git -C "$P" log --oneline -1
# Si NO es repo git:
cd "$P" && git init -q && printf 'node_modules/\n.vercel/\n' >> .gitignore && git add -A && git commit -q -m "Estado de casa 13-09-2026" && git log --oneline -1
```

### 4. Traer la rama del portátil desde GitHub a una carpeta APARTE (nunca dentro de $P, nunca mezclada con el repo de casa). El primer commit debe ser e5ab019; la punta cambia con cada commit del portátil: vale el nombre de la rama, no el hash.

```bash
B="$HOME/portatil-2026-09-07"
git clone --branch portatil-2026-09-07 --single-branch git@github.com:pentxa-design/meteo-aitor.git "$B"
# (si en casa no hay clave SSH: https://github.com/pentxa-design/meteo-aitor.git)
git -C "$B" log --oneline --reverse | head -1     # debe ser e5ab019 Copia de la versión publicada en Vercel (build 2026.09.05-0616)
git -C "$B" log --format='%h %ad %s' --date=short e5ab019..portatil-2026-09-07   # lo que se va a llevar
```

### 5. Comprobar si los ficheros de casa son los del commit base e5ab019. Si los seis salen IGUAL → vía 6A. Si alguno sale DISTINTO (aunque sea solo la línea del BUILD/V/version.json porque casa volvió a publicar) → vía 6B. data/torres-copia.json no debe existir todavía en casa.

```bash
mkdir -p "$HOME/parches-portatil/base"
for f in app.js maps.js index.html styles.css sw.js version.json; do
  git -C "$B" show e5ab019:$f > "$HOME/parches-portatil/base/$f"
  if diff -q "$HOME/parches-portatil/base/$f" "$P/$f" >/dev/null; then echo "$f: IGUAL que e5ab019"; else echo "$f: DISTINTO"; fi
done
diff "$HOME/parches-portatil/base/app.js" "$P/app.js" | head -40
ls -la "$P/data/"
```

### 6A. (Solo si en el paso 5 los seis salieron IGUAL) Aplicar los 10 commits del portátil tal cual, con su historia y sus mensajes, con `git am -3`. Ensayado el 08-09 sobre una copia exacta de e5ab019: aplican los 10 sin conflicto y app.js/maps.js/index.html/styles.css quedan idénticos a la punta del portátil. OJO: BUILD y V quedan en 2026.09.07-2359 pero version.json se queda en 2026.09.05-0616 → el paso 8 (sello) es obligatorio. Si un parche falla, `git am --abort` y pasa a 6B.

```bash
git -C "$B" format-patch -o "$HOME/parches-portatil" e5ab019..portatil-2026-09-07 -- app.js maps.js index.html styles.css sw.js data/torres-copia.json
ls "$HOME/parches-portatil"/*.patch
cd "$P" && git -c user.name=Aitor -c user.email=pentxa@gmail.com am -3 "$HOME/parches-portatil"/*.patch
git -C "$P" log --oneline -12
# si algo falla:  git -C "$P" am --abort   (y a 6B)
```

### 6B. (Si casa ha cambiado, o si se prefiere un solo commit) Un único diff de los cambios del portátil SIN la línea del sello, aplicado con fusión a 3 vías. sw.js y version.json no van a propósito (el portátil solo les cambió el sello); el hunk de `const BUILD` se quita del diff con el awk. Ensayado el 08-09 con una «casa» que tenía otro BUILD y una línea nueva dentro de nubesPorCapas(): fusiona sin conflicto, respeta el BUILD/V de casa y conserva la línea de casa. `git apply -3` necesita estar dentro de un repo git (por eso el paso 3).

```bash
git -C "$B" diff e5ab019 portatil-2026-09-07 -- app.js maps.js index.html styles.css data/torres-copia.json \
| awk 'function flush(){ if(inhunk && !drop) printf "%s", buf; inhunk=0; buf=""; drop=0 } /^diff --git/{flush(); print; next} /^@@/{flush(); inhunk=1; buf=$0 "\n"; next} { if(inhunk){ buf=buf $0 "\n"; if($0 ~ /^-const BUILD = /) drop=1 } else print } END{flush()}' \
> "$HOME/parches-portatil/portatil-sin-sello.diff"
grep -c '^@@' "$HOME/parches-portatil/portatil-sin-sello.diff"      # 41 hunks a 08-09
grep -n 'const BUILD' "$HOME/parches-portatil/portatil-sin-sello.diff" # solo debe salir como contexto de un @@, nunca como línea -/+
cd "$P" && git apply -3 "$HOME/parches-portatil/portatil-sin-sello.diff"; git status --short
# Si dice «Applied patch to 'app.js' with conflicts» → paso 7. Si aplica limpio → paso 8.
```

### 7. Resolver conflictos (solo si los hay) con las anclas. Entre `<<<<<<<` y `=======` está lo de casa; hasta `>>>>>>>` lo del portátil. Casi siempre la solución es CONSERVAR lo de casa Y AÑADIR el bloque del portátil, porque los cambios del portátil son bloques nuevos con su comentario de cabecera que explica qué hace y cuándo se puso. Anclas en app.js, por orden: tras `const BUILD` → bloque «EN GITHUB PAGES, EL SERVIDOR ES VERCEL» (`BACKEND`, `RUTAS_BACKEND`, envoltorio de fetch) y `via`/`API.sat` con `${BACKEND}`; tras `const WMO`/`isStormCode` → «EL SOL VELADO NO ES «CUBIERTO»» y «Y LAS CAPAS DEL EUROPEO NO SUMAN» (`VELADO`, `veladoSiToca`, ~100 líneas nuevas); `icon()` → rama «Sol velado»; `codigoQueSeVe()` → «La niebla tampoco se vota» / «Cielo seco: primero la mayoría»; `buildHours()` → dos hunks (el sitio de la fila; las tres capas viajan con la hora); `renderTower()` y `nubesPorCapas()` → «MANDA LA QUE TAPA, NO LA MÁS ALTA EN NÚMERO»; `fotoZona`, `ambiente`, `puntuarFoto`, `Cover` → una línea cada una (VELADO); tras `rachaDelDiaQueNoVesTu()` → «¿ESA AGUA LA VE ALGUIEN MÁS?» (función nueva); `cargarObservacion()` → `S.obs` sellado con el sitio (dos hunks); `lineaAguaTorre()` → `+L.fin`; `cargarRayosAemet()` → una línea; tras `deEsteSitio()` → bloque «ANTES DE SALIR» (~190 líneas nuevas; van con `<div id="vSalir">` de index.html y `.salir__*` de styles.css); `HAY_AGUA`, `codigoFranja()`, `cieloPartido()`, `tituloFranja()`, `renderNow()` → velado/capas; `renderDays()` → tres hunks («solo el europeo ve agua»); tras `adoptarConfig()` → `torresDeLaCopia()` y su uso en `sincronizarTorres()`; `Petardazo` → `AbortError` por `r.name`; `pintarHilo()` → `${BACKEND}/api/foto`. En maps.js: `TILES_PROXY` (l.63), `AEMET_RADAR.via` (l.452), `Maps.model` de fábrica `dwd_icon_eu` (l.978) y en `open()` la limpieza única `tmodelLimpio0609` (l.1027).

```bash
git -C "$P" status --short | grep '^UU'
grep -n -E '^(<<<<<<<|=======|>>>>>>>)' "$P/app.js" "$P/maps.js" "$P/index.html" "$P/styles.css"
git -C "$B" log --reverse --format='── %h %s%n%b' e5ab019..portatil-2026-09-07   # qué hace cada cambio y por qué
# editar a mano cada conflicto; al acabar cada fichero:
node --check "$P/app.js" && node --check "$P/maps.js" && echo "sintaxis OK"
git -C "$P" add app.js maps.js index.html styles.css data/torres-copia.json
# vía 6A:  git -C "$P" am --continue      vía 6B: seguir al paso 8 (el commit se hace en el 12)
```

### 8. Sellar el build en los TRES sitios (obligatorio siempre, haya habido conflictos o no). Primero mirar si deploy.sh de casa ya sella app.js + sw.js + version.json; si lo hace, bastará con él en el paso 10, pero comprueba igualmente. Si no lo hace o no está claro, sellar a mano. Regla: `comprobarVersion()` (app.js:14352) compara version.json con `const BUILD` al arrancar, cada 5 min y al volver a primer plano; si no coinciden borra cachés y recarga → con el sello a medias el móvil recarga en bucle (pasó el 07-09). Y `const V` en sw.js es el nombre de la caché: si no cambia, el móvil se queda con la pantalla vieja.

```bash
cat "$P/deploy.sh"
cd "$P" && b=$(date +%Y.%m.%d-%H%M) && f=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
&& sed -i '' "s/^const BUILD = '[^']*';/const BUILD = '$b';/" app.js \
&& sed -i '' "s/^const V     = 'torre-[^']*';/const V     = 'torre-$b';/" sw.js \
&& printf '{"build":"%s","fecha":"%s"}' "$b" "$f" > version.json
# comprobación (esto se repite también después de publicar):
a=$(sed -n "s/^const BUILD = '\([^']*\)';/\1/p" "$P/app.js"); s=$(sed -n "s/^const V     = 'torre-\([^']*\)';/\1/p" "$P/sw.js"); v=$(sed -n 's/.*"build":"\([^"]*\)".*/\1/p' "$P/version.json"); echo "app.js=$a sw.js=$s version.json=$v"; [ -n "$a" ] && [ "$a" = "$s" ] && [ "$s" = "$v" ] && echo "SELLO OK" || echo "SELLO MAL: NO PUBLIQUES"
```

### 9. Probar en local antes de publicar: sintaxis, las pruebas de casa (si pruebas.js no pasa, NO se publica y no se salta), y la app en el navegador arrancada como la arranca casa (normalmente `vercel dev`, porque la app necesita /om, /rayos, /api/*…; un servidor de ficheros a secas no vale). En el navegador: (1) «Ahora» abre sin barra roja; (2) en un emplazamiento sale la tarjeta «Antes de salir» (#vSalir) con rayos medidos, estación medida y las 3 h siguientes; (3) 10 días: bajo un día con agua dibujada por un solo modelo aparece «solo el europeo ve agua»; (4) Mapa: arranca en ICON-EU y cambiar de capa deprisa no saca «signal is aborted»; (5) consola sin errores; (6) DevTools → Application → Service Workers: el activo es `torre-<build>`; (7) version.json local = el sello.

```bash
cd "$P" && node --check app.js && node --check maps.js && node --check sw.js && echo "sintaxis OK"
[ -f pruebas.js ] && node pruebas.js
[ -f prueba-sw.cjs ] && node prueba-sw.cjs
git -C "$P" status --short    # solo deben aparecer app.js, maps.js, index.html, styles.css, sw.js, version.json, data/torres-copia.json
# arrancar como lo haga casa (mirar deploy.sh / README de casa); si es Vercel CLI:
vercel dev    # y abrir http://localhost:3000
curl -s http://localhost:3000/version.json; echo
```

### 10. Publicar como siempre lo hace casa (deploy.sh; normalmente termina en `vercel --prod`). NUNCA desde $B ni desde el portátil. Si deploy.sh vuelve a sellar el build por su cuenta (es lo que dice app.js:13), pisará el sello del paso 8 con el suyo: da igual mientras haga los tres. Después, comprobar en la web que los tres coinciden y que el servidor sigue ahí.

```bash
cd "$P" && cat deploy.sh && ./deploy.sh
sleep 20; for f in version.json app.js sw.js; do curl -s "https://weather-app-ochre-one-76.vercel.app/$f?t=$(date +%s)" | grep -m1 -E '"build"|^const BUILD|^const V'; done
curl -s -o /dev/null -w '%{http_code}\n' https://weather-app-ochre-one-76.vercel.app/api/torres          # 200
curl -s -o /dev/null -w '%{http_code}\n' 'https://weather-app-ochre-one-76.vercel.app/om?api=elev&latitude=43.3&longitude=-2.7'   # 200
```

### 11. Comprobar el móvil. Abrir la app en el iPhone con red: debe salir UNA vez «Versión nueva (…) — actualizando…» y recargar UNA vez. Después: esperar 5 min o mandarla a segundo plano y volver → no recarga más; la lista de emplazamientos sigue entera (20, la del servidor); el candado de 6 cifras funciona; en un emplazamiento sale «Antes de salir»; el mapa arranca en ICON-EU. Si recarga en bucle: el sello está mal en la web → repetir el curl de los tres, arreglar y volver a publicar (no hace falta reinstalar nada). Si no se actualiza: Ajustes → «Actualizar», o cerrarla del todo y abrirla.

(en el móvil; nada que teclear en el Mac, salvo repetir la comprobación del paso 10 si algo no cuadra)

### 12. Dejar constancia y cerrar el ciclo: commit en casa con el build publicado y una etiqueta. Opcional: subir el estado de casa a GitHub como RAMA NUEVA (nunca main, nunca --force) para que el portátil parta de ahí la próxima vez; antes, comprobar que no hay claves en ficheros seguidos. Y para la próxima vez en el portátil: nueva copia de la versión recién publicada como nueva base (como se hizo el 05-09), no seguir la rama vieja.

```bash
git -C "$P" add -A && git -C "$P" commit -m "Traídos los cambios del portátil (rama portatil-2026-09-07, 05..07-09-2026); publicado build $(sed -n 's/.*"build":"\([^"]*\)".*/\1/p' "$P/version.json")"
git -C "$P" tag -a "publicado-$(date +%Y%m%d)" -m "Publicado en Vercel"
# opcional:
git -C "$P" ls-files | grep -i -E '\.env|secret|clave|token'     # si sale algo, NO subas nada hasta sacarlo del repo
git -C "$P" remote add origin git@github.com:pentxa-design/meteo-aitor.git 2>/dev/null
git -C "$P" push origin HEAD:refs/heads/casa-2026-09-13
```

### 13. (Opcional, solo si Aitor quiere seguir usando https://pentxa-design.github.io/meteo-aitor/) Añadir CORS a las funciones /api/* como se explica en el apartado «cors», volver a publicar y comprobar con curl; luego abrir Pages y ver que la lista de emplazamientos llega del servidor (no de data/torres-copia.json) y que las notas de campo y la suscripción push funcionan.

```bash
curl -s -o /dev/null -D - -X OPTIONS -H 'Origin: https://pentxa-design.github.io' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' https://weather-app-ochre-one-76.vercel.app/api/torres | grep -i -E '^HTTP|access-control'    # esperado: 204 + Allow-Origin/Methods/Headers
curl -s -o /dev/null -D - -H 'Origin: https://pentxa-design.github.io' 'https://weather-app-ochre-one-76.vercel.app/api/vigilante?pulso=1' | grep -i -E '^HTTP|access-control'   # esperado: 200 + Allow-Origin
```

## 4. Los cambios, uno a uno (en orden cronológico)

Cada uno: qué cambia para Aitor, dónde va (fichero + ancla literal que existe en el commit base e5ab019 + qué hacer), qué puede chocar, y cómo probarlo. Las anclas son para `git grep -n -F '<ancla>' -- <fichero>` o para buscar en el editor. Los sellos de versión (`const BUILD`, `const V`, version.json) que aparecen en los diffs NO se copian: se hacen en el paso 8.

### 4.1. Sol velado: los cirros ya no salen como «Cubierto»

Commits: `51cccd2 + 06773b7`

**Qué cambia**

Cuando el modelo da «Cubierto» (código 3) o «Parcialmente nuboso» (2) pero la suma de nubes bajas y medias no llega al 40 %, la app saca un código propio 4, «Sol velado», con su icono (el sol entero, o la luna de noche, con dos velos finos por delante) y su texto. Con el 3 basta con que bajas+medias < 40 % (da igual lo que marque la alta, porque las capas del europeo no cuadran con el total); con el 2 además se pide que las altas lleguen al 50 %. La regla (veladoSiToca) entra por codigoQueSeVe(), así que vale para «Ahora» (con las capas de `current`, o las de la hora en curso si el modelo no las trae ahí), para «Horas», para las franjas (código, partido y rótulo) y para la fila «Cielo» de la tabla de cada torre. Solo rebaja 2/3 a 4; nunca tapa un 0/1. Para eso las horas de buildHours y las de «10 días» llevan ahora las tres capas (nubesBajas/Medias/Altas). Los empates entre códigos se deshacen por lo que tapan: el 4 se coloca entre el 1 y el 2, no por encima del 3. Y al partir la franja el velado cae en el bando del sol. OJO, dos cosas que el título no cuenta: (1) En «10 días» el dibujo del día NO pasa por veladoSiToca: cieloDelDia() tiene su propia regla. Si al menos la mitad de las horas traen bajas y medias, el día se mide por bajas+medias (tope 100) en vez de por la total; con media < 50 sale «Sol velado» si la media de altas es ≥ 50 y, si no, «Despejado»/«Mayormente despejado». O sea: un día de cirros con altas al 46 % de media ya no sale «Cubierto» sino «Despejado», y un día que antes salía despejado puede pasar a velado si las altas promedian ≥ 50. Con < 50 % de horas con capas todo sigue como antes (total). (2) Las cuatro ramas nuevas con `c === VELADO` en fotoZona (foto), ambiente (clase amb-sol), puntuarFoto y Cover.sky (fondo degradado) están puestas pero NO se ejecutan en este commit: Cover.load(S.place, c) sigue recibiendo la hora cruda hrs[0] y esas funciones leen hour.code, que es el código del modelo (Open-Meteo nunca da 4). Así que en «Ahora», con velo, el icono y el rótulo dicen «Sol velado» pero el fondo, el ambiente y la foto siguen yendo por el código crudo (gris de «Cubierto» si el modelo daba 3). Motivo del cambio: Calpe 05-09 13:00 (bajas 0, medias 0, altas 100, sol pleno, app en «Cubierto») y 06-09 14:00 (europeo total 92, bajas 0, medias 0, altas 46, seguía en «Cubierto» con la primera regla, que pedía altas ≥ 50 para los dos códigos).

**Dónde**

- `app.js` · ancla: `0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nuboso', 3:'Cubierto',`

  En la tabla WMO, justo debajo de esa línea, añadir el texto del código propio: `4:'Sol velado',`. (textoCielo() ya tira de wmoText, no hay que tocarla.)

- `app.js` · ancla: `const isStormCode = c => c === 95 || c === 96 || c === 99;`

  Debajo de esa línea (antes del bloque «3. Iconos SVG») añadir el código propio, la regla y el desempate, con su comentario explicando Calpe 05-09 y 06-09:
  
  const VELADO = 4;
  function veladoSiToca(code, h) {
    if (code !== 2 && code !== 3) return code;
    const b = h?.nubesBajas, m = h?.nubesMedias, a = h?.nubesAltas;
    if (!has(b) || !has(m) || !has(a)) return code;
    if (b + m >= 40) return code;              // algo bajo o medio tapa: manda el modelo
    if (code === 3) return VELADO;             // «cubierto» sin nada bajo ni medio = velo
    return a >= 50 ? VELADO : code;            // «parcial»: solo si el velo domina
  }
  /* Cuánto tapa cada código, para los empates: el velado va entre el «mayormente despejado» y el «parcialmente nuboso», no por encima de «cubierto» como haría el número 4 a secas. */
  const tapado = c => (c === VELADO ? 1.5 : c);
  
  Esta es la versión final (06773b7). La de 51cccd2 era `return (b + m < 40 && a >= 50) ? VELADO : code;` para los dos códigos y se quedó corta con altas 46.

- `app.js` · ancla: `else if (code === 3)                             g = cloud(0, 1.2, '#9fb0cf');`

  En icon(), justo después de esa rama del código 3, añadir la del velado: el sol entero (luna de noche) con dos velos finos por delante, ni la nube pequeña del «parcialmente» ni el nubarrón:
  
  else if (code === VELADO)                        g = (day ? sun : moon)
    + `<g stroke="#dfe6f4" stroke-opacity=".75" stroke-width="1.7" stroke-linecap="round">
         <path d="M3.2 9.6c3.2-1.4 6.2-1.4 9.4 0s6.2 1.4 8.6 0M5.2 15.2c3.2 1.4 6.2 1.4 9.4 0s5-1.4 6.8 0"/></g>`;

- `app.js` · ancla: `function codigoQueSeVe(h, codigoDelCielo, thr = S.thr) {`

  El ÚLTIMO `return codigoDelCielo;` de esa función (el que la cierra; el de arriba lleva `>= HAY_AGUA` delante y se deja) pasa a ser `return veladoSiToca(codigoDelCielo, h);`. Por aquí pasan Ahora, Horas, franjas, el voto de «10 días» y la fila «Cielo» de la tabla de la torre.

- `app.js` · ancla: `code: H.weather_code?.[i], cloud: H.cloud_cover?.[i], vis: H.visibility?.[i],`

  En buildHours(), debajo de esa línea, añadir las tres capas a cada hora (sin ellas veladoSiToca devuelve el código tal cual):
  
  nubesBajas: H.cloud_cover_low?.[i], nubesMedias: H.cloud_cover_mid?.[i],
  nubesAltas: H.cloud_cover_high?.[i],
  
  HOURLY y CURRENT ya piden cloud_cover_low/mid/high a Open-Meteo en el commit base (comprobado); no hay que tocar la petición. Como S.torres[].horas también sale de buildHours, la tabla de cada torre las lleva de rebote.

- `app.js` · ancla: `const despejado = has(c) ? (c === 0 || c === 1) : true;`

  En fotoZona(): queda `(c === 0 || c === 1 || c === VELADO)`. Aviso: en este commit `c` es hour.code (código crudo del modelo), así que esta rama no llega a dispararse; se pone igual por coherencia y para el día en que Cover.load reciba el código visto.

- `app.js` · ancla: `else if (!noche && has(c) && (c === 0 || c === 1)) partes.push('amb-sol');`

  En ambiente(): queda `(c === 0 || c === 1 || c === VELADO)`. Mismo aviso: `c` es hour.code crudo, rama hoy inerte.

- `app.js` · ancla: `const raso     = c === 0 || c === 1;`

  En puntuarFoto(): queda `const raso     = c === 0 || c === 1 || c === VELADO;`. La línea de al lado `conNubes = c === 2 || c === 3` se deja como está (el velado no es «con nubes» a propósito). Mismo aviso: `c` es hour?.code crudo, rama hoy inerte.

- `app.js` · ancla: `else if (c === 0 || c === 1)       g = dia ? '#1d64c2,#57a8ee,#a9d6f7'`

  En Cover.sky (el fondo degradado), justo después de esa línea del despejado y antes de la del código 2, añadir el fondo del velado, azul un poco más lechoso:
  
  else if (c === VELADO)             g = dia ? '#2c66b4,#6da4d9,#d3dde8' : '#060c1e,#122344,#26385e';
  
  Mismo aviso: `c = h.code` crudo; con este commit el fondo de una hora velada sigue siendo el gris del 3.

- `app.js` · ancla: `function cieloDelDia(sel) {`

  Sustituir el cuerpo entero de la función. Con capas (al menos la mitad de las horas traen bajas y medias), el día se mide por lo que TAPA (bajas+medias, tope 100); las altas solo velan. Sin capas, la total como antes. Queda:
  
  function cieloDelDia(sel) {
    const prom = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
    const bm = sel.map(h => has(h.nubesBajas) && has(h.nubesMedias)
                            ? Math.min(100, h.nubesBajas + h.nubesMedias) : null).filter(has);
    const altas = sel.map(h => h.nubesAltas).filter(has);
    const conCapas = bm.length && bm.length * 2 >= sel.length;
    const nubes = conCapas ? bm : sel.map(h => h.nubes).filter(has);
    if (!nubes.length) return null;
    const media = prom(nubes);
    const velado = conCapas && altas.length && prom(altas) >= 50;
    if (media < 12) return velado ? VELADO : 0;    // despejado
    if (media < 50) return velado ? VELADO : 1;    // poco nuboso
    if (media < 80) return 2;                      // nuboso
    return 3;                                      // cubierto
  }
  
  Ojo: aquí el velado exige altas ≥ 50 de media (no es la regla de veladoSiToca); con altas < 50 y bajas+medias bajas el día sale «Despejado».

- `app.js` · ancla: `function codigoFranja(sel) {`

  Al final de esa función hay un `.sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];` que deshace empates por el número de código. Cambiar `b[0] - a[0]` por `tapado(b[0]) - tapado(a[0])`. Este mismo sort está tres veces en el fichero (aquí, en `gana` de cieloPartido y en tituloFranja); hay que cambiar los tres.

- `app.js` · ancla: `const gana = xs => { const c = new Map();`

  En cieloPartido(): (1) en el sort de `gana` (la línea siguiente), cambiar `b[0] - a[0]` por `tapado(b[0]) - tapado(a[0])`; (2) unas líneas más abajo, `const grupo = c => (c <= 1 ? 0 : 1);` pasa a `const grupo = c => (c <= 1 || c === VELADO ? 0 : 1);` — el velado es del bando del sol al partir la franja.

- `app.js` · ancla: `function tituloFranja(sel, code, desde = '') {`

  Dentro de esa función, en `const cielo = [...cuenta.entries()].sort(...)`, cambiar `b[0] - a[0]` por `tapado(b[0]) - tapado(a[0])`.

- `app.js` · ancla: `const codVisto = codigoQueSeVe(c, C.weather_code);`

  En renderNow(): antes de esa línea montar la hora de AHORA con las capas de `current` (y si el modelo no las trae en current, las de la hora en curso), y pasarle esa en vez de `c`:
  
  const cAhora = { ...c,
    nubesBajas:  C.cloud_cover_low  ?? c?.nubesBajas,
    nubesMedias: C.cloud_cover_mid  ?? c?.nubesMedias,
    nubesAltas:  C.cloud_cover_high ?? c?.nubesAltas };
  const codVisto = codigoQueSeVe(cAhora, C.weather_code);
  
  El commit NO toca el `Cover.load(S.place, c);` de más abajo: sigue con la `c` cruda, y por eso fondo/ambiente/foto no se enteran del velado.

- `app.js` · ancla: `nubes: H.cloud_cover?.[i],`

  En renderDays(), dentro de iconosDelDia, debajo de `nubes: H.cloud_cover?.[i],` (esa cadena solo aparece una vez en el fichero base) añadir las capas para que cieloDelDia pueda medir por bajas+medias:
  
  nubesBajas: H.cloud_cover_low?.[i], nubesMedias: H.cloud_cover_mid?.[i],
  nubesAltas: H.cloud_cover_high?.[i],

**Riesgo al aplicarlo en casa**

Todo va en app.js; no toca maps.js, index.html ni styles.css (comprobado con git diff e5ab019 06773b7). Los commits traen además .claude/launch.json (servidor python local del portátil, puerto 8765) y .gitignore (.tools/): cacharrería del portátil, NO copiarlos. Los sellos de versión (sw.js `const V`, version.json y `const BUILD` en app.js, hoy 2026.09.06-1402) se hacen aparte. Puntos de choque si en casa tocaron lo mismo: (1) codigoQueSeVe(), cieloDelDia(), cieloPartido() y tituloFranja() son de las revisiones del 01-09 y 04-09 y en casa pueden haber seguido cambiando: comprobar que el último `return codigoDelCielo;` sigue siendo el cierre de codigoQueSeVe (en base hay dos, el primero con `>= HAY_AGUA`) y que el sort de empates `b[0] - a[0]` sigue estando tres veces (git grep -F 'b[0] - a[0]' app.js debe dar 3 antes y 0 después). (2) Si en casa ya han inventado otro código propio o usan el número 4 para algo, chocan: git grep -n -F 'VELADO' app.js y git grep -n -E '\b4:' app.js antes de empezar (en base no hay ninguno). (3) Comparaciones por número: en base la única con la que choca el 4 es `c <= 1` de `grupo` (ya cubierta). Si en casa han metido otras tipo `c === 2 || c === 3` («con nubes») o `c <= 3` («sin agua»), el 4 queda fuera de las primeras (a propósito) y dentro de las segundas (bien); pero un `c >= 2` para «nuboso» lo metería como nube: revisar. (4) Si HOURLY o CURRENT ya no piden cloud_cover_low/mid/high, veladoSiToca no rompe nada pero tampoco hace nada, y cieloDelDia vuelve a medir por la total. (5) Si en buildHours o en iconosDelDia cambiaron los nombres de los campos de la hora, ajustar nubesBajas/nubesMedias/nubesAltas al mismo estilo; las horas «por modelo» de la comparativa usan nombres cloud_cover_low/mid/high y NO les llega el velado (no pasan por aquí). (6) Si en casa ya han cambiado Cover.load para que reciba el código visto (o meten el visto dentro de la hora), las cuatro ramas `=== VELADO` de foto/ambiente/fondo cobran vida y el fondo de una hora velada pasa a azul lechoso: es lo que se pretendía, pero hay que saberlo.

**Cómo probar**

1) Abrir la app y en la consola del navegador (app.js va como `<script src="app.js" defer>`, sin módulos, así que las funciones son globales): `veladoSiToca(3, {nubesBajas:0, nubesMedias:0, nubesAltas:46})` → 4; `veladoSiToca(2, {nubesBajas:30, nubesMedias:0, nubesAltas:20})` → 2; `veladoSiToca(3, {nubesBajas:50, nubesMedias:0, nubesAltas:100})` → 3; `wmoText(4)` → 'Sol velado'; `tapado(4)` → 1.5. 2) Buscar un sitio y hora con cirros (Calpe 05-09 13:00: bajas 0, medias 0, altas 100) y mirar que en «Ahora» sale el sol con dos velos y el rótulo «Sol velado», y que en «Horas» y en la franja esas mismas horas ya no salen «Cubierto». NO esperar que el fondo cambie: con este commit el degradado, el ambiente y la foto siguen yendo por el código crudo del modelo (gris si daba 3). 3) En «10 días», un día con solo nube alta (altas ≥ 50 de media) sale «Sol velado»; con altas < 50 sale «Despejado»/«Mayormente despejado», no «Cubierto»; y un día con bajas o medias altas sigue saliendo nuboso/cubierto como antes.

### 4.2. El cielo lo vota la mediana de los modelos, no uno solo

Commits: `ec1ece1`

**Qué cambia**

Hasta ahora el dibujo del cielo seco (sol, nubes, cubierto) salía de un solo modelo, el «dueño del cielo», y cuando ese modelo se descolgaba una hora el icono se descolgaba con él. Ahora, en las horas para las que está cargada la comparativa del sitio abierto (se pide con forecast_days: 2 y past_hours: 1, o sea hoy y mañana en hora local del sitio, no «48 h desde ahora»), el cielo seco lo decide la MEDIANA de nube baja+media entre ECMWF, AROME HD, ICON y GFS —el Automático (best_match) no vota— y, para el velo, la mediana de nube alta; un modelo solo vota si tiene dato de baja Y media (la alta es opcional), hace falta quórum de 3, y con 4 votos la mediana es la media de los dos centrales. Escalones: baja+media ≥ 70 → Cubierto (3); ≥ 40 → Parcialmente nuboso (2); si no, alta ≥ 50 → Sol velado (VELADO = 4); baja+media ≥ 15 → Mayormente despejado (1); resto Despejado (0); con quórum, las capas del dueño ya no cuentan para el icono aunque dijera 0 %. Agua, tormenta (HAY_AGUA = 51, así que todo código ≥ 51 sale antes) y niebla (45/48) NO se votan; sin quórum, fuera de hoy-mañana, o en un emplazamiento que no sea el abierto, se sigue con el dueño del cielo y la regla del velo, como antes. Como entra por codigoQueSeVe() y todas las filas llevan `t`, vale para el icono grande de Ahora (cAhora hereda t y sitio de hours[0]), la lista de Horas, las franjas, y de los 10 días solo hoy y mañana (el resto no tiene comparativa); la fila «Cielo» de la caseta (H = S.torres[...].horas[0], que lleva su `sitio`) solo vota cuando la caseta es la del sitio abierto, y el «· N %» que la acompaña sigue siendo la nube total del dueño, así que texto e porcentaje pueden no cuadrar. cieloDelDia usa la misma mediana votada por hora cuando la hay (y la alta del dueño si ningún modelo da alta), para que el día y sus horas salgan de la misma cuenta. cieloVotado devuelve también `abanico` (máx−mín de los votos) y `n`, pero en este commit nadie los usa.

**Dónde**

- `app.js` · ancla: `const esLlovizna = c => has(c) && c >= 51 && c <= 57;`

  Añadir dos funciones nuevas por encima de codigoQueSeVe() (en el portátil van justo después de cerrar veladoSiToca(), del cambio «sol velado»; si no está, debajo de esta línea de esLlovizna vale igual: son declaraciones de función y el orden no importa). Usan cosas que ya existen en el base: has, deEsteSitio, S.comparativa, COMPARAR, key(); VELADO es del cambio «sol velado». El `??=` ya se usa en el base (5 veces), no añade sintaxis nueva.
  
  function cieloVotado(t, place = null) {
    const C = deEsteSitio(S.comparativa, place)?.hourly;
    if (!C?.time || !t) return null;
    C.__porHora ??= new Map(C.time.map((x, i) => [String(x).slice(0, 13), i]));
    const i = C.__porHora.get(String(t).slice(0, 13));
    if (i === undefined) return null;
    const bm = [], alta = [];
    for (const m of COMPARAR) {
      if (m.om === 'best_match') continue;               // mezcla: no vota
      const b = C[`cloud_cover_low_${m.om}`]?.[i], md = C[`cloud_cover_mid_${m.om}`]?.[i];
      if (!has(b) || !has(md)) continue;
      bm.push(Math.min(100, b + md));
      const a = C[`cloud_cover_high_${m.om}`]?.[i];
      if (has(a)) alta.push(a);
    }
    if (bm.length < 3) return null;
    const med = xs => { const o = [...xs].sort((p, q) => p - q), k = o.length;
      return k % 2 ? o[(k - 1) / 2] : (o[k / 2 - 1] + o[k / 2]) / 2; };
    const o = [...bm].sort((p, q) => p - q);
    return { bm: med(bm), alta: alta.length ? med(alta) : null, n: bm.length, abanico: o[o.length - 1] - o[0] };
  }
  function codigoVotado(v) {
    if (v.bm >= 70) return 3;
    if (v.bm >= 40) return 2;
    if (has(v.alta) && v.alta >= 50) return VELADO;
    if (v.bm >= 15) return 1;
    return 0;
  }
  
  El comentario largo que lleva encima en el portátil (bloque «EL CIELO LO VOTA LA MAYORÍA») explica el motivo: los seis parches de icono del 28-08 al 06-09 arreglaban un caso cada uno porque el dibujo salía de un solo modelo. Se puede copiar de `git show ec1ece1` o resumirlo. Nota: se compara la hora por sus 13 primeros caracteres («2026-09-06T17»); vale porque la comparativa y el pronóstico principal se piden los dos con timezone: 'auto'.

- `app.js` · ancla: `return 51;                                    // sirimiri: moja igual`

  Dentro de codigoQueSeVe(), después de cerrar el bloque `if (has(mm) && mm > 0) { ... }` y ANTES del return final (en el base es `return codigoDelCielo;`; con el cambio «sol velado» es `return veladoSiToca(codigoDelCielo, h);` — se deja el que haya), meter:
  
    /* La niebla tampoco se vota: es un dato de visibilidad, no de nubes. */
    if (codigoDelCielo === 45 || codigoDelCielo === 48) return codigoDelCielo;
    /* Cielo seco: primero la mayoría, y si no hay quórum, el dueño con la
       regla del velo. Ver `cieloVotado()`. */
    const voto = h?.t ? cieloVotado(h.t, h.sitio) : null;
    if (voto) return codigoVotado(voto);
  
  Tiene que ir después de todas las comprobaciones de agua (codeLluvia ≥ HAY_AGUA, codigoDelCielo ≥ HAY_AGUA, mm > 0), para que el voto solo toque el cielo seco; la tormenta (95+) ya sale por el filtro de ≥ 51.

- `app.js` · ancla: `t: H.time[i], date: new Date(H.time[i]), h: height,`

  En buildHours(fc, height, place = null), en el objeto que se mete con out.push({...}), añadir justo después de esa línea una propiedad nueva:
  
        /* El sitio de la fila, para que el voto del cielo solo use la
           comparativa de ESTE sitio y no la del abierto (06-09-2026). */
        sitio: place,
  
  Así una fila de «Mis estaciones» (buildHours se llama con su `place` para cada torre) no vota con la comparativa del sitio abierto: deEsteSitio(S.comparativa, place) compara `_sitio` con key(place) y devuelve null, y sigue el dueño del cielo. Para el sitio abierto buildHours se llama sin place → sitio: null → deEsteSitio usa S.place.

- `app.js` · ancla: `const iconosDelDia = (dia, codigoDiario) => {`

  Dentro de renderDays(), en el hs.push({...}) de iconosDelDia, añadir la hora cruda como primera propiedad, antes de `date: new Date(H.time[i]),` (en el base esa es la primera línea del objeto):
  
            t: H.time[i],
  
  Sin ese `t` las horas de los 10 días no entran en el voto (cieloVotado necesita la hora en texto). Estas horas no llevan `sitio`: son del sitio abierto, y con undefined deEsteSitio usa S.place, que es lo correcto. En la práctica solo votan las de hoy y mañana, que es lo que cubre la comparativa.

- `app.js` · ancla: `function cieloDelDia(sel) {`

  Que el dibujo del día use la mediana votada por hora cuando la hay. Versión final del portátil (sobre el cieloDelDia del cambio «sol velado», que ya mide por bajas+medias con `bm`, `conCapas` y el velo):
  
    /* Con comparativa cargada, cada hora aporta su MEDIANA votada; si no,
       las capas del dueño. Así el dibujo del día y el de las horas salen
       de la misma cuenta (06-09-2026). */
    const votos = sel.map(h => (h.t ? cieloVotado(h.t, h.sitio) : null));
    const bm = sel.map((h, k) => votos[k] ? votos[k].bm
                            : has(h.nubesBajas) && has(h.nubesMedias)
                            ? Math.min(100, h.nubesBajas + h.nubesMedias) : null).filter(has);
    const altas = sel.map((h, k) => votos[k] && has(votos[k].alta) ? votos[k].alta : h.nubesAltas).filter(has);
  
  O sea: se sustituyen las dos líneas `const bm = sel.map(h => has(h.nubesBajas) && has(h.nubesMedias) ...` y `const altas = sel.map(h => h.nubesAltas).filter(has);` por lo de arriba; el resto de la función (conCapas, nubes, media, velado y los cortes 12/50/80) no cambia.
  
  Si en casa cieloDelDia sigue como en el base (solo `const nubes = sel.map(h => h.nubes).filter(has);`, sin capas), lo equivalente mínimo es: `const votos = sel.map(h => (h.t ? cieloVotado(h.t, h.sitio) : null)); const nubes = sel.map((h, k) => votos[k] ? votos[k].bm : h.nubes).filter(has);` — pero lo suyo es aplicar antes el cambio «sol velado».

- `app.js` · ancla: `/* Fecha de compilación — la sustituye deploy.sh en cada publicación. */`

  Opcional, es solo el sello: la línea siguiente pasa de `const BUILD = '2026.09.06-1402';` a `const BUILD = '2026.09.06-1741';` (igual que `const V = 'torre-2026.09.06-1741'` en sw.js y version.json). En casa lo pone deploy.sh; no hace falta copiarlo a mano.

**Riesgo al aplicarlo en casa**

1) Depende del cambio «sol velado» (commits 51cccd2 y 06773b7, se explican aparte): en el base NO existen VELADO, veladoSiToca ni nubesBajas/nubesMedias/nubesAltas (comprobado con git grep en e5ab019). codigoVotado() devuelve VELADO (= 4) y codigoQueSeVe() acaba en veladoSiToca(). Si en casa no está aplicado, al cargar saldrá «VELADO is not defined» y el icono no se pintará: o se aplica antes «sol velado», o se quita el escalón `alta >= 50 → VELADO` de codigoVotado y se deja el return final de codigoQueSeVe como estaba. 2) El voto solo funciona si cargarComparativa() sigue pidiendo `cloud_cover_low,cloud_cover_mid,cloud_cover_high` para `models: COMPARAR.map(m => m.om)` con forecast_days: 2, sellando `d._sitio = key(place)`, y COMPARAR sigue teniendo ECMWF, AROME HD, ICON y GFS más el best_match (todo eso está así en el base: líneas 5016, 5032, 5049 y 4859-4863). Si en casa cambiaron la lista, quitaron las capas, o cambiaron el sello/key(), no rompe nada pero nunca hay quórum: se nota porque cieloVotado(S.data.hours[0].t) devuelve null con la comparativa cargada, y el icono sigue siendo el de un solo modelo. 3) Si en casa tocaron codigoQueSeVe() (más reglas de agua, otro orden), el voto tiene que quedar DESPUÉS de todo lo que hable de agua y ANTES del return final; si no, un sirimiri podría salir con sol. 4) cieloVotado deja una caché `__porHora` (un Map) colgada de S.comparativa.hourly; sanear() la ignora porque corre al cargar, antes de que exista, filtra por claves de POSIBLE y exige Array.isArray; y S.comparativa se sustituye entera en cada carga, así que la caché no se queda vieja. Pero si en casa hay algún bucle nuevo que recorra Object.keys(hourly) esperando arrays (p. ej. en renderComparativa), le chocará. 5) Si en casa el objeto de buildHours ya tiene una propiedad `sitio` o `t` con otro sentido, hay que revisar: aquí `t` es la hora en texto de Open-Meteo (H.time[i]) y `sitio` el place de la fila. 6) Cosmético: en la fila «Cielo» de la caseta del sitio abierto el texto sale votado pero el «· N %» sigue siendo la nube total del dueño (H.cloud), así que pueden no cuadrar; es así en el portátil también.

**Cómo probar**

1) Abrir la app en el sitio de siempre, esperar a que cargue la tabla de modelos (comparativa) y en la consola (app.js es script clásico con defer, las funciones son globales): `cieloVotado(S.data.hours[0].t)` → debe devolver `{bm, alta, n, abanico}` con n ≥ 3, y si la hora en curso no lleva agua ni niebla, `codigoVotado(cieloVotado(S.data.hours[0].t))` tiene que coincidir con el icono grande de Ahora (0 despejado, 1 mayormente despejado, 2 parcial, 3 cubierto, 4 sol velado). Sin errores en consola. 2) Buscar en la caja de nubes por modelo una hora de hoy o mañana en la que un modelo dé 100 % y los otros tres anden por 0-20 %: el icono de esa hora en Horas ya no debe salir «Cubierto», y una hora con sirimiri, tormenta o niebla sigue saliendo con sus gotas, su rayo o su niebla. 3) Comprobar el fallback: `cieloVotado(S.data.hours[60].t)` (fuera de hoy-mañana) y `cieloVotado(S.data.hours[0].t, S.torres[1].place)` (otro emplazamiento, si S.torres[1] no es el abierto) devuelven null; las filas de «Mis estaciones» de otros emplazamientos y las tarjetas de los 10 días a partir de pasado mañana siguen pintando el cielo del dueño como antes.

### 4.3. Mapa: arranca en ICON-EU otra vez, y la descarga cancelada no es un fallo

Commits: `6303e4f`

**Qué cambia**

El mapa vuelve a abrir con ICON-EU (7 km) en vez de ECMWF HRES (9 km): cambian tanto el valor inicial del objeto Maps como el valor por defecto que lee open() de localStorage. HRES sigue en la barra de modelos (primera entrada de TMODELS), a un toque. El motivo, según los comentarios ya existentes en maps.js (medido el 30-08): con HRES el mapa se queda sin memoria al quinto cambio de capa, con ICON-EU aguanta nueve, y con HRES de fábrica el cartel de «se ha recargado solo» saltaba a diario («va fatal mapas», Calpe 06-09). Además, la primera vez que se abre la pestaña del mapa con esta build, si en localStorage hay torre.tmodel = "ecmwf_ifs" se sustituye por "dwd_icon_eu" y se marca torre.tmodelLimpio0609 = true (la marca se pone siempre, haya o no algo que limpiar). OJO a la letra pequeña: el arranque de fábrica nunca escribe tmodel; en el código base solo lo escriben setModel() (un toque en la barra) y la red de seguridad (que lo pone a dwd_icon_eu). O sea, lo que se borra UNA vez es una elección manual de HRES hecha antes de esta build; el código no distingue si fue «por el arranque» o a propósito. A partir de ahí, lo que se elija a mano se respeta. En app.js, el oyente de unhandledrejection de Petardazo ignora ahora cualquier promesa rechazada cuyo motivo tenga name === 'AbortError' (aunque el mensaje no lleve esa palabra, como «signal is aborted without reason») y también los mensajes que contengan «signal is aborted» o «aborted a request». Esas cancelaciones (teselas abortadas al cambiar de capa) ya no llaman a registrar('promesa'): no sale la barra roja «Algo ha fallado dentro de la app» (#petado), no se apuntan en torre.fallos ni en consola.

**Dónde**

- `maps.js` · ancla: `map:null, model:'ecmwf_ifs', layer:'precipitation', base:'claro',`

  Cambiar model:'ecmwf_ifs' por model:'dwd_icon_eu' en esa línea del objeto Maps. Justo encima, después del comentario que termina en «Si le molesta, se vuelve a `dwd_icon_eu` en esta misma línea. */», añadir un comentario nuevo («── Y LE MOLESTÓ ──») que cuente lo de Calpe 06-09-2026 19:20 («va fatal mapas»), cuatro días con HRES de fábrica y la red de seguridad saltando a diario; que se vuelve a lo medido (ICON-EU aguanta nueve capas, HRES cae a la quinta), que el europeo de 9 km sigue a un toque en la barra, y que la elección a mano se guarda como siempre pero se limpia UNA vez la que dejó el arranque de HRES (ver open()).

- `maps.js` · ancla: `this.model = LS.get('tmodel', 'ecmwf_ifs');`

  Dentro de async open(), sustituir esa línea por: un comentario corto («Una sola vez: quien tuviera guardado HRES por el arranque del 02-09 vuelve a ICON-EU. Si lo vuelve a elegir a mano, se respeta.»); luego if (!LS.get('tmodelLimpio0609', false)) { if (LS.get('tmodel', null) === 'ecmwf_ifs') LS.set('tmodel', 'dwd_icon_eu'); LS.set('tmodelLimpio0609', true); } y a continuación this.model = LS.get('tmodel', 'dwd_icon_eu'); (el de fábrica pasa de ecmwf_ifs a dwd_icon_eu). El comentario viejo de dos líneas de encima («El de fábrica es el europeo de 9 km desde el 02-09-2026 … Lo que él haya elegido a mano manda.») se deja tal cual; el nuevo va debajo. Las demás líneas de open() (tlayer, tbase, tterrain…) no se tocan.

- `app.js` · ancla: `if (/OmHttpBackend|Aborted\(OOM\)|abortada|AbortError/i.test(m)) return;`

  En el oyente window.addEventListener('unhandledrejection', …) del objeto Petardazo (método vigilar), justo después de const m = String(r?.message || r || ''); y antes de esa línea, añadir if (r?.name === 'AbortError') return; con un comentario que explique que «signal is aborted without reason» (06-09-2026, Calpe, cambiando de capa en el mapa) es un AbortError de verdad pero el nombre va en r.name y el mensaje no lo lleva, así que se colaba a la barra roja; una descarga cancelada por cambiar de capa no es un fallo. Y en esa misma expresión regular añadir dos alternativas al final: |signal is aborted|aborted a request (queda /OmHttpBackend|Aborted\(OOM\)|abortada|AbortError|signal is aborted|aborted a request/i). La línea siguiente (Received \d+ bytes…) y el this.registrar('promesa', r) no cambian.

- `app.js` · ancla: `/* Fecha de compilación — la sustituye deploy.sh en cada publicación. */`

  Opcional: la línea de debajo, const BUILD = '…', pasa a '2026.09.06-1923'. Es el sello de compilación, igual que el V de sw.js y version.json; si se publica con deploy.sh lo pone él solo, y en el Mac de casa tendrá su propio valor: no copiarlo a mano.

**Riesgo al aplicarlo en casa**

Lo más probable que choque: si en el Mac de casa ya han vuelto a cambiar el modelo de arranque (la línea «map:null, model:'…'» o el LS.get('tmodel', '…') de open()), o si ya existe otra limpieza única con otra clave (buscar «tmodelLimpio» en maps.js). Ojo: en maps.js ya hay desde antes un LS.set('tmodel', 'dwd_icon_eu') dentro de la red de seguridad (a la segunda caída por memoria pasa solo a ICON-EU); ese no es de este cambio y no hay que tocarlo ni confundirlo con la limpieza. Si el modelo de fábrica allí ya es dwd_icon_eu, sobran las dos líneas del modelo pero sigue valiendo la limpieza única. Si la clave 'tmodelLimpio0609' ya existe con otro nombre, usar la que haya y no crear dos. Efecto secundario a tener en cuenta: la limpieza también borra una elección de HRES hecha a propósito antes de esta build (el código no distingue), así que si Aitor tenía HRES puesto adrede lo verá una vez en ICON-EU y tendrá que volver a tocarlo. En app.js, el oyente de 'unhandledrejection' puede haber ganado filtros nuevos (más alternativas en la regex o comprobaciones de r.name); si ya hay un «r?.name === 'AbortError'» no repetirlo. Si git grep -F de las anclas no encuentra nada, esa parte se movió o se reescribió: buscar entonces «unhandledrejection» en app.js y «async open()» en maps.js.

**Cómo probar**

1) En la consola del navegador poner localStorage.setItem('torre.tmodel', '"ecmwf_ifs"') (con las comillas dentro: LS guarda JSON) y borrar torre.tmodelLimpio0609 si existiera; recargar y abrir la pestaña del mapa: debe arrancar en ICON-EU y en localStorage tiene que aparecer torre.tmodelLimpio0609 = true y torre.tmodel = "dwd_icon_eu". La limpieza solo corre al abrir el mapa por primera vez en esa carga, no al arrancar la app. 2) Elegir ECMWF HRES a mano en la barra de modelos y recargar: debe seguir en HRES (la limpieza es una sola vez, la marca ya está puesta). 3) Con el mapa abierto, cambiar de capa varias veces seguidas rápido (lluvia → viento → nubes…): no debe salir la barra roja «Algo ha fallado dentro de la app» por «AbortError» ni «signal is aborted without reason», en consola no debe aparecer «[promesa]» con esos motivos, y en localStorage torre.fallos no debe ganar entradas nuevas con donde = 'promesa' por esas cancelaciones.

### 4.4. Segunda revisión de Calpe: la hora en que escampa, la capa que manda y el km

Commits: `bbce3dd5db8bc8ec04e3c652723693335cef11ae`

**Qué cambia**

Tres arreglos pequeños en app.js, salidos de las capturas que mandó Aitor el 07-09-2026 a las 00:18 (la fila con el fallo de la hora era la de Bermeo). Uno: en la lista de torres, la línea de agua de cada fila daba mal la hora de fin. `fin` se guarda como Date (en `S.lluviaTorres`, `fin = t` con `t = new Date(H.time[i])`) y `Date + 3600e3` pega texto en vez de sumar; según el navegador, eso da la misma hora («Llueve poco de 10:00 a 10:00» en Chrome, lo de la captura) o «NaN:00» (Safari, probado). Ahora se suma sobre milisegundos y sale «de 10:00 a 11:00» y «escampa a las» una hora más tarde, la buena. Dos: en la caja de nubosidad de «Ahora», con bajas 0 % · medias 70 % · altas 100 % salía «Manda la de altas: finas, dejan pasar el sol» debajo de un rótulo que decía «Cubierto». Ahora manda la primera capa de bajas o medias que llegue por sí sola al 40 % (bajas antes que medias), y solo si ninguna llega sigue mandando la mayor, como antes. Ojo: esto NO es exactamente la regla del velo del portátil (`veladoSiToca` mira la SUMA bajas+medias ≥ 40; aquí se mira cada capa por separado), y esa regla del velo no existe en el commit base. Como `manda` se usa en más sitios, cambian de paso: el aviso «no cuadra» (ya no salta cuando solo las altas superan el total), y lo que enseñan los modelos sin total (AROME HD) en la fila «NUBES DE CADA MODELO, ESTA HORA» y en el orden de la tabla de nubes, que ahora dicen la capa que tapa en vez de la mayor. Tres: en «Antes de salir», el km de la estación más cercana se pasa por `Number()` antes de `kmTxt`, porque `has('3.2')` da true y `'3.2'.toFixed` revienta con TypeError si el servidor lo manda como texto. Los cambios de `const BUILD` en app.js, `const V` en sw.js y version.json son sello de versión: no copiarlos.

**Dónde**

- `app.js` · ancla: `const manda = capas.reduce((x, y) => (y.v > x.v ? y : x));`

  Dentro de `function nubesPorCapas(C)`, justo después de `if (!capas.length) return null;`, sustituir esa línea por dos:
  
    const tapa = capas.find(x => x.n !== 'altas' && x.v >= 40);
    const manda = tapa || capas.reduce((x, y) => (y.v > x.v ? y : x));
  
  Es decir: manda la primera capa que NO sea 'altas' y esté al 40 % o más por sí sola (el array va bajas, medias, altas, y ya viene filtrado con `has`, así que gana bajas antes que medias); si ninguna baja ni media llega al 40, la mayor, como hasta ahora. El resto de la función (capas, linea, descuadre, noCuadra, suma, sinExplicar) se deja igual: `descuadre` y `noCuadra` siguen usando `manda.v`, con lo que ahora comparan el total contra la capa que tapa, no contra la mayor. Encima va el comentario del commit, al estilo del fichero: «MANDA LA QUE TAPA, NO LA MÁS ALTA EN NÚMERO — Calpe, 07-09-2026 a las 00:18: “bajas 0 % · medias 70 % · altas 100 %” y debajo “Manda la de altas: finas, dejan pasar el sol”, con el rótulo grande diciendo “Cubierto”. Las dos cosas a la vez no. Con un 70 % de nube media el cielo está tapado por la media, aunque la alta marque más: la misma regla del sol velado (bajas+medias desde el 40 % tapan; las altas solo velan). Sin nada bajo ni medio al 40, sigue mandando la mayor, como antes.» Si en casa no existe la regla del sol velado (`git grep -F veladoSiToca` sin resultado), quitar del comentario la frase que la cita: el código no depende de ella.

- `app.js` · ancla: `escampa a las ${hh(L.fin + 3600e3)}`

  Dentro de `function lineaAguaTorre(k)`, en el ternario `const cuando = L.sueltas ? ... : cayendo ? ... : ...`, cambiar `hh(L.fin + 3600e3)` por `hh(+L.fin + 3600e3)` en las DOS ramas: la de `<b>escampa a las ${hh(+L.fin + 3600e3)}</b>` y la de `de ${hh(L.ini)} a ${hh(+L.fin + 3600e3)}`. La rama de `L.sueltas` (`entre las ${hh(L.ini)} y las ${hh(L.fin)}`) no suma nada y se deja como está. Solo cambia el `+` delante de `L.fin`: convierte el Date a milisegundos antes de sumar. Se puede poner el comentario del commit encima: «`+L.fin`: si `fin` llega como Date, `Date + 3600e3` pega texto y la hora de después se pierde — salía “de 10:00 a 10:00” y “escampa” una hora antes de lo previsto (Calpe, 07-09-2026 00:19).» Motivo: `S.lluviaTorres` guarda `ini` y `fin` como Date (ver `S.lluviaTorres = sitios.map(`, donde `fin = t` y `t = new Date(H.time[i])`), y la `hh` local de esta función hace `new Date(d)` sobre lo que le pasen: con el texto pegado, Chrome devuelve la misma hora y Safari «NaN:00». Son las únicas dos líneas del base con `hh(... + 3600e3)`.

- `app.js` · ancla: `const kmTxt = v => (has(v) ? v.toFixed(1).replace('.', ',') : '—');`

  Este trozo NO toca `kmTxt` en sí: la ancla solo sirve para entender el fallo (`has` es `v !== null && v !== undefined && !Number.isNaN(v)`, y `Number.isNaN('3.2')` es false, así que un texto pasa el filtro y `'3.2'.toFixed` lanza TypeError). La línea que cambia está en `function antesDeSalir()`, que NO existe en el commit base e5ab019: la añade el cambio del portátil «Antes de salir: rayos medidos, estación medida y las 3 h siguientes, juntos» (2de037f), justo encima de `function pintarRayosTorre() {` (ésa sí está en el base). Si en casa no está aplicado ese cambio (`git grep -F "function antesDeSalir"` sin resultado), este trozo se salta. Si está, en el bloque marcado con el comentario `/* 2 · Lo medido en la estación más cercana */`, en la línea `const donde = x => \`${esc(x.nombre)} (a ${kmTxt(x.km)} km...`, cambiar `kmTxt(x.km)` por `kmTxt(Number(x.km))`. Nada más.

**Riesgo al aplicarlo en casa**

1) `manda` no solo pinta la frase «Manda la de…». Dentro de `nubesPorCapas()` alimenta `descuadre` y `noCuadra` (`manda.v - C.cloud_cover`); fuera lo usan `tablaNubes()` («total X % con {manda.n} al Y %» y `orden: has(tot) ? tot : cap.manda.v`), la fila «NUBES DE CADA MODELO, ESTA HORA» de `renderParte()` (los modelos sin total enseñan `{manda.n} {manda.v} %`, y el paréntesis del ⚠) y `renderNow()` (la puerta `cap.manda.v >= 20` de la frase «Manda la de…» y el aviso «el total dice X % y hay una capa al Y %, que es imposible»). Con la regla nueva `manda` puede no ser la capa mayor, y eso se nota en dos sitios: a) con bajas 0 · medias 45 · altas 100 y total 60, antes saltaba «no cuadra» (100 − 60 > 10) y ahora no (45 − 60), así que el aviso «un total menor que su capa más cargada» deja de salir cuando solo las altas superan el total; b) los modelos que no publican total (AROME HD, los «mudos») pasan a enseñar «medias 45 %» en vez de «altas 100 %» en esa fila y se ordenan por ese número en la tabla. El portátil lo aplicó tal cual; si en casa se quiere conservar la comprobación aritmética contra la mayor, guardar aparte `const mayor = capas.reduce((x, y) => (y.v > x.v ? y : x));` y usar `mayor.v` en `descuadre` y `noCuadra`. 2) La «regla del sol velado» que cita el comentario NO está en el base e5ab019: `VELADO`, `veladoSiToca` y `cieloVotado` llegaron con los commits del portátil 51cccd2, 06773b7 y ec1ece1. Además no es la misma regla: `veladoSiToca` mira la SUMA `b + m >= 40`, y `tapa` mira cada capa por separado, así que con bajas 25 · medias 25 · altas 90 el rótulo sigue en «Cubierto» y la frase vuelve a decir «Manda la de altas». Si en casa han hecho su propia regla del velo con otro umbral, que el 40 de aquí vaya a la par; si `git grep -F "const manda = capas.reduce"` no encuentra nada, es que la línea ya cambió y hay que mirar a mano. 3) En `lineaAguaTorre()`, si en casa `fin` ya se guarda como número (ms) en vez de Date, el `+` no hace daño; si han cambiado el texto de «escampa» o la `hh` local, adaptar el `+L.fin` a como esté. Entre el base y este commit nadie tocó ni `nubesPorCapas` ni `lineaAguaTorre`, así que en el portátil los dos primeros trozos aplican limpios sobre e5ab019. 4) El trozo de `Number(x.km)` solo aplica si existe `antesDeSalir()`; si `git grep -F "function antesDeSalir"` no da nada, saltarlo.

**Cómo probar**

1) Consola del navegador (app.js es script clásico, `nubesPorCapas` y `S` se ven desde fuera): `nubesPorCapas({cloud_cover_low:0,cloud_cover_mid:70,cloud_cover_high:100}).manda.n` debe dar 'medias' (antes daba 'altas'); con medias 20 y altas 100 debe seguir dando 'altas'; y con bajas 45 y medias 80 debe dar 'bajas' (gana la primera que llega al 40, no la mayor). En «Ahora», caja de nubosidad, con medias al 70 % la frase debe decir «Manda la de medias: grises y espesas, pero no llueve de ellas». 2) Lista de torres: en una fila con agua en las próximas 24 h, el tramo debe leerse «de HH:00 a HH+1:00» (nunca la misma hora dos veces, ni «NaN:00» en Safari) y «escampa a las» debe ser una hora más tarde que la última hora mojada; en consola, `const f = S.lluviaTorres.find(x=>x?.llueve)?.fin` sale como Date, y `new Date(+f + 3600e3).getHours()` tiene que ser una más que `f.getHours()`, mientras que `new Date(f + 3600e3)` da la misma hora o Invalid Date. 3) Si existe «Antes de salir»: la línea de la estación debe pintar «(a 3,2 km, …)» sin error en consola; `kmTxt(Number('3.2'))` da '3,2' mientras que `kmTxt('3.2')` lanza TypeError.

### 4.5. Bloque «Antes de salir» en la ficha de Torre

Commits: `2de037ff484a3994a672e3957ae309e3adeb4097`

**Qué cambia**

En la ficha de Torre, solo si el sitio abierto es uno de sus emplazamientos guardados, aparece encima de «Para llegar» un bloque «Antes de salir · ahora y 3 h» con un estado a la derecha (SIN NADA / OJO / FUERTE / SIN DATO) y cuatro renglones. (1) Rayos medidos por AEMET: rojo si hay descargas a menos de RAYO_ENCIMA km y todavía vigentes, ámbar si las hay a menos de RAYO_CERCA km y recientes, verde si no hay ninguna o solo lejanas/viejas, sin dato si aún no se han leído o falló la lectura; dice hasta qué hora hay medida. (2) Medido en la estación más cercana: de las tres estaciones más cercanas que miden racha (y, aparte, las tres que miden lluvia) se queda con las que tienen medida de menos de 2 h y pinta la peor contra sus listones (gustWarn/gustNo, rainWarn/rainNo) con nombre, km, altura del anemómetro y hora; si ninguna es fresca dice que es vieja y cuenta como sin dato; si no se ha consultado o falló, sin dato. (3) Las 3 horas siguientes: la hora en curso y las dos siguientes (S.data.hours[0..2]) pasadas por assess() con su perfil y listones, listando hasta 4 motivos no verdes (rojos primero y en negrita, luego sin dato, luego ámbar); además, si algún modelo de la comparativa (todos menos Automático) ve en esas horas una lluvia que llega al listón ámbar y supera en más de 0,05 mm el máximo de su propio modelo en esas mismas horas, se añade como motivo ámbar/rojo. (4) Radar: texto fijo con un botón que lleva a la pestaña Radar; este renglón NO cuenta para el estado del bloque. El estado del bloque, el del renglón de estación y el de las horas siguen la regla estadoSalir(): rojo si hay rojo; si no, sin dato; si no, ámbar; si no, verde (un hueco nunca tapa un rojo, al revés que worst()). Si aún no hay rayos u observación sellados para ese sitio, el bloque llama a cargarRayosAemet() y/o cargarObservacion() una sola vez y sin bloquear (ojo: esas llamadas también repintan sus propios paneles #rayosAemet y #obs de las otras pestañas), y el bloque se vuelve a pintar al final de renderTower(), al acabar cargarObservacion() (bien o con error) y al acabar cargarRayosAemet(). La observación queda en S.obs sellada por sitio y no caduca sola: con el tiempo el renglón dirá «vieja» hasta que algo vuelva a llamar a cargarObservacion() (en el commit base solo lo hace entrar en la vista «torres») o se cambie de sitio.

**Dónde**

- `app.js` · ancla: `altura volvería a dibujar la ficha y se lo llevaría por delante. */`

  Al final de renderTower(), justo después de las dos llamadas que siguen a ese comentario (`pintarRayosTorre();` y `pintarDiscrepancia();`), añadir una línea más:
    seguro('antes de salir', pintarAntesDeSalir);

- `app.js` · ancla: `¿HAY ALGÚN APARATO A SU ALTURA?`

  En cargarObservacion(), justo ANTES de ese comentario (o sea, justo después de la línea que construye `const es = [...eus, ...(d.estaciones || []).map(x => ({ ...x, red: 'AEMET' }))]` y su `.sort(...)`), guardar la observación sellada con el sitio y repintar el bloque:
      /* Se guarda, sellado con el sitio, para que «Antes de salir» pueda
         leer la medida sin volver a preguntar (06-09-2026). */
      S.obs = { clave: key(p), t: Date.now(), es, caidas, fallo: rEus?._fallo || null, error: null };
      seguro('antes de salir', pintarAntesDeSalir);
  (`p`, `es`, `caidas` y `rEus` ya existen en esa función en el commit base.)

- `app.js` · ancla: `<b>Que no haya medida no significa que no haya viento.</b></p>`;`

  En el catch de cargarObservacion(), después de la línea `if (hint) hint.textContent = '';` que va justo debajo de esa cadena (es la última línea del catch), añadir:
      S.obs = { clave: key(p), t: Date.now(), es: [], caidas: [], error: String(e?.message || e) };
      seguro('antes de salir', pintarAntesDeSalir);
  Así el bloque sabe que se preguntó y falló, y no se queda esperando ni vuelve a pedir.

- `app.js` · ancla: `if (S.data) seguro('rayos en torre', pintarRayosTorre);`

  En cargarRayosAemet(), justo debajo de esa línea, añadir:
    if (S.data) seguro('antes de salir', pintarAntesDeSalir);

- `app.js` · ancla: `function pintarRayosTorre() {`

  Justo ANTES de esa función (es decir, después del cierre de deEsteSitio(), que acaba en `return String(suyo) === aqui ? est : null;` y `}`), pegar el bloque nuevo entero. Son dos constantes y tres funciones. Todos los helpers que usa ya existen en el commit base (deEsteSitio, horaHM, haceCuanto, rangoHoras, kmTxt, has, wtxt, mmTxt, esc, key, $, assess, COMPARAR, VT, setView, DEFAULT_THR, seguro, cargarRayosAemet, cargarObservacion y las constantes RAYO_RADIO/RAYO_VIGENTE/RAYO_ENCIMA/RAYO_RECIENTE/RAYO_CERCA). En el commit va precedido de un comentario largo con las palabras de Aitor del 06-09-2026; es solo comentario y no hace falta copiarlo. Texto exacto:
  
  const SALIR_HORAS = 3;
  const SALIR_MEDIDA_VIEJA = 2 * 3600e3;
  
  /* Rojo si hay rojo; si no, sin dato; si no, ámbar; si no, verde. Distinto
     de `worst()`, donde el «sin dato» pisa al rojo: aquí un rojo medido no
     puede quedar tapado por un hueco de otra fila. */
  function estadoSalir(xs) {
    if (xs.includes('no')) return 'no';
    if (xs.includes('nd')) return 'nd';
    if (xs.includes('warn')) return 'warn';
    return 'go';
  }
  
  function antesDeSalir() {
    const p = S.place;
    if (!p || !S.data?.hours?.length) return null;
    const thr = S.thr || DEFAULT_THR;
    const filas = [];
    const hh = h => `${String(h.date.getHours()).padStart(2, '0')}:00`;
  
    /* 1 · Rayos medidos */
    {
      const R = deEsteSitio(S.rayos);
      let s = 'nd', txt;
      if (!R) txt = 'descargas de AEMET todavía no leídas';
      else if (R.error) txt = `no se han podido leer las descargas de AEMET (${esc(String(R.error).slice(0, 50))}). No saberlo no es que no caiga nada`;
      else {
        const d = R.d, u = d?.ultima;
        const hasta = d?.hasta ? ` — medido hasta las ${horaHM(d.hasta)}, ${haceCuanto(d.hasta)}` : '';
        if (!u) { s = 'go'; txt = `sin descargas a menos de ${d?.radio ?? RAYO_RADIO} km en las últimas ${d?.horasCatalogo ?? 6} h${hasta}`; }
        else {
          const edad = Date.now() - new Date(u.hasta).getTime();
          const cuando = `entre ${rangoHoras(u.desde, u.hasta)} (${haceCuanto(u.hasta)})`;
          const masCerca = u.masCerca ? `, la más cercana a ${kmTxt(u.masCerca.km)} km` : '';
          if (u.encima > 0 && edad <= RAYO_VIGENTE) {
            s = 'no'; txt = `<b>${u.encima} descarga${u.encima === 1 ? '' : 's'} a menos de ${RAYO_ENCIMA} km</b> ${cuando}${masCerca}`;
          } else if (u.cerca > 0 && edad <= RAYO_RECIENTE) {
            s = 'warn'; txt = `${u.cerca} descarga${u.cerca === 1 ? '' : 's'} a menos de ${RAYO_CERCA} km ${cuando}${masCerca} — tormenta por la zona`;
          } else if (edad <= RAYO_RECIENTE) {
            s = 'go'; txt = `descargas solo lejos${masCerca} ${cuando}`;
          } else {
            s = 'go'; txt = `la última descarga en ${d.radio} km fue ${haceCuanto(u.hasta)}; nada desde entonces${hasta}`;
          }
        }
      }
      filas.push({ k: 'Rayos medidos', s, txt });
    }
  
    /* 2 · Lo medido en la estación más cercana */
    {
      const O = S.obs && S.obs.clave === key(p) ? S.obs : null;
      let s = 'nd', txt;
      const edadDe = x => { const t = x.medidoEn ? Date.parse(x.medidoEn) : NaN; return Number.isFinite(t) ? Date.now() - t : null; };
      const cuando = x => { const t = x.medidoEn ? Date.parse(x.medidoEn) : NaN; return Number.isFinite(t) ? `a las ${horaHM(x.medidoEn)}` : 'sin hora'; };
      const fresca = x => { const e = edadDe(x); return e !== null && e <= SALIR_MEDIDA_VIEJA; };
      const donde = x => `${esc(x.nombre)} (a ${kmTxt(x.km)} km${x.alturaAnemometro ? `, racha a ${x.alturaAnemometro} m` : ''}, ${cuando(x)})`;
      if (!O) txt = 'estaciones cercanas todavía no consultadas';
      else if (O.error) txt = `no he podido preguntar a las estaciones (${esc(O.error.slice(0, 50))}). Que no haya medida no es que no haya viento`;
      else {
        const es = O.es || [];
        const conRacha = es.filter(x => has(x.racha)), conLluvia = es.filter(x => has(x.lluvia));
        if (!conRacha.length && !conLluvia.length) txt = 'ninguna estación cercana mide racha ni lluvia';
        else {
          const estados = [], partes = [];
          const frescasR = conRacha.slice(0, 3).filter(fresca);
          if (frescasR.length) {
            const peor = frescasR.reduce((a, b) => (b.racha > a.racha ? b : a));
            const st = peor.racha >= thr.gustNo ? 'no' : peor.racha >= thr.gustWarn ? 'warn' : 'go';
            estados.push(st);
            partes.push(`${st === 'go' ? '' : '<b>'}racha ${wtxt(peor.racha, true)}${st === 'go' ? '' : '</b>'} en ${donde(peor)}`);
          } else if (conRacha.length) {
            estados.push('nd');
            partes.push(`la racha más reciente es ${cuando(conRacha[0])} en ${esc(conRacha[0].nombre)}: vieja, no vale como «ahora»`);
          } else { estados.push('nd'); partes.push('sin medida de racha cerca'); }
          const frescasL = conLluvia.slice(0, 3).filter(fresca);
          if (frescasL.length) {
            const peor = frescasL.reduce((a, b) => (b.lluvia > a.lluvia ? b : a));
            const st = peor.lluvia >= thr.rainNo ? 'no' : peor.lluvia >= thr.rainWarn ? 'warn' : 'go';
            estados.push(st);
            partes.push(`${st === 'go' ? '' : '<b>'}${mmTxt(peor.lluvia)} mm de lluvia${st === 'go' ? '' : '</b>'} en ${donde(peor)}`);
          } else if (conLluvia.length) {
            estados.push('nd');
            partes.push(`la lluvia más reciente es ${cuando(conLluvia[0])}: vieja`);
          } else { estados.push('nd'); partes.push('sin pluviómetro cerca'); }
          s = estadoSalir(estados);
          txt = partes.join(' · ');
        }
      }
      filas.push({ k: 'Medido en la estación más cercana', s, txt });
    }
  
    /* 3 · Las horas siguientes, con la regla del semáforo y lo peor de cualquier modelo */
    {
      const hs = S.data.hours.slice(0, SALIR_HORAS);
      const estados = [], motivos = [];
      for (const h of hs) {
        const a = assess(h, thr, S.perfil, p);
        estados.push(a.st);
        for (const r of a.reasons) if (r.s !== 'go') motivos.push({ s: r.s, txt: `${hh(h)} · ${r.txt}` });
      }
      /* La lluvia que ve otro modelo y el tuyo no (la ráfaga ya la mira `assess` vía `peorRacha`). */
      const C = deEsteSitio(S.comparativa, p)?.hourly;
      if (C?.time) {
        C.__porHora ??= new Map(C.time.map((x, i) => [String(x).slice(0, 13), i]));
        let peor = null;
        for (const h of hs) {
          const i = C.__porHora.get(String(h.t).slice(0, 13));
          if (i === undefined) continue;
          for (const m of COMPARAR) {
            if (m.om === 'best_match') continue;
            const mm = C[`precipitation_${m.om}`]?.[i];
            if (has(mm) && (!peor || mm > peor.mm)) peor = { mm, quien: m.name, h };
          }
        }
        const propio = Math.max(0, ...hs.map(h => (has(h.prec) ? h.prec : 0)));
        if (peor && peor.mm >= thr.rainWarn && peor.mm > propio + 0.05) {
          const st = peor.mm >= thr.rainNo ? 'no' : 'warn';
          estados.push(st);
          motivos.push({ s: st, txt: `${hh(peor.h)} · ${peor.quien} ve ${mmTxt(peor.mm)} mm/h donde tu modelo da ${mmTxt(propio)}` });
        }
      }
      const orden = { no: 0, nd: 1, warn: 2, go: 3 };
      motivos.sort((a, b) => orden[a.s] - orden[b.s]);
      const s = estadoSalir(estados);
      const txt = motivos.length
        ? motivos.slice(0, 4).map(m => (m.s === 'no' ? `<b>${m.txt}</b>` : m.txt)).join(' · ')
        : `nada llega a tus listones de ${hh(hs[0])} a ${hh(hs[hs.length - 1])}, ni en tu modelo ni en los otros`;
      filas.push({ k: `Las ${SALIR_HORAS} horas siguientes`, s, txt });
    }
  
    return { estado: estadoSalir(filas.map(f => f.s)), filas, cuando: Date.now() };
  }
  
  function pintarAntesDeSalir() {
    const el = $('#vSalir');
    if (!el) return;
    const suyo = !!(S.place && (S.saved || []).some(p => key(p) === key(S.place)));
    if (!suyo || !S.data?.hours?.length) { el.hidden = true; el.innerHTML = ''; return; }
  
    /* Lo que falte se pide, una vez y sin bloquear: cada carga repinta esto al llegar. */
    const P = pintarAntesDeSalir;
    if (!deEsteSitio(S.rayos) && !P._rayos) {
      P._rayos = true;
      Promise.resolve().then(() => cargarRayosAemet()).catch(() => {}).finally(() => { P._rayos = false; });
    }
    if (!(S.obs && S.obs.clave === key(S.place)) && !P._obs) {
      P._obs = true;
      Promise.resolve().then(() => cargarObservacion()).catch(() => {}).finally(() => { P._obs = false; });
    }
  
    const A = antesDeSalir();
    if (!A) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.dataset.s = A.estado;
    el.innerHTML = `<b class="acc__k">Antes de salir · ahora y ${SALIR_HORAS} h
        <span class="salir__st" data-s="${A.estado}">${VT[A.estado]}</span></b>
      <ul class="acc__l salir__l">
        ${A.filas.map(f => `<li data-s="${f.s}"><span class="salir__k">${esc(f.k)}:</span> ${f.txt}</li>`).join('')}
        <li data-s="nd"><span class="salir__k">Radar:</span> el eco de ahora no se lee aquí —
          <button type="button" class="salir__ir" data-ir="radar">míralo en Radar</button> antes de salir</li>
      </ul>
      <p class="acc__nc acc__nc--suave">Con uno en rojo, sale en rojo. Cifras y medidas con su hora; la decisión es tuya.</p>`;
    el.querySelector('[data-ir]')?.addEventListener('click', () => { try { setView('radar'); } catch {} });
  }

- `app.js` · ancla: `Fecha de compilación — la sustituye deploy.sh en cada publicación.`

  Nada que copiar a mano. En el commit, la línea de debajo (`const BUILD = '...'`) pasa de 2026.09.06-1923 a 2026.09.06-2340; es el sello de compilación, igual que `const V` de sw.js y version.json, y deploy.sh lo pone en cada publicación. Se anota solo para que no sorprenda al ver el diff.

- `index.html` · ancla: `<div id="vAcceso" class="acc" hidden></div>`

  Justo ANTES de esa línea (queda entre `<p id="vCuando" class="cuando" hidden></p>` y `#vAcceso`, dentro de `#verdict` en la ficha de Torre) añadir el hueco del bloque nuevo:
          <!-- Antes de salir: rayos medidos, estación medida y las 3 h
               siguientes, juntos y con una regla: con uno en rojo, sale en
               rojo. Solo en sus emplazamientos. (06-09-2026) -->
          <div id="vSalir" class="acc" hidden></div>

- `styles.css` · ancla: `body[data-view="now"] .brand b:not(.brand__sitio){display:flex}`

  Esa es la última regla del fichero en el commit base (línea 2719 de 2720), dentro de un @media que cierra con `}` en la línea siguiente. DESPUÉS de ese `}` de cierre, al final del fichero, añadir:
  
  /* ── Antes de salir (06-09-2026) ─────────────────────────────────────── */
  .salir__st{float:right;font-weight:700;letter-spacing:.06em}
  .salir__st[data-s="no"]{color:var(--no)} .salir__st[data-s="warn"]{color:var(--warn)}
  .salir__st[data-s="go"]{color:var(--go)} .salir__st[data-s="nd"]{color:var(--faint)}
  .salir__l li[data-s="nd"]{color:var(--faint)} .salir__l li[data-s="go"]{color:var(--dim)}
  .salir__k{font-weight:600;opacity:.9}
  .salir__ir{font:inherit;font-size:0.8125rem;padding:1px 8px;border-radius:999px;cursor:pointer;
    border:1px solid color-mix(in srgb,var(--warn) 55%,transparent);background:transparent;color:var(--warn)}
  .salir__ir:hover{background:color-mix(in srgb,var(--warn) 18%,transparent)}
  
  (Comprobado en el commit base: las variables --no, --warn, --go, --faint y --dim están en el :root de index.html, y .acc, .acc__k, .acc__l, .acc__nc y .acc__nc--suave ya existen en styles.css.)

**Riesgo al aplicarlo en casa**

1) Nombres nuevos que podrían chocar: `S.obs`, `#vSalir`, `pintarAntesDeSalir`, `antesDeSalir`, `estadoSalir`, `SALIR_HORAS`, `SALIR_MEDIDA_VIEJA` y las clases `.salir__*`. En el commit base ninguno existe (comprobado con git grep), pero casa puede haberlos añadido después: antes de pegar nada, buscar en el proyecto de casa con grep -n -E 'S\.obs\b|vSalir|AntesDeSalir|antesDeSalir|estadoSalir|SALIR_|salir__' app.js index.html styles.css. Si casa ya usa `S.obs` para otra cosa, cambiar el nombre en los cuatro sitios donde aparece (dos en cargarObservacion, uno en antesDeSalir, uno en pintarAntesDeSalir). Si ya hay un `#vSalir` o una función con el mismo nombre, es que casa ya lo tiene: parar y comparar antes de duplicar.
2) El bloque se apoya en formas de datos que existen en el commit base y que casa puede haber tocado: `assess(h, thr, perfil, place)` devuelve `{ st, reasons: [{ s, txt }] }`; `S.rayos` es `{ clave, t, d, anoche, error }` con `d.ultima.{desde,hasta,encima,cerca,masCerca}`, `d.radio`, `d.hasta`, `d.horasCatalogo`; `S.comparativa` va sellada con `_sitio = key(place)` (si casa quitara ese sello, deEsteSitio devuelve null y la parte de lluvia de otros modelos se salta en silencio); las estaciones traen `racha`, `lluvia`, `medidoEn`, `nombre`, `km`, `alturaAnemometro`; `COMPARAR` tiene `om` y `name`; `S.comparativa.hourly` tiene `time` y `precipitation_<om>`; las horas tienen `t`, `date`, `prec`; los listones son `thr.gustWarn/gustNo/rainWarn/rainNo`; `VT` tiene las cuatro etiquetas go/warn/no/nd. Si en casa han cambiado alguno de esos nombres, el bloque no rompe la ficha (va dentro de `seguro()`), pero se quedará oculto o con texto raro: se nota porque en consola sale un error registrado por Petardazo como «pintar antes de salir».
3) En cargarObservacion(), la línea de `S.obs` cuenta con que las variables se sigan llamando `p`, `es`, `caidas` y `rEus`. Si casa ha renombrado o reestructurado esa función, adaptar los nombres; lo importante es guardar la lista de estaciones ordenada por km y la clave del sitio. Ojo también a que cargarObservacion() no tiene caché y pinta «Consultando estaciones…» en `#obs`: al abrir la ficha de Torre de un sitio guardado se dispara una petición a /estaciones por sitio y se repinta el panel de la otra pestaña; si casa ha metido caché o ha cambiado esa función, revisar que siga sellando S.obs en el camino bueno y en el catch, porque si no el bloque se queda en «todavía no consultadas» y vuelve a pedir en cada repintado.
4) Si casa ha añadido más cosas al final de styles.css o cambiado el orden de los `.acc` en index.html, no pasa nada: el CSS va donde sea y el div solo tiene que quedar encima de `#vAcceso`.

**Cómo probar**

1) Abrir la app en uno de sus emplazamientos guardados (no en un punto suelto) y entrar en la ficha de Torre: encima de «Para llegar» tiene que verse «Antes de salir · ahora y 3 h» con un estado a la derecha y cuatro renglones (Rayos medidos, Medido en la estación más cercana, Las 3 horas siguientes, Radar). En un punto que no esté guardado, el bloque no debe aparecer.
2) Esperar unos segundos: si al principio los renglones de rayos o estación dicen «todavía no leídas/consultadas», deben repintarse solos con cifras y hora cuando lleguen los datos. El botón «míralo en Radar» tiene que llevar a la pestaña Radar. Con las tres filas en verde, el estado de arriba debe ser SIN NADA aunque el renglón de Radar vaya en gris: ese renglón no cuenta.
3) Abrir la consola: no debe salir ningún error con «pintar antes de salir». Si se quiere forzar, bajar en Ajustes el listón de ráfaga mucho (p. ej. 5 km/h) y comprobar que el renglón de estación o de horas se pone en ámbar/rojo y que el estado de arriba pasa a rojo en cuanto una fila sea roja, aunque las demás estén en verde o sin dato.

### 4.6. 10 días: «solo el europeo ve agua» bajo el dibujo

Commits: `610648ffb2415024da968cf6b9a8a9eb325c6182`

**Qué cambia**

En la vista de 10 días, cuando una tarjeta enseña lluvia (0,1 mm o más en sus milímetros) pero de los modelos con resumen diario solo uno pasa de 0,5 mm ese día, debajo de la racha sale una línea naranja del estilo «⚠ solo ECMWF ve agua (1,2 mm) · ICON, GFS y AROME HD, secos». Si la tarjeta marca agua pero ningún modelo llega a 0,5 mm, dice «⚠ ninguno pasa de 0,5 mm en el día · ECMWF, ICON, GFS y AROME HD, secos». Se cuentan ECMWF, ICON, GFS y AROME HD; el Automático (best_match) se salta a propósito con el comentario «mezcla de los otros» —ojo: eso contradice la nota medida el 04-09-2026 que hay justo debajo en desacuerdoDelDia, donde se comprobó que el Automático trae dato propio (es ARPEGE cuando AROME se acaba) y por eso la racha y la máxima sí lo cuentan; consecuencia práctica: si el Automático también moja, el aviso seguirá diciendo «solo ECMWF ve agua». Hacen falta al menos tres modelos con dato y como mucho uno que moje; si no, no sale nada (tampoco si S.diariaMulti falta o es de otro sitio, porque pasa por deEsteSitio). Con esas condiciones siempre quedan dos o más secos, así que la rama «seco» en singular del código nunca se ve. El dibujo y los milímetros de la tarjeta no cambian: el dueño de la lluvia sigue mandando, esto solo matiza. Es el mismo gesto que ya tienen la racha («ICON da 54 — tu listón es 45») y la máxima («los 4 modelos van de 26° a 41°»), con la misma clase .dcard__x.

**Dónde**

- `app.js` · ancla: `function desacuerdoDelDia(fecha) {`

  Justo ANTES de esa línea (o sea, después del `}` que cierra `rachaDelDiaQueNoVesTu`, cuya última línea es `return { peor: cruzan[0], pinta, listón: ...`) se añade una función nueva. Va con su comentario de cabecera al estilo de la casa y este cuerpo exacto:
  
  /* ── ¿ESA AGUA LA VE ALGUIEN MÁS? ───────────────────────────────────
     Suyo, 07-09-2026 desde Calpe, con el jueves y el sábado dibujados con
     lluvia: *«¿jueves nuboso y agua? ¿y el sábado lo mismo?»*. Medido: el
     europeo —dueño de la lluvia por acierto— ponía llovizna de 0,1 mm por
     hora; ICON y GFS, secos del todo.
  
     El dueño no se cambia —*«cada uno en lo suyo»*, dijo él ese mismo
     día— pero a cinco días vista un agua que solo ve un modelo es un
     «puede», no un «va a», y eso hay que decirlo debajo del dibujo, igual
     que ya se dice con la racha («ICON da 64, tu listón es 60»).
  
     Se cuenta cuántos modelos con dato diario pasan de 0,5 mm en el día
     (medio milímetro: por debajo, los modelos bailan solos). Si hay tres
     o más opiniones y como mucho una moja, se avisa nombrándola.        */
  function aguaDelDiaQueNoVenTodos(fecha) {
    const D = deEsteSitio(S.diariaMulti);
    if (!D?.time?.length) return null;
    const i = D.time.indexOf(fecha);
    if (i < 0) return null;
    const con = [], mojan = [];
    for (const m of MODELOS_TORMENTA) {
      if (m.om === 'best_match') continue;                 // mezcla de los otros
      const v = D[`precipitation_sum_${m.om}`]?.[i];
      if (!has(v)) continue;
      con.push({ nom: m.nom, v });
      if (v >= 0.5) mojan.push({ nom: m.nom, v });
    }
    if (con.length < 3 || mojan.length > 1) return null;
    const secos = con.filter(x => x.v < 0.5).map(x => x.nom);
    return { n: con.length, mojan, secos };
  }
  
  No hace falta tocar `cargarDiariaMulti`: en el commit base ya pide `daily: 'temperature_2m_max,wind_gusts_10m_max,precipitation_sum'` con `models: MODELOS_TORMENTA.map(m => m.om).join(',')`, así que `D.precipitation_sum_ecmwf_ifs025` y compañía ya vienen en S.diariaMulti; y esa misma función ya repinta (`if (S.view === 'days') renderDays();`) cuando llega la respuesta. Todo lo que usa la función (`deEsteSitio`, `has`, `MODELOS_TORMENTA` con `om`/`nom` y `best_match`) existe en el base. Si en casa quieren que el Automático también cuente (como ya hacen `rachaDelDiaQueNoVesTu` y `desacuerdoDelDia`), basta con quitar la línea del `continue`.

- `app.js` · ancla: `${tormenta ? `<div class="dcard__s">⚡ Riesgo de tormenta`

  Dentro de `renderDays()`, en la plantilla de cada `<li class="dcard">`, justo ANTES de esa línea del riesgo de tormenta (y por tanto justo DESPUÉS del `})()}` que cierra el bloque de «⚠ los ${D.n} modelos van de») se añade un bloque nuevo igual que los otros dos avisos. Usa las variables `mm` (los mm de la tarjeta, `const mm = D.precipitation_sum?.[i];`) y `t` (la fecha del día, del `$('#dlist').innerHTML = D.time.map((t, i) =>`) que ya existen ahí:
  
        ${(() => {
          /* Solo si la tarjeta enseña agua: sin agua no hay nada que matizar. */
          /* Por los milímetros de la tarjeta, no por el código diario: ese
             es la peor hora y marcaba «agua» en días de 0,0 mm. */
          if (!(has(mm) && mm >= 0.1)) return '';
          const A = aguaDelDiaQueNoVenTodos(t);
          if (!A) return '';
          const quien = A.mojan.length
            ? `solo <b>${esc(A.mojan[0].nom)}</b> ve agua (${mmTxt(A.mojan[0].v)} mm)`
            : `ninguno pasa de 0,5 mm en el día`;
          const lista = xs => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
          return `<div class="dcard__x" title="${esc(A.secos.join(', '))}: secos">⚠ ${quien} · `
               + `${esc(lista(A.secos))}, ${A.secos.length === 1 ? 'seco' : 'secos'}</div>`;
        })()}
  
  No hay que tocar styles.css: `.dcard__x` ya está definida (`.dcard__x{margin-top:7px;font-size:0.75rem;line-height:1.35;color:var(--warn); opacity:.95}` y `.dcard__x b{font-weight:700}`). `esc` y `mmTxt` también existen en el base.

- `app.js` · ancla: `const BUILD = '2026.09.05-0616';`

  En el commit esa línea pasa a `const BUILD = '2026.09.07-1602';`. NO copiarlo a mano: es el sello de compilación que deploy.sh sustituye en cada publicación (el comentario de encima lo dice), igual que `const V` en sw.js y version.json. Solo se apunta para que no extrañe en el diff y para que, si se aplica con git apply o cherry-pick, se resuelva el choque dejando el BUILD de casa.

**Riesgo al aplicarlo en casa**

Todo el fondo va en app.js; sw.js, version.json y la línea BUILD de app.js son solo sellos de versión (dejar los de casa). Cosas que pueden chocar en el proyecto de casa:
1) Si allí ya hicieron algo parecido: buscar `aguaDelDiaQueNoVenTodos` y «ve agua (» en app.js antes de añadir nada, para no duplicar el aviso (en el base e5ab019 no existe ninguno de los dos).
2) Si en casa cambiaron `cargarDiariaMulti` y la petición ya no lleva `precipitation_sum` en `daily`, la función devuelve siempre null y el aviso no sale nunca (no rompe nada, pero no se nota). Se ve mirando en Red la petición con `models=ecmwf_ifs025,icon_seamless,...`: tiene que llevar `precipitation_sum`.
3) Si `MODELOS_TORMENTA` cambió de forma (otro nombre, sin `om`/`nom`, o sin `best_match`), adaptar el bucle. Y decidir si el Automático cuenta o no: el commit lo salta como «mezcla», pero en el propio base la nota del 04-09-2026 en `desacuerdoDelDia` dice que eso era falso y las otras dos funciones de la tarjeta sí lo cuentan; si en casa han seguido ese criterio, quitar el `continue` para ir a la par.
4) Si en `renderDays()` renombraron `mm` o `t`, o movieron el bloque de «los N modelos van de», colocar el bloque nuevo justo antes de la línea de «⚡ Riesgo de tormenta» y usar los nombres que allí tengan para los mm de la tarjeta y la fecha. Si la línea de tormenta ya no existe tal cual, el sitio es: después de los avisos `.dcard__x` de racha y de máxima, antes del cierre `</li>`.
5) Si quitaron o renombraron `.dcard__x` en styles.css, el aviso saldría sin color; usar la clase que usen los otros dos avisos de la tarjeta.
6) Los mm de la tarjeta salen de S.data.fc.daily.precipitation_sum, que puede venir «prestado por acierto» de otro modelo en una petición distinta; por eso puede pasar que la tarjeta marque 0,3 mm y el aviso diga «ninguno pasa de 0,5 mm»: es lo esperado, no un fallo.

**Cómo probar**

1) Abrir la vista de 10 días de un sitio con algún día de lluvia floja (en estas fechas Calpe u otro sitio del Mediterráneo suele valer) y esperar un par de segundos: la petición multi-modelo llega después del primer pintado y `cargarDiariaMulti` repinta sola. En la tarjeta con 0,1 mm o más debe salir debajo de la racha una línea naranja «⚠ solo X ve agua (n mm) · Y y Z, secos» (o «⚠ ninguno pasa de 0,5 mm en el día · ...»), antes del «⚡ Riesgo de tormenta» si lo hay.
2) En la consola del navegador (app.js es script clásico con defer, así que S y las funciones son globales): `aguaDelDiaQueNoVenTodos(S.data.fc.daily.time[3])` (poniendo el índice del día con agua) tiene que devolver `{n, mojan, secos}` en ese día, y `null` en uno seco o en uno donde dos o más modelos pasan de 0,5 mm. Para cotejar, `deEsteSitio(S.diariaMulti).precipitation_sum_icon_seamless` enseña la suma diaria de ICON, y lo mismo con `_ecmwf_ifs025`, `_gfs_seamless`, `_meteofrance_arome_france_hd`.
3) Contraprueba: en un día con «0,0 mm» o «sin dato» en la tarjeta no debe salir nada aunque el dibujo lleve nube; y si la petición multi-modelo falla (S.diariaMulti null) o es de otro sitio, la tarjeta sale como siempre, sin aviso.

### 4.7. Publicar la copia en GitHub Pages: BACKEND, torres de reserva y sello del build

Commits: `7313210 49d77dc df5ee13 0b9299f`

**Qué cambia**

En casa, abriendo la app desde Vercel o desde el Mac, Aitor no nota nada: BACKEND vale lo mismo que location.origin, el envoltorio de fetch no se instala (el `if` no entra) y todas las URL salen como siempre. Solo cuando el sitio se sirve desde un dominio que acaba en .github.io, las peticiones a /om, /api/*, /rayos, /estaciones, /mareas, /radar, /radar-aemet, /satelite, /webcams y /omtiles van a weather-app-ochre-one-76.vercel.app. Comprobado el 08-09-2026 contra el servidor real: /om y /rayos contestan con access-control-allow-origin: *, pero /api/torres no manda esa cabecera, así que desde Pages todo /api/* (torres, ajustes, campo, foto, suscribir...) falla; el pronóstico y los rayos sí llegan. Lo único que sí cambia en casa: un aparato sin ninguna torre guardada (recién instalado, o al que le han quitado todas) al que el servidor no contesta o contesta sin lista válida (error, 500, JSON sin `torres`) carga las 20 torres de data/torres-copia.json en vez de quedarse vacío; nunca pisa una lista que ya exista. Ojo: de esas 20 solo 2 llevan cota, altura y tipo (BI SOLLUBEMENDI 669 m y BI GALDAMES 619 m); las otras 18 van sin cota, así que el aviso de hielo no funcionará en ellas hasta que el servidor vuelva. El service worker guarda ese JSON tras la primera lectura correcta (red primero; si la red falla o tarda más de 4 s, sirve la copia guardada). El «arreglo del bucle» no es código nuevo: los commits 49d77dc y df5ee13 subieron version.json y sw.js (2350 y 2357) pero dejaron BUILD en app.js en 2026.09.07-1602, y comprobarVersion() recargaba sin parar; 0b9299f pone 2026.09.07-2359 en los tres. El .nojekyll es un fichero vacío (0 bytes) que solo pinta en GitHub Pages.

**Dónde**

- `.nojekyll` · ancla: `(fichero nuevo y vacío, 0 bytes, en la raíz al lado de index.html y sw.js; no hay ancla porque no existe en el base)`

  Crear un fichero vacío llamado .nojekyll en la raíz. Solo sirve para que GitHub Pages sirva los ficheros tal cual sin pasarlos por Jekyll. En Vercel no hace nada: inofensivo, y se puede saltar si en casa no se publica en Pages.

- `app.js` · ancla: `directas para poder seguir probando. */`

  Justo después de esa línea (cierre del comentario del intermediario /om) y ANTES de `const PROXY = (location.protocol === 'http:' ...`, añadir el bloque BACKEND:
  
  /* ── EN GITHUB PAGES, EL SERVIDOR ES VERCEL ────────────────────────────
     pentxa-design.github.io solo sirve ficheros. Todo lo que en el Mac
     reenviaba `.tools/servir.js` a Vercel (/om, /api/*, /rayos, /estaciones,
     /mareas, /radar, /satelite, /webcams, /omtiles) va aquí directo a
     Vercel. En cualquier otro sitio, BACKEND es el propio origen y no cambia
     nada. Ojo: /api/* aún no manda cabeceras CORS, así que desde Pages esas
     llamadas fallan hasta que el servidor las añada. */
  const BACKEND = /\.github\.io$/.test(location.hostname)
    ? 'https://weather-app-ochre-one-76.vercel.app' : location.origin;
  const RUTAS_BACKEND = /^\/(om|api|rayos|estaciones|mareas|radar|radar-aemet|satelite|webcams|omtiles)([\/?]|$)/;
  if (BACKEND !== location.origin) {
    const fetchOriginal = window.fetch.bind(window);
    window.fetch = (u, o) => fetchOriginal(
      (typeof u === 'string' && RUTAS_BACKEND.test(u)) ? BACKEND + u : u, o);
  }
  
  En casa BACKEND === location.origin, el `if` no entra y fetch queda nativo. El envoltorio solo reescribe cadenas que empiecen por esas rutas: en el base son 25 fetch con cadena literal (18 a /api/*, 3 a /rayos, 2 a /estaciones, 1 a /mareas, 1 a /webcams). El único fetch que no recibe cadena es el de jget (objeto URL), y no hace falta tocarlo porque API.* ya son absolutas con BACKEND. Como app.js es un script clásico con defer, ese `const` de arriba del todo lo ve también maps.js (que va después). En el base no existe ningún BACKEND ni RUTAS_BACKEND (git grep -w -E 'BACKEND|RUTAS_BACKEND' e5ab019 no da nada).

- `app.js` · ancla: `const via = k => PROXY ? `${location.origin}${PROXY}?api=${k}` : directo[k];`

  Cambiar `${location.origin}` por `${BACKEND}`. Queda: const via = k => PROXY ? `${BACKEND}${PROXY}?api=${k}` : directo[k];

- `app.js` · ancla: `get sat() { return `${location.origin}/satelite`; }`

  Cambiar `${location.origin}` por `${BACKEND}`. Queda: get sat() { return `${BACKEND}/satelite`; },

- `app.js` · ancla: `href="/api/foto?f=${encodeURIComponent(n.foto)}"`

  En pintarHilo(), en la foto de la nota: poner `${BACKEND}/api/foto?f=${encodeURIComponent(n.foto)}` tanto en el href del <a class="hn__foto"> como en el src del <img> de la línea siguiente (las dos líneas van seguidas). Es el único sitio del base donde una ruta del servidor va en HTML y no en fetch (git grep '/api/' fuera de fetch( solo da estas dos líneas y un comentario), así que el envoltorio no llega.

- `maps.js` · ancla: `? location.origin + '/omtiles' : TILES_DIRECTO;`

  Dejarla como: ? (typeof BACKEND !== 'undefined' ? BACKEND : location.origin) + '/omtiles' : TILES_DIRECTO;
  El `typeof` es por si maps.js corre sin app.js delante. En index.html van los dos con defer, app.js primero (líneas 1268-1269 del base), así que BACKEND ya existe cuando maps.js evalúa TILES_PROXY.

- `maps.js` · ancla: `return enWeb ? `${location.origin}/radar-aemet?f=${fichero}``

  En AEMET_RADAR.via(), cambiar `${location.origin}` por `${typeof BACKEND !== 'undefined' ? BACKEND : location.origin}`. El resto de la función (la rama `: this.base + fichero`) no se toca.

- `data/torres-copia.json` · ancla: `(fichero nuevo en data/, al lado de data/estaciones.json, el único que hay ahí en el base; no hay ancla)`

  Crear el fichero con esta forma: { "copia": "2026-09-07", "de": "weather-app-ochre-one-76.vercel.app", "torres": [ ...20 entradas con name, lat, lon, admin1 y, en 15 de ellas, country; solo 2 (BI SOLLUBEMENDI y BI GALDAMES) llevan elev, hgt y tipo... ] }. El del portátil está en GitHub, rama portatil-2026-09-07 (git show df5ee13:data/torres-copia.json). Lo más sano en casa es NO copiar ese sino generarlo desde el servidor real (lo que devuelve /api/torres hoy), para que lleve la lista y las cotas de verdad. No va en la lista de precache de sw.js (el diff no la toca), pero el service worker sí lo guarda en su caché tras la primera lectura correcta: es una ruta propia y no está en NUNCA_DE_COPIA, así que va red primero y, si la red falla o tarda más de 4 s, sirve la copia guardada. El fetch es relativo ('data/torres-copia.json', sin barra inicial), así que el envoltorio no lo reescribe y siempre se lee del mismo sitio del que salió la app.

- `app.js` · ancla: `async function sincronizarTorres({ mandar = false } = {}) {`

  Justo ANTES de esa línea (después del `return cambios; }` que cierra adoptarConfig) añadir:
  
  /* ── LA COPIA DE LAS TORRES, PARA CUANDO EL SERVIDOR NO CONTESTA ──────
     Desde GitHub Pages (pentxa-design.github.io) el servidor de Vercel no
     deja hablar a /api/* con otro dominio (sin cabeceras CORS), así que un
     aparato recién instalado allí se quedaría sin sus torres. Para eso está
     `data/torres-copia.json`: las 20 del servidor a 07-09-2026, con sus
     cotas. Solo entra cuando AQUÍ no hay ninguna: nunca pisa una lista que
     ya exista en el aparato, y en cuanto el servidor vuelva a contestar,
     manda él. */
  async function torresDeLaCopia() {
    if (S.saved.length) return null;
    try {
      const r = await fetch('data/torres-copia.json', { cache: 'no-store' });
      if (!r.ok) return null;
      const j = await r.json();
      return Array.isArray(j?.torres) && j.torres.length ? j : null;
    } catch { return null; }
  }
  
  S.saved siempre es un array (S.saved = LS.get('saved', []) en init), así que `.length` no revienta.

- `app.js` · ancla: `if (!Array.isArray(j.torres)) return false;`

  Dentro de sincronizarTorres, ese `if` y las dos líneas de encima (`if (!r.ok) return false;` y `const j = await r.json();`) se sustituyen, y el `try` original se parte en dos. El principio de la función queda así:
  
  async function sincronizarTorres({ mandar = false } = {}) {
    let j = null;
    try {
      const r = await fetch('/api/torres', {
        ...igual que ahora (method, headers, body, cache)...
      });
      if (r.ok) j = await r.json();
    } catch {}
    if (!Array.isArray(j?.torres)) {
      j = await torresDeLaCopia();
      if (!j) return false;
    }
    try {
  
      /* La configuración que venga se adopta SIEMPRE, ...
  
  O sea: el primer `try` solo pide al servidor y se traga el fallo (red caída, !r.ok, JSON roto); si no hay lista válida se prueba la copia (que devuelve null si aquí ya hay torres, y entonces se devuelve false como antes); el segundo `try {` se abre justo antes del comentario «La configuración que venga se adopta SIEMPRE» y lo cierra el `} catch { return false; }` que ya existe al final. Todo lo demás (adoptarConfig, «UNA LISTA VACÍA NUNCA PISA UNA LLENA», igual/S.saved/syncFav/cargarTorres) no se toca. Con la copia cargada el resto del cuerpo hace lo mismo que con el servidor: adoptarConfig rellena las cotas que falten (solo las 2 que las llevan), S.saved pasa a ser las 20, se guarda en LS y se repinta Torres.

- `app.js` · ancla: `const BUILD = '2026.09.05-0616';`

  Nada que copiar: es un aviso. Este valor tiene que ser el mismo que `build` en version.json y que la fecha de `const V = 'torre-...'` en sw.js. En casa lo sella deploy.sh en cada publicación. Si alguna vez se toca version.json o sw.js a mano sin tocar BUILD, comprobarVersion() ve build distinto, guarda 'recargando' en sessionStorage y recarga; al arrancar, init() hace sessionStorage.removeItem('recargando') y vuelve a llamar a comprobarVersion(), que vuelve a ver build distinto y recarga otra vez: bucle sin fin (el iPhone parpadeando en el candado). Es exactamente lo que pasó en el portátil con 49d77dc y df5ee13 (sellaron sw.js y version.json a 2350 y 2357 y BUILD se quedó en 2026.09.07-1602); 0b9299f lo arregla poniendo 2026.09.07-2359 en los tres. En el portátil se hizo un .tools/sellar.sh local, fuera del repo, que sella los tres a la vez.

**Riesgo al aplicarlo en casa**

1) sincronizarTorres: si en casa han reescrito el principio de la función (se nota porque ya no está literal `if (!Array.isArray(j.torres)) return false;` ni `if (!r.ok) return false;` seguido de `const j = await r.json();`), no aplicar el diff a ciegas; la idea a conservar es solo «si el servidor no da lista válida y aquí no hay ninguna, tirar de la copia; si aquí hay torres, seguir devolviendo false como antes». 2) La copia es una foto del 07-09 y solo 2 de las 20 llevan cota: si en casa se borra una torre del servidor y luego un aparato vacío sin servidor carga la copia, al volver el servidor ese aparato la manda —modo 'juntar' al arrancar (init), y modo 'mandar', que SUSTITUYE la lista del servidor, al tocar una cota (guardarCfg) o al añadir/quitar una torre— y la torre borrada puede resucitar. Se nota porque en /api/torres reaparece una torre quitada. Remedio: regenerar data/torres-copia.json cada vez que cambie la lista, o no llevar esta parte a casa. 3) Un aparato al que se le quitan todas las torres a propósito cuenta como «sin ninguna»: si en ese momento el servidor no contesta, la copia le vuelve a poner las 20. 4) Si en casa ya hubiera un global llamado BACKEND o RUTAS_BACKEND, choca el nombre (git grep -w -E 'BACKEND|RUTAS_BACKEND' -- app.js maps.js; en el base no hay ninguno). 5) Si en casa han cambiado `via`, `API.sat`, TILES_PROXY, AEMET_RADAR.via o la foto de pintarHilo, la sustitución location.origin -> BACKEND hay que hacerla sobre lo que haya, no sobre estas líneas; y si han añadido otra ruta del servidor en HTML (src/href) fuera de fetch, también habría que ponerle BACKEND delante. 6) Desde *.github.io, /api/* seguirá fallando hasta que el servidor de Vercel mande Access-Control-Allow-Origin para https://pentxa-design.github.io (hoy /om y /rayos mandan *, /api/torres no manda nada; además /api/torres es POST con JSON, que exige preflight OPTIONS): eso es trabajo en api/ del proyecto de casa, no en app.js. 7) El envoltorio solo reescribe cadenas: un fetch nuevo con objeto URL/Request y ruta relativa al servidor no se reescribiría desde Pages (en casa da igual, el envoltorio ni se instala). 8) El service worker guarda data/torres-copia.json en su caché: si en casa se regenera el fichero, un aparato sin red o con red lenta (más de 4 s) puede leer la copia anterior hasta que la red vuelva a contestar.

**Cómo probar**

1) En casa, abrir la app publicada en Vercel y en la consola: `BACKEND === location.origin` tiene que dar true y `String(window.fetch)` tiene que contener [native code] (sin envoltorio); en la pestaña Red, /om?api=fc, /api/torres, /rayos, /omtiles y /radar-aemet deben seguir pidiéndose al mismo dominio, y la foto de una nota del hilo debe cargar desde /api/foto del mismo dominio. 2) Copia de torres: en una ventana privada (sin torres guardadas) con /api/torres bloqueado en DevTools (Red -> bloquear URL) o con el servidor caído, abrir la app: en Torres deben aparecer las 20 de data/torres-copia.json, y solo Sollubemendi y Galdames con cota; con torres ya guardadas, bloquear /api/torres no debe cambiar nada; al desbloquear, manda el servidor. 3) Sello: tras publicar, `curl -s https://weather-app-ochre-one-76.vercel.app/version.json`, `grep "const BUILD" app.js` y `grep "const V" sw.js` tienen que dar la misma fecha-hora; si difieren, la app se recarga cada segundo con el aviso «Versión nueva». 4) Si se publica en Pages: `curl -sI -H 'Origin: https://pentxa-design.github.io' https://weather-app-ochre-one-76.vercel.app/api/torres` debe traer access-control-allow-origin; mientras no lo traiga, desde Pages las torres solo saldrán de la copia.

## 5. Opcional: CORS para seguir usando GitHub Pages

SITUACIÓN HOY (medida el 08-09 con `curl -H 'Origin: https://pentxa-design.github.io'`): /om, /rayos, /estaciones, /satelite, /mareas, /radar-aemet, /webcams y version.json contestan `access-control-allow-origin: *`, también al OPTIONS (200). En cambio /api/torres, /api/campo, /api/euskalmet y /api/vigilante no mandan ninguna cabecera CORS, y al OPTIONS /api/torres y /api/campo contestan 405 (/api/euskalmet contesta 200 pero sin cabeceras): desde Pages el navegador rechaza el preflight y la llamada muere. Lo que necesita la app es poco: no usa cookies ni `credentials` (grep en app.js: cero `credentials:` y cero `Authorization`; el candado de 6 cifras se comprueba en el propio aparato por hash), los GET van sin cabeceras propias y los POST solo llevan `Content-Type: application/json` (que sí dispara preflight).

QUÉ TOCAR EN LAS FUNCIONES (es lo que de verdad lo arregla; son las Node de `iad1`: torres, ajustes, marcador, calibrar, campo, foto, suscribir, prueba-aviso, vigilante, euskalmet). Un ayudante nuevo y una línea al principio de cada handler, ANTES de cualquier `if (req.method !== 'POST') return res.status(405)…` (esa comprobación es la que hoy contesta 405 al OPTIONS):

// api/_cors.js (nuevo; Vercel no publica como ruta los ficheros que empiezan por _)
const PERMITIDOS = ['https://pentxa-design.github.io'];
module.exports = function cors(req, res) {
  const o = req.headers.origin;
  if (o && PERMITIDOS.includes(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);   // un solo valor, nunca una lista con comas
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }   // preflight: 204 y fuera
  return false;
};

// en cada api/*.js, primera línea del handler:
const cors = require('./_cors');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  …lo de siempre…
};

Si las funciones son ESM (`export default async function handler(req, res)`), lo mismo con `import cors from './_cors.js'`. Si alguna /api/* fuera edge (devuelve `new Response(...)`), las cabeceras van en el segundo argumento de Response y el OPTIONS se contesta con `new Response(null, { status: 204, headers })`. Alternativa más simple, y válida porque no hay credenciales: `Access-Control-Allow-Origin: *` como ya hacen /om y /rayos (entonces sobra el Vary). Las cabeceras exactas que debe llevar cada respuesta de /api/*: `Access-Control-Allow-Origin: https://pentxa-design.github.io` (o `*`), `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`; y el OPTIONS: estado 204, sin cuerpo, con esas tres más `Access-Control-Max-Age: 86400`.

QUÉ TOCAR EN vercel.json (complemento, NO sustituto): un bloque en `headers` para `/api/(.*)` añade las cabeceras a las respuestas de las funciones, y con eso bastaría para los GET (peticiones simples). Pero NO arregla el preflight: el OPTIONS sigue llegando a la función, la función sigue contestando 405, y el navegador exige 2xx → todos los POST (torres, ajustes, campo, foto, suscribir, calibrar, marcador, prueba-aviso) seguirían fallando. Si se quiere de todas formas como cinturón y tirantes, se fusiona con el array `headers` que ya tenga el vercel.json DE CASA (el de origin/main es del 17-08 y puede no ser el actual; leer `$P/vercel.json` antes):
"headers": [ { "source": "/api/(.*)", "headers": [
  { "key": "Access-Control-Allow-Origin", "value": "https://pentxa-design.github.io" },
  { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
  { "key": "Access-Control-Allow-Headers", "value": "Content-Type" } ] } ]

DETALLES: /api/foto en el hilo se carga como `<img src>` y `<a href>`, no necesita CORS. El OPTIONS tiene que contestar 204 antes de cualquier comprobación de método o de clave (vigilante incluido). Comprobación tras publicar: los dos curl del paso 13 del procedimiento (OPTIONS a /api/torres → 204 con las tres cabeceras; GET a /api/vigilante?pulso=1 → 200 con Allow-Origin).

## 6. Lo que NO hay que hacer

- NO hagas `git merge`, `git pull` ni `git rebase` entre la rama del portátil y nada de casa u origin/main: no tienen ancestro común (`git merge-base master origin/main` vacío) y git dirá «refusing to merge unrelated histories»; con `--allow-unrelated-histories` lo que sale es un revoltijo de 16.000 líneas en conflicto. Solo parches (`git am -3` o `git apply -3`).
- NUNCA publiques a Vercel desde el clon del portátil ($B, ni desde /Users/aitor/AitorMeteo): no tiene api/, lib/ ni vercel.json. Un `vercel --prod` desde ahí dejaría la web sin servidor (sin /om, /rayos, /estaciones, /api/torres…) y la app en los móviles sin datos. Solo se publica desde $P, con su deploy.sh.
- No subas nada a origin/main ni uses `git push --force` en ningún sitio. origin/main es la app de agosto; si algún día se pone al día, que sea casa quien empuje a una RAMA NUEVA (p. ej. casa-2026-09-13), y antes comprobar que no hay claves ni .env en ficheros seguidos (`git ls-files | grep -i -E '\.env|secret|clave|token'`).
- El sello a medias es el fallo más probable: `const BUILD` (app.js:14), `const V = 'torre-…'` (sw.js:13) y version.json tienen que llevar el MISMO build. Con `git am -3` limpio, version.json SE QUEDA en 2026.09.05-0616 mientras app.js y sw.js pasan a 2026.09.07-2359 (reproducido en el ensayo): publicar así hace que el móvil recargue en bucle (pasó el 07-09 en el iPhone). El paso 8 es obligatorio siempre, y la comprobación de los tres se repite tras publicar.
- No sustituyas los ficheros de casa por los del portátil a mano (cp): sw.js y version.json del portátil solo cambian en el sello, y app.js/maps.js de casa pueden tener trabajo posterior al 05-09 que la copia del portátil no conoce. Por eso el diff de la vía 6B no incluye sw.js, version.json ni la línea BUILD.
- En casa no ejecutes `git reset --hard`, `git checkout -- .`, `git clean` ni `git stash drop`. Para deshacer: `git -C "$P" am --abort` (vía 6A) o `git -C "$P" checkout -- app.js maps.js index.html styles.css && rm -f "$P/data/torres-copia.json"` (vía 6B) devuelven los ficheros al commit de seguridad del paso 3; y siempre queda el .tgz.
- data/torres-copia.json es una foto de las 20 torres a 07-09-2026 (formato {"copia","de","torres":[…]}, el mismo array que devuelve GET /api/torres). Solo entra si /api/torres no contesta Y el aparato no tiene ninguna torre; nunca pisa una lista existente. En casa no molesta. Si se han añadido sitios después, se regenera con: `curl -s https://weather-app-ochre-one-76.vercel.app/api/torres | python3 -c 'import json,sys;d=json.load(sys.stdin);print(json.dumps({"copia":"2026-09-13","de":"weather-app-ochre-one-76.vercel.app","torres":d["torres"]},ensure_ascii=False,indent=1))' > "$P/data/torres-copia.json"`.
- El bloque BACKEND / RUTAS_BACKEND / envoltorio de fetch (app.js:24-40), `${BACKEND}` en `via`, `API.sat`, `pintarHilo`, `TILES_PROXY` y `AEMET_RADAR.via` son solo para GitHub Pages: fuera de *.github.io `BACKEND === location.origin` y el envoltorio ni se instala, así que se puede llevar tal cual (viene en el diff, y así el portátil y casa tienen el mismo app.js) o dejarlo fuera. .nojekyll, .gitignore (`.tools/`) y .claude/launch.json NO van en el parche y no hacen falta en casa (launch.json apunta a /Users/aitor/AitorMeteo, ruta del portátil).
- BACKEND lleva el dominio de Vercel escrito a mano ('https://weather-app-ochre-one-76.vercel.app', app.js:33). Si casa cambia de dominio, GitHub Pages se queda sin datos; la web de Vercel no se entera.
- Si `pruebas.js` de casa falla tras el parche, no se publica y no se salta la prueba: los cambios del portátil tocan justo lo que vigila (`codigoQueSeVe`, `codigoFranja`, `cieloPartido`, `renderNow`, `renderDays`). Léela y arregla; app.js:14081 explica por qué existe.
- Si el portátil sube más commits a portatil-2026-09-07 antes del domingo, el hash de la punta cambia (cambia con cada commit): usa siempre el nombre de la rama y mira `git -C "$B" log --oneline e5ab019..portatil-2026-09-07` para saber qué se lleva. Los parches salen SIEMPRE de e5ab019: no inventes otra base.
- Con `Access-Control-Allow-Origin` un solo valor: varios orígenes separados por comas los rechaza el navegador (si hacen falta varios, se devuelve el que coincida y `Vary: Origin`). Y el OPTIONS tiene que contestar 204 ANTES de cualquier comprobación de método o de clave: hoy /api/torres y /api/campo contestan 405 y /api/euskalmet 200 sin cabeceras, y las tres cosas hacen fallar el preflight.
- Al probar en el móvil no borres la app ni sus datos para «forzar»: la lista de torres, los ajustes y los avisos recibidos viven en el aparato y en el servidor; con el sello bien, basta con abrirla y esperar la recarga única.
- /api/vigilante sin `?pulso=1` devuelve 401: no es un fallo, es cómo está hecho; la app siempre lo pide con `?pulso=1` (app.js:16625).

## 7. Lista de comprobación final

- [ ] Copia de seguridad `.tgz` hecha y commit de seguridad en casa (paso 3).
- [ ] Los seis ficheros comparados con e5ab019 (paso 5) y la vía elegida (6A o 6B) anotada.
- [ ] Parches aplicados; `node --check` de app.js, maps.js y sw.js sin error.
- [ ] Sello IGUAL en app.js (`const BUILD`), sw.js (`const V`) y version.json → «SELLO OK».
- [ ] `pruebas.js` de casa pasa (si existe). Si no pasa, NO se publica.
- [ ] Probado en local: Ahora, Antes de salir, 10 días («solo el europeo ve agua»), Mapa en ICON-EU, consola limpia.
- [ ] Publicado desde casa con deploy.sh; los tres sellos en la web coinciden; /api/torres y /om contestan 200.
- [ ] iPhone: recarga UNA vez, 20 emplazamientos, candado, «Antes de salir», mapa en ICON-EU; a los 5 min no recarga.
- [ ] «Mis estaciones» en el iPhone con vigilante, estación de Euskalmet y sincronización: es la pestaña que importa.
- [ ] Commit y etiqueta en casa (paso 12).

## 8. El iPhone de Aitor: qué app usa para trabajar

Esta semana el iPhone ha tenido dos iconos:

- **La app de trabajo**: https://weather-app-ochre-one-76.vercel.app (la que publica casa). Tiene todo: vigilante, estación de Euskalmet, sincronización de torres y ajustes, avisos push. Es la única válida para «Mis estaciones» y para decidir si alguien sube.
- **La copia de Calpe**: https://pentxa-design.github.io/meteo-aitor/ (GitHub Pages, esta rama). Sirve para el tiempo y para probar lo nuevo, pero en «Mis estaciones» le faltan el vigilante, la estación medida y la sincronización, porque /api/* no manda CORS. Lo dice en pantalla («No he podido preguntar por el vigilante», «ESTACIÓN no se ha podido leer»).

Cuando hayas publicado en Vercel con los cambios del portátil, la app de trabajo tendrá también todo lo nuevo y la copia de Calpe sobra: Aitor puede borrar ese icono. Si quiere conservarla, hay que hacer el paso 13 (CORS).

## 9. El repaso diario, que también hay que llevarse a casa

Aitor, 08-09-2026: *«esto me pasaba en el Mac de casa cada día: lo reparaba, pasaban 24 h y vuelta a empezar»*. Muchos fallos dependen de la HORA (noche, fin de día, primera hora): una corrección probada a las 15:00 se rompe a las 23:00. En el portátil hay una tarea programada de la app de Claude, `repaso-diario-meteo`, a las 07:15 y 23:15, que solo mira y cuenta (no toca código). **Hay que crear la misma en el Mac de casa**, apuntando a la app de trabajo (la de Vercel, `https://weather-app-ochre-one-76.vercel.app/`) en vez de a la de Pages, y quitando la salvedad de CORS (en Vercel `/api/*` funciona, así que «no se ha podido leer» sí es fallo). El texto de la tarea, para copiarlo tal cual cambiando la URL:

```
Eres el repaso diario de la app del tiempo de Aitor, "Aitor Meteo", publicada en https://pentxa-design.github.io/meteo-aitor/ desde la rama portatil-2026-09-07 del repo pentxa-design/meteo-aitor (carpeta local /Users/aitor/AitorMeteo, rama master). Contexto en /Users/aitor/.claude/projects/-Users-aitor-claude-app/memory/meteo-aitor-repos-divergentes.md (léelo primero). Aitor usa la app para decidir si manda gente a torres de telecomunicaciones: un dato mal puesto puede costar vidas. Este repaso existe porque muchos fallos dependen de la HORA (de noche, al acabar el día, a primera hora) y una corrección que parece bien a las 15:00 se rompe a las 23:00. Por eso corres a las 07:15 y a las 23:15.

NO cambies código ni hagas commits: tu trabajo es MIRAR y CONTAR. Si algo está mal, dilo con precisión (vista, texto exacto, hora, y por qué está mal) para que Aitor o la sesión "Prueba iPhone y Mac" lo arreglen.

Herramientas: la vista previa del navegador (navigate, javascript_tool, computer screenshot) y curl. Si el navegador no estuviera disponible, haz al menos las comprobaciones con curl y dilo.

Procedimiento:
1. Comprueba con curl que https://pentxa-design.github.io/meteo-aitor/version.json responde y anota el build. Compara con `grep -n "const BUILD" /Users/aitor/AitorMeteo/app.js`, `grep -n "const V " /Users/aitor/AitorMeteo/sw.js` y `cat /Users/aitor/AitorMeteo/version.json`: los tres deben coincidir entre sí (si no, es un fallo grave: la app recarga en bucle).
2. Abre https://pentxa-design.github.io/meteo-aitor/ en el navegador. Con javascript_tool pon: localStorage.setItem('candado.hasta', String(Date.now()+3600e3)); localStorage.setItem('torre.place', JSON.stringify({name:'Calpe',admin1:'Comunidad Valenciana',country:'España',lat:38.6708,lon:0.0565,elev:58})); y recarga. Espera 15 s. (Las funciones de la app son globales: S, BUILD, codigoQueSeVe, textoVisto, aguaPrestada, windAt...)
3. Comprobaciones con javascript_tool (haz cada una y apunta el resultado):
   a) typeof BUILD y que BUILD === build de version.json. Marca window.__m = Date.now(), espera 20 s y comprueba que window.__m sigue definido (si no, la app se recarga en bucle).
   b) Errores de consola de tipo ReferenceError o TypeError (read_console_messages onlyErrors). Los errores CORS de /api/* son conocidos en Pages y NO cuentan.
   c) En las vistas Ahora, Horas, 10 días y Mis estaciones (cambia con [...document.querySelectorAll('button.tab')].find(b => b.dataset.v === 'now'|'hours'|'days'|'torres').click() y espera 5 s), coge document.body.innerText y busca: "NaN", "undefined", "null", "Invalid Date", "a las NaN", "—°". Cualquier aparición es fallo.
   d) Regla de noche: si S.data.hours[0].day === 0, ni #nowDesc ni la franja NOCHE pueden decir "Sol velado" (de noche debe decir "Velo de nubes altas"). Busca "Sol velado" en innerText y comprueba en qué franja/hora aparece y si es de día.
   e) Iconos vacíos: document.querySelectorAll('svg[aria-label="sin dato"]').length en 10 días y en las franjas debe ser 0.
   f) Línea de máxima y mínima (#nowRange): si lleva "a las HH:00", esa hora debe existir hoy en S.data.fc.hourly con temperatura a menos de 1° del dato. Si dice la misma hora para las dos, sospecha.
   g) Franjas (.part): cada .part__s con texto; si hay "desde las HH:00", la hora debe caer dentro del tramo de la franja (6-13, 14-20 o 21-23). "Viento" y "Racha máx" presentes cuando hay dato.
   h) Horas: para cada tarjeta .hcard, si el icono es de agua (el código visto codigoQueSeVe(h,h.code) >= 51 para esa hora de S.data.hours) los mm deben ser > 0, salvo que la tarjeta lleve una etiqueta .nd__ojo. Cuenta las incoherencias.
   i) Mis estaciones: número de emplazamientos pintados (deben ser 20) y cuántos dicen "no se ha podido leer" (en Pages el vigilante y Euskalmet fallan: es conocido, solo anótalo).
   j) Repite c) y d) con Bermeo: localStorage torre.place = {name:'Bermeo',admin1:'Bizkaia',country:'España',lat:43.4209,lon:-2.7215,elev:36}, recarga, espera 15 s.
4. Captura (computer screenshot, scale 0.5, save_to_disk si existe) de Ahora, Horas y 10 días con Calpe, y mándaselas a Aitor con SendUserFile si la herramienta existe.
5. Termina con un parte corto en castellano, para leer en el móvil: build comprobado, lista de lo que está MAL (con texto exacto y dónde), lo que está bien en una línea, y lo conocido de Pages (CORS) aparte. Si no hay nada mal, dilo claro: "Repaso de las HH:MM: todo en orden, build X".
```

Regla que va con ello: **cada cambio se prueba también de noche** (poner la hora del sistema o mirar la app pasadas las 21:00) antes de darlo por bueno.

## 10. El cambio de fondo del 9 de septiembre: un solo camino para el cielo

Aitor, madrugada del 09-09-2026, tras cuatro semanas de «en Ahora una cosa, en 10 días otra; lo reparaba y a las 24 h vuelta a empezar»: *«esto no puede seguir así»*. Lo que se encontró y lo que se hizo (commits «Un solo camino para el cielo…» y los tres siguientes). **Es lo primero que hay que traer a casa, porque es lo que corta el problema de raíz.**

**Causas medidas en el código:**
1. El cielo se calculaba en cinco sitios con reglas distintas (Ahora, franjas, Horas, 10 días, fila Cielo de Mis estaciones).
2. `renderDays` montaba sus horas A MANO desde `fc.hourly` (sin `codigoAjeno`, sin `day`, sin `sitio`) y medía el cielo con `cieloDelDia` (nubosidad media) mientras las franjas votaban códigos.
3. **Al llegar la comparativa (`cargarComparativa`, la votación `cieloVotado` del 06-09) solo se repintaban `renderTower` y `renderNow`.** «Horas» y «10 días» se quedaban con el cielo de antes de votar hasta el siguiente pintado completo. Esta es, casi seguro, la causa principal de «cada apartado marcaba una cosa».

**Lo que hay ahora (todo en app.js):**
- `extrasDe(fc)`, `horaDe(fc, i, height, place, extra)`, `conAhora(h, fc.current)`, `buildHours` (usa horaDe) y `horasDelDia(fc, dia)`: **todas** las horas de la app salen del mismo constructor; la hora en curso lleva el código y las capas de `current`, así el icono grande de Ahora y la primera tarjeta de Horas son la misma cuenta.
- `cieloVisto(h)` → `{code, dia, txt}`: lo único que decide qué cielo se pinta y se escribe para una hora (código visto, día/noche, texto con «Velo de nubes altas» de noche).
- `tramosDeCielo(sel)` (reescrita: devuelve `{code, dia, txt, hora, desde, hasta}` por tramo; el agua es intocable en las dos direcciones y no cuenta para el tope de tres tramos) y `resumenCielo(sel)` → `{code, dia, txt, partes, iconos}`: franjas de Ahora y tarjetas de 10 días pintan **solo** con esto. Dos iconos = el primer tramo y el peor de los siguientes (dos iguales se quedan en uno).
- `iconosDelDia(dia)` es global (usa horasDelDia + resumenCielo); sin horas 6-20 usa las de noche con luna; sin horas con dato, `SIN_DIBUJO`.
- `tituloFranja`: si hay tramos, la frase es la misma línea de tiempo que los iconos («Cubierto · llovizna débil desde las 15:00 · mayormente despejado desde las 17:00»).
- `icon()` sella cada svg con `data-code` y `data-dia`; las franjas llevan `data-ini`/`data-fin` y las tarjetas de día `data-dia`.
- `cargarComparativa` repinta también `renderHours` y `renderDays` y llama a `vigilarCielo`.
- `comprobarCielo()` + `vigilarCielo(origen)` al final de `paint()` y tras la comparativa: comparan lo que hay en el DOM con lo que dicen las horas ahora mismo (icono grande vs hora en curso, primera tarjeta de Horas vs icono grande, cada franja vs sus horas, cada día vs las suyas). Si no cuadra: repinta, apunta en `torre.fallos` (donde = «cielo …») y avisa con toast; si tras repintar sigue sin cuadrar, barra roja (`Petardazo.registrar`).
- `cieloPartido()` y `cieloDelDia()` quedan sin uso (se dejaron para no romper nada; se pueden borrar en casa).

**Cómo comprobar en casa que ha quedado bien:** en la consola, `comprobarCielo()` debe devolver `[]` en Ahora, Horas y 10 días, de día y de noche; `JSON.parse(localStorage.getItem('torre.fallos')||'[]')` sin entradas «cielo»; y el icono grande de Ahora tiene que ser el mismo que la primera tarjeta de Horas (`document.querySelector('#nowIco svg').dataset.code === document.querySelector('#hlist .hcard svg').dataset.code`).

## 11. El vigilante grita igual por todo: qué arreglar en los avisos (servidor)

Aitor, 09-09-2026 00:32, con 40 avisos en un día de lluvia: *«me llegan muchos»*. Vistos en su lista de «Avisos que te han llegado» (captura). Todo esto es del servidor (`api/vigilante`, `api/avisar`, la pasada que manda las notificaciones), que vive en el proyecto de casa: **no está en la rama del portátil**.

1. **Avisa de horas ya pasadas.** «GALDAMES (hoy): racha de 71 km/h de 18h a 18h» mandado a las 20:30. Regla: un aviso solo por lo que queda por venir (hora del dato > hora de envío); lo pasado, como mucho, va al parte, no a la notificación.
2. **«De 18h a 18h», «de 05h a 05h».** Una sola hora se escribe «a las 18h».
3. **«Racha de 70 km/h. Por encima de 70 km/h».** Cuando el valor es igual al listón, decir «llega a tu listón de 70»; «por encima» solo si lo supera.
4. **Un aviso por torre y por pasada.** El mismo «el agua se adelanta: 20h pasa a 18h» llegó a las 16:00 para GERNIKA2, SANTAMAÑA y ZORNOTZA y a las 22:30 para MARKINA2 y OIZ. Regla: una notificación por pasada con todas las torres afectadas en el título («AGUA HOY · 3 torres») y en el cuerpo; y solo cuando el cambio cruza un listón (lluvia/racha/CAPE) o mueve la hora ≥ 2 h. Un adelanto de 20h a 18h sin cruzar nada es información de parte, no de aviso.
5. **Horas de silencio.** De 23:00 a 06:00 solo lo que sea rojo (racha ≥ listón NO, tormenta con CAPE ≥ 700 y tapa < 75). El resto se acumula y sale con el parte de las 06:30.

Cómo comprobarlo en casa: con lluvia general en Bizkaia, un día no debería pasar de 4-6 notificaciones (una por pasada con cambios reales), y ninguna sobre horas ya pasadas.

## 12. El listón de ráfaga que manda, y la tormenta que ve otro modelo (09-09-2026, mañana)

Aitor, con «Tu listón: 45 km/h / 60 km/h» delante: *«eso no es así»*. Y no lo era: en caseta y poste (perfil `hierro`, el 90 % de su trabajo) el veredicto mira `rafagaBestia` (70, y avisa desde 49), pero las tarjetas, los chips «⚠ ICON da 67 — tu listón es 60» y las barras de la comparativa pintaban `gustWarn`/`gustNo` (45/60), que son los de SUBIR. Ahora `listonRafaga()` (junto a `DEFAULT_THR`) devuelve el listón del perfil y lo usan todos los sitios que enseñan o colorean una ráfaga. **Ojo en casa:** la pantalla de Ajustes sigue editando `gustWarn`/`gustNo`, que solo mandan en el perfil de subir; convendría que Ajustes lo dijera o que dejara editar también `rafagaBestia`.

También del mismo repaso de pantallazos:
- `tormentaQueNoVesTu(h)`: el modelo que salta (CAPE ≥ 700 y tapa < 75) a esa hora según la comparativa. Sale como chip ámbar en la tarjeta «Tormenta» de Detalles y como fila en «Riesgo eléctrico» («⚠ GFS ve tormenta … 2320 J/kg · tapa 11 — abierta»). Antes solo lo decía la tabla de abajo («1 de 3 ven tormenta») y la tarjeta ponía «Inestabilidad baja».
- La tarjeta «Lluvia» de la ficha decía «Despejado» (código crudo) y el rótulo grande «Mayormente despejado» (votado): ahora las dos usan `cieloVisto`.
- El OJO de la ventana de trabajo dice de qué modelo es la ráfaga cuando manda la de otro («Ráfaga 62 km/h (lo ve ICON)»).
- Etiqueta «18-18 h» en 10 días → «18 h».

- **15:25, un icono por tramo, sin elegir.** Aitor: *«todos los días hay algo mal en los iconos, la interpretación»*. Pedir a uno o dos dibujos que resuman siete horas es interpretar, y cada regla para elegir «los dos» acierta un día y falla al siguiente (el 08-09 «el primero y el peor», el 09-09 a las 15:21 «el peor y el más largo»). Desde el build 1523 las franjas de Ahora (`.part__tira`) y las tarjetas de 10 días (`.dcard__ii[data-n]`) pintan TODOS los tramos de `resumenCielo(sel).partes`, cada uno con sus horas, en el mismo orden que la frase. `resumenCielo().iconos` queda sin uso. `comprobarCielo` compara con los tramos. CSS nuevo en styles.css junto a `.part__i` y `.dcard__ii`.
- **Dato vs dato:** a las 15:15 su app tenía 2,5 mm a las 07-08 del jueves y a las 15:20 el proxy ya daba 0 (cambio de pasada de AROME). Las pantallas de la app son coherentes entre sí porque leen el mismo `S.data`; entre dos aparatos pueden diferir unos minutos por la caché del CDN. No es un fallo de la app, pero conviene saberlo antes de comparar capturas.

- **17:35, rayos encima del mapa.** Aitor, con la tormenta subiendo por la costa y Windy al lado: *«los rayos encima del radar»*. En maps.js: estado `verRayos` (LS `trayos`), botón «⚡ Rayos» en la barra del reloj (`#mapRayosBtn`, index.html, visible en Mac y móvil) y en la barra de escritorio (`data-tl`), métodos `setRayos/limpiarRayos/rayosPronto/rayos()`: lee con `Rayos.leer` (app.js, el mismo lector pixel a pixel de la pestaña Rayos) las dos últimas horas publicadas por AEMET para lo que se ve en pantalla, y las pinta como capa `circle` de MapLibre (`rayosSrc`, `rayosHalo`, `rayosLayer`): rojo la última hora, ámbar la anterior, borde blanco las positivas. Se repide al mover el mapa (`rayosPronto`, 700 ms) y cada 5 min; `apply()` la vuelve a poner tras cada capa (también radar, AEMET y satélite, que salen antes del final de apply) y `open()` al abrir. El pie `#mapRayos` dice cuántas y hasta qué hora hay dato. La primera lectura tarda 20-30 s (dos PNG de toda España).

- **18:25, capa «Radar + previsión» (`radarprev`).** Aitor: *«como Windy lo ve quiero… hoy»*. En maps.js: entrada en TLAYERS (g Lluvia, `mixta:true`, `escala:'dbz'`, `v:'precipitation'` solo para que `escala()` dé la leyenda dBZ); `applyMixta()` monta `this._mixta` = fotogramas del radar observado (RainViewer, pasado + extrapolación) seguidos de las horas del modelo de reflectividad (`resolverModelo(refl)`, 24 h); `frameMixta(t)` cambia de fotograma sin rehacer la capa (radarSrc/omSrc con `setTiles` y `visibility`), y el sello dice «radar», «radar, extrapolado» o «previsión ICON-EU/AROME HD». Ganchos: `tiraObservada`, `totalPasos`, `play` (observada), `paso`, `setT` (rama propia), `apply` (rama con rayos), `omUrl(…, capa)` para forzar la escala dBZ. Abre en el último fotograma observado. El modelo es el elegido en la barra (por defecto ICON-EU; para Calpe, AROME HD).

- **Tarde y noche del 09-09 (builds 1909→2130), todo en app.js salvo CSS:** (a) `avisoTormentaFranja`: si otro modelo ve tormenta en la franja (`tormentaQueNoVesTu`), titular ámbar «⚡ Riesgo de tormenta de HH a HH (lo ve GFS)» con sus cifras y las del cargado; `rangoHoras()` para «a las / de … a … / entre … (N sueltas)» también en la frase propia y en «ambiente cargado»; `tormentaQueNoVesTu` prefiere un modelo con nombre al Automático a igual CAPE. (b) `lluviaEnLaFranjaQueNoVesTu` devuelve `cuando` (horas del modelo que más agua ve) y el chip dice «GFS y ECMWF sí (1,2 mm, de 06:00 a 10:00)»; el chip salta de línea dentro de `.part__s`. (c) «Racha máx … · a las HH» en franjas y «Racha 47 km/h a las HH» en 10 días (hora de la racha mayor de `horasDelDia`, si cuadra con el máximo diario). (d) `directo.marine` añadido: en local (sin proxy) `via('marine')` buscaba una clave inexistente y el mar salía «Invalid URL». (e) `go()` espera a `cargarComparativa` (máx 7 s) antes de `paint()`: lo primero que se pinta es el cielo votado; antes se veía un cambio de iconos a los 5 s de recargar y Aitor lo leía como «los iconos fallan otra vez».

- **21:45, build 2139: un nombre repetido pisó la pestaña Rayos dos horas, y el guardián que lo impide.** En el repaso «en frío» de la noche una prueba de bordes sacó «entre — y —» en Rayos: `rangoHoras(hs)`, la función nueva de los rangos de tormenta/lluvia («de 20:00 a 23:00»), se llamaba igual que `rangoHoras(a, b)` (app.js ~9926, la de «entre las 16:00 y las 17:00» de Rayos), y en JavaScript, con 16.000 líneas, la última declaración gana sin avisar. Renombrada a `rangoDeHoras(hs)` (4 llamadas: tres en `avisoTormentaFranja`, una en `lluviaEnLaFranjaQueNoVesTu`). Aitor: *«procurar repararlo de raíz para que no vuelva a pasar, es importante para mi trabajo»*. De raíz: el `.tools/sellar.sh` del portátil ya no sella si `node --check` falla en app.js/maps.js/sw.js ni si hay un nombre de primer nivel repetido (function/const/let/var) en app.js o maps.js. **En casa hay que meter el mismo guardián en deploy.sh (o en pruebas.js) antes del sello.** Es esto:

  ```sh
  for f in app.js maps.js sw.js; do node --check "$f" || { echo "NO PUBLICO: $f no compila"; exit 1; }; done
  for f in app.js maps.js; do
    dup=$( { grep -oE "^(async )?function [A-Za-z_\$][A-Za-z0-9_\$]*" "$f" | sed -E 's/^(async )?function //';
            grep -oE "^(const|let|var) [A-Za-z_\$][A-Za-z0-9_\$]*" "$f" | awk '{print $2}'; } | sort | uniq -d )
    [ -n "$dup" ] && { echo "NO PUBLICO: nombre repetido en $f:"; echo "$dup"; exit 1; }
  done
  ```

  Y la regla de trabajo para quien toque app.js: antes de escribir `function loQueSea(`, `grep -n "function loQueSea(" app.js`. Comprobado a 21:45 en Pages: `comprobarCielo()` → `[]`, Rayos vuelve a decir «entre las 20:00 y las 21:00», la franja dice «⚡ Riesgo de tormenta a las 21:00» y el chip de lluvia «GFS y ECMWF sí (1,2 mm, entre las 06:00 y las 13:00 (7 horas sueltas))».
