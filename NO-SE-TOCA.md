# ESTO NO SE TOCA

> **Suyo, 01-09-2026:** *«se repara una vez y punto, y cuando se programa o
> reprograma se pone —aunque haya cambios de lo que sea— esto no se toca»*.
>
> Y el porqué, con sus palabras, que es lo que hay que leer antes de tocar
> una línea de este proyecto:
>
> *«Le digo a mi compañero: oye, sube ahora que no da agua y cambia el
> fusible… y llega allí y zasca, agua. O rayos.»*
> *«Que si el vigilante falló, eso a la mujer o a la viuda se la suda: tú has
> enviado a un tío con rayos arriba.»*

**QUÉ ES ESTE FICHERO.** La lista de decisiones que YA están reparadas y **no
pueden volver atrás**. Cada una tiene una prueba con nombre que la guarda, y
`pruebas.js` comprueba **que esa prueba sigue existiendo**. Si alguien la
borra o la renombra, el candado no publica.

**CÓMO SE AÑADE UNA.** Cuando se arregla algo que él ha sufrido: (1) se
escribe la línea aquí con su fecha; (2) se pone la prueba con ese nombre
exacto; (3) **se rompe el código a propósito y se comprueba que la prueba se
pone roja**. Si no se puede poner roja, no vale y no se apunta.

---

## LAS REGLAS QUE NO SE TOCAN

