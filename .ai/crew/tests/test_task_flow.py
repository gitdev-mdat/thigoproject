from thigo_ai.task_flow import runtime_verification_requirement


def test_runtime_verification_requires_real_evidence() -> None:
    result = runtime_verification_requirement(
        "Verify Customer on an Android emulator and Admin in a browser."
    )

    assert result is not None
    assert result.startswith("NOT VERIFIED")
    assert "not sufficient evidence" in result


def test_non_runtime_task_has_no_runtime_blocker() -> None:
    assert runtime_verification_requirement("Run unit tests for a parser.") is None
