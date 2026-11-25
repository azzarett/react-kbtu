import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCatalogBook, searchBooks } from "../services/service.js";

export const fetchCatalogSearch = createAsyncThunk(
  "catalog/fetchSearch",
  ({ query, page }, { signal }) => searchBooks(query, { page, signal }),
);

export const fetchCatalogBook = createAsyncThunk(
  "catalog/fetchBook",
  (workId, { signal }) => getCatalogBook(workId, { signal }),
);

const emptyRequest = { key: null, status: "idle", data: null, error: "", requestId: null };
const searchKey = ({ query, page }) => `${page}:${query.trim()}`;

function addRequestCases(builder, field, thunk, getKey) {
  builder
    .addCase(thunk.pending, (state, { meta }) => {
      state[field] = {
        ...emptyRequest,
        key: getKey(meta.arg),
        status: "loading",
        requestId: meta.requestId,
      };
    })
    .addCase(thunk.fulfilled, (state, { meta, payload }) => {
      const request = state[field];
      if (request.requestId !== meta.requestId) return;
      request.requestId = null;
      request.status = "success";
      request.data = payload;
    })
    .addCase(thunk.rejected, (state, { meta, error }) => {
      const request = state[field];
      if (request.requestId !== meta.requestId) return;
      request.requestId = null;
      request.status = meta.aborted ? "idle" : "error";
      request.error = meta.aborted ? "" : error.message;
    });
}

const catalogSlice = createSlice({
  name: "catalog",
  initialState: { search: { ...emptyRequest }, book: { ...emptyRequest } },
  reducers: {},
  extraReducers(builder) {
    addRequestCases(builder, "search", fetchCatalogSearch, searchKey);
    addRequestCases(builder, "book", fetchCatalogBook, (workId) => workId);
  },
});

export function selectCatalogSearch(state, query, page) {
  const request = state.catalog.search;
  return request.key === searchKey({ query, page }) ? request : emptyRequest;
}

export function selectCatalogBook(state, workId) {
  const request = state.catalog.book;
  return request.key === workId ? request : emptyRequest;
}

export default catalogSlice.reducer;
