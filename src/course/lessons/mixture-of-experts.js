export default {
  id: 'mixture-of-experts',
  minutes: 22,
  hook: 'How can a model have 671 billion parameters but only use 37 billion of them for each word it writes?',
  summary: 'A Mixture of Experts (MoE) layer replaces one big feed-forward network with many smaller "experts" and a small router that picks a few experts for each token. Total parameters (knowledge capacity) grow while compute per token stays close to that of a much smaller dense model. The price is memory for all experts, load-balancing work during training, and more complex serving.',
  sections: [
    {
      id: 'why-moe',
      title: 'Why Mixture of Experts was needed',
      blocks: [
        { type: 'p', text: 'In a **dense** Transformer every parameter takes part in processing every token. If we double the parameters to store more knowledge, we also double the arithmetic for each token, for training and for every answer we ever serve. Scaling laws told us bigger models are better, but the bill grows in lock-step.' },
        { type: 'p', text: 'The observation behind MoE: not every token needs all of the model\'s knowledge. A token in a Python snippet and a token in a French poem probably benefit from different stored patterns. So why pay to run all of them? **Mixture of Experts** splits part of the network into many sub-networks and runs only a few per token. This is called **conditional computation**: the amount of work depends on the input.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a hospital', text: 'A hospital employs dozens of specialists, but each patient sees only one or two. A receptionist (the router) looks at the patient and sends them to the right doctors. The hospital\'s total expertise is huge, but each visit only costs two consultations. MoE does this for every token, in every MoE layer.' },
        { type: 'p', text: 'Running example: our support chatbot gets the message "My invoice shows the wrong VAT rate". Each token of this sentence will be routed separately to a couple of experts in each MoE layer, and different tokens may visit different experts.' },
      ],
    },
    {
      id: 'what-is-an-expert',
      title: 'What an "expert" really means',
      blocks: [
        { type: 'p', text: 'An **expert** is simply a feed-forward network (FFN), the same kind of two-layer block that sits after attention in every Transformer layer. An MoE layer holds, say, 8, 64 or 256 of them side by side, each with its own weights and usually smaller than the single FFN it replaces.' },
        { type: 'callout', tone: 'warn', title: 'Experts are not human-style specialists', text: 'Nobody assigns "the math expert" or "the French expert". Specialization is learned and is usually much less tidy than the name suggests. The Mixtral authors, for example, reported no obvious topic-level specialization; routing patterns looked more tied to syntax and token types (such as indentation in code) than to subjects. Some newer designs, such as DeepSeek\'s fine-grained experts, aim for sharper specialization, but it is still learned, not designed.' },
        { type: 'p', text: 'Some models also add **shared experts** that every token always uses, to hold common knowledge, plus many **routed experts** chosen by the router. DeepSeek-V3, for instance, uses 1 shared expert and picks 8 of 256 routed experts per token.' },
      ],
    },
    {
      id: 'the-router',
      title: 'The router and how it picks experts',
      blocks: [
        { type: 'p', text: 'The **router** (also called the **gate**) is a tiny linear layer. For a token vector `x` it computes one score per expert, turns the scores into probabilities with softmax, keeps the **top-k** experts, and uses their (renormalized) probabilities as mixing weights.' },
        { type: 'formula', expr: 'p = softmax(x · W_r)     y = ∑ᵢ∈TopK(p) gᵢ · Eᵢ(x),   gᵢ = pᵢ / ∑ⱼ∈TopK pⱼ', where: [ ['x', 'the token\'s hidden vector entering the MoE layer'], ['W_r', 'router weights: d × N, one column per expert'], ['p', 'probability for each of the N experts'], ['TopK', 'the k experts with the highest probability (k is often 1, 2 or 8)'], ['Eᵢ(x)', 'output of expert i, a small FFN'], ['gᵢ', 'gate weight: how much expert i\'s output counts'] ], caption: 'Top-k routing. Variants differ in whether they renormalize, use sigmoid instead of softmax, or add noise.' },
        { type: 'steps', title: 'Routing one token, step by step', items: [
          { title: 'Score', text: 'The token "VAT" (as a vector) is multiplied by the router weights, giving 8 scores, e.g. [0.1, 2.3, −0.4, 1.9, 0.0, 0.2, −1.1, 0.5].' },
          { title: 'Softmax', text: 'Scores become probabilities that sum to 1. Expert 1 and expert 3 have the largest.' },
          { title: 'Pick top-2', text: 'Keep experts 1 and 3; the other six are skipped entirely and cost no compute for this token.' },
          { title: 'Renormalize', text: 'If their probabilities were 0.44 and 0.30, the gates become 0.44/0.74 ≈ 0.59 and 0.30/0.74 ≈ 0.41.' },
          { title: 'Mix', text: 'Output = 0.59 × E₁(x) + 0.41 × E₃(x). The result goes on to the residual connection and the next layer, where routing happens again.' },
        ] },
        { type: 'viz', name: 'moe-router', caption: 'Watch tokens get routed to their top-2 of 8 experts, and compare active with total parameters.' },
      ],
    },
    {
      id: 'where-moe-sits',
      title: 'Where MoE sits inside a Transformer',
      blocks: [
        { type: 'p', text: 'A Transformer layer has two sub-blocks: attention (tokens exchange information) and the FFN (each token is processed on its own). MoE replaces only the **FFN**. Attention is unchanged and shared by all tokens. Since the FFN holds most of a model\'s parameters (roughly two thirds in a typical dense layer), this is where sparsity pays off most.' },
        { type: 'flow', title: 'One MoE Transformer layer', nodes: [
          { label: 'Token vectors in', detail: 'The hidden states for every token in the sequence.' },
          { label: 'Self-attention', detail: 'Same as a dense Transformer: tokens look at each other. Usually followed by a residual add and normalization.' },
          { label: 'Router', detail: 'Each token independently gets a score for every expert and keeps its top-k.' },
          { label: 'Experts (sparse)', detail: 'Only the chosen experts run for each token. Tokens going to the same expert are batched together on its device.' },
          { label: 'Weighted sum + residual', detail: 'Expert outputs are mixed with the gate weights and added back to the token vector.' },
        ] },
        { type: 'p', text: 'Not every layer has to be MoE. Some models alternate dense and MoE layers, or keep the first few layers dense, because early layers handle generic features where routing helps less.' },
      ],
    },
    {
      id: 'sparse-activation',
      title: 'Sparse activation and why it saves compute',
      blocks: [
        { type: 'p', text: '**Sparse activation** means only a small fraction of parameters is used for each token. We now need two numbers to describe a model: **total parameters** (everything stored) and **active parameters** (what one token actually touches). Compute per token tracks the active count; knowledge capacity tracks, roughly, the total.' },
        { type: 'chart', kind: 'bar', title: 'Total vs active parameters in well-known open MoE models', yLabel: 'Billions of parameters', unit: 'B', labels: ['Mixtral 8x7B', 'DeepSeek-V3', 'Qwen3-235B-A22B', 'gpt-oss-120b'], series: [ { name: 'Total', values: [46.7, 671, 235, 117] }, { name: 'Active per token', values: [12.9, 37, 22, 5.1] } ], caption: 'Published figures from the model releases (rounded).' },
        { type: 'p', text: 'Mixtral 8x7B is a good worked example. Its name suggests 56B, but attention and embeddings are shared, so the total is about 46.7B. Each token uses 2 of 8 experts, so roughly 12.9B parameters are active: it runs at about the speed of a 13B dense model while drawing on the capacity of a much larger one.' },
        { type: 'check', question: 'A model has 8 experts of 1B parameters each, top-2 routing, plus 2B of shared attention and embedding parameters. What are its total and active parameter counts?', answer: 'Total = 8 × 1B + 2B = 10B. Active = 2 × 1B + 2B = 4B. Compute per token is like a 4B dense model, but all 10B must be held in memory.' },
        { type: 'callout', tone: 'warn', title: 'Sparse compute, not sparse memory', text: 'The skipped experts still have to be loaded in GPU memory, because the next token may need them. An MoE with 671B total parameters needs memory for 671B parameters even though it computes like a ~37B model. That is the most common misunderstanding about MoE.' },
      ],
    },
    {
      id: 'load-balancing',
      title: 'Load balancing across experts',
      blocks: [
        { type: 'p', text: 'Left alone, routers tend to **collapse**: a few experts get slightly better early, so they get more tokens, so they learn faster, so they get even more tokens. The rest starve and their parameters are wasted. On real hardware, experts sit on different GPUs (**expert parallelism**), so an overloaded expert also becomes a traffic jam.' },
        { type: 'list', items: [
          '**Auxiliary balance loss.** Add a small extra loss that is lowest when tokens are spread evenly. The Switch Transformer form is `N · ∑ᵢ fᵢ · Pᵢ`, where `fᵢ` is the fraction of tokens sent to expert i and `Pᵢ` is its average router probability; it equals 1.0 when perfectly balanced.',
          '**Capacity factor.** Each expert accepts at most a fixed number of tokens per batch (e.g. 1.25 × the fair share). Overflow tokens are **dropped** (they skip the expert and pass through on the residual path) or sent to another expert.',
          '**Bias-based balancing.** DeepSeek-V3 adds a per-expert bias to the routing scores that is nudged down for busy experts and up for idle ones, avoiding most of the auxiliary loss (it calls this auxiliary-loss-free balancing).',
          '**Noise in routing.** Adding small random noise to router scores during training encourages exploration of under-used experts.',
        ] },
      ],
    },
    {
      id: 'code-moe',
      title: 'Code: a tiny top-2 MoE layer in numpy',
      blocks: [
        { type: 'p', text: 'This script routes 12 tokens through 8 tiny experts with top-2 gating, counts how many tokens each expert receives, and computes the Switch-style balance loss.' },
        { type: 'code', lang: 'python', title: 'tiny_moe.py', code: `import numpy as np
np.random.seed(42)

d, n_experts, top_k, n_tokens = 8, 8, 2, 12
X = np.random.randn(n_tokens, d)                  # 12 token vectors
W_router = np.random.randn(d, n_experts) * 0.5    # router: one score per expert
experts = [np.random.randn(d, d) * 0.3 for _ in range(n_experts)]  # tiny FFNs

logits = X @ W_router                             # (12, 8) scores
probs = np.exp(logits - logits.max(1, keepdims=True))
probs /= probs.sum(1, keepdims=True)              # softmax over experts

out = np.zeros_like(X)
load = np.zeros(n_experts, dtype=int)
for i in range(n_tokens):
    top = np.argsort(probs[i])[-top_k:][::-1]     # indices of the 2 best experts
    gate = probs[i, top] / probs[i, top].sum()    # renormalise the 2 weights
    for e, g in zip(top, gate):
        out[i] += g * np.maximum(0, X[i] @ experts[e])   # weighted expert outputs
        load[e] += 1
    if i < 3:
        print(f"token {i}: experts {top.tolist()} weights {np.round(gate, 2).tolist()}")

print("tokens per expert:", load.tolist())
# Switch-style auxiliary loss: N * sum(fraction_routed * mean_prob); 1.0 = perfectly balanced
frac = load / load.sum()
aux = n_experts * np.sum(frac * probs.mean(0))
print(f"balance loss: {aux:.3f}  (1.000 would be perfectly balanced)")
per_expert = d * d
print(f"total expert params: {n_experts * per_expert}, active per token: {top_k * per_expert}")`, output: `token 0: experts [5, 4] weights [0.53, 0.47]
token 1: experts [3, 6] weights [0.86, 0.14]
token 2: experts [3, 7] weights [0.63, 0.37]
tokens per expert: [1, 1, 6, 3, 5, 2, 5, 1]
balance loss: 1.143  (1.000 would be perfectly balanced)
total expert params: 512, active per token: 128`,
          walkthrough: [
            { lines: [4, 7], note: 'Setup: 12 tokens of width 8, a router matrix with one column per expert, and 8 tiny one-matrix "experts".' },
            { lines: [9, 11], note: 'Router: a matrix multiply gives a score per expert, softmax turns scores into probabilities.' },
            { lines: [15, 20], note: 'For each token keep the top-2 experts, renormalize their weights, and add the weighted expert outputs. The other 6 experts are never computed for that token.' },
            { lines: [24, 27], note: 'Load counts and the balance loss. Expert 2 got 6 of 24 assignments while experts 0, 1 and 7 got 1 each, so the loss is above 1.0. Training would push it down.' },
            { lines: [28, 29], note: 'Each token touches 2 of 8 experts: one quarter of the expert parameters.' },
          ] },
      ],
    },
    {
      id: 'advantages-challenges',
      title: 'Advantages and challenges of MoE',
      blocks: [
        { type: 'compare', title: 'Dense model vs MoE model of similar per-token cost', options: [
          { name: 'Dense (e.g. 13B)', summary: 'Every parameter used for every token.', pros: ['Simple to train and serve', 'Fits on fewer GPUs', 'Stable training'], cons: ['Capacity limited by per-token budget'], bestFor: 'Small and mid-size deployments, edge devices, fine-tuning on a budget' },
          { name: 'MoE (e.g. 47B total / 13B active)', summary: 'Router picks a few experts per token.', pros: ['More knowledge at the same FLOPs per token', 'Often reaches a target quality with less training compute'], cons: ['Needs memory for all experts', 'Load balancing, routing instability', 'Expert-parallel communication overhead', 'Fine-tuning can be trickier'], bestFor: 'Large-scale serving where memory is available and throughput matters' },
        ], rows: [
          ['Compute per token', '13B worth', '~13B worth'],
          ['Memory for weights', '13B', '~47B'],
          ['Quality at same per-token cost', 'Baseline', 'Usually higher'],
          ['Serving complexity', 'Low', 'Higher (expert placement, all-to-all traffic)'],
        ], verdict: 'MoE trades memory and engineering complexity for more capability per unit of compute. It shines at scale with many GPUs; for a single small device a dense model is often the better choice.' },
        { type: 'p', text: 'Another subtle cost: at **small batch sizes** (one user, one token at a time) each token pulls in different experts, so the GPU spends its time loading expert weights from memory. MoE\'s compute savings show up most when many tokens are batched so each expert processes a decent group at once.' },
        { type: 'check', question: 'Our chatbot runs on one laptop GPU with 24 GB of memory. Someone proposes swapping our 7B dense model for a 47B-total / 13B-active MoE "because it is just as cheap". What is the flaw?', answer: 'Compute per token is similar to a 13B model, but the weights of all 47B parameters must still be stored. At 16-bit precision that is about 94 GB, far beyond 24 GB, so it will not even fit without heavy quantization or offloading.' },
      ],
    },
    {
      id: 'why-moe-powers-llms',
      title: 'Why MoE powers many modern LLMs',
      blocks: [
        { type: 'p', text: 'At frontier scale, the binding constraint is compute: for training and for serving millions of users. MoE gives more quality per FLOP, so labs can build models with hundreds of billions to over a trillion total parameters while keeping each token affordable. Open examples include Mixtral, DeepSeek-V3 and V4, Qwen3\'s MoE variants, Llama 4 and gpt-oss. Several closed frontier models are reported to be MoE, though their makers usually do not publish details.' },
        { type: 'callout', tone: 'example', title: 'Real-world pattern', text: 'Providers serving a large MoE spread experts across many GPUs (expert parallelism) and batch thousands of requests together, so every expert stays busy. This is why huge MoE models can be cheap per token through an API even though you could never run them on a single machine.' },
        { type: 'list', items: [
          '**Use MoE** when you serve at scale with plenty of GPU memory and want the best quality per unit of compute.',
          '**Prefer dense** when memory is tight (phones, laptops), batch sizes are tiny, or you need simple fine-tuning and deployment.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'In an MoE Transformer, which part of the layer is usually replaced by experts?', options: ['The self-attention block that mixes tokens', 'The token embedding table at the input', 'The feed-forward network (FFN)', 'The final softmax over the vocabulary'], answer: 2, explain: 'Experts are FFNs; attention is kept as a shared dense block. The FFN holds most parameters, which is why sparsifying it saves the most.' },
    { q: 'A model has 16 experts of 2B parameters each, top-2 routing, and 4B of shared parameters. How many parameters are active per token?', options: ['8B', '36B', '4B', '6B'], answer: 0, explain: 'Active = 2 experts × 2B + 4B shared = 8B. Total would be 16 × 2B + 4B = 36B, which is the tempting wrong answer.' },
    { q: 'During training, two experts receive almost all tokens and the others barely learn. What is the standard fix?', options: ['Remove the router and send every token to every expert', 'Add load balancing, e.g. an auxiliary loss or capacity limits', 'Raise the learning rate of the two popular experts only', 'Assign each expert a hand-picked topic before training'], answer: 1, explain: 'Router collapse is fixed by balancing: auxiliary loss, capacity factors, routing noise or bias adjustment. Using all experts would turn the model dense and lose the savings.' },
    { q: 'Compared with a dense model that has the same number of active parameters, a well-trained MoE model typically has:', options: ['Lower memory use and lower quality', 'The same memory use and quality', 'Higher memory use, usually higher quality', 'Lower compute and lower memory use'], answer: 2, explain: 'MoE matches per-token compute but must store all experts, so memory is higher; in return the extra capacity usually improves quality.' },
    { q: 'Which statement about experts is a misconception?', options: ['Each expert is a small feed-forward network', 'Engineers assign each expert a topic before training', 'Tokens of one sentence can visit different experts', 'Some designs add a shared expert used by every token'], answer: 1, explain: 'Specialization is learned by the router and experts during training and is often not topic-shaped at all. The other statements are true.' },
  ],
  takeaways: [
    'An MoE layer = many FFN experts + a router that sends each token to the top-k of them.',
    'Total parameters set capacity; active parameters set compute per token.',
    'All experts must sit in memory: MoE saves compute, not memory.',
    'Load balancing (aux loss, capacity limits, bias tweaks) prevents a few experts from taking all tokens.',
    'MoE shines at large-scale, batched serving; dense models are simpler for small or memory-limited deployments.',
  ],
  terms: [
    { term: 'Expert', def: 'One of several feed-forward sub-networks inside an MoE layer.' },
    { term: 'Router (gate)', def: 'A small layer that scores experts for each token and picks the top-k.' },
    { term: 'Top-k routing', def: 'Keeping only the k highest-scoring experts for a token and mixing their outputs.' },
    { term: 'Active parameters', def: 'The parameters actually used to process one token.' },
    { term: 'Load balancing', def: 'Techniques that spread tokens evenly across experts so none is overloaded or idle.' },
    { term: 'Capacity factor', def: 'A cap on how many tokens each expert accepts per batch; overflow tokens are dropped or rerouted.' },
    { term: 'Shared expert', def: 'An expert that every token uses, holding common knowledge alongside routed experts.' },
  ],
};
