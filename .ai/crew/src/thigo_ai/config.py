from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from enum import StrEnum
from urllib.parse import urlsplit, urlunsplit

from crewai import LLM
from dotenv import load_dotenv

DEFAULT_NINEROUTER_BASE_URL = "http://localhost:20128/v1"


class RouterGatewayError(RuntimeError):
    """A safe-to-report 9Router discovery or connectivity failure."""


class MissingRouterRouteError(RouterGatewayError):
    """A required THIGO 9Router combo is not advertised."""


class MissingRouterKeyError(ValueError):
    """The one required local AI credential has not been configured."""


class RouterRole(StrEnum):
    LEAD = "claude_lead"
    ASSISTANT = "gpt_assistant"


ROLE_ROUTES: dict[RouterRole, str] = {
    RouterRole.LEAD: "thigo-implement",
    RouterRole.ASSISTANT: "thigo-reviewer",
}
REQUIRED_ROUTER_ROLES = tuple(ROLE_ROUTES)


def normalize_base_url(value: str) -> str:
    parsed = urlsplit(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("NINEROUTER_BASE_URL must be an absolute HTTP(S) URL")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError(
            "NINEROUTER_BASE_URL must not contain credentials, query parameters, or fragments"
        )
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/"), "", ""))


@dataclass(frozen=True)
class RouterSettings:
    base_url: str
    api_key: str

    @classmethod
    def from_environment(cls) -> RouterSettings:
        load_dotenv()
        api_key = os.getenv("NINEROUTER_API_KEY", "").strip()
        if not api_key:
            raise MissingRouterKeyError("NINEROUTER_API_KEY is missing")

        base_url = os.getenv(
            "NINEROUTER_BASE_URL", DEFAULT_NINEROUTER_BASE_URL
        ).strip()
        return cls(base_url=normalize_base_url(base_url), api_key=api_key)


def advertised_router_targets(payload: object) -> set[str]:
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise RouterGatewayError("9Router returned an invalid /models response")

    targets = {
        item["id"].strip()
        for item in payload["data"]
        if isinstance(item, dict)
        and isinstance(item.get("id"), str)
        and item["id"].strip()
    }
    if not targets:
        raise RouterGatewayError("9Router advertised no available LLM routing targets")
    return targets


def select_role_route(payload: object, role: RouterRole) -> str:
    route = ROLE_ROUTES[role]
    if route not in advertised_router_targets(payload):
        raise MissingRouterRouteError(
            f"Required 9Router combo '{route}' for {role.value} is missing. "
            "No alternate or generic route was substituted."
        )
    return route


def fetch_router_catalog(
    settings: RouterSettings, timeout_seconds: float = 5
) -> object:
    request = urllib.request.Request(
        f"{settings.base_url}/models",
        headers={"Authorization": f"Bearer {settings.api_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RouterGatewayError(
            f"9Router model discovery was rejected (HTTP {error.code})"
        ) from error
    except (urllib.error.URLError, TimeoutError) as error:
        reason = getattr(error, "reason", "connection failed")
        raise RouterGatewayError(f"9Router endpoint is unreachable: {reason}") from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise RouterGatewayError("9Router returned invalid JSON from /models") from error


def resolve_router_target(
    settings: RouterSettings,
    role: RouterRole,
    timeout_seconds: float = 5,
) -> str:
    return select_role_route(fetch_router_catalog(settings, timeout_seconds), role)


def resolve_router_routes(
    settings: RouterSettings,
    roles: tuple[RouterRole, ...] = REQUIRED_ROUTER_ROLES,
    timeout_seconds: float = 5,
) -> dict[RouterRole, str]:
    payload = fetch_router_catalog(settings, timeout_seconds)
    return {role: select_role_route(payload, role) for role in roles}


def build_llm(role: RouterRole, settings: RouterSettings | None = None) -> LLM:
    router = settings or RouterSettings.from_environment()
    router_target = resolve_router_target(router, role)
    return LLM(
        model=router_target,
        custom_openai=True,
        base_url=router.base_url,
        api_key=router.api_key,
        temperature=0,
    )


def build_smoke_llm(role: RouterRole, settings: RouterSettings | None = None) -> LLM:
    router = settings or RouterSettings.from_environment()
    router_target = resolve_router_target(router, role)
    return LLM(
        model=router_target,
        custom_openai=True,
        base_url=router.base_url,
        api_key=router.api_key,
        temperature=0,
        max_tokens=32,
    )
