METEO AITOR · OPEN‑METEO MULTIMODELO + AVISOS AEMET

VERSIÓN v10.121 · CAPAS METEOROLÓGICAS PROFESIONALES

- Nubes blancas/grises definidas, con lluvia del mismo modelo en gris oscuro.
- Temperatura y T850 opacas, con escalas térmicas de mayor contraste.
- Lluvia y truenos usa precipitación nativa ECMWF y no inventa descargas.
- Potencial tormentoso muestra CAPE ECMWF en vez de una densidad de rayos que
  el proveedor no publica actualmente.
- Lluvia 3 h y acumulación respetan las celdas NOAA sin halos grandes.
- MUCAPE y MUCIN dejan de difuminar la malla mundial reducida.
- Temperatura del mar usa tesela espacial ECMWF de 9 km y respeta la costa.
- Radar Euskalmet conserva el último fotograma oficial útil, identificado como
  anterior cuando las ranuras recientes están vacías.
- El cursor horario responde inmediatamente y solo carga la última hora al
  soltar; no abre ni decodifica todas las horas intermedias del arrastre.
- Caché PWA renovada a v10.121.

VERSIÓN ANTERIOR

VERSIÓN v10.120 · MAPA LIMPIO FIJO Y PRECIPITACIÓN NÍTIDA

- Android e iPhone abren el visor sobre la Península a resolución regional;
  Mac conserva el encuadre europeo.
- Mapa limpio es el único fondo y permanece fijo al cambiar hora, modelo o
  variable; la tierra, el mar, las costas y las fronteras no cambian de color.
- Tierra, mar, costas y nombres permanecen visibles bajo el campo meteorológico.
- Las trazas inferiores a 0,10 mm/h son transparentes y no lavan el mapa.
- Una muestra aislada de una malla abierta no se convierte en una mancha falsa.
- Reflectividad usa una base clara limpia, con tierra y costas distinguibles
  incluso cuando no hay ecos.
- Las cifras de lluvia se ocultan en panorámica móvil para no tapar el campo.
- Se incorpora Tormentas eléctricas ECMWF con densidad real de rayos; si el
  proveedor no publica el campo, se indica claramente, no se reintenta como si
  fuera un fallo de red y no se inventan descargas.
- Mapa limpio es el único fondo y se conservan todas las capas.
- Lluvia, acumulados, nubosidad y temperatura comparten la misma cartografía;
  solo cambia el campo meteorológico superpuesto.
- En móvil se suavizan los nombres para que la cartografía no forme manchas.
- Nubosidad usa únicamente blanco y gris, sin lluvia ni reflectividad mezcladas.
- Temperatura reduce la saturación y mantiene fronteras y nombres por encima.
- Caché PWA renovada a v10.120.

VERSIÓN v10.113 · CAPAS METEOROLÓGICAS CORREGIDAS

- Se conservan las 23 capas y MUCAPE queda intacta.
- Mapa limpio es el fondo inicial; lluvia azul usa cartografía marítima neutra.
- La superficie se adapta sola por capa: reflectividad prevista usa base carbón
  y acumulados verdes conservan el mar azul limpio.
- Se elimina el recorte costero falso del norte de Galicia.
- Lluvia 3 h, acumulada, tormentas, reflectividad y presión quedan corregidas.
- Reflectividad usa verde, amarillo y naranja, con rojo/magenta únicamente en
  pequeños núcleos cuya intensidad real estimada alcanza esos dBZ.
- Nube seca blanca; nube con precipitación gris u oscura y transición costera suave.
- Temperatura y T850 usan colores vivos; MUCIN conserva el dato NOAA, usa
  marrón/rojo/naranja y solo colorea la parcela con MUCAPE convectivo mediante
  un contorno interpolado y suave, sin celdas rectangulares.
- Precipitación y reflectividad reutilizan la misma descarga y caché horaria.
- Caché PWA renovada a v10.113.

VERSIÓN v10.111 · COLORES CON RELIEVE CARTOGRÁFICO

- Las 23 capas se conservan completas, sin sustituir datos ni fuentes.
- El relieve topográfico pasa a ser el fondo inicial de los mapas y se adapta
  a cada campo: suave en nubes y radar, más definido en campos continuos.
- Fronteras, costas, nombres y valores permanecen sobre el color meteorológico.
- Nubes mantiene el mar azul, la tierra visible y núcleos oscuros únicamente
  donde el mismo modelo publica precipitación.
- Caché PWA renovada a v10.111.

VERSIÓN v10.110 · MAPAS PROFESIONALES Y CURSOR FLUIDO

- Se conservan las 23 capas existentes y sus fuentes meteorológicas reales.
- Todas las capas muestran una escala horizontal superior, paleta continua,
  valores ordenados, fronteras y nombres legibles.
- Nubosidad mantiene el mar azul y la tierra visible; cielo despejado
  transparente, nubes blancas/grises y núcleos oscuros solo con precipitación.
- La línea temporal muestra una vista rápida real al moverla y afina después
  la hora exacta sin dejar el visor bloqueado seis segundos.
- Caché PWA renovada a v10.110.

VERSIÓN v10.38 · CAPAS CON VALORES Y DATOS DEL MAR

- Viento y rachas recuperan valores, dirección, barbas y partículas sobre las teselas continuas.
- Humedad, presión, 850 hPa, nubosidad, CAPE y CIN muestran de nuevo sus valores; presión conserva isobaras reales.
- Radar AEMET nacional georreferenciado sobre el mapa claro, con contraste reforzado y radar mundial como alternativa manual.
- Nuevas capas de temperatura superficial del mar y altura de olas, con datos horarios de Open‑Meteo Marine y recorte sobre el agua.
- Caché PWA renovada a v10.38.

VERSIÓN v10.37 · LLUVIA DÉBIL MÁS VISIBLE

- Las cantidades de 0,01 a 0,2 mm/h aparecen con cian y azul algo más opacos.
- La transición entre intensidades es continua y el cero sigue transparente.
- Solo cambia la presentación; los valores de ECMWF, GFS e ICON no se alteran.
- Caché PWA renovada a v10.37.

VERSIÓN v10.36 · CAPAS METEOROLÓGICAS ESTABLES

- Nubosidad blanca o gris según precipitación, con más contraste y bordes
  continuos mediante interpolación suave.
- Viento a 10 m reparado a partir de los componentes U/V publicados por cada
  modelo; funciona con ECMWF, GFS e ICON.
- El cursor horario agrupa movimientos, conserva la hora anterior mientras
  carga y prepara la siguiente para reducir las esperas.
- Radar nacional conectado por OpenData y por el visor oficial de AEMET como
  segunda vía; no se sustituye silenciosamente por otro radar.
- Caché PWA renovada a v10.36.

VERSIÓN v10.35 · NUBOSIDAD MÓVIL SIN BLOQUEO

- El visor se desbloquea en cuanto llega la primera tesela meteorológica válida.
- En nubosidad, la capa blanca y la capa gris de lluvia continúan completándose
  sin mantener bloqueados los controles si una de ellas tarda más.
- Lluvia y las demás capas liberan los controles a los seis segundos cuando la
  red móvil va lenta; la carga y los reintentos siguen en segundo plano.
- Se conservan los reintentos reales cuando no llega ninguna tesela.
- Caché PWA renovada a v10.35.

VERSIÓN v10.34 · MINI PREVISIÓN DENTRO DE LA PORTADA

- La portada incorpora los tres días siguientes con símbolos calculados desde
  la previsión diaria real y temperaturas máxima y mínima.
- Ubicación, hora y zona horaria se reducen y permanecen en una fila compacta
  en pantallas móviles.
- Caché PWA renovada a v10.34.

