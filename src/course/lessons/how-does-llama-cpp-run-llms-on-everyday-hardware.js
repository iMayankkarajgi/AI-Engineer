export default {
  id: 'how-does-llama-cpp-run-llms-on-everyday-hardware',
  minutes: 22,
  hook: 'How does a model that was trained on thousands of data-centre GPUs end up answering questions on an ordinary laptop with no internet connection?',
  summary: 'llama.cpp is an open-source C/C++ engine that runs LLMs on everyday CPUs and GPUs. It combines four ideas: quantize the weights to about 4–8 bits so they fit, pack everything into one GGUF file, memory-map that file so it loads instantly, and squeeze speed out of the hardware with SIMD instructions, threads and optional GPU offload. Because token generation is limited by memory bandwidth, smaller weights translate almost directly into faster answers.',
  sections: [
    {
      id: 'what-is-llama-cpp',
      title: 'What is llama.cpp',
      blocks: [
        { type: 'p', text: '**llama.cpp** is an open-source program for **running** (not training) large language models. It is written in plain C and C++ with no heavy dependencies: no Python, no PyTorch, no CUDA required. It builds on **ggml**, a small tensor library from the same author that provides the maths (matrix multiplications, attention, quantized formats) and the hardware backends.' },
        { type: 'p', text: 'It started in March 2023, when Georgi Gerganov showed Meta\'s newly released LLaMA model running on a MacBook CPU. The project grew quickly into one of the most popular open-source AI projects, supporting a large range of model families (Llama, Mistral, Qwen, Gemma, Phi, DeepSeek and many more), not just LLaMA.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a pocket-sized edition of a book', text: 'A publisher\'s hardback (the original model) is beautiful but too heavy to carry. A pocket edition uses thinner paper and smaller print (quantization), binds everything in one volume (GGUF) and opens instantly to any page (memory mapping). You lose a little print quality, but you can read it anywhere. llama.cpp is the pocket edition plus the reader.' },
        { type: 'p', text: 'Our running example: we want a private assistant that summarises our notes, running on a 16 GB laptop with a small 4 GB GPU, using an 8-billion-parameter model.' },
      ],
    },
    {
      id: 'why-we-needed-it',
      title: 'Why we needed llama.cpp',
      blocks: [
        { type: 'p', text: 'Before llama.cpp, running an LLM usually meant Python, PyTorch and a large NVIDIA GPU with enough memory to hold the model in 16-bit precision. That excluded most laptops, every Mac without an NVIDIA card, phones, and small servers. Many people also wanted to run models **locally** for privacy, offline use, cost, or simply to experiment.' },
        { type: 'list', items: [
          '**Privacy:** our notes never leave the laptop.',
          '**No per-token cost** and no rate limits.',
          '**Offline:** works on a plane or in a secure network.',
          '**Control:** pick the exact model version and settings, and nothing changes underneath you.',
        ] },
      ],
    },
    {
      id: 'llm-refresher',
      title: 'A quick refresher on what an LLM is',
      blocks: [
        { type: 'p', text: 'An LLM reads text as **tokens** (word pieces mapped to numbers). Each token becomes a vector through the **embedding table**, then passes through a stack of identical **transformer layers** (32 for a typical 8B model). Each layer has an **attention** part (each token looks at earlier tokens) and a **feed-forward** part (a per-token transformation). Almost all of the work is multiplying vectors by big weight matrices. At the end, the **output head** gives a probability for every possible next token, and we pick one.' },
        { type: 'p', text: 'Generation repeats: append the chosen token and run again. Two phases matter for speed. **Prefill** processes the whole prompt in one batch, which is heavy on arithmetic. **Decode** produces one token at a time, and each step must read every weight in the model once. To avoid recomputing old tokens, each layer stores their keys and values in the **KV cache**.' },
      ],
    },
    {
      id: 'too-big-to-fit',
      title: 'The real problem: models are too big to fit',
      blocks: [
        { type: 'p', text: 'Weights dominate memory. An 8B model has about 8 billion weights. In 16-bit floats (2 bytes each) that is about 16 GB, our entire laptop RAM, with nothing left for the operating system or the KV cache. A 70B model would need about 140 GB.' },
        { type: 'p', text: 'And even when a model fits, decode speed has a hard ceiling: every new token requires reading all the weights from memory. Speed is roughly **memory bandwidth ÷ model size**. Laptop RAM might move around 50–100 GB/s; a 16 GB model would crawl along at a few tokens per second. Both problems have the same cure: make the weights smaller.' },
        { type: 'formula', expr: 'tokens per second (decode) ≲ memory bandwidth (GB/s) ÷ bytes of weights read per token (GB)', where: [ ['memory bandwidth', 'how fast the chip can read from RAM or VRAM'], ['bytes per token', 'about the size of the (quantized) model file for a dense model'] ], caption: 'An upper bound. Real speed is lower because of compute, cache misses and other overheads.' },
        { type: 'check', question: 'If we quantize our 16 GB model to about 4.9 GB, by roughly how much can decode speed improve on the same laptop?', answer: 'Roughly 3×, since 16 / 4.9 ≈ 3.3. Decode reads all weights once per token, so a model a third the size can be read about three times faster. It also now fits in RAM with room to spare.' },
      ],
    },
    {
      id: 'quantization-and-names',
      title: 'The first big idea: quantization, and names like Q4_K_M',
      blocks: [
        { type: 'p', text: '**Quantization** stores each weight in fewer bits by rounding it to a small grid of values, with a **scale** per small block of weights to convert back. llama.cpp does this **block-wise**: in the simple Q8_0 format, every 32 weights share one 16-bit scale and each weight becomes an 8-bit integer. In Q4_0, each weight becomes a 4-bit integer. The newer **k-quants** use 256-weight super-blocks with their own quantized sub-block scales.' },
        { type: 'table', caption: 'Decoding llama.cpp quantization names', head: ['Name', 'Meaning', 'Typical trade-off'], rows: [
          ['Q8_0', '8-bit, simple blocks of 32 with one scale (_0 = scale only)', 'Very close to full quality, about half the size of F16'],
          ['Q6_K', '6-bit k-quant', 'Near Q8 quality, smaller'],
          ['Q5_K_M', '5-bit k-quant, medium mix', 'High quality, moderate size'],
          ['Q4_K_M', '4-bit k-quant, medium mix (some sensitive tensors kept at 6-bit)', 'The popular default balance'],
          ['Q3_K_M / Q2_K', '3- and 2-bit k-quants', 'Small, with clearly visible quality loss'],
          ['IQ4_XS, IQ3_M …', '"i-quants", usually guided by an importance matrix', 'Better quality at very low bits, sometimes slower on CPU'],
        ] },
        { type: 'p', text: 'Crucially, llama.cpp computes **directly on the quantized blocks**. To multiply a 4-bit weight row by an activation vector, it quantizes the activation vector to 8-bit blocks too, does integer multiply-adds inside each block, and applies the two scales once per block. This avoids ever expanding the whole model back to 16-bit in memory.' },
      ],
    },
    {
      id: 'gguf-and-mmap',
      title: 'The GGUF file and memory mapping',
      blocks: [
        { type: 'p', text: 'llama.cpp stores models in **GGUF**, a single binary file that contains a header, metadata (architecture, layer count, context length, the tokenizer\'s vocabulary and the chat template), a table describing each tensor (name, shape, quantization type, offset) and finally the aligned weight data. One file is all the engine needs: everything packed in one box.' },
        { type: 'p', text: 'Because the weight data is aligned, llama.cpp can load it with **memory mapping** (`mmap`): the operating system makes the file appear to be in memory and reads pages from disk only when they are first used. Start-up takes moments instead of copying gigabytes, repeated runs hit the OS page cache, and several processes can share one copy of the weights. (On some setups, an option can also lock the pages in RAM so the OS never swaps them out.)' },
        { type: 'callout', tone: 'note', title: 'GPU layers are copied', text: 'Memory mapping helps most for weights that stay on the CPU. Layers offloaded to a GPU must be copied into GPU memory, so they cost VRAM no matter how the file was opened.' },
      ],
    },
    {
      id: 'cpu-speed',
      title: 'Squeezing speed out of the CPU',
      blocks: [
        { type: 'p', text: 'A CPU has few cores compared with a GPU, but each core is powerful. llama.cpp uses every trick available:' },
        { type: 'list', items: [
          '**SIMD instructions:** one instruction processes many numbers at once, using AVX2 / AVX-512 on x86 chips and NEON on ARM (phones, Apple silicon). Inner loops are hand-tuned for each quantization format.',
          '**Integer maths on small blocks:** 8-bit multiply-adds are cheap and pack more values per instruction than 32-bit floats.',
          '**Multithreading:** the rows of each matrix are split across CPU threads (the `-t` / `--threads` option).',
          '**Cache-friendly layout:** small blocks keep data in fast CPU caches while it is used.',
          '**Fewer bytes to read:** the biggest win, because decode is memory-bound. Quantization directly raises tokens per second.',
        ] },
        { type: 'code', lang: 'python', title: 'llamacpp_math.py', code: `import numpy as np

# 1) Q8_0-style dot product: integer multiply-adds per 32-value block, then one float multiply.
def q8_0(x):
    blocks = x.reshape(-1, 32)
    scale = np.abs(blocks).max(axis=1) / 127
    return np.round(blocks / scale[:, None]).astype(np.int8), scale

rng = np.random.default_rng(42)
w, a = rng.normal(size=4096), rng.normal(size=4096)      # one weight row, one activation
qw, sw = q8_0(w)
qa, sa = q8_0(a)
int_dots = (qw.astype(np.int32) * qa.astype(np.int32)).sum(axis=1)   # what SIMD units do
approx = float((int_dots * sw * sa).sum())
print(f"exact dot {w @ a:.3f} | Q8_0 dot {approx:.3f}")

# 2) Speed estimate: each new token reads (almost) all weights once.
model_gb, n_layers = 4.9, 32                              # 8B model in Q4_K_M (approx.)
for name, bw in [("laptop DDR5 RAM", 80), ("Apple M-series Max", 400), ("desktop GPU", 900)]:
    print(f"{name:20s} ~{bw:4d} GB/s -> at most ~{bw / model_gb:5.1f} tokens/s")

# 3) Partial GPU offload (-ngl): put as many layers as fit in VRAM on the GPU.
vram_free_gb, cpu_bw, gpu_bw = 3.0, 80, 300               # a small laptop GPU (illustrative)
per_layer = model_gb / n_layers
for ngl in (0, 8, 16, int(vram_free_gb // per_layer), n_layers):
    if ngl * per_layer > vram_free_gb:
        print(f"-ngl {ngl:2d}: does not fit in {vram_free_gb} GB VRAM"); continue
    t = (n_layers - ngl) * per_layer / cpu_bw + ngl * per_layer / gpu_bw
    print(f"-ngl {ngl:2d}: {ngl * per_layer:4.2f} GB on GPU -> ~{1 / t:5.1f} tokens/s")`, output: `exact dot -132.269 | Q8_0 dot -131.969
laptop DDR5 RAM      ~  80 GB/s -> at most ~ 16.3 tokens/s
Apple M-series Max   ~ 400 GB/s -> at most ~ 81.6 tokens/s
desktop GPU          ~ 900 GB/s -> at most ~183.7 tokens/s
-ngl  0: 0.00 GB on GPU -> ~ 16.3 tokens/s
-ngl  8: 1.23 GB on GPU -> ~ 20.0 tokens/s
-ngl 16: 2.45 GB on GPU -> ~ 25.8 tokens/s
-ngl 19: 2.91 GB on GPU -> ~ 28.9 tokens/s
-ngl 32: does not fit in 3.0 GB VRAM`, walkthrough: [
          { lines: [3, 7], note: 'Q8_0 quantization: split into blocks of 32, one scale per block (max |x| / 127), round to int8.' },
          { lines: [9, 15], note: 'Both the weight row and the activation are quantized; the dot product is done with integer multiply-adds per block and only 128 float multiplies at the end. The result is within about 0.2% of the exact answer.' },
          { lines: [17, 20], note: 'The bandwidth ceiling: tokens/s ≤ bandwidth ÷ model size. Bandwidth figures are rough, illustrative values for each class of hardware.' },
          { lines: [22, 29], note: 'Partial offload: layers on the GPU are read from fast VRAM, the rest from RAM. Per-token time is the sum of both parts, so speed rises with every layer we can offload.' },
        ] },
      ],
    },
    {
      id: 'gpu-offload',
      title: 'Sharing the work with the GPU',
      blocks: [
        { type: 'p', text: 'Through ggml, llama.cpp has **backends** for many kinds of hardware: CUDA (NVIDIA), Metal (Apple silicon), Vulkan (most GPUs), HIP (AMD), SYCL (Intel) and others. You can put the whole model on the GPU if it fits, or only part of it. The option `-ngl N` (`--n-gpu-layers`) sends the first N transformer layers\' weights to the GPU, and the rest stay in system RAM and run on the CPU.' },
        { type: 'p', text: 'This **partial offload** is a key reason llama.cpp works on everyday hardware. On our laptop, the 4 GB GPU has about 3 GB free, enough for 19 of 32 layers. In the illustrative numbers above, that raises the speed from about 16 to about 29 tokens per second. On Apple silicon, the CPU and GPU share one pool of fast **unified memory**, so the whole model can usually go on the GPU via Metal.' },
        { type: 'chart', kind: 'bar', title: 'Illustrative decode speed vs layers offloaded', yLabel: 'Tokens per second', labels: ['-ngl 0', '-ngl 8', '-ngl 16', '-ngl 19'], series: [ { name: 'Estimated tokens/s', values: [16.3, 20, 25.8, 28.9] } ], caption: 'From the bandwidth model in the code above (80 GB/s RAM, 300 GB/s VRAM). Real numbers depend on hardware, model and settings.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Setting -ngl higher than VRAM allows causes out-of-memory errors or heavy slowdowns; leave room for the KV cache, which also lives on the GPU for offloaded layers and grows with context length. Using more CPU threads than physical cores often makes things slower, not faster. And picking the biggest model that technically fits leaves no memory for long contexts: plan for weights plus KV cache plus the OS.' },
      ],
    },
    {
      id: 'journey-of-a-prompt',
      title: 'The full journey of running a prompt',
      blocks: [
        { type: 'flow', title: 'One request through llama.cpp', nodes: [
          { label: 'Load GGUF', detail: 'Read the header and metadata, memory-map the weights, copy offloaded layers to the GPU, allocate the KV cache for the chosen context size.' },
          { label: 'Format & tokenize', detail: 'Wrap the conversation with the chat template stored in the file, then split it into token IDs with the stored vocabulary.' },
          { label: 'Prefill', detail: 'Process all prompt tokens in batches through every layer, filling the KV cache. This phase is compute-heavy and benefits most from the GPU.' },
          { label: 'Decode', detail: 'Generate one token at a time: run the layers for the newest token only, reading all weights once and attending over the KV cache.' },
          { label: 'Sample', detail: 'Turn the output scores into a choice using temperature, top-k, top-p, min-p or repetition penalties, or a grammar that restricts the output format.' },
          { label: 'Detokenize & stream', detail: 'Convert the token back to text and stream it to the user; stop at an end-of-sequence token or a length limit.' },
        ] },
        { type: 'steps', title: 'Running it yourself', items: [
          { title: 'Get a model', text: 'Download a GGUF file, for example an 8B instruct model in Q4_K_M (about 5 GB).' },
          { title: 'Chat in the terminal', text: 'Run `llama-cli -m model.gguf -ngl 19` and type a message.' },
          { title: 'Or start a server', text: 'Run `llama-server -m model.gguf -ngl 19 --port 8080`. It offers a simple web UI and an OpenAI-compatible HTTP API, so existing client code can point at it.' },
          { title: 'Tune', text: 'Adjust context size (`-c`), threads (`-t`) and layer offload until speed and memory are balanced.' },
        ] },
      ],
    },
    {
      id: 'where-it-is-used',
      title: 'Where llama.cpp is used',
      blocks: [
        { type: 'p', text: 'llama.cpp and its ggml library sit underneath much of the local-AI world. Ollama was built on llama.cpp\'s engine, LM Studio and GPT4All use it for GGUF models, Mozilla\'s llamafile packages it into single executables, and many mobile and desktop apps embed it. Hugging Face hosts a large number of GGUF files made for it.' },
        { type: 'compare', title: 'llama.cpp vs a data-centre serving engine', options: [
          { name: 'llama.cpp', summary: 'Lightweight C/C++ engine for local and edge inference.', pros: ['Runs on CPUs, Macs, phones, small GPUs', 'Many quantization levels', 'Single file, no Python', 'Partial GPU offload'], cons: ['Lower throughput for many concurrent users', 'Fewer large-scale serving features'], bestFor: 'Laptops, desktops, edge devices, private single-user apps' },
          { name: 'vLLM / SGLang / TensorRT-LLM', summary: 'Python/C++ engines built for GPU servers and many users.', pros: ['Very high throughput', 'Paged KV cache, continuous batching', 'Multi-GPU scaling'], cons: ['Need data-centre GPUs', 'Heavier setup'], bestFor: 'Production APIs serving many users' },
        ], rows: [ ['Typical hardware', 'CPU, Apple silicon, consumer GPU', 'NVIDIA / AMD data-centre GPUs'], ['Model format', 'GGUF', 'safetensors (FP16/BF16, FP8, AWQ, GPTQ)'], ['Goal', 'Run anywhere, low memory', 'Maximum throughput'] ], verdict: 'Use llama.cpp to run a model where you are; use a serving engine when you must serve many users from GPUs.' },
        { type: 'callout', tone: 'example', title: 'Our notes assistant, solved', text: 'We run `llama-server` with an 8B Q4_K_M model and 19 layers offloaded. Our note-taking app calls its OpenAI-compatible endpoint on localhost. Summaries stream at a comfortable reading speed and no data leaves the laptop.' },
      ],
    },
  ],
  quiz: [
    { q: "Why does quantizing a model from 16-bit to about 4.5 bits make decoding on a laptop faster, not just smaller?", options: ["Decode speed is limited by reading weights, so fewer bytes give more tokens per second", "Integer weights let the model skip the attention computation entirely", "Quantized models produce shorter answers, so each reply finishes sooner", "The CPU runs at a noticeably higher clock speed when processing integers instead of floats"], answer: 0, explain: "During decode every weight is read once per token, so speed is roughly bandwidth ÷ model size. Shrinking the weights about 3.5× raises that ceiling about 3.5×. Attention still runs and answer length is unchanged." },
    { q: 'A laptop has about 100 GB/s of memory bandwidth and runs a 5 GB quantized model fully in RAM. What is the rough upper bound on decode speed?', options: ['About 5 tokens/s', 'About 500 tokens/s', 'About 20 tokens/s', 'About 0.05 tokens/s'], answer: 2, explain: '100 GB/s ÷ 5 GB per token ≈ 20 tokens/s. That is a ceiling; real speed is a bit lower. 500 would come from multiplying instead of dividing.' },
    { q: "What does `-ngl 19` do?", options: ["Limits each generated answer to a maximum of 19 new tokens", "Runs inference on 19 CPU threads, one for each transformer layer", "Sets the sampling temperature to 1.9 for more varied text", "Offloads 19 transformer layers to the GPU, leaving the rest on the CPU"], answer: 3, explain: "-ngl (--n-gpu-layers) controls how many layers run on the GPU. Threads are set with -t, and answer length and sampling have separate options." },
    { q: "Our model loads in under a second but uses more RAM once we start chatting, and runs out of memory with a 32k context. What is the best explanation?", options: ["GGUF files are compressed on disk and expand in RAM as the chat goes on", "Weights are paged in on first use, and the KV cache grows with context, so both add RAM", "llama.cpp downloads the remaining layers from the internet as the conversation grows longer", "The tokenizer needs about 32 GB of RAM to process prompts at 32k context"], answer: 1, explain: "mmap makes loading instant by deferring reads, so RAM use rises as layers are touched. The KV cache scales with context length and must fit too. Reduce the context or offload fewer layers to fix it." },
    { q: "Which statement best compares llama.cpp with a data-centre engine like vLLM?", options: ["llama.cpp targets local hardware with GGUF and partial offload; vLLM targets many-user GPU serving", "llama.cpp is built only for training, while vLLM is built only for inference", "vLLM is designed to run on phones, while llama.cpp needs data-centre GPUs", "They share one engine underneath and differ only in name and default settings"], answer: 0, explain: "llama.cpp is built to run anywhere with little memory; vLLM and similar engines use paged KV caches and continuous batching to serve many users on large GPUs. Neither is a training framework." },
  ],
  takeaways: [
    'llama.cpp is a dependency-light C/C++ inference engine built on the ggml tensor library.',
    'Decode speed ≈ memory bandwidth ÷ model size, so quantization (Q4_K_M, Q8_0 …) makes models both fit and run faster.',
    'GGUF packs weights, tokenizer and settings into one file; memory mapping makes loading near-instant.',
    'SIMD, integer block maths and threads speed up CPUs; -ngl offloads as many layers as fit onto the GPU.',
    'It powers much of local AI (Ollama, LM Studio, llamafile) and offers an OpenAI-compatible server.',
  ],
  terms: [
    { term: 'llama.cpp', def: 'An open-source C/C++ engine for running LLMs efficiently on CPUs, Apple silicon and consumer GPUs.' },
    { term: 'ggml', def: 'The tensor library underneath llama.cpp that provides quantized maths and hardware backends.' },
    { term: 'SIMD', def: 'Single Instruction, Multiple Data: CPU instructions (AVX, NEON) that process many numbers at once.' },
    { term: 'Layer offload (-ngl)', def: 'Placing the weights of some transformer layers on the GPU while the rest run on the CPU.' },
    { term: 'Memory bandwidth', def: 'How many bytes per second a processor can read from memory; the main limit on decode speed.' },
    { term: 'Unified memory', def: 'A single memory pool shared by CPU and GPU, as on Apple silicon, so the GPU can use most of system RAM.' },
  ],
};
