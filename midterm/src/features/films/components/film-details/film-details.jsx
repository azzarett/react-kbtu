import { useEffect, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Feedback } from '@/common/components/ui/feedback';
import { Poster } from '@/common/components/ui/poster';
import { getFilm } from '../../api/films-api.js';
import styles from './film-details.module.css';

export function FilmDetails({ selected, onBack }) {
  const [request, setRequest] = useState(() => ({ status: selected.source === 'local' ? 'success' : 'loading', film: selected.source === 'local' ? selected : null, error: '' }));
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (selected.source === 'local') return;
    const controller = new AbortController();
    let active = true;
    getFilm(selected.id, controller.signal).then(film => {
      if (active) setRequest({ status: 'success', film, error: '' });
    }).catch(error => {
      if (active) setRequest({ status: 'error', film: null, error: error.message });
    });
    return () => { active = false; controller.abort(); };
  }, [selected.id, selected.source, retry]);

  function reload() { setRequest({ status: 'loading', film: null, error: '' }); setRetry(value => value + 1); }
  const film = request.film;
  return <section className={styles.section} aria-label="Подробности фильма">
    <Button variant="ghost" onClick={onBack}>← Вернуться к коллекции</Button>
    {request.status === 'loading' && <Feedback kind="loading" title="Загружаем историю…" />}
    {request.status === 'error' && <Feedback kind="error" title="Фильм не загрузился" onRetry={reload}>{request.error}</Feedback>}
    {film && <article className={styles.detail}>
      <div className={styles.poster}><Poster src={film.image} title={film.title} eager /></div>
      <div className={styles.content}><p className={styles.eyebrow}>{film.source === 'api' ? 'STUDIO GHIBLI / КОЛЛЕКЦИЯ' : 'МОЙ ФИЛЬМ / ЛИЧНАЯ КОЛЛЕКЦИЯ'}</p>
        <h1>{film.title}</h1>{film.originalTitle && <p className={styles.original}>{film.originalTitle}</p>}
        <div className={styles.meta}><span>{film.year}</span><span>{film.duration} мин</span><span className={styles.rating}>★ {film.score} / 100</span></div>
        <h2>О фильме</h2><p className={styles.description}>{film.description}</p>
        <dl><div><dt>Режиссёр</dt><dd>{film.director}</dd></div>{film.producer && <div><dt>Продюсер</dt><dd>{film.producer}</dd></div>}<div><dt>Оценка</dt><dd>{film.source === 'api' ? 'Rotten Tomatoes' : 'Личная оценка'} · {film.score}/100</dd></div></dl>
        <p className={styles.note}>{film.source === 'api' ? 'Описание и названия предоставлены Studio Ghibli API на английском языке.' : 'Этот фильм добавлен вами и сохранён только в этом браузере.'}</p>
      </div>
    </article>}
  </section>;
}
