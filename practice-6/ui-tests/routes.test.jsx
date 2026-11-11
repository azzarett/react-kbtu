import { bookshelfCache } from "../src/features/bookshelf/services/service.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";
import { API_CONFIG, DATA_KEY } from "../src/features/bookshelf/api/settings.js";

const defaultConfig = { ...API_CONFIG };
const searchBook = { key: "/works/OL123W", title: "The Test Book", author_name: ["Test Author"], first_publish_year: 1970 };
const detailBook = { key: "/works/OL123W", title: "The Test Book", description: { value: "A detailed test description." }, subjects: ["Stories"], first_publish_date: "1970" };
let storage;

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function searchResponse(docs = [searchBook], total = docs.length) {
  return response({ docs, numFound: total });
}

function mountAt(path = "/") {
  window.history.replaceState(null, "", `/#${path}`);
  return render(<App />);
}

function hashParams() {
  return new URLSearchParams(window.location.hash.split("?")[1] ?? "");
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  bookshelfCache.invalidate();
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key) => storage.get(key) ?? null),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
  });
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Unexpected network request in test"); }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.assign(API_CONFIG, { minDelay: 0, maxDelay: 0, errorChance: 0 });
  window.history.replaceState(null, "", "/#/");
});

afterEach(() => {
  cleanup();
  Object.assign(API_CONFIG, defaultConfig);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("real hash routes and catalogue integration", () => {
  it("navigates home → catalogue → dynamic details → cached search results without another fetch", async () => {
    const user = userEvent.setup();
    fetch.mockImplementation(async (input) => new URL(input).pathname === "/search.json" ? searchResponse() : response(detailBook));
    mountAt();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("следующая");
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("link", { name: "Каталог", exact: true }));
    await screen.findByRole("heading", { name: "The Test Book", level: 3 });
    expect(window.location.hash).toBe("#/catalog");
    expect(screen.getByRole("link", { name: "Каталог", exact: true }).getAttribute("aria-current")).toBe("page");
    await user.click(screen.getByRole("link", { name: /The Test Book/ }));
    await screen.findByRole("heading", { name: "The Test Book", level: 1 });
    expect(window.location.hash).toBe("#/catalog/OL123W?q=Tolkien&page=1");
    expect(screen.getByText("A detailed test description.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Посмотреть источник/ }).getAttribute("href")).toBe("https://openlibrary.org/works/OL123W");
    expect(document.activeElement.id).toBe("route-content");
    await user.click(screen.getByRole("link", { name: "← К результатам поиска" }));
    await screen.findByRole("heading", { name: "The Test Book", level: 3 });
    expect(hashParams().get("q")).toBe("Tolkien");
    expect(hashParams().get("page")).toBe("1");
    expect(fetch.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(["/search.json", "/works/OL123W.json"]);
    expect(storage.size).toBe(0);
  });

  it("loads direct query/page URLs and submitting a Unicode search resets the page", async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue(searchResponse());
    mountAt("/catalog?q=history&page=2");
    await screen.findByRole("heading", { name: "The Test Book", level: 3 });
    const firstUrl = new URL(fetch.mock.calls[0][0]);
    expect(firstUrl.searchParams.get("q")).toBe("history");
    expect(firstUrl.searchParams.get("page")).toBe("2");
    expect(screen.getByRole("searchbox").value).toBe("history");
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "  Война & мир  ");
    await user.click(screen.getByRole("button", { name: "Найти книги" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(hashParams().get("q")).toBe("Война & мир");
    expect(hashParams().has("page")).toBe(false);
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get("q")).toBe("Война & мир");
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get("page")).toBe("1");
    expect(screen.getByRole("searchbox").value).toBe("Война & мир");
  });

  it("paginates through URLs and preserves the query on both directions", async () => {
    const user = userEvent.setup();
    fetch.mockImplementation(async (input) => {
      const page = new URL(input).searchParams.get("page");
      return searchResponse([{ ...searchBook, title: `Result page ${page}` }], 25);
    });
    mountAt("/catalog?q=fox");
    await screen.findByRole("heading", { name: "Result page 1", level: 3 });
    expect(screen.getByRole("button", { name: "← Назад" }).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Далее →" }));
    await screen.findByRole("heading", { name: "Result page 2", level: 3 });
    expect(hashParams().get("q")).toBe("fox");
    expect(hashParams().get("page")).toBe("2");
    await user.click(screen.getByRole("button", { name: "Далее →" }));
    await screen.findByRole("heading", { name: "Result page 3", level: 3 });
    expect(screen.getByRole("button", { name: "Далее →" }).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "← Назад" }));
    await screen.findByRole("heading", { name: "Result page 2", level: 3 });
    expect(hashParams().get("page")).toBe("2");
  });

  it("browser Back restores the search query and input from URL state", async () => {
    const user = userEvent.setup();
    fetch.mockImplementation(async (input) => searchResponse([{ ...searchBook, title: new URL(input).searchParams.get("q") }]));
    mountAt("/catalog?q=first");
    await screen.findByRole("heading", { name: "first", level: 3 });
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "second");
    await user.click(screen.getByRole("button", { name: "Найти книги" }));
    await screen.findByRole("heading", { name: "second", level: 3 });
    await act(async () => { window.history.back(); });
    await screen.findByRole("heading", { name: "first", level: 3 });
    expect(screen.getByRole("searchbox").value).toBe("first");
    expect(hashParams().get("q")).toBe("first");
  });

  it("renders an unknown route and its home link without fetching", async () => {
    const user = userEvent.setup();
    mountAt("/this-page-does-not-exist");
    expect(screen.getByRole("heading", { name: "Кажется, эта глава потерялась." })).toBeTruthy();
    expect(screen.getByText("404 / СТРАНИЦА НЕ НАЙДЕНА")).toBeTruthy();
    await user.click(screen.getByRole("link", { name: "На главную" }));
    expect(window.location.hash).toBe("#/");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("renders a network failure and succeeds when the user retries", async () => {
    const user = userEvent.setup();
    fetch.mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(searchResponse());
    mountAt("/catalog?q=fox");
    await screen.findByText("Каталог пока недоступен");
    expect(screen.getByText(/Проверьте подключение/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Повторить запрос" }));
    await screen.findByRole("heading", { name: "The Test Book", level: 3 });
    expect(screen.queryByText("Каталог пока недоступен")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    // Subscriber cancellation does not abort a shared transport.
    expect(fetch.mock.calls[0][1].signal).toBeUndefined();
  });

  it("renders a rate-limit failure rather than fake catalogue results", async () => {
    fetch.mockResolvedValue(response({}, 429));
    mountAt("/catalog?q=fox");
    await screen.findByText("Каталог пока недоступен");
    expect(screen.getByText(/ограничила число запросов/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Результаты поиска" })).toBeNull();
  });

  it("an empty query explains what to enter and never makes an API call", async () => {
    const user = userEvent.setup();
    mountAt("/catalog?q=");
    await screen.findByText("Какую историю будем искать?");
    expect(screen.getByRole("searchbox").value).toBe("");
    await user.type(screen.getByRole("searchbox"), "   ");
    await user.click(screen.getByRole("button", { name: "Найти книги" }));
    expect(hashParams().get("q")).toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("valid empty API results show the zero-result state without cards", async () => {
    fetch.mockResolvedValue(searchResponse([], 0));
    mountAt("/catalog?q=unfindable");
    await screen.findByText("Книг не найдено");
    expect(screen.getByText("Найдено: 0 · Страница 1")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Страницы каталога" })).toBeNull();
  });

  it("invalid page values fall back to page 1 without an invalid service request", async () => {
    fetch.mockResolvedValue(searchResponse([], 0));
    mountAt("/catalog?q=fox&page=-10");
    await screen.findByText("Книг не найдено");
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get("page")).toBe("1");
  });

  it("invalid dynamic work IDs show a validation error and never touch the network", async () => {
    const user = userEvent.setup();
    mountAt("/catalog/not-a-work?q=fox&page=2");
    await screen.findByText("Не удалось открыть книгу");
    expect(screen.getByText(/Некорректный идентификатор/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "← К результатам поиска" }).getAttribute("href")).toBe("#/catalog?q=fox&page=2");
    await user.click(screen.getByRole("button", { name: "Попробовать ещё раз" }));
    await screen.findByText("Не удалось открыть книгу");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("detail HTTP failures support retry and missing metadata stays explicitly absent", async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(response({ key: "/works/OL123W", title: "Minimal Book" }));
    mountAt("/catalog/OL123W");
    await screen.findByText("Не удалось открыть книгу");
    expect(screen.getByText(/не найдены в Open Library/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Попробовать ещё раз" }));
    await screen.findByRole("heading", { name: "Minimal Book", level: 1 });
    expect(screen.getByText("В каталоге пока нет описания этой книги.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Темы" })).toBeNull();
    expect(screen.queryByText(/Первое издание:/)).toBeNull();
  });

  it("detaches an old search and ignores its late response after a newer query succeeds", async () => {
    const user = userEvent.setup();
    const oldRequest = deferred();
    fetch.mockImplementation((input) => new URL(input).searchParams.get("q") === "old"
      ? oldRequest.promise
      : Promise.resolve(searchResponse([{ ...searchBook, title: "Newest result" }])));
    mountAt("/catalog?q=old");
    await screen.findByText("Ищем книги…");
    expect(fetch).toHaveBeenCalledTimes(1);
    const oldSignal = fetch.mock.calls[0][1].signal;
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "new");
    await user.click(screen.getByRole("button", { name: "Найти книги" }));
    await screen.findByRole("heading", { name: "Newest result", level: 3 });
    expect(oldSignal).toBeUndefined();
    await act(async () => { oldRequest.resolve(searchResponse([{ ...searchBook, title: "Stale result" }])); });
    expect(screen.getByRole("heading", { name: "Newest result", level: 3 })).toBeTruthy();
    expect(screen.queryByText("Stale result")).toBeNull();
    expect(screen.queryByText("Каталог пока недоступен")).toBeNull();
  });

  it("leaving a loading detail detaches it and prevents late data from replacing home", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    fetch.mockReturnValue(pending.promise);
    mountAt("/catalog/OL123W");
    await screen.findByText("Открываем книгу…");
    const signal = fetch.mock.calls[0][1].signal;
    await user.click(screen.getByRole("link", { name: "Главная", exact: true }));
    expect(signal).toBeUndefined();
    await act(async () => { pending.resolve(response(detailBook)); });
    expect(window.location.hash).toBe("#/");
    expect(screen.queryByRole("heading", { name: "The Test Book" })).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("следующая");
  });
});

describe("the personal library remains local and functional", () => {
  it("creates, edits, completes, cancels deletion and deletes a book, persisting across routes", async () => {
    const user = userEvent.setup();
    storage.set(DATA_KEY, "[]");
    mountAt("/library");
    await screen.findByText("Здесь начнётся ваша библиотека");
    await user.click(screen.getByRole("button", { name: "+ Добавить книгу" }));
    const fields = {
      "Название": "Local Test Book", "Автор": "Local Author", "Жанр": "Роман",
      "Год первого издания": "2020", "Количество страниц": "120", "Издательство": "Publisher",
      "Описание": "A local description.",
    };
    for (const [label, value] of Object.entries(fields)) await user.type(screen.getByLabelText(label, { exact: true }), value);
    await user.click(screen.getByRole("button", { name: "Добавить на полку" }));
    await screen.findByText("«Local Test Book» добавлена.");
    await screen.findByRole("heading", { name: "Local Test Book", level: 2 });
    let saved = JSON.parse(storage.get(DATA_KEY));
    expect(saved).toHaveLength(1);
    const id = saved[0].id;
    expect(saved[0].status).toBe("planned");

    await user.click(screen.getByRole("button", { name: "Редактировать", exact: true }));
    await user.clear(screen.getByLabelText("Название", { exact: true }));
    await user.type(screen.getByLabelText("Название", { exact: true }), "Updated Local Book");
    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));
    await screen.findByText("«Updated Local Book» сохранена.");
    await screen.findByRole("heading", { name: "Updated Local Book", level: 2 });
    await user.click(screen.getByRole("button", { name: "✓ Отметить прочитанной" }));
    await screen.findByText("«Updated Local Book» отмечена как прочитанная.");
    await screen.findByRole("button", { name: "✓ Уже прочитано" });
    saved = JSON.parse(storage.get(DATA_KEY));
    expect(saved[0].id).toBe(id);
    expect(saved[0].title).toBe("Updated Local Book");
    expect(saved[0].status).toBe("completed");

    await user.click(screen.getByRole("link", { name: "Главная", exact: true }));
    await user.click(screen.getByRole("link", { name: "Моя полка", exact: true }));
    await screen.findByRole("button", { name: /Updated Local Book/ });
    await user.click(screen.getByRole("button", { name: /Updated Local Book/ }));
    await screen.findByRole("heading", { name: "Updated Local Book", level: 2 });
    await user.click(screen.getByRole("button", { name: "Удалить книгу" }));
    expect(screen.getByText("Удалить «Updated Local Book» с полки?")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Отмена" }));
    expect(JSON.parse(storage.get(DATA_KEY))).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Удалить книгу" }));
    await user.click(screen.getByRole("button", { name: "Да, удалить" }));
    await screen.findByText("«Updated Local Book» удалена.");
    await screen.findByText("Здесь начнётся ваша библиотека");
    expect(JSON.parse(storage.get(DATA_KEY))).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cancelled add forms do not change storage and catalogue reads do not alter library data", async () => {
    const user = userEvent.setup();
    storage.set(DATA_KEY, "[]");
    mountAt("/library");
    await screen.findByText("Здесь начнётся ваша библиотека");
    await user.click(screen.getByRole("button", { name: "+ Добавить книгу" }));
    await user.type(screen.getByLabelText("Название", { exact: true }), "Discard this");
    await user.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.queryByRole("heading", { name: "Новая книга на полке" })).toBeNull();
    expect(storage.get(DATA_KEY)).toBe("[]");
    fetch.mockResolvedValue(searchResponse());
    await user.click(screen.getByRole("link", { name: "Каталог", exact: true }));
    await screen.findByRole("heading", { name: "The Test Book", level: 3 });
    expect(storage.get(DATA_KEY)).toBe("[]");
    expect(fetch.mock.calls.every(([, options]) => options.method === "GET")).toBe(true);
  });
});
