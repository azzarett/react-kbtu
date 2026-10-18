import { API_CONFIG, DATA_KEY } from "./settings.js";
import { initialBooks } from "./initial-books.js";
import { statuses } from "../constants/statuses.js";

function readBooks() {
  let saved;
  try {
    saved = localStorage.getItem(DATA_KEY);
  } catch {
    throw new Error(
      "Нет доступа к хранилищу браузера. Разрешите сохранение данных и повторите запрос.",
    );
  }
  if (saved === null) {
    const books = initialBooks.map((book) => ({
      ...book,
      updatedAt: new Date().toISOString(),
    }));
    writeBooks(books);
    return books;
  }
  try {
    const books = JSON.parse(saved);
    if (!Array.isArray(books)) throw new Error();
    const ids = new Set();
    for (const book of books) {
      validateBook(book);
      if (
        typeof book.id !== "string" ||
        !book.id ||
        ids.has(book.id) ||
        !Number.isFinite(Date.parse(book.updatedAt))
      )
        throw new Error();
      ids.add(book.id);
    }
    return books;
  } catch {
    throw new Error(
      "Не удалось прочитать сохранённую библиотеку. Данные повреждены; проверьте хранилище браузера.",
    );
  }
}

function writeBooks(books) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(books));
  } catch {
    throw new Error(
      "Не удалось сохранить изменения. Проверьте доступ к хранилищу и свободное место в браузере.",
    );
  }
}

function validateBook(book) {
  for (const field of [
    "title",
    "author",
    "genre",
    "language",
    "publisher",
    "description",
  ]) {
    if (typeof book[field] !== "string" || !book[field].trim())
      throw new Error("Заполните все поля книги.");
  }
  if (!Number.isInteger(book.pages) || book.pages < 1 || book.pages > 100000)
    throw new Error("Количество страниц должно быть от 1 до 100 000.");
  if (!Number.isInteger(book.year) || book.year < 1 || book.year > 2100)
    throw new Error("Год должен быть от 1 до 2100.");
  if (!statuses.some(({ value }) => value === book.status))
    throw new Error("Выберите статус книги.");
}

// Read and write when the delayed request completes: no stale DB snapshot.
// Aborting a pending mutation cancels it before it changes storage.
function request(operation, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request aborted", "AbortError"));
      return;
    }
    const delay =
      API_CONFIG.minDelay +
      Math.random() * (API_CONFIG.maxDelay - API_CONFIG.minDelay);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      try {
        if (Math.random() < API_CONFIG.errorChance)
          throw new Error("Сервер временно недоступен. Попробуйте ещё раз.");
        resolve(operation());
      } catch (error) {
        reject(error);
      }
    }, delay);
    function abort() {
      clearTimeout(timer);
      reject(new DOMException("Request aborted", "AbortError"));
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export function toBookSummary({ id, title, author, genre, status }) {
  return { id, title, author, genre, status };
}

export function getBooks(options) {
  return request(() => readBooks().map(toBookSummary), options);
}

export function getBook(id, options) {
  return request(() => {
    const book = readBooks().find((item) => item.id === id);
    if (!book) throw new Error("Книга не найдена. Обновите список.");
    return book;
  }, options);
}

export function createBook(values, options) {
  return request(() => {
    validateBook(values);
    const books = readBooks();
    const book = {
      ...values,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    writeBooks([...books, book]);
    return book;
  }, options);
}

export function updateBook(id, changes, options) {
  return request(() => {
    const books = readBooks();
    const current = books.find((book) => book.id === id);
    if (!current) throw new Error("Книга не найдена. Обновите список.");
    const updated = {
      ...current,
      ...changes,
      id,
      updatedAt: new Date().toISOString(),
    };
    validateBook(updated);
    writeBooks(books.map((book) => (book.id === id ? updated : book)));
    return updated;
  }, options);
}

export function removeBook(id, options) {
  return request(() => {
    const books = readBooks();
    if (!books.some((book) => book.id === id))
      throw new Error("Книга не найдена. Обновите список.");
    writeBooks(books.filter((book) => book.id !== id));
    return { id };
  }, options);
}
