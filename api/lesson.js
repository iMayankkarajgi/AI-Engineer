// GET /api/lesson?id=<lesson id>: the lesson's text, quiz and video.
// Free lessons are sent to anyone. Every other lesson is sent only when the
// request carries the sign-in token of a learner whose plan includes it, so
// paid lessons are never shipped to browsers that have not paid for them.
import { lessonById, moduleOf } from '../src/course/curriculum.js';
import { canOpenModule, isFreeModule, tracksWithModule } from '../src/course/access.js';
import { lessonVideos } from '../src/course/videos.js';
import { plansFromToken } from './_dodo.js';
import { lessons } from './_lessons.js';

export default async function handler(req, res) {
  const id = String(req.query?.id || new URL(req.url, 'http://x').searchParams.get('id') || '');
  if (!/^[a-z0-9-]{1,80}$/.test(id) || !lessonById[id]) return res.status(404).json({ error: 'No such lesson.' });
  const moduleId = moduleOf(id).id, free = isFreeModule(moduleId);
  if (!free) {
    res.setHeader('Cache-Control', 'private, no-store');
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const plans = token ? await plansFromToken(token) : null;
    if (!plans) return res.status(401).json({ locked: true, reason: 'signin', tracks: tracksWithModule(moduleId) });
    if (!canOpenModule(moduleId, plans)) return res.status(403).json({ locked: true, reason: 'plan', tracks: tracksWithModule(moduleId) });
  } else res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  const body = lessons[id];
  if (!body) return res.status(404).json({ error: 'This lesson is not available yet.' });
  res.status(200).json({ ...body, video: lessonVideos[id] || null });
}
