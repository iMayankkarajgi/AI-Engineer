// Shared helpers for the payment functions (checkout.js and dodo-webhook.js).
// Files starting with "_" are not exposed as routes.
//
// Settings (Vercel → Settings → Environment Variables):
//   DODO_PAYMENTS_API_KEY       secret API key from the Dodo Payments dashboard
//   DODO_PAYMENTS_ENV           "live" or "test" (default "test")
//   DODO_WEBHOOK_SECRET         signing secret of the webhook endpoint (starts with whsec_)
//   SUPABASE_SERVICE_ROLE_KEY   Supabase secret key, used only here to record plans
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PRICES, PERIOD_IDS, PLAN_DAYS, TRACK_NAMES, PERIOD_NAMES, currencyForCountry } from '../src/course/prices.js';

export { PRICES, PERIOD_IDS, PLAN_DAYS, currencyForCountry };
export const SITE = process.env.SITE_URL || 'https://modernaiengineering.com';
const env = () => ({
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  base: process.env.DODO_PAYMENTS_BASE_URL || (process.env.DODO_PAYMENTS_ENV === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com'),
  webhookSecret: process.env.DODO_WEBHOOK_SECRET || '',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jrqqubxwroziwocyyqwy.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L-UemOhaM0jLKowF_Y_tGg_MMOhqZpH',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
});
export const configured = () => { const e = env(); return !!(e.apiKey && e.webhookSecret && e.serviceKey); };
// Names (never values) of the settings that are still empty, to help the site owner finish setup.
export const missingSettings = () => { const e = env(); return [['DODO_PAYMENTS_API_KEY', e.apiKey], ['DODO_WEBHOOK_SECRET', e.webhookSecret], ['SUPABASE_SERVICE_ROLE_KEY', e.serviceKey]].filter(([, v]) => !v).map(([k]) => k); };
// Tries each outside service the payment flow depends on and says which work.
// Reports status codes and the services' own error text only, never a key.
export async function selfCheck() {
  const e = env(), out = {};
  const probe = async (name, url, headers) => { try { const r = await fetch(url, { headers }); out[name] = r.ok ? 'ok' : `failed (${r.status}): ${(await r.text()).slice(0, 160)}`; } catch (err) { out[name] = `failed: ${err.message}`; } };
  await probe('dodo_api_key', `${e.base}/products?page_size=1`, { Authorization: `Bearer ${e.apiKey}` });
  const sb = { apikey: e.serviceKey, Authorization: `Bearer ${e.serviceKey}` };
  await probe('supabase_secret_key_reads_payments', `${e.supabaseUrl}/rest/v1/payments?select=payment_id&limit=1`, sb);
  await probe('supabase_secret_key_reads_entitlements', `${e.supabaseUrl}/rest/v1/entitlements?select=track&limit=1`, sb);
  // The secret key must be able to see every account; the public key cannot.
  try { const r = await fetch(`${e.supabaseUrl}/auth/v1/admin/users?per_page=1`, { headers: sb }); out.supabase_key_is_the_secret_one = r.ok ? 'yes' : `no (${r.status}): this looks like the public key, not the secret key`; } catch (err) { out.supabase_key_is_the_secret_one = `failed: ${err.message}`; }
  out.dodo_api_host = e.base;
  return out;
}
export const paymentsMode = () => process.env.DODO_PAYMENTS_ENV === 'live' ? 'live' : 'test';
export const countryOf = req => String(process.env.GEO_COUNTRY || req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);

export async function dodo(path, { method = 'GET', body } = {}) {
  const e = env();
  const r = await fetch(e.base + path, { method, headers: { Authorization: `Bearer ${e.apiKey}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch {}
  if (!r.ok) throw new Error(`Dodo Payments ${method} ${path} returned ${r.status}: ${text.slice(0, 200)}`);
  return data;
}

// One Dodo product per track and plan length (six in all). Each product has a
// base price in US dollars and a fixed "localized" price in Indian rupees, so a
// buyer billed in INR pays the rupee price and everyone else pays dollars. Both
// amounts already include taxes. Products are created the first time they are
// needed and found again by name afterwards.
const BASE = 'USD', LOCAL = ['INR'];
const productName = (track, period) => `${TRACK_NAMES[track]}: ${PERIOD_NAMES[period]}`;
const rulesOf = async id => { const d = await dodo(`/products/${id}/localized-prices`); return Array.isArray(d) ? d : d?.items || []; };
let products = null;
const ready = new Map();
async function allProducts() {
  const items = [];
  for (let page = 0; page < 10; page++) {
    const got = (await dodo(`/products?page_size=100&page_number=${page}&recurring=false`))?.items || [];
    items.push(...got);
    if (got.length < 100) break;
  }
  return items;
}
export function productId(track, period) {
  const key = `${track}|${period}`;
  // One attempt at a time per plan, so two buyers arriving together cannot create the product twice.
  if (!ready.has(key)) ready.set(key, makeProduct(track, period).catch(err => { ready.delete(key); throw err; }));
  return ready.get(key);
}
async function makeProduct(track, period) {
  const name = productName(track, period), price = PRICES[track][BASE][period] * 100;
  const load = () => allProducts().then(items => new Map(items.filter(p => p.name && p.price != null).map(p => [`${p.name}|${p.price}|${p.currency}`, p.product_id])));
  if (!products) products = load();
  let known = await products, id = known.get(`${name}|${price}|${BASE}`);
  // Not in the remembered list: read the list again before creating, in case another server made it meanwhile.
  if (!id) { products = load(); known = await products; id = known.get(`${name}|${price}|${BASE}`); }
  if (!id) {
    id = (await dodo('/products', { method: 'POST', body: {
      name, tax_category: 'edtech', pricing_mode: 'by_currency',
      description: `${PERIOD_NAMES[period]} access to the ${TRACK_NAMES[track]} track of the AI Engineering Bootcamp at modernaiengineering.com.`,
      // tax_inclusive: the listed amount already contains GST or other taxes, so the buyer pays exactly it.
      price: { type: 'one_time_price', price, currency: BASE, discount: 0, purchasing_power_parity: false, tax_inclusive: true },
      metadata: { track, period },
    } })).product_id;
    known.set(`${name}|${price}|${BASE}`, id);
  }
  // The rupee price on the same product. Replace it if the amount has changed.
  const rules = await rulesOf(id);
  for (const currency of LOCAL) {
    const amount = PRICES[track][currency][period] * 100, have = rules.find(r => r.currency === currency && !r.country_code);
    if (have && have.amount === amount) continue;
    if (have) await dodo(`/products/${id}/localized-prices/${have.id}`, { method: 'DELETE' });
    await dodo(`/products/${id}/localized-prices`, { method: 'POST', body: { currency, amount } });
  }
  return id;
}
export const resetProductCache = () => { products = null; ready.clear(); };
// Makes sure all six plans have their product in Dodo (creating any that are
// missing), archives the older one-product-per-currency entries, and lists the
// result. Safe to run again: existing products are reused.
export async function ensureProducts() {
  const out = [];
  for (const track of Object.keys(PRICES)) for (const period of PERIOD_IDS) {
    const row = { product: productName(track, period), usd: PRICES[track].USD[period], inr: PRICES[track].INR[period], tax_included: true };
    try { row.product_id = await productId(track, period); row.localized = (await rulesOf(row.product_id)).map(r => `${r.currency} ${r.amount / 100}`); }
    catch (err) { row.error = String(err.message).slice(0, 220); }
    out.push(row);
  }
  const archived = [];
  try {
    for (const p of await allProducts()) if (/^AI Engineering Bootcamp: .+ \((1 Month|3 Months|Lifetime), (INR|USD)\)$/.test(p.name || '')) {
      try { await dodo(`/products/${p.product_id}`, { method: 'DELETE' }); archived.push(p.name); } catch (err) { archived.push(`${p.name}: not archived (${String(err.message).slice(0, 80)})`); }
    }
  } catch (err) { archived.push(`could not list products: ${String(err.message).slice(0, 120)}`); }
  return { plans: out, archived_old_products: archived };
}

// Who is asking: the Supabase account behind the access token, or null.
export async function userFromToken(token) {
  if (!token) return null;
  const e = env();
  const r = await fetch(`${e.supabaseUrl}/auth/v1/user`, { headers: { apikey: e.anonKey, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? u : null;
}

// The tracks this learner has an active plan for, read with their own token
// (row-level security only returns their own rows). null when the token is not valid.
export async function plansFromToken(token) {
  const e = env();
  const r = await fetch(`${e.supabaseUrl}/rest/v1/entitlements?select=track,expires_at`, { headers: { apikey: e.anonKey, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return (await r.json()).filter(p => !p.expires_at || new Date(p.expires_at) > new Date()).map(p => p.track);
}

// Supabase REST with the secret key, which bypasses row-level security.
export async function db(path, { method = 'GET', body, prefer } = {}) {
  const e = env();
  const r = await fetch(`${e.supabaseUrl}/rest/v1/${path}`, { method, headers: { apikey: e.serviceKey, Authorization: `Bearer ${e.serviceKey}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok) throw new Error(`Supabase ${method} ${path} returned ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// Standard Webhooks check: HMAC-SHA256 of "id.timestamp.body" with the endpoint secret.
export function verifyWebhook(rawBody, headers, now = Date.now()) {
  const id = headers['webhook-id'], ts = headers['webhook-timestamp'], sigs = String(headers['webhook-signature'] || '');
  const secret = env().webhookSecret;
  if (!id || !ts || !sigs || !secret) return false;
  if (!/^\d+$/.test(ts) || Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest();
  return sigs.split(' ').some(part => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export const readRaw = req => new Promise((resolve, reject) => {
  if (typeof req.rawBody === 'string') return resolve(req.rawBody);
  if (Buffer.isBuffer(req.body)) return resolve(req.body.toString('utf8'));
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); req.on('error', reject);
});
