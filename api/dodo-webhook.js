// POST /api/dodo-webhook: Dodo Payments calls this after a payment or refund.
// A successful payment gives the learner their plan (a row in `entitlements`);
// a full refund takes it away. Every payment is recorded once in `payments`, so
// a repeated delivery of the same event changes nothing.
import { PLAN_DAYS, PRICES, configured, db, dodo, readRaw, verifyWebhook } from './_dodo.js';

const DAY = 86400_000;

async function paymentSucceeded(paymentId) {
  // Ask Dodo for the payment itself rather than trusting the event body.
  const p = await dodo(`/payments/${encodeURIComponent(paymentId)}`);
  if (p?.status !== 'succeeded') return 'payment is not succeeded';
  const { user_id, track, period } = p.metadata || {};
  if (!/^[0-9a-f-]{36}$/i.test(user_id || '') || !PRICES[track] || !(period in PLAN_DAYS)) return 'payment has no plan details';
  const fresh = await db('payments?on_conflict=payment_id', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=representation',
    body: { payment_id: p.payment_id, user_id, track, period, currency: p.currency, amount: p.total_amount, status: 'succeeded' } });
  if (!fresh?.length) return 'already recorded';
  const [held] = await db(`entitlements?user_id=eq.${user_id}&track=eq.${track}&select=period,expires_at`);
  // A lifetime plan stays; a timed plan is added on top of any time still left.
  let next = { period, expires_at: null };
  if (held && !held.expires_at) next = { period: 'lifetime', expires_at: null };
  else if (PLAN_DAYS[period]) {
    const from = Math.max(Date.now(), held?.expires_at ? new Date(held.expires_at).getTime() : 0);
    next.expires_at = new Date(from + PLAN_DAYS[period] * DAY).toISOString();
  }
  await db('entitlements?on_conflict=user_id,track', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { user_id, track, ...next } });
  return 'plan granted';
}

async function refundSucceeded(data) {
  const [paid] = await db(`payments?payment_id=eq.${encodeURIComponent(data.payment_id)}&select=user_id,track,status`);
  if (!paid) return 'unknown payment';
  if (data.is_partial) return 'partial refund, plan kept';
  if (paid.status === 'refunded') return 'already refunded';
  await db(`payments?payment_id=eq.${encodeURIComponent(data.payment_id)}`, { method: 'PATCH', body: { status: 'refunded', refunded_at: new Date().toISOString() } });
  await db(`entitlements?user_id=eq.${paid.user_id}&track=eq.${paid.track}`, { method: 'DELETE' });
  return 'plan removed';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!configured()) return res.status(503).json({ error: 'Payments are not configured.' });
  const raw = await readRaw(req);
  if (!verifyWebhook(raw, req.headers)) return res.status(401).json({ error: 'Invalid signature.' });
  let event; try { event = JSON.parse(raw); } catch { return res.status(400).json({ error: 'Invalid JSON.' }); }
  try {
    let result = 'ignored';
    if (event.type === 'payment.succeeded' && event.data?.payment_id) result = await paymentSucceeded(event.data.payment_id);
    else if (event.type === 'refund.succeeded' && event.data?.payment_id) result = await refundSucceeded(event.data);
    res.status(200).json({ ok: true, result });
  } catch (err) {
    // A 500 makes Dodo deliver the event again later.
    console.error('webhook failed:', err.message);
    // Only correctly signed requests reach this point, so the reason is safe to return; it shows in Dodo's delivery log.
    res.status(500).json({ error: 'Could not process the event.', reason: String(err.message).slice(0, 300) });
  }
}
