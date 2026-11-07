/* lib/plazo.mjs: una pasada lenta contesta 202 a tiempo y TERMINA igual;
   una rápida contesta lo suyo; sin waitUntil no se adelanta nada. */
import { conPlazo } from './lib/plazo.mjs';
let mal = 0;
const ok = (c, m) => { console.log((c ? '   bien  ' : '   MAL   ') + m); if (!c) mal++; };
const resFalso = () => { const r = { codigo: null, cuerpo: null, headersSent: false, writableEnded: false,
  status(c) { this.codigo = c; return this; }, json(b) { this.cuerpo = b; this.headersSent = this.writableEnded = true; return this; } }; return r; };
const espera = ms => new Promise(r => setTimeout(r, ms));

{ const res = resFalso(); let acabo = false; const pend = [];
  const t0 = Date.now();
  await conPlazo(async (q, s) => { await espera(300); acabo = true; s.status(200).json({ fin: 1 }); }, {}, res, { plazoMs: 50, waitUntil: p => pend.push(p) });
  ok(Date.now() - t0 < 200 && res.codigo === 202, `pasada lenta → 202 antes del plazo (${res.codigo}, ${Date.now() - t0} ms)`);
  await Promise.all(pend);
  ok(acabo, 'la pasada lenta termina por detrás');
  ok(res.codigo === 202 && res.cuerpo?.sigue, 'lo que escribe tarde se descarta, no pisa el 202'); }
{ const res = resFalso();
  await conPlazo(async (q, s) => s.status(200).json({ fin: 1 }), {}, res, { plazoMs: 50, waitUntil: () => {} });
  ok(res.codigo === 200 && res.cuerpo?.fin === 1, 'pasada rápida → su respuesta de siempre'); }
{ const res = resFalso();
  await conPlazo(async (q, s) => { await espera(120); s.status(200).json({ fin: 1 }); }, {}, res, { plazoMs: 50, waitUntil: null });
  ok(res.codigo === 200, 'sin waitUntil no se corta la pasada'); }
if (mal) { console.log(`   ${mal} MAL: el vigilante seguiría dando «Tiempo de espera agotado»`); process.exit(1); }