VERSIÓN v10.32 · TESELAS METEOROLÓGICAS NATIVAS Y CONEXIÓN REFORZADA

- Lluvia, reflectividad estimada y nubosidad se dibujan con teselas espaciales
  nativas de Open-Meteo dentro de Aitor Meteo Maps, sin abrir Windy.
- El mismo sistema funciona con ECMWF europeo, DWD ICON y NOAA GFS. Cambiar el
  modelo cambia los datos y su resolución, pero conserva la cartografía.
- La nubosidad usa cobertura nubosa real: blanca cuando no precipita y gris
  progresivamente más oscuro donde el mismo modelo publica lluvia real.
- La reflectividad estimada adopta una escala tipo radar. Las trazas menores de
  10 dBZ son transparentes para eliminar ruido y manchas verdes débiles.
- Metadatos con tres intentos, caché de la última pasada válida, dos reintentos
  de teselas y recuperación automática cuando vuelve la conexión.
- Windy queda exclusivamente como opción secundaria manual.
- Caché PWA renovada a v10.32 e incluye localmente el motor de teselas.

VERSIÓN v10.31 · LLUVIA, REFLECTIVIDAD Y NUBES CONTINUAS

- Lluvia prevista, reflectividad estimada y nubosidad multiplican la densidad
  de puntos del modelo para fijar mejor frentes y masas sobre el mapa.
- Se elimina la textura que convertía puntos aislados en círculos verdes.
  Ahora el contorno procede de la cobertura continua de la malla geográfica.
- Lluvia y reflectividad usan niveles de color firmes y contrastados, con cero
  totalmente transparente, siguiendo el lenguaje visual del radar mundial.
- Las nubes forman masas blancas y grises continuas; la lluvia integrada
  conserva verde, amarillo, naranja, rojo y magenta según su intensidad.
- El servidor procesa la nueva malla en lotes paralelos moderados y conserva
  la caché por capa para evitar descargas repetidas.
- Caché PWA renovada a v10.31.

VERSIÓN v10.30 · TARJETAS COMPACTAS EN MÓVIL

- Los diez datos situados bajo la portada conservan dos columnas en el móvil,
  pero ahora muestran etiqueta y valor en horizontal y ocupan bastante menos alto.
- La previsión de siete días pasa a una fila compacta deslizable en pantallas
  pequeñas, sin retirar temperaturas, lluvia, viento ni el texto de la fuente.
- Las tarjetas de las próximas 24 horas reducen ancho, alto y separación solo
  en móvil. El diseño de escritorio permanece sin cambios.
- Caché PWA renovada a v10.30 para que la app instalada reciba el ajuste.

VERSIÓN v10.29 · MAPA CLARO PREDETERMINADO

- El visor abre automáticamente con «Mapa claro» como fondo inicial.
- Los fondos topográfico y oscuro continúan disponibles en el selector.

VERSIÓN v10.28 · TEMPERATURA EN TIERRA Y LLUVIA EN NUBES

- Temperatura a 2 m y 850 hPa recortadas por la línea de costa: los colores se
  muestran solo sobre tierra e islas y el mar conserva el azul cartográfico.
- La capa de nubes integra la precipitación como Windy: nube blanca y gris con
  lluvia verde, amarilla o naranja y núcleos fuertes rojos o magenta.
- Se elimina el recuadro explicativo inferior izquierdo de todos los mapas para
  despejar el visor y su línea temporal.
- La máscara terrestre Natural Earth 1:110m se incluye localmente en la app.

VERSIÓN v10.27 · NUBES CON MÁS CONTRASTE

- Las masas nubosas ganan opacidad y definición, conservando transparentes las
  zonas realmente despejadas.
- Nube alta blanca, nube media gris clara y nube baja gris más marcada.
- Cuando la malla publica precipitación en el mismo punto, la nube se oscurece
  progresivamente hasta gris oscuro para señalar claramente la nube de lluvia.

VERSIÓN v10.26 · MAR AZUL EN MAPA CLARO

- El fondo «Mapa claro» aumenta la luminosidad y saturación azul del mar para
  separarlo visualmente de la capa meteorológica.
- En nubosidad, las nubes se neutralizan hacia blanco y gris y ganan contraste
  sobre el océano azul. Los fondos topográfico y oscuro no cambian.

VERSIÓN v10.25 · GFS ESTABLE E ISLA DE IZARO

- Presión, temperatura a 850 hPa, nubosidad y CIN usan una malla inicial más
  ligera para no agotar el límite temporal de Open‑Meteo al cambiar de capa.
- Si el proxy meteorológico recibe un límite 429/502, la app repite la consulta
  directamente con una malla de emergencia todavía más ligera y conserva el
  último campo válido de esa misma variable.
- La portada sustituye la fotografía de la plataforma por una toma real de la
  Isla de Izaro. Autor: Txo; licencia CC BY-SA 3.0; crédito enlazado a Wikimedia
  Commons dentro de la propia tarjeta.

VERSIÓN v10.24 · MAPAS DIFERENCIADOS POR VARIABLE

- Precipitación y reflectividad usan una malla continental más densa y núcleos
  compactos; los puntos aislados ya no se extienden por celdas enormes.
- Temperatura a 2 m adopta una escala continua: Atlántico y aire fresco en
  azul, transición clara y calor en amarillo, naranja, rojo y granate.
- Nubosidad pasa a blanco y gris de aspecto satelital, manteniendo visibles el
  mar azul, el relieve, las costas y las fronteras.
- Los valores permanecen en temperatura, pero se ocultan a escala continental
  en lluvia y nubes para evitar rótulos engañosos.

VERSIÓN v10.23 · RESPALDO WINDY LIMPIO Y ACTUALIZACIÓN FORZADA

- Se elimina por completo el proveedor de respaldo anterior: el único respaldo
  interactivo de los mapas propios es Windy.
- Se retira el cartel inferior del respaldo para que no cubra el cursor ni las
  horas de la línea temporal de Windy.
- La app instalada fuerza la comprobación del archivo actualizado y la portada
  también se entrega sin caché, evitando que reaparezca la v10.21 guardada.

VERSIÓN v10.22 · REFLECTIVIDAD, MAR AZUL Y CAPAS VERIFICADAS

- Nueva reflectividad prevista derivada de la precipitación real de NOAA GFS
  mediante la relación meteorológica Z–R. Los valores sin precipitación son
  transparentes y la escala visible avanza de verde a amarillo, naranja, rojo
  y magenta. Se identifica siempre como estimación y no como radar observado.
- Mar azul, terreno en color, relieve, fronteras y nombres conservados bajo las
  capas. Lluvia, reflectividad, nubosidad, CAPE y CIN no pintan el mundo entero:
  solo aparecen alrededor de puntos donde existe el fenómeno.
- Corregidos los accesos de CAPE, CIN y reflectividad para seleccionar NOAA GFS
  sin saltar a humedad. CIN mantiene valores negativos reales y solo destaca
  la inhibición cuando también existe CAPE convectivo significativo.
- La última malla guardada se reutiliza únicamente para la misma capa. Si esa
  variable no está disponible, se abre el respaldo Windy correspondiente y se
  explica cuando la vista es de apoyo, por ejemplo CAPE para interpretar CIN o
  lluvia prevista para apoyar la reflectividad estimada.
- Barbas meteorológicas y partículas de viento disponen de controles separados.
  Se revisaron lluvia, reflectividad, nubes, temperatura, T850, CAPE y CIN en
  escritorio y móvil. Caché PWA renovada a v10.22.

VERSIÓN v10.21 · MAPAS METEOROLÓGICOS REHECHOS Y VERIFICADOS

