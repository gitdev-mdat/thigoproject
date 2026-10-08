from __future__ import annotations

import re
import subprocess
from datetime import UTC, datetime
from pathlib import Path

from crewai.flow.flow import Flow, listen, start
from pydantic import BaseModel, Field

from thigo_ai.agents import build_claude_lead, build_gpt_assistant
from thigo_ai.command_resolution import CommandResolutionError, resolve_command_argv
from thigo_ai.config import RouterRole, build_llm
from thigo_ai.flow import run_lead_with_assistant, run_single_agent
from thigo_ai.repository import (
    deterministic_checks,
    repository_root,
    require_active_task,
    task_execution_evidence,
)
from thigo_ai.workspace_tools import (
    implementation_tools,
    read_only_tools,
    verification_tools,
)


class TaskExecutionState(BaseModel):
    dry_run: bool = False
    task: str = ""
    evidence: str = ""
    context_packet: str = ""
    plan: str = ""
    implementation: str = ""
    assistant_evidence: str = ""
    lead_review: str = ""
    verification: list[str] = Field(default_factory=list)
    final_evidence: str = ""
    visual_evidence: list[str] = Field(default_factory=list)
    final_assessment: str = ""
    report_path: str = ""


def run_command(root: Path, command: list[str], timeout_seconds: int) -> str:
    display_command = " ".join(command)
    try:
        resolved_command = resolve_command_argv(command)
        result = subprocess.run(
            resolved_command,
            cwd=root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_seconds,
            check=False,
        )
    except CommandResolutionError as error:
        return f"FAIL {display_command}: {error}"
    except FileNotFoundError:
        return f"FAIL {display_command}: Command executable not found: {command[0]}"
    except subprocess.TimeoutExpired:
        return f"FAIL {display_command}: timed out after {timeout_seconds}s"
    status = "PASS" if result.returncode == 0 else "FAIL"
    output = (result.stdout + result.stderr).strip()
    tail = output[-2_000:] if output else "no output"
    return f"{status} {display_command}\n{tail}"


def runtime_verification_requirement(task: str) -> str | None:
    runtime_markers = (
        "android emulator",
        "browser",
        "device",
        "runtime verification",
        "screenshot",
        "viewport",
    )
    if any(marker in task.lower() for marker in runtime_markers):
        return (
            "NOT VERIFIED: TASK.md requires browser/device/runtime visual verification. "
            "Successful lint, typecheck, build, and unit tests are not sufficient evidence. "
            "The required runtime flow and visual evidence must be obtained."
        )
    return None


def deterministic_task_verification(root: Path, task: str) -> list[str]:
    checks = deterministic_checks(root)
    checks.extend(
        [
            run_command(root, ["pnpm", "check"], 180),
            run_command(
                root,
                ["uv", "run", "--directory", ".ai/crew", "ruff", "check", "."],
                60,
            ),
            run_command(
                root,
                ["uv", "run", "--directory", ".ai/crew", "pytest"],
                120,
            ),
        ]
    )
    runtime_requirement = runtime_verification_requirement(task)
    if runtime_requirement:
        checks.append(runtime_requirement)
    return checks


def enforce_verification_outcome(
    task: str,
    lead_assessment: str,
    checks: list[str],
    visual_evidence: list[str] | None = None,
) -> str:
    failed_checks = [check for check in checks if check.startswith("FAIL")]
    if failed_checks:
        return (
            "STATUS: FAIL\n\n"
            "Objective deterministic checks failed and cannot be overridden by the Lead.\n\n"
            + "\n\n".join(failed_checks)
        )
    if runtime_verification_requirement(task) and not visual_evidence:
        return (
            "STATUS: NOT VERIFIED\n\n"
            "TASK.md requires real browser/device/runtime visual evidence, but no inspectable "
            "visual evidence reached the Claude Lead. Automated checks cannot imply runtime or "
            "visual PASS."
        )
    return lead_assessment


def redact_report_secrets(content: str) -> str:
    content = re.sub(r"sk-[A-Za-z0-9_-]{12,}", "[REDACTED_API_KEY]", content)
    return re.sub(
        r"(?m)(NINEROUTER_API_KEY\s*=\s*)\S+", r"\1[REDACTED]", content
    )


