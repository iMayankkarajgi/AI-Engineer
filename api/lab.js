// GET /api/lab?name=<lab>: the code of one interactive lab, sent only to a
// signed-in learner whose plan includes it (the free lab needs an account too).
// At build time scripts/protect-labs.mjs moves each lab's code out of the public
// assets into a folder whose name is derived from a server secret; this function
// is the only thing that knows that name.
import { VIZ } from '../src/course/vizNames.js';
import { vizUsage } from '../src/course/vizUsage.js';
import { lessonById, moduleOf } from '../src/course/curriculum.js';
import { canOpenModule } from '../src/course/access.js';
import { labUnlocked } from '../src/course/tracks.js';
import { labsFolder } from './_labs.js';
import { learner } from './_grade.js';

// A lab is open when the plan covers its track, or covers any lesson that uses it.
export const canOpenLab = (name, plans) => labUnlocked(name, plans) || (vizUsage[name] || []).some(id => lessonById[id] && canOpenModule(moduleOf(id).id, plans));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const name = String(req.query?.name || new URL(req.url, 'http://x').searchParams.get('name') || '');
  if (!/^[a-z0-9-]{1,60}$/.test(name) || !VIZ[name]) return res.status(404).json({ error: 'No such lab.' });
  const folder = labsFolder();
  // This build keeps its labs in the public bundle (no server secret at build time): tell the page to use them.
  if (!folder) return res.status(404).json({ error: 'Labs are not served from here.', bundled: true });
  const who = await learner(req);
  if (!who) return res.status(401).json({ locked: true, reason: 'signin' });
  if (!canOpenLab(name, who.plans)) return res.status(403).json({ locked: true, reason: 'plan' });
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host, proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
    const r = await fetch(`${proto}://${host}/_labs/${folder}/${name}.js`);
    if (!r.ok) return res.status(404).json({ error: 'This lab is not available.', bundled: r.status === 404 });
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    res.status(200).send(await r.text());
  } catch (err) {
    console.error('lab fetch failed:', err.message);
    res.status(502).json({ error: 'Could not load the lab. Please try again.' });
  }
}
