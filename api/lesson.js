// GET /api/lesson?id=<lesson id>: the lesson's text, quiz and video.
// Every lesson needs a signed-in learner. The free lesson is sent to any
// signed-in learner; every other lesson only when the learner's plan includes
// it. Lesson text is never shipped to a browser that is not allowed to read it.
import { lessonById, moduleOf } from '../src/course/curriculum.js';
import { canOpenModule, isFreeModule, tracksWithModule } from '../src/course/access.js';
import { lessonVideos } from '../src/course/videos.js';
import { plansFromToken, userFromToken } from './_dodo.js';
import { lessons } from './_lessons.js';

export default async function handler(req, res) {
  const id = String(req.query?.id || new URL(req.url, 'http://x').searchParams.get('id') || '');
  if (!/^[a-z0-9-]{1,80}$/.test(id) || !lessonById[id]) return res.status(404).json({ error: 'No such lesson.' });
  const moduleId = moduleOf(id).id, free = isFreeModule(moduleId);
  res.setHeader('Cache-Control', 'private, no-store');
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (free) {
    if (!(await userFromToken(token))) return res.status(401).json({ locked: true, reason: 'signin', tracks: [] });
  } else {
    const plans = token && (await userFromToken(token)) ? await plansFromToken(token) : null;
    if (!plans) return res.status(401).json({ locked: true, reason: 'signin', tracks: tracksWithModule(moduleId) });
    if (!canOpenModule(moduleId, plans)) return res.status(403).json({ locked: true, reason: 'plan', tracks: tracksWithModule(moduleId) });
  }
  const body = lessons[id];
  if (!body) return res.status(404).json({ error: 'This lesson is not available yet.' });
  res.status(200).json({ ...body, video: lessonVideos[id] || null });
}
