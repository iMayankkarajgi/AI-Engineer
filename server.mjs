import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import newsHandler from './api/news.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'atlas.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS progress (user_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY(user_id, lesson_id));`);

const app = express();
app.disable('x-powered-by');
app.use((_, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'strict-origin-when-cross-origin'); next(); });
app.use(express.json({ limit: '16kb' }));
const originGuard = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    const host = req.get('host');
    if (origin && new URL(origin).host !== host) return res.status(403).json({ error: 'Invalid origin.' });
  }
  next();
};
app.use('/api', originGuard);
app.get('/api/health', (_, res) => res.json({ ok: true }));
// The same handler runs as a serverless function on Vercel (api/news.js).
app.get('/api/news', newsHandler);

const attempts = new Map();
const authLimit = (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(t => now - t < 15 * 60_000);
  if (recent.length >= 20) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  recent.push(now); attempts.set(key, recent);
  next();
};

const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(p => p.length === 2));
const hash = value => createHash('sha256').update(value).digest('hex');
const currentUser = req => {
  const token = cookies(req).atlas_session;
  if (!token) return null;
  return db.prepare('SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token), Date.now()) || null;
};
const setCookie = (res, token, maxAge) => res.cookie('atlas_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge, path: '/' });
const issueSession = (res, userId) => {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(hash(token), userId, Date.now() + 30 * 86400_000);
  setCookie(res, token, 30 * 86400_000);
};
const passwordHash = password => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const passwordValid = (password, stored) => {
  const [salt, digest] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

app.post('/api/signup', authLimit, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || !name || name.length > 80 || password.length < 10 || password.length > 200) return res.status(400).json({ error: 'Enter a name, valid email, and password of at least 10 characters.' });
  const id = randomBytes(16).toString('hex');
  try { db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)').run(id, email, name, passwordHash(password), new Date().toISOString()); }
  catch { return res.status(409).json({ error: 'An account with that email already exists.' }); }
  issueSession(res, id);
  res.json({ user: { id, email, name }, completed: [] });
});
app.post('/api/login', authLimit, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !passwordValid(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password.' });
  issueSession(res, user.id);
  const completed = db.prepare('SELECT lesson_id FROM progress WHERE user_id=?').all(user.id).map(x => x.lesson_id);
  res.json({ user: { id: user.id, email, name: user.name }, completed });
});
app.post('/api/logout', (req, res) => {
  const token = cookies(req).atlas_session;
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
  res.clearCookie('atlas_session', { path: '/' });
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.json({ user: null, completed: [] });
  const completed = db.prepare('SELECT lesson_id FROM progress WHERE user_id=?').all(user.id).map(x => x.lesson_id);
  res.json({ user, completed });
});
app.put('/api/progress/:lessonId', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in to sync progress.' });
  const lessonId = String(req.params.lessonId);
  if (!/^[a-z0-9-]{1,80}$/.test(lessonId)) return res.status(400).json({ error: 'Invalid lesson.' });
  db.prepare('INSERT OR REPLACE INTO progress VALUES (?, ?, ?)').run(user.id, lessonId, new Date().toISOString());
  res.json({ ok: true });
});

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  // Prerendered pages live at dist/<path>/index.html; everything else gets the app shell.
  app.use(express.static(dist, { redirect: false }));
  const shell = fs.existsSync(path.join(dist, 'app.html')) ? 'app.html' : 'index.html';
  app.get('/{*path}', (req, res) => {
    const page = path.join(dist, path.normalize(req.path), 'index.html');
    res.sendFile(page.startsWith(dist) && fs.existsSync(page) ? page : path.join(dist, shell));
  });
}
// `--port N` wins over PORT, so `npm run dev` keeps the API on 3001 (where Vite proxies /api)
// even when the environment sets PORT for the front-end server.
const portArg = process.argv.indexOf('--port');
const port = Number((portArg > 0 && process.argv[portArg + 1]) || process.env.PORT || 3001);
app.listen(port, () => console.log(`Modern AI Engineering running at http://localhost:${port}`));
