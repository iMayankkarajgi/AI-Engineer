export default {
  id: 'batch-normalization-vs-layer-normalization',
  minutes: 18,
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
