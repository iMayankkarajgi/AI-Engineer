import React, { useState } from 'react';
import { Frame, Slider, Bars, Stats, Stat } from '../index';
import './widgets-w3.css';

// Illustrative pricing: $3 per million input tokens; cache write costs 1.25×, cache read 0.1×.
// Prefill latency: ~20 µs per freshly processed token, ~1 µs per token read from cache, plus fixed overhead.
const PRICE = 3 / 1e6, WRITE = 1.25, READ = 0.1, MIN_CACHE = 1024;
const fresh = 20e-6, cached = 1e-6, base = 0.15;

export default function PromptCaching() {
  const [share, setShare] = useState(0.8);
  const [len, setLen] = useState(20000);
  const [reqs, setReqs] = useState(10);
  const pre = Math.round(len * share), suf = len - pre;
  const on = pre >= MIN_CACHE; // providers only cache prefixes above a minimum length
  const costPlain = len * PRICE;
  const costWrite = on ? (pre * WRITE + suf) * PRICE : costPlain;
  const costHit = on ? (pre * READ + suf) * PRICE : costPlain;
  const latPlain = base + len * fresh, latHit = on ? base + pre * cached + suf * fresh : latPlain;
  const totalPlain = reqs * costPlain, totalCached = costWrite + (reqs - 1) * costHit;
  const saving = totalPlain > 0 ? 1 - totalCached / totalPlain : 0;
  const $ = v => (v < 0.01 ? `${(v * 100).toFixed(2)}¢` : `$${v.toFixed(3)}`);
  const foot = !on ? `The shared prefix is only ${pre} tokens — below the ${MIN_CACHE}-token minimum, so nothing is cached and every request pays full price.`
    : reqs === 1 ? 'A single request only pays the 25% cache-write premium — caching helps when the same prefix is reused.'
    : `The first request writes ${pre.toLocaleString()} prefix tokens to the cache; the next ${reqs - 1} read them at 10% of the price and skip their prefill, cutting time-to-first-token ${(latPlain / latHit).toFixed(1)}×.`;
  return <Frame title="Prompt caching / reusing a shared prefix" meta={`${(share * 100).toFixed(0)}% shared · ${reqs} requests`} foot={foot}>
    <div className="w-prompt-caching-strip" role="img" aria-label={`Prompt of ${len} tokens, ${pre} shared prefix tokens and ${suf} new tokens`}>
      <span className="w-prompt-caching-pre" style={{ flexBasis: `${share * 100}%` }}>{share > 0.2 ? `system + tools + docs · ${pre.toLocaleString()}` : ''}</span>
      <span className="w-prompt-caching-suf" style={{ flexBasis: `${(1 - share) * 100}%` }}>{share < 0.8 ? `new turn · ${suf.toLocaleString()}` : ''}</span>
    </div>
    <div className="viz-row">{Array.from({ length: Math.min(reqs, 20) }, (_, i) => <span key={`${reqs}-${i}`} className={'viz-chip viz-pop ' + (!on ? '' : i === 0 ? 'on' : 'ok')} style={{ animationDelay: `${i * 40}ms` }}>#{i + 1} {!on ? 'full' : i === 0 ? 'write' : 'hit'}</span>)}{reqs > 20 && <span className="viz-chip">+{reqs - 20} more</span>}</div>
    <div className="viz-two">
      <div><div className="viz-label" style={{ marginBottom: 6, color: 'var(--ink-3)' }}>Cost per request</div>
        <Bars items={[{ label: 'No cache', value: costPlain, tone: 'off', note: $(costPlain) }, { label: 'Cache write', value: costWrite, note: $(costWrite) }, { label: 'Cache hit', value: costHit, tone: 'on', note: $(costHit) }]} max={Math.max(costPlain, costWrite)}/></div>
      <div><div className="viz-label" style={{ marginBottom: 6, color: 'var(--ink-3)' }}>Time to first token</div>
        <Bars items={[{ label: 'No cache', value: latPlain, tone: 'off', note: `${latPlain.toFixed(2)}s` }, { label: 'Cache hit', value: latHit, tone: 'on', note: `${latHit.toFixed(2)}s` }]} max={latPlain}/></div>
    </div>
    <Slider label="Shared prefix share" value={share} min={0} max={1} step={0.05} onChange={setShare} format={v => `${(v * 100).toFixed(0)}%`}/>
    <div className="viz-two">
      <Slider label="Prompt length" value={len} min={1000} max={100000} step={1000} onChange={setLen} format={v => `${(v / 1000).toFixed(0)}k tokens`}/>
      <Slider label="Requests reusing it" value={reqs} min={1} max={50} onChange={setReqs}/>
    </div>
    <Stats>
      <Stat label="Total, no cache" value={$(totalPlain)}/>
      <Stat label="Total, cached" value={$(totalCached)} tone="on"/>
      <Stat label="Saving" value={`${(saving * 100).toFixed(0)}%`} tone={saving > 0 ? 'ok' : saving < 0 ? 'bad' : ''}/>
    </Stats>
  </Frame>;
}
