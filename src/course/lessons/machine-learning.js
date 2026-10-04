export default {
  id: 'machine-learning',
  minutes: 17,
  hook: 'How can a program get good at a task that nobody ever wrote the rules for, like spotting spam or pricing a house?',
  summary: 'Machine learning is a way of building software where, instead of writing rules by hand, we show the computer many examples and let an algorithm adjust a model\'s numbers until its predictions match the examples. Training is a loop: predict, measure the error with a loss, nudge the parameters to reduce it, repeat. The real test is how well the model does on new data it has never seen.',
  sections: [
    {
      id: 'why-ml',
      title: 'Why we need machine learning',
      blocks: [
        { type: 'p', text: 'Traditional programming works like a recipe: a programmer writes exact rules, the computer follows them. That is perfect for things like calculating tax or sorting a list, where we know the rules precisely.' },
        { type: 'p', text: 'But try writing rules for "is this email spam?" We might start with "if it contains *free money*, mark spam". Spammers then write "fr3e m0ney". We add more rules, they adapt, and soon we have thousands of brittle rules that still miss things. The same problem appears with recognising faces, understanding speech, or predicting house prices: the patterns are real, but too many and too subtle to write down.' },
        { type: 'callout', tone: 'analogy', title: 'Teaching a child to recognise dogs', text: 'We never give a child a rulebook like "four legs, fur, tail, barks". We just point at many dogs and say "dog", and at cats and say "not a dog". After enough examples, the child recognises dogs they have never seen before, even odd-looking ones. Machine learning works the same way: learn from examples, then generalise to new cases.' },
        { type: 'p', text: '**Machine learning (ML)** is the field of building programs that improve at a task by learning from data rather than from hand-written rules. A classic, often-quoted definition from Tom Mitchell (1997) says a program learns from experience **E** with respect to a task **T** and performance measure **P** if its performance on T, measured by P, improves with E. For a spam filter: T = classify emails, P = percent classified correctly, E = a pile of emails already labelled spam or not spam.' },
      ],
    },
    {
      id: 'rules-vs-learning',
      title: 'The core idea: data in, rules out',
      blocks: [
        { type: 'p', text: 'The cleanest way to see the shift is to compare what goes in and what comes out.' },
        { type: 'compare', title: 'Traditional programming vs machine learning', options: [
          { name: 'Traditional programming', summary: 'Humans write the rules; the computer applies them to data to produce answers.', pros: ['Fully predictable and explainable', 'No data needed', 'Exact when the rules are known'], cons: ['Breaks on messy, fuzzy problems', 'Rules must be updated by hand'], bestFor: 'Accounting, sorting, business logic with clear rules' },
          { name: 'Machine learning', summary: 'Humans provide data and answers (examples); the algorithm produces the rules (a model).', pros: ['Handles patterns too complex to write down', 'Improves with more data', 'Can adapt by retraining'], cons: ['Needs lots of good data', 'Can be wrong in surprising ways', 'Harder to explain'], bestFor: 'Vision, speech, language, recommendations, forecasting' },
        ], rows: [
          ['Input', 'Rules + data', 'Data + example answers'],
          ['Output', 'Answers', 'A model (learned rules)'],
          ['When the world changes', 'Rewrite the code', 'Retrain on new data'],
        ], verdict: 'Use plain code when you can write the rules; use ML when you can collect examples more easily than you can write rules.' },
        { type: 'p', text: 'Let us define the vocabulary we will use for the rest of the course, using a running example: predicting a house\'s price.' },
        { type: 'list', items: [
          '**Example (or sample):** one row of data, such as one house.',
          '**Feature:** an input measurement describing the example, such as size in square feet or number of bedrooms.',
          '**Label (or target):** the answer we want to predict, such as the sale price.',
          '**Model:** a mathematical function that maps features to a prediction, for example `price = w × size + b`.',
          '**Parameters (weights):** the adjustable numbers inside the model, here `w` and `b`. Learning means finding good values for them.',
          '**Training:** the process of adjusting parameters using example data.',
          '**Inference (prediction):** using the trained model on new inputs.',
        ] },
      ],
    },
    {
      id: 'kinds-of-ml',
      title: 'The main kinds of machine learning',
      blocks: [
        { type: 'p', text: 'ML methods are grouped by what kind of feedback the learner gets. We meet each in detail later in this module.' },
        { type: 'table', head: ['Kind', 'What the data looks like', 'Example task'], rows: [
          ['Supervised learning', 'Inputs paired with correct answers (labels)', 'Predict house price; classify email as spam'],
          ['Unsupervised learning', 'Inputs only, no answers', 'Group customers into segments; detect unusual transactions'],
          ['Reinforcement learning', 'An agent acts and receives rewards or penalties', 'Learn to play a game; control a robot'],
          ['Self-supervised learning', 'Labels are created automatically from the data itself', 'Predict the next word in a sentence (how LLMs are pre-trained)'],
        ] },
        { type: 'p', text: 'Supervised tasks are further split by the type of label. **Regression** predicts a number (a price, a temperature). **Classification** predicts a category (spam or not spam, cat or dog). Lesson 1.3 contrasts the simplest model for each.' },
        { type: 'callout', tone: 'note', title: 'AI, ML, deep learning and LLMs', text: 'These terms nest inside each other. **Artificial intelligence** is the broad goal of machines doing tasks that seem to need intelligence (it also includes non-learning methods like search and rule systems). **Machine learning** is the part of AI that learns from data. **Deep learning** is ML using neural networks with many layers (Module 2). **LLMs** are very large deep learning models trained on text (Module 3).' },
      ],
    },
    {
      id: 'how-training-works',
      title: 'How a model learns, step by step',
      blocks: [
        { type: 'p', text: 'Almost every ML model, from a two-parameter line to a giant LLM, learns with the same loop.' },
        { type: 'flow', title: 'The training loop', loop: true, nodes: [
          { label: 'Predict', detail: 'Feed training examples through the model with its current parameters to get predictions.' },
          { label: 'Measure loss', detail: 'A loss function turns "how wrong were we?" into one number. Mean squared error is a common choice for numbers.' },
          { label: 'Compute direction', detail: 'Work out how each parameter should change to lower the loss (the gradient).' },
          { label: 'Update', detail: 'Nudge each parameter a small step in that direction. The step size is the learning rate.' },
        ] },
        { type: 'steps', title: 'One training step on a tiny example', items: [
          { title: 'Start with a guess', text: 'Our model is `price = w × size + b`, with size in hundreds of square feet and price in thousands of dollars. We start with `w = 0`, `b = 0`.' },
          { title: 'Predict', text: 'For a house of size 10 (1,000 sq ft) that sold for 250, we predict 0 × 10 + 0 = 0.' },
          { title: 'Measure', text: 'The error is 0 − 250 = −250. Squared, that is 62,500. A huge loss: our guess is terrible.' },
          { title: 'Find the direction', text: 'The prediction is too low, and `w` multiplies a positive size, so increasing `w` (and `b`) would raise the prediction and reduce the error.' },
          { title: 'Update', text: 'Increase `w` and `b` by a small amount proportional to the error. Repeat over all houses, thousands of times, and the line settles where the total error is smallest.' },
        ] },
        { type: 'p', text: 'This downhill-walking procedure is called **gradient descent**. The **learning rate** controls the step size: too small and learning crawls, too large and it overshoots and can diverge. Try it below; Lesson 2.2 covers it in depth.' },
        { type: 'viz', name: 'gradient-descent', caption: 'Change the learning rate and step the ball down the loss curve. Notice the slow, good, overshooting and diverging regimes.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: learning house prices from examples',
      blocks: [
        { type: 'p', text: 'We generate 50 houses from a hidden rule (price = 20 × size + 50, plus random noise) and pretend we do not know that rule. The model sees only the examples and must discover it. We keep 10 houses aside to test it.' },
        { type: 'code', lang: 'python', title: 'learn_house_prices.py', code: `import numpy as np

# Training data: house size (100s of sq ft) -> price ($1000s)
rng = np.random.default_rng(42)
size = rng.uniform(5, 30, 50)                      # 50 houses
price = 20 * size + 50 + rng.normal(0, 25, 50)     # hidden rule + noise

# Split: learn from 40 houses, test on 10 the model never saw
x_tr, y_tr, x_te, y_te = size[:40], price[:40], size[40:], price[40:]

w, b, lr = 0.0, 0.0, 0.002                         # start knowing nothing
for epoch in range(20001):
    pred = w * x_tr + b                            # 1. predict
    err = pred - y_tr                              # 2. measure error
    loss = (err ** 2).mean()                       #    mean squared error
    w -= lr * 2 * (err * x_tr).mean()              # 3. nudge w and b
    b -= lr * 2 * err.mean()                       #    downhill on the loss
    if epoch in (0, 10, 1000, 20000):
        print(f"epoch {epoch:4d}  loss {loss:9.1f}  w={w:6.2f}  b={b:6.2f}")

test_mae = np.abs(w * x_te + b - y_te).mean()
print(f"learned rule: price = {w:.1f} * size + {b:.1f}")
print(f"average error on 10 unseen houses: \${test_mae:.1f}k")
print(f"prediction for a 2,000 sq ft house: \${w * 20 + b:.0f}k")`, output: `epoch    0  loss  192172.1  w= 34.45  b=  1.66
epoch   10  loss     639.6  w= 22.21  b=  1.33
epoch 1000  loss     437.1  w= 21.24  b= 21.04
epoch 20000  loss     327.2  w= 19.87  b= 49.92
learned rule: price = 19.9 * size + 49.9
average error on 10 unseen houses: $18.6k
prediction for a 2,000 sq ft house: $447k`, walkthrough: [
          { lines: [3, 6], note: 'Create 50 houses. The "true" rule is hidden inside the data, blurred by random noise, just like real prices.' },
          { lines: [8, 9], note: 'Hold out 10 houses as a test set. We judge the model on these, because doing well on data you trained on proves little.' },
          { lines: [11, 11], note: 'Parameters start at zero. The learning rate 0.002 is the step size.' },
          { lines: [12, 17], note: 'The training loop: predict, compute errors and mean squared error, then move w and b against the gradient of the loss.' },
          { lines: [18, 19], note: 'Print progress. The loss printed is before that step\'s update. It falls from 192,172 to about 327. What is left is the random noise we added: no line can predict it. (On this particular sample the noise happens to be smaller than its average of 25² = 625.)' },
          { lines: [21, 24], note: 'Evaluate on unseen houses and make a new prediction. The learned rule (19.9, 49.9) is very close to the hidden one (20, 50).' },
        ] },
        { type: 'check', question: 'Why is the average test error about $18.6k and not zero, even though the model found almost exactly the true rule?', answer: 'Because the prices include random noise (standard deviation 25) that no rule based on size alone can predict. Real data always has factors the features do not capture, so some error is irreducible.' },
      ],
    },
    {
      id: 'generalisation',
      title: 'The real goal: generalising to new data',
      blocks: [
        { type: 'p', text: 'A model is only useful if it works on data it has never seen. This ability is called **generalisation**. To measure it honestly, we split our data: a **training set** to learn from, a **validation set** to tune choices like the learning rate, and a **test set** that we only look at at the very end.' },
        { type: 'p', text: 'Two failure modes appear again and again. **Underfitting**: the model is too simple to capture the pattern (a straight line for a curved relationship), so it does badly on both training and test data. **Overfitting**: the model is so flexible that it memorises the training examples, including their noise, so it looks great on training data and does badly on new data. Lesson 1.7 shows how regularisation fights overfitting.' },
        { type: 'chart', kind: 'line', title: 'Error vs model complexity', xLabel: 'Model complexity', yLabel: 'Error', series: [
          { name: 'Training error', points: [[1, 9], [2, 6], [3, 4], [4, 3], [5, 2.2], [6, 1.6], [7, 1.1], [8, 0.7]] },
          { name: 'Test error', points: [[1, 9.5], [2, 6.8], [3, 5], [4, 4.4], [5, 4.6], [6, 5.4], [7, 6.5], [8, 7.8]] },
        ], caption: 'Illustrative curves. Training error keeps falling as the model gets more flexible, but test error has a sweet spot. Left of it is underfitting, right of it is overfitting.' },
        { type: 'callout', tone: 'warn', title: 'The most common beginner mistake', text: 'Evaluating on the same data used for training, or letting test data leak into training (for example, normalising using statistics from the whole dataset, or having duplicate rows in both splits). This gives impressive numbers that collapse in production.' },
      ],
    },
    {
      id: 'history',
      title: 'A short history',
      blocks: [
        { type: 'timeline', title: 'Milestones on the road to modern AI', items: [
          { when: '1959', title: 'The term "machine learning"', text: 'Arthur Samuel popularises the term while building a checkers program that improved by playing against itself.' },
          { when: '1986', title: 'Backpropagation popularised', text: 'Rumelhart, Hinton and Williams show how to train multi-layer neural networks efficiently (Lesson 2.3).' },
          { when: '1990s–2000s', title: 'Statistical ML', text: 'Methods like support vector machines, decision trees and random forests power spam filters, search and recommendations.' },
          { when: '2012', title: 'Deep learning breakthrough', text: 'AlexNet, a deep convolutional network trained on GPUs, wins the ImageNet image-recognition challenge by a wide margin.' },
          { when: '2017', title: 'The Transformer', text: 'The architecture behind modern LLMs is introduced in "Attention Is All You Need" (Module 3).' },
          { when: '2022 onward', title: 'LLMs go mainstream', text: 'ChatGPT and similar assistants bring large language models to hundreds of millions of users.' },
        ] },
      ],
    },
    {
      id: 'real-world',
      title: 'Where ML is used, and when not to use it',
      blocks: [
        { type: 'callout', tone: 'example', title: 'ML you used today', text: 'Email spam filters, product and video recommendations, card fraud alerts, voice assistants, photo search ("show me beach pictures"), map arrival-time estimates, machine translation, and of course AI chat assistants all rely on machine learning.' },
        { type: 'p', text: 'A typical ML project follows a lifecycle: define the problem and the success metric, collect and clean data, engineer features (Lesson 1.4), train a model, evaluate on held-out data, deploy, and then monitor, because the world changes and models drift out of date.' },
        { type: 'list', items: [
          '**Do not use ML when simple rules work.** A shipping-cost calculator should be code, not a model.',
          '**Do not use ML without enough representative data.** A model can only learn patterns present in its examples.',
          '**Be careful when errors are costly and must be explained** (some legal or medical decisions); prefer simpler, interpretable models or keep a human in the loop.',
          '**Watch for bias in data.** If historical decisions were unfair, a model trained on them learns the same unfairness.',
        ] },
        { type: 'check', question: 'A bank wants to compute monthly loan interest from a fixed published formula. Should it use machine learning?', answer: 'No. The rule is known exactly, so ordinary code is simpler, exact, and explainable. ML is for patterns we cannot write down, such as predicting which loans are likely to default.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What is the key difference between traditional programming and machine learning?',
      options: ["ML learns the rules from examples; traditional code has rules written by people", "ML programs always run faster than traditionally written programs do", "Traditional programs cannot read or process any data at all", "ML models never make mistakes once they have been trained well"],
      answer: 0,
      explain: 'Traditional programming: rules + data → answers. Machine learning: data + answers → rules (a model). ML is not inherently faster, and it certainly can make mistakes.',
    },
    {
      q: 'Our model scores 99% accuracy on the training data but only 60% on new customer data. What is most likely happening?',
      options: ["Underfitting: the model is too simple to capture the pattern", "The learning rate is far too small, so the model has barely trained at all", "Overfitting: it memorised training data instead of general patterns", "Data leakage made the test data far too easy for the model"],
      answer: 2,
      explain: 'A big gap between excellent training performance and poor performance on new data is the signature of overfitting. Underfitting would show poor performance on both.',
    },
    {
      q: 'In the house-price code, the model starts at w = 0, b = 0 and ends near w = 19.9, b = 49.9. What does each training step do to w and b?',
      options: ["Replaces them with new random values on every step", "Moves them a small step in the direction that lowers the loss", "Copies their values from the test set examples each epoch", "Doubles them each step until the loss value stops changing at all"],
      answer: 1,
      explain: 'Each step computes the gradient of the loss and moves the parameters a small step (learning rate × gradient) downhill. That is gradient descent.',
    },
    {
      q: 'Which pairing of task and type of machine learning is correct?',
      options: ["Grouping customers into segments without labels → supervised", "Predicting the next word from raw web text → reinforcement learning", "Predicting a house price from past sales → supervised regression", "Teaching a robot to walk using rewards → unsupervised learning"],
      answer: 2,
      explain: 'House price with known past prices is supervised regression. Segmentation without labels is unsupervised, next-word prediction is self-supervised, and learning from rewards is reinforcement learning.',
    },
    {
      q: 'A teammate says: "Our model gets a tiny error on the data we trained it on, so it is ready for production." What is wrong with this reasoning?',
      options: ["Nothing: low training error guarantees good real-world results", "Training error must be exactly zero before any model is deployed", "Production models should be trained without any loss function", "Training error says little; we must test on unseen held-out data"],
      answer: 3,
      explain: 'A model can memorise its training data. Only performance on unseen data (a held-out test set) tells us whether it generalises.',
    },
  ],
  takeaways: [
    'Machine learning builds models from examples instead of hand-written rules.',
    'Features are the inputs, labels are the answers, parameters are the numbers the model learns.',
    'Training is a loop: predict, measure loss, compute the gradient, update parameters, repeat.',
    'The goal is generalisation: always evaluate on data the model has never seen.',
    'Underfitting means too simple; overfitting means memorising noise.',
    'Use plain code when the rules are known; use ML when examples are easier to get than rules.',
  ],
  terms: [
    { term: 'Machine learning', def: 'Building programs that improve at a task by learning patterns from data rather than following hand-written rules.' },
    { term: 'Feature', def: 'An input variable that describes an example, such as a house\'s size.' },
    { term: 'Label', def: 'The correct answer for an example that a supervised model learns to predict.' },
    { term: 'Parameters', def: 'The adjustable numbers inside a model that training sets, such as weights and biases.' },
    { term: 'Loss function', def: 'A formula that turns the model\'s errors into a single number to minimise.' },
    { term: 'Generalisation', def: 'How well a trained model performs on new data it has not seen.' },
    { term: 'Overfitting', def: 'When a model learns the training data, including its noise, too closely and does worse on new data.' },
  ],
};
