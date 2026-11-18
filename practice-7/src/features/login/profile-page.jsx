import { useAuth } from "@/common/auth/auth-context";
import { Button } from "@/common/components/ui/button";
import styles from "./login-page.module.css";

export default function ProfilePage() {
  const { user, logout, pending, error } = useAuth();
  if (!user) return null;
  return <section className={styles.page}><div className={styles.card}>
    <p className={styles.eyebrow}>ЛИЧНЫЙ КАБИНЕТ</p><h1>Мой профиль</h1>
    <dl className={styles.details}><dt>Email</dt><dd>{user.email || "Не указан"}</dd><dt>UID</dt><dd>{user.uid}</dd></dl>
    <p>Выход не удалит локальные книги. На общем устройстве они остаются доступны другим пользователям браузера.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <Button disabled={pending} onClick={() => void logout()}>{pending ? "Выходим…" : "Выйти из аккаунта"}</Button>
  </div></section>;
}
