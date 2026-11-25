import { test } from "node:test";
import assert from "node:assert/strict";
import { searchBooks, getCatalogBook } from "../src/features/catalog/services/service.js";

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
