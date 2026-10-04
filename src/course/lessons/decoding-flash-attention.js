export default {
  id: 'decoding-flash-attention',
  minutes: 29,
  hook: 'How can an algorithm that does the exact same math as standard attention, and even some extra math, run several times faster?',
  summary: 'Standard attention writes a huge n × n score matrix to slow GPU memory and reads it back, so it spends most of its time moving data rather than computing. Flash Attention computes exactly the same result in small tiles that stay in fast on-chip memory, using an online softmax so the full matrix never exists, and recomputes it during the backward pass instead of storing it. Flash Attention 2 and 3 improve how the work is split across the GPU and exploit newer hardware features.',
  sections: [
    {
      id: 'recap',
      title: 'A quick recap of standard attention',
      blocks: [
        { type: 'p', text: 'For a sequence of `n` tokens, each attention head has three matrices of shape `n × d`: queries `Q`, keys `K` and values `V`, where `d` is the head size (often 64 or 128). Standard attention runs three stages:' },
        { type: 'list', ordered: true, items: [
          '**Scores:** `S = QKᵀ / √d`, an `n × n` matrix: one score for every query-key pair.',
          '**Softmax:** `P = softmax(S)` row by row, so each row becomes weights that sum to 1.',
          '**Output:** `O = P · V`, an `n × d` matrix.',
        ] },
        { type: 'viz', name: 'qkv-math', caption: 'Step through Q·Kᵀ, scaling, softmax and the weighted sum of V with real numbers.' },
        { type: 'p', text: 'Notice the shapes: the inputs and output are `n × d`, but the middle (`S` and `P`) is `n × n`. With n = 32,768 and d = 128, the middle is 256 times bigger than the inputs. That middle matrix is the villain of this lesson.' },
      ],
    },
    {
      id: 'why-slow',
      title: 'Why standard attention is slow',
      blocks: [
        { type: 'p', text: 'A naive GPU implementation runs each stage as a separate **kernel** (a program launched on the GPU). Each kernel reads its inputs from the GPU\'s main memory and writes its result back. So `S` is written, read back for softmax, `P` is written, and read back again for the multiply with `V`. For long sequences that is gigabytes of traffic per head per layer.' },
        { type: 'p', text: 'Modern GPUs can do arithmetic far faster than they can fetch data from main memory. Operations like softmax do only a few calculations per number loaded, so they are **memory-bound**: the cores sit idle waiting for data. The Flash Attention paper (Dao et al., 2022) argued that attention\'s real cost is not FLOPs (floating-point operations) but **IO**, the reading and writing of memory. It called the approach **IO-aware**.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like cooking in a small kitchen', text: 'The pantry in the basement is huge but slow to reach; the countertop is tiny but right at hand. Standard attention carries every ingredient up, chops it, carries the result back down, then fetches it again for the next step. Flash Attention brings up a small batch, does every step on the countertop, and only carries the finished dish down.' },
      ],
    },
    {
      id: 'gpu-memory',
      title: 'How GPU memory actually works (HBM vs SRAM)',
      blocks: [
        { type: 'p', text: 'A GPU has a memory hierarchy. Two levels matter here:' },
        { type: 'list', items: [
          '**HBM (High Bandwidth Memory):** the GPU\'s main memory, tens of gigabytes (40–80 GB on an NVIDIA A100). Bandwidth is roughly 1.5–2 TB/s. This is where model weights, activations and the KV cache live.',
          '**SRAM (on-chip shared memory):** tiny, fast memory inside each streaming multiprocessor (SM), on the order of 100–200 KB per SM. The Flash Attention paper cites about 19 TB/s aggregate bandwidth on an A100, roughly ten times faster than HBM.',
        ] },
        { type: 'chart', kind: 'bar', title: 'A100 memory levels as described in the Flash Attention paper', yLabel: 'Bandwidth (TB/s)', unit: ' TB/s', labels: ['HBM (~40–80 GB)', 'On-chip SRAM (~20 MB total)'], series: [ { name: 'Bandwidth', values: [1.5, 19] } ], caption: 'Approximate figures for an A100 as cited by Dao et al. (2022). Big and slow vs tiny and fast.' },
        { type: 'p', text: 'The goal follows directly: do as much work as possible inside SRAM and touch HBM as little as possible. But a 32K × 32K score matrix (about 2 GB in FP16 per head) cannot fit in a few hundred kilobytes of SRAM. We need a way to compute attention without ever holding the full matrix.' },
      ],
    },
    {
      id: 'core-idea',
      title: 'The core idea behind Flash Attention',
      blocks: [
        { type: 'p', text: '**Flash Attention fuses all three stages into one kernel** that processes small blocks. It loads a block of queries into SRAM, then streams blocks of keys and values through SRAM one after another, updating a running output. The `n × n` matrix is never written to HBM; only `Q`, `K`, `V` are read and `O` is written.' },
        { type: 'p', text: 'Two problems must be solved for this to work: how to split the work into tiles (**tiling**) and how to do softmax when we only see part of a row at a time (**online softmax**). For training, a third trick handles the backward pass (**recomputation**).' },
        { type: 'callout', tone: 'note', title: 'Exact, not approximate', text: 'Flash Attention returns the same result as standard attention, up to tiny floating-point rounding differences. It is not a sparse or approximate attention method. That is why it could be adopted everywhere without changing model quality.' },
      ],
    },
    {
      id: 'tiling',
      title: 'Tiling: breaking the work into small blocks',
      blocks: [
        { type: 'steps', title: 'Flash Attention forward pass for one block of queries', items: [
          { title: 'Load a query block', text: 'Copy, say, 128 rows of Q from HBM into SRAM. Initialise a running output O, a running row maximum m = −∞ and a running sum ℓ = 0 for those rows.' },
          { title: 'Stream a key/value block', text: 'Copy the next 128 rows of K and V into SRAM.' },
          { title: 'Score the tile', text: 'Compute the 128 × 128 tile of scores Q_block · K_blockᵀ / √d, entirely in SRAM.' },
          { title: 'Update the softmax statistics', text: 'Update each row\'s max and sum using the online-softmax rule, and rescale the running output.' },
          { title: 'Accumulate', text: 'Add the tile\'s exp-weights times V_block into the running output. Discard the tile.' },
          { title: 'Repeat and finish', text: 'After all key/value blocks, divide O by ℓ and write the finished block of O to HBM. Move to the next query block (in parallel on other SMs).' },
        ] },
        { type: 'p', text: 'HBM traffic drops from "write and read an n × n matrix several times" to "read Q, K, V and write O", which scales with `n × d` instead of `n²`. The amount of arithmetic is about the same (slightly more, because of rescaling), but the GPU is no longer starved for data.' },
      ],
    },
    {
      id: 'online-softmax',
      title: 'Online softmax: computing softmax without the full matrix',
      blocks: [
        { type: 'p', text: 'Softmax seems to need the whole row: to normalise, we divide by the sum over all columns, and for numerical safety we subtract the row\'s maximum first. The **online softmax** trick (Milakov and Gimelshein, 2018) keeps two running numbers per row and fixes up earlier work whenever a new maximum appears.' },
        { type: 'formula', expr: 'm′ = max(m, max(S_b))   ℓ′ = ℓ · e^(m − m′) + ∑ e^(S_b − m′)   O′ = O · e^(m − m′) + e^(S_b − m′) · V_b', where: [ ['m', 'running maximum score seen so far in this row'], ['ℓ', 'running sum of exp(score − m)'], ['O', 'running un-normalised output'], ['S_b, V_b', 'scores and values of the current block'], ['e^(m − m′)', 'correction factor that rescales old results to the new maximum'] ], caption: 'At the end, the true output is O / ℓ.' },
        { type: 'deeper', title: 'A tiny example with numbers', blocks: [
          { type: 'p', text: 'One row has scores [1, 3] in block 1 and [2, 5] in block 2. Block 1: m = 3, ℓ = e^(1−3) + e^(3−3) = 0.135 + 1 = 1.135. Block 2 brings max 5, so m′ = 5. Rescale: ℓ · e^(3−5) = 1.135 × 0.135 = 0.154. Add e^(2−5) + e^(5−5) = 0.050 + 1 = 1.050. New ℓ = 1.203.' },
          { type: 'p', text: 'Check directly: e^(1−5) + e^(3−5) + e^(2−5) + e^(5−5) = 0.018 + 0.135 + 0.050 + 1 = 1.203. Same answer, but we never held all four scores at once.' },
        ] },
        { type: 'code', lang: 'python', title: 'tiled_attention.py', code: `import numpy as np
np.random.seed(0)
n, d, block = 256, 16, 64
Q, K, V = (np.random.randn(n, d) for _ in range(3))

# Standard attention: materialise the full n x n score matrix
S = Q @ K.T / np.sqrt(d)
P = np.exp(S - S.max(1, keepdims=True)); P /= P.sum(1, keepdims=True)
O_std = P @ V

# Flash-style: stream over key/value blocks with an online softmax
O = np.zeros((n, d))
m = np.full((n, 1), -np.inf)          # running max of scores per query row
l = np.zeros((n, 1))                  # running sum of exp(score - max)
for start in range(0, n, block):
    Kb, Vb = K[start:start+block], V[start:start+block]
    Sb = Q @ Kb.T / np.sqrt(d)                      # only n x block scores live
    m_new = np.maximum(m, Sb.max(1, keepdims=True))
    scale = np.exp(m - m_new)                       # rescale old partial results
    Pb = np.exp(Sb - m_new)
    l = l * scale + Pb.sum(1, keepdims=True)
    O = O * scale + Pb @ Vb
    m = m_new
O = O / l                                           # normalise once at the end

print("max |difference| vs standard:", f"{np.abs(O - O_std).max():.2e}")
print("largest score buffer: standard", S.size, "floats | tiled", n * block, "floats")
for n_big in [4096, 32768, 131072]:
    gb = n_big * n_big * 2 / 1e9                    # fp16 score matrix, one head
    print(f"n={n_big:>6}: full score matrix per head = {gb:8.2f} GB")`, output: `max |difference| vs standard: 3.47e-16
largest score buffer: standard 65536 floats | tiled 16384 floats
n=  4096: full score matrix per head =     0.03 GB
n= 32768: full score matrix per head =     2.15 GB
n=131072: full score matrix per head =    34.36 GB`,
          walkthrough: [
            { lines: [6, 9], note: 'Standard attention builds the whole 256 × 256 score matrix S before softmax.' },
            { lines: [11, 14], note: 'Running statistics per query row: output O, max m and sum l.' },
            { lines: [15, 23], note: 'Loop over key/value blocks. Each step only creates a 256 × 64 tile, updates the max, rescales old results by exp(m − m_new) and accumulates.' },
            { lines: [24, 26], note: 'Normalise once at the end; the result matches standard attention to about 1e-16, i.e. it is exact.' },
            { lines: [27, 30], note: 'Why this matters: the full FP16 score matrix for a single head reaches 2 GB at 32K tokens and 34 GB at 131K tokens.' },
          ] },
        { type: 'p', text: 'This numpy version shows the math, not the speed: numpy still uses main memory. The real speedup comes from running the loop inside one GPU kernel where each tile lives in SRAM.' },
        { type: 'check', question: 'In the online softmax, why must the running output O be multiplied by e^(m − m′) when a new, larger maximum m′ appears?', answer: 'Earlier contributions were computed as exp(score − m) using the old maximum. To put them on the same footing as new terms computed with m′, each must be multiplied by exp(m − m′). Without this correction, old blocks would be over-weighted.' },
      ],
    },
    {
      id: 'recomputation',
      title: 'Recomputation in the backward pass',
      blocks: [
        { type: 'p', text: 'Training needs gradients, and the standard backward pass uses the stored `n × n` matrix `P`. Storing it would bring back the memory problem. Flash Attention instead stores only the output `O` and the per-row softmax statistics (`m` and `ℓ`, which are just `n` numbers each). In the backward pass it **recomputes** the score tiles from `Q` and `K` on the fly in SRAM.' },
        { type: 'p', text: 'Recomputing means more arithmetic, yet the backward pass still gets faster, because reading a giant matrix from HBM was more expensive than recomputing it from small inputs. Memory for attention becomes **linear** in sequence length instead of quadratic, which is what made training with long contexts practical.' },
      ],
    },
    {
      id: 'flash-attention-2',
      title: 'Flash Attention 2',
      blocks: [
        { type: 'p', text: 'The first version reached only a modest fraction of the GPU\'s peak speed. **FlashAttention-2** (Dao, 2023) reworked how work is divided, reporting about 2× speedup over the first version and roughly 50–73% of the A100\'s theoretical peak in the forward pass. The main changes:' },
        { type: 'list', items: [
          '**Fewer non-matmul operations.** GPU tensor cores do matrix multiplies far faster than other math, so FA2 delays the final rescaling and cuts extra exponent and division work.',
          '**Parallelism over sequence length.** Besides batch and heads, different query blocks run on different SMs, keeping the GPU busy even with small batches and long sequences.',
          '**Better work split inside a block.** Groups of GPU threads (warps) share work in a way that needs less communication through shared memory.',
        ] },
      ],
    },
    {
      id: 'flash-attention-3',
      title: 'Flash Attention 3',
      blocks: [
        { type: 'p', text: '**FlashAttention-3** (Shah, Dao and colleagues, 2024) targets NVIDIA Hopper GPUs (H100), whose new features FA2 did not use. It reported 1.5–2× speedup over FA2 in FP16, reaching up to about 740 TFLOPS (around 75% of peak), and close to 1.2 PFLOPS with FP8.' },
        { type: 'list', items: [
          '**Asynchrony:** Hopper has a dedicated data-movement engine (TMA) and asynchronous tensor-core instructions. Some warps load data while others compute (**warp specialisation**).',
          '**Overlapping softmax with matmul:** while one block\'s softmax runs, the next block\'s matrix multiply proceeds, hiding the slower exponential operations.',
          '**FP8 support:** uses lower precision for more speed, with techniques to limit the extra rounding error.',
        ] },
        { type: 'p', text: 'Work continued for newer hardware; for example, later releases target NVIDIA\'s Blackwell generation. The details vary by GPU, but the principle stays the same: keep tiles on chip and keep every unit busy.' },
        { type: 'timeline', title: 'Flash Attention versions', items: [
          { when: '2022', title: 'FlashAttention', text: 'IO-aware tiling, online softmax and recomputation; exact attention with linear memory.' },
          { when: '2023', title: 'FlashAttention-2', text: 'Better parallelism and work partitioning; about 2× faster than v1 on A100.' },
          { when: '2024', title: 'FlashAttention-3', text: 'Hopper-specific asynchrony, overlapped softmax and FP8; 1.5–2× faster than v2 on H100.' },
        ] },
      ],
    },
    {
      id: 'advantages-impact',
      title: 'Advantages and impact of Flash Attention',
      blocks: [
        { type: 'compare', title: 'Standard attention vs Flash Attention', options: [
          { name: 'Standard attention', summary: 'Three separate kernels; full n × n matrix stored in HBM.', pros: ['Simple to write', 'Easy to inspect attention weights'], cons: ['Memory grows with n²', 'Dominated by memory traffic', 'Long contexts run out of memory'], bestFor: 'Teaching, debugging, very short sequences' },
          { name: 'Flash Attention', summary: 'One fused kernel over tiles in SRAM with online softmax.', pros: ['Exact same result', 'Memory linear in n', 'Several times faster on long sequences'], cons: ['Hardware-specific kernels', 'Attention weights are never materialised for inspection'], bestFor: 'Training and serving nearly all modern LLMs' },
        ], rows: [
          ['Result', 'Exact', 'Exact'],
          ['Extra memory', 'O(n²)', 'O(n)'],
          ['HBM traffic', 'High (n² reads/writes)', 'Low (Q, K, V, O only)'],
          ['FLOPs', 'Baseline', 'Slightly more (recomputation)'],
        ], verdict: 'Flash Attention wins by moving less data, not by doing less math. It is now the default attention kernel in PyTorch (scaled_dot_product_attention can dispatch to it) and in serving engines.' },
        { type: 'callout', tone: 'warn', title: 'Common misconceptions', text: 'Flash Attention does **not** make attention linear in compute: scores for all n² pairs are still computed. It makes **memory** linear and removes the IO bottleneck. It also does not shrink the KV cache during generation; that is the job of GQA, quantization or compressed attention. And during single-token decoding, the gains come from different kernels (such as Flash-Decoding), because there is only one query row.' },
        { type: 'check', question: 'A team doubles their context from 32K to 64K tokens and switches to Flash Attention. Will attention compute (FLOPs) per layer stay the same?', answer: 'No. Doubling n still roughly quadruples the number of score computations, because Flash Attention is exact attention. What it fixes is memory (no n × n matrix stored) and memory traffic, which makes the longer context fit and run much faster than it otherwise would.' },
      ],
    },
    {
      id: 'worked-example-tile-budget',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: "How small must a tile be to stay on chip? Let us do the budget for one query block of 128 rows, head size d = 64, numbers stored in FP16 (2 bytes each), and a sequence of 4,096 tokens. This is an illustrative budget; real kernels choose block sizes per GPU." },
        { type: 'table', caption: "What must be held in fast memory while one tile is processed (illustrative)", head: ['Item', 'Numbers', 'Size in FP16'], rows: [
          ['Score tile, 128 × 128', '16,384', '32 KiB'],
          ['Query block, 128 × 64', '8,192', '16 KiB'],
          ['Key block, 128 × 64', '8,192', '16 KiB'],
          ['Value block, 128 × 64', '8,192', '16 KiB'],
          ['Running output plus m and ℓ', '8,448', 'about 16.5 KiB'],
          ['Total for one tile', '49,408', 'about 97 KiB'],
          ['Full 4,096 × 4,096 score matrix, for comparison', '16,777,216', '32 MiB'],
        ] },
        { type: 'p', text: "About 97 KiB is on the order of the on-chip memory of one streaming multiprocessor. The full score matrix for a single head is roughly 340 times larger, so it can only live in HBM. The same sequence needs (4,096 / 128)² = 1,024 tiles, each one created, used and thrown away." },
        { type: 'p', text: "When we write our own tiled attention and it does not match the standard result, the cause is almost always one of three slips:" },
        { type: 'list', items: [
          "**Rescaling ℓ but not O.** Both running numbers were computed against the old maximum, so both need the factor e^(m − m′).",
          "**Starting m at 0 instead of −∞.** If every score in a row is negative, a start value of 0 is treated as a maximum that never existed and the row is scaled wrongly.",
          "**Normalising inside the loop.** Dividing by ℓ after each block and then adding more blocks mixes normalised and un-normalised terms. Divide once, at the end.",
        ] },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: "We will run the online softmax by hand for a single query row, in plain Python, and print the running maximum, the running sum and the answer so far after each block. One row is enough to see every moving part." },
        { type: 'code', lang: 'python', title: 'practice_online_softmax.py', code: `import math

scores = [1.0, 3.0, 2.0, 5.0, 0.5, 4.0]        # one query row, 6 keys (illustrative)
values = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]  # one number per key, to keep it small
BLOCK = 2

m, l, o = -math.inf, 0.0, 0.0                  # running max, sum, un-normalised output
for start in range(0, len(scores), BLOCK):
    sb, vb = scores[start:start + BLOCK], values[start:start + BLOCK]
    m_new = max(m, max(sb))
    scale = math.exp(m - m_new)                # shrink old results to the new max
    pb = [math.exp(s - m_new) for s in sb]
    l = l * scale + sum(pb)
    o = o * scale + sum(p * v for p, v in zip(pb, vb))
    m = m_new
    print(f"block {start // BLOCK}: m={m:.1f} scale={scale:.3f} l={l:.4f} "
          f"output so far={o / l:.3f}")

# Check against the ordinary softmax that sees the whole row at once
top = max(scores)
w = [math.exp(s - top) for s in scores]
direct = sum(wi * vi for wi, vi in zip(w, values)) / sum(w)
print(f"online={o / l:.6f} direct={direct:.6f}")
print("scores held at once:", BLOCK, "instead of", len(scores))`, output: `block 0: m=3.0 scale=0.000 l=1.1353 output so far=18.808
block 1: m=5.0 scale=0.135 l=1.2034 output so far=36.881
block 2: m=5.0 scale=1.000 l=1.5824 output so far=42.347
online=42.347429 direct=42.347429
scores held at once: 2 instead of 6`,
          walkthrough: [
            { lines: [3, 7], note: "One row of six scores, one value per key, and blocks of two. The running maximum starts at −∞, the running sum and output at 0." },
            { lines: [8, 15], note: "For each block: find the new maximum, compute the correction factor, rescale the old sum and old output, then add the new block's terms." },
            { lines: [16, 17], note: "Print the state after each block. The first two blocks reproduce the numbers of the small example from the online softmax section: ℓ = 1.135, then 1.203." },
            { lines: [19, 24], note: "Compare with a softmax over the whole row. The two answers agree to six decimals, while the loop never held more than two scores." },
          ] },
        { type: 'p', text: "Now change it:" },
        { type: 'list', items: [
          "Set `BLOCK = 1`, then `BLOCK = 3`. Predict whether the final answer changes, and how many lines the loop prints.",
          "Move the score `5.0` to the front of the list (and its value `40.0` with it). Predict the `scale` printed for the second and third block.",
          "Break it on purpose: change line 14 to `o = o + sum(...)` without the `scale`. Predict whether the wrong answer lands above or below 42.35, and say why.",
        ] },
        { type: 'check', question: "In the output, block 2 prints scale=1.000. Why, and what does that say about how often the correction costs anything?", answer: "Block 2 holds the scores 0.5 and 4.0, both below the current maximum of 5.0. The maximum does not change, so the factor is e⁰ = 1 and the old results are kept as they are. A real correction only happens when a block brings a new row maximum." },
        { type: 'check', question: "Block 0 prints scale=0.000. Is that a bug?", answer: "No. The running maximum starts at −∞, so the factor is e^(−∞ − 3) = 0. It multiplies a running sum and output that are still 0, so nothing is lost. This start value is what lets the first block use the same update rule as every other block, with no special case." },
      ],
    },
  ],
  quiz: [
    { q: 'According to the Flash Attention paper, what mainly limits the speed of standard attention on GPUs?', options: ['The sheer number of floating-point multiplications', 'Moving large n × n matrices through slow HBM', 'The size of the vocabulary in the output layer', 'The number of Transformer layers in the model'], answer: 1, explain: 'Standard attention is memory-bound: the n × n matrices travel to and from HBM. Flash Attention is "IO-aware" and cuts that traffic.' },
    { q: 'In the online softmax, a row\'s running maximum changes from m = 3 to m′ = 5. By what factor must the running sum be multiplied?', options: ['e^(−2)', 'e^(2)', '5 / 3', '1 (no correction)'], answer: 0, explain: 'The correction is e^(m − m′) = e^(3 − 5) = e^(−2) ≈ 0.135, which re-expresses old terms relative to the new maximum.' },
    { q: 'How does Flash Attention handle the backward pass without storing the n × n attention matrix?', options: ['It approximates the gradients by random sampling of rows', 'It moves the full matrix to CPU memory and reads it back', 'It keeps O and row statistics, and recomputes score tiles', 'It skips gradients for attention layers to save memory'], answer: 2, explain: 'Recomputing tiles costs extra FLOPs but avoids huge memory reads, so it is still faster and memory becomes linear in n.' },
    { q: 'Which statement correctly compares Flash Attention with standard attention?', options: ['It is an approximation that trades some accuracy for speed', 'Same result, but O(n) extra memory instead of O(n²)', 'It reduces attention FLOPs from quadratic to linear in n', 'It only works for sequences shorter than 4K tokens'], answer: 1, explain: 'It is exact. Compute is still quadratic; memory and IO are what improve.' },
    { q: 'A colleague says "We use Flash Attention, so we no longer need GQA to save memory when serving long chats." What is the flaw?', options: ['Flash Attention cannot be used at all during serving', 'GQA and Flash Attention are two names for one technique', 'It avoids the score matrix but not the stored KV cache', 'Flash Attention makes the KV cache several times larger'], answer: 2, explain: 'The KV cache is a separate memory cost. Flash Attention avoids storing scores; GQA (or quantization) shrinks the cache. They are complementary.' },
  ],
  takeaways: [
    'Standard attention is slow mainly because it moves an n × n matrix through slow HBM.',
    'GPUs have big, slow HBM and tiny, fast on-chip SRAM; Flash Attention keeps its work in SRAM.',
    'Tiling plus online softmax compute exact attention without ever storing the full matrix.',
    'Recomputation in the backward pass trades extra FLOPs for far less memory traffic.',
    'FA2 improved parallelism and work split; FA3 used Hopper features such as asynchrony and FP8.',
    'Flash Attention fixes memory and IO, not the quadratic FLOPs or the KV cache size.',
  ],
  terms: [
    { term: 'HBM', def: 'High Bandwidth Memory: the GPU\'s large but comparatively slow main memory.' },
    { term: 'SRAM', def: 'Small, very fast on-chip memory inside each GPU streaming multiprocessor.' },
    { term: 'IO-aware', def: 'Designed to minimise data movement between memory levels, not just arithmetic.' },
    { term: 'Kernel fusion', def: 'Combining several GPU operations into one kernel so intermediates never leave fast memory.' },
    { term: 'Tiling', def: 'Splitting matrices into small blocks that fit in fast memory and processing them one by one.' },
    { term: 'Online softmax', def: 'Computing softmax incrementally with a running max and sum, rescaling earlier partial results.' },
    { term: 'Recomputation', def: 'Recomputing intermediates in the backward pass instead of storing them.' },
  ],
};
