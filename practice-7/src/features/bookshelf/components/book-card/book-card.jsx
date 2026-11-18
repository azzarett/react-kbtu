import { Link, useLocation } from "react-router";
import { statusLabel } from "../../constants/statuses.js";
import styles from "./book-card.module.css";

export function BookCard({ book, search = "" }) {
  const location = useLocation();
  return <article className={styles.card}>
    <div className={styles.cover} aria-hidden="true"><span>ЛИЧНАЯ ПОЛКА</span><b>{book.title.slice(0, 1)}</b><small>{book.year}</small></div>
    <div className={styles.content}>
      <p className={styles.genre}>{book.genre}</p>
      <h3><Link to={`/books/${encodeURIComponent(book.id)}${search}`} state={{ from: `${location.pathname}${location.search}` }}>{book.title}</Link></h3>
      <p className={styles.author}>{book.author}</p>
      <p className={styles.meta}>{book.pages} стр. · {book.year}</p>
      <span className={styles.status}>{statusLabel(book.status)}</span>
    </div>
  </article>;
}
