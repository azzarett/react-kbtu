import { test } from "node:test";
import assert from "node:assert/strict";
import { createQueryCache } from "../src/common/cache/query-cache.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("cache deduplicates concurrent reads, stores success, expires exactly at TTL from completion", async () => {
  let now = 0, calls = 0;
  const cache = createQueryCache({ ttl: 60, now: () => now });
  const first = deferred();
  const loader = () => { calls++; return calls === 1 ? first.promise : "fresh"; };
  const a = cache.get(["resource", "a"], loader);
  const b = cache.get(["resource", "a"], loader);
  await Promise.resolve();
  assert.equal(calls, 1);
  now = 100;
  first.resolve("old");
  assert.equal(await a, "old");
  assert.equal(await b, "old");
  now = 159;
  assert.equal(await cache.get(["resource", "a"], loader), "old");
  now = 160;
  assert.equal(await cache.get(["resource", "a"], loader), "fresh");
  assert.equal(calls, 2);
});

test("structural keys distinguish resource, query and page without delimiter collisions", async () => {
  const cache = createQueryCache();
  const keys = [["search", "a:b", 1], ["search:a", "b", 1], ["search", "a:b", 2], ["detail", "a:b", 1]];
  for (const [index, key] of keys.entries()) assert.equal(await cache.get(key, () => index), index);
  for (const [index, key] of keys.entries()) assert.equal(await cache.get([...key], () => "wrong"), index);
});

test("errors and synchronous loader throws are not cached", async () => {
  const cache = createQueryCache();
  await assert.rejects(cache.get(["a"], () => { throw new Error("failed"); }), /failed/);
  await assert.rejects(cache.get(["a"], () => Promise.reject(new Error("network"))), /network/);
  assert.equal(await cache.get(["a"], () => "recovered"), "recovered");
});

test("one subscriber abort cannot cancel or poison shared data, including cache hits", async () => {
  const cache = createQueryCache();
  const pending = deferred();
  const controller = new AbortController();
  const cancelled = cache.get(["a"], () => pending.promise, { signal: controller.signal });
  const shared = cache.get(["a"], () => { throw new Error("duplicate"); });
  const rejection = assert.rejects(cancelled, { name: "AbortError" });
  controller.abort();
  pending.resolve("shared");
  await rejection;
  assert.equal(await shared, "shared");
  await assert.rejects(cache.get(["a"], () => "wrong", { signal: controller.signal }), { name: "AbortError" });
  assert.equal(await cache.get(["a"], () => "wrong"), "shared");
});

test("invalidation prevents old pending reads from repopulating or returning stale data", async () => {
  const cache = createQueryCache();
  const old = deferred(), fresh = deferred();
  let calls = 0, notifications = 0;
  const unsubscribe = cache.subscribe(() => notifications++);
  const loader = () => ++calls === 1 ? old.promise : fresh.promise;
  const before = cache.get(["book", "1"], loader);
  await Promise.resolve();
  cache.invalidate();
  assert.equal(cache.getRevision(), 1);
  assert.equal(notifications, 1);
  const after = cache.get(["book", "1"], loader);
  fresh.resolve("new");
  assert.equal(await after, "new");
  old.resolve("obsolete");
  assert.equal(await before, "new");
  assert.equal(await cache.get(["book", "1"], loader), "new");
  assert.equal(calls, 2);
  unsubscribe();
  cache.invalidate();
  assert.equal(notifications, 1);
});

test("an invalidated late error cannot evict a newer successful entry", async () => {
  const cache = createQueryCache();
  const old = deferred();
  const pending = cache.get(["a"], () => old.promise);
  await Promise.resolve();
  cache.invalidate();
  assert.equal(await cache.get(["a"], () => "new"), "new");
  old.reject(new Error("obsolete failure"));
  assert.equal(await pending, "new");
  assert.equal(await cache.get(["a"], () => "wrong"), "new");
});
