import React, { useState } from 'react';
import { Frame, Seg, Slider, Controls, Btn, Stats, Stat, useTicker, rng } from '../index';

// Illustrative U-curve shaped like Liu et al. (2023), "Lost in the Middle": strong primacy + recency, a dip in between.
const acc = (p, k) => {
  const x = k > 1 ? (p - 1) / (k - 1) : 0;
  const mid = 0.62 - 0.004 * k;
  return Math.min(0.98, mid + 0.22 * Math.exp(-x / 0.18) + 0.17 * Math.exp(-(1 - x) / 0.18));
};
const TRIALS = 40;
const X = (p, k) => 40 + (k > 1 ? (p - 1) / (k - 1) : 0) * 520, Y = a => 200 - (a - 0.3) * 240;

export default function LostInMiddle() {
  const [k, setK] = useState(20);
  const [p, setP] = useState(10);
  const [running, setRunning] = useState(false);
  const pos = Math.min(p, k);
  useTicker(running, 350, () => { if (pos >= k) { setRunning(false); return false; } setP(v => Math.min(v + 1, k)); });
  const a = acc(pos, k);
  // Simulate TRIALS questions with the doc at this position: each answered correctly with probability a.
  const R = rng(pos * 97 + k);
  const correct = Array.from({ length: TRIALS }, () => R() < a);
  const nOk = correct.filter(Boolean).length;
  const curve = Array.from({ length: k }, (_, i) => `${i ? 'L' : 'M'}${X(i + 1, k).toFixed(1)},${Y(acc(i + 1, k)).toFixed(1)}`).join('');
  const where = pos <= Math.max(1, Math.round(k * 0.15)) ? 'start' : pos > k - Math.max(1, Math.round(k * 0.15)) ? 'end' : 'middle';
  const best = Math.max(acc(1, k), acc(k, k)), worst = Math.min(...Array.from({ length: k }, (_, i) => acc(i + 1, k)));
  return <Frame title="Lost in the middle / position of the relevant document" meta={`doc ${pos} of ${k}`}
    foot={where === 'middle' ? `Buried in the middle, the answer is found only ~${Math.round(a * 100)}% of the time — the model skims long contexts and attends most to the edges.` : where === 'start' ? `Near the start (primacy), the model finds it ~${Math.round(a * 100)}% of the time.` : `Near the end (recency), the model finds it ~${Math.round(a * 100)}% of the time. Put the most important context at the edges.`}>
    <Seg options={[10, 20, 30].map(v => ({ value: String(v), label: `${v} documents` }))} value={String(k)} onChange={v => { setK(Number(v)); setP(Math.min(p, Number(v))); setRunning(false); }} label="Context size"/>
    <div className="viz-grid-cells" style={{ gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))` }} role="img" aria-label={`${k} documents, relevant one at position ${pos}`}>
      {Array.from({ length: k }, (_, i) => <span key={i} className={'viz-cell' + (i + 1 === pos ? ' on' : '')} style={{ aspectRatio: '0.7', fontSize: '.55rem' }}>{i + 1 === pos ? '★' : ''}</span>)}
    </div>
    <svg viewBox="0 0 600 230" className="viz-svg" role="img" aria-label={`Accuracy versus position: ${Math.round(a * 100)} percent at position ${pos}`}>
      <line x1="40" x2="560" y1="200" y2="200" className="viz-axis"/><line x1="40" x2="40" y1="20" y2="200" className="viz-axis"/>
      {[0.4, 0.6, 0.8].map(v => <g key={v}><line x1="40" x2="560" y1={Y(v)} y2={Y(v)} className="viz-grid"/><text x="34" y={Y(v) + 4} textAnchor="end" className="viz-label">{v * 100}%</text></g>)}
      <path d={curve} className="viz-curve"/>
      <line x1={X(pos, k)} x2={X(pos, k)} y1={Y(a)} y2="200" className="viz-guide"/>
      <circle cx={X(pos, k)} cy={Y(a)} r="8" className="viz-ball"/>
      <circle cx={X(pos, k)} cy={Y(nOk / TRIALS)} r="4" className="viz-dot alt2"/>
      <circle cx="430" cy="14" r="4" className="viz-dot alt2"/><text x="440" y="18" className="viz-label">simulated</text><circle cx="500" cy="14" r="5" className="viz-ball"/><text x="510" y="18" className="viz-label">expected</text>
      <text x="40" y="218" className="viz-label">first</text><text x="300" y="218" textAnchor="middle" className="viz-label">middle</text><text x="560" y="218" textAnchor="end" className="viz-label">last</text>
    </svg>
    <Slider label="Position of the relevant document" value={pos} min={1} max={k} onChange={v => { setRunning(false); setP(v); }}/>
    <Controls>
      <Btn primary onClick={() => { if (pos >= k) setP(1); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Sweep positions'}</Btn>
      <Btn onClick={() => { setRunning(false); setP(1); }}>First</Btn>
      <Btn onClick={() => { setRunning(false); setP(Math.ceil(k / 2)); }}>Middle</Btn>
      <Btn onClick={() => { setRunning(false); setP(k); }}>Last</Btn>
    </Controls>
    <div className="viz-row" aria-label={`${nOk} of ${TRIALS} simulated questions answered correctly`}>{correct.map((c, i) => <span key={i} className={'viz-cell' + (c ? ' ok' : ' bad')} style={{ width: 12, aspectRatio: 1 }}/>)}</div>
    <Stats>
      <Stat label="Expected accuracy" value={`${Math.round(a * 100)}%`} tone={where === 'middle' ? 'bad' : 'ok'}/>
      <Stat label={`Simulated (${TRIALS} Qs)`} value={`${nOk} / ${TRIALS}`}/>
      <Stat label="Edge − worst middle" value={`${Math.round((best - worst) * 100)} pts`}/>
    </Stats>
  </Frame>;
}
