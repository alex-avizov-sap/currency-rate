using { currency.rate as db } from '../db/schema';

service CurrencyService @(path: '/currency') {

  @readonly
  entity RateCache as projection on db.RateCache;

  action getRate(
    fromCurrency : String(3),
    toCurrency   : String(3)
  ) returns {
    fromCurrency : String(3);
    toCurrency   : String(3);
    rate         : Decimal(18, 8);
    source       : String(100);
    updatedAt    : DateTime;
    isStale      : Boolean;
  };

  action getDefaultRates(
    localCurrency : String(3)
  ) returns array of {
    fromCurrency : String(3);
    toCurrency   : String(3);
    rate         : Decimal(18, 8);
    source       : String(100);
    updatedAt    : DateTime;
    isStale      : Boolean;
  };

  function detectCurrency(
    latitude  : Decimal(9, 6),
    longitude : Decimal(9, 6)
  ) returns {
    country      : String(100);
    currencyCode : String(3);
    currencyName : String(100);
  };
}
