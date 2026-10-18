import test from 'node:test';
import assert from 'node:assert/strict';
import { getFilms, getFilm } from '../src/features/films/api/films-api.js';

const film = { id: 'film-id', title: 'Spirited Away', release_date: '2001', running_time: '125', rt_score: '97' };

test('external API list and detail normalize numeric fields and pass abort signals', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, signal: options.signal });
    return { ok: true, json: async () => url.endsWith('/films') ? [film] : film };
  });
  const controller = new AbortController();
  assert.equal((await getFilms(controller.signal))[0].year, 2001);
  assert.equal((await getFilm('film-id', controller.signal)).duration, 125);
  assert.equal(calls[1].url, 'https://ghibliapi.vercel.app/films/film-id');
  controller.abort();
  assert.ok(calls.every(call => call.signal.aborted));
});
test('HTTP errors, network errors, and malformed data are surfaced', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503 }));
  await assert.rejects(getFilms(), /503/);
  mock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(getFilms(), /интернет/);
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({}) }));
  await assert.rejects(getFilms(), /некорректный список/);
  await assert.rejects(getFilm('bad'), /некорректные данные/);
});
test('an aborted request cannot resolve successfully', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    signal.throwIfAborted();
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  });
  const controller = new AbortController();
  const pending = getFilms(controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
