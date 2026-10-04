export default {
  id: 'linear-regression-vs-logistic-regression',
  minutes: 18,
  hook: 'Despite the shared word "regression", one of these models predicts numbers and the other answers yes-or-no questions. How can one small change, a sigmoid, turn the first into the second?',
  summary: 'Linear regression predicts a continuous number by fitting a straight line (or plane) that minimises squared error. Logistic regression predicts the probability of a yes/no outcome by passing the same kind of linear score through a sigmoid that squashes it into 0 to 1, and it is trained with log loss. Use linear regression for "how much?" and logistic regression for "which class?".',
  sections: [
    {
      id: 'two-questions',
      title: 'Two kinds of questions',
      blocks: [
        { type: 'p', text: 'Imagine a teacher with data on students: how many hours each one studied, the score they got, and whether they passed. Two natural questions arise:' },
        { type: 'list', ordered: true, items: [
          '"If a student studies 5.5 hours, **what score** will they probably get?" The answer is a number on a continuous scale.',
          '"If a student studies 5.5 hours, **will they pass**?" The answer is yes or no, and ideally a probability like "50% chance".',
        ] },
        { type: 'p', text: 'The first is a **regression** problem (predict a number). The second is a **classification** problem (predict a category). Both are supervised learning, which we met in Lesson 1.2. The two simplest, most widely used models for them are **linear regression** and **logistic regression**.' },
        { type: 'callout', tone: 'analogy', title: 'A ruler and a dimmer switch', text: 'Linear regression is like a ruler laid through the data: it can extend to any value, as high or low as the line goes. Logistic regression is like a dimmer switch that is fully off at one end and fully on at the other, with a smooth fade in between. It always stays between 0 (off, "fail") and 1 (on, "pass").' },
        { type: 'callout', tone: 'note', title: 'About the confusing name', text: 'Logistic regression is a **classification** method, despite its name. The name is historical: it regresses (fits) the log-odds of the outcome with a linear function, which we unpack below.' },
      ],
    },
    {
      id: 'linear-regression',
      title: 'Linear regression',
      blocks: [
        { type: 'p', text: '**Linear regression** models the target as a weighted sum of the features plus a constant:' },
        { type: 'formula', expr: 'ŷ = w₁x₁ + w₂x₂ + … + wₙxₙ + b', where: [
          ['ŷ', 'the prediction ("y-hat"), any real number'],
          ['xᵢ', 'feature i, e.g. hours studied'],
          ['wᵢ', 'weight for feature i: how much ŷ changes when xᵢ goes up by 1'],
          ['b', 'bias or intercept: the prediction when all features are 0'],
        ] },
        { type: 'p', text: 'With one feature this is just the school formula for a line, `ŷ = w·x + b`. Training means finding the `w` and `b` that make predictions as close as possible to the true values. "Close" is usually measured by **mean squared error (MSE)**: the average of the squared differences between prediction and truth.' },
        { type: 'formula', expr: 'MSE = (1/n) ∑ (yᵢ − ŷᵢ)²', caption: 'Squaring makes every error positive and punishes big misses much more than small ones. Lesson 1.6 compares this with absolute error.' },
        { type: 'steps', title: 'Fitting a line, step by step', items: [
          { title: 'Collect pairs', text: 'For each student we have (hours, score), e.g. (1, 35), (2, 41), … (10, 90).' },
          { title: 'Propose a line', text: 'Pick any w and b, e.g. w = 5, b = 30, so 4 hours predicts 50.' },
          { title: 'Measure error', text: 'Compare each prediction with the true score, square the differences, and average them to get the MSE.' },
          { title: 'Improve the line', text: 'Adjust w and b to reduce the MSE, either with gradient descent or directly with a closed-form formula called **ordinary least squares**.' },
          { title: 'Use it', text: 'Our data gives about score = 6.04 × hours + 29.47, so each extra hour adds about 6 points.' },
        ] },
        { type: 'p', text: 'A big advantage of linear regression is **interpretability**: each weight has a plain meaning. Its main assumption is that the relationship is roughly a straight line (in the features we give it). If the real relationship is curved, we can still use linear regression by adding engineered features such as x², which we explore in Lesson 1.4.' },
      ],
    },
    {
      id: 'logistic-regression',
      title: 'Logistic regression',
      blocks: [
        { type: 'p', text: 'For pass/fail we want a **probability**, a number between 0 and 1. A straight line cannot give that: it keeps rising forever, so with enough study hours it would predict a "probability" of 1.8 or more. Logistic regression fixes this with one extra step. It computes the same linear score `z = w·x + b`, then squashes it with the **sigmoid** function:' },
        { type: 'formula', expr: 'P(y = 1 | x) = σ(z) = 1 / (1 + e⁻ᶻ),   where z = w·x + b', where: [
          ['z', 'the linear score, also called the logit; any real number'],
          ['σ(z)', 'the sigmoid: near 0 for very negative z, exactly 0.5 at z = 0, near 1 for very positive z'],
          ['e', 'Euler\'s number, about 2.718'],
        ] },
        { type: 'chart', kind: 'line', title: 'The sigmoid function', xLabel: 'z = w·x + b', yLabel: 'σ(z)', series: [
          { name: 'σ(z)', points: [[-6, 0.0025], [-4, 0.018], [-2, 0.119], [-1, 0.269], [0, 0.5], [1, 0.731], [2, 0.881], [4, 0.982], [6, 0.9975]] },
        ], caption: 'Exact values of 1 / (1 + e⁻ᶻ). Whatever z is, the output stays between 0 and 1.' },
        { type: 'p', text: 'To turn the probability into a class we pick a **threshold**, usually 0.5: predict "pass" if σ(z) ≥ 0.5. Since σ(z) = 0.5 exactly when z = 0, the **decision boundary** is where `w·x + b = 0`. With one feature that is a single cut-off point; with two features it is a straight line; in general it is a flat plane. That is why logistic regression is called a **linear classifier**.' },
        { type: 'p', text: 'Why "log-odds"? The odds of passing are p / (1 − p). Taking the log of the odds gives exactly z: `ln(p / (1 − p)) = w·x + b`. So each weight says how much one unit of a feature changes the log-odds. For example, a weight of 1.30 on hours means each extra hour multiplies the odds of passing by e¹·³⁰ ≈ 3.7.' },
        { type: 'p', text: 'Logistic regression is trained with **log loss** (also called binary cross-entropy), not MSE:' },
        { type: 'formula', expr: 'Log loss = −(1/n) ∑ [ yᵢ·ln(pᵢ) + (1 − yᵢ)·ln(1 − pᵢ) ]', caption: 'If a student passed (y = 1) and we said p = 0.9, the loss is −ln 0.9 ≈ 0.105. If we said p = 0.1, it is −ln 0.1 ≈ 2.303. Confident wrong answers are punished hard.' },
        { type: 'deeper', title: 'Why log loss instead of MSE for logistic regression?', blocks: [
          { type: 'p', text: 'Combining the sigmoid with squared error gives a loss surface that is not convex in w and b, so gradient descent can get stuck on flat regions; and when the model is confidently wrong, the sigmoid is flat there, so the MSE gradient is tiny and learning is slow. Log loss with a sigmoid is convex and its gradient is beautifully simple: `∂L/∂w = (p − y)·x` and `∂L/∂b = (p − y)`, averaged over examples. The error (p − y) directly drives the update, so big mistakes create big corrections.' },
          { type: 'p', text: 'Log loss also has a statistical meaning: minimising it is the same as finding the parameters under which the observed labels are most likely (maximum likelihood). Unlike linear regression, there is no closed-form solution, so we use iterative methods such as gradient descent.' },
        ] },
        { type: 'viz', name: 'linear-vs-logistic', caption: 'Toggle between the two models: a straight line through continuous scores, and an S-shaped sigmoid through 0/1 outcomes.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: both models on the same students',
      blocks: [
        { type: 'p', text: 'Ten students, their study hours, their scores (for linear regression) and whether they passed (for logistic regression). Notice the student who studied 6 hours but failed: real data is noisy, which is why probabilities are useful.' },
        { type: 'code', lang: 'python', title: 'linear_vs_logistic.py', code: `import numpy as np

# Data: hours studied -> exam score (number) and passed? (0 or 1)
hours = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
score = np.array([35, 41, 50, 52, 61, 64, 72, 79, 83, 90], dtype=float)
passed = np.array([0, 0, 0, 0, 1, 0, 1, 1, 1, 1], dtype=float)

# --- Linear regression: least squares line for the score ---
X = np.column_stack([hours, np.ones_like(hours)])    # [x, 1] for slope and intercept
w, b = np.linalg.lstsq(X, score, rcond=None)[0]
print(f"linear: score = {w:.2f} * hours + {b:.2f}")
print(f"  predicted score for 5.5 h: {w * 5.5 + b:.1f}")

# --- Logistic regression: sigmoid(w*x + b) gives P(pass) ---
sigmoid = lambda z: 1 / (1 + np.exp(-z))
w2, b2, lr = 0.0, 0.0, 0.1
for _ in range(20000):
    p = sigmoid(w2 * hours + b2)
    w2 -= lr * ((p - passed) * hours).mean()          # gradient of log loss
    b2 -= lr * (p - passed).mean()
print(f"logistic: P(pass) = sigmoid({w2:.2f} * hours + {b2:.2f})")
for h in (2, 5, 5.5, 9):
    print(f"  {h:>4} h -> P(pass) = {sigmoid(w2 * h + b2):.2f}")

# Why not just fit a straight line to the 0/1 labels?
wl, bl = np.linalg.lstsq(X, passed, rcond=None)[0]
print(f"line on 0/1 labels at 15 h: {wl * 15 + bl:.2f}  (not a valid probability)")`, output: `linear: score = 6.04 * hours + 29.47
  predicted score for 5.5 h: 62.7
logistic: P(pass) = sigmoid(1.30 * hours + -7.16)
     2 h -> P(pass) = 0.01
     5 h -> P(pass) = 0.34
   5.5 h -> P(pass) = 0.50
     9 h -> P(pass) = 0.99
line on 0/1 labels at 15 h: 1.82  (not a valid probability)`, walkthrough: [
          { lines: [3, 6], note: 'The same ten students with two different targets: a continuous score and a 0/1 pass label.' },
          { lines: [8, 12], note: 'Linear regression via ordinary least squares. The column of ones lets the solver learn the intercept b. Each extra hour adds about 6 points.' },
          { lines: [14, 20], note: 'Logistic regression via gradient descent on log loss. The update uses the simple gradient (p − y)·x from the deeper panel.' },
          { lines: [21, 23], note: 'The decision boundary is where 1.30·h − 7.16 = 0, i.e. h ≈ 5.5, which is exactly where P(pass) = 0.50.' },
          { lines: [25, 27], note: 'Fitting a plain line to 0/1 labels predicts 1.82 at 15 hours: impossible as a probability. This is the core reason logistic regression exists.' },
        ] },
        { type: 'check', question: 'Using the learned model, what is the log-odds z for a student who studies 7 hours, and is the predicted class pass or fail?', answer: 'z = 1.30 × 7 − 7.16 = 1.94. Since z > 0, σ(z) > 0.5 (about 0.87), so we predict pass.' },
      ],
    },
    {
      id: 'differences',
      title: 'Differences between linear and logistic regression',
      blocks: [
        { type: 'compare', title: 'Linear regression vs logistic regression', options: [
          { name: 'Linear regression', summary: 'Predicts a continuous number with a straight line.', pros: ['Very simple and fast', 'Closed-form solution exists', 'Weights are easy to interpret'], cons: ['Outputs are unbounded', 'Sensitive to outliers (squared error)', 'Assumes a roughly linear relationship'], bestFor: 'House prices, sales forecasts, temperatures, any "how much?" question' },
          { name: 'Logistic regression', summary: 'Predicts the probability of a class with a sigmoid of a linear score.', pros: ['Outputs calibrated-ish probabilities in 0–1', 'Fast, robust baseline for classification', 'Weights interpretable as log-odds effects'], cons: ['Linear decision boundary only', 'Needs iterative training', 'Can be overconfident when classes are perfectly separable without regularisation'], bestFor: 'Spam or not, churn or not, click or not, any "which class?" question' },
        ], rows: [
          ['Task type', 'Regression', 'Classification'],
          ['Output', 'Any real number', 'Probability between 0 and 1'],
          ['Core equation', 'ŷ = w·x + b', 'p = σ(w·x + b)'],
          ['Loss function', 'Mean squared error', 'Log loss (binary cross-entropy)'],
          ['Training', 'Closed form (least squares) or gradient descent', 'Gradient descent or similar iterative solvers'],
          ['Evaluation metrics', 'MSE, MAE, R²', 'Accuracy, precision, recall, F1, AUC (Lesson 1.5)'],
          ['Shape of fit', 'Straight line', 'S-shaped curve; linear decision boundary'],
        ], verdict: 'Ask what the target is. A quantity → linear regression. A yes/no (or category) → logistic regression.' },
        { type: 'callout', tone: 'tip', title: 'More than two classes', text: 'Logistic regression extends to many classes with **softmax regression** (multinomial logistic regression): one linear score per class, turned into probabilities that sum to 1 by the softmax function. This is exactly what the final layer of an LLM does when it picks the next token from its vocabulary.' },
      ],
    },
    {
      id: 'real-world',
      title: 'Real-world use',
      blocks: [
        { type: 'table', head: ['Question', 'Model', 'Target'], rows: [
          ['What will this flat rent for?', 'Linear regression', 'Monthly rent in dollars'],
          ['How many support tickets will arrive tomorrow?', 'Linear regression (often with time features)', 'Ticket count'],
          ['Will this customer cancel next month?', 'Logistic regression', 'Churn: yes/no'],
          ['Is this transaction fraud?', 'Logistic regression (as a baseline)', 'Fraud: yes/no'],
          ['Will the user click this ad?', 'Logistic regression has long been a standard choice in ad click prediction', 'Click: yes/no'],
        ] },
        { type: 'callout', tone: 'example', title: 'Why simple models still matter in the LLM era', text: 'Both models train in milliseconds, need little data, and can be explained to a regulator or a manager weight by weight. Teams routinely use them as a **baseline**: if a giant model cannot beat logistic regression on a task, it is not worth its cost. Logistic regression is also a common "probe" for checking whether an embedding contains some piece of information.' },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and limits',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Using linear regression for a yes/no target', text: 'It can predict values below 0 or above 1, and its squared-error loss treats classification poorly. Use logistic regression for binary outcomes.' },
        { type: 'list', items: [
          '**Thinking logistic regression can draw curved boundaries on its own.** Its boundary is linear in the features. For curved boundaries, add engineered features (like x² or interactions) or use a non-linear model such as a tree ensemble or neural network.',
          '**Treating 0.5 as a sacred threshold.** The threshold is a business choice. For cancer screening we might flag anything above 0.1; for auto-blocking payments we might need 0.95. Lesson 1.5 explains this trade-off.',
          '**Forgetting outliers.** One extreme house price can tilt a linear regression line a lot because errors are squared (Lesson 1.6).',
          '**Reading weights when features are on different scales or strongly correlated.** A weight\'s size depends on the feature\'s units, and correlated features can split or swap weight between them, so scale features before comparing weights.',
          '**Extrapolating far outside the training range.** A line fitted on 1–10 hours says 20 hours gives a score of 150 out of 100.',
        ] },
        { type: 'check', question: 'A model predicts whether an email is spam. On some emails, it outputs 1.3 and on others −0.2. Which model was probably used, and what should we use instead?', answer: 'Linear regression, because only an unbounded line can output values outside 0–1. Use logistic regression, whose sigmoid output is always a valid probability.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What does the sigmoid function do in logistic regression?',
      options: ["It removes outliers from the training data before the model is fitted", "It squashes the linear score into a 0–1 value read as a probability", "It decides which input features the model should keep or drop", "It converts predicted probabilities back into squared errors"],
      answer: 1,
      explain: 'σ(z) = 1 / (1 + e⁻ᶻ) maps any real number into (0, 1). That is what turns a linear score into a probability.',
    },
    {
      q: 'We want to predict the number of minutes a delivery will take. Which model is the natural first choice?',
      options: ['Logistic regression', 'k-means clustering', 'Logistic regression with a 0.5 threshold', 'Linear regression'],
      answer: 3,
      explain: 'Delivery time is a continuous quantity, so this is regression. Logistic regression predicts class probabilities, not quantities.',
    },
    {
      q: 'A logistic model is P(pass) = σ(1.30 × hours − 7.16). Roughly where is the decision boundary at threshold 0.5?',
      options: ["At about 5.5 hours", "At about 1.3 hours", "At about 7.2 hours", "At about 0.5 hours"],
      answer: 0,
      explain: 'σ(z) = 0.5 when z = 0, so 1.30 × hours = 7.16, giving hours ≈ 5.5.',
    },
    {
      q: 'Which statement correctly contrasts the loss functions usually used to train the two models?',
      options: ["Both models are trained by minimising log loss (cross-entropy)", "Linear uses mean squared error; logistic uses log loss", "Linear uses log loss; logistic uses mean squared error", "Neither needs a loss; both are solved by counting examples"],
      answer: 1,
      explain: 'Squared error suits continuous targets. Log loss suits probabilities: it is convex with a sigmoid and punishes confident wrong answers heavily.',
    },
    {
      q: 'A teammate says: "Logistic regression is a regression model, so it predicts continuous values like prices." What is the best correction?',
      options: ["Correct: the word \"regression\" means it predicts continuous values", "Partly: it predicts prices, but only ones that are positive", "It is a classifier; \"regression\" refers to fitting the log-odds", "It is an unsupervised clustering model, not a regression model"],
      answer: 2,
      explain: 'Despite the name, logistic regression is used for classification. "Regression" refers to fitting the log-odds ln(p / (1 − p)) as a linear function.',
    },
  ],
  takeaways: [
    'Linear regression predicts a number: ŷ = w·x + b, trained by minimising mean squared error.',
    'Logistic regression predicts a probability: p = σ(w·x + b), trained by minimising log loss.',
    'The sigmoid keeps outputs between 0 and 1; the decision boundary is where w·x + b = 0.',
    'Logistic regression is a classifier despite its name, and its boundary is linear in the features.',
    'Both are fast, interpretable baselines that every bigger model should beat.',
  ],
  terms: [
    { term: 'Linear regression', def: 'A model that predicts a continuous value as a weighted sum of features plus a bias.' },
    { term: 'Logistic regression', def: 'A classification model that outputs a probability by applying the sigmoid to a linear score.' },
    { term: 'Sigmoid', def: 'The function σ(z) = 1 / (1 + e⁻ᶻ), which maps any real number into the range 0 to 1.' },
    { term: 'Log-odds (logit)', def: 'ln(p / (1 − p)); logistic regression models this as a linear function of the features.' },
    { term: 'Log loss', def: 'Binary cross-entropy: the loss that heavily penalises confident wrong probability predictions.' },
    { term: 'Decision boundary', def: 'The set of inputs where the model switches between predicted classes.' },
  ],
};
