import sys

from thigo_ai.config import (
    RouterGatewayError,
    RouterSettings,
    resolve_router_routes,
)
from thigo_ai.flow import SmokeError, run_architecture_smoke


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    try:
        settings = RouterSettings.from_environment()
        resolve_router_routes(settings)
    except (RouterGatewayError, SmokeError, ValueError) as error:
        print(f"FAIL - {error}", file=sys.stderr)
        raise SystemExit(1) from None

    try:
        result = run_architecture_smoke()
    except SmokeError as error:
        print(f"FAIL - {error}", file=sys.stderr)
        raise SystemExit(1) from None

    print("THIGO AI smoke")
    print("Claude Lead [thigo-implement] ........ PASS")
    print("GPT Assistant [thigo-reviewer] ...... PASS")
    print("Flow plumbing ....................... PASS")
    print(f"Live LLM calls ...................... {result.live_llm_calls}")
    print("Smoke PASS")
