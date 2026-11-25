import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Feedback } from "@/common/components/ui/feedback";
import { useBookRequest } from "../../hooks/use-book-request.js";
import { statusLabel } from "../../constants/statuses";
import styles from "./book-details.module.css";

export function BookDetails({ id, busy, onEdit, onRemove, onComplete }) {
  const request = useBookRequest(id);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (request.status === "loading")
    return (
      <Feedback
        loading
        title="Открываем книгу…"
        description="Загружаем подробности с полки."
      />
    );
  if (request.status === "error")
    return (
      <Feedback
        error
        title="Карточка не загрузилась"
        description={request.error}
        actionLabel="Попробовать ещё раз"
        onAction={request.reload}
      />
    );
  const { book } = request;
  const fields = [
    ["Жанр", book.genre],
    ["Год первого издания", book.year],
    ["Страниц в издании", book.pages],
    ["Язык", book.language],
    ["Издательство", book.publisher],
    ["Статус", statusLabel(book.status)],
  ];

  return (
    <article className={styles.card}>
      <p className={styles.eyebrow}>КАРТОЧКА КНИГИ</p>
      <h2>{book.title}</h2>
      <p className={styles.author}>{book.author}</p>
      <p className={styles.description}>{book.description}</p>
      <dl className={styles.facts}>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.actions}>
        <Button
          disabled={busy || book.status === "completed" || confirmRemove}
          onClick={() => onComplete(book)}
        >
          {book.status === "completed"
            ? "✓ Уже прочитано"
            : "✓ Отметить прочитанной"}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || confirmRemove}
          onClick={() => onEdit(book)}
        >
          Редактировать
        </Button>
      </div>
      {confirmRemove ? (
        <div className={styles.confirm}>
          <p>Удалить «{book.title}» с полки?</p>
          <div>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => onRemove(book)}
            >
              Да, удалить
            </Button>
            <Button
              variant="text"
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="text"
          disabled={busy}
          onClick={() => setConfirmRemove(true)}
        >
          Удалить книгу
        </Button>
      )}
      <p className={styles.updated}>
        Обновлено {new Date(book.updatedAt).toLocaleString("ru-RU")}
      </p>
    </article>
  );
}
