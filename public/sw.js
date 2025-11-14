const CACHE_NAME = "social-pwa-v2";
const ASSET_CACHE = "social-assets-v2";

const OFFLINE_URLS = ["/", "/app"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
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
            .filter((key) => ![CACHE_NAME, ASSET_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // Never cache auth callback routes - they must always go to network
  const url = new URL(request.url);
  if (url.pathname.includes("/auth/callback") || url.pathname.includes("/sign-in")) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.url.includes("/_next/static/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const url = new URL(request.url);
  
  // Never cache auth routes
  if (url.pathname.includes("/auth/callback") || url.pathname.includes("/sign-in")) {
    return fetch(request);
  }

  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    
    // Only cache successful responses that aren't auth routes
    if (response.ok && !url.pathname.includes("/auth/callback") && !url.pathname.includes("/sign-in")) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Don't serve cached auth routes
    if (url.pathname.includes("/auth/callback") || url.pathname.includes("/sign-in")) {
      throw error;
    }
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (request.headers.get("accept")?.includes("text/html")) {
      return cache.match("/");
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cachedResponse);
  return cachedResponse || fetchPromise;
}

