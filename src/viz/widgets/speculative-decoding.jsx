import React, { useMemo, useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, useTicker, rng } from '../index';
import './widgets-w3.css';

// The target model's output. The draft model guesses each next token and is right with probability α.
const TEXT = 'the quick brown fox jumps over the lazy dog and then runs off into the quiet green forest'.split(' ');
const WRONG = ['a', 'big', 'red', 'cat', 'leaps', 'under', 'some', 'happy', 'bird', 'so', 'now', 'walks', 'out', 'to', 'that', 'loud', 'dark', 'river'];

// One round = draft proposes up to k tokens, target verifies all of them in ONE forward pass.
// Accept the longest correct prefix; at the first miss the target supplies the right token;
// if every draft token is accepted the target's pass yields one bonus token for free.
function simulate(k, alpha) {
  const r = rng(42), rounds = [];
  let pos = 0;
  while (pos < TEXT.length) {
    const toks = []; let i = 0, rejected = false;
    while (i < k && pos + i < TEXT.length) {
      if (r() < alpha) toks.push({ w: TEXT[pos + i], kind: 'ok' });
      else { toks.push({ w: WRONG[(pos + i) % WRONG.length], kind: 'bad' }, { w: TEXT[pos + i], kind: 'fix' }); rejected = true; }
      i++;
      if (rejected) break;
    }
    if (!rejected && pos + i < TEXT.length) { toks.push({ w: TEXT[pos + i], kind: 'bonus' }); i++; }
    pos += i; rounds.push(toks);
  }
  return rounds;
}
const CHIP = { ok: 'viz-chip ok', bad: 'viz-chip bad', fix: 'viz-chip on', bonus: 'viz-chip on' };

export default function SpeculativeDecoding() {
  const [k, setK] = useState(4), [alpha, setAlpha] = useState(0.7), [c, setC] = useState(0.1);
  const [shown, setShown] = useState(0), [running, setRunning] = useState(false);
  const rounds = useMemo(() => simulate(k, alpha), [k, alpha]);
  const n = Math.min(shown, rounds.length);
  useTicker(running, 750, () => { if (n >= rounds.length) { setRunning(false); return false; } setShown(n + 1); });
  const change = set => v => { set(v); setShown(0); setRunning(false); };
  const vis = rounds.slice(0, n);
  const out = vis.flat().filter(t => t.kind !== 'bad').map(t => t.w);
  const accepted = vis.flat().filter(t => t.kind === 'ok').length, proposed = vis.reduce((s, r) => s + r.filter(t => t.kind === 'ok' || t.kind === 'bad').length, 0);
  // Expected tokens per target pass: (1 − α^(k+1)) / (1 − α); cost per pass: 1 target + k draft calls.
  const expTok = alpha >= 1 ? k + 1 : (1 - alpha ** (k + 1)) / (1 - alpha);
  const expSpeed = expTok / (1 + k * c);
  const simSpeed = n ? out.length / (n * (1 + k * c)) : 0;
  const last = vis[n - 1];
  const foot = !n ? `Press play: the draft model guesses ${k} tokens at a time and the big model checks them all in a single pass.`
    : n >= rounds.length ? `Done: ${out.length} tokens in ${n} target passes instead of ${TEXT.length}. ${expSpeed > 1 ? `≈${expSpeed.toFixed(2)}× faster than plain decoding.` : 'The draft is too unreliable or too costly here, so speculation is slower than plain decoding.'}`
    : last.some(t => t.kind === 'bad') ? `Pass ${n}: the draft went wrong at “${last.find(t => t.kind === 'bad').w}” – everything after it is thrown away and the target writes the correct token instead.`
    : `Pass ${n}: every drafted token matched, so the target’s pass also produced a bonus token.`;
  return <Frame title="Speculative decoding / draft and verify" meta={`k = ${k} · α = ${alpha.toFixed(2)}`} foot={foot}>
    <p className="w-speculative-decoding-out" aria-live="polite">{out.join(' ')}<span style={{ color: 'var(--ink-3)' }}>{n < rounds.length ? ' ▍' : ''}</span></p>
    <div className="w-speculative-decoding-rounds">{vis.map((r, i) => <div key={i} className="viz-row viz-fade">
      <span className="w-speculative-decoding-pass">pass {i + 1}</span>
      {r.map((t, j) => <span key={j} className={CHIP[t.kind] + ' viz-pop'} style={{ animationDelay: `${j * 70}ms` }} title={t.kind}>{t.kind === 'bonus' ? '+' : t.kind === 'fix' ? '→' : ''}{t.w}</span>)}
    </div>)}</div>
    <div className="viz-row" style={{ fontSize: '.75rem', color: 'var(--ink-3)' }}>
      <span className="viz-chip ok">accepted draft</span><span className="viz-chip bad">rejected draft</span><span className="viz-chip on">target token</span>
    </div>
    <div className="viz-two">
      <Slider label="Draft length k" value={k} min={1} max={8} onChange={change(setK)}/>
      <Slider label="Acceptance rate α" value={alpha} min={0} max={1} step={0.05} onChange={change(setAlpha)} format={v => v.toFixed(2)}/>
    </div>
    <Slider label="Draft cost (relative to one target pass)" value={c} min={0.02} max={0.5} step={0.02} onChange={change(setC)} format={v => v.toFixed(2)}/>
    <Controls>
      <Btn primary onClick={() => { if (n >= rounds.length) setShown(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={() => { setRunning(false); setShown(Math.min(rounds.length, n + 1)); }} disabled={n >= rounds.length}>Next pass</Btn>
      <Btn onClick={() => { setRunning(false); setShown(0); }}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Target passes" value={`${n} (vs ${out.length})`}/>
      <Stat label="Draft accepted" value={proposed ? `${accepted}/${proposed}` : '–'}/>
      <Stat label="Expected tokens/pass" value={expTok.toFixed(2)}/>
      <Stat label="Expected speedup" value={`${expSpeed.toFixed(2)}×`} tone={expSpeed > 1 ? 'ok' : 'bad'}/>
      <Stat label="This run" value={n ? `${simSpeed.toFixed(2)}×` : '–'}/>
    </Stats>
  </Frame>;
}
