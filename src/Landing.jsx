import React from 'react';
import { Link } from 'react-router-dom';
import { landingByPath, landingPages } from './course/landing';
import { trackById, formatPrice } from './course/tracks';
import { useApp } from './app';
import { PROGRAM } from './brand';
import './landing.css';

// A course page for one track (see src/course/landing.js): what it teaches, who
// it is for, its modules, what it costs and common questions.
export default function Landing({ path }) {
  const page = landingByPath[path], t = trackById[page.track];
  const { currency } = useApp();
  const prices = t.allPrices[currency];
  const others = landingPages.filter(p => p.path !== path);
  return <main className="page container narrow landing-page" style={{ '--track': t.accent }}>
    <div className="page-intro">
      <div className="eyebrow">{PROGRAM} · {page.eyebrow}</div>
      <h1>{page.h1}</h1>
      <p className="dek">{page.lead}</p>
      <div className="landing-facts"><span><b>{t.modules.length}</b> modules</span><span><b>{t.lessons.length}</b> video lessons</span><span><b>{t.labs.length}</b> interactive labs</span><span>Quiz in every lesson</span></div>
      <div className="card-actions"><Link className="button primary" to="/pricing">See Plans From {formatPrice(prices.monthly, currency)} →</Link><Link className="button ghost" to={`/curriculum?track=${t.id}`}>View The Syllabus</Link></div>
    </div>
    <section className="legal-section"><h2>What you will learn</h2><ul className="check-list landing-learn">{page.learn.map(x => <li key={x}>{x}</li>)}</ul></section>
    <section className="legal-section"><h2>Who this course is for</h2><ul className="landing-audience">{page.audience.map(([who, why]) => <li key={who}><strong>{who}</strong> {why}</li>)}</ul></section>
    <section className="legal-section"><h2>Course syllabus: {t.modules.length} modules</h2>
      <ol className="landing-modules">{t.modules.map(m => <li key={m.id} className="card">
        <Link to={`/module/${m.id}`}><strong>Module {m.number}: {m.title}</strong></Link><small>{m.lessons.length} lesson{m.lessons.length > 1 ? 's' : ''}</small>
        <p>{m.intro[0]}</p>
      </li>)}</ol>
    </section>
    <section className="legal-section"><h2>How the course works</h2>
      <ul className="check-list"><li>Every lesson has a video, a written explanation with diagrams, and real code</li><li>Interactive labs let you change a value and watch the result</li><li>A 5-question quiz ends each lesson; 4 correct is a pass</li><li>Run Python in your browser on the Practice page, with nothing to install</li><li>Learn at your own pace and open lessons in any order</li></ul>
    </section>
    <section className="legal-section"><h2>Price</h2>
      <p>{t.name}: <b>{formatPrice(prices.monthly, currency)}</b> for one month, or <b>{formatPrice(prices.lifetime, currency)}</b> once for lifetime access. Taxes are included. The first lesson is free with a free account.</p>
      <div className="card-actions"><Link className="button primary" to="/pricing">Compare Plans →</Link></div>
    </section>
    <section className="legal-section"><h2>Frequently asked questions</h2>{page.faqs.map(([q, a]) => <div key={q} className="blog-faq"><h3>{q}</h3><p>{a}</p></div>)}</section>
    <section className="legal-section"><h2>Other courses</h2><ul className="landing-others">{others.map(p => <li key={p.path}><Link to={p.path}>{p.h1} →</Link></li>)}<li><Link to="/ai-engineer-roadmap">AI engineer roadmap →</Link></li><li><Link to="/blog">Read the blog →</Link></li></ul></section>
  </main>;
}
