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
const { glossary, faqs } = await load('/src/course/reference.js');
const { posts } = await load('/src/course/blog.js');
const { landingPages } = await load('/src/course/landing.js');
const { resources } = await load('/src/course/resources.js');
const { VIZ } = await load('/src/course/vizNames.js');
const { lessonMinutes } = await load('/src/course/lessonMinutes.js');
const { BRAND, PROGRAM, SITE_URL, TAGLINE, CONTACT_EMAIL, LEGAL_UPDATED } = await load('/src/brand.js');
const { legalPages } = await load('/src/course/legal.js');
const { roadmapSteps, roadmapTotals, roadmapText } = await load('/src/course/roadmap.js');
const { lessonVideos } = await load('/src/course/videos.js');
const { isFreeModule, tracksWithModule } = await load('/src/course/access.js');
const { trackById } = await load('/src/course/tracks.js');
await vite.close();

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Lesson text uses **bold**, *italic* and `code`.
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
const a = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const list = (items, tag = 'ul') => items.length ? `<${tag}>${items.map(i => `<li>${i}</li>`).join('')}</${tag}>` : '';
const say = v => typeof v === 'string' ? rich(v) : v && typeof v === 'object' ? [v.title || v.label || v.term, v.text || v.body || v.desc || v.def || v.detail].filter(Boolean).map((t, i) => i ? rich(t) : `<strong>${rich(t)}</strong>`).join(': ') : '';

const NAV = [['/curriculum', 'Curriculum'], ['/ai-engineering-course', 'AI engineering course'], ['/machine-learning-course', 'Machine learning course'], ['/generative-ai-course', 'Generative AI course'], ['/lab', 'Lab'], ['/pricing', 'Pricing'], ['/practice', 'Practice'], ['/glossary', 'Glossary'], ['/faq', 'FAQ'], ['/blog', 'Blog'], ['/news', 'Live news'], ['/resources', 'Resources']];
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

