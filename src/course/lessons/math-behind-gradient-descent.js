export default {
  id: 'math-behind-gradient-descent',
  minutes: 20,
  hook: 'A model with billions of numbers has no map of the best settings, so how does it find them by only ever looking at the ground under its feet?',
  summary: 'Gradient descent is the algorithm that trains almost every neural network. It measures how wrong the model is with a loss function, computes the gradient (the direction in which the loss rises fastest), and nudges every parameter a small step the opposite way: `w ← w − η · ∂L/∂w`. Repeating this many times walks the parameters downhill to a low loss.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'Training a model means finding good values for its **parameters**: the weights and biases inside it. A small linear model has two. A large language model has billions. We cannot try every combination, and for neural networks there is no formula that solves for the best values directly. We need a method that *improves* the parameters a little at a time.' },
        { type: 'p', text: 'That method is **gradient descent**. Our running example is the house-price model from the previous lesson: `price = w · size + b`. We want to find the `w` and `b` that make predictions closest to real prices. Gradient descent will get there by repeatedly asking one question: *if I nudge each parameter a tiny bit, does the error go up or down, and how fast?*' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like walking down a foggy hill', text: 'You are on a hillside in thick fog and want to reach the valley floor. You cannot see the valley. But you can feel the slope under your feet. So you take a step in the steepest downhill direction, feel the slope again, and repeat. The height is the loss, your position is the parameters, the slope you feel is the gradient, and the length of each step is the learning rate.' },
      ],
    },
    {
      id: 'loss-function',
      title: 'What is a loss function?',
      blocks: [
        { type: 'p', text: 'Before we can go "downhill" we need a single number that says how bad the model is. That number is the **loss** (also called cost or error), and the function that computes it is the **loss function**. Lower is better. A loss of zero means perfect predictions on the training data.' },
        { type: 'p', text: 'For predicting numbers, the most common choice is **mean squared error (MSE)**: take each prediction `ŷᵢ`, subtract the true value `yᵢ`, square the difference, and average over all `n` examples.' },
        { type: 'formula', expr: 'L(w, b) = (1/n) · ∑ᵢ (ŷᵢ − yᵢ)²     where ŷᵢ = w·xᵢ + b', where: [['L', 'the loss: one number summarising how wrong we are'], ['ŷᵢ', 'the model\'s prediction for example i'], ['yᵢ', 'the true answer for example i'], ['n', 'the number of training examples']], caption: 'Squaring makes every error positive and punishes big errors more than small ones.' },
        { type: 'p', text: 'Example: if the model predicts 6 for a house worth 5 and predicts 9 for a house worth 9, the errors are 1 and 0, so MSE = (1² + 0²)/2 = 0.5. For classification we use a different loss, cross-entropy, which gets its own lesson. Gradient descent works with any loss that we can differentiate.' },
        { type: 'p', text: 'The key idea is that the loss is a **function of the parameters**. Fix the data, change `w` and `b`, and the loss changes. If we plot the loss for every possible `w`, we get a curve (or, with two parameters, a surface) called the **loss landscape**. Training means finding a low point on that landscape.' },
      ],
    },
    {
      id: 'what-and-why',
      title: 'What gradient descent is, and the intuition',
      blocks: [
        { type: 'p', text: 'A **derivative** `dL/dw` tells us how fast the loss changes when `w` changes a tiny bit. If it is positive, increasing `w` increases the loss, so we should *decrease* `w`. If it is negative, increasing `w` lowers the loss, so we should *increase* `w`. Either way, we move **against the sign** of the derivative.' },
        { type: 'p', text: 'With many parameters, we take one derivative per parameter while holding the others fixed. These are called **partial derivatives**, written `∂L/∂w`. Collected into a vector they form the **gradient**, written `∇L`. The gradient points in the direction of steepest *increase* of the loss, so we step in the direction of `−∇L`. That is where the name comes from: we *descend* along the *gradient*.' },
        { type: 'p', text: 'The size of the gradient matters too. Far from the minimum the slope is usually steep, so the steps are big. Near the minimum the slope flattens, so steps shrink automatically. That is why gradient descent slows down gracefully as it approaches a good solution.' },
        { type: 'viz', name: 'gradient-descent', caption: 'Press play to watch the ball step downhill. Then drag the learning rate: small values crawl, a good value converges fast, and values that are too large overshoot or even diverge.' },
      ],
    },
    {
      id: 'the-math',
      title: 'The math: the update rule',
      blocks: [
        { type: 'p', text: 'Everything in gradient descent comes down to one line, applied to every parameter at every step:' },
        { type: 'formula', expr: 'θ ← θ − η · ∂L/∂θ', where: [['θ (theta)', 'any parameter, such as a weight w or a bias b'], ['η (eta)', 'the learning rate: how big a step we take, e.g. 0.01'], ['∂L/∂θ', 'the gradient of the loss with respect to that parameter'], ['←', '"is replaced by": we overwrite the old value']], caption: 'The minus sign is what makes it descent instead of ascent.' },
        { type: 'p', text: 'For our house model with MSE loss, calculus gives the two gradients. Using the chain rule on `(w·xᵢ + b − yᵢ)²`:' },
        { type: 'formula', expr: '∂L/∂w = (2/n) · ∑ᵢ (ŷᵢ − yᵢ) · xᵢ        ∂L/∂b = (2/n) · ∑ᵢ (ŷᵢ − yᵢ)', caption: 'The weight gradient is the error weighted by the input; the bias gradient is just the average error (times 2).' },
        { type: 'steps', title: 'The gradient descent loop', items: [
          { title: 'Initialise', text: 'Start the parameters somewhere, e.g. small random weights and zero biases.' },
          { title: 'Predict', text: 'Run the model on the training data to get predictions ŷ (the forward pass).' },
          { title: 'Measure loss', text: 'Compute L from the predictions and true values.' },
          { title: 'Compute gradients', text: 'Find ∂L/∂θ for every parameter. For neural networks this is done by backpropagation (next lesson).' },
          { title: 'Update', text: 'Apply θ ← θ − η·∂L/∂θ to every parameter at the same time.' },
          { title: 'Repeat', text: 'Go back to Predict. Stop after a fixed number of steps or when the loss stops improving.' },
        ] },
      ],
    },
    {
      id: 'numeric-example',
      title: 'Step-by-step numeric example',
      blocks: [
        { type: 'p', text: 'Let us do it by hand on the simplest possible loss: `L(w) = (w − 3)²`. Its minimum is obviously at `w = 3`, which lets us check our work. The derivative is `dL/dw = 2(w − 3)`. We start at `w = 0` with learning rate `η = 0.1`.' },
        { type: 'table', caption: 'Three steps of gradient descent on L(w) = (w − 3)², η = 0.1', head: ['Step', 'w before', 'Gradient 2(w − 3)', 'Update w − 0.1 × grad', 'Loss after'], rows: [
          ['1', '0.000', '−6.000', '0 + 0.600 = 0.600', '5.760'],
          ['2', '0.600', '−4.800', '0.600 + 0.480 = 1.080', '3.686'],
          ['3', '1.080', '−3.840', '1.080 + 0.384 = 1.464', '2.359'],
        ] },
        { type: 'p', text: 'The gradient is negative (the loss falls as `w` grows), so each update *increases* `w`. Each step closes 20% of the remaining gap to 3, because `w − 3` gets multiplied by `1 − 2η = 0.8`. The steps get smaller as the slope flattens. Starting from a loss of 9, the loss is multiplied by 0.64 each step.' },
        { type: 'chart', kind: 'line', title: 'Loss per step for L(w) = (w − 3)², η = 0.1', xLabel: 'Step', yLabel: 'Loss', series: [
          { name: 'Loss', points: [[0, 9], [1, 5.76], [2, 3.686], [3, 2.359], [4, 1.51], [5, 0.966], [6, 0.618], [7, 0.396], [8, 0.253]] },
        ], caption: 'Exact values: loss after k steps = 9 × 0.64ᵏ. Fast at first, then slower as the slope flattens.' },
        { type: 'check', question: 'Using the same loss and η = 0.1, suppose we started at w = 5 instead. What is the first gradient, and does w go up or down?', answer: 'Gradient = 2(5 − 3) = +4. The update is w − 0.1 × 4 = 4.6, so w goes **down**, towards 3. A positive gradient always pushes the parameter down; a negative one pushes it up.' },
      ],
    },
    {
      id: 'multiple-parameters',
      title: 'Gradient descent with multiple parameters',
      blocks: [
        { type: 'p', text: 'Real models have many parameters, but nothing new is needed. We compute one partial derivative per parameter and update all of them **simultaneously**, using gradients computed from the *same* old values. Updating `w` first and then using the new `w` to compute the gradient for `b` would be a different (and usually worse) algorithm.' },
        { type: 'p', text: 'Worked example with our house model: one house, size `x = 2`, price `y = 7`. Start at `w = 0`, `b = 0`, `η = 0.05`. Prediction `ŷ = 0`, error `ŷ − y = −7`. Gradients: `∂L/∂w = 2 · (−7) · 2 = −28` and `∂L/∂b = 2 · (−7) = −14`. Updates: `w = 0 − 0.05 · (−28) = 1.4` and `b = 0 − 0.05 · (−14) = 0.7`. New prediction: `1.4 · 2 + 0.7 = 3.5`, already halfway to 7.' },
        { type: 'p', text: 'Notice that `w` moved more than `b`. Its gradient is multiplied by the input `x = 2`, so parameters attached to larger inputs get larger gradients. This is one reason we usually **scale input features** to similar ranges: otherwise one direction of the landscape is much steeper than another and the descent zig-zags.' },
      ],
    },
    {
      id: 'learning-rate',
      title: 'The role of the learning rate',
      blocks: [
        { type: 'p', text: 'The **learning rate** `η` is a **hyperparameter**: a setting we choose rather than something the model learns. It is the single most important knob in gradient descent.' },
        { type: 'list', items: [
          '**Too small** (e.g. 0.01 on our toy loss): every step is tiny, so training is slow and can stall on flat regions.',
          '**Just right** (0.1 here): steady, fast progress. On this particular loss, 0.5 even jumps to the exact minimum in one step.',
          '**Too large** (above 1.0 here): each step overshoots the valley by more than it started, so the loss *grows* and the parameters fly off to infinity. This is called **divergence**.',
        ] },
        { type: 'p', text: 'In practice, people try values spread over powers of ten (0.1, 0.01, 0.001...) and often use a **learning-rate schedule** that changes `η` over training: a short **warm-up** that increases it from near zero, followed by a slow **decay**. Optimizers such as **Momentum**, **RMSProp** and **Adam** build on plain gradient descent: momentum keeps a running average of past gradients to smooth the path, and Adam also scales each parameter\'s step by an estimate of its recent gradient size. Adam and its variant AdamW are the usual default for training Transformers.' },
        { type: 'callout', tone: 'warn', title: 'Common mistake: blaming the model for a bad learning rate', text: 'If the loss becomes `NaN` or shoots up in the first few hundred steps, the learning rate is the first suspect, not the architecture. If the loss falls painfully slowly from the very start, try a larger one. Always plot the loss curve.' },
      ],
    },
    {
      id: 'types',
      title: 'Types of gradient descent',
      blocks: [
        { type: 'p', text: 'The formula for the gradient averages over training examples. The three classic types differ only in *how many examples* we use to compute each gradient before taking a step. One full pass over the training data is called an **epoch**.' },
        { type: 'compare', title: 'Batch vs stochastic vs mini-batch gradient descent', options: [
          { name: 'Batch GD', summary: 'Uses all n examples for every single update.', pros: ['Exact gradient, smooth loss curve', 'Simple to reason about'], cons: ['One update per epoch: slow progress', 'Needs the whole dataset in memory per step'], bestFor: 'Small datasets and teaching' },
          { name: 'Stochastic GD (SGD)', summary: 'Uses one random example per update.', pros: ['Many cheap updates per epoch', 'Noise can help escape flat spots'], cons: ['Very noisy path', 'Does not use GPU parallelism well'], bestFor: 'Streaming data, very cheap models' },
          { name: 'Mini-batch GD', summary: 'Uses a small random batch, e.g. 32 to a few thousand examples.', pros: ['Good balance of speed and stability', 'Uses GPU parallelism efficiently'], cons: ['Batch size is another hyperparameter to tune'], bestFor: 'Almost all deep learning today' },
        ], rows: [
          ['Examples per update', 'n (all)', '1', 'B (e.g. 32)'],
          ['Updates per epoch', '1', 'n', 'n / B'],
          ['Gradient noise', 'None', 'High', 'Moderate'],
        ], verdict: 'Mini-batch is the default. Confusingly, frameworks call their optimizer "SGD" even when you feed it mini-batches.' },
      ],
    },
    {
      id: 'python',
      title: 'Gradient descent in Python',
      blocks: [
        { type: 'p', text: 'This script reproduces the hand calculation, fits the house-price model with all three types of gradient descent for 50 epochs, and shows what different learning rates do.' },
        { type: 'code', lang: 'python', title: 'gradient_descent.py', code: `import numpy as np

# Part 1: one parameter. Loss L(w) = (w - 3)², gradient dL/dw = 2(w - 3)
w, lr = 0.0, 0.1
for step in range(1, 4):
    grad = 2 * (w - 3)
    w = w - lr * grad
    print(f"step {step}: grad={grad:+.3f}  w={w:.3f}  loss={(w - 3) ** 2:.3f}")

# Part 2: two parameters (w, b) on house data, three flavours of gradient descent
rng = np.random.default_rng(0)
x = rng.uniform(0, 5, 200)                     # size in 100s of m²
y = 2 * x + 3 + rng.normal(0, 0.5, 200)        # price in $100k, with noise

def fit(batch_size, lr=0.02, epochs=50):
    w, b = 0.0, 0.0
    for _ in range(epochs):
        idx = rng.permutation(len(x))          # shuffle each epoch
        for start in range(0, len(x), batch_size):
            j = idx[start:start + batch_size]
            err = (w * x[j] + b) - y[j]
            w -= lr * 2 * np.mean(err * x[j])  # ∂L/∂w
            b -= lr * 2 * np.mean(err)         # ∂L/∂b
    loss = np.mean((w * x + b - y) ** 2)
    return w, b, loss

for name, bs in [("batch", 200), ("mini-batch", 32), ("stochastic", 1)]:
    w, b, loss = fit(bs)
    updates = 50 * int(np.ceil(200 / bs))
    print(f"{name:11s} updates={updates:5d}  w={w:.3f}  b={b:.3f}  MSE={loss:.3f}")

# Part 3: learning rate too large on L(w) = (w - 3)²
for lr in (0.01, 0.5, 1.1):
    w = 0.0
    for _ in range(10):
        w -= lr * 2 * (w - 3)
    print(f"lr={lr:<4}  w after 10 steps = {w:.3f}")`, output: `step 1: grad=-6.000  w=0.600  loss=5.760
step 2: grad=-4.800  w=1.080  loss=3.686
step 3: grad=-3.840  w=1.464  loss=2.359
batch       updates=   50  w=2.396  b=1.568  MSE=0.765
mini-batch  updates=  350  w=1.995  b=2.917  MSE=0.264
stochastic  updates=10000  w=2.015  b=3.016  MSE=0.274
lr=0.01  w after 10 steps = 0.549
lr=0.5   w after 10 steps = 3.000
lr=1.1   w after 10 steps = -15.575`, walkthrough: [
          { lines: [3, 8], note: 'The hand-worked example. The printed numbers match the table above exactly.' },
          { lines: [10, 13], note: '200 synthetic houses following price = 2·size + 3 plus random noise, so the best possible MSE is about 0.25 (the noise variance).' },
          { lines: [15, 25], note: 'One function covers all three types. batch_size decides how many examples feed each gradient. We shuffle every epoch so mini-batches are random.' },
          { lines: [22, 23], note: 'The update rule θ ← θ − η·∂L/∂θ, with the MSE gradients from the formula section.' },
          { lines: [27, 30], note: 'Same 50 epochs, very different numbers of updates. Full batch has made only 50 steps and has not converged yet; mini-batch and SGD are near the true w = 2, b = 3.' },
          { lines: [32, 37], note: 'Learning rate sweep: 0.01 crawls, 0.5 lands exactly on 3, and 1.1 diverges, ending at −15.6 and growing.' },
        ] },
        { type: 'p', text: 'Look at the second block of output. With the same number of epochs, full-batch gradient descent is still far off (b = 1.57) because it took only 50 steps. Mini-batch reaches almost the noise floor with 350 steps. SGD gets there too, but with 10,000 tiny noisy steps that would be slow on real hardware. That trade-off is why mini-batch is the standard.' },
        { type: 'check', question: 'For L(w) = (w − 3)², each step multiplies the gap (w − 3) by (1 − 2η). Using that, why does η = 1.1 diverge?', answer: '1 − 2 × 1.1 = −1.2. The gap flips sign and grows by 20% every step, so w jumps back and forth across 3 with ever bigger swings. Any η above 1.0 makes |1 − 2η| > 1 on this loss, which means divergence.' },
      ],
    },
    {
      id: 'putting-together',
      title: 'Putting it all together',
      blocks: [
        { type: 'flow', title: 'One training iteration', loop: true, nodes: [
          { label: 'Mini-batch', detail: 'Sample a small random batch of training examples.' },
          { label: 'Forward pass', detail: 'Compute predictions with the current parameters.' },
          { label: 'Loss', detail: 'Compare predictions with the true answers to get one number.' },
          { label: 'Gradients', detail: 'Compute ∂L/∂θ for every parameter (backpropagation in neural networks).' },
          { label: 'Update', detail: 'θ ← θ − η·∂L/∂θ for all parameters at once, then start again.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Where you meet this in the real world', text: 'Every time a framework such as PyTorch runs `loss.backward()` followed by `optimizer.step()`, it is doing one iteration of this loop: backward computes the gradients, step applies an update rule (plain SGD, or a smarter variant such as Adam). Training a large language model is this same loop repeated over a huge number of mini-batches.' },
        { type: 'list', items: [
          '**Local minima and saddle points:** on non-convex landscapes (all neural networks), gradient descent can stop at a point that is not the global best, or slow down on flat saddle regions. In practice, for large networks, the noise of mini-batches and good optimizers usually find solutions that work well.',
          '**Gradient descent needs gradients.** It does not work directly on things you cannot differentiate, such as accuracy counts or discrete choices; we optimise a smooth stand-in loss instead.',
          '**Scale your features** so no single parameter has a much steeper slope than the others.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'In the update rule θ ← θ − η·∂L/∂θ, why is there a minus sign?', options: ['The loss is always negative, so we flip its sign to minimise it', 'The gradient points uphill on the loss, and we want to move downhill', 'The learning rate must be negative, and the sign makes that explicit', 'It keeps the parameters smaller than 1 so training stays stable'], answer: 1, explain: 'The gradient points uphill. Subtracting it moves the parameters downhill. The loss (such as MSE) is non-negative and the learning rate is positive, so the other options are wrong.' },
    { q: 'Using L(w) = (w − 3)² with w = 1 and η = 0.25, what is w after one step?', options: ['0.0', '1.5', '2.0', '3.0'], answer: 2, explain: 'Gradient = 2(1 − 3) = −4. Update: w = 1 − 0.25 × (−4) = 1 + 1 = 2.0. Choosing 3.0 assumes we jump straight to the minimum, which only happens for η = 0.5 on this loss.' },
    { q: 'Our training loss is NaN after 200 steps and was growing quickly before that. What should we try first?', options: ['Lower the learning rate', 'Add more layers to the model', 'Train for more epochs', 'Switch from mini-batch to full-batch so each update uses all the data'], answer: 0, explain: 'A loss that grows and blows up is the classic sign of a learning rate that is too large, causing divergence. More epochs or layers would not fix overshooting, and full-batch gradients still overshoot if the step is too big.' },
    { q: 'How does mini-batch gradient descent differ from batch gradient descent?', options: ['It uses a different loss function that is cheaper to compute on large datasets', 'It updates after a small random subset of examples, not the whole dataset', 'It updates the biases each step and the weights once per epoch', 'It estimates the update without computing any gradients at all'], answer: 1, explain: 'All types use the same loss and the same update rule. They differ only in how many examples produce each gradient. Mini-batch takes many cheaper, slightly noisy steps per epoch.' },
    { q: 'Which statement is a misconception about gradient descent?', options: ['It computes one partial derivative per parameter', 'The steps naturally get smaller as the slope flattens near a minimum', 'All parameters should be updated using gradients from the same old values', 'A larger learning rate always makes training converge faster'], answer: 3, explain: 'Past a certain size, a larger learning rate overshoots and can diverge, as η = 1.1 did in our code. The other three statements are correct.' },
  ],
  takeaways: [
    'A loss function turns "how wrong is the model" into one number that depends on the parameters.',
    'The gradient points uphill; gradient descent steps the opposite way: θ ← θ − η·∂L/∂θ.',
    'All parameters are updated together, each by its own partial derivative.',
    'The learning rate decides step size: too small is slow, too large overshoots or diverges.',
    'Mini-batch gradient descent is the standard: many fairly accurate, GPU-friendly updates per epoch.',
  ],
  terms: [
    { term: 'Loss function', def: 'A function that turns the model\'s predictions and the true answers into one number measuring error; lower is better.' },
    { term: 'Gradient', def: 'The vector of partial derivatives of the loss with respect to every parameter; it points in the direction of steepest increase.' },
    { term: 'Learning rate (η)', def: 'A hyperparameter setting how big a step gradient descent takes each update.' },
    { term: 'Epoch', def: 'One full pass through the training dataset.' },
    { term: 'Mini-batch', def: 'A small random subset of training examples used to compute one gradient update.' },
    { term: 'Divergence', def: 'When updates overshoot so badly that the loss grows instead of shrinking, often ending in NaN.' },
  ],
};
