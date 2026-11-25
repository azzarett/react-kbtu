import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { checkConnection, selectConnectivity } from "./connectivity-slice";
import { usePwa } from "./use-pwa";
import "./pwa.css";

export function PwaStatus() {
  const { online, catalogSource } = useSelector(selectConnectivity);
  const { install, activate, notice } = usePwa();
  return <aside className="pwa-bar" aria-label="Состояние приложения">
    <span role="status">
      {online ? "● Онлайн" : "○ Нет соединения"}
      {(catalogSource === "cached" || !online) && " · сохранённые данные могут быть устаревшими"}
      {catalogSource === "cached" && " · Каталог загружен из сохранённой копии."}
      {catalogSource === "unavailable" && " · Нет сохранённой копии этого запроса."}
      {notice && ` · ${notice}`}
    </span>
    <div>
      <Link to="/offline">Офлайн-режим</Link>
      {install && <button onClick={install}>Установить</button>}
      {activate && <button onClick={activate}>Обновить · несохранённые изменения будут потеряны</button>}
    </div>
  </aside>;
}

const messages = {
  loading: "Проверяем соединение…",
  success: "Соединение доступно. Можно вернуться в каталог.",
  error: "Сеть пока недоступна. Локальная полка и сохранённые запросы работают.",
};

export function OfflinePage() {
  const dispatch = useDispatch();
  const { check } = useSelector(selectConnectivity);
  return <section className="offline-card">
    <span className="eyebrow">ПОЛКА / OFFLINE</span>
    <h1>Связь потерялась.<br />Книги остались.</h1>
    <p>Открывайте локальную полку и ранее загруженные страницы каталога. Новые поиски и вход в аккаунт требуют подключения. Публичные данные хранятся до 24 часов.</p>
    <div className="offline-actions">
      <button disabled={check === "loading"} onClick={() => dispatch(checkConnection())}>Проверить соединение</button>
      <Link to="/library">Моя полка</Link><Link to="/catalog">Каталог</Link>
    </div>
    <p role="status">{messages[check]}</p>
    <h2>Установите приложение</h2>
    <p>В Chrome используйте «Установить» в адресной строке или меню. В Safari на iPhone выберите «Поделиться» → «На экран Домой». Офлайн-режим готов после первой успешной загрузки.</p>
  </section>;
}
