import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Viz } from './viz';

// Renders the typed blocks described in src/course/LESSON_SPEC.md.

// Inline markup: `code`, **bold**, *italic*, [text](url).
export function Rich({ text }) {
  if (!text) return null;
  return String(text).split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.length > 3 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return part;
  });
}

// Adds .in-view once an element scrolls into view, which starts CSS animations.
export function useInView(options = { threshold: 0.25 }) {
  const ref = useRef(null), [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || seen) return;
    if (!('IntersectionObserver' in window)) { setSeen(true); return; }
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); ob.disconnect(); } }, options);
    ob.observe(el); return () => ob.disconnect();
  }, [seen]);
  return [ref, seen];
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const TONES = { note: 'Note', tip: 'Tip', warn: 'Watch out', example: 'Real-world example', analogy: 'Think of it like this' };
const TONE_ICON = { note: 'i', tip: '★', warn: '!', example: '◆', analogy: '≈' };

// ---------- Steps: an animated stepper the learner can play or click through.
function Steps({ title, items }) {
  const [at, setAt] = useState(0), [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (at >= items.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setAt(a => a + 1), 2200);
    return () => clearTimeout(t);
  }, [playing, at, items.length]);
  return <div className="b-steps">
    <div className="b-head"><span>{title || 'Step by step'}</span><span>{at + 1} / {items.length}</span></div>
    <ol className="b-steps-rail">{items.map((s, i) => <li key={i} className={i < at ? 'past' : i === at ? 'now' : ''}>
      <button onClick={() => { setAt(i); setPlaying(false); }} aria-current={i === at ? 'step' : undefined}>
        <span className="b-steps-dot">{i < at ? '✓' : i + 1}</span><span className="b-steps-label">{s.title}</span>
      </button>
    </li>)}</ol>
    <div className="b-steps-body" key={at}><strong>{items[at].title}</strong><p><Rich text={items[at].text}/></p></div>
    <div className="b-controls">
      <button onClick={() => { setAt(Math.max(0, at - 1)); setPlaying(false); }} disabled={at === 0}>← Back</button>
      <button className="primary" onClick={() => { if (at >= items.length - 1) setAt(0); setPlaying(p => !p); }}>{playing ? '❚❚ Pause' : at >= items.length - 1 ? '↺ Replay' : '▶ Play'}</button>
      <button onClick={() => { setAt(Math.min(items.length - 1, at + 1)); setPlaying(false); }} disabled={at === items.length - 1}>Next →</button>
    </div>
  </div>;
}

// ---------- Code: light syntax colouring, copy, run (typed output), walkthrough.
const KW = {
  python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print self',
  js: 'async await break case catch class const continue default delete do else export extends false finally for function if import in instanceof let new null of return switch this throw true try typeof undefined var void while yield',
};
KW.javascript = KW.ts = KW.typescript = KW.jsx = KW.js;
KW.kotlin = 'val var fun class object if else when for while return import package true false null override private public interface try catch this';
function highlight(line, lang) {
  const kws = new Set((KW[lang] || KW.python).split(' '));
  const comment = ['python', 'bash', 'shell', 'text', 'yaml'].includes(lang) ? '#' : '//';
  const out = []; let i = 0, buf = '';
  const flush = () => { if (buf) { out.push(buf); buf = ''; } };
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith(comment) && lang !== 'text') { flush(); out.push(<span key={i} className="tk-c">{rest}</span>); break; }
    const str = rest.match(/^(f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')/);
    if (str) { flush(); out.push(<span key={i} className="tk-s">{str[0]}</span>); i += str[0].length; continue; }
    const num = rest.match(/^\d[\d_.eE]*/);
    if (num && !/[\w]/.test(line[i - 1] || '')) { flush(); out.push(<span key={i} className="tk-n">{num[0]}</span>); i += num[0].length; continue; }
    const word = rest.match(/^[A-Za-z_]\w*/);
    if (word) {
      flush();
      const w = word[0], call = line[i + w.length] === '(';
      out.push(kws.has(w) ? <span key={i} className="tk-k">{w}</span> : call ? <span key={i} className="tk-f">{w}</span> : w);
      i += w.length; continue;
    }
    buf += line[i]; i++;
  }
  flush();
  return out;
}

