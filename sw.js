/* IT Support Quest offline helper. Bump VERSION when you change this file. */
const VERSION='itq-v1';
const CORE=['it-support-quest.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const LIBS='itq-libs';

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION&&k!==LIBS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  /* Firebase library files never change for a version: cache first */
  if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.open(LIBS).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}))));
    return;
  }
  if(url.origin!==self.location.origin)return; /* sign-in and cloud saves go straight to the network */
  /* Game files: answer from cache at once, refresh the cache in the background */
  e.respondWith(caches.open(VERSION).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>{
    const net=fetch(req).then(r=>{if(r.ok&&r.type==='basic')c.put(req,r.clone());return r}).catch(()=>hit);
    if(hit){e.waitUntil(net.catch(()=>{}));return hit}
    return net.then(r=>r||Response.error());
  })));
});
