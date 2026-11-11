import { Link } from "react-router";
import styles from "./home-page.module.css";
export function HomePage() {
  return <>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>МЕСТО ДЛЯ ХОРОШИХ ИСТОРИЙ</p>
      <h1>Ваша следующая<br /><em>глава.</em></h1>
      <p className={styles.intro}>Открывайте книги в мировом каталоге.<br />Собирайте те, к которым хочется возвращаться.</p>
      <Link to="/catalog?q=Tolkien" className={styles.primary}>Найти свою книгу <span aria-hidden="true">↗</span></Link>
      <img className={styles.bookMark} src={`${import.meta.env.BASE_URL}reading.svg`} width="230" height="320" alt="Иллюстрация книжной обложки: ещё одна хорошая история" />
    </section>
    <section className={styles.grid} aria-label="Возможности">
      <Link to="/catalog" className={styles.card}><span className={styles.number}>01 / ОТКРЫВАЙТЕ</span><h2>Мировая библиотека</h2><p>Настоящие данные Open Library. Ищите по названию или автору, изучайте описания и темы.</p><span className={styles.action}>Открыть каталог →</span></Link>
      <Link to="/library" className={styles.card}><span className={styles.number}>02 / СОХРАНЯЙТЕ</span><h2>Ваша личная полка</h2><p>Добавляйте книги, ведите список прочитанного и редактируйте записи. Полка хранится в этом браузере.</p><span className={styles.action}>К моей полке →</span></Link>
    </section>
    <nav className={styles.quickLinks} aria-label="Другие разделы">
      <Link to="/books">Все книги и фильтры →</Link>
      <Link to="/dashboard">Статистика моей полки →</Link>
      <Link to="/about">О проекте →</Link>
    </nav>
  </>;
}
export function NotFoundPage() {
  return <section className={styles.notFound}><p className={styles.eyebrow}>404 / СТРАНИЦА НЕ НАЙДЕНА</p><h1>Кажется, эта глава потерялась.</h1><p>Проверьте адрес или начните с главной страницы.</p><Link to="/" className={styles.primary}>На главную</Link></section>;
}