// Python the in-browser runtime can execute: the standard library plus the
// scientific packages it ships. Code importing anything else (PyTorch, API
// clients, agent frameworks) cannot run there, so it gets no Practice button.
const RUNNABLE = new Set(['numpy', 'pandas', 'scipy', 'sklearn', 'matplotlib', 'math', 'random', 'collections', 're', 'json', 'itertools', 'functools', 'bisect', 'heapq', 'statistics', 'time', 'typing', 'dataclasses', 'string', 'textwrap', 'hashlib', 'ipaddress', 'datetime', 'enum', 'operator', 'copy', 'sys', 'os', 'abc', 'decimal', 'fractions', 'struct', 'cmath', 'difflib', 'fnmatch', 'codecs', 'array', 'queue', 'uuid', 'base64', 'io', 'pprint', 'unicodedata', 'zlib', 'contextlib', 'types', 'numbers', 'csv', 'secrets']);
export const canPractice = (lang, code) => lang === 'python' && [...code.matchAll(/^\s*(?:import|from)\s+([A-Za-z_][\w]*)/gm)].every(m => RUNNABLE.has(m[1]));
export const PRACTICE_HANDOFF = 'atlas-practice-handoff';

function CodeBlock({ lang = 'python', title, code, output, caption, walkthrough }) {
  const nav = useNavigate();
  const practise = () => {
    const name = (title || 'lesson example').toLowerCase().replace(/\.py$/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'lesson_example';
    try { sessionStorage.setItem(PRACTICE_HANDOFF, JSON.stringify({ title: name + '.py', code })); } catch {}
    nav('/practice');
  };
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code]);
  const [copied, setCopied] = useState(false), [run, setRun] = useState(0), [typed, setTyped] = useState(''), [w, setW] = useState(-1);
  const copy = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  useEffect(() => {
    if (!run || !output) return;
    if (reduced()) { setTyped(output); return; }
    let n = 0; setTyped('');
    const step = Math.max(1, Math.ceil(output.length / 90));
    const t = setInterval(() => { n += step; setTyped(output.slice(0, n)); if (n >= output.length) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [run, output]);
  const active = w >= 0 ? walkthrough[w].lines : null;
  return <figure className={'b-code' + (active ? ' walking' : '')}>
    <div className="b-code-bar">
      <span className="b-code-lang">{title || lang}</span>
      <span className="b-code-actions">
        {walkthrough?.length > 0 && <button onClick={() => setW(w >= walkthrough.length - 1 ? -1 : w + 1)}>{w < 0 ? '◎ Walk through' : w >= walkthrough.length - 1 ? '✕ End walkthrough' : `Next (${w + 2}/${walkthrough.length})`}</button>}
        {output && <button className="run" onClick={() => setRun(r => r + 1)}>▶ Run</button>}
        {canPractice(lang, code) && <button className="practise" onClick={practise} title="Open this code in the Practice editor">✎ Practice In Editor</button>}
        <button onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </span>
    </div>
    <pre><code>{lines.map((ln, i) => {
      const on = active && i + 1 >= active[0] && i + 1 <= active[1];
      return <span key={i} className={'ln' + (on ? ' on' : active ? ' dim' : '')}><span className="ln-n">{i + 1}</span>{highlight(ln, lang)}{'\n'}</span>;
    })}</code></pre>
    {active && <div className="b-code-note" key={w}><span>Lines {active[0]}{active[1] !== active[0] ? `–${active[1]}` : ''}</span><p><Rich text={walkthrough[w].note}/></p></div>}
    {output && run > 0 && <div className="b-code-out"><div className="b-code-out-bar">Output</div><pre>{typed}<span className="caret">▌</span></pre></div>}
    {output && run === 0 && <button className="b-code-hint" onClick={() => setRun(1)}>Press ▶ Run to see the real output</button>}
    {caption && <figcaption><Rich text={caption}/></figcaption>}
  </figure>;
}

// ---------- Compare: side-by-side option cards, plus an aspect table.
function Compare({ title, options, rows, verdict }) {
  const [focus, setFocus] = useState(-1), [ref, seen] = useInView();
  return <div ref={ref} className={'b-compare' + (seen ? ' in-view' : '')} style={{ '--n': options.length }}>
    <div className="b-head"><span>{title || 'Compare'}</span><span>Tap a card to focus</span></div>
    <div className="b-compare-cards">{options.map((o, i) =>
      <button key={o.name} className={'b-compare-card' + (focus === i ? ' focus' : focus >= 0 ? ' fade' : '')} style={{ '--d': `${i * 120}ms` }} onClick={() => setFocus(focus === i ? -1 : i)}>
        <span className="b-compare-tag">Option {String.fromCharCode(65 + i)}</span>
        <strong>{o.name}</strong>
        <p><Rich text={o.summary}/></p>
        {o.pros?.length > 0 && <ul className="pros">{o.pros.map(p => <li key={p}><Rich text={p}/></li>)}</ul>}
        {o.cons?.length > 0 && <ul className="cons">{o.cons.map(p => <li key={p}><Rich text={p}/></li>)}</ul>}
        {o.bestFor && <small><b>Best for:</b> <Rich text={o.bestFor}/></small>}
      </button>)}
    </div>
    {rows?.length > 0 && <div className="b-table compact"><table>
      <thead><tr><th/>{options.map((o, i) => <th key={o.name} className={focus === i ? 'focus' : ''}>{o.name}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} style={{ '--d': `${300 + i * 70}ms` }}><th scope="row"><Rich text={r[0]}/></th>{r.slice(1).map((c, j) => <td key={j} className={focus === j ? 'focus' : ''}><Rich text={c}/></td>)}</tr>)}</tbody>
    </table></div>}
    {verdict && <div className="b-compare-verdict"><span>Verdict</span><p><Rich text={verdict}/></p></div>}
  </div>;
}

// ---------- Chart: animated SVG bar / hbar / line / area / scatter.
const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const fmt = v => Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : Math.abs(v) >= 10 ? +v.toFixed(1) + '' : +v.toFixed(3) + '';
function niceTicks(min, max, count = 5) {
  if (min === max) { max = min + 1; }
  const span = max - min, step0 = span / count, mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || step0;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}
function Chart(b) {
  const [ref, seen] = useInView(), [hover, setHover] = useState(null);
  const W = 640, H = b.kind === 'hbar' ? Math.max(200, b.labels.length * 38 + 60) : 300, P = { l: b.kind === 'hbar' ? 130 : 56, r: 20, t: 16, b: 46 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const unit = b.unit || '';
  let body = null;
  if (b.kind === 'bar' || b.kind === 'hbar') {
    const all = b.series.flatMap(s => s.values), ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all));
    const lo = ticks[0], hi = ticks[ticks.length - 1], sc = v => (v - lo) / (hi - lo);
    const groups = b.labels.length, ns = b.series.length;
    if (b.kind === 'bar') {
      const gw = iw / groups, bw = Math.min(56, (gw * 0.7) / ns);
      body = <>
        {ticks.map(t => <g key={t}><line className="grid" x1={P.l} x2={W - P.r} y1={P.t + ih - sc(t) * ih} y2={P.t + ih - sc(t) * ih}/><text className="tick" x={P.l - 8} y={P.t + ih - sc(t) * ih + 4} textAnchor="end">{fmt(t)}</text></g>)}
        {b.labels.map((lab, g) => <text key={lab} className="tick" x={P.l + gw * g + gw / 2} y={H - P.b + 18} textAnchor="middle">{lab.length > 14 ? lab.slice(0, 13) + '…' : lab}</text>)}
        {b.series.map((s, si) => s.values.map((v, g) => {
          const x = P.l + gw * g + gw / 2 - (bw * ns) / 2 + bw * si, y0 = P.t + ih - sc(Math.max(0, lo)) * ih, y1 = P.t + ih - sc(v) * ih;
          return <rect key={si + '-' + g} className="bar" x={x + 2} width={bw - 4} y={Math.min(y0, y1)} height={Math.max(1, Math.abs(y0 - y1))} rx="3"
            style={{ fill: SERIES[si % 4], transformOrigin: `0 ${y0}px`, transitionDelay: `${g * 60 + si * 30}ms` }}
            onMouseEnter={() => setHover({ x: x + bw / 2, y: Math.min(y0, y1), text: `${b.labels[g]}${ns > 1 ? ' · ' + s.name : ''}: ${fmt(v)}${unit}` })} onMouseLeave={() => setHover(null)}/>;
        }))}
      </>;
    } else {
      const gh = ih / groups, bh = Math.min(26, (gh * 0.72) / ns);
      body = <>
        {ticks.map(t => <g key={t}><line className="grid" y1={P.t} y2={P.t + ih} x1={P.l + sc(t) * iw} x2={P.l + sc(t) * iw}/><text className="tick" y={H - P.b + 18} x={P.l + sc(t) * iw} textAnchor="middle">{fmt(t)}</text></g>)}
        {b.labels.map((lab, g) => <text key={lab} className="tick label" x={P.l - 10} y={P.t + gh * g + gh / 2 + 4} textAnchor="end">{lab.length > 18 ? lab.slice(0, 17) + '…' : lab}</text>)}
        {b.series.map((s, si) => s.values.map((v, g) => {
          const y = P.t + gh * g + gh / 2 - (bh * ns) / 2 + bh * si, x0 = P.l + sc(Math.max(0, lo)) * iw, x1 = P.l + sc(v) * iw;
          return <g key={si + '-' + g}><rect className="bar h" y={y + 2} height={bh - 4} x={Math.min(x0, x1)} width={Math.max(1, Math.abs(x1 - x0))} rx="3"
            style={{ fill: SERIES[si % 4], transformOrigin: `${x0}px 0`, transitionDelay: `${g * 60 + si * 30}ms` }}
            onMouseEnter={() => setHover({ x: x1, y, text: `${b.labels[g]}${ns > 1 ? ' · ' + s.name : ''}: ${fmt(v)}${unit}` })} onMouseLeave={() => setHover(null)}/>
            <text className="val" x={Math.max(x0, x1) + 6} y={y + bh / 2 + 3} style={{ transitionDelay: `${400 + g * 60}ms` }}>{fmt(v)}{unit}</text></g>;
        }))}
      </>;
    }
  } else {
    const pts = b.series.flatMap(s => s.points), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const xt = niceTicks(Math.min(...xs), Math.max(...xs)), yt = niceTicks(Math.min(b.kind === 'area' ? 0 : Infinity, ...ys), Math.max(...ys));
    const X = v => P.l + ((v - xt[0]) / (xt[xt.length - 1] - xt[0])) * iw, Y = v => P.t + ih - ((v - yt[0]) / (yt[yt.length - 1] - yt[0])) * ih;
    body = <>
      {yt.map(t => <g key={'y' + t}><line className="grid" x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)}/><text className="tick" x={P.l - 8} y={Y(t) + 4} textAnchor="end">{fmt(t)}</text></g>)}
      {xt.map(t => <text key={'x' + t} className="tick" x={X(t)} y={H - P.b + 18} textAnchor="middle">{fmt(t)}</text>)}
      {b.series.map((s, si) => {
        const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
        return <g key={s.name} style={{ '--c': SERIES[si % 4] }}>
          {b.kind === 'area' && <path className="area" d={`${d}L${X(s.points[s.points.length - 1][0])},${Y(yt[0])}L${X(s.points[0][0])},${Y(yt[0])}Z`}/>}
          {b.kind !== 'scatter' && <path className="line" d={d} pathLength="1" style={{ transitionDelay: `${si * 250}ms` }}/>}
          {s.points.map((p, i) => <circle key={i} className={'dot' + (b.kind === 'scatter' ? ' big' : '')} cx={X(p[0])} cy={Y(p[1])} r={b.kind === 'scatter' ? 5 : 3.5}
            style={{ transitionDelay: `${300 + i * (900 / s.points.length) + si * 250}ms` }}
            onMouseEnter={() => setHover({ x: X(p[0]), y: Y(p[1]), text: `${s.name ? s.name + ': ' : ''}(${fmt(p[0])}, ${fmt(p[1])}${unit})` })} onMouseLeave={() => setHover(null)}/>)}
        </g>;
      })}
    </>;
  }
  const legend = b.series.length > 1 || (b.series[0]?.name && b.kind !== 'bar' && b.kind !== 'hbar');
  return <figure ref={ref} className={'b-chart' + (seen ? ' in-view' : '')}>
    <div className="b-head"><span>{b.title}</span>{legend && <span className="legend">{b.series.map((s, i) => <i key={s.name} style={{ '--c': SERIES[i % 4] }}>{s.name}</i>)}</span>}</div>
    <div className="b-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={b.title}>
        <line className="axis" x1={P.l} x2={P.l} y1={P.t} y2={P.t + ih}/><line className="axis" x1={P.l} x2={W - P.r} y1={P.t + ih} y2={P.t + ih}/>
        {body}
        {b.xLabel && <text className="axis-label" x={P.l + iw / 2} y={H - 6} textAnchor="middle">{b.xLabel}</text>}
        {b.yLabel && b.kind !== 'hbar' && <text className="axis-label" transform={`translate(14 ${P.t + ih / 2}) rotate(-90)`} textAnchor="middle">{b.yLabel}</text>}
      </svg>
      {hover && <div className="b-tip" style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}>{hover.text}</div>}
    </div>
    {b.caption && <figcaption><Rich text={b.caption}/></figcaption>}
  </figure>;
}

