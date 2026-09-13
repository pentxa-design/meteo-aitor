/* ── LA MISMA PRUEBA, A OTRA HORA DEL DÍA ─────────────────────────────
   Se precarga con `node --require ./hora-falsa.cjs pruebas.js` y una
   variable `HORA_FALSA=21`. A partir de ahí, para el código que se está
   probando son las HH:30 de hoy.

   POR QUÉ EXISTE. El 28-08-2026, en la misma tarde, DOS pruebas
   distintas fallaron **solo por la hora a la que se ejecutaban**:

     · una fijaba la lluvia a las 20:00 y a las 19:30 dejaba de ser
       «lluvia de luego»;
     · otra escribía `Math.min(22, ahora + 2)` para el final de un
       chaparrón, y a las 23:37 ese tope aplastaba la ventana y el
       escenario dejaba de ser «está cayendo ahora».

   Las dos habían pasado en verde decenas de veces. Una prueba que solo
   falla después de cierta hora **no avisa: engaña**, y esta app se mira
   de madrugada, que es cuando él decide si manda gente al monte.

   Suyo, esa noche: *«revisa bien 2 veces»* y *«que no se os pase nada»*.

   Cuesta 0,1 s por hora probada. No hay excusa para no hacerlo. */
const h = Number(process.env.HORA_FALSA);
if (Number.isFinite(h)) {
  const Real = Date;
  const fijo = new Real();
  fijo.setHours(h, 30, 0, 0);
  globalThis.Date = new Proxy(Real, {
    construct(T, a) { return a.length ? new T(...a) : new T(fijo); },
    get(T, p) { return p === 'now' ? () => fijo.getTime() : T[p]; },
  });
}
