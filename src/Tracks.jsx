import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { modules } from './course/curriculum';
import { tracks, trackById, PERIODS, formatPrice, halfYearSaving } from './course/tracks';
import { useApp, PASS_MARK } from './app';
import Modal from './Modal';
import './tracks.css';

// The learner's chosen track, remembered in this browser. ?track=ml in the URL wins.
const KEY = 'atlas-track';
export function useTrack() {
  const [params, setParams] = useSearchParams();
  const fromUrl = trackById[params.get('track')] ? params.get('track') : null;
  const [id, setId] = useState(() => { try { const v = localStorage.getItem(KEY); return fromUrl || (trackById[v] ? v : 'complete'); } catch { return fromUrl || 'complete'; } });
  useEffect(() => { if (fromUrl && fromUrl !== id) setId(fromUrl); }, [fromUrl]);
  const choose = next => {
    setId(next); try { localStorage.setItem(KEY, next); } catch {}
    if (params.get('track')) { params.delete('track'); setParams(params, { replace: true }); }
  };
  return [trackById[id], choose];
}

const done = (t, completed) => t.lessons.filter(l => completed.includes(l.id)).length;

// Three selectable track cards: what is inside, progress so far, and the starting price.
export function TrackPicker({ value, onChange }) {
  const { completed } = useApp();
  return <div className="track-picker" role="radiogroup" aria-label="Choose a track">{tracks.map((t, i) => {
    const n = done(t, completed);
    return <button key={t.id} role="radio" aria-checked={value === t.id} className={'track-option' + (value === t.id ? ' selected' : '')} style={{ '--track': t.accent }} onClick={() => onChange(t.id)}>
      <span className="track-option-top"><span className="course-icon">{t.icon}</span><span className="track-option-tag">Track {i + 1}</span>{t.featured && <span className="track-badge">Most Complete</span>}</span>
      <strong>{t.name}</strong>
      <span className="track-option-blurb">{t.blurb}</span>
      <span className="track-stats"><span><b>{t.modules.length}</b> modules</span><span><b>{t.lessons.length}</b> lessons</span><span><b>{t.labs.length}</b> labs</span></span>
      <span className="meter"><span style={{ width: `${(n / t.lessons.length) * 100}%` }}/></span>
      <span className="track-option-foot"><span>{n} / {t.lessons.length} passed</span><span>From {formatPrice(t.prices.monthly)} / month</span></span>
    </button>;
  })}</div>;
}

// Home page section: the three tracks at a glance.
export function TrackShowcase() {
  return <div className="track-showcase">{tracks.map((t, i) => <Link key={t.id} to={`/curriculum?track=${t.id}`} className={'track-option' + (t.featured ? ' selected' : '')} style={{ '--track': t.accent }}>
    <span className="track-option-top"><span className="course-icon">{t.icon}</span><span className="track-option-tag">Track {i + 1}</span>{t.featured && <span className="track-badge">Most Complete</span>}</span>
    <strong>{t.name}</strong>
    <span className="track-option-blurb">{t.blurb}</span>
    <span className="track-stats"><span><b>{t.modules.length}</b> modules</span><span><b>{t.lessons.length}</b> lessons</span><span><b>{t.labs.length}</b> labs</span></span>
    <span className="track-option-foot"><span>From {formatPrice(t.prices.monthly)} / month</span><span>View Track →</span></span>
  </Link>)}</div>;
}

