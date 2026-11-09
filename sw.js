const CACHE_PREFIX = "khairat-demo-";
const CACHE = `${CACHE_PREFIX}v4`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./shop/",
  "./categories/",
  "./offers/",
  "./cart/",
  "./checkout/",
  "./account/",
  "./admin.html",
  "./store.css",
  "./store.js",
  "./styles.css",
  "./admin.css",
  "./app.js",
  "./admin.js",
  "./inventory-store.js",
  "./manifest.webmanifest",
  "./assets/khairat-logo-web.png",
  "./assets/khairat-hero.png",
  "./assets/olive-oil-tin-illustrative.png",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/fonts/tajawal-400.ttf",
  "./assets/fonts/tajawal-700.ttf",
  "./assets/fonts/tajawal-800.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) return;
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
