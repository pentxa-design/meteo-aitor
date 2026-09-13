const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const aqui=__dirname;
const html=fs.readFileSync(path.join(aqui,'index.html'),'utf8');
const js=fs.readFileSync(path.join(aqui,'app.js'),'utf8');
const U='https://weather-app-ochre-one-76.vercel.app';
const dom=new JSDOM(html,{url:U+'/',pretendToBeVisual:true,runScripts:'outside-only'});
const w=dom.window;
w.fetch=(u='',o)=>fetch(String(u).startsWith('http')?u:U+u,o);   // RED DE VERDAD
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
w.caches={open:()=>Promise.reject(new Error('sin caché'))};
const reg={showNotification:()=>Promise.resolve(),
  pushManager:{getSubscription:()=>Promise.resolve(null)},active:{postMessage(){}}};
w.navigator.serviceWorker={register:()=>Promise.resolve(reg),
  ready:new Promise(()=>{}),addEventListener(){},controller:null};
w.navigator.geolocation={getCurrentPosition(){}};
w.scrollTo=()=>{}; w.requestAnimationFrame=cb=>setTimeout(cb,0);
w.addEventListener('error', e=>console.log('  [err]', e.message));
try {
  /* Con 'use strict', las funciones del eval no llegan al window: se
     exportan a mano DESDE el mismo eval, que sí las ve. */
  w.eval(js + ';\nwindow.__app = { go, S, modeloDato, duenoLluvia, nombreDeModelo };');
} catch(e){ console.log('✗ arranque:', e.message); process.exit(1); }
(async()=>{
  // la carga real de la ficha para Bermeo, con el modelo por defecto (AROME)
  await w.__app.go({ name:'Bermeo', lat:43.42, lon:-2.72 });
  await new Promise(r=>setTimeout(r,9000));
  const A=w.__app; const r = (() => {
    const S=A.S, modeloDato=A.modeloDato, duenoLluvia=A.duenoLluvia, nombreDeModelo=A.nombreDeModelo;
    const document=w.document;
    const fc = S.data?.fc; if (!fc) return { error: 'sin datos' };
    const pa = (fc.prestadosDe||[]).filter(x=>x.porAcierto);
    const H = fc.hourly||{};
    return {
      modelo: modeloDato()?.name,
      porAcierto: pa.map(x=>x.k+'←'+x.de),
      dueno: nombreDeModelo(duenoLluvia()),
      tieneCodeLluvia: Array.isArray(H.weather_code_lluvia),
      horasLluvia: (H.precipitation||[]).filter(v=>v!=null).length,
      sumaDiaria10: (fc.daily?.precipitation_sum||[]).filter(v=>v!=null).length,
      kpi: (document.querySelector('#det')?.textContent||'').includes('elegida por acierto')
        || (document.body.textContent||'').includes('elegida por acierto'),
    };
  })();
  console.log(JSON.stringify(r,null,1)); process.exit(0);
})().catch(e=>{console.log('✗',e.message);process.exit(1);});
