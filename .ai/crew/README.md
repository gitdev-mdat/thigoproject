# THIGO AI Crew

This isolated Python project runs development-only CrewAI Flows. It is not imported by, deployed with, or required by any THIGO product application.

The architecture smoke Flow deterministically sequences Inspect, Plan, Implement, Review, Verify, and Report. In this smoke workflow, “Implement” means drafting the compliance report; no agent receives a product-code write tool. Only the final report writer may write under `.ai/reports`.

The active development Flow is separate. From this directory, `crewai run` loads the repository-root `TASK.md`, applicable governance, and the repository tree, then runs Inspect → Plan → Implement → Review → Verify → Report. The same Planner, Implementer, and Reviewer roles are used; only the Implementer receives bounded repository write and command tools. If `TASK.md` is missing, the command stops before contacting 9Router.

## Local 9Router setup

1. Ensure local 9Router is running.
2. Copy `.env.example` to `.env`.
3. Set only `NINEROUTER_API_KEY`.
4. Run `pnpm ai:doctor` from the repository root.
5. Run `pnpm ai:smoke`.

The base URL defaults to `http://localhost:20128/v1`; `NINEROUTER_BASE_URL` is an optional portability override. CrewAI technically requires a `model` field, so the centralized configuration discovers `/models`, prefers a 9Router combo, and otherwise uses the first advertised LLM target. Provider and upstream-model choices stay in 9Router and never appear in agent definitions or environment configuration.

## Active task execution

```powershell
cd C:\WorkspaceThigo\.ai\crew
crewai run
```

`THIGO_CREW_DRY_RUN=1` is reserved for entrypoint verification. It executes the real Flow stages without contacting an LLM, editing product source, or running the full verification suite.
