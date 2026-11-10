# THIGO — F06 Driver Dispatch (Owner-Approved Priority Exception)

Status: IN_PROGRESS

## Authorization

The project owner explicitly authorized F06 implementation ahead of the original
roadmap sequence on 2026-10-13. F02, F03, F04, and F05 are not implicitly
completed. Only the minimum location and order-lifecycle prerequisites required
by F06 may be implemented here.

The previous F02 task is preserved in
`docs/F02_MERCHANT_CATALOG_TASK_ARCHIVE.md`.

## Primary outcome

Deliver the smallest reliable Driver platform for fewer than 50 active drivers:

Customer order → Merchant fulfillment → dispatch job → sequential driver offers
→ atomic acceptance → pickup → delivery → idempotent earnings.

## P0 slices

1. Driver profile, vehicle, online/offline presence, heartbeat, fresh GPS, and
   backward-compatible pickup/drop-off coordinates.
2. Unique delivery jobs, bounded nearby candidate discovery, Haversine
   prefiltering, replaceable routing/ETA boundary, and deterministic ranking.
3. Sequential expiring offers, rejection, atomic idempotent acceptance, and
   bounded reassignment.
4. Pickup, delivery completion, cancellation rules, earnings, and recovery.
5. Minimal Android Driver integration, PostgreSQL concurrency tests, realistic
   local benchmarks, and real Customer → Merchant → Driver verification.

## Constraints

- Preserve Controller → Service → Repository → PostgreSQL.
- Keep NestJS, PostgreSQL, TypeORM, and Expo; no new distributed infrastructure.
- Never hold database locks during routing or notification work.
- Never expose exact customer details before a driver owns the delivery.
- Never assign one delivery twice, exceed driver capacity, accept expired offers,
  or credit duplicate earnings.
- GPS writes must be freshness-, accuracy-, distance-, and interval-bounded.
- Existing address rows remain valid; missing coordinates must be handled
  explicitly and never represented as a real route estimate.
- P1/P2 remain deferred until P0 is stable and verified.
- Do not redesign application UI.

## Verification

- Unit and real PostgreSQL concurrency tests for dispatch and earnings.
- Existing F01/F02 regression tests.
- Android Emulator verification of availability, offers, reconnection, active
  delivery restoration, pickup, and completion.
- Reproducible benchmark for 10–50 online drivers and 1–10 concurrent orders.
- Run `pnpm check`; record unrelated blockers rather than widening scope.

## Verification checkpoint — 2026-10-14

- Both F06 migrations are applied; the development database reports 8/8
  migrations and retained the existing fixtures.
- Real PostgreSQL tests cover competing offer creation, duplicate and competing
  acceptance, expiry, rejection, stale assignment recovery, driver capacity,
  eligibility, and exactly-once earnings.
- A measured integration run used 50 online/moving drivers and 10 concurrent
  orders. Candidate query p50/p95 was 29.1/40.4 ms; ten accepts completed in
  23 ms and fifty GPS writes in 26 ms on the development machine.
- Android Emulator exercised a real customer order through merchant ready,
  offer expiry/rejection, offer acceptance, app reload/session restoration,
  pickup, completion, history, and a single 15,000 VND earning. During a real
  paused-database restart, it showed the disconnected state after the bounded
  timeout, retained the session, and the on-screen Retry restored history and
  earnings after PostgreSQL resumed.
- API/Driver lint, typecheck, tests, and builds pass. All 28 direct Turbo tasks
  pass; root `pnpm check` stops at its pre-existing 79-file formatting gate.

### Remaining P0 verification blocker

`Medium_Phone_2` granted location permission but its provider returned neither
a current nor cached fix, including after an emulator geo fix. Dispatch was
therefore exercised with an authenticated API location update at the same
coordinates. Direct sensor-sourced GPS remains unverified on a working emulator
image or physical Android device, so F06 remains `IN_PROGRESS` and F07 is not
promoted.

The API and database reconnect after a paused PostgreSQL container, but a
black-holed database socket can make `/health` wait for the caller timeout. The
Driver business client now bounds its own requests at 15 seconds and exposes a
retryable error rather than spinning indefinitely; a server-side health-query
timeout remains a follow-up reliability improvement.
