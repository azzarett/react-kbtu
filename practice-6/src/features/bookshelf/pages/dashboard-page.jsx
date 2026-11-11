import { Link, useSearchParams } from "react-router";
import { Button } from "@/common/components/ui/button";
import { Feedback } from "@/common/components/ui/feedback";
import { BookCard } from "../components/book-card/book-card.jsx";
import { useBookRequest } from "../hooks/use-book-request.js";
import { fetchDashboard, parseBookFilters } from "../services/service.js";
import { statuses } from "../constants/statuses.js";
import styles from "./books-pages.module.css";

function booksLink(filters) {
  const params = new URLSearchParams();
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.status) params.set("status", filters.status);
  return `/books${params.size ? `?${params}` : ""}`;
}

function Breakdown({ title, entries, total, filters, field }) {
  return <section className={styles.breakdown}>
    <h2>{title}</h2>
    {entries.length ? <ul>{entries.map(({ value, label, count }) => <li key={value}>
      <Link to={booksLink({ ...filters, [field]: value })}><span>{label}</span><strong>{count}</strong></Link>
      <div className={styles.barTrack} aria-hidden="true"><span style={{ width: `${total ? count / total * 100 : 0}%` }} /></div>
    </li>)}</ul> : <p className={styles.muted}>Нет данных для распределения.</p>}
  </section>;
}

export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const parsed = parseBookFilters(params);
  const filters = { genre: parsed.genre, status: parsed.status };
  const request = useBookRequest(fetchDashboard, filters);
  const genres = [...new Set([...(request.data?.genres ?? []), ...(filters.genre ? [filters.genre] : [])])];
  function changeFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  const stats = request.data?.stats;
  const metrics = stats ? [
    ["Книг в выборке", stats.totalBooks], ["Всего страниц", stats.totalPages],
    ["Средний объём", `${stats.averagePages} стр.`], ["Прочитано", stats.completedBooks],
    ["Доля прочитанного", `${stats.completionRate}%`], ["Авторов", stats.uniqueAuthors],
  ] : [];
  const search = booksLink(filters).replace(/^\/books/, "");

  return <section className={styles.page}>
    <p className={styles.eyebrow}>ЧТЕНИЕ В ЦИФРАХ</p>
    <div className={styles.titleRow}><h1>Статистика полки</h1><Link to={booksLink(filters)} className={styles.textLink}>К книгам выборки →</Link></div>
    <p className={styles.subtitle}>Посмотрите, какие истории уже позади и сколько ещё впереди.</p>
    <p className={styles.source}>Расчёты по ответу локального API. Включены только записи личной полки в этом браузере, включая учебные примеры.</p>
    <div className={`${styles.filters} ${styles.dashboardFilters}`}>
      <div><label htmlFor="dashboard-genre">Жанр для статистики</label><select id="dashboard-genre" value={filters.genre} onChange={(event) => changeFilter("genre", event.target.value)}>
        <option value="">Все жанры</option>{genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
      </select></div>
      <div><label htmlFor="dashboard-status">Статус для статистики</label><select id="dashboard-status" value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}>
        <option value="">Все статусы</option>{statuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select></div>
      <Button variant="text" disabled={!filters.genre && !filters.status} onClick={() => setParams({})}>Сбросить фильтры</Button>
    </div>

    {request.status === "loading" && <Feedback loading title="Собираем статистику…" description="Получаем полные записи из API и рассчитываем показатели." />}
    {request.status === "error" && <Feedback error title="Не удалось загрузить статистику" description={request.error} actionLabel="Повторить загрузку" onAction={request.reload} />}
    {request.status === "success" && <>
      <p className={styles.resultNote} role="status">В выборке: {stats.totalBooks} книг. Показатели и распределения обновлены с учётом фильтров.</p>
      <dl className={styles.metrics}>{metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? value.toLocaleString("ru-RU") : value}</dd></div>)}</dl>
      <div className={styles.breakdowns}>
        <Breakdown title="По жанрам" entries={stats.genres} total={stats.totalBooks} filters={filters} field="genre" />
        <Breakdown title="По статусам" entries={stats.statuses} total={stats.totalBooks} filters={filters} field="status" />
      </div>
      <section className={styles.related}><div className={styles.resultsHeading}><h2>Книги в выборке</h2><Link to={booksLink(filters)} className={styles.textLink}>Смотреть все →</Link></div>
        {request.data.books.length ? <ul className={styles.grid}>{request.data.books.slice(0, 3).map((book) => <li key={book.id}><BookCard book={book} search={search} /></li>)}</ul>
          : <Feedback title="В этой выборке пока нет книг" description="Выберите другие фильтры или добавьте книгу в личную полку." />}
      </section>
    </>}
  </section>;
}
