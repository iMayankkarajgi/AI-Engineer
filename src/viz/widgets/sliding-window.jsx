import React, { useState } from 'react';
import { Frame, Slider, Stats, Stat } from '../index';

// Token i may attend to j when i − w < j ≤ i. Stacking L layers lets information hop L windows back.
const N = 16, C = 22;

export default function SlidingWindow() {
  const [w, setW] = useState(4);
  const [layers, setLayers] = useState(3);
  const [q, setQ] = useState(N - 1);
  const allowed = (i, j) => j <= i && i - j < w;
  const reach = l => (w - 1) * l; // tokens back reachable after l layers
  const field = Math.min(q + 1, reach(layers) + 1);
  let cells = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (allowed(i, j)) cells++;
  const full = (N * (N + 1)) / 2;
  const LY = l => 24 + (layers - l) * 30;
  const X = j => 30 + j * 34;
  const seesStart = q - reach(layers) <= 0;
  return <Frame title="Sliding-window attention / local masks, global reach" meta={`window ${w} · ${layers} layer${layers > 1 ? 's' : ''}`}
    foot={w === 1 ? 'A window of 1 means each token sees only itself — no information moves at all, however many layers you stack.'
      : `Each layer lets token ${q} look ${w - 1} position${w > 2 ? 's' : ''} back; after ${layers} layer${layers > 1 ? 's' : ''} information can travel ${reach(layers)} positions, so it ${seesStart ? 'reaches the very first token' : `reaches back to token ${q - reach(layers)}`}. Cost per layer stays O(n·w) instead of O(n²).`}>
    <div className="viz-two">
      <svg viewBox={`0 0 ${N * C + 26} ${N * C + 26}`} className="viz-svg" role="img" aria-label={`Sliding window attention mask with window ${w}`} style={{ maxWidth: 380 }}>
        <text x="24" y="14" className="viz-label">keys →</text>
        {Array.from({ length: N }, (_, i) => <g key={i} onClick={() => setQ(i)} style={{ cursor: 'pointer' }}>
          <text x="18" y={24 + i * C + 15} textAnchor="end" className="viz-label" style={{ fontSize: 9, fill: i === q ? 'var(--accent)' : undefined }}>{i}</text>
          {Array.from({ length: N }, (_, j) => <rect key={j} x={24 + j * C} y={24 + i * C} width={C - 2} height={C - 2} rx="3"
            style={{ fill: allowed(i, j) ? (i === q ? 'var(--accent)' : 'var(--s3)') : j <= i ? 'var(--surface-3)' : 'var(--surface-2)', opacity: allowed(i, j) ? (i === q ? 1 : 0.55) : 1, transition: 'fill .3s, opacity .3s' }}/>)}
        </g>)}
      </svg>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <Slider label="Window size w" value={w} min={1} max={N} onChange={setW}/>
        <Slider label="Layers stacked" value={layers} min={1} max={6} onChange={setLayers}/>
        <Slider label="Query token" value={q} min={0} max={N - 1} onChange={setQ}/>
      </div>
    </div>
    <svg viewBox={`0 0 ${X(N - 1) + 30} ${LY(0) + 26}`} className="viz-svg" role="img" aria-label={`Information from token ${q} reaches ${field} tokens after ${layers} layers`}>
      {Array.from({ length: layers + 1 }, (_, l) => <g key={l}>
        <text x="0" y={LY(l) + 4} className="viz-label" style={{ fontSize: 9 }}>{l === 0 ? 'in' : `L${l}`}</text>
        {l > 0 && Array.from({ length: N }, (_, j) => {
          const on = j <= q && q - j <= reach(layers - l); // node on the path back from the query
          return on && Array.from({ length: w }, (_, d) => j - d >= 0 && <line key={j + '-' + d} x1={X(j)} y1={LY(l)} x2={X(j - d)} y2={LY(l - 1)} className="viz-edge on" style={{ opacity: 0.25 }}/>);
        })}
        {Array.from({ length: N }, (_, j) => {
          const on = j <= q && q - j <= reach(layers - l);
          return <circle key={j} cx={X(j)} cy={LY(l)} r={j === q && l === layers ? 8 : 6} className={'viz-dot' + (on ? '' : ' muted')}/>;
        })}
      </g>)}
    </svg>
    <Stats>
      <Stat label="Receptive field" value={`${field} / ${q + 1} tokens`} tone={seesStart ? 'ok' : ''}/>
      <Stat label="Reach / layer" value={`${w - 1} back`}/>
      <Stat label="Mask cells" value={`${cells} vs ${full}`}/>
      <Stat label="Attention cost" value={`${((cells / full) * 100).toFixed(0)}% of full`} tone="on"/>
    </Stats>
  </Frame>;
}
