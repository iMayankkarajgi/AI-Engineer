export default {
  id: 'dropout-in-neural-networks',
  minutes: 18,
  hook: 'Why would switching off random neurons on purpose, every single training step, make a neural network smarter?',
  summary: 'Dropout is a regularisation technique: during training, each neuron\'s output is set to zero with probability p, and the survivors are scaled up by 1/(1 − p). This stops neurons from relying on specific partners and acts like training many thinned networks at once, which reduces overfitting. At test time dropout is switched off and the full network is used.',
  sections: [
    {
      id: 'what-is-dropout',
      title: 'What is dropout?',
      blocks: [
        { type: 'p', text: '**Dropout** is a simple trick used while training neural networks. On every training step, we pick a random subset of neurons in a layer and temporarily set their outputs to zero, as if they had been removed from the network. On the next step we pick a different random subset. The fraction we drop is a hyperparameter called the **dropout rate**, written `p` (for example `p = 0.5` drops about half).' },
        { type: 'p', text: 'Dropout was introduced by Geoffrey Hinton\'s group at the University of Toronto around 2012 and described in detail by Srivastava and colleagues in 2014. It quickly became one of the standard tools for making networks generalise better.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a team where anyone might be absent', text: 'Imagine a restaurant kitchen where, every day, a random half of the cooks call in sick. No dish can depend on one specific cook knowing one secret step. Every cook has to be broadly capable, and important knowledge gets spread across the team. On the day everyone shows up (test time), the kitchen is extra robust. Dropout forces neurons to work the same way.' },
        { type: 'viz', name: 'dropout', caption: 'Drag the drop rate and press resample. Dropped neurons fade out, and the surviving ones are scaled up so the layer\'s total signal stays about the same.' },
      ],
    },
    {
      id: 'overfitting',
      title: 'The problem of overfitting',
      blocks: [
        { type: 'p', text: '**Overfitting** happens when a model learns the training data too specifically, including its noise and accidents, instead of the general pattern. The symptom is a gap: the loss on the **training set** keeps falling, while the loss on a held-out **validation set** (data the model never trains on) stops improving and starts rising.' },
        { type: 'p', text: 'Our running example: a network that classifies customer support messages into topics (billing, shipping, login problems) using only 2,000 labelled messages. A big network can simply memorise all 2,000. It might learn that any message containing a particular customer\'s name is about billing, because that customer happened to write three billing messages. That rule is useless on new messages.' },
        { type: 'chart', kind: 'line', title: 'Typical loss curves with and without dropout', xLabel: 'Epoch', yLabel: 'Loss', series: [
          { name: 'Train, no dropout', points: [[1, 1.2], [5, 0.6], [10, 0.25], [15, 0.08], [20, 0.03]] },
          { name: 'Validation, no dropout', points: [[1, 1.25], [5, 0.75], [10, 0.62], [15, 0.7], [20, 0.85]] },
          { name: 'Validation, with dropout', points: [[1, 1.3], [5, 0.8], [10, 0.6], [15, 0.52], [20, 0.5]] },
        ], caption: 'Illustrative curves, not measured. Without dropout, validation loss turns upward while training loss keeps falling: classic overfitting. With dropout the validation loss keeps improving.' },
        { type: 'p', text: 'Techniques that fight overfitting are called **regularisation**. Others include getting more data, data augmentation, weight decay (L2), early stopping and smaller models. Dropout is a regulariser designed specifically for neural networks.' },
      ],
    },
    {
      id: 'why-dropout',
      title: 'Why do we need dropout?',
      blocks: [
        { type: 'p', text: 'There are two complementary explanations for why dropout helps.' },
        { type: 'p', text: '**1. It breaks co-adaptation.** In a normal network, neurons can form fragile partnerships: neuron A only produces something useful if neuron B fixes up its mistakes. These partnerships often encode quirks of the training data. With dropout, B might be missing at any step, so A must learn features that are useful on their own, in many different contexts.' },
        { type: 'p', text: '**2. It is a cheap ensemble.** An **ensemble** combines the predictions of several separately trained models, which usually beats any single one. With n neurons that can each be dropped, there are 2ⁿ possible "thinned" sub-networks. Each training step trains one random sub-network, and they all share weights. At test time, using the full network with proper scaling approximates averaging the predictions of all these sub-networks, without training them separately.' },
        { type: 'check', question: 'A hidden layer has 10 neurons with dropout. How many different thinned versions of that layer can training sample?', answer: '2¹⁰ = **1,024**, because each neuron is independently either kept or dropped. For a layer of 1,000 neurons the number is astronomically large, which is why we call it an implicit ensemble rather than literally training each one.' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How does dropout work?',
      blocks: [
        { type: 'p', text: 'Dropout is applied to the **outputs (activations)** of a layer, usually after the activation function. For each activation, we draw a random number; if it falls below `p`, that activation becomes 0. The random pattern of kept and dropped units is called the **mask**. A fresh mask is drawn for every example and every training step.' },
        { type: 'formula', expr: 'mᵢ ~ Bernoulli(1 − p)        h̃ᵢ = hᵢ · mᵢ / (1 − p)', where: [['hᵢ', 'the original activation of neuron i'], ['mᵢ', 'mask value: 1 (keep) with probability 1 − p, 0 (drop) with probability p'], ['1 / (1 − p)', 'the scaling factor that keeps the expected value unchanged'], ['h̃ᵢ', 'the activation after dropout']], caption: 'This is "inverted dropout", the version every modern framework uses.' },
        { type: 'p', text: '**Why scale by 1/(1 − p)?** If we drop half the neurons, the next layer receives on average only half the total signal. At test time, with nobody dropped, it would suddenly receive twice as much, and its learned weights would be miscalibrated. Scaling survivors by `1/(1 − p)` during training makes the *expected* value of each activation equal to its original value: `E[h̃ᵢ] = (1 − p) · hᵢ / (1 − p) = hᵢ`. So the full network at test time sees signals of the same size it was trained on.' },
        { type: 'deeper', title: 'Inverted vs original dropout', blocks: [
          { type: 'p', text: 'The original formulation did *not* scale during training. Instead, at test time it multiplied the outgoing weights by the keep probability `1 − p`. Mathematically both approaches give the same expected signal. Inverted dropout is preferred because it leaves inference completely untouched: the deployed model needs no special handling, and dropout can be turned off by simply skipping the layer.' },
        ] },
      ],
    },
    {
      id: 'step-by-step',
      title: 'A step-by-step example',
      blocks: [
        { type: 'steps', title: 'Dropout with p = 0.5 on six activations', items: [
          { title: 'Start with activations', text: 'A hidden layer outputs `h = [1, 2, 3, 4, 5, 6]`. The sum is 21.' },
          { title: 'Draw a mask', text: 'Each unit is kept with probability 0.5. Suppose the mask is `[1, 0, 0, 0, 1, 1]`.' },
          { title: 'Zero the dropped units', text: '`h · m = [1, 0, 0, 0, 5, 6]`. Sum is now 12.' },
          { title: 'Scale the survivors', text: 'Multiply by `1/(1 − 0.5) = 2`: `[2, 0, 0, 0, 10, 12]`. Sum 24, close to 21. On average across many masks the sum is exactly 21.' },
          { title: 'Backward pass', text: 'Gradients flow only through the kept units (multiplied by the same factor 2). Dropped neurons get no update from this example on this step.' },
          { title: 'Next step, new mask', text: 'Another mask, another sub-network. Over thousands of steps, every neuron is trained in many different company.' },
        ] },
        { type: 'p', text: 'The code below runs exactly this, then checks the expectation argument with 100,000 random masks.' },
        { type: 'code', lang: 'python', title: 'dropout_demo.py', code: `import numpy as np

rng = np.random.default_rng(0)

def dropout(x, p, training):
    """Inverted dropout: drop with probability p, scale survivors by 1/(1-p)."""
    if not training or p == 0:
        return x                              # evaluation: identity, no scaling
    keep = rng.random(x.shape) >= p           # True = neuron survives
    return x * keep / (1 - p)

h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])  # activations of one hidden layer
print("input        ", h)
for trial in range(3):
    print(f"train pass {trial}", dropout(h, p=0.5, training=True))
print("eval pass    ", dropout(h, p=0.5, training=False))

# Inverted scaling keeps the expected value the same as at evaluation time
many = np.stack([dropout(h, 0.5, True) for _ in range(100_000)])
print("mean over 100k train passes", many.mean(axis=0).round(2))

# What goes wrong without the 1/(1-p) scaling
no_scale = np.stack([h * (rng.random(h.shape) >= 0.5) for _ in range(100_000)])
print("mean without scaling       ", no_scale.mean(axis=0).round(2))`, output: `input         [1. 2. 3. 4. 5. 6.]
train pass 0 [ 2.  0.  0.  0. 10. 12.]
train pass 1 [ 2.  4.  6.  8. 10.  0.]
train pass 2 [ 2.  0.  6.  0. 10. 12.]
eval pass     [1. 2. 3. 4. 5. 6.]
mean over 100k train passes [1.   1.99 3.   4.01 4.98 6.02]
mean without scaling        [0.5  1.   1.5  2.01 2.5  2.99]`, walkthrough: [
          { lines: [5, 10], note: 'The whole algorithm: in evaluation mode return the input unchanged; in training mode build a random keep-mask and scale the survivors by 1/(1 − p).' },
          { lines: [12, 15], note: 'Three training passes over the same activations give three different masks. Survivors are doubled because p = 0.5.' },
          { lines: [16, 16], note: 'Evaluation mode: the layer is an identity function. No randomness, no scaling.' },
          { lines: [18, 20], note: 'Averaging 100,000 training passes recovers the original values, showing that inverted dropout preserves the expected activation.' },
          { lines: [22, 24], note: 'Without scaling, the average is halved. A network trained like this would see signals twice as large at test time.' },
        ] },
      ],
    },
    {
      id: 'train-vs-test',
      title: 'Dropout during training vs testing',
      blocks: [
        { type: 'compare', title: 'The same dropout layer in two modes', options: [
          { name: 'Training mode', summary: 'Random units are zeroed; survivors scaled by 1/(1 − p).', pros: ['Regularises the network', 'Implicitly trains many sub-networks'], cons: ['Outputs are noisy and change every call', 'Training usually needs more epochs to converge'], bestFor: 'Every training step' },
          { name: 'Evaluation mode', summary: 'Dropout is off: the layer passes values through unchanged.', pros: ['Deterministic predictions', 'Uses the whole network\'s capacity'], cons: ['None, as long as you remember to switch to it'], bestFor: 'Validation, testing and production inference' },
        ], rows: [
          ['Randomness', 'Yes, fresh mask every call', 'None'],
          ['Scaling', '× 1/(1 − p) on kept units', 'None (inverted dropout)'],
          ['PyTorch switch', 'model.train()', 'model.eval()'],
          ['Keras switch', 'training=True (automatic in fit)', 'training=False (automatic in predict)'],
        ], verdict: 'Always evaluate and deploy in evaluation mode. Forgetting this is one of the most common deep-learning bugs.' },
        { type: 'callout', tone: 'warn', title: 'Common mistake: evaluating in training mode', text: 'If you forget `model.eval()` in PyTorch before validation or inference, dropout stays on. Predictions become random, accuracy looks worse than it is, and the same input gives different answers each time. Equally, forgetting to switch back with `model.train()` silently turns regularisation off for the rest of training.' },
        { type: 'p', text: 'A deliberate exception is **Monte Carlo dropout**: keeping dropout on at test time, running the same input many times and looking at the spread of the predictions as an estimate of the model\'s uncertainty. It is a known technique, but it is a conscious choice, not the default.' },
        { type: 'check', question: 'You validate your model twice on the same data and get 87.2% then 86.5% accuracy. Nothing changed in between. What is the most likely cause?', answer: 'Dropout (or another random layer) is still active because the model is in training mode. In evaluation mode the network is deterministic, so the same data must give the same accuracy. Call `model.eval()` before validating.' },
      ],
    },
    {
      id: 'in-code',
      title: 'Dropout in code with a framework',
      blocks: [
        { type: 'p', text: 'In practice we never write the mask ourselves; frameworks provide a dropout layer. Here is the usual PyTorch pattern for our support-ticket classifier (PyTorch is not installed in this course sandbox, so this snippet is shown without output; the numpy demo above shows the same mechanism running).' },
        { type: 'code', lang: 'python', title: 'classifier.py (PyTorch)', code: `import torch.nn as nn

model = nn.Sequential(
    nn.Linear(300, 128),
    nn.ReLU(),
    nn.Dropout(p=0.5),       # drops 50% of the 128 activations in training
    nn.Linear(128, 3),       # 3 topics: billing, shipping, login
)

model.train()   # dropout active  -> use while fitting
model.eval()    # dropout is a no-op -> use for validation and inference`, walkthrough: [
          { lines: [3, 8], note: 'Dropout sits after the activation of a hidden layer. Note that we do not put dropout on the final output layer.' },
          { lines: [10, 11], note: 'The same model object switches behaviour with train() and eval(). The argument p is the drop probability, not the keep probability.' },
        ] },
        { type: 'callout', tone: 'tip', title: 'Watch the convention', text: 'PyTorch `nn.Dropout(p)` and Keras `Dropout(rate)` both take the probability of **dropping**. Some older papers and code (including the original TensorFlow 1 `keep_prob` argument) used the probability of **keeping**. A value of 0.9 means opposite things under the two conventions.' },
      ],
    },
    {
      id: 'variants',
      title: 'Variants of dropout',
      blocks: [
        { type: 'table', caption: 'Common variants and what they drop', head: ['Variant', 'What gets dropped', 'Typical use'], rows: [
          ['Standard dropout', 'Individual activations', 'Fully connected layers, Transformer sub-layers'],
          ['DropConnect', 'Individual weights instead of activations', 'Research on dense layers; less common in practice'],
          ['Spatial dropout (Dropout2d)', 'Entire feature maps (channels) of a CNN', 'Convolutional networks, where neighbouring pixels are strongly correlated'],
          ['Variational / recurrent dropout', 'The same mask reused at every time step of a sequence', 'RNNs and LSTMs'],
          ['Attention dropout', 'Entries of the attention-weight matrix', 'Transformers'],
          ['DropPath / stochastic depth', 'Whole residual branches of a block', 'Deep residual networks and vision Transformers'],
          ['Monte Carlo dropout', 'Standard dropout kept on at inference', 'Uncertainty estimation'],
        ] },
        { type: 'p', text: 'They all share the core idea: inject structured random noise during training so the network cannot depend on any single path, then remove the noise for inference.' },
      ],
    },
    {
      id: 'advantages-and-use',
      title: 'Advantages, where dropout is used, and when not to use it',
      blocks: [
        { type: 'list', items: [
          '**Simple:** one line of code and one hyperparameter.',
          '**Cheap:** almost no extra compute, and zero cost at inference with inverted dropout.',
          '**Effective:** often noticeably reduces overfitting, especially for large fully connected layers and small datasets.',
          '**Works alongside other regularisers** such as weight decay and data augmentation.',
        ] },
        { type: 'callout', tone: 'example', title: 'Where dropout is used', text: 'Classic image networks such as AlexNet and VGG used dropout with p = 0.5 in their large fully connected layers. The original Transformer applied dropout of 0.1 to the outputs of each sub-layer and to the embeddings, and Transformer-based models such as BERT use dropout of about 0.1 as well. Smaller models fine-tuned on modest datasets commonly keep dropout on. Many very large language models are pretrained with dropout set very low or turned off, because each training example is seen only about once and overfitting is less of a concern; exact settings vary by model and are not always published.' },
        { type: 'p', text: '**Typical rates:** 0.1–0.3 for Transformers and convolutional layers, up to 0.5 for big dense layers. Rates above about 0.5 usually hurt because too little signal gets through.' },
        { type: 'p', text: '**When not to use it, or to use less:** when the model is *underfitting* (training loss itself is high), dropout makes things worse. With huge datasets seen once, it may add little. Mixing dropout with Batch Normalization in the same block can cause a mismatch between training and test statistics, so many CNNs that rely on BatchNorm use little or no dropout in convolutional layers. Never apply dropout at inference unless you want Monte Carlo dropout on purpose.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does inverted dropout do during training?', options: ['Permanently deletes a fraction p of the neurons before training even starts', 'Zeroes each activation with probability p and scales survivors by 1/(1 − p)', 'Adds random Gaussian noise to every weight at each training step', 'Divides every activation by p so the layer output stays in range'], answer: 1, explain: 'Dropout is temporary: a new random mask each step, with survivors scaled by 1/(1 − p) to keep the expected value. Nothing is permanently deleted, and noise on weights is a different technique.' },
    { q: 'With p = 0.2, a kept activation of 4.0 becomes what after inverted dropout?', options: ['3.2', '4.0', '5.0', '20.0'], answer: 2, explain: 'Scale factor = 1/(1 − 0.2) = 1.25, so 4.0 × 1.25 = 5.0. 3.2 multiplies by the keep probability (the old test-time rule), and 20.0 divides by p instead of 1 − p.' },
    { q: 'Our model\'s predictions on the same test example change every time we run it, and test accuracy is lower than expected. What should we fix?', options: ['Increase the dropout rate so the network relies less on single units', 'Remove the final layer, which adds noise to every prediction', 'Switch to evaluation mode (e.g. model.eval()) before testing', 'Train for more epochs until the predictions stop changing'], answer: 2, explain: 'Random, varying predictions mean dropout is still active. In evaluation mode the dropout layer is an identity function, so predictions become deterministic. More training or more dropout would not fix this.' },
    { q: 'How does dropout differ from L2 weight decay as a regulariser?', options: ['Dropout adds noise to activations; weight decay penalises large weights', 'Dropout only acts at test time; weight decay only acts during training', 'They are one technique under two names: both shrink the weights smoothly', 'Weight decay removes neurons, while dropout shrinks weights smoothly'], answer: 0, explain: 'Dropout randomly zeroes activations during training, forcing redundancy; weight decay adds a penalty that pulls weights towards zero. Both act during training only, and they are often used together.' },
    { q: 'Which statement is a misconception about dropout?', options: ['It can be seen as training an ensemble of thinned sub-networks that share weights', 'It discourages neurons from co-adapting', 'More dropout always helps, so a rate of 0.9 is safer than 0.3', 'With inverted dropout, inference needs no special scaling'], answer: 2, explain: 'Too much dropout starves the network of signal and causes underfitting; very high rates usually hurt. The other three statements are correct descriptions of dropout.' },
  ],
  takeaways: [
    'Dropout randomly zeroes activations during training with probability p; a fresh mask is drawn each step.',
    'Inverted dropout scales survivors by 1/(1 − p) so the expected signal matches inference, where dropout is off.',
    'It reduces overfitting by breaking co-adaptation and acting like an ensemble of sub-networks.',
    'Always switch to evaluation mode for validation and deployment.',
    'Typical rates are 0.1–0.5; use less (or none) when underfitting or when training on huge data once.',
  ],
  terms: [
    { term: 'Dropout', def: 'A regularisation method that randomly sets a fraction of activations to zero during training.' },
    { term: 'Dropout rate (p)', def: 'The probability that any given unit is dropped on a training step.' },
    { term: 'Overfitting', def: 'When a model fits the training data, including noise, so well that it performs worse on new data.' },
    { term: 'Inverted dropout', def: 'Dropout that scales kept activations by 1/(1 − p) during training so nothing changes at inference.' },
    { term: 'Co-adaptation', def: 'Neurons relying on specific other neurons to correct them, forming fragile features.' },
    { term: 'Monte Carlo dropout', def: 'Keeping dropout on at inference and averaging many runs to estimate uncertainty.' },
  ],
};
