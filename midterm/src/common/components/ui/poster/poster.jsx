import { useState } from 'react';
import styles from './poster.module.css';

export function Poster({ src, title, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <img className={`${styles.image} ${className}`} src={src} alt={`Постер «${title}»`} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
    : <div className={`${styles.fallback} ${className}`} role="img" aria-label={`Фильм «${title}», без постера`}><span aria-hidden="true">◉</span><span>{title}</span><small>КИНОКОЛЛЕКЦИЯ</small></div>;
}
