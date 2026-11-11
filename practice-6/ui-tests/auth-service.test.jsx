import { StrictMode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../src/common/auth/auth-context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({
  getApps: vi.fn(() => []), initializeApp: vi.fn(() => ({ name: "[DEFAULT]" })),
  getAuth: vi.fn(() => ({ id: "auth" })), setPersistence: vi.fn(async () => {}),
  onAuthStateChanged: vi.fn(), createUserWithEmailAndPassword: vi.fn(async () => ({})),
  signInWithEmailAndPassword: vi.fn(async () => ({})), signInWithPopup: vi.fn(async () => ({})),
  signOut: vi.fn(async () => {}),
}));
vi.mock("firebase/app", () => ({ getApps: sdk.getApps, initializeApp: sdk.initializeApp }));
vi.mock("firebase/auth", () => ({ ...sdk, browserLocalPersistence: "local", GoogleAuthProvider: class GoogleAuthProvider {} }));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  for (const key of ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"]) vi.stubEnv(`VITE_FIREBASE_${key}`, `test-${key}`);
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("Firebase SDK service adapter", () => {
  it("initializes once and selects persistent browser sessions before SDK operations", async () => {
    const { authService } = await import("../src/common/auth/auth-service");
    await Promise.all([authService.login("reader@example.com", "secret"), authService.signup("new@example.com", "secret")]);
    await authService.google(); await authService.logout();
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
    expect(sdk.setPersistence).toHaveBeenCalledWith({ id: "auth" }, "local");
    expect(sdk.setPersistence.mock.invocationCallOrder[0]).toBeLessThan(sdk.signInWithEmailAndPassword.mock.invocationCallOrder[0]);
    expect(sdk.signInWithEmailAndPassword).toHaveBeenCalledWith({ id: "auth" }, "reader@example.com", "secret");
    expect(sdk.createUserWithEmailAndPassword).toHaveBeenCalledWith({ id: "auth" }, "new@example.com", "secret");
    expect(sdk.signInWithPopup).toHaveBeenCalledTimes(1);
    expect(sdk.signOut).toHaveBeenCalledWith({ id: "auth" });
  });
  it("observes Firebase sessions and disposes the observer", async () => {
    const unsubscribe = vi.fn(); sdk.onAuthStateChanged.mockReturnValue(unsubscribe);
    const { authService } = await import("../src/common/auth/auth-service");
    const user = vi.fn(); const error = vi.fn();
    const dispose = authService.subscribe(user, error);
    await vi.waitFor(() => expect(sdk.onAuthStateChanged).toHaveBeenCalledWith({ id: "auth" }, user, error));
    dispose(); expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
  it("does not attach an observer after its subscriber unmounts during initialization", async () => {
    const { authService } = await import("../src/common/auth/auth-service");
    const dispose = authService.subscribe(vi.fn(), vi.fn());
    dispose();
    await authService.logout();
    expect(sdk.onAuthStateChanged).not.toHaveBeenCalled();
  });
  it("reports absent config without initializing Firebase or pretending success", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "");
    const { authService } = await import("../src/common/auth/auth-service");
    await expect(authService.login("reader@example.com", "secret")).rejects.toMatchObject({ code: "auth/missing-config" });
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(sdk.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });
});

it("retries initialization after persistence fails without signing in prematurely", async () => {
  sdk.setPersistence.mockRejectedValueOnce({ code: "auth/network-request-failed" });
  const { authService } = await import("../src/common/auth/auth-service");
  await expect(authService.login("reader@example.com", "secret")).rejects.toMatchObject({ code: "auth/network-request-failed" });
  expect(sdk.signInWithEmailAndPassword).not.toHaveBeenCalled();
  await authService.login("reader@example.com", "secret");
  expect(sdk.setPersistence).toHaveBeenCalledTimes(2);
  expect(sdk.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
  expect(sdk.setPersistence.mock.invocationCallOrder[1]).toBeLessThan(sdk.signInWithEmailAndPassword.mock.invocationCallOrder[0]);
});


it("restores the session observer after transient initialization failure under StrictMode", async () => {
  const unsubscribe = vi.fn();
  sdk.setPersistence.mockRejectedValueOnce({ code: "auth/network-request-failed" });
  sdk.onAuthStateChanged.mockImplementation((auth, next) => {
    next({ uid: "recovered-user", email: "reader@example.com" });
    return unsubscribe;
  });
  const { authService } = await import("../src/common/auth/auth-service");
  function SessionProbe() {
    const { user, login, error, pending } = useAuth();
    return <><p>{user?.uid || "anonymous"}</p><p role="alert">{error}</p>
      <button disabled={pending} onClick={() => void login("reader@example.com", "secret")}>Retry login</button></>;
  }
  const view = render(<StrictMode><AuthProvider service={authService}><SessionProbe /></AuthProvider></StrictMode>);
  await vi.waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Нет связи с Firebase"));
  expect(sdk.onAuthStateChanged).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole("button", { name: "Retry login" }));
  await screen.findByText("recovered-user");
  expect(sdk.setPersistence).toHaveBeenCalledTimes(2);
  expect(sdk.onAuthStateChanged).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button").disabled).toBe(false);
  view.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
