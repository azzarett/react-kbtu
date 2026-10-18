import { Button } from '@/common/components/ui/button';
import styles from './pagination.module.css';

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return <nav className={styles.pagination} aria-label="Страницы каталога">
    <Button variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>← Назад</Button>
    <span className={styles.pages}>{Array.from({ length: pages }, (_, index) => index + 1).map(number =>
      <button key={number} aria-label={`Страница ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>,
    )}</span>
    <Button variant="secondary" disabled={page === pages} onClick={() => onChange(page + 1)}>Далее →</Button>
  </nav>;
}
