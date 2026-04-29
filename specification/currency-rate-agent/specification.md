# Specification: currency-rate-agent

> **Guidelines**: Read [guidelines.md](../guidelines.md) and [guidelines-agent.md](../guidelines-agent.md) before executing ANY tasks below. Follow all constraints described there throughout execution.

## Basic Setup

- [ ] Read `product-requirements-document.md` and `intent.md` for full context before starting
- [ ] Bootstrap agent code in `assets/currency-rate-agent/` using skill `sap-agent-bootstrap` (invoke from inside `assets/currency-rate-agent/`, use copy commands — do NOT create files manually)
- [ ] Install dependencies (`pip install -r requirements.txt`), validate the agent starts and responds at `/.well-known/agent.json`

## Agent Identity & System Prompt

- [ ] Set agent name to `currency-rate-agent` and description to "Conversational AI agent that retrieves real-time currency exchange rates and converts amounts between currencies using natural language queries"
- [ ] Write a system prompt in `app/agent.py` (via `@prompt_section`) that:
  - Instructs the agent to answer currency exchange rate queries in natural language
  - Accepts both country names ("Germany", "Japan") and ISO 4217 currency codes ("EUR", "JPY") as input — map country names to currency codes internally before calling tools
  - Always returns: the exchange rate, the source API name, and the last-updated timestamp
  - When an amount is provided, also returns the converted value
  - When the external API is unavailable, returns the last cached rate with a clear staleness warning
  - If country-to-currency mapping is ambiguous (countries with multiple currencies), asks the user to clarify
  - Strictly prohibits modifying any financial records — agent is read-only

## Country-to-Currency Mapping Tool

- [ ] Create `app/tools/map_country_to_currency_tool.py` with a `map_country_to_currency(country_name: str) -> dict` tool function
- [ ] Embed a comprehensive static dictionary mapping country names (and common aliases) to ISO 4217 currency codes (minimum 50 countries including all G20 nations and common travel destinations)
- [ ] Return `{ "currency_code": "EUR", "currency_name": "Euro", "country": "Germany" }` on success
- [ ] Return `{ "error": "ambiguous", "options": [...] }` for countries with multiple currencies (e.g. territories)
- [ ] Return `{ "error": "not_found", "input": country_name }` for unrecognised country names
- [ ] Add docstring describing parameters and return shape so the LLM can invoke it correctly

## Exchange Rate Retrieval Tool

