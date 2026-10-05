# Mobile Rules

These rules apply equally to Customer, Merchant, and Driver. Keep their folder philosophy and tooling aligned.

- `src/screens` or future Expo Router `app`: composition and navigation only.
- `src/components`: UI rendering.
- `src/services`: NestJS API interaction.
- `src/stores`: client state only.
- `src/hooks`: reusable application/UI orchestration.
- `src/types` and `src/utils`: app-local types and focused helpers.

Mobile code is not the business authority. Do not access PostgreSQL/Supabase business data directly and do not duplicate backend validation as authoritative business logic. Use an existing pattern consistently across all three apps before introducing a new abstraction. Shared UI is extracted only after genuine duplication proves a stable interface.

Before UI work, read `docs/UI_SYSTEM.md`, use semantic values from `@thigo/design-tokens`, and inspect the target app's nearby screens and components. Keep Customer, Merchant, and Driver compositions appropriate to their roles while preserving the shared design language. Verify on representative iOS and Android sizes, including Vietnamese text scaling, safe areas, keyboard behavior, touch targets, loading/empty/error/disabled states, and reduced motion where relevant. Do not add a speculative shared component library.
