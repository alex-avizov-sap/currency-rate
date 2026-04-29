# Specification: currency-rate-cap

> **Guidelines**: Read [guidelines.md](../guidelines.md) and [guidelines-cap.md](../guidelines-cap.md) before executing ANY tasks below. Follow all constraints described there throughout execution.

## Basic Setup

- [ ] Read `product-requirements-document.md` and `intent.md` for full context before starting
- [ ] Invoke the `cap-development` skill from `assets/currency-rate-cap/` to set up the CAP project structure
- [ ] Install dependencies (`npm install`), validate the project starts (`cds watch`) and responds on port 4004

## CDS Data Model

- [ ] Create `db/schema.cds` with the following entity:
  ```cds
  namespace currency.rate;

  entity RateCache {
    key fromCurrency : String(3);
    key toCurrency   : String(3);
    rate             : Decimal(18, 8);
    source           : String(100);
    updatedAt        : DateTime;
    isStale          : Boolean default false;
  }
  ```
- [ ] Run `cds compile db/` to validate the model

## CDS Service Definition

- [ ] Create `srv/currency-service.cds` exposing:
  - Entity `RateCache` as read-only (no `create`, `update`, `delete` actions via the API — managed internally by the proxy handler)
  - Action `getRate(fromCurrency: String, toCurrency: String) returns { rate: Decimal, source: String, updatedAt: DateTime, isStale: Boolean }`
  - Action `getDefaultRates(localCurrency: String) returns array of { fromCurrency: String, toCurrency: String, rate: Decimal, source: String, updatedAt: DateTime, isStale: Boolean }`
  - Function (GET) `detectCurrency(latitude: Decimal, longitude: Decimal) returns { country: String, currencyCode: String, currencyName: String }` — resolves coordinates to a country and maps to ISO 4217 currency code using a static lookup table
- [ ] Run `cds compile srv/` to validate

## Exchange Rate Proxy Handler

