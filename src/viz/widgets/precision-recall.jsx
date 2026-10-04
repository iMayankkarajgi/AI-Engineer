import React, { useState } from 'react';
import { Frame, Slider, Stats, Stat, Controls, Btn, rng } from '../index';

// 24 scored examples from a classifier; anything with score ≥ threshold is predicted positive.
const r = rng(7);
const DATA = Array.from({ length: 24 }, (_, i) => {
  const pos = i % 2 === 0, s = (pos ? 0.64 : 0.38) + (r() - 0.5) * 0.62;
  return { pos, s: Math.min(0.98, Math.max(0.02, s)), j: r() };
});
const count = t => {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const d of DATA) { const p = d.s >= t; if (p && d.pos) tp++; else if (p) fp++; else if (d.pos) fn++; else tn++; }
  return { tp, fp, fn, tn, prec: tp + fp ? tp / (tp + fp) : 1, rec: tp + fn ? tp / (tp + fn) : 0 };
};
const CURVE = Array.from({ length: 101 }, (_, i) => count(i / 100));
const X = s => 20 + s * 560, PX = rc => 30 + rc * 200, PY = pr => 210 - pr * 190;

export default function PrecisionRecall() {
  const [t, setT] = useState(0.5);
  const { tp, fp, fn, tn, prec, rec } = count(t);
  const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
  const cells = [['TP', tp, 'ok', 'caught'], ['FN', fn, 'bad', 'missed'], ['FP', fp, 'bad', 'false alarm'], ['TN', tn, 'ok', 'correctly ignored']];
  const foot = tp + fp === 0 ? 'Threshold above every score: nothing is flagged, so recall is 0 (precision is undefined).'
    : rec === 1 && prec < 0.75 ? 'Low threshold: every positive is caught, but many negatives are flagged too — high recall, poor precision.'
    : prec === 1 && rec < 0.75 ? 'High threshold: everything flagged is truly positive, but many positives are missed — high precision, poor recall.'
    : 'Middle ground: raising the threshold trades recall for precision; lowering it does the reverse.';
  return <Frame title="Precision & recall / decision threshold" meta={`threshold ${t.toFixed(2)}`} foot={foot}>
    <svg viewBox="0 0 600 130" className="viz-svg" role="img" aria-label="Examples placed by model score with a movable threshold">
      <rect x={X(t)} y="8" width={Math.max(0, 580 - X(t))} height="96" fill="var(--accent-soft)" style={{ transition: 'x .2s, width .2s' }}/>
      <text x="22" y="34" className="viz-label">actual +</text><text x="22" y="84" className="viz-label">actual −</text>
      {DATA.map((d, i) => { const ok = (d.s >= t) === d.pos; return <circle key={i} cx={X(d.s)} cy={(d.pos ? 30 : 80) + (d.j - 0.5) * 22} r="6.5"
        className={'viz-dot' + (d.pos ? '' : ' alt')} style={{ stroke: ok ? 'var(--surface)' : 'var(--bad)', strokeWidth: ok ? 1.5 : 3 }}/>; })}
      <line x1={X(t)} x2={X(t)} y1="4" y2="108" stroke="var(--accent)" strokeWidth="2.5"/>
      <text x={Math.min(X(t) + 6, 520)} y="18" className="viz-label">predict + →</text>
      <line x1="20" x2="580" y1="112" y2="112" className="viz-axis"/>
      <text x="20" y="126" className="viz-label">score 0</text><text x="580" y="126" className="viz-label" textAnchor="end">1</text>
    </svg>
    <Slider label="Threshold" value={t} min={0} max={1} step={0.01} onChange={setT} format={v => v.toFixed(2)}/>
    <div className="viz-two">
      <div>
        <small className="viz-label">Confusion matrix (rows: actual +, actual −)</small>
        <div className="viz-grid-cells" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 240, marginTop: 6 }}>
          {cells.map(([k, n, tone, note]) => <div key={k} className={'viz-cell ' + (n ? tone : 'muted')} style={{ aspectRatio: '1.4', fontSize: '.8rem', textAlign: 'center' }}>{k} {n}<br/><span style={{ fontWeight: 400, fontSize: '.65rem' }}>{note}</span></div>)}
        </div>
      </div>
      <svg viewBox="0 0 250 240" className="viz-svg" role="img" aria-label="Precision-recall curve with the current threshold marked">
        <line x1="30" x2="230" y1="210" y2="210" className="viz-axis"/><line x1="30" x2="30" y1="20" y2="210" className="viz-axis"/>
        <path d={CURVE.map((c, i) => `${i ? 'L' : 'M'}${PX(c.rec).toFixed(1)},${PY(c.prec).toFixed(1)}`).join('')} className="viz-curve alt2" style={{ strokeWidth: 2 }}/>
        <circle cx={PX(rec)} cy={PY(prec)} r="7" className="viz-ball"/>
        <text x="130" y="232" className="viz-label" textAnchor="middle">recall</text><text x="4" y="16" className="viz-label">precision</text>
      </svg>
    </div>
    <Controls>{[0.2, 0.5, 0.8].map(v => <Btn key={v} onClick={() => setT(v)}>t = {v}</Btn>)}</Controls>
    <Stats>
      <Stat label="Precision TP/(TP+FP)" value={tp + fp ? prec.toFixed(2) : '—'}/>
      <Stat label="Recall TP/(TP+FN)" value={rec.toFixed(2)}/>
      <Stat label="F1" value={f1.toFixed(2)} tone="on"/>
    </Stats>
  </Frame>;
}
