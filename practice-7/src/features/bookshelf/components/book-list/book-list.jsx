import { statusLabel } from "../../constants/statuses";
import styles from "./book-list.module.css";

export function BookList({ books, selectedId, onSelect }) {
  return (
    <ul className={styles.list}>
      {books.map((book, index) => (
        <li key={book.id}>
          <button
            type="button"
            className={`${styles.book} ${book.id === selectedId ? styles.selected : ""}`}
            aria-pressed={book.id === selectedId}
            onClick={() => onSelect(book.id)}
          >
            <span
              className={`${styles.cover} ${styles[`color${index % 4}`]}`}
              aria-hidden="true"
            >
              <span>ПОЛКА</span>
              <strong>{book.title.slice(0, 1)}</strong>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </span>
            <span className={styles.info}>
              <span className={styles.genre}>{book.genre}</span>
              <strong className={styles.title}>{book.title}</strong>
              <span className={styles.author}>{book.author}</span>
              <span className={`${styles.status} ${styles[book.status]}`}>
                {statusLabel(book.status)}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
