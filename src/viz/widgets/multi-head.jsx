import React, { useState } from 'react';
import { Frame, Seg, Slider, Stats, Stat, softmax } from '../index';
import './widgets-w2.css';

// Each head scores keys with its own learned "rule"; softmax + causal mask are real.
const TOK = ['The', 'cat', ',', 'which', 'was', 'hungry', ',', 'ate', 'the', 'fish', '.'];
const N = TOK.length, SUBJ = 1;
const isPunct = t => /^[,.]$/.test(t);
const HEADS = {
  previous: { label: 'Head 1 · previous token', score: (i, j) => (j === i - 1 ? 4 : j === i ? 1 : 0) - 0.2 * (i - j), what: 'looks one step back — a positional pattern' },
  subject: { label: 'Head 2 · subject', score: (i, j) => (j === SUBJ ? 4 : j === i ? 1 : 0), what: 'finds the subject “cat” from anywhere in the clause' },
  punct: { label: 'Head 3 · punctuation', score: (i, j) => (isPunct(TOK[j]) ? 3.5 : 0) - 0.15 * (i - j), what: 'attends to the nearest commas and full stops (clause boundaries)' },
};
const pattern = (h, sharp) => TOK.map((_, i) => {
  const sc = TOK.map((_, j) => (j > i ? -1e9 : HEADS[h].score(i, j) * sharp));
  return softmax(sc);
});
const X = i => 30 + i * (540 / (N - 1));

export default function MultiHead() {
  const [head, setHead] = useState('subject');
  const [q, setQ] = useState(7);
  const [sharp, setSharp] = useState(1);
  const A = pattern(head, sharp);
  const row = A[q];
  const top = row.indexOf(Math.max(...row));
  const ent = -row.reduce((s, p) => s + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
  const C = 18;
  return <Frame title="Multi-head attention / different heads, different jobs" meta={HEADS[head].label}
    foot={`${HEADS[head].label.split('·')[1].trim()} head ${HEADS[head].what}. Here “${TOK[q]}” sends ${(row[top] * 100).toFixed(0)}% to “${TOK[top]}”${q === 0 ? ' (the first token can only see itself)' : ''}. Real models run many such heads in parallel and concatenate their outputs.`}>
    <Seg options={Object.keys(HEADS).map(k => ({ value: k, label: HEADS[k].label }))} value={head} onChange={setHead} label="Attention head"/>
    <div className="viz-row w-multi-head-chips" role="group" aria-label="Choose query token">
      {TOK.map((t, i) => <button key={i} className={'viz-chip' + (i === q ? ' on' : '')} aria-pressed={i === q} onClick={() => setQ(i)}>{t}</button>)}
    </div>
    <svg viewBox="0 0 600 170" className="viz-svg" role="img" aria-label={`Arcs from ${TOK[q]} to the tokens it attends to under the ${head} head`}>
      {row.map((w, j) => {
        if (j === q) return <circle key={j} cx={X(j)} cy={120} r={6 + 10 * w} className="viz-dot alt" style={{ opacity: 0.35 + w }}/>;
        const h = 20 + Math.abs(q - j) * 9;
        return <path key={j} d={`M${X(q)},120 Q${(X(q) + X(j)) / 2},${120 - h * 1.6} ${X(j)},120`} fill="none"
          style={{ stroke: 'var(--accent)', strokeWidth: 1 + 9 * w, opacity: w < 0.005 ? 0 : 0.2 + 0.8 * w, transition: 'stroke-width .35s, opacity .35s' }}/>;
      })}
      {TOK.map((t, i) => <text key={i} x={X(i)} y={150} textAnchor="middle" className="viz-label" onClick={() => setQ(i)}
        style={{ cursor: 'pointer', fill: i === q ? 'var(--s2)' : i === top ? 'var(--accent)' : undefined, fontWeight: i === q || i === top ? 700 : 400 }}>{t}</text>)}
      {row.map((w, j) => w > 0.08 && j !== q && <text key={'w' + j} x={X(j)} y={166} textAnchor="middle" className="viz-label" style={{ fontSize: 9 }}>{Math.round(w * 100)}%</text>)}
    </svg>
    <div className="viz-two">
      <svg viewBox={`0 0 ${N * C + 50} ${N * C + 4}`} className="viz-svg" role="img" aria-label={`Full ${head} head attention pattern`} style={{ maxWidth: 300 }}>
        {A.map((r, i) => <g key={i}>
          <text x="44" y={i * C + 13} textAnchor="end" className="viz-label" style={{ fontSize: 9, fill: i === q ? 'var(--s2)' : undefined }}>{TOK[i]}</text>
          {r.map((w, j) => <g key={j} onClick={() => setQ(i)} style={{ cursor: 'pointer' }}>
            <rect x={50 + j * C} y={i * C} width={C - 2} height={C - 2} rx="2" style={{ fill: 'var(--surface-3)' }}/>
            <rect x={50 + j * C} y={i * C} width={C - 2} height={C - 2} rx="2" className="w-multi-head-cell" style={{ fill: i === q ? 'var(--s2)' : 'var(--accent)' }} fillOpacity={Math.min(1, w * 1.4)}/>
          </g>)}
        </g>)}
      </svg>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <p className="viz-prompt">The full pattern is the head’s fingerprint: a <b>diagonal stripe</b> (previous token), a <b>column</b> (subject) or <b>columns at punctuation</b>.</p>
        <Slider label="Head sharpness (score scale)" value={sharp} min={0.2} max={3} step={0.1} onChange={setSharp} format={v => `×${v.toFixed(1)}`}/>
      </div>
    </div>
    <Stats><Stat label="Query" value={TOK[q]}/><Stat label="Top key" value={`${TOK[top]} (${(row[top] * 100).toFixed(0)}%)`} tone="on"/><Stat label="Entropy" value={`${ent.toFixed(2)} bits`}/></Stats>
  </Frame>;
}
