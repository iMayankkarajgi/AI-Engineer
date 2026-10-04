// Runs learner code with Pyodide (CPython compiled to WebAssembly) off the main
// thread, so a long or endless program never freezes the page: the page stops
// it by terminating this worker. Classic worker; no imports.
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
const MAX_OUTPUT = 200_000; // characters per run

let buffer = [], lastFlush = 0, printed = 0, capped = false;
const flush = () => { if (buffer.length) { postMessage({ type: 'out', chunks: buffer }); buffer = []; } lastFlush = Date.now(); };
// Python runs synchronously, so output is batched by elapsed time rather than a timer.
const emit = (kind, text) => {
  if (capped) return;
  printed += text.length;
  if (printed > MAX_OUTPUT) { capped = true; buffer.push({ kind: 'note', text: '\n… output truncated (over 200,000 characters).\n' }); return flush(); }
  buffer.push({ kind, text });
  if (Date.now() - lastFlush > 50) flush();
};

const ready = (async () => {
  importScripts(PYODIDE + 'pyodide.js');
  const py = await loadPyodide({ indexURL: PYODIDE });
  py.setStdout({ batched: s => emit('out', s + '\n') });
  py.setStderr({ batched: s => emit('err', s + '\n') });
  postMessage({ type: 'loaded', version: py.runPython('import sys; sys.version.split()[0]') });
  return py;
})();
ready.catch(err => postMessage({ type: 'failed', text: String(err?.message || err) }));

// Keep the learner's own frames; drop Pyodide's internal ones from tracebacks.
const tidy = message => {
  const lines = String(message).split('\n'), at = lines.findIndex(l => l.includes('File "<exec>"'));
  return at > 0 ? ['Traceback (most recent call last):', ...lines.slice(at)].join('\n') : String(message);
};

onmessage = async ({ data }) => {
  let py;
  try { py = await ready; } catch { return; }
  buffer = []; printed = 0; capped = false; lastFlush = Date.now();
  const lines = data.stdin ? data.stdin.split('\n') : [];
  py.setStdin({ stdin: () => (lines.length ? lines.shift() : null) });
  const started = performance.now();
  let failed = false;
  try {
    // Fetch numpy, pandas and other bundled packages when the code imports them.
    await py.loadPackagesFromImports(data.code, { messageCallback: () => {}, errorCallback: () => {} });
    const globals = py.toPy({ __name__: '__main__' });
    try { await py.runPythonAsync(data.code, { globals }); } finally { globals.destroy(); }
  } catch (err) { failed = true; emit('err', tidy(err?.message || err).replace(/\n*$/, '\n')); }
  flush();
  postMessage({ type: 'done', failed, ms: Math.round(performance.now() - started) });
};