- Nubosidad localizada y transparente fuera de las nubes: altas blancas,
  medias grises y bajas o densas gris oscuro, conservando terreno, costa,
  carreteras y países en color. El detalle aumenta de forma estable al ampliar.
- Lluvia y reflectividad estimada sin rectángulos ni pintura sobre zonas secas;
  la escala cambia de verde a amarillo, naranja, rojo y magenta según intensidad.
- Temperatura a 2 m y 850 hPa usan escalas vivas de frío a calor, incluyendo
  azules y cian reales en las masas frías y rojos oscuros en el calor intenso.
- Viento dibujado con barbas meteorológicas de 5, 10 y 50 nudos orientadas hacia
  su desplazamiento; CAPE y CIN conservan los valores reales publicados por GFS.
- Se ha revisado el comportamiento móvil: visor compacto, selector horizontal,
  explicaciones ocultas y leyenda retirada en pantallas pequeñas.
- Verificadas las respuestas en directo de Open‑Meteo ECMWF, GFS y Marine.
  Caché PWA renovada a v10.21 para actualizar las aplicaciones instaladas.

VERSIÓN v10.20 · GFS COSTERO Y MAR PROFESIONAL

- Bermeo mantiene Open‑Meteo como fuente base: ECMWF aporta temperatura y
  viento; GFS corrige cielo, nubosidad y sirimiri cuando detecta una diferencia
  costera importante. La interfaz identifica qué modelo está resolviendo el
  estado del cielo.
- CAPE y CIN seleccionan automáticamente GFS, que publica esas variables con
  más continuidad. ECMWF e ICON permanecen disponibles en el resto de capas.
- El relieve costero se oculta en nubosidad, lluvia, radar y punto de rocío
  para no confundir una mancha del mapa con la entrada real de nubes o
  precipitación.
- El bloque marítimo compacto muestra altura de ola, dirección, período, mar
  de fondo y temperatura superficial desde Open‑Meteo Marine.
- AEMET permanece como referencia principal de avisos oficiales; Euskalmet se
  conserva como contraste autonómico. Caché PWA renovada a v10.20.

VERSIÓN v10.19 · NUBOSIDAD VISIBLE Y COHERENTE

- Corregida la diferencia entre el porcentaje exacto de la localidad y la
  mancha de nubosidad de la malla: el punto ECMWF exacto ahora se integra de
  forma suave en el campo dibujado, sin crear cuadrados ni cortes.
- Nueva rampa de transparencia: una nubosidad del 40-55 % ya no desaparece;
  los porcentajes bajos siguen siendo tenues y el cielo realmente despejado
  continúa sin pintar.
- La opacidad representa el porcentaje total cubierto y el tono distingue la
  altura: alta blanca, media gris y baja o precipitante gris oscura.
- Open‑Meteo ECMWF sigue siendo la fuente base de Bermeo y se renueva cada
  cinco minutos cuando la app está visible. AEMET queda fijada como fuente
  principal de avisos oficiales y Euskalmet como contraste autonómico.

VERSIÓN v10.18 · MALLA COMPARTIDA PARA CAPAS DE SUPERFICIE
- Lluvia, nubosidad, temperatura, punto de rocío, humedad, viento, rachas y
  presión se descargan juntas en una única malla de Open‑Meteo.
- Tras cargar una de esas capas, cambiar entre las demás es instantáneo: no se
  repite la consulta y el mapa no queda esperando cada vez que se pulsa otra.
- Se reducen las peticiones al proveedor, los cortes por límite y el consumo
  de datos, manteniendo las capas especiales de 850 hPa, CAPE y CIN separadas.
- La compatibilidad de todos los campos compartidos se ha verificado
  directamente con el modelo europeo `ecmwf_ifs`.
- Caché PWA renovada a v10.18; la previsión de Bermeo continúa en ECMWF y la
  portada móvil conserva el diseño compacto de v10.17.

VERSIÓN v10.17 · ECMWF EN BERMEO Y PORTADA MÓVIL COMPACTA
- El tiempo actual, las próximas 24 horas y la previsión diaria de Bermeo se
  consultan siempre en Open‑Meteo fijando el modelo europeo `ecmwf_ifs`.
- Euskalmet y AEMET dejan de mezclarse con la previsión de portada. Se
  mantienen únicamente sus accesos oficiales de avisos y alertas.
- Las mareas conservan sus fuentes marítimas y su bloque plegable compacto.
- Las diez tarjetas de datos actuales reducen altura, márgenes y tipografía en
  móvil para mostrar mucha más información sin ocupar toda la pantalla.
- La caché meteorológica queda separada con la política `open-meteo-ecmwf` y
  la PWA se renueva a v10.17 para actualizar también las apps instaladas.

VERSIÓN v10.16 · BERMEO EXCLUSIVAMENTE EUSKALMET EN PORTADA
- El tiempo actual, las franjas temporales y la previsión diaria de la portada
  predeterminada de Bermeo proceden únicamente de la API oficial de Euskalmet.
- La aplicación consulta los intervalos `forecast/trends/measures` publicados
  por Euskalmet y respeta sus rangos reales, sin interpolar horas inventadas.
- Si Euskalmet no publica un campo, se muestra —. Un fallo oficial nunca activa
  Open‑Meteo en la portada ni en el avance temporal de Bermeo.
- Nueva caché exclusiva marcada `euskalmet-only`; las copias antiguas mezcladas
  quedan invalidadas y solo se reutiliza una copia oficial guardada.
- Open‑Meteo permanece en las rutas separadas de mapas y modelos para lluvia,
  viento, nubosidad, temperatura, CAPE y CIN, sin cambios en su funcionamiento.
- Caché PWA renovada a v10.16 para actualizar también las apps instaladas.

VERSIÓN v10.15 · MAPAS ESTABLES Y DETALLE AL AMPLIAR
- Lluvia, viento y nubosidad conservan la última malla válida durante el zoom,
  los desplazamientos y los fallos transitorios: el mapa ya no desaparece ni
  queda en blanco mientras espera al proveedor meteorológico.
- Las solicitudes de las capas pesadas usan una malla local optimizada, 48
  horas de previsión, caché ampliada y reintentos progresivos a 1, 2, 5 y 10
  minutos para evitar bloqueos y cortes repetidos cada pocos segundos.
- Nubosidad rediseñada siguiendo el criterio visual de las referencias: nube
  alta blanca, media gris, baja gris oscura y precipitante casi negra. Las
  zonas despejadas son transparentes y el umbral baja al ampliar el mapa.
- Lluvia prevista en verde, amarillo, naranja, rojo y magenta; radar observado
  con escala Universal Blue de RainViewer. En ambos casos el terreno queda
  visible donde no hay precipitación y el detalle aumenta con el zoom.
- CAPE y CIN «más inestable» se muestran con escalas convectivas específicas;
  los valores sin fenómeno quedan transparentes para no cubrir el mapa.
- Las barbas blancas apuntan hacia donde va el viento y codifican la fuerza con
  media raya de 5 kt, raya completa de 10 kt y triángulo de 50 kt.
- Si el proveedor de la malla propia está saturado y no existe una copia válida,
  se abre dentro del mapa el visor oficial de respaldo de Windy. Se cierra
  automáticamente cuando vuelve la malla propia y deja de consumir al cerrarlo.
- El punto consultado del modelo incorpora una X clara y también se puede
  cerrar con Escape.
- El bloque de mareas ocupa menos altura por defecto y permite desplegar u
  ocultar la previsión de tres días mediante un único botón.
- Caché PWA renovada a v10.15 para que la versión llegue a móviles instalados.

VERSIÓN v10.14 · PORTADA RESILIENTE Y EUSKALMET PRIORITARIO
- La pantalla completa, las mareas, el radar y los mapas aparecen desde el
  primer instante aunque una fuente meteorológica esté temporalmente ocupada.
