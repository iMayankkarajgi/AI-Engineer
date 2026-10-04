import React from 'react';

// One line icon per Lab interactive, drawn on a 24×24 grid. Each sketches what
// the widget shows (bars, a curve, a grid, a flow) rather than a generic glyph.
const dot = (x, y, r = 1.4) => <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none"/>;
const ICONS = {
  'temperature': <><path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>{dot(12, 17, 1.6)}</>,
  'top-k-top-p': <><path d="M4 6h10M4 12h7M4 18h4"/><path d="M17 4v16" strokeDasharray="2 2.5"/></>,
  'gradient-descent': <><path d="M3 5c3 0 4 14 9 14s6-8 9-8"/>{dot(7.2, 13)}{dot(12, 19)}</>,
  'vector-similarity': <><path d="M4 20 19 8M4 20l5-15"/><path d="m15.5 8 3.5 0-.6 3.5M6 5.6 9 5l1.4 2.8"/><path d="M9 14.5a6 6 0 0 0-2.2-3"/></>,
  'precision-recall': <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>{dot(12, 12)}<path d="M18 6l3-3"/></>,
  'linear-vs-logistic': <><path d="M3 19 21 5" strokeDasharray="2 2.5"/><path d="M3 18c6 0 6-12 18-12"/></>,
  'loss-l1-l2': <><path d="M4 5l8 13 8-13"/><path d="M4 5c3 17 13 17 16 0" strokeDasharray="2 2.5"/></>,
  'regularization': <><path d="M5 20V8M10 20v-6M15 20v-9M20 20v-2"/><path d="M3 5h18" strokeDasharray="2 2.5"/></>,
  'rl-gridworld': <><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>{dot(6, 18)}{dot(18, 6)}</>,
  'contrastive': <>{dot(8, 12, 2)}{dot(13, 10, 2)}<circle cx="19" cy="17" r="2"/><path d="M15.5 12.5 17.5 15M5 5l2 4M4 19l2.5-4"/></>,
  'neuron': <><circle cx="14" cy="12" r="4"/><path d="M3 5l8 5M3 12h7M3 19l8-5M18 12h3"/></>,
  'dropout': <>{dot(5, 6)}{dot(5, 18)}<circle cx="12" cy="6" r="1.6"/>{dot(12, 12)}<circle cx="12" cy="18" r="1.6"/>{dot(19, 12)}<path d="M6.5 6.5 10.5 11M6.5 17.5l4-5M13.5 12H17"/><path d="m10.6 4.6 2.8 2.8m0-2.8-2.8 2.8"/></>,
  'normalization': <><path d="M3 18c4 0 4-12 9-12s5 12 9 12"/><path d="M12 6v12M7 18v-5M17 18v-5" strokeDasharray="2 2.5"/></>,
  'rnn-vs-transformer': <><path d="M3 7h4m2 0h4m2 0h4"/><path d="m18 5 2 2-2 2"/><path d="M5 20l7-6 7 6M5 14h14M5 14l14 6M19 14 5 20"/></>,
  'tokenizer-bpe': <><rect x="2.5" y="8" width="5" height="8" rx="1.2"/><rect x="9.5" y="8" width="5" height="8" rx="1.2"/><rect x="16.5" y="8" width="5" height="8" rx="1.2"/><path d="M5 19c2 2 5 2 7 0"/></>,
  'embedding-space': <><path d="M3 3v18h18"/>{dot(8, 15)}{dot(10, 12)}{dot(8.5, 10)}{dot(16, 7)}{dot(18, 9.5)}<circle cx="9" cy="12.5" r="4.2" strokeDasharray="2 2.5"/></>,
  'attention-heatmap': <><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" opacity=".75"/><rect x="15" y="3" width="6" height="6" fill="currentColor" stroke="none" opacity=".35"/></>,
  'qkv-math': <><path d="M4 7h6M7 4v6M14 5l5 5m0-5-5 5M4 17h6M14 15h6M14 19h6"/></>,
  'causal-mask': <><path d="M3 3h18v18H3z"/><path d="M3 3l18 18"/><path d="M9 3v6M15 3v12M21 9h-6M15 9H9" opacity=".45"/><path d="M3 21 3 3l18 18z" fill="currentColor" stroke="none" opacity=".3"/></>,
  'multi-head': <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="5" r="2.5"/><path d="M6 8.5 11 18M18 8.5 13 18M12 7.5V18"/>{dot(12, 19.5, 1.8)}</>,
  'rope': <><circle cx="12" cy="12" r="8" strokeDasharray="2 2.5"/><path d="M12 12l6.5-4M12 12l1-7.5"/><path d="M16.5 6.2a6 6 0 0 0-2.8-1.4"/>{dot(12, 12)}</>,
  'streaming': <><path d="M3 7h10M3 12h14M3 17h6"/>{dot(16, 7)}{dot(20, 12)}{dot(12, 17)}</>,
  'lost-in-middle': <><path d="M3 6c5 0 5 12 9 12s4-12 9-12"/><path d="M12 3v3" />{dot(12, 18)}</>,
  'moe-router': <><path d="M3 12h5"/><circle cx="10" cy="12" r="2"/><path d="M12 11l6-6M12 12h6M12 13l6 6"/><path d="M12 11.5 18 9M12 12.5 18 15" opacity=".35"/>{dot(19.5, 5)}{dot(19.5, 12)}</>,
  'gqa': <><circle cx="5" cy="6" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="20" cy="6" r="1.8"/><path d="M5 8l2.5 8M10 8l-2.5 8M15 8l2.5 8M20 8l-2.5 8"/><rect x="5.5" y="16" width="4" height="4" rx="1"/><rect x="15.5" y="16" width="4" height="4" rx="1"/></>,
  'sliding-window': <><path d="M3 12h18" opacity=".45"/>{dot(5, 12)}{dot(9.5, 12)}{dot(14, 12)}{dot(18.5, 12)}<rect x="7" y="7" width="9.5" height="10" rx="2"/><path d="m19 5 2 2-2 2"/></>,
  'lora': <><rect x="3" y="5" width="10" height="14" rx="1.5"/><rect x="16" y="5" width="3" height="14" rx="1"/><path d="M16 22h5" /><path d="M14.5 12h0" /><path d="M21 5v0"/><path d="M6 9h4M6 12h4M6 15h4" opacity=".45"/></>,
  'kv-cache': <><rect x="3" y="4" width="18" height="5" rx="1.2"/><rect x="3" y="10.5" width="18" height="5" rx="1.2"/><path d="M3 20h12" strokeDasharray="2 2.5"/><path d="M18 18v4M16 20h4"/></>,
  'paged-attention': <><rect x="3" y="3" width="7.5" height="7.5" rx="1.2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2" fill="currentColor" fillOpacity=".3"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2" fill="currentColor" fillOpacity=".3"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2"/></>,
  'continuous-batching': <><path d="M3 6h9M14 6h7M3 12h5M10 12h11M3 18h13M18 18h3"/><path d="M12 4v4M8 10v4M16 16v4" opacity=".5"/></>,
  'speculative-decoding': <><path d="M3 8h3m2 0h3m2 0h3" strokeDasharray="0"/><path d="m4 16 2 2 4-4M14 14l4 4m0-4-4 4"/><path d="M19 6l2 2-2 2"/></>,
  'quantization': <><path d="M3 17c4-10 14-10 18-10" opacity=".45"/><path d="M3 17h4v-4h4v-3h5V7h5"/></>,
  'chunking': <><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M3 14.5h18"/><path d="M6 7h8M6 12h11M6 17h6" opacity=".5"/></>,
  'ann-search': <><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6"/>{dot(8, 9)}{dot(12, 8)}{dot(10, 12.5)}</>,
  'hybrid-search': <><path d="M4 5h6M4 9h6M14 5h6M14 9h6"/><path d="M7 11c0 5 5 3 5 8M17 11c0 5-5 3-5 8"/>{dot(12, 20, 1.6)}</>,
  'semantic-cache': <><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>,
  'agent-loop': <><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M17.5 2.5v4h-4"/><circle cx="12" cy="12" r="2.2"/></>,
  'prompt-caching': <><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M12 6v12"/><path d="M3 6h9v12H3z" fill="currentColor" stroke="none" opacity=".3"/><path d="M15 10h3M15 14h3"/></>,
  'diffusion': <>{dot(4, 5, 1)}{dot(8, 9, 1)}{dot(5, 13, 1)}{dot(9, 17, 1)}{dot(4, 19, 1)}{dot(8, 4, 1)}<path d="M11 12h3m-1.5-1.5L14 12l-1.5 1.5"/><rect x="15.5" y="7" width="6" height="10" rx="1.2"/></>,
  'guardrails': <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2.2 2.2L15.5 10"/></>,
  'gpu-parallel': <><rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z" fill="currentColor" stroke="none"/></>,
  'llm-routing': <><path d="M3 12h6"/><path d="M9 12c4 0 3-6 8-6M9 12c4 0 3 6 8 6"/><circle cx="19" cy="6" r="1.6"/><circle cx="19" cy="18" r="3"/></>,
};
const FALLBACK = <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 15l3-4 2 2 3-4"/></>;

export default function LabIcon({ name }) {
  return <svg className="lab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || FALLBACK}</svg>;
}
export const hasLabIcon = name => name in ICONS;
