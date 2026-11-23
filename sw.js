const CACHE = 'hogar-v14';
const ARCHIVOS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/main.js',
  './js/camara.js',
  './js/sala.js',
  './js/muebles.js',
  './js/controles.js',
  './js/ui.js',
  './js/inventario.js',
  './js/catalogo.js',
  './js/modelos.js',
  './js/miniaturas.js',
  './js/mascotas.js',
  './js/personajes.js',
  './js/ruleta.js',
  './js/sonido.js',
  './js/tienda3d.js',
  './js/entregas.js',
  './js/suciedad.js',
  './js/misiones.js',
  './js/minijuegos.js',
  './assets/modelos.glb'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
