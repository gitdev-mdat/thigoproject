from __future__ import annotations

import os
import shlex
import subprocess
from pathlib import Path
from typing import Any

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from thigo_ai.command_resolution import CommandResolutionError, resolve_command_argv

PROTECTED_DIRECTORIES = {
    ".git",
    ".next",
    ".turbo",
    ".venv",
    "coverage",
    "dist",
    "node_modules",
}
MAX_TOOL_OUTPUT = 30_000


def resolve_workspace_path(root: Path, path: str, *, for_write: bool = False) -> Path:
    relative = Path(path.replace("\\", "/"))
    if relative.is_absolute():
        raise ValueError("Use a path relative to the THIGO repository root")
    resolved = (root / relative).resolve()
    try:
        repository_relative = resolved.relative_to(root.resolve())
    except ValueError as error:
        raise ValueError("Path escapes the THIGO repository root") from error

    if any(part in PROTECTED_DIRECTORIES for part in repository_relative.parts):
        raise ValueError("Path points to generated, dependency, or Git internals")
    if resolved.name.startswith(".env") and resolved.name != ".env.example":
        raise ValueError("Environment files containing secrets are protected")
    if for_write and repository_relative.as_posix() == "TASK.md":
        raise ValueError("The active TASK.md is immutable during a crew run")
    if for_write and repository_relative.as_posix().startswith(".ai/reports/"):
        raise ValueError("Generated reports are owned by the Flow report step")
    return resolved


class ReadFileInput(BaseModel):
    path: str = Field(description="Repository-relative file path to read")
    max_chars: int = Field(
        default=30_000,
        ge=1_000,
        le=100_000,
        description="Maximum characters to return",
    )


class ReadWorkspaceFileTool(BaseTool):
    name: str = "read_workspace_file"
    description: str = (
        "Read a UTF-8 text file inside the THIGO repository. Read existing files before "
        "proposing or applying changes. Secret environment files are protected."
    )
    args_schema: type[BaseModel] = ReadFileInput
    root: Path = Field(exclude=True)

    def _run(self, path: str, max_chars: int = 30_000, **_: Any) -> str:
        target = resolve_workspace_path(self.root, path)
        if not target.is_file():
            return f"ERROR: file does not exist: {path}"
        content = target.read_text(encoding="utf-8")
        if len(content) <= max_chars:
            return content
        return f"{content[:max_chars]}\n\n[truncated at {max_chars} characters]"


class SearchInput(BaseModel):
    query: str = Field(description="Ripgrep regular expression to search for")
    path: str = Field(default=".", description="Repository-relative directory or file")


class SearchWorkspaceTool(BaseTool):
    name: str = "search_workspace"
    description: str = (
        "Search THIGO source text with ripgrep and return matching paths, line numbers, and "
        "lines. Dependency, build, Git, report, and secret environment paths are excluded."
    )
    args_schema: type[BaseModel] = SearchInput
    root: Path = Field(exclude=True)

    def _run(self, query: str, path: str = ".", **_: Any) -> str:
        target = resolve_workspace_path(self.root, path)
        command = [
            "rg",
            "-n",
            "--hidden",
            "-g",
            "!**/.git/**",
            "-g",
            "!**/node_modules/**",
            "-g",
            "!**/.venv/**",
            "-g",
            "!**/dist/**",
            "-g",
            "!**/.next/**",
            "-g",
            "!**/.ai/reports/**",
            "-g",
            "!**/.env",
            "-g",
            "!**/.env.*",
            query,
            str(target),
        ]
        try:
            result = subprocess.run(
                resolve_command_argv(command),
                cwd=self.root,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=30,
                check=False,
            )
        except CommandResolutionError as error:
            return f"ERROR: {error}"
        except FileNotFoundError:
            return "ERROR: Command executable not found: rg"
        output = (result.stdout + result.stderr).strip()
        if result.returncode == 1:
            return "No matches found."
        if result.returncode != 0:
            return f"ERROR: ripgrep exited {result.returncode}\n{output[:MAX_TOOL_OUTPUT]}"
        return output[:MAX_TOOL_OUTPUT]


class WriteFileInput(BaseModel):
    path: str = Field(description="Repository-relative file path to create or replace")
    content: str = Field(description="Complete UTF-8 file content")


class WriteWorkspaceFileTool(BaseTool):
    name: str = "write_workspace_file"
    description: str = (
        "Create or replace a THIGO repository text file. Inspect an existing file first and "
        "preserve unrelated work. TASK.md, secrets, dependencies, and generated paths are "
        "protected."
    )
    args_schema: type[BaseModel] = WriteFileInput
    root: Path = Field(exclude=True)

    def _run(self, path: str, content: str, **_: Any) -> str:
        target = resolve_workspace_path(self.root, path, for_write=True)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8", newline="\n")
        return f"WROTE: {target.relative_to(self.root).as_posix()} ({len(content)} characters)"


