export default {
  id: 'lora-low-rank-adaptation-of-llms',
  minutes: 25,
  hook: 'What if we could fine-tune a 7-billion-parameter model by training only about 4 million numbers, and get nearly the same result?',
  summary: 'LoRA (Low-Rank Adaptation) freezes a pretrained model’s weights and learns the change to each chosen weight matrix as the product of two thin matrices, B·A. Because the update is low-rank, it needs a tiny fraction of the trainable parameters and optimizer memory. After training, B·A can be merged back into W, so inference costs nothing extra.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'In the previous lesson we fine-tuned a model by nudging all of its weights. **LoRA**, short for **Low-Rank Adaptation**, introduced by Hu and colleagues at Microsoft in 2021, takes a different route: keep every original weight **frozen** (not trainable) and learn a small **correction** that is added on top.' },
        { type: 'p', text: 'The trick is the *shape* of that correction. Instead of a full matrix the size of the original, LoRA writes it as two skinny matrices multiplied together. That shape is called **low-rank**, and it is why LoRA is so cheap.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like transparent sticky notes', text: 'Imagine a printed textbook (the frozen model). Instead of reprinting the book for every class, each teacher adds a thin set of transparent overlays with corrections. The book never changes, overlays are cheap to make and swap, and if we like one overlay a lot we can print it into a new edition (merging).' },
        { type: 'p', text: 'Running example: we run the bike-rental support bot from the last lesson, and also want a second version for our corporate-fleet customers. With LoRA we keep one copy of the base model and two small adapters, one per audience.' },
      ],
    },
    {
      id: 'why-expensive',
      title: 'Why full fine-tuning is expensive',
      blocks: [
        { type: 'p', text: 'Training needs memory for more than the weights. For every trainable parameter we also store its **gradient** and the **optimizer state**. The Adam optimizer keeps two running averages per parameter (momentum and variance), usually in 32-bit floats. A common mixed-precision estimate is about **16 bytes per trainable parameter**. For 7 billion parameters that is around 112 GB, plus activations, which means several high-end GPUs.' },
        { type: 'p', text: 'There is a storage cost too. Full fine-tuning produces a full new copy of the model for each task: 7B parameters at 2 bytes each is about 14 GB. Ten customer-specific bots would mean 140 GB of nearly identical checkpoints.' },
        { type: 'chart', kind: 'bar', title: 'Memory per trainable parameter during training (rule of thumb)', yLabel: 'Bytes', unit: ' B', labels: ['Weight (bf16)', 'Gradient (bf16)', 'Adam states + fp32 copy'], series: [ { name: 'Bytes', values: [2, 2, 12] } ], caption: 'A common mixed-precision estimate (exact numbers vary by framework and settings). LoRA avoids gradients and optimizer states for the frozen weights; they only need the 2-byte weight.' },
      ],
    },
    {
      id: 'core-idea',
      title: 'The core idea behind LoRA',
      blocks: [
        { type: 'p', text: 'Fine-tuning changes a weight matrix `W` into `W + ΔW`. LoRA bets that the useful change `ΔW` is **low-rank**: it can be described by just a few independent directions. The **rank** of a matrix is the number of independent rows (or columns) it really has. A 4096 × 4096 matrix can have rank up to 4096, but a matrix built as `B·A`, where `B` is 4096 × r and `A` is r × 4096, has rank at most `r`.' },
        { type: 'formula', expr: 'h = W·x + (α / r) · B·A·x', where: [
          ['W', 'frozen pretrained weight, size d_out × d_in'],
          ['A', 'trainable “down” matrix, size r × d_in (squeezes x to r numbers)'],
          ['B', 'trainable “up” matrix, size d_out × r (expands back)'],
          ['r', 'the rank, a small number like 4, 8, 16 or 64'],
          ['α', 'a scaling constant (alpha); α / r sets how strongly the adapter speaks'],
        ], caption: 'The LoRA forward pass. Only A and B receive gradients.' },
        { type: 'p', text: 'Why believe the change is low-rank? Earlier research found that fine-tuning large pretrained models can work well even when the update is restricted to a small subspace (the idea of a low **intrinsic dimension**). LoRA’s experiments showed small ranks often matched full fine-tuning on the tasks they tested. It is an empirical finding, not a law: for big shifts (new languages, lots of new knowledge) higher ranks or full fine-tuning can do better.' },
        { type: 'viz', name: 'lora', caption: 'Change d and r. Watch how the trainable share collapses: parameters grow as 2·d·r instead of d².' },
        { type: 'check', question: 'A layer is 4096 × 4096 and we use rank r = 16. How many trainable LoRA parameters does it have, and what share of the full matrix is that?', answer: '2 × 4096 × 16 = 131,072 parameters, versus 4096² = 16,777,216. That is about 0.78% of the full matrix.' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How LoRA works step by step',
      blocks: [
        { type: 'steps', title: 'Training with LoRA', items: [
          { title: 'Freeze the base model', text: 'Load the pretrained weights and mark all of them as not trainable. No gradients or optimizer state are kept for them.' },
          { title: 'Choose target layers and rank', text: 'Pick which weight matrices get adapters (for example the attention projections W_q and W_v, or all linear layers) and choose r and α.' },
          { title: 'Initialise A and B', text: 'A gets small random values; B starts at exactly zero. So B·A = 0 and the model at step 0 behaves exactly like the base model.' },
          { title: 'Forward pass', text: 'Each adapted layer computes W·x plus the scaled side path (α/r)·B·(A·x).' },
          { title: 'Backward pass', text: 'Gradients flow through the frozen W (to reach earlier layers) but only A and B are updated by the optimizer.' },
          { title: 'Save or merge', text: 'Save just A and B as a small adapter file, or merge W′ = W + (α/r)·B·A for deployment.' },
        ] },
        { type: 'flow', title: 'Data flow inside one LoRA layer', nodes: [
          { label: 'Input x', detail: 'A vector of size d_in, e.g. 4096 numbers for one token.' },
          { label: 'Frozen path W·x', detail: 'The original pretrained computation, unchanged.' },
          { label: 'Down: A·x', detail: 'Squeezes x to just r numbers, e.g. 8. This is the “bottleneck”.' },
          { label: 'Up: B·(A·x)', detail: 'Expands the r numbers back to d_out and scales by α/r.' },
          { label: 'Sum', detail: 'Output h = W·x + (α/r)·B·A·x goes on to the next layer.' },
        ] },
        { type: 'callout', tone: 'note', title: 'Why B starts at zero', text: 'If both A and B were random, the model would be damaged at step 0 by random noise added to every adapted layer. With B = 0, training begins from exactly the pretrained model and the adapter grows only as the data asks for it.' },
      ],
    },
    {
      id: 'numeric-example',
      title: 'A small numeric example',
      blocks: [
        { type: 'p', text: 'Take a tiny 4 × 4 layer and rank r = 1. Then `B` is a 4 × 1 column and `A` is a 1 × 4 row: 8 trainable numbers instead of 16. Say training produced `B = [1, 0, 2, 0]ᵀ` and `A = [0.5, 1, 0, −1]`. Their product `ΔW = B·A` is a full 4 × 4 matrix where each row is a multiple of `A`:' },
        { type: 'matrix', title: 'ΔW = B·A (rank 1, built from 8 numbers)', rows: ['row 1 (B=1)', 'row 2 (B=0)', 'row 3 (B=2)', 'row 4 (B=0)'], cols: ['col 1', 'col 2', 'col 3', 'col 4'], values: [[0.5, 1, 0, -1], [0, 0, 0, 0], [1, 2, 0, -2], [0, 0, 0, 0]], format: 'num', caption: 'Row 3 is exactly twice row 1, and rows 2 and 4 are zero: only one independent direction, so rank 1.' },
        { type: 'p', text: 'For an input `x = [1, 1, 1, 1]`, `A·x = 0.5 + 1 + 0 − 1 = 0.5`, then `B·0.5 = [0.5, 0, 1, 0]`. That vector is added to `W·x`. At this size the saving is small (8 vs 16), but it grows with `d`: at d = 4096 and r = 8 it is 65,536 vs 16.8 million.' },
        { type: 'p', text: 'Now a runnable version. We hide a rank-2 change inside a 64 × 64 layer and let a rank-4 LoRA find it, using only gradients on `A` and `B`.' },
        { type: 'code', lang: 'python', title: 'lora_numpy.py', code: `import numpy as np
rng = np.random.default_rng(42)

d, r, alpha = 64, 4, 8                    # layer size, LoRA rank, scaling
W = rng.normal(size=(d, d)) / np.sqrt(d)  # frozen pretrained weight
A = rng.normal(size=(r, d)) * 0.01        # trainable, small random
B = np.zeros((d, r))                      # trainable, starts at ZERO
scale = alpha / r

# The task needs a change to W that happens to be low-rank (rank 2)
delta_true = rng.normal(size=(d, 2)) @ rng.normal(size=(2, d)) / d
X = rng.normal(size=(256, d))
Y = X @ (W + delta_true).T                # targets the adapted layer should hit

def forward(X):
    return X @ W.T + scale * (X @ A.T) @ B.T   # W x + (alpha/r) B A x

print("step 0 output equals base model:", np.allclose(forward(X), X @ W.T))
lr = 0.05
for step in range(1, 1501):
    err = forward(X) - Y                         # (256, d)
    gB = scale * err.T @ (X @ A.T) / len(X)      # only A and B get gradients
    gA = scale * B.T @ err.T @ X / len(X)
    B -= lr * gB
    A -= lr * gA
    if step in (1, 500, 1500):
        print(f"step {step:4d}  mse {np.mean(err**2):.5f}")

print("trainable params:", A.size + B.size, "vs full:", W.size,
      f"({(A.size + B.size) / W.size:.1%})")
W_merged = W + scale * B @ A                     # merge for deployment
print("merged layer gives same output:", np.allclose(X @ W_merged.T, forward(X)))`, output: `step 0 output equals base model: True
step    1  mse 0.03120
step  500  mse 0.00000
step 1500  mse 0.00000
trainable params: 512 vs full: 4096 (12.5%)
merged layer gives same output: True`, walkthrough: [
          { lines: [4, 8], note: 'Frozen W, a small random A, and B = 0. The scale α/r = 2 multiplies the adapter output.' },
          { lines: [10, 13], note: 'We create a task whose ideal weight change has rank 2, so a rank-4 adapter has enough room to represent it.' },
          { lines: [15, 18], note: 'The LoRA forward pass. Because B = 0, the first print confirms the model starts identical to the base.' },
          { lines: [19, 27], note: 'Gradient descent on A and B only. W never appears on the left side of an update.' },
          { lines: [29, 30], note: 'At d = 64 the saving looks modest (12.5%); at d = 4096 with r = 8 it would be about 0.4%.' },
          { lines: [31, 32], note: 'Merging folds the adapter into one ordinary matrix with identical outputs, so inference has no extra cost.' },
        ] },
      ],
    },
    {
      id: 'where-applied',
      title: 'Where LoRA is applied in a Transformer',
      blocks: [
        { type: 'p', text: 'A Transformer block has several linear layers: the attention projections **W_q, W_k, W_v, W_o** (query, key, value and output) and the feed-forward (MLP) layers, often called up, gate and down projections. LoRA can wrap any of them.' },
        { type: 'list', items: [
          'The original LoRA paper mostly adapted **W_q and W_v** in attention and found that spreading a small rank across several matrices worked better than a large rank on one.',
          'Many current recipes adapt **all linear layers** (attention and MLP), which often improves quality at a small extra cost.',
          'Embeddings and the output head are usually left frozen unless the vocabulary changes.',
        ] },
        { type: 'p', text: 'Worked count for a 7B Llama-style model with 32 layers and hidden size 4096: adapting only W_q and W_v (each 4096 × 4096) at rank 8 gives `2 matrices × 32 layers × 2 × 4096 × 8 = 4,194,304` trainable parameters, about 0.06% of 7 billion.' },
        { type: 'deeper', title: 'Choosing r and α', blocks: [
          { type: 'p', text: 'Common starting points are r = 8 or 16 with α equal to r or 2r. The scale α/r means that if we change r but keep α fixed, the adapter’s initial influence stays in a similar range, so we do not need to re-tune the learning rate as much. Larger r gives more capacity but more parameters; returns usually diminish quickly for narrow tasks. These are conventions, not rules, and the best values depend on the task and data size.' },
          { type: 'p', text: 'Popular variants include **QLoRA** (Dettmers et al., 2023), which keeps the frozen base in 4-bit precision while training LoRA adapters in higher precision, making it possible to fine-tune very large models on a single GPU, and **DoRA**, which splits each weight into a magnitude and a direction and adapts the direction with LoRA.' },
        ] },
      ],
    },
    {
      id: 'merging',
      title: 'Merging LoRA back into the model',
      blocks: [
        { type: 'p', text: 'Because the adapter is just an additive matrix, after training we can compute `W′ = W + (α/r)·B·A` once and replace W with W′. The merged model has exactly the original architecture and speed. The LoRA paper highlights this: no extra inference latency, unlike adapter methods that insert new layers.' },
        { type: 'compare', title: 'Two ways to serve a LoRA model', options: [
          { name: 'Merged', summary: 'Fold B·A into W once and serve a normal model.', pros: ['Zero extra latency', 'Works with any inference engine'], cons: ['One full model copy per task', 'Cannot switch tasks per request'], bestFor: 'One main task at high traffic' },
          { name: 'Unmerged (hot-swappable)', summary: 'Keep one base model in memory and attach adapters per request.', pros: ['Many tasks or customers share one base', 'Adapters are MBs and load fast'], cons: ['Small compute overhead for the side path', 'Needs an engine with multi-adapter support'], bestFor: 'Multi-tenant products with many small adapters' },
          { name: 'Full fine-tune', summary: 'No adapter at all; every weight retrained.', pros: ['Highest capacity'], cons: ['GBs per task', 'Expensive training'], bestFor: 'Large, very different domains' },
        ], rows: [
          ['Inference cost', 'Same as base', 'Slightly more', 'Same as base'],
          ['Storage per task', 'Full model', 'Adapter only', 'Full model'],
          ['Switch tasks per request', 'No', 'Yes', 'No'],
        ], verdict: 'Merge when one adapter dominates; keep adapters separate when many tasks share one base model.' },
        { type: 'check', question: 'We merged our adapter into W and later want to undo it. Is that possible?', answer: 'Yes, if we kept the adapter: W = W′ − (α/r)·B·A. In practice people simply keep the original base checkpoint and the adapter file. Note that merging into a quantized base can introduce small rounding differences.' },
      ],
    },
    {
      id: 'real-world',
      title: 'Real-world use cases and limits',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Where LoRA shows up', text: 'Fine-tuning open models (Llama, Mistral, Qwen and others) on a single GPU with libraries like Hugging Face PEFT; per-customer or per-task adapters served from one base model; community style adapters for image diffusion models; and QLoRA for fine-tuning large models on modest hardware. Several hosted fine-tuning services also use LoRA-style adapters under the hood, though vendors do not always say which method they use.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Using a learning rate tuned for full fine-tuning (LoRA usually needs a larger one); setting r very high “to be safe” and overfitting a small dataset; adapting only one matrix type when the task needs more; and forgetting that LoRA still learns from the data, so bad examples still teach bad habits. LoRA also does not fully prevent forgetting; it only reduces the risk.' },
        { type: 'p', text: '**When not to use LoRA:** when we need to teach a lot of genuinely new knowledge or a new language and have large data and budget, full fine-tuning or continued pretraining may reach higher quality. And if a prompt or RAG already solves the problem, no fine-tuning is needed at all.' },
      ],
    },
    {
      id: 'spotting-mistakes',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'LoRA has few moving parts, so most failures trace back to one of three things: the **scale** `α / r`, the **rank**, or the **merge**. Let us make the scale concrete first, because it is the one people trip over most.' },
        { type: 'steps', title: 'What happens to the scale when we change the rank', items: [
          { title: 'Start', text: 'We train with `r = 8` and `α = 16`. The adapter output is multiplied by `α / r = 16 / 8 = 2`.' },
          { title: 'Double the rank, keep α', text: 'Now `r = 16`, `α = 16`. The scale drops to `16 / 16 = 1`. The adapter has more capacity but each direction counts half as much. A learning rate that worked before may now feel too weak.' },
          { title: 'Double both', text: '`r = 16`, `α = 32` gives scale 2 again. This is why many recipes tie α to r (for example α = 2r): we can then change the rank without retuning everything else.' },
          { title: 'Check before merging', text: 'The same scale must be used when merging: `W′ = W + (α / r) · B·A`. Merging with plain `B·A` gives a model that behaves differently from the one we evaluated.' },
        ] },
        { type: 'table', caption: 'Diagnosing a LoRA run', head: ['What we see', 'Likely cause', 'How to check'], rows: [
          ['Outputs identical to the base model after training', 'B is still all zeros: the adapter was not attached to any layer, or no gradient reached it', 'Print the largest absolute value in B; list which layers have adapters'],
          ['Loss is noisy or explodes early', 'Learning rate or α / r too large', 'Halve the scale or the learning rate and compare the first 100 steps'],
          ['Training loss falls, validation loss rises quickly', 'Rank too high for a small dataset', 'Try half the rank, or fewer target layers'],
          ['Both losses stay high', 'Rank too low, or too few layers adapted', 'Raise the rank or add the MLP layers as targets'],
          ['Merged model scores differently from the unmerged one', 'Scale left out, adapter merged twice, or merged into a different base model', 'Compare both versions on one input, as the code below does'],
        ] },
        { type: 'p', text: 'A useful mental test for the rank: ask how many *independent things* the task changes. A tone change is probably a few directions. Teaching a new domain with new vocabulary is many. The practice code below shows what happens when the rank is smaller than the true number of directions.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will build a weight change that secretly has **3 strong directions**, then ask: how well can a rank-1, rank-2, rank-3… pair of thin matrices rebuild it? We use the SVD (singular value decomposition), which gives the best possible rank-r approximation, so no training loop is needed. Then we verify that merging changes nothing.' },
        { type: 'code', lang: 'python', title: 'practice_lora_rank.py', code: `import numpy as np
rng = np.random.default_rng(1)
d = 32

# A "true" fine-tuning change: 3 strong directions plus faint noise.
U, V = rng.normal(size=(d, 3)), rng.normal(size=(3, d))
delta_W = U @ V + 0.05 * rng.normal(size=(d, d))

# SVD gives the best possible rank-r approximation of delta_W.
P, s, Qt = np.linalg.svd(delta_W)
print("rank  params  share of d*d  relative error")
for r in [1, 2, 3, 4, 8]:
    B = P[:, :r] * s[:r]                  # d x r, plays the role of B
    A = Qt[:r, :]                         # r x d, plays the role of A
    err = np.linalg.norm(delta_W - B @ A) / np.linalg.norm(delta_W)
    print(f"{r:>4}  {2 * d * r:>6}  {2 * d * r / d**2:>11.1%}  {err:>14.3f}")

# Merging: the adapter path and the merged matrix give the same output.
W = rng.normal(size=(d, d))               # frozen pretrained weight
x = rng.normal(size=d)                    # one input vector
r, alpha = 4, 8
B, A = P[:, :r] * s[:r], Qt[:r, :]
scale = alpha / r
two_paths = W @ x + scale * (B @ (A @ x))   # unmerged: frozen path + adapter
merged = (W + scale * B @ A) @ x            # merged: a single matrix
print("scale alpha/r =", scale)
print("merged and unmerged outputs match:", np.allclose(two_paths, merged))`, output: `rank  params  share of d*d  relative error
   1      64         6.2%           0.729
   2     128        12.5%           0.490
   3     192        18.8%           0.032
   4     256        25.0%           0.030
   8     512        50.0%           0.022
scale alpha/r = 2.0
merged and unmerged outputs match: True`,
          walkthrough: [
            { lines: [5, 7], note: 'Build a 32 × 32 change from 3 directions, plus a little noise so it is not exactly rank 3.' },
            { lines: [9, 16], note: 'For each rank, keep the top r directions as thin matrices B and A, count their parameters, and measure how much of the change is missed.' },
            { lines: [18, 27], note: 'Compute the layer output two ways: frozen path plus scaled adapter path, and one merged matrix. They match.' },
          ] },
        { type: 'p', text: 'The error falls sharply until rank 3 and then barely moves. Extra rank beyond what the change needs only buys parameters.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'On line 6, change both `3`s to `6` so the true change has 6 directions. Predict: at which rank will the error now drop below 0.05?',
          'Raise the noise on line 7 from `0.05` to `0.5`. Predict: will rank 3 still look like a clear “elbow”, or will the error keep falling slowly at higher ranks?',
          'On line 25, delete `scale *` so we merge without the scale. Predict what the last line prints, then run it.',
        ] },
        { type: 'check', question: 'Going from rank 3 to rank 8 in the output raises the parameter share from 18.8% to 50.0% but the error only moves from 0.032 to 0.022. What does that tell us about choosing r?', answer: 'Once the rank covers the real directions of the change, more rank mostly fits noise. Here the true change has 3 directions, so r = 3 already captures almost everything. In practice we cannot see the true rank, so we start small (8 or 16), and only raise r if both training and validation loss stay high.' },
        { type: 'check', question: 'With d = 32, rank 8 already uses 50% of the full matrix. In the lesson, rank 16 on a 4096 × 4096 matrix was under 1%. Why is LoRA’s saving so much bigger on large layers?', answer: 'LoRA parameters grow as `2·d·r`, the full matrix grows as `d²`, so the share is `2r / d`. For d = 32 and r = 8 that is 16 / 32 = 50%. For d = 4096 and r = 16 it is 32 / 4096 ≈ 0.78%. The bigger the layer, the smaller the share for the same rank.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'p', text: 'LoRA freezes W and learns ΔW = B·A with a small rank r. B starts at zero, so training begins from the exact base model. Trainable parameters drop from d² to 2·d·r per matrix, which cuts optimizer memory and makes adapters tiny files. After training, the adapter can be merged into W for zero-overhead inference, or kept separate so one base model can serve many tasks.' },
      ],
    },
  ],
  quiz: [
    { q: 'In LoRA, which weights receive gradient updates during training?', options: ['All pretrained weights, but at a much lower learning rate', 'Only the small matrices A and B added beside frozen layers', 'Only the token embedding layer, which is cheap to update', 'Only the final output layer, with the rest of the model frozen'], answer: 1, explain: 'LoRA freezes the pretrained weights and trains only A and B. Gradients still pass through W to reach earlier layers, but W itself is never updated.' },
    { q: 'Why is B initialised to zero?', options: ['To save memory, since zeros take no space during the first step', 'Because a zero matrix is required for the update to have rank r', 'So B·A = 0 and training starts from the exact pretrained model', 'So that A receives no gradient and never needs to be trained'], answer: 2, explain: 'With B = 0 the adapter adds nothing at step 0, so training starts from the unchanged base. A random B would inject noise into every adapted layer. Rank and memory are unrelated to this choice.' },
    { q: 'A weight matrix is 4096 × 4096 and we use LoRA with r = 8. How many trainable parameters does LoRA add for it?', options: ['32,768', '65,536', '16,777,216', '131,072'], answer: 1, explain: 'A is 8 × 4096 and B is 4096 × 8, so 2 × 4096 × 8 = 65,536. 32,768 counts only one of the two matrices; 131,072 is r = 16; 16.8M is the full matrix.' },
    { q: 'Our product serves 50 business customers, each with its own fine-tuned style, from one GPU cluster. Which serving setup fits best?', options: ['Merge each customer’s adapter into its own full copy of the model, then serve all 50', 'Full fine-tune one shared model on all 50 customers’ styles mixed together', 'Keep one base model loaded and swap in each customer’s unmerged adapter per request', 'Retrain a separate model from scratch for each customer on their own data'], answer: 2, explain: 'Unmerged adapters let many tasks share one base model; adapters are small and can be swapped per request. Fifty merged copies would multiply memory; mixing styles loses per-customer behaviour.' },
    { q: 'A teammate claims: "LoRA adds extra layers, so the deployed model is always slower than the base model." What is the best correction?', options: ['After training, B·A can be merged into W, keeping the original shape and speed', 'True; the extra adapter layers roughly double inference time in every setup', 'LoRA is faster than the base model because it has fewer parameters in total', 'LoRA removes some base layers to make room, so speed stays about the same'], answer: 0, explain: 'Merging folds the adapter into the existing weight matrix, so the merged model has the same shape and speed. Unmerged serving adds a small overhead, but not a doubling, and LoRA never removes base layers.' },
  ],
  takeaways: [
    'LoRA freezes W and learns the update as B·A with a small rank r.',
    'Trainable parameters per matrix drop from d² to 2·d·r, saving optimizer memory and storage.',
    'B starts at zero, so training begins from the exact pretrained model.',
    'Merging W + (α/r)·B·A gives zero inference overhead; unmerged adapters allow per-request swapping.',
    'LoRA usually nears full fine-tuning on narrow tasks but may fall short on very large shifts.',
  ],
  terms: [
    { term: 'LoRA', def: 'Low-Rank Adaptation: training a low-rank update B·A next to frozen pretrained weights.' },
    { term: 'Rank (r)', def: 'The number of independent directions in a matrix; in LoRA, the inner size of B and A.' },
    { term: 'Frozen weights', def: 'Parameters that are not updated during training.' },
    { term: 'Adapter', def: 'A small set of trainable weights added to a frozen model for one task.' },
    { term: 'Alpha (α)', def: 'A LoRA scaling constant; the adapter output is multiplied by α/r.' },
    { term: 'Merging', def: 'Adding the trained B·A into W so the model has its original shape and speed.' },
    { term: 'QLoRA', def: 'LoRA training on top of a 4-bit quantized frozen base model.' },
  ],
};
