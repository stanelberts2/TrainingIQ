// A network-first app shell prevents old JavaScript from being served indefinitely
// after GitHub Pages publishes a new version. Cached copies remain available offline.
const CACHE_PREFIX = "trainiq-";
const CACHE_NAME = "trainiq-v74";
const APP_FILES = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./icon.svg"];
const APP_SCOPE = new URL(self.registration.scope);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Other GitHub Pages apps may share this origin: never delete their caches.
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== APP_SCOPE.origin || !requestUrl.pathname.startsWith(APP_SCOPE.pathname)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Do not cache failed requests, redirects, or responses from other origins.
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          const appShell = await caches.match("./index.html");
          if (appShell) return appShell;
        }
        return Response.error();
      }),
  );
});