// ---------- Flow: a pipeline (or loop) with a travelling pulse; click a node.
function Flow({ title, nodes, loop }) {
  const [at, setAt] = useState(0), [auto, setAuto] = useState(true), [ref, seen] = useInView();
  useEffect(() => {
    if (!seen || !auto || reduced()) return;
    const t = setInterval(() => setAt(a => (a + 1) % nodes.length), 1800);
    return () => clearInterval(t);
  }, [seen, auto, nodes.length]);
  const pick = i => { setAt(i); setAuto(false); };
  return <div ref={ref} className={'b-flow' + (loop ? ' loop' : '') + (seen ? ' in-view' : '')}>
    <div className="b-head"><span>{title || 'How it flows'}</span><button className="b-mini" onClick={() => setAuto(!auto)}>{auto ? '❚❚ Pause' : '▶ Animate'}</button></div>
    {loop
      ? <div className="b-flow-ring" style={{ '--n': nodes.length }}>
          <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="78" className="ring"/><circle cx="100" cy="100" r="78" className="ring-pulse" style={{ '--rot': `${(at / nodes.length) * 360}deg` }}/></svg>
          {nodes.map((n, i) => { const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2; return <button key={i} className={'b-flow-node' + (i === at ? ' on' : '')} style={{ left: `${50 + Math.cos(a) * 39}%`, top: `${50 + Math.sin(a) * 39}%` }} onClick={() => pick(i)}><span>{i + 1}</span>{n.label}</button>; })}
          <div className="b-flow-center">↻</div>
        </div>
      : <div className="b-flow-row">{nodes.map((n, i) => <React.Fragment key={i}>
          <button className={'b-flow-node' + (i === at ? ' on' : i < at ? ' past' : '')} style={{ '--d': `${i * 90}ms` }} onClick={() => pick(i)}><span>{i + 1}</span>{n.label}</button>
          {i < nodes.length - 1 && <span className={'b-flow-edge' + (i === at ? ' live' : i < at ? ' past' : '')}><i/></span>}
        </React.Fragment>)}</div>}
    <div className="b-flow-detail" key={at}><span>{at + 1}. {nodes[at].label}</span><p><Rich text={nodes[at].detail}/></p></div>
  </div>;
}

