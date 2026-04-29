# Specification

> **Guidelines**: Read [guidelines.md](./guidelines.md) before executing ANY tasks below.

Check off items as completed.

## Solution Setup

- [ ] Create asset directories:
  ```bash
  mkdir -p assets/currency-rate-agent/ assets/currency-rate-cap/
  ```
- [ ] Invoke `setup-solution` skill to create `solution.yaml` and `asset.yaml` files for every asset (`currency-rate-agent` and `currency-rate-cap`)
- [ ] Validate all `asset.yaml` and `solution.yaml` files exist and are well-formed

## Asset Implementation

- [ ] Execute `specification/currency-rate-agent/specification.md` (all items) — AI Agent (Python, A2A)
- [ ] Execute `specification/currency-rate-cap/specification.md` (all items) — BTP Extension (CAP + React)

## Cross-Implementation Compatibility Check

- [ ] Verify the `ChatPanel.jsx` agent endpoint URL (`REACT_APP_AGENT_URL`) matches the port and base path the `currency-rate-agent` exposes (`/.well-known/agent.json` and A2A invoke endpoint)
- [ ] Verify the `getRate` / `getDefaultRates` / `detectCurrency` OData action paths used in the React UI match the service definitions in `currency-rate-cap/srv/currency-service.cds`
- [ ] Verify both assets reference the same exchange rate API base URL and environment variable name (`EXCHANGE_RATE_API_KEY`) to ensure consistent configuration
- [ ] Confirm milestone log patterns are consistent: M1/M2 emitted from the CAP backend, M3/M4/M5 emitted from the agent; no duplicate milestone IDs across assets
- [ ] Run `cds watch` (CAP) and agent `python main.py` (agent) simultaneously in dev to confirm both start without errors
