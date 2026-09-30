import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import styles from "./add-book-form.module.css";

export function AddBookForm({ onAdd, onClose }) {
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = data.get("title").trim();
    const author = data.get("author").trim();
    if (!title || !author) {
      setError("Укажите название книги и автора.");
      return;
    }
    onAdd({
      title,
      author,
      totalPages: Number(data.get("pages")),
      category: data.get("category").trim() || "Без жанра",
    });
  }

  return (
    <section className={styles.addPanel} aria-labelledby="add-heading">
      <div className={styles.addHeading}>
        <h2 id="add-heading">Новая книга</h2>
        <Button type="button" variant="text" onClick={onClose}>
          Отмена
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Название
          <input
            name="title"
            autoFocus
            required
            maxLength="120"
            placeholder="Например, Три товарища"
          />
        </label>
        <label>
          Автор
          <input
            name="author"
            required
            maxLength="100"
            placeholder="Эрих Мария Ремарк"
          />
        </label>
        <label>
          Жанр
          <input name="category" maxLength="40" placeholder="Роман" />
        </label>
        <label>
          Страниц
          <input
            name="pages"
            type="number"
            min="1"
            max="10000"
            step="1"
            required
            placeholder="480"
          />
        </label>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <Button variant="primary" className={styles.formSubmit} type="submit">
          На полку <span aria-hidden="true">↗</span>
        </Button>
      </form>
    </section>
  );
}
