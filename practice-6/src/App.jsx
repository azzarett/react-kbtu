import { AuthProvider } from "@/common/auth/auth-context";
import { ProtectedRoute } from "@/common/auth/protected-route";
import { lazy, Suspense } from "react";
import { HashRouter, Outlet, Route, Routes } from "react-router";
import { RootLayout } from "./components/root-layout/root-layout";
import { Feedback } from "@/common/components/ui/feedback";
import { BookshelfView } from "@/features/bookshelf/bookshelf-view";
import { CatalogPage, CatalogBookPage } from "@/features/catalog/pages/catalog-pages";
import { HomePage, NotFoundPage } from "@/features/home/home-page";
import "@/common/styles/base.css";

const AboutPage = lazy(() => import("@/features/about/about-page"));
const LoginPage = lazy(() => import("@/features/login/login-page"));
const SignupPage = lazy(() => import("@/features/login/signup-page"));
const ProfilePage = lazy(() => import("@/features/login/profile-page"));
const BooksPage = lazy(() => import("@/features/bookshelf/pages/books-page"));
const BookPage = lazy(() => import("@/features/bookshelf/pages/book-page"));
const DashboardPage = lazy(() => import("@/features/bookshelf/pages/dashboard-page"));

function LazyPage({ children }) {
  return <Suspense fallback={<Feedback loading title="Открываем страницу…" />}>{children}</Suspense>;
}

export default function App({ authService }) {
  return <AuthProvider service={authService}><HashRouter><Routes><Route element={<RootLayout />}>
    <Route index element={<HomePage />} />
    <Route path="about" element={<LazyPage><AboutPage /></LazyPage>} />
    <Route path="login" element={<LazyPage><LoginPage /></LazyPage>} />
    <Route path="signup" element={<LazyPage><SignupPage /></LazyPage>} />
    <Route element={<ProtectedRoute />}><Route path="profile" element={<LazyPage><ProfilePage /></LazyPage>} /></Route>
    <Route path="books" element={<Outlet />}>
      <Route index element={<LazyPage><BooksPage /></LazyPage>} />
      <Route path=":id" element={<LazyPage><BookPage /></LazyPage>} />
    </Route>
    <Route path="dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />
    <Route path="catalog" element={<Outlet />}>
      <Route index element={<CatalogPage />} />
      <Route path=":workId" element={<CatalogBookPage />} />
    </Route>
    <Route path="library" element={<BookshelfView />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></HashRouter></AuthProvider>;
}
