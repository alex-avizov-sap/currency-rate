"use strict";

const https = require("https");
const http = require("http");

// In-memory rate cache: { "USD|EUR": { rate, source, updatedAt, fetchedAt } }
const _rateCache = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Static country-code to currency-code mapping
const COUNTRY_CURRENCY = {
  DE: ["EUR", "Euro"], FR: ["EUR", "Euro"], IT: ["EUR", "Euro"], ES: ["EUR", "Euro"],
  PT: ["EUR", "Euro"], NL: ["EUR", "Euro"], BE: ["EUR", "Euro"], AT: ["EUR", "Euro"],
  FI: ["EUR", "Euro"], GR: ["EUR", "Euro"], IE: ["EUR", "Euro"], HR: ["EUR", "Euro"],
  US: ["USD", "US Dollar"], GB: ["GBP", "British Pound"], JP: ["JPY", "Japanese Yen"],
  CN: ["CNY", "Chinese Yuan"], IN: ["INR", "Indian Rupee"], BR: ["BRL", "Brazilian Real"],
  CA: ["CAD", "Canadian Dollar"], AU: ["AUD", "Australian Dollar"],
  NZ: ["NZD", "New Zealand Dollar"], CH: ["CHF", "Swiss Franc"],
  SE: ["SEK", "Swedish Krona"], NO: ["NOK", "Norwegian Krone"],
  DK: ["DKK", "Danish Krone"], MX: ["MXN", "Mexican Peso"],
  SG: ["SGD", "Singapore Dollar"], HK: ["HKD", "Hong Kong Dollar"],
  KR: ["KRW", "South Korean Won"], RU: ["RUB", "Russian Ruble"],
  ZA: ["ZAR", "South African Rand"], TR: ["TRY", "Turkish Lira"],
  SA: ["SAR", "Saudi Riyal"], AE: ["AED", "UAE Dirham"], QA: ["QAR", "Qatari Riyal"],
  EG: ["EGP", "Egyptian Pound"], NG: ["NGN", "Nigerian Naira"],
  TH: ["THB", "Thai Baht"], MY: ["MYR", "Malaysian Ringgit"],
  ID: ["IDR", "Indonesian Rupiah"], PH: ["PHP", "Philippine Peso"],
  PL: ["PLN", "Polish Zloty"], CZ: ["CZK", "Czech Koruna"],
  RO: ["RON", "Romanian Leu"], HU: ["HUF", "Hungarian Forint"],
  PK: ["PKR", "Pakistani Rupee"], BD: ["BDT", "Bangladeshi Taka"],
  AR: ["ARS", "Argentine Peso"], CL: ["CLP", "Chilean Peso"],
  CO: ["COP", "Colombian Peso"], UA: ["UAH", "Ukrainian Hryvnia"],
  TW: ["TWD", "New Taiwan Dollar"], VN: ["VND", "Vietnamese Dong"],
  IL: ["ILS", "Israeli New Shekel"], KE: ["KES", "Kenyan Shilling"],
  GH: ["GHS", "Ghanaian Cedi"],
};

// Minimal bounding boxes for geolocation country detection
const BOUNDING_BOXES = [
  { code: "US", minLat: 24.5, maxLat: 49.4, minLon: -125.0, maxLon: -66.9 },
  { code: "CA", minLat: 41.7, maxLat: 83.1, minLon: -141.0, maxLon: -52.6 },
  { code: "GB", minLat: 49.9, maxLat: 60.9, minLon: -8.6, maxLon: 1.8 },
  { code: "DE", minLat: 47.3, maxLat: 55.1, minLon: 5.9, maxLon: 15.0 },
  { code: "FR", minLat: 41.3, maxLat: 51.1, minLon: -5.1, maxLon: 9.6 },
  { code: "JP", minLat: 24.0, maxLat: 45.6, minLon: 122.9, maxLon: 153.9 },
  { code: "CN", minLat: 18.2, maxLat: 53.6, minLon: 73.5, maxLon: 135.1 },
  { code: "IN", minLat: 8.1, maxLat: 37.1, minLon: 68.1, maxLon: 97.4 },
  { code: "AU", minLat: -43.6, maxLat: -10.7, minLon: 113.3, maxLon: 153.6 },
  { code: "BR", minLat: -33.8, maxLat: 5.3, minLon: -73.9, maxLon: -34.8 },
  { code: "SG", minLat: 1.2, maxLat: 1.5, minLon: 103.6, maxLon: 104.0 },
  { code: "ZA", minLat: -34.8, maxLat: -22.1, minLon: 16.5, maxLon: 32.9 },
  { code: "TH", minLat: 5.6, maxLat: 20.5, minLon: 97.3, maxLon: 105.6 },
  { code: "TR", minLat: 35.8, maxLat: 42.1, minLon: 25.7, maxLon: 44.8 },
  { code: "SA", minLat: 16.4, maxLat: 32.2, minLon: 36.5, maxLon: 55.7 },
  { code: "AE", minLat: 22.6, maxLat: 26.1, minLon: 51.6, maxLon: 56.4 },
  { code: "NG", minLat: 4.3, maxLat: 13.9, minLon: 2.7, maxLon: 14.7 },
  { code: "EG", minLat: 22.0, maxLat: 31.7, minLon: 24.7, maxLon: 37.1 },
  { code: "PL", minLat: 49.0, maxLat: 54.8, minLon: 14.1, maxLon: 24.2 },
  { code: "IT", minLat: 36.6, maxLat: 47.1, minLon: 6.6, maxLon: 18.5 },
  { code: "ES", minLat: 35.9, maxLat: 43.8, minLon: -9.3, maxLon: 4.3 },
  { code: "NL", minLat: 50.8, maxLat: 53.5, minLon: 3.3, maxLon: 7.2 },
  { code: "SE", minLat: 55.3, maxLat: 69.1, minLon: 11.1, maxLon: 24.2 },
  { code: "NO", minLat: 57.9, maxLat: 71.2, minLon: 4.5, maxLon: 31.1 },
  { code: "CH", minLat: 45.8, maxLat: 47.8, minLon: 6.0, maxLon: 10.5 },
  { code: "KR", minLat: 33.1, maxLat: 38.6, minLon: 126.1, maxLon: 129.6 },
  { code: "MX", minLat: 14.5, maxLat: 32.7, minLon: -117.1, maxLon: -86.7 },
  { code: "AR", minLat: -55.1, maxLat: -21.8, minLon: -73.6, maxLon: -53.6 },
];

