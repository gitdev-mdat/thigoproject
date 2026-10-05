from unittest.mock import patch

import pytest

from thigo_ai.config import (
    DEFAULT_NINEROUTER_BASE_URL,
    RouterGatewayError,
    RouterSettings,
    normalize_base_url,
    select_router_target,
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


def test_router_target_prefers_combo() -> None:
    payload = {
        "data": [
            {"id": "provider/model", "owned_by": "provider"},
            {"id": "team-routing-combo", "owned_by": "combo"},
        ]
    }

    assert select_router_target(payload) == "team-routing-combo"


def test_router_target_falls_back_to_first_advertised_llm() -> None:
    payload = {"data": [{"id": "provider/model", "owned_by": "provider"}]}

    assert select_router_target(payload) == "provider/model"


def test_router_target_rejects_empty_catalog() -> None:
    with pytest.raises(RouterGatewayError, match="no available LLM"):
        select_router_target({"data": []})

