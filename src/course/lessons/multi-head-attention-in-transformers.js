export default {
  id: 'multi-head-attention-in-transformers',
  minutes: 20,
  hook: 'One attention pattern per token is a single opinion about what matters. What if each layer could hold a dozen different opinions at once, for the same cost?',
  summary: 'Multi-head attention runs several smaller attention operations ("heads") side by side. Each head has its own query, key and value projections, so it can learn its own pattern, such as "look at the previous word" or "look at the subject". The head outputs are concatenated and mixed by one more matrix, W_o. Because each head works in d_model / h dimensions, the total cost is about the same as one big head.',
  sections: [
    {
      id: 'what-is-multi-head-attention',
      title: 'What is multi-head attention?',
      blocks: [
        { type: 'p', text: '**Multi-head attention (MHA)** is the version of attention used inside every Transformer layer. Instead of computing one set of attention weights per token, it computes **h** separate sets in parallel, one per **head**. Each head is a complete, smaller copy of the attention mechanism with its own learned projection matrices. At the end, the heads\' results are joined together and blended into a single output.' },
        { type: 'formula', expr: 'MultiHead(X) = Concat(head₁, …, headₕ) · W_o,   headᵢ = Attention(X·W_qⁱ, X·W_kⁱ, X·W_vⁱ)', where: [
          ['h', 'number of heads (for example 8, 12, 32)'],
          ['W_qⁱ, W_kⁱ, W_vⁱ', 'head i\'s own projections, each d_model × d_head'],
          ['d_head', 'width of each head, usually d_model / h'],
          ['W_o', 'output projection, d_model × d_model, mixes the heads'],
        ], caption: 'Attention(Q, K, V) = softmax(Q·Kᵀ / √d_head) · V inside each head.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a panel of specialist editors', text: 'Hand a sentence to one editor and they read it with one focus. Hand it to eight editors, one checking grammar, one tracking who "she" refers to, one checking dates, one following the topic, and you get a richer review. Each editor writes short notes; the chief editor (W_o) combines them into one report. The heads are the specialists.' },
      ],
    },
    {
      id: 'self-attention-recap',
      title: 'A quick recap of self-attention',
      blocks: [
        { type: 'p', text: 'In **self-attention**, every token of a sequence attends to the tokens of the same sequence. From the token matrix X (tokens × d_model) we compute queries Q = X·W_q, keys K = X·W_k and values V = X·W_v. Scores Q·Kᵀ are divided by √dₖ, softmax turns each row into weights, and each token\'s output is the weighted average of the value vectors.' },
        { type: 'p', text: 'The key limitation: for each token, a single softmax produces **one** set of weights. Softmax tends to concentrate weight on a few tokens, so one head usually can only focus strongly on one or two relationships at a time. If the word "it" needs to know both *which noun it refers to* and *which verb governs it*, a single averaged view blurs those two needs together.' },
      ],
    },
    {
      id: 'why-multiple-heads',
      title: 'Why do we need multi-head attention?',
      blocks: [
        { type: 'p', text: 'Language has many relationships at once. In "The animal did not cross the street because it was too tired", useful links include: "it" → "animal" (what the pronoun refers to), "tired" → "it" (what is tired), "cross" → "street" (verb and object), and every word → its neighbour (local word order). A single attention pattern must compromise between these. Multiple heads remove the compromise: each head can specialize.' },
        { type: 'p', text: 'Researchers who inspect trained models do find heads with recognizable roles: heads that mostly look at the previous token, heads that link pronouns to nouns, heads that attend to punctuation or to the first token, and "induction heads" that help copy patterns seen earlier in the context. Not every head is that tidy, and studies have shown that many heads can be removed at test time with little loss, so heads overlap and are partly redundant. Still, having several gives the model room to represent different relationships in parallel.' },
        { type: 'viz', name: 'multi-head', caption: 'Switch between heads that learned different patterns: previous-token, subject-tracking and punctuation. Same sentence, very different weight maps.' },
        { type: 'check', question: 'If each head is just attention with different weights, why would different heads learn different things rather than all the same pattern?', answer: 'They start from different random initial weights, and the output matrix W_o rewards them for contributing useful, non-duplicated information to the loss. Nothing forces them to be different, which is why some heads do end up redundant.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-step working of multi-head attention',
      blocks: [
        { type: 'steps', title: 'From input to output', items: [
          { title: 'Project', text: 'Compute Q = X·W_q, K = X·W_k, V = X·W_v with full d_model × d_model matrices. This is the same as applying h separate d_model × d_head projections, just packed into one matrix multiply.' },
          { title: 'Split into heads', text: 'Reshape each of Q, K, V from (T × d_model) to (h × T × d_head): the first d_head columns belong to head 1, the next to head 2, and so on.' },
          { title: 'Attend per head', text: 'Each head independently computes softmax(QᵢKᵢᵀ / √d_head)·Vᵢ, giving (T × d_head). All heads run in parallel as one batched operation.' },
          { title: 'Concatenate', text: 'Place the h head outputs side by side to get back a (T × d_model) matrix.' },
          { title: 'Mix with W_o', text: 'Multiply by W_o (d_model × d_model) so information from different heads can combine. The result goes to the residual connection and then the feed-forward network.' },
        ] },
        { type: 'flow', title: 'Data shapes through one multi-head attention layer (T tokens, d_model = 512, h = 8)', nodes: [
          { label: 'X (T×512)', detail: 'Token representations entering the layer.' },
          { label: 'Q, K, V (T×512)', detail: 'Three projections, each one matrix multiply.' },
          { label: '8 heads (8×T×64)', detail: 'Reshape: each head gets 64 dimensions of Q, K and V.' },
          { label: 'Per-head attention', detail: 'Eight T×T weight maps, each scaled by √64 = 8, then times V.' },
          { label: 'Concat (T×512)', detail: 'Eight 64-wide outputs side by side.' },
          { label: 'W_o (T×512)', detail: 'Final mixing projection; same shape as the input.' },
        ] },
      ],
    },
    {
      id: 'cost-and-shapes',
      title: 'Same cost as one big head',
      blocks: [
        { type: 'p', text: 'A natural worry: if we have 8 heads, is attention 8 times more expensive? No. Each head works in a **smaller** space, d_head = d_model / h. With d_model = 512 and 8 heads, each head uses 64 dimensions. The four projection matrices are still d_model × d_model each, so the parameter count is 4·d_model², exactly what a single 512-wide head with an output projection would use. The score computations are split across heads, so the total arithmetic is also about the same.' },
        { type: 'table', caption: 'Published configurations of well-known models', head: ['Model', 'd_model', 'Heads h', 'd_head'], rows: [
          ['Original Transformer (base, 2017)', '512', '8', '64'],
          ['GPT-2 small', '768', '12', '64'],
          ['Llama 2 7B', '4,096', '32', '128'],
        ] },
        { type: 'p', text: 'One thing that **does** grow with the number of heads is the number of attention maps: h maps of size T × T per layer. That matters for memory when sequences are long, and it is one reason later designs such as grouped-query attention share keys and values between heads (covered in a later lesson).' },
        { type: 'check', question: 'A model has d_model = 1024 and 16 heads. What is d_head, and what number do the scores get divided by?', answer: 'd_head = 1024 / 16 = 64, and scores are divided by √64 = 8. The scale uses the per-head width, not d_model.' },
      ],
    },
    {
      id: 'walk-through',
      title: 'A simple example walk-through',
      blocks: [
        { type: 'p', text: 'Let us run a tiny multi-head layer: 4 tokens, d_model = 8, 2 heads of width 4. The weights are random (untrained), so the patterns mean nothing linguistically. The point is to watch the shapes and to see that the two heads produce **different** weight maps from the same input.' },
        { type: 'code', lang: 'python', title: 'multi_head.py', code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)
rng = np.random.default_rng(7)

T, d_model, h = 4, 8, 2            # 4 tokens, model width 8, 2 heads
d_head = d_model // h              # each head works in 4 dims
X = rng.standard_normal((T, d_model))
W_q, W_k, W_v, W_o = (rng.standard_normal((d_model, d_model)) * 0.5 for _ in range(4))

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

def split_heads(M):                # (T, d_model) -> (h, T, d_head)
    return M.reshape(T, h, d_head).transpose(1, 0, 2)

Q, K, V = split_heads(X @ W_q), split_heads(X @ W_k), split_heads(X @ W_v)
print("Q per head shape:", Q.shape)

scores = Q @ K.transpose(0, 2, 1) / np.sqrt(d_head)   # (h, T, T)
weights = softmax(scores)
for i in range(h):
    print(f"head {i} attention weights:\\n", weights[i])

heads = weights @ V                                   # (h, T, d_head)
concat = heads.transpose(1, 0, 2).reshape(T, d_model) # glue heads side by side
out = concat @ W_o                                    # mix heads together
print("concat shape:", concat.shape, "-> output shape:", out.shape)
print("params in W_q,W_k,W_v,W_o:", 4 * d_model * d_model)`,
          output: `Q per head shape: (2, 4, 4)
head 0 attention weights:
 [[0.05 0.04 0.37 0.53]
 [0.11 0.14 0.39 0.36]
 [0.01 0.01 0.51 0.47]
 [0.12 0.05 0.66 0.17]]
head 1 attention weights:
 [[0.17 0.18 0.29 0.36]
 [0.11 0.09 0.68 0.12]
 [0.09 0.18 0.04 0.69]
 [0.22 0.2  0.37 0.21]]
concat shape: (4, 8) -> output shape: (4, 8)
params in W_q,W_k,W_v,W_o: 256`,
          walkthrough: [
            { lines: [5, 8], note: 'Tiny sizes: 4 tokens, width 8, 2 heads of 4 dims. Four random 8 × 8 matrices stand in for learned weights.' },
            { lines: [15, 19], note: 'split_heads reshapes (4, 8) into (2, 4, 4): two heads, each seeing 4 tokens with 4 dims. Columns 0–3 go to head 0, columns 4–7 to head 1.' },
            { lines: [21, 24], note: 'Batched attention: one (4 × 4) weight map per head, scaled by √d_head = 2. Notice the two maps differ even though the input is identical.' },
            { lines: [26, 28], note: 'Each head\'s output is (4 × 4); transposing and reshaping places them side by side as (4 × 8). W_o then mixes across heads.' },
            { lines: [29, 30], note: 'Output shape equals input shape, which is what lets layers stack. Parameters: 4 × 8 × 8 = 256, the same as one 8-wide head.' },
          ] },
        { type: 'p', text: 'Look at the first row of each head: head 0 sends 53% of token 1\'s attention to token 4, while head 1 spreads it more evenly. Even with random weights, different projections give different views. Training turns those arbitrary differences into useful specializations.' },
        { type: 'matrix', title: 'Illustrative trained patterns: a previous-token head on "The cat sat down"', rows: ['The', 'cat', 'sat', 'down'], cols: ['The', 'cat', 'sat', 'down'], values: [[1, null, null, null], [0.85, 0.15, null, null], [0.05, 0.85, 0.1, null], [0.03, 0.04, 0.85, 0.08]], format: 'pct', caption: 'Illustrative numbers (not from a real model), with a causal mask. Each token puts most weight on the word just before it, a pattern often seen in real heads.' },
      ],
    },
    {
      id: 'compare-single-vs-multi',
      title: 'Single-head vs multi-head',
      blocks: [
        { type: 'compare', title: 'One wide head vs several narrower heads (same d_model)', options: [
          { name: 'Single head', summary: 'One attention map per token over the full width.', pros: ['Simplest to implement', 'Each score uses all dimensions'], cons: ['One pattern per token per layer', 'Different relations get averaged together'], bestFor: 'Teaching and toy models' },
          { name: 'Multi-head', summary: 'h attention maps per token, each over d_model / h dims.', pros: ['Several relationships at once', 'Same parameters and similar compute', 'Heads can specialize'], cons: ['More attention maps to store for long sequences', 'Too many tiny heads can lose capacity per head'], bestFor: 'Every production Transformer' },
        ], rows: [
          ['Attention maps per layer', '1', 'h'],
          ['Width per map', 'd_model', 'd_model / h'],
          ['Projection parameters', '4·d_model²', '4·d_model²'],
        ], verdict: 'Multi-head attention gives several views of the sequence for essentially the same price, which is why it became the default.' },
      ],
    },
    {
      id: 'where-used-and-advantages',
      title: 'Where multi-head attention is used and why it helps',
      blocks: [
        { type: 'p', text: 'Multi-head attention appears in every Transformer family:' },
        { type: 'list', items: [
          '**Decoder-only LLMs** (GPT, Llama, Claude, Mistral): multi-head *causal* self-attention in every layer.',
          '**Encoders** (BERT and embedding models): multi-head bidirectional self-attention.',
          '**Encoder-decoder models** (T5, translation models, Whisper): multi-head self-attention plus multi-head *cross*-attention (next lesson).',
          '**Vision Transformers**: image patches play the role of tokens, and heads learn spatial relationships.',
        ] },
        { type: 'p', text: '**Advantages** in summary: several relationships captured in parallel; no extra parameters versus one head of the same width; fully parallel on GPUs as one batched matrix operation; and some interpretability, because individual heads can be inspected.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes and limits', text: 'Reshaping in the wrong order (splitting tokens instead of features) silently mixes up heads; always split the feature dimension. Scaling by √d_model instead of √d_head. Forgetting W_o, which leaves heads unable to combine. And reading too much into a single head: head roles are fuzzy, overlapping and differ from model to model, so "head 5 does coreference" is a description of tendencies, not a rule.' },
        { type: 'callout', tone: 'tip', title: 'Where this goes next', text: 'Because every head stores its own keys and values during generation, multi-head attention is memory-hungry at inference. Multi-query and grouped-query attention keep many query heads but share key/value heads to shrink that memory. You will meet them in the efficiency module.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does each head in multi-head attention have of its own?', options: ['Its own query, key and value projections, so it learns its own pattern', 'Its own copy of the input sentence, translated into a different language', 'Its own output vocabulary, so each head predicts different next tokens', 'Its own feed-forward network that runs right after its attention step'], answer: 0, explain: 'Each head has separate W_q, W_k, W_v slices and computes its own weight map. The feed-forward network sits after attention and is shared by all heads in the layer.' },
    { q: 'A layer has d_model = 768 and 12 heads. What is the width of each head?', options: ['768', '12', '9,216', '64'], answer: 3, explain: '768 / 12 = 64. Each head attends in a 64-dimensional space, and the 12 outputs are concatenated back to 768.' },
    { q: 'Compared with a single 512-wide attention head, how many projection parameters does an 8-head layer with d_model = 512 use?', options: ['8 times more, one full set per head', 'About the same: 4·512² in both cases', 'One eighth as many, since each head is narrower', 'Twice as many because of the concatenation step'], answer: 1, explain: 'The Q, K, V and output matrices are each 512 × 512 in both cases; multi-head attention just splits the columns among heads.' },
    { q: 'Your teammate builds multi-head attention but skips W_o, feeding the concatenated heads straight to the next block. What capability is weakened?', options: ['The model loses its causal mask, so tokens can see the future', 'The attention scores can no longer be scaled before the softmax', 'Heads’ outputs can no longer be mixed into combined features', 'The heads can no longer run in parallel as one batched operation'], answer: 2, explain: 'W_o is the learned mixing step across heads. Without it, each head\'s output stays in its own slice of the vector.' },
    { q: 'Which statement about attention heads is a misconception?', options: ['Different heads can learn different patterns, such as previous-token or pronoun links', 'Every trained head has one clean, readable job, and removing any head breaks the model', 'Heads run in parallel as one batched computation rather than one after another', 'Each head scales its attention scores by the square root of its own width, √d_head'], answer: 1, explain: 'Head roles are fuzzy and overlapping; studies have found many heads can be pruned at test time with small losses. The other statements are accurate.' },
  ],
  takeaways: [
    'Multi-head attention runs h smaller attention operations in parallel, each with its own projections.',
    'Each head works in d_head = d_model / h dimensions, so total parameters and compute stay about the same as one head.',
    'Heads can specialize in different relationships; their outputs are concatenated and mixed by W_o.',
    'Shapes: (T × d_model) → split to (h × T × d_head) → attend → concat back to (T × d_model).',
    'Head roles are tendencies, not rules, and many heads are partly redundant.',
  ],
  terms: [
    { term: 'Head', def: 'One independent attention computation with its own query, key and value projections.' },
    { term: 'd_head', def: 'The width of each head, usually d_model divided by the number of heads.' },
    { term: 'Concatenation', def: 'Placing the head outputs side by side to rebuild a d_model-wide vector.' },
    { term: 'Output projection (W_o)', def: 'The learned matrix that mixes the concatenated head outputs.' },
    { term: 'Self-attention', def: 'Attention where queries, keys and values all come from the same sequence.' },
    { term: 'Induction head', def: 'A kind of head found in trained models that helps continue patterns seen earlier in the context.' },
  ],
};
