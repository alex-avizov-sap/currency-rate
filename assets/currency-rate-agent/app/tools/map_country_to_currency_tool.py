"""Tool: map_country_to_currency - Maps country names to ISO 4217 currency codes."""
import logging
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

_COUNTRY_MAP = {
    "argentina": ("ARS", "Argentine Peso"), "australia": ("AUD", "Australian Dollar"),
    "austria": ("EUR", "Euro"), "belgium": ("EUR", "Euro"), "brazil": ("BRL", "Brazilian Real"),
    "canada": ("CAD", "Canadian Dollar"), "chile": ("CLP", "Chilean Peso"),
    "china": ("CNY", "Chinese Yuan"), "colombia": ("COP", "Colombian Peso"),
    "czech republic": ("CZK", "Czech Koruna"), "czechia": ("CZK", "Czech Koruna"),
    "denmark": ("DKK", "Danish Krone"), "egypt": ("EGP", "Egyptian Pound"),
    "finland": ("EUR", "Euro"), "france": ("EUR", "Euro"), "germany": ("EUR", "Euro"),
    "greece": ("EUR", "Euro"), "hong kong": ("HKD", "Hong Kong Dollar"),
    "hungary": ("HUF", "Hungarian Forint"), "india": ("INR", "Indian Rupee"),
    "indonesia": ("IDR", "Indonesian Rupiah"), "ireland": ("EUR", "Euro"),
    "israel": ("ILS", "Israeli New Shekel"), "italy": ("EUR", "Euro"),
    "japan": ("JPY", "Japanese Yen"), "jordan": ("JOD", "Jordanian Dinar"),
    "kenya": ("KES", "Kenyan Shilling"), "malaysia": ("MYR", "Malaysian Ringgit"),
    "mexico": ("MXN", "Mexican Peso"), "netherlands": ("EUR", "Euro"),
    "new zealand": ("NZD", "New Zealand Dollar"), "nigeria": ("NGN", "Nigerian Naira"),
    "norway": ("NOK", "Norwegian Krone"), "pakistan": ("PKR", "Pakistani Rupee"),
    "philippines": ("PHP", "Philippine Peso"), "poland": ("PLN", "Polish Zloty"),
    "portugal": ("EUR", "Euro"), "qatar": ("QAR", "Qatari Riyal"),
    "romania": ("RON", "Romanian Leu"), "russia": ("RUB", "Russian Ruble"),
    "saudi arabia": ("SAR", "Saudi Riyal"), "singapore": ("SGD", "Singapore Dollar"),
    "south africa": ("ZAR", "South African Rand"), "south korea": ("KRW", "South Korean Won"),
    "korea": ("KRW", "South Korean Won"), "spain": ("EUR", "Euro"),
    "sweden": ("SEK", "Swedish Krona"), "switzerland": ("CHF", "Swiss Franc"),
    "taiwan": ("TWD", "New Taiwan Dollar"), "thailand": ("THB", "Thai Baht"),
    "turkey": ("TRY", "Turkish Lira"), "turkiye": ("TRY", "Turkish Lira"),
    "ukraine": ("UAH", "Ukrainian Hryvnia"), "united arab emirates": ("AED", "UAE Dirham"),
    "uae": ("AED", "UAE Dirham"), "united kingdom": ("GBP", "British Pound"),
    "uk": ("GBP", "British Pound"), "great britain": ("GBP", "British Pound"),
    "england": ("GBP", "British Pound"), "united states": ("USD", "US Dollar"),
    "usa": ("USD", "US Dollar"), "us": ("USD", "US Dollar"),
    "america": ("USD", "US Dollar"), "vietnam": ("VND", "Vietnamese Dong"),
    "bahrain": ("BHD", "Bahraini Dinar"), "bangladesh": ("BDT", "Bangladeshi Taka"),
    "croatia": ("EUR", "Euro"), "ghana": ("GHS", "Ghanaian Cedi"),
    "sri lanka": ("LKR", "Sri Lankan Rupee"),
}

_VALID_ISO_CODES = {
    "AED": "UAE Dirham", "ARS": "Argentine Peso", "AUD": "Australian Dollar",
    "BDT": "Bangladeshi Taka", "BHD": "Bahraini Dinar", "BRL": "Brazilian Real",
    "CAD": "Canadian Dollar", "CHF": "Swiss Franc", "CLP": "Chilean Peso",
    "CNY": "Chinese Yuan", "COP": "Colombian Peso", "CZK": "Czech Koruna",
    "DKK": "Danish Krone", "EGP": "Egyptian Pound", "EUR": "Euro",
    "GBP": "British Pound", "GHS": "Ghanaian Cedi", "HKD": "Hong Kong Dollar",
    "HUF": "Hungarian Forint", "IDR": "Indonesian Rupiah", "ILS": "Israeli New Shekel",
    "INR": "Indian Rupee", "JOD": "Jordanian Dinar", "JPY": "Japanese Yen",
    "KES": "Kenyan Shilling", "KRW": "South Korean Won", "LKR": "Sri Lankan Rupee",
    "MXN": "Mexican Peso", "MYR": "Malaysian Ringgit", "NGN": "Nigerian Naira",
    "NOK": "Norwegian Krone", "NZD": "New Zealand Dollar", "PHP": "Philippine Peso",
    "PKR": "Pakistani Rupee", "PLN": "Polish Zloty", "QAR": "Qatari Riyal",
    "RON": "Romanian Leu", "RUB": "Russian Ruble", "SAR": "Saudi Riyal",
    "SEK": "Swedish Krona", "SGD": "Singapore Dollar", "THB": "Thai Baht",
    "TRY": "Turkish Lira", "TWD": "New Taiwan Dollar", "UAH": "Ukrainian Hryvnia",
    "USD": "US Dollar", "VND": "Vietnamese Dong", "ZAR": "South African Rand",
}


@tool
def map_country_to_currency(country_name: str) -> dict:
    """Map a country name or ISO 4217 currency code to its currency information.

    Accepts country names (e.g. 'Germany', 'Japan', 'United States'), common aliases
    (e.g. 'UK', 'USA', 'UAE'), or ISO 4217 codes (e.g. 'EUR', 'JPY', 'USD').

    Args:
        country_name: Country name, alias, or ISO 4217 code (case-insensitive).

    Returns:
        dict with currency_code, currency_name, country on success.
        dict with error='not_found' and input on failure.
    """
    normalized = country_name.strip()
    upper = normalized.upper()
    if upper in _VALID_ISO_CODES:
        logger.info("map_country_to_currency: ISO passthrough %s -> %s", normalized, upper)
        return {"currency_code": upper, "currency_name": _VALID_ISO_CODES[upper], "country": normalized}

    lower = normalized.lower()
    if lower in _COUNTRY_MAP:
        code, name = _COUNTRY_MAP[lower]
        logger.info("map_country_to_currency: %s -> %s (%s)", normalized, code, name)
        return {"currency_code": code, "currency_name": name, "country": normalized}

    logger.warning("map_country_to_currency: not found for '%s'", normalized)
    return {"error": "not_found", "input": normalized}
