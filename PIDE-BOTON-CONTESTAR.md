# Aitor pide un boton de contestar en el hilo

---

## 29-08-2026 · AITOR PIDE PODER CONTESTARNOS SIN ABRIR NOTA NUEVA

Sus palabras: *«me has escrito, seria bueno un boton de contestarte tambien
en la app»* · *«sin abrir otro nuevo, no?»* · *«de tu respuesta»*.

### Lo que YA funciona (medido, no supuesto)

`/api/campo` devuelve cada nota con el campo **`respuesta: {texto, hora}`**, y
`pintarHilo()` **si la dibuja** — `<div class="hn__r"><b>Respuesta</b>…` — y
ademas cuenta arriba «N sin contestar todavia» y marca la nota con `hn--sin`.
Iba a avisar de que no las veia y **estaba equivocado**: en su pantallazo de
las 00:19 la respuesta quedaba justo por debajo del corte de la imagen.

Ahora mismo tiene **dos respuestas guardadas y visibles**: la del 28-08 a las
20:31 (la foto del cielo de Bermeo) y la de hoy 29-08 a las 10:25.

### Lo que SI falta, que es justo lo que pide

**No hay forma de contestar DENTRO del hilo.** Medido:

```
responde_a / respondeA / enHilo  ->  0 apariciones en app.js
```

Cada nota es suelta. Si quiere responder a nuestra respuesta, tiene que
escribir **una nota nueva**, que sale como si fuera otro asunto. Por eso dice
*«sin abrir otro nuevo, no?»*.

### La propuesta, que no necesita endpoint nuevo

**1 · Un boton «Contestar» debajo de cada `hn__r`.** Abre el mismo cuadro de
«Mandarnos un dato del sitio» que ya existe, pero con la nota original
enganchada.

**2 · Un campo mas en el POST a `/api/campo`:** `responde_a: <n.cuando de la
nota original>`. Nada mas. El `cuando` ya es unico y ya se usa como clave en
el boton de borrar (`data-quitar="${esc(n.cuando)}"`).

**3 · En `pintarHilo()`, las que traen `responde_a` van sangradas debajo de su
nota**, no como entrada suelta arriba. Y que **el `decia` se siga guardando
igual** — ese retrato de los modelos en el momento exacto en que escribe es lo
que hace que el cuaderno valga para puntuar despues.

**4 · Y que al contestar el se marque como «sin leer» PARA NOSOTROS**: hoy
`visto` lo ponemos nosotros al leerla. Si el contesta a una nota ya vista, esa
nota vuelve a estar pendiente, o su respuesta se nos pasa.

### Detalle que importa

**El hilo se refresca cada 20 s pero solo con la pestaña delante y visible**
(`refrescarHilo()`), lo cual esta muy bien pensado para el monte. Si se mete
lo de contestar, **que siga igual**: nada de subir la frecuencia.
