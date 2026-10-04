import React, { useState } from 'react';

// Small deterministic simulations: numbers are illustrative and computed locally.
export default function ConceptLab({ id, lesson }) {
  const [value, setValue] = useState(50);
  const [step, setStep] = useState(0);
  const v = Number(value);
  const stages = [
    ['THE QUESTION', lesson.hook],
    ['THE MECHANISM', lesson.technical],
    ['IN THE WORLD', lesson.example],
  ];
  const stage = stages[step];
  let display = null;
  if (id === 'math-vectors' || id === 'vector-similarity') {
    const angle = (v / 100) * Math.PI;
    display = <div className="lab-sim"><div className="lab-arrows"><span className="lab-arrow" style={{transform:'rotate(0deg)'}}>→</span><span className="lab-arrow second" style={{transform:`rotate(${-v*1.8}deg)`}}>→</span></div><strong>{Math.cos(angle).toFixed(2)}</strong><small>COSINE OF THE ANGLE</small><input aria-label="Rotate the second vector" type="range" min="0" max="100" value={v} onChange={e=>setValue(e.target.value)}/><p>Rotate one vector. Aligned arrows score +1; perpendicular arrows score 0; opposite arrows score −1.</p></div>;
  } else if (id === 'math-gradients' || id === 'dl-backprop') {
    const rate=(v/100)*1.4+.05;
    let weight=4;const history=[weight];for(let i=0;i<5;i++){weight-=rate*2*(weight-2);history.push(weight)}
    display=<div className="lab-sim"><div className="lab-plot">{history.map((n,i)=><div key={i} style={{height:`${Math.min(100,Math.max(5,100-Math.abs(n-2)*35))}%`}}><span>{i}</span></div>)}</div><strong>{rate.toFixed(2)}</strong><small>LEARNING RATE</small><input aria-label="Change learning rate" type="range" min="0" max="100" value={v} onChange={e=>setValue(e.target.value)}/><p>A modest step approaches the minimum. Too large a step can bounce away or diverge.</p></div>;
  } else if (id === 'llm-sampling') {
    const temperature=Math.max(.15,v/40), logits=[2,1,.2], weights=logits.map(x=>Math.exp(x/temperature)), sum=weights.reduce((a,b)=>a+b,0);
    display=<div className="lab-sim"><div className="lab-bars">{['blue','clear','dark'].map((word,i)=><div key={word}><span>{word}</span><i style={{width:`${weights[i]/sum*100}%`}}/><b>{(weights[i]/sum*100).toFixed(0)}%</b></div>)}</div><strong>{temperature.toFixed(2)}</strong><small>TEMPERATURE</small><input aria-label="Change sampling temperature" type="range" min="6" max="100" value={v} onChange={e=>setValue(e.target.value)}/><p>Higher temperature flattens this illustrative next-token distribution.</p></div>;
  } else if (id === 'ml-metrics') {
    const threshold=v/100, positives=[.91,.82,.73,.56,.48], negatives=[.88,.52,.31,.20,.10];
    const tp=positives.filter(x=>x>=threshold).length, fp=negatives.filter(x=>x>=threshold).length;
    display=<div className="lab-sim"><div className="lab-metrics"><div><span>PRECISION</span><strong>{tp+fp?Math.round(tp/(tp+fp)*100):0}%</strong></div><div><span>RECALL</span><strong>{Math.round(tp/positives.length*100)}%</strong></div></div><small>DECISION THRESHOLD / {threshold.toFixed(2)}</small><input aria-label="Change classification threshold" type="range" min="0" max="100" value={v} onChange={e=>setValue(e.target.value)}/><p>Move the threshold to trade false alarms for missed positive cases in this ten-example dataset.</p></div>;
  } else if (id === 'dl-neuron') {
    const output=Math.max(0,2*.5+3*((v-50)/100)+.1);
    display=<div className="lab-sim"><div className="lab-neuron"><span>2 × 0.5</span><span>+</span><span>3 × {((v-50)/100).toFixed(2)}</span><span>+ 0.1</span></div><strong>{output.toFixed(2)}</strong><small>RELU OUTPUT</small><input aria-label="Change second neural-network weight" type="range" min="0" max="100" value={v} onChange={e=>setValue(e.target.value)}/><p>Change one weight and watch the weighted sum change before the ReLU activation.</p></div>;
  }
  return <div className="concept-lab"><div className="concept-lab-top"><span>INTERACTIVE EXPLAINER</span><span>{id.toUpperCase().replaceAll('-', ' / ')}</span></div>{display || <div className="concept-stage" key={step}><span>0{step+1} / 03 · {stage[0]}</span><p>{stage[1]}</p><div className="concept-orbit" aria-hidden="true"><i/><i/><i/></div></div>}{!display&&<div className="concept-controls"><button onClick={()=>setStep((step+2)%3)}>← PREVIOUS</button><div aria-label="Explainer step">{stages.map((_,i)=><button key={i} aria-label={`Show step ${i+1}`} className={step===i?'active':''} onClick={()=>setStep(i)}/>)}</div><button onClick={()=>setStep((step+1)%3)}>NEXT →</button></div>}<div className="concept-lab-foot">{display?'CHANGE THE SLIDER TO TEST THE IDEA':'SELECT A STAGE TO FOLLOW THE IDEA'}</div></div>;
}
