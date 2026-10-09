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

## Daily local startup

Local development uses the PostgreSQL service in `compose.yaml` (Docker Desktop). The first time, copy `apps/api/.env.example` to `apps/api/.env` and opt in to the development fixtures described below. Then, each day from the repository root:

```sh
# 1. Start Docker Desktop, then:
pnpm db:up          # PostgreSQL 18 on localhost:5432, data kept in a named volume
pnpm db:migrate     # applies only pending migrations; run after every pull
pnpm dev:seed       # only with fixtures enabled; idempotent, safe to repeat
pnpm dev:api        # NestJS on http://localhost:3001 (10.0.2.2:3001 from the Android Emulator)
pnpm dev:customer   # or dev:merchant / dev:driver
```

`pnpm dev:api`, `pnpm db:migrate` and `pnpm dev:seed` all read `DATABASE_URL` from `apps/api/.env`, so they always target the same database; a `DATABASE_URL` set in the shell takes precedence over the file. With `NODE_ENV=development` they refuse any database that is not on `localhost`, `127.0.0.1` or `[::1]`, so local work cannot reach a hosted database by accident. Set `THIGO_ALLOW_REMOTE_DEV_DATABASE=true` only when you mean to point development at a remote database. `pnpm db:migration:show` lists applied (`[X]`) and pending (`[ ]`) migrations, and the API logs any pending migrations by name when it connects.

Run `pnpm dev:seed` before `pnpm dev:api`. The seed rebuilds `apps/api/dist`, so if you re-seed while the API is running, restart `pnpm dev:api` afterwards.

`pnpm db:down` stops the container without deleting its volume. Never run `docker compose down -v` unless you intend to erase the local database.

## Database

Outside local development, `DATABASE_URL` can point to Supabase-managed PostgreSQL or another PostgreSQL provider, provided through `apps/api/.env` or the process environment.

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

### Local development fixtures

Development fixtures are off by default. They cover the seeded accounts, the
demo catalog, order history and images, and the fixed OTP `000000`. To use
them on your own machine, add these lines to `apps/api/.env` (the commented
lines in `.env.example` show the same settings):

```sh
NODE_ENV=development
THIGO_ENABLE_DEV_FIXTURES=true
OTP_PROVIDER=test
```

Fixtures run only when the flag is exactly `true` and `NODE_ENV` is
`development` or `test`. Any other value, or a missing setting, keeps them
off. With `NODE_ENV=production`, the API and `dev:seed` refuse to start if the
flag or `OTP_PROVIDER=test` is set. Never put these lines in a deployed
environment.

After the configured database is running and migrations have been applied,
run:

```sh
pnpm dev:seed
pnpm dev:api
```

The seed is idempotent and is never run by API startup or migrations. Sign in
with the matching development account:

| App      | Phone      | Notes                         |
| -------- | ---------- | ----------------------------- |
| Customer | 0860000001 | addresses and order history   |
| Merchant | 0860000002 | owns Cơm Tấm Sài Gòn          |
| Driver   | 0860000003 | second driver: 0860000201     |
| Merchant | 0860000005 | no store yet: first-run setup |
| Admin    | 0860000004 |                               |

With fixtures on, every sign-in screen (Admin web, Customer, Merchant, Driver)
also shows **Đăng nhập nhanh (DEV)** buttons for these accounts. The API lists
them at `GET /auth/dev/quick-login?application=ROLE` only when
`NODE_ENV=development` (or `test`), `THIGO_ENABLE_DEV_FIXTURES=true` and
`OTP_PROVIDER=test`; otherwise it answers 404 and the buttons stay hidden. A
quick login still goes through the normal OTP request and verify endpoints, so
the server's role check decides access exactly as for a typed number.

The seed also adds activity for the Admin dashboard: customers 0860000011–14,
drivers 0860000202–205 and two weeks of orders in every state. None of it
touches the regression accounts above, whose live order queues stay empty.

Open the Admin web with `pnpm dev:admin` (http://localhost:3000). Its pages
read the ADMIN-only `/admin/overview`, `/admin/stores`, `/admin/orders`,
`/admin/users` and `/admin/drivers` endpoints; changes such as hiding a store
or locking an account are not offered yet.

### Becoming a merchant

There are two ways in, and both end with an Admin decision:

- **Self-service:** the owner signs in to the Merchant app with their phone and OTP. A phone without the Merchant role opens the partner application ("Đăng ký trở thành đối tác"): store name, type, address, store phone, a short description and a contact name. The owner can save a draft, submit, see the status, and edit and resubmit when THIGO asks for changes.
- **Admin-assisted:** in the Admin web, **Đối tác → Thêm đối tác** records the owner's phone and store details as an approved application. If that phone already has an account, it becomes a merchant at once; otherwise it becomes one only when that phone signs in to the Merchant app with OTP and taps "Kích hoạt tài khoản đối tác".

Admins review applications under **Đối tác**: approve, request changes with a reason, or reject with a reason. Approval grants the Merchant role and creates the store, unpublished, in one transaction; repeated or concurrent approvals are refused. Every step is kept in the application history with who did it and when. Merchant accounts that already existed keep working without an application.

After approval the owner finishes **storefront setup** in the Merchant app: logo and cover, categories and products, opening hours, then publish. A store can be published once it has a valid phone, a valid address and at least one available product in a visible category; publishing needs no Admin approval.

Uploaded images are written to `MEDIA_STORAGE_DIR` (default
`apps/api/storage/media` in development). Production must point it at a
persistent volume; see [docs/MEDIA_STORAGE.md](./docs/MEDIA_STORAGE.md).

Android testing on a local emulator is described in
[docs/ANDROID_TESTING.md](./docs/ANDROID_TESTING.md).

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
