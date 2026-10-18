import { useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { saveLocalFilm } from '../../model/local-films.js';
import { MAX_RELEASE_YEAR, validateFilm } from '../../model/catalog.js';
import styles from './film-form.module.css';

const INITIAL_VALUES = { title: '', director: '', year: '', duration: '', score: '', description: '' };

export function FilmForm({ onSaved, onCancel }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');

  function change(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: '' }));
    setSaveError('');
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validateFilm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try { onSaved(saveLocalFilm(values)); }
    catch { setSaveError('Не удалось сохранить фильм. Хранилище браузера недоступно, заполнено или содержит повреждённые данные. Черновик сохранён в форме — проверьте хранилище и повторите.'); }
  }

  function field(name, label, type = 'text', extra = {}) {
    return <label className={styles.field} key={name}><span>{label} <small>*</small></span><input name={name} type={type} value={values[name]} onChange={change} required aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} {...extra} />{errors[name] && <span id={`${name}-error`} className={styles.error}>{errors[name]}</span>}</label>;
  }

  return <section className={styles.section} aria-labelledby="form-title"><Button variant="ghost" onClick={onCancel}>← Вернуться к коллекции</Button>
    <div className={styles.layout}><div className={styles.intro}><p className={styles.eyebrow}>ВАША КОЛЛЕКЦИЯ</p><h1 id="form-title">У каждой истории<br /><em>есть своё место.</em></h1><p>Добавьте любимый фильм. Он появится в общей коллекции с пометкой «Мой фильм».</p><div className={styles.note}>Фильм сохраняется только в этом браузере. Публичный каталог Studio Ghibli остаётся общим источником данных.</div></div>
      <form className={styles.form} onSubmit={submit} noValidate>
        <h2>Новый фильм</h2><p className={styles.required}>Все поля обязательны</p>
        {Object.values(errors).some(Boolean) && <p className={styles.error} role="alert">Проверьте отмеченные поля.</p>}
        {field('title', 'Название фильма', 'text', { maxLength: 150, placeholder: 'Например, The Boy and the Heron' })}
        {field('director', 'Режиссёр', 'text', { maxLength: 100, placeholder: 'Имя и фамилия' })}
        <div className={styles.numbers}>{field('year', 'Год', 'number', { min: 1888, max: MAX_RELEASE_YEAR })}{field('duration', 'Длительность, мин', 'number', { min: 1, max: 1000 })}{field('score', 'Ваша оценка / 100', 'number', { min: 0, max: 100 })}</div>
        <label className={styles.field}><span>Описание <small>*</small></span><textarea name="description" value={values.description} onChange={change} maxLength={3000} required placeholder="О чём этот фильм и почему он вам запомнился?" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined} />{errors.description && <span id="description-error" className={styles.error}>{errors.description}</span>}</label>
        {saveError && <p className={styles.error} role="alert">{saveError}</p>}
        <div className={styles.actions}><Button variant="secondary" onClick={onCancel}>Отмена</Button><Button type="submit">Добавить в коллекцию</Button></div>
      </form>
    </div>
  </section>;
}
