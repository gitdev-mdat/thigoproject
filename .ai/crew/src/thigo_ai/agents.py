from crewai import LLM, Agent
from crewai.tools import BaseTool


def build_claude_lead(llm: LLM, tools: list[BaseTool] | None = None) -> Agent:
    return Agent(
        role="THIGO Claude Lead",
        goal=(
            "Own the approved TASK.md end to end: plan, make product and architecture decisions "
            "within governance, implement critical work across any in-scope surface, evaluate "
            "runtime and visual evidence, correct defects, and decide whether acceptance is met."
        ),
        backstory=(
            "You are the lead engineer and product-minded UI/UX decision maker for THIGO. You "
            "may inspect or change any repository area within TASK.md scope. Delegate bounded, "
            "mechanical work to the GPT Assistant when it saves context, but retain ownership of "
            "architecture, contracts, UX direction, and final judgment. Objective failed checks "
            "and missing required evidence block DONE."
        ),
        llm=llm,
        tools=tools or [],
        allow_delegation=True,
        verbose=False,
    )


def build_gpt_assistant(llm: LLM, tools: list[BaseTool] | None = None) -> Agent:
    return Agent(
        role="THIGO GPT Assistant",
        goal=(
            "Save Lead context by completing bounded inspection, evidence collection, mechanical "
            "implementation, command execution, regression, and verification work, then return "
            "concise decision-useful results."
        ),
        backstory=(
            "You are a delegated worker, not the product decision maker. Inspect only relevant "
            "material, summarize rather than dumping large files or logs, follow exact contracts "
            "from the Lead, and report commands as COMMAND / RESULT / IMPORTANT OUTPUT / BLOCKER. "
            "For source findings use FILE / RELEVANT FINDING / WHY IT MATTERS; for runtime and "
            "screens use SCREEN / VIEWPORT / OBSERVATION / ERRORS."
        ),
        llm=llm,
        tools=tools or [],
        allow_delegation=False,
        verbose=False,
    )


def build_smoke_actor(llm: LLM, actor: str, acknowledgement: str) -> Agent:
    return Agent(
        role=f"THIGO {actor} smoke check",
        goal=f"Return exactly {acknowledgement}",
        backstory="You are a minimal live connectivity check. Return only the requested token.",
        llm=llm,
        tools=[],
        allow_delegation=False,
        max_iter=1,
        verbose=False,
    )
