import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "../src/App.jsx";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function hashParams() {
  return new URLSearchParams(window.location.hash.split("?")[1]);
}

it("debounces catalog typing, resets pagination and restores cached URL results on Back and Forward", async () => {
  const fetchMock = vi.fn(async (input) => {
    const params = new URL(input).searchParams;
    const title = `${params.get("q")} · page ${params.get("page")}`;
    return { ok: true, json: async () => ({ docs: [{ key: "/works/OL1W", title }], numFound: 15 }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState(null, "", "/#/catalog?q=history&page=2");
  render(<App />);
  await screen.findByRole("heading", { name: "history · page 2", level: 3 });

  vi.useFakeTimers();
  const input = screen.getByRole("searchbox");
  input.focus();
  fireEvent.change(input, { target: { value: "sea" } });
  await act(async () => vi.advanceTimersByTimeAsync(200));
  fireEvent.change(input, { target: { value: "sea stories " } });
  await act(async () => vi.advanceTimersByTimeAsync(200));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(hashParams().get("page")).toBe("2");

  await act(async () => vi.advanceTimersByTimeAsync(200));
  vi.useRealTimers();
  await screen.findByRole("heading", { name: "sea stories · page 1", level: 3 });
  expect(hashParams().get("q")).toBe("sea stories ");
  expect(hashParams().has("page")).toBe(false);
  expect(input.value).toBe("sea stories ");
  expect(document.activeElement).toBe(input);

  await act(async () => window.history.back());
  await screen.findByRole("heading", { name: "history · page 2", level: 3 });
  expect(input.value).toBe("history");

  await act(async () => window.history.forward());
  await screen.findByRole("heading", { name: "sea stories · page 1", level: 3 });
  expect(input.value).toBe("sea stories ");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
