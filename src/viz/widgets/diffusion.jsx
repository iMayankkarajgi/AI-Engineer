import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, useTicker, rng } from '../index';
import './widgets-w3.css';

const ART = ['............', '..##....##..', '.####..####.', '############', '############', '############', '.##########.', '..########..', '...######...', '....####....', '.....##.....', '............'];
const X0 = ART.join('').split('').map(c => (c === '#' ? 1 : -1));
const T = 40;
// Linear β schedule; ᾱ_t = Π (1 − β_s). x_t = √ᾱ_t · x₀ + √(1 − ᾱ_t) · ε.
const BETA = Array.from({ length: T }, (_, i) => 0.001 + (0.25 - 0.001) * (i / (T - 1)));
const AB = BETA.reduce((a, b) => [...a, a[a.length - 1] * (1 - b)], [1]);
// Reverse uses the deterministic DDIM update with a perfect noise predictor (ε̂ = ε), which retraces
// exactly the same x_t path backwards — a real network would only approximate ε.
const gauss =r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const shade = v => `color-mix(in srgb, var(--accent) ${(Math.max(0, Math.min(1, (v + 1) / 2)) * 100).toFixed(0)}%, var(--surface-3))`;

function Grid({ vals, label }) {
  return <div className="w-diffusion-panel"><div className="w-diffusion-grid" role="img" aria-label={label}>{vals.map((v, i) => <i key={i} style={{ background: shade(v) }}/>)}</div><span>{label}</span></div>;
}

export default function Diffusion() {
  const [t, setT] = useState(0);
  const [dir, setDir] = useState('forward');
  const [seed, setSeed] = useState(1);
  const [running, setRunning] = useState(false);
  const eps = useMemo(() => { const r = rng(seed * 977); return X0.map(() => gauss(r)); }, [seed]);
  useTicker(running, 120, () => {
    const next = dir === 'forward' ? t + 1 : t - 1;
    if (next < 0 || next > T) { setRunning(false); return false; }
    setT(next);
  });
  const a = AB[t], sa = Math.sqrt(a), sn = Math.sqrt(1 - a);
  const signal = X0.map(v => sa * v), noise = eps.map(e => sn * e), xt = signal.map((s, i) => s + noise[i]);
  const snr = a / Math.max(1 - a, 1e-12);
  const pick = d => { setRunning(false); setDir(d); setT(d === 'forward' ? 0 : T); };
  const curve = AB.map((v, i) => `${i ? 'L' : 'M'}${(10 + (i / T) * 280).toFixed(1)},${(52 - v * 44).toFixed(1)}`).join('');
  const foot = t === 0 ? (dir === 'forward' ? 'Clean image (t = 0). Press play to add a little Gaussian noise at every step.' : 'Fully denoised: the reverse process has removed all the predicted noise and recovered the image.')
    : t === T ? (dir === 'forward' ? `t = ${T}: only ${(sa * 100).toFixed(1)}% of the signal is left — this is essentially pure noise.` : 'Start of generation: pure noise. Press play and the model removes its predicted noise one step at a time.')
    : `${dir === 'forward' ? 'Forward noising' : 'Reverse denoising'} at t = ${t}: x_t is ${(sa * 100).toFixed(0)}% image and ${(sn * 100).toFixed(0)}% noise. ${dir === 'reverse' ? 'Coarse shape appears first; fine detail comes last.' : ''}`;
  return <Frame title="Diffusion / noising and denoising" meta={`t = ${t} / ${T} · ${dir}`} foot={foot}>
    <Seg options={[{ value: 'forward', label: 'Forward: add noise' }, { value: 'reverse', label: 'Reverse: generate' }]} value={dir} onChange={pick} label="Direction"/>
    <div className="w-diffusion-panels">
      <Grid vals={signal} label={`√ᾱ·x₀  (${sa.toFixed(2)})`}/>
      <span className="w-diffusion-op" aria-hidden="true">+</span>
      <Grid vals={noise} label={`√(1−ᾱ)·ε  (${sn.toFixed(2)})`}/>
      <span className="w-diffusion-op" aria-hidden="true">=</span>
      <Grid vals={xt} label={`x_${t}`}/>
    </div>
    <svg viewBox="0 0 300 64" className="viz-svg" role="img" aria-label={`Noise schedule: alpha-bar is ${a.toFixed(3)} at step ${t}`} style={{ maxWidth: 420, justifySelf: 'center' }}>
      <line x1="10" x2="290" y1="52" y2="52" className="viz-axis"/>
      <path d={curve} className="viz-curve"/>
      <circle cx={10 + (t / T) * 280} cy={52 - a * 44} r="5" className="viz-ball"/>
      <text x="292" y="62" textAnchor="end" className="viz-label">ᾱ_t (signal kept) vs t</text>
    </svg>
    <Slider label="Timestep t" value={t} min={0} max={T} onChange={v => { setRunning(false); setT(v); }}/>
    <Controls>
      <Btn primary onClick={() => { if (!running && (dir === 'forward' ? t >= T : t <= 0)) setT(dir === 'forward' ? 0 : T); setRunning(r => !r); }}>{running ? '❚❚ Pause' : dir === 'forward' ? '▶ Add noise' : '▶ Denoise'}</Btn>
      <Btn onClick={() => { setRunning(false); setSeed(s => s + 1); }}>New noise sample</Btn>
    </Controls>
    <Stats>
      <Stat label="ᾱ_t" value={a.toFixed(3)}/>
      <Stat label="Signal weight" value={sa.toFixed(3)} tone="on"/>
      <Stat label="Noise std" value={sn.toFixed(3)}/>
      <Stat label="SNR" value={t === 0 ? '∞' : snr >= 10 ? snr.toFixed(0) : snr.toFixed(3)}/>
    </Stats>
  </Frame>;
}
