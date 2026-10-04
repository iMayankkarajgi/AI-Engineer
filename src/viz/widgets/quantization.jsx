import React, { useState } from 'react';
import { Frame, Slider, Seg, Bars, Stats, Stat, rng } from '../index';
import './widgets-w3.css';

// 28 weights drawn from N(0, 0.35²) with Box–Muller, plus an optional outlier.
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const BASE = (() => { const r = rng(5); return Array.from({ length: 28 }, () => +(gauss(r) * 0.35).toFixed(3)); })();
const X = (v, lim) => 300 + (v / lim) * 270;

export default function Quantization() {
  const [bits, setBits] = useState(4);
  const [view, setView] = useState('q');
  const [outlier, setOutlier] = useState(false);
  const w = outlier ? [...BASE, 2.6] : BASE;
  // Symmetric absmax quantisation: scale = max|w| / (2^(b−1) − 1); q = round(w / scale).
  const qmax = 2 ** (bits - 1) - 1, absmax = Math.max(...w.map(Math.abs));
  const scale = absmax / qmax;
  const deq = w.map(v => Math.max(-qmax, Math.min(qmax, Math.round(v / scale))) * scale);
  const err = w.map((v, i) => Math.abs(v - deq[i]));
  const mae = err.reduce((a, b) => a + b, 0) / w.length, maxErr = Math.max(...err);
  const zeroed = deq.filter((d, i) => d === 0 && w[i] !== 0).length;
  const lim = absmax * 1.05;
  const levels = Array.from({ length: 2 * qmax + 1 }, (_, i) => (i - qmax) * scale);
  const gb = b => (7e9 * b) / 8 / 1e9;
  const snapped = view === 'q';
  const foot = outlier && bits <= 4 ? `One outlier stretched the grid to ±${absmax.toFixed(2)}, so the other weights share only a few levels and ${zeroed} of them collapse to zero — why real schemes clip or use per-group scales.`
    : bits <= 3 ? `Only ${2 * qmax + 1} representable values: weights snap hard and the rounding error (red) is large.`
    : bits >= 8 ? 'At 8 bits the grid is so fine that every weight barely moves — near-lossless at a quarter of FP32 memory.'
    : `${2 * qmax + 1} levels spaced ${scale.toFixed(3)} apart: each weight moves to its nearest grid line, at most half a step.`;
  return <Frame title="Quantization / snapping weights to a grid" meta={`INT${bits} · ${2 * qmax + 1} levels`} foot={foot}>
    <Seg options={[{ value: 'fp', label: 'Original FP32' }, { value: 'q', label: `Quantized INT${bits}` }]} value={view} onChange={setView} label="Show weights as"/>
    <svg viewBox="0 0 600 150" className="viz-svg" role="img" aria-label={`${w.length} weights on a number line, ${snapped ? 'snapped to' : 'shown against'} ${2 * qmax + 1} representable values`}>
      {levels.map((l, i) => <line key={i} x1={X(l, lim)} x2={X(l, lim)} y1="14" y2="118" className="w-quantization-tick" style={{ opacity: levels.length > 64 ? 0.15 : 0.4 }}/>)}
      <line x1="30" x2="570" y1="118" y2="118" className="viz-axis"/>
      <line x1="300" x2="300" y1="110" y2="126" className="viz-axis"/>
      {w.map((v, i) => { const y = 24 + (i % 6) * 15;
        return <g key={i}>
          <line x1={X(v, lim)} x2={X(deq[i], lim)} y1={y} y2={y} className="w-quantization-err" style={{ opacity: snapped ? 0.7 : 0 }}/>
          <circle cx={X(snapped ? deq[i] : v, lim)} cy={y} r={i === 28 ? 6 : 4.5} className={'viz-dot' + (i === 28 ? ' alt' : '')}><title>{`w = ${v.toFixed(3)} → ${deq[i].toFixed(3)}`}</title></circle>
        </g>; })}
      <text x="30" y="140" className="viz-label">−{lim.toFixed(2)}</text><text x="300" y="140" className="viz-label" textAnchor="middle">0</text><text x="570" y="140" className="viz-label" textAnchor="end">+{lim.toFixed(2)}</text>
    </svg>
    <div className="viz-two">
      <Slider label="Bit width" value={bits} min={2} max={8} onChange={setBits} format={v => `${v} bits`}/>
      <Seg options={[{ value: 'n', label: 'Normal weights' }, { value: 'o', label: '+ one outlier' }]} value={outlier ? 'o' : 'n'} onChange={v => setOutlier(v === 'o')} label="Outlier"/>
    </div>
    <Bars items={[{ label: 'FP32', value: gb(32), note: `${gb(32).toFixed(1)} GB` }, { label: 'FP16', value: gb(16), note: `${gb(16).toFixed(1)} GB` }, { label: `INT${bits}`, value: gb(bits), tone: 'on', note: `${gb(bits).toFixed(1)} GB` }]} max={gb(32)}/>
    <Stats>
      <Stat label="Scale (step)" value={scale.toFixed(4)}/>
      <Stat label="Mean |error|" value={mae.toFixed(4)} tone={mae > 0.05 ? 'bad' : 'ok'}/>
      <Stat label="Max |error|" value={maxErr.toFixed(4)}/>
      <Stat label="7B model size" value={`${gb(bits).toFixed(1)} GB`} tone="on"/>
    </Stats>
  </Frame>;
}
