# Task 7 — installable PWA

**Source:** https://github.com/azzarett/react-kbtu/tree/main/practice-7  
**Deployment target:** https://azzarett.github.io/react-kbtu/practice-7/  
**Offline route:** `/#/offline` (HashRouter, GitHub Pages).

This is a separate Vite React application extending the existing Task 6 source. Earlier homework folders are unchanged. The app preserves book CRUD, search/filter/sort/pagination, URL state, dashboard, public Open Library list/details, Firebase Auth wiring, protected profile, service cache and mutation invalidation.

## PWA design

- `public/manifest.webmanifest`: standalone, scoped start URL, theme/background, 192/512 PNG icons (maskable safe area).
- `scripts/build-pwa.mjs`: after Vite builds, hashes the SW source and **all production files**, generates a version and precaches every JS/CSS chunk, offline HTML, icons and shell. Lazy routes remain available without network.
- `src/common/pwa/sw-template.js`: install fills a new cache atomically. Waiting worker does not activate unexpectedly. Update UI sends `SKIP_WAITING`; activation removes only old `polka-task7-*` caches and claims clients. User is warned to save edits before reload.
- Static images/icons/fonts: **cache-first**. App shell assets are immutable per version; runtime same-origin static assets expire after 24 hours, maximum 60.
- Public Open Library `search.json` and `works/OL…W.json`: **network-first**, 4.5-second timeout, fallback to previously cached successful JSON; TTL 24 hours, maximum 50 requests. Cache failures do not discard a valid live response. Uncached offline requests show a recoverable error instead of fake data.
- Strict GET/path/origin allowlist; no Firebase/auth endpoints, authorization headers, tokens or private user data in runtime caches. The inherited local bookshelf is local browser storage, not a shared SW runtime cache; its existing limitation is described below.
- Worker announces cached/live/unavailable public API state; global status displays saved-data warning. Real uncached connection probe complements browser `navigator.onLine`.
- Known app navigation loads cached shell. Unknown-document network failures use precached standalone `offline.html`, with a retry probe and link back. React `/#/offline` also works offline.
- Scoped worker and cache prefix avoid affecting the other practices on the same GitHub Pages origin.

## Verify manually in a real browser

1. `npm ci`, `npm run check`, `npm run preview`; use production preview (SW intentionally not registered in dev).
2. Open app online, wait for service-worker activation, refresh once. Inspect manifest/install option and install standalone.
3. Visit catalog, search `Tolkien`, open a book. DevTools → Network → Offline; reload and repeat exact search/book. Saved data and cache indicator should appear. A never-requested query should show an error. Local CRUD/filter/dashboard still work.
4. Open `/#/offline`, retry offline (failure), then reconnect and retry (success); reload/search works online.
5. Open an unknown document path offline to verify the standalone fallback.
6. With the app open, publish a changed build. Check waiting update prompt; activate it, verify controller change, reload and old-cache deletion. No manual Clear Storage required.
7. At 320×568 and 568×320, test navigation, CRUD forms, cards, filters, dashboard and details. Check keyboard/touch targets and horizontal overflow.
8. Inspect Cache Storage: only shell/static/public API; auth domains and tokens must be absent.

## Honest limitations

No Firebase project configuration was supplied. Firebase email/password/Google sign-in is preserved but cannot work until configured; it is NOT replaced by fake authentication. Mock auth tests are not proof of live OAuth. GitHub Pages needs build-time VITE_FIREBASE_* values and the `azzarett.github.io` authorized domain. No Teams submission is performed by this repository update. See VERIFICATION.md for what was actually tested.

---

# Полка — Task 7: Progressive Web App

React + Vite + JavaScript + CSS Modules. Продолжение React Router-проекта Task 5 на feature-based архитектуре `practice-4`. Исходники предыдущих практик не изменяются.

## Запуск

Node.js 24.15+ (24 LTS) или 22.22.2+ (22 LTS).

```sh
cd practice-7
npm ci
cp .env.example .env.local
# Заполнить .env.local конфигурацией своего Firebase Web App.
npm run dev
```

```sh
npm run check     # lint, unit/service tests, React/jsdom tests, production build
npm run preview
```

Без Firebase-конфигурации публичные страницы работают, а вход показывает понятное сообщение о настройке. Приложение не подменяет Firebase фиктивной авторизацией.

## Firebase

