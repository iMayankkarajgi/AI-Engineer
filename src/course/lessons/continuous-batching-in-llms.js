export default {
  id: "continuous-batching-in-llms",
  minutes: 21,
  hook: "Why should a user asking “What is 2+2?” have to wait for someone else's 1,000-word essay to finish before getting a GPU slot?",
  summary: "GPUs serve LLMs efficiently only when many requests share each forward pass, so servers batch requests. Static batching keeps a batch together until its longest request finishes, leaving slots idle and newcomers waiting. Continuous batching (iteration-level scheduling) makes batch decisions at every decode step: finished requests leave immediately and waiting ones join, keeping the GPU full and raising throughput several-fold on realistic traffic.",
  sections: [
    {
      id: "big-picture",
      title: "The big picture",
      blocks: [
        { type: "p", text: "An LLM server receives a stream of requests of wildly different sizes: a one-line answer, a long summary, a code file. The GPU is expensive, so we want it doing useful work every millisecond. **Batching** (processing several requests in the same forward pass) is the main way to get there. The question is *how* to group requests when they all finish at different times." },
        { type: "p", text: "Our running example is a **support chatbot** whose replies range from 5 tokens (“Yes, it is included.”) to 60 tokens or more (a step-by-step fix). We will compare two schedulers on the same 16 requests." }
      ]
    },
    {
      id: "token-generation-recap",
      title: "Quick recap: how an LLM generates tokens",
      blocks: [
        { type: "p", text: "Each request goes through **prefill**, one parallel pass over the prompt that builds its KV cache (the stored keys and values of past tokens), and then **decode**, one forward pass per output token. A reply of 60 tokens needs about 60 decode steps. Nobody knows in advance how many steps a request will need: it stops when the model emits an end-of-sequence token or hits a length limit." },
        { type: "callout", tone: "note", title: "The key fact for this lesson", text: "Decode work happens in **iterations** (steps). In each iteration, every request in the batch gets exactly one new token. That step-by-step structure is what continuous batching exploits." }
      ]
    },
    {
      id: "why-batching-matters",
      title: "Why batching matters for LLMs",
      blocks: [
        { type: "p", text: "A decode step for a single request is **memory-bound**: the GPU must stream all the model's weights (about 16 GB for an 8B model in FP16) from memory just to produce one token. The math units are mostly idle. If 32 requests share that pass, the weights are read once and used 32 times. Step time grows only a little, but tokens per step grow 32×." },
        { type: "chart", kind: "line", title: "Illustrative decode throughput vs batch size", xLabel: "Requests in the batch", yLabel: "Tokens per second (relative)", series: [{ name: "Throughput", points: [[1, 1], [4, 3.9], [8, 7.6], [16, 14.5], [32, 26], [64, 42], [128, 58]] }], caption: "Illustrative shape, not a benchmark: near-linear gains at first, flattening as the step becomes compute-bound or KV cache reads dominate." },
        { type: "p", text: "So we want big batches. But a batch is only as useful as the number of slots doing real work. That is where the scheduling method matters." }
      ]
    },
    {
      id: "static-batching",
      title: "The old way: static batching, and its problem",
      blocks: [
        { type: "p", text: "**Static batching** (also called request-level batching) works like this: collect up to B requests, run prefill for all of them, then run decode steps for the whole group until *every* request in it is finished. Only then start the next batch." },
        { type: "callout", tone: "analogy", title: "The ride-share analogy", text: "Static batching is a shuttle bus that leaves with 4 passengers and does not pick anyone up until it has dropped off the last passenger at the farthest stop. Seats empty out along the way, and people at the curb wait. Continuous batching is a ride-share van that picks up a new passenger the moment a seat frees up." },
        { type: "list", items: [
          "**Idle slots:** a request that finishes after 6 tokens sits in the batch doing nothing (padding) until the 57-token request ends.",
          "**Head-of-line blocking:** new requests wait for the entire current batch to finish, even if they are tiny. Their time to first token suffers.",
          "**Wasted padding work or memory:** depending on the implementation, finished slots still consume compute or reserved memory."
        ] },
        { type: "check", question: "In a static batch of 4 with output lengths 31, 33, 46 and 57, how many decode steps does the batch take, and how many slot-steps are idle?", answer: "It takes 57 steps (the longest). Total slot-steps are 4 × 57 = 228; useful ones are 31 + 33 + 46 + 57 = 167; so 61 slot-steps (27%) are idle." }
      ]
    },
    {
      id: "continuous-batching",
      title: "What continuous batching is",
      blocks: [
        { type: "p", text: "**Continuous batching**, also called **iteration-level scheduling** or in-flight batching, makes the scheduling decision at every decode step instead of once per batch. The idea was introduced by the Orca system (Yu et al., OSDI 2022) and is now standard in vLLM, TensorRT-LLM, SGLang and Hugging Face TGI." },
        { type: "steps", title: "How continuous batching works, step by step", items: [
          { title: "Check the batch", text: "Before each iteration, the scheduler looks at the running requests and the waiting queue." },
          { title: "Evict finished requests", text: "Any request that emitted end-of-sequence or hit its length limit leaves now. Its slot and KV cache memory are freed." },
          { title: "Admit waiting requests", text: "If there are free slots and enough KV memory, new requests join. Their prompts need prefill, which is run in this iteration or split into chunks alongside decode work." },
          { title: "Run one iteration", text: "One forward pass produces one new token for every decoding request in the batch." },
          { title: "Stream and repeat", text: "Send new tokens to their users and go back to step 1. The batch composition changes continuously." }
        ] },
        { type: "viz", name: "continuous-batching", caption: "Compare GPU slot timelines: static batching waits for the longest request, while continuous batching refills a slot as soon as it frees." },
        { type: "flow", title: "The per-iteration scheduling loop", loop: true, nodes: [
          { label: "Remove finished", detail: "Requests that ended free their slot and KV blocks." },
          { label: "Admit new", detail: "Queued requests take free slots if KV memory allows." },
          { label: "Forward pass", detail: "Decode one token for each running request (plus any prefill chunks)." },
          { label: "Stream tokens", detail: "Each user gets their next token immediately." }
        ] }
      ]
    },
    {
      id: "numeric-example",
      title: "A numeric example",
      blocks: [
        { type: "p", text: "Let us simulate 16 chatbot requests with output lengths between 5 and 59 tokens on a GPU with 4 batch slots, ignoring prefill time for clarity. We count decode iterations and **slot utilisation**: the share of slot-steps that produce a useful token." },
        { type: "code", lang: "python", title: "batching_sim.py", code: `import numpy as np
rng = np.random.default_rng(1)
SLOTS = 4                                       # requests the GPU runs at once
lengths = rng.integers(5, 60, size=16).tolist() # output tokens each request needs
print("output lengths:", lengths)

def static_batching(lengths):
    steps = 0
    for i in range(0, len(lengths), SLOTS):     # take 4, run until ALL finish
        steps += max(lengths[i:i + SLOTS])
    return steps

def continuous_batching(lengths):
    queue, running, steps = list(lengths), [], 0
    while queue or running:
        while queue and len(running) < SLOTS:   # refill free slots every step
            running.append(queue.pop(0))
        running = [r - 1 for r in running]      # one decode step for everyone
        running = [r for r in running if r > 0] # finished requests leave now
        steps += 1
    return steps

useful = sum(lengths)                           # tokens we actually need
for name, fn in [("static", static_batching), ("continuous", continuous_batching)]:
    steps = fn(lengths)
    util = useful / (steps * SLOTS)
    print(f"{name:10s}: {steps:4d} decode steps, slot utilisation {util:5.1%}, "
          f"{useful/steps:.2f} tokens/step")`, output: `output lengths: [31, 33, 46, 57, 6, 12, 50, 57, 18, 22, 52, 28, 20, 50, 19, 27]
static    :  216 decode steps, slot utilisation 61.1%, 2.44 tokens/step
continuous:  152 decode steps, slot utilisation 86.8%, 3.47 tokens/step`, walkthrough: [
          { lines: [1, 5], note: "16 requests with random output lengths from 5 to 59 tokens, and a GPU that runs 4 at a time." },
          { lines: [7, 11], note: "Static: each group of 4 costs as many steps as its longest member." },
          { lines: [13, 21], note: "Continuous: before every step, fill free slots from the queue; after every step, drop finished requests." },
          { lines: [23, 28], note: "Same useful work (sum of lengths), different number of steps. Utilisation = useful tokens / (steps × slots)." }
        ] },
        { type: "chart", kind: "bar", title: "Same 16 requests, two schedulers (from the simulation)", yLabel: "Decode steps", labels: ["Static batching", "Continuous batching"], series: [{ name: "Decode steps to finish all", values: [216, 152] }], caption: "Continuous batching finishes the same work in 30% fewer steps: about 1.42× the throughput here." },
        { type: "p", text: "The first static batch (31, 33, 46, 57) takes 57 steps; the second (6, 12, 50, 57) also takes 57, even though two of its requests finish within 12 steps. Continuous batching fills those freed slots right away. Notice also the effect on *latency*: the 6-token request in static batching cannot even start until step 57, while with continuous batching it starts as soon as any slot frees up." }
      ]
    },
    {
      id: "real-numbers",
      title: "Real numbers and speedup",
      blocks: [
        { type: "p", text: "Our toy had only 4 slots and moderate length variation. The gain grows with **more slots** and **more variation** in output lengths, because static batching's waste is driven by the gap between the longest and the typical request. Real chat traffic has long-tailed lengths, so the gap is large." },
        { type: "p", text: "Published results vary by setup. The Orca paper reported large throughput improvements over the then-standard FasterTransformer at the same latency. A widely cited 2023 Anyscale benchmark reported up to about 23× throughput over naive static batching when continuous batching was combined with vLLM's memory optimisations; much of the largest gains come from the combination, not from scheduling alone. Treat any single number as workload-specific." },
        { type: "compare", title: "Static vs continuous batching", options: [
          { name: "Static batching", summary: "Batch formed once; runs until the longest request finishes.", pros: ["Simple to implement", "Predictable batch shape"], cons: ["Idle slots after short requests finish", "New requests wait for the whole batch (poor TTFT)", "Throughput falls as length variance grows"], bestFor: "Offline jobs with similar output lengths" },
          { name: "Continuous batching", summary: "Batch updated every iteration.", pros: ["Slots refilled immediately", "Short requests are not stuck behind long ones", "Much higher throughput on real traffic"], cons: ["More complex scheduler", "Needs dynamic KV memory management", "Prefill of new arrivals can interrupt decode"], bestFor: "Online, multi-user LLM serving" }
        ], rows: [["When decisions are made", "Once per batch", "Every decode step"], ["Waste source", "Waiting for the longest request", "Only when the queue is empty"]], verdict: "Every modern LLM serving engine uses continuous batching; static batching survives mainly in simple offline scripts." }
      ]
    },
    {
      id: "benefits-and-notes",
      title: "Benefits and important notes",
      blocks: [
        { type: "list", items: [
          "**Higher throughput:** slots stay busy, so more tokens per GPU-second.",
          "**Lower queueing delay:** new requests enter at the next iteration rather than after a whole batch.",
          "**Fairer latency:** short replies finish quickly instead of being held hostage by long ones.",
          "**Better cost per token:** the same hardware serves more users."
        ] },
        { type: "callout", tone: "note", title: "Prefill needs special handling", text: "A newly admitted request needs a prefill pass, which is much heavier than a decode step. Running it in the same iteration can delay everyone's next token. Engines handle this with chunked prefill (splitting the prompt into pieces mixed into several iterations) or by separating prefill and decode onto different GPUs." },
        { type: "callout", tone: "note", title: "Memory is the real limit", text: "Admitting a request means reserving room for its growing KV cache. Without paged KV memory, fragmentation limits how many requests can join; this is why continuous batching and PagedAttention are usually deployed together. If memory runs out mid-generation, the scheduler must preempt a request (pause it and later recompute or swap its cache back)." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Assuming bigger batches are always better: each step gets slower as the batch grows, so per-user token speed (TPOT) rises; set a maximum batch size to protect latency targets. Also, continuous batching does not make a single request faster when the server is idle; it improves throughput and queueing under load." },
        { type: "check", question: "Our server is nearly idle at night, with one request at a time. Will switching from static to continuous batching speed up those requests?", answer: "Not noticeably. With one request there is nothing to refill or interleave, so both schedulers behave the same. The gains appear under concurrent load with varied output lengths." }
      ]
    },
    {
      id: "quick-summary",
      title: "Quick summary",
      blocks: [
        { type: "p", text: "Batching amortises the cost of reading the model's weights across many users, which is what makes LLM decode affordable. Static batching wastes that opportunity by holding slots until the longest request ends. Continuous batching reschedules at every iteration, so finished requests leave and new ones join immediately. Combined with paged KV memory and chunked prefill, it is the backbone of modern serving engines." }
      ]
    }
  ],
  quiz: [
    { q: "What is the defining feature of continuous batching?", options: ["It groups requests only when their prompts and outputs have identical lengths", "It re-forms the batch every decode iteration, so requests join and leave mid-batch", "It gives every request its own GPU so that no request has to wait", "It processes each prompt and its full output together in one single pass"], answer: 1, explain: "Iteration-level scheduling is the core idea: finished requests leave and queued ones join at every step." },
    { q: "A static batch of 4 requests has output lengths 10, 10, 10 and 50. What is its slot utilisation?", options: ["40%", "50%", "100%", "25%"], answer: 0, explain: "It runs 50 steps × 4 slots = 200 slot-steps; useful tokens are 10 + 10 + 10 + 50 = 80; 80 / 200 = 40%." },
    { q: "Users with short questions complain that their answers take a long time to start, even though the answers themselves are short. The server uses static batching. What is the best fix?", options: ["Raise the maximum output length so short answers are not cut off", "Switch to continuous batching so new requests join at the next step", "Use a bigger static batch so more waiting requests start together", "Disable streaming so each answer is sent back in one piece"], answer: 1, explain: "This is head-of-line blocking: new requests wait for the whole current batch. Continuous batching admits them as soon as a slot frees." },
    { q: "Why are continuous batching and paged KV memory often deployed together?", options: ["Paged memory is required to compute attention at all, batched or not", "Continuous batching drops the KV cache, so paging is needed to rebuild it", "Requests join and leave every step, which needs KV memory that does not fragment", "Paged memory makes every decode step compute-bound, which continuous batching requires"], answer: 2, explain: "Requests constantly join and leave, so memory must be allocated and freed in small pieces without fragmentation, which paging provides." },
    { q: "A colleague says: “Continuous batching makes every request faster, even on an idle server.” What is the flaw?", options: ["It applies only to prefill, so decode-heavy requests never speed up", "A lone request has nothing to interleave with; the gains appear only under load", "It halves the speed of any request that runs alone on the server", "It needs two GPUs per request, so an idle single-GPU server cannot benefit at all"], answer: 1, explain: "Its benefit is better use of slots across many requests. With one request at a time, both schedulers behave the same." }
  ],
  takeaways: [
    "Decode is memory-bound, so batching many requests into each forward pass multiplies throughput.",
    "Static batching holds a batch until its longest request ends, wasting slots and blocking newcomers.",
    "Continuous batching reschedules every iteration: finished requests leave, waiting ones join.",
    "Gains grow with batch size and output-length variance; in our toy, 216 → 152 steps for the same work.",
    "It relies on good KV memory management (paging) and careful prefill handling (chunking)."
  ],
  terms: [
    { term: "Batching", def: "Processing several requests in the same forward pass to share the cost of reading weights." },
    { term: "Static batching", def: "Forming a batch once and running it until every request in it finishes." },
    { term: "Continuous batching", def: "Updating batch membership at every decode iteration; also called iteration-level or in-flight batching." },
    { term: "Iteration", def: "One forward pass that produces one new token for every decoding request in the batch." },
    { term: "Slot utilisation", def: "The share of batch slot-steps that produce useful tokens." },
    { term: "Head-of-line blocking", def: "New work waiting behind long-running work that it does not depend on." },
    { term: "Preemption", def: "Pausing a running request, freeing its memory, and resuming it later." }
  ]
};
