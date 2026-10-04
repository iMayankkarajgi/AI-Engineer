import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, useTicker } from '../index';

// Reference SVG widget: a ball steps down L(w) = (w − 3)² + 1 using w ← w − η·L'(w).
const L = w => (w - 3) ** 2 + 1, dL = w => 2 * (w - 3);
const W0 = -1.5, X = w => 40 + ((w + 2) / 10) * 520, Y = l => 250 - Math.min(l, 30) * 7.5;

export default function GradientDescent() {
  const [lr, setLr] = useState(0.1);
  const [path, setPath] = useState([W0]);
  const [running, setRunning] = useState(false);
  const w = path[path.length - 1];
  const step = () => setPath(p => { const cur = p[p.length - 1], next = cur - lr * dL(cur); return p.length > 60 || !Number.isFinite(next) || Math.abs(next) > 1e6 ? p : [...p, next]; });
  useTicker(running, 450, () => { step(); if (path.length > 40 || Math.abs(dL(w)) < 1e-3 || Math.abs(w) > 50) { setRunning(false); return false; } });
  const reset = v => { setRunning(false); setPath([W0]); if (v !== undefined) setLr(v); };
  const curve = Array.from({ length: 121 }, (_, i) => { const x = -2 + i / 12; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(L(x)).toFixed(1)}`; }).join('');
  const state = Math.abs(w) > 12 ? 'Diverging: each step overshoots further.' : lr >= 1 ? 'Oscillating or diverging: the step is too large.' : lr > 0.6 ? 'Overshooting: bouncing across the valley.' : lr < 0.03 ? 'Too slow: tiny steps barely move.' : 'Converging smoothly toward the minimum at w = 3.';
  return <Frame title="Gradient descent / one weight" meta={`step ${path.length - 1}`} foot={state}>
    <svg viewBox="0 0 600 270" className="viz-svg" role="img" aria-label="Loss curve with gradient descent steps">
      <line x1="40" x2="560" y1="250" y2="250" className="viz-axis"/>
      <path d={curve} className="viz-curve"/>
      <line x1={X(3)} x2={X(3)} y1="20" y2="250" className="viz-guide"/>
      <text x={X(3) + 6} y="32" className="viz-label">minimum</text>
      {path.slice(1).map((p, i) => Math.abs(p) < 12 && Math.abs(path[i]) < 12 && <line key={i} x1={X(path[i])} y1={Y(L(path[i]))} x2={X(p)} y2={Y(L(p))} className="viz-trail"/>)}
      {Math.abs(w) < 12 && <circle cx={X(w)} cy={Y(L(w))} r="9" className="viz-ball"/>}
      <text x="40" y="266" className="viz-label">w = −2</text><text x="560" y="266" className="viz-label" textAnchor="end">w = 8</text>
    </svg>
    <Slider label="Learning rate η" value={lr} min={0.01} max={1.1} step={0.01} onChange={v => reset(v)} format={v => v.toFixed(2)}/>
    <Controls>
      <Btn primary onClick={() => setRunning(r => !r)}>{running ? '❚❚ Pause' : '▶ Run'}</Btn>
      <Btn onClick={step}>Step once</Btn>
      <Btn onClick={() => reset()}>↺ Reset</Btn>
      {[0.02, 0.1, 0.9, 1.05].map(v => <Btn key={v} onClick={() => reset(v)}>η = {v}</Btn>)}
    </Controls>
    <Stats><Stat label="Weight w" value={Number.isFinite(w) ? w.toFixed(3) : '∞'}/><Stat label="Loss L(w)" value={Number.isFinite(L(w)) ? L(w).toFixed(3) : '∞'}/><Stat label="Gradient dL/dw" value={Number.isFinite(dL(w)) ? dL(w).toFixed(3) : '∞'}/></Stats>
  </Frame>;
}