- Euskalmet puede mostrar por sí solo su previsión diaria oficial de Bermeo;
  Open‑Meteo completa únicamente los campos y horas que Euskalmet no publica.
- Si falta un valor se muestra —, nunca 0 o NaN inventado.
- La última previsión válida se pinta antes de consultar la red y se conservan
  hasta ocho localidades durante 24 horas. En cuanto se muestra como guardada,
  deja de usar «Ahora» y «Hoy» y señala claramente la hora de esa copia.
- Nuevo /api/weather.js: proxy del respaldo numérico con caché CDN y copia
  reciente de emergencia, metadatos de antigüedad y una ruta directa de
  recuperación que se prueba si el proxy solo puede devolver datos antiguos.
- Bermeo usa directamente los identificadores oficiales
  basque_country/coast_zone/bermeo, evitando descargar el catálogo completo de
  Euskalmet en cada arranque en frío.
- Si solo responde Euskalmet, solo responde el respaldo numérico o llega una
  respuesta parcial, la portada se mantiene visible y reintenta la fuente que
  falta sin presentar datos guardados como recién actualizados.
- Botón fijo «↻ Actualizar tiempo» en la navegación: renueva manualmente la
  previsión y las mareas tanto en la web como en la app instalada, sin borrar
  favoritos ni ajustes. En móvil queda al principio y mantiene un área táctil
  de 44 px para que no quede oculto tras el desplazamiento horizontal.
- Ajuste específico para iPhone/iPad: márgenes seguros del notch, instrucciones
  de instalación en iOS y leyendas del mapa reducidas a cortes legibles.
- El catálogo de otras localidades de Euskadi se resuelve por zonas en paralelo,
  reconoce `nameByLang` y nunca conserva durante horas un índice incompleto.
- Reintentos espaciados a 1, 3 y 10 minutos para evitar bloquear proveedores.
- Los estados de fuente solo dicen “respaldo activo” cuando realmente hay datos.
- Caché PWA renovada a v10.14 para forzar la actualización en móviles.

VERSIÓN v10.13 · MAPAS METEOROLÓGICOS PROFESIONALES
- Lluvia, nieve, CAPE y nubosidad quedan transparentes fuera del fenómeno:
  no se colorea el mapa entero ni se muestran rectángulos de relleno.
- Nube alta blanca, media gris y baja o precipitante gris oscura, con umbral
  adaptado al zoom para mostrar más detalle local sin cubrir zonas despejadas.
- Temperatura a 2 m y 850 hPa con escala ampliada: azules y cian para masas
  frías, y amarillo, naranja, rojo, granate y casi negro para el calor intenso.
- Precipitación con lectura tipo radar: azul/cian débil, verde moderada,
  amarillo/naranja fuerte, rojo/magenta extrema y nieve en cian/azul.
- Flujo animado, barbas meteorológicas de 5/10/50 kt, isobaras reales suavizadas
  y centros H/L visibles dentro del encuadre.
- Modelos identificados y actualizados: ECMWF IFS HRES, NOAA GFS Seamless y
  DWD ICON Seamless/ICON-EU; los respaldos automáticos se marcan como tales.
- Radar mundial RainViewer georreferenciado y animado con las dos últimas horas.
  El radar AEMET se presenta aparte como imagen nacional fija, sin simular zoom.
- Mejor rendimiento móvil: lienzo limitado, caché de fotogramas, cambio de
  opacidad sin recalcular y controles temporales corregidos a velocidad 2x.
- Red más resistente: reintentos, último parte meteorológico válido y malla
  de servidor caducada como respaldo ante fallos transitorios del proveedor.
- Caché PWA renovada a v10.13 para forzar la actualización en móviles instalados.

VERSIÓN v10.12 · NAVEGACIÓN Y CONFIANZA PROFESIONAL
- Añadida una barra de accesos rápidos para ir directamente al tiempo actual,
  las mareas, la previsión de 24 horas, el radar/mapas y los avisos oficiales.
- Los estados de respaldo de Euskalmet y AEMET se comunican con un tono claro
  y profesional, sin mostrar códigos HTTP ni detalles internos en la portada.
- Caché PWA actualizada para que los dispositivos instalados reciban la versión.

VERSIÓN v10.11 · ENLACE DIRECTO A TABLA DE MAREAS DE BERMEO
- Añadido al módulo de mareas el enlace externo solicitado a TablaDeMareas Bermeo.
- La tabla interna continúa usando las fuentes oficiales de Euskalmet, Open Data Euskadi y Puerto de Bilbao.
- Conserva la pantalla única, los favoritos y las capas limpias de v10.10.

VERSIÓN v10.10 · BASE v10.9 + CAPAS LIMPIAS
- Conserva la pantalla única y los favoritos persistentes de v10.9.
- Lluvia prevista: fondo totalmente transparente donde no hay precipitación; se recortan los halos y rectángulos producidos por puntos aislados de la malla.
- Nubosidad: terreno limpio en zonas despejadas, nubes altas blancas, medias grises y bajas/densas gris oscuro; al acercar se solicita más detalle local.
- Temperatura a 850 hPa: azules y cian más visibles en las masas frescas del norte.
- Caché PWA actualizada a v10.10.

Esta versión añade /api/euskalmet.js, una función de servidor Vercel que:
- genera un JWT RS256 usando las variables privadas de Vercel;
- localiza la ciudad solicitada en la estructura región/zona/localidad de Euskalmet;
- descarga la previsión oficial disponible para hasta siete fechas;
- devuelve al navegador únicamente datos meteorológicos normalizados, nunca la clave ni el JWT.

La interfaz usa Euskalmet para las localidades de Euskadi, AEMET OpenData para el resto de España y Open-Meteo para el resto del mundo. Cuando una fuente oficial no publica algún día o campo, mantiene Open-Meteo como respaldo y lo indica.

Variables requeridas en Vercel:
- EUSKALMET_ISSUER
- EUSKALMET_EMAIL (o EUSKALMET_LOGIN_ID)
- EUSKALMET_PRIVATE_KEY
- AEMET_API_KEY

DESPLIEGUE
Arrastra este ZIP al mismo proyecto de Vercel. Cuando el despliegue esté Ready, pulsa Visit. Si el teléfono conserva una versión antigua, cierra la app instalada, abre la URL en el navegador y actualiza una vez; el nuevo service worker usa navegación network-first.

CORRECCIÓN v3:
- El botón «Abrir detalle completo de Bermeo» carga el detalle y desplaza automáticamente la pantalla hasta la sección completa.
- Se actualizó la caché para que el móvil reciba la versión nueva.


CORRECCIÓN v4:
- Añadidos en la portada botones visibles para comparar ECMWF, GFS e ICON.
- El modelo americano queda identificado correctamente como GFS.
- Los enlaces se centran automáticamente en Bermeo o en la localidad buscada.
- Corregida la función que actualiza los enlaces de modelos, que faltaba y podía bloquear la apertura del detalle.
- Caché actualizada para forzar la nueva versión en el móvil.


CORRECCIÓN v5
- Se elimina el enlace confuso a la portada técnica de Open-Meteo.
- Se añade un botón visual para comparar ECMWF, GFS e ICON en Windy para la localidad seleccionada.
- Los botones individuales abren directamente cada modelo.
- Caché actualizada a v5.


