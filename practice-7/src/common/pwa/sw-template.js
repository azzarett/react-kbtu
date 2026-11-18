/* Build substitutes content hash and all production assets, including lazy chunks. */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const PREFIX = 'polka-task7-';
const SHELL = `${PREFIX}shell-${VERSION}`;
const API = `${PREFIX}public-${VERSION}`;
const STATIC = `${PREFIX}static-${VERSION}`;
const scope = self.registration.scope;
const shellURL = new URL('index.html', scope).href;
const offlineURL = new URL('offline.html', scope).href;
const TTL = 24 * 60 * 60 * 1000;
async function offlineDocument(cache) {
  const response = await cache.match(offlineURL);
  return new Response((await response.text()).replaceAll('__APP_BASE__', scope), {headers:{'Content-Type':'text/html; charset=utf-8'}});
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(PRECACHE)));
  // Do not skip waiting automatically: user explicitly accepts update.
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(PREFIX) && ![SHELL, API, STATIC].includes(name)) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('message', event => { if(event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
async function notify(type, url) {
  for (const client of await self.clients.matchAll({type:'window'})) client.postMessage({type, url});
}
async function boundedPut(name, request, response, max) {
  if (!response.ok || response.type === 'opaque') return;
  const cache = await caches.open(name);
  const headers = new Headers(response.headers);
  headers.set('x-polka-cached-at', String(Date.now()));
  await cache.put(request, new Response(await response.clone().arrayBuffer(), {status:response.status, headers}));
  const keys = await cache.keys();
  while(keys.length > max) await cache.delete(keys.shift());
}
async function fresh(name, request) {
  const cache = await caches.open(name);
  const response = await cache.match(request);
  if (!response) return null;
  if (Date.now() - Number(response.headers.get('x-polka-cached-at') || 0) > TTL) { await cache.delete(request); return null; }
  return response;
}
async function publicAPI(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(request, {signal:controller.signal, credentials:'omit'});
    if (!response.ok) throw new Error('Public API unavailable');
    await boundedPut(API, request, response, 50).catch(() => {});
    await notify('API_LIVE', request.url);
    return response;
  } catch {
    const cached = await fresh(API, request);
    if (cached) {
      await notify('API_CACHED', request.url);
      const headers = new Headers(cached.headers); headers.set('x-polka-offline', 'true');
      return new Response(await cached.arrayBuffer(), {headers, status:200});
    }
    await notify('API_UNAVAILABLE', request.url);
    return new Response(JSON.stringify({error:'No cached public data. Connect and retry.'}), {status:503, headers:{'Content-Type':'application/json'}});
  } finally { clearTimeout(timer); }
}
async function staticAsset(request) {
  const cached = await fresh(STATIC, request);
  if (cached) return cached;
  const response = await fetch(request);
  await boundedPut(STATIC, request, response, 60).catch(() => {});
  return response;
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('authorization')) return;
  // Strict public allowlist. Firebase, auth endpoints, user data and tokens are never runtime-cached.
  if (url.origin === 'https://openlibrary.org' && (url.pathname === '/search.json' || /^\/works\/OL\d+W\.json$/.test(url.pathname))) {
    event.respondWith(publicAPI(request)); return;
  }
  if (url.origin === new URL(scope).origin && request.url.startsWith(scope)) {
    if (url.pathname.endsWith('/connection-check.txt')) return;
    if (request.mode === 'navigate') {
      event.respondWith((async () => {
        // HashRouter routes all share this document; its full shell is available offline.
        const cache = await caches.open(SHELL);
        const knownDocument = url.pathname === new URL(scope).pathname || url.pathname === new URL(shellURL).pathname;
        if (knownDocument) return (await cache.match(shellURL)) || fetch(request).catch(() => offlineDocument(cache));
        try { const response=await fetch(request); if(!response.ok) throw new Error(); return response; }
        catch { return offlineDocument(cache); }
      })()); return;
    }
    event.respondWith((async()=> {
      const cached=await (await caches.open(SHELL)).match(request);
      if(cached) return cached;
      if (/\.(png|svg|jpg|jpeg|webp|woff2?)$/.test(url.pathname)) return staticAsset(request);
      return fetch(request);
    })());
  }
});
