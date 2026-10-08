// Shared helpers for the payment functions (checkout.js and dodo-webhook.js).
// Files starting with "_" are not exposed as routes.
//
// Settings (Vercel → Settings → Environment Variables):
//   DODO_PAYMENTS_API_KEY       secret API key from the Dodo Payments dashboard
//   DODO_PAYMENTS_ENV           "live" or "test" (default "test")
//   DODO_WEBHOOK_SECRET         signing secret of the webhook endpoint (starts with whsec_)
//   SUPABASE_SERVICE_ROLE_KEY   Supabase secret key, used only here to record plans
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PRICES, PLAN_DAYS, TRACK_NAMES, PERIOD_NAMES, currencyForCountry } from '../src/course/prices.js';

export { PRICES, PLAN_DAYS, currencyForCountry };
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

// One Dodo product per track, plan length and currency. They are created the
// first time they are needed and found again by name afterwards.
const productName = (track, period, currency) => `AI Engineering Bootcamp: ${TRACK_NAMES[track]} (${PERIOD_NAMES[period]}, ${currency})`;
let products = null;
export async function productId(track, period, currency) {
  const name = productName(track, period, currency), price = PRICES[track][currency][period] * 100;
  if (!products) {
    products = new Map();
    for (let page = 0; page < 10; page++) {
      const items = (await dodo(`/products?page_size=100&page_number=${page}&recurring=false`))?.items || [];
      for (const p of items) if (p.name && p.price != null) products.set(`${p.name}|${p.price}`, p.product_id);
      if (items.length < 100) break;
    }
  }
  const key = `${name}|${price}`;
  if (!products.has(key)) {
    const made = await dodo('/products', { method: 'POST', body: {
      name, tax_category: 'edtech',
      description: `${PERIOD_NAMES[period]} access to the ${TRACK_NAMES[track]} track of the AI Engineering Bootcamp at modernaiengineering.com.`,
      price: { type: 'one_time_price', price, currency, discount: 0, purchasing_power_parity: false },
      metadata: { track, period, currency },
    } });
    products.set(key, made.product_id);
  }
  return products.get(key);
}
export const resetProductCache = () => { products = null; };

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
