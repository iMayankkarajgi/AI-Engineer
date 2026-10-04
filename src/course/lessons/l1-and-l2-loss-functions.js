export default {
  id: 'l1-and-l2-loss-functions',
  minutes: 16,
  hook: 'One late delivery out of six can make up 99.7% of a model\'s loss, or only 89% of it, depending on a single choice: do we take the absolute value of the error, or square it?',
  summary: 'A loss function turns prediction errors into one number that training tries to minimise. L1 loss (mean absolute error) averages |error| and treats every unit of error equally, so it is robust to outliers and aims at the median. L2 loss (mean squared error) averages error², punishing big errors much more, so it is smooth and easy to optimise but sensitive to outliers and aims at the mean. Pick based on how much big errors should matter and how much you trust your data.',
  sections: [
    {
      id: 'what-is-a-loss',
      title: 'First, what is a loss function?',
      blocks: [
        { type: 'p', text: 'When a model makes a prediction, it is usually a bit wrong. The **error** (also called the **residual**) for one example is the difference between the true value and the prediction: `e = y − ŷ`. A **loss function** turns all those individual errors into a single number that says how bad the model is overall. Training (Lesson 1.1) is the search for parameters that make this number as small as possible.' },
        { type: 'p', text: 'The choice of loss is not a detail. It is how we tell the model **what kind of mistakes we care about**. Two models trained on the same data with different losses can end up making noticeably different predictions.' },
        { type: 'callout', tone: 'analogy', title: 'Two strict teachers', text: 'Imagine two teachers grading how late students are. The L1 teacher gives one penalty point per minute late: 2 minutes late = 2 points, 20 minutes late = 20 points. The L2 teacher squares the minutes: 2 minutes = 4 points, 20 minutes = 400 points. Under the L2 teacher, one very late student dominates the whole class\'s penalty.' },
        { type: 'p', text: 'Running example: we predict food delivery times in minutes. Five deliveries arrived roughly on time; one hit a road closure and took 90 minutes instead of the predicted 34.' },
      ],
    },
    {
      id: 'l1-loss',
      title: 'L1 loss: mean absolute error',
      blocks: [
        { type: 'p', text: '**L1 loss** uses the absolute value of each error. Averaged over n examples, it is called **Mean Absolute Error (MAE)**. The name "L1" comes from the L1 norm, the sum of absolute values of a vector.' },
        { type: 'formula', expr: 'L1 = MAE = (1/n) ∑ |yᵢ − ŷᵢ|', where: [ ['yᵢ', 'true value for example i'], ['ŷᵢ', 'predicted value'], ['|·|', 'absolute value: drop the minus sign'] ] },
        { type: 'steps', title: 'Computing MAE for our deliveries', items: [
          { title: 'List the errors', text: 'Actual minus predicted: −1, 2, −1, 2, −1 and 56 (the road closure).' },
          { title: 'Take absolute values', text: '1, 2, 1, 2, 1, 56. Over-predicting and under-predicting count the same.' },
          { title: 'Sum them', text: '1 + 2 + 1 + 2 + 1 + 56 = 63.' },
          { title: 'Average', text: '63 / 6 = 10.5 minutes. Without the outlier, MAE is 7 / 5 = 1.4 minutes.' },
        ] },
        { type: 'p', text: 'Key properties of L1:' },
        { type: 'list', items: [
          '**Linear penalty.** An error of 10 costs exactly ten times an error of 1. Big errors matter, but not disproportionately.',
          '**Robust to outliers.** A single wild value cannot dominate the loss as much as under L2.',
          '**Easy to interpret.** MAE is in the same units as the target: "on average we are 10.5 minutes off".',
          '**Constant gradient.** The slope of |e| is +1 or −1 (and undefined exactly at 0). Every error pushes the model with the same strength regardless of size, so near the optimum it does not naturally slow down, and optimisers may need a decaying learning rate.',
          '**Aims at the median.** If a model could only output one constant, the value that minimises L1 is the median of the targets.',
        ] },
      ],
    },
    {
      id: 'l2-loss',
      title: 'L2 loss: mean squared error',
      blocks: [
        { type: 'p', text: '**L2 loss** squares each error. Averaged, it is the **Mean Squared Error (MSE)**, the default loss for regression and the one we used in Lessons 1.1 and 1.3. Its square root, **RMSE**, brings it back to the original units.' },
        { type: 'formula', expr: 'L2 = MSE = (1/n) ∑ (yᵢ − ŷᵢ)²', caption: 'For our deliveries: (1 + 4 + 1 + 4 + 1 + 3136) / 6 = 3147 / 6 = 524.5. Without the outlier: 11 / 5 = 2.2.' },
        { type: 'list', items: [
          '**Quadratic penalty.** An error of 10 costs 100 times an error of 1. The model is pushed hard to avoid big misses.',
          '**Sensitive to outliers.** Our single 56-minute error makes up 3136 of the 3147 total, 99.7% of the loss. The model will bend itself to reduce that one error, even if that makes typical predictions worse.',
          '**Smooth gradient.** The slope of e² is 2e: large for large errors and shrinking to zero as the error shrinks. This makes gradient descent stable and naturally slows down near the optimum.',
          '**Aims at the mean.** The single constant that minimises L2 is the mean of the targets.',
          '**Statistical meaning.** Minimising MSE is equivalent to maximum likelihood when the noise is Gaussian (normally distributed), one reason it is the default.',
        ] },
        { type: 'chart', kind: 'line', title: 'Penalty for each error size', xLabel: 'Error e', yLabel: 'Loss', series: [
          { name: 'L1: |e|', points: [[-4, 4], [-3, 3], [-2, 2], [-1, 1], [0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] },
          { name: 'L2: e²', points: [[-4, 16], [-3, 9], [-2, 4], [-1, 1], [0, 0], [1, 1], [2, 4], [3, 9], [4, 16]] },
        ], caption: 'Exact values. For |e| < 1, L2 is smaller than L1 (0.5² = 0.25); beyond 1, L2 grows much faster.' },
        { type: 'viz', name: 'loss-l1-l2', caption: 'Move the error slider and toggle the outlier. Watch how much more the squared loss reacts.' },
        { type: 'check', question: 'An error of 0.5 contributes 0.5 to L1 loss. What does it contribute to L2 loss, and what does this tell us about small errors?', answer: '0.5² = 0.25, less than L1. Squaring shrinks errors below 1, so L2 cares relatively little about small errors and a lot about large ones. (Note this depends on units: an error of 0.5 hours is 30 minutes.)' },
      ],
    },
    {
      id: 'code',
      title: 'Code: the same errors under both losses',
      blocks: [
        { type: 'code', lang: 'python', title: 'l1_vs_l2.py', code: `import numpy as np

# Delivery times (minutes); the last one hit a road closure
actual = np.array([30, 32, 29, 35, 31, 90], dtype=float)
predicted = np.array([31, 30, 30, 33, 32, 34], dtype=float)
err = actual - predicted

def l1(e): return np.abs(e).mean()      # mean absolute error (MAE)
def l2(e): return (e ** 2).mean()       # mean squared error (MSE)

print("errors:", err.tolist())
print(f"without the outlier: L1 = {l1(err[:5]):.2f}   L2 = {l2(err[:5]):.2f}")
print(f"with the outlier:    L1 = {l1(err):.2f}   L2 = {l2(err):.2f}")
print(f"outlier's share of total loss: L1 {abs(err[5]) / np.abs(err).sum():.1%}, "
      f"L2 {err[5]**2 / (err**2).sum():.1%}")

# If a model could only predict ONE constant c, which c minimises each loss?
grid = np.linspace(25, 95, 7001)              # try c = 25.00, 25.01, ..., 95.00
best_l1 = grid[np.argmin([l1(actual - c) for c in grid])]
best_l2 = grid[np.argmin([l2(actual - c) for c in grid])]
print(f"best constant under L1: {best_l1:.2f}  (median = {np.median(actual):.2f})")
print(f"best constant under L2: {best_l2:.2f}  (mean   = {actual.mean():.2f})")

# Gradients: how hard each loss pushes on an error of 1 vs 56
for e in (1.0, 56.0):
    print(f"error {e:>4}: L1 gradient = {np.sign(e):.0f}, L2 gradient = {2 * e:.0f}")`, output: `errors: [-1.0, 2.0, -1.0, 2.0, -1.0, 56.0]
without the outlier: L1 = 1.40   L2 = 2.20
with the outlier:    L1 = 10.50   L2 = 524.50
outlier's share of total loss: L1 88.9%, L2 99.7%
best constant under L1: 31.00  (median = 31.50)
best constant under L2: 41.17  (mean   = 41.17)
error  1.0: L1 gradient = 1, L2 gradient = 2
error 56.0: L1 gradient = 1, L2 gradient = 112`, walkthrough: [
          { lines: [3, 6], note: 'Six deliveries and the model\'s predictions. The error is actual − predicted; the last is +56 minutes.' },
          { lines: [8, 9], note: 'The two losses in one line each: average of absolute errors vs average of squared errors.' },
          { lines: [11, 15], note: 'Adding one outlier multiplies L1 by 7.5 (1.4 → 10.5) but L2 by about 238 (2.2 → 524.5). Under L2, the outlier is 99.7% of the loss.' },
          { lines: [17, 22], note: 'Try every constant prediction from 25 to 95. L2 picks the mean (41.17), dragged up by the 90. L1 picks a value in the middle of the typical times. With an even number of points, every value between the two middle ones (31 and 32) gives the same L1 loss; the grid reports the first, 31.00, and the textbook median is 31.5.' },
          { lines: [24, 26], note: 'The gradient tells training how hard to push. L1 pushes with strength 1 whatever the error; L2 pushes 56 times harder on the outlier than on a 1-minute error.' },
        ] },
        { type: 'check', question: 'If the predictions above were used to set a promised delivery time for customers, which loss gives a more useful "typical" time: L1 (≈31) or L2 (≈41)?', answer: 'For "typical" customer experience, L1\'s ≈31 minutes is more representative: five of six deliveries took 29–35 minutes. L2\'s 41 minutes is pulled up by a single road closure. (If late deliveries are very costly to the business, though, we might deliberately prefer a loss that weighs them heavily.)' },
      ],
    },
    {
      id: 'decide',
      title: 'How to decide between L1 and L2 loss',
      blocks: [
        { type: 'compare', title: 'L1 loss vs L2 loss', options: [
          { name: 'L1 (MAE)', summary: 'Average absolute error; linear penalty.', pros: ['Robust to outliers', 'Same units as the target, easy to explain', 'Estimates the median'], cons: ['Not differentiable at 0', 'Constant gradient can make convergence jumpy', 'Treats a big miss as merely proportionally bad'], bestFor: 'Data with outliers or noisy labels; when typical-case accuracy matters' },
          { name: 'L2 (MSE)', summary: 'Average squared error; quadratic penalty.', pros: ['Smooth, easy to optimise', 'Closed-form solution for linear regression', 'Strongly discourages big errors'], cons: ['Outliers dominate the loss', 'Units are squared (use RMSE to report)', 'Estimates the mean, which outliers pull'], bestFor: 'Clean, roughly Gaussian noise; when large errors are especially costly' },
        ], rows: [
          ['Penalty for error e', '|e|', 'e²'],
          ['Gradient', '±1 (constant size)', '2e (proportional)'],
          ['Effect of outliers', 'Limited', 'Very large'],
          ['Best constant predictor', 'Median', 'Mean'],
          ['Smooth at zero?', 'No (a sharp corner)', 'Yes'],
        ], verdict: 'Trust the data and fear big misses → L2. Expect outliers or bad labels and want typical accuracy → L1. Want both → Huber loss.' },
        { type: 'p', text: 'A practical set of questions:' },
        { type: 'list', ordered: true, items: [
          '**Are there outliers, and are they real or errors?** If they are data-entry mistakes or rare freak events we do not want to model, prefer L1 (or clean the data). If they are real and important, L2 makes sure the model takes them seriously.',
          '**How costly is a big error compared with several small ones?** If one 50-minute miss is much worse than ten 5-minute misses, L2 matches that preference.',
          '**What will we report to people?** MAE ("10 minutes off on average") is easier to explain than MSE. Many teams train with one loss and report several metrics.',
          '**Does training need to be smooth?** L2\'s gradient is friendlier for gradient descent, especially near the optimum.',
        ] },
        { type: 'deeper', title: 'Huber loss: the best of both', blocks: [
          { type: 'p', text: '**Huber loss** behaves like L2 for small errors and like L1 for large ones, switching at a threshold δ (delta):' },
          { type: 'formula', expr: 'Huber(e) = ½·e²  if |e| ≤ δ;   δ·(|e| − ½·δ)  otherwise', caption: 'With δ = 1: an error of 0.5 costs 0.125 (quadratic); an error of 56 costs 55.5 (linear), instead of 1568 under ½·e².' },
          { type: 'p', text: 'It is smooth near zero (good for optimisation) and robust far away (good with outliers). A closely related variant called **Smooth L1** is used in object detection models to regress bounding boxes. The catch is one more setting, δ, that must be chosen.' },
        ] },
      ],
    },
    {
      id: 'real-world',
      title: 'Where these losses show up',
      blocks: [
        { type: 'table', head: ['Setting', 'Typical loss', 'Why'], rows: [
          ['Linear regression on clean data', 'L2 (MSE)', 'Closed-form solution, Gaussian noise assumption'],
          ['Demand or delivery-time forecasting with occasional spikes', 'L1 (MAE) or Huber', 'Spikes should not distort typical predictions'],
          ['Bounding-box regression in object detection', 'Smooth L1 / Huber, or L1 in some models', 'Robust to badly wrong early predictions'],
          ['Diffusion models predicting noise (Module 15)', 'Usually L2 (MSE) on the noise', 'Smooth objective with a clear probabilistic meaning'],
          ['Image-to-image models where blur is a problem', 'Often L1 on pixels', 'L2 tends to average possibilities into blurry images'],
          ['Classification', 'Neither: cross-entropy (Lesson 2.4)', 'Targets are classes, not numbers'],
        ] },
        { type: 'callout', tone: 'note', title: 'Do not confuse with L1/L2 regularisation', text: 'L1 and L2 **losses** measure prediction errors. L1 and L2 **regularisation** (next lesson) add a penalty on the model\'s weights to prevent overfitting. Both use the same two norms, |·| and (·)², which is why the names match, but they serve different purposes and are often used together, for example MSE loss + L2 weight penalty.' },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and limits',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Comparing MSE across different units', text: 'MSE is in squared units: an MSE of 100 minutes² is an RMSE of 10 minutes. Comparing raw MSE values between datasets or units is meaningless. Report RMSE or MAE for humans.' },
        { type: 'list', items: [
          '**Using L2 on dirty data without looking.** A few mislabelled rows can drag the whole model. Plot the errors first.',
          '**Dropping outliers automatically.** Outliers may be the most important cases (fraud, failures). Decide on purpose whether to model them.',
          '**Assuming L1 has no downsides.** Its gradient does not shrink near the optimum, and the median ignores how far the extreme values are, which is wrong if extremes are what matter.',
          '**Using a regression loss for classification.** For class probabilities, use log loss or cross-entropy (Lesson 1.3 and Module 2).',
        ] },
      ],
    },
  ],
  quiz: [
    {
      q: 'Which formula is the L1 loss (mean absolute error)?',
      options: ['(1/n) ∑ (yᵢ − ŷᵢ)²', '(1/n) ∑ |yᵢ − ŷᵢ|', '√((1/n) ∑ (yᵢ − ŷᵢ)²)', '−(1/n) ∑ yᵢ·ln(ŷᵢ)'],
      answer: 1,
      explain: 'L1 averages absolute errors. The first is MSE (L2), the third is RMSE, and the last is a cross-entropy style loss for classification.',
    },
    {
      q: 'Our sensor data has a few readings that are obviously broken (values 100× too large). We train with MSE and predictions for normal readings are poor. What is a sensible change?',
      options: ["Switch to L1 or Huber loss, and investigate the broken readings", "Switch to an even higher power, like the error to the 4th power", "Keep MSE but report RMSE instead, since it has the right units", "Increase the learning rate so training gets past the outliers"],
      answer: 0,
      explain: 'Squared error lets a few huge errors dominate training. L1 or Huber limits their influence; cleaning or flagging the broken readings is also wise. A higher power would make the problem worse.',
    },
    {
      q: 'Errors are 1, 2, 1, 2, 1 and 56. What is the L2 loss (MSE)?',
      options: ["10.5", "63", "3,147", "524.5"],
      answer: 3,
      explain: 'Squares: 1 + 4 + 1 + 4 + 1 + 3136 = 3147. Divided by 6: 524.5. 10.5 is the MAE, 63 is the sum of absolute errors, 3147 is the unaveraged sum of squares.',
    },
    {
      q: 'If a model can output only a single constant value, which constant minimises each loss?',
      options: ['L1 → the median, L2 → the mean', 'L1 → the mean, L2 → the median', 'Both → the mean', 'Both → the largest value'],
      answer: 0,
      explain: 'Minimising absolute error gives the median, which ignores how extreme the outliers are. Minimising squared error gives the mean, which outliers pull towards themselves.',
    },
    {
      q: 'A colleague says: "L2 loss is always better because its gradients are smooth." What is the flaw in this claim?',
      options: ["Nothing: L2 really is always the better choice of loss", "L2 gradients are actually not smooth, so the claim is false", "Smoothness helps, but L2 lets outliers dominate; it depends", "Loss choice has no effect on what the model actually learns"],
      answer: 2,
      explain: 'Smoothness is a real advantage of L2, but it comes with outlier sensitivity. Neither loss is universally better; Huber exists precisely to combine their strengths.',
    },
  ],
  takeaways: [
    'A loss function turns errors into one number to minimise, and its shape decides which mistakes the model cares about.',
    'L1 (MAE) = average |error|: linear penalty, robust to outliers, targets the median.',
    'L2 (MSE) = average error²: quadratic penalty, smooth gradient, outlier-sensitive, targets the mean.',
    'Choose L2 for clean data where big errors are costly; L1 when outliers or noisy labels are expected; Huber to combine both.',
    'L1/L2 losses are about errors; L1/L2 regularisation is about weights.',
  ],
  terms: [
    { term: 'Loss function', def: 'A function that measures how wrong a model\'s predictions are, which training minimises.' },
    { term: 'Residual', def: 'The error for one example: true value minus predicted value.' },
    { term: 'L1 loss (MAE)', def: 'The mean of the absolute errors.' },
    { term: 'L2 loss (MSE)', def: 'The mean of the squared errors.' },
    { term: 'RMSE', def: 'The square root of MSE, in the same units as the target.' },
    { term: 'Outlier', def: 'A data point far from the others, which can heavily influence squared-error losses.' },
    { term: 'Huber loss', def: 'A loss that is quadratic for small errors and linear for large errors.' },
  ],
};
