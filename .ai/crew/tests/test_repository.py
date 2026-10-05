from pathlib import Path

import pytest

from thigo_ai.repository import (
    architecture_evidence,
    deterministic_checks,
    repository_root,
    require_active_task,
    task_execution_evidence,
)


def test_required_architecture_files_exist() -> None:
    checks = deterministic_checks(repository_root())

    assert checks
    assert all(check.startswith("PASS") for check in checks), "\n".join(checks)


def test_review_evidence_includes_product_and_ui_governance() -> None:
    evidence = architecture_evidence(repository_root())

    assert "docs/FEATURE_ROADMAP.md" in evidence
    assert "docs/UI_SYSTEM.md" in evidence
    assert "DESIGN LANGUAGE IS CONSTRAINED" in evidence


def test_active_task_is_required(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="Create the root TASK.md"):
        require_active_task(tmp_path)


def test_task_execution_evidence_reads_task_and_governance(tmp_path: Path) -> None:
    (tmp_path / "docs").mkdir()
    (tmp_path / ".ai").mkdir()
    (tmp_path / "TASK.md").write_text("# Active task", encoding="utf-8")
    (tmp_path / "AGENTS.md").write_text("root rules", encoding="utf-8")
    (tmp_path / "ARCHITECTURE.md").write_text("architecture", encoding="utf-8")
    (tmp_path / "docs" / "DECISIONS.md").write_text("decisions", encoding="utf-8")
    (tmp_path / "docs" / "FEATURE_ROADMAP.md").write_text(
        "roadmap", encoding="utf-8"
    )
    (tmp_path / "docs" / "UI_SYSTEM.md").write_text("ui rules", encoding="utf-8")
    (tmp_path / ".ai" / "AGENTS.md").write_text("ai rules", encoding="utf-8")

    evidence = task_execution_evidence(tmp_path)

    assert "ACTIVE TASK\n\nTASK.md\n\n# Active task" in evidence
    assert "AGENTS.md\n\nroot rules" in evidence
    assert "docs/FEATURE_ROADMAP.md\n\nroadmap" in evidence
