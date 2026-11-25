import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/common/components/ui/button";
import { Feedback } from "@/common/components/ui/feedback";
import { useCollectionRequest } from "./hooks/use-book-request.js";
import { saveBook } from "./state/bookshelf-slice.js";
import { selectBookMutation, selectBookSummaries } from "./state/bookshelf-selectors.js";
import { BookList } from "./components/book-list/book-list";
import { BookDetails } from "./components/book-details/book-details";
import { BookForm } from "./components/book-form/book-form";
import styles from "./bookshelf-view.module.css";

export function BookshelfView() {
  const dispatch = useDispatch();
  const books = useSelector(selectBookSummaries);
  const listState = useCollectionRequest();
  const mutation = useSelector(selectBookMutation);
  const [selection, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState(null);
  const pendingWrite = useRef(null);
  const busy = mutation !== null;
  const selectedId = books.some((book) => book.id === selection) ? selection : null;

  useEffect(() => () => {
    pendingWrite.current?.abort();
    pendingWrite.current = null;
  }, []);

  async function startMutation(kind, book, values) {
    if (busy || pendingWrite.current) return;
    const title = values?.title ?? book?.title;
    const selectionAtStart = selection;
    setNotice(null);

    const operation = dispatch(saveBook({ kind, id: book?.id, title, values }));
    pendingWrite.current = operation;
    const result = await operation;
    if (pendingWrite.current !== operation) return;
    pendingWrite.current = null;

    if (saveBook.fulfilled.match(result)) {
      if (kind === "create") {
        setSelectedId((current) => current === selectionAtStart ? result.payload.book.id : current);
      }
      if (kind === "remove") {
        setSelectedId((current) => current === book.id ? null : current);
      }
      if (kind === "create" || kind === "edit") setForm(null);
      const action = {
        create: "добавлена",
        edit: "сохранена",
        remove: "удалена",
        complete: "отмечена как прочитанная",
      }[kind];
      setNotice({ type: "success", text: `«${title}» ${action}.` });
    } else if (!result.meta.aborted && !result.meta.condition) {
      setNotice({
        type: "error",
        text: `«${title}»: ${result.error.message} Изменения не сохранены.`,
      });
    }
  }

  function selectBook(id) {
    setSelectedId(id);
    if (!busy) setForm(null);
  }

  return (
    <div className={styles.shell}>
      <section id="library">
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
                onClick={listState.reload}
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
                onAction={listState.reload}
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
                key={selectedId}
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
      </section>

    </div>
  );
}
