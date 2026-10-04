export default {
  id: "llm-inference-optimization",
  minutes: 27,
  hook: "Why does a chatbot that fits easily on one GPU suddenly run out of memory when eight people paste in long documents at the same time?",
  summary: "An LLM writes one token at a time, and to avoid redoing work it stores a Key and a Value vector for every past token in every layer: the KV cache. That cache grows with context length and with the number of users, and it quickly becomes the main memory cost of serving. This lesson shows where the memory goes and walks through the four big families of KV cache compression (quantization, token eviction, sharing keys and values across heads, and low-rank compression) and when to pick each.",
  sections: [
    {
      id: "how-an-llm-writes",
      title: "What an LLM is and how it writes text",
      blocks: [
        { type: "p", text: "A **large language model (LLM)** is a neural network trained to answer one question over and over: *given the text so far, what is the next token?* A **token** is a small piece of text, often a word or part of a word. “unbelievable” might be split into “un”, “believ” and “able”." },
        { type: "p", text: "To write a reply, the model runs in a loop. It reads the prompt, predicts a probability for every token in its vocabulary, picks one, appends it to the text, and runs again. This loop is called **autoregressive generation**: each new token depends on all the tokens before it. A 300-token answer needs 300 trips through the model." },
        { type: "callout", tone: "analogy", title: "Think of it like a writer who keeps notes", text: "Imagine a writer who, before adding each new word, must glance back over everything written so far. If they had to re-read the whole document from scratch each time, a long letter would take forever. If they keep good notes about each earlier word, each glance is quick. The KV cache is those notes; inference optimization is largely about keeping the notes small and the glances fast." },
        { type: "p", text: "Throughout this lesson we will follow one running example: a **support chatbot** built on an 8-billion-parameter model. Customers paste long logs and contracts, so prompts of 30,000 tokens are common, and we want to serve many customers on one GPU." },
        { type: "p", text: "**Inference** means using a trained model to produce outputs, as opposed to training it. **Inference optimization** is the set of tricks that make this cheaper and faster: smaller numbers (quantization), smarter memory management, batching users together, and guessing tokens ahead of time. Later lessons in this module cover batching, paged memory and speculative decoding. This lesson focuses on the single biggest memory consumer during serving, the KV cache, and the ways we shrink it." }
      ]
    },
    {
      id: "what-is-attention",
      title: "What attention does",
      blocks: [
        { type: "p", text: "Inside each Transformer layer, **attention** is the step where a token gathers information from the tokens before it. Every token is turned into three vectors by multiplying it with three learned weight matrices:" },
        { type: "list", items: [
          "**Query (Q)**: what this token is looking for.",
          "**Key (K)**: a label describing what this token offers, used to match against queries.",
          "**Value (V)**: the actual content this token passes on if it is chosen."
        ] },
        { type: "formula", expr: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V", where: [["Q", "query vectors of the tokens doing the looking"], ["K, V", "key and value vectors of all tokens that can be looked at"], ["dₖ", "length of each key vector, e.g. 128"], ["softmax", "turns scores into weights that are positive and sum to 1"]], caption: "Scores come from query·key dot products; the output is a weighted average of values." },
        { type: "p", text: "Most models also split attention into several **heads**. Each head has its own smaller Q, K and V and can learn a different pattern, for example one head tracks the previous token and another tracks the subject of the sentence. A model with 32 heads and a head size of 128 has 32 separate K and V vectors per token per layer." },
        { type: "viz", name: "qkv-math", caption: "Step through one attention calculation: dot products of the query with each key, scaling, softmax, then the weighted sum of values." }
      ]
    },
    {
      id: "what-is-the-kv-cache",
      title: "What the KV cache is",
      blocks: [
        { type: "p", text: "Here is the key observation. When the model generates token number 501, the keys and values of tokens 1 to 500 are exactly the same as they were in the previous step, because a causal model never lets earlier tokens look at later ones. Recomputing them would be pure waste." },
        { type: "p", text: "So we store them. The **KV cache** is a buffer that holds the key and value vectors of every token processed so far, for every layer and every head. At each new step the model only computes Q, K and V for the newest token, appends its K and V to the cache, and lets the new query attend over the whole cache." },
        { type: "steps", title: "One decoding step with a KV cache", items: [
          { title: "Embed the new token", text: "Only the token generated in the previous step enters the model, not the whole text." },
          { title: "Project to Q, K, V", text: "In each layer, multiply the token's vector by the three weight matrices to get its query, key and value." },
          { title: "Append to the cache", text: "Write the new K and V to the end of this layer's cache. The cache grows by one row per layer per step." },
          { title: "Attend over the cache", text: "Score the new query against every cached key, softmax, and take the weighted sum of cached values." },
          { title: "Predict the next token", text: "After the last layer, turn the result into probabilities and pick a token. Repeat." }
        ] },
        { type: "viz", name: "kv-cache", caption: "Step through decoding and watch one K row and one V row being appended per token; use the calculator to see how memory scales with layers, heads and context." },
        { type: "check", question: "Pause and predict: if we double the number of layers but keep everything else equal, what happens to the KV cache size?", answer: "It doubles. Every layer keeps its own keys and values for every token, so the cache is proportional to the number of layers." }
      ]
    },
    {
      id: "why-the-cache-gets-huge",
      title: "Why the KV cache becomes huge",
      blocks: [
        { type: "p", text: "The cache size follows a simple multiplication. Every factor in it is large for modern models and real workloads." },
        { type: "formula", expr: "KV bytes = 2 × layers × kv_heads × head_dim × bytes_per_number × tokens × batch", where: [["2", "one key and one value"], ["layers", "number of Transformer layers, e.g. 32"], ["kv_heads", "number of key/value heads, e.g. 32 (or 8 with sharing)"], ["head_dim", "size of each head's vector, e.g. 128"], ["bytes_per_number", "2 for FP16/BF16, 1 for INT8, 0.5 for INT4"], ["tokens", "context length of each sequence"], ["batch", "number of sequences served at once"]] },
        { type: "p", text: "Plug in our chatbot's 8B-class shape: 32 layers, 32 KV heads, head size 128, FP16. Per token that is 2 × 32 × 32 × 128 × 2 bytes = 524,288 bytes, or **512 KiB per token**. A single 32,000-token conversation needs about 15.6 GiB. Eight such users need about 125 GiB, more than the memory of a single 80 GB GPU, and the model weights (about 16 GB in FP16) still have to fit too." },
        { type: "chart", kind: "line", title: "KV cache size grows linearly with context (32 layers, 32 KV heads, head dim 128, FP16, one sequence)", xLabel: "Context length (thousand tokens)", yLabel: "GiB", series: [{ name: "Full multi-head KV", points: [[0, 0], [8, 3.9], [16, 7.8], [32, 15.6], [64, 31.3], [128, 62.5]] }, { name: "With 8 shared KV heads (GQA)", points: [[0, 0], [8, 1], [16, 2], [32, 3.9], [64, 7.8], [128, 15.6]] }], caption: "Computed from the formula above. Weights stay fixed at about 16 GB, so for long contexts the cache, not the model, dominates memory." },
        { type: "p", text: "The memory problem also becomes a speed problem. During generation, each step must read the entire cache from GPU memory to compute attention. More cache bytes means more time moving data, so a smaller cache often makes each token faster as well as letting more users share the GPU." }
      ]
    },
    {
      id: "what-is-kv-compression",
      title: "What KV cache compression is",
      blocks: [
        { type: "p", text: "**KV cache compression** is any technique that stores the keys and values in fewer bytes while keeping the model's answers as close as possible to the uncompressed version. Look at the size formula again: each factor is a lever we can pull." },
        { type: "table", caption: "Each compression family attacks a different factor of the size formula", head: ["Approach", "Factor it shrinks", "Idea in one line"], rows: [
          ["Quantization", "bytes_per_number", "Store each number with fewer bits (8 or 4 instead of 16)."],
          ["Token eviction", "tokens", "Throw away the cached entries of tokens that matter least."],
          ["Sharing K/V across heads", "kv_heads", "Let several query heads read the same key/value head."],
          ["Low-rank compression", "head_dim (effectively)", "Store a short latent vector and expand it to K and V when needed."]
        ] },
        { type: "p", text: "Some of these can be applied to an existing model at serving time (quantization, many eviction methods). Others change the architecture and must be built in when the model is trained or adapted (head sharing, most low-rank schemes). That difference matters a lot in practice, because most teams serve models they did not train." }
      ]
    },
    {
      id: "four-approaches",
      title: "The four approaches",
      blocks: [
        { type: "tabs", items: [
          { label: "1. Quantization", blocks: [
            { type: "p", text: "**Quantization** maps each number to a small set of allowed values. With INT8 there are 256 levels, with INT4 only 16. We store a small integer per number plus a **scale** (and sometimes a zero point) per group of numbers, and multiply back when we use them. Going from FP16 to INT8 halves the cache; INT4 quarters it." },
            { type: "p", text: "Keys and values behave differently. Research such as KIVI observed that keys tend to have a few channels with very large values, so they compress better with per-channel scales, while values do well with per-token scales. Serving engines such as vLLM and TensorRT-LLM support FP8 KV caches, and INT4 or lower usually needs these careful grouping schemes to keep quality." },
            { type: "viz", name: "quantization", caption: "Lower the bit width and watch values snap to fewer allowed levels; error grows while memory shrinks." }
          ] },
          { label: "2. Token eviction", blocks: [
            { type: "p", text: "**Token eviction** keeps a fixed budget of cached tokens and drops the rest. The question is which ones to drop. Simple policies keep a **sliding window** of the most recent tokens. StreamingLLM found that also keeping the first few tokens, called **attention sinks**, stabilises the model, because many heads park attention there. Score-based policies like H2O keep “heavy hitter” tokens that have received the most attention so far." },
            { type: "p", text: "Eviction can shrink the cache dramatically, but it is the only approach here that permanently deletes information. If the customer's order number was evicted and they ask about it later, the model cannot recover it." }
          ] },
          { label: "3. Sharing across heads", blocks: [
            { type: "p", text: "In standard **multi-head attention (MHA)** each of the 32 query heads has its own K and V head. **Multi-query attention (MQA)** keeps all 32 query heads but uses just one shared K/V head. **Grouped-query attention (GQA)** sits in between: for example 8 K/V heads, each shared by a group of 4 query heads. Llama 2 70B, Llama 3 and Mistral 7B use GQA." },
            { type: "viz", name: "gqa", caption: "Toggle MHA, GQA and MQA to see query heads share key/value heads and the KV cache bar shrink." }
          ] },
          { label: "4. Low-rank", blocks: [
            { type: "p", text: "Keys and values are often **redundant**: their many dimensions are correlated, so the information lives in a smaller subspace. **Low-rank compression** exploits this by storing a short vector per token and reconstructing K and V with a projection when needed. DeepSeek-V2 introduced **Multi-head Latent Attention (MLA)**, which caches one compressed latent vector per token per layer instead of full per-head keys and values; the model is trained this way from the start." }
          ] }
        ] },
        { type: "callout", tone: "note", title: "Approaches stack", text: "These families multiply. A GQA model with 8 KV heads and an FP8 cache already uses 8× less KV memory than a 32-head FP16 model, before any eviction." }
      ]
    },
    {
      id: "code-memory-calculator",
      title: "Code: a KV cache budget for our chatbot",
      blocks: [
        { type: "p", text: "Let us compute the cache for eight users at 32,000 tokens each, and apply each compression idea in turn. The numbers come straight from the size formula." },
        { type: "code", lang: "python", title: "kv_budget.py", code: `# KV cache size for one long chat, and what each compression idea saves
layers, q_heads, head_dim = 32, 32, 128   # a 7B/8B-class model shape
context, batch = 32_000, 8                # 32k tokens, 8 users at once

def kv_bytes(kv_heads, bytes_per_num, tokens, dim=head_dim):
    # 2 = one Key + one Value vector per head, per layer, per token
    return 2 * layers * kv_heads * dim * bytes_per_num * tokens * batch

GB = 1024**3
plans = {
    "baseline FP16":              kv_bytes(32, 2,   context),
    "quantize to INT8":           kv_bytes(32, 1,   context),
    "quantize to INT4":           kv_bytes(32, 0.5, context),
    "evict: keep 4k tokens":      kv_bytes(32, 2,   4_000),
    "share heads: GQA 8 KV":      kv_bytes(8,  2,   context),
    "low-rank: 128 -> 32 dims":   kv_bytes(32, 2,   context, dim=32),
    "GQA 8 + INT8 combined":      kv_bytes(8,  1,   context),
}
base = plans["baseline FP16"]
per_token = kv_bytes(32, 2, 1) / batch
print(f"KV bytes per token (FP16): {per_token/1024:.0f} KiB")
for name, b in plans.items():
    print(f"{name:26s} {b/GB:6.1f} GB  ({base/b:4.1f}x smaller)")`, output: `KV bytes per token (FP16): 512 KiB
baseline FP16               125.0 GB  ( 1.0x smaller)
quantize to INT8             62.5 GB  ( 2.0x smaller)
quantize to INT4             31.2 GB  ( 4.0x smaller)
evict: keep 4k tokens        15.6 GB  ( 8.0x smaller)
share heads: GQA 8 KV        31.2 GB  ( 4.0x smaller)
low-rank: 128 -> 32 dims     31.2 GB  ( 4.0x smaller)
GQA 8 + INT8 combined        15.6 GB  ( 8.0x smaller)`, walkthrough: [
          { lines: [1, 3], note: "The model shape and workload: 32 layers, 32 heads of size 128, and eight users each holding a 32k-token conversation." },
          { lines: [5, 7], note: "The size formula. Each argument is one lever: KV heads, bytes per number, tokens kept, and the per-head dimension." },
          { lines: [9, 18], note: "One plan per approach. Each changes exactly one factor, except the last which combines head sharing and INT8." },
          { lines: [19, 23], note: "Print the per-token cost and each plan's size and saving. GB here means GiB (1024³ bytes)." }
        ] },
        { type: "p", text: "The baseline needs 125 GiB, which does not fit on one 80 GB GPU. GQA plus INT8 brings it to about 16 GiB, which fits comfortably next to the 16 GB of weights. The memory arithmetic is exact, but the *quality* cost of each plan is not visible here: that is what the next lesson measures." },
        { type: "check", question: "Our calculation says eviction to 4k tokens and GQA+INT8 both give 8× savings. Are they equally good choices?", answer: "No. GQA+INT8 keeps information about every token, slightly blurred. Eviction to 4k permanently drops 28k tokens per user, so any question about the dropped part of the document can no longer be answered accurately. Same bytes, very different risk." }
      ]
    },
    {
      id: "comparison",
      title: "Comparison of the approaches",
      blocks: [
        { type: "compare", title: "Four ways to shrink the KV cache", options: [
          { name: "Quantization", summary: "Fewer bits per number.", pros: ["Works on existing models", "Keeps every token", "Simple and supported by major engines (FP8)"], cons: ["Savings capped by bit width (2–4× typical)", "Very low bits (2–3) need careful schemes"], bestFor: "A first, safe step for almost any deployment" },
          { name: "Token eviction", summary: "Keep only some tokens.", pros: ["Large, tunable savings", "Memory stays bounded for endless streams"], cons: ["Information loss is permanent", "Can fail on needle-in-a-haystack questions"], bestFor: "Very long streams where old detail rarely matters" },
          { name: "Head sharing (MQA/GQA)", summary: "Fewer K/V heads.", pros: ["Big savings (4–8× for GQA)", "Also speeds decoding", "Standard in modern models"], cons: ["Must be built into the model (training or up-training)", "MQA can lose some quality"], bestFor: "Choosing or training a model" },
          { name: "Low-rank (e.g. MLA)", summary: "Store a compact latent.", pros: ["Very compact cache", "Strong quality when trained in"], cons: ["Architecture change", "Extra compute to expand latents"], bestFor: "New model designs aiming at long context" }
        ], rows: [
          ["Factor reduced", "bytes per number", "tokens", "kv_heads", "per-token dimension"],
          ["Needs retraining?", "No", "Usually no", "Yes (or up-training)", "Yes, typically"],
          ["Loses whole tokens?", "No", "Yes", "No", "No"]
        ], verdict: "Combine them: pick a GQA or MLA model, add an FP8 or INT8 cache, and use eviction only when context must be unbounded." }
      ]
    },
    {
      id: "when-to-use-which",
      title: "When to use which one",
      blocks: [
        { type: "list", items: [
          "**You serve someone else's model and need memory now:** turn on KV cache quantization (FP8 or INT8). It is the lowest-risk change.",
          "**You are choosing a model:** prefer one with GQA or MLA. You get most of the savings for free.",
          "**You have endless streams** (a voice assistant that never resets, a log monitor): use eviction with attention sinks plus a recent window, and accept that old details fade.",
          "**Your app depends on exact recall from long documents** (contracts, code): avoid aggressive eviction; quantize instead and buy more memory or use paged memory management."
        ] },
        { type: "callout", tone: "example", title: "Our support chatbot", text: "We pick a GQA model (8 KV heads), enable an FP8 KV cache in the serving engine, and skip eviction because customers often ask about details buried deep in their pasted logs. Memory for eight 32k conversations drops from about 125 GiB to about 16 GiB." },
        { type: "callout", tone: "warn", title: "Common mistake", text: "Judging compression by memory saved or by a short benchmark only. Quality losses from eviction and aggressive quantization often show up only on long-context retrieval tasks. Always evaluate on your real long prompts, including questions about the middle and start of the context." },
        { type: "p", text: "When not to bother: for short chats (a few hundred tokens) with few concurrent users, the cache is small compared with the weights. Weight quantization or a smaller model will save more than KV tricks." }
      ]
    },
    {
      id: "worked-example-users-per-gpu",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "So far we asked how big the cache is for a fixed number of users. In practice we ask the reverse question: **how many users fit on the GPU we already have?** Let us work it out by hand for our support chatbot on one GPU with 80 GiB of memory. We turn the size formula around: users = free memory ÷ cache per user." },
        { type: "steps", title: "From GPU memory to a user count", items: [
          { title: "Subtract the weights", text: "The FP16 weights take about 16 GiB. That leaves 80 − 16 = 64 GiB for KV caches. Real servers also keep some spare room for temporary buffers, so treat 64 GiB as an upper limit." },
          { title: "Find the cost of one token", text: "Full multi-head FP16: 2 × 32 × 32 × 128 × 2 bytes = 512 KiB. With GQA (8 KV heads) it is 4 times smaller: 128 KiB. With GQA and a 1-byte cache it is 64 KiB." },
          { title: "Find the cost of one user", text: "Each user holds 32,000 tokens. Full FP16: 512 KiB × 32,000 ≈ 15.6 GiB. GQA: 128 KiB × 32,000 ≈ 3.9 GiB. GQA with 1-byte numbers: ≈ 1.95 GiB." },
          { title: "Divide and round down", text: "64 ÷ 15.6 → 4 users. 64 ÷ 3.9 → 16 users. 64 ÷ 1.95 → 32 users. We always round down: a user whose cache only half fits cannot be served." },
          { title: "Remember the output tokens", text: "The 32,000 tokens must include the answer we are about to write. A 31,500-token prompt with a 500-token reply fills the whole slot by the end of the reply." }
        ] },
        { type: "table", caption: "Users that fit in 64 GiB of free memory at 32,000 tokens each (computed from the size formula)", head: ["Plan", "KV per token", "KV per user", "Users that fit"], rows: [
          ["32 KV heads, FP16", "512 KiB", "≈ 15.6 GiB", "4"],
          ["GQA 8 KV heads, FP16", "128 KiB", "≈ 3.9 GiB", "16"],
          ["GQA 8 KV heads, 1 byte per number", "64 KiB", "≈ 1.95 GiB", "32"]
        ] },
        { type: "p", text: "Two things stand out. First, the user count moves in whole steps of the compression factor: 4, then 16, then 32. Second, the weights are a fixed cost that compression of the cache never touches. If the context were only 2,000 tokens, each GQA user would need about 0.24 GiB, and the 16 GiB of weights would be the larger part of the bill for the first 60 or so users." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a toy KV cache with a fixed row budget and run two eviction policies over the same ten tokens. The model is tiny and made up, so the byte counts are small, but the accounting is the same as in the real formula. Watch which tokens survive, and whether the order number `A17` is still there at the end." },
        { type: "code", lang: "python", title: "practice_kv_eviction.py", code: `# Toy KV cache with a row budget: which tokens survive each eviction policy?
LAYERS, KV_HEADS, HEAD_DIM, BYTES = 4, 2, 8, 2    # a tiny made-up model, FP16
ROW_BYTES = 2 * LAYERS * KV_HEADS * HEAD_DIM * BYTES   # K + V for one token
BUDGET = 6                                         # max tokens we may keep

def sliding_window(cache, budget):
    # keep only the most recent tokens
    return cache[-budget:]

def sinks_plus_window(cache, budget, sinks=2):
    # keep the first few tokens (attention sinks) plus the most recent ones
    if len(cache) <= budget:
        return cache
    return cache[:sinks] + cache[-(budget - sinks):]

tokens = ["<s>", "Order", "A17", "is", "late", "and", "the", "box", "was", "wet"]
print("bytes per cached token:", ROW_BYTES)
for name, policy in [("sliding window", sliding_window),
                     ("sinks + window", sinks_plus_window)]:
    cache = []
    for pos, tok in enumerate(tokens):
        cache.append((pos, tok))           # decode step: append one row
        cache = policy(cache, BUDGET)      # evict if we are over budget
    kept = [tok for _, tok in cache]
    print(f"{name}: kept {kept}")
    print(f"  bytes = {len(cache) * ROW_BYTES}, "
          f"order id still cached: {'A17' in kept}")
print("no eviction: bytes =", len(tokens) * ROW_BYTES)`, output: `bytes per cached token: 256
sliding window: kept ['late', 'and', 'the', 'box', 'was', 'wet']
  bytes = 1536, order id still cached: False
sinks + window: kept ['<s>', 'Order', 'the', 'box', 'was', 'wet']
  bytes = 1536, order id still cached: False
no eviction: bytes = 2560`, walkthrough: [
          { lines: [1, 4], note: "A tiny model shape. One cached token costs 2 × layers × KV heads × head size × bytes = 256 bytes. We may keep at most 6 tokens." },
          { lines: [6, 14], note: "Two policies. The first keeps the newest rows only. The second also protects the first two rows, the attention sinks." },
          { lines: [16, 24], note: "The decode loop: append one row per token, then let the policy trim the cache back to the budget." },
          { lines: [25, 28], note: "Report what survived, the bytes used, and whether the order number is still in the cache." }
        ] },
        { type: "p", text: "Both policies end at the same 1,536 bytes, and both have lost the order number. Now change it:" },
        { type: "list", items: [
          "Set `sinks=3` in `sinks_plus_window`. Predict first: which token is now protected, and which recent token do we lose to pay for it?",
          "Set `BYTES = 1` and `BUDGET = 10` (a 1-byte cache with no eviction). Predict the final byte count and compare it with 1,536. Which plan is smaller here, and which one still holds `A17`?",
          "Add twenty more words to `tokens` and run the original settings. Predict the bytes for each policy and for the no-eviction line. Which of the three numbers keeps growing?"
        ] },
        { type: "check", question: "In the practice run both eviction policies use exactly the same number of bytes. Why can they still give different answers in a real model?", answer: "Bytes measure how much we keep, not what we keep. The two policies hold different rows, so the new query attends over different keys and values. Equal memory does not mean equal information." },
        { type: "check", question: "A 1-byte cache with no eviction beat the 6-row budget on memory for our ten tokens. Why does eviction still win for a stream that never ends?", answer: "A quantized cache is smaller per token but still grows by one row per token forever. A row budget puts a hard cap on the cache, so its size stops growing no matter how long the stream runs. Quantization changes the slope; eviction sets a ceiling." }
      ]
    }
  ],
  quiz: [
    { q: "Why does an LLM keep a KV cache during generation?", options: ["Past tokens' keys and values never change, so storing them avoids recomputing them", "Past tokens' queries are reused by every later token, so storing them saves work", "The cache holds the generated answer so it can be streamed back to the user", "Attention cannot run at all without a cache, including during training"], answer: 0, explain: "In a causal model earlier tokens never see later ones, so their K and V stay the same. Caching them saves recomputation. Past queries are not needed at all." },
    { q: "Using the formula from this lesson, a model has 32 layers, 8 KV heads, head dim 128 and an FP16 cache. About how much KV memory does one token need?", options: ["32 KiB", "64 KiB", "128 KiB", "512 KiB"], answer: 2, explain: "2 × 32 × 8 × 128 × 2 bytes = 131,072 bytes = 128 KiB. 512 KiB would be the 32-KV-head version." },
    { q: "Our chatbot must answer questions about any detail in 100-page contracts. Memory is tight. Which change is the riskiest for answer quality?", options: ["Switching the KV cache from FP16 to FP8", "Using a model with grouped-query attention", "Evicting all but the most recent 2,000 tokens", "Running fewer conversations on the GPU at once"], answer: 2, explain: "Eviction permanently drops tokens, so details from earlier pages become unrecoverable. FP8 and GQA keep information about every token." },
    { q: "Which pairing of approach and the factor it reduces is correct?", options: ["Quantization reduces the number of tokens", "GQA reduces the number of KV heads", "Eviction reduces bytes per number", "Low-rank compression reduces the number of layers"], answer: 1, explain: "GQA lets groups of query heads share one K/V head, so kv_heads drops. Quantization cuts bytes per number, eviction cuts tokens, low-rank cuts the stored dimension per token." },
    { q: "A teammate says: “KV cache compression only saves memory; it never makes generation faster.” What is the best response?", options: ["Correct: dequantizing a compressed cache adds work, so decoding gets slower", "Correct: decode speed depends on parameter count, not on the size of the cache", "Wrong: a compressed cache lets the model skip some layers during each step", "Wrong: each step reads the whole cache from memory, so a smaller one can be faster"], answer: 3, explain: "Decoding is often limited by memory traffic. Reading fewer cache bytes per step reduces that traffic, and fitting more users raises throughput. Compression does not skip layers." }
  ],
  takeaways: [
    "LLMs generate one token at a time and cache each past token's keys and values to avoid recomputing them.",
    "KV cache size = 2 × layers × kv_heads × head_dim × bytes × tokens × batch, so it grows linearly with context and users.",
    "For long contexts the KV cache, not the weights, is usually what limits memory and decode speed.",
    "Quantization, eviction, head sharing and low-rank compression each shrink a different factor, and they stack.",
    "Eviction is the only one that throws information away; test it on your real long-context questions."
  ],
  terms: [
    { term: "Autoregressive generation", def: "Producing text one token at a time, each token conditioned on all previous ones." },
    { term: "KV cache", def: "Stored key and value vectors of all processed tokens, for every layer and head, reused at each decoding step." },
    { term: "Attention head", def: "One of several parallel attention computations in a layer, each with its own query, key and value projections." },
    { term: "Quantization", def: "Representing numbers with fewer bits plus a scale, trading a little accuracy for memory." },
    { term: "Token eviction", def: "Dropping cached keys and values of selected tokens to keep the cache within a budget." },
    { term: "Grouped-query attention (GQA)", def: "An attention design where groups of query heads share a single key/value head." },
    { term: "Multi-head Latent Attention (MLA)", def: "A low-rank attention design that caches a compact latent vector per token and expands it into keys and values." }
  ]
};
