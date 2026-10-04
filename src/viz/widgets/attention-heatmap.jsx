import React, { useState } from 'react';
import { Frame, Seg, Bars, Stats, Stat, softmax } from '../index';
import './widgets-w2.css';

// Tiny hand-built embeddings. Features: [entity, action, function word, pronoun, adjective].
const TOKENS = [['The', [0, 0, 1, 0, 0]], ['cat', [1, 0, 0, 0, 0]], ['sat', [0, 1, 0, 0, 0]], ['on', [0, 0, 1, 0, 0]], ['the', [0, 0, 1, 0, 0]],
  ['mat', [0.5, 0, 0, 0, 0]], ['because', [0, 0, 1, 0, 0]], ['it', [0, 0, 0, 1, 0]], ['was', [0, 0.6, 0.4, 0, 0]], ['tired', [0, 0, 0, 0, 1]]];
// Projections into a 3-d query/key space: [entity-ness, action-ness, glue].
const WQ = [[0, 2, 0], [2.5, 0, 0], [0.5, 0.5, 0.5], [4, 0, 0], [2.5, 0, 0]];
const WK = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.3, 0, 0], [0, 0.3, 0]];
const mul = (x, W) => W[0].map((_, c) => x.reduce((s, xi, r) => s + xi * W[r][c], 0));
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const Q = TOKENS.map(t => mul(t[1], WQ)), K = TOKENS.map(t => mul(t[1], WK));
const N = TOKENS.length, DK = 3;

function weights(causal) {
  return Q.map((q, i) => {
    const scores = K.map((k, j) => (causal && j > i) ? -Infinity : dot(q, k) / Math.sqrt(DK) - 0.1 * Math.abs(i - j));
    const finite = scores.map(s => Number.isFinite(s) ? s : -1e9);
    return softmax(finite);
  });
}

export default function AttentionHeatmap() {
  const [sel, setSel] = useState(7);
  const [mode, setMode] = useState('bidirectional');
  const causal = mode === 'causal';
  const A = weights(causal);
  const row = A[sel];
  const top = row.indexOf(Math.max(...row));
  const entropy = -row.reduce((s, p) => s + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
  const visible = causal ? sel + 1 : N;
  const C = 40, L = 72, T = 70;
  const foot = `“${TOKENS[sel][0]}” puts ${(row[top] * 100).toFixed(0)}% of its attention on “${TOKENS[top][0]}”. ` +
    (causal ? `With the causal mask it can only see ${visible} token${visible > 1 ? 's' : ''} (itself and the past); the upper triangle is zero.` : 'Without a mask every token sees the whole sentence, including words that come later.');
  return <Frame title="Attention heatmap / who looks at whom" meta={causal ? 'causal mask on' : 'no mask'} foot={foot}>
    <Seg options={[{ value: 'bidirectional', label: 'No mask (encoder)' }, { value: 'causal', label: 'Causal mask (decoder)' }]} value={mode} onChange={setMode} label="Mask"/>
    <div className="viz-row w-attention-heatmap-chips" role="group" aria-label="Choose query token">
      {TOKENS.map((t, i) => <button key={i} className={'viz-chip' + (i === sel ? ' on' : '')} aria-pressed={i === sel} onClick={() => setSel(i)}>{t[0]}</button>)}
    </div>
    <div className="viz-two">
      <svg viewBox={`0 0 ${L + N * C + 4} ${T + N * C + 4}`} className="viz-svg" role="img" aria-label={`Attention weight matrix; row ${TOKENS[sel][0]} selected`}>
        {TOKENS.map((t, j) => <text key={'c' + j} x={L + j * C + C / 2} y={T - 6} transform={`rotate(-45 ${L + j * C + C / 2} ${T - 6})`} className="viz-label" style={{ fill: j === top ? 'var(--accent)' : undefined }}>{t[0]}</text>)}
        {A.map((r, i) => <g key={i} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
          <text x={L - 6} y={T + i * C + C / 2 + 4} textAnchor="end" className="viz-label" style={{ fill: i === sel ? 'var(--accent)' : undefined, fontWeight: i === sel ? 700 : 400 }}>{TOKENS[i][0]}</text>
          {r.map((w, j) => <g key={j}>
            <rect x={L + j * C + 1} y={T + i * C + 1} width={C - 2} height={C - 2} rx="4" style={{ fill: 'var(--surface-3)' }}/>
            <rect x={L + j * C + 1} y={T + i * C + 1} width={C - 2} height={C - 2} rx="4" className="w-attention-heatmap-cell" style={{ fill: 'var(--accent)' }} fillOpacity={Math.min(1, w * 1.6)} opacity={sel === i ? 1 : 0.55}/>
          </g>)}
        </g>)}
        <rect x={L} y={T} width={N * C} height={C} rx="5" fill="none" style={{ stroke: 'var(--ink)', strokeWidth: 2, transform: `translateY(${sel * C}px)`, transition: 'transform .3s ease' }}/>
      </svg>
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <p className="viz-prompt">Query: <b>{TOKENS[sel][0]}</b></p>
        <Bars items={TOKENS.map((t, j) => ({ label: `${j}. ${t[0]}`, value: row[j], tone: j === top ? 'on' : (causal && j > sel ? 'off' : ''), note: `${(row[j] * 100).toFixed(1)}%` }))} max={1}/>
      </div>
    </div>
    <Stats><Stat label="Query" value={TOKENS[sel][0]}/><Stat label="Strongest key" value={TOKENS[top][0]} tone="on"/><Stat label="Row sum" value={row.reduce((a, b) => a + b, 0).toFixed(3)}/><Stat label="Entropy" value={`${entropy.toFixed(2)} bits`}/></Stats>
  </Frame>;
}