- [ ] Create `srv/currency-handler.js` implementing custom logic for the service actions:

  **`getRate` action:**
  - Check the `RateCache` entity for a cached rate not older than 10 minutes
  - If fresh cache exists: return it with `isStale: false`
  - If cache is stale or missing: call the public exchange rate API (https://api.exchangerate.host/latest or Open Exchange Rates) using Node.js built-in `https` module (no `axios` or `node-fetch` — use only built-in `https`)
  - Read the API key from `process.env.EXCHANGE_RATE_API_KEY` (may be empty for free endpoints)
  - On success: upsert the `RateCache` entity and return the fresh rate
  - On API failure: return the stale cached rate with `isStale: true`; if no cache exists, throw a 503 error with message "Exchange rate service unavailable"

  **`getDefaultRates` action:**
  - Accept `localCurrency` (ISO 4217 code)
  - Call `getRate("USD", localCurrency)` and `getRate("EUR", localCurrency)` in parallel (`Promise.all`)
  - Return both results as an array

  **`detectCurrency` function:**
  - Accept `latitude` and `longitude`
  - Use a minimal static bounding-box lookup to resolve coordinates to a country code (ISO 3166-1 alpha-2)
  - Map country code to ISO 4217 currency code using a static table (minimum 50 countries)
  - Return `{ country, currencyCode, currencyName }`
  - If coordinates cannot be resolved, return `{ country: "Unknown", currencyCode: null, currencyName: null }`

- [ ] Run `cds watch` and test with curl:
  ```bash
  curl -X POST http://localhost:4004/odata/v4/CurrencyService/getRate \
    -H "Content-Type: application/json" \
    -d '{"fromCurrency":"USD","toCurrency":"EUR"}'
  ```

## Milestone Logging (M1 and M2 — Server-Side)

- [ ] In `getDefaultRates` handler, after successfully returning both default rates, log:
  - `console.log("M2.achieved: default rates displayed, USD_rate=%s, EUR_rate=%s, source=%s, timestamp=%s", usdRate, eurRate, source, timestamp)`
  - On failure: `console.warn("M2.missed: default rate fetch failed, source=%s, error=%s", source, error.message)`
- [ ] In `detectCurrency` handler, after successfully resolving coordinates to a currency code, log:
  - `console.log("M1.achieved: geolocation resolved, country=%s, currency=%s", country, currencyCode)`
  - On failure: `console.warn("M1.missed: geolocation failed, falling back to country selector")`

## React UI

- [ ] Invoke the `cap-development` skill to scaffold the React frontend in `assets/currency-rate-cap/ui/`
- [ ] Implement the following UI components using SAP UI5 Web Components for React (`@ui5/webcomponents-react`):

  **`GeolocationService.js`** — utility module:
  - Call `navigator.geolocation.getCurrentPosition` to get latitude/longitude
  - On success: POST to `detectCurrency` OData action with coordinates → get `currencyCode`
  - On failure (permission denied, timeout): fall back to IP geolocation using `https://ipapi.co/json/` (fetch only `country_code`); then call `detectCurrency` with country code only (add a second function signature that accepts country code directly)
  - If both fail: return `null` to trigger the country selector UI

  **`DefaultRateCards.jsx`** — main dashboard component:
  - On mount: call `GeolocationService` to detect local currency
  - If detection succeeds: call `getDefaultRates(localCurrency)` via OData action
  - Render two `<ui5-card>` components side by side:
    - Card 1: "USD → {localCurrency}" with rate value, source, and last-updated timestamp
    - Card 2: "EUR → {localCurrency}" with rate value, source, and last-updated timestamp
  - If rates are stale (`isStale: true`): show a `<ui5-message-strip>` warning banner: "Showing cached rates from {timestamp} — live rates unavailable"
  - If detection fails: render the `CountrySelector` component instead

  **`CountrySelector.jsx`** — country override/fallback component:
  - Render a `<ui5-combobox>` populated with the full country list (at least 50 entries)
  - On selection: resolve country to currency code (call `detectCurrency` via OData or use client-side static map) and trigger `DefaultRateCards` refresh
  - This component is also shown as a persistent "Override location" control in the header when geolocation succeeds

  **`CurrencySearch.jsx`** — currency pair search component:
  - Render a search bar with two `<ui5-input>` fields: "From" and "To" (accept country name or ISO code)
  - "Search" button: POST to `getRate` OData action with the entered pair
  - Display result in a `<ui5-card>`: rate, source, timestamp; stale warning if `isStale: true`

  **`ChatPanel.jsx`** — embedded AI agent chat:
  - Render a collapsible side panel with a `<ui5-textarea>` for input and a message list for conversation history
  - On user submit: POST the query to the AI agent endpoint (`currency-rate-agent`) via A2A protocol
  - Display agent responses in the message list with sender labels ("You" / "Assistant")
  - Show a `<ui5-busy-indicator>` while waiting for the agent response
  - Configure the agent endpoint URL from `process.env.REACT_APP_AGENT_URL` (fallback: `http://localhost:8080`)

  **`App.jsx`** — root component:
  - Layout: header bar with app title "Currency Rates" and the `CountrySelector` override control
  - Main content: `DefaultRateCards` occupying the top half, `CurrencySearch` below
  - Right side panel: `ChatPanel` (toggleable via a floating action button)

- [ ] Build the React UI: `npm run build` from `assets/currency-rate-cap/ui/`
- [ ] Verify the compiled output lands in `assets/currency-rate-cap/app/`

## Backend Tests

- [ ] Write `test/currency-handler.test.js`:
  - Test `getRate`: mock `https.get` to return a fixed rate JSON; assert response shape matches `{ rate, source, updatedAt, isStale }`
  - Test `getRate` cache hit: pre-insert a fresh `RateCache` entry via `cds.run`; assert handler returns cached value without calling `https.get`
  - Test `getRate` API failure with stale cache: mock `https.get` to throw; assert stale cache is returned with `isStale: true`
  - Test `getDefaultRates`: mock `getRate` to return fixed rates for USD and EUR; assert array length is 2
  - Test `detectCurrency`: provide coordinates within Germany bounding box; assert `currencyCode: "EUR"`
- [ ] Run `cds watch` and `npm test` from `assets/currency-rate-cap/` — all tests must pass

## Final Validation

- [ ] Run `cds compile srv/` — no errors
- [ ] Run `cds watch` and confirm service responds on port 4004
- [ ] Curl both actions and verify JSON shape:
  ```bash
  curl -X POST http://localhost:4004/odata/v4/CurrencyService/getDefaultRates \
    -H "Content-Type: application/json" \
    -d '{"localCurrency":"EUR"}'
  ```
- [ ] Confirm React UI builds without errors: `npm run build` from `assets/currency-rate-cap/ui/`
- [ ] Confirm milestone log lines M1 and M2 appear in `cds watch` output when actions are triggered
