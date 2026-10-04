import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, useTicker } from '../index';
import './widgets-w3.css';

// Each output cell C[i][j] = Σ_k A[i][k]·B[k][j] is one independent job.
// CPU: 4 fast cores, 1 time unit per cell. GPU: many slow cores, 4 units per cell, plus 3 units launch/transfer overhead.
const CPU_CORES = 4, CPU_T = 1, GPU_T = 4, LAUNCH = 3;
const finish = (idx, cores, per, delay) => delay + (Math.floor(idx / cores) + 1) * per;

function Grid({ n, title, total, t, cores, per, delay, C }) {
  return <div>
    <div className="w-gpu-parallel-title"><span>{title}</span><span>{Math.min(t, total)}/{total} units</span></div>
    <div className="viz-grid-cells w-gpu-parallel-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="img" aria-label={`${title}: ${n}×${n} output matrix filling in`}>
      {C.map((v, i) => { const end = finish(i, cores, per, delay), st = end - per;
        const cls = t >= end ? ' on' : t >= st && t >= delay ? ' alt' : '';
        return <div key={i} className={'viz-cell' + cls}>{n <= 8 && t >= end ? v : ''}</div>; })}
    </div>
  </div>;
}

export default function GpuParallel() {
  const [n, setN] = useState(8);
  const [cores, setCores] = useState('64');
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const g = Number(cores), cells = n * n;
  const C = useMemo(() => Array.from({ length: cells }, (_, idx) => { const i = Math.floor(idx / n), j = idx % n;
    let s = 0; for (let k = 0; k < n; k++) s += ((i + k) % 3) * ((k * j + 1) % 4); return s; }), [n, cells]);
  const cpuEnd = finish(cells - 1, CPU_CORES, CPU_T, 0), gpuEnd = finish(cells - 1, g, GPU_T, LAUNCH);
  const end = Math.max(cpuEnd, gpuEnd);
  useTicker(running, 110, () => { if (t >= end) { setRunning(false); return false; } setT(t + 1); });
  const reset = () => { setRunning(false); setT(0); };
  const cpuDone = Math.min(cells, Math.floor(t / CPU_T) * CPU_CORES), gpuDone = t < LAUNCH ? 0 : Math.min(cells, Math.floor((t - LAUNCH) / GPU_T) * g);
  const speed = cpuEnd / gpuEnd;
  const foot = t === 0 ? `${cells} independent dot products of length ${n}. Press play to race a 4-core CPU against a ${g}-core GPU.`
    : t < LAUNCH ? 'The GPU is still copying data and launching its kernel; the CPU has already started.'
    : t >= end ? (speed > 1 ? `GPU wins ${speed.toFixed(1)}×: its cores are 4× slower, but ${g} of them work in parallel, so the whole matrix fills in a few waves.` : `CPU wins: with only ${cells} cells the GPU's launch overhead and slow cores outweigh its parallelism.`)
    : `GPU computes up to ${g} cells per wave; the CPU only ${CPU_CORES} at a time, but each one faster.`;
  return <Frame title="CPU vs GPU / parallel matrix multiply" meta={`${n}×${n} · t = ${Math.min(t, end)}`} foot={foot}>
    <div className="viz-two">
      <Grid n={n} title={`CPU · ${CPU_CORES} fast cores`} total={cpuEnd} t={t} cores={CPU_CORES} per={CPU_T} delay={0} C={C}/>
      <Grid n={n} title={`GPU · ${g} simple cores`} total={gpuEnd} t={t} cores={g} per={GPU_T} delay={LAUNCH} C={C}/>
    </div>
    <div className="viz-two">
      <Slider label="Matrix size n" value={n} min={2} max={16} onChange={v => { setN(v); reset(); }} format={v => `${v}×${v}`}/>
      <div><div style={{ fontSize: '.85rem', color: 'var(--ink-2)', marginBottom: 6 }}>GPU cores</div>
        <Seg options={['16', '64', '256']} value={cores} onChange={v => { setCores(v); reset(); }} label="GPU cores"/></div>
    </div>
    <Controls>
      <Btn primary onClick={() => { if (t >= end) setT(0); setRunning(r => !r || t >= end); }}>{running ? '❚❚ Pause' : '▶ Run'}</Btn>
      <Btn onClick={() => { setRunning(false); setT(x => Math.min(end, x + 1)); }} disabled={t >= end}>Step</Btn>
      <Btn onClick={reset}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="CPU cells done" value={`${cpuDone}/${cells}`}/>
      <Stat label="GPU cells done" value={`${gpuDone}/${cells}`}/>
      <Stat label="CPU time" value={`${cpuEnd} units`}/>
      <Stat label="GPU time" value={`${gpuEnd} units`}/>
      <Stat label="GPU speedup" value={`${speed.toFixed(2)}×`} tone={speed > 1 ? 'ok' : 'bad'}/>
    </Stats>
  </Frame>;
}
