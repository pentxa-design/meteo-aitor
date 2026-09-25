#!/bin/bash
# Revisa el código antes de publicar.
#
#   ./revisar.sh
#
# Busca la clase de fallo que `node --check` NO coge: variables que se
# usan y no existen, claves repetidas, código inalcanzable. Fue lo que
# dejó pasar `ex is not defined` en la gráfica de mareas, que congeló la
# app en datos de hacía ocho horas sin avisar.
#
# La primera vez se instala ESLint solo (hace falta internet una vez).

set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$PATH"

# 1) Sintaxis
# 05-09-2026 (revisión §13): hasta hoy solo tres ficheros. La puerta
# (middleware.js), el almacén (lib/) y los ocho intermediarios de datos
# se publicaban sin que nadie los mirase.
for f in app.js maps.js sw.js middleware.js lib/*.mjs netlify/functions/*.js api/*.js api/*.mjs; do
  node --check "$f" || { echo "✗ $f: error de sintaxis"; exit 1; }
done
echo "✓ sintaxis"

# ── NOMBRES REPETIDOS DE PRIMER NIVEL (guion del domingo, §12) ─────────
# El 09-09 un rangoHoras(hs) nuevo pisó al rangoHoras(a, b) de la pestaña
# Rayos durante dos horas: en JavaScript la última declaración gana sin
# avisar. Con 16.000 líneas, esto lo mira la máquina, no la memoria.
for f in app.js maps.js; do
  dup=$( { grep -oE "^(async )?function [A-Za-z_\$][A-Za-z0-9_\$]*" "$f" | sed -E 's/^(async )?function //';
          grep -oE "^(const|let|var) [A-Za-z_\$][A-Za-z0-9_\$]*" "$f" | awk '{print $2}'; } | sort | uniq -d )
  [ -n "$dup" ] && { echo "✗ NO SE PUBLICA: nombre repetido en $f:"; echo "$dup"; exit 1; }
done
echo "✓ sin nombres repetidos de primer nivel"

# 2) Ámbitos y demás
if [ ! -x node_modules/.bin/eslint ]; then
  echo "▸ Instalando ESLint (solo la primera vez)…"
  npm install --no-audit --no-fund --silent eslint@9 >/dev/null 2>&1 \
    || { echo "⚠ No se ha podido instalar ESLint (¿sin internet?). Se publica solo con la sintaxis revisada."; exit 0; }
fi

if node_modules/.bin/eslint app.js maps.js sw.js middleware.js lib/*.mjs netlify/functions/*.js api/*.js api/*.mjs; then
  echo "✓ sin variables huérfanas ni fallos de ámbito"

  # 3) LA SEGUNDA PASADA. Pedida por Aitor el 26-08-2026: «por eso de
  #    verificar siempre 2 veces antes de publicarlo, eso automatizarlo,

# ── ABRIR LA APP DE VERDAD ────────────────────────────────────────────
# Pedido por él el 27-08-2026, después de que le saliera la banda roja dos
# veces en una mañana: «hazlo así siempre, comprobarlo antes de
# enviármelo».
#
# Monta index.html + app.js en un navegador de mentira, con datos del
# tiempo REALES, y la arranca en dos escenarios: sin cobertura y con
# cobertura. Si salta cualquier error, no se publica.
#
# Esto caza lo que no cazan los otros dos: `node --check` mira la sintaxis
# y ESLint mira los ámbitos, pero un elemento que no existe en el HTML o
# una variable usada antes de tiempo solo se ven ARRANCANDO. Los tres
# fallos que le llegaron a él ese día eran de esta clase.
echo
echo "▸ Arrancando la app…"
if node abrir.cjs; then
  :
else
  echo
  echo "✗ REVISIÓN FALLIDA — la app se rompe al arrancar. No se publica."
  exit 1
fi
  #    así se encuentran los errores». Y es verdad: ninguno de los fallos
  #    gordos de estos días era de sintaxis. Eran de criterio, y solo
  #    salieron mirando la salida caso por caso.
echo "  · nombres de los modelos del servidor"
node comprobar-modelos.cjs || exit 1

echo "  · pruebas de lo que corre en el servidor"
node pruebas-servidor.cjs || exit 1

# Se arrancan las siete funciones con el almacén roto a propósito y se
# mira qué contestan. Si alguna dice «no hay nada» cuando lo que pasa es
# que no ha podido leer, no se publica. Suyo, 01-09-2026: «siempre falla
# casi lo mismo, ¿podéis hacer que esto no pase nunca más?».
echo "  · con el almacén caído, ninguna función miente"
node prueba-almacen-caido.mjs || exit 1

# ── EL MOTOR DE RECAMBIO, ARRANCADO ──────────────────────────────────
# Puesto el 03-09-2026, el día que Vercel dejó su Blob fuera del plan
# gratuito y él dijo «no pago nada» y «déjalo montado y listo, que no
# haya errores».
#
# El almacén nuevo (Redis) se enchufa poniendo dos variables, sin
# publicar. Pero un camino que nunca se ha ejecutado no está listo: está
# escrito. Esto lo arranca contra un Upstash de mentira que contesta
# como el de verdad, para que el día que se enchufe funcione a la
# primera y no se descubra el fallo en su móvil, en el monte.
node prueba-motor.mjs || exit 1

# ── LOS AVISOS, CONTRA MAL TIEMPO DE VERDAD ──────────────────────────
# Suyo, 04-09-2026: «en 1 mes llegarán los avisos, llegarán los malos
# tiempos de lluvias etc, y si ya van con fallos… pues ala».
#
# Todo lo demás prueba el vigilante con series inventadas. Esto lo
# arranca contra sitios que TIENEN mal tiempo ahora mismo —Manila y
# Miami—, porque en Bermeo en septiembre no hay con qué probarlo: el
# CAPE no pasa de 100. Y de paso comprueba que funciona fuera de
# Euskadi, que su app la usa en Calpe, Gijón y Brasil.
node prueba-mal-tiempo.mjs || exit 1

# ── EL CANDADO, ARRANCADO ────────────────────────────────────────────
# Suyo, 04-09-2026: un código de 6 cifras que caduca cada 24 h.
# Lo que vigila esta prueba por encima de todo: **que no le deje fuera**.
# Si el candado falla, la app se abre — una pantalla negra en un cordal
# es peor que el cotilleo del que protege.
node prueba-candado.cjs || exit 1

# ── EL MAPA, QUE NO LO VIGILABA NADIE ────────────────────────────────
# Suyo, 04-09-2026, con el mapa en blanco toda la tarde:
#
#   «menos mal que te digo de revisar a diario, pero aquí el único que
#    busca fallos soy yo» · «si revisaras mapas hubieras encontrado el
#    fallo»
#
# Y tenía razón: había 1.100 pruebas corriendo aquí y NINGUNA tocaba el
# mapa. Lo encontró él a las cuatro de la tarde.
#
# Esto AVISA pero no bloquea: la cartografía la sirve Open-Meteo, y que
# su servidor esté caído no puede dejarle sin poder publicar arreglos de
# otras cosas. Lo que no puede pasar es que nadie lo mire.
# 18-09-2026: tres publicaciones seguidas paradas por el catálogo de ECMWF
# HRES de Open-Meteo contestando «{}». Lo de arriba lo decía y la línea lo
# contradecía. Avisa a gritos y sigue; lo que sí bloquea es el código.
node prueba-mapas.mjs || echo "  ⚠ EL SERVIDOR DE MAPAS DE OPEN-METEO HA FALLADO EN ALGO (mira arriba). No es nuestro código: se publica igual."

# Lo mismo pero con la RED rota, para las que leen de Open-Meteo, AEMET y
# Euskalmet — que son las que le dicen si hay rayos. Suyo, 01-09-2026:
# «esto me suena de ayer o anteayer y vuelve a fallar». Tenía razón: lo
# arreglado hasta entonces era solo el almacén.
echo "  · con la fuente caída, tampoco"
node prueba-fuente-caida.mjs 2>/dev/null || exit 1

# Las cámaras las usa para ver CON SUS OJOS si llueve o hay niebla antes de
# mandar a nadie. El 02-09-2026 la función se paraba en 40 y Donostia
# empieza en la 46: no salía ni una. Arranca la función con un doble de
# Windy —la respuesta real medida ese día— y comprueba que se pagina y que
# una lista coja no se canta como si fuera entera.
echo "  · las cámaras llegan enteras, y si no, se dice"
node prueba-webcams.mjs || exit 1

# ── LA REVISIÓN DEL 04-09 (cableado el 05-09-2026) ──────────────────
echo "  · los huecos del modelo no salen en verde; Leaflet local; RainViewer por el intermediario"
node prueba-huecos.cjs || exit 1
echo "  · el service worker: el casco que no baja se dice, y los avisos sobreviven a la versión"
node prueba-sw.cjs || exit 1
echo "  · el satélite ofrece solo horas que existen y su barra va por fotogramas"
node prueba-satelite.mjs || exit 1
echo "  · las cabeceras de caché son las de Vercel, en una sola puerta"
node prueba-cabeceras.mjs || exit 1

echo "  · la app pone el tiempo, él decide"
node sin-ordenes.cjs || exit 1

# ── EL TERCER GUARDIA ────────────────────────────────────────────────
#    Suyo, 30-08-2026: «estos arreglos que no sean de un día y luego se
#    quede cojo, que lo haga el automatismo» · «si no, un cambio y no nos
#    enteramos» · «pero eso que no haya que hacer a diario».
#
#    Tres veces se ha quedado un texto nombrando un modelo que ya no era
#    —una de ellas CINCO DÍAS—. Un propósito no es un guardia; esto sí.
echo "  · ningún modelo escrito a mano en la pantalla"
node sin-modelos-a-mano.cjs || exit 1

# ── Y NINGUNA CLASE PINTADA SIN ESTILO ───────────────────────────────
#    Cazado por él el 30-08-2026: en «10 días», las palabras «mañana» y
#    «tarde» salían MONTADAS encima de la temperatura. El marcado se
#    escribió el 28-08 y el estilo no se escribió nunca.
#
#    No lo caza node --check, ni ESLint, ni el arranque en jsdom: la app
#    no se rompe, solo se ve mal. Y una app que se ve mal en la pantalla
#    con la que decide es una app en la que se deja de confiar.
echo "  · ninguna clase pintada sin estilo"
node sin-clases-huerfanas.cjs || exit 1

# ── LA NORMA: LAS PANTALLAS SIRVEN LO MISMO ──────────────────────────
#    Suyo, 30-08-2026, tras el TERCER fallo con la misma forma: «que sea
#    de norma que no tengamos que corregir estos fallos cada día».
#
#    Los guardias de arriba conocen sus casos. Este NO: carga la app
#    entera con datos trampa y compara las dos vías —«Ahora»/«Torre» y
#    «Mis torres»— con AROME y con el Automático. Si una se descuelga de
#    la otra, salta, sea cual sea el descuido que lo cause.
#
#    Probado metiéndole los tres fallos del 30-08 uno a uno: los tres
#    hacen saltar el guardia, cada uno con su síntoma.
echo "  · las dos pantallas sirven lo mismo"
node paridad.cjs || exit 1

# ── Y LAS PANTALLAS, A LA HORA A LA QUE ÉL LAS MIRA ──────────────────
#    Suyo, 25-09-2026, con diecisiete pantallazos de las 07:13 y seis
#    fallos de pantalla dentro: «¿pero todavía seguimos teniendo
#    fallos?» · «que no vuelva a pasar, porque me suena que no es la
#    primera vez». Y no lo era: los seis tenían la misma forma —una
#    pantalla que lee la hora equivocada, un color que sale de otra
#    cosa, un texto que desmiente la fila de al lado— y las 1.276
#    pruebas estaban en verde porque ninguna miraba ESAS pantallas A
#    ESA HORA con datos en los que se notara.
#
#    Esto arranca la app entera a las 02:30, 07:30, 13:30 y 20:30 con
#    datos trampa distintos en cada hora (la mar de fondo vale 0,1 a
#    medianoche y 0,8 a las 07:00; el orto es a las 08:01…) y mira lo
#    que se pinta. Sin red y sin Vercel. Probado rompiendo cada uno de
#    los seis arreglos a propósito: los seis lo ponen en rojo.
echo "  · las pantallas dicen lo que toca a las 02, 07, 13 y 20 h"
node pantallas.cjs || exit 1

# ── Y QUE EL RESPALDO FUNCIONE DE VERDAD ─────────────────────────────
#    Suyo, 30-08-2026: «si está muerto el automatismo, ala, se queda
#    frito en la torre» · «o se cae del viento» · «o se resbala con la
#    lluvia» · «que no tengamos que corregir esto cada día».
#
#    Tira la función DE VERDAD con el modelo asignado caído del todo y
#    comprueba que otro le saca las castañas del fuego. Sin red no
#    aborta: sin internet ya se publica solo con la sintaxis revisada.
echo "  · si un modelo se cae, otro lo cubre"
node prueba-respaldo.cjs || echo "    (sin red o con fallo — mira lo de arriba)"

# ── Y QUE EL REPARTO ESTÉ MEDIDO, NO SUPUESTO ────────────────────────
#    Mide qué publica de verdad cada modelo y AVISA si algo cambió. Sale
#    con 2 cuando hay cambios: eso NO aborta la publicación —un modelo
#    que cambia no es un fallo del código— pero queda escrito en la
#    salida para que nadie se entere tarde. Con 1 —red caída— tampoco
#    aborta: sin internet ya se publica solo con la sintaxis revisada.
echo "  · quién publica cada cosa, medido hoy"
# En contexto de condición A PROPÓSITO: `set -e` mata cualquier comando
# simple que falle, así que tal cual estaba, un fallo de cobertura (red
# caída = 1, cobertura cambiada = 2) SE LLEVABA POR DELANTE TODO LO QUE
# VIENE DETRÁS — incluidas las 667 pruebas. Justo lo contrario de lo que
# dice el comentario de arriba. Cazado el 01-09-2026 en el barrido.
if node medir-cobertura.cjs --escribir; then COB=0; else COB=$?; fi
if [ $COB -eq 2 ]; then
  echo "    ⚠ HA CAMBIADO LA COBERTURA DE ALGÚN MODELO — mira lo de arriba"
fi

# ── EL RECUENTO DE pruebas.js TIENE QUE SER LO ÚLTIMO ─────────────────
# 05-09-2026: desde el 30-08 había pruebas DETRÁS del process.exit y no
# podían vetar nada. Si vuelve a pasar, aquí se para.
if ! tail -n 6 pruebas.js | grep -q 'process.exit(1)'; then
  echo "✗ pruebas.js: el recuento y el process.exit(1) no son lo último del fichero."
  echo "  Todo lo que haya detrás se imprime pero no veta. Muévelo al final."
  exit 1
fi
ULT=$(grep -n "process.exit(1)" pruebas.js | tail -1 | cut -d: -f1)
if grep -n "^\s*ok(" pruebas.js | awk -F: -v u="$ULT" '$1 > u {f=1} END {exit !f}'; then
  echo "✗ pruebas.js: hay llamadas ok( después del process.exit(1) de la línea $ULT."
  exit 1
fi
  if node pruebas.js; then
    # ── Y LAS MISMAS PRUEBAS A NUEVE HORAS DEL DÍA ─────────────────────
    #    Ver `hora-falsa.cjs`: el 28-08-2026 dos pruebas distintas
    #    fallaron el mismo día solo por la hora a la que corrían, y las
    #    dos llevaban semanas en verde. Cuesta un segundo entero.
    echo "  · y las mismas pruebas a otras horas del día"
    malas=""
    for hh in 0 3 6 9 12 15 18 21 23; do
      if ! HORA_FALSA=$hh node --require ./hora-falsa.cjs pruebas.js >/dev/null 2>&1; then
        malas="$malas $hh:30"
      fi
    done
    if [ -n "$malas" ]; then
      echo
      echo "✗ REVISIÓN FALLIDA — no se publica."
      echo "  Las pruebas pasan AHORA pero fallan a estas horas:$malas"
      echo "  Una prueba que solo falla de madrugada no avisa: engaña."
      exit 1
    fi
    echo "    ✓ verde a las 0, 3, 6, 9, 12, 15, 18, 21 y 23 h"
  else
    echo
    echo "✗ REVISIÓN FALLIDA — no se publica."
    echo "  Cada una de esas pruebas guarda un fallo que ya ocurrió de verdad."
    exit 1
  fi
else
  echo
  echo "✗ REVISIÓN FALLIDA — no se publica."
  echo "  Estos fallos no los coge 'node --check' y revientan con la app en marcha."
  exit 1
fi
