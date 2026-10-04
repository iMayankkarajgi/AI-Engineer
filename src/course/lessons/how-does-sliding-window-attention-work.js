export default {
  id: 'how-does-sliding-window-attention-work',
  minutes: 18,
  hook: 'If each token may only look at its last few thousand neighbours, how can a model still connect ideas that are a hundred thousand tokens apart?',
  summary: 'Sliding window attention lets each token attend only to the previous W tokens instead of the whole sequence. That turns attention cost from quadratic to linear in sequence length and caps the KV cache at W entries per layer. Because layers are stacked, information can still hop W tokens per layer, so distant tokens are reachable indirectly, and many modern models mix sliding-window layers with a few full-attention layers.',
  sections: [
    {
      id: 'what-is-attention',
      title: 'What is attention?',
      blocks: [
        { type: 'p', text: '**Attention** is how a Transformer lets each token gather information from other tokens. Every token produces a **query** (what it is looking for), a **key** (what it offers) and a **value** (what it hands over). The token compares its query with every allowed key, turns the scores into weights with **softmax**, and takes a weighted average of the values.' },
        { type: 'p', text: 'In a chat LLM, attention is **causal**: a token can look at itself and earlier tokens, never later ones. Which pairs are allowed is described by a **mask**, a grid where row i, column j says whether token i may look at token j.' },
        { type: 'viz', name: 'causal-mask', caption: 'The standard causal mask: the upper triangle is blocked, so each token sees only itself and the past.' },
      ],
    },
    {
      id: 'problem-with-normal-attention',
      title: 'The problem with normal attention',
      blocks: [
        { type: 'p', text: 'With full causal attention, token number n compares itself with all n earlier tokens. Over a sequence of length n that is about n²/2 scores per head per layer. Double the length and the work roughly **quadruples**.' },
        { type: 'p', text: 'Generation has a second cost. The model keeps the keys and values of every past token in the **KV cache**. With full attention that cache grows with every token, forever. For a 100,000-token document it can need many gigabytes per user, and every new token has to read all of it.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like reading a long novel', text: 'Full attention is re-reading every previous page before writing each new word. Sliding window attention is keeping only the last few pages open on the desk. You still remember the plot from earlier chapters, because those chapters shaped the pages you are looking at now.' },
        { type: 'p', text: 'Running example: a customer-support log of 50,000 tokens. The current question is about a refund, and the customer\'s order number appeared 30,000 tokens ago. We will see how each kind of attention copes with that gap.' },
      ],
    },
    {
      id: 'what-is-swa',
      title: 'What is sliding window attention?',
      blocks: [
        { type: 'p', text: '**Sliding window attention (SWA)** restricts each token to a fixed-size window of the most recent tokens. With window size `W`, token i may attend to tokens `i − W + 1` through `i`. As i moves forward, the window slides with it.' },
        { type: 'formula', expr: 'allowed(i, j) = (j ≤ i) and (i − j < W)', where: [ ['i', 'position of the token doing the looking (query)'], ['j', 'position of the token being looked at (key)'], ['W', 'window size, e.g. 4,096 tokens'] ], caption: 'Blocked pairs get a score of −∞ before softmax, so their weight becomes 0.' },
        { type: 'p', text: 'Cost per token is now at most W scores, so total work grows **linearly**: about n × W instead of n²/2. The KV cache per layer never needs more than W entries; older entries can be overwritten in a **rolling buffer**, a fixed-size circular array where position i is stored at slot `i mod W`.' },
        { type: 'viz', name: 'sliding-window', caption: 'Change the window size and watch the mask band narrow or widen; see how far information can travel as layers stack.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'A simple step-by-step walkthrough',
      blocks: [
        { type: 'p', text: 'Take 8 tokens and a window of W = 3. Token 5 (counting from 0) may look at tokens 3, 4 and 5 only.' },
        { type: 'matrix', title: 'Sliding window mask, 8 tokens, W = 3 (1 = allowed)', rows: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'], cols: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'], values: [
          [1, null, null, null, null, null, null, null],
          [1, 1, null, null, null, null, null, null],
          [1, 1, 1, null, null, null, null, null],
          [null, 1, 1, 1, null, null, null, null],
          [null, null, 1, 1, 1, null, null, null],
          [null, null, null, 1, 1, 1, null, null],
          [null, null, null, null, 1, 1, 1, null],
          [null, null, null, null, null, 1, 1, 1],
        ], format: 'int', caption: 'Empty cells are masked. A diagonal band replaces the full lower triangle.' },
        { type: 'steps', title: 'What happens for token t7', items: [
          { title: 'Build the query', text: 't7 projects its vector into a query.' },
          { title: 'Find the window', text: 'With W = 3, only t5, t6 and t7 are allowed. t0–t4 are masked.' },
          { title: 'Score', text: 'Compute 3 dot products (query · key) instead of 8, and divide by √dₖ.' },
          { title: 'Softmax', text: 'Turn the 3 scores into weights that sum to 1. Masked tokens get weight 0.' },
          { title: 'Mix values', text: 'The output for t7 is the weighted average of the values of t5, t6, t7.' },
          { title: 'Evict', text: 'When t8 arrives, t5 leaves the window and its cache slot is reused for t8.' },
        ] },
      ],
    },
    {
      id: 'how-information-travels',
      title: 'How information still travels far away',
      blocks: [
        { type: 'p', text: 'At layer 1, t7 only sees t5–t7. But t5\'s layer-1 output already mixed in t3 and t4. So at layer 2, when t7 reads t5, it indirectly receives information from t3. Each layer extends the reach by about W − 1 positions. After L layers, the **receptive field** (how far back information can come from) is roughly `L × W` tokens.' },
        { type: 'p', text: 'Mistral 7B (2023) used W = 4,096 with 32 layers, giving a theoretical reach of about 32 × 4,096 = 131,072 tokens even though each layer looks only 4,096 back.' },
        { type: 'code', lang: 'python', title: 'sliding_window.py', code: `import numpy as np

def sliding_mask(n, w):
    # token i may attend to token j if j <= i (causal) and i - j < w (window)
    i = np.arange(n)[:, None]
    j = np.arange(n)[None, :]
    return (j <= i) & (i - j < w)

n, w = 8, 3
m = sliding_mask(n, w)
for row in m.astype(int):
    print(" ".join("x" if v else "." for v in row))
print("scores computed: full causal =", n * (n + 1) // 2, "| sliding =", int(m.sum()))

# How far back can information reach after stacking layers?
reach = np.eye(n, dtype=bool)                  # layer 0: each token knows itself
for layer in range(1, 4):
    reach = (m.astype(int) @ reach.astype(int)) > 0   # one more hop through the window
    print(f"after {layer} layer(s), last token sees tokens from position",
          int(np.argmax(reach[-1])))

# Mistral-7B-style numbers: window 4096, 32 layers
W, L = 4096, 32
print("theoretical reach:", W * L, "tokens")
print("KV cache kept per layer: full grows with n, sliding stays at", W)`, output: `x . . . . . . .
x x . . . . . .
x x x . . . . .
. x x x . . . .
. . x x x . . .
. . . x x x . .
. . . . x x x .
. . . . . x x x
scores computed: full causal = 36 | sliding = 21
after 1 layer(s), last token sees tokens from position 5
after 2 layer(s), last token sees tokens from position 3
after 3 layer(s), last token sees tokens from position 1
theoretical reach: 131072 tokens
KV cache kept per layer: full grows with n, sliding stays at 4096`,
          walkthrough: [
            { lines: [3, 7], note: 'The mask is two conditions combined: causal (j ≤ i) and inside the window (i − j < w).' },
            { lines: [9, 13], note: 'Print the band and count allowed pairs: 21 instead of 36. For long sequences the saving becomes enormous.' },
            { lines: [15, 20], note: 'Multiplying the mask with the reach matrix simulates one layer of information flow. Each layer pushes the reach back by w − 1 = 2 positions.' },
            { lines: [22, 25], note: 'The same logic at real scale: 32 layers × 4,096 window ≈ 131K tokens of theoretical reach, with a fixed-size cache.' },
          ] },
        { type: 'callout', tone: 'warn', title: 'Theoretical reach is not real memory', text: 'Information from far away must survive many hops, getting mixed and diluted at each layer. In practice a pure sliding-window model is much weaker at exact long-range recall (like quoting the order number from 30,000 tokens ago) than full attention. "Can reach" does not mean "reliably remembers".' },
        { type: 'check', question: 'A model uses W = 1,024 and 24 sliding-window layers. Roughly how far back can information travel in theory? Could it reliably copy an exact number that appeared 20,000 tokens earlier?', answer: 'About 24 × 1,024 ≈ 24,600 tokens in theory, so 20,000 is just inside the reach. But reliable exact copying is unlikely: the number must be relayed through about 20 layers of mixing. That is why many models keep some full-attention layers.' },
      ],
    },
    {
      id: 'comparing',
      title: 'Comparing normal attention and sliding window attention',
      blocks: [
        { type: 'compare', title: 'Full causal attention vs sliding window attention', options: [
          { name: 'Full causal attention', summary: 'Each token attends to all earlier tokens.', pros: ['Direct access to any past token', 'Best exact long-range recall'], cons: ['Compute grows with n²', 'KV cache grows without limit'], bestFor: 'Tasks needing precise recall across long documents' },
          { name: 'Sliding window attention', summary: 'Each token attends to the last W tokens only.', pros: ['Compute grows linearly with n', 'KV cache capped at W per layer', 'Simple to implement'], cons: ['Distant info only arrives indirectly', 'Weaker exact recall far back'], bestFor: 'Local patterns, streaming, long inputs on tight memory' },
        ], rows: [
          ['Scores per token', 'n (all past tokens)', 'W'],
          ['Total work for n tokens', '~n²/2', '~n × W'],
          ['KV cache per layer', 'n entries', 'W entries'],
          ['Path from token 1 to token n', '1 hop', '~n / W hops (layers)'],
        ], verdict: 'Most recent models do not choose one: they interleave many cheap sliding-window layers with a few full-attention layers to get both efficiency and long-range recall.' },
        { type: 'chart', kind: 'line', title: 'Attention scores per head per layer as the sequence grows (W = 4,096)', xLabel: 'Sequence length (thousands of tokens)', yLabel: 'Scores (millions)', series: [ { name: 'Full causal', points: [[4, 8.4], [8, 33.6], [16, 134.2], [32, 536.9], [64, 2147.5]] }, { name: 'Sliding window', points: [[4, 8.4], [8, 25.2], [16, 58.7], [32, 125.8], [64, 260]] } ], caption: 'Computed counts: full ≈ n²/2; sliding ≈ n × W once n > W (small terms rounded).' },
      ],
    },
    {
      id: 'where-used',
      title: 'Where sliding window attention is used',
      blocks: [
        { type: 'list', items: [
          '**Longformer (2020)** combined a sliding window with a few **global tokens** that attend everywhere, for long-document understanding.',
          '**Mistral 7B (2023)** popularised SWA in a decoder LLM, with a 4,096-token window and a rolling-buffer KV cache.',
          '**Gemma 2 and Gemma 3** alternate local sliding-window layers with global full-attention layers; Gemma 3 uses several local layers per global one to cut KV memory at long context.',
          '**gpt-oss (2025)** alternates dense attention layers with small banded (sliding) window layers.',
          '**Streaming setups** combine a sliding window with "attention sink" tokens, covered in the next lesson.',
        ] },
        { type: 'callout', tone: 'example', title: 'Back to the support log', text: 'In a hybrid model, the many local layers handle grammar and nearby context in the 50,000-token log cheaply, while the few global layers can directly fetch the order number from 30,000 tokens earlier. A pure SWA model with a 4,096 window would have to relay it through many layers and may lose the exact digits.' },
      ],
    },
    {
      id: 'advantages-tradeoffs',
      title: 'Advantages and trade-offs',
      blocks: [
        { type: 'list', items: [
          '**Advantage: linear cost.** Work and memory grow with n × W rather than n², making long inputs affordable.',
          '**Advantage: bounded memory.** The KV cache per layer is fixed, so memory use is predictable for any conversation length.',
          '**Advantage: locality matches language.** Most dependencies in text are local, so little is lost on many tasks.',
          '**Trade-off: weaker far recall.** Exact retrieval of a distant fact is harder, which hurts "needle in a haystack" style tasks.',
          '**Trade-off: window choice matters.** Too small hurts quality; too large removes the savings.',
          '**Trade-off: eviction effects.** Simply dropping the oldest tokens during streaming can destabilise the model because of attention sinks; the next lesson explains why and how to fix it.',
        ] },
        { type: 'check', question: 'We must build a contract-review tool that quotes exact clause numbers from anywhere in 200-page contracts. Should we use a pure sliding-window model?', answer: 'Probably not. Exact long-range recall is the weak spot of pure SWA. Prefer a model with full-attention layers (or a hybrid with global layers), possibly with retrieval to fetch relevant clauses.' },
      ],
    },
  ],
  quiz: [
    { q: 'With sliding window attention and window W, which tokens can token i attend to?', options: ['Every token that comes before position i', 'Only token i itself, nothing else', 'Tokens i − W + 1 through i', 'Tokens i through i + W − 1'], answer: 2, explain: 'The window covers the W most recent tokens up to and including i. Future tokens are blocked by the causal mask.' },
    { q: 'A model has 32 layers and a window of 4,096. What is its approximate theoretical reach?', options: ['4,096 tokens', 'About 131,000 tokens', '32 tokens, one per layer', 'Unlimited, like full attention'], answer: 1, explain: 'Each layer extends reach by about W, so L × W = 32 × 4,096 ≈ 131,072 tokens. 4,096 is the reach of a single layer.' },
    { q: 'How does total attention work grow with sequence length n for SWA with fixed W (when n ≫ W)?', options: ['Linearly, about n × W', 'Quadratically, about n²/2', 'It stays constant for any n', 'Exponentially with n'], answer: 0, explain: 'Each token computes at most W scores, so total work is about n × W, which is linear in n.' },
    { q: 'Why do many recent models interleave sliding-window layers with some full-attention layers?', options: ['Full-attention layers are cheaper to run than windowed ones', 'Sliding-window layers cannot be trained at all without global ones', 'To keep most savings while restoring direct long-range recall', 'Because it lets the KV cache grow without any upper limit'], answer: 2, explain: 'Local layers are cheap; a few global layers give direct access to any earlier token. Full attention is more expensive, not cheaper.' },
    { q: 'A colleague says: "Our SWA model reaches 131K tokens in theory, so it recalls facts from 100K tokens ago as well as full attention." What is the flaw?', options: ['Reach is only W tokens, so nothing beyond 4K is visible', 'Far information arrives indirectly and diluted, so recall is weaker', 'SWA models cannot process inputs longer than 4,096 tokens', 'Full attention also stops at exactly 131K tokens of reach'], answer: 1, explain: 'Theoretical reach means information can flow that far, not that it arrives intact. Exact long-range recall is the known weakness of pure SWA.' },
  ],
  takeaways: [
    'SWA limits each token to the last W tokens, turning n² attention cost into about n × W.',
    'The KV cache per layer is capped at W entries and can live in a rolling buffer.',
    'Stacking L layers lets information travel about L × W tokens, but only indirectly.',
    'Exact long-range recall is SWA\'s weak spot; hybrids add full-attention layers to compensate.',
    'Used in Longformer, Mistral 7B, Gemma 2/3 and gpt-oss, often mixed with global layers.',
  ],
  terms: [
    { term: 'Sliding window attention', def: 'Attention where each token sees only the most recent W tokens.' },
    { term: 'Window size (W)', def: 'How many recent tokens, including itself, a token may attend to.' },
    { term: 'Attention mask', def: 'A grid marking which query-key pairs are allowed; blocked pairs get weight 0.' },
    { term: 'Receptive field', def: 'How far back information can reach a token after stacking layers.' },
    { term: 'Rolling buffer cache', def: 'A fixed-size KV cache where new entries overwrite the oldest, using slot i mod W.' },
    { term: 'Global attention layer', def: 'A full-attention layer mixed into a mostly local model to restore long-range access.' },
  ],
};
