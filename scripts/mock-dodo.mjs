// A small stand-in for the Dodo Payments API, for testing checkout offline.
// It keeps products, checkout sessions and payments in memory, shows a one-button
// "pay" page, and sends properly signed webhooks to the site, like the real
// service does. Never use this in production.
//   MOCK_DODO_PORT (default 54400), DODO_WEBHOOK_SECRET, WEBHOOK_URL
import http from 'node:http';
import { createHmac, randomBytes } from 'node:crypto';

const PORT = Number(process.env.MOCK_DODO_PORT || 54400);
const SECRET = process.env.DODO_WEBHOOK_SECRET || 'whsec_' + Buffer.from('local-test-signing-key').toString('base64');
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://127.0.0.1:3010/api/dodo-webhook';
const products = new Map(), sessions = new Map(), payments = new Map(), sent = [];
const id = p => `${p}_${randomBytes(8).toString('hex')}`;
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const read = req => new Promise(r => { let s = ''; req.on('data', c => { s += c; }); req.on('end', () => { try { r(s ? JSON.parse(s) : {}); } catch { r({}); } }); });

export function sign(body, secret = SECRET, at = Math.floor(Date.now() / 1000), msgId = id('msg')) {
  const sig = createHmac('sha256', Buffer.from(secret.replace(/^whsec_/, ''), 'base64')).update(`${msgId}.${at}.${body}`).digest('base64');
  return { 'webhook-id': msgId, 'webhook-timestamp': String(at), 'webhook-signature': `v1,${sig}`, 'Content-Type': 'application/json' };
}
async function deliver(type, data) {
  const body = JSON.stringify({ business_id: 'bus_mock', type, timestamp: new Date().toISOString(), data });
  const r = await fetch(WEBHOOK_URL, { method: 'POST', headers: sign(body), body });
  const text = await r.text(); sent.push({ type, status: r.status, text });
  return { status: r.status, text };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`), path = url.pathname;
  try {
    if (path === '/__state') return json(res, 200, { products: [...products.values()], sessions: [...sessions.values()], payments: [...payments.values()], sent });
    if (path === '/__refund') { // test hook: /__refund?payment_id=...&partial=1
      const p = payments.get(url.searchParams.get('payment_id')); if (!p) return json(res, 404, { message: 'no such payment' });
      return json(res, 200, await deliver('refund.succeeded', { payload_type: 'Refund', refund_id: id('ref'), payment_id: p.payment_id, business_id: 'bus_mock', status: 'succeeded', is_partial: url.searchParams.get('partial') === '1', amount: p.total_amount, currency: p.currency, created_at: new Date().toISOString() }));
    }
    if (path === '/__redeliver') { const p = payments.get(url.searchParams.get('payment_id')); return json(res, 200, await deliver('payment.succeeded', { payload_type: 'Payment', ...p })); }
    if (path.startsWith('/pay/')) {
      const s = sessions.get(path.split('/')[2]); if (!s) return json(res, 404, { message: 'no such session' });
      if (req.method === 'POST') {
        const product = products.get(s.product_cart[0].product_id);
        const p = { payment_id: id('pay'), business_id: 'bus_mock', status: 'succeeded', total_amount: product.price, currency: product.currency, customer: { customer_id: id('cus'), ...s.customer }, metadata: s.metadata || {}, product_cart: s.product_cart, subscription_id: null, refunds: [], created_at: new Date().toISOString(), checkout_session_id: s.session_id };
        payments.set(p.payment_id, p);
        await deliver('payment.succeeded', { payload_type: 'Payment', ...p });
        const back = new URL(s.return_url); back.searchParams.set('payment_id', p.payment_id); back.searchParams.set('status', 'succeeded');
        res.writeHead(303, { Location: back.toString() }); return res.end();
      }
      const product = products.get(s.product_cart[0].product_id);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mock checkout</title><body style="font:16px system-ui;max-width:420px;margin:60px auto;padding:0 16px"><h1>Mock checkout</h1><p id="product">${product.name}</p><p id="amount"><b>${(product.price / 100).toFixed(2)} ${product.currency}</b></p><p>${s.customer.email}</p><form method="post"><button id="pay" style="padding:12px 20px;font:inherit">Pay (test)</button></form></body>`);
    }
    if ((req.headers.authorization || '') !== 'Bearer mock-dodo-key') return json(res, 401, { message: 'Unauthorized' });
    if (path === '/products' && req.method === 'GET') return json(res, 200, { items: [...products.values()] });
    if (path === '/products' && req.method === 'POST') {
      const b = await read(req);
      if (!b.name || !b.tax_category || b.price?.type !== 'one_time_price' || !Number.isInteger(b.price.price) || !b.price.currency) return json(res, 422, { message: 'invalid product' });
      const p = { product_id: id('pdt'), business_id: 'bus_mock', name: b.name, description: b.description || null, price: b.price.price, currency: b.price.currency, is_recurring: false, tax_category: b.tax_category, metadata: b.metadata || {}, created_at: new Date().toISOString() };
      products.set(p.product_id, p); return json(res, 200, p);
    }
    if (path === '/checkouts' && req.method === 'POST') {
      const b = await read(req);
      if (!Array.isArray(b.product_cart) || !products.has(b.product_cart[0]?.product_id) || !b.customer?.email) return json(res, 422, { message: 'invalid checkout' });
      const s = { session_id: id('cks'), ...b }; sessions.set(s.session_id, s);
      return json(res, 200, { session_id: s.session_id, checkout_url: `http://127.0.0.1:${PORT}/pay/${s.session_id}` });
    }
    if (path.startsWith('/payments/') && req.method === 'GET') { const p = payments.get(decodeURIComponent(path.split('/')[2])); return p ? json(res, 200, p) : json(res, 404, { message: 'not found' }); }
    json(res, 404, { message: 'Not found' });
  } catch (err) { json(res, 500, { message: String(err) }); }
}).listen(PORT, '127.0.0.1', () => console.log(`Mock Dodo Payments running at http://127.0.0.1:${PORT}`));
