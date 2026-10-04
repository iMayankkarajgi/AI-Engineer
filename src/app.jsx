import React, { createContext, useContext, useEffect, useState } from 'react';
import { lessonIds } from './course/curriculum';
import { supabase } from './supabase';
import { entryLessonIds } from './course/tracks';

// Account session and lesson progress. A lesson counts as completed once its
// quiz is passed (4 of 5). Lessons unlock in order: each one opens when the
// previous lesson is completed. Guests keep progress in localStorage; signing
// in merges it into the account.
//
// Accounts have two backends. With Supabase configured (see supabase.js) the
// browser talks to it directly: Google or email sign-in, and the profile,
// progress and best quiz scores live in Postgres. Otherwise the non-static
// build uses the bundled Express + SQLite API, and the static build is
// guest-only.
export const PASS_MARK = 4;
export const STATIC = import.meta.env.VITE_STATIC === '1';
export const CLOUD = !!supabase;
export const ACCOUNTS = CLOUD || !STATIC;
const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const known = id => lessonIds.includes(id);
const SYNC_FAILED = 'Could not reach the database. Your latest changes are kept in this browser for now.';

// Where the browser lands after Google sends the learner back.
const AFTER_LOGIN = 'atlas-after-login';
export const takeAfterLogin = () => { try { const to = sessionStorage.getItem(AFTER_LOGIN); sessionStorage.removeItem(AFTER_LOGIN); return to; } catch { return null; } };

