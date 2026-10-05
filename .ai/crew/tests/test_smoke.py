from unittest.mock import patch

import pytest

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
