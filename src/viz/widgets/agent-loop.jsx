import React, { useMemo, useState } from 'react';
import { Frame, Slider, Seg, Controls, Btn, Stats, Stat, useTicker } from '../index';

// Tools actually run here; the "model" side is a fixed script of thoughts.
const TOOLS = {
  get_weather: ({ city }) => ({ Paris: { temp_c: 18 }, Oslo: { temp_c: 4 } }[city]),
  calculator: ({ a, op, b }) => Math.round({ '*': a * b, '+': a + b, '/': a / b, '-': a - b }[op] * 1e6) / 1e6,
  days_between: ({ from, to }) => Math.round((Date.parse(to) - Date.parse(from)) / 864e5),
};
const TASKS = {
  'Weather in °F': { ask: 'What is the temperature in Paris in Fahrenheit?', cycles: [
    { think: 'I need the current temperature in Paris.', tool: 'get_weather', args: () => ({ city: 'Paris' }) },
    { think: 'It is in Celsius. Convert: multiply by 9/5 = 1.8 first.', tool: 'calculator', args: o => ({ a: o[0].temp_c, op: '*', b: 1.8 }) },
    { think: 'Now add 32.', tool: 'calculator', args: o => ({ a: o[1], op: '+', b: 32 }) },
  ], answer: o => `It is about ${o[2].toFixed(1)} °F in Paris (${o[0].temp_c} °C).` },
  'Days until 2027': { ask: 'How many days from 2026-10-01 until New Year 2027?', cycles: [
    { think: 'Date arithmetic is error-prone in my head; use the tool.', tool: 'days_between', args: () => ({ from: '2026-10-01', to: '2027-01-01' }) },
  ], answer: o => `${o[0]} days.` },
};
const NODES = { think: [150, 40, 'Think'], act: [265, 130, 'Call tool'], observe: [150, 215, 'Observe'], done: [35, 130, 'Answer'], stop: [35, 130, 'Stopped'] };
const EDGES = [['think', 'act'], ['act', 'observe'], ['observe', 'think'], ['think', 'done']];

function buildTrace(task, budget) {
  const t = TASKS[task], obs = [], steps = [{ phase: 'user', text: t.ask }];
  for (let i = 0; i < t.cycles.length; i++) {
    if (i >= budget) { steps.push({ phase: 'stop', text: `max iterations (${budget}) reached — returning without an answer` }); return steps; }
    const c = t.cycles[i], args = c.args(obs), result = TOOLS[c.tool](args);
    obs.push(result);
    steps.push({ phase: 'think', text: c.think }, { phase: 'act', text: `${c.tool}(${JSON.stringify(args)})` }, { phase: 'observe', text: JSON.stringify(result) });
  }
  steps.push({ phase: 'think', text: 'I have everything I need.' }, { phase: 'done', text: t.answer(obs) });
  return steps;
}
const ROLE = { user: 'user', think: 'assistant·thought', act: 'assistant·tool_call', observe: 'tool_result', done: 'assistant·final', stop: 'runtime' };

export default function AgentLoop() {
  const [task, setTask] = useState('Weather in °F');
  const [budget, setBudget] = useState(5);
  const [n, setN] = useState(1);
  const [running, setRunning] = useState(false);
  const trace = useMemo(() => buildTrace(task, budget), [task, budget]);
  const i = Math.min(n, trace.length), cur = trace[i - 1], prev = trace[i - 2];
  useTicker(running, 900, () => { if (i >= trace.length) { setRunning(false); return false; } setN(i + 1); });
  const restart = () => { setRunning(false); setN(1); };
  const vis = trace.slice(0, i);
  const calls = vis.filter(s => s.phase === 'act').length;
  const tokens = vis.reduce((s, x) => s + Math.ceil(x.text.length / 4) + 4, 0);
  const finished = cur.phase === 'done' || cur.phase === 'stop';
  const edgeOn = ([a, b]) => prev && prev.phase === a && (cur.phase === b || (b === 'done' && cur.phase === 'stop'));
  const foot = { user: 'The user’s request enters the context. The loop starts with the model thinking about it.',
    think: 'Think: the model reads the whole context so far and decides the next move — call a tool or answer.',
    act: 'Act: the model emits a structured tool call; the runtime (not the model) executes it.',
    observe: 'Observe: the tool’s result is appended to the context, and the loop goes back to Think.',
    done: `Done after ${calls} tool call${calls === 1 ? '' : 's'}: the model judged it had enough and wrote the final answer.`,
    stop: 'The iteration budget ran out first. Real agents need a cap like this so a confused loop cannot run forever.' }[cur.phase];
  return <Frame title="Agent loop / think → act → observe" meta={`${finished ? 'finished' : 'running'} · step ${i}/${trace.length}`} foot={foot}>
    <Seg options={Object.keys(TASKS)} value={task} onChange={v => { setTask(v); restart(); }} label="Task"/>
    <div className="viz-two">
      <svg viewBox="0 0 300 250" className="viz-svg" role="img" aria-label={`Agent loop diagram, current phase ${cur.phase}`}>
        {EDGES.map(([a, b]) => <line key={a + b} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} className={'viz-edge' + (edgeOn([a, b]) ? ' on' : '')}/>)}
        {Object.entries(NODES).filter(([k]) => k !== (cur.phase === 'stop' ? 'done' : 'stop')).map(([k, [x, y, label]]) => <g key={k}>
          <circle cx={x} cy={y} r="30" className={'viz-node' + (cur.phase === k ? ' on' : '')} style={k === 'stop' ? { stroke: 'var(--bad)' } : undefined}/>
          <text x={x} y={y + 4} textAnchor="middle" className="viz-label" style={cur.phase === k ? { fill: 'var(--ink)', fontWeight: 600 } : undefined}>{label}</text>
        </g>)}
      </svg>
      <div className="viz-log" aria-live="polite">{vis.map((s, j) => <div key={j} className="viz-fade"><span className="dim">{ROLE[s.phase]}: </span>{s.text}</div>)}</div>
    </div>
    <Slider label="Max iterations (tool-call budget)" value={budget} min={1} max={5} onChange={v => { setBudget(v); restart(); }}/>
    <Controls>
      <Btn primary onClick={() => { if (finished) setN(1); setRunning(r => !r || finished); }}>{running ? '❚❚ Pause' : '▶ Run'}</Btn>
      <Btn onClick={() => { setRunning(false); setN(Math.min(trace.length, i + 1)); }} disabled={finished}>Step</Btn>
      <Btn onClick={restart}>↺ Reset</Btn>
    </Controls>
    <Stats>
      <Stat label="Phase" value={cur.phase} tone={cur.phase === 'stop' ? 'bad' : cur.phase === 'done' ? 'ok' : 'on'}/>
      <Stat label="Tool calls" value={calls}/>
      <Stat label="Context ≈ tokens" value={tokens}/>
    </Stats>
  </Frame>;
}
