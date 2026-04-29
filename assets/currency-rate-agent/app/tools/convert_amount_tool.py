"""Tool: convert_amount - Converts a monetary amount between currencies."""
import json
import logging
from opentelemetry import trace
from langchain_core.tools import tool
from tools.get_exchange_rate_tool import get_exchange_rate

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tool
def convert_amount(amount: float, from_currency: str, to_currency: str) -> dict:
    """Convert a monetary amount from one currency to another.

    Retrieves the current exchange rate and computes the converted value.

    Args:
        amount: Monetary amount to convert (e.g. 200.0).
        from_currency: Source ISO 4217 code (e.g. 'USD').
        to_currency: Target ISO 4217 code (e.g. 'EUR').

    Returns:
        dict with amount, from_currency, to_currency, rate, converted_amount, source, timestamp, stale.
        On error: dict with error key.
    """
    from_c = from_currency.strip().upper()
    to_c = to_currency.strip().upper()

    with tracer.start_as_current_span("M5_conversion_computed") as span:
        span.set_attribute("amount", amount)
        span.set_attribute("from_currency", from_c)
        span.set_attribute("to_currency", to_c)

        rate_result = get_exchange_rate.invoke({"from_currency": from_c, "to_currency": to_c})

        if isinstance(rate_result, str):
            try:
                rate_result = json.loads(rate_result)
            except Exception:
                logger.warning("M5.missed: conversion not computed, amount=%s, error=parse_failed", amount)
                span.set_attribute("error", "parse_failed")
                return {"error": "Could not parse rate result"}

        if "error" in rate_result:
            err = rate_result["error"]
            logger.warning("M5.missed: conversion not computed, amount=%s, error=%s", amount, err)
            span.set_attribute("error", err)
            return {"error": err}

        rate = rate_result["rate"]
        converted = round(amount * rate, 4)

        logger.info(
            "M5.achieved: conversion computed, amount=%s, from=%s, to=%s, result=%s",
            amount, from_c, to_c, converted,
        )
        span.set_attribute("converted_amount", converted)
        span.set_attribute("rate", rate)

        return {
            "amount": amount, "from_currency": from_c, "to_currency": to_c,
            "rate": rate, "converted_amount": converted,
            "source": rate_result.get("source", "unknown"),
            "timestamp": rate_result.get("timestamp", ""),
            "stale": rate_result.get("stale", False),
        }
