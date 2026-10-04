import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat } from '../index';

// Two 2-D vectors. Cosine depends only on the angle; dot product and Euclidean
// distance also depend on length.
const C = 160, S = 42, rad = d => (d * Math.PI) / 180;
const PRESETS = [['Same direction', 30, 2, 30, 2], ['Same direction, different length', 30, 0.8, 30, 3], ['Orthogonal', 20, 2, 110, 2], ['Opposite', 30, 2, 210, 2]];

function Arrow({ x, y, color, label }) {
  const len = Math.hypot(x, y) || 1, ux = x / len, uy = y / len, tx = C + x * S, ty = C - y * S;
  const head = `${tx},${ty} ${tx - ux * 11 - uy * 6},${ty + uy * 11 - ux * 6} ${tx - ux * 11 + uy * 6},${ty + uy * 11 + ux * 6}`;
  return <g style={{ color }}>
    <line x1={C} y1={C} x2={tx} y2={ty} stroke="currentColor" strokeWidth="3"/>
    <polygon points={head} fill="currentColor"/>
    <text x={tx + ux * 14} y={ty - uy * 14 + 4} textAnchor="middle" style={{ fill: color, fontWeight: 700 }}>{label}</text>
  </g>;
}

export default function VectorSimilarity() {
  const [v, setV] = useState({ aA: 30, lA: 2, aB: 75, lB: 2.5 });
  const set = key => val => setV(s => ({ ...s, [key]: val }));
  const a = [v.lA * Math.cos(rad(v.aA)), v.lA * Math.sin(rad(v.aA))], b = [v.lB * Math.cos(rad(v.aB)), v.lB * Math.sin(rad(v.aB))];
  const dot = a[0] * b[0] + a[1] * b[1], cos = Math.max(-1, Math.min(1, dot / (v.lA * v.lB)));
  const dist = Math.hypot(a[0] - b[0], a[1] - b[1]), theta = (Math.acos(cos) * 180) / Math.PI;
  const r0 = 28, s0 = rad(v.aA), d0 = (((v.aB - v.aA) % 360) + 540) % 360 - 180, e0 = rad(v.aA + d0);
  const arc = `M${C + r0 * Math.cos(s0)},${C - r0 * Math.sin(s0)} A${r0},${r0} 0 0 ${d0 > 0 ? 0 : 1} ${C + r0 * Math.cos(e0)},${C - r0 * Math.sin(e0)}`;
  const foot = cos > 0.98 && dist > 1 ? 'Same direction, different length: cosine says “identical meaning” while distance says “far apart”.'
    : cos > 0.7 ? 'Pointing the same way: high cosine similarity.' : Math.abs(cos) < 0.15 ? 'Roughly orthogonal: cosine ≈ 0, the vectors share almost nothing.'
    : cos < -0.7 ? 'Pointing opposite ways: cosine is close to −1.' : 'Partly aligned: cosine sits between 0 and 1 (or 0 and −1).';
  return <Frame title="Vector similarity / cosine vs dot vs distance" meta={`angle ${theta.toFixed(0)}°`} foot={foot}>
    <div className="viz-two">
      <svg viewBox="0 0 320 320" className="viz-svg" role="img" aria-label={`Vectors a and b, ${theta.toFixed(0)} degrees apart`}>
        {[-3, -2, -1, 1, 2, 3].map(g => <g key={g}><line x1={C + g * S} x2={C + g * S} y1="20" y2="300" className="viz-grid"/><line y1={C + g * S} y2={C + g * S} x1="20" x2="300" className="viz-grid"/></g>)}
        <line x1="20" x2="300" y1={C} y2={C} className="viz-axis"/><line y1="20" y2="300" x1={C} x2={C} className="viz-axis"/>
        <line x1={C + a[0] * S} y1={C - a[1] * S} x2={C + b[0] * S} y2={C - b[1] * S} className="viz-guide"/>
        <path d={arc} fill="none" stroke="var(--ink-3)" strokeWidth="1.5"/>
        <Arrow x={a[0]} y={a[1]} color="var(--accent)" label="a"/>
        <Arrow x={b[0]} y={b[1]} color="var(--s2)" label="b"/>
      </svg>
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <Slider label="a: angle" value={v.aA} min={0} max={359} onChange={set('aA')} format={x => `${x}°`}/>
        <Slider label="a: length" value={v.lA} min={0.2} max={3.2} step={0.1} onChange={set('lA')} format={x => x.toFixed(1)}/>
        <Slider label="b: angle" value={v.aB} min={0} max={359} onChange={set('aB')} format={x => `${x}°`}/>
        <Slider label="b: length" value={v.lB} min={0.2} max={3.2} step={0.1} onChange={set('lB')} format={x => x.toFixed(1)}/>
      </div>
    </div>
    <Controls>{PRESETS.map(([n, aA, lA, aB, lB]) => <Btn key={n} onClick={() => setV({ aA, lA, aB, lB })}>{n}</Btn>)}</Controls>
    <Stats>
      <Stat label="Cosine similarity" value={cos.toFixed(3)} tone={cos > 0.7 ? 'ok' : cos < -0.3 ? 'bad' : 'on'}/>
      <Stat label="Dot product a·b" value={dot.toFixed(2)}/>
      <Stat label="Euclidean distance" value={dist.toFixed(2)}/>
      <Stat label="|a| · |b|" value={(v.lA * v.lB).toFixed(2)}/>
    </Stats>
  </Frame>;
}
