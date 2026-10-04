export default {
  id: 'math-behind-rope-rotary-position-embedding',
  minutes: 27,
  hook: 'Attention on its own cannot tell "dog bites man" from "man bites dog". How do modern LLMs know word order, using nothing but a rotation?',
  summary: 'RoPE (Rotary Position Embedding) encodes position by rotating each query and key vector by an angle proportional to the token\'s position, using different rotation speeds for different pairs of dimensions. Because rotating both vectors and then taking a dot product only depends on the difference of their angles, the attention score automatically depends on the relative distance between tokens. It adds no parameters, keeps vector lengths unchanged, and is used by most open LLMs today.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: '**RoPE**, short for **Rotary Position Embedding**, was introduced in 2021 in the RoFormer paper by Jianlin Su and colleagues. It is the way most open-weight LLMs (Llama, Mistral, Qwen, Gemma and others) tell their attention layers where each token sits in the sequence.' },
        { type: 'p', text: 'The idea in one sentence: **before computing attention scores, rotate each query and key vector by an angle that grows with its position.** A token at position 5 is rotated more than a token at position 2. When two rotated vectors are compared with a dot product, the result depends on *how far apart* the two angles are, which is exactly the distance between the tokens.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like clock hands', text: 'Imagine each token carries a clock whose hand moves forward a fixed step for each position. To compare two tokens, you only look at the angle *between* their hands. Two tokens 3 positions apart always have the same angle between their hands, whether they are at 2 and 5 or at 1,000 and 1,003. That is RoPE in a picture: absolute rotations, relative comparisons.' },
      ],
    },
    {
      id: 'why-position-information',
      title: 'Why a Transformer needs position information',
      blocks: [
        { type: 'p', text: 'Attention compares every query with every key using dot products and then takes a weighted average. Nothing in that recipe knows the **order** of tokens. If you shuffle the input tokens, each token gets exactly the same set of scores, just in a shuffled order. Mathematically, attention is **permutation-equivariant**: permute the inputs and the outputs are permuted the same way, but otherwise unchanged.' },
        { type: 'p', text: 'So without extra help, "dog bites man" and "man bites dog" would look like the same bag of words. Word order carries meaning, so we must inject position somehow. The question is *how*, and that is where approaches differ.' },
        { type: 'check', question: 'Pause and think: a causal mask already makes token 3 unable to see token 4. Does that give the model full position information?', answer: 'Only partly. The mask tells a token which tokens are earlier, but within the visible past it still cannot tell "the word just before me" from "a word 50 tokens back" without some position signal. Models with a causal mask still use explicit position encodings like RoPE.' },
      ],
    },
    {
      id: 'older-approaches',
      title: 'Older approaches and their problems',
      blocks: [
        { type: 'table', caption: 'How position has been added to Transformers', head: ['Approach', 'How it works', 'Main drawback'], rows: [
          ['Sinusoidal absolute (original Transformer, 2017)', 'Add a fixed pattern of sines and cosines for each position to the token embedding', 'Position is mixed into the content vector; relative distance is only indirectly available'],
          ['Learned absolute (BERT, GPT-2)', 'Learn one vector per position index up to a maximum, add it to the embedding', 'No vector exists beyond the maximum (e.g. 512 or 1,024), so the model cannot handle longer inputs'],
          ['Relative position bias (T5 and others)', 'Add a learned bias to each attention score based on the (bucketed) distance between tokens', 'Extra parameters and extra work inside every attention score computation'],
          ['ALiBi (2021; used in BLOOM, MPT)', 'Subtract a penalty proportional to distance from each attention score', 'A fixed linear bias that strongly favours nearby tokens'],
        ] },
        { type: 'p', text: 'The wish list that motivated RoPE: (1) attention scores should depend on **relative** distance, since "two words back" means the same thing anywhere in a document; (2) **no extra learned parameters**; (3) it should not disturb the **size** of the content vectors; and (4) it should fit into ordinary, fast attention code.' },
      ],
    },
    {
      id: 'core-idea',
      title: 'The core idea behind RoPE',
      blocks: [
        { type: 'p', text: 'RoPE does not add anything to the token embeddings. Instead, it acts **inside attention**, right after the queries and keys are computed and before their dot product. It splits each query and key vector into **pairs of numbers**: (x₁, x₂), (x₃, x₄), and so on. Each pair is treated as a point on a 2D plane and rotated by an angle. The angle is position × frequency, and each pair has its own frequency.' },
        { type: 'list', items: [
          '**Fast pairs** rotate a lot per position (for example 1 radian per token). They are sensitive to small distances: is this the next word or the one after?',
          '**Slow pairs** rotate very little per position. They change meaningfully only over hundreds or thousands of tokens, so they can encode long-range distance.',
          'Values (V) are **not** rotated. Only Q and K, because only their dot product decides the attention weights.',
        ] },
        { type: 'viz', name: 'rope', caption: 'Slide the positions of a query and a key. The vectors rotate, but as long as the distance between them stays the same, their dot product stays the same.' },
      ],
    },
    {
      id: 'rotation-math',
      title: 'The 2D rotation math',
      blocks: [
        { type: 'p', text: 'Rotating a 2D point (x, y) counter-clockwise by an angle φ is done with a **rotation matrix**:' },
        { type: 'formula', expr: 'R(φ) = [[cos φ, −sin φ], [sin φ, cos φ]]     R(φ)·(x, y) = (x·cos φ − y·sin φ,  x·sin φ + y·cos φ)', where: [
          ['φ', 'the rotation angle (in radians; 2π radians = 360°)'],
          ['R(φ)', 'a 2 × 2 matrix that turns a vector without changing its length'],
        ] },
        { type: 'p', text: 'Rotation matrices have two properties we need:' },
        { type: 'list', ordered: true, items: [
          '**Rotations preserve length.** ‖R(φ)·v‖ = ‖v‖. The content of a vector is not inflated or shrunk by its position.',
          '**Rotations compose by adding angles, and undoing one is rotating backwards.** R(a)ᵀ = R(−a), and R(−a)·R(b) = R(b − a).',
        ] },
        { type: 'p', text: 'Example: rotate (1, 0) by 90°. cos 90° = 0 and sin 90° = 1, so we get (1·0 − 0·1, 1·1 + 0·0) = (0, 1). The point moved from pointing right to pointing up, and its length is still 1.' },
      ],
    },
    {
      id: 'applying-to-q-and-k',
      title: 'How RoPE is applied to Q and K',
      blocks: [
        { type: 'steps', title: 'RoPE inside one attention layer', items: [
          { title: 'Project', text: 'Compute the query q and key k for every token as usual (q = x·W_q, k = x·W_k).' },
          { title: 'Pick frequencies', text: 'For a head of width d there are d/2 pairs. Pair i gets frequency θᵢ = base^(−2i/d), with base = 10,000 in the original paper. Pair 0 has θ = 1; later pairs get geometrically slower.' },
          { title: 'Rotate by position', text: 'For a token at position m, rotate pair i of its query and key by the angle m·θᵢ.' },
          { title: 'Score', text: 'Compute rotated-q · rotated-k / √dₖ as usual. The score now contains relative-position information.' },
          { title: 'Continue', text: 'Softmax and the weighted sum of V are unchanged. V is not rotated.' },
        ] },
        { type: 'formula', expr: 'θᵢ = base^(−2i / d),   i = 0, 1, …, d/2 − 1;    q̃ₘ = Rₘ·qₘ,  k̃ₙ = Rₙ·kₙ', where: [
          ['base', '10,000 originally; some newer models use much larger bases (Llama 3 uses 500,000)'],
          ['Rₘ', 'block-diagonal matrix of d/2 rotations, pair i rotated by m·θᵢ'],
          ['m, n', 'positions of the query token and the key token'],
        ] },
        { type: 'p', text: 'In code, nobody builds the big rotation matrix. Because it is block-diagonal, rotating is just a few element-wise multiplications with precomputed cos and sin tables. Implementations differ in **which** dimensions are paired: the original paper pairs neighbours (x₀, x₁), (x₂, x₃), while many popular codebases pair the first half with the second half (x₀ with x_d/2). Both are valid as long as the same convention is used in training and inference.' },
      ],
    },
    {
      id: 'why-relative',
      title: 'Why the dot product captures relative position',
      blocks: [
        { type: 'p', text: 'This is the heart of RoPE. Take one pair, query at position m and key at position n:' },
        { type: 'formula', expr: '(R(mθ)·q)ᵀ · (R(nθ)·k) = qᵀ · R(mθ)ᵀ · R(nθ) · k = qᵀ · R((n − m)θ) · k', caption: 'Using R(a)ᵀ = R(−a) and R(−a)·R(b) = R(b − a).' },
        { type: 'p', text: 'The absolute positions m and n have vanished. Only their **difference** (n − m) remains. The same is true for every pair, so the full score depends on the content of q and k and on their relative distance, never on where in the document they happen to be. Move both tokens 1,000 positions later and the score is identical.' },
        { type: 'deeper', title: 'Long-range decay', blocks: [
          { type: 'p', text: 'The RoFormer paper also shows that, with this choice of frequencies, the size of the score tends to shrink (with oscillations) as relative distance grows, so far-apart tokens interact less by default. The chart below illustrates this for the special case where q and k are both the all-ones vector in 64 dimensions; real trained vectors behave less neatly.' },
          { type: 'chart', kind: 'line', title: 'RoPE score vs distance for q = k = all-ones (d = 64, base 10,000)', xLabel: 'Relative distance (tokens)', yLabel: 'q̃ · k̃', series: [
            { name: 'Score', points: [[0, 64.0], [1, 61.8], [2, 56.6], [4, 47.9], [8, 44.8], [16, 38.7], [32, 39.1], [64, 27.8], [128, 18.2], [256, 22.6], [512, 11.9], [1024, 16.8]] },
          ], caption: 'Computed with numpy as ∑ 2·cos(distance·θᵢ). The trend falls with distance, with ripples.' },
        ] },
      ],
    },
    {
      id: 'numeric-example',
      title: 'A small numeric example',
      blocks: [
        { type: 'p', text: 'Use one pair and a rotation of **30° per position**. Let q = k = (1, 0), so before rotation they point the same way and their dot product is 1.' },
        { type: 'list', items: [
          '**Query at position 1, key at position 3.** q rotates 30° → (cos 30°, sin 30°) = (0.866, 0.5). k rotates 90° → (0, 1). Dot product = 0.866·0 + 0.5·1 = **0.5**.',
          '**Query at position 4, key at position 6.** q rotates 120° → (−0.5, 0.866). k rotates 180° → (−1, 0). Dot product = (−0.5)(−1) + 0.866·0 = **0.5**.',
          'Both pairs are 2 positions apart, so the angle between them is 60° both times, and the score is cos 60° = 0.5 both times.',
        ] },
        { type: 'p', text: 'Now the same check with a real 8-dimensional RoPE (4 pairs, base 10,000) and random vectors:' },
        { type: 'code', lang: 'python', title: 'rope_demo.py', code: `import numpy as np
rng = np.random.default_rng(0)

def rope(x, pos, base=10000.0):
    """Rotate each pair (x[2i], x[2i+1]) by angle pos * theta_i."""
    d = x.shape[-1]
    theta = base ** (-np.arange(0, d, 2) / d)    # one frequency per pair
    ang = pos * theta
    cos, sin = np.cos(ang), np.sin(ang)
    x1, x2 = x[0::2], x[1::2]
    out = np.empty_like(x)
    out[0::2] = x1 * cos - x2 * sin
    out[1::2] = x1 * sin + x2 * cos
    return out

d = 8
q, k = rng.standard_normal(d), rng.standard_normal(d)
print("frequencies:", np.round(10000.0 ** (-np.arange(0, d, 2) / d), 4))

# Same distance (3) at different absolute positions -> same score
for m, n in [(5, 2), (50, 47), (1000, 997)]:
    s = rope(q, m) @ rope(k, n)
    print(f"query at {m:>4}, key at {n:>4} (distance {m-n}): score = {s:.4f}")

# Different distances -> different scores
for dist in [0, 1, 10, 100]:
    print(f"distance {dist:>3}: score = {rope(q, dist) @ rope(k, 0):.4f}")

# Rotation never changes a vector's length
print("norm before/after:", round(np.linalg.norm(q), 4), round(np.linalg.norm(rope(q, 123)), 4))`,
          output: `frequencies: [1.    0.1   0.01  0.001]
query at    5, key at    2 (distance 3): score = -1.5865
query at   50, key at   47 (distance 3): score = -1.5865
query at 1000, key at  997 (distance 3): score = -1.5865
distance   0: score = -1.4680
distance   1: score = -1.6954
distance  10: score = -1.1246
distance 100: score = -0.3711
norm before/after: 1.8627 1.8627`,
          walkthrough: [
            { lines: [4, 14], note: 'The whole of RoPE: compute one frequency per pair, multiply by the position to get angles, and apply the 2D rotation formula to every (even, odd) pair.' },
            { lines: [16, 18], note: 'Eight dimensions give four pairs with frequencies 1, 0.1, 0.01 and 0.001 radians per position: fast to slow.' },
            { lines: [20, 23], note: 'The key result: three very different absolute positions, same distance, identical score (−1.5865).' },
            { lines: [25, 27], note: 'Change the distance and the score changes. That is the signal attention uses to tell near from far.' },
            { lines: [29, 30], note: 'Rotation preserves length, so position never distorts how "strong" a query or key is.' },
          ] },
        { type: 'check', question: 'In the output, the fastest pair rotates 1 radian per position. Roughly how many positions does it take to complete a full turn, and why do we also need the slow pairs?', answer: 'A full turn is 2π ≈ 6.28 radians, so about 6.3 positions. After that the fast pair repeats, so on its own it cannot tell distance 1 from distance 7.3. Slow pairs change only over long distances and break that ambiguity, like the hour hand complementing the second hand.' },
      ],
    },
    {
      id: 'compare-and-real-world',
      title: 'Comparison, real-world use and pitfalls',
      blocks: [
        { type: 'compare', title: 'Learned absolute positions vs ALiBi vs RoPE', options: [
          { name: 'Learned absolute', summary: 'One trained vector per position, added to embeddings.', pros: ['Simple', 'Flexible within the trained range'], cons: ['Hard limit at the maximum position', 'Relative distance is not built in'], bestFor: 'Older models with fixed short contexts (BERT, GPT-2)' },
          { name: 'ALiBi', summary: 'Distance-proportional penalty on attention scores.', pros: ['No parameters', 'Extrapolates to longer inputs fairly well'], cons: ['Fixed linear preference for nearby tokens'], bestFor: 'Some 2022–2023 models (BLOOM, MPT)' },
          { name: 'RoPE', summary: 'Rotate Q and K by position-dependent angles.', pros: ['Relative by construction', 'No parameters, length-preserving', 'Works with standard fast attention kernels'], cons: ['Poor extrapolation past the trained length without scaling tricks'], bestFor: 'Most current open LLMs' },
        ], rows: [
          ['Where it acts', 'Input embeddings', 'Attention scores', 'Queries and keys'],
          ['Relative distance', 'Learned indirectly', 'Explicit penalty', 'Exact, via rotation'],
          ['Extra parameters', 'Yes', 'No', 'No'],
        ], verdict: 'RoPE became the default because it gives clean relative-position behaviour for free and fits existing attention code.' },
        { type: 'callout', tone: 'example', title: 'Real-world use: stretching context windows', text: 'RoPE is used by Llama, Mistral, Qwen, Gemma, GPT-NeoX and PaLM, among others. Because positions are just angles, a model trained on 4K tokens can be adapted to longer contexts by changing how angles are computed: **position interpolation** squeezes new positions into the trained angle range, while **NTK-aware scaling** and **YaRN** adjust frequencies unevenly so fast pairs keep local detail. Raising the base (as Llama 3 did, with 500,000) slows all rotations so long distances stay distinguishable. These methods usually need some fine-tuning on long text to work well.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Rotating V as well as Q and K (RoPE only touches Q and K). Mixing the two pairing conventions between a checkpoint and your inference code, which silently scrambles positions. Assuming a RoPE model works beyond its trained length without scaling: quality usually collapses. And forgetting to apply the correct absolute position to each new token when using a KV cache, since cached keys were rotated with their own positions.' },
      ],
    },
    {
      id: "complex-number-view",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "There is a second way to write RoPE that makes the proof one line long. Treat each pair (a, b) as a single **complex number** a + bi. Rotating the pair by an angle φ is then just a multiplication by e^(iφ) = cos φ + i·sin φ. Quick check with the earlier example: (1 + 0i) × (cos 90° + i·sin 90°) = i, which is the point (0, 1)." },
        { type: "p", text: "The dot product has a complex form too. For two pairs written as complex numbers z and w, the dot product is the real part of z × w̄, where w̄ flips the sign of the imaginary part of w." },
        { type: "steps", title: "One pair, with q = (1, 2) and k = (3, −1)", items: [
          { title: "Write them as complex numbers", text: "q = 1 + 2i and k = 3 − i, so k̄ = 3 + i." },
          { title: "Multiply once", text: "q × k̄ = (1 + 2i)(3 + i) = 3 + i + 6i + 2i² = 1 + 7i. The real part, 1, is the ordinary dot product: 1·3 + 2·(−1) = 1." },
          { title: "Add the positions", text: "Query at position m, key at position n: (q·e^(imθ)) × conj(k·e^(inθ)) = q × k̄ × e^(i(m−n)θ). The two absolute angles merge into one difference." },
          { title: "Plug in numbers", text: "With 30° per position, query at 1 and key at 3, the difference is −60°. e^(−i60°) = 0.5 − 0.866i." },
          { title: "Take the real part", text: "(1 + 7i)(0.5 − 0.866i) has real part 0.5 + 7 × 0.866 ≈ 6.56. That is the RoPE score for this pair at this distance." },
        ] },
        { type: "p", text: "Look at what happened to the 7. In a plain dot product the imaginary part of q × k̄ is thrown away. With RoPE, the score for one pair is A·cos(Δ) + B·sin(Δ), where A + Bi = q × k̄ and Δ is the angle for the distance. So each pair contributes a **wave in distance**, and the learned q and k set its height and its shift. That is how a head can learn to prefer “two tokens back” over “the same token”." },
        { type: "table", caption: "Wavelengths for the lesson's 8-dimensional example (base 10,000): 2π / θᵢ positions per full turn.", head: ["Pair", "θᵢ (radians per position)", "Full turn every", "Good at telling apart"], rows: [
          ["0", "1", "≈ 6.3 positions", "Neighbouring tokens"],
          ["1", "0.1", "≈ 62.8 positions", "Positions within a sentence or two"],
          ["2", "0.01", "≈ 628 positions", "Paragraph-scale distances"],
          ["3", "0.001", "≈ 6,283 positions", "Document-scale distances"],
        ] },
        { type: "p", text: "The slowest pairs matter for long inputs. If a model only ever trains on a few thousand tokens, a pair with a wavelength longer than that never completes a turn during training. Longer inputs then push it to angles it has not met before. This is one common explanation for why RoPE models degrade past their trained length, and why the scaling methods above work by squeezing or slowing the angles." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will write RoPE for a single pair using Python's built-in complex numbers, with no numpy and no rotation matrix. We check that the score depends only on the distance, try the shortcut of rotating just one vector, and print the wavelength of each pair." },
        { type: "code", lang: "python", title: "practice_rope_complex.py", code: `import cmath
import math

def rotate(pair, pos, theta):
    # Treat the pair (a, b) as the complex number a + bi.
    # Multiplying by e^(i * angle) rotates it by that angle.
    return complex(*pair) * cmath.exp(1j * pos * theta)

def dot(z1, z2):
    # Dot product of two 2-D vectors written as complex numbers
    return (z1 * z2.conjugate()).real

q, k = (1.0, 2.0), (3.0, -1.0)
theta = math.radians(30)          # 30 degrees per position

print("no rotation      :", round(dot(complex(*q), complex(*k)), 4))
for m, n in [(1, 3), (4, 6), (100, 102)]:
    score = dot(rotate(q, m, theta), rotate(k, n, theta))
    print(f"query at {m:3d}, key at {n:3d}: score = {score:.4f}")

# Shortcut: leave q alone and rotate k by the distance only
print("rotate k by 2 only:", round(dot(complex(*q), rotate(k, 2, theta)), 4))

# Wavelength: positions needed for one pair to turn a full circle
for i, th in enumerate([1.0, 0.1, 0.01, 0.001]):
    print(f"pair {i}: theta = {th:<5} full turn every {2 * math.pi / th:7.1f} positions")`, output: `no rotation      : 1.0
query at   1, key at   3: score = 6.5622
query at   4, key at   6: score = 6.5622
query at 100, key at 102: score = 6.5622
rotate k by 2 only: 6.5622
pair 0: theta = 1.0   full turn every     6.3 positions
pair 1: theta = 0.1   full turn every    62.8 positions
pair 2: theta = 0.01  full turn every   628.3 positions
pair 3: theta = 0.001 full turn every  6283.2 positions`,
          walkthrough: [
            { lines: [4, 7], note: "The whole of RoPE for one pair: turn (a, b) into a + bi and multiply by e^(i·pos·θ)." },
            { lines: [9, 11], note: "The dot product of two pairs, written as the real part of z₁ times the conjugate of z₂." },
            { lines: [13, 19], note: "Three query/key placements, all with the key 2 positions after the query. The score is 6.5622 every time, and it differs from the unrotated dot product of 1.0." },
            { lines: [21, 26], note: "Rotating only k by the distance gives the same 6.5622. Then the wavelengths: 2π divided by each frequency." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Swap the placements so the key comes *before* the query: use `[(3, 1), (6, 4), (102, 100)]`. Predict first: is the score still 6.5622?",
          "Set `q, k = (1.0, 0.0), (1.0, 0.0)`. Predict the score at distance 2 from the lesson's small numeric example.",
          "Change the angle to `math.radians(90)`. Using q × k̄ = 1 + 7i, predict the score for a key 2 positions after the query.",
        ] },
        { type: "check", question: "Without rotation the score of this pair is 1.0. At a distance of 2 it is 6.56. Rotation never changes a vector's length, so how can the score get *bigger*?", answer: "A dot product depends on lengths and on the angle between the vectors. q = (1, 2) and k = (3, −1) start almost at right angles, which is why the plain score is small. Turning one of them by 60° relative to the other brings them close to parallel, so the same lengths give a much larger score. A model can learn q and k that line up best at a chosen distance, and that is a head that prefers a certain offset." },
        { type: "check", question: "Pair 3 needs about 6,283 positions for a full turn. A model is trained only on inputs of up to 2,048 tokens. Roughly what share of that pair's circle did training cover, and why does it matter?", answer: "About one third (2,048 / 6,283 ≈ 0.33). For that pair, any distance beyond 2,048 lands on an angle the model never saw during training, so its behaviour there is untested. That is why feeding a much longer input tends to hurt quality, and why context-extension methods rescale positions or frequencies to bring the angles back into the familiar range." },
      ],
    },
  ],
  quiz: [
    { q: 'What does RoPE do to encode position?', options: ['Adds a learned position vector to each token embedding at the input', 'Rotates query and key vectors by angles proportional to position', 'Subtracts a distance-based penalty from each attention score', 'Multiplies each value vector by the token\'s position index'], answer: 1, explain: 'RoPE rotates pairs of dimensions of Q and K. Adding learned vectors is learned absolute embedding; subtracting a penalty is ALiBi.' },
    { q: 'Why does the RoPE attention score depend only on relative distance?', options: ['Because the model learns to ignore absolute positions during training', 'Because the value vectors are left unrotated, so position cancels out', 'Because R(mθ)ᵀ·R(nθ) = R((n − m)θ), so only the position gap remains', 'Because softmax normalises away the absolute position information'], answer: 2, explain: 'Rotations compose by adding angles, and the transpose undoes a rotation. In the dot product the absolute positions cancel and only n − m survives.' },
    { q: 'With q = k = (1, 0) and 30° of rotation per position, what is the score for a query at position 2 and a key at position 5?', options: ['cos 90° = 0', 'cos 150° ≈ −0.87', '1', 'cos 30° ≈ 0.87'], answer: 0, explain: 'The distance is 3 positions, so the angle between the rotated vectors is 3 × 30° = 90°, and cos 90° = 0. The absolute positions do not matter.' },
    { q: 'A RoPE model was trained on 4,096-token inputs. You feed it 32,000 tokens and the output becomes incoherent. What is the most appropriate fix?', options: ['Switch to learned absolute position embeddings, which have no fixed limit on input length', 'Use position interpolation, NTK-aware scaling or YaRN, plus some long-context fine-tuning', 'Rotate the value vectors too, so position information reaches the outputs', 'Remove the √dₖ scaling so attention scores stay sharp over long distances'], answer: 1, explain: 'RoPE does not extrapolate well past trained angles by itself. Context-extension methods remap angles into a familiar range; learned absolute embeddings would be worse because they have a hard maximum.' },
    { q: 'Which statement about RoPE is a misconception?', options: ['It adds no learned parameters', 'It preserves the length of query and key vectors', 'It is applied to Q, K and V before attention', 'Different pairs of dimensions rotate at different speeds'], answer: 2, explain: 'RoPE is applied only to queries and keys, since only their dot product determines attention weights. V is left untouched.' },
  ],
  takeaways: [
    'Attention alone ignores order, so Transformers need a position signal.',
    'RoPE rotates each pair of query/key dimensions by position × frequency, with fast and slow pairs.',
    'In the dot product the absolute angles cancel, so scores depend only on relative distance.',
    'It adds no parameters, preserves vector length, leaves V alone and fits standard attention kernels.',
    'Going beyond the trained context needs scaling methods such as position interpolation, NTK-aware scaling or YaRN.',
  ],
  terms: [
    { term: 'RoPE', def: 'Rotary Position Embedding: encoding position by rotating query and key vectors.' },
    { term: 'Rotation matrix', def: 'A matrix that turns a vector by an angle without changing its length.' },
    { term: 'Frequency θᵢ', def: 'How many radians pair i rotates per position; base^(−2i/d).' },
    { term: 'Relative position', def: 'The distance between two tokens, as opposed to their index in the sequence.' },
    { term: 'Permutation-equivariant', def: 'Shuffling the inputs simply shuffles the outputs the same way, so order is invisible.' },
    { term: 'ALiBi', def: 'A position method that subtracts a distance-proportional penalty from attention scores.' },
    { term: 'Position interpolation', def: 'Extending context by squeezing new positions into the angle range seen during training.' },
  ],
};
