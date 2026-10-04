export default {
  id: 'scaling-dot-product-attention',
  minutes: 25,
  hook: 'Why does the attention formula divide by √dₖ, and not by dₖ, or 2, or nothing at all? A short piece of probability gives the exact answer.',
  summary: 'A dot product of two dₖ-long vectors with random, unit-variance entries has variance dₖ, so its typical size grows like √dₖ. Large scores push softmax into a near one-hot output where gradients almost vanish and learning stalls. Dividing by √dₖ brings the variance back to 1 for any vector width, which keeps softmax soft and trainable.',
  sections: [
    {
      id: 'formula-recap',
      title: 'The attention formula (quick recap)',
      blocks: [
        { type: 'p', text: 'In the previous lesson we computed attention by hand. Each token gets a **query** vector q (what it is looking for) and a **key** vector k (what it offers), both of length **dₖ**. The score between two tokens is the **dot product** q·k = q₁k₁ + q₂k₂ + … + q_dₖ k_dₖ. Scores go through **softmax** to become weights that sum to 1, and the weights mix the **value** vectors.' },
        { type: 'formula', expr: 'Attention(Q, K, V) = softmax(Q·Kᵀ / √dₖ) · V', where: [
          ['Q·Kᵀ', 'all query-key dot products: a tokens × tokens score table'],
          ['√dₖ', 'square root of the query/key length; the subject of this lesson'],
          ['softmax', 'row-wise: eᶻⁱ / ∑ⱼ eᶻʲ'],
        ] },
        { type: 'p', text: 'The authors of the original Transformer paper ("Attention Is All You Need", 2017) called this **scaled** dot-product attention, and gave a short reason for the √dₖ. In this lesson we unpack that reason fully: what goes wrong without it, why dot products grow, a proof that the variance equals dₖ, and real numbers that show the effect.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a volume knob', text: 'Imagine a vote where each judge adds their score to a total. With 4 judges the totals stay small; with 1,000 judges the totals swing wildly, and the loudest candidate wins by a landslide every time. Dividing by √(number of judges) turns the volume back down so the totals have the same spread whatever the panel size. That is all √dₖ does.' },
      ],
    },
    {
      id: 'without-scaling',
      title: 'What happens without scaling?',
      blocks: [
        { type: 'p', text: 'Softmax is sensitive to the **size** of its inputs, not just their order. Take three scores `[1, 2, 3]`. Softmax gives about `[0.09, 0.24, 0.67]`: the top token is favoured, but the others still get a voice. Now multiply the same scores by 8, giving `[8, 16, 24]`. The order is identical, yet softmax gives about `[0.0000, 0.0003, 0.9997]`. One token takes everything.' },
        { type: 'chart', kind: 'line', title: 'Same scores [1, 2, 3] multiplied by a growing factor', xLabel: 'Multiplier on the scores', yLabel: 'Value', series: [
          { name: 'Weight on top token', points: [[0.5, 0.5065], [1, 0.6652], [2, 0.8668], [4, 0.9817], [8, 0.9997], [16, 1.0]] },
          { name: 'Gradient p(1−p) of top token', points: [[0.5, 0.25], [1, 0.2227], [2, 0.1154], [4, 0.018], [8, 0.0003], [16, 0.0]] },
        ], caption: 'Computed exactly with numpy. As scores grow, softmax saturates toward one-hot and the gradient p(1−p) collapses toward zero.' },
        { type: 'p', text: 'This "winner takes all" behaviour causes two problems:' },
        { type: 'list', items: [
          '**Lost information.** A token that should blend context from several words instead copies a single word. Attention degenerates into a hard lookup.',
          '**Vanishing gradients.** When softmax outputs are near 0 or 1, its slope is near zero. Training updates the weights using gradients (how much the loss changes if a number changes), so near-zero gradients mean the query and key projections barely learn. Training becomes slow or unstable.',
        ] },
        { type: 'check', question: 'Pause and predict: if we scaled the scores [1, 2, 3] DOWN by 100 (giving [0.01, 0.02, 0.03]), what would softmax output?', answer: 'Almost exactly uniform: about [0.33, 0.33, 0.34]. Too small is also bad, because attention can no longer prefer anything. We want scores of a moderate, predictable size, not as small as possible.' },
      ],
    },
    {
      id: 'why-dot-products-grow',
      title: 'Why do dot products grow with dₖ?',
      blocks: [
        { type: 'p', text: 'A dot product is a **sum of dₖ terms**. If each term is a small random number, sometimes positive and sometimes negative, they partly cancel, but not completely. The more terms you add, the further the total tends to wander from zero. This is the same reason a random walk of 100 steps ends further from the start (on average) than a walk of 4 steps.' },
        { type: 'p', text: 'At the start of training, and roughly afterwards too because of normalization layers, the entries of q and k behave like independent numbers with **mean 0** and **variance 1**. Variance is the average squared distance from the mean; its square root, the **standard deviation**, is the typical size of a value. Under that assumption, the typical size of q·k is √dₖ.' },
        { type: 'chart', kind: 'bar', title: 'Typical size (standard deviation) of a raw dot product', yLabel: 'Std of q·k', labels: ['dₖ = 4', 'dₖ = 16', 'dₖ = 64', 'dₖ = 256', 'dₖ = 1024'], series: [
          { name: 'Raw q·k', values: [2, 4, 8, 16, 32] },
          { name: 'q·k / √dₖ', values: [1, 1, 1, 1, 1] },
        ], caption: 'Theoretical values √dₖ (raw) and 1 (scaled), assuming independent entries with mean 0 and variance 1. The code below confirms them by simulation.' },
        { type: 'p', text: 'Real models commonly use per-head dₖ of 64 or 128. With dₖ = 64, raw scores have a typical size of 8, which is exactly the "multiply by 8" case from the chart above where softmax already puts 99.97% on one token.' },
      ],
    },
    {
      id: 'variance-of-dot-product',
      title: 'Understanding variance of the dot product',
      blocks: [
        { type: 'p', text: 'We need two facts about variance, written Var(·):' },
        { type: 'list', ordered: true, items: [
          '**Variance of a sum of independent things is the sum of their variances.** If A and B are independent, Var(A + B) = Var(A) + Var(B).',
          '**Scaling multiplies variance by the square.** Var(c·X) = c²·Var(X). So dividing by c divides the variance by c².',
        ] },
        { type: 'p', text: 'Fact 2 is the key to the whole lesson. If the variance of q·k is dₖ, then to bring it back to 1 we must divide by a number c with c² = dₖ. That number is c = √dₖ. Dividing by dₖ itself would over-correct: the variance would become dₖ / dₖ² = 1/dₖ, shrinking scores toward zero and making attention nearly uniform for wide vectors.' },
        { type: 'callout', tone: 'note', title: 'Mean, variance, standard deviation', text: 'Mean E[X] is the average value. Variance Var(X) = E[(X − mean)²] is the average squared spread. Standard deviation is √Var(X), in the same units as X. When the mean is 0, Var(X) = E[X²].' },
      ],
    },
    {
      id: 'proof-variance-is-dk',
      title: 'Proving it step by step: the variance is dₖ',
      blocks: [
        { type: 'steps', title: 'From one term to the whole dot product', items: [
          { title: 'Assume', text: 'Each qᵢ and kᵢ is independent with mean 0 and variance 1. So E[qᵢ] = E[kᵢ] = 0 and E[qᵢ²] = E[kᵢ²] = 1.' },
          { title: 'Mean of one term', text: 'E[qᵢ·kᵢ] = E[qᵢ]·E[kᵢ] = 0·0 = 0, because the expectation of a product of independent variables is the product of expectations.' },
          { title: 'Variance of one term', text: 'Since the mean is 0, Var(qᵢkᵢ) = E[(qᵢkᵢ)²] = E[qᵢ²]·E[kᵢ²] = 1·1 = 1.' },
          { title: 'Add dₖ terms', text: 'The dₖ terms are independent of each other, so Var(q·k) = Var(q₁k₁) + … + Var(q_dₖ k_dₖ) = 1 + 1 + … + 1 = dₖ.' },
          { title: 'Scale', text: 'Var(q·k / √dₖ) = Var(q·k) / dₖ = dₖ / dₖ = 1. The typical size is now 1, whatever dₖ is.' },
        ] },
        { type: 'formula', expr: 'Var(q·k) = ∑ᵢ Var(qᵢkᵢ) = dₖ    ⇒    Var(q·k / √dₖ) = 1', caption: 'Under the mean-0, variance-1, independence assumption.' },
        { type: 'deeper', title: 'How realistic is the assumption?', blocks: [
          { type: 'p', text: 'Trained queries and keys are not perfectly independent unit-variance numbers. Layer normalization and careful weight initialization keep them roughly in that range, which is why the scaling works well in practice, but it is a design heuristic that keeps the scale sensible, not an exact law for every trained model.' },
          { type: 'p', text: 'Some later architectures add extra controls on top, for example normalizing queries and keys before the dot product (often called QK-norm) to stop scores growing during long training runs. These complement √dₖ rather than replace the idea: keep softmax inputs in a sane range.' },
        ] },
      ],
    },
    {
      id: 'softmax-and-large-inputs',
      title: 'What large dot products do to softmax',
      blocks: [
        { type: 'p', text: 'The slope of softmax tells us how strongly the training signal flows back to the scores. For output pᵢ and input zⱼ it is:' },
        { type: 'formula', expr: '∂pᵢ / ∂zⱼ = pᵢ(δᵢⱼ − pⱼ)', where: [
          ['pᵢ', 'the softmax output for item i'],
          ['δᵢⱼ', '1 if i = j, else 0'],
        ], caption: 'On the diagonal this is pᵢ(1 − pᵢ), largest (0.25) when pᵢ = 0.5.' },
        { type: 'p', text: 'If softmax is saturated, one pᵢ is close to 1 and the rest are close to 0. Then pᵢ(1 − pᵢ) ≈ 1·0 = 0 for the winner, and pⱼ(…) ≈ 0 for the losers. **Every entry of the slope is near zero.** The loss cannot tell W_q and W_k which way to move, so they stop learning. This is the vanishing gradient problem the √dₖ factor prevents.' },
        { type: 'callout', tone: 'warn', title: 'Common misconception', text: 'Scaling is not about numerical overflow. Libraries already subtract the row maximum before exponentiating, so e^z never overflows. The real issue is **saturation**: correct but extreme probabilities with almost no gradient.' },
      ],
    },
    {
      id: 'why-sqrt-dk',
      title: 'Why √dₖ is the right scaling factor',
      blocks: [
        { type: 'compare', title: 'Three choices of divisor for dₖ = 64', options: [
          { name: 'No scaling', summary: 'Use raw q·k.', pros: ['Simplest'], cons: ['Std grows like √dₖ (8 here)', 'Softmax saturates', 'Gradients vanish'], bestFor: 'Very small dₖ only' },
          { name: 'Divide by √dₖ', summary: 'Use q·k / 8.', pros: ['Variance stays 1 for any dₖ', 'Softmax stays soft', 'Healthy gradients'], cons: ['Relies on roughly unit-variance q and k'], bestFor: 'Standard choice in Transformers' },
          { name: 'Divide by dₖ', summary: 'Use q·k / 64.', pros: ['Never saturates'], cons: ['Std shrinks to 1/√dₖ (0.125 here)', 'Weights near uniform', 'Model struggles to focus'], bestFor: 'Not used; over-corrects' },
        ], rows: [
          ['Variance of score', 'dₖ = 64', '1', '1/dₖ ≈ 0.016'],
          ['Typical score size', '8', '1', '0.125'],
          ['Softmax shape', 'Near one-hot', 'Moderately peaked', 'Near flat'],
        ], verdict: '√dₖ is the one divisor that makes the variance exactly 1, independent of width. That is why changing the head size does not require re-tuning anything else.' },
        { type: 'p', text: 'A related idea you will meet later is **temperature** in sampling: dividing logits by T before softmax. √dₖ is effectively a fixed temperature for attention scores, chosen so that the spread of scores does not depend on the head size.' },
      ],
    },
    {
      id: 'real-numbers',
      title: 'Seeing it with real numbers',
      blocks: [
        { type: 'code', lang: 'python', title: 'why_sqrt_dk.py', code: `import numpy as np
rng = np.random.default_rng(0)

def softmax(z):
    e = np.exp(z - z.max())
    return e / e.sum()

# 1) Variance of q.k grows with d_k (entries ~ mean 0, variance 1)
print("d_k   var(q.k)  var(q.k / sqrt(d_k))")
for d_k in [4, 16, 64, 256, 1024]:
    q = rng.standard_normal((20000, d_k))
    k = rng.standard_normal((20000, d_k))
    dots = (q * k).sum(axis=1)
    print(f"{d_k:<5} {dots.var():8.1f}  {(dots / np.sqrt(d_k)).var():8.2f}")

# 2) One query against 5 keys, d_k = 512
d_k = 512
rng = np.random.default_rng(0)        # fresh seed for this part
q = rng.standard_normal(d_k)
K = rng.standard_normal((5, d_k))
raw = K @ q
print("raw scores:     ", np.round(raw, 1))
print("softmax(raw):   ", np.round(softmax(raw), 3))
print("softmax(scaled):", np.round(softmax(raw / np.sqrt(d_k)), 3))

# 3) Softmax gradient (Jacobian = diag(p) - p p^T): how much signal flows back
for name, z in [("raw", raw), ("scaled", raw / np.sqrt(d_k))]:
    p = softmax(z)
    J = np.diag(p) - np.outer(p, p)
    print(f"largest gradient entry ({name}): {np.abs(J).max():.4f}")`,
          output: `d_k   var(q.k)  var(q.k / sqrt(d_k))
4          4.0      1.00
16        16.1      1.01
64        63.4      0.99
256      257.9      1.01
1024    1020.0      1.00
raw scores:      [ 22.8 -20.1   1.9  41.1 -25.4]
softmax(raw):    [0. 0. 0. 1. 0.]
softmax(scaled): [0.256 0.038 0.101 0.574 0.03 ]
largest gradient entry (raw): 0.0000
largest gradient entry (scaled): 0.2446`,
          walkthrough: [
            { lines: [8, 14], note: 'Simulate 20,000 random query-key pairs for each width. The measured variance of q·k tracks dₖ closely, and after dividing by √dₖ it stays near 1.' },
            { lines: [16, 21], note: 'One query against five random keys at dₖ = 512. Raw scores span roughly −25 to +41, a typical size of about √512 ≈ 22.6.' },
            { lines: [22, 24], note: 'Raw softmax is effectively one-hot; scaled softmax keeps a clear favourite (57%) while other keys still contribute.' },
            { lines: [26, 30], note: 'The softmax Jacobian measures how much gradient reaches the scores. Raw: about 0 (no learning signal). Scaled: about 0.24 (healthy).' },
          ] },
        { type: 'check', question: 'From the output, if dₖ were 4096, roughly what variance would raw q·k have, and what would dividing by √4096 = 64 give?', answer: 'About 4096 (std about 64) raw, and about 1 after scaling. The pattern in the table continues: variance ≈ dₖ before scaling and ≈ 1 after.' },
      ],
    },
    {
      id: "spotting-scale-bugs",
      title: "Common mistakes and how to spot them",
      blocks: [
        { type: "p", text: "A wrong scale never crashes. The code runs, the shapes are right, and the model simply learns badly. So we need a way to *measure* the scale. The handiest number is the standard deviation of the scaled scores at the start of training. If everything is set up as the proof assumes, it should be close to 1." },
        { type: "table", caption: "Worked numbers for a model with d_model = 4,096 and 32 heads, so dₖ = 128 and √dₖ ≈ 11.3. All values follow from Var(X / c) = Var(X) / c².", head: ["Mistake", "What we divide by", "Score std we would measure", "What the attention maps look like"], rows: [
          ["None (correct)", "√128 ≈ 11.3", "≈ 1", "Soft, with clear favourites"],
          ["No scaling", "1", "≈ 11.3", "Almost one-hot"],
          ["Used √d_model", "√4,096 = 64", "≈ 0.18", "Nearly flat"],
          ["Scaled twice", "√128 × √128 = 128", "≈ 0.09", "Flat"],
          ["Entries have std 2, not 1", "√128 ≈ 11.3", "≈ 4", "Too sharp, even with correct scaling"],
        ] },
        { type: "p", text: "The last row is the one people forget. The proof assumed entries with variance 1. If query and key entries each have standard deviation 2, one product qᵢkᵢ has variance 2² × 2² = 16, the dot product has variance 16·dₖ, and after dividing by √dₖ the standard deviation is still 4. The √dₖ factor removes the effect of *width*. It does nothing about the *size* of the entries." },
        { type: "steps", title: "A quick diagnosis routine", items: [
          { title: "Measure", text: "Take one batch at initialisation and compute the standard deviation of the scores right before softmax, for one head." },
          { title: "Near 1?", text: "Then the scale is fine. Look elsewhere for the problem." },
          { title: "Close to √dₖ?", text: "The scaling is missing. Close to 1/√dₖ? It is applied twice, once by hand and once inside a library call." },
          { title: "Off by √(number of heads)?", text: "The full model width was used instead of the per-head width." },
          { title: "Some other factor?", text: "Check the entries themselves. Print the standard deviation of Q and K. If they are not near 1, look at the weight initialisation and at whether the input was normalised." },
        ] },
        { type: "viz", name: "temperature", caption: "Dividing scores before softmax is the same move as temperature. Drag the slider: a low value acts like missing scaling (one bar takes all), a high value acts like dividing too much (all bars level out)." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The lesson's code *sampled* random vectors, so its variances were close to dₖ but never exact. We will now get the exact answer with no randomness at all. We let every entry be +1 or −1, list every possible pair of vectors, and compute the variance of the dot product over the full list." },
        { type: "code", lang: "python", title: "practice_exact_variance.py", code: `import itertools
import math
from collections import Counter

def all_scores(d_k):
    # Every entry of q and k is +1 or -1 (mean 0, variance 1).
    # Instead of sampling, list EVERY possible pair of vectors.
    signs = list(itertools.product([-1, 1], repeat=d_k))
    return [sum(a * b for a, b in zip(q, k)) for q in signs for k in signs]

def variance(xs):
    mean = sum(xs) / len(xs)
    return sum((x - mean) ** 2 for x in xs) / len(xs)

# The full distribution for d_k = 2: which scores can happen, and how often?
print("d_k = 2 scores:", sorted(Counter(all_scores(2)).items()))

print("d_k  cases   raw  /sqrt(d_k)   /d_k")
for d_k in [1, 2, 4, 6]:
    raw = all_scores(d_k)
    by_sqrt = [s / math.sqrt(d_k) for s in raw]
    by_dk = [s / d_k for s in raw]
    print(f"{d_k:<4} {len(raw):<6} {variance(raw):4.1f}  {variance(by_sqrt):9.2f}  {variance(by_dk):6.3f}")`, output: `d_k = 2 scores: [(-2, 4), (0, 8), (2, 4)]
d_k  cases   raw  /sqrt(d_k)   /d_k
1    4       1.0       1.00   1.000
2    16      2.0       1.00   0.500
4    256     4.0       1.00   0.250
6    4096    6.0       1.00   0.167`,
          walkthrough: [
            { lines: [5, 9], note: "A fair +1/−1 entry has mean 0 and variance 1, exactly what the proof assumes. `itertools.product` lists every possible vector, and we take the dot product of every query with every key." },
            { lines: [11, 13], note: "Plain variance: the average squared distance from the mean." },
            { lines: [15, 16], note: "For dₖ = 2 there are 16 cases. The score is −2 in 4 of them, 0 in 8 and +2 in 4." },
            { lines: [18, 23], note: "For each width, the variance with no scaling, with √dₖ and with dₖ. Raw equals dₖ exactly, √dₖ gives exactly 1, and dividing by dₖ shrinks towards 0." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Add `8` to the list of widths. Predict all four numbers in the new row before running (it takes a moment: count the cases first).",
          "Change the entries from `[-1, 1]` to `[-2, 2]`. Predict the raw variance for `d_k = 2` and the value in the `/sqrt(d_k)` column.",
          "Replace `math.sqrt(d_k)` with `d_k ** 0.25`. Predict whether that column now grows, shrinks or stays at 1 as `d_k` rises.",
        ] },
        { type: "check", question: "For dₖ = 2 the scores are −2 (4 cases), 0 (8 cases) and +2 (4 cases). Work out the variance from these counts. Why is 0 the most common score?", answer: "The mean is 0, so the variance is the average square: (4 × 4 + 8 × 0 + 4 × 4) / 16 = 32 / 16 = 2, which equals dₖ. A score of 0 happens when the two terms have opposite signs and cancel, and that is half of all cases. Cancelling is common, but it is never complete on average, so the spread still grows as more terms are added." },
        { type: "check", question: "A teammate uses the correct √dₖ, measures the standard deviation of the scaled scores at initialisation, and gets about 4 instead of 1. What should they check next?", answer: "The size of the query and key entries. The √dₖ factor assumes each entry has variance about 1. A score std of 4 fits entries with standard deviation near 2 (2 × 2 = 4). They should print the std of Q and K, then look at the weight initialisation and at whether the input to the attention layer was normalised." },
      ],
    },
    {
      id: 'putting-it-together',
      title: 'Putting it all together',
      blocks: [
        { type: 'flow', title: 'The chain of cause and effect', nodes: [
          { label: 'Wide vectors', detail: 'Each head uses query/key vectors of length dₖ, often 64 or 128.' },
          { label: 'Big dot products', detail: 'A sum of dₖ random terms has variance dₖ, so typical scores are about √dₖ in size.' },
          { label: 'Saturated softmax', detail: 'Large score gaps push softmax toward one-hot weights.' },
          { label: 'Vanishing gradients', detail: 'The slope pᵢ(δᵢⱼ − pⱼ) is near zero, so W_q and W_k barely learn.' },
          { label: 'Fix: divide by √dₖ', detail: 'Variance returns to 1 for any dₖ; softmax stays in its useful, trainable range.' },
        ] },
        { type: 'callout', tone: 'example', title: 'In real systems', text: 'Every mainstream attention implementation applies this scale by default, often exposed as a `scale` argument that defaults to 1/√dₖ (PyTorch\'s `scaled_dot_product_attention` is one example). Fused kernels such as FlashAttention apply the same factor inside the kernel. If you write attention by hand and forget it, small models may still train, but larger heads often learn much more slowly.' },
        { type: 'callout', tone: 'warn', title: 'Pitfalls', text: 'Using the full model width d_model instead of the per-head dₖ in the square root (with 32 heads of 128, divide by √128, not √4096). Scaling twice (once manually and once inside a library call that already scales). And assuming the factor fixes everything: if queries and keys grow very large during training, scores can still saturate, which is why some models add QK-norm.' },
      ],
    },
  ],
  quiz: [
    { q: 'Assuming query and key entries are independent with mean 0 and variance 1, what is the variance of q·k for vectors of length dₖ?', options: ['1', '√dₖ', 'dₖ', 'dₖ²'], answer: 2, explain: 'Each product qᵢkᵢ has variance 1, and the variances of dₖ independent terms add, giving dₖ. √dₖ is the standard deviation, which is the tempting wrong answer.' },
    { q: 'Why does dividing by √dₖ (rather than dₖ) give unit variance?', options: ['Because Var(X / c) = Var(X) / c², so we need c² = dₖ', 'Because softmax takes a square root of its inputs internally', 'Because √dₖ equals the number of attention heads in the layer', 'Because dividing by dₖ itself would overflow in half precision'], answer: 0, explain: 'Scaling by 1/c divides variance by c². To turn variance dₖ into 1 we need c² = dₖ, so c = √dₖ. Dividing by dₖ would leave variance 1/dₖ, making attention nearly uniform.' },
    { q: 'A model has d_model = 4096 split into 32 heads. What should each head divide its scores by?', options: ['√4096 = 64', '√32 ≈ 5.7', '4096 / 32 = 128', '√128 ≈ 11.3'], answer: 3, explain: 'Each head has dₖ = 4096 / 32 = 128, and the scale uses the per-head query/key length: √128 ≈ 11.3. Using the full model width is a common bug.' },
    { q: 'You train a hand-written attention layer without √dₖ scaling and see that attention maps are almost one-hot from step one and loss barely moves. What best explains this?', options: ['The value vectors V are too small for the output to change much', 'Large scores saturate softmax, so gradients vanish and Q/K barely learn', 'Softmax overflowed to infinity, so the weights became NaN or one-hot', 'The causal mask is missing, so tokens can see the answers ahead'], answer: 1, explain: 'Saturation, not overflow, is the issue: stable softmax implementations avoid overflow, but near-one-hot outputs have almost zero slope, starving W_q and W_k of gradient.' },
    { q: 'Which statement about the √dₖ scale is a misconception?', options: ['It keeps the spread of scores independent of head size', 'It mainly exists to stop e^z from overflowing in floating point', 'It acts like a fixed temperature on the attention scores', 'Dividing by too large a number would make attention weights nearly uniform'], answer: 1, explain: 'Overflow is handled separately by subtracting the row maximum. The scale exists to prevent saturation and vanishing gradients. The other three statements are true.' },
  ],
  takeaways: [
    'A dot product sums dₖ terms, so with unit-variance entries its variance is dₖ and its typical size is √dₖ.',
    'Large scores saturate softmax into near one-hot weights with near-zero gradients, so attention stops learning.',
    'Var(X / c) = Var(X) / c², so dividing by √dₖ restores variance 1 for any head size.',
    'Dividing by dₖ would over-correct and flatten attention; no scaling would saturate it.',
    'Use the per-head dₖ, not the full model width, and do not apply the scale twice.',
  ],
  terms: [
    { term: 'Variance', def: 'The average squared distance of a random value from its mean; it measures spread.' },
    { term: 'Standard deviation', def: 'The square root of the variance: the typical size of the spread, in the original units.' },
    { term: 'Saturation', def: 'When softmax inputs are so far apart that the output is nearly one-hot and its slope is nearly zero.' },
    { term: 'Vanishing gradient', def: 'A training signal so small that the affected weights effectively stop updating.' },
    { term: 'Scaled dot-product attention', def: 'Attention where query-key dot products are divided by √dₖ before softmax.' },
    { term: 'Jacobian of softmax', def: 'The table of slopes ∂pᵢ/∂zⱼ = pᵢ(δᵢⱼ − pⱼ) describing how outputs respond to inputs.' },
  ],
};
