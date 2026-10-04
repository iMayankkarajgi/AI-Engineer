import React, { useState } from 'react';
import { Frame, Slider, Bars, Stats, Stat, rng } from '../index';

// 8-D toy embeddings built from topic directions plus noise. Neighbours use cosine in the
// full 8-D space; the map is a 2-D PCA projection (power iteration), so it is only approximate.
const D = 8, r = rng(17), noise = s => Array.from({ length: D }, () => (r() - 0.5) * s);
// Topic k: a strong direction at angle 45° + 90°·k in dims 0–1, plus one dimension of its own.
const topic = k => noise(0.5).map((x, i) => x + (i === 0 ? 1.5 * Math.cos(Math.PI / 4 + k * Math.PI / 2) : i === 1 ? 1.5 * Math.sin(Math.PI / 4 + k * Math.PI / 2) : i === 2 + k ? 0.8 : 0));
const TOPICS = { animal: topic(0), vehicle: topic(1), royalty: topic(2), fruit: topic(3) };
const GROUPS = { animal: ['dog', 'cat', 'wolf', 'horse'], fruit: ['apple', 'banana', 'mango', 'cherry'], vehicle: ['car', 'truck', 'bus', 'bike'], royalty: ['king', 'queen', 'prince', 'crown'] };
const WORDS = Object.entries(GROUPS).flatMap(([g, ws]) => ws.map(w => { const e = noise(0.9); return { w, g, v: TOPICS[g].map((x, i) => x + e[i]) }; }));
const J = noise(0.4); WORDS.push({ w: 'jaguar', g: 'mixed', v: TOPICS.animal.map((x, i) => 0.5 * x + 0.5 * TOPICS.vehicle[i] + J[i]) });
const cos = (a, b) => { const d = a.reduce((s, x, i) => s + x * b[i], 0), n = Math.hypot(...a) * Math.hypot(...b); return n ? d / n : 0; };
const PTS = (() => {
  const mean = Array.from({ length: D }, (_, i) => WORDS.reduce((s, w) => s + w.v[i], 0) / WORDS.length), X = WORDS.map(w => w.v.map((x, i) => x - mean[i]));
  const comps = [];
  for (let c = 0; c < 2; c++) {
    let u = Array.from({ length: D }, (_, i) => (i === c ? 1 : 0.3));
    for (let it = 0; it < 200; it++) {
      let nu = Array(D).fill(0);
      X.forEach(x => { const p = x.reduce((s, xi, i) => s + xi * u[i], 0); x.forEach((xi, i) => { nu[i] += p * xi; }); });
      comps.forEach(q => { const d = nu.reduce((s, x, i) => s + x * q[i], 0); nu = nu.map((x, i) => x - d * q[i]); }); // deflate
      const n = Math.hypot(...nu) || 1; u = nu.map(x => x / n);
    }
    comps.push(u);
  }
  const P = X.map(x => comps.map(q => x.reduce((s, xi, i) => s + xi * q[i], 0)));
  const ext = k => [Math.min(...P.map(p => p[k])), Math.max(...P.map(p => p[k]))], [x0, x1] = ext(0), [y0, y1] = ext(1);
  return P.map(([x, y]) => [40 + ((x - x0) / (x1 - x0 || 1)) * 520, 30 + ((y - y0) / (y1 - y0 || 1)) * 280]);
})();
const TONE = { animal: 'var(--accent)', fruit: 'var(--s2)', vehicle: 'var(--s3)', royalty: 'var(--s4)', mixed: 'var(--ink)' };

export default function EmbeddingSpace() {
  const [sel, setSel] = useState(0);
  const [k, setK] = useState(3);
  const sims = WORDS.map((w, i) => ({ i, s: cos(WORDS[sel].v, w.v) })).filter(x => x.i !== sel).sort((a, b) => b.s - a.s);
  const nn = sims.slice(0, k), nnSet = new Set(nn.map(x => x.i)), me = WORDS[sel];
  const sameGroup = nn.filter(x => WORDS[x.i].g === me.g).length;
  const foot = me.g === 'mixed' ? '“jaguar” is both an animal and a car brand, so its vector sits between the two clusters and its neighbours come from both.'
    : `The ${k} nearest neighbours of “${me.w}” by cosine similarity — ${sameGroup} of ${k} share its topic (${me.g}). Words that mean similar things point in similar directions.`;
  return <Frame title="Embedding space / nearest neighbours" meta={`“${me.w}”`} foot={foot}>
    <svg viewBox="0 0 600 340" className="viz-svg" role="img" aria-label={`2-D map of ${WORDS.length} word embeddings; ${me.w} selected`}>
      {nn.map(({ i }) => <line key={i} x1={PTS[sel][0]} y1={PTS[sel][1]} x2={PTS[i][0]} y2={PTS[i][1]} className="viz-edge on viz-fade"/>)}
      {WORDS.map((w, i) => { const [x, y] = PTS[i], on = i === sel || nnSet.has(i); return <g key={w.w} onClick={() => setSel(i)} style={{ cursor: 'pointer', opacity: on ? 1 : 0.45, transition: 'opacity .3s' }}>
        <circle cx={x} cy={y} r={i === sel ? 10 : 7} style={{ fill: TONE[w.g], stroke: i === sel ? 'var(--ink)' : 'var(--surface)', strokeWidth: 2, transition: 'r .3s' }}/>
        <text x={x} y={y - 13} textAnchor="middle" style={{ fill: 'var(--ink)', fontWeight: on ? 700 : 400 }}>{w.w}</text>
      </g>; })}
    </svg>
    <div className="viz-row">{WORDS.map((w, i) => <button key={w.w} type="button" className={'viz-chip' + (i === sel ? ' on' : '')} aria-pressed={i === sel} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>{w.w}</button>)}</div>
    <Slider label="Neighbours k" value={k} min={1} max={6} onChange={setK}/>
    <Bars items={nn.map(({ i, s }) => ({ label: WORDS[i].w, value: Math.max(0, s), tone: WORDS[i].g === me.g ? 'on' : '', note: s.toFixed(3) }))} max={1}/>
    <Stats><Stat label="Top neighbour" value={WORDS[nn[0].i].w} tone="on"/><Stat label="Its cosine" value={nn[0].s.toFixed(3)}/><Stat label="Least similar" value={`${WORDS[sims[sims.length - 1].i].w} (${sims[sims.length - 1].s.toFixed(2)})`}/></Stats>
  </Frame>;
}
