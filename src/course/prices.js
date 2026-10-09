// Prices for every track, plan length and currency. This is the one place to
// change a price: the pricing page, the checkout and the search-engine data all
// read it. Amounts are whole rupees or whole dollars and already include GST
// and other taxes: the learner pays exactly this. Visitors in India see INR;
// everyone else sees USD. This file has no imports so the server can load it too.
export const PRICES = {
  ml:       { INR: { monthly: 3599, lifetime: 6599 },  USD: { monthly: 41, lifetime: 71 } },
  ai:       { INR: { monthly: 6599, lifetime: 9100 },  USD: { monthly: 71, lifetime: 99 } },
  complete: { INR: { monthly: 9100, lifetime: 17999 }, USD: { monthly: 99, lifetime: 250 } },
};
// The plan lengths on sale.
export const PERIOD_IDS = ['monthly', 'lifetime'];
export const CURRENCIES = { INR: { code: 'INR', locale: 'en-IN' }, USD: { code: 'USD', locale: 'en-US' } };
export const currencyForCountry = country => String(country || '').toUpperCase() === 'IN' ? 'INR' : 'USD';

// How long each plan gives access for, in days. Lifetime never ends.
export const PLAN_DAYS = { monthly: 31, lifetime: null };
export const TRACK_NAMES = { ml: 'ML & Deep Learning', ai: 'Generative AI Engineering', complete: 'Complete AI Engineer' };
export const PERIOD_NAMES = { monthly: '1 Month', lifetime: 'Lifetime' };
export const formatMoney = (amount, currency = 'INR') => new Intl.NumberFormat(CURRENCIES[currency].locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
