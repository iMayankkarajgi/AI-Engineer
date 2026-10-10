// POST /api/checkout { track, period }: starts a Dodo Payments checkout for the
// signed-in learner and returns { url } to send the browser to. The currency and
// price are decided here from the visitor's country, never by the browser.
import { labsFolder } from './_labs.js';
import { PRICES, PERIOD_IDS, SITE, ensureProducts, selfCheck, configured, countryOf, currencyForCountry, db, dodo, missingSettings, paymentsMode, productId, userFromToken } from './_dodo.js';

// Can the server reach the lab code it hides at build time? (Says only yes or no.)
async function labsCheck(req) {
  const folder = labsFolder();
  if (!folder) return { labs_code: 'in the public bundle (no server secret at build time)' };
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host, proto = req.headers['x-forwarded-proto'] || (/^(localhost|127.)/.test(host) ? 'http' : 'https');
    const r = await fetch(`${proto}://${host}/_labs/${folder}/temperature.js`), t = await r.text();
    return { labs_code: r.ok && !t.trimStart().startsWith('<') ? 'hidden, and reachable by the server' : `hidden, but the server cannot read it (${r.status})` };
  } catch (err) { return { labs_code: `failed: ${err.message}` }; }
}
// Can the server read the table that holds quiz and exam scores?
async function progressCheck() { try { await db('lesson_progress?select=lesson_id&limit=1'); return 'ok'; } catch (err) { return `failed: ${String(err.message).slice(0, 120)}`; } }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // GET reports whether payments are set up (setting names only, never values).
  if (req.method === 'GET') return res.status(200).json({ ready: configured(), mode: paymentsMode(), missing: missingSettings(), ...(String(req.url).includes('check=1') && configured() ? { checks: { ...(await selfCheck()), ...(await labsCheck(req)), progress_table_is_writable_by_server: await progressCheck() } } : {}),
    // ?products=1 creates any missing Dodo product for the plans on sale and lists them all.
    ...(String(req.url).includes('products=1') && configured() ? { products: await ensureProducts() } : {}) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!configured()) return res.status(503).json({ error: 'Online checkout is not switched on yet. Please try again soon.', missing: missingSettings() });
  const user = await userFromToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!user) return res.status(401).json({ error: 'Sign in to buy a plan.' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { track, period } = body || {};
  if (!PRICES[track] || !PERIOD_IDS.includes(period)) return res.status(400).json({ error: 'Unknown plan.' });
  const currency = currencyForCountry(countryOf(req));
  try {
    const session = await dodo('/checkouts', { method: 'POST', body: {
      product_cart: [{ product_id: await productId(track, period), quantity: 1 }],
      // The currency to charge: the product's rupee price for India, its dollar price everywhere else.
      billing_currency: currency,
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
