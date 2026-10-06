// Runs after `vite build`. For every public page it writes dist/<path>/index.html
// with that page's own title, description, canonical URL, structured data and a
// plain-HTML copy of its content, so search engines and link previews get real
// text without running JavaScript. React replaces the copy when the app loads.
// Also writes dist/sitemap.xml and dist/app.html (the bare shell that private
// and unknown URLs fall back to; see vercel.json).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
const load = file => vite.ssrLoadModule(file);
const { seoFor, seoRoutes, ldJson, clip } = await load('/src/seo.js');
const { modules, allLessons, lessonById, moduleOf } = await load('/src/course/curriculum.js');
const { tracks, PERIODS, formatPrice } = await load('/src/course/tracks.js');
const { guide, glossary, faqs } = await load('/src/course/reference.js');
const { resources } = await load('/src/course/resources.js');
const { VIZ } = await load('/src/course/vizNames.js');
const { lessonMinutes } = await load('/src/course/lessonMinutes.js');
const { BRAND, PROGRAM, SITE_URL, TAGLINE } = await load('/src/brand.js');
await vite.close();

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Lesson text uses **bold**, *italic* and `code`.
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
const a = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const list = (items, tag = 'ul') => items.length ? `<${tag}>${items.map(i => `<li>${i}</li>`).join('')}</${tag}>` : '';
const say = v => typeof v === 'string' ? rich(v) : v && typeof v === 'object' ? [v.title || v.label || v.term, v.text || v.body || v.desc || v.def || v.detail].filter(Boolean).map((t, i) => i ? rich(t) : `<strong>${rich(t)}</strong>`).join(': ') : '';

const NAV = [['/curriculum', 'Curriculum'], ['/guide', 'Course guide'], ['/lab', 'Lab'], ['/pricing', 'Pricing'], ['/practice', 'Practice'], ['/glossary', 'Glossary'], ['/faq', 'FAQ'], ['/news', 'Live news'], ['/resources', 'Resources']];
const frame = main => `<div class="prerender"><header><a href="/"><strong>${BRAND}</strong></a><nav aria-label="Main navigation">${NAV.map(([h, t]) => a(h, t)).join('')}</nav></header><main>${main}</main><footer><p>${esc(BRAND)}: the ${esc(PROGRAM)}. ${esc(TAGLINE)}</p></footer></div>`;
const trackLine = t => `${t.modules.length} modules · ${t.lessons.length} lessons · ${t.labs.length} interactive labs · from ${esc(formatPrice(t.prices.monthly))} per month`;
const trackCards = () => tracks.map(t => `<h3>${a(`/curriculum?track=${t.id}`, t.name)}</h3><p>${esc(t.blurb)}</p><p>${trackLine(t)}</p>`).join('');
const crumbs = items => `<nav aria-label="Breadcrumb">${items.map(([h, t]) => a(h, t)).join(' / ')}</nav>`;

