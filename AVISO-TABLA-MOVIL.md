# La tabla MODELOS/ESTACION en el movil

---

## 29-08-2026 · LA TABLA «LOS MODELOS / ESTACION» SE LEE MAL EN EL MOVIL

**Suyo, con dos pantallazos de su telefono a las 10:29:** *«en la web esta bien
lo de estacion meteorologica, en el movil no»* · **«esta muy pegado, eso se
puede liar»**.

**No es estetica: es riesgo de leer un numero por otro**, y esa tabla existe
justo para poner el modelo al lado de lo medido.

### La causa, medida en `styles.css` publicado

```css
/* ancho */
.pt__tab td { padding: 6px 14px 6px 0; width: 32% }

/* y en el media query de movil */
.pt__tab td        { padding-right: 8px }
.pt__tab tbody th  { width: auto; font-size: 0.8125rem; padding-right: 8px }
.pt__tab           { font-size: 0.8125rem }
```

**En el movil la separacion entre columnas BAJA de 14 px a 8 px.** Justo al
reves de lo que hace falta: en la pantalla estrecha, donde el texto ya se
parte en dos y tres lineas, las columnas se juntan mas.

Y la tabla no tiene `table-layout`, asi que **el navegador reparte las
anchuras segun el contenido**: en sus dos capturas, con la misma pantalla, la
columna de LOS MODELOS sale de un ancho con **Matxitxako** y de otro con
**Almike (Bermeo)**. Las cifras no quedan en la misma vertical de una tarjeta
a la siguiente.

### Lo que se ve en sus capturas

1. **La cabecera se parte en cascada:** `ESTACION` / `·` / `Matxitxako` — el
   punto se queda solo en su linea.
2. **`ESTA HORA` se descuelga abajo** mientras `LOS MODELOS` y `ESTACION`
   estan arriba: la celda de cabecera crece y el `th` de la izquierda se
   alinea al fondo.
3. **Valores partidos de su unidad:** «30 · tapa» arriba y «104» abajo.
   «mide a 18 / m · hace 7 / min». «ningun / aparato lo / mide».
4. **Y la peor, la fila Viento:** `8 km/h del sur-suroeste` y
   `17 km/h del sur-suroeste`, casi pegadas y con el mismo rumbo detras. Es
   exactamente donde se confunde el numero del modelo con el de la estacion.
5. `font-size: 0.8125rem` = **13 px justos**, su minimo, sin margen. En el
   movil deberia subir, no quedarse en el limite.

### Lo que yo haria

- **Subir la separacion en movil en vez de bajarla**: `padding-right` de 8 px
  a **16-18 px**, y un filete vertical suave entre la columna 2 y la 3 para
  que la vista no salte de una a otra.
- **`table-layout: fixed`** con anchuras fijas (por ejemplo 30/35/35), para
  que las cifras caigan siempre en la misma vertical en todas las tarjetas.
- **Que el nombre de la estacion no se parta:** el `·` pegado al nombre
  (`ESTACION\u00a0· Matxitxako`) o el nombre en su propia linea a proposito.
- **Que numero y unidad no se separen:** `white-space: nowrap` en el `<b>` del
  valor, que «tapa 104» partido en dos lineas se lee fatal de un vistazo.
- **Alinear `ESTA HORA` arriba** (`vertical-align: top` en la cabecera).
- Y en movil, **13 px es el suelo, no el objetivo**: subir a 14-15 px esa
  tabla. Su frase de siempre: *«esto mas grande, casi no veo»*.

**Lo de la web esta bien y el lo dice: el problema es solo el estrecho.**
