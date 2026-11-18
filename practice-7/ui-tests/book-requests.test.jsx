import { BookshelfView } from "../src/features/bookshelf/bookshelf-view.jsx";
import { bookshelfCache } from "../src/features/bookshelf/services/service.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { useBookRequest } from "../src/features/bookshelf/hooks/use-book-request.js";
import BooksPage from "../src/features/bookshelf/pages/books-page.jsx";
import BookPage from "../src/features/bookshelf/pages/book-page.jsx";
import DashboardPage from "../src/features/bookshelf/pages/dashboard-page.jsx";
import { API_CONFIG, DATA_KEY } from "../src/features/bookshelf/api/settings.js";
import { initialBooks } from "../src/features/bookshelf/api/initial-books.js";

const defaultConfig = { ...API_CONFIG };
let storage;

// Deliberately ignores AbortSignal: the hook must also reject stale resolutions
// from transports that cannot physically cancel work already in progress.
function controlledService() {
  const requests = [];
  const service = vi.fn((parameters, { signal }) => new Promise((resolve, reject) => {
    requests.push({ parameters, signal, resolve, reject });
  }));
  return { service, requests };
}

function mountPage(path) {
  return render(<MemoryRouter initialEntries={[path]}>
    <nav aria-label="Тестовые переходы">
      <Link to="/books/book-1">Книга A</Link>
      <Link to="/books/book-2">Книга B</Link>
      <Link to="/away">Уйти</Link>
    </nav>
    <Routes>
      <Route path="/books" element={<BooksPage />} />
      <Route path="/books/:id" element={<BookPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/away" element={<h1>Другая страница</h1>} />
    </Routes>
  </MemoryRouter>);
}

beforeEach(() => {
  bookshelfCache.invalidate();
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

describe("useBookRequest cancellation and request identity", () => {
  it("cache invalidation refreshes mounted consumers and rejects a pre-mutation response", async () => {
    const { service, requests } = controlledService();
    const { result } = renderHook(() => useBookRequest(service, "A"));
    act(() => bookshelfCache.invalidate());
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    await act(async () => requests[1].resolve({ title: "After mutation" }));
    await act(async () => requests[0].resolve({ title: "Before mutation" }));
    expect(result.current.status).toBe("success");
    expect(result.current.data.title).toBe("After mutation");
  });

  it("starts loading, resolves data and does not refetch equal serialized parameters", async () => {
    const { service, requests } = controlledService();
    const { result, rerender } = renderHook(({ parameters }) => useBookRequest(service, parameters), {
      initialProps: { parameters: { q: "A", page: 1 } },
    });
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
    expect(requests[0].parameters).toEqual({ q: "A", page: 1 });
    expect(requests[0].signal.aborted).toBe(false);
    await act(async () => { requests[0].resolve({ books: ["A"] }); });
    expect(result.current.status).toBe("success");
    expect(result.current.data).toEqual({ books: ["A"] });
    rerender({ parameters: { q: "A", page: 1 } });
    expect(service).toHaveBeenCalledTimes(1);
  });

  it("A → B → A aborts both previous requests and ignores their late results and errors", async () => {
    const { service, requests } = controlledService();
    const { result, rerender } = renderHook(({ id }) => useBookRequest(service, id), { initialProps: { id: "A" } });
    rerender({ id: "B" });
    rerender({ id: "A" });
    expect(requests.map(({ parameters }) => parameters)).toEqual(["A", "B", "A"]);
    expect(requests.map(({ signal }) => signal.aborted)).toEqual([true, true, false]);
    await act(async () => { requests[0].resolve({ title: "Old A" }); });
    expect(result.current.status).toBe("loading");
    await act(async () => { requests[2].resolve({ title: "Fresh A" }); });
    await act(async () => { requests[1].reject(new Error("Late B error")); });
    expect(result.current.status).toBe("success");
    expect(result.current.data).toEqual({ title: "Fresh A" });
    expect(result.current.error).toBe("");
  });

  it("returning to A after a completed A and pending B starts a fresh loading state", async () => {
    const { service, requests } = controlledService();
    const { result, rerender } = renderHook(({ id }) => useBookRequest(service, id), { initialProps: { id: "A" } });
    await act(async () => { requests[0].resolve({ title: "Outdated A" }); });
    expect(result.current.status).toBe("success");
    rerender({ id: "B" });
    expect(result.current.status).toBe("loading");
    rerender({ id: "A" });
    expect(requests).toHaveLength(3);
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
    await act(async () => { requests[2].resolve({ title: "Updated A" }); });
    expect(result.current.data).toEqual({ title: "Updated A" });
  });

  it("changing the service for equal parameters does not display the old service result", async () => {
    const first = controlledService();
    const second = controlledService();
    const { result, rerender } = renderHook(({ service }) => useBookRequest(service, "A"), { initialProps: { service: first.service } });
    await act(async () => { first.requests[0].resolve({ source: "old" }); });
    rerender({ service: second.service });
    expect(first.requests[0].signal.aborted).toBe(true);
    expect(second.requests).toHaveLength(1);
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
    await act(async () => { second.requests[0].resolve({ source: "new" }); });
    expect(result.current.data).toEqual({ source: "new" });
  });

  it("retry clears an error immediately and resolves the new request", async () => {
    const { service, requests } = controlledService();
    const { result } = renderHook(() => useBookRequest(service, "A"));
    await act(async () => { requests[0].reject(new Error("Temporary failure")); });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Temporary failure");
    act(() => { result.current.reload(); });
    expect(result.current.status).toBe("loading");
    expect(result.current.error).toBe("");
    expect(requests[0].signal.aborted).toBe(true);
    await act(async () => { requests[1].resolve({ title: "Recovered" }); });
    expect(result.current.status).toBe("success");
    expect(result.current.data.title).toBe("Recovered");
  });

  it("repeated retries cancel pending requests and cannot overwrite the newest result", async () => {
    const { service, requests } = controlledService();
    const { result } = renderHook(() => useBookRequest(service, "A"));
    act(() => { result.current.reload(); });
    act(() => { result.current.reload(); });
    expect(requests).toHaveLength(3);
    expect(requests.map(({ signal }) => signal.aborted)).toEqual([true, true, false]);
    await act(async () => { requests[2].resolve("latest"); });
    await act(async () => { requests[0].resolve("old"); requests[1].reject(new Error("old error")); });
    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("latest");
  });

  it("unmount aborts the request and a late success does not render again", async () => {
    const { service, requests } = controlledService();
    const renders = vi.fn();
    const { unmount } = renderHook(() => {
      renders();
      return useBookRequest(service, "A");
    });
    unmount();
    const count = renders.mock.calls.length;
    expect(requests[0].signal.aborted).toBe(true);
    await act(async () => { requests[0].resolve("too late"); });
    expect(renders).toHaveBeenCalledTimes(count);
  });

  it("StrictMode cleanup aborts the first effect and ignores its late answer", async () => {
    const { service, requests } = controlledService();
    const { result, unmount } = renderHook(() => useBookRequest(service, "A"), {
      reactStrictMode: true,
    });
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[1].signal.aborted).toBe(false);
    await act(async () => { requests[0].resolve("discarded StrictMode request"); });
    expect(result.current.status).toBe("loading");
    await act(async () => { requests[1].resolve("current StrictMode request"); });
    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("current StrictMode request");
    unmount();
    expect(requests[1].signal.aborted).toBe(true);
  });
});

describe("book pages with the real local Promise API", () => {
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

  it("rapid A → B → A item navigation deduplicates A and never flashes B", async () => {
    vi.useFakeTimers();
    mountPage("/books/book-1");
    expect(screen.getByText("Открываем книгу…")).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Книга B" }));
    fireEvent.click(screen.getByRole("link", { name: "Книга A" }));
    expect(screen.queryByRole("heading", { name: "Маленький принц" })).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Норвежский лес" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Маленький принц" })).toBeNull();
    expect(localStorage.getItem).toHaveBeenCalledTimes(2);
  });

  it("returning to an already loaded item shows loading until its changed API data arrives", async () => {
    vi.useFakeTimers();
    mountPage("/books/book-1");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Норвежский лес" })).toBeTruthy();
    const books = JSON.parse(storage.get(DATA_KEY));
    books[0].title = "Норвежский лес: обновлённая запись";
    storage.set(DATA_KEY, JSON.stringify(books));
    // Simulate a successful write through the service invalidation boundary.
    act(() => bookshelfCache.invalidate());
    fireEvent.click(screen.getByRole("link", { name: "Книга B" }));
    fireEvent.click(screen.getByRole("link", { name: "Книга A" }));
    expect(screen.getByText("Открываем книгу…")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1, name: "Норвежский лес" })).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("heading", { level: 1, name: "Норвежский лес: обновлённая запись" })).toBeTruthy();
    expect(localStorage.getItem).toHaveBeenCalledTimes(3);
  });

  it("leaving an item before completion detaches its subscriber and keeps the destination", async () => {
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
    render(<BookshelfView />);
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
