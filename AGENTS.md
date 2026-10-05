# THIGO Agent Constitution

THIGO is a TypeScript monorepo containing three Expo mobile apps, one Next.js admin app, one NestJS API, shared tooling packages, and isolated Python AI development tooling.

## Repository map

- `apps/mobile/{customer,merchant,driver}`: Expo applications.
- `apps/admin-web`: Next.js admin UI.
- `apps/api`: NestJS business backend.
- `packages`: narrowly scoped, explicitly exported workspace packages.
- `.ai`: CrewAI development automation; never production runtime.
- `ARCHITECTURE.md`: architecture source of truth.
- `docs/FEATURE_ROADMAP.md`: ordered product scope and progress source of truth.
- `docs/UI_SYSTEM.md`: shared visual and interaction language.
- `docs/DECISIONS.md`: cross-cutting decision ledger.

Read the nearest scoped `AGENTS.md` before changing code.

## Invariants

- Product code is TypeScript. The root pnpm/Turborepo workspace owns the monorepo.
- Backend dependency direction is Controller -> Service -> Repository -> PostgreSQL.
- Frontends use the NestJS API for THIGO business data and never access PostgreSQL/Supabase directly.
- Apps do not import other apps. Packages expose explicit public entry points; no arbitrary deep imports.
- No microservices, domain schema, auth provider, queue, or speculative shared UI without owner approval.
- TypeORM is the approved persistence tool; schema synchronization stays disabled and schema changes use migrations.
- Migrations must eventually reproduce every database schema change.
- Product work follows `docs/FEATURE_ROADMAP.md` in order. When a root `TASK.md` exists, it is the detailed scope for the one active feature; do not implement later roadmap behavior.
- UI work follows `docs/UI_SYSTEM.md` and imports semantic values from `@thigo/design-tokens`. Inspect nearby patterns before composing a screen; do not create local design-system exceptions.

## Product and UI workflow

- Before product work, identify the current roadmap feature and read its status, dependency, surfaces, checklist, and notes.
- Promote roadmap status or check progress only after the corresponding work is verified. Record blockers explicitly instead of silently widening scope.
- Before UI work, review the target app on a representative viewport/device, preserve established composition patterns, and verify the visual review checklist in `docs/UI_SYSTEM.md`.
- Screen composition may evolve within the constrained design language. If a semantic token or UI rule is genuinely missing, explain the gap and update `docs/UI_SYSTEM.md` and `packages/design-tokens` together.

## Verification

Run `pnpm check`. For AI tooling also run `pnpm ai:doctor`; run `pnpm ai:smoke` when 9Router credentials and endpoint are available. Review the final diff and confirm no secret was added.

## Stop and ask the owner

Stop before changing any immutable choice in `ARCHITECTURE.md`, adding or replacing a major framework or infrastructure dependency, selecting auth/queue/database technology, replacing TypeORM, bypassing an application boundary, making an undocumented production database mutation, or unconstraining/replacing the approved UI language.
