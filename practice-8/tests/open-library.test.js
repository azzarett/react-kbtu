import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG_PAGE_SIZE,
  OpenLibraryError,
  getCatalogBook,
  normalizeCatalogBook,
  normalizeSearchBook,
  normalizeWorkId,
  searchBooks,
} from "../src/features/catalog/services/open-library.js";

const searchDocument = {
  key: "/works/OL45804W",
  title: "Fantastic Mr. Fox",
  author_name: ["Roald Dahl"],
  first_publish_year: 1970,
  cover_i: 12345,
};
const workDocument = {
  key: "/works/OL45804W",
  title: "Fantastic Mr. Fox",
  description: { type: "/type/text", value: "A story about a fox." },
  subjects: ["Fiction", "Foxes"],
  first_publish_date: "1970",
  covers: [12345],
};

function ok(data) {
  return async () => ({ ok: true, status: 200, json: async () => data });
}

function neverFetch() {
  assert.fail("Invalid or empty input must not make a request");
}

test("search uses a read-only HTTPS request, required fields, page size and isolated subscriber signal", async () => {
  const controller = new AbortController();
  const calls = [];
  const result = await searchBooks("  fox  ", {
    page: 2,
    signal: controller.signal,
    fetchImpl: async (...args) => {
      calls.push(args);
      return { ok: true, status: 200, json: async () => ({ docs: [searchDocument], numFound: 37 }) };
    },
  });
  assert.equal(calls.length, 1);
  const [input, options] = calls[0];
  const url = new URL(input);
  assert.equal(url.origin, "https://openlibrary.org");
  assert.equal(url.pathname, "/search.json");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    q: "fox",
    fields: "key,title,author_name,first_publish_year,cover_i",
    limit: "12",
    page: "2",
  });
  assert.equal(CATALOG_PAGE_SIZE, 12);
  assert.deepEqual(options, { method: "GET", headers: { Accept: "application/json" }, signal: undefined });
  assert.deepEqual(result, {
    books: [{ id: "OL45804W", title: "Fantastic Mr. Fox", authors: ["Roald Dahl"], year: 1970, coverId: 12345 }],
    total: 37,
    page: 2,
  });
});

test("search encodes user input without letting it inject URL parameters", async () => {
  const query = "Война & мир? #=+ /100% 📚";
  await searchBooks(query, {
    fetchImpl: async (input) => {
      const url = new URL(input);
      assert.equal(url.searchParams.get("q"), query);
      assert.equal(url.searchParams.get("page"), "1");
      assert.equal(url.searchParams.size, 4);
      assert.equal(url.hash, "");
      return { ok: true, status: 200, json: async () => ({ docs: [], numFound: 0 }) };
    },
  });
});

test("empty searches do not fetch and keep the requested page", async () => {
  for (const query of ["", " \t\n "]) {
    assert.deepEqual(await searchBooks(query, { page: 3, fetchImpl: neverFetch }), { books: [], total: 0, page: 3 });
  }
});

