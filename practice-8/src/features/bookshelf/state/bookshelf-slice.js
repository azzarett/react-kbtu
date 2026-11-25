import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_CACHE_TTL } from "../../../common/cache/query-cache.js";
import { createBook, getBookCollection, removeBook, updateBook } from "../api/books-api.js";

export const loadBooks = createAsyncThunk(
  "bookshelf/load",
  async (_, { signal }) => ({
    books: await getBookCollection({ signal }),
    expiresAt: Date.now() + DEFAULT_CACHE_TTL,
  }),
  {
    condition: ({ force = false } = {}, { getState }) => {
      const { status, mutation, expiresAt } = getState().bookshelf;
      if (mutation) return false;
      if (force) return true;
      return status !== "loading" && (status !== "success" || Date.now() >= expiresAt);
    },
  },
);

export const saveBook = createAsyncThunk(
  "bookshelf/save",
  async ({ kind, id, values }, { signal }) => {
    const options = { signal, includeCollection: true };
    const result = kind === "create"
      ? await createBook(values, options)
      : kind === "remove"
        ? await removeBook(id, options)
        : await updateBook(id, values, options);
    return { ...result, expiresAt: Date.now() + DEFAULT_CACHE_TTL };
  },
  { condition: (_, { getState }) => getState().bookshelf.mutation === null },
);

const initialState = {
  books: [],
  status: "idle",
  error: "",
  expiresAt: 0,
  requestId: null,
  mutation: null,
};

function receiveCollection(state, books, expiresAt) {
  state.books = books;
  state.expiresAt = expiresAt;
  state.status = "success";
  state.error = "";
  state.requestId = null;
}

const bookshelfSlice = createSlice({
  name: "bookshelf",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadBooks.pending, (state, { meta }) => {
        state.status = "loading";
        state.error = "";
        state.requestId = meta.requestId;
      })
      .addCase(loadBooks.fulfilled, (state, { payload, meta }) => {
        if (state.requestId !== meta.requestId) return;
        receiveCollection(state, payload.books, payload.expiresAt);
      })
      .addCase(loadBooks.rejected, (state, { error, meta }) => {
        if (state.requestId !== meta.requestId) return;
        state.status = meta.aborted ? "idle" : "error";
        state.error = meta.aborted ? "" : error.message;
        state.requestId = null;
      })
      .addCase(saveBook.pending, (state, { meta }) => {
        state.mutation = { requestId: meta.requestId, title: meta.arg.title };
      })
      .addCase(saveBook.fulfilled, (state, { payload, meta }) => {
        if (state.mutation?.requestId !== meta.requestId) return;
        // The saved snapshot supersedes any read already in flight.
        receiveCollection(state, payload.collection, payload.expiresAt);
        state.mutation = null;
      })
      .addCase(saveBook.rejected, (state, { meta }) => {
        if (state.mutation?.requestId === meta.requestId) state.mutation = null;
      });
  },
});

export const bookshelfReducer = bookshelfSlice.reducer;
