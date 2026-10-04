export default {
  id: 'math-behind-cross-entropy-loss',
  minutes: 20,
  hook: 'When a model says "70% cat" and the picture is a dog, how do we turn that into one number that tells training exactly how wrong it was, and in which direction to fix it?',
  summary: 'Cross-entropy loss measures how much probability a model gave to the correct answer: the loss is `−log(p_correct)`. Confident right answers cost almost nothing, and confident wrong answers cost a lot. It is the standard loss for classification and for training language models, and its gradient with respect to the logits is beautifully simple: `p − y`.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'Many models do not predict a number, they predict a **category**: spam or not spam, cat or dog or bird, or (for a language model) which of ~100,000 tokens comes next. Such models output a **probability distribution**: a list of non-negative numbers that add up to 1, one per class.' },
        { type: 'p', text: 'To train them with gradient descent we need a loss function that compares this predicted distribution with the true answer. Mean squared error, which we used for house prices, technically works but behaves poorly here (we will see why). The standard choice is **cross-entropy loss**, also called **log loss** or **negative log-likelihood**.' },
        { type: 'p', text: 'Our running example: an image classifier with three classes, **[cat, dog, bird]**. We show it a photo of a dog. How should we score its guess?' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like betting chips', text: 'Before the answer is revealed, the model must spread 100 chips across the possible answers. Its score depends only on how many chips it placed on the answer that turned out to be correct. Put 90 chips on the right one and you lose little. Put 1 chip on it, because you were sure it was something else, and you lose a lot. Cross-entropy is that scoring rule, made precise with a logarithm.' },
      ],
    },
    {
      id: 'what-is-cross-entropy',
      title: 'What is cross-entropy?',
      blocks: [
        { type: 'p', text: 'The name comes from **information theory**. There, the **surprise** of an event with probability `q` is `−log q`: an event you thought was certain (q = 1) has zero surprise; an event you thought was very unlikely is very surprising. **Entropy** is the average surprise of a distribution measured against itself.' },
        { type: 'p', text: '**Cross-entropy** is the average surprise you experience when the world follows the *true* distribution `p`, but you are predicting with your *model\'s* distribution `q`. If your model matches reality, cross-entropy equals the entropy and is as low as it can be. Every mismatch raises it. The extra amount is called the **KL divergence**, a measure of how different two distributions are.' },
        { type: 'formula', expr: 'H(p, q) = − ∑ₓ p(x) · log q(x)        H(p, q) = H(p) + KL(p ‖ q)', where: [['p(x)', 'the true probability of outcome x'], ['q(x)', 'the model\'s predicted probability of outcome x'], ['H(p)', 'entropy of the true distribution: fixed, the model cannot change it'], ['KL(p ‖ q)', 'the extra cost from the model being wrong; always ≥ 0']], caption: 'Minimising cross-entropy is the same as minimising KL divergence, because H(p) does not depend on the model.' },
        { type: 'p', text: 'We use the **natural logarithm** (`ln`, base e) in machine learning, so losses are measured in units called *nats*. With log base 2 they would be in *bits*. The choice only rescales the loss by a constant.' },
      ],
    },
    {
      id: 'formula',
      title: 'The cross-entropy loss formula, and why the negative log',
      blocks: [
        { type: 'p', text: 'In classification, the true distribution is a **one-hot vector**: 1 for the correct class, 0 for every other class. For our dog photo, `y = [0, 1, 0]`. Plug that into the formula and every term with `yᵢ = 0` vanishes. Only one term survives:' },
        { type: 'formula', expr: 'L = − ∑ᵢ yᵢ · log(pᵢ) = − log(p_correct)', where: [['yᵢ', '1 for the true class, 0 for the others (one-hot)'], ['pᵢ', 'the model\'s predicted probability for class i'], ['p_correct', 'the probability the model gave to the true class']], caption: 'For a single correct label, cross-entropy is simply minus the log of the probability on the right answer.' },
        { type: 'p', text: '**Why a log?** Three reasons. First, probabilities of independent examples *multiply*, and logs turn products into sums, so the loss over a dataset is a simple sum (or average) of per-example losses. Second, maximising the probability of the data (the **maximum likelihood** principle from statistics) is exactly the same as minimising the sum of `−log p`. Third, the log is steep near zero, which punishes confident mistakes very hard.' },
        { type: 'p', text: '**Why negative?** Probabilities are between 0 and 1, so their logs are zero or negative. `log(1) = 0`, `log(0.5) ≈ −0.693`, `log(0.01) ≈ −4.6`. Flipping the sign gives a loss that is ≥ 0, equals 0 for a perfect prediction, and grows towards infinity as `p_correct` approaches 0.' },
        { type: 'chart', kind: 'line', title: 'Loss on the correct class as its probability changes', xLabel: 'Probability given to the correct class', yLabel: 'Loss', series: [
          { name: 'Cross-entropy −ln(p)', points: [[0.01, 4.605], [0.05, 2.996], [0.1, 2.303], [0.2, 1.609], [0.3, 1.204], [0.5, 0.693], [0.7, 0.357], [0.9, 0.105], [1, 0]] },
          { name: 'Squared error (1 − p)²', points: [[0.01, 0.98], [0.05, 0.903], [0.1, 0.81], [0.2, 0.64], [0.3, 0.49], [0.5, 0.25], [0.7, 0.09], [0.9, 0.01], [1, 0]] },
        ], caption: 'Exact values. Squared error never exceeds 1, so a confidently wrong model is barely punished; cross-entropy shoots up as p → 0.' },
        { type: 'check', question: 'Model A gives the correct class probability 0.5. Model B gives it 0.05. Roughly how much larger is B\'s loss?', answer: 'A: −ln(0.5) ≈ 0.693. B: −ln(0.05) ≈ 2.996. B\'s loss is about **4.3× larger**, even though its probability is "only" 10× smaller. The log rewards each halving of the probability with the same extra penalty (≈ 0.693).' },
      ],
    },
    {
      id: 'binary',
      title: 'Binary cross-entropy loss',
      blocks: [
        { type: 'p', text: 'With only two classes (spam or not spam), a model usually outputs a single number `p` = probability of the positive class, produced by a **sigmoid** `σ(z) = 1 / (1 + e⁻ᶻ)`. The other class gets `1 − p`. The true label `y` is 0 or 1. Cross-entropy with two classes becomes **binary cross-entropy (BCE)**:' },
        { type: 'formula', expr: 'BCE = − [ y · log(p) + (1 − y) · log(1 − p) ]', caption: 'If y = 1, only −log(p) remains. If y = 0, only −log(1 − p) remains. It is the same "−log of the probability on the truth" idea.' },
        { type: 'p', text: 'Example, an email that really is spam (`y = 1`): the model says p = 0.9 → loss `−ln 0.9 = 0.105`; p = 0.6 → `0.511`; p = 0.1 → `2.303`. For a dataset we average over all examples. BCE is also used for **multi-label** problems, where several labels can be true at once (a photo containing both a cat and a dog): each label gets its own sigmoid and its own BCE term.' },
      ],
    },
    {
      id: 'categorical',
      title: 'Categorical cross-entropy loss',
      blocks: [
        { type: 'p', text: 'With more than two mutually exclusive classes, the network outputs one raw score per class. These raw, unnormalised scores are called **logits**. The **softmax** function turns logits into probabilities by exponentiating and normalising:' },
        { type: 'formula', expr: 'pᵢ = softmax(z)ᵢ = eᶻⁱ / ∑ⱼ eᶻʲ        L = − log(p_correct)', where: [['z', 'the vector of logits, one per class'], ['eᶻⁱ', 'exponential: makes every score positive and exaggerates differences'], ['∑ⱼ eᶻʲ', 'normalising constant so the probabilities sum to 1']] },
        { type: 'p', text: 'Softmax followed by cross-entropy is so common that frameworks fuse them into one function (for example PyTorch\'s `CrossEntropyLoss` takes **logits**, not probabilities). Fusing is not just convenient: computing `log(softmax(z))` in one step avoids overflow and the `log(0)` problems that appear when you take softmax and log separately.' },
        { type: 'flow', title: 'From network output to loss', nodes: [
          { label: 'Logits z', detail: 'Raw scores from the last layer, e.g. [2.0, 1.0, 0.1] for [cat, dog, bird]. Any real numbers.' },
          { label: 'Softmax', detail: 'Exponentiate and normalise: [0.659, 0.242, 0.099]. Now they are probabilities that sum to 1.' },
          { label: 'Pick the true class', detail: 'The one-hot label [0, 1, 0] selects the dog probability, 0.242.' },
          { label: '−log', detail: '−ln(0.242) = 1.417. This is the loss for this example.' },
          { label: 'Average', detail: 'Over a mini-batch, average the per-example losses. Gradient descent then minimises this average.' },
        ] },
      ],
    },
    {
      id: 'numeric-example',
      title: 'Step-by-step numeric example',
      blocks: [
        { type: 'steps', title: 'Scoring our dog photo', items: [
          { title: 'Logits', text: 'The network outputs `z = [2.0, 1.0, 0.1]` for [cat, dog, bird]. It currently leans towards cat.' },
          { title: 'Exponentiate', text: '`e²·⁰ = 7.389`, `e¹·⁰ = 2.718`, `e⁰·¹ = 1.105`. Sum = 11.212.' },
          { title: 'Normalise', text: 'Divide by the sum: `p = [0.659, 0.242, 0.099]`.' },
          { title: 'Select the truth', text: 'The photo is a dog, so `p_correct = 0.242`.' },
          { title: 'Take −log', text: '`L = −ln(0.242) ≈ 1.417`. A perfect model would score 0; a model guessing uniformly (1/3 each) would score `ln 3 ≈ 1.099`. So this model is currently *worse than guessing*, because it is confident in the wrong class.' },
        ] },
        { type: 'p', text: 'That last comparison is a useful sanity check in practice. At the very start of training, a model with K classes should have a loss near `ln K`. If your initial loss is much higher, the model is starting out overconfident, often a sign of a bad initialisation or a bug in the labels.' },
        { type: 'check', question: 'A 10-class classifier starts training with an average loss of 2.30. Is that suspicious?', answer: 'No. ln(10) ≈ 2.303, exactly what we expect from a model that has not learned anything yet and spreads probability evenly over 10 classes.' },
      ],
    },
    {
      id: 'language-models',
      title: 'Cross-entropy loss for language models',
      blocks: [
        { type: 'p', text: 'A large language model is a classifier with a huge number of classes: at each position it predicts a probability distribution over its whole vocabulary of tokens for the next token. Training uses **next-token cross-entropy**: for each position, take `−log` of the probability the model gave to the token that actually came next, then average over all positions in all sequences.' },
        { type: 'p', text: 'For example, in "The cat sat on the mat", when the model sees "The cat sat on the", the correct next token is "mat". If it gave "mat" probability 0.5, that position costs 0.693. Every sentence in the training data provides one such classification problem per token, which is why language models can learn from raw text without human labels.' },
        { type: 'p', text: 'People often report **perplexity** instead of the loss. Perplexity is `exp(average cross-entropy)`. It can be read as "the model is as uncertain as if it were choosing uniformly among this many tokens". A loss of 1.351 nats is a perplexity of `e¹·³⁵¹ ≈ 3.86`. Lower is better, and perplexities are only comparable between models that use the same tokenizer and evaluation text.' },
        { type: 'viz', name: 'temperature', caption: 'These are next-token probabilities from softmax. The loss for a position is −log of the bar for the true next token. Notice how temperature reshapes the bars; during training the temperature is 1, and the model learns to raise the bar of the correct token.' },
      ],
    },
    {
      id: 'gradient',
      title: 'The gradient of cross-entropy loss',
      blocks: [
        { type: 'p', text: 'Here is the part that makes cross-entropy the natural partner of softmax. If we combine softmax and cross-entropy and differentiate with respect to the **logits**, almost everything cancels:' },
        { type: 'formula', expr: '∂L/∂zᵢ = pᵢ − yᵢ', caption: 'Predicted probability minus target. The same clean result holds for sigmoid with binary cross-entropy: ∂L/∂z = p − y.' },
        { type: 'p', text: 'For our dog example: `p − y = [0.659 − 0, 0.242 − 1, 0.099 − 0] = [0.659, −0.758, 0.099]`. Gradient descent subtracts the gradient, so it *lowers* the cat and bird logits and *raises* the dog logit, by amounts proportional to how wrong each one is. The error signal is large when the model is confidently wrong and fades to zero as it becomes right. No vanishing gradient from a saturated sigmoid or softmax on the output layer.' },
        { type: 'deeper', title: 'Why squared error is worse here', blocks: [
          { type: 'p', text: 'With a sigmoid output and squared error `L = (p − y)²`, the gradient with respect to the logit is `2(p − y) · p(1 − p)`. The extra factor `p(1 − p)` is tiny when p is close to 0 or 1. So when the model is confidently *wrong* (say p = 0.01 when y = 1), the gradient is almost zero and learning stalls. Cross-entropy\'s log exactly cancels that factor, leaving `p − y`, which is large precisely when the model is badly wrong.' },
        ] },
        { type: 'code', lang: 'python', title: 'cross_entropy.py', code: `import numpy as np

def softmax(z):
    e = np.exp(z - z.max())          # subtract max for numerical stability
    return e / e.sum()

# 1) Binary cross-entropy: true label y = 1 (spam), model gives probability p
for p in (0.9, 0.6, 0.1):
    bce = -(1 * np.log(p) + (1 - 1) * np.log(1 - p))
    print(f"BCE  y=1, p={p:.1f} -> loss {bce:.3f}")

# 2) Categorical cross-entropy: 3 classes [cat, dog, bird], true class = dog
logits = np.array([2.0, 1.0, 0.1])
p = softmax(logits)
y = np.array([0, 1, 0])
loss = -np.sum(y * np.log(p))
print("probs", p.round(3), f"-> CE loss {loss:.3f}")

# 3) Gradient w.r.t. logits is simply p - y; confirm numerically
grad = p - y
eps, num = 1e-6, []
for i in range(3):
    d = np.zeros(3); d[i] = eps
    lp = -np.log(softmax(logits + d)[1]); lm = -np.log(softmax(logits - d)[1])
    num.append((lp - lm) / (2 * eps))
print("analytic grad ", grad.round(4))
print("numerical grad", np.round(num, 4))

# 4) Language model: probability given to each correct next token
p_correct = np.array([0.50, 0.20, 0.90, 0.05])
token_losses = -np.log(p_correct)
print("per-token loss", token_losses.round(3), f"mean {token_losses.mean():.3f}",
      f"perplexity {np.exp(token_losses.mean()):.2f}")`, output: `BCE  y=1, p=0.9 -> loss 0.105
BCE  y=1, p=0.6 -> loss 0.511
BCE  y=1, p=0.1 -> loss 2.303
probs [0.659 0.242 0.099] -> CE loss 1.417
analytic grad  [ 0.659  -0.7576  0.0986]
numerical grad [ 0.659  -0.7576  0.0986]
per-token loss [0.693 1.609 0.105 2.996] mean 1.351 perplexity 3.86`, walkthrough: [
          { lines: [3, 5], note: 'Softmax with the standard stability trick: subtracting the max logit does not change the result but prevents overflow in exp.' },
          { lines: [7, 10], note: 'Binary cross-entropy for a spam email at three confidence levels. Because y = 1, the second term is multiplied by 0.' },
          { lines: [12, 17], note: 'The dog example: logits → softmax → −log of the dog probability = 1.417.' },
          { lines: [19, 27], note: 'The analytic gradient p − y matches a finite-difference estimate to 4 decimals.' },
          { lines: [29, 33], note: 'Four next-token predictions from a language model: per-token losses, their mean, and perplexity = exp(mean).' },
        ] },
      ],
    },
    {
      id: 'summary',
      title: 'Comparison, pitfalls and quick summary',
      blocks: [
        { type: 'compare', title: 'Which loss for which output?', options: [
          { name: 'Binary cross-entropy', summary: 'One sigmoid output per label; −[y log p + (1−y) log(1−p)].', pros: ['Natural for yes/no', 'Handles multi-label (each label independent)'], cons: ['Not for mutually exclusive multi-class'], bestFor: 'Spam detection, multi-label tagging' },
          { name: 'Categorical cross-entropy', summary: 'Softmax over K classes; −log p_correct.', pros: ['Clean p − y gradient', 'Probabilities sum to 1'], cons: ['Assumes exactly one correct class'], bestFor: 'Image classes, next-token prediction in LLMs' },
          { name: 'Mean squared error', summary: '(ŷ − y)² averaged.', pros: ['Simple, ideal for real-valued targets'], cons: ['Weak gradients for confidently wrong probabilities', 'Max penalty of 1 for probabilities'], bestFor: 'Regression such as prices or temperatures' },
        ], verdict: 'Probabilities → cross-entropy. Real numbers → squared error (or L1).' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Applying softmax yourself and then passing the probabilities to a loss that expects logits (PyTorch `CrossEntropyLoss`), which silently applies softmax twice. Taking `log(0)` and getting infinity or NaN: add the loss in the fused, log-space form or clip probabilities. Using categorical cross-entropy for multi-label problems where several classes can be true at once. And forgetting that a low loss on training data does not mean well-calibrated probabilities on new data.' },
        { type: 'list', items: [
          'Cross-entropy loss = −log(probability given to the correct answer), averaged over examples.',
          'It comes from information theory; minimising it equals minimising KL divergence and maximising likelihood.',
          'Binary version uses sigmoid; categorical version uses softmax; LLMs use it per token.',
          'Its gradient with respect to logits is p − y: big when confidently wrong, zero when perfect.',
          'Sanity check: an untrained K-class model should start near ln K.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'For one example with a one-hot label, what does categorical cross-entropy reduce to?', options: ['The squared difference between the predicted and true probabilities', '−log of the probability the model gave to the correct class', 'The sum of all predicted probabilities', 'log of the largest predicted probability'], answer: 1, explain: 'With y one-hot, every term except the true class is multiplied by 0, leaving −log(p_correct). Squared difference is MSE; the probabilities always sum to 1; and the largest probability might belong to a wrong class.' },
    { q: 'A model gives the correct class probability 0.25. Using natural log, what is its cross-entropy loss?', options: ['0.25', '0.75', '1.386', '2.773'], answer: 2, explain: '−ln(0.25) = ln 4 ≈ 1.386. 0.75 is 1 − p (not a log), and 2.773 is ln 16, which you would get by squaring the probability first.' },
    { q: 'Our 5-class classifier starts training with a loss of 9.2, while ln 5 ≈ 1.61. What is the most likely explanation?', options: ['This is normal; cross-entropy losses always start well above ln K', 'It starts confidently wrong, often from bad initialisation or label bugs', 'The learning rate is too small, so the starting loss is far too high', 'Cross-entropy cannot be used with five classes, so the value it gives is garbage'], answer: 1, explain: 'An untrained model should spread probability roughly evenly and score near ln K. A loss far above that means it is confidently putting probability on wrong classes. A too-small learning rate affects how fast the loss falls, not where it starts.' },
    { q: 'Compared with squared error on a sigmoid output, why does cross-entropy train better when the model is confidently wrong?', options: ['Its logit gradient is p − y, while squared error adds a p(1 − p) factor near 0', 'It is capped at a maximum value of 1, which keeps the updates small and stable', 'It ignores the wrong classes completely, so there is less to learn', 'It does not need gradients, so a saturated sigmoid cannot slow it down'], answer: 0, explain: 'The log in cross-entropy cancels the sigmoid\'s saturating derivative, leaving p − y. Squared error is the one whose penalty is capped near 1 for probabilities, and every loss used with gradient descent needs gradients.' },
    { q: 'Which statement is a misconception?', options: ['Perplexity is the exponential of the average cross-entropy per token', 'PyTorch\'s CrossEntropyLoss expects logits, so you should not apply softmax first', 'Binary cross-entropy can be used for multi-label problems with one sigmoid per label', 'Perplexities can always be compared across models with different tokenizers'], answer: 3, explain: 'Perplexity depends on how text is split into tokens, so values are only directly comparable for the same tokenizer and evaluation text. The other three statements are correct.' },
  ],
  takeaways: [
    'Cross-entropy loss is −log of the probability the model gave to the correct answer.',
    'The log makes confident mistakes very costly and turns products of probabilities into sums.',
    'Use binary cross-entropy with sigmoid outputs and categorical cross-entropy with softmax outputs.',
    'Language models are trained with next-token cross-entropy; perplexity = exp(average loss).',
    'With softmax or sigmoid, the gradient on the logits is simply p − y.',
  ],
  terms: [
    { term: 'Cross-entropy', def: 'The average surprise, −∑ p(x) log q(x), of a true distribution p measured with a predicted distribution q.' },
    { term: 'Logits', def: 'The raw, unnormalised scores a network outputs before softmax or sigmoid.' },
    { term: 'Softmax', def: 'A function that turns logits into probabilities by exponentiating and dividing by their sum.' },
    { term: 'One-hot vector', def: 'A label vector with 1 for the correct class and 0 for every other class.' },
    { term: 'KL divergence', def: 'A non-negative measure of how much one distribution differs from another; cross-entropy minus entropy.' },
    { term: 'Perplexity', def: 'exp of the average per-token cross-entropy; roughly how many tokens the model is "choosing between".' },
  ],
};
