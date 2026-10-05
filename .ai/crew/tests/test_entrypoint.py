from __future__ import annotations

import tomllib
from pathlib import Path
from unittest.mock import patch

import pytest

from thigo_ai.main import run


def test_pyproject_registers_crewai_run_script() -> None:
    pyproject_path = Path(__file__).resolve().parents[1] / "pyproject.toml"
    with pyproject_path.open("rb") as pyproject_file:
        pyproject = tomllib.load(pyproject_file)

    assert pyproject["project"]["scripts"]["run_crew"] == "thigo_ai.main:run"


def test_entrypoint_dry_run_requires_task_and_starts_task_flow(
    tmp_path: Path, monkeypatch, capsys
) -> None:
    (tmp_path / "TASK.md").write_text("# Test task", encoding="utf-8")
    report = tmp_path / ".ai" / "reports" / "entrypoint-check.md"
    monkeypatch.setenv("THIGO_CREW_DRY_RUN", "1")

    with (
        patch("thigo_ai.main.repository_root", return_value=tmp_path),
        patch("thigo_ai.main.run_task_execution", return_value=report) as run_flow,
    ):
        run()

    run_flow.assert_called_once_with(dry_run=True)
    assert "THIGO task Flow report" in capsys.readouterr().out


def test_entrypoint_fails_before_flow_when_task_is_missing(
    tmp_path: Path, monkeypatch, capsys
) -> None:
    monkeypatch.setenv("THIGO_CREW_DRY_RUN", "1")

    with (
        patch("thigo_ai.main.repository_root", return_value=tmp_path),
        patch("thigo_ai.main.run_task_execution") as run_flow,
        pytest.raises(SystemExit) as exit_error,
    ):
        run()

    assert exit_error.value.code == 1
    assert "Create the root TASK.md" in capsys.readouterr().err
    run_flow.assert_not_called()