test("invalid query types and invalid pages are rejected before fetching", async () => {
  for (const query of [undefined, null, 123, {}, []]) {
    await assert.rejects(searchBooks(query, { fetchImpl: neverFetch }), /Введите название/);
  }
  for (const page of [0, -1, 1.2, "2", null, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(searchBooks("fox", { page, fetchImpl: neverFetch }), /Номер страницы/);
  }
});

test("legacy num_found is supported and an explicit zero total is preserved", async () => {
  assert.equal((await searchBooks("fox", { fetchImpl: ok({ docs: [], num_found: 23 }) })).total, 23);
  assert.equal((await searchBooks("fox", { fetchImpl: ok({ docs: [], numFound: 0, num_found: 23 }) })).total, 0);
});

test("missing optional search metadata is not fabricated", () => {
  assert.deepEqual(normalizeSearchBook({ key: "OL1W", title: "Title" }), {
    id: "OL1W", title: "Title", authors: [], year: null, coverId: null,
  });
  assert.deepEqual(normalizeSearchBook({ key: "OL1W", title: " Title ", author_name: [" A ", null, 2, "", "  "], first_publish_year: "1970", cover_i: -1 }), {
    id: "OL1W", title: "Title", authors: ["A"], year: null, coverId: null,
  });
  assert.equal(normalizeSearchBook({ ...searchDocument, first_publish_year: -400 }).year, -400);
});

test("search numeric metadata rejects non-integers, non-numbers and unsafe numbers", () => {
  for (const value of [null, undefined, "12", {}, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const book = normalizeSearchBook({ ...searchDocument, cover_i: value, first_publish_year: value });
    assert.equal(book.year, null);
    assert.equal(book.coverId, null);
  }
  assert.equal(normalizeSearchBook({ ...searchDocument, cover_i: 0 }).coverId, null);
  assert.deepEqual(normalizeSearchBook({ ...searchDocument, author_name: "Author" }).authors, []);
});

test("malformed search envelope and totals report an explicit format error", async () => {
  for (const data of [null, [], "text", {}, { docs: {}, numFound: 1 }, { docs: [] },
    ...[-1, 1.2, "1", Infinity, NaN, Number.MAX_SAFE_INTEGER + 1].map((numFound) => ({ docs: [], numFound }))]) {
    await assert.rejects(searchBooks("fox", { fetchImpl: ok(data) }), /неожиданном формате/);
  }
});

test("malformed search records are rejected instead of inventing usable books", async () => {
  for (const doc of [null, [], {}, { key: "OL1W" }, { key: "OL1W", title: " " },
    { key: "OL1M", title: "Edition" }, { key: "OL1W", title: 7 }]) {
    await assert.rejects(searchBooks("fox", { fetchImpl: ok({ docs: [doc], numFound: 1 }) }), /неожиданном формате/);
  }
});

test("work IDs allow only strict work identifiers and the optional /works/ prefix", () => {
  assert.equal(normalizeWorkId("OL123W"), "OL123W");
  assert.equal(normalizeWorkId("/works/OL123W"), "OL123W");
  for (const id of [undefined, null, 1, {}, "", " OL1W", "OL1W ", "OL1W\n", "ol1w", "OL1M", "OLW",
    "OL-1W", "/works/OL1W.json", "/works/OL1W/title", "https://openlibrary.org/works/OL1W",
    "OL1W?x=1", "OL1W#part", "../OL1W", "/works//works/OL1W"]) {
    assert.throws(() => normalizeWorkId(id), /Некорректный идентификатор/);
  }
});

test("invalid work IDs never reach the network", async () => {
  await assert.rejects(getCatalogBook("../../authors/OL1A", { fetchImpl: neverFetch }), /Некорректный идентификатор/);
});

test("work details request the correct public JSON endpoint with a GET", async () => {
  const controller = new AbortController();
  let calls = 0;
  const book = await getCatalogBook("/works/OL45804W", {
    signal: controller.signal,
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.equal(url, "https://openlibrary.org/works/OL45804W.json");
      assert.deepEqual(options, { method: "GET", headers: { Accept: "application/json" }, signal: undefined });
      return { ok: true, status: 200, json: async () => workDocument };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(book, {
    id: "OL45804W", title: "Fantastic Mr. Fox", description: "A story about a fox.",
    subjects: ["Fiction", "Foxes"], firstPublishDate: "1970", coverId: 12345,
    sourceUrl: "https://openlibrary.org/works/OL45804W",
  });
});

test("work description supports strings and text objects, with empty text when missing", () => {
  for (const description of ["  Description.  ", { value: "  Description.  " }]) {
    assert.equal(normalizeCatalogBook({ ...workDocument, description }).description, "Description.");
  }
  for (const description of [undefined, null, [], 8, {}, { value: 8 }]) {
    assert.equal(normalizeCatalogBook({ ...workDocument, description }).description, "");
  }
});

test("work normalization keeps missing metadata empty and finds the first valid cover", () => {
  assert.deepEqual(normalizeCatalogBook({ key: "OL1W", title: "Title" }), {
    id: "OL1W", title: "Title", description: "", subjects: [], firstPublishDate: null,
    coverId: null, sourceUrl: "https://openlibrary.org/works/OL1W",
  });
  const book = normalizeCatalogBook({ ...workDocument, covers: [-1, 0, "42", null, 2.5, 42, 43], subjects: [" Subject ", 2, null, " "], first_publish_date: "  1970  " });
  assert.equal(book.coverId, 42);
  assert.deepEqual(book.subjects, ["Subject"]);
  assert.equal(book.firstPublishDate, "1970");
  for (const first_publish_date of [undefined, null, " ", 1970, {}]) {
    assert.equal(normalizeCatalogBook({ ...workDocument, first_publish_date }).firstPublishDate, null);
  }
});

test("malformed or mismatched work responses are not shown as the requested book", async () => {
  for (const data of [null, [], {}, { ...workDocument, key: "OL999W" },
    { ...workDocument, title: "" }, { ...workDocument, key: "/books/OL45804M" }]) {
    await assert.rejects(getCatalogBook("OL45804W", { fetchImpl: ok(data) }), /неожиданном формате/);
  }
});

for (const [label, invoke] of [
  ["search", (options) => searchBooks("fox", options)],
  ["work", (options) => getCatalogBook("OL45804W", options)],
]) {
  test(`${label}: HTTP errors preserve status and do not parse the error body`, async () => {
    for (const [status, message] of [[404, /не найдены/], [429, /ограничила число запросов/], [500, /HTTP 500/], [403, /HTTP 403/]]) {
      await assert.rejects(invoke({ fetchImpl: async () => ({ ok: false, status, json: neverFetch }) }), (error) => {
        assert.ok(error instanceof OpenLibraryError);
        assert.equal(error.status, status);
        assert.match(error.message, message);
        return true;
      });
    }
  });

  test(`${label}: network errors are actionable and preserve the original cause`, async () => {
    const cause = new TypeError("Failed to fetch");
    await assert.rejects(invoke({ fetchImpl: async () => { throw cause; } }), (error) => {
      assert.match(error.message, /Проверьте подключение/);
      assert.equal(error.cause, cause);
      return true;
    });
  });

  test(`${label}: invalid JSON reports parsing failure`, async () => {
    const cause = new SyntaxError("Unexpected token");
    await assert.rejects(invoke({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw cause; } }) }), (error) => {
      assert.match(error.message, /некорректный JSON/);
      assert.equal(error.cause, cause);
      return true;
    });
  });

  test(`${label}: absent fetch and invalid fetch responses report clear errors`, async () => {
    await assert.rejects(invoke({ fetchImpl: null }), /недоступна загрузка/);
    for (const response of [undefined, null, {}, { ok: "true", json() {} }, { ok: true }]) {
      await assert.rejects(invoke({ fetchImpl: async () => response }), /неожиданном формате/);
    }
  });

  test(`${label}: already aborted signals reject without any request`, async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(invoke({ signal: controller.signal, fetchImpl: neverFetch }), (error) => error === controller.signal.reason);
  });

  test(`${label}: fetch and JSON AbortErrors pass through unchanged`, async () => {
    const abort = new DOMException("Cancelled", "AbortError");
    await assert.rejects(invoke({ fetchImpl: async () => { throw abort; } }), (error) => error === abort);
    await assert.rejects(invoke({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw abort; } }) }), (error) => error === abort);
  });

  test(`${label}: cancellation after fetch and during parsing wins over stale results`, async () => {
    const beforeParse = new AbortController();
    await assert.rejects(invoke({ signal: beforeParse.signal, fetchImpl: async () => {
      beforeParse.abort();
      return { ok: true, status: 200, json: neverFetch };
    } }), { name: "AbortError" });

    const duringParse = new AbortController();
    await assert.rejects(invoke({ signal: duringParse.signal, fetchImpl: async () => ({
      ok: true, status: 200, json: async () => {
        duringParse.abort();
        return label === "search" ? { docs: [searchDocument], numFound: 1 } : workDocument;
      },
    }) }), { name: "AbortError" });
  });
}

test("normalization does not mutate the original API objects or arrays", () => {
  const source = Object.freeze({
    ...searchDocument, author_name: Object.freeze([" Author "]),
  });
  const detail = Object.freeze({
    ...workDocument, subjects: Object.freeze([" Subject "]), covers: Object.freeze([-1, 12345]),
    description: Object.freeze({ value: " Text " }),
  });
  assert.equal(normalizeSearchBook(source).authors[0], "Author");
  assert.equal(source.author_name[0], " Author ");
  assert.equal(normalizeCatalogBook(detail).description, "Text");
  assert.equal(detail.description.value, " Text ");
});