function block(b) {
  switch (b.type) {
    case 'p': return `<p>${rich(b.text)}</p>`;
    case 'callout': return `<p><strong>${rich(b.title || '')}</strong> ${rich(b.text || '')}</p>`;
    case 'list': return list((b.items || []).map(say));
    case 'steps': case 'timeline': return (b.title ? `<h3>${rich(b.title)}</h3>` : '') + list((b.items || []).map(say), 'ol');
    case 'check': return `<p><strong>Pause and think:</strong> ${rich(b.question)}</p><p>${rich(b.answer)}</p>`;
    case 'table': return `<table>${b.caption ? `<caption>${rich(b.caption)}</caption>` : ''}<thead><tr>${(b.head || []).map(h => `<th>${rich(h)}</th>`).join('')}</tr></thead><tbody>${(b.rows || []).map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'code': return `${b.title ? `<h3>${rich(b.title)}</h3>` : ''}<pre><code>${esc(b.code)}</code></pre>${b.output ? `<p>Output:</p><pre>${esc(b.output)}</pre>` : ''}`;
    default: return '';
  }
}

const PAGES = {
  '/': () => `<p>${esc(PROGRAM)} · 3 tracks · ${allLessons.length} lessons</p><h1>See the system. Then go inside.</h1>
    <p>Learn AI engineering, machine learning and deep learning, from the first data point to the LLM systems behind every answer.</p>
    <p>${a('/curriculum', 'Explore the curriculum')} · ${a('/guide', 'Read the course guide')} · ${a(`/lesson/${allLessons[0].id}`, `Start lesson ${allLessons[0].num}`)}</p>
    <h2>Three tracks: choose your learning track</h2>${trackCards()}<p>${a('/pricing', 'Compare plans and pricing')}</p>
    <h2>${modules.length} modules, from foundations to production AI</h2>${list(modules.map(m => `${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)} (${m.lessons.length} lessons). ${esc(m.intro[0])}`), 'ol')}`,
  '/curriculum': () => `<p>${esc(PROGRAM)} · Curriculum</p><h1>Choose your learning track</h1>
    <p>Learn machine learning and deep learning, generative AI engineering, or the complete path with career preparation. Every lesson ends with a 5-question quiz.</p>${trackCards()}
    ${modules.map(m => `<h2>${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)}</h2><p>${esc(m.intro[0])}</p>${list(m.lessons.map(l => a(`/lesson/${l.id}`, `${l.num} ${l.title}`)), 'ol')}`).join('')}`,
  '/pricing': () => `<p>Pricing</p><h1>Pick the track that fits your goal</h1><p>Three tracks, each with its lessons, quizzes and hands-on labs. Pay monthly, for three months, or once for lifetime access.</p>
    ${tracks.map(t => `<h2>${esc(t.name)}</h2><p>${esc(t.blurb)}</p>${list([...PERIODS.map(p => `${esc(p.label)}: ${esc(formatPrice(t.prices[p.id]))} ${esc(p.unit)}`), `${t.modules.length} modules, ${t.lessons.length} lessons`, `${t.labs.length} interactive labs`, ...t.extras.map(esc)])}`).join('')}
    <h2>What each track covers</h2>${list(modules.map(m => `${a(`/module/${m.id}`, `${m.number}. ${m.title}`)}: ${tracks.filter(t => t.moduleIds.includes(m.id)).map(t => esc(t.short)).join(', ')}`))}`,
  '/guide': () => `<p>Course guide</p><h1>Everything you need before lesson one</h1><p>${esc(guide.about.lead)}</p>
    <h2>${esc(guide.about.title)}</h2>${guide.about.body.map(p => `<p>${esc(p)}</p>`).join('')}${list(guide.about.points.map(([t, d]) => `<strong>${esc(t)}</strong>: ${esc(d)}`))}
    <h2>${esc(guide.whatIs.title)}</h2><p>${esc(guide.whatIs.lead)}</p>${guide.whatIs.body.map(p => `<p>${esc(p)}</p>`).join('')}<p>AI engineering = ${guide.whatIs.equation.map(esc).join(' + ')}</p>
    <h2>${esc(guide.audience.title)}</h2>${list(guide.audience.items.map(([x, y]) => `<strong>${esc(x)}</strong> ${esc(y)}`))}
    <h2>What will we learn?</h2>${list(modules.map(m => `${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)}: ${m.lessons.slice(0, 6).map(l => esc(l.title)).join(' · ')}`))}
    <h2>${esc(guide.prerequisites.title)}</h2>${list(guide.prerequisites.items.map(([t, d]) => `<strong>${esc(t)}</strong>: ${esc(d)}`))}
    <h2>${esc(guide.howTo.title)}</h2>${list(guide.howTo.items.map(esc), 'ol')}`,
  '/lab': () => `<p>Interactive lab</p><h1>Play with every idea</h1><p>${Object.keys(VIZ).length} hands-on simulations from across the course. Each one links to the lesson that explains it.</p>
    ${list(Object.entries(VIZ).map(([n, d]) => `<strong>${esc(n.replace(/-/g, ' '))}</strong>: ${esc(d)}`))}`,
  '/practice': () => `<p>Practice</p><h1>Python practice playground</h1><p>${esc(seoFor('/practice').description)}</p>`,
  '/glossary': () => `<p>Reference</p><h1>AI engineering glossary</h1><p>Quick definitions of the most important terms. Each links to the lesson that teaches it in depth.</p>
    <dl>${[...glossary].sort((x, y) => x.term.localeCompare(y.term)).map(g => `<dt>${esc(g.term)}</dt><dd>${esc(g.def)}${lessonById[g.lesson] ? ` ${a(`/lesson/${g.lesson}`, `Lesson ${lessonById[g.lesson].num}`)}` : ''}</dd>`).join('')}</dl>`,
  '/faq': () => `<p>Questions</p><h1>AI engineering course FAQs</h1>${faqs.map(([q, ans]) => `<h2>${esc(q)}</h2><p>${esc(ans)}</p>`).join('')}`,
  '/news': () => `<p>Live news</p><h1>What is happening in AI this week</h1><p>The latest announcements and research, taken directly from the official blogs of AI labs, companies and universities. Each card opens the original article on the publisher’s own site.</p>`,
  '/resources': () => `<p>Resources</p><h1>Papers, documentation and standards</h1><p>The original sources and reference manuals behind the course, gathered in one place.</p>
    ${resources.map(g => `<h2>${esc(g.group)}</h2><p>${esc(g.note)}</p>${list(g.items.map(r => `<a href="${esc(r.url)}" rel="noreferrer">${esc(r.title)}</a>${r.by ? ` (${esc(r.by)})` : ''}: ${esc(r.about)}`))}`).join('')}`,
};

function modulePage(m) {
  const i = modules.indexOf(m), prev = modules[i - 1], next = modules[i + 1];
  return `${crumbs([['/curriculum', 'Curriculum']])}<p>Module ${m.number} · ${esc(m.stage)}</p><h1>${esc(m.title)}</h1>${m.intro.map(p => `<p>${esc(p)}</p>`).join('')}
    <h2>Lessons</h2>${list(m.lessons.map(l => `${a(`/lesson/${l.id}`, `${l.num} ${l.title}`)}${l.covers?.length ? `: ${l.covers.map(esc).join(' · ')}` : ''}`), 'ol')}
    <p>${[prev && a(`/module/${prev.id}`, `← Module ${prev.number}: ${prev.title}`), next && a(`/module/${next.id}`, `Module ${next.number}: ${next.title} →`)].filter(Boolean).join(' · ')}</p>`;
}

async function lessonPage(l) {
  const m = moduleOf(l.id), i = allLessons.findIndex(x => x.id === l.id), prev = allLessons[i - 1], next = allLessons[i + 1];
  const body = (await import(pathToFileURL(path.resolve(`src/course/lessons/${l.id}.js`)).href)).default;
  return { summary: body.summary, html: `${crumbs([['/curriculum', 'Curriculum'], [`/module/${m.id}`, `Module ${m.number}: ${m.title}`]])}
    <p>Lesson ${l.num} · ${lessonMinutes[l.id]} min</p><h1>${esc(l.title)}</h1>${body.hook ? `<p>${rich(body.hook)}</p>` : ''}${body.summary ? `<p><strong>In short:</strong> ${rich(body.summary)}</p>` : ''}
    ${(body.sections || []).map(s => `<h2>${rich(s.title)}</h2>${(s.blocks || []).map(block).join('')}`).join('')}
    ${body.takeaways?.length ? `<h2>Key takeaways</h2>${list(body.takeaways.map(say))}` : ''}${body.terms?.length ? `<h2>Key terms</h2>${list(body.terms.map(say))}` : ''}
    <p>${[prev && a(`/lesson/${prev.id}`, `← ${prev.num} ${prev.title}`), next && a(`/lesson/${next.id}`, `${next.num} ${next.title} →`)].filter(Boolean).join(' · ')}</p>` };
}

const shell = fs.readFileSync('dist/index.html', 'utf8');
const MARK = /<!--seo-->[\s\S]*?<!--\/seo-->/;
if (!MARK.test(shell) || !shell.includes('<div id="root"></div>')) throw new Error('dist/index.html is missing the seo markers or the root element');
function head(seo) {
  const url = SITE_URL + (seo.path === '/' ? '/' : seo.path);
  return [`<title>${esc(seo.title)}</title>`, `<meta name="description" content="${esc(seo.description)}"/>`, `<meta name="robots" content="${seo.robots}"/>`, `<link rel="canonical" href="${url}"/>`,
    `<meta property="og:title" content="${esc(seo.title)}"/>`, `<meta property="og:description" content="${esc(seo.description)}"/>`, `<meta property="og:url" content="${url}"/>`, `<meta property="og:type" content="${seo.type}"/>`,
    `<meta name="twitter:title" content="${esc(seo.title)}"/>`, `<meta name="twitter:description" content="${esc(seo.description)}"/>`,
    seo.ld.length ? `<script type="application/ld+json" data-seo>${ldJson(seo)}</script>` : ''].filter(Boolean).join('\n  ');
}

// Private pages and unknown URLs: the plain app shell, kept out of search results.
fs.writeFileSync('dist/app.html', shell.replace(MARK, `<title>${BRAND}</title>\n  <meta name="robots" content="noindex, follow"/>`));

const routes = seoRoutes();
let bytes = 0;
for (const route of routes) {
  const seo = seoFor(route), [, kind, id] = route.split('/');
  let main;
  if (kind === 'module') main = modulePage(modules.find(m => m.id === id));
  else if (kind === 'lesson') { const page = await lessonPage(lessonById[id]); main = page.html; if (page.summary) seo.description = clip(page.summary); }
  else main = PAGES[route]();
  const html = shell.replace(MARK, head(seo)).replace('<div id="root"></div>', `<div id="root">${frame(main.replace(/\n\s+/g, '\n'))}</div>`);
  const file = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html); bytes += html.length;
}

const today = new Date().toISOString().slice(0, 10);
const priority = r => r === '/' ? '1.0' : r.startsWith('/lesson/') ? '0.7' : r.startsWith('/module/') ? '0.8' : '0.9';
fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><priority>${priority(r)}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log(`prerendered ${routes.length} pages (${(bytes / 1e6).toFixed(1)} MB), sitemap.xml and app.html`);