| lo que se decidió | prueba que lo guarda |
|---|---|
| El agua es de ECMWF y el cielo de ARPEGE, por acierto medido | `el modelo se sella ANTES de repartir, no después` |
| El modelo por defecto es AROME, y en un solo sitio | `el modelo se sella ANTES de repartir, no después` |
| Ninguna clave inventada sale a la red (los 10 días se quedaban vacíos) | `ninguna clave sintética sale a la red en el relleno de 10 días` |
| Un hueco JAMÁS se pinta de cero | `ningún «0,0» inventado donde no hay dato de lluvia` |
| Ninguna tarjeta anuncia agua y la niega a la vez | `NINGUNA tarjeta anuncia agua y la niega a secas a la vez (familia, no instancia)` |
| La calma de lluvia lleva dueño cuando otros ven agua | `la calma de la franja lleva dueño cuando otros ven agua` |
| «Nada te frena» dice que habla de LLEGAR, no de trabajar | `la ventana verde del parte dice que habla de LLEGAR` |
| Si otro modelo cruza su listón de racha, se dice | `salta cuando otro modelo cruza su listón y la tarjeta no` |
| Cada emplazamiento se juzga con SUS datos, no con los del abierto | `con la comparativa de OTRO sitio, no se usa (mejor sin ella que con la ajena)` |
| El sol de la mañana no se borra: el corte va donde cambia el cielo | `con sol de 8 a 10 y nubes desde las 11, el día se parte en DOS` |
| km/h siempre, nunca nudos | `ninguno va en nudos: km/h siempre, que es su norma` |
| Ningún texto manda a una pestaña que ya no existe | `ningún texto manda a una pestaña que ya no existe` |
| Nada declarado y sin llamar | `ningún método del mapa está declarado y sin llamar` |
| Todo lo que se guarda tiene quien lo lea | `todo lo que se guarda en el aparato tiene quien lo lea` |
| Una lista vacía del servidor no borra sus emplazamientos | `una lista vacía del servidor NO pisa la lista llena del aparato` |
| «No pude leer» nunca se contesta como «no hay nada» | `/api/torres no contesta «lista vacía» cuando lo que pasa es que no puede leer` |
| El aviso de tormenta funciona aunque el cargado no publique el cielo | `el cartel distingue «sin dueño» de «prestado» — EJECUTADO, no leído` |
| La altura de la nube se lee de verdad (llevaba muerta desde siempre) | `buildHours mete la altura de la nube en la hora (antes NUNCA lo hacía)` |
| Sus avisos al móvil no dependen del almacén | `hay una segunda fuente de móviles que no necesita almacén` |
| El vigilante no dice «ningún móvil apuntado» cuando no ha podido leer | `el vigilante YA NO dice «ningún móvil apuntado» cuando lo que pasa es que no puede leer` |
| Publicar no puede fallar en silencio | `el deploy reintenta hasta tres veces` |
| El tope de nube SUMA y jamás resta un aviso | `sin dato de nube NO se dice nada (el tope suma, nunca resta)` |
| **Ninguna función dice «no hay nada» cuando no ha podido leer** | `ninguna función abre el almacén a su manera (ni para leer ni para guardar)` |
| **Y nadie guarda por su cuenta: mudar el almacén se hace en un fichero** | `las opciones del almacén están en un solo sitio` |
| **Y se comprueba arrancándolas con el almacén roto, no leyendo el código** | `con el almacén caído, ninguna función miente` (prueba-almacen-caido.mjs) |
| **Sin poder comparar, el vigilante avisa por lo que HAY** | `y entonces avisa por estado absoluto, no por cambio` |
| **Con la fuente de fuera caída, ninguna función miente** | `con la fuente caída, ninguna función miente` (prueba-fuente-caida.mjs) |
| **Un fallo de carga no se lee como «ese sitio no existe»** | `un fallo de carga no se lee como «ese sitio no existe»` |
| **Con Euskalmet caído se DICE; sus estaciones de 20 m no desaparecen calladas** | `con Euskalmet caído lo DICE, no se queda vacío` (abrir.cjs) |
| **El vigilante ARRANCA: la pasada entera, no solo el pulso** | `la pasada entera del vigilante no revienta` (prueba-almacen-caido.mjs) |
| **Lo publicado se COMPRUEBA: si producción no sirve esta versión, se aborta** | `se compara la versión servida con la recién construida` |
| **Los rayos son del emplazamiento abierto, nunca del anterior** | `los rayos de otro emplazamiento NO se pintan en éste` |
| **Si no se pueden leer los rayos se DICE, no se esconde el bloque** | `si no se pueden leer los rayos, se DICE en vez de esconderse` |
| **Un estado por emplazamiento sin sello NO se da por bueno** | `y corta lo que NO lleva sello, en vez de darlo por bueno` |
| **Una medida nunca se sirve de una copia guardada** | `una medida de hace 3 h se dice de hace 3 h, no de hace 20 min` (abrir.cjs) |
| **Avisado es que haya LLEGADO: un envío fallido se reintenta** | `la tormenta solo se marca si llegó a algún aparato` |
| **TODA rama que arma la lista de torres pasa su emplazamiento** | `TODA rama que arma la lista de torres pasa su emplazamiento` |
| **El pulso dice si el vigilante está MUDO o mira otra lista** | `si está MUDO, lo dice: pasa pero no avisa` |
| **Los ajustes dicen qué listones mandan en TU perfil** | `en caseta y poste se avisa de que la ráfaga no va con sus listones` |
| **Ningún estado por emplazamiento se lee sin comprobar de quién es** | `los cuatro estados por sitio se leen SIEMPRE por la puerta` |
| **El acceso no cuenta un hueco como un cero** | `sin dato de nieve, se DICE que falta` |
| **Ningún hueco se convierte en cero a escondidas** | `todo hueco puesto a cero sobre un dato que decide está justificado` |
| **Sin humedad, el aviso de hielo sale igual** | `con el isocero pegado a la cota y SIN humedad, avisa igual del hielo` |
| **Sus listones mandan: ningún número de decisión escrito a mano** | `ningún listón suyo comparado contra un número a mano` |
| **El dueño del cielo no se compara consigo mismo** | `y el DUEÑO del cielo no se compara consigo mismo` |
| **En el mar, «Ahora» es AHORA, no el primer dato de la serie** | `la gráfica de oleaje busca la hora actual, no el primer dato` |
| **El veredicto resta el número que se ENSEÑA, no otro** | `el veredicto resta el número que se ENSEÑA, no otro` |
| **Con otros aparatos apuntados no se dice «ningún aviso»** | `con otros aparatos apuntados, no se dice «ningún aviso»` |
| **El aviso del cielo dice POR QUÉ ha saltado (abanico o descolgado)** | `si saltó porque UNO se fue a un abismo, se dice quién y qué ve` |
| **El mapa arranca en el europeo de 9 km, el de Windy** | `el mapa arranca en ICON-EU (06-09: con HRES de fábrica se recargaba a diario) y el europeo de 9 km queda a un toque` |
| **El aviso del cielo salta el 5 % de las horas, no el 65 %** | `lo de HOY: él 3 % y los otros 8-20 — se CALLA` |
| **«No contesta» y «contesta pero no lo sabe» son estados distintos** | `si está MUDO, lo dice: pasa pero no avisa` |
| **El parte dice qué emplazamientos NO ha podido mirar** | `y se dicen con su NOMBRE, no solo cuántos` |
| **El parte no dice «hoy» para otro día: nunca se compara contra texto de presentación** | `la línea de lluvia del parte NO compara contra el texto «mañana»` |
| **AEMET caído no se lee como «ninguna estación cerca»** | `la petición a AEMET mira x.ok y el error del servidor` |
| **Sin dato de lluvia o CAPE la hora dice «sin dato», nunca verde** | `con la lluvia a null la hora sale «sin dato», no verde` |
| **El semáforo cuadra con el número que se imprime (59,6 se ve 60 y es NO)** | `59,6 de ráfaga se imprime «60» y el semáforo dice NO, no ámbar` |
| **Lo que se toca para dibujar no se imprime como dato (oleaje, recuento de Avisos)** | `la pestaña Avisos cuenta las horas ANTES de recortar a seis` |
| Un fallo del servidor no borra el hilo de notas: se avisa encima y se queda lo último leído | `el hilo de notas no se borra cuando el servidor falla: se avisa encima` |
| La pestaña Mar solo dice «no estás en la costa» con un 4xx; si el modelo marino no contesta, lo dice | `la pestaña Mar distingue «aquí no hay mar» de «el modelo marino no ha contestado»` |
| El radar se vuelve a pedir al volver a la pestaña (>5 min) y sigue al sitio actual | `el radar se refresca al volver a la pestaña y sigue al sitio actual` |
| Al importar sitios, «NNN m» a secas es cota; la altura de trabajo va con h delante | `al importar, «413 m» a secas es la cota del monte, no la altura de trabajo` |
| Los rayos de la península salen aunque AEMET no dé Canarias | `los rayos de la península no caen si AEMET no da Canarias` |
| Una nota sin su hora en el modelo no se empareja con la de medianoche | `una nota sin su hora en el modelo NO se empareja con la de medianoche (campo y foto)` |
| **Un hueco de ráfaga en el perfil de caseta sin comparativa que lo rescate es SIN DATO, no verde** | `hierro con la ráfaga a null y sin comparativa: SIN DATO y dice «Ráfaga: sin dato del modelo»` (prueba-huecos.cjs) |
| **Con cualquier dato del modelo a null la hora no puede decir «Nada llega a tus listones»** | `hierro con la lluvia a null: no afirma «Nada llega a tus listones»` (prueba-huecos.cjs) |
| **Si ECMWF no rellena los días largos, se apunta el motivo y desde qué hora falta** | `si ECMWF no contesta, se apunta el motivo y DESDE QUÉ HORA falta (la 49.ª, lunes 00:00)` (prueba-huecos.cjs) |
| **«Ahora» dice qué horas no se han podido rellenar, con el modelo y el motivo** | `la nota de «Ahora» pone SIN DATO, el día y la hora desde la que falta, el modelo y el motivo` (prueba-huecos.cjs) |
| **Leaflet se sirve desde vendor/leaflet/, no desde unpkg: sin cobertura el radar arranca** | `Radar.lib() carga ./vendor/leaflet/leaflet.js y .css, no unpkg` (prueba-huecos.cjs) |
| **El catálogo de RainViewer pasa por el intermediario /om, como todo dato** | `con servidor, API.rain va por /om?api=rain` (prueba-huecos.cjs) |
| **Un 404 en el casco no bloquea la instalación del service worker** | `la instalación con un 404 en el casco NO se bloquea: acaba sin error y llama a skipWaiting` (prueba-sw.cjs) |
| **Lo que no se pudo precachear queda apuntado en ./__faltan.json y se avisa a la app** | `la lista de lo que falta queda en la caché bajo ./__faltan.json` (prueba-sw.cjs) |
| **El service worker no tira la lista de avisos recibidos al activar una versión** | `pero al activar ya NO se tira avisos-recibidos: el service worker respeta la lista (la otra puerta, comprobarVersion en app.js, va aparte)` (prueba-sw.cjs) |
| **La lista de avisos recibidos se queda en 40, el más nuevo primero** | `la lista se queda en 40: llegan 45 y quedan 40` (prueba-sw.cjs) |
| **Al renovar la suscripción con la app cerrada, la clave VAPID se pide al servidor, nunca se reutiliza la vieja** | `si el servidor no da la clave (GET /api/suscribir falla), NO se renueva con la de la suscripción vieja —si VAPID hubiera rotado sería una clave muerta` (prueba-sw.cjs) |
| **/satelite no ofrece ninguna hora futura aunque el catálogo la declare** | `con el catálogo diciendo que hay pasadas hasta dentro de 1 h, el servidor no ofrece ninguna hora futura` (prueba-satelite.mjs) |
| **La última hora del satélite se comprueba con un GetMap y si no se sirve se retira** | `si el GetMap de la última hora da 502 (como se midió), se retira y se ofrece la anterior como última` (prueba-satelite.mjs) |
| **Un PNG en blanco no es una pasada de satélite** | `un PNG en blanco (96 bytes, medido) en la última hora NO cuenta como imagen: se retira igual que un 502` (prueba-satelite.mjs) |
| **La barra del satélite va por SUS fotogramas, no por los índices del modelo** | `satélite: soltar el deslizador en la muesca 3 enseña el fotograma 3 (+45 min), no el índice 9 del modelo` (prueba-satelite.mjs) |
| **«Ahora» en satélite y en el radar de AEMET es el último fotograma observado** | `satélite: «ahora» va al último fotograma observado (11), no al nowIndex() del modelo (3)` (prueba-satelite.mjs) |
| **«Ahora» en el radar de AEMET no usa el índice del modelo** | `radar AEMET: «ahora» va al último fotograma (7), no al nowIndex() del modelo (3)` (prueba-satelite.mjs) |
| **Los TTL de caché son los que entiende Vercel, en una sola puerta (lib/cabeceras.mjs); stale-if-error se manda para las mareas, pero Vercel no promete honrarlo** | `y con siError sale con su valor (las mareas: 86400)` (prueba-cabeceras.mjs) |
| **Sin pedirlo, la puerta no manda stale-if-error** | `stale-if-error NO sale si no se pide` (prueba-cabeceras.mjs) |
| **Las teselas de reserva en Vercel (api/omtiles.js, el que corre) contestan un fallo honesto y sin cachearlo** | `omtiles api (Vercel): con la red caída contesta 5xx y DICE el fallo, no un 200 vacío` (prueba-fuente-caida.mjs) |
| **Un fallo de las teselas no se queda pegado ni en el navegador ni en el CDN** | `omtiles api (Vercel): y ese fallo no se queda cacheado, ni en el navegador ni en el CDN` (prueba-fuente-caida.mjs) |
| **Las teselas de reserva piden al S3 de Open-Meteo, no al host que desapareció del DNS** | `omtiles netlify: pide al S3 de Open-Meteo, no al map-tiles que desapareció del DNS el 04-09` (prueba-fuente-caida.mjs) |
| **Al cambiar de versión, la app no tira la caché de avisos recibidos** | `comprobarVersion() no tira la caché avisos-recibidos al cambiar de versión` (pruebas.js) |
| **La app escucha al service worker: casco incompleto y suscripción renovada** | `la app escucha precache-faltan y avisoRenovado del service worker` (pruebas.js) |
| **Al arrancar se revisa el casco mirando cada fichero en la caché, no la lista a ciegas** | `al arrancar se revisa el casco (__faltan.json) mirando cada fichero en la caché, no la lista a ciegas` (pruebas.js) |
| **El sello «cuando» del vigilante se escribe en cada pasada; el pulso no resucita en bucle** | `el sello «cuando» del vigilante se escribe en cada pasada, no una vez cada 20 h` (pruebas-servidor.cjs) |
| **Una pasada resucitada por el pulso no se repite antes de 20 min** | `una pasada resucitada por el pulso no se repite antes de 20 min` (pruebas-servidor.cjs) |
| **El vigilante dice en su respuesta si no pudo leer o guardar el estado** | `si el estado no se pudo guardar o leer, la pasada lo dice en su respuesta` (pruebas-servidor.cjs) |
| **Una sola hora en un aviso se dice «a las 18h», nunca «de 18h a 18h»** | `una sola hora se dice «a las 18h», no «de 18h a 18h»` (pruebas-servidor.cjs) |
| **El vigilante no avisa de horas ya pasadas** | `no se avisa de horas ya pasadas: un tramo de hoy que acabó antes de esta hora no es cambio` (pruebas-servidor.cjs) |
| **Con la racha igual al listón se dice «llega», «por encima» solo si lo supera** | `la racha dice «llega a tu listón» cuando iguala 70 y «por encima» solo si lo supera` (pruebas-servidor.cjs) |
| **Un aviso por pasada, con todas las torres afectadas en el título** | `un aviso por pasada con todas las torres en el título («AGUA HOY · 3 torres»)` (pruebas-servidor.cjs) |
| **No hay horas de silencio: trabaja de noche y los avisos van las 24 horas** | `no hay horas de silencio: trabaja de noche y los avisos van las 24 horas` (pruebas-servidor.cjs) |
| **Una horquilla cuyos extremos redondean igual se imprime como un solo número (viento y temperatura)** | `la horquilla de viento de la franja compara lo que se imprime, no el dato crudo` |
| **La cadencia del vigilante sube sola: verde cada 2 h, ámbar cada media, rojo cada cuarto** | `y el rojo es rayo de HOY por delante, racha de 70 por delante o tormenta ya avisada` (pruebas-servidor.cjs) |
| **El cartel del pulso dice la cadencia real del vigilante, no una vieja** | `el cartel del pulso no promete una cadencia que el vigilante ya no tiene` (pruebas-servidor.cjs) |
| **Al lado del dato seco va quién ve agua y a qué horas, aunque no llegue al listón** | `la franja dice «GFS ve algo de lluvia de 10:00 a 12:00» aunque no llegue al listón` |
| **Una franja corta con dos cielos se cuenta con su hora, no con una sola palabra** | `y la frase dice «Despejado · velo de nubes altas desde las 23:00»` |
| **La sensación compara lo que se imprime, no el dato crudo** | `la sensación compara lo que se imprime: 23° con aire a 22° dice «1° más que el aire»` |
| **Si el cielo de una franja cambia respecto a lo pintado antes, la franja lo dice con la hora y el de antes** | `si cambia el cielo, lo dice con la hora y con el de antes` |
| **Nada de parches diarios: todas las pestañas salen de la misma bajada de datos y cambian juntas** | `todas las pestañas salen de la misma bajada: franjas y 10 días leen S.data.fc` |
| **El origen de las teselas del mapa se elige por velocidad medida, no por «responde»** | `el origen de las teselas sale de una carrera entre S3 y el intermediario, con el mismo fichero` |
| **Los trozos del mapa pedidos con Range vuelven con Content-Length exacto y no se guardan en el CDN** | `omtiles api (Vercel): un trozo pedido con Range vuelve con Content-Length exacto y sin guardarse en el CDN (la librería del mapa lo exige)` (prueba-fuente-caida.mjs) |
| **Un HEAD al intermediario de teselas se reenvía como HEAD y vuelve con el tamaño del fichero** | `omtiles api (Vercel): un HEAD se reenvía como HEAD y vuelve sin cuerpo y con el Content-Length del fichero (así abre cada .om la librería)` (prueba-fuente-caida.mjs) |
| **El tamaño de cada .om del mapa llega por x-content-length: parche en vendor/ y copia en el intermediario** | `la librería del mapa acepta x-content-length si falta Content-Length al abrir un .om` |
| **El mapa pinta la capa antes de pedir números y barbas (idle, no un temporizador)** | `los números y las barbas se piden cuando el mapa ha pintado (idle), no a los 500 ms` |
| **La marca de escala propia vale para todas las escalas, mayúsculas incluidas (CAPE «capeE» salía sin color)** | `limpiarMarca quita la marca ENTERA y marcaDe devuelve el nombre ENTERO para cada escala (capeE incluida)` |
| **El calentador de capas clave no suma «trozos sin cargar»** | `el calentador de capas clave no suma «trozos sin cargar»: solo cuentan las teselas que se ven` |
| **Tres teselas a la vez en un Mac con memoria, dos en el móvil y dos siempre en HRES** | `tres teselas a la vez en un Mac con memoria, dos en el móvil y en Safari, y dos siempre con ECMWF HRES` |
| **La caché de bloques del mapa va a 256 KB × 128 (tres viajes por tesela, no once)** | `el mapa cambia la caché de bloques de la librería a 256 KB × 128 antes de la primera tesela` |
| **El mar se imprime con las unidades que da la fuente (la corriente en km/h, no «m/s»)** | `la corriente sale en km/h, que es lo que da la API marina (1,2 km/h salían como «1,2 m/s»)` |
| **Si la fuente del mar cambia una unidad, se dice en pantalla** | `y si la fuente cambia una unidad del mar, se dice en pantalla en vez de imprimirla mal` |
| **La tarjeta de 10 días dice de quién es cada cifra que no es del modelo cargado** | `y la tarjeta lo pinta: el modelo del día bajo la fecha y el de cada cifra al lado (75 % ECMWF · 0,0 mm)` |
| **El chip de agua de 10 días dice lo que ven los demás, sin repetir el número de la tarjeta** | `el chip de agua dice lo que ven LOS DEMÁS y no repite el número de la tarjeta con otro redondeo` |
| **El mapa se ve debajo del color: la costa va por encima de la capa** | `la línea de costa va por encima del color: se ve España aunque la capa lo tape todo` |
| **Donde no pasa nada (ráfaga floja, CAPE bajo) se ve el mapa** | `en Ráfagas y CAPE, donde no pasa nada se ve el mapa: el primer color es transparente y sube con el valor hasta su listón` |
| **La reflectividad va con degradado continuo** | `la reflectividad pide color_blend=true: degradado continuo, no bandas estrechas que dibujan la malla` |
| **Agua precipitable va en Lluvia, con escala propia** | `Agua precipitable está en el grupo Lluvia y con escala propia (transparente donde el aire va seco)` |
| **La presión va en bandas de 4 hPa (las isobaras de la librería no llegan)** | `la presión va en bandas de 4 hPa de 976 a 1044, que se leen como isobaras (las de la librería no llegan)` |
| **ECMWF HRES solo de cerca (zoom ≥ 6); de lejos, ECMWF 25 km y se dice** | `ECMWF HRES solo de cerca: por debajo del zoom 6 se pinta con ECMWF 25 km y se dice; desde el 6, el de 9 km` |
| **No hay capas de componentes de viento** (retiradas el 21-09-2026: la librería no sabe dar la componente norte-sur, así que las 33 barbas de la pantalla apuntaban todas del suroeste y el número era la componente por 1,41) | `las capas de barbas están retiradas y ninguna capa declara flechas` |
| **Isocero de 0 a 5500 con el rojo abajo** | `el Isocero va de 0 a 5500 m con el rojo en lo bajo (hielo cerca de la torre) y lo alto pálido` |
| **La tapa cero no se pinta** | `la tapa cero no se pinta: el color aparece solo donde hay tapa, y el pie lo dice` |
| **Las nubes van blancas con claros y GRISES con el cielo cerrado, con escala propia «nubes» (15-09-2026, «como en Windy»; 19:40, sus fotos: «nubes grises, ya no son blancas»)** | `la escala «nubes» va de transparente (0 %) a gris oscuro casi opaco (100 %): blanca con claros, gris con el cielo cerrado, y neutra, no azul` |
| **Con una capa de nubes, el suelo se pone ocre y el mar azul acero en Claro y Color** | `con una capa de nubes, el suelo se pone en tono tierra y el mar en azul acero (Claro y Color); en Oscuro no hace falta` |
| **Nubes total se oscurece donde llueve y va a azul donde llueve de verdad, casi negro con los chaparrones (15-09-2026, «como Windy»; 19:55, su Meteored: «marca agua en azul, que sería lo suyo»)** | `Nubes total lleva la lluvia encima con su propia sombra: la nube se oscurece donde llueve y va a azul donde llueve de verdad (como Meteored)` |
| **El chip «⚠ X ve llovizna» de Horas dice cuánta agua ve ese modelo a esa hora, leída de la comparativa del sitio; sin número si no ha llegado, nunca inventado (15-09-2026 23:53, «no pones cuánta ve»)** | `el chip «⚠ X ve llovizna» de Horas lleva el número al lado (mmQueVeTxt), tal cual lo publica ese modelo, 0,0 incluido` |
| **Cada hora de «Horas» dice lo que ven los demás modelos con su número: lluvia (quién y cuánta), tormenta (CAPE y tapa del que la ve) y racha a 10 m (quién da más, cruzando el listón o 20 km/h por encima). Sin comparativa del sitio, nada (16-09-2026 00:10, «si alguno ve lluvia, CAPE, etc., que lo pongáis, y si se puede cuánto»)** | `cada hora dice qué otros modelos ven lluvia y cuánta (≥ 0,1 mm y más que el dueño), sin repetir al que presta el código` |
| **Las estaciones de AEMET de «Mis estaciones» se piden en UN lote (`/estaciones?puntos=`), una descarga para los veinte sitios; sitio a sitio AEMET corta por límite de uso (16-09-2026 12:40, medido: 11 de 20 con 502)** | `la tabla de Mis estaciones pide AEMET en UN lote (?puntos=), no sitio a sitio` |
| **Los avisos oficiales de toda España solo se leen al abrir la pestaña Avisos (información); el vigilante NO los consulta ni avisa al móvil de ellos: los créditos de Vercel son para sus avisos (17-09-2026 10:35, «no me la juego», «prefiero para mis avisos»)** | `el vigilante NO consulta los avisos de España (decisión suya: los créditos son para sus avisos)` |
| **Los rayos del mapa solo se pintan en las capas de lluvia, radar, satélite y tormenta; en viento, temperatura y nubes no, aunque el botón esté encendido (17-09-2026 09:45, «no debería ser así, ¿no?»)** | `rayos() se limpia y no pinta fuera de Lluvia, Tormenta y Satélite, aunque el botón esté encendido` |
| **Los rayos del mapa van apagados de serie; solo salen si él pulsa «⚡ Rayos» (17-09-2026 10:50, «solo en rayos, del resto no; si no, no se leen los de AEMET»)** | `los rayos del mapa van APAGADOS de serie (clave nueva trayos2): solo si él pulsa el botón` |
| **El candado está APAGADO hasta nueva orden suya (17-09-2026 10:05, «quítale el código hasta que tengamos rematada la app»); el resto del candado sigue en pie y probado, y vuelve con APAGADO = false en index.html** | `con el interruptor apagado (como está ahora) la app abre sin pedir código` |
| **El chip «X da N km/h a 10 m» de las franjas mira los dos listones (aviso y no) y cuenta con todos los modelos, Automático incluido, igual que «Ahora» (17-09-2026 10:45, Ciudad del Cabo: el Automático cruzaba los 70 y la franja callaba)** | `el chip de racha de la franja mira los DOS listones (aviso y no) y cuenta con todos los modelos, el Automático incluido, como «Ahora»` |
| **El chip de lluvia de la franja también sale con el dueño mojado cuando otro modelo ve al menos 1 mm más («ven más lluvia») (17-09-2026 11:05, Génova: AROME 0,1 mm, ICON-D2 158 mm)** | `el chip de lluvia de la franja sale también con el dueño mojado si otro modelo ve al menos 1 mm MÁS («ven más lluvia»)` |
| **En 10 días, la horquilla de la MÍNIMA entre modelos también se dice, desde 5° («mínima: de 10° a 15° según el modelo») (17-09-2026 11:20, sábado en Bermeo: ECMWF 9,6 en su celda de monte, ARPEGE 15,1; él: «si es para bien, sí»)** | `la mínima también se mira: el sábado de Bermeo, de 9,6 (ECMWF) a 15,1 (Automático)` |
| **En 10 días, la horquilla de la MÁXIMA entre modelos se dice desde 4° (antes 6°; 17-09-2026 11:40, sábado en Bermeo 21,4-25,5 y el chip callado; él: «¿qué me recomiendas?» → 4°)** | `la tarjeta pinta el aviso de la máxima desde 4° de separación (17-09-2026, antes 6°)` |
| **Tocar un día en «10 días» abre ese día entero, hora a hora, con las mismas tarjetas de «Horas» (una sola plantilla, tarjetaHora); en la app y en la agenda (17-09-2026, «los de casa lo prefieren, Apple lo tiene así»)** | `al tocar una tarjeta de «10 días» se abre debajo el día entero con esas mismas tarjetas, y se cierra al volver a tocar` |
| **La comparación entre modelos de un sitio se pide a 10 días, y cada hora dice también si otro modelo ve nubes (regla de la franja): el día abierto lleva sus chips de nube, agua, racha y tormenta cualquier día (17-09-2026 12:40, «que ponga también si alguno ve nube o agua»)** | `la comparación entre modelos se pide a 10 días (antes 2): el día abierto lleva sus chips también del sábado en adelante` |
| **La capa de encima (sombra de lluvia) va ENCIMA de la nube, y la costa por encima de todas las capas propias** | `la capa de encima (sombra de lluvia) se monta ENCIMA de la nube, no debajo: justo detrás de omLayer` |

