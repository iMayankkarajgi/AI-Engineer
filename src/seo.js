// Search-engine metadata for every page: title, description, canonical URL and
// schema.org structured data. The browser applies it on each navigation
// (applySeo) and scripts/prerender.mjs writes the same values into static HTML.
import { modules, allLessons, lessonById, moduleOf } from './course/curriculum';
import { tracks } from './course/tracks';
import { faqs, glossary } from './course/reference';
import { lessonMinutes } from './course/lessonMinutes';
import { VIZ } from './course/vizNames';
import { BRAND, PROGRAM, SITE_URL } from './brand';
import { legalPages } from './course/legal';
import { isFreeModule } from './course/access';
import { posts } from './course/blog';

export const clip = (text, max = 158) => {
  const t = String(text || '').replace(/\*\*|\*|`/g, '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.]$/, '') + '…';
};

const LESSONS = allLessons.length, MODULES = modules.length, LABS = Object.keys(VIZ).length;
const PRIVATE = ['/account', '/profile', '/dashboard', '/exam'];
const ORG = { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: BRAND, url: SITE_URL, logo: `${SITE_URL}/icon-512.png`, sameAs: ['https://www.youtube.com/@modernaiengineering02'] };
const hours = lessons => Math.max(1, Math.round(lessons.reduce((n, l) => n + (lessonMinutes[l.id] || 25), 0) / 60));

const courseLd = t => ({
  '@type': 'Course', '@id': `${SITE_URL}/curriculum?track=${t.id}#course`,
  name: `${t.name}: ${PROGRAM}`, description: t.blurb, url: `${SITE_URL}/curriculum?track=${t.id}`,
  provider: ORG, inLanguage: 'en', educationalLevel: 'Beginner', teaches: t.modules.map(m => m.title),
  offers: ['INR', 'USD'].map(c => ({ '@type': 'Offer', category: 'Paid', price: t.allPrices[c].monthly, priceCurrency: c, url: `${SITE_URL}/pricing`, ...(c === 'INR' ? { eligibleRegion: { '@type': 'Country', name: 'IN' } } : {}) })),
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${hours(t.lessons)}H` },
});
const crumbs = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + path })) });

const STATIC_PAGES = {
  '/': () => ({
    title: `${PROGRAM}: Become an AI Engineer | ML, Deep Learning & LLM Course`,
    description: `Become an AI engineer with a hands-on course: ${LESSONS} video lessons on machine learning, deep learning, LLMs, RAG and AI agents. Three tracks, labs, quizzes, certificate.`,
    ld: [ORG, { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: BRAND, alternateName: PROGRAM, url: SITE_URL, publisher: { '@id': ORG['@id'] } }, ...tracks.map(courseLd)],
  }),
  '/curriculum': () => ({
    title: `AI Engineering Curriculum: ${MODULES} Modules, ${LESSONS} Lessons`,
    description: `The full ${PROGRAM} syllabus: machine learning, deep learning, Transformers, LLMs, fine-tuning, RAG, agents, inference, evaluation and AI system design, in three tracks.`,
    ld: [...tracks.map(courseLd), { '@type': 'ItemList', name: `${PROGRAM} modules`, itemListElement: modules.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.title, url: `${SITE_URL}/module/${m.id}` })) }],
  }),
  '/pricing': () => ({
    title: 'Pricing: ML & Deep Learning, Generative AI and Complete AI Engineer Tracks',
    description: `Compare the three ${PROGRAM} tracks and their monthly, three-month and lifetime prices. Each track includes its lessons, quizzes and interactive labs.`,
    ld: tracks.map(courseLd),
  }),
  '/blog': () => ({
    title: 'AI Engineering Blog: Guides on AI, Machine Learning and Deep Learning',
    description: 'Plain-language guides on AI engineering, machine learning and deep learning: how to become an AI engineer, what to learn, RAG, agents, LLMs and interviews.',
    ld: [{ '@type': 'Blog', '@id': `${SITE_URL}/blog#blog`, name: `${BRAND} Blog`, url: `${SITE_URL}/blog`, publisher: { '@id': ORG['@id'] }, blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.date })) }],
  }),
  '/lab': () => ({
    title: `Interactive AI and Machine Learning Labs: ${LABS} Hands-On Simulations`,
    description: `Play with ${LABS} interactive simulations of attention, tokenization, gradient descent, RAG, sampling temperature and more. Each lab links to the lesson that explains it.`,
  }),
  '/practice': () => ({
    title: 'Python Practice Playground: Run Python in Your Browser',
    description: 'Write and run Python in your browser with NumPy included. Practise the code from every AI engineering lesson and save your files to your account.',
  }),
  '/glossary': () => ({
    title: `AI Engineering Glossary: ${glossary.length} Key Terms Explained Simply`,
    description: 'Plain-language definitions of LLM, RAG, embeddings, attention, fine-tuning, LoRA, quantization, agents, MCP and more, each linked to a full lesson.',
    ld: [{ '@type': 'DefinedTermSet', name: 'AI engineering glossary', url: `${SITE_URL}/glossary`, hasDefinedTerm: glossary.map(g => ({ '@type': 'DefinedTerm', name: g.term, description: g.def })) }],
  }),
  '/faq': () => ({
    title: 'AI Engineering Course FAQ: How to Become an AI Engineer',
    description: 'Answers about learning AI engineering: prerequisites, how long it takes, AI engineer vs ML engineer, the skills you need, and what this bootcamp covers.',
    ld: [{ '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  }),
  '/news': () => ({
    title: 'Latest AI News From Official Labs and Companies',
    description: 'This week in AI: announcements and research taken directly from the official blogs of OpenAI, Google DeepMind, Microsoft Research, NVIDIA, Hugging Face and more.',
  }),
  '/ai-engineer-roadmap': () => ({
    title: 'AI Engineer Roadmap: Skills and Learning Path, Step by Step',
    description: `How to become an AI engineer: a step-by-step roadmap of ${MODULES} modules, from machine learning and deep learning to LLMs, RAG, agents and AI system design, with study times.`,
    ld: [{ '@type': 'ItemList', name: 'AI engineer roadmap', itemListElement: modules.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.title, url: `${SITE_URL}/module/${m.id}` })) }],
  }),
  '/privacy': () => ({ title: 'Privacy Policy', description: `What personal information ${BRAND} collects, how it is used and stored, and your rights over it.` }),
  '/terms': () => ({ title: 'Terms of Service', description: `The terms for using ${BRAND} and buying the ${PROGRAM}: accounts, plans, payments, acceptable use and certificates.` }),
  '/refund': () => ({ title: 'Refund Policy', description: `How refunds work for the ${PROGRAM}: the money-back window, exceptions and how to ask.` }),
  '/resources': () => ({
    title: 'AI Engineering Resources: Research Papers, Documentation and Standards',
    description: 'The original papers and reference manuals behind the course: Attention Is All You Need, LoRA, RAG, PPO, PyTorch, Hugging Face Transformers, vLLM and MCP.',
  }),
};

