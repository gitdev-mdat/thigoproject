from unittest.mock import patch

from thigo_ai.config import MissingRouterKeyError, RouterSettings
from thigo_ai.doctor import Diagnostic, run_diagnostics


def test_doctor_reports_missing_key_as_failure(capsys) -> None:
    with patch(
        "thigo_ai.doctor.RouterSettings.from_environment",
        side_effect=MissingRouterKeyError("NINEROUTER_API_KEY is missing"),
    ):
        exit_code = run_diagnostics()

    assert exit_code == 1
    assert "FAIL - NINEROUTER_API_KEY is missing" in capsys.readouterr().out


def test_doctor_can_warn_for_credential_free_ci(capsys) -> None:
    with patch(
        "thigo_ai.doctor.RouterSettings.from_environment",
        side_effect=MissingRouterKeyError("NINEROUTER_API_KEY is missing"),
    ):
        exit_code = run_diagnostics(allow_missing_router=True)

    assert exit_code == 0
    assert "WARNING - NINEROUTER_API_KEY is missing" in capsys.readouterr().out


def test_doctor_does_not_downgrade_invalid_configuration(capsys) -> None:
    with patch(
        "thigo_ai.doctor.RouterSettings.from_environment",
        side_effect=ValueError("NINEROUTER_BASE_URL must be an absolute HTTP(S) URL"),
    ):
        exit_code = run_diagnostics(allow_missing_router=True)

    assert exit_code == 1
    assert "FAIL - NINEROUTER_BASE_URL" in capsys.readouterr().out


def test_doctor_never_prints_api_key(capsys) -> None:
    settings = RouterSettings(
        base_url="http://localhost:20128/v1", api_key="test-secret-key"
    )
    with (
        patch(
            "thigo_ai.doctor.RouterSettings.from_environment", return_value=settings
        ),
        patch(
            "thigo_ai.doctor.check_router",
            return_value=Diagnostic("PASS", "9Router endpoint reachable"),
        ),
    ):
        exit_code = run_diagnostics()

    output = capsys.readouterr().out
    assert exit_code == 0
    assert "PASS - NINEROUTER_API_KEY configured" in output
    assert "test-secret-key" not in output

