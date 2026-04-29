"""Tool: get_exchange_rate - Fetches current exchange rate from public API with caching."""
import json
import logging
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from opentelemetry import trace
from langchain_core.tools import tool

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

_rate_cache: dict = {}
_CACHE_TTL_SECONDS = 600


def _fetch_rate_http(from_currency: str, to_currency: str) -> dict:
    api_key = os.environ.get("EXCHANGE_RATE_API_KEY", "")
    url = f"https://api.exchangerate.host/live?source={from_currency}&currencies={to_currency}&format=1"
    if api_key:
        url += f"&access_key={api_key}"
    req = urllib.request.Request(url, headers={"User-Agent": "currency-rate-agent/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if not data.get("success", True):
        raise ValueError(f"API error: {data.get('error', {}).get('info', 'unknown error')}")
    quotes = data.get("quotes", {})
    key = f"{from_currency}{to_currency}"
    if key not in quotes:
        raise KeyError(f"Rate key '{key}' not found. Available: {list(quotes.keys())}")
    return {
        "rate": float(quotes[key]),
        "source": "exchangerate.host",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@tool
def get_exchange_rate(from_currency: str, to_currency: str) -> dict:
    """Fetch the current exchange rate between two ISO 4217 currency codes.

    Uses the exchangerate.host public API. Results cached for 10 minutes.
    Returns stale cached rate if API is unavailable.

    Args:
        from_currency: Source ISO 4217 code (e.g. 'USD').
        to_currency: Target ISO 4217 code (e.g. 'EUR').

    Returns:
        dict with from_currency, to_currency, rate, source, timestamp, stale.
        On unrecoverable error: dict with error key.
    """
    from_c = from_currency.strip().upper()
    to_c = to_currency.strip().upper()
    cache_key = (from_c, to_c)

    with tracer.start_as_current_span("M4_rate_returned") as span:
        span.set_attribute("from_currency", from_c)
        span.set_attribute("to_currency", to_c)
        try:
            result = _fetch_rate_http(from_c, to_c)
            _rate_cache[cache_key] = {**result, "fetched_at": time.monotonic()}
            logger.info(
                "M4.achieved: rate returned, from=%s, to=%s, rate=%s, source=%s, timestamp=%s",
                from_c, to_c, result["rate"], result["source"], result["timestamp"],
            )
            span.set_attribute("rate", result["rate"])
            return {"from_currency": from_c, "to_currency": to_c,
                    "rate": result["rate"], "source": result["source"],
                    "timestamp": result["timestamp"], "stale": False}
        except Exception as exc:
            logger.warning(
                "M4.missed: rate retrieval failed, from=%s, to=%s, error=%s",
                from_c, to_c, str(exc),
            )
            span.set_attribute("error", str(exc))

        cached = _rate_cache.get(cache_key)
        if cached:
            logger.info("Returning stale cached rate for %s->%s", from_c, to_c)
            return {"from_currency": from_c, "to_currency": to_c,
                    "rate": cached["rate"], "source": cached["source"],
                    "timestamp": cached["timestamp"], "stale": True,
                    "cached_at": cached["timestamp"]}

        return {"error": f"Unable to retrieve rate for {from_c}/{to_c} and no cache available"}
