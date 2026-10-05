# THIGO Feature Roadmap

This is the product execution map for THIGO. It fixes sequence and scope without turning future features into specifications. Detailed implementation work belongs in a root `TASK.md` only when a feature becomes active.

## Status model

Only these statuses are valid: `PLANNED`, `READY`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

- `PLANNED`: sequenced, but its dependency or acceptance work is not ready.
- `READY`: dependencies are complete and the feature can receive a `TASK.md`.
- `IN_PROGRESS`: one approved `TASK.md` is being implemented.
- `BLOCKED`: implementation started but cannot proceed; record the blocker in the feature notes and `TASK.md`.
- `DONE`: the agreed scope is implemented and verified.

Features move in order: `F00 -> F01 -> F02 -> F03 -> F04 -> F05 -> F06 -> F07 -> F08`. Finish and verify the current feature before promoting the next one. Do not pull behavior from a later feature into the active feature.

## Roadmap at a glance

`✓` is a primary surface; `—` means no planned feature surface. Supporting involvement can be decided in the active `TASK.md` when it is genuinely required.

| ID  | Feature                        | Customer | Merchant | Driver | Admin | API | Status  |
| --- | ------------------------------ | -------- | -------- | ------ | ----- | --- | ------- |
| F00 | Architecture & Data Foundation | —        | —        | —      | —     | ✓   | DONE    |
| F01 | Identity & Access              | ✓        | ✓        | ✓      | ✓     | ✓   | READY   |
| F02 | Merchant Onboarding            | —        | ✓        | —      | ✓     | ✓   | PLANNED |
| F03 | Catalog & Availability         | ✓        | ✓        | —      | —     | ✓   | PLANNED |
| F04 | Driver Availability            | —        | ✓        | ✓      | ✓     | ✓   | PLANNED |
| F05 | Order Lifecycle                | ✓        | ✓        | ✓      | ✓     | ✓   | PLANNED |
| F06 | Payments & Settlement          | ✓        | ✓        | —      | ✓     | ✓   | PLANNED |
| F07 | Realtime Operations            | ✓        | ✓        | ✓      | ✓     | ✓   | PLANNED |
| F08 | Platform Capabilities          | ✓        | ✓        | ✓      | ✓     | ✓   | PLANNED |

## F00 — Architecture & Data Foundation

- **Status:** `DONE`
- **Depends on:** None
- **Goal:** Establish the monorepo, application boundaries, development governance, and provider-neutral PostgreSQL persistence foundation needed by later features.
- **Surfaces:** API and repository tooling; frontend applications remain placeholders.
- **Progress:**
  - [x] Phase 0 pnpm/Turborepo application and package structure
  - [x] Architecture, dependency direction, lint boundaries, and scoped agent rules
  - [x] NestJS health slice and frontend placeholder applications
  - [x] TypeORM/PostgreSQL configuration, repository boundary, migration commands, and degraded database health behavior
  - [x] Root verification and isolated CrewAI development tooling
- **Notes:** No live PostgreSQL connection was available during foundation verification. Configuration, unit behavior, builds, and the degraded health path were verified; a real-database migration and connectivity check remains an environment verification, not an unreported F00 implementation claim.

## F01 — Identity & Access

- **Status:** `READY`
- **Depends on:** F00
- **Goal:** Give each THIGO surface a trustworthy identity and access boundary appropriate to its role.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Define user-visible access states and acceptance criteria
  - [ ] Implement the approved cross-surface scope
  - [ ] Verify authorization boundaries, failure states, and accessibility
  - [ ] Record completion evidence and promote F02
- **Notes:** The identity provider, session mechanism, roles, permissions, recovery flows, and domain schema are deliberately unspecified here. Those choices require the active task and any architecture approval called for by `ARCHITECTURE.md`.

## F02 — Merchant Onboarding

- **Status:** `PLANNED`
- **Depends on:** F01
- **Goal:** Let a merchant submit and understand the status of the minimum information required to operate on THIGO.
- **Surfaces:** Merchant, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement only the approved onboarding journey
  - [ ] Verify mobile, admin, API, and failure-state behavior
  - [ ] Record completion evidence and promote F03
- **Notes:** Do not preselect review policy, required documents, legal workflow, or merchant data model in this roadmap.

## F03 — Catalog & Availability

- **Status:** `PLANNED`
- **Depends on:** F02
- **Goal:** Let merchants maintain an understandable offer and let customers see what is currently orderable.
- **Surfaces:** Customer, Merchant, API; Admin only if the active task proves an operational need.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved catalog and availability scope
  - [ ] Verify consistency across participating surfaces
  - [ ] Record completion evidence and promote F04
- **Notes:** Taxonomy, modifiers, inventory policy, search, pricing rules, and moderation remain future task decisions.

## F04 — Driver Availability

- **Status:** `PLANNED`
- **Depends on:** F03
- **Goal:** Represent when a driver can participate in fulfillment and make that operational state clear to the required surfaces.
- **Surfaces:** Driver, Merchant, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved availability flow
  - [ ] Verify transitions, stale-state handling, and operational readability
  - [ ] Record completion evidence and promote F05
- **Notes:** Matching, dispatch, location tracking, schedules, and eligibility rules are not defined here.

## F05 — Order Lifecycle

- **Status:** `PLANNED`
- **Depends on:** F04
- **Goal:** Support one coherent, auditable order journey across the people who place, prepare, deliver, and oversee it.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved lifecycle and exception scope
  - [ ] Verify state transitions and each role's next action
  - [ ] Record completion evidence and promote F06
- **Notes:** Order states, cancellation rules, assignment logic, and service guarantees belong in the active task and domain design.

## F06 — Payments & Settlement

- **Status:** `PLANNED`
- **Depends on:** F05
- **Goal:** Make payment outcomes and merchant settlement information accurate, understandable, and supportable.
- **Surfaces:** Customer, Merchant, Admin, API; Driver only if the active task includes a verified need.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved payment and settlement scope
  - [ ] Verify money display, failure recovery, auditability, and accessibility
  - [ ] Record completion evidence and promote F07
- **Notes:** Provider, payment methods, fees, refunds, reconciliation, payout timing, and financial schema are intentionally undecided.

## F07 — Realtime Operations

- **Status:** `PLANNED`
- **Depends on:** F06
- **Goal:** Deliver timely operational updates where freshness materially changes a user's next action.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement only the approved realtime use cases
  - [ ] Verify latency expectations, reconnection, stale data, and fallback behavior
  - [ ] Record completion evidence and promote F08
- **Notes:** Realtime transport, queues, notifications, event contracts, and caching are not selected by this roadmap.

## F08 — Platform Capabilities

- **Status:** `PLANNED`
- **Depends on:** F07
- **Goal:** Add proven cross-cutting capabilities that improve reliability, operability, safety, or product learning after the core journey exists.
- **Surfaces:** Only the applications and API surfaces justified by each approved capability.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Name a concrete capability and its measured need
  - [ ] Implement and verify the smallest approved cross-cutting scope
  - [ ] Record completion evidence
- **Notes:** F08 is not a backlog dumping ground. Observability, experimentation, support tools, localization, media, caching, and other platform ideas enter only with evidence, ownership, and explicit scope.
