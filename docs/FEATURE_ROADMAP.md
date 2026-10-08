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

| ID  | Feature                        | Customer | Merchant | Driver | Admin | API | Status      |
| --- | ------------------------------ | -------- | -------- | ------ | ----- | --- | ----------- |
| F00 | Architecture & Data Foundation | —        | —        | —      | —     | ✓   | DONE        |
| F01 | Identity & Access              | ✓        | ✓        | ✓      | ✓     | ✓   | DONE        |
| F02 | Merchant & Catalog             | ✓        | ✓        | ✓      | ✓     | ✓   | IN_PROGRESS |
| F03 | Location & Service Area        | ✓        | ✓        | —      | —     | ✓   | PLANNED     |
| F04 | Discovery, Cart & Checkout     | ✓        | —        | —      | —     | ✓   | PLANNED     |
| F05 | Order Operations               | ✓        | ✓        | —      | ✓     | ✓   | PLANNED     |
| F06 | Driver & Delivery              | ✓        | ✓        | ✓      | ✓     | ✓   | PLANNED     |
| F07 | Realtime & Notifications       | ✓        | ✓        | ✓      | ✓     | ✓   | PLANNED     |
| F08 | MVP Operations & Hardening     | ✓        | ✓        | ✓      | ✓     | ✓   | PLANNED     |

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

- **Status:** `DONE`
- **Depends on:** F00
- **Goal:** Give each THIGO surface a trustworthy identity and access boundary appropriate to its role.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [x] Create and approve the feature `TASK.md`
  - [x] Define user-visible access states and acceptance criteria
  - [x] Implement the approved cross-surface scope
  - [x] Verify authorization boundaries, failure states, and accessibility
  - [x] Record completion evidence and promote F02
- **Notes:** Completed on 2026-10-06. Runtime verification covered Customer, Merchant, and Driver on an Android emulator plus Admin at 1366×768 and a narrow browser viewport against the real NestJS/PostgreSQL stack. Authorized and denied roles, session restore, logout, revoked-session rejection, invalid OTP, UTF-8 Vietnamese, overflow, and keyboard focus were exercised.

## F02 — Merchant & Catalog

- **Status:** `IN_PROGRESS`
- **Depends on:** F01
- **Goal:** Let a merchant set up a storefront and manage categories, products, prices, and availability; let customers browse the real storefront and catalog; provide bounded Admin visibility; and replace the Customer, Merchant, and Driver prototype entry/authenticated shells with polished role-appropriate experiences.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [x] Confirm dependency completion
  - [x] Create and approve the feature `TASK.md`
  - [ ] Implement only the approved merchant, catalog, browsing, bounded visibility, and shell-polish scope
  - [ ] Verify participating mobile, admin, API, persistence, authorization, and failure-state behavior
  - [ ] Record completion evidence and promote F03
- **Notes:** This approved feature combines merchant storefront setup and catalog/availability in F02; catalog is not a separate F03. F02 remains `READY` until the implementation Flow begins, at which point that Flow may move it to `IN_PROGRESS`. Geographic location, service-area logic, cart, checkout, orders, and delivery remain outside F02. The P0 entry-experience slice (Customer, Merchant, and Driver login, OTP, and authenticated shells) is implemented; it was checked in a browser render against the real NestJS/PostgreSQL auth stack, and Android Emulator verification is still outstanding. Storefront, catalog, and Admin visibility are not started. Owner-requested end-to-end ordering slice (2026-10-08): customer browsing of a real catalog (stores, categories, menu, options, search) now reads the NestJS API backed by PostgreSQL tables and development-only seeds; merchant catalog management, storefront setup, and Admin visibility are still not built.

## F03 — Location & Service Area

- **Status:** `PLANNED`
- **Depends on:** F02
- **Goal:** Establish the approved customer location and merchant service-area behavior needed to determine where THIGO can serve.
- **Surfaces:** Customer, Merchant, API; Admin only if the active task proves an operational need.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved location and service-area scope
  - [ ] Verify consistency across participating surfaces
  - [ ] Record completion evidence and promote F04
