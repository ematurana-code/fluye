// Service worker de la versión web de Fluye: guarda la app en el navegador para abrirla sin internet.
// scripts/build.mjs llena la caché y la lista de archivos. Los archivos de la app salen de la caché (incluida la
// dirección con ?plantilla= o ?archivo=); lo demás del sitio (las plantillas .bpmn de la web) va a la red.
const CACHE = '__FLUYE_CACHE__';
const ARCHIVOS = __FLUYE_ARCHIVOS__;

// Se piden a la red (cache: 'reload'): GitHub Pages deja los archivos 10 minutos en la caché del navegador, y sin esto
// una versión nueva podía guardar el index.html o el app.js de la anterior.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((a) => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((k) => k.startsWith('fluye-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const propias = new Set(ARCHIVOS.map((a) => new URL(a, self.registration.scope).pathname));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || !propias.has(url.pathname)) return;
  e.respondWith(caches.open(CACHE)
    .then((c) => c.match(e.request, { ignoreSearch: true }))
    .then((r) => r || fetch(e.request)));
});
