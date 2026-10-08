from __future__ import annotations

from dataclasses import dataclass

from crewai import Crew, Process, Task
from crewai.flow.flow import Flow, listen, start
from pydantic import BaseModel

from thigo_ai.agents import build_smoke_actor
from thigo_ai.config import ROLE_ROUTES, RouterRole, build_smoke_llm

CLAUDE_ACKNOWLEDGEMENT = "THIGO_CLAUDE_LEAD_OK"
GPT_ACKNOWLEDGEMENT = "THIGO_GPT_ASSISTANT_OK"


class SmokeError(RuntimeError):
    """A concise, safe-to-report live smoke failure."""


class SmokeState(BaseModel):
    claude_response: str = ""
    gpt_response: str = ""
    live_llm_calls: int = 0


@dataclass(frozen=True)
class SmokeResult:
    claude_ok: bool
    gpt_ok: bool
    plumbing_ok: bool
    live_llm_calls: int


def run_single_agent(agent, description: str, expected_output: str) -> str:
    result = Crew(
        agents=[agent],
        tasks=[Task(description=description, expected_output=expected_output, agent=agent)],
        process=Process.sequential,
        verbose=False,
    ).kickoff()
    return result.raw


def run_lead_with_assistant(
    lead,
    assistant,
    description: str,
    expected_output: str,
) -> str:
    result = Crew(
        agents=[lead, assistant],
        tasks=[Task(description=description, expected_output=expected_output, agent=lead)],
        process=Process.sequential,
        verbose=False,
    ).kickoff()
    return result.raw


def normalized_acknowledgement(response: str) -> str:
    return " ".join(response.strip().split())


def verify_acknowledgement(
    actor: str,
    route: str,
    response: str,
    expected: str,
) -> None:
    actual = normalized_acknowledgement(response)
    if actual != expected:
        displayed = actual[:120] if actual else "<empty>"
        raise SmokeError(
            f"{actor} [{route}] returned an unexpected response; "
            f"expected {expected!r}, received {displayed!r}"
        )


def invoke_smoke_actor(role: RouterRole, acknowledgement: str) -> str:
    route = ROLE_ROUTES[role]
    actor = "Claude Lead" if role == RouterRole.LEAD else "GPT Assistant"
    try:
        return run_single_agent(
            build_smoke_actor(build_smoke_llm(role), actor, acknowledgement),
            f"Return exactly: {acknowledgement}",
            acknowledgement,
        )
    except SmokeError:
        raise
    except Exception as error:
        raise SmokeError(
            f"{actor} [{route}] live route call failed: {type(error).__name__}: {error}"
        ) from error


class ArchitectureSmokeFlow(Flow[SmokeState]):
    @start()
    def claude_lead_ping(self) -> str:
        self.state.claude_response = invoke_smoke_actor(
            RouterRole.LEAD,
            CLAUDE_ACKNOWLEDGEMENT,
        )
        self.state.live_llm_calls += 1
        verify_acknowledgement(
            "Claude Lead",
            ROLE_ROUTES[RouterRole.LEAD],
            self.state.claude_response,
            CLAUDE_ACKNOWLEDGEMENT,
        )
        return self.state.claude_response

    @listen(claude_lead_ping)
    def gpt_assistant_ping(self, _claude_response: str) -> str:
        self.state.gpt_response = invoke_smoke_actor(
            RouterRole.ASSISTANT,
            GPT_ACKNOWLEDGEMENT,
        )
        self.state.live_llm_calls += 1
        verify_acknowledgement(
            "GPT Assistant",
            ROLE_ROUTES[RouterRole.ASSISTANT],
            self.state.gpt_response,
            GPT_ACKNOWLEDGEMENT,
        )
        return self.state.gpt_response

    @listen(gpt_assistant_ping)
    def verify(self, _gpt_response: str) -> str:
        if self.state.live_llm_calls != 2:
            raise SmokeError(
                f"Flow plumbing made {self.state.live_llm_calls} live calls; expected exactly 2"
            )
        return "THIGO_SMOKE_OK"


def run_architecture_smoke() -> SmokeResult:
    flow = ArchitectureSmokeFlow()
    result = flow.kickoff()
    plumbing_ok = str(result) == "THIGO_SMOKE_OK"
    if not plumbing_ok:
        raise SmokeError(f"Flow plumbing returned an unexpected result: {result!r}")
    return SmokeResult(
        claude_ok=True,
        gpt_ok=True,
        plumbing_ok=True,
        live_llm_calls=flow.state.live_llm_calls,
    )
