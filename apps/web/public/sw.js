const CACHE = "packaudit-public-assets-v1";
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/media/inspect-pack.svg",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE &&
                (key.startsWith("lmpc-shell-") ||
                  key.startsWith("lmpc-public-assets-") ||
                  key.startsWith("packaudit-public-assets-")),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Keep navigation and all inspection/API data out of the public asset cache.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !PRECACHE.includes(url.pathname) ||
    url.search
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok)
          event.waitUntil(
            caches
              .open(CACHE)
              .then((cache) => cache.put(event.request, response.clone())),
          );
        return response;
      })
      .catch(
        async () => (await caches.match(event.request)) || Response.error(),
      ),
  );
});