MEJORA PROFESIONAL v6
- La aplicación pasa a identificarse como «Meteo Aitor Bermeo».
- Se añade una previsión desplazable de las próximas 24 horas.
- Cada hora muestra temperatura, estado del cielo, probabilidad y cantidad de lluvia, viento, dirección, rachas, punto de rocío y humedad.
- Se incorporan el punto de rocío y la dirección del viento al detalle actual.
- Se añade un semáforo de viento: verde (flojo), amarillo (moderado), naranja (ráfagas fuertes) y rojo (ráfagas muy fuertes).
- La previsión de siete días incluye ahora la racha máxima diaria.
- Diseño y tamaños ajustados para móvil.
- Caché actualizada a v6 para que el teléfono reciba la versión nueva.


MEJORA VISUAL Y RADAR v7
- Corregido el fondo de tiempo despejado: el cielo azul claro queda visible detrás de la información.
- Se aclara también la portada principal de Bermeo cuando el cielo está despejado.
- Añadido un radar meteorológico animado dentro de la aplicación.
- El visor incluye capas seleccionables de radar de lluvia, nubes, tormentas/rayos y viento.
- La barra temporal del mapa permite avanzar hora por hora o reproducir automáticamente la evolución.
- El mapa se centra en Bermeo o en la localidad que se haya buscado.
- Se incluye un botón para abrir la capa seleccionada a pantalla completa.
- Caché actualizada a v7.


CONEXIÓN OFICIAL AEMET v8
- Añadida la función privada /api/aemet.js para consultar AEMET OpenData desde Vercel.
- La clave AEMET_API_KEY permanece únicamente en el servidor y nunca se envía al navegador.
- Para España fuera de Euskadi, la aplicación localiza el municipio de AEMET y descarga su previsión oficial diaria y horaria.
- Las horas y días procedentes de AEMET aparecen identificados con «✓ AEMET».
- Euskalmet continúa siendo la fuente prioritaria en Euskadi.
- Open-Meteo completa únicamente los campos no publicados y mantiene la cobertura mundial.
- Se conserva el cielo azul claro cuando está despejado.
- El radar y los mapas futuros pasan a Meteored/Tiempo.com: precipitación observada, lluvia y nieve, nubosidad, rayos, viento y ECMWF/IFS.
- Los visores Meteored permiten recorrer la evolución temporal y abrir el mapa a pantalla completa.
- Meteored aparece como fuente meteorológica profesional complementaria; AEMET y Euskalmet permanecen identificadas como fuentes oficiales.
- Caché actualizada a v8.


CORRECCIÓN v8.1
- Corregido el enlace del radar Meteored que podía abrir una dirección local inexistente.
- El botón abre ahora el radar nacional operativo de Meteored, desde el que se puede ampliar y centrar la zona de Bermeo.
- Revisados los enlaces de nubosidad, rayos, viento y modelos ECMWF.


MAPA AITOR v9
- Añadido el visor nativo «Mapa Aitor»: no redirige a otra web para consultar las capas principales.
- Incluye radar de reflectividad observada de AEMET dentro de la aplicación.
- Incorpora un mapa interactivo propio con capas de precipitación, nubosidad, temperatura, punto de rocío, humedad, viento, rachas, presión MSL, temperatura a 850 hPa y CAPE.
- El cursor temporal permite avanzar hora a hora o reproducir la evolución automática de las capas de previsión.
- Permite seleccionar ECMWF, ICON o GFS. Si un proveedor no expone una variable concreta, la API utiliza el modelo disponible y lo indica como fuente de la malla.
- Añadido flujo animado del viento y etiquetas de presión opcionales.
- La previsión se consulta en una malla del área que el usuario está visualizando. La ubicación buscada queda marcada en el mapa.
- /api/map-forecast.js consulta modelos de Open-Meteo en el servidor; /api/aemet-radar.js obtiene la imagen nacional de radar sin exponer AEMET_API_KEY.
- Caché actualizada a v9 para que los móviles reciban el visor nuevo.


MEJORA v9.1 · MAPA AITOR SUAVE
- Las capas de previsión se representan ahora como un campo continuo interpolado, sin bloques opacos de la malla.
- El visor conserva las fronteras, topónimos y la ubicación visibles sobre la capa meteorológica.
- Añadidas etiquetas de valores del modelo y flechas de dirección para viento y rachas; ambas se pueden activar o desactivar.
- Añadido control de intensidad de la capa para poder leer con claridad el mapa base y las variables a la vez.
- La malla se vuelve a solicitar automáticamente al ampliar, desplazar o cambiar de área para cubrir siempre el mapa visible.
- Añadida la capa CIN. La escala distingue correctamente la inhibición: valores negativos cercanos a cero implican menos freno convectivo.
- CAPE, CIN, temperatura, viento y el resto de variables se solicitan al modelo; si CIN no se publica para un modelo, el resto de capas sigue funcionando y CIN aparece como no disponible.
- Caché actualizada a v9.1 para que la versión nueva llegue también a móviles instalados.


MEJORA v9.2 · MAPA AITOR AMPLIADO
- El visor aprovecha prácticamente todo el ancho disponible de la pantalla y tiene una altura mucho mayor; incluye el botón «Mapa a pantalla completa».
- Al acercar el zoom, la malla se vuelve a solicitar con más puntos para ganar detalle local en lugar de estirar una cuadrícula continental.
- Los valores se anclan a municipios y ciudades (incluidos Bermeo, Bilbao, Gernika-Lumo, Mundaka, Lekeitio y localidades cercanas) y se recolocan al mover o ampliar el mapa.
- Paletas más vivas para temperatura, viento y rachas; la intensidad inicial sube al 68 % y puede llegar al 88 % sin perder topónimos.
- CIN conserva su interpretación meteorológica correcta: verde/amarillo próximo a cero significa menos inhibición; rojo/granate muestra una tapa más fuerte.
- Caché actualizada a v9.2 para que la mejora llegue a las aplicaciones instaladas.


MEJORA v9.3 · PENÍNSULA Y EUROPA
- La vista inicial abre a escala Península-Europa y reparte valores por zonas, no solo junto a Bermeo: España, Portugal, Francia, Reino Unido, Benelux, Alemania, Italia y Europa central.
- Ampliado el catálogo de localidades meteorológicas para que los valores del modelo aparezcan en ciudades europeas al mostrar un área amplia.
- Las consultas normales ya no solicitan CIN innecesariamente. CIN se pide únicamente al elegir esa capa: GFS, ICON y ECMWF responden con más rapidez para temperatura, presión, viento, nubosidad y precipitación.
- Si un modelo no responde, se elimina la malla antigua en vez de mostrarla como si perteneciera al nuevo modelo y se ofrece un mensaje claro para reintentar o elegir otro.
- La malla continental usa una densidad segura; la densidad aumenta al aproximar para conservar detalle local y evitar errores HTTP 502.
- Caché actualizada a v9.3.


MEJORA v9.4 · MAPA MUNDIAL
- El visor abre ahora en vista global y puede representar el campo de modelo y sus valores por todos los continentes.
- Añadido «Ver mundo» para volver en cualquier momento a la vista planetaria; el botón «Centrar en ubicación» sigue permitiendo saltar al detalle local.
- Añadidas ciudades de referencia de América, África, Asia y Oceanía para repartir las etiquetas de valor de forma legible por el mapa mundial.
- La API amplía su dominio a longitudes -180°/180° y latitudes visibles de Web Mercator, manteniendo una malla continental segura y más detalle al acercar.
- Caché actualizada a v9.4.


MEJORA v9.5 · RELIEVE TOPOGRÁFICO
- El fondo predeterminado del Mapa Aitor pasa a ser topográfico: muestra relieve sombreado, curvas de nivel y una lectura más clara de cordilleras y costas, incluso bajo las capas de previsión.
- Añadido el selector «Fondo» para elegir entre «Relieve topográfico» y «Mapa claro» sin perder la capa, los valores, el radar ni la animación que estén activos.
- El relieve usa OpenTopoMap, que combina los datos cartográficos abiertos de OpenStreetMap con sombreado y curvas de nivel de elevación; las atribuciones se muestran dentro del visor.
- Caché actualizada a v9.5.


