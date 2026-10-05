import React, { useEffect, useState } from 'react';
import './news.css';

const day = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const WEEK = 7 * 86400_000;

// Story picture, with a branded tile when the publisher gives none or it fails to load.
function Picture({ item }) {
  const [broken, setBroken] = useState(false);
  return <span className={'news-pic' + (item.image && !broken ? '' : ' empty')}>
    {item.image && !broken
      ? <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)}/>
      : <span aria-hidden="true">{item.source}</span>}
  </span>;
}

function Story({ item }) {
  return <li><a className="news-card" href={item.url} target="_blank" rel="noopener noreferrer">
    <Picture item={item}/>
    <span className="news-copy">
      <span className="news-meta"><b>{item.source}</b><span>{day(item.date)}</span></span>
      <strong>{item.title}</strong>
      {item.summary && <span className="news-summary">{item.summary}</span>}
      <span className="news-open">Read On {new URL(item.url).hostname.replace(/^www\./, '')} <span aria-hidden="true">↗</span></span>
    </span>
  </a></li>;
}

export default function News() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [source, setSource] = useState('All');
  useEffect(() => {
    let live = true;
    fetch('/api/news').then(async r => {
      const d = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
      if (!r.ok || !d?.items) throw new Error(d?.error || 'The news feed is not available right now.');
      if (live) setData(d);
    }).catch(e => { if (live) setError(e.message || 'The news feed is not available right now.'); });
    return () => { live = false; };
  }, []);

  const items = data ? data.items.filter(i => source === 'All' || i.source === source) : [];
  const cutoff = Date.now() - WEEK;
  const thisWeek = items.filter(i => new Date(i.date) >= cutoff), earlier = items.filter(i => new Date(i.date) < cutoff);
  return <main className="page container narrow news-page">
    <div className="page-intro">
      <div className="eyebrow"><span className="live-dot" aria-hidden="true"/>Live news</div>
      <h1>What is happening in AI this week</h1>
      <p className="dek">The latest announcements and research, taken directly from the official blogs of AI labs, companies and universities. Each card opens the original article on the publisher’s own site.</p>
    </div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {!data && !error && <ul className="news-list" aria-busy="true">{Array.from({ length: 5 }, (_, i) => <li key={i}><span className="news-card skeleton"><span className="news-pic"/><span className="news-copy"><span/><span/><span/></span></span></li>)}</ul>}
    {data && <>
      <div className="chips news-chips" role="group" aria-label="Filter by source">{['All', ...data.sources].map(s =>
        <button key={s} className={source === s ? 'active' : ''} aria-pressed={source === s} onClick={() => setSource(s)}>{s}</button>)}
      </div>
      {thisWeek.length > 0 && <section><h2 className="news-heading">This week <span>{thisWeek.length}</span></h2><ul className="news-list">{thisWeek.map(i => <Story key={i.url} item={i}/>)}</ul></section>}
      {earlier.length > 0 && <section><h2 className="news-heading">Earlier <span>{earlier.length}</span></h2><ul className="news-list">{earlier.map(i => <Story key={i.url} item={i}/>)}</ul></section>}
      {items.length === 0 && <p className="lab-empty">No recent stories from this source.</p>}
      <p className="news-foot">Sources: {data.sources.join(', ')}. Headlines, summaries and images belong to their publishers. Checked {new Date(data.updated).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}; refreshed several times a day.</p>
    </>}
  </main>;
}
