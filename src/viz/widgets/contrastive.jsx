import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, useTicker, softmax } from '../index';

// InfoNCE on unit vectors in 2-D. With logits sₖ = a·kₖ/τ and softmax weights pₖ:
//   ∂L/∂a = (Σ pₖ kₖ − pos)/τ,  ∂L/∂pos = (p_pos − 1)·a/τ,  ∂L/∂negⱼ = p_negⱼ·a/τ
// Each step is gradient descent followed by re-normalising onto the unit circle.
const ITEMS = [['anchor', 'dog photo', 95], ['positive', '“a dog”', 205], ['negative', '“a car”', 125], ['negative', '“pizza”', 60], ['negative', '“a tree”', 330]];
const init = () => ITEMS.map(([, , d]) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)]);
const dot = (u, v) => u[0] * v[0] + u[1] * v[1], unit = v => { const n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n]; };
const C = 150, R = 110, COLORS = ['var(--accent)', 'var(--s3)', 'var(--s2)', 'var(--s2)', 'var(--s2)'];
function lossOf(V, tau) { const a = V[0], logits = V.slice(1).map(k => dot(a, k) / tau), p = softmax(logits); return { p, loss: -Math.log(Math.max(p[0], 1e-12)) }; }

export default function Contrastive() {
  const [V, setV] = useState(init);
  const [n, setN] = useState(0);
  const [tau, setTau] = useState(0.5);
  const [running, setRunning] = useState(false);
  const { p, loss } = lossOf(V, tau);
  const step = () => {
    setV(cur => {
      const { p: w } = lossOf(cur, tau), a = cur[0], lr = 0.12 * tau, keys = cur.slice(1);
      const ga = [0, 1].map(d => (keys.reduce((s, k, i) => s + w[i] * k[d], 0) - keys[0][d]) / tau);
      const next = cur.map((v, i) => {
        if (i === 0) return unit([v[0] - lr * ga[0], v[1] - lr * ga[1]]);
        const c = (i === 1 ? w[0] - 1 : w[i - 1]) / tau; // gradient coefficient on a
        return unit([v[0] - lr * c * a[0], v[1] - lr * c * a[1]]);
      });
      return next.every(v => Number.isFinite(v[0]) && Number.isFinite(v[1])) ? next : cur;
    });
    setN(x => x + 1);
  };
  useTicker(running, 120, () => { step(); if (n >= 150 || loss < 0.02) { setRunning(false); return false; } });
  const reset = () => { setRunning(false); setV(init()); setN(0); };
  const cosP = dot(V[0], V[1]), cosN = Math.max(...V.slice(2).map(k => dot(V[0], k)));
  const foot = n === 0 ? 'Start: the anchor sits closer to two negatives than to its positive pair. Step training to apply the InfoNCE gradient.'
    : cosP > 0.95 && cosN < 0.3 ? 'Trained: the positive pair has snapped together and the negatives have been pushed away around the circle.'
    : `Training: the anchor is pulled toward its positive (cos ${cosP.toFixed(2)}) and pushed from the nearest negative (cos ${cosN.toFixed(2)}). ${tau < 0.25 ? 'Low τ focuses the push on the hardest negative.' : ''}`;
  return <Frame title="Contrastive learning / InfoNCE" meta={`step ${n}`} foot={foot}>
    <svg viewBox="0 0 300 300" className="viz-svg" style={{ maxWidth: 380, justifySelf: 'center' }} role="img" aria-label="Anchor, positive and negative embeddings on the unit circle">
      <circle cx={C} cy={C} r={R} fill="none" className="viz-axis"/>
      {V.slice(1).map((k, i) => <line key={i} x1={C + V[0][0] * R} y1={C - V[0][1] * R} x2={C + k[0] * R} y2={C - k[1] * R} className={i === 0 ? 'viz-edge on' : 'viz-guide'} style={{ opacity: i === 0 ? 1 : 0.25 + p[i] }}/>)}
      {V.map((v, i) => { const x = C + v[0] * R, y = C - v[1] * R; return <g key={i}>
        <circle cx={x} cy={y} r={i === 0 ? 10 : 8} style={{ fill: COLORS[i], stroke: 'var(--surface)', strokeWidth: 2, transition: 'cx .12s linear, cy .12s linear' }}/>
        <text x={C + v[0] * (R + 26)} y={C - v[1] * (R + 26) + 4} textAnchor="middle" style={{ fill: COLORS[i], fontWeight: 600 }}>{ITEMS[i][1]}</text>
      </g>; })}
    </svg>
    <Slider label="Temperature τ" value={tau} min={0.1} max={1} step={0.05} onChange={setTau} format={v => v.toFixed(2)}/>
    <Controls>
      <Btn primary onClick={() => setRunning(r => !r)}>{running ? '❚❚ Pause' : '▶ Train'}</Btn>
      <Btn onClick={step}>Step once</Btn>
      <Btn onClick={reset}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="InfoNCE loss" value={loss.toFixed(3)}/><Stat label="cos(anchor, positive)" value={cosP.toFixed(2)} tone="ok"/>
      <Stat label="max cos(anchor, negative)" value={cosN.toFixed(2)} tone="bad"/><Stat label="P(pick positive)" value={`${(p[0] * 100).toFixed(0)}%`} tone="on"/>
    </Stats>
  </Frame>;
}