const legal = key => { const d = legalPages[key]; return `<p>Legal · Updated ${esc(LEGAL_UPDATED)}</p><h1>${esc(d.title)}</h1><p>${esc(d.intro)}</p>${d.sections.map((s, i) => `<h2>${i + 1}. ${esc(s.h)}</h2>${(s.p || []).map(t => `<p>${esc(t)}</p>`).join('')}${list((s.items || []).map(esc))}`).join('')}<p>Questions? Email ${esc(CONTACT_EMAIL)}.</p>`; };
const PAGES = {
  '/ai-engineer-roadmap': () => `<p>${esc(PROGRAM)} · Roadmap</p><h1>${esc(roadmapText.title)}</h1><p>${esc(roadmapText.intro)}</p>
    <h2>What does an AI engineer do?</h2>${roadmapText.what.map(t => `<p>${esc(t)}</p>`).join('')}<p>${esc(roadmapText.versus)}</p>
    <h2>The skills an AI engineer needs</h2><p>${esc(roadmapText.skills)}</p>
    <h2>The roadmap, step by step</h2>${roadmapSteps.map((s, i) => `<h3>Step ${i + 1}: ${esc(s.stage)}</h3>${s.modules.map(m => `<p>${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)} (${m.lessons.length} lessons, about ${m.hours} hours). ${esc(m.intro)}</p>${list(m.lessons.map(l => a(`/lesson/${l.id}`, `${l.num} ${l.title}`)))}`).join('')}`).join('')}
    <h2>How long does it take to become an AI engineer?</h2><p>About ${roadmapTotals.hours} hours of lessons, labs and quizzes.</p>${list(roadmapText.pace.map(([label, weeks]) => `At ${esc(label)}: about ${weeks} weeks.`))}`,
  '/privacy': () => legal('privacy'),
  '/terms': () => legal('terms'),
  '/refund': () => legal('refund'),
  '/': () => `<p>${esc(PROGRAM)} · 3 tracks · ${allLessons.length} lessons</p><h1>See the system. Then go inside.</h1>
    <p>Learn AI engineering, machine learning, deep learning and generative AI in one online course, from the first data point to the LLM systems behind every answer. ${allLessons.length} video lessons, interactive labs, a quiz in every lesson, a final exam and a certificate.</p>
    <h2>Courses</h2>${list(landingPages.map(p => `${a(p.path, p.h1)}: ${esc(p.description)}`))}
    <h2>What you will learn</h2>${list(['Machine learning: regression, loss functions, gradient descent, regularisation, precision and recall', 'Deep learning: neural networks, backpropagation, normalisation, dropout and Transformers', 'Generative AI and large language models (LLMs): tokens, embeddings, attention and sampling', 'Prompt engineering and context engineering', 'Retrieval-augmented generation (RAG), embeddings and vector databases', 'AI agents: tool calling, memory, MCP and multi-agent systems', 'Fine-tuning: LoRA, quantization, distillation, RLHF', 'LLM inference, serving, evaluation, guardrails and AI system design', 'AI engineer interview preparation'])}
    <p>${a('/curriculum', 'Explore the curriculum')} · ${a('/ai-engineer-roadmap', 'See the AI engineer roadmap')} · ${a('/blog', 'Read the blog')} · ${a(`/lesson/${allLessons[0].id}`, `Start lesson ${allLessons[0].num}`)}</p>
    <h2>Three tracks: choose your learning track</h2>${trackCards()}<p>${a('/pricing', 'Compare plans and pricing')}</p>
    <h2>${modules.length} modules, from foundations to production AI</h2>${list(modules.map(m => `${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)} (${m.lessons.length} lessons). ${esc(m.intro[0])}`), 'ol')}`,
  '/curriculum': () => `<p>${esc(PROGRAM)} · Curriculum</p><h1>Choose your learning track</h1>
    <p>Learn machine learning and deep learning, generative AI engineering, or the complete path with career preparation. Every lesson ends with a 5-question quiz.</p>${trackCards()}
    ${modules.map(m => `<h2>${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)}</h2><p>${esc(m.intro[0])}</p>${list(m.lessons.map(l => a(`/lesson/${l.id}`, `${l.num} ${l.title}`)), 'ol')}`).join('')}`,
  '/pricing': () => `<p>Pricing</p><h1>Pick the track that fits your goal</h1><p>Three tracks, each with its lessons, quizzes and hands-on labs. Pay for one month, or once for lifetime access. Prices include taxes.</p>
    ${tracks.map(t => `<h2>${esc(t.name)}</h2><p>${esc(t.blurb)}</p>${list([...PERIODS.map(p => `${esc(p.label)}: ${esc(formatPrice(t.prices[p.id]))} in India, ${esc(formatPrice(t.allPrices.USD[p.id], 'USD'))} elsewhere, ${esc(p.unit)}`), `${t.modules.length} modules, ${t.lessons.length} lessons`, `${t.labs.length} interactive labs`, ...t.extras.map(esc)])}`).join('')}
    <h2>What each track covers</h2>${list(modules.map(m => `${a(`/module/${m.id}`, `${m.number}. ${m.title}`)}: ${tracks.filter(t => t.moduleIds.includes(m.id)).map(t => esc(t.short)).join(', ')}`))}`,
  ...Object.fromEntries(landingPages.map(p => [p.path, () => {
    const t = trackById[p.track];
    return `${crumbs([['/curriculum', 'Curriculum']])}<p>${esc(PROGRAM)} · ${esc(p.eyebrow)}</p><h1>${esc(p.h1)}</h1><p>${esc(p.lead)}</p>
    <p>${t.modules.length} modules · ${t.lessons.length} video lessons · ${t.labs.length} interactive labs · a quiz in every lesson</p>
    <h2>What you will learn</h2>${list(p.learn.map(esc))}
    <h2>Who this course is for</h2>${list(p.audience.map(([who, why]) => `<strong>${esc(who)}</strong> ${esc(why)}`))}
    <h2>Course syllabus: ${t.modules.length} modules</h2>${list(t.modules.map(m => `${a(`/module/${m.id}`, `Module ${m.number}: ${m.title}`)} (${m.lessons.length} lessons). ${esc(m.intro[0])}`), 'ol')}
    <h2>How the course works</h2>${list(['Every lesson has a video, a written explanation with diagrams, and real code', 'Interactive labs let you change a value and watch the result', 'A 5-question quiz ends each lesson; 4 correct is a pass', 'Run Python in your browser on the Practice page', 'Learn at your own pace and open lessons in any order'])}
    <h2>Price</h2><p>${esc(t.name)}: ${esc(formatPrice(t.prices.monthly))} for one month or ${esc(formatPrice(t.prices.lifetime))} once for lifetime access in India; ${esc(formatPrice(t.allPrices.USD.monthly, 'USD'))} or ${esc(formatPrice(t.allPrices.USD.lifetime, 'USD'))} elsewhere. Taxes are included. ${a('/pricing', 'Compare plans')}.</p>
    <h2>Frequently asked questions</h2>${p.faqs.map(([q, ans]) => `<h3>${esc(q)}</h3><p>${esc(ans)}</p>`).join('')}
    <h2>Other courses</h2>${list([...landingPages.filter(x => x.path !== p.path).map(x => a(x.path, x.h1)), a('/ai-engineer-roadmap', 'AI engineer roadmap'), a('/blog', 'Read the blog')])}`;
  }])),
  '/blog': () => `<p>Blog</p><h1>AI engineering, explained simply</h1><p>Guides on AI engineering, machine learning and deep learning: what the terms mean, what to learn, and in what order.</p>
    ${[...posts].sort((x, y) => y.date.localeCompare(x.date)).map(p => `<h2>${a(`/blog/${p.slug}`, p.title)}</h2><p>${esc(p.description)}</p>`).join('')}`,
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

