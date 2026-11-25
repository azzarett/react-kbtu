import { createSelector } from "@reduxjs/toolkit";
import { toBookSummary } from "../api/books-api.js";
import { getBookGenres, getBookStats, getDashboardBooks, selectBooks } from "../services/projections.js";

export const selectBookCollection = (state) => state.bookshelf.books;
export const selectCollectionStatus = (state) => state.bookshelf.status;
export const selectCollectionError = (state) => state.bookshelf.error;
export const selectBookMutation = (state) => state.bookshelf.mutation;

export const selectBookSummaries = createSelector(
  [selectBookCollection],
  (books) => books.map(toBookSummary),
);

export const selectBookDetails = createSelector(
  [selectBookCollection, (_, id) => id],
  (books, id) => books.find((book) => book.id === id),
);

export const selectBookGenres = createSelector([selectBookCollection], getBookGenres);

const selectQuery = (_, filters) => filters.q;
const selectGenre = (_, filters) => filters.genre;
const selectStatus = (_, filters) => filters.status;
const selectSort = (_, filters) => filters.sort;
const selectPage = (_, filters) => filters.page;

export const selectBooksPage = createSelector(
  [selectBookCollection, selectQuery, selectGenre, selectStatus, selectSort, selectPage],
  (books, q, genre, status, sort, page) => selectBooks(books, { q, genre, status, sort, page }),
);

export const selectDashboard = createSelector(
  [selectBookCollection, selectGenre, selectStatus],
  (books, genre, status) => ({
    stats: getBookStats(books, { genre, status }),
    books: getDashboardBooks(books, { genre, status }),
  }),
);
