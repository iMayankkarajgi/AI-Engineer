import React from 'react';
import { Link } from 'react-router-dom';
import { legalPages } from './course/legal';
import { CONTACT_EMAIL, LEGAL_UPDATED } from './brand';

export const LEGAL_LINKS = [['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service'], ['/refund', 'Refund Policy']];

export default function Legal({ page }) {
  const doc = legalPages[page];
  return <main className="page container narrow legal-page">
    <div className="page-intro">
      <div className="eyebrow">Legal · Updated {LEGAL_UPDATED}</div>
      <h1>{doc.title}</h1>
      <p className="dek">{doc.intro}</p>
    </div>
    {doc.sections.map((s, i) => <section key={s.h} className="legal-section">
      <h2>{i + 1}. {s.h}</h2>
      {s.p?.map((t, j) => <p key={j}>{t}</p>)}
      {s.items && <ul>{s.items.map((t, j) => <li key={j}>{t}</li>)}</ul>}
    </section>)}
    <p className="legal-contact">Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    <nav className="legal-links" aria-label="Legal pages">{LEGAL_LINKS.map(([to, t]) => <Link key={to} to={to}>{t}</Link>)}</nav>
  </main>;
}
