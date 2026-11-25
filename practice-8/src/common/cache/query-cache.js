export const DEFAULT_CACHE_TTL = 60_000;

const abortError = () => new DOMException("Request aborted", "AbortError");

// Cancellation belongs to a subscriber, not to the shared request. The pending
// request can finish and warm the cache even when every subscriber leaves.
function subscribe(promise, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export function createQueryCache({ ttl = DEFAULT_CACHE_TTL, now = Date.now } = {}) {
  const entries = new Map();
  const listeners = new Set();
  let revision = 0;

  function get(key, loader, { signal } = {}) {
    if (signal?.aborted) return Promise.reject(abortError());
    const serialized = JSON.stringify(key);
    let entry = entries.get(serialized);
    if (!entry || (entry.ready && now() >= entry.expiresAt)) {
      entry = { ready: false };
      entries.set(serialized, entry);
      entry.promise = Promise.resolve().then(loader).then((value) => {
        // Invalidated in-flight reads must neither populate the cache nor hand
        // an obsolete snapshot to a still-mounted consumer. Join a fresh read.
        if (entries.get(serialized) !== entry) return get(key, loader);
        entry.ready = true;
        entry.expiresAt = now() + ttl;
        return value;
      }, (error) => {
        if (entries.get(serialized) !== entry) return get(key, loader);
        entries.delete(serialized);
        throw error;
      });
    }
    return subscribe(entry.promise, signal);
  }

  function invalidate() {
    entries.clear();
    revision += 1;
    listeners.forEach((listener) => listener());
  }

  return {
    get,
    invalidate,
    getRevision: () => revision,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
