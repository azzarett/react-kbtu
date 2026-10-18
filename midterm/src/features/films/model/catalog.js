export const PAGE_SIZE = 8;
export const MAX_RELEASE_YEAR = new Date().getFullYear() + 5;
export const DEFAULT_FILTERS = { query: '', director: '', rating: '', source: '', sort: 'year-desc' };

export function selectFilms(films, filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  const result = films.filter(film =>
    (!query || [film.title, film.originalTitle, film.director].some(value => value.toLocaleLowerCase().includes(query))) &&
    (!filters.director || film.director === filters.director) &&
    (!filters.rating || film.score >= Number(filters.rating)) &&
    (!filters.source || film.source === filters.source),
  );
  const comparators = {
    'year-desc': (a, b) => b.year - a.year,
    'year-asc': (a, b) => a.year - b.year,
    'score-desc': (a, b) => b.score - a.score,
    'title-asc': (a, b) => a.title.localeCompare(b.title, 'ru'),
  };
  return result.sort((a, b) => (comparators[filters.sort] || comparators['year-desc'])(a, b) || a.id.localeCompare(b.id));
}

export function paginate(films, requestedPage) {
  const pages = Math.max(1, Math.ceil(films.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), pages);
  return { page, pages, items: films.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

export function validateFilm(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Введите название фильма.';
  if (!values.director.trim()) errors.director = 'Укажите режиссёра.';
  if (!Number.isInteger(Number(values.year)) || Number(values.year) < 1888 || Number(values.year) > MAX_RELEASE_YEAR)
    errors.year = 'Укажите корректный год выпуска.';
  if (!Number.isInteger(Number(values.duration)) || Number(values.duration) < 1 || Number(values.duration) > 1000)
    errors.duration = 'Продолжительность: от 1 до 1000 минут.';
  if (values.score === '' || !Number.isInteger(Number(values.score)) || Number(values.score) < 0 || Number(values.score) > 100)
    errors.score = 'Оценка: целое число от 0 до 100.';
  if (values.description.trim().length < 10) errors.description = 'Добавьте описание: минимум 10 символов.';
  return errors;
}
