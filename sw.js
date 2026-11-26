const CACHE = 'hogar-v117';
const ARCHIVOS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/main.js',
  './js/guia.js',
  './js/telefono.js',
  './js/interacciones.js',
  './js/mostrador.js',
  './js/paredObjs.js',
  './js/experiencia.js',
  './js/inmobiliaria.js',
  './js/encargos.js',
  './js/favores.js',
  './js/favores2.js',
  './js/balance.js',
  './js/modeloMascota.js',
  './js/avisos.js',
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
  './js/ambiente.js',
  './js/mas.js',
  './js/juegos.js',
  './js/usos.js',
  './js/sync.js',
  './js/pareja.js',
  './js/progreso.js',
  './js/vida.js',
  './js/economia.js',
  './js/inicio.js',
  './js/pareja2.js',
  './js/casa2.js',
  './js/mascotas2.js',
  './js/social.js',
  './js/sorpresas.js',
  './js/lofi.js',
  './js/fotoeditor.js',
  './js/cuadros.js',
  './js/pintar.js',
  './js/trabajos.js',
  './js/trabajos2.js',
  './js/vecinos.js',
  './js/duo.js',
  './js/album.js',
  './js/bano.js',
  './js/intro.js',
  './js/intros.js',
  './js/bienvenida.js',
  './js/sueno.js',
  './js/medidas.js',
  './js/choques.js',
  './js/edificio.js',
  './js/pisosVecinos.js',
  './js/calle.js',
  './js/escaparate.js',
  './js/sol.js',
  './js/i18n.js',
  './js/i18n_en.js',
  './assets/modelos.glb'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

const RECURSOS = 'hogar-recursos-1';
const ES_RECURSO = /\/assets\/(?!videos\/)|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com|\/icons\//;

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(claves => Promise.all(claves.filter(k => k !== CACHE && k !== RECURSOS).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/assets/videos/')) return;
  if (ES_RECURSO.test(e.request.url)) {
    e.respondWith(caches.open(RECURSOS).then(c => c.match(e.request).then(guardado => {
      const red = fetch(e.request).then(r => {
        if (r.ok && r.status === 200) c.put(e.request, r.clone());
        return r;
      }).catch(() => guardado || caches.match(e.request));
      return guardado || red;
    })));
    return;
  }
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

self.addEventListener('push', e => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch (err) {
    d = { texto: e.data ? e.data.text() : '' };
  }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Our Place', {
    body: d.texto || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: d.tipo || 'aviso',
    renotify: true,
    data: { url: './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    for (const c of lista) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
