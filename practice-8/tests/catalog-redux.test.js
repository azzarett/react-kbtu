import assert from "node:assert/strict";
import { test } from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import catalogReducer, {
  fetchCatalogBook,
  fetchCatalogSearch,
  selectCatalogBook,
  selectCatalogSearch,
} from "../src/features/catalog/state/catalog-slice.js";

function makeStore() {
  return configureStore({ reducer: { catalog: catalogReducer } });
}

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function searchResponse(title) {
  return response({ docs: [{ key: "/works/OL1W", title }], numFound: 1 });
}

test("catalog search tracks its query and page and ignores a superseded response", async (t) => {
  const store = makeStore();
  let resolveOld;
  const oldResponse = new Promise((resolve) => { resolveOld = resolve; });
  t.mock.method(globalThis, "fetch", (input) => new URL(input).searchParams.get("q") === "old"
    ? oldResponse
    : Promise.resolve(searchResponse("New result")));

  const oldRequest = store.dispatch(fetchCatalogSearch({ query: "old", page: 1 }));
  assert.equal(selectCatalogSearch(store.getState(), "old", 1).status, "loading");
  const newRequest = store.dispatch(fetchCatalogSearch({ query: "new", page: 2 }));
  assert.equal(selectCatalogSearch(store.getState(), "old", 1).status, "idle");
  await newRequest.unwrap();
  resolveOld(searchResponse("Old result"));
  await oldRequest.unwrap();

  const activeSearch = selectCatalogSearch(store.getState(), "new", 2);
  assert.equal(activeSearch.status, "success");
  assert.equal(activeSearch.data.books[0].title, "New result");
  assert.equal(activeSearch.data.page, 2);
  assert.equal(selectCatalogSearch(store.getState(), "new", 1).status, "idle");
});

test("catalog book maintains a serializable failure and retry reuses the Open Library cache", async (t) => {
  const store = makeStore();
  const fetchMock = t.mock.method(globalThis, "fetch", async () => response({ key: "/works/OL1W", title: "Found book" }));
  fetchMock.mock.mockImplementationOnce(async () => response({}, 404));

  await assert.rejects(store.dispatch(fetchCatalogBook("OL1W")).unwrap(), { message: /не найдены/ });
  const failed = selectCatalogBook(store.getState(), "OL1W");
  assert.equal(failed.status, "error");
  assert.match(failed.error, /не найдены/);
  assert.deepEqual(JSON.parse(JSON.stringify(store.getState())), store.getState());

  const retry = store.dispatch(fetchCatalogBook("OL1W"));
  assert.equal(selectCatalogBook(store.getState(), "OL1W").status, "loading");
  assert.equal(selectCatalogBook(store.getState(), "OL1W").error, "");
  await retry.unwrap();
  await store.dispatch(fetchCatalogBook("OL1W")).unwrap();
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(selectCatalogBook(store.getState(), "OL1W").data.title, "Found book");
  assert.equal(selectCatalogBook(store.getState(), "OL2W").status, "idle");
});

test("aborting a catalog dispatch detaches Redux without cancelling the shared transport", async (t) => {
  const store = makeStore();
  let resolveTransport;
  const transport = new Promise((resolve) => { resolveTransport = resolve; });
  const fetchMock = t.mock.method(globalThis, "fetch", () => transport);

  const abandoned = store.dispatch(fetchCatalogBook("OL1W"));
  abandoned.abort();
  await assert.rejects(abandoned.unwrap(), { name: "AbortError" });
  assert.equal(selectCatalogBook(store.getState(), "OL1W").status, "idle");
  assert.equal(selectCatalogBook(store.getState(), "OL1W").data, null);

  const remount = store.dispatch(fetchCatalogBook("OL1W"));
  resolveTransport(response({ key: "/works/OL1W", title: "Shared result" }));
  await remount.unwrap();
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(fetchMock.mock.calls[0].arguments[1].signal, undefined);
  assert.equal(selectCatalogBook(store.getState(), "OL1W").data.title, "Shared result");
});
