from unittest.mock import MagicMock, call, patch

import pytest

from thigo_ai.config import ROLE_ROUTES, RouterRole
from thigo_ai.flow import (
    CLAUDE_ACKNOWLEDGEMENT,
    GPT_ACKNOWLEDGEMENT,
    SmokeError,
    run_architecture_smoke,
    verify_acknowledgement,
)
from thigo_ai.smoke import main


def test_smoke_stops_cleanly_before_flow_when_key_is_missing(capsys) -> None:
    with (
        patch(
            "thigo_ai.smoke.RouterSettings.from_environment",
            side_effect=ValueError("NINEROUTER_API_KEY is missing"),
        ),
        patch("thigo_ai.smoke.run_architecture_smoke") as run_flow,
        pytest.raises(SystemExit) as exit_error,
    ):
        main()

    assert exit_error.value.code == 1
    assert "FAIL - NINEROUTER_API_KEY is missing" in capsys.readouterr().err
    run_flow.assert_not_called()


def test_smoke_makes_exactly_one_live_call_per_route() -> None:
    with patch(
        "thigo_ai.flow.invoke_smoke_actor",
        side_effect=[CLAUDE_ACKNOWLEDGEMENT, GPT_ACKNOWLEDGEMENT],
    ) as invoke:
        result = run_architecture_smoke()

    assert invoke.call_args_list == [
        call(RouterRole.LEAD, CLAUDE_ACKNOWLEDGEMENT),
        call(RouterRole.ASSISTANT, GPT_ACKNOWLEDGEMENT),
    ]
    assert result.live_llm_calls == 2
    assert result.claude_ok and result.gpt_ok and result.plumbing_ok


def test_smoke_does_not_load_task_repository_context_or_product_tools() -> None:
    with (
        patch("thigo_ai.repository.require_active_task") as require_task,
        patch("thigo_ai.repository.architecture_evidence") as architecture_evidence,
        patch("thigo_ai.repository.task_execution_evidence") as task_evidence,
        patch("thigo_ai.workspace_tools.read_only_tools") as read_tools,
        patch("thigo_ai.workspace_tools.implementation_tools") as implementation_tools,
        patch(
            "thigo_ai.flow.invoke_smoke_actor",
            side_effect=[CLAUDE_ACKNOWLEDGEMENT, GPT_ACKNOWLEDGEMENT],
        ),
    ):
        run_architecture_smoke()

    require_task.assert_not_called()
    architecture_evidence.assert_not_called()
    task_evidence.assert_not_called()
    read_tools.assert_not_called()
    implementation_tools.assert_not_called()


def test_smoke_actor_has_no_tools_or_delegation() -> None:
    with patch("thigo_ai.agents.Agent") as agent_class:
        from thigo_ai.agents import build_smoke_actor

        build_smoke_actor(MagicMock(), "Claude Lead", CLAUDE_ACKNOWLEDGEMENT)

    arguments = agent_class.call_args.kwargs
    assert arguments["tools"] == []
    assert arguments["allow_delegation"] is False
    assert arguments["max_iter"] == 1


@pytest.mark.parametrize(
    ("actor", "role", "expected"),
    [
        ("Claude Lead", RouterRole.LEAD, CLAUDE_ACKNOWLEDGEMENT),
        ("GPT Assistant", RouterRole.ASSISTANT, GPT_ACKNOWLEDGEMENT),
    ],
)
def test_smoke_verifies_each_acknowledgement(
    actor: str,
    role: RouterRole,
    expected: str,
) -> None:
    verify_acknowledgement(actor, ROLE_ROUTES[role], f"  {expected}\n", expected)


def test_unexpected_acknowledgement_fails_clearly() -> None:
    with pytest.raises(SmokeError) as error:
        verify_acknowledgement(
            "Claude Lead",
            ROLE_ROUTES[RouterRole.LEAD],
            "unexpected",
            CLAUDE_ACKNOWLEDGEMENT,
        )

    assert "thigo-implement" in str(error.value)
    assert "expected" in str(error.value)
    assert "unexpected" in str(error.value)


def test_one_live_route_failure_stops_smoke_clearly() -> None:
    with (
        patch(
            "thigo_ai.flow.invoke_smoke_actor",
            side_effect=[
                CLAUDE_ACKNOWLEDGEMENT,
                SmokeError(
                    "GPT Assistant [thigo-reviewer] live route call failed: TimeoutError"
                ),
            ],
        ),
        pytest.raises(SmokeError, match="thigo-reviewer"),
    ):
        run_architecture_smoke()
