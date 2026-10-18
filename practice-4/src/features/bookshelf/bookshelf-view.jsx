import { useEffect, useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Feedback } from "@/common/components/ui/feedback";
import {
  getBooks,
  createBook,
  updateBook,
  removeBook,
  toBookSummary,
} from "./api/books-api";
import { BookList } from "./components/book-list/book-list";
import { BookDetails } from "./components/book-details/book-details";
import { BookForm } from "./components/book-form/book-form";
import styles from "./bookshelf-view.module.css";

export function BookshelfView() {
  const [books, setBooks] = useState([]);
  const [listState, setListState] = useState({ status: "loading", error: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState(null);
  const [mutation, setMutation] = useState(null);
  const [notice, setNotice] = useState(null);
  const busy = mutation !== null;

  useEffect(() => {
    // Cancel older list reads before a write so they cannot overwrite its result.
    if (mutation) return;
    const controller = new AbortController();
    let active = true;
    getBooks({ signal: controller.signal })
      .then((items) => {
        if (!active) return;
        setBooks(items);
        setListState({ status: "success", error: "" });
        setSelectedId((current) =>
          items.some((book) => book.id === current) ? current : null,
        );
      })
      .catch((error) => {
        if (active && error.name !== "AbortError")
          setListState({ status: "error", error: error.message });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [revision, mutation]);

  useEffect(() => {
    if (!mutation) return;
    const controller = new AbortController();
    let active = true;
    // This command captures its own ID and values, independent of later selection.
    const { kind, id, values, title, selectionAtStart } = mutation;
    const options = { signal: controller.signal };
    const operation =
      kind === "create"
        ? createBook(values, options)
        : kind === "remove"
          ? removeBook(id, options)
          : updateBook(id, values, options);

    operation
      .then((result) => {
        if (!active) return;
        if (kind === "remove") {
          setBooks((current) => current.filter((book) => book.id !== id));
          setSelectedId((current) => (current === id ? null : current));
        } else if (kind === "create") {
          setBooks((current) => [...current, toBookSummary(result)]);
          setSelectedId((current) =>
            current === selectionAtStart ? result.id : current,
          );
        } else {
          setBooks((current) =>
            current.map((book) =>
              book.id === id ? toBookSummary(result) : book,
            ),
          );
        }
        if (kind === "create" || kind === "edit") setForm(null);
        const action = {
          create: "добавлена",
          edit: "сохранена",
          remove: "удалена",
          complete: "отмечена как прочитанная",
        }[kind];
        setNotice({ type: "success", text: `«${title}» ${action}.` });
        // Remount details and reload the list from the API after a successful write.
        setRevision((current) => current + 1);
        setMutation(null);
      })
      .catch((error) => {
        if (!active || error.name === "AbortError") return;
        setNotice({
          type: "error",
          text: `«${title}»: ${error.message} Изменения не сохранены.`,
        });
        setMutation(null);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [mutation]);

  function startMutation(kind, book, values) {
    if (busy) return;
    setNotice(null);
    setListState({ status: "loading", error: "" });
    setMutation({
      kind,
      id: book?.id,
      title: values?.title ?? book?.title,
      values,
      selectionAtStart: selectedId,
    });
  }

  function reload() {
    if (busy) return;
    setListState({ status: "loading", error: "" });
    setRevision((current) => current + 1);
  }

  function selectBook(id) {
    setSelectedId(id);
    if (!busy) setForm(null);
  }

  return (
    <div className={styles.shell}>
      <a href="#library" className={styles.skipLink}>
        К библиотеке
      </a>
      <header className={styles.header}>
        <a className={styles.brand} href="./" aria-label="Полка — главная">
          <span aria-hidden="true">▥</span> полка
          <span className={styles.brandDot}>.</span>
        </a>
        <span className={styles.headerCaption}>ЛИЧНАЯ БИБЛИОТЕКА</span>
      </header>
      <main id="library">
        <section className={styles.intro} aria-labelledby="page-title">
          <div>
            <p className={styles.eyebrow}>МЕСТО ДЛЯ ХОРОШИХ ИСТОРИЙ</p>
            <h1 id="page-title">Ваша следующая глава.</h1>
            <p className={styles.subtitle}>
              Собирайте книги, к которым хочется возвращаться.
            </p>
          </div>
          <Button
            disabled={busy || form !== null}
            onClick={() => {
              setForm({ mode: "create", book: null });
              setNotice(null);
            }}
          >
            + Добавить книгу
          </Button>
        </section>

        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={`${styles.notice} ${notice.type === "error" ? styles.errorNotice : ""}`}
          >
            {notice.text}
          </div>
        )}
        {busy && (
          <p role="status" className={styles.pending}>
            Сохраняем изменения для «{mutation.title}»… Можно выбрать другую
            книгу.
          </p>
        )}
        {form && (
          <BookForm
            key={form.book?.id ?? "new"}
            book={form.book}
            busy={busy}
            onCancel={() => setForm(null)}
            onSave={(values) => startMutation(form.mode, form.book, values)}
          />
        )}

        <div className={styles.workspace}>
          <section
            className={styles.collection}
            aria-labelledby="collection-title"
          >
            <div className={styles.sectionHeader}>
              <h2 id="collection-title">
                На моей полке <span>{books.length}</span>
              </h2>
              <Button
                variant="text"
                disabled={busy || listState.status === "loading"}
                onClick={reload}
              >
                ↻ Обновить
              </Button>
            </div>
            {listState.status === "loading" && !busy && (
              <p className={styles.listLoading} role="status">
                Загружаем книги…
              </p>
            )}
            {listState.status === "error" && (
              <Feedback
                error
                title="Не удалось обновить список"
                description={listState.error}
                actionLabel="Повторить загрузку"
                onAction={reload}
              />
            )}
            {books.length > 0 && (
              <BookList
                books={books}
                selectedId={selectedId}
                onSelect={selectBook}
              />
            )}
            {listState.status === "success" && books.length === 0 && (
              <Feedback
                title="Здесь начнётся ваша библиотека"
                description="Добавьте первую книгу — прочитанную или ту, что давно в планах."
              />
            )}
          </section>

          <aside className={styles.details} aria-label="Карточка книги">
            {selectedId ? (
              <BookDetails
                key={`${selectedId}:${revision}`}
                id={selectedId}
                busy={busy || form !== null}
                onEdit={(book) => {
                  setForm({ mode: "edit", book });
                  setNotice(null);
                }}
                onRemove={(book) => startMutation("remove", book)}
                onComplete={(book) =>
                  startMutation("complete", book, { status: "completed" })
                }
              />
            ) : (
              <div className={styles.placeholder}>
                <span aria-hidden="true">▤</span>
                <h2>У каждой книги своя история</h2>
                <p>
                  Выберите книгу на полке,
                  <br />
                  чтобы открыть её карточку.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>Хорошие книги остаются с нами.</span>
        <span>Данные сохраняются в этом браузере</span>
      </footer>
    </div>
  );
}
