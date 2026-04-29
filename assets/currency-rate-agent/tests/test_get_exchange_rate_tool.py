"""Unit tests for get_exchange_rate tool."""
import sys
import json
import time
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent / "app"))

import tools.get_exchange_rate_tool as rate_module
from tools.get_exchange_rate_tool import get_exchange_rate, _rate_cache


def _mock_urlopen(data: dict):
    """Return a context manager mock that yields JSON bytes."""
    cm = MagicMock()
    cm.__enter__ = MagicMock(return_value=cm)
    cm.__exit__ = MagicMock(return_value=False)
    cm.read = MagicMock(return_value=json.dumps(data).encode())
    return cm


def _run(from_c, to_c):
    return get_exchange_rate.invoke({"from_currency": from_c, "to_currency": to_c})


def test_successful_rate_retrieval():
    payload = {"success": True, "quotes": {"USDEUR": 0.9234}}
    with patch("urllib.request.urlopen", return_value=_mock_urlopen(payload)):
        result = _run("USD", "EUR")
    assert result["from_currency"] == "USD"
    assert result["to_currency"] == "EUR"
    assert result["rate"] == 0.9234
    assert result["source"] == "exchangerate.host"
    assert "timestamp" in result
    assert result["stale"] is False


def test_response_shape_keys():
    payload = {"success": True, "quotes": {"USDJPY": 149.5}}
    with patch("urllib.request.urlopen", return_value=_mock_urlopen(payload)):
        result = _run("USD", "JPY")
    for key in ("from_currency", "to_currency", "rate", "source", "timestamp", "stale"):
        assert key in result, f"Missing key: {key}"


def test_api_failure_returns_stale_cache():
    # Pre-populate cache
    cache_key = ("USD", "GBP")
    _rate_cache[cache_key] = {
        "rate": 0.79,
        "source": "exchangerate.host",
        "timestamp": "2026-01-01T00:00:00+00:00",
        "fetched_at": time.monotonic() - 700,  # older than TTL
    }
    with patch("urllib.request.urlopen", side_effect=Exception("Network error")):
        result = _run("USD", "GBP")
    assert result["stale"] is True
    assert result["rate"] == 0.79
    assert "cached_at" in result


def test_api_failure_no_cache_returns_error():
    # Remove cache entry for this pair
    _rate_cache.pop(("EUR", "AUD"), None)
    with patch("urllib.request.urlopen", side_effect=Exception("Connection refused")):
        result = _run("EUR", "AUD")
    assert "error" in result


def test_currencies_uppercased():
    payload = {"success": True, "quotes": {"USDCAD": 1.36}}
    with patch("urllib.request.urlopen", return_value=_mock_urlopen(payload)):
        result = _run("usd", "cad")
    assert result["from_currency"] == "USD"
    assert result["to_currency"] == "CAD"
