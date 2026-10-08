from __future__ import annotations

import shutil
from collections.abc import Sequence
from pathlib import Path


class CommandResolutionError(RuntimeError):
    """Raised when an external command cannot be resolved from PATH."""


def resolve_command(executable: str) -> str:
    """Resolve an executable or platform command shim to an absolute path."""
    resolved = shutil.which(executable)
    if resolved is None:
        raise CommandResolutionError(f"Command executable not found: {executable}")
    return str(Path(resolved).resolve())


def resolve_command_argv(arguments: Sequence[str]) -> list[str]:
    """Return argv with only its executable replaced by a resolved absolute path."""
    if isinstance(arguments, (str, bytes)) or not arguments:
        raise ValueError("Command arguments must be a non-empty sequence")
    return [resolve_command(arguments[0]), *arguments[1:]]
