export default {
  id: 'feature-engineering',
  minutes: 18,
  hook: 'Why can the same simple model go from an average error of 40.8 to 6.7 without changing a single line of the algorithm, just by changing how we describe the data?',
  summary: 'Feature engineering is turning raw data into input columns (features) that make the pattern easy for a model to learn: filling missing values, encoding categories, scaling numbers, transforming skewed values, and creating new features from domain knowledge. Good features often matter more than the choice of algorithm, especially for tabular data. Deep learning learns many features automatically, but feature engineering still matters in production AI systems.',
  sections: [
    {
      id: 'why-features',
      title: 'Why the way we describe data matters',
      blocks: [
        { type: 'p', text: 'A **feature** is one measurable input that we give a model, such as a house\'s area, its city, or the day of the week. A model never sees the "real" house; it only sees the numbers we choose to describe it. If those numbers hide the pattern, even a powerful model struggles. If they make the pattern obvious, even a simple model shines.' },
        { type: 'p', text: '**Feature engineering** is the process of using domain knowledge and data handling techniques to create, transform, and select the features a model learns from. It sits between raw data and model training.' },
        { type: 'callout', tone: 'analogy', title: 'Preparing ingredients before cooking', text: 'A great chef with unwashed, uncut, mislabelled ingredients will still cook a poor meal. Washing, chopping and measuring (cleaning, encoding, scaling) and choosing the right ingredients (selecting and creating features) is most of the work. The stove (the algorithm) matters less than people expect.' },
        { type: 'p', text: 'A saying in machine learning is "garbage in, garbage out": a model can only be as good as the information in its inputs. Experienced practitioners often report that data preparation and feature work take more time than training models. For tabular business data (rows and columns, like spreadsheets) good features frequently beat a fancier algorithm.' },
        { type: 'p', text: 'Running example: we predict plot prices from a dataset where each row has the plot\'s `length`, `width` and `city`.' },
      ],
    },
    {
      id: 'the-pipeline',
      title: 'Where feature engineering fits',
      blocks: [
        { type: 'flow', title: 'From raw data to model', nodes: [
          { label: 'Raw data', detail: 'Database rows, logs, text, timestamps. Messy: missing values, text categories, wildly different scales.' },
          { label: 'Clean', detail: 'Fix types, remove duplicates, handle missing values and obvious errors.' },
          { label: 'Transform', detail: 'Encode categories as numbers, scale numeric columns, apply log transforms to skewed values.' },
          { label: 'Create', detail: 'Build new features from domain knowledge: area = length × width, day-of-week from a date, ratios, counts.' },
          { label: 'Select', detail: 'Keep features that help; drop useless, redundant or leaky ones.' },
          { label: 'Train', detail: 'Feed the final feature table to the model, using exactly the same steps at prediction time.' },
        ] },
        { type: 'p', text: 'The last point matters: the same transformations must be applied, in the same way, to training data and to live data at prediction time. Teams usually code the steps as a reusable **pipeline** for this reason.' },
      ],
    },
    {
      id: 'core-techniques',
      title: 'The core techniques, one by one',
      blocks: [
        { type: 'steps', title: 'A feature engineering checklist', items: [
          { title: 'Handle missing values', text: 'Fill (impute) gaps with a sensible value such as the median for numbers or a "missing" category for text. Often add a flag feature like `age_was_missing = 1`, because the fact that a value is missing can itself be informative.' },
          { title: 'Encode categories', text: 'Models need numbers. Turn categories like city into numbers with one-hot encoding (one 0/1 column per category) or, for ordered categories like small < medium < large, an ordinal code 0, 1, 2.' },
          { title: 'Scale numeric features', text: 'Put features on similar ranges so no feature dominates just because of its units. Standardisation: z = (x − mean) / std. Min-max scaling: (x − min) / (max − min), giving 0 to 1.' },
          { title: 'Transform skewed values', text: 'Income, prices and counts are often heavily skewed: a few huge values. A log transform compresses them: incomes of 30,000, 300,000 and 3,000,000 become log₁₀ values of about 4.5, 5.5 and 6.5.' },
          { title: 'Create new features', text: 'Combine columns using knowledge of the problem: area = length × width, price per square metre, age = today − birth date, "is weekend" from a timestamp, number of purchases in the last 30 days.' },
          { title: 'Select features', text: 'Remove features that add noise, duplicate others, or would not be available at prediction time. Fewer, better features are easier to train, explain and maintain.' },
        ] },
        { type: 'matrix', title: 'One-hot encoding of the city column', rows: ['Pune', 'Mumbai', 'Nagpur'], cols: ['is_Pune', 'is_Mumbai', 'is_Nagpur'], values: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], format: 'int', caption: 'Each city gets its own 0/1 column; exactly one is 1 per row. In linear models we often drop one column (the "reference" category), because it can be inferred from the others.' },
        { type: 'check', question: 'Why is encoding cities as Pune = 0, Mumbai = 1, Nagpur = 2 a problem for a linear model?', answer: 'The model treats the code as a quantity. It assumes Mumbai is "between" Pune and Nagpur and that the price effect grows in equal steps (Nagpur = 2 × Mumbai\'s effect). City names have no such order. One-hot encoding gives each city its own independent weight.' },
        { type: 'deeper', title: 'More encodings and when they fit', blocks: [
          { type: 'table', head: ['Technique', 'What it does', 'Good for', 'Watch out for'], rows: [
            ['One-hot encoding', 'One 0/1 column per category', 'Few categories (say under ~50)', 'Thousands of categories create huge sparse tables'],
            ['Ordinal encoding', 'Maps ordered categories to 0, 1, 2…', 'Truly ordered values: size, education level', 'Using it for unordered categories'],
            ['Target (mean) encoding', 'Replaces a category with the average target for it', 'High-cardinality columns like zip code', 'Leaks the target unless computed only on training folds'],
            ['Hashing', 'Hashes categories into a fixed number of columns', 'Huge or open-ended vocabularies', 'Collisions mix unrelated categories'],
            ['Learned embeddings', 'A dense learned vector per category', 'Neural networks with many categories', 'Needs enough data to learn the vectors'],
            ['Binning', 'Turns a number into ranges (age 0–17, 18–34…)', 'Non-linear effects in simple models', 'Throws away detail inside each bin'],
          ] },
        ] },
      ],
    },
    {
      id: 'code',
      title: 'Code: same model, better features',
      blocks: [
        { type: 'p', text: 'We simulate 300 plots whose price depends on **area** and on a **city premium** where Mumbai is the most expensive and Nagpur the cheapest. We keep the model fixed (ordinary linear regression) and only change the features. We train on 200 rows and report the mean absolute error (MAE) on the other 100.' },
        { type: 'code', lang: 'python', title: 'feature_engineering_demo.py', code: `import numpy as np

rng = np.random.default_rng(1)
n = 300
length = rng.uniform(5, 20, n)                  # plot length (m)
width = rng.uniform(5, 20, n)                   # plot width (m)
city = rng.integers(0, 3, n)                    # 0=Pune, 1=Mumbai, 2=Nagpur
premium = np.array([40, 120, 10])[city]         # Mumbai is pricey, not "in between"
price = 0.5 * length * width + premium + rng.normal(0, 8, n)   # in thousands

def test_mae(*cols, n_train=200):
    X = np.column_stack(cols + (np.ones(n),))                # add intercept
    w = np.linalg.lstsq(X[:n_train], price[:n_train], rcond=None)[0]
    return np.abs(X[n_train:] @ w - price[n_train:]).mean()  # test on last 100

# 1) Raw columns: length, width, and the city as a code 0/1/2
print(f"raw: length, width, city code     MAE {test_mae(length, width, city):5.1f}")

# 2) One-hot encode city: 0 < 1 < 2 does not mean anything for cities
one_hot = np.eye(3)[city][:, 1:]                # drop one column (Pune = all zeros)
print(f"length, width, one-hot city       MAE {test_mae(length, width, one_hot):5.1f}")

# 3) Add domain knowledge: price depends on area = length * width
area = length * width
print(f"area, one-hot city                MAE {test_mae(area, one_hot):5.1f}")
print("one-hot rows for Pune, Mumbai, Nagpur:", np.eye(3)[[0, 1, 2]][:, 1:].tolist())`, output: `raw: length, width, city code     MAE  40.8
length, width, one-hot city       MAE   9.2
area, one-hot city                MAE   6.7
one-hot rows for Pune, Mumbai, Nagpur: [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]]`, walkthrough: [
          { lines: [3, 9], note: 'The hidden truth: price = 0.5 × area + a city premium (40, 120 or 10) + noise. The premiums are deliberately not in code order.' },
          { lines: [11, 14], note: 'One fixed model for every experiment: linear regression with an intercept, trained on 200 rows, scored by MAE on 100 unseen rows.' },
          { lines: [16, 17], note: 'Raw features. The city code forces a straight-line effect 0 → 1 → 2, which cannot express "Mumbai high, Nagpur low". Error is large: 40.8.' },
          { lines: [19, 21], note: 'One-hot encoding lets each city have its own premium. Error drops to 9.2.' },
          { lines: [23, 26], note: 'The engineered area feature matches how price really works, so a linear model can now fit it exactly. Error is 6.7, close to the noise floor (the noise alone has an average absolute size of about 6.4).' },
        ] },
        { type: 'chart', kind: 'bar', title: 'Test error as features improve (same model)', yLabel: 'MAE (thousands)', labels: ['Raw columns', '+ one-hot city', '+ area feature'], series: [ { name: 'Test MAE', values: [40.8, 9.2, 6.7] } ], caption: 'Measured by the code above on simulated data. The algorithm never changed; only the features did.' },
      ],
    },
    {
      id: 'feature-learning',
      title: 'Hand-made features vs learned features',
      blocks: [
        { type: 'p', text: 'Deep learning changed the picture. A neural network\'s hidden layers effectively **learn their own features** from raw inputs: early layers of an image model learn edges, later ones learn shapes and objects. An LLM turns raw text into **embeddings**, dense vectors that capture meaning, without anyone designing them by hand (Lesson 3.4). Contrastive learning (Lesson 1.9) is one powerful way to learn such features.' },
        { type: 'compare', title: 'Manual feature engineering vs learned features', options: [
          { name: 'Manual feature engineering', summary: 'People design features using domain knowledge.', pros: ['Works with small datasets', 'Features are interpretable', 'Cheap to train and run'], cons: ['Takes expert time', 'May miss patterns humans do not think of', 'Hard for images, audio, free text'], bestFor: 'Tabular business data: sales, finance, risk, operations' },
          { name: 'Learned features (deep learning)', summary: 'The model learns representations directly from raw data.', pros: ['Finds complex patterns automatically', 'Excellent for images, audio, text', 'Reusable embeddings across tasks'], cons: ['Needs lots of data and compute', 'Features are hard to interpret', 'Can still pick up spurious shortcuts'], bestFor: 'Unstructured data: images, speech, language' },
        ], rows: [
          ['Data needed', 'Small to medium', 'Large'],
          ['Human effort', 'Designing features', 'Designing architecture and collecting data'],
          ['Interpretability', 'High', 'Low'],
        ], verdict: 'They are complementary. Even LLM applications use engineered features: document age, source trust, click counts or user tier for ranking, routing and safety decisions.' },
        { type: 'callout', tone: 'example', title: 'Feature engineering in AI products', text: 'A RAG search system (Module 9) might combine a learned feature (embedding similarity) with engineered ones: how recent the document is, whether the query contains an exact product code, and the document\'s historical click-through rate. A fraud model might add "number of transactions in the last hour" and "distance from the user\'s usual location". These hand-made features are often what makes a production system reliable.' },
      ],
    },
    {
      id: 'scaling-details',
      title: 'Scaling in detail: standardisation vs min-max',
      blocks: [
        { type: 'p', text: 'Scaling is the most common transform, so let us make it concrete with three house sizes: 50, 100 and 150 square metres.' },
        { type: 'table', head: ['Method', 'Formula', '50', '100', '150'], rows: [
          ['Standardisation (z-score)', '(x − mean) / std', '−1.22', '0', '1.22'],
          ['Min-max scaling', '(x − min) / (max − min)', '0', '0.5', '1'],
        ], caption: 'Mean = 100, population standard deviation ≈ 40.8, min = 50, max = 150.' },
        { type: 'p', text: '**When does scaling matter?** For methods that use distances (k-means, k-nearest neighbours), for gradient descent (features on wildly different scales make the loss surface stretched, so training is slow), and for regularised models (Lesson 1.7), where the penalty treats all weights alike. **Tree-based models** (decision trees, random forests, gradient boosting) split on thresholds one feature at a time, so they generally do not need scaling.' },
        { type: 'p', text: 'Standardisation is the usual default. Min-max scaling is useful when we need a fixed 0 to 1 range, but a single extreme outlier squashes all other values close together.' },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and when to stop',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Data leakage: the most dangerous mistake', text: '**Leakage** happens when a feature contains information that would not be available at prediction time, or that comes from the answer itself. Example: predicting whether a customer will cancel using a feature "number of cancellation-survey answers": that only exists after they cancel. Another subtle form: computing the mean and std for scaling over the whole dataset, including the test set. Fit every transform on the training data only, then apply it to validation and test data.' },
        { type: 'list', items: [
          '**Too many features.** Hundreds of weak features can cause overfitting and slow everything down. Prefer a few meaningful ones.',
          '**Train/serve skew.** Computing a feature one way in training (say, in a notebook) and a slightly different way in production silently breaks the model. Share one pipeline.',
          '**High-cardinality one-hot.** One-hot encoding 100,000 user IDs creates a giant, sparse table. Use hashing, target encoding with care, or embeddings.',
          '**Ignoring time.** For time-based problems, features must use only past data. "Average sales this month" cannot be used to predict a day in the middle of that month.',
          '**Over-engineering for deep models.** For images, audio and long text, hand-made features rarely beat good pre-trained models; spend effort on data quality instead.',
        ] },
        { type: 'check', question: 'We standardise a feature using the mean and std of all 10,000 rows, then split into train and test. What is wrong?', answer: 'The test rows influenced the scaling statistics, which is a mild form of data leakage. The correct order is: split first, compute mean and std on the training rows only, then apply those same numbers to the test rows (and later to live data).' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What is feature engineering?',
      options: ["Choosing the fastest GPUs and storage systems for training models", "Creating, transforming and selecting the inputs a model learns from", "Tuning hyperparameters like the learning rate and the batch size", "Designing the user interface that shows model predictions"],
      answer: 1,
      explain: 'Feature engineering is about the inputs: cleaning, encoding, scaling, creating and selecting features. Hardware and hyperparameters are separate concerns.',
    },
    {
      q: 'Our linear model predicts house prices with a "city" column coded 0, 1, 2, and errors are large. The city premiums are not in that order. What should we change first?',
      options: ["Train it on a bigger GPU so it can fit the data better", "Multiply the city code by 10 to make its effect stronger", "One-hot encode the city so each city gets its own weight", "Remove the intercept so the city code carries more weight"],
      answer: 2,
      explain: 'A numeric code forces an ordered, evenly spaced effect. One-hot encoding lets each city have an independent effect; in our code it cut the error from 40.8 to 9.2.',
    },
    {
      q: 'Three sizes are 50, 100 and 150. After min-max scaling, what is the value for 100?',
      options: ['0.5', '0', '1.22', '100'],
      answer: 0,
      explain: '(100 − 50) / (150 − 50) = 50 / 100 = 0.5. The value 0 is what standardisation gives for 100 (it equals the mean), and 1.22 is the standardised value of 150.',
    },
    {
      q: 'Which statement correctly contrasts manual feature engineering with learned features?',
      options: ["Learned features always need far less data than hand-made features do", "Manual features suit small tabular data; learned ones need more data", "Manual features only work for images, audio and other media", "The two kinds of features can never be combined in one system"],
      answer: 1,
      explain: 'Hand-made features are cheap and interpretable for tabular data; deep models learn features from raw unstructured data but need lots of data and compute. Production systems often mix both.',
    },
    {
      q: 'A teammate scales features using the mean and standard deviation of the full dataset, then splits off the test set. They say this is fine because "scaling does not use the labels". What is the problem?',
      options: ["No problem: only label information can leak into a model", "Scaling should never be used together with linear models", "Test rows shaped the scaling statistics; fit on training data only", "They should have scaled the labels instead of the features"],
      answer: 2,
      explain: 'Leakage is any information from evaluation data flowing into training, not only labels. Fit scalers, encoders and imputers on training data, then apply them unchanged to test and live data.',
    },
  ],
  takeaways: [
    'A model only sees the features we give it; good features can matter more than the algorithm.',
    'Core steps: handle missing values, encode categories, scale numbers, transform skew, create and select features.',
    'One-hot encode unordered categories; use ordinal codes only for truly ordered ones.',
    'Fit every transform on training data only and reuse the same pipeline at prediction time to avoid leakage and skew.',
    'Deep learning learns features from raw data, but engineered features still power ranking, fraud and routing in AI products.',
  ],
  terms: [
    { term: 'Feature', def: 'A measurable input variable given to a model.' },
    { term: 'Feature engineering', def: 'Creating, transforming and selecting features so a model can learn the pattern more easily.' },
    { term: 'One-hot encoding', def: 'Representing a category as a set of 0/1 columns with a single 1 marking the category.' },
    { term: 'Standardisation', def: 'Rescaling a feature to mean 0 and standard deviation 1 with z = (x − mean) / std.' },
    { term: 'Imputation', def: 'Filling in missing values with a substitute such as the median or a special category.' },
    { term: 'Data leakage', def: 'When training uses information that would not be available at prediction time, giving falsely good results.' },
  ],
};
