from __future__ import annotations

import argparse
import importlib.metadata
import sys
from dataclasses import dataclass
from typing import Literal

from thigo_ai.config import (
    MissingRouterKeyError,
    RouterGatewayError,
    RouterSettings,
    resolve_router_target,
)

DiagnosticStatus = Literal["PASS", "WARNING", "FAIL"]


@dataclass(frozen=True)
class Diagnostic:
    status: DiagnosticStatus
    detail: str


def check_router(settings: RouterSettings) -> Diagnostic:
    try:
        resolve_router_target(settings)
        return Diagnostic(
            "PASS", "9Router endpoint reachable and an LLM routing target is available"
        )
    except RouterGatewayError as error:
        return Diagnostic("FAIL", str(error))


def run_diagnostics(allow_missing_router: bool = False) -> int:
    checks: list[Diagnostic] = []
    python_supported = (3, 13) <= sys.version_info[:2] < (3, 14)
    checks.append(
        Diagnostic(
            "PASS" if python_supported else "FAIL",
            f"Python {sys.version.split()[0]} (required >=3.13,<3.14)",
        )
    )

    try:
        version = importlib.metadata.version("crewai")
        checks.append(Diagnostic("PASS", f"CrewAI {version} available"))
    except importlib.metadata.PackageNotFoundError:
        checks.append(Diagnostic("FAIL", "CrewAI is not installed in the uv environment"))

    try:
        settings = RouterSettings.from_environment()
        checks.append(Diagnostic("PASS", "NINEROUTER_API_KEY configured"))
        checks.append(
            Diagnostic("PASS", f"Effective 9Router base URL: {settings.base_url}")
        )
        checks.append(check_router(settings))
    except MissingRouterKeyError as error:
        status: DiagnosticStatus = "WARNING" if allow_missing_router else "FAIL"
        checks.append(Diagnostic(status, str(error)))
    except ValueError as error:
        checks.append(Diagnostic("FAIL", str(error)))

    for check in checks:
        print(f"{check.status} - {check.detail}")
    return 1 if any(check.status == "FAIL" for check in checks) else 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate THIGO CrewAI and 9Router configuration."
    )
    parser.add_argument(
        "--allow-missing-router",
        action="store_true",
        help="Report absent router configuration as a warning for credential-free CI.",
    )
    arguments = parser.parse_args()
    raise SystemExit(run_diagnostics(arguments.allow_missing_router))

