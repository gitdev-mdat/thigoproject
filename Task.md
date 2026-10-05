# TASK — F01 Identity & Access

Status: READY → IN_PROGRESS when implementation starts

## Primary Outcome

Complete THIGO F01 — Identity & Access as one end-to-end vertical slice.

After this task:

- Customer can enter THIGO using phone number + OTP.
- Merchant can enter Merchant App using an authorized Merchant account.
- Driver can enter Driver App using an authorized Driver account.
- Admin can enter Admin Web using an authorized Admin account.
- The NestJS API knows the authenticated user and their role.
- Unauthorized users cannot access another application's protected capabilities.
- Sessions persist correctly and can be revoked by logout.
- Authentication is backed by real PostgreSQL data.
- F01 becomes DONE only after verified end-to-end behavior.

Do not split this task into F01.1 / F01.2 / F01.3.

This task owns the complete F01 outcome.

---

# Read First

Before modifying code, read:

- `/AGENTS.md`
- `/ARCHITECTURE.md`
- `/docs/FEATURE_ROADMAP.md`
- `/docs/UI_SYSTEM.md`
- `/docs/DECISIONS.md`
- `/apps/api/AGENTS.md`
- `/apps/mobile/AGENTS.md`
- `/apps/admin-web/AGENTS.md`

Inspect the current repository before implementing.

Preserve the established architecture:

Frontend
↓
NestJS API
↓
Controller
↓
Service
↓
Repository
↓
TypeORM
↓
PostgreSQL

Do not redesign the architecture.

---

# P0 — Required For F01 DONE

## 1. Audit Existing Repository

Before implementation, inspect specifically:

- existing API module/controller/service/repository conventions
- TypeORM configuration
- migration commands
- environment validation
- health endpoint
- mobile app structure
- Admin Web structure
- design token usage
- current tests
- architecture lint rules
- FEATURE_ROADMAP status

The audit exists only to understand where the implementation belongs.

Do not use the audit as an excuse to refactor unrelated Phase 0 work.

At implementation start:

F01 → IN_PROGRESS

Do not mark F01 DONE until all P0 acceptance criteria pass.

---

## 2. Authentication Model

THIGO authentication is intentionally simple.

Primary identity:

PHONE NUMBER

No:

- email login
- username
- password
- Google login
- Facebook login
- password reset
- email verification

Canonicalize Vietnamese phone numbers server-side.

At minimum support common input forms such as:

0901234567

and:

+84901234567

Store one canonical representation.

Frontend normalization is convenience only.

Backend remains authoritative.

---

## 3. Minimal Data Model

Create only the persistence required by F01.

A reasonable minimal model should cover:

### User

Required concepts:

- stable id
- canonical phone number
- active/inactive state
- created timestamp
- updated timestamp

### Role / User Role

Required roles:

- CUSTOMER
- MERCHANT
- DRIVER
- ADMIN

Choose the smallest clean representation that does not unnecessarily block a user from having another role in the future.

Do not build a permission engine.

Do not add speculative permissions such as:

ORDER_MANAGE
CATALOG_EDIT
DRIVER_ASSIGN
SUPER_ADMIN

Roles are enough for F01.

### OTP Challenge

Persist enough information to support:

- phone number
- OTP verification
- expiry
- attempt control
- consumed state
- resend behavior

Never persist plaintext production OTP if avoidable.

### Session

Use a simple database-backed opaque session.

Session should contain enough information for:

- random secure session token
- user association
- created time
- expiry
- revoked/logout state

Store only a hash of the session token in PostgreSQL.

Do not store raw session tokens.

Do not introduce JWT + refresh-token infrastructure unless an existing repository constraint makes opaque sessions impossible.

No Redis.

No distributed session infrastructure.

PostgreSQL is sufficient for this stage.

All schema changes must be implemented through TypeORM migrations.

`synchronize` remains false.

---

## 4. OTP Flow

Required API behavior:

Request OTP

    phone
      ↓

canonicalize
↓
create OTP challenge
↓
send using configured OTP provider

Verify OTP

    phone + OTP
        ↓

verify active challenge
↓
identify/create user as allowed
↓
create session
↓
return authenticated result

Implement the OTP provider behind one small boundary so production SMS can be introduced later.

For this task:

### Development / Test Provider

