# THIGO AI Crew

This isolated Python project runs development-only CrewAI Flows. It is not imported by, deployed with, or required by any THIGO product application.

THIGO uses exactly two existing 9Router combos:

| Actor         | 9Router combo     | Responsibility                                                                                                                                                           |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Claude Lead   | `thigo-implement` | Plans, makes in-scope architecture/product/UX decisions, implements critical work across any surface, evaluates evidence, corrects defects, and owns the final judgment. |
| GPT Assistant | `thigo-reviewer`  | Compresses context and performs bounded delegated inspection, mechanical implementation, commands, tests, runtime evidence collection, and adversarial checks.           |

9Router owns each combo's provider/model selection and internal fallback order. Repository code depends only on these two combo names. No other route is required or silently substituted.

## Active task Flow

From this directory, `crewai run` loads the repository-root `TASK.md` and runs:

```text
Inspect
  GPT prepares a compact context packet
Plan
  Claude Lead owns the plan and may delegate bounded inspection
Implement
  Claude implements; GPT performs only explicitly delegated bounded work
Review
  GPT gathers tests/runtime/screenshots/adversarial findings
  Claude evaluates evidence and may make one bounded correction pass
Verify
  deterministic checks run
  GPT prepares concise final evidence
  Claude makes the final judgment
Report
  the Flow writes the recorded evidence deterministically
```

The Lead remains free to inspect and change any repository area inside the approved `TASK.md`. Delegation is a context-saving mechanism, not a boundary on Claude's scope and not a transfer of product-decision authority.

GPT context packets use compact headings: TASK SUMMARY, CURRENT IMPLEMENTATION, CONSTRAINTS, RELEVANT FILES, RISKS, and OPEN QUESTIONS. Command output is summarized as COMMAND / RESULT / IMPORTANT OUTPUT / BLOCKER instead of forwarding large logs.

When `TASK.md` requires browser, device, viewport, screenshot, or runtime verification, lint/typecheck/build/unit tests cannot establish runtime or visual PASS. GPT should gather the evidence when available tooling supports it; Claude performs the product and visual judgment. If inspectable evidence does not reach Claude, the Flow enforces `NOT VERIFIED`.

## Local 9Router setup

1. Ensure local 9Router is running with the existing `thigo-implement` and `thigo-reviewer` combos.
2. Copy `.env.example` to `.env`.
3. Set only `NINEROUTER_API_KEY`.
4. Run `pnpm ai:doctor` from the repository root.
5. Run `pnpm ai:smoke`.

The base URL defaults to `http://localhost:20128/v1`; `NINEROUTER_BASE_URL` is an optional portability override. Doctor, smoke, and active execution validate only the two required combo IDs through `/models`. Missing either combo is a hard configuration error.

## Commands

```powershell
cd C:\WorkspaceThigo\.ai\crew
crewai run
```

`THIGO_CREW_DRY_RUN=1` is reserved for entrypoint verification. It executes the high-level Flow without contacting an LLM, editing product source, or running the full verification suite.

Command responsibilities are intentionally separate:

- `pnpm ai:doctor` validates local configuration and confirms that both required 9Router combos are advertised. It makes no LLM completion calls.
- `pnpm ai:smoke` makes exactly two tiny live calls: one fixed acknowledgement from the Claude Lead route, then one from the GPT Assistant route. It loads no `TASK.md`, repository context, product tools, implementation workflow, or report writer.
- `crewai run` executes the full active-task Flow, including task context, implementation, review, verification, and reporting.

The smoke uses no tools or delegation, limits each response to 32 tokens, verifies both acknowledgements deterministically, and exits without writing a report.
