# AI Atlas lesson authoring spec

Every lesson is one file: `src/course/lessons/<lesson-id>.js`, with a single `export default { ... }`.
The lesson id, number, title and outline ("covers") come from `src/course/curriculum.js`;
do not repeat them in the lesson file except for `id`.

Validate with: `node scripts/validate-lessons.mjs <lesson-id> [...more ids]`

## Goal

A learner must be able to understand the topic completely **without leaving the page**. Each lesson is a
self-contained, beginner-friendly, technically accurate chapter: intuition first, then mechanism, math where it
helps, runnable code with real output, a comparison, an animated visual, real-world use, pitfalls, and a
5-question quiz. The learner must score 4/5 on the quiz to pass the lesson, so the quiz must test only
what the lesson actually teaches.

## Content rules

- **Write original text.** Every sentence, example and structure must be your own. Do not copy or closely
  paraphrase any outside article, course or video, and do not mention or link to other courses, authors or sites.
  Lessons contain no external links at all; outside references live on the Useful links page (`src/course/resources.js`).
- **Cover every item in the lesson's `covers` list**, roughly in that order. Usually each item becomes a section
  or a clearly titled part of one. If `covers` is empty, design a sensible outline yourself from the title.
- Voice: simple words, short sentences, "we" voice, friendly and precise. Define every term the first time it
  appears. Use one running example through the lesson where possible (e.g. a support chatbot, house prices).
- Be technically correct and current (as of 2026). When something is uncertain or varies by model/vendor, say so.
  Never invent paper titles, numbers, benchmark results or product features. If you give numbers that are
  illustrative rather than measured, say "illustrative" in the caption.
- Length: 1,800–3,000 words of lesson text, 6–10 sections, `minutes` = honest reading + interaction time.
- **Code must be real.** Prefer Python 3.10 with only the standard library and `numpy`. Write it to a temp file
  in your scratch area, RUN it with `python`, and paste the exact stdout into `output`. Keep code 8–45 lines,
  commented. Use a fixed random seed. If a topic needs a library that is not installed (torch, transformers,
  vllm, langchain...), you may show that code with `lang` set and no `output`, but then ALSO include a runnable
  numpy/stdlib version that demonstrates the same idea with real output.
- Math: write with Unicode, not LaTeX: `softmax(QKᵀ / √dₖ) · V`, `ŷ = σ(w·x + b)`, `∑`, `∂L/∂w`, `λ`, `‖w‖₂²`.
- Inline markup inside any text string: `` `code` ``, `**bold**`, `*italic*`. Do not add links.
  Nothing else (no HTML, no headings, no LaTeX).

## Lesson object

```js
export default {
  id: 'how-does-a-vector-database-work',   // must equal the file name
  minutes: 16,
  hook: 'One question that makes the learner want to read on (1 sentence).',
  summary: 'The whole lesson in 2–3 plain sentences. Shown at the top as "In short".',
  sections: [ { id: 'kebab-case-id', title: 'Section title', blocks: [ /* blocks */ ] }, ... ],
  quiz: [ /* exactly 5 */ { q: 'Question?', options: ['A', 'B', 'C', 'D'], answer: 2, explain: 'Why C is right and the tempting wrong option is wrong.' } ],
  takeaways: ['3–6 one-line key points'],
  terms: [ { term: 'Embedding', def: 'One-sentence definition.' } ],   // 4–8 key terms of this lesson
};
```

### Required in every lesson (the validator enforces these)

- ≥ 5 sections (aim 6–10), each with a kebab-case `id` unique in the lesson.
- ≥ 1 animated visual: `viz`, `chart`, `flow`, `matrix` or `timeline`. Aim for 2–4 across the lesson.
- ≥ 1 `code` block, and at least one code block with a real `output`.
- ≥ 1 `compare` or `table` (aim for a `compare` — side-by-side comparison is a core feature of the site).
- ≥ 1 `steps` block (how it works, step by step).
- ≥ 1 `check` (inline "pause and think" question with revealed answer). Aim for 2.
- Exactly 5 quiz questions, each with 4 distinct options, `answer` 0–3, and an `explain`.
  Use at least 3 different answer positions across the 5. Mix question styles: 1 concept, 1 scenario
  ("Our RAG bot returns... what should we change?"), 1 numeric/code-reading, 1 compare/contrast,
  1 misconception. Distractors must be plausible. Do not ask about anything the lesson does not teach.
  Avoid "all of the above" / "none of the above".
- ≥ 3 takeaways.

Also use, where they fit: an `analogy` callout near the start, a `warn` callout for the common mistake,
an `example` callout or section on real-world use, a `deeper` panel for optional math/detail.

## Block types