// ---------- Matrix: animated heat map with hover read-out.
function Matrix({ title, rows, cols, values, format = 'num', caption }) {
  const [ref, seen] = useInView(), [hover, setHover] = useState(null);
  const flat = values.flat().filter(v => v !== null), lo = Math.min(...flat), hi = Math.max(...flat);
  const show = v => v === null ? '' : format === 'pct' ? `${Math.round(v * 100)}%` : format === 'int' ? Math.round(v).toLocaleString() : (+v).toFixed(2);
  return <figure ref={ref} className={'b-matrix' + (seen ? ' in-view' : '')}>
    <div className="b-head"><span>{title}</span><span>{hover ? `${rows[hover[0]]} → ${cols[hover[1]]}: ${show(values[hover[0]][hover[1]])}` : 'Hover a cell'}</span></div>
    <div className="b-matrix-scroll"><table>
      <thead><tr><th/>{cols.map((c, j) => <th key={j} scope="col">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}><th scope="row">{r}</th>{cols.map((_, j) => {
        const v = values[i][j], k = v === null ? 0 : hi === lo ? 1 : (v - lo) / (hi - lo);
        return <td key={j} className={v === null ? 'masked' : ''} style={{ '--k': k, transitionDelay: `${(i + j) * 35}ms` }}
          onMouseEnter={() => setHover([i, j])} onMouseLeave={() => setHover(null)}>{v === null ? '—' : show(v)}</td>;
      })}</tr>)}</tbody>
    </table></div>
    {caption && <figcaption><Rich text={caption}/></figcaption>}
  </figure>;
}

