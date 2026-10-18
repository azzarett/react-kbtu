import { Button } from '@/common/components/ui/button';
import styles from './site-header.module.css';

export function SiteHeader({ onHome, onAdd, view }) {
  return <header className={styles.header}>
    <button className={styles.brand} onClick={onHome} aria-label="Кадр — главная"><span className={styles.mark} aria-hidden="true">▧</span>кадр<span className={styles.dot}>.</span></button>
    <nav aria-label="Основная навигация"><button className={styles.catalog} onClick={onHome} aria-current={view === 'catalog' ? 'page' : undefined}>Коллекция</button><Button onClick={onAdd} variant="secondary"><span aria-hidden="true">＋</span> Добавить фильм</Button></nav>
  </header>;
}
