import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, Bars } from '../index';

// |e| vs e², and which single prediction each loss prefers for a set of targets:
// L2 (MSE) is minimised by the mean, L1 (MAE) by the median.
const BASE = [2.1, 2.4, 2.8, 3.0, 3.3, 3.5, 3.9], OUTLIER = 12;
const CX = e => 40 + ((e + 3) / 6) * 260, CY = l => 200 - Math.min(l, 9) * 20;
const NX = y => 20 + (y / 13) * 560;
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export default function LossL1L2() {
  const [e, setE] = useState(1.5);
  const [out, setOut] = useState(false);
  const ys = out ? [...BASE, OUTLIER] : BASE;
  const mean = ys.reduce((a, b) => a + b) / ys.length, med = median(ys);
  const l1 = ys.map(y => Math.abs(y - med)), l2 = ys.map(y => (y - mean) ** 2);
  const s1 = l1.reduce((a, b) => a + b), s2 = l2.reduce((a, b) => a + b);
  const share = (arr, s) => (out && s > 0 ? `${((arr[arr.length - 1] / s) * 100).toFixed(0)}%` : '—');
  const curve = f => Array.from({ length: 61 }, (_, i) => { const x = -3 + i / 10; return `${i ? 'L' : 'M'}${CX(x).toFixed(1)},${CY(f(x)).toFixed(1)}`; }).join('');
  const foot = (Math.abs(e) < 1 ? `For |e| < 1 squaring shrinks the error (${(e * e).toFixed(2)} < ${Math.abs(e).toFixed(2)}), so L2 barely cares about small mistakes. `
    : Math.abs(e) > 1 ? `For |e| > 1 squaring inflates it (${(e * e).toFixed(2)} vs ${Math.abs(e).toFixed(2)}), so L2 punishes big mistakes hard. ` : 'At |e| = 1 both losses agree. ')
    + (out ? `The outlier drags the mean (L2's best guess) to ${mean.toFixed(2)}, while the median (L1's) only moves to ${med.toFixed(2)}.` : 'Toggle the outlier to see which loss gets dragged.');
  return <Frame title="L1 vs L2 loss / outliers" meta={`e = ${e.toFixed(2)}`} foot={foot}>
    <div className="viz-two">
      <svg viewBox="0 0 320 230" className="viz-svg" role="img" aria-label="Absolute error and squared error curves">
        <line x1="40" x2="300" y1="200" y2="200" className="viz-axis"/><line x1={CX(0)} x2={CX(0)} y1="10" y2="200" className="viz-axis"/>
        <path d={curve(Math.abs)} className="viz-curve"/><path d={curve(x => x * x)} className="viz-curve alt"/>
        <line x1={CX(e)} x2={CX(e)} y1="10" y2="200" className="viz-guide"/>
        <circle cx={CX(e)} cy={CY(Math.abs(e))} r="6" className="viz-dot"/><circle cx={CX(e)} cy={CY(e * e)} r="6" className="viz-dot alt"/>
        <text x="300" y="186" className="viz-label" textAnchor="end">|e| (L1)</text>
        <text x="48" y="22" className="viz-label" style={{ fill: 'var(--s2)' }}>e² (L2)</text>
        <text x="40" y="216" className="viz-label">−3</text><text x="300" y="216" className="viz-label" textAnchor="end">+3</text>
      </svg>
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <Slider label="Error e = prediction − target" value={e} min={-3} max={3} step={0.05} onChange={setE} format={v => v.toFixed(2)}/>
        <Bars items={[{ label: 'L1 = |e|', value: Math.abs(e), tone: 'on' }, { label: 'L2 = e²', value: e * e }]} max={9}/>
        <Controls><Btn primary onClick={() => setOut(o => !o)}>{out ? 'Remove outlier' : 'Add outlier (y = 12)'}</Btn></Controls>
      </div>
    </div>
    <svg viewBox="0 0 600 80" className="viz-svg" role="img" aria-label="Targets on a number line with the mean and median marked">
      <line x1="20" x2="580" y1="40" y2="40" className="viz-axis"/>
      {ys.map((y, i) => <circle key={i} cx={NX(y)} cy="40" r="6" className={'viz-dot muted' + (out && i === ys.length - 1 ? ' viz-pop' : '')} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}/>)}
      <circle cx={NX(mean)} cy="22" r="7" className="viz-ball"/><text x={NX(mean)} y="10" textAnchor="middle" className="viz-label">mean (L2)</text>
      <circle cx={NX(med)} cy="58" r="7" className="viz-dot"/><text x={NX(med)} y="76" textAnchor="middle" className="viz-label">median (L1)</text>
    </svg>
    <Stats>
      <Stat label="Mean (L2 optimum)" value={mean.toFixed(2)}/><Stat label="Median (L1 optimum)" value={med.toFixed(2)} tone="on"/>
      <Stat label="Outlier share of L1" value={share(l1, s1)}/><Stat label="Outlier share of L2" value={share(l2, s2)} tone={out ? 'bad' : undefined}/>
    </Stats>
  </Frame>;
}
