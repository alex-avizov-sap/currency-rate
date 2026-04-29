/**
 * Detects the user's country and currency via browser Geolocation API.
 * Falls back to IP geolocation, then returns null if both fail.
 */

const API_BASE = '/currency';

async function detectCurrencyByCoords(lat, lon) {
  const res = await fetch(`${API_BASE}/detectCurrency(latitude=${lat},longitude=${lon})`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.currencyCode ? data : null;
}

async function detectCurrencyByIP() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.country_code) return null;
    // Map country_code to currency via the CAP service (using lat/lon of country center is not easy here)
    // Try a simple lookup using the country code returned
    return { currencyCode: data.currency || null, country: data.country_code, currencyName: data.currency_name || '' };
  } catch {
    return null;
  }
}

export async function detectUserCurrency() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      detectCurrencyByIP().then(resolve);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await detectCurrencyByCoords(latitude, longitude);
        resolve(result || await detectCurrencyByIP());
      },
      async () => {
        resolve(await detectCurrencyByIP());
      },
      { timeout: 5000 }
    );
  });
}
