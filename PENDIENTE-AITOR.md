# LO QUE ME VA DICIENDO · 28-08-2026

Su orden: *«reparar todo esto que os iré diciendo, sin olvidar nada»*, *«que
no se pase nada»*. Aquí queda apuntado y se tacha según se hace.

**Y la regla que manda sobre todo lo demás**, dicha cinco veces esa mañana:

> *«Vosotros cifras. Pronósticos perfectos y yo decido.»*
> *«Rellena con datos, la decisión la tomo yo.»*
> *«Solo info del tiempo en ese lugar, detallada.»*

---

- [x] **Textos que le dicen qué hacer.** «No se sube», «no se tocan los
      cuadros», «antes de autorizar»… **Fuera todos.** Con guardián
      automático (`sin-ordenes.cjs`) enganchado a `revisar.sh` para que no
      vuelvan. Origen: vio en Arbaiza «riesgo sirimiri, no se tocan los
      cuadros eléctricos» y avisó de que **allí los cuadros están DENTRO de
      la caseta**, y que hasta con lluvia tiene que tocarlos.
- [x] **El selector «Qué vas a hacer».** Existía para que la app adaptara un
      veredicto a la actividad. Sin veredicto, sobra. *«Esto sobra, lo
      decido yo.»*
- [x] **El rótulo APTO / PRECAUCIÓN / NO APTO.** Eso autoriza, y autorizar
      no es de la app. Ahora describe: **SIN NADA / OJO / FUERTE**, con el
      mismo color para verlo de un vistazo.
- [x] **La cota.** Decía «sin la cota de este emplazamiento no puedo
      decirte nada del hielo» **en los catorce sitios**. Suyo: *«¿cómo que
      sin la cota? Si tenéis las coordenadas.»* Se saca de `/om?api=elev`.
      **HECHO** en `2026.08.28-08xx`: se saca sola y se dice de dónde sale.
- [x] **Icono de luna de 7 a 13 h** siendo de día y con el cielo despejado.
      Causa: el dibujo miraba el `is_day` de la PRIMERA hora de la franja, y
      esa franja empieza a las 6:00; en Bermeo a finales de agosto el sol sale
      a las 7:20, así que ocho horas de sol salían con luna. Ahora cuenta las
      horas: manda la mayoría. **Comprobado en pantalla**: mañana sol, tarde
      sol, noche luna.
- [x] **«10 días»: HOY sale con nube** y arriba pone Despejado. Arreglado con
      `iconosDelDia`: el agua manda por lo peor, el cielo por lo que más se
      repite, y si mañana y tarde no coinciden salen los DOS dibujos, que es
      lo que él pidió: *«podrías poner sol a la mañana y nuboso por la tarde,
      la lógica»*.
- [x] **«29 km/h de diferencia: no coinciden · cuadran con el aparato».**
      Suyo: *«coinciden, no coinciden, pero cuadran… lío.»* No había nada mal
      por debajo —el `corto` se calcula contra el MAYOR de los modelos, que es
      el que se queda `peorRacha()`—: eran dos comparaciones distintas pegadas
      con un «·» sin decir contra qué comparaba cada una. Ahora van en dos
      líneas etiquetadas, **Entre ellos** y **Contra el aparato**, y la segunda
      nombra al más fuerte. Sacada a `frasesContraste()` y con 11 pruebas.
- [x] **En las tarjetas de Horas falta CAPE e inhibición.** Las 48 horas
      llevan ya `CAPE 870 · tapa 68`, con la palabra de la escala del mapa
      —sin tapa / floja / aguanta / fuerte— para no aprender dos escalas.
      Cuando se cumple la pareja calibrada (CAPE ≥ 700 **y** tapa < 75) la
      línea va en ámbar y dice los dos listones. **No cambia el semáforo ni
      veta nada.** Si el modelo no publica uno de los dos, se dice «no lo
      publica»: un hueco se lee como «no hay», que es lo contrario.
      **Y ojo, que aquí casi repito su lío**: la primera versión decía
      «tapa 68 (aguanta) — la tapa no la sujeta» en la misma frase, porque la
      escala del mapa llama «aguanta» desde 50 y la regla rompe en 75. Cazado
      al mirarlo en pantalla y con prueba puesta para que no vuelva.
- [x] **Más cifras por emplazamiento.** *«Añadir más datos, más datos, más
      info mejor.»* De cuatro a NUEVE: CAPE, tapa, racha a 10 m, racha a su
      altura de trabajo, viento con rumbo, lluvia con probabilidad,
      temperatura con rocío y humedad, isocero contra la cota del sitio, y
      visibilidad. **Comprobado**: en el ordenador salen las nueve en una
      fila y en el móvil en tres, sin cortarse ninguna.
- [x] **La foto de portada seguía pegada.** Él lo dijo dos veces —en Mis
      torres y luego en Torre, con la de Gaztelugatxe—. La primera vez lo di
      por hecho y **no lo estaba**: puse `.cover-fijo{position:static}` y la
      portada colgaba DENTRO de `<header class="top">`, que es `sticky`; un
      hijo estático de algo pegado sigue pegado. Sacada del header.
      **Medido**: al bajar 900 px la foto se va 900 px y la barra de
      navegación se queda arriba.
