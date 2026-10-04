export default {
  id: "how-does-a-google-tpu-work",
  minutes: 26,
  hook: "What if, instead of building a chip that can do anything, we built one that does almost nothing except multiply matrices — but does that thousands of times more efficiently?",
  summary: "A TPU (Tensor Processing Unit) is Google's custom chip for neural networks. Its heart is a systolic array: a grid of simple multiply-add cells through which data pulses in lockstep, so each number fetched from memory is reused many times without being re-read. That makes matrix multiplication very fast and power-efficient, at the cost of flexibility: TPUs shine on large, regular, compiled workloads and struggle with irregular or dynamic ones.",
  sections: [
    {
      id: "what-is-a-tpu",
      title: "What is a TPU?",
      blocks: [
        { type: "p", text: "A **TPU (Tensor Processing Unit)** is an **ASIC** — an application-specific integrated circuit, a chip designed for one job — that Google builds to run neural networks. A 'tensor' is just a multi-dimensional array of numbers (a vector is a 1-D tensor, a matrix a 2-D tensor), and neural networks are mostly operations on tensors." },
        { type: "p", text: "Google started using its first TPU inside its data centres in 2015 and revealed it in 2016. Since then it has released many generations: later ones train as well as run models, use high-bandwidth memory, and are connected by the thousands into **pods**. TPUs power Google products such as Search, Photos and Translate, were used to train Google's Gemini models, and are rented to other companies through Google Cloud." },
        { type: "callout", tone: "analogy", title: "Think of it like a dedicated pasta machine", text: "A home kitchen (a CPU) can cook anything. A restaurant kitchen with many cooks (a GPU) can cook many dishes at once. A pasta factory machine (a TPU) only makes pasta — but it turns flour into noodles faster, cheaper and with less energy than any kitchen. If our menu is 90% pasta, the factory machine is a great investment. If the menu changes every day, it is not." },
      ],
    },
    {
      id: "why-google-built-it",
      title: "Why Google built the TPU",
      blocks: [
        { type: "p", text: "Around 2013, Google saw deep learning spreading through its products — speech recognition especially. Google has described an internal projection from that time: if people used voice search for just a few minutes a day, running the neural networks on the CPUs of the day would have required roughly doubling its data-centre capacity. Buying that many general-purpose servers was not realistic." },
        { type: "p", text: "So Google built a chip that did the core neural-network operation far more efficiently. The first TPU was designed, built and deployed in about 15 months. In Google's 2017 paper on it, the TPU v1 ran Google's production inference workloads roughly 15–30× faster than the contemporary CPU and GPU it was compared with, and delivered roughly 30–80× better performance per watt." },
        { type: "timeline", title: "TPU generations (high level)", items: [
          { when: "2015", title: "TPU v1", text: "Inference only. 8-bit integer maths on a 256×256 systolic array (65,536 multiply-accumulate cells) at 700 MHz, with 28 MiB of on-chip memory." },
          { when: "2017", title: "TPU v2", text: "Adds training: floating-point maths with the bfloat16 format (which Google introduced), high-bandwidth memory, and chips linked into pods." },
          { when: "2018–2021", title: "v3 and v4", text: "More compute per chip, liquid cooling (v3), and much larger pods (v4 links thousands of chips with reconfigurable optical switches)." },
          { when: "2023–2025", title: "v5e, v5p, Trillium, Ironwood", text: "Variants tuned for cost-efficiency or peak scale, and newer generations with larger matrix units and memory; Google positioned Ironwood (announced 2025) especially for inference." },
        ] },
        { type: "callout", tone: "note", title: "Numbers change every generation", text: "Exact figures — matrix-unit size, memory, bandwidth, chips per pod — differ by generation and are best checked in Google Cloud's current documentation. The design ideas in this lesson are what stay the same." },
      ],
    },
    {
      id: "cpu-gpu-refresher",
      title: "A quick refresher: CPU and GPU",
      blocks: [
        { type: "compare", title: "Three ways to multiply matrices",
          options: [
            { name: "CPU", summary: "A few powerful, general cores.", pros: ["Runs anything, including complex branching code"], cons: ["Few arithmetic units", "Each operation fetches operands from registers/caches and writes results back"], bestFor: "General-purpose software and orchestration" },
            { name: "GPU", summary: "Thousands of simpler cores plus Tensor Cores, programmable with CUDA.", pros: ["Massive parallelism", "Flexible: graphics, simulation, any ML model"], cons: ["Still a general processor: lots of chip area and energy go to scheduling, caches and register files"], bestFor: "Flexible high-throughput computing, most AI research and production" },
            { name: "TPU", summary: "A large systolic array dedicated to matrix multiply, plus vector and scalar units, driven by a compiler.", pros: ["Very high matmul throughput per watt", "Data reused inside the array instead of re-read"], cons: ["Narrower: best for dense, regular tensor maths", "Available mainly through Google Cloud"], bestFor: "Large-scale training and serving of dense neural networks" },
          ],
          verdict: "All three can multiply matrices. The difference is how much of the chip and the energy budget goes into the multiply itself versus everything around it." },
      ],
    },
    {
      id: "the-one-operation",
      title: "The one operation that matters most",
      blocks: [
        { type: "p", text: "Look inside any modern neural network and one operation dominates: **matrix multiplication**, built from **multiply-accumulate (MAC)** steps: `acc = acc + a × b`. Fully connected layers, the attention projections and feed-forward blocks of a Transformer, and convolutions (which can be rewritten as matrix multiplies) all reduce to enormous numbers of MACs." },
        { type: "p", text: "Here is the key observation behind the TPU. In a matrix multiply Y = X · W, every input value is used many times: each entry of X is multiplied by a whole row of W, and each weight is used for every row of X. A general processor tends to fetch values from memory (or at least from registers) again for each use. But **moving data costs far more energy than multiplying it**. Estimates for chips of the 2010s put an off-chip DRAM access at hundreds of times the energy of an 8- or 16-bit multiply. So the winning design is one that fetches each number once and reuses it as many times as possible." },
        { type: "check", question: "For Y = X · W with X of size 2×3 and W of size 3×3, how many multiply-accumulate operations are needed, and how many times is each element of X used?", answer: "2 × 3 × 3 = 18 MACs. Each element X[m, k] is multiplied by every weight in row k of W, so it is used 3 times (once per output column)." },
      ],
    },
    {
      id: "systolic-array",
      title: "The big idea: the systolic array",
      blocks: [
        { type: "p", text: "A **systolic array** is a grid of identical, very simple **processing elements (PEs)**. Each PE can do one multiply-accumulate per clock tick and talks only to its immediate neighbours. Data enters at the edges and moves one PE per tick, in rhythm — like blood pumped by a heart, which is where the name 'systolic' comes from. The idea dates back to H. T. Kung and Charles Leiserson's work in the late 1970s; the TPU applied it at a huge scale." },
        { type: "callout", tone: "analogy", title: "Think of it like a bucket brigade", text: "Instead of each firefighter running to the well, people stand in a line and pass buckets hand to hand. Each bucket is filled once at the well and travels the whole line. In a systolic array, each number is read from memory once and handed from PE to PE, being used at every stop." },
        { type: "p", text: "The TPU v1 used a **weight-stationary** design. Before the computation, a block of weights is loaded so that each PE holds one weight, W[k, n]. Then:" },
        { type: "list", items: [
          "**Activations** (the input values X) flow in from the left edge and move one PE to the right each tick.",
          "**Partial sums** flow downward one PE each tick. At each PE: new partial sum = partial sum from above + (activation passing through × the PE's stored weight).",
          "**Finished results** fall out of the bottom edge: each column produces one output column of Y.",
        ] },
        { type: "chart", kind: "bar", title: "Multiply-accumulates per clock tick for an N×N array", yLabel: "MACs per tick", labels: ["3×3 (our demo)", "128×128", "256×256 (TPU v1)"], series: [{ name: "MACs per tick", values: [9, 16384, 65536] }], caption: "Exact: N² cells, each doing one MAC per tick when the array is full. At 700 MHz, 65,536 MACs per tick is about 46 trillion MACs (≈ 92 trillion operations) per second, matching TPU v1's published peak." },
      ],
    },
    {
      id: "data-flow",
      title: "How data flows through a TPU",
      blocks: [
        { type: "p", text: "Let us simulate a tiny 3×3 weight-stationary array computing Y = X · W, where X has two input rows. The inputs must be **skewed** (staggered in time): row k of the array receives its value one tick later than row k − 1, so that each activation meets the right partial sum at the right PE." },
        { type: "code", lang: "python", title: "systolic_array.py", code: `import numpy as np

# Compute Y = X @ W on a tiny 3x3 weight-stationary systolic array.
X = np.array([[1, 2, 3],
              [4, 5, 6]])            # 2 inputs (M=2) of size K=3
W = np.array([[1, 0, 2],
              [0, 1, 1],
              [1, 1, 0]])            # K=3 x N=3 weights, one per PE
M, K = X.shape; N = W.shape[1]

act = np.zeros((K, N), int)     # activation register in each PE (moves right)
psum = np.zeros((K, N), int)    # partial-sum register in each PE (moves down)
Y = np.zeros((M, N), int)
for t in range(M + K + N - 2):
    # 1) every activation hops one PE to the right; new ones enter on the left,
    #    skewed so row k receives X[m, k] at cycle m + k
    act[:, 1:] = act[:, :-1].copy()
    for k in range(K):
        m = t - k
        act[k, 0] = X[m, k] if 0 <= m < M else 0
    # 2) every partial sum hops one PE down and picks up act * weight
    above = np.vstack([np.zeros((1, N), int), psum[:-1]])
    psum = above + act * W
    # 3) finished sums fall out of the bottom row: column n carries row m=t-(K-1)-n
    for n in range(N):
        m = t - (K - 1) - n
        if 0 <= m < M:
            Y[m, n] = psum[K - 1, n]
    print(f"cycle {t}: activations entering left = {act[:, 0].tolist()}")

print("systolic result:\\n", Y)
print("numpy X @ W:\\n", X @ W)
print("match:", np.array_equal(Y, X @ W), f"| cycles: {M + K + N - 2}",
      f"| useful multiply-adds: {M * K * N}")`, output: `cycle 0: activations entering left = [1, 0, 0]
cycle 1: activations entering left = [4, 2, 0]
cycle 2: activations entering left = [0, 5, 3]
cycle 3: activations entering left = [0, 0, 6]
cycle 4: activations entering left = [0, 0, 0]
cycle 5: activations entering left = [0, 0, 0]
systolic result:
 [[ 4  5  4]
 [10 11 13]]
numpy X @ W:
 [[ 4  5  4]
 [10 11 13]]
match: True | cycles: 6 | useful multiply-adds: 18`,
          walkthrough: [
            { lines: [3, 9], note: "Two 3-number inputs (X) and a 3×3 weight matrix (W). In weight-stationary mode each of the 9 PEs holds one weight for the whole computation." },
            { lines: [11, 13], note: "Each PE has two registers: the activation passing through it (moves right) and the partial sum it is building (moves down)." },
            { lines: [15, 20], note: "Tick part 1: all activations shift one PE right, and new values enter on the left, skewed so row k gets X[m, k] at tick m + k. The printout shows this staircase pattern." },
            { lines: [21, 23], note: "Tick part 2: every PE simultaneously adds activation × weight to the partial sum arriving from above. This single line is 9 MACs at once — in hardware, one tick." },
            { lines: [24, 28], note: "Finished sums leave the bottom row. Column n emits output row m at tick m + (K − 1) + n, again a staircase." },
            { lines: [31, 34], note: "The result matches numpy exactly, after 6 ticks. Each X value entered the array once yet was used 3 times, and each weight was loaded once and used for both input rows." },
          ] },
        { type: "matrix", title: "Values entering each array row, tick by tick", rows: ["tick 0", "tick 1", "tick 2", "tick 3", "tick 4", "tick 5"], cols: ["row 0", "row 1", "row 2"], values: [[1, 0, 0], [4, 2, 0], [0, 5, 3], [0, 0, 6], [0, 0, 0], [0, 0, 0]], format: "int", caption: "Taken from the program output. The diagonal staircase is the skew: X's first row (1, 2, 3) enters on ticks 0, 1, 2; the second row (4, 5, 6) one tick behind." },
        { type: "p", text: "Notice the overheads: the first ticks fill the array (the pipeline 'warms up') and the last ticks drain it. With a 256×256 array processing thousands of input rows, this fill-and-drain time is small compared with the steady state, where all 65,536 PEs do useful work every tick. With tiny inputs, most PEs sit idle — one reason TPUs like large batches." },
      ],
    },
    {
      id: "full-journey",
      title: "The full journey of a TPU computation",
      blocks: [
        { type: "flow", title: "From Python code to results", nodes: [
          { label: "Model code", detail: "We write the model in JAX, TensorFlow or PyTorch (via PyTorch/XLA)." },
          { label: "XLA compiler", detail: "XLA (Accelerated Linear Algebra) traces the whole computation graph, fuses operations, picks memory layouts, tiles matrices to the array size, and produces a static program for the TPU. Shapes must be known at compile time." },
          { label: "Host feeds data", detail: "The host CPU sends input batches and the compiled program to the TPU's high-bandwidth memory." },
          { label: "Matrix unit (MXU)", detail: "Weights and activations are streamed into the systolic arrays; matrix multiplies run at full rhythm." },
          { label: "Vector and scalar units", detail: "Element-wise work — activations like GELU, normalisation, softmax, adding biases — runs on the vector unit; the scalar unit handles control and addresses." },
          { label: "Results / next layer", detail: "Outputs stay on chip or in HBM as inputs for the next layer; at the end, results return to the host. In pods, chips exchange data over dedicated inter-chip links." },
        ] },
        { type: "steps", title: "Inside one layer, step by step", items: [
          { title: "Load a weight tile", text: "A tile of W (for example 128×128) is moved into the matrix unit and held in the PEs." },
          { title: "Stream activations", text: "Thousands of activation rows are pumped through, skewed in time, while partial sums flow toward the output edge." },
          { title: "Accumulate", text: "Results from successive tiles along the inner dimension are added together in accumulators (TPU v1 kept these in dedicated on-chip accumulator memory)." },
          { title: "Apply the non-linearity", text: "The vector unit applies activation functions and normalisation to the accumulated outputs." },
          { title: "Next tile, next layer", text: "Swap in the next weight tile (TPUs can preload it while the current one is in use) and repeat." },
        ] },
      ],
    },
    {
      id: "why-fast-and-efficient",
      title: "Why a TPU is so fast and power-efficient",
      blocks: [
        { type: "list", items: [
          "**Massive reuse.** Each number fetched from memory is used across a whole row or column of PEs. Fewer memory accesses means less time waiting and much less energy.",
          "**Simple cells, packed densely.** PEs have no instruction fetch, no branch prediction, no caches. Almost all of the chip's area and power goes to arithmetic and on-chip memory.",
          "**Low-precision maths.** INT8 in v1, bfloat16 since v2 (and lower precisions in newer generations): smaller multipliers, more of them per chip, and half or less of the memory traffic of FP32.",
          "**Deterministic, compiled execution.** XLA plans the whole computation ahead of time, so hardware does not need complex dynamic scheduling, and operations are fused to avoid round trips to memory.",
          "**Scale-out by design.** Chips in a pod are linked directly, so huge models can be split across thousands of chips with predictable communication.",
        ] },
        { type: "callout", tone: "tip", title: "bfloat16 came from here", text: "bfloat16 ('brain floating point', named after Google Brain) keeps FP32's 8-bit exponent — the same range of magnitudes — with fewer mantissa bits. Training in it rarely needs special loss scaling. It is now supported by GPUs and other accelerators too." },
      ],
    },
    {
      id: "where-used",
      title: "Where TPUs are used",
      blocks: [
        { type: "table", caption: "TPUs in practice", head: ["Where", "What"], rows: [
          ["Google products", "Search ranking, Translate, Photos, YouTube recommendations, speech recognition"],
          ["Google's own models", "Training and serving Gemini and other large models; earlier, AlphaGo and AlphaZero"],
          ["Google Cloud customers", "Companies and researchers rent TPU slices and pods for training and inference; Apple, for example, has reported training foundation models on TPUs"],
          ["Research", "JAX-based research codebases; the TPU Research Cloud programme has given academics free access"],
        ] },
        { type: "callout", tone: "example", title: "Our shop's perspective", text: "If our appliance shop fine-tunes a model with JAX on Google Cloud, renting a TPU slice can be cost-effective for large, steady training jobs with fixed shapes. If we depend on CUDA-only libraries or need to run on our own servers, GPUs are the practical choice." },
      ],
    },
    {
      id: "limitations",
      title: "Limitations of a TPU",
      blocks: [
        { type: "callout", tone: "warn", title: "Where TPUs struggle", text: "Dynamic shapes (every new input shape can trigger a recompile), heavy data-dependent control flow, sparse or irregular operations that do not map to dense matrix tiles, small batches that leave the array mostly empty, and tensor sizes that do not align with the matrix unit (padding wastes compute). Custom low-level kernels are possible (for example with Pallas) but the ecosystem is smaller than CUDA's." },
        { type: "list", items: [
          "**Availability:** TPUs are offered through Google Cloud (and used internally), not sold as cards for our own servers.",
          "**Software lock-in:** best support is for JAX and TensorFlow; PyTorch works through PyTorch/XLA, with some features and libraries lagging.",
          "**Debugging and profiling** of compiled programs can feel less direct than eager-mode GPU code.",
          "**Not general-purpose:** no graphics, little use outside dense tensor maths.",
        ] },
        { type: "p", text: "When not to choose a TPU: for small experiments that need many CUDA-specific libraries, for workloads with constantly changing shapes, or when data must stay on-premises." },
      ],
    },
    {
      id: "worked-array-utilisation",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The simulation above produced the right answer. Now let us ask how *well* the tiny array was used. We stay with the same toy: a 3×3 weight-stationary array and X with M = 2 rows. Everything here is arithmetic on our own toy model; it shows the design idea and is not a measurement of any real TPU." },
        { type: "steps", title: "Scoring the 2 × 3 × 3 example", items: [
          { title: "Useful work", text: "M × K × N = 2 × 3 × 3 = **18** multiply-accumulates, as the program printed." },
          { title: "Time taken", text: "M + K + N − 2 = **6 ticks**: the staircase needs a few ticks to fill the array and a few to drain it." },
          { title: "Capacity offered", text: "9 cells × 6 ticks = 54 cell-ticks. Only 18 of them did useful work: the array was **33%** busy. The rest were cells waiting for data to arrive or leave." },
          { title: "Memory reads with reuse", text: "Each X value enters once (2 × 3 = 6 reads) and each weight is loaded once (9 reads): **15** reads in total." },
          { title: "Memory reads without reuse", text: "A design that fetched both operands for every multiply would need 2 × 18 = **36** reads. The array saved a factor of 2.4, even on this tiny job." },
          { title: "Feed it more rows", text: "With M input rows the busy share is M / (M + K + N − 2) = M / (M + 4). At M = 16 it is 80%; at M = 96 it is 96%. The fill and drain cost is paid once, so longer streams make it matter less." },
        ] },
        { type: "chart", kind: "line", title: "Toy 3×3 array: busy share vs number of input rows", xLabel: "Input rows M", yLabel: "Busy cells (%)", series: [
          { name: "Busy share", points: [[1, 20], [2, 33], [4, 50], [8, 67], [16, 80], [36, 90], [96, 96]] },
        ], caption: "Exact for our toy model: M / (M + 4), in percent. A single input row keeps the array only 20% busy; a long stream of rows keeps it nearly full." },
        { type: "p", text: "This is the arithmetic behind two limits listed in this lesson. **Small batches** leave the array mostly empty, because fill and drain dominate. And **sizes that do not line up** with the array waste cells: in a toy with 128×128 tiles, a 130×128 weight matrix needs two tiles, and almost half of their cells would hold padding zeros. When a job runs slower than expected on this kind of hardware, batch size and layer sizes are the first two things to look at." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will write a small calculator for our toy systolic array. It counts useful multiply-accumulates, ticks, how busy the cells are, and how many memory reads the reuse saves. Then it checks how well weight matrices of different sizes fit into square tiles." },
        { type: "code", lang: "python", title: "practice_array_planner.py", code: `import math
import numpy as np

def plan(M, K, N):
    """Cost of Y = X @ W (X is M x K, W is K x N) on a K x N toy array."""
    macs = M * K * N                             # useful multiply-accumulates
    naive_reads = 2 * macs                       # fetch both operands every time
    reuse_reads = M * K + K * N                  # read each X and each W once
    ticks = M + K + N - 2                        # fill + steady state + drain
    busy = macs / (ticks * K * N)                # share of cell-ticks doing work
    return macs, naive_reads, reuse_reads, ticks, busy

# Check the toy model against the lesson's 2 x 3 x 3 example.
X = np.array([[1, 2, 3], [4, 5, 6]])
W = np.array([[1, 0, 2], [0, 1, 1], [1, 1, 0]])
macs, naive, reuse, ticks, busy = plan(*X.shape, W.shape[1])
print(f"lesson example: {macs} MACs in {ticks} ticks, array busy {busy:.0%}")
print(f"  memory reads: {naive} without reuse, {reuse} with reuse")

print("more input rows through the same 3x3 array:")
for M in (1, 2, 16, 96):
    macs, naive, reuse, ticks, busy = plan(M, 3, 3)
    print(f"  M={M:3d}: ticks={ticks:3d}  busy={busy:4.0%}  "
          f"reads saved={naive / reuse:.1f}x")

print("fitting a K x N weight matrix into square tiles of 128:")
for K, N in [(128, 128), (130, 128), (200, 200), (256, 256)]:
    tiles = math.ceil(K / 128) * math.ceil(N / 128)
    used = K * N / (tiles * 128 * 128)           # the rest is zero padding
    print(f"  {K}x{N}: {tiles} tile(s), {used:.0%} of the cells hold real weights")`, output: `lesson example: 18 MACs in 6 ticks, array busy 33%
  memory reads: 36 without reuse, 15 with reuse
more input rows through the same 3x3 array:
  M=  1: ticks=  5  busy= 20%  reads saved=1.5x
  M=  2: ticks=  6  busy= 33%  reads saved=2.4x
  M= 16: ticks= 20  busy= 80%  reads saved=5.1x
  M= 96: ticks=100  busy= 96%  reads saved=5.8x
fitting a K x N weight matrix into square tiles of 128:
  128x128: 1 tile(s), 100% of the cells hold real weights
  130x128: 2 tile(s), 51% of the cells hold real weights
  200x200: 4 tile(s), 61% of the cells hold real weights
  256x256: 4 tile(s), 100% of the cells hold real weights`,
          walkthrough: [
            { lines: [4, 11], note: "The planner. Useful work is M·K·N. Without reuse we would read two operands per multiply-accumulate; with reuse we read each X value and each weight once. Ticks follow the fill-run-drain formula from the simulation." },
            { lines: [14, 18], note: "A check against the lesson's example: 18 MACs in 6 ticks, 33% busy, 36 reads without reuse against 15 with it." },
            { lines: [21, 24], note: "More input rows through the same 3×3 array. The busy share climbs from 20% to 96%, and the reads saved approach 6×." },
            { lines: [27, 30], note: "Tiling in the toy model. A matrix that is slightly too big for one tile needs a whole extra tile, and most of that tile is padding." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "In the second loop, call `plan(M, 256, 256)` with `M` in `(1, 256, 4096)`. Predict the busy share for each. How many rows does a big array need before it is mostly full?",
          "Add `(129, 129)` to the list of matrix sizes. Predict the number of tiles and the share of cells holding real weights.",
          "Give `X` a third row, `[7, 8, 9]`. Predict the MACs, ticks and busy share printed on the 'lesson example' line.",
        ] },
        { type: "check", question: "In the run above, 'reads saved' rose from 1.5× to 5.8× as M grew, and it will never pass 6× for this 3×3 array. Why 6?", answer: "Without reuse we read 2·M·K·N = 18·M values. With reuse we read M·K + K·N = 3·M + 9. For large M the fixed 9 weight reads stop mattering, and the ratio tends to 18·M / 3·M = 6, which is 2 × N. Each X value is used N = 3 times after a single read, and each weight is reused for every row. A wider array (larger N) would save even more per value read." },
        { type: "check", question: "In the toy tiling, a 130×128 matrix used 2 tiles with 51% real weights. A teammate suggests making the layer 128 wide instead of 130. What would we gain, and what must we check?", answer: "In the toy model the matrix would then fit one tile exactly: half the tiles and no padding, so no cells spend ticks multiplying zeros. What we must check is the model itself: a slightly narrower layer has fewer parameters, so we should confirm that accuracy does not suffer. The general habit is to pick sizes that line up with the hardware when the model does not care about the difference." },
      ],
    },
  ],
  quiz: [
    { q: "What is the core component that makes a TPU efficient at matrix multiplication?", options: ["A large branch predictor that guesses the next instruction", "Thousands of independent CUDA cores with their own caches", "A very large L3 cache shared by a few general-purpose cores", "A systolic array of multiply-accumulate cells"], answer: 3, explain: "The systolic array reuses each fetched value across many cells as data pulses through the grid. CUDA cores belong to GPUs; branch predictors and big caches are CPU features." },
    { q: "Why does reusing data inside the array save so much energy?", options: ["Moving data costs far more energy than multiplying it", "Multipliers use far more energy than any memory read", "Reused data is automatically compressed by the chip", "It lets the TPU skip the accumulate step entirely"], answer: 0, explain: "A memory access, especially off-chip, costs many times the energy of an arithmetic operation. Fetching once and reusing many times is the whole point of the systolic design." },
    { q: "In a 256×256 systolic array, how many multiply-accumulates can happen per clock tick when the array is full?", options: ["256", "512", "65,536", "16,384"], answer: 2, explain: "Every one of the 256 × 256 = 65,536 cells does one MAC per tick. 16,384 is a 128×128 array." },
    { q: "Our team's model has inputs whose shapes change on every request and lots of data-dependent branching. Training it on a TPU is slow. What is the most likely reason?", options: ["TPUs cannot perform floating-point maths, only integers", "Dynamic shapes and branches fight XLA's static compiling", "TPUs have no memory of their own to hold the weights", "The systolic array can only compute convolutions"], answer: 1, explain: "TPUs run programs compiled ahead of time for fixed shapes; changing shapes trigger recompilation and irregular work maps poorly to dense matrix tiles. TPUs do support floating point (bfloat16) and all matrix multiplies." },
    { q: "In the weight-stationary design from the lesson, what moves and what stays put?", options: ["Weights stay; activations move right, partial sums move down", "Activations stay in the cells while the weights move across the grid", "Everything stays put and only the clock signal moves", "Outputs stay put; inputs and weights are re-read every tick"], answer: 0, explain: "Each cell holds one weight. Activations flow in from the left, partial sums flow downward and finished results leave the bottom edge. Re-reading from memory every tick is exactly what the design avoids." },
  ],
  takeaways: [
    "A TPU is Google's ASIC for neural networks, built around matrix multiplication.",
    "Its systolic array passes data between neighbouring cells so each value is fetched once and reused many times.",
    "Reuse, simple cells, low precision (INT8, bfloat16) and compiled execution make it fast and power-efficient.",
    "The XLA compiler turns JAX/TensorFlow/PyTorch code into static programs with fixed shapes.",
    "TPUs excel at large, regular, dense workloads and struggle with dynamic shapes, irregular operations and small batches.",
  ],
  terms: [
    { term: "TPU", def: "Tensor Processing Unit: Google's custom chip for neural-network computation." },
    { term: "ASIC", def: "Application-specific integrated circuit: a chip designed for one kind of task." },
    { term: "Systolic array", def: "A grid of simple processing elements through which data flows rhythmically between neighbours." },
    { term: "Multiply-accumulate (MAC)", def: "The operation acc = acc + a × b, the building block of matrix multiplication." },
    { term: "Weight-stationary", def: "A systolic dataflow where each cell holds a fixed weight while activations and partial sums move." },
    { term: "XLA", def: "Accelerated Linear Algebra: the compiler that turns ML programs into optimised TPU (and GPU) code." },
    { term: "bfloat16", def: "A 16-bit floating-point format with FP32's exponent range and fewer mantissa bits." },
  ],
};
