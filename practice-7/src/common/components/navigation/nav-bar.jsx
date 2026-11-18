import { useAuth } from "@/common/auth/auth-context";
import { NavLink } from "react-router";
import styles from "./nav-bar.module.css";

export function NavBar() {
  const { user, loading, pending, logout, error } = useAuth();
  return <nav className={styles.nav} aria-label="Основная навигация">
    <NavLink to="/" end>Главная</NavLink>
    <NavLink to="/books">Книги</NavLink>
    <NavLink to="/dashboard">Обзор</NavLink>
    <NavLink to="/library">Моя полка</NavLink>
    <NavLink to="/catalog">Каталог</NavLink>
    <NavLink to="/about">О проекте</NavLink>
    {user ? <><NavLink to="/profile">Профиль</NavLink><button disabled={pending || loading} onClick={() => void logout()}>Выход</button>{error && <span role="status">{error}</span>}</> : <><NavLink to="/login">Вход</NavLink><NavLink to="/signup">Регистрация</NavLink></>}
  </nav>;
}
