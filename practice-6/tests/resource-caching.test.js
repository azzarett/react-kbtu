import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { searchBooks, getCatalogBook } from "../src/features/catalog/services/service.js";
import { bookshelfCache, getBookCollection, fetchBooksPage, fetchBook, fetchDashboard, createBook, updateBook, removeBook } from "../src/features/bookshelf/services/service.js";
import { API_CONFIG, DATA_KEY } from "../src/features/bookshelf/api/settings.js";
import { initialBooks } from "../src/features/bookshelf/api/initial-books.js";

let originalStorage, originalConfig, reads;
beforeEach(() => {
  bookshelfCache.invalidate();
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  originalConfig = { ...API_CONFIG };
  const storage = new Map([[DATA_KEY, JSON.stringify(initialBooks.map((book) => ({ ...book, updatedAt: "2026-01-01T00:00:00.000Z" })))]]);
  reads = 0;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => { reads++; return storage.get(key) ?? null; },
    setItem: (key, value) => storage.set(key, value),
  } });
  Object.assign(API_CONFIG, { minDelay: 0, maxDelay: 0, errorChance: 0 });
});
afterEach(() => {
  bookshelfCache.invalidate();
  Object.assign(API_CONFIG, originalConfig);
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
});

test("Open Library caches normalized searches and work IDs; every query/page/resource has its own entry", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => url.includes("search.json") ? { docs: [], numFound: 0 } : { key: "/works/OL1W", title: "Book" } };
  };
  await Promise.all([searchBooks(" A ", { fetchImpl }), searchBooks("A", { fetchImpl })]);
  assert.equal(calls.length, 1);
  await searchBooks("A", { page: 2, fetchImpl });
  await searchBooks("B", { fetchImpl });
  await getCatalogBook("OL1W", { fetchImpl });
  await getCatalogBook("/works/OL1W", { fetchImpl });
  assert.equal(calls.length, 4);
  assert.ok(calls[0].includes("fields=key%2Ctitle%2Cauthor_name%2Cfirst_publish_year%2Ccover_i"));
  assert.ok(calls[0].includes("limit=12"));
});

test("Open Library validation errors are not cached", async () => {
  let attempts = 0;
  const fetchImpl = async () => ({ ok: true, json: async () => ++attempts === 1 ? { docs: "invalid" } : { docs: [], numFound: 0 } });
  await assert.rejects(searchBooks("A", { fetchImpl }));
  assert.deepEqual(await searchBooks("A", { fetchImpl }), { books: [], total: 0, page: 1 });
  assert.equal(attempts, 2);
});

test("bookshelf shares collection across every filter, sort, page, dashboard and genre projection", async () => {
  await Promise.all([fetchBooksPage({ q: "лес", page: 1 }), fetchBooksPage({ status: "completed", sort: "year-desc", page: 2 }), fetchDashboard({ genre: "Роман" }), getBookCollection()]);
  assert.equal(reads, 1);
});

test("successful CRUD invalidates list, details, dashboard and genres", async () => {
  const initial = await fetchDashboard();
  await fetchBook(initialBooks[0].id);
  const created = await createBook({ ...initialBooks[0], title: "New", genre: "New genre", pages: 111 });
  assert.equal((await fetchDashboard()).stats.totalBooks, initial.stats.totalBooks + 1);
  assert.ok((await fetchBooksPage()).genres.includes("New genre"));
  assert.equal((await fetchBook(created.id)).title, "New");
  await updateBook(created.id, { title: "Edited", genre: "Edited genre", pages: 222 });
  assert.equal((await fetchBook(created.id)).title, "Edited");
  const changed = await fetchDashboard();
  assert.equal(changed.stats.totalPages, initial.stats.totalPages + 222);
  assert.ok(changed.genres.includes("Edited genre"));
  assert.ok(!changed.genres.includes("New genre"));
  await removeBook(created.id);
  await assert.rejects(fetchBook(created.id), /не найдена/);
  assert.equal((await fetchDashboard()).stats.totalBooks, initial.stats.totalBooks);
  assert.ok(!(await fetchBooksPage()).genres.includes("Edited genre"));
});

test("failed and cancelled mutations preserve valid cached snapshots and revision", async () => {
  await getBookCollection();
  const revision = bookshelfCache.getRevision();
  await assert.rejects(createBook({ title: "Invalid" }));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(removeBook(initialBooks[0].id, { signal: controller.signal }), { name: "AbortError" });
  assert.equal(bookshelfCache.getRevision(), revision);
  const before = reads;
  await getBookCollection();
  assert.equal(reads, before);
});
