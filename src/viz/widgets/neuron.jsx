import React, { useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat } from '../index';

// One artificial neuron: z = w₁x₁ + w₂x₂ + b, output = f(z).
const ACT = {
  ReLU: { f: z => Math.max(0, z), lo: -1, hi: 6 },
  Sigmoid: { f: z => 1 / (1 + Math.exp(-z)), lo: -0.2, hi: 1.2 },
  Tanh: { f: Math.tanh, lo: -1.2, hi: 1.2 },
};
const sign = w => (w >= 0 ? 'var(--accent)' : 'var(--s2)');

export default function Neuron() {
  const [v, setV] = useState({ x1: 1, x2: -0.5, w1: 0.8, w2: 1.2, b: 0.2 });
  const [act, setAct] = useState('ReLU');
  const set = k => val => setV(s => ({ ...s, [k]: val }));
  const z = v.w1 * v.x1 + v.w2 * v.x2 + v.b, { f, lo, hi } = ACT[act], y = f(z);
  const PX = t => 20 + ((t + 6) / 12) * 260, PY = t => 150 - ((t - lo) / (hi - lo)) * 130;
  const curve = Array.from({ length: 121 }, (_, i) => { const t = -6 + i / 10; return `${i ? 'L' : 'M'}${PX(t).toFixed(1)},${PY(f(t)).toFixed(1)}`; }).join('');
  const zc = Math.max(-6, Math.min(6, z));
  const foot = act === 'ReLU' && z <= 0 ? `z = ${z.toFixed(2)} is negative, so ReLU outputs 0: the neuron is silent and passes no gradient back.`
    : act !== 'ReLU' && Math.abs(z) > 3.5 ? `|z| is large, so ${act.toLowerCase()} is saturated: the curve is flat here and the gradient is nearly 0.`
    : `Weighted sum z = ${v.w1.toFixed(1)}·${v.x1.toFixed(1)} + ${v.w2.toFixed(1)}·${v.x2.toFixed(1)} + ${v.b.toFixed(1)} = ${z.toFixed(2)}; ${act} turns it into ${y.toFixed(3)}.`;
  const edge = (x1, y1, w, label) => <g><line x1={x1} y1={y1} x2="190" y2="110" style={{ stroke: sign(w), strokeWidth: 1 + Math.abs(w) * 2.5, transition: 'stroke-width .2s' }}/>
    <text x={(x1 + 190) / 2} y={(y1 + 110) / 2 - 8} className="viz-label" textAnchor="middle">{label} = {w.toFixed(1)}</text></g>;
  return <Frame title="A single neuron" meta={`${act}(z) = ${y.toFixed(3)}`} foot={foot}>
    <div className="viz-two">
      <svg viewBox="0 0 400 220" className="viz-svg" role="img" aria-label={`Neuron diagram: inputs, weights, bias and ${act} output`}>
        {edge(50, 50, v.w1, 'w₁')}{edge(50, 170, v.w2, 'w₂')}
        <line x1="190" y1="20" x2="190" y2="80" className="viz-edge" strokeDasharray="4 3"/><text x="198" y="30" className="viz-label">b = {v.b.toFixed(1)}</text>
        <line x1="190" y1="110" x2="350" y2="110" className="viz-edge on"/>
        {[[50, 50, v.x1, 'x₁'], [50, 170, v.x2, 'x₂']].map(([x, yy, val, l]) => <g key={l}><circle cx={x} cy={yy} r="24" className="viz-node"/><text x={x} y={yy + 4} textAnchor="middle" style={{ fill: 'var(--ink)' }}>{l}={val.toFixed(1)}</text></g>)}
        <circle cx="190" cy="110" r="30" className="viz-node on"/><text x="190" y="106" textAnchor="middle" style={{ fill: 'var(--ink)' }}>Σ</text><text x="190" y="122" textAnchor="middle">{z.toFixed(2)}</text>
        <rect x="262" y="90" width="56" height="40" rx="8" className="viz-node on"/><text x="290" y="114" textAnchor="middle" style={{ fill: 'var(--ink)' }}>{act}</text>
        <circle cx="370" cy="110" r={8 + Math.min(Math.abs(y), 3) * 4} className="viz-dot alt2"/><text x="370" y="160" textAnchor="middle">{y.toFixed(2)}</text>
      </svg>
      <svg viewBox="0 0 300 170" className="viz-svg" role="img" aria-label={`${act} activation curve with the current z marked`}>
        <line x1="20" x2="280" y1={PY(0)} y2={PY(0)} className="viz-axis"/><line x1={PX(0)} x2={PX(0)} y1="15" y2="155" className="viz-axis"/>
        <path d={curve} className="viz-curve"/>
        <line x1={PX(zc)} x2={PX(zc)} y1={PY(0)} y2={PY(Math.min(hi, f(zc)))} className="viz-guide"/>
        <circle cx={PX(zc)} cy={PY(Math.min(hi, f(zc)))} r="7" className="viz-ball"/>
        <text x="280" y={PY(0) - 6} className="viz-label" textAnchor="end">z</text><text x="20" y="166" className="viz-label">−6</text><text x="280" y="166" className="viz-label" textAnchor="end">+6</text>
      </svg>
    </div>
    <Seg options={Object.keys(ACT)} value={act} onChange={setAct} label="Activation"/>
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
      {[['x1', 'Input x₁'], ['x2', 'Input x₂'], ['w1', 'Weight w₁'], ['w2', 'Weight w₂'], ['b', 'Bias b']].map(([k, l]) => <Slider key={k} label={l} value={v[k]} min={-3} max={3} step={0.1} onChange={set(k)} format={n => n.toFixed(1)}/>)}
    </div>
    <Controls><Btn onClick={() => setV({ x1: 1, x2: 1, w1: -1, w2: -1, b: -0.5 })}>Dead ReLU example</Btn><Btn onClick={() => setV({ x1: 2, x2: 2, w1: 2, w2: 2, b: 1 })}>Saturate</Btn><Btn onClick={() => setV({ x1: 1, x2: -0.5, w1: 0.8, w2: 1.2, b: 0.2 })}>↺ Reset</Btn></Controls>
    <Stats><Stat label="z = w·x + b" value={z.toFixed(3)}/><Stat label={`${act}(z)`} value={y.toFixed(3)} tone="on"/><Stat label="Slope f′(z)" value={((f(z + 1e-4) - f(z - 1e-4)) / 2e-4).toFixed(3)}/></Stats>
  </Frame>;
}
