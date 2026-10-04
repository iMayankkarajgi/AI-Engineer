import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Bars, Stats, Stat } from '../index';

// RoPE on one 2-d pair: rotate q by m·θ and k by n·θ. q_m · k_n depends only on m − n.
const Q0 = [1, 0.35], K0 = [0.75, 0.6];
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const ang = v => Math.atan2(v[1], v[0]);
const CX = 140, CY = 130, RAD = 95;

function Arrow({ v, base, cls, label, deg }) {
  // Draw the unrotated vector, then rotate the group so the CSS transition animates the turn.
  const [x, y] = [CX + RAD * base[0] / Math.hypot(...base), CY - RAD * base[1] / Math.hypot(...base)];
  const u = v.map(c => c / Math.hypot(...v)), lx = CX + (RAD + 16) * u[0], ly = CY - (RAD + 16) * u[1];
  return <>
    <g style={{ transform: `rotate(${-deg}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: 'transform .45s cubic-bezier(.2,.8,.2,1)' }}>
      <line x1={CX} y1={CY} x2={x} y2={y} className={'viz-curve ' + cls}/>
      <circle cx={x} cy={y} r="6" className={'viz-dot ' + cls}/>
    </g>
    <text x={lx} y={ly + 4} textAnchor={u[0] > 0.3 ? 'start' : u[0] < -0.3 ? 'end' : 'middle'} className="viz-label">{label}</text>
  </>;
}

export default function Rope() {
  const [m, setM] = useState(5);
  const [n, setN] = useState(2);
  const [theta, setTheta] = useState(0.3);
  const q = rot(Q0, m * theta), k = rot(K0, n * theta);
  const d = dot(q, k), rel = m - n;
  const shifts = [0, 3, 7, 12];
  const byRel = Array.from({ length: 9 }, (_, i) => rel - 4 + i).map(r => ({ r, v: dot(rot(Q0, r * theta), K0) }));
  const toDeg = a => (a * 180) / Math.PI;
  const shift = s => { const lo = Math.min(m, n); const c = Math.max(-lo, Math.min(s, 30 - Math.max(m, n))); setM(m + c); setN(n + c); };
  return <Frame title="RoPE / rotary position embeddings" meta={`m − n = ${rel}`}
    foot={`Query at position ${m} is turned ${toDeg(m * theta).toFixed(0)}°, key at ${n} is turned ${toDeg(n * theta).toFixed(0)}°. Only the gap between them (${rel} positions → ${toDeg(rel * theta).toFixed(0)}°) changes the dot product, so moving both together leaves it at ${d.toFixed(3)}.`}>
    <div className="viz-two">
      <svg viewBox="-30 0 340 260" className="viz-svg" role="img" aria-label={`Query rotated to position ${m}, key rotated to position ${n}; dot product ${d.toFixed(2)}`}>
        <circle cx={CX} cy={CY} r={RAD} fill="none" className="viz-grid"/>
        <line x1={CX - RAD - 10} x2={CX + RAD + 10} y1={CY} y2={CY} className="viz-axis"/>
        <line y1={CY - RAD - 10} y2={CY + RAD + 10} x1={CX} x2={CX} className="viz-axis"/>
        <Arrow v={q} base={Q0} deg={toDeg(m * theta)} cls="" label={`q @ ${m}`}/>
        <Arrow v={k} base={K0} deg={toDeg(n * theta)} cls="alt" label={`k @ ${n}`}/>
        <text x="8" y="252" className="viz-label">angle q→k: {(((toDeg(ang(q) - ang(k)) % 360) + 540) % 360 - 180).toFixed(0)}°</text>
      </svg>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <Slider label="Query position m" value={m} min={0} max={30} onChange={setM}/>
        <Slider label="Key position n" value={n} min={0} max={30} onChange={setN}/>
        <Slider label="Frequency θ (radians per position)" value={theta} min={0.05} max={1} step={0.05} onChange={setTheta} format={v => v.toFixed(2)}/>
        <Controls>
          <Btn primary onClick={() => shift(3)}>Shift both +3</Btn>
          <Btn onClick={() => shift(-3)}>Shift both −3</Btn>
          <Btn onClick={() => { setM(5); setN(2); }}>↺ Reset</Btn>
        </Controls>
      </div>
    </div>
    <div className="viz-two">
      <div style={{ display: 'grid', gap: 6 }}>
        <small className="viz-label">Same gap, different absolute positions</small>
        <Bars items={shifts.map(s => ({ label: `m=${m + s}, n=${n + s}`, value: dot(rot(Q0, (m + s) * theta), rot(K0, (n + s) * theta)), tone: s === 0 ? 'on' : '', note: dot(rot(Q0, (m + s) * theta), rot(K0, (n + s) * theta)).toFixed(3) }))} max={1.3}/>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <small className="viz-label">Dot product vs relative distance m − n</small>
        <Bars items={byRel.map(({ r, v }) => ({ label: `Δ = ${r}`, value: v, tone: r === rel ? 'on' : v < 0 ? 'bad' : '', note: v.toFixed(3) }))} max={1.3}/>
      </div>
    </div>
    <Stats><Stat label="q · k" value={d.toFixed(3)} tone="on"/><Stat label="Relative distance" value={rel}/><Stat label="Rotation gap" value={`${toDeg(rel * theta).toFixed(0)}°`}/></Stats>
  </Frame>;
}
