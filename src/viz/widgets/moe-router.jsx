import React, { useState } from 'react';
import { Frame, Seg, Controls, Btn, Bars, Stats, Stat, useTicker, rng, softmax } from '../index';
import './widgets-w2.css';

// Router = linear layer (token embedding · W_r) → softmax over 8 experts → keep top-k, renormalize gates.
const TOK = ['The', 'quick', 'fox', 'jumps', 'over', '42', 'lazy', 'dogs'];
const E = 8, D = 6;
const R = rng(11);
const EMB = TOK.map(() => Array.from({ length: D }, () => R() * 2 - 1));
const WR = Array.from({ length: D }, () => Array.from({ length: E }, () => R() * 2 - 1));
const PROBS = EMB.map(x => softmax(WR[0].map((_, e) => 1.8 * x.reduce((s, xi, d) => s + xi * WR[d][e], 0))));
const SHARED = 1.6, EXPERT = 5.6; // billions; ≈ Mixtral-8x7B shape
const route = (p, k) => p.map((v, e) => [v, e]).sort((a, b) => b[0] - a[0]).slice(0, k);
const EY = e => 22 + e * 30;

export default function MoeRouter() {
  const [k, setK] = useState(2);
  const [cur, setCur] = useState(0);
  const [running, setRunning] = useState(false);
  useTicker(running, 1100, () => { if (cur >= TOK.length - 1) { setRunning(false); return false; } setCur(c => Math.min(c + 1, TOK.length - 1)); });
  const p = PROBS[cur];
  const chosen = route(p, k);
  const z = chosen.reduce((s, c) => s + c[0], 0) || 1;
  const gates = Object.fromEntries(chosen.map(([v, e]) => [e, v / z]));
  const load = Array(E).fill(0);
  PROBS.slice(0, cur + 1).forEach(pp => route(pp, k).forEach(([, e]) => { load[e]++; }));
  const total = SHARED + E * EXPERT, active = SHARED + k * EXPERT;
  const meanLoad = ((cur + 1) * k) / E;
  const imb = Math.max(...load) / meanLoad;
  return <Frame title="Mixture of experts / the router" meta={`token ${cur + 1} of ${TOK.length} · top-${k}`}
    foot={`“${TOK[cur]}” is sent to ${chosen.map(([, e]) => `expert ${e + 1} (${(gates[e] * 100).toFixed(0)}%)`).join(' and ')}. Only ${k} of ${E} expert FFNs run for this token, so it uses ${active.toFixed(1)}B of ${total.toFixed(1)}B parameters.`}>
    <Seg options={[1, 2, 4].map(v => ({ value: String(v), label: `top-${v}` }))} value={String(k)} onChange={v => setK(Number(v))} label="Experts per token"/>
    <div className="viz-row" role="group" aria-label="Choose token">
      {TOK.map((t, i) => <button key={i} className={'viz-chip' + (i === cur ? ' on' : i < cur ? ' ok' : '')} aria-pressed={i === cur} onClick={() => { setRunning(false); setCur(i); }}>{t}</button>)}
    </div>
    <svg viewBox="0 0 600 260" className="viz-svg" role="img" aria-label={`Token ${TOK[cur]} routed to experts ${chosen.map(c => c[1] + 1).join(', ')}`}>
      <rect x="20" y="108" width="100" height="40" rx="8" className="viz-node on"/>
      <text x="70" y="133" textAnchor="middle" className="viz-label" style={{ fill: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>{TOK[cur]}</text>
      <line x1="120" y1="128" x2="200" y2="128" className="viz-edge on"/>
      <rect x="200" y="98" width="90" height="60" rx="30" className="viz-node"/>
      <text x="245" y="132" textAnchor="middle" className="viz-label">router</text>
      {Array.from({ length: E }, (_, e) => {
        const on = e in gates;
        return <g key={e}>
          <path d={`M290,128 C360,128 380,${EY(e) + 12} 440,${EY(e) + 12}`} fill="none" className={'viz-edge' + (on ? ' on' : '')} style={{ strokeWidth: on ? 2 + 8 * gates[e] : 1, opacity: on ? 1 : 0.35 }}/>
          <rect x="440" y={EY(e)} width="90" height="24" rx="6" className={'viz-node' + (on ? ' on' : '')}/>
          <text x="485" y={EY(e) + 16} textAnchor="middle" className="viz-label" style={{ fill: on ? 'var(--ink)' : undefined }}>expert {e + 1}</text>
          <rect x="536" y={EY(e) + 4} width={Math.min(60, load[e] * 8)} height="16" rx="3" style={{ fill: 'var(--s3)', opacity: 0.7, transition: 'width .4s' }}/>
          <text x="540" y={EY(e) + 16} className="viz-label" style={{ fill: 'var(--ink)' }}>{load[e]}</text>
        </g>;
      })}
      <text x="536" y="14" className="viz-label">load</text>
    </svg>
    <Bars items={p.map((v, e) => ({ label: `expert ${e + 1}`, value: v, tone: e in gates ? 'on' : 'off', note: e in gates ? `${(v * 100).toFixed(0)}% → ${(gates[e] * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%` }))} max={Math.max(...p)}/>
    <Controls>
      <Btn primary onClick={() => { if (cur >= TOK.length - 1) setCur(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Route sentence'}</Btn>
      <Btn onClick={() => { setRunning(false); setCur(c => Math.min(c + 1, TOK.length - 1)); }} disabled={cur >= TOK.length - 1}>Next token</Btn>
      <Btn onClick={() => { setRunning(false); setCur(0); }}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Total params" value={`${total.toFixed(1)}B`}/>
      <Stat label="Active / token" value={`${active.toFixed(1)}B`} tone="on"/>
      <Stat label="Active share" value={`${((active / total) * 100).toFixed(0)}%`}/>
      <Stat label="Load imbalance" value={`${imb.toFixed(2)}× mean`} tone={imb > 2 ? 'bad' : ''}/>
    </Stats>
  </Frame>;
}
