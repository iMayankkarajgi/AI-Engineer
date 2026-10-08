// Prices for every track, plan length and currency. This is the one place to
// change a price: the pricing page, the checkout and the search-engine data all
// read it. Amounts are whole rupees or whole dollars. Visitors in India see INR;
// everyone else sees USD. This file has no imports so the server can load it too.
export const PRICES = {
  ml:       { INR: { monthly: 499,  quarter: 2499, lifetime: 5999 },  USD: { monthly: 19, quarter: 49,  lifetime: 129 } },
  ai:       { INR: { monthly: 799,  quarter: 3999, lifetime: 9999 },  USD: { monthly: 29, quarter: 79,  lifetime: 199 } },
  complete: { INR: { monthly: 1199, quarter: 5999, lifetime: 14999 }, USD: { monthly: 39, quarter: 109, lifetime: 299 } },
};
export const CURRENCIES = { INR: { code: 'INR', locale: 'en-IN' }, USD: { code: 'USD', locale: 'en-US' } };
export const currencyForCountry = country => String(country || '').toUpperCase() === 'IN' ? 'INR' : 'USD';

// How long each plan gives access for, in days. Lifetime never ends.
export const PLAN_DAYS = { monthly: 31, quarter: 92, lifetime: null };
export const TRACK_NAMES = { ml: 'ML & Deep Learning', ai: 'Generative AI Engineering', complete: 'Complete AI Engineer' };
export const PERIOD_NAMES = { monthly: '1 Month', quarter: '3 Months', lifetime: 'Lifetime' };
export const formatMoney = (amount, currency = 'INR') => new Intl.NumberFormat(CURRENCIES[currency].locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
