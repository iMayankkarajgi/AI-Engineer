import React, { useState } from 'react';
import { Frame, Seg, Controls, Btn, Stats, Stat, useTicker, rng, softmax } from '../index';
import './widgets-w2.css';

// Raw scores for a 6-token sentence; each row goes raw → masked (−∞) → softmax.
const TOK = ['I', 'like', 'warm', 'tea', 'with', 'honey'];
const N = TOK.length;
const R = rng(7);
const S = TOK.map(() => TOK.map(() => Math.round((R() * 4 - 2) * 10) / 10));
const MAX = 2 * N;

export default function CausalMask() {
  const [s, setS] = useState(0);
  const [mask, setMask] = useState('on');
  const [running, setRunning] = useState(false);
  useTicker(running, 700, () => { if (s >= MAX) { setRunning(false); return false; } setS(v => Math.min(v + 1, MAX)); });
  const on = mask === 'on';
  const phase = i => Math.max(0, Math.min(2, s - 2 * i)); // 0 raw, 1 masked, 2 softmaxed
  const rows = S.map((r, i) => {
    const masked = r.map((v, j) => (on && j > i ? -Infinity : v));
    const p = softmax(masked.map(v => (Number.isFinite(v) ? v : -1e9)));
    return { masked, p };
  });
  const doneRows = rows.filter((_, i) => phase(i) === 2);
  const leak = doneRows.reduce((acc, r, i) => acc + r.p.reduce((a, w, j) => a + (j > i ? w : 0), 0), 0);
  const cur = Math.max(0, Math.min(N - 1, Math.floor((s - 1) / 2)));
  const reset = () => { setRunning(false); setS(0); };
  const foot = s === 0 ? 'Raw scores: every token currently “sees” every other token, including the future.'
    : s >= MAX ? (on ? 'Done: each row sums to 1 and every weight above the diagonal is exactly 0, so no token can peek ahead.' : `Done without a mask: tokens put ${(leak / N * 100).toFixed(0)}% of attention (on average) on words that have not been generated yet — that is cheating during training.`)
    : phase(cur) === 1 ? `Row “${TOK[cur]}”: ${!on ? 'mask is off, so nothing is hidden.' : cur + 1 < N ? `future positions ${cur + 2}–${N} are set to −∞, and e^(−∞) = 0.` : 'the last token has no future to hide.'}`
    : `Row “${TOK[cur]}”: softmax turns the remaining scores into weights that sum to 1.`;
  return <Frame title="Causal mask / filling the attention matrix" meta={`step ${s} / ${MAX}`} foot={foot}>
    <Seg options={[{ value: 'on', label: 'Causal mask on' }, { value: 'off', label: 'Mask off' }]} value={mask} onChange={v => { setMask(v); reset(); }} label="Mask"/>
    <div className="w-causal-mask-grid" role="img" aria-label="Six by six attention score matrix being masked and normalized row by row">
      <span/>{TOK.map((t, j) => <span key={j} className="w-causal-mask-lab">{t}</span>)}
      {rows.map((r, i) => <React.Fragment key={i}>
        <span className={'w-causal-mask-lab' + (i === cur && s > 0 && s < MAX ? ' cur' : '')} style={{ textAlign: 'right' }}>{TOK[i]}</span>
        {r.masked.map((v, j) => {
          const ph = phase(i), future = j > i;
          if (ph === 0) return <span key={j} className="viz-cell" style={{ opacity: 0.6 }}>{S[i][j].toFixed(1)}</span>;
          if (ph === 1) return <span key={j} className={'viz-cell' + (future && on ? ' bad' : '')}>{Number.isFinite(v) ? v.toFixed(1) : '−∞'}</span>;
          const w = r.p[j], pct = Math.round(w * 100);
          return <span key={j} className="viz-cell" style={{ background: `color-mix(in srgb, ${future && !on ? 'var(--bad)' : 'var(--accent)'} ${Math.min(100, 15 + w * 120)}%, var(--surface-3))`, color: w > 0.35 ? '#fff' : 'var(--ink-2)', opacity: future && on ? 0.35 : 1 }}>{pct}%</span>;
        })}
      </React.Fragment>)}
    </div>
    <Controls>
      <Btn primary onClick={() => { if (s >= MAX) setS(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={() => { setRunning(false); setS(v => Math.min(v + 1, MAX)); }} disabled={s >= MAX}>Step</Btn>
      <Btn onClick={() => { setRunning(false); setS(MAX); }}>Skip to end</Btn>
      <Btn onClick={reset}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Rows normalized" value={`${doneRows.length} / ${N}`}/>
      <Stat label="Masked cells" value={on ? `${N * (N - 1) / 2}` : '0'}/>
      <Stat label="Weight on future" value={`${(doneRows.length ? leak / doneRows.length * 100 : 0).toFixed(1)}%`} tone={leak > 1e-9 ? 'bad' : 'ok'}/>
    </Stats>
  </Frame>;
}
