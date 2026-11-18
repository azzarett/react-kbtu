import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  removeBook,
} from "../src/features/bookshelf/api/books-api.js";
import {
  API_CONFIG,
  DATA_KEY,
} from "../src/features/bookshelf/api/settings.js";
import { initialBooks } from "../src/features/bookshelf/api/initial-books.js";

const defaultConfig = { ...API_CONFIG };
let storage;

beforeEach(() => {
  storage = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  Object.assign(API_CONFIG, { minDelay: 0, maxDelay: 0, errorChance: 0 });
});

afterEach(() => {
  Object.assign(API_CONFIG, defaultConfig);
  delete globalThis.localStorage;
});

test("list returns summaries; details load additional meaningful fields", async () => {
  const list = await getBooks();
  assert.equal(list.length, 4);
  assert.equal(list[0].description, undefined);
  assert.equal(list[0].pages, undefined);
  const book = await getBook(list[0].id);
  for (const field of [
    "title",
    "author",
    "genre",
    "year",
    "pages",
    "language",
    "publisher",
    "description",
    "status",
  ])
    assert.ok(book[field]);
});

test("create, edit, complete and remove persist; an empty library stays empty", async () => {
  const created = await createBook({
    ...initialBooks[0],
    title: "Новая книга",
  });
  assert.notEqual(created.id, initialBooks[0].id);
  await updateBook(created.id, {
    title: "Новое название",
    status: "completed",
  });
  assert.equal((await getBook(created.id)).title, "Новое название");
  assert.equal((await getBook(created.id)).status, "completed");
  for (const book of await getBooks()) await removeBook(book.id);
  assert.deepEqual(await getBooks(), []);
  assert.equal(storage.get(DATA_KEY), "[]");
});

test("out-of-order writes affect captured IDs and preserve other updates", async () => {
  await getBooks();
  Object.assign(API_CONFIG, { minDelay: 30, maxDelay: 30 });
  const slow = updateBook("book-1", { status: "completed" });
  Object.assign(API_CONFIG, { minDelay: 0, maxDelay: 0 });
  const fast = updateBook("book-2", { title: "Изменённое название" });
  await Promise.all([slow, fast]);
  assert.equal((await getBook("book-1")).status, "completed");
  assert.equal((await getBook("book-2")).title, "Изменённое название");
});

test("aborted reads and writes reject without modifying storage", async () => {
  await getBooks();
  const before = storage.get(DATA_KEY);
  Object.assign(API_CONFIG, { minDelay: 30, maxDelay: 30 });
  const controller = new AbortController();
  const write = updateBook(
    "book-1",
    { status: "completed" },
    { signal: controller.signal },
  );
  const read = getBook("book-1", { signal: controller.signal });
  controller.abort();
  await assert.rejects(write, { name: "AbortError" });
  await assert.rejects(read, { name: "AbortError" });
  await assert.rejects(getBooks({ signal: controller.signal }), {
    name: "AbortError",
  });
  assert.equal(storage.get(DATA_KEY), before);
});

test("simulated errors do not save mutations and allow a retry", async () => {
  await getBooks();
  const before = storage.get(DATA_KEY);
  API_CONFIG.errorChance = 1;
  await assert.rejects(updateBook("book-1", { status: "completed" }), /Сервер/);
  assert.equal(storage.get(DATA_KEY), before);
  API_CONFIG.errorChance = 0;
  assert.equal(
    (await updateBook("book-1", { status: "completed" })).status,
    "completed",
  );
});

test("invalid input, missing IDs and corrupted storage report errors", async () => {
  await assert.rejects(
    createBook({ ...initialBooks[0], title: " " }),
    /Заполните/,
  );
  await assert.rejects(
    createBook({ ...initialBooks[0], pages: -1 }),
    /страниц/,
  );
  await assert.rejects(getBook("missing"), /не найдена/);
  await assert.rejects(
    updateBook("missing", { status: "completed" }),
    /не найдена/,
  );
  storage.set(DATA_KEY, "not json");
  await assert.rejects(getBooks(), /повреждены/);
  assert.equal(storage.get(DATA_KEY), "not json");
});

test("storage failures are surfaced instead of reporting false success", async () => {
  await getBooks();
  localStorage.setItem = () => {
    throw new Error("QuotaExceededError");
  };
  await assert.rejects(removeBook("book-1"), /Не удалось сохранить/);
  localStorage.getItem = () => {
    throw new Error("SecurityError");
  };
  await assert.rejects(getBooks(), /Нет доступа/);
});
