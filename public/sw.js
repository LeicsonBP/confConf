self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Necessário para a instalação como app no Chrome; não faz cache nem intercepta.
self.addEventListener("fetch", () => {});
