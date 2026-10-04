export default {
  id: 'causal-masking-in-attention',
  minutes: 23,
  hook: 'If a model is trained to predict the next word, but its attention can see the whole sentence, what stops it from simply peeking at the answer?',
  summary: 'A causal mask blocks every token from attending to tokens that come after it. We set the scores above the diagonal of the attention matrix to −∞ before softmax, so those weights become exactly 0. This lets a decoder-only LLM train on every position of a sentence in parallel without cheating, and makes training match how text is generated at inference time: one token at a time, left to right.',
  sections: [
    {
      id: 'the-problem',
      title: 'The problem: a next-word predictor that can see the future',
      blocks: [
        { type: 'p', text: 'A **decoder-only** LLM (the GPT, Llama, Claude family of models) is trained on one simple task: given the tokens so far, predict the next token. From the sentence "The cat sat down" we get several training examples at once: after "The" predict "cat", after "The cat" predict "sat", after "The cat sat" predict "down".' },
        { type: 'p', text: 'Transformers process all positions **in parallel**: the whole sentence goes through attention as one matrix. That is great for speed, but it creates a danger. In plain self-attention, every token can attend to every other token, including the ones to its right. When the model sits at position "cat" and tries to predict the next word, attention would let it look straight at "sat", which is the answer.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like an exam with the answer sheet face up', text: 'A student taking a fill-in-the-blank test with the answer key visible will score perfectly while learning nothing. On the real day, with no answer key, they fail. A causal mask turns the answer sheet face down: each position may only read what came before it.' },
        { type: 'p', text: 'At generation time there is no future to look at: the model writes tokens one by one, and the next token does not exist yet. If training let the model rely on future tokens, it would learn a skill it can never use when it matters. The **causal mask** forces training to match inference. "Causal" here means "respecting the order of cause and effect in time": earlier tokens can influence later ones, never the other way around.' },
      ],
    },
    {
      id: 'without-causal-masking',
      title: 'Without causal masking',
      blocks: [
        { type: 'p', text: 'Recall the attention recipe: scores = Q·Kᵀ / √dₖ, then softmax each row, then multiply by V. Let us take some illustrative scaled scores for "The cat sat down" and apply softmax without any mask. Each row shows how much one token attends to each token.' },
        { type: 'matrix', title: 'Unmasked attention weights (illustrative scores)', rows: ['The', 'cat', 'sat', 'down'], cols: ['The', 'cat', 'sat', 'down'], values: [[0.232, 0.085, 0.052, 0.631], [0.174, 0.474, 0.064, 0.287], [0.123, 0.203, 0.551, 0.123], [0.167, 0.102, 0.276, 0.455]], format: 'pct', caption: 'Computed with numpy from a made-up 4 × 4 score matrix. Everything above the diagonal is a peek into the future.' },
        { type: 'p', text: 'Look at the first row. The token "The" puts 63% of its attention on "down", the last word. If this representation is used to predict the word after "The", the model is reading ahead. During training, the loss would quickly drop to near zero by copying future tokens, and the model would learn nothing useful about language.' },
        { type: 'check', question: 'In the unmasked matrix, which row is already "legal" (it uses only past and present tokens)?', answer: 'The last row, "down". Every token is at or before position 4, so nothing it attends to is in the future. Every other row leaks some weight to tokens on its right.' },
      ],
    },
    {
      id: 'with-causal-masking',
      title: 'With causal masking',
      blocks: [
        { type: 'p', text: 'With a causal mask, row i may only use columns 1 to i. We take the same scores, replace every entry above the diagonal with −∞ (minus infinity), and run softmax again.' },
        { type: 'matrix', title: 'Causal attention weights (same scores, future masked)', rows: ['The', 'cat', 'sat', 'down'], cols: ['The', 'cat', 'sat', 'down'], values: [[1, null, null, null], [0.269, 0.731, null, null], [0.14, 0.231, 0.629, null], [0.167, 0.102, 0.276, 0.455]], format: 'pct', caption: 'Empty cells are masked. Each row still sums to 100%, spread only over allowed tokens.' },
        { type: 'p', text: 'Three things to notice:' },
        { type: 'list', items: [
          'The first token can only attend to itself, so its weight is 100%.',
          'The remaining weights are **renormalized**: the probability that used to go to the future is shared among the allowed tokens in proportion to their scores. Row "cat" was 17% / 47% and now becomes 27% / 73%.',
          'The last row is unchanged, because it had no future tokens to hide.',
        ] },
        { type: 'viz', name: 'causal-mask', caption: 'Watch the score matrix fill row by row as the upper triangle is set to −∞ and softmax turns those cells into zeros.' },
      ],
    },
    {
      id: 'the-causal-mask-matrix',
      title: 'The causal mask matrix',
      blocks: [
        { type: 'p', text: 'The mask itself is just a fixed pattern that depends only on the sequence length T. There are two common ways to write it:' },
        { type: 'table', caption: 'Two equivalent forms of the causal mask for T = 4', head: ['Boolean form (1 = blocked)', 'Additive form (added to scores)'], rows: [
          ['[0 1 1 1]', '[0 −∞ −∞ −∞]'],
          ['[0 0 1 1]', '[0 0 −∞ −∞]'],
          ['[0 0 0 1]', '[0 0 0 −∞]'],
          ['[0 0 0 0]', '[0 0 0 0]'],
        ] },
        { type: 'formula', expr: 'Mᵢⱼ = 0 if j ≤ i,   Mᵢⱼ = −∞ if j > i;    weights = softmax(Q·Kᵀ / √dₖ + M)', where: [
          ['i', 'the row: the token doing the attending (the query)'],
          ['j', 'the column: the token being attended to (the key)'],
          ['M', 'the additive causal mask, strictly upper triangle set to −∞'],
        ] },
        { type: 'p', text: 'Why −∞ and not 0? Because softmax exponentiates: e^(−∞) = 0 exactly, so a masked position gets weight 0 no matter what its score was. Setting a score to 0 would *not* hide it: e⁰ = 1, which is a perfectly ordinary weight. The allowed region (j ≤ i) is a **lower-triangular** pattern including the diagonal, which is why you will also hear "triangular mask" or "look-ahead mask".' },
        { type: 'deeper', title: 'Why masking before softmax matters', blocks: [
          { type: 'p', text: 'One could try computing softmax first and then zeroing the future weights afterwards. But then the rows would no longer sum to 1, and, worse, the softmax denominator would still contain e^(score) of future tokens, so information about the future would leak in through the normalization. Adding −∞ before softmax removes future tokens from both the numerator and the denominator.' },
        ] },
      ],
    },
    {
      id: 'implementation',
      title: 'Implementation of causal masking',
      blocks: [
        { type: 'steps', title: 'Causal attention, step by step', items: [
          { title: 'Compute scores', text: 'scores = Q·Kᵀ / √dₖ, a T × T matrix for T tokens.' },
          { title: 'Build the mask', text: 'Take a T × T matrix of ones and keep only the strict upper triangle (above the diagonal). In numpy: np.triu(ones, k=1).' },
          { title: 'Apply it', text: 'Wherever the mask is true, replace the score with −∞ (or add the additive mask).' },
          { title: 'Softmax each row', text: 'Masked entries become exactly 0; each row\'s remaining weights sum to 1.' },
          { title: 'Mix values', text: 'Multiply the weights by V as usual. Each output now depends only on its own token and earlier tokens.' },
        ] },
        { type: 'code', lang: 'python', title: 'causal_attention.py', code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)
rng = np.random.default_rng(42)

tokens = ["The", "cat", "sat", "down"]
T, d = 4, 8
Q, K, V = (rng.standard_normal((T, d)) for _ in range(3))

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)                       # exp(-inf) = 0
    return e / e.sum(axis=-1, keepdims=True)

def attend(Q, K, V, causal):
    scores = Q @ K.T / np.sqrt(d)
    if causal:
        mask = np.triu(np.ones((T, T), dtype=bool), k=1)  # True above diagonal
        scores = np.where(mask, -np.inf, scores)
    w = softmax(scores)
    return w, w @ V

mask = np.triu(np.ones((T, T), dtype=bool), k=1)
print("mask (1 = blocked):\\n", mask.astype(int))
w, out = attend(Q, K, V, causal=True)
print("causal weights:\\n", w)

# Leak test: change the LAST token's key and value, keep everything else
K2, V2 = K.copy(), V.copy()
K2[3] += 5.0
V2[3] += 5.0
for causal in (False, True):
    _, a = attend(Q, K, V, causal)
    _, b = attend(Q, K2, V2, causal)
    changed = [tokens[i] for i in range(T) if not np.allclose(a[i], b[i])]
    print(f"causal={causal}: outputs that changed -> {changed}")`,
          output: `mask (1 = blocked):
 [[0 1 1 1]
 [0 0 1 1]
 [0 0 0 1]
 [0 0 0 0]]
causal weights:
 [[1.   0.   0.   0.  ]
 [0.56 0.44 0.   0.  ]
 [0.36 0.3  0.34 0.  ]
 [0.19 0.44 0.18 0.19]]
causal=False: outputs that changed -> ['The', 'cat', 'sat', 'down']
causal=True: outputs that changed -> ['down']`,
          walkthrough: [
            { lines: [5, 7], note: 'Four tokens with random 8-dimensional queries, keys and values. A fixed seed makes the run reproducible.' },
            { lines: [9, 12], note: 'Stable softmax. Subtracting the row max is safe even with −∞ entries, because each row has at least one finite score (the diagonal).' },
            { lines: [14, 20], note: 'np.triu(..., k=1) marks the strict upper triangle; np.where swaps those scores for −∞ before softmax.' },
            { lines: [22, 25], note: 'Print the mask and the causal weights: zeros above the diagonal, each row summing to 1.' },
            { lines: [27, 35], note: 'The leak test. We change only the last token. Without the mask, every output changes (the future leaked everywhere). With the mask, only the last token\'s own output changes.' },
          ] },
        { type: 'p', text: 'The leak test is the most useful way to convince yourself (or a unit test) that masking works: **perturb a future token and check that earlier outputs do not move.**' },
        { type: 'check', question: 'What would go wrong if we wrote np.triu(..., k=0) instead of k=1?', answer: 'k=0 includes the diagonal, so each token would be blocked from attending to itself. The first row would then have every entry at −∞, softmax would divide 0 by 0 and produce NaN. The diagonal must stay allowed.' },
      ],
    },
    {
      id: 'causal-vs-bidirectional',
      title: 'Causal vs bidirectional attention',
      blocks: [
        { type: 'compare', title: 'Which attention pattern does each model use?', options: [
          { name: 'Bidirectional (no mask)', summary: 'Every token sees every token, left and right.', pros: ['Full context for understanding', 'Great sentence representations'], cons: ['Cannot be trained as a left-to-right generator', 'Needs other objectives such as masked-word prediction'], bestFor: 'Encoders like BERT: classification, embeddings, search' },
          { name: 'Causal (triangular mask)', summary: 'Each token sees only itself and earlier tokens.', pros: ['Trains next-token prediction on all positions in parallel', 'Matches left-to-right generation', 'Enables KV caching'], cons: ['Early tokens never see later context in the same layer'], bestFor: 'Decoder-only LLMs: GPT, Llama, Claude, Mistral' },
        ], rows: [
          ['Mask', 'None (except padding)', 'Upper triangle = −∞'],
          ['Training task', 'Fill in hidden words', 'Predict the next token'],
          ['Typical use', 'Understanding text', 'Generating text'],
        ], verdict: 'Use causal masking whenever a model must generate left to right. Encoder-decoder models use both: bidirectional in the encoder, causal in the decoder\'s self-attention.' },
        { type: 'flow', title: 'Why one sentence gives T training examples at once', nodes: [
          { label: 'Input', detail: 'The full sequence "The cat sat down" is fed in once.' },
          { label: 'Causal attention', detail: 'Position i only mixes information from positions 1..i in every layer.' },
          { label: 'Per-position output', detail: 'Each position produces a prediction for the token that follows it.' },
          { label: 'Shifted targets', detail: 'Targets are the input shifted left by one: cat, sat, down, <end>.' },
          { label: 'Loss', detail: 'Cross-entropy is averaged over all positions in one parallel pass.' },
        ] },
      ],
    },
    {
      id: 'real-world-and-pitfalls',
      title: 'Real-world use, pitfalls and limits',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Where causal masks show up', text: 'Every decoder-only LLM applies a causal mask in every self-attention layer during training and during the **prefill** step at inference (when the whole prompt is processed at once). Attention libraries usually expose a flag such as `is_causal=True` so the kernel can skip the masked half of the work entirely instead of building a T × T matrix. The causal structure is also what makes the **KV cache** valid: since earlier tokens never depend on later ones, their keys and values never need recomputing when a new token arrives.' },
        { type: 'p', text: 'In real batches, the causal mask is often **combined** with a **padding mask**: shorter sequences are padded with filler tokens to a common length, and those filler positions must also be hidden. The two masks are simply combined so a position is blocked if either mask blocks it.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Masking after softmax instead of before (rows stop summing to 1 and the future leaks through the denominator). Using k=0 and masking the diagonal (NaN rows). Using a huge negative number like −1e9 in float16, which overflows; use −∞ or the dtype\'s minimum value. Forgetting the mask when writing custom attention, which shows up as a training loss that drops suspiciously fast and a model that generates nonsense.' },
        { type: 'p', text: '**When not to use it:** if the task is understanding a complete input (classifying a support ticket, producing an embedding for search), a causal mask throws away useful right-hand context. Bidirectional encoders are usually a better fit there. And note what causal masking does *not* do: it does not tell the model *where* tokens are. Position information comes from separate mechanisms such as RoPE, covered in a later lesson.' },
      ],
    },
    {
      id: "causal-plus-padding",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "We said the causal mask is often combined with a padding mask. Let us see exactly how, on one short sentence. “The cat sat” has 3 tokens, but its batch needs length 5, so two filler tokens are added on the right. Two rules now apply at once: a token may not look at the future, and nobody may look at filler." },
        { type: "steps", title: "Building the combined mask", items: [
          { title: "Causal part", text: "Block every cell above the diagonal. This depends only on the length, 5." },
          { title: "Padding part", text: "Block every *column* that belongs to a filler token. This depends on the data: here columns 4 and 5." },
          { title: "Combine", text: "A cell is blocked if either rule blocks it. In code this is a logical OR of two true/false tables." },
          { title: "Softmax", text: "Blocked cells get −∞ and end up with weight 0. Each row shares its weight among what is left." },
          { title: "Mask the loss too", text: "The filler positions still produce a prediction. We leave those out of the loss, so the model is never trained to predict filler." },
        ] },
        { type: "matrix", title: "Combined causal + padding weights for “The cat sat” padded to 5", rows: ["The", "cat", "sat", "<pad>", "<pad>"], cols: ["The", "cat", "sat", "<pad>", "<pad>"], values: [[1, null, null, null, null], [0.5, 0.5, null, null, null], [0.33, 0.33, 0.33, null, null], [0.33, 0.33, 0.33, null, null], [0.33, 0.33, 0.33, null, null]], format: "pct", caption: "Illustrative: all scores are set equal, so the weights show only the masks. Empty cells are blocked. The two filler columns are empty in every row." },
        { type: "p", text: "Notice a subtle point. With filler on the **right**, the three real tokens already could not see it: it lies in their future, so the causal mask hides it. The padding mask only changes the filler rows. The part that truly protects training here is leaving filler out of the loss." },
        { type: "callout", tone: "warn", title: "Where padding goes wrong", text: "Put the filler on the **left** and the picture changes. The first row is a filler token that may see only itself, and itself is blocked. The whole row is −∞, softmax divides 0 by 0, and the result is NaN. One NaN then spreads through every later layer. If a model suddenly outputs NaN only for batches with mixed lengths, a fully blocked row is the first thing to look for." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the combined mask for a padded sentence, turn it into attention weights, and then list for every position what it can see, what it must predict and whether that prediction counts in the loss." },
        { type: "code", lang: "python", title: "practice_causal_padding.py", code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)

# One short sentence, padded to length 5 so it fits in a batch
tokens = ["The", "cat", "sat", "<pad>", "<pad>"]
T = len(tokens)
is_pad = np.array([t == "<pad>" for t in tokens])

causal = np.triu(np.ones((T, T), dtype=bool), k=1)   # True = future token
padding = np.tile(is_pad, (T, 1))                    # True = filler column
blocked = causal | padding                           # blocked if either says so
print("blocked (1 = hidden):\\n", blocked.astype(int))

# Equal scores everywhere, so the weights show only the effect of the masks
scores = np.where(blocked, -np.inf, np.zeros((T, T)))
e = np.exp(scores - scores.max(axis=1, keepdims=True))
weights = e / e.sum(axis=1, keepdims=True)
print("weights:\\n", weights)

# Training targets: the input shifted left by one position
targets = tokens[1:3] + ["<end>", "<pad>", "<pad>"]
for i in range(T):
    sees = [tokens[j] for j in range(T) if not blocked[i, j]]
    in_loss = "yes" if targets[i] != "<pad>" else "no (ignored)"
    print(f"{tokens[i]:5s} sees {str(sees):22s} predicts {targets[i]:5s} in loss: {in_loss}")`, output: `blocked (1 = hidden):
 [[0 1 1 1 1]
 [0 0 1 1 1]
 [0 0 0 1 1]
 [0 0 0 1 1]
 [0 0 0 1 1]]
weights:
 [[1.   0.   0.   0.   0.  ]
 [0.5  0.5  0.   0.   0.  ]
 [0.33 0.33 0.33 0.   0.  ]
 [0.33 0.33 0.33 0.   0.  ]
 [0.33 0.33 0.33 0.   0.  ]]
The   sees ['The']                predicts cat   in loss: yes
cat   sees ['The', 'cat']         predicts sat   in loss: yes
sat   sees ['The', 'cat', 'sat']  predicts <end> in loss: yes
<pad> sees ['The', 'cat', 'sat']  predicts <pad> in loss: no (ignored)
<pad> sees ['The', 'cat', 'sat']  predicts <pad> in loss: no (ignored)`,
          walkthrough: [
            { lines: [4, 7], note: "Three real tokens and two filler tokens. `is_pad` marks which positions are filler." },
            { lines: [9, 12], note: "The causal table blocks the upper triangle. The padding table blocks whole columns. The `|` operator combines them: blocked if either one says so." },
            { lines: [14, 18], note: "Give every cell the same score, set blocked cells to −∞ and run softmax. The weights now show the mask pattern and nothing else." },
            { lines: [20, 25], note: "Targets are the input shifted left by one. The last real token predicts the end marker. Positions whose target is filler are skipped in the loss." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change `blocked = causal | padding` to `blocked = causal`. Predict first: which rows of the weights change, and which stay exactly the same?",
          "Change `k=1` to `k=2` in `np.triu`. Predict what “The” can now see, and why that ruins training.",
          "Move the filler to the left: `tokens = [\"<pad>\", \"<pad>\", \"The\", \"cat\", \"sat\"]`. Predict the first row of the weights (ignore the target printout for this one).",
        ] },
        { type: "check", question: "The filler rows print weights of 0.33 over the three real tokens. So the model does real attention work for filler positions. Does this change anything for the real tokens, and is it free?", answer: "It changes nothing for the real tokens: no row may attend to a filler column, and the filler predictions are left out of the loss. But it is not free. Those rows still cost compute and memory in every layer. That is why training pipelines group sentences of similar length into the same batch, to keep filler small." },
        { type: "check", question: "The position “sat” must predict `<end>`, and that prediction counts in the loss. What would the model fail to learn if we ignored it, the way we ignore filler?", answer: "It would never learn when to stop. The end marker is a real token with a real meaning: the text is complete. A model that was never trained to predict it would keep generating until it hits the length limit. Filler has no meaning and is skipped; the end marker must be learned." },
      ],
    },
  ],
  quiz: [
    { q: 'What is the main purpose of a causal mask in a decoder-only LLM?', options: ['To stop each token from attending to tokens that come after it', 'To make attention run faster on GPUs by skipping half the matrix', 'To tell the model the position of each token in the sequence', 'To hide the padding tokens added when sequences are batched'], answer: 0, explain: 'The mask blocks attention to future tokens so next-token prediction cannot cheat. Position information and padding masks are separate concerns, though they are often used alongside it.' },
    { q: 'Why are masked scores set to −∞ rather than 0 before softmax?', options: ['Because −∞ is faster for the GPU to process than an ordinary 0', 'A 0 score still gets weight e⁰ = 1; only e^(−∞) = 0 removes the token', 'Because softmax cannot accept zeros and would divide by zero', 'To keep the attention matrix symmetric, which softmax requires'], answer: 1, explain: 'Softmax exponentiates scores. A 0 score is an ordinary score and still gets weight; only −∞ yields exactly zero weight.' },
    { q: 'For a 5-token sequence, how many of the 25 entries in the attention matrix are masked by a causal mask?', options: ['5', '15', '20', '10'], answer: 3, explain: 'The strict upper triangle has 5·4/2 = 10 entries. The 15 allowed entries are the diagonal (5) plus the lower triangle (10).' },
    { q: 'You write custom attention, and your training loss drops to almost zero in a few hundred steps, but generated text is gibberish. What is the most likely bug?', options: ['The learning rate is too high, so the weights diverged early on', 'The √dₖ scaling is applied twice, so attention is too flat', 'The causal mask is missing, so the model copies future tokens', 'The vocabulary is too small, so many words map to one token'], answer: 2, explain: 'A suspiciously low training loss plus useless generation is the classic sign of future leakage. At generation time there is no future token to copy.' },
    { q: 'Which statement contrasting BERT-style encoders with GPT-style decoders is correct?', options: ['Both use a causal mask in self-attention', 'BERT-style encoders use bidirectional attention; GPT-style decoders use causal attention', 'GPT-style decoders use bidirectional attention during training and causal attention only at inference', 'Causal masking is only needed in encoders'], answer: 1, explain: 'Encoders see full context for understanding tasks; decoder-only LLMs use causal masks in both training and prefill so training matches left-to-right generation.' },
  ],
  takeaways: [
    'A causal mask lets each token attend only to itself and earlier tokens.',
    'It is applied by adding −∞ to scores above the diagonal before softmax, giving those positions exactly zero weight.',
    'It lets one forward pass train next-token prediction on every position in parallel without cheating.',
    'Test it with a leak test: changing a future token must not change earlier outputs.',
    'Encoders like BERT skip it; decoder-only LLMs need it in every self-attention layer.',
  ],
  terms: [
    { term: 'Causal mask', def: 'A triangular mask that blocks attention from any token to tokens after it.' },
    { term: 'Decoder-only model', def: 'A Transformer that generates text left to right using causally masked self-attention.' },
    { term: 'Bidirectional attention', def: 'Attention where every token can see tokens on both sides.' },
    { term: 'Lower-triangular matrix', def: 'A matrix whose entries above the diagonal are zero (or, here, blocked).' },
    { term: 'Padding mask', def: 'A mask that hides filler tokens added to make sequences in a batch the same length.' },
    { term: 'Prefill', def: 'The inference step where the whole prompt is processed in parallel before generating new tokens.' },
  ],
};
