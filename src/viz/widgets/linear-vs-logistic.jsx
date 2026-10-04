import React, { useState } from 'react';
import { Frame, Seg, Slider, Controls, Btn, Stats, Stat, rng } from '../index';

// Linear regression: closed-form least squares on continuous y.
// Logistic regression: gradient descent on log loss for 0/1 labels.
const XS = [0.5, 1.2, 1.8, 2.5, 3.1, 3.6, 4.2, 4.6, 5.1, 5.5, 6.0, 6.6, 7.3, 7.9, 8.6, 9.4];
const r = rng(3);
const YLIN = XS.map(x => 0.7 * x + 1.5 + (r() - 0.5) * 3);
const YBIN = [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1];
function ols(ys) {
  const n = XS.length, mx = XS.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  const sxy = XS.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0), sxx = XS.reduce((s, x) => s + (x - mx) ** 2, 0);
  const m = sxy / sxx; return { m, c: my - m * mx };
}
const sig = z => 1 / (1 + Math.exp(-z));
const LIN = ols(YLIN), LINBIN = ols(YBIN);
const LOG = (() => { let w = 0, b = 0; for (let k = 0; k < 6000; k++) { let gw = 0, gb = 0; XS.forEach((x, i) => { const e = sig(w * x + b) - YBIN[i]; gw += e * x; gb += e; }); w -= 0.05 * gw / XS.length; b -= 0.05 * gb / XS.length; } return { w, b }; })();
const X = x => 50 + x * 50;

export default function LinearVsLogistic() {
  const [mode, setMode] = useState('linear');
  const [q, setQ] = useState(5);
  const [overlay, setOverlay] = useState(false);
  const lin = mode === 'linear';
  const Y = lin ? y => 250 - y * 20 : p => 220 - p * 170;
  const curve = Array.from({ length: 101 }, (_, i) => { const x = i / 10, y = lin ? LIN.m * x + LIN.c : sig(LOG.w * x + LOG.b); return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`; }).join('');
  const pred = lin ? LIN.m * q + LIN.c : sig(LOG.w * q + LOG.b);
  const mse = XS.reduce((s, x, i) => s + (LIN.m * x + LIN.c - YLIN[i]) ** 2, 0) / XS.length;
  const logloss = -XS.reduce((s, x, i) => { const p = Math.min(1 - 1e-12, Math.max(1e-12, sig(LOG.w * x + LOG.b))); return s + (YBIN[i] ? Math.log(p) : Math.log(1 - p)); }, 0) / XS.length;
  const boundary = Math.abs(LOG.w) > 1e-9 ? -LOG.b / LOG.w : NaN, linBin = LINBIN.m * q + LINBIN.c;
  const foot = lin ? `Linear regression predicts a number: at x = ${q.toFixed(1)} the line says ŷ = ${pred.toFixed(2)}. Dashed lines are the residuals it minimises (squared).`
    : overlay && (linBin < 0 || linBin > 1) ? `A straight line fitted to 0/1 labels predicts ${linBin.toFixed(2)} here — not a valid probability. The sigmoid always stays between 0 and 1.`
    : `Logistic regression predicts a probability: P(y = 1 | x = ${q.toFixed(1)}) = ${pred.toFixed(2)}, so the class is ${pred >= 0.5 ? '1' : '0'}. The boundary sits where the sigmoid crosses 0.5.`;
  return <Frame title="Linear vs logistic regression" meta={lin ? 'y = m·x + c' : 'p = σ(w·x + b)'} foot={foot}>
    <Seg options={[{ value: 'linear', label: 'Linear (continuous y)' }, { value: 'logistic', label: 'Logistic (0/1 y)' }]} value={mode} onChange={setMode} label="Model"/>
    <svg viewBox="0 0 600 280" className="viz-svg viz-fade" key={mode} role="img" aria-label={lin ? 'Scatter plot with least-squares line' : 'Binary labels with fitted sigmoid curve'}>
      <line x1="50" x2="560" y1={lin ? 250 : 220} y2={lin ? 250 : 220} className="viz-axis"/><line x1="50" x2="50" y1="20" y2="260" className="viz-axis"/>
      {!lin && <><line x1="50" x2="560" y1={Y(1)} y2={Y(1)} className="viz-grid"/><line x1="50" x2="560" y1={Y(0.5)} y2={Y(0.5)} className="viz-guide"/>
        <text x="44" y={Y(1) + 4} className="viz-label" textAnchor="end">1</text><text x="44" y={Y(0.5) + 4} className="viz-label" textAnchor="end">.5</text><text x="44" y={Y(0) + 4} className="viz-label" textAnchor="end">0</text>
        {Number.isFinite(boundary) && <line x1={X(boundary)} x2={X(boundary)} y1="20" y2="230" stroke="var(--s3)" strokeWidth="2"/>}</>}
      {lin && XS.map((x, i) => <line key={i} x1={X(x)} x2={X(x)} y1={Y(YLIN[i])} y2={Y(LIN.m * x + LIN.c)} className="viz-guide"/>)}
      {!lin && overlay && <line x1={X(0)} x2={X(10)} y1={Y(LINBIN.c)} y2={Y(LINBIN.m * 10 + LINBIN.c)} className="viz-curve alt" strokeDasharray="6 5"/>}
      <path d={curve} className="viz-curve"/>
      {XS.map((x, i) => <circle key={i} cx={X(x)} cy={Y(lin ? YLIN[i] : YBIN[i])} r="6" className={'viz-dot' + (lin || YBIN[i] ? ' alt2' : ' alt')}/>)}
      <line x1={X(q)} x2={X(q)} y1="20" y2={lin ? 250 : 220} className="viz-guide"/>
      <circle cx={X(q)} cy={Y(pred)} r="9" className="viz-ball"/>
      <text x="50" y="275" className="viz-label">x = 0</text><text x="560" y="275" className="viz-label" textAnchor="end">x = 10</text>
    </svg>
    <Slider label="Query x" value={q} min={0} max={10} step={0.1} onChange={setQ} format={v => v.toFixed(1)}/>
    {!lin && <Controls><Btn onClick={() => setOverlay(o => !o)}>{overlay ? 'Hide' : 'Overlay'} a straight-line fit on the 0/1 data</Btn></Controls>}
    <Stats>
      {lin ? <><Stat label="Slope m" value={LIN.m.toFixed(3)}/><Stat label="Intercept c" value={LIN.c.toFixed(3)}/><Stat label="Prediction ŷ" value={pred.toFixed(2)} tone="on"/><Stat label="MSE" value={mse.toFixed(3)}/></>
        : <><Stat label="Weight w" value={LOG.w.toFixed(3)}/><Stat label="Bias b" value={LOG.b.toFixed(3)}/><Stat label="P(y = 1)" value={pred.toFixed(3)} tone={pred >= 0.5 ? 'ok' : 'bad'}/><Stat label="Log loss" value={logloss.toFixed(3)}/><Stat label="Boundary x" value={Number.isFinite(boundary) ? boundary.toFixed(2) : '—'}/></>}
    </Stats>
  </Frame>;
}
