import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit, syntaxHighlighting } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { classHighlighter } from '@lezer/highlight';
import { useApp, ACCOUNTS, CLOUD } from '../app';
import { supabase } from '../supabase';
import './practice.css';

const STARTERS = [
  { title: 'hello.py', label: 'Hello, Python', code: `# Write Python here, then press Run (or Ctrl+Enter).
name = "AI engineer"
print(f"Hello, {name}!")

squares = [n * n for n in range(1, 6)]
print("Squares:", squares)
print("Sum:", sum(squares))
` },
  { title: 'softmax.py', label: 'Softmax from scratch', code: `import math

def softmax(logits, temperature=1.0):
    scaled = [x / temperature for x in logits]
    top = max(scaled)                      # subtract the max for numerical stability
    exps = [math.exp(x - top) for x in scaled]
    total = sum(exps)
    return [e / total for e in exps]

logits = [2.0, 1.0, 0.1]
for t in (0.5, 1.0, 2.0):
    probs = softmax(logits, t)
    print(f"T={t}:", [round(p, 3) for p in probs])
` },
  { title: 'gradient_descent.py', label: 'Gradient descent', code: `# Fit y = w*x + b to a few points with plain gradient descent.
xs = [1, 2, 3, 4, 5]
ys = [3, 5, 7, 9, 11]          # true line: y = 2x + 1

w, b, lr = 0.0, 0.0, 0.02
for step in range(1, 2001):
    grad_w = sum(2 * (w * x + b - y) * x for x, y in zip(xs, ys)) / len(xs)
    grad_b = sum(2 * (w * x + b - y) for x, y in zip(xs, ys)) / len(xs)
    w, b = w - lr * grad_w, b - lr * grad_b
    if step % 400 == 0:
        loss = sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)
        print(f"step {step:4d}  w={w:.3f}  b={b:.3f}  loss={loss:.5f}")
` },
  { title: 'cosine_similarity.py', label: 'Cosine similarity (NumPy)', code: `# NumPy is downloaded the first time you import it.
import numpy as np

docs = {
    "cat":    np.array([0.9, 0.1, 0.0]),
    "kitten": np.array([0.8, 0.2, 0.1]),
    "car":    np.array([0.0, 0.2, 0.9]),
}
query = np.array([0.85, 0.15, 0.05])

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

for name, vec in sorted(docs.items(), key=lambda kv: -cosine(query, kv[1])):
    print(f"{name:7s} {cosine(query, vec):.3f}")
` },
];
const blank = () => ({ id: null, title: 'untitled.py', code: STARTERS[0].code });
const LOCAL = 'atlas-snippets-v1';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL)) || []; } catch { return []; } };
const writeLocal = list => { try { localStorage.setItem(LOCAL, JSON.stringify(list)); } catch {} };
const byRecent = list => [...list].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));

// Saved files: the code_snippets table for signed-in learners, this browser otherwise.
function useSnippets() {
  const { user } = useApp();
  const cloud = CLOUD && !!user;
  const [list, setList] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setError('');
    if (!cloud) { setList(byRecent(readLocal())); setLoading(false); return; }
    setLoading(true);
    supabase.from('code_snippets').select('id,title,code,updated_at').order('updated_at', { ascending: false }).then(({ data, error }) => {
      if (!live) return;
      setList(byRecent(data || [])); setLoading(false);
      if (error) setError('Could not load your saved files from the database.');
    });
    return () => { live = false; };
  }, [cloud, user?.id]);

  const save = async ({ id, title, code }) => {
    const row = { title: title.trim().slice(0, 80) || 'untitled.py', code, updated_at: new Date().toISOString() };
    let saved;
    if (cloud) {
      const q = id ? supabase.from('code_snippets').update(row).eq('id', id) : supabase.from('code_snippets').insert({ ...row, user_id: user.id });
      const { data, error } = await q.select('id,title,code,updated_at').single();
      if (error) throw new Error(error.message);
      saved = data;
    } else {
      saved = { ...row, id: id || `local-${Date.now().toString(36)}` };
      writeLocal([saved, ...readLocal().filter(s => s.id !== saved.id)]);
    }
    setList(l => byRecent([saved, ...l.filter(s => s.id !== saved.id)]));
    return saved;
  };
  const remove = async id => {
    if (cloud) { const { error } = await supabase.from('code_snippets').delete().eq('id', id); if (error) throw new Error(error.message); }
    else writeLocal(readLocal().filter(s => s.id !== id));
    setList(l => l.filter(s => s.id !== id));
  };
  return { list, loading, error, save, remove, cloud };
}

