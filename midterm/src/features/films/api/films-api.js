export const API_URL = 'https://ghibliapi.vercel.app';

export function normalizeFilm(film) {
  if (!film || typeof film.id !== 'string' || typeof film.title !== 'string') {
    throw new Error('API вернул некорректные данные о фильме.');
  }
  return {
    id: film.id, title: film.title, originalTitle: film.original_title || '',
    description: film.description || '', director: film.director || 'Неизвестен',
    producer: film.producer || '', year: Number(film.release_date) || 0,
    duration: Number(film.running_time) || 0, score: Number(film.rt_score) || 0,
    image: film.image || '', banner: film.movie_banner || '', source: 'api',
  };
}

async function request(path, signal) {
  const timeout = AbortSignal.timeout(15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) throw new Error(`API недоступен (HTTP ${response.status}). Попробуйте ещё раз.`);
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted) throw new Error('API не ответил за 15 секунд. Попробуйте ещё раз.');
    if (error instanceof TypeError) throw new Error('Не удалось связаться с API. Проверьте интернет и повторите запрос.');
    throw error;
  }
}

export async function getFilms(signal) {
  const data = await request('/films', signal);
  if (!Array.isArray(data)) throw new Error('API вернул некорректный список фильмов.');
  return data.map(normalizeFilm);
}

export async function getFilm(id, signal) {
  return normalizeFilm(await request(`/films/${encodeURIComponent(id)}`, signal));
}
