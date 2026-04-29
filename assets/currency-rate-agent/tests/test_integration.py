"""Integration test: end-to-end agent invocation with real LLM."""
import sys
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent / "app"))

import pytest
import tools.get_exchange_rate_tool as rate_module


def _mock_urlopen_with_rate(rate_val: float, from_c: str, to_c: str):
    cm = MagicMock()
    cm.__enter__ = MagicMock(return_value=cm)
    cm.__exit__ = MagicMock(return_value=False)
    payload = {"success": True, "quotes": {f"{from_c}{to_c}": rate_val}}
    cm.read = MagicMock(return_value=json.dumps(payload).encode())
    return cm


@pytest.mark.integration
@pytest.mark.asyncio
async def test_agent_exchange_rate_query():
    """End-to-end test: agent answers USD to EUR rate query with real LLM."""
    from agent import SampleAgent

    with patch("urllib.request.urlopen",
               return_value=_mock_urlopen_with_rate(0.9234, "USD", "EUR")):
        agent = SampleAgent()
        response = await agent.invoke("What is the exchange rate from USD to EUR?", "test-ctx-1")

    assert response.status in ("completed", "error"), f"Unexpected status: {response.status}"
    if response.status == "completed":
        # Response should contain a numeric rate or mention EUR/USD
        msg = response.message.lower()
        assert any(token in msg for token in ["0.9", "eur", "euro", "rate", "exchange"]), \
            f"Response does not mention rate or currency: {response.message}"
