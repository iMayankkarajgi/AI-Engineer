export default {
  id: "kv-cache-in-llms",
  minutes: 25,
  hook: "If an LLM re-read its entire conversation before writing every single word, how slow would it be, and how does it avoid that?",
  summary: "When an LLM generates text one token at a time, the keys and values of earlier tokens never change, so recomputing them at every step wastes enormous work. The KV cache stores them once and reuses them, turning quadratic recomputation into linear work per step. The price is memory: the cache grows with every token, layer and user, which is why so much of inference engineering is about managing it.",
  sections: [
    {
      id: "how-llms-generate",
      title: "How LLMs generate text",
      blocks: [
        { type: "p", text: "An LLM is a next-token predictor. Given a sequence of **tokens** (pieces of text), it outputs a probability for every token in its vocabulary. We pick one (the most likely, or a random sample), append it to the sequence and ask again. This one-token-at-a-time loop is called **autoregressive generation**." },
        { type: "p", text: "Our running example is a **support chatbot**. The prompt is “Where is my order” and the bot replies “Your order ships today”. To produce those 4 reply tokens, the model runs 4 times, and each run sees everything before it: the prompt plus the reply so far." },
        { type: "callout", tone: "analogy", title: "Think of it like a meeting note-taker", text: "Before saying anything, a careful assistant reviews what everyone said. A forgetful one re-listens to the whole recording before each sentence. A smart one keeps a summary card per remark and just adds one new card each time someone speaks. The KV cache is the stack of cards." }
      ]
    },
    {
      id: "inside-the-model",
      title: "What happens inside the model",
      blocks: [
        { type: "p", text: "Each token first becomes a vector (an **embedding**). The vectors then pass through a stack of identical **Transformer layers**; a 7B-class model has about 32. Each layer has two parts: **attention**, where tokens gather information from earlier tokens, and a **feed-forward network**, which processes each token on its own." },
        { type: "p", text: "In attention, each token's vector is multiplied by three learned matrices to make three new vectors:" },
        { type: "list", items: [
          "**Query (q)**: what this token is looking for in earlier tokens.",
          "**Key (k)**: what this token can be matched on.",
          "**Value (v)**: the information this token hands over when it is attended to."
        ] },
        { type: "formula", expr: "output = softmax(q · Kᵀ / √d) · V", where: [["q", "query of the current token (a vector)"], ["K", "matrix whose rows are the keys of all tokens so far"], ["V", "matrix whose rows are the values of all tokens so far"], ["d", "vector size (head dimension)"]], caption: "The current token scores every earlier key, normalises the scores and mixes the matching values." },
        { type: "p", text: "In a **causal** (decoder-only) model, a token can only attend to itself and earlier tokens, never later ones. That rule, enforced by the **causal mask**, is what makes caching possible, as we will see." },
        { type: "viz", name: "causal-mask", caption: "Watch the score matrix fill row by row while the upper triangle (future tokens) is masked out. Each row only depends on columns to its left." }
      ]
    },
    {
      id: "repeated-computation",
      title: "The problem: repeated computation",
      blocks: [
        { type: "p", text: "Without any cache, each generation step feeds the *whole* sequence back in. Step 1 processes the 4 prompt tokens. Step 2 processes 5 tokens, step 3 processes 6, and so on. In every step, each layer recomputes keys and values for tokens whose keys and values it already computed in the previous step." },
        { type: "p", text: "Why are they the same? A token's key and value in layer 1 depend only on that token's embedding. In layer 2 they depend on that token's layer-1 output, which (because of the causal mask) depends only on that token and earlier ones. Adding a new token at the end changes nothing about earlier positions. So the recomputation produces byte-for-byte identical numbers." },
        { type: "matrix", title: "Which key/value rows get computed at each step without a cache (1 = computed, blank = not needed yet)", rows: ["Step 1", "Step 2", "Step 3", "Step 4"], cols: ["Where", "is", "my", "order", "Your", "order", "ships"], values: [[1, 1, 1, 1, null, null, null], [1, 1, 1, 1, 1, null, null], [1, 1, 1, 1, 1, 1, null], [1, 1, 1, 1, 1, 1, 1]], format: "int", caption: "Every row repeats all the work of the row above it. With a cache, only the right-most new cell in each row would be computed." },
        { type: "p", text: "For a sequence that ends up with n tokens, the no-cache approach computes roughly 1 + 2 + … + n ≈ n²/2 key/value rows per layer. For 1,000 tokens that is about half a million rows instead of one thousand." }
      ]
    },
    {
      id: "the-solution",
      title: "The solution: the KV cache",
      blocks: [
        { type: "p", text: "The **KV cache** stores the key and value vectors of every processed token, separately for each layer and each attention head. Generation now has two phases:" },
        { type: "steps", title: "Generation with a KV cache", items: [
          { title: "Prefill the prompt", text: "Run all prompt tokens through the model in one pass. Save every layer's keys and values in the cache. Predict the first reply token." },
          { title: "Feed only the new token", text: "The next step's input is just the one new token, not the whole sequence." },
          { title: "Compute its q, k, v", text: "In each layer, project the new token to its query, key and value." },
          { title: "Append k and v", text: "Add the new key and value as one extra row in that layer's cache." },
          { title: "Attend over the cache", text: "The new query is scored against all cached keys and mixes all cached values. Then the feed-forward runs for this one token only." },
          { title: "Repeat", text: "Pick the next token and go back to step 2 until the reply ends." }
        ] },
        { type: "viz", name: "kv-cache", caption: "Step through decoding and watch one key row and one value row being appended per token; use the calculator to see how big the cache gets." },
        { type: "p", text: "The code below proves the claim on a tiny single-head attention layer: computing outputs with and without a cache gives the same numbers, while the cached version does far less key/value work." },
        { type: "code", lang: "python", title: "kv_cache_demo.py", code: `import numpy as np
rng = np.random.default_rng(0)
d, steps = 8, 6                                  # tiny head size, 6 tokens
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
X = rng.normal(size=(steps, d))                  # token vectors entering the layer

def attend(q, K, V):
    s = K @ q / np.sqrt(d)                       # one score per past token
    w = np.exp(s - s.max()); w /= w.sum()        # softmax
    return w @ V                                 # weighted mix of values

# No cache: at every step recompute K and V for the whole prefix.
out_nc, proj_nc = [], 0
for t in range(steps):
    K, V = X[:t+1] @ Wk, X[:t+1] @ Wv
    proj_nc += 2 * (t + 1)                       # K and V rows computed
    out_nc.append(attend(X[t] @ Wq, K, V))

# With cache: compute K and V only for the newest token, append.
K_cache, V_cache, out_c, proj_c = [], [], [], 0
for t in range(steps):
    K_cache.append(X[t] @ Wk); V_cache.append(X[t] @ Wv); proj_c += 2
    out_c.append(attend(X[t] @ Wq, np.array(K_cache), np.array(V_cache)))

print("same outputs:", np.allclose(out_nc, out_c))
print("K/V projections without cache:", proj_nc)
print("K/V projections with cache:   ", proj_c)
for n in [100, 1000]:
    print(f"n={n}: no cache {n*(n+1)} vs cache {2*n} projections")`, output: `same outputs: True
K/V projections without cache: 42
K/V projections with cache:    12
n=100: no cache 10100 vs cache 200 projections
n=1000: no cache 1001000 vs cache 2000 projections`, walkthrough: [
          { lines: [1, 5], note: "A tiny attention head: random projection matrices and 6 token vectors standing in for the input to one layer." },
          { lines: [7, 10], note: "Standard attention for one query: scores against all keys, softmax, weighted sum of values." },
          { lines: [12, 17], note: "No cache: every step rebuilds K and V for the entire prefix, so work grows 2, 4, 6, … rows." },
          { lines: [19, 23], note: "With cache: each step projects only the newest token and appends it. Exactly 2 rows of work per step." },
          { lines: [25, 29], note: "Check that outputs match, and extrapolate the projection counts to longer sequences." }
        ] },
        { type: "check", question: "In the no-cache loop, what else is being wasted besides the key/value projections?", answer: "In a full model, the whole forward pass for all earlier tokens: their queries, attention and feed-forward computations in every layer. Only the last position's output is used to pick the next token, so all of that is thrown away each step." }
      ]
    },
    {
      id: "why-not-query",
      title: "Why only keys and values are cached, not queries",
      blocks: [
        { type: "p", text: "A natural question: if we cache K and V, why not Q too? Look at who uses what in one decoding step." },
        { type: "list", items: [
          "The **new token's query** is compared with every key. It is needed only in this step, by this token.",
          "The **keys and values of all earlier tokens** are needed in this step *and every future step*, because every future token may attend to them.",
          "Earlier tokens' **queries** are never used again: their outputs were already computed, and causal masking means they never need to look at the new token."
        ] },
        { type: "callout", tone: "tip", title: "One-line rule", text: "Queries are consumed once by the token that asks; keys and values are reused by every token that comes after. Only reusable things are worth caching." },
        { type: "check", question: "Pause and think: would caching still be exact in a model where every token can attend to every other token, including future ones (bidirectional attention, like BERT)?", answer: "No. Adding a new token would change what earlier tokens attend to, so their representations and therefore later layers' keys and values would change. The KV cache relies on the causal mask." }
      ]
    },
    {
      id: "how-much-faster",
      title: "How much faster does it get?",
      blocks: [
        { type: "p", text: "Count the work for generating a reply when the sequence ends at n tokens. Without a cache, step t processes all t tokens through every layer, so total work grows roughly with n². With a cache, step t processes one token through the projections and feed-forward layers, plus attention over t cached entries." },
        { type: "chart", kind: "line", title: "Key/value rows computed per layer in total (from the formula in the code)", xLabel: "Sequence length n", yLabel: "Rows computed (thousands)", series: [{ name: "No cache ≈ n(n+1)", points: [[100, 10.1], [250, 62.75], [500, 250.5], [750, 563.25], [1000, 1001]] }, { name: "With cache = 2n", points: [[100, 0.2], [250, 0.5], [500, 1], [750, 1.5], [1000, 2]] }], caption: "Counts of K and V row projections, exactly as in the script. The gap widens quadratically." },
        { type: "p", text: "Attention itself still grows: step t's query must read t cached keys and values, so total attention work is still about n²/2 dot products. But the expensive projections and feed-forward computations, which dominate FLOPs in big models, drop from quadratic to linear. In practice, generation without a KV cache becomes unusably slow beyond short sequences, and every production inference engine uses one." },
        { type: "callout", tone: "note", title: "Speed is now limited by memory reads", text: "With the cache, each decode step does little math but must read all the model weights plus the whole cache from GPU memory. That is why decode is called memory-bound, and why the cache's size matters for speed, not just capacity." }
      ]
    },
    {
      id: "speed-vs-memory",
      title: "The trade-off: speed vs memory",
      blocks: [
        { type: "formula", expr: "KV bytes per token = 2 × layers × kv_heads × head_dim × bytes_per_number", where: [["2", "key and value"], ["kv_heads", "number of key/value heads"], ["bytes_per_number", "2 for FP16"]], caption: "Multiply by tokens and by the number of concurrent sequences for the total." },
        { type: "p", text: "For a model with 32 layers, 32 KV heads of size 128 in FP16: 2 × 32 × 32 × 128 × 2 = 524,288 bytes, **512 KiB per token**. A 4,000-token conversation needs 2 GiB; 32 such conversations need 64 GiB. For long contexts and many users, the cache can exceed the size of the model weights." },
        { type: "compare", title: "Generation without vs with a KV cache", options: [
          { name: "No cache", summary: "Recompute everything every step.", pros: ["No extra memory", "Simplest to implement"], cons: ["Work grows quadratically", "Unusably slow for long outputs"], bestFor: "Toy demos or very short outputs" },
          { name: "KV cache", summary: "Store keys and values once, reuse forever.", pros: ["Linear work per step for projections and feed-forward", "Same exact outputs"], cons: ["Memory grows with tokens × layers × heads × users", "Limits batch size and context length"], bestFor: "Every real LLM deployment" }
        ], rows: [["Output quality", "Identical", "Identical"], ["Memory", "Small", "Large and growing"], ["Per-step cost", "Grows with whole sequence", "Small, mostly reading memory"]], verdict: "Always use the cache, then manage its memory with the techniques in the following lessons." },
        { type: "list", items: [
          "**Shrink it:** grouped-query attention (fewer KV heads), KV quantization, eviction (lesson on KV cache compression).",
          "**Store it without waste:** paged memory blocks (PagedAttention).",
          "**Share it:** reuse the cache of a common system prompt across requests (prefix caching)."
        ] },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Thinking the KV cache changes the model's answers (it does not; it is an exact optimisation). Forgetting the cache when estimating GPU memory: teams size a GPU for the weights only and then hit out-of-memory errors under real traffic. And assuming the cache only holds the prompt: it grows with every generated token too." }
      ]
    },
    {
      id: "reusing-the-cache-across-turns",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "So far the cache lived for one reply. A chat has many turns, and each new turn sends the whole history again. Do we have to prefill all of it each time? No. The cache rows for a token stay valid as long as **every token before it is unchanged**. So we can keep the cache between turns and compute only what is new." },
        { type: "steps", title: "Two turns of our support chat", items: [
          { title: "Turn 1", text: "Prompt “Where is my order” (4 tokens) plus reply “Your order ships today” (4 tokens). The cache ends with 8 rows per layer." },
          { title: "Turn 2 arrives", text: "The customer adds “Can I change the address” (5 tokens). The full sequence is now 13 tokens, and its first 8 tokens are exactly the ones we cached." },
          { title: "Reuse the shared prefix", text: "We keep the 8 cached rows and prefill only the 5 new tokens. Without reuse we would compute 13 rows; with reuse, 5." },
          { title: "What if the history is edited?", text: "Suppose the app rewrites the third token of the history. Rows 1 and 2 are still valid. Every row from the third onward is stale, even though tokens 4 to 13 look the same, so we recompute 11 rows." },
          { title: "Why later rows go stale", text: "Above the first layer, a token's key and value are built from its hidden state, and that state has already mixed in information from all earlier tokens. Change one early token and every later hidden state changes." }
        ] },
        { type: "table", caption: "Cache bugs: what we see and where to look", head: ["What we see", "Likely cause", "How to check"], rows: [
          ["Answers differ from a run with the cache turned off", "Stale rows kept after the earlier text changed", "Compare the cached token ids with the new sequence, position by position"],
          ["Replies repeat or drift after the first turn", "The whole history was fed in again on top of an existing cache, so rows are duplicated", "Cache rows should equal tokens processed, never more"],
          ["Every turn is as slow as a fresh prompt", "Something at the very start changes each turn, such as a timestamp in the system prompt", "Find the first position where two turns differ"],
          ["Memory grows although chats have ended", "Caches of finished chats are never freed", "Count cached rows against rows owned by live chats"]
        ] },
        { type: "p", text: "The rule behind all four rows is the same: a cache is tied to one exact sequence of tokens. Because a cache is exact, the first row gives us a simple test for any cache code we write: run the same input with and without the cache and compare the outputs, as `kv_cache_demo.py` did." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a toy cache that lives across chat turns. It does not run a model. It only tracks which token ids have rows in the cache, reuses the longest shared prefix, and counts rows computed and bytes held. The model shape is tiny and made up: one cached token costs 1,024 bytes." },
        { type: "code", lang: "python", title: "practice_prefix_reuse.py", code: `# A toy KV cache that survives across chat turns.
# We reuse rows for the longest shared prefix and compute only the rest.
LAYERS, KV_HEADS, HEAD_DIM, BYTES = 4, 4, 16, 2       # tiny made-up model, FP16
ROW_BYTES = 2 * LAYERS * KV_HEADS * HEAD_DIM * BYTES   # K + V for one token

def common_prefix(a, b):
    n = 0
    while n < min(len(a), len(b)) and a[n] == b[n]:
        n += 1
    return n

cached = []             # token ids whose K/V rows are currently in the cache
total_computed = 0

def run_turn(name, tokens):
    global cached, total_computed
    keep = common_prefix(cached, tokens)     # rows that are still valid
    new = len(tokens) - keep                 # rows we must compute now
    cached = list(tokens)                    # drop stale rows, append new ones
    total_computed += new
    print(f"{name:22s} tokens={len(tokens):2d} reused={keep:2d} "
          f"computed={new:2d} cache={len(cached) * ROW_BYTES} bytes")

turn1 = [1, 7, 7, 3, 9, 4, 2, 8]                    # prompt + reply, 8 tokens
turn2 = turn1 + [5, 6, 3, 1, 2]                     # same history + new message
edited = [1, 7, 0, 3, 9, 4, 2, 8, 5, 6, 3, 1, 2]    # the third token was changed
run_turn("turn 1", turn1)
run_turn("turn 2 (appended)", turn2)
run_turn("turn 2 (edited early)", edited)
print("rows computed in total:", total_computed, "| without any reuse:", 8 + 13 + 13)`, output: `turn 1                 tokens= 8 reused= 0 computed= 8 cache=8192 bytes
turn 2 (appended)      tokens=13 reused= 8 computed= 5 cache=13312 bytes
turn 2 (edited early)  tokens=13 reused= 2 computed=11 cache=13312 bytes
rows computed in total: 24 | without any reuse: 34`, walkthrough: [
          { lines: [1, 4], note: "A tiny model shape. The bytes per cached token follow the same formula as the lesson: 2 × layers × KV heads × head size × bytes." },
          { lines: [6, 10], note: "Count how many leading tokens two sequences share. Only that part of the cache can be reused." },
          { lines: [15, 22], note: "One turn: keep the valid prefix rows, compute the rest, and report the cache size." },
          { lines: [24, 30], note: "Three turns: a fresh chat, a follow-up that only appends, and a follow-up where an early token was changed." }
        ] },
        { type: "p", text: "Appending reused all 8 rows and computed 5. Changing one early token left only 2 reusable rows and forced 11 new ones. Now change it:" },
        { type: "list", items: [
          "Change the edit so that the *last* token of `edited` differs instead of the third. Predict the reused and computed counts before you run it.",
          "Model a chat app that drops the oldest message when the context is full: call `run_turn` with `turn2[4:]`. Predict how many rows can be reused.",
          "Set `KV_HEADS = 1` (as in multi-query attention). Predict the new bytes per token and the cache size after turn 2. Do the reused and computed counts change?"
        ] },
        { type: "check", question: "In the edited turn, tokens 4 to 13 have the same ids as before. Why can we not keep their cached rows?", answer: "Their rows above the first layer were computed from hidden states that had already attended to the old third token. With a different third token those hidden states, and so their keys and values, would be different numbers. Same token id does not mean same key and value; the whole prefix must match." },
        { type: "check", question: "A chat app trims old messages from the front of the history to stay under the context limit. What does that do to cache reuse, and what is a cheaper place to trim?", answer: "Trimming from the front changes the very first tokens, so the shared prefix drops to zero and the whole remaining history must be prefilled again. Reuse survives only up to the first changed position. Keeping a fixed start (for example the system prompt) and trimming rarely, in large steps, means most turns still only append." }
      ]
    }
  ],
  quiz: [
    { q: "Why can keys and values of earlier tokens be cached safely in a decoder-only LLM?", options: ["The causal mask means later tokens never change earlier tokens' keys and values", "Keys and values are random projections, so small errors in them do not matter", "Attention is computed once per conversation, so its inputs can be reused", "Only the first layer uses attention, so the later layers need no keys or values"], answer: 0, explain: "Earlier tokens never attend to later ones, so their representations, and thus their keys and values in every layer, stay the same as text is added." },
    { q: "Why is the query of past tokens not cached?", options: ["Queries are much larger than keys and values, so storing them would not fit", "Past queries are recomputed cheaply from the cached keys and values", "A past token's query is never used again; each step needs only the newest query", "Every token has the same query vector, so one stored copy is enough"], answer: 2, explain: "Each query is used once, by its own token, to attend over keys. Keys and values, by contrast, are read by every later token." },
    { q: "Using the lesson's formula, a model has 32 layers, 8 KV heads, head dim 128, FP16. How much KV cache does a 1,000-token conversation need?", options: ["About 125 MiB", "About 500 MiB", "About 16 MiB", "About 2 GiB"], answer: 0, explain: "Per token: 2 × 32 × 8 × 128 × 2 = 131,072 bytes = 128 KiB. Times 1,000 tokens ≈ 125 MiB." },
    { q: "Our chatbot runs fine in testing but runs out of GPU memory when 50 users chat at once with long histories. What is the most likely cause?", options: ["The model weights grow with each user", "The KV cache grows with tokens and users and was not budgeted for", "The tokenizer leaks memory", "The softmax needs more memory for long outputs only during training"], answer: 1, explain: "Weights are shared and fixed. Each user's cache grows with their context length, so total cache memory scales with users × tokens." },
    { q: "Which statement correctly compares generation with and without a KV cache?", options: ["The cache makes answers slightly less accurate in exchange for speed", "Without a cache the model needs more memory but computes less", "With a cache, attention cost stops depending on the length of the sequence so far", "Both give identical outputs; the cache trades memory for less recomputation"], answer: 3, explain: "The cache is exact. It costs memory and saves recomputation. Attention still reads every cached entry, so it still grows with length." }
  ],
  takeaways: [
    "LLMs generate one token at a time, and each step needs the keys and values of all earlier tokens.",
    "Because of causal masking, earlier tokens' keys and values never change, so recomputing them is pure waste.",
    "The KV cache stores them once per layer and head; each step computes only the new token's q, k and v.",
    "Queries are not cached because each is used only once, by its own token.",
    "The cache gives identical outputs and huge savings, but its memory grows with tokens, layers, heads and users."
  ],
  terms: [
    { term: "Autoregressive generation", def: "Generating text one token at a time, each conditioned on everything before it." },
    { term: "Query, key, value", def: "Three vectors per token in attention: what it seeks, what it can be matched on, and what it passes on." },
    { term: "Causal mask", def: "The rule that a token may attend only to itself and earlier tokens." },
    { term: "KV cache", def: "Stored keys and values of past tokens for every layer and head, reused at each generation step." },
    { term: "Prefill", def: "Processing all prompt tokens in one pass to fill the KV cache before generation starts." },
    { term: "Decode step", def: "One forward pass that processes a single new token using the cache." }
  ]
};
