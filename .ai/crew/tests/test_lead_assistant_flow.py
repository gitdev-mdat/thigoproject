from pathlib import Path
from unittest.mock import MagicMock, patch

from thigo_ai.agents import build_claude_lead, build_gpt_assistant
from thigo_ai.config import RouterRole
from thigo_ai.task_flow import (
    TaskExecutionFlow,
    TaskExecutionState,
    enforce_verification_outcome,
)


def test_gpt_context_preparation_runs_before_claude_planning(tmp_path: Path) -> None:
    flow = TaskExecutionFlow(initial_state=TaskExecutionState())
    order: list[str] = []

    with (
        patch("thigo_ai.task_flow.repository_root", return_value=tmp_path),
        patch("thigo_ai.task_flow.require_active_task", return_value="# Task"),
        patch("thigo_ai.task_flow.task_execution_evidence", return_value="evidence"),
        patch("thigo_ai.task_flow.build_llm"),
        patch("thigo_ai.task_flow.read_only_tools", return_value=[]),
        patch("thigo_ai.task_flow.build_gpt_assistant", return_value=MagicMock()),
        patch(
            "thigo_ai.task_flow.run_single_agent",
            side_effect=lambda *_args: order.append("gpt_context") or "context packet",
        ),
    ):
        context = flow.inspect()

    with (
        patch("thigo_ai.task_flow.repository_root", return_value=tmp_path),
        patch("thigo_ai.task_flow.build_llm"),
        patch("thigo_ai.task_flow.read_only_tools", return_value=[]),
        patch("thigo_ai.task_flow.build_claude_lead", return_value=MagicMock()),
        patch("thigo_ai.task_flow.build_gpt_assistant", return_value=MagicMock()),
        patch(
            "thigo_ai.task_flow.run_lead_with_assistant",
            side_effect=lambda *_args: order.append("claude_plan") or "lead plan",
        ),
    ):
        plan = flow.plan(context)

    assert order == ["gpt_context", "claude_plan"]
    assert plan == "lead plan"


def test_claude_is_lead_and_can_delegate_to_gpt() -> None:
    llm = MagicMock()
    with patch("thigo_ai.agents.Agent") as agent_class:
        agent_class.side_effect = [MagicMock(), MagicMock()]
        build_claude_lead(llm)
        build_gpt_assistant(llm)

    lead_arguments = agent_class.call_args_list[0].kwargs
    assistant_arguments = agent_class.call_args_list[1].kwargs
    assert lead_arguments["role"] == "THIGO Claude Lead"
    assert lead_arguments["allow_delegation"] is True
    assert assistant_arguments["role"] == "THIGO GPT Assistant"
    assert assistant_arguments["allow_delegation"] is False


def test_flow_requests_only_the_two_existing_routes() -> None:
    assert {RouterRole.LEAD, RouterRole.ASSISTANT} == set(RouterRole)


def test_missing_visual_evidence_blocks_runtime_pass() -> None:
    result = enforce_verification_outcome(
        "Verify Customer on an Android emulator and Admin in a browser.",
        "STATUS: PASS",
        ["PASS pnpm check"],
        visual_evidence=[],
    )

    assert result.startswith("STATUS: NOT VERIFIED")
    assert "Automated checks cannot imply runtime" in result


def test_objective_check_failure_cannot_be_overridden_by_lead() -> None:
    result = enforce_verification_outcome(
        "Run unit tests.",
        "STATUS: PASS",
        ["FAIL pnpm check\nType error"],
        visual_evidence=[],
    )

    assert result.startswith("STATUS: FAIL")
    assert "Type error" in result