const toUser = (u, p) => ({
  id: u.id,
  email: u.email,
  name: p?.full_name || u.user_metadata?.full_name || u.user_metadata?.name || (u.email || 'Learner').split('@')[0],
  avatar: p?.avatar_url || u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
  bio: p?.bio || '',
  provider: u.app_metadata?.provider || 'email',
  joined: p?.created_at || u.created_at,
});

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [completed, setCompleted] = useState(() => read('atlas-progress-v2', []).filter(known));
  const [scores, setScores] = useState(() => read('atlas-scores-v2', {}));
  const [ready, setReady] = useState(!ACCOUNTS);
  const [syncError, setSyncError] = useState('');

  // Bundled API: restore the cookie session.
  useEffect(() => {
    if (CLOUD || STATIC) return;
    fetch('/api/me').then(r => r.json()).then(d => { if (d.user) { setUser(d.user); setCompleted(d.completed.filter(known)); } }).catch(() => {}).finally(() => setReady(true));
  }, []);

  // Supabase: follow the auth session. The listener only records the user;
  // database calls happen in the effect below (they must not run inside it).
  useEffect(() => {
    if (!CLOUD) return;
    supabase.auth.getSession().then(({ data }) => { setAuthUser(data.session?.user ?? null); if (!data.session) setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Supabase: on sign-in load the profile and progress, and merge in anything
  // the learner did as a guest in this browser.
  const authId = authUser?.id;
  useEffect(() => {
    if (!CLOUD) return;
    if (!authUser) { setUser(null); return; }
    let live = true;
    (async () => {
      const guestDone = read('atlas-progress-v2', []).filter(known), guestScores = read('atlas-scores-v2', {});
      const [profileRes, rowsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
        supabase.from('lesson_progress').select('lesson_id,best_score,passed').eq('user_id', authUser.id),
      ]);
      if (!live) return;
      let profile = profileRes.data;
      // The sign-up trigger normally creates the profile; cover the case where it has not.
      if (!profile && !profileRes.error) {
        const seed = toUser(authUser);
        profile = (await supabase.from('profiles').upsert({ id: authUser.id, email: authUser.email, full_name: seed.name.slice(0, 80), avatar_url: seed.avatar }).select().maybeSingle()).data;
      }
      const remote = Object.fromEntries((rowsRes.data || []).map(r => [r.lesson_id, r]));
      const push = [...new Set([...guestDone, ...Object.keys(guestScores)])].filter(known).map(id => ({
        user_id: authUser.id, lesson_id: id,
        best_score: Math.max(Number(guestScores[id]) || (guestDone.includes(id) ? PASS_MARK : 0), remote[id]?.best_score ?? 0),
        passed: guestDone.includes(id) || !!remote[id]?.passed,
        updated_at: new Date().toISOString(),
      })).filter(r => !remote[r.lesson_id] || r.best_score > remote[r.lesson_id].best_score || r.passed !== remote[r.lesson_id].passed);
      const pushRes = push.length ? await supabase.from('lesson_progress').upsert(push) : {};
      if (!live) return;
      const merged = { ...remote, ...Object.fromEntries(push.map(r => [r.lesson_id, r])) };
      setCompleted(Object.values(merged).filter(r => r.passed).map(r => r.lesson_id).filter(known));
      setScores(Object.fromEntries(Object.values(merged).map(r => [r.lesson_id, r.best_score])));
      const failed = profileRes.error || rowsRes.error || pushRes.error;
      setSyncError(failed ? SYNC_FAILED : '');
      if (!failed) { try { localStorage.removeItem('atlas-progress-v2'); } catch {} }
      setUser(toUser(authUser, profile));
      setReady(true);
    })();
    return () => { live = false; };
  }, [authId]);

  useEffect(() => { if (!user) write('atlas-progress-v2', completed); }, [completed, user]);
  useEffect(() => { write('atlas-scores-v2', scores); }, [scores]);

  const complete = async id => { setCompleted(v => [...new Set([...v, id])]); if (user && !CLOUD) { try { await fetch(`/api/progress/${id}`, { method: 'PUT' }); } catch {} } };
  const recordScore = (id, score) => {
    const best = Math.max(score, scores[id] ?? 0), passed = score >= PASS_MARK || completed.includes(id);
    setScores(s => ({ ...s, [id]: Math.max(score, s[id] ?? 0) }));
    if (score >= PASS_MARK) complete(id);
    if (CLOUD && user) supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id, best_score: best, passed, updated_at: new Date().toISOString() })
      .then(({ error }) => setSyncError(error ? SYNC_FAILED : ''));
  };
  // The first lesson is always open; every other lesson needs its predecessor.
  // A track's opening lesson only needs the Starter Kit, so learners can begin
  // the AI track without finishing the ML one.
  const isUnlocked = id => { const i = lessonIds.indexOf(id); return i <= 0 || completed.includes(lessonIds[i - 1]) || completed.includes(id) || (entryLessonIds.includes(id) && completed.includes(lessonIds[0])); };
  const nextLesson = lessonIds.find(id => !completed.includes(id)) || lessonIds[lessonIds.length - 1];

  // Where Supabase sends the browser back to: this app's own entry URL.
  const home = () => location.origin + (STATIC ? location.pathname : import.meta.env.BASE_URL);
  const signInWithGoogle = async (then = '/profile') => {
    try { sessionStorage.setItem(AFTER_LOGIN, then); } catch {}
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: home() } });
    if (error) throw new Error(error.message);
  };
  const auth = async (mode, body) => {
    if (CLOUD) {
      const { data, error } = mode === 'signup'
        ? await supabase.auth.signUp({ email: body.email, password: body.password, options: { data: { full_name: body.name }, emailRedirectTo: home() } })
        : await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
      if (error) throw new Error(error.message);
      return { confirm: !data.session };
    }
    const guestProgress = [...completed];
    const r = await fetch(`/api/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Something went wrong.');
    const merged = [...new Set([...d.completed, ...guestProgress])].filter(known);
    await Promise.all(guestProgress.filter(id => !d.completed.includes(id)).map(id => fetch(`/api/progress/${id}`, { method: 'PUT' })));
    setUser(d.user); setCompleted(merged); try { localStorage.removeItem('atlas-progress-v2'); } catch {}
    return d;
  };
  const updateProfile = async ({ name, bio }) => {
    const { data, error } = await supabase.from('profiles')
      .upsert({ id: user.id, email: user.email, full_name: name, bio, avatar_url: user.avatar, updated_at: new Date().toISOString() }).select().maybeSingle();
    if (error) throw new Error(error.message);
    setUser(u => ({ ...u, name: data?.full_name || name, bio: data?.bio ?? bio }));
  };
  const logout = async () => {
    if (CLOUD) await supabase.auth.signOut(); else await fetch('/api/logout', { method: 'POST' });
    setUser(null); setCompleted([]); setScores({}); setSyncError('');
  };
  const resetGuest = () => { if (!user) { setCompleted([]); setScores({}); } };
  return <AppContext.Provider value={{ user, completed, scores, complete, recordScore, isUnlocked, nextLesson, auth, signInWithGoogle, updateProfile, logout, resetGuest, ready, syncError }}>{children}</AppContext.Provider>;
}
