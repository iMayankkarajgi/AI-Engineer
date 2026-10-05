// GET /api/news — the latest AI news from official lab, company and university
// feeds. Runs as a Vercel function (and is mounted by server.mjs locally).
//
// Only first-party sources are listed, and an item is kept only when its link
// points back to that source's own domain. Titles and summaries are the
// publisher's own feed text, shortened; cards link to the original article.
// The response is cached at the edge, so the feeds are read a few times a day.

const SOURCES = [
  { name: 'OpenAI', feed: 'https://openai.com/news/rss.xml', domains: ['openai.com'] },
  { name: 'Google DeepMind', feed: 'https://deepmind.google/blog/rss.xml', domains: ['deepmind.google'] },
  { name: 'Google', feed: 'https://blog.google/technology/ai/rss/', domains: ['blog.google'] },
  { name: 'Google Research', feed: 'https://research.google/blog/rss/', domains: ['research.google'] },
  { name: 'Microsoft Research', feed: 'https://www.microsoft.com/en-us/research/feed/', domains: ['microsoft.com'], general: true },
  { name: 'NVIDIA', feed: 'https://blogs.nvidia.com/feed/', domains: ['nvidia.com'], general: true },
  { name: 'Meta Engineering', feed: 'https://engineering.fb.com/category/ai-research/feed/', domains: ['engineering.fb.com'] },
  { name: 'AWS Machine Learning', feed: 'https://aws.amazon.com/blogs/machine-learning/feed/', domains: ['aws.amazon.com'] },
  { name: 'Hugging Face', feed: 'https://huggingface.co/blog/feed.xml', domains: ['huggingface.co'] },
  { name: 'MIT News', feed: 'https://news.mit.edu/rss/topic/artificial-intelligence2', domains: ['news.mit.edu'] },
];
// Sources marked general publish on other subjects too; their items must mention an AI topic.
const AI_TOPIC = /\b(AI|artificial intelligence|machine learning|deep learning|neural|LLMs?|language models?|generative|agents?|agentic|inference|GPT|robot(?:s|ics)?|foundation models?|reinforcement learning|computer vision)\b/;
const PER_SOURCE = 4, TOTAL = 24, UA = 'Mozilla/5.0 (compatible; AIAtlasNews/1.0)';

async function get(url, ms, maxBytes = 1_500_000) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8' } });
    if (!r.ok) return '';
    return (await r.text()).slice(0, maxBytes);
  } catch { return ''; } finally { clearTimeout(timer); }
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };
const decode = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
// Feed text can be HTML inside entities, so decode, strip tags, then decode once more.
const plain = s => decode(decode(s).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const tag = (xml, names) => { for (const n of names) { const m = xml.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i')); if (m && m[1].trim()) return m[1]; } return ''; };
const attr = (xml, re) => { const m = xml.match(re); return m ? decode(m[1]) : ''; };
const shorten = (s, n) => { if (s.length <= n) return s; const cut = s.slice(0, n); return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30)).replace(/[\s,;:.–—-]+$/, '') + '…'; };
const httpsUrl = (u, base) => { if (!u) return ''; try { const url = new URL(u, base); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };

function parseFeed(xml, source) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  const items = [];
  for (const b of blocks) {
    const title = plain(tag(b, ['title']));
    const link = httpsUrl(plain(tag(b, ['link'])) || attr(b, /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || attr(b, /<link[^>]*href=["']([^"']+)["']/i), source.feed);
    const when = new Date(plain(tag(b, ['pubDate', 'published', 'updated', 'dc:date'])));
    if (!title || !link || isNaN(when)) continue;
    // Legitimacy check: the article must live on the source's own domain.
    const host = new URL(link).hostname;
    if (!source.domains.some(d => host === d || host.endsWith('.' + d))) continue;
    const body = tag(b, ['description', 'summary', 'content:encoded', 'content']);
    if (source.general && !AI_TOPIC.test(title + ' ' + plain(body).slice(0, 400))) continue;
    const image = httpsUrl(attr(b, /<media:content[^>]*url=["']([^"']+)["']/i) || attr(b, /<media:thumbnail[^>]*url=["']([^"']+)["']/i)
      || attr(b, /<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["']/i) || attr(b, /<enclosure[^>]*url=["']([^"']+\.(?:jpe?g|png|webp|gif)[^"']*)["']/i)
      || attr(decode(b), /<img[^>]*ssrc=["'](https:[^"']+)["']/i), link);
    items.push({ title: shorten(title, 140), url: link, source: source.name, date: when.toISOString(), summary: shorten(plain(body), 230), image });
  }
  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, PER_SOURCE);
}

// Articles whose feed entry has no picture: read the page's own share image.
async function shareImage(url) {
  const html = await get(url, 3500, 300_000);
  const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  return m ? httpsUrl(decode(m[1]), url) : '';
}

export async function loadNews() {
  const feeds = await Promise.all(SOURCES.map(async s => parseFeed(await get(s.feed, 6000), s)));
  const seen = new Set();
  let items = feeds.flat().filter(i => !seen.has(i.url) && seen.add(i.url)).filter(i => new Date(i.date) <= new Date(Date.now() + 86400_000))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, TOTAL + 8);
  await Promise.all(items.filter(i => !i.image).map(async i => { i.image = await shareImage(i.url); }));
  items = items.slice(0, TOTAL);
  return { updated: new Date().toISOString(), sources: SOURCES.map(s => s.name).filter(n => items.some(i => i.source === n)), items };
}

export default async function handler(req, res) {
  try {
    const data = await loadNews();
    if (!data.items.length) return res.status(502).json({ error: 'The news sources could not be reached.' });
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch { res.status(500).json({ error: 'Could not load the news.' }); }
}
