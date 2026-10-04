export default {
  id: 'batch-normalization-vs-layer-normalization',
  minutes: 23,
  hook: 'Two layers do almost the same arithmetic, subtract a mean and divide by a standard deviation, so why does one rule image networks and the other rule every Transformer?',
  summary: 'Normalization layers rescale activations so they have a mean of about 0 and a standard deviation of about 1, then apply a learned scale and shift. Batch Normalization computes those statistics for each feature across the examples in a mini-batch; Layer Normalization computes them for each example across its features. That single difference in direction decides where each one works best.',
  sections: [
    {
      id: 'what-is-normalization',
      title: 'What is normalization?',
      blocks: [
        { type: 'p', text: 'To **normalize** (more precisely, *standardize*) a set of numbers means to shift and rescale them so their **mean** (average) is 0 and their **standard deviation** (typical distance from the mean) is 1. You compute the mean `μ` and the **variance** `σ²` (the average squared distance from the mean), then transform each value:' },
        { type: 'formula', expr: 'x̂ = (x − μ) / √(σ² + ε)        y = γ · x̂ + β', where: [['μ', 'mean of the group of values being normalized'], ['σ²', 'variance of that group'], ['ε', 'a tiny constant such as 10⁻⁵ to avoid dividing by zero'], ['γ (gamma)', 'learned scale, one per feature, starts at 1'], ['β (beta)', 'learned shift, one per feature, starts at 0']], caption: 'Both BatchNorm and LayerNorm use exactly this formula. They only disagree about which values form "the group".' },
        { type: 'p', text: 'Example: the values `[2, 4, 6]` have mean 4 and variance `((−2)² + 0² + 2²)/3 = 8/3`, so standard deviation ≈ 1.63. Normalized: `[−1.22, 0, 1.22]`.' },
        { type: 'p', text: 'The learned `γ` and `β` matter. They let the network undo the normalization if that is what works best: if it learns `γ = σ` and `β = μ`, it gets the original values back. So normalization never removes capacity; it just gives each layer a well-behaved starting point.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like grading on a curve', text: 'Two teachers mark the same class: one gives scores out of 10, the other out of 1,000, and one marks harshly. Raw scores are hard to compare or combine. Converting each to "how many standard deviations above the average" puts them on the same scale. Normalization does that for the numbers flowing between layers.' },
      ],
    },
    {
      id: 'why-normalization',
      title: 'Why do we need normalization?',
      blocks: [
        { type: 'p', text: 'In a deep network, each layer\'s output is the next layer\'s input. As weights change during training, the range of these activations can drift: some grow large, some shrink towards zero. That causes several problems:' },
        { type: 'list', items: [
          '**Unstable gradients.** Very large or very small activations lead to exploding or vanishing gradients, especially through saturating activations like sigmoid and tanh.',
          '**Sensitivity to the learning rate.** If scales vary wildly, a learning rate that suits one layer is too big for another. Normalized networks tolerate larger learning rates and train faster.',
          '**Sensitivity to initialisation.** Without normalization, deep networks only train if the initial weights are chosen very carefully.',
          '**A moving target.** Each layer must keep adapting to the changing distribution of its inputs. The BatchNorm paper called this *internal covariate shift*. Later research questioned whether that is the real reason BatchNorm helps and argued it mainly makes the loss landscape smoother. Either way, the practical benefit is well established.',
        ] },
        { type: 'p', text: 'Normalization layers address all of these by resetting activations to a standard scale at chosen points in the network.' },
      ],
    },
    {
      id: 'batch-normalization',
      title: 'What is Batch Normalization?',
      blocks: [
        { type: 'p', text: '**Batch Normalization (BatchNorm, BN)** was introduced by Sergey Ioffe and Christian Szegedy in 2015. For each **feature** (each neuron output, or each channel in a convolutional network) it computes the mean and variance **across all the examples in the current mini-batch**, and normalizes that feature with them.' },
        { type: 'p', text: 'Picture the activations as a table: rows are examples in the batch, columns are features. BatchNorm normalizes **down each column**. Feature 2 of example 1 is compared with feature 2 of the other examples in the batch.' },
        { type: 'steps', title: 'BatchNorm, step by step', items: [
          { title: 'Collect a column', text: 'For feature j, gather its value from every example in the mini-batch (for a CNN, also from every spatial position).' },
          { title: 'Batch statistics', text: 'Compute that column\'s mean μⱼ and variance σⱼ².' },
          { title: 'Normalize', text: 'x̂ = (x − μⱼ) / √(σⱼ² + ε) for every value in the column.' },
          { title: 'Scale and shift', text: 'y = γⱼ · x̂ + βⱼ with the feature\'s learned parameters.' },
          { title: 'Track running statistics', text: 'Update an exponential moving average of μⱼ and σⱼ² (PyTorch uses momentum 0.1 by default). These are saved with the model.' },
          { title: 'At inference', text: 'Use the saved running mean and variance instead of batch statistics, so a single example\'s output does not depend on whatever else is in its batch.' },
        ] },
        { type: 'p', text: 'That last step is BatchNorm\'s biggest quirk: it **behaves differently in training and inference**. During training an example\'s output depends on the other examples in its mini-batch. This creates a mild regularising noise (useful), but also problems when batches are small or when training and test data differ.' },
      ],
    },
    {
      id: 'layer-normalization',
      title: 'What is Layer Normalization?',
      blocks: [
        { type: 'p', text: '**Layer Normalization (LayerNorm, LN)** was proposed by Jimmy Ba, Jamie Kiros and Geoffrey Hinton in 2016. It computes the mean and variance **across the features of a single example**, and normalizes that example with its own statistics. In our table, it normalizes **across each row**.' },
        { type: 'p', text: 'In a Transformer, every token has a hidden vector of, say, 768 numbers. LayerNorm takes those 768 numbers for one token, computes their mean and variance, and normalizes them. Each token in each sequence is handled independently. The learned `γ` and `β` still have one value per feature (768 each).' },
        { type: 'p', text: 'Because the statistics come from the example itself, LayerNorm does **exactly the same thing in training and inference**, needs no running averages, and works with any batch size, including 1. It also handles sequences of different lengths naturally, since each token is normalized on its own.' },
        { type: 'viz', name: 'normalization', caption: 'Switch between BatchNorm and LayerNorm and watch which axis of the batch × features grid gets grouped for the mean and variance. (RMSNorm is the topic of the next lesson.)' },
        { type: 'check', question: 'A Transformer processes a batch of 8 sequences × 128 tokens with hidden size 512. How many separate mean/variance pairs does LayerNorm compute in one layer?', answer: 'One per token: 8 × 128 = **1,024** pairs, each over 512 numbers. BatchNorm on the same tensor (treating hidden units as features) would instead compute 512 pairs, each over the 1,024 token positions.' },
      ],
    },
    {
      id: 'code',
      title: 'Both, side by side in code',
      blocks: [
        { type: 'p', text: 'The two functions below differ in a single argument: `axis=0` (down the columns, BatchNorm) versus `axis=1` (across the rows, LayerNorm). The last two lines show what happens with a batch of one example.' },
        { type: 'code', lang: 'python', title: 'bn_vs_ln.py', code: `import numpy as np

# A mini-batch: 4 examples (rows) x 3 features (columns)
X = np.array([[1.0, 200.0, 0.5],
              [2.0, 220.0, 0.1],
              [3.0, 180.0, 0.9],
              [4.0, 240.0, 0.3]])
eps = 1e-5
gamma, beta = np.ones(3), np.zeros(3)      # learnable scale and shift

def batch_norm(X):
    mu = X.mean(axis=0)                    # one mean per FEATURE (down columns)
    var = X.var(axis=0)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

def layer_norm(X):
    mu = X.mean(axis=1, keepdims=True)     # one mean per EXAMPLE (across a row)
    var = X.var(axis=1, keepdims=True)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

np.set_printoptions(precision=2, suppress=True)
B, L = batch_norm(X), layer_norm(X)
print("BatchNorm output:\\n", B)
print("  column means", B.mean(axis=0).round(2) + 0, " column stds", B.std(axis=0))
print("LayerNorm output:\\n", L)
print("  row means   ", L.mean(axis=1).round(2) + 0, " row stds   ", L.std(axis=1))

# Batch of ONE example: BatchNorm has nothing to compare against
one = X[:1]
print("BatchNorm, batch size 1:", batch_norm(one))
print("LayerNorm, batch size 1:", layer_norm(one))`, output: `BatchNorm output:
 [[-1.34 -0.45  0.17]
 [-0.45  0.45 -1.18]
 [ 0.45 -1.34  1.52]
 [ 1.34  1.34 -0.51]]
  column means [0. 0. 0.]  column stds [1. 1. 1.]
LayerNorm output:
 [[-0.7   1.41 -0.71]
 [-0.7   1.41 -0.72]
 [-0.69  1.41 -0.72]
 [-0.69  1.41 -0.72]]
  row means    [0. 0. 0. 0.]  row stds    [1. 1. 1. 1.]
BatchNorm, batch size 1: [[0. 0. 0.]]
LayerNorm, batch size 1: [[-0.7   1.41 -0.71]]`, walkthrough: [
          { lines: [3, 9], note: 'Four examples with three features on very different scales (around 2, around 200, around 0.5). γ and β start at their default values 1 and 0.' },
          { lines: [11, 14], note: 'BatchNorm: statistics over axis 0, so each feature is compared across the batch.' },
          { lines: [16, 19], note: 'LayerNorm: statistics over axis 1, so each example is compared with itself.' },
          { lines: [21, 26], note: 'After BatchNorm every column has mean 0 and std 1. After LayerNorm every row does.' },
          { lines: [28, 31], note: 'With one example, every BatchNorm column has zero variance, so everything collapses to 0 (the information is lost). LayerNorm is unaffected.' },
        ] },
        { type: 'p', text: 'Look at the LayerNorm rows. They are almost identical, because the big feature (≈ 200) dominates every row\'s mean and variance. This is a useful warning: LayerNorm assumes the features of one example are *comparable*, which is true for hidden units inside a network, but not for raw input columns measured in different units. BatchNorm, by normalizing each feature separately, handled the mixed scales well.' },
        { type: 'matrix', title: 'BatchNorm output (each column now has mean 0, std 1)', rows: ['Example 1', 'Example 2', 'Example 3', 'Example 4'], cols: ['Feature 1', 'Feature 2', 'Feature 3'], values: [[-1.34, -0.45, 0.17], [-0.45, 0.45, -1.18], [0.45, -1.34, 1.52], [1.34, 1.34, -0.51]], caption: 'Values from the run above. Compare columns: each is centred and scaled independently.' },
      ],
    },
    {
      id: 'comparison',
      title: 'Batch Normalization vs Layer Normalization',
      blocks: [
        { type: 'compare', title: 'BatchNorm vs LayerNorm', options: [
          { name: 'Batch Normalization', summary: 'Statistics per feature, computed across the examples of a mini-batch.', pros: ['Excellent for CNNs with decent batch sizes', 'Mild regularising effect from batch noise', 'At inference it can be folded into the preceding convolution for free'], cons: ['Depends on batch size; poor with small batches', 'Different behaviour in training and inference', 'Awkward for variable-length sequences and RNNs', 'Needs extra care in distributed training (synchronising statistics)'], bestFor: 'Convolutional networks for images, trained with large batches' },
          { name: 'Layer Normalization', summary: 'Statistics per example, computed across its own features.', pros: ['Independent of batch size, works with batch size 1', 'Identical in training and inference', 'Natural for sequences, RNNs and Transformers'], cons: ['Assumes features within an example are comparable', 'No batch-noise regularisation', 'Often slightly worse than BatchNorm for CNNs'], bestFor: 'Transformers (all modern LLMs), RNNs, small-batch training' },
        ], rows: [
          ['Normalizes over', 'Batch dimension (per feature)', 'Feature dimension (per example)'],
          ['Statistics depend on other examples?', 'Yes', 'No'],
          ['Running averages for inference', 'Yes', 'No'],
          ['Works with batch size 1', 'No (or badly)', 'Yes'],
          ['Learned parameters', 'γ, β per feature/channel', 'γ, β per feature'],
        ], verdict: 'Images with big batches: BatchNorm. Sequences and Transformers: LayerNorm (or its simpler cousin RMSNorm).' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use which one?',
      blocks: [
        { type: 'flow', title: 'A quick decision guide', nodes: [
          { label: 'What is the model?', detail: 'Start by asking what kind of architecture and data you have.' },
          { label: 'CNN on images?', detail: 'If yes and you can afford batch sizes of roughly 16 or more per device, BatchNorm is the classic choice (e.g. ResNet).' },
          { label: 'Small batches?', detail: 'If batches are tiny (detection, segmentation, huge images), BatchNorm statistics get noisy. Consider GroupNorm, which normalizes groups of channels within each example.' },
          { label: 'Sequences or Transformer?', detail: 'Use LayerNorm, or RMSNorm as in many modern LLMs. Each token is normalized on its own.' },
          { label: 'Check train vs eval', detail: 'With BatchNorm, always switch to evaluation mode for inference so running statistics are used.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'ResNet and many classic image models place BatchNorm after almost every convolution. The original Transformer, BERT and GPT-2 use LayerNorm. GPT-2 moved LayerNorm to the start of each sub-layer ("pre-norm") rather than after the residual addition ("post-norm"), which makes deep Transformers more stable to train; pre-norm is now the common choice. Many recent LLMs replaced LayerNorm with RMSNorm, covered next.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Running inference with a BatchNorm model still in training mode: predictions then depend on the batch and can change wildly for a single example. Training BatchNorm with tiny batches (e.g. 2) and wondering why results are noisy. Fine-tuning with a very different data distribution and forgetting that BatchNorm\'s running statistics also need updating or freezing deliberately. And applying LayerNorm to raw features measured in different units.' },
        { type: 'check', question: 'You fine-tune an image model that uses BatchNorm, but your GPU only fits a batch size of 2. What two options could you consider?', answer: 'Freeze the BatchNorm layers (keep their pretrained running statistics and parameters fixed, using evaluation-mode behaviour), or replace them with a batch-independent alternative such as GroupNorm. Gradient accumulation alone does not help, because BatchNorm statistics are still computed over each tiny batch.' },
      ],
    },
    {
      id: 'running-statistics-example',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'We said BatchNorm keeps an exponential moving average of the mean and variance for use at inference. Let us follow that average with real numbers, because it is the source of the most confusing BatchNorm bugs.' },
        { type: 'p', text: 'Take one feature whose true mean is 10. The running mean starts at 0 (the default) and the momentum is 0.1. Each training batch updates it with `running ← 0.9 · running + 0.1 · batch_mean`. To keep it simple, suppose every batch mean is exactly 10.' },
        { type: 'steps', title: 'The running mean warming up', items: [
          { title: 'Batch 1', text: '`0.9 · 0 + 0.1 · 10 = 1.0`. After one batch the stored mean is still 9 away from the truth.' },
          { title: 'Batch 2', text: '`0.9 · 1.0 + 0.1 · 10 = 1.9`.' },
          { title: 'Batch 3', text: '`0.9 · 1.9 + 0.1 · 10 = 2.71`. Each update closes one tenth of the remaining gap.' },
          { title: 'The pattern', text: 'After `n` batches the running mean is `10 · (1 − 0.9ⁿ)`. The gap shrinks by a factor of 0.9 per batch.' },
          { title: 'How long until it is right?', text: 'After 10 batches: 6.51. After 22 batches: 9.02. After 44 batches: 9.90. It takes dozens of batches before inference statistics can be trusted.' },
        ] },
        { type: 'chart', kind: 'line', title: 'Running mean vs the batch mean it is chasing', xLabel: 'Training batches seen', yLabel: 'Mean', series: [
          { name: 'Running mean (used at inference)', points: [[0, 0], [1, 1], [2, 1.9], [3, 2.71], [5, 4.095], [10, 6.513], [22, 9.015], [44, 9.903]] },
          { name: 'Batch mean (used in training)', points: [[0, 10], [44, 10]] },
        ], caption: 'Exact values of 10 · (1 − 0.9ⁿ). Training mode uses the flat line; evaluation mode uses the rising curve.' },
        { type: 'p', text: 'Now the consequence. In training mode the value 12 is normalized with the batch mean 10, so it comes out a little above zero. In evaluation mode after only three batches, the same 12 is normalized with the stored mean 2.71 and comes out far above zero. The layers after it have never seen such numbers.' },
        { type: 'table', caption: 'Symptoms that point to running statistics', head: ['What we see', 'Likely cause', 'What to check'], rows: [
          ['Good training loss, terrible validation loss in the first few hundred steps', 'Running statistics have not caught up yet', 'Validate again later; compare with a run in training mode'],
          ['A fine-tuned model is worse in evaluation mode than in training mode', 'Stored statistics still describe the old data', 'Let them update on the new data, or freeze the layers on purpose'],
          ['Results change with the batch size at inference', 'The model is still in training mode', 'Switch to evaluation mode'],
        ] },
        { type: 'p', text: 'LayerNorm has none of these problems. It stores no statistics, so there is nothing to warm up and nothing to go stale.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We build a tiny BatchNorm for a single feature, with a training mode and an evaluation mode. Then we watch two things: how the same value gets different outputs depending on its batch mates, and how the running statistics slowly become usable.' },
        { type: 'code', lang: 'python', title: 'practice_batchnorm_modes.py', code: `import numpy as np

class BatchNorm1Feature:
    """BatchNorm for a single feature, without the learned scale and shift."""
    def __init__(self, momentum=0.1, eps=1e-5):
        self.run_mean, self.run_var = 0.0, 1.0    # starting values
        self.momentum, self.eps = momentum, eps
        self.training = True

    def __call__(self, x):
        if self.training:                         # use this batch's statistics
            mean, var = x.mean(), x.var()
            m = self.momentum                     # and update the running ones
            self.run_mean = (1 - m) * self.run_mean + m * mean
            self.run_var = (1 - m) * self.run_var + m * var
        else:                                     # use the stored statistics
            mean, var = self.run_mean, self.run_var
        return (x - mean) / np.sqrt(var + self.eps)

rng = np.random.default_rng(0)
bn = BatchNorm1Feature()

# 1) Training mode: the same value 12.0 with two different sets of batch mates
print("train, mates 8 and 10 :", bn(np.array([12.0, 8.0, 10.0])).round(2))
print("train, mates 14 and 16:", bn(np.array([12.0, 14.0, 16.0])).round(2))

# 2) Feed batches drawn around mean 10, std 2, then test 12.0 in eval mode
bn = BatchNorm1Feature()
for step in range(1, 101):
    bn.training = True
    bn(rng.normal(10.0, 2.0, size=32))
    if step in (1, 5, 20, 100):
        bn.training = False
        out = bn(np.array([12.0]))[0]
        print(f"after {step:3d} batches: run_mean={bn.run_mean:5.2f} "
              f"run_var={bn.run_var:4.2f}  eval(12.0)={out:5.2f}")`, output: `train, mates 8 and 10 : [ 1.22 -1.22  0.  ]
train, mates 14 and 16: [-1.22  0.    1.22]
after   1 batches: run_mean= 0.97 run_var=1.16  eval(12.0)=10.26
after   5 batches: run_mean= 4.10 run_var=2.07  eval(12.0)= 5.48
after  20 batches: run_mean= 8.75 run_var=3.50  eval(12.0)= 1.74
after 100 batches: run_mean= 9.99 run_var=4.15  eval(12.0)= 0.98`, walkthrough: [
          { lines: [5, 8], note: 'The layer starts with a running mean of 0 and a running variance of 1, and in training mode.' },
          { lines: [10, 18], note: 'The whole layer. In training mode it normalizes with the batch statistics and nudges the running ones towards them. In evaluation mode it only reads the stored values.' },
          { lines: [23, 25], note: 'The value 12.0 is the largest in the first batch and the smallest in the second, so it comes out as +1.22 and then −1.22. Its output depends on its neighbours.' },
          { lines: [27, 36], note: 'The data has mean 10 and standard deviation 2, so the right answer for 12.0 is (12 − 10) / 2 = 1. After 1 batch evaluation mode says 10.26. Only after about 100 batches does it settle near 1.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Create the second layer with `BatchNorm1Feature(momentum=0.5)`. Predict how the `after 5 batches` line changes. Then think about the price: with a large momentum, what does one unusual batch do to the stored statistics?',
          'Change `size=32` to `size=2`. The true variance is 4. Predict whether `run_var` still ends near 4, and whether `eval(12.0)` ends above or below 1.',
          'After the loop, evaluate `bn(np.array([22.0]))`, a typical-plus-one-std value from new data centred on 20. Predict the output, and say what it tells us about using old running statistics on data that has shifted.',
        ] },
        { type: 'check', question: 'In training mode the value 12.0 came out as +1.22 with one set of batch mates and −1.22 with another. Is that a bug in our layer?', answer: 'No, it is BatchNorm doing exactly what it is defined to do. In training mode the output says where a value sits **relative to its batch**: 12 is the top of [12, 8, 10] and the bottom of [12, 14, 16]. This is why an example\'s output depends on its mini-batch during training, and why inference must switch to fixed, stored statistics to give one stable answer per input.' },
        { type: 'check', question: 'After one batch, evaluation mode turns 12.0 into 10.26, although the correct normalized value is about 1. A teammate concludes that the model is broken. What would we tell them?', answer: 'The model is fine; the stored statistics are not ready. After one batch the running mean is 0.97 instead of 10 and the running variance 1.16 instead of 4, so (12 − 0.97) / √1.16 is about 10. The running averages move only a tenth of the way per batch. Evaluate after more training steps, and the same input gives about 1.' },
      ],
    },
  ],
  quiz: [
    { q: 'For an activation table with rows = examples and columns = features, which statement is correct?', options: ['BatchNorm normalizes each row; LayerNorm normalizes each column', 'Both normalize the whole table with one mean and variance', 'BatchNorm normalizes each column; LayerNorm normalizes each row', 'LayerNorm normalizes only the first feature column of each row'], answer: 2, explain: 'BatchNorm computes per-feature statistics across the examples (down columns). LayerNorm computes per-example statistics across features (along rows). Option one swaps them.' },
    { q: 'You deploy a model and call it on one image at a time. Which layer must use stored running statistics to behave correctly?', options: ['LayerNorm', 'BatchNorm', 'Both equally', 'Neither, because normalization is removed at inference'], answer: 1, explain: 'BatchNorm needs the running mean and variance collected during training, since a single example has no batch statistics. LayerNorm computes statistics from the example itself and has no running averages.' },
    { q: 'Normalize [2, 4, 6] with γ = 1, β = 0 (ignore ε). What is the normalized value of 6?', options: ['1.0', '0.5', '2.0', 'About 1.22'], answer: 3, explain: 'Mean = 4, variance = (4 + 0 + 4)/3 = 8/3, std ≈ 1.633. (6 − 4)/1.633 ≈ 1.22. Choosing 1.0 forgets to divide by the standard deviation and instead divides by the range half-width.' },
    { q: 'Why do Transformers use LayerNorm rather than BatchNorm?', options: ['It normalizes each token alone, so batch size and padding do not matter', 'LayerNorm has no learnable parameters, so it is cheaper to train', 'BatchNorm cannot be differentiated, so it cannot be used inside attention blocks', 'LayerNorm makes the model smaller, which matters at Transformer scale'], answer: 0, explain: 'Per-token statistics avoid dependence on batch composition, padding and sequence length. LayerNorm does have learnable γ and β, and BatchNorm is perfectly differentiable.' },
    { q: 'Which statement is a misconception?', options: ['The learned γ and β let the network undo normalization if that helps', 'BatchNorm\'s training behaviour depends on the other examples in the mini-batch', 'Normalization layers remove the network\'s ability to represent large activations', 'GroupNorm is an option when batches are too small for BatchNorm'], answer: 2, explain: 'Because of the learned scale γ and shift β, a normalization layer can output any mean and scale it needs; capacity is not removed. The other statements are correct.' },
  ],
  takeaways: [
    'Normalization subtracts a mean, divides by a standard deviation, then applies a learned scale γ and shift β.',
    'BatchNorm: statistics per feature across the mini-batch; uses running averages at inference.',
    'LayerNorm: statistics per example across its features; identical in training and inference.',
    'BatchNorm suits CNNs with reasonable batch sizes; LayerNorm suits Transformers, RNNs and small batches.',
    'Always use evaluation mode for BatchNorm at inference, and never LayerNorm raw features of different units.',
  ],
  terms: [
    { term: 'Normalization', def: 'Rescaling a group of values to mean 0 and standard deviation 1, then applying a learned scale and shift.' },
    { term: 'Batch Normalization', def: 'Normalizing each feature using the mean and variance across the examples of a mini-batch.' },
    { term: 'Layer Normalization', def: 'Normalizing each example using the mean and variance across its own features.' },
    { term: 'Running statistics', def: 'Moving averages of BatchNorm\'s mean and variance collected during training and used at inference.' },
    { term: 'γ and β', def: 'Learned per-feature scale and shift applied after normalization.' },
    { term: 'GroupNorm', def: 'A batch-independent variant that normalizes groups of channels within each example.' },
  ],
};