Provide a safe development/test OTP mechanism.

It may use a deterministic test OTP such as:

000000

but ONLY when explicitly running in development/test OTP mode.

Production mode must never silently fall back to test OTP.

Do not integrate a real SMS vendor in F01.

Do not build Twilio/Viettel/VNPT/FPT SMS integration yet.

OTP should have sensible protection:

- finite expiry
- finite verification attempts
- resend cooldown
- consumed OTP cannot be reused

Do not build enterprise anti-fraud infrastructure.

---

## 5. Registration Rules

Do not allow users to grant themselves privileged roles.

### Customer App

If a valid OTP is verified and no account exists:

Create the minimum user account with CUSTOMER role.

Then create session.

Customer onboarding/profile is NOT part of this task.

### Merchant App

An unknown phone number must NOT automatically become MERCHANT.

MERCHANT role must already exist.

If authentication succeeds but role is missing:

deny Merchant App access clearly.

### Driver App

Same rule as Merchant.

An unknown user cannot self-create DRIVER access.

### Admin Web

ADMIN can never be self-registered from the public login flow.

Admin role must already exist.

For development and automated verification, privileged fixture accounts may be inserted using test setup/fixtures.

Do not create a production-facing "create admin" UI.

---

## 6. Session Authentication

Protected API routes must identify the user through the session.

Required behavior:

valid session
→ authenticated user

missing session
→ 401

invalid/expired/revoked session
→ 401

valid user but wrong required role
→ 403

Logout must revoke the current session.

A revoked session must stop working immediately on subsequent requests.

Do not require logout from all devices.

Do not build session/device management UI yet.

---

## 7. Application Access

Implement the minimum authenticated shell required for each application.

Do NOT build actual product dashboards/features.

### Customer Mobile

Required:

- phone input
- request OTP
- OTP input
- verify
- authenticated placeholder/home shell
- logout
- restore authenticated state after app restart where practical

First successful login may create CUSTOMER account automatically.

### Merchant Mobile

Required:

- same THIGO visual language
- phone + OTP
- role validation
- authenticated Merchant shell
- logout

Do not implement:

store setup
catalog
orders
analytics

### Driver Mobile

Required:

- phone + OTP
- role validation
- authenticated Driver shell
- logout

Do not implement:

online/offline
jobs
delivery
location tracking

### Admin Web

Required:

- phone + OTP login
- ADMIN role validation
- protected authenticated Admin shell
- logout
- unauthorized redirect/login behavior

Do not implement admin dashboard functionality.

---

## 8. Client Session Storage

Use platform-appropriate secure storage.

Mobile:

Use an Expo-compatible secure persistence mechanism appropriate for authentication secrets.

Do not store the session token in AsyncStorage if a secure storage facility is available.

Web:

Do not persist sensitive session secrets in ordinary localStorage unless there is no safer practical implementation.

Prefer secure cookie/session handling compatible with the existing NestJS API boundary.

Do not turn Next.js into a second business backend.

Keep the flow understandable.

Document only non-obvious implementation decisions.

---

## 9. UI / UX

All authentication UI must obey:

`docs/UI_SYSTEM.md`

Use:

`@thigo/design-tokens`

Do not invent feature-local:

- colors
- radii
- spacing scales
- typography
- button styles
- card styles

The login experience should feel fast.

Target flow:

Open app
→ Phone
→ OTP
→ Enter application

Avoid:

- unnecessary welcome wizard
- multiple marketing screens
- password concepts
- giant forms
- decorative UI that delays authentication

Vietnamese copy should be concise and natural.

Examples of useful labels:

"Số điện thoại"

"Gửi mã OTP"

"Nhập mã xác thực"

"Đăng nhập"

"Gửi lại mã"

"Đăng xuất"

Do not expose technical auth terminology to normal users.

---

# P1 — Important Quality

Implement these if they naturally belong to the F01 implementation and do not expand scope substantially.

## Auth Error UX

Provide understandable states for:

- invalid phone
- invalid OTP
- expired OTP
- too many failed attempts
- resend cooldown
- unauthorized role
- network/API unavailable

Do not show raw backend stack traces or technical codes to users.

## Loading / Disabled States

Prevent accidental repeated:

- OTP requests
- OTP verification
- login submissions

