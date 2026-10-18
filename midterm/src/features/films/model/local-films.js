import { validateFilm } from './catalog.js';

export const STORAGE_KEY = 'midterm-local-films-v1';

// Public API is read-only. Only films entered by this user are stored here.
export function readLocalFilms(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const films = JSON.parse(raw);
  if (!Array.isArray(films) || films.some(film =>
    !film || typeof film.id !== 'string' || !film.id.startsWith('local-') ||
    film.source !== 'local' || typeof film.originalTitle !== 'string' ||
    typeof film.title !== 'string' || typeof film.director !== 'string' ||
    typeof film.description !== 'string' || Object.keys(validateFilm(film)).length > 0,
  ) || new Set(films.map(film => film.id)).size !== films.length) {
    throw new Error('Некорректные сохранённые фильмы.');
  }
  return films;
}

export function saveLocalFilm(values, storage = localStorage) {
  if (Object.keys(validateFilm(values)).length) throw new Error('Проверьте поля формы.');
  const films = readLocalFilms(storage);
  const film = {
    id: `local-${crypto.randomUUID()}`, title: values.title.trim(),
    director: values.director.trim(), year: Number(values.year),
    duration: Number(values.duration), score: Number(values.score),
    description: values.description.trim(), originalTitle: '', producer: '',
    image: '', banner: '', source: 'local',
  };
  storage.setItem(STORAGE_KEY, JSON.stringify([...films, film]));
  return film;
}
