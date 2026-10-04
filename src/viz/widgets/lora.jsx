import React, { useState } from 'react';
import { Frame, Slider, Seg, Bars, Stats, Stat, rng } from '../index';
import './widgets-w2.css';

// W' = W + B·A with W (d×d) frozen, B (d×r) and A (r×d) trainable.
const TARGETS = { one: { label: 'one matrix', mult: 1 }, qv: { label: 'q,v × 32 layers', mult: 64 }, all: { label: 'q,k,v,o × 32 layers', mult: 128 } };
const fmt = n => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
const T = 8; // toy size for the live ΔW = B·A demo

function rank(M) { // Gaussian elimination with partial pivoting
  const a = M.map(r => r.slice()); let rk = 0;
  for (let c = 0; c < a[0].length && rk < a.length; c++) {
    let p = rk; for (let i = rk + 1; i < a.length; i++) if (Math.abs(a[i][c]) > Math.abs(a[p][c])) p = i;
    if (Math.abs(a[p][c]) < 1e-9) continue;
    [a[rk], a[p]] = [a[p], a[rk]];
    for (let i = rk + 1; i < a.length; i++) { const f = a[i][c] / a[rk][c]; for (let j = c; j < a[0].length; j++) a[i][j] -= f * a[rk][j]; }
    rk++;
  }
  return rk;
}

export default function Lora() {
  const [dPow, setDPow] = useState(12);
  const [r, setR] = useState(8);
  const [target, setTarget] = useState('qv');
  const d = 2 ** dPow, mult = TARGETS[target].mult;
  const full = d * d * mult, lora = 2 * d * r * mult, pct = (lora / full) * 100;
  // Toy: 8×8 ΔW from an 8×r' B and r'×8 A, with r' = min(r, 8).
  const rt = Math.min(r, T), R = rng(3);
  const B = Array.from({ length: T }, () => Array.from({ length: rt }, () => R() * 2 - 1));
  const A = Array.from({ length: rt }, () => Array.from({ length: T }, () => R() * 2 - 1));
  const dW = B.map(br => A[0].map((_, j) => br.reduce((s, b, k) => s + b * A[k][j], 0)));
  const mx = Math.max(...dW.flat().map(Math.abs), 1e-9), rk = rank(dW);
  const S = 200, bw = Math.max(4, (S * r) / d);
  return <Frame title="LoRA / low-rank adapters" meta={`d = ${d}, r = ${r}`}
    foot={`Instead of updating all ${fmt(full)} weights, LoRA trains B and A: ${fmt(lora)} parameters (${pct < 0.01 ? pct.toExponential(1) : pct.toFixed(2)}%). The update B·A can never have rank above r = ${r}${r >= d / 2 ? ' — at this rank LoRA is barely cheaper than full fine-tuning.' : ', which is why it is so small.'}`}>
    <Seg options={Object.keys(TARGETS).map(k => ({ value: k, label: TARGETS[k].label }))} value={target} onChange={setTarget} label="Which matrices get adapters"/>
    <svg viewBox="0 0 620 250" className="viz-svg" role="img" aria-label={`Frozen ${d} by ${d} matrix W plus B (${d}×${r}) times A (${r}×${d})`}>
      <rect x="20" y="20" width={S} height={S} rx="6" style={{ fill: 'var(--surface-3)', stroke: 'var(--line-2)' }}/>
      <text x={20 + S / 2} y={20 + S / 2} textAnchor="middle" className="viz-label">W · frozen</text>
      <text x={20 + S / 2} y={20 + S / 2 + 16} textAnchor="middle" className="viz-label">{d}×{d}</text>
      <text x="250" y="126" textAnchor="middle" style={{ fontSize: 22 }} className="viz-label">+</text>
      <rect x="280" y="20" width={bw} height={S} rx="3" style={{ fill: 'var(--accent)', transition: 'width .4s' }}/>
      <text x={286 + bw} y="40" className="viz-label">B {d}×{r}</text>
      <text x={300 + bw + 40} y="126" textAnchor="middle" style={{ fontSize: 18 }} className="viz-label">·</text>
      <rect x={360 + bw} y="20" width={S} height={bw} rx="3" style={{ fill: 'var(--s2)', transition: 'height .4s, x .4s' }}/>
      <text x={360 + bw} y={36 + bw} className="viz-label">A {r}×{d}</text>
      <text x="20" y="244" className="viz-label">drawn to scale (min 4px): B and A are thin slivers next to W</text>
    </svg>
    <div className="viz-two">
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <Slider label="Matrix size d" value={dPow} min={8} max={13} onChange={setDPow} format={v => `${2 ** v}`}/>
        <Slider label="Rank r" value={r} min={1} max={64} onChange={setR}/>
        <Bars items={[{ label: 'Full fine-tune', value: full, tone: 'bad', note: fmt(full) }, { label: 'LoRA', value: lora, tone: 'on', note: fmt(lora) }]} max={full}/>
      </div>
      <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
        <small className="viz-label">Toy 8×8 update ΔW = B·A with r = {rt} — measured rank {rk}</small>
        <div className="w-lora-delta" role="img" aria-label={`8 by 8 update matrix of rank ${rk}`}>
          {dW.flat().map((v, i) => <span key={i} style={{ background: `color-mix(in srgb, ${v >= 0 ? 'var(--accent)' : 'var(--s2)'} ${Math.round((Math.abs(v) / mx) * 90)}%, var(--surface-3))` }}/>)}
        </div>
      </div>
    </div>
    <Stats>
      <Stat label="Frozen params" value={fmt(full)}/>
      <Stat label="Trainable (2·d·r)" value={fmt(lora)} tone="on"/>
      <Stat label="Trainable %" value={`${pct < 0.01 ? pct.toExponential(1) : pct.toFixed(2)}%`} tone="ok"/>
      <Stat label="Rank of B·A" value={`≤ ${Math.min(r, d)}`}/>
    </Stats>
  </Frame>;
}