```js
{ type: 'p', text: 'Paragraph with `code`, **bold**, *italic* and [links](https://example.com).' }

{ type: 'list', items: ['First', 'Second'], ordered: false }

{ type: 'callout', tone: 'analogy', title: 'Think of it like…', text: '…' }
// tone: 'note' | 'tip' | 'warn' | 'example' | 'analogy'

{ type: 'steps', title: 'Optional heading', items: [ { title: 'Embed the query', text: '…' }, { title: '…', text: '…' } ] }
// Rendered as an animated stepper the learner can play or click through. 3–7 items is ideal.

{ type: 'code', lang: 'python', title: 'Optional file name or label', code: `...`, output: `exact stdout`,
  walkthrough: [ { lines: [1, 4], note: 'What lines 1–4 do.' }, { lines: [6, 9], note: '…' } ] }
// `walkthrough` (optional, recommended): steps through line ranges, highlighting them. Lines are 1-based
// and inclusive. The "Run" button reveals `output` with a typing animation.
// Use template literals for code and output; escape any backtick as \` and any ${ as \${ inside them.

{ type: 'table', caption: 'Optional', head: ['Metric', 'Formula'], rows: [ ['Precision', 'TP / (TP + FP)'] ] }

{ type: 'compare', title: 'Keyword search vs semantic search',
  options: [
    { name: 'Keyword (BM25)', summary: 'Matches exact words.', pros: ['Fast', 'Exact IDs'], cons: ['Misses synonyms'], bestFor: 'Product codes, names' },
    { name: 'Semantic', summary: 'Matches meaning.', pros: ['Handles paraphrase'], cons: ['Can miss exact terms'], bestFor: 'Natural questions' },
  ],
  rows: [ ['Matches on', 'Shared words', 'Similar meaning'], ['Needs a model', 'No', 'Yes, an embedding model'] ],
  verdict: 'Use both together: that is hybrid search (next lesson).' }
// 2–4 options. `rows` optional: each row is [aspect, value for option 1, value for option 2, ...].

{ type: 'chart', kind: 'line', title: 'Training loss by epoch', xLabel: 'Epoch', yLabel: 'Loss',
  series: [ { name: 'Train', points: [[1, 2.1], [2, 1.4], [3, 1.0]] }, { name: 'Validation', points: [[1, 2.2], [2, 1.6], [3, 1.5]] } ],
  caption: 'Illustrative curves. …' }
// kind 'line' | 'area' | 'scatter' use series[].points [[x, y], ...] (numbers only).
{ type: 'chart', kind: 'bar', title: 'Memory per parameter', yLabel: 'Bytes', unit: ' B',
  labels: ['FP32', 'FP16', 'INT8', 'INT4'], series: [ { name: 'Bytes', values: [4, 2, 1, 0.5] } ], caption: '…' }
// kind 'bar' (vertical) | 'hbar' (horizontal, good for long labels) use labels + series[].values.
// Charts animate in when scrolled into view and show values on hover. 1–3 series. Keep numbers honest.

{ type: 'flow', title: 'The RAG pipeline', loop: false,
  nodes: [ { label: 'Question', detail: 'The user asks…' }, { label: 'Embed', detail: '…' }, { label: 'Search', detail: '…' } ] }
// Animated pipeline; a pulse travels node to node and the learner can click each node for its detail.
// loop: true draws it as a cycle (good for agent loops, training loops, RL). 3–7 nodes.

{ type: 'matrix', title: 'Attention weights', rows: ['The', 'cat', 'sat'], cols: ['The', 'cat', 'sat'],
  values: [[1, null, null], [0.3, 0.7, null], [0.2, 0.5, 0.3]], format: 'pct', caption: '…' }
// Animated heat map. null = masked/empty cell. format: 'pct' | 'num' (default 'num', 2 decimals) | 'int'.
// Good for attention maps, confusion matrices, similarity matrices.

{ type: 'timeline', title: 'From RNNs to modern LLMs',
  items: [ { when: '2017', title: 'Transformer', text: '“Attention Is All You Need”.' } ] }

{ type: 'formula', expr: 'Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V',
  where: [ ['Q', 'queries: what each token is looking for'], ['dₖ', 'key dimension'] ], caption: 'Optional' }

{ type: 'viz', name: 'temperature', caption: 'Drag the slider…' }
// Built-in interactive widgets. Allowed names and what they show are in src/course/vizNames.js.
// Only use a viz when it genuinely fits the lesson. Do not invent new names.

{ type: 'check', question: 'Pause and predict: …?', answer: 'Answer with the reason.' }

{ type: 'deeper', title: 'The math behind it', blocks: [ /* any blocks except deeper */ ] }

{ type: 'tabs', items: [ { label: 'Python', blocks: [ ... ] }, { label: 'Plain English', blocks: [ ... ] } ] }
```

## Recommended section shape

1. Why we need it / the problem (with an `analogy` callout)
2. The core idea in plain words
3. How it works step by step (`steps` and/or `flow`, plus a `viz` if one fits)
4. The math or mechanism, made concrete with small numbers (`formula`, `deeper`)
5. Code you can run (`code` with `walkthrough` and `output`)
6. Comparison with the alternative(s) (`compare`)
7. Real-world use (`callout` example / `table`)
8. Common mistakes and limits (`warn` callout) and when NOT to use it

Then quiz, takeaways and terms (rendered automatically from the lesson fields).