// Python runtime in a worker. Stopping a run terminates the worker and starts a fresh one.
function usePython() {
  const worker = useRef(null);
  const [loaded, setLoaded] = useState(false), [running, setRunning] = useState(false), [failed, setFailed] = useState(''), [version, setVersion] = useState('');
  const [output, setOutput] = useState([]), [result, setResult] = useState(null);
  const boot = useCallback(() => {
    const w = new Worker(new URL('./pyWorker.js', import.meta.url));
    w.onmessage = ({ data }) => {
      if (data.type === 'loaded') { setLoaded(true); setVersion(data.version); }
      if (data.type === 'failed') setFailed(data.text);
      if (data.type === 'out') setOutput(o => [...o, ...data.chunks]);
      if (data.type === 'done') { setRunning(false); setResult(data); }
    };
    w.onerror = e => { e.preventDefault(); setFailed('The Python runtime could not be loaded. Check your connection and reload the page.'); setRunning(false); };
    worker.current = w; setLoaded(false); setFailed('');
  }, []);
  useEffect(() => { boot(); return () => worker.current?.terminate(); }, [boot]);
  const run = (code, stdin) => { setOutput([]); setResult(null); setRunning(true); worker.current.postMessage({ code, stdin }); };
  const stop = () => { worker.current.terminate(); setRunning(false); setOutput(o => [...o, { kind: 'note', text: '\n■ Stopped.\n' }]); boot(); };
  const clear = () => { setOutput([]); setResult(null); };
  return { loaded, running, failed, version, output, result, run, stop, clear };
}

