export default {
  id: "how-does-an-lpu-work",
  minutes: 28,
  hook: "If a GPU can do a thousand trillion operations per second, why does a chatbot running on it still type at a few dozen words per second — and how did one chip design make that dramatically faster?",
  summary: "An LPU (Language Processing Unit) is Groq's chip design for fast LLM inference. Token-by-token generation is limited by how fast weights can be read from memory, not by arithmetic, so the LPU keeps model weights in fast on-chip SRAM spread across many chips, and has a compiler plan every operation and every data transfer in advance so nothing ever waits or guesses. The result is very low latency per user, paid for with many chips per model and less flexibility than a GPU.",
  sections: [
    {
      id: "what-is-an-lpu",
      title: "What is an LPU?",
      blocks: [
        { type: "p", text: "An **LPU (Language Processing Unit)** is a processor designed by the company **Groq** to run large language models (LLMs) quickly. It grew out of Groq's earlier **Tensor Streaming Processor (TSP)** architecture, described in a 2020 research paper. Groq's founder, Jonathan Ross, had previously worked on Google's TPU project." },
        { type: "p", text: "The LPU is an **inference** chip: it runs already-trained models; it is not built for training them. Its headline promise is *speed per user*: very high tokens per second and low, predictable latency. Groq offers it mainly as a cloud service (GroqCloud) through an API, and as on-premises systems." },
        { type: "callout", tone: "analogy", title: "Think of it like a train timetable versus city traffic", text: "A GPU is like city traffic: lots of cars, traffic lights, junctions and drivers making decisions on the fly. Throughput is high, but any single trip has unpredictable delays. An LPU is like a railway with a fixed timetable planned months ahead: every train knows exactly which track it will be on, at which second. No one waits at junctions, and every trip takes exactly as long as scheduled." },
        { type: "p", text: "Running example: our appliance shop's support assistant. Customers on the website hate waiting while an answer trickles out. We want to know whether an LPU-based API would help, and what it would cost us in flexibility." },
      ],
    },
    {
      id: "one-token-at-a-time",
      title: "How an LLM writes text, one token at a time",
      blocks: [
        { type: "p", text: "An LLM generates text **autoregressively**: it predicts one token (a word piece), appends it to the text, and runs again to predict the next. A 300-token answer means 300 sequential passes through the model. There are two phases:" },
        { type: "steps", title: "The two phases of LLM inference", items: [
          { title: "Prefill", text: "The whole prompt (say 500 tokens of instructions, ticket history and the customer's question) is processed in one parallel pass. Lots of maths per weight read: this phase is compute-heavy and GPUs handle it well. It produces the first token and fills the KV cache." },
          { title: "Decode, step 1", text: "To produce the next token, the model runs again on just the newest token, using the stored keys and values (the **KV cache**) for everything before it." },
          { title: "Decode, step 2 … N", text: "Repeat once per output token. Each step depends on the previous one, so they cannot run in parallel. This phase sets the 'typing speed' the user sees." },
          { title: "Stop", text: "Generation ends at an end-of-sequence token or a length limit." },
        ] },
        { type: "check", question: "Why can't we generate all 300 output tokens in parallel, the way prefill processes all 500 prompt tokens at once?", answer: "Because each new token depends on all the tokens before it, including ones not generated yet. Prompt tokens are all known up front, so they can be processed together; output tokens must be produced one after another." },
      ],
    },
    {
      id: "memory-bottleneck",
      title: "The real bottleneck is memory, not math",
      blocks: [
        { type: "p", text: "During one decode step for one user, every weight of the model is read once and used for about two floating-point operations (one multiply, one add). A 70B-parameter model in 8-bit format means reading **70 GB to do 140 GFLOPs** — about 2 FLOPs per byte. Modern accelerators can do hundreds of FLOPs in the time it takes to read one byte from their main memory. So the arithmetic units mostly sit idle, waiting for weights to arrive." },
        { type: "formula", expr: "tokens per second (one user) ≲ memory bandwidth ÷ bytes of weights read per token", caption: "An upper bound for batch-size-1 decoding; real systems also read the KV cache and pay other overheads." },
        { type: "code", lang: "python", title: "decode_bottleneck.py", code: `import math

# Generating ONE token with batch size 1 means reading every weight once.
params = 70e9                    # a 70B-parameter model
bytes_per_param = 1              # 8-bit weights
weight_bytes = params * bytes_per_param
flops_per_token = 2 * params     # one multiply + one add per weight

print(f"weights to read per token: {weight_bytes / 1e9:.0f} GB")
print(f"math per token:            {flops_per_token / 1e9:.0f} GFLOPs")

# Illustrative hardware figures (order of magnitude, not a benchmark)
gpu_bw, gpu_flops = 3.35e12, 990e12        # one HBM GPU: bytes/s, FLOP/s
t_mem = weight_bytes / gpu_bw
t_math = flops_per_token / gpu_flops
print(f"\\nGPU: time to read weights {t_mem * 1e3:6.2f} ms"
      f" | time to do the math {t_math * 1e3:5.3f} ms")
print(f"GPU: memory-bound ceiling ~{1 / t_mem:.0f} tokens/s for one user")

# On-chip SRAM design: weights are spread over many chips, each with
# a small but very fast memory, and all chips read their slice in parallel
sram_per_chip = 230e6            # bytes of on-chip SRAM per chip
sram_bw_per_chip = 80e12         # bytes/s of on-chip bandwidth per chip
chips = math.ceil(weight_bytes / sram_per_chip)
t_sram = (weight_bytes / chips) / sram_bw_per_chip
print(f"\\nSRAM chips needed just to hold the weights: {chips}")
print(f"each chip reads its {weight_bytes / chips / 1e6:.0f} MB slice in "
      f"{t_sram * 1e6:.2f} us")
print("(real speed is then set by chip-to-chip hops, the compiler's schedule,"
      " and the KV cache, not by this raw read time)")`, output: `weights to read per token: 70 GB
math per token:            140 GFLOPs

GPU: time to read weights  20.90 ms | time to do the math 0.141 ms
GPU: memory-bound ceiling ~48 tokens/s for one user

SRAM chips needed just to hold the weights: 305
each chip reads its 230 MB slice in 2.87 us
(real speed is then set by chip-to-chip hops, the compiler's schedule, and the KV cache, not by this raw read time)`,
          walkthrough: [
            { lines: [3, 10], note: "Per generated token, a 70B model in 8-bit must read 70 GB of weights but only performs about 140 GFLOPs." },
            { lines: [12, 18], note: "With illustrative figures for one modern HBM GPU (about 3.35 TB/s and about 1,000 TFLOP/s in low precision), reading the weights takes about 21 ms while the maths takes about 0.14 ms. Memory time is ~150× longer: the ceiling is roughly 48 tokens/s for a single user. (A 70 GB model would in practice be split over two such GPUs, which raises the ceiling, but the ratio stays the same.)" },
            { lines: [20, 28], note: "An SRAM-based design with about 230 MB per chip needs about 305 chips just to hold these weights, but each chip only reads its own slice, from very fast on-chip memory, in microseconds." },
            { lines: [29, 30], note: "That raw read time is not the real token time: passing activations from chip to chip, the static schedule and the KV cache add up. Still, the bottleneck has moved away from main-memory bandwidth." },
          ] },
        { type: "chart", kind: "hbar", title: "Where the time goes for one decode step on one GPU (70B, 8-bit)", xLabel: "Milliseconds", unit: " ms", labels: ["Reading weights from HBM", "Doing the arithmetic"], series: [{ name: "Time", values: [20.9, 0.14] }], caption: "From the program above, using illustrative hardware figures. Real kernels never reach peak bandwidth exactly, but the imbalance is the point." },
      ],
    },
    {
      id: "why-gpu-struggles",
      title: "Why a GPU struggles here",
      blocks: [
        { type: "p", text: "GPUs are superb at *throughput*: given many requests at once, they batch them so each weight read serves many users, and their compute units fill up. But for the *latency of one stream*, several things work against them:" },
        { type: "list", items: [
          "**Weights live in off-chip HBM.** HBM is very fast by memory standards (several TB/s), but every decode step must stream the entire model through it.",
          "**Dynamic hardware.** Caches, schedulers that pick which warps to run, and memory controllers that arbitrate between requests all make timing vary from run to run. Software has to leave slack for the worst case.",
          "**Kernel-by-kernel execution.** A forward pass is many separate kernel launches; small per-step overheads add up when a step must take only milliseconds.",
          "**Multi-GPU communication.** Big models are split across GPUs, and each decode step needs synchronisation between them, adding latency.",
          "**Batching trades latency for throughput.** Serving systems batch users together to use the hardware efficiently, which can make each individual stream slower.",
        ] },
        { type: "callout", tone: "note", title: "GPUs are not standing still", text: "Speculative decoding, better kernels, quantisation, faster interconnects and larger on-chip caches keep improving GPU decode speed. The LPU's advantage is about design trade-offs, not a law of nature." },
      ],
    },
    {
      id: "idea-1-on-chip",
      title: "Idea 1: keep the model on the chip",
      blocks: [
        { type: "p", text: "If reading weights from off-chip memory is the bottleneck, remove that memory from the critical path. The LPU stores model weights in **SRAM** (static RAM) built directly on the chip, right next to the compute units. Groq's first-generation chip has about **230 MB of SRAM** with on-chip memory bandwidth Groq quotes at up to roughly **80 TB/s** — over 20× the HBM bandwidth of a top GPU of the same era. Weights are not cached copies of something in DRAM: the SRAM *is* the main memory." },
        { type: "compare", title: "Where the weights live",
          options: [
            { name: "Off-chip HBM (GPU)", summary: "Large stacked DRAM beside the processor.", pros: ["Tens to hundreds of GB per chip", "One or a few chips hold a large model"], cons: ["Every decode step streams all weights across the memory interface", "Higher latency per access"], bestFor: "Big models on few chips; batched throughput; training" },
            { name: "On-chip SRAM (LPU)", summary: "Fast memory on the same silicon as the compute units.", pros: ["Far higher bandwidth and lower latency", "Predictable access time"], cons: ["Only hundreds of MB per chip", "Large models must be spread over many chips"], bestFor: "Low-latency decoding when we can afford many chips" },
          ],
          rows: [
            ["Capacity per chip", "~80 GB and up (varies by GPU)", "~230 MB (first-generation GroqChip)"],
            ["Bandwidth per chip", "A few TB/s", "Tens of TB/s (on-die)"],
          ],
          verdict: "SRAM swaps capacity for speed. That swap is the LPU's central bet." },
      ],
    },
    {
      id: "on-chip-memory-problem",
      title: "The problem with on-chip memory",
      blocks: [
        { type: "p", text: "SRAM is fast because each bit is stored in a handful of transistors right beside the logic. That also makes it **expensive in chip area**: a gigabyte of SRAM would need far more silicon than a single chip can hold. So each LPU chip holds only a sliver of a large model:" },
        { type: "list", items: [
          "A 70B-parameter model at 8 bits needs about 70 GB → roughly 300 chips at ~230 MB each, before counting the KV cache and activations (our code computed 305).",
          "Groq's public demos of 70B-class models ran on hundreds of chips across multiple racks.",
          "Long contexts and many concurrent users need KV-cache space too, which competes for the same scarce SRAM.",
        ] },
        { type: "p", text: "Spreading one model over hundreds of chips creates a new problem: the chips must pass activations to each other for every token, and any waiting at those hand-offs would destroy the speed gained from SRAM. The next two ideas address exactly that." },
        { type: "check", question: "Our shop considers running a 7B model in 8-bit on LPUs. About how many ~230 MB chips are needed just for the weights?", answer: "7 GB ÷ 0.23 GB ≈ 30.4, so about 31 chips — before leaving room for the KV cache. The same model fits on a single GPU with room to spare, which shows the trade-off clearly." },
      ],
    },
    {
      id: "idea-2-determinism",
      title: "Idea 2: remove all the guesswork",
      blocks: [
        { type: "p", text: "Conventional processors spend much of their chip area and energy *reacting* to the unknown: caches guess what data will be needed next, branch predictors guess which way code will go, schedulers decide at run time which work to run, and memory controllers arbitrate between competing requests. When a guess is wrong, the processor stalls." },
        { type: "p", text: "The LPU takes the opposite approach: **deterministic, software-scheduled execution**. Neural-network inference is extremely predictable — the same operations on the same-shaped tensors every time — so Groq's **compiler** works out, ahead of time, exactly which functional unit does what on which clock cycle, and exactly when each piece of data arrives where it is needed. The hardware has no caches and no dynamic scheduling; it simply follows the plan." },
        { type: "list", items: [
          "**Predictable latency:** a given program takes the same number of cycles every time, so performance can be known before running.",
          "**More silicon for useful work:** area that would hold caches and schedulers goes to compute and SRAM instead.",
          "**No stalls from mispredictions or cache misses**, because nothing is predicted and nothing misses.",
        ] },
      ],
    },
    {
      id: "idea-3-network",
      title: "Idea 3: a network that never waits",
      blocks: [
        { type: "p", text: "Determinism is extended *across* chips. In a typical cluster, chips send packets through switches that queue and route them dynamically, so arrival times vary, and receivers must wait and check. In Groq's design, chips are linked directly and the compiler also schedules chip-to-chip transfers: it knows, for each cycle, which link carries which data. Many chips can therefore behave like one very large, synchronised processor." },
        { type: "p", text: "Because transfers are planned, there is no need for handshakes or for buffering 'just in case', and the compiler can overlap communication with computation so data arrives at the next chip exactly when that chip is ready to use it." },
        { type: "callout", tone: "warn", title: "The cost of a fixed plan", text: "A static schedule is only as good as its assumptions. Changing the model, its size, or how it is split across chips means recompiling. Workloads with unpredictable behaviour cannot benefit as much, and the whole system must be engineered (clocks, links, failures) to keep the timetable reliable." },
      ],
    },
    {
      id: "assembly-line",
      title: "The assembly line",
      blocks: [
        { type: "p", text: "Inside a chip, the TSP/LPU layout looks less like a grid of independent cores and more like a factory floor. Functional units of the same kind are grouped into vertical **slices** — matrix-multiply units, vector units, memory units, data-reshaping (switch) units. Data **streams** horizontally across the chip, passing slice after slice. Each slice, following the compiler's instructions, reads the streams flowing past, works on them, and writes results back onto streams for the next slice." },
        { type: "flow", title: "An LPU as an assembly line (simplified)", nodes: [
          { label: "SRAM slices", detail: "Weights and activations are read from on-chip memory onto data streams at exactly the planned cycle." },
          { label: "Matrix units", detail: "Streams pass through matrix-multiply units that combine activations with weights." },
          { label: "Vector units", detail: "Element-wise steps such as activation functions, normalisation and softmax are applied as the data flows by." },
          { label: "Switch units", detail: "Data is reshaped, transposed or routed — including to links that carry it to the next chip." },
          { label: "Next chip / next layer", detail: "The stream continues on another chip holding the next part of the model, with no waiting at the hand-off." },
        ] },
        { type: "callout", tone: "analogy", title: "Like a car factory", text: "In a car factory, each station does one job — weld, paint, fit wheels — and the conveyor brings the car to each station exactly when it is ready. No worker hunts for parts; no car waits in a queue. Every token's computation rides such a conveyor through the chips." },
      ],
    },
    {
      id: "sending-a-prompt",
      title: "What happens when we send a prompt",
      blocks: [
        { type: "steps", title: "One request to an LPU-backed API", items: [
          { title: "Ahead of time: compile and load", text: "Before any user arrives, the model is compiled for a specific set of chips, and its weights are loaded and partitioned into the SRAM of all of them. They stay resident." },
          { title: "Request arrives", text: "Our support bot sends the prompt over the API. The host system tokenises it and sends the tokens into the chip network." },
          { title: "Prefill", text: "The prompt tokens stream through the layers spread across the chips, building the KV cache and producing the first output token." },
          { title: "Decode on the conveyor", text: "Each new token flows through every layer, chip to chip, on the pre-planned schedule. Weights are read from local SRAM; nothing waits for off-chip memory." },
          { title: "Stream back", text: "Tokens are sent back to our application as they are produced (streaming), so the customer sees the answer appear quickly." },
        ] },
      ],
    },
    {
      id: "why-fast",
      title: "Why an LPU is fast, all in one place",
      blocks: [
        { type: "table", caption: "Each design choice and what it buys", head: ["Design choice", "Effect on speed"], rows: [
          ["Weights in on-chip SRAM", "Removes the off-chip memory-bandwidth wall during decoding"],
          ["Model spread over many chips", "Aggregate SRAM bandwidth grows with the number of chips"],
          ["Compiler-scheduled execution", "No cache misses, mispredictions or run-time scheduling stalls; predictable latency"],
          ["Scheduled chip-to-chip network", "No queuing or handshakes at hand-offs between chips"],
          ["Streaming 'assembly line' layout", "Computation and data movement overlap continuously"],
        ] },
        { type: "p", text: "Independent benchmarks have generally shown LPU-based services among the highest output speeds per user for the open models they serve, often several times faster than typical GPU-based endpoints. Exact numbers change quickly with new models, software and GPU generations, so check current measurements before deciding." },
      ],
    },
    {
      id: "where-it-works",
      title: "Where an LPU works well, and where it does not",
      blocks: [
        { type: "compare", title: "Good and bad fits",
          options: [
            { name: "Works well", summary: "Latency-sensitive inference of supported models at scale.", pros: ["Real-time chat and voice assistants where every 100 ms matters", "Agent workflows that chain many LLM calls (speed compounds)", "Streaming long answers quickly", "Predictable latency requirements"], bestFor: "Serving popular open models via an API where speed per user is the priority" },
            { name: "Works poorly", summary: "Training, unusual models, or memory-hungry workloads.", cons: ["Training (it is an inference design)", "Very large models or very long contexts that need huge memory", "Rapidly changing custom architectures that must be recompiled", "Small deployments: many chips are needed even for modest models", "Workloads where cheap batched throughput matters more than latency"], bestFor: "Use GPUs or TPUs for these" },
          ],
          verdict: "LPUs specialise in fast decoding for supported models; GPUs remain the general-purpose workhorse." },
      ],
    },
    {
      id: "lpu-vs-gpu",
      title: "LPU vs GPU, and when to use which",
      blocks: [
        { type: "compare", title: "LPU vs GPU",
          options: [
            { name: "LPU", summary: "Deterministic, SRAM-based, many chips per model, inference only.", pros: ["Very high tokens/s per user", "Predictable, low latency"], cons: ["Small memory per chip: many chips per model", "Limited to models the compiler and platform support", "No training"], bestFor: "Latency-critical LLM serving" },
            { name: "GPU", summary: "Flexible, HBM-based, dynamic scheduling, trains and serves.", pros: ["Large memory per chip", "Runs almost any model; huge software ecosystem", "Training and inference", "Excellent batched throughput"], cons: ["Decode speed per user limited by HBM bandwidth", "Less predictable latency"], bestFor: "Training, fine-tuning, custom models, high-throughput batch serving" },
          ],
          rows: [
            ["Main memory for weights", "On-chip SRAM", "Off-chip HBM"],
            ["Scheduling", "Compiler, fixed ahead of time", "Hardware and runtime, dynamic"],
            ["Typical access", "Cloud API (or dedicated systems)", "Buy, rent, or use any cloud"],
          ],
          verdict: "Choose by the bottleneck we care about: per-user speed → LPU-style; flexibility, training and cost-efficient batching → GPU." },
        { type: "list", items: [
          "**Use an LPU service** when user-perceived speed is the product (voice, live chat, interactive agents), the model we need is offered, and an API fits our data rules.",
          "**Use GPUs** when we train or fine-tune, need a custom or very large model, must self-host on our own hardware, or care most about cost per token in large offline batches.",
          "**Use both** in a router: fast LPU-served models for interactive turns, GPU-served models for heavy or custom jobs.",
        ] },
        { type: "callout", tone: "example", title: "Decision for our shop", text: "For the live website chat, an LPU-backed API serving an open model is attractive: answers appear almost instantly. For nightly summarisation of thousands of tickets and for fine-tuning on our own data, GPUs are the better fit. The landscape also shifts quickly, and other vendors (for example Cerebras, with wafer-scale on-chip memory) pursue related SRAM-heavy ideas." },
      ],
    },
    {
      id: "worked-latency-budget",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Faster decoding sounds like a pure win, but how much of it does a customer actually feel? Let us build a **latency budget** for our shop's assistant and compare two endpoints: A streams 40 tokens per second and B streams 400. Both have the same fixed costs: 0.1 s of network time and 0.3 s until the first token. Every figure here is **illustrative**, chosen to make the arithmetic easy; none is a measurement of any real service." },
        { type: "formula", expr: "time to full answer = network + time to first token + output tokens ÷ tokens per second", caption: "Only the last term depends on decode speed." },
        { type: "steps", title: "Three situations, two endpoints", items: [
          { title: "A 300-token answer on A", text: "0.1 + 0.3 + 300 / 40 = 0.4 + 7.5 = **7.9 s**. Almost all of the wait is decoding." },
          { title: "The same answer on B", text: "0.1 + 0.3 + 300 / 400 = 0.4 + 0.75 = **1.15 s**. Decoding got 10× faster and the whole answer about 6.9× faster." },
          { title: "A 20-token reply", text: "A: 0.4 + 0.5 = 0.9 s. B: 0.4 + 0.05 = 0.45 s. Only **2×** faster. The fixed 0.4 s is now most of the wait, and no decode speed can remove it." },
          { title: "An agent that chains 6 calls", text: "Each call writes 150 tokens and must finish before the next begins. A: 6 × (0.4 + 3.75) = **24.9 s**. B: 6 × (0.4 + 0.375) = **4.65 s**. Waiting adds up across the chain, so speed compounds." },
          { title: "Ask who waits for the last token", text: "A person reading a streamed answer mostly cares when the first words appear. A program that needs the *complete* output before it can act (the next agent step, a tool call, a sentence to be spoken) waits for the final token. That is where decode speed pays off most." },
        ] },
        { type: "chart", kind: "bar", title: "Time to the full answer (illustrative)", yLabel: "Seconds", unit: " s", labels: ["20-token reply", "300-token answer", "Agent: 6 × 150 tokens"], series: [
          { name: "Endpoint A (40 tok/s)", values: [0.9, 7.9, 24.9] },
          { name: "Endpoint B (400 tok/s)", values: [0.45, 1.15, 4.65] },
        ], caption: "Computed from the formula above with 0.4 s of fixed overhead per call. The longer the output and the longer the chain, the more a fast decoder helps." },
        { type: "p", text: "The practical rule: before paying for per-user speed, write down the budget. If most of the wait is fixed overhead, shorten the prompt or move closer to the server first. If most of it is output tokens, and something is waiting for the last one, faster decoding is the right lever." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will turn the budget into a small calculator. It needs nothing but plain Python. We compute the wait for a single answer, for an agent chain, and then ask two sharper questions: how much of each wait is fixed overhead, and how much of a 10× faster decoder the user really feels." },
        { type: "code", lang: "python", title: "practice_latency_budget.py", code: `# A latency budget for our support assistant. All numbers are illustrative.

def answer_time(tokens, tokens_per_s, first_token_s=0.3, network_s=0.1):
    """Seconds until the full answer has arrived for one LLM call."""
    return network_s + first_token_s + tokens / tokens_per_s

speeds = {"endpoint A (40 tok/s)": 40, "endpoint B (400 tok/s)": 400}

# 1) One chat answer of 300 tokens
print("one 300-token answer")
for name, tps in speeds.items():
    print(f"  {name:23s}: {answer_time(300, tps):5.2f} s")

# 2) An agent that chains 6 calls of 150 tokens; each waits for the last
print("agent workflow: 6 calls x 150 tokens, one after another")
for name, tps in speeds.items():
    total = sum(answer_time(150, tps) for _ in range(6))
    print(f"  {name:23s}: {total:5.2f} s")

# 3) How much of the wait is NOT token generation?
print("share of the wait that is fixed overhead (network + first token)")
for tokens in (20, 300):
    for name, tps in speeds.items():
        total = answer_time(tokens, tps)
        fixed = 0.3 + 0.1
        print(f"  {tokens:3d} tokens, {name:23s}: {fixed / total:4.0%}")

# 4) Speed-up actually felt by the user when the chip is 10x faster
for tokens in (20, 300, 2000):
    gain = answer_time(tokens, 40) / answer_time(tokens, 400)
    print(f"10x faster decoding, {tokens:4d}-token answer: {gain:4.1f}x faster overall")`, output: `one 300-token answer
  endpoint A (40 tok/s)  :  7.90 s
  endpoint B (400 tok/s) :  1.15 s
agent workflow: 6 calls x 150 tokens, one after another
  endpoint A (40 tok/s)  : 24.90 s
  endpoint B (400 tok/s) :  4.65 s
share of the wait that is fixed overhead (network + first token)
   20 tokens, endpoint A (40 tok/s)  :  44%
   20 tokens, endpoint B (400 tok/s) :  89%
  300 tokens, endpoint A (40 tok/s)  :   5%
  300 tokens, endpoint B (400 tok/s) :  35%
10x faster decoding,   20-token answer:  2.0x faster overall
10x faster decoding,  300-token answer:  6.9x faster overall
10x faster decoding, 2000-token answer:  9.3x faster overall`,
          walkthrough: [
            { lines: [3, 7], note: "The whole model in one function: network time, time to first token, then output tokens divided by speed. Two made-up endpoints differ only in tokens per second." },
            { lines: [10, 18], note: "One 300-token answer, then an agent that makes 6 calls in a row. The chain multiplies every per-call wait by 6." },
            { lines: [21, 26], note: "The share of each wait that decoding cannot touch. For a 20-token reply on the fast endpoint, 89% of the wait is fixed overhead." },
            { lines: [29, 31], note: "The speed-up the user actually sees from 10× faster decoding: 2.0× for a short reply, 6.9× for 300 tokens, 9.3× for 2,000 tokens." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change the default `first_token_s` to `1.5`, as if every call carried a very long prompt. Predict whether the overall gain for a 300-token answer goes up or down from 6.9×.",
          "Add a third entry, `\"endpoint C (4000 tok/s)\": 4000`. Predict the time for one 300-token answer. Is C ten times better than B for the user?",
          "Change the agent to 20 calls of 50 tokens each. Predict both totals. Does the fast endpoint's advantage grow or shrink compared with 6 calls of 150?",
        ] },
        { type: "check", question: "In the run above, a 10× faster decoder made a 20-token reply only 2.0× faster. Why, and what would we change to speed up short replies?", answer: "Only the 'tokens ÷ speed' part of the budget shrinks. For 20 tokens that part was 0.5 s out of 0.9 s; the other 0.4 s (network plus time to first token) did not move. Short replies are limited by fixed overhead, so the useful changes are a shorter prompt (less prefill work), a server closer to the user, or reusing connections. More decode speed gives little." },
        { type: "check", question: "Every night we summarise 5,000 old tickets. Nobody is watching the output appear. Is tokens per second per user the right number to optimise?", answer: "No. Per-user speed matters when someone, or some program, is waiting on one stream. For an overnight batch what matters is total cost and total throughput: how many tokens the whole system produces per hour and per unit of money. Batching many requests together trades a slower individual stream for more total work, which is exactly the trade this job wants. That is why this lesson points such jobs to GPUs." },
      ],
    },
  ],
  quiz: [
    { q: "What limits the speed of generating tokens for a single user on a typical HBM-based GPU?", options: ["The number of arithmetic units available on the chip", "The time the tokenizer needs to split the prompt", "Memory bandwidth: each step reads all the weights", "Only the length of the prompt the user sent"], answer: 2, explain: "Batch-size-1 decoding does about 2 FLOPs per byte of weights read, so the compute units wait on memory. This is the bottleneck the LPU design targets." },
    { q: "What is the LPU's main idea for removing that bottleneck?", options: ["Keep the weights in on-chip SRAM across many chips", "Use larger HBM stacks next to a single big chip", "Compress the prompt before sending it to the model", "Train the model again with a lower learning rate"], answer: 0, explain: "On-chip SRAM has far higher bandwidth and lower latency than off-chip memory. The price is small capacity per chip, so models are partitioned across many chips." },
    { q: "Using the lesson's numbers, a 70B model in 8-bit (≈ 70 GB) on chips with ≈ 230 MB of SRAM each needs about how many chips just for the weights?", options: ["About 30", "About 3", "About 3,000", "About 300"], answer: 3, explain: "70 GB ÷ 0.23 GB ≈ 304, and the code rounded up to 305 chips. That is before any space for the KV cache." },
    { q: "Our team wants to fine-tune a custom-architecture model nightly and also run large offline batch jobs at the lowest cost per token. Which hardware fits better?", options: ["LPU, because it is the fastest per user", "GPU: training, custom models, cheap batching", "LPU, because it has more memory per chip", "Neither one can run language models at all"], answer: 1, explain: "LPUs are inference designs that excel at per-user speed for supported models. Training, custom architectures and cheap batch throughput are GPU strengths. LPUs have less memory per chip, not more." },
    { q: "Which statement about deterministic, compiler-scheduled execution is a misconception?", options: ["It lets the hardware drop caches and dynamic schedulers", "It makes the latency of a program predictable", "It adapts on the fly to any new model without recompiling", "It suits inference, which repeats the same shapes"], answer: 2, explain: "The schedule is fixed ahead of time for a specific model and chip layout; changing them requires recompiling. Adapting on the fly is what dynamic hardware does, at the cost of unpredictability." },
  ],
  takeaways: [
    "LLM decoding is sequential and memory-bandwidth-bound: each token reads all the weights for very little maths.",
    "The LPU keeps weights in on-chip SRAM, trading capacity for enormous bandwidth, so models span many chips.",
    "A compiler schedules every operation and every chip-to-chip transfer ahead of time: no caches, no guessing, no waiting.",
    "Data streams through slices of functional units like an assembly line, across chip boundaries.",
    "LPUs win on per-user speed for supported models; GPUs win on flexibility, training, memory capacity and batched cost.",
  ],
  terms: [
    { term: "LPU", def: "Language Processing Unit: Groq's inference chip design for fast LLM token generation." },
    { term: "Decode phase", def: "The token-by-token part of LLM generation, where each step depends on the previous token." },
    { term: "SRAM", def: "Fast static memory built on the processor chip; high bandwidth but small capacity." },
    { term: "HBM", def: "High Bandwidth Memory: stacked DRAM next to a GPU or TPU, large but slower than on-chip SRAM." },
    { term: "Deterministic execution", def: "Running a program whose timing is fully planned in advance, so it takes the same cycles every time." },
    { term: "Static scheduling", def: "A compiler deciding ahead of time which unit does what on which cycle, instead of hardware deciding at run time." },
    { term: "Tensor Streaming Processor", def: "Groq's architecture in which data streams across slices of specialised functional units." },
  ],
};
