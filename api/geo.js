// GET /api/geo: the visitor's country (from Vercel's edge) and the currency the
// pricing page should show: INR in India, USD everywhere else.
import { currencyForCountry } from '../src/course/prices.js';

export default function handler(req, res) {
  const country = String(process.env.GEO_COUNTRY || req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ country: country || null, currency: country ? currencyForCountry(country) : null });
}
