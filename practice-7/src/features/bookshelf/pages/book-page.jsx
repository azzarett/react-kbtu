import { Link, useLocation, useParams } from "react-router";
import { Feedback } from "@/common/components/ui/feedback";
import { useBookRequest } from "../hooks/use-book-request.js";
import { fetchBook } from "../services/service.js";
import { statusLabel } from "../constants/statuses.js";
import styles from "./books-pages.module.css";

export default function BookPage() {
  const { id } = useParams();
  const location = useLocation();
  const request = useBookRequest(fetchBook, id ?? "");
  const from = location.state?.from;
  const backTo = typeof from === "string" && /^\/(books|dashboard)(\?|$)/.test(from)
    ? from : `/books${location.search}`;
  const book = request.data;
  const fields = book ? [
    ["Жанр", book.genre], ["Год первого издания", book.year], ["Количество страниц", book.pages],
    ["Язык", book.language], ["Издательство", book.publisher], ["Статус", statusLabel(book.status)],
    ["Обновлено", new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(book.updatedAt))],
  ] : [];

  return <section className={styles.page}>
    <nav className={styles.backLinks} aria-label="Навигация по книгам"><Link to={backTo}>← Назад</Link><Link to="/books">Все книги</Link></nav>
    {request.status === "loading" && <Feedback loading title="Открываем книгу…" description="Запрашиваем запись по её идентификатору." />}
    {request.status === "error" && <Feedback error title="Не удалось открыть книгу" description={request.error} actionLabel="Попробовать ещё раз" onAction={request.reload} />}
    {request.status === "success" && <article className={styles.detail}>
      <p className={styles.eyebrow}>КНИГА НА ВАШЕЙ ПОЛКЕ</p>
      <h1>{book.title}</h1>
      <p className={styles.author}>{book.author}</p>
      <section className={styles.description}><h2>Об этой книге</h2><p>{book.description}</p></section>
      <dl className={styles.facts}>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p className={styles.source}>Источник: локальный API личной полки. Это сохранённая запись об отдельном издании, а не данные внешнего каталога.</p>
      <Link to="/library" className={styles.textLink}>Редактировать книги в моей полке →</Link>
    </article>}
  </section>;
}