---

## Las tres guardias del «que no vuelva a pasar» (20-09-2026)

**Suyo, esa noche, después de un día entero cazando fallos:** *«no solo es
reparar esos fallos, quiero que no vuelvan a salir e invierte tiempo en
eso»* · *«no puede haber errores tontos repetitivos, no es serio»* · *«la
gente está esperando qué hacer, si subir al monte o no»*.

Ese día se arreglaron 26 fallos y **todos seguían el mismo patrón**, repetido
tres veces distintas:

1. **El arreglo existe en el fichero, unas líneas más arriba, y no se aplicó
   al hermano.** El redondeo antes de colorear se arregló el 04-09 en la rama
   de torre y NO en la de caseta, que es el 90 % de su trabajo.
   `comoEstaLaPista()` se quedó sin el `todoHueco` que sí tiene `acceso()`.
   El camino de un punto de Euskalmet distingue «no pude leer» de «no mide
   viento»; el de veinte, no.
2. **Se calcula algo para enseñarlo y no lo lee nadie.** `enTramos()` se
   escribió el 26-08 y estuvo **un mes muerto**: los avisos de agua y racha
   del vigilante seguían diciendo los extremos del día. `yoLaVeo` igual.
   `S.torresNoSeAdopto` igual, **y con una guardia encima** que pasaba porque
   solo miraba que el texto existiera en el fuente.
