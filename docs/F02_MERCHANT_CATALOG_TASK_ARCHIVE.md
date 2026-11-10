# THIGO — F02 Merchant & Catalog

Status: READY

## PRIMARY OUTCOME

Build the first real THIGO commerce experience:

A Merchant can sign in, manage one real storefront and its catalog,
and a Customer can discover that storefront and browse its menu through a polished mobile experience.

This task must also remove the current prototype-quality entry/authenticated shells.

The result should feel like the beginning of a real consumer product,
not an engineering authentication demo.

Do not split this task into F02.1 / F02.2 / F02.3 unless a genuine blocker makes that unavoidable.

---

# CURRENT STATE

F00 Architecture & Data Foundation: DONE

F01 Identity & Access: DONE

Authentication already exists and is verified for:

- CUSTOMER
- MERCHANT
- DRIVER
- ADMIN

Local development:

- OTP_PROVIDER=test
- development OTP = 000000
- PostgreSQL is the real persistence layer
- NestJS owns authentication
- frontend never accesses Supabase/PostgreSQL directly

The existing auth screens are functionally correct but visually unfinished.

Examples of current problems:

- large empty white areas
- weak visual hierarchy
- login feels like an internal debug form
- authenticated shell is only "Xin chào" + phone + logout
- no clear THIGO identity
- no useful transition from login into the product
- spacing and composition do not feel designed for mobile
- screen does not communicate what the app is for

F02 must not preserve this prototype feeling.

---

# REQUIRED REPO AUDIT

Before implementation, inspect only what is needed to execute this task correctly.

Read:

- AGENTS.md
- ARCHITECTURE.md
- docs/UI_SYSTEM.md
- docs/FEATURE_ROADMAP.md
- apps/api/AGENTS.md
- apps/mobile/AGENTS.md
- apps/admin-web/AGENTS.md

Inspect:

- current Customer auth flow
- current Merchant auth flow
- current Driver auth flow only for UI consistency
- current Admin auth flow only for UI consistency
- shared design tokens
- shared auth client
- existing User / Role entities
- current TypeORM migration conventions
- current mobile navigation structure
- existing test conventions

Do not perform a broad architectural rewrite.

Report important findings before making major structural changes.

---

# P0 — PRODUCT EXPERIENCE BASELINE

Before building catalog features, fix the app entry experience.

## 1. Mobile auth visual system

Refine Customer, Merchant and Driver authentication screens into one coherent THIGO family.

They should share:

- THIGO visual identity
- typography hierarchy
- spacing rhythm
- input treatment
- OTP input treatment
- buttons
- feedback states
- loading states
- error states

But each app should still communicate its role.

Customer:
consumer-friendly and welcoming.

Merchant:
professional, operational, business-oriented.

Driver:
direct, low-cognitive-load and action-oriented.

Do not simply make three identical white forms with different headings.

---

## 2. Login composition

The initial screen should have a deliberate composition.

Example hierarchy:

THIGO identity / compact brand area

Primary message

Short role-specific explanation

Phone input

Primary CTA

Useful support/helper information only when needed

Do not use excessive illustration or decorative clutter.

Do not waste half of the viewport with empty space.

The primary interaction must remain visible on common phone sizes.

---

## 3. OTP experience

After requesting OTP:

- clearly show which phone number is being verified
- six-digit OTP entry should be easy to scan
- resend countdown should be understandable
- changing phone number should be easy
- loading/error states must not shift the whole layout badly
- keyboard must not cover the important CTA
- use Vietnamese text with correct UTF-8 encoding

Do not expose development OTP in production UI.

---

## 4. Authenticated shell

Replace the current prototype:

"Xin chào"
"You are logged in"
phone
logout

with an actual role-specific landing shell.

For F02:

### Customer

After login, enter a real Customer Home surface.

It may initially contain:

- greeting/header
- location placeholder if location is not implemented yet
- storefront discovery area
- empty/loading states
- catalog content once available

Do not fake location functionality.

### Merchant

After login, enter Merchant Home.

It should clearly provide access to:

- storefront
- catalog
- categories
- products

Merchant should immediately understand the next useful action.

### Driver

F02 does not implement delivery.

Still replace the debug-looking authenticated screen with a minimal polished Driver shell.

It may communicate that no delivery work exists yet.

Do not invent fake delivery jobs.

### Admin

Keep Admin functional and visually aligned with UI_SYSTEM.

Do not build a new admin dashboard unless required for F02 visibility.

---

# P1 — MERCHANT STOREFRONT

## 5. Store model

Implement the minimum real storefront required for F02.

A Merchant owns/manages a storefront.