class EditFileInput(BaseModel):
    path: str = Field(description="Repository-relative text file path to edit")
    old_text: str = Field(description="Exact existing text to replace once")
    new_text: str = Field(description="Replacement text")


class EditWorkspaceFileTool(BaseTool):
    name: str = "edit_workspace_file"
    description: str = (
        "Apply one exact text replacement in an existing THIGO file. The edit fails unless "
        "old_text occurs exactly once, protecting against broad or ambiguous rewrites."
    )
    args_schema: type[BaseModel] = EditFileInput
    root: Path = Field(exclude=True)

    def _run(self, path: str, old_text: str, new_text: str, **_: Any) -> str:
        if not old_text:
            return "ERROR: old_text must not be empty"
        target = resolve_workspace_path(self.root, path, for_write=True)
        if not target.is_file():
            return f"ERROR: file does not exist: {path}"
        content = target.read_text(encoding="utf-8")
        occurrences = content.count(old_text)
        if occurrences != 1:
            return f"ERROR: old_text occurs {occurrences} times; expected exactly once"
        target.write_text(
            content.replace(old_text, new_text, 1), encoding="utf-8", newline="\n"
        )
        return f"EDITED: {target.relative_to(self.root).as_posix()}"


class CommandInput(BaseModel):
    command: str = Field(
        description=(
            "A single allowlisted pnpm/uv verification or dependency command, read-only Git "
            "command, or bounded docker compose command"
        )
    )
    timeout_seconds: int = Field(default=120, ge=1, le=300)


class RunWorkspaceCommandTool(BaseTool):
    name: str = "run_workspace_command"
    description: str = (
        "Run one allowlisted, non-interactive repository command and return its exit code and "
        "bounded output. Shell chaining, redirection, and destructive Git commands are rejected."
    )
    args_schema: type[BaseModel] = CommandInput
    root: Path = Field(exclude=True)

    def _run(self, command: str, timeout_seconds: int = 120, **_: Any) -> str:
        forbidden_tokens = ("\n", "\r", ";", "&&", "||", "|", ">", "<", "`", "$(")
        if any(token in command for token in forbidden_tokens):
            return "ERROR: shell chaining, expansion, and redirection are not allowed"
        try:
            arguments = shlex.split(command, posix=True)
        except ValueError as error:
            return f"ERROR: invalid command syntax: {error}"
        if not arguments:
            return "ERROR: command is empty"

        first = arguments[0].lower()
        allowed = False
        if first == "pnpm" and len(arguments) > 1:
            pnpm_command = arguments[1].lower()
            if pnpm_command == "--filter" and len(arguments) > 3:
                pnpm_command = arguments[3].lower()
            allowed = pnpm_command in {
                "add",
                "build",
                "check",
                "format",
                "format:check",
                "install",
                "lint",
                "test",
                "typecheck",
            } or pnpm_command.startswith(("ai:", "db:"))
        if first == "uv" and len(arguments) > 1:
            uv_command = arguments[1].lower()
            allowed = uv_command == "sync" or (
                uv_command == "run"
                and any(
                    argument.lower()
                    in {"pytest", "ruff", "thigo-ai-doctor", "thigo-ai-smoke"}
                    for argument in arguments[2:]
                )
            )
        allowed = allowed or (
            first == "git"
            and len(arguments) > 1
            and arguments[1].lower() in {"status", "diff", "rev-parse"}
        )
        allowed = allowed or (
            first == "docker"
            and len(arguments) > 2
            and arguments[1].lower() == "compose"
            and arguments[2].lower() in {"logs", "ps", "up"}
        )
        if not allowed:
            return "ERROR: command is outside the THIGO implementation allowlist"

        environment = os.environ.copy()
        environment["CI"] = "1"
        try:
            resolved_arguments = resolve_command_argv(arguments)
            result = subprocess.run(
                resolved_arguments,
                cwd=self.root,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_seconds,
                check=False,
                env=environment,
            )
        except CommandResolutionError as error:
            return f"ERROR: {error}"
        except FileNotFoundError:
            return f"ERROR: Command executable not found: {arguments[0]}"
        except subprocess.TimeoutExpired:
            return f"ERROR: command timed out after {timeout_seconds} seconds"
        output = (result.stdout + result.stderr).strip()
        return f"EXIT {result.returncode}\n{output[-MAX_TOOL_OUTPUT:]}"


def read_only_tools(root: Path) -> list[BaseTool]:
    return [
        ReadWorkspaceFileTool(root=root),
        SearchWorkspaceTool(root=root),
    ]


def verification_tools(root: Path) -> list[BaseTool]:
    return [
        *read_only_tools(root),
        RunWorkspaceCommandTool(root=root),
    ]


def implementation_tools(root: Path) -> list[BaseTool]:
    return [
        *verification_tools(root),
        WriteWorkspaceFileTool(root=root),
        EditWorkspaceFileTool(root=root),
    ]

