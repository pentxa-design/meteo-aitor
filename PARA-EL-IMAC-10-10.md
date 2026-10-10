# Para la sesión del iMac — 10-10-2026 (desde el MacBook)

## 0. Lo primero
- `./subir-a-github.sh`: hay commits del MacBook sin subir (608c372, ba3268f, 931f706, b802c0e,
  c341a37 y el de esta nota). El MacBook sigue sin `~/.ssh/meteo_aitor_deploy`.

## 1. Publicado desde el MacBook (2026.10.10-0912)
- **Nubes del mapa en cúbica monótona**, como la lluvia (`INTERPOLACION_SUAVE` + 'nubes').
  Suyo: «nubes pixeladas… lo llevo diciendo hace mucho». La librería 0.0.20 interpola también la
  malla gaussiana de ECMWF HRES (`getInterpolatedValue` en vendor/); la nota vieja de que la
  ignoraba ya no vale. Prueba con el conjunto real, vista en rojo.

## 2. ORDEN SUYA: «Pon» ECMWF 9 km al frente del cielo — EN LAS TRES WEBS A LA VEZ
Motivo (revisiones/bermeo-06-10.md, 10-10): en Bermeo (tapado), Laredo y Bilbao (azul con velo
alto) acertó ECMWF 9 km; ECMWF 25 km dio 25-44 % en Bermeo con el cielo tapado, y AROME dio 100 %
de nube baja en Laredo y Bilbao con el cielo azul. El 05-10 ya lo dejaste escrito: «si Bermeo se
repite, el candidato es ECMWF 9 km».

No lo hice desde el MacBook porque son tres webs con reglas compartidas, y el Centro Operativo
solo se publica desde aquí:
- **app:** una fila PROPIA para el cielo (`ORDEN_CIELO = ['ecmwf_ifs', ...ORDEN_FIABLE]`) en el
  bloque del cielo de `quienLoMide()`. **NO** meter `ecmwf_ifs` en `ORDEN_FIABLE`: prestaría
  también la TAPA, y volvería la pareja CAPE de AROME + tapa de ECMWF 9 km que se quitó el 03-10.
  `medir-cobertura.cjs` lleva `['ecmwf_ifs','ECMWF 9 km']` para que `cobertura.json` lo mida.
  `cieloVotado()`: ECMWF 9 km decide cuando trae capas, y el voto queda de respaldo; la etiqueta
  dice «lo dice ECMWF 9 km» en vez de «lo votan los 5». `paridad.cjs` lee el dueño del cielo de
  `ORDEN_FIABLE`: que lea la fila del cielo.
- **reglas-tiempo.js:** `CIELO_PRESTADO` → 'ecmwf_ifs' y `sincronizar-reglas.mjs`.
- **agenda:** `lib/cielo-app.mjs` (lista de votos y pesos).
- **Centro Operativo:** `js/weather.js` (`RESPALDO.cielo`, lista de modelos), y publicarlo.
- **Antes de cambiar:** repite `revisiones/medir-nubes.mjs` contra la máscara de EUMETSAT con los
  días hasta hoy. Si ECMWF 9 km sigue por detrás del de 25 km, díselo a él antes de cambiar.

## 3. Pregunta suya sin contestar: el gris de las trazas encima de las nubes del mapa
La capa Nubes total lleva encima `sombraLluvia`, que pinta de gris oscuro 0,05-0,2 mm/h (lo pidió
él el 15-09). ICON tiene trazas por todo el mar: el mapa sale gris y con rectángulos. Visto en el
panel: sin esa capa, la nube sale blanca y limpia, como Windy. Le propuse quitar solo el gris de
las trazas y dejar el azul desde 0,2 mm/h. La prueba de pruebas.js (`slAlfa[1] > 0`, `oscuro`)
guarda su petición del 15-09: cambiarla solo con su sí.

## 4. Visto de paso
- Desde la red del MacBook, Amazon S3 (us-west-2) servía los .om a 1 KB/s («Cargando… 118 s») y
  el proxy `/omtiles` de Vercel en 1,4 s. Si le pasa en el campo, la app podría cambiar sola al
  proxy cuando S3 vaya lento (cuesta Vercel). Se lo pregunté.