// Paths that search engines should index, in sitemap order.
export const seoRoutes = () => [...Object.keys(STATIC_PAGES), ...posts.map(p => `/blog/${p.slug}`), ...modules.map(m => `/module/${m.id}`), ...allLessons.map(l => `/lesson/${l.id}`)];

export function seoFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  let page = STATIC_PAGES[path]?.();
  const [, kind, id] = path.split('/');
  if (!page && kind === 'module') {
    const m = modules.find(x => x.id === id);
    if (m) page = {
      title: `${m.title}: Module ${m.number} of the ${PROGRAM}`,
      description: clip(`${m.intro[0]} ${m.lessons.length} lessons: ${m.lessons.map(l => l.title).join(', ')}.`),
      ld: [crumbs([['Curriculum', '/curriculum'], [m.title, path]]), { '@type': 'ItemList', name: m.title, itemListElement: m.lessons.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.title, url: `${SITE_URL}/lesson/${l.id}` })) }],
    };
  }
  if (!page && kind === 'lesson') {
    const l = lessonById[id], m = l && moduleOf(id);
    if (l) page = {
      title: l.title,
      description: clip(l.covers?.length ? `${l.title}, explained step by step: ${l.covers.join('; ')}.` : `${l.title}: an interactive lesson with diagrams, code and a quiz.`),
      type: 'article',
      ld: [crumbs([['Curriculum', '/curriculum'], [m.title, `/module/${m.id}`], [l.title, path]]), {
        '@type': 'LearningResource', name: l.title, url: SITE_URL + path, learningResourceType: 'Lesson', inLanguage: 'en',
        educationalLevel: 'Beginner', isAccessibleForFree: isFreeModule(m.id), timeRequired: `PT${lessonMinutes[l.id] || 25}M`, teaches: l.covers || [], provider: ORG,
        isPartOf: { '@type': 'Course', name: PROGRAM, url: `${SITE_URL}/curriculum`, description: STATIC_PAGES['/']().description, provider: ORG },
      }],
    };
  }
  if (!page && kind === 'blog') {
    const post = posts.find(x => x.slug === id);
    if (post) page = {
      title: post.title, description: post.description, type: 'article',
      ld: [crumbs([['Blog', '/blog'], [post.title, path]]), {
        '@type': 'BlogPosting', headline: post.title, description: post.description, url: SITE_URL + path, mainEntityOfPage: SITE_URL + path,
        datePublished: post.date, dateModified: post.date, inLanguage: 'en', keywords: (post.keywords || []).join(', '), image: `${SITE_URL}/og-v3.png`,
        author: { '@id': ORG['@id'] }, publisher: ORG,
      }, ...(post.faqs?.length ? [{ '@type': 'FAQPage', mainEntity: post.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])],
    };
  }
  if (!page) return { path, title: PRIVATE.includes(path) ? BRAND : `Page not found | ${BRAND}`, description: '', robots: 'noindex, follow', ld: [], type: 'website' };
  return { type: 'website', ld: [], ...page, path, robots: 'index, follow, max-image-preview:large', title: path === '/' ? page.title : `${page.title} | ${BRAND}` };
}

export const ldJson = seo => JSON.stringify({ '@context': 'https://schema.org', '@graph': seo.ld }).replace(/</g, '\\u003c');

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) { el?.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
};

// Browser side: make the document head match the page being shown.
export function applySeo(seo) {
  const url = SITE_URL + (seo.path === '/' ? '/' : seo.path), indexable = seo.robots.startsWith('index');
  document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('name', 'robots', seo.robots);
  setMeta('property', 'og:title', seo.title);
  setMeta('property', 'og:description', seo.description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', seo.type);
  setMeta('name', 'twitter:title', seo.title);
  setMeta('name', 'twitter:description', seo.description);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!indexable) link?.remove();
  else { if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); } link.href = url; }
  let ld = document.head.querySelector('script[data-seo]');
  if (!seo.ld.length) ld?.remove();
  else { if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.dataset.seo = ''; document.head.appendChild(ld); } ld.textContent = ldJson(seo); }
}
export const setDescription = text => { for (const [a, k] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) setMeta(a, k, clip(text)); };
