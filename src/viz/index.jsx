import React, { useEffect, useRef, useState } from 'react';
import { VIZ } from '../course/vizNames';

// Interactive widgets. Each lives in ./widgets/<name>.jsx with a default
// export and is loaded on demand. Shared building blocks are exported below;
// see widgets/temperature.jsx for the reference pattern.
import { supabase } from '../supabase';
// The labs' styles are part of the site's stylesheet, so a lab looks right however its code arrives.
import './widgets/widgets-w1.css';
import './widgets/widgets-w2.css';
import './widgets/widgets-w3.css';

const loaders = import.meta.glob('./widgets/*.jsx');
const cache = {};
// With accounts in the cloud, a lab's code is not in the site's public files.
// It is fetched from /api/lab, which checks the learner's plan first, and then
// run from memory. Its one import (the site's main script) is pointed back at
// the real file so the lab shares the page's React.
const SERVED = import.meta.env.PROD && import.meta.env.VITE_STATIC !== '1' && !!supabase;
async function fromServer(name, bundled) {
  const token = (await supabase.auth.getSession()).data.session?.access_token || '';
  const r = await fetch(`/api/lab?name=${encodeURIComponent(name)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    if (d.bundled && bundled) return bundled();   // this build keeps its labs in the bundle
    return { default: () => <div className="viz viz-missing"><strong>{d.locked ? '🔒 This interactive is locked' : 'This interactive could not load'}</strong><p>{d.reason === 'signin' ? 'Sign in to open it.' : d.locked ? 'It opens with a plan that includes this lesson or lab.' : 'Please try again in a moment.'}</p></div> };
  }
  const base = new URL(import.meta.env.BASE_URL + 'assets/', location.origin).href;
  const code = (await r.text()).replace(/(from\s*|import\s*\(?\s*)(["'])\.\//g, (_, pre, q) => pre + q + base);
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  try { return await import(/* @vite-ignore */ url); } finally { URL.revokeObjectURL(url); }
}
function lazyWidget(name) {
  const load = loaders[`./widgets/${name}.jsx`];
  if (!load) return null;
  return cache[name] ||= React.lazy(SERVED ? () => fromServer(name, load) : load);
}
// A learner who signs in, or whose plan changes, gets a fresh try at labs that were locked.
export const forgetLabs = () => { for (const k of Object.keys(cache)) delete cache[k]; };

class Boundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="viz viz-missing">This interactive could not load. {this.props.desc}</div> : this.props.children; }
}

export function Viz({ name }) {
  const W = lazyWidget(name);
  if (!W) return <div className="viz viz-missing"><strong>Interactive: {name}</strong><p>{VIZ[name]}</p></div>;
  return <Boundary desc={VIZ[name]}><React.Suspense fallback={<div className="viz viz-loading">Loading interactive…</div>}><W/></React.Suspense></Boundary>;
}

// ---- Kit ------------------------------------------------------------------

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Card with a mono header strip, body and an optional footer read-out.
export function Frame({ title, meta, foot, children, className = '' }) {
  return <div className={'viz ' + className}>
    <div className="viz-head"><span>{title}</span>{meta && <span>{meta}</span>}</div>
    <div className="viz-body">{children}</div>
    {foot && <div className="viz-foot">{foot}</div>}
  </div>;
}

export function Slider({ label, value, min, max, step = 1, onChange, format = v => v }) {
  return <label className="viz-slider">
    <span className="viz-slider-top"><span>{label}</span><b>{format(value)}</b></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/>
  </label>;
}

// Segmented control: options is an array of strings or { value, label }.
export function Seg({ options, value, onChange, label }) {
  return <div className="viz-seg" role="group" aria-label={label}>{options.map(o => {
    const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
    return <button key={v} className={v === value ? 'on' : ''} aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>;
  })}</div>;
}

export function Controls({ children }) { return <div className="viz-controls">{children}</div>; }
export function Btn({ children, onClick, primary, disabled }) { return <button className={'viz-btn' + (primary ? ' primary' : '')} onClick={onClick} disabled={disabled}>{children}</button>; }

export function Stat({ label, value, tone }) { return <div className={'viz-stat' + (tone ? ' ' + tone : '')}><small>{label}</small><strong>{value}</strong></div>; }
export function Stats({ children }) { return <div className="viz-stats">{children}</div>; }

// Animated horizontal bars. items: [{ label, value, tone?: 'on'|'off'|'ok'|'bad', note? }]
export function Bars({ items, max, format = v => v.toFixed(2) }) {
  const top = max ?? Math.max(...items.map(i => Math.abs(i.value)), 1e-9);
  return <div className="viz-bars">{items.map(it => <div key={it.label} className={'viz-bar ' + (it.tone || '')}>
    <span className="viz-bar-label">{it.label}</span>
    <span className="viz-bar-track"><i style={{ width: `${Math.min(100, (Math.abs(it.value) / top) * 100)}%` }}/></span>
    <span className="viz-bar-val">{it.note ?? format(it.value)}</span>
  </div>)}</div>;
}

// Calls fn every ms while running is true. fn returns false to stop.
export function useTicker(running, ms, fn) {
  const saved = useRef(fn); saved.current = fn;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => { if (saved.current() === false) clearInterval(t); }, reducedMotion() ? Math.max(ms, 400) : ms);
    return () => clearInterval(t);
  }, [running, ms]);
}

// Small deterministic RNG so widgets look the same on every visit.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export const softmax = (xs, t = 1) => { const m = Math.max(...xs.map(x => x / t)); const e = xs.map(x => Math.exp(x / t - m)); const z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };

export function useStateReset(initial, deps) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), deps); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, setV];
}
