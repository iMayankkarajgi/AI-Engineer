// Shared by the quiz, exam and lab functions: who is asking, what their plan
// covers, and saving a score. Scores are written here with the secret key;
// learners cannot write their own progress rows.
import { db, plansFromToken, userFromToken } from './_dodo.js';

export const tokenOf = req => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
export const bodyOf = req => { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } return b && typeof b === 'object' ? b : {}; };

// The signed-in learner and their active plans, or null when the token is not valid.
export async function learner(req) {
  const token = tokenOf(req);
  const user = await userFromToken(token);
  if (!user) return null;
  return { user, plans: (await plansFromToken(token)) || [] };
}

// Keeps the learner's best score for a lesson (or the final exam). A pass, once earned, stays.
export async function saveScore(userId, lessonId, score, passMark) {
  const [had] = await db(`lesson_progress?user_id=eq.${userId}&lesson_id=eq.${encodeURIComponent(lessonId)}&select=best_score,passed`);
  const best = Math.max(score, had?.best_score ?? 0), passed = !!had?.passed || score >= passMark;
  if (!had || best !== had.best_score || passed !== had.passed) {
    await db('lesson_progress?on_conflict=user_id,lesson_id', { method: 'POST', prefer: 'resolution=merge-duplicates',
      body: { user_id: userId, lesson_id: lessonId, best_score: best, passed, updated_at: new Date().toISOString() } });
  }
  return { best, passed };
}
