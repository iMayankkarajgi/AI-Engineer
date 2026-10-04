export default {
  id: 'supervised-vs-unsupervised-learning',
  minutes: 21,
  hook: 'If we have a million customer records but nobody has labelled a single one, can a machine still learn something useful from them?',
  summary: 'Supervised learning learns from examples that come with the correct answer (a label) and then predicts that answer for new inputs. Unsupervised learning gets no answers at all and instead discovers structure on its own, such as groups, unusual points, or simpler representations. The choice depends mostly on whether we have labels and whether we know exactly what we want to predict.',
  sections: [
    {
      id: 'the-question',
      title: 'Two ways to learn from data',
      blocks: [
        { type: 'p', text: 'In the previous lesson we saw that machine learning means learning patterns from data. But "data" comes in two very different flavours. Sometimes every example comes with the answer attached: each past email is marked spam or not spam, each sold house has its sale price. Other times we just have raw records with no answers: a list of customer purchases, a pile of server logs, millions of photos.' },
        { type: 'p', text: 'That single difference, **whether the data includes the correct answers**, splits machine learning into its two biggest families: **supervised** and **unsupervised** learning.' },
        { type: 'callout', tone: 'analogy', title: 'A teacher with an answer key vs an explorer', text: 'Supervised learning is like a student practising with a workbook that has an answer key: try a question, check the answer, correct yourself. Unsupervised learning is like being handed a box of mixed buttons and asked to sort them. Nobody tells you the "right" groups; you notice on your own that some are big, some small, some red, some metal.' },
        { type: 'p', text: 'Our running example in this lesson is an online shop with customer data: how often each customer visits per month and how much they spend per order.' },
      ],
    },
    {
      id: 'supervised',
      title: 'Supervised learning',
      blocks: [
        { type: 'p', text: 'In **supervised learning**, each training example is a pair: an input `x` (the features) and the correct output `y` (the **label**). The algorithm learns a function `f` so that `f(x) ≈ y`. It is called "supervised" because the labels act like a supervisor that tells the model whether it was right during training.' },
        { type: 'flow', title: 'Supervised learning pipeline', nodes: [
          { label: 'Labelled data', detail: 'Examples with answers, e.g. customers already tagged "casual" or "loyal" by the marketing team.' },
          { label: 'Train', detail: 'The model predicts labels for training examples, compares with the true labels using a loss, and adjusts its parameters.' },
          { label: 'Evaluate', detail: 'Measure accuracy (or error) on held-out labelled data the model has not seen.' },
          { label: 'Predict', detail: 'Use the model on new, unlabelled customers to predict their label.' },
        ] },
        { type: 'p', text: 'Supervised problems come in two main shapes, depending on what the label is:' },
        { type: 'list', items: [
          '**Classification:** the label is a category. Is this email spam or not? Is this customer likely to cancel? Which of 10 digits is in this image? Common models: logistic regression, decision trees, random forests, gradient-boosted trees, neural networks.',
          '**Regression:** the label is a number. What price will this house sell for? How many units will we sell next week? Common models: linear regression, gradient-boosted trees, neural networks.',
        ] },
        { type: 'chart', kind: 'scatter', title: 'Labelled customers (supervised view)', xLabel: 'Visits per month', yLabel: 'Average basket ($)', series: [
          { name: 'Casual (label 0)', points: [[1, 18], [2, 22], [3, 15], [2, 25], [1, 20], [3, 19], [2, 14], [4, 24]] },
          { name: 'Loyal (label 1)', points: [[11, 55], [13, 62], [12, 70], [10, 52], [14, 58], [12, 48], [9, 66], [13, 61]] },
        ], caption: 'Illustrative points. In the supervised setting, every point already has a colour (its label). The model learns where to draw the boundary between colours.' },
        { type: 'p', text: 'The big strength of supervised learning is that success is easy to define and measure: we know the right answer, so we can count how often we got it. The big cost is **labels**. Someone has to create them, and that can be slow and expensive: doctors labelling scans, lawyers labelling contracts, annotators labelling millions of images.' },
      ],
    },
    {
      id: 'unsupervised',
      title: 'Unsupervised learning',
      blocks: [
        { type: 'p', text: 'In **unsupervised learning**, we only have inputs `x`, with no labels. The algorithm\'s job is to find structure hidden in the data by itself. There is no "correct answer" to check against during training; the algorithm optimises some internal goal, such as "points in the same group should be close together".' },
        { type: 'p', text: 'The main unsupervised tasks are:' },
        { type: 'list', items: [
          '**Clustering:** group similar examples together. Example: discover customer segments. Common algorithms: k-means, DBSCAN, hierarchical clustering.',
          '**Dimensionality reduction:** compress many features into a few that keep most of the information, for visualisation or speed. Example: PCA (principal component analysis) turning 100 survey answers into 2 summary scores.',
          '**Anomaly detection:** find examples that do not fit the usual pattern. Example: flag a card transaction that looks unlike anything that customer normally does.',
          '**Association rules:** find items that occur together. Example: "people who buy pasta often buy tomato sauce".',
        ] },
        { type: 'steps', title: 'How k-means clustering works', items: [
          { title: 'Choose k', text: 'Decide how many groups we want, say k = 2. (Choosing k is itself a judgement call.)' },
          { title: 'Place starting centres', text: 'Pick k starting points as initial group centres, for example k random customers.' },
          { title: 'Assign', text: 'Put every customer into the group whose centre is nearest (by distance).' },
          { title: 'Update', text: 'Move each centre to the average position of the customers assigned to it.' },
          { title: 'Repeat', text: 'Repeat assign and update until the groups stop changing. The result is k groups of similar customers.' },
        ] },
        { type: 'callout', tone: 'note', title: 'The groups have no names', text: 'k-means might find "group A: frequent big spenders" and "group B: rare small spenders", but it does not know those words. A human must look at each group and interpret it. The algorithm only says these points belong together.' },
        { type: 'check', question: 'Pause and think: we run clustering with k = 5 on our customers and get five groups. Can we say the model is "92% accurate"?', answer: 'Not directly. With no labels there is no ground truth to compare against. We judge clustering with internal measures (how tight and well-separated groups are) and, most importantly, by whether the groups are useful for the business, for example whether targeted campaigns per group perform better.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: the same data, both ways',
      blocks: [
        { type: 'p', text: 'We create 60 customers from two hidden types. First we use the labels (supervised): learn the centre of each known class and classify a new customer. Then we throw the labels away (unsupervised) and let k-means discover the groups on its own.' },
        { type: 'code', lang: 'python', title: 'supervised_vs_unsupervised.py', code: `import numpy as np

# 60 customers: [visits per month, average basket in $]
rng = np.random.default_rng(7)
casual = rng.normal([2, 20], [1, 5], size=(30, 2))
loyal = rng.normal([12, 60], [2, 10], size=(30, 2))
X = np.vstack([casual, loyal])
y = np.array([0] * 30 + [1] * 30)          # labels: 0 = casual, 1 = loyal

# --- Supervised: we HAVE labels, so learn one centre per known class ---
centres = np.array([X[y == c].mean(axis=0) for c in (0, 1)])
new_customer = np.array([10, 55])
dists = np.linalg.norm(centres - new_customer, axis=1)
print("supervised class centres:", centres.round(1).tolist())
print("new customer [10, 55] -> predicted class:", dists.argmin())

# --- Unsupervised: pretend we have NO labels; k-means finds 2 groups ---
k_centres = X[[0, 1]].copy()                # start from two arbitrary points
for step in range(10):
    d = np.linalg.norm(X[:, None, :] - k_centres[None], axis=2)
    groups = d.argmin(axis=1)               # assign each point to nearest centre
    k_centres = np.array([X[groups == g].mean(axis=0) for g in (0, 1)])
print("k-means centres found:", k_centres.round(1).tolist())
print("group sizes:", np.bincount(groups).tolist())

# The groups have no names: k-means only says "these points belong together".
agree = max((groups == y).mean(), (groups != y).mean())
print(f"match with the hidden labels: {agree:.0%}")`, output: `supervised class centres: [[1.7, 19.4], [11.8, 59.1]]
new customer [10, 55] -> predicted class: 1
k-means centres found: [[11.8, 59.1], [1.7, 19.4]]
group sizes: [30, 30]
match with the hidden labels: 100%`, walkthrough: [
          { lines: [3, 8], note: 'Two hidden customer types. `y` holds the labels, which only the supervised part is allowed to use.' },
          { lines: [10, 15], note: 'Supervised (a nearest-centroid classifier): average each labelled class, then label a new customer by the closest class centre. Customer [10, 55] is closest to the loyal centre, so class 1.' },
          { lines: [17, 22], note: 'Unsupervised (k-means): start with two centres, then alternate "assign each point to its nearest centre" and "move centres to the mean of their points".' },
          { lines: [23, 24], note: 'k-means finds the same two centres, but notice the order is swapped: its "group 0" is the loyal one. Group numbers are arbitrary because it never saw the names.' },
          { lines: [26, 28], note: 'Only because this is a toy example with hidden labels can we check: the discovered groups match the real types perfectly (allowing for the swapped numbering). Real data is rarely this clean.' },
        ] },
        { type: 'check', question: 'In the output, k-means calls the loyal customers "group 0", while the labels call them class 1. Is that an error?', answer: 'No. Unsupervised algorithms produce groups, not named classes, so group numbers are arbitrary. That is why we compared both ways of matching (groups == y and groups != y) and took the better one.' },
      ],
    },
    {
      id: 'differences',
      title: 'Differences between supervised and unsupervised learning',
      blocks: [
        { type: 'compare', title: 'Supervised vs unsupervised learning', options: [
          { name: 'Supervised', summary: 'Learn a mapping from inputs to known answers.', pros: ['Clear goal and clear accuracy metrics', 'Usually more accurate for a specific prediction task', 'Predictions are directly actionable'], cons: ['Needs labelled data, which can be costly', 'Can only predict what was labelled', 'Labels can be wrong or biased'], bestFor: 'Spam detection, price prediction, churn prediction, medical image diagnosis' },
          { name: 'Unsupervised', summary: 'Discover structure in data without answers.', pros: ['Works on raw, unlabelled data, which is plentiful', 'Can reveal patterns nobody thought to look for', 'Useful for exploration and preprocessing'], cons: ['Harder to evaluate objectively', 'Results need human interpretation', 'Sensitive to choices like k and feature scaling'], bestFor: 'Customer segmentation, anomaly detection, data exploration, compression' },
        ], rows: [
          ['Training data', 'Inputs + labels (x, y)', 'Inputs only (x)'],
          ['Goal', 'Predict a known target', 'Find hidden structure'],
          ['Typical tasks', 'Classification, regression', 'Clustering, dimensionality reduction, anomaly detection'],
          ['How we evaluate', 'Compare predictions with true labels (accuracy, error)', 'Internal scores and usefulness to people'],
          ['Example algorithms', 'Linear/logistic regression, decision trees, neural nets', 'k-means, PCA, DBSCAN, autoencoders'],
          ['Human effort', 'Mostly in labelling', 'Mostly in interpreting results'],
        ], verdict: 'If we know exactly what we want to predict and can get labels, use supervised learning. If we want to explore, group, or spot the unusual without labels, use unsupervised learning.' },
        { type: 'callout', tone: 'warn', title: 'Common misconception', text: '"Unsupervised means no humans involved." Not true. People still choose the features, the algorithm, settings like k, and must interpret and validate the results. Unsupervised only means the training data has no labels.' },
      ],
    },
    {
      id: 'in-between',
      title: 'The space in between: semi-supervised and self-supervised',
      blocks: [
        { type: 'p', text: 'Real projects often blend the two. Two in-between approaches matter a lot for modern AI:' },
        { type: 'list', items: [
          '**Semi-supervised learning:** a small labelled set plus a large unlabelled set. For example, label 1,000 support tickets by hand, then use patterns in 100,000 unlabelled tickets to improve the classifier.',
          '**Self-supervised learning:** create labels automatically from the data itself. Hide the next word in a sentence and ask the model to predict it: the "label" is just the real next word. This is how LLMs are pre-trained on huge amounts of raw text, and it is closely related to contrastive learning (Lesson 2.9).',
        ] },
        { type: 'p', text: 'Self-supervised training produces **embeddings**: lists of numbers where similar items end up near each other. Explore a small embedding map below. Notice that related words cluster together even though nobody labelled them as related.' },
        { type: 'viz', name: 'embedding-space', caption: 'Click a word to see its nearest neighbours. These groupings emerged from raw text without human labels.' },
        { type: 'p', text: 'There is also a third major family, **reinforcement learning**, where an agent learns from rewards rather than labels. We cover it in Lesson 2.8.' },
      ],
    },
    {
      id: 'real-world',
      title: 'Real-world use and how to choose',
      blocks: [
        { type: 'table', caption: 'Which approach fits which problem?', head: ['Problem', 'Approach', 'Why'], rows: [
          ['Flag fraudulent card payments when past fraud cases are known', 'Supervised classification', 'We have labelled examples of fraud and non-fraud'],
          ['Spot brand-new fraud patterns never seen before', 'Unsupervised anomaly detection', 'New attacks have no labels yet'],
          ['Forecast next month\'s sales', 'Supervised regression', 'Past months give us inputs and the true sales numbers'],
          ['Split users into marketing segments', 'Unsupervised clustering', 'There is no single correct segmentation to learn from'],
          ['Route support tickets to the right team', 'Supervised classification', 'Past tickets were already assigned to teams'],
          ['Group similar support tickets to find emerging issues', 'Unsupervised clustering of embeddings', 'Emerging issues have no label yet'],
        ] },
        { type: 'callout', tone: 'example', title: 'They often work together', text: 'A common pattern: first cluster unlabelled data to understand it and decide which categories matter, then label a sample per category, then train a supervised model. Unsupervised dimensionality reduction (like PCA) is also often used as a preprocessing step before a supervised model.' },
        { type: 'callout', tone: 'tip', title: 'Pitfalls to remember', text: 'For supervised learning, check label quality: noisy or inconsistent labels cap how good the model can get. For unsupervised learning, scale features first (Lesson 2.4): if "basket in dollars" ranges up to 100 and "visits" up to 15, distance is dominated by dollars, and clusters may reflect units rather than real behaviour.' },
      ],
    },
    {
      id: 'common-mistakes',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'Clustering always returns groups, even when the groups mean nothing. So the mistakes here are quiet ones: the code runs, the output looks tidy, and the result is still wrong. Two of them are worth working through with numbers.' },
        { type: 'p', text: '**Mistake 1: letting units decide the groups.** Take three illustrative customers. A visits 2 times and spends $20. B visits 12 times and spends $24. C visits 3 times and spends $38. By behaviour, A and C are both rare visitors, and B is a regular. Now measure straight-line distance on the raw numbers, and again after dividing visits by 15 and basket by 100 so both features run from about 0 to 1.' },
        { type: 'table', caption: 'Illustrative customers. Distance = √(Δvisits² + Δbasket²).', head: ['Pair', 'Raw distance', 'Scaled distance', 'Who is A\'s nearest neighbour?'], rows: [
          ['A to B', '√(10² + 4²) ≈ 10.8', '√(0.667² + 0.04²) ≈ 0.67', 'Raw: B'],
          ['A to C', '√(1² + 18²) ≈ 18.0', '√(0.067² + 0.18²) ≈ 0.19', 'Scaled: C'],
        ] },
        { type: 'p', text: 'The nearest neighbour flips. On raw numbers an $18 gap looks bigger than a 10-visit gap only because dollars use bigger numbers. To spot this, print the range of each feature before clustering. If one range is many times larger than another, scale first.' },
        { type: 'p', text: '**Mistake 2: picking k by the lowest score.** The usual internal score is the total squared distance from each point to its own centre. We will call it the **spread**. More groups always give a lower spread, and with one group per customer it reaches zero. So "lowest spread" always votes for the largest k. What we look for instead is the **elbow**: the k after which the spread stops falling sharply.' },
        { type: 'steps', title: 'A safer routine for clustering', items: [
          { title: 'Scale the features', text: 'Put every feature on a similar range so no single unit dominates the distance.' },
          { title: 'Try several k', text: 'Run the algorithm for k = 1, 2, 3 and so on, and record the spread each time.' },
          { title: 'Find the elbow', text: 'Pick the k where the big drops end. After it, extra groups only split real groups into pieces.' },
          { title: 'Look inside each group', text: 'Print a few members and the group averages. If we cannot describe a group in one plain sentence, it may not be real.' },
          { title: 'Test usefulness', text: 'Check that acting on the groups helps, for example that a campaign per group does better than one campaign for all.' },
        ] },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will run k-means for k = 1 to 6 on customers drawn from three hidden types, and watch the spread. The goal is to find the elbow ourselves, with no labels to help.' },
        { type: 'code', lang: 'python', title: 'practice_choose_k.py', code: `import numpy as np

# 45 unlabelled customers drawn from 3 hidden types: [visits, basket $]
rng = np.random.default_rng(11)
centres = np.array([[2, 20], [8, 35], [14, 70]])
X = np.vstack([rng.normal(c, [1.0, 4.0], size=(15, 2)) for c in centres])

def kmeans(X, k, steps=20):
    """Plain k-means. Start centres are spread out: each new one is the
    point farthest from the centres picked so far (no randomness)."""
    C = [X[0]]
    while len(C) < k:
        d = np.min([np.linalg.norm(X - c, axis=1) for c in C], axis=0)
        C.append(X[d.argmax()])
    C = np.array(C)
    for _ in range(steps):
        groups = np.linalg.norm(X[:, None] - C[None], axis=2).argmin(axis=1)
        C = np.array([X[groups == g].mean(axis=0) for g in range(k)])
    spread = ((X - C[groups]) ** 2).sum()    # total squared distance to own centre
    return groups, spread

print(" k  spread  group sizes")
for k in range(1, 7):
    groups, spread = kmeans(X, k)
    print(f"{k:2d}  {spread:6.0f}  {np.bincount(groups).tolist()}")`, output: ` k  spread  group sizes
 1   23168  [45]
 2    2730  [30, 15]
 3     545  [15, 15, 15]
 4     381  [15, 8, 15, 7]
 5     285  [8, 8, 15, 7, 7]
 6     185  [8, 8, 8, 7, 7, 7]`, walkthrough: [
          { lines: [3, 6], note: 'Make 45 customers from three hidden types. We keep no labels at all.' },
          { lines: [8, 15], note: 'Choose spread-out starting centres: each new centre is the point farthest from the ones already chosen. This keeps the run repeatable.' },
          { lines: [16, 20], note: 'The usual k-means loop (assign, then move centres), followed by the spread: total squared distance from each point to its own centre.' },
          { lines: [22, 25], note: 'Try k = 1 to 6 and print the spread and group sizes for each.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change the middle hidden centre from `[8, 35]` to `[3, 24]`, so it almost overlaps the first type. Predict where the elbow moves to before you run it.',
          'Change the noise from `[1.0, 4.0]` to `[3.0, 12.0]`. Predict whether the drop from k = 2 to k = 3 is still as sharp, and what that says about messy real data.',
          'Add the line `X = (X - X.mean(axis=0)) / X.std(axis=0)` right after `X` is created. Predict whether the k = 3 group sizes change, and why the spread numbers become much smaller.',
        ] },
        { type: 'check', question: 'The spread keeps falling all the way to k = 6. Why do we still say k = 3 is the best choice for this data?', answer: 'Because the large drops stop at 3: from 23,168 to 2,730 to 545. After that each extra group saves only a little (545 to 381 to 285), and the group sizes show what is happening: k = 4 just cuts one group of 15 into 8 and 7. Spread always falls as k grows, so we look for the elbow, not the minimum.' },
        { type: 'check', question: 'At k = 2 the group sizes are [30, 15]. Which two hidden types were merged, and why those two?', answer: 'The first two types, centred at [2, 20] and [8, 35], were merged. They are much closer to each other than either is to the third type at [14, 70]. With only two centres, k-means lowers the spread most by keeping the far-away group separate and covering the two nearby groups with one centre.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What is the defining difference between supervised and unsupervised learning?',
      options: ["Supervised uses neural networks while unsupervised never does", "Supervised trains on labelled examples; unsupervised has no labels", "Unsupervised learning can be done without any data at all", "Supervised learning is always more accurate than unsupervised"],
      answer: 1,
      explain: 'The split is about labels. Both families can use neural networks, both need data, and neither is "always" better: they solve different problems.',
    },
    {
      q: 'A bank has millions of transactions but no record of which were fraudulent. It wants to flag unusual ones for review. Which approach fits best?',
      options: ['Supervised regression', 'Supervised classification', 'Unsupervised anomaly detection', 'Linear regression on transaction amounts'],
      answer: 2,
      explain: 'Without fraud labels, supervised methods have nothing to learn from. Anomaly detection finds transactions that do not fit normal patterns, which humans can then review.',
    },
    {
      q: 'In the code, k-means reports centres [[11.8, 59.1], [1.7, 19.4]] while the supervised class centres are [[1.7, 19.4], [11.8, 59.1]]. What does this tell us?',
      options: ["k-means found the same two groups; its group numbers are arbitrary", "k-means failed and settled on two completely wrong customer groups", "The supervised model must have mislabelled every single customer", "k-means secretly used the labels, which is why the centres match"],
      answer: 0,
      explain: 'The centres are identical, just listed in the opposite order. Unsupervised methods never see label names, so which group is "0" is arbitrary.',
    },
    {
      q: 'Which pair correctly matches a supervised task type with an unsupervised task type?',
      options: ['Clustering (supervised) and regression (unsupervised)', 'Classification (supervised) and clustering (unsupervised)', 'Dimensionality reduction (supervised) and classification (unsupervised)', 'Regression (supervised) and classification (unsupervised)'],
      answer: 1,
      explain: 'Classification and regression are supervised (they need labels). Clustering, dimensionality reduction and anomaly detection are unsupervised.',
    },
    {
      q: 'A colleague says: "Unsupervised learning means the computer does everything with no human input." What is the best correction?',
      options: ["That is correct: the algorithm runs with no human decisions involved", "It only means no labels; people still pick features, k, and interpret", "Unsupervised learning actually needs more labels than supervised", "Unsupervised learning is only ever used for image data, not text"],
      answer: 1,
      explain: 'The word refers only to the missing labels. Feature choice, algorithm settings and interpretation are all human decisions.',
    },
  ],
  takeaways: [
    'Supervised learning learns from (input, label) pairs and predicts labels for new inputs.',
    'Classification predicts categories; regression predicts numbers. Both are supervised.',
    'Unsupervised learning finds structure in unlabelled data: clusters, compressed representations, anomalies.',
    'Supervised results are easy to measure but need labels; unsupervised results need human interpretation.',
    'Self-supervised learning makes labels from the data itself and is how LLMs are pre-trained.',
  ],
  terms: [
    { term: 'Supervised learning', def: 'Learning a mapping from inputs to outputs using examples that include the correct output.' },
    { term: 'Unsupervised learning', def: 'Learning patterns or structure from data that has no labels.' },
    { term: 'Label', def: 'The correct answer attached to a training example.' },
    { term: 'Classification', def: 'A supervised task where the output is a category.' },
    { term: 'Clustering', def: 'Grouping examples so that similar ones end up in the same group.' },
    { term: 'k-means', def: 'A clustering algorithm that alternates assigning points to the nearest of k centres and moving centres to the mean of their points.' },
    { term: 'Self-supervised learning', def: 'Training where labels are generated automatically from the data itself, such as predicting a hidden next word.' },
  ],
};
