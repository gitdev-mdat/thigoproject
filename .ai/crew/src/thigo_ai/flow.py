from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from crewai import Crew, Process, Task
from crewai.flow.flow import Flow, listen, start
from pydantic import BaseModel, Field

from thigo_ai.agents import build_implementer, build_planner, build_reviewer
from thigo_ai.config import build_llm
from thigo_ai.repository import architecture_evidence, deterministic_checks, repository_root


class SmokeState(BaseModel):
    evidence: str = ""
    plan: str = ""
    draft: str = ""
    review: str = ""
    verification: list[str] = Field(default_factory=list)
    report_path: str = ""


def run_single_agent(agent, description: str, expected_output: str) -> str:
    result = Crew(
        agents=[agent],
        tasks=[Task(description=description, expected_output=expected_output, agent=agent)],
        process=Process.sequential,
        verbose=False,
    ).kickoff()
    return result.raw


class ArchitectureSmokeFlow(Flow[SmokeState]):
    @start()
    def inspect(self) -> str:
        self.state.evidence = architecture_evidence(repository_root())
        return self.state.evidence

    @listen(inspect)
    def plan(self, evidence: str) -> str:
        self.state.plan = run_single_agent(
            build_planner(build_llm()),
            "Create a maximum six-item review plan for this THIGO repository evidence. "
            "Check application boundaries, backend layer direction, AI isolation, roadmap "
            "scope, and TASK.md compliance when present. When UI work is in scope, include "
            "UI_SYSTEM.md, semantic tokens, nearby pattern consistency, and viewport/device "
            "verification.\n\n"
            f"{evidence}",
            "A concise numbered architecture review plan with evidence targets.",
        )
        return self.state.plan

    @listen(plan)
    def implement(self, plan: str) -> str:
        self.state.draft = run_single_agent(
            build_implementer(build_llm()),
            "Draft a concise architecture-compliance report. Do not claim checks not present "
            "in the evidence and do not propose product features. This is report implementation "
            "only; do not "
            f"edit source.\n\nPLAN\n{plan}\n\nEVIDENCE\n{self.state.evidence}",
            "A markdown report draft with compliant items, risks, and evidence paths.",
        )
        return self.state.draft

    @listen(implement)
    def review(self, draft: str) -> str:
        self.state.review = run_single_agent(
            build_reviewer(build_llm()),
            "Independently review the draft against the repository evidence. Flag unsupported "
            "claims, architecture violations, future-feature leakage, and divergence from the "
            "active TASK.md when present. When UI work is in scope, also check UI_SYSTEM.md, "
            "semantic token use, nearby pattern consistency, and viewport/device evidence. Say "
            "explicitly when no findings are present.\n\n"
            f"DRAFT\n{draft}\n\nEVIDENCE\n{self.state.evidence}",
            "A concise independent review with findings ordered by severity.",
        )
        return self.state.review

    @listen(review)
    def verify(self, _review: str) -> list[str]:
        self.state.verification = deterministic_checks(repository_root())
        return self.state.verification

    @listen(verify)
    def report(self, verification: list[str]) -> str:
        root = repository_root()
        report_directory = root / ".ai" / "reports"
        report_directory.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        report_path = report_directory / f"architecture-smoke-{timestamp}.md"
        content = (
            "# THIGO Architecture Smoke Report\n\n"
            f"Generated: {datetime.now(UTC).isoformat()}\n\n"
            "## Plan\n\n"
            f"{self.state.plan}\n\n"
            "## Draft\n\n"
            f"{self.state.draft}\n\n"
            "## Independent review\n\n"
            f"{self.state.review}\n\n"
            "## Deterministic verification\n\n"
            + "\n".join(f"- {item}" for item in verification)
            + "\n"
        )
        report_path.write_text(content, encoding="utf-8")
        self.state.report_path = str(report_path)
        return self.state.report_path


def run_architecture_smoke() -> Path:
    result = ArchitectureSmokeFlow().kickoff()
    return Path(str(result))
