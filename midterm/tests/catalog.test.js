import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FILTERS, paginate, selectFilms, validateFilm } from '../src/features/films/model/catalog.js';
import { readLocalFilms, saveLocalFilm, STORAGE_KEY } from '../src/features/films/model/local-films.js';

const films = Array.from({ length: 22 }, (_, index) => ({
  id: `api-${index}`, title: `Film ${index}`, originalTitle: index === 0 ? '千と千尋' : '',
  director: index % 2 ? 'Hayao Miyazaki' : 'Isao Takahata',
  year: 1980 + index, score: 70 + index, source: 'api',
}));
const values = { title: ' My film ', director: ' A Director ', year: '2024', duration: '120', score: '0', description: 'A meaningful film description.' };
function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('search is trimmed, case insensitive, and includes director and original title', () => {
  assert.equal(selectFilms(films, { ...DEFAULT_FILTERS, query: '  MIYAZAKI ' }).length, 11);
  assert.equal(selectFilms(films, { ...DEFAULT_FILTERS, query: '千と千尋' })[0].id, 'api-0');
  assert.equal(selectFilms(films, { ...DEFAULT_FILTERS, query: 'no such movie' }).length, 0);
});
test('filters and numeric sorting apply to the full collection before pagination', () => {
  const selected = selectFilms(films, { ...DEFAULT_FILTERS, director: 'Hayao Miyazaki', rating: '80', sort: 'score-desc' });
  assert.deepEqual(selected.map(film => film.score), [91, 89, 87, 85, 83, 81]);
  assert.equal(selectFilms(films, { ...DEFAULT_FILTERS, source: 'local' }).length, 0);
  assert.equal(selectFilms(films, { ...DEFAULT_FILTERS, sort: 'year-asc' })[0].year, 1980);
  assert.deepEqual(films.map(film => film.year), Array.from({ length: 22 }, (_, index) => 1980 + index));
});
test('pagination has no overlapping items and clamps a page after filtering', () => {
  const pages = [1, 2, 3].map(page => paginate(films, page));
  assert.deepEqual(pages.map(page => page.items.length), [8, 8, 6]);
  assert.equal(new Set(pages.flatMap(page => page.items.map(film => film.id))).size, 22);
  assert.equal(paginate(films.slice(0, 2), 3).page, 1);
  assert.deepEqual(paginate([], 5), { page: 1, pages: 1, items: [] });
});
test('form accepts score zero and rejects blanks, decimals, and invalid ranges', () => {
  assert.deepEqual(validateFilm(values), {});
  const errors = validateFilm({ title: ' ', director: '', year: '1600', duration: '1.5', score: '', description: 'short' });
  assert.equal(Object.keys(errors).length, 6);
  assert.ok(validateFilm({ ...values, score: '101' }).score);
});
test('local additions persist, have unique stable ids, and do not seed a second data source', () => {
  const store = storage();
  assert.deepEqual(readLocalFilms(store), []);
  const first = saveLocalFilm(values, store);
  const second = saveLocalFilm(values, store);
  assert.notEqual(first.id, second.id);
  assert.equal(first.title, 'My film');
  assert.equal(first.score, 0);
  assert.deepEqual(readLocalFilms(store), [first, second]);
});
test('corrupted or unavailable storage produces an error without overwriting data', () => {
  const store = storage();
  store.setItem(STORAGE_KEY, 'bad json');
  assert.throws(() => saveLocalFilm(values, store));
  assert.equal(store.getItem(STORAGE_KEY), 'bad json');
  store.setItem(STORAGE_KEY, '[null]');
  assert.throws(() => readLocalFilms(store));
  assert.throws(() => saveLocalFilm(values, { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } }));
});
