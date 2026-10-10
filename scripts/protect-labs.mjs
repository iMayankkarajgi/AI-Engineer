// Runs after `vite build`. Removes the final exam's question file from the
// public assets, and moves the code of every interactive lab out of the
// public assets folder into dist/_labs/<hidden folder>/<lab>.js, where only the
// lab function (api/lab.js) fetches it after checking the learner's plan.
// Without a server secret at build time the labs stay in the public bundle and
// the page loads them the ordinary way.
//   node scripts/protect-labs.mjs [outDir]
import fs from 'node:fs';
import path from 'node:path';
import { labsFolder } from '../api/_labs.js';

const out = process.argv[2] || 'dist';
const manifestFile = path.join(out, '.vite', 'manifest.json');
if (!fs.existsSync(manifestFile)) throw new Error(`${manifestFile} is missing: build with build.manifest on`);
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
// The manifest lists every file of the build; it is not needed by the site.
fs.rmSync(path.join(out, '.vite'), { recursive: true, force: true });

// The final exam's questions and answers are served by api/exam.js only. The build
// still writes the file (nothing on the site loads it), so remove it here.
for (const [src, entry] of Object.entries(manifest)) if (src === 'src/course/exam.js' && entry.file) { fs.rmSync(path.join(out, entry.file), { force: true }); console.log('exam: question file removed from the public assets'); }

const folder = labsFolder();
if (!folder) { console.log('labs: no server secret at build time, so lab code stays in the public bundle'); process.exit(0); }
const dir = path.join(out, '_labs', folder);
fs.mkdirSync(dir, { recursive: true });
let moved = 0;
for (const [src, entry] of Object.entries(manifest)) {
  const m = src.match(/^src\/viz\/widgets\/([a-z0-9-]+)\.jsx$/);
  if (!m || !entry.file) continue;
  const from = path.join(out, entry.file);
  if (!fs.existsSync(from)) continue;
  fs.renameSync(from, path.join(dir, `${m[1]}.js`));
  moved++;
}
if (!moved) throw new Error('labs: no lab code was found in the build');
console.log(`labs: ${moved} labs moved out of the public assets`);