3. **La prueba se monta los datos a mano y nunca ejercita el cálculo real.**
   Así murió «AL FILO»: el arreglo del 30-08 lo volvió imposible y la prueba
   siguió en verde **tres semanas**.

### Lo que hay ahora, y no se quita

En `pruebas.js`, grupo **«QUE NO VUELVA A PASAR · las tres guardias de
clase»**:

| Guardia | Qué impide | La prueba que la guarda |
|---|---|---|
| **Nada muerto** | Una lista de señales que existen PARA ENSEÑARSE: `S.torresNoSeAdopto`, `capeTecho`, `tapaSuelo`, `todoHueco`, `hPico`, `tramos`, `noMirados`, `euskalmetCaido`… Si una solo se escribe y nadie la lee, la publicación se para. Y si una desaparece del código, también: una excusa huérfana es una puerta abierta. | `nada que se calcule para enseñarse se queda sin que lo lea nadie` |
| **Un solo sitio por regla** | Los listones que deciden no pueden escribirse a pelo en una comparación. El CAPE ya se recalibró una vez, de 800 a 700. | `los listones que deciden (CAPE_COMBINACION, TAPA_ROMPE, listonRafaga()) no se escriben a pelo` |
| **El banco prueba la forma real** | Las claves que devuelve el cálculo del parte tienen que estar en los datos con los que se prueba. Si el cálculo cambia y el fixture no, se para. | `S.parteTorres del banco lleva TODAS las claves que devuelve el cálculo, no la forma vieja` |

