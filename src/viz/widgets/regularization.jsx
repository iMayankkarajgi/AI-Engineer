import React, { useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat } from '../index';
import './widgets-w1.css';

// Exact solutions for orthonormal features (XᵀX = I), starting from the unregularised weights w:
//   L1 (lasso, ½‖y−Xw‖² + λ‖w‖₁):   soft-threshold  sign(w)·max(|w| − λ, 0)  → many weights become exactly 0
//   L2 (ridge, ½‖y−Xw‖² + ½λ‖w‖²):  shrink          w / (1 + λ)              → all weights shrink, none hit 0
const W = [3.0, -2.2, 1.5, 0.8, -0.6, 0.35, -0.2, 0.1];
const MAX = 3.2;
const l1 = (w, lam) => Math.sign(w) * Math.max(Math.abs(w) - lam, 0), l2 = (w, lam) => w / (1 + lam);
const pos = w => { const h = (Math.abs(w) / MAX) * 50; return { top: `${w > 0 ? 50 - h : 50}%`, height: `${h}%` }; };

export default function Regularization() {
  const [lam, setLam] = useState(0.5);
  const [mode, setMode] = useState('both');
  const a = W.map(w => l1(w, lam)), b = W.map(w => l2(w, lam));
  const nz = arr => arr.filter(w => Math.abs(w) > 1e-9).length, norm = arr => Math.sqrt(arr.reduce((s, w) => s + w * w, 0));
  const show1 = mode !== 'L2', show2 = mode !== 'L1';
  const foot = lam === 0 ? 'λ = 0: no penalty, both models keep the original weights.'
    : `${show1 ? `L1 subtracts λ from every |w| and clips at zero: ${W.length - nz(a)} of ${W.length} weights are now exactly 0 (automatic feature selection). ` : ''}`
      + `${show2 ? `L2 divides every weight by ${(1 + lam).toFixed(2)}: big weights shrink most in absolute terms, but none reach zero.` : ''}`;
  return <Frame title="Regularisation / L1 vs L2 weight shrinkage" meta={`λ = ${lam.toFixed(2)}`} foot={foot}>
    <Seg options={[{ value: 'L1', label: 'L1 (lasso)' }, { value: 'L2', label: 'L2 (ridge)' }, { value: 'both', label: 'Compare' }]} value={mode} onChange={setMode} label="Penalty"/>
    <div role="img" aria-label={`Bar chart of ${W.length} weights under λ = ${lam.toFixed(2)}`}>
      <div className="w-regularization-plot">
        {W.map((w, i) => <div key={i} className="w-regularization-col">
          {show1 && <div className="w-regularization-slot"><i className="w-regularization-bar ghost" style={pos(w)}/><i className={'w-regularization-bar' + (a[i] === 0 ? ' zero' : '')} style={pos(a[i])}/></div>}
          {show2 && <div className="w-regularization-slot"><i className="w-regularization-bar ghost" style={pos(w)}/><i className="w-regularization-bar l2" style={pos(b[i])}/></div>}
        </div>)}
      </div>
      <div className="w-regularization-names">{W.map((_, i) => <span key={i}>w{i + 1}</span>)}</div>
    </div>
    <div className="viz-row" style={{ fontSize: '.78rem', color: 'var(--ink-3)' }}>
      {show1 && <span><i className="w-regularization-key" style={{ background: 'var(--accent)' }}/>L1</span>}
      {show2 && <span><i className="w-regularization-key" style={{ background: 'var(--s2)' }}/>L2</span>}
      <span><i className="w-regularization-key" style={{ border: '1px dashed var(--ink-3)' }}/>unregularised</span>
    </div>
    <Slider label="Regularisation strength λ" value={lam} min={0} max={3.5} step={0.05} onChange={setLam} format={v => v.toFixed(2)}/>
    <Controls>{[0, 0.3, 1, 3].map(v => <Btn key={v} onClick={() => setLam(v)}>λ = {v}</Btn>)}</Controls>
    <Stats>
      {show1 && <Stat label="L1 non-zero weights" value={`${nz(a)} / ${W.length}`} tone="on"/>}
      {show2 && <Stat label="L2 non-zero weights" value={`${nz(b)} / ${W.length}`}/>}
      {show1 && <Stat label="‖w‖₂ under L1" value={norm(a).toFixed(2)}/>}
      {show2 && <Stat label="‖w‖₂ under L2" value={norm(b).toFixed(2)}/>}
    </Stats>
  </Frame>;
}
