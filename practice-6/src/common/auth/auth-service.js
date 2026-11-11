import { createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getPersistentAuth } from "./firebase";

export const authService = {
  subscribe(onUser, onError) {
    let cancelled = false;
    let unsubscribe;
    getPersistentAuth().then((auth) => {
      if (!cancelled) unsubscribe = onAuthStateChanged(auth, onUser, onError);
    }).catch((error) => { if (!cancelled) onError(error); });
    return () => { cancelled = true; unsubscribe?.(); };
  },
  async login(email, password) {
    return signInWithEmailAndPassword(await getPersistentAuth(), email, password);
  },
  async signup(email, password) {
    return createUserWithEmailAndPassword(await getPersistentAuth(), email, password);
  },
  async google() {
    return signInWithPopup(await getPersistentAuth(), new GoogleAuthProvider());
  },
  async logout() { return signOut(await getPersistentAuth()); },
};

export function authErrorMessage(error) {
  const messages = {
    "auth/missing-config": "Вход ещё не настроен. Добавьте конфигурацию Firebase в .env.local и перезапустите приложение.",
    "auth/invalid-credential": "Неверный email или пароль.",
    "auth/wrong-password": "Неверный email или пароль.",
    "auth/user-not-found": "Неверный email или пароль.",
    "auth/email-already-in-use": "Этот email уже зарегистрирован. Попробуйте войти.",
    "auth/invalid-email": "Введите корректный email.",
    "auth/weak-password": "Пароль не соответствует требованиям проекта Firebase. Используйте не менее 6 символов.",
    "auth/too-many-requests": "Слишком много попыток. Попробуйте позже.",
    "auth/network-request-failed": "Нет связи с Firebase. Проверьте интернет и повторите попытку.",
    "auth/popup-closed-by-user": "Окно входа закрыто. Можно попробовать ещё раз.",
    "auth/cancelled-popup-request": "Вход отменён. Можно попробовать ещё раз.",
    "auth/popup-blocked": "Разрешите всплывающее окно для входа через Google.",
    "auth/unauthorized-domain": "Добавьте домен приложения в Authorized domains проекта Firebase.",
    "auth/operation-not-allowed": "Включите этот способ входа в Firebase Authentication.",
    "auth/account-exists-with-different-credential": "Войдите способом, который использовали при регистрации этого email.",
  };
  return messages[error?.code] ?? "Не удалось выполнить вход или выход. Проверьте настройки Firebase и повторите попытку.";
}
