import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/common/components/ui/button";
import { Feedback } from "@/common/components/ui/feedback";
import { BookCard } from "../components/book-card/book-card.jsx";
import { statuses } from "../constants/statuses.js";
import { useBookRequest } from "../hooks/use-book-request.js";
import { BOOK_SORTS, fetchBooksPage, parseBookFilters } from "../services/service.js";
import styles from "./books-pages.module.css";

export default function BooksPage() {
  const [params, setParams] = useSearchParams();
  const filters = parseBookFilters(params);
  const request = useBookRequest(fetchBooksPage, filters);
  const selectedPage = request.data?.page;

  useEffect(() => {
    if (request.status === "success" && selectedPage !== filters.page) {
      const next = new URLSearchParams(params);
      next.set("page", String(selectedPage));
      setParams(next, { replace: true });
    }
  }, [request.status, selectedPage, filters.page, params, setParams]);

  function changeFilters(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, String(value));
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  }

  function search(event) {
    event.preventDefault();
    changeFilters({ q: new FormData(event.currentTarget).get("q").trim() });
  }

  const genres = [...new Set([...(request.data?.genres ?? []), ...(filters.genre ? [filters.genre] : [])])];
  const hasFilters = filters.q || filters.genre || filters.status || filters.sort !== "title-asc" || filters.page !== 1;
  const searchString = params.toString() ? `?${params}` : "";

  return <section className={styles.page}>
    <p className={styles.eyebrow}>ВАШИ КНИГИ, ВАШ ПОРЯДОК</p>
    <div className={styles.titleRow}><h1>Все книги</h1><Link to="/library" className={styles.textLink}>Управлять полкой →</Link></div>
    <p className={styles.subtitle}>Найдите нужную историю по названию, автору, жанру или статусу чтения.</p>
    <p className={styles.source}>Источник: локальный API личной полки. Данные и учебные примеры хранятся только в этом браузере.</p>

    <form onSubmit={search} role="search" className={styles.searchForm}>
      <div><label htmlFor="books-search">Название или автор</label><input key={filters.q} id="books-search" name="q" type="search" maxLength={200} defaultValue={filters.q} placeholder="Например, Мураками" /></div>
      <Button type="submit">Найти</Button>
    </form>
    <div className={styles.filters}>
      <div><label htmlFor="books-genre">Жанр</label><select id="books-genre" value={filters.genre} onChange={(event) => changeFilters({ genre: event.target.value })}>
        <option value="">Все жанры</option>{genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
      </select></div>
      <div><label htmlFor="books-status">Статус</label><select id="books-status" value={filters.status} onChange={(event) => changeFilters({ status: event.target.value })}>
        <option value="">Все статусы</option>{statuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select></div>
      <div><label htmlFor="books-sort">Сортировка</label><select id="books-sort" value={filters.sort} onChange={(event) => changeFilters({ sort: event.target.value })}>
        {BOOK_SORTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select></div>
      <Button variant="text" disabled={!hasFilters} onClick={() => setParams({})}>Сбросить фильтры</Button>
    </div>

    {request.status === "loading" && <Feedback loading title="Загружаем книги…" description="Локальный API обрабатывает поиск и фильтры." />}
    {request.status === "error" && <Feedback error title="Не удалось загрузить книги" description={request.error} actionLabel="Повторить загрузку" onAction={request.reload} />}
    {request.status === "success" && <>
      <div className={styles.resultsHeading}><h2>Результаты</h2><p role="status">Найдено: {request.data.total} · Страница {request.data.page} из {request.data.pageCount}</p></div>
      {request.data.books.length ? <ul className={styles.grid}>{request.data.books.map((book) => <li key={book.id}><BookCard book={book} search={searchString} /></li>)}</ul>
        : <Feedback title="Книг не найдено" description="Измените поиск или фильтры. Новые записи можно добавить в разделе «Моя полка»." />}
      {request.data.pageCount > 1 && <nav className={styles.pagination} aria-label="Страницы книг">
        <Button variant="secondary" disabled={request.data.page === 1} onClick={() => changeFilters({ page: request.data.page - 1 })}>← Назад</Button>
        <span>Страница {request.data.page} из {request.data.pageCount}</span>
        <Button variant="secondary" disabled={request.data.page === request.data.pageCount} onClick={() => changeFilters({ page: request.data.page + 1 })}>Далее →</Button>
      </nav>}
    </>}
  </section>;
}
