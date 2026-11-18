import { bookshelfCache } from "../src/features/bookshelf/services/service.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";
import { API_CONFIG, DATA_KEY } from "../src/features/bookshelf/api/settings.js";
import { initialBooks } from "../src/features/bookshelf/api/initial-books.js";

const defaultConfig = { ...API_CONFIG };
let storage;
function mountAt(path = "/") { window.history.replaceState(null, "", `/#${path}`); return render(<App />); }
function query() { return new URLSearchParams(window.location.hash.split("?")[1] ?? ""); }
beforeEach(() => {
  bookshelfCache.invalidate();
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  });
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Unexpected external request"); }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.assign(API_CONFIG, { minDelay: 0, maxDelay: 0, errorChance: 0 });
});
afterEach(() => { cleanup(); Object.assign(API_CONFIG, defaultConfig); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("full Task 5 rubric", () => {
  it("home has introduction, a real image and links to required sections", () => {
    mountAt();
    expect(screen.getByRole("img", { name: /книжной обложки/ }).getAttribute("src")).toContain("reading.svg");
    const navigation = screen.getByRole("navigation", { name: "Основная навигация" });
    for (const name of ["Главная", "Книги", "Обзор", "О проекте", "Вход"]) expect(within(navigation).getByRole("link", { name })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toContain("Открывайте книги");
  });

  it("loads About and Firebase Login lazily and keeps guest access", async () => {
    const user = userEvent.setup(); mountAt("/about");
    await screen.findByRole("heading", { level: 1, name: "О проекте «Полка»" });
    await user.click(within(screen.getByRole("navigation", { name: "Основная навигация" })).getByRole("link", { name: "Вход" }));
    await screen.findByRole("heading", { level: 1, name: "Вход в аккаунт" });
    expect(document.querySelectorAll('input[type="password"]').length).toBe(1);
    await user.click(screen.getByRole("link", { name: "Продолжить без входа" }));
    await screen.findByRole("heading", { level: 1, name: "Все книги" });
    await screen.findByText("451 градус по Фаренгейту");
    expect(window.location.hash).toBe("#/books");
  });

  it("combines search and two filters through a direct URL", async () => {
    mountAt("/books?q=Мураками&genre=Роман&status=reading&sort=year-desc&page=1");
    await screen.findByText("Норвежский лес");
    expect(screen.queryByText("Маленький принц")).toBeNull();
    expect(screen.getByLabelText("Название или автор").value).toBe("Мураками");
    expect(screen.getByLabelText("Жанр", { exact: true }).value).toBe("Роман");
    expect(screen.getByLabelText("Статус", { exact: true }).value).toBe("reading");
    expect(screen.getByLabelText("Сортировка").value).toBe("year-desc");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sorts, paginates and restores the page with browser Back", async () => {
    const user = userEvent.setup(); mountAt("/books?sort=year-asc");
    await screen.findByText("Маленький принц");
    expect(screen.queryByText("Норвежский лес")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Далее →" }));
    await screen.findByText("Норвежский лес");
    expect(query().get("page")).toBe("2");
    expect(query().get("sort")).toBe("year-asc");
    await act(async () => { window.history.back(); });
    await screen.findByText("Маленький принц");
    expect(screen.queryByText("Норвежский лес")).toBeNull();
    await act(async () => { window.history.forward(); });
    await screen.findByText("Норвежский лес");
    expect(query().get("page")).toBe("2");
    const directPath = window.location.hash.slice(1);
    cleanup(); mountAt(directPath);
    await screen.findByText("Норвежский лес");
    expect(query().get("sort")).toBe("year-asc");
  });

  it("updates search and both filters in the URL and resets them", async () => {
    const user = userEvent.setup(); mountAt("/books?page=2");
    await screen.findByText("Цветы для Элджернона");
    await user.type(screen.getByLabelText("Название или автор"), "Мураками");
    await user.click(screen.getByRole("button", { name: "Найти", exact: true }));
    await screen.findByText("Норвежский лес");
    expect(query().get("q")).toBe("Мураками");
    expect(query().get("page")).toBeNull();
    await user.selectOptions(screen.getByLabelText("Жанр", { exact: true }), "Роман");
    await screen.findByText("Норвежский лес");
    await user.selectOptions(screen.getByLabelText("Статус", { exact: true }), "reading");
    await screen.findByText("Норвежский лес");
    expect(query().get("genre")).toBe("Роман");
    expect(query().get("status")).toBe("reading");
    await user.click(screen.getByRole("button", { name: "Сбросить фильтры" }));
    await screen.findByText("Маленький принц");
    expect(query().size).toBe(0);
    expect(screen.getByLabelText("Название или автор").value).toBe("");
  });

  it("shows meaningful details from the API and preserves the list URL", async () => {
    const user = userEvent.setup(); mountAt("/books?genre=Роман&status=reading");
    await screen.findByText("Норвежский лес");
    await user.click(screen.getByRole("link", { name: /Норвежский лес/ }));
    await screen.findByRole("heading", { level: 1, name: "Норвежский лес" });
    const main = screen.getByRole("main");
    for (const value of ["Харуки Мураками", "Роман", "1987", "384", "Русский", "Эксмо", "Читаю", initialBooks[0].description]) expect(main.textContent).toContain(value);
    expect(main.querySelectorAll("dl dt").length).toBeGreaterThanOrEqual(7);
    expect(screen.getByRole("link", { name: "Все книги", exact: true })).toBeTruthy();
    await user.click(screen.getByRole("link", { name: "← Назад", exact: true }));
    await screen.findByRole("heading", { level: 1, name: "Все книги" });
    expect(query().get("genre")).toBe("Роман");
    expect(query().get("status")).toBe("reading");
  });

  it("handles a missing item and an invalid route without crashing", async () => {
    mountAt("/books/missing-book");
    await screen.findByRole("alert");
    expect(screen.getByRole("main").textContent).toMatch(/не найден|не найдена/i);
    cleanup(); mountAt("/books/%3Cbad%3E");
    await screen.findByRole("alert");
    expect(screen.getByRole("main").textContent).toContain("Некорректный идентификатор");
    cleanup(); mountAt("/unlisted/chapter");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("глава потерялась");
    expect(screen.getByRole("link", { name: "На главную", exact: true })).toBeTruthy();
  });

  it("dashboard derives statistics, two breakdowns and links from stored API data", async () => {
    mountAt("/dashboard");
    await screen.findByRole("heading", { level: 1, name: "Статистика полки" });
    await screen.findByText("Книг в выборке");
    for (const label of ["Всего страниц", "Средний объём", "Прочитано", "Доля прочитанного", "Авторов"]) expect(screen.getByText(label, { selector: "dt" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "По жанрам" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "По статусам" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toContain("1 056");
    expect(screen.getByRole("main").querySelectorAll('a[href*="/books"]').length).toBeGreaterThan(2);
  });

  it("dashboard filter changes API-derived statistics", async () => {
    const user = userEvent.setup(); mountAt("/dashboard");
    await screen.findByText("Книг в выборке");
    await user.selectOptions(screen.getByLabelText("Статус для статистики"), "completed");
    await waitFor(() => expect(screen.getByRole("main").textContent).toContain("96"));
    expect(query().get("status")).toBe("completed");
    expect(screen.getByRole("main").textContent).not.toContain("1 056");
    expect(screen.getByRole("main").textContent).toContain("100");
    expect(screen.getByRole("link", { name: /Маленький принц/ })).toBeTruthy();
  });

  it("empty API storage stays empty across list and dashboard", async () => {
    storage.set(DATA_KEY, "[]"); mountAt("/books");
    await screen.findByRole("heading", { level: 1, name: "Все книги" });
    await waitFor(() => expect(screen.getByRole("main").textContent).toMatch(/не найден|пуст|нет книг/i));
    expect(storage.get(DATA_KEY)).toBe("[]");
    cleanup(); mountAt("/dashboard");
    await screen.findByText("Книг в выборке");
    expect(storage.get(DATA_KEY)).toBe("[]");
    expect(screen.queryByText("Маленький принц")).toBeNull();
  });
});
