import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import App from "../src/App";
import { intendedDestination } from "../src/common/auth/protected-route";

const account = { email: "reader@example.com", uid: "firebase-user-123" };
function fakeService({ restored = null, delay = false } = {}) {
  let observer;
  const service = {
    unsubscribe: vi.fn(),
    subscribe: vi.fn((callback) => { observer = callback; if (!delay) callback(restored); return service.unsubscribe; }),
    emit: (user) => observer(user),
    login: vi.fn(async () => observer(account)),
    signup: vi.fn(async () => observer(account)),
    google: vi.fn(async () => observer(account)),
    logout: vi.fn(async () => observer(null)),
  };
  return service;
}
function mount(path, service) {
  window.history.replaceState(null, "", `/#${path}`);
  return render(<StrictMode><App authService={service} /></StrictMode>);
}
beforeEach(() => { vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Firebase authentication UI with an injected session service", () => {
  it("waits for restoration, protects profile, and returns to the intended route after login", async () => {
    const service = fakeService({ delay: true });
    const user = userEvent.setup();
    mount("/profile?source=bookmark", service);
    await screen.findByText("Проверяем сессию…");
    expect(window.location.hash).toContain("/profile");
    await act(async () => service.emit(null));
    await screen.findByRole("heading", { name: "Вход в аккаунт" });
    await user.type(screen.getByLabelText("Email"), account.email);
    await user.type(screen.getByLabelText("Пароль", { exact: true }), "safe-password");
    await user.click(screen.getByRole("button", { name: "Войти", exact: true }));
    await screen.findByRole("heading", { name: "Мой профиль" });
    expect(service.login).toHaveBeenCalledWith(account.email, "safe-password");
    expect(window.location.hash).toBe("#/profile?source=bookmark");
    expect(screen.getByText(account.uid)).toBeTruthy();
    expect(screen.getByText(account.email)).toBeTruthy();
    const nav = within(screen.getByRole("navigation"));
    expect(nav.queryByRole("link", { name: "Вход" })).toBeNull();
    expect(nav.getByRole("link", { name: "Профиль" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
    await screen.findByRole("heading", { name: "Вход в аккаунт" });
    expect(service.logout).toHaveBeenCalledTimes(1);
  });
  it("restores a persisted account without showing a login form and unsubscribes", async () => {
    const service = fakeService({ restored: account });
    const view = mount("/profile", service);
    await screen.findByRole("heading", { name: "Мой профиль" });
    expect(service.login).not.toHaveBeenCalled();
    view.unmount();
    expect(service.unsubscribe).toHaveBeenCalledTimes(service.subscribe.mock.calls.length);
  });
  it("validates confirmation then registers and shows the new profile", async () => {
    const service = fakeService(); const user = userEvent.setup();
    mount("/signup", service);
    await screen.findByRole("heading", { name: "Регистрация" });
    await user.type(screen.getByLabelText("Email"), account.email);
    await user.type(screen.getByLabelText("Пароль", { exact: true }), "secret123");
    await user.type(screen.getByLabelText("Подтвердите пароль"), "different");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    expect(screen.getByRole("alert").textContent).toContain("Пароли не совпадают");
    expect(service.signup).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Подтвердите пароль"));
    await user.type(screen.getByLabelText("Подтвердите пароль"), "secret123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    await screen.findByRole("heading", { name: "Мой профиль" });
    expect(service.signup).toHaveBeenCalledWith(account.email, "secret123");
  });
  it("handles popup cancellation and prevents duplicate operations while pending", async () => {
    const service = fakeService(); const user = userEvent.setup();
    let reject;
    service.google.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    mount("/login", service);
    const google = await screen.findByRole("button", { name: "Войти через Google" });
    await user.dblClick(google);
    expect(service.google).toHaveBeenCalledTimes(1);
    expect(google.disabled).toBe(true);
    await act(async () => reject({ code: "auth/popup-closed-by-user" }));
    expect(screen.getByRole("alert").textContent).toContain("Окно входа закрыто");
    await user.click(google);
    await screen.findByRole("heading", { name: "Мой профиль" });
  });
  it("shows login errors and keeps public navigation usable", async () => {
    const service = fakeService(); const user = userEvent.setup();
    service.login.mockRejectedValue({ code: "auth/invalid-credential" });
    mount("/login", service);
    await screen.findByLabelText("Email");
    await user.type(screen.getByLabelText("Email"), account.email);
    await user.type(screen.getByLabelText("Пароль", { exact: true }), "wrong");
    await user.click(screen.getByRole("button", { name: "Войти", exact: true }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Неверный email или пароль"));
    await user.click(screen.getByRole("link", { name: "Главная", exact: true }));
    expect(window.location.hash).toBe("#/");
  });
  it("rejects external and recursive redirect targets", () => {
    for (const target of ["https://evil.test", "//evil.test", "/\\evil.test", "/login", "/signup?a=b", null]) expect(intendedDestination(target)).toBe("/profile");
    expect(intendedDestination("/profile?next=1")).toBe("/profile?next=1");
  });
});

describe("authentication failures and interrupted flows", () => {
  it("retains the profile and session when logout fails, then permits retry", async () => {
    const service = fakeService({ restored: account }); const user = userEvent.setup();
    service.logout.mockRejectedValueOnce({ code: "auth/network-request-failed" });
    mount("/profile", service);
    await screen.findByRole("heading", { name: "Мой профиль" });
    await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
    await screen.findByRole("alert");
    expect(screen.getByText(account.uid)).toBeTruthy();
    expect(screen.getByText(account.email)).toBeTruthy();
    expect(window.location.hash).toBe("#/profile");
    await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
    await screen.findByRole("heading", { name: "Вход в аккаунт" });
    expect(service.logout).toHaveBeenCalledTimes(2);
  });

  it("removes identity on session expiration and keeps it hidden through Back/Forward", async () => {
    const service = fakeService({ restored: account }); const user = userEvent.setup();
    mount("/", service);
    await user.click(screen.getByRole("link", { name: "Профиль" }));
    await screen.findByRole("heading", { name: "Мой профиль" });
    await user.click(screen.getByRole("link", { name: "Главная", exact: true }));
    await act(async () => service.emit(null));
    await act(async () => window.history.back());
    await screen.findByRole("heading", { name: "Вход в аккаунт" });
    expect(window.location.hash).toBe("#/login");
    expect(screen.queryByText(account.uid)).toBeNull();
    expect(screen.queryByText(account.email)).toBeNull();
    await act(async () => window.history.forward());
    await waitFor(() => expect(window.location.hash).toBe("#/"));
    expect(screen.queryByText(account.uid)).toBeNull();
    expect(screen.queryByText(account.email)).toBeNull();
    await act(async () => window.history.back());
    await screen.findByRole("heading", { name: "Вход в аккаунт" });
    expect(screen.queryByText(account.uid)).toBeNull();
    expect(screen.queryByText(account.email)).toBeNull();
  });

  it("does not redirect away from a chosen public page when interrupted login completes", async () => {
    const service = fakeService(); const user = userEvent.setup(); let finish;
    service.login.mockImplementationOnce(() => new Promise((resolve) => { finish = () => { service.emit(account); resolve(); }; }));
    mount("/login", service);
    await screen.findByLabelText("Email");
    await user.type(screen.getByLabelText("Email"), account.email);
    await user.type(screen.getByLabelText("Пароль", { exact: true }), "secret123");
    await user.click(screen.getByRole("button", { name: "Войти", exact: true }));
    expect(screen.getByRole("button", { name: "Войти", exact: true }).disabled).toBe(true);
    await user.click(screen.getByRole("link", { name: "О проекте", exact: true }));
    await screen.findByRole("heading", { name: "О проекте «Полка»" });
    await act(async () => finish());
    expect(window.location.hash).toBe("#/about");
    expect(screen.getByRole("heading", { name: "О проекте «Полка»" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Профиль" })).toBeTruthy();
    expect(screen.queryByText(account.uid)).toBeNull();
  });

  it("blocks malformed email and short passwords before signup reaches the service", async () => {
    const service = fakeService(); const user = userEvent.setup();
    mount("/signup", service);
    await screen.findByLabelText("Email");
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Пароль", { exact: true });
    const confirmation = screen.getByLabelText("Подтвердите пароль");
    await user.type(email, "not-an-email");
    await user.type(password, "secret123"); await user.type(confirmation, "secret123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    expect(email.validity.typeMismatch).toBe(true);
    expect(service.signup).not.toHaveBeenCalled();
    await user.clear(email); await user.type(email, account.email);
    await user.clear(password); await user.type(password, "123");
    await user.clear(confirmation); await user.type(confirmation, "123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    // JSDOM does not enforce minLength; our JS validation also protects the boundary.
    expect(screen.getByRole("alert").textContent).toContain("не менее 6 символов");
    expect(service.signup).not.toHaveBeenCalled();
  });

  it("explains duplicate email without creating a session and allows switching to login", async () => {
    const service = fakeService(); const user = userEvent.setup();
    service.signup.mockRejectedValueOnce({ code: "auth/email-already-in-use" });
    mount("/signup", service);
    await screen.findByLabelText("Email");
    await user.type(screen.getByLabelText("Email"), account.email);
    await user.type(screen.getByLabelText("Пароль", { exact: true }), "secret123");
    await user.type(screen.getByLabelText("Подтвердите пароль"), "secret123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Этот email уже зарегистрирован");
    expect(screen.queryByRole("link", { name: "Профиль" })).toBeNull();
    expect(service.signup).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("link", { name: "Уже есть аккаунт? Войти" }));
    await screen.findByRole("heading", { name: "Вход в аккаунт" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
