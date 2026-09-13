#!/bin/bash
# Publica la app en VERCEL.
#
#   ./deploy.sh "mensaje del cambio"
#
# POR QUÉ VERCEL Y NO NETLIFY (24-08-2026):
# Netlify suspendió el sitio entero —hasta el index.html— por agotar los
# 300 créditos del plan gratuito en TRES días. Aitor se quedó sin app
# estando de guardia, con tormenta encima. Se movió aquí, donde ya tenía
# cuenta, y de paso se quitó de en medio lo que se comía los créditos: las
# teselas del mapa ya no pasan por el servidor salvo que la red no llegue
# a Open-Meteo.
#
# El sitio viejo de Netlify vuelve solo el 20 de septiembre. No se usa.

set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$PATH"

# 0) Revisión: si el código está roto, NO se publica.
./revisar.sh
echo

BUILD="$(date +%Y.%m.%d-%H%M)"
MSG="${1:-actualización}"
URL="https://weather-app-ochre-one-76.vercel.app"

# 1) Sellar la versión, para saber de un vistazo qué tiene cargada el móvil
# Sustituye el sello ESTÉ COMO ESTÉ: la primera vez es `__BUILD__` y las
# siguientes ya es una fecha. Con el sed antiguo (solo __BUILD__) el sello
# se quedó clavado en la primera publicación de Vercel mientras
# version.json seguía subiendo, y la app se recargaba sola en bucle
# creyendo que había versión nueva. Visto en pantalla el 24-08-2026.
sed -i '' -E "s/const BUILD = '[^']*'/const BUILD = '$BUILD'/" app.js
# El nombre de la caché del service worker. OJO con el patrón: el de antes
# era `torre-[0-9.]*`, que NO casa con `torre-2026.08.27-1126` porque el
# sello lleva un GUION antes de la hora. Como no casaba, el sed no
# sustituía nada y `V` se quedó clavado en `torre-2026.08.24-1615` desde
# el 24-08-2026: cada publicación desde entonces dejó el service worker
# byte a byte idéntico, así que nunca se reinstaló ni purgó las cachés
# viejas. La app se salvó porque va a la red primero y porque
# `comprobarVersion()` borra las cachés al ver un sello nuevo — pero el
# script llevaba tres días sin hacer lo que dice que hace.
# `[^']*` coge el sello entero, guion incluido. Encontrado el 27-08-2026.
sed -i '' -E "s/const V     = 'torre-[^']*'/const V     = 'torre-$BUILD'/" sw.js
printf '{"build":"%s","fecha":"%s"}\n' "$BUILD" "$(date -u +%FT%TZ)" > version.json

echo "▸ Versión: $BUILD"
echo "▸ Cambio : $MSG"
echo

# 2) Publicar
# ── EL DEPLOY SE REINTENTA SOLO ──────────────────────────────────────
#  Tres veces la noche del 31-08-2026 el CLI de Vercel se atragantó y
#  salió con error dejando la publicación a medias — y el `| tail -3`
#  se TRAGABA el código de salida, así que el script seguía como si nada
#  y solo se descubría comprobando la versión servida a mano. Suyo:
#  «solucionar de permanente ya esos fallos».
#
#  Ahora: hasta tres intentos, el código de salida se conserva
#  (PIPESTATUS), y si los tres fallan el script ABORTA con ruido en vez
#  de dejar creer que se publicó.
PUBLICADO=0
for intento in 1 2 3; do
  # En contexto de condición: con `set -e` + `pipefail`, la tubería suelta
  # mataba el script en el primer fallo y el reintento NO llegaba a correr
  # nunca (cazado el 01-09-2026 — el arreglo de esta mañana no funcionaba).
  if vercel deploy --prod --yes 2>&1 | tail -3; then PUBLICADO=1; break; fi
  echo "   ⚠ intento $intento fallido (el CLI de Vercel se atragantó). Reintentando…"
  sleep 8
done
if [ "$PUBLICADO" -ne 1 ]; then
  echo
  echo "  ✗ NO SE HA PUBLICADO: tres intentos fallidos."
  echo "    Producción se queda como estaba. Vuelve a lanzar ./deploy.sh"
  exit 1
