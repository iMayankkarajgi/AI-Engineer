// Checks lesson files in src/course/lessons against the lesson schema.
// Usage: node scripts/validate-lessons.mjs [lesson-id ...]   (no ids = all)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allLessons } from '../src/course/curriculum.js';
import { VIZ_NAMES } from '../src/course/vizNames.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, 'src/course/lessons');
const wanted = process.argv.slice(2);
const targets = wanted.length ? wanted : allLessons.map(l => l.id);

const BLOCKS = ['p', 'list', 'callout', 'steps', 'code', 'table', 'compare', 'chart', 'flow', 'matrix', 'timeline', 'formula', 'viz', 'check', 'deeper', 'tabs'];
const VISUAL = ['viz', 'chart', 'flow', 'matrix', 'timeline'];
const TONES = ['note', 'tip', 'warn', 'example', 'analogy'];
let failures = 0, missing = 0, ok = 0;

function walk(blocks, visit) {
  for (const b of blocks || []) {
    visit(b);
    if (b.type === 'deeper') walk(b.blocks, visit);
    if (b.type === 'tabs') b.items?.forEach(t => walk(t.blocks, visit));
  }
}

for (const id of targets) {
  const file = path.join(dir, `${id}.js`);
  if (!fs.existsSync(file)) { missing++; if (wanted.length) console.log(`✗ ${id}: file missing`); continue; }
  const errs = [], warn = [];
  let L;
  try { L = (await import(pathToFileURL(file).href + '?t=' + Date.now())).default; }
  catch (e) { console.log(`✗ ${id}: does not load: ${e.message}`); failures++; continue; }
  const E = (cond, msg) => { if (!cond) errs.push(msg); };
  E(L && typeof L === 'object', 'default export must be an object');
  E(L.id === id, `id must be "${id}"`);
  E(Number.isFinite(L.minutes) && L.minutes >= 5 && L.minutes <= 40, 'minutes must be 5–40');
  E(typeof L.hook === 'string' && L.hook.length > 20, 'hook missing');
  E(typeof L.summary === 'string' && L.summary.length > 60, 'summary missing');
  E(Array.isArray(L.sections) && L.sections.length >= 5, 'need at least 5 sections');
  const counts = {};
  const sectionIds = new Set();
  let words = 0;
  for (const s of L.sections || []) {
    E(/^[a-z0-9-]+$/.test(s.id || ''), `section id "${s.id}" must be kebab-case`);
    E(!sectionIds.has(s.id), `duplicate section id ${s.id}`); sectionIds.add(s.id);
    E(typeof s.title === 'string' && s.title, `section ${s.id} needs a title`);
    E(Array.isArray(s.blocks) && s.blocks.length, `section ${s.id} has no blocks`);
    walk(s.blocks, b => {
      counts[b.type] = (counts[b.type] || 0) + 1;
      const where = `${s.id}/${b.type}`;
      E(BLOCKS.includes(b.type), `unknown block type "${b.type}" in ${s.id}`);
      const text = JSON.stringify(b);
      words += text.split(/\s+/).length;
      switch (b.type) {
        case 'p': E(typeof b.text === 'string' && b.text.length > 0, `${where}: text`); break;
        case 'list': E(Array.isArray(b.items) && b.items.every(x => typeof x === 'string'), `${where}: items must be strings`); break;
        case 'callout': E(TONES.includes(b.tone), `${where}: tone must be one of ${TONES}`); E(typeof b.text === 'string', `${where}: text`); break;
        case 'steps': E(Array.isArray(b.items) && b.items.length >= 2 && b.items.every(x => x.title && x.text), `${where}: items need {title,text}`); break;
        case 'code':
          E(typeof b.code === 'string' && b.code.split('\n').length >= 4, `${where}: code too short`);
          E(typeof b.lang === 'string', `${where}: lang`);
          if (b.walkthrough) E(b.walkthrough.every(w => Array.isArray(w.lines) && w.lines.length === 2 && w.note && w.lines[0] >= 1 && w.lines[1] <= b.code.split('\n').length && w.lines[0] <= w.lines[1]), `${where}: walkthrough items need lines:[from,to] within the code and a note`);
          break;
        case 'table': E(Array.isArray(b.head) && Array.isArray(b.rows) && b.rows.every(r => r.length === b.head.length), `${where}: every row needs ${b.head?.length} cells`); break;
        case 'compare':
          E(Array.isArray(b.options) && b.options.length >= 2 && b.options.every(o => o.name && o.summary), `${where}: options need {name, summary}`);
          if (b.rows) E(b.rows.every(r => r.length === b.options.length + 1), `${where}: each row is [aspect, ...one value per option]`);
          break;
        case 'chart':
          E(['bar', 'hbar', 'line', 'area', 'scatter'].includes(b.kind), `${where}: kind`);
          if (['bar', 'hbar'].includes(b.kind)) E(Array.isArray(b.labels) && b.series?.every(s => s.values?.length === b.labels.length && s.values.every(Number.isFinite)), `${where}: bar series need values matching labels`);
          else E(b.series?.every(s => s.points?.length >= 2 && s.points.every(p => p.length === 2 && p.every(Number.isFinite))), `${where}: series need points [[x,y],...]`);
          E(typeof b.title === 'string', `${where}: title`);
          break;
        case 'flow': E(Array.isArray(b.nodes) && b.nodes.length >= 2 && b.nodes.every(n => n.label && n.detail), `${where}: nodes need {label, detail}`); break;
        case 'matrix': E(b.rows?.length && b.cols?.length && b.values?.length === b.rows.length && b.values.every(r => r.length === b.cols.length && r.every(v => v === null || Number.isFinite(v))), `${where}: values must be rows × cols numbers (null allowed)`); break;
        case 'timeline': E(Array.isArray(b.items) && b.items.every(x => x.when && x.title && x.text), `${where}: items need {when,title,text}`); break;
        case 'formula': E(typeof b.expr === 'string', `${where}: expr`); if (b.where) E(b.where.every(w => w.length === 2), `${where}: where rows are [symbol, meaning]`); break;
        case 'viz': E(VIZ_NAMES.includes(b.name), `${where}: unknown viz "${b.name}"`); break;
        case 'check': E(b.question && b.answer, `${where}: question and answer`); break;
        case 'deeper': E(b.title && Array.isArray(b.blocks), `${where}: title and blocks`); break;
        case 'tabs': E(Array.isArray(b.items) && b.items.length >= 2 && b.items.every(t => t.label && Array.isArray(t.blocks)), `${where}: items need {label, blocks}`); break;
      }
    });
  }
  E(VISUAL.some(t => counts[t]), 'needs at least one animated visual (viz, chart, flow, matrix or timeline)');
  E(counts.code >= 1, 'needs at least one code block');
  E(counts.compare >= 1 || counts.table >= 1, 'needs a compare or table block');
  E(counts.steps >= 1, 'needs a steps block');
  E(counts.check >= 1, 'needs at least one check block');
  if (!walkHasOutput(L.sections)) warn.push('no code block has an output');
  E(Array.isArray(L.quiz) && L.quiz.length === 5, 'quiz must have exactly 5 questions');
  (L.quiz || []).forEach((q, i) => {
    E(typeof q.q === 'string' && q.q.length > 10, `quiz ${i + 1}: q`);
    E(Array.isArray(q.options) && q.options.length === 4 && new Set(q.options).size === 4, `quiz ${i + 1}: needs 4 distinct options`);
    E(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `quiz ${i + 1}: answer must be 0–3`);
    E(typeof q.explain === 'string' && q.explain.length > 20, `quiz ${i + 1}: explain`);
  });
  if (L.quiz?.length === 5) E(new Set(L.quiz.map(q => q.answer)).size >= 3, 'quiz answers must use at least 3 different positions');
  // The right answer must not stand out by length.
  let longestRight = 0;
  (L.quiz || []).forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length !== 4) return;
    const right = q.options[q.answer]?.length || 0, wrong = Math.max(...q.options.filter((_, j) => j !== q.answer).map(o => o.length));
    E(right <= wrong * 1.25 + 8, `quiz ${i + 1}: correct option is much longer than every distractor (${right} vs ${wrong} chars); balance option lengths`);
    if (right > wrong) longestRight++;
  });
  E(longestRight <= 2, `correct option is the longest in ${longestRight} of 5 questions; at most 2 allowed`);
  E(Array.isArray(L.takeaways) && L.takeaways.length >= 3, 'need at least 3 takeaways');
  if (L.terms) E(L.terms.every(t => t.term && t.def), 'terms need {term, def}');
  if (words < 1200) warn.push(`only ~${words} words; aim for 1,800+`);
  if (errs.length) { failures++; console.log(`✗ ${id}\n  - ${errs.join('\n  - ')}`); }
  else { ok++; console.log(`✓ ${id}${warn.length ? '  (warn: ' + warn.join('; ') + ')' : ''}`); }
}
function walkHasOutput(sections) { let has = false; for (const s of sections || []) walk(s.blocks, b => { if (b.type === 'code' && b.output) has = true; }); return has; }
console.log(`\n${ok} valid, ${failures} invalid${wanted.length ? '' : `, ${missing} not written yet`}`);
process.exit(failures ? 1 : 0);
