from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from thigo_ai.command_resolution import (
    CommandResolutionError,
    resolve_command,
    resolve_command_argv,
)
from thigo_ai.task_flow import run_command


def test_resolver_finds_available_executable() -> None:
    resolved = resolve_command(sys.executable)

    assert Path(resolved).is_absolute()
    assert Path(resolved).samefile(sys.executable)


def test_resolver_supports_windows_command_shim(tmp_path: Path) -> None:
    shim = tmp_path / "pnpm.cmd"
    shim.write_text("@echo off\n", encoding="utf-8")

    with patch("thigo_ai.command_resolution.shutil.which", return_value=str(shim)):
        assert resolve_command("pnpm") == str(shim.resolve())


def test_resolver_reports_missing_executable() -> None:
    with (
        patch("thigo_ai.command_resolution.shutil.which", return_value=None),
        pytest.raises(
            CommandResolutionError,
            match="Command executable not found: missing-cli",
        ),
    ):
        resolve_command("missing-cli")


def test_runner_preserves_argv_and_does_not_use_shell(tmp_path: Path) -> None:
    resolved = str((tmp_path / "pnpm.cmd").resolve())
    completed = subprocess.CompletedProcess(
        args=[resolved, "check"], returncode=0, stdout="ok", stderr=""
    )

    with (
        patch(
            "thigo_ai.task_flow.resolve_command_argv",
            return_value=[resolved, "check"],
        ) as resolver,
        patch("thigo_ai.task_flow.subprocess.run", return_value=completed) as process_run,
    ):
        result = run_command(tmp_path, ["pnpm", "check"], 30)

    resolver.assert_called_once_with(["pnpm", "check"])
    assert process_run.call_args.args[0] == [resolved, "check"]
    assert isinstance(process_run.call_args.args[0], list)
    assert "shell" not in process_run.call_args.kwargs
    assert result.startswith("PASS pnpm check")


def test_argv_resolution_preserves_arguments() -> None:
    with patch(
        "thigo_ai.command_resolution.resolve_command",
        return_value="/resolved/pnpm",
    ):
        assert resolve_command_argv(["pnpm", "--filter", "@thigo/api", "test"]) == [
            "/resolved/pnpm",
            "--filter",
            "@thigo/api",
            "test",
        ]
