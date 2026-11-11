import { createQueryCache } from "../../../common/cache/query-cache.js";

// Separate injected transports (including tests) never share response data.
const caches = new WeakMap();
function cacheFor(fetchImpl) {
  if (typeof fetchImpl !== "function") throw new OpenLibraryError("В этом браузере недоступна загрузка данных Open Library.");
  if (!caches.has(fetchImpl)) caches.set(fetchImpl, createQueryCache());
  return caches.get(fetchImpl);
}

const API_ORIGIN = "https://openlibrary.org";
const SEARCH_FIELDS = "key,title,author_name,first_publish_year,cover_i";

export const CATALOG_PAGE_SIZE = 12;

export class OpenLibraryError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, { cause });
    this.name = "OpenLibraryError";
    if (status !== undefined) this.status = status;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidResponse() {
  return new OpenLibraryError("Open Library вернула данные в неожиданном формате.");
}

export function normalizeWorkId(value) {
  if (typeof value !== "string" || !/^(?:\/works\/)?OL\d+W$/.test(value)) {
    throw new OpenLibraryError("Некорректный идентификатор книги Open Library.");
  }
  return value.replace(/^\/works\//, "");
}

function readWorkId(value) {
  try {
    return normalizeWorkId(value);
  } catch {
    throw invalidResponse();
  }
}

function readTitle(value) {
  if (typeof value !== "string" || !value.trim()) throw invalidResponse();
  return value.trim();
}

function stringsOnly(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];
}

function validCoverId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function normalizeSearchBook(value) {
  if (!isRecord(value)) throw invalidResponse();
  return {
    id: readWorkId(value.key),
    title: readTitle(value.title),
    authors: stringsOnly(value.author_name),
    year: Number.isSafeInteger(value.first_publish_year) ? value.first_publish_year : null,
    coverId: validCoverId(value.cover_i) ? value.cover_i : null,
  };
}

export function normalizeCatalogBook(value) {
  if (!isRecord(value)) throw invalidResponse();
  const id = readWorkId(value.key);
  const description = typeof value.description === "string"
    ? value.description
    : isRecord(value.description) && typeof value.description.value === "string"
      ? value.description.value
      : "";

  return {
    id,
    title: readTitle(value.title),
    description: description.trim(),
    subjects: stringsOnly(value.subjects),
    firstPublishDate: typeof value.first_publish_date === "string" && value.first_publish_date.trim()
      ? value.first_publish_date.trim()
      : null,
    coverId: Array.isArray(value.covers) ? value.covers.find(validCoverId) ?? null : null,
    sourceUrl: `${API_ORIGIN}/works/${id}`,
  };
}

function checkAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Запрос отменён.", "AbortError");
  }
}

function httpError(status) {
  if (status === 429) {
    return new OpenLibraryError(
      "Open Library временно ограничила число запросов. Попробуйте немного позже.",
      { status },
    );
  }
  if (status === 404) {
    return new OpenLibraryError("Книга или ресурс не найдены в Open Library.", { status });
  }
  return new OpenLibraryError(`Не удалось загрузить данные Open Library (HTTP ${status}).`, { status });
}

async function requestJson(url, { signal, fetchImpl }) {
  checkAborted(signal);
  if (typeof fetchImpl !== "function") {
    throw new OpenLibraryError("В этом браузере недоступна загрузка данных Open Library.");
  }

  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    checkAborted(signal);
    throw new OpenLibraryError(
      "Не удалось связаться с Open Library. Проверьте подключение и повторите попытку.",
      { cause: error },
    );
  }
  checkAborted(signal);
  if (!response || typeof response.ok !== "boolean" || typeof response.json !== "function") {
    throw invalidResponse();
  }
  if (!response.ok) throw httpError(response.status);

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    checkAborted(signal);
    throw new OpenLibraryError("Open Library вернула некорректный JSON. Повторите попытку позже.", { cause: error });
  }
  checkAborted(signal);
  return data;
}

// Only public read endpoints are used; this service never changes the remote catalog.
export async function searchBooks(query, { page = 1, signal, fetchImpl = globalThis.fetch } = {}) {
  if (typeof query !== "string") {
    throw new OpenLibraryError("Введите название книги или имя автора для поиска.");
  }
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new OpenLibraryError("Номер страницы должен быть положительным целым числом.");
  }
  checkAborted(signal);
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return { books: [], total: 0, page };

  const url = new URL("/search.json", API_ORIGIN);
  url.search = new URLSearchParams({
    q: trimmedQuery,
    fields: SEARCH_FIELDS,
    limit: String(CATALOG_PAGE_SIZE),
    page: String(page),
  }).toString();
  return cacheFor(fetchImpl).get(["open-library", url.toString()], async () => {
    const data = await requestJson(url.toString(), { fetchImpl });
    if (!isRecord(data) || !Array.isArray(data.docs)) throw invalidResponse();
    // Both names appear in the official Search API response documentation.
    const total = data.numFound ?? data.num_found;
    if (!Number.isSafeInteger(total) || total < 0) throw invalidResponse();
    return { books: data.docs.map(normalizeSearchBook), total, page };
  }, { signal });
}

export async function getCatalogBook(workId, { signal, fetchImpl = globalThis.fetch } = {}) {
  checkAborted(signal);
  const id = normalizeWorkId(workId);
  const url = `${API_ORIGIN}/works/${id}.json`;
  return cacheFor(fetchImpl).get(["open-library", url], async () => {
    const data = await requestJson(url, { fetchImpl });
    const book = normalizeCatalogBook(data);
    if (book.id !== id) throw invalidResponse();
    return book;
  }, { signal });
}
