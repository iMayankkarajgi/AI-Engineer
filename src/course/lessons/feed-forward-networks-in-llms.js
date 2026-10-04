export default {
  id: 'feed-forward-networks-in-llms',
  minutes: 27,
  hook: 'Attention gets all the fame, yet about two thirds of a typical LLM\'s parameters sit somewhere else. What is that "somewhere else" doing?',
  summary: 'Every Transformer layer has two parts: attention, which moves information between tokens, and a feed-forward network (FFN), which processes each token on its own. The FFN expands each token vector to a wider hidden layer (typically about 4× wider, or about 2.7× with three matrices in SwiGLU), applies a non-linear activation, and contracts it back. It holds most of the parameters and is widely believed to store much of the model\'s learned knowledge; in Mixture-of-Experts models, it is the part that gets split into experts.',
  sections: [
    {
      id: 'what-is-ffn',
      title: 'What is a feed-forward network?',
      blocks: [
        { type: 'p', text: 'A **feed-forward network** is the simplest kind of neural network: numbers flow in one direction, from input through one or more hidden layers to the output, with no loops. Each layer multiplies its input by a **weight matrix**, adds a **bias** vector, and applies an **activation function** (a simple non-linear function such as ReLU). Another common name is **MLP** (multi-layer perceptron).' },
        { type: 'p', text: 'Inside a Transformer, the FFN is a small two-layer network that is applied to **each token separately**, using the **same weights** for every token position. That is why the original Transformer paper called it a "position-wise" feed-forward network.' },
        { type: 'formula', expr: 'FFN(x) = W₂ · ReLU(W₁·x + b₁) + b₂', where: [
          ['x', 'one token\'s vector, length d_model'],
          ['W₁, b₁', 'expansion layer: d_model → d_ff (d_ff is usually larger)'],
          ['ReLU', 'activation: max(0, z) applied to each number'],
          ['W₂, b₂', 'contraction layer: d_ff → d_model'],
        ], caption: 'The original 2017 form. Modern LLMs swap ReLU for GELU or SwiGLU and often drop the biases.' },
      ],
    },
    {
      id: 'analogy',
      title: 'Understanding the FFN with a real-world analogy',
      blocks: [
        { type: 'callout', tone: 'analogy', title: 'A team meeting, then desk work', text: 'Picture a project team. In the **meeting** (attention), everyone talks and each person collects the information they need from colleagues. Then everyone goes back to their **desk** (the FFN) and works alone: they think through what they heard, apply their own expertise and update their notes. No one talks at the desk, but this is where most of the actual thinking happens. A Transformer alternates meeting, desk, meeting, desk, layer after layer.' },
        { type: 'p', text: 'This split of jobs is the key idea of the lesson. **Attention mixes information across tokens.** **The FFN transforms information within each token.** Neither alone is enough: attention without FFNs is mostly weighted averaging, and FFNs without attention could never combine words.' },
      ],
    },
    {
      id: 'where-it-sits',
      title: 'Where does the FFN sit in a Transformer?',
      blocks: [
        { type: 'flow', title: 'One Transformer block (pre-norm style used by most modern LLMs)', nodes: [
          { label: 'Input x', detail: 'One vector per token, width d_model, coming from the previous block.' },
          { label: 'Norm + attention', detail: 'Normalize, then multi-head self-attention mixes information between tokens. The result is added back to x (residual connection).' },
          { label: 'Norm + FFN', detail: 'Normalize again, then the FFN processes each token independently. Its result is added back too.' },
          { label: 'Output', detail: 'Same shape as the input, ready for the next block. A model stacks dozens of these blocks.' },
        ] },
        { type: 'p', text: 'The **residual connection** (adding the input back to the output of each sub-layer) means the FFN does not replace the token vector. It computes an **update** that gets added on. You can think of each FFN as writing a small correction or new piece of information into a shared running "notepad" for that token.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How a feed-forward network works, step by step',
      blocks: [
        { type: 'steps', title: 'One token through the FFN', items: [
          { title: 'Take one token vector', text: 'After attention, token x is a vector of length d_model, e.g. 4,096 numbers that now include context from other tokens.' },
          { title: 'Expand', text: 'Multiply by W₁ (d_model × d_ff) to get d_ff hidden numbers, e.g. 11,008 or 16,384. Each hidden number is one learned "detector" scoring the token for some pattern.' },
          { title: 'Activate', text: 'Apply a non-linear function to every hidden number. ReLU zeroes the negatives, so only detectors that fired strongly stay on.' },
          { title: 'Contract', text: 'Multiply by W₂ (d_ff × d_model). Each active detector adds its own learned output vector, scaled by how strongly it fired.' },
          { title: 'Add back', text: 'The result is added to the token via the residual connection and passed on to the next layer.' },
        ] },
        { type: 'p', text: 'A tiny hand example with d_model = 2 and d_ff = 4. Let x = [x₁, x₂] = [2, 1], and suppose W₁ makes the four hidden units compute x₁, x₂, x₁ + x₂ and x₂ − x₁ (no biases). Then h = [2, 1, 3, −1]. ReLU keeps [2, 1, 3, 0]: the fourth detector is switched off. If W₂ has rows [1, 0], [0, 1], [1, 1] and [2, −1], the output is 2·[1, 0] + 1·[0, 1] + 3·[1, 1] + 0·[2, −1] = **[5, 4]**. Notice how the output is literally a weighted sum of W₂\'s rows, weighted by which detectors fired.' },
        { type: 'check', question: 'In the hand example, how would the output change if the fourth hidden value had been +1 instead of −1?', answer: 'ReLU would keep it, so we would add 1·[2, −1], giving [7, 3]. One more detector firing adds one more learned output vector.' },
      ],
    },
    {
      id: 'expand-then-contract',
      title: 'The expand-then-contract pattern, and why',
      blocks: [
        { type: 'p', text: 'The FFN first goes **wide** and then comes back **narrow**. In the original Transformer, d_model = 512 and d_ff = 2,048: four times wider. Many later models kept the 4× rule. Models using SwiGLU (below) have three weight matrices instead of two, so they use about 8/3 ≈ 2.7× to keep the parameter count similar; Llama 2 7B uses d_model = 4,096 and d_ff = 11,008.' },
        { type: 'p', text: 'Why expand? The hidden layer is where the "detectors" live. More hidden units means more distinct patterns the layer can recognize and more different output directions it can write. The non-linearity only helps if there is room for many units to be on or off independently. Why contract? Because the result must fit back into the d_model-wide residual stream that every layer shares, so blocks can be stacked.' },
        { type: 'p', text: 'There is also a hardware reason the expansion is cheap enough: the FFN is just two big matrix multiplications applied to all tokens at once, which is exactly what GPUs are best at.' },
      ],
    },
    {
      id: 'activations',
      title: 'ReLU and other activation functions',
      blocks: [
        { type: 'p', text: 'Without an activation function, W₂·(W₁·x) is just one matrix (W₂W₁) times x: two linear layers collapse into one linear layer, and stacking them adds no power. The **non-linear** activation is what lets the FFN represent "if this pattern, then that update" behaviour.' },
        { type: 'viz', name: 'neuron', caption: 'One hidden unit: inputs times weights plus bias, then an activation. Switch between ReLU, sigmoid and tanh to see how each shapes the output.' },
        { type: 'table', caption: 'Activations used in Transformer FFNs', head: ['Activation', 'Formula', 'Used by'], rows: [
          ['ReLU', 'max(0, z)', 'Original Transformer (2017)'],
          ['GELU', 'z·Φ(z), a smooth version of ReLU (Φ = Gaussian CDF)', 'BERT, GPT-2, GPT-3'],
          ['SwiGLU', '(SiLU(x·W_g) ⊙ (x·W_u))·W_d, with SiLU(z) = z·σ(z)', 'Llama family, Mistral, many recent LLMs'],
        ] },
        { type: 'p', text: '**SwiGLU** is a **gated** design (from Noam Shazeer\'s 2020 paper "GLU Variants Improve Transformer"). Instead of one expansion it computes two: a "gate" passed through SiLU, and an "up" projection. They are multiplied element by element (⊙), so the gate decides how much of each hidden unit gets through. Then a "down" projection contracts. It costs a third matrix but has worked better in practice.' },
      ],
    },
    {
      id: 'code',
      title: 'Code you can run',
      blocks: [
        { type: 'code', lang: 'python', title: 'ffn.py', code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)
rng = np.random.default_rng(1)

d_model, d_ff = 4, 16                     # expand 4x
x = rng.standard_normal((3, d_model))     # 3 tokens leaving attention

W1, b1 = rng.standard_normal((d_model, d_ff)) * 0.5, np.zeros(d_ff)
W2, b2 = rng.standard_normal((d_ff, d_model)) * 0.5, np.zeros(d_model)

relu = lambda z: np.maximum(0, z)
h = x @ W1 + b1                           # expand: (3, 4) -> (3, 16)
a = relu(h)                               # keep positives, zero the rest
y = a @ W2 + b2                           # contract: (3, 16) -> (3, 4)
print("hidden shape:", h.shape, " output shape:", y.shape)
print("active hidden units per token:", (a > 0).sum(axis=1), "of", d_ff)

# Each token is processed independently: same result one at a time
y_single = np.array([relu(t @ W1 + b1) @ W2 + b2 for t in x])
print("row-by-row equals batch:", np.allclose(y, y_single))

# SwiGLU variant (used by Llama-style models): gate * up, then down
silu = lambda z: z / (1 + np.exp(-z))
Wg, Wu = rng.standard_normal((d_model, d_ff)), rng.standard_normal((d_model, d_ff))
y_swiglu = (silu(x @ Wg) * (x @ Wu)) @ W2
print("SwiGLU output shape:", y_swiglu.shape)

# Parameter share in one Llama-2-7B-sized layer (d=4096, d_ff=11008)
d, f = 4096, 11008
attn, ffn = 4 * d * d, 3 * d * f
print(f"attention {attn/1e6:.1f}M, FFN {ffn/1e6:.1f}M, FFN share {ffn/(attn+ffn):.0%}")`,
          output: `hidden shape: (3, 16)  output shape: (3, 4)
active hidden units per token: [6 5 9] of 16
row-by-row equals batch: True
SwiGLU output shape: (3, 4)
attention 67.1M, FFN 135.3M, FFN share 67%`,
          walkthrough: [
            { lines: [5, 9], note: 'Three token vectors of width 4, and an FFN that expands to 16 hidden units and contracts back to 4.' },
            { lines: [11, 16], note: 'Expand, ReLU, contract. Each token switches on a different subset of the 16 detectors (6, 5 and 9 here).' },
            { lines: [18, 20], note: 'Processing tokens one at a time gives the identical result: the FFN never mixes information between tokens.' },
            { lines: [22, 26], note: 'SwiGLU: a SiLU-activated gate multiplies an "up" projection element-wise before the down projection.' },
            { lines: [28, 31], note: 'Parameter count for one layer at Llama 2 7B sizes: the FFN (three 4096 × 11008 matrices) holds about two thirds of the layer.' },
          ] },
      ],
    },
    {
      id: 'what-ffn-learns',
      title: 'What does the FFN actually learn?',
      blocks: [
        { type: 'p', text: 'A useful way to read the FFN is as a giant **key-value memory**. Each column of W₁ is a **key**: a pattern the hidden unit looks for in the token vector. Each row of W₂ is the matching **value**: the update written into the token when that pattern is found. The hand example showed exactly this: the output was a weighted sum of W₂ rows, chosen by which W₁ detectors fired.' },
        { type: 'p', text: 'Interpretability research supports this view. A 2021 paper by Geva and colleagues, "Transformer Feed-Forward Layers Are Key-Value Memories", found hidden units in trained models that fire on recognizable input patterns and push the prediction toward related output tokens. Other work has located and even edited specific factual associations (such as which city a landmark is in) mainly in mid-layer FFNs. This is why people often say **attention routes information while FFNs store knowledge**. Treat it as a helpful, well-supported simplification: knowledge is spread across many units and layers, and single neurons often respond to several unrelated things.' },
        { type: 'callout', tone: 'example', title: 'In our support-chatbot example', text: 'When the bot reads "my parcel from Berlin", attention lets "parcel" gather that the origin is "Berlin". Then FFN units that respond to "shipping from Germany" patterns can add an update nudging the model toward facts like EU shipping times. The meeting brought the facts together; the desk work recalled what to do with them.' },
      ],
    },
    {
      id: 'share-and-moe',
      title: 'How much of the model is the FFN, and FFNs in Mixture of Experts',
      blocks: [
        { type: 'chart', kind: 'bar', title: 'Parameters in one Llama 2 7B layer', yLabel: 'Millions of parameters', unit: 'M', labels: ['Attention (Q, K, V, O)', 'FFN (gate, up, down)'], series: [ { name: 'Parameters', values: [67.1, 135.3] } ], caption: 'Computed from published sizes: attention 4 × 4096², FFN 3 × 4096 × 11008. Norm weights are negligible.' },
        { type: 'p', text: 'The arithmetic is simple. Attention has four d_model × d_model matrices: 4d². A classic FFN with d_ff = 4d has two d × 4d matrices: 8d². So the FFN is about **two thirds** of each layer, and since layers dominate the model (embeddings aside), roughly two thirds of the whole model. For Llama 2 7B: 32 layers × (67.1M + 135.3M) ≈ 6.48B, plus about 0.26B of input and output embeddings, which gives the familiar ≈6.7B total.' },
        { type: 'p', text: 'This is why **Mixture of Experts (MoE)** targets the FFN. An MoE layer replaces the single FFN with several FFNs called **experts** plus a small **router** that sends each token to only a few of them (often the top 2). The model gains many more total parameters (more knowledge capacity) while each token only pays for the experts it uses. Mixtral 8x7B, for example, has 8 experts per layer with top-2 routing: about 47B parameters in total but only about 13B active per token. Attention stays shared.' },
        { type: 'compare', title: 'Dense FFN vs Mixture-of-Experts FFN', options: [
          { name: 'Dense FFN', summary: 'Every token goes through the same single FFN.', pros: ['Simple, stable training', 'Predictable memory and speed'], cons: ['Compute grows with every added parameter'], bestFor: 'Most small and mid-size models' },
          { name: 'MoE FFN', summary: 'A router sends each token to a few of many expert FFNs.', pros: ['Many more parameters for similar compute per token', 'Experts can specialize'], cons: ['All experts must still fit in memory', 'Routing adds load-balancing and serving complexity'], bestFor: 'Very large models where compute per token is the bottleneck' },
        ], rows: [
          ['Parameters used per token', 'All', 'Only the chosen experts'],
          ['Total parameters', 'Equal to used', 'Much larger than used'],
        ], verdict: 'MoE is a way to scale the FFN\'s knowledge capacity without scaling its per-token cost.' },
      ],
    },
    {
      id: 'importance-and-pitfalls',
      title: 'Why FFNs are so important, common mistakes and further resources',
      blocks: [
        { type: 'list', items: [
          '**Non-linearity:** attention\'s weighted average is mostly linear in V; FFNs supply most of the model\'s non-linear computation.',
          '**Capacity:** they hold the majority of parameters, so they are where most learned knowledge can live.',
          '**Efficiency:** they are pure per-token matrix multiplications, easy to parallelize, quantize and shard.',
          '**Scaling lever:** MoE turns the FFN into the main way to grow model capacity cheaply.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Thinking the FFN mixes tokens (it never does; only attention does). Forgetting that SwiGLU needs three matrices, so a 4× hidden size would add about 50% more FFN parameters than intended. Assuming "FFNs store facts" means you can find one neuron per fact; knowledge is distributed. And estimating memory from attention alone: when sizing or quantizing a model, the FFN weights are the biggest block.' },
        { type: 'check', question: 'A layer has d_model = 2,048 and a classic 2-matrix FFN with d_ff = 8,192. How many FFN weight parameters is that, compared with attention\'s 4·d²?', answer: 'FFN: 2 × 2,048 × 8,192 ≈ 33.6M. Attention: 4 × 2,048² ≈ 16.8M. The FFN is twice the attention, i.e. two thirds of the layer.' },
      ],
    },
    {
      id: "worked-example-absolute-value",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "We said two linear layers without an activation collapse into one. Let us watch that happen, and then watch ReLU prevent it, on the smallest FFN we can build. The input is a single number x. The hidden layer has two units. The goal is to output |x|, the size of x without its sign. No single linear layer can do this, because a straight line cannot bend at zero." },
        { type: "steps", title: "A two-unit FFN that computes |x|", items: [
          { title: "Expand", text: "W₁ = [1, −1], no bias. The hidden values are h = [x, −x]. One unit looks for “x is positive”, the other for “x is negative”." },
          { title: "Activate", text: "ReLU keeps the positive one and zeroes the other. For x = 3: [3, −3] → [3, 0]. For x = −2: [−2, 2] → [0, 2]." },
          { title: "Contract", text: "W₂ = [1, 1]: add the two hidden values. For x = 3 the output is 3 + 0 = 3. For x = −2 it is 0 + 2 = 2." },
          { title: "Remove ReLU and try again", text: "Now the output is x + (−x) = 0 for every input. The two matrices have collapsed into the single number W₂·W₁ = 1·1 + 1·(−1) = 0." },
        ] },
        { type: "table", caption: "The same two matrices, with and without the activation.", head: ["x", "Hidden h = [x, −x]", "After ReLU", "Output with ReLU", "Output without ReLU"], rows: [
          ["−2", "[−2, 2]", "[0, 2]", "2", "0"],
          ["−1", "[−1, 1]", "[0, 1]", "1", "0"],
          ["0", "[0, 0]", "[0, 0]", "0", "0"],
          ["1", "[1, −1]", "[1, 0]", "1", "0"],
          ["3", "[3, −3]", "[3, 0]", "3", "0"],
        ] },
        { type: "chart", kind: "line", title: "Output of the two-unit FFN", xLabel: "Input x", yLabel: "Output", series: [ { name: "With ReLU", points: [[-3, 3], [-2, 2], [-1, 1], [0, 0], [1, 1], [2, 2], [3, 3]] }, { name: "Without ReLU", points: [[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0]] } ], caption: "Computed by hand from W₁ = [1, −1] and W₂ = [1, 1]. ReLU adds one bend, at x = 0." },
        { type: "p", text: "Each hidden ReLU unit can add one bend like this. A bias moves the bend: ReLU(x − 1) stays at zero until x passes 1. So with many hidden units, the FFN can put many bends in many places and build a detailed shape out of straight pieces. This is the plain reason for the wide hidden layer: more units, more bends, more distinct cases the layer can treat differently." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a tiny key-value memory by hand. Two hidden units each detect a *combination* of features (“mentions Paris **and** asks for a country”) and write an answer. The trick that makes “and” work is a negative bias followed by ReLU." },
        { type: "code", lang: "python", title: "practice_ffn_memory.py", code: `import numpy as np

# Token features (illustrative): [mentions_paris, mentions_berlin, asks_country]
names = ["Paris + country?", "Berlin + country?", "Paris only", "country? only"]
X = np.array([[1, 0, 1],
              [0, 1, 1],
              [1, 0, 0],
              [0, 0, 1]], dtype=float)

# W1 columns are KEYS: the pattern each hidden unit looks for
W1 = np.array([[1, 0],
               [0, 1],
               [1, 1]], dtype=float)
b1 = np.array([-1.5, -1.5])   # a unit only fires if BOTH of its features are on

# W2 rows are VALUES: what each unit writes. Output dims: [france, germany]
W2 = np.array([[2, 0],
               [0, 2]], dtype=float)

h = X @ W1 + b1               # detector scores
a = np.maximum(0, h)          # ReLU switches weak matches off
y = a @ W2                    # each active unit writes its value

for name, hi, ai, yi in zip(names, h, a, y):
    print(f"{name:17s} hidden={hi}  after ReLU={ai}  writes={yi}")

# Without ReLU, partial matches leak through as unwanted writes
print("no ReLU, 'Paris only' writes:", (X[2] @ W1 + b1) @ W2)`, output: `Paris + country?  hidden=[ 0.5 -0.5]  after ReLU=[0.5 0. ]  writes=[1. 0.]
Berlin + country? hidden=[-0.5  0.5]  after ReLU=[0.  0.5]  writes=[0. 1.]
Paris only        hidden=[-0.5 -1.5]  after ReLU=[0. 0.]  writes=[0. 0.]
country? only     hidden=[-0.5 -0.5]  after ReLU=[0. 0.]  writes=[0. 0.]
no ReLU, 'Paris only' writes: [-1. -3.]`,
          walkthrough: [
            { lines: [3, 8], note: "Four token vectors with three made-up yes/no features. Only the first two contain a full question." },
            { lines: [10, 18], note: "The keys (columns of W₁) say which features each unit adds up. The bias of −1.5 means one feature alone (score 1) is not enough; two together (score 2) are. The values (rows of W₂) say what to write." },
            { lines: [20, 22], note: "Expand, ReLU, contract. A full match gives a hidden value of 0.5, which W₂ turns into a write of 1." },
            { lines: [24, 28], note: "Only the two complete questions write an answer. The last line shows that without ReLU, a half match would write negative numbers into the token." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Set `b1` to `[0.0, 0.0]`. Predict first: which of the four rows now write something, and what does “country? only” write?",
          "Add a fifth token `[1, 1, 1]` (mentions both cities and asks for a country), with a name. Predict what it writes.",
          "Change the first row of `W2` to `[2, -2]`, so the Paris unit also pushes “germany” down. Predict the write for “Paris + country?”.",
        ] },
        { type: "check", question: "“Paris only” and “country? only” both get negative hidden values and write nothing. What job is the bias of −1.5 doing, and what would be lost with a bias of 0?", answer: "The bias sets a threshold. Each present feature adds 1, so one feature gives 1 − 1.5 = −0.5 (off after ReLU) and two give 2 − 1.5 = 0.5 (on). That turns a sum into an “and”. With a bias of 0, a single feature would already fire the unit: “Paris only” would write “france”, and “country? only” would write both countries. The unit would no longer detect the combination." },
        { type: "check", question: "The |x| network has 2 hidden units and one bend. Our memory has 2 hidden units and stores 2 facts. What does this suggest about why real FFNs use thousands of hidden units per layer?", answer: "Each hidden unit is one detector with one thing to write, or seen as a shape, one bend. Two units can hold about two simple cases. To react differently to a huge variety of token patterns, the layer needs a huge number of detectors, so the hidden layer is made several times wider than the token vector. In real models units are not this tidy and facts are spread over many units, but the capacity argument is the same." },
      ],
    },
  ],
  quiz: [
    { q: 'What is the main difference between what attention does and what the FFN does in a Transformer block?', options: ['Attention processes each token alone, while the FFN mixes information across tokens', 'Attention moves information between tokens; the FFN works on each token alone', 'Both mix information across tokens, but the FFN does it under a causal mask', 'The FFN is only used during training and is skipped when generating text'], answer: 1, explain: 'Attention is the "meeting" that exchanges information between positions. The FFN is the "desk work": the same network applied to each token on its own.' },
    { q: 'Why does the FFN need a non-linear activation between its two matrices?', options: ['To turn the FFN output into a probability distribution over the whole vocabulary', 'To stop each token from seeing information from tokens that come later', 'Without it, the two linear layers would collapse into one equivalent matrix', 'To cut the number of parameters by zeroing out half of the hidden units'], answer: 2, explain: 'W₂(W₁x) equals (W₂W₁)x, a single matrix. The activation lets hidden units switch on and off, enabling non-linear behaviour.' },
    { q: 'A layer has d_model = 4,096 and a SwiGLU FFN with d_ff = 11,008. How many FFN weight parameters does it have?', options: ['About 135M (3 × 4,096 × 11,008)', 'About 90M (2 × 4,096 × 11,008)', 'About 67M (4 × 4,096²)', 'About 45M (4,096 × 11,008)'], answer: 0, explain: 'SwiGLU uses three matrices (gate, up, down), each 4,096 × 11,008 in size: about 135.3M. 67M is the attention block.' },
    { q: 'Your team wants a model with far more knowledge capacity but almost the same compute per token. Which change targets the right component?', options: ['Add many more attention heads so each layer has more room to store facts', 'Widen every FFN fourfold so each layer can store far more knowledge', 'Remove the residual connections so each layer can hold more of its own information', 'Turn each FFN into a Mixture of Experts, using only a few experts per token'], answer: 3, explain: 'MoE splits the FFN, where most parameters live, into experts and routes each token to a few, growing total parameters without growing per-token compute much.' },
    { q: 'Which statement about FFNs is a misconception?', options: ['FFNs hold roughly two thirds of the parameters in a typical dense LLM layer', 'Each known fact sits in exactly one FFN neuron that can be found and read directly', 'The FFN applies the same weights at every token position in the sequence', 'The FFN\'s output is added back to each token\'s vector through a residual connection'], answer: 1, explain: 'Research supports FFNs acting like key-value memories, but knowledge is distributed over many units and layers, and single neurons often respond to several things.' },
  ],
  takeaways: [
    'Each Transformer block pairs attention (mixes tokens) with an FFN (processes each token alone).',
    'The FFN expands to a wider hidden layer, applies a non-linearity, then contracts back to d_model.',
    'Modern LLMs use GELU or gated SwiGLU instead of ReLU; SwiGLU uses three matrices and about 8/3× expansion.',
    'FFNs hold about two thirds of a dense model\'s parameters and behave like learned key-value memories.',
    'Mixture of Experts splits the FFN into experts so capacity grows faster than per-token compute.',
  ],
  terms: [
    { term: 'Feed-forward network (FFN)', def: 'A network where data flows one way through layers; in Transformers, a two-layer MLP applied to each token.' },
    { term: 'd_ff', def: 'The width of the FFN\'s hidden layer, usually several times d_model.' },
    { term: 'Activation function', def: 'A non-linear function such as ReLU, GELU or SiLU applied to each hidden value.' },
    { term: 'SwiGLU', def: 'A gated FFN variant: a SiLU-activated gate multiplies an up projection before the down projection.' },
    { term: 'Residual connection', def: 'Adding a sub-layer\'s input to its output, so each sub-layer writes an update.' },
    { term: 'Mixture of Experts (MoE)', def: 'Replacing one FFN with many expert FFNs and a router that picks a few per token.' },
  ],
};