Support at minimum:

- store id
- merchant ownership
- store name
- short description
- image/logo or cover where architecture allows
- basic active/inactive state
- created/updated timestamps

Do not implement geo/service-area logic in F02.

That belongs to F03.

Do not invent fake address/location behavior just to make the UI look complete.

---

## 6. Merchant first-use flow

A newly authorized Merchant without a storefront should not see an empty dashboard.

Provide a clear setup path.

Example:

"Thiết lập cửa hàng"

Merchant enters the minimum information needed to create the store.

After creation, they arrive at Merchant Home / Catalog.

Avoid a large onboarding wizard.

Keep setup short.

---

# P1 — CATALOG

## 7. Categories

Merchant can:

- create category
- rename category
- reorder if reasonably supported without over-engineering
- enable/disable category
- delete category safely when appropriate

Examples:

Đồ ăn
Đồ uống
Món thêm

Do not hardcode these categories.

---

## 8. Products

Merchant can create and edit a product with at minimum:

- product name
- category
- price
- description optional
- image optional
- available / unavailable state

Price must use an appropriate integer monetary representation.

Do not introduce floating-point money handling.

Avoid excessive product attributes/options in F02.

No topping engine.
No complex variants.
No inventory system.
No discount engine.

Those can evolve later.

---

## 9. Product image

Support the smallest viable image workflow compatible with the existing architecture.

The implementation must have a clear ownership model.

Do not:

- put arbitrary base64 blobs into PostgreSQL
- introduce a large media-processing pipeline
- allow frontend direct database access

If object storage is used, keep storage concerns behind the intended backend contract.

Document the chosen approach.

---

# P2 — CUSTOMER CATALOG EXPERIENCE

## 10. Customer storefront discovery

Customer Home must be capable of showing real active storefronts from the backend.

For F02, discovery does NOT need geographic ranking.

A simple real list is acceptable.

Each store card should communicate enough to decide whether to open it.

Do not fabricate:

- distance
- delivery time
- rating
- number of reviews
- promotions

unless those values genuinely exist.

---

## 11. Store detail

Customer can open a storefront and see:

- store identity
- store description when present
- product categories
- available products
- product name
- price
- image where present
- availability state where relevant

Catalog must come from PostgreSQL through NestJS.

Do not use hardcoded mock menu data in the final verified path.

---

## 12. Catalog UX

The Customer store/menu screen should prioritize scanning.

Avoid:

- huge cards
- too much explanatory text
- repeated labels
- excessive borders
- generic dashboard-style UI

A user should be able to understand:

store → category → product → price

almost immediately.

---

# P2 — ADMIN VISIBILITY

Admin only needs enough F02 functionality to inspect:

- merchants
- storefronts
- categories/products where useful
- active/inactive status

Do not build a full merchant moderation system yet.

Do not expand F02 into an enterprise back office.

---

# API & BACKEND BOUNDARIES

Preserve:

Controller
→ Service
→ Repository
→ Database

Do not:

- access repositories directly from controllers
- let mobile apps access PostgreSQL/Supabase directly
- move business logic into controllers
- introduce microservices
- introduce Kafka/RabbitMQ
- introduce Redis without a real F02 requirement
- introduce PostGIS in F02

Create TypeORM migrations for schema changes.

`synchronize` must remain false.

---

# AUTHORIZATION

Merchant must only manage its own storefront/catalog.

Customer must not mutate merchant catalog.

Driver must not mutate catalog.

Admin visibility must follow the existing authorization model.

Do not build a generic RBAC framework.

Use the existing roles.

Add regression tests for authorization boundaries.

---

# REAL REGRESSION FIXTURES

Use deterministic development fixtures appropriate to the existing dev seed workflow.

Required scenario:

Merchant fixture
→ logs in
→ creates/owns storefront
→ creates categories
→ creates products

Customer fixture
→ logs in
→ sees the real storefront
→ opens it
→ sees the real catalog

Negative fixtures:

Customer cannot modify catalog.

Merchant A cannot modify Merchant B storefront/catalog.

Driver cannot modify storefront/catalog.

Unknown/unauthorized Merchant cannot create a storefront.

Fixtures must not create duplicate records on repeated runs.

Do not leave uncontrolled test garbage in the shared development database.

---

# UI QUALITY REQUIREMENTS

Follow docs/UI_SYSTEM.md and packages/design-tokens.

Do not invent arbitrary colors/radius/spacing when semantic tokens already exist.

Mobile touch targets must be comfortable.

Required states:

- loading
- empty
- error
- disabled
- success where meaningful

Screens must work at minimum around:

- 390 × 844
- common larger Android viewport