export function Pricing() {
  const nav = useNavigate();
  const [period, setPeriod] = useState('half'), [picked, setPicked] = useState(null);
  const p = PERIODS.find(x => x.id === period);
  const start = t => { try { localStorage.setItem(KEY, t.id); } catch {} nav(`/curriculum?track=${t.id}`); };
  return <main className="page container pricing-page">
    <div className="page-intro pricing-intro">
      <div className="eyebrow">Pricing</div>
      <h1>Pick the track that fits your goal</h1>
      <p className="dek">Three tracks, each with its lessons, quizzes and hands-on labs. Pay monthly, for six months, or once for lifetime access.</p>
    </div>
    <div className="period-toggle" role="radiogroup" aria-label="Billing period">{PERIODS.map(x =>
      <button key={x.id} role="radio" aria-checked={period === x.id} className={period === x.id ? 'active' : ''} onClick={() => setPeriod(x.id)}>{x.label}</button>)}
    </div>
    <div className="plan-grid">{tracks.map((t, i) => {
      const price = t.prices[period], saving = halfYearSaving(t);
      return <section key={t.id} className={'plan card' + (t.featured ? ' featured' : '')} style={{ '--track': t.accent }} aria-label={t.name}>
        {t.featured && <span className="track-badge">Most Complete</span>}
        <div className="plan-head"><span className="course-icon">{t.icon}</span><div><small>Track {i + 1}</small><h2>{t.name}</h2></div></div>
        <p className="plan-blurb">{t.blurb}</p>
        <div className="plan-price"><strong>{formatPrice(price)}</strong><span>{p.unit}</span></div>
        <p className="plan-note">{period === 'monthly' ? 'Billed every month.'
          : period === 'half' ? <>About {formatPrice(Math.round(price / 6))} a month{saving > 0 ? <> · <b>save {saving}%</b> against monthly</> : ''}.</>
          : <>Pay once, keep access. Equal to {(price / t.prices.monthly).toFixed(0)} months of monthly billing.</>}</p>
        <button className={'button ' + (t.featured ? 'primary' : 'ghost')} onClick={() => setPicked(t)}>Choose {t.short}</button>
        <ul className="check-list plan-features">
          <li><b>{t.modules.length} modules</b>, {t.lessons.length} lessons</li>
          <li><b>{t.labs.length} interactive labs</b>{t.id === 'complete' ? ' (every lab)' : t.id === 'ml' ? ' for ML and deep learning' : ' for LLMs and AI systems'}</li>
          <li>A quiz in every lesson (pass mark {PASS_MARK} of 5)</li>
          <li>Python practice playground</li>
          <li>Progress saved to your account</li>
          {t.extras.map(x => <li key={x}><b>{x}</b></li>)}
        </ul>
      </section>;
    })}</div>

    <section>
      <h2 className="section-title">What each track covers</h2>
      <div className="b-table"><table className="compare-table">
        <thead><tr><th>Module</th>{tracks.map(t => <th key={t.id}>{t.short}</th>)}</tr></thead>
        <tbody>
          {modules.map(m => <tr key={m.id}><td><Link to={`/module/${m.id}`}>{m.number}. {m.title}</Link><small>{m.lessons.length} lesson{m.lessons.length > 1 ? 's' : ''}</small></td>
            {tracks.map(t => <td key={t.id} className={t.moduleIds.includes(m.id) ? 'yes' : 'no'}>{t.moduleIds.includes(m.id) ? <span aria-label="Included">✓</span> : <span aria-label="Not included">–</span>}</td>)}</tr>)}
          <tr className="total"><td>Interactive labs</td>{tracks.map(t => <td key={t.id}>{t.labs.length}</td>)}</tr>
          <tr className="total"><td>Lessons</td>{tracks.map(t => <td key={t.id}>{t.lessons.length}</td>)}</tr>
        </tbody>
      </table></div>
    </section>

    <Modal open={!!picked} onClose={() => setPicked(null)} label="Selected plan">
      {picked && <div className="plan-confirm">
        <div className="eyebrow">Your choice</div>
        <h2>{picked.name}</h2>
        <p className="plan-price"><strong>{formatPrice(picked.prices[period])}</strong><span>{p.unit}</span></p>
        <p>Online checkout is not available yet, so nothing is charged. You can start this track now.</p>
        <div className="cert-actions"><button className="button primary" onClick={() => start(picked)}>Start This Track</button><button className="button ghost" onClick={() => setPicked(null)}>Back To Pricing</button></div>
      </div>}
    </Modal>
  </main>;
}