Buttons should expose clear loading/disabled behavior.

## Session Expiry UX

If the existing session becomes invalid:

clear local authentication state

and return the user to login safely.

Do not leave apps stuck on a broken protected screen.

---

# P2 — Only If Cheap

Do not delay F01 for P2.

Potential P2 improvements:

- basic last-login timestamp
- development convenience script for creating privileged fixture users
- tiny diagnostics useful for local authentication testing

Do not create an admin user-management feature.

Do not create a generic fixture framework.

---

# Real Regression Fixtures

Create stable automated fixtures for the following scenarios.

Use synthetic test numbers only.

Suggested logical fixtures:

CUSTOMER_EXISTING
phone: +84910000001
roles: CUSTOMER

MERCHANT_AUTHORIZED
phone: +84910000002
roles: MERCHANT

DRIVER_AUTHORIZED
phone: +84910000003
roles: DRIVER

ADMIN_AUTHORIZED
phone: +84910000004
roles: ADMIN

UNKNOWN_USER
phone: +84910000005
roles: none / does not exist

TEST OTP:

000000

only under test/dev OTP provider.

Regression scenarios must prove:

1. New customer + valid OTP
   → customer created
   → session created
   → Customer App accessible.

2. Existing customer login
   → no duplicate user created.

3. Unknown phone attempting Merchant App
   → no MERCHANT role created
   → access denied.

4. Authorized Merchant
   → Merchant App accessible.

5. Authorized Driver
   → Driver App accessible.

6. Authorized Admin
   → Admin Web accessible.

7. CUSTOMER session calling Merchant-protected endpoint
   → 403.

8. Missing/invalid session
   → 401.

9. Wrong OTP
   → rejected.

10. Expired OTP
    → rejected.

11. Consumed OTP
    → cannot be reused.

12. Logout
    → session revoked
    → same token subsequently receives 401.

13. Phone normalization
    `0910000001`
    and
    `+84910000001`
    resolve to the same canonical identity.

Fixtures must not depend on real SMS.

---

# Must Never Happen

The following are F01 blockers:

- Frontend directly accesses Supabase/PostgreSQL.
- Password authentication is introduced.
- Email authentication is introduced.
- Public users can assign themselves MERCHANT, DRIVER, or ADMIN.
- Raw OTP or session tokens are logged in production paths.
- Raw session token is stored in PostgreSQL.
- Production silently uses test OTP.
- Controller accesses TypeORM repository/DataSource directly.
- Business logic is moved into controllers.
- Admin Web becomes a second backend.
- Auth logic is duplicated independently across all three mobile apps.
- Random new colors/components ignore UI_SYSTEM.md.
- F02+ functionality is implemented opportunistically.
- TypeORM `synchronize: true` is enabled.
- Existing architecture checks are disabled to make implementation pass.
- Tests are changed merely to hide a real regression.

---

# Architecture Constraints

Backend remains layer-first.

Expected conceptual dependency:

AuthController
↓
AuthService
↓
AuthRepository / UserRepository / SessionRepository
↓
TypeORM
↓
PostgreSQL

Use Nest modules only for dependency wiring.

Do not restructure API into:

domain/
application/
infrastructure/

Do not introduce:

CQRS
event sourcing
microservices
Kafka
RabbitMQ
Redis
generic BaseRepository
generic CrudService
large auth framework abstractions

Use the simplest implementation that cleanly fits the current architecture.

---

# Database Verification

F01 cannot be marked DONE based only on mocked repositories.

Run migrations against a real PostgreSQL database.

The database may be:

- local PostgreSQL
- Supabase-managed PostgreSQL

Application code must continue to depend only on standard PostgreSQL through `DATABASE_URL`.

Do not add direct Supabase business-data SDK calls.

Verification must include:

migration up
API boot
auth persistence
session persistence
database health

If no real PostgreSQL instance/credential is available:

report the exact blocker

and leave F01 as IN_PROGRESS or BLOCKED.

Do not falsely mark it DONE.

---

# API Verification

At minimum verify the real HTTP boundaries for:

request OTP
verify OTP
authenticated current-user/session endpoint
logout
one CUSTOMER-protected route/probe
one MERCHANT-protected route/probe
one DRIVER-protected route/probe
one ADMIN-protected route/probe

Do not create fake product APIs merely for authorization testing.

