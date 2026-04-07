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

| Переменная                   | Обязательная | Описание                                                                                             |
| ---------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `OIDC_ISSUER`                | да           | Issuer URL провайдера (`/.well-known/openid-configuration`)                                          |
| `OIDC_CLIENT_ID`             | да           | Client ID приложения                                                                                 |
| `OIDC_CLIENT_SECRET`         | да           | Client Secret приложения                                                                             |
| `OIDC_SCOPE`                 | нет          | OIDC scopes, по умолчанию `openid profile email`                                                     |
| `OIDC_ALLOWED_EMAIL_DOMAINS` | нет          | Допустимые домены email через запятую. Пусто — все                                                   |
| `OIDC_ALLOW_GROUPS`          | нет          | Допустимые OIDC-группы через запятую. Пусто — все                                                    |
| `AUTH_SECRET`                | да           | Секрет для подписи JWT сессий (`openssl rand -base64 32`)                                            |
| `NEXTAUTH_URL`               | нет          | Публичный URL приложения. Если не задан — определяется автоматически из заголовка `Host`             |
| `AUTH_TRUST_HOST`            | нет          | `true` — доверять заголовку `Host`. Автоматически включено в конфиге, переменная для явного контроля |

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

Образ публикуется на GitHub Container Registry:

```
ghcr.io/itlabsio/telemt-ui:latest
ghcr.io/itlabsio/telemt-ui:1.2.3
```

Поддерживаются платформы `linux/amd64` и `linux/arm64`.

### Сборка образа локально

```bash
docker build -t telemt-ui .
```

### Docker Compose

#### Один сервер

```yaml
# compose.yml
services:
  telemt-ui:
    image: ghcr.io/itlabsio/telemt-ui:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      TELEMT_API_BASE_URL: http://telemt:9091
      TELEMT_API_AUTH_HEADER: your-secret
      OIDC_ISSUER: https://auth.example.com
      OIDC_CLIENT_ID: telemt-ui
      OIDC_CLIENT_SECRET: change-me
      AUTH_SECRET: change-me
      NEXTAUTH_URL: https://telemt.example.com
      AUTH_TRUST_HOST: "true"
```

#### Несколько серверов

```yaml
# compose.yml
services:
  telemt-ui:
    image: ghcr.io/itlabsio/telemt-ui:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Production backend
      TELEMT_API_BASE_URL_1: http://prod:9091
      TELEMT_API_AUTH_HEADER_1: prod-secret
      TELEMT_API_LABEL_1: Production
      # Staging backend
      TELEMT_API_BASE_URL_2: http://staging:9091
      TELEMT_API_AUTH_HEADER_2: staging-secret
      TELEMT_API_LABEL_2: Staging
      # OIDC
      OIDC_ISSUER: https://auth.example.com
      OIDC_CLIENT_ID: telemt-ui
      OIDC_CLIENT_SECRET: change-me
      AUTH_SECRET: change-me
      NEXTAUTH_URL: https://telemt.example.com
      AUTH_TRUST_HOST: "true"
```

#### С Telemt в одном compose-файле

```yaml
# compose.yml
services:
  # https://github.com/An0nX/telemt-docker
  telemt:
    image: whn0thacked/telemt-docker:latest
    restart: unless-stopped
    volumes:
      - ./config.toml:/etc/telemt/config.toml:rw
    ports:
      - "443:443"

  telemt-ui:
    image: ghcr.io/itlabsio/telemt-ui:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      TELEMT_API_BASE_URL: http://telemt:9091
      TELEMT_API_AUTH_HEADER: your-secret
      OIDC_ISSUER: https://auth.example.com
      OIDC_CLIENT_ID: telemt-ui
      OIDC_CLIENT_SECRET: change-me
      AUTH_TRUST_HOST: "true"
      AUTH_SECRET: change-me
      NEXTAUTH_URL: https://telemt.example.com
    depends_on:
      - telemt
```

Запуск:

```bash
docker compose up -d
```

### GitHub Actions

При создании тега `v*` запускается два последовательных job-а:

1. **`release`** — генерирует changelog из коммитов и создаёт GitHub Release.
2. **`build`** — собирает Docker образ и публикует в GHCR.

```
ghcr.io/<owner>/<repo>:1.2.3
ghcr.io/<owner>/<repo>:1.2
ghcr.io/<owner>/<repo>:latest
```

#### Changelog

Коммиты группируются по [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` → **Features**
- `fix:` → **Bug Fixes**
- остальные → **Other Changes**

Тег с суффиксом (например `v1.0.0-rc.1`) автоматически помечается как pre-release.

#### Требования

В настройках репозитория включить:
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
