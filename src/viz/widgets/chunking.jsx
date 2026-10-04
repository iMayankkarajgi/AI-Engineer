import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Stats, Stat } from '../index';
import './widgets-w3.css';

const DOC = 'Retrieval-augmented generation starts by splitting documents into chunks. Each chunk is embedded and stored in a vector index. At question time the closest chunks are retrieved and pasted into the prompt. If chunks are too small, a single fact can be split across two pieces and neither one makes sense alone. If chunks are too large, the embedding blurs many topics together and retrieval gets less precise. Overlap repeats a few words from the end of one chunk at the start of the next, so a sentence that straddles a boundary is still whole somewhere. Overlap costs storage, because the repeated words are embedded twice. Sentence-aware splitting only cuts at sentence ends, which keeps ideas intact but makes chunk sizes uneven. Most teams start with a few hundred tokens and a small overlap, then tune both on real questions.';
const SENTS = DOC.match(/[^.!?]+[.!?]/g).map(s => s.trim().split(/\s+/));
const WORDS = SENTS.flat();
const N = WORDS.length;
const BOUNDS = SENTS.reduce((b, s) => [...b, b[b.length - 1] + s.length], [0]); // sentence start indices + N
const COL = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const tint = c => `color-mix(in srgb, ${COL[c % 4]} 26%, transparent)`;

function chunk(mode, size, overlap) {
  const out = [];
  if (mode === 'fixed') {
    const step = Math.max(1, size - overlap);
    for (let s = 0; s < N; s += step) { const e = Math.min(N, s + size); out.push([s, e]); if (e === N) break; }
    return out;
  }
  // Sentence-aware: end at the last sentence boundary that fits; restart at a boundary inside the overlap window.
  let s = 0;
  while (s < N) {
    const fit = BOUNDS.filter(b => b > s && b - s <= size);
    const prev = out.length ? out[out.length - 1][1] : 0;
    let e = fit.length ? fit[fit.length - 1] : BOUNDS.find(b => b > s);
    if (e <= prev) e = BOUNDS.find(b => b > prev); // always add at least one new sentence
    out.push([s, e]);
    if (e === N) break;
    const back = overlap > 0 ? BOUNDS.find(b => b > s && b >= e - overlap) : e;
    s = back !== undefined && back < e ? back : e;
  }
  return out;
}

export default function Chunking() {
  const [mode, setMode] = useState('fixed');
  const [size, setSize] = useState(30);
  const [overlap, setOverlap] = useState(5);
  const [focus, setFocus] = useState(null);
  const ov = Math.min(overlap, size - 1);
  const chunks = useMemo(() => chunk(mode, size, ov), [mode, size, ov]);
  const owners = WORDS.map((_, i) => chunks.reduce((a, [s, e], c) => (i >= s && i < e ? [...a, c] : a), []));
  const ends = new Set(chunks.map(c => c[1] - 1));
  const midCuts = chunks.filter(([, e]) => e < N && !BOUNDS.includes(e)).length;
  const stored = chunks.reduce((s, [a, b]) => s + b - a, 0);
  const lens = chunks.map(([a, b]) => b - a);
  const f = focus !== null && focus < chunks.length ? focus : null;
  const foot = f !== null ? `Chunk #${f + 1}: words ${chunks[f][0] + 1}–${chunks[f][1]} (${lens[f]} words). Click it again to show all chunks.`
    : midCuts > 0 ? `${chunks.length} chunks. ${midCuts} boundaries (red marks) cut a sentence in half${ov ? '; the overlap repeats the cut words in the next chunk.' : ' — try adding overlap or sentence-aware splitting.'}`
    : `${chunks.length} chunks and no sentence is cut in half${mode === 'sentence' ? ', but chunk sizes now vary' : ''}. Striped words appear in two chunks (overlap).`;
  return <Frame title="Chunking / splitting a document for retrieval" meta={`${chunks.length} chunks · ${mode}`} foot={foot}>
    <Seg options={[{ value: 'fixed', label: 'Fixed word windows' }, { value: 'sentence', label: 'Sentence-aware' }]} value={mode} onChange={setMode} label="Splitting strategy"/>
    <div className="w-chunking-doc" aria-label="Document coloured by chunk">{WORDS.map((w, i) => {
      const o = owners[i], bg = o.length > 1 ? `repeating-linear-gradient(135deg, ${tint(o[0])} 0 5px, ${tint(o[1])} 5px 10px)` : o.length ? tint(o[0]) : 'none';
      const dim = f !== null && !o.includes(f);
      return <React.Fragment key={i}><span className={'w-chunking-word' + (dim ? ' dim' : '') + (ends.has(i) && i < N - 1 && !BOUNDS.includes(i + 1) ? ' cut' : '')} style={{ background: bg }}>{w}</span>{' '}</React.Fragment>;
    })}</div>
    <div className="viz-row">{chunks.map((c, i) => <button key={i} className={'viz-chip w-chunking-chip' + (f === i ? ' on' : '')} style={{ borderColor: COL[i % 4] }} onClick={() => setFocus(f === i ? null : i)} aria-pressed={f === i}>#{i + 1} · {lens[i]}w</button>)}</div>
    <div className="viz-two">
      <Slider label="Chunk size" value={size} min={8} max={80} onChange={v => { setSize(v); setFocus(null); }} format={v => `${v} words`}/>
      <Slider label="Overlap" value={ov} min={0} max={20} onChange={v => { setOverlap(v); setFocus(null); }} format={v => `${v} words`}/>
    </div>
    <Stats>
      <Stat label="Chunks" value={chunks.length} tone="on"/>
      <Stat label="Size range" value={`${Math.min(...lens)}–${Math.max(...lens)} w`}/>
      <Stat label="Mid-sentence cuts" value={midCuts} tone={midCuts ? 'bad' : 'ok'}/>
      <Stat label="Stored words" value={`${stored} (${(stored / N).toFixed(2)}×)`}/>
    </Stats>
  </Frame>;
}
