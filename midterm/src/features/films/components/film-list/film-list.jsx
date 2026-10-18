import { FilmCard } from '../film-card/film-card.jsx';
import styles from './film-list.module.css';

export function FilmList({ films, onSelect }) {
  return <ul className={styles.list}>{films.map(film => <FilmCard key={film.id} film={film} onSelect={onSelect} />)}</ul>;
}
