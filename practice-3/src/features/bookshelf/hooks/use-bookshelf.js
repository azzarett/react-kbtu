import { useState } from "react";
import { initialBooks } from "../constants/books";
import { statuses } from "../constants/statuses";

export function useBookshelf() {
  const [books, setBooks] = useState(initialBooks);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [reversed, setReversed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const orderedBooks = reversed ? [...books].reverse() : books;
  const isVisible = (book) =>
    (filter === "all" || book.status === filter) &&
    `${book.title} ${book.author}`
      .toLocaleLowerCase("ru")
      .includes(normalizedQuery);
  const visibleCount = books.filter(isVisible).length;
  const counts = Object.fromEntries(
    statuses.map(({ value }) => [
      value,
      books.filter((book) => book.status === value).length,
    ]),
  );

  function addBook(values) {
    setBooks((current) => [
      ...current,
      {
        ...values,
        id: crypto.randomUUID(),
        status: "planned",
        initialPage: 0,
        color: "clay",
        edition: 0,
      },
    ]);
    setQuery("");
    setFilter("all");
    setFormOpen(false);
  }

  function changeStatus(id, status) {
    setBooks((current) =>
      current.map((book) => (book.id === id ? { ...book, status } : book)),
    );
  }

  function resetBook(id) {
    // A new key deliberately remounts only this book and resets its local state.
    setBooks((current) =>
      current.map((book) =>
        book.id === id
          ? { ...book, initialPage: 0, edition: book.edition + 1 }
          : book,
      ),
    );
  }

  function removeBook(id) {
    setBooks((current) => current.filter((book) => book.id !== id));
  }
  function clearFilters() {
    setFilter("all");
    setQuery("");
  }
  function toggleOrder() {
    setReversed((current) => !current);
  }
  function toggleForm() {
    setFormOpen((current) => !current);
  }
  function openForm() {
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
  }
  return {
    books,
    orderedBooks,
    counts,
    filter,
    query,
    reversed,
    formOpen,
    visibleCount,
    isVisible,
    addBook,
    changeStatus,
    resetBook,
    removeBook,
    clearFilters,
    toggleOrder,
    toggleForm,
    openForm,
    closeForm,
    setFilter,
    setQuery,
  };
}
