// Permite instalar la app en el escritorio. Siempre pide la versión más nueva a internet.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request)); });
