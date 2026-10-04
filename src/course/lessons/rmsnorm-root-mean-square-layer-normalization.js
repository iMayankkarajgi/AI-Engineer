export default {
  id: 'rmsnorm-root-mean-square-layer-normalization',
  minutes: 17,
  hook: 'Most modern open LLMs quietly deleted half of LayerNorm, the mean subtraction and the bias, and trained just as well. Why does the simpler version work?',
  summary: 'RMSNorm normalizes a vector by dividing it by its root mean square, `x / √(mean(x²) + ε)`, then multiplies by a learned scale γ. Unlike LayerNorm it does not subtract the mean and has no shift β. It keeps the property that matters most, control over the scale of activations, while being simpler and somewhat cheaper, which is why many modern LLMs such as the Llama family use it.',
  sections: [
    {
      id: 'why-normalization',
      title: 'Why normalization is needed in deep networks',
      blocks: [
        { type: 'p', text: 'A large language model is a tall stack of identical blocks, often dozens of layers deep. Each block adds its output to a running vector called the **residual stream**. If the size of those vectors drifts, growing a little in one layer and a little more in the next, activations can explode or shrink towards zero, and gradients follow. Training then becomes unstable: the loss spikes, or the model needs a tiny learning rate to survive.' },
        { type: 'p', text: '**Normalization layers** fix this by rescaling each token\'s vector to a standard size before it enters the next computation. In the previous lesson we met BatchNorm and LayerNorm. Transformers use per-token normalization because it does not depend on the batch. This lesson is about the leaner per-token normalizer that most recent LLMs chose: **RMSNorm**.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a volume limiter', text: 'A radio station runs every song through a limiter so nothing is painfully loud or inaudibly quiet. The limiter only adjusts the *loudness*; it does not shift the music\'s pitch. LayerNorm is like a limiter that also re-centres the pitch. RMSNorm is the plain limiter: it only fixes the volume, and it turns out that is the part deep networks really need.' },
      ],
    },
    {
      id: 'layernorm-recap',
      title: 'A quick recap of Layer Normalization (LayerNorm)',
      blocks: [
        { type: 'p', text: 'For one token\'s hidden vector `x` with `d` numbers, LayerNorm does two things: **re-centring** (subtract the mean so the values average to 0) and **re-scaling** (divide by the standard deviation so they have spread 1). Then it applies a learned per-feature scale `γ` and shift `β`.' },
        { type: 'formula', expr: 'μ = (1/d) ∑ᵢ xᵢ     σ² = (1/d) ∑ᵢ (xᵢ − μ)²     LayerNorm(x)ᵢ = γᵢ · (xᵢ − μ) / √(σ² + ε) + βᵢ', where: [['d', 'the hidden size (number of features per token), e.g. 4096'], ['μ, σ²', 'mean and variance of this one vector'], ['ε', 'small constant for numerical safety, e.g. 10⁻⁵ or 10⁻⁶'], ['γ, β', 'learned scale and shift, d numbers each']] },
        { type: 'p', text: 'Computing this needs two passes over the vector (first the mean, then the variance around that mean) and stores `2d` learned parameters per layer.' },
      ],
    },
    {
      id: 'what-is-rmsnorm',
      title: 'What RMSNorm is and how it works',
      blocks: [
        { type: 'p', text: '**RMSNorm** (Root Mean Square Layer Normalization) was proposed by Biao Zhang and Rico Sennrich in 2019. Their idea: the benefit of LayerNorm comes mainly from **re-scaling**, not re-centring. So drop the mean, drop `β`, and scale the vector by its **root mean square (RMS)**: the square root of the average of the squared values. The RMS is a measure of a vector\'s typical magnitude; it equals the vector\'s length divided by √d.' },
        { type: 'formula', expr: 'RMS(x) = √( (1/d) ∑ᵢ xᵢ² + ε )        RMSNorm(x)ᵢ = γᵢ · xᵢ / RMS(x)', where: [['xᵢ²', 'each value squared, so negatives count as much as positives'], ['(1/d) ∑ᵢ xᵢ²', 'the mean of the squares'], ['RMS(x)', 'the root mean square, the vector\'s typical size'], ['γᵢ', 'learned per-feature scale, initialised to 1']], caption: 'One statistic, one learned vector. If the mean of x happens to be 0, RMS equals the standard deviation and RMSNorm equals LayerNorm without β.' },
        { type: 'steps', title: 'RMSNorm on one token vector', items: [
          { title: 'Square', text: 'Square every value of the vector.' },
          { title: 'Average', text: 'Take the mean of the squares.' },
          { title: 'Root', text: 'Add ε and take the square root. This is RMS(x).' },
          { title: 'Divide', text: 'Divide every value by RMS(x). The vector now has RMS 1, but its direction is unchanged.' },
          { title: 'Scale', text: 'Multiply element-wise by the learned γ so the model can give each feature its preferred size.' },
        ] },
        { type: 'p', text: 'Geometrically, RMSNorm keeps the **direction** of the vector and resets its **length** to √d (before γ). LayerNorm additionally moves the vector so its components average to zero, which changes the direction too.' },
      ],
    },
    {
      id: 'numeric-example',
      title: 'The math behind RMSNorm with a concrete numeric example',
      blocks: [
        { type: 'p', text: 'Take a tiny token vector with `d = 4`: `x = [1, 2, 3, 4]`, with `γ = [1, 1, 1, 1]` and ignore ε.' },
        { type: 'table', caption: 'RMSNorm and LayerNorm on x = [1, 2, 3, 4], step by step', head: ['Step', 'RMSNorm', 'LayerNorm'], rows: [
          ['Statistic 1', 'mean of squares = (1 + 4 + 9 + 16)/4 = 7.5', 'mean μ = (1 + 2 + 3 + 4)/4 = 2.5'],
          ['Statistic 2', '(none needed)', 'variance = (2.25 + 0.25 + 0.25 + 2.25)/4 = 1.25'],
          ['Divisor', 'RMS = √7.5 ≈ 2.739', 'std = √1.25 ≈ 1.118'],
          ['Centre?', 'No', 'Subtract 2.5: [−1.5, −0.5, 0.5, 1.5]'],
          ['Result', '[0.365, 0.730, 1.095, 1.461]', '[−1.342, −0.447, 0.447, 1.342]'],
        ] },
        { type: 'p', text: 'Check the RMSNorm result: squares are 0.133 + 0.533 + 1.2 + 2.133 = 4.0, mean 1.0, so RMS = 1. The values keep their signs and their ratios (1 : 2 : 3 : 4). LayerNorm\'s output, in contrast, is centred at zero.' },
        { type: 'chart', kind: 'bar', title: 'The same vector after each normalizer', yLabel: 'Value', labels: ['x₁', 'x₂', 'x₃', 'x₄'], series: [
          { name: 'Input x', values: [1, 2, 3, 4] },
          { name: 'RMSNorm', values: [0.365, 0.73, 1.095, 1.461] },
          { name: 'LayerNorm', values: [-1.342, -0.447, 0.447, 1.342] },
        ], caption: 'Exact values from the example. RMSNorm shrinks the vector but keeps its shape; LayerNorm also shifts it to be centred on zero.' },
        { type: 'check', question: 'What is RMSNorm([3, −4]) with γ = 1 (ignore ε)?', answer: 'Mean of squares = (9 + 16)/2 = 12.5, RMS = √12.5 ≈ 3.536. Result ≈ **[0.849, −1.131]**. Note that the signs survive, and the result has RMS 1.' },
      ],
    },
    {
      id: 'differences',
      title: 'LayerNorm vs RMSNorm: the key differences',
      blocks: [
        { type: 'compare', title: 'LayerNorm vs RMSNorm', options: [
          { name: 'LayerNorm', summary: 'Subtract the mean, divide by the standard deviation, then γ·x̂ + β.', pros: ['Output is centred and scaled', 'Invariant to adding a constant to every input', 'Long track record (original Transformer, BERT, GPT-2/3)'], cons: ['Two statistics, two reductions over the vector', '2d parameters per layer'], bestFor: 'Existing architectures that were trained with it; cases where centring matters' },
          { name: 'RMSNorm', summary: 'Divide by the root mean square, then γ·x̂. No mean, no β.', pros: ['One statistic: simpler and somewhat faster', 'd parameters per layer', 'Empirically matches LayerNorm quality in Transformers'], cons: ['Not invariant to shifts of the input', 'Output is not centred'], bestFor: 'New Transformer and LLM designs (Llama family, Mistral, T5 and many others)' },
        ], rows: [
          ['Statistics computed', 'Mean and variance', 'Mean of squares only'],
          ['Learned parameters', 'γ and β (2d)', 'γ only (d)'],
          ['Scale invariant (x → c·x)?', 'Yes', 'Yes'],
          ['Shift invariant (x → x + c)?', 'Yes', 'No'],
          ['Equal when?', 'Input already has mean 0 and β = 0', 'Input already has mean 0'],
        ], verdict: 'Same purpose, same place in the network. RMSNorm keeps scale control and drops the rest.' },
        { type: 'p', text: '**Scale invariance** means multiplying the input by any positive constant gives the same output: `RMSNorm(10x) = RMSNorm(x)`. This is the property that keeps activations from blowing up layer after layer, and both normalizers have it. **Shift invariance** means adding a constant to every element gives the same output; only LayerNorm has this, and in practice LLMs do not seem to need it.' },
      ],
    },
    {
      id: 'why-llms-prefer',
      title: 'Why modern LLMs prefer RMSNorm',
      blocks: [
        { type: 'list', items: [
          '**It works as well.** In the original paper and in many later models, replacing LayerNorm with RMSNorm gave comparable quality. The re-scaling part is what stabilises training.',
          '**It is cheaper.** One reduction instead of two, no mean subtraction, no bias add. The original paper reported noticeable speed-ups over LayerNorm, with the size depending on the model and implementation. The normalization is a small part of total compute, but it runs at every layer for every token, and in memory-bound GPU kernels every saved pass over the data helps.',
          '**Fewer parameters and simpler code.** Half the learnable vectors, simpler fused kernels, and less to go wrong in mixed-precision training.',
          '**Design momentum.** Once strong open models adopted it (T5 used an RMS-style norm; the Llama family made RMSNorm with pre-normalization a popular template), later models copied the recipe. Many current open-weight LLMs, including Mistral, Qwen and Gemma models, use RMSNorm; exact details such as ε and how γ is parameterised vary by model.',
        ] },
        { type: 'callout', tone: 'note', title: 'Honest caveat', text: 'RMSNorm\'s advantage over LayerNorm is modest and practical, not dramatic. Some models still use LayerNorm successfully, and the speed difference depends heavily on hardware and kernel implementation. Treat "RMSNorm is the modern default" as a strong trend, not a law.' },
      ],
    },
    {
      id: 'code',
      title: 'A code example',
      blocks: [
        { type: 'p', text: 'Here are both normalizers in numpy, applied to our example vector, plus checks of the invariance properties and the parameter counts for a 4,096-wide model (a typical hidden size for a model of about 7 billion parameters).' },
        { type: 'code', lang: 'python', title: 'rmsnorm.py', code: `import numpy as np

def layer_norm(x, gamma, beta, eps=1e-6):
    mu = x.mean(-1, keepdims=True)                 # 1) mean
    var = ((x - mu) ** 2).mean(-1, keepdims=True)  # 2) variance around the mean
    return gamma * (x - mu) / np.sqrt(var + eps) + beta

def rms_norm(x, gamma, eps=1e-6):
    rms = np.sqrt((x ** 2).mean(-1, keepdims=True) + eps)  # only one statistic
    return gamma * x / rms                         # no mean subtraction, no beta

np.set_printoptions(precision=3, suppress=True)
x = np.array([1.0, 2.0, 3.0, 4.0])                 # one token's hidden vector, d = 4
d = len(x)
g, b = np.ones(d), np.zeros(d)
print("RMS of x      :", round(float(np.sqrt((x ** 2).mean())), 4))
print("RMSNorm(x)    :", rms_norm(x, g))
print("LayerNorm(x)  :", layer_norm(x, g, b))

# Invariance checks
print("RMSNorm(10x)  :", rms_norm(10 * x, g), "<- same: scale invariant")
print("RMSNorm(x+5)  :", rms_norm(x + 5, g), "<- changes: not shift invariant")
print("LayerNorm(x+5):", layer_norm(x + 5, g, b), "<- same: shift invariant")

# Learnable parameters per normalization layer for a 4096-wide model
d_model = 4096
print(f"params per layer  LayerNorm={2 * d_model}  RMSNorm={d_model}")`, output: `RMS of x      : 2.7386
RMSNorm(x)    : [0.365 0.73  1.095 1.461]
LayerNorm(x)  : [-1.342 -0.447  0.447  1.342]
RMSNorm(10x)  : [0.365 0.73  1.095 1.461] <- same: scale invariant
RMSNorm(x+5)  : [0.791 0.923 1.055 1.187] <- changes: not shift invariant
LayerNorm(x+5): [-1.342 -0.447  0.447  1.342] <- same: shift invariant
params per layer  LayerNorm=8192  RMSNorm=4096`, walkthrough: [
          { lines: [3, 6], note: 'LayerNorm: compute the mean, then the variance around the mean, then centre, scale, apply γ and β.' },
          { lines: [8, 10], note: 'RMSNorm: one statistic (mean of squares), divide, multiply by γ. That is the whole layer.' },
          { lines: [12, 18], note: 'Our worked example. RMS(x) = 2.7386 and the outputs match the hand calculation in the table.' },
          { lines: [20, 23], note: 'Scaling x by 10 leaves RMSNorm unchanged. Adding 5 changes RMSNorm but not LayerNorm, because only LayerNorm subtracts the mean.' },
          { lines: [25, 27], note: 'RMSNorm has half as many learned parameters: γ only, no β.' },
        ] },
        { type: 'p', text: 'In PyTorch, recent versions ship a built-in `torch.nn.RMSNorm` layer, and many model codebases also define their own few-line version that computes `x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + eps) * weight`, often doing the computation in 32-bit floats for stability even when the model runs in 16-bit.' },
      ],
    },
    {
      id: 'in-transformer',
      title: 'Where RMSNorm fits in a Transformer',
      blocks: [
        { type: 'p', text: 'In a modern decoder-only LLM, RMSNorm is used in the **pre-norm** arrangement: the input to each sub-layer is normalized, but the residual stream itself is left untouched. One block looks like this:' },
        { type: 'formula', expr: 'h = x + Attention(RMSNorm₁(x))        out = h + FFN(RMSNorm₂(h))', caption: 'Each block has two RMSNorms with their own γ. A final RMSNorm is applied once more after the last block, before the output layer that predicts the next token.' },
        { type: 'flow', title: 'One pre-norm Transformer block', nodes: [
          { label: 'Residual stream x', detail: 'The running vector for each token. It is never normalized directly, so information and gradients flow freely along it.' },
          { label: 'RMSNorm', detail: 'Rescale a copy of x to RMS 1, times γ, before attention.' },
          { label: 'Self-attention', detail: 'Mix information between tokens. Its output is added back to x.' },
          { label: 'RMSNorm', detail: 'A second RMSNorm with its own γ, before the feed-forward network.' },
          { label: 'Feed-forward', detail: 'Per-token MLP (e.g. SwiGLU in Llama-style models). Output added to the residual stream; on to the next block.' },
        ] },
        { type: 'p', text: 'Some recent models also apply RMSNorm to the query and key vectors inside attention ("QK-norm") to stop attention scores growing too large; whether a given model does this varies.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Forgetting ε, which turns an all-zero vector into a division by zero. Computing the mean of squares in 16-bit floats, where squaring large values can overflow; implementations usually upcast to 32-bit. Loading weights from a model whose γ is stored as an offset (some models multiply by `1 + γ`) into code that multiplies by `γ` directly, which silently breaks the model. And assuming RMSNorm subtracts the mean: it does not.' },
        { type: 'check', question: 'A teammate swaps LayerNorm for RMSNorm in an already-trained model without retraining. Will the outputs be the same?', answer: 'Generally **no**. The trained weights expect centred outputs plus a learned β. RMSNorm skips both, so the activations differ unless every input already had mean 0 and β was 0. Switching normalizers is an architecture change that needs (re)training.' },
      ],
    },
    {
      id: 'summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', items: [
          'Deep Transformers need per-token normalization to keep activations at a stable scale.',
          'LayerNorm re-centres and re-scales, with learned γ and β.',
          'RMSNorm only re-scales: x / √(mean(x²) + ε) · γ. No mean, no β.',
          'Both are scale invariant; only LayerNorm is shift invariant, which LLMs seem not to need.',
          'RMSNorm is simpler, has half the parameters and is somewhat cheaper; it is the common choice in modern open LLMs, placed before attention, before the FFN, and once at the end.',
        ] },
        { type: 'viz', name: 'normalization', caption: 'Switch to RMSNorm: it uses the same per-token axis as LayerNorm but skips the mean, so the outputs are not centred.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does RMSNorm compute for a token vector x?', options: ['x minus its mean, divided by its standard deviation, then γ·x̂ + β', 'x divided by its root mean square, then multiplied by a learned γ', 'x divided by its largest absolute value, then multiplied by a learned γ', 'x minus the batch mean of each feature, then multiplied by a learned γ'], answer: 1, explain: 'RMSNorm divides by √(mean(x²) + ε) and scales by γ. The first option is LayerNorm; dividing by the max is a different scaling; and per-batch statistics are BatchNorm.' },
    { q: 'For x = [2, 2, 2, 2] with γ = 1 and ε ignored, what is RMSNorm(x)?', options: ['[0, 0, 0, 0]', '[0.5, 0.5, 0.5, 0.5]', '[2, 2, 2, 2]', '[1, 1, 1, 1]'], answer: 3, explain: 'Mean of squares = 4, RMS = 2, so each value becomes 2/2 = 1. LayerNorm would give zeros here (all values equal the mean, so the variance is 0), which is the tempting distractor.' },
    { q: 'Which property does LayerNorm have that RMSNorm lacks?', options: ['Invariance to adding the same constant to every element', 'Invariance to multiplying the input by a positive constant', 'A learned per-feature scale γ', 'Working on a single token without needing the batch'], answer: 0, explain: 'Only LayerNorm subtracts the mean, so only it ignores a constant shift. Both are scale invariant, both have γ, and both are per-token.' },
    { q: 'You are designing a new decoder-only LLM and want a stable, efficient normalization in the usual modern layout. What is the common choice?', options: ['BatchNorm after each attention layer, using running batch statistics', 'Pre-norm RMSNorm on each attention and FFN input, plus a final RMSNorm', 'No normalization at all, relying on a small learning rate for stability', 'RMSNorm applied to the residual stream after every addition, replacing it'], answer: 1, explain: 'The Llama-style recipe uses pre-norm RMSNorm on each sub-layer input and a final norm before the output head. BatchNorm depends on the batch and is not used in LLMs, and normalizing the residual stream itself is the older post-norm style.' },
    { q: 'Which statement is a misconception?', options: ['RMSNorm has about half the learnable parameters of LayerNorm', 'If a vector already has mean 0, RMSNorm and LayerNorm (with β = 0) give the same result', 'RMSNorm still subtracts the mean, it just skips the β shift', 'RMSNorm keeps the direction of the vector and only changes its length (before γ)'], answer: 2, explain: 'RMSNorm never subtracts the mean; that is exactly the step it removes. The other statements are correct.' },
  ],
  takeaways: [
    'RMSNorm(x) = γ · x / √(mean(x²) + ε): only re-scaling, no re-centring, no β.',
    'It keeps the scale invariance that stabilises deep networks, and drops shift invariance.',
    'It is simpler, has half the parameters and is somewhat faster than LayerNorm, with similar quality.',
    'Modern LLMs place RMSNorm before attention and before the FFN in each block (pre-norm), plus one final norm.',
    'You cannot swap LayerNorm for RMSNorm in a trained model without retraining.',
  ],
  terms: [
    { term: 'RMSNorm', def: 'A normalization layer that divides a vector by its root mean square and multiplies by a learned scale.' },
    { term: 'Root mean square (RMS)', def: 'The square root of the average of squared values; a measure of a vector\'s typical magnitude.' },
    { term: 'Re-centring', def: 'Subtracting the mean so values average to zero; done by LayerNorm, skipped by RMSNorm.' },
    { term: 'Scale invariance', def: 'The output stays the same when the input is multiplied by a positive constant.' },
    { term: 'Pre-norm', def: 'A Transformer layout that normalizes the input of each sub-layer while leaving the residual stream untouched.' },
    { term: 'Residual stream', def: 'The running per-token vector that each Transformer block reads from and adds its output to.' },
  ],
};
