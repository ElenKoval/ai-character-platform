# Деплой бэкенда на Render

Бэкенд (Express в `server/`) раздаёт и API, и статику из корня репозитория. На Render нужно деплоить **весь репозиторий**, а сборку и запуск выполнять из папки `server/`.

## 1. Подключение репозитория

1. Зайди на [render.com](https://render.com) и войди в аккаунт.
2. **New** → **Web Service**.
3. Подключи GitHub и выбери репозиторий `SunnyChimeraWorld`.

## 2. Настройки сервиса

| Поле | Значение |
|------|----------|
| **Name** | `sunnychimera-server` (или любое) |
| **Region** | ближайший (например Frankfurt) |
| **Root Directory** | оставь **пустым** (корень репо) |
| **Runtime** | Node |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && node index.js` |
| **Instance Type** | Free (или платный при необходимости) |

**Почему Root Directory пустой:** сервер отдаёт статику из `path.join(__dirname, "..")`. Если указать Root Directory = `server`, родительская папка на Render будет пустой и страницы/ассеты не подтянутся.

## 3. Переменные окружения

В разделе **Environment** добавь:

| Key | Value | Обязательно |
|-----|--------|-------------|
| `GEMINI_API_KEY` | твой API-ключ Gemini | да |
| `GROQ_API_KEY` | ключ Groq (если нужен Groq) | нет |
| `GEMINI_MODEL` | например `gemini-2.0-flash` | нет (есть дефолт) |
| `GROQ_MODEL` | например `llama-3.3-70b-versatile` | нет |

`PORT` Render подставляет сам, в коде уже есть `process.env.PORT || 3000`.

## 4. Деплой

Нажми **Create Web Service**. Render сделает сборку и запуск. После деплоя будет URL вида:

`https://sunnychimera-server.onrender.com`

- Главная и статика: тот же URL (сервер раздаёт и HTML, и `/api/chat`).
- Чат обращается на `/api/chat` на этом же хосте, отдельно CORS уже включён.

## 5. Проверка и отладка

- **Проверка API:** открой в браузере `https://<твой-сервис>.onrender.com/api/health`. Должен вернуться JSON вида `{ "ok": true, "gemini": true, "groq": false }`. Если `gemini: false` — в Environment не задан `GEMINI_API_KEY` или деплой не подхватил переменные (сохрани env и сделай **Manual Deploy**).
- **«Ошибка сервера (404)»** — по этому URL нет обработчика `/api/chat`. Часто причина: сервис на Render создан как **Static Site**, а не **Web Service**. Static Site только раздаёт файлы и не запускает Node. Что сделать: в Render Dashboard открой сервис `ai-character-platform` → убедись, что тип **Web Service** (не Static Site). Если был Static Site — создай заново **Web Service**, укажи тот же репо, Root Directory пустой, Build: `cd server && npm install`, Start: `cd server && node index.js`, и при желании задай тот же имя/домен. Тогда один URL будет отдавать и сайт, и API.
- **«Ошибка сервера» (503 и т.д.)** в чате чаще всего из‑за отсутствия ключа: без `GEMINI_API_KEY` бэкенд возвращает 503. Добавь ключ в Environment и перезадеплой.

## 6. Free tier

- Сервис засыпает после ~15 мин без запросов; первый запрос после сна может идти 30–60 сек (cold start).
- Лимиты по часам в месяц — смотри в панели Render.

## 7. Опционально: только API (без статики)

Если фронт крутится отдельно и на Render нужен только бэкенд:

| Поле | Значение |
|------|----------|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

Тогда на Render будет только папка `server/`, статика оттуда не раздаётся. Во фронте укажи базовый URL API на этот сервис (например `https://sunnychimera-api.onrender.com`).
