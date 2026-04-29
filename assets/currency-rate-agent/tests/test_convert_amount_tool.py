"""Unit tests for convert_amount tool."""
import sys
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent / "app"))

from tools.convert_amount_tool import convert_amount
import tools.convert_amount_tool as conv_module


def _make_rate(from_c, to_c, rate=0.9234, stale=False):
    return {
        "from_currency": from_c, "to_currency": to_c,
        "rate": rate, "source": "exchangerate.host",
        "timestamp": "2026-04-29T10:00:00+00:00", "stale": stale,
    }


def _run(amount, from_c, to_c, mock_rate=None):
    if mock_rate is None:
        mock_rate = _make_rate(from_c.upper(), to_c.upper())
    mock_tool = MagicMock()
    mock_tool.invoke = lambda kwargs: mock_rate
    with patch.object(conv_module, "get_exchange_rate", mock_tool):
        return convert_amount.invoke({"amount": amount, "from_currency": from_c, "to_currency": to_c})


def test_correct_conversion_calculation():
    result = _run(200.0, "USD", "EUR", _make_rate("USD", "EUR", rate=0.9234))
    assert result["converted_amount"] == round(200.0 * 0.9234, 4)
    assert result["amount"] == 200.0
    assert result["from_currency"] == "USD"
    assert result["to_currency"] == "EUR"


def test_stale_flag_propagated():
    result = _run(100.0, "EUR", "USD", _make_rate("EUR", "USD", rate=1.1, stale=True))
    assert result["stale"] is True


def test_error_from_rate_propagated():
    error_result = {"error": "No rate available"}
    mock_tool = MagicMock()
    mock_tool.invoke = lambda kwargs: error_result
    with patch.object(conv_module, "get_exchange_rate", mock_tool):
        result = convert_amount.invoke({"amount": 50.0, "from_currency": "USD", "to_currency": "JPY"})
    assert "error" in result


def test_response_contains_all_keys():
    result = _run(10.0, "USD", "JPY", _make_rate("USD", "JPY", rate=149.5))
    for key in ("amount", "from_currency", "to_currency", "rate", "converted_amount", "source", "timestamp", "stale"):
        assert key in result, f"Missing key: {key}"


def test_currencies_uppercased():
    result = _run(50.0, "usd", "eur")
    assert result["from_currency"] == "USD"
    assert result["to_currency"] == "EUR"
