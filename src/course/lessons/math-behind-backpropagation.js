export default {
  id: 'math-behind-backpropagation',
  minutes: 27,
  hook: 'Gradient descent needs the slope of the loss for every single weight, so how does a network with millions of weights get all of them from one backward sweep?',
  summary: 'Backpropagation is the algorithm that computes the gradient of the loss with respect to every weight in a neural network. It runs a forward pass to get the prediction and loss, then walks backwards layer by layer, using the chain rule to pass an error signal from the output towards the input. Gradient descent then uses those gradients to update the weights.',
  sections: [
    {
      id: 'what-is-backprop',
      title: 'What is backpropagation?',
      blocks: [
        { type: 'p', text: 'In the previous lesson, gradient descent updated each parameter with `θ ← θ − η · ∂L/∂θ`. For a two-parameter line we could write the gradients by hand. A neural network, though, is a long chain of layers, and a weight in the first layer affects the loss only *indirectly*, through every layer after it. We need a systematic way to get `∂L/∂w` for every weight.' },
        { type: 'p', text: '**Backpropagation** (short for "backward propagation of errors") is that way. It is not a learning rule by itself. It is an efficient method for **computing gradients**. The learning happens when gradient descent (or Adam, etc.) uses those gradients. The two together are what people usually mean by "training a neural network".' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like tracing blame in a relay team', text: 'A relay team finishes 4 seconds late. The coach starts at the finish line and works backwards: the last runner was 1 second slow; they were also handed the baton late, so some blame passes to the third runner, and so on. Each runner\'s share of the blame depends on how much their part affected the next runner. Backpropagation assigns blame for the loss to every weight in the same backward way.' },
        { type: 'p', text: 'The key reason it works efficiently: the gradients of early layers reuse the gradients already computed for later layers. One backward sweep costs roughly as much as one or two forward passes, no matter how many weights there are. Without this reuse, training today\'s large networks would be hopeless.' },
      ],
    },
    {
      id: 'chain-rule',
      title: 'The chain rule of calculus',
      blocks: [
        { type: 'p', text: 'Backpropagation is the **chain rule** applied over and over. The chain rule says how to differentiate a function of a function. If `y` depends on `u`, and `u` depends on `x`, then a small change in `x` changes `u`, which changes `y`. The rates multiply:' },
        { type: 'formula', expr: 'dy/dx = (dy/du) · (du/dx)', where: [['dy/du', 'how fast y changes when u changes'], ['du/dx', 'how fast u changes when x changes']], caption: 'Rates of change multiply along a chain.' },
        { type: 'p', text: 'Small example: `y = (3x + 1)²`. Let `u = 3x + 1`, so `y = u²`. Then `dy/du = 2u` and `du/dx = 3`, which gives `dy/dx = 2u · 3 = 6(3x + 1)`. At `x = 1`: `u = 4`, so `dy/dx = 24`. Check: nudging x from 1 to 1.001 changes y from 16 to about 16.024, a change of 0.024 for 0.001, i.e. a rate of 24.' },
        { type: 'p', text: 'A neural network is just a longer chain: input → weighted sum → activation → weighted sum → activation → ... → loss. So `∂L/∂w` for any weight is a product of local derivatives along the path from that weight to the loss. When a value feeds into several later values, we **add** the contributions from each path (the multivariable chain rule).' },
        { type: 'check', question: 'If L = u² and u = 5w, what is dL/dw when w = 2?', answer: 'u = 10, dL/du = 2u = 20, du/dw = 5, so dL/dw = 20 × 5 = **100**.' },
      ],
    },
    {
      id: 'forward-pass',
      title: 'Forward pass',
      blocks: [
        { type: 'p', text: 'We will use a deliberately tiny network so every number fits on screen: one input, one hidden neuron with a sigmoid activation, and one linear output neuron. The **sigmoid** is `σ(z) = 1 / (1 + e⁻ᶻ)`, an S-shaped function that squashes any number into the range 0 to 1.' },
        { type: 'formula', expr: 'z₁ = w₁·x + b₁     h = σ(z₁)     ŷ = w₂·h + b₂     L = (ŷ − y)²', where: [['x, y', 'the input and the true target'], ['w₁, b₁', 'weight and bias of the hidden neuron'], ['h', 'the hidden activation'], ['w₂, b₂', 'weight and bias of the output neuron'], ['ŷ', 'the prediction'], ['L', 'squared-error loss']] },
        { type: 'p', text: 'The **forward pass** computes these from left to right. Our numbers: `x = 1`, target `y = 1`, and starting parameters `w₁ = 0.5`, `b₁ = 0`, `w₂ = 1.0`, `b₂ = 0`.' },
        { type: 'list', ordered: true, items: [
          '`z₁ = 0.5 × 1 + 0 = 0.5`',
          '`h = σ(0.5) = 0.6225`',
          '`ŷ = 1.0 × 0.6225 + 0 = 0.6225`',
        ] },
        { type: 'p', text: 'Crucially, the forward pass **stores** the intermediate values `z₁`, `h` and `ŷ`. The backward pass will need them. This is why training uses more memory than just running a model: all those activations must be kept until the gradients are computed.' },
      ],
    },
    {
      id: 'loss-calculation',
      title: 'Loss calculation',
      blocks: [
        { type: 'p', text: 'The **loss** compares the prediction with the truth. With squared error: `L = (0.6225 − 1)² = (−0.3775)² = 0.1425`. In a real network we average this over a mini-batch; for classification we would use cross-entropy instead (next lesson). Backpropagation works the same way for any differentiable loss; only the very first derivative `∂L/∂ŷ` changes.' },
        { type: 'p', text: 'The derivative of the loss with respect to the prediction is the starting point of the backward pass: `∂L/∂ŷ = 2(ŷ − y) = 2 × (−0.3775) = −0.7551`. It is negative, which tells us that increasing `ŷ` would lower the loss. That makes sense: the prediction 0.62 is too low compared with the target 1.' },
      ],
    },
    {
      id: 'backward-pass',
      title: 'Backward pass (backpropagation)',
      blocks: [
        { type: 'p', text: 'Now we walk from the loss back to the inputs. At each node we multiply the gradient arriving from above by the node\'s **local derivative**: how its output changes with its own input. We call the gradient arriving at a value its **error signal**, often written `δ` (delta).' },
        { type: 'steps', title: 'The backward pass for our tiny network', items: [
          { title: 'Start at the loss', text: '`∂L/∂ŷ = 2(ŷ − y)`. This is the error signal at the output.' },
          { title: 'Output layer parameters', text: 'Since `ŷ = w₂·h + b₂`: `∂ŷ/∂w₂ = h` and `∂ŷ/∂b₂ = 1`. So `∂L/∂w₂ = ∂L/∂ŷ · h` and `∂L/∂b₂ = ∂L/∂ŷ`.' },
          { title: 'Pass the error to the hidden layer', text: '`∂ŷ/∂h = w₂`, so `∂L/∂h = ∂L/∂ŷ · w₂`. The weight that carried the signal forward now carries the blame backward.' },
          { title: 'Through the activation', text: 'The sigmoid has the handy derivative `σ\'(z) = σ(z)(1 − σ(z)) = h(1 − h)`. So `∂L/∂z₁ = ∂L/∂h · h(1 − h)`.' },
          { title: 'Hidden layer parameters', text: '`∂z₁/∂w₁ = x` and `∂z₁/∂b₁ = 1`. So `∂L/∂w₁ = ∂L/∂z₁ · x` and `∂L/∂b₁ = ∂L/∂z₁`.' },
        ] },
        { type: 'flow', title: 'Forward values go right, gradients come back left', nodes: [
          { label: 'x', detail: 'Input. Forward: x = 1. Backward: ∂L/∂w₁ = ∂L/∂z₁ · x.' },
          { label: 'z₁ = w₁x + b₁', detail: 'Forward: 0.5. Backward: ∂L/∂z₁ = ∂L/∂h · h(1 − h) = −0.1774.' },
          { label: 'h = σ(z₁)', detail: 'Forward: 0.6225. Backward: ∂L/∂h = ∂L/∂ŷ · w₂ = −0.7551.' },
          { label: 'ŷ = w₂h + b₂', detail: 'Forward: 0.6225. Backward: ∂L/∂ŷ = 2(ŷ − y) = −0.7551.' },
          { label: 'L = (ŷ − y)²', detail: 'Forward: 0.1425. The backward pass starts here with dL/dL = 1.' },
        ] },
        { type: 'p', text: 'Notice the pattern. Every gradient for a weight is **(error signal at the layer\'s output) × (the input that weight multiplied)**. And the error signal for the previous layer is **(error signal) × (weight) × (activation derivative)**. In matrix form for a whole layer, that becomes `∂L/∂W = inputᵀ · δ` and `δ_prev = (δ · Wᵀ) ⊙ f\'(z_prev)`, where `⊙` means element-wise multiplication.' },
      ],
    },
    {
      id: 'numeric-example',
      title: 'Step-by-step numeric example',
      blocks: [
        { type: 'p', text: 'Plugging in our numbers (`x = 1`, `y = 1`, `h = ŷ = 0.6225`, `w₂ = 1.0`):' },
        { type: 'table', caption: 'Backward pass, computed exactly (rounded to 4 decimals)', head: ['Quantity', 'Formula', 'Value'], rows: [
          ['∂L/∂ŷ', '2(ŷ − y) = 2(0.6225 − 1)', '−0.7551'],
          ['∂L/∂w₂', '∂L/∂ŷ · h = −0.7551 × 0.6225', '−0.4700'],
          ['∂L/∂b₂', '∂L/∂ŷ · 1', '−0.7551'],
          ['∂L/∂h', '∂L/∂ŷ · w₂ = −0.7551 × 1.0', '−0.7551'],
          ['σ\'(z₁)', 'h(1 − h) = 0.6225 × 0.3775', '0.2350'],
          ['∂L/∂z₁', '∂L/∂h · σ\'(z₁) = −0.7551 × 0.2350', '−0.1774'],
          ['∂L/∂w₁', '∂L/∂z₁ · x = −0.1774 × 1', '−0.1774'],
          ['∂L/∂b₁', '∂L/∂z₁ · 1', '−0.1774'],
        ] },
        { type: 'p', text: 'All gradients are negative, so gradient descent will **increase** all four parameters, pushing the prediction up towards 1. Also notice that the hidden-layer gradients (−0.18) are much smaller than the output-layer ones. The sigmoid\'s derivative is at most 0.25, so each sigmoid layer shrinks the error signal by at least 4×. Stack many of them and early layers get almost no gradient: the **vanishing gradient problem**, one big reason modern networks prefer ReLU-style activations, normalisation and residual connections.' },
        { type: 'check', question: 'If w₂ had been 0 instead of 1.0, what would ∂L/∂w₁ be? Why?', answer: '**Zero.** ∂L/∂h = ∂L/∂ŷ · w₂ = 0, so no error signal reaches the hidden layer. If the output ignores h, changing w₁ cannot affect the loss. This is also why we never initialise all weights to zero.' },
      ],
    },
    {
      id: 'weight-update',
      title: 'Weight update using gradient descent',
      blocks: [
        { type: 'p', text: 'With the gradients in hand, we apply the gradient descent rule to every parameter at once. Using a learning rate `η = 0.5`:' },
        { type: 'list', items: [
          '`w₁ = 0.5 − 0.5 × (−0.1774) = 0.5887`',
          '`b₁ = 0 − 0.5 × (−0.1774) = 0.0887`',
          '`w₂ = 1.0 − 0.5 × (−0.4700) = 1.2350`',
          '`b₂ = 0 − 0.5 × (−0.7551) = 0.3775`',
        ] },
        { type: 'p', text: 'Running the forward pass again with these new values gives `ŷ ≈ 1.1966` and a loss of about `0.0386`, down from `0.1425`. The prediction has actually overshot past 1 (this learning rate is large for one example), but the loss has still dropped by almost 4×. The next step would pull it back. Training is simply this cycle, forward, loss, backward, update, repeated thousands or millions of times.' },
        { type: 'viz', name: 'gradient-descent', caption: 'Backprop supplies the slope; gradient descent takes the step. Try a few learning rates and notice how an overly large step overshoots, just like our update did.' },
      ],
    },
    {
      id: 'python',
      title: 'Backpropagation in Python',
      blocks: [
        { type: 'p', text: 'Now a real (still small) network: 2 inputs, 4 hidden tanh neurons, 1 sigmoid output, trained on **XOR**: output 1 when exactly one input is 1. XOR is the classic problem a single neuron cannot solve, so the hidden layer and therefore backprop are essential. We also do a **gradient check**: compare one backprop gradient with a numerical estimate from nudging the weight.' },
        { type: 'code', lang: 'python', title: 'backprop_xor.py', code: `import numpy as np

rng = np.random.default_rng(42)
X = np.array([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])   # 4 examples, 2 features
y = np.array([[0.], [1.], [1.], [0.]])                    # XOR targets
W1, b1 = rng.normal(0, 1, (2, 4)), np.zeros(4)            # input -> 4 hidden
W2, b2 = rng.normal(0, 1, (4, 1)), np.zeros(1)            # hidden -> 1 output
sigmoid = lambda z: 1 / (1 + np.exp(-z))

def forward(W1, b1, W2, b2):
    h = np.tanh(X @ W1 + b1)            # hidden layer
    y_hat = sigmoid(h @ W2 + b2)        # output probability
    return h, y_hat, np.mean((y_hat - y) ** 2)

lr = 2.0
for step in range(3001):
    h, y_hat, loss = forward(W1, b1, W2, b2)
    # ---- backward pass: chain rule, from the loss back to each weight ----
    d_yhat = 2 * (y_hat - y) / len(X)          # dL/dŷ
    d_z2 = d_yhat * y_hat * (1 - y_hat)         # through sigmoid: σ' = σ(1-σ)
    dW2, db2 = h.T @ d_z2, d_z2.sum(0)
    d_h = d_z2 @ W2.T                           # send the error back to hidden
    d_z1 = d_h * (1 - h ** 2)                   # through tanh: tanh' = 1 - tanh²
    dW1, db1 = X.T @ d_z1, d_z1.sum(0)
    if step == 0:   # check one gradient numerically: (L(w+ε) - L(w-ε)) / 2ε
        eps, Wp, Wm = 1e-5, W1.copy(), W1.copy()
        Wp[1, 2] += eps; Wm[1, 2] -= eps
        num = (forward(Wp, b1, W2, b2)[2] - forward(Wm, b1, W2, b2)[2]) / (2 * eps)
        print(f"backprop dL/dW1[1,2]={dW1[1, 2]:.6f}  numerical={num:.6f}")
    W1 -= lr * dW1; b1 -= lr * db1; W2 -= lr * dW2; b2 -= lr * db2
    if step % 1000 == 0:
        print(f"step {step:4d}  loss={loss:.4f}")

print("predictions:", forward(W1, b1, W2, b2)[1].ravel().round(3))`, output: `backprop dL/dW1[1,2]=-0.012556  numerical=-0.012556
step    0  loss=0.2874
step 1000  loss=0.0004
step 2000  loss=0.0002
step 3000  loss=0.0001
predictions: [0.005 0.988 0.99  0.013]`, walkthrough: [
          { lines: [3, 8], note: 'The XOR dataset and random initial weights. Weights must be random (not all zero) so hidden neurons learn different things.' },
          { lines: [10, 13], note: 'Forward pass. It returns the hidden activations h because the backward pass needs them.' },
          { lines: [19, 21], note: 'Output layer: start from dL/dŷ, pass through the sigmoid derivative, then dW2 = hᵀ·δ (input times error signal).' },
          { lines: [22, 24], note: 'Hidden layer: send the error back through W2, multiply by the tanh derivative, then dW1 = Xᵀ·δ. Same pattern, one layer earlier.' },
          { lines: [25, 29], note: 'Gradient check: nudge one weight by ±ε, measure how the loss changes, and compare. They match to 6 decimals, so the backprop math is right.' },
          { lines: [30, 32], note: 'Gradient descent update for all parameters, then log the loss.' },
          { lines: [34, 34], note: 'After training, predictions are close to the XOR targets 0, 1, 1, 0.' },
        ] },
        { type: 'chart', kind: 'line', title: 'XOR training loss (from the run above)', xLabel: 'Step', yLabel: 'MSE loss', series: [
          { name: 'Loss', points: [[0, 0.2874], [1000, 0.0004], [2000, 0.0002], [3000, 0.0001]] },
        ], caption: 'Measured values printed by the script. Most of the improvement happens early.' },
        { type: 'callout', tone: 'tip', title: 'Gradient checking', text: 'When you write backprop by hand, always compare a few gradients against the numerical estimate `(L(w + ε) − L(w − ε)) / 2ε`. It is far too slow for training (two forward passes per weight) but perfect for catching bugs. Frameworks like PyTorch do the backward pass automatically, so you rarely need this outside custom code.' },
      ],
    },
    {
      id: 'compare-and-pitfalls',
      title: 'Alternatives, real-world use and pitfalls',
      blocks: [
        { type: 'compare', title: 'Ways to get gradients', options: [
          { name: 'Numerical (finite differences)', summary: 'Nudge each weight, re-run the network, measure the loss change.', pros: ['Trivial to write', 'Great for checking'], cons: ['Two forward passes per weight: hopeless for millions of weights', 'Approximate'], bestFor: 'Debugging hand-written gradients' },
          { name: 'Backpropagation', summary: 'One forward pass, then one backward sweep using the chain rule and stored activations.', pros: ['All gradients for about the cost of 1–2 forward passes', 'Exact (up to floating point)'], cons: ['Must store activations: memory heavy', 'Hand-deriving is error-prone'], bestFor: 'Training any neural network' },
          { name: 'Automatic differentiation (autograd)', summary: 'A framework records operations and runs backprop for you.', pros: ['No manual derivatives', 'Works for any composition of supported ops'], cons: ['Less visible: bugs can hide in shapes or detached tensors'], bestFor: 'Everyday work in PyTorch, TensorFlow, JAX' },
        ], verdict: 'Autograd is backpropagation, automated. Knowing the manual version helps you debug it.' },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'Every model you will meet in this course, from image classifiers to large language models, was trained with backpropagation. In PyTorch, `loss.backward()` runs exactly the backward pass we did by hand, over every operation in the network, and stores each parameter\'s gradient in its `.grad` attribute.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Initialising all weights to the same value (every hidden neuron then gets identical gradients and they never become different). Forgetting that sigmoid/tanh derivatives shrink the signal, causing vanishing gradients in deep stacks. Letting gradients explode in very deep or recurrent networks (fixed with gradient clipping, normalisation and careful initialisation). And confusing backprop (computing gradients) with the optimiser (using them).' },
      ],
    },
    {
      id: 'two-paths-example',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'Our tiny network was a single chain: each value fed exactly one later value. We said that when a value feeds **several** later values we add the contributions. Let us work one such case by hand, because this is where hand-written backprop most often goes wrong.' },
        { type: 'p', text: 'Take one weight `w = 3` and one input `x = 2`. The weight is used twice: `u = w·x` and `v = w²`. The loss is their product, `L = u·v`. So `w` reaches the loss along two paths, one through `u` and one through `v`.' },
        { type: 'steps', title: 'Backprop when a weight is used twice', items: [
          { title: 'Forward pass', text: '`u = 3·2 = 6`, `v = 3² = 9`, `L = 6·9 = 54`. We store `u` and `v`.' },
          { title: 'Start at the loss', text: 'For a product, each factor\'s gradient is the *other* factor: `∂L/∂u = v = 9` and `∂L/∂v = u = 6`.' },
          { title: 'Path through u', text: '`∂u/∂w = x = 2`, so this path gives `9 · 2 = 18`.' },
          { title: 'Path through v', text: '`∂v/∂w = 2w = 6`, so this path gives `6 · 6 = 36`.' },
          { title: 'Add the paths', text: '`∂L/∂w = 18 + 36 = 54`. Check with plain calculus: `L = w³·x`, so `dL/dw = 3w²·x = 3·9·2 = 54`. They agree.' },
        ] },
        { type: 'table', caption: 'What each choice would give for ∂L/∂w', head: ['What we do with the two paths', 'Result', 'Correct?'], rows: [
          ['Add them', '18 + 36 = 54', 'Yes'],
          ['Keep only the last one computed', '36', 'No: the path through u is lost'],
          ['Multiply them', '18 × 36 = 648', 'No: we multiply *along* a path, never across paths'],
        ] },
        { type: 'p', text: 'The rule to remember: **multiply along a path, add across paths**. This matters far beyond toy examples. A recurrent network uses the same weights at every time step, so each weight\'s gradient is a sum over all the steps. A residual connection sends a value down two routes that meet again. In all these cases the gradients must be **accumulated** with `+=`, not overwritten with `=`. A bug of this kind is silent: the code runs, the loss may even fall a little, and only a gradient check reveals it.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will measure the vanishing gradient ourselves. We build a chain of one-neuron layers, run backprop by hand, and print the gradient that reaches the **first** weight as the chain gets deeper. We do it once with sigmoid and once with ReLU.' },
        { type: 'code', lang: 'python', title: 'practice_gradient_depth.py', code: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

ACTS = {
    "sigmoid": (sigmoid, lambda z: sigmoid(z) * (1 - sigmoid(z))),
    "relu": (lambda z: max(0.0, z), lambda z: 1.0 if z > 0 else 0.0),
}

def first_weight_gradient(depth, name, x=1.0, w=1.0):
    act, d_act = ACTS[name]
    # Forward pass: h_k = act(w * h_(k-1)), and the loss is the last h.
    zs, hs = [], [x]
    for _ in range(depth):
        zs.append(w * hs[-1])
        hs.append(act(zs[-1]))
    # Backward pass: start with dL/dh_last = 1 and walk towards the input.
    delta = 1.0
    for k in reversed(range(depth)):
        delta *= d_act(zs[k])          # through the activation
        if k == 0:
            return delta * hs[0]       # dL/dw of the first layer
        delta *= w                     # through the weight to the layer below

print("depth   sigmoid chain   relu chain")
for depth in (1, 2, 4, 8, 16):
    gs = first_weight_gradient(depth, "sigmoid")
    gr = first_weight_gradient(depth, "relu")
    print(f"{depth:5d}   {gs:13.2e}   {gr:10.2f}")`, output: `depth   sigmoid chain   relu chain
    1        1.97e-01         1.00
    2        4.31e-02         1.00
    4        2.16e-03         1.00
    8        5.52e-06         1.00
   16        3.58e-11         1.00`, walkthrough: [
          { lines: [6, 9], note: 'Each activation comes as a pair: the function and its derivative. Sigmoid uses σ(z)(1 − σ(z)); ReLU uses 1 for positive z and 0 otherwise.' },
          { lines: [13, 17], note: 'Forward pass through `depth` layers. Every layer uses the weight `w`. We store each pre-activation `z` and each output `h`, because the backward pass needs them.' },
          { lines: [18, 24], note: 'Backward pass. At each layer the error signal is multiplied by the activation derivative, then by the weight. At the first layer we multiply by its input to get the weight gradient.' },
          { lines: [26, 30], note: 'With sigmoid the gradient shrinks from 0.197 at depth 1 to about 0.00000000004 at depth 16. With ReLU (and positive values) it stays at exactly 1.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Call the function with `w=4.0` for both chains. Larger weights multiply the signal on the way back. Predict whether that rescues the sigmoid chain, and what it does to the ReLU chain at depth 16.',
          'Call it with `x=-1.0`. Predict the ReLU gradient at every depth before you run it, and name the problem this shows.',
          'Add a third activation, tanh, whose derivative is `1 - math.tanh(z) ** 2`. Predict whether its gradients at depth 16 land closer to the sigmoid column or to the ReLU column.',
        ] },
        { type: 'check', question: 'At depth 2 the sigmoid gradient is 0.0431, yet the lesson said each sigmoid layer can pass on up to 0.25 of the signal, which would allow 0.25 × 0.25 = 0.0625. Why is the real number smaller?', answer: 'The derivative σ\'(z) equals 0.25 only at z = 0. Here the pre-activations are 1.0 and about 0.73, where the derivative is about 0.197 and 0.219. Their product is 0.0431. So 0.25 is a best case; real layers usually pass on less, and the further z is from zero, the less gets through.' },
        { type: 'check', question: 'The ReLU column is exactly 1.00 at every depth. Does that mean ReLU networks can never have gradient problems?', answer: 'No. It is 1.00 here because every pre-activation is positive (derivative 1) and every weight is 1. If any layer\'s pre-activation is negative, its derivative is 0 and the whole product becomes 0: a dead path. And if the weights are larger than 1, the product grows with depth instead: an exploding gradient. ReLU removes the shrinking caused by the activation, not the effect of the weights.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does backpropagation compute?', options: ['The best learning rate for each layer, found by searching the loss', 'The network\'s prediction for a new input, passed from layer to layer', 'The gradient of the loss for every parameter, via the chain rule', 'A random subset of weights to switch off for each training step'], answer: 2, explain: 'Backprop only computes gradients. The prediction comes from the forward pass, the learning rate is chosen by us, and dropping weights is dropout. An optimiser such as gradient descent then uses the gradients.' },
    { q: 'In our tiny network, ∂L/∂ŷ = −0.8, h = 0.5 and w₂ = 2. What is ∂L/∂w₂?', options: ['−1.6', '0.5', '−0.8', '−0.4'], answer: 3, explain: 'Since ŷ = w₂·h + b₂, ∂ŷ/∂w₂ = h, so ∂L/∂w₂ = −0.8 × 0.5 = −0.4. The value −1.6 multiplies by w₂ instead, which is the formula for ∂L/∂h, not ∂L/∂w₂.' },
    { q: 'We train a deep stack of sigmoid layers and notice the first layers barely change. What explains this?', options: ['The learning rate is too large, so the first layers keep overshooting', 'The sigmoid derivative is at most 0.25, so the signal shrinks layer by layer', 'Backprop stops before the first layers to save memory in deep stacks', 'The loss is not differentiable, so no gradient ever reaches the early layers'], answer: 1, explain: 'Each sigmoid layer multiplies the backward signal by at most 0.25, so after many layers it is tiny. Backprop does reach every layer; it just delivers very small gradients there. A too-large learning rate causes overshooting, not frozen early layers.' },
    { q: 'How does backpropagation compare with computing gradients numerically by nudging each weight?', options: ['Numerical gradients are exact, while backprop is only an approximation of them', 'Both cost about the same, but backprop needs less memory to store values', 'Backprop gets all gradients in one backward sweep; nudging needs passes per weight', 'Numerical nudging is faster for large networks, because it skips the backward pass'], answer: 2, explain: 'Backprop reuses work so one backward sweep yields every gradient. Finite differences need two forward passes per weight, which is impossibly slow for big networks, and they are approximate. Backprop does use more memory, because it stores activations.' },
    { q: 'Which is a misconception about backpropagation?', options: ['Backpropagation itself updates the weights', 'The forward pass must store intermediate values for the backward pass', 'When a value feeds several later nodes, their gradient contributions are added', 'A weight\'s gradient is the error signal at its output times the input it multiplied'], answer: 0, explain: 'Backprop only computes gradients; the update is done by an optimiser like gradient descent or Adam. The other three statements are accurate descriptions of how backprop works.' },
  ],
  takeaways: [
    'Backpropagation computes gradients; the optimiser (gradient descent, Adam) uses them to update weights.',
    'It is the chain rule applied backwards: multiply local derivatives along the path from the loss to each weight.',
    'Forward pass computes and stores activations; backward pass reuses them to get every gradient in one sweep.',
    'For a weight: gradient = error signal at its output × the input it multiplied.',
    'Small activation derivatives shrink gradients layer by layer (vanishing gradients); always sanity-check hand-written gradients numerically.',
  ],
  terms: [
    { term: 'Backpropagation', def: 'An algorithm that computes the gradient of the loss for every parameter by applying the chain rule backwards through the network.' },
    { term: 'Chain rule', def: 'The calculus rule that the derivative of a composed function is the product of the derivatives of its parts.' },
    { term: 'Forward pass', def: 'Running inputs through the network to compute and store activations, the prediction and the loss.' },
    { term: 'Error signal (δ)', def: 'The gradient of the loss with respect to a node\'s pre-activation, passed backwards layer by layer.' },
    { term: 'Vanishing gradient', def: 'When gradients become tiny in early layers because many small derivatives are multiplied together.' },
    { term: 'Gradient check', def: 'Comparing backprop gradients against finite-difference estimates to detect bugs.' },
  ],
};
