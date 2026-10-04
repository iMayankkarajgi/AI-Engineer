import React, { useState } from 'react';
import { Frame, Slider, Seg, Bars, Stats, Stat, Controls, Btn, softmax, rng } from '../index';

// Top-k keeps the k most likely tokens; top-p (nucleus) keeps the smallest set whose
// probability mass reaches p. Survivors are renormalised so they sum to 1 again.
const TOKENS = [['mat', 3.2], ['floor', 2.6], ['sofa', 2.1], ['bed', 1.7], ['roof', 1.0], ['moon', 0.2], ['piano', -0.4], ['equation', -1.3]];
const PROBS = softmax(TOKENS.map(t => t[1]));
const ORDER = PROBS.map((_, i) => i).sort((a, b) => PROBS[b] - PROBS[a]);
const pct = v => `${(v * 100).toFixed(1)}%`;

export default function TopKTopP() {
  const [mode, setMode] = useState('top-p');
  const [k, setK] = useState(3);
  const [p, setP] = useState(0.8);
  const [n, setN] = useState(0);
  let pool = ORDER;
  if (mode !== 'top-p') pool = pool.slice(0, k);
  if (mode !== 'top-k') {
    const z = pool.reduce((s, i) => s + PROBS[i], 0), out = [];
    let c = 0;
    for (const i of pool) { out.push(i); c += PROBS[i] / z; if (c >= p - 1e-9) break; }
    pool = out;
  }
  const keep = new Set(pool), mass = pool.reduce((s, i) => s + PROBS[i], 0);
  const renorm = i => (keep.has(i) ? PROBS[i] / mass : 0);
  const r = rng(42);
  const samples = Array.from({ length: n }, () => { const u = r(); let acc = 0; for (const i of pool) { acc += renorm(i); if (u < acc) return i; } return pool[pool.length - 1]; });
  const foot = pool.length === 1 ? 'Only one token survives, so sampling becomes greedy decoding: the output is fully deterministic.'
    : mode === 'top-k' ? `Top-k always keeps exactly ${k} tokens, however confident or unsure the model is.`
    : `Top-p kept ${pool.length} tokens: the fewest whose mass reaches ${pct(p)}. A flatter distribution would keep more.`;
  return <Frame title="Top-k / top-p sampling" meta={`${pool.length} of ${TOKENS.length} kept`} foot={`${foot} Removed tokens' ${pct(1 - mass)} is shared among the survivors.`}>
    <Seg options={[{ value: 'top-k', label: 'Top-k' }, { value: 'top-p', label: 'Top-p' }, { value: 'both', label: 'Top-k then top-p' }]} value={mode} onChange={setMode} label="Filter"/>
    <p className="viz-prompt">“The cat sat on the <b>{TOKENS[ORDER.find(i => keep.has(i))][0]}</b>…”</p>
    <div className="viz-two">
      <div><small className="viz-label">Original softmax</small>
        <Bars items={ORDER.map(i => ({ label: TOKENS[i][0], value: PROBS[i], tone: keep.has(i) ? '' : 'off', note: pct(PROBS[i]) }))} max={1}/></div>
      <div><small className="viz-label">After filtering + renormalising</small>
        <Bars items={ORDER.map(i => ({ label: TOKENS[i][0], value: renorm(i), tone: keep.has(i) ? 'on' : 'off', note: keep.has(i) ? pct(renorm(i)) : 'cut' }))} max={1}/></div>
    </div>
    {mode !== 'top-p' && <Slider label="k (tokens kept)" value={k} min={1} max={TOKENS.length} onChange={setK}/>}
    {mode !== 'top-k' && <Slider label="p (cumulative mass)" value={p} min={0.05} max={1} step={0.01} onChange={setP} format={v => v.toFixed(2)}/>}
    <Controls>
      <Btn primary onClick={() => setN(v => Math.min(v + 10, 60))}>Sample 10 tokens</Btn>
      <Btn onClick={() => setN(0)}>Clear samples</Btn>
    </Controls>
    {n > 0 && <div className="viz-row">{samples.map((i, j) => <span key={j} className="viz-chip on viz-pop">{TOKENS[i][0]}</span>)}</div>}
    <Stats><Stat label="Tokens kept" value={pool.length}/><Stat label="Mass kept" value={pct(mass)}/><Stat label="Top token now" value={pct(renorm(ORDER[0]))} tone="on"/></Stats>
  </Frame>;
}