function blogPage(p) {
  const others = posts.filter(x => x.slug !== p.slug).slice(0, 4);
  return `${crumbs([['/blog', 'Blog']])}<article><h1>${esc(p.title)}</h1><p>By ${esc(BRAND)} · <time datetime="${p.date}">${p.date}</time> · ${p.minutes} min read</p>${p.intro.map(t => `<p>${esc(t)}</p>`).join('')}
    ${p.sections.map(s => `<h2>${esc(s.h)}</h2>${(s.body || []).map(t => `<p>${esc(t)}</p>`).join('')}${list((s.list || []).map(esc))}${list((s.steps || []).map(esc), 'ol')}${s.table ? `<table><thead><tr>${s.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}`).join('')}
    ${p.faqs?.length ? `<h2>Frequently asked questions</h2>${p.faqs.map(([q, ans]) => `<h3>${esc(q)}</h3><p>${esc(ans)}</p>`).join('')}` : ''}</article>
    <h2>Learn it properly: the ${esc(PROGRAM)}</h2>${list([...(p.links || []).map(([h, t]) => a(h, t)), a('/curriculum', 'See the curriculum'), a('/pricing', 'Plans and pricing')])}
    <h2>More articles</h2>${list(others.map(x => a(`/blog/${x.slug}`, x.title)))}`;
}

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
    <p>Lesson ${l.num} · ${lessonMinutes[l.id]} min${lessonVideos[l.id] ? ' · video lesson' : ''}</p><h1>${esc(l.title)}</h1>${body.hook ? `<p>${rich(body.hook)}</p>` : ''}${body.summary ? `<p><strong>In short:</strong> ${rich(body.summary)}</p>` : ''}
    ${isFreeModule(m.id)
      // The free lesson: an outline only. Its text is sent once the visitor signs in.
      ? `${l.covers?.length ? `<h2>What you will learn</h2>${list(l.covers.map(esc))}` : ''}<h2>In this lesson</h2>${list((body.sections || []).map(s => rich(s.title)), 'ol')}<p>This lesson is free. ${a('/account', 'Sign in or create a free account')} to open it with its video and quiz.</p>`
      // Paid lessons: an outline only. The full text is sent to learners whose plan includes it.
      : `${l.covers?.length ? `<h2>What you will learn</h2>${list(l.covers.map(esc))}` : ''}<h2>In this lesson</h2>${list((body.sections || []).map(s => rich(s.title)), 'ol')}<p>This lesson is part of the ${tracksWithModule(m.id).map(t => esc(trackById[t].name)).join(' and ')} ${tracksWithModule(m.id).length > 1 ? 'tracks' : 'track'}. ${a('/pricing', 'See plans and pricing')} to open the full lesson, its video, labs and quiz, or ${a(`/lesson/${allLessons[0].id}`, 'try the free lesson')} first (free account needed).</p>`}
    <p>${[prev && a(`/lesson/${prev.id}`, `← ${prev.num} ${prev.title}`), next && a(`/lesson/${next.id}`, `${next.num} ${next.title} →`)].filter(Boolean).join(' · ')}</p>` };
}

const shell = fs.readFileSync('dist/index.html', 'utf8');
{ // The page's one inline script is allowed by its hash in the Content-Security-Policy (vercel.json).
  const { createHash } = await import('node:crypto');
  const inline = [...shell.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => 'sha256-' + createHash('sha256').update(m[1]).digest('base64'));
  const policy = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).headers.flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy').value;
  for (const h of inline) if (!policy.includes(h)) throw new Error(`vercel.json: the Content-Security-Policy is missing the inline script hash '${h}'`);
}
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
  else if (kind === 'blog' && id) main = blogPage(posts.find(p => p.slug === id));
  else if (kind === 'lesson') { const page = await lessonPage(lessonById[id]); main = page.html; if (page.summary) seo.description = clip(page.summary); }
  else main = PAGES[route]();
  const html = shell.replace(MARK, head(seo)).replace('<div id="root"></div>', `<div id="root">${frame(main.replace(/\n\s+/g, '\n'))}</div>`);
  const file = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html); bytes += html.length;
}

const today = new Date().toISOString().slice(0, 10);
const priority = r => r === '/' ? '1.0' : r.startsWith('/lesson/') ? '0.7' : r.startsWith('/module/') ? '0.8' : r.startsWith('/blog/') ? '0.8' : '0.9';
fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><priority>${priority(r)}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log(`prerendered ${routes.length} pages (${(bytes / 1e6).toFixed(1)} MB), sitemap.xml and app.html`);
