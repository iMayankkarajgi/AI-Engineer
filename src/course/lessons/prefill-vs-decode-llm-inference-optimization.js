export default {
  id: "prefill-vs-decode-llm-inference-optimization",
  minutes: 27,
  hook: "Why can a GPU read your 4,000-token prompt in a fraction of a second, yet take several seconds to write a 300-token answer?",
  summary: "Every LLM request runs in two phases. Prefill processes the whole prompt in one parallel pass and builds the KV cache; it is limited by raw compute. Decode then produces one token per step, reading all the weights and the cache each time; it is limited by memory bandwidth. Because the phases stress different hardware limits, they have different metrics (TTFT vs TPOT) and different optimizations.",
  sections: [
    {
      id: "what-is-inference",
      title: "What LLM inference is",
      blocks: [
        { type: "p", text: "**Inference** is running a trained model to get an answer. For an LLM, a request arrives with a **prompt** (the system instructions, chat history and user message, all turned into tokens), and the model returns generated tokens until it emits an end-of-sequence token or hits a length limit." },
        { type: "p", text: "Our running example is a **support chatbot**. A customer pastes a 2,000-token error log and asks “Why did my upload fail?”. The bot answers in about 200 tokens. Behind that single exchange there are two very different kinds of work, and serving systems treat them separately." },
        { type: "callout", tone: "analogy", title: "Think of it like a student in an exam", text: "First the student reads the whole question paper. Reading is fast because the eyes take in many words at once. Then they write the answer one word at a time, and before each word they glance at their notes. Reading the paper is prefill; writing word by word is decode; the notes are the KV cache." }
      ]
    },
    {
      id: "two-phases",
      title: "The two phases: prefill and decode",
      blocks: [
        { type: "p", text: "**Prefill** (also called the prompt phase) takes all prompt tokens at once and runs them through every layer in a single forward pass. Because the model already knows every prompt token, it can compute all of them in parallel, using a causal mask so each token only attends to earlier ones. Prefill produces two things: the KV cache for every prompt token, and the probabilities for the very first output token." },
        { type: "p", text: "**Decode** (also called the generation phase) produces the rest of the answer. Each decode step feeds in just one new token, the one picked in the previous step, computes its query, key and value in every layer, appends the key and value to the cache, attends over the whole cache and predicts the next token. Decode cannot be parallelised across output tokens within one request, because token 5 depends on what token 4 turned out to be." },
        { type: "flow", title: "Prefill builds the cache, decode reuses and extends it", nodes: [
          { label: "Prompt (2,000 tokens)", detail: "System prompt, chat history and the pasted log, tokenised." },
          { label: "Prefill pass", detail: "All 2,000 tokens go through every layer in parallel as large matrix-matrix multiplications." },
          { label: "KV cache", detail: "Keys and values for all 2,000 tokens, for every layer, stored in GPU memory." },
          { label: "First token", detail: "Prefill's last position gives the probabilities for output token 1. Its arrival time is the TTFT." },
          { label: "Decode step", detail: "One new token goes in, its K and V are appended, attention reads the whole cache, one token comes out." },
          { label: "Repeat until done", detail: "Each step adds one token and one cache row. 200 output tokens means about 200 decode steps." }
        ] },
        { type: "p", text: "The KV cache is the **bridge** between the two phases. Prefill writes it, decode reads it at every step and appends to it. Without the cache, every decode step would have to redo the prefill work for the entire text so far." }
      ]
    },
    {
      id: "decode-walkthrough",
      title: "A few decode steps, slowly",
      blocks: [
        { type: "p", text: "Let us shrink the example. The prompt is the 4 tokens “Why did upload fail”. Prefill processes all 4 and the cache now holds 4 rows per layer." },
        { type: "steps", title: "Decode, step by step", items: [
          { title: "After prefill", text: "Cache: 4 rows. The last prompt position predicts output token 1, say “The”. Time so far is the TTFT." },
          { title: "Decode step 1", text: "Input: “The”. Compute its Q, K, V in each layer; append K and V (cache: 5 rows). Its query attends over 5 keys. Output: “file”." },
          { title: "Decode step 2", text: "Input: “file”. Append (cache: 6 rows). Attend over 6 keys. Output: “was”." },
          { title: "Decode step 3", text: "Input: “was”. Append (cache: 7 rows). Attend over 7 keys. Output: “too”." },
          { title: "And so on", text: "Each step does a small amount of math for one token but must read all model weights plus a cache that keeps growing." }
        ] },
        { type: "viz", name: "kv-cache", caption: "Step through decoding: one key row and one value row are appended per token while the query attends over everything cached so far." },
        { type: "check", question: "Pause and predict: in decode step 50 of our real example (2,000-token prompt), how many cached rows does each layer's attention read?", answer: "About 2,050: the 2,000 prompt rows plus the 50 generated tokens (the newest one included). The cache read grows by one row every step." }
      ]
    },
    {
      id: "comparison-table",
      title: "Prefill vs decode side by side",
      blocks: [
        { type: "compare", title: "Two phases of one request", options: [
          { name: "Prefill", summary: "Reads the whole prompt in one parallel pass.", pros: ["Huge parallelism: many tokens per pass", "Keeps GPU math units busy"], cons: ["Cost grows with prompt length (and attention grows quadratically)", "Long prompts delay the first token"], bestFor: "Measured by time to first token (TTFT)" },
          { name: "Decode", summary: "Writes one token per step, reusing the cache.", pros: ["Little math per step", "Cache makes each step cheap in FLOPs"], cons: ["Must read all weights and the cache every step", "Sequential: cannot parallelise within one request"], bestFor: "Measured by time per output token (TPOT)" }
        ], rows: [
          ["Tokens per forward pass", "All prompt tokens (e.g. 2,000)", "1 per request"],
          ["Main math", "Matrix × matrix", "Matrix × vector (per request)"],
          ["Bottleneck", "Compute (FLOPs)", "Memory bandwidth (bytes moved)"],
          ["KV cache role", "Writes it", "Reads all of it, appends one row"],
          ["Number of passes", "1 (or a few chunks)", "One per output token"]
        ], verdict: "Same model, same weights, but two different workloads. Good serving systems schedule and tune them separately." }
      ]
    },
    {
      id: "compute-vs-memory",
      title: "Why the split matters: compute-bound vs memory-bound",
      blocks: [
        { type: "p", text: "A GPU has two key limits. **Compute throughput** is how many floating-point operations (FLOPs) per second it can do. **Memory bandwidth** is how many bytes per second it can move from its main memory (HBM) to its compute units. An NVIDIA H100 SXM is rated around 989 teraFLOPs of dense BF16 math and about 3.35 terabytes per second of bandwidth." },
        { type: "p", text: "**Arithmetic intensity** is the number of FLOPs we do per byte we move. If it is high, the math units are the bottleneck: the work is **compute-bound**. If it is low, the math units sit idle waiting for data: the work is **memory-bound**. The crossover, called the **ridge point**, is peak FLOPs divided by bandwidth: about 989e12 / 3.35e12 ≈ 295 FLOPs per byte for the H100." },
        { type: "formula", expr: "arithmetic intensity ≈ (2 × params × tokens) / (2 bytes × params) = tokens", where: [["2 × params × tokens", "approximate FLOPs of one forward pass over the weights"], ["2 bytes × params", "bytes of FP16 weights read once per pass"], ["tokens", "how many tokens share that one read of the weights"]], caption: "A simplification that ignores attention and the KV cache, but captures the main effect." },
        { type: "p", text: "So intensity is roughly the number of tokens processed per pass. A prefill of 2,000 tokens has intensity near 2,000, far above 295: compute-bound. A decode step for one user has intensity near 1: badly memory-bound. The GPU spends almost all of that step just streaming 16 GB of weights through its memory system." },
        { type: "code", lang: "python", title: "roofline.py", code: `# Is a step compute-bound or memory-bound? A back-of-envelope roofline.
params = 8e9                 # 8B-parameter model, FP16 weights
weight_bytes = params * 2    # 16 GB read from GPU memory per forward pass
peak_flops = 989e12          # approx. H100 SXM dense BF16 peak
mem_bw = 3.35e12             # approx. H100 SXM HBM bandwidth, bytes/s
ridge = peak_flops / mem_bw  # FLOPs per byte needed to be compute-bound

def step_time(tokens):
    flops = 2 * params * tokens            # ~2 FLOPs per weight per token
    t_compute = flops / peak_flops
    t_memory = weight_bytes / mem_bw       # weights are read once per pass
    intensity = flops / weight_bytes       # FLOPs per byte moved
    bound = "compute" if t_compute > t_memory else "memory"
    return max(t_compute, t_memory), intensity, bound

print(f"ridge point: {ridge:.0f} FLOPs/byte")
for label, n in [("decode, 1 user", 1), ("decode, 32 users", 32),
                 ("prefill, 512-token prompt", 512),
                 ("prefill, 4096-token prompt", 4096)]:
    t, ai, bound = step_time(n)
    print(f"{label:27s} tokens={n:5d} intensity={ai:6.0f} "
          f"time={t*1e3:7.2f} ms  {bound}-bound  "
          f"({t*1e3/n:.3f} ms/token)")`, output: `ridge point: 295 FLOPs/byte
decode, 1 user              tokens=    1 intensity=     1 time=   4.78 ms  memory-bound  (4.776 ms/token)
decode, 32 users            tokens=   32 intensity=    32 time=   4.78 ms  memory-bound  (0.149 ms/token)
prefill, 512-token prompt   tokens=  512 intensity=   512 time=   8.28 ms  compute-bound  (0.016 ms/token)
prefill, 4096-token prompt  tokens= 4096 intensity=  4096 time=  66.26 ms  compute-bound  (0.016 ms/token)`, walkthrough: [
          { lines: [1, 6], note: "Model and hardware numbers. The ridge point says how many FLOPs per byte we need before compute, not memory, becomes the limit." },
          { lines: [8, 14], note: "A pass takes whichever is longer: doing the math or reading the weights. Real kernels never hit peak, so these are lower bounds." },
          { lines: [16, 22], note: "Compare decode for 1 and 32 users with prefill for two prompt sizes, and report time per token." }
        ] },
        { type: "p", text: "Look at the decode lines. One user and 32 users take the same 4.78 ms per step, because the step is dominated by reading the weights, and the weights are read once no matter how many users share the pass. That is why **batching** is the main tool for decode throughput. Prefill, by contrast, costs about 0.016 ms per token regardless of prompt size: it is already saturating the math units." },
        { type: "chart", kind: "bar", title: "Ideal time per token on the roofline model (8B FP16, H100-class GPU)", yLabel: "ms per token", unit: " ms", labels: ["Decode ×1", "Decode ×32", "Prefill 512", "Prefill 4096"], series: [{ name: "ms per token", values: [4.776, 0.149, 0.016, 0.016] }], caption: "From the script above. Idealised: ignores attention FLOPs, KV cache reads and kernel inefficiency, so real numbers are higher." },
        { type: "callout", tone: "note", title: "The KV cache adds memory traffic too", text: "Our simple model only counts weight reads. In real decode, each step also reads the request's entire KV cache. With long contexts and big batches, cache reads can rival or exceed weight reads, which is why KV cache compression and GQA speed up decode." }
      ]
    },
    {
      id: "metrics",
      title: "The key metrics: TTFT, TPOT, throughput, latency",
      blocks: [
        { type: "table", head: ["Metric", "What it measures", "Mostly set by", "Our chatbot target (illustrative)"], rows: [
          ["TTFT (time to first token)", "From request arrival to the first output token", "Queueing + prefill", "Under 1 s"],
          ["TPOT (time per output token), also ITL (inter-token latency)", "Average gap between consecutive output tokens", "Decode step time", "Under 50 ms (faster than reading speed)"],
          ["End-to-end latency", "Arrival to last token", "TTFT + TPOT × (output tokens − 1)", "Under 12 s for 200 tokens"],
          ["Throughput", "Tokens (or requests) per second across all users", "Batch size and GPU utilisation", "As high as possible within the latency targets"]
        ] },
        { type: "formula", expr: "end-to-end latency ≈ TTFT + TPOT × (N − 1)", where: [["N", "number of output tokens"]], caption: "Example: TTFT 0.4 s, TPOT 40 ms, 200 tokens → 0.4 + 0.04 × 199 ≈ 8.4 s." },
        { type: "viz", name: "streaming", caption: "Compare a blocking response with a streamed one: streaming exposes the TTFT and then the steady TPOT rhythm." },
        { type: "p", text: "There is a built-in tension. Bigger decode batches raise throughput (more tokens per weight read) but each step gets a bit slower, so TPOT rises. Long prefills in the same batch can delay everyone's next token. Serving is about meeting latency targets, often called **SLOs** (service-level objectives), while keeping throughput high." },
        { type: "check", question: "Users complain the bot “takes ages to start answering” on long pasted logs, but once it starts, text flows smoothly. Which phase and metric should we look at?", answer: "Prefill and TTFT. A long prompt means a long prefill (plus any queueing) before the first token. Decode, and therefore TPOT, is fine." }
      ]
    },
    {
      id: "optimizations-by-phase",
      title: "Optimization techniques mapped to each phase",
      blocks: [
        { type: "compare", title: "What helps which phase", options: [
          { name: "Prefill (compute-bound)", summary: "Do less math or do it faster.", pros: ["Prefix / prompt caching: reuse KV of a shared system prompt", "Efficient attention kernels such as FlashAttention", "Chunked prefill: split long prompts so they interleave with decode", "Lower-precision math (FP8) and tensor parallelism across GPUs"], cons: ["Batching more prompts gives little extra, the GPU is already busy"], bestFor: "Lowering TTFT on long prompts" },
          { name: "Decode (memory-bound)", summary: "Move fewer bytes per token, or get more tokens per byte.", pros: ["Continuous batching: share each weight read across many users", "Weight quantization (INT8/INT4) and KV cache compression", "GQA/MQA/MLA models with smaller caches", "Speculative decoding: verify several guessed tokens per pass", "Paged KV memory to fit bigger batches"], cons: ["Bigger batches raise per-token latency a little"], bestFor: "Lowering TPOT and raising throughput" }
        ], verdict: "Prefill wants fewer FLOPs; decode wants fewer bytes per token. Some systems go further and run the two phases on different GPUs (the next lesson)." },
        { type: "callout", tone: "example", title: "Real-world use", text: "Open-source engines such as vLLM, SGLang and TensorRT-LLM implement most of these: continuous batching, paged KV memory, chunked prefill, prefix caching and speculative decoding. API providers expose the same split in pricing: input (prompt) tokens are usually much cheaper per token than output tokens, reflecting that prefill is far more efficient per token than decode." }
      ]
    },
    {
      id: "worked-example-latency-budget",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Let us add up the time for one whole request by hand, using the ideal numbers from `roofline.py`: about 0.016 ms per prompt token in prefill, and 4.78 ms per decode step. Our customer sends a 2,000-token log and gets a 200-token answer. These are lower bounds from a simple model, not measurements, but the proportions are what we care about." },
        { type: "steps", title: "Where the time goes for one chat request", items: [
          { title: "Prefill", text: "2,000 tokens × 0.016 ms ≈ 32 ms. All 2,000 tokens share one read of the weights, so this pass is compute-bound." },
          { title: "First token", text: "Prefill also gives us output token 1. With no queueing, TTFT ≈ 32 ms." },
          { title: "Decode", text: "The other 199 tokens need 199 steps. 199 × 4.78 ms ≈ 951 ms. Every step reads all 16 GB of weights to produce one token." },
          { title: "Add them up", text: "End-to-end ≈ 32 + 951 = 983 ms. Decode handled about 9% of the tokens (200 of 2,200) but took about 97% of the time." },
          { title: "Check the formula", text: "TTFT + TPOT × (N − 1) = 32 + 4.78 × 199 ≈ 983 ms. The hand sum and the formula agree." }
        ] },
        { type: "table", caption: "Ideal time split for three workloads on the lesson's roofline model (lower bounds, not measurements)", head: ["Workload", "Prompt → output tokens", "Prefill", "Decode", "Decode share of time"], rows: [
          ["Chat", "2,000 → 200", "≈ 32 ms", "≈ 951 ms", "≈ 97%"],
          ["Summariser", "20,000 → 100", "≈ 324 ms", "≈ 473 ms", "≈ 59%"],
          ["Story writer", "200 → 1,000", "≈ 4.8 ms", "≈ 4,775 ms", "≈ 99.9%"]
        ] },
        { type: "p", text: "Look closely at the story writer's prefill. 200 tokens × 0.016 ms would be 3.2 ms, but the table says 4.8 ms. A pass can never be faster than one full read of the weights, which takes 4.78 ms. With only 200 tokens the intensity is about 200, below the ridge point of 295, so even this prefill is memory-bound. **Prefill is compute-bound only when the prompt is long enough.**" },
        { type: "p", text: "A common mistake is to judge a workload by its total token count. The chat and a story of 200 → 2,000 tokens both move 2,200 tokens, yet the second takes about ten times longer, because every output token pays for its own pass." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a small latency calculator. It takes a prompt length, an output length and a decode batch size, and returns TTFT, TPOT, total time and server throughput. The timing constants are illustrative. The point is to see how the two phases and the batch size trade against each other." },
        { type: "code", lang: "python", title: "practice_latency_budget.py", code: `# One request's latency from its two phases, and how batch size shifts it.
# All timings are illustrative, not measured.
PREFILL_MS_PER_TOKEN = 0.02     # prefill is compute-bound: cost per prompt token
DECODE_BASE_MS = 5.0            # reading the weights once per decode step
DECODE_PER_USER_MS = 0.05       # small extra work per request in the batch

def request_metrics(prompt_tokens, output_tokens, batch, queue_ms=0.0):
    ttft = queue_ms + prompt_tokens * PREFILL_MS_PER_TOKEN
    tpot = DECODE_BASE_MS + DECODE_PER_USER_MS * batch
    total = ttft + tpot * (output_tokens - 1)
    throughput = batch * 1000 / tpot           # tokens/s across all users
    return ttft, tpot, total, throughput

workloads = [("chat", 2000, 200), ("summarise", 20000, 100), ("story", 200, 1000)]
print("workload   batch  TTFT ms  TPOT ms  total s  decode share  server tok/s")
for name, p, n in workloads:
    for batch in (1, 32):
        ttft, tpot, total, thr = request_metrics(p, n, batch)
        share = 1 - ttft / total               # part of the wait spent decoding
        print(f"{name:10s} {batch:5d} {ttft:8.0f} {tpot:8.2f} {total/1000:8.2f} "
              f"{share:12.0%} {thr:13.0f}")`, output: `workload   batch  TTFT ms  TPOT ms  total s  decode share  server tok/s
chat           1       40     5.05     1.04          96%           198
chat          32       40     6.60     1.35          97%          4848
summarise      1      400     5.05     0.90          56%           198
summarise     32      400     6.60     1.05          62%          4848
story          1        4     5.05     5.05         100%           198
story         32        4     6.60     6.60         100%          4848`, walkthrough: [
          { lines: [1, 5], note: "Three illustrative constants: prefill cost per prompt token, the fixed cost of a decode step, and a small extra cost per request in the batch." },
          { lines: [7, 12], note: "The whole model. TTFT comes from queueing plus prefill. TPOT comes from the decode step. Throughput counts one token per user per step." },
          { lines: [14, 21], note: "Run three workloads at batch 1 and batch 32 and print how much of each wait is decode." }
        ] },
        { type: "p", text: "Going from batch 1 to batch 32 made every user's TPOT a little worse (5.05 ms to 6.60 ms) while the server's output rose about 24 times. Now change it:" },
        { type: "list", items: [
          "Pass `queue_ms=500` for the chat workload. Predict first: which of the four numbers change, and which stay exactly the same?",
          "Set `DECODE_PER_USER_MS = 0.5`. Predict whether batch 32 still gives more server tokens per second than batch 1, and how much TPOT each user now sees.",
          "Add a workload `(\"swap\", 200, 2000)` next to the chat one. Both move 2,200 tokens. Predict which is slower and by roughly what factor before you run it."
        ] },
        { type: "check", question: "In the practice output, the summariser has the highest TTFT but the lowest total time. How can both be true?", answer: "TTFT depends on the prompt, and its prompt is the longest (20,000 tokens). Total time is mostly decode steps, and it writes the fewest output tokens (100). A long wait to start and a short wait to finish are set by different phases." },
        { type: "check", question: "We keep raising the decode batch size because server tokens per second keeps going up. What tells us to stop?", answer: "Each user's TPOT. Every extra request in the batch makes the step slightly longer, so every user's tokens arrive a little more slowly. We stop when TPOT reaches our latency target, or when the KV caches no longer fit in memory, whichever comes first." }
      ]
    },
    {
      id: "conclusion",
      title: "Conclusion and common mistakes",
      blocks: [
        { type: "p", text: "Every request is one prefill followed by many decode steps. Prefill is a big parallel pass that fills the KV cache and sets TTFT. Decode is a long chain of tiny passes that read the weights and cache over and over and sets TPOT. Knowing which phase dominates your workload tells you which optimizations will pay off: a summariser with 20k-token inputs and short outputs is prefill-heavy, while a creative-writing assistant with short prompts and long answers is decode-heavy." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Reporting only “tokens per second” without saying whether it is per user or across the whole server. Assuming a faster GPU in FLOPs will speed up decode (bandwidth matters more). And benchmarking with short prompts only, which hides prefill and TTFT problems that real users with long documents will hit." }
      ]
    }
  ],
  quiz: [
    { q: "What does the prefill phase produce?", options: ["The full answer text, generated in one parallel pass over the prompt", "The prompt's KV cache plus the probabilities for the first output token", "A compressed copy of the model weights for faster decode steps", "One sequential decode step for each prompt token, filling the cache"], answer: 1, explain: "Prefill runs all prompt tokens in parallel, writes their keys and values to the cache and outputs the first token's probabilities. It does not run one step per prompt token." },
    { q: "Using the roofline numbers from the lesson (ridge point ≈ 295 FLOPs/byte), a decode step batches 64 users. Ignoring the KV cache, is it compute-bound or memory-bound?", options: ["Compute-bound, because 64 users is a large enough batch to saturate it", "Memory-bound, because its intensity (~64) is below the ridge point", "Compute-bound, because decode steps are always limited by FLOPs", "Neither, since a batched decode step does not read any weights"], answer: 1, explain: "Intensity is roughly the number of tokens per pass, about 64, which is below 295. The step is still limited by reading weights." },
    { q: "Our bot starts answering quickly, but text arrives in slow, uneven bursts when the server is busy. Which metric is suffering most?", options: ["TTFT (time to first token)", "Prefill FLOPs per request", "TPOT (inter-token latency)", "Prompt length in tokens"], answer: 2, explain: "The gap between tokens is TPOT. The first token arrives quickly, so TTFT is fine." },
    { q: "Which optimization mainly targets the decode phase rather than prefill?", options: ["Prefix caching so requests reuse a shared system prompt's KV", "Chunking a long prompt into smaller prefill pieces", "FlashAttention to speed up long prompt processing", "Continuous batching so many users share each weight read"], answer: 3, explain: "Decode is memory-bound, so sharing each expensive weight read across many users boosts throughput. The other three mainly reduce prefill work or its impact." },
    { q: "A teammate argues: “Decode processes just one token, so it should be much cheaper per token than prefill.” What is wrong?", options: ["Nothing is wrong: one token needs far fewer FLOPs, so decode is cheaper per token", "Each token must read all weights and the cache, so decode is far less efficient per token", "Decode runs a separate, larger copy of the model than prefill does", "Decode recomputes keys and values for the whole prompt at every step, even with a KV cache"], answer: 1, explain: "Prefill amortises one weight read over thousands of tokens; decode pays that read for every token (shared only across the batch). With a KV cache, decode does not recompute the prompt." }
  ],
  takeaways: [
    "Each request = one parallel prefill pass over the prompt + one decode step per output token.",
    "The KV cache is written in prefill and read (and extended) at every decode step.",
    "Prefill is compute-bound; decode is memory-bandwidth-bound because it reads all weights for few tokens.",
    "TTFT reflects queueing + prefill; TPOT reflects decode; end-to-end ≈ TTFT + TPOT × (N − 1).",
    "Optimize prefill by cutting FLOPs and decode by cutting bytes per token or batching more users."
  ],
  terms: [
    { term: "Prefill", def: "The phase that processes all prompt tokens in one parallel pass, building the KV cache and producing the first token." },
    { term: "Decode", def: "The phase that generates output tokens one per forward pass, reusing and extending the KV cache." },
    { term: "Arithmetic intensity", def: "FLOPs performed per byte moved from memory; low values mean a memory-bound workload." },
    { term: "TTFT", def: "Time to first token: delay from request arrival to the first output token." },
    { term: "TPOT", def: "Time per output token: average gap between consecutive generated tokens." },
    { term: "Throughput", def: "Total tokens or requests a server produces per second across all users." },
    { term: "SLO", def: "Service-level objective: a target such as “TTFT under 1 s for 99% of requests”." }
  ]
};