function Timeline({ title, items }) {
  const [ref, seen] = useInView({ threshold: 0.1 });
  return <div ref={ref} className={'b-timeline' + (seen ? ' in-view' : '')}>
    {title && <div className="b-head"><span>{title}</span><span>{items.length} milestones</span></div>}
    <ol>{items.map((it, i) => <li key={i} style={{ '--d': `${i * 110}ms` }}><span className="when">{it.when}</span><div><strong>{it.title}</strong><p><Rich text={it.text}/></p></div></li>)}</ol>
  </div>;
}

function Formula({ expr, where, caption }) {
  return <figure className="b-formula">
    <div className="b-formula-expr">{expr}</div>
    {where?.length > 0 && <dl>{where.map(([s, m]) => <div key={s}><dt>{s}</dt><dd><Rich text={m}/></dd></div>)}</dl>}
    {caption && <figcaption><Rich text={caption}/></figcaption>}
  </figure>;
}

function Check({ question, answer }) {
  const [open, setOpen] = useState(false);
  return <div className={'b-check' + (open ? ' open' : '')}>
    <div className="b-label">Pause and think</div>
    <p className="b-check-q"><Rich text={question}/></p>
    {open ? <p className="b-check-a"><Rich text={answer}/></p> : <button onClick={() => setOpen(true)}>Reveal the answer</button>}
  </div>;
}

