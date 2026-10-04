import React, { useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, useTicker } from '../index';
import './widgets-w2.css';

// Decoding: prefill caches K,V for the prompt; each new token adds one K and one V column.
const PROMPT = ['The', 'robot', 'picked', 'up', 'the'];
const GEN = ['red', 'ball', 'and', 'smiled', '.', '<eos>'];
const P = PROMPT.length, MAXSTEP = GEN.length;
const human = b => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(1)} KB`);

function Row({ label, v, toks, step }) {
  const n = toks.length;
  return <div className="w-kv-cache-row">
    <small>{label}</small>
    <div className="viz-grid-cells">{toks.map((t, i) => <span key={i} className={'viz-cell ' + (v ? 'w-kv-cache-v' : 'on') + (i === n - 1 && step > 0 ? ' viz-pop w-kv-cache-new' : '')} title={t}>{(v ? 'v' : 'k') + (i + 1)}</span>)}</div>
  </div>;
}

export default function KvCache() {
  const [step, setStep] = useState(0); // 0 = right after prefill
  const [running, setRunning] = useState(false);
  const [layers, setLayers] = useState(32);
  const [heads, setHeads] = useState(8);
  const [hd, setHd] = useState('128');
  const [ctxPow, setCtxPow] = useState(13);
  const [prec, setPrec] = useState('2');
  useTicker(running, 900, () => { if (step >= MAXSTEP) { setRunning(false); return false; } setStep(s => Math.min(s + 1, MAXSTEP)); });
  const toks = [...PROMPT, ...GEN.slice(0, step)];
  const n = toks.length;
  // K/V projections computed so far. With cache: P at prefill, then 1 per step. Without: recompute all every step.
  const withCache = P + step;
  let without = P; for (let s = 1; s <= step; s++) without += P + s;
  const ctx = 2 ** ctxPow, bytes = Number(prec);
  const perTok = 2 * layers * heads * Number(hd) * bytes;
  const total = perTok * ctx;
  return <Frame title="KV cache / decoding step by step" meta={step === 0 ? 'after prefill' : `decode step ${step}`}
    foot={step === 0 ? `Prefill: all ${P} prompt tokens are processed at once and their keys and values are stored.`
      : step >= MAXSTEP ? `Done. The cache saved ${without - withCache} K/V recomputations — with no cache the work grows quadratically with length.`
      : `Step ${step}: only the new token “${GEN[step - 1]}” computes its K and V; it attends over all ${n} cached entries. Without a cache we would recompute ${n} of them.`}>
    <p className="viz-prompt">{PROMPT.join(' ')} <b>{GEN.slice(0, step).join(' ')}</b>{step < MAXSTEP ? ' …' : ''}</p>
    <Row label={`Keys cached · ${n}`} v={false} toks={toks} step={step}/>
    <Row label={`Values cached · ${n}`} v toks={toks} step={step}/>
    <Controls>
      <Btn primary onClick={() => { if (step >= MAXSTEP) setStep(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Decode'}</Btn>
      <Btn onClick={() => { setRunning(false); setStep(s => Math.min(s + 1, MAXSTEP)); }} disabled={step >= MAXSTEP}>Step</Btn>
      <Btn onClick={() => { setRunning(false); setStep(0); }}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Cached tokens" value={n}/>
      <Stat label="K/V computed · cache" value={withCache} tone="ok"/>
      <Stat label="K/V computed · no cache" value={without} tone="bad"/>
    </Stats>
    <div className="viz-two">
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <Slider label="Layers" value={layers} min={1} max={80} onChange={setLayers}/>
        <Slider label="KV heads" value={heads} min={1} max={64} onChange={setHeads}/>
        <Slider label="Context length" value={ctxPow} min={9} max={17} onChange={setCtxPow} format={v => `${2 ** v} tokens`}/>
      </div>
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <Seg options={[{ value: '64', label: 'head dim 64' }, { value: '128', label: 'head dim 128' }]} value={hd} onChange={setHd} label="Head dimension"/>
        <Seg options={[{ value: '2', label: 'fp16' }, { value: '1', label: 'fp8' }]} value={prec} onChange={setPrec} label="Precision"/>
        <p className="w-kv-cache-formula">2 (K,V) × {layers} layers × {heads} heads × {hd} dims × {bytes} B = {human(perTok)} / token</p>
        <p className="w-kv-cache-formula">× {ctx.toLocaleString()} tokens = <b>{human(total)}</b> per sequence</p>
      </div>
    </div>
    <Stats>
      <Stat label="Per token" value={human(perTok)}/>
      <Stat label="Per sequence" value={human(total)} tone={total > 16e9 ? 'bad' : 'on'}/>
      <Stat label="Sequences in 24 GB" value={Math.floor(24e9 / total)}/>
    </Stats>
  </Frame>;
}