### Y el veto de rayos, que es el único que tiene (21-09-2026)

`Rayos.cerca()` se quedaba con el ÚLTIMO marco horario de AEMET con alguna
descarga. Pero el veto dura 90 minutos y los mapas van por horas cerradas, así
que la ventana vigente pisa siempre DOS marcos y solo se leía uno. Con la
tormenta alejándose —lo normal— ganaba el marco nuevo, con una descarga lejos,
y se perdían las veinticinco de encima de hace hora y cuarto: titular verde,
bloque de rayos de la ficha escondido y el veredicto sin pisar a NO APTO.
Ahora manda `loQueAunCuenta()`, que SUMA todos los marcos vigentes; fuera de la
ventana vuelve a mandar el último, que es de lo que vive el «nada desde
entonces». Y las horas que se dicen en pantalla son las MIRADAS, no las 24 del
catálogo.

| Guardia | Qué impide | La prueba que la guarda |
|---|---|---|
| **El veto es de todo lo vigente** | Que el marco nuevo, más flojo, borre al viejo que todavía cuenta. Se mueve el cálculo de verdad y después la ficha con ESE resultado, con contraprueba del fallo viejo. | `con la tormenta alejándose, las 25 descargas de encima SIGUEN contando` |
| **La ficha no se esconde sola** | Que el bloque de rayos y el veredicto se queden callados con la tormenta encima. | `y el veredicto se pisa a NO APTO por rayos` |
| **Las horas dichas son las miradas** | Decir «en las últimas 24 h» habiendo leído 6. Se corre `Rayos.cerca()` entera contra un AEMET de mentira de 24 marcos. | `se leen 6 marcos y se dicen 6, no las 24 horas del catálogo de AEMET` |

