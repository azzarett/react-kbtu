import { BookRow } from "../book-row/book-row";
import styles from "./book-list.module.css";

export function BookList({
  books,
  isVisible,
  onStatusChange,
  onReset,
  onRemove,
}) {
  return (
    <ul className={styles.bookList}>
      {/* Keep filtered books mounted so their local state survives filtering. */}
      {books.map((book) => (
        <BookRow
          key={`${book.id}:${book.edition}`}
          book={book}
          hidden={!isVisible(book)}
          onStatusChange={onStatusChange}
          onReset={onReset}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