class TaskExecutionFlow(Flow[TaskExecutionState]):
    @start()
    def inspect(self) -> str:
        root = repository_root()
        self.state.task = require_active_task(root)
        self.state.evidence = task_execution_evidence(root)
        if self.state.dry_run:
            self.state.context_packet = (
                "ENTRYPOINT CHECK: active TASK.md and governance loaded; GPT context preparation "
                "skipped."
            )
            return self.state.context_packet

        self.state.context_packet = run_single_agent(
            build_gpt_assistant(
                build_llm(RouterRole.ASSISTANT), read_only_tools(root)
            ),
            "Inspect only repository material relevant to TASK.md and compress it for the Claude "
            "Lead. Use exactly these headings: TASK SUMMARY, CURRENT IMPLEMENTATION, CONSTRAINTS, "
            "RELEVANT FILES, RISKS, OPEN QUESTIONS. Include applicable AGENTS.md, architecture, "
            "UI_SYSTEM when relevant, roadmap state, likely affected files, current Git changes, "
            "and known runtime/config state. Do not paste large files or duplicate TASK.md.\n\n"
            f"{self.state.evidence}",
            "A compact context packet under the six required headings.",
        )
        return self.state.context_packet

    @listen(inspect)
    def plan(self, context_packet: str) -> str:
        if self.state.dry_run:
            self.state.plan = (
                "ENTRYPOINT CHECK: Claude Lead planning skipped after GPT context stage."
            )
            return self.state.plan

        root = repository_root()
        self.state.plan = run_lead_with_assistant(
            build_claude_lead(build_llm(RouterRole.LEAD), read_only_tools(root)),
            build_gpt_assistant(
                build_llm(RouterRole.ASSISTANT), read_only_tools(root)
            ),
            "As Claude Lead, own the implementation plan for TASK.md. Use the compact GPT context "
            "packet, inspect additional files whenever necessary, and retain architecture, API, "
            "data, and UX decisions. Identify what you will implement directly and any bounded "
            "mechanical work you may delegate to the GPT Assistant. Map changes to governance, "
            "keep scope tight, and name verification and runtime evidence requirements. Do not "
            "rewrite TASK.md.\n\n"
            f"ACTIVE TASK\n{self.state.task}\n\nCONTEXT PACKET\n{context_packet}",
            "A Claude-owned plan with implementation order, bounded delegations, and verification.",
        )
        return self.state.plan

    @listen(plan)
    def implement(self, plan: str) -> str:
        if self.state.dry_run:
            self.state.implementation = (
                "ENTRYPOINT CHECK: Lead/Assistant implementation skipped; source was not modified."
            )
            return self.state.implementation

        root = repository_root()
        tools = implementation_tools(root)
        self.state.implementation = run_lead_with_assistant(
            build_claude_lead(build_llm(RouterRole.LEAD), tools),
            build_gpt_assistant(build_llm(RouterRole.ASSISTANT), tools),
            "As Claude Lead, implement the approved TASK.md across any in-scope repository "
            "surface. You own critical implementation, architecture, contracts, and UX. Delegate "
            "only explicit bounded inspection, verification, or mechanical code changes to the "
            "GPT Assistant. Inspect before editing, preserve unrelated work, obey scoped "
            "AGENTS.md, and never edit TASK.md or secret files. Run practical checks and report "
            "external blockers without claiming DONE.\n\n"
            f"PLAN\n{plan}\n\nACTIVE TASK\n{self.state.task}",
            (
                "A concise Lead-owned implementation record with files changed, delegated work, "
                "checks, runtime/visual evidence attempted, and blockers."
            ),
        )
        return self.state.implementation

    @listen(implement)
    def review(self, implementation: str) -> str:
        if self.state.dry_run:
            self.state.assistant_evidence = (
                "ENTRYPOINT CHECK: GPT evidence collection skipped."
            )
            self.state.lead_review = (
                "ENTRYPOINT CHECK: Claude Lead review stage reached; no claims evaluated."
            )
            return self.state.lead_review

        root = repository_root()
        self.state.assistant_evidence = run_single_agent(
            build_gpt_assistant(
                build_llm(RouterRole.ASSISTANT), verification_tools(root)
            ),
            "Gather concise objective evidence after implementation. Inspect the diff, run "
            "relevant tests/checks, identify regressions and security/authorization failures, "
            "and gather browser/device/screenshots when TASK.md requires them and available tools "
            "support them. Never infer runtime success from build output. Summarize commands as "
            "COMMAND / RESULT / IMPORTANT OUTPUT / BLOCKER and visual evidence as SCREEN / "
            "VIEWPORT / OBSERVATION / ERRORS. Do not make product decisions or edit files.\n\n"
            f"IMPLEMENTATION RECORD\n{implementation}\n\nACTIVE TASK\n{self.state.task}",
            "A compact evidence packet with objective failures, runtime evidence, and blockers.",
        )

        tools = implementation_tools(root)
        self.state.lead_review = run_lead_with_assistant(
            build_claude_lead(build_llm(RouterRole.LEAD), tools),
            build_gpt_assistant(build_llm(RouterRole.ASSISTANT), tools),
            "As Claude Lead, evaluate the GPT Assistant's objective evidence and the actual "
            "repository. Judge product, architecture, correctness, and UI/UX quality. Do not "
            "declare visual PASS without real evidence and do not override objective failures. "
            "When concrete defects exist, make one bounded correction pass now, delegating only "
            "mechanical work. Avoid repeated opinion-only iteration.\n\n"
            f"IMPLEMENTATION\n{implementation}\n\n"
            f"ASSISTANT EVIDENCE\n{self.state.assistant_evidence}\n\n"
            f"ACTIVE TASK\n{self.state.task}",
            (
                "The Lead's review judgment, one correction record when needed, and remaining "
                "blockers."
            ),
        )
        return self.state.lead_review

    @listen(review)
    def verify(self, _review: str) -> str:
        root = repository_root()
        if self.state.dry_run:
            self.state.verification = [
                "PASS entrypoint resolved repository root",
                "PASS active TASK.md loaded",
                "PASS GPT context -> Claude plan -> Lead/Assistant implementation reached",
                "PASS Review -> Verify sequence reached",
            ]
            self.state.final_assessment = (
                "ENTRYPOINT CHECK: final Lead verification reached; acceptance was not evaluated."
            )
            return self.state.final_assessment

        self.state.verification = deterministic_task_verification(root, self.state.task)
        checks = "\n\n".join(self.state.verification)
        self.state.final_evidence = run_single_agent(
            build_gpt_assistant(
                build_llm(RouterRole.ASSISTANT), verification_tools(root)
            ),
            "Prepare the final concise verification packet after the Lead's correction pass. "
            "Re-check relevant objective failures and required runtime flows. Do not dump raw "
            "logs, "
            "make product decisions, or treat build success as runtime success.\n\n"
            f"PRIOR EVIDENCE\n{self.state.assistant_evidence}\n\n"
            f"LEAD REVIEW/CORRECTION\n{self.state.lead_review}\n\n"
            f"FLOW CHECKS\n{checks}\n\nACTIVE TASK\n{self.state.task}",
            "A compact final evidence packet with PASS, FAIL, BLOCKED, or NOT VERIFIED facts.",
        )
        lead_assessment = run_lead_with_assistant(
            build_claude_lead(build_llm(RouterRole.LEAD), read_only_tools(root)),
            build_gpt_assistant(
                build_llm(RouterRole.ASSISTANT), verification_tools(root)
            ),
            "As Claude Lead, make the final acceptance judgment from implementation, reviews, "
            "deterministic checks, runtime evidence, and TASK.md. Objective failed checks block "
            "DONE. Missing required visual/runtime evidence means NOT VERIFIED. Do not edit files "
            "during final verification.\n\n"
            f"IMPLEMENTATION\n{self.state.implementation}\n\n"
            f"LEAD REVIEW\n{self.state.lead_review}\n\n"
            f"FINAL GPT EVIDENCE\n{self.state.final_evidence}\n\n"
            f"DETERMINISTIC CHECKS\n{checks}\n\nACTIVE TASK\n{self.state.task}",
            "A Lead-owned STATUS: PASS, FAIL, BLOCKED, or NOT VERIFIED final assessment.",
        )
        self.state.final_assessment = enforce_verification_outcome(
            self.state.task,
            lead_assessment,
            self.state.verification,
            self.state.visual_evidence,
        )
        return self.state.final_assessment

    @listen(verify)
    def report(self, _assessment: str) -> str:
        root = repository_root()
        report_directory = root / ".ai" / "reports"
        report_directory.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        prefix = "entrypoint-check" if self.state.dry_run else "task-run"
        report_path = report_directory / f"{prefix}-{timestamp}.md"
        content = (
            "# THIGO Task Execution Report\n\n"
            f"Generated: {datetime.now(UTC).isoformat()}\n\n"
            f"Mode: {'ENTRYPOINT CHECK' if self.state.dry_run else 'ACTIVE TASK EXECUTION'}\n\n"
            "## GPT context packet\n\n"
            f"{self.state.context_packet}\n\n"
            "## Claude Lead plan\n\n"
            f"{self.state.plan}\n\n"
            "## Lead/Assistant implementation\n\n"
            f"{self.state.implementation}\n\n"
            "## GPT evidence\n\n"
            f"{self.state.assistant_evidence}\n\n"
            "## Claude Lead review and correction\n\n"
            f"{self.state.lead_review}\n\n"
            "## Deterministic verification\n\n"
            + "\n\n".join(self.state.verification)
            + "\n\n## Final GPT evidence\n\n"
            f"{self.state.final_evidence}\n\n"
            "## Claude Lead final assessment\n\n"
            f"{self.state.final_assessment}\n"
        )
        report_path.write_text(redact_report_secrets(content), encoding="utf-8")
        self.state.report_path = str(report_path)
        return self.state.report_path


def run_task_execution(
    *,
    dry_run: bool = False,
    visual_evidence: list[str] | None = None,
) -> Path:
    flow = TaskExecutionFlow(
        initial_state=TaskExecutionState(
            dry_run=dry_run,
            visual_evidence=visual_evidence or [],
        )
    )
    result = flow.kickoff()
    return Path(str(result))
