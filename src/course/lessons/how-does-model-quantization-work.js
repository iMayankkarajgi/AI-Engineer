export default {
  id: 'how-does-model-quantization-work',
  minutes: 27,
  hook: 'How can a 7-billion-parameter model that needs 28 GB in full precision squeeze into 4 GB and still give nearly the same answers?',
  summary: 'Quantization stores a model\'s numbers with fewer bits, for example 8-bit or 4-bit integers instead of 32-bit floats, using a scale (and sometimes a zero-point) to map between the two. That cuts memory by 4–8× and speeds up the memory-bound parts of inference. The art is choosing the right granularity, method and bit width so that rare large values (outliers) do not destroy accuracy.',
  sections: [
    {
      id: 'what-is-quantization',
      title: 'What is model quantization?',
      blocks: [
        { type: 'p', text: 'A neural network is mostly a huge collection of numbers called **weights** (or parameters). A 7B model has about 7 billion of them. During training, each weight is usually stored as a 32-bit or 16-bit floating-point number. **Quantization** means storing those numbers (and sometimes the intermediate values computed from them, called **activations**) with fewer bits, such as 8 or 4.' },
        { type: 'p', text: 'Fewer bits means fewer possible values. A 4-bit number can only take 16 different values. So quantization is a form of rounding: each original weight is snapped to the nearest value on a coarse grid. We accept a small rounding error in exchange for a much smaller, faster model.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like rounding prices', text: 'A shop could price items to the exact tenth of a cent, but tags would be long and hard to read. Rounding to the nearest dollar makes tags tiny, and for most purchases the total barely changes. Quantization rounds a model\'s weights to a coarse grid; the trick is choosing the grid so the "total" (the model\'s answers) barely changes.' },
        { type: 'p', text: 'Our running example: we want to run a 7B chat assistant on a laptop with a 6 GB GPU. In 16-bit it needs about 14 GB just for weights. Quantization is how we make it fit.' },
      ],
    },
    {
      id: 'how-numbers-use-bits',
      title: 'How numbers use bits (FP32, INT8, INT4)',
      blocks: [
        { type: 'p', text: 'A **floating-point** number stores a sign, an **exponent** (which sets the scale, like scientific notation) and a **mantissa** (the significant digits). This lets it cover tiny and huge values. An **integer** format stores whole numbers evenly spaced, with no exponent.' },
        { type: 'table', caption: 'Common number formats in LLMs', head: ['Format', 'Bits', 'Layout / range', 'Bytes per weight'], rows: [
          ['FP32', '32', '1 sign, 8 exponent, 23 mantissa bits; about ±3.4×10³⁸', '4'],
          ['FP16', '16', '1 sign, 5 exponent, 10 mantissa; max about 65,504', '2'],
          ['BF16', '16', '1 sign, 8 exponent, 7 mantissa; FP32\'s range with less precision', '2'],
          ['FP8 (E4M3)', '8', '1 sign, 4 exponent, 3 mantissa; used on recent GPUs', '1'],
          ['INT8', '8', 'Whole numbers −128 … 127 (256 values)', '1'],
          ['INT4', '4', 'Whole numbers −8 … 7 (16 values)', '0.5'],
        ] },
        { type: 'viz', name: 'quantization', caption: 'Slide the bit width down and watch weights snap to fewer grid points; the error grows and the memory shrinks.' },
      ],
    },
    {
      id: 'why-fewer-bits-helps',
      title: 'Why fewer bits means less memory and faster speed',
      blocks: [
        { type: 'p', text: '**Memory** is simple arithmetic: parameters × bytes per parameter. A 7B model needs 28 GB in FP32, 14 GB in FP16, 7 GB in INT8 and 3.5 GB in INT4, plus a little extra for scales and for the KV cache.' },
        { type: 'chart', kind: 'bar', title: 'Weight memory for a 7B model', yLabel: 'GB', unit: ' GB', labels: ['FP32', 'FP16 / BF16', 'INT8', 'INT4'], series: [ { name: 'Weights only', values: [28, 14, 7, 3.5] } ], caption: 'Computed as 7×10⁹ × bits ÷ 8. Real files are slightly larger because scales and a few higher-precision layers are stored too.' },
        { type: 'p', text: '**Speed** improves for two reasons. First, generating each token needs the GPU or CPU to read every weight from memory, and that reading, not the arithmetic, is usually the bottleneck. Halve the bytes and you roughly halve the reading time. Second, many chips have special units that multiply INT8 or FP8 numbers faster than FP16 ones, which helps in compute-heavy phases like processing a long prompt.' },
        { type: 'check', question: 'If token generation on our laptop is limited by memory bandwidth and takes 100 ms per token in FP16, what is a rough estimate in INT4 weights?', answer: 'Around 25–35 ms per token. INT4 weights are a quarter of the bytes of FP16, so reading them takes about a quarter of the time. In practice dequantization overhead and other costs mean the gain is a bit less than 4×.' },
      ],
    },
    {
      id: 'scale-and-zero-point',
      title: 'The core mechanic: scale and zero-point',
      blocks: [
        { type: 'p', text: 'To map real numbers onto integers we need two values. The **scale** `s` is the size of one integer step in real units. The **zero-point** `z` is the integer that represents the real value 0.0.' },
        { type: 'formula', expr: 'q = clamp( round(x / s) + z, qmin, qmax )        x̂ = s · (q − z)', where: [ ['x', 'the original real value (a weight or activation)'], ['s', 'scale: real distance between neighbouring integers'], ['z', 'zero-point: the integer that stands for 0.0'], ['q', 'the stored integer'], ['x̂', 'the dequantized value we compute with; x − x̂ is the rounding error'] ] },
        { type: 'steps', title: 'Quantize four weights to INT8 by hand', items: [
          { title: 'Find the range', text: 'Weights: 0.5, −1.27, 0.02, 1.0. The largest absolute value is 1.27.' },
          { title: 'Compute the scale', text: 'INT8 symmetric uses −127 … 127. s = 1.27 / 127 = 0.01.' },
          { title: 'Divide and round', text: '0.5/0.01 = 50, −1.27/0.01 = −127, 0.02/0.01 = 2, 1.0/0.01 = 100. Store [50, −127, 2, 100] as 1 byte each, plus the one scale.' },
          { title: 'Dequantize when needed', text: 'Multiply back: 50 × 0.01 = 0.50, and so on. Here the error is zero because the numbers fell exactly on the grid; real weights usually land between grid points and lose up to half a step (0.005).' },
        ] },
      ],
    },
    {
      id: 'symmetric-vs-asymmetric',
      title: 'Symmetric vs asymmetric quantization',
      blocks: [
        { type: 'p', text: '**Symmetric** quantization fixes `z = 0` and centres the grid on zero: `s = max|x| / qmax`. It is simple and fast because there is no zero-point to subtract. It fits weights well, since they are usually spread roughly evenly around zero.' },
        { type: 'p', text: '**Asymmetric** quantization uses the actual minimum and maximum: `s = (max − min) / (qmax − qmin)` and a non-zero `z`. It fits lopsided data. Example: activations after a ReLU are never negative. A symmetric grid wastes half its values on negatives that never occur; an asymmetric grid spends all 256 values on the range that is actually used, roughly halving the error.' },
        { type: 'compare', title: 'Symmetric vs asymmetric', options: [
          { name: 'Symmetric', summary: 'Grid centred on zero, zero-point fixed at 0.', pros: ['Simplest maths', 'Fastest integer kernels'], cons: ['Wastes range on skewed data'], bestFor: 'Weights' },
          { name: 'Asymmetric', summary: 'Grid stretched from min to max with a zero-point.', pros: ['Uses all levels on skewed data', 'Lower error for all-positive values'], cons: ['Extra zero-point bookkeeping'], bestFor: 'Activations such as ReLU outputs; low-bit weight blocks' },
        ], rows: [ ['Zero-point', 'Always 0', 'Any integer'], ['Scale', 'max|x| / qmax', '(max − min) / (qmax − qmin)'] ], verdict: 'Weights are usually symmetric; skewed activations benefit from asymmetric. Many 4-bit formats store a per-block minimum, which is the asymmetric idea.' },
      ],
    },
    {
      id: 'per-tensor-vs-per-channel',
      title: 'Per-tensor vs per-channel quantization',
      blocks: [
        { type: 'p', text: 'How many weights share one scale? This choice is called **granularity**.' },
        { type: 'list', items: [
          '**Per-tensor:** one scale for a whole weight matrix. Cheapest to store, but if one row has big values, the scale is large and every small weight in the matrix rounds to almost nothing.',
          '**Per-channel:** one scale per output channel (per row of the matrix). Each row gets a grid that fits its own range.',
          '**Per-group (block-wise):** one scale per small group of, say, 32, 64 or 128 consecutive weights. This is standard for 4-bit LLM formats (GPTQ, AWQ and GGUF all use groups or blocks).',
        ] },
        { type: 'p', text: 'The code below quantizes a 64-row matrix where one row is 20× larger than the rest. Watch the per-tensor error explode, especially at 4 bits.' },
        { type: 'code', lang: 'python', title: 'quantize.py', code: `import numpy as np

def quant_sym(x, bits):
    qmax = 2 ** (bits - 1) - 1                     # 127 for INT8, 7 for INT4
    scale = np.abs(x).max() / qmax                 # one scale, zero-point = 0
    q = np.clip(np.round(x / scale), -qmax, qmax)
    return q * scale                               # dequantize to compare

def quant_asym(x, bits):
    qmin, qmax = 0, 2 ** bits - 1                  # 0..255 for UINT8
    scale = (x.max() - x.min()) / (qmax - qmin)
    zero = np.round(qmin - x.min() / scale)        # integer that stands for 0.0
    q = np.clip(np.round(x / scale) + zero, qmin, qmax)
    return (q - zero) * scale

# Tiny worked example: 4 weights to INT8 (symmetric)
w = np.array([0.5, -1.27, 0.02, 1.0])
scale = np.abs(w).max() / 127
print("scale =", round(scale, 4), " ints =", np.round(w / scale).astype(int))

rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, size=(64, 256))            # 64 output channels
W[3] *= 20                                         # one channel with large weights
relu_out = np.abs(rng.normal(0, 1, 1000))          # all-positive activations
err = lambda a, b: np.abs(a - b).mean()

print("ReLU activations, 8-bit: symmetric err %.4f | asymmetric err %.4f" %
      (err(relu_out, quant_sym(relu_out, 8)), err(relu_out, quant_asym(relu_out, 8))))
for bits in (8, 4):
    per_tensor = quant_sym(W, bits)
    per_channel = np.vstack([quant_sym(row, bits) for row in W])
    print(f"INT{bits} weights: per-tensor err {err(W, per_tensor):.5f} | "
          f"per-channel err {err(W, per_channel):.5f}")
print("memory for 7B params: FP32 %.0f GB, FP16 %.0f GB, INT8 %.0f GB, INT4 %.1f GB"
      % tuple(7e9 * b / 8 / 1e9 for b in (32, 16, 8, 4)))`, output: `scale = 0.01  ints = [  50 -127    2  100]
ReLU activations, 8-bit: symmetric err 0.0075 | asymmetric err 0.0039
INT8 weights: per-tensor err 0.00232 | per-channel err 0.00015
INT4 weights: per-tensor err 0.01639 | per-channel err 0.00281
memory for 7B params: FP32 28 GB, FP16 14 GB, INT8 7 GB, INT4 3.5 GB`, walkthrough: [
          { lines: [3, 7], note: 'Symmetric quantization: one scale from the largest absolute value, round, clip, then dequantize so we can measure the error.' },
          { lines: [9, 14], note: 'Asymmetric quantization: the scale spans min to max and a zero-point shifts the grid so all 256 levels cover the real range.' },
          { lines: [16, 19], note: 'The hand example from the steps above: scale 0.01 and integers [50, −127, 2, 100].' },
          { lines: [21, 24], note: 'A weight matrix with one loud channel (row 3), plus all-positive activations like ReLU outputs.' },
          { lines: [27, 33], note: 'Asymmetric halves the error on positive-only data. Per-channel scales cut weight error by roughly 6–15× because the loud row no longer sets everyone\'s scale.' },
        ] },
        { type: 'p', text: 'Look at the INT4 per-tensor error: 0.016, close to the typical weight size of 0.02. With one shared scale, most normal weights rounded to zero. Per-channel scales bring the error down to 0.003. Granularity matters as much as bit width.' },
      ],
    },
    {
      id: 'ptq-vs-qat',
      title: 'PTQ vs QAT, and weight-only vs weight-and-activation',
      blocks: [
        { type: 'p', text: '**Post-Training Quantization (PTQ)** quantizes an already-trained model. Simple PTQ just rounds the weights. Smarter PTQ uses a small **calibration set** (a few hundred example texts) to see typical activation ranges and to adjust weights so rounding errors cancel. No retraining is needed, so it takes minutes to hours. Almost all LLM quantization is PTQ.' },
        { type: 'p', text: '**Quantization-Aware Training (QAT)** simulates rounding during training or fine-tuning ("fake quantization"), so the model learns weights that survive rounding. Rounding has no useful gradient, so training passes gradients straight through it (the *straight-through estimator*). QAT gives the best low-bit accuracy but needs training data and compute, so it is used mainly by model makers, for example to release official low-bit versions.' },
        { type: 'p', text: 'A second choice is *what* to quantize. **Weight-only** quantization (written W4A16 or W8A16: 4- or 8-bit weights, 16-bit activations) stores weights in low bits and converts them back to 16-bit just before multiplying. It saves memory and speeds up memory-bound decoding. **Weight-and-activation** quantization (W8A8, FP8) also quantizes activations, so the multiply itself runs on fast integer or FP8 units. That helps compute-heavy work like long prompts and large batches, but activations are harder to quantize, as the next section shows.' },
        { type: 'compare', title: 'Choosing a quantization recipe', options: [
          { name: 'PTQ, weight-only', summary: 'Round trained weights to 4–8 bits; keep activations in 16-bit.', pros: ['Fast, no training', 'Big memory savings', 'Robust'], cons: ['Little gain on compute-bound work'], bestFor: 'Local and single-user inference (GPTQ, AWQ, GGUF)' },
          { name: 'PTQ, weights + activations', summary: 'Quantize both, e.g. W8A8 or FP8.', pros: ['Uses fast INT8/FP8 math', 'Helps throughput at large batch'], cons: ['Activation outliers need special handling'], bestFor: 'High-throughput GPU serving' },
          { name: 'QAT', summary: 'Train with simulated rounding.', pros: ['Best accuracy at very low bits'], cons: ['Needs data, compute and a training pipeline'], bestFor: 'Model makers shipping official low-bit models' },
        ] },
      ],
    },
    {
      id: 'outlier-problem',
      title: 'The outlier problem in LLMs',
      blocks: [
        { type: 'p', text: 'LLMs have a quirk. In larger models, a few **hidden dimensions** in the activations take values far larger than the rest, often tens of times larger, and they appear consistently across tokens. The LLM.int8() paper (Dettmers et al., 2022) found that these **outlier features** emerge systematically once models reach roughly the 6.7B-parameter scale, and that naive 8-bit quantization then breaks down.' },
        { type: 'p', text: 'Why it hurts: as our code showed, one large value forces a large scale, and the large scale crushes every normal value onto zero. Removing outliers is not an option either, because the model relies on them. Several fixes exist:' },
        { type: 'list', items: [
          '**Mixed precision (LLM.int8()):** keep the few outlier dimensions in 16-bit and quantize the rest to 8-bit.',
          '**Smoothing (SmoothQuant):** divide activations by a per-channel factor and multiply the matching weights by it. The maths is unchanged, but the outlier difficulty moves from activations (hard) to weights (easy).',
          '**Protecting salient weights (AWQ):** weights that multiply large activations matter most, so scale them up before rounding to reduce their relative error.',
          '**Finer groups:** small blocks of 32–128 weights stop one outlier from setting the scale for millions of weights.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Quantizing an LLM with one scale per tensor because "it worked for my image classifier". LLM outliers make per-tensor INT8 activations lose a lot of accuracy and per-tensor INT4 weights fall apart. Use per-channel or per-group scales and an outlier-aware method.' },
      ],
    },
    {
      id: 'popular-methods',
      title: 'Popular methods: GPTQ, AWQ, bitsandbytes, GGUF / llama.cpp',
      blocks: [
        { type: 'table', caption: 'The methods you will meet most often', head: ['Method', 'Core idea', 'Typical use'], rows: [
          ['GPTQ (2022)', 'Quantizes weights one column at a time and adjusts the not-yet-quantized weights to cancel the error, using second-order (Hessian) information from a calibration set.', '4-bit (also 3- and 8-bit) GPU checkpoints; widely published on Hugging Face'],
          ['AWQ (2023)', 'Activation-aware: finds the small fraction of weight channels that see large activations and scales them to protect them before rounding. No backpropagation.', '4-bit GPU inference in vLLM, TensorRT-LLM and others'],
          ['bitsandbytes', 'A library that quantizes on the fly when you load a model: LLM.int8() with outlier handling, and 4-bit NF4/FP4. NF4 is the format QLoRA fine-tuning uses.', 'Quick experiments and QLoRA fine-tuning in Hugging Face Transformers'],
          ['GGUF / llama.cpp', 'A file format plus block-wise "k-quant" schemes (Q4_K_M, Q5_K_M, Q8_0 …) designed for fast CPU and Apple-silicon inference, with optional GPU offload.', 'Running models locally via llama.cpp, Ollama, LM Studio'],
        ] },
        { type: 'p', text: 'They are complementary rather than rivals: GPTQ and AWQ are algorithms for choosing good low-bit weights; bitsandbytes is a convenient runtime library; GGUF is a file format and set of block layouts for one popular engine. The next two lessons dig into GGUF and llama.cpp.' },
      ],
    },
    {
      id: 'accuracy-trade-off',
      title: 'The accuracy trade-off and running LLMs locally',
      blocks: [
        { type: 'p', text: 'How much quality do we lose? Broadly, from published evaluations and community experience (exact results vary by model, method and task):' },
        { type: 'list', items: [
          '**8-bit** (INT8 or FP8) is close to lossless for most LLMs when done with outlier-aware methods.',
          '**4-bit** with a good method (GPTQ, AWQ, Q4_K_M) usually costs a small amount of quality and is the popular sweet spot for local use.',
          '**3-bit and below** degrades noticeably; quality can fall apart on reasoning, maths and code first.',
          '**Bigger models tolerate it better.** A 4-bit 70B model typically beats a 16-bit 8B model while needing less memory than a 16-bit 34B one.',
        ] },
        { type: 'callout', tone: 'example', title: 'Our laptop, solved', text: 'A 7B model in a 4-bit format with group scales is about 4 GB of weights. It fits in the 6 GB GPU with room for a few thousand tokens of KV cache. The same idea lets a 70B model run in about 40 GB, within reach of a high-memory desktop or Mac.' },
        { type: 'callout', tone: 'tip', title: 'When not to quantize (much)', text: 'Avoid aggressive quantization when you are training or doing full fine-tuning (use BF16), when the task is very sensitive (exact maths, long code generation) and you have the memory to spare, or when you serve huge batches where compute, not memory, is the bottleneck and weight-only quantization brings little speedup. Always evaluate the quantized model on your own task, not just on perplexity.' },
      ],
    },
    {
      id: "asymmetric-by-hand",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Earlier we quantized four weights by hand with a symmetric grid. Let us now do the asymmetric case, where the zero-point does real work. We use only 4 bits so the numbers stay small. Our five values are lopsided, as activations often are: −0.6, 0.0, 0.47, 1.33 and 2.4." },
        { type: "steps", title: "Asymmetric 4-bit quantization (integers 0 … 15)", items: [
          { title: "Find the range", text: "min = −0.6 and max = 2.4, so the range is 3.0." },
          { title: "Compute the scale", text: "s = (max − min) / (qmax − qmin) = 3.0 / 15 = 0.2. Each integer step is worth 0.2." },
          { title: "Compute the zero-point", text: "z = round(qmin − min / s) = round(0 − (−0.6 / 0.2)) = 3. The integer 3 now stands for the real value 0.0." },
          { title: "Quantize", text: "q = round(x / s) + z. For 0.47: round(2.35) + 3 = 5. For 1.33: round(6.65) + 3 = 10. The ends map to 0 and 15." },
          { title: "Dequantize", text: "x̂ = s · (q − z). For q = 5: 0.2 × 2 = 0.4. For q = 10: 0.2 × 7 = 1.4. Each is off by 0.07." },
          { title: "Compare with symmetric", text: "A symmetric 4-bit grid uses −7 … 7 with s = 2.4 / 7 ≈ 0.343. The step is 70% larger, because the grid also covers −2.4 to −0.6, where we have no values at all." }
        ] },
        { type: "table", caption: "The same five values on both 4-bit grids", head: ["Value", "Asymmetric q", "Asymmetric x̂", "Error", "Symmetric q", "Symmetric x̂", "Error"], rows: [
          ["−0.6", "0", "−0.6", "0", "−2", "−0.686", "0.086"],
          ["0.0", "3", "0.0", "0", "0", "0.0", "0"],
          ["0.47", "5", "0.4", "0.07", "1", "0.343", "0.127"],
          ["1.33", "10", "1.4", "0.07", "4", "1.371", "0.041"],
          ["2.4", "15", "2.4", "0", "7", "2.4", "0"]
        ] },
        { type: "p", text: "The symmetric grid only ever uses the integers −2 to 7: ten of its fifteen levels. The asymmetric grid uses all sixteen. A single value can still come out better on the coarser grid by luck, as 1.33 does here. What we can rely on is the worst case: the error is at most half a step, so 0.1 for the asymmetric grid against about 0.17 for the symmetric one." },
        { type: "p", text: "Notice also that 0.0 is stored exactly on both grids. That is the reason the zero-point is rounded to a whole integer: zeros are very common in a network, and we do not want them to pick up an error." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The lesson named per-group scales as the standard for 4-bit LLM formats, but our earlier code only compared per-tensor with per-channel. Here we sweep the group size. We quantize one small weight matrix to 4 bits with one scale per 256, 64, 32 or 8 weights. For each we report the real cost in bits per weight, the weight error, and the error of the layer's output `W @ x`." },
        { type: "code", lang: "python", title: "practice_group_size.py", code: `import numpy as np
rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, size=(64, 256))          # a small weight matrix
idx = rng.integers(0, W.size, size=40)
W.flat[idx] *= 25                                # 40 scattered outlier weights
x = rng.normal(size=256)                         # one input vector
BITS = 4
qmax = 2 ** (BITS - 1) - 1                       # 7 for 4-bit symmetric

def quantize_groups(W, group):
    # one symmetric scale per \`group\` consecutive weights in a row
    g = W.reshape(-1, group)
    scale = np.abs(g).max(axis=1, keepdims=True) / qmax
    return (np.clip(np.round(g / scale), -qmax, qmax) * scale).reshape(W.shape)

y = W @ x                                        # the exact layer output
print("group  bits/weight  weight error  output error")
for group in (256, 64, 32, 8):
    Wq = quantize_groups(W, group)
    bpw = BITS + 16 / group                      # 4-bit ints + one FP16 scale per group
    w_err = np.abs(W - Wq).mean()
    y_err = np.linalg.norm(Wq @ x - y) / np.linalg.norm(y)
    print(f"{group:5d}  {bpw:11.2f}  {w_err:12.5f}  {y_err:12.3f}")
print(f"size: FP16 {W.size * 2} bytes, group 32 {int(W.size * 4.5 / 8)} bytes")`, output: `group  bits/weight  weight error  output error
  256         4.06       0.00665         0.374
   64         4.25       0.00305         0.183
   32         4.50       0.00227         0.121
    8         6.00       0.00127         0.082
size: FP16 32768 bytes, group 32 9216 bytes`, walkthrough: [
          { lines: [1, 8], note: "A 64 × 256 weight matrix with 40 scattered outlier weights, one input vector, and the 4-bit symmetric range −7 … 7." },
          { lines: [10, 14], note: "Cut every row into groups, give each group its own scale, round, clip and dequantize." },
          { lines: [16, 23], note: "For each group size, count 4 bits per weight plus one 16-bit scale per group, and measure both the weight error and the relative error of the layer output." },
          { lines: [24, 24], note: "The size of this matrix in FP16 and at 4.5 bits per weight." }
        ] },
        { type: "p", text: "Going from groups of 256 to groups of 32 costs less than half a bit per weight and cuts the output error from 0.374 to 0.121. Going on to groups of 8 helps a little more but costs 6 bits per weight. Now change it:" },
        { type: "list", items: [
          "Set `BITS = 3`. Predict first: does 3 bits with groups of 8 (5 bits per weight in total) beat 4 bits with groups of 256 (4.06 in total) on output error?",
          "Delete the two lines that create the outlier weights. Predict how much the group size still matters when all weights are of similar size.",
          "Add `x[:4] *= 20` after `x` is created, to mimic a few large activations. Predict which of the two error columns changes and which cannot change. What does that say about judging quality by weight error alone?"
        ] },
        { type: "check", question: "In the worked example, both grids have 4 bits, yet the asymmetric step is 0.2 and the symmetric step is about 0.343. For what kind of data would the two grids be equally good?", answer: "Data spread evenly around zero, with min ≈ −max. Then the symmetric grid wastes nothing, the two scales are almost the same, and the zero-point brings no benefit. This is why symmetric grids are the usual choice for weights and asymmetric ones for lopsided activations." },
        { type: "check", question: "A file is labelled 4-bit, but its size works out to about 4.5 bits per weight. Using the practice output, explain where the extra half bit goes and why we accept it.", answer: "It pays for the scales. With one 16-bit scale per 32 weights, each weight carries 16 / 32 = 0.5 extra bits. We accept it because small groups stop one large weight from setting the scale for many others: in the practice run the output error fell from 0.374 with groups of 256 to 0.121 with groups of 32." }
      ]
    },
    {
      id: 'wrapping-up',
      title: 'Wrapping up model quantization',
      blocks: [
        { type: 'list', ordered: true, items: [
          'Quantization stores numbers with fewer bits; weights snap to a grid defined by a scale and zero-point.',
          'Memory falls in proportion to bits, and memory-bound decoding speeds up almost as much.',
          'Symmetric suits weights; asymmetric suits skewed data. Per-channel and per-group scales are essential for LLMs.',
          'PTQ is fast and dominant; QAT is best at very low bits. Weight-only saves memory; weight-and-activation also speeds up compute.',
          'LLM activation outliers break naive schemes; LLM.int8(), SmoothQuant, AWQ and small groups handle them.',
          'GPTQ, AWQ, bitsandbytes and GGUF are the everyday tools; 4-bit is the usual local sweet spot.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'Using symmetric INT8 (range −127 … 127), what integer does the weight 0.64 become if the largest absolute weight in its group is 1.27?', options: ['64', '32', '127', '50'], answer: 0, explain: 'The scale is 1.27 / 127 = 0.01, and 0.64 / 0.01 = 64. Getting 32 means using the full span 2.54 (−1.27 to 1.27) over only 127 steps, which halves the resolution; 127 is reserved for the largest weight, 1.27 itself.' },
    { q: "Why are per-group or per-channel scales so important for LLM weights?", options: ["They make the quantized file format compatible with GPU kernels and drivers", "Otherwise one large value sets a huge shared scale and rounds normal weights to zero", "They remove the need to store any zero-point alongside the scale", "They let the model train faster, since gradients get smaller scales"], answer: 1, explain: "With one scale per tensor, a single loud channel sets the step size for everyone. In our code, INT4 per-tensor error was almost as big as the weights themselves; per-channel scales cut it about 6×." },
    { q: "We serve thousands of requests at large batch sizes on GPUs and want faster throughput, not just smaller memory. Which recipe fits best?", options: ["Weight-only 4-bit quantization, keeping all activations in 16-bit", "Keep all weights and activations in FP32 so that no accuracy is lost at scale", "Weight-and-activation quantization such as W8A8 or FP8, with outlier handling", "Quantize only the embedding table, since it is the largest single tensor"], answer: 2, explain: "At large batch sizes the work becomes compute-bound. Quantizing activations too lets the matrix multiplies run on fast INT8/FP8 units. Weight-only quantization mainly helps memory-bound, small-batch decoding." },
    { q: "What is the key difference between PTQ and QAT?", options: ["PTQ quantizes only the activations, while QAT quantizes only the weights", "PTQ needs a full training run, while QAT works without any training", "PTQ stores floating-point values in the file, while QAT stores integer values instead", "PTQ quantizes a trained model; QAT simulates rounding in training so weights adapt"], answer: 3, explain: "Post-training quantization converts a finished model, maybe with a small calibration set. Quantization-aware training adds fake quantization while training so the model learns to tolerate rounding, which helps at very low bit widths." },
    { q: "A teammate says: \"LLM outliers are just noise, so we should clip them away before quantizing.\" Why is this wrong?", options: ["Outliers are systematic features the model relies on, so clipping them hurts accuracy", "Outliers exist only in FP32 models and vanish once the weights are cast to FP16", "Clipping is impossible in integer formats, so it cannot be done anyway", "Outliers are already removed by the tokenizer before they ever reach the model"], answer: 0, explain: "LLM.int8() showed that large-magnitude features appear consistently in bigger models and matter for performance. Fixes like mixed precision, SmoothQuant and AWQ preserve their effect instead of discarding them." },
  ],
  takeaways: [
    'Quantization maps real numbers to a few integer levels with a scale (and zero-point): q = round(x/s) + z.',
    'Memory scales with bits: a 7B model is 14 GB in FP16 and about 3.5–4 GB in 4-bit.',
    'Granularity matters: use per-channel or per-group scales, never one scale for a whole LLM tensor.',
    'LLM activation outliers are real and important; LLM.int8(), SmoothQuant and AWQ are designed around them.',
    '8-bit is near lossless; 4-bit with GPTQ/AWQ/GGUF k-quants is the common sweet spot; below that, test carefully.',
  ],
  terms: [
    { term: 'Quantization', def: 'Representing numbers with fewer bits by rounding them to a coarse grid of allowed values.' },
    { term: 'Scale', def: 'The real-valued size of one integer step; multiply an integer by it to get back an approximate real value.' },
    { term: 'Zero-point', def: 'The integer that represents real 0.0 in asymmetric quantization.' },
    { term: 'Per-channel / per-group', def: 'Using a separate scale for each row or each small block of weights instead of one per tensor.' },
    { term: 'PTQ', def: 'Post-Training Quantization: converting an already-trained model to low precision, often with a small calibration set.' },
    { term: 'QAT', def: 'Quantization-Aware Training: simulating rounding during training so the model learns to tolerate it.' },
    { term: 'Outlier features', def: 'A few activation dimensions in large LLMs with values far bigger than the rest, which break naive quantization.' },
  ],
};
