import { useState } from "react";
import { statuses } from "../../constants/statuses";
import { Button } from "@/common/components/ui/button";
import { VisuallyHidden } from "@/common/components/ui/visually-hidden";
import styles from "./book-row.module.css";

export function BookRow({ book, hidden, onStatusChange, onRemove, onReset }) {
  // This state belongs to this book component, not to the parent collection.
  const [page, setPage] = useState(book.initialPage);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const progress = Math.round((page / book.totalPages) * 100);

  console.log(`[BookRow render] ${book.id}, key=${book.id}:${book.edition}`, {
    page,
    hidden,
  });

  return (
    <li className={styles.bookRow} hidden={hidden}>
      <div
        className={`${styles.bookCover} ${styles[book.color]}`}
        aria-hidden="true"
      >
        <span className={styles.coverAuthor}>{book.author}</span>
        <span className={styles.coverTitle}>{book.title}</span>
        <span className={styles.coverMark}>п.</span>
      </div>
      <div className={styles.bookInfo}>
        <span className={styles.bookCategory}>
          {book.category} / {book.totalPages} стр.
        </span>
        <h2>{book.title}</h2>
        <p className={styles.bookAuthor}>{book.author}</p>
        <div className={styles.bookActions}>
          <Button
            type="button"
            variant="text"
            aria-expanded={noteOpen}
            aria-controls={`note-${book.id}`}
            onClick={() => setNoteOpen(!noteOpen)}
          >
            {noteOpen
              ? "Скрыть заметку"
              : note
                ? "Моя заметка"
                : "Добавить заметку"}
          </Button>
          <span aria-hidden="true">·</span>
          <Button
            type="button"
            variant="text"
            tone="danger"
            aria-label={`Удалить «${book.title}»`}
            onClick={() => onRemove(book.id)}
          >
            Удалить
          </Button>
        </div>
      </div>
      <div className={styles.bookReading}>
        <VisuallyHidden as="label" htmlFor={`status-${book.id}`}>
          Статус «{book.title}»
        </VisuallyHidden>
        <select
          id={`status-${book.id}`}
          className={`${styles.statusSelect} ${styles[book.status] ?? ""}`}
          value={book.status}
          onChange={(event) => onStatusChange(book.id, event.target.value)}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <div className={styles.progressCaption}>
          <span>Прочитано</span>
          <span>{progress}%</span>
        </div>
        <progress
          className={styles.progress}
          value={page}
          max={book.totalPages}
          aria-label={`Прогресс «${book.title}»`}
        />
        <div className={styles.pageControls}>
          <label className={styles.pageInputLabel}>
            <VisuallyHidden>Текущая страница «{book.title}»</VisuallyHidden>
            <input
              type="number"
              min="0"
              max={book.totalPages}
              value={page}
              onChange={(event) =>
                setPage(
                  Math.min(
                    book.totalPages,
                    Math.max(0, Math.trunc(Number(event.target.value) || 0)),
                  ),
                )
              }
            />
            <span>/ {book.totalPages} стр.</span>
          </label>
          <button
            type="button"
            className={styles.incrementButton}
            disabled={page === book.totalPages}
            aria-label={`Прочитать 10 страниц «${book.title}»`}
            onClick={() =>
              setPage((current) => Math.min(book.totalPages, current + 10))
            }
          >
            +10
          </button>
          <button
            type="button"
            className={styles.resetButton}
            title="Сбросить прогресс и заметку"
            aria-label={`Сбросить прогресс и заметку «${book.title}»`}
            onClick={() => onReset(book.id)}
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M4 7a6 6 0 1 1-.2 5M4 3v4h4" />
            </svg>
          </button>
        </div>
      </div>
      {noteOpen && (
        <label className={styles.noteField} id={`note-${book.id}`}>
          Мысли на полях
          <textarea
            rows="2"
            maxLength="1000"
            placeholder="Что хочется запомнить из этой книги?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      )}
    </li>
  );
}
