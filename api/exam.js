// The final exam, kept on the server.
//   GET  /api/exam            the questions, without the answers (signed-in learners only)
//   POST /api/exam { picks }  marks the exam, saves the best score, and returns the answers
// `picks` maps a question's number (0 to 49) to the chosen option's position.
import { examQuestions } from '../src/course/exam.js';
import { EXAM_ID, EXAM_PASS } from '../src/course/examMeta.js';
import { bodyOf, learner, saveScore } from './_grade.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST.' });
  const who = await learner(req);
  if (!who) return res.status(401).json({ error: 'Sign in to take the final exam.' });
  if (req.method === 'GET') return res.status(200).json({ pass: EXAM_PASS, questions: examQuestions.map(q => ({ topic: q.topic, q: q.q, options: q.options })) });
  const { picks } = bodyOf(req);
  if (!picks || typeof picks !== 'object' || Array.isArray(picks)) return res.status(400).json({ error: 'Send your answers.' });
  for (const [k, v] of Object.entries(picks)) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= examQuestions.length || !Number.isInteger(v) || v < 0 || v >= examQuestions[i].options.length) return res.status(400).json({ error: 'One of the answers is not valid.' });
  }
  const score = examQuestions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  try {
    const saved = await saveScore(who.user.id, EXAM_ID, score, EXAM_PASS);
    res.status(200).json({ score, total: examQuestions.length, passed: score >= EXAM_PASS, best: saved.best, results: examQuestions.map(q => ({ answer: q.answer, explain: q.explain || '' })) });
  } catch (err) {
    console.error('exam save failed:', err.message);
    res.status(502).json({ error: 'Could not save your score. Please try again.' });
  }
}
