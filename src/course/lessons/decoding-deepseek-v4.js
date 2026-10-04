export default {
  id: 'decoding-deepseek-v4',
  minutes: 26,
  hook: 'How does an open model read a million tokens while keeping only about a tenth of the memory its predecessor needed?',
  summary: 'DeepSeek-V4 (April 2026) is a pair of open Mixture-of-Experts models, V4-Pro (1.6T total, 49B active parameters) and V4-Flash (284B total, 13B active), both with a native 1M-token context. Its main ideas are a hybrid attention that compresses past tokens (CSA: compress 4× and pick the top-k blocks; HCA: compress 128× and attend to all), stronger residual connections called mHC, the Muon optimizer, FP4 quantization-aware training, and a post-training recipe that trains domain specialists and merges them by on-policy distillation. Users choose among three reasoning modes.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'DeepSeek is a Chinese AI lab known for open-weight models with unusually efficient designs. Its V3 model (late 2024) introduced a widely copied recipe: a large MoE with Multi-head Latent Attention and Multi-Token Prediction. V3.2 added **DeepSeek Sparse Attention (DSA)**, where a cheap "lightning indexer" picks which past tokens each query should attend to. **DeepSeek-V4**, released in April 2026 with a technical report titled *DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence*, pushes that line further, aiming at agents that work over very long contexts.' },
        { type: 'p', text: 'This lesson assumes we know MoE, GQA, sliding windows and the KV cache from earlier lessons. We will decode each new component, using one running example: an AI coding agent that has loaded a 1-million-token code repository plus a long history of tool calls.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a researcher\'s notes', text: 'Reading a million pages, a good researcher keeps the last page in full detail, a one-line note for every few pages, and a one-line note per chapter. To answer a question, they skim the chapter notes, pick the few most relevant page notes, and reread only the latest pages closely. V4\'s attention does something very similar with its KV cache.' },
        { type: 'flow', title: 'The V4 recipe at a glance', nodes: [
          { label: 'MoE backbone', detail: 'DeepSeekMoE experts with Multi-Token Prediction, carried over from V3.' },
          { label: 'Hybrid attention', detail: 'Layers alternate CSA (4× compression + top-k selection) and HCA (128× compression, dense), each with a small uncompressed local window.' },
          { label: 'mHC residuals', detail: 'Wider, multi-stream residual connections constrained so signals stay stable through depth.' },
          { label: 'Muon + FP4 QAT', detail: 'A matrix-aware optimizer and training that simulates 4-bit expert weights.' },
          { label: 'Specialists → one model', detail: 'Domain experts trained with SFT and RL, merged by on-policy distillation.' },
          { label: 'Reasoning modes', detail: 'Non-think, Think High and Think Max at inference.' },
        ] },
      ],
    },
    {
      id: 'two-models',
      title: 'Two models: DeepSeek-V4-Pro and DeepSeek-V4-Flash',
      blocks: [
        { type: 'table', caption: 'Published configuration (from the model cards and technical report)', head: ['', 'DeepSeek-V4-Pro', 'DeepSeek-V4-Flash'], rows: [
          ['Total parameters', '1.6 trillion', '284 billion'],
          ['Active parameters per token', '49 billion (~3%)', '13 billion (~4.6%)'],
          ['Context length', '1M tokens', '1M tokens'],
          ['CSA top-k selected entries', '1,024', '512'],
          ['Single-token FLOPs at 1M context vs V3.2', '27%', '10%'],
          ['KV cache at 1M context vs V3.2', '10%', '7%'],
          ['License', 'MIT', 'MIT'],
        ] },
        { type: 'p', text: 'Pro is the quality flagship and, at release, among the largest open-weight models. Flash trades some quality for much lower cost and can be served on far smaller hardware. Both share the same architecture ideas; they differ in size and a few settings. Base and instruct checkpoints were published for each.' },
        { type: 'chart', kind: 'bar', title: 'Cost at a 1M-token context relative to DeepSeek-V3.2 (= 100%)', yLabel: '% of V3.2', unit: '%', labels: ['FLOPs per token', 'KV cache'], series: [ { name: 'V4-Pro', values: [27, 10] }, { name: 'V4-Flash', values: [10, 7] } ], caption: 'Figures reported by DeepSeek for 1M-token context.' },
      ],
    },
    {
      id: 'hybrid-attention',
      title: 'Hybrid attention with CSA and HCA',
      blocks: [
        { type: 'p', text: 'At 1M tokens, even V3.2\'s sparse attention keeps a KV entry per token. V4 instead **compresses the sequence**: groups of consecutive tokens are merged into a single KV entry. Two kinds of layers use two strengths of compression, and the network interleaves them (in V4-Pro\'s 61 layers, the first two are HCA and the rest alternate CSA and HCA).' },
        { type: 'list', items: [
          '**CSA, Compressed Sparse Attention.** Every **4** consecutive tokens are pooled into one entry using learned, softmax-gated weights. That still leaves 250,000 entries at 1M tokens, too many to attend to, so a **lightning indexer** (inherited from V3.2\'s DSA, and itself run in low precision) scores all compressed entries cheaply and each query attends only to the **top-k** (1,024 in Pro, 512 in Flash). Fine detail, selectively.',
          '**HCA, Heavily Compressed Attention.** Every **128** tokens become one entry. At 1M tokens that is only about 7,800 entries, few enough that each query attends to **all** of them densely, with no selection step. A coarse but complete view of everything.',
          '**Sliding window branch.** Both layer types also attend to the most recent **128 tokens** uncompressed, so local, word-level detail is never lost to compression.',
        ] },
        { type: 'steps', title: 'One query in a CSA layer, step by step', items: [
          { title: 'Compress', text: 'As tokens arrive, each block of 4 tokens\' keys and values is pooled into one compressed entry and stored in the cache.' },
          { title: 'Index', text: 'The lightning indexer computes a cheap relevance score between the current query and every compressed entry.' },
          { title: 'Select', text: 'Keep the top-k compressed entries (e.g. 1,024 for Pro). In our agent example, these might be the blocks containing the function being edited and its callers.' },
          { title: 'Add the local window', text: 'Add the last 128 uncompressed tokens, e.g. the agent\'s current line of reasoning.' },
          { title: 'Attend', text: 'Run ordinary attention over about 1,152 entries instead of 1,000,000.' },
        ] },
        { type: 'code', lang: 'python', title: 'csa_hca_budget.py', code: `import numpy as np
np.random.seed(0)

# 1) Compress every m token keys into one entry with learned weights (toy version)
m, d = 4, 6
keys = np.random.randn(16, d)                         # 16 tokens of keys
w_logits = np.random.randn(m)                         # learned position weights
w = np.exp(w_logits) / np.exp(w_logits).sum()
compressed = (keys.reshape(-1, m, d) * w[None, :, None]).sum(1)
print("tokens:", keys.shape[0], "-> compressed entries:", compressed.shape[0])

# 2) Top-k selection by a cheap indexer score (toy: dot product with a query)
q = np.random.randn(d)
idx_scores = compressed @ q
top = np.argsort(idx_scores)[-2:][::-1]
print("indexer picks compressed blocks:", top.tolist())

# 3) Entries per layer at a 1M-token context, using DeepSeek-V4-Pro's published settings
n, m_csa, m_hca, top_k, window = 1_000_000, 4, 128, 1024, 128
print(f"{'layer type':14s} {'KV entries stored':>18s} {'entries attended/query':>24s}")
print(f"{'full attention':14s} {n:>18,} {n:>24,}")
print(f"{'CSA':14s} {n // m_csa + window:>18,} {top_k + window:>24,}")
print(f"{'HCA':14s} {n // m_hca + window:>18,} {n // m_hca + window:>24,}")`, output: `tokens: 16 -> compressed entries: 4
indexer picks compressed blocks: [0, 1]
layer type      KV entries stored   entries attended/query
full attention          1,000,000                1,000,000
CSA                       250,128                    1,152
HCA                         7,940                    7,940`,
          walkthrough: [
            { lines: [4, 10], note: 'A toy version of compression: 16 tokens become 4 entries by a learned weighted average over each group of 4. The real model uses a learned, gated pooling of keys and values.' },
            { lines: [12, 16], note: 'A toy indexer: score each compressed block against the query and keep the best 2. The real indexer uses its own small projections and low precision.' },
            { lines: [18, 23], note: 'Counting per layer at 1M tokens: full attention stores and reads a million entries; CSA stores 250K but each query reads only ~1.2K; HCA stores and reads ~7.9K. This simplified count ignores head structure and storage precision.' },
          ] },
        { type: 'check', question: 'Why does V4 need both CSA and HCA instead of just one of them?', answer: 'They cover each other\'s blind spots. HCA gives every query a complete but coarse view of the whole context (nothing can be missed, but detail is blurred by 128× compression). CSA gives fine 4-token detail but only for the top-k blocks the indexer selects, which could miss something. Interleaving gives both coverage and precision, and the sliding window keeps recent tokens exact.' },
      ],
    },
    {
      id: 'mhc',
      title: 'Manifold-Constrained Hyper-Connections (mHC)',
      blocks: [
        { type: 'p', text: 'A normal Transformer has a single **residual stream**: each layer reads the token vector, computes something, and adds it back (`x + f(x)`). **Hyper-Connections** (a 2024 idea from other researchers) widen this into several parallel streams, with learnable matrices that mix the streams before and after each layer. That adds expressiveness at little compute cost.' },
        { type: 'p', text: 'The problem: when unconstrained mixing matrices are multiplied across dozens of layers, signals can grow or shrink exponentially, making very large training runs unstable. DeepSeek\'s **mHC** constrains the stream-mixing matrix to be **doubly stochastic**: all entries non-negative, and every row and every column summing to 1. The set of such matrices is a geometric object (a "manifold", the Birkhoff polytope), hence the name. A few iterations of the **Sinkhorn-Knopp** algorithm (alternately normalising rows and columns) project the learned matrix onto this set.' },
        { type: 'deeper', title: 'Why doubly stochastic matrices are safe', blocks: [
          { type: 'p', text: 'A doubly stochastic matrix only *redistributes* signal among streams; it never amplifies it. Its largest stretching factor (spectral norm) is at most 1, and a product of doubly stochastic matrices is still doubly stochastic. So no matter how many layers we stack, the residual mixing cannot blow up. Example: [[0.7, 0.3], [0.3, 0.7]] mixes two streams; applying it many times converges towards an even average, never towards infinity.' },
        ] },
      ],
    },
    {
      id: 'muon',
      title: 'Muon optimizer',
      blocks: [
        { type: 'p', text: 'An **optimizer** decides how to change weights given the gradients. Most LLMs have been trained with **AdamW**, which scales each weight\'s update individually. **Muon** (introduced in 2024 by Keller Jordan and collaborators) treats each weight **matrix** as a whole: it takes the momentum of the gradient and **orthogonalises** it with a few Newton-Schulz iterations, a cheap way of making the update push equally in all important directions instead of letting a few directions dominate.' },
        { type: 'p', text: 'Moonshot\'s Kimi K2 showed Muon could work at trillion-parameter scale. DeepSeek reports using Muon for V4, with a custom distributed implementation, for faster convergence and better stability than AdamW-style baselines. In typical Muon setups, AdamW is still used for parameters that are not ordinary matrices, such as embeddings and normalisation weights.' },
      ],
    },
    {
      id: 'fp4-qat',
      title: 'FP4 quantization-aware training',
      blocks: [
        { type: 'p', text: '**Quantization** stores numbers with fewer bits. **FP4** uses only 4 bits per number, a quarter of BF16. Quantizing a model *after* training often hurts quality. **Quantization-aware training (QAT)** instead simulates the low precision during training, so the model learns weights that still work when rounded.' },
        { type: 'p', text: 'V4 applies FP4 QAT to the **MoE expert weights**, which are the vast majority of its parameters, and to the indexer\'s query-key path. The released checkpoints store expert weights in FP4 and most other weights in FP8. For a 1.6T-parameter model, halving bytes per expert weight versus FP8 makes a large difference to how many GPUs are needed for serving.' },
        { type: 'check', question: 'Roughly how much memory would 1.5 trillion expert parameters take in FP4 compared with BF16?', answer: 'BF16 uses 2 bytes per parameter: about 3 TB. FP4 uses 0.5 bytes: about 0.75 TB. That is a 4× saving (ignoring small overheads such as scaling factors).' },
      ],
    },
    {
      id: 'pre-training',
      title: 'Pre-training',
      blocks: [
        { type: 'p', text: '**Pre-training** is the long first phase where the model learns to predict text from a huge corpus. DeepSeek reports pre-training V4 on more than 32 trillion tokens of diverse, filtered data. Like V3, it keeps **Multi-Token Prediction (MTP)**: extra heads learn to predict tokens further ahead, which gives a richer training signal and can be reused at inference for speculative decoding. Long context is not bolted on at the end only; the attention design is built so that 1M-token sequences are affordable to train and serve.' },
      ],
    },
    {
      id: 'post-training',
      title: 'Post-training: specialist training and on-policy distillation',
      blocks: [
        { type: 'p', text: 'After pre-training, V4 is shaped into an assistant in two stages:' },
        { type: 'list', ordered: true, items: [
          '**Specialist training.** Separate copies of the model are trained per domain (for example mathematics, coding, agentic tool use and instruction following) with supervised fine-tuning (SFT) and then reinforcement learning using **GRPO** (Group Relative Policy Optimization, the RL method DeepSeek used for R1, which scores a group of sampled answers against each other instead of training a separate value model).',
          '**On-policy distillation.** A single student model then learns from all specialists. "On-policy" means the student generates its own answers and the relevant specialist grades each token of *those* answers (the report describes a reverse-KL objective). Learning on its own outputs avoids the mismatch of copying teacher text the student would never produce.',
        ] },
        { type: 'compare', title: 'Two ways to combine specialist skills', options: [
          { name: 'Off-policy distillation (SFT on teacher outputs)', summary: 'Student imitates text the teachers wrote.', pros: ['Simple', 'Cheap per example'], cons: ['Student never practises recovering from its own mistakes', 'Distribution mismatch'], bestFor: 'Bootstrapping, small students' },
          { name: 'On-policy distillation (V4\'s choice)', summary: 'Student writes; teachers grade each token of the student\'s own output.', pros: ['Feedback on the student\'s real behaviour', 'Merges many specialists into one model'], cons: ['Needs teachers running during training', 'More compute'], bestFor: 'Consolidating several RL-trained specialists' },
        ], verdict: 'V4 uses specialists to get peak skill per domain and on-policy distillation to fold them into one deployable model.' },
      ],
    },
    {
      id: 'reasoning-modes',
      title: 'Reasoning modes',
      blocks: [
        { type: 'table', caption: 'The three modes exposed by DeepSeek-V4', head: ['Mode', 'Behaviour', 'Good for'], rows: [
          ['Non-think', 'Answers directly, no visible chain of thought', 'Format conversion, lookups, routine agent steps'],
          ['Think High', 'Reasons step by step before answering', 'Debugging, planning, moderate maths'],
          ['Think Max', 'Maximum reasoning effort; very long thoughts (DeepSeek advises a context of at least ~384K tokens)', 'The hardest problems where accuracy matters most'],
        ] },
        { type: 'callout', tone: 'example', title: 'Using the modes in our coding agent', text: 'Route routine steps such as "list files" or "rename this variable" to Non-think, the core bug investigation to Think High, and a tricky concurrency proof to Think Max. Cost and latency stay bounded while hard steps get more thought. In thinking mode with tool calls, V4 also keeps earlier reasoning across turns so the agent does not lose its train of thought.' },
      ],
    },
    {
      id: 'putting-it-together',
      title: 'Putting it all together',
      blocks: [
        { type: 'p', text: 'Each piece removes a specific bottleneck. Compressed hybrid attention cuts KV memory and FLOPs at 1M tokens. MoE keeps compute per token near 49B (Pro) or 13B (Flash) despite huge capacity. mHC and Muon keep a very large training run stable and efficient. FP4 QAT shrinks the memory for the experts. Specialist RL plus on-policy distillation gives one model strong skills in several domains, and reasoning modes let users trade cost for depth.' },
        { type: 'callout', tone: 'warn', title: 'What to be careful about', text: 'Compression is lossy: exact details from far back survive only if the indexer selects the right CSA blocks or the coarse HCA summary keeps them, so exact long-range recall should be tested on your task. Vendor efficiency numbers are relative to V3.2 at 1M tokens; at short contexts the gains are smaller. And a 1.6T-parameter model still needs a multi-GPU server; "efficient" does not mean "runs on a laptop".' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', items: [
          'Two open MoE models: V4-Pro (1.6T / 49B active) and V4-Flash (284B / 13B active), both 1M-token context.',
          'CSA: pool 4 tokens per entry, an indexer picks top-k entries; HCA: pool 128 tokens per entry, attend to all; both add a 128-token local window.',
          'mHC: multi-stream residuals with doubly stochastic mixing for stability.',
          'Muon optimizer and FP4 QAT for experts make training and serving more efficient.',
          'Domain specialists (SFT + GRPO) are merged by on-policy distillation; three reasoning modes at inference.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'What is the key difference between CSA and HCA layers in DeepSeek-V4?', options: ['CSA: 4× compression + top-k; HCA: 128× compression, attend to all', 'CSA is used only during training and HCA only at inference time', 'CSA compresses the keys while HCA compresses only the values', 'HCA runs the lightning indexer while CSA attends to every entry'], answer: 0, explain: 'CSA = mild compression + sparse selection; HCA = heavy compression + dense attention. The last option swaps them.' },
    { q: 'At a 1M-token context, a CSA layer in V4-Pro (top-k 1,024, window 128) attends to about how many entries per query?', options: ['1,000,000', '250,000', '7,800', '1,152'], answer: 3, explain: 'Top-k 1,024 compressed entries plus a 128-token window = 1,152. 250,000 is how many compressed entries are stored, not attended.' },
    { q: 'Why does mHC constrain the residual mixing matrix to be doubly stochastic?', options: ['To cut the parameter count of every layer roughly in half', 'So mixing only redistributes signal and never amplifies it', 'To force each residual stream to learn a separate language', 'Because the Muon optimizer only accepts such matrices'], answer: 1, explain: 'Rows and columns summing to 1 with non-negative entries bounds the stretching to at most 1, even across many layers.' },
    { q: 'Our team wants one model strong at maths, coding and tool use. Following V4\'s recipe, what should we do after training a specialist per domain?', options: ['Average all the specialists\' weights once and ship the result', 'Fine-tune a student only on human-written reference answers', 'Distil on-policy: teachers grade the student\'s own outputs', 'Deploy every specialist and pick one at random per request'], answer: 2, explain: 'V4 merges specialists with on-policy distillation, so the student learns from feedback on its own outputs.' },
    { q: 'A blog post says "DeepSeek-V4-Flash has 13B parameters, so it fits on one consumer GPU." What is wrong?', options: ['Flash really has 49B active parameters, not 13B', '13B is active; all 284B must still sit in memory', 'Flash can only run when Think Max mode is enabled', 'Nothing; 13B is the full size of the Flash model'], answer: 1, explain: 'MoE saves compute, not memory: 13B is active per token, but the full 284B must be held, even with FP4 experts.' },
  ],
  takeaways: [
    'DeepSeek-V4 comes as V4-Pro (1.6T / 49B active) and V4-Flash (284B / 13B active), both with 1M-token context.',
    'Hybrid attention compresses the KV cache: CSA (4×, top-k) and HCA (128×, dense) plus a 128-token window.',
    'At 1M tokens, V4-Pro needs about 27% of V3.2\'s per-token FLOPs and 10% of its KV cache.',
    'mHC stabilises multi-stream residuals; Muon and FP4 QAT make large-scale training and serving cheaper.',
    'Specialists trained with SFT + GRPO are merged by on-policy distillation; Non-think / Think High / Think Max trade cost for depth.',
  ],
  terms: [
    { term: 'CSA', def: 'Compressed Sparse Attention: pool every 4 tokens into one KV entry and attend to the top-k selected entries.' },
    { term: 'HCA', def: 'Heavily Compressed Attention: pool every 128 tokens into one KV entry and attend to all of them.' },
    { term: 'Lightning indexer', def: 'A cheap scoring module that picks which compressed entries each query attends to.' },
    { term: 'mHC', def: 'Manifold-Constrained Hyper-Connections: multi-stream residuals with doubly stochastic mixing matrices.' },
    { term: 'Muon', def: 'An optimizer that orthogonalises momentum updates for weight matrices via Newton-Schulz iterations.' },
    { term: 'Quantization-aware training', def: 'Training while simulating low-precision weights so the model stays accurate when quantized.' },
    { term: 'On-policy distillation', def: 'A student learns from teacher feedback on answers the student itself generated.' },
  ],
};
