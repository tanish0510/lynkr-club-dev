const CACHE_NAME = "lynkr-static-v5";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "reload" }).catch(() =>
        caches.match("/index.html").then((r) =>
          r || caches.match("/").then((r2) =>
            r2 || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
          )
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkRequest = fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() =>
        cached || new Response("", { status: 504, statusText: "Gateway Timeout" })
      );

      return cached || networkRequest;
    })
  );
});
