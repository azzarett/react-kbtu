import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { catalogSourceChanged, checkConnection, disconnected } from "./connectivity-slice";

const sources = new Map([
  ["API_CACHED", "cached"],
  ["API_LIVE", "live"],
  ["API_UNAVAILABLE", "unavailable"],
]);

export function usePwa() {
  const dispatch = useDispatch();
  const [waiting, setWaiting] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let probe;
    let timer;
    function check() {
      probe?.abort();
      probe = dispatch(checkConnection());
    }
    window.addEventListener("online", check, options);
    window.addEventListener("offline", () => {
      probe?.abort();
      dispatch(disconnected());
    }, options);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    }, options);
    window.addEventListener("appinstalled", () => setInstallPrompt(null), options);
    navigator.serviceWorker?.addEventListener("message", (event) => {
      const source = sources.get(event.data?.type);
      if (source) dispatch(catalogSourceChanged(source));
    }, options);

    if (import.meta.env.PROD) {
      check();
      navigator.serviceWorker?.register(new URL("sw.js", document.baseURI), {
        scope: "./", updateViaCache: "none",
      }).then((registration) => {
        if (listeners.signal.aborted) return;
        const observeInstallation = () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(registration.waiting);
            }
          }, options);
        };
        setWaiting(registration.waiting);
        observeInstallation();
        registration.addEventListener("updatefound", observeInstallation, options);
        timer = setInterval(() => registration.update().catch(() => {}), 60000);
      }).catch(() => {
        if (!listeners.signal.aborted) setNotice("Офлайн-режим пока не установлен. Перезагрузите приложение при доступной сети.");
      });
    }
    return () => {
      clearInterval(timer);
      listeners.abort();
      probe?.abort();
    };
  }, [dispatch]);

  async function install() {
    await installPrompt.prompt();
    setInstallPrompt(null);
  }
  function activate() {
    setNotice("Обновляем приложение…");
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  }
  return { install: installPrompt && install, activate: waiting && activate, notice };
}
