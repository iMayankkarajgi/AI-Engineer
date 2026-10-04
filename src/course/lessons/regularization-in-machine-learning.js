export default {
  id: 'regularization-in-machine-learning',
  minutes: 18,
  hook: 'Our model fits the training data almost perfectly, then does far worse on new data. Can a tiny penalty on the size of its weights fix that?',
  summary: 'Overfitting happens when a model learns the noise in its training data instead of the real pattern. Regularisation fights it by adding a penalty on the model\'s weights to the loss, controlled by a strength λ. L1 (Lasso) adds λ·∑|w|, which drives many weights to exactly zero and so selects features; L2 (Ridge) adds λ·∑w², which shrinks all weights smoothly towards zero. We choose λ using validation data.',
  sections: [
    {
      id: 'overfitting',
      title: 'What is overfitting?',
      blocks: [
        { type: 'p', text: 'In Lesson 1.1 we saw that the goal of machine learning is **generalisation**: doing well on new data. **Overfitting** is the failure where a model fits its training data too closely, including random noise and quirks that will not repeat, and as a result performs worse on new data. The tell-tale sign: very low training error, much higher validation or test error.' },
        { type: 'callout', tone: 'analogy', title: 'Memorising the answer sheet', text: 'A student who memorises last year\'s exam answers word for word scores 100% on last year\'s paper and fails this year\'s, because the questions changed slightly. A student who learned the underlying ideas does well on both. An overfit model is the memoriser.' },
        { type: 'p', text: 'Overfitting is most likely when the model is very **flexible** (many parameters, high-degree polynomials, deep trees, big neural networks) compared with the **amount of data**. A classic example: fit a degree-9 polynomial through 15 noisy points. The curve can wiggle through almost every point, but between and beyond the points it swings wildly.' },
        { type: 'p', text: 'A key symptom is **large weights**. To wiggle through noisy points, the model needs big positive and negative coefficients that cancel each other out on the training data. In our example below, the unregularised model\'s weights add up (in absolute value) to 661, while a well-behaved model needs only about 2.' },
        { type: 'list', items: [
          '**Ways to fight overfitting:** get more data, use a simpler model, choose better features, stop training early, use dropout in neural networks (Lesson 2.5), and **regularisation**, the subject of this lesson.',
        ] },
      ],
    },
    {
      id: 'core-idea',
      title: 'The core idea: penalise complexity',
      blocks: [
        { type: 'p', text: '**Regularisation** means adding a penalty to the training objective that discourages complex models. For linear models and neural networks, "complex" is measured by how large the weights are. The new objective is:' },
        { type: 'formula', expr: 'Total loss = Data loss (e.g. MSE) + λ · Penalty(w)', where: [
          ['Data loss', 'how badly the model fits the training data'],
          ['Penalty(w)', 'how large the weights are: ∑|wᵢ| for L1, ∑wᵢ² for L2'],
          ['λ (lambda)', 'regularisation strength, a number ≥ 0 that we choose'],
        ] },
        { type: 'p', text: 'Now the model faces a trade-off. Making a weight bigger might reduce the data loss a little, but it increases the penalty. Only weights that **substantially** improve the fit are worth keeping large. Noise-chasing weights, which help only a tiny bit, get shrunk.' },
        { type: 'p', text: 'The strength λ controls the balance. λ = 0 means no regularisation (the model may overfit). A very large λ forces all weights towards zero, so the model becomes too simple and **underfits**. The best λ lies in between, and we find it by checking performance on validation data.' },
        { type: 'chart', kind: 'line', title: 'Ridge regression: error vs regularisation strength', xLabel: 'log₁₀(λ)', yLabel: 'MSE', series: [
          { name: 'Training error', points: [[-6, 0.004], [-4, 0.01], [-3, 0.012], [-2, 0.015], [-1, 0.019], [0, 0.045], [1, 0.141], [2, 0.316]] },
          { name: 'Test error', points: [[-6, 0.285], [-4, 0.018], [-3, 0.01], [-2, 0.009], [-1, 0.012], [0, 0.056], [1, 0.233], [2, 0.456]] },
        ], caption: 'Measured with the degree-9 polynomial example from the code below. Training error always rises with λ; test error falls, bottoms out around λ = 0.01, then rises again as the model underfits.' },
      ],
    },
    {
      id: 'l1-lasso',
      title: 'L1 regularisation (Lasso)',
      blocks: [
        { type: 'p', text: '**L1 regularisation** adds the sum of the **absolute values** of the weights. Linear regression with an L1 penalty is called **Lasso** (Least Absolute Shrinkage and Selection Operator, introduced by Robert Tibshirani in 1996).' },
        { type: 'formula', expr: 'Loss = MSE + λ · ∑ |wᵢ|  =  MSE + λ · ‖w‖₁' },
        { type: 'p', text: 'Its signature behaviour: **many weights become exactly zero**. The model effectively throws away features it does not need, which is automatic **feature selection**. The result is a **sparse** model: easier to interpret, cheaper to compute, and useful when we suspect only a few of many features really matter.' },
        { type: 'p', text: 'Why exactly zero? The gradient of λ·|w| has the same size, λ, no matter how small w is. So the penalty keeps pushing a small weight towards zero with constant force. If the data cannot push back with at least that force, the weight lands at zero and stays there. In practice solvers implement this with a step called **soft-thresholding**: shrink each weight towards zero by a fixed amount, and set it to zero if it would cross zero.' },
        { type: 'list', items: [
          '**Pros:** produces sparse models; performs feature selection; robust when many features are irrelevant.',
          '**Cons:** when features are strongly correlated, tends to pick one somewhat arbitrarily and drop the others; the penalty has a corner at zero, so it needs special solvers rather than plain gradient descent; can be unstable when there are more features than examples.',
        ] },
      ],
    },
    {
      id: 'l2-ridge',
      title: 'L2 regularisation (Ridge)',
      blocks: [
        { type: 'p', text: '**L2 regularisation** adds the sum of the **squared** weights. Linear regression with an L2 penalty is called **Ridge regression** (Hoerl and Kennard, 1970). In neural networks the same idea is usually called **weight decay**.' },
        { type: 'formula', expr: 'Loss = MSE + λ · ∑ wᵢ²  =  MSE + λ · ‖w‖₂²' },
        { type: 'p', text: 'Its signature behaviour: **all weights shrink smoothly towards zero, but almost never reach exactly zero**. The gradient of λ·w² is 2λ·w, which gets weaker as w gets smaller. So small weights are only gently nudged, while large weights are pulled hard. L2 especially hates any single huge weight, and it spreads weight across correlated features instead of picking one.' },
        { type: 'p', text: 'Ridge has a clean closed-form solution for linear regression: `w = (XᵀX + λI)⁻¹ Xᵀy`. Adding λ to the diagonal also makes the matrix better conditioned, which stabilises the solution when features are correlated.' },
        { type: 'viz', name: 'regularization', caption: 'Increase λ and compare: under L1 many weights snap to exactly zero; under L2 all weights shrink gradually.' },
        { type: 'steps', title: 'One gradient-descent step with each penalty (learning rate 0.1, λ = 0.5, ignoring the data loss)', items: [
          { title: 'Start', text: 'Two weights: w₁ = 2.0 and w₂ = 0.04.' },
          { title: 'L2 step', text: 'Gradient of λ·w² is 2λw = w. Update w ← w − 0.1·w: w₁ = 1.8, w₂ = 0.036. Both shrink by 10%; the small one stays non-zero.' },
          { title: 'L1 step', text: 'Gradient of λ·|w| is λ·sign(w) = 0.5. Update w ← w − 0.1 × 0.5 = w − 0.05: w₁ = 1.95. For w₂ = 0.04, subtracting 0.05 would cross zero, so soft-thresholding sets it to exactly 0.' },
          { title: 'Lesson', text: 'L2 shrinks proportionally (big weights lose more). L1 subtracts a fixed amount (small weights get wiped out).' },
        ] },
        { type: 'check', question: 'After many steps, which penalty would you expect to leave w₂ (a tiny, barely useful weight) at exactly zero, and which leaves it small but non-zero?', answer: 'L1 sets it to exactly zero, because its constant-sized push beats a weak signal from the data. L2 only shrinks it proportionally, so it gets smaller and smaller but stays non-zero.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: taming a degree-9 polynomial',
      blocks: [
        { type: 'p', text: 'We have 15 noisy points from a smooth curve, `y = sin(2x)`, and give the model nine features: x, x², …, x⁹. Without regularisation it overfits badly. We compare it with Ridge (closed form) and Lasso (a simple iterative solver), both with λ = 0.1. The test set is 100 noise-free points from the true curve.' },
        { type: 'code', lang: 'python', title: 'regularisation_demo.py', code: `import numpy as np

rng = np.random.default_rng(3)
f = lambda x: np.sin(2 * x)                           # the true pattern
x_tr = rng.uniform(-1.5, 1.5, 15); y_tr = f(x_tr) + rng.normal(0, 0.2, 15)
x_te = np.linspace(x_tr.min(), x_tr.max(), 100); y_te = f(x_te)
feats = lambda x: np.column_stack([x ** p for p in range(1, 10)])  # x .. x^9
X_tr, X_te = feats(x_tr), feats(x_te)
mu, sd = X_tr.mean(0), X_tr.std(0)                    # standardise (train stats)
X_tr, X_te = (X_tr - mu) / sd, (X_te - mu) / sd
b = y_tr.mean(); yc = y_tr - b                        # intercept: not penalised

def ridge(lam):  # L2: closed form  w = (XᵀX + λI)⁻¹ Xᵀy
    return np.linalg.solve(X_tr.T @ X_tr + lam * np.eye(9), X_tr.T @ yc)

def lasso(lam, steps=20000):  # L1: proximal gradient descent (ISTA)
    w, lr = np.zeros(9), 1 / np.linalg.norm(X_tr, 2) ** 2
    for _ in range(steps):
        w = w - lr * X_tr.T @ (X_tr @ w - yc)                 # gradient step on MSE
        w = np.sign(w) * np.maximum(np.abs(w) - lr * lam, 0)  # soft-threshold
    return w

lam = 0.1
for name, w in [("none", ridge(0)), ("L2 ridge", ridge(lam)), ("L1 lasso", lasso(lam))]:
    tr = ((X_tr @ w + b - y_tr) ** 2).mean(); te = ((X_te @ w + b - y_te) ** 2).mean()
    print(f"{name:9s} train MSE {tr:.3f}  test MSE {te:.3f}  "
          f"sum|w| {np.abs(w).sum():6.1f}  zero weights {int((np.abs(w) < 1e-6).sum())}")
print("ridge weights:", (np.round(ridge(lam), 2) + 0.0).tolist())
print("lasso weights:", (np.round(lasso(lam), 2) + 0.0).tolist())`, output: `none      train MSE 0.002  test MSE 0.841  sum|w|  661.3  zero weights 0
L2 ridge  train MSE 0.019  test MSE 0.012  sum|w|    2.4  zero weights 0
L1 lasso  train MSE 0.021  test MSE 0.015  sum|w|    1.7  zero weights 6
ridge weights: [1.18, -0.07, -0.44, 0.08, -0.29, -0.06, -0.08, -0.15, 0.07]
lasso weights: [1.14, -0.02, -0.54, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]`, walkthrough: [
          { lines: [3, 8], note: 'Fifteen noisy training points from sin(2x) and nine polynomial features. Plenty of flexibility for very little data: a recipe for overfitting.' },
          { lines: [9, 11], note: 'Standardise features using training statistics only, so the penalty treats each feature fairly. The intercept is handled separately because we do not want to penalise the overall level.' },
          { lines: [13, 14], note: 'Ridge in one line: the closed-form solution with λ added to the diagonal. With λ = 0 it is ordinary least squares.' },
          { lines: [16, 21], note: 'Lasso has no closed form. This solver alternates a normal gradient step with soft-thresholding, which is where weights get set to exactly zero.' },
          { lines: [23, 27], note: 'No penalty: near-zero training error (0.002) but test error 0.841 and weights summing to 661. Both penalties cut test error by about 60× with tiny weights.' },
          { lines: [28, 29], note: 'Ridge keeps all nine weights non-zero. Lasso keeps x and x³ as its main terms (x² survives with a tiny −0.02) and zeroes the other six. That matches the shape of sin(2x), whose Taylor series 2x − (4/3)x³ + … uses only odd powers. (Test error can be below training error because the test targets have no noise.)' },
        ] },
        { type: 'chart', kind: 'hbar', title: 'Size of each weight |wᵢ| at λ = 0.1', labels: ['x', 'x²', 'x³', 'x⁴', 'x⁵', 'x⁶', 'x⁷', 'x⁸', 'x⁹'], series: [
          { name: 'Ridge (L2)', values: [1.18, 0.07, 0.44, 0.08, 0.29, 0.06, 0.08, 0.15, 0.07] },
          { name: 'Lasso (L1)', values: [1.14, 0.02, 0.54, 0, 0, 0, 0, 0, 0] },
        ], caption: 'Absolute weights from the code output. Lasso is sparse; Ridge spreads small weights everywhere.' },
      ],
    },
    {
      id: 'compare',
      title: 'L1 vs L2 regularisation side by side',
      blocks: [
        { type: 'compare', title: 'Lasso (L1) vs Ridge (L2)', options: [
          { name: 'L1 / Lasso', summary: 'Penalty λ·∑|w|. Pushes many weights to exactly zero.', pros: ['Automatic feature selection', 'Sparse, interpretable models', 'Good when only a few features matter'], cons: ['Picks one of a group of correlated features arbitrarily', 'Needs special solvers', 'Can be unstable with very few examples'], bestFor: 'Many candidate features, most irrelevant; when a short, explainable feature list is needed' },
          { name: 'L2 / Ridge', summary: 'Penalty λ·∑w². Shrinks all weights smoothly.', pros: ['Stable, closed-form solution', 'Handles correlated features gracefully', 'Smooth and easy to optimise'], cons: ['Keeps every feature', 'Less interpretable with many features'], bestFor: 'Most features are somewhat useful; correlated features; neural networks (weight decay)' },
        ], rows: [
          ['Penalty', 'λ · ∑|wᵢ|', 'λ · ∑wᵢ²'],
          ['Effect on small weights', 'Sets them to exactly 0', 'Makes them smaller, rarely 0'],
          ['Effect on large weights', 'Shrinks by a constant amount', 'Shrinks in proportion to size'],
          ['Feature selection', 'Yes', 'No'],
          ['Correlated features', 'Keeps one, drops others', 'Shares weight among them'],
          ['Closed-form solution', 'No', 'Yes (linear regression)'],
        ], verdict: 'Default to L2 for stability. Use L1 when you want a sparse model. When in doubt, Elastic Net combines both.' },
        { type: 'deeper', title: 'Elastic Net and the geometry of L1 vs L2', blocks: [
          { type: 'p', text: '**Elastic Net** uses both penalties at once: `MSE + λ₁·‖w‖₁ + λ₂·‖w‖₂²`. It keeps L1\'s sparsity while behaving more sensibly with groups of correlated features, often keeping or dropping them together.' },
          { type: 'p', text: '**Geometry:** regularisation is equivalent to limiting the weights to a region. For two weights, the L1 region |w₁| + |w₂| ≤ t is a diamond with sharp corners on the axes; the L2 region w₁² + w₂² ≤ t is a circle. The best-fitting solution is where the loss contours first touch the region. A diamond is most likely to be touched at a corner, where one weight is exactly zero. A circle has no corners, so the touching point usually has both weights non-zero.' },
          { type: 'p', text: '**Bayesian view:** L2 corresponds to assuming weights come from a Gaussian prior centred on zero; L1 corresponds to a Laplace prior, which has a sharp peak at zero.' },
        ] },
      ],
    },
    {
      id: 'in-practice',
      title: 'Regularisation in practice',
      blocks: [
        { type: 'list', items: [
          '**Choosing λ:** try a range of values on a log scale (0.001, 0.01, 0.1, 1, 10…) and pick the one with the best validation score, often with cross-validation (training and validating on several different splits).',
          '**Scale features first.** The penalty treats all weights equally, so a feature measured in millimetres would be penalised differently from one in kilometres. Standardise before regularising (Lesson 1.4).',
          '**Do not penalise the intercept.** Shifting all predictions up or down is not "complexity".',
          '**In deep learning,** L2-style weight decay is standard. Modern optimisers such as AdamW apply weight decay directly to the weights ("decoupled" from the gradient), which behaves better with adaptive optimisers. LLM pre-training and fine-tuning commonly use AdamW with weight decay, alongside other regularisers such as dropout.',
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'Credit-risk and medical models often use L1 to keep a short, explainable list of predictors. Ridge is a strong default for forecasting with many correlated signals (for example, overlapping economic indicators). Logistic regression in common libraries such as scikit-learn applies L2 regularisation by default.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Choosing λ on the test set (that leaks the test set into model selection; use validation data). Forgetting to scale features. Turning λ up so high that the model underfits. And assuming L1 picked the "true" features: with correlated features, which one survives can change from one data sample to another.' },
        { type: 'check', question: 'A model has training MSE 0.30 and validation MSE 0.31, both much worse than a simple baseline. We are using Ridge with λ = 100. What should we try?', answer: 'Lower λ. Training and validation errors are similar and both high, which signals underfitting, not overfitting. Too much regularisation is forcing the weights too close to zero.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'Which description of overfitting is correct?',
      options: ["It is too simple, so it does badly on training and test data alike", "It fits training data, noise included, and does worse on new data", "It trains too slowly because the dataset is far too large", "It uses too little memory to store all of its parameters"],
      answer: 1,
      explain: 'Overfitting = low training error plus much higher test error, because the model learned noise. The first option describes underfitting.',
    },
    {
      q: 'We have 500 candidate features and suspect only about 20 matter. We also want a short list of features to show regulators. Which regularisation fits best?',
      options: ["L2 (Ridge), because it keeps every one of the features", "No regularisation, because it might hide important features", "L1 (Lasso), because it drives many weights to exactly zero", "L2 with a very large λ, so every weight becomes tiny"],
      answer: 2,
      explain: 'L1 produces sparse models and performs feature selection, which is exactly what we need. Ridge would keep all 500 features with small weights.',
    },
    {
      q: 'Using one gradient step with learning rate 0.1 and λ = 0.5 (ignoring data loss), what happens to a weight of 0.04 under L1 with soft-thresholding?',
      options: ["It becomes 0", "It becomes 0.036", "It becomes 0.09", "It stays 0.04"],
      answer: 0,
      explain: 'L1 subtracts a fixed 0.1 × 0.5 = 0.05. Subtracting that from 0.04 would cross zero, so soft-thresholding sets it to 0. 0.036 is what L2 would give.',
    },
    {
      q: 'How do L1 and L2 regularisation differ in their treatment of two strongly correlated useful features?',
      options: ["Both penalties always drop both of the correlated features", "L1 tends to keep one and zero the other; L2 shares the weight", "L2 tends to keep one and zero the other; L1 shares the weight", "Neither penalty is affected by correlation between features"],
      answer: 1,
      explain: 'L1\'s corners favour sparse solutions, so it often picks one feature. L2\'s smooth penalty prefers spreading weight across correlated features.',
    },
    {
      q: 'A teammate says: "Regularisation always makes the model better, so we should set λ as high as possible." What is wrong?',
      options: ["Nothing: a higher λ always gives a better model on new data", "Regularisation only works for classification, not regression", "λ has no real effect on the weights, so its value is irrelevant", "Too much regularisation underfits; choose λ on validation data"],
      answer: 3,
      explain: 'As λ grows, weights are forced towards zero and the model becomes too simple. In our chart, test error rises again for large λ. Choose λ by validation.',
    },
  ],
  takeaways: [
    'Overfitting: great on training data, worse on new data; often comes with large weights.',
    'Regularisation adds λ × (weight penalty) to the loss to discourage complexity.',
    'L1 (Lasso, λ·∑|w|) zeroes many weights: sparse models and feature selection.',
    'L2 (Ridge, λ·∑w², weight decay) shrinks all weights smoothly and handles correlated features well.',
    'Choose λ with validation data, scale features first, and do not penalise the intercept.',
  ],
  terms: [
    { term: 'Overfitting', def: 'When a model fits training data, including noise, so closely that it generalises poorly.' },
    { term: 'Regularisation', def: 'Adding a penalty to the training objective that discourages overly complex models.' },
    { term: 'λ (lambda)', def: 'The regularisation strength that balances fitting the data against keeping weights small.' },
    { term: 'Lasso (L1)', def: 'Regularisation using the sum of absolute weights; produces sparse models.' },
    { term: 'Ridge (L2)', def: 'Regularisation using the sum of squared weights; shrinks weights smoothly.' },
    { term: 'Weight decay', def: 'The name for L2-style regularisation in neural network training.' },
    { term: 'Sparsity', def: 'Having many weights exactly equal to zero.' },
  ],
};
