# THIGO

THIGO is a production-oriented monorepo containing Customer, Merchant, and Driver Expo apps, a Next.js admin app, one NestJS API, shared configuration, and isolated CrewAI development tooling.

## Prerequisites

- Node.js 24.15 or newer on the Node 24 line
- pnpm 11.13 (`corepack enable` is recommended)
- `uv` for optional AI tooling; it provisions the supported Python automatically

## Install

```sh
pnpm install
```

## Run

```sh
pnpm dev:customer
pnpm dev:merchant
pnpm dev:driver
pnpm dev:admin
pnpm dev:api
```

`pnpm dev` starts every app in parallel. The API defaults to `http://localhost:3001`; its health endpoint is `GET /health`.

## Database

Copy `apps/api/.env.example` to `apps/api/.env`, or provide `DATABASE_URL` through the process environment. The URL can point to the optional local PostgreSQL service, Supabase-managed PostgreSQL, or another PostgreSQL provider.

```sh
pnpm db:up
pnpm db:migration:show
pnpm db:migrate
pnpm db:migrate:revert
```

Create an empty migration by providing its path relative to `apps/api`:

```sh
pnpm db:migration:create -- src/migrations/DescribeChange
```

Generate a migration after adding an approved entity change:

```sh
pnpm db:migration:generate -- src/migrations/DescribeChange
```

`pnpm db:down` stops the optional local service. Docker is not required when `DATABASE_URL` points to an external PostgreSQL instance. TypeORM never synchronizes schema automatically.

### Local authentication fixtures

After the configured development database is running and migrations have been
applied, enable `OTP_PROVIDER=test` in `apps/api/.env` and run:

```sh
pnpm dev:seed
pnpm dev:api
```

Then start the desired app and sign in with the matching development account:

| App      | Phone      |
| -------- | ---------- |
| Customer | 0860000001 |
| Merchant | 0860000002 |
| Driver   | 0860000003 |
| Admin    | 0860000004 |

The development OTP is `000000`. The seed is explicit, idempotent, and refuses
to run when `NODE_ENV=production`; it is never run by API startup or migrations.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

## AI tooling

Ensure local 9Router is running, copy `.ai/crew/.env.example` to `.ai/crew/.env`, and add only `NINEROUTER_API_KEY`. The OpenAI-compatible endpoint defaults to `http://localhost:20128/v1`; set `NINEROUTER_BASE_URL` only when an override is needed. Never commit the real file.

```sh
pnpm ai:doctor
pnpm ai:smoke
```

`pnpm ai:doctor` performs deterministic environment and route diagnosis without model completions. `pnpm ai:smoke` makes exactly one tiny live acknowledgement call through `thigo-implement` and one through `thigo-reviewer`, verifies both responses, and exits without loading task/repository context, exposing product tools, or writing a report. `crewai run` is the full task execution workflow. Provider model IDs and fallback policy remain inside 9Router, and product development remains usable while 9Router is offline.

Start with [AGENTS.md](./AGENTS.md). The architecture source of truth is [ARCHITECTURE.md](./ARCHITECTURE.md); scoped rules sit beside API, mobile, admin, and AI code.
