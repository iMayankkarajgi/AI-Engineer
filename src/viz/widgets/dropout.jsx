import React, { useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, Bars, useTicker, rng } from '../index';

// Inverted dropout: during training each hidden unit is zeroed with probability p and
// survivors are multiplied by 1/(1−p), so the expected activation matches inference.
const LAYERS = [4, 6, 6, 2], HIDDEN = [1, 2];
const pos = (l, i) => [60 + l * 160, 30 + ((i + 0.5) / LAYERS[l]) * 240];
const H1 = (() => { const r = rng(5); return Array.from({ length: 6 }, () => 0.3 + r() * 0.7); })();
const maskFor = (seed, p) => { const r = rng(seed * 7919 + 1); return LAYERS.map((n, l) => Array.from({ length: n }, () => !HIDDEN.includes(l) || r() >= p)); };

export default function Dropout() {
  const [p, setP] = useState(0.5);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState('train');
  const [running, setRunning] = useState(false);
  useTicker(running && mode === 'train', 900, () => setSeed(s => s + 1));
  const train = mode === 'train', scale = 1 / (1 - p);
  const mask = train ? maskFor(seed, p) : LAYERS.map(n => Array(n).fill(true));
  const out = H1.map((h, i) => (train ? (mask[1][i] ? h * scale : 0) : h));
  const sum = a => a.reduce((s, x) => s + x, 0), ref = sum(H1);
  const avg = sum(Array.from({ length: 400 }, (_, k) => { const m = maskFor(1000 + k, p)[1]; return sum(H1.map((h, i) => (m[i] ? h * scale : 0))); })) / 400;
  const dropped = HIDDEN.reduce((s, l) => s + mask[l].filter(x => !x).length, 0);
  const foot = !train ? 'Inference: every neuron is active and nothing is rescaled — the network uses its full capacity.'
    : p === 0 ? 'p = 0: dropout is off, so training looks exactly like inference.'
    : `Training: ${dropped} of 12 hidden neurons are dropped this pass. Survivors are scaled ×${scale.toFixed(2)}, so the layer's average output still matches inference (${avg.toFixed(2)} vs ${ref.toFixed(2)} over 400 masks).`;
  return <Frame title="Dropout / random neuron masking" meta={train ? `mask #${seed}` : 'inference'} foot={foot}>
    <Seg options={[{ value: 'train', label: 'Training' }, { value: 'infer', label: 'Inference' }]} value={mode} onChange={setMode} label="Phase"/>
    <svg viewBox="0 0 600 300" className="viz-svg" role="img" aria-label={`Network with ${dropped} dropped hidden neurons`}>
      {LAYERS.slice(1).map((n, l) => Array.from({ length: n }, (_, j) => Array.from({ length: LAYERS[l] }, (_, i) => {
        const live = mask[l][i] && mask[l + 1][j], [x1, y1] = pos(l, i), [x2, y2] = pos(l + 1, j);
        return <line key={`${l}-${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} className={'viz-edge' + (live && train && p > 0 ? ' on' : '')} style={{ opacity: live ? 0.55 : 0.06, strokeWidth: live ? 1.4 : 1 }}/>;
      })))}
      {LAYERS.map((n, l) => Array.from({ length: n }, (_, i) => { const [x, y] = pos(l, i), on = mask[l][i]; return <g key={`${l}-${i}`} style={{ opacity: on ? 1 : 0.18, transition: 'opacity .35s' }}>
        <circle cx={x} cy={y} r="15" className={'viz-node' + (on && HIDDEN.includes(l) ? ' on' : '')}/>
        {HIDDEN.includes(l) && <text x={x} y={y + 4} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--ink-2)' }}>{on ? (train ? `×${scale.toFixed(1)}` : '×1') : '0'}</text>}
      </g>; }))}
      {['input', 'hidden 1', 'hidden 2', 'output'].map((t, l) => <text key={t} x={60 + l * 160} y="296" textAnchor="middle" className="viz-label">{t}</text>)}
    </svg>
    <Slider label="Drop rate p" value={p} min={0} max={0.8} step={0.05} onChange={setP} format={v => v.toFixed(2)}/>
    <Controls>
      <Btn primary onClick={() => setSeed(s => s + 1)} disabled={!train}>⟳ Resample mask</Btn>
      <Btn onClick={() => setRunning(r => !r)} disabled={!train}>{running ? '❚❚ Stop' : '▶ Auto-resample'}</Btn>
    </Controls>
    <Bars items={H1.map((h, i) => ({ label: `unit ${i + 1}: ${h.toFixed(2)} →`, value: out[i], tone: !mask[1][i] ? 'off' : train && p > 0 ? 'on' : '', note: out[i].toFixed(2) }))} max={Math.max(...H1) / 0.2}/>
    <Stats>
      <Stat label="Dropped (hidden)" value={`${dropped} / 12`}/><Stat label="Survivor scale" value={train ? `×${scale.toFixed(2)}` : '×1'} tone="on"/>
      <Stat label="Layer-1 sum, this pass" value={sum(out).toFixed(2)}/><Stat label="Expected (inference)" value={ref.toFixed(2)} tone="ok"/>
    </Stats>
  </Frame>;
}
