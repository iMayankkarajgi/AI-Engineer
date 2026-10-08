import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { modules } from './course/curriculum';
import { tracks, trackById, PERIODS, formatPrice, quarterSaving } from './course/tracks';
import { useApp, PASS_MARK, CLOUD, rememberAfterLogin } from './app';
import Modal from './Modal';
import './tracks.css';

// The learner's chosen track, remembered in this browser. ?track=ml in the URL wins.
const KEY = 'atlas-track';
// The track being bought, kept across the trip to the payment page and back.
const BUYING = 'atlas-buying';
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
  const { completed, currency } = useApp();
  return <div className="track-picker" role="radiogroup" aria-label="Choose a track">{tracks.map((t, i) => {
    const n = done(t, completed);
    return <button key={t.id} role="radio" aria-checked={value === t.id} className={'track-option' + (value === t.id ? ' selected' : '')} style={{ '--track': t.accent }} onClick={() => onChange(t.id)}>
      <span className="track-option-top"><span className="course-icon">{t.icon}</span><span className="track-option-tag">Track {i + 1}</span>{t.featured && <span className="track-badge">Most Complete</span>}</span>
      <strong>{t.name}</strong>
      <span className="track-option-blurb">{t.blurb}</span>
      <span className="track-stats"><span><b>{t.modules.length}</b> modules</span><span><b>{t.lessons.length}</b> lessons</span><span><b>{t.labs.length}</b> labs</span></span>
      <span className="meter"><span style={{ width: `${(n / t.lessons.length) * 100}%` }}/></span>
      <span className="track-option-foot"><span>{n} / {t.lessons.length} passed</span><span>From {formatPrice(t.allPrices[currency].monthly, currency)} / month</span></span>
    </button>;
  })}</div>;
}

// Home page section: the three tracks at a glance.
export function TrackShowcase() {
  const { currency } = useApp();
  return <div className="track-showcase">{tracks.map((t, i) => <Link key={t.id} to={`/curriculum?track=${t.id}`} className={'track-option' + (t.featured ? ' selected' : '')} style={{ '--track': t.accent }}>
    <span className="track-option-top"><span className="course-icon">{t.icon}</span><span className="track-option-tag">Track {i + 1}</span>{t.featured && <span className="track-badge">Most Complete</span>}</span>
    <strong>{t.name}</strong>
    <span className="track-option-blurb">{t.blurb}</span>
    <span className="track-stats"><span><b>{t.modules.length}</b> modules</span><span><b>{t.lessons.length}</b> lessons</span><span><b>{t.labs.length}</b> labs</span></span>
    <span className="track-option-foot"><span>From {formatPrice(t.allPrices[currency].monthly, currency)} / month</span><span>View Track →</span></span>
  </Link>)}</div>;
}

// Back from the payment page: wait for the plan to appear on the account.
function PaymentReturn() {
  const { user, ready, refreshPlans } = useApp();
  const [params, setParams] = useSearchParams();
  const back = params.get('checkout') === 'done', status = params.get('status');
  const [state, setState] = useState('idle');
  useEffect(() => {
    if (!back || !ready) return;
    if (status && status !== 'succeeded') { setState('failed'); return; }
    if (!user) { setState('signin'); return; }
    let live = true, tries = 0, want = null;
    try { want = sessionStorage.getItem(BUYING); } catch {}
    setState('waiting');
    const check = async () => {
      const list = await refreshPlans();
      if (!live) return;
      if (want ? list.includes(want) : list.length > 0) { setState('active'); try { sessionStorage.removeItem(BUYING); } catch {} return; }
      if (++tries >= 20) { setState('slow'); return; }
      setTimeout(check, 2000);
    };
    check();
    return () => { live = false; };
  }, [back, ready, user?.id]);
  if (!back || state === 'idle') return null;
  const clear = () => { params.delete('checkout'); params.delete('status'); params.delete('payment_id'); setParams(params, { replace: true }); setState('idle'); };
  const text = {
    waiting: ['Payment received', 'Activating your plan. This usually takes a few seconds.'],
    active: ['Your plan is active', 'Thank you. Everything in your track is now open on this account.'],
    slow: ['Payment received', 'Your plan is taking longer than usual to appear. Refresh this page in a minute; if it is still missing, email us and we will sort it out.'],
    failed: ['Payment not completed', 'No money was taken. You can choose a plan and try again.'],
    signin: ['Sign in to see your plan', 'Sign in with the account you paid with to see your plan.'],
  }[state];
  return <div className={'card pay-status ' + state} role="status">
    <div><h3>{text[0]}</h3><p>{text[1]}</p></div>
    <div className="cert-actions">{state === 'active' && <Link className="button primary" to="/curriculum">Start Learning →</Link>}{state === 'signin' && <Link className="button primary" to="/account">Sign In</Link>}{state !== 'waiting' && <button className="button ghost" onClick={clear}>Dismiss</button>}</div>
  </div>;
}

