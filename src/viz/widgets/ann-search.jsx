import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, rng } from '../index';
import './widgets-w3.css';

const W = 560, H = 340, K = 5, NLIST = 8;
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const clamp = v => Math.max(0.02, Math.min(0.98, v));
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
// 180 "embeddings" in 7 loose groups.
const PTS = (() => { const r = rng(3), c = Array.from({ length: 7 }, () => [0.12 + r() * 0.76, 0.12 + r() * 0.76]);
  return Array.from({ length: 180 }, (_, i) => [clamp(c[i % 7][0] + gauss(r) * 0.09), clamp(c[i % 7][1] + gauss(r) * 0.09)]); })();
// IVF index build: real k-means (Lloyd's) into NLIST inverted lists.
const IVF = (() => {
  let cent = Array.from({ length: NLIST }, (_, i) => PTS[i * 21]), assign = [];
  for (let it = 0; it < 15; it++) {
    assign = PTS.map(p => cent.reduce((best, c, j) => (d2(p, c) < d2(p, cent[best]) ? j : best), 0));
    cent = cent.map((c, j) => { const m = PTS.filter((_, i) => assign[i] === j); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : c; });
  }
  return { cent, assign };
})();
const PRESETS = [[0.5, 0.5], [0.2, 0.25], [0.8, 0.7], [0.62, 0.2]];

export default function AnnSearch() {
  const [q, setQ] = useState([0.5, 0.5]);
  const [mode, setMode] = useState('ivf');
  const [nprobe, setNprobe] = useState(2);
  const [preset, setPreset] = useState(0);
  const exact = useMemo(() => PTS.map((p, i) => [d2(p, q), i]).sort((a, b) => a[0] - b[0]).slice(0, K).map(x => x[1]), [q]);
  const order = useMemo(() => IVF.cent.map((c, j) => [d2(c, q), j]).sort((a, b) => a[0] - b[0]).map(x => x[1]), [q]);
  const probed = new Set(mode === 'brute' ? order : order.slice(0, nprobe));
  const cands = PTS.map((_, i) => i).filter(i => probed.has(IVF.assign[i]));
  const found = cands.map(i => [d2(PTS[i], q), i]).sort((a, b) => a[0] - b[0]).slice(0, K).map(x => x[1]);
  const hit = found.filter(i => exact.includes(i)).length, recall = hit / K;
  const comps = mode === 'brute' ? PTS.length : NLIST + cands.length;
  const pick = e => { const r = e.currentTarget.getBoundingClientRect(); if (!r.width) return; setQ([clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)]); };
  const foot = mode === 'brute' ? `Brute force compares the query with all ${PTS.length} vectors: perfect recall, but the cost grows with every vector you add.`
    : recall < 1 ? `IVF searched only the ${nprobe} nearest cluster${nprobe > 1 ? 's' : ''} and missed ${K - hit} true neighbour${K - hit > 1 ? 's' : ''} (dashed red) that live in an unprobed cluster. Raise nprobe.`
    : `IVF found all ${K} true neighbours with ${comps} distance computations instead of ${PTS.length} (${((1 - comps / PTS.length) * 100).toFixed(0)}% less work).`;
  return <Frame title="Approximate nearest neighbours / IVF index" meta={`${mode === 'brute' ? 'brute force' : `nprobe ${nprobe}/${NLIST}`} · recall@${K} ${(recall * 100).toFixed(0)}%`} foot={foot}>
    <Seg options={[{ value: 'brute', label: 'Brute force' }, { value: 'ivf', label: 'IVF (clustered)' }]} value={mode} onChange={setMode} label="Search method"/>
    <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg w-ann-search-svg" role="img" aria-label="Vector points, cluster centroids and a query; click to move the query" onClick={pick}>
      <rect x="0" y="0" width={W} height={H} rx="10" fill="var(--surface-2)"/>
      {found.map(i => <line key={'l' + i} x1={q[0] * W} y1={q[1] * H} x2={PTS[i][0] * W} y2={PTS[i][1] * H} className="viz-edge on" opacity=".6"/>)}
      {PTS.map((p, i) => <circle key={i} cx={p[0] * W} cy={p[1] * H} r="3.4" className={'viz-dot' + (probed.has(IVF.assign[i]) ? '' : ' muted')}/>)}
      {exact.map(i => <circle key={'x' + i} cx={PTS[i][0] * W} cy={PTS[i][1] * H} r="8" className={'w-ann-search-ring ' + (found.includes(i) ? 'ok' : 'bad')}/>)}
      {mode === 'ivf' && IVF.cent.map((c, j) => { const rank = order.indexOf(j), on = rank < nprobe;
        return <g key={'c' + j}><rect x={c[0] * W - 7} y={c[1] * H - 7} width="14" height="14" rx="3" className={'w-ann-search-centroid' + (on ? ' on' : '')}/>
          {on && <text x={c[0] * W + 10} y={c[1] * H - 8} className="viz-label">#{rank + 1}</text>}</g>; })}
      <circle cx={q[0] * W} cy={q[1] * H} r="8" className="w-ann-search-query"/>
      <text x="10" y={H - 10} className="viz-label">click anywhere to move the query</text>
    </svg>
    <Controls>
      <Btn onClick={() => { const n = (preset + 1) % PRESETS.length; setPreset(n); setQ(PRESETS[n]); }}>Move query</Btn>
      {mode === 'ivf' && <Btn onClick={() => setNprobe(NLIST)}>Probe all</Btn>}
    </Controls>
    {mode === 'ivf' && <Slider label="nprobe (clusters searched)" value={nprobe} min={1} max={NLIST} onChange={setNprobe} format={v => `${v} of ${NLIST}`}/>}
    <Stats>
      <Stat label="Distance computations" value={comps} tone={comps < PTS.length ? 'ok' : ''}/>
      <Stat label="Vectors scanned" value={`${mode === 'brute' ? PTS.length : cands.length} / ${PTS.length}`}/>
      <Stat label={`Recall@${K}`} value={`${(recall * 100).toFixed(0)}%`} tone={recall === 1 ? 'ok' : 'bad'}/>
    </Stats>
  </Frame>;
}
