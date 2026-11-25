import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOKS_PAGE_SIZE, parseBookFilters, selectBooks, getBookGenres, getBookStats, getDashboardBooks, isBookId } from "../src/features/bookshelf/services/projections.js";

const defaults = { q: "", genre: "", status: "", sort: "title-asc", page: 1 };
const books = [
  { id: "b", title: "Beta", author: "Ada", genre: "Novel", status: "completed", year: 2020, pages: 200 },
  { id: "a", title: "Alpha", author: "Ada", genre: "Novel", status: "completed", year: 2022, pages: 100 },
  { id: "c", title: "Gamma", author: "Ben", genre: "Essay", status: "reading", year: 2021, pages: 300 },
  { id: "d", title: "Delta", author: "Ada", genre: "Novel", status: "planned", year: 2019, pages: 150 },
  { id: "e", title: "Epsilon", author: "Cora", genre: "Poetry", status: "completed", year: 2018, pages: 50 },
];
const ids = (rows) => rows.map(({ id }) => id);

test("URL filters normalize whitespace, allowed values and bounded text", () => {
  assert.equal(BOOKS_PAGE_SIZE, 3);
  assert.deepEqual(parseBookFilters(new URLSearchParams()), defaults);
  assert.deepEqual(parseBookFilters("?q=%20Ada%20&genre=%20Novel%20&status=completed&sort=year-desc&page=2"), {
    q: "Ada", genre: "Novel", status: "completed", sort: "year-desc", page: 2,
  });
  const long = parseBookFilters(new URLSearchParams({ q: "x".repeat(250), genre: "y".repeat(100) }));
  assert.equal(long.q.length, 200);
  assert.equal(long.genre.length, 80);
  for (const page of ["0", "-1", "1.5", "abc", "10001", "9007199254740992"]) {
    assert.deepEqual(parseBookFilters(`status=unknown&sort=unknown&page=${page}`), defaults);
  }
  assert.equal(parseBookFilters("page=10000").page, 10000);
  for (const sort of ["title-asc", "title-desc", "year-asc", "year-desc", "pages-asc", "pages-desc"]) {
    assert.equal(parseBookFilters(`sort=${sort}`).sort, sort);
  }
});

test("selection combines case-insensitive search and genre, status, sort and pagination", () => {
  const result = selectBooks(books, { q: "ADA", genre: "novel", status: "completed", sort: "year-desc", page: 2 }, 1);
  assert.deepEqual(result, { books: [books[0]], total: 2, page: 2, pageCount: 2, pageSize: 1 });
  assert.deepEqual(ids(selectBooks(books, { q: "AMM" }).books), ["c"]);
  assert.equal(selectBooks(books, { genre: "Nov" }).total, 0);
});

test("selection is immutable and safely clamps missing, invalid and empty pages", () => {
  const frozen = Object.freeze(books.map((book) => Object.freeze({ ...book })));
  const filters = Object.freeze({ sort: "invalid", page: -3 });
  assert.deepEqual(ids(selectBooks(frozen, filters).books), ["a", "b", "d"]);
  assert.deepEqual(ids(frozen), ["b", "a", "c", "d", "e"]);
  const last = selectBooks(frozen, { page: 99 });
  assert.deepEqual(ids(last.books), ["e", "c"]);
  assert.equal(last.page, 2);
  assert.equal(last.pageCount, 2);
  assert.deepEqual(selectBooks([], { page: 99 }), { books: [], total: 0, page: 1, pageCount: 1, pageSize: 3 });
});

test("all six sorts work and numeric ties use title then ID", () => {
  const expected = {
    "title-asc": ["a", "b", "d", "e", "c"], "title-desc": ["c", "e", "d", "b", "a"],
    "year-asc": ["e", "d", "b", "c", "a"], "year-desc": ["a", "c", "b", "d", "e"],
    "pages-asc": ["e", "a", "d", "b", "c"], "pages-desc": ["c", "b", "d", "a", "e"],
  };
  for (const [sort, ordered] of Object.entries(expected)) assert.deepEqual(ids(selectBooks(books, { sort }, 20).books), ordered);
  const tied = [
    { ...books[0], id: "z", title: "Same", year: 2020 },
    { ...books[0], id: "a", title: "Same", year: 2020 },
    { ...books[0], id: "x", title: "Alpha", year: 2020 },
  ];
  assert.deepEqual(ids(selectBooks(tied, { sort: "year-desc" }).books), ["x", "a", "z"]);
});

test("genres are sorted and unique without mutating the collection", () => {
  assert.deepEqual(getBookGenres(books), ["Essay", "Novel", "Poetry"]);
  assert.deepEqual(getBookGenres([]), []);
});

test("statistics aggregate real page counts, author counts, percentages and breakdowns", () => {
  const stats = getBookStats(books);
  for (const [key, value] of Object.entries({ totalBooks: 5, totalPages: 800, averagePages: 160, completedBooks: 3, readingBooks: 1, plannedBooks: 1, completionRate: 60, uniqueAuthors: 3 })) {
    assert.equal(stats[key], value, key);
  }
  assert.deepEqual(stats.genres, [
    { value: "Novel", label: "Novel", count: 3 },
    { value: "Essay", label: "Essay", count: 1 },
    { value: "Poetry", label: "Poetry", count: 1 },
  ]);
  assert.deepEqual(stats.statuses.map(({ value, count }) => ({ value, count })), [
    { value: "planned", count: 1 }, { value: "reading", count: 1 }, { value: "completed", count: 3 },
  ]);
  assert.ok(stats.statuses.every(({ label }) => typeof label === "string" && label.length > 0));
});

test("dashboard genre and status filters affect every statistic; empty results remain useful", () => {
  const stats = getBookStats(books, { genre: "novel", status: "completed" });
  for (const [key, value] of Object.entries({ totalBooks: 2, totalPages: 300, averagePages: 150, completedBooks: 2, readingBooks: 0, plannedBooks: 0, completionRate: 100, uniqueAuthors: 1 })) assert.equal(stats[key], value, key);
  assert.deepEqual(stats.genres, [{ value: "Novel", label: "Novel", count: 2 }]);
  assert.deepEqual(stats.statuses.map(({ count }) => count), [0, 0, 2]);
  const empty = getBookStats(books, { genre: "Absent" });
  for (const key of ["totalBooks", "totalPages", "averagePages", "completedBooks", "readingBooks", "plannedBooks", "completionRate", "uniqueAuthors"]) assert.equal(empty[key], 0, key);
  assert.deepEqual(empty.genres, []);
  assert.deepEqual(empty.statuses.map(({ count }) => count), [0, 0, 0]);
  assert.equal(getBookStats(books.slice(0, 3)).completionRate, 67);
  assert.equal(getBookStats([{ ...books[0], pages: 100 }, { ...books[1], pages: 101 }]).averagePages, 101);
});

test("dashboard books follow combined filters and are sorted by title", () => {
  assert.deepEqual(ids(getDashboardBooks(books, { genre: "novel", status: "completed" })), ["a", "b"]);
});

test("book routes accept simple IDs and reject malformed values", () => {
  for (const id of ["book-1", "a_b", "x".repeat(128)]) assert.equal(isBookId(id), true);
  for (const id of ["", " ", null, undefined, 1, "../book-1", "a/b", "a?b", "a#b", "%2f", "_bad", "x".repeat(129)]) {
    assert.equal(isBookId(id), false);
  }
});
