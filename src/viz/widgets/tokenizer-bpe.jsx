import React, { useState } from 'react';
import { Frame, Controls, Btn, Stats, Stat, Bars, useTicker } from '../index';

// Real Byte Pair Encoding on the classic toy corpus. Words start as characters plus an
// end-of-word marker "_"; each merge fuses the most frequent adjacent pair everywhere.
const CORPUS = [['low', 5], ['lower', 2], ['newest', 6], ['widest', 3]];
const MAX_MERGES = 10;
function pairCounts(words) {
  const m = new Map();
  words.forEach(({ syms, n }) => { for (let i = 0; i < syms.length - 1; i++) { const k = syms[i] + ' ' + syms[i + 1]; m.set(k, (m.get(k) || 0) + n); } });
  return [...m.entries()].map(([k, c]) => ({ pair: k.split(' '), c })).sort((a, b) => b.c - a.c); // stable: ties keep first-seen order
}
const STATES = (() => {
  let words = CORPUS.map(([w, n]) => ({ syms: [...w, '_'], n }));
  const vocab = [...new Set(words.flatMap(w => w.syms))], out = [{ words, vocab: [...vocab], merge: null, pairs: pairCounts(words) }];
  for (let k = 0; k < MAX_MERGES; k++) {
    const pairs = out[out.length - 1].pairs; if (!pairs.length || pairs[0].c < 2) break;
    const [a, b] = pairs[0].pair, tok = a + b;
    words = words.map(({ syms, n }) => { const s = []; for (let i = 0; i < syms.length; i++) { if (syms[i] === a && syms[i + 1] === b) { s.push(tok); i++; } else s.push(syms[i]); } return { syms: s, n }; });
    vocab.push(tok);
    out.push({ words, vocab: [...vocab], merge: { a, b, tok, c: pairs[0].c }, pairs: pairCounts(words) });
  }
  return out;
})();
const tokens = st => st.words.reduce((s, w) => s + w.syms.length * w.n, 0);

export default function TokenizerBpe() {
  const [k, setK] = useState(0);
  const [running, setRunning] = useState(false);
  const last = STATES.length - 1, st = STATES[k];
  useTicker(running, 1100, () => { if (k + 1 >= last) setRunning(false); setK(x => Math.min(x + 1, last)); if (k + 1 >= last) return false; });
  const next = st.pairs[0];
  const foot = k === 0 ? `Start: every word is split into single characters — ${tokens(st)} tokens across the corpus. The most frequent pair is (${next.pair.join(', ')}) with ${next.c} occurrences.`
    : `Merge ${k}: (${st.merge.a}, ${st.merge.b}) → “${st.merge.tok}” appeared ${st.merge.c} times, so the corpus shrinks to ${tokens(st)} tokens and the vocabulary grows to ${st.vocab.length}.`
      + (k === last ? ' No pair occurs twice any more, so training stops.' : '');
  return <Frame title="Byte Pair Encoding / learning merges" meta={`merge ${k} / ${last}`} foot={foot}>
    <div style={{ display: 'grid', gap: 8 }}>{st.words.map(({ syms, n }, wi) => <div key={wi} className="viz-row">
      <span className="viz-label" style={{ minWidth: 34 }}>×{n}</span>
      {syms.map((s, i) => <span key={`${k}-${i}`} className={'viz-chip' + (st.merge && s === st.merge.tok ? ' on viz-pop' : '')}>{s}</span>)}
    </div>)}</div>
    <Controls>
      <Btn primary onClick={() => { if (k >= last) setK(0); setRunning(r => !r); }}>{running ? '❚❚ Pause' : k >= last ? '↻ Replay' : '▶ Play merges'}</Btn>
      <Btn onClick={() => setK(x => Math.min(x + 1, last))} disabled={k >= last}>Next merge</Btn>
      <Btn onClick={() => setK(x => Math.max(x - 1, 0))} disabled={k === 0}>Back</Btn>
      <Btn onClick={() => { setRunning(false); setK(0); }}>↺ Reset</Btn>
    </Controls>
    <div className="viz-two">
      <div><small className="viz-label">Adjacent pair counts (top 5) — the top one is merged next</small>
        {st.pairs.length ? <Bars items={st.pairs.slice(0, 5).map((p, i) => ({ label: `${p.pair[0]} + ${p.pair[1]}`, value: p.c, tone: i === 0 && p.c >= 2 ? 'on' : '', note: `${p.c}` }))} format={v => v.toFixed(0)}/> : <p className="viz-label">no pairs left</p>}</div>
      <div><small className="viz-label">Vocabulary ({st.vocab.length})</small>
        <div className="viz-row" style={{ marginTop: 6 }}>{st.vocab.map(v => <span key={v} className={'viz-chip' + (st.merge && v === st.merge.tok ? ' on' : '')}>{v}</span>)}</div></div>
    </div>
    <div className="viz-log">{STATES.slice(1, k + 1).map((s, i) => <div key={i}>{i + 1}. {s.merge.a} + {s.merge.b} → {s.merge.tok} <span className="dim">({s.merge.c}×)</span></div>)}{k === 0 && <span className="dim">merge rules will appear here, in the order they are learned</span>}</div>
    <Stats><Stat label="Merges learned" value={k}/><Stat label="Vocabulary size" value={st.vocab.length} tone="on"/><Stat label="Corpus tokens" value={tokens(st)} tone="ok"/><Stat label="Characters" value={tokens(STATES[0])}/></Stats>
  </Frame>;
}
