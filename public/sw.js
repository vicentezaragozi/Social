const CACHE_NAME = "social-pwa-v3";
const ASSET_CACHE = "social-assets-v3";

const OFFLINE_URLS = ["/", "/app"];

// Check if URL is an auth route (handles both /auth/callback and /[locale]/auth/callback)
function isAuthRoute(url) {
  const pathname = url.pathname.toLowerCase();
  return (
    pathname.includes("/auth/callback") ||
    pathname.includes("/sign-in") ||
    pathname.includes("/sign-out") ||
    url.searchParams.has("code") || // Magic link code parameter
    url.searchParams.has("token") // Auth token parameter
  );
}

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

  const url = new URL(request.url);
  
  // NEVER cache auth routes - they must always go directly to network
  // This includes locale-based routes like /en/auth/callback
  if (isAuthRoute(url)) {
    event.respondWith(fetch(request.clone()).catch(() => {
      // If network fails, don't serve cache - just fail
      return new Response("Network error", { status: 503 });
    }));
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
  
  // Never cache auth routes - always go to network
  if (isAuthRoute(url)) {
    return fetch(request).catch(() => {
      // Don't fall back to cache for auth routes
      return new Response("Network error", { status: 503 });
    });
  }

  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    
    // Only cache successful responses that aren't auth routes
    if (response.ok && !isAuthRoute(url)) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Don't serve cached auth routes - they must always go to network
    if (isAuthRoute(url)) {
      throw error;
    }
    
    // For non-auth routes, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (request.headers.get("accept")?.includes("text/html")) {
      // Don't serve cached root if this request has auth parameters
      if (!isAuthRoute(url)) {
        return cache.match("/");
      }
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

