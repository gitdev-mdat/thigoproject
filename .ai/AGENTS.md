# AI Tooling Rules

AI tooling is development infrastructure and must remain isolated from the TypeScript product runtime.

For every change: understand the request, inspect the repository, read applicable `AGENTS.md`, identify the current feature in `docs/FEATURE_ROADMAP.md`, read a root `TASK.md` when present, inspect the existing implementation, plan, implement, test, review the diff, verify architecture and scope, and report evidence. For UI changes, also read `docs/UI_SYSTEM.md`, inspect nearby visual patterns, use `@thigo/design-tokens`, and include the visual review checklist in verification.

Do not redesign architecture silently, introduce frameworks casually, change infrastructure direction because it seems preferable, create abstractions without real usage, invent requirements, modify unrelated areas, expose secrets, or claim success without verification. Use the centralized 9Router configuration module; never hardcode credentials or provider selection in agents.

If a request conflicts with `ARCHITECTURE.md`, stop, explain the conflict, and request owner approval. Smoke workflows must not edit product source and may write only generated output under `.ai/reports`.

Planner and reviewer roles must challenge future-feature leakage, unsupported roadmap status changes, divergence from the active `TASK.md`, and architecture violations. When UI files change, they must also challenge local token exceptions, inconsistent nearby patterns, unverified viewport/device behavior, and violations of `docs/UI_SYSTEM.md`. Do not add an agent merely to enforce these checks; extend the existing workflow roles.
