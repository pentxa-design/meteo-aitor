#!/bin/bash
# Publica la app en Netlify.
#
#   ./deploy.sh "mensaje del cambio"
#
# Sella la fecha de compilación dentro de app.js y sube el sitio.
# El sello aparece abajo del todo en la app, para poder comprobar de un
# vistazo qué versión tiene cargada el móvil.

set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$PATH"

# 0) Revisión: si el código está roto, NO se publica.
#    Existe porque `node --check` dejó pasar una variable huérfana que
#    congeló la app en datos de hacía ocho horas sin avisar de nada.
./revisar.sh
echo

SITE_ID="12254d42-5008-40d7-bde3-8ae1ea35d38f"
BUILD="$(date +%Y.%m.%d-%H%M)"
MSG="${1:-actualización}"

# 1) Sellar la versión (sobre una copia de trabajo, sin ensuciar el fuente)
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R ./ "$TMP/site"
rm -f "$TMP/site/deploy.sh" "$TMP/site/serve.py" "$TMP/site/CLAUDE.md"
rm -rf "$TMP/site/.netlify"
# Herramientas de revisión: se quedan en casa, no se suben al sitio.
rm -f  "$TMP/site/revisar.sh" "$TMP/site/eslint.config.mjs" \
       "$TMP/site/package.json" "$TMP/site/package-lock.json"
rm -rf "$TMP/site/node_modules"

# __BUILD__ en el fuente; en la copia ya publicada queda la fecha real.
sed -i '' "s/__BUILD__/$BUILD/g" "$TMP/site/app.js"

# El service worker debe cambiar en cada publicación para que los
# navegadores se enteren de que hay versión nueva.
sed -i '' "s/const V     = 'torre-v[0-9]*'/const V     = 'torre-$BUILD'/" "$TMP/site/sw.js"

# Fichero que la app consulta para saber si hay versión nueva publicada
printf '{"build":"%s","fecha":"%s"}\n' "$BUILD" "$(date -u +%FT%TZ)" > "$TMP/site/version.json"

echo "▸ Versión: $BUILD"
echo "▸ Cambio : $MSG"
echo

# 2) Publicar
#
# `netlify deploy --prod` empezó a devolver "Forbidden" en esta cuenta,
# aunque el despliegue de borrador funciona. Así que se sube como
# borrador y después se promueve a producción por la API, que sí va.
OUT="$(netlify deploy --dir="$TMP/site" --site="$SITE_ID" --message "$BUILD · $MSG" --json 2>/dev/null)"
DEPLOY_ID="$(printf '%s' "$OUT" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("deploy_id",""))' 2>/dev/null)"

if [ -z "$DEPLOY_ID" ]; then
  echo "✗ No se ha podido subir el borrador"; printf '%s\n' "$OUT" | tail -5; exit 1
fi
echo "▸ Borrador: $DEPLOY_ID"

netlify api restoreSiteDeploy --data "{\"site_id\":\"$SITE_ID\",\"deploy_id\":\"$DEPLOY_ID\"}" >/dev/null 2>&1 \
  && echo "▸ Publicado en producción" \
  || { echo "✗ No se ha podido promover a producción"; exit 1; }

echo
echo "▸ Comprobando lo que ha quedado publicado…"
sleep 3
U="https://gilded-buttercream-25a476.netlify.app"
for f in /index.html /app.js /maps.js /styles.css /sw.js; do
  printf "   %-16s %s\n" "$f" "$(curl -s -o /dev/null -w '%{http_code}' "$U$f")"
done
echo -n "   versión servida: "
curl -s "$U/app.js" | grep -o "const BUILD = '[^']*'" | head -1
