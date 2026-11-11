import { bookshelfCache, invalidateBookshelfCache } from "../services/service.js";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

// The service function is imported at module scope by each caller, so it has a
// stable identity. A serialized parameter key avoids restarting equal queries.
export function useBookRequest(service, parameters) {
  const revision = useSyncExternalStore(bookshelfCache.subscribe, bookshelfCache.getRevision);
  const key = JSON.stringify(parameters);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  // A fresh descriptor distinguishes a new A request from an earlier completed
  // A after A → B → A navigation, even while B has not returned any result.
  const request = useMemo(() => ({ service, key, attempt, revision }), [service, key, attempt, revision]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    request.service(JSON.parse(request.key), { signal: controller.signal })
      .then((data) => {
        if (active) setResult({ request, status: "success", data, error: "" });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") {
          setResult({ request, status: "error", data: null, error: error.message });
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [request]);

  const current = result?.request === request
    ? result
    : { status: "loading", data: null, error: "" };
  return { ...current, reload: () => {
    invalidateBookshelfCache();
    setAttempt((value) => value + 1);
  } };
}
