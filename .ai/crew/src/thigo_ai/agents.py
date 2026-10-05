from crewai import LLM, Agent
from crewai.tools import BaseTool


def build_planner(
    llm: LLM,
    *,
    task_execution: bool = False,
    tools: list[BaseTool] | None = None,
) -> Agent:
    if task_execution:
        return Agent(
            role="THIGO Engineering Planner",
            goal=(
                "Turn the active TASK.md and repository evidence into a bounded, ordered, "
                "testable implementation plan."
            ),
            backstory=(
                "You inspect before planning, obey THIGO architecture and scoped AGENTS.md, "
                "prevent future-feature leakage, and identify exact verification evidence."
            ),
            llm=llm,
            tools=tools or [],
            allow_delegation=False,
            verbose=False,
        )
    return Agent(
        role="Architecture Planner",
        goal=(
            "Turn repository evidence into a short, testable review plan covering "
            "architecture, active product scope, and applicable UI governance."
        ),
        backstory=(
            "You plan narrowly, respect THIGO's architecture and roadmap order, follow the "
            "active TASK.md when present, and never invent future features."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=False,
    )


def build_implementer(
    llm: LLM,
    *,
    task_execution: bool = False,
    tools: list[BaseTool] | None = None,
) -> Agent:
    if task_execution:
        return Agent(
            role="THIGO Implementer",
            goal=(
                "Implement the approved TASK.md completely within repository boundaries and "
                "produce truthful verification evidence."
            ),
            backstory=(
                "You make focused repository changes, preserve unrelated work, use the existing "
                "architecture, run practical checks, and report blockers rather than claiming "
                "unverified success."
            ),
            llm=llm,
            tools=tools or [],
            allow_delegation=False,
            verbose=False,
        )
    return Agent(
        role="Architecture Report Implementer",
        goal="Draft a concise compliance report from supplied read-only evidence.",
        backstory="You implement report content only and have no source-code write tools.",
        llm=llm,
        allow_delegation=False,
        verbose=False,
    )


def build_reviewer(
    llm: LLM,
    *,
    task_execution: bool = False,
    tools: list[BaseTool] | None = None,
) -> Agent:
    if task_execution:
        return Agent(
            role="Independent THIGO Reviewer",
            goal=(
                "Review the actual implementation against TASK.md, architecture, scoped "
                "governance, tests, and claimed evidence."
            ),
            backstory=(
                "You inspect independently, prioritize correctness and boundary violations, "
                "challenge unsupported claims, and clearly separate blockers from optional work."
            ),
            llm=llm,
            tools=tools or [],
            allow_delegation=False,
            verbose=False,
        )
    return Agent(
        role="Independent Architecture Reviewer",
        goal=(
            "Challenge the draft against architecture, roadmap and task scope, applicable UI "
            "rules, and repository evidence; identify unsupported claims."
        ),
        backstory=(
            "You review independently, prioritize architecture and scope violations, apply the "
            "UI system when UI changes, and demand verification evidence."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=False,
    )
