# Aviso de METEO -SECUNDARIO sobre la tabla de nubes

---

## 29-08-2026 · TRES FALLOS EN LA TABLA DE NUBES (METEO -SECUNDARIO)

Repasado sobre `v2026.08.29-0009` con las pantallas que mando Aitor a las
00:14-00:16 (Bermeo) y leyendo el `app.js` publicado. **Los dos primeros son
de datos, no de estetica.**

### 1 · La MEDIANA y el ORDEN mezclan un total con una capa

En `tablaNubes()`:

```js
orden: has(tot) ? tot : cap.manda.v
...
.sort((a, b) => b.orden - a.orden)
```

**AROME HD no publica total.** Con `has(tot)` falso, entra a ordenar con
`cap.manda.v` — su **capa** mas cargada. Asi que su «bajas 65 %» compite
contra el **total** 58 % de ICON y le pasa por delante. En la pantalla de
Aitor sale, de arriba abajo: GEM 76 · **AROME HD (bajas 65)** · ICON 58 ·
HARMONIE 34 · ARPEGE 23 · ECMWF 8. AROME HD esta **segundo** por un numero
que no es de la misma magnitud que los demas.

**Y la mediana se lo come tambien.** La ficha enseña
«los modelos van de 0 a 76 % · mediana 34 %». La cuenta:

| que se mete | valores | mediana |
|---|---|---|
| solo los que publican TOTAL | 76 · 58 · 34 · 23 · 8 · 0 | **28,5 %** |
| metiendo la CAPA de AROME HD | 76 · **65** · 58 · 34 · 23 · 8 · 0 | **34 %** |

**La app enseña 34 %.** Solo sale ese numero si el 65 de AROME HD cuenta
como si fuera un total. (El 0 de GFS lo doy por el orden descendente de la
lista, que en su pantalla quedaba cortada por abajo — merece confirmarse.)

**Y ademas no es coherente entre pantallas:** en «Mis torres» AROME HD sale
**apagado y el ultimo** («AROME HD bajas 9 %», detras incluso de GFS 0 %), y
en la pestaña Torre sale **ordenado en medio**. Dos criterios para el mismo
modelo.

**Lo que yo haria:** que `orden` sea `null` cuando no hay total, que esos
vayan al final apagados —como ya hace «Mis torres»— y que la mediana y el
«van de X a Y» se calculen **solo con los que publican total**, que es lo
que ya hace `abanico` con `conTotal`.

### 2 · El aviso mas util queda tapado por el mas tecnico

```js
if (cortos.length)        { 'Hay numeros que no cuadran' }
else if (abanico >= 50)   { 'No coinciden en el cielo' }
```

En esa misma hora el abanico era **de 0 % a 76 %: 76 puntos**, muy por encima
del 50. Pero como ECMWF ademas descuadraba, Aitor **solo vio «Hay numeros que
no cuadran»** y nunca se entero de que los modelos no saben si su torre esta
metida en nube.

**Para el, esos dos avisos no valen lo mismo.** «Los numeros no cuadran» es
una queja tecnica sobre un modelo. «Del 0 al 76 %, no lo saben: asomate o
mira el satelite» **es la que le cambia lo que hace**. La segunda no puede
perder contra la primera: **caben las dos**.

### 3 · Menor, de redaccion

En RIESGO ELECTRICO, con **CAPE 20 · Inestabilidad baja**, la linea de la
inhibicion dice **«Sin tapa: si hay CAPE, rompe»**. Es cierta como
condicional, pero leida sola —de madrugada y con guantes— afirma que rompe,
cuando la regla de la propia app es CAPE >= 700. Con CAPE por debajo del
liston, mejor cerrar la frase: la tapa esta abierta **pero no hay gasolina**.

### Lo que esta BIEN y no hay que tocar

- La escalera de «coinciden / no coinciden» del **viento** esta bien montada:
  `todosNo` → `algunoNo` → `dif >= 25` → `algunoWarn` → `dif >= 12` → coinciden.
  **Los umbrales de Aitor se miran ANTES que la separacion**, que era justo
  lo que yo temia que faltase. No falta. Los 11 km/h de su pantalla (14 de
  AROME HD contra 3 de ARPEGE/GFS) caen bien en el ultimo escalon.
- El texto de ECMWF —«ese modelo no publica las capas: el total es suyo y las
  capas son una cuenta hecha con la humedad»— es correcto y es el que yo tuve
  al reves. Queda dicho.
- `CAPAS_PROPIAS` deja GEM y HARMONIE sin declarar y `capasPropias()` devuelve
  `null` → «no sabemos de donde sale cada uno». Bien resuelto. Ojo solo a que
  **GEM manda el maximo de toda la comparacion (76 %)** siendo el que menos
  conocemos.
