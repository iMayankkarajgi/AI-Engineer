import React, { useState } from 'react';
import { Frame, Seg, Stats, Stat, rng } from '../index';
import './widgets-w1.css';

// A batch of 4 examples × 5 features (γ = 1, β = 0, ε = 1e-5).
// BatchNorm: per feature (column), statistics across the batch.
// LayerNorm: per example (row), statistics across features.
// RMSNorm:   per example (row), divide by root-mean-square — no mean subtraction.
const B = 4, F = 5, EPS = 1e-5, MU = [10, -3, 0.5, 50, 2], SD = [2, 1, 0.2, 10, 3];
const r = rng(21);
const X = Array.from({ length: B }, () => MU.map((m, j) => Math.round((m + SD[j] * (r() * 2 - 1) * 1.6) * 10) / 10));
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const std = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2)) + EPS); };
const rms = a => Math.sqrt(mean(a.map(x => x * x)) + EPS);
const col = (M, j) => M.map(row => row[j]);
function normalize(mode) {
  if (mode === 'batch') { const cols = Array.from({ length: F }, (_, j) => { const c = col(X, j), m = mean(c), s = std(c); return c.map(x => (x - m) / s); }); return X.map((_, i) => cols.map(c => c[i])); }
  return X.map(row => (mode === 'layer' ? row.map(x => (x - mean(row)) / std(row)) : row.map(x => x / rms(row))));
}
const NAMES = { batch: 'BatchNorm', layer: 'LayerNorm', rms: 'RMSNorm' };

export default function Normalization() {
  const [mode, setMode] = useState('batch');
  const [sel, setSel] = useState([0, 0]);
  const Y = normalize(mode), byCol = mode === 'batch';
  const inGroup = (i, j) => (byCol ? j === sel[1] : i === sel[0]);
  const gIn = byCol ? col(X, sel[1]) : X[sel[0]], gOut = byCol ? col(Y, sel[1]) : Y[sel[0]];
  const sOut = Math.sqrt(mean(gOut.map(x => (x - mean(gOut)) ** 2)));
  const grid = (M, label, fmt) => <div>
    <small className="viz-label">{label}</small>
    <div className="viz-grid-cells w-normalization-grid" style={{ marginTop: 6 }}>
      {M.map((row, i) => row.map((v, j) => <button key={`${mode}-${i}-${j}`} type="button" aria-label={`example ${i + 1}, feature ${j + 1}: ${fmt(v)}`}
        className={'viz-cell viz-fade ' + (inGroup(i, j) ? 'on' : (byCol ? j % 2 : i % 2) ? 'band' : '')} onClick={() => setSel([i, j])}>{fmt(v)}</button>))}
    </div>
  </div>;
  const foot = byCol ? `BatchNorm normalises each feature column across the ${B} examples in the batch, so every column ends with mean 0 and std 1 — but each example's result depends on the rest of the batch.`
    : mode === 'layer' ? 'LayerNorm normalises each example (row) across its own features: every row ends with mean 0 and std 1, independent of batch size — the Transformer default.'
    : 'RMSNorm only divides each row by its root-mean-square — no mean subtraction — so rows keep their sign pattern and offset. Cheaper; used in Llama-style models.';
  return <Frame title="Normalisation / which axis?" meta={`${NAMES[mode]} · ${byCol ? '↓ per column' : '→ per row'}`} foot={foot}>
    <Seg options={Object.entries(NAMES).map(([value, label]) => ({ value, label }))} value={mode} onChange={setMode} label="Normalisation"/>
    <p className="viz-prompt" style={{ fontSize: '.9rem' }}>Rows = examples in the batch, columns = features. Click any cell to inspect its {byCol ? 'column' : 'row'}.</p>
    <div className="viz-two">
      {grid(X, 'Input', v => v.toFixed(1))}
      {grid(Y, `Output (${NAMES[mode]})`, v => v.toFixed(2))}
    </div>
    <Stats>
      <Stat label={`Selected ${byCol ? 'column' : 'row'} mean in`} value={mean(gIn).toFixed(2)}/>
      <Stat label={mode === 'rms' ? 'RMS in' : 'Std in'} value={(mode === 'rms' ? rms(gIn) : std(gIn)).toFixed(2)}/>
      <Stat label="Mean out" value={(Math.abs(mean(gOut)) < 0.005 ? 0 : mean(gOut)).toFixed(2)} tone="on"/>
      <Stat label={mode === 'rms' ? 'RMS out' : 'Std out'} value={(mode === 'rms' ? rms(gOut) : sOut).toFixed(2)} tone="on"/>
    </Stats>
  </Frame>;
}
