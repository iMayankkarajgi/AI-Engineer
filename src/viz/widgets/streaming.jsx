import React, { useState } from 'react';
import { Frame, Slider, Controls, Btn, Stats, Stat, useTicker } from '../index';
import './widgets-w2.css';

// Same model, same tokens, same total time — only the delivery differs.
const TEXT = 'Streaming sends each token to the client as soon as the model produces it, so the reader starts reading while the rest of the answer is still being generated. The total time does not change.'.split(' ');
const N = TEXT.length, TICK = 50;
const sec = ms => `${(ms / 1000).toFixed(2)} s`;

export default function Streaming() {
  const [ttft, setTtft] = useState(600);
  const [tps, setTps] = useState(15);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const per = 1000 / tps;
  const total = ttft + N * per;
  useTicker(running, TICK, () => { if (t >= total) { setRunning(false); return false; } setT(v => Math.min(v + TICK, total)); });
  const shown = t < ttft ? 0 : Math.min(N, Math.floor((t - ttft) / per) + 1);
  const blockingDone = t >= total;
  const reset = () => { setRunning(false); setT(0); };
  const change = set => v => { set(v); reset(); };
  const foot = t === 0 ? 'Press play. Both sides run the same model at the same speed.'
    : t < ttft ? `Prefill: the model is reading the prompt. Nobody has seen anything yet (${sec(t)}).`
    : !blockingDone ? `The streaming user has been reading for ${sec(t - ttft)}; the blocking user is still staring at a spinner.`
    : `Both finished at ${sec(total)}. Streaming showed the first word after ${sec(ttft)} — ${(total / ttft).toFixed(1)}× sooner.`;
  return <Frame title="Streaming vs blocking / time to first token" meta={`t = ${sec(t)}`} foot={foot}>
    <div className="viz-two">
      <div className="w-streaming-pane" aria-live="polite">
        <small>Blocking response</small>
        <div className="w-streaming-text">{blockingDone ? TEXT.join(' ') : <span className="w-streaming-wait">{t > 0 ? '⏳ waiting for the full answer…' : '—'}</span>}</div>
        <div className="w-streaming-bar"><i className="alt" style={{ width: `${(blockingDone ? 100 : 0)}%` }}/></div>
      </div>
      <div className="w-streaming-pane">
        <small>Streamed tokens</small>
        <div className="w-streaming-text">{shown === 0 ? <span className="w-streaming-wait">{t > 0 ? 'prefill…' : '—'}</span> : TEXT.slice(0, shown).map((w, i) => <span key={i}>{w} </span>)}</div>
        <div className="w-streaming-bar"><i style={{ width: `${(shown / N) * 100}%` }}/></div>
      </div>
    </div>
    <svg viewBox="0 0 600 64" className="viz-svg" role="img" aria-label={`Timeline: first token at ${sec(ttft)}, finished at ${sec(total)}`}>
      <rect x="20" y="14" width={560 * ttft / total} height="14" rx="3" style={{ fill: 'var(--surface-3)' }}/>
      <rect x={20 + 560 * ttft / total} y="14" width={560 * (1 - ttft / total)} height="14" rx="3" style={{ fill: 'var(--accent)', opacity: 0.35 }}/>
      <line x1={20 + 560 * Math.min(t, total) / total} x2={20 + 560 * Math.min(t, total) / total} y1="6" y2="36" style={{ stroke: 'var(--ink)', strokeWidth: 2 }}/>
      <line x1={20 + 560 * ttft / total} x2={20 + 560 * ttft / total} y1="10" y2="40" className="viz-guide"/>
      <text x={20 + 560 * ttft / total} y="54" textAnchor="middle" className="viz-label">TTFT {sec(ttft)}</text>
      <text x="580" y="54" textAnchor="end" className="viz-label">total {sec(total)}</text>
      <text x="20" y="54" className="viz-label">0</text>
    </svg>
    <Slider label="Time to first token (prefill)" value={ttft} min={100} max={3000} step={100} onChange={change(setTtft)} format={v => `${v} ms`}/>
    <Slider label="Generation speed" value={tps} min={4} max={80} onChange={change(setTps)} format={v => `${v} tokens/s`}/>
    <Controls>
      <Btn primary onClick={() => { if (t >= total) setT(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={reset}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="TTFT · streaming" value={sec(ttft)} tone="ok"/>
      <Stat label="TTFT · blocking" value={sec(total)} tone="bad"/>
      <Stat label="Total time (both)" value={sec(total)}/>
      <Stat label="Tokens shown" value={`${shown} / ${N}`}/>
    </Stats>
  </Frame>;
}
