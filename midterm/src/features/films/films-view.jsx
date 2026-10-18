import { useEffect, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Feedback } from '@/common/components/ui/feedback';
import { Pagination } from '@/common/components/ui/pagination';
import { getFilms } from './api/films-api.js';
import { readLocalFilms } from './model/local-films.js';
import { DEFAULT_FILTERS, PAGE_SIZE, paginate, selectFilms } from './model/catalog.js';
import { SiteHeader } from './components/site-header/site-header.jsx';
import { CollectionHero } from './components/collection-hero/collection-hero.jsx';
import { FilmFilters } from './components/film-filters/film-filters.jsx';
import { FilmList } from './components/film-list/film-list.jsx';
import { FilmDetails } from './components/film-details/film-details.jsx';
import { FilmForm } from './components/film-form/film-form.jsx';
import styles from './films-view.module.css';

function loadLocalState() {
  try { return { films: readLocalFilms(), error: '' }; }
  catch { return { films: [], error: 'Не удалось прочитать ваши фильмы из хранилища браузера. Публичная коллекция доступна; сохранённые данные не изменены.' }; }
}

export function FilmsView() {
  const [remote, setRemote] = useState({ films: [], status: 'loading', error: '' });
  const [local, setLocal] = useState(loadLocalState);
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [screen, setScreen] = useState({ view: 'catalog', film: null });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    getFilms(controller.signal).then(films => {
      if (active) setRemote({ films, status: 'success', error: '' });
    }).catch(error => {
      if (active) setRemote({ films: [], status: 'error', error: error.message });
    });
    return () => { active = false; controller.abort(); };
  }, [revision]);

  const films = [...remote.films, ...local.films];
  const directors = [...new Set(films.map(film => film.director))].sort();
  const results = selectFilms(films, filters);
  const pagination = paginate(results, page);
  const featured = remote.films.find(film => film.title === 'Spirited Away') || remote.films[0];

  function home() { setScreen({ view: 'catalog', film: null }); }
  function select(film) { setScreen({ view: 'details', film }); setNotice(''); }
  function changeFilters(next) { setFilters(next); setPage(1); }
  function reload() { setRemote({ films: [], status: 'loading', error: '' }); setRevision(value => value + 1); }
  function saved(film) {
    setLocal(current => ({ films: [...current.films, film], error: '' }));
    setNotice(`«${film.title}» добавлен в коллекцию и сохранён в этом браузере.`);
    changeFilters({ ...DEFAULT_FILTERS, source: 'local' });
    home();
  }

  return <div className={styles.shell}><SiteHeader view={screen.view} onHome={home} onAdd={() => { setScreen({ view: 'form', film: null }); setNotice(''); }} />
    <main>
      {notice && <div className={styles.notice} role="status"><span>✓ {notice}</span><button onClick={() => setNotice('')} aria-label="Закрыть уведомление">×</button></div>}
      {local.error && <p className={styles.warning} role="alert">{local.error}</p>}
      {screen.view === 'catalog' && <>
        <CollectionHero film={featured} onSelect={select} />
        <section aria-labelledby="collection-title">
          <div className={styles.heading}><div><span className={styles.eyebrow}>НАЙДИТЕ СВОЮ ИСТОРИЮ</span><h2 id="collection-title">Коллекция фильмов <span>{films.length}</span></h2></div><Button variant="ghost" onClick={reload} disabled={remote.status === 'loading'}>↻ Обновить</Button></div>
          <FilmFilters filters={filters} directors={directors} onChange={changeFilters} onReset={() => changeFilters(DEFAULT_FILTERS)} />
          {remote.status === 'loading' && <Feedback kind="loading" title="Собираем коллекцию…">Загружаем фильмы из Studio Ghibli API.</Feedback>}
          {remote.status === 'error' && <Feedback kind="error" title="Коллекция не загрузилась" onRetry={reload}>{remote.error}</Feedback>}
          {(remote.status === 'success' || local.films.length > 0) && <>
            <div className={styles.results}><p aria-live="polite">{results.length ? `${(pagination.page - 1) * PAGE_SIZE + 1}–${Math.min(pagination.page * PAGE_SIZE, results.length)} из ${results.length} фильмов` : 'Найдено: 0 фильмов'}</p><label><span>Сортировка</span><select aria-label="Сортировка" value={filters.sort} onChange={event => changeFilters({ ...filters, sort: event.target.value })}><option value="year-desc">Сначала новые</option><option value="year-asc">Сначала старые</option><option value="score-desc">По рейтингу</option><option value="title-asc">По названию</option></select></label></div>
            {results.length ? <><FilmList films={pagination.items} onSelect={select} /><Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} /></> : <Feedback title="Пока ни одного фильма" onRetry={() => changeFilters(DEFAULT_FILTERS)} actionLabel="Сбросить фильтры">Попробуйте другое название или измените фильтры. Свой фильм можно добавить через форму.</Feedback>}
          </>}
        </section>
      </>}
      {screen.view === 'details' && <FilmDetails key={screen.film.id} selected={screen.film} onBack={home} />}
      {screen.view === 'form' && <FilmForm onSaved={saved} onCancel={home} />}
    </main>
    <footer className={styles.footer}><span><strong>кадр.</strong> Истории остаются с нами.</span><a href="https://ghibliapi.vercel.app/" target="_blank" rel="noreferrer">Данные: Studio Ghibli API ↗</a><span>REACT MIDTERM · 2026</span></footer>
  </div>;
}
