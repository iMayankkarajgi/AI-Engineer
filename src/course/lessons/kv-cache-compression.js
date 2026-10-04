export default {
  id: "kv-cache-compression",
  minutes: 24,
  hook: "Can we throw away three quarters of an LLM's memory of a conversation and still get nearly the same answer? Sometimes yes, and it depends on which quarter we keep.",
  summary: "The KV cache stores a key and a value vector for every past token in every layer, and for long contexts it outgrows the model itself. KV cache compression shrinks it in four main ways: fewer bits per number (quantization), fewer tokens (eviction), fewer key/value heads (sharing across heads), or fewer dimensions per token (low-rank). This lesson measures the quality cost of each on real attention math and gives a decision guide.",
  sections: [
    {
      id: "llm-and-attention-recap",
      title: "How an LLM writes text, and what attention needs",
      blocks: [
        { type: "p", text: "An LLM generates text **autoregressively**: it predicts one token, appends it, and predicts again. Inside each Transformer layer, **attention** lets the newest token look back at earlier ones. Each token is projected into a **query** (what it is looking for), a **key** (what it can be matched on) and a **value** (what it contributes)." },
        { type: "formula", expr: "out = ∑ᵢ wᵢ · vᵢ,   wᵢ = softmax(q · kᵢ / √d)", where: [["q", "query of the newest token"], ["kᵢ, vᵢ", "key and value of earlier token i"], ["wᵢ", "attention weight on token i; all weights sum to 1"], ["d", "head dimension, e.g. 64 or 128"]], caption: "The output is a weighted average of values. The weights come from how well each key matches the query." },
        { type: "p", text: "This formula tells us what compression can safely change. If we perturb keys slightly, the weights wᵢ shift slightly. If we perturb values slightly, the average shifts slightly. If we delete token i entirely, its weight is redistributed to the remaining tokens, which is harmless only if wᵢ was tiny." },
        { type: "callout", tone: "analogy", title: "Think of it like packing for a long trip", text: "Your suitcase is the GPU's memory. You can fold clothes tighter (quantization), leave some items at home (eviction), share one toiletry bag among family members (sharing heads), or vacuum-pack bulky things and expand them on arrival (low-rank). Each saves space; only one of them means you might arrive without something you need." }
      ]
    },
    {
      id: "why-cache-is-huge",
      title: "The KV cache and why it becomes huge",
      blocks: [
        { type: "p", text: "The **KV cache** keeps every past token's key and value so that each new step does not recompute them. Its size is a product of factors:" },
        { type: "formula", expr: "KV bytes = 2 × layers × kv_heads × head_dim × bytes_per_number × tokens × batch" },
        { type: "p", text: "For a 32-layer model with 32 KV heads of size 128 in FP16, that is 512 KiB per token. Our running example, a **legal-document assistant** that keeps whole 100-page contracts (about 60,000 tokens) in context, needs about 29 GiB of cache per conversation, nearly twice the 16 GB of weights of an 8B model. Every decode step must also read that cache, so size costs speed too." },
        { type: "viz", name: "kv-cache", caption: "Use the memory calculator: change layers, heads and context length and watch the cache size respond." }
      ]
    },
    {
      id: "what-is-compression",
      title: "What KV cache compression is",
      blocks: [
        { type: "p", text: "**KV cache compression** means storing the information in the cache in fewer bytes while keeping attention outputs close to the uncompressed ones. Each method attacks one factor of the size formula: **bytes_per_number** (quantization), **tokens** (eviction), **kv_heads** (sharing) or the **per-token dimension** (low-rank)." },
        { type: "p", text: "To compare them fairly we need a quality measure. A simple one is the **relative error** of one attention output: ‖out_compressed − out_exact‖ / ‖out_exact‖. Zero means identical; 1.0 means an error as large as the answer itself. Real evaluations use task accuracy (for example long-document question answering), but this measure shows the mechanics clearly." }
      ]
    },
    {
      id: "approach-quantization",
      title: "Approach 1: Quantization",
      blocks: [
        { type: "p", text: "**Quantization** stores each number as a small integer plus a shared scale. With b bits there are 2ᵇ levels; symmetric INT8 uses −127…127. To quantize a group of numbers, we find the largest magnitude, set scale = max|x| / 127, store round(x / scale), and multiply back when reading." },
        { type: "steps", title: "Quantizing one key vector to INT8", items: [
          { title: "Find the range", text: "Say the key is [0.42, −1.27, 0.05, 0.88]. The largest magnitude is 1.27." },
          { title: "Compute the scale", text: "scale = 1.27 / 127 = 0.01." },
          { title: "Round to integers", text: "0.42/0.01 = 42, −1.27/0.01 = −127, 0.05/0.01 = 5, 0.88/0.01 = 88. Store [42, −127, 5, 88] in one byte each plus the scale." },
          { title: "Dequantize when used", text: "Multiply back: [0.42, −1.27, 0.05, 0.88]. Here it is exact; in general each number is off by at most half a step (0.005)." }
        ] },
        { type: "p", text: "Grouping matters. **Per-token** scales use one scale per token vector; **per-channel** scales use one scale per dimension across tokens. Keys often contain a few channels with consistently large values (outliers), which ruin a per-token scale for the other channels; the KIVI paper therefore quantizes keys per-channel and values per-token. In practice FP8 KV caches are widely supported in serving engines, and INT4 or 2-bit schemes need such careful grouping to hold quality." },
        { type: "viz", name: "quantization", caption: "Slide the bit width down and watch numbers snap to a coarser grid; the error grows sharply below 4 bits." }
      ]
    },
    {
      id: "approach-eviction",
      title: "Approach 2: Token eviction",
      blocks: [
        { type: "p", text: "**Token eviction** keeps at most a fixed number of tokens (the **budget**) in the cache and discards the rest. The policy decides which ones survive:" },
        { type: "list", items: [
          "**Sliding window:** keep the most recent W tokens. Simple, but forgets the start of the conversation.",
          "**Attention sinks + window:** StreamingLLM observed that many heads put large attention on the first few tokens regardless of content. Keeping those few “sink” tokens plus a recent window keeps generation stable on very long streams.",
          "**Score-based:** methods like H2O keep “heavy hitters”, tokens that accumulated the most attention so far, plus recent tokens. SnapKV-style methods pick important tokens using the attention of the last part of the prompt."
        ] },
        { type: "matrix", title: "Attention weights of 4 recent queries over 8 cached tokens (illustrative)", rows: ["q₉", "q₁₀", "q₁₁", "q₁₂"], cols: ["t1 (sink)", "t2", "t3 (order #)", "t4", "t5", "t6", "t7", "t8"], values: [[0.30, 0.02, 0.25, 0.03, 0.05, 0.08, 0.12, 0.15], [0.28, 0.02, 0.22, 0.03, 0.04, 0.06, 0.15, 0.20], [0.32, 0.01, 0.03, 0.02, 0.04, 0.08, 0.20, 0.30], [0.27, 0.01, 0.30, 0.02, 0.03, 0.05, 0.12, 0.20]], format: "pct", caption: "Illustrative. A recency window of 3 would drop t3 (an order number) even though queries keep returning to it; a score-based policy would keep it." },
        { type: "callout", tone: "warn", title: "Eviction is irreversible", text: "Once a token's keys and values are gone, no later query can see them. A token that looked unimportant early on may become crucial when the user asks a follow-up. Scores from the past are only a guess about the future." }
      ]
    },
    {
      id: "approach-sharing",
      title: "Approach 3: Sharing keys and values across heads",
      blocks: [
        { type: "p", text: "Standard **multi-head attention (MHA)** gives each query head its own key and value head. **Multi-query attention (MQA)** shares one K/V head among all query heads. **Grouped-query attention (GQA)** shares each K/V head among a group: 32 query heads with 8 K/V heads means groups of 4 and a 4× smaller cache." },
        { type: "viz", name: "gqa", caption: "Switch between MHA, GQA and MQA and watch the KV cache bar shrink as query heads share key/value heads." },
        { type: "p", text: "Unlike quantization and eviction, sharing is an **architecture** decision: the model must be trained (or converted and briefly “up-trained”, as the GQA paper showed) with shared heads. Llama 3, Mistral 7B and many other recent open models use GQA, so you often get this saving simply by choosing a modern model." }
      ]
    },
    {
      id: "approach-low-rank",
      title: "Approach 4: Low-rank compression",
      blocks: [
        { type: "p", text: "A matrix has **low rank** if its rows mostly live in a smaller subspace: a few basis directions combine to approximate every row. Key and value matrices in trained models are often like this. Then we can store each token as a short vector of r coefficients plus a shared r × d basis, instead of d numbers per token." },
        { type: "deeper", title: "The math: SVD and latent attention", blocks: [
          { type: "p", text: "The **singular value decomposition** writes a T × d key matrix as K = U Σ Vᵀ. Keeping only the top r singular values gives the best rank-r approximation K ≈ (U_r Σ_r) V_rᵀ. Storage drops from T·d to T·r + r·d numbers. With d = 128 and r = 32 that is close to 4× smaller for long T." },
          { type: "p", text: "Computing an SVD of the live cache is expensive, so production designs learn the compression instead. **Multi-head Latent Attention (MLA)**, introduced in DeepSeek-V2, projects each token to a small latent vector c = W_down · h, caches only c, and reconstructs per-head keys and values with learned up-projections. The up-projections can be folded into the query and output matrices so the full keys never need to be materialised. Positional information (RoPE) needs a small separate key part, because rotation does not commute with the folding." }
        ] },
        { type: "p", text: "Post-hoc low-rank methods (applied to an already trained model) exist too, but quality depends heavily on how much true redundancy the model has, so they are less of a free lunch than learned designs like MLA." }
      ]
    },
    {
      id: "measuring-quality",
      title: "Code: measuring the quality cost of each approach",
      blocks: [
        { type: "p", text: "Let us build 512 cached tokens with keys that have hidden low-rank structure, a query that looks back at token 200, and measure the relative error of the attention output under each method." },
        { type: "code", lang: "python", title: "compress_kv.py", code: `import numpy as np
rng = np.random.default_rng(42)
T, d = 512, 64                                    # 512 cached tokens, head dim 64
K = rng.normal(size=(T, 16)) @ rng.normal(size=(16, d)) / 4  # keys: low-rank structure
K += 0.1 * rng.normal(size=(T, d))
V = rng.normal(size=(T, d))
q = K[200] / 2 + rng.normal(size=d) / 2          # query that "looks back" at token 200

def attn(q, K, V):
    s = K @ q / np.sqrt(d); w = np.exp(s - s.max()); w /= w.sum()
    return w @ V, w

ref, w = attn(q, K, V)
err = lambda out: np.linalg.norm(out - ref) / np.linalg.norm(ref)

def quantize(x, bits):                            # per-token symmetric quantization
    qmax = 2 ** (bits - 1) - 1
    scale = np.abs(x).max(axis=1, keepdims=True) / qmax
    return np.round(x / scale).clip(-qmax, qmax) * scale

for bits in [8, 4, 2]:
    print(f"quantize K,V to INT{bits}:   error {err(attn(q, quantize(K, bits), quantize(V, bits))[0]):.3f}")

keep = np.r_[0:4, T-124:T]                        # 4 "sink" tokens + 124 most recent
print(f"evict: sinks + recent 128: error {err(attn(q, K[keep], V[keep])[0]):.3f}")
top = np.argsort(w)[-128:]                        # keep the 128 highest-attention tokens
print(f"evict: top-128 by score:   error {err(attn(q, K[top], V[top])[0]):.3f}")

U, S, Vt = np.linalg.svd(K, full_matrices=False)  # low-rank: store K as (T x r)(r x d)
for r in [32, 16, 8]:
    K_r = (U[:, :r] * S[:r]) @ Vt[:r]
    print(f"low-rank keys, rank {r:2d}:   error {err(attn(q, K_r, V)[0]):.3f}")`, output: `quantize K,V to INT8:   error 0.007
quantize K,V to INT4:   error 0.102
quantize K,V to INT2:   error 0.878
evict: sinks + recent 128: error 1.568
evict: top-128 by score:   error 0.645
low-rank keys, rank 32:   error 0.041
low-rank keys, rank 16:   error 0.052
low-rank keys, rank  8:   error 0.345`, walkthrough: [
          { lines: [1, 7], note: "Synthetic cache: keys built from 16 hidden directions plus noise (so they are nearly rank 16), random values, and a query similar to token 200's key." },
          { lines: [9, 14], note: "Exact attention and the relative-error measure we use for every method." },
          { lines: [16, 22], note: "Per-token symmetric quantization at 8, 4 and 2 bits, applied to both keys and values." },
          { lines: [24, 27], note: "Two eviction policies with the same 128-token budget (a 4× saving): sinks + recency vs keeping the highest-attention tokens." },
          { lines: [29, 32], note: "Rank-r approximation of the keys via SVD. Rank 32 of 64 dims is a 2× saving on keys." }
        ] },
        { type: "chart", kind: "hbar", title: "Relative error of the attention output (from the script; lower is better)", labels: ["INT8", "INT4", "INT2", "Evict: sinks+recent 128", "Evict: top-128 by score", "Low-rank r=32", "Low-rank r=16", "Low-rank r=8"], series: [{ name: "Relative error", values: [0.007, 0.102, 0.878, 1.568, 0.645, 0.041, 0.052, 0.345] }], caption: "One synthetic head, one query. Real models differ, but the pattern is typical: 8-bit is nearly free, recency eviction fails when the query needs an old token, and low rank is cheap until r drops below the true rank." },
        { type: "list", items: [
          "INT8 is almost lossless (0.7% error); INT4 is usable (about 10%) and benefits from smarter grouping; INT2 with naive scales breaks.",
          "Recency eviction scores worst because the query needed token 200, which the window dropped. Score-based eviction is better but still lossy, because this query's attention is spread across many tokens.",
          "Low rank is nearly free down to the hidden rank (16) and degrades sharply below it (rank 8)."
        ] },
        { type: "check", question: "Why is the rank-32 error (0.041) only slightly lower than the rank-16 error (0.052)?", answer: "The keys were built from 16 hidden directions plus small noise. Rank 16 already captures the real structure; dimensions 17–32 only add back some of the noise, which matters little." }
      ]
    },
    {
      id: "comparison-and-choice",
      title: "Comparison, and when to use which",
      blocks: [
        { type: "compare", title: "The four approaches side by side", options: [
          { name: "Quantization", summary: "Fewer bits per number.", pros: ["Drop-in for existing models", "8-bit is nearly lossless", "Keeps every token"], cons: ["Savings limited to 2–4× (more needs exotic schemes)", "Dequantize cost in kernels"], bestFor: "Default first step in any deployment" },
          { name: "Eviction", summary: "Fewer tokens.", pros: ["Huge, tunable savings", "Bounded memory for endless streams"], cons: ["Irreversible information loss", "Policy can guess wrong"], bestFor: "Streaming chat, logs, agents with very long histories" },
          { name: "Head sharing", summary: "Fewer K/V heads.", pros: ["4–8× savings with little quality loss", "Faster decode"], cons: ["Needs training or up-training"], bestFor: "Picking or training a model" },
          { name: "Low-rank / latent", summary: "Fewer numbers per token.", pros: ["Large savings when learned (MLA)", "Keeps every token"], cons: ["Architecture change", "Post-hoc versions are fragile"], bestFor: "New long-context model designs" }
        ], rows: [["Size factor", "bytes", "tokens", "kv_heads", "dims per token"], ["Applies to an existing model?", "Yes", "Yes", "No", "Mostly no"], ["Risk of losing a fact", "Low", "High", "Low", "Low–medium"]], verdict: "Stack the safe ones (a GQA/MLA model + FP8/INT8 cache) and reach for eviction only when context must be unbounded." },
        { type: "callout", tone: "example", title: "Our legal-document assistant", text: "Users ask about any clause, so eviction is risky. We choose a GQA model with 8 KV heads (4×) and an FP8 cache (2×): 60,000 tokens drop from about 29 GiB to about 3.7 GiB per conversation, with every clause still in memory." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Evaluating compression on short prompts or general benchmarks only; the damage appears on long-context retrieval. Quantizing keys with per-token scales and being surprised by outlier channels. And forgetting that compressed caches need kernel support in your serving engine, otherwise the dequantization overhead can eat the speed gain." },
        { type: "p", text: "When not to compress: if contexts are short and batches small, the cache is a minor share of memory. Spend effort on weight quantization or a smaller model first." }
      ]
    }
  ],
  quiz: [
    { q: "Which compression approach is the only one that permanently removes information about whole tokens?", options: ["INT8 quantization", "Grouped-query attention", "Token eviction", "Low-rank compression"], answer: 2, explain: "Eviction deletes tokens' keys and values. The other methods keep a (slightly approximate) representation of every token." },
    { q: "Quantize the key [0.42, −1.27, 0.05, 0.88] to symmetric INT8 with one scale. What are the scale and the stored value for 0.88?", options: ["scale 0.01, stored 88", "scale 1.27, stored 1", "scale 0.0069, stored 127", "scale 0.01, stored 127"], answer: 0, explain: "scale = max|x| / 127 = 1.27 / 127 = 0.01, and 0.88 / 0.01 = 88. Only the largest-magnitude number maps to ±127." },
    { q: "Our assistant uses a recency window and starts failing on questions about details from early in a long contract. What is the best change?", options: ["Shrink the recency window further so more memory is free for other users", "Switch the cache to INT2 quantization to fit more tokens", "Swap eviction for an FP8 cache and a GQA model, keeping every token", "Disable the KV cache entirely and recompute each step"], answer: 2, explain: "The failures come from evicted tokens. Quantization and head sharing save memory while keeping every token available." },
    { q: "How does GQA differ from KV quantization?", options: ["GQA cuts KV heads and is built in at training; quantization cuts bits on an existing model", "GQA cuts bits per number; quantization cuts the number of key/value heads", "Both remove old tokens from the cache, but GQA picks them by attention score", "GQA works only on CPUs; quantization is the GPU version of the same idea"], answer: 0, explain: "They attack different factors of the size formula, and GQA is an architectural choice made at training time (or via up-training)." },
    { q: "A colleague says: “Low-rank compression is always safe; just pick a very small rank to save the most memory.” Based on the code results, what is the flaw?", options: ["Low rank never actually saves memory, since the factors are just as large", "Error stays small only down to the data's true rank; below it, error rises sharply", "Low-rank compression applies to values only; keys stay at full rank", "Rank has no effect on reconstruction error, only on attention speed"], answer: 1, explain: "In our run, rank 16 (the hidden rank) gave 0.052 error, while rank 8 jumped to 0.345. Going below the real structure throws away signal." }
  ],
  takeaways: [
    "KV cache size = 2 × layers × kv_heads × head_dim × bytes × tokens × batch; each compression method shrinks one factor.",
    "Quantization (FP8/INT8) is nearly lossless and works on existing models; very low bits need careful grouping.",
    "Eviction can save the most but deletes information; recency-only policies fail when old tokens matter.",
    "GQA/MQA and latent attention (MLA) are architectural choices that shrink the cache from the start.",
    "Measure quality on your real long-context tasks before turning on aggressive compression."
  ],
  terms: [
    { term: "KV cache compression", def: "Storing cached keys and values in fewer bytes while keeping attention outputs close to exact." },
    { term: "Scale (quantization)", def: "The number that maps stored integers back to real values, often max|x| divided by the largest integer level." },
    { term: "Per-channel quantization", def: "Using a separate scale for each vector dimension across tokens, which handles outlier channels in keys." },
    { term: "Attention sink", def: "Early tokens that receive large attention regardless of content; keeping them stabilises eviction-based caches." },
    { term: "Heavy hitter", def: "A token that has received a large share of attention, kept by score-based eviction policies." },
    { term: "Low-rank approximation", def: "Representing a matrix with fewer basis directions, storing short coefficient vectors per row." },
    { term: "Multi-head Latent Attention", def: "DeepSeek's design that caches a compact learned latent per token and reconstructs keys and values from it." }
  ]
};