function detectCountryCode(lat, lon) {
  for (const bb of BOUNDING_BOXES) {
    if (lat >= bb.minLat && lat <= bb.maxLat && lon >= bb.minLon && lon <= bb.maxLon) {
      return bb.code;
    }
  }
  return null;
}

function fetchRateHttp(fromCurrency, toCurrency) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || "";
    let url = `http://api.exchangerate.host/live?source=${fromCurrency}&currencies=${toCurrency}&format=1`;
    if (apiKey) url += `&access_key=${apiKey}`;

    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.success && parsed.success !== undefined) {
            return reject(new Error(parsed.error?.info || "API error"));
          }
          const key = `${fromCurrency}${toCurrency}`;
          const quotes = parsed.quotes || {};
          if (!(key in quotes)) {
            return reject(new Error(`Rate key '${key}' not found in response`));
          }
          resolve({
            rate: parseFloat(quotes[key]),
            source: "exchangerate.host",
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error("Request timed out"));
    });
  });
}

async function getRateInternal(fromCurrency, toCurrency) {
  const key = `${fromCurrency}|${toCurrency}`;
  const now = Date.now();
  const cached = _rateCache[key];

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, isStale: false };
  }

  try {
    const result = await fetchRateHttp(fromCurrency, toCurrency);
    _rateCache[key] = { ...result, fetchedAt: now };
    console.log(
      `M2.achieved: default rates displayed, from=${fromCurrency}, to=${toCurrency}, ` +
      `rate=${result.rate}, source=${result.source}, timestamp=${result.updatedAt}`
    );
    return { fromCurrency, toCurrency, rate: result.rate, source: result.source, updatedAt: result.updatedAt, isStale: false };
  } catch (err) {
    console.warn(`M2.missed: default rate fetch failed, source=exchangerate.host, error=${err.message}`);
    if (cached) {
      return { fromCurrency, toCurrency, rate: cached.rate, source: cached.source, updatedAt: cached.updatedAt, isStale: true };
    }
    throw err;
  }
}

module.exports = class CurrencyService extends cds.ApplicationService {
  async init() {

    this.on("getRate", async (req) => {
      const { fromCurrency, toCurrency } = req.data;
      if (!fromCurrency || !toCurrency) return req.reject(400, "fromCurrency and toCurrency are required");
      try {
        return await getRateInternal(fromCurrency.toUpperCase(), toCurrency.toUpperCase());
      } catch (err) {
        return req.reject(503, `Unable to retrieve rate for ${fromCurrency}/${toCurrency}: ${err.message}`);
      }
    });

    this.on("getDefaultRates", async (req) => {
      const { localCurrency } = req.data;
      if (!localCurrency) return req.reject(400, "localCurrency is required");
      const lc = localCurrency.toUpperCase();
      try {
        const [usdRate, eurRate] = await Promise.all([
          getRateInternal("USD", lc),
          getRateInternal("EUR", lc),
        ]);
        return [usdRate, eurRate];
      } catch (err) {
        return req.reject(503, `Unable to retrieve default rates: ${err.message}`);
      }
    });

    this.on("detectCurrency", async (req) => {
      const { latitude, longitude } = req.data;
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        console.warn("M1.missed: geolocation failed, falling back to country selector");
        return { country: "Unknown", currencyCode: null, currencyName: null };
      }

      const countryCode = detectCountryCode(lat, lon);
      if (!countryCode || !COUNTRY_CURRENCY[countryCode]) {
        console.warn("M1.missed: geolocation failed, falling back to country selector");
        return { country: "Unknown", currencyCode: null, currencyName: null };
      }

      const [currencyCode, currencyName] = COUNTRY_CURRENCY[countryCode];
      console.log(`M1.achieved: geolocation resolved, country=${countryCode}, currency=${currencyCode}`);
      return { country: countryCode, currencyCode, currencyName };
    });

    await super.init();
  }
};
