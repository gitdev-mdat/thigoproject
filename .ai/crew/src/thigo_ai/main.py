from __future__ import annotations

import os
import sys

from thigo_ai.config import RouterGatewayError, RouterSettings, resolve_router_target
from thigo_ai.repository import repository_root, require_active_task
from thigo_ai.task_flow import run_task_execution


def configure_utf8_console() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")


def run() -> None:
    configure_utf8_console()
    dry_run = os.getenv("THIGO_CREW_DRY_RUN", "").strip() == "1"

    try:
        require_active_task(repository_root())
        if not dry_run:
            settings = RouterSettings.from_environment()
            resolve_router_target(settings)
    except (FileNotFoundError, RouterGatewayError, ValueError) as error:
        print(f"FAIL - {error}", file=sys.stderr)
        raise SystemExit(1) from None

    report = run_task_execution(dry_run=dry_run)
    print(f"THIGO task Flow report: {report}")