- [ ] Create `app/tools/get_exchange_rate_tool.py` with a `get_exchange_rate(from_currency: str, to_currency: str) -> dict` tool function
- [ ] Use the Open Exchange Rates API (https://openexchangerates.org) or exchangerate.host (https://api.exchangerate.host/latest) — read `EXCHANGE_RATE_API_KEY` from environment variable (may be empty for free tiers that don't require a key)
- [ ] On success, return `{ "from_currency": "USD", "to_currency": "EUR", "rate": 0.9234, "source": "exchangerate.host", "timestamp": "2026-04-29T10:00:00Z" }`
- [ ] On API error, attempt to return last cached rate from an in-memory cache dict with a `stale: true` flag and `cached_at` timestamp
- [ ] Use standard Python `urllib.request` (no `requests` or `httpx` — those require extra dependencies; use only stdlib unless already in `requirements.txt`)
- [ ] Implement simple in-memory cache: store the last successful response per currency pair in a module-level dict `_rate_cache = {}`; cache TTL of 10 minutes
- [ ] Add docstring describing parameters, return shape, and side effects

## Amount Conversion Tool

- [ ] Create `app/tools/convert_amount_tool.py` with a `convert_amount(amount: float, from_currency: str, to_currency: str) -> dict` tool function
- [ ] Internally call `get_exchange_rate` to retrieve the current rate, then compute `converted = amount * rate`
- [ ] Return `{ "amount": 200.0, "from_currency": "USD", "to_currency": "EUR", "rate": 0.9234, "converted_amount": 184.68, "source": "exchangerate.host", "timestamp": "..." }`
- [ ] Propagate cache/stale information from `get_exchange_rate` in the response
- [ ] Add docstring

## Register Tools in Agent

- [ ] Import and register all three tools (`map_country_to_currency`, `get_exchange_rate`, `convert_amount`) in `app/agent.py` as LangChain-compatible tools
- [ ] Wire tools into the agent graph via `_build_graph(tools, system_prompt=get_system_prompt())`
- [ ] Ensure tools are loaded lazily (not in `__init__`) since no MCP network calls are needed here — return the tool list directly from `_get_tools()`

## Business Step Instrumentation (Milestones M3–M5)

- [ ] Implement OpenTelemetry instrumentation for the agent-side milestones from the PRD:

  **M3 — Currency Pair Queried:**
  - [ ] In the agent's request handling, after parsing a valid currency pair from the user query, emit:
    - `logger.info("M3.achieved: currency pair query received, from=%s, to=%s", from_currency, to_currency)`
    - Span: `@tracer.start_as_current_span("M3_currency_pair_queried")`
  - [ ] On parse failure: `logger.warning("M3.missed: currency pair query could not be parsed, input=%s", user_input)`

  **M4 — Rate Returned:**
  - [ ] In `get_exchange_rate_tool.py`, after a successful rate retrieval:
    - `logger.info("M4.achieved: rate returned, from=%s, to=%s, rate=%s, source=%s, timestamp=%s", ...)`
    - Span: `@tracer.start_as_current_span("M4_rate_returned")`
  - [ ] On failure: `logger.warning("M4.missed: rate retrieval failed, from=%s, to=%s, error=%s", ...)`

  **M5 — Conversion Computed:**
  - [ ] In `convert_amount_tool.py`, after successfully computing a conversion:
    - `logger.info("M5.achieved: conversion computed, amount=%s, from=%s, to=%s, result=%s", ...)`
    - Span: `@tracer.start_as_current_span("M5_conversion_computed")`
  - [ ] On failure: `logger.warning("M5.missed: conversion not computed, amount=%s, error=%s", ...)`

- [ ] Verify `auto_instrument()` is called at the top of `main.py` before any AI framework imports

## Agent Decorators Verification

- [ ] Verify `app/agent.py` has exactly 3 decorated functions from the bootstrap template (`@agent_model`, `@agent_config` for temperature, `@prompt_section`) — run:
  ```bash
  grep -c "^@agent_model\|^@agent_config\|^@prompt_section" assets/currency-rate-agent/app/agent.py
  ```
  Confirm it returns 3. If more than 3, remove the extra decorators.

## Testing

- [ ] Create `tests/test_map_country_to_currency_tool.py`:
  - Test known country → correct ISO code (e.g., "Germany" → "EUR", "Japan" → "JPY", "United States" → "USD")
  - Test ISO code passthrough (if the input is already a valid ISO code, return it as-is)
  - Test unknown country → error dict with `"error": "not_found"`
  - Run immediately after writing: `pytest tests/test_map_country_to_currency_tool.py`

- [ ] Create `tests/test_get_exchange_rate_tool.py`:
  - Mock the HTTP call (patch `urllib.request.urlopen`) to return a fixed response
  - Test successful rate retrieval → correct response shape with `from_currency`, `to_currency`, `rate`, `source`, `timestamp`
  - Test API failure → returns cached rate with `stale: true` (pre-populate cache before test)
  - Test API failure with no cache → returns error dict
  - Run immediately after writing: `pytest tests/test_get_exchange_rate_tool.py`

- [ ] Create `tests/test_convert_amount_tool.py`:
  - Mock `get_exchange_rate` to return a fixed rate
  - Test correct conversion calculation: `amount * rate` matches `converted_amount`
  - Test that stale cache info propagates to conversion response
  - Run immediately after writing: `pytest tests/test_convert_amount_tool.py`

- [ ] Create `tests/test_integration.py`:
  - Write one end-to-end integration test that calls the agent's `invoke` function with a real LLM (AI Core env vars are available)
  - Use query: `"What is the exchange rate from USD to EUR?"`
  - Assert the response contains a numeric rate value and does not raise an exception
  - Mock only the external exchange rate HTTP call (`urllib.request.urlopen`) — never mock the LLM

- [ ] Run full test suite from `assets/currency-rate-agent/`: `pytest`
- [ ] If coverage < 70%, add targeted tests until threshold is met
- [ ] Run `pytest` (no args) one final time to generate `test_report.json`
- [ ] Verify `test_report.json` exists: `ls assets/currency-rate-agent/test_report.json`

## Final Validation

- [ ] Run instrumentation check:
  ```bash
  grep -r "M[0-9]\.achieved" assets/currency-rate-agent/app/
  ```
  Must return results for M3, M4, M5.

- [ ] Run decorator check:
  ```bash
  grep -r "sap_cloud_sdk.agent_decorators" assets/currency-rate-agent/app/
  grep -c "^@agent_model\|^@agent_config\|^@prompt_section" assets/currency-rate-agent/app/agent.py
  ```
  Second command must return `3`.

- [ ] Confirm `test_report.json` exists in `assets/currency-rate-agent/`
