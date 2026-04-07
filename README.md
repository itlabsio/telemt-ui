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

| Переменная                   | Обязательная | Описание                                                    |
| ---------------------------- | ------------ | ----------------------------------------------------------- |
| `TELEMT_API_BASE_URL`        | да           | Base URL Telemt API, например `http://127.0.0.1:9091`       |
| `TELEMT_API_AUTH_HEADER`     | нет          | Значение заголовка `Authorization` для backend              |
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
docker run -p 3000:3000 \
  -e TELEMT_API_BASE_URL=http://telemt:9091 \
  -e TELEMT_API_AUTH_HEADER=your-secret \
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
│   │   ├── health/
│   │   │   ├── live/             # Liveness probe
│   │   │   └── ready/            # Readiness probe (проверяет backend)
│   │   └── telemt/[...path]/     # Прокси к Telemt API (инжектит auth header)
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
│   ├── layout/                   # Sidebar, Topbar
│   └── users/                    # Диалоги create/edit/delete
├── lib/
│   ├── api/
│   │   ├── server.ts             # Server-side API клиент
│   │   └── browser.ts            # Browser API клиент (через прокси)
│   ├── cn.ts                     # className utility
│   └── fmt.ts                    # Форматирование чисел, байт, времени
├── types/api.ts                  # TypeScript типы из API.md
├── auth.ts                       # Auth.js конфигурация
├── proxy.ts                      # Next.js 16 auth guard
└── Dockerfile
```

## Безопасность

- **Backend auth header** передаётся только server-side через Route Handler — браузер его никогда не видит
- **SSRF protection** — прокси разрешает только пути с префиксом `/v1/`
- **OIDC allowlist** — ограничение по email домену и/или группам
- **/api/health/\*** — доступны без аутентификации (только для kubelet)
- Все остальные маршруты защищены auth proxy (`proxy.ts`)
