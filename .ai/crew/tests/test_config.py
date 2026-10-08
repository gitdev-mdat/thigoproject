from unittest.mock import patch

import pytest

from thigo_ai.config import (
    DEFAULT_NINEROUTER_BASE_URL,
    ROLE_ROUTES,
    MissingRouterRouteError,
    RouterGatewayError,
    RouterRole,
    RouterSettings,
    advertised_router_targets,
    build_smoke_llm,
    normalize_base_url,
    resolve_router_routes,
    select_role_route,
)


def test_router_settings_require_only_api_key() -> None:
    with (
        patch("thigo_ai.config.load_dotenv", return_value=False),
        patch.dict("os.environ", {}, clear=True),
        pytest.raises(ValueError, match="NINEROUTER_API_KEY"),
    ):
        RouterSettings.from_environment()


def test_router_settings_use_default_base_url() -> None:
    with (
        patch("thigo_ai.config.load_dotenv", return_value=False),
        patch.dict(
            "os.environ", {"NINEROUTER_API_KEY": "test-only"}, clear=True
        ),
    ):
        settings = RouterSettings.from_environment()

    assert settings.base_url == DEFAULT_NINEROUTER_BASE_URL
    assert settings.api_key == "test-only"


def test_router_settings_allow_base_url_override() -> None:
    environment = {
        "NINEROUTER_BASE_URL": "https://router.example.test/v1/",
        "NINEROUTER_API_KEY": "test-only",
    }
    with (
        patch("thigo_ai.config.load_dotenv", return_value=False),
        patch.dict("os.environ", environment, clear=True),
    ):
        settings = RouterSettings.from_environment()

    assert settings.base_url == "https://router.example.test/v1"


def test_base_url_rejects_embedded_credentials() -> None:
    with pytest.raises(ValueError, match="must not contain credentials"):
        normalize_base_url("https://user:secret@router.example.test/v1")


def test_only_existing_lead_and_assistant_routes_are_required() -> None:
    assert ROLE_ROUTES == {
        RouterRole.LEAD: "thigo-implement",
        RouterRole.ASSISTANT: "thigo-reviewer",
    }


@pytest.mark.parametrize(
    ("role", "available", "missing"),
    [
        (RouterRole.LEAD, "thigo-reviewer", "thigo-implement"),
        (RouterRole.ASSISTANT, "thigo-implement", "thigo-reviewer"),
    ],
)
def test_missing_either_required_combo_fails_clearly(
    role: RouterRole,
    available: str,
    missing: str,
) -> None:
    payload = {"data": [{"id": available, "owned_by": "combo"}]}

    with pytest.raises(MissingRouterRouteError) as error:
        select_role_route(payload, role)

    assert missing in str(error.value)
    assert "No alternate or generic route was substituted" in str(error.value)


def test_both_existing_routes_resolve_from_one_catalog() -> None:
    payload = {
        "data": [
            {"id": "thigo-implement", "owned_by": "combo"},
            {"id": "thigo-reviewer", "owned_by": "combo"},
            {"id": "provider/model", "owned_by": "provider"},
        ]
    }
    settings = RouterSettings("https://router.example.test/v1", "test-only")

    with patch("thigo_ai.config.fetch_router_catalog", return_value=payload) as fetch:
        routes = resolve_router_routes(settings)

    assert routes == ROLE_ROUTES
    fetch.assert_called_once_with(settings, 5)


def test_unrelated_routes_are_not_substituted() -> None:
    payload = {
        "data": [
            {"id": "unrelated-combo", "owned_by": "combo"},
            {"id": "provider/model", "owned_by": "provider"},
        ]
    }

    with pytest.raises(MissingRouterRouteError):
        select_role_route(payload, RouterRole.LEAD)


def test_router_catalog_rejects_empty_targets() -> None:
    with pytest.raises(RouterGatewayError, match="no available LLM"):
        advertised_router_targets({"data": []})


def test_smoke_llm_uses_route_and_tiny_output_cap() -> None:
    settings = RouterSettings("https://router.example.test/v1", "test-only")

    with (
        patch(
            "thigo_ai.config.resolve_router_target",
            return_value="thigo-implement",
        ) as resolve,
        patch("thigo_ai.config.LLM") as llm,
    ):
        build_smoke_llm(RouterRole.LEAD, settings)

    resolve.assert_called_once_with(settings, RouterRole.LEAD)
    llm.assert_called_once_with(
        model="thigo-implement",
        custom_openai=True,
        base_url=settings.base_url,
        api_key=settings.api_key,
        temperature=0,
        max_tokens=32,
    )
