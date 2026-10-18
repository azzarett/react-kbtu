import { Poster } from '@/common/components/ui/poster';
import styles from './collection-hero.module.css';

export function CollectionHero({ film, onSelect }) {
  return <section className={styles.hero} aria-labelledby="hero-title">
    <div className={styles.copy}><p className={styles.eyebrow}><span /> КИНО, В КОТОРОЕ ХОЧЕТСЯ ВЕРНУТЬСЯ</p><h1 id="hero-title">Большие истории.<br /><em>Маленькая коллекция.</em></h1><p className={styles.intro}>Миры Studio Ghibli — от тихих улочек до летающих замков. Найдите историю под своё настроение.</p><div className={styles.signature}><span aria-hidden="true">✳</span> Нарисовано с любовью. Выбрано вами.</div></div>
    {film ? <button className={styles.feature} onClick={() => onSelect(film)} aria-label={`Подробнее о фильме ${film.title}`}><Poster className={styles.banner} key={film.banner} src={film.banner} title={film.title} eager /><div className={styles.caption}><span>В ОБЪЕКТИВЕ</span><strong>{film.title}</strong><span>{film.year} · {film.director}</span></div><span className={styles.arrow} aria-hidden="true">↗</span></button> : <div className={styles.art} aria-hidden="true"><span>風</span><p>STUDIO GHIBLI<br />A WORLD OF WONDER</p></div>}
  </section>;
}
