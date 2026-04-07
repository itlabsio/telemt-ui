# Telemt Control Panel

Web UI для управления и мониторинга [Telemt MTProxy](https://github.com/telemt/telemt) — control-plane HTTP API.

## Стек

|               |                                                                                       |
| ------------- | ------------------------------------------------------------------------------------- |
| Runtime       | [Bun](https://bun.sh)                                                                 |
| Framework     | [Next.js 16](https://nextjs.org) (App Router, Turbopack)                              |
| Auth          | [Auth.js v5](https://authjs.dev) — generic OIDC (Keycloak, Authentik, Dex, Google, …) |
| UI            | Tailwind CSS v4, Lucide React, Recharts                                               |
| Data fetching | Server Components (SSR) + SWR (client polling)                                        |
| Language      | TypeScript (strict)                                                                   |

## Возможности

- **Overview** — health, runtime gates, ME writer coverage, system info
- **Users** — просмотр, создание, редактирование, удаление пользователей; proxy-ссылки; live-статистика подключений
- **Runtime** — ME pool state, selftest (KDF, timeskew, BND, IP), NAT/STUN, ME quality, edge connections, ring-buffer событий
- **Statistics** — zero-cost счётчики (core, upstream, ME protocol, pool, desync), upstreams, DC coverage, ME writers
- **Security** — posture overview, IP whitelist, security checklist
- OIDC allowlist по e-mail домену (`OIDC_ALLOWED_EMAIL_DOMAINS`) и группам (`OIDC_ALLOW_GROUPS`)
- **Мультибэкенд** — поддержка нескольких серверов Telemt с переключением прямо в UI
- Kubernetes liveness / readiness пробы (`/api/health/live`, `/api/health/ready`)
- Backend `Authorization` header никогда не покидает сервер (проксирование через Route Handler)

## Быстрый старт

### Предварительные требования

- [Bun](https://bun.sh) ≥ 1.3
- Запущенный Telemt с включённым `[server.api]`
- OIDC провайдер с зарегистрированным клиентом

### Установка

```bash
bun install
```

### Конфигурация

Скопируйте шаблон и заполните переменные:

```bash
cp env.example .env.local
```

#### Бэкенд серверы

Поддерживается как один, так и несколько серверов Telemt.

**Один сервер** (упрощённая форма, backward compatible):

| Переменная               | Обязательная | Описание                                              |
| ------------------------ | ------------ | ----------------------------------------------------- |
| `TELEMT_API_BASE_URL`    | да           | Base URL Telemt API, например `http://127.0.0.1:9091` |
| `TELEMT_API_AUTH_HEADER` | нет          | Значение заголовка `Authorization` для backend        |

**Несколько серверов** (числовые суффиксы `_1`, `_2`, …):

| Переменная                 | Обязательная | Описание                                              |
| -------------------------- | ------------ | ----------------------------------------------------- |
| `TELEMT_API_BASE_URL_N`    | да           | Base URL N-го сервера, например `http://server1:9091` |
| `TELEMT_API_AUTH_HEADER_N` | нет          | Заголовок `Authorization` для N-го сервера            |
| `TELEMT_API_LABEL_N`       | нет          | Отображаемое имя сервера в UI, например `Production`  |

Пример для двух серверов:

```bash
TELEMT_API_BASE_URL_1=http://server1:9091
TELEMT_API_AUTH_HEADER_1=secret1
TELEMT_API_LABEL_1=Production

TELEMT_API_BASE_URL_2=http://server2:9091
TELEMT_API_AUTH_HEADER_2=secret2
TELEMT_API_LABEL_2=Staging
```

При наличии нескольких серверов в сайдбаре появляется dropdown для переключения.
Активный сервер передаётся через URL-параметр `?srv=N` — ссылки остаются shareable.
Первый сервер (наименьший суффикс) используется для readiness пробы и SSR.

#### OIDC и Auth.js

| Переменная                   | Обязательная | Описание                                                    |
| ---------------------------- | ------------ | ----------------------------------------------------------- |
| `OIDC_ISSUER`                | да           | Issuer URL провайдера (`/.well-known/openid-configuration`) |
| `OIDC_CLIENT_ID`             | да           | Client ID приложения                                        |
| `OIDC_CLIENT_SECRET`         | да           | Client Secret приложения                                    |
| `OIDC_SCOPE`                 | нет          | OIDC scopes, по умолчанию `openid profile email`            |
| `OIDC_ALLOWED_EMAIL_DOMAINS` | нет          | Допустимые домены email через запятую. Пусто — все          |
| `OIDC_ALLOW_GROUPS`          | нет          | Допустимые OIDC-группы через запятую. Пусто — все           |
| `AUTH_SECRET`                | да           | Секрет для подписи JWT сессий (`openssl rand -base64 32`)   |
| `NEXTAUTH_URL`               | да           | Публичный URL приложения, например `http://localhost:3000`  |

> **OIDC redirect URI**, который нужно зарегистрировать у провайдера:
> `{NEXTAUTH_URL}/api/auth/callback/oidc`

> **Группы (`OIDC_ALLOW_GROUPS`)** требуют наличия claim `groups` в ID-токене.
> В Keycloak включается через mapper «Group Membership», в Authentik — через scope «groups».

### Запуск в режиме разработки

```bash
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Production сборка

```bash
bun run build
bun start
```

## Docker

### Сборка образа

```bash
docker build -t telemt-frontend .
```

### Запуск контейнера

```bash
# Один сервер
docker run -p 3000:3000 \
  -e TELEMT_API_BASE_URL=http://telemt:9091 \
  -e TELEMT_API_AUTH_HEADER=your-secret \
  -e OIDC_ISSUER=https://auth.example.com \
  -e OIDC_CLIENT_ID=telemt-frontend \
  -e OIDC_CLIENT_SECRET=... \
  -e AUTH_SECRET=... \
  -e NEXTAUTH_URL=https://telemt.example.com \
  telemt-frontend

# Несколько серверов
docker run -p 3000:3000 \
  -e TELEMT_API_BASE_URL_1=http://prod:9091 \
  -e TELEMT_API_AUTH_HEADER_1=prod-secret \
  -e TELEMT_API_LABEL_1=Production \
  -e TELEMT_API_BASE_URL_2=http://staging:9091 \
  -e TELEMT_API_AUTH_HEADER_2=staging-secret \
  -e TELEMT_API_LABEL_2=Staging \
  -e OIDC_ISSUER=https://auth.example.com \
  -e OIDC_CLIENT_ID=telemt-frontend \
  -e OIDC_CLIENT_SECRET=... \
  -e AUTH_SECRET=... \
  -e NEXTAUTH_URL=https://telemt.example.com \
  telemt-frontend
```

### GitHub Actions

При создании тега `v*` образ автоматически собирается и публикуется в GHCR:

```
ghcr.io/<owner>/<repo>:v1.2.3
ghcr.io/<owner>/<repo>:v1.2
ghcr.io/<owner>/<repo>:latest
```

Для работы workflow нужно включить:
`Settings → Actions → General → Workflow permissions → Read and write permissions`

## Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

`/api/health/ready` проверяет доступность Telemt backend — pod не получит трафик пока backend недоступен.

## Структура проекта

```
.
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js OIDC callback
│   │   ├── backends/             # Список бэкендов для UI (без auth header)
│   │   ├── health/
│   │   │   ├── live/             # Liveness probe
│   │   │   └── ready/            # Readiness probe (проверяет primary backend)
│   │   └── telemt/[...path]/     # Прокси: /api/telemt/<srv>/v1/...
│   ├── actions/auth.ts           # Server action: sign-out
│   ├── dashboard/
│   │   ├── page.tsx              # Overview
│   │   ├── users/                # Управление пользователями
│   │   ├── runtime/              # Runtime мониторинг
│   │   ├── stats/                # Статистика
│   │   └── security/             # Security posture
│   └── login/                    # Страница входа
├── components/
│   ├── ui/                       # Базовые компоненты (badge, button, card, …)
│   ├── layout/                   # Sidebar, Topbar, ServerSelector
│   └── users/                    # Диалоги create/edit/delete
├── lib/
│   ├── api/
│   │   ├── server.ts             # Server-side API клиент (primary backend)
│   │   └── browser.ts            # createBrowserApi(serverIndex) — через прокси
│   ├── backends.ts               # Реестр бэкендов, парсинг env
│   ├── use-server-index.ts       # Хук: читает/пишет ?srv=N в URL
│   ├── cn.ts                     # className utility
│   └── fmt.ts                    # Форматирование чисел, байт, времени
├── types/api.ts                  # TypeScript типы из API.md
├── auth.ts                       # Auth.js конфигурация
├── proxy.ts                      # Next.js 16 auth guard
└── Dockerfile
```

## Безопасность

- **Backend auth header** передаётся только server-side через Route Handler — браузер его никогда не видит
- **SSRF protection** — прокси разрешает только пути с префиксом `/v1/`, индекс бэкенда валидируется по реестру
- **OIDC allowlist** — ограничение по email домену и/или группам
- **/api/health/\*** — доступны без аутентификации (только для kubelet)
- **/api/backends** — возвращает только `{index, label}`, auth header не раскрывается
- Все остальные маршруты защищены auth proxy (`proxy.ts`)
