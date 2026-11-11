import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./auth-context";
import { Feedback } from "../components/ui/feedback";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Feedback loading title="Проверяем сессию…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

export function intendedDestination(from) {
  // Redirect only to app-internal routes; never trust arbitrary location state.
  return typeof from === "string" && /^\/(?!\/|\\)/.test(from) && !/^\/(login|signup)(?:[/?#]|$)/.test(from)
    ? from : "/profile";
}