fi

echo
# ── ESTO NO IMPRIME: COMPRUEBA ───────────────────────────────────────
#    Lo cazó el barrido del 01-09-2026 y era exactamente lo que él
#    temía: *«que si el vercel se atasca... el tío muerto en el suelo por
#    una app llamada vercel»*.
#
#    Esto de aquí RECORRÍA los seis ficheros con curl y PINTABA el código
#    en pantalla — sin mirarlo. Y pedía /version.json para escupirlo sin
#    compararlo NUNCA con la versión recién construida, que estaba en
#    $BUILD cuatro líneas más arriba. Ninguna de esas líneas podía hacer
#    fallar el guion: la sustitución de comando dentro de un printf no la
#    caza `set -e`, y curl sin -f devuelve 0 aunque conteste un 404.
#
#    O sea: si el despliegue salía bien pero producción se quedaba en la
#    versión anterior, o /app.js daba 404, el guion lo pintaba, seguía y
#    terminaba sin un solo error. Él leía «publicado» y se quedaba con la
#    app de antes creyendo que llevaba la corrección.
#
#    Y el `sleep 4` era otra suposición: el alias de producción tarda lo
#    que tarda. Ahora se sondea hasta 90 s a que aparezca ESTA versión.
echo "▸ Comprobando lo que ha quedado publicado…"

publicado=""
for intento in $(seq 1 18); do
  publicado="$(curl -s --max-time 20 "$URL/version.json" | sed -n 's/.*"build":"\([^"]*\)".*/\1/p')"
  [ "$publicado" = "$BUILD" ] && break
  sleep 5
done

if [ "$publicado" != "$BUILD" ]; then
  echo "   ✗ PRODUCCIÓN NO SIRVE ESTA VERSIÓN."
  echo "     construida: $BUILD"
  echo "     servida   : ${publicado:-(no contesta)}"
  echo
  echo "   NO DES POR PUBLICADO NADA. La app que él abre es la de antes."
  exit 1
fi
echo "   versión servida : $publicado  ✓ es la que se acaba de construir"

falta=0
for f in /index.html /app.js /maps.js /styles.css /sw.js /version.json /vendor/leaflet/leaflet.js /vendor/leaflet/leaflet.css; do
  cod="$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "$URL$f")"
  printf "   %-16s %s%s\n" "$f" "$cod" "$([ "$cod" = 200 ] || echo '   ← MAL')"
  [ "$cod" = 200 ] || falta=1
done

cod="$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "$URL/om?api=fc&latitude=43.42&longitude=-2.72&hourly=temperature_2m")"
printf "   %-16s %s%s\n" "datos del modelo:" "$cod" "$([ "$cod" = 200 ] || echo '   ← MAL')"
[ "$cod" = 200 ] || falta=1

if [ $falta -ne 0 ]; then
  echo
  echo "   ✗ ALGO PUBLICADO NO SE SIRVE. Mira las líneas marcadas MAL."
  echo "     Una app a la que le falta un fichero puede abrir a medias y"
  echo "     enseñarle media pantalla como si estuviera entera."
  exit 1
fi
echo

# ── LOS AVISOS AL MÓVIL, EN CADA PUBLICACIÓN ─────────────────────────
# Puesto el 26-08-2026. Ese día publiqué los avisos dándolos por buenos
# después de probar DOS VECES... las dos por el camino del «no». El
# guardado estaba roto y él se enteró en su propio móvil.
# Suyo: «revisando 2 veces esto no pasa, automatízalo».
# Esto recorre el camino del «sí» entero. No le suena el teléfono.
if [ -x ./probar-avisos.sh ]; then
  U="$URL" ./probar-avisos.sh || {
    echo
    echo "   ⚠ LA APP ESTÁ PUBLICADA, PERO LOS AVISOS AL MÓVIL NO FUNCIONAN."
    echo "     No le digas que le van a llegar avisos hasta arreglarlo."
    exit 1
  }
fi