Small auth/access probe routes are acceptable if clearly scoped to F01 and removed/replaced when no longer useful.

Prefer testing real auth boundaries already required by the apps.

---

# Mobile Verification

Verify all three apps on Android using the existing Expo setup.

At minimum:

Customer:
phone → OTP → authenticated → restart/restore → logout

Merchant:
authorized account → login
unauthorized account → denied

Driver:
authorized account → login
unauthorized account → denied

Verify:

- no horizontal clipping
- keyboard does not make OTP/phone actions unusable
- primary CTA remains obvious
- loading state
- error state
- disabled state
- UI_SYSTEM tokens are used

Do not redesign unrelated placeholder screens.

Windows development does not require iOS simulator verification.

---

# Admin Browser Verification

Verify Admin Web in a real browser.

At minimum verify:

1366×768 desktop

and one narrower practical viewport.

Check:

- login layout
- phone input
- OTP input
- loading/error states
- protected route behavior
- logout
- no horizontal overflow
- visible focus states
- keyboard usability

Do not create a dashboard just to fill empty space.

---

# Automated Verification

Before completion run the repository's real checks.

Expected evidence should include:

- migration execution against PostgreSQL
- API lint
- API typecheck
- API tests
- API build
- mobile lint/typecheck/tests
- Admin lint/typecheck/build/tests
- architecture/import boundary checks
- root `pnpm check`

Do not claim PASS without executing the command.

If a command cannot run, report why.

---

# Adversarial Review

After implementation, perform an independent review of the final diff.

The reviewer must actively attempt to find:

- privilege escalation
- OTP bypass
- session reuse after logout
- role confusion between apps
- phone normalization duplicates
- frontend-auth-only protection
- secrets logged or persisted incorrectly
- direct DB access outside repositories
- accidental F02+ scope
- UI_SYSTEM violations
- missing error/loading states
- migration/repository inconsistencies

The review must inspect actual code and tests.

Do not simply repeat the implementer's report.

Fix valid P0 findings before completion.

---

# Roadmap Update

When implementation begins:

F01 = IN_PROGRESS

Only when every P0 requirement and final verification passes:

F01 = DONE
F02 = READY

Update:

`docs/FEATURE_ROADMAP.md`

Progress checkboxes under F01 should reflect actual completed work.

Do not mark work complete based on file existence alone.

If a required real-system verification is blocked:

F01 must not become DONE.

---

# Scope Exclusions

F01 does NOT include:

- merchant/store profile
- merchant approval workflow
- catalog
- products
- categories
- customer profile completion
- driver onboarding
- driver approval
- addresses
- maps
- PostGIS feature work
- order
- cart
- checkout
- payment
- delivery
- realtime/WebSocket
- push notifications
- SMS production provider
- social login
- password login
- advanced RBAC
- user-management Admin screens

Do not build these.

---

# Evidence-Based Completion Report

At completion return a concise report with exactly these sections:

## Outcome

State whether F01 is:

DONE

or:

BLOCKED / IN_PROGRESS

Do not soften the result.

## Implemented

Summarize the actual end-to-end behavior completed.

## Data

List migrations and actual tables introduced.

Do not dump full schemas.

## Auth Flow

Briefly state:

phone normalization
OTP behavior
session behavior
role enforcement

## UI

State which application surfaces were verified.

## Regression Fixtures

Report pass/fail for the required fixture scenarios.

## Verification

Include commands actually executed and their results.

## Adversarial Review

List meaningful findings and fixes.

## Roadmap

Confirm the resulting F01/F02 status.

## Remaining

Only genuine blockers or intentionally deferred scope.

Do not include speculative future architecture suggestions.

---

# Definition of Done

F01 is DONE only when a real user flow works as follows:

Customer Mobile

open
→ enter phone
→ receive/use development OTP
→ verify
→ account exists
→ authenticated session established
→ protected customer shell accessible
→ close/reopen app
→ authentication restored appropriately
→ logout
→ old session rejected

AND:

authorized Merchant can enter Merchant App

authorized Driver can enter Driver App

authorized Admin can enter Admin Web

AND:

wrong-role users are rejected by the backend

AND:

the entire flow persists through real PostgreSQL

AND:

all mandatory verification passes.

Anything less is not F01 DONE.
