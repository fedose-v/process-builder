# CLAUDE.md

Этот файл содержит инструкции для Claude Code (claude.ai/code) при работе с данным репозиторием.

## Команды

```bash
npm start          # Запустить сервер (ts-node server.ts) на порту 3000
npm run build      # Скомпилировать клиент (src/ → public/js/) и сервер (server.ts → server.js)
npm run check      # Проверить типы без генерации файлов
```

Тестов нет. `postinstall` автоматически запускает `build` после `npm install`.

## Архитектура

Двухстраничное Express-приложение: главная страница (`/`) со списком сохранённых workflow и страница редактора (`/builder`) с визуальным flow-редактором.

### Сервер (`server.ts`)
Один файл. Отдаёт статику из `public/`, обрабатывает два HTML-маршрута (`/` и `/builder`), предоставляет полный CRUD REST API по пути `/api/workflows`. Workflow сохраняются в JSON-файл `data/workflows.json` (в gitignore). Сервер запускается напрямую через `ts-node`.

### Клиентский TypeScript (`src/` → `public/js/`)
Компилируется в обычный JS без модульной системы — все файлы разделяют глобальное пространство имён `window`. Порядок загрузки в `builder.html` важен:

```
state.js → nodes.js → connections.js → canvas.js → properties.js → panel.js → theme.js → app.js
```

`theme.js` также загружается на `index.html` вместе с `home.js`.

**Глобальное состояние** находится в `state.ts`: `nodes` (запись по id), `connections` (массив), переменные пан/зума (`panX`, `panY`, `scale`), ссылки на DOM `canvas` и `svgLayer` (присваиваются в `DOMContentLoaded` в `app.ts`), а также `currentWorkflowId`.

**Ключевые файлы:**
- `state.ts` — Все общие интерфейсы (`FlowNode`, `Connection`, `WorkflowData` и др.) и глобальные `var`-объявления
- `app.ts` — Инициализация в `DOMContentLoaded`: присваивает `canvas`/`svgLayer`, подключает обработчики мыши канваса, загружает workflow по параметру `?id=` в URL, горячие клавиши (Delete, Escape)
- `nodes.ts` — Реестр `NODE_DEFS`; `createNodeEl()` строит DOM для карточки узла
- `connections.ts` — SVG-отрисовка кривых Безье через `renderConnections()`; hover-определение близости использует 24 точки выборки с порогом 12px; кнопки удаления — HTML `<div>`-элементы (не SVG), чтобы избежать проблем с перехватом pointer-events
- `canvas.ts` — Перетаскивание, панорамирование, зум, алгоритм авторасстановки (BFS для уровней + DFS для центрирования слотов)
- `properties.ts` — Строит форму UI для правой панели при выборе узла
- `panel.ts` — Левая панель: отображение категорий/элементов + глобальный поиск по всем категориям
- `home.ts` — Страница списка workflow: запросы к API, рендер карточек, обработчики переключения/удаления
- `theme.ts` — Общий для обеих страниц; применяет класс `light` к `document.documentElement` (не к `body`)

### Система тем
CSS-переменные определены на `:root` (тёмная тема по умолчанию). Переопределения светлой темы используют селектор `html.light`. Инлайн `<script>` в `<head>` каждой страницы синхронно применяет класс из `localStorage` до рендеринга, чтобы избежать мерцания.

### Поток сохранения workflow
- Редактор создаёт/обновляет через `POST /api/workflows` (новый) или `PUT /api/workflows/:id` (существующий), используя `history.replaceState` для установки `?id=` после первого сохранения
- Главная страница использует `PATCH /api/workflows/:id/toggle` для переключателя активации
- Обе страницы используют `pageshow` с `e.persisted` для повторной синхронизации состояния при восстановлении из bfcache браузера
