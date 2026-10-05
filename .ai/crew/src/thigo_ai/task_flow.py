from __future__ import annotations

import re
import subprocess
from datetime import UTC, datetime
from pathlib import Path

from crewai.flow.flow import Flow, listen, start
from pydantic import BaseModel, Field

from thigo_ai.agents import build_implementer, build_planner, build_reviewer
from thigo_ai.config import build_llm
from thigo_ai.flow import run_single_agent
from thigo_ai.repository import (
    deterministic_checks,
    repository_root,
    require_active_task,
    task_execution_evidence,
)
from thigo_ai.workspace_tools import implementation_tools, read_only_tools


class TaskExecutionState(BaseModel):
    dry_run: bool = False
    task: str = ""
    evidence: str = ""
    plan: str = ""
    implementation: str = ""
    review: str = ""
    verification: list[str] = Field(default_factory=list)
    report_path: str = ""


def run_command(root: Path, command: list[str], timeout_seconds: int) -> str:
    try:
        result = subprocess.run(
            command,
            cwd=root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return f"FAIL {' '.join(command)}: timed out after {timeout_seconds}s"
    status = "PASS" if result.returncode == 0 else "FAIL"
    output = (result.stdout + result.stderr).strip()
    tail = output[-2_000:] if output else "no output"
    return f"{status} {' '.join(command)}\n{tail}"


def deterministic_task_verification(root: Path) -> list[str]:
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
    return checks


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
        return self.state.evidence

    @listen(inspect)
    def plan(self, evidence: str) -> str:
        if self.state.dry_run:
            self.state.plan = (
                "ENTRYPOINT CHECK: active TASK.md and governance loaded; agent planning skipped."
            )
            return self.state.plan

        root = repository_root()
        self.state.plan = run_single_agent(
            build_planner(
                build_llm(),
                task_execution=True,
                tools=read_only_tools(root),
            ),
            "Inspect the repository with the supplied read-only tools, then create a bounded "
            "implementation plan for the active TASK.md. Map each change to the applicable "
            "AGENTS.md and architecture rule. Separate mandatory acceptance criteria from "
            "optional work and name concrete verification commands. Do not edit files.\n\n"
            f"{evidence}",
            "An ordered, file-aware implementation plan with acceptance and verification steps.",
        )
        return self.state.plan

    @listen(plan)
    def implement(self, plan: str) -> str:
        if self.state.dry_run:
            self.state.implementation = (
                "ENTRYPOINT CHECK: implementation skipped; repository source was not modified."
            )
            return self.state.implementation

        root = repository_root()
        self.state.implementation = run_single_agent(
            build_implementer(
                build_llm(),
                task_execution=True,
                tools=implementation_tools(root),
            ),
            "Implement the active TASK.md now using the repository tools. Inspect existing files "
            "before editing, preserve unrelated work, obey every scoped AGENTS.md, and keep "
            "changes within the approved feature. Do not edit TASK.md or secret environment "
            "files. Run practical checks as you work. Do not merely describe code: make the "
            "changes. If external infrastructure blocks a required result, complete safe local "
            "work and report the exact blocker without claiming DONE.\n\n"
            f"PLAN\n{plan}\n\nACTIVE TASK\n{self.state.task}",
            (
                "A concise implementation record listing actual files changed, tests run, "
                "and blockers."
            ),
        )
        return self.state.implementation

    @listen(implement)
    def review(self, implementation: str) -> str:
        if self.state.dry_run:
            self.state.review = (
                "ENTRYPOINT CHECK: review stage reached; no implementation claims were made."
            )
            return self.state.review

        root = repository_root()
        self.state.review = run_single_agent(
            build_reviewer(
                build_llm(),
                task_execution=True,
                tools=read_only_tools(root),
            ),
            "Independently inspect the actual repository files after implementation. Review them "
            "against TASK.md, architecture, roadmap scope, scoped AGENTS.md, security, data "
            "boundaries, UI_SYSTEM.md when relevant, and the implementer's claims. Do not edit "
            "files and do not merely restate the summary. Order findings by severity and state "
            "explicitly when no actionable finding is present.\n\n"
            f"IMPLEMENTER RECORD\n{implementation}\n\nACTIVE TASK\n{self.state.task}",
            "An independent evidence-based review with severity, file paths, and blockers.",
        )
        return self.state.review

    @listen(review)
    def verify(self, _review: str) -> list[str]:
        root = repository_root()
        if self.state.dry_run:
            self.state.verification = [
                "PASS entrypoint resolved repository root",
                "PASS active TASK.md loaded",
                "PASS Inspect -> Plan -> Implement -> Review -> Verify sequence reached",
            ]
        else:
            self.state.verification = deterministic_task_verification(root)
        return self.state.verification

    @listen(verify)
    def report(self, verification: list[str]) -> str:
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
            "## Plan\n\n"
            f"{self.state.plan}\n\n"
            "## Implementation\n\n"
            f"{self.state.implementation}\n\n"
            "## Independent review\n\n"
            f"{self.state.review}\n\n"
            "## Verification\n\n"
            + "\n\n".join(verification)
            + "\n"
        )
        report_path.write_text(redact_report_secrets(content), encoding="utf-8")
        self.state.report_path = str(report_path)
        return self.state.report_path


def run_task_execution(*, dry_run: bool = False) -> Path:
    flow = TaskExecutionFlow(initial_state=TaskExecutionState(dry_run=dry_run))
    result = flow.kickoff()
    return Path(str(result))