MEJORA v9.6 · FLECHAS Y CAPAS PROFESIONALES
- El viento se representa con pequeñas flechas repartidas por todo el mapa. Cada flecha señala hacia dónde se desplaza el aire y mantiene su orientación al mover o ampliar el visor.
- La línea temporal incorpora los tres controles completos: hora anterior, reproducir/pausar y hora siguiente.
- Nubosidad renovada: las nubes altas y finas aparecen claras; las capas bajas, densas o con precipitación se oscurecen progresivamente hasta tonos casi negros.
- Temperatura a 850 hPa renovada con una paleta meteorológica viva: violetas y grises para aire frío, amarillos para valores templados y naranjas, rojos y granates para aire cálido.
- Humedad relativa renovada con una escala de alto contraste: tonos secos cálidos y grises frente a verdes, turquesas y azules para el aire húmedo.
- CIN pasa a identificarse como «CIN más inestable · menor tapa». Los tonos luminosos indican valores más próximos a cero y, por tanto, menor inhibición; los tonos oscuros representan una tapa más fuerte.
- La API solicita únicamente las variables necesarias para la capa activa. Así conserva ECMWF IFS de alta resolución en humedad, temperatura, nubosidad y viento, y usa la malla de presión apropiada solo para 850 hPa.
- El punto seleccionado se consulta de forma exacta e independiente de la malla visual. En Bermeo se verificó que la humedad de ECMWF IFS vuelve a valores costeros coherentes, sin aplicar correcciones artificiales.
- Los valores y nombres del mapa se han reforzado para conservar legibilidad al ampliar.
- Caché actualizada a v9.6 para que la mejora llegue a las aplicaciones instaladas.


MEJORA v9.7 · MAREAS OFICIALES DE EUSKALMET
- Añadido a la portada un módulo profesional de mareas para Bermeo, basado en la publicación oficial de Euskalmet para la costa vasca.
- Cada día muestra cronológicamente las horas de pleamar y bajamar junto con la altura prevista en metros.
- La bajamar posterior a medianoche permanece en la jornada marítima publicada por Euskalmet y se identifica como «día siguiente».
- La próxima marea se identifica automáticamente y queda destacada con su tipo, hora, día y altura.
- Las mareas ya pasadas se atenúan para que la lectura del siguiente evento sea inmediata.
- Todas las horas se presentan en hora oficial peninsular, tal como las publica Euskalmet.
- Añadida la función de servidor /api/euskalmet-tides.js. Consulta dos publicaciones públicas oficiales de Euskalmet en paralelo para disponer de una vía alternativa, normaliza los datos y no requiere ninguna variable nueva en Vercel.
- Incluidos estados de carga, reintento y recuperación automática al volver la conexión.
- Se mantiene visible la atribución a Euskalmet y el enlace directo a su sección oficial «La mar».
- Caché actualizada a v9.7 para que el módulo llegue también a las aplicaciones instaladas.


MEJORA v9.8 · NUEVA IDENTIDAD EGURALDI EUS
- Incorporada la nueva imagen profesional aprobada para la aplicación: San Juan de Gaztelugatxe, mar Cantábrico, sol y tormenta sobre una estética técnica azul oscuro.
- Sustituidos los iconos de instalación de Android, iPhone, iPad y escritorio en 180, 192, 512 y 1024 píxeles.
- Añadida una versión panorámica de San Juan de Gaztelugatxe en pequeño dentro de la portada principal de Bermeo.
- El nuevo icono incluye margen de seguridad para conservar su composición cuando Android o iOS aplican la máscara del dispositivo.
- Caché actualizada a v9.8 para que la imagen nueva llegue también a las aplicaciones ya instaladas.


MEJORA v9.9 · CIELO FOTOGRÁFICO REAL
- Sustituido el fondo azul plano de la portada por cuatro cielos panorámicos fotográficos inspirados en la costa cantábrica: despejado, nuboso, lluvia/tormenta y noche.
- La composición deja espacio limpio a la izquierda y en el centro para mantener perfectamente legibles la temperatura, el estado del cielo y los datos principales.
- La aplicación elige automáticamente el cielo que corresponde a los datos reales: azul y luminoso al despejar, nubes grises cuando está cubierto, cumulonimbos con cortinas de lluvia y una escena nocturna con luna y estrellas.
- Conservados los efectos de lluvia, tormenta, nieve y niebla sin tapar la información.
- Imagen optimizada en WebP para que la portada cargue con rapidez en Android, iPhone, iPad y ordenador.
- Caché actualizada a v9.9 para que el nuevo cielo llegue también a las aplicaciones ya instaladas.

CORRECCIÓN v9.10 · FOTOGRAFÍA VISIBLE EN PORTADA
-------------------------------------------------
- Corregido el orden de las capas CSS: la fotografía ya no queda oculta detrás
  del color de reserva de la tarjeta.
- El cielo fotográfico aparece tanto en la portada fija de Bermeo como en la
  portada de cualquier localidad buscada.
- Se mantienen por encima de la foto las sombras de lectura, los datos y los
  efectos de lluvia, nieve, niebla y tormenta.
- Los cuatro fondos usan nombres nuevos y la caché pasa a v9.10, evitando que
  el navegador o la app instalada reutilicen la portada azul anterior.


CORRECCIÓN FINAL v9.11 · FOTO REAL Y MAPA SIN RECUADRO
-----------------------------------------------------
- Sustituidos los fondos por fotografías panorámicas de alta resolución del cielo y el Cantábrico.
- Los archivos usan nombres v9.11 y la navegación fuerza red para impedir que Vercel/PWA reutilice la portada azul anterior.
- La capa mundial del Mapa Aitor se repite sobre las copias laterales del mundo: desaparecen los bordes verticales y el efecto de rectángulo central.
- En mapas regionales, el borde de la malla se difumina mientras se carga la siguiente zona.
- La nubosidad débil deja ver el terreno; la opacidad aumenta progresivamente con la cobertura real.


VERSIÓN v9.12 · VISOR PROFESIONAL RÁPIDO Y CANCELABLE
-----------------------------------------------------
- Rediseñado Mapa Aitor como estudio meteorológico propio: selector lateral de
  capas, escenario de mapa amplio, pantalla completa y controles adaptados a
  móvil, tableta y escritorio.
- Eliminado el bloqueo indefinido «Preparando capa…». Cada cambio cancela la
  petición anterior, dispone de límite de espera, informa del error y permite
  reintentar o cambiar de capa sin congelar la aplicación.
- La malla se ajusta al área visible y su color cubre todo el escenario, sin un
  rectángulo central. Relieve, fronteras, carreteras y nombres se vuelven a
  dibujar por encima para conservar la lectura.
- Paletas vivas y graduales para temperatura a 2 m, temperatura a 850 hPa,
  humedad, punto de rocío, viento, rachas, nubosidad, presión, CAPE y CIN.
- Humedad y demás valores proceden del punto exacto del modelo, sin correcciones
  artificiales. Al ampliar se solicita más detalle y aparecen más valores.
- Viento con bandas de intensidad, flechas pequeñas orientadas hacia el destino
  del aire y barbas visuales en los valores más fuertes.
- Nubosidad fina o alta clara; nubosidad baja, densa o precipitante oscura.
- CIN identificado como menor tapa al aproximarse a cero y CAPE como energía
  convectiva disponible, con leyendas distintas y correctas.
- Línea temporal completa: hora anterior, reproducir/pausar, hora siguiente y
  cursor horario. La representación se programa por fotogramas para mantener
  una interacción fluida.
