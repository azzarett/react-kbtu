import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { NavBar } from "@/common/components/navigation/nav-bar";
import styles from "../../styles/root-layout.module.css";

export function RootLayout() {
  const location = useLocation();
  useEffect(() => {
    document.title = "Полка — книги и истории";
    document.getElementById("route-content")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);
  function skipToContent(event) {
    event.preventDefault();
    document.getElementById("route-content")?.focus();
  }
  return <div className={styles.shell}>
    <a className={styles.skipLink} href="#route-content" onClick={skipToContent}>К содержимому</a>
    <header className={styles.header}>
      <Link className={styles.brand} to="/" aria-label="Полка — главная"><span aria-hidden="true">▥</span> полка<span className={styles.brandDot}>.</span></Link>
      <NavBar />
    </header>
    <main id="route-content" tabIndex={-1} className={styles.main}><Outlet /></main>
    <footer className={styles.footer}><span>Хорошие книги остаются с нами.</span><span>Полка: локальный API · Внешний каталог: Open Library</span></footer>
  </div>;
}
