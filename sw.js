// TRG Cifras — Modo Offline

const CACHE_NAME = 'trg-cifras-v2';

const ARQUIVOS = [
  './',
  './index.html',
  './css/style.css',
  './js/notas.js',
  './js/storage.js',
  './js/cifra.js',
  './js/autoscroll.js',
  './js/backup.js',
'./js/app.js',
'./manifest.webmanifest',
'./icons/icon-192.png',
'./icons/icon-512.png'
];

// Salva os arquivos necessários para funcionar offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS);
    })
  );

  self.skipWaiting();
});

// Remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes
          .filter((nome) =>
            nome.startsWith('trg-cifras-') &&
            nome !== CACHE_NAME
          )
          .map((nome) => caches.delete(nome))
      );
    }).then(() => self.clients.claim())
  );
});

// Usa a internet quando disponível e o cache quando offline
self.addEventListener('fetch', (event) => {
  const requisicao = event.request;

  if (
    requisicao.method !== 'GET' ||
    new URL(requisicao.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const resposta = await fetch(requisicao);

        if (resposta.ok) {
          await cache.put(requisicao, resposta.clone());
        }

        return resposta;
      } catch (erro) {
        const salva = await cache.match(requisicao);

        if (salva) return salva;

        if (requisicao.mode === 'navigate') {
          return (await cache.match('./index.html')) ||
            Response.error();
        }

        return Response.error();
      }
    })
  );
});