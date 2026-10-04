export default {
  id: "how-do-cuda-kernels-work",
  minutes: 23,
  hook: "When PyTorch multiplies two matrices on a GPU, a million tiny threads each run the same short function — so how does each one know which numbers are its job?",
  summary: "A CUDA kernel is a function written once and executed in parallel by thousands or millions of GPU threads. Threads are grouped into blocks, and blocks into a grid; each thread computes its own global index from built-in variables and works on the matching piece of data. The CPU (host) copies data to GPU memory and launches kernels; the GPU (device) schedules blocks onto its streaming multiprocessors in groups of 32 threads called warps. Fast kernels depend as much on smart memory use as on raw arithmetic.",
  sections: [
    {
      id: "why-gpu",
      title: "Why do we need a GPU?",
      blocks: [
        { type: "p", text: "In the previous lesson we saw that deep learning is dominated by operations like matrix multiplication and element-wise maths over huge arrays. A CPU has a handful of powerful cores and works through such arrays a few elements at a time. A GPU has thousands of simpler cores and can process thousands of elements at the same moment — *if* we give it the work in the right shape." },
        { type: "p", text: "Running example: our appliance shop's chatbot. Every generated token involves adding bias vectors, applying activation functions, normalising, and multiplying by weight matrices with millions of numbers. Each of those is one or more **CUDA kernels**. Understanding kernels explains why some operations are fast, why others waste the GPU, and why tools like FlashAttention matter." },
      ],
    },
    {
      id: "what-is-cuda",
      title: "What is CUDA?",
      blocks: [
        { type: "p", text: "**CUDA** (Compute Unified Device Architecture) is NVIDIA's platform for general-purpose programming of its GPUs, first released in 2007. It includes:" },
        { type: "list", items: [
          "**A language extension** of C/C++ (compiled with `nvcc`) that lets us mark functions to run on the GPU and launch them on many threads.",
          "**A runtime and driver** that allocate GPU memory, copy data, and schedule work.",
          "**Libraries** built on top: cuBLAS (linear algebra), cuDNN (neural-network operations), NCCL (multi-GPU communication), and more.",
          "**Tools**: profilers and debuggers (such as Nsight) to see where time goes.",
        ] },
        { type: "p", text: "Most AI engineers never write raw CUDA: PyTorch and JAX call pre-written kernels for us. But the programming model — threads, blocks, grids and memory levels — shapes the performance of everything we run, and writing or choosing custom kernels is a key optimisation skill." },
      ],
    },
    {
      id: "what-is-a-kernel",
      title: "What is a CUDA kernel?",
      blocks: [
        { type: "p", text: "A **kernel** is a function that runs on the GPU and is executed by many threads in parallel. We write the code for **one thread**, describing the work for one small piece of the data, and CUDA runs it on as many threads as we ask for. In CUDA C++ a kernel is marked with `__global__`, returns `void`, and is launched with the special `<<<blocks, threads>>>` syntax." },
        { type: "callout", tone: "analogy", title: "Think of it like one instruction sheet for a whole stadium", text: "A teacher writes one instruction card: 'Look at your seat number. Take the worksheet with that number, add the two numbers on it, write the answer.' Every student in the stadium gets an identical card. Because each student has a different seat number, they all do different worksheets at the same time. The card is the kernel; the seat number is the thread index." },
        { type: "p", text: "This style is called **SPMD** (single program, multiple data); NVIDIA calls its hardware execution model **SIMT** (single instruction, multiple threads). The program is identical for every thread; only the data each thread touches differs." },
      ],
    },
    {
      id: "threads-blocks-grids",
      title: "Threads, blocks, and grids",
      blocks: [
        { type: "p", text: "CUDA organises threads in a three-level hierarchy:" },
        { type: "list", items: [
          "**Thread:** the smallest unit; runs the kernel once with its own registers and its own index.",
          "**Block (thread block):** a group of threads (up to 1,024 on current NVIDIA GPUs) that run on the same processor, can share a fast on-chip memory called **shared memory**, and can wait for each other with `__syncthreads()`.",
          "**Grid:** all the blocks of one kernel launch. Blocks are independent: they may run in any order, at the same time or one after another.",
        ] },
        { type: "p", text: "Blocks and grids can be 1-D, 2-D or 3-D, which is convenient for images and matrices: a 2-D grid of 2-D blocks maps naturally onto a 2-D output. Built-in variables tell each thread where it sits: `threadIdx` (position inside its block), `blockIdx` (position of its block in the grid), `blockDim` (threads per block) and `gridDim` (blocks in the grid)." },
        { type: "table", caption: "Example: 1-D launch for 10 elements with 4 threads per block", head: ["Block (blockIdx.x)", "Threads (threadIdx.x)", "Global indices i", "Work"], rows: [
          ["0", "0, 1, 2, 3", "0, 1, 2, 3", "c[0..3]"],
          ["1", "0, 1, 2, 3", "4, 5, 6, 7", "c[4..7]"],
          ["2", "0, 1, 2, 3", "8, 9, 10, 11", "c[8], c[9]; threads 10 and 11 are idle"],
        ] },
      ],
    },
    {
      id: "host-and-device",
      title: "Host and device",
      blocks: [
        { type: "p", text: "CUDA programs have two sides. The **host** is the CPU and its main memory (RAM). The **device** is the GPU and its own memory (VRAM). They are separate: a normal CPU pointer cannot be read by a kernel, and vice versa (unless we use unified memory, which moves data automatically, sometimes at a performance cost)." },
        { type: "flow", title: "The life of a CUDA computation", nodes: [
          { label: "Allocate on device", detail: "cudaMalloc reserves space in GPU memory for inputs and outputs." },
          { label: "Copy host → device", detail: "cudaMemcpy moves input arrays from RAM to VRAM over PCIe or NVLink. This can be slow relative to the GPU's speed." },
          { label: "Launch kernel", detail: "kernel<<<blocks, threads>>>(args) queues the kernel. The call returns immediately: launches are asynchronous, so the CPU can keep working." },
          { label: "GPU executes", detail: "The device schedules blocks onto its streaming multiprocessors and runs all the threads." },
          { label: "Copy device → host", detail: "cudaMemcpy brings results back; it waits for preceding work on the same stream to finish first." },
          { label: "Free memory", detail: "cudaFree releases the GPU memory." },
        ] },
        { type: "callout", tone: "tip", title: "Keep data on the GPU", text: "Frameworks keep tensors on the device between operations precisely to avoid the copy steps. A common performance bug in PyTorch is calling `.item()`, `.cpu()` or printing a GPU tensor inside a training loop: each forces a device-to-host copy and makes the CPU wait for the GPU." },
      ],
    },
    {
      id: "first-kernel",
      title: "Writing our first CUDA kernel",
      blocks: [
        { type: "p", text: "The 'hello world' of CUDA is vector addition: c[i] = a[i] + b[i] for about a million elements. Here is a complete program. It needs an NVIDIA GPU and the CUDA toolkit to compile (`nvcc vec_add.cu -o vec_add`), so we show it for reading and then simulate the same launch in Python with real output." },
        { type: "code", lang: "cuda", title: "vec_add.cu (for reading)", code: `#include <cstdio>
#include <cuda_runtime.h>

// __global__ = a kernel: called from the CPU (host), runs on the GPU (device)
__global__ void vec_add(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;   // my global index
    if (i < n) c[i] = a[i] + b[i];                   // guard + one element of work
}

int main() {
    const int n = 1 << 20;                            // about 1 million elements
    size_t bytes = n * sizeof(float);
    float *h_a = (float*)malloc(bytes), *h_b = (float*)malloc(bytes), *h_c = (float*)malloc(bytes);
    for (int i = 0; i < n; i++) { h_a[i] = i; h_b[i] = 100; }

    float *d_a, *d_b, *d_c;                           // pointers to GPU memory
    cudaMalloc(&d_a, bytes); cudaMalloc(&d_b, bytes); cudaMalloc(&d_c, bytes);
    cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, h_b, bytes, cudaMemcpyHostToDevice);

    int threads = 256;
    int blocks = (n + threads - 1) / threads;         // round up: 4096 blocks
    vec_add<<<blocks, threads>>>(d_a, d_b, d_c, n);   // launch (asynchronous)

    cudaMemcpy(h_c, d_c, bytes, cudaMemcpyDeviceToHost);   // waits for the kernel
    printf("c[5] = %.1f\\n", h_c[5]);                   // 105.0
    cudaFree(d_a); cudaFree(d_b); cudaFree(d_c);
    free(h_a); free(h_b); free(h_c);
}`,
          walkthrough: [
            { lines: [4, 8], note: "The kernel. `__global__` marks it as GPU code callable from the CPU. Each thread computes one global index and handles exactly one element. The `if (i < n)` guard protects against the extra threads in the last block." },
            { lines: [11, 14], note: "Host side: allocate and fill input arrays in normal CPU memory." },
            { lines: [16, 19], note: "Allocate device memory and copy the inputs to the GPU. The `d_` prefix is a common convention for device pointers." },
            { lines: [21, 23], note: "Choose 256 threads per block and enough blocks to cover n (rounding up). Then launch: 4,096 blocks × 256 threads = 1,048,576 threads." },
            { lines: [25, 28], note: "Copy the result back (this waits for the kernel), check one value, and free everything." },
          ] },
        { type: "code", lang: "python", title: "simulate_launch.py", code: `import numpy as np

# Simulate how CUDA launches  vec_add<<<blocks, threads_per_block>>>(a, b, c, n)
n = 10
a = np.arange(n, dtype=np.float32)          # 0, 1, ..., 9
b = np.full(n, 100, dtype=np.float32)
c = np.zeros(n, dtype=np.float32)

threads_per_block = 4                        # blockDim.x
blocks = (n + threads_per_block - 1) // threads_per_block   # round up -> 3
print(f"launch: {blocks} blocks x {threads_per_block} threads = "
      f"{blocks * threads_per_block} threads for {n} elements")

def vec_add_kernel(blockIdx, threadIdx, blockDim):
    """The body every thread runs. Only the indices differ."""
    i = blockIdx * blockDim + threadIdx      # this thread's global index
    if i < n:                                # guard: extra threads do nothing
        c[i] = a[i] + b[i]
        return f"c[{i}]"
    return "idle"

# On a GPU these run at the same time; here we just loop over them.
for blk in range(blocks):
    jobs = [vec_add_kernel(blk, t, threads_per_block) for t in range(threads_per_block)]
    print(f"block {blk}: threads 0-3 -> {jobs}")
print("c =", c)

# Memory coalescing: addresses touched by 8 neighbouring threads (4-byte floats)
tid = np.arange(8)
print("good  (a[i])     byte offsets:", (tid * 4).tolist())
print("bad   (a[i*32])  byte offsets:", (tid * 32 * 4).tolist())`, output: `launch: 3 blocks x 4 threads = 12 threads for 10 elements
block 0: threads 0-3 -> ['c[0]', 'c[1]', 'c[2]', 'c[3]']
block 1: threads 0-3 -> ['c[4]', 'c[5]', 'c[6]', 'c[7]']
block 2: threads 0-3 -> ['c[8]', 'c[9]', 'idle', 'idle']
c = [100. 101. 102. 103. 104. 105. 106. 107. 108. 109.]
good  (a[i])     byte offsets: [0, 4, 8, 12, 16, 20, 24, 28]
bad   (a[i*32])  byte offsets: [0, 128, 256, 384, 512, 640, 768, 896]`,
          walkthrough: [
            { lines: [4, 7], note: "Ten elements: a = 0..9 and b = 100, so the answer should be 100..109." },
            { lines: [9, 12], note: "The launch configuration. Rounding up gives 3 blocks of 4, i.e. 12 threads for 10 elements." },
            { lines: [14, 20], note: "The kernel body every thread runs. Only blockIdx and threadIdx differ between threads." },
            { lines: [22, 26], note: "We loop over blocks and threads to imitate the GPU, which would run them simultaneously. The last two threads fail the guard and stay idle." },
            { lines: [28, 31], note: "Byte addresses touched by 8 neighbouring threads. a[i] gives consecutive addresses (coalesced); a[i*32] scatters them 128 bytes apart. We return to why this matters in the memory section." },
          ] },
      ],
    },
    {
      id: "thread-finds-work",
      title: "How a thread finds its own work",
      blocks: [
        { type: "formula", expr: "i = blockIdx.x × blockDim.x + threadIdx.x", where: [["blockIdx.x", "which block this thread belongs to"], ["blockDim.x", "how many threads each block has"], ["threadIdx.x", "this thread's position within its block"]], caption: "Skip over all the threads in earlier blocks, then add our position inside our own block." },
        { type: "steps", title: "Thread 2 of block 1, with 4 threads per block", items: [
          { title: "Skip earlier blocks", text: "Block 0 already covers indices 0–3, so the blocks before us account for 1 × 4 = 4 elements." },
          { title: "Add own position", text: "We are thread 2 in our block: 4 + 2 = 6." },
          { title: "Check the guard", text: "6 < n = 10, so we do work." },
          { title: "Do the work", text: "Read a[6] and b[6], write c[6] = 106." },
        ] },
        { type: "p", text: "For 2-D data such as a matrix with R rows and C columns, each thread computes a row and a column: `row = blockIdx.y * blockDim.y + threadIdx.y` and `col = blockIdx.x * blockDim.x + threadIdx.x`, then works on element `row * C + col` (matrices are stored row by row in one flat array)." },
        { type: "callout", tone: "tip", title: "Grid-stride loops", text: "If the data is larger than the number of threads we launch, each thread can loop: start at its index i and keep adding the total thread count (blockDim.x × gridDim.x) until it passes n. One kernel then works for any data size." },
        { type: "check", question: "A launch uses 128 threads per block. Which global index does thread 5 of block 3 handle?", answer: "i = 3 × 128 + 5 = 389." },
      ],
    },
    {
      id: "inside-the-gpu",
      title: "What happens inside the GPU when a kernel runs",
      blocks: [
        { type: "p", text: "An NVIDIA GPU is built from many **Streaming Multiprocessors (SMs)** — for example, the A100 has 108 and the H100 SXM has 132. Each SM has its own CUDA cores, Tensor Cores, registers, shared memory/L1 cache and warp schedulers." },
        { type: "steps", title: "From launch to results", items: [
          { title: "Blocks are assigned to SMs", text: "The GPU's scheduler hands blocks to SMs that have free resources. A block stays on one SM until it finishes. Several blocks can live on one SM at once if registers and shared memory allow." },
          { title: "Blocks are split into warps", text: "The SM divides each block into **warps** of 32 consecutive threads. A warp is the real unit of execution: its 32 threads execute the same instruction at the same time on different data." },
          { title: "Warp schedulers pick ready warps", text: "Each cycle, the schedulers choose warps that are ready to run. When a warp waits for memory (hundreds of cycles), the SM simply switches to another ready warp at almost no cost." },
          { title: "Latency is hidden, not avoided", text: "With enough warps in flight (high **occupancy**), there is always someone ready to compute while others wait for data. This is why GPUs want far more threads than they have cores." },
          { title: "Blocks finish, new ones start", text: "As blocks complete, their SM takes new ones until the whole grid is done. Because blocks are independent, the same kernel runs on a small GPU (few SMs, more rounds) or a big one (many SMs, fewer rounds)." },
        ] },
        { type: "callout", tone: "warn", title: "Warp divergence", text: "If threads in the same warp take different branches of an `if`, the warp runs *both* branches one after another, with the inactive threads masked off. A kernel where half of each warp takes each branch can run about half as fast. Arrange data so neighbouring threads usually follow the same path." },
      ],
    },
    {
      id: "memory-in-cuda",
      title: "Memory in CUDA",
      blocks: [
        { type: "table", caption: "The GPU memory hierarchy (fastest and smallest at the top)", head: ["Memory", "Scope", "Speed and size", "Typical use"], rows: [
          ["Registers", "One thread", "Fastest; a limited number per thread", "Local variables, loop counters, partial sums"],
          ["Shared memory", "One block", "On-chip, very fast; tens to a couple of hundred KB per SM", "Tiles of data reused by many threads in a block"],
          ["L1 / L2 cache", "SM / whole GPU", "Automatic caching of global memory", "Reuse without explicit management"],
          ["Global memory (VRAM/HBM)", "All threads, and the host via copies", "Large (GBs) but hundreds of cycles of latency", "Inputs, outputs, model weights"],
          ["Constant memory", "All threads, read-only", "Cached; fast when all threads read the same value", "Small parameters shared by all threads"],
        ] },
        { type: "p", text: "Two rules make kernels fast. **Coalescing:** when the 32 threads of a warp read consecutive addresses (thread k reads element k), the hardware combines them into a few wide memory transactions. If they read scattered addresses, as with `a[i*32]` in our simulation, each read needs its own transaction and effective bandwidth collapses. **Reuse via shared memory:** in matrix multiplication, each input value is needed by many outputs. A **tiled** kernel loads a tile of each matrix from global memory into shared memory once, synchronises the block, and lets every thread reuse those values many times, cutting global-memory traffic by roughly the tile size." },
        { type: "chart", kind: "hbar", title: "Relative cost of reaching data (illustrative)", xLabel: "Relative latency", labels: ["Register", "Shared memory", "L2 cache", "Global memory (HBM)", "Host RAM via PCIe"], series: [{ name: "Relative latency", values: [1, 5, 50, 150, 2000] }], caption: "Illustrative orders of magnitude, not measurements; exact numbers vary by GPU generation. The point: every step down the hierarchy costs much more, so good kernels keep data as high up as possible." },
      ],
    },
    {
      id: "why-kernels-matter",
      title: "Why CUDA kernels matter for AI",
      blocks: [
        { type: "p", text: "Every PyTorch operation on a GPU tensor launches at least one kernel. A naive model runs a long chain of small kernels — matmul, add bias, GELU, dropout, LayerNorm — and each one reads its input from HBM and writes its output back. For element-wise steps the arithmetic is tiny, so the time goes almost entirely to memory traffic and launch overhead." },
        { type: "list", items: [
          "**Kernel fusion** combines several operations into one kernel, so intermediate results stay in registers or shared memory instead of travelling to HBM and back. Compilers like `torch.compile` and XLA do this automatically for many patterns.",
          "**FlashAttention** (2022) is a custom attention kernel that processes queries, keys and values in tiles held in on-chip memory and never writes the full N×N attention matrix to HBM. It computes exactly the same result, uses far less memory, and runs faster, which helped make long context windows practical.",
          "**Tuned matmul libraries** (cuBLAS, CUTLASS) use tiling, Tensor Cores and careful scheduling to get close to the hardware's peak FLOPs.",
          "**Inference engines** such as vLLM and TensorRT-LLM rely on specialised kernels for paged attention, quantised matrix multiplication and sampling.",
          "**Triton** (from OpenAI) lets engineers write GPU kernels in a Python-like language at the level of blocks rather than individual threads, and is used by `torch.compile` to generate fused kernels.",
        ] },
        { type: "callout", tone: "example", title: "Back to our chatbot", text: "Swapping a naive attention implementation for a FlashAttention-style kernel, and enabling a fused, quantised matmul kernel in the serving engine, can raise our chatbot's throughput noticeably without changing the model at all. That is the practical payoff of understanding kernels." },
      ],
    },
    {
      id: "where-kernels-work-and-fail",
      title: "Where CUDA kernels work well and where they fail",
      blocks: [
        { type: "compare", title: "Good and bad fits for a CUDA kernel",
          options: [
            { name: "Works well", summary: "Large, regular, independent work on data already on the GPU.", pros: ["Element-wise maths on big arrays", "Matrix multiplication and convolution", "Reductions (sum, max) with a tree pattern", "Image and signal processing"], cons: ["Still needs care with memory access to reach peak speed"], bestFor: "Big tensors, uniform operations, high arithmetic intensity or perfectly coalesced access" },
            { name: "Works badly", summary: "Small, serial, branchy or transfer-dominated work.", cons: ["Tiny arrays: launch overhead (microseconds) dominates", "Strictly sequential steps where each depends on the last", "Heavy branching that diverges within warps", "Scattered, random memory access", "Work dominated by host↔device copies"], bestFor: "Keep these on the CPU or restructure them first" },
          ],
          rows: [
            ["Data size", "Millions of elements", "Dozens of elements"],
            ["Control flow", "Same path for neighbouring threads", "Many divergent branches"],
            ["Memory pattern", "Consecutive (coalesced)", "Random, scattered"],
          ],
          verdict: "A kernel shines when there is lots of identical, independent work and the data stays on the GPU; otherwise the overheads can make it slower than the CPU." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Forgetting the bounds check `if (i < n)` (out-of-bounds writes corrupt memory); launching too few threads to fill the GPU; ignoring that kernel launches are asynchronous (timing them without synchronising measures nothing); many threads updating the same location without atomics (race conditions); and assuming a custom kernel beats cuBLAS — it rarely does for plain matmul." },
      ],
    },
  ],
  quiz: [
    { q: "What is a CUDA kernel?", options: ["The operating system that runs on the GPU itself", "Code for one thread that the GPU runs on many threads", "The CPU-side code that copies arrays to the GPU", "A special region of fast memory inside each SM"], answer: 1, explain: "A kernel (marked __global__) describes the work of a single thread; the launch configuration decides how many threads run it. Copying data is host-side runtime work, not a kernel." },
    { q: "A kernel is launched with 256 threads per block. Which global index does thread 10 of block 2 compute?", options: ["522", "266", "512", "2,560"], answer: 0, explain: "i = blockIdx.x × blockDim.x + threadIdx.x = 2 × 256 + 10 = 522." },
    { q: "Why does a kernel need the guard `if (i < n)`?", options: ["To make the threads of a block run in a fixed order", "To synchronise all blocks before any thread writes output", "Blocks are rounded up, so some threads index past the data", "Because GPU threads cannot read arrays without a condition"], answer: 2, explain: "We launch ceil(n / threads) blocks, so the last block can contain extra threads. Without the guard they would read and write outside the arrays." },
    { q: "Our custom kernel reads `a[i * 32]` in each thread and runs far below the GPU's memory bandwidth. What is the most likely cause?", options: ["Each thread uses too many registers for its local variables", "Uncoalesced access: a warp's reads are 128 bytes apart", "The block size was chosen as a multiple of 32 threads", "Shared memory is too fast for the global reads to keep up"], answer: 1, explain: "When a warp's 32 threads read consecutive addresses, the hardware merges them into a few transactions. Strided access forces many separate transactions and wastes bandwidth." },
    { q: "Which statement about how kernels run is a misconception?", options: ["Threads in a warp execute the same instruction together", "Blocks may run in any order and must not depend on each other", "While a warp waits for memory, the SM can run another warp", "If/else branches inside one warp never cost any extra time"], answer: 3, explain: "Threads run in warps of 32 that share an instruction stream; if threads in a warp diverge, both branches run one after another with some threads masked. The other statements are correct." },
  ],
  takeaways: [
    "A CUDA kernel is code for one thread, launched on a grid of blocks of threads.",
    "Each thread finds its data with i = blockIdx.x × blockDim.x + threadIdx.x and a bounds check.",
    "The host (CPU) manages memory and launches kernels; the device (GPU) runs blocks on SMs in warps of 32.",
    "Speed depends on memory: coalesced access, shared-memory tiling and keeping data on the GPU.",
    "Fused and specialised kernels (FlashAttention, quantised matmuls) are a major source of AI speed-ups.",
  ],
  terms: [
    { term: "CUDA", def: "NVIDIA's platform and C++ extension for general-purpose GPU programming." },
    { term: "Kernel", def: "A function that runs on the GPU, executed by many threads in parallel." },
    { term: "Thread block", def: "A group of up to 1,024 threads that run on one SM and can share memory and synchronise." },
    { term: "Grid", def: "All the thread blocks of one kernel launch." },
    { term: "Warp", def: "A group of 32 threads that execute the same instruction together." },
    { term: "Streaming Multiprocessor (SM)", def: "One of the GPU's processing units that runs blocks of threads." },
    { term: "Coalesced access", def: "Neighbouring threads reading neighbouring addresses so the hardware can combine their memory requests." },
    { term: "Kernel fusion", def: "Combining several operations into one kernel to avoid round trips to global memory." },
  ],
};