- Cobertura desde Bermeo a España, Europa y vista mundial, con caché ligera de
  mallas y consultas limitadas a las variables necesarias para cada capa.
- Radar AEMET protegido también con límite de espera y reintento; se mantienen
  precipitación, rayos, isobaras, ECMWF/ICON/GFS, mareas de Bermeo y fuentes
  AEMET, Euskalmet, Open-Meteo y Meteored ya integradas.
- Caché PWA renovada a v9.12 y orientación libre para usar el mapa en vertical
  u horizontal en Android, iPhone, iPad y escritorio.


VERSIÓN v10.0 · AITOR METEO MAPS Y MAREAS RESILIENTES
------------------------------------------------------
- Rediseño completo del visor con una interfaz cartográfica original inspirada
  en los grandes visores meteorológicos: mapa oscuro, capas flotantes a la
  derecha, modelos en la parte inferior y línea temporal sobre el mapa.
- La vista inicial abre Europa y el Atlántico con la precipitación prevista;
  incluye accesos rápidos a Península, Bermeo y vista mundial.
- ECMWF, GFS e ICON pueden cambiarse desde botones directos. La animación
  horaria recorre ahora hasta 120 horas de previsión.
- Conserva las capas de lluvia, radar AEMET, nubes, temperatura, punto de
  rocío, humedad, viento, rachas, presión, 850 hPa, CAPE y CIN.
- Añadido radar mundial RainViewer como fuente abierta distinta: hasta dos
  horas de observaciones recientes, selección de fotograma y reproducción
  temporal directamente sobre el mapa.
- Las fuentes científicas quedan identificadas por su organismo: ECMWF IFS,
  NOAA GFS y DWD ICON. Open-Meteo se muestra como canal de distribución de la
  malla, no como autor de esos modelos.
- El fondo oscuro mantiene fronteras y topónimos por encima del campo de color,
  con flujo animado de viento y diseño adaptado a móvil y pantalla completa.
- Mareas corregidas con Open Data Euskadi como fuente oficial prioritaria. Las
  horas del XML UTC se convierten a la hora oficial de Bermeo.
- Si Euskalmet no responde, se prueban dos publicaciones oficiales adicionales
  de Open Data Euskadi antes de informar que no hay dato oficial disponible.
- Caché PWA renovada a v10.0 para evitar que Vercel o la app instalada sigan
  mostrando el visor anterior.


VERSIÓN v10.1 · MAPA ANTIBLOQUEO
--------------------------------
- Reducida la malla a una sola consulta por cambio de capa o modelo, manteniendo
  el acabado suave mediante interpolación visual.
- Los cambios rápidos se agrupan para no duplicar peticiones al proveedor.
- Si el proveedor alcanza su límite temporal, se conserva la última capa válida
  en pantalla y se inicia un reintento automático con cuenta atrás.
- Los errores por límite ya no activan modelos de respaldo que multiplicaban la
  carga, y cada capa solicita únicamente las variables que necesita.
- Caché PWA renovada a v10.1 para que Vercel sirva inmediatamente la corrección.


VERSIÓN v10.2 · RELIEVE VISIBLE Y CAPAS SIN RECUADRO
----------------------------------------------------
- El campo meteorológico se difumina progresivamente en sus bordes para evitar
  el rectángulo duro visible especialmente en temperatura.
- La malla cubre un área mayor que la pantalla y la primera consulta espera a
  que el mapa conozca su tamaño definitivo.
- El relieve topográfico pasa a ser el fondo inicial, con costas, fronteras y
  topónimos reforzados por encima de la capa meteorológica.
- La transparencia inicial se equilibra para conservar el color del modelo sin
  ocultar la geografía; el usuario puede seguir ajustándola con «Capa».
- Nubosidad rediseñada tras comparar visores profesionales: azul para claros,
  blanco hielo para nubes altas y grises azulados para capas medias y bajas.
- Temperatura equiparada visualmente a los visores de referencia: malla térmica
  de mayor definición, escala más intensa, isolíneas de 2 °C, fronteras más
  visibles y mayor densidad de valores sobre ciudades y mar.
- Temperatura se dibuja a mayor resolución para suavizar las transiciones y
  evitar dientes o bloques visibles en las isolíneas al ampliar el mapa.
- Relieve mundial reforzado también por encima de las capas, con más contraste
  en costas, países y cordilleras a cualquier escala.
- La intensidad del relieve se adapta a cada variable. Viento, rachas y campos
  continuos conservan sus colores, pero dejan visibles España, los países,
  costas, fronteras y principales formas del terreno.
- Lluvia y nubosidad quedan transparentes en las zonas sin fenómeno; el color
  aparece únicamente donde el modelo publica precipitación o cobertura nubosa.
- Caché PWA renovada a v10.2.


VERSIÓN v10.3 · DÍA/NOCHE REAL Y SIN CUADRADILLO
-------------------------------------------------
- El fondo topográfico responde a la hora seleccionada en la línea temporal:
  durante el día se muestra claro y durante la noche recupera el aspecto
  oscuro. La insignia superior confirma «Día» o «Noche».
- La nubosidad de las 14:00 se representa sobre un mapa diurno, conservando
  terreno, costas y fronteras bajo las nubes reales del modelo.
- Al mover o alejar el mapa se retira inmediatamente cualquier malla anterior
  que ya no cubra la vista completa. Así temperatura y demás capas no muestran
  el rectángulo de una consulta regional mientras esperan nuevos datos.
- Si el proveedor alcanza su límite temporal, la última capa solo se mantiene
  cuando continúa cubriendo todo el mapa visible; en caso contrario queda el
  fondo limpio hasta el reintento automático.
- Las mareas aceptan exclusivamente publicaciones oficiales. A las tres vías
  de Euskalmet/Open Data Euskadi se añade la tabla pública de la Autoridad
  Portuaria de Bilbao como respaldo abierto para Bizkaia.
- Si todas las fuentes oficiales fallan, las mareas se muestran como no
  disponibles y nunca se sustituyen por cálculos aproximados.
- Caché PWA renovada a v10.3.


VERSIÓN v10.4 · MAREAS SOLO OFICIALES
--------------------------------------
- Eliminada la estimación de respaldo de Open-Meteo Marine para las mareas.
- El módulo utiliza publicaciones oficiales de Euskalmet, Open Data Euskadi y
  la tabla pública de la Autoridad Portuaria de Bilbao para Bizkaia.
- Si las fuentes oficiales no responden, se muestra «sin dato oficial» y no se inventan horas ni alturas.
- La interfaz identifica la fuente, la fecha de publicación y la hora de consulta.
- Incluye también la corrección día/noche de nubosidad y la retirada automática
  de mallas antiguas que podían formar un recuadro al alejar temperatura.
- Caché PWA renovada a v10.4 para retirar inmediatamente la versión estimada.


VERSIÓN v10.5 · CONSULTA PROFESIONAL, RELIEVE Y CONTRASTE
----------------------------------------------------------
- Temperatura reajustada con una cobertura térmica más intensa: amarillos,
  naranjas, rojos y granates conservan el relieve, costas, fronteras y nombres
  por encima de la capa, tanto en Europa como en la vista mundial.
- Nubosidad revisada en horario diurno: azul para claros, blanco para nube alta
  y gris azulado para capas medias, bajas o precipitantes. El mapa de las 14:00
  ya no adopta el aspecto de noche.
- Lluvia transparente en las zonas sin precipitación y con contraste progresivo
  únicamente donde el modelo publica señal.
- El relieve topográfico adapta su intensidad a cada variable para evitar que
  viento, temperatura o humedad oculten países, cordilleras y líneas de costa.
