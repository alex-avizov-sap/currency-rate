namespace currency.rate;

entity RateCache {
  key fromCurrency : String(3);
  key toCurrency   : String(3);
  rate             : Decimal(18, 8);
  source           : String(100);
  updatedAt        : DateTime;
  isStale          : Boolean default false;
}
