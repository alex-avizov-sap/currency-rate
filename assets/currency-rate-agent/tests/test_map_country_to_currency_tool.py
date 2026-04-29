"""Unit tests for map_country_to_currency tool."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "app"))

from tools.map_country_to_currency_tool import map_country_to_currency


def _run(input_val):
    return map_country_to_currency.run({"country_name": input_val})


def test_known_country_germany():
    result = _run("Germany")
    assert result["currency_code"] == "EUR"
    assert result["currency_name"] == "Euro"


def test_known_country_japan():
    result = _run("Japan")
    assert result["currency_code"] == "JPY"


def test_known_country_united_states():
    result = _run("United States")
    assert result["currency_code"] == "USD"


def test_alias_usa():
    result = _run("USA")
    assert result["currency_code"] == "USD"


def test_alias_uk():
    result = _run("UK")
    assert result["currency_code"] == "GBP"


def test_iso_code_passthrough_eur():
    result = _run("EUR")
    assert result["currency_code"] == "EUR"


def test_iso_code_case_insensitive():
    result = _run("jpy")
    assert result["currency_code"] == "JPY"


def test_unknown_country_returns_error():
    result = _run("Narnia")
    assert result.get("error") == "not_found"


def test_country_case_insensitive():
    result = _run("germany")
    assert result["currency_code"] == "EUR"


def test_country_thailand():
    result = _run("Thailand")
    assert result["currency_code"] == "THB"
