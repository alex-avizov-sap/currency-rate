# Product Requirements Document (PRD)

**Title:** Currency Rate Agent  
**Date:** 2026-04-29  
**Owner:** Product Owner  
**Solution Category:** AI Agent, BTP Extension

---

## Product Purpose & Value Proposition

**Elevator Pitch:**  
Finance staff and employees waste time hunting for current exchange rates across external websites. This solution delivers a geolocation-aware dashboard that instantly shows USD-to-local and EUR-to-local rates on load, plus an embedded AI assistant that answers any free-form currency query in natural language — all in one place, on SAP BTP.

**Business Need:**  
There is no lightweight, personalised currency tool that combines real-time default rates (driven by the user's browser location) with conversational FX lookups. Users — from treasury analysts to business travelers — currently rely on manual searches, leading to inefficiency and inconsistent rate information.

**Expected Value:**  
- Immediate FX visibility without manual country/currency selection.  
- Reduced time-to-answer for currency conversion queries across all employee groups.  
- Consistent, sourced exchange rate data for business decisions and expense reporting.

**Product Objectives (Prioritized):**
1. Auto-detect the user's location and display USD-to-local and EUR-to-local rates on page load without any user action.
2. Enable conversational natural language FX queries ("Convert 200 EUR to JPY") answered instantly by the AI agent.
3. Allow users to override the detected country and search for any currency pair via the dashboard UI.

---

## User Profiles & Personas

### Primary Persona: Alex — Finance / Treasury Analyst

Alex is a 34-year-old treasury analyst at a multinational company. He monitors FX exposure daily and needs quick access to live rates when reviewing hedging positions, approving invoices in foreign currencies, or briefing management. He is comfortable with SAP tools and expects accurate, sourced data. His pain point is toggling between S/4HANA, external rate sites, and Bloomberg just to answer simple "what's the rate today?" questions.

### Secondary Persona: Maria — Business Traveler / Employee

Maria is a 28-year-old sales consultant who travels frequently across regions. She checks currency rates for per-diem planning, client entertainment budgets, and personal travel. She is not familiar with ISO currency codes and prefers typing "What is 100 USD in Thai Baht?" over using financial tools. Her pain point is relying on consumer apps that show ads and lack reliability.

### Other User Types

- Procurement / Accounts Payable Specialist: needs current FX rates when processing cross-currency purchase orders.
- IT Administrator: manages BTP deployment, API key rotation, and monitoring dashboards.

---

## User Goals & Tasks

### For Alex (Finance / Treasury Analyst):

**Goals:**
- View up-to-date USD and EUR rates against his local currency without switching applications.
- Look up historical or current rates for specific currency pairs quickly.

**Key Tasks:**
- Open the dashboard and immediately see USD-to-local and EUR-to-local rates.
- Ask the assistant: "What is the EUR/USD rate today?"
- Override the detected country to check rates for a different business entity location.

### For Maria (Business Traveler):

**Goals:**
- Quickly find out how much her local currency is worth in a destination country's currency.
- Convert specific amounts without knowing currency codes.

**Key Tasks:**
- Open the dashboard and see USD-to-local rate on arrival.
- Type "How much is 500 USD in Thai Baht?" into the chat assistant.
- Search for a specific currency pair from the dashboard search bar.

---

## Product Principles

1. **Location-first**: Default to the user's context; don't ask what the user already knows (their location).
2. **Natural language over codes**: Accept country names and plain language; translate to currency codes internally.
3. **Graceful degradation**: When the external rate API is unavailable, serve last-cached rates with a clear timestamp and warning.
4. **Transparency**: Always show the rate source and the timestamp of the last update.

---

## Goals and Non-Goals

### Goals (In Scope)

- Detect the user's country via browser Geolocation API (with IP-based fallback).
- Display USD-to-local and EUR-to-local exchange rates by default on page load.
- Allow users to override the detected country from the UI.
- Provide a search/query UI for arbitrary currency pair lookups.
- Support conversational natural language queries via an embedded AI agent chat panel.
- Accept both country names ("Germany") and ISO currency codes ("EUR") as input.
- Display converted amounts when a specific value is provided (e.g., "500 USD in EUR").
- Cache last-known rates to serve during external API outages.

### Non-Goals (Out of Scope)

- Integration with SAP S/4HANA internal exchange rates (not in scope for this iteration).
- Historical rate charts or trend analysis.
- FX risk monitoring, hedging workflows, or treasury position management.
- Multi-currency portfolio calculations.
- Rate alerts or notifications.

---

## Requirements

### Must-Have Requirements

**R1: Geolocation-Based Default Rate Display**

- **Problem to Solve**: Users must manually select their country on every visit, causing friction.
- **User Story**: As an employee, I need the dashboard to detect my location automatically so that I see relevant USD and EUR rates without any manual setup.
- **Acceptance Criteria**:
  - Given the user opens the app, when the browser Geolocation API resolves, then the app maps the country to a currency code and fetches USD-to-local and EUR-to-local rates.
  - Given the Geolocation API fails, when the app falls back to IP geolocation, then the default rates are still displayed.
  - Given both geolocation methods fail, when the app loads, then a country selector is shown.
- **Maps to Objective**: Objective 1
- **Priority Rank**: 1

**R2: Currency Pair Search**

- **Problem to Solve**: Users need to look up rates for pairs beyond the two defaults.
- **User Story**: As a finance analyst, I need to search for any currency pair so that I can look up rates relevant to specific business transactions.
- **Acceptance Criteria**:
  - Given the user enters a currency pair (by country name or ISO code), when they submit, then the current exchange rate is displayed with source and timestamp.
  - Given the user enters a country name, when they submit, then the system maps it to the correct ISO currency code automatically.
- **Maps to Objective**: Objective 3
- **Priority Rank**: 2

**R3: Conversational Natural Language FX Queries**

- **Problem to Solve**: Users unfamiliar with currency codes cannot efficiently use code-based search interfaces.
- **User Story**: As a business traveler, I need to ask currency questions in plain language so that I can get rate information without knowing ISO codes.
- **Acceptance Criteria**:
  - Given the user types "What is 200 EUR in Japanese Yen?", when submitted to the chat panel, then the agent returns the exchange rate and the converted amount.
  - Given the user types "USD to Germany", when submitted, then the agent maps "Germany" to "EUR" and returns the rate.
  - Given the external rate API is unavailable, when queried, then the agent returns the last cached rate with a clear warning.
- **Maps to Objective**: Objective 2
- **Priority Rank**: 3

**R4: Amount Conversion**

- **Problem to Solve**: Users need to convert specific amounts, not just see raw rates.
- **User Story**: As an employee, I need to convert a specific monetary amount between currencies so that I can plan expenses accurately.
- **Acceptance Criteria**:
  - Given the user provides an amount and two currencies, when the agent processes the query, then it returns both the rate and the converted amount.
- **Maps to Objective**: Objective 2
- **Priority Rank**: 4

**R5: Country Override**

- **Problem to Solve**: Auto-detected location may be incorrect (e.g., VPN users) or the user needs rates for a different country.
- **User Story**: As a finance analyst, I need to manually override the detected country so that I can view rates for the correct business location.
- **Acceptance Criteria**:
  - Given the dashboard is loaded, when the user selects a different country from the override selector, then the default rates update to reflect the new country's currency.
- **Maps to Objective**: Objective 3
- **Priority Rank**: 5

---

## Non-Functional Requirements

### Performance

- **Latency**: Dashboard default rates visible within 2 seconds of page load; chat responses within 5 seconds at 95th percentile.
- **Throughput**: Support up to 200 concurrent users.

### Reliability

- **Availability**: 99% uptime target for the BTP-hosted application.
- **Fallback**: When the external exchange rate API is unavailable, serve the last cached rates with a visible timestamp and warning banner.

### Cost

- **External API**: Use a free or freemium tier of the external exchange rate provider; implement caching to minimise API calls.

### Explainability

- **Transparency**: All displayed rates must include source name and last-updated timestamp.
- **Decision Logging**: AI agent logs all tool calls, country-to-currency mappings, and rate retrieval results.

---

## Solution Architecture

**Architecture Overview:**  
A two-component solution deployed on SAP BTP. A React frontend (served via a CAP application) handles the dashboard UI, geolocation, and country override. An embedded chat panel communicates with a Python-based AI Agent (A2A protocol, deployed on SAP App Foundation) that resolves currency queries by calling a public exchange rate REST API.

**Key Components:**

- **React Dashboard (BTP Extension)**: Geolocation detection, default rate display cards (USD-to-local, EUR-to-local), currency pair search, country override selector, embedded chat panel.
- **CAP Backend**: Serves the React app, proxies exchange rate API calls (to avoid CORS and protect API keys), and caches last-known rates.
- **AI Agent (Python, A2A)**: Conversational agent that accepts natural language queries, maps country/currency names to ISO codes, calls the exchange rate API via a registered tool, and returns structured FX responses.
- **Public Exchange Rate API**: External provider (e.g., exchangerate.host or Open Exchange Rates) supplying live FX data.

**Integration Points:**

- CAP Backend → Public Exchange Rate API: REST GET, on-demand with response caching.
- React Dashboard → CAP Backend: OData / REST for rate data and app serving.
- Chat Panel → AI Agent (A2A): natural language query/response over A2A protocol.

**Deployment Environments:**

- Dev/QA: BTP dev space, mock or sandbox exchange rate API responses.
- Production: BTP production space, live exchange rate API with API key managed via BTP credential store.

---

### Agent Extensibility & Instrumentation

**Agent Extensibility:**
- The agent must be designed with extension points to allow adding new tools (e.g., historical rates, cryptocurrency rates, SAP S/4HANA internal rates) without modifying core agent logic.
- Tool registration must follow the A2A / App Foundation extension pattern so future capabilities can be added declaratively.

**Business Step Instrumentation:**
- All five business milestones (M1–M5) must emit structured log statements upon achievement or when skipped/failed.
- Log format: `[MILESTONE_ID].[achieved|missed]: [description]`
- Instrumentation enables production monitoring of agent behavior and business step completion rates.

---

### Automation & Agent Behaviour

**Automation Level:** Autonomous agent (for conversational FX queries); rule-based (for geolocation and default rate display).

**Actions the system performs without human approval:**
- Detecting browser geolocation and resolving to a currency code.
- Fetching exchange rates from the public API.
- Performing currency conversion calculations.
- Returning FX query results to the user.

**Actions that require human review or approval:**
- None for this solution — all actions are read-only, informational, and low risk.

**Model or engine used:** GPT-4o (or equivalent) via SAP Generative AI Hub on SAP AI Core.

**Knowledge & data sources accessed:**

- Public Exchange Rate API: live FX rate data (read-only, third-party, no PII).
- Country-to-currency mapping table: static reference data embedded in the agent.

**Tools or connectors invoked:**

- `get_exchange_rate(from_currency, to_currency)`: fetches current rate from the external API (read-only).
- `convert_amount(amount, from_currency, to_currency)`: computes converted value using the fetched rate (read-only, no side effects).
- `map_country_to_currency(country_name)`: maps a country name to an ISO 4217 currency code (read-only, local lookup).

**Guardrails & fail-safes:**

- Agent is strictly read-only; no financial records are modified.
- If the external API returns an error, the agent informs the user and returns the last cached rate with a staleness warning.
- If country-to-currency mapping is ambiguous (e.g., countries with multiple currencies), the agent asks the user to clarify.

---

## Milestones

### M1: Browser Geolocation Detected

- **Description**: The user's country and local currency code are resolved from the browser (or IP fallback).
- **Achieved when**: The app successfully maps the user's browser/IP location to a valid ISO 4217 currency code.
- **Log on achievement**: `M1.achieved: geolocation resolved, country={country}, currency={currency_code}`
- **Log on miss**: `M1.missed: geolocation failed, falling back to country selector`

### M2: Default Rates Displayed

- **Description**: USD-to-local and EUR-to-local exchange rates are fetched and displayed on the dashboard.
- **Achieved when**: Both rate cards are populated with current or cached rate values on page load.
- **Log on achievement**: `M2.achieved: default rates displayed, USD_rate={rate}, EUR_rate={rate}, source={api}, timestamp={ts}`
- **Log on miss**: `M2.missed: default rate fetch failed, source={api}, error={error_message}`

### M3: Currency Pair Queried

- **Description**: A user requests a specific currency-pair rate via search UI or the chat assistant.
- **Achieved when**: The agent or UI receives a valid currency pair query and initiates a rate lookup.
- **Log on achievement**: `M3.achieved: currency pair query received, from={from_currency}, to={to_currency}`
- **Log on miss**: `M3.missed: currency pair query could not be parsed, input={user_input}`

### M4: Rate Returned

- **Description**: The agent retrieves and returns the requested exchange rate with metadata.
- **Achieved when**: A valid rate value with source and timestamp is returned to the user.
- **Log on achievement**: `M4.achieved: rate returned, from={from_currency}, to={to_currency}, rate={rate}, source={api}, timestamp={ts}`
- **Log on miss**: `M4.missed: rate retrieval failed, from={from_currency}, to={to_currency}, error={error_message}`

### M5: Conversion Computed

- **Description**: The agent calculates and presents a converted amount when the user provides a specific value.
- **Achieved when**: A converted amount is returned alongside the rate used for conversion.
- **Log on achievement**: `M5.achieved: conversion computed, amount={amount}, from={from_currency}, to={to_currency}, result={converted_amount}`
- **Log on miss**: `M5.missed: conversion not computed, amount={amount}, error={error_message}`

---

## Risks, Assumptions, and Dependencies

### Risks

- **Third-party API reliability**: Public exchange rate APIs may experience downtime or introduce breaking changes. Mitigation: implement response caching and monitor API status.
- **Geolocation inaccuracy**: VPN users or restricted browser permissions may yield incorrect location. Mitigation: country override UI.
- **Free-tier rate limits**: High usage may exceed free-tier API call quotas. Mitigation: caching strategy and rate limiting per user session.

### Assumptions (Validate These)

- A public exchange rate API free tier is sufficient for the expected user volume.
- SAP AI Core (Generative AI Hub) is available in the target BTP subaccount.
- Browser Geolocation API is available and permitted by corporate security policy.

### Dependencies

- SAP BTP subaccount with Cloud Foundry runtime or SAP App Foundation.
- SAP AI Core service with Generative AI Hub access.
- Public exchange rate API account and API key (to be provisioned before development).

---

## Appendix

### Glossary

- **ISO 4217**: International standard for currency codes (e.g., USD, EUR, JPY).
- **A2A Protocol**: Agent-to-Agent communication protocol used by SAP App Foundation agents.
- **Geolocation API**: W3C browser API that returns the user's geographic coordinates; used here to infer country.
- **Freemium API**: Exchange rate provider with a free tier sufficient for moderate query volumes.

### References

- SAP App Foundation Agent Runtime documentation
- SAP BTP Cloud Foundry deployment guide
- W3C Geolocation API specification
- Open Exchange Rates API: https://openexchangerates.org
- exchangerate.host API: https://exchangerate.host
