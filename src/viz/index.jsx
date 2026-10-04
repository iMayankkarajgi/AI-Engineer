import React, { useEffect, useRef, useState } from 'react';
import { VIZ } from '../course/vizNames';

// Interactive widgets. Each lives in ./widgets/<name>.jsx with a default
// export and is loaded on demand. Shared building blocks are exported below;
// see widgets/temperature.jsx for the reference pattern.
const loaders = import.meta.glob('./widgets/*.jsx');
const cache = {};
function lazyWidget(name) {
  const load = loaders[`./widgets/${name}.jsx`];
  if (!load) return null;
  return cache[name] ||= React.lazy(load);
}

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