1. В Firebase Console выбрать свой проект или создать бесплатный проект без платных ресурсов.
2. Зарегистрировать Web App и скопировать клиентскую конфигурацию в `.env.local` по именам из `.env.example`.
3. В Authentication → Sign-in method включить **Email/Password** и **Google**. Для Google выбрать контакт поддержки проекта.
4. В Authentication → Settings → Authorized domains проверить `localhost` для разработки и домен будущей публикации. Для GitHub Pages это `azzarett.github.io` (без пути).
5. Перезапустить Vite после изменения env. Для production эти переменные должны существовать **во время сборки**, а не после публикации готового `dist`.

`.env.local` и остальные локальные env-файлы исключены из Git. `VITE_` переменные встроены в клиентский bundle и не являются хранилищем секретов. Не помещать туда service-account JSON, private keys, OAuth client secret, пароли или административные токены. Firebase Web API key идентифицирует проект; доступ к данным должен отдельно защищаться правилами Firebase. Firestore/Storage в этой работе не используются.

`common/auth/firebase.js` отдельно инициализирует SDK и `browserLocalPersistence`. `auth-service.js` содержит операции SDK и подписку `onAuthStateChanged`. `AuthProvider` предоставляет `useAuth`, пользователя, начальную загрузку, pending и ошибки. Состояние пользователя обновляет только Firebase observer. После refresh восстановление сессии завершается до проверки защищённого маршрута. Cleanup снимает подписку; повторные клики не создают параллельных операций.

Реализованы регистрация с подтверждением пароля, email/password login, Google popup и logout. Показаны понятные ошибки неправильных данных, занятого email, сети, закрытого/заблокированного popup, выключенного провайдера и неподтверждённого домена.

## Маршруты и сохранённая функциональность

| Маршрут | Возможности |
|---|---|
| `/#/` | Главная и переходы в разделы |
| `/#/about` | Архитектура данных, аккаунт и ограничения |
| `/#/books` | Поиск, жанр, статус, шесть сортировок, пагинация |
| `/#/books/:id` | Полная карточка и возврат к исходным фильтрам |
| `/#/dashboard` | Шесть показателей, распределения, фильтры и ссылки |
| `/#/library` | CRUD, подтверждение удаления, статус прочитанного |
| `/#/catalog?q=Tolkien&page=1` | Настоящий read-only Open Library API |
| `/#/catalog/:workId` | Подробности произведения Open Library |
| `/#/login` | Email/password и Google |
| `/#/signup` | Email, пароль, подтверждение и валидация |
| `/#/profile` | Защищённый профиль: email, UID, выход |
| Неизвестный путь | 404 |

HashRouter сохраняет прямые ссылки и refresh на статическом хостинге без server rewrites. Гость на `/profile` перенаправляется на `/login`, после входа возвращается к исходному внутреннему маршруту. В меню отображаются Вход/Регистрация или Профиль/Выход. Страницы авторизации перенаправляют уже вошедшего пользователя в профиль.

URL поиска, фильтров, сортировки и номера страницы сохраняются при Back/Forward. Поиск/фильтры сбрасывают страницу, некорректная страница ограничивается доступным диапазоном. Все loading/error/retry/empty состояния сохранены. Старые ответы не заменяют новый запрос.

Личная полка остаётся **локальной общей полкой этого браузера**, не приватным хранилищем пользователя Firebase. Ключ `practice-7-books-v1` изолирован от предыдущих практик. Смена аккаунта/выход не удаляют книги и не скрывают их от другого пользователя того же браузера. Приложение сообщает об этом в профиле, форме входа и на странице «О проекте». Облачной синхронизации нет. Начальные записи являются учебными примерами.

## Стратегия кэширования

Кэш находится в `common/cache/query-cache.js`. Он хранится **только в памяти** и очищается при перезагрузке приложения. TTL — **60 секунд с момента успешного завершения запроса**. Просроченная запись обновляется при следующем обращении; фонового polling нет.

### Open Library (настоящие серверные данные)

Ключ: `['open-library', полный нормализованный URL]`. Для поиска URL включает `q`, `page`, `limit` и `fields`; для подробностей — нормализованный `workId`. Пробелы по краям запроса удаляются. Другие параметры и страницы не смешиваются. GET/JSON и нормализация ответа остаются в сервисе `features/catalog/services/service.js`.

Повторное открытие того же запроса до TTL не выполняет HTTP-запрос. Одновременные потребители делят один Promise. Ошибки сети, HTTP и неверный ответ не кэшируются как данные; успешная пустая выдача кэшируется нормально. Open Library доступна только для чтения: изменения локальной полки туда не отправляются.

