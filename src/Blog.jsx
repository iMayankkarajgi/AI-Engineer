import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { posts } from './course/blog';
import { allLessons } from './course/curriculum';
import { BRAND, PROGRAM } from './brand';
import { NotFound } from './pages';
import './blog.css';

// The blog: plain articles about AI engineering, machine learning and deep
// learning. The text lives in src/course/blog.js; the same articles are written
// into static HTML at build time (scripts/prerender.mjs) for search engines.
const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
const longDate = d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
const anchor = h => h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function BlogIndex() {
  return <main className="page container blog-page">
    <div className="page-intro"><div className="eyebrow">Blog</div><h1>AI engineering, explained simply</h1>
      <p className="dek">Guides on AI engineering, machine learning and deep learning: what the terms mean, what to learn, and in what order.</p></div>
    <ul className="blog-grid">{sorted.map(p => <li key={p.slug}><Link className="blog-card card" to={`/blog/${p.slug}`}>
      <small>{longDate(p.date)} · {p.minutes} min read</small>
      <h2>{p.title}</h2>
      <p>{p.description}</p>
      <span className="blog-card-open">Read The Article <span aria-hidden="true">→</span></span>
    </Link></li>)}</ul>
  </main>;
}

export function BlogPost() {
  const { slug } = useParams();
  const post = posts.find(p => p.slug === slug);
  if (!post) return <NotFound/>;
  const more = sorted.filter(p => p.slug !== slug).slice(0, 3);
  return <main className="page container narrow blog-post">
    <nav className="blog-crumbs" aria-label="Breadcrumb"><Link to="/blog">Blog</Link><span aria-hidden="true">/</span><span>{post.title}</span></nav>
    <article>
      <header><h1>{post.title}</h1>
        <p className="blog-meta">By {BRAND} · {longDate(post.date)} · {post.minutes} min read</p></header>
      {post.intro.map((t, i) => <p key={i} className={i ? '' : 'lead'}>{t}</p>)}
      <nav className="blog-toc card" aria-label="In this article"><strong>In this article</strong><ol>{post.sections.map(s => <li key={s.h}><a href={`#${anchor(s.h)}`}>{s.h}</a></li>)}</ol></nav>
      {post.sections.map(s => <section key={s.h} id={anchor(s.h)}>
        <h2>{s.h}</h2>
        {(s.body || []).map((t, i) => <p key={i}>{t}</p>)}
        {s.list?.length > 0 && <ul>{s.list.map(t => <li key={t}>{t}</li>)}</ul>}
        {s.steps?.length > 0 && <ol>{s.steps.map(t => <li key={t}>{t}</li>)}</ol>}
        {s.table && <div className="b-table"><table><thead><tr>{s.table.head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
      </section>)}
      {post.faqs?.length > 0 && <section id="faq"><h2>Frequently asked questions</h2>{post.faqs.map(([q, a]) => <div key={q} className="blog-faq"><h3>{q}</h3><p>{a}</p></div>)}</section>}
    </article>
    <aside className="card blog-next">
      <small>Learn it properly</small>
      <h2>The {PROGRAM}</h2>
      <p>{allLessons.length} video lessons with interactive labs and quizzes, from machine learning basics to production AI systems.</p>
      <ul className="blog-links">{(post.links || []).map(([to, label]) => <li key={to}><Link to={to}>{label} →</Link></li>)}</ul>
      <div className="card-actions"><Link className="button primary" to="/curriculum">See The Curriculum →</Link><Link className="button ghost" to="/pricing">Plans And Pricing</Link></div>
    </aside>
    <section className="blog-more"><h2>More articles</h2><ul>{more.map(p => <li key={p.slug}><Link to={`/blog/${p.slug}`}><strong>{p.title}</strong><small>{p.minutes} min read</small></Link></li>)}</ul></section>
  </main>;
}
