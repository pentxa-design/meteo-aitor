const CACHE='meteo-aitor-v10-131-nubes-sin-verde-falso';
const SHELL=['./','./index.html','./manifest.webmanifest','./vendor/leaflet/leaflet.css','./vendor/leaflet/leaflet.js','./vendor/openmeteo-weather-map-layer-0.0.20.js','./vendor/leaflet/images/layers.png','./vendor/leaflet/images/layers-2x.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-1024.png','./icons/icon-180.png','./icons/brand-gaztelugatxe.png','./assets/sky-real-sunny-v10-7.jpg','./assets/sky-real-partly-v10-7.jpg','./assets/isla-izaro-bermeo-2013-cc-by-sa-3.jpg','./assets/sky-real-light-rain-v10-7.jpg','./assets/sky-real-heavy-rain-v10-7.jpg','./assets/sky-bermeo-night-v9-12.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}return response}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response}).catch(()=>caches.match(event.request)));
});
