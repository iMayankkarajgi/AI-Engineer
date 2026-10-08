// POST /api/checkout { track, period }: starts a Dodo Payments checkout for the
// signed-in learner and returns { url } to send the browser to. The currency and
// price are decided here from the visitor's country, never by the browser.
import { PRICES, SITE, selfCheck, configured, countryOf, currencyForCountry, dodo, missingSettings, paymentsMode, productId, userFromToken } from './_dodo.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // GET reports whether payments are set up (setting names only, never values).
  if (req.method === 'GET') return res.status(200).json({ ready: configured(), mode: paymentsMode(), missing: missingSettings(), ...(String(req.url).includes('check=1') && configured() ? { checks: await selfCheck() } : {}) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!configured()) return res.status(503).json({ error: 'Online checkout is not switched on yet. Please try again soon.', missing: missingSettings() });
  const user = await userFromToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!user) return res.status(401).json({ error: 'Sign in to buy a plan.' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { track, period } = body || {};
  if (!PRICES[track] || !['monthly', 'quarter', 'lifetime'].includes(period)) return res.status(400).json({ error: 'Unknown plan.' });
  const currency = currencyForCountry(countryOf(req));
  try {
    const session = await dodo('/checkouts', { method: 'POST', body: {
      product_cart: [{ product_id: await productId(track, period, currency), quantity: 1 }],
      customer: { email: user.email, name: (user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]).slice(0, 80) },
      metadata: { user_id: user.id, track, period, currency },
      return_url: `${SITE}/pricing?checkout=done`,
    } });
    if (!session?.checkout_url) throw new Error('No checkout URL was returned.');
    res.status(200).json({ url: session.checkout_url, currency, amount: PRICES[track][currency][period] });
  } catch (err) {
    console.error('checkout failed:', err.message);
    res.status(502).json({ error: 'Could not start the payment. Please try again in a moment.' });
  }
}
