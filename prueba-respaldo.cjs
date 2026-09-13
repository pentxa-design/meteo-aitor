/* Simula que el modelo asignado SE CAE y comprueba que el siguiente lo
   salva. Con datos de verdad, contra la app publicada. */
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const U='https://weather-app-ochre-one-76.vercel.app';
const COB=JSON.parse(fs.readFileSync(__dirname+'/data/cobertura.json','utf8')).cobertura;
globalThis.COBERTURA=COB;
const ORDEN=globalThis.ORDEN_FIABLE=(src.match(/const ORDEN_FIABLE = \[([^\]]+)\]/)||[])[1].match(/'[a-z_0-9]+'/g).map(x=>x.slice(1,-1));
const traeAlgo=v=>Array.isArray(v)&&v.some(x=>x!==null&&x!==undefined);
globalThis.quienLoMide=(c,salvo)=>{const p=COB[c]; if(!p?.length)return null;
  return ORDEN.find(om=>om!==salvo&&p.includes(om))||null;};

// La MISMA función que publica la app, sacada del fichero
const cuerpo=src.slice(src.indexOf('async function repartirConRespaldo'),
                       src.indexOf('\n}\n', src.indexOf('async function repartirConRespaldo'))+2);
const repartirConRespaldo=eval('('+cuerpo.replace('async function repartirConRespaldo','async function')+')');

const pedir=(om,ks)=>fetch(`${U}/om?api=fc&latitude=43.42&longitude=-2.72&hourly=${ks.join(',')}&forecast_days=1&timezone=auto&models=${om}`).then(r=>r.json());

(async()=>{
  const AROME='meteofrance_arome_france_hd';
  const CAMPOS=['cape','convective_inhibition','cloud_cover','uv_index'];
  const f={hourly:{}}; const caidas=[];
  // MUERTO: el que le tocaría a `cape` no contesta nada
  const MUERTO=quienLoMide('cape',AROME);
  console.log('  al CAPE le toca:', MUERTO);

  const pedirYPegar=async(om,ks,muerto)=>{
    const d = om===MUERTO ? {hourly:Object.fromEntries(ks.map(k=>[k,new Array(24).fill(null)]))}
                          : await pedir(om,ks);
    const sin=[];
    for(const k of ks){
      if(!traeAlgo(d.hourly?.[k])){ sin.push(k); continue; }
      f.hourly[k]=d.hourly[k];
      if(muerto) caidas.push({k,muerto,salvo:om});
    }
    return sin;
  };
  await repartirConRespaldo(CAMPOS, AROME, pedirYPegar);

  console.log('\n  CON', MUERTO, 'CAÍDO DEL TODO:');
  for(const k of CAMPOS){
    const v=f.hourly[k];
    const n=traeAlgo(v)? v.filter(x=>x!=null).length : 0;
    const c=caidas.find(x=>x.k===k);
    console.log('   ',k.padEnd(24), n? `✓ ${n} horas`+(c?`  (lo salvó ${c.salvo})`:'') : '✗ VACÍO');
  }
  const vacios=CAMPOS.filter(k=>!traeAlgo(f.hourly[k]));
  console.log('\n  '+(vacios.length? '✗ SE QUEDA SIN: '+vacios.join(', ') : '✓ NINGÚN HUECO: el respaldo funciona'));
  process.exit(vacios.length?1:0);
})().catch(e=>{console.log('  ✗',e.message);process.exit(1);});
