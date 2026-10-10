// POST /api/quiz { id, picks }: marks a lesson quiz on the server and saves the
// score. `picks` is the chosen option (its position in the lesson's own option
// list) for each question. The correct answers never reach the browser before
// this call; the reply carries them so the page can show what was right.
import { lessonById, moduleOf } from '../src/course/curriculum.js';
import { canOpenModule } from '../src/course/access.js';
import { lessons } from './_lessons.js';
import { bodyOf, learner, saveScore } from './_grade.js';

export const PASS_MARK = 4;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const { id, picks } = bodyOf(req);
  if (typeof id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(id) || !lessonById[id] || !lessons[id]?.quiz?.length) return res.status(404).json({ error: 'No such quiz.' });
  const quiz = lessons[id].quiz;
  if (!Array.isArray(picks) || picks.length !== quiz.length || picks.some((p, i) => p !== null && !(Number.isInteger(p) && p >= 0 && p < quiz[i].options.length))) return res.status(400).json({ error: 'Send one answer for each question.' });
  const who = await learner(req);
  if (!who) return res.status(401).json({ error: 'Sign in to take the quiz.' });
  if (!canOpenModule(moduleOf(id).id, who.plans)) return res.status(403).json({ error: 'Your plan does not include this lesson.' });
  const score = quiz.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  try {
    const saved = await saveScore(who.user.id, id, score, PASS_MARK);
    res.status(200).json({ score, total: quiz.length, passed: score >= PASS_MARK, best: saved.best, lessonPassed: saved.passed, results: quiz.map(q => ({ answer: q.answer, explain: q.explain || '' })) });
  } catch (err) {
    console.error('quiz save failed:', err.message);
    res.status(502).json({ error: 'Could not save your score. Please try again.' });
  }
}
