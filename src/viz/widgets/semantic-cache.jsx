import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, useTicker } from '../index';
import './widgets-w3.css';

// Toy embeddings over [password, router/device, refund, shipping, general].
const CACHE = [
  { q: 'How do I reset my password?', v: [1, 0, 0, 0, 0.1] },
  { q: 'What is your refund policy?', v: [0, 0, 1, 0, 0.1] },
  { q: 'How long does shipping take?', v: [0, 0, 0, 1, 0.1] },
];
// truth = index of the cached question with the SAME answer, or null if the cached answer would be wrong.
const INCOMING = [
  { q: 'I forgot my password, how do I change it?', v: [0.95, 0.05, 0, 0, 0.2], truth: 0 },
  { q: 'How do I reset my router?', v: [0.85, 0.5, 0, 0, 0.1], truth: null },
  { q: 'Can I get my money back?', v: [0, 0, 0.85, 0.1, 0.4], truth: 1 },
  { q: 'How long does shipping take to Canada?', v: [0, 0, 0, 0.9, 0.45], truth: null },
  { q: 'When will my order arrive?', v: [0, 0, 0.1, 0.8, 0.5], truth: 2 },
  { q: "What's the weather today?", v: [0, 0.1, 0, 0, 1], truth: null },
  { q: 'Reset password for my admin login', v: [0.95, 0, 0, 0, 0.3], truth: 0 },
  { q: 'Is shipping refunded if I return it?', v: [0, 0, 0.7, 0.6, 0.2], truth: null },
  { q: 'Return policy for refunds?', v: [0, 0, 0.95, 0.05, 0.15], truth: 1 },
  { q: 'Password reset email never came', v: [0.8, 0, 0, 0, 0.6], truth: null },
];
const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b) || 1);
const SCORED = INCOMING.map(x => { const sims = CACHE.map(c => cos(x.v, c.v)), best = sims.indexOf(Math.max(...sims)); return { ...x, best, sim: sims[best] }; });
const LABEL = { hit: ['viz-chip ok', 'hit'], false: ['viz-chip bad', 'false hit'], miss: ['viz-chip', 'miss'], lost: ['viz-chip', 'missed hit'] };

export default function SemanticCache() {
  const [th, setTh] = useState(0.9);
  const [shown, setShown] = useState(SCORED.length);
  const [running, setRunning] = useState(false);
  useTicker(running, 650, () => { if (shown >= SCORED.length) { setRunning(false); return false; } setShown(shown + 1); });
  const rows = SCORED.map(x => ({ ...x, out: x.sim >= th ? (x.truth === x.best ? 'hit' : 'false') : (x.truth !== null ? 'lost' : 'miss') }));
  const vis = rows.slice(0, shown);
  const count = o => vis.filter(r => r.out === o).length;
  const hits = count('hit'), fh = count('false'), served = hits + fh;
  const foot = !vis.length ? 'Press play to send queries at the cache.'
    : fh > 0 ? `Threshold ${th.toFixed(2)} is loose: ${fh} quer${fh > 1 ? 'ies get' : 'y gets'} a cached answer to a different question (false hit). Raise the threshold.`
    : count('lost') > 1 ? `Threshold ${th.toFixed(2)} is strict: no wrong answers, but ${count('lost')} paraphrases that could have been served from cache go to the LLM.`
    : `Threshold ${th.toFixed(2)}: ${hits} paraphrases served from cache with no wrong answers among the queries shown.`;
  return <Frame title="Semantic cache / similarity threshold" meta={`threshold ${th.toFixed(2)} · ${vis.length}/${SCORED.length} queries`} foot={foot}>
    <div className="viz-row" aria-label="Cached questions">{CACHE.map((c, i) => <span key={i} className="viz-chip on">cache {i + 1}: {c.q}</span>)}</div>
    <div className="w-semantic-cache-rows" aria-live="polite">{vis.map((r, i) => <div key={i} className="w-semantic-cache-row viz-fade">
      <div>{r.q}<small>closest: cache {r.best + 1} · cos {r.sim.toFixed(3)}</small></div>
      <div className="w-semantic-cache-track" title={`similarity ${r.sim.toFixed(3)}`}><i style={{ width: `${Math.max(0, r.sim) * 100}%` }}/><em style={{ left: `${th * 100}%` }}/></div>
      <span className={LABEL[r.out][0]}>{LABEL[r.out][1]}</span>
    </div>)}</div>
    <Slider label="Similarity threshold" value={th} min={0.5} max={0.99} step={0.01} onChange={setTh} format={v => v.toFixed(2)}/>
    <Controls>
      <Btn primary onClick={() => { if (running) return setRunning(false); setShown(0); setRunning(true); }}>{running ? '❚❚ Pause' : '▶ Replay queries'}</Btn>
      <Btn onClick={() => { setRunning(false); setShown(s => Math.min(SCORED.length, s + 1)); }} disabled={shown >= SCORED.length}>Next query</Btn>
    </Controls>
    <Stats>
      <Stat label="Cache hits" value={hits} tone="ok"/>
      <Stat label="False hits" value={fh} tone={fh ? 'bad' : 'ok'}/>
      <Stat label="Sent to LLM" value={vis.length - served}/>
      <Stat label="Precision of hits" value={served ? `${((hits / served) * 100).toFixed(0)}%` : '–'}/>
    </Stats>
  </Frame>;
}
