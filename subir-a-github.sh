#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  SUBIR EL ESTADO DE CASA A GITHUB (pentxa-design/meteo-aitor)
#  ─────────────────────────────────────────────────────────────────
#  Es el paso 12 de PARA-EL-DOMINGO.md hecho script: el repo de casa
#  se sube como RAMA NUEVA `casa-<fecha>`, NUNCA a main y NUNCA con
#  --force, para que el portátil parta de ahí la próxima vez.
#
#  Lo lanza Aitor a mano. `git push` está en la lista `deny` de
#  ~/.claude/settings.json A PROPÓSITO (26-08-2026, red de seguridad
#  que vale en todos los modos), así que Claude solo lo deja preparado.
#
#    ./subir-a-github.sh              → rama casa-AAAA-MM-DD (hoy)
#    ./subir-a-github.sh casa-loquesea → rama con ese nombre
#
#  Antes de subir comprueba que no hay cambios sin confirmar ni nada
#  con pinta de clave entre los ficheros seguidos.
#  OJO: el repositorio de GitHub es PÚBLICO. Todo lo seguido se ve.
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")"

RAMA="${1:-casa-$(date +%Y-%m-%d)}"
REMOTO="git@github.com:pentxa-design/meteo-aitor.git"
CLAVE="$HOME/.ssh/meteo_aitor_deploy"   # deploy key de meteo-aitor (comprobada el 15-09-2026)

case "$RAMA" in
  main|master)
    echo "✗ A main no se sube nunca (guion del domingo, paso 12)."
    exit 1;;
esac

# 1. Nada sin confirmar: lo que se sube es lo que está en git.
if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Hay cambios sin confirmar. Confírmalos antes de subir:"
  git status --short
  exit 1
fi

# 2. Ni ficheros de entorno ni claves entre lo seguido (el repo es público).
if git ls-files | grep -i -E '\.env|secret|clave|token|\.pem|id_rsa|credencial'; then
  echo "✗ Ficheros con pinta de clave entre los seguidos. NO se sube nada hasta sacarlos."
  exit 1
fi
if git grep -q -I -E 'vercel_blob_rw_[A-Za-z0-9_]{10,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' -- . ':!node_modules' ':!vendor'; then
  echo "✗ Hay algo con pinta de clave dentro de un fichero seguido. NO se sube."
  git grep -n -I -E 'vercel_blob_rw_[A-Za-z0-9_]{10,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' -- . ':!node_modules' ':!vendor' | cut -c1-120
  exit 1
fi

# 3. Remoto y clave.
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REMOTO"
if [ ! -r "$CLAVE" ]; then
  echo "✗ No está la clave $CLAVE (la deploy key de meteo-aitor)."
  exit 1
fi
export GIT_SSH_COMMAND="ssh -i $CLAVE -o IdentitiesOnly=yes"

# 4. Subir. Sin --force: si la rama ya existe y esto no desciende de ella,
#    git se niega y se mira a mano en vez de pisar nada.
echo "── Subiendo $(git rev-parse --short HEAD) ($(git log -1 --format=%s | cut -c1-70)) → origin/$RAMA ──"
git push origin "HEAD:refs/heads/$RAMA"
echo
echo "✓ Subido: https://github.com/pentxa-design/meteo-aitor/tree/$RAMA"
