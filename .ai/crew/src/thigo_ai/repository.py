from __future__ import annotations

import os
from pathlib import Path

IGNORED_PARTS = {
    ".git",
    ".next",
    ".turbo",
    ".venv",
    "__pycache__",
    "dist",
    "node_modules",
}


def repository_root() -> Path:
    return Path(__file__).resolve().parents[4]


def require_active_task(root: Path) -> str:
    task_path = root / "TASK.md"
    if not task_path.is_file():
        raise FileNotFoundError(
            f"Active task not found at {task_path}. Create the root TASK.md before running "
            "`crewai run`."
        )
    task = task_path.read_text(encoding="utf-8").strip()
    if not task:
        raise ValueError(f"Active task is empty: {task_path}")
    return task


def repository_files(root: Path) -> list[str]:
    files: list[str] = []
    for current_root, directories, filenames in os.walk(root):
        relative_directory = Path(current_root).relative_to(root)
        directories[:] = [
            name
            for name in directories
            if name not in IGNORED_PARTS
            and not (relative_directory.as_posix() == ".ai" and name == "reports")
        ]
        files.extend(
            (relative_directory / filename).as_posix() for filename in filenames
        )
    return sorted(files)


def architecture_evidence(root: Path) -> str:
    governance_paths = [
        root / "ARCHITECTURE.md",
        root / "docs" / "FEATURE_ROADMAP.md",
        root / "docs" / "UI_SYSTEM.md",
    ]
    task_path = root / "TASK.md"
    if task_path.is_file():
        governance_paths.append(task_path)

    governance = "\n\n".join(
        f"{path.relative_to(root).as_posix()}\n\n{path.read_text(encoding='utf-8')}"
        for path in governance_paths
    )
    tree = "\n".join(repository_files(root))
    return f"GOVERNANCE\n\n{governance}\n\nREPOSITORY FILES\n\n{tree}"


def task_execution_evidence(root: Path) -> str:
    task = require_active_task(root)
    governance_paths = [
        root / "AGENTS.md",
        root / "ARCHITECTURE.md",
        root / "docs" / "DECISIONS.md",
        root / "docs" / "FEATURE_ROADMAP.md",
        root / "docs" / "UI_SYSTEM.md",
        root / ".ai" / "AGENTS.md",
    ]
    governance_paths.extend(sorted((root / "apps").glob("**/AGENTS.md")))
    governance = "\n\n".join(
        f"{path.relative_to(root).as_posix()}\n\n{path.read_text(encoding='utf-8')}"
        for path in governance_paths
        if path.is_file()
    )
    tree = "\n".join(repository_files(root))
    return (
        f"ACTIVE TASK\n\nTASK.md\n\n{task}\n\n"
        f"GOVERNANCE\n\n{governance}\n\nREPOSITORY FILES\n\n{tree}"
    )


def deterministic_checks(root: Path) -> list[str]:
    required = [
        "AGENTS.md",
        "ARCHITECTURE.md",
        "docs/DECISIONS.md",
        "docs/FEATURE_ROADMAP.md",
        "docs/UI_SYSTEM.md",
        "apps/api/AGENTS.md",
        "apps/mobile/AGENTS.md",
        "apps/admin-web/AGENTS.md",
        ".ai/AGENTS.md",
        "packages/design-tokens/package.json",
        "packages/design-tokens/src/index.ts",
        "apps/api/src/controllers/health/health.controller.ts",
        "apps/api/src/services/health/health.service.ts",
    ]
    results = [
        f"{'PASS' if (root / path).is_file() else 'FAIL'} required file: {path}"
        for path in required
    ]

    forbidden_directories = [
        "apps/api/src/domain",
        "apps/api/src/application",
        "apps/api/src/infrastructure",
        "shared",
    ]
    results.extend(
        f"{'FAIL' if (root / path).exists() else 'PASS'} forbidden directory absent: {path}"
        for path in forbidden_directories
    )
    return results
