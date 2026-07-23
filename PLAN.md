# PLAN.md — План проекта

## Проект: Упрощатель лекций

### Описание
Веб-приложение для перевода лекций (DOCX) на простой человеческий язык с помощью DeepSeek API. Лекции organizовываются по "проектам" (категориям). Результаты можно просматривать в браузере и скачивать как DOCX.

---

## Фаза 1: Проектирование ✅

### 1.1 Определение требований
- [x] Greel me — сбор требований
- [x] Определение функционала
- [x] Определение стека

### 1.2 Архитектура
- [x] Структура проекта
- [x] API эндпоинты
- [x] Модели данных
- [x] Схема деплоя

---

## Фаза 2: Backend

### 2.1 Инфраструктура
- [x] T1: Конфигурация (config.py, .env.example)
- [x] T2: База данных (database.py, models.py, schemas.py)
- [x] T3: Аутентификация (auth.py)

### 2.2 API
- [x] T4: Эндпоинты проектов (CRUD)
- [x] T5: Эндпоинты загрузки лекций
- [x] T6: Эндпоинты обработки лекций
- [x] T7: Эндпоинты выжимки
- [x] T8: Эндпоинт скачивания DOCX

### 2.3 Сервисы
- [x] T9: Интеграция с DeepSeek API
- [x] T10: Чтение/запись DOCX

---

## Фаза 3: Frontend

### 3.1 Инфраструктура
- [x] T11: Инициализация React + Vite
- [x] T12: Настройка TailwindCSS + Framer Motion
- [x] T13: API клиент (axios)

### 3.2 Страницы
- [x] T14: Страница входа (LoginPage)
- [x] T15: Дашборд — список проектов (DashboardPage)
- [x] T16: Страница проекта — лекции (ProjectPage)
- [x] T17: Страница лекции — просмотр результата (LecturePage)

### 3.3 Компоненты
- [x] T18: AuthContext — управление токеном
- [x] T19: Навигация и роутинг

---

## Фаза 4: Деплой

### 4.1 Контейнеризация
- [x] T20: Dockerfile
- [x] T21: docker-compose.yml

### 4.2 Сервер
- [x] T22: deploy.sh — скрипт деплоя
- [x] T23: Caddy конфигурация

---

## Фаза 5: Тестирование

### 5.1 Проверка
- [x] T24: Проверка backend (запуск, эндпоинты)
- [x] T25: Проверка frontend (сборка, запуск)
- [x] T26: Исправление ошибки с импортом иконки

---

## API Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/login | Вход (пароль) |
| GET | /api/projects | Список проектов |
| POST | /api/projects | Создать проект |
| GET | /api/projects/{id} | Получить проект |
| DELETE | /api/projects/{id} | Удалить проект |
| POST | /api/projects/{id}/upload | Загрузить лекции |
| GET | /api/projects/{id}/lectures | Список лекций |
| GET | /api/projects/{id}/summary | Выжимка из всех лекций |
| GET | /api/lectures/{id} | Получить лекцию |
| POST | /api/lectures/{id}/process | Обработать лекцию |
| GET | /api/lectures/{id}/download | Скачать DOCX |
| DELETE | /api/lectures/{id} | Удалить лекцию |

---

## Модели данных

### Project
- id: int (PK)
- name: str
- description: str
- created_at: datetime
- updated_at: datetime

### Lecture
- id: int (PK)
- project_id: int (FK → Project)
- filename: str
- original_text: str
- result_text: str
- extended_text: str
- mode: str (simple/extended)
- status: str (pending/processing/completed/error)
- created_at: datetime

---

## Структура файлов

```
УпрощательЮле/
├── backend/
│   ├── main.py          # FastAPI app + раздача SPA
│   ├── config.py        # Настройки из .env
│   ├── database.py      # SQLAlchemy engine + session
│   ├── models.py        # Модели Project, Lecture
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Токены, проверка пароля
│   ├── routes/
│   │   └── api.py       # Все API эндпоинты
│   └── services/
│       └── llm.py       # DeepSeek + DOCX чтение/запись
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Роутинг
│   │   ├── main.jsx     # Точка входа
│   │   ├── index.css    # TailwindCSS стили
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectPage.jsx
│   │   │   └── LecturePage.jsx
│   │   └── services/
│   │       └── api.js   # Axios клиент
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── Dockerfile
├── docker-compose.yml
├── deploy.sh
├── .env.example
├── .gitignore
├── CLAUDE.md
├── STATE.md
└── PLAN.md
```
