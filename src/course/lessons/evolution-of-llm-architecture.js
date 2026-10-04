export default {
  id: 'evolution-of-llm-architecture',
  minutes: 27,
  hook: 'Why did the field throw away a decade of recurrent networks for one idea called attention, and what has changed since?',
  summary: 'LLM architecture went through clear stages: recurrent networks that read one word at a time, attention that lets every word look at every other word, the Transformer built only from attention, a scaling era where bigger models and more data kept paying off, and Mixture of Experts that grows knowledge without growing cost per token. Today the frontier mixes these with new directions such as efficient attention, reasoning models and diffusion-style generation.',
  sections: [
    {
      id: 'what-is-architecture',
      title: 'What is an LLM architecture?',
      blocks: [
        { type: 'p', text: 'A **Large Language Model (LLM)** is a neural network trained to predict the next piece of text, called a **token** (a word or part of a word). Its **architecture** is the blueprint of that network: which layers exist, in what order, how information flows between tokens, and which numbers (the **parameters**, or weights) are learned during training.' },
        { type: 'p', text: 'Two models can be trained on the same data and still behave very differently because their architectures differ. Architecture decides three practical things: **what the model can remember** (how far back in the text it can use information), **how fast it trains** (whether work can be done in parallel on a GPU), and **how expensive it is to run** (how much compute and memory each new token costs).' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like building design', text: 'The training data is the furniture and the architecture is the floor plan. A narrow corridor (an RNN) forces everyone to walk single file. An open-plan hall (attention) lets everyone see everyone. A building with many specialist rooms and a receptionist (Mixture of Experts) lets you grow huge while each visitor only walks into two rooms.' },
        { type: 'p', text: 'In this lesson we follow one running example: the sentence **"The cat that the dog chased sat down."** To understand who sat down, a model must connect `sat` back to `cat`, skipping over `the dog chased`. Each architecture handles this long-range link differently, and that difference drives the whole story.' },
      ],
    },
    {
      id: 'stage-1-rnn',
      title: 'Stage 1: Reading one word at a time (RNN)',
      blocks: [
        { type: 'p', text: 'A **Recurrent Neural Network (RNN)** reads text left to right, one token per step. It keeps a single vector called the **hidden state** `h`, a running summary of everything read so far. At each step it mixes the old summary with the new token: `hₜ = tanh(W_h · hₜ₋₁ + W_x · xₜ)`.' },
        { type: 'p', text: 'This is elegant: the same small set of weights handles text of any length. But it has two serious problems.' },
        { type: 'list', items: [
          '**Forgetting.** Everything must squeeze through one fixed-size vector. By the time the RNN reads `sat`, the information about `cat` has been overwritten several times. During training the learning signal also shrinks (or explodes) as it travels back through many steps; this is the **vanishing gradient** problem.',
          '**No parallelism.** Step 5 needs the result of step 4, which needs step 3. A GPU has thousands of cores, but an RNN can only use them inside one step, never across steps. Training on billions of tokens becomes painfully slow.',
        ] },
        { type: 'p', text: 'The **LSTM** (Long Short-Term Memory, 1997) and **GRU** added "gates" that decide what to keep and what to forget. They helped a lot and powered machine translation and speech systems in the mid-2010s, but they were still sequential and still struggled with very long text.' },
        { type: 'viz', name: 'rnn-vs-transformer', caption: 'Watch the RNN process tokens one at a time while the Transformer processes the whole sentence in parallel.' },
      ],
    },
    {
      id: 'stage-2-attention',
      title: 'Stage 2: Attention',
      blocks: [
        { type: 'p', text: 'Around 2014, translation models used an **encoder** RNN to read the source sentence and a **decoder** RNN to write the translation. The encoder had to cram the whole sentence into one vector, which failed on long sentences. **Attention** (Bahdanau, Cho and Bengio, 2014) fixed this: at every output step, the decoder looks back at *all* encoder states and takes a weighted average, with weights saying how relevant each source word is right now.' },
        { type: 'p', text: 'The key idea is a **soft lookup**. Each position produces a **query** ("what am I looking for?"), every position offers a **key** ("what do I contain?") and a **value** ("what do I hand over if chosen?"). Similarity between query and keys becomes a probability distribution through **softmax**, and the output is the weighted sum of values.' },
        { type: 'formula', expr: 'Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V', where: [ ['Q', 'queries: one row per token, what it is looking for'], ['K', 'keys: one row per token, what it offers to be matched on'], ['V', 'values: the information actually passed along'], ['dₖ', 'size of each key vector; dividing by √dₖ keeps scores in a sensible range'] ], caption: 'Scaled dot-product attention, the form used in Transformers.' },
        { type: 'p', text: 'In our sentence, when the model processes `sat`, its query can match the key of `cat` directly. The path from `cat` to `sat` is now **one step**, no matter how many words sit between them. In an RNN that path was as long as the gap.' },
        { type: 'check', question: 'Pause and predict: in an RNN, how many update steps does information from token 1 pass through to reach token 100? With attention, how many?', answer: 'About 99 recurrent updates in an RNN, each one a chance to be overwritten. With attention it is a single weighted lookup: token 100 can read token 1 directly. That short path is why attention handles long-range links so much better.' },
      ],
    },
    {
      id: 'stage-3-transformer',
      title: 'Stage 3: The Transformer',
      blocks: [
        { type: 'p', text: 'In 2017 the paper *Attention Is All You Need* (Vaswani et al.) asked a bold question: if attention is doing the useful work, why keep the RNN at all? The **Transformer** removed recurrence completely. Each layer has two parts: **self-attention**, where every token attends to the other tokens of the same sequence, and a **feed-forward network (FFN)**, a small two-layer network applied to each token separately. **Residual connections** (adding the input back to the output) and **layer normalization** keep deep stacks trainable.' },
        { type: 'p', text: 'Because there is no recurrence, the model has no built-in sense of order, so a **positional encoding** is added to tell it where each token sits. Modern models mostly use **RoPE** (rotary position embeddings), which rotate queries and keys by an angle that depends on position.' },
        { type: 'steps', title: 'One decoder-only Transformer layer, step by step', items: [
          { title: 'Normalize', text: 'Each token vector is normalized (LayerNorm or RMSNorm) so its scale stays stable.' },
          { title: 'Self-attention', text: 'Every token builds Q, K, V. A **causal mask** stops tokens from looking at future tokens, because the model must predict the future, not copy it.' },
          { title: 'Add residual', text: 'The attention output is added back to the token\'s original vector, so the layer only has to learn a *change*.' },
          { title: 'Feed-forward', text: 'Each token passes independently through an FFN (expand to ~4× width, apply a nonlinearity, shrink back). Most of a model\'s parameters live here.' },
          { title: 'Add residual and repeat', text: 'Add the FFN output back, then hand the result to the next layer. Large models stack dozens to over a hundred such layers.' },
        ] },
        { type: 'p', text: 'Three families grew from the original design. **Encoder-only** models such as BERT (2018) see the whole text in both directions and are good at understanding tasks. **Encoder-decoder** models such as T5 map one text to another. **Decoder-only** models such as the GPT series predict the next token with a causal mask. Almost every modern chat LLM is decoder-only, because "predict the next token" turns any text on the internet into training data.' },
        { type: 'viz', name: 'attention-heatmap', caption: 'Click a token to see which words it attends to; toggle the causal mask a decoder-only LLM uses.' },
      ],
    },
    {
      id: 'code-rnn-vs-attention',
      title: 'Code: an RNN step loop vs one attention pass',
      blocks: [
        { type: 'p', text: 'This small numpy script shows the structural difference. The RNN needs a Python loop where each step depends on the previous one. Attention computes all token-to-token scores in one matrix multiply. Then we print how the two costs grow with sequence length `n`.' },
        { type: 'code', lang: 'python', title: 'rnn_vs_attention.py', code: `import numpy as np
np.random.seed(0)

# Four tokens, each a 4-dim embedding (random, for illustration)
tokens = ["the", "cat", "sat", "down"]
X = np.random.randn(4, 4)

# --- RNN: one hidden state, updated token by token ---
W_h, W_x = np.random.randn(4, 4) * 0.5, np.random.randn(4, 4) * 0.5
h = np.zeros(4)
for t, x in enumerate(X):            # must run in order: step t needs step t-1
    h = np.tanh(W_h @ h + W_x @ x)
print("RNN sequential steps:", len(X), "| final state:", np.round(h, 2))

# --- Attention: every token looks at every token in one matrix product ---
Wq, Wk, Wv = (np.random.randn(4, 4) for _ in range(3))
Q, K, V = X @ Wq, X @ Wk, X @ Wv
scores = Q @ K.T / np.sqrt(4)        # 4x4 table of "how relevant is j to i"
w = np.exp(scores - scores.max(1, keepdims=True))
w = w / w.sum(1, keepdims=True)      # softmax per row
out = w @ V                          # all tokens updated at once
print("Attention weights for 'down':",
      {tok: round(float(p), 2) for tok, p in zip(tokens, w[3])})

# --- Cost growth: steps in sequence vs pairwise scores ---
for n in [4, 1_000, 100_000]:
    print(f"n={n:>7}: RNN steps in a chain = {n:>7}, attention pair scores = {n*n:,}")`, output: `RNN sequential steps: 4 | final state: [-0.83  0.78 -0.93 -0.21]
Attention weights for 'down': {'the': 0.72, 'cat': 0.07, 'sat': 0.14, 'down': 0.08}
n=      4: RNN steps in a chain =       4, attention pair scores = 16
n=   1000: RNN steps in a chain =    1000, attention pair scores = 1,000,000
n= 100000: RNN steps in a chain =  100000, attention pair scores = 10,000,000,000`,
          walkthrough: [
            { lines: [1, 6], note: 'Fixed seed and four random token embeddings. The weights are untrained, so the exact numbers mean nothing; the structure is the point.' },
            { lines: [8, 13], note: 'The RNN loop. Each new `h` depends on the previous `h`, so these steps cannot run at the same time.' },
            { lines: [15, 23], note: 'Self-attention: build Q, K, V, score every pair with one matrix product, softmax each row, mix the values. No loop over time.' },
            { lines: [25, 27], note: 'The trade-off: RNN work is a chain of length n (slow, sequential), attention work is n² pair scores (parallel, but grows quadratically).' },
          ] },
        { type: 'p', text: 'The last lines preview a theme of the whole module: attention bought parallelism and short paths, but paid with **quadratic cost** in sequence length. Many later innovations (sliding windows, Flash Attention, compressed attention) are attempts to keep attention\'s benefits while paying less of that n² bill.' },
      ],
    },
    {
      id: 'stage-4-scaling',
      title: 'Stage 4: Scaling',
      blocks: [
        { type: 'p', text: 'Once the Transformer trained efficiently on GPUs, researchers found something surprising: making it **bigger** and training it on **more data** made it steadily better in a predictable way. GPT-2 (2019) had 1.5 billion parameters; GPT-3 (2020) had 175 billion and could do new tasks just from examples in the prompt (**in-context learning**).' },
        { type: 'p', text: '**Scaling laws** (Kaplan et al., 2020) showed that loss falls as a smooth power law in model size, data and compute. The **Chinchilla** study (Hoffmann et al., 2022) refined the recipe: for a fixed compute budget, many models were too large and under-trained; roughly 20 training tokens per parameter was closer to compute-optimal. Since then, models are often trained on far more tokens than that, because a smaller model trained longer is cheaper to *serve*.' },
        { type: 'chart', kind: 'line', title: 'The shape of a scaling law (illustrative)', xLabel: 'Training compute (log scale, arbitrary units)', yLabel: 'Loss', series: [ { name: 'Loss', points: [[1, 3.9], [2, 3.4], [3, 3.05], [4, 2.8], [5, 2.62], [6, 2.48], [7, 2.38], [8, 2.3]] } ], caption: 'Illustrative curve, not measured data: each 10× more compute buys a steady but shrinking drop in loss.' },
        { type: 'p', text: 'Architecture still evolved inside this era, but in small, practical steps: pre-normalization for stable deep training, **RMSNorm** instead of LayerNorm, **SwiGLU** activations in the FFN, **RoPE** positions, and **Grouped-Query Attention** to shrink memory at inference time. Training also added stages after pre-training: instruction tuning and **RLHF** (reinforcement learning from human feedback), which turned raw text predictors into helpful assistants such as ChatGPT (late 2022).' },
      ],
    },
    {
      id: 'stage-5-moe',
      title: 'Stage 5: Mixture of Experts (MoE)',
      blocks: [
        { type: 'p', text: 'Scaling a **dense** model (every parameter used for every token) makes each token more expensive. **Mixture of Experts** breaks that link. The single FFN in each layer is replaced by many smaller FFNs called **experts**, plus a small **router** that sends each token to only a few of them (for example 2 of 8). The model can store far more knowledge in total parameters while each token only pays for the **active** parameters.' },
        { type: 'p', text: 'The idea is old (sparsely-gated MoE, Shazeer et al., 2017; Switch Transformer, 2021), but it went mainstream with open models such as **Mixtral 8x7B** (late 2023, about 47B total and 13B active parameters) and **DeepSeek-V3** (late 2024, 671B total and 37B active). Many frontier models are widely believed to be MoE as well, though closed labs rarely confirm details. The next lesson covers MoE in depth.' },
        { type: 'viz', name: 'moe-router', caption: 'Tokens pass through a router to their top-2 experts. Compare total parameters with the parameters actually used per token.' },
      ],
    },
    {
      id: 'stage-6-new-directions',
      title: 'Stage 6: New directions',
      blocks: [
        { type: 'p', text: 'Since 2024 the frontier has branched. No single new architecture has replaced the Transformer; instead, several directions are being combined:' },
        { type: 'list', items: [
          '**Cheaper attention for long context.** Sliding-window attention, attention sinks, Flash Attention (a faster way to compute exact attention), and compressed or sparse attention such as DeepSeek\'s, which let models handle hundreds of thousands to a million tokens.',
          '**Reasoning models.** Models such as OpenAI o1 (2024) and DeepSeek-R1 (2025) are trained with reinforcement learning to "think" in a long chain of reasoning before answering, trading more compute at answer time for accuracy.',
          '**State-space and hybrid models.** Models such as Mamba (2023) replace attention with a recurrent-style state that updates in linear time; several 2024–2026 models mix such layers with attention layers.',
          '**Diffusion language models.** Instead of writing left to right, these models start from a fully masked sequence and fill many tokens in parallel over several refinement steps.',
          '**Smaller, specialized models.** Small language models and decision-only models trade generality for speed and cost.',
        ] },
        { type: 'timeline', title: 'From RNNs to modern LLMs', items: [
          { when: '1997', title: 'LSTM', text: 'Gated recurrent networks make longer memory practical, but still read one token at a time.' },
          { when: '2014', title: 'Attention for translation', text: 'The decoder learns to look back at every source word instead of one summary vector.' },
          { when: '2017', title: 'Transformer', text: 'Recurrence removed; self-attention plus feed-forward layers, trained fully in parallel.' },
          { when: '2018–2020', title: 'BERT, GPT-2, GPT-3', text: 'Pre-training at scale; GPT-3 (175B) shows in-context learning.' },
          { when: '2020–2022', title: 'Scaling laws and Chinchilla', text: 'Loss improves predictably with compute; data matters as much as size.' },
          { when: '2022', title: 'ChatGPT', text: 'Instruction tuning and RLHF turn a text predictor into an assistant.' },
          { when: '2023–2024', title: 'Open MoE models', text: 'Mixtral and DeepSeek-V3 bring sparse experts into widely used open models.' },
          { when: '2024–2026', title: 'Reasoning, long context, new paradigms', text: 'Reasoning models, million-token attention tricks, hybrids and diffusion LMs.' },
        ] },
      ],
    },
    {
      id: 'worked-example-one-sentence',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: "Let us push our running sentence, **The cat that the dog chased sat down**, through each design and count. It has 8 tokens. `cat` is token 2 and `sat` is token 7, so the gap between them is 5 tokens." },
        { type: 'steps', title: "Following `sat` back to `cat`", items: [
          { title: "RNN: count the overwrites", text: "The memory of `cat` must survive 5 updates before `sat` arrives. If each update keeps 90% of the old memory (an illustrative number), 0.9⁵ ≈ 0.59 of the signal is left." },
          { title: "Attention: count the hops", text: "The query of `sat` scores the 7 tokens it may see: itself and the 6 before it. One of those scores is for `cat`. That is 1 hop, with no fading on the way." },
          { title: "Count the price of attention", text: "With a causal mask, token i scores i tokens. For 8 tokens that is 1 + 2 + … + 8 = 36 pair scores per head." },
          { title: "Scale it up", text: "Make the text 100 times longer: 800 tokens. The RNN chain grows 100 times, to 800 steps. The pair scores grow to 800 × 801 / 2 = 320,400, about 8,900 times more." },
          { title: "MoE: count the experts", text: "Attention is unchanged. In the feed-forward part, a router with 8 experts and top-2 routing runs 2 experts per token, so each token touches a quarter of the expert weights." },
        ] },
        { type: 'table', caption: "The same 8-token sentence in three designs. The 90% figure behind the RNN row is illustrative.", head: ['Design', 'Path from cat to sat', 'Work across tokens', 'Cost for 8 tokens'], rows: [
          ['RNN', '5 updates in a chain', 'One step after another', '8 sequential steps'],
          ['Transformer', '1 lookup', 'All tokens at once', '36 pair scores per head'],
          ['MoE Transformer', '1 lookup (same attention)', 'All tokens at once', '36 pair scores, then 2 of 8 experts per token'],
        ] },
        { type: 'p', text: "The pattern to notice: each stage fixes the bottleneck of the stage before it and brings a new cost. Attention removes the long chain but pays for pairs. MoE keeps attention and makes the feed-forward part cheaper per token, but every expert still has to sit in memory." },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: "We will build a tiny calculator for the main idea of this lesson: how much of an early token's signal is left when a later token needs it. The RNN loses a little at every step. Attention reads the old token directly." },
        { type: 'code', lang: 'python', title: 'practice_signal_fade.py', code: `# How much of an early token's signal survives until a later token needs it?
KEEP = 0.9   # share of old memory an RNN keeps at each step (illustrative)

def rnn_signal(gap):
    # the signal passes through \`gap\` updates; each one keeps 90% of it
    return KEEP ** gap

def attention_signal(gap):
    # attention reads the old token directly: one hop, nothing fades
    return 1.0

print("gap  rnn_signal  attn_signal  rnn_hops  attn_hops")
for gap in [1, 5, 10, 50, 100]:
    print(f"{gap:>3}  {rnn_signal(gap):>10.4f}  {attention_signal(gap):>11.1f}  {gap:>8}  {1:>9}")

# Largest gap where the RNN still holds at least half of the signal
gap = 0
while rnn_signal(gap + 1) >= 0.5:
    gap += 1
print("RNN keeps at least half the signal for gaps up to", gap)

# Running example: 'sat' must reach back to 'cat'
sentence = "The cat that the dog chased sat down".split()
gap = sentence.index("sat") - sentence.index("cat")
print(f"'cat' -> 'sat' gap = {gap} tokens:",
      f"RNN keeps {rnn_signal(gap):.2f}, attention keeps {attention_signal(gap):.2f}")`, output: `gap  rnn_signal  attn_signal  rnn_hops  attn_hops
  1      0.9000          1.0         1          1
  5      0.5905          1.0         5          1
 10      0.3487          1.0        10          1
 50      0.0052          1.0        50          1
100      0.0000          1.0       100          1
RNN keeps at least half the signal for gaps up to 6
'cat' -> 'sat' gap = 5 tokens: RNN keeps 0.59, attention keeps 1.00`,
          walkthrough: [
            { lines: [1, 10], note: "Two toy models of memory. The RNN multiplies the signal by 0.9 at every step. Attention always returns 1.0 because it reads the old token in one hop. Real networks are not this simple; the shape of the curve is the point." },
            { lines: [12, 14], note: "Print the signal for growing gaps. At a gap of 50 the RNN holds about half a percent of the signal, and the number of hops equals the gap." },
            { lines: [16, 20], note: "Search for the largest gap where the RNN still holds half the signal. With 0.9 per step the answer is only 6 tokens." },
            { lines: [22, 26], note: "Apply it to our sentence. The gap from `cat` to `sat` is 5 tokens, so the toy RNN keeps 0.59 of the signal." },
          ] },
        { type: 'p', text: "Now change it:" },
        { type: 'list', items: [
          "Set `KEEP = 0.99`, as if gates (the LSTM idea) protected the memory better. Before running, guess: is the half-signal gap closer to 60 or to 600?",
          "Replace the sentence with a longer one that puts more words between `cat` and `sat`. Predict the RNN signal from the gap first, then run it.",
          "Add a column that prints the causal pair scores for a text of `gap + 1` tokens, `(gap + 1) * (gap + 2) // 2`. Predict which grows faster as the gap grows: the RNN's loss of signal or attention's bill.",
        ] },
        { type: 'check', question: "We raise KEEP to 0.99. Does the toy RNN now match attention on a gap of 500 tokens?", answer: "No. 0.99⁵⁰⁰ is about 0.007, so less than 1% of the signal is left. The loss is exponential in the gap, so a better keep rate only moves the problem further away. Attention avoids it because its path length stays at 1 for any gap." },
        { type: 'check', question: "A text grows from 8 to 16 tokens. How do the RNN chain and the causal pair scores change, and why is the bigger number still acceptable on a GPU?", answer: "The chain doubles from 8 to 16 steps. The pair scores go from 36 to 16 × 17 / 2 = 136, almost 4 times more. That is more arithmetic, but all pairs can be computed at the same time, while the 16 RNN steps must wait for each other." },
      ],
    },
    {
      id: 'summary-of-evolution',
      title: 'Summary of the evolution',
      blocks: [
        { type: 'compare', title: 'Four architecture families side by side', options: [
          { name: 'RNN / LSTM', summary: 'Reads one token at a time with a running memory vector.', pros: ['Constant memory per step', 'Handles any length in principle'], cons: ['Cannot parallelize over time', 'Forgets distant tokens'], bestFor: 'Historical baseline; tiny streaming tasks' },
          { name: 'Dense Transformer', summary: 'Every token attends to every token; every parameter used for every token.', pros: ['Parallel training', 'Direct long-range links'], cons: ['Attention cost grows with n²', 'Cost per token grows with model size'], bestFor: 'Most models up to a few tens of billions of parameters' },
          { name: 'MoE Transformer', summary: 'Transformer whose FFNs are many experts with a router.', pros: ['Huge capacity at modest per-token compute'], cons: ['All experts must sit in memory', 'Harder to train and balance'], bestFor: 'Frontier-scale models' },
          { name: 'New paradigms', summary: 'State-space hybrids, diffusion LMs, efficient attention.', pros: ['Long context or faster generation'], cons: ['Less mature tooling', 'Quality still being proven'], bestFor: 'Long documents, speed-critical generation' },
        ], rows: [
          ['Parallel training', 'No', 'Yes', 'Yes', 'Mostly yes'],
          ['Path from token 1 to token n', 'n steps', '1 step', '1 step', 'Varies'],
          ['Main bottleneck', 'Sequential steps', 'n² attention, KV memory', 'Memory for all experts', 'Maturity'],
        ], verdict: 'Each stage kept the best part of the previous one: attention kept the idea of learned memory, the Transformer kept attention, MoE kept the Transformer and only changed the feed-forward part.' },
        { type: 'callout', tone: 'warn', title: 'Common misconception', text: '"Newer architecture" does not mean "the Transformer is obsolete". Almost every 2026 frontier LLM is still a decoder-only Transformer at heart; the changes are in the attention variant, the FFN (dense or MoE), training recipe and inference tricks.' },
        { type: 'check', question: 'A team doubles their dense model\'s parameter count. What happens to the compute needed per generated token, and what architecture change would let them add knowledge without that cost?', answer: 'Compute per token roughly doubles, because every parameter is used for every token. Switching the FFN layers to a Mixture of Experts lets total parameters grow while each token only activates a few experts, so per-token compute stays close to the old level (memory still grows).' },
        { type: 'callout', tone: 'example', title: 'Real-world reading', text: 'When a model card says "MoE, 671B total, 37B active, 128K context, GQA/MLA attention", you can now decode it: a decoder-only Transformer, a sparse expert FFN, a long-context attention variant, and a memory-saving KV cache design. The rest of this module explains each piece.' },
      ],
    },
  ],
  quiz: [
    { q: 'What was the main reason RNNs trained slowly on GPUs compared with Transformers?', options: ['They had far more parameters than Transformers of similar quality', 'Each step needed the previous step, so time steps ran in sequence', 'They could not use softmax and needed a slower activation function', 'They required a hand-labelled example for every word they read'], answer: 1, explain: 'An RNN\'s hidden state at step t needs step t−1, forcing sequential computation. Parameter count was not the issue; RNNs were usually smaller.' },
    { q: 'In "The cat that the dog chased sat down", why does self-attention link `sat` to `cat` more easily than an RNN?', options: ['It gives a one-step path between any two tokens', 'It reads the sentence backwards so `cat` is seen right after `sat`', 'It deletes the words in between before computing anything', 'It uses a bigger hidden state that never forgets earlier words'], answer: 0, explain: 'The query for `sat` can match the key for `cat` directly. In an RNN the information must survive several recurrent updates in between.' },
    { q: 'For a sequence of 1,000 tokens, roughly how many query-key scores does one full self-attention head compute?', options: ['About 1,000, one per token', 'About 2,000, two per token', 'About 1,000,000', 'About 1,000,000,000'], answer: 2, explain: 'Every token scores every token: n × n = 1,000 × 1,000 = 1,000,000. This quadratic growth is why long-context attention is expensive.' },
    { q: 'How does a Mixture of Experts Transformer differ from a dense Transformer?', options: ['It removes self-attention and lets experts exchange information instead', 'Its FFN is split into experts and a router picks a few per token', 'It places a small recurrent network inside every layer for memory', 'Each expert is assigned by engineers to one language before training'], answer: 1, explain: 'MoE changes the FFN part only. Attention stays, and experts are not assigned by hand to languages or topics; the router learns the assignment.' },
    { q: 'A colleague says "Transformers are obsolete in 2026; frontier models use completely different architectures." What is the most accurate response?', options: ['Correct: all frontier models have switched to diffusion-based generation', 'Correct: state-space models fully replaced attention back in 2024', 'Mostly wrong: most are still decoder-only Transformers with new parts', 'Mostly wrong: frontier models have quietly returned to using LSTMs'], answer: 2, explain: 'New directions exist (hybrids, diffusion LMs), but the decoder-only Transformer remains the backbone of nearly all leading LLMs, with changes to attention, the FFN (often MoE) and training.' },
  ],
  takeaways: [
    'Architecture decides what a model can remember, how fast it trains, and how much each token costs.',
    'RNNs read sequentially and forget; attention gives every token a direct one-step path to every other token.',
    'The Transformer is attention plus feed-forward layers with residuals, trained in parallel; decoder-only versions power chat LLMs.',
    'Scaling size, data and compute improved models predictably; Chinchilla showed data matters as much as size.',
    'MoE grows total knowledge while keeping per-token compute low by activating only a few experts.',
    'New directions (efficient attention, reasoning models, hybrids, diffusion LMs) build on the Transformer rather than replacing it outright.',
  ],
  terms: [
    { term: 'Architecture', def: 'The blueprint of a neural network: its layers, their order and how information flows.' },
    { term: 'RNN', def: 'A network that reads tokens one by one and carries a hidden state forward.' },
    { term: 'Attention', def: 'A learned weighted lookup where each token mixes information from other tokens based on query-key similarity.' },
    { term: 'Transformer', def: 'An architecture built from self-attention and feed-forward layers with residual connections, without recurrence.' },
    { term: 'Scaling laws', def: 'Empirical rules showing loss falls predictably as model size, data and compute grow.' },
    { term: 'Mixture of Experts', def: 'A design where a router sends each token to a few of many expert sub-networks.' },
    { term: 'Decoder-only', def: 'A Transformer that uses a causal mask and predicts the next token; the design of most chat LLMs.' },
  ],
};