export function Pricing() {
  const nav = useNavigate();
  const { user, plans, currency, accessToken } = useApp();
  const [period, setPeriod] = useState('lifetime'), [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false), [payError, setPayError] = useState('');
  const p = PERIODS.find(x => x.id === period);
  // Coming back from the payment page with the Back button restores this page
  // exactly as it was left, mid-"Opening Checkout". Put the buttons back to normal.
  useEffect(() => {
    const reset = () => setBusy(false);
    window.addEventListener('pageshow', reset); window.addEventListener('focus', reset);
    return () => { window.removeEventListener('pageshow', reset); window.removeEventListener('focus', reset); };
  }, []);
  const start = t => { try { localStorage.setItem(KEY, t.id); } catch {} nav(`/curriculum?track=${t.id}`); };
  const owns = t => plans.includes(t.id) || plans.includes('complete');
  const choose = t => { setPayError(''); setPicked(t); };
  async function pay(t) {
    setBusy(true); setPayError('');
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await accessToken()}` }, body: JSON.stringify({ track: t.id, period }) });
      const d = r.headers.get('content-type')?.includes('json') ? await r.json() : {};
      if (!r.ok || !d.url) throw new Error(d.error || 'Could not start the payment. Please try again in a moment.');
      try { sessionStorage.setItem(BUYING, t.id); } catch {}
      location.assign(d.url);
    } catch (err) { setPayError(err.message); setBusy(false); }
  }
  return <main className="page container pricing-page">
    <div className="page-intro pricing-intro">
      <div className="eyebrow">Pricing</div>
      <h1>Pick the track that fits your goal</h1>
      <p className="dek">Three tracks, each with its lessons, quizzes and hands-on labs. Buy one month, three months, or pay once for lifetime access.</p>
    </div>
    <PaymentReturn/>
    <div className="period-toggle" role="radiogroup" aria-label="Plan length">{PERIODS.map(x =>
      <button key={x.id} role="radio" aria-checked={period === x.id} className={period === x.id ? 'active' : ''} onClick={() => setPeriod(x.id)}>{x.label}{x.best && <span className="best-pill">Best Value</span>}</button>)}
    </div>
    <div className="plan-grid">{tracks.map((t, i) => {
      const prices = t.allPrices[currency], price = prices[period], saving = quarterSaving(prices);
      return <section key={t.id} className={'plan card' + (t.featured ? ' featured' : '') + (period === 'lifetime' ? ' best' : '')} style={{ '--track': t.accent }} aria-label={t.name}>
        {t.featured && <span className="track-badge">Most Complete</span>}
        <div className="plan-head"><span className="course-icon">{t.icon}</span><div><small>Track {i + 1}</small><h2>{t.name}</h2></div></div>
        <p className="plan-blurb">{t.blurb}</p>
        <div className="plan-price"><strong>{formatPrice(price, currency)}</strong><span>{p.unit}</span></div>
        <p className="plan-note">{period === 'monthly' ? 'One payment for 1 month of access. Renew whenever you like; you are never charged automatically.'
          : period === 'quarter' ? <>One payment for 3 months of access{saving > 0 ? <> · <b>save {saving}%</b> against monthly</> : ''}.</>
          : <><b>Best value.</b> Pay once and keep access for good, for the cost of about {Math.round(price / prices.monthly)} months.</>}</p>
        {period !== 'lifetime' && <button className="lifetime-nudge" onClick={() => setPeriod('lifetime')}><span className="best-pill">Best Value</span>Lifetime access for {formatPrice(prices.lifetime, currency)}, paid once →</button>}
        <button className={'button ' + (t.featured ? 'primary' : 'ghost')} onClick={() => choose(t)}>{owns(t) ? `You Have ${t.short} · Extend` : `Choose ${t.short}`}</button>
        <ul className="check-list plan-features">
          <li><b>{t.modules.length} modules</b>, {t.lessons.length} lessons</li>
          <li><b>{t.labs.length} interactive labs</b>{t.id === 'complete' ? ' (every lab)' : t.id === 'ml' ? ' for ML and deep learning' : ' for LLMs and AI systems'}</li>
          <li>A video and a quiz in every lesson (pass mark {PASS_MARK} of 5)</li>
          <li>Python practice playground</li>
          <li>Progress saved to your account</li>
          {t.extras.map(x => <li key={x}><b>{x}</b></li>)}
        </ul>
      </section>;
    })}</div>
    <p className="pricing-foot">Prices are in {currency === 'INR' ? 'Indian rupees' : 'US dollars'} for your region. Payments are handled securely by Dodo Payments; taxes may be added at checkout. See the <Link to="/refund">Refund Policy</Link>.</p>

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

    <Modal open={!!picked} onClose={() => { setBusy(false); setPicked(null); }} label="Selected plan">
      {picked && <div className="plan-confirm">
        <div className="eyebrow">Your choice</div>
        <h2>{picked.name}</h2>
        <p className="plan-price"><strong>{formatPrice(picked.allPrices[currency][period], currency)}</strong><span>{p.unit}</span></p>
        {!CLOUD ? <><p>Online checkout is not available in this version of the site. You can start this track now.</p>
            <div className="cert-actions"><button className="button primary" onClick={() => start(picked)}>Start This Track</button><button className="button ghost" onClick={() => setPicked(null)}>Back To Pricing</button></div></>
          : !user ? <><p>Sign in first, so the plan is added to your account. You will come straight back here.</p>
            <div className="cert-actions"><button className="button primary" onClick={() => { rememberAfterLogin('/pricing'); nav('/account'); }}>Sign In To Continue</button><button className="button ghost" onClick={() => setPicked(null)}>Back To Pricing</button></div></>
          : <><p>You will pay on Dodo Payments’ secure page and come back here. Your plan is added to <b>{user.email}</b> as soon as the payment goes through.</p>
            {payError && <div className="form-error" role="alert">{payError}</div>}
            <div className="cert-actions"><button className="button primary" disabled={busy} onClick={() => pay(picked)}>{busy ? 'Opening Checkout…' : `Pay ${formatPrice(picked.allPrices[currency][period], currency)}`}</button><button className="button ghost" onClick={() => { setBusy(false); setPicked(null); }}>Back To Pricing</button></div></>}
      </div>}
    </Modal>
  </main>;
}
