import { BookshelfView } from "../src/features/bookshelf/bookshelf-view.jsx";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { bookshelfReducer, loadBooks } from "../src/features/bookshelf/state/bookshelf-slice.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import BooksPage from "../src/features/bookshelf/pages/books-page.jsx";
import BookPage from "../src/features/bookshelf/pages/book-page.jsx";
import DashboardPage from "../src/features/bookshelf/pages/dashboard-page.jsx";
import { API_CONFIG, DATA_KEY } from "../src/features/bookshelf/api/settings.js";
import { initialBooks } from "../src/features/bookshelf/api/initial-books.js";

const defaultConfig = { ...API_CONFIG };
let storage;

function setupStore() {
  return configureStore({ reducer: { bookshelf: bookshelfReducer } });
}

function mountPage(path, options) {
  const store = setupStore();
  render(<Provider store={store}><MemoryRouter initialEntries={[path]}>
    <nav aria-label="Тестовые переходы">
      <Link to="/books/book-1">Книга A</Link>
      <Link to="/books/book-2">Книга B</Link>
      <Link to="/dashboard?status=completed">Обзор</Link>
      <Link to="/away">Уйти</Link>
    </nav>
    <Routes>
      <Route path="/books" element={<BooksPage />} />
      <Route path="/books/:id" element={<BookPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/away" element={<h1>Другая страница</h1>} />
    </Routes>
  </MemoryRouter></Provider>, options);
  return store;
}

beforeEach(() => {
  storage = new Map([[DATA_KEY, JSON.stringify(initialBooks.map((book) => ({ ...book, updatedAt: "2026-11-06T08:00:00.000Z" })))]]);
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key) => storage.get(key) ?? null),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
  });
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("No external requests are allowed in this suite"); }));
  Object.assign(API_CONFIG, { minDelay: 100, maxDelay: 100, errorChance: 0 });
});

afterEach(() => {
  cleanup();
  expect(fetch).not.toHaveBeenCalled();
  vi.useRealTimers();
  Object.assign(API_CONFIG, defaultConfig);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("book pages with the real local Promise API", () => {
  it("changing local filters and visiting the dashboard reuses the same collection", async () => {
    vi.useFakeTimers();
    mountPage("/books");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });

    fireEvent.change(screen.getByLabelText("Статус"), { target: { value: "completed" } });
    expect(screen.getByRole("link", { name: "Маленький принц" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Норвежский лес" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Обзор" }));
    expect(screen.getByText("Всего страниц", { selector: "dt" }).nextElementSibling.textContent).toBe("96");
    expect(localStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it("shows list loading, an API error, loading on retry and recovered data", async () => {
    vi.useFakeTimers();
    API_CONFIG.errorChance = 1;
    mountPage("/books");
    expect(screen.getByText("Загружаем книги…")).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("alert").textContent).toContain("Сервер временно недоступен");
    expect(screen.queryByText("Норвежский лес")).toBeNull();
    API_CONFIG.errorChance = 0;
    fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку" }));
    expect(screen.getByText("Загружаем книги…")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("link", { name: "Норвежский лес" })).toBeTruthy();
  });

  it("rapid A → B → A item navigation shares one collection request and never flashes B", async () => {
    vi.useFakeTimers();
    mountPage("/books/book-1", { reactStrictMode: true });
    expect(screen.getByText("Открываем книгу…")).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Книга B" }));
    fireEvent.click(screen.getByRole("link", { name: "Книга A" }));
    expect(screen.queryByRole("heading", { name: "Маленький принц" })).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Норвежский лес" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Маленький принц" })).toBeNull();
    expect(localStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it("navigating while a refresh is pending shows the current item after the fresh collection arrives", async () => {
    vi.useFakeTimers();
    const store = mountPage("/books/book-1");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Норвежский лес" })).toBeTruthy();
    const books = JSON.parse(storage.get(DATA_KEY));
    books[0].title = "Норвежский лес: обновлённая запись";
    storage.set(DATA_KEY, JSON.stringify(books));
    act(() => { store.dispatch(loadBooks({ force: true })); });
    fireEvent.click(screen.getByRole("link", { name: "Книга B" }));
    fireEvent.click(screen.getByRole("link", { name: "Книга A" }));
    expect(screen.getByText("Открываем книгу…")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1, name: "Норвежский лес" })).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Норвежский лес: обновлённая запись" })).toBeTruthy();
    expect(localStorage.getItem).toHaveBeenCalledTimes(2);
  });

  it("leaving an item before completion keeps the destination and warms the shared collection", async () => {
    vi.useFakeTimers();
    mountPage("/books/book-1");
    fireEvent.click(screen.getByRole("link", { name: "Уйти" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole("heading", { name: "Другая страница" })).toBeTruthy();
    expect(screen.queryByText("Норвежский лес")).toBeNull();
    expect(localStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it("a detail API error can be retried without changing the requested item", async () => {
    vi.useFakeTimers();
    API_CONFIG.errorChance = 1;
    mountPage("/books/book-2");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("alert").textContent).toContain("Не удалось открыть книгу");
    API_CONFIG.errorChance = 0;
    fireEvent.click(screen.getByRole("button", { name: "Попробовать ещё раз" }));
    expect(screen.getByText("Открываем книгу…")).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Маленький принц" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("dashboard retry recomputes statistics from API data after a read error", async () => {
    vi.useFakeTimers();
    API_CONFIG.errorChance = 1;
    mountPage("/dashboard?status=completed");
    expect(screen.getByText("Собираем статистику…")).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("alert").textContent).toContain("Не удалось загрузить статистику");
    API_CONFIG.errorChance = 0;
    fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByText("Книг в выборке", { selector: "dt" }).nextElementSibling.textContent).toBe("1");
    expect(screen.getByText("Всего страниц", { selector: "dt" }).nextElementSibling.textContent).toBe("96");
    expect(screen.getByLabelText("Статус для статистики").value).toBe("completed");
  });
});


describe("explicit bookshelf refresh", () => {
  it("bypasses an unexpired collection cache and reloads externally changed data", async () => {
    vi.useFakeTimers();
    render(<Provider store={setupStore()}><BookshelfView /></Provider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByText("Норвежский лес")).toBeTruthy();
    const books = JSON.parse(storage.get(DATA_KEY));
    books[0].title = "Обновлено вне текущей вкладки";
    storage.set(DATA_KEY, JSON.stringify(books));
    const readsBefore = localStorage.getItem.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /Обновить/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByText("Обновлено вне текущей вкладки")).toBeTruthy();
    expect(screen.queryByText("Норвежский лес")).toBeNull();
    expect(localStorage.getItem.mock.calls.length).toBeGreaterThan(readsBefore);
  });
});
