const CACHE='trg-cifras-v7';
const APP=[
  './','./index.html','./css/style.css',
  './js/notas.js','./js/storage.js','./js/cifra.js','./js/autoscroll.js','./js/backup.js','./js/app.js','./js/firebase.js',
  './manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('trg-cifras-')&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const resposta=await fetch(e.request);
      if(resposta.ok)cache.put(e.request,resposta.clone());
      return resposta;
    }catch(err){
      return (await cache.match(e.request)) ||
        (e.request.mode==='navigate'?await cache.match('./index.html'):Response.error());
    }
  })());
});
