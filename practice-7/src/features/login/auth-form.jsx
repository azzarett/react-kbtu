import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "@/common/auth/auth-context";
import { intendedDestination } from "@/common/auth/protected-route";
import { Button } from "@/common/components/ui/button";
import styles from "./login-page.module.css";

export function AuthForm({ signup = false }) {
  const auth = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [validation, setValidation] = useState("");
  if (!auth.loading && auth.user) return <Navigate replace to={intendedDestination(location.state?.from)} />;
  const disabled = auth.loading || auth.pending;
  function submit(event) {
    event.preventDefault();
    if (disabled) return;
    setValidation("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setValidation("Введите корректный email.");
    if (signup && password.length < 6) return setValidation("Пароль должен содержать не менее 6 символов.");
    if (signup && password !== confirmation) return setValidation("Пароли не совпадают.");
    void (signup ? auth.signup : auth.login)(email.trim(), password);
  }
  return <section className={styles.page}><div className={styles.card}>
    <span className={styles.icon} aria-hidden="true">▥</span>
    <p className={styles.eyebrow}>ЛИЧНЫЙ КАБИНЕТ</p>
    <h1>{signup ? "Регистрация" : "Вход в аккаунт"}</h1>
    <p>Аккаунт защищён Firebase. Книжная полка пока хранится только в этом браузере и не синхронизируется.</p>
    <form className={styles.form} onSubmit={submit}>
      <label>Email<input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={disabled} /></label>
      <label>Пароль<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} disabled={disabled} /></label>
      {signup && <><small>Не менее 6 символов.</small><label>Подтвердите пароль<input name="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={disabled} /></label></>}
      {(validation || auth.error) && <p className={styles.error} role="alert">{validation || auth.error}</p>}
      <Button type="submit" disabled={disabled}>{signup ? "Зарегистрироваться" : "Войти"}</Button>
      <Button variant="secondary" disabled={disabled} onClick={() => { setValidation(""); void auth.google(); }}>Войти через Google</Button>
      {disabled && <p role="status">{auth.loading ? "Проверяем сессию…" : "Выполняем запрос…"}</p>}
    </form>
    <Link className={styles.secondary} to={signup ? "/login" : "/signup"} state={location.state} onClick={auth.clearError}>{signup ? "Уже есть аккаунт? Войти" : "Создать аккаунт"}</Link>
    <Link className={styles.secondary} to="/books">Продолжить без входа</Link>
  </div></section>;
}
