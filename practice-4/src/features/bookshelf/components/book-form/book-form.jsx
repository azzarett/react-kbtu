import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { statuses } from "../../constants/statuses";
import styles from "./book-form.module.css";

const emptyBook = {
  title: "",
  author: "",
  genre: "",
  year: "",
  pages: "",
  language: "Русский",
  publisher: "",
  description: "",
  status: "planned",
};
const fields = [
  { name: "title", label: "Название", maxLength: 160 },
  { name: "author", label: "Автор", maxLength: 120 },
  { name: "genre", label: "Жанр", maxLength: 80 },
  {
    name: "year",
    label: "Год первого издания",
    type: "number",
    min: 1,
    max: 2100,
  },
  {
    name: "pages",
    label: "Количество страниц",
    type: "number",
    min: 1,
    max: 100000,
  },
  { name: "language", label: "Язык", maxLength: 80 },
  { name: "publisher", label: "Издательство", maxLength: 120 },
];

export function BookForm({ book, busy, onSave, onCancel }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.keys(emptyBook).map((key) => [key, book?.[key] ?? emptyBook[key]]),
    ),
  );
  const [error, setError] = useState("");

  function change(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    if (busy) return;
    const normalized = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, String(value).trim()]),
    );
    if (Object.values(normalized).some((value) => !value)) {
      setError("Заполните все поля: пробелы не считаются текстом.");
      return;
    }
    onSave({
      ...normalized,
      year: Number(normalized.year),
      pages: Number(normalized.pages),
    });
  }

  return (
    <section className={styles.panel} aria-labelledby="form-title">
      <h2 id="form-title">
        {book ? `Редактировать «${book.title}»` : "Новая книга на полке"}
      </h2>
      <p>Все поля обязательны. Укажите данные вашего издания.</p>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className={styles.fields}>
          <legend className={styles.legend}>Данные книги</legend>
          {fields.map(({ name, label, ...props }) => (
            <label key={name} htmlFor={`book-${name}`}>
              {label}
              <input
                id={`book-${name}`}
                name={name}
                value={values[name]}
                onChange={change}
                required
                {...props}
              />
            </label>
          ))}
          <label htmlFor="book-status">
            Статус
            <select
              id="book-status"
              name="status"
              value={values.status}
              onChange={change}
            >
              {statuses.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fullWidth} htmlFor="book-description">
            Описание
            <textarea
              id="book-description"
              name="description"
              value={values.description}
              onChange={change}
              required
              maxLength={2000}
              rows={3}
            />
          </label>
        </fieldset>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button type="submit" disabled={busy}>
            {busy
              ? "Сохраняем…"
              : book
                ? "Сохранить изменения"
                : "Добавить на полку"}
          </Button>
          <Button variant="text" disabled={busy} onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </section>
  );
}
