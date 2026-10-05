# Admin Web Rules

The Next.js app is a thin admin UI, not a second backend.

- `src/app`: routes, layouts, and composition; keep route components reasonably thin.
- `src/components`: UI rendering local to the admin app.
- `src/services`: calls to the NestJS API.
- `src/stores`: client state only.
- `src/hooks`: reusable UI/application orchestration.
- `src/types`: admin-facing TypeScript types; server contracts should ultimately come through a generated public API client.

Never access PostgreSQL or Supabase business data directly. Do not place authoritative THIGO business rules in Next.js. Follow an existing pattern before adding an abstraction.

Before UI work, read `docs/UI_SYSTEM.md`, use semantic values from `@thigo/design-tokens`, and inspect nearby routes and components. Preserve admin-appropriate density, keyboard access, visible focus, bounded table overflow, and the shared design language. Verify representative desktop and narrow web viewports, Vietnamese text scaling, loading/empty/error/disabled states, and contrast. Do not add a speculative shared component library.
