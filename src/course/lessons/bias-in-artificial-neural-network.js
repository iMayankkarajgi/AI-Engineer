export default {
  id: 'bias-in-artificial-neural-network',
  minutes: 15,
  hook: 'If a neuron can already multiply every input by a learned weight, why does it also need one extra number that ignores the input completely?',
  summary: 'A bias is a learned constant added to a neuron\'s weighted sum: `z = w·x + b`. It shifts the neuron\'s output up or down, so the neuron can fit lines that do not pass through the origin and can choose *where* its activation switches on. Without bias, many simple patterns become impossible or much harder to learn.',
  sections: [
    {
      id: 'the-problem',
      title: 'The problem: a line stuck at the origin',
      blocks: [
        { type: 'p', text: 'Let us start with a tiny running example. We want to predict a house price from its size. In our toy town every house costs a fixed **$300k for the land** plus **$200k per 100 m²** of floor space. So a 100 m² house costs $500k, a 200 m² house costs $700k, and so on. Written as a rule: `price = 2 · size + 3` (price in $100k, size in 100s of m²).' },
        { type: 'p', text: 'The simplest artificial neuron computes a **weighted sum** of its inputs: it multiplies each input by a number called a **weight** and adds the results. With one input, that is just `z = w · x`. Here is the catch: when `x = 0`, the output is always `0`, no matter what `w` is. The neuron can only draw lines that pass through the point (0, 0), the **origin**.' },
        { type: 'p', text: 'Our house rule says a house of size zero still costs $300k (the land). A line forced through the origin can never say that. It can tilt (change `w`), but it cannot lift itself up. That missing ability to lift and lower is exactly what the **bias** gives us.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a taxi meter', text: 'A taxi fare is a per-kilometre rate times the distance (the weight times the input) **plus a fixed flag-down fee** you pay the moment you sit in the car (the bias). A meter with no flag-down fee can only charge for distance. It cannot model the fixed part of the price, however carefully it tunes the per-kilometre rate.' },
      ],
    },
    {
      id: 'what-is-bias',
      title: 'What a bias is, in plain words',
      blocks: [
        { type: 'p', text: 'A **bias** is one extra learnable number per neuron that is added after the weighted sum and before the activation function. It does not multiply any input. It is simply added.' },
        { type: 'formula', expr: 'z = w₁x₁ + w₂x₂ + … + wₙxₙ + b        output = f(z)', where: [['x₁ … xₙ', 'the inputs to the neuron'], ['w₁ … wₙ', 'weights: how strongly each input counts'], ['b', 'bias: a constant offset the neuron learns'], ['z', 'the pre-activation (weighted sum plus bias)'], ['f', 'the activation function, such as ReLU, sigmoid or tanh']], caption: 'Every neuron in a standard dense layer has this form.' },
        { type: 'p', text: 'Two words that are easy to mix up: an **activation function** is the non-linear function `f` applied to `z` (for example `ReLU(z) = max(0, z)` or the sigmoid `σ(z) = 1 / (1 + e⁻ᶻ)`). The **pre-activation** is `z` itself. The bias lives inside `z`, so it changes what the activation function sees.' },
        { type: 'p', text: 'Weights and biases are both **parameters**: numbers the network learns during training. The weights control the *slope* or *sensitivity* to each input. The bias controls the *offset*: the output the neuron gives when all inputs are zero, and therefore where the neuron\'s decision boundary sits.' },
        { type: 'viz', name: 'neuron', caption: 'Move the bias slider and watch the output shift even though the inputs and weights stay the same. With ReLU, notice how the bias decides whether the neuron is on (positive) or off (zero).' },
        { type: 'check', question: 'A neuron has weights w = [0.5, −1.0], bias b = 2, and receives inputs x = [0, 0]. What is its pre-activation z?', answer: 'z = 0.5·0 + (−1.0)·0 + 2 = **2**. With all inputs at zero the weights contribute nothing, so the output is decided entirely by the bias. Without a bias it would be stuck at 0.' },
      ],
    },
    {
      id: 'what-bias-does',
      title: 'Two jobs a bias does',
      blocks: [
        { type: 'p', text: '**Job 1: shift a line or plane away from the origin.** With one input, `z = w·x + b` is the familiar line `y = mx + c` from school. `w` is the slope and `b` is the intercept, the height where the line crosses the y-axis. With many inputs, `w·x + b = 0` describes a flat boundary (a hyperplane). Without `b`, every such boundary must pass through the origin. With `b`, it can sit anywhere.' },
        { type: 'p', text: '**Job 2: set the threshold of the activation.** Take a ReLU neuron, `max(0, w·x + b)`. It outputs zero until `w·x + b` becomes positive. With `w = 1`, the neuron switches on when `x > −b`. So a bias of −1 means "only fire when x is above 1", and a bias of +1 means "fire as soon as x is above −1". The bias moves the switching point left and right.' },
        { type: 'chart', kind: 'line', title: 'ReLU(x + b) for three different biases', xLabel: 'Input x', yLabel: 'Neuron output', series: [
          { name: 'b = −1', points: [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 1], [3, 2]] },
          { name: 'b = 0', points: [[-2, 0], [-1, 0], [0, 0], [1, 1], [2, 2], [3, 3]] },
          { name: 'b = +1', points: [[-2, 0], [-1, 0], [0, 1], [1, 2], [2, 3], [3, 4]] },
        ], caption: 'Same weight (1), different bias. The bend in each curve (where the neuron turns on) sits at x = −b. Values computed exactly from the formula.' },
        { type: 'p', text: 'The same idea holds for a sigmoid neuron. `σ(w·x + b)` crosses 0.5 exactly where `w·x + b = 0`, that is at `x = −b / w`. The weight decides how steep the S-curve is; the bias decides where its middle sits. A classifier that says "spam if probability > 0.5" therefore has its decision point set by the bias.' },
        { type: 'callout', tone: 'note', title: 'Why the name "bias"?', text: 'The word here means "a built-in lean" towards a higher or lower output, before the evidence (the inputs) is considered. It is unrelated to *social bias* in AI fairness, and it is also different from the *bias* in the statistical "bias–variance trade-off". Same word, three different ideas.' },
      ],
    },
    {
      id: 'how-it-learns',
      title: 'How a bias is learned, step by step',
      blocks: [
        { type: 'p', text: 'A bias is trained exactly like a weight: by **gradient descent** (covered in the next lesson). We measure how wrong the network is with a **loss function**, compute how the loss changes when we nudge each parameter (its **gradient**), and move each parameter a little in the direction that lowers the loss.' },
        { type: 'steps', title: 'One training step for a single neuron with bias', items: [
          { title: 'Start with guesses', text: 'Initialise `w` with a small random number. The bias is very often initialised to `0`; this is safe because the random weights already make neurons differ from each other.' },
          { title: 'Forward pass', text: 'Compute the prediction `ŷ = w·x + b` for each training example.' },
          { title: 'Measure the error', text: 'Use a loss such as mean squared error, `L = mean((ŷ − y)²)`.' },
          { title: 'Compute gradients', text: 'For this loss, `∂L/∂w = 2·mean((ŷ − y)·x)` and `∂L/∂b = 2·mean(ŷ − y)`. The bias gradient is just the average error, because the bias behaves like a weight on an input that is always 1.' },
          { title: 'Update', text: '`w ← w − η·∂L/∂w` and `b ← b − η·∂L/∂b`, where `η` (eta) is the learning rate. Repeat until the loss stops falling.' },
        ] },
        { type: 'p', text: 'Notice the neat interpretation of `∂L/∂b`: if the neuron is, on average, predicting too high, the average error is positive and the bias goes down. If it is predicting too low, the bias goes up. The bias absorbs the overall offset in the data.' },
        { type: 'deeper', title: 'The "always-1 input" trick', blocks: [
          { type: 'p', text: 'Mathematically, a bias is the same as a weight attached to an extra input that is fixed at 1. If we append 1 to every input vector, `x̃ = [x₁, …, xₙ, 1]`, and append `b` to the weights, `w̃ = [w₁, …, wₙ, b]`, then `w̃·x̃ = w·x + b`. Older textbooks often draw this as an extra "bias unit" that always outputs 1.' },
          { type: 'p', text: 'This is why the gradient of the bias is so simple: for a weight, `∂z/∂wᵢ = xᵢ`; for the bias, `∂z/∂b = 1`. Everything else in backpropagation is identical.' },
        ] },
      ],
    },
    {
      id: 'code',
      title: 'Code you can run: with and without bias',
      blocks: [
        { type: 'p', text: 'We train two single-neuron models on our house-price data with plain gradient descent. One has a bias, one does not. Then we look at how the bias moves a ReLU neuron\'s switching point.' },
        { type: 'code', lang: 'python', title: 'bias_demo.py', code: `import numpy as np

# Toy data: house size (100s of m²) -> price (in $100k). True rule: price = 2*size + 3
size = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
price = 2 * size + 3

def train(use_bias, lr=0.02, steps=5000):
    w, b = 0.0, 0.0
    for _ in range(steps):
        pred = w * size + (b if use_bias else 0.0)
        err = pred - price
        w -= lr * 2 * np.mean(err * size)      # dL/dw for mean squared error
        if use_bias:
            b -= lr * 2 * np.mean(err)         # dL/db
    pred = w * size + (b if use_bias else 0.0)
    return w, b, np.mean((pred - price) ** 2)

for use_bias in (False, True):
    w, b, mse = train(use_bias)
    print(f"bias={use_bias!s:5}  w={w:.3f}  b={b:.3f}  MSE={mse:.4f}")

# A neuron with ReLU: bias decides when it "switches on"
x = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
for b in (-1.0, 0.0, 1.0):
    out = np.maximum(0, 1.0 * x + b)
    print(f"b={b:+.0f}  ReLU(x + b) = {out}")`, output: `bias=False  w=2.818  b=0.000  MSE=1.6364
bias=True   w=2.000  b=3.000  MSE=0.0000
b=-1  ReLU(x + b) = [0. 0. 0. 0. 1.]
b=+0  ReLU(x + b) = [0. 0. 0. 1. 2.]
b=+1  ReLU(x + b) = [0. 0. 1. 2. 3.]`, walkthrough: [
          { lines: [3, 5], note: 'Five houses that follow price = 2·size + 3 exactly. The "+ 3" is the part a bias-free neuron cannot represent.' },
          { lines: [7, 14], note: 'Gradient descent on mean squared error. The bias update uses the plain average error, because ∂z/∂b = 1.' },
          { lines: [15, 16], note: 'After training, report the learned parameters and the final mean squared error.' },
          { lines: [18, 20], note: 'Without bias the best it can do is a steeper slope (2.818) through the origin, leaving an error of 1.64. With bias it recovers the true rule exactly: w = 2, b = 3.' },
          { lines: [22, 26], note: 'Same input, same weight, three biases. Each bias moves the point where the ReLU starts outputting non-zero values.' },
        ] },
        { type: 'p', text: 'The bias-free model tries to compensate by making the slope steeper. It over-predicts large houses and under-predicts small ones, and no amount of extra training fixes that: the best line through the origin still has an error of about 1.64. Adding one number, the bias, removes the error completely.' },
        { type: 'check', question: 'In the bias-free run, the learned slope is 2.818, not 2. Why would gradient descent choose a slope that is "wrong"?', answer: 'Because it is the best it can do under the constraint. The model must pass through the origin, so to get close to prices that start at 3 it tilts the line upward. 2.818 is the least-squares slope for a line forced through (0, 0); it trades errors on small houses against errors on big ones.' },
      ],
    },
    {
      id: 'with-vs-without',
      title: 'With bias vs without bias',
      blocks: [
        { type: 'compare', title: 'Neuron with bias vs neuron without bias', options: [
          { name: 'Without bias', summary: 'z = w·x. Every boundary passes through the origin.', pros: ['One fewer parameter per neuron', 'Fine when a later layer or normalisation supplies the offset'], cons: ['Cannot model a constant offset', 'Activation threshold fixed at x = 0', 'Zero input always gives zero pre-activation'], bestFor: 'Layers followed by BatchNorm/LayerNorm/RMSNorm that add their own shift, or data already centred on zero' },
          { name: 'With bias', summary: 'z = w·x + b. Boundaries and thresholds can move anywhere.', pros: ['Fits offsets like fixed costs', 'Each neuron chooses its own switching point', 'Tiny cost: one number per neuron'], cons: ['Slightly more parameters', 'Redundant right before a normalisation layer that subtracts the mean'], bestFor: 'The default for dense and convolutional layers in most networks' },
        ], rows: [
          ['Pre-activation', 'w·x', 'w·x + b'],
          ['Line through origin?', 'Always', 'Only if b = 0'],
          ['Output when all inputs are 0', '0 (before activation)', 'b'],
          ['Parameters for a layer with n inputs, m neurons', 'n·m', 'n·m + m'],
        ], verdict: 'Keep the bias by default. Drop it only when something else already provides the shift, such as a normalisation layer with its own learned offset.' },
        { type: 'p', text: 'How much does a bias cost? Very little. A dense layer that maps 512 inputs to 256 neurons has 512 × 256 = 131,072 weights but only 256 biases, about 0.2% extra. That small price buys a lot of flexibility.' },
        { type: 'flow', title: 'Where the bias sits inside a neuron', nodes: [
          { label: 'Inputs x', detail: 'The values coming in: features of the data or outputs of the previous layer.' },
          { label: 'Multiply by weights', detail: 'Each input is scaled by its weight, wᵢ·xᵢ. This sets how strongly each input matters.' },
          { label: 'Sum', detail: 'All the scaled inputs are added: w·x.' },
          { label: 'Add bias', detail: 'The learned constant b is added: z = w·x + b. This shifts the result up or down.' },
          { label: 'Activation', detail: 'A non-linear function such as ReLU or sigmoid turns z into the neuron\'s output. The bias decides where it switches on.' },
        ] },
      ],
    },
    {
      id: 'real-world',
      title: 'Bias in real networks',
      blocks: [
        { type: 'p', text: 'In frameworks, bias is on by default. A PyTorch `nn.Linear(512, 256)` layer creates a weight matrix of shape 256 × 512 and a bias vector of length 256; you turn the bias off with `bias=False`. Keras `Dense` layers have the matching `use_bias` argument.' },
        { type: 'callout', tone: 'example', title: 'Where people deliberately remove bias', text: 'A convolution or linear layer followed directly by **Batch Normalization** usually has `bias=False`. BatchNorm subtracts the mean of each feature, which cancels any constant the previous layer added, and then adds its own learned shift (called β). Many modern large language models, including the Llama family, also use linear layers without bias inside their Transformer blocks; their designers found the bias terms added little. The exact choice varies by model, so check the architecture you are using.' },
        { type: 'list', items: [
          '**Classifiers:** the bias of the final layer often ends up reflecting how common each class is. If 90% of emails are not spam, the "not spam" output gets a head start.',
          '**Regression:** the output bias often learns something close to the average target value, so the weights only need to explain deviations from that average.',
          '**Hidden layers:** each neuron uses its bias to pick its own threshold, so different ReLU neurons turn on at different points. Together they can build bent, piecewise shapes that a single straight line could not.',
        ] },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and when not to use bias',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistake: thinking weights alone are enough', text: 'A common belief is that a big enough network can learn any offset from the weights alone. In a network without biases, an all-zero input produces zero in every layer (for activations where f(0) = 0, like ReLU and tanh), and every decision boundary of the first layer passes through the origin. The network can sometimes work around this, but it is wasting capacity on a problem one cheap number solves.' },
        { type: 'list', items: [
          '**Do not apply weight decay blindly to biases.** Weight decay (L2 regularisation) pulls parameters towards zero to prevent overfitting. Many training recipes exclude biases (and normalisation parameters) from weight decay because pulling the offset to zero rarely helps and can hurt.',
          '**Do not initialise biases to large values.** Zero (or a small constant) is the usual start. A large negative bias on a ReLU neuron can switch it off for every input, and a neuron that never fires gets no gradient: a "dead ReLU".',
          '**Remove bias before a normalisation layer that subtracts the mean.** It is cancelled anyway, so it only wastes memory and compute.',
          '**Keep it when the data is not centred.** If the target has a non-zero average (prices, temperatures, counts), the output layer almost certainly needs a bias.',
        ] },
        { type: 'p', text: 'Rule of thumb: keep the bias unless you can name the component that already provides the shift.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does the bias term do in a neuron computing f(w·x + b)?', options: ['It multiplies each input by a learned factor that sets its importance', 'It adds a learned constant that shifts the threshold away from the origin', 'It squashes the neuron\'s output into the range 0 to 1 after summing', 'It randomly removes some of the inputs during training to prevent overfitting'], answer: 1, explain: 'The bias is added, not multiplied, so it shifts z up or down. Scaling inputs is the job of the weights, squashing is the activation function, and randomly removing inputs is dropout.' },
    { q: 'We fit price = w·size (no bias) to data that follows price = 2·size + 3. What will happen?', options: ['It learns w = 2, the true slope, and fits the data perfectly', 'Some error remains; it settles on a steeper line through the origin', 'Training diverges because the gradient for w is undefined without a bias', 'It learns w = 3, absorbing the offset, and fits the data perfectly'], answer: 1, explain: 'A line through the origin cannot represent the constant +3. Gradient descent finds the best constrained slope (2.818 in our code), which still leaves error. The fit only becomes exact once a bias is added.' },
    { q: 'A ReLU neuron computes max(0, 1·x + b) with b = −2. For which inputs does it output something greater than zero?', options: ['x > −2', 'x > 0', 'x > 2', 'All inputs'], answer: 2, explain: 'The output is positive when x + b > 0, that is x − 2 > 0, so x > 2. The tempting answer x > −2 forgets that the switching point is at x = −b, not x = b.' },
    { q: 'Why do many networks use bias=False in a linear or convolution layer that is immediately followed by BatchNorm?', options: ['Biases make deep networks unstable whenever they are combined with normalization layers', 'BatchNorm subtracts the mean, cancelling any bias, and adds its own shift β', 'BatchNorm only works when the layer before it uses integer weights', 'Biases cannot be trained with gradient descent once BatchNorm is added'], answer: 1, explain: 'Subtracting the mean removes any constant offset, so the bias would have no effect. BatchNorm\'s own β parameter plays the role of the shift. Biases are trained by gradient descent normally and do not cause instability by themselves.' },
    { q: 'Which statement about biases is a misconception?', options: ['A bias can be seen as a weight on an extra input that is always 1', 'The gradient of z = w·x + b with respect to b is always exactly 1', 'Biases are usually initialised to zero or to a small positive constant value', 'Large networks never need biases, since the weights can learn any offset'], answer: 3, explain: 'Without biases, an all-zero input gives zero pre-activations everywhere and first-layer boundaries are pinned to the origin. Networks can sometimes work around this, but the bias solves it cheaply. The other three statements are correct.' },
  ],
  takeaways: [
    'A bias is a learned constant added to a neuron\'s weighted sum: z = w·x + b.',
    'Weights set slope and sensitivity; the bias sets the offset and the point where the activation switches on (x = −b/w).',
    'Without bias, every line or boundary is pinned to the origin and zero input gives zero output.',
    'A bias is trained like a weight on an always-1 input; its gradient is the average error signal.',
    'Biases are on by default; drop them only when a following layer, such as BatchNorm, already provides the shift.',
  ],
  terms: [
    { term: 'Bias', def: 'A learnable constant added to a neuron\'s weighted sum that shifts its output independently of the inputs.' },
    { term: 'Weight', def: 'A learnable number that scales one input, controlling how strongly that input influences the neuron.' },
    { term: 'Pre-activation', def: 'The value z = w·x + b computed before the activation function is applied.' },
    { term: 'Activation function', def: 'A non-linear function such as ReLU or sigmoid applied to the pre-activation to produce the neuron\'s output.' },
    { term: 'Decision boundary', def: 'The set of inputs where w·x + b = 0; the bias moves it away from the origin.' },
    { term: 'Dead ReLU', def: 'A ReLU neuron whose pre-activation is negative for all inputs, so it always outputs zero and receives no gradient.' },
  ],
};
