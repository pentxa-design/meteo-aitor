const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const aqui='/Volumes/SSD EXTERNO/CLAUDE/weather-app';
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
w.eval(js);
(async()=>{
  const p={lat:43.42,lon:-2.72};
  const DAILY=w.eval('DAILY'), HOURLY=w.eval('typeof HOURLY!=="undefined"?HOURLY:null');
  const q=new URL(U+'/om?api=fc');
  for(const[k,v]of Object.entries({latitude:p.lat,longitude:p.lon,timezone:'auto',wind_speed_unit:'kmh',
    hourly:(HOURLY||['temperature_2m','wind_gusts_10m','precipitation','cloud_cover']).toString(),
    daily:DAILY.toString(),forecast_days:10,models:'meteofrance_arome_france_hd'})) q.searchParams.set(k,v);
  const f=await fetch(q).then(r=>r.json());
  const has=v=>v!==null&&v!==undefined;
  const cont=o=>{let n=0;for(const k of Object.keys(o))if(k!=='time')for(const v of o[k])if(!has(v))n++;return n;};
  console.log('   AROME solo   → huecos días:',cont(f.daily),'| horas:',cont(f.hourly));
  await w.eval('completarLargo')(f,p);
  console.log('   TRAS LA APP  → huecos días:',cont(f.daily),'| horas:',cont(f.hourly));
  console.log('   rellenoDesde :',f.rellenoDesde||'—');
  console.log('   rellenoDe2   :',(f.rellenoDe2||[]).join(', ')||'—');
  const malos=Object.keys(f.daily).filter(k=>k!=='time'&&f.daily[k].some(v=>!has(v)));
  console.log(malos.length?'   ✗ AÚN VACÍO: '+malos.join(', '):'   ✓ NI UN HUECO — función publicada, datos reales');
})().catch(e=>console.log('   ✗',e.stack.split('\n').slice(0,3).join('\n')));