function Editor({ value, onChange, onRun, onSave }) {
  const host = useRef(null), view = useRef(null), handlers = useRef({});
  handlers.current = { onChange, onRun, onSave };
  useEffect(() => {
    view.current = new EditorView({
      parent: host.current, doc: value,
      extensions: [
        Prec.highest(keymap.of([
          { key: 'Mod-Enter', run: () => { handlers.current.onRun(); return true; } },
          { key: 'Mod-s', preventDefault: true, run: () => { handlers.current.onSave(); return true; } },
        ])),
        basicSetup, keymap.of([indentWithTab]), indentUnit.of('    '), python(), syntaxHighlighting(classHighlighter),
        EditorView.updateListener.of(u => { if (u.docChanged) handlers.current.onChange(u.state.doc.toString()); }),
      ],
    });
    return () => view.current.destroy();
  }, []);
  // Replace the document when another file is opened.
  useEffect(() => {
    const v = view.current;
    if (v && value !== v.state.doc.toString()) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);
  return <div className="ide-editor" ref={host} aria-label="Python code editor"/>;
}

export default function Practice() {
  const snippets = useSnippets(), py = usePython();
  const [file, setFile] = useState(blank), [savedAs, setSavedAs] = useState(blank);
  const [stdin, setStdin] = useState(''), [tab, setTab] = useState('output');
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [armed, setArmed] = useState(false);
  const console_ = useRef(null);
  const dirty = file.title !== savedAs.title || file.code !== savedAs.code;

  useEffect(() => { const el = console_.current; if (el) el.scrollTop = el.scrollHeight; }, [py.output, py.result]);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 4000); return () => clearTimeout(t); }, [notice]);
  // Signing in or out swaps the file list, so start from a clean file.
  useEffect(() => { setFile(f => ({ ...f, id: null })); setSavedAs(blank()); }, [snippets.cloud]);

  const run = () => { if (!py.running && !py.failed) { setTab('output'); py.run(file.code, stdin); } };
  const save = async (quiet = false) => {
    if (busy) return file;
    setBusy(true);
    try {
      const saved = await snippets.save(file);
      setFile(saved); setSavedAs(saved);
      if (!quiet) setNotice({ ok: true, text: snippets.cloud ? 'Saved to your account.' : 'Saved in this browser.' });
      return saved;
    } catch (err) { setNotice({ ok: false, text: `Could not save: ${err.message}` }); return null; }
    finally { setBusy(false); }
  };
  // Opening another file keeps the current one: unsaved edits to a saved file are stored first.
  const open = async next => {
    if (dirty && file.id) await save(true);
    setFile(next); setSavedAs(next); setArmed(false); py.clear();
  };
  const remove = async () => {
    if (!armed) return setArmed(true);
    try { await snippets.remove(file.id); const fresh = blank(); setFile(fresh); setSavedAs(fresh); setNotice({ ok: true, text: 'File deleted.' }); }
    catch (err) { setNotice({ ok: false, text: `Could not delete: ${err.message}` }); }
    setArmed(false);
  };

  const status = py.failed ? 'Python unavailable' : py.running ? (py.loaded ? 'Running…' : 'Loading Python…') : py.loaded ? `Python ${py.version} ready` : 'Loading Python…';
  return <main className="page practice-page">
    <div className="practice-head container">
      <div><div className="eyebrow">Practice</div><h1>Python playground</h1></div>
      <p className="dek">Write Python, run it in your browser and keep the files you want. {snippets.cloud ? 'Saved files are stored in your account.' : ACCOUNTS
        ? <>Files are saved in this browser. <Link to="/account">Sign in</Link> to keep them in your account.</> : 'Files are saved in this browser.'}</p>
    </div>
    <div className="ide container">
      <aside className="ide-files" aria-label="Files">
        <button className="button primary small" onClick={() => open(blank())}>+ New file</button>
        <h2>Your files</h2>
        {snippets.error && <p className="ide-hint bad">{snippets.error}</p>}
        {snippets.loading ? <p className="ide-hint">Loading…</p> : snippets.list.length === 0 ? <p className="ide-hint">Nothing saved yet. Press Save to keep a file.</p>
          : <ul>{snippets.list.map(s => <li key={s.id}><button className={s.id === file.id ? 'current' : ''} onClick={() => s.id !== file.id && open(s)}><span>{s.title}</span><small>{new Date(s.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></button></li>)}</ul>}
        <h2>Examples</h2>
        <ul>{STARTERS.map(s => <li key={s.title}><button onClick={() => open({ id: null, title: s.title, code: s.code })}><span>{s.label}</span></button></li>)}</ul>
      </aside>

      <section className="ide-main">
        <div className="ide-toolbar">
          <input className="ide-title" value={file.title} maxLength="80" spellCheck="false" aria-label="File name" onChange={e => setFile(f => ({ ...f, title: e.target.value }))}/>
          {dirty && <span className="ide-dirty" title="Unsaved changes">● Unsaved</span>}
          <span className="ide-spacer"/>
          {file.id && <button className={'button ghost small' + (armed ? ' danger' : '')} onClick={remove}>{armed ? 'Click again to delete' : 'Delete'}</button>}
          <button className="button ghost small" onClick={() => save()} disabled={busy || (!dirty && !!file.id)}>{busy ? 'Saving…' : 'Save'}</button>
          {py.running
            ? <button className="button small stop" onClick={py.stop}>■ Stop</button>
            : <button className="button primary small" onClick={run} disabled={!!py.failed} title="Ctrl+Enter">▶ Run</button>}
        </div>
        {notice && <div className={notice.ok ? 'form-ok' : 'form-error'} role="status">{notice.text}</div>}
        <div className="ide-panes">
          <Editor value={file.code} onChange={code => setFile(f => ({ ...f, code }))} onRun={run} onSave={() => save()}/>
          <div className="ide-console">
            <div className="ide-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'output'} onClick={() => setTab('output')}>Output</button>
              <button role="tab" aria-selected={tab === 'input'} onClick={() => setTab('input')}>Input{stdin ? ' •' : ''}</button>
              <span className="ide-spacer"/>
              <span className={'ide-status' + (py.failed ? ' bad' : py.running ? ' busy' : '')} role="status">{status}</span>
              {tab === 'output' && py.output.length > 0 && !py.running && <button className="ide-clear" onClick={py.clear}>Clear</button>}
            </div>
            {tab === 'output'
              ? <pre className="ide-output" ref={console_} tabIndex="0" aria-live="polite">
                  {py.failed ? <span className="err">{py.failed}</span>
                    : py.output.length === 0 && !py.result ? <span className="note">{py.running ? '' : 'Press Run to see your program’s output here.'}</span>
                    : py.output.map((c, i) => <span key={i} className={c.kind}>{c.text}</span>)}
                  {py.result && <span className={'note exit' + (py.result.failed ? ' failed' : '')}>{py.result.failed ? '✗ Exited with an error' : '✓ Finished'} in {py.result.ms < 1000 ? `${py.result.ms} ms` : `${(py.result.ms / 1000).toFixed(2)} s`}</span>}
                </pre>
              : <div className="ide-input"><label htmlFor="ide-stdin">Text for <code>input()</code>, one line per call</label>
                  <textarea id="ide-stdin" value={stdin} onChange={e => setStdin(e.target.value)} spellCheck="false" placeholder={'Ada\n42'}/></div>}
          </div>
        </div>
        <p className="ide-hint">Ctrl+Enter runs · Ctrl+S saves · Tab indents. Python runs entirely in your browser, with NumPy, pandas and other common packages loading on first import.</p>
      </section>
    </div>
  </main>;
}
