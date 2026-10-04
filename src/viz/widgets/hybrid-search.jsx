import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Stats, Stat } from '../index';
import './widgets-w3.css';

// Docs with tiny hand-made "embeddings" over 4 concepts: [login/auth, account, billing, network].
const DOCS = [
  ['How to reset your password from the login page', [0.95, 0.3, 0, 0]],
  ['Two-factor codes not arriving when you sign in', [0.8, 0.3, 0, 0.2]],
  ['Locked out? Recovering access to your profile', [0.85, 0.6, 0, 0]],
  ['Update the credit card on your account', [0.1, 0.5, 0.9, 0]],
  ['Why was my invoice charged twice', [0, 0.2, 0.95, 0]],
  ['Fixing error 504 gateway timeout', [0, 0, 0, 1]],
  ['Slow connection? Check proxy and VPN settings', [0.1, 0, 0, 0.9]],
  ['Password policy rules for team admins', [0.6, 0.4, 0, 0]],
  ['Sign in with SSO from your company account', [0.8, 0.5, 0, 0.1]],
];
const QUERIES = { 'reset password': [1, 0.3, 0, 0], "can't get into my account": [0.9, 0.6, 0.05, 0], 'error 504': [0, 0, 0, 0.8] };
const STOP = new Set(['a', 'the', 'to', 'my', 'your', 'in', 'on', 'from', 'for', 'into', 'with', 'get', 'can\'t', 'why', 'how', 'was', 'when', 'and']);
const tok = s => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
const DTOK = DOCS.map(d => tok(d[0]));
const idf = t => { const df = DTOK.filter(d => d.includes(t)).length; return Math.log(1 + (DOCS.length - df + 0.5) / (df + 0.5)); };
// BM25-style keyword score (k1 = 1.2, no length norm) and cosine similarity for the vector side.
const bm25 = (q, i) => tok(q).reduce((s, t) => { const tf = DTOK[i].filter(w => w === t).length; return s + (tf ? idf(t) * (tf * 2.2) / (tf + 1.2) : 0); }, 0);
const cos = (a, b) => { const dot = a.reduce((s, v, i) => s + v * b[i], 0), n = v => Math.hypot(...v); return dot / (n(a) * n(b) || 1); };
const TOPN = 5;

function List({ title, rows, fmt }) {
  return <div className="w-hybrid-search-col"><h4>{title}</h4>
    {rows.length ? rows.map(([s, i], r) => <div key={i} className="w-hybrid-search-item"><b>{r + 1}</b><span>{DOCS[i][0]}</span><span>{fmt(s)}</span></div>) : <div className="w-hybrid-search-item">no keyword matches</div>}</div>;
}

export default function HybridSearch() {
  const [q, setQ] = useState('reset password');
  const [w, setW] = useState(0.5);
  const [k, setK] = useState(60);
  const { kw, vec } = useMemo(() => ({
    kw: DOCS.map((_, i) => [bm25(q, i), i]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, TOPN),
    vec: DOCS.map((d, i) => [cos(QUERIES[q], d[1]), i]).sort((a, b) => b[0] - a[0]).slice(0, TOPN),
  }), [q]);
  // Reciprocal Rank Fusion: score(d) = w / (k + rank_kw) + (1 − w) / (k + rank_vec); missing from a list → 0.
  const ids = [...new Set([...kw.map(x => x[1]), ...vec.map(x => x[1])])];
  const fused = ids.map(i => { const rk = kw.findIndex(x => x[1] === i) + 1, rv = vec.findIndex(x => x[1] === i) + 1;
    return { i, rk, rv, s: (rk ? w / (k + rk) : 0) + (rv ? (1 - w) / (k + rv) : 0) }; }).sort((a, b) => b.s - a.s || a.i - b.i);
  const pos = Object.fromEntries(fused.map((f, r) => [f.i, r]));
  const top = fused[0];
  const foot = w > 0.8 ? 'Mostly keyword: exact term matches dominate, so paraphrases without the words fall down the list.'
    : w < 0.2 ? 'Mostly vector: meaning wins, but exact identifiers like error codes can be outranked by merely similar topics.'
    : `Balanced fusion: “${DOCS[top.i][0]}” ranks first because it sits ${top.rk && top.rv ? `high in both lists (#${top.rk} keyword, #${top.rv} vector)` : 'at the top of one list'}. RRF uses ranks only, so the two score scales never need calibrating.`;
  return <Frame title="Hybrid search / reciprocal rank fusion" meta={`w_kw = ${w.toFixed(2)} · k = ${k}`} foot={foot}>
    <Seg options={Object.keys(QUERIES)} value={q} onChange={setQ} label="Query"/>
    <div className="w-hybrid-search-cols">
      <List title="Keyword (BM25)" rows={kw} fmt={s => s.toFixed(2)}/>
      <List title="Vector (cosine)" rows={vec} fmt={s => s.toFixed(3)}/>
    </div>
    <div className="w-hybrid-search-col"><h4>Fused ranking</h4>
      <div className="w-hybrid-search-fused" style={{ height: fused.length * 38 }}>{fused.map(f => <div key={f.i} className={'w-hybrid-search-row' + (pos[f.i] === 0 ? ' top' : '')} style={{ top: pos[f.i] * 38 }}>
        <b>{pos[f.i] + 1}</b><span className="t">{DOCS[f.i][0]}</span><span className="s">kw {f.rk || '–'} · vec {f.rv || '–'} · {(f.s * 1000).toFixed(2)}</span>
      </div>)}</div>
    </div>
    <div className="viz-two">
      <Slider label="Keyword weight" value={w} min={0} max={1} step={0.05} onChange={setW} format={v => `${(v * 100).toFixed(0)}% kw`}/>
      <Slider label="RRF constant k" value={k} min={1} max={100} onChange={setK}/>
    </div>
    <Stats>
      <Stat label="Keyword hits" value={kw.length}/>
      <Stat label="In both lists" value={fused.filter(f => f.rk && f.rv).length} tone="on"/>
      <Stat label="Top RRF score ×1000" value={(top.s * 1000).toFixed(2)}/>
    </Stats>
  </Frame>;
}