- **Notes:** Geocoding, maps, PostGIS use, coverage rules, address policy, ranking, routing, and live tracking remain active-task decisions; this roadmap does not preselect them.

## F04 — Discovery, Cart & Checkout

- **Status:** `PLANNED`
- **Depends on:** F03
- **Goal:** Let a customer discover an eligible offer, build a cart, and complete the approved checkout journey.
- **Surfaces:** Customer and API; Merchant or Admin only if the active task proves a required supporting surface.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved discovery, cart, and checkout scope
  - [ ] Verify eligibility, totals, failure recovery, and accessibility
  - [ ] Record completion evidence and promote F05
- **Notes:** Ranking, search, promotions, fees, payment methods, and provider choices are not selected by this roadmap. An owner-requested slice built ahead of sequence (2026-10-08) provides a single-store cart, saved addresses, COD-only checkout with server-side pricing, a flat 15.000 ₫ delivery fee and idempotent order placement; it was verified against the real API and PostgreSQL in a browser render only. Status stays `PLANNED` until F03 and a `TASK.md` confirm or replace those choices.

## F05 — Order Operations

- **Status:** `PLANNED`
- **Depends on:** F04
- **Goal:** Give customers, merchants, and bounded Admin operations a coherent, auditable order flow before delivery execution begins.
- **Surfaces:** Customer, Merchant, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved order operations and exception scope
  - [ ] Verify state transitions and each role's next action
  - [ ] Record completion evidence and promote F06
- **Notes:** Order states, acceptance, preparation, cancellation, support actions, and service guarantees belong in the active task. Driver assignment and delivery execution remain F06. The 2026-10-08 slice adds customer tracking/history/cancel-while-pending and a merchant order board (accept, reject with reason, preparing, ready) with ownership checks and conditional status transitions; Admin order operations are not built.

## F06 — Driver & Delivery

- **Status:** `PLANNED`
- **Depends on:** F05
- **Goal:** Support the approved driver availability, assignment, pickup, delivery, and cross-surface fulfillment journey.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement the approved driver and delivery scope
  - [ ] Verify assignment and delivery transitions, authorization, recovery, and operational readability
  - [ ] Record completion evidence and promote F07
- **Notes:** Matching, dispatch, driver eligibility, schedules, route behavior, proof of delivery, and exception policy remain active-task decisions. The 2026-10-08 slice adds a basic driver flow (self-claim from an open list with one active job per driver and a race-safe claim, pickup only when food is ready, delivery confirmation); there is no GPS, dispatch or proof of delivery, and Android Emulator verification is outstanding.

## F07 — Realtime & Notifications

- **Status:** `PLANNED`
- **Depends on:** F06
- **Goal:** Deliver timely operational updates and notifications where freshness materially changes a user's next action.
- **Surfaces:** Customer, Merchant, Driver, Admin, API.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Implement only the approved realtime and notification use cases
  - [ ] Verify latency expectations, reconnection, stale data, and fallback behavior
  - [ ] Record completion evidence and promote F08
- **Notes:** Realtime transport, queues, notification channels, event contracts, delivery guarantees, and caching are not selected by this roadmap.

## F08 — MVP Operations & Hardening

- **Status:** `PLANNED`
- **Depends on:** F07
- **Goal:** Verify and harden the complete MVP journey for reliable operation, support, safety, and launch readiness.
- **Surfaces:** Customer, Merchant, Driver, Admin, API, and repository operations as justified by the approved task.
- **Progress:**
  - [ ] Confirm dependency completion
  - [ ] Create and approve the feature `TASK.md`
  - [ ] Define the approved operational and hardening acceptance scope
  - [ ] Implement and verify the smallest changes required for MVP readiness
  - [ ] Record completion evidence
- **Notes:** F08 is not a backlog dumping ground. Observability, support tools, resilience, accessibility, security, performance, localization, and other hardening work enter only with evidence, ownership, and explicit MVP scope.
