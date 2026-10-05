# Architecture Decision Ledger

Only cross-cutting architecture decisions belong here. Product behavior and schema evolution do not.

| Date       | Decision                                                                          | Reason                                                                       | Status   |
| ---------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| 2026-10-05 | Use a root pnpm workspace with Turborepo.                                         | One repository and one command surface for independently deployable apps.    | Accepted |
| 2026-10-05 | Use Expo mobile, Next.js admin, and one NestJS API, all in TypeScript.            | A consistent product language with platform-appropriate frameworks.          | Accepted |
| 2026-10-05 | Organize API code layer-first: Controller -> Service -> Repository -> Database.   | Predictable dependency direction and traceability across features.           | Accepted |
| 2026-10-05 | Require all THIGO business data access through the NestJS API.                    | Preserve one business authority and keep infrastructure replaceable.         | Accepted |
| 2026-10-05 | Use PostgreSQL as the relational source of truth; defer schema.                   | Preserve database direction without freezing speculative product design.     | Accepted |
| 2026-10-05 | Keep CrewAI/9Router isolated as development infrastructure.                       | AI availability must not affect product runtime.                             | Accepted |
| 2026-10-05 | Defer auth provider, queue, cache, object store, and realtime mechanism.          | No current requirement justifies locking these choices.                      | Open     |
| 2026-10-05 | Use TypeORM with NestJS and `pg`; require migrations and disable synchronization. | Establish one provider-neutral, production-safe PostgreSQL persistence path. | Accepted |
