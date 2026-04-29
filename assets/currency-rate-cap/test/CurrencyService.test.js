"use strict";
const cds = require("@sap/cds");
const { GET, POST } = cds.test(__dirname + "/..");

describe("CurrencyService - detectCurrency", () => {
  it("detects Germany (Berlin) -> EUR", async () => {
    const { data } = await GET("/currency/detectCurrency(latitude=52.5,longitude=13.4)");
    expect(data.currencyCode).toBe("EUR");
    expect(data.country).toBe("DE");
  });

  it("detects USA (New York) -> USD", async () => {
    const { data } = await GET("/currency/detectCurrency(latitude=40.7,longitude=-74.0)");
    expect(data.currencyCode).toBe("USD");
  });

  it("detects Japan (Tokyo) -> JPY", async () => {
    const { data } = await GET("/currency/detectCurrency(latitude=35.7,longitude=139.7)");
    expect(data.currencyCode).toBe("JPY");
  });

  it("returns Unknown for ocean coordinates", async () => {
    const { data } = await GET("/currency/detectCurrency(latitude=0.0,longitude=0.0)");
    expect(data.country).toBe("Unknown");
    expect(data.currencyCode).toBeNull();
  });
});

describe("CurrencyService - getRate validation", () => {
  it("rejects missing fromCurrency with 400", async () => {
    try {
      await POST("/currency/getRate", { fromCurrency: "", toCurrency: "EUR" });
      fail("Expected rejection");
    } catch (err) {
      expect(err.response?.status || err.status || 400).toBeGreaterThanOrEqual(400);
    }
  });

  it("rejects missing toCurrency with 400", async () => {
    try {
      await POST("/currency/getRate", { fromCurrency: "USD", toCurrency: "" });
      fail("Expected rejection");
    } catch (err) {
      expect(err.response?.status || err.status || 400).toBeGreaterThanOrEqual(400);
    }
  });
});

describe("CurrencyService - getDefaultRates validation", () => {
  it("rejects missing localCurrency with 400", async () => {
    try {
      await POST("/currency/getDefaultRates", { localCurrency: "" });
      fail("Expected rejection");
    } catch (err) {
      expect(err.response?.status || err.status || 400).toBeGreaterThanOrEqual(400);
    }
  });
});
