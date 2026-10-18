import { Button } from '@/common/components/ui/button';
import styles from './film-filters.module.css';

export function FilmFilters({ filters, directors, onChange, onReset }) {
  const update = event => onChange({ ...filters, [event.target.name]: event.target.value });
  return <div className={styles.filters}>
    <label className={styles.search}><span>Поиск по коллекции</span><input type="search" name="query" value={filters.query} onChange={update} placeholder="Название или режиссёр…" /></label>
    <label><span>Режиссёр</span><select name="director" value={filters.director} onChange={update}><option value="">Все режиссёры</option>{directors.map(director => <option key={director}>{director}</option>)}</select></label>
    <label><span>Рейтинг</span><select name="rating" value={filters.rating} onChange={update}><option value="">Любой рейтинг</option><option value="90">90 и выше</option><option value="80">80 и выше</option><option value="70">70 и выше</option></select></label>
    <label><span>Источник</span><select name="source" value={filters.source} onChange={update}><option value="">Все фильмы</option><option value="api">Studio Ghibli</option><option value="local">Мои фильмы</option></select></label>
    <Button className={styles.reset} variant="ghost" onClick={onReset}>Сбросить</Button>
  </div>;
}
