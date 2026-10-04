import React, { useMemo, useState } from 'react';
import { Frame, Slider, Stats, Stat, rng } from '../index';

// 40 queries with a true difficulty d ∈ [0,1]. The small model solves d < 0.6, the large one d < 0.95.
// A router only sees a noisy difficulty estimate; it sends est ≥ θ to the large model (15× the price).
const SMALL_CAP = 0.6, LARGE_CAP = 0.95, COST_S = 1, COST_L = 15;
const Q = (() => { const r = rng(21); return Array.from({ length: 40 }, () => ({ d: r() ** 1.3, z: r() - 0.5, y: r() })); })();
const clamp = v => Math.max(0, Math.min(1, v));

function evaluate(th, noise) {
  const rows = Q.map(q => { const est = clamp(q.d + q.z * noise), big = est >= th; return { ...q, est, big, ok: q.d < (big ? LARGE_CAP : SMALL_CAP) }; });
  const cost = rows.reduce((s, r) => s + (r.big ? COST_L : COST_S), 0) / (Q.length * COST_L);
  return { rows, cost, quality: rows.filter(r => r.ok).length / Q.length, big: rows.filter(r => r.big).length };
}

export default function LlmRouting() {
  const [th, setTh] = useState(0.5);
  const [noise, setNoise] = useState(0.3);
  const cur = evaluate(th, noise);
  const curve = useMemo(() => Array.from({ length: 51 }, (_, i) => evaluate(i / 50, noise)).concat([evaluate(1.01, noise)]), [noise]);
  const allBig = evaluate(-1, noise), allSmall = evaluate(1.01, noise);
  const PX = c => 40 + c * 250, PY = q => 150 - ((q - 0.4) / 0.6) * 135;
  const path = curve.map((p, i) => `${i ? 'L' : 'M'}${PX(p.cost).toFixed(1)},${PY(p.quality).toFixed(1)}`).join('');
  const wrongSmall = cur.rows.filter(r => !r.big && !r.ok).length;
  const wasted = cur.rows.filter(r => r.big && r.d < SMALL_CAP).length;
  const foot = th <= 0.02 ? 'Everything goes to the large model: best quality, maximum cost.'
    : th >= 0.99 ? 'Everything goes to the small model: cheapest, but every hard query fails.'
    : `θ = ${th.toFixed(2)}: ${cur.big} of ${Q.length} queries go to the large model. ${wrongSmall} hard ${wrongSmall === 1 ? 'query was' : 'queries were'} under-routed to the small model and failed; ${wasted} easy ${wasted === 1 ? 'one' : 'ones'} paid for the large model needlessly.${noise > 0.35 ? ' A noisy router blurs the boundary.' : ''}`;
  return <Frame title="LLM routing / cost vs quality" meta={`θ = ${th.toFixed(2)} · ${(cur.cost * 100).toFixed(0)}% of all-large cost`} foot={foot}>
    <div className="viz-two">
      <svg viewBox="0 0 320 180" className="viz-svg" role="img" aria-label={`${Q.length} queries placed by estimated difficulty; those right of the threshold go to the large model`}>
        <line x1="20" x2="300" y1="150" y2="150" className="viz-axis"/>
        <line x1={20 + th * 280} x2={20 + th * 280} y1="10" y2="150" className="viz-guide"/>
        <text x={Math.min(296, 20 + th * 280 + 4)} y="20" className="viz-label" textAnchor={th > 0.8 ? 'end' : 'start'}>θ</text>
        {cur.rows.map((r, i) => <g key={i}>
          <circle cx={20 + r.est * 280} cy={20 + r.y * 120} r="6" className={'viz-dot' + (r.big ? '' : ' alt2')}><title>{`true difficulty ${r.d.toFixed(2)}, estimated ${r.est.toFixed(2)} → ${r.big ? 'large' : 'small'} model, ${r.ok ? 'correct' : 'wrong'}`}</title></circle>
          {!r.ok && <circle cx={20 + r.est * 280} cy={20 + r.y * 120} r="9" fill="none" stroke="var(--bad)" strokeWidth="2" style={{ transition: 'cx .5s ease' }}/>}
        </g>)}
        <text x="20" y="168" className="viz-label">easy → small model</text><text x="300" y="168" className="viz-label" textAnchor="end">hard → large model</text>
      </svg>
      <svg viewBox="0 0 320 180" className="viz-svg" role="img" aria-label={`Cost versus quality curve as the threshold moves; current point at ${(cur.cost * 100).toFixed(0)}% cost and ${(cur.quality * 100).toFixed(0)}% quality`}>
        <line x1="40" x2="290" y1="150" y2="150" className="viz-axis"/><line x1="40" x2="40" y1="15" y2="150" className="viz-axis"/>
        <path d={path} className="viz-curve alt"/>
        <circle cx={PX(cur.cost)} cy={PY(cur.quality)} r="7" className="viz-ball"/>
        <text x="290" y="168" className="viz-label" textAnchor="end">cost →</text><text x="44" y="14" className="viz-label">quality</text>
        <text x="36" y={PY(1) + 4} className="viz-label" textAnchor="end">100%</text><text x="36" y={PY(0.4) + 4} className="viz-label" textAnchor="end">40%</text>
      </svg>
    </div>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--ink-3)' }}>
      <span><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="var(--s3)"/></svg> small model</span>
      <span><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="var(--accent)"/></svg> large model</span>
      <span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="none" stroke="var(--bad)" strokeWidth="2"/></svg> wrong answer</span>
    </div>
    <div className="viz-two">
      <Slider label="Routing threshold θ" value={th} min={0} max={1} step={0.02} onChange={setTh} format={v => v.toFixed(2)}/>
      <Slider label="Router noise" value={noise} min={0} max={0.6} step={0.05} onChange={setNoise} format={v => `±${(v / 2).toFixed(2)}`}/>
    </div>
    <Stats>
      <Stat label="To large model" value={`${cur.big}/${Q.length}`}/>
      <Stat label="Quality" value={`${(cur.quality * 100).toFixed(0)}%`} tone={cur.quality >= allBig.quality - 0.03 ? 'ok' : 'bad'}/>
      <Stat label="Cost vs all-large" value={`${(cur.cost * 100).toFixed(0)}%`} tone="on"/>
      <Stat label="All-small / all-large quality" value={`${(allSmall.quality * 100).toFixed(0)}% / ${(allBig.quality * 100).toFixed(0)}%`}/>
    </Stats>
  </Frame>;
}
