import React, { useState } from 'react';
import { Frame, Slider, Bars, Stats, Stat, Seg, softmax } from '../index';

// Reference widget: temperature reshapes a softmax over next-token logits.
const PROMPTS = {
  'The sky is': [['blue', 4.1], ['clear', 2.9], ['dark', 2.4], ['falling', 0.6], ['purple', 0.2], ['bread', -1.5]],
  'Once upon a': [['time', 6.0], ['dream', 2.1], ['hill', 1.4], ['midnight', 1.1], ['spreadsheet', -1.2], ['the', -2.0]],
};

export default function Temperature() {
  const [prompt, setPrompt] = useState('The sky is');
  const [t, setT] = useState(1);
  const cands = PROMPTS[prompt];
  const probs = softmax(cands.map(c => c[1]), Math.max(t, 0.01));
  const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
  const top = probs.indexOf(Math.max(...probs));
  return <Frame title="Temperature / next-token probabilities" meta={`T = ${t.toFixed(2)}`}
    foot={t < 0.3 ? 'Near-greedy: the top token takes almost all the probability.' : t > 1.6 ? 'Very flat: unlikely tokens become real options, so output gets random.' : 'Balanced: the likely token usually wins but alternatives remain.'}>
    <Seg options={Object.keys(PROMPTS)} value={prompt} onChange={setPrompt} label="Prompt"/>
    <p className="viz-prompt">“{prompt} <b>{cands[top][0]}</b>…”</p>
    <Bars items={cands.map((c, i) => ({ label: c[0], value: probs[i], tone: i === top ? 'on' : '', note: `${(probs[i] * 100).toFixed(1)}%` }))} max={1}/>
    <Slider label="Temperature" value={t} min={0.05} max={2.5} step={0.05} onChange={setT} format={v => v.toFixed(2)}/>
    <Stats><Stat label="Top token" value={cands[top][0]}/><Stat label="Its probability" value={`${(probs[top] * 100).toFixed(1)}%`}/><Stat label="Entropy" value={`${entropy.toFixed(2)} bits`}/></Stats>
  </Frame>;
}
