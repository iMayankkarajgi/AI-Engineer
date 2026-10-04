import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, useTicker } from '../index';
import './widgets-w1.css';

// Each tick = one sequential step of compute. An RNN needs one step per token because
// hₜ = f(hₜ₋₁, xₜ) depends on the previous state. A Transformer layer processes every
// token at once (all pairs attend in parallel), so it needs one step per layer.
const WORDS = 'the cat sat on the mat because it was tired and slept'.split(' ');
const LAYERS = 2;

export default function RnnVsTransformer() {
  const [n, setN] = useState(8);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const toks = WORDS.slice(0, n), w = 560 / n, bw = w - 6, fs = n > 9 ? 9 : 11;
  const cx = i => 20 + i * w + bw / 2;
  useTicker(running, 650, () => { if (t + 1 >= n) setRunning(false); setT(x => Math.min(x + 1, n)); if (t + 1 >= n) return false; });
  const reset = v => { setRunning(false); setT(0); if (v !== undefined) setN(v); };
  const play = () => { if (t >= n) setT(0); setRunning(r => !r); };
  const tDone = t >= LAYERS, rDone = t >= n;
  const foot = t === 0 ? 'Press Race. Each tick is one step that must wait for the previous one.'
    : !tDone ? `Transformer layer ${t} processed all ${n} tokens at once; the RNN has only read ${t}.`
    : !rDone ? `Transformer finished after ${LAYERS} steps (one per layer). The RNN is still reading token ${t + 1} of ${n} — it cannot skip ahead because each hidden state needs the previous one.`
    : `Done: the RNN needed ${n} sequential steps, the Transformer ${LAYERS}. Longer sequences only make the RNN slower; the Transformer pays with n² = ${n * n} attention pairs per layer instead.`;
  const lane = (y, label, lit, cur) => <g>
    <text x="20" y={y - 10} className="viz-label">{label}</text>
    {toks.map((tok, i) => <g key={i}>
      <rect x={20 + i * w} y={y} width={bw} height="34" rx="6" className="w-rnn-vs-transformer-tok"
        style={{ fill: cur(i) ? 'var(--s2)' : lit(i) ? 'var(--accent)' : 'var(--surface-3)', stroke: 'var(--line-2)' }}/>
      <text x={cx(i)} y={y + 21} textAnchor="middle" style={{ fontSize: fs, fill: lit(i) || cur(i) ? 'var(--accent-ink)' : 'var(--ink-2)' }}>{tok.slice(0, 7)}</text>
    </g>)}
  </g>;
  return <Frame title="RNN vs Transformer / sequential vs parallel" meta={`tick ${t}`} foot={foot}>
    <svg viewBox="0 0 600 280" className="viz-svg" role="img" aria-label={`Race over ${n} tokens: RNN at token ${Math.min(t, n)}, Transformer ${tDone ? 'finished' : `layer ${t}`}`}>
      {lane(30, `RNN · ${rDone ? 'done ✓' : `step ${t} / ${n}`}`, i => i < t - 1 || (rDone && i < n), i => !rDone && i === t - 1)}
      {toks.slice(1).map((_, i) => <path key={i} d={`M${20 + i * w + bw},47 L${20 + (i + 1) * w},47`} className={'viz-edge' + (i < t - 1 ? ' on' : '')}/>)}
      {t > 0 && !rDone && <text x={Math.min(cx(t - 1), 560)} y="82" textAnchor="middle" className="viz-label" style={{ fill: 'var(--s2)' }}>h{t}</text>}
      {lane(160, `Transformer · ${tDone ? 'done ✓' : `layer ${t} / ${LAYERS}`}`, () => t >= 1, () => false)}
      {t >= 1 && toks.map((_, i) => toks.map((__, j) => j > i && <path key={`${i}-${j}`} d={`M${cx(i)},194 Q${(cx(i) + cx(j)) / 2},${194 + 12 + (j - i) * 4} ${cx(j)},194`}
        fill="none" className="viz-edge on viz-fade" style={{ opacity: 0.25, strokeWidth: 1 }}/>))}
      {tDone && <text x="580" y="150" textAnchor="end" className="viz-label" style={{ fill: 'var(--ok)' }}>all {n} tokens · {LAYERS} layers · finished</text>}
      <rect x="20" y="254" width="560" height="8" rx="4" fill="var(--surface-3)"/><rect x="20" y="266" width="560" height="8" rx="4" fill="var(--surface-3)"/>
      <rect x="20" y="254" width={560 * Math.min(1, t / n)} height="8" rx="4" fill="var(--s2)" style={{ transition: 'width .4s' }}/>
      <rect x="20" y="266" width={560 * Math.min(1, t / LAYERS)} height="8" rx="4" fill="var(--accent)" style={{ transition: 'width .4s' }}/>
    </svg>
    <Slider label="Sequence length n" value={n} min={4} max={WORDS.length} onChange={v => reset(v)}/>
    <Controls>
      <Btn primary onClick={play}>{running ? '❚❚ Pause' : t >= n ? '↻ Race again' : '▶ Race'}</Btn>
      <Btn onClick={() => setT(x => Math.min(x + 1, n))} disabled={rDone}>Step</Btn>
      <Btn onClick={() => reset()}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="RNN sequential steps" value={n} tone="bad"/><Stat label="Transformer steps" value={LAYERS} tone="ok"/>
      <Stat label="Path first→last token" value={`RNN ${n - 1} · Tx 1`}/><Stat label="Attention pairs / layer" value={n * n}/>
    </Stats>
  </Frame>;
}
