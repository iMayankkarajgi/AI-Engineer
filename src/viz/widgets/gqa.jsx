import React, { useState } from 'react';
import { Frame, Seg, Slider, Bars, Stats, Stat } from '../index';

// 32 query heads (Llama-style 8B shape: 32 layers, head dim 128, fp16). KV heads = 32 (MHA), G (GQA) or 1 (MQA).
const HQ = 32, LAYERS = 32, DH = 128, BYTES = 2;
const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const kvBytes = (hkv, ctx, batch) => 2 * LAYERS * hkv * DH * BYTES * ctx * batch; // 2 = K and V
const gb = b => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`);

export default function Gqa() {
  const [mode, setMode] = useState('GQA');
  const [groups, setGroups] = useState(8);
  const [ctxPow, setCtxPow] = useState(13);
  const [batch, setBatch] = useState(8);
  const ctx = 2 ** ctxPow;
  const hkv = mode === 'MHA' ? HQ : mode === 'MQA' ? 1 : groups;
  const per = HQ / hkv;
  const qx = i => 14 + i * (572 / (HQ - 1));
  const kx = g => (qx(g * per) + qx(g * per + per - 1)) / 2;
  const cur = kvBytes(hkv, ctx, batch), mha = kvBytes(HQ, ctx, batch);
  const perTok = 2 * LAYERS * hkv * DH * BYTES;
  const tone = mode === 'MHA' ? '' : 'ok';
  return <Frame title="MHA vs GQA vs MQA / sharing key-value heads" meta={`${HQ} query heads → ${hkv} KV head${hkv > 1 ? 's' : ''}`}
    foot={mode === 'MHA' ? `Multi-head attention: every query head has its own K and V, so the KV cache is largest (${gb(cur)}).`
      : mode === 'MQA' ? `Multi-query attention: all ${HQ} query heads share one K/V head — ${HQ}× smaller cache, but heads lose diversity and quality can drop.`
      : `Grouped-query attention: each group of ${per} query heads shares one K/V head, cutting the cache ${per}× (${gb(mha)} → ${gb(cur)}) with little quality loss.`}>
    <div className="viz-row">
      <Seg options={['MHA', 'GQA', 'MQA']} value={mode} onChange={setMode} label="Attention type"/>
      {mode === 'GQA' && <Seg options={[2, 4, 8, 16].map(v => ({ value: String(v), label: `${v} KV heads` }))} value={String(groups)} onChange={v => setGroups(Number(v))} label="KV heads"/>}
    </div>
    <svg viewBox="0 0 600 150" className="viz-svg" role="img" aria-label={`${HQ} query heads connected to ${hkv} key-value heads`}>
      <text x="0" y="10" className="viz-label">query heads</text>
      <text x="0" y="146" className="viz-label">K/V heads</text>
      {Array.from({ length: HQ }, (_, i) => {
        const g = Math.floor(i / per);
        return <line key={'e' + i} x1={qx(i)} y1="34" x2={kx(g)} y2="112" className="viz-edge" style={{ stroke: COLORS[g % 4], opacity: 0.55, transition: 'all .45s ease' }}/>;
      })}
      {Array.from({ length: HQ }, (_, i) => <rect key={'q' + i} x={qx(i) - 6} y="18" width="12" height="16" rx="3" style={{ fill: COLORS[Math.floor(i / per) % 4], transition: 'fill .45s' }}/>)}
      {Array.from({ length: hkv }, (_, g) => <rect key={'k' + g + '-' + hkv} x={kx(g) - Math.max(6, per * 8.5) } y="112" width={Math.max(12, per * 17)} height="18" rx="4" className="viz-pop" style={{ fill: COLORS[g % 4], transformOrigin: `${kx(g)}px 121px` }}/>)}
    </svg>
    <Bars items={[['MHA (32 KV)', HQ], ['GQA (8 KV)', 8], ['MQA (1 KV)', 1]].map(([l, h]) => ({ label: l, value: kvBytes(h, ctx, batch), tone: h === hkv ? 'on' : 'off', note: gb(kvBytes(h, ctx, batch)) }))
      .concat(mode === 'GQA' && groups !== 8 ? [{ label: `GQA (${groups} KV)`, value: cur, tone: 'on', note: gb(cur) }] : [])} max={mha}/>
    <div className="viz-two">
      <Slider label="Context length" value={ctxPow} min={10} max={17} onChange={setCtxPow} format={v => `${(2 ** v / 1024).toFixed(0)}k tokens`}/>
      <Slider label="Batch (concurrent sequences)" value={batch} min={1} max={32} onChange={setBatch}/>
    </div>
    <Stats>
      <Stat label="KV heads" value={hkv}/>
      <Stat label="KV / token" value={`${(perTok / 1024).toFixed(0)} KB`}/>
      <Stat label="KV cache total" value={gb(cur)} tone={tone}/>
      <Stat label="vs MHA" value={`${((cur / mha) * 100).toFixed(1)}%`} tone={tone}/>
    </Stats>
  </Frame>;
}