function Tabs({ items, ...rest }) {
  const [at, setAt] = useState(0);
  return <div className="b-tabs">
    <div className="b-tabs-bar" role="tablist">{items.map((t, i) => <button key={t.label} role="tab" aria-selected={i === at} className={i === at ? 'on' : ''} onClick={() => setAt(i)}>{t.label}</button>)}</div>
    <div className="b-tabs-body" role="tabpanel" key={at}>{items[at].blocks.map((b, i) => <Block key={i} block={b} {...rest}/>)}</div>
  </div>;
}

export function Block({ block: b }) {
  switch (b.type) {
    case 'p': return <p><Rich text={b.text}/></p>;
    case 'list': { const Tag = b.ordered ? 'ol' : 'ul'; return <Tag className="b-list">{b.items.map((x, i) => <li key={i}><Rich text={x}/></li>)}</Tag>; }
    case 'callout': return <aside className={`b-callout tone-${b.tone || 'note'}`}>
      <span className="b-callout-icon" aria-hidden="true">{TONE_ICON[b.tone] || 'i'}</span>
      <div><strong>{b.title || TONES[b.tone] || 'Note'}</strong><p><Rich text={b.text}/></p></div>
    </aside>;
    case 'steps': return <Steps {...b}/>;
    case 'code': return <CodeBlock {...b}/>;
    case 'table': return <div className="b-table">{b.caption && <div className="b-head"><span>{b.caption}</span></div>}<table>
      <thead><tr>{b.head.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Rich text={c}/></td>)}</tr>)}</tbody>
    </table></div>;
    case 'compare': return <Compare {...b}/>;
    case 'chart': return <Chart {...b}/>;
    case 'flow': return <Flow {...b}/>;
    case 'matrix': return <Matrix {...b}/>;
    case 'timeline': return <Timeline {...b}/>;
    case 'formula': return <Formula {...b}/>;
    case 'viz': return <figure className="b-viz"><Viz name={b.name}/>{b.caption && <figcaption><Rich text={b.caption}/></figcaption>}</figure>;
    case 'check': return <Check {...b}/>;
    case 'deeper': return <details className="b-deeper"><summary><span>Go deeper</span>{b.title}</summary>
      <div className="b-deeper-body">{b.blocks.map((x, i) => <Block key={i} block={x}/>)}</div></details>;
    case 'tabs': return <Tabs {...b}/>;
    default: return null;
  }
}
