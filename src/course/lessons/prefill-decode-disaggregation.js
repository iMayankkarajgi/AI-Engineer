export default {
  id: "prefill-decode-disaggregation",
  minutes: 21,
  hook: "What if the GPU that reads your prompt and the GPU that writes your answer were two different machines, and that made both faster?",
  summary: "Prefill is compute-heavy and decode is memory-heavy, so when both share one GPU they get in each other's way: a long prompt arriving can freeze everyone else's token stream. Prefill-decode disaggregation runs the two phases on separate GPU pools and ships the KV cache between them. It gives steadier TTFT and TPOT and lets each pool be tuned on its own, at the cost of KV transfer, a fast network and more operational complexity.",
  sections: [
    {
      id: "how-a-request-runs",
      title: "How an LLM answers a request, and what the KV cache is",
      blocks: [
        { type: "p", text: "A request to an LLM goes through two phases. **Prefill** reads the entire prompt in one parallel forward pass. **Decode** then writes the answer one token per forward pass, each new token depending on the one before it." },
        { type: "p", text: "The **KV cache** connects them. In every attention layer, each token produces a **key** vector (what it offers for matching) and a **value** vector (what it contributes when attended to). Prefill computes keys and values for all prompt tokens and stores them. Each decode step computes them only for the newest token, appends them, and attends over the whole stored cache. Without the cache, every decode step would redo all the prompt work." },
        { type: "callout", tone: "analogy", title: "Think of it like a restaurant kitchen", text: "Prep cooks chop vegetables in big batches; line cooks plate dishes one at a time, fast and steadily. If one person did both, every time a huge prep job arrived the plates would stop going out. Big kitchens separate the two stations and pass the prepped ingredients across. The prepped ingredients are the KV cache." },
        { type: "p", text: "Our running example is a **support chatbot** where some customers paste 20,000-token log files while dozens of others are mid-way through receiving short answers. We care about both how fast the first token appears and how smoothly the rest flows." }
      ]
    },
    {
      id: "different-hardware-needs",
      title: "Prefill is compute-heavy, decode is memory-heavy",
      blocks: [
        { type: "p", text: "A GPU forward pass must read the model's weights from memory and then do math with them. In prefill, one weight read is shared by thousands of prompt tokens, so the math dominates: prefill is **compute-bound**. In decode, each request contributes just one token per pass, so the GPU spends most of its time reading weights and the KV cache: decode is **memory-bandwidth-bound**." },
        { type: "list", items: [
          "Prefill wants many FLOPs: it benefits from more compute and splitting work across GPUs (tensor parallelism).",
          "Decode wants high memory bandwidth and lots of memory capacity: big batches of users share each weight read, and each user's KV cache must fit.",
          "A prefill of a long prompt can take tens or hundreds of milliseconds; a decode step typically takes a few tens of milliseconds."
        ] },
        { type: "callout", tone: "note", title: "Same model, two workloads", text: "Nothing about the weights is different between phases. Only the shape of the work differs: matrix × matrix for prefill, many matrix × vector products for decode." }
      ]
    },
    {
      id: "interference-problem",
      title: "The problem when both run on the same GPU",
      blocks: [
        { type: "p", text: "In a classic **co-located** server, one GPU (or one group of GPUs) runs both phases. A scheduler forms each forward pass from whatever work is waiting. When a new long prompt arrives, there are two choices, and both hurt someone:" },
        { type: "list", items: [
          "**Run the prefill now.** Everyone currently decoding waits for it. Their next token arrives late, so their stream stutters.",
          "**Keep decoding first.** The new user's prefill waits in the queue, so their first token arrives late."
        ] },
        { type: "p", text: "This is called **prefill-decode interference**. Let us simulate it. One user is decoding at 20 ms per step. Long prompts arrive every 100 ms and each prefill takes 60 ms (illustrative numbers). A co-located GPU runs any waiting prefill before the next decode step. A disaggregated setup sends prefills to another GPU." },
        { type: "code", lang: "python", title: "interference.py", code: `# Toy timeline: one user is decoding while new prompts keep arriving.
# Times in ms, illustrative: prefill of a long prompt = 60 ms,
# one decode step = 20 ms, KV transfer between GPUs = 5 ms.
PREFILL, DECODE, TRANSFER = 60, 20, 5
arrivals = [0, 100, 200, 300]          # new requests (long prompts)

def colocated(n_tokens=20):
    # One GPU. A waiting prefill runs before the next decode step.
    t, gaps, queue = 0, [], list(arrivals[1:])
    for _ in range(n_tokens):
        start = t
        while queue and queue[0] <= t:  # prefill jumps in first
            queue.pop(0); t += PREFILL
        t += DECODE
        gaps.append(t - start)          # time between our two tokens
    return gaps

def disaggregated(n_tokens=20):
    # Prefills go to a separate GPU; decode GPU only decodes.
    # The KV transfer happens once, before our first token.
    return [DECODE] * n_tokens, TRANSFER

co = colocated()
dis, xfer = disaggregated()
print("co-located gaps (ms):   ", co)
print("disaggregated gaps (ms):", dis)
print(f"co-located   avg TPOT {sum(co)/len(co):.0f} ms, worst {max(co)} ms")
print(f"disaggregated avg TPOT {sum(dis)/len(dis):.0f} ms, worst {max(dis)} ms"
      f" (+{xfer} ms one-time KV transfer on TTFT)")`, output: `co-located gaps (ms):    [20, 20, 20, 20, 20, 80, 20, 80, 20, 80, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
disaggregated gaps (ms): [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
co-located   avg TPOT 29 ms, worst 80 ms
disaggregated avg TPOT 20 ms, worst 20 ms (+5 ms one-time KV transfer on TTFT)`, walkthrough: [
          { lines: [1, 5], note: "Illustrative timings and the times at which new long prompts arrive." },
          { lines: [7, 16], note: "Co-located: before each decode step, any prefill that has arrived runs first, stretching the gap between our tokens." },
          { lines: [18, 21], note: "Disaggregated: the decode GPU never runs prefills, so every gap is one decode step. The price is a one-time KV transfer." },
          { lines: [23, 29], note: "Print every inter-token gap plus the average and worst case." }
        ] },
        { type: "p", text: "Three of our user's tokens took 80 ms instead of 20 ms: a 4× stall each time someone else's prompt arrived. The average looks tolerable (29 ms), but users notice the **worst case**, and latency targets are usually set on high percentiles such as p99." },
        { type: "chart", kind: "bar", title: "Gap between consecutive tokens for one user (from the simulation)", yLabel: "ms", unit: " ms", labels: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12"], series: [{ name: "Co-located", values: [20, 20, 20, 20, 20, 80, 20, 80, 20, 80, 20, 20] }, { name: "Disaggregated", values: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20] }], caption: "Illustrative numbers. The spikes are prefills of other users' prompts cutting in line." }
      ]
    },
    {
      id: "ttft-vs-tpot",
      title: "TTFT vs TPOT: two promises that pull apart",
      blocks: [
        { type: "p", text: "**TTFT (time to first token)** is how long a user waits before anything appears; it is mostly queueing plus prefill. **TPOT (time per output token)** is the gap between later tokens; it is set by decode step time and by any interruptions. A chat product usually promises both, for example TTFT under 1 s and TPOT under 50 ms." },
        { type: "p", text: "On a co-located GPU these targets fight each other. Prioritising prefill improves TTFT but causes TPOT spikes. Prioritising decode smooths TPOT but makes new users wait. To satisfy both, operators often over-provision GPUs and run them below capacity. The DistServe paper (OSDI 2024) framed this in terms of **goodput**: requests per second served *while meeting both latency targets*, and argued that interference wastes much of a co-located cluster's goodput." },
        { type: "check", question: "If we simply run fewer requests per GPU, does interference go away?", answer: "It shrinks, because fewer prompts arrive to interrupt each decode batch, but it does not disappear and we pay with low utilisation and more GPUs. That is the over-provisioning trap." }
      ]
    },
    {
      id: "naive-approaches",
      title: "The naive approaches and their issues",
      blocks: [
        { type: "table", caption: "Common fixes on a single co-located GPU pool", head: ["Approach", "What it does", "Issue"], rows: [
          ["Prefill-first scheduling", "Always run waiting prefills immediately", "Good TTFT, but decode streams stall (our 80 ms spikes)"],
          ["Decode-first scheduling", "Finish decode steps before starting prefills", "Smooth TPOT, but new users can wait a long time for the first token"],
          ["Chunked prefill", "Split a long prompt into chunks (e.g. 512 tokens) and mix one chunk with each decode batch", "Much smaller spikes, but each step still carries prefill work; long prompts take more steps to finish; both phases still share one hardware configuration"],
          ["Over-provisioning", "Keep load low so collisions are rare", "Expensive: GPUs sit underused"]
        ] },
        { type: "p", text: "**Chunked prefill** deserves credit: it is widely used in engines like vLLM and SGLang, and for many deployments it is enough. But it only softens the interference. The two phases still compete for the same GPUs, and we cannot pick different parallelism or batch sizes for each phase." }
      ]
    },
    {
      id: "what-is-disaggregation",
      title: "What prefill-decode disaggregation is and how it works",
      blocks: [
        { type: "p", text: "**Prefill-decode disaggregation** (often “PD disaggregation”) splits the serving fleet into two pools: **prefill workers** that only run prefills, and **decode workers** that only run decode steps. After a prefill finishes, the request's KV cache is sent over a fast interconnect to a decode worker, which continues the generation." },
        { type: "flow", title: "One request through a disaggregated cluster", nodes: [
          { label: "Router", detail: "Receives the request and picks a prefill worker (often based on load or which worker already has a matching prompt prefix cached)." },
          { label: "Prefill worker", detail: "Runs the prompt through the model in one pass, producing the KV cache and the first output token." },
          { label: "KV transfer", detail: "Copies the KV cache to a decode worker over NVLink, InfiniBand or RDMA networking. Can be layer by layer, overlapping with compute." },
          { label: "Decode worker", detail: "Adds the request to its running decode batch and generates the remaining tokens using the received cache." },
          { label: "Stream to user", detail: "Tokens stream back to the client. The prefill worker is already busy with someone else's prompt." }
        ] },
        { type: "steps", title: "Walkthrough: a customer pastes a 20,000-token log", items: [
          { title: "Arrive and route", text: "The router sends the request to the least-busy prefill worker." },
          { title: "Prefill", text: "The prefill worker processes all 20,000 tokens in one pass (possibly split across several GPUs with tensor parallelism) and samples the first token." },
          { title: "Ship the cache", text: "The KV cache for 20,000 tokens is transferred to a decode worker. With GQA (8 KV heads), 32 layers, head dim 128 and FP16, that is 128 KiB per token, about 2.4 GiB in total, so a fast link matters." },
          { title: "Join a decode batch", text: "The decode worker slots the request into its continuous batch alongside dozens of other conversations." },
          { title: "Generate smoothly", text: "Because no prefill ever runs on this worker, every user's inter-token gap stays close to one decode step." }
        ] },
        { type: "callout", tone: "tip", title: "Tune each pool for its job", text: "Prefill workers can use more tensor parallelism to cut TTFT; decode workers can use large batches and lots of memory for KV caches. Teams can also change the ratio of prefill to decode GPUs as the traffic mix changes, for example more prefill workers for a summarisation-heavy app with long inputs." }
      ]
    },
    {
      id: "pros-cons-fit",
      title: "Advantages, disadvantages and where it fits",
      blocks: [
        { type: "compare", title: "Co-located vs disaggregated serving", options: [
          { name: "Co-located (with chunked prefill)", summary: "Every GPU runs both phases.", pros: ["Simple to deploy and operate", "No KV transfer and no special network", "Good GPU utilisation at small scale"], cons: ["Prefill and decode interfere", "One hardware/parallelism setup for both phases", "Hard to meet tight TTFT and TPOT targets together"], bestFor: "Single-node or small deployments, moderate prompt lengths" },
          { name: "Disaggregated", summary: "Separate prefill and decode pools; KV cache moves between them.", pros: ["No prefill stalls in decode streams", "Independent tuning and scaling per phase", "Better goodput under strict latency targets at scale"], cons: ["KV transfer cost and need for fast interconnect", "More components: router, two pools, transfer layer", "Pool ratio must track the traffic mix, or one pool idles"], bestFor: "Large fleets with long prompts and strict latency SLOs" }
        ], rows: [
          ["Interference", "Yes, softened by chunking", "Removed by design"],
          ["Extra TTFT cost", "None", "KV transfer time"],
          ["Network needs", "Ordinary", "High bandwidth between pools"],
          ["Operational complexity", "Low", "High"]
        ], verdict: "Disaggregate when scale and latency targets justify the complexity; otherwise chunked prefill on co-located GPUs is the sensible default." },
        { type: "callout", tone: "example", title: "Real-world use", text: "Research systems DistServe and Splitwise (both 2024) showed the benefits of separating phases, and Moonshot AI described Mooncake, a KV-cache-centric disaggregated architecture serving its Kimi chatbot. Open-source frameworks have added support: NVIDIA Dynamo is built around disaggregated serving, and vLLM and SGLang offer PD-disaggregation modes. Exact features change quickly, so check current docs." },
        { type: "callout", tone: "warn", title: "Where it is overkill", text: "If you serve a small model on one or two GPUs, prompts are short, or traffic is light, disaggregation adds a transfer hop and moving parts for little gain. Short prompts mean short prefills, so there is little interference to remove. Measure p99 TPOT spikes first; if chunked prefill already meets your targets, stay co-located." },
        { type: "check", question: "Our chatbot's prompts get much shorter after we add retrieval that sends only the relevant 1,000 tokens. Does the case for disaggregation get stronger or weaker?", answer: "Weaker. Shorter prompts mean shorter prefills that interrupt decode less, and a smaller KV cache to transfer, so the benefit shrinks relative to the added complexity." }
      ]
    }
  ],
  quiz: [
    { q: "What is the main problem that prefill-decode disaggregation solves?", options: ["The model weights are too large to fit in a single GPU's memory", "Prefill and decode interfere on shared GPUs, causing TTFT or TPOT spikes", "Tokenising very long prompts is too slow on the serving GPUs", "The KV cache cannot be stored in FP16 once prompts get long"], answer: 1, explain: "Disaggregation separates the compute-heavy and memory-heavy phases so long prefills no longer stall decode streams. It does not address weight size or tokenisation." },
    { q: "In the lesson's simulation, decode steps take 20 ms and a prefill of 60 ms runs before one of them. What is that token's gap on the co-located GPU?", options: ["20 ms", "60 ms", "80 ms", "120 ms"], answer: 2, explain: "The prefill (60 ms) runs first, then the decode step (20 ms): 80 ms between the two tokens." },
    { q: "A team serves a 7B model on a single GPU with 500-token prompts and modest traffic. They consider disaggregation. What is the best advice?", options: ["Disaggregate now: splitting the phases improves latency at every scale and load", "Stay co-located, maybe with chunked prefill; the gain is small and transfers add complexity", "Drop the KV cache entirely so there is nothing to transfer between GPUs", "Move decode onto the CPU so the GPU is left free for prefill work"], answer: 1, explain: "The benefit of disaggregation grows with long prompts, scale and strict SLOs. For a small, light deployment it is overkill." },
    { q: "Compared with chunked prefill on co-located GPUs, what does disaggregation add that chunking cannot?", options: ["A large cut in the FLOPs needed for the prefill computation itself", "Removing the need to keep a KV cache for decoding", "Tuning and scaling prefill and decode hardware independently", "Exactly zero added time to first token (TTFT)"], answer: 2, explain: "Chunking softens interference but both phases still share one setup. Disaggregation lets each pool have its own parallelism, batch size and count. It actually adds a KV transfer to TTFT." },
    { q: "Someone claims: “After disaggregation, the decode worker must recompute the prompt because it never saw it.” Why is this wrong?", options: ["The prefill worker sends its KV cache to the decode worker, so nothing is redone", "The decode worker reads the prompt from the user again and recomputes it quickly", "Decode never needs any information about the prompt, only the last token", "The router computes and stores the answer before decode even starts"], answer: 0, explain: "The whole point of the transfer step is that the decode worker receives the prompt's keys and values and continues directly from them." }
  ],
  takeaways: [
    "Prefill is compute-bound and decode is memory-bound; on shared GPUs they interfere.",
    "Interference shows up as TTFT delays or TPOT spikes, and latency targets care about the worst cases.",
    "Disaggregation runs prefill and decode on separate pools and transfers the KV cache between them.",
    "It enables independent tuning and scaling of each phase, at the cost of KV transfer and complexity.",
    "For small deployments or short prompts, co-located serving with chunked prefill is usually enough."
  ],
  terms: [
    { term: "Co-located serving", def: "Running both prefill and decode on the same GPUs." },
    { term: "Prefill-decode disaggregation", def: "Serving prefill and decode on separate GPU pools, moving the KV cache from one to the other." },
    { term: "Interference", def: "Slowdown one phase causes the other when they share a GPU, such as a prefill stalling decode steps." },
    { term: "Chunked prefill", def: "Splitting a long prompt's prefill into smaller pieces that are mixed into decode batches." },
    { term: "Goodput", def: "Throughput counting only requests that meet their latency targets." },
    { term: "KV transfer", def: "Copying a request's key/value cache from a prefill worker to a decode worker over a fast interconnect." }
  ]
};
