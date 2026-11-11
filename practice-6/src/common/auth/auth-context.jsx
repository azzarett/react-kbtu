import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService, authErrorMessage } from "./auth-service";

export const AuthContext = createContext(null);

export function AuthProvider({ children, service = authService }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [subscriptionAttempt, setSubscriptionAttempt] = useState(0);
  const observerFailed = useRef(false);
  const locked = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    const unsubscribe = service.subscribe((nextUser) => {
      if (generation.current !== current) return;
      observerFailed.current = false;
      setUser(nextUser);
      setLoading(false);
    }, (cause) => {
      if (generation.current !== current) return;
      observerFailed.current = true;
      setUser(null);
      setError(authErrorMessage(cause));
      setLoading(false);
    });
    return () => { generation.current = current + 1; unsubscribe(); };
  }, [service, subscriptionAttempt]);

  const run = useCallback(async (method, ...args) => {
    if (locked.current) return false;
    locked.current = true;
    const current = generation.current;
    setPending(true);
    setError("");
    try {
      await service[method](...args);
      // An initialization/observer failure can leave no active observer. Retry
      // once after an explicit successful action, never in an automatic loop.
      if (generation.current === current && observerFailed.current) {
        observerFailed.current = false;
        setSubscriptionAttempt((attempt) => attempt + 1);
      }
      // Firebase's observer is the only source of session state.
      return generation.current === current;
    } catch (cause) {
      if (generation.current === current) setError(authErrorMessage(cause));
      return false;
    } finally {
      locked.current = false;
      if (generation.current === current) setPending(false);
    }
  }, [service]);
  const clearError = useCallback(() => setError(""), []);
  const value = useMemo(() => ({ user, loading, pending, error, clearError,
    login: (email, password) => run("login", email, password),
    signup: (email, password) => run("signup", email, password),
    google: () => run("google"), logout: () => run("logout"),
  }), [user, loading, pending, error, clearError, run]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
