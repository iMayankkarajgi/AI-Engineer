import React, { useState } from 'react';
import { Frame, Seg, Controls, Btn, Stats, Stat, useTicker, softmax } from '../index';
import './widgets-w2.css';

// Three tokens, d_k = 4, d_v = 2. Every number below is computed, not typed in.
const TOK = ['I', 'love', 'cats'];
const Q = [[1, 0, 1, 0], [0, 2, 0, 1], [1, 1, 1, 1]];
const K = [[1, 0, 1, 0], [0, 1, 0, 1], [2, 1, 0, 0]];
const V = [[1, 0], [0, 1], [1, 1]];
const DK = 4;
const STEPS = ['Inputs Q, K, V', 'Scores = Q·Kᵀ', 'Scale ÷ √dₖ', 'Softmax each row', 'Output = weights · V'];
const fmt = v => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(2));

function Mat({ label, m, selRow, tone }) {
  return <div className="w-qkv-math-box">
    <small>{label}</small>
    <div className="w-qkv-math-mat" style={{ gridTemplateColumns: `repeat(${m[0].length}, minmax(34px, 46px))` }}>
      {m.map((r, i) => r.map((v, j) => <span key={`${i}-${j}`} className={'viz-cell' + (i === selRow ? ' sel ' + (tone || 'on') : '')}>{fmt(v)}</span>))}
    </div>
  </div>;
}

export default function QkvMath() {
  const [step, setStep] = useState(0);
  const [q, setQ] = useState(1);
  const [scale, setScale] = useState('on');
  const [running, setRunning] = useState(false);
  useTicker(running, 1300, () => { if (step >= STEPS.length - 1) { setRunning(false); return false; } setStep(s => Math.min(s + 1, STEPS.length - 1)); });
  const div = scale === 'on' ? Math.sqrt(DK) : 1;
  const raw = Q.map(qi => K.map(kj => qi.reduce((s, v, d) => s + v * kj[d], 0)));
  const scaled = raw.map(r => r.map(v => v / div));
  const W = scaled.map(r => softmax(r));
  const out = W.map(w => V[0].map((_, c) => w.reduce((s, wj, j) => s + wj * V[j][c], 0)));
  const shown = step <= 1 ? raw : step === 2 ? scaled : W;
  const qi = Q[q];
  const lines = [
    `Query “${TOK[q]}” = [${qi.join(', ')}]. Each key and value belongs to one token.`,
    K.map((k, j) => `q·k(${TOK[j]}) = ${qi.map((v, d) => `${v}·${k[d]}`).join(' + ')} = ${fmt(raw[q][j])}`).join('\n'),
    `divide by √dₖ = ${fmt(div)} → [${scaled[q].map(fmt).join(', ')}]${scale === 'off' ? '  (scaling switched off)' : ''}`,
    `softmax: e^s / Σe^s → [${W[q].map(v => v.toFixed(3)).join(', ')}]  (sums to 1)`,
    `output = ${W[q].map((w, j) => `${w.toFixed(2)}·[${V[j].join(',')}]`).join(' + ')} = [${out[q].map(v => v.toFixed(3)).join(', ')}]`,
  ];
  const go = s => { setRunning(false); setStep(s); };
  const maxW = Math.max(...W[q]);
  const foot = step === 0 ? 'Each token has a query (what it looks for), a key (what it offers) and a value (what it passes on).'
    : step === 1 ? `Dot products measure how well “${TOK[q]}” matches each key; bigger means more relevant.`
    : step === 2 ? (scale === 'on' ? 'Dividing by √dₖ keeps scores from growing with dimension, so softmax does not saturate.' : 'Without scaling the scores stay large, and softmax becomes sharper (closer to a hard argmax).')
    : step === 3 ? `Softmax turns scores into weights; “${TOK[W[q].indexOf(maxW)]}” gets ${(maxW * 100).toFixed(0)}%.`
    : `The output for “${TOK[q]}” is a weighted blend of the value vectors: [${out[q].map(v => v.toFixed(2)).join(', ')}].`;
  return <Frame title="Q · Kᵀ / √dₖ → softmax → · V" meta={`step ${step + 1} / ${STEPS.length}: ${STEPS[step]}`} foot={foot}>
    <div className="viz-row">
      <Seg options={TOK.map((t, i) => ({ value: String(i), label: `query: ${t}` }))} value={String(q)} onChange={v => setQ(Number(v))} label="Query token"/>
      <Seg options={[{ value: 'on', label: '÷√dₖ on' }, { value: 'off', label: 'no scaling' }]} value={scale} onChange={setScale} label="Scaling"/>
    </div>
    <div className="w-qkv-math-mats">
      <Mat label="Q (3×4)" m={Q} selRow={q}/>
      <Mat label="K (3×4)" m={K} selRow={-1}/>
      <Mat label="V (3×2)" m={V} selRow={-1}/>
      {step >= 1 && <div className="viz-fade" key={'s' + Math.min(step, 3)}><Mat label={step <= 1 ? 'Q·Kᵀ' : step === 2 ? 'scaled' : 'weights'} m={shown} selRow={q}/></div>}
      {step >= 4 && <div className="viz-fade"><Mat label="output (3×2)" m={out} selRow={q} tone="alt"/></div>}
    </div>
    <pre className="w-qkv-math-eq">{lines.slice(0, step + 1).map((l, i) => <div key={i} className={i === step ? 'viz-fade' : ''} style={{ opacity: i === step ? 1 : 0.6 }}>{i === step ? <b>{l}</b> : l}</div>)}</pre>
    <Controls>
      <Btn primary onClick={() => { if (step >= STEPS.length - 1) setStep(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>◀ Back</Btn>
      <Btn onClick={() => go(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}>Step ▶</Btn>
      <Btn onClick={() => go(0)}>↺ Reset</Btn>
    </Controls>
    <Stats><Stat label="√dₖ" value={fmt(Math.sqrt(DK))}/><Stat label="Max weight" value={`${(maxW * 100).toFixed(1)}%`} tone="on"/><Stat label={`Output (${TOK[q]})`} value={`[${out[q].map(v => v.toFixed(2)).join(', ')}]`}/></Stats>
  </Frame>;
}
