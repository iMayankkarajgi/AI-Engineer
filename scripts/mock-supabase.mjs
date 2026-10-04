// A small in-memory stand-in for Supabase, for exercising sign-in, the profile
// page and progress sync offline (`npm run dev:mock`). It speaks just enough of
// the Auth (GoTrue) and REST (PostgREST) protocols for supabase-js, mimics the
// row-level-security rules and sign-up trigger in supabase/schema.sql, and
// replaces the Google consent screen with an instant redirect as a fixed test
// account. Data is lost when it stops. Never use this in production.
import http from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_SUPABASE_PORT || 54321);
// Seed accounts for local testing.
const GOOGLE_USER = { email: 'ada.tester@example.test', full_name: 'Ada Tester', avatar_url: '' };
const SEED_EMAIL_USER = { email: 'learner@example.test', password: 'atlas-local-test-1', full_name: 'Local Learner' };

const users = new Map();      // id -> { user, password }
const tokens = new Map();     // access token -> user id
const refresh = new Map();    // refresh token -> user id
const codes = new Map();      // oauth code -> user id
const tables = { profiles: [], lesson_progress: [], code_snippets: [], entitlements: [] };
const OWNER = { profiles: 'id', lesson_progress: 'user_id', code_snippets: 'user_id', entitlements: 'user_id' };
const KEYS = { profiles: ['id'], lesson_progress: ['user_id', 'lesson_id'], code_snippets: ['id'], entitlements: ['user_id', 'track'] };

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function createUser({ email, password, meta, provider }) {
  const now = new Date().toISOString(), id = randomUUID();
  const user = { id, aud: 'authenticated', role: 'authenticated', email, email_confirmed_at: now, created_at: now, updated_at: now,
    app_metadata: { provider, providers: [provider] }, user_metadata: meta, identities: [] };
  users.set(id, { user, password });
  // Same effect as the handle_new_user trigger.
  tables.profiles.push({ id, email, full_name: meta.full_name || meta.name || email.split('@')[0], avatar_url: meta.avatar_url || '', bio: '', created_at: now, updated_at: now });
  return user;
}
const byEmail = email => [...users.values()].find(u => u.user.email === email);
function session(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp })}.${randomBytes(16).toString('base64url')}`;
  const refresh_token = randomBytes(12).toString('base64url');
  tokens.set(access_token, user.id); refresh.set(refresh_token, user.id);
  return { access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token, user };
}
createUser({ email: SEED_EMAIL_USER.email, password: SEED_EMAIL_USER.password, meta: { full_name: SEED_EMAIL_USER.full_name }, provider: 'email' });

const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json', ...headers }); res.end(body === undefined ? '' : JSON.stringify(body)); };
const readBody = req => new Promise(resolve => { let s = ''; req.on('data', c => { s += c; }); req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch { resolve({}); } }); });
const bearer = req => tokens.get((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));

async function auth(req, res, url) {
  const route = url.pathname.replace('/auth/v1', ''), body = req.method === 'POST' ? await readBody(req) : {};
  if (route === '/authorize') {
    // Stands in for Google: sign in as the fixed test account and return a code.
    const me = byEmail(GOOGLE_USER.email)?.user || createUser({ email: GOOGLE_USER.email, meta: { full_name: GOOGLE_USER.full_name, name: GOOGLE_USER.full_name, avatar_url: GOOGLE_USER.avatar_url }, provider: 'google' });
    const code = randomBytes(12).toString('base64url'); codes.set(code, me.id);
    const back = new URL(url.searchParams.get('redirect_to')); back.searchParams.set('code', code);
    res.writeHead(302, { Location: back.toString() }); return res.end();
  }
  if (route === '/signup') {
    if (!/^\S+@\S+\.\S+$/.test(body.email || '') || String(body.password || '').length < 6) return send(res, 422, { code: 422, error_code: 'weak_password', msg: 'Enter a valid email and a password of at least 6 characters.' });
    if (byEmail(body.email)) return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
    return send(res, 200, session(createUser({ email: body.email, password: body.password, meta: body.data || {}, provider: 'email' })));
  }
  if (route === '/token') {
    const grant = url.searchParams.get('grant_type');
    let id;
    if (grant === 'password') { const u = byEmail(body.email); if (u && u.password && u.password === body.password) id = u.user.id; }
    if (grant === 'pkce') { id = codes.get(body.auth_code); codes.delete(body.auth_code); }
    if (grant === 'refresh_token') { id = refresh.get(body.refresh_token); refresh.delete(body.refresh_token); }
    if (!id) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    return send(res, 200, session(users.get(id).user));
  }
  if (route === '/user') { const id = bearer(req); return id ? send(res, 200, users.get(id).user) : send(res, 401, { code: 401, msg: 'Invalid JWT' }); }
  if (route === '/logout') { tokens.delete((req.headers.authorization || '').replace(/^Bearer\s+/i, '')); res.writeHead(204); return res.end(); }
  send(res, 404, { msg: 'Not found' });
}

async function rest(req, res, url) {
  const name = url.pathname.replace('/rest/v1/', ''), rows = tables[name];
  if (!rows) return send(res, 404, { code: 'PGRST205', message: `Could not find the table 'public.${name}'` });
  const uid = bearer(req), owner = OWNER[name];
  const single = (req.headers.accept || '').includes('vnd.pgrst.object');
  const reply = (status, out) => single ? (out.length === 1 ? send(res, status, out[0]) : send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${out.length} rows` })) : send(res, status, out);
  // Row-level security: only the signed-in learner's own rows are visible.
  const filters = [...url.searchParams].filter(([k, v]) => !['select', 'on_conflict', 'columns'].includes(k) && v.startsWith('eq.'));
  const visible = () => rows.filter(r => uid && r[owner] === uid && filters.every(([k, v]) => String(r[k]) === v.slice(3)));
  if (req.method === 'GET') return reply(200, visible());
  if (!uid || name === 'entitlements') return send(res, uid ? 403 : 401, { code: '42501', message: 'new row violates row-level security policy' });
  const body = await readBody(req), wants = (req.headers.prefer || '').includes('return=representation');
  if (req.method === 'POST') {
    const out = [];
    for (const input of [].concat(body)) {
      const row = { ...input }; if (owner === 'user_id' && !row.user_id) row.user_id = uid;
      if (name === 'code_snippets' && !row.id) row.id = randomUUID();
      if (row[owner] !== uid) return send(res, 403, { code: '42501', message: `new row violates row-level security policy for table "${name}"` });
      if (name === 'lesson_progress' && (!/^[a-z0-9-]{1,80}$/.test(row.lesson_id || '') || !(row.best_score >= 0 && row.best_score <= 50))) return send(res, 400, { code: '23514', message: 'new row violates check constraint' });
      if (name === 'profiles' && ((row.full_name || '').length > 80 || (row.bio || '').length > 280)) return send(res, 400, { code: '23514', message: 'new row violates check constraint' });
      const at = rows.findIndex(r => KEYS[name].every(k => r[k] === row[k]));
      if (at >= 0) { if (!(req.headers.prefer || '').includes('merge-duplicates')) return send(res, 409, { code: '23505', message: 'duplicate key value violates unique constraint' }); rows[at] = { ...rows[at], ...row }; out.push(rows[at]); }
      else { const now = new Date().toISOString(); const fresh = { created_at: now, updated_at: now, ...row }; rows.push(fresh); out.push(fresh); }
    }
    return wants ? reply(201, out) : send(res, 201);
  }
  if (req.method === 'PATCH') { const out = visible(); out.forEach(r => Object.assign(r, body)); return wants ? reply(200, out) : send(res, 204); }
  if (req.method === 'DELETE') { const gone = visible(); gone.forEach(r => rows.splice(rows.indexOf(r), 1)); return wants ? reply(200, gone) : send(res, 204); }
  send(res, 405, { message: 'Method not allowed' });
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/auth/v1/')) return await auth(req, res, url);
    if (url.pathname.startsWith('/rest/v1/')) return await rest(req, res, url);
    // Test-only stand-in for granting a plan from the dashboard: /__grant?email=...&track=ml|ai|complete|none
    if (url.pathname === '/__grant') { const u = byEmail(url.searchParams.get('email')), track = url.searchParams.get('track'); if (!u) return send(res, 404, { message: 'No such user' }); tables.entitlements.splice(0, tables.entitlements.length, ...tables.entitlements.filter(e => e.user_id !== u.user.id)); if (track !== 'none') tables.entitlements.push({ user_id: u.user.id, track, period: 'lifetime', expires_at: null }); return send(res, 200, { ok: true }); }
    // Inspection endpoint for tests: what is stored right now.
    if (url.pathname === '/__state') return send(res, 200, { users: [...users.values()].map(u => ({ id: u.user.id, email: u.user.email, provider: u.user.app_metadata.provider })), ...tables });
    send(res, 404, { message: 'Not found' });
  } catch (err) { send(res, 500, { message: String(err) }); }
}).listen(PORT, '127.0.0.1', () => console.log(`Mock Supabase running at http://127.0.0.1:${PORT}`));
