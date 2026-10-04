export default {
  id: 'how-does-tensorrt-llm-work',
  minutes: 26,
  hook: 'If a GPU can do trillions of operations per second, why does it often sit idle while serving an LLM, and how does NVIDIA\'s TensorRT-LLM get that time back?',
  summary: 'TensorRT-LLM is NVIDIA\'s open-source library for running LLMs as fast as possible on NVIDIA GPUs. It prepares the model ahead of time (fusing operations into fewer kernels, picking the fastest kernel for each operation, and using low-precision formats like FP8), then serves it with a paged KV cache, in-flight batching, CUDA graphs, speculative decoding and multi-GPU parallelism. Newer versions add a PyTorch backend that keeps most of the speed without a separate build step.',
  sections: [
    {
      id: 'what-is-inference',
      title: 'What is inference',
      blocks: [
        { type: 'p', text: '**Inference** means using a trained model to produce outputs, as opposed to **training**, which adjusts its weights. For an LLM, inference is: take a prompt, run the **prefill** phase (process all prompt tokens at once and fill the **KV cache**, the stored keys and values of past tokens), then run the **decode** phase (produce one token at a time until done).' },
        { type: 'p', text: 'Inference is where the money goes in production: a model is trained once, but it may answer billions of requests. A 2× faster inference engine can halve the GPU bill or double the number of users. That is the job TensorRT-LLM was built for.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a pit crew', text: 'A race car (the GPU) is incredibly fast, but races are often lost in the pits. A great pit crew rehearses every move in advance, combines tasks, and never leaves the car waiting. TensorRT-LLM is the pit crew: it plans and rehearses the model\'s work ahead of time so the GPU spends its time racing, not waiting.' },
        { type: 'p', text: 'Our running example: a company serves a 70B chat model on a server with 8 NVIDIA H100 GPUs and wants the most tokens per second per dollar while keeping replies snappy.' },
      ],
    },
    {
      id: 'gpu-and-kernel',
      title: 'What is a GPU and what is a kernel',
      blocks: [
        { type: 'p', text: 'A **GPU** is a processor with thousands of small cores designed to do the same operation on lots of data at once. It also has its own fast memory (**HBM**, high-bandwidth memory) where the model\'s weights and KV cache live. Data must be read from HBM into the cores to be used, and that reading has a limited speed (the **memory bandwidth**).' },
        { type: 'p', text: 'A **kernel** is one function that runs on the GPU, such as "multiply these two matrices" or "add a bias and apply an activation". The CPU tells the GPU to run kernels one after another; each such request is a **kernel launch**, and each launch costs a few microseconds of overhead. A single forward pass through a transformer can launch hundreds of kernels.' },
        { type: 'viz', name: 'gpu-parallel', caption: 'A CPU with a few powerful cores vs a GPU with many simple cores working through the same matrix.' },
      ],
    },
    {
      id: 'the-problem',
      title: 'The problem: the GPU spends its time on the wrong things',
      blocks: [
        { type: 'p', text: 'Run a model naively (for example, plain PyTorch, one operation at a time) and the GPU wastes much of its time:' },
        { type: 'list', items: [
          '**Moving data, not computing:** each small operation reads its input from HBM and writes its output back, only for the next operation to read it again. Many operations do very little maths per byte moved.',
          '**Waiting for launches:** during decode each kernel finishes in microseconds, so the CPU\'s launch overhead and Python code can become the bottleneck, leaving the GPU idle between kernels.',
          '**Generic kernels:** a one-size-fits-all kernel is rarely the fastest for a particular matrix shape and GPU model.',
          '**Too many bits:** 16-bit weights and KV cache take twice the memory and bandwidth of 8-bit ones.',
          '**Poor batching and memory use:** without paging and continuous batching, memory is wasted and batches stay small.',
        ] },
        { type: 'check', question: 'During decode with a small batch, a matrix multiply finishes in 8 microseconds and a kernel launch costs 5 microseconds of CPU time. What happens if the CPU cannot launch ahead of the GPU?', answer: 'The GPU spends a large share of its time idle, waiting for the next launch: roughly 5 of every 13 microseconds (around 40%) are pure overhead. Reducing the number of launches (fusion) or removing launch overhead (CUDA graphs) recovers that time.' },
      ],
    },
    {
      id: 'what-is-tensorrt-llm',
      title: 'What is TensorRT-LLM, and the big idea',
      blocks: [
        { type: 'p', text: '**TensorRT-LLM** is an open-source library from NVIDIA (first released in late 2023, Apache-2.0 licensed) for high-performance LLM inference on NVIDIA GPUs. It builds on **TensorRT**, NVIDIA\'s long-standing deep-learning compiler and runtime, and on techniques from NVIDIA\'s earlier FasterTransformer library. It provides optimized model definitions for many popular LLM families, a Python **LLM API**, a C++ runtime with a batch scheduler, and serving integrations.' },
        { type: 'p', text: 'The big idea is to **prepare the model ahead of time** for one specific situation: this model, this GPU type, this precision, these maximum batch and sequence sizes. With all of that fixed, the compiler can make aggressive choices (fuse operations, pick the fastest kernels, plan memory) that a general framework, which must handle anything at any moment, cannot.' },
        { type: 'compare', title: 'Eager framework vs ahead-of-time engine', options: [
          { name: 'Eager PyTorch', summary: 'Runs each operation as Python code calls it.', pros: ['Flexible and easy to debug', 'Change anything at any time'], cons: ['Many separate kernels and launches', 'Generic kernels', 'Python overhead'], bestFor: 'Research and development' },
          { name: 'TensorRT-LLM engine', summary: 'Compiles the model for a fixed GPU, precision and size limits.', pros: ['Fused, auto-tuned kernels', 'Low-precision formats', 'Minimal overhead'], cons: ['Build step takes time', 'Rebuild for new GPU types or limits', 'NVIDIA-only'], bestFor: 'High-volume production on NVIDIA GPUs' },
        ], verdict: 'Ahead-of-time preparation trades flexibility for speed. The newer PyTorch backend (later in this lesson) narrows that trade-off.' },
      ],
    },
    {
      id: 'build-step',
      title: 'The build step: from a model to an engine',
      blocks: [
        { type: 'steps', title: 'The classic TensorRT-LLM workflow', items: [
          { title: 'Start from a checkpoint', text: 'Take a model from Hugging Face (safetensors weights plus config).' },
          { title: 'Convert and optionally quantize', text: 'Convert the weights into TensorRT-LLM\'s checkpoint format for the target parallelism (for example split for 8 GPUs), and optionally quantize them, for example to FP8 using NVIDIA\'s Model Optimizer with a small calibration set.' },
          { title: 'Build the engine', text: 'Run `trtllm-build` with limits such as max batch size, max input and output length, and plugins to enable. TensorRT fuses layers, tries candidate kernels for each operation on the real GPU and keeps the fastest, and plans memory.' },
          { title: 'Get an engine file', text: 'The result is a serialized **engine**: an optimized execution plan tied to that GPU architecture, TensorRT-LLM version, precision and limits.' },
          { title: 'Run it', text: 'The runtime loads the engine and serves requests with the batch scheduler, paged KV cache and the other features below.' },
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Building an engine on one GPU type and copying it to another, or building with a max sequence length of 2,048 and then sending 8,000-token prompts. Engines are specific to the GPU architecture, the library version and the limits they were built with. Plan the limits from real traffic, and rebuild when hardware or versions change.' },
      ],
    },
    {
      id: 'kernel-fusion',
      title: 'Kernel fusion',
      blocks: [
        { type: 'p', text: '**Kernel fusion** merges several small operations into one kernel. Instead of "add bias, write to memory; read, apply GELU, write; read, add residual, write", a fused kernel reads the inputs once, does all three steps while the data sits in fast on-chip registers, and writes the result once. Fewer launches and far less memory traffic, with exactly the same maths.' },
        { type: 'code', lang: 'python', title: 'fusion_and_graphs.py', code: `import numpy as np

rng = np.random.default_rng(1)
x = rng.normal(size=(8, 4096)).astype(np.float16)        # activations for 8 tokens
bias = rng.normal(size=4096).astype(np.float16)
resid = rng.normal(size=(8, 4096)).astype(np.float16)

def gelu(v):                                              # tanh approximation of GELU
    return 0.5 * v * (1 + np.tanh(0.79788456 * (v + 0.044715 * v ** 3)))

# Unfused: three separate "kernels", each reads inputs from memory and writes a result back.
t1 = x + bias                                             # kernel 1
t2 = gelu(t1)                                             # kernel 2
out_unfused = t2 + resid                                  # kernel 3
# Fused: one kernel reads x, bias, resid once and writes the final result once.
out_fused = gelu(x + bias) + resid
print("same result:", np.allclose(out_unfused, out_fused))

n = x.nbytes                                              # bytes in one 8 x 4096 FP16 tensor
unfused_traffic = (n + bias.nbytes + n) + (n + n) + (n + n + n)  # reads + writes per kernel
fused_traffic = n + bias.nbytes + n + n                   # read x, bias, resid; write out
print(f"memory traffic: unfused {unfused_traffic / 1024:.0f} KiB, fused {fused_traffic / 1024:.0f} KiB "
      f"({unfused_traffic / fused_traffic:.1f}x less)")

# Launch overhead: decoding one token in a 32-layer model may launch hundreds of kernels.
layers, kernels_per_layer, launch_us, gpu_work_us = 32, 15, 5.0, 2500.0   # illustrative
launches = layers * kernels_per_layer
cpu_us = launches * launch_us
print(f"{launches} kernel launches -> {cpu_us / 1000:.1f} ms of launch overhead per token")
for name, overhead in [("eager launches", cpu_us), ("one CUDA graph replay", launch_us)]:
    total = gpu_work_us + overhead
    print(f"{name:22s}: {total / 1000:.2f} ms/token -> {1e6 / total:5.0f} tokens/s")`, output: `same result: True
memory traffic: unfused 456 KiB, fused 200 KiB (2.3x less)
480 kernel launches -> 2.4 ms of launch overhead per token
eager launches        : 4.90 ms/token ->   204 tokens/s
one CUDA graph replay : 2.50 ms/token ->   399 tokens/s`, walkthrough: [
          { lines: [3, 9], note: 'Inputs for 8 tokens with hidden size 4,096 in FP16, and the tanh approximation of GELU used by many models.' },
          { lines: [11, 17], note: 'Unfused and fused versions compute the same values; fusion changes how the work is scheduled, not the maths.' },
          { lines: [19, 23], note: 'Count bytes moved through GPU memory. Each unfused kernel reads its inputs and writes an intermediate result; the fused kernel touches memory only for the true inputs and the final output: 2.3× less traffic.' },
          { lines: [25, 32], note: 'A simplified launch-overhead model (illustrative numbers, assuming launches are not hidden behind GPU work): 480 launches cost 2.4 ms per token; replaying a captured CUDA graph costs about one launch.' },
        ] },
        { type: 'p', text: 'TensorRT performs many fusions automatically, and TensorRT-LLM adds hand-written fused kernels for the hot spots of transformers: fused attention, fused normalization plus quantization, fused gated MLP activations, and fused mixture-of-experts routing among others.' },
      ],
    },
    {
      id: 'quantization-and-attention',
      title: 'Quantization and custom attention kernels',
      blocks: [
        { type: 'p', text: '**Quantization** stores numbers in fewer bits. TensorRT-LLM supports many recipes and matches each to hardware that can run it fast:' },
        { type: 'table', caption: 'Common TensorRT-LLM precision options (support depends on GPU generation and version)', head: ['Recipe', 'What is low-precision', 'Notes'], rows: [
          ['FP8', 'Weights and activations (and optionally KV cache) in 8-bit floating point', 'Runs on FP8 tensor cores of Ada/Hopper/Blackwell GPUs; a popular near-lossless default'],
          ['NVFP4', '4-bit floating point with fine-grained scales', 'Blackwell-generation GPUs'],
          ['INT8 SmoothQuant', 'Weights and activations in INT8, outliers smoothed into weights', 'Works on older GPUs too'],
          ['INT4 AWQ / GPTQ, INT8 / INT4 weight-only', 'Weights only; activations stay 16-bit', 'Cuts memory for memory-bound decode'],
          ['FP8 / INT8 KV cache', 'The stored keys and values', 'Fits more tokens and users in memory'],
        ] },
        { type: 'p', text: '**Custom attention kernels** matter because attention is where prefill and decode behave very differently. For prefill, TensorRT-LLM uses fused multi-head attention kernels in the spirit of FlashAttention: compute attention in tiles that stay in on-chip memory instead of writing the full attention matrix to HBM. For decode, where each request has one new query token attending over a long KV cache, it uses specialised kernels (such as its XQA kernels) tuned for multi-query and grouped-query attention, so the many query heads that share one KV head read that cached data efficiently.' },
      ],
    },
    {
      id: 'kv-batching-graphs',
      title: 'The paged KV cache, in-flight batching and CUDA graphs',
      blocks: [
        { type: 'p', text: '**Paged KV cache.** Like vLLM\'s PagedAttention, TensorRT-LLM stores the KV cache in fixed-size blocks allocated on demand, instead of reserving one contiguous max-length region per request. This removes most memory waste and lets blocks be **reused** across requests that share a prefix, such as a common system prompt (KV cache reuse).' },
        { type: 'p', text: '**In-flight batching** is NVIDIA\'s name for **continuous batching**: the batch is re-formed at every iteration, so finished requests leave and new ones join immediately. Requests in their prefill phase and requests in decode can be processed in the same batch, and long prompts can be split into chunks so they do not stall everyone else.' },
        { type: 'viz', name: 'continuous-batching', caption: 'Static batching waits for the longest request; in-flight (continuous) batching refills free slots every step.' },
        { type: 'p', text: '**CUDA graphs.** A CUDA graph records a whole sequence of kernel launches once (capture) and then replays the entire sequence with a single launch. Decode steps repeat the same kernels every token, so TensorRT-LLM captures graphs for common batch sizes and replays them, removing most per-kernel CPU overhead. In the simplified model above, that alone roughly doubled the token rate.' },
        { type: 'chart', kind: 'bar', title: 'Simplified per-token time, eager launches vs CUDA graph', yLabel: 'ms per token', unit: ' ms', labels: ['Eager launches', 'CUDA graph replay'], series: [ { name: 'GPU work', values: [2.5, 2.5] }, { name: 'Launch overhead', values: [2.4, 0.005] } ], caption: 'Illustrative numbers from the code above. Real overhead depends on model size, batch size and how well the CPU can run ahead.' },
      ],
    },
    {
      id: 'speculative-and-multi-gpu',
      title: 'Speculative decoding and running one model across many GPUs',
      blocks: [
        { type: 'p', text: '**Speculative decoding** uses spare GPU compute during decode: something cheap drafts several tokens and the main model verifies them in one pass, keeping the output unchanged. TensorRT-LLM supports several drafting methods, including a separate draft model, Medusa heads, EAGLE-style drafters, ReDrafter, lookahead decoding, and multi-token-prediction modules for models trained with them. Availability varies by backend and version.' },
        { type: 'p', text: 'A 70B model in FP16 needs about 140 GB for weights alone, more than one 80 GB GPU. TensorRT-LLM splits models across GPUs in three main ways:' },
        { type: 'list', items: [
          '**Tensor parallelism (TP):** each weight matrix is split across GPUs; every GPU computes part of every layer and they exchange results after each layer over fast links (NVLink). Lowers latency, but needs fast interconnect.',
          '**Pipeline parallelism (PP):** different GPUs hold different layers; requests flow through them like an assembly line. Less communication, useful across nodes.',
          '**Expert parallelism (EP):** for mixture-of-experts models, different experts live on different GPUs and tokens are routed to them.',
        ] },
        { type: 'callout', tone: 'example', title: 'Our 70B model', text: 'In FP8 the 70B model\'s weights are about 70 GB. With tensor parallelism of 8 on the H100 server, each GPU holds about 9 GB of weights, leaving most of its memory for the KV cache, so many users fit at once. Alternatively the team could run two copies with TP 4 each, trading per-request latency for more independent capacity.' },
      ],
    },
    {
      id: 'serving-and-pytorch-backend',
      title: 'How we serve the model, and the PyTorch backend',
      blocks: [
        { type: 'p', text: 'An engine is not a web service by itself. Common ways to put TensorRT-LLM behind an API:' },
        { type: 'list', items: [
          '**trtllm-serve:** a built-in OpenAI-compatible HTTP server (chat and completions endpoints).',
          '**Triton Inference Server** with the TensorRT-LLM backend: NVIDIA\'s general model server, with metrics, multiple models and ensembles (for example tokenizer, model and detokenizer as one pipeline).',
          '**Higher-level NVIDIA offerings** such as NIM microservices and the Dynamo distributed serving framework use TensorRT-LLM (among other engines) under the hood.',
        ] },
        { type: 'p', text: 'The classic engine-build workflow is powerful but heavy: long builds, rebuilds for every change, and model code written in TensorRT-LLM\'s own graph-building API. So the project added a **PyTorch backend**: models are written in ordinary PyTorch, then accelerated with TensorRT-LLM\'s custom kernels (attention, fused MoE, quantized GEMMs), CUDA graphs, the paged KV cache, in-flight batching and speculative decoding, without a separate engine-compilation step. During 2025 this became the recommended default path, accessed through the high-level LLM API.' },
        { type: 'code', lang: 'python', title: 'llm_api.py (needs an NVIDIA GPU and the tensorrt_llm package; no output shown)', code: `from tensorrt_llm import LLM, SamplingParams

# Loads a Hugging Face model and prepares it for fast inference on the local GPU(s).
llm = LLM(model="meta-llama/Llama-3.1-8B-Instruct")

params = SamplingParams(temperature=0.7, max_tokens=64)
for out in llm.generate(["How do I reset my password?"], params):
    print(out.outputs[0].text)` },
        { type: 'flow', title: 'The full journey of one request', nodes: [
          { label: 'HTTP request', detail: 'A client calls the OpenAI-compatible endpoint (trtllm-serve or Triton) with a chat message.' },
          { label: 'Tokenize', detail: 'The chat template is applied and text becomes token IDs.' },
          { label: 'Schedule', detail: 'The in-flight batch scheduler admits the request when KV blocks are available, reusing cached blocks for any shared prefix.' },
          { label: 'Prefill', detail: 'Fused attention kernels process the prompt (possibly in chunks) across the tensor-parallel GPUs, filling the paged KV cache in FP8.' },
          { label: 'Decode', detail: 'Each step replays a CUDA graph; speculative drafts may be verified; decode attention kernels read the paged cache.' },
          { label: 'Stream back', detail: 'Tokens are detokenized and streamed to the client; when the request finishes, its KV blocks are freed or kept for reuse.' },
        ] },
      ],
    },
    {
      id: 'vs-vllm-and-limits',
      title: 'TensorRT-LLM vs vLLM, and where it works well or fails',
      blocks: [
        { type: 'compare', title: 'TensorRT-LLM vs vLLM', options: [
          { name: 'TensorRT-LLM', summary: 'NVIDIA\'s engine, deeply tuned for NVIDIA GPUs.', pros: ['Often top performance on NVIDIA hardware', 'Early support for new NVIDIA features (FP8, FP4)', 'Hand-tuned kernels'], cons: ['NVIDIA GPUs only', 'More complex setup, especially the engine-build path', 'Smaller model catalogue for brand-new architectures'], bestFor: 'Large NVIDIA fleets where every percent of throughput matters' },
          { name: 'vLLM', summary: 'Community engine built around PagedAttention.', pros: ['Very easy to start', 'Huge model catalogue', 'Several hardware vendors supported'], cons: ['May trail hand-tuned NVIDIA kernels in some cases', 'Fewer vendor-specific tricks'], bestFor: 'Fast iteration, broad models, mixed hardware' },
        ], rows: [ ['Hardware', 'NVIDIA only', 'NVIDIA, AMD and others'], ['Setup', 'Engine build or PyTorch backend', 'pip install and serve'], ['Core serving ideas', 'Paged KV, in-flight batching', 'PagedAttention, continuous batching'], ['API server', 'trtllm-serve, Triton', 'vllm serve'] ], verdict: 'Both share the same core ideas. Benchmark on your own model, GPU and traffic: the winner varies by case and by release.' },
        { type: 'p', text: '**Where it works well:** stable, high-volume production on modern NVIDIA GPUs; models with first-class support; latency-sensitive services that benefit from FP8/FP4, CUDA graphs and speculative decoding; large multi-GPU deployments.' },
        { type: 'p', text: '**Where it struggles:** non-NVIDIA hardware (not supported); very new or custom architectures without an optimized implementation; fast-changing experiments where rebuilding engines slows the team down; small teams for whom setup and tuning effort outweighs a modest speed gain.' },
        { type: 'callout', tone: 'tip', title: 'Further learning', text: 'Deep-dive: revisit the KV Cache, Paged Attention, and Continuous Batching lessons in this module to see how TensorRT-LLM combines all three for maximum GPU utilization.' },
      ],
    },
  ],
  quiz: [
    { q: "What is the main purpose of kernel fusion?", options: ["To combine several operations into one kernel, saving memory round trips and launches", "To merge the weights of two different models into a single engine", "To split one kernel across many GPUs so that each GPU handles a slice of the work", "To reduce the vocabulary size so the output layer becomes cheaper"], answer: 0, explain: "Fusion keeps data in fast on-chip storage between steps and cuts launches. In our example it reduced memory traffic 2.3× with identical results. Splitting across GPUs is tensor parallelism, a different technique." },
    { q: "A team built a TensorRT-LLM engine with max input length 2,048 on an A100, then copied it to an H100 server and sends 8,000-token prompts. What should they expect?", options: ["It works as is, and the engine automatically retunes itself for the new GPU and inputs", "It runs faster as is, because the H100 is newer and supports longer inputs", "Problems: engines are tied to the GPU, versions and build limits, so they must rebuild", "Only the tokenizer needs updating to handle the longer 8,000-token prompts"], answer: 2, explain: "A classic engine is an optimized plan for one GPU architecture, library version and set of limits. A new GPU type or longer inputs require a rebuild (or using the PyTorch backend, which avoids a separate build)." },
    { q: 'Decoding launches 480 kernels per token at 5 µs each, and the GPU work takes 2.5 ms per token. In the simplified model (launch overhead not hidden), what is the time per token without CUDA graphs?', options: ['2.5 ms', '4.9 ms', '0.5 ms', '7.4 ms'], answer: 1, explain: '480 × 5 µs = 2.4 ms of launch overhead, plus 2.5 ms of GPU work = 4.9 ms. A CUDA graph replays all kernels with about one launch, bringing it close to 2.5 ms.' },
    { q: "What is \"in-flight batching\" in TensorRT-LLM?", options: ["Overlapping data transfers with compute so the GPU is never idle between batches", "Batching requests together only when they share an identical prompt", "Grouping requests into a fixed batch that waits for the longest one", "NVIDIA's name for continuous batching: the batch is re-formed every iteration"], answer: 3, explain: "In-flight batching is the same idea as continuous batching in vLLM and SGLang. Static batching, which waits for the longest request, is what it replaces." },
    { q: "A colleague says: \"TensorRT-LLM always requires a slow engine build, so it is useless for quick experiments.\" What is the best response?", options: ["Correct: every model must be compiled first, and there is no way around it", "Newer versions have a PyTorch backend via the LLM API that skips the separate engine build", "It never had a build step at all, so experiments were always as quick as plain PyTorch", "Builds are only needed for CPU targets, so GPU experiments skip them"], answer: 1, explain: "The classic path needs trtllm-build, but the PyTorch backend became the recommended default and skips compiling a separate engine. For rapid experiments on varied hardware, vLLM may still be easier." },
  ],
  takeaways: [
    'Naive inference leaves NVIDIA GPUs idle: too much memory traffic, launch overhead, generic kernels and wasted KV memory.',
    'TensorRT-LLM prepares the model ahead of time: fused, auto-tuned kernels for one GPU, precision and size limit.',
    'Key runtime features: FP8/FP4 and INT quantization, custom attention kernels, paged KV cache, in-flight batching, CUDA graphs.',
    'Speculative decoding plus tensor, pipeline and expert parallelism scale it from one GPU to many.',
    'Serve via trtllm-serve or Triton; the PyTorch backend removes the separate build step. It is NVIDIA-only, so benchmark against vLLM and SGLang.',
  ],
  terms: [
    { term: 'Kernel', def: 'A single function that runs on the GPU, such as a matrix multiply or a fused activation.' },
    { term: 'Engine', def: 'TensorRT-LLM\'s compiled, optimized execution plan for one model, GPU architecture, precision and set of limits.' },
    { term: 'Kernel fusion', def: 'Combining several operations into one kernel to cut memory traffic and launch overhead.' },
    { term: 'In-flight batching', def: 'NVIDIA\'s term for continuous batching: re-forming the batch at every iteration.' },
    { term: 'CUDA graph', def: 'A recorded sequence of GPU kernel launches that can be replayed with a single launch.' },
    { term: 'Tensor parallelism', def: 'Splitting each weight matrix across GPUs so they compute every layer together.' },
    { term: 'FP8', def: 'An 8-bit floating-point format that recent NVIDIA GPUs can multiply natively and fast.' },
  ],
};