### La rama hermana que no se arregló (21-09-2026)

Cuatro fallos del mismo día, y los cuatro son el mismo patrón: **el arreglo ya
estaba escrito a unas líneas, en la función de al lado, y no se aplicó aquí.**

| Guardia | Qué impide | La prueba que la guarda |
|---|---|---|
| **La ventana es la del día que mira** | Que «Nada te frena para llegar» hable de hoy mientras la tarjeta enseña el martes. El dueño de qué día cubre el parte es `ventanaParte()`, y `S.cuandoTorres` lo ignoraba. Se mueve el cálculo real con horas de hoy y de mañana. | `y ya NO canta el verde de hoy en la pestaña de mañana` |
| **Un aviso no se borra al repintar** | Que la pintada que ENSEÑA «HA CAMBIADO desde que lo miraste» renueve la foto y se lo coma en el siguiente repintado. La regla es que la app no borra en silencio lo que ya te dijo. | `y el aviso que ya estaba en pantalla SIGUE ahí después de repintar` |
| **Dos componentes iguales no son un viento** | Que se dibuje un rumbo con la misma componente leída dos veces. MEDIDO el 21-09-2026: la librería de teselas devuelve la componente oeste-este cuando se le pide la norte-sur, así que u = v y las 33 barbas de la pantalla apuntaban todas del suroeste (225° fijo), con el globito poniendo la componente por 1,41. Se retiraron las cuatro capas de componentes, las barbas y las motas; el rumbo lo da ahora el clic, leído de la API de pronóstico. | `dos componentes IGUALES no son un viento: no se dibuja nada` |
| **«Ahora» es del modelo que pinta** | Que el botón Ahora calcule el índice en la lista del modelo elegido y lo aplique a la del que pinta. Todo lo demás del deslizador ya iba así. | `nowIndex() va por el modelo que PINTA, como el resto del deslizador` |

Y el 75 de la tapa: `TAPA_ROMPE` se creó el 20-09 «porque el 75 vivía escrito a
pelo en ocho sitios»… y se quedó usado en UNO. La guardia de un solo dueño lo
lleva en el nombre y no lo miraba. Ahora sí, y solo sobre código, no sobre
comentarios.

**COMPROBADAS ROMPIÉNDOLAS.** No se dieron por buenas: se reintrodujeron los
cuatro fallos a propósito sobre una copia, y cada uno quedó parado por al
menos una guardia. Una guardia que no puede parar nada es un adorno.

**Si alguna de estas guardias molesta, NO se quita: se arregla el código.**
