import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { lessonIds, moduleOf } from './course/curriculum';
import { canOpenModule } from './course/access';
import { supabase } from './supabase';
import { entryLessonIds } from './course/tracks';
import { EXAM_ID, EXAM_PASS } from './course/exam';

// Account session and lesson progress. A lesson counts as passed once its quiz
// is passed (4 of 5). Passing is never needed to open another lesson: a lesson
// is open whenever the learner's plan includes it. Quiz passes only count
// toward the certificate. Guests keep progress in localStorage; signing in
// merges it into the account.
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
export const rememberAfterLogin = to => { try { sessionStorage.setItem(AFTER_LOGIN, to); } catch {} };
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
  // The learner's plans (rows of the entitlements table). A timed plan stops
  // counting the moment it expires, even while the site stays open: the clock
  // below is read again every half minute.
  const [planRows, setPlanRows] = useState([]);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(t); }, []);
  const plans = useMemo(() => planRows.filter(p => !p.expires_at || new Date(p.expires_at).getTime() > clock).map(p => p.track), [planRows, clock]);
  const planExpiry = useMemo(() => Object.fromEntries(planRows.map(p => [p.track, p.expires_at || null])), [planRows]);
  // Best final-exam score so far, or null when it has not been taken.
  const [exam, setExam] = useState(() => read('atlas-exam-v1', null));
  // The lesson the learner opened most recently (kept in this browser), so Continue can resume it.
  const [lastLesson, setLastLesson] = useState(() => { const id = read('atlas-last-lesson', null); return known(id) ? id : null; });
  const [pickerOpen, setPickerOpen] = useState(false);
  // Prices are shown in rupees in India and in dollars elsewhere. Start from the
  // device's time zone, then use the country the server sees.
  const [currency, setCurrency] = useState(() => { try { const s = sessionStorage.getItem('atlas-currency'); if (s === 'INR' || s === 'USD') return s; return /Calcutta|Kolkata/.test(Intl.DateTimeFormat().resolvedOptions().timeZone) ? 'INR' : 'USD'; } catch { return 'USD'; } });
  useEffect(() => {
    if (STATIC) return;
    fetch('/api/geo').then(r => r.json()).then(d => { if (d.currency === 'INR' || d.currency === 'USD') { setCurrency(d.currency); try { sessionStorage.setItem('atlas-currency', d.currency); } catch {} } }).catch(() => {});
  }, []);

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
    if (!authUser) { setUser(null); setPlanRows([]); return; }
    let live = true;
    (async () => {
      const guestDone = read('atlas-progress-v2', []).filter(known), guestScores = read('atlas-scores-v2', {});
      const [profileRes, rowsRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
        supabase.from('lesson_progress').select('lesson_id,best_score,passed').eq('user_id', authUser.id),
        supabase.from('entitlements').select('track,expires_at').eq('user_id', authUser.id),
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
      setScores(Object.fromEntries(Object.values(merged).filter(r => known(r.lesson_id)).map(r => [r.lesson_id, r.best_score])));
      // The exam result is stored beside lesson progress, under its own id.
      const localExam = read('atlas-exam-v1', null), remoteExam = remote[EXAM_ID]?.best_score ?? null;
      const bestExam = localExam === null ? remoteExam : Math.max(localExam, remoteExam ?? 0);
      const examRes = bestExam !== null && bestExam !== remoteExam ? await supabase.from('lesson_progress').upsert({ user_id: authUser.id, lesson_id: EXAM_ID, best_score: bestExam, passed: bestExam >= EXAM_PASS, updated_at: new Date().toISOString() }) : {};
      if (!live) return;
      setExam(bestExam);
      const failed = profileRes.error || rowsRes.error || pushRes.error || examRes.error;
      setSyncError(failed ? SYNC_FAILED : '');
      if (!failed) { try { localStorage.removeItem('atlas-progress-v2'); } catch {} }
      setPlanRows(plansRes.data || []);
      setUser(toUser(authUser, profile));
      setReady(true);
    })();
    return () => { live = false; };
  }, [authId]);

  useEffect(() => { if (!user) write('atlas-progress-v2', completed); }, [completed, user]);
  useEffect(() => { write('atlas-scores-v2', scores); }, [scores]);
  useEffect(() => { write('atlas-exam-v1', exam); }, [exam]);

  const complete = async id => { setCompleted(v => [...new Set([...v, id])]); if (user && !CLOUD) { try { await fetch(`/api/progress/${id}`, { method: 'PUT' }); } catch {} } };
  const recordScore = (id, score) => {
    const best = Math.max(score, scores[id] ?? 0), passed = score >= PASS_MARK || completed.includes(id);
    setScores(s => ({ ...s, [id]: Math.max(score, s[id] ?? 0) }));
    if (score >= PASS_MARK) complete(id);
    if (CLOUD && user) supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id, best_score: best, passed, updated_at: new Date().toISOString() })
      .then(({ error }) => setSyncError(error ? SYNC_FAILED : ''));
  };
  const recordExam = score => {
    const best = Math.max(score, exam ?? 0);
    setExam(best);
    if (CLOUD && user) supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: EXAM_ID, best_score: best, passed: best >= EXAM_PASS, updated_at: new Date().toISOString() })
      .then(({ error }) => setSyncError(error ? SYNC_FAILED : ''));
  };
  // A lesson is open when its module is free or the learner's plan includes it.
  // Without Supabase there are no plans, so everything is open.
  const isUnlocked = id => !CLOUD || canOpenModule(moduleOf(id)?.id, plans);
  // The certificate needs a pass in every lesson the learner's plan includes
  // (every lesson, when there is no plan) and a pass in the final exam.
  const certLessons = plans.length ? lessonIds.filter(isUnlocked) : lessonIds;
  const certLessonsLeft = certLessons.filter(id => !completed.includes(id)).length;
  const nextLesson = lessonIds.find(id => !completed.includes(id) && isUnlocked(id)) || lessonIds.find(id => !completed.includes(id)) || lessonIds[lessonIds.length - 1];
  const visitLesson = id => { if (known(id)) { setLastLesson(id); write('atlas-last-lesson', id); } };
  const resumeLesson = lastLesson || nextLesson;

  // Where Supabase sends the browser back to: this app's own entry URL.
  const home = () => location.origin + (STATIC ? location.pathname : import.meta.env.BASE_URL);
  const activePlans = rows => (rows || []).filter(p => !p.expires_at || new Date(p.expires_at) > new Date()).map(p => p.track);
  // Read the learner's plans again (after a payment, for example).
  const refreshPlans = async () => {
    if (!CLOUD || !authUser) return [];
    const rows = (await supabase.from('entitlements').select('track,expires_at').eq('user_id', authUser.id)).data || [];
    setPlanRows(rows); setClock(Date.now()); return activePlans(rows);
  };
  const accessToken = async () => CLOUD ? (await supabase.auth.getSession()).data.session?.access_token || '' : '';
  const signInWithGoogle = async (then = '/profile') => {
    try { sessionStorage.setItem(AFTER_LOGIN, then); } catch {}
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: home() } });
    if (error) throw new Error(error.message);
  };
  // Google sign-in started from this site (see GoogleSignIn.jsx): exchange Google's token for a Supabase session.
  const signInWithGoogleToken = async (token, nonce) => {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token, nonce });
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
    setUser(null); setCompleted([]); setScores({}); setSyncError(''); setPlanRows([]); setExam(null);
  };
  const resetGuest = () => { if (!user) { setCompleted([]); setScores({}); setExam(null); } };
  return <AppContext.Provider value={{ user, completed, scores, complete, recordScore, isUnlocked, nextLesson, lastLesson, resumeLesson, visitLesson, pickerOpen, setPickerOpen, currency, refreshPlans, accessToken, auth, signInWithGoogle, signInWithGoogleToken, updateProfile, logout, resetGuest, ready, syncError, plans, planExpiry, exam, recordExam, certLessons, certLessonsLeft }}>{children}</AppContext.Provider>;
}