### Локальный асинхронный API полки

Ключи: `['bookshelf', 'collection']` и `['bookshelf', 'detail', id]`. Поиск, фильтры, сортировки, страницы, жанры и статистика вычисляются из одной кэшированной полной коллекции, поэтому отдельные ключи для этих проекций не нужны.

После **успешных create/update/delete**, включая смену статуса, сервис инвалидирует всю коллекцию и все детали. Подписанные страницы перечитывают данные, включая dashboard и список жанров. Неуспешные и отменённые изменения сохраняют корректный кэш. Кнопка «Обновить» явно инвалидирует данные до TTL.

Инвалидация удаляет также pending-записи. Если старый запрос завершится после мутации, он не сможет вернуть или снова закэшировать старый snapshot: потребитель присоединится к актуальному чтению. Каждый потребитель может отменить ожидание через AbortSignal независимо от других. Общий транспорт может закончить работу и прогреть кэш даже после ухода всех потребителей. Эффекты дополнительно проверяют актуальность запроса, защищая UI при быстрых переходах A → B → A.

## Архитектура

```text
src/
  App.jsx                         # композиция provider/layout/routes, lazy pages
  components/root-layout/          # layout и Outlet
  common/
    auth/                         # Firebase config/service/context/route guard
    cache/                        # общий независимый TTL cache
    components/navigation/        # условный NavBar
    components/ui/                # исходные Button и Feedback
    styles/                       # исходные tokens/base
  features/
    home/, about/, login/         # страницы; login включает signup/profile
    catalog/pages/, services/     # внешний read-only API
    bookshelf/
      api/                        # Promise API и localStorage
      services/                   # cache, CRUD, фильтры и статистика
      hooks/                      # подписки, loading/error, отмена
      pages/, components/, constants/
```

Сохранены исходные токены, зелёные акценты, светлый фон, CSS Modules, kebab-case и alias `@/`. `common` не зависит от `features`, features не импортируют друг друга. Auth и cache являются общими сервисами, доступными независимым features. `scripts/check-architecture.mjs` проверяет границы. HTTP, Firebase SDK и localStorage не вызываются непосредственно в UI-компонентах.

## Проверка и демонстрация

- `npm run lint`: hooks, зависимости эффектов и границы импортов.
- `npm test`: CRUD/API, фильтры/статистика, TTL, ключи, dedup, abort, инвалидация, stale responses.
- `npm run test:ui`: маршруты, история, формы/ошибки/навигация, protected profile, session restoration, отмена, CRUD, принудительное обновление.
- `npm run build`: production-сборка.
- `node scripts/smoke-open-library.mjs`: отдельная необязательная проверка настоящего Open Library. Не входит в детерминированный `check`.

В `package.json` закреплён override `@grpc/grpc-js` 1.14.7: это исправляет уязвимую транзитивную Node-зависимость полного Firebase SDK. Firestore и gRPC не используются в клиентском приложении.

Тесты Firebase используют подменённый SDK/сервис. Они доказывают поведение приложения, но **не** включённые провайдеры, действующий Firebase-проект, настоящий OAuth или сохранение реальной сессии браузером. Сверить итоговые результаты в `VERIFICATION.md`.

После настройки Firebase вручную проверить:
1. Регистрацию, повторный email, неверный пароль, корректный вход.
2. Вход через Google, закрытие popup и повтор.
3. Refresh `/profile`, logout и Back/Forward: email/UID недоступны гостю.
4. В DevTools Network дважды открыть один поиск каталога до TTL, затем после 60 секунд: повторный HTTP только после истечения TTL.
5. Создать/изменить/удалить книгу; открыть список и dashboard без refresh: данные актуальны.
6. Быстрые переходы, узкий и широкий экраны, loading/error/empty.

## Публикация и сдача

- Целевая папка исходников: https://github.com/azzarett/react-kbtu/tree/main/practice-6
- Требуемый рубрикой deployed URL: **пока не опубликован**.

Рубрика требует GitHub, работающий deployed URL, README и `.env.example`. Для публикации нужно отдельно настроить Firebase env при сборке и включить practice-6 в существующий GitHub Pages workflow, не изменяя предыдущие работы. Сборку можно разместить в подпапке благодаря `base: './'`.

Эта реализация сама по себе не сдаёт работу в Teams. Факт загрузки исходников, публикации сайта и настоящей проверки Firebase нужно подтверждать отдельно.