- Nuevo selector meteorológico sobre el mapa: pulsa cualquier punto para ver el
  valor interpolado, capa, modelo, hora y coordenadas; el marcador se puede
  arrastrar y se actualiza al mover la línea temporal.
- La animación permite elegir 0,5×, 1× o 2×. Atajos de teclado en el visor:
  flechas para cambiar de hora, espacio para reproducir, W para viento, G para
  valores, M para cambiar de modelo y Escape para salir de pantalla completa.
- Las fuentes cartográficas identifican también el relieve OpenTopoMap.
- Caché PWA renovada a v10.5 para que Vercel y la app instalada reciban esta
  versión sin conservar los estilos anteriores.


VERSIÓN v10.6 · DATOS ANTIBLOQUEO Y MAPAS LIMPIOS POR ZOOM
-----------------------------------------------------------
- Corregido el segundo bloqueo general «Sin datos»: el navegador consulta los
  modelos directamente desde el dispositivo y conserva la función Vercel con
  caché como segunda vía. El límite compartido de otros despliegues ya no deja
  a ECMWF, GFS e ICON sin respuesta al mismo tiempo.
- Temperatura, nubosidad, lluvia, rocío, humedad, viento, rachas y presión se
  descargan juntas en una malla de superficie. Cambiar entre esas ocho capas es
  instantáneo y no genera una nueva petición al proveedor.
- Cada actualización cabe en una única consulta: 60 puntos en el mundo, 104 en
  Europa/Península y 160 al acercar. Se mantiene la interpolación suave sin las
  mallas de 308 puntos que duplicaban el consumo.
- ECMWF, NOAA GFS y DWD ICON conservan cada uno su propia malla compartida. Al
  volver a un modelo o encuadre ya consultado se utiliza la caché rápida.
- El servidor amplía la caché a treinta minutos y puede servir la última malla
  válida si el proveedor limita temporalmente la conexión secundaria.
- Lluvia y nubes aplican filtros distintos según el zoom: la vista mundial solo
  enseña señal relevante; Europa queda más limpia; España y el zoom local
  recuperan detalle para distinguir costa e interior.
- Las zonas sin lluvia o con nubosidad débil quedan transparentes. El relieve,
  países, costas, carreteras y fronteras permanecen visibles y nítidos.
- El fondo de lluvia/nubes usa un terreno neutro de mayor contraste para que no
  parezca que todo el mapa está cubierto de nubes durante el día.
- Validado con datos reales a las 14:00: ECMWF, GFS e ICON cargan sin error y el
  cambio entre capas de superficie se realiza sin nueva descarga.
- Caché PWA renovada a v10.6.


VERSIÓN v10.7 · MAPAS A COLOR, CIELOS REALES, RADAR Y CIN
-----------------------------------------------------------
- La portada selecciona automáticamente una fotografía real distinta para
  cielo soleado, pocas nubes, cielo cubierto, lluvia fina y lluvia fuerte.
  La imagen nocturna permanece separada para representar correctamente la noche.
- Cada fotografía muestra su autor y licencia mediante un enlace visible. Las
  cinco imágenes diurnas proceden de Wikimedia Commons con licencias abiertas:
  Wolfmann (CC BY-SA 4.0), GWLincs (CC BY-SA 4.0), Txo
  (CC BY-SA 3.0), Jam Mudasir (CC BY 3.0) y Jose Ignacio Martinez Navarro
  (CC BY-SA 3.0).
- Precipitación reforzada con azul, cian, verde, amarillo, naranja, magenta y
  violeta. Las zonas secas permanecen transparentes y al acercar el mapa se
  recupera detalle sin ocultar costas, fronteras ni relieve.
- El fondo de lluvia, nubosidad y radar vuelve a ser topográfico y a color;
  desaparece el aspecto general en blanco y negro.
- La nubosidad diferencia nube alta blanca, nube media gris y nube baja u
  oscura, dejando visible el terreno en las zonas despejadas.
- Temperatura a 850 hPa amplía la gama fría azul y cian antes de pasar a verdes,
  amarillos y rojos.
- CIN usa automáticamente NOAA GFS, que publica este campo, y lo identifica en
  pantalla para evitar mostrar una capa vacía con modelos que no lo ofrecen.
- El radar AEMET cambia automáticamente al radar mundial RainViewer cuando la
  fuente nacional no responde. El radar mundial conserva los colores de la
  reflectividad y se apoya sobre un mapa topográfico a color.
- Caché PWA renovada a v10.7 para que Vercel y la aplicación instalada reciban
  las nuevas fotografías, paletas y correcciones sin conservar v10.6.

CORRECCIÓN v10.8 · FAVORITOS Y PORTADA ÚNICA
---------------------------------------------
- El botón «Guardar» usa un control de pulsación fiable para móvil, confirma
  visualmente la acción y pasa a «★ Guardada» al instante.
- Las ciudades guardadas aparecen debajo del buscador; se abren con un toque y
  pueden eliminarse pulsando de nuevo la estrella de la localidad activa.
- El guardado se conserva en el dispositivo. Si el navegador bloquea el
  almacenamiento permanente, la aplicación informa de ello y conserva la
  selección durante la sesión, sin aparentar que ha fallado.
- La aplicación carga ya en una única portada continua: ciudad, búsqueda,
  previsión, radar, viento y el resto de capas se usan en la misma página. El
  botón superior baja directamente al mapa; ya no abre un detalle separado.
- Se conservan íntegramente los mapas a color, los cielos reales, radar,
  RainViewer, las capas de modelos, las flechas de viento y CIN de v10.7.
- Caché PWA renovada a v10.8.

CORRECCIÓN v10.9 · UNA SOLA PANTALLA REAL
------------------------------------------
- Retirada de la vista de Bermeo que duplicaba la información meteorológica.
- El buscador abre la única tarjeta principal y actualiza desde allí la ciudad,
  la previsión, mareas, radar, viento, lluvia, temperatura, modelos y CIN.
- Las mareas siguen disponibles dentro de la misma página, bajo la tarjeta
  meteorológica, sin crear una segunda portada.
- Favoritos comprobados con ciclo completo: guardar, mostrar «★ Guardada»,
  abrir desde la lista, eliminar y conservar la selección en el dispositivo.
- Caché PWA renovada a v10.9 para expulsar las pantallas antiguas del móvil.

CRÉDITOS DE LAS FOTOGRAFÍAS REALES
-----------------------------------
- Soleado: Wolfmann · CC BY-SA 4.0
  https://commons.wikimedia.org/wiki/File:TJ%C3%98ME_Skr%C3%A5levika_%C3%98vre_Barkevik_T%C3%B8nsbergfjorden_Norway_Beach_pebbles_blue_sky_Forest_(Rullesteinsstrand,_svaberg,_sol,_v%C3%A5rskog,_tr%C3%A6r,_granitt,_t%C3%B8rt_gress,_motlys)_Distorted_panorama_2021-03-30_IMG_6397.jpg
- Pocas nubes: GWLincs · CC BY-SA 4.0
  https://commons.wikimedia.org/wiki/File:Filey-Muston-Sands-2025-08-31.PANO.jpg
- Cubierto: Txo · Isla de Izaro · CC BY-SA 3.0
  https://commons.wikimedia.org/wiki/File:Isla_de_Izaro_1.JPG
- Lluvia fina: Jam Mudasir · CC BY 3.0
  https://commons.wikimedia.org/wiki/File:View_of_sunlight_from_clouds_in_rain_from_window_-_panoramio.jpg
- Lluvia fuerte: Jose Ignacio Martinez Navarro · CC BY-SA 3.0
  https://commons.wikimedia.org/wiki/File:Curtain_Of_Rain_Over_The_Sea_(91776043).jpeg