Admin must be checked at:

- 390 × 844
- 1366 × 768

No horizontal page overflow.

No content hidden behind keyboard.

No important CTA below an unnecessarily empty viewport.

---

# MOTION

Use motion only when it improves comprehension.

Allowed:

- subtle screen/section appearance
- press feedback
- lightweight list transitions
- loading skeleton/shimmer if already supported

Do not add:

- decorative animation everywhere
- looping attention effects
- excessive spring/bounce behavior

Respect reduced motion where the existing stack supports it.

---

# MUST NEVER HAPPEN

The completed task must never:

- break F01 authentication
- bypass NestJS and talk directly to Supabase from mobile
- enable `OTP_PROVIDER=test` in production
- hardcode fake storefront/menu data as the production path
- let Merchant A edit Merchant B data
- let Customer or Driver modify catalog
- create duplicate storefront ownership accidentally
- use floating-point arithmetic for stored prices
- introduce F03 location logic
- implement cart
- implement checkout
- create orders
- implement driver dispatch
- implement realtime order tracking
- introduce a large generic component framework
- redesign architecture
- mark runtime UI verification PASS without running it

---

# ACCEPTANCE CRITERIA

F02 is complete only when all of the following are observable.

## Entry UX

Customer / Merchant / Driver no longer open into prototype-style login/authenticated screens.

Authentication still works with the existing F01 implementation.

## Merchant

A real authorized Merchant can:

1. log in
2. create or open its storefront
3. create category
4. create product
5. set price
6. optionally attach supported image
7. mark product unavailable/available
8. edit product
9. see saved data after restart/reload

## Customer

A real Customer can:

1. log in
2. see active storefront
3. open storefront
4. browse categories
5. see real product data and prices

## Authorization

Cross-role and cross-merchant writes are rejected.

## Persistence

Restarting apps/API does not lose created storefront/catalog data.

---

# VERIFICATION

Do not infer UI/runtime success from:

- lint
- TypeScript
- unit tests
- build
- screenshots of static source code

Run:

pnpm check

Run relevant backend/integration tests.

Run relevant mobile tests.

Then perform real runtime verification.

Required real-device surfaces:

### Customer

Android Emulator

Verify:

login
→ Customer Home
→ storefront list
→ storefront detail
→ catalog

### Merchant

Android Emulator

Verify:

login
→ Merchant Home
→ storefront setup
→ category creation
→ product creation/edit
→ availability toggle

### Driver

Android Emulator

Verify:

login
→ polished Driver shell

No fake delivery functionality.

### Admin

Real browser

Verify F02 visibility required by this task.

If any required runtime path cannot actually be exercised:

report NOT VERIFIED.

Do not report PASS based only on automated tests.

---

# ADVERSARIAL REVIEW

Before declaring DONE, Reviewer must actively attempt to find:

- broken auth regression
- direct frontend-to-database access
- Merchant A modifying Merchant B
- Customer modifying catalog
- stale data after reload
- fake/hardcoded catalog shown instead of DB data
- duplicate seed/store/category/product behavior
- keyboard covering mobile actions
- overflow on small screens
- mojibake Vietnamese
- arbitrary styling outside the design system
- prototype/debug text leaking into production UI

Any confirmed P0/P1 defect blocks DONE.

---

# EVIDENCE-BASED COMPLETION

Final report must contain concrete evidence.

## IMPLEMENTATION

Important files/schema/API/UI changed.

## DATABASE

Migration names and resulting F02 tables/entities.

## AUTHORIZATION

What ownership boundaries were tested.

## CUSTOMER RUNTIME

PASS / FAIL / NOT VERIFIED

Include the actual tested flow.

## MERCHANT RUNTIME

PASS / FAIL / NOT VERIFIED

Include the actual tested flow.

## DRIVER RUNTIME

PASS / FAIL / NOT VERIFIED

## ADMIN RUNTIME

PASS / FAIL / NOT VERIFIED

## RESPONSIVE VERIFICATION

Viewport results.

## AUTOMATED CHECKS

Exact commands and results.

## DEFECTS FOUND

Only real defects discovered and fixed.

## ROADMAP

Only after all required P0/P1 acceptance criteria pass:

F02 = DONE

F03 = READY

Otherwise:

F02 = IN_PROGRESS or BLOCKED

with the exact reason.

---

# SCOPE CONTROL

The goal is not to build the entire THIGO marketplace.

The goal is one coherent vertical slice:

Merchant manages a real storefront/catalog
→ backend persists and protects it
→ Customer can browse it
→ the app now feels like an actual THIGO product.

Prefer completing this path extremely well over adding more features.
