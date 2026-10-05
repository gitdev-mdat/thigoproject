from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit

from crewai import LLM
from dotenv import load_dotenv

DEFAULT_NINEROUTER_BASE_URL = "http://localhost:20128/v1"


class RouterGatewayError(RuntimeError):
    """A safe-to-report 9Router discovery or connectivity failure."""


class MissingRouterKeyError(ValueError):
    """The one required local AI credential has not been configured."""


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


def select_router_target(payload: object) -> str:
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise RouterGatewayError("9Router returned an invalid /models response")

    candidates = [
        item
        for item in payload["data"]
        if isinstance(item, dict)
        and isinstance(item.get("id"), str)
        and item["id"].strip()
    ]
    if not candidates:
        raise RouterGatewayError("9Router advertised no available LLM routing targets")

    # 9Router publishes its user-defined combos before individual models. Prefer a
    # combo so upstream provider/model policy stays in the router. A router without
    # a combo still remains usable through its first advertised LLM target.
    selected = next(
        (item for item in candidates if item.get("owned_by") == "combo"),
        candidates[0],
    )
    return selected["id"].strip()


def resolve_router_target(
    settings: RouterSettings, timeout_seconds: float = 5
) -> str:
    request = urllib.request.Request(
        f"{settings.base_url}/models",
        headers={"Authorization": f"Bearer {settings.api_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return select_router_target(json.load(response))
    except urllib.error.HTTPError as error:
        raise RouterGatewayError(
            f"9Router model discovery was rejected (HTTP {error.code})"
        ) from error
    except (urllib.error.URLError, TimeoutError) as error:
        reason = getattr(error, "reason", "connection failed")
        raise RouterGatewayError(f"9Router endpoint is unreachable: {reason}") from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise RouterGatewayError("9Router returned invalid JSON from /models") from error


def build_llm(settings: RouterSettings | None = None) -> LLM:
    router = settings or RouterSettings.from_environment()
    router_target = resolve_router_target(router)
    return LLM(
        model=router_target,
        custom_openai=True,
        base_url=router.base_url,
        api_key=router.api_key,
        temperature=0,
    )

