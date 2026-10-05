from pathlib import Path

import pytest

from thigo_ai.workspace_tools import (
    EditWorkspaceFileTool,
    ReadWorkspaceFileTool,
    RunWorkspaceCommandTool,
    WriteWorkspaceFileTool,
    resolve_workspace_path,
)


def test_workspace_paths_cannot_escape_root(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="escapes"):
        resolve_workspace_path(tmp_path, "../outside.txt")


def test_secret_environment_file_is_protected(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="secrets are protected"):
        resolve_workspace_path(tmp_path, ".ai/crew/.env", for_write=True)


def test_read_write_and_exact_edit_tools(tmp_path: Path) -> None:
    writer = WriteWorkspaceFileTool(root=tmp_path)
    reader = ReadWorkspaceFileTool(root=tmp_path)
    editor = EditWorkspaceFileTool(root=tmp_path)

    assert writer._run("src/example.txt", "before\n").startswith("WROTE")
    assert reader._run("src/example.txt") == "before\n"
    assert editor._run("src/example.txt", "before", "after").startswith("EDITED")
    assert reader._run("src/example.txt") == "after\n"


def test_task_file_is_immutable_to_write_tool(tmp_path: Path) -> None:
    writer = WriteWorkspaceFileTool(root=tmp_path)

    with pytest.raises(ValueError, match="TASK.md is immutable"):
        writer._run("TASK.md", "changed")


def test_command_tool_rejects_shell_chaining_and_arbitrary_programs(
    tmp_path: Path,
) -> None:
    runner = RunWorkspaceCommandTool(root=tmp_path)

    assert runner._run("pnpm check; node unsafe.js").startswith("ERROR")
    assert runner._run("node unsafe.js").startswith("ERROR")
