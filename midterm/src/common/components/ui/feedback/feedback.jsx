import { Button } from '@/common/components/ui/button';
import styles from './feedback.module.css';

export function Feedback({ kind = 'empty', title, children, onRetry, actionLabel = 'Попробовать снова' }) {
  return <div className={`${styles.feedback} ${styles[kind] || ''}`} role={kind === 'error' ? 'alert' : 'status'}>
    {kind === 'loading' && <span className={styles.spinner} aria-hidden="true" />}
    <h2>{title}</h2>
    {children && <p>{children}</p>}
    {onRetry && <Button variant="secondary" onClick={onRetry}>{actionLabel}</Button>}
  </div>;
}
