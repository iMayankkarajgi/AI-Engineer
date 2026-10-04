import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, useTicker, rng } from '../index';
import './widgets-w3.css';

// 14 requests (all queued at t = 0) with different output lengths, in decode steps.
const REQS = (() => { const r = rng(11); return Array.from({ length: 14 }, (_, i) => ({ id: i + 1, len: 2 + Math.floor(r() * 13) })); })();
const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];

// Static: fill all slots, wait for the longest request, then load the next batch.
// Continuous: whenever a slot frees up, the next queued request takes it immediately.
function schedule(mode, slots) {
  const jobs = [];
  if (mode === 'static') {
    let t = 0;
    for (let i = 0; i < REQS.length; i += slots) {
      const batch = REQS.slice(i, i + slots), span = Math.max(...batch.map(b => b.len));
      batch.forEach((b, j) => jobs.push({ ...b, slot: j, start: t, end: t + b.len, batchEnd: t + span }));
      t += span;
    }
    return { jobs, end: t };
  }
  const free = Array(slots).fill(0);
  for (const b of REQS) {
    const s = free.indexOf(Math.min(...free));
    jobs.push({ ...b, slot: s, start: free[s], end: free[s] + b.len, batchEnd: free[s] + b.len });
    free[s] += b.len;
  }
  return { jobs, end: Math.max(...free) };
}

export default function ContinuousBatching() {
  const [mode, setMode] = useState('static');
  const [slots, setSlots] = useState(4);
  const [t, setT] = useState(1e9); // start fully drawn
  const [running, setRunning] = useState(false);
  const plan = useMemo(() => schedule(mode, slots), [mode, slots]);
  const alt = useMemo(() => schedule(mode === 'static' ? 'continuous' : 'static', slots), [mode, slots]);
  const now = Math.min(t, plan.end), span = Math.max(plan.end, alt.end);
  useTicker(running, 80, () => { if (now >= plan.end) { setRunning(false); return false; } setT(Math.min(plan.end, now + 0.5)); });
  const play = () => { if (running) return setRunning(false); if (now >= plan.end) setT(0); setRunning(true); };
  const X = v => 60 + (v / span) * 525, rowH = 28, H = slots * rowH + 30;
  const busy = plan.jobs.reduce((s, j) => s + Math.max(0, Math.min(now, j.end) - j.start), 0);
  const util = now > 0 ? busy / (slots * now) : 0;
  const waste = plan.jobs.reduce((s, j) => s + Math.max(0, Math.min(now, j.batchEnd) - j.end), 0);
  const done = plan.jobs.filter(j => j.end <= now).length;
  const avgDone = plan.jobs.reduce((s, j) => s + j.end, 0) / REQS.length;
  const foot = mode === 'static'
    ? `Static batching: each batch waits for its longest request, so finished slots sit idle (red gaps, ${waste.toFixed(0)} slot-steps wasted so far) while requests queue.`
    : 'Continuous batching: the moment a request emits its last token, the scheduler drops the next queued request into that slot, so the GPU never idles.';
  return <Frame title="Continuous batching / GPU slot timeline" meta={`${mode} · step ${now.toFixed(1)} / ${plan.end}`} foot={foot}>
    <Seg options={[{ value: 'static', label: 'Static batching' }, { value: 'continuous', label: 'Continuous batching' }]} value={mode} onChange={m => { setMode(m); setRunning(false); setT(0); setRunning(true); }} label="Batching mode"/>
    <svg viewBox={`0 0 600 ${H}`} className="viz-svg" role="img" aria-label={`Timeline of ${slots} GPU slots processing ${REQS.length} requests with ${mode} batching`}>
      {Array.from({ length: slots }, (_, s) => <g key={s}>
        <text x="4" y={s * rowH + 18} className="viz-label">slot {s + 1}</text>
        <line x1="60" x2="585" y1={s * rowH + 26} y2={s * rowH + 26} className="viz-grid"/>
      </g>)}
      {plan.jobs.map(j => {
        const w = Math.max(0, Math.min(now, j.end) - j.start), idle = Math.max(0, Math.min(now, j.batchEnd) - j.end);
        return <g key={j.id} className="w-continuous-batching-job" opacity={now >= j.start ? 1 : 0}>
          <rect x={X(j.start)} y={j.slot * rowH + 4} width={X(j.start + w) - X(j.start)} height="20" rx="4" fill={COLORS[j.id % 4]}/>
          {w > 1.5 && <text x={X(j.start) + 4} y={j.slot * rowH + 18} fill="#fff" style={{ fill: '#fff' }}>R{j.id}</text>}
          {idle > 0 && <rect x={X(j.end)} y={j.slot * rowH + 4} width={X(j.end + idle) - X(j.end)} height="20" rx="4" fill="var(--bad)" opacity=".18" stroke="var(--bad)" strokeDasharray="3 3"/>}
        </g>;
      })}
      <line x1={X(now)} x2={X(now)} y1="0" y2={slots * rowH + 4} className="viz-guide"/>
      <text x="60" y={H - 4} className="viz-label">t = 0</text><text x="585" y={H - 4} className="viz-label" textAnchor="end">{span} decode steps</text>
    </svg>
    <Slider label="GPU slots (batch size)" value={slots} min={2} max={6} onChange={v => { setSlots(v); setRunning(false); setT(1e9); }}/>
    <Controls>
      <Btn primary onClick={play}>{running ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={() => { setRunning(false); setT(x => Math.min(plan.end, Math.min(x, plan.end) + 1)); }}>Step</Btn>
      <Btn onClick={() => { setRunning(false); setT(0); }}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Finished" value={`${done} / ${REQS.length}`}/>
      <Stat label="GPU utilisation" value={`${(util * 100).toFixed(0)}%`} tone={util > 0.9 ? 'ok' : util < 0.75 && now > 0 ? 'bad' : ''}/>
      <Stat label={`Total time (${mode})`} value={`${plan.end} steps`}/>
      <Stat label={`vs ${mode === 'static' ? 'continuous' : 'static'}`} value={`${alt.end} steps`} tone="on"/>
      <Stat label="Avg completion" value={`${avgDone.toFixed(1)} steps`}/>
    </Stats>
  </Frame>;
}
