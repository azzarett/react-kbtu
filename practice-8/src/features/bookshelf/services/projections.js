import { statuses } from "../constants/statuses.js";

export const BOOKS_PAGE_SIZE = 3;
export const BOOK_SORTS = [
  { value: "title-asc", label: "Название: А–Я" },
  { value: "title-desc", label: "Название: Я–А" },
  { value: "year-desc", label: "Сначала новые издания" },
  { value: "year-asc", label: "Сначала старые издания" },
  { value: "pages-asc", label: "Сначала короткие" },
  { value: "pages-desc", label: "Сначала длинные" },
];

const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });
const clean = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const lower = (value) => value.toLocaleLowerCase("ru-RU");

function validPage(value) {
  const raw = String(value ?? "1");
  const page = /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1;
}

function normalizeFilters(filters = {}) {
  return {
    q: clean(filters.q, 200),
    genre: clean(filters.genre, 80),
    status: statuses.some(({ value }) => value === filters.status) ? filters.status : "",
    sort: BOOK_SORTS.some(({ value }) => value === filters.sort) ? filters.sort : "title-asc",
    page: validPage(filters.page),
  };
}

export function parseBookFilters(input) {
  const params = input instanceof URLSearchParams ? input : new URLSearchParams(input);
  return normalizeFilters(Object.fromEntries(["q", "genre", "status", "sort", "page"].map((key) => [key, params.get(key)])));
}

function filterCollection(books, filters) {
  const query = lower(filters.q);
  const genre = lower(filters.genre);
  return books.filter((book) =>
    (!query || lower(book.title).includes(query) || lower(book.author).includes(query)) &&
    (!genre || lower(book.genre) === genre) &&
    (!filters.status || book.status === filters.status),
  );
}

function sortCollection(books, sort) {
  return [...books].sort((a, b) => {
    const titleOrder = collator.compare(a.title, b.title);
    const fallback = titleOrder || collator.compare(a.id, b.id);
    if (sort === "title-desc") return -titleOrder || collator.compare(a.id, b.id);
    if (sort === "year-desc") return b.year - a.year || fallback;
    if (sort === "year-asc") return a.year - b.year || fallback;
    if (sort === "pages-desc") return b.pages - a.pages || fallback;
    if (sort === "pages-asc") return a.pages - b.pages || fallback;
    return fallback;
  });
}

export function selectBooks(books, filters = {}, pageSize = BOOKS_PAGE_SIZE) {
  const normalized = normalizeFilters(filters);
  const size = Number.isSafeInteger(pageSize) && pageSize > 0 ? pageSize : BOOKS_PAGE_SIZE;
  const filtered = sortCollection(filterCollection(books, normalized), normalized.sort);
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(normalized.page, pageCount);
  return {
    books: filtered.slice((page - 1) * size, page * size),
    total: filtered.length,
    page,
    pageCount,
    pageSize: size,
  };
}

export function getBookGenres(books) {
  return [...new Set(books.map((book) => book.genre))].sort(collator.compare);
}

export function getBookStats(books, filters = {}) {
  const selected = filterCollection(books, normalizeFilters(filters));
  const totalBooks = selected.length;
  const totalPages = selected.reduce((sum, book) => sum + book.pages, 0);
  const statusCounts = statuses.map(({ value, label }) => ({
    value, label, count: selected.filter((book) => book.status === value).length,
  }));
  const completedBooks = statusCounts.find(({ value }) => value === "completed").count;
  return {
    totalBooks,
    totalPages,
    averagePages: totalBooks ? Math.round(totalPages / totalBooks) : 0,
    completedBooks,
    readingBooks: statusCounts.find(({ value }) => value === "reading").count,
    plannedBooks: statusCounts.find(({ value }) => value === "planned").count,
    completionRate: totalBooks ? Math.round(completedBooks / totalBooks * 100) : 0,
    uniqueAuthors: new Set(selected.map((book) => lower(book.author.trim()))).size,
    genres: getBookGenres(selected).map((genre) => ({
      value: genre, label: genre, count: selected.filter((book) => book.genre === genre).length,
    })).sort((a, b) => b.count - a.count || collator.compare(a.label, b.label)),
    statuses: statusCounts,
  };
}

export function getDashboardBooks(books, filters) {
  return sortCollection(filterCollection(books, normalizeFilters(filters)), "title-asc");
}

export function isBookId(id) {
  return typeof id === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id);
}
