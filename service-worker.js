const CACHE='meteo-aitor-v10-144-mucape-mucin-gfs-estables';
const MAP_DATA_CACHE='meteo-aitor-map-data-v1';
const MAP_DATA_LIMIT=12;
const SHELL=['./','./index.html','./manifest.webmanifest','./vendor/leaflet/leaflet.css','./vendor/leaflet/leaflet.js','./vendor/openmeteo-weather-map-layer-0.0.20.js','./vendor/leaflet/images/layers.png','./vendor/leaflet/images/layers-2x.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-1024.png','./icons/icon-180.png','./icons/brand-gaztelugatxe.png','./assets/sky-real-sunny-v10-7.jpg','./assets/sky-real-partly-v10-7.jpg','./assets/isla-izaro-bermeo-2013-cc-by-sa-3.jpg','./assets/sky-real-light-rain-v10-7.jpg','./assets/sky-real-heavy-rain-v10-7.jpg','./assets/sky-bermeo-night-v9-12.webp'];
self.trimMapDataCache=async cache=>{const keys=await cache.keys();await Promise.all(keys.slice(0,Math.max(0,keys.length-MAP_DATA_LIMIT)).map(key=>cache.delete(key)))};
self.mapDataCacheKey=request=>{const url=new URL(request.url);url.searchParams.delete('_retry');return new Request(url.toString(),{headers:{Accept:'application/json'}})};
self.mapDataResponse=async response=>{const body=await response.arrayBuffer(),headers=new Headers(response.headers);headers.set('X-Meteo-Retained','1');return new Response(body,{status:response.status,statusText:response.statusText,headers})};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==MAP_DATA_CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname==='/api/map-mu'){
    event.respondWith((async()=>{
      const cache=await caches.open(MAP_DATA_CACHE),key=self.mapDataCacheKey(event.request);
      try{
        const response=await fetch(event.request);
        if(response.ok){await cache.put(key,response.clone());await self.trimMapDataCache(cache)}
        if(response.ok)return response;
        const saved=await cache.match(key);return saved?self.mapDataResponse(saved):response;
      }catch(error){
        const saved=await cache.match(key);if(saved)return self.mapDataResponse(saved);throw error;
      }
    })());return;
  }
  if(url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}return response}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response}).catch(()=>caches.match(event.request)));
});
