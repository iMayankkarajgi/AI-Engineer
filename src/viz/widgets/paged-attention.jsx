import React, { useState } from 'react';
import { Frame, Controls, Btn, Stats, Stat, useTicker, rng } from '../index';
import './widgets-w2.css';

// 48 KV slots. Contiguous: reserve MAXLEN adjacent slots per request up front (final length unknown).
// Paged (vLLM-style): hand out 4-slot blocks on demand, anywhere in memory.
const M = 48, MAXLEN = 12, B = 4, NB = M / B, TMAX = 80;
const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const R = rng(9);
const REQS = []; { let at = 0; for (let i = 0; i < 18; i++) { at += Math.floor(R() * 2); const prompt = 2 + Math.floor(R() * 4); REQS.push({ id: i, at, prompt, total: Math.min(MAXLEN, prompt + 2 + Math.floor(R() * 7)) }); } }

function simulate(paged, T) {
  const mem = Array(paged ? NB : M).fill(-1), active = [], queue = [];
  let ri = 0, done = 0, waited = 0, preempted = 0;
  for (let t = 0; t <= T; t++) {
    for (let i = 0; i < active.length; i++) { // 1. every running request generates one token
      const r = active[i];
      if (r.len >= r.total) continue;
      if (paged && r.len === r.blocks.length * B) {
        if (mem.indexOf(-1) < 0) { // out of blocks: preempt the newest other request (vLLM recomputes it later)
          const j = active.length - 1 === i ? i - 1 : active.length - 1;
          if (j < 0) continue;
          const v = active[j]; v.blocks.forEach(b => { mem[b] = -1; }); active.splice(j, 1);
          queue.unshift(REQS[v.id]); preempted++; if (j < i) i--;
        }
        const f = mem.indexOf(-1); mem[f] = r.id; r.blocks.push(f);
      }
      r.len++;
    }
    for (let i = active.length - 1; i >= 0; i--) if (active[i].len >= active[i].total) { // 2. finished → free memory
      const id = active[i].id; mem.forEach((o, s) => { if (o === id) mem[s] = -1; }); active.splice(i, 1); done++;
    }
    while (ri < REQS.length && REQS[ri].at <= t) queue.push(REQS[ri++]); // 3. arrivals
    while (queue.length) { // 4. admit in FIFO order while memory allows
      const q = queue[0];
      if (paged) {
        const need = Math.ceil(q.prompt / B), free = mem.map((o, s) => (o < 0 ? s : -1)).filter(s => s >= 0);
        if (free.length < need + 1) break; // keep one block of headroom for growth
        const blocks = free.slice(0, need); blocks.forEach(s => { mem[s] = q.id; });
        active.push({ ...q, blocks, len: q.prompt });
      } else {
        let start = -1;
        for (let s = 0; s + MAXLEN <= M && start < 0; s++) if (mem.slice(s, s + MAXLEN).every(o => o < 0)) start = s;
        if (start < 0) break;
        for (let s = start; s < start + MAXLEN; s++) mem[s] = q.id;
        active.push({ ...q, start, len: q.prompt });
      }
      queue.shift();
    }
    waited += queue.length;
  }
  const slots = Array.from({ length: M }, (_, s) => {
    const owner = paged ? mem[Math.floor(s / B)] : mem[s];
    if (owner < 0) return null;
    const r = active.find(a => a.id === owner);
    const pos = paged ? r.blocks.indexOf(Math.floor(s / B)) * B + (s % B) : s - r.start;
    return { id: owner, used: pos < r.len };
  });
  const used = slots.filter(c => c && c.used).length, reserved = slots.filter(c => c && !c.used).length;
  return { slots, used, reserved, running: active.length, queue: queue.length, done, waited, preempted };
}

function Side({ title, s, paged }) {
  return <div className="w-paged-attention-side">
    <small>{title}</small>
    <div className="w-paged-attention-mem" role="img" aria-label={`${title}: ${s.used} slots hold tokens, ${s.reserved} reserved but empty, ${M - s.used - s.reserved} free`}>
      {s.slots.map((c, i) => <span key={i} style={{ background: c ? (c.used ? COLORS[c.id % 4] : `color-mix(in srgb, ${COLORS[c.id % 4]} 22%, var(--surface-3))`) : undefined, marginRight: paged && i % B === B - 1 && i % 12 !== 11 ? 3 : 0 }}>{c && c.used ? String.fromCharCode(65 + c.id) : ''}</span>)}
    </div>
    <Stats>
      <Stat label="Holding tokens" value={`${Math.round((s.used / M) * 100)}%`} tone="on"/>
      <Stat label="Reserved, empty" value={s.reserved} tone={s.reserved > 8 ? 'bad' : ''}/>
      <Stat label="Running / waiting" value={`${s.running} / ${s.queue}`}/>
      <Stat label="Finished" value={`${s.done} / ${REQS.length}`} tone={s.done === REQS.length ? 'ok' : ''}/>
      {paged && <Stat label="Preempted" value={s.preempted}/>}
    </Stats>
  </div>;
}

export default function PagedAttention() {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const c = simulate(false, t), p = simulate(true, t);
  const finished = (c.done === REQS.length && p.done === REQS.length) || t >= TMAX;
  useTicker(running, 600, () => { if (finished) { setRunning(false); return false; } setT(v => Math.min(v + 1, TMAX)); });
  const foot = t === 0 ? 'Letters are requests; solid cells hold real tokens, pale cells are reserved but still empty. Press play.'
    : finished ? `All done. Contiguous allocation finished at step ${simTime(false)}, paged at step ${simTime(true)}; requests spent ${c.waited} vs ${p.waited} request-steps waiting in the queue.`
    : `Contiguous memory wastes ${c.reserved} slots on reservations (and gaps too small for a new ${MAXLEN}-slot run), so ${c.queue} request${c.queue === 1 ? '' : 's'} wait. Paged blocks waste at most ${B - 1} slots per request: ${p.reserved} empty, ${p.queue} waiting. When blocks run out, the newest request is preempted and recomputed later.`;
  return <Frame title="PagedAttention / KV memory allocation" meta={`step ${t}`} foot={foot}>
    <div className="viz-two">
      <Side title={`Contiguous (reserve ${MAXLEN} slots each)`} s={c}/>
      <Side title={`Paged (${B}-slot blocks on demand)`} s={p} paged/>
    </div>
    <Controls>
      <Btn primary onClick={() => { if (finished) setT(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Run'}</Btn>
      <Btn onClick={() => { setRunning(false); setT(v => Math.min(v + 1, TMAX)); }} disabled={finished}>Step</Btn>
      <Btn onClick={() => { setRunning(false); setT(0); }}>↺ Reset</Btn>
    </Controls>
  </Frame>;
}

function simTime(paged) { for (let t = 0; t <= TMAX; t++) if (simulate(paged, t).done === REQS.length) return t; return `>${TMAX}`; }
