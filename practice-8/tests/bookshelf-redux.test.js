import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import { initialBooks } from "../src/features/bookshelf/api/initial-books.js";
import { API_CONFIG, DATA_KEY } from "../src/features/bookshelf/api/settings.js";
import { parseBookFilters } from "../src/features/bookshelf/services/projections.js";
import { bookshelfReducer, loadBooks, saveBook } from "../src/features/bookshelf/state/bookshelf-slice.js";
import {
  selectBookCollection,
  selectBookDetails,
  selectBookGenres,
  selectBookSummaries,
  selectBooksPage,
  selectDashboard,
} from "../src/features/bookshelf/state/bookshelf-selectors.js";

const defaultConfig = { ...API_CONFIG };
const seededBooks = initialBooks.map((book) => ({ ...book, updatedAt: "2026-11-06T08:00:00.000Z" }));
let store, originalStorage, storage, reads;

beforeEach(() => {
  store = configureStore({ reducer: { bookshelf: bookshelfReducer } });
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  storage = new Map([[DATA_KEY, JSON.stringify(seededBooks)]]);
  reads = 0;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key) {
        reads++;
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    },
  });
  Object.assign(API_CONFIG, { minDelay: 0, maxDelay: 0, errorChance: 0 });
});

afterEach(() => {
  Object.assign(API_CONFIG, defaultConfig);
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
});

test("one request supplies memoized shelf, detail, page and dashboard projections", async () => {
  const first = store.dispatch(loadBooks());
  const second = store.dispatch(loadBooks());
  assert.equal(store.getState().bookshelf.status, "loading");
  assert.equal((await second).meta.condition, true);
  await first.unwrap();

  const state = store.getState();
  const otherState = { ...state, unrelated: { enabled: true } };
  const pageFilters = parseBookFilters("q=мураками&sort=pages-desc&page=2");
  const dashboardFilters = parseBookFilters("status=completed");
  const page = selectBooksPage(state, pageFilters);
  const dashboard = selectDashboard(state, dashboardFilters);
  assert.strictEqual(selectBooksPage(otherState, { ...pageFilters }), page);
  assert.strictEqual(selectDashboard(otherState, { ...dashboardFilters, sort: "year-desc" }), dashboard);
  assert.strictEqual(selectBookDetails(state, "book-1"), page.books[0]);
  assert.equal(page.books[0].title, "Норвежский лес");
  assert.equal(page.page, 1);
  assert.equal(dashboard.stats.totalPages, 96);
  assert.equal(selectBookSummaries(state).length, 4);
  assert.ok(selectBookGenres(state).includes("Роман"));

  assert.equal((await store.dispatch(loadBooks())).meta.condition, true);
  assert.equal(reads, 1);
});

test("a stale collection is refreshed on the next load", async (t) => {
  let now = 1000;
  t.mock.method(Date, "now", () => now);
  await store.dispatch(loadBooks()).unwrap();
  const { expiresAt } = store.getState().bookshelf;
  now = expiresAt - 1;
  assert.equal((await store.dispatch(loadBooks())).meta.condition, true);
  const books = JSON.parse(storage.get(DATA_KEY));
  books[0].title = "Changed in another tab";
  storage.set(DATA_KEY, JSON.stringify(books));
  now = expiresAt;
  await store.dispatch(loadBooks()).unwrap();
  assert.equal(selectBookDetails(store.getState(), "book-1").title, "Changed in another tab");
  assert.equal(reads, 2);
});

test("writes replace every derived view with the saved snapshot without another read", async () => {
  await store.dispatch(loadBooks()).unwrap();
  const externalBooks = JSON.parse(storage.get(DATA_KEY));
  externalBooks[0].pages = 999;
  storage.set(DATA_KEY, JSON.stringify(externalBooks));
  const draft = { ...initialBooks[0], title: "New Book", genre: "New Genre", pages: 20 };
  const { book } = await store.dispatch(saveBook({ kind: "create", title: draft.title, values: draft })).unwrap();
  const filters = parseBookFilters("genre=New+Genre");
  assert.equal(selectBooksPage(store.getState(), filters).books[0].id, book.id);
  assert.equal(selectBookDetails(store.getState(), "book-1").pages, 999);
  assert.equal(reads, 2);

  await store.dispatch(saveBook({ kind: "edit", id: book.id, values: { title: "Revised" } })).unwrap();
  assert.equal(selectBookDetails(store.getState(), book.id).title, "Revised");
  await store.dispatch(saveBook({ kind: "complete", id: book.id, values: { status: "completed" } })).unwrap();
  assert.equal(selectDashboard(store.getState(), filters).stats.completionRate, 100);
  await store.dispatch(saveBook({ kind: "remove", id: book.id })).unwrap();
  assert.equal(selectBookDetails(store.getState(), book.id), undefined);
  assert.equal(selectDashboard(store.getState(), filters).stats.totalBooks, 0);
  assert.ok(!selectBookGenres(store.getState()).includes("New Genre"));
  assert.equal(reads, 5);
});

test("only the newest read can replace data and a successful write invalidates an older read", async () => {
  const startingPayload = { books: seededBooks, expiresAt: 1 };
  store.dispatch(loadBooks.pending("older", { force: true }));
  store.dispatch(loadBooks.pending("current", { force: true }));
  store.dispatch(loadBooks.rejected(new Error("stale error"), "older", { force: true }));
  assert.equal(store.getState().bookshelf.error, "");
  assert.equal(store.getState().bookshelf.requestId, "current");
  store.dispatch(loadBooks.fulfilled(startingPayload, "current", { force: true }));
  assert.strictEqual(selectBookCollection(store.getState()), seededBooks);

  store.dispatch(loadBooks.pending("pre-write", { force: true }));
  await store.dispatch(saveBook({ kind: "edit", id: "book-1", values: { title: "Latest saved title" } })).unwrap();
  store.dispatch(loadBooks.fulfilled(startingPayload, "pre-write", { force: true }));
  assert.equal(selectBookDetails(store.getState(), "book-1").title, "Latest saved title");
  assert.equal(store.getState().bookshelf.status, "success");
});

test("load errors can be retried, while failed and aborted writes preserve the collection", async () => {
  API_CONFIG.errorChance = 1;
  await assert.rejects(store.dispatch(loadBooks()).unwrap(), { message: /Сервер/ });
  assert.equal(store.getState().bookshelf.status, "error");
  API_CONFIG.errorChance = 0;
  await store.dispatch(loadBooks({ force: true })).unwrap();
  const books = selectBookCollection(store.getState());
  const saved = storage.get(DATA_KEY);

  const mutation = store.dispatch(saveBook({ kind: "remove", id: "book-1" }));
  assert.ok(store.getState().bookshelf.mutation);
  assert.equal((await store.dispatch(saveBook({ kind: "remove", id: "book-2" }))).meta.condition, true);
  mutation.abort();
  assert.equal((await mutation).meta.aborted, true);
  API_CONFIG.errorChance = 1;
  await assert.rejects(store.dispatch(saveBook({ kind: "remove", id: "book-1" })).unwrap(), { message: /Сервер/ });
  assert.strictEqual(selectBookCollection(store.getState()), books);
  assert.equal(storage.get(DATA_KEY), saved);
  assert.equal(store.getState().bookshelf.status, "success");
  assert.equal(store.getState().bookshelf.mutation, null);
});
