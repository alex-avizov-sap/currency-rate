# Currency Rate Agent

Currency Rate AI Agent with geolocation-aware dashboard and conversational chat

## Business challenge

Users — both finance/treasury staff and general employees or travelers — need quick, accurate currency exchange rate information between countries. The solution must automatically detect the user's browser location and display USD-to-local and EUR-to-local rates by default, while also enabling ad-hoc natural language queries for any currency pair (e.g., "Convert 500 USD to JPY").

## Key Milestones

1. **Browser Geolocation Detected** — User's country and local currency code are resolved from the browser.
2. **Default Rates Displayed** — USD-to-local and EUR-to-local exchange rates are fetched from the external API and shown on the dashboard.
3. **Currency Pair Queried** — User requests a specific currency-pair rate, either via the search UI or through the chat assistant.
4. **Rate Returned** — Agent retrieves the requested rate from the public exchange rate API and returns the result with context (rate, timestamp, source currency/target currency).
5. **Conversion Computed** — Agent calculates and presents a converted amount when the user provides a specific value to convert.

## Business Architecture (RBA)

### End-to-End Process

Finance (FinanceE2E222)

### Process Hierarchy

```
Finance (E2E)
└── Manage Treasury (generic)
    └── Manage payment, cash and risk (generic)
        └── Analyze and implement treasury procedures and policies (BA-2691)
        └── Manage financial risks (BA-2689)
```

### Summary

The currency rate agent maps to the "Manage payment, cash and risk" sub-process within the Finance E2E, supporting treasury staff and employees with real-time FX rate visibility to inform financial decisions and manage currency exposure.

## Fit Gap Analysis

| Requirement (business) | Standard asset(s) found | API ORD ID | MCP Server ORD ID | Gap? | Notes / assumptions |
| ---------------------- | ----------------------- | ---------- | ----------------- | ---- | ------------------- |
| Retrieve real-time currency exchange rates | SAP S/4HANA Cloud – Currency Exchange Rate OData API | `sap.s4:apiResource:CE_CURRENCYEXCHANGERATE_0001:v1` | — | Yes | No MCP server found; user opted for public external API instead |
| Geolocation-based default currency display (USD/EUR to local) | No standard SAP asset | — | — | Yes | Browser Geolocation API (W3C standard) used for country detection; custom implementation required |
| Conversational natural language FX queries | No standard SAP asset | — | — | Yes | Custom AI Agent required; SAP AI Core runtime on BTP |
| Currency pair search / conversion calculator | No standard SAP asset | — | — | Yes | Custom UI required |
| FX risk monitoring / treasury analytics | SAP S/4HANA Cloud – Financial Risk Management (SC170, SC5458); SAP Market Rates Management | `sap.s4:apiResource:CE_FOREIGNEXCHANGEEXPOSURE_0001:v1` | — | Partial | Out of scope for this solution; available for future extension |

### Key findings

- No MCP server is available for the SAP S/4HANA Currency Exchange Rate OData API; user has selected a public external exchange rate API as the data source.
- Browser Geolocation API will be used to detect the user's country; a country-to-currency mapping lookup is required (custom or via the exchange rate provider).
- The solution requires a custom AI Agent (Python, A2A) for conversational FX queries combined with a BTP Extension (React dashboard) for the default-rates UI.
- SAP Market Rates Management exists in the landscape and could serve as a future internal rate source, but is not in scope for this iteration.
- Public exchange rate providers (e.g., exchangerate.host, Open Exchange Rates) offer free/freemium tiers sufficient for the described use case.
- The agent must handle both country-based queries ("USD to Germany") and currency-code queries ("USD to EUR") with intelligent mapping.

## Recommendations

### Currency Rate Agent with Geolocation Dashboard

#### Executive Summary

Build a BTP-hosted React dashboard with an embedded conversational AI Agent (Python, A2A protocol) that automatically detects the user's browser location, displays USD-to-local and EUR-to-local rates by default, and answers free-form FX queries in natural language using a public exchange rate API.

#### Recommended Solution

A two-component solution deployed on SAP BTP:
1. **AI Agent (Python, A2A)**: A conversational agent powered by SAP AI Core that accepts natural language currency queries, maps country names to ISO currency codes, calls a public exchange rate API (e.g., exchangerate.host or Open Exchange Rates), and returns formatted rate and conversion results.
2. **BTP Extension (CAP + React)**: A web application that uses the W3C Geolocation API (or IP-based fallback) to detect the user's country, maps it to a currency code, fetches and displays the USD-to-local and EUR-to-local default rates, and embeds the AI Agent chat interface for on-demand queries.

External dependency: A public exchange rate API (free/freemium tier) such as exchangerate.host or Open Exchange Rates.

#### Problem Statement

Finance staff and employees frequently need current FX rates for decision-making, expense reporting, and travel planning. There is no lightweight, geolocation-aware currency rate tool that combines a real-time dashboard with a conversational assistant, forcing users to rely on manual lookups across multiple external websites.

#### Affected User Roles

- Finance / Treasury Analyst
- Employee / Business Traveler
- Procurement / Accounts Payable Specialist

#### Important factors

##### Geolocation-based personalisation
The browser Geolocation API (with IP-based fallback) removes the need for manual country selection, delivering relevant default rates immediately on load, improving user experience.

##### Conversational interface reduces lookup friction
Natural language queries ("What is 200 EUR in Thai Baht?") eliminate the need to know ISO currency codes, broadening accessibility to non-finance users.

##### Public API dependency
The solution depends on a third-party exchange rate provider. Rate freshness, API availability, and free-tier rate limits must be managed; a fallback or caching strategy is recommended.

#### Potential risks

##### Third-party API reliability
Public exchange rate APIs may have uptime SLAs below enterprise standards. A caching layer (e.g., in-memory or CAP persistence) should be implemented to serve last-known rates during outages.

##### Geolocation accuracy
Browser geolocation accuracy varies; IP-based geolocation can mis-identify country for VPN users. The UI should allow users to override the detected country.

#### Recommended solution category

AI Agent, BTP Extension

#### Intent fit
88%
