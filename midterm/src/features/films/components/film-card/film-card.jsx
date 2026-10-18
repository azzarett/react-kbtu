import { Poster } from '@/common/components/ui/poster';
import styles from './film-card.module.css';

export function FilmCard({ film, onSelect }) {
  return <li className={styles.card}><button onClick={() => onSelect(film)} aria-label={`Подробнее: ${film.title}`}>
    <div className={styles.poster}><Poster src={film.image} title={film.title} /><span className={styles.score}><span aria-hidden="true">★</span> {film.score}<small>/100</small></span>{film.source === 'local' && <span className={styles.local}>Мой фильм</span>}<span className={styles.open} aria-hidden="true">↗</span></div>
    <div className={styles.info}><p>{film.year} <span>·</span> {film.duration} мин</p><h3>{film.title}</h3><p>{film.director}</p></div>
  </button></li>;
}
