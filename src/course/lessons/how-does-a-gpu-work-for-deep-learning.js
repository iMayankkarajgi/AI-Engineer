export default {
  id: "how-does-a-gpu-work-for-deep-learning",
  minutes: 24,
  hook: "Why does a chip designed to draw video-game pixels train and run almost every modern AI model — and why does the size of its memory matter as much as its speed?",
  summary: "A GPU is a processor with thousands of simple cores that all perform the same kind of arithmetic at once, plus very fast memory to feed them. Deep learning is mostly huge matrix multiplications made of millions of independent multiply-adds, which is exactly the kind of work a GPU parallelises well. Specialised Tensor Cores, low-precision number formats and the CUDA software stack make it faster still, while VRAM size and memory bandwidth decide which models fit and how quickly they generate tokens.",
  sections: [
    {
      id: "what-is-a-gpu",
      title: "What is a GPU?",
      blocks: [
        { type: "p", text: "A **GPU (Graphics Processing Unit)** is a processor originally built to draw images on screens. Drawing a frame of a video game means computing the colour of millions of pixels, and each pixel's calculation is almost the same as its neighbours' and does not depend on them. So GPU designers made a chip with **thousands of small, simple cores** that execute the same instructions on different data at the same time, instead of a few very smart cores." },
        { type: "p", text: "Around 2007, NVIDIA released **CUDA**, a way to program GPUs for general maths rather than only graphics. In 2012, the AlexNet image classifier was trained on two consumer NVIDIA GPUs and won the ImageNet competition by a wide margin. Since then, GPUs have been the main engine of deep learning." },
        { type: "p", text: "Our running example in this module: an appliance shop wants to run a 7-billion-parameter (7B) language model as its support chatbot, and later fine-tune it on its own tickets. Every decision — which GPU, how many, which number format — follows from the ideas in this lesson." },
      ],
    },
    {
      id: "professor-and-students",
      title: "The math professor and the thousands of students",
      blocks: [
        { type: "callout", tone: "analogy", title: "One genius or a stadium of students?", text: "Imagine we must mark 100,000 simple arithmetic worksheets. Option A: one brilliant maths professor, very fast and able to solve any hard problem, but only one at a time. Option B: a stadium of 10,000 school students, each slower and only able to do simple sums, but all working at once. For one tricky proof, the professor wins. For 100,000 simple worksheets, the students finish long before the professor. A CPU is the professor; a GPU is the stadium." },
        { type: "p", text: "The analogy has a second lesson hidden in it: the students only help if we can **hand out worksheets fast enough**. If one clerk walks sheets to the stadium one at a time, most students sit idle. In a GPU, the 'clerk' is memory bandwidth, and we will see that it is often the real limit." },
      ],
    },
    {
      id: "cpu-vs-gpu",
      title: "CPU vs GPU",
      blocks: [
        { type: "compare", title: "CPU vs GPU",
          options: [
            { name: "CPU", summary: "A few powerful cores optimised for low latency on varied, branching tasks.", pros: ["Excellent at complex control flow (if/else, unpredictable branches)", "Large caches and clever tricks (branch prediction, out-of-order execution)", "Runs the operating system, data loading, business logic"], cons: ["Few cores (typically about 4–128)", "Far less total arithmetic throughput"], bestFor: "Sequential logic, small or irregular workloads, orchestration" },
            { name: "GPU", summary: "Thousands of simple cores optimised for throughput on uniform, parallel tasks.", pros: ["Massive parallel arithmetic", "Very high memory bandwidth (HBM on data-centre GPUs)", "Specialised matrix units (Tensor Cores)"], cons: ["Poor at branchy, sequential code", "Limited memory compared with system RAM", "Needs the work split into many independent pieces"], bestFor: "Matrix maths: training and running neural networks, graphics, simulations" },
          ],
          rows: [
            ["Design goal", "Low latency per task", "High throughput across tasks"],
            ["Core count", "Few, complex", "Thousands, simple"],
            ["Memory", "Large system RAM, lower bandwidth", "Smaller VRAM, much higher bandwidth"],
          ],
          verdict: "They work as a team: the CPU (the 'host') prepares data and launches work; the GPU (the 'device') does the heavy maths." },
        { type: "viz", name: "gpu-parallel", caption: "Watch a CPU with a few fast cores and a GPU with many simple cores work through the same matrix. The GPU finishes first because it computes many cells at the same time." },
      ],
    },
    {
      id: "matrix-multiplication",
      title: "Why deep learning is mostly matrix multiplication",
      blocks: [
        { type: "p", text: "A dense neural-network layer computes `Y = X · W` (plus a bias and an activation). X holds a batch of inputs (one row per example or token), W holds the learned weights. In a Transformer, the query/key/value projections, the attention output projection and the big feed-forward layers are all matrix multiplications, and together they account for the large majority of the arithmetic." },
        { type: "p", text: "Each output cell Y[i, j] is a **dot product**: multiply row i of X by column j of W element by element, then add up. A 32×4096 input times a 4096×4096 weight matrix produces 131,072 output cells, each needing 4,096 multiplies and adds — about 1.1 billion floating-point operations (FLOPs) for one layer. Crucially, **no output cell depends on any other**, so all 131,072 can be computed at the same time." },
        { type: "formula", expr: "Y[i, j] = ∑ₖ X[i, k] · W[k, j]        FLOPs ≈ 2 · M · K · N", where: [["M", "rows of X (batch × tokens)"], ["K", "inner dimension (input features)"], ["N", "output features"], ["2", "one multiply and one add per term"]] },
        { type: "check", question: "How many FLOPs does multiplying a 2×3 matrix by a 3×4 matrix take, using the 2·M·K·N rule?", answer: "2 × 2 × 3 × 4 = 48 FLOPs: 8 output cells, each needing 3 multiplies and 3 adds." },
      ],
    },
    {
      id: "serial-vs-parallel",
      title: "Serial work vs parallel work",
      blocks: [
        { type: "p", text: "**Serial** work is a chain where each step needs the previous result, like following a recipe. **Parallel** work is a pile of independent jobs, like washing 100 plates with 100 people. Adding workers speeds up only the parallel part." },
        { type: "list", items: [
          "**Very parallel:** all output cells of a matrix multiply; applying an activation to every number; processing all tokens of a prompt at once in a Transformer.",
          "**Serial:** the layers of a network (layer 2 needs layer 1's output); generating text one token at a time (token 51 needs token 50); a training loop's steps.",
        ] },
        { type: "p", text: "GPUs exploit the parallelism *inside* each step: each layer is a huge parallel matrix multiply, even though the layers run in order. This is also why the Transformer replaced the RNN: an RNN processes tokens one after another, while a Transformer processes a whole sequence in parallel during training." },
        { type: "callout", tone: "note", title: "Amdahl's law in one line", text: "If 5% of a job is strictly serial, then even infinitely many cores can speed it up at most 20× (1 / 0.05). This is why data loading, Python overhead and small sequential operations can leave an expensive GPU waiting." },
      ],
    },
    {
      id: "vram-and-bandwidth",
      title: "GPU memory (VRAM) and memory bandwidth",
      blocks: [
        { type: "p", text: "A GPU has its own memory, called **VRAM** (video RAM) or device memory. Data-centre GPUs use **HBM (High Bandwidth Memory)**: memory chips stacked right next to the processor. Two numbers matter:" },
        { type: "list", items: [
          "**Capacity** (GB): how much fits. Examples: NVIDIA's A100 comes in 40 GB and 80 GB versions; the H100 SXM has 80 GB; consumer cards commonly have 8–32 GB.",
          "**Bandwidth** (GB/s or TB/s): how fast data moves between VRAM and the cores. An H100 SXM is rated at about 3.35 TB/s; a typical desktop CPU's main memory delivers tens of GB/s, and server CPUs a few hundred GB/s.",
        ] },
        { type: "p", text: "Whether compute or bandwidth is the bottleneck depends on **arithmetic intensity**: how many FLOPs we do per byte we read. A GPU like the H100 can do on the order of a thousand trillion low-precision FLOPs per second but read only about 3 trillion bytes per second, so it needs roughly 300 FLOPs per byte to keep its cores busy. A matrix multiply with a large batch reuses each weight many times (high intensity: compute-bound). Generating text for one user with batch size 1 reads every weight to do only about 2 FLOPs with it (low intensity: **memory-bound**)." },
        { type: "code", lang: "python", title: "gpu_numbers.py", code: `import numpy as np

# 1) A neural-network layer is a matrix multiply: (batch x d_in) @ (d_in x d_out)
B, d_in, d_out = 32, 4096, 4096
flops = 2 * B * d_in * d_out                 # one multiply + one add per term
print(f"one layer, batch {B}: {flops / 1e9:.1f} GFLOPs, "
      f"{B * d_out:,} outputs that are all independent")

# 2) Every output cell is its own dot product -> perfectly parallel work
rng = np.random.default_rng(0)
X, W = rng.normal(size=(3, 4)), rng.normal(size=(4, 2))
cell = sum(X[1, k] * W[k, 0] for k in range(4))   # what ONE GPU thread does
print("one cell by hand:", round(cell, 4), "| same cell from X@W:", round((X @ W)[1, 0], 4))

# 3) Will the model fit in VRAM?  weights only = params x bytes per param
params = 7e9
for name, nbytes in [("FP32", 4), ("FP16/BF16", 2), ("INT8", 1), ("INT4", 0.5)]:
    print(f"7B model in {name:9s}: {params * nbytes / 1e9:5.1f} GB of weights")

# Training needs far more: a common mixed-precision Adam estimate is
# ~16 bytes/param (weights + grads + fp32 master copy + 2 optimizer states)
print(f"7B model, full training state: ~{params * 16 / 1e9:.0f} GB (+ activations)")

# 4) Arithmetic intensity: FLOPs done per byte moved from memory (FP16)
for B in (1, 256):
    bytes_moved = 2 * (B * d_in + d_in * d_out + B * d_out)
    print(f"batch {B:3d}: {2 * B * d_in * d_out / bytes_moved:6.1f} FLOPs per byte")`, output: `one layer, batch 32: 1.1 GFLOPs, 131,072 outputs that are all independent
one cell by hand: 0.4751 | same cell from X@W: 0.4751
7B model in FP32     :  28.0 GB of weights
7B model in FP16/BF16:  14.0 GB of weights
7B model in INT8     :   7.0 GB of weights
7B model in INT4     :   3.5 GB of weights
7B model, full training state: ~112 GB (+ activations)
batch   1:    1.0 FLOPs per byte
batch 256:  227.6 FLOPs per byte`,
          walkthrough: [
            { lines: [3, 7], note: "One 4096×4096 layer on a batch of 32 is about 1.1 GFLOPs and 131,072 independent output cells — plenty of parallel work for thousands of cores." },
            { lines: [9, 13], note: "What one GPU thread conceptually does: a single dot product for one output cell. It matches numpy's full matrix multiply exactly." },
            { lines: [15, 18], note: "Weights-only memory for a 7B model: parameters × bytes per parameter. FP16 needs 14 GB; INT4 needs 3.5 GB." },
            { lines: [20, 22], note: "Training needs much more: a widely used rule of thumb for mixed-precision Adam is about 16 bytes per parameter, before counting activations." },
            { lines: [24, 27], note: "Arithmetic intensity. With batch 1 we do only about 1 FLOP per byte read (memory-bound); with batch 256 we do about 228, which is much closer to what the cores can consume." },
          ] },
      ],
    },
    {
      id: "fit-in-vram",
      title: "Why the model must fit in VRAM",
      blocks: [
        { type: "p", text: "Every token the model processes needs every weight. If the weights do not all fit in VRAM, some must be fetched from CPU memory over the PCIe bus, which is far slower than HBM (PCIe 5.0 x16 is roughly 64 GB/s in each direction). The model then runs many times slower, or simply fails with an out-of-memory (OOM) error." },
        { type: "chart", kind: "bar", title: "Weights-only memory for a 7B model", yLabel: "GB", unit: " GB", labels: ["FP32", "FP16/BF16", "INT8", "INT4"], series: [{ name: "Weights", values: [28, 14, 7, 3.5] }], caption: "Exact arithmetic from the code above. Real usage is higher: add the KV cache (grows with context length and number of concurrent users), activations and framework overhead." },
        { type: "p", text: "VRAM must hold more than the weights. For **inference**: weights + the **KV cache** (stored keys and values for every token in every active conversation) + temporary activations. For **training**: weights + gradients + optimizer states (Adam keeps two extra numbers per parameter) + saved activations for backpropagation. That is why a 7B model that runs on one 24 GB card in FP16 needs on the order of 100+ GB to fully fine-tune — or tricks like LoRA, quantization and sharding across GPUs." },
        { type: "check", question: "Our shop's GPU has 24 GB of VRAM. Can it serve the 7B model in FP16? In FP32?", answer: "FP16 weights take 14 GB, leaving about 10 GB for the KV cache and overhead, so yes for moderate context lengths and a few users. FP32 weights alone take 28 GB, more than the card has, so no." },
      ],
    },
    {
      id: "tensor-cores-precision",
      title: "Tensor Cores and lower precision (FP16, BF16, INT8)",
      blocks: [
        { type: "p", text: "Regular GPU cores (NVIDIA calls them CUDA cores) do one multiply-add per clock each. Starting with the Volta generation (V100, 2017), NVIDIA added **Tensor Cores**: units that multiply small matrix tiles (for example 4×4 blocks) in one operation. They deliver far more FLOPs than the regular cores, but only for matrix maths in reduced-precision formats." },
        { type: "table", caption: "Common number formats in deep learning", head: ["Format", "Bits", "Typical use", "Note"], rows: [
          ["FP32", "32", "Classic training; master weights", "Precise but slow and large"],
          ["TF32", "19 used (stored in 32)", "FP32 matmuls on Ampere and later", "FP32 range with reduced mantissa"],
          ["FP16", "16", "Mixed-precision training, inference", "Small range: needs loss scaling to avoid underflow"],
          ["BF16", "16", "Mixed-precision training, inference", "Same range as FP32, less precision; usually no loss scaling needed"],
          ["FP8", "8", "Training and inference on Hopper and newer", "Needs careful scaling"],
          ["INT8 / INT4", "8 / 4", "Quantised inference", "Halves or quarters memory again; small accuracy cost if done well"],
        ] },
        { type: "p", text: "Lower precision helps in three ways at once: Tensor Cores run faster on it, each number takes fewer bytes (so the model fits and memory traffic drops), and more numbers fit in caches. **Mixed precision** training does the heavy matrix maths in BF16 or FP16 while keeping a master copy of the weights and sensitive reductions in FP32, giving most of the speed with little loss of accuracy." },
        { type: "callout", tone: "warn", title: "Common mistake", text: "Training in plain FP16 without loss scaling can make small gradients underflow to zero and silently stall learning; switching to BF16 or enabling automatic loss scaling fixes it. Also, a GPU's headline FLOPs number is usually for its lowest-precision format (sometimes with sparsity): compare like with like." },
      ],
    },
    {
      id: "cuda-software-stack",
      title: "CUDA and the software stack (cuDNN)",
      blocks: [
        { type: "p", text: "Hardware is useless without software that keeps it busy. A deep-learning call like `model(x)` in PyTorch passes through several layers before any transistor switches:" },
        { type: "steps", title: "From Python to silicon", items: [
          { title: "Framework (PyTorch, JAX, TensorFlow)", text: "We describe the model in Python. The framework turns each operation into calls to GPU libraries, and compilers (like torch.compile or XLA) can fuse several operations into one." },
          { title: "Libraries (cuBLAS, cuDNN, NCCL)", text: "Highly tuned NVIDIA libraries: cuBLAS for matrix maths, cuDNN for neural-network operations such as convolutions, normalisation and attention, NCCL for communication between GPUs." },
          { title: "CUDA kernels", text: "Each library call launches **kernels**: small programs that run on thousands of GPU threads at once (next lesson). Custom kernels such as FlashAttention speed up specific operations further." },
          { title: "CUDA runtime and driver", text: "Manage GPU memory, move data between CPU and GPU, schedule kernel launches." },
          { title: "The GPU hardware", text: "Streaming Multiprocessors (SMs) run the threads on CUDA cores and Tensor Cores, reading from caches, shared memory and HBM." },
        ] },
      ],
    },
    {
      id: "training-vs-inference",
      title: "Training vs inference on GPUs",
      blocks: [
        { type: "compare", title: "Training vs inference",
          options: [
            { name: "Training", summary: "Forward pass, backward pass, and weight update, repeated over the dataset.", pros: ["Large batches keep GPUs compute-bound and efficient"], cons: ["Roughly 3× the compute of a forward pass per step", "Memory for gradients, optimizer states and activations"], bestFor: "Large clusters of high-memory GPUs with fast interconnect" },
            { name: "Inference", summary: "Forward pass only, often one token at a time for LLMs.", pros: ["Much less memory per parameter", "Can use INT8/INT4 quantisation"], cons: ["Token-by-token decoding is memory-bandwidth-bound", "Latency matters to users"], bestFor: "Bandwidth-rich GPUs, batching many users together, quantised models" },
          ],
          rows: [
            ["Bottleneck", "Usually compute (FLOPs)", "Prefill: compute; decode: memory bandwidth"],
            ["Memory per parameter", "~16 bytes (mixed-precision Adam)", "~0.5–2 bytes + KV cache"],
            ["Key trick", "Mixed precision, sharding", "Batching, KV cache, quantisation"],
          ],
          verdict: "Training rewards raw FLOPs and memory capacity; LLM inference, especially decoding, rewards memory bandwidth and smart batching." },
      ],
    },
    {
      id: "multiple-gpus",
      title: "Multiple GPUs working together",
      blocks: [
        { type: "p", text: "Large models need many GPUs, either because the model is too big for one card or because training on one card would take years. GPUs inside a server talk over **NVLink** (much faster than PCIe), and servers talk over networks like **InfiniBand** or high-speed Ethernet. The main ways to split the work:" },
        { type: "table", caption: "Ways to split work across GPUs", head: ["Strategy", "What is split", "Main cost"], rows: [
          ["Data parallelism", "Each GPU has a full model copy and its own slice of the batch; gradients are averaged (all-reduce)", "Every GPU must hold the whole model"],
          ["Sharded data parallelism (ZeRO / FSDP)", "Weights, gradients and optimizer states are split across GPUs and gathered when needed", "More communication"],
          ["Tensor parallelism", "Each matrix is split across GPUs; each computes part of every layer", "Needs very fast links (within a server)"],
          ["Pipeline parallelism", "Different layers live on different GPUs; micro-batches flow through like an assembly line", "Idle 'bubbles' at the start and end"],
        ] },
        { type: "p", text: "Large training runs combine all of these. For our shop's 7B model, one GPU is enough for inference; fine-tuning would typically use LoRA on one GPU or sharded data parallelism across a few." },
      ],
    },
    {
      id: "why-nvidia",
      title: "Why NVIDIA GPUs power modern AI",
      blocks: [
        { type: "list", items: [
          "**An early start in software.** CUDA (2007) gave researchers a practical way to program GPUs years before deep learning took off, and AlexNet (2012) was built on it.",
          "**The ecosystem.** cuDNN, cuBLAS, NCCL, TensorRT and deep framework integration mean new research code usually runs on NVIDIA first. This software moat is as important as the chips.",
          "**Hardware aimed at AI.** Tensor Cores, HBM, and low-precision formats (BF16, FP8 and newer) added generation by generation.",
          "**Scale-out.** NVLink, NVSwitch and networking let thousands of GPUs act as one training system.",
        ] },
        { type: "callout", tone: "note", title: "It is not the only option", text: "AMD GPUs (with the ROCm software stack), Google TPUs, and specialised inference chips (such as LPUs, covered later in this module) compete on price, efficiency or speed for specific workloads. The best choice depends on the model, the software we rely on, availability and cost." },
        { type: "callout", tone: "warn", title: "When a GPU is the wrong tool", text: "Small models with tiny batches, heavy branching logic, classic machine learning on small tables (gradient-boosted trees often run fine on CPUs), or workloads dominated by data loading. Moving small data to the GPU and back can cost more time than the computation saves." },
      ],
    },
  ],
  quiz: [
    { q: "Why are GPUs a good fit for deep learning?", options: ["They have a few very fast cores with large caches for branching code", "Matrix maths splits into many independent multiply-adds done in parallel", "They read model files from disk much faster than a CPU can", "They interpret Python code faster than any CPU can run it"], answer: 1, explain: "Matrix multiplications consist of independent dot products, perfect for a throughput-oriented chip with thousands of simple cores. A few fast cores with big caches describes a CPU." },
    { q: "Our 13B-parameter model must run in FP16 on a GPU. Roughly how much memory do the weights alone need?", options: ["6.5 GB", "13 GB", "52 GB", "26 GB"], answer: 3, explain: "FP16 uses 2 bytes per parameter: 13 × 10⁹ × 2 = 26 GB. 52 GB would be FP32, 13 GB INT8, 6.5 GB INT4." },
    { q: "Our chatbot generates tokens slowly for a single user, although the GPU's compute units are mostly idle. What is the most likely bottleneck?", options: ["Memory bandwidth: every token reads all the weights", "Too many Tensor Cores competing for the same work", "The GPU has more VRAM than the model actually needs", "The CPU clock speed limits how fast the GPU can multiply"], answer: 0, explain: "Decoding with batch size 1 has very low arithmetic intensity (about 2 FLOPs per weight read), so speed is set by how fast weights stream from VRAM. Batching more users raises intensity." },
    { q: "How does training differ from inference in GPU memory needs?", options: ["Inference needs more memory because it stores all the gradients", "Both need exactly the same memory for the same model size", "Training adds gradients, optimizer states and activations", "Training needs less memory because it always uses tiny batches"], answer: 2, explain: "Only training stores gradients, optimizer states and activations for backpropagation (often ~16 bytes per parameter with mixed-precision Adam). Inference stores weights plus the KV cache and temporary activations." },
    { q: "Which statement about Tensor Cores and precision is a misconception?", options: ["Tensor Cores speed up matrix maths in reduced-precision formats", "BF16 has the same range as FP32 but less precision", "Lower precision always ruins accuracy, so train in pure FP32", "Mixed precision keeps a master copy of the weights in FP32"], answer: 2, explain: "Mixed-precision training in BF16/FP16 is standard practice and usually matches FP32 accuracy; quantised inference in INT8/INT4 often loses little. The other statements are accurate." },
  ],
  takeaways: [
    "A GPU trades a few smart cores for thousands of simple ones, ideal for parallel matrix maths.",
    "Deep learning is dominated by matrix multiplications whose output cells are independent.",
    "VRAM capacity decides what fits; memory bandwidth often decides how fast LLMs generate.",
    "Tensor Cores plus low precision (BF16, FP8, INT8) multiply speed and cut memory.",
    "CUDA, cuBLAS, cuDNN and NCCL turn the hardware into usable speed; multi-GPU setups split data, layers or matrices.",
  ],
  terms: [
    { term: "GPU", def: "A processor with thousands of simple cores designed for parallel, throughput-oriented computation." },
    { term: "VRAM / HBM", def: "The GPU's own memory; HBM is high-bandwidth memory stacked beside the chip." },
    { term: "Memory bandwidth", def: "How many bytes per second can move between memory and the compute units." },
    { term: "Arithmetic intensity", def: "FLOPs performed per byte moved from memory; decides compute-bound vs memory-bound." },
    { term: "Tensor Core", def: "A GPU unit that multiplies small matrix tiles in one operation in reduced precision." },
    { term: "Mixed precision", def: "Training with low-precision maths while keeping key values (master weights) in FP32." },
    { term: "cuDNN", def: "NVIDIA's library of optimised deep-learning operations built on CUDA." },
  ],
};
