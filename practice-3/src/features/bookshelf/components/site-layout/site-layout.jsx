import styles from "./site-layout.module.css";
export function SiteHeader() {
  return (
    <header className={styles.siteHeader}>
      <a className={styles.wordmark} href="./" aria-label="Полка — главная">
        <svg
          width="24"
          height="26"
          viewBox="0 0 24 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 3h5v18H3zM12 4l5-1 4 17-5 1zM1 24h22" />
        </svg>
        полка<span className={styles.wordmarkDot}>.</span>
      </a>
      <span className={styles.headerCaption}>Личный дневник чтения</span>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span>Одна книга за другой.</span>
      <span>Записи хранятся до обновления страницы</span>
    </footer>
  );
}
