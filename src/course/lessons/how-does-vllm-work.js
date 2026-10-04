export default {
  id: 'how-does-vllm-work',
  minutes: 27,
  hook: 'Why could the same GPU and the same model serve several times more users simply by changing how memory for past tokens is organised?',
  summary: 'vLLM is an open-source engine for serving LLMs to many users at once. Its core idea, PagedAttention, stores each request\'s KV cache in small fixed-size blocks that can live anywhere in GPU memory, like pages in an operating system, so almost no memory is wasted and identical prefixes can be shared. Combined with continuous batching and an OpenAI-compatible API server, this lets one GPU run far bigger batches and deliver much higher throughput.',
  sections: [
    {
      id: 'what-is-serving',
      title: 'What is serving an LLM',
      blocks: [
        { type: 'p', text: '**Serving** a model means running it as a service that answers requests from many users, usually over HTTP, around the clock. It is different from running a model for yourself in a notebook. A serving system must handle requests that arrive at random times, with prompts and answers of very different lengths, and must keep the expensive GPU busy while keeping each user\'s wait short.' },
        { type: 'p', text: 'Two numbers matter most. **Throughput** is how many tokens (or requests) per second the system produces in total; it decides the cost per user. **Latency** is how long a single user waits, often split into **time to first token (TTFT)** and **time per output token**. Good serving raises throughput without hurting latency too much.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a restaurant kitchen', text: 'One cook making one dish at a time leaves most burners idle. A good kitchen cooks many orders at once, starts a new order the moment a burner frees up, and keeps ingredients organised so no shelf space is wasted. vLLM is that well-run kitchen for a GPU.' },
        { type: 'p', text: 'Our running example: a company support assistant built on an 8B model, running on one 80 GB GPU, that must answer hundreds of customers at the same time.' },
      ],
    },
    {
      id: 'prefill-decode-kv-recap',
      title: 'A quick recap of prefill, decode and the KV cache',
      blocks: [
        { type: 'p', text: 'Each request goes through two phases. In **prefill**, the model processes the whole prompt in one pass and produces the first output token. In **decode**, it generates the rest one token at a time, each step depending on the previous token.' },
        { type: 'p', text: 'Attention lets each new token look at all earlier tokens through their **keys** and **values** (vectors computed in every layer). Recomputing them every step would be wasteful, so we store them: that store is the **KV cache**. It grows by one entry per layer for every token, and it lives in GPU memory for as long as the request is active.' },
        { type: 'viz', name: 'kv-cache', caption: 'Step through decoding: keys and values append for each new token. Use the calculator to see how memory grows with layers, heads and context length.' },
      ],
    },
    {
      id: 'kv-cache-eats-memory',
      title: 'The problem: the KV cache eats GPU memory',
      blocks: [
        { type: 'p', text: 'How big is it? For each token, each layer stores one key vector and one value vector for every **KV head**.' },
        { type: 'formula', expr: 'KV bytes per token = 2 × layers × KV heads × head dim × bytes per value', where: [ ['2', 'one key and one value'], ['layers', '32 for a Llama-3-8B-style model'], ['KV heads', '8 (grouped-query attention)'], ['head dim', '128'], ['bytes per value', '2 for FP16 / BF16'] ], caption: '2 × 32 × 8 × 128 × 2 = 131,072 bytes = 128 KiB per token.' },
        { type: 'p', text: 'At 128 KiB per token, one 2,000-token conversation needs about 250 MB, and 200 such conversations need about 50 GB. On our 80 GB GPU, the 8B model\'s weights take about 16 GB, so the KV cache, not the weights, decides how many users we can serve at once. Every wasted megabyte of KV memory is a user we cannot fit in the batch, and a smaller batch means lower throughput.' },
      ],
    },
    {
      id: 'naive-serving-waste',
      title: 'Why naive serving wastes memory',
      blocks: [
        { type: 'p', text: 'Earlier serving systems stored each request\'s KV cache in one **contiguous** chunk of memory. Because we do not know in advance how long an answer will be, they reserved space for the **maximum** possible length (say 2,048 tokens) up front. Three kinds of waste follow:' },
        { type: 'list', items: [
          '**Reservation waste:** space reserved for future tokens sits empty for the whole request, and if the answer stops early it is never used.',
          '**Internal fragmentation:** a request that ends at 300 tokens leaves 1,748 reserved slots unused.',
          '**External fragmentation:** as requests of different sizes come and go, free memory breaks into gaps too small for a new contiguous chunk.',
        ] },
        { type: 'p', text: 'The vLLM paper measured existing systems and found that only about 20–40% of KV cache memory actually held token states; the remaining 60–80% was wasted. The code later in this lesson reproduces this effect with a small simulation.' },
        { type: 'check', question: 'If a system reserves 2,048 tokens per request but requests actually average 350 tokens, roughly what fraction of KV memory is wasted?', answer: 'About 83%: only 350 / 2,048 ≈ 17% of the reserved space holds real tokens. That waste directly limits batch size, because the GPU runs out of reserved memory long before it runs out of real tokens.' },
      ],
    },
    {
      id: 'what-is-vllm',
      title: 'What is vLLM',
      blocks: [
        { type: 'p', text: '**vLLM** is an open-source library and server for fast, memory-efficient LLM inference. It came out of UC Berkeley\'s Sky Computing Lab in 2023, and its main idea was published in the paper *Efficient Memory Management for Large Language Model Serving with PagedAttention* (Kwon et al., SOSP 2023). It has since become one of the most widely used open-source serving engines, with contributors from many companies.' },
        { type: 'p', text: 'You give vLLM a model name from Hugging Face; it loads the weights onto the GPU(s), pre-allocates almost all remaining GPU memory as a pool of KV cache blocks, and starts a scheduler that keeps the GPU full of work. Users talk to it either through a Python API (`LLM(...).generate(...)` for offline batches) or through its OpenAI-compatible HTTP server.' },
      ],
    },
    {
      id: 'paged-attention',
      title: 'PagedAttention, the core idea',
      blocks: [
        { type: 'p', text: 'Operating systems solved a similar problem decades ago with **virtual memory and paging**: a program sees one continuous address space, but its memory is really stored in small fixed-size **pages** scattered around physical RAM, and a **page table** maps one to the other. vLLM applies the same idea to the KV cache.' },
        { type: 'steps', title: 'How PagedAttention stores a request', items: [
          { title: 'Cut the KV cache into blocks', text: 'GPU memory is divided into many fixed-size **KV blocks**, each holding the keys and values for a small number of tokens (16 by default).' },
          { title: 'Allocate on demand', text: 'A new request gets a block only when it needs one. A 40-token prompt takes 3 blocks; no space is reserved for future tokens.' },
          { title: 'Keep a block table', text: 'Each request has a **block table** mapping its logical blocks (block 0, 1, 2 of the sequence) to physical blocks anywhere in memory, like a page table.' },
          { title: 'Attend through the table', text: 'The PagedAttention GPU kernel reads keys and values block by block, following the block table, so the blocks do not need to be next to each other.' },
          { title: 'Free on finish', text: 'When a request ends, its blocks go straight back to the free pool for the next request.' },
        ] },
        { type: 'viz', name: 'paged-attention', caption: 'Requests grow and finish. Contiguous allocation leaves fragmented gaps; paged blocks pack memory tightly.' },
        { type: 'p', text: 'With paging, the only waste is the unused part of each request\'s **last** block: at most 15 token slots with a 16-token block size. The paper reports waste under 4%, compared with 60–80% before.' },
        { type: 'code', lang: 'python', title: 'paged_kv.py', code: `import math
import numpy as np

# KV cache size per token for a Llama-3-8B-like model (FP16):
layers, kv_heads, head_dim, bytes_per = 32, 8, 128, 2
per_token = 2 * layers * kv_heads * head_dim * bytes_per        # 2 = keys and values
print(f"KV cache per token: {per_token / 1024:.0f} KiB")

rng = np.random.default_rng(7)
max_len, block = 2048, 16                                       # reserve vs 16-token pages
lengths = rng.integers(50, 600, size=40)                        # real lengths of 40 requests
used = lengths.sum()
naive = max_len * len(lengths)                                  # reserve max_len slots each
paged = sum(math.ceil(n / block) * block for n in lengths)      # only whole pages actually used
for name, reserved in [("naive (reserve 2048)", naive), ("paged (16-token blocks)", paged)]:
    print(f"{name:24s} reserved {reserved * per_token / 2**30:5.2f} GiB, "
          f"waste {100 * (1 - used / reserved):4.1f}%")

# Block table: logical blocks of one request -> scattered physical blocks
free = list(rng.permutation(64))
def allocate(n_tokens):
    return [int(free.pop()) for _ in range(math.ceil(n_tokens / block))]
a = allocate(40)                    # 40 tokens -> 3 blocks
print("request A block table:", a)

# Prefix sharing: request B has the same 32-token system prompt (2 full blocks)
ref_count = {b: 1 for b in a}
b = a[:2] + allocate(20)            # reuse 2 shared blocks, allocate the rest
for blk in a[:2]:
    ref_count[blk] += 1
print("request B block table:", b)
print("shared blocks and reference counts:", {k: v for k, v in ref_count.items() if v > 1})`, output: `KV cache per token: 128 KiB
naive (reserve 2048)     reserved 10.00 GiB, waste 82.2%
paged (16-token blocks)  reserved  1.81 GiB, waste  2.1%
request A block table: [41, 9, 33]
request B block table: [41, 9, 37, 45]
shared blocks and reference counts: {41: 2, 9: 2}`, walkthrough: [
          { lines: [4, 7], note: 'KV bytes per token for an 8B Llama-style model with grouped-query attention: 128 KiB.' },
          { lines: [9, 17], note: 'Forty requests with random real lengths. Reserving 2,048 slots each wastes over 80% of memory; 16-token pages waste about 2%, only in each request\'s last block.' },
          { lines: [19, 23], note: 'A block table maps a request\'s logical blocks to whatever physical blocks were free. They need not be adjacent.' },
          { lines: [25, 31], note: 'Request B starts with the same 32-token prompt, so its block table points at the same two physical blocks. A reference count tracks how many requests use each block.' },
        ] },
        { type: 'chart', kind: 'bar', title: 'KV memory reserved for the same 40 requests', yLabel: 'GiB', unit: ' GiB', labels: ['Naive contiguous', 'Paged (16-token blocks)'], series: [ { name: 'Reserved', values: [10, 1.81] } ], caption: 'From the simulation above (illustrative request lengths). The memory saved can hold several times more concurrent requests.' },
      ],
    },
    {
      id: 'sharing-memory',
      title: 'How PagedAttention shares memory',
      blocks: [
        { type: 'p', text: 'Because a block table is just a list of pointers, two requests can point at the **same** physical block. vLLM uses this in several ways:' },
        { type: 'list', items: [
          '**Parallel sampling:** asking for 4 different answers to one prompt stores the prompt\'s KV blocks once, shared by all 4.',
          '**Beam search:** candidate beams share their common history and only diverge in their newest blocks.',
          '**Prefix caching:** requests that start with the same system prompt or document reuse its cached blocks instead of recomputing them. vLLM finds matches by hashing the token contents of each full block (automatic prefix caching).',
        ] },
        { type: 'p', text: 'Shared blocks carry a **reference count**. If one request needs to write into a shared block (for example its answer diverges inside a partially filled block), vLLM uses **copy-on-write**: it copies that one block, points the writer at the copy and decrements the count. Everyone else keeps the original. Memory is only duplicated where sequences actually differ.' },
        { type: 'callout', tone: 'example', title: 'In our support bot', text: 'Every conversation starts with the same 1,500-token system prompt full of policies. With prefix caching, those blocks are computed once and shared by every active conversation. That saves memory and also skips most of the prefill work, so time to first token drops noticeably.' },
      ],
    },
    {
      id: 'continuous-batching',
      title: 'Continuous batching',
      blocks: [
        { type: 'p', text: 'Memory efficiency only pays off if the scheduler fills that memory with work. Old-style **static batching** grouped, say, 8 requests, ran them together, and waited until the **longest** finished before starting the next group. Short requests finished early and left their slots idle.' },
        { type: 'p', text: 'vLLM uses **continuous batching** (also called iteration-level scheduling, an idea introduced by the Orca system in 2022). The scheduler re-forms the batch at **every decoding step**: finished requests leave immediately and waiting requests join right away, as long as free KV blocks exist. If memory runs out, vLLM **preempts** a request, either swapping its blocks out or freeing them and recomputing later, and resumes it when space frees up. Newer versions also split long prompts into chunks (**chunked prefill**) so a huge prompt does not stall everyone else\'s decoding.' },
        { type: 'viz', name: 'continuous-batching', caption: 'Compare GPU slot usage: static batching waits for the longest request, continuous batching refills slots as soon as they free up.' },
      ],
    },
    {
      id: 'openai-compatible-server',
      title: 'The OpenAI-compatible API server',
      blocks: [
        { type: 'p', text: 'vLLM ships an HTTP server that speaks the same API as OpenAI\'s, with endpoints such as `/v1/chat/completions`, `/v1/completions` and `/v1/models`. One command starts it, and any code written for the OpenAI client library can switch to it by changing the base URL.' },
        { type: 'code', lang: 'bash', title: 'Start a server and call it (needs a GPU and vLLM installed; no output shown)', code: `# Start the server (listens on port 8000 by default)
vllm serve meta-llama/Llama-3.1-8B-Instruct --max-model-len 8192

# From another terminal: a standard chat completion request
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "meta-llama/Llama-3.1-8B-Instruct",
       "messages": [{"role": "user", "content": "How do I reset my password?"}]}'` },
        { type: 'p', text: 'Behind that endpoint, vLLM applies the model\'s chat template, tokenizes, schedules the request into the running batch, streams tokens back (if `stream` is true) and handles stop sequences, sampling settings and structured output options.' },
      ],
    },
    {
      id: 'benefits-and-real-world',
      title: 'The benefits of vLLM, and vLLM in the real world',
      blocks: [
        { type: 'p', text: 'In the original paper, vLLM delivered about 2–4× higher throughput than the strongest earlier systems (FasterTransformer and Orca) at similar latency, and the launch announcement reported much larger gains over plain Hugging Face Transformers serving. Since then the project has added many features, so it is now a general-purpose serving platform:' },
        { type: 'list', items: [
          '**Memory efficiency:** PagedAttention, prefix caching, and quantized weights and KV cache (AWQ, GPTQ, FP8 and others).',
          '**Throughput and latency:** continuous batching, chunked prefill, optimized attention kernels, speculative decoding (including EAGLE-style drafters).',
          '**Scale:** tensor, pipeline and expert parallelism across multiple GPUs and nodes.',
          '**Breadth:** a large catalogue of Hugging Face model architectures, multimodal models, multi-LoRA serving, structured (JSON) output, and support for several hardware vendors beyond NVIDIA.',
          '**Ease of use:** one command for an OpenAI-compatible server.',
        ] },
        { type: 'compare', title: 'Naive serving vs vLLM', options: [
          { name: 'Naive serving', summary: 'Contiguous KV reservation per request plus static batches.', pros: ['Simple to implement'], cons: ['60–80% KV memory wasted', 'GPU idles waiting for the longest request', 'Small batches, low throughput'], bestFor: 'Single-user experiments' },
          { name: 'vLLM', summary: 'Paged KV blocks, sharing, and continuous batching.', pros: ['Near-zero KV waste', 'Prefix sharing', 'Much larger batches and higher throughput', 'OpenAI-compatible API'], cons: ['Built for GPUs, heavier than a local runner', 'Many tuning knobs'], bestFor: 'Production APIs serving many concurrent users' },
        ], rows: [ ['KV allocation', 'Max length up front, contiguous', '16-token blocks on demand'], ['Batching', 'Static groups', 'Re-formed every step'], ['Shared prompts', 'Recomputed per request', 'Cached and shared'] ], verdict: 'For multi-user GPU serving, vLLM-style paging and batching are now the baseline; the next lessons show SGLang and TensorRT-LLM building on the same ideas.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes and limits', text: 'Paging does not make memory infinite: a few very long conversations can still occupy most of the block pool and force other requests to wait or be preempted, and if --max-model-len is larger than the KV pool can hold for even one sequence, vLLM refuses to start. Size the context limit to your real traffic. Running another program on the same GPU breaks vLLM\'s memory budgeting (it claims a fraction of GPU memory set by --gpu-memory-utilization). And vLLM is not the right tool for a laptop without a suitable GPU: a local runner like llama.cpp fits that job better.' },
      ],
    },
    {
      id: "capacity-in-blocks",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The lesson's ideas become concrete once we count in blocks. Suppose that on our 80 GB GPU, after the weights are loaded, the pool of KV blocks comes to 60 GiB. That figure is illustrative; the real one depends on the settings. Everything else below follows from numbers the lesson already gave: 128 KiB per token and 16 tokens per block." },
        { type: "steps", title: "How many conversations fit in the pool?", items: [
          { title: "Size of one block", text: "16 tokens × 128 KiB = 2 MiB per block." },
          { title: "Blocks in the pool", text: "60 GiB ÷ 2 MiB = 30,720 blocks." },
          { title: "Short requests, paged", text: "A 350-token request needs ceil(350 ÷ 16) = 22 blocks. 30,720 ÷ 22 → 1,396 requests fit." },
          { title: "The same requests, reserved the old way", text: "Reserving 2,048 tokens each means 128 blocks per request. 30,720 ÷ 128 = 240 requests. Paging fits almost 6 times more." },
          { title: "Long conversations", text: "Our support chats reach 2,000 tokens: 125 blocks each. 30,720 ÷ 125 → 245 conversations." },
          { title: "Add prefix sharing", text: "1,500 of those tokens are the shared system prompt. It fills 93 whole blocks (1,488 tokens), stored once. Each chat then needs only the remaining 512 tokens: 32 blocks of its own. (30,720 − 93) ÷ 32 → 957 conversations." }
        ] },
        { type: "table", caption: "Conversations that fit in a 30,720-block pool (illustrative pool size)", head: ["Case", "Blocks per conversation", "Conversations that fit"], rows: [
          ["350 tokens, 2,048 reserved up front", "128", "240"],
          ["350 tokens, paged", "22", "1,396"],
          ["2,000 tokens, paged", "125", "245"],
          ["2,000 tokens, paged, 1,500-token prompt shared", "32 (+ 93 shared once)", "957"]
        ] },
        { type: "p", text: "Two details are easy to miss. Only **whole** blocks can be shared, because matching is done per full block. The last 12 tokens of the system prompt sit in a block that also holds the start of each chat, so every chat keeps its own copy of that block. And these counts assume every chat is at its full length at the same moment. The pool is a hard limit: when chats grow past what it can hold, some request has to wait or be preempted. The practice below shows that moment." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a toy serving loop that joins the two halves of this lesson: continuous batching and a pool of KV blocks. Four requests share a pool of only 12 blocks. A request is admitted when its tokens fit. Every step, each running request writes one token and takes a new block when its last block is full. If the pool is empty at that moment, our toy preempts the newest request and puts it back in the queue. That policy is our own simple choice for the demo." },
        { type: "code", lang: "python", title: "practice_block_pool_loop.py", code: `# A toy serving loop: continuous batching on top of a small pool of KV blocks.
import math
BLOCK, POOL = 16, 12        # tokens per block, blocks in the whole pool
# (name, tokens so far, output tokens still to write), all waiting at step 0
waiting = [("A", 40, 40), ("B", 30, 24), ("C", 60, 30), ("D", 20, 16)]
running, free, step = [], POOL, 0

def blocks(tokens):
    return math.ceil(tokens / BLOCK)

while waiting or running:
    while waiting and blocks(waiting[0][1]) <= free:    # admit while the tokens fit
        name, length, left = waiting.pop(0)
        free -= blocks(length)
        running.append([name, length, left])
        print(f"step {step:2d}: admit {name} with {length} tokens "
              f"({blocks(length)} blocks), free={free}")
    step += 1
    for r in list(running):                             # one decode step for each request
        if r not in running:
            continue                                    # it was preempted in this step
        if r[1] % BLOCK == 0 and free == 0:             # needs a block, the pool is empty
            victim = running.pop()                      # toy policy: preempt the newest
            free += blocks(victim[1])
            waiting.insert(0, tuple(victim))            # its tokens must be prefilled again
            print(f"step {step:2d}: preempt {victim[0]} at {victim[1]} tokens, free={free}")
            if victim is r:
                continue
        if r[1] % BLOCK == 0:
            free -= 1                                   # last block is full: take a new one
        r[1], r[2] = r[1] + 1, r[2] - 1                 # write one token
        if r[2] == 0:
            running.remove(r)
            free += blocks(r[1])                        # give every block back
            print(f"step {step:2d}: finish {r[0]} at {r[1]} tokens, free={free}")
print("all done at step", step)`, output: `step  0: admit A with 40 tokens (3 blocks), free=9
step  0: admit B with 30 tokens (2 blocks), free=7
step  0: admit C with 60 tokens (4 blocks), free=3
step  0: admit D with 20 tokens (2 blocks), free=1
step  5: preempt D at 24 tokens, free=2
step 19: preempt C at 78 tokens, free=5
step 24: finish B at 54 tokens, free=8
step 24: admit C with 78 tokens (5 blocks), free=3
step 24: admit D with 24 tokens (2 blocks), free=1
step 27: preempt D at 26 tokens, free=2
step 36: finish C at 90 tokens, free=7
step 36: admit D with 26 tokens (2 blocks), free=5
step 40: finish A at 80 tokens, free=10
step 46: finish D at 36 tokens, free=12
all done at step 46`, walkthrough: [
          { lines: [1, 9], note: "A pool of 12 blocks of 16 tokens, and four waiting requests. Each has a current length and a number of tokens still to write." },
          { lines: [11, 17], note: "Admission at the start of every step: take requests from the queue while the blocks for their current tokens are free." },
          { lines: [19, 28], note: "A running request whose last block is full needs a new block. If none is free, the newest request loses its blocks and goes back to the front of the queue." },
          { lines: [29, 36], note: "Take the new block if needed, write one token, and return every block to the pool when the request finishes." }
        ] },
        { type: "p", text: "All four requests are admitted at step 0, because their prompts need only 11 blocks. But their final lengths need 18. So the pool runs dry as they grow: D is preempted at step 5, C at step 19, and D again at step 27. Now change it:" },
        { type: "list", items: [
          "Set `POOL = 18`. Predict the number of preemptions and the step at which everything is done, then check.",
          "Be more careful at admission: change the test to `blocks(waiting[0][1]) + 2 <= free`, which keeps two blocks spare. Predict which request now waits at step 0 and whether the preemptions go away.",
          "Change the policy to preempt the oldest request: use `running.pop(0)`. Predict which request suffers now. Why is throwing away the longest-running request more costly?"
        ] },
        { type: "check", question: "In the practice run, request D was preempted twice. What does each preemption cost, and what does that say about how to size a server?", answer: "Each time, D's blocks are freed and its tokens must be prefilled again later, so the earlier work on them is wasted, and D's user waits while it sits in the queue. Preemption keeps the server alive when the pool is full, but it is a safety valve, not a normal mode. We should set context limits and concurrency so that the pool rarely runs dry." },
        { type: "check", question: "A teammate personalises the support bot by putting the customer's name at the very start of the prompt, before the 1,500-token policy text. What happens to the 957 conversations from the worked example?", answer: "Sharing is lost. A prefix can be reused only when the tokens match from the very first one, and now every prompt starts differently, so no block of the policy text matches another chat's block. Each conversation needs all 125 blocks again and capacity falls back to about 245. Putting the name after the shared text keeps the sharing." }
      ]
    },
  ],
  quiz: [
    { q: "What problem does PagedAttention mainly solve?", options: ["Slow tokenization of long prompts before the first prefill can start", "Waste and fragmentation from reserving one contiguous max-length KV cache per request", "Accuracy loss in quantized models from rounding the attention scores", "The cost of training a separate draft model for speculative decoding"], answer: 1, explain: "Contiguous, max-length reservation wasted 60–80% of KV memory in earlier systems. Paging allocates small blocks on demand and maps them with a block table, cutting waste to a few percent." },
    { q: 'A model has 32 layers, 8 KV heads, head dimension 128 and FP16 values. How much KV cache does one token need?', options: ['32 KiB', '64 KiB', '256 KiB', '128 KiB'], answer: 3, explain: '2 × 32 × 8 × 128 × 2 bytes = 131,072 bytes = 128 KiB. Forgetting the factor 2 for keys and values gives 64 KiB.' },
    { q: "Our support bot sends the same 1,500-token system prompt with every conversation. Which vLLM feature helps most?", options: ["Prefix caching, so those KV blocks are computed once and shared", "Static batching, so requests with the same prompt run together", "Raising the block size to 2,048 tokens so the prompt fits one block", "Turning off the KV cache so the prompt is not stored per request"], answer: 0, explain: "With prefix caching, block tables of new requests point to the already-computed blocks for the shared prompt, saving memory and prefill time. Huge blocks would bring back fragmentation, and disabling the KV cache would make decoding far slower." },
    { q: "How does continuous batching differ from static batching?", options: ["It batches together only those requests that share an identical prompt text", "It processes one request at a time to keep each request's latency low", "It re-forms the batch each step, so done requests leave and new ones join", "It requires every request in the batch to have the same output length"], answer: 2, explain: "Continuous (iteration-level) batching adds and removes requests every decoding step. Static batching waits for the longest request in the group, leaving finished slots idle." },
    { q: "A colleague says: \"With PagedAttention, two requests sharing a prompt can corrupt each other if one of them writes new tokens.\" Why is this not a problem?", options: ["vLLM keeps a private copy of every block per request, so nothing is shared", "Shared blocks are reference-counted and copy-on-write, so a writer first gets its own copy", "Requests that share a prompt are placed on different GPUs, so they stay apart", "Keys and values become read-only after training, so no request can write them"], answer: 1, explain: "Shared blocks are reference-counted; before writing into one that others also use, vLLM copies it for the writer (copy-on-write). Other requests keep the original, so sharing is safe." },
  ],
  takeaways: [
    'Serving many users is limited by KV cache memory, which grows with every token of every active request.',
    'Naive contiguous max-length reservation wasted 60–80% of KV memory; PagedAttention cuts waste to a few percent.',
    'PagedAttention stores KV in small blocks mapped by a block table, like OS virtual memory pages.',
    'Block sharing with reference counts and copy-on-write enables prefix caching, parallel sampling and beam search.',
    'Continuous batching plus an OpenAI-compatible server make vLLM a high-throughput, drop-in serving engine.',
  ],
  terms: [
    { term: 'Serving', def: 'Running a model as a service that answers many users\' requests concurrently.' },
    { term: 'KV cache', def: 'Stored keys and values of earlier tokens, reused at every decoding step to avoid recomputation.' },
    { term: 'PagedAttention', def: 'vLLM\'s method of storing the KV cache in fixed-size blocks anywhere in memory, mapped by a block table.' },
    { term: 'Block table', def: 'A per-request list mapping logical KV blocks to physical blocks in GPU memory.' },
    { term: 'Copy-on-write', def: 'Sharing a block until someone needs to change it, then giving the writer its own copy.' },
    { term: 'Continuous batching', def: 'Re-forming the batch at every decoding step so requests join and leave without waiting for each other.' },
  ],
};
