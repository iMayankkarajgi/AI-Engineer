import React, { useRef, useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, useTicker, rng } from '../index';
import './widgets-w1.css';

// Tabular Q-learning: Q(s,a) ← Q(s,a) + α·(r + γ·maxₐ' Q(s',a') − Q(s,a)), ε-greedy exploration.
const N = 5, START = 0, GOAL = 24, PITS = new Set([8, 20]), WALLS = new Set([6, 11, 18]);
const ALPHA = 0.5, GAMMA = 0.9, MAX_STEPS = 50, MOVES = [[-1, 0], [0, 1], [1, 0], [0, -1]], ARROWS = '↑→↓←';
const fresh = () => ({ Q: new Float64Array(N * N * 4), s: START, ep: 0, epR: 0, steps: 0, hist: [], r: rng(11) });
function move(s, a) {
  const r = Math.floor(s / N) + MOVES[a][0], c = (s % N) + MOVES[a][1], n = r * N + c;
  return r < 0 || r >= N || c < 0 || c >= N || WALLS.has(n) ? s : n;
}
const best = (Q, s, rand) => { let m = -Infinity, arg = []; for (let a = 0; a < 4; a++) { const q = Q[s * 4 + a]; if (q > m + 1e-12) { m = q; arg = [a]; } else if (Math.abs(q - m) <= 1e-12) arg.push(a); } return arg[rand ? Math.floor(rand() * arg.length) : 0]; };
const maxQ = (Q, s) => Math.max(Q[s * 4], Q[s * 4 + 1], Q[s * 4 + 2], Q[s * 4 + 3]);

export default function RlGridworld() {
  const sim = useRef(null); if (!sim.current) sim.current = fresh();
  const [, bump] = useState(0);
  const [eps, setEps] = useState(0.2);
  const [speed, setSpeed] = useState('step');
  const [running, setRunning] = useState(false);
  const learn = () => {
    const m = sim.current, a = m.r() < eps ? Math.floor(m.r() * 4) : best(m.Q, m.s, m.r);
    const s2 = move(m.s, a), done = s2 === GOAL || PITS.has(s2), rew = s2 === GOAL ? 10 : PITS.has(s2) ? -10 : -1;
    m.Q[m.s * 4 + a] += ALPHA * (rew + (done ? 0 : GAMMA * maxQ(m.Q, s2)) - m.Q[m.s * 4 + a]);
    m.epR += rew; m.steps++; m.s = s2;
    if (done || m.steps >= MAX_STEPS) { m.hist.push(m.epR); if (m.hist.length > 80) m.hist.shift(); m.ep++; m.epR = 0; m.steps = 0; m.s = START; return true; }
    return false;
  };
  const tick = () => { if (speed === 'step') learn(); else for (let i = 0; i < 400 && !learn(); i++); bump(x => x + 1); };
  useTicker(running, speed === 'step' ? 140 : 220, () => { tick(); if (sim.current.ep >= 400) { setRunning(false); return false; } });
  const m = sim.current, values = Array.from({ length: N * N }, (_, s) => maxQ(m.Q, s)), vmax = Math.max(1, ...values.map(Math.abs));
  // Follow the greedy policy from the start to see whether it has learned a route.
  let g = START, path = 0; const seen = new Set();
  while (g !== GOAL && !PITS.has(g) && !seen.has(g) && path < 30) { seen.add(g); g = move(g, best(m.Q, g)); path++; }
  const solved = g === GOAL, h = m.hist, lo = Math.min(-20, ...h), hi = 10;
  const HY = v => 90 - ((v - lo) / (hi - lo)) * 80, line = h.map((v, i) => `${i ? 'L' : 'M'}${(10 + (i / Math.max(h.length - 1, 1)) * 280).toFixed(1)},${HY(v).toFixed(1)}`).join('');
  const reset = () => { setRunning(false); sim.current = fresh(); bump(x => x + 1); };
  const foot = m.ep === 0 ? 'The agent knows nothing yet: every Q-value is 0, so it wanders. Press Play to let it learn from rewards.'
    : solved ? `The greedy policy now reaches the goal in ${path} steps. ${eps > 0.3 ? 'High ε keeps it exploring, so episode rewards stay noisy.' : 'Low ε lets it mostly exploit what it learned.'}`
    : 'Still learning: value is spreading backwards from the goal one update at a time. Arrows show the current best action.';
  return <Frame title="Q-learning / grid world" meta={`episode ${m.ep}`} foot={foot}>
    <div className="viz-two">
      <div className="viz-grid-cells w-rl-gridworld-grid" role="img" aria-label="5 by 5 grid world with learned policy arrows">
        {values.map((v, s) => {
          const kind = WALLS.has(s) ? 'wall' : s === GOAL ? 'ok' : PITS.has(s) ? 'bad' : '';
          const tint = !kind && v !== 0 ? { background: `color-mix(in srgb, ${v > 0 ? 'var(--accent)' : 'var(--bad)'} ${Math.round((Math.abs(v) / vmax) * 55)}%, var(--surface-3))` } : undefined;
          return <div key={s} className={'viz-cell ' + kind} style={tint}>
            {s === GOAL ? '★' : PITS.has(s) ? '✕' : !kind && maxQ(m.Q, s) !== 0 ? ARROWS[best(m.Q, s)] : s === START ? 'S' : ''}
            {!kind && v !== 0 && <span className="w-rl-gridworld-q">{v.toFixed(1)}</span>}
            {m.s === s && <span className="w-rl-gridworld-agent"/>}
          </div>;
        })}
      </div>
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <svg viewBox="0 0 300 100" className="viz-svg" role="img" aria-label="Total reward per episode">
          <line x1="10" x2="290" y1={HY(0)} y2={HY(0)} className="viz-guide"/><line x1="10" x2="290" y1="90" y2="90" className="viz-axis"/>
          {h.length > 1 && <path d={line} className="viz-curve" style={{ strokeWidth: 1.8 }}/>}
          <text x="10" y="8" className="viz-label">reward per episode (last {h.length})</text>
        </svg>
        <Slider label="Exploration ε" value={eps} min={0} max={1} step={0.05} onChange={setEps} format={v => v.toFixed(2)}/>
        <Seg options={[{ value: 'step', label: 'One move / tick' }, { value: 'fast', label: 'One episode / tick' }]} value={speed} onChange={setSpeed} label="Speed"/>
      </div>
    </div>
    <Controls>
      <Btn primary onClick={() => setRunning(r => !r)}>{running ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={tick}>Step</Btn>
      <Btn onClick={reset}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Episodes" value={m.ep}/><Stat label="Last reward" value={h.length ? h[h.length - 1] : '—'}/>
      <Stat label="Greedy route" value={solved ? `${path} steps` : 'not yet'} tone={solved ? 'ok' : 'bad'}/><Stat label="α / γ" value={`${ALPHA} / ${GAMMA}`}/>
    </Stats>
  </Frame>;
}
