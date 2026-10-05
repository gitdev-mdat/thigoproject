import sys

from thigo_ai.config import (
    RouterGatewayError,
    RouterSettings,
    resolve_router_target,
)
from thigo_ai.flow import run_architecture_smoke


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    try:
        settings = RouterSettings.from_environment()
        resolve_router_target(settings)
    except (RouterGatewayError, ValueError) as error:
        print(f"FAIL - {error}", file=sys.stderr)
        raise SystemExit(1) from None

    report = run_architecture_smoke()
    print(f"Architecture smoke report: {report}")
