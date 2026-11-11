import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { Button } from "@/common/components/ui/button";
import { Feedback } from "@/common/components/ui/feedback";
import { searchBooks, getCatalogBook } from "../services/service";
import styles from "./catalog-pages.module.css";

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "Tolkien").slice(0, 200);
  const rawPage = params.get("page") ?? "1";
  const page = /^\d+$/.test(rawPage) && Number(rawPage) > 0 && Number(rawPage) <= 10000 ? Number(rawPage) : 1;
  function submit(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("query").trim();
    setParams({ q: value });
  }
  return <section className={styles.page}>
    <p className={styles.eyebrow}>ОТКРЫВАЙТЕ НОВЫЕ ИСТОРИИ</p>
    <h1>Мировая библиотека</h1>
    <p className={styles.subtitle}>Книги и авторы из открытого каталога Open Library.</p>
    <form className={styles.search} onSubmit={submit} role="search">
      <div><label htmlFor="book-search">Название книги или автор</label><input key={query} id="book-search" name="query" type="search" maxLength={200} defaultValue={query} placeholder="Например, Tolkien" /></div>
      <Button type="submit">Найти книги</Button>
    </form>
    <CatalogResults key={`${query}:${page}`} query={query} page={page} onPage={(next) => setParams({ q: query, page: String(next) })} />
  </section>;
}
function CatalogResults({ query, page, onPage }) {
  const [request, setRequest] = useState({ status: "loading", data: null, error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    searchBooks(query, { page, signal: controller.signal }).then((data) => {
      if (active) setRequest({ status: "success", data, error: "" });
    }).catch((error) => {
      if (active && error.name !== "AbortError") setRequest({ status: "error", data: null, error: error.message });
    });
    return () => { active = false; controller.abort(); };
  }, [query, page, retry]);
  function reload() { setRequest({ status: "loading", data: null, error: "" }); setRetry((value) => value + 1); }
  if (!query.trim()) return <Feedback title="Какую историю будем искать?" description="Введите название книги или имя автора." />;
  if (request.status === "loading") return <Feedback loading title="Ищем книги…" description="Запрашиваем настоящий каталог Open Library." />;
  if (request.status === "error") return <Feedback error title="Каталог пока недоступен" description={request.error} actionLabel="Повторить запрос" onAction={reload} />;
  const { books, total } = request.data;
  const search = new URLSearchParams({ q: query, page: String(page) }).toString();
  return <>
    <div className={styles.resultsHeading}><h2>Результаты поиска</h2><p role="status">Найдено: {total.toLocaleString("ru-RU")} · Страница {page}</p></div>
    {books.length === 0 ? <Feedback title="Книг не найдено" description="Попробуйте другое название или имя автора." /> : <ul className={styles.grid}>
      {books.map((book, index) => <li key={book.id}><Link className={styles.bookCard} to={`${book.id}?${search}`}>
        <div className={`${styles.cover} ${styles[`tone${index % 4}`]}`} aria-hidden="true"><span>OPEN LIBRARY</span><b>{book.title.slice(0, 1)}</b><small>{book.year ?? "КНИГА"}</small></div>
        <div className={styles.bookInfo}><h3>{book.title}</h3><p>{book.authors.length ? book.authors.join(", ") : "Автор не указан"}</p><span>{book.year ? `Первое издание: ${book.year}` : "Год не указан"}</span><span className={styles.readMore}>О книге →</span></div>
      </Link></li>)}
    </ul>}
    {(page > 1 || page * 12 < total) && <nav className={styles.pagination} aria-label="Страницы каталога"><Button variant="secondary" disabled={page === 1} onClick={() => onPage(page - 1)}>← Назад</Button><span>Страница {page}</span><Button variant="secondary" disabled={page * 12 >= total || page >= 10000} onClick={() => onPage(page + 1)}>Далее →</Button></nav>}
    <p className={styles.sourceNote}>Это внешний каталог. Изменения в личной полке не изменяют данные Open Library.</p>
  </>;
}
export function CatalogBookPage() {
  const { workId } = useParams();
  const { search } = useLocation();
  return <CatalogBook key={workId} workId={workId} search={search} />;
}
function CatalogBook({ workId, search }) {
  const [request, setRequest] = useState({ status: "loading", book: null, error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    getCatalogBook(workId, { signal: controller.signal }).then((book) => {
      if (active) setRequest({ status: "success", book, error: "" });
    }).catch((error) => {
      if (active && error.name !== "AbortError") setRequest({ status: "error", book: null, error: error.message });
    });
    return () => { active = false; controller.abort(); };
  }, [workId, retry]);
  function reload() { setRequest({ status: "loading", book: null, error: "" }); setRetry((value) => value + 1); }
  return <section className={styles.page}>
    <Link to={`/catalog${search}`} className={styles.back}>← К результатам поиска</Link>
    {request.status === "loading" && <Feedback loading title="Открываем книгу…" />}
    {request.status === "error" && <Feedback error title="Не удалось открыть книгу" description={request.error} actionLabel="Попробовать ещё раз" onAction={reload} />}
    {request.status === "success" && <article className={styles.detail}>
      <p className={styles.eyebrow}>КАРТОЧКА OPEN LIBRARY / {request.book.id}</p>
      <h1>{request.book.title}</h1>
      {request.book.firstPublishDate && <p className={styles.subtitle}>Первое издание: {request.book.firstPublishDate}</p>}
      <section className={styles.description}><h2>Об этой книге</h2><p>{request.book.description || "В каталоге пока нет описания этой книги."}</p></section>
      {request.book.subjects.length > 0 && <section className={styles.subjects}><h2>Темы</h2><ul>{request.book.subjects.slice(0, 12).map((subject) => <li key={subject}>{subject}</li>)}</ul></section>}
      <a href={request.book.sourceUrl} target="_blank" rel="noreferrer" className={styles.sourceLink}>Посмотреть источник в Open Library ↗</a>
      <p className={styles.sourceNote}>Найдите что-то близкое? Название и автора можно добавить в свою личную полку.</p>
      <Link to="/library" className={styles.back}>Перейти на мою полку →</Link>
    </article>}
  </section>;
}
