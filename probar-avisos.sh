#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  QUE LOS AVISOS AL MÓVIL FUNCIONAN DE VERDAD
#  ─────────────────────────────────────────────────────────────────
#  Existe por un fallo mío del 26-08-2026. Aitor le dio a «Activar
#  avisos» en su Android, la app dijo «ACTIVADOS» y al probar salió
#  «este aparato no está apuntado». El servidor no lo había guardado:
#  el almacén es privado y yo escribía en modo público.
#
#  Y NO LO COGÍ PORQUE PROBÉ MAL. Probé dos veces, sí, pero las dos
#  por el camino del «no»: suscripción incompleta -> 400, aparato
#  inventado -> 404. **Ni una sola vez probé que guardara.**
#
#  Suyo: «revisando 2 veces esto no pasa, automatízalo».
#
#  Esto recorre el camino del SÍ, entero, contra el sitio publicado:
#    1. da de alta un aparato con claves criptográficamente válidas
#    2. comprueba que queda guardado y que se le reconoce
#    3. le manda un aviso de verdad, firmado y cifrado
#    4. comprueba que se da de baja solo cuando el destino no existe
#
#  NO le suena el móvil: se usa `soloA`, que limita el envío al
#  aparato de mentira. Sus teléfonos no se tocan ni se borran.
# ═══════════════════════════════════════════════════════════════════
set -u
U="${U:-https://weather-app-ochre-one-76.vercel.app}"
CLAVE_F="$HOME/.claude/scheduled-tasks/vigilante-tormenta-aitor/clave-avisos.txt"
fallos=0
ok(){ printf '   ✓ %s\n' "$1"; }
no(){ printf '   ✗ %s\n      %s\n' "$1" "${2:-}"; fallos=$((fallos+1)); }

echo "▸ Avisos al móvil: el camino del SÍ"

# ── ¿ESTÁ EL ALMACÉN EN PIE? ─────────────────────────────────────────
# Puesto el 01-09-2026. Con el almacén suspendido, este guion daba las
# cuatro en rojo y el deploy gritaba «LOS AVISOS AL MÓVIL NO FUNCIONAN»
# — y era MENTIRA: su teléfono estaba apuntado por la variable
# MOVILES_EXTRA y seguía recibiendo. Es el mismo fallo que arreglamos
# hoy en las siete funciones, pero al revés: decir «no funciona» cuando
# lo que pasa es «no lo puedo comprobar por esta vía». Un aviso que
# asusta de más también es un aviso que miente, y el día que salga de
# verdad no se lo creerá.
YA=$(curl -s --max-time 30 "$U/api/suscribir" | sed -n 's/.*"aparatos":\([0-9]*\).*/\1/p')
# La sonda es `/api/torres`, que desde hoy contesta 500 cuando no puede
# leer en vez de fingir una lista vacía. Buscar la palabra «apuntado» en
# la respuesta NO servía: el mensaje de error también la lleva.
SONDA=$(curl -s --max-time 30 -o /dev/null -w '%{http_code}' "$U/api/torres")
if [ "$SONDA" != "200" ]; then
  # La fecha «hasta el 26-09» que había aquí no la respaldaba nada: el
  # CLI solo dice `Billing State: Inactive`, sin plazo. Se quitó el
  # 03-09-2026. Su regla: nada inventado, ni en un mensaje de aviso.
  echo "   ⚠ EL ALMACÉN NO CONTESTA (Vercel lo tiene en «Billing State:"
  echo "     Inactive» desde el 01-09-2026; no da fecha de vuelta)."
  if [ -n "${YA:-}" ] && [ "$YA" -ge 1 ] 2>/dev/null; then
    echo "     · NO se puede APUNTAR un móvil nuevo mientras siga así."
    if [ "$YA" = "1" ]; then
      echo "     · El móvil ya apuntado (variable MOVILES_EXTRA) SIGUE recibiendo."
    else
      echo "     · Los $YA móviles ya apuntados (MOVILES_EXTRA) SIGUEN recibiendo."
    fi
    echo "     · La firma y el cifrado no se han podido comprobar de punta a"
    echo "       punta: eso NO quiere decir que fallen, quiere decir que no se sabe."
    echo
    exit 0
  fi
  echo "     · Y NO hay ningún móvil apuntado por la variable: NADIE recibiría."
  echo
  exit 1
fi

# Un par de claves DE VERDAD: si fueran de pino, el cifrado fallaría y
# no sabríamos si el fallo es del guardado o de las claves.
EP="https://fcm.googleapis.com/fcm/send/PRUEBA-AUTOMATICA-$(date +%s)"
KEYS=$(node -e "
const c=require('crypto');const e=c.createECDH('prime256v1');e.generateKeys();
console.log(JSON.stringify({p256dh:e.getPublicKey().toString('base64url'),
                            auth:c.randomBytes(16).toString('base64url')}));")

# 1 · alta
R=$(curl -s --max-time 45 -X POST "$U/api/suscribir" -H 'Content-Type: application/json' \
     -d "{\"suscripcion\":{\"endpoint\":\"$EP\",\"keys\":$KEYS},\"apodo\":\"prueba automática\"}")
echo "$R" | grep -q '"ok":true' && ok "guarda el aparato" \
  || no "NO guarda el aparato — los avisos NO le llegarían" "$R"

# 2 · ¿queda apuntado? (si no, el guardado miente)
R2=$(curl -s --max-time 45 -X POST "$U/api/prueba-aviso" -H 'Content-Type: application/json' \
     -d "{\"endpoint\":\"$EP\"}")
echo "$R2" | grep -q 'no está apuntado' \
  && no "lo da por guardado pero luego no lo encuentra" "$R2" \
  || ok "lo reconoce después de guardarlo"

# 3 · envío de verdad: firmado y cifrado, solo a ESE aparato
if [ -r "$CLAVE_F" ]; then
  R3=$(curl -s --max-time 45 -X POST "$U/api/avisar" -H 'Content-Type: application/json' \
       -H "x-clave: $(cat "$CLAVE_F")" \
       -d "{\"titulo\":\"prueba\",\"cuerpo\":\"comprobación automática\",\"soloA\":\"$EP\"}")
  # El destino es inventado, así que Google dirá que no existe: 404/410.
  # Eso es EXACTAMENTE lo que se quiere ver — significa que la firma y el
  # cifrado los dio por buenos y solo rechazó el destinatario.
  if echo "$R3" | grep -q '"deBaja":1'; then
    ok "firma, cifra y envía (y da de baja el aparato muerto)"
  elif echo "$R3" | grep -qi 'not valid\|invalid\|curve\|VAPID'; then
    no "la firma o el cifrado NO valen" "$R3"
  else
    no "el envío no responde como debería" "$R3"
  fi
else
  no "no encuentro la clave de envío" "$CLAVE_F"
fi

# 4 · que no haya dejado basura
R4=$(curl -s --max-time 45 -X POST "$U/api/prueba-aviso" -H 'Content-Type: application/json' \
     -d "{\"endpoint\":\"$EP\"}")
echo "$R4" | grep -q 'no está apuntado' && ok "se limpia solo, no deja restos" \
  || no "el aparato de prueba se ha quedado guardado" "$R4"

echo
if [ $fallos -gt 0 ]; then
  echo "   ✗ LOS AVISOS AL MÓVIL NO FUNCIONAN. No des por hecho que le llegan."
  exit 1
fi
echo "   ✓ los avisos al móvil llegan"
